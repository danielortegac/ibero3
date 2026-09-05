/** IBERO — Programación central, selección temporal y sincronización de vistas.
 * Sin escrituras, peticiones de pago ni acceso al registro de certificados.
 * Los datos se leen exclusivamente de programacion-academica.config.js.
 */
(function () {
  'use strict';
  const config = window.IBERO_PROGRAMACION_CONFIG || {};
  const TIME_ZONE = config.timeZone || 'America/Guayaquil';
  const OFFSET = config.utcOffset || '-05:00';
  const PENDING = 'Próxima cohorte por confirmar';
  const MONTHS = ['enero','febrero','marzo','abril','mayo','junio','julio','agosto','septiembre','octubre','noviembre','diciembre'];
  const SHORT = ['ene','feb','mar','abr','may','jun','jul','ago','sep','oct','nov','dic'];
  const programs = config.programs || {};
  const errors = [];
  const pad = n => String(n).padStart(2, '0');
  const title = s => s.charAt(0).toUpperCase() + s.slice(1);
  const normalize = s => String(s || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
  const clone = o => JSON.parse(JSON.stringify(o));

  function localParts(reference = new Date()) {
    // A bare date is interpreted in Ecuador, never in the visitor's timezone.
    if (typeof reference === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(reference)) reference += 'T00:00:00' + OFFSET;
    const date = reference instanceof Date ? reference : new Date(reference);
    return new Intl.DateTimeFormat('en-CA', {
      timeZone: TIME_ZONE, year: 'numeric', month: '2-digit', day: '2-digit',
      hour: '2-digit', minute: '2-digit', second: '2-digit', hourCycle: 'h23'
    }).formatToParts(date).reduce((out, p) => {
      if (p.type !== 'literal') out[p.type] = p.value;
      return out;
    }, {});
  }
  function todayString(reference) {
    const p = localParts(reference);
    return `${p.year}-${p.month}-${p.day}`;
  }
  function localStamp(reference) {
    const p = localParts(reference);
    return `${p.year}-${p.month}-${p.day}T${p.hour}:${p.minute}:${p.second}`;
  }
  function validDate(value) {
    if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
    const d = new Date(value + 'T12:00:00Z');
    return !Number.isNaN(d.getTime()) && d.toISOString().slice(0, 10) === value;
  }
  function validTime(value) { return typeof value === 'string' && /^(?:[01]\d|2[0-3]):[0-5]\d(?::[0-5]\d)?$/.test(value); }
  function fullTime(value) { return value.length === 5 ? value + ':00' : value; }
  function dateParts(value) {
    const [year, month, day] = value.split('-').map(Number);
    return { year, month, day };
  }
  function addDays(value, count) {
    const date = new Date(value + 'T12:00:00Z');
    date.setUTCDate(date.getUTCDate() + count);
    return date.toISOString().slice(0, 10);
  }
  function weekday(value) { return new Date(value + 'T12:00:00Z').getUTCDay(); }
  function weekStart(value) { return addDays(value, -((weekday(value) + 6) % 7)); }

  function getCohorts(key) {
    const p = programs[key];
    if (!p) return [];
    const source = config.diplomadoAppsAplazado === true && Array.isArray(p.postponedCohorts) ? p.postponedCohorts : p.cohorts;
    if (!Array.isArray(source)) return [];
    const seen = new Set();
    return source.reduce((out, c) => {
      if (!c || (c.status && c.status !== 'confirmed')) return out;
      const startTime = c.startTime || p.startTime || '19:00';
      const endTime = c.endTime || p.endTime || '21:00';
      const id = c.id || key + '-' + c.start;
      if (!validDate(c.start) || !validDate(c.end) || !validTime(startTime) || !validTime(endTime) ||
          c.end + 'T' + fullTime(endTime) <= c.start + 'T' + fullTime(startTime) || seen.has(id)) {
        const error = 'Cohorte inválida o duplicada: ' + key + '/' + id;
        if (!errors.includes(error)) errors.push(error);
        return out;
      }
      seen.add(id);
      out.push({ ...clone(c), id, programId: key, startTime, endTime });
      return out;
    }, []).sort((a, b) => a.start.localeCompare(b.start) || a.startTime.localeCompare(b.startTime) || a.id.localeCompare(b.id));
  }
  function getPublishedCohort(key, reference) {
    const now = localStamp(reference);
    return getCohorts(key).find(c => now < c.end + 'T' + fullTime(c.endTime)) || null;
  }
  function getStatus(key, reference) {
    const cohort = getPublishedCohort(key, reference);
    if (!cohort) return 'pending';
    return localStamp(reference) >= cohort.start + 'T' + fullTime(cohort.startTime) ? 'active' : 'upcoming';
  }
  function formatStart(item, style = 'long') {
    if (!item) return PENDING;
    const s = dateParts(item.start);
    if (style === 'shortTitle') return `${s.day} ${title(SHORT[s.month-1])} ${s.year}`;
    if (style === 'shortNoYear') return `${s.day} ${title(SHORT[s.month-1])}`;
    if (style === 'noYear') return `${s.day} de ${MONTHS[s.month-1]}`;
    if (style === 'weekday') return `${title(new Intl.DateTimeFormat('es-EC',{weekday:'long',timeZone:'UTC'}).format(new Date(item.start+'T12:00:00Z')))} ${s.day} de ${MONTHS[s.month-1]} de ${s.year}`;
    return `${s.day} de ${MONTHS[s.month-1]} de ${s.year}`;
  }
  function formatRange(item, style = 'long') {
    if (!item) return PENDING;
    const s = dateParts(item.start), e = dateParts(item.end);
    const sameMonth = s.year === e.year && s.month === e.month;
    const sameYear = s.year === e.year;
    const noYear = ['noYear','noYearDash','shortNoYear','badgeNoYear','compactNoYear','titleNoDe','shortAl'].includes(style);
    if (item.start === item.end) return formatStart(item, noYear ? 'noYear' : 'long');
    if (style === 'monthEnd') return `${formatStart(item)} a ${MONTHS[e.month-1]} de ${e.year}`;
    const short = ['short','badge','shortNoYear','badgeNoYear','shortAl'].includes(style);
    const cap = ['badge','badgeNoYear','titleNoDe','shortAl'].includes(style);
    const monthName = m => cap ? title((short ? SHORT : MONTHS)[m-1]) : (short ? SHORT : MONTHS)[m-1];
    const join = ['dash','short','badge','compact','noYearDash','shortNoYear','badgeNoYear','compactNoYear'].includes(style) ? '–' : ' al ';
    const de = ['long','dash','noYear','noYearDash'].includes(style) ? ' de ' : ' ';
    const start = sameMonth ? String(s.day) : `${s.day}${de}${monthName(s.month)}${!sameYear ? ' de '+s.year : ''}`;
    const end = `${e.day}${de}${monthName(e.month)}${!noYear || !sameYear ? (short || ['compact'].includes(style) ? ' ' : ' de ') + e.year : ''}`;
    return start + join + end;
  }
  function fieldText(key, field = 'range', style = 'long', reference) {
    const cohort = getPublishedCohort(key, reference);
    const state = getStatus(key, reference);
    if (field === 'status') return state === 'active' ? 'En curso' : state === 'upcoming' ? 'Próxima cohorte' : 'Programación';
    if (field === 'summary') return cohort ? `${state === 'active' ? 'En curso' : 'Próxima cohorte'}: ${formatRange(cohort, style)}` : PENDING;
    if (!cohort) return PENDING;
    if (field === 'start') return formatStart(cohort, style);
    if (field === 'end') return formatStart({start:cohort.end}, style);
    if (field === 'endMonth') { const e = dateParts(cohort.end); return MONTHS[e.month-1] + ' de ' + e.year; }
    return formatRange(cohort, style);
  }
  function renderTemplate(text, reference) {
    return String(text).replace(/\[\[ibero:([\w]+):([\w]+):([\w]+)\]\]/g,
      (_, key, field, style) => fieldText(key, field, style, reference));
  }
  function programFromValue(value) {
    const n = normalize(value);
    // URL aliases are exact path segments. Master/diploma names must precede certificates.
    for (const key of Object.keys(programs)) {
      if ((programs[key].aliases || []).some(a => n === a || n.includes('/' + a + '/') || n.endsWith('/' + a))) return key;
      if (n === normalize(programs[key].name) || n === normalize(programs[key].calendarTitle)) return key;
    }
    if (n.includes('master ejecutivo')) return 'master';
    if (n.includes('diplomado') && n.includes('marketing digital')) return 'marketingDiploma';
    if (n.includes('diplomado') && (n.includes('aplicaciones') || n.includes('productos digitales'))) return 'appsDiploma';
    if (n.includes('productividad') && n.includes('automatizacion')) return 'agents';
    if (n.includes('marketing digital') && (n.includes('certific') || n.includes('inteligencia artificial'))) return 'marketing';
    if (n.includes('creacion de cursos') || n.includes('diseno y produccion de cursos')) return 'courses';
    if (n.includes('comunicacion efectiva') || n.includes('oratoria profesional')) return 'communication';
    if (n.includes('gerentes') || n.includes('gestion gerencial')) return 'managers';
    return null;
  }
  function pageProgramKey() { return programFromValue(window.location ? window.location.pathname.replace(/index\.html$/, '') : ''); }

  function getCalendarEvents() {
    const events = [];
    for (const [key, p] of Object.entries(programs)) {
      for (const c of getCohorts(key)) {
        const event = {title:p.calendarTitle || p.name, type:p.type, start:c.start, end:c.end,
          startTime:c.startTime, endTime:c.endTime, schedule:c.schedule || p.schedule,
          desc:p.description || '', link:'https://ibero.education' + p.url, programId:key, cohortId:c.id};
        if (p.type === 'diplomado' || p.type === 'master') {
          // New cohorts automatically generate weeks from their actual boundaries.
          const explicit = Array.isArray(c.modules) && c.modules.length ? c.modules : null;
          let blocks = [];
          if (explicit) {
            blocks = explicit.filter(m => validDate(m.start) && validDate(m.end) && m.start >= c.start && m.end <= c.end && m.start <= m.end);
          } else {
            for (let monday = weekStart(c.start); monday <= c.end; monday = addDays(monday, 7)) {
              const days = [];
              for (let i=0;i<7;i++) {
                const d = addDays(monday, i);
                if (d >= c.start && d <= c.end && (p.weekdays || [1,2,3,4]).includes(weekday(d))) days.push(d);
              }
              if (days.length) blocks.push({start:days[0], end:days[days.length-1]});
            }
          }
          blocks.forEach((m,i) => events.push({...event,...m,moduleIndex:i,
            desc:m.desc || (p.moduleDescriptions || [])[i] || (p.type === 'diplomado' ? `Módulo ${i+1}: ` : '') + event.desc}));
        } else events.push(event);
        if (p.type === 'master') events.push({...event,
          title:'⚫ Inscripciones: '+event.title, type:'inscripcion', relatedType:'master',
          start:addDays(c.start,-(p.registrationDaysBefore || 28)), end:addDays(c.start,-(p.registrationDaysBefore || 28)),
          startTime:'00:00',endTime:'23:59:59',schedule:'Inicia el '+formatStart(c,'noYear'),
          desc:'Apertura oficial de inscripciones al Máster Ejecutivo.'});
      }
    }
    return events.sort((a,b) => a.start.localeCompare(b.start) || a.title.localeCompare(b.title));
  }
  function eventEndTime(event) {
    if (event.endTime) return fullTime(event.endTime);
    if (event.type === 'inscripcion' || event.type === 'comercial') return '23:59:59';
    if (event.type === 'master') return '22:00:00';
    if (event.type === 'gratis') return '22:20:00';
    if (event.type === 'taller' || /9:00 AM/.test(event.schedule || '')) return '13:00:00';
    return '21:00:00';
  }
  function isEventExpired(event, reference) { return localStamp(reference) >= event.end + 'T' + eventEndTime(event); }
  function isEventActive(event, reference) {
    const startTime = event.startTime || (event.type === 'master' || event.type === 'gratis' ? '21:00' : event.type === 'taller' ? '09:00' : '19:00');
    return !isEventExpired(event, reference) && localStamp(reference) >= event.start + 'T' + fullTime(startTime);
  }
  function getDiplomaApps(reference) {
    const c = getPublishedCohort('appsDiploma', reference);
    if (!c) return null;
    return {...c,modules:getCalendarEvents().filter(e=>e.programId==='appsDiploma' && e.cohortId===c.id && e.type==='diplomado').map(e=>({start:e.start,end:e.end}))};
  }

  const schemaTemplates = new Map();
  function hydrateSchema(value, inheritedKey, reference) {
    if (Array.isArray(value)) return value.map(v=>hydrateSchema(v,inheritedKey,reference));
    if (typeof value === 'string') return renderTemplate(value,reference);
    if (!value || typeof value !== 'object') return value;
    const instance = Array.isArray(value.hasCourseInstance) ? value.hasCourseInstance[0] : value.hasCourseInstance;
    const key = programFromValue(value.url) || programFromValue(value['@id']) || programFromValue(value.name) ||
      programFromValue(instance && instance.location && instance.location.url) || inheritedKey;
    const out = {};
    Object.entries(value).forEach(([k,v])=> {out[k]=hydrateSchema(v,key,reference);});
    const type = Array.isArray(value['@type']) ? value['@type'] : [value['@type']];
    if (type.includes('Course') && key && programs[key]) {
      const cohorts = getCohorts(key).filter(c=>localStamp(reference) < c.end+'T'+fullTime(c.endTime));
      if (!cohorts.length) delete out.hasCourseInstance;
      else {
        const old = Array.isArray(value.hasCourseInstance) ? value.hasCourseInstance[0] : value.hasCourseInstance;
        const template = old || {'@type':'CourseInstance',courseMode:key==='communication'?'onsite':'online',location:{'@type':key==='communication'?'Place':'VirtualLocation',url:'https://ibero.education'+programs[key].url}};
        const instances = cohorts.map(c=>({...hydrateSchema(template,key,reference),startDate:c.start,endDate:c.end}));
        out.hasCourseInstance = instances.length===1 && !Array.isArray(value.hasCourseInstance) ? instances[0] : instances;
      }
    }
    return out;
  }
  function findWithin(root, selector) {
    const found = root.querySelectorAll ? Array.from(root.querySelectorAll(selector)) : [];
    if (root.matches && root.matches(selector)) found.unshift(root);
    return found;
  }
  function syncBindings(root=document) {
    if (window.location && /^\/diplomas(?:\/|$)/.test(window.location.pathname)) return;
    findWithin(root,'[data-ibero-calendar]').forEach(el=>{
      const all=Object.keys(programs).flatMap(k=>getCohorts(k)).filter(c=>localStamp()<c.end+'T'+fullTime(c.endTime));
      const last=all.reduce((end,c)=>c.end>end?c.end:end,todayString());
      const e=dateParts(last);
      const text=el.getAttribute('data-ibero-calendar')==='year' ? todayString().slice(0,4) :
        all.length ? 'Programación vigente hasta '+MONTHS[e.month-1]+' de '+e.year : 'Próximas cohortes por confirmar';
      if(el.textContent!==text) el.textContent=text;
    });
    findWithin(root,'[data-ibero-date]').forEach(el=>{
      if (el.closest('.chat-msg-user,.chat-bubble-user,[data-ibero-ignore]')) return;
      const key=el.getAttribute('data-ibero-date');
      const text=fieldText(key,el.getAttribute('data-ibero-field')||'range',el.getAttribute('data-ibero-format')||'long');
      if (el.textContent!==text) el.textContent=text;
      const state=getStatus(key);
      if (el.getAttribute('data-ibero-state')!==state) el.setAttribute('data-ibero-state',state);
    });
    findWithin(root,'[data-ibero-content-template]').forEach(el=>{
      const text=renderTemplate(el.getAttribute('data-ibero-content-template'));
      const attr=el.getAttribute('data-ibero-content-attribute') || 'content';
      if (attr==='textContent') {if(el.textContent!==text) el.textContent=text;}
      else if(el.getAttribute(attr)!==text) el.setAttribute(attr,text);
    });
    findWithin(root,'script[type="application/ld+json"]').forEach(el=>{
      if (!schemaTemplates.has(el)) {
        try {schemaTemplates.set(el,JSON.parse(el.getAttribute('data-ibero-json-template')||el.textContent));}
        catch (_) {return;}
      }
      const text=JSON.stringify(hydrateSchema(schemaTemplates.get(el),null));
      if (el.textContent!==text) el.textContent=text;
    });
  }
  function refreshPublishedDates(root=document) { syncBindings(root); }
  let fingerprint = '';
  function refresh() {
    const next = todayString() + '|' + Object.keys(programs).map(k=>{
      const c=getPublishedCohort(k);
      return k+':'+(c?c.id:'pending')+':'+getStatus(k);
    }).join('|') + '|' + getCalendarEvents().filter(e=>!isEventExpired(e)).map(e=>e.start+e.cohortId).join(',');
    if (next === fingerprint) return;
    fingerprint = next;
    syncBindings(document);
    window.dispatchEvent(new CustomEvent('ibero:programacion-actualizada',{detail:{today:todayString()}}));
  }
  const API = Object.freeze({
    version:config.version,timeZone:TIME_ZONE,isDiplomadoAppsAplazado:config.diplomadoAppsAplazado===true,
    todayString,localStamp,getCohorts,getPublishedCohort,getStatus,formatRange,formatStart,fieldText,renderTemplate,
    programFromValue,pageProgramKey,getCalendarEvents,getDiplomaApps,addDays,weekStart,isEventExpired,isEventActive,
    refreshPublishedDates,refresh,getConfigurationErrors:()=>errors.slice(),getProgramKeys:()=>Object.keys(programs),
    getProgram:key=>programs[key]?clone(programs[key]):null
  });
  window.IBERO_PROGRAMACION = API;
  function start() {
    syncBindings(document); refresh();
    if (document.body && typeof MutationObserver !== 'undefined') {
      const observer = new MutationObserver(mutations=>{
        mutations.forEach(m=>m.addedNodes.forEach(n=>{
          if (n.nodeType===1) syncBindings(n);
        }));
        for(const el of schemaTemplates.keys()) if(!el.isConnected) schemaTemplates.delete(el);
      });
      observer.observe(document.body,{childList:true,subtree:true});
    }
    // Time-based recheck also covers a tab left open at the end of a cohort.
    window.setInterval(refresh,1000);
    window.addEventListener('focus',refresh);
    window.addEventListener('pageshow',refresh);
    document.addEventListener('visibilitychange',()=>{if(!document.hidden) refresh();});
    window.addEventListener('beforeprint',()=>{refresh();syncBindings(document);});
  }
  if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',start,{once:true});
  else start();
})();
