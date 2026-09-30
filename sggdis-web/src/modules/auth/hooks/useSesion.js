import { useAuth } from './useAuth';

export function useSesion() {
  return useAuth().sesion;
}