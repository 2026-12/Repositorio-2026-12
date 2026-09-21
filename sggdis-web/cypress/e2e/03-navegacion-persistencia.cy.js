// Sprint 1 — Flujo 3: Navegación y persistencia del progreso.
// Verifica que no se pueda saltar de pestaña con la sección actual
// incompleta, y que el progreso sobreviva a un recargado (localStorage vía
// progresoInspeccionService).
//
// Ya no existe .tabs__item--bloqueado: ahora todas las pestañas son
// clicables, pero si dejás cosas pendientes en la sección actual, el click
// no navega y muestra un aviso.
describe('Navegación y persistencia del progreso', () => {
  beforeEach(() => {
    // Número de consecutivo distinto en cada prueba/corrida (ver nota en 02-diligenciamiento-formulario.cy.js).
    const numeroConsecutivo = String(Math.floor(1000 + Math.random() * 9000))

    cy.visit('/')
    cy.get('.inicio__navLink').contains('Nueva inspección').click()
    // Fecha y hora se auto-completan solas (campo de solo lectura).
    cy.get('#region').select('HN')
    cy.get('#area').select('F')
    cy.get('#numero-consecutivo').type(numeroConsecutivo)
    cy.get('#nombre').type('Soda Cypress Persistencia')
    cy.get('.tipo-card').first().click()
    cy.contains('button', 'Comenzar inspección').click()
    cy.contains('SECCIÓN A').should('be.visible')
  })

  it('impide saltar a otra pestaña si la sección actual quedó incompleta', () => {
    // Responde un ítem (sin completar toda la sección) para "iniciarla".
    cy.get('.item').first().find('.opcion--cumple').click()

    // Intenta saltar a la siguiente pestaña.
    cy.get('.tabs__item').eq(1).click()

    // No debe navegar: se muestra el aviso y se permanece en la Sección A.
    cy.contains('Complete la sección actual antes de continuar.').should('be.visible')
    cy.contains('SECCIÓN A').should('be.visible')
  })

  it('conserva el progreso guardado al recargar la página', () => {
    cy.get('.item').first().find('.opcion--cumple').click()

    cy.reload()

    // Tras recargar, debe seguir mostrando la inspección en curso (no el menú)
    cy.contains('SECCIÓN A').should('be.visible')
    cy.get('.item').first().find('.opcion--cumple').should('have.class', 'opcion--activa')
  })
})
