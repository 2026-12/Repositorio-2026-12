using SGGDIS_Api.Models.OrdenesSanitarias;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace SGGDIS_Api.Models.Ubicaciones
{
    [Table("MS_DISTRITO")]
    public class Distrito
    {
        [Key]
        [Column("ID_DISTRITO")]
        public int IdDistrito { get; set; }

        [Column("ID_CANTON")]
        public int IdCanton { get; set; }

        [Column("NOMBRE")]
        [MaxLength(100)]
        public string Nombre { get; set; } = string.Empty;

        [ForeignKey(nameof(IdCanton))]
        public Canton? Canton { get; set; }

        public ICollection<Ubicacion> Ubicaciones { get; set; }
            = new List<Ubicacion>();
    }
}