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

        public async Task<InsSeccion?> ObtenerSeccionConItemsAsync(int idGuia, string codigo)
        {
            return await _context.Secciones
                .Include(s => s.Items.OrderBy(i => i.Orden))
                .FirstOrDefaultAsync(s => s.IdGuia == idGuia && s.Codigo == codigo);
        }
    }
}