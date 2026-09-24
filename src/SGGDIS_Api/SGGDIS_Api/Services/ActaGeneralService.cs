using Microsoft.EntityFrameworkCore;
using SGGDIS_Api.Data;
using SGGDIS_Api.Models;
using SGGDIS_Api.Models.Dtos;

namespace SGGDIS_Api.Services
{
    /// <summary>
    /// Implementación de IActaGeneralService. El folio (NumeroActa) se genera
    /// a partir del año actual y el id autonumérico, por eso el acta se debe
    /// insertar primero (para tener el id) y recién después se le pone el folio.
    /// </summary>
    public class ActaGeneralService : IActaGeneralService
    {
        private readonly SggdisDbContext _context;
        private readonly ILogger<ActaGeneralService> _logger;

        public ActaGeneralService(SggdisDbContext context, ILogger<ActaGeneralService> logger)
        {
            _context = context;
            _logger = logger;
        }

        public async Task<ActaGeneralCreadaDto> CrearActaAsync()
        {
            var acta = new InsActaGeneral
            {
                // Folio temporal único para pasar la restricción NOT NULL/UNIQUE;
                // se reemplaza por el folio real justo abajo, ya con el id asignado.
                NumeroActa = Guid.NewGuid().ToString("N")[..12],
                Estado = "EN_PROCESO",
                FechaCreacion = DateTime.Now,
            };

            _context.ActasGenerales.Add(acta);
            await _context.SaveChangesAsync();

            acta.NumeroActa = $"{DateTime.Now.Year}-{acta.IdActa:D5}";
            await _context.SaveChangesAsync();

            _logger.LogInformation("Acta general {NumeroActa} creada (id={IdActa}).", acta.NumeroActa, acta.IdActa);

            return new ActaGeneralCreadaDto
            {
                IdActa = acta.IdActa,
                NumeroActa = acta.NumeroActa,
            };
        }

        public async Task GuardarInfoGeneralAsync(int idActa, InfoGeneralActaDto dto)
        {
            var acta = await _context.ActasGenerales.FindAsync(idActa)
                ?? throw new KeyNotFoundException("El acta no existe.");

            acta.FechaInspeccion = dto.FechaInspeccion;
            acta.HoraInicio = dto.HoraInicio;
            acta.NumeroExpediente = LimpiarOpcional(dto.NumeroExpediente);
            acta.NumeroDenuncia = LimpiarOpcional(dto.NumeroDenuncia);
            acta.NombreComercial = LimpiarOpcional(dto.NombreComercial);
            acta.Provincia = LimpiarOpcional(dto.Provincia);
            acta.Canton = LimpiarOpcional(dto.Canton);
            acta.Distrito = LimpiarOpcional(dto.Distrito);
            acta.DireccionExacta = LimpiarOpcional(dto.DireccionExacta);
            acta.TelefonoContacto = LimpiarOpcional(dto.TelefonoContacto);
            acta.CorreoNotificaciones = LimpiarOpcional(dto.CorreoNotificaciones);
            acta.AutorizaIngreso = ConvertirBooleanoSN(dto.AutorizaIngreso);
            acta.AutorizaFotos = ConvertirBooleanoSN(dto.AutorizaFotos);

            await _context.SaveChangesAsync();
        }

        public async Task<InsActaGeneral?> ObtenerActaAsync(int idActa)
        {
            return await _context.ActasGenerales
                .FirstOrDefaultAsync(a => a.IdActa == idActa);
        }

        // Convierte "" en null para no guardar cadenas vacías en campos opcionales.
        private static string? LimpiarOpcional(string? valor) =>
            string.IsNullOrWhiteSpace(valor) ? null : valor.Trim();

        private static string? ConvertirBooleanoSN(bool? valor) =>
            valor is null ? null : (valor.Value ? "S" : "N");
    }
}
