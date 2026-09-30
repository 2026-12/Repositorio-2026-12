import { useEffect, useState } from 'react';
import PantallaInicio from './components/PantallaInicio';
import PantallaLogin from './components/PantallaLogin';
import PanelAdministrador from './components/PanelAdministrador';
import { InspeccionModulo, existeProgresoGuardado } from './modules/inspecciones';
import { cerrarSesion, iniciarSesion, leerSesion } from './modules/auth/services/authService';

// Componente raíz de la aplicación: solo decide qué pantalla mostrar (menú
// de inicio o el módulo de inspecciones). Todo el estado y flujo interno de
// una inspección vive dentro de InspeccionModulo.
function App() {
  const [sesion, setSesion] = useState(leerSesion);
  const [pantallaActual, setPantallaActual] = useState(() => {
    const sesionActual = leerSesion();
    if (sesionActual?.rol === 'Administrador') return 'inicio';
    if (sesionActual && existeProgresoGuardado()) return 'inspeccion';
    return sessionStorage.getItem('pantallaActualSGGDIS') ?? 'inicio';
  });

  // Session changes are emitted after login, logout, or an expired API token.
  useEffect(() => {
    const sincronizarSesion = () => setSesion(leerSesion());
    window.addEventListener('sggdis:session-changed', sincronizarSesion);
    return () => window.removeEventListener('sggdis:session-changed', sincronizarSesion);
  }, []);

  useEffect(() => {
    if (sesion) sessionStorage.setItem('pantallaActualSGGDIS', pantallaActual);
  }, [pantallaActual, sesion]);

  useEffect(() => {
    if (!sesion) return undefined;
    const temporizador = window.setTimeout(() => {
      sessionStorage.removeItem('sggdis:sesion');
      window.dispatchEvent(new Event('sggdis:session-changed'));
    }, Math.max(0, new Date(sesion.expira).getTime() - Date.now()));
    return () => window.clearTimeout(temporizador);
  }, [sesion]);

  async function manejarIniciarSesion(correo, contrasena) {
    const resultado = await iniciarSesion(correo, contrasena);
    setPantallaActual('inicio');
    sessionStorage.setItem('pantallaActualSGGDIS', 'inicio');
    return resultado;
  }

  async function manejarCerrarSesion() {
    try {
      await cerrarSesion();
    } finally {
      setPantallaActual('inicio');
      sessionStorage.removeItem('pantallaActualSGGDIS');
    }
  }

  if (!sesion) {
    return <PantallaLogin onIniciarSesion={manejarIniciarSesion} />;
  }

  if (sesion.rol === 'Administrador') {
    return <PanelAdministrador correoAdministrador={sesion.correo} onCerrarSesion={manejarCerrarSesion} />;
  }

  if (sesion.rol !== 'Inspector') {
    return (
      <main className="login-page">
        <section className="login-panel" aria-labelledby="perfil-pendiente-titulo">
          <header className="login-brand">
            <div className="login-brand__seal" />
            <p className="login-brand__name">MINISTERIO DE SALUD · COSTA RICA</p>
            <h1 id="perfil-pendiente-titulo">Perfil pendiente</h1>
            <p className="login-brand__subtitle">El espacio para el rol {sesion.rol} aún no está disponible. Contacte al Administrador.</p>
          </header>
          <button className="login-submit" type="button" onClick={manejarCerrarSesion}>Cerrar sesión</button>
        </section>
      </main>
    );
  }

  if (pantallaActual === 'inicio') {
    return (
      <PantallaInicio
        onNuevaInspeccion={() => setPantallaActual('inspeccion')}
        // Historial y Reportes aún no tienen pantallas asociadas.
        onHistorial={() => {
          console.log('Historial pendiente de implementar');
        }}
        onReportes={() => {
          console.log('Reportes pendiente de implementar');
        }}
        onCerrarSesion={manejarCerrarSesion}
      />
    );
  }

  return (
    <InspeccionModulo
      onVolverInicio={() => setPantallaActual('inicio')}
      areaAsignada={sesion.idArea ? {
        idArea: sesion.idArea,
        codigoRegion: sesion.codigoRegion,
        codigoArea: sesion.codigoArea,
        nombreRegion: sesion.nombreRegion,
        nombreArea: sesion.nombreArea,
      } : null}
    />
  );
}

export default App;