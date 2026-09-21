using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace SGGDIS_Api.Models
{
    /// <summary>
    /// Ítem evaluable de una sección: la fila del checklist que el inspector
    /// marca como "Cumple", "No cumple" o "N/A".
    /// </summary>
    [Table("INS_ITEM")]
    public class InsItem
    {
        [Key]
        [Column("ID_ITEM")]
        public int IdItem { get; set; }

        [Column("ID_SECCION")]
        public int IdSeccion { get; set; }

        // TODO: MaxLength(60) no coincide con la columna real (VARCHAR2(100)).
        // Si un artículo pasa de 60 caracteres, EF lo rechaza. Subir a 100.
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

        // "S" si es crítico. Un ítem crítico incumplido puede generar orden
        // sanitaria aunque el puntaje total sea alto.
        [MaxLength(1)]
        [Column("ES_CRITICO")]
        public string EsCritico { get; set; } = "N";

        // "S" si el ítem admite "No aplica".
        [MaxLength(1)]
        [Column("PERMITE_NO_APLICA")]
        public string PermiteNoAplica { get; set; } = "S";

        [Column("ORDEN")]
        public int Orden { get; set; }

        [ForeignKey(nameof(IdSeccion))]
        public InsSeccion? Seccion { get; set; }
    }
}