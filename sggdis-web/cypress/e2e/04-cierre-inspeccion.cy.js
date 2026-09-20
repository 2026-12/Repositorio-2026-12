// Sprint 1 — Flujo 4: Cierre de inspección (HU-005I).
// Ojo: hay que completar TODAS las secciones (incluye B1/B2/B3, C1/C2)
// para llegar al cierre. Es el test más frágil de los 4 — si falla, probar
// el flujo a mano antes de asumir que es un bug real.

// Click al primer "Cumple" sin marcar, y se repite hasta que no quede
// ninguno. No uso .each() sobre una lista ya capturada porque cada click
// re-renderiza (aparece "Puntos otorgados") y las referencias quedan
// "detached". Por eso vuelvo a consultar el DOM en cada vuelta.
function responderTodosCumple() {
  cy.get('body').then(($body) => {
    if ($body.find('.item .opcion--cumple').not('.opcion--activa').length === 0) return

    // Esta cadena es una consulta completa de Cypress, no cy.wrap() sobre
    // algo ya capturado: si React re-renderiza justo antes del click,
    // Cypress vuelve a buscar el elemento en vivo en el reintento.
    cy.get('.item .opcion--cumple').not('.opcion--activa').first().click()
    responderTodosCumple()
  })
}

// Responde todo y avanza, repitiendo hasta llegar al cierre (o hasta agotar
// los intentos, como tope para no quedar en loop infinito).
function avanzarHastaCierre(intentosRestantes) {
  if (intentosRestantes <= 0) return

  // Espera a que aparezca algo nuevo: un "Cumple" sin marcar, o el resumen
  // de cierre. No alcanza con esperar ".item" solo — al cambiar de sección
  // quedan un instante ítems viejos ya marcados y ese chequeo se confunde.
  cy.get('.opcion--cumple:not(.opcion--activa), .cierre__resumen', { timeout: 10000 }).should('exist')

  cy.get('body').then(($body) => {
    if ($body.find('.cierre__resumen').length > 0) return

    responderTodosCumple()
    cy.contains('button', 'Siguiente').click()
    avanzarHastaCierre(intentosRestantes - 1)
  })
}

describe('Cierre de inspección', () => {
  beforeEach(() => {
    // Número de consecutivo distinto en cada prueba/corrida (ver nota en 02-diligenciamiento-formulario.cy.js).
    const numeroConsecutivo = String(Math.floor(1000 + Math.random() * 9000))

    cy.visit('/')
    cy.get('.inicio__navLink').contains('Nueva inspección').click()
    // Fecha y hora se auto-completan solas (campo de solo lectura).
    cy.get('#region').select('HN')
    cy.get('#area').select('F')
    cy.get('#numero-consecutivo').type(numeroConsecutivo)
    cy.get('#nombre').type('Soda Cypress Cierre')
    cy.get('.tipo-card').first().click()
    cy.contains('button', 'Comenzar inspección').click()
  })

  it('permite completar todas las secciones y llegar a la pantalla de cierre', () => {
    avanzarHastaCierre(15) // tope de 15 pasos (secciones + subsecciones) para evitar un bucle infinito

    cy.contains('Dictamen y cierre').should('be.visible')
  })

  it('exige nombre e identificación del inspector antes de finalizar', () => {
    avanzarHastaCierre(15)

    cy.contains('button', 'Finalizar inspección').click()
    cy.contains('Complete los siguientes campos obligatorios').should('be.visible')

    cy.get('#nombre-inspector').type('Inspector Cypress')
    cy.get('#id-inspector').type('1-2345-6789')
    cy.get('#id-representante').type('9-8765-4321')

    cy.contains('button', 'Finalizar inspección').click()
    cy.contains('INSPECCIÓN FINALIZADA').should('be.visible')
  })
})
