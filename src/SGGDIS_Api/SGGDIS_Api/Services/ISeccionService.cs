using SGGDIS_Api.Models;

namespace SGGDIS_Api.Services
{
    public interface ISeccionService
    {
        Task<List<InsTipoEstablecimiento>> ObtenerTiposPorGuiaAsync(int idGuia);

        /// Busca una sección por el id de la guía y su código (ej. "A"), junto con sus ítems.
        /// Devuelve null si no existe.
        Task<InsSeccion?> ObtenerSeccionConItemsAsync(int idGuia, string codigo, int? idTipoEstablecimiento = null);
    }
}