using SGGDIS_Api.Models.Dtos;

namespace SGGDIS_Api.Services;

public interface IAuthService
{
    Task<ResultadoRegistroUsuario> RegistrarUsuarioAsync(RegistroUsuarioDto solicitud);
    Task<int?> IniciarSesionAsync(LoginRequestDto solicitud);
    Task<SesionAutenticada?> VerificarCodigoAsync(VerificarCodigoDto solicitud);
    Task CerrarSesionAsync(int idSesion);
}

public enum ResultadoRegistroUsuario
{
    Creado,
    DatosInvalidos,
    CorreoRegistrado
}

public record SesionAutenticada(string Token, string Correo, string Rol, DateTime Expira);