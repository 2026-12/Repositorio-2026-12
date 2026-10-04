import { useNavigate } from 'react-router-dom';
import { useAuth } from '../modules/auth';

export function useCerrarSesionNavegando() {
  const { cerrarSesion } = useAuth();
  const navigate = useNavigate();

  return async function manejarCierreSesion() {
    try {
      await cerrarSesion();
    } finally {
      void navigate('/login', { replace: true });
    }
  };
}