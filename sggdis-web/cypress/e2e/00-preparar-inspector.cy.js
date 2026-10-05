import { iniciarSesionComoInspector, obtenerCredencialesInspector } from '../support/loginInspector'

describe('Preparación del inspector compartido para las pruebas E2E', () => {
  it('crea o reutiliza la cuenta, asigna su rol y área y verifica el login', () => {
    cy.env(['ADMIN_CORREO', 'ADMIN_CONTRASENA'], { log: false }).then((administrador) => {
      expect(administrador.ADMIN_CORREO, 'Configurar CYPRESS_ADMIN_CORREO').to.be.a('string').and.not.be.empty
      expect(administrador.ADMIN_CONTRASENA, 'Configurar CYPRESS_ADMIN_CONTRASENA').to.be.a('string').and.not.be.empty

      obtenerCredencialesInspector().then(({ correo, contrasena }) => {
        cy.clearCookies()
        cy.clearAllSessionStorage()
        cy.intercept('POST', '**/api/auth/register').as('registroInspector')
        cy.visit('/login')
        cy.contains('button', 'Crear una cuenta').click()
        cy.get('input[name="nombre"]').type('Inspectora')
        cy.get('input[name="primerApellido"]').type('Cypress')
        cy.get('input[name="segundoApellido"]').type('Prueba')
        cy.get('input[name="identificacion"]').type(`CY${Date.now()}`)
        cy.get('input[name="correo"]').clear().type(correo)
        cy.get('input[name="contrasena"]').type(contrasena, { log: false })
        cy.contains('button', 'Crear cuenta').click()
        cy.wait('@registroInspector').then(({ response }) => {
          expect(response, 'Respuesta del registro').to.exist
          expect(response.statusCode, 'Cuenta creada o correo ya registrado').to.be.oneOf([201, 409])
          if (response.statusCode === 409) {
            expect(response.body.mensaje).to.equal('Ya existe una cuenta con ese correo.')
          }
        })

        cy.intercept('GET', '**/api/administracion/usuarios').as('usuariosPendientes')
        cy.intercept('GET', '**/api/administracion/usuarios/areas').as('areas')
        cy.intercept('GET', '**/api/administracion/usuarios/regiones').as('regiones')
        cy.visit('/login')
        cy.get('input[name="correo"]').clear().type(administrador.ADMIN_CORREO)
        cy.get('input[name="contrasena"]').type(administrador.ADMIN_CONTRASENA, { log: false })
        cy.contains('button', 'Iniciar sesión').click()
        cy.contains('Panel de administración').should('be.visible')

        cy.wait(['@usuariosPendientes', '@areas', '@regiones']).then(([usuarios, areas, regiones]) => {
          for (const peticion of [usuarios, areas, regiones]) {
            expect(peticion.response.statusCode, 'Catálogo disponible').to.equal(200)
          }
          const pendiente = usuarios.response.body.find((usuario) =>
            usuario.correo.toLowerCase() === correo.toLowerCase()
          )
          // Las cuentas ya activadas no aparecen en la lista de pendientes.
          if (!pendiente) return

          const area = areas.response.body[0]
          expect(area, 'Debe existir un área de trabajo en la BD de pruebas').to.exist
          cy.intercept('PUT', `**/api/administracion/usuarios/${pendiente.idUsuario}/asignacion`).as('asignacionInspector')
          cy.contains('tr', pendiente.correo).within(() => {
            cy.get('select').eq(0).select('Inspector')
            cy.get('select').eq(1).select(String(area.idRegion))
            cy.get('select').eq(2).select(String(area.idArea))
            cy.contains('button', 'Guardar').click()
          })
          cy.wait('@asignacionInspector').its('response.statusCode').should('eq', 204)
          cy.contains(`Asignaciones de ${pendiente.correo} actualizadas.`).should('be.visible')
        })

        cy.intercept('POST', '**/api/auth/logout').as('salidaAdministrador')
        cy.get('.panel-admin__logout').click()
        cy.wait('@salidaAdministrador').its('response.statusCode').should('eq', 204)
        iniciarSesionComoInspector()
        cy.window().then((ventana) => {
          const sesion = JSON.parse(ventana.sessionStorage.getItem('sggdis:sesion'))
          expect(sesion.correo.toLowerCase()).to.equal(correo.toLowerCase())
          expect(sesion.rol).to.equal('Inspector')
          expect(sesion.idArea, 'Área asignada al inspector').to.be.a('number').and.be.greaterThan(0)
        })
      })
    })
  })
})
