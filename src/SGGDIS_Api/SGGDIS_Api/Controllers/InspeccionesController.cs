using Microsoft.AspNetCore.Mvc;
using SGGDIS_Api.Models.Dtos;
using SGGDIS_Api.Services;

namespace SGGDIS_Api.Controllers
{
    [ApiController]
    [Route("api/inspecciones")]
    public class InspeccionesController : ControllerBase
    {
        private readonly IInspeccionService _inspeccionService;

        public InspeccionesController(IInspeccionService inspeccionService)
        {
            _inspeccionService = inspeccionService;
        }

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
                return Conflict(ex.Message);
            }
            catch (Exception)
            {
                return StatusCode(500, "Ocurrio un error al crear la inspeccion.");
            }
        }

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
    }
}