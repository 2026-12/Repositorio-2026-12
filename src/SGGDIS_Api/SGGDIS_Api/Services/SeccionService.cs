using Microsoft.EntityFrameworkCore;
using SGGDIS_Api.Data;
using SGGDIS_Api.Models;

namespace SGGDIS_Api.Services
{
    /// <summary>
    /// Implementación de ISeccionService. Consulta la base de datos directamente
    /// a través del DbContext para armar el catálogo.
    /// </summary>
    public class SeccionService : ISeccionService
    {
        private readonly SggdisDbContext _context;

        public SeccionService(SggdisDbContext context)
        {
            _context = context;
        }

        // Trae los tipos de establecimiento de una guía con sus secciones, ordenados por "Orden".
        public async Task<List<InsTipoEstablecimiento>> ObtenerTiposPorGuiaAsync(int idGuia)
        {
            return await _context.TiposEstablecimiento
                .Where(tipo => tipo.IdGuia == idGuia)
                .Include(tipo => tipo.Secciones)
                .OrderBy(tipo => tipo.Orden)
                .ToListAsync();
        }

        // Busca una sección por guía y código, con sus ítems ordenados. Si se pasa
        // un tipo de establecimiento, solo devuelve la sección si en verdad le aplica.
        public async Task<InsSeccion?> ObtenerSeccionConItemsAsync(
            int idGuia,
            string codigo,
            int? idTipoEstablecimiento = null)
        {
            var consulta = _context.Secciones
                .Include(s => s.Items.OrderBy(i => i.Orden))
                .Where(s => s.IdGuia == idGuia && s.Codigo == codigo);

            if (idTipoEstablecimiento.HasValue)
            {
                consulta = consulta.Where(seccion =>
                    seccion.TiposEstablecimiento.Any(tipo =>
                        tipo.IdTipoEstablecimiento == idTipoEstablecimiento.Value &&
                        tipo.IdGuia == idGuia));
            }

            return await consulta.FirstOrDefaultAsync();
        }
    }
}