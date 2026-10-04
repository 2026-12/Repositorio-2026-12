using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using SGGDIS_Api.Models.Dtos;
using SGGDIS_Api.Security;
using SGGDIS_Api.Services;

namespace SGGDIS_Api.Controllers
{
    /// <summary>
    /// Endpoints del Acta de Inspección General (HU-004 y sub-HU HU-006 a
    /// HU-011). Cada apartado del wizard se guarda por su propia ruta, así el
    /// autoguardado de un apartado no obliga a que los demás estén completos.
    /// </summary>
    [Authorize(Roles = RolesSistema.OperacionActasYOrdenes)]
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

        // PUT /api/actas-generales/{id}/responsable : guarda (autoguardado) el Apartado II.
        [HttpPut("{id}/responsable")]
        public async Task<IActionResult> GuardarResponsable(int id, [FromBody] InfoResponsableActaDto dto)
        {
            try
            {
                await _actaGeneralService.GuardarResponsableAsync(id, dto);
                return NoContent();
            }
            catch (KeyNotFoundException)
            {
                return NotFound();
            }
            catch (ResponsableInvalidoException ex)
            {
                return BadRequest(ex.Message);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error al guardar el apartado del responsable del acta {IdActa}.", id);
                return StatusCode(500, "Ocurrió un error al guardar los datos del responsable.");
            }
        }

        // PUT /api/actas-generales/{id}/motivo : guarda (autoguardado) el Apartado III.
        [HttpPut("{id}/motivo")]
        public async Task<IActionResult> GuardarMotivo(int id, [FromBody] InfoMotivoActaDto dto)
        {
            try
            {
                await _actaGeneralService.GuardarMotivoAsync(id, dto);
                return NoContent();
            }
            catch (KeyNotFoundException)
            {
                return NotFound();
            }
            catch (MotivoInvalidoException ex)
            {
                return BadRequest(ex.Message);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error al guardar el apartado del motivo del acta {IdActa}.", id);
                return StatusCode(500, "Ocurrió un error al guardar el motivo de la inspección.");
            }
        }

        // PUT /api/actas-generales/{id}/hallazgos : guarda (autoguardado) el Apartado IV.
        [HttpPut("{id}/hallazgos")]
        public async Task<IActionResult> GuardarHallazgos(int id, [FromBody] InfoHallazgosActaDto dto)
        {
            try
            {
                await _actaGeneralService.GuardarHallazgosAsync(id, dto);
                return NoContent();
            }
            catch (KeyNotFoundException)
            {
                return NotFound();
            }
            catch (HallazgosInvalidosException ex)
            {
                return BadRequest(ex.Message);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error al guardar el apartado de hallazgos del acta {IdActa}.", id);
                return StatusCode(500, "Ocurrió un error al guardar los hallazgos de la inspección.");
            }
        }

        // PUT /api/actas-generales/{id}/acciones : guarda (autoguardado) el Apartado V.
        [HttpPut("{id}/acciones")]
        public async Task<IActionResult> GuardarAcciones(int id, [FromBody] InfoAccionesActaDto dto)
        {
            try
            {
                await _actaGeneralService.GuardarAccionesAsync(id, dto);
                return NoContent();
            }
            catch (KeyNotFoundException)
            {
                return NotFound();
            }
            catch (AccionesInvalidasException ex)
            {
                return BadRequest(ex.Message);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error al guardar el apartado de acciones a seguir del acta {IdActa}.", id);
                return StatusCode(500, "Ocurrió un error al guardar las acciones a seguir.");
            }
        }

        // PUT /api/actas-generales/{id}/cierre : guarda (autoguardado) el Apartado VI.
        [HttpPut("{id}/cierre")]
        public async Task<IActionResult> GuardarCierre(int id, [FromBody] InfoCierreActaDto dto)
        {
            try
            {
                await _actaGeneralService.GuardarCierreAsync(id, dto);
                return NoContent();
            }
            catch (KeyNotFoundException)
            {
                return NotFound();
            }
            catch (CierreInvalidoException ex)
            {
                return BadRequest(ex.Message);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error al guardar el apartado de cierre del acta {IdActa}.", id);
                return StatusCode(500, "Ocurrió un error al guardar el cierre de la inspección.");
            }
        }

        // DELETE /api/actas-generales/{id} : descarta un acta en curso (el
        // inspector salió sin terminarla desde "Volver al menú"), para que no
        // quede ocupando un folio a medio llenar.
        [HttpDelete("{id}")]
        public async Task<IActionResult> EliminarActa(int id)
        {
            try
            {
                var eliminada = await _actaGeneralService.EliminarActaAsync(id);
                return eliminada ? NoContent() : NotFound();
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error al eliminar el acta general {IdActa}.", id);
                return StatusCode(500, "Ocurrió un error al eliminar el acta.");
            }
        }
    }
}
