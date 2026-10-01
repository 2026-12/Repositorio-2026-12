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
        public DbSet<InsActaGeneral> ActasGenerales => Set<InsActaGeneral>();

        // Un DbSet por apartado del Acta General (cada uno en su propia tabla, 1:1 con el acta).
        public DbSet<InsActaInfoGeneral> ActasInfoGeneral => Set<InsActaInfoGeneral>();
        public DbSet<InsActaResponsable> ActasResponsable => Set<InsActaResponsable>();
        public DbSet<InsActaMotivo> ActasMotivo => Set<InsActaMotivo>();
        public DbSet<InsActaHallazgos> ActasHallazgos => Set<InsActaHallazgos>();
        public DbSet<InsActaAcciones> ActasAcciones => Set<InsActaAcciones>();
        public DbSet<InsActaCierre> ActasCierre => Set<InsActaCierre>();

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

            // El folio del acta general también debe ser único.
            modelBuilder.Entity<InsActaGeneral>()
                .HasIndex(a => a.NumeroActa)
                .IsUnique();

            // Apartados del acta: relación 1:1 donde ID_ACTA es a la vez PK y FK de
            // cada tabla de apartado. En una 1:1 EF no puede deducir solo cuál es la
            // tabla principal, por eso se indica explícitamente con HasForeignKey.
            modelBuilder.Entity<InsActaGeneral>()
                .HasOne(a => a.InfoGeneral)
                .WithOne(apartado => apartado.Acta)
                .HasForeignKey<InsActaInfoGeneral>(apartado => apartado.IdActa);

            modelBuilder.Entity<InsActaGeneral>()
                .HasOne(a => a.Responsable)
                .WithOne(apartado => apartado.Acta)
                .HasForeignKey<InsActaResponsable>(apartado => apartado.IdActa);

            modelBuilder.Entity<InsActaGeneral>()
                .HasOne(a => a.Motivo)
                .WithOne(apartado => apartado.Acta)
                .HasForeignKey<InsActaMotivo>(apartado => apartado.IdActa);

            modelBuilder.Entity<InsActaGeneral>()
                .HasOne(a => a.Hallazgos)
                .WithOne(apartado => apartado.Acta)
                .HasForeignKey<InsActaHallazgos>(apartado => apartado.IdActa);

            modelBuilder.Entity<InsActaGeneral>()
                .HasOne(a => a.Acciones)
                .WithOne(apartado => apartado.Acta)
                .HasForeignKey<InsActaAcciones>(apartado => apartado.IdActa);

            modelBuilder.Entity<InsActaGeneral>()
                .HasOne(a => a.Cierre)
                .WithOne(apartado => apartado.Acta)
                .HasForeignKey<InsActaCierre>(apartado => apartado.IdActa);
        }
    }
}