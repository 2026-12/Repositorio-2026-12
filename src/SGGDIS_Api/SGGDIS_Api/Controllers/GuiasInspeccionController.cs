using Microsoft.AspNetCore.Mvc;
using SGGDIS_Api.Services;

namespace SGGDIS_Api.Controllers
{
    /// <summary>
    /// Endpoints de solo lectura del catálogo de una guía: qué tipos de
    /// establecimiento existen y qué secciones/ítems le corresponden a cada uno.
    /// No cambia con cada inspección, se usa para armar el formulario del frontend.
    /// </summary>
    [ApiController]
    [Route("api/guias-inspeccion")]
    public class GuiasInspeccionController : ControllerBase
    {
        private readonly ISeccionService _seccionService;
        private readonly ILogger<GuiasInspeccionController> _logger;

        public GuiasInspeccionController(ISeccionService seccionService, ILogger<GuiasInspeccionController> logger)
        {
            _seccionService = seccionService;
            _logger = logger;
        }

        // GET /api/guias-inspeccion/{idGuia}/tipos-establecimiento
        // Devuelve todos los tipos de establecimiento de una guía, con sus secciones.
        [HttpGet("{idGuia}/tipos-establecimiento")]
        public async Task<IActionResult> ObtenerTiposEstablecimiento(int idGuia)
        {
            try
            {
                var tipos = await _seccionService.ObtenerTiposPorGuiaAsync(idGuia);

                return Ok(tipos.Select(tipo => new
                {
                    tipo.IdTipoEstablecimiento,
                    tipo.IdGuia,
                    tipo.Nombre,
                    tipo.PuntajeMaximo,
                    Secciones = tipo.Secciones
                        .OrderBy(seccion => seccion.Orden)
                        .Select(seccion => new
                        {
                            seccion.Codigo,
                            seccion.Nombre,
                            seccion.Orden
                        })
                }));
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error al obtener los tipos de establecimiento de la guia {IdGuia}.", idGuia);
                return StatusCode(500, "Ocurrió un error al obtener los tipos de establecimiento.");
            }
        }

        // GET /api/guias-inspeccion/1/secciones/A
        // Devuelve una sección de la guía (con sus ítems) según su código.
        [HttpGet("{idGuia}/secciones/{codigo}")]
        public async Task<IActionResult> ObtenerSeccion(
            int idGuia,
            string codigo,
            [FromQuery] int? idTipoEstablecimiento = null)
        {
            try
            {
                var seccion = await _seccionService.ObtenerSeccionConItemsAsync(
                    idGuia,
                    codigo,
                    idTipoEstablecimiento);

                if (seccion == null)
                {
                    return NotFound();
                }

                return Ok(new
                {
                    seccion.IdSeccion,
                    seccion.Codigo,
                    seccion.Nombre,
                    Items = seccion.Items.Select(i => new
                    {
                        i.IdItem,
                        i.Articulo,
                        i.Descripcion,
                        i.Puntaje,
                        EsCritico = i.EsCritico == "S",
                        PermiteNoAplica = i.PermiteNoAplica == "S",
                        i.Orden
                    })
                });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error al obtener la seccion {Codigo} de la guia {IdGuia}.", codigo, idGuia);
                return StatusCode(500, "Ocurrió un error al obtener la sección.");
            }
        }
    }
}