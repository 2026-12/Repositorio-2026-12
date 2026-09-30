using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace SGGDIS_Api.Models;

[Table("SEG_REGION")]
public class SegRegion
{
    [Key]
    [Column("ID_REGION")]
    public int IdRegion { get; set; }

    [Column("CODIGO")]
    [MaxLength(5)]
    public string Codigo { get; set; } = string.Empty;

    [Column("NOMBRE")]
    [MaxLength(100)]
    public string Nombre { get; set; } = string.Empty;

    public ICollection<SegArea> Areas { get; set; } = new List<SegArea>();
}