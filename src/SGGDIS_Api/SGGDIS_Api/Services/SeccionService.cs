using Microsoft.EntityFrameworkCore;
using SGGDIS_Api.Data;
using SGGDIS_Api.Models;

namespace SGGDIS_Api.Services
{
    public class SeccionService : ISeccionService
    {
        private readonly SggdisDbContext _context;

        public SeccionService(SggdisDbContext context)
        {
            _context = context;
        }

        public async Task<List<InsTipoEstablecimiento>> ObtenerTiposPorGuiaAsync(int idGuia)
        {
            return await _context.TiposEstablecimiento
                .Where(tipo => tipo.IdGuia == idGuia)
                .Include(tipo => tipo.Secciones)
                .OrderBy(tipo => tipo.Orden)
                .ToListAsync();
        }

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