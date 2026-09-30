using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using SGGDIS_Api.Models.Dtos;
using SGGDIS_Api.Services;

namespace SGGDIS_Api.Controllers;

[ApiController]
[Route("api/auth")]
public class AuthController(IAuthService authService, ILogger<AuthController> logger) : ControllerBase
{
    [AllowAnonymous]
    [HttpPost("login")]
    public async Task<IActionResult> Login(LoginRequestDto solicitud)
    {
        var resultado = await authService.IniciarSesionAsync(solicitud);
        if (resultado.Estado == EstadoInicioSesion.CredencialesInvalidas)
        {
            return Unauthorized(new { mensaje = "Correo o contraseña incorrectos." });
        }
        if (resultado.Estado == EstadoInicioSesion.AsignacionPendiente)
        {
            return StatusCode(StatusCodes.Status403Forbidden, new { codigo = "ASIGNACION_PENDIENTE", mensaje = "Su rol y/o área de trabajo aún no están asignados. Debe esperar a que el Administrador complete la asignación." });
        }

        var sesion = resultado.Sesion!;
        return Ok(new { token = sesion.Token, correo = sesion.Correo, rol = sesion.Rol, expira = sesion.Expira, idArea = sesion.IdArea, codigoRegion = sesion.CodigoRegion, codigoArea = sesion.CodigoArea, nombreRegion = sesion.NombreRegion, nombreArea = sesion.NombreArea });
    }

    [Authorize]
    [HttpPost("logout")]
    public async Task<IActionResult> Logout()
    {
        var idSesion = User.FindFirstValue("session_id");
        if (!int.TryParse(idSesion, out var parsedId)) return Unauthorized();
        await authService.CerrarSesionAsync(parsedId);
        logger.LogInformation("Sesión {IdSesion} cerrada.", parsedId);
        return NoContent();
    }
}