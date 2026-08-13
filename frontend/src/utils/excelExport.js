import XLSX from 'xlsx-js-style';

const COLOR_PRIMARIO = '1E6F5C';
const COLOR_TEXTO_ENCABEZADO = 'FFFFFF';
const COLOR_CEBRA = 'EAF2EF';
const COLOR_BORDE = 'D9DEE3';

const BORDE_FINO = { style: 'thin', color: { rgb: COLOR_BORDE } };
const TODOS_LOS_BORDES = { top: BORDE_FINO, bottom: BORDE_FINO, left: BORDE_FINO, right: BORDE_FINO };

// Formatos de número de Excel reutilizables (el texto entre comillas se imprime tal cual)
export const FORMATO_COLONES = '"₡"#,##0.00';
export const FORMATO_ENTERO = '#,##0';
export const FORMATO_CANTIDAD = '#,##0.###';

// Crea una hoja con título, encabezados en verde con texto blanco, bordes,
// filas alternadas y formato numérico real (no solo texto) en las columnas indicadas.
function crearHojaEstilada(titulo, headers, rows, formatos = []) {
  const datos = [[titulo], headers, ...rows];
  const ws = XLSX.utils.aoa_to_sheet(datos);
  const numCols = headers.length;

  if (numCols > 1) {
    ws['!merges'] = [{ s: { r: 0, c: 0 }, e: { r: 0, c: numCols - 1 } }];
  }

  const refTitulo = XLSX.utils.encode_cell({ r: 0, c: 0 });
  ws[refTitulo].s = {
    font: { bold: true, sz: 14, color: { rgb: COLOR_PRIMARIO } },
    alignment: { vertical: 'center' },
  };

  for (let c = 0; c < numCols; c++) {
    const ref = XLSX.utils.encode_cell({ r: 1, c });
    ws[ref].s = {
      font: { bold: true, color: { rgb: COLOR_TEXTO_ENCABEZADO } },
      fill: { fgColor: { rgb: COLOR_PRIMARIO } },
      alignment: { horizontal: 'center', vertical: 'center' },
      border: TODOS_LOS_BORDES,
    };
  }

  rows.forEach((_, r) => {
    const filaHoja = r + 2;
    const esImpar = r % 2 === 1;
    for (let c = 0; c < numCols; c++) {
      const ref = XLSX.utils.encode_cell({ r: filaHoja, c });
      if (!ws[ref]) continue;
      ws[ref].s = {
        fill: esImpar ? { fgColor: { rgb: COLOR_CEBRA } } : undefined,
        border: TODOS_LOS_BORDES,
        alignment: { horizontal: formatos[c] ? 'right' : 'left', vertical: 'center' },
      };
      if (formatos[c]) ws[ref].z = formatos[c];
    }
  });

  ws['!cols'] = headers.map((h, c) => {
    const maxLen = Math.max(h.length, ...rows.map((row) => String(row[c] ?? '').length), 8);
    return { wch: Math.min(maxLen + 2, 42) };
  });

  ws['!rows'] = [{ hpt: 22 }, { hpt: 20 }];

  return ws;
}

export function crearLibroEstilado() {
  const wb = XLSX.utils.book_new();
  return {
    wb,
    agregarHoja(nombre, titulo, headers, rows, formatos) {
      const ws = crearHojaEstilada(titulo, headers, rows, formatos);
      XLSX.utils.book_append_sheet(wb, ws, nombre.slice(0, 31));
    },
    descargar(nombreArchivo) {
      XLSX.writeFile(wb, nombreArchivo);
    },
  };
}
