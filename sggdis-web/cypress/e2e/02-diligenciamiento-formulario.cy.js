// Sprint 1 — Flujo 2: Diligenciamiento del formulario de inspección (Sección A).
// Verifica que se puedan responder ítems (Cumple/No cumple/N/A) y que el
// sistema bloquee el avance mientras haya ítems obligatorios sin responder.

// Hace clic en el primer botón "Cumple" que todavía no esté marcado, y se
// repite hasta que no quede ninguno. A propósito NO usa cy.get(...).each()
// sobre una lista ya capturada: cada clic dispara un re-render de React
// (aparece el bloque "Puntos otorgados"), lo que puede dejar desconectadas
// ("detached") las referencias de los ítems capturados antes de empezar.
// Volviendo a consultar el DOM en cada paso se evita ese problema.
function responderTodosCumple() {
  cy.get('body').then(($body) => {
    const pendiente = $body.find('.item .opcion--cumple').not('.opcion--activa').first()

    if (pendiente.length === 0) return

    cy.wrap(pendiente).click()
    responderTodosCumple()
  })
}

describe('Diligenciamiento del formulario de inspección', () => {
  beforeEach(() => {
    // Genera un número de consecutivo distinto en cada prueba (y en cada
    // corrida de la suite), porque CONSECUTIVO es único en la base de datos.
    // Con un número fijo, la 2da prueba de este archivo fallaba con 409
    // (ConsecutivoDuplicadoException) al intentar reusar el mismo folio.
    const numeroConsecutivo = String(Math.floor(1000 + Math.random() * 9000))

    cy.visit('/')
    cy.get('.inicio__navLink').contains('Nueva inspección').click()
    cy.get('#fecha').click().type('20/09/2026{enter}')
    cy.get('#numero-consecutivo').type(numeroConsecutivo)
    cy.get('[aria-label="Año del consecutivo"]').clear().type('2026')
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
