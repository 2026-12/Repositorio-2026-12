using SGGDIS_Api.Models.Dtos.Ubicaciones;

namespace SGGDIS_Api.Services.Ubicaciones
{
    public interface IUbicacionService
    {
        Task<List<ProvinciaDto>>
            ObtenerProvinciasAsync();

        Task<List<CantonDto>>
            ObtenerCantonesAsync(
                int idProvincia);

        Task<List<DistritoDto>>
            ObtenerDistritosAsync(
                int idCanton);
    }
}