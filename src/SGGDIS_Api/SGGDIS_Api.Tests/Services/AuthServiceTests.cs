using Microsoft.AspNetCore.Identity;
using Microsoft.Extensions.Options;
using System.IdentityModel.Tokens.Jwt;
using SGGDIS_Api.Models;
using SGGDIS_Api.Models.Dtos;
using SGGDIS_Api.Security;
using SGGDIS_Api.Services;
using Xunit;

namespace SGGDIS_Api.Tests.Services;

public class AuthServiceTests
{
    [Fact]
    public async Task RegistrarUsuarioAsync_RechazaCorreoFueraDelDominioInstitucional()
    {
        using var contexto = TestDbContextFactory.Crear();
        await AgregarAreaPrueba(contexto);
        var servicio = CrearServicio(contexto);

        var resultado = await servicio.RegistrarUsuarioAsync(new RegistroUsuarioDto
        {
            Correo = "persona@example.com",
            Contrasena = "una-clave-segura-123"
        });

        Assert.Equal(ResultadoRegistroUsuario.DatosInvalidos, resultado);
        Assert.Empty(contexto.Usuarios);
    }

    [Fact]
    public async Task RegistrarUsuarioPendienteAsync_CreaCuentaSinPermisosYBloqueaLogin()
    {
        using var contexto = TestDbContextFactory.Crear();
        var servicio = CrearServicio(contexto);
        const string contrasena = "clave-inicial-segura";

        var resultado = await servicio.RegistrarUsuarioPendienteAsync(new RegistroPublicoDto
        {
            Correo = "Persona@misalud.go.cr",
            Contrasena = contrasena,
            Nombre = "María",
            PrimerApellido = "Pérez",
            SegundoApellido = "Solano",
            Identificacion = "001234567"
        });

        var usuario = Assert.Single(contexto.Usuarios);
        Assert.Equal(ResultadoRegistroUsuario.Creado, resultado);
        Assert.Equal(RolesSistema.Pendiente, usuario.Rol);
        Assert.Null(usuario.IdArea);
        Assert.Equal("María", usuario.Nombre);
        Assert.Equal("Pérez", usuario.PrimerApellido);
        Assert.Equal("Solano", usuario.SegundoApellido);
        Assert.Equal("001234567", usuario.Identificacion);
        Assert.NotEqual(contrasena, usuario.HashContrasena);
        var login = await servicio.IniciarSesionAsync(new LoginRequestDto
        {
            Correo = usuario.Correo,
            Contrasena = contrasena
        });
        Assert.Equal(EstadoInicioSesion.AsignacionPendiente, login.Estado);
        Assert.Empty(contexto.Sesiones);
    }

    [Fact]
    public async Task RegistrarUsuarioPendienteAsync_RechazaIdentificacionDuplicada()
    {
        using var contexto = TestDbContextFactory.Crear();
        contexto.Usuarios.Add(new SegUsuario
        {
            Correo = "otra@misalud.go.cr",
            Identificacion = "001234567",
            HashContrasena = "hash",
        });
        await contexto.SaveChangesAsync();
        var servicio = CrearServicio(contexto);

        var resultado = await servicio.RegistrarUsuarioPendienteAsync(new RegistroPublicoDto
        {
            Correo = "persona@misalud.go.cr",
            Contrasena = "clave-inicial-segura",
            Nombre = "María",
            PrimerApellido = "Pérez",
            SegundoApellido = "Solano",
            Identificacion = "001234567",
        });

        Assert.Equal(ResultadoRegistroUsuario.IdentificacionRegistrada, resultado);
        Assert.Single(contexto.Usuarios);
    }

    [Fact]
    public async Task RegistrarUsuarioAsync_GuardaHashYAsignaRolInspector()
    {
        using var contexto = TestDbContextFactory.Crear();
        await AgregarAreaPrueba(contexto);
        var servicio = CrearServicio(contexto);
        const string contrasena = "una-clave-segura-123";

        var resultado = await servicio.RegistrarUsuarioAsync(new RegistroUsuarioDto
        {
            Correo = "Persona@misalud.go.cr",
            Contrasena = contrasena,
            Rol = "Inspector",
            IdArea = 1
        });

        var usuario = Assert.Single(contexto.Usuarios);
        Assert.Equal(ResultadoRegistroUsuario.Creado, resultado);
        Assert.Equal("persona@misalud.go.cr", usuario.Correo);
        Assert.Equal("Inspector", usuario.Rol);
        Assert.NotEqual(contrasena, usuario.HashContrasena);
        Assert.Matches("^AQAAAA[A-Za-z0-9+/]+=*$", usuario.HashContrasena);
        Assert.Equal(PasswordVerificationResult.Success, new PasswordHasher<SegUsuario>().VerifyHashedPassword(usuario, usuario.HashContrasena, contrasena));
    }

    [Fact]
    public async Task RegistrarUsuarioAsync_RechazaCorreoDuplicado()
    {
        using var contexto = TestDbContextFactory.Crear();
        await AgregarAreaPrueba(contexto);
        contexto.Usuarios.Add(new SegUsuario { Correo = "persona@misalud.go.cr", HashContrasena = "hash" });
        await contexto.SaveChangesAsync();
        var servicio = CrearServicio(contexto);

        var resultado = await servicio.RegistrarUsuarioAsync(new RegistroUsuarioDto
        {
            Correo = "persona@misalud.go.cr",
            Contrasena = "una-clave-segura-123",
            Rol = "Inspector",
            IdArea = 1
        });

        Assert.Equal(ResultadoRegistroUsuario.CorreoRegistrado, resultado);
        Assert.Single(contexto.Usuarios);
    }

    [Fact]
    public async Task IniciarSesionAsync_CreaSesionDirectamenteConCredencialesValidas()
    {
        using var contexto = TestDbContextFactory.Crear();
        var hasher = new PasswordHasher<SegUsuario>();
        var usuario = new SegUsuario { Correo = "persona@misalud.go.cr", Rol = "Inspector", IdArea = 1, Activo = "S" };
        usuario.HashContrasena = hasher.HashPassword(usuario, "clave-valida");
        contexto.Usuarios.Add(usuario);
        await contexto.SaveChangesAsync();
        var servicio = CrearServicio(contexto, hasher);

        var sesion = await servicio.IniciarSesionAsync(new LoginRequestDto
        {
            Correo = usuario.Correo,
            Contrasena = "clave-valida"
        });

        Assert.Equal(EstadoInicioSesion.Correcto, sesion.Estado);
        Assert.NotNull(sesion.Sesion);
        Assert.False(string.IsNullOrWhiteSpace(sesion.Sesion.Token));
        var jwt = new JwtSecurityTokenHandler().ReadJwtToken(sesion.Sesion.Token);
        Assert.Equal("1", jwt.Subject);
        Assert.Equal("Inspector", jwt.Claims.Single(claim => claim.Type == "role").Value);
        Assert.Equal("sggdis-tests", jwt.Issuer);
        Assert.Equal(usuario.Correo, sesion.Sesion.Correo);
        Assert.Single(contexto.Sesiones);
    }

    [Fact]
    public async Task RenovarSesionAsync_RotaRefreshYRechazaElAnterior()
    {
        using var contexto = TestDbContextFactory.Crear();
        var hasher = new PasswordHasher<SegUsuario>();
        var usuario = new SegUsuario { Correo = "persona@misalud.go.cr", Rol = "Inspector", IdArea = 1, Activo = "S" };
        usuario.HashContrasena = hasher.HashPassword(usuario, "clave-valida");
        contexto.Usuarios.Add(usuario);
        await contexto.SaveChangesAsync();
        var servicio = CrearServicio(contexto, hasher);
        var login = await servicio.IniciarSesionAsync(new LoginRequestDto
        {
            Correo = usuario.Correo,
            Contrasena = "clave-valida"
        });

        var tokenOriginal = Assert.IsType<SesionAutenticada>(login.Sesion).RefreshToken;
        var renovada = await servicio.RenovarSesionAsync(tokenOriginal);

        Assert.NotNull(renovada);
        Assert.NotEqual(tokenOriginal, renovada.RefreshToken);
        Assert.NotNull(renovada.Token);
        Assert.Null(await servicio.RenovarSesionAsync(tokenOriginal));
        Assert.Single(contexto.Sesiones);
    }

    [Fact]
    public async Task IniciarSesionAsync_NoCreaSesionConContrasenaIncorrecta()
    {
        using var contexto = TestDbContextFactory.Crear();
        var hasher = new PasswordHasher<SegUsuario>();
        var usuario = new SegUsuario { Correo = "persona@misalud.go.cr", Rol = "Inspector", Activo = "S" };
        usuario.HashContrasena = hasher.HashPassword(usuario, "clave-correcta");
        contexto.Usuarios.Add(usuario);
        await contexto.SaveChangesAsync();
        var servicio = CrearServicio(contexto, hasher);

        var sesion = await servicio.IniciarSesionAsync(new LoginRequestDto
        {
            Correo = usuario.Correo,
            Contrasena = "incorrecta"
        });

        Assert.Equal(EstadoInicioSesion.CredencialesInvalidas, sesion.Estado);
        Assert.Empty(contexto.Sesiones);
    }

    [Fact]
    public async Task IniciarSesionAsync_BloqueaUsuarioSinAreaHastaAsignacion()
    {
        using var contexto = TestDbContextFactory.Crear();
        var hasher = new PasswordHasher<SegUsuario>();
        var usuario = new SegUsuario { Correo = "persona@misalud.go.cr", Rol = "Inspector", Activo = "S" };
        usuario.HashContrasena = hasher.HashPassword(usuario, "clave-correcta");
        contexto.Usuarios.Add(usuario);
        await contexto.SaveChangesAsync();
        var servicio = CrearServicio(contexto, hasher);

        var resultado = await servicio.IniciarSesionAsync(new LoginRequestDto
        {
            Correo = usuario.Correo,
            Contrasena = "clave-correcta"
        });

        Assert.Equal(EstadoInicioSesion.AsignacionPendiente, resultado.Estado);
        Assert.Empty(contexto.Sesiones);
    }

    [Fact]
    public async Task IniciarSesionAsync_AdministradorPuedeIngresarSinArea()
    {
        using var contexto = TestDbContextFactory.Crear();
        var hasher = new PasswordHasher<SegUsuario>();
        var usuario = new SegUsuario { Correo = "admin@misalud.go.cr", Rol = "Administrador", Activo = "S" };
        usuario.HashContrasena = hasher.HashPassword(usuario, "clave-admin");
        contexto.Usuarios.Add(usuario);
        await contexto.SaveChangesAsync();
        var servicio = CrearServicio(contexto, hasher);

        var resultado = await servicio.IniciarSesionAsync(new LoginRequestDto
        {
            Correo = usuario.Correo,
            Contrasena = "clave-admin"
        });

        Assert.Equal(EstadoInicioSesion.Correcto, resultado.Estado);
        Assert.Equal("Administrador", resultado.Sesion?.Rol);
        Assert.Null(resultado.Sesion?.IdArea);
    }

    private static AuthService CrearServicio(SGGDIS_Api.Data.SggdisDbContext contexto, IPasswordHasher<SegUsuario>? hasher = null)
    {
        return new AuthService(contexto, hasher ?? new PasswordHasher<SegUsuario>(), Options.Create(new JwtOptions
        {
            Issuer = "sggdis-tests",
            Audience = "sggdis-tests",
            SigningKey = "test-signing-key-at-least-32-bytes-long"
        }));
    }

    private static async Task AgregarAreaPrueba(SGGDIS_Api.Data.SggdisDbContext contexto)
    {
        contexto.Regiones.Add(new SegRegion { IdRegion = 1, Codigo = "HN", Nombre = "Huetar Norte" });
        contexto.Areas.Add(new SegArea { IdArea = 1, IdRegion = 1, Codigo = "F", Nombre = "Florencia" });
        await contexto.SaveChangesAsync();
    }
}