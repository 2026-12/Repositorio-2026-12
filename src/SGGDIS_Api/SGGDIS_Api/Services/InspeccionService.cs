using Microsoft.EntityFrameworkCore;
using SGGDIS_Api.Data;
using SGGDIS_Api.Models;
using SGGDIS_Api.Models.Dtos;

namespace SGGDIS_Api.Services
{
    public class InspeccionService : IInspeccionService
    {
        private readonly SggdisDbContext _context;

        public InspeccionService(SggdisDbContext context)
        {
            _context = context;
        }

        public async Task<InsInspeccion> CrearInspeccionAsync(CrearInspeccionDto dto)
        {
            var inspeccion = new InsInspeccion
            {
                IdGuia = dto.IdGuia,
                IdTipoEstablecimiento = dto.IdTipoEstablecimiento,
                NombreEstablecimiento = dto.NombreEstablecimiento,
                Consecutivo = dto.Consecutivo,
                Fecha = DateTime.Now,
                Estado = "EN_PROCESO"
            };
            _context.Inspecciones.Add(inspeccion);
            await _context.SaveChangesAsync();
            return inspeccion;
        }

        public async Task GuardarRespuestasAsync(int idInspeccion, List<RespuestaDto> respuestas)
        {
            foreach (var r in respuestas)
            {
                var existente = await _context.Respuestas
                    .FirstOrDefaultAsync(x => x.IdInspeccion == idInspeccion && x.IdItem == r.IdItem);

                if (existente != null)
                {
                    existente.Estado = r.Estado;
                    existente.PuntosOtorgados = r.PuntosOtorgados;
                }
                else
                {
                    _context.Respuestas.Add(new InsRespuesta
                    {
                        IdInspeccion = idInspeccion,
                        IdItem = r.IdItem,
                        Estado = r.Estado,
                        PuntosOtorgados = r.PuntosOtorgados
                    });
                }
            }
            await _context.SaveChangesAsync();
        }

        public async Task<List<InsRespuesta>> ObtenerRespuestasAsync(int idInspeccion)
        {
            return await _context.Respuestas
                .Where(r => r.IdInspeccion == idInspeccion)
                .ToListAsync();
        }
    }
}