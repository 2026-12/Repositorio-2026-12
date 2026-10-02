using System.Security.Cryptography;
using System.Text;
using System.Net.Mail;
using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Options;
using Microsoft.IdentityModel.Tokens;
using SGGDIS_Api.Data;
using SGGDIS_Api.Models;
using SGGDIS_Api.Models.Dtos;
using SGGDIS_Api.Security;

namespace SGGDIS_Api.Services;

public class AuthService : IAuthService
{
    private static readonly TimeSpan VigenciaSesion = TimeSpan.FromHours(8);
    private static readonly TimeSpan VigenciaAccessToken = TimeSpan.FromMinutes(15);
    private readonly SggdisDbContext _db;
    private readonly IPasswordHasher<SegUsuario> _hasher;
    private readonly JwtOptions _jwtOptions;

    public AuthService(SggdisDbContext db, IPasswordHasher<SegUsuario> hasher, IOptions<JwtOptions> jwtOptions)
    {
        _db = db;
        _hasher = hasher;
        _jwtOptions = jwtOptions.Value;
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
            (usuario.Rol == RolesSistema.DirectorRegional && !usuario.IdRegion.HasValue) ||
            (usuario.Rol != RolesSistema.Administrador && usuario.Rol != RolesSistema.DirectorRegional && !usuario.IdArea.HasValue))
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

    public async Task<ResultadoRegistroUsuario> RegistrarUsuarioPendienteAsync(RegistroPublicoDto solicitud)
    {
        var correo = solicitud.Correo.Trim().ToLowerInvariant();
        var nombre = solicitud.Nombre.Trim();
        var primerApellido = solicitud.PrimerApellido.Trim();
        var segundoApellido = solicitud.SegundoApellido.Trim();
        var identificacion = solicitud.Identificacion.Trim();
        if (!CorreoInstitucionalValido(correo) || solicitud.Contrasena.Length < 12 ||
            string.IsNullOrWhiteSpace(nombre) || string.IsNullOrWhiteSpace(primerApellido) ||
            string.IsNullOrWhiteSpace(segundoApellido) || string.IsNullOrWhiteSpace(identificacion) ||
            nombre.Length > 100 || primerApellido.Length > 100 || segundoApellido.Length > 100 ||
            nombre.Length + primerApellido.Length + segundoApellido.Length + 2 > 150 || identificacion.Length > 30)
        {
            return ResultadoRegistroUsuario.DatosInvalidos;
        }

        if (await _db.Usuarios.AnyAsync(usuario => usuario.Correo == correo))
        {
            return ResultadoRegistroUsuario.CorreoRegistrado;
        }

        if (await _db.Usuarios.AnyAsync(usuario => usuario.Identificacion == identificacion))
        {
            return ResultadoRegistroUsuario.IdentificacionRegistrada;
        }

        var usuarioNuevo = new SegUsuario
        {
            Correo = correo,
            Nombre = nombre,
            PrimerApellido = primerApellido,
            SegundoApellido = segundoApellido,
            Identificacion = identificacion,
            Rol = RolesSistema.Pendiente,
            IdArea = null,
            Activo = "S"
        };
        usuarioNuevo.HashContrasena = _hasher.HashPassword(usuarioNuevo, solicitud.Contrasena);
        _db.Usuarios.Add(usuarioNuevo);
        await _db.SaveChangesAsync();
        return ResultadoRegistroUsuario.Creado;
    }

    public async Task<ResultadoRegistroUsuario> ActualizarAsignacionAsync(int idUsuario, string rol, int? idArea, int? idRegion)
    {
        rol = rol.Trim();
        if (!RolPermitido(rol))
        {
            return ResultadoRegistroUsuario.DatosInvalidos;
        }

        // Director Regional solo requiere región (sin área). Los demás roles operativos requieren área.
        if (rol == RolesSistema.DirectorRegional)
        {
            if (!idRegion.HasValue || idArea.HasValue)
            {
                return ResultadoRegistroUsuario.DatosInvalidos;
            }
        }
        else if (rol != RolesSistema.Administrador && rol != RolesSistema.Pendiente)
        {
            if (!idArea.HasValue)
            {
                return ResultadoRegistroUsuario.DatosInvalidos;
            }
        }
        else if (idArea.HasValue || idRegion.HasValue)
        {
            return ResultadoRegistroUsuario.DatosInvalidos;
        }

        if (idArea.HasValue && !await _db.Areas.AnyAsync(area => area.IdArea == idArea.Value))
        {
            return ResultadoRegistroUsuario.DatosInvalidos;
        }

        if (idRegion.HasValue && !await _db.Regiones.AnyAsync(region => region.IdRegion == idRegion.Value))
        {
            return ResultadoRegistroUsuario.DatosInvalidos;
        }

        var usuario = await _db.Usuarios.SingleOrDefaultAsync(item => item.IdUsuario == idUsuario);
        if (usuario is null) return ResultadoRegistroUsuario.NoEncontrado;

        usuario.Rol = rol;
        usuario.IdArea = idArea;
        usuario.IdRegion = idRegion;
        await _db.SaveChangesAsync();
        return ResultadoRegistroUsuario.Creado;
    }

    private async Task<SesionAutenticada> CrearSesionAsync(SegUsuario usuario)
    {
        var refreshToken = Convert.ToBase64String(RandomNumberGenerator.GetBytes(32));
        var sesion = new SegSesion
        {
            IdUsuario = usuario.IdUsuario,
            HashToken = Hash(refreshToken),
            FechaExpiracion = DateTime.UtcNow.Add(VigenciaSesion)
        };
        _db.Sesiones.Add(sesion);
        await _db.SaveChangesAsync();
        return CrearSesionAutenticada(usuario, sesion, refreshToken);
    }

    public async Task<SesionAutenticada?> RenovarSesionAsync(string refreshToken)
    {
        if (string.IsNullOrWhiteSpace(refreshToken)) return null;

        var hashToken = Hash(refreshToken);
        var sesion = await _db.Sesiones.SingleOrDefaultAsync(item =>
            item.HashToken == hashToken && item.FechaRevocacion == null && item.FechaExpiracion > DateTime.UtcNow);
        if (sesion is null) return null;

        var usuario = await _db.Usuarios
            .Include(item => item.Area)
            .ThenInclude(area => area!.Region)
            .SingleOrDefaultAsync(item => item.IdUsuario == sesion.IdUsuario && item.Activo == "S");
        if (usuario is null) return null;

        var nuevoRefreshToken = Convert.ToBase64String(RandomNumberGenerator.GetBytes(32));
        sesion.HashToken = Hash(nuevoRefreshToken);
        try
        {
            await _db.SaveChangesAsync();
        }
        catch (DbUpdateConcurrencyException)
        {
            return null;
        }
        return CrearSesionAutenticada(usuario, sesion, nuevoRefreshToken);
    }

    private SesionAutenticada CrearSesionAutenticada(SegUsuario usuario, SegSesion sesion, string refreshToken)
    {
        var ahora = DateTime.UtcNow;
        var expira = ahora.Add(VigenciaAccessToken);
        var claims = new[]
        {
            new Claim(JwtRegisteredClaimNames.Sub, usuario.IdUsuario.ToString()),
            new Claim(JwtRegisteredClaimNames.Email, usuario.Correo),
            new Claim("role", usuario.Rol),
            new Claim("session_id", sesion.IdSesion.ToString()),
            new Claim("area_id", usuario.IdArea?.ToString() ?? string.Empty),
            new Claim("region_code", usuario.Area?.Region.Codigo ?? string.Empty),
            new Claim("area_code", usuario.Area?.Codigo ?? string.Empty),
            new Claim(JwtRegisteredClaimNames.Jti, Guid.NewGuid().ToString("N"))
        };
        var key = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(_jwtOptions.SigningKey));
        var credentials = new SigningCredentials(key, SecurityAlgorithms.HmacSha256);
        var jwt = new JwtSecurityToken(_jwtOptions.Issuer, _jwtOptions.Audience, claims, ahora, expira, credentials);
        var token = new JwtSecurityTokenHandler().WriteToken(jwt);

        return new SesionAutenticada(token, refreshToken, sesion.IdSesion, usuario.Correo, usuario.Rol, expira, sesion.FechaExpiracion,
            usuario.IdArea, usuario.Area?.Region.Codigo, usuario.Area?.Codigo,
            usuario.Area?.Region.Nombre, usuario.Area?.Nombre, usuario.Nombre, usuario.PrimerApellido,
            usuario.SegundoApellido, usuario.Identificacion);
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