using Microsoft.AspNetCore.Mvc;
using SGGDIS_Api.Services;

namespace SGGDIS_Api.Controllers
{
    [ApiController]
    [Route("api/guias-inspeccion")]
    public class GuiasInspeccionController : ControllerBase
    {
        private readonly ISeccionService _seccionService;

        public GuiasInspeccionController(ISeccionService seccionService)
        {
            _seccionService = seccionService;
        }

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
            catch (Exception)
            {
                return StatusCode(500, "Ocurrió un error al obtener los tipos de establecimiento.");
            }
        }

        /// Devuelve una sección de la guía (con sus ítems) según su código, ej. GET /api/guias-inspeccion/1/secciones/A

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
            catch (Exception)
            {
                return StatusCode(500, "Ocurrió un error al obtener la sección.");
            }
        }
    }
}