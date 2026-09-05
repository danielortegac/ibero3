/**
 * IBERO — Programación académica pública 2026
 * Fuente única para el cambio automático de cohorte y el escenario de contingencia.
 */
(function () {
  'use strict';

  const TIME_ZONE = 'America/Guayaquil';
  const settings = window.IBERO_PROGRAMACION_CONFIG || {};
  const appsPostponed = settings.diplomadoAppsAplazado === true;

  const MONTHS = [
    'enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio',
    'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'
  ];
  const MONTHS_TITLE = MONTHS.map(month => month.charAt(0).toUpperCase() + month.slice(1));
  const MONTHS_SHORT = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic'];
  const MONTHS_TITLE_SHORT = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];

  const PROGRAMS = Object.freeze({
    marketing: Object.freeze({
      standard: Object.freeze([
        Object.freeze({ start: '2026-10-26', end: '2026-10-29' })
      ]),
      postponed: Object.freeze([
        Object.freeze({ start: '2026-10-05', end: '2026-10-08' })
      ])
    }),
    agents: Object.freeze({
      standard: Object.freeze([
        Object.freeze({ start: '2026-09-07', end: '2026-09-10' }),
        Object.freeze({ start: '2026-11-02', end: '2026-11-05' })
      ]),
      postponed: Object.freeze([
        Object.freeze({ start: '2026-09-07', end: '2026-09-10' }),
        Object.freeze({ start: '2026-10-12', end: '2026-10-15' })
      ])
    }),
    appsDiploma: Object.freeze({
      standard: Object.freeze({
        start: '2026-09-21',
        end: '2026-10-22',
        modules: Object.freeze([
          Object.freeze({ start: '2026-09-21', end: '2026-09-24' }),
          Object.freeze({ start: '2026-09-28', end: '2026-10-01' }),
          Object.freeze({ start: '2026-10-05', end: '2026-10-08' }),
          Object.freeze({ start: '2026-10-12', end: '2026-10-15' }),
          Object.freeze({ start: '2026-10-19', end: '2026-10-22' })
        ])
      }),
      postponed: Object.freeze({
        start: '2026-10-19',
        end: '2026-11-19',
        modules: Object.freeze([
          Object.freeze({ start: '2026-10-19', end: '2026-10-22' }),
          Object.freeze({ start: '2026-10-26', end: '2026-10-29' }),
          Object.freeze({ start: '2026-11-02', end: '2026-11-05' }),
          Object.freeze({ start: '2026-11-09', end: '2026-11-12' }),
          Object.freeze({ start: '2026-11-16', end: '2026-11-19' })
        ])
      })
    })
  });

  function parts(dateString) {
    const [year, month, day] = String(dateString).split('-').map(Number);
    return { year, month, day };
  }

  function todayString() {
    const out = new Intl.DateTimeFormat('es-EC', {
      timeZone: TIME_ZONE,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit'
    }).formatToParts(new Date()).reduce((acc, part) => {
      if (part.type !== 'literal') acc[part.type] = part.value;
      return acc;
    }, {});
    return `${out.year}-${out.month}-${out.day}`;
  }

  function scenarioKey() {
    return appsPostponed ? 'postponed' : 'standard';
  }

  function getCohorts(programKey) {
    const program = PROGRAMS[programKey];
    if (!program || programKey === 'appsDiploma') return [];
    return program[scenarioKey()].map(item => ({ ...item }));
  }

  function getDiplomaApps() {
    const source = PROGRAMS.appsDiploma[scenarioKey()];
    return {
      start: source.start,
      end: source.end,
      modules: source.modules.map(item => ({ ...item }))
    };
  }

  function getPublishedCohort(programKey, referenceDate = todayString()) {
    if (programKey === 'appsDiploma') return getDiplomaApps();
    const cohorts = getCohorts(programKey);
    if (!cohorts.length) return null;
    return cohorts.find(item => referenceDate <= item.end) || cohorts[cohorts.length - 1];
  }

  function formatRange(item, style = 'long') {
    if (!item) return 'Próxima cohorte por confirmar';
    const start = parts(item.start);
    const end = parts(item.end);
    const sameMonth = start.year === end.year && start.month === end.month;

    if (style === 'dash') {
      return sameMonth
        ? `${start.day}–${end.day} de ${MONTHS[start.month - 1]} de ${start.year}`
        : `${start.day} de ${MONTHS[start.month - 1]}–${end.day} de ${MONTHS[end.month - 1]} de ${end.year}`;
    }
    if (style === 'short') {
      return sameMonth
        ? `${start.day}–${end.day} ${MONTHS_SHORT[start.month - 1]} ${start.year}`
        : `${start.day} ${MONTHS_SHORT[start.month - 1]}–${end.day} ${MONTHS_SHORT[end.month - 1]} ${end.year}`;
    }
    if (style === 'badge') {
      return sameMonth
        ? `${start.day}–${end.day} ${MONTHS_TITLE_SHORT[start.month - 1]} ${start.year}`
        : `${start.day} ${MONTHS_TITLE_SHORT[start.month - 1]}–${end.day} ${MONTHS_TITLE_SHORT[end.month - 1]} ${end.year}`;
    }
    if (style === 'compact') {
      return sameMonth
        ? `${start.day}–${end.day} ${MONTHS[start.month - 1]} ${start.year}`
        : `${start.day} ${MONTHS[start.month - 1]}–${end.day} ${MONTHS[end.month - 1]} ${end.year}`;
    }
    if (style === 'noYear') {
      return sameMonth
        ? `${start.day} al ${end.day} de ${MONTHS[start.month - 1]}`
        : `${start.day} de ${MONTHS[start.month - 1]} al ${end.day} de ${MONTHS[end.month - 1]}`;
    }
    if (style === 'noYearDash') {
      return sameMonth
        ? `${start.day}–${end.day} de ${MONTHS[start.month - 1]}`
        : `${start.day} de ${MONTHS[start.month - 1]}–${end.day} de ${MONTHS[end.month - 1]}`;
    }
    if (style === 'shortNoYear') {
      return sameMonth
        ? `${start.day}–${end.day} ${MONTHS_SHORT[start.month - 1]}`
        : `${start.day} ${MONTHS_SHORT[start.month - 1]}–${end.day} ${MONTHS_SHORT[end.month - 1]}`;
    }
    if (style === 'badgeNoYear') {
      return sameMonth
        ? `${start.day}–${end.day} ${MONTHS_TITLE_SHORT[start.month - 1]}`
        : `${start.day} ${MONTHS_TITLE_SHORT[start.month - 1]}–${end.day} ${MONTHS_TITLE_SHORT[end.month - 1]}`;
    }
    if (style === 'compactNoYear') {
      return sameMonth
        ? `${start.day}–${end.day} ${MONTHS[start.month - 1]}`
        : `${start.day} ${MONTHS[start.month - 1]}–${end.day} ${MONTHS[end.month - 1]}`;
    }
    if (style === 'titleNoDe') {
      return sameMonth
        ? `${start.day} al ${end.day} ${MONTHS_TITLE[start.month - 1]}`
        : `${start.day} ${MONTHS_TITLE[start.month - 1]} al ${end.day} ${MONTHS_TITLE[end.month - 1]}`;
    }
    if (style === 'shortAl') {
      return sameMonth
        ? `${start.day} al ${end.day} ${MONTHS_TITLE_SHORT[start.month - 1]}`
        : `${start.day} ${MONTHS_TITLE_SHORT[start.month - 1]} al ${end.day} ${MONTHS_TITLE_SHORT[end.month - 1]}`;
    }
    return sameMonth
      ? `${start.day} al ${end.day} de ${MONTHS[start.month - 1]} de ${start.year}`
      : `${start.day} de ${MONTHS[start.month - 1]} al ${end.day} de ${MONTHS[end.month - 1]} de ${end.year}`;
  }

  function formatStart(item, style = 'long') {
    if (!item) return style === 'long' ? 'fecha por confirmar' : 'Por confirmar';
    const start = parts(item.start);
    if (style === 'shortTitle') return `${start.day} ${MONTHS_TITLE_SHORT[start.month - 1]} ${start.year}`;
    if (style === 'noYear') return `${start.day} de ${MONTHS[start.month - 1]}`;
    return `${start.day} de ${MONTHS[start.month - 1]} de ${start.year}`;
  }

  function replaceLiteralToken(value, source, target) {
    if (!source || !value.includes(source)) return value;
    let output = '';
    let cursor = 0;
    while (cursor < value.length) {
      const index = value.indexOf(source, cursor);
      if (index === -1) {
        output += value.slice(cursor);
        break;
      }
      const before = index > 0 ? value.charAt(index - 1) : '';
      const afterIndex = index + source.length;
      const after = afterIndex < value.length ? value.charAt(afterIndex) : '';
      const blockedAtStart = /^\d/.test(source) && /\d/.test(before);
      const blockedAtEnd = /\d$/.test(source) && /\d/.test(after);
      if (blockedAtStart || blockedAtEnd) {
        output += value.slice(cursor, index + 1);
        cursor = index + 1;
        continue;
      }
      output += value.slice(cursor, index) + target;
      cursor = afterIndex;
    }
    return output;
  }

  function replaceAllLiteral(value, sources, target) {
    return sources.reduce((output, source) => replaceLiteralToken(output, source, target), value);
  }

  function rewriteProgramText(value, programKey, tokens) {
    const cohort = getPublishedCohort(programKey);
    let output = value;
    const rangeStyles = [
      ['long', 'long'],
      ['dash', 'dash'],
      ['short', 'short'],
      ['badge', 'badge'],
      ['compact', 'compact'],
      ['noYear', 'noYear'],
      ['noYearDash', 'noYearDash'],
      ['shortNoYear', 'shortNoYear'],
      ['badgeNoYear', 'badgeNoYear'],
      ['compactNoYear', 'compactNoYear'],
      ['titleNoDe', 'titleNoDe'],
      ['shortAl', 'shortAl']
    ];
    rangeStyles.forEach(([key, style]) => {
      output = replaceAllLiteral(output, tokens[key] || [], formatRange(cohort, style));
    });
    output = replaceAllLiteral(output, tokens.start || [], formatStart(cohort, 'long'));
    output = replaceAllLiteral(output, tokens.startShortTitle || [], formatStart(cohort, 'shortTitle'));
    output = replaceAllLiteral(output, tokens.startNoYear || [], formatStart(cohort, 'noYear'));
    return output;
  }

  /*
   * Solo se incluyen como fuentes las fechas estáticas publicadas en el paquete.
   * Las fechas destino (2 nov., 5 oct., 12 oct., 19 oct.) no se usan como tokens
   * globales, para no alterar fechas coincidentes de otros programas.
   */
  const TOKENS = Object.freeze({
    marketing: Object.freeze({
      long: Object.freeze([
        '31 de agosto al 3 de septiembre de 2026',
        '26 al 29 de octubre de 2026'
      ]),
      dash: Object.freeze([
        '31 de agosto–3 de septiembre de 2026',
        '26–29 de octubre de 2026'
      ]),
      short: Object.freeze([
        '31 ago–3 sep 2026',
        '26–29 oct 2026'
      ]),
      badge: Object.freeze(['26–29 Oct 2026']),
      compact: Object.freeze(['26–29 octubre 2026']),
      noYear: Object.freeze([
        '31 de agosto al 3 de septiembre',
        '26 al 29 de octubre'
      ]),
      noYearDash: Object.freeze([
        '31 de agosto–3 de septiembre',
        '26–29 de octubre'
      ]),
      shortAl: Object.freeze(['31 Ago al 3 Sep', '26 al 29 Oct']),
      start: Object.freeze([
        '31 de agosto de 2026',
        '26 de octubre de 2026'
      ])
    }),
    agents: Object.freeze({
      long: Object.freeze(['7 al 10 de septiembre de 2026']),
      dash: Object.freeze(['7–10 de septiembre de 2026']),
      short: Object.freeze(['7–10 sep 2026']),
      badge: Object.freeze(['7–10 Sep 2026']),
      compact: Object.freeze(['7–10 septiembre 2026']),
      noYear: Object.freeze(['7 al 10 de septiembre']),
      noYearDash: Object.freeze(['7–10 de septiembre']),
      shortNoYear: Object.freeze(['7–10 sep']),
      badgeNoYear: Object.freeze(['7–10 Sep']),
      compactNoYear: Object.freeze(['7–10 septiembre']),
      start: Object.freeze(['7 de septiembre de 2026'])
    }),
    appsDiploma: Object.freeze({
      long: Object.freeze(['21 de septiembre al 22 de octubre de 2026']),
      dash: Object.freeze(['21 de septiembre–22 de octubre de 2026']),
      short: Object.freeze(['21 sep–22 oct 2026']),
      badge: Object.freeze(['21 Sep–22 Oct 2026']),
      noYear: Object.freeze(['21 de septiembre al 22 de octubre']),
      titleNoDe: Object.freeze(['21 Septiembre al 22 Octubre']),
      start: Object.freeze(['21 de septiembre de 2026']),
      startShortTitle: Object.freeze(['21 Sep 2026']),
      startNoYear: Object.freeze(['21 de septiembre'])
    })
  });

  function pageProgramKey() {
    const path = (window.location && window.location.pathname ? window.location.pathname : '').toLowerCase();
    if (path.includes('marketing-digital-con-ia') || path.includes('certificado-marketing-digital-inteligencia-artificial')) return 'marketing';
    if (path.includes('productividad-automatizacion-procesos-ia') || path.includes('certificado-productividad-automatizacion-procesos-ia')) return 'agents';
    if (path.includes('diplomado-ia-negocios-marketing') || path.includes('diplomado-desarrollo-aplicaciones-productos-digitales-ia')) return 'appsDiploma';
    return null;
  }

  function rewriteIsoDates(value) {
    const key = pageProgramKey();
    if (!key) return value;
    const cohort = getPublishedCohort(key);
    if (!cohort) return value;
    const isoSources = {
      marketing: {
        starts: ['2026-08-31', '2026-10-26'],
        ends: ['2026-09-03', '2026-10-29']
      },
      agents: {
        starts: ['2026-09-07'],
        ends: ['2026-09-10']
      },
      appsDiploma: {
        starts: ['2026-09-21'],
        ends: ['2026-10-22']
      }
    };
    let output = value;
    output = replaceAllLiteral(output, isoSources[key].starts, cohort.start);
    output = replaceAllLiteral(output, isoSources[key].ends, cohort.end);
    return output;
  }

  function rewriteValue(value) {
    if (typeof value !== 'string' || !value) return value;
    let output = value;
    output = rewriteProgramText(output, 'marketing', TOKENS.marketing);
    output = rewriteProgramText(output, 'agents', TOKENS.agents);
    output = rewriteProgramText(output, 'appsDiploma', TOKENS.appsDiploma);
    output = rewriteIsoDates(output);
    return output;
  }

  function canRewriteTextNode(node) {
    const parent = node && node.parentElement;
    if (!parent) return true;
    const tag = parent.tagName;
    if (tag === 'STYLE' || tag === 'NOSCRIPT') return false;
    if (tag === 'SCRIPT') {
      return (parent.getAttribute('type') || '').toLowerCase() === 'application/ld+json';
    }
    return true;
  }

  function rewriteTextNode(node) {
    if (!canRewriteTextNode(node)) return;
    const current = node.nodeValue || '';
    const next = rewriteValue(current);
    if (next !== current) node.nodeValue = next;
  }

  function refreshNode(root) {
    if (!root) return;
    if (root.nodeType === Node.TEXT_NODE) {
      rewriteTextNode(root);
      return;
    }
    if (root.nodeType !== Node.ELEMENT_NODE && root.nodeType !== Node.DOCUMENT_NODE && root.nodeType !== Node.DOCUMENT_FRAGMENT_NODE) return;

    const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, {
      acceptNode: node => canRewriteTextNode(node) ? NodeFilter.FILTER_ACCEPT : NodeFilter.FILTER_REJECT
    });
    const textNodes = [];
    while (walker.nextNode()) textNodes.push(walker.currentNode);
    textNodes.forEach(rewriteTextNode);

    const elements = root.nodeType === Node.ELEMENT_NODE ? [root, ...root.querySelectorAll('*')] : [...root.querySelectorAll('*')];
    elements.forEach(el => {
      if (!el.attributes || ['SCRIPT', 'STYLE', 'NOSCRIPT'].includes(el.tagName)) return;
      Array.from(el.attributes).forEach(attribute => {
        const name = attribute.name.toLowerCase();
        if (!['content', 'title', 'aria-label', 'datetime', 'value'].includes(name) && !name.startsWith('data-')) return;
        const current = attribute.value;
        const next = rewriteValue(current);
        if (next !== current) el.setAttribute(attribute.name, next);
      });
    });
  }

  const API = Object.freeze({
    timeZone: TIME_ZONE,
    isDiplomadoAppsAplazado: appsPostponed,
    todayString,
    getCohorts,
    getDiplomaApps,
    getPublishedCohort,
    formatRange,
    formatStart,
    refreshPublishedDates: () => refreshNode(document)
  });
  window.IBERO_PROGRAMACION = API;

  function startDomSync() {
    refreshNode(document);
    if (!document.body || typeof MutationObserver === 'undefined') return;
    const observer = new MutationObserver(mutations => {
      mutations.forEach(mutation => mutation.addedNodes.forEach(refreshNode));
    });
    observer.observe(document.body, { childList: true, subtree: true });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', startDomSync, { once: true });
  } else {
    startDomSync();
  }
})();
