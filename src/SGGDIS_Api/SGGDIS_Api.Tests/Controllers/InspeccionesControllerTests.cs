using Microsoft.AspNetCore.Mvc;
using Moq;
using SGGDIS_Api.Controllers;
using SGGDIS_Api.Models.Dtos;
using SGGDIS_Api.Services;
using Xunit;

namespace SGGDIS_Api.Tests.Controllers
{
    // Cubre cómo el controlador traduce las reglas de negocio a respuestas HTTP,
    // usando un IInspeccionService simulado (Moq) en vez de una base de datos real.
    public class InspeccionesControllerTests
    {
        private static InspeccionesController CrearControlador(Mock<IInspeccionService> servicioMock)
            => new(servicioMock.Object);

        [Fact]
        public async Task CrearInspeccion_RechazaFechaAnteriorAHoy()
        {
            var servicioMock = new Mock<IInspeccionService>();
            var controlador = CrearControlador(servicioMock);

            var resultado = await controlador.CrearInspeccion(new CrearInspeccionDto { Fecha = DateTime.Today.AddDays(-1) });

            Assert.IsType<BadRequestObjectResult>(resultado);
            servicioMock.Verify(s => s.CrearInspeccionAsync(It.IsAny<CrearInspeccionDto>()), Times.Never);
        }

        [Fact]
        public async Task CrearInspeccion_DevuelveConflictSiElConsecutivoYaExiste()
        {
            var servicioMock = new Mock<IInspeccionService>();
            servicioMock.Setup(s => s.CrearInspeccionAsync(It.IsAny<CrearInspeccionDto>()))
                .ThrowsAsync(new ConsecutivoDuplicadoException());
            var controlador = CrearControlador(servicioMock);

            var resultado = await controlador.CrearInspeccion(new CrearInspeccionDto { Fecha = DateTime.Today });

            Assert.IsType<ConflictObjectResult>(resultado);
        }

        [Fact]
        public async Task CerrarInspeccion_DevuelveBadRequestSiFaltanCamposObligatorios()
        {
            var servicioMock = new Mock<IInspeccionService>();
            servicioMock.Setup(s => s.CerrarInspeccionAsync(It.IsAny<int>(), It.IsAny<CerrarInspeccionDto>()))
                .ThrowsAsync(new CamposCierreIncompletosException());
            var controlador = CrearControlador(servicioMock);

            var resultado = await controlador.CerrarInspeccion(1, new CerrarInspeccionDto());

            Assert.IsType<BadRequestObjectResult>(resultado);
        }

        [Fact]
        public async Task CerrarInspeccion_DevuelveConflictSiHaySeccionesIncompletas()
        {
            var servicioMock = new Mock<IInspeccionService>();
            servicioMock.Setup(s => s.CerrarInspeccionAsync(It.IsAny<int>(), It.IsAny<CerrarInspeccionDto>()))
                .ThrowsAsync(new SeccionesIncompletasException());
            var controlador = CrearControlador(servicioMock);

            var resultado = await controlador.CerrarInspeccion(1, new CerrarInspeccionDto());

            Assert.IsType<ConflictObjectResult>(resultado);
        }

        [Fact]
        public async Task CerrarInspeccion_DevuelveNotFoundSiLaInspeccionNoExiste()
        {
            var servicioMock = new Mock<IInspeccionService>();
            servicioMock.Setup(s => s.CerrarInspeccionAsync(It.IsAny<int>(), It.IsAny<CerrarInspeccionDto>()))
                .ThrowsAsync(new KeyNotFoundException());
            var controlador = CrearControlador(servicioMock);

            var resultado = await controlador.CerrarInspeccion(1, new CerrarInspeccionDto());

            Assert.IsType<NotFoundResult>(resultado);
        }

        [Fact]
        public async Task CerrarInspeccion_DevuelveOkConElResumenCuandoTieneExito()
        {
            var resumenEsperado = new ResumenCierreDto { PuntajeObtenido = 8, PuntajeMaximo = 14, Porcentaje = 57.14m, Clasificacion = "Condiciones inaceptables" };
            var servicioMock = new Mock<IInspeccionService>();
            servicioMock.Setup(s => s.CerrarInspeccionAsync(It.IsAny<int>(), It.IsAny<CerrarInspeccionDto>()))
                .ReturnsAsync(resumenEsperado);
            var controlador = CrearControlador(servicioMock);

            var resultado = await controlador.CerrarInspeccion(1, new CerrarInspeccionDto());

            var okResult = Assert.IsType<OkObjectResult>(resultado);
            Assert.Same(resumenEsperado, okResult.Value);
        }

        [Fact]
        public async Task EliminarInspeccion_DevuelveNotFoundSiNoExiste()
        {
            var servicioMock = new Mock<IInspeccionService>();
            servicioMock.Setup(s => s.EliminarInspeccionAsync(It.IsAny<int>())).ReturnsAsync(false);
            var controlador = CrearControlador(servicioMock);

            var resultado = await controlador.EliminarInspeccion(1);

            Assert.IsType<NotFoundResult>(resultado);
        }

        [Fact]
        public async Task EliminarInspeccion_DevuelveNoContentSiSeElimino()
        {
            var servicioMock = new Mock<IInspeccionService>();
            servicioMock.Setup(s => s.EliminarInspeccionAsync(It.IsAny<int>())).ReturnsAsync(true);
            var controlador = CrearControlador(servicioMock);

            var resultado = await controlador.EliminarInspeccion(1);

            Assert.IsType<NoContentResult>(resultado);
        }
    }
}
