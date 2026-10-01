using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace SGGDIS_Api.Models.OrdenesSanitarias
{
    [Table("INS_ORDEN_RESPONSABLE")]
    public class OrdenResponsable
    {
        [Key]
        [Column("ID_ORDEN_RESPONSABLE")]
        public int IdOrdenResponsable { get; set; }

        [Column("ID_ORDEN_SANITARIA")]
        public int IdOrdenSanitaria { get; set; }

        [Column("NOMBRE_COMPLETO")]
        [MaxLength(200)]
        public string NombreCompleto { get; set; } = string.Empty;

        [Column("CARGO")]
        [MaxLength(150)]
        public string Cargo { get; set; } = string.Empty;

        [Column("UNIDAD_ORGANIZATIVA_ARS")]
        [MaxLength(200)]
        public string UnidadOrganizativaArs { get; set; } = string.Empty;

        [Column("FIRMA")]
        [MaxLength(500)]
        public string? Firma { get; set; }

        [ForeignKey(nameof(IdOrdenSanitaria))]
        public OrdenSanitaria? OrdenSanitaria { get; set; }
    }
}