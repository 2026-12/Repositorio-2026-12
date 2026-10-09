using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Logging.Abstractions;
using Moq;
using SGGDIS_Api.Controllers;
using SGGDIS_Api.Models.Dtos;
using SGGDIS_Api.Services;
using Xunit;

namespace SGGDIS_Api.Tests.Controllers
{
    // Cubre cómo el controlador del Acta General traduce a respuestas HTTP la
    // creación, la consulta, el descarte y el guardado de los apartados I, II,
    // III, V y VI (HU-006, HU-007, HU-008, HU-010 y HU-011), usando un
    // IActaGeneralService simulado. El Apartado IV y el envío ya los cubre
    // ActaGeneralControllerTests.
    public class ActaGeneralApartadosControllerTests
    {
        private static ActaGeneralController CrearControlador(Mock<IActaGeneralService> servicioMock)
            => new(servicioMock.Object, NullLogger<ActaGeneralController>.Instance);

        // ---------- Crear, consultar y descartar ----------

        [Fact]
        public async Task CrearActa_DevuelveOkConElActaCreada()
        {
            var servicioMock = new Mock<IActaGeneralService>();
            servicioMock.Setup(s => s.CrearActaAsync())
                .ReturnsAsync(new ActaGeneralCreadaDto { IdActa = 7, NumeroActa = "2026-00007" });
            var controlador = CrearControlador(servicioMock);

            var resultado = await controlador.CrearActa();

            var ok = Assert.IsType<OkObjectResult>(resultado);
            Assert.Equal("2026-00007", ((ActaGeneralCreadaDto)ok.Value!).NumeroActa);
        }

        [Fact]
        public async Task CrearActa_Devuelve500SiElServicioFalla()
        {
            var servicioMock = new Mock<IActaGeneralService>();
            servicioMock.Setup(s => s.CrearActaAsync()).ThrowsAsync(new InvalidOperationException());
            var controlador = CrearControlador(servicioMock);

            var resultado = await controlador.CrearActa();

            Assert.Equal(500, Assert.IsType<ObjectResult>(resultado).StatusCode);
        }

        [Fact]
        public async Task ObtenerActa_DevuelveOkSiElActaExiste()
        {
            var servicioMock = new Mock<IActaGeneralService>();
            servicioMock.Setup(s => s.ObtenerActaAsync(3)).ReturnsAsync(new ActaGeneralDto { IdActa = 3, NumeroActa = "2026-00003" });
            var controlador = CrearControlador(servicioMock);

            var resultado = await controlador.ObtenerActa(3);

            Assert.IsType<OkObjectResult>(resultado);
        }

        [Fact]
        public async Task ObtenerActa_DevuelveNotFoundSiElActaNoExiste()
        {
            var servicioMock = new Mock<IActaGeneralService>();
            servicioMock.Setup(s => s.ObtenerActaAsync(It.IsAny<int>())).ReturnsAsync((ActaGeneralDto?)null);
            var controlador = CrearControlador(servicioMock);

            var resultado = await controlador.ObtenerActa(999);

            Assert.IsType<NotFoundResult>(resultado);
        }

        [Fact]
        public async Task EliminarActa_DevuelveNoContentSiSeElimina()
        {
            var servicioMock = new Mock<IActaGeneralService>();
            servicioMock.Setup(s => s.EliminarActaAsync(5)).ReturnsAsync(true);
            var controlador = CrearControlador(servicioMock);

            var resultado = await controlador.EliminarActa(5);

            Assert.IsType<NoContentResult>(resultado);
        }

        [Fact]
        public async Task EliminarActa_DevuelveNotFoundSiElActaNoExiste()
        {
            var servicioMock = new Mock<IActaGeneralService>();
            servicioMock.Setup(s => s.EliminarActaAsync(It.IsAny<int>())).ReturnsAsync(false);
            var controlador = CrearControlador(servicioMock);

            var resultado = await controlador.EliminarActa(999);

            Assert.IsType<NotFoundResult>(resultado);
        }

        // ---------- Apartado I ----------

        [Fact]
        public async Task GuardarInfoGeneral_DevuelveNoContentSiSeGuarda()
        {
            var servicioMock = new Mock<IActaGeneralService>();
            var controlador = CrearControlador(servicioMock);

            var resultado = await controlador.GuardarInfoGeneral(1, new InfoGeneralActaDto { NombreComercial = "Soda" });

            Assert.IsType<NoContentResult>(resultado);
            servicioMock.Verify(s => s.GuardarInfoGeneralAsync(1, It.IsAny<InfoGeneralActaDto>()), Times.Once);
        }

        [Fact]
        public async Task GuardarInfoGeneral_DevuelveNotFoundSiElActaNoExiste()
        {
            var servicioMock = new Mock<IActaGeneralService>();
            servicioMock.Setup(s => s.GuardarInfoGeneralAsync(It.IsAny<int>(), It.IsAny<InfoGeneralActaDto>()))
                .ThrowsAsync(new KeyNotFoundException());
            var controlador = CrearControlador(servicioMock);

            var resultado = await controlador.GuardarInfoGeneral(999, new InfoGeneralActaDto());

            Assert.IsType<NotFoundResult>(resultado);
        }

        // ---------- Apartado II ----------

        [Fact]
        public async Task GuardarResponsable_DevuelveNoContentSiSeGuarda()
        {
            var servicioMock = new Mock<IActaGeneralService>();
            var controlador = CrearControlador(servicioMock);

            var resultado = await controlador.GuardarResponsable(1, new InfoResponsableActaDto { NombreResponsable = "María" });

            Assert.IsType<NoContentResult>(resultado);
        }

        [Fact]
        public async Task GuardarResponsable_DevuelveBadRequestSiElCargoNoEsValido()
        {
            var servicioMock = new Mock<IActaGeneralService>();
            servicioMock.Setup(s => s.GuardarResponsableAsync(It.IsAny<int>(), It.IsAny<InfoResponsableActaDto>()))
                .ThrowsAsync(new ResponsableInvalidoException("Alguno de los cargos seleccionados no es válido."));
            var controlador = CrearControlador(servicioMock);

            var resultado = await controlador.GuardarResponsable(1, new InfoResponsableActaDto());

            Assert.IsType<BadRequestObjectResult>(resultado);
        }

        [Fact]
        public async Task GuardarResponsable_DevuelveNotFoundSiElActaNoExiste()
        {
            var servicioMock = new Mock<IActaGeneralService>();
            servicioMock.Setup(s => s.GuardarResponsableAsync(It.IsAny<int>(), It.IsAny<InfoResponsableActaDto>()))
                .ThrowsAsync(new KeyNotFoundException());
            var controlador = CrearControlador(servicioMock);

            var resultado = await controlador.GuardarResponsable(999, new InfoResponsableActaDto());

            Assert.IsType<NotFoundResult>(resultado);
        }

        // ---------- Apartado III ----------

        [Fact]
        public async Task GuardarMotivo_DevuelveNoContentSiSeGuarda()
        {
            var servicioMock = new Mock<IActaGeneralService>();
            var controlador = CrearControlador(servicioMock);

            var resultado = await controlador.GuardarMotivo(1, new InfoMotivoActaDto { MotivoInspeccion = new List<string> { "SEGUIMIENTO" } });

            Assert.IsType<NoContentResult>(resultado);
        }

        [Fact]
        public async Task GuardarMotivo_DevuelveBadRequestSiElMotivoNoEsValido()
        {
            var servicioMock = new Mock<IActaGeneralService>();
            servicioMock.Setup(s => s.GuardarMotivoAsync(It.IsAny<int>(), It.IsAny<InfoMotivoActaDto>()))
                .ThrowsAsync(new MotivoInvalidoException("Alguno de los motivos seleccionados no es válido."));
            var controlador = CrearControlador(servicioMock);

            var resultado = await controlador.GuardarMotivo(1, new InfoMotivoActaDto());

            Assert.IsType<BadRequestObjectResult>(resultado);
        }

        // ---------- Apartado V ----------

        [Fact]
        public async Task GuardarAcciones_DevuelveNoContentSiSeGuarda()
        {
            var servicioMock = new Mock<IActaGeneralService>();
            var controlador = CrearControlador(servicioMock);

            var resultado = await controlador.GuardarAcciones(1, new InfoAccionesActaDto { Acciones = new List<string> { "CIERRE_CASO" } });

            Assert.IsType<NoContentResult>(resultado);
        }

        [Fact]
        public async Task GuardarAcciones_DevuelveBadRequestSiLaAccionNoEsValida()
        {
            var servicioMock = new Mock<IActaGeneralService>();
            servicioMock.Setup(s => s.GuardarAccionesAsync(It.IsAny<int>(), It.IsAny<InfoAccionesActaDto>()))
                .ThrowsAsync(new AccionesInvalidasException("Alguna de las acciones seleccionadas no es válida."));
            var controlador = CrearControlador(servicioMock);

            var resultado = await controlador.GuardarAcciones(1, new InfoAccionesActaDto());

            Assert.IsType<BadRequestObjectResult>(resultado);
        }

        // ---------- Apartado VI ----------

        [Fact]
        public async Task GuardarCierre_DevuelveNoContentSiSeGuarda()
        {
            var servicioMock = new Mock<IActaGeneralService>();
            var controlador = CrearControlador(servicioMock);

            var resultado = await controlador.GuardarCierre(1, new InfoCierreActaDto
            {
                PersonasPresentes = new List<PersonaPresenteDto> { new() { NombreCompleto = "Juan" } },
            });

            Assert.IsType<NoContentResult>(resultado);
        }

        [Fact]
        public async Task GuardarCierre_DevuelveBadRequestSiUnaPersonaTieneDatosDemasiadoLargos()
        {
            var servicioMock = new Mock<IActaGeneralService>();
            servicioMock.Setup(s => s.GuardarCierreAsync(It.IsAny<int>(), It.IsAny<InfoCierreActaDto>()))
                .ThrowsAsync(new CierreInvalidoException("La firma de una persona presente no puede superar los 200 caracteres."));
            var controlador = CrearControlador(servicioMock);

            var resultado = await controlador.GuardarCierre(1, new InfoCierreActaDto());

            Assert.IsType<BadRequestObjectResult>(resultado);
        }

        [Fact]
        public async Task GuardarCierre_DevuelveNotFoundSiElActaNoExiste()
        {
            var servicioMock = new Mock<IActaGeneralService>();
            servicioMock.Setup(s => s.GuardarCierreAsync(It.IsAny<int>(), It.IsAny<InfoCierreActaDto>()))
                .ThrowsAsync(new KeyNotFoundException());
            var controlador = CrearControlador(servicioMock);

            var resultado = await controlador.GuardarCierre(999, new InfoCierreActaDto());

            Assert.IsType<NotFoundResult>(resultado);
        }
    }
}
