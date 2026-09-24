using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace SGGDIS_Api.Models
{
    /// <summary>
    /// Acta de Inspección General (HU-004 y sub-HU HU-006 a HU-011). A
    /// diferencia de INS_INSPECCION (que es el checklist por secciones de una
    /// guía puntuable), esta tabla guarda el acta administrativa: datos del
    /// inmueble, responsable, motivo, hallazgos, acciones y cierre/firmas.
    /// Cada apartado se guarda por separado (autoguardado) a medida que el
    /// inspector avanza en el wizard, por eso casi todo es opcional acá y la
    /// validación de obligatoriedad vive en el frontend/servicio por apartado.
    /// </summary>
    [Table("INS_ACTA_GENERAL")]
    public class InsActaGeneral
    {
        [Key]
        [Column("ID_ACTA")]
        public int IdActa { get; set; }

        // Folio visible del acta, ej. "2026-00412". Se genera al crear el acta.
        [Required]
        [MaxLength(20)]
        [Column("NUMERO_ACTA")]
        public string NumeroActa { get; set; } = string.Empty;

        // "EN_PROCESO" mientras se llena, "FINALIZADA" cuando se completa el cierre (HU-011).
        [Column("ESTADO")]
        [MaxLength(20)]
        public string Estado { get; set; } = "EN_PROCESO";

        [Column("FECHA_CREACION")]
        public DateTime FechaCreacion { get; set; } = DateTime.Now;

        // ---- Apartado I (HU-006): Información General del Inmueble ----

        [Column("FECHA_INSPECCION")]
        public DateTime? FechaInspeccion { get; set; }

        // Guardada como texto "HH:mm" porque Oracle no tiene un tipo TIME simple vía EF.
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
    }
}
