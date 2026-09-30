using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace SGGDIS_Api.Models;

[Table("SEG_SESION")]
public class SegSesion
{
    [Key]
    [Column("ID_SESION")]
    public int IdSesion { get; set; }

    [Column("ID_USUARIO")]
    public int IdUsuario { get; set; }

    [Column("HASH_TOKEN")]
    [MaxLength(64)]
    [ConcurrencyCheck]
    public string HashToken { get; set; } = string.Empty;

    [Column("FECHA_EXPIRACION")]
    public DateTime FechaExpiracion { get; set; }

    [Column("FECHA_REVOCACION")]
    public DateTime? FechaRevocacion { get; set; }
}