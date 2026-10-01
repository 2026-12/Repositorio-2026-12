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

        // ---- Apartado II (HU-007): Información del Responsable durante la inspección ----

        [MaxLength(200)]
        [Column("NOMBRE_RESPONSABLE")]
        public string? NombreResponsable { get; set; }

        // Uno de los valores fijos de CARGOS_RESPONSABLE (frontend), ej. "REPRESENTANTE_LEGAL" u "OTRO".
        [MaxLength(30)]
        [Column("CARGO_RESPONSABLE")]
        public string? CargoResponsable { get; set; }

        // Solo tiene contenido cuando CargoResponsable es "OTRO": el detalle que escribió el inspector.
        [MaxLength(200)]
        [Column("CARGO_RESPONSABLE_OTRO")]
        public string? CargoResponsableOtro { get; set; }

        [MaxLength(30)]
        [Column("NUMERO_IDENTIFICACION_RESPONSABLE")]
        public string? NumeroIdentificacionResponsable { get; set; }

        // ---- Apartado III (HU-008): Motivo de la inspección ----

        // Uno de los valores fijos de MOTIVOS_INSPECCION (frontend), ej. "DENUNCIA" u "OTRO".
        // Es selección única: el literal dice "marque la opción" (singular), no "las opciones".
        [MaxLength(30)]
        [Column("MOTIVO_INSPECCION")]
        public string? MotivoInspeccion { get; set; }

        // Solo tiene contenido cuando MotivoInspeccion es "OTRO".
        [MaxLength(200)]
        [Column("MOTIVO_INSPECCION_OTRO")]
        public string? MotivoInspeccionOtro { get; set; }

        // ---- Apartado IV (HU-009): Hallazgos de la inspección ----

        // Ids de INS_GUIA seleccionados, separados por coma y ordenados, ej. "1,3".
        // Se guardan ids (no nombres) para que renombrar una guía no deje datos huérfanos.
        [MaxLength(200)]
        [Column("GUIAS_APLICABLES")]
        public string? GuiasAplicables { get; set; }

        [MaxLength(4000)]
        [Column("HALLAZGOS")]
        public string? Hallazgos { get; set; }

        // ---- Apartado V (HU-010): Acciones a seguir ----

        // Códigos de ACCIONES_A_SEGUIR (frontend) separados por coma, en el
        // orden del catálogo, ej. "ORDEN_SANITARIA,DECOMISO". Selección múltiple.
        [MaxLength(200)]
        [Column("ACCIONES_SEGUIR")]
        public string? AccionesSeguir { get; set; }

        // Solo tiene contenido cuando "REPROGRAMACION" está entre las acciones.
        [MaxLength(400)]
        [Column("MOTIVO_REPROGRAMACION")]
        public string? MotivoReprogramacion { get; set; }

        // Solo tiene contenido cuando "OTRO" está entre las acciones.
        [MaxLength(200)]
        [Column("ACCION_OTRO")]
        public string? AccionOtro { get; set; }
    }
}
