using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Http;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging.Abstractions;
using Moq;
using System.Security.Claims;
using SGGDIS_Api.Data;
using SGGDIS_Api.Models;
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
        {
            var contexto = TestDbContextFactory.Crear();
            contexto.Inspecciones.Add(new InsInspeccion
            {
                IdInspeccion = 1,
                IdArea = 7,
                Consecutivo = "TEST-001",
                NombreEstablecimiento = "Prueba",
                Fecha = DateTime.Today
            });
            contexto.SaveChanges();
            var controlador = new InspeccionesController(servicioMock.Object, NullLogger<InspeccionesController>.Instance, contexto);
            controlador.ControllerContext = new ControllerContext
            {
                HttpContext = new DefaultHttpContext
                {
                    User = new ClaimsPrincipal(new ClaimsIdentity(new[]
                    {
                        new Claim("area_id", "7")
                    }, "Test"))
                }
            };
            return controlador;
        }

        [Fact]
        public async Task CrearInspeccion_RechazaFechaAnteriorAHoy()
        {
            var servicioMock = new Mock<IInspeccionService>();
            var controlador = CrearControlador(servicioMock);

            var resultado = await controlador.CrearInspeccion(new CrearInspeccionDto { Fecha = DateTime.Today.AddDays(-1), IdArea = 7 });

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

            var resultado = await controlador.CrearInspeccion(new CrearInspeccionDto { Fecha = DateTime.Today, IdArea = 7 });

            Assert.IsType<ConflictObjectResult>(resultado);
        }

        [Fact]
        public async Task CrearInspeccion_ProhibeAreaDistintaALaAsignada()
        {
            var servicioMock = new Mock<IInspeccionService>();
            var controlador = CrearControlador(servicioMock);

            var resultado = await controlador.CrearInspeccion(new CrearInspeccionDto
            {
                Fecha = DateTime.Today,
                IdArea = 8
            });

            Assert.IsType<ForbidResult>(resultado);
            servicioMock.Verify(s => s.CrearInspeccionAsync(It.IsAny<CrearInspeccionDto>()), Times.Never);
        }

        [Fact]
        public async Task EliminarInspeccion_NoPermiteAccesoAInspeccionDeOtraArea()
        {
            var servicioMock = new Mock<IInspeccionService>();
            var controlador = CrearControlador(servicioMock);
            var resultado = await controlador.EliminarInspeccion(2);

            Assert.IsType<NotFoundResult>(resultado);
            servicioMock.Verify(s => s.EliminarInspeccionAsync(It.IsAny<int>()), Times.Never);
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
