import { useEffect, useState } from 'react';
import {
  crearActaGeneral,
  obtenerActaGeneral,
  guardarInfoGeneral,
  guardarResponsable,
  guardarMotivo,
  guardarHallazgos,
  guardarAcciones,
} from '../services/actaGeneralService';
import { obtenerActaActiva, guardarActaActiva } from '../services/progresoActaGeneralService';
import { validarInfoGeneral } from '../domain/validacionInfoGeneral';
import { validarResponsable } from '../domain/validacionResponsable';
import { validarMotivo } from '../domain/validacionMotivo';
import { validarHallazgos } from '../domain/validacionHallazgos';
import { validarAcciones } from '../domain/validacionAcciones';
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

function crearMotivoInicial() {
  return {
    // null = todavía sin marcar; ninguna opción de motivo debe salir preseleccionada.
    motivoInspeccion: null,
    motivoInspeccionOtro: '',
  };
}

function crearHallazgosIniciales() {
  return {
    // Ninguna guía sale preseleccionada: el inspector marca las que aplicó.
    idsGuias: [],
    hallazgos: '',
  };
}

function crearAccionesIniciales() {
  return {
    // Ninguna acción sale preseleccionada.
    acciones: [],
    motivoReprogramacion: '',
    accionOtro: '',
  };
}

// Convierte el "S"/"N" que guarda el backend a un booleano (o null si el
// campo todavía no se ha llenado), que es el formato que usa el formulario.
function mapearBooleanoSN(valor) {
  if (valor === 'S') return true;
  if (valor === 'N') return false;
  return null;
}

// Reconstruye el estado del Apartado I a partir del acta que devuelve el
// backend (GET /api/actas-generales/{id}), para restaurar el formulario si
// el inspector recarga la página en medio del llenado. Si el apartado nunca
// se llegó a guardar (el inspector no salió de él antes de recargar), se
// usa la fecha/hora del dispositivo, igual que al crear el acta por primera vez.
function mapearInfoGeneralDesdeActa(acta) {
  const { fecha, hora } = obtenerFechaHoraActual();

  return {
    fechaInspeccion: acta.fechaInspeccion ? acta.fechaInspeccion.slice(0, 10) : fecha,
    horaInicio: acta.horaInicio || hora,
    numeroExpediente: acta.numeroExpediente ?? '',
    numeroDenuncia: acta.numeroDenuncia ?? '',
    nombreComercial: acta.nombreComercial ?? '',
    provincia: acta.provincia ?? '',
    canton: acta.canton ?? '',
    distrito: acta.distrito ?? '',
    direccionExacta: acta.direccionExacta ?? '',
    telefonoContacto: acta.telefonoContacto ?? '',
    correoNotificaciones: acta.correoNotificaciones ?? '',
    autorizaIngreso: mapearBooleanoSN(acta.autorizaIngreso),
    autorizaFotos: mapearBooleanoSN(acta.autorizaFotos),
  };
}

// Reconstruye el estado del Apartado II a partir del acta guardada.
function mapearResponsableDesdeActa(acta) {
  return {
    nombreResponsable: acta.nombreResponsable ?? '',
    cargoResponsable: acta.cargoResponsable ?? null,
    cargoResponsableOtro: acta.cargoResponsableOtro ?? '',
    numeroIdentificacionResponsable: acta.numeroIdentificacionResponsable ?? '',
  };
}

// Reconstruye el estado del Apartado III a partir del acta guardada.
function mapearMotivoDesdeActa(acta) {
  return {
    motivoInspeccion: acta.motivoInspeccion ?? null,
    motivoInspeccionOtro: acta.motivoInspeccionOtro ?? '',
  };
}

// Reconstruye el estado del Apartado IV a partir del acta guardada. El
// backend guarda las guías como ids separados por coma ("1,3").
function mapearHallazgosDesdeActa(acta) {
  return {
    idsGuias: acta.guiasAplicables
      ? acta.guiasAplicables.split(',').map(Number).filter((id) => Number.isInteger(id) && id > 0)
      : [],
    hallazgos: acta.hallazgos ?? '',
  };
}

// Reconstruye el estado del Apartado V a partir del acta guardada. El
// backend guarda las acciones como códigos separados por coma
// ("ORDEN_SANITARIA,DECOMISO").
function mapearAccionesDesdeActa(acta) {
  return {
    acciones: acta.accionesSeguir ? acta.accionesSeguir.split(',').filter(Boolean) : [],
    motivoReprogramacion: acta.motivoReprogramacion ?? '',
    accionOtro: acta.accionOtro ?? '',
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

  const [motivo, setMotivo] = useState(crearMotivoInicial);
  const [motivoTocado, setMotivoTocado] = useState(false);
  const [erroresMotivo, setErroresMotivo] = useState({});

  const [hallazgos, setHallazgos] = useState(crearHallazgosIniciales);
  const [hallazgosTocado, setHallazgosTocado] = useState(false);
  const [erroresHallazgos, setErroresHallazgos] = useState({});

  const [acciones, setAcciones] = useState(crearAccionesIniciales);
  const [accionesTocado, setAccionesTocado] = useState(false);
  const [erroresAcciones, setErroresAcciones] = useState({});

  // Al montar el módulo, primero se revisa si ya había un acta en curso en
  // este navegador (localStorage): si la hay, se recupera del backend con
  // todos sus datos para no perder lo que el inspector ya había llenado al
  // recargar la página. Si no hay ninguna (o la guardada ya no existe en la
  // base de datos), se crea una acta nueva en EN_PROCESO y se le asigna el
  // folio, como antes.
  useEffect(() => {
    let cancelado = false;

    (async () => {
      try {
        const activaGuardada = obtenerActaActiva();
        let idActaFinal = null;
        let numeroActaFinal = null;
        let apartadoRestaurado = null;

        if (activaGuardada?.idActa) {
          try {
            const actaExistente = await obtenerActaGeneral(activaGuardada.idActa);

            if (actaExistente && actaExistente.estado !== 'FINALIZADA') {
              idActaFinal = actaExistente.idActa;
              numeroActaFinal = actaExistente.numeroActa;

              if (!cancelado) {
                setInfoGeneral(mapearInfoGeneralDesdeActa(actaExistente));
                setResponsable(mapearResponsableDesdeActa(actaExistente));
                setMotivo(mapearMotivoDesdeActa(actaExistente));
                setHallazgos(mapearHallazgosDesdeActa(actaExistente));
                setAcciones(mapearAccionesDesdeActa(actaExistente));
              }

              // Vuelve a dejar al inspector en el mismo apartado en el que
              // estaba, si sigue siendo uno válido.
              if (APARTADOS_ACTA.some((apartado) => apartado.id === activaGuardada.apartadoActivo)) {
                apartadoRestaurado = activaGuardada.apartadoActivo;
              }
            }
          } catch {
            // El acta guardada en este navegador ya no existe en el backend
            // (por ejemplo, se borró en la base de datos): se descarta y se
            // crea una nueva más abajo.
          }
        }

        if (!idActaFinal) {
          const actaNueva = await crearActaGeneral();
          idActaFinal = actaNueva.idActa;
          numeroActaFinal = actaNueva.numeroActa;
        }

        if (!cancelado) {
          setIdActa(idActaFinal);
          setNumeroActa(numeroActaFinal);
          if (apartadoRestaurado) {
            setApartadoActivo(apartadoRestaurado);
          }
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

  // Mantiene en localStorage cuál es el acta activa y en qué apartado quedó
  // el inspector, para poder retomarla si recarga la página en medio del
  // llenado. Se sincroniza cada vez que cambia el apartado activo.
  useEffect(() => {
    if (!idActa) return;
    guardarActaActiva({ idActa, apartadoActivo });
  }, [idActa, apartadoActivo]);

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

  const actualizarCampoMotivo = (campo, valor) => {
    setMotivo((actual) => {
      const siguiente = { ...actual, [campo]: valor };

      // Si deja de elegir "Otro" como motivo, el texto libre que había
      // escrito ya no aplica.
      if (campo === 'motivoInspeccion' && valor !== 'OTRO') {
        siguiente.motivoInspeccionOtro = '';
      }

      return siguiente;
    });

    setMotivoTocado(true);
    setErroresMotivo((actuales) => {
      if (!actuales[campo]) return actuales;
      const resto = { ...actuales };
      delete resto[campo];
      return resto;
    });
  };

  const actualizarCampoHallazgos = (campo, valor) => {
    setHallazgos((actual) => ({ ...actual, [campo]: valor }));

    setHallazgosTocado(true);
    setErroresHallazgos((actuales) => {
      if (!actuales[campo]) return actuales;
      const resto = { ...actuales };
      delete resto[campo];
      return resto;
    });
  };

  const actualizarCampoAcciones = (campo, valor) => {
    setAcciones((actual) => {
      const siguiente = { ...actual, [campo]: valor };

      // Si se desmarca Reprogramación u Otro, el texto que se había escrito
      // para esa acción ya no aplica (y deja de ser obligatorio).
      if (campo === 'acciones') {
        if (!valor.includes('REPROGRAMACION')) siguiente.motivoReprogramacion = '';
        if (!valor.includes('OTRO')) siguiente.accionOtro = '';
      }

      return siguiente;
    });

    setAccionesTocado(true);
    setErroresAcciones((actuales) => {
      // Al cambiar la selección también se limpian los errores de los textos
      // que dependen de ella, porque pueden haber dejado de aplicar.
      const camposALimpiar = campo === 'acciones'
        ? ['acciones', 'motivoReprogramacion', 'accionOtro']
        : [campo];
      if (!camposALimpiar.some((nombre) => actuales[nombre])) return actuales;
      const resto = { ...actuales };
      camposALimpiar.forEach((nombre) => delete resto[nombre]);
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
    motivo: {
      datos: motivo,
      tocado: motivoTocado,
      validar: validarMotivo,
      setErrores: setErroresMotivo,
      guardar: (datos) => guardarMotivo(idActa, datos),
    },
    hallazgos: {
      datos: hallazgos,
      tocado: hallazgosTocado,
      validar: validarHallazgos,
      setErrores: setErroresHallazgos,
      guardar: (datos) => guardarHallazgos(idActa, datos),
    },
    acciones: {
      datos: acciones,
      tocado: accionesTocado,
      validar: validarAcciones,
      setErrores: setErroresAcciones,
      guardar: (datos) => guardarAcciones(idActa, datos),
    },
  };

  // Indicador visual de progreso: para cada apartado con formulario real, dice
  // si ya está "completo" (sus campos obligatorios están llenos y son
  // válidos en este momento) o "pendiente". Es independiente de si el
  // inspector ya guardó o no ese apartado en el backend; solo mira si, tal
  // como está el formulario ahora mismo, pasaría la validación.
  const estadoApartados = Object.fromEntries(
    Object.entries(configuracionApartados).map(([id, configuracion]) => [
      id,
      Object.keys(configuracion.validar(configuracion.datos)).length === 0 ? 'completo' : 'pendiente',
    ])
  );

  // Valida y guarda el apartado que se está abandonando. Devuelve true si se
  // puede salir de él. Al entrar al acta no se asume que el inspector va a
  // llenar el apartado activo por defecto: mientras no toque ningún campo,
  // puede saltar libremente a cualquier otro. La obligatoriedad solo se
  // exige una vez que efectivamente empezó a llenarlo.
  const validarYGuardarApartadoActivo = async () => {
    const configuracion = configuracionApartados[apartadoActivo];

    if (!configuracion || !configuracion.tocado) {
      // Los apartados que todavía no tienen formulario real (HU-011) no
      // están en el mapa, así que por ahora no hay nada que validar para
      // salir de ellos.
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
    estadoApartados,

    infoGeneral,
    erroresInfoGeneral,
    actualizarCampoInfoGeneral,

    responsable,
    erroresResponsable,
    actualizarCampoResponsable,

    motivo,
    erroresMotivo,
    actualizarCampoMotivo,

    hallazgos,
    erroresHallazgos,
    actualizarCampoHallazgos,

    acciones,
    erroresAcciones,
    actualizarCampoAcciones,

    guardando,
    errorGuardado,
    avanzarAlSiguienteApartado,
    retrocederAlApartadoAnterior,
  };
}
