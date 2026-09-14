using System.ComponentModel;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace SGGDIS_Api.Models
{
    /// <summary>
    /// Representa una sección de la guía (por ejemplo, la Sección "A" o "B2").
    /// Cada sección agrupa varios ítems que se revisan juntos en el formulario.
    /// </summary>
    [Table("INS_SECCION")]
    public class InsSeccion
    {
        // Identificador único de la sección.
        [Key]
        [Column("ID_SECCION")]
        public int IdSeccion { get; set; }

        // A qué guía (reglamento) pertenece esta sección.
        [Column("ID_GUIA")]
        public int IdGuia { get; set; }

        // Código corto de la sección, como se muestra en el formulario (ej. "B2").
        [Required]
        [MaxLength(5)]
        [Column("CODIGO")]
        public string Codigo { get; set; } = string.Empty;

        // Nombre completo de la sección (ej. "Área de Preparación de Alimentos").
        [Required]
        [MaxLength(150)]
        [Column("NOMBRE")]
        public string Nombre { get; set; } = string.Empty;

        // El orden en que debe aparecer esta sección dentro del formulario.
        [Column("ORDEN")]
        public int Orden { get; set; }

        // La guía a la que pertenece esta sección.
        [ForeignKey(nameof(IdGuia))]
        public InsGuia? Guia { get; set; }

        // Los ítems (preguntas del checklist) que forman parte de esta sección.
        public ICollection<InsItem> Items { get; set; } = new List<InsItem>();

        // Los tipos de establecimiento a los que les aplica esta sección.
        public ICollection<InsTipoEstablecimiento> TiposEstablecimiento { get; set; } = new List<InsTipoEstablecimiento>();
    }
}