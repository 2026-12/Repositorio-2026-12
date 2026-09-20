using SGGDIS_Api.Models;
using SGGDIS_Api.Models.Dtos;

namespace SGGDIS_Api.Services
{
    /// <summary>
    /// Reglas de negocio del ciclo de vida de una inspección: crear, guardar
    /// respuestas mientras se llena, consultarlas y cerrar.
    /// </summary>
    public interface IInspeccionService
    {
        /// Crea una nueva inspección "EN_PROCESO" para un establecimiento.
        Task<InsInspeccion> CrearInspeccionAsync(CrearInspeccionDto dto);

        /// Elimina una inspección (y sus respuestas). Devuelve false si no existía.
        Task<bool> EliminarInspeccionAsync(int idInspeccion);

        /// Guarda (o actualiza) las respuestas de una inspección, funciona como autoguardado.
        Task GuardarRespuestasAsync(int idInspeccion, List<RespuestaDto> respuestas);

        /// Devuelve todas las respuestas ya guardadas de una inspección.
        Task<List<InsRespuesta>> ObtenerRespuestasAsync(int idInspeccion);

        /// Cierra la inspección:
        /// - calcula puntaje final, porcentaje y clasificación
        /// - guarda los datos de cierre (inspector, observaciones, etc.)
        Task<ResumenCierreDto> CerrarInspeccionAsync(int idInspeccion, CerrarInspeccionDto dto);
    }
}