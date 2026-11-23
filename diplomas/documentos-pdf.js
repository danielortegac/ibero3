/* Documentos públicos generados para la credencial seleccionada. */
(() => {
  'use strict';

  const rutaModulo = document.currentScript.src;
  const plantillas = new Map();
  let cargaMotor;

  function webUrl(value) {
    if (!value) throw new Error('Falta la dirección del documento.');
    const url = new URL(value, document.baseURI);
    if (!['https:', 'http:'].includes(url.protocol)) throw new Error('La dirección del documento no es válida.');
    return url.href;
  }

  function documento(opciones) {
    if (!window.jspdf?.jsPDF) throw new Error('No se pudo cargar el generador de PDF.');
    return new window.jspdf.jsPDF({ unit: 'pt', compress: true, putOnlyUsedFonts: true, ...opciones });
  }

  async function diploma(record) {
    const respuesta = await fetch(webUrl(record.url), { credentials: 'omit' });
    if (!respuesta.ok) throw new Error('No se pudo cargar la imagen original del diploma.');
    const bytes = new Uint8Array(await respuesta.arrayBuffer());
    const firma = [137, 80, 78, 71, 13, 10, 26, 10];
    if (bytes.length < 33 || !firma.every((b, i) => b === bytes[i])) {
      throw new Error('El archivo del diploma no es una imagen PNG válida.');
    }
    const cabecera = new DataView(bytes.buffer);
    const anchoImagen = cabecera.getUint32(16);
    const altoImagen = cabecera.getUint32(20);
    if (!anchoImagen || !altoImagen) throw new Error('El diploma no tiene dimensiones válidas.');
    const escala = 842 / Math.max(anchoImagen, altoImagen);
    const ancho = anchoImagen * escala;
    const alto = altoImagen * escala;
    const pdf = documento({ format: [ancho, alto], orientation: ancho > alto ? 'landscape' : 'portrait' });
    pdf.setProperties({ title: 'Diploma · ' + record.nombre, subject: record.curso, author: 'Centro IBEROamericano' });
    pdf.addImage(bytes, 'PNG', 0, 0, ancho, alto, undefined, 'FAST');
    return pdf.output('blob');
  }

  function cargarMotorInforme() {
    if (window.PDFLib) return Promise.resolve(window.PDFLib);
    if (!cargaMotor) {
      cargaMotor = new Promise((resolve, reject) => {
        const script = document.createElement('script');
        script.src = new URL('./vendor/pdf-lib.min.js', rutaModulo).href;
        script.onload = () => resolve(window.PDFLib);
        script.onerror = () => reject(new Error('No se pudo cargar el generador del informe.'));
        document.head.append(script);
      }).catch(error => {
        cargaMotor = undefined;
        throw error;
      });
    }
    return cargaMotor;
  }

  function plantilla(archivo) {
    if (!plantillas.has(archivo)) {
      const datos = fetch(new URL('./assets/' + archivo, rutaModulo)).then(respuesta => {
        if (!respuesta.ok) throw new Error('No se pudo cargar el formato oficial del informe.');
        return respuesta.arrayBuffer();
      }).catch(error => {
        plantillas.delete(archivo);
        throw error;
      });
      plantillas.set(archivo, datos);
    }
    return plantillas.get(archivo);
  }

  // Geometría del formato Carta aprobado. Las coordenadas se expresan en puntos PDF.
  function escribirCampo(pagina, fuente, valor, centro, lineasMaximas, color) {
    const ancho = 318.8;
    const palabras = String(valor).trim().split(/\s+/);
    let puntos = 12;
    let lineas;
    do {
      lineas = [];
      let linea = '';
      for (const palabra of palabras) {
        const siguiente = linea ? linea + ' ' + palabra : palabra;
        if (linea && fuente.widthOfTextAtSize(siguiente, puntos) > ancho) {
          lineas.push(linea);
          linea = palabra;
        } else {
          linea = siguiente;
        }
      }
      lineas.push(linea);
      if (lineas.length <= lineasMaximas && lineas.every(l => fuente.widthOfTextAtSize(l, puntos) <= ancho)) break;
      puntos -= 0.25;
    } while (puntos > 4);
    const paso = puntos * 1.125;
    const y = centro + (lineas.length - 1) * paso / 2;
    lineas.forEach((linea, indice) => {
      pagina.drawText(linea, { x: 232.42, y: y - indice * paso, size: puntos, font: fuente, color });
    });
  }

  async function informe(record) {
    const enlace = webUrl(record.permalink);
    const esIA = /\b(inteligencia artificial|ia|ai)\b/i.test(record.curso);
    const archivo = esIA ? 'plantilla-informe-ibero.pdf' : 'plantilla-informe-general.pdf';
    const [lib, bytes] = await Promise.all([cargarMotorInforme(), plantilla(archivo)]);
    const pdf = await lib.PDFDocument.load(bytes, { updateMetadata: false });
    pdf.setTitle('Informe de verificación del diploma · ' + record.nombre);
    pdf.setAuthor('Centro IBEROamericano (IBERO)');
    pdf.setSubject(record.curso);
    const pagina = pdf.getPages()[0];
    const normal = await pdf.embedFont(lib.StandardFonts.Helvetica);
    const negrita = await pdf.embedFont(lib.StandardFonts.HelveticaBold);
    const mono = await pdf.embedFont(lib.StandardFonts.CourierBold);
    const color = (r, g, b) => lib.rgb(r / 255, g / 255, b / 255);
    const gris = color(113, 113, 122);
    const fecha = new Intl.DateTimeFormat('es-EC', { dateStyle: 'long', timeZone: 'America/Guayaquil' }).format(new Date());
    const etiqueta = 'Fecha de consulta: ';
    const xFecha = 567 - normal.widthOfTextAtSize(fecha, 10);
    pagina.drawText(etiqueta, { x: xFecha - negrita.widthOfTextAtSize(etiqueta, 10), y: 711.75, font: negrita, size: 10, color: gris });
    pagina.drawText(fecha, { x: xFecha, y: 711.75, font: normal, size: 10, color: gris });

    let curso = record.curso;
    if (record.fechaFin && !curso.includes(record.fechaFin)) curso += ' · Finalizado el ' + record.fechaFin;
    escribirCampo(pagina, negrita, record.nombre.toLocaleUpperCase('es'), 423.75, 2, color(9, 9, 11));
    escribirCampo(pagina, negrita, curso, 384, 3, color(107, 33, 168));
    escribirCampo(pagina, mono, record.id, 343.5, 2, color(22, 101, 52));
    const vinculo = pdf.context.obj({
      Type: 'Annot', Subtype: 'Link', F: 4, Border: [0, 0, 0], Rect: [63, 126.75, 222.75, 138],
      A: { Type: 'Action', S: 'URI', URI: lib.PDFString.of(enlace) }
    });
    pagina.node.addAnnot(pdf.context.register(vinculo));
    return new Blob([await pdf.save()], { type: 'application/pdf' });
  }

  window.iberoDiplomaPdf = { diploma, informe };
})();
