using Microsoft.AspNetCore.Identity;
using SGGDIS_Api.Models;
using SGGDIS_Api.Models.Dtos;
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
        var servicio = new AuthService(contexto, hasher);

        var sesion = await servicio.IniciarSesionAsync(new LoginRequestDto
        {
            Correo = usuario.Correo,
            Contrasena = "clave-valida"
        });

        Assert.Equal(EstadoInicioSesion.Correcto, sesion.Estado);
        Assert.NotNull(sesion.Sesion);
        Assert.False(string.IsNullOrWhiteSpace(sesion.Sesion.Token));
        Assert.Equal(usuario.Correo, sesion.Sesion.Correo);
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
        var servicio = new AuthService(contexto, hasher);

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
        var servicio = new AuthService(contexto, hasher);

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
        var servicio = new AuthService(contexto, hasher);

        var resultado = await servicio.IniciarSesionAsync(new LoginRequestDto
        {
            Correo = usuario.Correo,
            Contrasena = "clave-admin"
        });

        Assert.Equal(EstadoInicioSesion.Correcto, resultado.Estado);
        Assert.Equal("Administrador", resultado.Sesion?.Rol);
        Assert.Null(resultado.Sesion?.IdArea);
    }

    private static AuthService CrearServicio(SGGDIS_Api.Data.SggdisDbContext contexto)
    {
        return new AuthService(contexto, new PasswordHasher<SegUsuario>());
    }

    private static async Task AgregarAreaPrueba(SGGDIS_Api.Data.SggdisDbContext contexto)
    {
        contexto.Regiones.Add(new SegRegion { IdRegion = 1, Codigo = "HN", Nombre = "Huetar Norte" });
        contexto.Areas.Add(new SegArea { IdArea = 1, IdRegion = 1, Codigo = "F", Nombre = "Florencia" });
        await contexto.SaveChangesAsync();
    }
}