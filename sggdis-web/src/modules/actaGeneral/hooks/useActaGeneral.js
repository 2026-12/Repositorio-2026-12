import { useEffect, useState } from 'react';
import {
  crearActaGeneral,
  guardarInfoGeneral,
  guardarResponsable,
} from '../services/actaGeneralService';
import { validarInfoGeneral } from '../domain/validacionInfoGeneral';
import { validarResponsable } from '../domain/validacionResponsable';
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

function crearResponsableInicial() {
  return {
    nombreResponsable: '',
    // null = todavía sin marcar; ninguna opción de cargo debe salir preseleccionada.
    cargoResponsable: null,
    cargoResponsableOtro: '',
    numeroIdentificacionResponsable: '',
  };
}

// Maneja el ciclo de vida del Acta General: la crea en el backend al entrar,
// guarda el estado de cada apartado del wizard y controla en cuál está
// parado el usuario. Cada apartado con formulario real (Info General,
// Responsable, y los que se vayan sumando en HU-008 a HU-011) tiene su propio
// trío de estado (datos, tocado, errores); validarYGuardarApartadoActivo los
// consulta a través de un mapa en vez de repetir el mismo bloque por cada uno.
export function useActaGeneral() {
  const [idActa, setIdActa] = useState(null);
  const [numeroActa, setNumeroActa] = useState(null);
  const [creando, setCreando] = useState(true);
  const [errorCreacion, setErrorCreacion] = useState(null);

  const [apartadoActivo, setApartadoActivo] = useState('info-general');
  const [guardando, setGuardando] = useState(false);
  const [errorGuardado, setErrorGuardado] = useState(null);

  const [infoGeneral, setInfoGeneral] = useState(crearInfoGeneralInicial);
  const [infoGeneralTocado, setInfoGeneralTocado] = useState(false);
  const [erroresInfoGeneral, setErroresInfoGeneral] = useState({});

  const [responsable, setResponsable] = useState(crearResponsableInicial);
  const [responsableTocado, setResponsableTocado] = useState(false);
  const [erroresResponsable, setErroresResponsable] = useState({});

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

  const actualizarCampoResponsable = (campo, valor) => {
    setResponsable((actual) => {
      const siguiente = { ...actual, [campo]: valor };

      // Si deja de elegir "Otro" como cargo, el texto libre que había
      // escrito ya no aplica.
      if (campo === 'cargoResponsable' && valor !== 'OTRO') {
        siguiente.cargoResponsableOtro = '';
      }

      return siguiente;
    });

    setResponsableTocado(true);
    setErroresResponsable((actuales) => {
      if (!actuales[campo]) return actuales;
      const resto = { ...actuales };
      delete resto[campo];
      return resto;
    });
  };

  // Un solo lugar donde vive, por cada apartado con formulario real, qué
  // datos tiene, si el inspector ya lo empezó a llenar, cómo se valida y
  // cómo se guarda. Agregar un apartado nuevo (HU-008 en adelante) es sumar
  // una entrada acá, no repetir el try/catch de guardado otra vez.
  const configuracionApartados = {
    'info-general': {
      datos: infoGeneral,
      tocado: infoGeneralTocado,
      validar: validarInfoGeneral,
      setErrores: setErroresInfoGeneral,
      guardar: (datos) => guardarInfoGeneral(idActa, datos),
    },
    responsable: {
      datos: responsable,
      tocado: responsableTocado,
      validar: validarResponsable,
      setErrores: setErroresResponsable,
      guardar: (datos) => guardarResponsable(idActa, datos),
    },
  };

  // Valida y guarda el apartado que se está abandonando. Devuelve true si se
  // puede salir de él. Al entrar al acta no se asume que el inspector va a
  // llenar el apartado activo por defecto: mientras no toque ningún campo,
  // puede saltar libremente a cualquier otro. La obligatoriedad solo se
  // exige una vez que efectivamente empezó a llenarlo.
  const validarYGuardarApartadoActivo = async () => {
    const configuracion = configuracionApartados[apartadoActivo];

    if (!configuracion || !configuracion.tocado) {
      // Los apartados que todavía no tienen formulario real (HU-008 a
      // HU-011) no están en el mapa, así que por ahora no hay nada que
      // validar para salir de ellos.
      return true;
    }

    const errores = configuracion.validar(configuracion.datos);
    configuracion.setErrores(errores);

    if (Object.keys(errores).length > 0 || !idActa) {
      return false;
    }

    setGuardando(true);
    setErrorGuardado(null);

    try {
      await configuracion.guardar(configuracion.datos);
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

    responsable,
    erroresResponsable,
    actualizarCampoResponsable,

    guardando,
    errorGuardado,
    avanzarAlSiguienteApartado,
    retrocederAlApartadoAnterior,
  };
}
