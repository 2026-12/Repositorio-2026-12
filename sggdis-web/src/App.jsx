import { useEffect, useState } from 'react'; 
import PantallaInicio from './components/PantallaInicio'; 
import { InspeccionModulo, existeProgresoGuardado } from './modules/inspecciones'; 

// Orden Sanitaria
import OrdenSanitariaModulo from './modules/ordenSanitaria/OrdenSanitariaModulo';
import { existeProgresoOrdenSanitaria } from './modules/ordenSanitaria/services/progresoOrdenSanitariaService';

// ============================================================
// SOLO PARA PRUEBAS DE ORDEN SANITARIA.
// ELIMINAR ESTE OBJETO CUANDO SE CONECTE LA INSPECCIÓN REAL.
//
// IMPORTANTE:
// Cambiar idInspeccion por un ID REAL que exista en la base de datos.
// Los demás datos son únicamente para poder probar visualmente el flujo.
// ============================================================
const INSPECCION_PRUEBA_ORDEN_SANITARIA = {
  idInspeccion: 1, // <-- CAMBIAR POR UN ID REAL DE INS_INSPECCION
  consecutivo: 'MS-DRRSC-ARS-G-AI-0009-2026',
  nombreEstablecimiento: 'Soda Purris',
  nombrePersonaNotificar: 'Juan Pérez',
  identificacionPersonaNotificar: '1-1111-1111',
  tipoEstablecimiento: 'Soda, Restaurante o Bar con servicio Express',
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

        // Abre temporalmente Orden Sanitaria con la inspección de prueba.
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

  // ============================================================
  // SOLO PARA PRUEBAS DE ORDEN SANITARIA.
  // Cuando se conecte la Orden con una inspección real,
  // se deberá eliminar INSPECCION_PRUEBA_ORDEN_SANITARIA
  // y pasar aquí la inspección seleccionada/correspondiente.
  // ============================================================
  if (pantallaActual === 'ordenSanitaria') {
    return (
      <OrdenSanitariaModulo
        inspeccionRelacionada={INSPECCION_PRUEBA_ORDEN_SANITARIA}
        onVolverInicio={() => setPantallaActual('inicio')}
      />
    );
  }
 
  return ( 
    <InspeccionModulo onVolverInicio={() => setPantallaActual('inicio')} /> 
  ); 
} 
 
export default App;