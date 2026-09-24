import { useEffect, useState } from 'react';
import { crearActaGeneral, guardarInfoGeneral } from '../services/actaGeneralService';
import { validarInfoGeneral } from '../domain/validacionInfoGeneral';
import { APARTADOS_ACTA } from '../config/actaGeneral';

// Fecha/hora del dispositivo en el momento en que se abre el acta, en el
// formato que esperan los inputs nativos <input type="date"/"time">.
function obtenerFechaHoraActual() {
  const ahora = new Date();
  const dosDigitos = (numero) => String(numero).padStart(2, '0');

  return {
    fecha: `${ahora.getFullYear()}-${dosDigitos(ahora.getMonth() + 1)}-${dosDigitos(ahora.getDate())}`,
    hora: `${dosDigitos(ahora.getHours())}:${dosDigitos(ahora.getMinutes())}`,
  };
}

function crearInfoGeneralInicial() {
  const { fecha, hora } = obtenerFechaHoraActual();

  return {
    fechaInspeccion: fecha,
    horaInicio: hora,
    numeroExpediente: '',
    numeroDenuncia: '',
    nombreComercial: '',
    provincia: '',
    canton: '',
    distrito: '',
    direccionExacta: '',
    telefonoContacto: '',
    correoNotificaciones: '',
    // null = todavía sin marcar; el inspector debe elegir explícitamente Sí o No.
    autorizaIngreso: null,
    autorizaFotos: null,
  };
}

// Maneja el ciclo de vida del Acta General: la crea en el backend al entrar,
// guarda el estado del Apartado I (Información General) y controla en qué
// apartado del wizard está parado el usuario.
export function useActaGeneral() {
  const [idActa, setIdActa] = useState(null);
  const [numeroActa, setNumeroActa] = useState(null);
  const [creando, setCreando] = useState(true);
  const [errorCreacion, setErrorCreacion] = useState(null);

  const [apartadoActivo, setApartadoActivo] = useState('info-general');
  const [infoGeneral, setInfoGeneral] = useState(crearInfoGeneralInicial);
  const [infoGeneralTocado, setInfoGeneralTocado] = useState(false);
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
    setInfoGeneral((actual) => {
      const siguiente = { ...actual, [campo]: valor };

      // Provincia → cantón → distrito son selects en cascada (mismo patrón
      // que Dirección Regional → Área Rectora): si se cambia un nivel, los
      // niveles que dependen de él ya no son válidos y hay que limpiarlos.
      if (campo === 'provincia') {
        siguiente.canton = '';
        siguiente.distrito = '';
      } else if (campo === 'canton') {
        siguiente.distrito = '';
      }

      return siguiente;
    });

    setInfoGeneralTocado(true);
    setErroresInfoGeneral((actuales) => {
      if (!actuales[campo]) return actuales;
      const resto = { ...actuales };
      delete resto[campo];
      return resto;
    });
  };

  // Valida y guarda el apartado que se está abandonando. Devuelve true si se
  // puede salir de él. Al entrar al acta no se asume que el inspector va a
  // llenar Info General primero: mientras no toque ningún campo, puede
  // saltar libremente a cualquier otro apartado. La obligatoriedad solo se
  // exige una vez que efectivamente empezó a llenarla.
  const validarYGuardarApartadoActivo = async () => {
    if (apartadoActivo !== 'info-general' || !infoGeneralTocado) {
      // Los demás apartados (HU-007 a HU-011) todavía no tienen formulario
      // real, así que por ahora no hay nada que validar para salir de ellos.
      return true;
    }

    const errores = validarInfoGeneral(infoGeneral);
    setErroresInfoGeneral(errores);

    if (Object.keys(errores).length > 0 || !idActa) {
      return false;
    }

    setGuardando(true);
    setErrorGuardado(null);

    try {
      await guardarInfoGeneral(idActa, infoGeneral);
      return true;
    } catch (error) {
      setErrorGuardado(error.message);
      return false;
    } finally {
      setGuardando(false);
    }
  };

  // El inspector puede moverse libremente entre apartados (no solo al
  // siguiente), pero para abandonar el apartado en el que está parado,
  // primero debe completarlo: se valida/guarda antes de cambiar la pestaña.
  const irAApartado = async (idDestino) => {
    if (idDestino === apartadoActivo) return true;

    const puedeSalir = await validarYGuardarApartadoActivo();
    if (!puedeSalir) return false;

    setApartadoActivo(idDestino);
    return true;
  };

  // Botón "Siguiente →": avanza al que sigue en el orden del wizard.
  const avanzarAlSiguienteApartado = () => {
    const indiceActual = APARTADOS_ACTA.findIndex((apartado) => apartado.id === apartadoActivo);
    const siguiente = APARTADOS_ACTA[indiceActual + 1];
    return siguiente ? irAApartado(siguiente.id) : Promise.resolve(false);
  };

  // Botón "← Anterior": retrocede al apartado previo. Igual que avanzar, pasa
  // por irAApartado, así que si el apartado activo ya se empezó a llenar,
  // primero se valida/guarda antes de dejarlo.
  const retrocederAlApartadoAnterior = () => {
    const indiceActual = APARTADOS_ACTA.findIndex((apartado) => apartado.id === apartadoActivo);
    const anterior = APARTADOS_ACTA[indiceActual - 1];
    return anterior ? irAApartado(anterior.id) : Promise.resolve(false);
  };

  return {
    idActa,
    numeroActa,
    creando,
    errorCreacion,

    apartadoActivo,
    irAApartado,

    infoGeneral,
    erroresInfoGeneral,
    actualizarCampoInfoGeneral,

    guardando,
    errorGuardado,
    avanzarAlSiguienteApartado,
    retrocederAlApartadoAnterior,
  };
}
