using SGGDIS_Api.Models.Dtos;

namespace SGGDIS_Api.Services
{
    /// <summary>
    /// Operaciones sobre el Acta de Inspección General (HU-004 y sub-HU).
    /// Cada apartado del wizard tiene su propio método de guardado, para que
    /// el autoguardado de uno no dependa de que los demás estén completos.
    /// </summary>
    public interface IActaGeneralService
    {
        // Crea un acta vacía en EN_PROCESO y le asigna el folio (NumeroActa).
        Task<ActaGeneralCreadaDto> CrearActaAsync();

        // Guarda (upsert) los datos del Apartado I - Información General.
        Task GuardarInfoGeneralAsync(int idActa, InfoGeneralActaDto dto);

        // Guarda (upsert) los datos del Apartado II - Información del Responsable.
        Task GuardarResponsableAsync(int idActa, InfoResponsableActaDto dto);

        // Guarda (upsert) los datos del Apartado III - Motivo de la inspección.
        Task GuardarMotivoAsync(int idActa, InfoMotivoActaDto dto);

        // Guarda (upsert) los datos del Apartado IV - Hallazgos de la inspección.
        // Lanza HallazgosInvalidosException si alguna guía no existe en INS_GUIA.
        Task GuardarHallazgosAsync(int idActa, InfoHallazgosActaDto dto);

        // Devuelve el acta completa, para restaurar el formulario si el usuario vuelve a entrar.
        Task<Models.InsActaGeneral?> ObtenerActaAsync(int idActa);

        // Elimina el acta (el inspector salió sin terminarla). Devuelve false si no existía.
        Task<bool> EliminarActaAsync(int idActa);
    }
}
