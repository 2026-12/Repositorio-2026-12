using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace SGGDIS_Api.Models
{
    /// <summary>
    /// Apartado VI del Acta General (HU-011): Cierre de la inspección.
    /// Relación 1:1 con INS_ACTA_GENERAL por ID_ACTA. La hora de inicio que
    /// se muestra en el cierre no se guarda acá: es InsActaInfoGeneral.HoraInicio.
    /// </summary>
    [Table("INS_ACTA_CIERRE")]
    public class InsActaCierre
    {
        [Key]
        [DatabaseGenerated(DatabaseGeneratedOption.None)]
        [Column("ID_ACTA")]
        public int IdActa { get; set; }

        // Lista dinámica de personas presentes, guardada como arreglo JSON
        // (nombreCompleto, cargoInstitucion, numeroIdentificacion, firma).
        [Column("PERSONAS_PRESENTES", TypeName = "CLOB")]
        public string? PersonasPresentes { get; set; }

        [ForeignKey(nameof(IdActa))]
        public InsActaGeneral? Acta { get; set; }
    }
}
