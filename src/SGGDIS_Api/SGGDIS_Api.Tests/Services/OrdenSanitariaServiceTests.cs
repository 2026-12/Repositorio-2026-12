using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Diagnostics;
using SGGDIS_Api.Data;
using SGGDIS_Api.Models;
using SGGDIS_Api.Models.Dtos.OrdenesSanitarias;
using SGGDIS_Api.Models.Ubicaciones;
using SGGDIS_Api.Services.OrdenesSanitarias;
using Xunit;

namespace SGGDIS_Api.Tests.Services
{
    // Cubre el registro de la Orden Sanitaria (HU-023) y las validaciones del
    // servidor agregadas en la corrección del hallazgo H4 (EH5-02): órdenes sin
    // ordenanzas, fechas incoherentes, plazos incompletos, textos inválidos y
    // datos relacionados inexistentes.
    public class OrdenSanitariaServiceTests
    {
        /// <summary>
        /// Crea un contexto InMemory propio para estas pruebas. El servicio usa
        /// una transacción y el proveedor InMemory no las soporta, por lo que
        /// se ignora esa advertencia solo aquí (TestDbContextFactory no se
        /// modifica porque lo comparten las pruebas de otros módulos).
        /// </summary>
        private static SggdisDbContext CrearContexto()
        {
            var opciones = new DbContextOptionsBuilder<SggdisDbContext>()
                .UseInMemoryDatabase(Guid.NewGuid().ToString())
                .ConfigureWarnings(advertencias => advertencias.Ignore(InMemoryEventId.TransactionIgnoredWarning))
                .Options;

            var contexto = new SggdisDbContext(opciones);

            contexto.Inspecciones.Add(new InsInspeccion
            {
                IdInspeccion = 1,
                NombreEstablecimiento = "Restaurante El Buen Sabor",
                Consecutivo = "MS-DRRSCS-ARS-SJ-AI-0002-2026",
                Fecha = DateTime.Today
            });

            contexto.Provincias.Add(new Provincia { IdProvincia = 1, Nombre = "San José" });
            contexto.Cantones.Add(new Canton { IdCanton = 1, IdProvincia = 1, Nombre = "San José" });
            contexto.Distritos.Add(new Distrito { IdDistrito = 1, IdCanton = 1, Nombre = "Carmen" });
            contexto.SaveChanges();

            return contexto;
        }

        /// <summary>
        /// Crea una orden completa y válida, para modificar solo el dato que se
        /// quiere probar en cada caso.
        /// </summary>
        private static CrearOrdenSanitariaDto CrearOrdenValida()
        {
            return new CrearOrdenSanitariaDto
            {
                IdInspeccion = 1,
                IdDistrito = 1,
                DireccionExacta = "Frente al parque central",
                NumeroConsecutivo = "OS-PRUEBA-001",
                NumeroExpediente = "MS-DRRSCS-ARS-SJ-AI-0002-2026",
                NombreEstablecimiento = "Restaurante El Buen Sabor",
                FechaEmision = DateTime.Today,
                FechaNotificacion = DateTime.Today,
                PersonaNotificada = new PersonaNotificadaDto
                {
                    NombreCompleto = "Juan Carlos Rodríguez Mora",
                    Condicion = "Propietario",
                    OtraCondicion = "No aplica",
                    Identificacion = "1-1234-5678"
                },
                Ordenanzas = new List<OrdenanzaDto>
                {
                    new()
                    {
                        NumeroOrden = 5,
                        Ordenanza = "Instalar un lavamanos exclusivo en el área de preparación.",
                        FundamentoLegal = "Art. 18 del Reglamento",
                        Plazo = new PlazoOrdenanzaDto { TipoPlazo = "dias", Cantidad = 5, DiaCumplimiento = 1 }
                    }
                },
                Responsable = new ResponsableOrdenDto
                {
                    NombreCompleto = "María Fernández Solís",
                    Cargo = "Directora",
                    UnidadOrganizativaArs = "ARS San José Centro",
                    Firma = "   "
                }
            };
        }

        [Fact]
        public async Task CrearOrdenSanitariaAsync_GuardaLaOrdenCompletaCuandoLosDatosSonValidos()
        {
            using var contexto = CrearContexto();
            var servicio = new OrdenSanitariaService(contexto);

            var orden = await servicio.CrearOrdenSanitariaAsync(CrearOrdenValida());

            Assert.True(orden.IdOrdenSanitaria > 0);
            Assert.Equal(1, await contexto.OrdenesSanitarias.CountAsync());
            Assert.Equal(1, await contexto.PersonasNotificadas.CountAsync());
            Assert.Equal(1, await contexto.ResponsablesOrden.CountAsync());

            // El número de orden se asigna por posición y el plazo se normaliza
            // según su tipo (DIAS: solo cantidad, sin fecha).
            var ordenanza = await contexto.Ordenanzas.SingleAsync();
            var plazo = await contexto.PlazosOrdenanza.SingleAsync();
            Assert.Equal(1, ordenanza.NumeroOrden);
            Assert.Equal("DIAS", plazo.TipoPlazo);
            Assert.Equal(5, plazo.Cantidad);
            Assert.Null(plazo.DiaCumplimiento);

            // Los datos que no aplican se guardan como null.
            var persona = await contexto.PersonasNotificadas.SingleAsync();
            var responsable = await contexto.ResponsablesOrden.SingleAsync();
            Assert.Null(persona.OtraCondicion);
            Assert.Null(responsable.Firma);
        }

        [Fact]
        public async Task CrearOrdenSanitariaAsync_GuardaElPlazoPorFechaSinCantidad()
        {
            using var contexto = CrearContexto();
            var servicio = new OrdenSanitariaService(contexto);
            var fechaCumplimiento = DateTime.Today.AddDays(10);
            var dto = CrearOrdenValida();

            dto.Ordenanzas[0].Plazo = new PlazoOrdenanzaDto
            {
                TipoPlazo = "FECHA",
                Cantidad = 9,
                DiaCumplimiento = fechaCumplimiento.Day,
                MesCumplimiento = fechaCumplimiento.Month,
                AnioCumplimiento = fechaCumplimiento.Year,
                HoraCumplimiento = "14:30"
            };

            await servicio.CrearOrdenSanitariaAsync(dto);

            var plazo = await contexto.PlazosOrdenanza.SingleAsync();
            Assert.Null(plazo.Cantidad);
            Assert.Equal(fechaCumplimiento.Day, plazo.DiaCumplimiento);
            Assert.Equal("14:30", plazo.HoraCumplimiento);
        }

        [Fact]
        public async Task CrearOrdenSanitariaAsync_RechazaOrdenSinOrdenanzasYNoGuardaNada()
        {
            using var contexto = CrearContexto();
            var servicio = new OrdenSanitariaService(contexto);
            var dto = CrearOrdenValida();
            dto.Ordenanzas.Clear();

            var error = await Assert.ThrowsAsync<ArgumentException>(() => servicio.CrearOrdenSanitariaAsync(dto));

            Assert.Equal("Debe registrar al menos una ordenanza.", error.Message);
            Assert.Equal(0, await contexto.OrdenesSanitarias.CountAsync());
        }

        [Fact]
        public async Task CrearOrdenSanitariaAsync_RechazaNotificacionAnteriorALaEmision()
        {
            using var contexto = CrearContexto();
            var servicio = new OrdenSanitariaService(contexto);
            var dto = CrearOrdenValida();
            dto.FechaEmision = DateTime.Today.AddDays(3);
            dto.FechaNotificacion = DateTime.Today.AddDays(1);

            var error = await Assert.ThrowsAsync<ArgumentException>(() => servicio.CrearOrdenSanitariaAsync(dto));

            Assert.Equal("La fecha de notificación no puede ser anterior a la fecha de emisión.", error.Message);
        }

        [Fact]
        public async Task CrearOrdenSanitariaAsync_RechazaFechaDeEmisionPasada()
        {
            using var contexto = CrearContexto();
            var servicio = new OrdenSanitariaService(contexto);
            var dto = CrearOrdenValida();
            dto.FechaEmision = DateTime.Today.AddDays(-1);

            var error = await Assert.ThrowsAsync<ArgumentException>(() => servicio.CrearOrdenSanitariaAsync(dto));

            Assert.Equal("La fecha de emisión no puede ser anterior a la fecha actual.", error.Message);
        }

        [Fact]
        public async Task CrearOrdenSanitariaAsync_RechazaPlazoEnDiasSinCantidad()
        {
            using var contexto = CrearContexto();
            var servicio = new OrdenSanitariaService(contexto);
            var dto = CrearOrdenValida();
            dto.Ordenanzas[0].Plazo = new PlazoOrdenanzaDto { TipoPlazo = "DIAS" };

            var error = await Assert.ThrowsAsync<ArgumentException>(() => servicio.CrearOrdenSanitariaAsync(dto));

            Assert.Equal("La cantidad del plazo de la ordenanza 1 debe ser un número entero mayor que 0.", error.Message);
        }

        [Fact]
        public async Task CrearOrdenSanitariaAsync_RechazaHoraDeCumplimientoConFormatoInvalido()
        {
            using var contexto = CrearContexto();
            var servicio = new OrdenSanitariaService(contexto);
            var fechaCumplimiento = DateTime.Today.AddDays(5);
            var dto = CrearOrdenValida();

            dto.Ordenanzas[0].Plazo = new PlazoOrdenanzaDto
            {
                TipoPlazo = "FECHA",
                DiaCumplimiento = fechaCumplimiento.Day,
                MesCumplimiento = fechaCumplimiento.Month,
                AnioCumplimiento = fechaCumplimiento.Year,
                HoraCumplimiento = "25:99"
            };

            var error = await Assert.ThrowsAsync<ArgumentException>(() => servicio.CrearOrdenSanitariaAsync(dto));

            Assert.Equal("La hora de cumplimiento de la ordenanza 1 debe tener el formato de 24 horas HH:mm.", error.Message);
        }

        [Fact]
        public async Task CrearOrdenSanitariaAsync_RechazaOrdenanzaSinTexto()
        {
            using var contexto = CrearContexto();
            var servicio = new OrdenSanitariaService(contexto);
            var dto = CrearOrdenValida();
            dto.Ordenanzas[0].Ordenanza = "   ";

            var error = await Assert.ThrowsAsync<ArgumentException>(() => servicio.CrearOrdenSanitariaAsync(dto));

            Assert.Equal("Debe indicar el texto de la ordenanza 1.", error.Message);
        }

        [Fact]
        public async Task CrearOrdenSanitariaAsync_ExigeIndicarLaOtraCondicionCuandoEsOtro()
        {
            using var contexto = CrearContexto();
            var servicio = new OrdenSanitariaService(contexto);
            var dto = CrearOrdenValida();
            dto.PersonaNotificada.Condicion = "Otro";
            dto.PersonaNotificada.OtraCondicion = null;

            var error = await Assert.ThrowsAsync<ArgumentException>(() => servicio.CrearOrdenSanitariaAsync(dto));

            Assert.Equal("Debe indicar la otra condición.", error.Message);
        }

        [Fact]
        public async Task CrearOrdenSanitariaAsync_RechazaTextoQueSuperaLaLongitudDeLaBaseDeDatos()
        {
            using var contexto = CrearContexto();
            var servicio = new OrdenSanitariaService(contexto);
            var dto = CrearOrdenValida();
            dto.DireccionExacta = new string('x', 401);

            var error = await Assert.ThrowsAsync<ArgumentException>(() => servicio.CrearOrdenSanitariaAsync(dto));

            Assert.Equal("La dirección exacta no puede superar los 400 caracteres.", error.Message);
        }

        [Fact]
        public async Task CrearOrdenSanitariaAsync_RechazaInspeccionInexistente()
        {
            using var contexto = CrearContexto();
            var servicio = new OrdenSanitariaService(contexto);
            var dto = CrearOrdenValida();
            dto.IdInspeccion = 999;

            var error = await Assert.ThrowsAsync<KeyNotFoundException>(() => servicio.CrearOrdenSanitariaAsync(dto));

            Assert.Equal("La inspección relacionada no existe.", error.Message);
            Assert.Equal(0, await contexto.OrdenesSanitarias.CountAsync());
        }

        [Fact]
        public async Task CrearOrdenSanitariaAsync_RechazaDistritoInexistente()
        {
            using var contexto = CrearContexto();
            var servicio = new OrdenSanitariaService(contexto);
            var dto = CrearOrdenValida();
            dto.IdDistrito = 999;

            var error = await Assert.ThrowsAsync<KeyNotFoundException>(() => servicio.CrearOrdenSanitariaAsync(dto));

            Assert.Equal("El distrito seleccionado no existe.", error.Message);
            Assert.Equal(0, await contexto.Ubicaciones.CountAsync());
        }
    }
}