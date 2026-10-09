// Preparación de un inspector para las pruebas E2E.
//
// Crea una cuenta NUEVA en cada corrida (correo e identificación únicos con
// el timestamp) y le asigna rol/región/área por API. Así no depende del
// estado en que hayan quedado cuentas de corridas anteriores (como la
// compartida cypress1, que puede quedar a medias). Ojo: el backend limita
// el registro a 5 por hora por IP, salta solo si se corre muchas veces
// seguidas.
//
// Prerequisito: la cuenta temporal de Administrador debe existir en la BD
// (ver DataBase/CrearAdministradorTemporal.sql): 123@misalud.go.cr / 123.

// Misma URL por defecto que usa el frontend (src/config/api.js). No es un
// dato sensible, así que va como constante (Cypress 16 eliminó Cypress.env).
const URL_API = 'http://localhost:5288'

// ========================== DATOS DE PRUEBA ==========================
const sufijo = Date.now()

const ADMINISTRADOR = {
  correo: '123@misalud.go.cr',
  contrasena: '123',
}

const INSPECTOR_NUEVO = {
  nombre: 'Inspectora',
  primerApellido: 'Cypress',
  segundoApellido: 'Prueba',
  identificacion: `CY${sufijo}`,
  correo: `inspector.preparacion.${sufijo}@misalud.go.cr`,
  contrasena: 'ClaveSegura123',
}
// =====================================================================

describe('Preparación de un inspector para las pruebas E2E', () => {
  it('crea la cuenta, le asigna rol y área y verifica el login', () => {
    cy.env(['ADMIN_CORREO', 'ADMIN_CONTRASENA'], { log: false }).then((administrador) => {
      const correoAdmin = administrador.ADMIN_CORREO || ADMINISTRADOR.correo
      const contrasenaAdmin = administrador.ADMIN_CONTRASENA || ADMINISTRADOR.contrasena

      cy.clearCookies()
      cy.clearAllSessionStorage()

      // 1) Registro desde la pantalla pública.
      cy.intercept('POST', '**/api/auth/register').as('registroInspector')
      cy.visit('/login')
      cy.contains('button', 'Crear una cuenta').click()
      cy.get('input[name="nombre"]').type(INSPECTOR_NUEVO.nombre)
      cy.get('input[name="primerApellido"]').type(INSPECTOR_NUEVO.primerApellido)
      cy.get('input[name="segundoApellido"]').type(INSPECTOR_NUEVO.segundoApellido)
      cy.get('input[name="identificacion"]').type(INSPECTOR_NUEVO.identificacion)
      cy.get('input[name="correo"]').clear().type(INSPECTOR_NUEVO.correo)
      cy.get('input[name="contrasena"]').type(INSPECTOR_NUEVO.contrasena, { log: false })
      cy.contains('button', 'Crear cuenta').click()
      cy.wait('@registroInspector').then(({ response }) => {
        expect(response, 'Respuesta del registro').to.exist
        expect(response.statusCode, 'Cuenta creada').to.eq(201)
      })

      // 2) El Administrador inicia sesión por UI (se sigue probando el login
      //    y la carga del panel con sus catálogos).
      cy.intercept('GET', '**/api/administracion/usuarios').as('usuarios')
      cy.intercept('GET', '**/api/administracion/usuarios/areas').as('areas')
      cy.intercept('GET', '**/api/administracion/usuarios/regiones').as('regiones')
      cy.visit('/login')
      cy.get('input[name="correo"]').clear().type(correoAdmin)
      cy.get('input[name="contrasena"]').type(contrasenaAdmin, { log: false })
      cy.contains('button', 'Iniciar sesión').click()
      cy.contains('Panel de administración').should('be.visible')

      cy.wait(['@usuarios', '@areas', '@regiones']).then(([usuarios, areas, regiones]) => {
        for (const peticion of [usuarios, areas, regiones]) {
          expect(peticion.response.statusCode, 'Catálogo disponible').to.equal(200)
        }
        const inspector = usuarios.response.body.find((usuario) =>
          usuario.correo.toLowerCase() === INSPECTOR_NUEVO.correo.toLowerCase()
        )
        expect(inspector, 'Cuenta recién registrada en la lista de usuarios').to.exist

        const area = areas.response.body[0]
        expect(area, 'Debe existir un área de trabajo en la BD de pruebas').to.exist

        // 3) Asignación por API: el panel solo maneja una región/área por
        //    select, pero el backend exige las LISTAS idAreas/idRegiones para
        //    el rol Inspector (asignaciones múltiples, ver
        //    ActualizarAsignacionAsync en AuthService).
        cy.window().then((ventana) => {
          const sesion = JSON.parse(ventana.sessionStorage.getItem('sggdis:sesion'))
          cy.request({
            method: 'PUT',
            url: `${URL_API}/api/administracion/usuarios/${inspector.idUsuario}/asignacion`,
            headers: { Authorization: `Bearer ${sesion.token}` },
            body: {
              rol: 'Inspector',
              idAreas: [area.idArea],
              idRegiones: [area.idRegion],
            },
          }).its('status').should('eq', 204)
        })
      })

      // 4) El Administrador cierra sesión y se vuelve explícito al login:
      //    con sesión cacheada la restauración puede dejar al navegador en
      //    otra ruta y el siguiente paso escribiría en la pantalla equivocada.
      cy.intercept('POST', '**/api/auth/logout').as('salidaAdministrador')
      cy.get('.panel-admin__logout').click()
      cy.wait('@salidaAdministrador').its('response.statusCode').should('eq', 204)
      cy.visit('/login')
      cy.get('input[name="correo"]').should('be.visible')

      // 5) El Inspector ya activado inicia sesión y llega a su pantalla.
      cy.get('input[name="correo"]').type(INSPECTOR_NUEVO.correo)
      cy.get('input[name="contrasena"]').type(INSPECTOR_NUEVO.contrasena, { log: false })
      cy.contains('button', 'Iniciar sesión').click()
      cy.contains('.inicio__navLink', 'Nueva inspección').should('be.visible')

      cy.window().then((ventana) => {
        const sesion = JSON.parse(ventana.sessionStorage.getItem('sggdis:sesion'))
        expect(sesion.correo.toLowerCase()).to.equal(INSPECTOR_NUEVO.correo.toLowerCase())
        expect(sesion.rol).to.equal('Inspector')
        // Con asignaciones múltiples las áreas vienen en la lista
        // areasAsignadas (ya no en un idArea único).
        expect(sesion.areasAsignadas, 'Áreas asignadas al inspector')
          .to.be.an('array').and.not.be.empty
      })
    })
  })
})
