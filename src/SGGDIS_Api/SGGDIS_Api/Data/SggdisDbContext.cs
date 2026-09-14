using Microsoft.EntityFrameworkCore;
using SGGDIS_Api.Models;

namespace SGGDIS_Api.Data
{
    /// <summary>
    /// Puente entre el código en C# y la base de datos Oracle: aquí se declara qué
    /// tablas existen (a través de los DbSet) y cómo se relacionan entre sí.
    /// Entity Framework Core usa esta clase para traducir el código a consultas SQL.
    /// </summary>
    public class SggdisDbContext : DbContext
    {
        // Constructor: recibe la configuración de conexión (definida en Program.cs) y se la pasa a EF Core.
        public SggdisDbContext(DbContextOptions<SggdisDbContext> options) : base(options) { }

        // Cada DbSet representa una tabla completa a la que se puede consultar o escribir.
        public DbSet<InsGuia> Guias => Set<InsGuia>();
        public DbSet<InsTipoEstablecimiento> TiposEstablecimiento => Set<InsTipoEstablecimiento>();
        public DbSet<InsSeccion> Secciones => Set<InsSeccion>();
        public DbSet<InsItem> Items => Set<InsItem>();
        public DbSet<InsInspeccion> Inspecciones { get; set; }
        public DbSet<InsRespuesta> Respuestas { get; set; }

        // Aquí se configuran las relaciones y restricciones que EF Core no puede
        // adivinar solo con los atributos de las clases (Models).
        protected override void OnModelCreating(ModelBuilder modelBuilder)
        {
            // Relación muchos-a-muchos: qué secciones aplican a cada tipo de establecimiento (tabla INS_TIPO_SECCION)
            modelBuilder.Entity<InsTipoEstablecimiento>()
                .HasMany(t => t.Secciones)
                .WithMany(s => s.TiposEstablecimiento)
                .UsingEntity<Dictionary<string, object>>(
                    "INS_TIPO_SECCION",
                    j => j.HasOne<InsSeccion>().WithMany().HasForeignKey("ID_SECCION"),
                    j => j.HasOne<InsTipoEstablecimiento>().WithMany().HasForeignKey("ID_TIPO_ESTABLECIMIENTO"));

            base.OnModelCreating(modelBuilder);

            // No se puede responder dos veces el mismo ítem dentro de una misma inspección.
            modelBuilder.Entity<InsRespuesta>()
                .HasIndex(r => new { r.IdInspeccion, r.IdItem })
                .IsUnique();

            // El número consecutivo (folio) de cada inspección debe ser único en todo el sistema.
            modelBuilder.Entity<InsInspeccion>()
                .HasIndex(i => i.Consecutivo)
                .IsUnique();
        }
    }
}