// Acta de Inspección General (HU-004 y sub-HU HU-006 a HU-011): pruebas E2E
// reales contra la API y la BD (el backend debe estar corriendo). Usa el mismo
// Inspector de prueba que el resto de specs (ver support/loginInspector.js).
import { iniciarSesionYEntrarAlMenu } from '../support/loginInspector'

const CLAVE_ACTA_ACTIVA = 'sggdis:acta-general-activa'

// Colores esperados (los lee el navegador ya calculados en rgb).
// Verde de las pestañas: el mismo de la Guía de Inspección (formulario.css).
const VERDE = 'rgb(30, 123, 52)' // #1e7b34
const AZUL_ACERO = 'rgb(22, 70, 135)' // #164687
const ROJO = 'rgb(179, 38, 30)' // #b3261e

// Flujo real de una persona: iniciar sesión, salir del panel de administración
// (si la cuenta es Administrador) hacia el menú principal y, ahí sí, entrar a
// Acta General. Siempre con un acta nueva: se borra el acta "en curso"
// recordada por el navegador antes de abrir el módulo.
function entrarActaGeneral() {
  // Pantalla de tamaño laptop para que las capturas y el video muestren cada
  // apartado completo.
  cy.viewport(1366, 800)
  iniciarSesionYEntrarAlMenu()
  cy.window().then((ventana) => ventana.localStorage.removeItem(CLAVE_ACTA_ACTIVA))
  cy.contains('.inicio__navLink', 'Acta General').click()
  cy.contains('h1', 'Acta de Inspección General').should('be.visible')
  cy.contains('Apartado I').should('be.visible')
}

// Botón de avance del pie: "Siguiente →" en los apartados I a V y "Finalizar"
// en el último (lleva a la vista previa).
function irSiguiente() {
  cy.contains('.acta-pie button', /Siguiente|Finalizar/).click()
}

// Confirma en qué apartado está la pantalla (compara el texto exacto: "Apartado
// I" no debe darse por bueno estando en el II).
function verApartado(numero) {
  cy.contains('.acta-apartado__etiqueta', new RegExp(`^Apartado ${numero}$`)).should('be.visible')
}

// Espera la respuesta real del backend al guardar un apartado. Si el guardado
// falla, la prueba se detiene aquí indicando cuál apartado fue.
function esperarGuardado(alias, apartado) {
  cy.wait(alias).then(({ response }) => {
    expect(response?.statusCode, `guardado de ${apartado}`).to.be.oneOf([200, 204])
  })
}

// Captura de pantalla de evidencia (pantalla completa del navegador) con una
// breve pausa antes, para que el apartado termine de pintarse y se vea bien
// en el video y cuando se mira la prueba en vivo.
function evidencia(nombre) {
  cy.wait(500)
  cy.screenshot(`acta-general/${nombre}`, { capture: 'viewport', overwrite: true })
}

// Abre un selector múltiple (combobox) y marca las opciones indicadas.
function marcarOpciones(dataCampo, etiquetas) {
  cy.get(`[data-campo="${dataCampo}"]`).click()
  etiquetas.forEach((etiqueta) => {
    cy.get('.acta-multiselect__lista').contains('label', etiqueta).click()
  })
  // Se cierra con Escape, como un <select> nativo.
  cy.get('body').type('{esc}')
  cy.get('.acta-multiselect__lista').should('not.exist')
}

// Aviso flotante pequeño (costado derecho) de campos obligatorios sin llenar.
function verAvisoCamposObligatorios() {
  cy.get('.acta-aviso')
    .should('be.visible')
    .and('contain', 'Complete todos los campos obligatorios antes de continuar.')
}

// Un campo con error se ve con contorno rojo, y su mensaje debajo, también en rojo.
function verCampoEnRojo(selectorCampo, mensaje) {
  cy.get(selectorCampo).should('have.css', 'border-top-color', ROJO)
  cy.contains('.acta-campo__error', mensaje).should('be.visible').and('have.css', 'color', ROJO)
}

function llenarInfoGeneral() {
  cy.get('#nombreComercial').type('Soda Cypress Acta')
  cy.get('#provincia').select('San José')
  cy.get('#canton').select('San José')
  cy.get('#distrito').select('Carmen')
  cy.get('#direccionExacta').type('100 metros norte de la iglesia')
  cy.get('#correoNotificaciones').type('cypress@correo.com')
  // Los dos botones Sí/No del final del apartado también son obligatorios.
  cy.get('[data-campo="autorizaIngreso"]').contains('button', 'Sí').click()
  cy.get('[data-campo="autorizaFotos"]').contains('button', 'Sí').click()
}

function llenarResponsable() {
  cy.get('#nombreResponsable').type('María Fernández Solano')
  marcarOpciones('cargoResponsable', ['Encargado(a)'])
  cy.get('#numeroIdentificacionResponsable').type('1-2345-6789')
}

function llenarMotivo() {
  marcarOpciones('motivoInspeccion', ['Seguimiento'])
}

function llenarHallazgos() {
  // Las guías vienen de la API (catálogo del backend): se elige la primera.
  cy.get('[data-campo="idsGuias"] .acta-opcion').first().click()
  cy.get('#hallazgos').type('Se observan condiciones sanitarias aceptables.')
}

function llenarAcciones() {
  marcarOpciones('acciones', ['Cierre de caso'])
}

function llenarCierre() {
  cy.contains('button', 'Agregar persona').click()
  cy.get('[id$="-nombreCompleto"]').type('Juan Pérez Mora')
  cy.get('[id$="-cargoInstitucion"]').type('Inspector')
  cy.get('[id$="-numeroIdentificacion"]').type('1-1111-1111')
  cy.get('[id$="-firma"]').type('J. Pérez')
}

describe('Acta General', () => {
  beforeEach(() => {
    entrarActaGeneral()
  })

  describe('Acceso y estructura', () => {
    it('abre el acta en el Apartado I con los seis apartados en el indicador', () => {
      cy.contains('Paso 1 de 6').should('be.visible')
      cy.get('.acta-tab').should('have.length', 6)
      cy.get('.acta-tab--activa').should('contain', 'Info General')
    })

    it('muestra la fecha y la hora de inicio ya cargadas y de solo lectura', () => {
      cy.get('#fechaInspeccion').should('have.attr', 'readonly').and('not.have.value', '')
      cy.get('#horaInicio').should('have.attr', 'readonly').and('not.have.value', '')
    })

    it('deshabilita cantón y distrito hasta elegir provincia y cantón (cascada)', () => {
      cy.get('#canton').should('be.disabled')
      cy.get('#distrito').should('be.disabled')

      cy.get('#provincia').select('San José')
      cy.get('#canton').should('not.be.disabled').select('San José')
      cy.get('#distrito').should('not.be.disabled')
    })
  })

  describe('Validación: aviso, campo en rojo y regreso al campo olvidado', () => {
    it('permite avanzar sin validar si el apartado no se tocó', () => {
      irSiguiente()
      verApartado('II')
      cy.get('.acta-aviso').should('not.exist')
    })

    it('muestra el aviso a la derecha, pequeño, y se cierra solo', () => {
      cy.get('#nombreComercial').type('Soda Incompleta')
      irSiguiente()

      verAvisoCamposObligatorios()
      cy.get('.acta-aviso').should(($aviso) => {
        const caja = $aviso[0].getBoundingClientRect()
        // Pequeño (no cubre la pantalla) y pegado al costado derecho.
        expect(caja.width, 'ancho del aviso').to.be.lessThan(400)
        expect(caja.height, 'alto del aviso').to.be.lessThan(160)
        expect(caja.right, 'borde derecho del aviso').to.be.greaterThan(1366 - 60)
      })

      // No es un modal: no tapa la pantalla ni exige pulsar nada.
      cy.get('.acta-modal-overlay').should('not.exist')
      cy.get('.acta-aviso', { timeout: 6000 }).should('not.exist')
    })

    it('se queda en el apartado y marca en rojo cada campo que falta, con su mensaje', () => {
      cy.get('#nombreComercial').type('Soda Incompleta')
      irSiguiente()

      verApartado('I')
      verCampoEnRojo('#provincia', 'La provincia es obligatoria.')
      verCampoEnRojo('#direccionExacta', 'La dirección exacta es obligatoria.')
      verCampoEnRojo('#correoNotificaciones', 'El correo para notificaciones es obligatorio.')
      // El campo que sí se llenó no se marca.
      cy.get('#nombreComercial').should('not.have.css', 'border-top-color', ROJO)
    })

    it('lleva al inspector (foco) al primer campo que falta', () => {
      cy.get('#nombreComercial').type('Soda Incompleta')
      irSiguiente()

      // El nombre ya está lleno: el primero que falta es la provincia.
      cy.focused().should('have.attr', 'id', 'provincia')
    })

    it('los botones Sí/No del final son obligatorios: sin marcarlos no deja avanzar', () => {
      llenarInfoGeneral()
      // Se desmarca uno de los dos (volver a darle clic lo deja sin marcar).
      cy.get('[data-campo="autorizaFotos"]').contains('button', 'Sí').click()
      irSiguiente()

      verAvisoCamposObligatorios()
      verApartado('I')
      cy.contains(
        '.acta-campo__error',
        'Debe indicar si se autoriza tomar fotografías y/o videos.',
      ).should('be.visible')
      cy.get('[data-campo="autorizaFotos"] .acta-opcion').first().should('have.css', 'border-top-color', ROJO)
      cy.focused().closest('[data-campo="autorizaFotos"]').should('exist')

      // Al marcarlo, el error desaparece y ya deja avanzar.
      cy.get('[data-campo="autorizaFotos"]').contains('button', 'Sí').click()
      cy.contains('.acta-campo__error', 'fotografías').should('not.exist')
      irSiguiente()
      verApartado('II')
    })

    it('el aviso también aparece al intentar cambiar de apartado desde el indicador', () => {
      cy.get('#nombreComercial').type('Soda Incompleta')
      cy.contains('.acta-tab', 'Hallazgos').click()

      verAvisoCamposObligatorios()
      cy.get('.acta-tab--activa').should('contain', 'Info General')
    })

    it('valida el formato del correo electrónico', () => {
      llenarInfoGeneral()
      cy.get('#correoNotificaciones').clear().type('correo-invalido')
      irSiguiente()

      verAvisoCamposObligatorios()
      verCampoEnRojo('#correoNotificaciones', 'El correo no tiene un formato válido.')
      cy.focused().should('have.attr', 'id', 'correoNotificaciones')
    })

    it('limpia el error de un campo al corregirlo', () => {
      cy.get('#nombreComercial').type('Soda Incompleta')
      irSiguiente()

      cy.contains('La provincia es obligatoria.').should('be.visible')
      cy.get('#provincia').select('San José')
      cy.contains('La provincia es obligatoria.').should('not.exist')
      cy.get('#provincia').should('not.have.css', 'border-top-color', ROJO)
    })
  })

  describe('Indicador de progreso', () => {
    it('pinta en verde (contorno y texto verde, igual que la Guía) el apartado completo', () => {
      llenarInfoGeneral()
      irSiguiente()
      cy.contains('Apartado II').should('be.visible')

      cy.contains('.acta-tab', 'Info General')
        .should('have.class', 'acta-tab--completa')
        .and('have.css', 'color', VERDE)
        .and('have.css', 'box-shadow')
        .and('contain', VERDE)
    })

    it('las pestañas muestran solo el nombre del apartado, sin número romano ni check', () => {
      llenarInfoGeneral()
      irSiguiente()

      cy.get('.acta-tab__numero').should('not.exist')
      cy.contains('.acta-tab', 'Info General').invoke('text').should('not.match', /^I\b|✓/)
    })

    it('mantiene en azul el apartado activo incompleto', () => {
      cy.get('.acta-tab--activa')
        .should('not.have.class', 'acta-tab--completa')
        .and('have.css', 'color', 'rgb(255, 255, 255)')
    })

    it('el apartado activo y completo se ve en verde sólido', () => {
      llenarInfoGeneral()
      cy.get('.acta-tab--activa').should('have.class', 'acta-tab--completa')
      cy.get('.acta-tab--activa').should('have.css', 'background-color', VERDE)
    })

    it('pasa a pendiente si se vacía un campo obligatorio del apartado', () => {
      llenarInfoGeneral()
      cy.contains('.acta-tab', 'Info General').should('have.class', 'acta-tab--completa')

      cy.get('#nombreComercial').clear()
      cy.contains('.acta-tab', 'Info General').should('not.have.class', 'acta-tab--completa')
    })
  })

  describe('Selección múltiple (cargo y motivo)', () => {
    beforeEach(() => {
      llenarInfoGeneral()
      irSiguiente()
      cy.contains('Apartado II').should('be.visible')
    })

    it('permite elegir más de un cargo y muestra el resumen', () => {
      marcarOpciones('cargoResponsable', ['Representante legal', 'Encargado(a)'])

      cy.get('[data-campo="cargoResponsable"]')
        .should('contain', 'Representante legal')
        .and('contain', 'Encargado(a)')
    })

    it('permite desmarcar un cargo ya elegido', () => {
      cy.get('[data-campo="cargoResponsable"]').click()
      cy.get('.acta-multiselect__lista').contains('label', 'Denunciante').click()
      cy.get('.acta-multiselect__lista').contains('label', 'Denunciante').click()
      cy.get('.acta-multiselect__lista input:checked').should('have.length', 0)
    })

    it('pide especificar el cargo cuando se elige "Otro"', () => {
      marcarOpciones('cargoResponsable', ['Otro'])
      cy.get('#cargoResponsableOtro').should('be.visible').type('Encargado de mantenimiento')
    })

    it('cierra la lista al hacer clic fuera de ella', () => {
      cy.get('[data-campo="cargoResponsable"]').click()
      cy.get('.acta-multiselect__lista').should('be.visible')
      cy.contains('h2', 'Información del Responsable').click()
      cy.get('.acta-multiselect__lista').should('not.exist')
    })

    it('el motivo de la inspección también admite varias opciones', () => {
      llenarResponsable()
      irSiguiente()
      cy.contains('Apartado III').should('be.visible')

      marcarOpciones('motivoInspeccion', ['Seguimiento', 'Denuncia'])
      cy.get('[data-campo="motivoInspeccion"]')
        .should('contain', 'Seguimiento')
        .and('contain', 'Denuncia')
    })

    it('al faltar el cargo, el pop-up lleva el foco al selector del cargo', () => {
      cy.get('#nombreResponsable').type('María Fernández Solano')
      cy.get('#numeroIdentificacionResponsable').type('1-2345-6789')
      irSiguiente()

      verAvisoCamposObligatorios()
      verCampoEnRojo('[data-campo="cargoResponsable"]', 'Debe indicar al menos un cargo')
      cy.focused().should('have.attr', 'data-campo', 'cargoResponsable')
    })
  })

  describe('Salir del acta (Volver al menú)', () => {
    it('abre el modal de confirmación con el botón de salir en azul', () => {
      cy.contains('button', 'Volver al menú').click()

      cy.contains('¿Volver al menú principal?').should('be.visible')
      cy.contains('.acta-modal button', /^Salir$/)
        .should('be.visible')
        .and('have.css', 'background-color', AZUL_ACERO)
      cy.contains('.acta-modal button', 'Guardar borrador').should('be.disabled')
    })

    it('"Cancelar" cierra el modal y permanece en el acta', () => {
      cy.contains('button', 'Volver al menú').click()
      cy.contains('button', 'Cancelar').click()

      cy.contains('¿Volver al menú principal?').should('not.exist')
      cy.contains('Apartado I').should('be.visible')
    })

    it('confirmar descarta el acta y regresa al menú (inicio, o el panel si es Administrador)', () => {
      cy.contains('button', 'Volver al menú').click()
      cy.contains('.acta-modal button', /^Salir$/).click()

      cy.location('pathname').should('match', /^\/(inicio|admin)$/)
      cy.window().then((ventana) => {
        expect(ventana.localStorage.getItem(CLAVE_ACTA_ACTIVA)).to.equal(null)
      })
    })
  })

  describe('Persistencia al recargar la página', () => {
    it('retoma la misma acta y el apartado donde quedó el inspector', () => {
      llenarInfoGeneral()
      irSiguiente()
      cy.contains('Apartado II').should('be.visible')

      cy.reload()

      cy.contains('Apartado II').should('be.visible')
      cy.contains('.acta-tab', 'Info General').click()
      cy.get('#nombreComercial').should('have.value', 'Soda Cypress Acta')
      cy.get('#direccionExacta').should('have.value', '100 metros norte de la iglesia')
    })
  })

  describe('Flujo completo', () => {
    // Recorrido completo y con evidencia: pasa por los seis apartados hasta
    // "Cierre y Firmas", espera la respuesta real del backend en cada guardado
    // (si un apartado no se guarda, la prueba se detiene ahí diciendo cuál) y
    // toma una captura por apartado, antes y después de llenarlo. Las capturas
    // quedan en cypress/screenshots y, con `cypress run`, también el video.
    it('recorre los seis apartados hasta Cierre y Firmas y guarda el acta (con evidencia)', () => {
      cy.intercept('PUT', '**/api/actas-generales/*/info-general').as('guardarInfoGeneral')
      cy.intercept('PUT', '**/api/actas-generales/*/responsable').as('guardarResponsable')
      cy.intercept('PUT', '**/api/actas-generales/*/motivo').as('guardarMotivo')
      cy.intercept('PUT', '**/api/actas-generales/*/hallazgos').as('guardarHallazgos')
      cy.intercept('PUT', '**/api/actas-generales/*/acciones').as('guardarAcciones')
      cy.intercept('PUT', '**/api/actas-generales/*/cierre').as('guardarCierre')

      // Apartado I
      verApartado('I')
      evidencia('01-apartado-I-vacio')
      llenarInfoGeneral()
      evidencia('02-apartado-I-lleno')
      irSiguiente()
      esperarGuardado('@guardarInfoGeneral', 'Apartado I (Info General)')

      // Apartado II
      verApartado('II')
      evidencia('03-apartado-II-vacio')
      llenarResponsable()
      evidencia('04-apartado-II-lleno')
      irSiguiente()
      esperarGuardado('@guardarResponsable', 'Apartado II (Responsable)')

      // Apartado III
      verApartado('III')
      evidencia('05-apartado-III-vacio')
      llenarMotivo()
      evidencia('06-apartado-III-lleno')
      irSiguiente()
      esperarGuardado('@guardarMotivo', 'Apartado III (Motivo)')

      // Apartado IV
      verApartado('IV')
      evidencia('07-apartado-IV-vacio')
      llenarHallazgos()
      evidencia('08-apartado-IV-lleno')
      irSiguiente()
      esperarGuardado('@guardarHallazgos', 'Apartado IV (Hallazgos)')

      // Apartado V
      verApartado('V')
      evidencia('09-apartado-V-vacio')
      llenarAcciones()
      evidencia('10-apartado-V-lleno')
      irSiguiente()
      esperarGuardado('@guardarAcciones', 'Apartado V (Acciones)')

      // Apartado VI: Cierre y Firmas. "Finalizar" guarda y lleva a la vista previa.
      verApartado('VI')
      cy.contains('Paso 6 de 6').should('be.visible')
      cy.contains('.acta-pie button', 'Finalizar').should('be.visible')
      evidencia('11-apartado-VI-vacio')
      llenarCierre()
      evidencia('12-apartado-VI-lleno')

      irSiguiente()
      esperarGuardado('@guardarCierre', 'Apartado VI (Cierre y Firmas)')

      // Vista previa: resumen de solo lectura de toda el acta.
      cy.contains('h2', 'Vista previa').should('be.visible')
      cy.get('.acta-vista-previa').within(() => {
        cy.contains('Acta de Inspección General').should('be.visible')
        cy.contains('Soda Cypress Acta').should('be.visible')
        cy.contains('100 metros norte de la iglesia').should('be.visible')
        cy.contains('cypress@correo.com').should('be.visible')
        cy.contains('María Fernández Solano').should('be.visible')
        cy.contains('Encargado(a)').should('be.visible')
        cy.contains('Seguimiento').should('be.visible')
        cy.contains('Se observan condiciones sanitarias aceptables.').should('be.visible')
        cy.contains('Cierre de caso').should('be.visible')
        cy.contains('Juan Pérez Mora').should('be.visible')
      })
      cy.contains('button', 'Siguiente').should('not.exist')
      cy.contains('button', 'Anterior').should('be.visible')
      cy.contains('button', 'Guardar y enviar acta').should('be.visible')

      // Los seis apartados quedan marcados como completos (verde).
      cy.get('.acta-tab--completa').should('have.length', 6)
      evidencia('13-vista-previa')
    })

    it('desde la vista previa "Anterior" regresa a Cierre y Firmas con los datos intactos', () => {
      llenarInfoGeneral()
      irSiguiente()
      llenarResponsable()
      irSiguiente()
      llenarMotivo()
      irSiguiente()
      llenarHallazgos()
      irSiguiente()
      llenarAcciones()
      irSiguiente()
      llenarCierre()
      irSiguiente()

      cy.contains('h2', 'Vista previa').should('be.visible')
      cy.contains('button', 'Anterior').click()

      verApartado('VI')
      cy.get('[id$="-nombreCompleto"]').should('have.value', 'Juan Pérez Mora')
    })

    it('no deja abrir la vista previa si otro apartado quedó incompleto y lleva a ese apartado', () => {
      // Solo se llena el apartado I; el resto se deja sin tocar.
      llenarInfoGeneral()
      cy.contains('.acta-tab', 'Cierre y Firmas').click()
      verApartado('VI')
      llenarCierre()
      irSiguiente()

      verAvisoCamposObligatorios()
      cy.contains('h2', 'Vista previa').should('not.exist')
      verApartado('II')
    })

    it('en el último apartado "Finalizar" muestra el pop-up si falta algún dato de la persona', () => {
      llenarInfoGeneral()
      irSiguiente()
      llenarResponsable()
      irSiguiente()
      llenarMotivo()
      irSiguiente()
      llenarHallazgos()
      irSiguiente()
      llenarAcciones()
      irSiguiente()

      cy.contains('Apartado VI').should('be.visible')
      cy.contains('button', 'Agregar persona').click()
      cy.get('[id$="-nombreCompleto"]').type('Juan Pérez Mora')

      irSiguiente()
      verAvisoCamposObligatorios()

      verCampoEnRojo('[id$="-cargoInstitucion"]', 'El cargo o institución es obligatorio.')
      cy.focused().should('have.attr', 'id').and('match', /-cargoInstitucion$/)
    })

    it('pide al menos una persona presente al pasar a la vista previa con el cierre vacío', () => {
      llenarInfoGeneral()
      irSiguiente()
      llenarResponsable()
      irSiguiente()
      llenarMotivo()
      irSiguiente()
      llenarHallazgos()
      irSiguiente()
      llenarAcciones()
      irSiguiente()

      // Aunque el apartado VI no se haya tocado, "Finalizar" lo valida antes de
      // abrir la vista previa.
      irSiguiente()
      verAvisoCamposObligatorios()
      cy.contains('.acta-campo__error', 'Debe agregar al menos una persona presente.')
        .should('be.visible')
        .and('have.css', 'color', ROJO)
      cy.focused().should('have.attr', 'data-campo', 'personasPresentes')
    })
  })
})
