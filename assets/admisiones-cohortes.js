/** IBERO — Matrícula y fechas de Admisiones.
 * Usa la programación pública y los enlaces aprobados de cada tarjeta.
 * No cambia precios, no crea reservas, no confirma pagos ni accede al aula.
 */
(function () {
  'use strict';
  const SELECTOR='[data-ibero-admission]';
  const setText=(el,value)=>{if(el && el.textContent!==value)el.textContent=value;};
  const setAttr=(el,name,value)=>{if(el.getAttribute(name)!==value)el.setAttribute(name,value);};
  function updateCard(card) {
    const api=window.IBERO_PROGRAMACION;
    const key=card.dataset.iberoAdmission;
    const state=api?api.getRegistrationState(key):{state:'loading',canRegister:false,cohort:null};
    const country=window.IBERO_MERCADOS?window.IBERO_MERCADOS.getCountry():(document.documentElement.dataset.iberoCountry||'EC');
    const p=api?api.getProgram(key):null;
    const title=p?p.name:'el programa';
    const only=(card.dataset.countryOnly||'').toUpperCase();
    const visible=!only||only===country;
    card.classList.toggle('hidden',!visible);
    setAttr(card,'aria-hidden',visible?'false':'true');
    if(visible)card.removeAttribute('tabindex');else setAttr(card,'tabindex','-1');
    setAttr(card,'data-ibero-admission-state',state.state);
    const monthly=/\/mes/i.test(card.dataset.priceGeneral||'');
    let target,action;
    if(state.canRegister) {
      target=window.IBERO_MERCADOS?window.IBERO_MERCADOS.paymentLink(card.dataset.generalLink,card.dataset.mxLink,country):country==='MX'&&card.dataset.mxLink?card.dataset.mxLink:card.dataset.generalLink;
      action=country==='ES'?(key==='agents'?'Pagar €50':'Consultar inscripción en EUR'):monthly?'Consultar plan mensual':'Pagar matrícula';
      setText(card.querySelector('[data-admission-status]'),state.state==='active'?'Cohorte en curso':'Matrícula · fecha confirmada');
      setText(card.querySelector('[data-admission-date]'),api.formatRange(state.cohort,'long'));
      const schedule=window.IBERO_MERCADOS?window.IBERO_MERCADOS.scheduleText(key):
        state.cohort.startTime+'–'+state.cohort.endTime+' · Ecuador';
      setText(card.querySelector('[data-admission-schedule]'),schedule);
      setAttr(card,'data-ibero-cohort-id',state.cohort.id);
    } else {
      target='https://wa.me/19152854778?text='+encodeURIComponent('Hola IBERO, deseo consultar la próxima convocatoria de '+title+'. Mi país es '+country+'.');
      action='Consultar próxima convocatoria';
      setText(card.querySelector('[data-admission-status]'),'Consulta · sin fecha confirmada');
      setText(card.querySelector('[data-admission-date]'),api?'Próxima cohorte por confirmar':'Consulta disponibilidad con Admisiones');
      setText(card.querySelector('[data-admission-schedule]'),'Confirma la convocatoria antes de realizar el pago.');
      card.removeAttribute('data-ibero-cohort-id');
    }
    if(target)setAttr(card,'href',target);
    const button=card.querySelector('[data-admission-action]');
    if(button && button.dataset.label!==action){button.textContent=action+' ↗';button.dataset.label=action;}
  }
  function refresh(){document.querySelectorAll(SELECTOR).forEach(updateCard);}
  function boot(){
    refresh();
    window.addEventListener('ibero:pais-actualizado',refresh);
    window.addEventListener('ibero:programacion-actualizada',refresh);
    window.addEventListener('focus',refresh);
    window.addEventListener('pageshow',refresh);
    document.addEventListener('visibilitychange',()=>{if(!document.hidden)refresh();});
    // Revalidar el destino también en el instante del clic, sin impedir el uso normal del enlace.
    const verify=e=>{const card=e.target.closest && e.target.closest(SELECTOR);if(card)updateCard(card);};
    document.addEventListener('click',verify,true);
    document.addEventListener('auxclick',verify,true);
  }
  window.IBERO_ADMISIONES_COHORTES=Object.freeze({refresh});
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});else boot();
})();

