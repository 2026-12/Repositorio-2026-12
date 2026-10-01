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

        [ForeignKey(nameof(IdUbicacion))]
        public Ubicacion? Ubicacion { get; set; }

        public OrdenPersonaNotificada? PersonaNotificada { get; set; }

        public ICollection<Ordenanza> Ordenanzas { get; set; } = new List<Ordenanza>();

        public OrdenResponsable? Responsable { get; set; }
    }
}