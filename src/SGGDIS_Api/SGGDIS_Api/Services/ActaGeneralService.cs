using Microsoft.EntityFrameworkCore;
using SGGDIS_Api.Data;
using SGGDIS_Api.Models;
using SGGDIS_Api.Models.Dtos;

namespace SGGDIS_Api.Services
{
    // Se lanza si los datos del Apartado IV no se pueden guardar tal como
    // vienen (una guía que no existe en INS_GUIA, o hallazgos demasiado largos).
    public class HallazgosInvalidosException : Exception
    {
        public HallazgosInvalidosException(string mensaje) : base(mensaje) { }
    }

    // Se lanza si los datos del Apartado V no se pueden guardar tal como
    // vienen (un código de acción desconocido, o textos demasiado largos).
    public class AccionesInvalidasException : Exception
    {
        public AccionesInvalidasException(string mensaje) : base(mensaje) { }
    }

    /// <summary>
    /// Implementación de IActaGeneralService. El folio (NumeroActa) se genera
    /// a partir del año actual y el id autonumérico, por eso el acta se debe
    /// insertar primero (para tener el id) y recién después se le pone el folio.
    /// </summary>
    public class ActaGeneralService : IActaGeneralService
    {
        // Mismo tamaño que la columna HALLAZGOS VARCHAR2(4000).
        private const int LongitudMaximaHallazgos = 4000;

        // Códigos válidos del Apartado V, en el mismo orden que ACCIONES_A_SEGUIR
        // (frontend) y que el CHECK CK_ACTA_GENERAL_ACCIONES de la base de datos.
        private static readonly string[] AccionesValidas =
        {
            "CIERRE_CASO", "ORDEN_SANITARIA", "RETENCION", "APOYO_TECNICO", "DECOMISO", "CLAUSURA",
            "INFORME_TECNICO", "INFORME_SANITARIO_TABACO", "RETIRO_PSF", "REPROGRAMACION", "OTRO",
        };

        // Mismos tamaños que las columnas MOTIVO_REPROGRAMACION y ACCION_OTRO.
        private const int LongitudMaximaMotivoReprogramacion = 400;
        private const int LongitudMaximaAccionOtro = 200;

        private readonly SggdisDbContext _context;
        private readonly ILogger<ActaGeneralService> _logger;

        public ActaGeneralService(SggdisDbContext context, ILogger<ActaGeneralService> logger)
        {
            _context = context;
            _logger = logger;
        }

        public async Task<ActaGeneralCreadaDto> CrearActaAsync()
        {
            var acta = new InsActaGeneral
            {
                // Folio temporal único para pasar la restricción NOT NULL/UNIQUE;
                // se reemplaza por el folio real justo abajo, ya con el id asignado.
                NumeroActa = Guid.NewGuid().ToString("N")[..12],
                Estado = "EN_PROCESO",
                FechaCreacion = DateTime.Now,
            };

            _context.ActasGenerales.Add(acta);
            await _context.SaveChangesAsync();

            acta.NumeroActa = $"{DateTime.Now.Year}-{acta.IdActa:D5}";
            await _context.SaveChangesAsync();

            _logger.LogInformation("Acta general {NumeroActa} creada (id={IdActa}).", acta.NumeroActa, acta.IdActa);

            return new ActaGeneralCreadaDto
            {
                IdActa = acta.IdActa,
                NumeroActa = acta.NumeroActa,
            };
        }

        public async Task GuardarInfoGeneralAsync(int idActa, InfoGeneralActaDto dto)
        {
            var acta = await _context.ActasGenerales.FindAsync(idActa)
                ?? throw new KeyNotFoundException("El acta no existe.");

            acta.FechaInspeccion = dto.FechaInspeccion;
            acta.HoraInicio = dto.HoraInicio;
            acta.NumeroExpediente = LimpiarOpcional(dto.NumeroExpediente);
            acta.NumeroDenuncia = LimpiarOpcional(dto.NumeroDenuncia);
            acta.NombreComercial = LimpiarOpcional(dto.NombreComercial);
            acta.Provincia = LimpiarOpcional(dto.Provincia);
            acta.Canton = LimpiarOpcional(dto.Canton);
            acta.Distrito = LimpiarOpcional(dto.Distrito);
            acta.DireccionExacta = LimpiarOpcional(dto.DireccionExacta);
            acta.TelefonoContacto = LimpiarOpcional(dto.TelefonoContacto);
            acta.CorreoNotificaciones = LimpiarOpcional(dto.CorreoNotificaciones);
            acta.AutorizaIngreso = ConvertirBooleanoSN(dto.AutorizaIngreso);
            acta.AutorizaFotos = ConvertirBooleanoSN(dto.AutorizaFotos);

            await _context.SaveChangesAsync();
        }

        public async Task GuardarResponsableAsync(int idActa, InfoResponsableActaDto dto)
        {
            var acta = await _context.ActasGenerales.FindAsync(idActa)
                ?? throw new KeyNotFoundException("El acta no existe.");

            acta.NombreResponsable = LimpiarOpcional(dto.NombreResponsable);
            acta.CargoResponsable = LimpiarOpcional(dto.CargoResponsable);
            // El detalle libre de "Otro" solo tiene sentido si ese fue el cargo elegido;
            // si el cargo es otro, se descarta para no dejar basura de una elección anterior.
            acta.CargoResponsableOtro = acta.CargoResponsable == "OTRO"
                ? LimpiarOpcional(dto.CargoResponsableOtro)
                : null;
            acta.NumeroIdentificacionResponsable = LimpiarOpcional(dto.NumeroIdentificacionResponsable);

            await _context.SaveChangesAsync();
        }

        public async Task GuardarMotivoAsync(int idActa, InfoMotivoActaDto dto)
        {
            var acta = await _context.ActasGenerales.FindAsync(idActa)
                ?? throw new KeyNotFoundException("El acta no existe.");

            acta.MotivoInspeccion = LimpiarOpcional(dto.MotivoInspeccion);
            // Igual que con el cargo del responsable: el detalle de "Otro" solo
            // se conserva si ese es el motivo elegido.
            acta.MotivoInspeccionOtro = acta.MotivoInspeccion == "OTRO"
                ? LimpiarOpcional(dto.MotivoInspeccionOtro)
                : null;

            await _context.SaveChangesAsync();
        }

        public async Task GuardarHallazgosAsync(int idActa, InfoHallazgosActaDto dto)
        {
            var acta = await _context.ActasGenerales.FindAsync(idActa)
                ?? throw new KeyNotFoundException("El acta no existe.");

            // Sin repetidos y ordenados, para que la misma selección siempre
            // quede guardada igual ("1,3" y no "3,1,3").
            var idsGuias = (dto.IdsGuias ?? new List<int>())
                .Distinct()
                .OrderBy(id => id)
                .ToList();

            if (idsGuias.Count > 0)
            {
                // GUIAS_APLICABLES no puede tener FK (es una lista), así que se
                // valida acá que cada id exista en el catálogo INS_GUIA.
                var existentes = await _context.Guias
                    .Where(guia => idsGuias.Contains(guia.IdGuia))
                    .CountAsync();

                if (existentes != idsGuias.Count)
                {
                    throw new HallazgosInvalidosException("Alguna de las guías seleccionadas no existe.");
                }
            }

            var hallazgos = LimpiarOpcional(dto.Hallazgos);
            if (hallazgos is not null && hallazgos.Length > LongitudMaximaHallazgos)
            {
                throw new HallazgosInvalidosException(
                    $"La descripción de los hallazgos no puede superar los {LongitudMaximaHallazgos} caracteres.");
            }

            acta.GuiasAplicables = idsGuias.Count > 0 ? string.Join(",", idsGuias) : null;
            acta.Hallazgos = hallazgos;

            await _context.SaveChangesAsync();
        }

        public async Task GuardarAccionesAsync(int idActa, InfoAccionesActaDto dto)
        {
            var acta = await _context.ActasGenerales.FindAsync(idActa)
                ?? throw new KeyNotFoundException("El acta no existe.");

            var acciones = (dto.Acciones ?? new List<string>())
                .Select(accion => accion?.Trim() ?? string.Empty)
                .Distinct()
                .ToList();

            if (acciones.Any(accion => !AccionesValidas.Contains(accion)))
            {
                throw new AccionesInvalidasException("Alguna de las acciones seleccionadas no es válida.");
            }

            // Igual que el detalle de "Otro" en cargo y motivo: cada texto solo se
            // conserva si su acción está seleccionada, para no dejar basura de una
            // selección anterior.
            var motivoReprogramacion = acciones.Contains("REPROGRAMACION")
                ? LimpiarOpcional(dto.MotivoReprogramacion)
                : null;
            var accionOtro = acciones.Contains("OTRO")
                ? LimpiarOpcional(dto.AccionOtro)
                : null;

            if (motivoReprogramacion is not null && motivoReprogramacion.Length > LongitudMaximaMotivoReprogramacion)
            {
                throw new AccionesInvalidasException(
                    $"El motivo de la reprogramación no puede superar los {LongitudMaximaMotivoReprogramacion} caracteres.");
            }

            if (accionOtro is not null && accionOtro.Length > LongitudMaximaAccionOtro)
            {
                throw new AccionesInvalidasException(
                    $"La descripción de la otra acción no puede superar los {LongitudMaximaAccionOtro} caracteres.");
            }

            // Se guardan en el orden del catálogo, para que la misma selección
            // siempre quede igual sin importar en qué orden se marcó.
            var accionesOrdenadas = AccionesValidas.Where(acciones.Contains).ToList();

            acta.AccionesSeguir = accionesOrdenadas.Count > 0 ? string.Join(",", accionesOrdenadas) : null;
            acta.MotivoReprogramacion = motivoReprogramacion;
            acta.AccionOtro = accionOtro;

            await _context.SaveChangesAsync();
        }

        public async Task<InsActaGeneral?> ObtenerActaAsync(int idActa)
        {
            return await _context.ActasGenerales
                .FirstOrDefaultAsync(a => a.IdActa == idActa);
        }

        // El acta no tiene tablas hijas todavía (a diferencia de Inspección con
        // sus Respuestas), así que por ahora alcanza con borrar la fila.
        public async Task<bool> EliminarActaAsync(int idActa)
        {
            var acta = await _context.ActasGenerales.FindAsync(idActa);
            if (acta is null)
            {
                return false;
            }

            _context.ActasGenerales.Remove(acta);
            await _context.SaveChangesAsync();
            return true;
        }

        // Convierte "" en null para no guardar cadenas vacías en campos opcionales.
        private static string? LimpiarOpcional(string? valor) =>
            string.IsNullOrWhiteSpace(valor) ? null : valor.Trim();

        private static string? ConvertirBooleanoSN(bool? valor) =>
            valor is null ? null : (valor.Value ? "S" : "N");
    }
}
