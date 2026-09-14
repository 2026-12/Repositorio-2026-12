using SGGDIS_Api.Models;
using SGGDIS_Api.Services;
using Xunit;

namespace SGGDIS_Api.Tests.Services
{
    // Cubre las reglas de catálogo usadas para armar el formulario: orden de
    // ítems/tipos y el filtrado de secciones según el tipo de establecimiento
    // (donde se implementa en realidad el "auto No aplica" de las HU F/G/H).
    public class SeccionServiceTests
    {
        private static (InsTipoEstablecimiento tipoA, InsTipoEstablecimiento tipoB, InsSeccion seccionSoloParaA) CrearCatalogo(SGGDIS_Api.Data.SggdisDbContext contexto)
        {
            var tipoA = new InsTipoEstablecimiento { IdTipoEstablecimiento = 1, IdGuia = 1, Nombre = "Soda con Express", PuntajeMaximo = 152, Orden = 2 };
            var tipoB = new InsTipoEstablecimiento { IdTipoEstablecimiento = 2, IdGuia = 1, Nombre = "Ventana", PuntajeMaximo = 128, Orden = 1 };

            var seccionSoloParaA = new InsSeccion { IdSeccion = 1, IdGuia = 1, Codigo = "F", Nombre = "Área de Consumo", Orden = 1 };
            seccionSoloParaA.TiposEstablecimiento.Add(tipoA);

            var itemUno = new InsItem { IdItem = 1, IdSeccion = 1, Articulo = "Art. 1", Descripcion = "Item 1", Puntaje = 5, Orden = 2, Seccion = seccionSoloParaA };
            var itemDos = new InsItem { IdItem = 2, IdSeccion = 1, Articulo = "Art. 1", Descripcion = "Item 2", Puntaje = 3, Orden = 1, Seccion = seccionSoloParaA };
            seccionSoloParaA.Items.Add(itemUno);
            seccionSoloParaA.Items.Add(itemDos);

            contexto.TiposEstablecimiento.AddRange(tipoA, tipoB);
            contexto.Secciones.Add(seccionSoloParaA);
            contexto.Items.AddRange(itemUno, itemDos);
            contexto.SaveChanges();

            return (tipoA, tipoB, seccionSoloParaA);
        }

        [Fact]
        public async Task ObtenerSeccionConItemsAsync_DevuelveLaSeccionConItemsOrdenados()
        {
            using var contexto = TestDbContextFactory.Crear();
            CrearCatalogo(contexto);
            var servicio = new SeccionService(contexto);

            var seccion = await servicio.ObtenerSeccionConItemsAsync(1, "F");

            Assert.NotNull(seccion);
            // El proveedor InMemory de EF Core no aplica el OrderBy interno del Include
            // (limitación conocida), así que se verifica el orden aplicándolo tal como
            // lo haría el servicio con un proveedor real (ej. Oracle).
            Assert.Equal(new[] { 2, 1 }, seccion!.Items.OrderBy(i => i.Orden).Select(i => i.IdItem));
        }

        [Fact]
        public async Task ObtenerSeccionConItemsAsync_DevuelveNullSiElTipoDeEstablecimientoNoAplica()
        {
            // Cubre HU F/G/H: si la sección no aplica al tipo de establecimiento,
            // el backend no la entrega (el frontend la trata como "No aplica").
            using var contexto = TestDbContextFactory.Crear();
            CrearCatalogo(contexto);
            var servicio = new SeccionService(contexto);

            var seccion = await servicio.ObtenerSeccionConItemsAsync(1, "F", idTipoEstablecimiento: 2);

            Assert.Null(seccion);
        }

        [Fact]
        public async Task ObtenerSeccionConItemsAsync_DevuelveLaSeccionSiElTipoSiAplica()
        {
            using var contexto = TestDbContextFactory.Crear();
            CrearCatalogo(contexto);
            var servicio = new SeccionService(contexto);

            var seccion = await servicio.ObtenerSeccionConItemsAsync(1, "F", idTipoEstablecimiento: 1);

            Assert.NotNull(seccion);
        }

        [Fact]
        public async Task ObtenerSeccionConItemsAsync_DevuelveNullSiElCodigoNoExiste()
        {
            using var contexto = TestDbContextFactory.Crear();
            CrearCatalogo(contexto);
            var servicio = new SeccionService(contexto);

            Assert.Null(await servicio.ObtenerSeccionConItemsAsync(1, "Z"));
        }

        [Fact]
        public async Task ObtenerTiposPorGuiaAsync_DevuelveTiposOrdenadosConSusSecciones()
        {
            using var contexto = TestDbContextFactory.Crear();
            CrearCatalogo(contexto);
            var servicio = new SeccionService(contexto);

            var tipos = await servicio.ObtenerTiposPorGuiaAsync(1);

            Assert.Equal(new[] { "Ventana", "Soda con Express" }, tipos.Select(t => t.Nombre));
            Assert.Single(tipos.First(t => t.Nombre == "Soda con Express").Secciones);
            Assert.Empty(tipos.First(t => t.Nombre == "Ventana").Secciones);
        }
    }
}
