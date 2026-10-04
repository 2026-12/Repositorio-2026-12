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
    }
}
