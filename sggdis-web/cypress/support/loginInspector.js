const CORREO_POR_DEFECTO = 'cypress1@misalud.go.cr'
const CONTRASENA_POR_DEFECTO = 'ClaveSegura123'

export function obtenerCredencialesInspector() {
  return cy
    .env(['INSPECTOR_CORREO', 'INSPECTOR_CONTRASENA'], { log: false })
    .then((configuracion) => ({
      correo: configuracion.INSPECTOR_CORREO || CORREO_POR_DEFECTO,
      contrasena: configuracion.INSPECTOR_CONTRASENA || CONTRASENA_POR_DEFECTO,
    }))
}

function escribirCredencialesYEntrar() {
  cy.visit('/login')

  cy.env(['INSPECTOR_CORREO', 'INSPECTOR_CONTRASENA']).then(
    ({ INSPECTOR_CORREO, INSPECTOR_CONTRASENA }) => {
      cy.get('input[name="correo"]').type(
        INSPECTOR_CORREO || CORREO_POR_DEFECTO
      )

      cy.get('input[name="contrasena"]').type(
        INSPECTOR_CONTRASENA || CONTRASENA_POR_DEFECTO,
        { log: false }
      )
    },
  )

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

export function iniciarSesionComoInspector() {
  escribirCredencialesYEntrar()
  cy.contains('.inicio__navLink', 'Nueva inspección').should('be.visible')
}