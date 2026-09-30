using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using SGGDIS_Api.Models.Dtos;
using SGGDIS_Api.Services;

namespace SGGDIS_Api.Controllers;

[ApiController]
[Route("api/auth")]
public class AuthController(IAuthService authService, ILogger<AuthController> logger, IHostEnvironment environment) : ControllerBase
{
    [AllowAnonymous]
    [HttpPost("registro-provisional")]
    public async Task<IActionResult> RegistrarUsuario(RegistroUsuarioDto solicitud)
    {
        if (!environment.IsDevelopment()) return NotFound();

        var resultado = await authService.RegistrarUsuarioAsync(solicitud);
        return resultado switch
        {
            ResultadoRegistroUsuario.Creado => StatusCode(StatusCodes.Status201Created, new { mensaje = "Cuenta creada. Ya puede iniciar sesión." }),
            ResultadoRegistroUsuario.CorreoRegistrado => Conflict(new { mensaje = "Ya existe una cuenta con ese correo." }),
            _ => BadRequest(new { mensaje = "Use un correo @misalud.go.cr válido y una contraseña de al menos 12 caracteres." })
        };
    }

    [AllowAnonymous]
    [HttpPost("login")]
    public async Task<IActionResult> Login(LoginRequestDto solicitud)
    {
        var idCodigo = await authService.IniciarSesionAsync(solicitud);
        return idCodigo is null
            ? Unauthorized(new { mensaje = "Correo o contraseña incorrectos." })
            : Ok(new { requiereVerificacion = true, idCodigo });
    }

    [AllowAnonymous]
    [HttpPost("verificar-codigo")]
    public async Task<IActionResult> VerificarCodigo(VerificarCodigoDto solicitud)
    {
        var sesion = await authService.VerificarCodigoAsync(solicitud);
        return sesion is null
            ? Unauthorized(new { mensaje = "El código es inválido o ha vencido." })
            : Ok(new { token = sesion.Token, correo = sesion.Correo, rol = sesion.Rol, expira = sesion.Expira });
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