namespace SGGDIS_Api.Services;

public interface ICorreoCodigoService
{
    Task EnviarCodigoAsync(string correo, string codigo);
}