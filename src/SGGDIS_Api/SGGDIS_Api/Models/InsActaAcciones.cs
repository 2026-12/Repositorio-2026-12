using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace SGGDIS_Api.Models
{
    /// <summary>
    /// Apartado V del Acta General (HU-010): Acciones a seguir.
    /// Relación 1:1 con INS_ACTA_GENERAL por ID_ACTA.
    /// </summary>
    [Table("INS_ACTA_ACCIONES")]
    public class InsActaAcciones
    {
        [Key]
        [DatabaseGenerated(DatabaseGeneratedOption.None)]
        [Column("ID_ACTA")]
        public int IdActa { get; set; }

        // Códigos de ACCIONES_A_SEGUIR (frontend) separados por coma, en el
        // orden del catálogo, ej. "ORDEN_SANITARIA,DECOMISO". Selección múltiple.
        [MaxLength(200)]
        [Column("ACCIONES_SEGUIR")]
        public string? AccionesSeguir { get; set; }

        // Solo tiene contenido cuando "REPROGRAMACION" está entre las acciones.
        [MaxLength(400)]
        [Column("MOTIVO_REPROGRAMACION")]
        public string? MotivoReprogramacion { get; set; }

        // Solo tiene contenido cuando "OTRO" está entre las acciones.
        [MaxLength(200)]
        [Column("ACCION_OTRO")]
        public string? AccionOtro { get; set; }

        [ForeignKey(nameof(IdActa))]
        public InsActaGeneral? Acta { get; set; }
    }
}
