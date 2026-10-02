using System.Text.Json;
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

    // Se lanza si los datos del Apartado II no se pueden guardar tal como
    // vienen (un código de cargo desconocido).
    public class ResponsableInvalidoException : Exception
    {
        public ResponsableInvalidoException(string mensaje) : base(mensaje) { }
    }

    // Se lanza si los datos del Apartado III no se pueden guardar tal como
    // vienen (un código de motivo desconocido).
    public class MotivoInvalidoException : Exception
    {
        public MotivoInvalidoException(string mensaje) : base(mensaje) { }
    }

    // Se lanza si los datos del Apartado VI no se pueden guardar tal como
    // vienen (algún dato de una persona presente supera el tamaño permitido).
    public class CierreInvalidoException : Exception
    {
        public CierreInvalidoException(string mensaje) : base(mensaje) { }
    }

    /// <summary>
    /// Implementación de IActaGeneralService. INS_ACTA_GENERAL solo guarda el
    /// folio y el estado; cada apartado se guarda en su propia tabla (1:1 por
    /// ID_ACTA), que se crea la primera vez que ese apartado se guarda.
    /// El folio (NumeroActa) se genera
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

        // Códigos válidos del Apartado II, en el mismo orden que CARGOS_RESPONSABLE
        // (frontend) y que el CHECK CK_ACTA_RESPONSABLE_CARGO de la base de datos.
        private static readonly string[] CargosValidos =
        {
            "REPRESENTANTE_LEGAL", "DENUNCIANTE", "PRESIDENTE", "DENUNCIADO", "ENCARGADO", "APODERADO", "OTRO",
        };

        // Códigos válidos del Apartado III, en el mismo orden que MOTIVOS_INSPECCION
        // (frontend) y que el CHECK CK_ACTA_MOTIVO_VALOR de la base de datos.
        private static readonly string[] MotivosValidos =
        {
            "PRIMERA_VEZ_PSF", "SEGUIMIENTO", "RENOVACION_PSF", "DENUNCIA", "LEY_9028_10066",
            "EVENTO_MASIVO", "EMERGENCIA", "OTRO",
        };

        // Mismos tamaños que las columnas MOTIVO_REPROGRAMACION y ACCION_OTRO.
        private const int LongitudMaximaMotivoReprogramacion = 400;
        private const int LongitudMaximaAccionOtro = 200;

        // Tamaños máximos de cada dato de una persona presente (Apartado VI).
        // Nombre e identificación usan los mismos tamaños que los del responsable (Apartado II).
        private const int LongitudMaximaNombrePersona = 200;
        private const int LongitudMaximaCargoInstitucion = 200;
        private const int LongitudMaximaIdentificacionPersona = 30;
        private const int LongitudMaximaFirma = 200;

        // PERSONAS_PRESENTES se guarda con nombres en camelCase, el mismo
        // formato con el que el frontend lo lee al recuperar el acta.
        private static readonly JsonSerializerOptions OpcionesJsonPersonas = new(JsonSerializerDefaults.Web);

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
            await VerificarActaExisteAsync(idActa);

            var infoGeneral = await ObtenerOCrearApartadoAsync(idActa, () => new InsActaInfoGeneral { IdActa = idActa });

            infoGeneral.FechaInspeccion = dto.FechaInspeccion;
            infoGeneral.HoraInicio = dto.HoraInicio;
            infoGeneral.NumeroExpediente = LimpiarOpcional(dto.NumeroExpediente);
            infoGeneral.NumeroDenuncia = LimpiarOpcional(dto.NumeroDenuncia);
            infoGeneral.NombreComercial = LimpiarOpcional(dto.NombreComercial);
            infoGeneral.Provincia = LimpiarOpcional(dto.Provincia);
            infoGeneral.Canton = LimpiarOpcional(dto.Canton);
            infoGeneral.Distrito = LimpiarOpcional(dto.Distrito);
            infoGeneral.DireccionExacta = LimpiarOpcional(dto.DireccionExacta);
            infoGeneral.TelefonoContacto = LimpiarOpcional(dto.TelefonoContacto);
            infoGeneral.CorreoNotificaciones = LimpiarOpcional(dto.CorreoNotificaciones);
            infoGeneral.AutorizaIngreso = ConvertirBooleanoSN(dto.AutorizaIngreso);
            infoGeneral.AutorizaFotos = ConvertirBooleanoSN(dto.AutorizaFotos);

            await _context.SaveChangesAsync();
        }

        public async Task GuardarResponsableAsync(int idActa, InfoResponsableActaDto dto)
        {
            await VerificarActaExisteAsync(idActa);

            var cargos = (dto.CargoResponsable ?? new List<string>())
                .Select(cargo => cargo?.Trim() ?? string.Empty)
                .Distinct()
                .ToList();

            if (cargos.Any(cargo => !CargosValidos.Contains(cargo)))
            {
                throw new ResponsableInvalidoException("Alguno de los cargos seleccionados no es válido.");
            }

            // Se guardan en el orden del catálogo, para que la misma selección
            // siempre quede igual sin importar en qué orden se marcó.
            var cargosOrdenados = CargosValidos.Where(cargos.Contains).ToList();

            var responsable = await ObtenerOCrearApartadoAsync(idActa, () => new InsActaResponsable { IdActa = idActa });

            responsable.NombreResponsable = LimpiarOpcional(dto.NombreResponsable);
            responsable.CargoResponsable = cargosOrdenados.Count > 0 ? string.Join(",", cargosOrdenados) : null;
            // El detalle libre de "Otro" solo tiene sentido si "Otro" está entre
            // los cargos marcados; si no, se descarta para no dejar basura de una
            // elección anterior.
            responsable.CargoResponsableOtro = cargosOrdenados.Contains("OTRO")
                ? LimpiarOpcional(dto.CargoResponsableOtro)
                : null;
            responsable.NumeroIdentificacionResponsable = LimpiarOpcional(dto.NumeroIdentificacionResponsable);

            await _context.SaveChangesAsync();
        }

        public async Task GuardarMotivoAsync(int idActa, InfoMotivoActaDto dto)
        {
            await VerificarActaExisteAsync(idActa);

            var motivos = (dto.MotivoInspeccion ?? new List<string>())
                .Select(motivo => motivo?.Trim() ?? string.Empty)
                .Distinct()
                .ToList();

            if (motivos.Any(motivo => !MotivosValidos.Contains(motivo)))
            {
                throw new MotivoInvalidoException("Alguno de los motivos seleccionados no es válido.");
            }

            // Se guardan en el orden del catálogo, para que la misma selección
            // siempre quede igual sin importar en qué orden se marcó.
            var motivosOrdenados = MotivosValidos.Where(motivos.Contains).ToList();

            var motivo = await ObtenerOCrearApartadoAsync(idActa, () => new InsActaMotivo { IdActa = idActa });

            motivo.MotivoInspeccion = motivosOrdenados.Count > 0 ? string.Join(",", motivosOrdenados) : null;
            // Igual que con los cargos del responsable: el detalle de "Otro" solo
            // se conserva si "Otro" está entre los motivos marcados.
            motivo.MotivoInspeccionOtro = motivosOrdenados.Contains("OTRO")
                ? LimpiarOpcional(dto.MotivoInspeccionOtro)
                : null;

            await _context.SaveChangesAsync();
        }

        public async Task GuardarHallazgosAsync(int idActa, InfoHallazgosActaDto dto)
        {
            await VerificarActaExisteAsync(idActa);

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

            // La fila del apartado se obtiene/crea recién después de validar, para
            // no dejar una fila vacía si los datos no se pueden guardar.
            var apartadoHallazgos = await ObtenerOCrearApartadoAsync(idActa, () => new InsActaHallazgos { IdActa = idActa });

            apartadoHallazgos.GuiasAplicables = idsGuias.Count > 0 ? string.Join(",", idsGuias) : null;
            apartadoHallazgos.Hallazgos = hallazgos;

            await _context.SaveChangesAsync();
        }

        public async Task GuardarAccionesAsync(int idActa, InfoAccionesActaDto dto)
        {
            await VerificarActaExisteAsync(idActa);

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

            var apartadoAcciones = await ObtenerOCrearApartadoAsync(idActa, () => new InsActaAcciones { IdActa = idActa });

            apartadoAcciones.AccionesSeguir = accionesOrdenadas.Count > 0 ? string.Join(",", accionesOrdenadas) : null;
            apartadoAcciones.MotivoReprogramacion = motivoReprogramacion;
            apartadoAcciones.AccionOtro = accionOtro;

            await _context.SaveChangesAsync();
        }

        public async Task GuardarCierreAsync(int idActa, InfoCierreActaDto dto)
        {
            await VerificarActaExisteAsync(idActa);

            var personas = (dto.PersonasPresentes ?? new List<PersonaPresenteDto>())
                .Where(persona => persona is not null)
                .Select(persona => new PersonaPresenteDto
                {
                    NombreCompleto = LimpiarOpcional(persona.NombreCompleto),
                    CargoInstitucion = LimpiarOpcional(persona.CargoInstitucion),
                    NumeroIdentificacion = LimpiarOpcional(persona.NumeroIdentificacion),
                    Firma = LimpiarOpcional(persona.Firma),
                })
                .ToList();

            foreach (var persona in personas)
            {
                ValidarLongitudPersona(persona.NombreCompleto, LongitudMaximaNombrePersona, "El nombre completo");
                ValidarLongitudPersona(persona.CargoInstitucion, LongitudMaximaCargoInstitucion, "El cargo o institución");
                ValidarLongitudPersona(persona.NumeroIdentificacion, LongitudMaximaIdentificacionPersona, "El número de identificación");
                ValidarLongitudPersona(persona.Firma, LongitudMaximaFirma, "La firma");
            }

            var cierre = await ObtenerOCrearApartadoAsync(idActa, () => new InsActaCierre { IdActa = idActa });

            cierre.PersonasPresentes = personas.Count > 0
                ? JsonSerializer.Serialize(personas, OpcionesJsonPersonas)
                : null;

            await _context.SaveChangesAsync();
        }

        private static void ValidarLongitudPersona(string? valor, int longitudMaxima, string nombreCampo)
        {
            if (valor is not null && valor.Length > longitudMaxima)
            {
                throw new CierreInvalidoException(
                    $"{nombreCampo} de una persona presente no puede superar los {longitudMaxima} caracteres.");
            }
        }

        public async Task<ActaGeneralDto?> ObtenerActaAsync(int idActa)
        {
            var acta = await ConsultarActaConApartados()
                .AsNoTracking()
                .FirstOrDefaultAsync(a => a.IdActa == idActa);

            if (acta is null)
            {
                return null;
            }

            // Un solo objeto plano con los mismos nombres de siempre, así el
            // frontend no depende de cómo se reparten los apartados en tablas.
            // Los apartados que nunca se guardaron no tienen fila: sus campos van en null.
            return new ActaGeneralDto
            {
                IdActa = acta.IdActa,
                NumeroActa = acta.NumeroActa,
                Estado = acta.Estado,
                FechaCreacion = acta.FechaCreacion,

                FechaInspeccion = acta.InfoGeneral?.FechaInspeccion,
                HoraInicio = acta.InfoGeneral?.HoraInicio,
                NumeroExpediente = acta.InfoGeneral?.NumeroExpediente,
                NumeroDenuncia = acta.InfoGeneral?.NumeroDenuncia,
                NombreComercial = acta.InfoGeneral?.NombreComercial,
                Provincia = acta.InfoGeneral?.Provincia,
                Canton = acta.InfoGeneral?.Canton,
                Distrito = acta.InfoGeneral?.Distrito,
                DireccionExacta = acta.InfoGeneral?.DireccionExacta,
                TelefonoContacto = acta.InfoGeneral?.TelefonoContacto,
                CorreoNotificaciones = acta.InfoGeneral?.CorreoNotificaciones,
                AutorizaIngreso = acta.InfoGeneral?.AutorizaIngreso,
                AutorizaFotos = acta.InfoGeneral?.AutorizaFotos,

                NombreResponsable = acta.Responsable?.NombreResponsable,
                CargoResponsable = acta.Responsable?.CargoResponsable,
                CargoResponsableOtro = acta.Responsable?.CargoResponsableOtro,
                NumeroIdentificacionResponsable = acta.Responsable?.NumeroIdentificacionResponsable,

                MotivoInspeccion = acta.Motivo?.MotivoInspeccion,
                MotivoInspeccionOtro = acta.Motivo?.MotivoInspeccionOtro,

                GuiasAplicables = acta.Hallazgos?.GuiasAplicables,
                Hallazgos = acta.Hallazgos?.Hallazgos,

                AccionesSeguir = acta.Acciones?.AccionesSeguir,
                MotivoReprogramacion = acta.Acciones?.MotivoReprogramacion,
                AccionOtro = acta.Acciones?.AccionOtro,

                PersonasPresentes = acta.Cierre?.PersonasPresentes,
            };
        }

        // Igual que una Inspección con sus Respuestas: la BD no borra en cascada,
        // así que primero se quitan las filas de los apartados y después el acta.
        public async Task<bool> EliminarActaAsync(int idActa)
        {
            var acta = await ConsultarActaConApartados()
                .FirstOrDefaultAsync(a => a.IdActa == idActa);

            if (acta is null)
            {
                return false;
            }

            if (acta.InfoGeneral is not null) _context.ActasInfoGeneral.Remove(acta.InfoGeneral);
            if (acta.Responsable is not null) _context.ActasResponsable.Remove(acta.Responsable);
            if (acta.Motivo is not null) _context.ActasMotivo.Remove(acta.Motivo);
            if (acta.Hallazgos is not null) _context.ActasHallazgos.Remove(acta.Hallazgos);
            if (acta.Acciones is not null) _context.ActasAcciones.Remove(acta.Acciones);
            if (acta.Cierre is not null) _context.ActasCierre.Remove(acta.Cierre);

            _context.ActasGenerales.Remove(acta);
            await _context.SaveChangesAsync();
            return true;
        }

        // El acta con la fila de cada uno de sus apartados (null si aún no existe).
        private IQueryable<InsActaGeneral> ConsultarActaConApartados() =>
            _context.ActasGenerales
                .Include(a => a.InfoGeneral)
                .Include(a => a.Responsable)
                .Include(a => a.Motivo)
                .Include(a => a.Hallazgos)
                .Include(a => a.Acciones)
                .Include(a => a.Cierre);

        // Lanza KeyNotFoundException (el controller responde 404) si el acta no existe.
        private async Task VerificarActaExisteAsync(int idActa)
        {
            if (await _context.ActasGenerales.FindAsync(idActa) is null)
            {
                throw new KeyNotFoundException("El acta no existe.");
            }
        }

        // Devuelve la fila de un apartado del acta (ID_ACTA es su PK). Si el
        // apartado nunca se había guardado, la crea: así el autoguardado de
        // cada apartado funciona como un upsert sin dejar filas vacías de los
        // apartados que el inspector no llenó.
        private async Task<T> ObtenerOCrearApartadoAsync<T>(int idActa, Func<T> crear) where T : class
        {
            var apartado = await _context.Set<T>().FindAsync(idActa);
            if (apartado is null)
            {
                apartado = crear();
                _context.Set<T>().Add(apartado);
            }

            return apartado;
        }

        // Convierte "" en null para no guardar cadenas vacías en campos opcionales.
        private static string? LimpiarOpcional(string? valor) =>
            string.IsNullOrWhiteSpace(valor) ? null : valor.Trim();

        private static string? ConvertirBooleanoSN(bool? valor) =>
            valor is null ? null : (valor.Value ? "S" : "N");
    }
}
