using Microsoft.AspNetCore.Mvc;
using SGGDIS_Api.Models.Dtos.OrdenesSanitarias;
using SGGDIS_Api.Services.OrdenesSanitarias;

namespace SGGDIS_Api.Controllers.OrdenesSanitarias
{
    [ApiController]
    [Route("api/ordenes-sanitarias")]
    public class OrdenesSanitariasController : ControllerBase
    {
        private readonly IOrdenSanitariaService _ordenSanitariaService;
        private readonly ILogger<OrdenesSanitariasController> _logger;

        public OrdenesSanitariasController(IOrdenSanitariaService ordenSanitariaService, ILogger<OrdenesSanitariasController> logger)
        {
            _ordenSanitariaService = ordenSanitariaService;
            _logger = logger;
        }

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
                return BadRequest(ex.Message);
            }
            catch (KeyNotFoundException ex)
            {
                return NotFound(ex.Message);
            }
            catch (InvalidOperationException ex)
            {
                return Conflict(ex.Message);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error al crear la Orden Sanitaria.");
                return StatusCode(500, "Ocurrio un error al crear la Orden Sanitaria.");
            }
        }

        [HttpGet("{id}")]
        public async Task<IActionResult> ObtenerOrdenSanitaria(int id)
        {
            try
            {
                var orden = await _ordenSanitariaService.ObtenerOrdenSanitariaAsync(id);

                if (orden == null) return NotFound();

                return Ok(orden);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error al obtener la Orden Sanitaria {IdOrdenSanitaria}.", id);
                return StatusCode(500, "Ocurrio un error al obtener la Orden Sanitaria.");
            }
        }

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
                return StatusCode(500, "Ocurrio un error al consultar las Ordenes Sanitarias.");
            }
        }
    }
}