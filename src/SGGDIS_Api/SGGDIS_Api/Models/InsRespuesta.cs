using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace SGGDIS_Api.Models
{
    /// <summary>
    /// Representa la respuesta que se dio a un ítem específico dentro de una
    /// inspección: por cada ítem del checklist que se marca, se guarda una fila aquí.
    /// La combinación de inspección + ítem es única (no se puede responder dos veces el mismo ítem).
    /// </summary>
    [Table("INS_RESPUESTA")]
    public class InsRespuesta
    {
        // Identificador único de esta respuesta.
        [Key]
        [Column("ID_RESPUESTA")]
        public int IdRespuesta { get; set; }

        // A qué inspección pertenece esta respuesta.
        [Column("ID_INSPECCION")]
        public int IdInspeccion { get; set; }

        // A qué ítem del checklist corresponde esta respuesta.
        [Column("ID_ITEM")]
        public int IdItem { get; set; }

        // El valor marcado por la persona inspectora: "Cumple", "No cumple" o "N/A".
        [Column("ESTADO")]
        [MaxLength(15)]
        public string Estado { get; set; } = string.Empty; // 'Cumple' | 'No cumple' | 'N/A'

        // Puntos que se otorgaron para este ítem (puede ser parcial si el ítem lo permite).
        [Column("PUNTOS_OTORGADOS")]
        public int? PuntosOtorgados { get; set; }

        // La inspección a la que pertenece esta respuesta.
        [ForeignKey(nameof(IdInspeccion))]
        public InsInspeccion? Inspeccion { get; set; }

        // El ítem del checklist que se está respondiendo.
        [ForeignKey(nameof(IdItem))]
        public InsItem? Item { get; set; }
    }
}
