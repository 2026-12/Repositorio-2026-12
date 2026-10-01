using Microsoft.Extensions.Logging.Abstractions;
using SGGDIS_Api.Data;
using SGGDIS_Api.Models;
using SGGDIS_Api.Models.Dtos;
using SGGDIS_Api.Services;
using Xunit;

namespace SGGDIS_Api.Tests.Services
{
    // Cubre el guardado del Apartado IV del Acta General (HU-009): guías
    // aplicables guardadas como ids separados por coma en GUIAS_APLICABLES,
    // validación contra el catálogo INS_GUIA y descripción de hallazgos.
    public class ActaGeneralServiceTests
    {
        private static ActaGeneralService CrearServicio(SggdisDbContext contexto)
            => new(contexto, NullLogger<ActaGeneralService>.Instance);

        // Acta con los apartados I-III ya llenos (para verificar que el
        // Apartado IV no los toca) y un catálogo con tres guías.
        private static InsActaGeneral CrearActaConCatalogo(SggdisDbContext contexto)
        {
            contexto.Guias.AddRange(
                new InsGuia { IdGuia = 1, Nombre = "Guia de Alimentacion", Categoria = "Alimentos" },
                new InsGuia { IdGuia = 2, Nombre = "Guia de Salud Ocupacional", Categoria = "Salud" },
                new InsGuia { IdGuia = 3, Nombre = "Guia de Centros Educativos", Categoria = "Educacion" });

            var acta = new InsActaGeneral
            {
                IdActa = 1,
                NumeroActa = "2026-00001",
                NombreComercial = "Soda Doña Ana",
                NombreResponsable = "Ana Pérez",
                MotivoInspeccion = "DENUNCIA",
            };
            contexto.ActasGenerales.Add(acta);
            contexto.SaveChanges();

            return acta;
        }

        [Fact]
        public async Task GuardarHallazgosAsync_GuardaIdsOrdenadosSinRepetidosYHallazgosLimpios()
        {
            using var contexto = TestDbContextFactory.Crear();
            var acta = CrearActaConCatalogo(contexto);
            var servicio = CrearServicio(contexto);

            await servicio.GuardarHallazgosAsync(1, new InfoHallazgosActaDto
            {
                IdsGuias = new List<int> { 3, 1, 3 },
                Hallazgos = "  Se observó acumulación de grasa en la campana.  ",
            });

            Assert.Equal("1,3", acta.GuiasAplicables);
            Assert.Equal("Se observó acumulación de grasa en la campana.", acta.Hallazgos);
        }

        [Fact]
        public async Task GuardarHallazgosAsync_GuardaNullSiNoHayGuiasNiHallazgos()
        {
            // El autoguardado puede llamarse con el apartado vacío: no se deben
            // guardar cadenas vacías.
            using var contexto = TestDbContextFactory.Crear();
            var acta = CrearActaConCatalogo(contexto);
            acta.GuiasAplicables = "1";
            acta.Hallazgos = "Texto anterior";
            contexto.SaveChanges();
            var servicio = CrearServicio(contexto);

            await servicio.GuardarHallazgosAsync(1, new InfoHallazgosActaDto { IdsGuias = new List<int>(), Hallazgos = "   " });

            Assert.Null(acta.GuiasAplicables);
            Assert.Null(acta.Hallazgos);
        }

        [Fact]
        public async Task GuardarHallazgosAsync_RechazaGuiaQueNoExisteEnElCatalogo()
        {
            using var contexto = TestDbContextFactory.Crear();
            var acta = CrearActaConCatalogo(contexto);
            var servicio = CrearServicio(contexto);

            await Assert.ThrowsAsync<HallazgosInvalidosException>(() =>
                servicio.GuardarHallazgosAsync(1, new InfoHallazgosActaDto { IdsGuias = new List<int> { 1, 99 }, Hallazgos = "Hallazgo" }));

            Assert.Null(acta.GuiasAplicables);
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
            var acta = CrearActaConCatalogo(contexto);
            var servicio = CrearServicio(contexto);

            await servicio.GuardarHallazgosAsync(1, new InfoHallazgosActaDto { IdsGuias = new List<int> { 2 }, Hallazgos = "Hallazgo" });

            Assert.Equal("Soda Doña Ana", acta.NombreComercial);
            Assert.Equal("Ana Pérez", acta.NombreResponsable);
            Assert.Equal("DENUNCIA", acta.MotivoInspeccion);
        }
    }
}
