using Microsoft.EntityFrameworkCore;
using SGGDIS_Api.Models;

namespace SGGDIS_Api.Data
{
    public class SggdisDbContext : DbContext
    {
        public SggdisDbContext(DbContextOptions<SggdisDbContext> options) : base(options) { }

        public DbSet<InsGuia> Guias => Set<InsGuia>();
        public DbSet<InsTipoEstablecimiento> TiposEstablecimiento => Set<InsTipoEstablecimiento>();
        public DbSet<InsSeccion> Secciones => Set<InsSeccion>();
        public DbSet<InsItem> Items => Set<InsItem>();
        public DbSet<InsInspeccion> Inspecciones { get; set; }
        public DbSet<InsRespuesta> Respuestas { get; set; }

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

            modelBuilder.Entity<InsRespuesta>()
                .HasIndex(r => new { r.IdInspeccion, r.IdItem })
                .IsUnique();

            modelBuilder.Entity<InsInspeccion>()
                .HasIndex(i => i.Consecutivo)
                .IsUnique();
        }
    }
}