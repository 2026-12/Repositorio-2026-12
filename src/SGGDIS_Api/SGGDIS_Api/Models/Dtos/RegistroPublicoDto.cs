using System.ComponentModel.DataAnnotations;

namespace SGGDIS_Api.Models.Dtos;

public class RegistroPublicoDto
{
    [Required]
    [MaxLength(100)]
    public string Nombre { get; set; } = string.Empty;

    [Required]
    [MaxLength(100)]
    public string PrimerApellido { get; set; } = string.Empty;

    [Required]
    [MaxLength(100)]
    public string SegundoApellido { get; set; } = string.Empty;

    [Required]
    [MaxLength(30)]
    public string Identificacion { get; set; } = string.Empty;

    [Required]
    [EmailAddress]
    [MaxLength(150)]
    public string Correo { get; set; } = string.Empty;

    [Required]
    [MinLength(12)]
    public string Contrasena { get; set; } = string.Empty;
}