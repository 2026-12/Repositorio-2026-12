using Microsoft.AspNetCore.Mvc;
using SGGDIS_Api.Models.Dtos;
using SGGDIS_Api.Services;

namespace SGGDIS_Api.Controllers
{
    /// <summary>
    /// Expone los endpoints para crear, actualizar, consultar, cerrar y eliminar
    /// inspecciones reales. Cada acción delega la lógica al IInspeccionService y
    /// solo se encarga de traducir el resultado (o el error) a una respuesta HTTP.
    /// </summary>
    [ApiController]
    [Route("api/inspecciones")]
    public class InspeccionesController : ControllerBase
    {
        private readonly IInspeccionService _inspeccionService;

        public InspeccionesController(IInspeccionService inspeccionService)
        {
            _inspeccionService = inspeccionService;
        }

        // POST /api/inspecciones : crea una nueva inspección "EN_PROCESO".
        [HttpPost]
        public async Task<IActionResult> CrearInspeccion([FromBody] CrearInspeccionDto dto)
        {
            if (dto.Fecha.Date < DateTime.Today)
            {
                return BadRequest("La fecha de inspección no puede ser anterior a la de día de hoy.");
            }

            try
            {
                var inspeccion = await _inspeccionService.CrearInspeccionAsync(dto);
                return Ok(new { idInspeccion = inspeccion.IdInspeccion });
            }
            catch (ConsecutivoDuplicadoException ex)
            {
                // Error esperado por el usuario (folio repetido): sí se le puede mostrar el detalle.
                return Conflict(ex.Message);
            }
            catch (Exception)
            {
                // Cualquier otro error (ej. de base de datos) se oculta y se muestra un mensaje genérico.
                return StatusCode(500, "Ocurrio un error al crear la inspeccion.");
            }
        }

        // DELETE /api/inspecciones/{id} : elimina una inspección y sus respuestas.
        [HttpDelete("{id}")]
        public async Task<IActionResult> EliminarInspeccion(int id)
        {
            try
            {
                var eliminada = await _inspeccionService.EliminarInspeccionAsync(id);
                return eliminada ? NoContent() : NotFound();
            }
            catch (Exception)
            {
                return StatusCode(500, "Ocurrio un error al eliminar la inspeccion.");
            }
        }

        // PUT /api/inspecciones/{id}/respuestas : guarda (autoguardado) las respuestas del checklist.
        [HttpPut("{id}/respuestas")]
        public async Task<IActionResult> GuardarRespuestas(int id, [FromBody] List<RespuestaDto> respuestas)
        {
            try
            {
                await _inspeccionService.GuardarRespuestasAsync(id, respuestas);
                return NoContent();
            }
            catch (Exception)
            {
                return StatusCode(500, "Ocurrio un error al guardar las respuestas.");
            }
        }

        // GET /api/inspecciones/{id}/respuestas : devuelve las respuestas ya guardadas.
        [HttpGet("{id}/respuestas")]
        public async Task<IActionResult> ObtenerRespuestas(int id)
        {
            try
            {
                var respuestas = await _inspeccionService.ObtenerRespuestasAsync(id);
                return Ok(respuestas.Select(r => new { r.IdItem, r.Estado, r.PuntosOtorgados }));
            }
            catch (Exception)
            {
                return StatusCode(500, "Ocurrio un error al obtener las respuestas.");
            }
        }

        // PUT /api/inspecciones/{id}/cierre : cierra la inspección y calcula el resultado final.
        [HttpPut("{id}/cierre")]
        public async Task<IActionResult> CerrarInspeccion(int id, [FromBody] CerrarInspeccionDto dto)
        {
            try
            {
                var resumen = await _inspeccionService.CerrarInspeccionAsync(id, dto);
                return Ok(resumen);
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
            catch (Exception)
            {
                return StatusCode(500, "Ocurrió un error al cerrar la inspección.");
            }
        }
    }
}