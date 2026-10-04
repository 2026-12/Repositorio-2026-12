using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace SGGDIS_Api.Models;

[Table("SEG_AREA")]
public class SegArea
{
    [Key]
    [Column("ID_AREA")]
    public int IdArea { get; set; }

    [Column("ID_REGION")]
    public int IdRegion { get; set; }

    [Column("CODIGO")]
    [MaxLength(10)]
    public string Codigo { get; set; } = string.Empty;

    [Column("NOMBRE")]
    [MaxLength(100)]
    public string Nombre { get; set; } = string.Empty;

    [ForeignKey(nameof(IdRegion))]
    public SegRegion Region { get; set; } = null!;

    public ICollection<SegUsuario> Usuarios { get; set; } = new List<SegUsuario>();
}