// Credenciales de un Inspector ya activado (rol + área asignados por el
// Administrador). Esta cuenta no la crea Cypress: debe existir de antemano
// en la BD de desarrollo (registrarla una vez vía /login y asignarle rol
// "Inspector" + región/área desde el Panel de administración, o correr el
// flujo 05-registro-asignacion-login.cy.js antes).
//
// Se puede sobreescribir con `cypress.env.json` o `--env` sin tocar este
// archivo: CYPRESS_INSPECTOR_CORREO / CYPRESS_INSPECTOR_CONTRASENA.
export const INSPECTOR_PRUEBA = {
  correo: Cypress.env('INSPECTOR_CORREO') || 'cypress1@misalud.go.cr',
  contrasena: Cypress.env('INSPECTOR_CONTRASENA') || 'ClaveSegura123',
}

// Inicia sesión como el Inspector de pruebas y espera a que cargue la
// pantalla principal (confirma que el rol/área ya estaban asignados).
export function iniciarSesionComoInspector() {
  cy.visit('/login')
  cy.get('input[name="correo"]').type(INSPECTOR_PRUEBA.correo)
  cy.get('input[name="contrasena"]').type(INSPECTOR_PRUEBA.contrasena)
  cy.contains('button', 'Iniciar sesión').click()
  cy.contains('.inicio__navLink', 'Nueva inspección').should('be.visible')
}
