namespace SGGDIS_Api.Models.Dtos.Ubicaciones
{
    public class ProvinciaDto
    {
        public int IdProvincia { get; set; }

        public string Nombre { get; set; } = string.Empty;
    }

    public class CantonDto
    {
        public int IdCanton { get; set; }

        public string Nombre { get; set; } = string.Empty;
    }

    public class DistritoDto
    {
        public int IdDistrito { get; set; }

        public string Nombre { get; set; } = string.Empty;
    }
}