namespace SGGDIS_Api.Models.Dtos
{
    /// <summary>
    /// Datos que llegan desde el frontend para guardar la respuesta de un solo ítem
    /// del checklist (no es una tabla, solo viaja entre el frontend y el backend).
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
    /// Datos necesarios para crear una nueva inspección cuando el inspector
    /// selecciona un establecimiento y empieza a llenar el formulario.
    /// </summary>
    public class CrearInspeccionDto
    {
        // Guía (reglamento) que se va a usar.
        public int IdGuia { get; set; }

        // Tipo de establecimiento seleccionado.
        public int IdTipoEstablecimiento { get; set; }

        // Nombre del establecimiento que se va a inspeccionar.
        public string NombreEstablecimiento { get; set; } = string.Empty;

        // Número consecutivo (folio) de la inspección.
        public string Consecutivo { get; set; } = string.Empty;

        // Fecha en la que se realiza la inspección.
        public DateTime Fecha { get; set; }
    }

    /// <summary>
    /// Datos capturados en la pantalla de cierre de la inspección.
    /// No incluye "nombre del representante": se usa NOMBRE_ESTABLECIMIENTO,
    /// ya registrado al crear la inspección, para no duplicar el dato (estándar B10).
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
    /// Resultado que se devuelve al cerrar una inspección: puntaje, porcentaje
    /// de cumplimiento y la clasificación final del establecimiento.
    /// PuntajeMaximoReferencia es el valor fijo del catálogo, solo para mostrar
    /// de dónde partió el cálculo (no cambia entre inspecciones del mismo tipo).
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