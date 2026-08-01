(function(){
  const nf=(n,d=0)=>new Intl.NumberFormat('es-EC',{maximumFractionDigits:d}).format(Number.isFinite(n)?n:0);
  const money=(n)=>new Intl.NumberFormat('es-EC',{style:'currency',currency:'USD',maximumFractionDigits:0}).format(Number.isFinite(n)?n:0);
  document.querySelectorAll('[data-roi-calculator]').forEach((root)=>{
    const get=(name)=>Number(root.querySelector(`[name="${name}"]`)?.value||0);
    const out=(name,value)=>{const el=root.querySelector(`[data-out="${name}"]`);if(el)el.textContent=value};
    const calc=()=>{
      const employees=get('employees'),hours=get('hours'),cost=get('cost'),weeks=get('weeks'),reduction=get('reduction')/100,investment=get('investment'),monthly=get('monthly');
      const annualHours=employees*hours*weeks*reduction;
      const gross=annualHours*cost;
      const annualCost=investment+(monthly*12);
      const net=gross-annualCost;
      const roi=annualCost>0?(net/annualCost)*100:0;
      const monthlySavings=gross/12;
      const payback=monthlySavings>monthly?investment/(monthlySavings-monthly):0;
      out('hours',nf(annualHours));out('gross',money(gross));out('net',money(net));out('roi',`${nf(roi,1)}%`);out('payback',payback>0?`${nf(payback,1)} meses`:'No calculable');
    };
    root.querySelectorAll('input,select').forEach((el)=>el.addEventListener('input',calc));calc();
  });
  document.querySelectorAll('[data-maturity-test]').forEach((root)=>{
    const questions=[...root.querySelectorAll('[data-maturity-question]')];
    const button=root.querySelector('[data-maturity-submit]');
    const level=root.querySelector('[data-out="level"]');
    const scoreEl=root.querySelector('[data-out="score"]');
    const text=root.querySelector('[data-out="recommendation"]');
    const progress=root.querySelector('[data-out="progress"]');
    if(!button)return;
    button.addEventListener('click',()=>{
      let answered=0,total=0;
      questions.forEach((q)=>{const selected=q.querySelector('input:checked');if(selected){answered++;total+=Number(selected.value)}});
      if(answered!==questions.length){text.textContent=`Completa las ${questions.length} preguntas para obtener un diagnóstico consistente.`;return}
      const max=questions.length*3;const score=Math.round(total/max*100);
      let label='Inicial',recommendation='Prioriza alfabetización, reglas de uso, selección de casos simples y una primera ruta de capacitación.';
      if(score>=76){label='Estratégico';recommendation='Tu organización puede escalar portafolios de casos, gobierno, automatización avanzada y medición de retorno por unidad.'}
      else if(score>=51){label='Operativo';recommendation='Conviene estandarizar prácticas, integrar áreas, medir ahorros y convertir pilotos aislados en procesos repetibles.'}
      else if(score>=26){label='Emergente';recommendation='Ya existe una base. El siguiente paso es capacitar por departamentos, definir protocolos y ejecutar pilotos con responsables.'}
      level.textContent=label;scoreEl.textContent=`${score}%`;text.textContent=recommendation;if(progress)progress.style.width=`${score}%`;
      root.scrollIntoView({behavior:'smooth',block:'center'});
    });
  });
  document.querySelectorAll('[data-copy-result]').forEach((btn)=>btn.addEventListener('click',async()=>{
    const target=document.querySelector(btn.dataset.copyResult);if(!target)return;
    try{await navigator.clipboard.writeText(target.innerText);const original=btn.textContent;btn.textContent='Resultado copiado';setTimeout(()=>btn.textContent=original,1800)}catch(e){}
  }));
})();
