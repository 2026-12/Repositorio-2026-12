using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace SGGDIS_Api.Models
{
    /// <summary>
    /// Apartado II del Acta General (HU-007): Información del Responsable
    /// durante la inspección. Relación 1:1 con INS_ACTA_GENERAL por ID_ACTA.
    /// </summary>
    [Table("INS_ACTA_RESPONSABLE")]
    public class InsActaResponsable
    {
        [Key]
        [DatabaseGenerated(DatabaseGeneratedOption.None)]
        [Column("ID_ACTA")]
        public int IdActa { get; set; }

        [MaxLength(200)]
        [Column("NOMBRE_RESPONSABLE")]
        public string? NombreResponsable { get; set; }

        // Uno de los valores fijos de CARGOS_RESPONSABLE (frontend), ej. "REPRESENTANTE_LEGAL" u "OTRO".
        [MaxLength(30)]
        [Column("CARGO_RESPONSABLE")]
        public string? CargoResponsable { get; set; }

        // Solo tiene contenido cuando CargoResponsable es "OTRO": el detalle que escribió el inspector.
        [MaxLength(200)]
        [Column("CARGO_RESPONSABLE_OTRO")]
        public string? CargoResponsableOtro { get; set; }

        [MaxLength(30)]
        [Column("NUMERO_IDENTIFICACION_RESPONSABLE")]
        public string? NumeroIdentificacionResponsable { get; set; }

        [ForeignKey(nameof(IdActa))]
        public InsActaGeneral? Acta { get; set; }
    }
}
