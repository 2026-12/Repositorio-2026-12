import { iniciarSesionComoInspector } from '../support/loginInspector'

function entrarOrdenSanitaria() {
  iniciarSesionComoInspector()
  cy.visit('/orden-sanitaria')

  cy.contains('Información General de la Orden Sanitaria')
    .should('be.visible')
}

function irSiguiente() {
  cy.contains('button', 'Siguiente').click()
}

function seleccionarOpcion(selector, texto) {
  cy.get(selector).click()

  cy.get('.orden-selector__opciones')
    .contains('button', texto)
    .click()
}

function completarOrdenSanitaria() {

  seleccionarOpcion(
    '#condicion',
    'Propietario'
  )

  cy.get('#numeroExpediente')
    .should(
      'have.value',
      'MS-DRRSCS-ARS-SJ-AI-0002-2026'
    )

  cy.get('#nombreCompleto')
    .should(
      'have.value',
      'Juan Carlos Rodríguez Mora'
    )

  cy.get('#identificacion')
    .should(
      'have.value',
      '1-1234-5678'
    )

  cy.get('#nombreEstablecimiento')
    .should(
      'have.value',
      'Restaurante El Buen Sabor'
    )

  irSiguiente()

  // Ubicación

  cy.contains('Ubicación')
    .should('be.visible')

  seleccionarOpcion(
    '#provincia',
    'San José'
  )

  cy.get(
    '#canton',
    { timeout: 10000 }
  )
    .should('not.be.disabled')

  seleccionarOpcion(
    '#canton',
    'San José'
  )

  cy.get(
    '#distrito',
    { timeout: 10000 }
  )
    .should('not.be.disabled')

  seleccionarOpcion(
    '#distrito',
    'Carmen'
  )

  cy.get('#direccionExacta')
    .type(
      '100 metros norte de la iglesia, edificio principal.'
    )

  cy.get('#direccionExacta')
    .should(
      'have.value',
      '100 metros norte de la iglesia, edificio principal.'
    )

  irSiguiente()

  // Notificación

  cy.contains('Notificación')
    .should('be.visible')

  cy.get('#fechaEmision')
    .should(
      'not.have.value',
      ''
    )

  cy.get('#fechaNotificacion')
    .should(
      'have.value',
      ''
    )

  cy.get('#fechaNotificacion')
    .invoke('attr', 'min')
    .then((fechaMinima) => {

      cy.get('#fechaNotificacion')
        .type(
          fechaMinima,
          { force: true }
        )

      cy.get('#fechaNotificacion')
        .should(
          'have.value',
          fechaMinima
        )
    })

  irSiguiente()

  // Ordenanzas

  cy.contains('Ordenanzas')
    .should('be.visible')

  cy.get('#ordenanza-0')
    .type(
      'Corregir las condiciones sanitarias señaladas durante la inspección.'
    )

  cy.get('#fundamento-0')
    .type(
      'Ley General de Salud.'
    )

  cy.get('#tipoPlazo-0')
    .select('DIAS')

  cy.get('#cantidadPlazo-0')
    .type('5')

  cy.get('#cantidadPlazo-0')
    .should(
      'have.value',
      '5'
    )

  irSiguiente()

  // Responsable

  cy.contains(
    'Datos del responsable'
  ).should('be.visible')

  cy.get('#responsableNombre')
    .type(
      'Inspector Cypress'
    )

  cy.get('#responsableCargo')
    .type(
      'Director del Área Rectora de Salud'
    )

  cy.get('#responsableArs')
    .type(
      'Área Rectora de Salud San José'
    )

  cy.get('#firma')
    .type(
      'Inspector Cypress'
    )
}

function abrirVistaPrevia() {
  cy.contains(
    'button',
    'Vista previa'
  ).click()

  cy.contains(
    'Revise cuidadosamente la información de la Orden Sanitaria antes de emitirla.'
  ).should('be.visible')
}

describe('HU-024 - Vista previa de Orden Sanitaria', () => {

  beforeEach(() => {
    entrarOrdenSanitaria()
  })

  // Validación completa

  it('no permite generar la vista previa cuando existen campos obligatorios pendientes', () => {
    seleccionarOpcion(
      '#condicion',
      'Propietario'
    )

    irSiguiente()
    irSiguiente()
    irSiguiente()
    irSiguiente()

    cy.contains(
      'button',
      'Vista previa'
    ).click()

    cy.contains(
      'Existen campos obligatorios pendientes. Revise las secciones marcadas en rojo antes de continuar.'
    ).should('be.visible')
  })

  // Ubicación incompleta

  it('muestra los errores de ubicación cuando existen campos obligatorios pendientes', () => {
    seleccionarOpcion(
      '#condicion',
      'Propietario'
    )

    irSiguiente()
    irSiguiente()
    irSiguiente()
    irSiguiente()

    cy.contains(
      'button',
      'Vista previa'
    ).click()

    cy.contains(
      'Existen campos obligatorios pendientes. Revise las secciones marcadas en rojo antes de continuar.'
    ).should('be.visible')

    cy.contains('Ubicación')
      .should('be.visible')

    cy.contains(
      'Debe seleccionar una provincia.'
    ).should('be.visible')

    cy.contains(
      'Debe seleccionar un cantón.'
    ).should('be.visible')

    cy.contains(
      'Debe seleccionar un distrito.'
    ).should('be.visible')

    cy.contains(
      'Debe indicar la dirección exacta.'
    ).should('be.visible')
  })

  // Generación de la vista previa

  it('genera la vista previa cuando la Orden Sanitaria está completa', () => {
    completarOrdenSanitaria()

    abrirVistaPrevia()

    cy.contains(
      'Revise cuidadosamente la información de la Orden Sanitaria antes de emitirla.'
    ).should('be.visible')
  })

  // Información registrada

  it('muestra exactamente la información registrada en la Orden Sanitaria', () => {
    completarOrdenSanitaria()

    abrirVistaPrevia()

    cy.contains(
      'Restaurante El Buen Sabor'
    ).should('be.visible')

    cy.contains(
      'Juan Carlos Rodríguez Mora'
    ).should('be.visible')

    cy.contains(
      '1-1234-5678'
    ).should('be.visible')

    cy.contains(
      'Propietario'
    ).should('be.visible')

    cy.contains(
      '100 metros norte de la iglesia, edificio principal.'
    ).should('be.visible')

    cy.contains(
      'Corregir las condiciones sanitarias señaladas durante la inspección.'
    ).should('be.visible')

    cy.contains(
      'Ley General de Salud.'
    ).should('be.visible')

    cy.contains(
      '5 días'
    ).should('be.visible')

    cy.contains(
      'Inspector Cypress'
    ).should('be.visible')

    cy.contains(
      'Director del Área Rectora de Salud'
    ).should('be.visible')

    cy.contains(
      'Área Rectora de Salud San José'
    ).should('be.visible')
  })

  // Solo lectura

  it('muestra la vista previa en modo de solo lectura', () => {
    completarOrdenSanitaria()

    abrirVistaPrevia()

    cy.get('.orden-vista-previa')
      .find(
        'input, textarea, select'
      )
      .should(
        'have.length',
        0
      )
  })

  // Regresar y editar

  it('permite regresar al formulario conservando los datos ingresados', () => {
    completarOrdenSanitaria()

    abrirVistaPrevia()

    cy.contains(
      'button',
      'Anterior'
    ).click()

    cy.contains(
      'Datos del responsable'
    ).should('be.visible')

    cy.get('#responsableNombre')
      .should(
        'have.value',
        'Inspector Cypress'
      )

    cy.get('#responsableCargo')
      .should(
        'have.value',
        'Director del Área Rectora de Salud'
      )

    cy.get('#responsableArs')
      .should(
        'have.value',
        'Área Rectora de Salud San José'
      )

    cy.get('#firma')
      .should(
        'have.value',
        'Inspector Cypress'
      )
  })

  // Envío definitivo

  it('muestra la opción de emitir la Orden Sanitaria desde la vista previa', () => {
    completarOrdenSanitaria()

    abrirVistaPrevia()

    cy.contains(
      'button',
      'Emitir Orden Sanitaria'
    ).should('be.visible')
  })

  // Emisión

  it('permite emitir definitivamente la Orden Sanitaria desde la vista previa', () => {
    completarOrdenSanitaria()

    abrirVistaPrevia()

    cy.contains(
      'button',
      'Emitir Orden Sanitaria'
    ).should('be.visible')

    // Se observa el POST real sin simular la respuesta del backend.

    cy.intercept(
      'POST',
      '**/api/ordenes-sanitarias'
    ).as(
      'crearOrdenSanitaria'
    )

    cy.contains(
      'button',
      'Emitir Orden Sanitaria'
    ).click()

    cy.wait(
      '@crearOrdenSanitaria',
      {
        timeout: 20000
      }
    ).then((intercepcion) => {

      expect(
        intercepcion.response.statusCode
      ).to.be.oneOf(
        [200, 201]
      )
    })

    // Se verifica que la emisión haya finalizado correctamente.

    cy.contains(
      'PROCESO FINALIZADO'
    ).should('be.visible')

    cy.contains(
      'Orden Sanitaria enviada exitosamente'
    ).should('be.visible')

    cy.contains(
      'La Orden Sanitaria fue registrada correctamente en el sistema.'
    ).should('be.visible')

    cy.contains(
      'NÚMERO DE CONSECUTIVO'
    ).should('be.visible')

    cy.get(
      '.orden-exito__detalle-valor'
    )
      .should('be.visible')
      .invoke('text')
      .then((texto) => {

        expect(
          texto.trim()
        ).to.match(/^OS-/)
      })

    cy.contains(
      'Orden Sanitaria emitida correctamente'
    ).should('be.visible')
  })
})