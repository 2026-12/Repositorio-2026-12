using Microsoft.AspNetCore.Authorization;
using SGGDIS_Api.Controllers;
using SGGDIS_Api.Security;
using Xunit;

namespace SGGDIS_Api.Tests.Controllers;

public class AuthorizationRoleTests
{
    [Fact]
    public void InspeccionesController_RestringeOperacionesAInspector()
    {
        var authorize = Assert.Single(typeof(InspeccionesController).GetCustomAttributes(typeof(AuthorizeAttribute), inherit: true)) as AuthorizeAttribute;

        Assert.NotNull(authorize);
        Assert.Equal(RolesSistema.Inspector, authorize.Roles);
    }

    [Fact]
    public void GuiasInspeccionController_RestringeCatalogoAInspectorYAdministrador()
    {
        var authorize = Assert.Single(typeof(GuiasInspeccionController).GetCustomAttributes(typeof(AuthorizeAttribute), inherit: true)) as AuthorizeAttribute;

        Assert.NotNull(authorize);
        Assert.Equal(RolesSistema.Inspector + "," + RolesSistema.Administrador, authorize.Roles);
    }

    [Fact]
    public void AdministracionUsuariosController_RestringeUsuariosAlAdministrador()
    {
        var authorize = Assert.Single(typeof(AdministracionUsuariosController).GetCustomAttributes(typeof(AuthorizeAttribute), inherit: true)) as AuthorizeAttribute;

        Assert.NotNull(authorize);
        Assert.Equal(RolesSistema.Administrador, authorize.Roles);
    }

    [Fact]
    public void AdministracionUsuariosController_RestringeGestionAAdministrador()
    {
        var authorize = Assert.Single(typeof(AdministracionUsuariosController).GetCustomAttributes(typeof(AuthorizeAttribute), inherit: true)) as AuthorizeAttribute;

        Assert.NotNull(authorize);
        Assert.Equal(RolesSistema.Administrador, authorize.Roles);
    }

    [Theory]
    [InlineData(typeof(ActaGeneralController))]
    [InlineData(typeof(SGGDIS_Api.Controllers.OrdenesSanitarias.OrdenesSanitariasController))]
    public void ActasYOrdenes_RestringenAccesoAInspectorYAdministrador(Type controllerType)
    {
        var authorize = Assert.Single(controllerType.GetCustomAttributes(typeof(AuthorizeAttribute), inherit: true)) as AuthorizeAttribute;

        Assert.NotNull(authorize);
        Assert.Equal(RolesSistema.OperacionActasYOrdenes, authorize.Roles);
    }
}