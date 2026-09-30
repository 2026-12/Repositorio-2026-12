using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace SGGDIS_Api.Models;

[Table("SEG_CODIGO_VERIFICACION")]
public class SegCodigoVerificacion
{
    [Key]
    [Column("ID_CODIGO")]
    public int IdCodigo { get; set; }

    [Column("ID_USUARIO")]
    public int IdUsuario { get; set; }

    [Column("HASH_CODIGO")]
    [MaxLength(64)]
    public string HashCodigo { get; set; } = string.Empty;

    [Column("FECHA_EXPIRACION")]
    public DateTime FechaExpiracion { get; set; }

    [Column("FECHA_USO")]
    public DateTime? FechaUso { get; set; }
}