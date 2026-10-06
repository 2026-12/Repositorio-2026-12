# React + Vite

## Preparar el inspector para las pruebas Cypress

Con Vite y la API iniciados y una base de datos de desarrollo/pruebas, ejecuta
desde `sggdis-web`:

```powershell
$env:CYPRESS_ADMIN_CORREO = '<correo del administrador existente>'
$env:CYPRESS_ADMIN_CONTRASENA = '<contrasena del administrador>'
npx cypress run --spec "cypress\e2e\00-preparar-inspector.cy.js"
```

La prueba [00-preparar-inspector.cy.js](cypress/e2e/00-preparar-inspector.cy.js)
registra la cuenta compartida, le asigna rol Inspector y una region/area
existentes y comprueba el inicio de sesion. Reutiliza la cuenta si ya existe;
no cambia su contrasena ni elimina el usuario al terminar.

Usa las mismas credenciales que [loginInspector.js](cypress/support/loginInspector.js).
Para otra cuenta, configura `CYPRESS_INSPECTOR_CORREO` y
`CYPRESS_INSPECTOR_CONTRASENA` tanto al preparar como al ejecutar las demas
pruebas. No guardes credenciales reales en archivos versionados.
Despues ejecuta `npx cypress open` y selecciona las otras pruebas.
La preparacion requiere un administrador existente y catalogos de regiones
y areas; no crea administradores ni datos de catalogo. Si la cuenta ya existe
con otra contrasena o sin permisos suficientes, falla al verificar el login.

This template provides a minimal setup to get React working in Vite with HMR and some ESLint rules.

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react) uses [Oxc](https://oxc.rs)
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react-swc) uses [SWC](https://swc.rs/)

## React Compiler

The React Compiler is not enabled on this template because of its impact on dev & build performances. To add it, see [this documentation](https://react.dev/learn/react-compiler/installation).

## Expanding the ESLint configuration

If you are developing a production application, we recommend using TypeScript with type-aware lint rules enabled. Check out the [TS template](https://github.com/vitejs/vite/tree/main/packages/create-vite/template-react-ts) for information on how to integrate TypeScript and [`typescript-eslint`](https://typescript-eslint.io) in your project.
