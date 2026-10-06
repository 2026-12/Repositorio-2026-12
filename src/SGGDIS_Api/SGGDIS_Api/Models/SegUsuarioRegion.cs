using System.ComponentModel.DataAnnotations.Schema;

namespace SGGDIS_Api.Models;

[Table("SEG_USUARIO_REGION")]
public class SegUsuarioRegion
{
    [Column("ID_USUARIO")]
    public int IdUsuario { get; set; }

    [Column("ID_REGION")]
    public int IdRegion { get; set; }
    public SegUsuario Usuario { get; set; } = null!;
    public SegRegion Region { get; set; } = null!;
}