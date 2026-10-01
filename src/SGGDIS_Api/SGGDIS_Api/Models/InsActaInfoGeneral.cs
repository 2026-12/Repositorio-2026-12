using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace SGGDIS_Api.Models
{
    /// <summary>
    /// Apartado I del Acta General (HU-006): Información General del Inmueble.
    /// Relación 1:1 con INS_ACTA_GENERAL: ID_ACTA es a la vez PK y FK.
    /// </summary>
    [Table("INS_ACTA_INFO_GENERAL")]
    public class InsActaInfoGeneral
    {
        [Key]
        [DatabaseGenerated(DatabaseGeneratedOption.None)]
        [Column("ID_ACTA")]
        public int IdActa { get; set; }

        [Column("FECHA_INSPECCION")]
        public DateTime? FechaInspeccion { get; set; }

        // Guardada como texto "HH:mm" porque Oracle no tiene un tipo TIME simple vía EF.
        // Es la única fuente de la hora de inicio: el Apartado VI la consulta de acá.
        [MaxLength(5)]
        [Column("HORA_INICIO")]
        public string? HoraInicio { get; set; }

        // Corresponde al literal "b. Número de expediente" del acta oficial (sin la palabra "sanitario").
        [MaxLength(30)]
        [Column("NUMERO_EXPEDIENTE")]
        public string? NumeroExpediente { get; set; }

        [MaxLength(30)]
        [Column("NUMERO_DENUNCIA")]
        public string? NumeroDenuncia { get; set; }

        [MaxLength(200)]
        [Column("NOMBRE_COMERCIAL")]
        public string? NombreComercial { get; set; }

        [MaxLength(100)]
        [Column("PROVINCIA")]
        public string? Provincia { get; set; }

        [MaxLength(100)]
        [Column("CANTON")]
        public string? Canton { get; set; }

        [MaxLength(100)]
        [Column("DISTRITO")]
        public string? Distrito { get; set; }

        [MaxLength(400)]
        [Column("DIRECCION_EXACTA")]
        public string? DireccionExacta { get; set; }

        [MaxLength(30)]
        [Column("TELEFONO_CONTACTO")]
        public string? TelefonoContacto { get; set; }

        [MaxLength(150)]
        [Column("CORREO_NOTIFICACIONES")]
        public string? CorreoNotificaciones { get; set; }

        // "S"/"N". Si se niega el ingreso, el resto del acta igual se puede documentar (motivo, etc.).
        [MaxLength(1)]
        [Column("AUTORIZA_INGRESO")]
        public string? AutorizaIngreso { get; set; }

        [MaxLength(1)]
        [Column("AUTORIZA_FOTOS")]
        public string? AutorizaFotos { get; set; }

        [ForeignKey(nameof(IdActa))]
        public InsActaGeneral? Acta { get; set; }
    }
}
