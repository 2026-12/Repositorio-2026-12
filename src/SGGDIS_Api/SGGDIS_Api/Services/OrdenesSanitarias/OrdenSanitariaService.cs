using System.Text.RegularExpressions;
using Microsoft.EntityFrameworkCore;
using SGGDIS_Api.Data;
using SGGDIS_Api.Models.Dtos.OrdenesSanitarias;
using SGGDIS_Api.Models.OrdenesSanitarias;
using SGGDIS_Api.Models.Ubicaciones;

namespace SGGDIS_Api.Services.OrdenesSanitarias
{
    /// <summary>
    /// Lógica de negocio de las Órdenes Sanitarias (HU-023 / HU-024).
    ///
    /// H5: antes de guardar, el servicio valida en el servidor las mismas
    /// reglas que aplica el frontend (validacionOrdenSanitaria.js). La
    /// validación del frontend ayuda al inspector; esta es la que protege los
    /// datos, porque una petición enviada directamente a la API se salta el
    /// formulario. Cada regla incumplida lanza ArgumentException (400),
    /// KeyNotFoundException (404) o InvalidOperationException (409) con un
    /// mensaje claro que el controlador devuelve como { mensaje }.
    /// </summary>
    public class OrdenSanitariaService : IOrdenSanitariaService
    {
        // Tipos de plazo permitidos (CK_INS_ORDENANZA_PLAZO_TIPO).
        private const string TipoPlazoFecha = "FECHA";
        private static readonly string[] TiposPlazoPermitidos = { "FECHA", "HORAS", "DIAS", "MESES" };

        // Condición que obliga a indicar "Otra condición".
        private const string CondicionOtro = "Otro";

        // Longitudes máximas según el script de base de datos (VARCHAR2).
        private const int LongitudDireccionExacta = 400;
        private const int LongitudConsecutivo = 100;
        private const int LongitudExpediente = 100;
        private const int LongitudNombreEstablecimiento = 200;
        private const int LongitudNombrePersona = 200;
        private const int LongitudCondicion = 100;
        private const int LongitudOtraCondicion = 200;
        private const int LongitudIdentificacion = 100;
        private const int LongitudTextoOrdenanza = 4000;
        private const int LongitudCargo = 150;
        private const int LongitudUnidadOrganizativa = 200;
        private const int LongitudFirma = 500;

        // Formato de hora de 24 horas HH:mm (CK_INS_ORDENANZA_PLAZO_HORA).
        private static readonly Regex FormatoHora = new(@"^([01][0-9]|2[0-3]):[0-5][0-9]$");

        private readonly SggdisDbContext _context;

        /// <summary>
        /// Recibe el contexto de base de datos por inyección de dependencias.
        /// </summary>
        public OrdenSanitariaService(SggdisDbContext context)
        {
            _context = context;
        }

        /// <summary>
        /// Valida y registra una Orden Sanitaria completa (ubicación, persona
        /// notificada, ordenanzas con su plazo y responsable) en una sola transacción.
        /// </summary>
        /// <exception cref="ArgumentException">Datos incompletos o con formato inválido (400).</exception>
        /// <exception cref="KeyNotFoundException">La inspección o el distrito no existen (404).</exception>
        /// <exception --cref="InvalidOperationException">El número de consecutivo ya existe (409).</exception>
        public async Task<OrdenSanitaria> CrearOrdenSanitariaAsync(CrearOrdenSanitariaDto dto)
        {
            ValidarOrdenSanitaria(dto);

            await using var transaction = await _context.Database.BeginTransactionAsync();

            try
            {
                await ValidarDatosRelacionadosAsync(dto);

                var ubicacion = new Ubicacion
                {
                    IdDistrito = dto.IdDistrito,
                    DireccionExacta = dto.DireccionExacta.Trim()
                };

                _context.Ubicaciones.Add(ubicacion);
                await _context.SaveChangesAsync();

                var ordenSanitaria = new OrdenSanitaria
                {
                    IdInspeccion = dto.IdInspeccion,
                    IdUbicacion = ubicacion.IdUbicacion,
                    NumeroConsecutivo = dto.NumeroConsecutivo.Trim(),
                    NumeroExpediente = string.IsNullOrWhiteSpace(dto.NumeroExpediente) ? null : dto.NumeroExpediente.Trim(),
                    NombreEstablecimiento = dto.NombreEstablecimiento.Trim(),
                    FechaEmision = dto.FechaEmision.Date,
                    FechaNotificacion = dto.FechaNotificacion.Date
                };

                _context.OrdenesSanitarias.Add(ordenSanitaria);
                await _context.SaveChangesAsync();

                var personaNotificada = new OrdenPersonaNotificada
                {
                    IdOrdenSanitaria = ordenSanitaria.IdOrdenSanitaria,
                    NombreCompleto = dto.PersonaNotificada.NombreCompleto.Trim(),
                    Condicion = dto.PersonaNotificada.Condicion.Trim(),
                    OtraCondicion = EsCondicionOtro(dto.PersonaNotificada.Condicion)
                        ? dto.PersonaNotificada.OtraCondicion?.Trim()
                        : null,
                    Identificacion = dto.PersonaNotificada.Identificacion.Trim()
                };

                _context.PersonasNotificadas.Add(personaNotificada);

                // El número de orden se asigna según la posición (1, 2, 3...)
                // para cumplir UQ_INS_ORDENANZA_NUMERO y CK_INS_ORDENANZA_NUMERO.
                for (var indice = 0; indice < dto.Ordenanzas.Count; indice++)
                {
                    var dtoOrdenanza = dto.Ordenanzas[indice];

                    var ordenanza = new Ordenanza
                    {
                        IdOrdenSanitaria = ordenSanitaria.IdOrdenSanitaria,
                        NumeroOrden = indice + 1,
                        DescripcionOrdenanza = dtoOrdenanza.Ordenanza.Trim(),
                        FundamentoLegal = dtoOrdenanza.FundamentoLegal.Trim()
                    };

                    _context.Ordenanzas.Add(ordenanza);
                    await _context.SaveChangesAsync();

                    _context.PlazosOrdenanza.Add(CrearPlazo(ordenanza.IdOrdenanza, dtoOrdenanza.Plazo));
                }

                var responsable = new OrdenResponsable
                {
                    IdOrdenSanitaria = ordenSanitaria.IdOrdenSanitaria,
                    NombreCompleto = dto.Responsable.NombreCompleto.Trim(),
                    Cargo = dto.Responsable.Cargo.Trim(),
                    UnidadOrganizativaArs = dto.Responsable.UnidadOrganizativaArs.Trim(),
                    Firma = string.IsNullOrWhiteSpace(dto.Responsable.Firma) ? null : dto.Responsable.Firma.Trim()
                };

                _context.ResponsablesOrden.Add(responsable);

                await _context.SaveChangesAsync();
                await transaction.CommitAsync();

                return ordenSanitaria;
            }
            catch
            {
                await transaction.RollbackAsync();
                throw;
            }
        }

        // =====================================================================
        // VALIDACIONES
        // =====================================================================

        /// <summary>
        /// Valida todas las reglas que no requieren consultar la base de datos:
        /// campos obligatorios, longitudes, fechas y plazos de cada ordenanza.
        /// </summary>
        private static void ValidarOrdenSanitaria(CrearOrdenSanitariaDto? dto)
        {
            if (dto == null)
                throw new ArgumentException("No se recibieron los datos de la Orden Sanitaria.");

            ValidarInformacionGeneral(dto);
            ValidarPersonaNotificada(dto.PersonaNotificada);
            ValidarFechas(dto);
            ValidarOrdenanzas(dto);
            ValidarResponsable(dto.Responsable);
        }

        /// <summary>
        /// Valida la inspección relacionada, la ubicación y los datos de identificación de la orden.
        /// </summary>
        private static void ValidarInformacionGeneral(CrearOrdenSanitariaDto dto)
        {
            if (dto.IdInspeccion <= 0)
                throw new ArgumentException("Debe indicar la inspección relacionada con la Orden Sanitaria.");

            if (dto.IdDistrito <= 0)
                throw new ArgumentException("Debe seleccionar un distrito.");

            ValidarTextoObligatorio(dto.DireccionExacta, LongitudDireccionExacta,
                "Debe indicar la dirección exacta.", "La dirección exacta");

            ValidarTextoObligatorio(dto.NumeroConsecutivo, LongitudConsecutivo,
                "Debe indicar el número de consecutivo de la Orden Sanitaria.", "El número de consecutivo");

            ValidarTextoOpcional(dto.NumeroExpediente, LongitudExpediente, "El número de expediente");

            ValidarTextoObligatorio(dto.NombreEstablecimiento, LongitudNombreEstablecimiento,
                "Debe indicar el nombre del establecimiento.", "El nombre del establecimiento");
        }

        /// <summary>
        /// Valida los datos de la persona a notificar. Si la condición es "Otro",
        /// exige indicar cuál es la otra condición.
        /// </summary>
        private static void ValidarPersonaNotificada(PersonaNotificadaDto? persona)
        {
            if (persona == null)
                throw new ArgumentException("Debe indicar los datos de la persona a notificar.");

            ValidarTextoObligatorio(persona.NombreCompleto, LongitudNombrePersona,
                "Debe indicar el nombre de la persona a notificar.", "El nombre de la persona a notificar");

            ValidarTextoObligatorio(persona.Condicion, LongitudCondicion,
                "Debe seleccionar la condición de la persona a notificar.", "La condición");

            if (EsCondicionOtro(persona.Condicion))
            {
                ValidarTextoObligatorio(persona.OtraCondicion, LongitudOtraCondicion,
                    "Debe indicar la otra condición.", "La otra condición");
            }

            ValidarTextoObligatorio(persona.Identificacion, LongitudIdentificacion,
                "Debe indicar el número de identificación.", "El número de identificación");
        }

        /// <summary>
        /// Valida que las fechas no sean pasadas y que la notificación no sea
        /// anterior a la emisión.
        /// </summary>
        private static void ValidarFechas(CrearOrdenSanitariaDto dto)
        {
            var fechaActual = DateTime.Today;

            if (dto.FechaEmision == default)
                throw new ArgumentException("Debe indicar la fecha de emisión.");

            if (dto.FechaNotificacion == default)
                throw new ArgumentException("Debe indicar la fecha de notificación.");

            if (dto.FechaEmision.Date < fechaActual)
                throw new ArgumentException("La fecha de emisión no puede ser anterior a la fecha actual.");

            if (dto.FechaNotificacion.Date < fechaActual)
                throw new ArgumentException("La fecha de notificación no puede ser anterior a la fecha actual.");

            if (dto.FechaNotificacion.Date < dto.FechaEmision.Date)
                throw new ArgumentException("La fecha de notificación no puede ser anterior a la fecha de emisión.");
        }

        /// <summary>
        /// Valida que exista al menos una ordenanza y que cada una tenga texto,
        /// fundamento legal y un plazo de cumplimiento válido.
        /// </summary>
        private static void ValidarOrdenanzas(CrearOrdenSanitariaDto dto)
        {
            if (dto.Ordenanzas == null || dto.Ordenanzas.Count == 0)
                throw new ArgumentException("Debe registrar al menos una ordenanza.");

            for (var indice = 0; indice < dto.Ordenanzas.Count; indice++)
            {
                var numero = indice + 1;
                var ordenanza = dto.Ordenanzas[indice];

                if (ordenanza == null)
                    throw new ArgumentException($"Debe completar los datos de la ordenanza {numero}.");

                ValidarTextoObligatorio(ordenanza.Ordenanza, LongitudTextoOrdenanza,
                    $"Debe indicar el texto de la ordenanza {numero}.", $"El texto de la ordenanza {numero}");

                ValidarTextoObligatorio(ordenanza.FundamentoLegal, LongitudTextoOrdenanza,
                    $"Debe indicar el fundamento legal de la ordenanza {numero}.", $"El fundamento legal de la ordenanza {numero}");

                ValidarPlazo(ordenanza.Plazo, numero, dto.FechaNotificacion.Date);
            }
        }

        /// <summary>
        /// Valida el plazo de una ordenanza según su tipo:
        /// FECHA exige una fecha real, no pasada y no anterior a la notificación (hora opcional HH:mm);
        /// HORAS, DIAS y MESES exigen una cantidad entera mayor que cero.
        /// </summary>
        private static void ValidarPlazo(PlazoOrdenanzaDto? plazo, int numero, DateTime fechaNotificacion)
        {
            if (plazo == null || string.IsNullOrWhiteSpace(plazo.TipoPlazo))
                throw new ArgumentException($"Debe seleccionar el tipo de plazo de la ordenanza {numero}.");

            var tipoPlazo = plazo.TipoPlazo.Trim().ToUpperInvariant();

            if (!TiposPlazoPermitidos.Contains(tipoPlazo))
                throw new ArgumentException($"El tipo de plazo de la ordenanza {numero} no es válido.");

            if (tipoPlazo != TipoPlazoFecha)
            {
                if (!plazo.Cantidad.HasValue || plazo.Cantidad.Value <= 0)
                    throw new ArgumentException($"La cantidad del plazo de la ordenanza {numero} debe ser un número entero mayor que 0.");

                return;
            }

            if (!plazo.DiaCumplimiento.HasValue || !plazo.MesCumplimiento.HasValue || !plazo.AnioCumplimiento.HasValue)
                throw new ArgumentException($"Debe indicar la fecha de cumplimiento de la ordenanza {numero}.");

            DateTime fechaCumplimiento;

            try
            {
                fechaCumplimiento = new DateTime(
                    plazo.AnioCumplimiento.Value,
                    plazo.MesCumplimiento.Value,
                    plazo.DiaCumplimiento.Value);
            }
            catch (ArgumentOutOfRangeException)
            {
                throw new ArgumentException($"La fecha de cumplimiento de la ordenanza {numero} no es válida.");
            }

            if (fechaCumplimiento.Date < DateTime.Today)
                throw new ArgumentException($"La fecha de cumplimiento de la ordenanza {numero} no puede ser anterior a la fecha actual.");

            if (fechaCumplimiento.Date < fechaNotificacion)
                throw new ArgumentException($"La fecha de cumplimiento de la ordenanza {numero} no puede ser anterior a la fecha de notificación.");

            if (!string.IsNullOrWhiteSpace(plazo.HoraCumplimiento) && !FormatoHora.IsMatch(plazo.HoraCumplimiento.Trim()))
                throw new ArgumentException($"La hora de cumplimiento de la ordenanza {numero} debe tener el formato de 24 horas HH:mm.");
        }

        /// <summary>
        /// Valida los datos de la persona funcionaria responsable. La firma es opcional.
        /// </summary>
        private static void ValidarResponsable(ResponsableOrdenDto? responsable)
        {
            if (responsable == null)
                throw new ArgumentException("Debe indicar los datos del responsable de la Orden Sanitaria.");

            ValidarTextoObligatorio(responsable.NombreCompleto, LongitudNombrePersona,
                "Debe indicar el nombre del responsable.", "El nombre del responsable");

            ValidarTextoObligatorio(responsable.Cargo, LongitudCargo,
                "Debe indicar el cargo del responsable.", "El cargo del responsable");

            ValidarTextoObligatorio(responsable.UnidadOrganizativaArs, LongitudUnidadOrganizativa,
                "Debe indicar la Unidad Organizativa o ARS.", "La Unidad Organizativa o ARS");

            ValidarTextoOpcional(responsable.Firma, LongitudFirma, "La firma");
        }

        /// <summary>
        /// Verifica, ya dentro de la transacción, que la inspección y el distrito existan.
        ///
        /// La validación de número de consecutivo repetido queda desactivada
        /// temporalmente mientras se prueba con datos quemados. Se reactivará
        /// cuando se conecte el flujo completo de la inspección y el consecutivo
        /// se genere en el backend.
        /// </summary>
        private async Task ValidarDatosRelacionadosAsync(CrearOrdenSanitariaDto dto)
        {
            var inspeccionExiste = await _context.Inspecciones.AnyAsync(i => i.IdInspeccion == dto.IdInspeccion);

            if (!inspeccionExiste)
                throw new KeyNotFoundException("La inspección relacionada no existe.");

            var distritoExiste = await _context.Distritos.AnyAsync(d => d.IdDistrito == dto.IdDistrito);

            if (!distritoExiste)
                throw new KeyNotFoundException("El distrito seleccionado no existe.");

            // VALIDACIÓN TEMPORALMENTE DESACTIVADA PARA PRUEBAS
            // var consecutivo = dto.NumeroConsecutivo.Trim();
            // var consecutivoExiste = await _context.OrdenesSanitarias.AnyAsync(o => o.NumeroConsecutivo == consecutivo);
            //
            // if (consecutivoExiste)
            //     throw new InvalidOperationException("Ya existe una Orden Sanitaria con ese número de consecutivo.");
        }

        /// <summary>
        /// Lanza ArgumentException si el texto está vacío o supera la longitud máxima.
        /// </summary>
        private static void ValidarTextoObligatorio(string? valor, int longitudMaxima, string mensajeVacio, string nombreCampo)
        {
            if (string.IsNullOrWhiteSpace(valor))
                throw new ArgumentException(mensajeVacio);

            ValidarLongitud(valor, longitudMaxima, nombreCampo);
        }

        /// <summary>
        /// Lanza ArgumentException si un texto opcional supera la longitud máxima.
        /// </summary>
        private static void ValidarTextoOpcional(string? valor, int longitudMaxima, string nombreCampo)
        {
            if (!string.IsNullOrWhiteSpace(valor))
                ValidarLongitud(valor, longitudMaxima, nombreCampo);
        }

        /// <summary>
        /// Lanza ArgumentException si el texto, sin espacios al inicio ni al final,
        /// supera la longitud permitida por la columna de base de datos.
        /// </summary>
        private static void ValidarLongitud(string valor, int longitudMaxima, string nombreCampo)
        {
            if (valor.Trim().Length > longitudMaxima)
                throw new ArgumentException($"{nombreCampo} no puede superar los {longitudMaxima} caracteres.");
        }

        /// <summary>
        /// Indica si la condición seleccionada es "Otro" (sin importar mayúsculas).
        /// </summary>
        private static bool EsCondicionOtro(string? condicion)
        {
            return string.Equals(condicion?.Trim(), CondicionOtro, StringComparison.OrdinalIgnoreCase);
        }

        /// <summary>
        /// Construye el plazo de una ordenanza dejando en null los campos que no
        /// corresponden a su tipo, como exige CK_INS_ORDENANZA_PLAZO_DATOS.
        /// </summary>
        private static OrdenanzaPlazo CrearPlazo(int idOrdenanza, PlazoOrdenanzaDto dtoPlazo)
        {
            var tipoPlazo = dtoPlazo.TipoPlazo.Trim().ToUpperInvariant();
            var esFecha = tipoPlazo == TipoPlazoFecha;

            return new OrdenanzaPlazo
            {
                IdOrdenanza = idOrdenanza,
                TipoPlazo = tipoPlazo,
                Cantidad = esFecha ? null : dtoPlazo.Cantidad,
                DiaCumplimiento = esFecha ? dtoPlazo.DiaCumplimiento : null,
                MesCumplimiento = esFecha ? dtoPlazo.MesCumplimiento : null,
                AnioCumplimiento = esFecha ? dtoPlazo.AnioCumplimiento : null,
                HoraCumplimiento = esFecha && !string.IsNullOrWhiteSpace(dtoPlazo.HoraCumplimiento)
                    ? dtoPlazo.HoraCumplimiento.Trim()
                    : null
            };
        }

        // =====================================================================
        // CONSULTAS
        // =====================================================================

        /// <summary>
        /// Obtiene una Orden Sanitaria completa por su identificador, o null si no existe.
        /// </summary>
        public async Task<OrdenSanitariaRespuestaDto?> ObtenerOrdenSanitariaAsync(int idOrdenSanitaria)
        {
            return await _context.OrdenesSanitarias
                .AsNoTracking()
                .Where(o => o.IdOrdenSanitaria == idOrdenSanitaria)
                .Select(o => new OrdenSanitariaRespuestaDto
                {
                    IdOrdenSanitaria = o.IdOrdenSanitaria,
                    IdInspeccion = o.IdInspeccion,
                    NumeroConsecutivo = o.NumeroConsecutivo,
                    NumeroExpediente = o.NumeroExpediente,
                    NombreEstablecimiento = o.NombreEstablecimiento,
                    FechaEmision = o.FechaEmision,
                    FechaNotificacion = o.FechaNotificacion,
                    Ubicacion = o.Ubicacion == null ? null : new UbicacionOrdenDto
                    {
                        IdProvincia = o.Ubicacion.Distrito!.Canton!.Provincia!.IdProvincia,
                        Provincia = o.Ubicacion.Distrito.Canton.Provincia.Nombre,
                        IdCanton = o.Ubicacion.Distrito.Canton.IdCanton,
                        Canton = o.Ubicacion.Distrito.Canton.Nombre,
                        IdDistrito = o.Ubicacion.Distrito.IdDistrito,
                        Distrito = o.Ubicacion.Distrito.Nombre,
                        DireccionExacta = o.Ubicacion.DireccionExacta
                    },
                    PersonaNotificada = o.PersonaNotificada == null ? null : new PersonaNotificadaDto
                    {
                        NombreCompleto = o.PersonaNotificada.NombreCompleto,
                        Condicion = o.PersonaNotificada.Condicion,
                        OtraCondicion = o.PersonaNotificada.OtraCondicion,
                        Identificacion = o.PersonaNotificada.Identificacion
                    },
                    Ordenanzas = o.Ordenanzas
                        .OrderBy(x => x.NumeroOrden)
                        .Select(x => new OrdenanzaRespuestaDto
                        {
                            IdOrdenanza = x.IdOrdenanza,
                            NumeroOrden = x.NumeroOrden,
                            Ordenanza = x.DescripcionOrdenanza,
                            FundamentoLegal = x.FundamentoLegal,
                            Plazo = x.Plazo == null ? null : new PlazoOrdenanzaDto
                            {
                                TipoPlazo = x.Plazo.TipoPlazo,
                                Cantidad = x.Plazo.Cantidad,
                                DiaCumplimiento = x.Plazo.DiaCumplimiento,
                                MesCumplimiento = x.Plazo.MesCumplimiento,
                                AnioCumplimiento = x.Plazo.AnioCumplimiento,
                                HoraCumplimiento = x.Plazo.HoraCumplimiento
                            }
                        })
                        .ToList(),
                    Responsable = o.Responsable == null ? null : new ResponsableOrdenDto
                    {
                        NombreCompleto = o.Responsable.NombreCompleto,
                        Cargo = o.Responsable.Cargo,
                        UnidadOrganizativaArs = o.Responsable.UnidadOrganizativaArs,
                        Firma = o.Responsable.Firma
                    }
                })
                .FirstOrDefaultAsync();
        }

        /// <summary>
        /// Obtiene todas las Órdenes Sanitarias asociadas a una inspección.
        /// </summary>
        public async Task<List<OrdenSanitariaRespuestaDto>> ObtenerPorInspeccionAsync(int idInspeccion)
        {
            return await _context.OrdenesSanitarias
                .AsNoTracking()
                .Where(o => o.IdInspeccion == idInspeccion)
                .OrderBy(o => o.IdOrdenSanitaria)
                .Select(o => new OrdenSanitariaRespuestaDto
                {
                    IdOrdenSanitaria = o.IdOrdenSanitaria,
                    IdInspeccion = o.IdInspeccion,
                    NumeroConsecutivo = o.NumeroConsecutivo,
                    NumeroExpediente = o.NumeroExpediente,
                    NombreEstablecimiento = o.NombreEstablecimiento,
                    FechaEmision = o.FechaEmision,
                    FechaNotificacion = o.FechaNotificacion,
                    Ubicacion = o.Ubicacion == null ? null : new UbicacionOrdenDto
                    {
                        IdProvincia = o.Ubicacion.Distrito!.Canton!.Provincia!.IdProvincia,
                        Provincia = o.Ubicacion.Distrito.Canton.Provincia.Nombre,
                        IdCanton = o.Ubicacion.Distrito.Canton.IdCanton,
                        Canton = o.Ubicacion.Distrito.Canton.Nombre,
                        IdDistrito = o.Ubicacion.Distrito.IdDistrito,
                        Distrito = o.Ubicacion.Distrito.Nombre,
                        DireccionExacta = o.Ubicacion.DireccionExacta
                    },
                    PersonaNotificada = o.PersonaNotificada == null ? null : new PersonaNotificadaDto
                    {
                        NombreCompleto = o.PersonaNotificada.NombreCompleto,
                        Condicion = o.PersonaNotificada.Condicion,
                        OtraCondicion = o.PersonaNotificada.OtraCondicion,
                        Identificacion = o.PersonaNotificada.Identificacion
                    },
                    Ordenanzas = o.Ordenanzas
                        .OrderBy(x => x.NumeroOrden)
                        .Select(x => new OrdenanzaRespuestaDto
                        {
                            IdOrdenanza = x.IdOrdenanza,
                            NumeroOrden = x.NumeroOrden,
                            Ordenanza = x.DescripcionOrdenanza,
                            FundamentoLegal = x.FundamentoLegal,
                            Plazo = x.Plazo == null ? null : new PlazoOrdenanzaDto
                            {
                                TipoPlazo = x.Plazo.TipoPlazo,
                                Cantidad = x.Plazo.Cantidad,
                                DiaCumplimiento = x.Plazo.DiaCumplimiento,
                                MesCumplimiento = x.Plazo.MesCumplimiento,
                                AnioCumplimiento = x.Plazo.AnioCumplimiento,
                                HoraCumplimiento = x.Plazo.HoraCumplimiento
                            }
                        })
                        .ToList(),
                    Responsable = o.Responsable == null ? null : new ResponsableOrdenDto
                    {
                        NombreCompleto = o.Responsable.NombreCompleto,
                        Cargo = o.Responsable.Cargo,
                        UnidadOrganizativaArs = o.Responsable.UnidadOrganizativaArs,
                        Firma = o.Responsable.Firma
                    }
                })
                .ToListAsync();
        }
    }
}