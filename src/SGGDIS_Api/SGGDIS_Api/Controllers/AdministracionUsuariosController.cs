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
            .OrderBy(usuario => usuario.Correo)
            .Select(usuario => new
            {
                usuario.IdUsuario,
                usuario.Correo,
                usuario.Rol,
                usuario.Activo,
                usuario.IdArea,
                CodigoArea = usuario.Area == null ? null : usuario.Area.Codigo,
                NombreArea = usuario.Area == null ? null : usuario.Area.Nombre,
                CodigoRegion = usuario.Area == null ? null : usuario.Area.Region.Codigo,
                NombreRegion = usuario.Area == null ? null : usuario.Area.Region.Nombre
            })
            .ToListAsync();
        return Ok(usuarios);
    }

    [HttpGet("areas")]
    public async Task<IActionResult> ObtenerAreas()
    {
        var areas = await db.Areas
            .OrderBy(area => area.Region.Nombre)
            .ThenBy(area => area.Nombre)
            .Select(area => new { area.IdArea, area.Nombre, area.IdRegion, NombreRegion = area.Region.Nombre })
            .ToListAsync();
        return Ok(areas);
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
        var resultado = await authService.ActualizarAsignacionAsync(idUsuario, solicitud.Rol, solicitud.IdArea);
        return resultado switch
        {
            ResultadoRegistroUsuario.Creado => NoContent(),
            ResultadoRegistroUsuario.NoEncontrado => NotFound(),
            _ => BadRequest(new { mensaje = "Seleccione un rol permitido y asigne un área a los roles operativos." })
        };
    }
}