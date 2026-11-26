const ExcelJS = require("exceljs");
const PDFDocument = require("pdfkit");

const AZUL = "FF312E81";

function formatear(valor, tipo) {
  if (valor === null || valor === undefined) return "";
  if (tipo === "moneda") return `Q${Number(valor).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  if (tipo === "fecha") {
    const d = new Date(valor);
    return isNaN(d) ? String(valor) : d.toLocaleString("es-GT", { dateStyle: "short", timeStyle: "short" });
  }
  return String(valor);
}

// columnas: [{ header, key, width, tipo: 'texto' | 'numero' | 'moneda' | 'fecha' }]
async function generarExcel({ titulo, subtitulo, resumen = [], columnas, filas }) {
  const wb = new ExcelJS.Workbook();
  wb.creator = "Sistema de Farmacias";
  wb.created = new Date();
  const ws = wb.addWorksheet("Reporte", { views: [{ state: "frozen", ySplit: 4 + resumen.length }] });

  const ultimaCol = columnas.length;
  ws.mergeCells(1, 1, 1, ultimaCol);
  ws.getCell(1, 1).value = titulo;
  ws.getCell(1, 1).font = { bold: true, size: 16, color: { argb: AZUL } };
  ws.mergeCells(2, 1, 2, ultimaCol);
  ws.getCell(2, 1).value = subtitulo;
  ws.getCell(2, 1).font = { italic: true, color: { argb: "FF6B7280" } };

  resumen.forEach((linea, i) => {
    ws.mergeCells(3 + i, 1, 3 + i, ultimaCol);
    ws.getCell(3 + i, 1).value = linea;
    ws.getCell(3 + i, 1).font = { bold: true };
  });

  const filaEncabezado = 4 + resumen.length;
  columnas.forEach((c, i) => {
    const cel = ws.getCell(filaEncabezado, i + 1);
    cel.value = c.header;
    cel.font = { bold: true, color: { argb: "FFFFFFFF" } };
    cel.fill = { type: "pattern", pattern: "solid", fgColor: { argb: AZUL } };
    cel.alignment = { vertical: "middle" };
    ws.getColumn(i + 1).width = c.width || 18;
  });

  filas.forEach((f, idx) => {
    const fila = ws.getRow(filaEncabezado + 1 + idx);
    columnas.forEach((c, i) => {
      const cel = fila.getCell(i + 1);
      const v = f[c.key];
      if (c.tipo === "fecha" && v) {
        cel.value = new Date(v);
        cel.numFmt = "dd/mm/yyyy hh:mm";
      } else if (c.tipo === "moneda") {
        cel.value = v === null || v === undefined ? null : Number(v);
        cel.numFmt = '"Q"#,##0.00';
      } else if (c.tipo === "numero") {
        cel.value = v === null || v === undefined ? null : Number(v);
      } else {
        cel.value = v === null || v === undefined ? "" : String(v);
      }
      if (idx % 2 === 1) cel.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFF5F3FF" } };
    });
  });

  ws.autoFilter = { from: { row: filaEncabezado, column: 1 }, to: { row: filaEncabezado, column: ultimaCol } };
  return Buffer.from(await wb.xlsx.writeBuffer());
}

function generarPDF({ titulo, subtitulo, resumen = [], columnas, filas }) {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ size: "LETTER", layout: "landscape", margin: 40, bufferPages: true });
    const partes = [];
    doc.on("data", (c) => partes.push(c));
    doc.on("end", () => resolve(Buffer.concat(partes)));
    doc.on("error", reject);

    const margen = 40;
    const anchoUtil = doc.page.width - margen * 2;
    const sumaAnchos = columnas.reduce((a, c) => a + (c.width || 18), 0);
    const anchos = columnas.map((c) => ((c.width || 18) / sumaAnchos) * anchoUtil);
    const limiteInferior = () => doc.page.height - 55;

    // Encabezado del documento
    doc.rect(0, 0, doc.page.width, 6).fill("#4f46e5");
    doc.fillColor("#312e81").font("Helvetica-Bold").fontSize(18).text(titulo, margen, 28);
    doc.fillColor("#6b7280").font("Helvetica-Oblique").fontSize(9.5).text(subtitulo, margen, doc.y + 2);
    if (resumen.length) {
      doc.moveDown(0.6);
      doc.fillColor("#1e2432").font("Helvetica-Bold").fontSize(10.5);
      resumen.forEach((l) => doc.text(l, margen));
    }
    doc.moveDown(0.8);

    const dibujarEncabezadoTabla = (y) => {
      doc.rect(margen, y, anchoUtil, 22).fill("#312e81");
      let x = margen;
      doc.fillColor("#ffffff").font("Helvetica-Bold").fontSize(9);
      columnas.forEach((c, i) => {
        const derecha = c.tipo === "moneda" || c.tipo === "numero";
        doc.text(c.header, x + 5, y + 7, { width: anchos[i] - 10, lineBreak: false, ellipsis: true, align: derecha ? "right" : "left" });
        x += anchos[i];
      });
      return y + 22;
    };

    let y = dibujarEncabezadoTabla(doc.y);
    doc.font("Helvetica").fontSize(9);

    filas.forEach((fila, idx) => {
      const celdas = columnas.map((c) => formatear(fila[c.key], c.tipo));
      const alturas = celdas.map((t, i) => doc.heightOfString(t, { width: anchos[i] - 10 }));
      const alto = Math.max(...alturas, 11) + 10;

      if (y + alto > limiteInferior()) {
        doc.addPage();
        doc.rect(0, 0, doc.page.width, 6).fill("#4f46e5");
        y = dibujarEncabezadoTabla(30);
        doc.font("Helvetica").fontSize(9);
      }

      if (idx % 2 === 1) doc.rect(margen, y, anchoUtil, alto).fill("#f5f3ff");
      let x = margen;
      doc.fillColor("#1e2432");
      celdas.forEach((t, i) => {
        const derecha = columnas[i].tipo === "moneda" || columnas[i].tipo === "numero";
        doc.text(t, x + 5, y + 5, { width: anchos[i] - 10, align: derecha ? "right" : "left" });
        x += anchos[i];
      });
      y += alto;
    });

    if (filas.length === 0) {
      doc.fillColor("#6b7280").text("No hay registros para mostrar.", margen + 5, y + 8);
    }

    // Pie de pagina con numeracion
    const rango = doc.bufferedPageRange();
    for (let i = 0; i < rango.count; i++) {
      doc.switchToPage(rango.start + i);
      doc.page.margins.bottom = 0; // evita que el pie genere una pagina nueva
      doc.fillColor("#9aa1bd").font("Helvetica").fontSize(8.5)
        .text(`Sistema de Farmacias  ·  Página ${i + 1} de ${rango.count}`, margen, doc.page.height - 30, {
          width: anchoUtil, align: "center", lineBreak: false,
        });
    }
    doc.end();
  });
}

module.exports = { generarExcel, generarPDF };
