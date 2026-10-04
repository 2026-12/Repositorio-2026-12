// Sprint 1 — Flujo 5: Registro de cuenta, asignación de rol por el
// Administrador, login del Inspector ya activado y arranque de una
// inspección de alimentos.
//
// Prerequisito: la cuenta temporal de Administrador debe existir en la BD
// (ver DataBase/CrearAdministradorTemporal.sql): 123@misalud.go.cr / 123.
//
// Dividido en varios it() que se continúan entre sí (comparten el correo
// creado en el primer paso). testIsolation se desactiva porque la sesión
// vive en sessionStorage y, si no, Cypress la borraría antes de cada it().
describe('Registro, asignación de rol, login e inspección del inspector', { testIsolation: false }, () => {
  const sufijo = Date.now()
  const correoNuevo = `inspector.cypress.${sufijo}@misalud.go.cr`
  const contrasenaNueva = 'ClaveSegura123'

  function seleccionarPrimeraOpcion(selector) {
    cy.get(selector)
      .find('option')
      .eq(1)
      .invoke('val')
      .then((valor) => {
        cy.get(selector).select(valor)
      })
  }

  // Click al primer "Cumple" sin marcar, y se repite hasta que no quede
  // ninguno (ver nota igual en 02-diligenciamiento-formulario.cy.js).
  function responderTodosCumple() {
    cy.get('body').then(($body) => {
      if ($body.find('.item .opcion--cumple').not('.opcion--activa').length === 0) return

      cy.get('.item .opcion--cumple').not('.opcion--activa').first().click()
      responderTodosCumple()
    })
  }

  // Responde todo y avanza, repitiendo hasta llegar al cierre (ver nota en 04-cierre-inspeccion.cy.js).
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

  it('1) un usuario nuevo se registra desde la pantalla pública de login', () => {
    cy.visit('/login')
    cy.contains('button', 'Crear una cuenta').click()

    cy.get('input[name="nombre"]').type('Inspectora')
    cy.get('input[name="primerApellido"]').type('Cypress')
    cy.get('input[name="segundoApellido"]').type('Prueba')
    cy.get('input[name="identificacion"]').type(`CY${sufijo}`)
    cy.get('input[name="correo"]').type(correoNuevo)
    cy.get('input[name="contrasena"]').type(contrasenaNueva)
    cy.contains('button', 'Crear cuenta').click()

    cy.get('[role="status"]').should('be.visible')
  })

  it('2) mientras no tenga rol asignado, el login debe rechazarse', () => {
    cy.get('input[name="contrasena"]').type(contrasenaNueva)
    cy.contains('button', 'Iniciar sesión').click()
    cy.contains('Debe esperar a que el Administrador complete la asignación.').should('be.visible')
  })

  it('3) el Administrador inicia sesión y le asigna rol, región y área', () => {
    cy.get('input[name="correo"]').clear().type('123@misalud.go.cr')
    cy.get('input[name="contrasena"]').clear().type('123')
    cy.contains('button', 'Iniciar sesión').click()
    cy.contains('Panel de administración').should('be.visible')

    cy.contains('tr', correoNuevo).within(() => {
      cy.get(`select[aria-label="Rol de ${correoNuevo}"]`).select('Inspector')
      seleccionarPrimeraOpcion(`select[aria-label="Región de ${correoNuevo}"]`)
      seleccionarPrimeraOpcion(`select[aria-label="Área de ${correoNuevo}"]`)
      cy.contains('button', 'Guardar').click()
    })

    cy.contains(`Asignaciones de ${correoNuevo} actualizadas.`).should('be.visible')

    // El Administrador cierra sesión para que el Inspector pueda entrar.
    cy.get('.panel-admin__logout').click()
  })

  it('4) el Inspector ya activado inicia sesión y llega a la pantalla principal', () => {
    cy.get('input[name="correo"]').type(correoNuevo)
    cy.get('input[name="contrasena"]').type(contrasenaNueva)
    cy.contains('button', 'Iniciar sesión').click()
    cy.contains('.inicio__navLink', 'Nueva inspección').should('be.visible')
  })

  it('5) el Inspector arranca una inspección de alimentos', () => {
    const numeroConsecutivo = String(Math.floor(1000 + Math.random() * 9000))

    cy.get('.inicio__navLink').contains('Nueva inspección').click()
    // Fecha y hora se auto-completan solas (campo de solo lectura). Región y
    // área también vienen precargadas y deshabilitadas: el Inspector ya
    // tiene un área asignada por el Administrador (ver areaAsignada en
    // SeleccionEstablecimiento.jsx).
    cy.get('#region').should('be.disabled')
    cy.get('#area').should('be.disabled')
    cy.get('#numero-consecutivo').type(numeroConsecutivo)
    cy.get('#nombre').type('Soda Cypress Flujo Completo')
    cy.get('.tipo-card').first().click()

    cy.contains('button', 'Comenzar inspección')
      .should('not.be.disabled')
      .click()

    cy.contains('SECCIÓN A').should('be.visible')
  })

  it('6) el Inspector completa todas las secciones y llega a la vista previa del cierre', () => {
    avanzarHastaCierre(15) // tope de 15 pasos (secciones + subsecciones) para evitar un bucle infinito

    cy.contains('Dictamen y cierre').should('be.visible')
    cy.get('#id-representante').type('987654321')
    cy.contains('button', 'Vista previa →').click()

    cy.contains('VISTA PREVIA').should('be.visible')
    cy.contains('Confirme los datos antes de enviar').should('be.visible')
  })
})
