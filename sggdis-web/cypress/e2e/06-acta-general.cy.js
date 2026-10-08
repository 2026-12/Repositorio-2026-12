// Acta de Inspección General: recorrido completo en UNA sola sesión. Se inicia
// sesión una vez, se llenan los seis apartados (obligatorios y opcionales) sin
// probar errores ni validaciones, se revisa la vista previa, se envía el acta
// y la prueba termina en la confirmación "ACTA ENVIADA".
// Es contra la API y la BD reales (el backend debe estar corriendo).
//
// Las pruebas detalladas (validaciones, indicador, salir, persistencia, etc.)
// están aparte en cypress/e2e-detalladas/06-acta-general-validaciones.cy.js y
// no se ejecutan junto con el resto.
import { iniciarSesionYEntrarAlMenu } from '../support/loginInspector'

const CLAVE_ACTA_ACTIVA = 'sggdis:acta-general-activa'

// Confirma en qué apartado está la pantalla ("Apartado I" no debe darse por
// bueno estando en el II).
function verApartado(numero) {
  cy.contains('.acta-apartado__etiqueta', new RegExp(`^Apartado ${numero}$`)).should('be.visible')
}

// Espera la respuesta real del backend al guardar un apartado.
function esperarGuardado(alias, apartado) {
  cy.wait(alias).then(({ response }) => {
    expect(response?.statusCode, `guardado de ${apartado}`).to.be.oneOf([200, 204])
  })
}

// Captura de evidencia, con una pausa breve para que el apartado termine de pintarse.
function evidencia(nombre) {
  cy.wait(500)
  cy.screenshot(`acta-general/${nombre}`, { capture: 'viewport', overwrite: true })
}

// Abre un selector múltiple y marca las opciones indicadas.
function marcarOpciones(dataCampo, etiquetas) {
  cy.get(`[data-campo="${dataCampo}"]`).click()
  etiquetas.forEach((etiqueta) => {
    cy.get('.acta-multiselect__lista').contains('label', etiqueta).click()
  })
  cy.get('body').type('{esc}')
  cy.get('.acta-multiselect__lista').should('not.exist')
}

// Botón de avance del pie: "Siguiente →" en los apartados I a V y "Finalizar"
// en el último (lleva a la vista previa).
function irSiguiente() {
  cy.contains('.acta-pie button', /Siguiente|Finalizar/).click()
}

describe('Acta General: recorrido completo hasta el envío', () => {
  it('llena todos los apartados, revisa la vista previa y envía el acta', () => {
    cy.viewport(1366, 800)

    // Una sola sesión: login, salir del panel de administración al menú
    // principal y entrar a Acta General con un acta nueva.
    iniciarSesionYEntrarAlMenu()
    cy.window().then((ventana) => ventana.localStorage.removeItem(CLAVE_ACTA_ACTIVA))
    cy.contains('.inicio__navLink', 'Acta General').click()
    cy.contains('h1', 'Acta de Inspección General').should('be.visible')

    cy.intercept('PUT', '**/api/actas-generales/*/info-general').as('guardarInfoGeneral')
    cy.intercept('PUT', '**/api/actas-generales/*/responsable').as('guardarResponsable')
    cy.intercept('PUT', '**/api/actas-generales/*/motivo').as('guardarMotivo')
    cy.intercept('PUT', '**/api/actas-generales/*/hallazgos').as('guardarHallazgos')
    cy.intercept('PUT', '**/api/actas-generales/*/acciones').as('guardarAcciones')
    cy.intercept('PUT', '**/api/actas-generales/*/cierre').as('guardarCierre')
    cy.intercept('PUT', '**/api/actas-generales/*/envio').as('enviarActa')

    // ---------- Apartado I: Información General ----------
    verApartado('I')
    // Primer apartado: indica "Paso 1 de 6" y no ofrece "Anterior".
    cy.contains('.acta-pie', 'Paso 1 de 6').should('be.visible')
    cy.contains('.acta-pie button', 'Anterior').should('not.exist')
    cy.get('.acta-tab').should('have.length', 6)
    cy.get('#numeroExpediente').type('EXP-2026-0892')
    cy.get('#numeroDenuncia').type('DEN-2026-0104')
    cy.get('#nombreComercial').type('Soda Cypress Acta')
    cy.get('#provincia').select('San José')
    cy.get('#canton').select('San José')
    cy.get('#distrito').select('Carmen')
    cy.get('#direccionExacta').type('100 metros norte de la iglesia')
    cy.get('#telefonoContacto').type('25500000')
    cy.get('#correoNotificaciones').type('cypress@correo.com')
    cy.get('[data-campo="autorizaIngreso"]').contains('button', 'Sí').click()
    cy.get('[data-campo="autorizaFotos"]').contains('button', 'Sí').click()
    evidencia('01-apartado-I')
    irSiguiente()
    esperarGuardado('@guardarInfoGeneral', 'Apartado I (Info General)')

    // ---------- Apartado II: Responsable ----------
    verApartado('II')
    // Desde el segundo apartado ya aparece "Anterior".
    cy.contains('.acta-pie', 'Paso 2 de 6').should('be.visible')
    cy.contains('.acta-pie button', 'Anterior').should('be.visible')
    cy.get('#nombreResponsable').type('María Fernández Solano')
    // Cargo y motivo son de selección única: se elige una sola opción.
    marcarOpciones('cargoResponsable', ['Otro'])
    cy.get('#cargoResponsableOtro').type('Administradora del local')
    cy.get('#numeroIdentificacionResponsable').type('123456789')
    evidencia('02-apartado-II')
    irSiguiente()
    esperarGuardado('@guardarResponsable', 'Apartado II (Responsable)')

    // ---------- Apartado III: Motivo ----------
    verApartado('III')
    marcarOpciones('motivoInspeccion', ['Otro'])
    cy.get('#motivoInspeccionOtro').type('Verificación de condiciones sanitarias')
    evidencia('03-apartado-III')
    irSiguiente()
    esperarGuardado('@guardarMotivo', 'Apartado III (Motivo)')

    // ---------- Apartado IV: Hallazgos ----------
    verApartado('IV')
    // Las guías vienen de la API: se marcan las dos primeras (o la única que haya).
    cy.get('[data-campo="idsGuias"] .acta-opcion').first().click()
    cy.get('[data-campo="idsGuias"] .acta-opcion').then(($guias) => {
      if ($guias.length > 1) cy.wrap($guias.eq(1)).click()
    })
    cy.get('#hallazgos').type('Se observan condiciones sanitarias aceptables en el local.')
    evidencia('04-apartado-IV')
    irSiguiente()
    esperarGuardado('@guardarHallazgos', 'Apartado IV (Hallazgos)')

    // ---------- Apartado V: Acciones a seguir ----------
    verApartado('V')
    marcarOpciones('acciones', ['Cierre de caso', 'Reprogramación', 'Otro'])
    cy.get('#motivoReprogramacion').type('Falta documentación pendiente del establecimiento.')
    cy.get('#accionOtro').type('Seguimiento en 15 días')
    evidencia('05-apartado-V')
    irSiguiente()
    esperarGuardado('@guardarAcciones', 'Apartado V (Acciones)')

    // ---------- Apartado VI: Cierre y Firmas (dos personas) ----------
    verApartado('VI')
    // Último apartado: "Paso 6 de 6" y el botón de avance pasa a "Finalizar".
    cy.contains('.acta-pie', 'Paso 6 de 6').should('be.visible')
    cy.contains('.acta-pie button', 'Finalizar').should('be.visible')
    cy.contains('button', 'Agregar persona').click()
    cy.get('[id$="-nombreCompleto"]').eq(0).type('Juan Pérez Mora')
    cy.get('[id$="-cargoInstitucion"]').eq(0).type('Inspector')
    cy.get('[id$="-numeroIdentificacion"]').eq(0).type('111111111')
    cy.get('[id$="-firma"]').eq(0).type('J. Pérez')

    cy.contains('button', 'Agregar persona').click()
    cy.get('[id$="-nombreCompleto"]').eq(1).type('Ana Rojas Vargas')
    cy.get('[id$="-cargoInstitucion"]').eq(1).type('Propietaria')
    cy.get('[id$="-numeroIdentificacion"]').eq(1).type('222222222')
    cy.get('[id$="-firma"]').eq(1).type('A. Rojas')
    evidencia('06-apartado-VI')

    irSiguiente()
    esperarGuardado('@guardarCierre', 'Apartado VI (Cierre y Firmas)')

    // ---------- Vista previa ----------
    cy.contains('h2', 'Vista previa').should('be.visible')
    cy.get('.acta-vista-previa').within(() => {
      cy.contains('Acta de Inspección General').should('be.visible')
      cy.contains('EXP-2026-0892').should('be.visible')
      cy.contains('DEN-2026-0104').should('be.visible')
      cy.contains('Soda Cypress Acta').should('be.visible')
      cy.contains('25500000').should('be.visible')
      cy.contains('cypress@correo.com').should('be.visible')
      cy.contains('María Fernández Solano').should('be.visible')
      cy.contains('Otro: Administradora del local').should('be.visible')
      cy.contains('Otro: Verificación de condiciones sanitarias').should('be.visible')
      cy.contains('Se observan condiciones sanitarias aceptables en el local.').should('be.visible')
      cy.contains('Falta documentación pendiente del establecimiento.').should('be.visible')
      cy.contains('Juan Pérez Mora').should('be.visible')
      cy.contains('Ana Rojas Vargas').should('be.visible')
    })

    cy.get('.acta-tab--completa').should('have.length', 6)
    cy.get('.acta-vista-previa').scrollIntoView()
    evidencia('07-vista-previa')

    // ---------- Envío del acta ----------
    // "Guardar y enviar acta" manda los seis apartados juntos; el backend los
    // guarda y marca el acta como FINALIZADA (PUT real, sin simular la respuesta).
    cy.contains('.acta-pie button', 'Guardar y enviar acta').should('be.visible').click()

    cy.wait('@enviarActa', { timeout: 20000 }).then(({ response }) => {
      expect(response?.statusCode, 'envío del acta').to.be.oneOf([200, 204])
    })

    // Confirmación de que el acta se cerró correctamente.
    cy.get('.acta-envio-exitoso', { timeout: 10000 }).should('be.visible').within(() => {
      cy.contains('ACTA ENVIADA').should('be.visible')
      cy.contains('h2', /^El acta .+ se guardó correctamente$/).should('be.visible')
      cy.contains('Toda la información del acta quedó registrada en el sistema').should('be.visible')
      cy.contains('el acta quedó finalizada').should('be.visible')
    })

    // La vista previa desaparece y ya no se puede seguir editando ni reenviar.
    cy.get('.acta-vista-previa').should('not.exist')
    cy.contains('.acta-pie button', 'Guardar y enviar acta').should('not.exist')
    cy.contains('.acta-pie button', /Siguiente|Finalizar|Anterior/).should('not.exist')
    cy.contains('.acta-pie', 'Acta enviada').should('be.visible')
    evidencia('08-acta-enviada')

    // Salir: "Volver al menú" regresa al menú (inicio, o el panel si es Administrador).
    cy.contains('.acta-pie button', 'Volver al menú').should('be.visible').click()
    cy.location('pathname').should('match', /^\/(inicio|admin)$/)
  })
})
