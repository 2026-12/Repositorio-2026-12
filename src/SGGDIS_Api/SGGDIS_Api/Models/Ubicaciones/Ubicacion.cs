using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using SGGDIS_Api.Models.OrdenesSanitarias;

namespace SGGDIS_Api.Models.Ubicaciones
{
    [Table("MS_UBICACION")]
    public class Ubicacion
    {
        [Key]
        [Column("ID_UBICACION")]
        public int IdUbicacion { get; set; }

        [Column("ID_DISTRITO")]
        public int IdDistrito { get; set; }

        [Column("DIRECCION_EXACTA")]
        [MaxLength(400)]
        public string DireccionExacta { get; set; } = string.Empty;

        [ForeignKey(nameof(IdDistrito))]
        public Distrito? Distrito { get; set; }

        public ICollection<OrdenSanitaria> OrdenesSanitarias { get; set; }
            = new List<OrdenSanitaria>();
    }
}