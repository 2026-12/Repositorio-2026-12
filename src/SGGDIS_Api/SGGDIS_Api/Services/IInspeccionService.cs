using SGGDIS_Api.Models;
using SGGDIS_Api.Models.Dtos;

namespace SGGDIS_Api.Services
{
    public interface IInspeccionService
    {
        Task<InsInspeccion> CrearInspeccionAsync(CrearInspeccionDto dto);
        Task GuardarRespuestasAsync(int idInspeccion, List<RespuestaDto> respuestas);
        Task<List<InsRespuesta>> ObtenerRespuestasAsync(int idInspeccion);
    }
}