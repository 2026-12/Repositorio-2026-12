using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace SGGDIS_Api.Models.OrdenesSanitarias
{
    [Table("INS_ORDENANZA")]
    public class Ordenanza
    {
        [Key]
        [Column("ID_ORDENANZA")]
        public int IdOrdenanza { get; set; }

        [Column("ID_ORDEN_SANITARIA")]
        public int IdOrdenSanitaria { get; set; }

        [Column("NUMERO_ORDEN")]
        public int NumeroOrden { get; set; }

        [Column("ORDENANZA")]
        [MaxLength(4000)]
        public string DescripcionOrdenanza { get; set; } = string.Empty;

        [Column("FUNDAMENTO_LEGAL")]
        [MaxLength(4000)]
        public string FundamentoLegal { get; set; } = string.Empty;

        [ForeignKey(nameof(IdOrdenSanitaria))]
        public OrdenSanitaria? OrdenSanitaria { get; set; }

        // Cada ordenanza tiene un único plazo.
        public OrdenanzaPlazo? Plazo { get; set; }
    }
}