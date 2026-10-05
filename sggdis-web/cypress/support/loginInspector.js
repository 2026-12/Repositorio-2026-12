// Preparar esta cuenta con 00-preparar-inspector.cy.js antes de las otras pruebas.
export function obtenerCredencialesInspector() {
  return cy.env(['INSPECTOR_CORREO', 'INSPECTOR_CONTRASENA'], { log: false }).then((configuracion) => ({
    correo: configuracion.INSPECTOR_CORREO || 'cypress1@misalud.go.cr',
    contrasena: configuracion.INSPECTOR_CONTRASENA || 'ClaveSegura123',
  }))
}

export function iniciarSesionComoInspector() {
  return obtenerCredencialesInspector().then(({ correo, contrasena }) => {
    cy.visit('/login')
    cy.get('input[name="correo"]').clear().type(correo)
    cy.get('input[name="contrasena"]').type(contrasena, { log: false })
    cy.contains('button', 'Iniciar sesión').click()
    cy.contains('.inicio__navLink', 'Nueva inspección').should('be.visible')
  })
}
