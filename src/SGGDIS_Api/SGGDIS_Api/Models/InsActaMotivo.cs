using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace SGGDIS_Api.Models
{
    /// <summary>
    /// Apartado III del Acta General (HU-008): Motivo de la inspección.
    /// Relación 1:1 con INS_ACTA_GENERAL por ID_ACTA.
    /// </summary>
    [Table("INS_ACTA_MOTIVO")]
    public class InsActaMotivo
    {
        [Key]
        [DatabaseGenerated(DatabaseGeneratedOption.None)]
        [Column("ID_ACTA")]
        public int IdActa { get; set; }

        // Códigos de MOTIVOS_INSPECCION (frontend) separados por coma, en el
        // orden del catálogo, ej. "DENUNCIA,EMERGENCIA". Selección múltiple.
        [MaxLength(200)]
        [Column("MOTIVO_INSPECCION")]
        public string? MotivoInspeccion { get; set; }

        // Solo tiene contenido cuando MotivoInspeccion es "OTRO".
        [MaxLength(200)]
        [Column("MOTIVO_INSPECCION_OTRO")]
        public string? MotivoInspeccionOtro { get; set; }

        [ForeignKey(nameof(IdActa))]
        public InsActaGeneral? Acta { get; set; }
    }
}
