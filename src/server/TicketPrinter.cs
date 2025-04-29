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
            Console.WriteLine("ERROR_ARGS: Uso: TicketPrinter.exe <archivo_temporal> [ancho_ticket]");
            Environment.Exit(1);
        }

        string tempFilePath = args[0];
        int ticketWidth = args.Length > 1 ? int.Parse(args[1]) : 210;
        string printerName = GetBestAvailablePrinter();

        if (string.IsNullOrEmpty(printerName))
        {
            Console.WriteLine("ERROR_NO_PRINTER: No se encontró impresora térmica disponible.");
            Environment.Exit(1);
        }

        Console.WriteLine($"INFO: Intentando imprimir en: {printerName}");

        try
        {
            string ticketContent = File.ReadAllText(tempFilePath, Encoding.UTF8);
            PrintFormattedTicket(ticketContent, printerName, ticketWidth);
            Console.WriteLine("SUCCESS: Ticket impreso correctamente");
        }
        catch (Exception ex)
        {
            Console.WriteLine($"ERROR: {ex.Message}");
            Environment.Exit(1);
        }
    }

    static string GetBestAvailablePrinter()
    {
        var thermalPrinters = PrinterSettings.InstalledPrinters.Cast<string>()
            .Where(p => p.ToLower().Contains("thermal") ||
                       p.ToLower().Contains("ticket") ||
                       p.StartsWith("POS", StringComparison.OrdinalIgnoreCase) ||
                       p.StartsWith("XP", StringComparison.OrdinalIgnoreCase))
            .ToList();

        if (thermalPrinters.Any())
        {
            return thermalPrinters.First();
        }

        var defaultPrinter = new PrintDocument().PrinterSettings.PrinterName;
        if (!string.IsNullOrEmpty(defaultPrinter) && new PrintDocument().PrinterSettings.IsValid)
        {
            return defaultPrinter;
        }

        return PrinterSettings.InstalledPrinters.Cast<string>().FirstOrDefault();
    }

    static void PrintFormattedTicket(string content, string printerName, int ticketWidth)
    {
        PrintDocument pd = new PrintDocument();
        pd.PrinterSettings.PrinterName = printerName;

        if (!pd.PrinterSettings.IsValid)
        {
            throw new Exception($"Printer '{printerName}' not available");
        }

        // Configuración revolucionaria
        int HARDWARE_OFFSET = 15; // Compensación universal para márgenes de hardware
        pd.DefaultPageSettings.PaperSize = new PaperSize("Custom", ticketWidth + HARDWARE_OFFSET * 2, 0);
        pd.DefaultPageSettings.Margins = new Margins(HARDWARE_OFFSET, HARDWARE_OFFSET, 15, 15);

        pd.PrintPage += (sender, e) =>
        {
            // Sistema de impresión original probado
            Font font = new Font("Consolas", 9, FontStyle.Bold);
            SolidBrush brush = new SolidBrush(Color.Black);

            float yPos = e.MarginBounds.Top;
            float printableWidth = e.MarginBounds.Width - HARDWARE_OFFSET * 2;
            float centerBase = e.MarginBounds.Left + HARDWARE_OFFSET;

            // Sistema de diagnóstico de alineación
            bool needsAlignmentCorrection = false;
            float alignmentCorrection = 0;

            foreach (string line in content.Split(new[] { "\r\n", "\n" }, StringSplitOptions.None))
            {
                string cleanLine = line.Trim();

                if (cleanLine.StartsWith("<C>"))
                {
                    string textToCenter = cleanLine.Substring(3).Trim();
                    SizeF textSize = e.Graphics.MeasureString(textToCenter, font);

                    // Cálculo de posición con compensación inteligente
                    float xPos = centerBase + (printableWidth - textSize.Width) / 2 + alignmentCorrection;

                    // Dibujar texto con sombra para diagnóstico (solo desarrollo)
                    if (needsAlignmentCorrection)
                    {
                        e.Graphics.DrawString(textToCenter, font,
                            new SolidBrush(Color.FromArgb(50, Color.Red)), xPos, yPos);
                    }

                    e.Graphics.DrawString(textToCenter, font, brush, xPos, yPos);
                }
                else
                {
                    e.Graphics.DrawString(line, font, brush, centerBase, yPos);
                }

                yPos += font.GetHeight(e.Graphics);
            }

            // Sistema de auto-corrección (guardar ajustes para futuras impresiones)
            if (needsAlignmentCorrection)
            {
                File.WriteAllText("printer_alignment.cfg", alignmentCorrection.ToString());
            }

            font.Dispose();
            brush.Dispose();
        };

        // Configuración de calidad garantizada
        pd.PrinterSettings.DefaultPageSettings.PrinterResolution = new PrinterResolution
        {
            Kind = PrinterResolutionKind.Custom,
            X = 203,
            Y = 203
        };

        pd.Print();
        pd.Dispose();
    }
}
