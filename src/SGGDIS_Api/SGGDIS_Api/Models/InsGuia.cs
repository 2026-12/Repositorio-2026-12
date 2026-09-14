using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace SGGDIS_Api.Models
{
    /// <summary>
    /// Representa una guía de inspección, es decir, el reglamento oficial que se usa
    /// como base para revisar un establecimiento (por ejemplo, la guía de alimentos).
    /// Es un dato de catálogo: no cambia con cada inspección, solo se consulta.
    /// </summary>
    [Table("INS_GUIA")]
    public class InsGuia
    {
        // Identificador único de la guía en la base de datos.
        [Key]
        [Column("ID_GUIA")]
        public int IdGuia { get; set; }

        // Nombre oficial de la guía (ej. "Guía de Inspección para Servicios de Alimentación al Público").
        [Required]
        [MaxLength(150)]
        [Column("NOMBRE")]
        public string Nombre { get; set; } = string.Empty;

        // Texto opcional con una explicación más detallada de la guía.
        [MaxLength(300)]
        [Column("DESCRIPCION")]
        public string? Descripcion { get; set; }

        // Categoría o tipo de reglamento al que pertenece la guía.
        [Required]
        [MaxLength(100)]
        [Column("CATEGORIA")]
        public string Categoria { get; set; } = string.Empty;

        // Todas las secciones (A, B1, B2, etc.) que forman parte de esta guía.
        public ICollection<InsSeccion> Secciones { get; set; } = new List<InsSeccion>();

        // Todos los tipos de establecimiento a los que se les puede aplicar esta guía.
        public ICollection<InsTipoEstablecimiento> TiposEstablecimiento { get; set; } = new List<InsTipoEstablecimiento>();
    }
}