using Microsoft.EntityFrameworkCore;
using SGGDIS_Api.Data;

namespace SGGDIS_Api.Tests
{
    // Crea un SggdisDbContext respaldado por el proveedor InMemory de EF Core,
    // aislado por test (nombre de base único), para no depender de Oracle real.
    public static class TestDbContextFactory
    {
        public static SggdisDbContext Crear()
        {
            var opciones = new DbContextOptionsBuilder<SggdisDbContext>()
                .UseInMemoryDatabase(Guid.NewGuid().ToString())
                .Options;

            return new SggdisDbContext(opciones);
        }
    }
}
