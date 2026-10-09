// Sprint 1 — Flujo 5: Registro de cuenta, asignación de rol por el
// Administrador y login del Inspector ya activado.
//
// HU "Inicio de sesión": la suite está dividida por criterio de aceptación.
//   CA1 — El sistema valida que las credenciales correspondan a un usuario
//         registrado (y rechaza cuentas sin rol/área asignados).
//   CA2 — Si las credenciales son incorrectas, se muestra un mensaje de
//         error y no se da acceso.
//   CA3 — Las contraseñas se manejan cifradas, nunca en texto plano.
// Nota: la HU menciona como salidas el código 2FA al correo y la pantalla
// de verificación, pero el login actual es directo (correo + contraseña →
// sesión); el 2FA aún no está implementado en PantallaLogin/AuthController.
//
// Prerequisito: la cuenta temporal de Administrador debe existir en la BD
// (ver DataBase/CrearAdministradorTemporal.sql): 123@misalud.go.cr / 123.
//
// Dividido en varios it() que se continúan entre sí (comparten el correo
// creado en el primer paso). testIsolation se desactiva porque la sesión
// vive en sessionStorage y, si no, Cypress la borraría antes de cada it().

// ========================== DATOS DE PRUEBA ==========================
// Separados de la lógica: para cambiar usuarios o casos solo se edita
// esta sección.
const sufijo = Date.now()

const ADMINISTRADOR = {
  correo: '123@misalud.go.cr',
  contrasena: '123',
}

const INSPECTOR_NUEVO = {
  nombre: 'Inspectora',
  primerApellido: 'Cypress',
  segundoApellido: 'Prueba',
  identificacion: `CY${sufijo}`,
  correo: `inspector.cypress.${sufijo}@misalud.go.cr`,
  contrasena: 'ClaveSegura123',
}

// Casos negativos del CA2: ambos deben terminar en el mismo mensaje
// genérico para no revelar cuál de los dos datos falló.
const CREDENCIALES_INVALIDAS = [
  {
    caso: 'un correo que no está registrado',
    correo: 'no.existe.cypress@misalud.go.cr',
    contrasena: 'ClaveSegura123',
  },
  {
    caso: 'una contraseña equivocada para un correo registrado',
    correo: ADMINISTRADOR.correo,
    contrasena: 'ContrasenaEquivocada999',
  },
]

const MSJ_CREDENCIALES_INVALIDAS = 'Correo o contraseña incorrectos.'
// Misma URL por defecto que usa el frontend (src/config/api.js). No es un
// dato sensible, así que va como constante (Cypress 16 eliminó Cypress.env).
const URL_API = 'http://localhost:5288'
// =====================================================================

describe('Registro, asignación de rol y login del inspector', { testIsolation: false }, () => {
  context('CA1 — credenciales válidas: el sistema las valida y abre el panel del rol', () => {
    it('1) un usuario nuevo se registra desde la pantalla pública de login', () => {
      // Por tener testIsolation: false en esta suite, la limpieza automática
      // de Cypress no corre aquí: si quedó una cookie de refresh de una sesión
      // manual previa, el primer visit nos metería ya logueados.
      cy.clearCookies()
      cy.clearAllSessionStorage()

      cy.visit('/login')
      cy.contains('button', 'Crear una cuenta').click()

      cy.get('input[name="nombre"]').type(INSPECTOR_NUEVO.nombre)
      cy.get('input[name="primerApellido"]').type(INSPECTOR_NUEVO.primerApellido)
      cy.get('input[name="segundoApellido"]').type(INSPECTOR_NUEVO.segundoApellido)
      cy.get('input[name="identificacion"]').type(INSPECTOR_NUEVO.identificacion)
      cy.get('input[name="correo"]').type(INSPECTOR_NUEVO.correo)
      cy.get('input[name="contrasena"]').type(INSPECTOR_NUEVO.contrasena)
      cy.contains('button', 'Crear cuenta').click()

      cy.get('[role="status"]').should('be.visible')
    })

    it('2) mientras no tenga rol asignado, el login debe rechazarse', () => {
      cy.get('input[name="contrasena"]').type(INSPECTOR_NUEVO.contrasena)
      cy.contains('button', 'Iniciar sesión').click()
      cy.contains('Debe esperar a que el Administrador complete la asignación.').should('be.visible')
    })

    it('3) el Administrador inicia sesión y le asigna rol, región y área', () => {
      cy.get('input[name="correo"]').clear().type(ADMINISTRADOR.correo)
      cy.get('input[name="contrasena"]').clear().type(ADMINISTRADOR.contrasena)
      cy.contains('button', 'Iniciar sesión').click()
      cy.contains('Panel de administración').should('be.visible')

      // El panel de administración solo maneja una región/área por select, pero
      // el backend exige las LISTAS idAreas/idRegiones para el rol Inspector
      // (asignaciones múltiples, ver ActualizarAsignacionAsync en AuthService).
      // Hasta que el panel se actualice, la asignación se hace por la misma API
      // con el token de la sesión del Administrador.
      cy.window().then((ventana) => {
        const sesion = JSON.parse(ventana.sessionStorage.getItem('sggdis:sesion'))

        cy.request({
          method: 'GET',
          url: `${URL_API}/api/administracion/usuarios`,
          headers: { Authorization: `Bearer ${sesion.token}` },
        }).then(({ body: usuarios }) => {
          const pendiente = usuarios.find((usuario) =>
            usuario.correo.toLowerCase() === INSPECTOR_NUEVO.correo.toLowerCase()
          )
          expect(pendiente, 'usuario recién registrado en la lista').to.exist

          cy.request({
            method: 'GET',
            url: `${URL_API}/api/administracion/usuarios/areas`,
            headers: { Authorization: `Bearer ${sesion.token}` },
          }).then(({ body: areas }) => {
            const area = areas[0]
            expect(area, 'Debe existir un área de trabajo en la BD de pruebas').to.exist

            cy.request({
              method: 'PUT',
              url: `${URL_API}/api/administracion/usuarios/${pendiente.idUsuario}/asignacion`,
              headers: { Authorization: `Bearer ${sesion.token}` },
              body: {
                rol: 'Inspector',
                idAreas: [area.idArea],
                idRegiones: [area.idRegion],
              },
            }).its('status').should('eq', 204)
          })
        })
      })

      // El Administrador cierra sesión para que el Inspector pueda entrar.
      cy.get('.panel-admin__logout').click()
    })

    it('4) el Inspector ya activado inicia sesión y llega a la pantalla principal', () => {
      cy.get('input[name="correo"]').type(INSPECTOR_NUEVO.correo)
      cy.get('input[name="contrasena"]').type(INSPECTOR_NUEVO.contrasena)
      cy.contains('button', 'Iniciar sesión').click()
      cy.contains('.inicio__navLink', 'Nueva inspección').should('be.visible')

      // La sesión queda guardada con el rol correcto (panel correspondiente).
      cy.window().then((ventana) => {
        const sesion = JSON.parse(ventana.sessionStorage.getItem('sggdis:sesion'))
        expect(sesion.correo.toLowerCase()).to.equal(INSPECTOR_NUEVO.correo.toLowerCase())
        expect(sesion.rol).to.equal('Inspector')
      })
    })
  })

  context('CA2 — credenciales incorrectas: mensaje de error y sin acceso', () => {
    it('7) se vuelve a la pantalla de login sin sesión', () => {
      cy.clearCookies()
      cy.clearAllSessionStorage()
      cy.visit('/login')
      cy.contains('button', 'Iniciar sesión').should('be.visible')
    })

    it('8) exige correo y contraseña antes de enviar la solicitud', () => {
      cy.contains('button', 'Iniciar sesión').click()
      cy.get('.login-error').should('be.visible').and('contain', 'Ingrese su correo institucional.')

      cy.get('input[name="correo"]').type(ADMINISTRADOR.correo)
      cy.contains('button', 'Iniciar sesión').click()
      cy.get('.login-error').should('be.visible').and('contain', 'Ingrese su contraseña.')
    })

    for (const invalido of CREDENCIALES_INVALIDAS) {
      it(`rechaza ${invalido.caso} con el mensaje genérico`, () => {
        cy.intercept('POST', '**/api/auth/login').as('loginFallido')
        cy.get('input[name="correo"]').clear().type(invalido.correo)
        cy.get('input[name="contrasena"]').clear().type(invalido.contrasena, { log: false })
        cy.contains('button', 'Iniciar sesión').click()

        cy.wait('@loginFallido').its('response.statusCode').should('eq', 401)
        cy.get('.login-error').should('be.visible').and('contain', MSJ_CREDENCIALES_INVALIDAS)
        cy.location('pathname').should('eq', '/login')
        cy.window().then((ventana) => {
          expect(ventana.sessionStorage.getItem('sggdis:sesion')).to.be.null
        })
      })
    }
  })

  context('CA3 — las contraseñas se manejan cifradas, nunca en texto plano', () => {
    // El hash en la base de datos (PasswordHasher de ASP.NET Identity,
    // registrado en Program.cs) no se puede verificar desde el navegador:
    // lo cubren las pruebas unitarias del backend (AuthServiceTests). Aquí
    // se valida que la API jamás devuelva la contraseña ni su hash.
    it('la respuesta del login no expone la contraseña ni su hash', () => {
      cy.request('POST', `${URL_API}/api/auth/login`, {
        correo: INSPECTOR_NUEVO.correo,
        contrasena: INSPECTOR_NUEVO.contrasena,
      }).then((respuesta) => {
        expect(respuesta.status).to.eq(200)
        expect(respuesta.body).to.not.have.any.keys(
          'contrasena',
          'password',
          'passwordHash',
          'hashContrasena',
          'hash',
        )
        expect(JSON.stringify(respuesta.body)).to.not.include(INSPECTOR_NUEVO.contrasena)
      })
    })
  })
})
