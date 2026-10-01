using Microsoft.EntityFrameworkCore;
using SGGDIS_Api.Models;
using SGGDIS_Api.Models.OrdenesSanitarias;
using SGGDIS_Api.Models.Ubicaciones;

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
        public DbSet<InsActaGeneral> ActasGenerales => Set<InsActaGeneral>();

        // Órdenes Sanitarias 
        public DbSet<OrdenSanitaria> OrdenesSanitarias => Set<OrdenSanitaria>();
        public DbSet<Ordenanza> Ordenanzas => Set<Ordenanza>();

        // Nuevas tablas relacionadas con Órdenes Sanitarias
        public DbSet<OrdenPersonaNotificada> PersonasNotificadas => Set<OrdenPersonaNotificada>();
        public DbSet<OrdenanzaPlazo> PlazosOrdenanza => Set<OrdenanzaPlazo>();
        public DbSet<OrdenResponsable> ResponsablesOrden => Set<OrdenResponsable>();

        // Ubicaciones
        public DbSet<Provincia> Provincias => Set<Provincia>();
        public DbSet<Canton> Cantones => Set<Canton>();
        public DbSet<Distrito> Distritos => Set<Distrito>();
        public DbSet<Ubicacion> Ubicaciones => Set<Ubicacion>();

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

            // Una Orden Sanitaria puede contener varias ordenanzas. 
            modelBuilder.Entity<OrdenSanitaria>()
                .HasMany(ordenSanitaria => ordenSanitaria.Ordenanzas)
                .WithOne(ordenanza => ordenanza.OrdenSanitaria)
                .HasForeignKey(ordenanza => ordenanza.IdOrdenSanitaria)
                .OnDelete(DeleteBehavior.Cascade);

            // ============================================================
            // Relaciones nuevas de Ubicaciones
            // ============================================================

            // Una provincia puede tener varios cantones.
            modelBuilder.Entity<Canton>()
                .HasOne(canton => canton.Provincia)
                .WithMany(provincia => provincia.Cantones)
                .HasForeignKey(canton => canton.IdProvincia);

            // Un cantón puede tener varios distritos.
            modelBuilder.Entity<Distrito>()
                .HasOne(distrito => distrito.Canton)
                .WithMany(canton => canton.Distritos)
                .HasForeignKey(distrito => distrito.IdCanton);

            // Un distrito puede tener varias ubicaciones.
            modelBuilder.Entity<Ubicacion>()
                .HasOne(ubicacion => ubicacion.Distrito)
                .WithMany(distrito => distrito.Ubicaciones)
                .HasForeignKey(ubicacion => ubicacion.IdDistrito);

            // Una ubicación puede estar asociada con varias órdenes sanitarias.
            modelBuilder.Entity<OrdenSanitaria>()
                .HasOne(ordenSanitaria => ordenSanitaria.Ubicacion)
                .WithMany(ubicacion => ubicacion.OrdenesSanitarias)
                .HasForeignKey(ordenSanitaria => ordenSanitaria.IdUbicacion);

            // ============================================================
            // Relaciones nuevas de Orden Sanitaria
            // ============================================================

            // Una Orden Sanitaria tiene una persona notificada.
            modelBuilder.Entity<OrdenPersonaNotificada>()
                .HasOne(persona => persona.OrdenSanitaria)
                .WithOne(orden => orden.PersonaNotificada)
                .HasForeignKey<OrdenPersonaNotificada>(
                    persona => persona.IdOrdenSanitaria);

            // Cada ordenanza tiene un único plazo.
            modelBuilder.Entity<OrdenanzaPlazo>()
                .HasOne(plazo => plazo.Ordenanza)
                .WithOne(ordenanza => ordenanza.Plazo)
                .HasForeignKey<OrdenanzaPlazo>(
                    plazo => plazo.IdOrdenanza);

            // Una Orden Sanitaria tiene un responsable.
            modelBuilder.Entity<OrdenResponsable>()
                .HasOne(responsable => responsable.OrdenSanitaria)
                .WithOne(orden => orden.Responsable)
                .HasForeignKey<OrdenResponsable>(
                    responsable => responsable.IdOrdenSanitaria);

            // El número consecutivo de la Orden Sanitaria debe ser único.
            modelBuilder.Entity<OrdenSanitaria>()
                .HasIndex(orden => orden.NumeroConsecutivo)
                .IsUnique();

            // El folio del acta general también debe ser único.
            modelBuilder.Entity<InsActaGeneral>()
                .HasIndex(a => a.NumeroActa)
                .IsUnique();
>>>>>>> origin/main
        }
    }
}