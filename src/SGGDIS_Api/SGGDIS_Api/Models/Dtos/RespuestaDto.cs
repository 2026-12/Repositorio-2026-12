namespace SGGDIS_Api.Models.Dtos
{
    public class RespuestaDto
    {
        public int IdItem { get; set; }
        public string Estado { get; set; } = string.Empty;
        public int? PuntosOtorgados { get; set; }
    }

    public class CrearInspeccionDto
    {
        public int IdGuia { get; set; }
        public int IdTipoEstablecimiento { get; set; }
        public string NombreEstablecimiento { get; set; } = string.Empty;
        public string Consecutivo { get; set; } = string.Empty;
        public DateTime Fecha { get; set; }
    }

    /// Resultado devuelto al cerrar una inspección: puntaje, porcentaje y clasificación.
    /// No incluye datos de inspector/representante/observaciones: esos quedan solo en el cliente.
    public class ResumenCierreDto
    {
        public int PuntajeObtenido { get; set; }
        public int PuntajeMaximo { get; set; }
        public decimal Porcentaje { get; set; }
        public string Clasificacion { get; set; } = string.Empty;
    }
}