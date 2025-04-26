const { app, BrowserWindow, dialog, ipcMain } = require('electron');
const path = require('path');
const fs = require('fs-extra');
const { exec } = require('child_process');

let mainWindow;

const csharpExeName = 'TicketPrinter.exe';
const getExePath = () => {
  if (!app.isPackaged) {
    return path.join(__dirname, 'src/server', csharpExeName);
  } else {
    return path.join(process.resourcesPath, csharpExeName);
  }
};

function formatTicket(data) {
  return [
    '===========================',
    '      LOTERÍA NACIONAL     ',
    '===========================',
    '',
    `Número:   ${data.number || '000000'}`,
    `Fecha:    ${data.date || new Date().toLocaleString()}`,
    `Sorteo:   ${data.game || 'LOTTO'}`,
    `Valor:    $${(data.amount || '2.00').padStart(7)}`,
    '',
    '===========================',
    '       ¡BUENA SUERTE!      ',
    '',
    '',
  ].join('\r\n');
}

async function printWithCSharpIPC(ticketContent) {
  // FIX for no-async-promise-executor: Usar IIFE asíncrona
  return new Promise((resolve, reject) => {
    (async () => {
      // <<< Inicio de IIFE async
      const exePath = getExePath();
      const tempDir = path.join(app.getPath('temp'), 'printer-electron-temp');
      const tempFile = path.join(tempDir, `ticket_${Date.now()}.txt`);

      try {
        await fs.ensureDir(tempDir);
        await fs.writeFile(tempFile, ticketContent, 'utf8');

        const command = `"${exePath}" "${tempFile}"`;
        console.log(`Executing command: ${command}`);

        exec(command, async (error, stdout, stderr) => {
          console.log('C# Output:', stdout);
          console.error('C# Error Output:', stderr);

          try {
            await fs.remove(tempFile);
          } catch (delError) {
            console.error(`Error deleting temp file ${tempFile}:`, delError);
          }

          if (error) {
            reject(
              new Error(
                `Error executing C#: ${error.message}. Stderr: ${stderr || 'N/A'}`
              )
            );
          } else if (stderr) {
            if (!stdout || !stdout.includes('SUCCESS')) {
              reject(new Error(`C# reported an error: ${stderr}`));
            } else {
              resolve(stdout);
            }
          } else if (stdout.includes('ERROR')) {
            reject(new Error(stdout.replace(/ERROR.*?:/, '').trim()));
          } else if (stdout.includes('SUCCESS')) {
            resolve(stdout);
          } else {
            reject(new Error(`Unknown C# output: ${stdout || 'No output'}`));
          }
        });
      } catch (err) {
        reject(new Error(`Setup error before printing: ${err.message}`));
        try {
          await fs.remove(tempFile);
        } catch (_ignoreError) {
          /* Ignorar error */
        }
      }
    })(); // <<< Fin de IIFE async
  });
}

ipcMain.handle('print-ticket', async (event, ticketData) => {
  console.log('Received print request with data:', ticketData);
  try {
    const ticketContent = formatTicket(ticketData);
    console.log('Formatted Ticket:\n', ticketContent);
    const result = await printWithCSharpIPC(ticketContent);
    console.log('Printing Result:', result);
    return { success: true, message: result };
  } catch (error) {
    console.error('IPC Print Error:', error);
    return {
      success: false,
      error: error.message || 'Error desconocido durante la impresión.',
    };
  }
});

function verifyCSharpComponent() {
  const exePath = getExePath();
  try {
    fs.accessSync(exePath, fs.constants.R_OK | fs.constants.X_OK);
    console.log(`Componente C# verificado en: ${exePath}`);
    return true;
  } catch (_error) {
    // FIX for no-unused-vars: Renombrar a _error
    dialog.showErrorBox(
      'Componente Faltante',
      `${csharpExeName} no encontrado o sin permisos en:\n${exePath}\n\nPor favor, reinstale la aplicación.`
    );
    return false;
  }
}

function createWindow() {
  if (!verifyCSharpComponent()) {
    app.quit();
    return;
  }

  mainWindow = new BrowserWindow({
    width: 800,
    height: 600,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      sandbox: true, // O false si causa problemas con child_process
      preload: path.join(__dirname, 'preload.js'),
    },
  });

  if (app.isPackaged) {
    const indexPath = path.join(process.resourcesPath, 'app', 'index.html');
    console.log('Loading production frontend from:', indexPath);
    if (fs.existsSync(indexPath)) {
      mainWindow.loadFile(indexPath);
    } else {
      dialog.showErrorBox(
        'Error de Carga',
        `Archivo principal no encontrado:\n${indexPath}\n\n` +
          `Verifique la configuración de 'extraResources' en package.json y que 'npm run build:react' se haya ejecutado correctamente antes de empaquetar.`
      );
      app.quit();
    }
  } else {
    console.log('Loading development frontend from: http://localhost:5173');
    mainWindow.loadURL('http://localhost:5173');
    mainWindow.webContents.openDevTools();
  }
}

app.whenReady().then(() => {
  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});
