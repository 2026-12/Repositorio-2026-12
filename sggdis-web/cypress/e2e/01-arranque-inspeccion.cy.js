// Sprint 1 — Flujo 1: Arranque de inspección (HU-005A).
// Chequea que "Comenzar inspección" quede deshabilitado sin datos, y que se
// pueda crear una inspección llenando fecha, consecutivo, nombre y tipo.
import { iniciarSesionComoInspector } from '../support/loginInspector'

describe('Arranque de inspección', () => {
  beforeEach(() => {
    iniciarSesionComoInspector()
    cy.get('.inicio__navLink').contains('Nueva inspección').click()
  })

  it('mantiene deshabilitado "Comenzar inspección" mientras falten datos', () => {
    cy.contains('button', 'Comenzar inspección').should('be.disabled')
  })

  it('permite crear una inspección completando todos los campos obligatorios', () => {
    // Número de consecutivo distinto en cada corrida: CONSECUTIVO es único
    // en la base de datos, así que un número fijo fallaría (409) al volver
    // a correr la prueba.
    const numeroConsecutivo = String(Math.floor(1000 + Math.random() * 9000))

    // Fecha y hora se auto-completan solas (el campo quedó de solo lectura),
    // no hace falta interactuar con #fecha ni con #hora.

    // Región y área ya vienen precargadas y deshabilitadas: el Inspector de
    // prueba ya tiene un área asignada por el Administrador.
    cy.get('#region').should('be.disabled')
    cy.get('#area').should('be.disabled')

    // N° consecutivo (el año ya no es editable, queda fijo)
    cy.get('#numero-consecutivo').type(numeroConsecutivo)

    // Nombre del establecimiento
    cy.get('#nombre').type('Soda Cypress Test')

    // Tipo de establecimiento: se elige el primero de la lista
    cy.get('.tipo-card').first().click()

    cy.contains('button', 'Comenzar inspección')
      .should('not.be.disabled')
      .click()

    // Si la inspección se creó, debe mostrar ya el formulario de la Sección A
    cy.contains('SECCIÓN A').should('be.visible')
  })
})
