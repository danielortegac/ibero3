/** IBERO · Coordinador único de país, presentación de precios, horario y enlaces.
 * No modifica cohortes, contenidos, planes, certificados ni configuración de la pasarela.
 * La elección manual prevalece sobre ruta, zona horaria y detección automática por IP.
 */
(function () {
  'use strict';
  if (window.IBERO_MERCADOS) return;
  const C = window.IBERO_MERCADOS_CONFIG;
  if (!C) return;
  const M = C.markets;
  const root = document.documentElement;
  let country = C.defaultCountry;
  let zone = '';
  let manual = false;
  let source = 'default';
  let serial = 0;
  let calendarEvent = null;
  const currencyNames = {EUR:'euros',USD:'dólares estadounidenses',MXN:'pesos mexicanos',CRC:'colones costarricenses',GTQ:'quetzales',COP:'pesos colombianos',PEN:'soles peruanos',HNL:'lempiras',DOP:'pesos dominicanos',CLP:'pesos chilenos',ARS:'pesos argentinos',UYU:'pesos uruguayos',PYG:'guaraníes'};
  const optionLabel = code => M[code].name + ' · ' + M[code].currency;
  const esc = value => String(value == null ? '' : value).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  function normalize(v) { return String(v || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase(); }
  function validCode(v) { const c = String(v || '').toUpperCase(); return M[c] ? c : ''; }
  function browserZone() { try { return Intl.DateTimeFormat().resolvedOptions().timeZone || 'America/Guayaquil'; } catch (_) { return 'America/Guayaquil'; } }
  function validZone(z) { try { new Intl.DateTimeFormat('es', {timeZone:z}).format(); return !!z; } catch (_) { return false; } }
  function defaultZone(code) { return M[code].zone || browserZone(); }
  function chooseZone(code, requested) {
    const m = M[code];
    if (requested && validZone(requested) && (code === 'INTL' || requested === m.zone || (m.zones || []).some(z => z[0] === requested) || fromTimezone(requested) === code)) return requested;
    return defaultZone(code);
  }
  function fromPath(pathname=location.pathname, useBody=true) {
    const parts = normalize(pathname).split('/').filter(Boolean);
    for (const code of C.order) if (M[code].slug && parts.includes(M[code].slug)) return code;
    if (parts.some(v => ['cursos-ia-en-espanol-estados-unidos','ia-para-latinos-en-usa','formacion-online-para-hispanos','miami','orlando','houston','dallas','los-angeles','nueva-york','chicago'].includes(v))) return 'US';
    if (parts.some(v => ['nicaragua','bolivia','cuba','venezuela'].includes(v))) return 'INTL';
    return useBody?validCode(document.body.dataset.pageCountry || document.body.dataset.country):'';
  }
  function fromTimezone(tz) {
    const v = normalize(tz);
    for (const code of C.order) {
      const m = M[code];
      if (m.zone && normalize(m.zone) === v) return code;
      if ((m.zones || []).some(z => normalize(z[0]) === v)) return code;
    }
    if (/argentina|buenos_aires|cordoba|mendoza|jujuy|catamarca/.test(v)) return 'AR';
    if (/merida|monterrey|chihuahua|ojinaga|mexico|mazatlan|tijuana|hermosillo/.test(v)) return 'MX';
    if (/detroit|indiana|kentucky|boise|menominee|north_dakota|adak|sitka|juneau|nome/.test(v)) return 'US';
    return 'INTL';
  }
  function readSaved() { try { const s = JSON.parse(localStorage.getItem(C.storageKey) || 'null'); return s && validCode(s.country) ? s : null; } catch (_) { return null; } }
  function save() { try { localStorage.setItem(C.storageKey, JSON.stringify({country:country,zone:zone,manual:true})); } catch (_) {} }
  function programFrom(value) {
    let path = String(value || '').split(/[?#]/)[0].replace(/\/+$/, '').replace(/\/index\.html$/, '');
    try { path = new URL(path, location.origin).pathname.replace(/\/+$/, ''); } catch (_) {}
    const slug = path.split('/').pop();
    for (const key of Object.keys(C.aliases)) if (C.aliases[key].includes(slug)) return key;
    return '';
  }
  function pageProgram() { return programFrom(location.pathname); }
  function elementProgram(el) {
    const tagged = el.closest('[data-ibero-price-program]');
    return (tagged && tagged.dataset.iberoPriceProgram) || pageProgram();
  }
  function numberText(value, currency) {
    const n = Number(value);
    if (!Number.isFinite(n)) return '';
    if(currency==='EUR')return n.toLocaleString('es-ES',{minimumFractionDigits:2,maximumFractionDigits:2});
    return currency === 'USD' ? n.toLocaleString('en-US',{minimumFractionDigits:Number.isInteger(n)?0:2,maximumFractionDigits:2}) : Math.round(n).toLocaleString('es-CO',{maximumFractionDigits:0});
  }
  function localRound(value,currency) {
    const step=({CRC:100,GTQ:5,HNL:10,DOP:50,CLP:100,ARS:100,UYU:100,PYG:1000})[currency] || 1;
    return Math.round(Number(value)/step)*step;
  }
  function priceInfo(program, base, code) {
    code = validCode(code) || country;
    const market = M[code];
    const n = Number(base);
    if (!Number.isFinite(n)) return {main:'',tax:'',currency:'USD',value:0};

    if(code==='ES') {
      if(program==='agents' && n===57)return {main:'€'+numberText(market.agentsPrice,'EUR'),tax:'',currency:'EUR',value:market.agentsPrice,chargeCurrency:'EUR',chargeAmount:50};
      const value=market.pricesByBase[String(n)];
      if(Number.isFinite(value))return {main:'€'+numberText(value,'EUR'),tax:'',currency:'EUR',value:value,paymentStatus:'consult'};
      return {main:'Consultar inversión',tax:'',currency:'EUR',value:null,paymentStatus:'consult'};
    }
    // Los cursos intensivos con base USD 57 comparten la tabla oficial por país.
    if (n === 57) {
      const value = market.agentsPrice;
      return {
        main: market.currency+' '+numberText(value,market.currency),
        tax: program === 'agents' && code === 'EC' ? 'más IVA' : '',
        currency: market.currency,
        value: value
      };
    }

    // Se preservan los precios explícitos por moneda aprobados por el usuario.
    const legacy = C.legacyPrices[String(n)];
    const legacyCurrency = market.currency;
    if (legacy && legacyCurrency && legacy[legacyCurrency] !== undefined) {
      const value = legacy[legacyCurrency];
      return {main:legacyCurrency+' '+numberText(value,legacyCurrency),tax:'',currency:legacyCurrency,value:value};
    }

    // Respaldo para bases nuevas todavía ausentes de la tabla comercial aprobada.
    if (market.currency !== 'USD' && Number.isFinite(Number(market.agentsPrice))) {
      const value = localRound(n * Number(market.agentsPrice) / 57, market.currency);
      return {main:market.currency+' '+numberText(value,market.currency),tax:'',currency:market.currency,value:value};
    }

    return {main:'USD '+numberText(n,'USD'),tax:'',currency:'USD',value:n};
  }
  function priceText(program, base, code) { const p = priceInfo(program,base,code); return p.main + (p.tax?' '+p.tax:''); }
  function assignText(el, text) { if (el && el.textContent !== text) el.textContent = text; }
  function renderPrice(el) {
    const program = elementProgram(el);
    const base = el.dataset.base || el.dataset.iberoPriceBase;
    if (base !== undefined) {
      const p = priceInfo(program, base);
      assignText(el,p.main);
      if (el.matches('.price-display,.price-display-mensual,.price-display-semestral')) {
        el.classList.add('ibero-price-local');
        let label=el.previousElementSibling;
        if(!label || !label.hasAttribute('data-ibero-selected-price-country')) {
          label=document.createElement('span');label.className='ibero-main-price-country';label.setAttribute('data-ibero-selected-price-country','');el.before(label);
        }
        assignText(label,country==='ES'?'Precio para España · EUR':'Precio para '+M[country].name);
      }
      let tax = el.nextElementSibling;
      if (!tax || !tax.classList.contains('ibero-price-tax')) {
        if (p.tax) { tax = document.createElement('span'); tax.className='ibero-price-tax'; el.after(tax); }
        else tax = null;
      }
      if (tax) { assignText(tax,p.tax); tax.hidden=!p.tax; }
      return;
    }
    if (el.dataset.usd !== undefined) {
      const raw=String(el.dataset.usd||'');
      const match=raw.match(/USD\s*\$?\s*([0-9]+(?:\.[0-9]+)?)/i);
      if(match){
        const info=priceInfo(program,Number(match[1]),country);
        assignText(el,info.main+(info.tax?' '+info.tax:''));
      } else {
        const key = ({MX:'mxn',CO:'cop',PE:'pen'})[country] || 'usd';
        assignText(el,el.dataset[key] || el.dataset.usd);
      }
    }
  }
  function zoneLabel() {
    const m = M[country];
    const item = (m.zones || []).find(z=>z[0]===zone);
    return item ? item[1] : (zone !== m.zone ? zone.replace(/_/g,' ') : m.zoneLabel);
  }
  function localTime(date, time, targetZone, sourceZone='America/Guayaquil') {
    const api=window.IBERO_PROGRAMACION;
    const d = api&&api.zonedDate ? api.zonedDate(date,time,sourceZone) : new Date(date+'T'+time.slice(0,5)+':00-05:00');
    const parts = new Intl.DateTimeFormat('en-CA',{timeZone:targetZone,year:'numeric',month:'2-digit',day:'2-digit',hour:'2-digit',minute:'2-digit',hourCycle:'h23'}).formatToParts(d).reduce((a,p)=>(a[p.type]=p.value,a),{});
    return {time:parts.hour+':'+parts.minute,date:parts.year+'-'+parts.month+'-'+parts.day};
  }
  function localRange(date,start,end,targetZone,sourceZone) {
    try {
      const a=localTime(date,start,targetZone,sourceZone), b=localTime(date,end,targetZone,sourceZone);
      let suffix='';
      if (a.date>date && b.date>date) suffix=' (día siguiente)';
      else if (a.date<date && b.date<date) suffix=' (día anterior)';
      else if (b.date>a.date) suffix=' (termina al día siguiente)';
      return a.time+'–'+b.time+suffix;
    } catch (_) { return start+'–'+end+' · Ecuador'; }
  }
  function shortDate(date) { const a=String(date).split('-'); return a[2]+'/'+a[1]; }
  function scheduleText(key, supplied) {
    const api=window.IBERO_PROGRAMACION;
    const p=api && api.getProgram(key);
    if (!p) return 'Consulta el horario de tu programa en el calendario académico.';
    const cohort=supplied || (api.getDisplayedCohort?api.getDisplayedCohort(key):api.getPublishedCohort(key));
    if (key==='communication') return (cohort && cohort.schedule || p.schedule)+' · Presencial en Ecuador';
    if(!cohort&&key==='agents'&&country==='ES')return 'Próxima cohorte de España por confirmar. El nuevo horario se publicará con su convocatoria.';
    if (!cohort) return 'Horario habitual: '+localRange(api.todayString(),p.startTime,p.endTime,zone)+' · '+zoneLabel()+'. Próxima cohorte por confirmar.';
    const sessions=[];
    const start=cohort.start, end=cohort.end;
    if (!start || !end) return localRange(api.todayString(),p.startTime,p.endTime,zone)+' · '+zoneLabel();
    const days=cohort.weekdays || p.weekdays || [1,2,3,4];
    for (let d=start,n=0;d<=end && n<400;d=api.addDays(d,1),n++) {
      if (!days.includes(new Date(d+'T12:00:00Z').getUTCDay())) continue;
      const module=(cohort.modules||[]).find(m=>d>=m.start && d<=m.end);
      const st=(module&&module.startTime)||cohort.startTime||p.startTime;
      const et=(module&&module.endTime)||cohort.endTime||p.endTime;
      const range=localRange(d,st,et,zone,cohort.timeZone);
      const last=sessions[sessions.length-1];
      if (last && last.range===range) last.end=d;
      else sessions.push({start:d,end:d,range:range});
    }
    if (!sessions.length) return localRange(start,cohort.startTime||p.startTime,cohort.endTime||p.endTime,zone,cohort.timeZone)+' · '+zoneLabel();
    const prefix=key==='master'?'Lun–Vie · ':'Lun–Jue · ';
    if (sessions.length===1) return prefix+sessions[0].range+' · '+zoneLabel()+(cohort.market==='ES'?' · Cohorte España':'');
    return sessions.map(s=>shortDate(s.start)+'–'+shortDate(s.end)+': '+s.range).join(' · ')+' · '+zoneLabel();
  }
  function controlHTML(theme, program) {
    const id='ibero-market-'+(++serial);
    return '<div class="ibero-market-control" data-theme="'+esc(theme||'light')+'">'+
      '<label class="ibero-market-label" for="'+id+'">Selecciona tu país</label>'+
      '<div class="ibero-select-wrap"><select class="ibero-market-select" id="'+id+'" data-ibero-market-select>'+C.order.map(code=>'<option value="'+code+'"'+(code===country?' selected':'')+'>'+esc(optionLabel(code))+'</option>').join('')+'</select></div>'+
      '<details class="ibero-zone-wrap" data-ibero-zone-wrap hidden><summary>Cambiar ciudad o zona horaria</summary><label class="ibero-market-label" for="'+id+'-zone">Zona horaria</label><div class="ibero-select-wrap"><select class="ibero-zone-select" data-ibero-zone-select id="'+id+'-zone"></select></div></details>'+
      '<p class="ibero-currency-note" data-ibero-currency-note aria-live="polite" aria-atomic="true"></p>'+
      (program?'<p class="ibero-local-schedule" data-ibero-local-schedule="'+esc(program)+'"></p>':'')+
      '</div>';
  }
  function countrySourceText() { return ''; }
  function programLabel(key) {
    const api=window.IBERO_PROGRAMACION,p=api&&api.getProgram(key);
    return (p&&(p.title||p.name))||({agents:'Crea Agentes IA',marketing:'Marketing Digital con IA',courses:'Diseño y Producción de Cursos Online con IA',managers:'IA para Gerencia y Administración',communication:'Comunicación Efectiva',appsDiploma:'Diplomado en Desarrollo de Aplicaciones y Productos Digitales con IA',marketingDiploma:'Diplomado en Marketing Digital con IA y Agentes',master:'Máster Ejecutivo en IA'})[key]||key;
  }
  function createPriceDetails(key,theme) {
    const el=document.createElement('details');el.className='ibero-all-prices ibero-market-panel';
    el.dataset.iberoAllPrices=key||'overview';el.dataset.theme=theme||'light';return el;
  }
  function mountAllPrices() {
    // El calendario tiene su propio panel por evento; no presenta una tabla genérica.
    if(document.getElementById('modal-prices'))return;
    const program=pageProgram();
    const admissions=/\/registro-y-admisiones(?:\/index\.html)?\/?$/.test(location.pathname);
    if(!program && !admissions)return;
    document.querySelectorAll('details.ibero-all-prices:not([data-ibero-all-prices])').forEach(el=>{
      const host=document.querySelector('[data-ibero-market-mount]');
      el.dataset.iberoAllPrices=program||'overview';el.dataset.theme=host?host.dataset.theme:'dark';el.classList.add('ibero-market-panel');
    });
    const mounts=Array.from(document.querySelectorAll('[data-ibero-market-mount]'));
    let panel=document.querySelector('[data-ibero-all-prices]');
    const host=mounts[0];
    if(!panel && host){panel=createPriceDetails(program||host.dataset.program||'overview',host.dataset.theme);host.after(panel);}
    if(program && panel && !panel.dataset.iberoPricePositioned) {
      const investment=document.getElementById('inversion');
      const principal=investment&&investment.querySelector(program==='master'?'[data-base="926.25"],[data-ibero-price-base="926.25"]':'.price-display,[data-base],[data-ibero-price-base],[data-usd]');
      if(principal && principal.parentElement){const block=principal.closest('.ibero-catalog-investment')||principal.parentElement;block.after(panel);panel.dataset.iberoPricePositioned='true';}
    }
  }
  function priceCell(key,base,code) {
    const p=priceInfo(key,base,code);
    return '<td><span class="ibero-table-currency">'+esc(p.currency)+'</span> <span class="ibero-table-amount">'+esc(numberText(p.value,p.currency))+'</span>'+(p.tax?'<small class="ibero-table-tax">'+esc(p.tax)+'</small>':'')+'</td>';
  }
  function renderAllPrices(container) {
    (container||document).querySelectorAll('[data-ibero-all-prices]').forEach(el=>{
      const overview=el.dataset.iberoAllPrices==='overview';
      const keys=Object.keys(C.programBases).filter(key=>key!=='communication');
      const key=overview?(el.dataset.iberoPriceView||keys[0]):el.dataset.iberoAllPrices;
      if(!C.programBases[key])return;
      if(!el.dataset.iberoPricesMounted) {
        const id='ibero-price-view-'+(++serial),wasOpen=el.open;
        el.innerHTML='<summary><span>Ver precios de todos los países</span><span class="ibero-prices-count">'+C.order.length+' destinos</span></summary><div class="ibero-all-prices-body">'+
          (overview?'<label class="ibero-market-label" for="'+id+'">Programa</label><div class="ibero-select-wrap"><select class="ibero-price-view-select" id="'+id+'" data-ibero-price-view>'+keys.map(k=>'<option value="'+esc(k)+'">'+esc(programLabel(k))+'</option>').join('')+'</select></div>':'<p class="ibero-prices-program" data-ibero-prices-program></p>')+
          '<p class="ibero-prices-current" data-ibero-prices-current aria-live="polite"></p><div class="ibero-prices-scroll" tabindex="0" role="region" aria-label="Precios de todos los países"><table><thead></thead><tbody></tbody></table></div><p class="ibero-prices-footnote" data-ibero-prices-footnote></p></div>';
        el.open=wasOpen;el.dataset.iberoPricesMounted='true';
      }
      const select=el.querySelector('[data-ibero-price-view]');if(select)select.value=key;
      assignText(el.querySelector('[data-ibero-prices-program]'),programLabel(key));
      const monthly=key==='master',main=priceText(key,C.programBases[key]);
      assignText(el.querySelector('[data-ibero-prices-current]'),'Precio para '+M[country].name+': '+(monthly?'semestral '+main+' · mensual '+priceText(key,154.38)+'/mes · 6 meses':main));
      if(el.dataset.iberoPricesProgram!==key) {
        const scroll=el.querySelector('.ibero-prices-scroll'),top=scroll.scrollTop,left=scroll.scrollLeft;
        el.querySelector('thead').innerHTML='<tr><th scope="col">País</th><th scope="col">'+(monthly?'Semestral':'Inversión')+'</th>'+(monthly?'<th scope="col">Mensual<br><small>6 meses</small></th>':'')+'</tr>';
        el.querySelector('tbody').innerHTML=C.order.map(code=>'<tr data-ibero-all-price-row="'+esc(code)+'"><th scope="row">'+esc(M[code].name)+'<small class="ibero-current-country-marker" data-ibero-current-country-marker hidden>Tu país seleccionado</small></th>'+priceCell(key,C.programBases[key],code)+(monthly?priceCell(key,154.38,code):'')+'</tr>').join('');
        el.dataset.iberoPricesProgram=key;el.dataset.iberoPriceColumns=monthly?'3':'2';scroll.scrollTop=top;scroll.scrollLeft=left;
      }
      el.querySelectorAll('[data-ibero-all-price-row]').forEach(row=>{
        const selected=row.dataset.iberoAllPriceRow===country;row.classList.toggle('is-selected',selected);
        if(selected)row.setAttribute('aria-current','true');else row.removeAttribute('aria-current');
        const marker=row.querySelector('[data-ibero-current-country-marker]');if(marker)marker.hidden=!selected;
      });
      assignText(el.querySelector('[data-ibero-prices-footnote]'),key==='agents'?'Ecuador: precio más IVA. España: €50, precio final y pago único en EUR. Los demás destinos muestran el precio indicado.':'Precios en la moneda indicada. '+(monthly?'El plan mensual comprende 6 mensualidades.':C.cardPaymentText));
    });
  }
  function mountControls(container) {
    (container||document).querySelectorAll('[data-ibero-market-mount]:not([data-ibero-mounted])').forEach(el=>{
      el.innerHTML=controlHTML(el.dataset.theme,el.dataset.program||'');el.dataset.iberoMounted='true';
    });
  }
  function syncControls() {
    const stamp = C.order.map(code => code + ':' + optionLabel(code)).join('|');
    document.querySelectorAll('[data-ibero-market-select]').forEach(el => {
      // Reconcile every selector with the full approved table, including inserted controls.
      if (el.dataset.iberoOptionsStamp !== stamp) {
        el.innerHTML = C.order.map(code => '<option value="'+esc(code)+'">'+esc(optionLabel(code))+'</option>').join('');
        el.dataset.iberoOptionsStamp = stamp;
      }
      el.value = country;
      const control = el.closest('.ibero-market-control');
      if (!control) return;
      const img = control.querySelector('.ibero-select-flag');
      if (img) img.remove();
      const wrap = control.querySelector('[data-ibero-zone-wrap]');
      const zones = (M[country].zones || []).filter(z => validZone(z[0]));
      if(zone && validZone(zone) && !zones.some(z=>z[0]===zone)) zones.push([zone,zoneLabel()]);
      if (wrap) {
        wrap.hidden = zones.length < 2;
        const select = wrap.querySelector('select');
        const zoneStamp = country + ':' + zones.map(z => z[0]).join('|');
        if (select) {
          if (select.dataset.stamp !== zoneStamp) {
            select.innerHTML = zones.map(z => '<option value="'+esc(z[0])+'">'+esc(z[1])+'</option>').join('');
            select.dataset.stamp = zoneStamp;
          }
          select.value = zone;
        }
      }
      const note = control.querySelector('[data-ibero-currency-note]');
      if (note) assignText(note, country === 'ES' ? 'Precios para España en euros (EUR).' : country === 'INTL'
        ? 'Precio internacional en USD.'
        : 'Inversión en ' + (currencyNames[M[country].currency] || M[country].currency) + ' (' + M[country].currency + ').');
      const sourceNote=control.querySelector('[data-ibero-country-source-note]');if(sourceNote)sourceNote.remove();
    });
    document.querySelectorAll('[data-ibero-country-name]').forEach(el => assignText(el, M[country].name));
    document.querySelectorAll('[data-ibero-country-only]').forEach(el => {
      const hidden = el.dataset.iberoCountryOnly !== country;
      el.hidden = hidden;
      el.setAttribute('aria-hidden', hidden ? 'true' : 'false');
    });
  }
  function syncSchedules(container) {
    (container||document).querySelectorAll('[data-ibero-local-schedule]').forEach(el=>assignText(el,scheduleText(el.dataset.iberoLocalSchedule)));
  }
  function spainPaymentRoute(general) {
    if(general===M.ES.agentsPayment.url)return {program:'agents',base:57};
    if(/wa\.me\/19152854778/.test(general||'')&&/plan%20mensual/i.test(general))return {program:'master',base:154.38};
    const token=String(general||'').split('/').pop();return C.spainPaymentRoutes[token]||null;
  }
  function consultationLink(program,base) {
    const p=priceInfo(program,base,'ES');
    const plan=program==='master'?(Number(base)===154.38?' · plan de 6 mensualidades':' · pago semestral'):'';
    return 'https://wa.me/19152854778?text='+encodeURIComponent('Hola IBERO, estoy en España y deseo consultar la inscripción y el pago en euros de '+programLabel(program)+plan+'. Precio publicado: '+p.main+(Number(base)===154.38?' por mes':'')+'. Por favor, confirmen la convocatoria y el enlace de pago correspondiente.');
  }
  function paymentLink(general,mx,code=country) {
    if(code==='ES'){
      const route=spainPaymentRoute(general);
      if(route)return route.program==='agents'?M.ES.agentsPayment.url:consultationLink(route.program,route.base);
    }
    return code==='MX'&&mx?mx:general;
  }
  function syncPaymentLabel(anchor,route) {
    if(anchor.hasAttribute('data-ibero-admission'))return;
    if(country==='ES'&&route&&route.program!=='agents'){
      if(!anchor.dataset.iberoEurOriginalHtml)anchor.dataset.iberoEurOriginalHtml=anchor.innerHTML;
      const label='Consultar inscripción en EUR';
      if(anchor.dataset.iberoEurLabel!==label){const icon=anchor.querySelector('i,svg');anchor.innerHTML=(icon?icon.outerHTML+' ':'')+label;anchor.dataset.iberoEurLabel=label;}
    }else if(anchor.dataset.iberoEurOriginalHtml){anchor.innerHTML=anchor.dataset.iberoEurOriginalHtml;delete anchor.dataset.iberoEurOriginalHtml;delete anchor.dataset.iberoEurLabel;}
  }
  function syncPaymentOptions() {
    const candidates=new Set(document.querySelectorAll('[data-ibero-payment-restore]'));
    if(C.programBases[pageProgram()])document.querySelectorAll('#toggle-bank,#bank-details,#toggle-western,#western-details,a[href*="ia.goatify.app/"][href*="#wallet"]').forEach(el=>candidates.add(el));
    document.querySelectorAll('[data-ibero-registration][href*="#wallet"],[data-ibero-academic-wallet]').forEach(el=>candidates.add(el));
    const requested=new URLSearchParams(location.search).get('cohorte');
    const admissions=/\/registro-y-admisiones(?:\/|$)/.test(location.pathname);
    if(admissions){
      const western=document.getElementById('toggle-western-admisiones');
      if(western&&western.parentElement)candidates.add(western.parentElement);
    }
    candidates.forEach(el=>{
      const blocked=country==='ES';
      if(blocked){
        if(!el.dataset.iberoPaymentRestore)el.dataset.iberoPaymentRestore=JSON.stringify({hidden:el.hidden,aria:el.getAttribute('aria-hidden'),tabindex:el.getAttribute('tabindex'),display:el.style.getPropertyValue('display'),priority:el.style.getPropertyPriority('display')});
        el.dataset.iberoEsPaymentHidden='true';el.hidden=true;el.style.setProperty('display','none','important');el.setAttribute('aria-hidden','true');el.setAttribute('tabindex','-1');
      }else if(el.dataset.iberoPaymentRestore){
        const previous=JSON.parse(el.dataset.iberoPaymentRestore);el.hidden=previous.hidden;
        if(previous.display)el.style.setProperty('display',previous.display,previous.priority);else el.style.removeProperty('display');
        for(const attribute of ['aria-hidden','tabindex']){const value=previous[attribute==='aria-hidden'?'aria':'tabindex'];if(value===null)el.removeAttribute(attribute);else el.setAttribute(attribute,value);}
        delete el.dataset.iberoPaymentRestore;delete el.dataset.iberoEsPaymentHidden;
      }
    });
  }
  function syncLinks(container) {
    (container||document).querySelectorAll('a[data-ibero-brochure-general]').forEach(a=>{
      const target=country==='ES'?a.dataset.iberoBrochureEs:a.dataset.iberoBrochureGeneral;
      if(target&&a.getAttribute('href')!==target)a.setAttribute('href',target);
    });
    syncPaymentOptions();
    document.querySelectorAll('[data-ibero-agents-payment-label]').forEach(el=>assignText(el,country==='ES'?'Pagar €50 con tarjeta':'Pagar con Tarjeta Segura'));
    document.querySelectorAll('[data-ibero-agents-fixed-price]').forEach(el=>assignText(el,country==='ES'?'Precio final: €50':'Precio oficial fijo'));
    (container||document).querySelectorAll('a[href]').forEach(a=>{
      if(a.hasAttribute('data-ibero-admission') && !['open','active'].includes(a.dataset.iberoAdmissionState)) return;
      let general=a.dataset.paypalGeneral||a.dataset.generalLink||a.dataset.iberoPaymentOriginalHref;
      let mx=a.dataset.paypalMx||a.dataset.mxLink;
      if (!general) {
        const current=a.getAttribute('href');
        const pair=(C.paymentPairs||[]).find(p=>current===p.general||current===p.mx||(current===M.ES.agentsPayment.url&&p.general==='https://www.paypal.com/ncp/payment/EY623WTCVXXNJ'));
        if (pair) { general=pair.general; mx=pair.mx; }
        else if(spainPaymentRoute(current)){general=current;}
      }
      if (general) { const originalPair=(C.paymentPairs||[]).find(p=>p.general===general);if(!mx&&originalPair)mx=originalPair.mx;if(!a.dataset.iberoPaymentOriginalHref)a.dataset.iberoPaymentOriginalHref=general;const target=paymentLink(general,mx);if(a.getAttribute('href')!==target)a.setAttribute('href',target);syncPaymentLabel(a,spainPaymentRoute(general)); }
    });
  }
  function regionalCohort(requested, targetCountry, usePublished=false) {
    const api=window.IBERO_PROGRAMACION;
    if(!api)return '';
    const cohorts=api.getCohorts('agents',targetCountry);
    const exact=cohorts.find(c=>c.id===requested);
    const date=String(requested||'').match(/\d{4}-\d{2}-\d{2}$/);
    const sameDate=date&&cohorts.find(c=>c.start===date[0]);
    const found=exact||sameDate||(usePublished?cohorts.find(c=>api.isPublicCandidate('agents',c)):null);
    return found?found.id:'';
  }
  function routeURL(value, program, cohort) {
    const url=new URL(value,document.baseURI);
    if(!['ibero.education','www.ibero.education',location.hostname].includes(url.hostname))return url;
    const routeCountry=fromPath(url.pathname,false);
    const targetCountry=routeCountry||validCode(url.searchParams.get('pais')||url.searchParams.get('country'))||country;
    const targetZone=targetCountry===country?zone:defaultZone(targetCountry);
    const slug=url.pathname.replace(/\/index\.html$/,'').replace(/\/+$/,'').split('/').pop();
    const key=program||programFrom(url.pathname);
    url.searchParams.set('pais',targetCountry);
    if(targetZone)url.searchParams.set('zona',targetZone);
    // A destination's explicit cohort is intentional (for example, the November button).
    // Propagate the current cohort only when the destination does not already specify one.
    const requested=url.searchParams.get('cohorte')||cohort||new URLSearchParams(location.search).get('cohorte');
    if(key==='agents'||slug==='registro-y-admisiones'){
      const resolved=/^agents-/.test(requested||'')?regionalCohort(requested,targetCountry):'';
      if(resolved)url.searchParams.set('cohorte',resolved);else url.searchParams.delete('cohorte');
    }else if(/^agents-/.test(url.searchParams.get('cohorte')||''))url.searchParams.delete('cohorte');
    return url;
  }
  function syncCountryNavigation(container) {
    const catalogue=['registro-y-admisiones','calendario-academico','oferta-academica','certificaciones-intensivas','diplomados-intensivos','ibero-labs','espana','contacto'];
    (container||document).querySelectorAll('a[href]').forEach(a=>{
      if(a.hasAttribute('data-ibero-brochure-general'))return;
      const original=a.dataset.iberoCountryHref||a.getAttribute('href')||'';
      if(!original||/^(#|mailto:|tel:|javascript:|data:)/i.test(original))return;
      let url;try{url=new URL(original,document.baseURI);}catch(_){return;}
      if(!['ibero.education','www.ibero.education',location.hostname].includes(url.hostname))return;
      const slug=url.pathname.replace(/\/index\.html$/,'').replace(/\/+$/,'').split('/').pop();
      if(!programFrom(url.pathname)&&!catalogue.includes(slug)&&!fromPath(url.pathname,false))return;
      if(!a.dataset.iberoCountryHref)a.dataset.iberoCountryHref=original;
      url=routeURL(original);
      const target=/^(https?:)?\/\//i.test(original)?url.href:original.split(/[?#]/)[0]+url.search+url.hash;
      if(a.getAttribute('href')!==target)a.setAttribute('href',target);
    });
  }
  function renderAdmissions() {
    document.querySelectorAll('.admission-pay-link').forEach(card=>{
      const only=String(card.dataset.countryOnly||'').toUpperCase();
      const hide=only && only!==country;
      card.classList.toggle('hidden',!!hide);card.setAttribute('aria-hidden',hide?'true':'false');
      if(hide)return;
      const label=card.querySelector('.admission-price-label');
      if(!label)return;

      const key=({MX:'priceMx',CO:'priceCo',PE:'pricePe'})[country]||'priceGeneral';
      const original=card.dataset[key]||card.dataset.priceGeneral||'';
      if(!original)return;

      let value=original;
      const general=String(card.dataset.priceGeneral||'');
      const match=general.match(/USD\s*\$?\s*([0-9]+(?:\.[0-9]+)?)/i);
      if(match){
        const base=Number(match[1]);
        const program=card.dataset.iberoPriceProgram || card.dataset.iberoAdmission || '';
        const info=priceInfo(program,base,country);
        value=country==='ES'?info.main:info.main+(info.tax?' '+info.tax:'');
        if(/\/mes/i.test(general)) value += '/mes · 6 meses';
      }

      const parts=value.split(' · ');
      label.innerHTML='<span class="price-main">'+esc(parts[0])+'</span>'+(parts.length>1?'<span class="price-note'+(/mes/.test(parts.slice(1).join(' '))?' price-note-plan':'')+'">'+esc(parts.slice(1).join(' · '))+'</span>':'');
    });
    const bank=document.getElementById('ecuador-bank-transfer-block');if(bank)bank.classList.toggle('hidden',country!=='EC');
    const note=document.getElementById('payment-country-note');
    if(note)assignText(note,'Precios para '+M[country].name+'. '+(country==='ES'?'Importes en EUR. Agentes IA: pago directo; otros programas: consulta de inscripción. ':C.cardPaymentText)+(country==='EC'?' También puedes pagar por transferencia bancaria.':''));
  }
  function renderCalendar(ev) {
    if(ev)calendarEvent=ev;
    if(!calendarEvent)return;
    const e=calendarEvent;
    const key=e.programId||({creaCurso:'courses',hablar:'communication',diplomado:'appsDiploma',gerenciaCert:'managers'})[e.paymentKey]||e.paymentKey;
    const price=document.getElementById('modal-prices'),inv=document.getElementById('investment-section');
    const priced=!!C.programBases[key] && !/gratis|comercial/.test((e.type||'')+' '+(e.relatedType||''));
    if(inv)inv.style.display=priced?'block':'none';
    if(price && priced) {
      price.classList.add('ibero-single-price');
      if(!price.querySelector('[data-ibero-modal-main]')) {
        price.innerHTML='<div class="ibero-modal-price"><small data-ibero-modal-country></small><strong data-ibero-modal-main></strong><span class="ibero-price-tax" data-ibero-modal-tax hidden></span><div class="ibero-modal-monthly" data-ibero-modal-monthly hidden><small>Plan mensual · 6 meses</small><strong data-ibero-modal-monthly-price></strong></div><p class="ibero-payment-copy" data-ibero-modal-payment></p></div>';
        price.append(createPriceDetails(key,'dark'));price.dataset.iberoCalendarPricesMounted='true';
      }
      const p=priceInfo(key,C.programBases[key]),monthly=key==='master';
      assignText(price.querySelector('[data-ibero-modal-country]'),'Precio para '+M[country].name);
      assignText(price.querySelector('[data-ibero-modal-main]'),(monthly?'Semestral: ':'')+p.main);
      const tax=price.querySelector('[data-ibero-modal-tax]');assignText(tax,p.tax);tax.hidden=!p.tax;
      price.querySelector('[data-ibero-modal-monthly]').hidden=!monthly;
      assignText(price.querySelector('[data-ibero-modal-monthly-price]'),monthly?priceText(key,154.38)+'/mes':'');
      assignText(price.querySelector('[data-ibero-modal-payment]'),(monthly?'Pago semestral o plan mensual. ':'Pago único. ')+(country==='ES'&&key==='agents'?M.ES.agentsPayment.note+' ':'')+C.cardPaymentText);
      price.querySelector('[data-ibero-all-prices]').dataset.iberoAllPrices=key;renderAllPrices(price);
    }
    const schedule=document.getElementById('modal-schedule');
    // Eventos de matrícula y clases gratis conservan su horario específico original.
    if(schedule && C.programBases[key] && !/inscripcion|gratis|comercial/.test(e.type||''))assignText(schedule,scheduleText(key,e));
    syncLinks();
  }
  function refresh() {
    mountAllPrices();mountControls();syncControls();renderAllPrices();
    document.querySelectorAll('[data-ibero-es-price-base]').forEach(el=>{if(!el.dataset.iberoOriginalPriceText)el.dataset.iberoOriginalPriceText=el.textContent;assignText(el,country==='ES'?priceInfo(el.dataset.iberoEsProgram,el.dataset.iberoEsPriceBase,'ES').main:el.dataset.iberoOriginalPriceText);});
    document.querySelectorAll('[data-base],[data-ibero-price-base],[data-usd]').forEach(renderPrice);
    document.querySelectorAll('[data-ibero-es-copy]').forEach(el=>{if(!el.dataset.iberoOriginalCopy)el.dataset.iberoOriginalCopy=el.textContent;assignText(el,country==='ES'?el.dataset.iberoEsCopy:el.dataset.iberoOriginalCopy);});
    renderAdmissions();syncSchedules();syncLinks();renderCalendar();syncCountryNavigation();
  }
  function normalizeRouteSelection(origin) {
    const url=new URL(location.href);
    const requested=url.searchParams.get('cohorte');
    if(/^agents-/.test(requested||'')){
      const resolved=regionalCohort(requested,country,true);
      if(resolved)url.searchParams.set('cohorte',resolved);else url.searchParams.delete('cohorte');
    }
    if(origin==='manual'||url.searchParams.has('pais')||url.searchParams.has('country')||requested){
      url.searchParams.set('pais',country);url.searchParams.delete('country');
      if(zone)url.searchParams.set('zona',zone);else url.searchParams.delete('zona');
      const target=url.pathname+url.search+url.hash;
      if(target!==location.pathname+location.search+location.hash)history.replaceState(null,'',target);
    }
  }
  function apply(code, origin, requestedZone) {
    const previousCountry=country;
    country=root.dataset.iberoFixedCountry==='ES'?'ES':validCode(code)||C.defaultCountry;
    zone=chooseZone(country,requestedZone);source=origin||'manual';
    root.dataset.iberoCountry=country;root.dataset.iberoCurrency=M[country].currency;root.dataset.iberoCurrencySource=source;
    window.iberoSelectedCurrency=M[country].currency;
    normalizeRouteSelection(source);
    if(source==='manual'||source==='url'||source==='storage'){manual=true;save();}
    if(previousCountry!==country&&calendarEvent&&calendarEvent.programId==='agents'){
      const api=window.IBERO_PROGRAMACION;
      calendarEvent=api&&api.getCalendarEvents().find(e=>e.programId==='agents'&&e.start===calendarEvent.start&&e.end===calendarEvent.end)||null;
    }
    refresh();window.dispatchEvent(new CustomEvent('ibero:pais-actualizado',{detail:{country:country,zone:zone,currency:M[country].currency}}));
  }
  function programSummary(key, prices=true) {
    const api=window.IBERO_PROGRAMACION,p=api&&api.getProgram(key);
    if(!p)return '';
    const price=prices&&C.programBases[key]?'<br>Precio: '+esc(priceText(key,C.programBases[key])):'';
    const dates=api.fieldText(key,'summary','long');
    const hours=scheduleText(key);
    const link=routeURL(p.url,key).pathname+routeURL(p.url,key).search+'#inversion';
    return '<strong>'+esc(p.name)+'</strong>'+price+'<br>'+esc(dates)+'<br>'+esc(hours)+'<br><a href="'+esc(link)+'">Consultar programa y matrícula</a>';
  }
  function localizeProgramAnswer(html,program) {
    if(country!=='ES'||!C.programBases[program])return html;
    const pattern=/(?:USD\s*\$?\s*(926\.25|154\.38|277|57)|\$\s*(926\.25|154\.38|277|57)\s*USD)/g;
    return String(html).split(/(<[^>]+>)/g).map((part,index)=>index%2?part:part.replace(pattern,(_,first,second)=>priceInfo(program,Number(first||second),'ES').main)).join('');
  }
  function catalogAnswer(kind) {
    const keys=kind==='master'?['master']:kind==='diplomado'?['appsDiploma','marketingDiploma']:kind==='cursos'?['marketing','agents','managers','courses']:['agents','marketing','appsDiploma','master'];
    return '<strong>Información para '+esc(M[country].name)+'</strong><br><br>'+keys.map(k=>programSummary(k,kind!=='fechas')).join('<br><br>')+(kind==='precios'?'<br><br>'+esc(C.cardPaymentText):'');
  }
  function chatAnswer(text, key) {
    const q=normalize(text);
    if(!key&&/espana|madrid|canarias/.test(q))key='agents';
    if(!key){
      if(/precio|costo|valor|inversion|cuanto/.test(q))return catalogAnswer('precios');
      if(/fecha|cuando|inicia|inicio|horario|hora|calendario/.test(q))return catalogAnswer('fechas');
      if(/cursos|certificaciones/.test(q))return catalogAnswer('cursos');
      if(/pago|pagar|tarjeta|transferencia|inscripcion|matricula/.test(q))return 'Elige el programa y el país en <a href="'+esc(routeURL('/registro-y-admisiones/').pathname+routeURL('/registro-y-admisiones/').search)+'#inversion">Registro y Admisiones</a> para consultar el medio de pago autorizado.'+(country==='EC'?' Ecuador también tiene la alternativa bancaria publicada en esa página.':'');
      return '';
    }
    const payment=/pago|pagar|paypal|inscripcion|inscrib|matricula|tarjeta|transferencia/.test(q);
    if(key==='agents'&&country==='ES'&&payment&&!window.IBERO_PROGRAMACION.getRegistrationState(key).canRegister)return programSummary(key,false)+'<br>Inscripción no disponible para esta cohorte. Consulta la próxima convocatoria en Admisiones antes de realizar un pago.';
    if(key==='agents'&&country==='ES'&&payment)return '<strong>Agentes IA para España: 50 € finales, pago único en EUR.</strong><br><a href="'+esc(M.ES.agentsPayment.url)+'">Pagar 50 € con PayPal o tarjeta</a><br>'+esc(scheduleText(key))+'<br>'+esc(window.IBERO_PROGRAMACION.fieldText(key,'summary','long'))+'<br>No hay una transferencia bancaria española publicada. Después del pago, envía el comprobante a admisiones; la matrícula se confirma tras su validación.';
    if(key==='agents'&&/espana|madrid|canarias/.test(q)){
      const api=window.IBERO_PROGRAMACION;
      const available=api.getCohorts('agents','ES').filter(c=>api.isPublicCandidate('agents',c));
      const dates=available.length?available.map(c=>esc(api.formatRange(c))+': '+esc(c.startTime+'–'+c.endTime)+' Madrid · '+esc(localRange(c.start,c.startTime,c.endTime,'Atlantic/Canary',c.timeZone))+' Canarias').join('<br>'):'Próxima cohorte por confirmar';
      return '<strong>Agentes IA · España</strong><br>'+dates+'<br>Precio final: '+esc(priceText('agents',57,'ES'))+'<br><a href="/espana/productividad-automatizacion-procesos-ia/">Ver Agentes para España</a>';
    }
    if(country==='ES'&&key!=='agents'&&payment){const base=key==='master'&&/mensual|mes/.test(q)?154.38:C.programBases[key];return programSummary(key,true)+'<br><a href="'+esc(consultationLink(key,base))+'">Consultar inscripción y pago en euros</a>. Admisiones confirmará la convocatoria y el medio de pago.';}
    if(/precio|costo|valor|inversion|cuanto/.test(q)||payment){
      if(key==='master')return '<strong>Pago semestral: '+esc(priceText('master',926.25))+'</strong><br>Pago único del semestre. Plan mensual: '+esc(priceText('master',154.38))+'/mes · 6 meses.<br>'+esc(C.cardPaymentText);
      return '<strong>'+esc(M[country].name)+': '+esc(priceText(key,C.programBases[key]))+'</strong><br>Pago único. '+esc(C.cardPaymentText)+'<br><a href="'+esc(routeURL('/registro-y-admisiones/',key).pathname+routeURL('/registro-y-admisiones/',key).search)+'#inversion">Consultar matrícula y método autorizado</a>';
    }
    if(/fecha|cuando|inicia|inicio|empieza|comienza|calendario/.test(q))return programSummary(key,false);
    if(/horario|hora/.test(q))return esc(scheduleText(key))+'<br><a href="#inversion">Cambiar país o zona horaria</a>';
    return '';
  }
  function detectIP() {
    if(manual||fromPath()||!window.fetch||!window.AbortController)return;
    function get(url,timeout) {const ctl=new AbortController();const id=setTimeout(()=>ctl.abort(),timeout);return fetch(url,{cache:'no-store',signal:ctl.signal}).then(r=>r.ok?r.json():null).then(d=>validCode(d&&(d.country_code||d.country))).catch(()=>'').finally(()=>clearTimeout(id));}
    get('https://api.country.is/',1100).then(code=>code||(manual?'':get('https://ipapi.co/json/',1400))).then(code=>{if(code&&!manual)apply(code,'ip',fromTimezone(browserZone())===code?browserZone():null);});
  }
  const API={version:C.version,refresh:refresh,apply:(c,z)=>apply(c,'manual',z),getCountry:()=>country,getZone:()=>zone,priceInfo:priceInfo,priceText:priceText,scheduleText:scheduleText,syncLinks:syncLinks,paymentLink:paymentLink,consultationLink:consultationLink,localizeProgramAnswer:localizeProgramAnswer,renderCalendar:renderCalendar,routeURL:routeURL,regionalCohort:regionalCohort,chatAnswer:chatAnswer,catalogAnswer:catalogAnswer,programSummary:programSummary,programFrom:programFrom};
  window.IBERO_MERCADOS=Object.freeze(API);window.iberoSyncPaymentLinks=syncLinks;
  function boot() {
    const saved=readSaved();const params=new URLSearchParams(location.search);const specified=validCode(params.get('pais'))||validCode(params.get('country'));
    const tz=browserZone();
    if(root.dataset.iberoFixedCountry==='ES')apply('ES','path',params.get('zona'));
    else if(specified)apply(specified,'url',params.get('zona'));
    else if(fromPath())apply(fromPath(),'path',params.get('zona'));
    else if(saved)apply(saved.country,'storage',saved.zone);
    else {const pc=fromPath(),tc=fromTimezone(tz);apply(pc||tc,pc?'path':'timezone',(pc||tc)===tc?tz:null);}
    document.addEventListener('change',e=>{
      if(e.target.matches('[data-ibero-market-select]'))apply(e.target.value,'manual');
      if(e.target.matches('[data-ibero-zone-select]'))apply(country,'manual',e.target.value);
      if(e.target.matches('[data-ibero-price-view]')){const panel=e.target.closest('[data-ibero-all-prices]');if(panel){panel.dataset.iberoPriceView=e.target.value;renderAllPrices(panel.parentElement);}}
    });
    window.addEventListener('ibero:programacion-actualizada',()=>{syncSchedules();renderCalendar();});
    window.addEventListener('storage',e=>{if(e.key===C.storageKey){const s=readSaved();if(s)apply(s.country,'storage',s.zone);}});
    // Solo normaliza los enlaces añadidos por el chat/calendario; no reescribe precios en un bucle.
    let pending=false;new MutationObserver(records=>{if(pending||!records.some(r=>Array.from(r.addedNodes).some(n=>n.nodeType===1)))return;pending=true;queueMicrotask(()=>{pending=false;syncLinks();syncCountryNavigation();});}).observe(document.body,{childList:true,subtree:true});
    detectIP();
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot);else boot();
})();
