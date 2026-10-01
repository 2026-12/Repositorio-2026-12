using Microsoft.AspNetCore.Mvc;
using SGGDIS_Api.Services.Ubicaciones;

namespace SGGDIS_Api.Controllers.Ubicaciones
{
    [ApiController]
    [Route("api/ubicaciones")]
    public class UbicacionesController
        : ControllerBase
    {
        private readonly IUbicacionService
            _ubicacionService;

        private readonly ILogger<
            UbicacionesController> _logger;

        public UbicacionesController(
            IUbicacionService ubicacionService,
            ILogger<UbicacionesController> logger)
        {
            _ubicacionService =
                ubicacionService;

            _logger = logger;
        }

        [HttpGet("provincias")]
        public async Task<IActionResult>
            ObtenerProvincias()
        {
            try
            {
                var provincias =
                    await _ubicacionService
                        .ObtenerProvinciasAsync();

                return Ok(provincias);
            }
            catch (Exception ex)
            {
                _logger.LogError(
                    ex,
                    "Error al obtener las provincias."
                );

                return StatusCode(
                    500,
                    "Ocurrio un error al obtener las provincias."
                );
            }
        }

        [HttpGet(
            "provincias/{idProvincia}/cantones")]
        public async Task<IActionResult>
            ObtenerCantones(
                int idProvincia)
        {
            try
            {
                var cantones =
                    await _ubicacionService
                        .ObtenerCantonesAsync(
                            idProvincia
                        );

                return Ok(cantones);
            }
            catch (Exception ex)
            {
                _logger.LogError(
                    ex,
                    "Error al obtener los cantones."
                );

                return StatusCode(
                    500,
                    "Ocurrio un error al obtener los cantones."
                );
            }
        }

        [HttpGet(
            "cantones/{idCanton}/distritos")]
        public async Task<IActionResult>
            ObtenerDistritos(
                int idCanton)
        {
            try
            {
                var distritos =
                    await _ubicacionService
                        .ObtenerDistritosAsync(
                            idCanton
                        );

                return Ok(distritos);
            }
            catch (Exception ex)
            {
                _logger.LogError(
                    ex,
                    "Error al obtener los distritos."
                );

                return StatusCode(
                    500,
                    "Ocurrio un error al obtener los distritos."
                );
            }
        }
    }
}