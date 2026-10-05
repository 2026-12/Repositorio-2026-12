// Credenciales de la cuenta de pruebas (por defecto, un Inspector ya activado:
// rol + área asignados por el Administrador). Esta cuenta no la crea Cypress:
// debe existir de antemano en la BD de desarrollo (registrarla una vez vía
// /login y asignarle rol "Inspector" + región/área desde el Panel de
// administración, o correr el flujo 05-registro-asignacion-login.cy.js antes).
//
// Se puede sobreescribir sin tocar este archivo, con `cypress.env.json` o
// `--env`: INSPECTOR_CORREO / INSPECTOR_CONTRASENA (o las variables de entorno
// CYPRESS_INSPECTOR_CORREO / CYPRESS_INSPECTOR_CONTRASENA).
//
// Cypress 16 eliminó Cypress.env(): las variables ahora se leen con cy.env(),
// que es asíncrono, así que las credenciales se piden dentro de la prueba y
// no al cargar este archivo.
const CORREO_POR_DEFECTO = 'cypress1@misalud.go.cr'
const CONTRASENA_POR_DEFECTO = 'ClaveSegura123'

// Abre /login y escribe las credenciales de la cuenta de pruebas.
function escribirCredencialesYEntrar() {
  cy.visit('/login')

  cy.env(['INSPECTOR_CORREO', 'INSPECTOR_CONTRASENA']).then(
    ({ INSPECTOR_CORREO, INSPECTOR_CONTRASENA }) => {
      cy.get('input[name="correo"]').type(INSPECTOR_CORREO || CORREO_POR_DEFECTO)
      cy.get('input[name="contrasena"]').type(INSPECTOR_CONTRASENA || CONTRASENA_POR_DEFECTO, {
        log: false,
      })
    },
  )

  cy.contains('button', 'Iniciar sesión').click()

  // Si el login falla, la pantalla se queda en /login con un mensaje rojo
  // (ej. "Correo o contraseña incorrectos."). Se lee ese mensaje para que la
  // prueba falle diciendo la causa real, en vez de un error genérico de ruta.
  cy.window({ timeout: 10000 }).should((ventana) => {
    const mensajeError = ventana.document.querySelector('.login-error')?.textContent?.trim()
    if (mensajeError) {
      throw new Error(
        `No se pudo iniciar sesión con la cuenta de pruebas: "${mensajeError}". ` +
          'Revise cypress.env.json, que el backend esté encendido y que la cuenta exista en la BD.',
      )
    }
    expect(ventana.location.pathname, 'ruta tras iniciar sesión').to.match(/^\/(inicio|admin)$/)
  })
}

// Inicia sesión con la cuenta de pruebas y termina siempre en el menú
// principal (/inicio). Si la cuenta es Administrador, el login cae en el
// Panel de administración (/admin): ahí se pulsa "Menú principal" para salir
// de él, igual que haría una persona. Con un Inspector no hace ese paso.
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

// Inicia sesión como el Inspector de pruebas y espera a que cargue la
// pantalla principal (confirma que el rol/área ya estaban asignados).
export function iniciarSesionComoInspector() {
  escribirCredencialesYEntrar()
  cy.contains('.inicio__navLink', 'Nueva inspección').should('be.visible')
}
