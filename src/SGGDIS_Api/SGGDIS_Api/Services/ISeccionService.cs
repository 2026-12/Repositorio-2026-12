using SGGDIS_Api.Models;

namespace SGGDIS_Api.Services
{
    public interface ISeccionService
    {
        /// Busca una sección por el id de la guía y su código (ej. "A"), junto con sus ítems.
        /// Devuelve null si no existe.
        Task<InsSeccion?> ObtenerSeccionConItemsAsync(int idGuia, string codigo);
    }
}