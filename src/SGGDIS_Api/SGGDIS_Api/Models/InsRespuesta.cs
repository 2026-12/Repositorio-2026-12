using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace SGGDIS_Api.Models
{
    [Table("INS_RESPUESTA")]
    public class InsRespuesta
    {
        [Key]
        [Column("ID_RESPUESTA")]
        public int IdRespuesta { get; set; }

        [Column("ID_INSPECCION")]
        public int IdInspeccion { get; set; }

        [Column("ID_ITEM")]
        public int IdItem { get; set; }

        [Column("ESTADO")]
        [MaxLength(15)]
        public string Estado { get; set; } = string.Empty; // 'Cumple' | 'No cumple' | 'N/A'

        [Column("PUNTOS_OTORGADOS")]
        public int? PuntosOtorgados { get; set; }

        [ForeignKey(nameof(IdInspeccion))]
        public InsInspeccion? Inspeccion { get; set; }

        [ForeignKey(nameof(IdItem))]
        public InsItem? Item { get; set; }
    }
}
