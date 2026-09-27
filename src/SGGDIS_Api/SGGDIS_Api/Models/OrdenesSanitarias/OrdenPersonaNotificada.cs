using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace SGGDIS_Api.Models.OrdenesSanitarias
{
    [Table("INS_ORDEN_PERSONA_NOTIFICADA")]
    public class OrdenPersonaNotificada
    {
        [Key]
        [Column("ID_PERSONA_NOTIFICADA")]
        public int IdPersonaNotificada { get; set; }

        [Column("ID_ORDEN_SANITARIA")]
        public int IdOrdenSanitaria { get; set; }

        [Column("NOMBRE_COMPLETO")]
        [MaxLength(200)]
        public string NombreCompleto { get; set; } = string.Empty;

        [Column("CONDICION")]
        [MaxLength(100)]
        public string Condicion { get; set; } = string.Empty;

        [Column("OTRA_CONDICION")]
        [MaxLength(200)]
        public string? OtraCondicion { get; set; }

        [Column("IDENTIFICACION")]
        [MaxLength(100)]
        public string Identificacion { get; set; } = string.Empty;

        [ForeignKey(nameof(IdOrdenSanitaria))]
        public OrdenSanitaria? OrdenSanitaria { get; set; }
    }
}