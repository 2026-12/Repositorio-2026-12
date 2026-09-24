using Microsoft.AspNetCore.Mvc;
using SGGDIS_Api.Models.Dtos;
using SGGDIS_Api.Services;

namespace SGGDIS_Api.Controllers
{
    /// <summary>
    /// Endpoints del Acta de Inspección General (HU-004 y sub-HU HU-006 a
    /// HU-011). Cada apartado del wizard se guarda por su propia ruta, así el
    /// autoguardado de un apartado no obliga a que los demás estén completos.
    /// </summary>
    [ApiController]
    [Route("api/actas-generales")]
    public class ActaGeneralController : ControllerBase
    {
        private readonly IActaGeneralService _actaGeneralService;
        private readonly ILogger<ActaGeneralController> _logger;

        public ActaGeneralController(IActaGeneralService actaGeneralService, ILogger<ActaGeneralController> logger)
        {
            _actaGeneralService = actaGeneralService;
            _logger = logger;
        }

        // POST /api/actas-generales : crea un acta nueva vacía y le asigna el folio.
        [HttpPost]
        public async Task<IActionResult> CrearActa()
        {
            try
            {
                var acta = await _actaGeneralService.CrearActaAsync();
                return Ok(acta);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error al crear el acta general.");
                return StatusCode(500, "Ocurrió un error al crear el acta.");
            }
        }

        // GET /api/actas-generales/{id} : recupera el acta para restaurar el formulario.
        [HttpGet("{id}")]
        public async Task<IActionResult> ObtenerActa(int id)
        {
            try
            {
                var acta = await _actaGeneralService.ObtenerActaAsync(id);
                return acta is null ? NotFound() : Ok(acta);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error al obtener el acta general {IdActa}.", id);
                return StatusCode(500, "Ocurrió un error al obtener el acta.");
            }
        }

        // PUT /api/actas-generales/{id}/info-general : guarda (autoguardado) el Apartado I.
        [HttpPut("{id}/info-general")]
        public async Task<IActionResult> GuardarInfoGeneral(int id, [FromBody] InfoGeneralActaDto dto)
        {
            try
            {
                await _actaGeneralService.GuardarInfoGeneralAsync(id, dto);
                return NoContent();
            }
            catch (KeyNotFoundException)
            {
                return NotFound();
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error al guardar el apartado de información general del acta {IdActa}.", id);
                return StatusCode(500, "Ocurrió un error al guardar la información general.");
            }
        }
    }
}
