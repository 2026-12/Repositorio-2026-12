import { useEffect, useState } from 'react';
import AuthContext from '../context/AuthContext';
import {
  cerrarSesion,
  iniciarSesion,
  leerSesion,
  registrarUsuario,
  renovarSesion,
} from '../services/authService';

export function AuthProvider({ children }) {
  const [sesion, setSesion] = useState(leerSesion);

  useEffect(() => {
    const sincronizarSesion = () => setSesion(leerSesion());
    window.addEventListener('sggdis:session-changed', sincronizarSesion);
    if (!leerSesion()) renovarSesion().catch(() => {});
    return () => window.removeEventListener('sggdis:session-changed', sincronizarSesion);
  }, []);

  useEffect(() => {
    if (!sesion) return undefined;
    const tiempoHastaRenovacion = new Date(sesion.expira).getTime() - Date.now() - 60_000;
    const temporizador = window.setTimeout(() => renovarSesion().catch(() => {}), Math.max(0, tiempoHastaRenovacion));
    return () => window.clearTimeout(temporizador);
  }, [sesion]);

  return (
    <AuthContext.Provider value={{ sesion, iniciarSesion, registrarUsuario, cerrarSesion }}>
      {children}
    </AuthContext.Provider>
  );
}