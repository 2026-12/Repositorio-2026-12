using System.ComponentModel;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace SGGDIS_Api.Models
{
    /// <summary>
    /// Sección de la guía (ej. Sección "A" o "B2"). Agrupa los ítems que se
    /// revisan juntos en el formulario.
    /// </summary>
    [Table("INS_SECCION")]
    public class InsSeccion
    {
        [Key]
        [Column("ID_SECCION")]
        public int IdSeccion { get; set; }

        [Column("ID_GUIA")]
        public int IdGuia { get; set; }

        [Required]
        [MaxLength(5)]
        [Column("CODIGO")]
        public string Codigo { get; set; } = string.Empty;

        [Required]
        [MaxLength(150)]
        [Column("NOMBRE")]
        public string Nombre { get; set; } = string.Empty;

        [Column("ORDEN")]
        public int Orden { get; set; }

        [ForeignKey(nameof(IdGuia))]
        public InsGuia? Guia { get; set; }

        public ICollection<InsItem> Items { get; set; } = new List<InsItem>();

        public ICollection<InsTipoEstablecimiento> TiposEstablecimiento { get; set; } = new List<InsTipoEstablecimiento>();
    }
}