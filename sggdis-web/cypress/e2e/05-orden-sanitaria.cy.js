import { iniciarSesionComoInspectorConSesion } from '../support/loginInspector'

function entrarOrdenSanitaria() {
  iniciarSesionComoInspectorConSesion()
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

  // Ubicación

  it('exige completar la ubicación antes de generar la vista previa', () => {
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

  // Validación final

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

    cy.contains('Vista previa')
      .should('not.exist')
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

  // Vista previa y emisión

  it('permite completar, visualizar y emitir una Orden Sanitaria', () => {

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

    // Se selecciona una ubicación real para completar el flujo.

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

    // Se genera la vista previa con todos los campos completos.

    cy.contains(
      'button',
      'Vista previa'
    ).click()

    cy.contains(
      'Revise cuidadosamente la información de la Orden Sanitaria antes de emitirla.'
    ).should('be.visible')

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