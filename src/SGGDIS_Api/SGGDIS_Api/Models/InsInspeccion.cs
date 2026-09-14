using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace SGGDIS_Api.Models
{
    /// <summary>
    /// Representa una inspección real hecha a un establecimiento específico: es el
    /// "expediente" de esa visita. A diferencia de las tablas de catálogo (guía,
    /// sección, ítem), esta tabla sí crece con cada inspección que se realiza.
    /// </summary>
    [Table("INS_INSPECCION")]
    public class InsInspeccion
    {
        // Identificador único de esta inspección.
        [Key]
        [Column("ID_INSPECCION")]
        public int IdInspeccion { get; set; }

        // La guía (reglamento) que se está usando para esta inspección.
        [Column("ID_GUIA")]
        public int IdGuia { get; set; }

        // El tipo de establecimiento que se está inspeccionando.
        [Column("ID_TIPO_ESTABLECIMIENTO")]
        public int IdTipoEstablecimiento { get; set; }

        // Nombre del establecimiento que se está inspeccionando.
        [Column("NOMBRE_ESTABLECIMIENTO")]
        [MaxLength(200)]
        public string NombreEstablecimiento { get; set; } = string.Empty;

        // Número consecutivo único que identifica esta inspección (como un folio).
        [Column("CONSECUTIVO")]
        [MaxLength(30)]
        public string Consecutivo { get; set; } = string.Empty;

        // Fecha en que se realizó la inspección.
        [Column("FECHA")]
        public DateTime Fecha { get; set; }

        // Estado actual de la inspección: "EN_PROCESO" mientras se está llenando,
        // o "FINALIZADA" una vez que se cierra.
        [Column("ESTADO")]
        [MaxLength(20)]
        public string Estado { get; set; } = "EN_PROCESO";

        // ---- Datos de cierre de la inspección ----
        // Las siguientes propiedades solo se llenan cuando la inspección se cierra
        // (cuando pasa de "EN_PROCESO" a "FINALIZADA").

        // Nombre de la persona inspectora que realizó la visita.
        [Column("NOMBRE_INSPECTOR")]
        [MaxLength(150)]
        public string? NombreInspector { get; set; }

        // Número de identificación de la persona inspectora.
        [Column("IDENTIFICACION_INSPECTOR")]
        [MaxLength(30)]
        public string? IdentificacionInspector { get; set; }

        // Número de identificación de quien representó al establecimiento durante la visita.
        [Column("IDENTIFICACION_REPRESENTANTE")]
        [MaxLength(30)]
        public string? IdentificacionRepresentante { get; set; }

        // Comentarios u observaciones finales que deja la persona inspectora.
        [Column("OBSERVACIONES_FINALES")]
        [MaxLength(2000)]
        public string? ObservacionesFinales { get; set; }

        // Indica si se emitió una orden sanitaria ("S") por incumplimiento de ítems
        // críticos, o no ("N").
        [MaxLength(1)]
        [Column("ORDEN_SANITARIA")]
        public string OrdenSanitaria { get; set; } = "N";

        // Puntaje total que obtuvo el establecimiento al cerrar la inspección.
        [Column("PUNTAJE_OBTENIDO")]
        public int? PuntajeObtenido { get; set; }

        // Porcentaje de cumplimiento resultante (puntaje obtenido / puntaje máximo).
        [Column("PORCENTAJE_CUMPLIMIENTO")]
        public decimal? PorcentajeCumplimiento { get; set; }

        // Clasificación final del establecimiento según su porcentaje de cumplimiento.
        [Column("CLASIFICACION")]
        [MaxLength(30)]
        public string? Clasificacion { get; set; }

        // Fecha y hora exacta en que se cerró la inspección.
        [Column("FECHA_CIERRE")]
        public DateTime? FechaCierre { get; set; }

        // Puntaje máximo que aplicaba para este tipo de establecimiento al momento del cierre.
        [Column("PUNTAJE_MAXIMO_APLICADO")]
        public int? PuntajeMaximoAplicado { get; set; }

        // La guía (reglamento) usada en esta inspección.
        [ForeignKey(nameof(IdGuia))]
        public InsGuia? Guia { get; set; }

        // El tipo de establecimiento inspeccionado.
        [ForeignKey(nameof(IdTipoEstablecimiento))]
        public InsTipoEstablecimiento? TipoEstablecimiento { get; set; }

        // Todas las respuestas (una por cada ítem del checklist) registradas en esta inspección.
        public ICollection<InsRespuesta> Respuestas { get; set; } = new List<InsRespuesta>();
    }
}