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
    }
}