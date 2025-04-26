import { useEffect, useState } from 'react';
import './App.css';

function App() {
  const [status, setStatus] = useState('');

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.ctrlKey && e.shiftKey && e.key === 'L') {
        e.preventDefault();
        handlePrint();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const handlePrint = async () => {
    setStatus('Preparando impresión...');
    try {
      const ticketData = {
        number: Math.random().toString().slice(2, 8),
        date: new Date().toLocaleString(),
        game: 'LOTTO',
        amount: '2.00',
      };

      setStatus('Enviando a impresora...');

      // Llamada a través de IPC (preload.js)
      // La API está disponible en window.electronAPI gracias a contextBridge
      if (
        window.electronAPI &&
        typeof window.electronAPI.printTicket === 'function'
      ) {
        const response = await window.electronAPI.printTicket(ticketData);
        console.log('Response from main process:', response);

        if (response.success) {
          const successMsg =
            response.message && response.message.includes('SUCCESS:')
              ? response.message.replace('SUCCESS:', '').trim()
              : 'Ticket enviado correctamente';
          setStatus(successMsg);
        } else {
          // Mostrar el mensaje de error específico devuelto por el proceso principal
          setStatus(`Error: ${response.error || 'Error desconocido'}`);
        }
      } else {
        throw new Error(
          'La API de Electron (electronAPI.printTicket) no está disponible. Verifica preload.js y la configuración de la ventana principal.'
        );
      }

      // Limpiar mensaje después de un tiempo
      setTimeout(() => setStatus(''), 5000);
    } catch (error) {
      console.error('Error en handlePrint:', error);
      // Mostrar el mensaje de error capturado
      let errorMessage = error.message || 'Ocurrió un error inesperado.';
      // Simplificar el mensaje de error mostrado al usuario
      if (errorMessage.includes('Failed to execute'))
        errorMessage = 'Error al ejecutar el componente de impresión.';
      if (errorMessage.includes('No se encontró impresora'))
        errorMessage = 'No se encontró una impresora utilizable.';
      if (errorMessage.includes('INVALID_PRINTER'))
        errorMessage = 'Problema con la impresora seleccionada.';
      if (errorMessage.includes('FILE_NOT_FOUND'))
        errorMessage = 'Error interno: no se pudo crear el archivo temporal.';

      setStatus(`Error grave: ${errorMessage}`);
      // Loguear detalles completos en la consola para depuración
      console.error('Detalles del error:', {
        message: error.message,
        stack: error.stack,
      });
    }
  };

  return (
    <div className="App">
      <header className="App-header">
        <h1>Sistema de Lotería</h1>

        <button onClick={handlePrint} className="print-button">
          Imprimir Ticket (Ctrl+Shift+L)
        </button>

        {/* Mostrar estado/errores */}
        {status && (
          <div
            className={`status-message ${status.startsWith('Error') ? 'error' : 'success'}`}
          >
            {status}
          </div>
        )}

        <div className="instructions">
          <p>
            Atajo de teclado: <strong>Ctrl + Shift + L</strong>
          </p>
          <p>
            Se usará la impresora predeterminada de Windows o la primera
            disponible.
          </p>
        </div>
      </header>
    </div>
  );
}

export default App;
