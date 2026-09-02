using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace SGGDIS_Api.Models
{
    /// Un ítem evaluable dentro de una sección (una fila del checklist).
    [Table("INS_ITEM")]
    public class InsItem
    {
        [Key]
        [Column("ID_ITEM")]
        public int IdItem { get; set; }

        [Column("ID_SECCION")]
        public int IdSeccion { get; set; }

        [Required]
        [MaxLength(60)]
        [Column("ARTICULO")]
        public string Articulo { get; set; } = string.Empty;

        [Required]
        [MaxLength(400)]
        [Column("DESCRIPCION")]
        public string Descripcion { get; set; } = string.Empty;

        [Column("PUNTAJE")]
        public int Puntaje { get; set; }

        [MaxLength(1)]
        [Column("ES_CRITICO")]
        public string EsCritico { get; set; } = "N";

        [MaxLength(1)]
        [Column("PERMITE_NO_APLICA")]
        public string PermiteNoAplica { get; set; } = "S";

        [Column("ORDEN")]
        public int Orden { get; set; }

        [ForeignKey(nameof(IdSeccion))]
        public InsSeccion? Seccion { get; set; }
    }
}