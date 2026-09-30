using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using SGGDIS_Api.Models;

namespace SGGDIS_Api.Data;

public static class DesarrolloUsuarioSeeder
{
    public static async Task CrearUsuarioSiConfiguradoAsync(IServiceProvider services, IConfiguration configuration)
    {
        var correo = configuration["Auth:SeedUser:Email"]?.Trim().ToLowerInvariant();
        var contrasena = configuration["Auth:SeedUser:Password"];
        if (string.IsNullOrWhiteSpace(correo) || string.IsNullOrWhiteSpace(contrasena)) return;

        using var scope = services.CreateScope();
        var db = scope.ServiceProvider.GetRequiredService<SggdisDbContext>();
        if (await db.Usuarios.AnyAsync(u => u.Correo == correo)) return;

        var usuario = new SegUsuario
        {
            Correo = correo,
            Rol = configuration["Auth:SeedUser:Role"] ?? "Inspector",
            Activo = "S"
        };
        usuario.HashContrasena = new PasswordHasher<SegUsuario>().HashPassword(usuario, contrasena);
        db.Usuarios.Add(usuario);
        await db.SaveChangesAsync();
    }
}