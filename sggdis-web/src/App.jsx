import { useEffect, useState } from 'react';
import PantallaInicio from './components/PantallaInicio';
import { InspeccionModulo, existeProgresoGuardado } from './modules/inspecciones';
import { ActaGeneralModulo } from './modules/actaGeneral';

// Orden Sanitaria
import OrdenSanitariaModulo from './modules/ordenSanitaria/OrdenSanitariaModulo';
import { existeProgresoOrdenSanitaria } from './modules/ordenSanitaria/services/progresoOrdenSanitariaService';

// DATOS DE PRUEBA TEMPORALES PARA PROBAR LA ORDEN SANITARIA
const inspeccionPruebaOrdenSanitaria = {
  idInspeccion: 1,// se coloca lo que genera el select 
  consecutivo: 'MS-DRRSCS-ARS-SJ-AI-0002-2026',
  nombreEstablecimiento: 'Restaurante El Buen Sabor',
  nombrePersonaNotificar: 'Juan Carlos Rodríguez Mora',
  identificacionPersonaNotificar: '1-1234-5678',
  tipoEstablecimiento: 'Servicio de Alimentación al Público',
};

// Componente raíz de la aplicación: solo decide qué pantalla mostrar (menú
// de inicio o el módulo de inspecciones). Todo el estado y flujo interno de
// una inspección vive dentro de InspeccionModulo.
function App() {
  // Si hay una inspección a medias guardada en localStorage, se retoma
  // directo ahí; si no, se recuerda en qué pantalla estaba el usuario o se
  // empieza desde el inicio.
  const [pantallaActual, setPantallaActual] = useState(() => {
    const pantallaGuardada =
      sessionStorage.getItem('pantallaActualSGGDIS');

    // Si se estaba trabajando específicamente en una Orden Sanitaria
    // y existe progreso local, se recupera al refrescar la página.
    if (
      pantallaGuardada === 'ordenSanitaria' &&
      existeProgresoOrdenSanitaria()
    ) {
      return 'ordenSanitaria';
    }

    if (existeProgresoGuardado()) {
      return 'inspeccion';
    }

    // Si existe una Orden Sanitaria pendiente y no hay una inspección
    // activa, se recupera también al volver a abrir la aplicación.
    if (existeProgresoOrdenSanitaria()) {
      return 'ordenSanitaria';
    }

    return pantallaGuardada ?? 'inicio';
  });

  // Recuerda en qué pantalla está el usuario, para poder restaurarla si recarga la página.
  useEffect(() => {
    sessionStorage.setItem('pantallaActualSGGDIS', pantallaActual);
  }, [pantallaActual]);

  if (pantallaActual === 'inicio') {
    return (
      <PantallaInicio
        onNuevaInspeccion={() => setPantallaActual('inspeccion')}
        onActaGeneral={() => setPantallaActual('actaGeneral')}
        onOrdenSanitaria={() => setPantallaActual('ordenSanitaria')}
        // Historial, Reportes y Cerrar sesión: pendiente conectarlos a algo real.
        onHistorial={() => {
          console.log('Historial pendiente de implementar');
        }}
        onReportes={() => {
          console.log('Reportes pendiente de implementar');
        }}
        onCerrarSesion={() => {
          console.log('Cerrar sesión pendiente de conectar');
        }}
      />
    );
  }

  if (pantallaActual === 'actaGeneral') {
    return (
      <ActaGeneralModulo onVolverInicio={() => setPantallaActual('inicio')} />
    );
  }

  if (pantallaActual === 'ordenSanitaria') {
    return (
      <OrdenSanitariaModulo
        // DATOS DE PRUEBA TEMPORALES PARA PROBAR LA ORDEN SANITARIA
        idInspeccion={inspeccionPruebaOrdenSanitaria.idInspeccion}
        inspeccionRelacionada={inspeccionPruebaOrdenSanitaria}
        onVolverInicio={() => setPantallaActual('inicio')}
      />
    );
  }

  return (
    <InspeccionModulo onVolverInicio={() => setPantallaActual('inicio')} />
  );
}

export default App;