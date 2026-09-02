using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace SGGDIS_Api.Models
{
    /// Un tipo de establecimiento (ej. "Soda con servicio Express"), con su propio puntaje máximo.
    [Table("INS_TIPO_ESTABLECIMIENTO")]
    public class InsTipoEstablecimiento
    {
        [Key]
        [Column("ID_TIPO_ESTABLECIMIENTO")]
        public int IdTipoEstablecimiento { get; set; }

        [Column("ID_GUIA")]
        public int IdGuia { get; set; }

        [Required]
        [MaxLength(100)]
        [Column("NOMBRE")]
        public string Nombre { get; set; } = string.Empty;

        [Column("PUNTAJE_MAXIMO")]
        public int PuntajeMaximo { get; set; }

        [Column("ORDEN")]
        public int Orden { get; set; }

        [ForeignKey(nameof(IdGuia))]
        public InsGuia? Guia { get; set; }

        public ICollection<InsSeccion> Secciones { get; set; } = new List<InsSeccion>();
    }
}