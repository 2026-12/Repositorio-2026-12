using SGGDIS_Api.Models.OrdenesSanitarias;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace SGGDIS_Api.Models.Ubicaciones
{
    [Table("MS_CANTON")]
    public class Canton
    {
        [Key]
        [Column("ID_CANTON")]
        public int IdCanton { get; set; }

        [Column("ID_PROVINCIA")]
        public int IdProvincia { get; set; }

        [Column("NOMBRE")]
        [MaxLength(100)]
        public string Nombre { get; set; } = string.Empty;

        [ForeignKey(nameof(IdProvincia))]
        public Provincia? Provincia { get; set; }

        public ICollection<Distrito> Distritos { get; set; }
            = new List<Distrito>();
    }
}