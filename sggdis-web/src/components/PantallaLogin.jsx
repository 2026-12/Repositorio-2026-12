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

export default function PantallaLogin({ onIniciarSesion }) {
  const [correo, setCorreo] = useState(() => localStorage.getItem('sggdis:correo-recordado') ?? '');
  const [contrasena, setContrasena] = useState('');
  const [recordarme, setRecordarme] = useState(() => Boolean(localStorage.getItem('sggdis:correo-recordado')));
  const [mostrarContrasena, setMostrarContrasena] = useState(false);
  const [error, setError] = useState('');
  const [cargando, setCargando] = useState(false);
  const [ayudaVisible, setAyudaVisible] = useState(false);

  async function enviarCredenciales(event) {
    event.preventDefault();
    setError('');
    setCargando(true);
    try {
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
          <h1 id="login-title">Iniciar sesión</h1>
          <p className="login-brand__subtitle">
            Ingrese sus credenciales para acceder al sistema
          </p>
        </header>

        <form className="login-form" onSubmit={enviarCredenciales}>
            <label className="login-field">
              <span>Usuario institucional</span>
              <span className="login-input-wrap">
                <Icono nombre="usuario" className="login-input-icon" />
                <input
                  autoComplete="username"
                  type="email"
                  name="correo"
                  placeholder="ejemplo@misalud.go.cr"
                  value={correo}
                  onChange={(event) => setCorreo(event.target.value)}
                  required
                />
              </span>
            </label>

            <label className="login-field">
              <span>Contraseña</span>
              <span className="login-input-wrap">
                <Icono nombre="candado" className="login-input-icon" />
                <input
                  autoComplete="current-password"
                  type={mostrarContrasena ? 'text' : 'password'}
                  name="contrasena"
                  placeholder="Ingrese su contraseña"
                  value={contrasena}
                  onChange={(event) => setContrasena(event.target.value)}
                  required
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

            <div className="login-options">
              <label className="login-remember">
                <input type="checkbox" checked={recordarme} onChange={(event) => setRecordarme(event.target.checked)} />
                <span>Recordarme</span>
              </label>
              <button type="button" className="login-help-link" onClick={() => setAyudaVisible((visible) => !visible)}>
                ¿Olvidó su contraseña?
              </button>
            </div>

            {ayudaVisible && (
              <p className="login-inline-help" role="status">Solicite el restablecimiento de su contraseña al administrador del sistema.</p>
            )}

            {error && <p className="login-error" role="alert">{error}</p>}
            <button className="login-submit" type="submit" disabled={cargando}>
              {cargando ? 'Validando…' : 'Iniciar sesión'}
              <Icono nombre="flecha" />
            </button>
        </form>
      </section>
    </main>
  );
}