using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Logging.Abstractions;
using Moq;
using SGGDIS_Api.Controllers;
using SGGDIS_Api.Models.Dtos;
using SGGDIS_Api.Services;
using Xunit;

namespace SGGDIS_Api.Tests.Controllers
{
    // Cubre cómo el controlador del Acta General traduce el guardado del
    // Apartado IV (HU-009) a respuestas HTTP, usando un IActaGeneralService simulado.
    public class ActaGeneralControllerTests
    {
        private static ActaGeneralController CrearControlador(Mock<IActaGeneralService> servicioMock)
            => new(servicioMock.Object, NullLogger<ActaGeneralController>.Instance);

        [Fact]
        public async Task GuardarHallazgos_DevuelveNoContentSiSeGuarda()
        {
            var servicioMock = new Mock<IActaGeneralService>();
            var controlador = CrearControlador(servicioMock);

            var resultado = await controlador.GuardarHallazgos(1, new InfoHallazgosActaDto { IdsGuias = new List<int> { 1 }, Hallazgos = "Hallazgo" });

            Assert.IsType<NoContentResult>(resultado);
            servicioMock.Verify(s => s.GuardarHallazgosAsync(1, It.IsAny<InfoHallazgosActaDto>()), Times.Once);
        }

        [Fact]
        public async Task GuardarHallazgos_DevuelveNotFoundSiElActaNoExiste()
        {
            var servicioMock = new Mock<IActaGeneralService>();
            servicioMock.Setup(s => s.GuardarHallazgosAsync(It.IsAny<int>(), It.IsAny<InfoHallazgosActaDto>()))
                .ThrowsAsync(new KeyNotFoundException());
            var controlador = CrearControlador(servicioMock);

            var resultado = await controlador.GuardarHallazgos(999, new InfoHallazgosActaDto());

            Assert.IsType<NotFoundResult>(resultado);
        }

        [Fact]
        public async Task GuardarHallazgos_DevuelveBadRequestSiLaGuiaNoExiste()
        {
            var servicioMock = new Mock<IActaGeneralService>();
            servicioMock.Setup(s => s.GuardarHallazgosAsync(It.IsAny<int>(), It.IsAny<InfoHallazgosActaDto>()))
                .ThrowsAsync(new HallazgosInvalidosException("Alguna de las guías seleccionadas no existe."));
            var controlador = CrearControlador(servicioMock);

            var resultado = await controlador.GuardarHallazgos(1, new InfoHallazgosActaDto { IdsGuias = new List<int> { 99 } });

            Assert.IsType<BadRequestObjectResult>(resultado);
        }

        [Fact]
        public async Task EnviarActa_DevuelveNoContentSiSeEnvia()
        {
            var servicioMock = new Mock<IActaGeneralService>();
            var controlador = CrearControlador(servicioMock);

            var resultado = await controlador.EnviarActa(1, new EnvioActaGeneralDto());

            Assert.IsType<NoContentResult>(resultado);
            servicioMock.Verify(s => s.EnviarActaAsync(1, It.IsAny<EnvioActaGeneralDto>()), Times.Once);
        }

        [Fact]
        public async Task EnviarActa_DevuelveConflictSiYaEstabaFinalizada()
        {
            var servicioMock = new Mock<IActaGeneralService>();
            servicioMock.Setup(s => s.EnviarActaAsync(It.IsAny<int>(), It.IsAny<EnvioActaGeneralDto>()))
                .ThrowsAsync(new ActaYaFinalizadaException("El acta ya fue enviada."));
            var controlador = CrearControlador(servicioMock);

            var resultado = await controlador.EnviarActa(1, new EnvioActaGeneralDto());

            Assert.IsType<ConflictObjectResult>(resultado);
        }

        [Fact]
        public async Task EnviarActa_DevuelveBadRequestSiUnApartadoEsInvalido()
        {
            var servicioMock = new Mock<IActaGeneralService>();
            servicioMock.Setup(s => s.EnviarActaAsync(It.IsAny<int>(), It.IsAny<EnvioActaGeneralDto>()))
                .ThrowsAsync(new AccionesInvalidasException("Alguna de las acciones seleccionadas no es válida."));
            var controlador = CrearControlador(servicioMock);

            var resultado = await controlador.EnviarActa(1, new EnvioActaGeneralDto());

            Assert.IsType<BadRequestObjectResult>(resultado);
        }

        [Fact]
        public async Task EnviarActa_DevuelveNotFoundSiElActaNoExiste()
        {
            var servicioMock = new Mock<IActaGeneralService>();
            servicioMock.Setup(s => s.EnviarActaAsync(It.IsAny<int>(), It.IsAny<EnvioActaGeneralDto>()))
                .ThrowsAsync(new KeyNotFoundException());
            var controlador = CrearControlador(servicioMock);

            var resultado = await controlador.EnviarActa(999, new EnvioActaGeneralDto());

            Assert.IsType<NotFoundResult>(resultado);
        }
    }
}
