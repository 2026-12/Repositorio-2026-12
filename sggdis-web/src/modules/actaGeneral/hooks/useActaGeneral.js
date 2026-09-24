import { useEffect, useState } from 'react';
import { crearActaGeneral, guardarInfoGeneral } from '../services/actaGeneralService';
import { validarInfoGeneral } from '../domain/validacionInfoGeneral';

const INFO_GENERAL_INICIAL = {
  fechaInspeccion: '',
  horaInicio: '',
  numeroExpediente: '',
  numeroDenuncia: '',
  nombreComercial: '',
  provincia: '',
  canton: '',
  distrito: '',
  direccionExacta: '',
  telefonoContacto: '',
  correoNotificaciones: '',
  autorizaIngreso: true,
  autorizaFotos: true,
};

// Maneja el ciclo de vida del Acta General: la crea en el backend al entrar,
// guarda el estado del Apartado I (Información General) y controla en qué
// apartado del wizard está parado el usuario.
export function useActaGeneral() {
  const [idActa, setIdActa] = useState(null);
  const [numeroActa, setNumeroActa] = useState(null);
  const [creando, setCreando] = useState(true);
  const [errorCreacion, setErrorCreacion] = useState(null);

  const [apartadoActivo, setApartadoActivo] = useState('info-general');
  const [infoGeneral, setInfoGeneral] = useState(INFO_GENERAL_INICIAL);
  const [erroresInfoGeneral, setErroresInfoGeneral] = useState({});
  const [guardando, setGuardando] = useState(false);
  const [errorGuardado, setErrorGuardado] = useState(null);

  // Al montar el módulo se crea el acta en el backend (EN_PROCESO) y se le
  // asigna el folio; así el número de acta ya aparece en el encabezado
  // aunque el inspector todavía no haya llenado nada.
  useEffect(() => {
    let cancelado = false;

    (async () => {
      try {
        const acta = await crearActaGeneral();
        if (!cancelado) {
          setIdActa(acta.idActa);
          setNumeroActa(acta.numeroActa);
        }
      } catch (error) {
        if (!cancelado) {
          setErrorCreacion(error.message);
        }
      } finally {
        if (!cancelado) {
          setCreando(false);
        }
      }
    })();

    return () => {
      cancelado = true;
    };
  }, []);

  const actualizarCampoInfoGeneral = (campo, valor) => {
    setInfoGeneral((actual) => ({ ...actual, [campo]: valor }));
    setErroresInfoGeneral((actuales) => {
      if (!actuales[campo]) return actuales;
      const resto = { ...actuales };
      delete resto[campo];
      return resto;
    });
  };

  // Valida el Apartado I; si está completo lo guarda en el backend y avanza al siguiente.
  const guardarYAvanzar = async () => {
    const errores = validarInfoGeneral(infoGeneral);
    setErroresInfoGeneral(errores);

    if (Object.keys(errores).length > 0 || !idActa) {
      return false;
    }

    setGuardando(true);
    setErrorGuardado(null);

    try {
      await guardarInfoGeneral(idActa, infoGeneral);
      setApartadoActivo('responsable');
      return true;
    } catch (error) {
      setErrorGuardado(error.message);
      return false;
    } finally {
      setGuardando(false);
    }
  };

  return {
    idActa,
    numeroActa,
    creando,
    errorCreacion,

    apartadoActivo,
    setApartadoActivo,

    infoGeneral,
    erroresInfoGeneral,
    actualizarCampoInfoGeneral,

    guardando,
    errorGuardado,
    guardarYAvanzar,
  };
}
