using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace SGGDIS_Api.Models
{
    /// <summary>
    /// Inspección real hecha a un establecimiento, el "expediente" de la visita.
    /// A diferencia de las tablas de catálogo, esta sí crece con cada inspección.
    /// </summary>
    [Table("INS_INSPECCION")]
    public class InsInspeccion
    {
        [Key]
        [Column("ID_INSPECCION")]
        public int IdInspeccion { get; set; }

        [Column("ID_GUIA")]
        public int IdGuia { get; set; }

        [Column("ID_TIPO_ESTABLECIMIENTO")]
        public int IdTipoEstablecimiento { get; set; }

        [Column("NOMBRE_ESTABLECIMIENTO")]
        [MaxLength(200)]
        public string NombreEstablecimiento { get; set; } = string.Empty;

        // Folio único de la inspección.
        [Column("CONSECUTIVO")]
        [MaxLength(30)]
        public string Consecutivo { get; set; } = string.Empty;

        [Column("FECHA")]
        public DateTime Fecha { get; set; }

        // "EN_PROCESO" mientras se llena, "FINALIZADA" cuando se cierra.
        [Column("ESTADO")]
        [MaxLength(20)]
        public string Estado { get; set; } = "EN_PROCESO";

        // ---- Datos de cierre: se llenan solo cuando pasa a FINALIZADA ----

        [Column("NOMBRE_INSPECTOR")]
        [MaxLength(150)]
        public string? NombreInspector { get; set; }

        [Column("IDENTIFICACION_INSPECTOR")]
        [MaxLength(30)]
        public string? IdentificacionInspector { get; set; }

        [Column("IDENTIFICACION_REPRESENTANTE")]
        [MaxLength(30)]
        public string? IdentificacionRepresentante { get; set; }

        [Column("OBSERVACIONES_FINALES")]
        [MaxLength(2000)]
        public string? ObservacionesFinales { get; set; }

        // "S" si hubo orden sanitaria por ítems críticos incumplidos, "N" si no.
        [MaxLength(1)]
        [Column("ORDEN_SANITARIA")]
        public string OrdenSanitaria { get; set; } = "N";

        [Column("PUNTAJE_OBTENIDO")]
        public int? PuntajeObtenido { get; set; }

        // Puntaje obtenido / puntaje máximo.
        [Column("PORCENTAJE_CUMPLIMIENTO")]
        public decimal? PorcentajeCumplimiento { get; set; }

        [Column("CLASIFICACION")]
        [MaxLength(30)]
        public string? Clasificacion { get; set; }

        [Column("FECHA_CIERRE")]
        public DateTime? FechaCierre { get; set; }

        // Puntaje máximo que aplicaba a este tipo de establecimiento al cerrar.
        [Column("PUNTAJE_MAXIMO_APLICADO")]
        public int? PuntajeMaximoAplicado { get; set; }

        [ForeignKey(nameof(IdGuia))]
        public InsGuia? Guia { get; set; }

        [ForeignKey(nameof(IdTipoEstablecimiento))]
        public InsTipoEstablecimiento? TipoEstablecimiento { get; set; }

        public ICollection<InsRespuesta> Respuestas { get; set; } = new List<InsRespuesta>();
    }
}