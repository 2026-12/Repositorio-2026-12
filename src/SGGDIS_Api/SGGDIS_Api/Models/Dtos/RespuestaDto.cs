namespace SGGDIS_Api.Models.Dtos
{
    /// <summary>
    /// Datos que llegan del frontend para guardar la respuesta de un ítem del
    /// checklist. No es tabla, solo viaja entre frontend y backend.
    /// </summary>
    public class RespuestaDto
    {
        // Ítem del checklist que se está respondiendo.
        public int IdItem { get; set; }

        // Valor marcado: "Cumple", "No cumple" o "N/A".
        public string Estado { get; set; } = string.Empty;

        // Puntos otorgados para ese ítem (si aplica puntaje parcial).
        public int? PuntosOtorgados { get; set; }
    }

    /// <summary>
    /// Datos para crear una inspección: se usan cuando el inspector elige un
    /// establecimiento y arranca el formulario.
    /// </summary>
    public class CrearInspeccionDto
    {
        // Guía (reglamento) que se va a usar.
        public int IdGuia { get; set; }

        // Tipo de establecimiento seleccionado.
        public int IdTipoEstablecimiento { get; set; }

        // Nombre del establecimiento a inspeccionar.
        public string NombreEstablecimiento { get; set; } = string.Empty;

        // Folio de la inspección.
        public string Consecutivo { get; set; } = string.Empty;

        // Fecha de la inspección.
        public DateTime Fecha { get; set; }
    }

    /// <summary>
    /// Datos que se capturan al cerrar la inspección. No pide "nombre del
    /// representante": ya se guardó como NOMBRE_ESTABLECIMIENTO al crear la
    /// inspección, no hace falta duplicarlo (estándar B10).
    /// </summary>
    public class CerrarInspeccionDto
    {
        // Nombre de quien realizó la inspección.
        public string NombreInspector { get; set; } = string.Empty;

        // Identificación de quien realizó la inspección.
        public string IdentificacionInspector { get; set; } = string.Empty;

        // Identificación de quien representó al establecimiento en la visita.
        public string IdentificacionRepresentante { get; set; } = string.Empty;

        // Observaciones finales que deja la persona inspectora (opcional).
        public string? ObservacionesFinales { get; set; }

        // Si se debe registrar una orden sanitaria para este cierre.
        public bool RegistrarOrdenSanitaria { get; set; }
    }

    /// <summary>
    /// Resultado de cerrar una inspección: puntaje, porcentaje de cumplimiento
    /// y clasificación final. PuntajeMaximoReferencia es el valor fijo del
    /// catálogo, solo para referencia (no cambia entre inspecciones del mismo tipo).
    /// </summary>
    public class ResumenCierreDto
    {
        // Puntos que obtuvo el establecimiento.
        public int PuntajeObtenido { get; set; }

        // Puntaje máximo que se aplicó realmente en esta inspección.
        public int PuntajeMaximo { get; set; }

        // Puntaje máximo de referencia según el catálogo del tipo de establecimiento.
        public int PuntajeMaximoReferencia { get; set; }

        // Porcentaje de cumplimiento resultante.
        public decimal Porcentaje { get; set; }

        // Clasificación final obtenida según el porcentaje.
        public string Clasificacion { get; set; } = string.Empty;
    }
}