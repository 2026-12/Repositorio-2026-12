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

        // Devuelve el acta completa, para restaurar el formulario si el usuario vuelve a entrar.
        Task<Models.InsActaGeneral?> ObtenerActaAsync(int idActa);
    }
}
