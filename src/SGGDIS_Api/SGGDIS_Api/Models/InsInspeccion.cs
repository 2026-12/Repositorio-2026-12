using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace SGGDIS_Api.Models
{
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

        [Column("CONSECUTIVO")]
        [MaxLength(30)]
        public string Consecutivo { get; set; } = string.Empty;

        [Column("FECHA")]
        public DateTime Fecha { get; set; }

        [Column("ESTADO")]
        [MaxLength(20)]
        public string Estado { get; set; } = "EN_PROCESO";

        [ForeignKey(nameof(IdGuia))]
        public InsGuia? Guia { get; set; }

        [ForeignKey(nameof(IdTipoEstablecimiento))]
        public InsTipoEstablecimiento? TipoEstablecimiento { get; set; }

        public ICollection<InsRespuesta> Respuestas { get; set; } = new List<InsRespuesta>();
    }
}