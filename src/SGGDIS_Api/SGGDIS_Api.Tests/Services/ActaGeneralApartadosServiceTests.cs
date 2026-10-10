using System.Text.Json;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging.Abstractions;
using SGGDIS_Api.Data;
using SGGDIS_Api.Models;
using SGGDIS_Api.Models.Dtos;
using SGGDIS_Api.Services;
using Xunit;

namespace SGGDIS_Api.Tests.Services
{
    // Cubre el guardado de los apartados I, II, III, V y VI del Acta General
    // (HU-006, HU-007, HU-008, HU-010 y HU-011), la creación, la consulta y el
    // descarte del acta. El Apartado IV y el envío ya los cubre
    // ActaGeneralServiceTests.
    public class ActaGeneralApartadosServiceTests
    {
        private static ActaGeneralService CrearServicio(SggdisDbContext contexto)
            => new(contexto, NullLogger<ActaGeneralService>.Instance);

        private static void CrearActa(SggdisDbContext contexto)
        {
            contexto.ActasGenerales.Add(new InsActaGeneral { IdActa = 1, NumeroActa = "2026-00001" });
            contexto.SaveChanges();
        }

        // ---------- Creación ----------

        [Fact]
        public async Task CrearActaAsync_CreaElActaEnProcesoConFolioDelAnioYElId()
        {
            using var contexto = TestDbContextFactory.Crear();
            var servicio = CrearServicio(contexto);

            var creada = await servicio.CrearActaAsync();

            Assert.True(creada.IdActa > 0);
            Assert.Equal($"{DateTime.Now.Year}-{creada.IdActa:D5}", creada.NumeroActa);
            var acta = contexto.ActasGenerales.AsNoTracking().Single(a => a.IdActa == creada.IdActa);
            Assert.Equal("EN_PROCESO", acta.Estado);
        }

        // ---------- Apartado I: Información general ----------

        [Fact]
        public async Task GuardarInfoGeneralAsync_LimpiaEspaciosYConvierteLasAutorizacionesASiNo()
        {
            using var contexto = TestDbContextFactory.Crear();
            CrearActa(contexto);
            var servicio = CrearServicio(contexto);

            await servicio.GuardarInfoGeneralAsync(1, new InfoGeneralActaDto
            {
                NombreComercial = "  Soda Cypress Acta  ",
                NumeroExpediente = "   ",
                CorreoNotificaciones = " cypress@correo.com ",
                AutorizaIngreso = true,
                AutorizaFotos = false,
            });

            var info = contexto.ActasInfoGeneral.AsNoTracking().Single();
            Assert.Equal("Soda Cypress Acta", info.NombreComercial);
            Assert.Null(info.NumeroExpediente);
            Assert.Equal("cypress@correo.com", info.CorreoNotificaciones);
            Assert.Equal("S", info.AutorizaIngreso);
            Assert.Equal("N", info.AutorizaFotos);
        }

        [Fact]
        public async Task GuardarInfoGeneralAsync_DejaNullLasAutorizacionesSinResponder()
        {
            using var contexto = TestDbContextFactory.Crear();
            CrearActa(contexto);
            var servicio = CrearServicio(contexto);

            await servicio.GuardarInfoGeneralAsync(1, new InfoGeneralActaDto { NombreComercial = "Soda" });

            var info = contexto.ActasInfoGeneral.AsNoTracking().Single();
            Assert.Null(info.AutorizaIngreso);
            Assert.Null(info.AutorizaFotos);
        }

        [Fact]
        public async Task GuardarInfoGeneralAsync_ActualizaLaFilaExistenteSinDuplicarla()
        {
            using var contexto = TestDbContextFactory.Crear();
            CrearActa(contexto);
            var servicio = CrearServicio(contexto);

            await servicio.GuardarInfoGeneralAsync(1, new InfoGeneralActaDto { NombreComercial = "Primera versión" });
            await servicio.GuardarInfoGeneralAsync(1, new InfoGeneralActaDto { NombreComercial = "Segunda versión" });

            var filas = contexto.ActasInfoGeneral.AsNoTracking().ToList();
            Assert.Single(filas);
            Assert.Equal("Segunda versión", filas[0].NombreComercial);
        }

        // ---------- Apartado II: Responsable ----------

        [Fact]
        public async Task GuardarResponsableAsync_GuardaElCargoEnElOrdenDelCatalogoYDescartaElOtroSiNoEstaMarcado()
        {
            using var contexto = TestDbContextFactory.Crear();
            CrearActa(contexto);
            var servicio = CrearServicio(contexto);

            await servicio.GuardarResponsableAsync(1, new InfoResponsableActaDto
            {
                NombreResponsable = "  María Fernández Solano ",
                CargoResponsable = new List<string> { "ENCARGADO", "REPRESENTANTE_LEGAL" },
                CargoResponsableOtro = "Texto que debe descartarse",
                NumeroIdentificacionResponsable = "1-2345-6789",
            });

            var responsable = contexto.ActasResponsable.AsNoTracking().Single();
            Assert.Equal("María Fernández Solano", responsable.NombreResponsable);
            Assert.Equal("REPRESENTANTE_LEGAL,ENCARGADO", responsable.CargoResponsable);
            Assert.Null(responsable.CargoResponsableOtro);
        }

        [Fact]
        public async Task GuardarResponsableAsync_ConservaElDetalleDeOtroCuandoOtroEstaMarcado()
        {
            using var contexto = TestDbContextFactory.Crear();
            CrearActa(contexto);
            var servicio = CrearServicio(contexto);

            await servicio.GuardarResponsableAsync(1, new InfoResponsableActaDto
            {
                CargoResponsable = new List<string> { "OTRO" },
                CargoResponsableOtro = " Administradora del local ",
            });

            var responsable = contexto.ActasResponsable.AsNoTracking().Single();
            Assert.Equal("OTRO", responsable.CargoResponsable);
            Assert.Equal("Administradora del local", responsable.CargoResponsableOtro);
        }

        [Fact]
        public async Task GuardarResponsableAsync_RechazaUnCargoQueNoEstaEnElCatalogo()
        {
            using var contexto = TestDbContextFactory.Crear();
            CrearActa(contexto);
            var servicio = CrearServicio(contexto);

            await Assert.ThrowsAsync<ResponsableInvalidoException>(() =>
                servicio.GuardarResponsableAsync(1, new InfoResponsableActaDto
                {
                    CargoResponsable = new List<string> { "CARGO_INVENTADO" },
                }));

            Assert.False(contexto.ActasResponsable.AsNoTracking().Any());
        }

        [Fact]
        public async Task GuardarResponsableAsync_RechazaUnaIdentificacionMasLargaQueLaColumna()
        {
            using var contexto = TestDbContextFactory.Crear();
            CrearActa(contexto);
            var servicio = CrearServicio(contexto);

            await Assert.ThrowsAsync<ResponsableInvalidoException>(() =>
                servicio.GuardarResponsableAsync(1, new InfoResponsableActaDto
                {
                    NumeroIdentificacionResponsable = new string('1', 31),
                }));

            Assert.False(contexto.ActasResponsable.AsNoTracking().Any());
        }

        // ---------- Apartado I: límites de longitud ----------

        [Fact]
        public async Task GuardarInfoGeneralAsync_RechazaUnaDireccionMasLargaQueLaColumna()
        {
            using var contexto = TestDbContextFactory.Crear();
            CrearActa(contexto);
            var servicio = CrearServicio(contexto);

            await Assert.ThrowsAsync<InfoGeneralInvalidaException>(() =>
                servicio.GuardarInfoGeneralAsync(1, new InfoGeneralActaDto
                {
                    DireccionExacta = new string('a', 401),
                }));

            Assert.False(contexto.ActasInfoGeneral.AsNoTracking().Any());
        }

        // ---------- Apartado III: Motivo ----------

        [Fact]
        public async Task GuardarMotivoAsync_GuardaElMotivoYDescartaElOtroSiNoEstaMarcado()
        {
            using var contexto = TestDbContextFactory.Crear();
            CrearActa(contexto);
            var servicio = CrearServicio(contexto);

            await servicio.GuardarMotivoAsync(1, new InfoMotivoActaDto
            {
                MotivoInspeccion = new List<string> { "SEGUIMIENTO" },
                MotivoInspeccionOtro = "Texto que debe descartarse",
            });

            var motivo = contexto.ActasMotivo.AsNoTracking().Single();
            Assert.Equal("SEGUIMIENTO", motivo.MotivoInspeccion);
            Assert.Null(motivo.MotivoInspeccionOtro);
        }

        [Fact]
        public async Task GuardarMotivoAsync_ConservaElDetalleDeOtro()
        {
            using var contexto = TestDbContextFactory.Crear();
            CrearActa(contexto);
            var servicio = CrearServicio(contexto);

            await servicio.GuardarMotivoAsync(1, new InfoMotivoActaDto
            {
                MotivoInspeccion = new List<string> { "OTRO" },
                MotivoInspeccionOtro = "Verificación de condiciones sanitarias",
            });

            var motivo = contexto.ActasMotivo.AsNoTracking().Single();
            Assert.Equal("OTRO", motivo.MotivoInspeccion);
            Assert.Equal("Verificación de condiciones sanitarias", motivo.MotivoInspeccionOtro);
        }

        [Fact]
        public async Task GuardarMotivoAsync_RechazaUnMotivoQueNoEstaEnElCatalogo()
        {
            using var contexto = TestDbContextFactory.Crear();
            CrearActa(contexto);
            var servicio = CrearServicio(contexto);

            await Assert.ThrowsAsync<MotivoInvalidoException>(() =>
                servicio.GuardarMotivoAsync(1, new InfoMotivoActaDto
                {
                    MotivoInspeccion = new List<string> { "MOTIVO_INVENTADO" },
                }));
        }

        [Fact]
        public async Task GuardarMotivoAsync_RechazaUnDetalleDeOtroMasLargoQueLaColumna()
        {
            using var contexto = TestDbContextFactory.Crear();
            CrearActa(contexto);
            var servicio = CrearServicio(contexto);

            await Assert.ThrowsAsync<MotivoInvalidoException>(() =>
                servicio.GuardarMotivoAsync(1, new InfoMotivoActaDto
                {
                    MotivoInspeccion = new List<string> { "OTRO" },
                    MotivoInspeccionOtro = new string('a', 201),
                }));
        }

        [Fact]
        public async Task GuardarMotivoAsync_GuardaNullSiNoSeSeleccionaNingunMotivo()
        {
            using var contexto = TestDbContextFactory.Crear();
            CrearActa(contexto);
            var servicio = CrearServicio(contexto);

            await servicio.GuardarMotivoAsync(1, new InfoMotivoActaDto { MotivoInspeccion = new List<string>() });

            Assert.Null(contexto.ActasMotivo.AsNoTracking().Single().MotivoInspeccion);
        }

        // ---------- Apartado V: Acciones a seguir ----------

        [Fact]
        public async Task GuardarAccionesAsync_GuardaVariasAccionesEnElOrdenDelCatalogoSinRepetidos()
        {
            using var contexto = TestDbContextFactory.Crear();
            CrearActa(contexto);
            var servicio = CrearServicio(contexto);

            await servicio.GuardarAccionesAsync(1, new InfoAccionesActaDto
            {
                Acciones = new List<string> { "OTRO", "CIERRE_CASO", "REPROGRAMACION", "CIERRE_CASO" },
                MotivoReprogramacion = " Falta documentación pendiente ",
                AccionOtro = " Seguimiento en 15 días ",
            });

            var acciones = contexto.ActasAcciones.AsNoTracking().Single();
            Assert.Equal("CIERRE_CASO,REPROGRAMACION,OTRO", acciones.AccionesSeguir);
            Assert.Equal("Falta documentación pendiente", acciones.MotivoReprogramacion);
            Assert.Equal("Seguimiento en 15 días", acciones.AccionOtro);
        }

        [Fact]
        public async Task GuardarAccionesAsync_DescartaLosTextosDeLasAccionesNoSeleccionadas()
        {
            using var contexto = TestDbContextFactory.Crear();
            CrearActa(contexto);
            var servicio = CrearServicio(contexto);

            await servicio.GuardarAccionesAsync(1, new InfoAccionesActaDto
            {
                Acciones = new List<string> { "CIERRE_CASO" },
                MotivoReprogramacion = "No aplica",
                AccionOtro = "No aplica",
            });

            var acciones = contexto.ActasAcciones.AsNoTracking().Single();
            Assert.Equal("CIERRE_CASO", acciones.AccionesSeguir);
            Assert.Null(acciones.MotivoReprogramacion);
            Assert.Null(acciones.AccionOtro);
        }

        [Fact]
        public async Task GuardarAccionesAsync_RechazaUnaAccionQueNoEstaEnElCatalogo()
        {
            using var contexto = TestDbContextFactory.Crear();
            CrearActa(contexto);
            var servicio = CrearServicio(contexto);

            await Assert.ThrowsAsync<AccionesInvalidasException>(() =>
                servicio.GuardarAccionesAsync(1, new InfoAccionesActaDto
                {
                    Acciones = new List<string> { "ACCION_INVENTADA" },
                }));
        }

        [Fact]
        public async Task GuardarAccionesAsync_RechazaTextosMasLargosQueLasColumnas()
        {
            using var contexto = TestDbContextFactory.Crear();
            CrearActa(contexto);
            var servicio = CrearServicio(contexto);

            await Assert.ThrowsAsync<AccionesInvalidasException>(() =>
                servicio.GuardarAccionesAsync(1, new InfoAccionesActaDto
                {
                    Acciones = new List<string> { "REPROGRAMACION" },
                    MotivoReprogramacion = new string('a', 401),
                }));

            await Assert.ThrowsAsync<AccionesInvalidasException>(() =>
                servicio.GuardarAccionesAsync(1, new InfoAccionesActaDto
                {
                    Acciones = new List<string> { "OTRO" },
                    AccionOtro = new string('a', 201),
                }));
        }

        // ---------- Apartado VI: Cierre y firmas ----------

        [Fact]
        public async Task GuardarCierreAsync_GuardaLasPersonasComoJsonEnCamelCaseYLimpiaEspacios()
        {
            using var contexto = TestDbContextFactory.Crear();
            CrearActa(contexto);
            var servicio = CrearServicio(contexto);

            await servicio.GuardarCierreAsync(1, new InfoCierreActaDto
            {
                PersonasPresentes = new List<PersonaPresenteDto>
                {
                    new() { NombreCompleto = " Juan Pérez Mora ", CargoInstitucion = "Inspector", NumeroIdentificacion = "1-1111-1111", Firma = "J. Pérez" },
                    new() { NombreCompleto = "Ana Rojas Vargas", CargoInstitucion = "Propietaria", NumeroIdentificacion = "2-2222-2222", Firma = "A. Rojas" },
                },
            });

            var json = contexto.ActasCierre.AsNoTracking().Single().PersonasPresentes;
            Assert.NotNull(json);
            var personas = JsonSerializer.Deserialize<List<Dictionary<string, string>>>(json!)!;
            Assert.Equal(2, personas.Count);
            Assert.Equal("Juan Pérez Mora", personas[0]["nombreCompleto"]);
            Assert.Equal("Propietaria", personas[1]["cargoInstitucion"]);
        }

        [Fact]
        public async Task GuardarCierreAsync_GuardaNullSiNoHayPersonas()
        {
            using var contexto = TestDbContextFactory.Crear();
            CrearActa(contexto);
            var servicio = CrearServicio(contexto);

            await servicio.GuardarCierreAsync(1, new InfoCierreActaDto { PersonasPresentes = new List<PersonaPresenteDto>() });

            Assert.Null(contexto.ActasCierre.AsNoTracking().Single().PersonasPresentes);
        }

        [Fact]
        public async Task GuardarCierreAsync_RechazaDatosDeUnaPersonaMasLargosQueLaColumna()
        {
            using var contexto = TestDbContextFactory.Crear();
            CrearActa(contexto);
            var servicio = CrearServicio(contexto);

            await Assert.ThrowsAsync<CierreInvalidoException>(() =>
                servicio.GuardarCierreAsync(1, new InfoCierreActaDto
                {
                    PersonasPresentes = new List<PersonaPresenteDto>
                    {
                        new() { NombreCompleto = "Juan", NumeroIdentificacion = new string('1', 31) },
                    },
                }));

            Assert.False(contexto.ActasCierre.AsNoTracking().Any());
        }

        // ---------- Acta inexistente ----------

        [Fact]
        public async Task LosGuardadosPorApartadoLanzanKeyNotFoundSiElActaNoExiste()
        {
            using var contexto = TestDbContextFactory.Crear();
            var servicio = CrearServicio(contexto);

            await Assert.ThrowsAsync<KeyNotFoundException>(() => servicio.GuardarInfoGeneralAsync(99, new InfoGeneralActaDto()));
            await Assert.ThrowsAsync<KeyNotFoundException>(() => servicio.GuardarResponsableAsync(99, new InfoResponsableActaDto()));
            await Assert.ThrowsAsync<KeyNotFoundException>(() => servicio.GuardarMotivoAsync(99, new InfoMotivoActaDto()));
            await Assert.ThrowsAsync<KeyNotFoundException>(() => servicio.GuardarAccionesAsync(99, new InfoAccionesActaDto()));
            await Assert.ThrowsAsync<KeyNotFoundException>(() => servicio.GuardarCierreAsync(99, new InfoCierreActaDto()));
        }

        // ---------- Consulta y descarte ----------

        [Fact]
        public async Task ObtenerActaAsync_DevuelveNullSiElActaNoExiste()
        {
            using var contexto = TestDbContextFactory.Crear();
            var servicio = CrearServicio(contexto);

            Assert.Null(await servicio.ObtenerActaAsync(99));
        }

        [Fact]
        public async Task ObtenerActaAsync_ReunePorApartadoYDejaEnNullLosQueNuncaSeGuardaron()
        {
            using var contexto = TestDbContextFactory.Crear();
            CrearActa(contexto);
            var servicio = CrearServicio(contexto);
            await servicio.GuardarInfoGeneralAsync(1, new InfoGeneralActaDto { NombreComercial = "Soda Cypress Acta", AutorizaIngreso = true });
            await servicio.GuardarMotivoAsync(1, new InfoMotivoActaDto { MotivoInspeccion = new List<string> { "DENUNCIA" } });

            var acta = await servicio.ObtenerActaAsync(1);

            Assert.NotNull(acta);
            Assert.Equal("2026-00001", acta!.NumeroActa);
            Assert.Equal("EN_PROCESO", acta.Estado);
            Assert.Equal("Soda Cypress Acta", acta.NombreComercial);
            Assert.Equal("S", acta.AutorizaIngreso);
            Assert.Equal("DENUNCIA", acta.MotivoInspeccion);
            Assert.Null(acta.NombreResponsable);
            Assert.Null(acta.PersonasPresentes);
        }

        [Fact]
        public async Task EliminarActaAsync_BorraElActaYTodasLasFilasDeSusApartados()
        {
            using var contexto = TestDbContextFactory.Crear();
            CrearActa(contexto);
            var servicio = CrearServicio(contexto);
            await servicio.GuardarInfoGeneralAsync(1, new InfoGeneralActaDto { NombreComercial = "Soda" });
            await servicio.GuardarMotivoAsync(1, new InfoMotivoActaDto { MotivoInspeccion = new List<string> { "SEGUIMIENTO" } });
            await servicio.GuardarCierreAsync(1, new InfoCierreActaDto
            {
                PersonasPresentes = new List<PersonaPresenteDto> { new() { NombreCompleto = "Juan" } },
            });

            var eliminada = await servicio.EliminarActaAsync(1);

            Assert.True(eliminada);
            Assert.False(contexto.ActasGenerales.AsNoTracking().Any());
            Assert.False(contexto.ActasInfoGeneral.AsNoTracking().Any());
            Assert.False(contexto.ActasMotivo.AsNoTracking().Any());
            Assert.False(contexto.ActasCierre.AsNoTracking().Any());
        }

        [Fact]
        public async Task EliminarActaAsync_DevuelveFalseSiElActaNoExiste()
        {
            using var contexto = TestDbContextFactory.Crear();
            var servicio = CrearServicio(contexto);

            Assert.False(await servicio.EliminarActaAsync(99));
        }
    }
}
