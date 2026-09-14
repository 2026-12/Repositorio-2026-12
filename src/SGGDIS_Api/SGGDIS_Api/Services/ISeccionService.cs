using SGGDIS_Api.Models;

namespace SGGDIS_Api.Services
{
    /// <summary>
    /// Reglas de negocio para consultar el catálogo de secciones e ítems de una guía
    /// (lo que se usa para pintar el formulario del checklist).
    /// </summary>
    public interface ISeccionService
    {
        /// Devuelve todos los tipos de establecimiento que existen para una guía dada.
        Task<List<InsTipoEstablecimiento>> ObtenerTiposPorGuiaAsync(int idGuia);

        /// Busca una sección por el id de la guía y su código (ej. "A"), junto con sus ítems.
        /// Devuelve null si no existe.
        Task<InsSeccion?> ObtenerSeccionConItemsAsync(int idGuia, string codigo, int? idTipoEstablecimiento = null);
    }
}