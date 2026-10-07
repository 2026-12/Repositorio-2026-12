using System.Text.Json;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Mvc.Abstractions;
using Microsoft.AspNetCore.Mvc.Filters;
using Microsoft.AspNetCore.Mvc.ModelBinding;
using Microsoft.AspNetCore.Routing;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Logging.Abstractions;
using Moq;
using SGGDIS_Api.Controllers.OrdenesSanitarias;
using SGGDIS_Api.Models.Dtos.OrdenesSanitarias;
using SGGDIS_Api.Services.OrdenesSanitarias;
using Xunit;

namespace SGGDIS_Api.Tests.Controllers
{
    // Cubre la corrección del hallazgo H5 (EH9-01): el controlador de Órdenes
    // Sanitarias y su filtro de validación deben devolver los errores como JSON
    // con la propiedad "mensaje", que es la que lee el cliente HTTP del frontend,
    // y nunca revelar detalles técnicos (estándar P05).
    public class OrdenesSanitariasControllerTests
    {
        private const string MensajeDatosInvalidos =
            "Los datos de la Orden Sanitaria están incompletos o no tienen el formato esperado. Verifique la información e intente nuevamente.";

        /// <summary>
        /// Crea el controlador con un servicio simulado y sin logger real.
        /// </summary>
        private static OrdenesSanitariasController CrearControlador(Mock<IOrdenSanitariaService> servicioMock)
        {
            return new OrdenesSanitariasController(
                servicioMock.Object,
                NullLogger<OrdenesSanitariasController>.Instance);
        }

        /// <summary>
        /// Obtiene la propiedad "mensaje" del cuerpo de un ObjectResult tal como
        /// la recibiría el frontend al serializarse en JSON.
        /// </summary>
        private static string ObtenerMensaje(ObjectResult resultado)
        {
            var json = JsonSerializer.Serialize(
                resultado.Value,
                new JsonSerializerOptions { PropertyNamingPolicy = JsonNamingPolicy.CamelCase });

            using var documento = JsonDocument.Parse(json);
            return documento.RootElement.GetProperty("mensaje").GetString() ?? string.Empty;
        }

        /// <summary>
        /// Construye el contexto de ejecución que recibe el filtro, con el
        /// estado del modelo indicado.
        /// </summary>
        private static ActionExecutingContext CrearContextoFiltro(ModelStateDictionary estadoModelo)
        {
            var httpContext = new DefaultHttpContext
            {
                RequestServices = new ServiceCollection().BuildServiceProvider()
            };

            var actionContext = new ActionContext(httpContext, new RouteData(), new ActionDescriptor(), estadoModelo);

            return new ActionExecutingContext(
                actionContext,
                new List<IFilterMetadata>(),
                new Dictionary<string, object?>(),
                new object());
        }

        [Fact]
        public async Task CrearOrdenSanitaria_DevuelveMensajeJsonCuandoLosDatosNoSonValidos()
        {
            var servicioMock = new Mock<IOrdenSanitariaService>();
            servicioMock
                .Setup(s => s.CrearOrdenSanitariaAsync(It.IsAny<CrearOrdenSanitariaDto>()))
                .ThrowsAsync(new ArgumentException("Debe registrar al menos una ordenanza."));

            var resultado = await CrearControlador(servicioMock).CrearOrdenSanitaria(new CrearOrdenSanitariaDto());

            var badRequest = Assert.IsType<BadRequestObjectResult>(resultado);
            Assert.Equal("Debe registrar al menos una ordenanza.", ObtenerMensaje(badRequest));
        }

        [Fact]
        public async Task CrearOrdenSanitaria_DevuelveNotFoundConMensajeSiElDistritoNoExiste()
        {
            var servicioMock = new Mock<IOrdenSanitariaService>();
            servicioMock
                .Setup(s => s.CrearOrdenSanitariaAsync(It.IsAny<CrearOrdenSanitariaDto>()))
                .ThrowsAsync(new KeyNotFoundException("El distrito seleccionado no existe."));

            var resultado = await CrearControlador(servicioMock).CrearOrdenSanitaria(new CrearOrdenSanitariaDto());

            var notFound = Assert.IsType<NotFoundObjectResult>(resultado);
            Assert.Equal("El distrito seleccionado no existe.", ObtenerMensaje(notFound));
        }

        [Fact]
        public async Task CrearOrdenSanitaria_DevuelveConflictSinDetalleTecnicoSiFallaUnaRestriccionDeBaseDeDatos()
        {
            var servicioMock = new Mock<IOrdenSanitariaService>();
            servicioMock
                .Setup(s => s.CrearOrdenSanitariaAsync(It.IsAny<CrearOrdenSanitariaDto>()))
                .ThrowsAsync(new DbUpdateException("UQ_INS_ORDEN_SANITARIA_CONSECUTIVO"));

            var resultado = await CrearControlador(servicioMock).CrearOrdenSanitaria(new CrearOrdenSanitariaDto());

            var conflict = Assert.IsType<ConflictObjectResult>(resultado);
            Assert.DoesNotContain("UQ_INS", ObtenerMensaje(conflict));
        }

        [Fact]
        public async Task CrearOrdenSanitaria_OcultaElDetalleTecnicoEnErroresInesperados()
        {
            var servicioMock = new Mock<IOrdenSanitariaService>();
            servicioMock
                .Setup(s => s.CrearOrdenSanitariaAsync(It.IsAny<CrearOrdenSanitariaDto>()))
                .ThrowsAsync(new Exception("ORA-00942: table or view does not exist"));

            var resultado = await CrearControlador(servicioMock).CrearOrdenSanitaria(new CrearOrdenSanitariaDto());

            var error = Assert.IsType<ObjectResult>(resultado);
            Assert.Equal(StatusCodes.Status500InternalServerError, error.StatusCode);
            Assert.DoesNotContain("ORA-", ObtenerMensaje(error));
        }

        [Fact]
        public async Task ObtenerOrdenSanitaria_DevuelveNotFoundConMensajeSiLaOrdenNoExiste()
        {
            var servicioMock = new Mock<IOrdenSanitariaService>();
            servicioMock
                .Setup(s => s.ObtenerOrdenSanitariaAsync(5))
                .ReturnsAsync((OrdenSanitariaRespuestaDto?)null);

            var resultado = await CrearControlador(servicioMock).ObtenerOrdenSanitaria(5);

            var notFound = Assert.IsType<NotFoundObjectResult>(resultado);
            Assert.Equal("No se encontró la Orden Sanitaria solicitada.", ObtenerMensaje(notFound));
        }

        [Fact]
        public void ValidacionModelo_DevuelveMensajeEnEspanolCuandoLosDatosTienenFormatoInvalido()
        {
            var estadoModelo = new ModelStateDictionary();
            estadoModelo.AddModelError("Responsable", "The Responsable field is required.");
            var contexto = CrearContextoFiltro(estadoModelo);

            new ValidacionModeloOrdenSanitariaAttribute().OnActionExecuting(contexto);

            var badRequest = Assert.IsType<BadRequestObjectResult>(contexto.Result);
            Assert.Equal(MensajeDatosInvalidos, ObtenerMensaje(badRequest));
        }

        [Fact]
        public void ValidacionModelo_DejaContinuarLaPeticionCuandoLosDatosSonValidos()
        {
            var contexto = CrearContextoFiltro(new ModelStateDictionary());

            new ValidacionModeloOrdenSanitariaAttribute().OnActionExecuting(contexto);

            Assert.Null(contexto.Result);
        }
    }
}