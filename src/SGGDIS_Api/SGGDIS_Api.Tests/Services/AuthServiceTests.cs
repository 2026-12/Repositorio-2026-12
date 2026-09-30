using Microsoft.AspNetCore.Identity;
using Moq;
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
        var servicio = CrearServicio(contexto);
        const string contrasena = "una-clave-segura-123";

        var resultado = await servicio.RegistrarUsuarioAsync(new RegistroUsuarioDto
        {
            Correo = "Persona@misalud.go.cr",
            Contrasena = contrasena
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
        contexto.Usuarios.Add(new SegUsuario { Correo = "persona@misalud.go.cr", HashContrasena = "hash" });
        await contexto.SaveChangesAsync();
        var servicio = CrearServicio(contexto);

        var resultado = await servicio.RegistrarUsuarioAsync(new RegistroUsuarioDto
        {
            Correo = "persona@misalud.go.cr",
            Contrasena = "una-clave-segura-123"
        });

        Assert.Equal(ResultadoRegistroUsuario.CorreoRegistrado, resultado);
        Assert.Single(contexto.Usuarios);
    }

    private static AuthService CrearServicio(SGGDIS_Api.Data.SggdisDbContext contexto)
    {
        var correo = new Mock<ICorreoCodigoService>();
        return new AuthService(contexto, correo.Object, new PasswordHasher<SegUsuario>());
    }
}