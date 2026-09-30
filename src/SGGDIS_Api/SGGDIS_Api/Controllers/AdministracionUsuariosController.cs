using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using SGGDIS_Api.Data;
using SGGDIS_Api.Models.Dtos;
using SGGDIS_Api.Security;
using SGGDIS_Api.Services;

namespace SGGDIS_Api.Controllers;

[ApiController]
[Route("api/administracion/usuarios")]
[Authorize(Roles = RolesSistema.Administrador)]
public class AdministracionUsuariosController(SggdisDbContext db, IAuthService authService) : ControllerBase
{
    [HttpGet]
    public async Task<IActionResult> ObtenerUsuarios()
    {
        var usuarios = await db.Usuarios
            .Where(u => u.Rol == RolesSistema.Pendiente)  // Solo mostrar cuentas pendientes de asignación
            .Include(u => u.Area)
                .ThenInclude(a => a.Region)
            .Include(u => u.Region)
            .OrderBy(usuario => usuario.Correo)
            .Select(usuario => new
            {
                usuario.IdUsuario,
                usuario.Correo,
                usuario.Nombre,
                usuario.PrimerApellido,
                usuario.SegundoApellido,
                usuario.Identificacion,
                usuario.Rol,
                usuario.Activo,
                usuario.IdArea,
                IdRegion = usuario.Area == null ? usuario.IdRegion : usuario.Area.IdRegion,
                CodigoArea = usuario.Area == null ? null : usuario.Area.Codigo,
                NombreArea = usuario.Area == null ? null : usuario.Area.Nombre,
                CodigoRegion = usuario.Area == null ? (usuario.Region == null ? null : usuario.Region.Codigo) : usuario.Area.Region.Codigo,
                NombreRegion = usuario.Area == null ? (usuario.Region == null ? null : usuario.Region.Nombre) : usuario.Area.Region.Nombre
            })
            .ToListAsync();
        return Ok(usuarios);
    }

    [HttpGet("areas")]
    public async Task<IActionResult> ObtenerAreas()
    {
        var areas = await db.Areas
            .Include(a => a.Region)
            .OrderBy(area => area.Region.Nombre)
            .ThenBy(area => area.Nombre)
            .Select(area => new { area.IdArea, area.Nombre, area.IdRegion, NombreRegion = area.Region.Nombre })
            .ToListAsync();
        return Ok(areas);
    }

    [HttpGet("regiones")]
    public async Task<IActionResult> ObtenerRegiones()
    {
        var regiones = await db.Regiones
            .OrderBy(region => region.Nombre)
            .Select(region => new { region.IdRegion, region.Nombre })
            .ToListAsync();
        return Ok(regiones);
    }

    [HttpPost]
    public async Task<IActionResult> CrearUsuario(RegistroUsuarioDto solicitud)
    {
        var resultado = await authService.RegistrarUsuarioAsync(solicitud);
        return resultado switch
        {
            ResultadoRegistroUsuario.Creado => StatusCode(StatusCodes.Status201Created, new { mensaje = "Usuario creado correctamente." }),
            ResultadoRegistroUsuario.CorreoRegistrado => Conflict(new { mensaje = "Ya existe una cuenta con ese correo." }),
            _ => BadRequest(new { mensaje = "Verifique correo, contraseña, rol y área de trabajo." })
        };
    }

    [HttpPut("{idUsuario:int}/asignacion")]
    public async Task<IActionResult> ActualizarAsignacion(int idUsuario, ActualizarUsuarioAdminDto solicitud)
    {
        var resultado = await authService.ActualizarAsignacionAsync(idUsuario, solicitud.Rol, solicitud.IdArea, solicitud.IdRegion);
        return resultado switch
        {
            ResultadoRegistroUsuario.Creado => NoContent(),
            ResultadoRegistroUsuario.NoEncontrado => NotFound(),
            _ => BadRequest(new { mensaje = "Seleccione un rol permitido y asigne un área a los roles operativos." })
        };
    }

    [HttpGet("debug/token")]
    [AllowAnonymous]
    public async Task<IActionResult> DebugToken()
    {
        var token = Request.Headers["Authorization"].ToString().Replace("Bearer ", "");
        if (string.IsNullOrEmpty(token))
        {
            return Ok(new { error = "No hay token en el header Authorization" });
        }

        var claims = User.Claims.Select(c => new { c.Type, c.Value }).ToList();
        var userId = User.FindFirst("sub")?.Value;
        var sessionId = User.FindFirst("session_id")?.Value;
        var email = User.FindFirst("email")?.Value;
        var role = User.FindFirst("role")?.Value;
        var areaId = User.FindFirst("area_id")?.Value;

        var usuarioBd = userId != null && int.TryParse(userId, out var uId)
            ? await db.Usuarios.AsNoTracking().FirstOrDefaultAsync(u => u.IdUsuario == uId)
            : null;

        var sesionBd = sessionId != null && int.TryParse(sessionId, out var sId) && userId != null && int.TryParse(userId, out var pId)
            ? await db.Sesiones.AsNoTracking().FirstOrDefaultAsync(s =>
                s.IdSesion == sId && s.IdUsuario == pId && s.FechaRevocacion == null && s.FechaExpiracion > DateTime.UtcNow)
            : null;

        return Ok(new
        {
            tokenPresente = true,
            claims = claims,
            tokenClaims = new
            {
                sub = userId,
                sessionId = sessionId,
                email = email,
                role = role,
                areaId = areaId
            },
            usuarioBd = usuarioBd != null ? new
            {
                idUsuario = usuarioBd.IdUsuario,
                correo = usuarioBd.Correo,
                rol = usuarioBd.Rol,
                activo = usuarioBd.Activo,
                idArea = usuarioBd.IdArea
            } : null,
            sesionBd = sesionBd != null ? new
            {
                idSesion = sesionBd.IdSesion,
                idUsuario = sesionBd.IdUsuario,
                fechaExpiracion = sesionBd.FechaExpiracion,
                fechaRevocacion = sesionBd.FechaRevocacion
            } : null,
            validaciones = new
            {
                rolEnTokenMatcheaBd = role == usuarioBd?.Rol,
                usuarioActivo = usuarioBd?.Activo == "S",
                sesionValida = sesionBd != null,
                tokenExpirado = sesionBd?.FechaExpiracion <= DateTime.UtcNow
            }
        });
    }
}