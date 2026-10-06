const CORREO_POR_DEFECTO = 'cypress1@misalud.go.cr'
const CONTRASENA_POR_DEFECTO = 'ClaveSegura123'

function escribirCredencialesYEntrarConDatos({ correo, contrasena }) {
  cy.visit('/login')

  cy.get('input[name="correo"]').type(correo)
  cy.get('input[name="contrasena"]').type(contrasena, { log: false })

  cy.contains('button', 'Iniciar sesión').click()

  cy.window({ timeout: 10000 }).should((ventana) => {
    const mensajeError = ventana.document
      .querySelector('.login-error')
      ?.textContent
      ?.trim()

    if (mensajeError) {
      throw new Error(
        `No se pudo iniciar sesión con la cuenta de pruebas: "${mensajeError}". ` +
          'Revise cypress.env.json, que el backend esté encendido y que la cuenta exista en la BD.',
      )
    }

    expect(ventana.location.pathname, 'ruta tras iniciar sesión')
      .to.match(/^\/(inicio|admin)$/)
  })
}

function escribirCredencialesYEntrar() {
  cy.env(['INSPECTOR_CORREO', 'INSPECTOR_CONTRASENA']).then(
    ({ INSPECTOR_CORREO, INSPECTOR_CONTRASENA }) => {
      escribirCredencialesYEntrarConDatos({
        correo: INSPECTOR_CORREO || CORREO_POR_DEFECTO,
        contrasena: INSPECTOR_CONTRASENA || CONTRASENA_POR_DEFECTO,
      })
    },
  )
}

export function obtenerCredencialesInspector() {
  return cy
    .env(['INSPECTOR_CORREO', 'INSPECTOR_CONTRASENA'], { log: false })
    .then((configuracion) => ({
      correo: configuracion.INSPECTOR_CORREO || CORREO_POR_DEFECTO,
      contrasena: configuracion.INSPECTOR_CONTRASENA || CONTRASENA_POR_DEFECTO,
    }))
}

export function iniciarSesionYEntrarAlMenu() {
  escribirCredencialesYEntrar()

  cy.location('pathname').should('match', /^\/(inicio|admin)$/)

  cy.location('pathname').then((ruta) => {
    if (ruta === '/admin') {
      cy.contains('button', 'Menú principal').click()
    }
  })

  cy.location('pathname').should('eq', '/inicio')
  cy.contains('.inicio__navLink', 'Acta General').should('be.visible')
}

// Versión con sesión cacheada: el login real solo corre la primera vez y en
// los siguientes tests Cypress restaura el sessionStorage (sggdis:sesion) y
// la cookie de refresh, sin pasar de nuevo por la pantalla de login.
export function iniciarSesionComoInspectorConSesion() {
  obtenerCredencialesInspector().then((credenciales) => {
    cy.session(
      ['inspector', credenciales.correo],
      () => escribirCredencialesYEntrarConDatos(credenciales),
      { cacheAcrossSpecs: true },
    )
  })

  cy.visit('/inicio')
  cy.contains('.inicio__navLink', 'Nueva inspección').should('be.visible')
}

export function iniciarSesionComoInspector() {
  escribirCredencialesYEntrar()
  cy.contains('.inicio__navLink', 'Nueva inspección').should('be.visible')
}