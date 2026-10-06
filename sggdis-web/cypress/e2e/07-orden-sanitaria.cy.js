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

describe('Orden Sanitaria', () => {

  beforeEach(() => {
    entrarOrdenSanitaria()
  })

  // Información general

  it('permite ingresar al módulo de Orden Sanitaria', () => {
    cy.contains('Información General de la Orden Sanitaria')
      .should('be.visible')

    cy.contains('Paso 1 de 5')
      .should('be.visible')
  })

  it('muestra los datos precargados de la inspección relacionada', () => {
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
  })

  it('muestra vacío el consecutivo de Orden Sanitaria antes de emitir', () => {
    cy.get('#numeroConsecutivo')
      .should('have.value', '')

    cy.get('#numeroConsecutivo')
      .should('have.attr', 'readonly')
  })

  it('muestra correctamente las etiquetas de consecutivo y referencia', () => {
    cy.contains(
      'Número de consecutivo de Orden Sanitaria'
    ).should('be.visible')

    cy.contains(
      'Número de expediente / número de consecutivo / número de denuncia'
    ).should('be.visible')
  })

  it('permite seleccionar la condición de la persona a notificar', () => {
    seleccionarOpcion(
      '#condicion',
      'Propietario'
    )

    cy.get('#condicion')
      .should('contain', 'Propietario')
  })

  it('muestra el campo de otra condición cuando se selecciona Otro', () => {
    seleccionarOpcion(
      '#condicion',
      'Otro'
    )

    cy.get('#otraCondicion')
      .should('be.visible')
      .type('Administrador')

    cy.get('#otraCondicion')
      .should(
        'have.value',
        'Administrador'
      )
  })

  // Navegación

  it('permite navegar por las cinco secciones antes de intentar validar', () => {
    seleccionarOpcion(
      '#condicion',
      'Propietario'
    )

    irSiguiente()

    cy.contains('Ubicación')
      .should('be.visible')

    cy.contains('Paso 2 de 5')
      .should('be.visible')

    irSiguiente()

    cy.contains('Notificación')
      .should('be.visible')

    cy.contains('Paso 3 de 5')
      .should('be.visible')

    irSiguiente()

    cy.contains('Ordenanzas')
      .should('be.visible')

    cy.contains('Paso 4 de 5')
      .should('be.visible')

    irSiguiente()

    cy.contains('Datos del responsable')
      .should('be.visible')

    cy.contains('Paso 5 de 5')
      .should('be.visible')
  })

  // Notificación

  it('carga automáticamente la fecha de emisión con la fecha actual', () => {
    seleccionarOpcion(
      '#condicion',
      'Propietario'
    )

    irSiguiente()
    irSiguiente()

    const hoy = new Date()
    const offset =
      hoy.getTimezoneOffset() * 60000

    const fechaActual =
      new Date(hoy.getTime() - offset)
        .toISOString()
        .slice(0, 10)

    cy.get('#fechaEmision')
      .should(
        'have.value',
        fechaActual
      )
  })

  it('mantiene vacía la fecha de notificación hasta que el usuario la ingrese', () => {
    seleccionarOpcion(
      '#condicion',
      'Propietario'
    )

    irSiguiente()
    irSiguiente()

    cy.get('#fechaNotificacion')
      .should('have.value', '')
  })

  it('no permite seleccionar una fecha de notificación anterior a la fecha mínima', () => {
    seleccionarOpcion(
      '#condicion',
      'Propietario'
    )

    irSiguiente()
    irSiguiente()

    cy.get('#fechaNotificacion')
      .invoke('attr', 'min')
      .then((fechaMinima) => {

        const fecha =
          new Date(
            `${fechaMinima}T12:00:00`
          )

        fecha.setDate(
          fecha.getDate() - 1
        )

        const fechaAnterior =
          fecha
            .toISOString()
            .slice(0, 10)

        cy.get('#fechaNotificacion')
          .should(
            'have.attr',
            'min',
            fechaMinima
          )

        cy.get('#fechaNotificacion')
          .type(
            fechaAnterior,
            { force: true }
          )

        cy.get('#fechaNotificacion')
          .should(
            'not.have.value',
            fechaAnterior
          )
      })
  })

  // Ordenanzas

  it('muestra una ordenanza inicial', () => {
    seleccionarOpcion(
      '#condicion',
      'Propietario'
    )

    irSiguiente()
    irSiguiente()
    irSiguiente()

    cy.contains('Ordenanza 1')
      .should('be.visible')

    cy.get('#ordenanza-0')
      .should('be.visible')

    cy.get('#fundamento-0')
      .should('be.visible')

    cy.get('#tipoPlazo-0')
      .should(
        'have.value',
        'DIAS'
      )
  })

  it('permite completar una ordenanza con plazo en días', () => {
    seleccionarOpcion(
      '#condicion',
      'Propietario'
    )

    irSiguiente()
    irSiguiente()
    irSiguiente()

    cy.get('#ordenanza-0')
      .type(
        'Corregir las condiciones sanitarias señaladas.'
      )

    cy.get('#fundamento-0')
      .type(
        'Ley General de Salud.'
      )

    cy.get('#tipoPlazo-0')
      .select('DIAS')

    cy.get('#cantidadPlazo-0')
      .type('5')

    cy.get('#ordenanza-0')
      .should(
        'have.value',
        'Corregir las condiciones sanitarias señaladas.'
      )

    cy.get('#fundamento-0')
      .should(
        'have.value',
        'Ley General de Salud.'
      )

    cy.get('#cantidadPlazo-0')
      .should(
        'have.value',
        '5'
      )
  })

  it('permite seleccionar plazo en horas', () => {
    seleccionarOpcion(
      '#condicion',
      'Propietario'
    )

    irSiguiente()
    irSiguiente()
    irSiguiente()

    cy.get('#tipoPlazo-0')
      .select('HORAS')

    cy.get('#cantidadPlazo-0')
      .should('be.visible')
      .type('24')

    cy.contains(
      'Cantidad de horas'
    ).should('be.visible')

    cy.get('#cantidadPlazo-0')
      .should(
        'have.value',
        '24'
      )
  })

  it('permite seleccionar una fecha específica como plazo', () => {
    seleccionarOpcion(
      '#condicion',
      'Propietario'
    )

    irSiguiente()
    irSiguiente()

    cy.get('#fechaNotificacion')
      .invoke('attr', 'min')
      .then((fechaMinima) => {

        cy.get('#fechaNotificacion')
          .type(
            fechaMinima,
            { force: true }
          )
      })

    irSiguiente()

    cy.get('#tipoPlazo-0')
      .select('FECHA')

    cy.get('#fechaCumplimiento-0')
      .should('be.visible')

    cy.get('#horaCumplimiento-0')
      .should('be.visible')

    cy.contains(
      'Hora (formato 24 horas)'
    ).should('be.visible')
  })

  it('permite agregar y eliminar ordenanzas', () => {
    seleccionarOpcion(
      '#condicion',
      'Propietario'
    )

    irSiguiente()
    irSiguiente()
    irSiguiente()

    cy.contains(
      'button',
      '+ Agregar ordenanza'
    ).click()

    cy.contains('Ordenanza 2')
      .should('be.visible')

    cy.get('#ordenanza-1')
      .should('be.visible')

    cy.get('.orden-ordenanza')
      .should(
        'have.length',
        2
      )

    cy.get('.orden-ordenanza')
      .last()
      .contains(
        'button',
        'Eliminar'
      )
      .click()

    cy.get('.orden-ordenanza')
      .should(
        'have.length',
        1
      )

    cy.contains('Ordenanza 2')
      .should('not.exist')
  })

  // Responsable

  it('permite completar los datos del responsable', () => {
    seleccionarOpcion(
      '#condicion',
      'Propietario'
    )

    irSiguiente()
    irSiguiente()
    irSiguiente()
    irSiguiente()

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
        'ARS San José'
      )

    cy.get('#firma')
      .type(
        'Inspector Cypress'
      )

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
        'ARS San José'
      )
  })

  // Persistencia

  it('conserva el progreso de la Orden Sanitaria al recargar la página', () => {
    seleccionarOpcion(
      '#condicion',
      'Propietario'
    )

    irSiguiente()

    cy.get('#direccionExacta')
      .type(
        '100 metros norte de la iglesia.'
      )

    cy.reload()

    cy.contains('Ubicación')
      .should('be.visible')

    cy.get('#direccionExacta')
      .should(
        'have.value',
        '100 metros norte de la iglesia.'
      )
  })
})