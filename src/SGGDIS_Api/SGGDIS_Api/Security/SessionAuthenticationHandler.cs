using System.Security.Claims;
using System.Text.Encodings.Web;
using Microsoft.AspNetCore.Authentication;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Options;
using SGGDIS_Api.Data;
using SGGDIS_Api.Services;

namespace SGGDIS_Api.Security;

public class SessionAuthenticationHandler : AuthenticationHandler<AuthenticationSchemeOptions>
{
    private readonly SggdisDbContext _db;

    public SessionAuthenticationHandler(
        IOptionsMonitor<AuthenticationSchemeOptions> options,
        ILoggerFactory logger,
        UrlEncoder encoder,
        SggdisDbContext db) : base(options, logger, encoder)
    {
        _db = db;
    }

    protected override async Task<AuthenticateResult> HandleAuthenticateAsync()
    {
        var token = Request.Headers.Authorization.ToString();
        if (!token.StartsWith("Bearer ", StringComparison.OrdinalIgnoreCase))
            return AuthenticateResult.NoResult();

        var tokenHash = AuthService.Hash(token[7..].Trim());
        var sesion = await _db.Sesiones.SingleOrDefaultAsync(s => s.HashToken == tokenHash);
        if (sesion is null || sesion.FechaRevocacion is not null || sesion.FechaExpiracion <= DateTime.UtcNow)
            return AuthenticateResult.Fail("La sesión no es válida o ha finalizado.");

        var usuario = await _db.Usuarios
            .Include(u => u.Area)
            .ThenInclude(a => a!.Region)
            .SingleOrDefaultAsync(u => u.IdUsuario == sesion.IdUsuario && u.Activo == "S");
        if (usuario is null) return AuthenticateResult.Fail("El usuario no está activo.");

        var claims = new[]
        {
            new Claim(ClaimTypes.NameIdentifier, usuario.IdUsuario.ToString()),
            new Claim(ClaimTypes.Name, usuario.Correo),
            new Claim(ClaimTypes.Role, usuario.Rol),
            new Claim("session_id", sesion.IdSesion.ToString()),
            new Claim("area_id", usuario.IdArea?.ToString() ?? string.Empty),
            new Claim("region_code", usuario.Area?.Region.Codigo ?? string.Empty),
            new Claim("area_code", usuario.Area?.Codigo ?? string.Empty)
        };
        var identity = new ClaimsIdentity(claims, Scheme.Name);
        return AuthenticateResult.Success(new AuthenticationTicket(new ClaimsPrincipal(identity), Scheme.Name));
    }
}