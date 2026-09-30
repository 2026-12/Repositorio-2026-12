using System.Security.Cryptography;
using System.Text;
using System.Net.Mail;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using SGGDIS_Api.Data;
using SGGDIS_Api.Models;
using SGGDIS_Api.Models.Dtos;
using SGGDIS_Api.Security;

namespace SGGDIS_Api.Services;

public class AuthService : IAuthService
{
    private static readonly TimeSpan VigenciaSesion = TimeSpan.FromHours(8);
    private readonly SggdisDbContext _db;
    private readonly IPasswordHasher<SegUsuario> _hasher;

    public AuthService(SggdisDbContext db, IPasswordHasher<SegUsuario> hasher)
    {
        _db = db;
        _hasher = hasher;
    }

    public async Task<ResultadoInicioSesion> IniciarSesionAsync(LoginRequestDto solicitud)
    {
        var correo = solicitud.Correo.Trim().ToLowerInvariant();
        var usuario = await _db.Usuarios
            .Include(u => u.Area)
            .ThenInclude(area => area!.Region)
            .SingleOrDefaultAsync(u => u.Correo == correo && u.Activo == "S");
        if (usuario is null || _hasher.VerifyHashedPassword(usuario, usuario.HashContrasena, solicitud.Contrasena) == PasswordVerificationResult.Failed)
        {
            return new ResultadoInicioSesion(EstadoInicioSesion.CredencialesInvalidas);
        }

        if (string.IsNullOrWhiteSpace(usuario.Rol) ||
            (usuario.Rol != RolesSistema.Administrador && !usuario.IdArea.HasValue))
        {
            return new ResultadoInicioSesion(EstadoInicioSesion.AsignacionPendiente);
        }

        var sesion = await CrearSesionAsync(usuario);
        return new ResultadoInicioSesion(EstadoInicioSesion.Correcto, sesion);
    }

    public async Task<ResultadoRegistroUsuario> RegistrarUsuarioAsync(RegistroUsuarioDto solicitud)
    {
        var correo = solicitud.Correo.Trim().ToLowerInvariant();
        var rol = solicitud.Rol.Trim();
        if (!CorreoInstitucionalValido(correo) || solicitud.Contrasena.Length < 12 || !RolPermitido(rol) ||
            (rol != RolesSistema.Administrador && !solicitud.IdArea.HasValue))
        {
            return ResultadoRegistroUsuario.DatosInvalidos;
        }

        if (solicitud.IdArea.HasValue && !await _db.Areas.AnyAsync(area => area.IdArea == solicitud.IdArea.Value))
        {
            return ResultadoRegistroUsuario.DatosInvalidos;
        }

        if (await _db.Usuarios.AnyAsync(u => u.Correo == correo))
        {
            return ResultadoRegistroUsuario.CorreoRegistrado;
        }

        var usuario = new SegUsuario
        {
            Correo = correo,
            Rol = rol,
            IdArea = solicitud.IdArea,
            Activo = "S"
        };
        usuario.HashContrasena = _hasher.HashPassword(usuario, solicitud.Contrasena);
        _db.Usuarios.Add(usuario);
        await _db.SaveChangesAsync();
        return ResultadoRegistroUsuario.Creado;
    }

    public async Task<ResultadoRegistroUsuario> ActualizarAsignacionAsync(int idUsuario, string rol, int? idArea)
    {
        rol = rol.Trim();
        if (!RolPermitido(rol) || (rol != RolesSistema.Administrador && !idArea.HasValue))
        {
            return ResultadoRegistroUsuario.DatosInvalidos;
        }

        if (idArea.HasValue && !await _db.Areas.AnyAsync(area => area.IdArea == idArea.Value))
        {
            return ResultadoRegistroUsuario.DatosInvalidos;
        }

        var usuario = await _db.Usuarios.SingleOrDefaultAsync(item => item.IdUsuario == idUsuario);
        if (usuario is null) return ResultadoRegistroUsuario.NoEncontrado;

        usuario.Rol = rol;
        usuario.IdArea = idArea;
        await _db.SaveChangesAsync();
        return ResultadoRegistroUsuario.Creado;
    }

    private async Task<SesionAutenticada> CrearSesionAsync(SegUsuario usuario)
    {
        var token = Convert.ToHexString(RandomNumberGenerator.GetBytes(32));
        var expira = DateTime.UtcNow.Add(VigenciaSesion);
        _db.Sesiones.Add(new SegSesion
        {
            IdUsuario = usuario.IdUsuario,
            HashToken = Hash(token),
            FechaExpiracion = expira
        });
        await _db.SaveChangesAsync();
        return new SesionAutenticada(token, usuario.Correo, usuario.Rol, expira, usuario.IdArea,
            usuario.Area?.Region.Codigo, usuario.Area?.Codigo, usuario.Area?.Region.Nombre, usuario.Area?.Nombre);
    }

    public async Task CerrarSesionAsync(int idSesion)
    {
        var sesion = await _db.Sesiones.SingleOrDefaultAsync(s => s.IdSesion == idSesion);
        if (sesion is null || sesion.FechaRevocacion is not null) return;
        sesion.FechaRevocacion = DateTime.UtcNow;
        await _db.SaveChangesAsync();
    }

    internal static string Hash(string valor) =>
        Convert.ToHexString(SHA256.HashData(Encoding.UTF8.GetBytes(valor)));

    private static bool CorreoInstitucionalValido(string correo)
    {
        if (correo.Length > 150 || !correo.EndsWith("@misalud.go.cr", StringComparison.OrdinalIgnoreCase))
        {
            return false;
        }

        try
        {
            return new MailAddress(correo).Address.Equals(correo, StringComparison.OrdinalIgnoreCase);
        }
        catch (FormatException)
        {
            return false;
        }
    }

    private static bool RolPermitido(string rol) =>
        rol is RolesSistema.Inspector or RolesSistema.DirectorRegional or RolesSistema.DirectorArea or
            RolesSistema.AtencionCliente or RolesSistema.Administrador;
}