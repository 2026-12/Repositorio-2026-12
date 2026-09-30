using Microsoft.EntityFrameworkCore;
using SGGDIS_Api.Models;

namespace SGGDIS_Api.Data
{
    /// <summary>
    /// DbContext de EF Core: acá se declaran las tablas (DbSet) y sus relaciones.
    /// </summary>
    public class SggdisDbContext : DbContext
    {
        // Recibe la configuración de conexión (definida en Program.cs) y se la pasa a EF Core.
        public SggdisDbContext(DbContextOptions<SggdisDbContext> options) : base(options) { }

        public DbSet<InsGuia> Guias => Set<InsGuia>();
        public DbSet<InsTipoEstablecimiento> TiposEstablecimiento => Set<InsTipoEstablecimiento>();
        public DbSet<InsSeccion> Secciones => Set<InsSeccion>();
        public DbSet<InsItem> Items => Set<InsItem>();
        public DbSet<InsInspeccion> Inspecciones { get; set; }
        public DbSet<InsRespuesta> Respuestas { get; set; }
        public DbSet<SegUsuario> Usuarios => Set<SegUsuario>();
        public DbSet<SegRegion> Regiones => Set<SegRegion>();
        public DbSet<SegArea> Areas => Set<SegArea>();
        public DbSet<SegSesion> Sesiones => Set<SegSesion>();

        // Configura relaciones que EF no puede inferir solo de los atributos en Models.
        protected override void OnModelCreating(ModelBuilder modelBuilder)
        {
            // Muchos-a-muchos: qué secciones aplican a cada tipo de establecimiento (tabla INS_TIPO_SECCION).
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

            // El consecutivo (folio) de cada inspección debe ser único en todo el sistema.
            modelBuilder.Entity<InsInspeccion>()
                .HasIndex(i => i.Consecutivo)
                .IsUnique();

            modelBuilder.Entity<SegUsuario>()
                .HasIndex(u => u.Correo)
                .IsUnique();

            modelBuilder.Entity<SegUsuario>()
                .HasIndex(u => u.Identificacion)
                .IsUnique();

            modelBuilder.Entity<SegSesion>()
                .HasIndex(s => s.HashToken)
                .IsUnique();

            modelBuilder.Entity<SegRegion>()
                .HasIndex(region => region.Codigo)
                .IsUnique();

            modelBuilder.Entity<SegArea>()
                .HasIndex(area => new { area.IdRegion, area.Codigo })
                .IsUnique();

            modelBuilder.Entity<SegArea>()
                .HasOne(area => area.Region)
                .WithMany(region => region.Areas)
                .HasForeignKey(area => area.IdRegion);

            modelBuilder.Entity<SegUsuario>()
                .HasOne(usuario => usuario.Area)
                .WithMany(area => area.Usuarios)
                .HasForeignKey(usuario => usuario.IdArea);

            modelBuilder.Entity<SegUsuario>()
                .HasOne(usuario => usuario.Region)
                .WithMany()
                .HasForeignKey(usuario => usuario.IdRegion);
        }
    }
}