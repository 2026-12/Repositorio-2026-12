using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace SGGDIS_Api.Models
{
    /// <summary>
    /// Respuesta a un ítem dentro de una inspección. Se guarda una fila por cada
    /// ítem marcado. La combinación inspección + ítem es única, no se puede
    /// responder el mismo ítem dos veces.
    /// </summary>
    [Table("INS_RESPUESTA")]
    public class InsRespuesta
    {
        [Key]
        [Column("ID_RESPUESTA")]
        public int IdRespuesta { get; set; }

        [Column("ID_INSPECCION")]
        public int IdInspeccion { get; set; }

        [Column("ID_ITEM")]
        public int IdItem { get; set; }

        // Valor marcado: "Cumple", "No cumple" o "N/A".
        [Column("ESTADO")]
        [MaxLength(15)]
        public string Estado { get; set; } = string.Empty;

        // Puntos otorgados (puede ser parcial si el ítem lo permite).
        [Column("PUNTOS_OTORGADOS")]
        public int? PuntosOtorgados { get; set; }

        [ForeignKey(nameof(IdInspeccion))]
        public InsInspeccion? Inspeccion { get; set; }

        [ForeignKey(nameof(IdItem))]
        public InsItem? Item { get; set; }
    }
}
