using System;
using System.Drawing;
using System.Drawing.Printing;
using System.IO;
using System.Linq;
using System.Text;

class TicketPrinter
{
    static void Main(string[] args)
    {
        if (args.Length < 1)
        {
            Console.WriteLine("ERROR_ARGS: Uso: TicketPrinter.exe <archivo_temporal>");
            Environment.Exit(1);
        }

        string tempFilePath = args[0];
        string printerName = GetDefaultOrFirstPrinter(); // Obtenemos la impresora aquí

        if (string.IsNullOrEmpty(printerName))
        {
             Console.WriteLine("ERROR_NO_PRINTER: No se encontró impresora predeterminada o instalada.");
             Environment.Exit(1);
        }

        Console.WriteLine($"INFO: Intentando imprimir en: {printerName}");

        try
        {
            string ticketContent = File.ReadAllText(tempFilePath, Encoding.UTF8);
            PrintFormattedTicket(ticketContent, printerName);
            Console.WriteLine("SUCCESS: Ticket impreso correctamente");
        }
        catch (FileNotFoundException)
        {
             Console.WriteLine($"ERROR_FILE_NOT_FOUND: Archivo no encontrado en {tempFilePath}");
             Environment.Exit(1);
        }
        catch (InvalidPrinterException ex) // Captura error específico de impresora no válida/encontrada
        {
             Console.WriteLine($"ERROR_INVALID_PRINTER: Problema con la impresora '{printerName}'. Detalles: {ex.Message}");
             Environment.Exit(1);
        }
        catch (Exception ex)
        {
            Console.WriteLine($"ERROR_PRINTING: {ex.Message}");
            Environment.Exit(1);
        }
        finally
        {
            //
        }
    }

    static string GetDefaultOrFirstPrinter()
    {
        // 1. Intentar obtener la impresora predeterminada
        PrintDocument pd = new PrintDocument();
        if (pd.PrinterSettings.IsValid && !string.IsNullOrEmpty(pd.PrinterSettings.PrinterName))
        {
             // A veces la 'predeterminada' puede ser una impresora virtual como 'Microsoft Print to PDF'
             // Podríamos añadir lógica para filtrar, pero por simplicidad, usamos la que Windows considera default.
            return pd.PrinterSettings.PrinterName;
        }

        // 2. Si no hay predeterminada válida, buscar la primera instalada
        // (Esto es un fallback simple, podría mejorarse buscando impresoras 'POS', 'Ticket', etc. en el nombre)
        string firstPrinter = PrinterSettings.InstalledPrinters.Cast<string>().FirstOrDefault();
        return firstPrinter; // Puede ser null si no hay ninguna impresora instalada
    }


    static void PrintFormattedTicket(string content, string printerName)
    {
        PrintDocument pd = new PrintDocument();
        pd.PrinterSettings.PrinterName = printerName;

        // Verificar si la impresora seleccionada es válida ANTES de intentar usarla
        if (!pd.PrinterSettings.IsValid)
        {
            throw new Exception($"La impresora especificada '{printerName}' no es válida o no se encontró.");
        }

        // Configuración para impresora térmica (ajustar 'TicketWidth' si es necesario, e.g., 280 para 80mm, 210 para 58mm)
        const int TicketWidth = 280; // Ancho en puntos (aproximado para 80mm)
        pd.DefaultPageSettings.PaperSize = new PaperSize("Ticket", TicketWidth, 0); // Alto 0 para rollo continuo
        pd.DefaultPageSettings.Margins = new Margins(5, 5, 5, 5); // Pequeños márgenes

        pd.PrintPage += (sender, e) =>
        {
            // Usar fuente monoespaciada para mejor alineación
            // Probar diferentes fuentes si Courier New no está disponible o no se ve bien
            Font font = new Font("Consolas", 9); // Consolas suele ser una buena alternativa
             if (font.Name != "Consolas") // Fallback si Consolas no existe
             {
                 font = new Font("Courier New", 9);
             }

            float yPos = e.MarginBounds.Top;
            float leftMargin = e.MarginBounds.Left;
            float lineHeight = font.GetHeight(e.Graphics);
            float availableWidth = e.MarginBounds.Width;

            foreach (string line in content.Split(new[] { "\r\n", "\n" }, StringSplitOptions.None))
            {
                // Dibujar línea por línea
                 e.Graphics.DrawString(line, font, Brushes.Black, leftMargin, yPos, new StringFormat());
                yPos += lineHeight;
            }
             font.Dispose();
        };

        try
        {
            pd.Print();
        }
        catch (Exception ex)
        {
            throw new Exception($"Fallo durante el proceso de impresión en '{printerName}'. Detalles: {ex.Message}", ex);
        }
        finally
        {
            pd.Dispose();
        }
    }
}
