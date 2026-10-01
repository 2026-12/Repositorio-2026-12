using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace SGGDIS_Api.Models.OrdenesSanitarias
{
    [Table("INS_ORDENANZA_PLAZO")]
    public class OrdenanzaPlazo
    {
        [Key]
        [Column("ID_ORDENANZA_PLAZO")]
        public int IdOrdenanzaPlazo { get; set; }

        [Column("ID_ORDENANZA")]
        public int IdOrdenanza { get; set; }

        [Column("TIPO_PLAZO")]
        [MaxLength(10)]
        public string TipoPlazo { get; set; } = string.Empty;

        [Column("CANTIDAD")]
        public int? Cantidad { get; set; }

        [Column("DIA_CUMPLIMIENTO")]
        public int? DiaCumplimiento { get; set; }

        [Column("MES_CUMPLIMIENTO")]
        public int? MesCumplimiento { get; set; }

        [Column("ANIO_CUMPLIMIENTO")]
        public int? AnioCumplimiento { get; set; }

        [Column("HORA_CUMPLIMIENTO")]
        [MaxLength(5)]
        public string? HoraCumplimiento { get; set; }

        [ForeignKey(nameof(IdOrdenanza))]
        public Ordenanza? Ordenanza { get; set; }
    }
}