using Microsoft.EntityFrameworkCore;
using SGGDIS_Api.Data;
using SGGDIS_Api.Models;

namespace SGGDIS_Api.Services
{
    /// <summary>
    /// Implementación de ISeccionService: aquí se consulta directamente la base de
    /// datos (a través del DbContext) para armar la información del catálogo.
    /// </summary>
    public class SeccionService : ISeccionService
    {
        private readonly SggdisDbContext _context;

        // Recibe el DbContext ya configurado (inyección de dependencias).
        public SeccionService(SggdisDbContext context)
        {
            _context = context;
        }

        // Trae todos los tipos de establecimiento de una guía, con sus secciones incluidas,
        // ordenados según el campo "Orden".
        public async Task<List<InsTipoEstablecimiento>> ObtenerTiposPorGuiaAsync(int idGuia)
        {
            return await _context.TiposEstablecimiento
                .Where(tipo => tipo.IdGuia == idGuia)
                .Include(tipo => tipo.Secciones)
                .OrderBy(tipo => tipo.Orden)
                .ToListAsync();
        }

        // Busca una sección (por guía y código) junto con todos sus ítems ya ordenados.
        // Si se indica un tipo de establecimiento, solo devuelve la sección si en verdad
        // le aplica a ese tipo (evita mostrar secciones que no correspondan).
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