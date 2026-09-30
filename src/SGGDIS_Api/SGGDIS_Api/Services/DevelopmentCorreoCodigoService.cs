namespace SGGDIS_Api.Services;

public class DevelopmentCorreoCodigoService(ILogger<DevelopmentCorreoCodigoService> logger) : ICorreoCodigoService
{
    public Task EnviarCodigoAsync(string correo, string codigo)
    {
        logger.LogWarning("Código 2FA de desarrollo para {Correo}: {Codigo}", correo, codigo);
        return Task.CompletedTask;
    }
}