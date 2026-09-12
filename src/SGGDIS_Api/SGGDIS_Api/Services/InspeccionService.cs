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

    // Se lanza si aún hay ítems obligatorios sin responder al intentar cerrar.
    public class SeccionesIncompletasException : Exception
    {
        public SeccionesIncompletasException()
            : base("No se puede cerrar la inspección: hay secciones obligatorias sin completar.") { }
    }

    public class InspeccionService : IInspeccionService
    {
        private readonly SggdisDbContext _context;
        private readonly ILogger<InspeccionService> _logger;

        public InspeccionService(SggdisDbContext context, ILogger<InspeccionService> logger)
        {
            _context = context;
            _logger = logger;
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

        public async Task GuardarRespuestasAsync(int idInspeccion, List<RespuestaDto> respuestas)
        {
            if (respuestas == null || respuestas.Count == 0) return;

            var idsItems = respuestas.Select(r => r.IdItem).ToList();

            var existentes = await _context.Respuestas
                .Where(x => x.IdInspeccion == idInspeccion && idsItems.Contains(x.IdItem))
                .ToDictionaryAsync(x => x.IdItem);

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

            await _context.SaveChangesAsync();
        }

        public async Task<List<InsRespuesta>> ObtenerRespuestasAsync(int idInspeccion)
        {
            return await _context.Respuestas
                .Where(r => r.IdInspeccion == idInspeccion)
                .ToListAsync();
        }


        public async Task<ResumenCierreDto> CerrarInspeccionAsync(int idInspeccion)
        {
            var inspeccion = await _context.Inspecciones
                .Include(i => i.TipoEstablecimiento)
                .FirstOrDefaultAsync(i => i.IdInspeccion == idInspeccion);

            if (inspeccion is null)
            {
                throw new KeyNotFoundException("La inspección no existe.");
            }


            var idsItemsObligatorios = await _context.Items
                .Where(item => item.Seccion!.TiposEstablecimiento
                    .Any(tipo => tipo.IdTipoEstablecimiento == inspeccion.IdTipoEstablecimiento))
                .Select(item => item.IdItem)
                .ToListAsync();

            var respuestas = await _context.Respuestas
                .Where(r => r.IdInspeccion == idInspeccion)
                .ToListAsync();

            var idsRespondidos = respuestas.Select(r => r.IdItem).ToHashSet();
            var haySeccionesIncompletas = idsItemsObligatorios.Except(idsRespondidos).Any();
            if (haySeccionesIncompletas)
            {
                throw new SeccionesIncompletasException();
            }

            var puntajeObtenido = respuestas
                .Where(r => r.Estado == "Cumple")
                .Sum(r => r.PuntosOtorgados ?? 0);

            var puntajeMaximo = inspeccion.TipoEstablecimiento?.PuntajeMaximo ?? 0;
            var porcentaje = puntajeMaximo > 0
                ? Math.Round((decimal)puntajeObtenido / puntajeMaximo * 100, 2)
                : 0;
            var clasificacion = ClasificarPorcentaje(porcentaje);

            inspeccion.Estado = "FINALIZADA";
            await _context.SaveChangesAsync();

            _logger.LogInformation(
                "Cierre de inspección {IdInspeccion}: puntaje={Puntaje}/{Maximo} ({Porcentaje}%), clasificación={Clasificacion}.",
                idInspeccion, puntajeObtenido, puntajeMaximo, porcentaje, clasificacion);

            return new ResumenCierreDto
            {
                PuntajeObtenido = puntajeObtenido,
                PuntajeMaximo = puntajeMaximo,
                Porcentaje = porcentaje,
                Clasificacion = clasificacion,
            };
        }

        private static string ClasificarPorcentaje(decimal porcentaje)
        {
            if (porcentaje <= 69) return "Condiciones inaceptables";
            if (porcentaje <= 80) return "Condiciones deficientes";
            return "Buenas condiciones";
        }
    }
}