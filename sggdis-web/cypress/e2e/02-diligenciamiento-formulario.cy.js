// Sprint 1 — Flujo 2: Diligenciamiento del formulario de inspección (Sección A).
// Verifica que se puedan responder ítems (Cumple/No cumple/N/A) y que el
// sistema bloquee el avance mientras haya ítems obligatorios sin responder.

// Click al primer "Cumple" sin marcar, y se repite hasta que no quede
// ninguno. No uso .each() sobre una lista ya capturada porque cada click
// re-renderiza (aparece "Puntos otorgados") y las referencias quedan
// "detached". Por eso vuelvo a consultar el DOM en cada vuelta.
function responderTodosCumple() {
  cy.get('body').then(($body) => {
    if ($body.find('.item .opcion--cumple').not('.opcion--activa').length === 0) return

    // Consulta en vivo (no una referencia ya capturada), para que Cypress
    // vuelva a buscar el elemento si React re-renderiza justo antes del clic.
    cy.get('.item .opcion--cumple').not('.opcion--activa').first().click()
    responderTodosCumple()
  })
}

describe('Diligenciamiento del formulario de inspección', () => {
  beforeEach(() => {
    // Consecutivo distinto en cada prueba: es único en la BD, y con uno fijo
    // la 2da prueba de este archivo fallaba con 409 (ConsecutivoDuplicadoException).
    const numeroConsecutivo = String(Math.floor(1000 + Math.random() * 9000))

    cy.visit('/')
    cy.get('.inicio__navLink').contains('Nueva inspección').click()
    // Fecha y hora se auto-completan solas (campo de solo lectura).
    cy.get('#region').select('HN')
    cy.get('#area').select('F')
    cy.get('#numero-consecutivo').type(numeroConsecutivo)
    cy.get('#nombre').type('Soda Cypress Formulario')
    cy.get('.tipo-card').first().click()
    cy.contains('button', 'Comenzar inspección').click()
    cy.contains('SECCIÓN A').should('be.visible')
  })

  it('no permite avanzar si quedan ítems obligatorios sin responder', () => {
    cy.contains('button', 'Siguiente').click()

    // Debe permanecer en la Sección A y resaltar el primer ítem pendiente
    cy.contains('SECCIÓN A').should('be.visible')
    cy.get('.item--pendiente').should('exist')
  })

  it('permite marcar un ítem como Cumple y lo refleja visualmente', () => {
    cy.get('.item').first().find('.opcion--cumple').click()
    cy.get('.item').first().find('.opcion--cumple').should('have.class', 'opcion--activa')
  })

  it('permite responder todos los ítems visibles y avanzar de sección', () => {
    // Responde "Cumple" a todos los ítems visibles de la Sección A
    responderTodosCumple()

    cy.contains('button', 'Siguiente').click()

    // Ya no debería seguir mostrando la Sección A como sección activa
    cy.contains('SECCIÓN A').should('not.exist')
  })
})
