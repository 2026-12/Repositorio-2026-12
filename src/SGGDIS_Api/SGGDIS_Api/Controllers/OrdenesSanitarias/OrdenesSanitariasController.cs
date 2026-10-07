using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using SGGDIS_Api.Models.Dtos.OrdenesSanitarias;
using SGGDIS_Api.Security;
using SGGDIS_Api.Services.OrdenesSanitarias;

namespace SGGDIS_Api.Controllers.OrdenesSanitarias
{
    /// <summary>
    /// Endpoints para registrar y consultar Órdenes Sanitarias (HU-023 / HU-024).
    ///
    /// EH9-03: todas las respuestas de error se devuelven como JSON con la
    /// forma { "mensaje": "..." }. El cliente HTTP del frontend
    /// (solicitarJson) lee la propiedad "mensaje", por lo que el inspector ve
    /// el motivo real del rechazo en lugar del texto genérico
    /// "La solicitud no pudo completarse.".
    ///
    /// Los errores inesperados (500) mantienen un mensaje genérico y el detalle
    /// solo se registra en el log (estándar P05).
    /// </summary>
    [ApiController]
    [ValidacionModeloOrdenSanitaria]
    [Authorize(Roles = RolesSistema.OperacionActasYOrdenes)]
    [Route("api/ordenes-sanitarias")]
    public class OrdenesSanitariasController : ControllerBase
    {
        private const string MensajeErrorCrear =
            "Ocurrió un error al registrar la Orden Sanitaria. Intente nuevamente o contacte al administrador.";

        private const string MensajeErrorConsultar =
            "Ocurrió un error al consultar la Orden Sanitaria. Intente nuevamente o contacte al administrador.";

        private const string MensajeConflictoDatos =
            "No fue posible registrar la Orden Sanitaria porque el número de consecutivo ya existe o la inspección relacionada no es válida.";

        private const string MensajeOrdenNoEncontrada =
            "No se encontró la Orden Sanitaria solicitada.";

        private readonly IOrdenSanitariaService _ordenSanitariaService;
        private readonly ILogger<OrdenesSanitariasController> _logger;

        /// <summary>
        /// Recibe el servicio de Órdenes Sanitarias y el logger por inyección de dependencias.
        /// </summary>
        public OrdenesSanitariasController(
            IOrdenSanitariaService ordenSanitariaService,
            ILogger<OrdenesSanitariasController> logger)
        {
            _ordenSanitariaService = ordenSanitariaService;
            _logger = logger;
        }

        /// <summary>
        /// Registra una nueva Orden Sanitaria con su persona notificada,
        /// ubicación, ordenanzas, plazos y responsable.
        /// </summary>
        /// <returns>
        /// 200 con el id de la orden; 400, 404 o 409 con { mensaje } si los
        /// datos no son válidos; 500 con un mensaje genérico ante errores inesperados.
        /// </returns>
        [HttpPost]
        public async Task<IActionResult> CrearOrdenSanitaria([FromBody] CrearOrdenSanitariaDto dto)
        {
            try
            {
                var orden = await _ordenSanitariaService.CrearOrdenSanitariaAsync(dto);

                return Ok(new
                {
                    idOrdenSanitaria = orden.IdOrdenSanitaria
                });
            }
            catch (ArgumentException ex)
            {
                return BadRequest(CrearRespuestaError(ex.Message));
            }
            catch (KeyNotFoundException ex)
            {
                return NotFound(CrearRespuestaError(ex.Message));
            }
            catch (InvalidOperationException ex)
            {
                return Conflict(CrearRespuestaError(ex.Message));
            }
            catch (DbUpdateException ex)
            {
                // Violación de restricciones en base de datos, por ejemplo el
                // UNIQUE de NUMERO_CONSECUTIVO o la llave foránea de la inspección.
                _logger.LogWarning(ex, "Conflicto de datos al registrar la Orden Sanitaria.");
                return Conflict(CrearRespuestaError(MensajeConflictoDatos));
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error al crear la Orden Sanitaria.");
                return StatusCode(StatusCodes.Status500InternalServerError, CrearRespuestaError(MensajeErrorCrear));
            }
        }

        /// <summary>
        /// Obtiene una Orden Sanitaria completa por su identificador.
        /// </summary>
        [HttpGet("{id}")]
        public async Task<IActionResult> ObtenerOrdenSanitaria(int id)
        {
            try
            {
                var orden = await _ordenSanitariaService.ObtenerOrdenSanitariaAsync(id);

                if (orden == null)
                {
                    return NotFound(CrearRespuestaError(MensajeOrdenNoEncontrada));
                }

                return Ok(orden);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error al obtener la Orden Sanitaria {IdOrdenSanitaria}.", id);
                return StatusCode(StatusCodes.Status500InternalServerError, CrearRespuestaError(MensajeErrorConsultar));
            }
        }

        /// <summary>
        /// Obtiene las Órdenes Sanitarias asociadas a una inspección.
        /// </summary>
        [HttpGet("inspeccion/{idInspeccion}")]
        public async Task<IActionResult> ObtenerPorInspeccion(int idInspeccion)
        {
            try
            {
                var ordenes = await _ordenSanitariaService.ObtenerPorInspeccionAsync(idInspeccion);
                return Ok(ordenes);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error al consultar las Ordenes Sanitarias de la inspeccion {IdInspeccion}.", idInspeccion);
                return StatusCode(StatusCodes.Status500InternalServerError, CrearRespuestaError(MensajeErrorConsultar));
            }
        }

        /// <summary>
        /// Construye el cuerpo JSON estándar de error que entiende el frontend.
        /// </summary>
        /// <param name="mensaje">Texto en español formal que se mostrará al inspector.</param>
        private static object CrearRespuestaError(string mensaje)
        {
            return new { mensaje };
        }
    }
}