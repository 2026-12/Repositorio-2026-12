using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace SGGDIS_Api.Models
{
    /// <summary>
    /// Representa un tipo de establecimiento (por ejemplo, "Soda con servicio Express"
    /// o "Servicios de Catering"). Cada tipo tiene su propio puntaje máximo posible
    /// y determina qué secciones del checklist le aplican.
    /// </summary>
    [Table("INS_TIPO_ESTABLECIMIENTO")]
    public class InsTipoEstablecimiento
    {
        // Identificador único del tipo de establecimiento.
        [Key]
        [Column("ID_TIPO_ESTABLECIMIENTO")]
        public int IdTipoEstablecimiento { get; set; }

        // A qué guía (reglamento) pertenece este tipo de establecimiento.
        [Column("ID_GUIA")]
        public int IdGuia { get; set; }

        // Nombre visible del tipo de establecimiento.
        [Required]
        [MaxLength(100)]
        [Column("NOMBRE")]
        public string Nombre { get; set; } = string.Empty;

        // El puntaje total que se puede obtener si se cumplen todos los ítems que le aplican.
        [Column("PUNTAJE_MAXIMO")]
        public int PuntajeMaximo { get; set; }

        // El orden en que debe aparecer este tipo en listas o menús.
        [Column("ORDEN")]
        public int Orden { get; set; }

        // La guía (reglamento) a la que pertenece este tipo de establecimiento.
        [ForeignKey(nameof(IdGuia))]
        public InsGuia? Guia { get; set; }

        // Las secciones del checklist que aplican a este tipo de establecimiento.
        public ICollection<InsSeccion> Secciones { get; set; } = new List<InsSeccion>();
    }
}