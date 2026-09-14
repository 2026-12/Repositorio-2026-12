using Microsoft.Extensions.Logging.Abstractions;
using SGGDIS_Api.Data;
using SGGDIS_Api.Models;
using SGGDIS_Api.Models.Dtos;
using SGGDIS_Api.Services;
using Xunit;

namespace SGGDIS_Api.Tests.Services
{
    // Cubre la lógica de negocio detrás de las HU A-I: creación/eliminación de
    // inspecciones, autoguardado de respuestas y el cierre (HU I: validación de
    // campos, secciones obligatorias, puntaje, exclusión de ítems N/A y clasificación).
    public class InspeccionServiceTests
    {
        private static InspeccionService CrearServicio(SggdisDbContext contexto)
            => new(contexto, NullLogger<InspeccionService>.Instance);

        // ---- CrearInspeccionAsync ----

        [Fact]
        public async Task CrearInspeccionAsync_CreaInspeccionEnProceso()
        {
            using var contexto = TestDbContextFactory.Crear();
            var servicio = CrearServicio(contexto);

            var inspeccion = await servicio.CrearInspeccionAsync(new CrearInspeccionDto
            {
                IdGuia = 1,
                IdTipoEstablecimiento = 1,
                NombreEstablecimiento = "Soda Doña Ana",
                Consecutivo = "F-001",
                Fecha = DateTime.Today,
            });

            Assert.Equal("EN_PROCESO", inspeccion.Estado);
            Assert.Single(contexto.Inspecciones);
        }

        [Fact]
        public async Task CrearInspeccionAsync_RechazaConsecutivoDuplicado()
        {
            using var contexto = TestDbContextFactory.Crear();
            contexto.Inspecciones.Add(new InsInspeccion { Consecutivo = "F-001", NombreEstablecimiento = "X", Fecha = DateTime.Today });
            await contexto.SaveChangesAsync();
            var servicio = CrearServicio(contexto);

            await Assert.ThrowsAsync<ConsecutivoDuplicadoException>(() =>
                servicio.CrearInspeccionAsync(new CrearInspeccionDto { Consecutivo = "F-001", Fecha = DateTime.Today }));
        }

        // ---- EliminarInspeccionAsync ----

        [Fact]
        public async Task EliminarInspeccionAsync_EliminaInspeccionYSusRespuestas()
        {
            using var contexto = TestDbContextFactory.Crear();
            var inspeccion = new InsInspeccion { Consecutivo = "F-002", NombreEstablecimiento = "X", Fecha = DateTime.Today };
            contexto.Inspecciones.Add(inspeccion);
            await contexto.SaveChangesAsync();
            contexto.Respuestas.Add(new InsRespuesta { IdInspeccion = inspeccion.IdInspeccion, IdItem = 1, Estado = "Cumple", PuntosOtorgados = 5 });
            await contexto.SaveChangesAsync();
            var servicio = CrearServicio(contexto);

            var eliminada = await servicio.EliminarInspeccionAsync(inspeccion.IdInspeccion);

            Assert.True(eliminada);
            Assert.Empty(contexto.Inspecciones);
            Assert.Empty(contexto.Respuestas);
        }

        [Fact]
        public async Task EliminarInspeccionAsync_DevuelveFalseSiNoExiste()
        {
            using var contexto = TestDbContextFactory.Crear();
            var servicio = CrearServicio(contexto);

            Assert.False(await servicio.EliminarInspeccionAsync(999));
        }

        // ---- GuardarRespuestasAsync (autoguardado, HU A-H) ----

        [Fact]
        public async Task GuardarRespuestasAsync_InsertaRespuestasNuevas()
        {
            using var contexto = TestDbContextFactory.Crear();
            var inspeccion = new InsInspeccion { Consecutivo = "F-003", NombreEstablecimiento = "X", Fecha = DateTime.Today };
            contexto.Inspecciones.Add(inspeccion);
            await contexto.SaveChangesAsync();
            var servicio = CrearServicio(contexto);

            await servicio.GuardarRespuestasAsync(inspeccion.IdInspeccion, new List<RespuestaDto>
            {
                new() { IdItem = 1, Estado = "Cumple", PuntosOtorgados = 8 },
                new() { IdItem = 2, Estado = "No cumple", PuntosOtorgados = 0 },
            });

            Assert.Equal(2, contexto.Respuestas.Count());
        }

        [Fact]
        public async Task GuardarRespuestasAsync_ActualizaRespuestaExistenteSinDuplicar()
        {
            using var contexto = TestDbContextFactory.Crear();
            var inspeccion = new InsInspeccion { Consecutivo = "F-004", NombreEstablecimiento = "X", Fecha = DateTime.Today };
            contexto.Inspecciones.Add(inspeccion);
            await contexto.SaveChangesAsync();
            var servicio = CrearServicio(contexto);

            await servicio.GuardarRespuestasAsync(inspeccion.IdInspeccion, new List<RespuestaDto>
            {
                new() { IdItem = 1, Estado = "Cumple", PuntosOtorgados = 8 },
            });
            // El inspector cambia de opinión y vuelve a marcar el mismo ítem (mutuamente excluyente).
            await servicio.GuardarRespuestasAsync(inspeccion.IdInspeccion, new List<RespuestaDto>
            {
                new() { IdItem = 1, Estado = "No cumple", PuntosOtorgados = 0 },
            });

            var respuesta = Assert.Single(contexto.Respuestas);
            Assert.Equal("No cumple", respuesta.Estado);
            Assert.Equal(0, respuesta.PuntosOtorgados);
        }

        // ---- CerrarInspeccionAsync (HU I) ----

        private static async Task<(SggdisDbContext contexto, InsInspeccion inspeccion, InsItem itemObligatorio, InsItem itemCritico)>
            PrepararInspeccionConItems(int puntajeMaximo = 152)
        {
            var contexto = TestDbContextFactory.Crear();

            var tipo = new InsTipoEstablecimiento { IdTipoEstablecimiento = 1, IdGuia = 1, Nombre = "Soda", PuntajeMaximo = puntajeMaximo };
            var seccion = new InsSeccion { IdSeccion = 1, IdGuia = 1, Codigo = "A", Nombre = "Aspectos Generales" };
            seccion.TiposEstablecimiento.Add(tipo);

            var itemObligatorio = new InsItem { IdItem = 1, IdSeccion = 1, Articulo = "Art. 10", Descripcion = "Agua potable", Puntaje = 8, EsCritico = "S", Seccion = seccion };
            var itemCritico = new InsItem { IdItem = 2, IdSeccion = 1, Articulo = "Art. 12", Descripcion = "Iluminación", Puntaje = 6, Seccion = seccion };
            seccion.Items.Add(itemObligatorio);
            seccion.Items.Add(itemCritico);

            contexto.TiposEstablecimiento.Add(tipo);
            contexto.Secciones.Add(seccion);
            contexto.Items.AddRange(itemObligatorio, itemCritico);

            var inspeccion = new InsInspeccion
            {
                IdTipoEstablecimiento = 1,
                Consecutivo = "F-005",
                NombreEstablecimiento = "Soda Doña Ana",
                Fecha = DateTime.Today,
            };
            contexto.Inspecciones.Add(inspeccion);
            await contexto.SaveChangesAsync();

            return (contexto, inspeccion, itemObligatorio, itemCritico);
        }

        [Fact]
        public async Task CerrarInspeccionAsync_RechazaSiFaltanCamposObligatorios()
        {
            var (contexto, inspeccion, _, _) = await PrepararInspeccionConItems();
            using var _1 = contexto;
            var servicio = CrearServicio(contexto);

            await Assert.ThrowsAsync<CamposCierreIncompletosException>(() =>
                servicio.CerrarInspeccionAsync(inspeccion.IdInspeccion, new CerrarInspeccionDto
                {
                    NombreInspector = "",
                    IdentificacionInspector = "1-1111-1111",
                    IdentificacionRepresentante = "2-2222-2222",
                }));
        }

        [Fact]
        public async Task CerrarInspeccionAsync_RechazaSiHayItemsObligatoriosSinResponder()
        {
            var (contexto, inspeccion, _, _) = await PrepararInspeccionConItems();
            using var _1 = contexto;
            var servicio = CrearServicio(contexto);

            await Assert.ThrowsAsync<SeccionesIncompletasException>(() =>
                servicio.CerrarInspeccionAsync(inspeccion.IdInspeccion, new CerrarInspeccionDto
                {
                    NombreInspector = "Ana",
                    IdentificacionInspector = "1-1111-1111",
                    IdentificacionRepresentante = "2-2222-2222",
                }));
        }

        [Fact]
        public async Task CerrarInspeccionAsync_CalculaPuntajePorcentajeYClasificacion()
        {
            var (contexto, inspeccion, itemObligatorio, itemCritico) = await PrepararInspeccionConItems(puntajeMaximo: 14);
            using var _1 = contexto;
            contexto.Respuestas.AddRange(
                new InsRespuesta { IdInspeccion = inspeccion.IdInspeccion, IdItem = itemObligatorio.IdItem, Estado = "Cumple", PuntosOtorgados = 8 },
                new InsRespuesta { IdInspeccion = inspeccion.IdInspeccion, IdItem = itemCritico.IdItem, Estado = "No cumple", PuntosOtorgados = 0 });
            await contexto.SaveChangesAsync();
            var servicio = CrearServicio(contexto);

            var resumen = await servicio.CerrarInspeccionAsync(inspeccion.IdInspeccion, new CerrarInspeccionDto
            {
                NombreInspector = "Ana",
                IdentificacionInspector = "1-1111-1111",
                IdentificacionRepresentante = "2-2222-2222",
            });

            Assert.Equal(8, resumen.PuntajeObtenido);
            Assert.Equal(14, resumen.PuntajeMaximo);
            Assert.Equal(57.14m, resumen.Porcentaje);
            Assert.Equal("Condiciones inaceptables", resumen.Clasificacion);
        }

        [Fact]
        public async Task CerrarInspeccionAsync_ExcluyeDelMaximoLosItemsMarcadosNoAplica()
        {
            var (contexto, inspeccion, itemObligatorio, itemCritico) = await PrepararInspeccionConItems(puntajeMaximo: 14);
            using var _1 = contexto;
            contexto.Respuestas.AddRange(
                new InsRespuesta { IdInspeccion = inspeccion.IdInspeccion, IdItem = itemObligatorio.IdItem, Estado = "Cumple", PuntosOtorgados = 8 },
                new InsRespuesta { IdInspeccion = inspeccion.IdInspeccion, IdItem = itemCritico.IdItem, Estado = "N/A" });
            await contexto.SaveChangesAsync();
            var servicio = CrearServicio(contexto);

            var resumen = await servicio.CerrarInspeccionAsync(inspeccion.IdInspeccion, new CerrarInspeccionDto
            {
                NombreInspector = "Ana",
                IdentificacionInspector = "1-1111-1111",
                IdentificacionRepresentante = "2-2222-2222",
            });

            // Máximo ajustado: 14 - 6 (puntos del ítem N/A) = 8; con 8 obtenidos => 100%.
            Assert.Equal(8, resumen.PuntajeMaximo);
            Assert.Equal(100m, resumen.Porcentaje);
            Assert.Equal("Buenas condiciones", resumen.Clasificacion);
        }

        [Theory]
        [InlineData(69, "Condiciones inaceptables")]
        [InlineData(70, "Condiciones deficientes")]
        [InlineData(80, "Condiciones deficientes")]
        [InlineData(81, "Buenas condiciones")]
        [InlineData(100, "Buenas condiciones")]
        public async Task CerrarInspeccionAsync_ClasificaSegunRangosDelArticulo65(int puntajeObtenido, string clasificacionEsperada)
        {
            var (contexto, inspeccion, itemObligatorio, itemCritico) = await PrepararInspeccionConItems(puntajeMaximo: 100);
            using var _1 = contexto;
            contexto.Respuestas.AddRange(
                new InsRespuesta { IdInspeccion = inspeccion.IdInspeccion, IdItem = itemObligatorio.IdItem, Estado = puntajeObtenido > 0 ? "Cumple" : "No cumple", PuntosOtorgados = puntajeObtenido },
                new InsRespuesta { IdInspeccion = inspeccion.IdInspeccion, IdItem = itemCritico.IdItem, Estado = "N/A" });
            await contexto.SaveChangesAsync();

            // Ajusta el ítem obligatorio para que su puntaje máximo coincida con el % deseado (máximo ajustado = 100).
            itemObligatorio.Puntaje = 100;
            itemCritico.Puntaje = 0;
            await contexto.SaveChangesAsync();

            var servicio = CrearServicio(contexto);
            var resumen = await servicio.CerrarInspeccionAsync(inspeccion.IdInspeccion, new CerrarInspeccionDto
            {
                NombreInspector = "Ana",
                IdentificacionInspector = "1-1111-1111",
                IdentificacionRepresentante = "2-2222-2222",
            });

            Assert.Equal(clasificacionEsperada, resumen.Clasificacion);
        }

        [Fact]
        public async Task CerrarInspeccionAsync_MarcaEstadoFinalizadaYGuardaDatosDeCierre()
        {
            var (contexto, inspeccion, itemObligatorio, itemCritico) = await PrepararInspeccionConItems();
            using var _1 = contexto;
            contexto.Respuestas.AddRange(
                new InsRespuesta { IdInspeccion = inspeccion.IdInspeccion, IdItem = itemObligatorio.IdItem, Estado = "Cumple", PuntosOtorgados = 8 },
                new InsRespuesta { IdInspeccion = inspeccion.IdInspeccion, IdItem = itemCritico.IdItem, Estado = "No cumple", PuntosOtorgados = 0 });
            await contexto.SaveChangesAsync();
            var servicio = CrearServicio(contexto);

            // La orden sanitaria debe poder registrarse aunque el puntaje no sea el foco de la prueba (Art. 65).
            await servicio.CerrarInspeccionAsync(inspeccion.IdInspeccion, new CerrarInspeccionDto
            {
                NombreInspector = "Ana Pérez",
                IdentificacionInspector = "1-1111-1111",
                IdentificacionRepresentante = "2-2222-2222",
                RegistrarOrdenSanitaria = true,
            });

            var actualizada = await contexto.Inspecciones.FindAsync(inspeccion.IdInspeccion);
            Assert.NotNull(actualizada);
            Assert.Equal("FINALIZADA", actualizada!.Estado);
            Assert.Equal("S", actualizada.OrdenSanitaria);
            Assert.Equal("Ana Pérez", actualizada.NombreInspector);
            Assert.NotNull(actualizada.FechaCierre);
        }

        [Fact]
        public async Task CerrarInspeccionAsync_LanzaKeyNotFoundSiLaInspeccionNoExiste()
        {
            using var contexto = TestDbContextFactory.Crear();
            var servicio = CrearServicio(contexto);

            await Assert.ThrowsAsync<KeyNotFoundException>(() =>
                servicio.CerrarInspeccionAsync(999, new CerrarInspeccionDto
                {
                    NombreInspector = "Ana",
                    IdentificacionInspector = "1-1111-1111",
                    IdentificacionRepresentante = "2-2222-2222",
                }));
        }
    }
}
