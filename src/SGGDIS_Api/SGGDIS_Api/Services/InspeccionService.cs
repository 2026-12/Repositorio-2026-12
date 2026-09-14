using Microsoft.EntityFrameworkCore;
using SGGDIS_Api.Data;
using SGGDIS_Api.Models;
using SGGDIS_Api.Models.Dtos;

namespace SGGDIS_Api.Services
{
    // Se lanza cuando se intenta crear una inspección con un número consecutivo (folio)
    // que ya existe; el consecutivo debe ser único.
    public class ConsecutivoDuplicadoException : Exception
    {
        public ConsecutivoDuplicadoException() : base("El número consecutivo ya está registrado.") { }
    }

    // Excepciones propias del cierre de inspección.

    // Se lanza al intentar cerrar una inspección que todavía tiene ítems obligatorios sin responder.
    public class SeccionesIncompletasException : Exception
    {
        public SeccionesIncompletasException()
            : base("No se puede cerrar la inspección: hay secciones obligatorias sin completar.") { }
    }

    // Se lanza al intentar cerrar una inspección sin los datos mínimos requeridos
    // (nombre/identificación del inspector e identificación del representante).
    public class CamposCierreIncompletosException : Exception
    {
        public CamposCierreIncompletosException()
            : base("Los datos del inspector y la identificación del representante son obligatorios para cerrar la inspección.") { }
    }

    /// <summary>
    /// Implementación de IInspeccionService: contiene toda la lógica real para
    /// crear, guardar, consultar y cerrar una inspección, hablando directamente
    /// con la base de datos a través del DbContext.
    /// </summary>
    public class InspeccionService : IInspeccionService
    {
        private readonly SggdisDbContext _context;
        private readonly ILogger<InspeccionService> _logger;

        // Recibe el DbContext y el logger (para registrar eventos importantes) por inyección de dependencias.
        public InspeccionService(SggdisDbContext context, ILogger<InspeccionService> logger)
        {
            _context = context;
            _logger = logger;
        }

        // Crea una nueva inspección en estado "EN_PROCESO", validando primero que
        // el número consecutivo no esté repetido.
        public async Task<InsInspeccion> CrearInspeccionAsync(CrearInspeccionDto dto)
        {
            var consecutivoExiste = await _context.Inspecciones
                .AnyAsync(inspeccion => inspeccion.Consecutivo == dto.Consecutivo);
            if (consecutivoExiste)
            {
                throw new ConsecutivoDuplicadoException();
            }

            var inspeccion = new InsInspeccion
            {
                IdGuia = dto.IdGuia,
                IdTipoEstablecimiento = dto.IdTipoEstablecimiento,
                NombreEstablecimiento = dto.NombreEstablecimiento,
                Consecutivo = dto.Consecutivo,
                Fecha = dto.Fecha,
                Estado = "EN_PROCESO"
            };
            _context.Inspecciones.Add(inspeccion);
            await _context.SaveChangesAsync();
            return inspeccion;
        }

        // Elimina una inspección junto con todas sus respuestas. Devuelve false si
        // la inspección no existía (no lanza error en ese caso).
        public async Task<bool> EliminarInspeccionAsync(int idInspeccion)
        {
            var inspeccion = await _context.Inspecciones.FindAsync(idInspeccion);
            if (inspeccion is null)
            {
                return false;
            }

            var respuestas = await _context.Respuestas
                .Where(respuesta => respuesta.IdInspeccion == idInspeccion)
                .ToListAsync();
            _context.Respuestas.RemoveRange(respuestas);
            _context.Inspecciones.Remove(inspeccion);
            await _context.SaveChangesAsync();
            return true;
        }

        // Guarda las respuestas que llegan del formulario. Si el ítem ya tenía una
        // respuesta guardada, la actualiza; si no, crea una nueva. Esto es lo que
        // permite el autoguardado: se puede llamar varias veces sin duplicar filas.
        public async Task GuardarRespuestasAsync(int idInspeccion, List<RespuestaDto> respuestas)
        {
            if (respuestas == null || respuestas.Count == 0) return;

            var idsItems = respuestas.Select(r => r.IdItem).ToList();

            var existentes = await _context.Respuestas
                .Where(x => x.IdInspeccion == idInspeccion && idsItems.Contains(x.IdItem))
                .ToDictionaryAsync(x => x.IdItem);

            foreach (var r in respuestas)
            {
                if (existentes.TryGetValue(r.IdItem, out var entidad))
                {
                    entidad.Estado = r.Estado;
                    entidad.PuntosOtorgados = r.PuntosOtorgados;
                }
                else
                {
                    _context.Respuestas.Add(new InsRespuesta
                    {
                        IdInspeccion = idInspeccion,
                        IdItem = r.IdItem,
                        Estado = r.Estado,
                        PuntosOtorgados = r.PuntosOtorgados
                    });
                }
            }

            await _context.SaveChangesAsync();
        }

        // Devuelve todas las respuestas ya guardadas de una inspección (para
        // restaurar el formulario cuando el usuario vuelve a entrar).
        public async Task<List<InsRespuesta>> ObtenerRespuestasAsync(int idInspeccion)
        {
            return await _context.Respuestas
                .Where(r => r.IdInspeccion == idInspeccion)
                .ToListAsync();
        }


                /// HU-005I (corrige H1 y H5): valida los campos obligatorios de cierre y que
        /// todos los ítems estén respondidos; calcula el puntaje obtenido y el
        /// máximo REALMENTE aplicable (el fijo del tipo de establecimiento, menos
        /// los puntos de los ítems marcados "N/A", ya que un ítem que no aplica no
        /// debe contar como falta ni exigirse para el 100%); clasifica y persiste
        /// todo en INS_INSPECCION junto con el cambio de estado a FINALIZADA.
        public async Task<ResumenCierreDto> CerrarInspeccionAsync(int idInspeccion, CerrarInspeccionDto dto)
        {
            if (string.IsNullOrWhiteSpace(dto.NombreInspector) ||
                string.IsNullOrWhiteSpace(dto.IdentificacionInspector) ||
                string.IsNullOrWhiteSpace(dto.IdentificacionRepresentante))
            {
                throw new CamposCierreIncompletosException();
            }

            var inspeccion = await _context.Inspecciones
                .Include(i => i.TipoEstablecimiento)
                .FirstOrDefaultAsync(i => i.IdInspeccion == idInspeccion);

            if (inspeccion is null)
            {
                throw new KeyNotFoundException("La inspección no existe.");
            }

            var idsItemsObligatorios = await _context.Items
                .Where(item => item.Seccion!.TiposEstablecimiento
                    .Any(tipo => tipo.IdTipoEstablecimiento == inspeccion.IdTipoEstablecimiento))
                .Select(item => item.IdItem)
                .ToListAsync();

            // Se incluye el Item de cada respuesta para poder sumar los puntos de
            // los ítems marcados "N/A" y así ajustar el máximo (corrige H5).
            var respuestas = await _context.Respuestas
                .Include(r => r.Item)
                .Where(r => r.IdInspeccion == idInspeccion)
                .ToListAsync();

            // Si falta algún ítem obligatorio sin responder, no se puede cerrar.
            var idsRespondidos = respuestas.Select(r => r.IdItem).ToHashSet();
            if (idsItemsObligatorios.Except(idsRespondidos).Any())
            {
                throw new SeccionesIncompletasException();
            }

            // Suma solo los puntos de los ítems marcados como "Cumple".
            var puntajeObtenido = respuestas
                .Where(r => r.Estado == "Cumple")
                .Sum(r => r.PuntosOtorgados ?? 0);

            // Suma los puntos de los ítems marcados "N/A": esos puntos se restan
            // del máximo, porque un ítem que no aplica no debe penalizar ni exigirse.
            var puntosExcluidosPorNoAplica = respuestas
                .Where(r => r.Estado == "N/A")
                .Sum(r => r.Item?.Puntaje ?? 0);

            // Puntaje máximo del catálogo (fijo por tipo de establecimiento) y el
            // máximo "real" aplicado a esta inspección, ya ajustado por los N/A.
            var puntajeMaximoReferencia = inspeccion.TipoEstablecimiento?.PuntajeMaximo ?? 0;
            var puntajeMaximoAplicado = Math.Max(0, puntajeMaximoReferencia - puntosExcluidosPorNoAplica);

            var porcentaje = puntajeMaximoAplicado > 0
                ? Math.Round((decimal)puntajeObtenido / puntajeMaximoAplicado * 100, 2)
                : 0;
            var clasificacion = ClasificarPorcentaje(porcentaje);

            inspeccion.Estado = "FINALIZADA";
            inspeccion.NombreInspector = dto.NombreInspector.Trim();
            inspeccion.IdentificacionInspector = dto.IdentificacionInspector.Trim();
            inspeccion.IdentificacionRepresentante = dto.IdentificacionRepresentante.Trim();
            inspeccion.ObservacionesFinales = string.IsNullOrWhiteSpace(dto.ObservacionesFinales)
                ? null
                : dto.ObservacionesFinales.Trim();
            inspeccion.OrdenSanitaria = dto.RegistrarOrdenSanitaria ? "S" : "N";
            inspeccion.PuntajeObtenido = puntajeObtenido;
            inspeccion.PuntajeMaximoAplicado = puntajeMaximoAplicado;
            inspeccion.PorcentajeCumplimiento = porcentaje;
            inspeccion.Clasificacion = clasificacion;
            inspeccion.FechaCierre = DateTime.Now;

            await _context.SaveChangesAsync();

            _logger.LogInformation(
                "Inspección {IdInspeccion} cerrada: puntaje={Puntaje}/{MaximoAplicado} " +
                "(referencia={MaximoReferencia}, excluido por N/A={Excluido}), {Porcentaje}%, clasificación={Clasificacion}.",
                idInspeccion, puntajeObtenido, puntajeMaximoAplicado, puntajeMaximoReferencia,
                puntosExcluidosPorNoAplica, porcentaje, clasificacion);

            return new ResumenCierreDto
            {
                PuntajeObtenido = puntajeObtenido,
                PuntajeMaximo = puntajeMaximoAplicado,
                PuntajeMaximoReferencia = puntajeMaximoReferencia,
                Porcentaje = porcentaje,
                Clasificacion = clasificacion,
            };
        }

        /// Clasifica el porcentaje de cumplimiento según los rangos del Art. 65 del Reglamento.
        private static string ClasificarPorcentaje(decimal porcentaje)
        {
            if (porcentaje <= 69) return "Condiciones inaceptables";
            if (porcentaje <= 80) return "Condiciones deficientes";
            return "Buenas condiciones";
        }
    }
}