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

    [Column("NOMBRE")]
    [MaxLength(100)]
    public string? Nombre { get; set; }

    [Column("PRIMER_APELLIDO")]
    [MaxLength(100)]
    public string? PrimerApellido { get; set; }

    [Column("SEGUNDO_APELLIDO")]
    [MaxLength(100)]
    public string? SegundoApellido { get; set; }

    [Column("IDENTIFICACION")]
    [MaxLength(30)]
    public string? Identificacion { get; set; }

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

    [Column("ID_REGION")]
    public int? IdRegion { get; set; }

    [ForeignKey(nameof(IdRegion))]
    public SegRegion? Region { get; set; }

    [Column("ACTIVO")]
    [MaxLength(1)]
    public string Activo { get; set; } = "S";
}