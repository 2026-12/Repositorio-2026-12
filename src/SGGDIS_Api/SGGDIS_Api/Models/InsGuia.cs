using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace SGGDIS_Api.Models
{
    /// <summary>
    /// Guía de inspección (el reglamento usado para revisar un establecimiento,
    /// ej. la guía de alimentos). Es dato de catálogo, no cambia por inspección.
    /// </summary>
    [Table("INS_GUIA")]
    public class InsGuia
    {
        [Key]
        [Column("ID_GUIA")]
        public int IdGuia { get; set; }

        [Required]
        [MaxLength(150)]
        [Column("NOMBRE")]
        public string Nombre { get; set; } = string.Empty;

        [MaxLength(300)]
        [Column("DESCRIPCION")]
        public string? Descripcion { get; set; }

        [Required]
        [MaxLength(100)]
        [Column("CATEGORIA")]
        public string Categoria { get; set; } = string.Empty;

        public ICollection<InsSeccion> Secciones { get; set; } = new List<InsSeccion>();

        public ICollection<InsTipoEstablecimiento> TiposEstablecimiento { get; set; } = new List<InsTipoEstablecimiento>();
    }
}