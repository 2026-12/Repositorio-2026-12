using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Mvc.Filters;

namespace SGGDIS_Api.Controllers.OrdenesSanitarias
{
    /// <summary>
    /// Filtro que convierte los errores de lectura del cuerpo de la petición
    /// (campos con formato inválido u objetos obligatorios en null) en una
    /// respuesta 400 con la forma { "mensaje": "..." } en español.
    ///
    /// Sin este filtro, [ApiController] responde automáticamente con un
    /// ProblemDetails en inglés ("One or more validation errors occurred.")
    /// antes de que la petición llegue al servicio, y el frontend no puede
    /// mostrar un mensaje comprensible al inspector (EH9-03 / H5).
    ///
    /// Se ejecuta antes que el filtro automático de ASP.NET (Order menor que
    /// -2000). El detalle técnico de los errores solo se registra en el log
    /// (estándar P05).
    /// </summary>
    [AttributeUsage(AttributeTargets.Class | AttributeTargets.Method)]
    public sealed class ValidacionModeloOrdenSanitariaAttribute : ActionFilterAttribute
    {
        private const string MensajeDatosInvalidos =
            "Los datos de la Orden Sanitaria están incompletos o no tienen el formato esperado. Verifique la información e intente nuevamente.";

        /// <summary>
        /// Define el orden de ejecución para que el filtro corra antes que la
        /// validación automática de [ApiController].
        /// </summary>
        public ValidacionModeloOrdenSanitariaAttribute()
        {
            Order = int.MinValue;
        }

        /// <summary>
        /// Si el modelo recibido no es válido, detiene la petición y devuelve
        /// un 400 con un mensaje en español; el detalle se envía al log.
        /// </summary>
        public override void OnActionExecuting(ActionExecutingContext context)
        {
            if (context.ModelState.IsValid)
            {
                return;
            }

            var logger = context.HttpContext.RequestServices
                .GetService<ILogger<ValidacionModeloOrdenSanitariaAttribute>>();

            var camposConError = context.ModelState
                .Where(campo => campo.Value?.Errors.Count > 0)
                .Select(campo => campo.Key);

            logger?.LogWarning(
                "Petición de Orden Sanitaria rechazada por datos inválidos en: {Campos}",
                string.Join(", ", camposConError));

            context.Result = new BadRequestObjectResult(new { mensaje = MensajeDatosInvalidos });
        }
    }
}