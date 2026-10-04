using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Authorization;
using System.Security.Claims;
using Microsoft.EntityFrameworkCore;
using SGGDIS_Api.Data;
using SGGDIS_Api.Models.Dtos;
using SGGDIS_Api.Security;
using SGGDIS_Api.Services;

namespace SGGDIS_Api.Controllers
{
    /// <summary>
    /// Endpoints de inspecciones (crear, actualizar, consultar, cerrar, eliminar).
    /// La lógica vive en IInspeccionService, acá solo se traduce a HTTP.
    /// </summary>
    [ApiController]
    [Authorize(Roles = RolesSistema.OperacionInspecciones)]
    [Route("api/inspecciones")]
    public class InspeccionesController : ControllerBase
    {
        private readonly IInspeccionService _inspeccionService;
        private readonly ILogger<InspeccionesController> _logger;
        private readonly SggdisDbContext _db;

        public InspeccionesController(IInspeccionService inspeccionService, ILogger<InspeccionesController> logger, SggdisDbContext db)
        {
            _inspeccionService = inspeccionService;
            _logger = logger;
            _db = db;
        }

        private async Task<bool> PerteneceAlAreaActualAsync(int idInspeccion)
        {
            var areaId = User.FindFirstValue("area_id");
            return int.TryParse(areaId, out var idArea) && await _db.Inspecciones
                .AnyAsync(inspeccion => inspeccion.IdInspeccion == idInspeccion && inspeccion.IdArea == idArea);
        }

        // POST /api/inspecciones : crea una nueva inspección "EN_PROCESO".
        [HttpPost]
        public async Task<IActionResult> CrearInspeccion([FromBody] CrearInspeccionDto dto)
        {
            if (!int.TryParse(User.FindFirstValue("sub"), out var idUsuario)) return Unauthorized();
            var areaIdAsignada = HttpContext?.User?.FindFirstValue("area_id");
            if (!int.TryParse(areaIdAsignada, out var idAreaAsignada))
            {
                return Forbid();
            }
            if (dto.IdArea != idAreaAsignada)
            {
                return Forbid();
            }

            if (dto.Fecha.Date < DateTime.Today)
            {
                return BadRequest("La fecha de inspección no puede ser anterior a la de día de hoy.");
            }

            try
            {
                var inspeccion = await _inspeccionService.CrearInspeccionAsync(dto, idUsuario);
                return Ok(new { idInspeccion = inspeccion.IdInspeccion });
            }
            catch (ConsecutivoDuplicadoException ex)
            {
                // Error esperado por el usuario (folio repetido): sí se le puede mostrar el detalle.
                return Conflict(ex.Message);
            }
            catch (InspectorNoDisponibleException ex)
            {
                return Conflict(ex.Message);
            }
            catch (Exception ex)
            {
                // Error inesperado: se oculta el detalle y se muestra un mensaje genérico,
                // pero queda registrado en el log para diagnosticarlo.
                _logger.LogError(ex, "Error al crear la inspeccion.");
                return StatusCode(500, "Ocurrio un error al crear la inspeccion.");
            }
        }

        // DELETE /api/inspecciones/{id} : elimina una inspección y sus respuestas.
        [HttpDelete("{id}")]
        public async Task<IActionResult> EliminarInspeccion(int id)
        {
            if (!await PerteneceAlAreaActualAsync(id)) return NotFound();
            try
            {
                var eliminada = await _inspeccionService.EliminarInspeccionAsync(id);
                return eliminada ? NoContent() : NotFound();
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error al eliminar la inspeccion {IdInspeccion}.", id);
                return StatusCode(500, "Ocurrio un error al eliminar la inspeccion.");
            }
        }

        // PUT /api/inspecciones/{id}/respuestas : guarda (autoguardado) las respuestas del checklist.
        [HttpPut("{id}/respuestas")]
        public async Task<IActionResult> GuardarRespuestas(int id, [FromBody] List<RespuestaDto> respuestas)
        {
            if (!await PerteneceAlAreaActualAsync(id)) return NotFound();
            try
            {
                await _inspeccionService.GuardarRespuestasAsync(id, respuestas);
                return NoContent();
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error al guardar las respuestas de la inspeccion {IdInspeccion}.", id);
                return StatusCode(500, "Ocurrio un error al guardar las respuestas.");
            }
        }

        // GET /api/inspecciones/{id}/respuestas : devuelve las respuestas ya guardadas.
        [HttpGet("{id}/respuestas")]
        public async Task<IActionResult> ObtenerRespuestas(int id)
        {
            if (!await PerteneceAlAreaActualAsync(id)) return NotFound();
            try
            {
                var respuestas = await _inspeccionService.ObtenerRespuestasAsync(id);
                return Ok(respuestas.Select(r => new { r.IdItem, r.Estado, r.PuntosOtorgados }));
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error al obtener las respuestas de la inspeccion {IdInspeccion}.", id);
                return StatusCode(500, "Ocurrio un error al obtener las respuestas.");
            }
        }

        // PUT /api/inspecciones/{id}/cierre : cierra la inspección y calcula el resultado final.
        [HttpPut("{id}/cierre")]
        public async Task<IActionResult> CerrarInspeccion(int id, [FromBody] CerrarInspeccionDto dto)
        {
            if (!int.TryParse(User.FindFirstValue("sub"), out var idUsuario)) return Unauthorized();
            if (!await PerteneceAlAreaActualAsync(id)) return NotFound();
            try
            {
                var resumen = await _inspeccionService.CerrarInspeccionAsync(id, dto, idUsuario);
                return Ok(resumen);
            }
            catch (InspectorNoDisponibleException ex)
            {
                return Conflict(ex.Message);
            }
            catch (CamposCierreIncompletosException ex)
            {
                return BadRequest(ex.Message);
            }
            catch (SeccionesIncompletasException ex)
            {
                return Conflict(ex.Message);
            }
            catch (KeyNotFoundException)
            {
                return NotFound();
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error al cerrar la inspeccion {IdInspeccion}.", id);
                return StatusCode(500, "Ocurrió un error al cerrar la inspección.");
            }
        }
    }
}