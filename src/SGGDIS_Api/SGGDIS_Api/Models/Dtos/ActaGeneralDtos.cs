namespace SGGDIS_Api.Models.Dtos
{
    /// <summary>
    /// Datos del Apartado I (Información General del Inmueble) que llegan del
    /// frontend para guardar/actualizar el acta. Todo es opcional a nivel de
    /// DTO: la obligatoriedad de campos (marcados con * en el mock-up) se
    /// valida en el servicio, no acá, porque el autoguardado puede llamarse
    /// con el formulario todavía incompleto.
    /// </summary>
    public class InfoGeneralActaDto
    {
        public DateTime? FechaInspeccion { get; set; }

        public string? HoraInicio { get; set; }

        public string? NumeroExpediente { get; set; }

        public string? NumeroDenuncia { get; set; }

        public string? NombreComercial { get; set; }

        public string? Provincia { get; set; }

        public string? Canton { get; set; }

        public string? Distrito { get; set; }

        public string? DireccionExacta { get; set; }

        public string? TelefonoContacto { get; set; }

        public string? CorreoNotificaciones { get; set; }

        public bool? AutorizaIngreso { get; set; }

        public bool? AutorizaFotos { get; set; }
    }

    /// <summary>
    /// Lo que se le devuelve al frontend al crear el acta o al consultarla:
    /// el id interno y el folio visible (NumeroActa).
    /// </summary>
    public class ActaGeneralCreadaDto
    {
        public int IdActa { get; set; }

        public string NumeroActa { get; set; } = string.Empty;
    }
}
