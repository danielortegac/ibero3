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
  function publicRolloverMode(key) {
    const p = programs[key] || {};
    return p.publicRollover || (p.type === 'curso' ? (config.coursePublicRollover || 'end') : 'end');
  }
  function isPublicCandidate(key, cohort, reference) {
    if (!cohort || cohort.registrationClosed === true) return false;
    if (publicRolloverMode(key) === 'startDay') {
      // Cursos cortos dejan de anunciar la cohorte vigente al comenzar su fecha de inicio en Ecuador.
      return todayString(reference) < cohort.start;
    }
    return localStamp(reference) < cohort.end + 'T' + fullTime(cohort.endTime);
  }
  function getPublishedCohort(key, reference) {
    return getCohorts(key).find(c => isPublicCandidate(key, c, reference)) || null;
  }
  function getStatus(key, reference) {
    const cohort = getPublishedCohort(key, reference);
    if (!cohort) return 'pending';
    return localStamp(reference) >= cohort.start + 'T' + fullTime(cohort.startTime) ? 'active' : 'upcoming';
  }
  function hasConfirmedPublicCohort(key, reference) {
    return !!getPublishedCohort(key, reference);
  }
  function commercialLabel(key, reference) {
    return hasConfirmedPublicCohort(key, reference) ? 'Matrículas abiertas' : PENDING;
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
    const p = programs[key] || {};
    if (field === 'status') {
      if (p.type === 'curso') return commercialLabel(key, reference);
      return state === 'active' ? 'En curso' : state === 'upcoming' ? 'Próxima cohorte' : PENDING;
    }
    if (field === 'summary') return cohort ? `${state === 'active' ? 'En curso' : 'Próxima cohorte'}: ${formatRange(cohort, style)}` : PENDING;
    if (field === 'schedule') return (cohort && cohort.schedule) || p.schedule || PENDING;
    if (field === 'scheduleRegional') return (cohort && cohort.scheduleRegional) || p.scheduleRegional || (cohort && cohort.schedule) || p.schedule || PENDING;
    if (field === 'scheduleEC') return (cohort && cohort.scheduleEC) || p.scheduleEC || (cohort && cohort.schedule) || p.schedule || PENDING;
    if (field === 'scheduleMX') return (cohort && cohort.scheduleMX) || p.scheduleMX || (cohort && cohort.schedule) || p.schedule || PENDING;
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
          desc:p.description || '', link:'https://ibero.education' + p.url, programId:key, cohortId:c.id,
          weekdays:clone(c.weekdays || p.weekdays || [1,2,3,4]),
          registrationClosed:c.registrationClosed === true, cohortStart:c.start, cohortEnd:c.end};
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
        if (p.type === 'master' && !event.registrationClosed) events.push({...event,
          title:'⚫ Recordatorio de matrícula: '+event.title, type:'inscripcion', relatedType:'master',
          start:addDays(c.start,-(p.registrationDaysBefore || 28)), end:addDays(c.start,-(p.registrationDaysBefore || 28)),
          startTime:'00:00',endTime:'23:59:59',schedule:'Inicia el '+formatStart(c,'noYear'),
          desc:'Recordatorio de matrícula del Máster Ejecutivo. Consulta la convocatoria y sus cupos; este hito no define la apertura de inscripciones.'});
      }
    }
    return events.sort((a,b) => a.start.localeCompare(b.start) || a.title.localeCompare(b.title));
  }

  // Estado por COHORTE, no solamente por el nombre del programa.
  // La regla de apertura comercial no se infiere de un recordatorio del calendario.
  function getRegistrationState(key, cohortId, reference) {
    const p = programs[key];
    const c = cohortId ? getCohorts(key).find(item=>item.id===cohortId) : getPublishedCohort(key,reference);
    const programUrl = p ? 'https://www.ibero.education' + p.url : 'https://www.ibero.education/registro-y-admisiones/';
    if (!p || !c) return {state:'pending',canRegister:false,cohort:null,programUrl,label:PENDING};
    const closed = !isPublicCandidate(key,c,reference);
    if (closed) return {state:'closed',canRegister:false,cohort:c,programUrl,label:'Matrículas cerradas para esta cohorte'};
    const active = localStamp(reference) >= c.start+'T'+fullTime(c.startTime);
    return {state:active?'active':'open',canRegister:true,cohort:c,programUrl,label:active?'Cohorte en curso':'Matrículas abiertas'};
  }

  function eventTimes(event) {
    const p = programs[event.programId] || {};
    if (validTime(event.startTime) && validTime(event.endTime)) return [event.startTime,event.endTime];
    if (validTime(p.startTime) && validTime(p.endTime)) return [p.startTime,p.endTime];
    // Compatibilidad con sesiones históricas sin campos de hora estructurados.
    const values=Array.from(String(event.schedule||'').matchAll(/(\d{1,2}):(\d{2})\s*(AM|PM)/gi));
    if (values.length===2) return values.map(m=>pad((Number(m[1])%12)+(m[3].toUpperCase()==='PM'?12:0))+':'+m[2]);
    return null; // No exportar horas inventadas si el evento no permite resolverlas.
  }

  function getEventSessions(event) {
    if (!event || !validDate(event.start) || !validDate(event.end) || event.end<event.start) return [];
    if (event.type==='inscripcion' || event.type==='comercial') return [{date:event.start,endDate:addDays(event.end,1),allDay:true}];
    const times=eventTimes(event);
    if (!times) return [];
    const p=programs[event.programId]||{};
    const days=event.weekdays || p.weekdays || [0,1,2,3,4,5,6];
    const sessions=[];
    for (let day=event.start,count=0;day<=event.end && count<2000;day=addDays(day,1),count++) {
      if (!days.includes(weekday(day))) continue;
      const endDay=times[1]<=times[0]?addDays(day,1):day;
      const start=new Date(day+'T'+fullTime(times[0])+OFFSET);
      const end=new Date(endDay+'T'+fullTime(times[1])+OFFSET);
      if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime()) || end<=start) continue;
      sessions.push({date:day,endDate:endDay,startTime:times[0],endTime:times[1],startUTC:start.toISOString(),endUTC:end.toISOString(),allDay:false});
    }
    return sessions;
  }

  // RFC 5545: horas absolutas UTC, fin exclusivo, escape y plegado UTF-8 a 75 octetos.
  function calendarText(value) { return String(value||'').replace(/\\/g,'\\\\').replace(/\r?\n/g,'\\n').replace(/;/g,'\\;').replace(/,/g,'\\,'); }
  function foldCalendarLine(value) {
    const encoder=new TextEncoder();let line='',length=0;const lines=[];
    for(const ch of String(value)) {
      const n=encoder.encode(ch).length;
      if(length+n>75){lines.push(line);line=' ';length=1;}
      line+=ch;length+=n;
    }
    lines.push(line);return lines.join('\r\n');
  }
  function buildCalendarICS(event, reference=new Date()) {
    const sessions=getEventSessions(event);
    if(!sessions.length) return '';
    const utc=value=>new Date(value).toISOString().replace(/[-:]/g,'').replace(/\.\d{3}Z$/,'Z');
    const dtstamp=utc(reference);
    const slug=value=>normalize(value).replace(/[^a-z0-9-]+/g,'-').slice(0,150);
    const lines=['BEGIN:VCALENDAR','VERSION:2.0','PRODID:-//Centro Iberoamericano//Programacion Academica//ES','CALSCALE:GREGORIAN','X-WR-CALNAME:'+calendarText('IBERO · '+event.title)];
    sessions.forEach(session=>{
      const kind=session.allDay?'recordatorio':'clase';
      const uid=slug(event.cohortId||event.programId||event.title)+'-'+session.date+'-'+kind+'@ibero.education';
      lines.push('BEGIN:VEVENT','UID:'+uid,'DTSTAMP:'+dtstamp);
      if(session.allDay)lines.push('DTSTART;VALUE=DATE:'+session.date.replace(/-/g,''),'DTEND;VALUE=DATE:'+session.endDate.replace(/-/g,''));
      else lines.push('DTSTART:'+utc(session.startUTC),'DTEND:'+utc(session.endUTC));
      const description=(event.desc||'')+(session.allDay?'':'\nHorario base: '+session.startTime+'–'+session.endTime+' · '+TIME_ZONE)+
        (event.link?'\nInformación del programa: '+event.link:'')+'\nEl acceso a las clases se consulta en QLASE. Este archivo no confirma ni crea una matrícula.';
      lines.push('SUMMARY:'+calendarText('IBERO · '+event.title),'DESCRIPTION:'+calendarText(description),'TRANSP:'+(session.allDay?'TRANSPARENT':'OPAQUE'));
      if(/^https?:\/\//i.test(event.link||''))lines.push('URL:'+event.link);
      lines.push('END:VEVENT');
    });
    lines.push('END:VCALENDAR');return lines.map(foldCalendarLine).join('\r\n')+'\r\n';
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
      const cohorts = getCohorts(key).filter(c=>isPublicCandidate(key,c,reference));
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
    // Estado comercial: solo hay "Matrículas abiertas" cuando existe una próxima cohorte confirmada.
    // En cursos cortos el rollover público ocurre el mismo día de inicio, por lo que la tarjeta salta
    // a la siguiente cohorte o queda en "Próxima cohorte por confirmar" sin invitar a pagar.
    findWithin(root,'[data-ibero-commercial-status]').forEach(el=>{
      const key=el.getAttribute('data-ibero-commercial-status');
      const open=hasConfirmedPublicCohort(key);
      const text=open ? 'Matrículas Abiertas' : PENDING;
      if(el.textContent.trim()!==text) {
        const dot=el.querySelector('[data-ibero-commercial-dot]');
        if(dot) {
          Array.from(el.childNodes).filter(n=>n!==dot).forEach(n=>n.remove());
          el.appendChild(document.createTextNode(text));
        } else el.textContent=text;
      }
      el.setAttribute('data-ibero-commercial-state',open?'open':'pending');
      const dot=el.querySelector('[data-ibero-commercial-dot]');
      if(dot) dot.hidden=!open;
    });
    findWithin(root,'[data-ibero-registration]').forEach(el=>{
      const key=el.getAttribute('data-ibero-registration');
      const open=hasConfirmedPublicCohort(key);
      el.hidden=!open;
      // `hidden` can lose the cascade against utility display classes such as `flex`.
      // Force the commercial CTA off when there is no confirmed public cohort.
      if(!open) el.style.setProperty('display','none','important');
      else el.style.removeProperty('display');
      el.setAttribute('aria-hidden',open?'false':'true');
      if(!open) el.setAttribute('tabindex','-1');
      else if(el.getAttribute('tabindex')==='-1') el.removeAttribute('tabindex');
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
    todayString,localStamp,getCohorts,getPublishedCohort,getStatus,hasConfirmedPublicCohort,commercialLabel,publicRolloverMode,isPublicCandidate,formatRange,formatStart,fieldText,renderTemplate,
    programFromValue,pageProgramKey,getCalendarEvents,getDiplomaApps,addDays,weekStart,isEventExpired,isEventActive,
    getRegistrationState,getEventSessions,buildCalendarICS,
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
