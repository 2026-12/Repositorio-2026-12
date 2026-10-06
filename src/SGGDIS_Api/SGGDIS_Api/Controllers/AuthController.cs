using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.RateLimiting;
using SGGDIS_Api.Models.Dtos;
using SGGDIS_Api.Services;

namespace SGGDIS_Api.Controllers;

[ApiController]
[Route("api/auth")]
public class AuthController(IAuthService authService, ILogger<AuthController> logger, IConfiguration configuration) : ControllerBase
{
    private const string CookieRefresh = "__Host-sggdis-refresh";

    [AllowAnonymous]
    [EnableRateLimiting("login")]
    [HttpPost("login")]
    public async Task<IActionResult> Login(LoginRequestDto solicitud)
    {
        var resultado = await authService.IniciarSesionAsync(solicitud);
        if (resultado.Estado == EstadoInicioSesion.CredencialesInvalidas)
        {
            logger.LogWarning("Intento de inicio de sesión fallido desde {RemoteIpAddress}.", HttpContext.Connection.RemoteIpAddress);
            return Unauthorized(new { mensaje = "Correo o contraseña incorrectos." });
        }
        if (resultado.Estado == EstadoInicioSesion.AsignacionPendiente)
        {
            return StatusCode(StatusCodes.Status403Forbidden, new { codigo = "ASIGNACION_PENDIENTE", mensaje = "Su rol y/o área de trabajo aún no están asignados. Debe esperar a que el Administrador complete la asignación." });
        }

        var sesion = resultado.Sesion!;
        EstablecerCookieRefresh(sesion.RefreshToken, sesion.RefreshExpira);
        return Ok(RespuestaSesion(sesion));
    }

    [AllowAnonymous]
    [EnableRateLimiting("register")]
    [HttpPost("register")]
    public async Task<IActionResult> Registrar(RegistroPublicoDto solicitud)
    {
        var resultado = await authService.RegistrarUsuarioPendienteAsync(solicitud);
        return resultado switch
        {
            ResultadoRegistroUsuario.Creado => StatusCode(StatusCodes.Status201Created, new
            {
                mensaje = "Cuenta creada. El Administrador debe asignarle rol, región y área antes de que pueda ingresar."
            }),
            ResultadoRegistroUsuario.CorreoRegistrado => Conflict(new { mensaje = "Ya existe una cuenta con ese correo." }),
            ResultadoRegistroUsuario.IdentificacionRegistrada => Conflict(new { mensaje = "Ya existe una cuenta con esa identificación." }),
            _ => BadRequest(new { mensaje = "Verifique sus datos, use un correo institucional y una contraseña de al menos 12 caracteres." })
        };
    }

    [AllowAnonymous]
    [HttpPost("refresh")]
    public async Task<IActionResult> Refresh()
    {
        var origen = Request.Headers.Origin.ToString();
        var origenesPermitidos = configuration.GetSection("Frontend:AllowedOrigins").Get<string[]>()
            ?? ["http://localhost:5173", "http://127.0.0.1:5173"];
        if (!string.IsNullOrEmpty(origen) && !origenesPermitidos.Contains(origen, StringComparer.OrdinalIgnoreCase)) 
            return Forbid();

        var refreshToken = Request.Cookies[CookieRefresh];
        var sesion = await authService.RenovarSesionAsync(refreshToken ?? string.Empty);
        if (sesion is null)
        {
            Response.Cookies.Delete(CookieRefresh, OpcionesCookieRefresh());
            return Unauthorized(new { mensaje = "La sesión no es válida o ha finalizado." });
        }

        EstablecerCookieRefresh(sesion.RefreshToken, sesion.RefreshExpira);
        return Ok(RespuestaSesion(sesion));
    }

    [Authorize]
    [HttpPost("logout")]
    public async Task<IActionResult> Logout()
    {
        var idSesion = User.FindFirstValue("session_id");
        if (!int.TryParse(idSesion, out var parsedId)) return Unauthorized();
        await authService.CerrarSesionAsync(parsedId);
        Response.Cookies.Delete(CookieRefresh, OpcionesCookieRefresh());
        logger.LogInformation("Sesión {IdSesion} cerrada.", parsedId);
        return NoContent();
    }

    private void EstablecerCookieRefresh(string token, DateTime expira)
    {
        Response.Cookies.Append(CookieRefresh, token, OpcionesCookieRefresh(expira));
    }

    private static CookieOptions OpcionesCookieRefresh(DateTime? expira = null) => new()
    {
        HttpOnly = true,
        Secure = true,
        SameSite = SameSiteMode.None,
        Path = "/",
        Expires = expira.HasValue
            ? new DateTimeOffset(DateTime.SpecifyKind(expira.Value, DateTimeKind.Utc))
            : null
    };

    private static object RespuestaSesion(SesionAutenticada sesion) => new
    {
        token = sesion.Token,
        correo = sesion.Correo,
        rol = sesion.Rol,
        expira = sesion.Expira,
        areasAsignadas = sesion.AreasAsignadas,
        idArea = sesion.IdArea,
        codigoRegion = sesion.CodigoRegion,
        codigoArea = sesion.CodigoArea,
        nombreRegion = sesion.NombreRegion,
        nombreArea = sesion.NombreArea,
        nombre = sesion.Nombre,
        primerApellido = sesion.PrimerApellido,
        segundoApellido = sesion.SegundoApellido,
        identificacion = sesion.Identificacion
    };
}