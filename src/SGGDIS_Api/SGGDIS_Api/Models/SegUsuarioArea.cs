using System.ComponentModel.DataAnnotations.Schema;

namespace SGGDIS_Api.Models;

[Table("SEG_USUARIO_AREA")]
public class SegUsuarioArea
{
    [Column("ID_USUARIO")]
    public int IdUsuario { get; set; }

    [Column("ID_AREA")]
    public int IdArea { get; set; }
    public SegUsuario Usuario { get; set; } = null!;
    public SegArea Area { get; set; } = null!;
}