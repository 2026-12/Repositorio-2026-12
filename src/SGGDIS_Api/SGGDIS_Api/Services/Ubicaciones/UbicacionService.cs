using Microsoft.EntityFrameworkCore;
using SGGDIS_Api.Data;
using SGGDIS_Api.Models.Dtos.Ubicaciones;

namespace SGGDIS_Api.Services.Ubicaciones
{
    public class UbicacionService
        : IUbicacionService
    {
        private readonly SggdisDbContext _context;

        public UbicacionService(
            SggdisDbContext context)
        {
            _context = context;
        }

        public async Task<List<ProvinciaDto>>
            ObtenerProvinciasAsync()
        {
            return await _context.Provincias
                .AsNoTracking()
                .OrderBy(p => p.Nombre)
                .Select(p => new ProvinciaDto
                {
                    IdProvincia =
                        p.IdProvincia,

                    Nombre =
                        p.Nombre
                })
                .ToListAsync();
        }

        public async Task<List<CantonDto>>
            ObtenerCantonesAsync(
                int idProvincia)
        {
            return await _context.Cantones
                .AsNoTracking()
                .Where(c =>
                    c.IdProvincia ==
                    idProvincia)
                .OrderBy(c => c.Nombre)
                .Select(c => new CantonDto
                {
                    IdCanton =
                        c.IdCanton,

                    Nombre =
                        c.Nombre
                })
                .ToListAsync();
        }

        public async Task<List<DistritoDto>>
            ObtenerDistritosAsync(
                int idCanton)
        {
            return await _context.Distritos
                .AsNoTracking()
                .Where(d =>
                    d.IdCanton ==
                    idCanton)
                .OrderBy(d => d.Nombre)
                .Select(d => new DistritoDto
                {
                    IdDistrito =
                        d.IdDistrito,

                    Nombre =
                        d.Nombre
                })
                .ToListAsync();
        }
    }
}