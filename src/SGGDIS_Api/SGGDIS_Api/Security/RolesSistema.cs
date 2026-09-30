namespace SGGDIS_Api.Security;

public static class RolesSistema
{
    public const string Inspector = "Inspector";
    public const string Pendiente = "Pendiente";
    public const string DirectorRegional = "Director Regional";
    public const string DirectorArea = "Director de Área";
    public const string AtencionCliente = "Atención al cliente";
    public const string Administrador = "Administrador";

    public const string OperacionInspecciones = Inspector;
    public const string AdministracionGuias = Inspector + "," + Administrador;
}