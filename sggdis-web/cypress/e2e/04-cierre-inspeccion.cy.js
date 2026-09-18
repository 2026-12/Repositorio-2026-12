// Sprint 1 — Flujo 4: Cierre de inspección (HU-005I).
// NOTA: este flujo requiere completar TODAS las secciones (y subsecciones,
// como B1/B2/B3 y C1/C2) del tipo de establecimiento elegido antes de
// llegar a la pantalla de cierre. Es el test más frágil de los 4: si falla,
// revisar manualmente el flujo paso a paso antes de asumir que es un bug.

// Hace clic en el primer botón "Cumple" que todavía no esté marcado, y se
// repite hasta que no quede ninguno. A propósito NO usa cy.get(...).each()
// sobre una lista ya capturada: cada clic dispara un re-render de React
// (aparece el bloque "Puntos otorgados"), lo que puede dejar desconectadas
// ("detached") las referencias de los ítems capturados antes de empezar.
// Volviendo a consultar el DOM en cada paso se evita ese problema.
function responderTodosCumple() {
  cy.get('body').then(($body) => {
    if ($body.find('.item .opcion--cumple').not('.opcion--activa').length === 0) return

    // A diferencia de cy.wrap($elementoYaCapturado), esta cadena es una
    // consulta de Cypress de punta a punta: si React vuelve a renderizar
    // justo antes del clic (ej. al aparecer "Puntos otorgados"), Cypress
    // vuelve a buscar el elemento en vivo en cada reintento, en vez de
    // aferrarse a una referencia que ya puede haber quedado obsoleta.
    cy.get('.item .opcion--cumple').not('.opcion--activa').first().click()
    responderTodosCumple()
  })
}

// Responde todos los ítems visibles y avanza, repitiendo hasta llegar a la
// pantalla de cierre (o hasta agotar los intentos, como tope de seguridad
// para no quedar en un bucle infinito si algo no avanza como se espera).
function avanzarHastaCierre(intentosRestantes) {
  if (intentosRestantes <= 0) return

  // Espera (con reintento automático) a que aparezca algo realmente nuevo
  // para hacer: un botón "Cumple" TODAVÍA sin marcar, o ya el resumen de
  // cierre. No basta con esperar ".item" a secas: al cambiar de sección,
  // por un instante pueden seguir en el DOM ítems "viejos" de la sección
  // anterior (ya todos marcados) mientras carga la nueva, y ese chequeo
  // más flojo se confundía pensando que ya no quedaba nada pendiente.
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
    cy.get('#fecha').click().type('22/09/2026{enter}')
    cy.get('#numero-consecutivo').type(numeroConsecutivo)
    cy.get('[aria-label="Año del consecutivo"]').clear().type('2026')
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
