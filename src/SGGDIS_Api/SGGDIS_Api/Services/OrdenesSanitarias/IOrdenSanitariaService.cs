using SGGDIS_Api.Models.Dtos.OrdenesSanitarias;
using SGGDIS_Api.Models.OrdenesSanitarias;

namespace SGGDIS_Api.Services.OrdenesSanitarias
{
    public interface IOrdenSanitariaService
    {
        Task<OrdenSanitaria> CrearOrdenSanitariaAsync(
            CrearOrdenSanitariaDto dto);

        Task<OrdenSanitariaRespuestaDto?>
            ObtenerOrdenSanitariaAsync(
                int idOrdenSanitaria);

        Task<List<OrdenSanitariaRespuestaDto>>
            ObtenerPorInspeccionAsync(
                int idInspeccion);
    }
}