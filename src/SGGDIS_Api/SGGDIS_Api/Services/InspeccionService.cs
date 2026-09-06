using Microsoft.EntityFrameworkCore;
using SGGDIS_Api.Data;
using SGGDIS_Api.Models;
using SGGDIS_Api.Models.Dtos;

namespace SGGDIS_Api.Services
{
    public class ConsecutivoDuplicadoException : Exception
    {
        public ConsecutivoDuplicadoException() : base("El número consecutivo ya está registrado.") { }
    }

    public class InspeccionService : IInspeccionService
    {
        private readonly SggdisDbContext _context;

        public InspeccionService(SggdisDbContext context)
        {
            _context = context;
        }

        public async Task<InsInspeccion> CrearInspeccionAsync(CrearInspeccionDto dto)
        {
            var consecutivoExiste = await _context.Inspecciones
                .AnyAsync(inspeccion => inspeccion.Consecutivo == dto.Consecutivo);
            if (consecutivoExiste)
            {
                throw new ConsecutivoDuplicadoException();
            }

            var inspeccion = new InsInspeccion
            {
                IdGuia = dto.IdGuia,
                IdTipoEstablecimiento = dto.IdTipoEstablecimiento,
                NombreEstablecimiento = dto.NombreEstablecimiento,
                Consecutivo = dto.Consecutivo,
                Fecha = dto.Fecha,
                Estado = "EN_PROCESO"
            };
            _context.Inspecciones.Add(inspeccion);
            await _context.SaveChangesAsync();
            return inspeccion;
        }

        public async Task<bool> EliminarInspeccionAsync(int idInspeccion)
        {
            var inspeccion = await _context.Inspecciones.FindAsync(idInspeccion);
            if (inspeccion is null)
            {
                return false;
            }

            var respuestas = await _context.Respuestas
                .Where(respuesta => respuesta.IdInspeccion == idInspeccion)
                .ToListAsync();
            _context.Respuestas.RemoveRange(respuestas);
            _context.Inspecciones.Remove(inspeccion);
            await _context.SaveChangesAsync();
            return true;
        }

        // MERGE (upsert) en vez de "buscar y luego insertar/actualizar": evita filas
        // duplicadas en INS_RESPUESTA cuando llegan guardados concurrentes para el
        // mismo item, aprovechando el indice unico (ID_INSPECCION, ID_ITEM).
        public async Task GuardarRespuestasAsync(int idInspeccion, List<RespuestaDto> respuestas)
        {
            if (respuestas == null || respuestas.Count == 0) return;

            var idsItems = respuestas.Select(r => r.IdItem).ToList();

            // 1. Carga en memoria solo las respuestas modificadas que ya existen
            var existentes = await _context.Respuestas
                .Where(x => x.IdInspeccion == idInspeccion && idsItems.Contains(x.IdItem))
                .ToDictionaryAsync(x => x.IdItem);

            // 2. Modifica o crea nuevas entidades
            foreach (var r in respuestas)
            {
                if (existentes.TryGetValue(r.IdItem, out var entidad))
                {
                    entidad.Estado = r.Estado;
                    entidad.PuntosOtorgados = r.PuntosOtorgados;
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

            // 3. EF Core persiste todo en una sola transacción
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