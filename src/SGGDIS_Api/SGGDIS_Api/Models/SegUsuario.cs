using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace SGGDIS_Api.Models;

[Table("SEG_USUARIO")]
public class SegUsuario
{
    [Key]
    [Column("ID_USUARIO")]
    public int IdUsuario { get; set; }

    [Column("CORREO")]
    [MaxLength(150)]
    public string Correo { get; set; } = string.Empty;

    [Column("HASH_CONTRASENA")]
    [MaxLength(500)]
    public string HashContrasena { get; set; } = string.Empty;

    [Column("ROL")]
    [MaxLength(40)]
    public string Rol { get; set; } = "Inspector";

    [Column("ID_AREA")]
    public int? IdArea { get; set; }

    [ForeignKey(nameof(IdArea))]
    public SegArea? Area { get; set; }

    [Column("ACTIVO")]
    [MaxLength(1)]
    public string Activo { get; set; } = "S";
}