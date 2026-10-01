using SGGDIS_Api.Models.OrdenesSanitarias;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace SGGDIS_Api.Models.Ubicaciones
{
    [Table("MS_PROVINCIA")]
    public class Provincia
    {
        [Key]
        [Column("ID_PROVINCIA")]
        public int IdProvincia { get; set; }

        [Column("NOMBRE")]
        [MaxLength(100)]
        public string Nombre { get; set; } = string.Empty;

        public ICollection<Canton> Cantones { get; set; }
            = new List<Canton>();
    }
}