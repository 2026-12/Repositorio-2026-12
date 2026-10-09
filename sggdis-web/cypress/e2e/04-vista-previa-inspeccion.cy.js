// Vista previa de la inspección de alimentos: llega al dictamen con toda la
// guía respondida (mismo recorrido que 04-cierre-inspeccion.cy.js), abre la
// vista previa y verifica que el documento tenga el mismo formato que la
// vista previa de Orden Sanitaria: caja .orden-vista-previa con encabezado
// azul, secciones con barra de título, sub-tarjetas por sección de la guía y
// Resumen General al final.
// Es contra la API y la BD reales (el backend debe estar corriendo).
import { iniciarSesionComoInspector } from '../support/loginInspector'

// Click al primer "Cumple" sin marcar, y se repite hasta que no quede
// ninguno (mismo helper que 04-cierre-inspeccion.cy.js).
function responderTodosCumple() {
  cy.get('body').then(($body) => {
    if ($body.find('.item .opcion--cumple').not('.opcion--activa').length === 0) return

    cy.get('.item .opcion--cumple').not('.opcion--activa').first().click()
    responderTodosCumple()
  })
}

// Responde todo y avanza hasta llegar al dictamen (tope de intentos para no
// quedar en bucle infinito).
function avanzarHastaCierre(intentosRestantes) {
  if (intentosRestantes <= 0) return

  cy.get('.opcion--cumple:not(.opcion--activa), .cierre__resumen', { timeout: 10000 }).should('exist')

  cy.get('body').then(($body) => {
    if ($body.find('.cierre__resumen').length > 0) return

    responderTodosCumple()
    cy.contains('button', 'Siguiente').click()
    avanzarHastaCierre(intentosRestantes - 1)
  })
}

// Identificación de las partes, obligatoria para poder abrir la vista previa.
function llenarIdentificacionCierre() {
  cy.get('#nombre-inspector').type('Inspector Cypress')
  cy.get('#id-inspector').type('123456789')
  cy.get('#id-representante').type('987654321')
}

// Captura de evidencia, con una pausa breve para que termine de pintarse.
function evidencia(nombre) {
  cy.wait(500)
  cy.screenshot(`vista-previa-inspeccion/${nombre}`, { capture: 'viewport', overwrite: true })
}

describe('Vista previa de la inspección de alimentos', () => {
  beforeEach(() => {
    // Consecutivo distinto en cada corrida (ver nota en 02-diligenciamiento-formulario.cy.js).
    const numeroConsecutivo = String(Math.floor(1000 + Math.random() * 9000))

    iniciarSesionComoInspector()
    cy.get('.inicio__navLink').contains('Nueva inspección').click()
    cy.get('#numero-consecutivo').type(numeroConsecutivo)
    cy.get('#nombre').type('Soda Cypress Vista Previa')
    cy.get('.tipo-card').first().click()
    cy.contains('button', 'Comenzar inspección').click()

    avanzarHastaCierre(15)
    cy.contains('Dictamen y cierre').should('be.visible')
  })

  it('muestra el documento con el formato de la vista previa de Orden Sanitaria', () => {
    llenarIdentificacionCierre()
    cy.contains('button', 'Vista previa').click()

    cy.contains('h2', 'Vista previa', { timeout: 15000 }).should('be.visible')

    // Caja del documento con encabezado azul (mismas clases que Orden Sanitaria).
    cy.get('.orden-vista-previa').should('be.visible')
    cy.get('.orden-vista-previa__encabezado').within(() => {
      cy.contains('Documento de Inspección').should('be.visible')
      cy.contains('Soda Cypress Vista Previa').should('be.visible')
    })

    // Secciones dentro de la misma caja: Información General, una por cada
    // parte de la guía y Resumen General al final.
    cy.contains('.orden-vista-previa__titulo', 'Información General').should('be.visible')
    cy.get('.orden-vista-previa__seccion').should('have.length.greaterThan', 2)
    cy.contains('.orden-vista-previa__titulo', 'Resumen General').should('be.visible')

    // Cada parte de la guía es una sub-tarjeta con su tabla de ítems.
    cy.get('.orden-vista-previa__ordenanza').should('have.length.greaterThan', 0)
    cy.get('.vista-previa__tabla tbody tr').should('have.length.greaterThan', 0)

    // Resumen con puntaje y resultado de la inspección.
    cy.contains('.orden-vista-previa__etiqueta', 'Puntaje total').should('be.visible')
    cy.contains('.orden-vista-previa__etiqueta', 'Resultado').should('be.visible')

    evidencia('01-vista-previa')

    // "Regresar y editar" vuelve al dictamen.
    cy.contains('button', 'Regresar y editar').click()
    cy.contains('Dictamen y cierre').should('be.visible')
  })

  it('confirma y envía la inspección desde la vista previa', () => {
    llenarIdentificacionCierre()
    cy.contains('button', 'Vista previa').click()

    cy.contains('h2', 'Vista previa', { timeout: 15000 }).should('be.visible')
    cy.contains('button', 'Confirmar y enviar').click()

    cy.contains('INSPECCIÓN FINALIZADA', { timeout: 15000 }).should('be.visible')
    evidencia('02-inspeccion-enviada')
  })
})
