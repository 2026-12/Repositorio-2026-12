using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace SGGDIS_Api.Models
{
    /// <summary>
    /// Acta de Inspección General (HU-004 y sub-HU HU-006 a HU-011). A
    /// diferencia de INS_INSPECCION (que es el checklist por secciones de una
    /// guía puntuable), es el acta administrativa: datos del inmueble,
    /// responsable, motivo, hallazgos, acciones y cierre/firmas.
    /// Esta tabla principal solo guarda el folio y el estado; cada apartado
    /// vive en su propia tabla (INS_ACTA_*), relacionada 1:1 por ID_ACTA. La
    /// fila de un apartado se crea la primera vez que se guarda
    /// (autoguardado), por eso las navegaciones pueden ser null.
    /// </summary>
    [Table("INS_ACTA_GENERAL")]
    public class InsActaGeneral
    {
        [Key]
        [Column("ID_ACTA")]
        public int IdActa { get; set; }

        // Folio visible del acta, ej. "2026-00412". Se genera al crear el acta.
        [Required]
        [MaxLength(20)]
        [Column("NUMERO_ACTA")]
        public string NumeroActa { get; set; } = string.Empty;

        // "EN_PROCESO" mientras se llena, "FINALIZADA" cuando se completa el cierre.
        [Column("ESTADO")]
        [MaxLength(20)]
        public string Estado { get; set; } = "EN_PROCESO";

        [Column("FECHA_CREACION")]
        public DateTime FechaCreacion { get; set; } = DateTime.Now;

        // ---- Apartados del wizard (uno por tabla, 1:1) ----

        public InsActaInfoGeneral? InfoGeneral { get; set; }

        public InsActaResponsable? Responsable { get; set; }

        public InsActaMotivo? Motivo { get; set; }

        public InsActaHallazgos? Hallazgos { get; set; }

        public InsActaAcciones? Acciones { get; set; }

        public InsActaCierre? Cierre { get; set; }
    }
}
