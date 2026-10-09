import { useState } from 'react';
import logoMinisterio from '../assets/logo-ministerio-salud.png';
import './PantallaLogin.css';

function Icono({ nombre, className }) {
  const paths = {
    usuario: <><circle cx="12" cy="8" r="3.5" /><path d="M5 21v-1.5a7 7 0 0 1 14 0V21" /></>,
    candado: <><rect x="4" y="10" width="16" height="11" rx="2" /><path d="M8 10V7a4 4 0 0 1 8 0v3M12 14v3" /></>,
    ojo: <><path d="M2 12s3.6-6 10-6 10 6 10 6-3.6 6-10 6-10-6-10-6Z" /><circle cx="12" cy="12" r="2.5" /></>,
    flecha: <><path d="M5 12h14M13 6l6 6-6 6" /></>,
  };

  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      {paths[nombre]}
    </svg>
  );
}

// Tipos de identificación admitidos en el registro público, con su formato
// esperado. La cédula nacional tiene 9 dígitos; la DIMEX, entre 11 y 12; el
// pasaporte es alfanumérico.
const TIPOS_IDENTIFICACION = {
  CEDULA: {
    etiqueta: 'Cédula de identidad',
    placeholder: '9 dígitos, sin guiones',
    patron: /^\d{9}$/,
    mensaje: 'La cédula de identidad debe tener exactamente 9 dígitos.',
  },
  DIMEX: {
    etiqueta: 'Cédula DIMEX',
    placeholder: '11 o 12 dígitos, sin guiones',
    patron: /^\d{11,12}$/,
    mensaje: 'La cédula DIMEX debe tener entre 11 y 12 dígitos.',
  },
  PASAPORTE: {
    etiqueta: 'Pasaporte',
    placeholder: 'Número de pasaporte',
    patron: /^[A-Za-z0-9]{5,30}$/,
    mensaje: 'El pasaporte admite entre 5 y 30 caracteres alfanuméricos.',
  },
};

export default function PantallaLogin({ onIniciarSesion, onRegistrar }) {
  const [correo, setCorreo] = useState(() => localStorage.getItem('sggdis:correo-recordado') ?? '');
  const [contrasena, setContrasena] = useState('');
  const [nombre, setNombre] = useState('');
  const [primerApellido, setPrimerApellido] = useState('');
  const [segundoApellido, setSegundoApellido] = useState('');
  const [identificacion, setIdentificacion] = useState('');
  const [tipoIdentificacion, setTipoIdentificacion] = useState('CEDULA');
  const [recordarme, setRecordarme] = useState(() => Boolean(localStorage.getItem('sggdis:correo-recordado')));
  const [mostrarContrasena, setMostrarContrasena] = useState(false);
  const [error, setError] = useState('');
  const [cargando, setCargando] = useState(false);
  const [ayudaVisible, setAyudaVisible] = useState(false);
  const [modoRegistro, setModoRegistro] = useState(false);
  const [mensaje, setMensaje] = useState('');

  async function enviarCredenciales(event) {
    event.preventDefault();
    setError('');
    setMensaje('');
    setCargando(true);
    try {
      // Validar campos requeridos
      if (!correo.trim()) {
        setError('Ingrese su correo institucional.');
        setCargando(false);
        return;
      }
      if (!contrasena) {
        setError('Ingrese su contraseña.');
        setCargando(false);
        return;
      }
      if (modoRegistro && (!nombre.trim() || !primerApellido.trim() || !segundoApellido.trim() || !identificacion.trim())) {
        setError('Complete su nombre, ambos apellidos y su identificación.');
        setCargando(false);
        return;
      }
      if (modoRegistro && !TIPOS_IDENTIFICACION[tipoIdentificacion].patron.test(identificacion.trim())) {
        setError(TIPOS_IDENTIFICACION[tipoIdentificacion].mensaje);
        setCargando(false);
        return;
      }
      if (modoRegistro && (nombre.trim().length > 100 || primerApellido.trim().length > 100 ||
          segundoApellido.trim().length > 100 ||
          `${nombre.trim()} ${primerApellido.trim()} ${segundoApellido.trim()}`.length > 150 ||
          identificacion.trim().length > 30)) {
        setError('Cada campo de nombre admite hasta 100 caracteres, el nombre completo 150 y la identificación 30.');
        setCargando(false);
        return;
      }
      // Validar longitud mínima en modo registro
      if (modoRegistro && contrasena.length < 12) {
        setError('La contraseña debe tener mínimo 12 caracteres.');
        setCargando(false);
        return;
      }
      if (modoRegistro) {
        const resultado = await onRegistrar({
          correo: correo.trim(),
          contrasena,
          nombre: nombre.trim(),
          primerApellido: primerApellido.trim(),
          segundoApellido: segundoApellido.trim(),
          tipoIdentificacion,
          identificacion: identificacion.trim(),
        });
        setMensaje(resultado?.mensaje ?? 'Cuenta creada. El Administrador debe asignarle rol y área antes de que pueda ingresar.');
        setModoRegistro(false);
        setContrasena('');
        setNombre('');
        setPrimerApellido('');
        setSegundoApellido('');
        setIdentificacion('');
        setTipoIdentificacion('CEDULA');
        return;
      }
      await onIniciarSesion(correo.trim(), contrasena);
      if (recordarme) localStorage.setItem('sggdis:correo-recordado', correo.trim());
      else localStorage.removeItem('sggdis:correo-recordado');
    } catch (errorSolicitud) {
      setError(errorSolicitud.message);
    } finally {
      setCargando(false);
    }
  }

  return (
    <main className="login-page">
      <section className="login-panel" aria-labelledby="login-title">
        <header className="login-brand">
          <div className="login-brand__seal">
            <img src={logoMinisterio} alt="" />
          </div>
          <p className="login-brand__name">MINISTERIO DE SALUD · COSTA RICA</p>
          <h1 id="login-title">{modoRegistro ? 'Crear cuenta' : 'Iniciar sesión'}</h1>
          <p className="login-brand__subtitle">
            {modoRegistro ? 'Regístrese con su correo institucional' : 'Ingrese sus credenciales para acceder al sistema'}
          </p>
        </header>

        <form className="login-form" onSubmit={enviarCredenciales}>
            {modoRegistro && (
              <>
                <label className="login-field">
                  <span>Nombre</span>
                  <span className="login-input-wrap">
                    <input autoComplete="given-name" name="nombre" value={nombre} onChange={(event) => setNombre(event.target.value)} />
                  </span>
                </label>
                <label className="login-field">
                  <span>Primer apellido</span>
                  <span className="login-input-wrap">
                    <input autoComplete="family-name" name="primerApellido" value={primerApellido} onChange={(event) => setPrimerApellido(event.target.value)} />
                  </span>
                </label>
                <label className="login-field">
                  <span>Segundo apellido</span>
                  <span className="login-input-wrap">
                    <input name="segundoApellido" value={segundoApellido} onChange={(event) => setSegundoApellido(event.target.value)} />
                  </span>
                </label>
                <label className="login-field">
                  <span>Tipo de identificación</span>
                  <span className="login-input-wrap">
                    <select name="tipoIdentificacion" value={tipoIdentificacion} onChange={(event) => setTipoIdentificacion(event.target.value)}>
                      {Object.entries(TIPOS_IDENTIFICACION).map(([valor, tipo]) => (
                        <option key={valor} value={valor}>{tipo.etiqueta}</option>
                      ))}
                    </select>
                  </span>
                </label>
                <label className="login-field">
                  <span>Identificación</span>
                  <span className="login-input-wrap">
                    <input autoComplete="off" name="identificacion" placeholder={TIPOS_IDENTIFICACION[tipoIdentificacion].placeholder} value={identificacion} onChange={(event) => setIdentificacion(event.target.value)} />
                  </span>
                </label>
              </>
            )}
            <label className="login-field">
              <span>Usuario institucional</span>
              <span className="login-input-wrap">
                <Icono nombre="usuario" className="login-input-icon" />
                <input
                  autoComplete="email"
                  type="email"
                  name="correo"
                  placeholder="ejemplo@misalud.go.cr"
                  value={correo}
                  onChange={(event) => setCorreo(event.target.value)}
                />
              </span>
            </label>

            <label className="login-field">
              <span>Contraseña</span>
              <span className="login-input-wrap">
                <Icono nombre="candado" className="login-input-icon" />
                <input
                  autoComplete={modoRegistro ? 'new-password' : 'current-password'}
                  type={mostrarContrasena ? 'text' : 'password'}
                  name="contrasena"
                  placeholder={modoRegistro ? 'Mínimo 12 caracteres' : 'Ingrese su contraseña'}
                  value={contrasena}
                  onChange={(event) => setContrasena(event.target.value)}
                />
                <button
                  className="login-password-toggle"
                  type="button"
                  aria-label={mostrarContrasena ? 'Ocultar contraseña' : 'Mostrar contraseña'}
                  onClick={() => setMostrarContrasena((visible) => !visible)}
                >
                  <Icono nombre="ojo" />
                </button>
              </span>
            </label>

            {!modoRegistro && (
              <div className="login-options">
                <label className="login-remember">
                  <input type="checkbox" checked={recordarme} onChange={(event) => setRecordarme(event.target.checked)} />
                  <span>Recordarme</span>
                </label>
                <button type="button" className="login-help-link" onClick={() => setAyudaVisible((visible) => !visible)}>
                  ¿Olvidó su contraseña?
                </button>
              </div>
            )}

            {!modoRegistro && ayudaVisible && (
              <p className="login-inline-help" role="status">Solicite el restablecimiento de su contraseña al administrador del sistema.</p>
            )}

            {mensaje && <p className="login-inline-help" role="status">{mensaje}</p>}
            {error && <p className="login-error" role="alert">{error}</p>}
            <button className="login-submit" type="submit" disabled={cargando}>
              {cargando ? 'Procesando…' : modoRegistro ? 'Crear cuenta' : 'Iniciar sesión'}
              {!modoRegistro && <Icono nombre="flecha" />}
            </button>
            <button
              className="login-help-link"
              type="button"
              onClick={() => {
                setModoRegistro((actual) => !actual);
                setError('');
                setMensaje('');
                setAyudaVisible(false);
              }}
            >
              {modoRegistro ? 'Volver a iniciar sesión' : 'Crear una cuenta'}
            </button>
        </form>
      </section>
    </main>
  );
}