# Printer Electron - Sistema de impresión de tickets 🖨️

Aplicación de escritorio multiplataforma (con enfoque principal en Windows para la impresión) construida con Electron y React para la impresión rápida de tickets/recibos en impresoras térmicas (o la impresora predeterminada del sistema).

## ✨ Características

* Interfaz simple: Interfaz de usuario creada con React y Vite.
* Impresión rápida: Permite imprimir un ticket de ejemplo con un clic o un atajo de teclado (`Ctrl+Shift+L`).
* Impresora predeterminada: Utiliza automáticamente la impresora predeterminada configurada en Windows.
* Componente nativo: Se apoya en un pequeño ejecutable C# para interactuar directamente con la API de impresión de Windows, asegurando compatibilidad con diversas impresoras.
* Comunicación segura: Usa el modelo de IPC de Electron (`contextBridge`, `ipcRenderer`, `ipcMain`) para comunicar la interfaz con la lógica del sistema de forma segura.
* Empaquetado: Configurado con `electron-builder` para generar instaladores.
* Calidad de código: Configurado con ESLint y Prettier para mantener un código limpio y consistente.

## 🚀 Tecnologías utilizadas

* Electron: Framework para crear aplicaciones de escritorio con tecnologías web.
* Node.js: Entorno de ejecución para el proceso principal de Electron y scripts.
* React: Librería para construir la interfaz de usuario.
* Vite: Herramienta de frontend para el servidor de desarrollo y compilación de React (rápido HMR).
* C# (.NET): Utilizado para el componente `TicketPrinter.exe` que interactúa con la API de impresión nativa de Windows (`System.Drawing.Printing`).
* CSS3: Para estilos básicos.
* Electron Builder: Herramienta para empaquetar y crear instaladores.
* ESLint: Para análisis estático y detección de errores en JavaScript/JSX.
* Prettier: Para formateo automático de código.
* concurrently: Para ejecutar múltiples scripts (servidor Vite y Electron) en desarrollo.
* wait-on: Para sincronizar el inicio de Electron con la disponibilidad del servidor Vite.

## 🏗️ Arquitectura

La aplicación sigue la arquitectura estándar de Electron con separación de procesos:

1.  Proceso renderer (UI - `src/react-ui/`):
    * Interfaz de usuario React que se ejecuta en la ventana.
    * Captura eventos del usuario (clic en botón, atajo).
    * Llama a `window.electronAPI.printTicket()` (expuesto por Preload).
    * Actualiza la UI con el estado/resultado de la impresión.
2.  Script preload (`preload.js`):
    * Puente seguro entre Renderer y Main Process.
    * Usa `contextBridge` para exponer `electronAPI`.
    * Usa `ipcRenderer.invoke` para enviar mensajes al Main Process.
3.  Proceso principal (Main Process - `main.js`):
    * Orquesta la aplicación (ventanas, ciclo de vida).
    * Escucha mensajes IPC con `ipcMain.handle`.
    * Contiene la lógica Node.js:
        * Formatea los datos del ticket.
        * Crea/elimina archivos temporales.
        * Ejecuta `TicketPrinter.exe` (`child_process.exec`).
        * Procesa la salida del ejecutable C#.
    * Envía la respuesta de vuelta al Renderer Process.
4.  Componente C# (`TicketPrinter.exe`):
    * Proceso externo invocado por el Main Process.
    * Recibe la ruta del archivo temporal.
    * Interactúa con la API de impresión de Windows (`System.Drawing.Printing`).
    * Envía el trabajo a la impresora predeterminada.
    * Reporta éxito o error vía `stdout`/`stderr`.

## 🛠️ Prerrequisitos

Antes de empezar, asegúrate de tener instalado:

* Node.js: (v18.x o superior recomendado) - Verifica con `node -v`.
* npm (o `yarn` / `pnpm`): Administrador de paquetes de Node.js (viene con Node). Verifica con `npm -v`.
* SDK de .NET o Build Tools de Visual Studio: Necesario para compilar el archivo C# (`TicketPrinter.cs`) usando `csc.exe`. Asegúrate de que `csc.exe` esté en el PATH de tu sistema o ejecuta los comandos desde un "Developer Command Prompt for VS".
* Git: Para clonar el repositorio.

## ⚙️ Instalación y configuración (desarrollo)

1.  Clonar el repositorio:
    ```bash
    git clone <URL_DEL_REPOSITORIO>
    cd printer-electron
    ```

2.  Instalar dependencias (raíz): Instala Electron, Electron Builder, linters, etc.
    ```bash
    npm install
    # o: yarn install / pnpm install
    ```

3.  Instalar dependencias (React UI): Instala React, Vite y sus dependencias.
    ```bash
    cd src/react-ui
    npm install
    # o: yarn install / pnpm install
    cd ../..
    ```

4.  Compilar componente C#:
    * Navega a la carpeta del servidor:
        ```bash
        cd src/server
        ```
    * Compila el archivo C# (asegúrate de tener `csc.exe` en tu PATH o usa un terminal de desarrollador de VS):
        ```bash
        csc /out:TicketPrinter.exe TicketPrinter.cs
        ```
    * Verifica que se haya creado `TicketPrinter.exe` en la carpeta `src/server`.
    * Regresa a la raíz del proyecto:
        ```bash
        cd ../..
        ```

## 📜 Scripts disponibles

Estos comandos se ejecutan desde la raíz del proyecto (`printer-electron`).

* `npm run dev`
    * Principal comando para desarrollo. Inicia el servidor de desarrollo de Vite (con HMR) y la aplicación Electron simultáneamente, esperando a que Vite esté listo antes de lanzar Electron. La ventana de Electron cargará la interfaz desde Vite.

* `npm run package`
    * Crea el paquete/instalador distribuible de la aplicación. Primero ejecuta `build:react` y luego `build` (electron-builder). El resultado estará en la carpeta `dist/`.

* `npm run build:react`
    * Ejecuta `vite build` dentro de `src/react-ui` para generar la versión estática y optimizada de la interfaz en `src/react-ui/dist/`. Necesario antes de `package`.

* `npm run lint`
    * Ejecuta ESLint en los archivos `.js` de la raíz del proyecto (ej: `main.js`, `preload.js`) usando la configuración `eslint.config.js` principal.

* `npm run format`
    * Ejecuta Prettier para formatear automáticamente el código en la raíz del proyecto (JS, JSON, MD, CSS).

* `npm run lint:react`
    * Ejecuta ESLint dentro de la carpeta `src/react-ui` para analizar el código React (`.js`, `.jsx`) usando la configuración `src/react-ui/eslint.config.js`.

* `npm run format:react`
    * Ejecuta Prettier dentro de la carpeta `src/react-ui` para formatear el código React y otros archivos relacionados.

* `npm start`
    * Ejecuta `electron .`. En el contexto actual, se comportará igual que `npm run dev:electron`, intentando cargar desde Vite si no está empaquetado. No está diseñado para iniciar el servidor Node.js si se usara la arquitectura anterior. Su uso principal sería probar la app con la build estática (requiere pasos adicionales) o ejecutar la app empaquetada desde la línea de comandos (menos común).

## 💻 Flujo de trabajo de desarrollo

1.  Asegúrate de haber compilado el C# (`TicketPrinter.exe` debe existir en `src/server`).
2.  Ejecuta `npm run dev` desde la raíz del proyecto.
3.  Se abrirá la ventana de Electron cargando la interfaz desde Vite.
4.  Realiza cambios en el código React (`src/react-ui/src`) y se reflejarán automáticamente (HMR).
5.  Realiza cambios en el código Electron (`main.js`, `preload.js`) y necesitarás detener (`Ctrl+C`) y reiniciar `npm run dev`.
6.  Usa las Herramientas de Desarrollador de Chrome (se abren automáticamente en modo dev) para depurar el código React (Renderer Process).
7.  Usa `console.log` en `main.js`/`preload.js` para ver mensajes en la terminal donde ejecutaste `npm run dev`.

## 📦 Compilación y empaquetado

1.  Asegúrate de que todo funcione correctamente en modo desarrollo.
2.  Ejecuta `npm run package` desde la raíz.
3.  Esto compilará la UI de React y luego usará `electron-builder` para crear el instalador/paquete en la carpeta `dist/`.
4.  Importante: Desinstala cualquier versión anterior de la aplicación antes de instalar la nueva versión generada.
5.  Instala y prueba la aplicación desde el archivo generado en `dist/`.

## 📁 Estructura de carpetas (principales)

* `/` (Raíz del proyecto `printer-electron`)
    * `dist/`: Salida de `electron-builder` (instaladores generados).
    * `node_modules/`: Dependencias de Node.js para el proyecto raíz y Electron.
    * `public/`: Archivos estáticos globales para Electron (ej: icono `.ico`).
    * `src/`: Carpeta principal del código fuente.
        * `react-ui/`: Código fuente del proyecto de la interfaz (React + Vite).
            * `dist/`: Salida de `npm run build:react` (build estático de React).
            * `node_modules/`: Dependencias específicas para React/Vite.
            * `public/`: Archivos estáticos para Vite (ej: `vite.svg`).
            * `src/`: Código fuente React (componentes `jsx`, `css`, etc.).
            * `eslint.config.js`: Configuración de ESLint para React.
            * `package.json`: Scripts y dependencias de `react-ui`.
            * `vite.config.js`: Configuración de Vite.
        * `server/`: Componente de impresión C#.
            * `TicketPrinter.cs`: Código fuente C#.
    * `.editorconfig`: Reglas de estilo de código para editores.
    * `eslint.config.js`: Configuración de ESLint para el proceso principal/preload.
    * `main.js`: Punto de entrada del Proceso Principal de Electron.
    * `preload.js`: Script de Preload para comunicación segura IPC.
    * `package.json`: Configuración general del proyecto, scripts y dependencias raíz.
    * `README.md`: Este archivo de documentación.

##  💅 Linting y formato

* Usa `npm run lint` y `npm run lint:react` para verificar errores de código.
* Usa `npm run format` y `npm run format:react` para formatear el código automáticamente con Prettier.
* Se recomienda configurar tu editor para que use ESLint y Prettier automáticamente al guardar.
* El archivo `.editorconfig` ayuda a mantener estilos básicos consistentes entre editores.

## ⚠️ Posibles problemas

* Error `El cliente no dispone de un privilegio requerido` durante `npm run package` en Windows: Se debe a que `electron-builder` necesita crear enlaces simbólicos. Solución: Ejecuta el comando (`npm run package`) en un terminal abierto como Administrador o [habilita el Modo Desarrollador en Windows](https://docs.microsoft.com/es-es/windows/apps/get-started/enable-your-device-for-development).
* Warning `Content Security Policy` en consola de Electron (modo dev): Es normal en desarrollo al cargar desde `localhost` o usar ciertas herramientas. Desaparece en la versión empaquetada. Se puede configurar una [CSP](https://www.electronjs.org/docs/latest/tutorial/security#7-define-a-content-security-policy) más estricta si es necesario.
* `TicketPrinter.exe` no encontrado: Asegúrate de haber compilado el archivo `TicketPrinter.cs` correctamente y que el `.exe` resultante esté en la carpeta `src/server/`. Verifica la configuración `extraFiles` en `package.json` para el empaquetado.
* Impresión no funciona: verifica que la impresora predeterminada de Windows esté configurada correctamente y sea compatible con impresión directa de texto (como las térmicas). Revisa la salida de `TicketPrinter.exe` en la consola donde ejecutaste `npm run dev` para ver mensajes de "SUCCESS" o "ERROR".
