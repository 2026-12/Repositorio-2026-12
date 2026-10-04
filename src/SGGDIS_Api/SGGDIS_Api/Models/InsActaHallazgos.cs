using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace SGGDIS_Api.Models
{
    /// <summary>
    /// Apartado IV del Acta General (HU-009): Hallazgos de la inspección.
    /// Relación 1:1 con INS_ACTA_GENERAL por ID_ACTA.
    /// </summary>
    [Table("INS_ACTA_HALLAZGOS")]
    public class InsActaHallazgos
    {
        [Key]
        [DatabaseGenerated(DatabaseGeneratedOption.None)]
        [Column("ID_ACTA")]
        public int IdActa { get; set; }

        // Ids de INS_GUIA seleccionados, separados por coma y ordenados, ej. "1,3".
        // Se guardan ids (no nombres) para que renombrar una guía no deje datos huérfanos.
        [MaxLength(200)]
        [Column("GUIAS_APLICABLES")]
        public string? GuiasAplicables { get; set; }

        [MaxLength(4000)]
        [Column("HALLAZGOS")]
        public string? Hallazgos { get; set; }

        [ForeignKey(nameof(IdActa))]
        public InsActaGeneral? Acta { get; set; }
    }
}
