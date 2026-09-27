/*import { useEffect, useState } from 'react';
import PantallaInicio from './components/PantallaInicio';
import { InspeccionModulo, existeProgresoGuardado } from './modules/inspecciones';

// Componente raíz de la aplicación: solo decide qué pantalla mostrar (menú
// de inicio o el módulo de inspecciones). Todo el estado y flujo interno de
// una inspección vive dentro de InspeccionModulo.
function App() {
  // Si hay una inspección a medias guardada en localStorage, se retoma
  // directo ahí; si no, se recuerda en qué pantalla estaba el usuario o se
  // empieza desde el inicio.
  const [pantallaActual, setPantallaActual] = useState(() => {
    if (existeProgresoGuardado()) {
      return 'inspeccion';
    }

    return sessionStorage.getItem('pantallaActualSGGDIS') ?? 'inicio';
  });

  // Recuerda en qué pantalla está el usuario, para poder restaurarla si recarga la página.
  useEffect(() => {
    sessionStorage.setItem('pantallaActualSGGDIS', pantallaActual);
  }, [pantallaActual]);

  if (pantallaActual === 'inicio') {
    return (
      <PantallaInicio
        onNuevaInspeccion={() => setPantallaActual('inspeccion')}
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

  return (
    <InspeccionModulo onVolverInicio={() => setPantallaActual('inicio')} />
  );
}

export default App;*/

/*--------------------------------------------------------------------------------------------------------------*/

import OrdenSanitariaModulo from './modules/ordenSanitaria/OrdenSanitariaModulo';

function App() {
  const inspeccionRelacionada = {
    idInspeccion: 3,
    consecutivo: 'MS-DRRSC-ARS-G-AI-0009-2026',
    nombreEstablecimiento: 'Soda Purris',
    nombrePersonaNotificar: 'Juan Pérez',
    identificacionPersonaNotificar: '1-1111-1111',
    tipoEstablecimiento: 'Soda, Restaurante o Bar con servicio Express',
  };

  const volverAlMenu = () => {
    console.log('Volver al menú principal');
  };

  const finalizarOrdenSanitaria = (respuesta) => {
    console.log('Orden Sanitaria registrada:', respuesta);
  };

  return (
    <OrdenSanitariaModulo
      idInspeccion={inspeccionRelacionada.idInspeccion}
      inspeccionRelacionada={inspeccionRelacionada}
      onVolverInicio={volverAlMenu}
      onFinalizar={finalizarOrdenSanitaria}
    />
  );
}

export default App;