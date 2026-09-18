// Sprint 1 — Flujo 1: Arranque de inspección (HU-005A).
// Verifica que el botón "Comenzar inspección" permanezca deshabilitado
// mientras falten datos obligatorios, y que se pueda crear una inspección
// completando fecha, consecutivo, nombre del establecimiento y tipo.
describe('Arranque de inspección', () => {
  beforeEach(() => {
    cy.visit('/')
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

    // Fecha (react-datepicker: se escribe directo en el input y se confirma con Enter)
    cy.get('#fecha').click().type('20/09/2026{enter}')

    // N° consecutivo
    cy.get('#numero-consecutivo').type(numeroConsecutivo)
    cy.get('[aria-label="Año del consecutivo"]').clear().type('2026')

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
