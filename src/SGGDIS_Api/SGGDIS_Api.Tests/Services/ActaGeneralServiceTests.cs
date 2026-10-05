using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging.Abstractions;
using SGGDIS_Api.Data;
using SGGDIS_Api.Models;
using SGGDIS_Api.Models.Dtos;
using SGGDIS_Api.Services;
using Xunit;

namespace SGGDIS_Api.Tests.Services
{
    // Cubre el guardado del Apartado IV del Acta General (HU-009): guías
    // aplicables guardadas como ids separados por coma en GUIAS_APLICABLES
    // (tabla INS_ACTA_HALLAZGOS), validación contra el catálogo INS_GUIA y
    // descripción de hallazgos.
    public class ActaGeneralServiceTests
    {
        private static ActaGeneralService CrearServicio(SggdisDbContext contexto)
            => new(contexto, NullLogger<ActaGeneralService>.Instance);

        // Acta con los apartados I-III ya guardados en sus tablas (para
        // verificar que el Apartado IV no los toca) y un catálogo con tres guías.
        private static void CrearActaConCatalogo(SggdisDbContext contexto)
        {
            contexto.Guias.AddRange(
                new InsGuia { IdGuia = 1, Nombre = "Guia de Alimentacion", Categoria = "Alimentos" },
                new InsGuia { IdGuia = 2, Nombre = "Guia de Salud Ocupacional", Categoria = "Salud" },
                new InsGuia { IdGuia = 3, Nombre = "Guia de Centros Educativos", Categoria = "Educacion" });

            contexto.ActasGenerales.Add(new InsActaGeneral { IdActa = 1, NumeroActa = "2026-00001" });
            contexto.ActasInfoGeneral.Add(new InsActaInfoGeneral { IdActa = 1, NombreComercial = "Soda Doña Ana" });
            contexto.ActasResponsable.Add(new InsActaResponsable { IdActa = 1, NombreResponsable = "Ana Pérez" });
            contexto.ActasMotivo.Add(new InsActaMotivo { IdActa = 1, MotivoInspeccion = "DENUNCIA" });
            contexto.SaveChanges();
        }

        [Fact]
        public async Task GuardarHallazgosAsync_GuardaIdsOrdenadosSinRepetidosYHallazgosLimpios()
        {
            using var contexto = TestDbContextFactory.Crear();
            CrearActaConCatalogo(contexto);
            var servicio = CrearServicio(contexto);

            await servicio.GuardarHallazgosAsync(1, new InfoHallazgosActaDto
            {
                IdsGuias = new List<int> { 3, 1, 3 },
                Hallazgos = "  Se observó acumulación de grasa en la campana.  ",
            });

            // La primera vez que se guarda el apartado se crea su fila.
            var hallazgos = contexto.ActasHallazgos.Find(1);
            Assert.NotNull(hallazgos);
            Assert.Equal("1,3", hallazgos!.GuiasAplicables);
            Assert.Equal("Se observó acumulación de grasa en la campana.", hallazgos.Hallazgos);
        }

        [Fact]
        public async Task GuardarHallazgosAsync_GuardaNullSiNoHayGuiasNiHallazgos()
        {
            // El autoguardado puede llamarse con el apartado vacío: no se deben
            // guardar cadenas vacías (y se actualiza la fila ya existente).
            using var contexto = TestDbContextFactory.Crear();
            CrearActaConCatalogo(contexto);
            var hallazgos = new InsActaHallazgos { IdActa = 1, GuiasAplicables = "1", Hallazgos = "Texto anterior" };
            contexto.ActasHallazgos.Add(hallazgos);
            contexto.SaveChanges();
            var servicio = CrearServicio(contexto);

            await servicio.GuardarHallazgosAsync(1, new InfoHallazgosActaDto { IdsGuias = new List<int>(), Hallazgos = "   " });

            Assert.Null(hallazgos.GuiasAplicables);
            Assert.Null(hallazgos.Hallazgos);
            Assert.Single(contexto.ActasHallazgos);
        }

        [Fact]
        public async Task GuardarHallazgosAsync_RechazaGuiaQueNoExisteEnElCatalogo()
        {
            using var contexto = TestDbContextFactory.Crear();
            CrearActaConCatalogo(contexto);
            var servicio = CrearServicio(contexto);

            await Assert.ThrowsAsync<HallazgosInvalidosException>(() =>
                servicio.GuardarHallazgosAsync(1, new InfoHallazgosActaDto { IdsGuias = new List<int> { 1, 99 }, Hallazgos = "Hallazgo" }));

            // Si los datos no son válidos, no se crea la fila del apartado.
            Assert.Null(contexto.ActasHallazgos.Find(1));
        }

        [Fact]
        public async Task GuardarHallazgosAsync_RechazaHallazgosMasLargosQueLaColumna()
        {
            using var contexto = TestDbContextFactory.Crear();
            CrearActaConCatalogo(contexto);
            var servicio = CrearServicio(contexto);

            await Assert.ThrowsAsync<HallazgosInvalidosException>(() =>
                servicio.GuardarHallazgosAsync(1, new InfoHallazgosActaDto
                {
                    IdsGuias = new List<int> { 1 },
                    Hallazgos = new string('a', 4001),
                }));
        }

        [Fact]
        public async Task GuardarHallazgosAsync_LanzaKeyNotFoundSiElActaNoExiste()
        {
            using var contexto = TestDbContextFactory.Crear();
            CrearActaConCatalogo(contexto);
            var servicio = CrearServicio(contexto);

            await Assert.ThrowsAsync<KeyNotFoundException>(() =>
                servicio.GuardarHallazgosAsync(999, new InfoHallazgosActaDto { IdsGuias = new List<int> { 1 }, Hallazgos = "Hallazgo" }));
        }

        [Fact]
        public async Task GuardarHallazgosAsync_NoModificaLosDemasApartados()
        {
            using var contexto = TestDbContextFactory.Crear();
            CrearActaConCatalogo(contexto);
            var servicio = CrearServicio(contexto);

            await servicio.GuardarHallazgosAsync(1, new InfoHallazgosActaDto { IdsGuias = new List<int> { 2 }, Hallazgos = "Hallazgo" });

            Assert.Equal("Soda Doña Ana", contexto.ActasInfoGeneral.Find(1)!.NombreComercial);
            Assert.Equal("Ana Pérez", contexto.ActasResponsable.Find(1)!.NombreResponsable);
            Assert.Equal("DENUNCIA", contexto.ActasMotivo.Find(1)!.MotivoInspeccion);
        }

        // Acta completa como la manda el frontend al presionar "Guardar y enviar acta".
        private static EnvioActaGeneralDto CrearEnvioCompleto(int idGuia = 1) => new()
        {
            InfoGeneral = new InfoGeneralActaDto
            {
                FechaInspeccion = new DateTime(2026, 10, 5),
                HoraInicio = "08:30",
                NombreComercial = "Soda La Esquina",
                Provincia = "San José",
                Canton = "Escazú",
                Distrito = "San Rafael",
                DireccionExacta = "100 m norte de la iglesia",
                CorreoNotificaciones = "soda@correo.com",
                AutorizaIngreso = true,
                AutorizaFotos = false,
            },
            Responsable = new InfoResponsableActaDto
            {
                NombreResponsable = "Luis Mora",
                CargoResponsable = new List<string> { "ENCARGADO" },
                NumeroIdentificacionResponsable = "1-1111-1111",
            },
            Motivo = new InfoMotivoActaDto { MotivoInspeccion = new List<string> { "SEGUIMIENTO" } },
            Hallazgos = new InfoHallazgosActaDto { IdsGuias = new List<int> { idGuia }, Hallazgos = "Sin hallazgos relevantes." },
            Acciones = new InfoAccionesActaDto { Acciones = new List<string> { "CIERRE_CASO" } },
            Cierre = new InfoCierreActaDto
            {
                PersonasPresentes = new List<PersonaPresenteDto>
                {
                    new() { NombreCompleto = "Luis Mora", CargoInstitucion = "Encargado", NumeroIdentificacion = "1-1111-1111", Firma = "L. Mora" },
                },
            },
        };

        [Fact]
        public async Task EnviarActaAsync_GuardaLosSeisApartadosYFinalizaElActa()
        {
            using var contexto = TestDbContextFactory.Crear();
            CrearActaConCatalogo(contexto);
            var servicio = CrearServicio(contexto);

            await servicio.EnviarActaAsync(1, CrearEnvioCompleto());

            Assert.Equal("FINALIZADA", contexto.ActasGenerales.AsNoTracking().Single(a => a.IdActa == 1).Estado);
            Assert.Equal("Soda La Esquina", contexto.ActasInfoGeneral.AsNoTracking().Single().NombreComercial);
            Assert.Equal("S", contexto.ActasInfoGeneral.AsNoTracking().Single().AutorizaIngreso);
            Assert.Equal("ENCARGADO", contexto.ActasResponsable.AsNoTracking().Single().CargoResponsable);
            Assert.Equal("SEGUIMIENTO", contexto.ActasMotivo.AsNoTracking().Single().MotivoInspeccion);
            Assert.Equal("1", contexto.ActasHallazgos.AsNoTracking().Single().GuiasAplicables);
            Assert.Equal("CIERRE_CASO", contexto.ActasAcciones.AsNoTracking().Single().AccionesSeguir);
            Assert.Contains("L. Mora", contexto.ActasCierre.AsNoTracking().Single().PersonasPresentes);
        }

        [Fact]
        public async Task EnviarActaAsync_NoGuardaNadaSiUnApartadoEsInvalido()
        {
            using var contexto = TestDbContextFactory.Crear();
            CrearActaConCatalogo(contexto);
            var servicio = CrearServicio(contexto);

            await Assert.ThrowsAsync<HallazgosInvalidosException>(() =>
                servicio.EnviarActaAsync(1, CrearEnvioCompleto(idGuia: 99)));

            // Se consulta el almacén (AsNoTracking) y no lo que quedó pendiente en el contexto.
            Assert.Equal("EN_PROCESO", contexto.ActasGenerales.AsNoTracking().Single(a => a.IdActa == 1).Estado);
            Assert.Equal("Soda Doña Ana", contexto.ActasInfoGeneral.AsNoTracking().Single().NombreComercial);
            Assert.False(contexto.ActasCierre.AsNoTracking().Any());
        }

        [Fact]
        public async Task EnviarActaAsync_RechazaUnActaYaFinalizada()
        {
            using var contexto = TestDbContextFactory.Crear();
            CrearActaConCatalogo(contexto);
            contexto.ActasGenerales.Find(1)!.Estado = "FINALIZADA";
            contexto.SaveChanges();
            var servicio = CrearServicio(contexto);

            await Assert.ThrowsAsync<ActaYaFinalizadaException>(() =>
                servicio.EnviarActaAsync(1, CrearEnvioCompleto()));
        }

        [Fact]
        public async Task EnviarActaAsync_LanzaKeyNotFoundSiElActaNoExiste()
        {
            using var contexto = TestDbContextFactory.Crear();
            CrearActaConCatalogo(contexto);
            var servicio = CrearServicio(contexto);

            await Assert.ThrowsAsync<KeyNotFoundException>(() =>
                servicio.EnviarActaAsync(999, CrearEnvioCompleto()));
        }
    }
}
