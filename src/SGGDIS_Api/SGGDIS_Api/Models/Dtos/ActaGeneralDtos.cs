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
    /// Datos del Apartado II (Información del Responsable durante la
    /// inspección). Igual que InfoGeneralActaDto, todo es opcional acá porque
    /// el autoguardado puede llamarse con el formulario a medio llenar.
    /// CargoResponsable es selección múltiple, igual que Acciones (Apartado V).
    /// </summary>
    public class InfoResponsableActaDto
    {
        public string? NombreResponsable { get; set; }

        public List<string>? CargoResponsable { get; set; }

        public string? CargoResponsableOtro { get; set; }

        public string? NumeroIdentificacionResponsable { get; set; }
    }

    /// <summary>
    /// Datos del Apartado III (Motivo de la inspección). Selección múltiple
    /// entre las opciones fijas del literal 3 del acta oficial; "OTRO"
    /// habilita el detalle en MotivoInspeccionOtro.
    /// </summary>
    public class InfoMotivoActaDto
    {
        public List<string>? MotivoInspeccion { get; set; }

        public string? MotivoInspeccionOtro { get; set; }
    }

    /// <summary>
    /// Datos del Apartado IV (Hallazgos de la inspección): las guías aplicables
    /// (selección múltiple, por id de INS_GUIA) y la descripción de los hallazgos.
    /// </summary>
    public class InfoHallazgosActaDto
    {
        public List<int>? IdsGuias { get; set; }

        public string? Hallazgos { get; set; }
    }

    /// <summary>
    /// Datos del Apartado V (Acciones a seguir): selección múltiple de códigos
    /// de acción; "REPROGRAMACION" y "OTRO" habilitan su texto correspondiente.
    /// </summary>
    public class InfoAccionesActaDto
    {
        public List<string>? Acciones { get; set; }

        public string? MotivoReprogramacion { get; set; }

        public string? AccionOtro { get; set; }
    }

    /// <summary>
    /// Una persona presente durante la inspección (Apartado VI). Es también
    /// la forma de cada elemento del JSON guardado en PERSONAS_PRESENTES.
    /// </summary>
    public class PersonaPresenteDto
    {
        public string? NombreCompleto { get; set; }

        public string? CargoInstitucion { get; set; }

        public string? NumeroIdentificacion { get; set; }

        // Por ahora la firma se captura como texto.
        public string? Firma { get; set; }
    }

    /// <summary>
    /// Datos del Apartado VI (Cierre de la inspección): la lista de personas
    /// presentes. La hora de inicio no viaja acá, es la del Apartado I.
    /// </summary>
    public class InfoCierreActaDto
    {
        public List<PersonaPresenteDto>? PersonasPresentes { get; set; }
    }

    /// <summary>
    /// Acta completa que manda el frontend al enviarla (PUT
    /// /api/actas-generales/{id}/envio): los seis apartados juntos, con la
    /// misma forma que cada DTO de autoguardado. La obligatoriedad de los
    /// campos ya la validó el frontend; acá solo se guardan y se finaliza el acta.
    /// </summary>
    public class EnvioActaGeneralDto
    {
        public InfoGeneralActaDto InfoGeneral { get; set; } = new();

        public InfoResponsableActaDto Responsable { get; set; } = new();

        public InfoMotivoActaDto Motivo { get; set; } = new();

        public InfoHallazgosActaDto Hallazgos { get; set; } = new();

        public InfoAccionesActaDto Acciones { get; set; } = new();

        public InfoCierreActaDto Cierre { get; set; } = new();
    }

    /// <summary>
    /// Acta completa que devuelve GET /api/actas-generales/{id} para restaurar
    /// el formulario. Junta en un solo objeto plano los campos de la tabla
    /// principal y de las tablas de cada apartado, con los mismos nombres que
    /// el frontend ya usa (fechaInspeccion, nombreResponsable, ...). Si un
    /// apartado todavía no tiene fila (nunca se guardó), sus campos vienen en null.
    /// </summary>
    public class ActaGeneralDto
    {
        public int IdActa { get; set; }

        public string NumeroActa { get; set; } = string.Empty;

        public string Estado { get; set; } = string.Empty;

        public DateTime FechaCreacion { get; set; }

        // ---- Apartado I ----
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
        public string? AutorizaIngreso { get; set; }
        public string? AutorizaFotos { get; set; }

        // ---- Apartado II ----
        public string? NombreResponsable { get; set; }
        // Códigos separados por coma (selección múltiple), ej. "REPRESENTANTE_LEGAL,OTRO".
        public string? CargoResponsable { get; set; }
        public string? CargoResponsableOtro { get; set; }
        public string? NumeroIdentificacionResponsable { get; set; }

        // ---- Apartado III ----
        // Códigos separados por coma (selección múltiple), ej. "DENUNCIA,EMERGENCIA".
        public string? MotivoInspeccion { get; set; }
        public string? MotivoInspeccionOtro { get; set; }

        // ---- Apartado IV ----
        public string? GuiasAplicables { get; set; }
        public string? Hallazgos { get; set; }

        // ---- Apartado V ----
        public string? AccionesSeguir { get; set; }
        public string? MotivoReprogramacion { get; set; }
        public string? AccionOtro { get; set; }

        // ---- Apartado VI ---- (la hora de inicio es HoraInicio, del Apartado I)
        public string? PersonasPresentes { get; set; }
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
