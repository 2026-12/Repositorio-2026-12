using Microsoft.EntityFrameworkCore;
using SGGDIS_Api.Data;
using SGGDIS_Api.Models.Dtos.OrdenesSanitarias;
using SGGDIS_Api.Models.OrdenesSanitarias;
using SGGDIS_Api.Models.Ubicaciones;

namespace SGGDIS_Api.Services.OrdenesSanitarias
{
    public class OrdenSanitariaService : IOrdenSanitariaService
    {
        private readonly SggdisDbContext _context;

        public OrdenSanitariaService(SggdisDbContext context)
        {
            _context = context;
        }

        public async Task<OrdenSanitaria> CrearOrdenSanitariaAsync(CrearOrdenSanitariaDto dto)
        {
            ValidarFechas(dto);

            await using var transaction = await _context.Database.BeginTransactionAsync();

            try
            {
                var distritoExiste = await _context.Distritos.AnyAsync(d => d.IdDistrito == dto.IdDistrito);

                if (!distritoExiste) throw new KeyNotFoundException("El distrito seleccionado no existe.");

                var consecutivoExiste = await _context.OrdenesSanitarias.AnyAsync(o => o.NumeroConsecutivo == dto.NumeroConsecutivo);

                if (consecutivoExiste) throw new InvalidOperationException("Ya existe una Orden Sanitaria con ese consecutivo.");

                var ubicacion = new Ubicacion
                {
                    IdDistrito = dto.IdDistrito,
                    DireccionExacta = dto.DireccionExacta.Trim()
                };

                _context.Ubicaciones.Add(ubicacion);
                await _context.SaveChangesAsync();

                var ordenSanitaria = new OrdenSanitaria
                {
                    IdInspeccion = dto.IdInspeccion,
                    IdUbicacion = ubicacion.IdUbicacion,
                    NumeroConsecutivo = dto.NumeroConsecutivo.Trim(),
                    NumeroExpediente = dto.NumeroExpediente?.Trim(),
                    NombreEstablecimiento = dto.NombreEstablecimiento.Trim(),
                    FechaEmision = dto.FechaEmision,
                    FechaNotificacion = dto.FechaNotificacion
                };

                _context.OrdenesSanitarias.Add(ordenSanitaria);
                await _context.SaveChangesAsync();

                var personaNotificada = new OrdenPersonaNotificada
                {
                    IdOrdenSanitaria = ordenSanitaria.IdOrdenSanitaria,
                    NombreCompleto = dto.PersonaNotificada.NombreCompleto.Trim(),
                    Condicion = dto.PersonaNotificada.Condicion.Trim(),
                    OtraCondicion = dto.PersonaNotificada.OtraCondicion?.Trim(),
                    Identificacion = dto.PersonaNotificada.Identificacion.Trim()
                };

                _context.PersonasNotificadas.Add(personaNotificada);

                foreach (var dtoOrdenanza in dto.Ordenanzas)
                {
                    var ordenanza = new Ordenanza
                    {
                        IdOrdenSanitaria = ordenSanitaria.IdOrdenSanitaria,
                        NumeroOrden = dtoOrdenanza.NumeroOrden,
                        DescripcionOrdenanza = dtoOrdenanza.Ordenanza.Trim(),
                        FundamentoLegal = dtoOrdenanza.FundamentoLegal.Trim()
                    };

                    _context.Ordenanzas.Add(ordenanza);
                    await _context.SaveChangesAsync();

                    var dtoPlazo = dtoOrdenanza.Plazo;

                    var plazo = new OrdenanzaPlazo
                    {
                        IdOrdenanza = ordenanza.IdOrdenanza,
                        TipoPlazo = dtoPlazo.TipoPlazo.Trim().ToUpperInvariant(),
                        Cantidad = dtoPlazo.Cantidad,
                        DiaCumplimiento = dtoPlazo.DiaCumplimiento,
                        MesCumplimiento = dtoPlazo.MesCumplimiento,
                        AnioCumplimiento = dtoPlazo.AnioCumplimiento,
                        HoraCumplimiento = dtoPlazo.HoraCumplimiento?.Trim()
                    };

                    _context.PlazosOrdenanza.Add(plazo);
                }

                var responsable = new OrdenResponsable
                {
                    IdOrdenSanitaria = ordenSanitaria.IdOrdenSanitaria,
                    NombreCompleto = dto.Responsable.NombreCompleto.Trim(),
                    Cargo = dto.Responsable.Cargo.Trim(),
                    UnidadOrganizativaArs = dto.Responsable.UnidadOrganizativaArs.Trim(),
                    Firma = dto.Responsable.Firma?.Trim()
                };

                _context.ResponsablesOrden.Add(responsable);

                await _context.SaveChangesAsync();
                await transaction.CommitAsync();

                return ordenSanitaria;
            }
            catch
            {
                await transaction.RollbackAsync();
                throw;
            }
        }

        private static void ValidarFechas(CrearOrdenSanitariaDto dto)
        {
            var fechaActual = DateTime.Today;

            if (dto.FechaEmision.Date < fechaActual) throw new ArgumentException("La fecha de emisión no puede ser anterior a la fecha actual.");

            if (dto.FechaNotificacion.Date < fechaActual) throw new ArgumentException("La fecha de notificación no puede ser anterior a la fecha actual.");

            foreach (var ordenanza in dto.Ordenanzas)
            {
                if (!string.Equals(ordenanza.Plazo.TipoPlazo, "FECHA", StringComparison.OrdinalIgnoreCase)) continue;

                if (!ordenanza.Plazo.DiaCumplimiento.HasValue || !ordenanza.Plazo.MesCumplimiento.HasValue || !ordenanza.Plazo.AnioCumplimiento.HasValue) throw new ArgumentException($"Debe indicar la fecha de cumplimiento de la ordenanza {ordenanza.NumeroOrden}.");

                DateTime fechaCumplimiento;

                try
                {
                    fechaCumplimiento = new DateTime(
                        ordenanza.Plazo.AnioCumplimiento.Value,
                        ordenanza.Plazo.MesCumplimiento.Value,
                        ordenanza.Plazo.DiaCumplimiento.Value
                    );
                }
                catch (ArgumentOutOfRangeException)
                {
                    throw new ArgumentException($"La fecha de cumplimiento de la ordenanza {ordenanza.NumeroOrden} no es válida.");
                }

                if (fechaCumplimiento.Date < fechaActual) throw new ArgumentException($"La fecha de cumplimiento de la ordenanza {ordenanza.NumeroOrden} no puede ser anterior a la fecha actual.");
            }
        }

        public async Task<OrdenSanitariaRespuestaDto?> ObtenerOrdenSanitariaAsync(int idOrdenSanitaria)
        {
            return await _context.OrdenesSanitarias
                .AsNoTracking()
                .Where(o => o.IdOrdenSanitaria == idOrdenSanitaria)
                .Select(o => new OrdenSanitariaRespuestaDto
                {
                    IdOrdenSanitaria = o.IdOrdenSanitaria,
                    IdInspeccion = o.IdInspeccion,
                    NumeroConsecutivo = o.NumeroConsecutivo,
                    NumeroExpediente = o.NumeroExpediente,
                    NombreEstablecimiento = o.NombreEstablecimiento,
                    FechaEmision = o.FechaEmision,
                    FechaNotificacion = o.FechaNotificacion,

                    Ubicacion = o.Ubicacion == null
                        ? null
                        : new UbicacionOrdenDto
                        {
                            IdProvincia = o.Ubicacion.Distrito!.Canton!.Provincia!.IdProvincia,
                            Provincia = o.Ubicacion.Distrito.Canton.Provincia.Nombre,
                            IdCanton = o.Ubicacion.Distrito.Canton.IdCanton,
                            Canton = o.Ubicacion.Distrito.Canton.Nombre,
                            IdDistrito = o.Ubicacion.Distrito.IdDistrito,
                            Distrito = o.Ubicacion.Distrito.Nombre,
                            DireccionExacta = o.Ubicacion.DireccionExacta
                        },

                    PersonaNotificada = o.PersonaNotificada == null
                        ? null
                        : new PersonaNotificadaDto
                        {
                            NombreCompleto = o.PersonaNotificada.NombreCompleto,
                            Condicion = o.PersonaNotificada.Condicion,
                            OtraCondicion = o.PersonaNotificada.OtraCondicion,
                            Identificacion = o.PersonaNotificada.Identificacion
                        },

                    Ordenanzas = o.Ordenanzas
                        .OrderBy(x => x.NumeroOrden)
                        .Select(x => new OrdenanzaRespuestaDto
                        {
                            IdOrdenanza = x.IdOrdenanza,
                            NumeroOrden = x.NumeroOrden,
                            Ordenanza = x.DescripcionOrdenanza,
                            FundamentoLegal = x.FundamentoLegal,
                            Plazo = x.Plazo == null
                                ? null
                                : new PlazoOrdenanzaDto
                                {
                                    TipoPlazo = x.Plazo.TipoPlazo,
                                    Cantidad = x.Plazo.Cantidad,
                                    DiaCumplimiento = x.Plazo.DiaCumplimiento,
                                    MesCumplimiento = x.Plazo.MesCumplimiento,
                                    AnioCumplimiento = x.Plazo.AnioCumplimiento,
                                    HoraCumplimiento = x.Plazo.HoraCumplimiento
                                }
                        })
                        .ToList(),

                    Responsable = o.Responsable == null
                        ? null
                        : new ResponsableOrdenDto
                        {
                            NombreCompleto = o.Responsable.NombreCompleto,
                            Cargo = o.Responsable.Cargo,
                            UnidadOrganizativaArs = o.Responsable.UnidadOrganizativaArs,
                            Firma = o.Responsable.Firma
                        }
                })
                .FirstOrDefaultAsync();
        }

        public async Task<List<OrdenSanitariaRespuestaDto>> ObtenerPorInspeccionAsync(int idInspeccion)
        {
            return await _context.OrdenesSanitarias
                .AsNoTracking()
                .Where(o => o.IdInspeccion == idInspeccion)
                .OrderBy(o => o.IdOrdenSanitaria)
                .Select(o => new OrdenSanitariaRespuestaDto
                {
                    IdOrdenSanitaria = o.IdOrdenSanitaria,
                    IdInspeccion = o.IdInspeccion,
                    NumeroConsecutivo = o.NumeroConsecutivo,
                    NumeroExpediente = o.NumeroExpediente,
                    NombreEstablecimiento = o.NombreEstablecimiento,
                    FechaEmision = o.FechaEmision,
                    FechaNotificacion = o.FechaNotificacion,

                    Ubicacion = o.Ubicacion == null
                        ? null
                        : new UbicacionOrdenDto
                        {
                            IdProvincia = o.Ubicacion.Distrito!.Canton!.Provincia!.IdProvincia,
                            Provincia = o.Ubicacion.Distrito.Canton.Provincia.Nombre,
                            IdCanton = o.Ubicacion.Distrito.Canton.IdCanton,
                            Canton = o.Ubicacion.Distrito.Canton.Nombre,
                            IdDistrito = o.Ubicacion.Distrito.IdDistrito,
                            Distrito = o.Ubicacion.Distrito.Nombre,
                            DireccionExacta = o.Ubicacion.DireccionExacta
                        },

                    PersonaNotificada = o.PersonaNotificada == null
                        ? null
                        : new PersonaNotificadaDto
                        {
                            NombreCompleto = o.PersonaNotificada.NombreCompleto,
                            Condicion = o.PersonaNotificada.Condicion,
                            OtraCondicion = o.PersonaNotificada.OtraCondicion,
                            Identificacion = o.PersonaNotificada.Identificacion
                        },

                    Ordenanzas = o.Ordenanzas
                        .OrderBy(x => x.NumeroOrden)
                        .Select(x => new OrdenanzaRespuestaDto
                        {
                            IdOrdenanza = x.IdOrdenanza,
                            NumeroOrden = x.NumeroOrden,
                            Ordenanza = x.DescripcionOrdenanza,
                            FundamentoLegal = x.FundamentoLegal,
                            Plazo = x.Plazo == null
                                ? null
                                : new PlazoOrdenanzaDto
                                {
                                    TipoPlazo = x.Plazo.TipoPlazo,
                                    Cantidad = x.Plazo.Cantidad,
                                    DiaCumplimiento = x.Plazo.DiaCumplimiento,
                                    MesCumplimiento = x.Plazo.MesCumplimiento,
                                    AnioCumplimiento = x.Plazo.AnioCumplimiento,
                                    HoraCumplimiento = x.Plazo.HoraCumplimiento
                                }
                        })
                        .ToList(),

                    Responsable = o.Responsable == null
                        ? null
                        : new ResponsableOrdenDto
                        {
                            NombreCompleto = o.Responsable.NombreCompleto,
                            Cargo = o.Responsable.Cargo,
                            UnidadOrganizativaArs = o.Responsable.UnidadOrganizativaArs,
                            Firma = o.Responsable.Firma
                        }
                })
                .ToListAsync();
        }
    }
}