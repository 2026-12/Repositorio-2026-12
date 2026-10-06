using SGGDIS_Api.Models.Dtos;

namespace SGGDIS_Api.Services;

public interface IAuthService
{
    Task<ResultadoRegistroUsuario> RegistrarUsuarioAsync(RegistroUsuarioDto solicitud);
    Task<ResultadoRegistroUsuario> RegistrarUsuarioPendienteAsync(RegistroPublicoDto solicitud);
    Task<ResultadoInicioSesion> IniciarSesionAsync(LoginRequestDto solicitud);
    Task<ResultadoRegistroUsuario> ActualizarAsignacionAsync(int idUsuario, string rol, int? idArea, int? idRegion, List<int>? idAreas = null, List<int>? idRegiones = null);
    Task<SesionAutenticada?> RenovarSesionAsync(string refreshToken);
    Task CerrarSesionAsync(int idSesion);
}

public enum ResultadoRegistroUsuario
{
    Creado,
    DatosInvalidos,
    CorreoRegistrado,
    IdentificacionRegistrada,
    NoEncontrado
}

public enum EstadoInicioSesion
{
    CredencialesInvalidas,
    AsignacionPendiente,
    Correcto
}

public record ResultadoInicioSesion(EstadoInicioSesion Estado, SesionAutenticada? Sesion = null);

public record AreaAsignadaInspector(int IdArea, string CodigoRegion, string CodigoArea, string NombreRegion, string NombreArea);

public record SesionAutenticada(string Token, string RefreshToken, int IdSesion, string Correo, string Rol, DateTime Expira, DateTime RefreshExpira, int? IdArea, string? CodigoRegion, string? CodigoArea, string? NombreRegion, string? NombreArea, string? Nombre, string? PrimerApellido, string? SegundoApellido, string? Identificacion, IReadOnlyList<AreaAsignadaInspector> AreasAsignadas);