// Sprint 1 — Flujo 3: Navegación y persistencia del progreso.
// Verifica que las pestañas todavía no alcanzadas estén bloqueadas, y que
// el progreso sobreviva a un recargado de página (persistencia en
// localStorage vía progresoInspeccionService).
describe('Navegación y persistencia del progreso', () => {
  beforeEach(() => {
    // Número de consecutivo distinto en cada prueba/corrida (ver nota en 02-diligenciamiento-formulario.cy.js).
    const numeroConsecutivo = String(Math.floor(1000 + Math.random() * 9000))

    cy.visit('/')
    cy.get('.inicio__navLink').contains('Nueva inspección').click()
    cy.get('#fecha').click().type('21/09/2026{enter}')
    cy.get('#numero-consecutivo').type(numeroConsecutivo)
    cy.get('[aria-label="Año del consecutivo"]').clear().type('2026')
    cy.get('#nombre').type('Soda Cypress Persistencia')
    cy.get('.tipo-card').first().click()
    cy.contains('button', 'Comenzar inspección').click()
    cy.contains('SECCIÓN A').should('be.visible')
  })

  it('bloquea el acceso a pestañas todavía no alcanzadas', () => {
    cy.get('.tabs__item--bloqueado').should('exist')
    cy.get('.tabs__item--bloqueado').first().should('be.disabled')
  })

  it('conserva el progreso guardado al recargar la página', () => {
    cy.get('.item').first().find('.opcion--cumple').click()

    cy.reload()

    // Tras recargar, debe seguir mostrando la inspección en curso (no el menú)
    cy.contains('SECCIÓN A').should('be.visible')
    cy.get('.item').first().find('.opcion--cumple').should('have.class', 'opcion--activa')
  })
})
