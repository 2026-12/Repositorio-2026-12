namespace SGGDIS_Api.Models.Dtos.OrdenesSanitarias
{
    public class CrearOrdenSanitariaDto
    {
        public int IdInspeccion { get; set; }
        public int IdDistrito { get; set; }
        public string DireccionExacta { get; set; } = string.Empty;
        public string NumeroConsecutivo { get; set; } = string.Empty;
        public string? NumeroExpediente { get; set; }
        public string NombreEstablecimiento { get; set; } = string.Empty;
        public DateTime FechaEmision { get; set; }
        public DateTime FechaNotificacion { get; set; }
        public string Motivo { get; set; } = string.Empty;

        public PersonaNotificadaDto PersonaNotificada { get; set; } = new();
        public List<OrdenanzaDto> Ordenanzas { get; set; } = new();
        public ResponsableOrdenDto Responsable { get; set; } = new();
    }

    public class PersonaNotificadaDto
    {
        public string NombreCompleto { get; set; } = string.Empty;
        public string Condicion { get; set; } = string.Empty;
        public string? OtraCondicion { get; set; }
        public string Identificacion { get; set; } = string.Empty;
    }

    public class OrdenanzaDto
    {
        public int NumeroOrden { get; set; }
        public string Ordenanza { get; set; } = string.Empty;
        public string FundamentoLegal { get; set; } = string.Empty;
        public PlazoOrdenanzaDto Plazo { get; set; } = new();
    }

    public class PlazoOrdenanzaDto
    {
        public string TipoPlazo { get; set; } = string.Empty;
        public int? Cantidad { get; set; }
        public int? DiaCumplimiento { get; set; }
        public int? MesCumplimiento { get; set; }
        public int? AnioCumplimiento { get; set; }
        public string? HoraCumplimiento { get; set; }
    }

    public class ResponsableOrdenDto
    {
        public string NombreCompleto { get; set; } = string.Empty;
        public string Cargo { get; set; } = string.Empty;
        public string UnidadOrganizativaArs { get; set; } = string.Empty;
        public string? Firma { get; set; }
    }

    // ================================
    // DTOs de respuesta
    // ================================

    public class OrdenSanitariaRespuestaDto
    {
        public int IdOrdenSanitaria { get; set; }
        public int IdInspeccion { get; set; }

        public string NumeroConsecutivo { get; set; } = string.Empty;
        public string? NumeroExpediente { get; set; }
        public string NombreEstablecimiento { get; set; } = string.Empty;

        public DateTime FechaEmision { get; set; }
        public DateTime FechaNotificacion { get; set; }

        public string Motivo { get; set; } = string.Empty;

        public UbicacionOrdenDto? Ubicacion { get; set; }

        public PersonaNotificadaDto? PersonaNotificada { get; set; }

        public List<OrdenanzaRespuestaDto> Ordenanzas { get; set; } = new();

        public ResponsableOrdenDto? Responsable { get; set; }
    }

    public class UbicacionOrdenDto
    {
        public int IdProvincia { get; set; }
        public string Provincia { get; set; } = string.Empty;

        public int IdCanton { get; set; }
        public string Canton { get; set; } = string.Empty;

        public int IdDistrito { get; set; }
        public string Distrito { get; set; } = string.Empty;

        public string DireccionExacta { get; set; } = string.Empty;
    }

    public class OrdenanzaRespuestaDto
    {
        public int IdOrdenanza { get; set; }
        public int NumeroOrden { get; set; }

        public string Ordenanza { get; set; } = string.Empty;
        public string FundamentoLegal { get; set; } = string.Empty;

        public PlazoOrdenanzaDto? Plazo { get; set; }
    }
}