'use strict';

(() => {
  const root = document.getElementById('result-success');
  const byId = id => document.getElementById(id);
  const moduleUrl = document.currentScript.src;
  const tabs = [...root.querySelectorAll('[role="tab"]')];
  const feedback = byId('share-feedback');
  const qrDialog = byId('qr-dialog');
  const qrButton = byId('show-qr');
  const qrImage = byId('credential-qr');
  const reportDialog = byId('report-dialog');
  const reportButton = byId('enlarge-report');
  const reportImage = byId('report-image');
  const enlargedReportImage = byId('enlarged-report-image');
  const reportStatus = byId('report-status');
  const reportDialogStatus = byId('report-dialog-status');
  const copyDialog = byId('copy-dialog');
  const copyButton = byId('copy-link');
  const linkedinButton = byId('linkedin-btn');
  const dateFormat = new Intl.DateTimeFormat('es', { dateStyle: 'long', timeZone: 'UTC' });
  const scriptCache = new Map();
  let current;
  let pdfCache;
  let reportPreview;
  let notificationTimer;
  let copyTrigger;
  let touchStart;

  function loadScript(path) {
    if (!scriptCache.has(path)) {
      const pending = new Promise((resolve, reject) => {
        const script = document.createElement('script');
        script.src = new URL(path, moduleUrl).href;
        script.onload = resolve;
        script.onerror = () => {
          script.remove();
          reject(new Error('No se pudo cargar ' + path));
        };
        document.head.append(script);
      }).catch(error => {
        scriptCache.delete(path);
        throw error;
      });
      scriptCache.set(path, pending);
    }
    return scriptCache.get(path);
  }

  function activate(index, focus = false) {
    tabs.forEach((tab, position) => {
      const selected = position === index;
      tab.setAttribute('aria-selected', String(selected));
      tab.tabIndex = selected ? 0 : -1;
      byId(tab.getAttribute('aria-controls')).hidden = !selected;
    });
    if (focus) tabs[index].focus();
    if (index === 1 && current) showReport();
  }

  function notify(message) {
    clearTimeout(notificationTimer);
    feedback.textContent = message;
    notificationTimer = setTimeout(() => { feedback.textContent = ''; }, 5000);
  }

  function pdfFor(kind, record, cache) {
    if (!cache.has(kind)) {
      const scripts = [loadScript('./documentos-pdf.js')];
      if (kind === 'diploma') scripts.push(loadScript('./vendor/jspdf.umd.min.js'));
      const pending = Promise.all(scripts)
        .then(() => window.iberoDiplomaPdf[kind](record))
        .catch(error => {
          cache.delete(kind);
          throw error;
        });
      cache.set(kind, pending);
    }
    return cache.get(kind);
  }

  async function renderReport(record, cache) {
    const pdf = await pdfFor('informe', record, cache);
    const pdfjs = await import(new URL('./vendor/pdf.min.mjs', moduleUrl).href);
    pdfjs.GlobalWorkerOptions.workerSrc = new URL('./vendor/pdf.worker.min.mjs', moduleUrl).href;
    const task = pdfjs.getDocument({
      data: await pdf.arrayBuffer(),
      isEvalSupported: false,
      useSystemFonts: true
    });
    try {
      const pdfDocument = await task.promise;
      const page = await pdfDocument.getPage(1);
      const viewport = page.getViewport({ scale: 2.3 });
      const canvas = document.createElement('canvas');
      canvas.width = Math.ceil(viewport.width);
      canvas.height = Math.ceil(viewport.height);
      await page.render({ canvas, viewport }).promise;
      return canvas.toDataURL('image/png');
    } finally {
      await task.destroy();
    }
  }

  async function showReport() {
    if (!reportImage.hidden) return;
    const record = current;
    const pending = reportPreview ??= renderReport(record, pdfCache);
    reportStatus.textContent = 'Preparando el informe…';
    reportDialogStatus.textContent = reportStatus.textContent;
    try {
      const source = await pending;
      if (current !== record) return;
      for (const image of [reportImage, enlargedReportImage]) {
        image.src = source;
        image.hidden = false;
      }
      reportStatus.textContent = '';
      reportDialogStatus.textContent = '';
    } catch {
      if (current !== record) return;
      reportPreview = undefined;
      reportStatus.textContent = 'No se pudo mostrar el informe. Puedes descargar el PDF.';
      reportDialogStatus.textContent = reportStatus.textContent;
    }
  }

  async function downloadPdf(button) {
    const record = current;
    const kind = button.dataset.pdf;
    button.disabled = true;
    button.setAttribute('aria-busy', 'true');
    byId('download-feedback').textContent = 'Preparando el PDF…';
    try {
      const pdf = await pdfFor(kind, record, pdfCache);
      const url = URL.createObjectURL(pdf);
      const link = document.createElement('a');
      const title = kind === 'informe' ? 'Informe_de_verificacion' : 'Diploma';
      link.href = url;
      link.download = `${title}_IBERO_${record.id}.pdf`;
      document.body.append(link);
      link.click();
      link.remove();
      setTimeout(() => URL.revokeObjectURL(url), 30000);
      if (current === record) byId('download-feedback').textContent = 'PDF preparado.';
    } catch {
      if (current === record) notify('No se pudo preparar el PDF. Inténtalo de nuevo.');
    } finally {
      button.disabled = false;
      button.removeAttribute('aria-busy');
    }
  }

  async function copy(text, trigger, isLinkedin = false) {
    try {
      await navigator.clipboard.writeText(text);
      notify(isLinkedin ? 'Texto copiado. Pégalo en LinkedIn y adjunta tu diploma.' : 'Enlace público copiado.');
    } catch {
      copyTrigger = trigger;
      byId('copy-title').textContent = isLinkedin ? 'Texto para LinkedIn' : 'Enlace público de la credencial';
      byId('copy-instruction').textContent = isLinkedin ? 'Copia este texto y pégalo en LinkedIn.' : 'Selecciona y copia el enlace para compartir el registro de tu diploma.';
      const field = byId('share-fallback');
      field.value = text;
      if (!copyDialog.open) copyDialog.showModal();
      field.focus();
      field.select();
    }
  }

  async function openQr() {
    const record = current;
    qrDialog.showModal();
    try {
      await loadScript('./vendor/qrcode.js');
      if (current !== record) return;
      const qr = window.qrcode(0, 'M');
      qr.addData(record.permalink);
      qr.make();
      qrImage.src = qr.createDataURL(7, 28);
      qrImage.hidden = false;
    } catch {
      if (current === record) notify('No se pudo mostrar el QR. Puedes abrir el registro público desde aquí.');
    }
  }

  function show(record) {
    const date = /^\d{4}-\d{2}-\d{2}$/.test(record.fechaFin || '') ? new Date(record.fechaFin) : null;
    const fechaFin = date && !Number.isNaN(date.getTime()) ? dateFormat.format(date) : '';
    current = { ...record, fechaFin };
    pdfCache = new Map();
    reportPreview = undefined;
    for (const dialog of [qrDialog, reportDialog, copyDialog]) {
      if (dialog.open) dialog.close();
    }
    qrImage.removeAttribute('src');
    qrImage.hidden = true;
    for (const image of [reportImage, enlargedReportImage]) {
      image.removeAttribute('src');
      image.hidden = true;
      image.alt = 'Informe de verificación del diploma de ' + record.nombre;
    }
    reportStatus.textContent = '';
    reportDialogStatus.textContent = '';
    feedback.textContent = '';
    byId('download-feedback').textContent = '';
    const name = record.nombre || '';
    const course = record.curso || 'Credencial académica IBERO';
    for (const id of ['cert-student-name', 'qr-name', 'endorsement-name']) byId(id).textContent = name;
    for (const id of ['cert-course-name', 'endorsement-course']) byId(id).textContent = course;
    for (const id of ['student-id-display', 'qr-id']) byId(id).textContent = 'ID: ' + record.id;
    byId('credential-date').textContent = fechaFin;
    byId('credential-date-row').hidden = !fechaFin;
    const image = byId('diploma-image');
    image.alt = 'Diploma de ' + name;
    image.src = record.url;
    root.querySelector('.file-tools .open').href = record.url;
    byId('download-btn').href = record.url;
    byId('public-record').href = record.permalink;
    const historyLink = byId('back-to-list-btn');
    historyLink.hidden = !record.historyUrl;
    if (record.historyUrl) historyLink.href = record.historyUrl;
    else historyLink.removeAttribute('href');
    activate(0);
    byId('credential-heading').focus({ preventScroll: true });
  }

  tabs.forEach((tab, index) => {
    tab.addEventListener('click', () => activate(index));
    tab.addEventListener('keydown', event => {
      const next = { ArrowRight: 1 - index, ArrowLeft: 1 - index, Home: 0, End: 1 }[event.key];
      if (next === undefined) return;
      event.preventDefault();
      activate(next, true);
    });
  });
  const documents = root.querySelector('.documents');
  documents.addEventListener('touchstart', event => {
    const touch = event.touches[0];
    touchStart = event.touches.length === 1 && event.target.closest('.stage') ? touch : null;
  }, { passive: true });
  documents.addEventListener('touchmove', event => {
    if (event.touches.length !== 1) touchStart = null;
  }, { passive: true });
  documents.addEventListener('touchcancel', () => { touchStart = null; }, { passive: true });
  documents.addEventListener('touchend', event => {
    if (!touchStart || event.touches.length) return;
    const touch = event.changedTouches[0];
    const dx = touch.clientX - touchStart.clientX;
    const dy = touch.clientY - touchStart.clientY;
    if (Math.abs(dx) > 64 && Math.abs(dx) > 2 * Math.abs(dy)) activate(dx < 0 ? 1 : 0);
    touchStart = null;
  }, { passive: true });

  root.querySelectorAll('[data-pdf]').forEach(button => button.addEventListener('click', () => downloadPdf(button)));
  qrButton.addEventListener('click', openQr);
  qrDialog.addEventListener('close', () => qrButton.focus());
  reportButton.addEventListener('click', () => {
    reportDialog.showModal();
    showReport();
  });
  reportDialog.addEventListener('close', () => reportButton.focus());
  copyButton.addEventListener('click', () => copy(current.permalink, copyButton));
  copyDialog.addEventListener('close', () => copyTrigger?.focus());
  linkedinButton.addEventListener('click', () => {
    const post = [
      '🎓 ¡He completado un nuevo reto académico!',
      `Me emociona compartir que completé el programa «${current.curso}» del Centro IBEROamericano (IBERO).`,
      'Puedes verificar mi credencial IBERO aquí:\n' + current.permalink,
      '🚀 #IBERO #Educación #CrecimientoProfesional #LogroAcademico #Certificación'
    ].join('\n\n');
    copy(post, linkedinButton, true);
  });
  window.iberoCredential = { show };
})();
