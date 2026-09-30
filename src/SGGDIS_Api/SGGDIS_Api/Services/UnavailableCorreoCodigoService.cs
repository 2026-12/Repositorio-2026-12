namespace SGGDIS_Api.Services;

public class UnavailableCorreoCodigoService : ICorreoCodigoService
{
    public Task EnviarCodigoAsync(string correo, string codigo) =>
        throw new InvalidOperationException("El envío de correo no está configurado.");
}