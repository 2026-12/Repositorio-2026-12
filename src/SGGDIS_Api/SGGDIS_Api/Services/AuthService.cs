using System.Security.Cryptography;
using System.Text;
using System.Net.Mail;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using SGGDIS_Api.Data;
using SGGDIS_Api.Models;
using SGGDIS_Api.Models.Dtos;

namespace SGGDIS_Api.Services;

public class AuthService : IAuthService
{
    private static readonly TimeSpan VigenciaCodigo = TimeSpan.FromMinutes(5);
    private static readonly TimeSpan VigenciaSesion = TimeSpan.FromHours(8);
    private readonly SggdisDbContext _db;
    private readonly ICorreoCodigoService _correo;
    private readonly IPasswordHasher<SegUsuario> _hasher;

    public AuthService(SggdisDbContext db, ICorreoCodigoService correo, IPasswordHasher<SegUsuario> hasher)
    {
        _db = db;
        _correo = correo;
        _hasher = hasher;
    }

    public async Task<int?> IniciarSesionAsync(LoginRequestDto solicitud)
    {
        var correo = solicitud.Correo.Trim().ToLowerInvariant();
        var usuario = await _db.Usuarios.SingleOrDefaultAsync(u => u.Correo == correo && u.Activo == "S");
        if (usuario is null || _hasher.VerifyHashedPassword(usuario, usuario.HashContrasena, solicitud.Contrasena) == PasswordVerificationResult.Failed)
        {
            return null;
        }

        var codigo = RandomNumberGenerator.GetInt32(0, 1_000_000).ToString("D6");
        var registro = new SegCodigoVerificacion
        {
            IdUsuario = usuario.IdUsuario,
            HashCodigo = Hash(codigo),
            FechaExpiracion = DateTime.UtcNow.Add(VigenciaCodigo)
        };
        _db.CodigosVerificacion.Add(registro);
        await _db.SaveChangesAsync();
        await _correo.EnviarCodigoAsync(usuario.Correo, codigo);
        return registro.IdCodigo;
    }

    public async Task<ResultadoRegistroUsuario> RegistrarUsuarioAsync(RegistroUsuarioDto solicitud)
    {
        var correo = solicitud.Correo.Trim().ToLowerInvariant();
        if (!CorreoInstitucionalValido(correo) || solicitud.Contrasena.Length < 12)
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
            Rol = "Inspector",
            Activo = "S"
        };
        usuario.HashContrasena = _hasher.HashPassword(usuario, solicitud.Contrasena);
        _db.Usuarios.Add(usuario);
        await _db.SaveChangesAsync();
        return ResultadoRegistroUsuario.Creado;
    }

    public async Task<SesionAutenticada?> VerificarCodigoAsync(VerificarCodigoDto solicitud)
    {
        var codigo = await _db.CodigosVerificacion
            .SingleOrDefaultAsync(c => c.IdCodigo == solicitud.IdCodigo);
        if (codigo is null || codigo.FechaUso is not null || codigo.FechaExpiracion <= DateTime.UtcNow ||
            !CryptographicOperations.FixedTimeEquals(
                Convert.FromHexString(codigo.HashCodigo),
                Convert.FromHexString(Hash(solicitud.Codigo))))
        {
            return null;
        }

        var usuario = await _db.Usuarios.SingleOrDefaultAsync(u => u.IdUsuario == codigo.IdUsuario && u.Activo == "S");
        if (usuario is null) return null;

        codigo.FechaUso = DateTime.UtcNow;
        var token = Convert.ToHexString(RandomNumberGenerator.GetBytes(32));
        var expira = DateTime.UtcNow.Add(VigenciaSesion);
        _db.Sesiones.Add(new SegSesion
        {
            IdUsuario = usuario.IdUsuario,
            HashToken = Hash(token),
            FechaExpiracion = expira
        });
        await _db.SaveChangesAsync();
        return new SesionAutenticada(token, usuario.Correo, usuario.Rol, expira);
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
}