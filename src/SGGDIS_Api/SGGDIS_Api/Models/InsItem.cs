using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace SGGDIS_Api.Models
{
    /// <summary>
    /// Representa un ítem evaluable dentro de una sección: es decir, una fila del
    /// checklist que el inspector debe marcar como "Cumple", "No cumple" o "N/A".
    /// </summary>
    [Table("INS_ITEM")]
    public class InsItem
    {
        // Identificador único del ítem.
        [Key]
        [Column("ID_ITEM")]
        public int IdItem { get; set; }

        // A qué sección pertenece este ítem (por ejemplo, la sección "B2").
        [Column("ID_SECCION")]
        public int IdSeccion { get; set; }

        // El artículo del reglamento al que hace referencia el ítem (ej. "Art. 23").
        // NOTA: aquí dice MaxLength(60), pero en la base de datos la columna
        // ARTICULO es VARCHAR2(100). Si algún artículo real supera los 60
        // caracteres, EF Core lo va a rechazar antes de llegar a la base de datos.
        // Conviene subir este límite a 100 para que coincida con la tabla.
        [Required]
        [MaxLength(60)]
        [Column("ARTICULO")]
        public string Articulo { get; set; } = string.Empty;

        // El texto completo que describe qué se está revisando en este ítem.
        [Required]
        [MaxLength(400)]
        [Column("DESCRIPCION")]
        public string Descripcion { get; set; } = string.Empty;

        // Cuántos puntos vale este ítem dentro del puntaje total de la guía.
        [Column("PUNTAJE")]
        public int Puntaje { get; set; }

        // Indica si este ítem es crítico ("S") o no ("N"). Un ítem crítico
        // incumplido puede generar una orden sanitaria aunque el puntaje total sea alto.
        [MaxLength(1)]
        [Column("ES_CRITICO")]
        public string EsCritico { get; set; } = "N";

        // Indica si este ítem admite la opción "No aplica" ("S") o no ("N").
        [MaxLength(1)]
        [Column("PERMITE_NO_APLICA")]
        public string PermiteNoAplica { get; set; } = "S";

        // El orden en que debe mostrarse el ítem dentro de su sección.
        [Column("ORDEN")]
        public int Orden { get; set; }

        // La sección a la que pertenece este ítem (relación de llave foránea).
        [ForeignKey(nameof(IdSeccion))]
        public InsSeccion? Seccion { get; set; }
    }
}