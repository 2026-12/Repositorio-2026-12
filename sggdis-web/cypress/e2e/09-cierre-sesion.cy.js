// HU "Cierre de sesión" — pruebas funcionales E2E divididas por criterio de
// aceptación.
//   CA1 — El usuario puede cerrar sesión desde su panel y vuelve al login.
//   CA2 — Al cerrar sesión se limpia la sesión local (sessionStorage) y se
//         invalida la sesión en el servidor (POST /api/auth/logout → 204).
//   CA3 — Tras cerrar sesión no se puede volver a entrar a rutas protegidas
//         sin autenticarse de nuevo.
//
// Prerequisito: la cuenta temporal de Administrador debe existir en la BD
// (ver DataBase/CrearAdministradorTemporal.sql): 123@misalud.go.cr / 123,
// y la cuenta del Inspector debe existir con rol/área asignados (la crea
// y activa el spec 00-preparar-inspector).

// ========================== DATOS DE PRUEBA ==========================
const ADMINISTRADOR = {
  correo: '123@misalud.go.cr',
  contrasena: '123',
  selectorCerrarSesion: '.panel-admin__logout',
  textoPanel: 'Panel de administración',
}

// Mismos valores por defecto que cypress/support/loginInspector.js; se
// pueden personalizar con CYPRESS_INSPECTOR_CORREO / CYPRESS_INSPECTOR_CONTRASENA.
const INSPECTOR = {
  correo: 'cypress1@misalud.go.cr',
  contrasena: 'ClaveSegura123',
  selectorCerrarSesion: '.inicio__cerrarSesion',
  textoPanel: 'Nueva inspección',
}

// Misma URL por defecto que usa el frontend (src/config/api.js). No es un
// dato sensible, así que va como constante (Cypress 16 eliminó Cypress.env).
const URL_API = 'http://localhost:5288'
// =====================================================================

function limpiarEstado() {
  cy.clearCookies()
  cy.clearAllSessionStorage()
  cy.clearLocalStorage()
}

function iniciarSesion(correo, contrasena) {
  cy.visit('/login')
  cy.get('input[name="correo"]').type(correo)
  cy.get('input[name="contrasena"]').type(contrasena, { log: false })
  cy.contains('button', 'Iniciar sesión').click()
}

function cerrarSesionYVerificar(usuario) {
  cy.intercept('POST', '**/api/auth/logout').as('logout')
  cy.get(usuario.selectorCerrarSesion).click()
  cy.wait('@logout').its('response.statusCode').should('eq', 204)
  cy.contains('button', 'Iniciar sesión').should('be.visible')
}

describe('Cierre de sesión', () => {
  beforeEach(limpiarEstado)

  context('CA1 — el usuario cierra sesión desde su panel y vuelve al login', () => {
    it('el Administrador cierra sesión desde el panel de administración', () => {
      iniciarSesion(ADMINISTRADOR.correo, ADMINISTRADOR.contrasena)
      cy.contains(ADMINISTRADOR.textoPanel).should('be.visible')
      cerrarSesionYVerificar(ADMINISTRADOR)
    })

    it('el Inspector cierra sesión desde la pantalla de inicio', () => {
      iniciarSesion(INSPECTOR.correo, INSPECTOR.contrasena)
      cy.contains('.inicio__navLink', INSPECTOR.textoPanel).should('be.visible')
      cerrarSesionYVerificar(INSPECTOR)
    })
  })

  context('CA2 — al cerrar sesión se limpia la sesión local', () => {
    it('sessionStorage queda sin la sesión guardada', () => {
      iniciarSesion(ADMINISTRADOR.correo, ADMINISTRADOR.contrasena)
      cy.contains(ADMINISTRADOR.textoPanel).should('be.visible')
      cerrarSesionYVerificar(ADMINISTRADOR)

      cy.window().then((ventana) => {
        expect(ventana.sessionStorage.getItem('sggdis:sesion')).to.be.null
      })
    })
  })

  context('CA3 — sin sesión no se puede volver a entrar a rutas protegidas', () => {
    it('visitar /admin después del logout redirige al login', () => {
      iniciarSesion(ADMINISTRADOR.correo, ADMINISTRADOR.contrasena)
      cy.contains(ADMINISTRADOR.textoPanel).should('be.visible')
      cerrarSesionYVerificar(ADMINISTRADOR)

      cy.visit('/admin')
      cy.location('pathname').should('eq', '/login')
      cy.contains('button', 'Iniciar sesión').should('be.visible')
    })

    it('visitar /inicio después del logout redirige al login', () => {
      iniciarSesion(INSPECTOR.correo, INSPECTOR.contrasena)
      cy.contains('.inicio__navLink', INSPECTOR.textoPanel).should('be.visible')
      cerrarSesionYVerificar(INSPECTOR)

      cy.visit('/inicio')
      cy.location('pathname').should('eq', '/login')
    })
  })
})
