using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using SGGDIS_Api.Models.Ubicaciones;

namespace SGGDIS_Api.Models.OrdenesSanitarias
{
    [Table("INS_ORDEN_SANITARIA")]
    public class OrdenSanitaria
    {
        [Key]
        [Column("ID_ORDEN_SANITARIA")]
        public int IdOrdenSanitaria { get; set; }

        [Column("ID_INSPECCION")]
        public int IdInspeccion { get; set; }

        [Column("ID_UBICACION")]
        public int IdUbicacion { get; set; }

        [Column("NUMERO_CONSECUTIVO")]
        [MaxLength(100)]
        public string NumeroConsecutivo { get; set; } = string.Empty;

        [Column("NUMERO_EXPEDIENTE")]
        [MaxLength(100)]
        public string? NumeroExpediente { get; set; }

        [Column("NOMBRE_ESTABLECIMIENTO")]
        [MaxLength(200)]
        public string NombreEstablecimiento { get; set; } = string.Empty;

        [Column("FECHA_EMISION")]
        public DateTime FechaEmision { get; set; }

        [Column("FECHA_NOTIFICACION")]
        public DateTime FechaNotificacion { get; set; }

        [Column("MOTIVO")]
        [MaxLength(4000)]
        public string Motivo { get; set; } = string.Empty;

        // Relación con la ubicación de la Orden Sanitaria.
        [ForeignKey(nameof(IdUbicacion))]
        public Ubicacion? Ubicacion { get; set; }

        // Persona a la que se le notifica la Orden Sanitaria.
        public OrdenPersonaNotificada? PersonaNotificada { get; set; }

        // Una Orden Sanitaria puede contener varias ordenanzas.
        public ICollection<Ordenanza> Ordenanzas { get; set; }
            = new List<Ordenanza>();

        // Persona funcionaria responsable de emitir la Orden Sanitaria.
        public OrdenResponsable? Responsable { get; set; }
    }
}