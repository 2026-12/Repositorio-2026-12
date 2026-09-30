using SGGDIS_Api.Models.Dtos;

namespace SGGDIS_Api.Services;

public interface IAuthService
{
    Task<ResultadoRegistroUsuario> RegistrarUsuarioAsync(RegistroUsuarioDto solicitud);
    Task<ResultadoInicioSesion> IniciarSesionAsync(LoginRequestDto solicitud);
    Task<ResultadoRegistroUsuario> ActualizarAsignacionAsync(int idUsuario, string rol, int? idArea);
    Task CerrarSesionAsync(int idSesion);
}

public enum ResultadoRegistroUsuario
{
    Creado,
    DatosInvalidos,
    CorreoRegistrado,
    NoEncontrado
}

public enum EstadoInicioSesion
{
    CredencialesInvalidas,
    AsignacionPendiente,
    Correcto
}

public record ResultadoInicioSesion(EstadoInicioSesion Estado, SesionAutenticada? Sesion = null);

public record SesionAutenticada(string Token, string Correo, string Rol, DateTime Expira, int? IdArea, string? CodigoRegion, string? CodigoArea, string? NombreRegion, string? NombreArea);