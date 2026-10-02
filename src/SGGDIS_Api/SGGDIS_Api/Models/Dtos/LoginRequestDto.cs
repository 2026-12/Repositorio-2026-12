namespace SGGDIS_Api.Models.Dtos;

public class LoginRequestDto
{
    public string Correo { get; set; } = string.Empty;
    public string Contrasena { get; set; } = string.Empty;
}