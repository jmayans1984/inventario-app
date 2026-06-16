import{t as e}from"./api-Ckz6uiv4.js";import{m as t,t as n}from"./VBtn-Bkn9bau6.js";import{t as r}from"./MainLayout-Bbs6TZAi.js";import{An as i,Gt as a,Rn as o,Sn as s,Xn as c,Xt as l,_n as u,bn as d,en as f,i as ee,in as p,jn as te,nn as m,on as h,qn as g,rn as _,s as ne,sn as v,tn as y}from"./index-XxQ0hXtu.js";import{t as b}from"./VIcon-blCSi6-Z.js";var re={class:`nom-wrap`},ie={class:`nom-header`},ae={class:`nom-header-icon`},oe={class:`flex-1`},se={key:0,class:`nom-sub`},ce={style:{display:`flex`,gap:`8px`,"align-items":`center`,"flex-wrap":`wrap`}},le=[`value`],ue={key:0,class:`nom-card`,style:{padding:`32px`,"text-align":`center`}},de={key:1,class:`recibos-grid`},fe={class:`rec-header-container`},pe={class:`rec-header`},x={class:`rec-empresa`},S={class:`rec-periodo`},C={class:`rec-emp-row`},w={class:`rec-emp-nombre`},T={class:`rec-emp-tipo`},E={class:`rec-neto-big`},D={class:`rec-table`},O={key:0},k={class:`ta-r`},A={class:`ta-r`},j={class:`ta-r`},M={key:1},N={class:`ta-r`},P={class:`ta-r`},F={class:`ta-r`},I={key:2},L={class:`ta-r`},R={class:`rec-total-row`},z={class:`ta-r`},B={class:`rec-table`},me={key:0},he={class:`ta-r`},ge={key:1},_e={class:`ta-r`},ve={key:2},ye={class:`ta-r`},be={key:3},xe={class:`ta-r`},Se={key:4},V={class:`ta-r`},Ce={key:5},we={class:`ta-r`},Te={class:`rec-total-row`},Ee={class:`ta-r`,style:{color:`#ef4444`}},De={class:`rec-table`,style:{opacity:`0.55`,"font-size":`10px`}},Oe={class:`ta-r`},ke={class:`ta-r`},Ae={key:0},je={class:`ta-r`},Me={key:1},Ne={class:`ta-r`},Pe={class:`rec-net-footer`},Fe={class:`rec-ytd-val`},Ie={class:`rec-net-amount`},Le={key:2,class:`nom-card estado-vacio`},Re={key:3,class:`nom-card estado-vacio`},H=ee({__name:`RecibosNominaView`,setup(ee){let H=ne(),ze=f(()=>H.empresa||H.user?.empresa||localStorage.getItem(`empresaActual`)||``),U=f(()=>H.empresaNombre||H.user?.empresaNombre||`Mi Empresa`),W=o([]),G=o(``),K=o(null),q=o([]),J=o(!1);function Y(e){if(!e)return`—`;try{let t;t=e instanceof Date?`${e.getUTCFullYear()}-${String(e.getUTCMonth()+1).padStart(2,`0`)}-${String(e.getUTCDate()).padStart(2,`0`)}`:String(e).split(`T`)[0];let[n,r,i]=t.split(`-`);return`${r}/${i}/${n}`}catch{return String(e)}}function X(e){return`$`+parseFloat(e||0).toLocaleString(`en-US`,{minimumFractionDigits:2,maximumFractionDigits:2})}function Z(e){return parseFloat(e||0).toFixed(2)}function Q(e){return e.tipo_empleado===`1099`&&e.empresa_contratista?`${e.apellido}, ${e.nombre} — ${e.empresa_contratista}`:`${e.apellido}, ${e.nombre}`}async function Be(){try{W.value=(await e.get(`/nomina/liquidaciones`,{params:{empresa:ze.value}})).data?.data||[],W.value.length&&(G.value=W.value[0].id,await $())}catch(e){console.error(`Error cargando liquidaciones:`,e)}}async function $(){if(!G.value){K.value=null,q.value=[];return}J.value=!0;try{let t=await e.get(`/nomina/liquidaciones/${G.value}`);K.value=t.data.liquidacion,q.value=t.data.lineas||[]}catch(e){console.error(`Error cargando líneas:`,e),K.value=null,q.value=[]}finally{J.value=!1}}function Ve(e){if(!K.value)return;let t=window.open(``,`_blank`);if(!t){alert(`Activa los pop-ups para imprimir el recibo`);return}let n=`${Y(K.value.semana_inicio)} — ${Y(K.value.semana_fin)}`,r=U.value,i=Q(e),a=e.tipo_empleado===`W2`,o=`<span class="rec-badge ${a?`badge-w2`:`badge-1099`}">${e.tipo_empleado}</span>`,s=a?`Employee`:`Independent Contractor`,c=``;parseFloat(e.horas_regulares)>0&&(c+=`
    <tr><td>Regular Pay</td><td class="ta-r">${Z(e.horas_regulares)}</td>
    <td class="ta-r">${X(e.valor_hora)}</td><td class="ta-r">${X(e.bruto_regular)}</td></tr>`),parseFloat(e.horas_overtime)>0&&(c+=`
    <tr><td>Overtime (1.5×)</td><td class="ta-r">${Z(e.horas_overtime)}</td>
    <td class="ta-r">${X(e.valor_hora_ot)}</td><td class="ta-r">${X(e.bruto_overtime)}</td></tr>`),parseFloat(e.bruto_base)>0&&(c+=`
    <tr><td>${e.es_monto_fijo?`Fixed Weekly`:`Base Salary`}</td><td class="ta-r">—</td>
    <td class="ta-r">—</td><td class="ta-r">${X(e.bruto_base)}</td></tr>`);let l=``;a&&(parseFloat(e.federal_income_tax)>0&&(l+=`<tr><td>Federal Income Tax</td><td class="ta-r">-${X(e.federal_income_tax)}</td></tr>`),parseFloat(e.social_security_emp)>0&&(l+=`<tr><td>Social Security (6.2%)</td><td class="ta-r">-${X(e.social_security_emp)}</td></tr>`),parseFloat(e.medicare_emp)>0&&(l+=`<tr><td>Medicare (1.45%)</td><td class="ta-r">-${X(e.medicare_emp)}</td></tr>`),parseFloat(e.workers_comp)>0&&(l+=`<tr><td>Workers' Comp</td><td class="ta-r">-${X(e.workers_comp)}</td></tr>`));let u=`<!DOCTYPE html><html><head><meta charset="UTF-8">
    <title>Recibo de Pago — ${i}</title>
    <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body { font-family: Arial, Helvetica, sans-serif; background: white; color: #111; padding: 20px; }
    .recibo { border: 1px solid #ddd; border-radius: 8px; overflow: hidden; }
    .rec-header { background: #1e3a5f; padding: 10px 14px; }
    .rec-empresa { font-size: 9px; font-weight: 700; color: rgba(255,255,255,0.6); text-transform: uppercase; letter-spacing: 0.8px; }
    .rec-titulo  { font-size: 14px; font-weight: 800; color: white; margin: 2px 0; }
    .rec-periodo { font-size: 10px; color: rgba(255,255,255,0.55); }
    .rec-emp-row { display: flex; justify-content: space-between; align-items: center; padding: 10px 14px; border-bottom: 1px solid #eee; }
    .rec-emp-nombre { font-size: 13px; font-weight: 700; }
    .rec-emp-tipo   { font-size: 10px; color: #888; margin-top: 2px; }
    .rec-badge { font-size: 8px; font-weight: 800; padding: 1px 5px; border-radius: 3px; margin-right: 4px; }
    .badge-w2   { background: #ede9fe; color: #7c3aed; }
    .badge-1099 { background: #fef3c7; color: #b45309; }
    .rec-neto-big { text-align: right; font-size: 20px; font-weight: 800; color: #059669; }
    .rec-neto-big .label { font-size: 9px; color: #888; }
    .sec-title { font-size: 8px; font-weight: 800; letter-spacing: 0.8px; color: #999; text-transform: uppercase; padding: 5px 14px 2px; }
    table { width: 100%; border-collapse: collapse; font-size: 10px; }
    th { padding: 3px 8px; text-align: left; font-size: 8px; font-weight: 800; color: #999; text-transform: uppercase; background: #f9f9f9; }
    th.ta-r { text-align: right; }
    td { padding: 3px 8px; border-bottom: 1px solid #f0f0f0; }
    td.ta-r { text-align: right; }
    tr.total td { background: #f5f5f5; font-weight: 700; font-size: 11px; padding: 5px 8px; }
    .rec-footer { display: flex; justify-content: space-between; align-items: center; padding: 10px 14px; background: #f0fdf4; border-top: 1px solid #bbf7d0; }
    .rec-ytd { font-size: 10px; color: #444; }
    .rec-net { font-size: 18px; font-weight: 800; color: #059669; text-align: right; }
    @media print { .recibo { page-break-inside: avoid; } .rec-header { -webkit-print-color-adjust: exact; print-color-adjust: exact; } }
  </style></head>
    <body>${`
    <div class="recibo">
      <div class="rec-header">
        <div class="rec-empresa">${r}</div>
        <div class="rec-titulo">RECIBO DE PAGO</div>
        <div class="rec-periodo">${n}</div>
      </div>
      <div class="rec-emp-row">
        <div>
          <div class="rec-emp-nombre">${i}</div>
          <div class="rec-emp-tipo">${o} ${s}</div>
        </div>
        <div class="rec-neto-big">
          <div class="label">NET PAY</div>
          ${X(e.total_neto)}
        </div>
      </div>
      <div class="sec-title">EARNINGS</div>
      <table><thead><tr><th>DESCRIPTION</th><th class="ta-r">HRS</th><th class="ta-r">RATE</th><th class="ta-r">AMOUNT</th></tr></thead>
      <tbody>${c}<tr class="total"><td colspan="3">Gross Pay</td><td class="ta-r">${X(e.total_bruto)}</td></tr></tbody></table>
      ${a&&l?`
      <div class="sec-title">DEDUCTIONS</div>
      <table><tbody>${l}
      <tr class="total"><td>Total Deductions</td><td class="ta-r">-${X(e.total_deducciones)}</td></tr></tbody></table>`:``}
      <div class="rec-footer">
        <div class="rec-ytd"><div style="font-size:8px;color:#888">YTD GROSS</div>${X(e.ytd_bruto)}</div>
        <div class="rec-net"><div style="font-size:8px;color:#888">NET PAY</div>${X(e.total_neto)}</div>
      </div>
    </div>`}</body></html>`;t.document.write(u),t.document.close(),t.focus()}function He(){if(!q.value.length||!K.value)return;let e=window.open(``,`_blank`);if(!e){alert(`Activa los pop-ups para imprimir los recibos`);return}let t=`${Y(K.value.semana_inicio)} — ${Y(K.value.semana_fin)}`,n=U.value,r=`<!DOCTYPE html><html><head><meta charset="UTF-8">
    <title>Recibos de Pago — ${t}</title>
    <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body { font-family: Arial, Helvetica, sans-serif; background: white; color: #111; }
    .pagina { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; padding: 12px; }
    @media print { .pagina { grid-template-columns: 1fr !important; gap: 4px !important; padding: 8px; } }
    .recibo { border: 1px solid #ddd; border-radius: 8px; overflow: hidden; break-inside: avoid; page-break-inside: avoid; }
    .rec-header { background: #1e3a5f; padding: 10px 14px; }
    .rec-empresa { font-size: 9px; font-weight: 700; color: rgba(255,255,255,0.6); text-transform: uppercase; letter-spacing: 0.8px; }
    .rec-titulo  { font-size: 14px; font-weight: 800; color: white; margin: 2px 0; }
    .rec-periodo { font-size: 10px; color: rgba(255,255,255,0.55); }
    .rec-emp-row { display: flex; justify-content: space-between; align-items: center; padding: 10px 14px; border-bottom: 1px solid #eee; }
    .rec-emp-nombre { font-size: 13px; font-weight: 700; }
    .rec-emp-tipo   { font-size: 10px; color: #888; margin-top: 2px; }
    .rec-badge { font-size: 8px; font-weight: 800; padding: 1px 5px; border-radius: 3px; margin-right: 4px; }
    .badge-w2   { background: #ede9fe; color: #7c3aed; }
    .badge-1099 { background: #fef3c7; color: #b45309; }
    .rec-neto-big { text-align: right; font-size: 20px; font-weight: 800; color: #059669; }
    .rec-neto-big .label { font-size: 9px; color: #888; }
    .sec-title { font-size: 8px; font-weight: 800; letter-spacing: 0.8px; color: #999; text-transform: uppercase; padding: 5px 14px 2px; }
    table { width: 100%; border-collapse: collapse; font-size: 10px; }
    th { padding: 3px 8px; text-align: left; font-size: 8px; font-weight: 800; color: #999; text-transform: uppercase; background: #f9f9f9; }
    th.ta-r { text-align: right; }
    td { padding: 3px 8px; border-bottom: 1px solid #f0f0f0; }
    td.ta-r { text-align: right; }
    tr.total td { background: #f5f5f5; font-weight: 700; font-size: 11px; padding: 5px 8px; }
    .rec-footer { display: flex; justify-content: space-between; align-items: center; padding: 10px 14px; background: #f0fdf4; border-top: 1px solid #bbf7d0; }
    .rec-ytd { font-size: 10px; color: #444; }
    .rec-net { font-size: 18px; font-weight: 800; color: #059669; text-align: right; }
    @media print {
      .pagina { grid-template-columns: 1fr !important; gap: 4px !important; }
      .recibo { page-break-inside: avoid; page-break-after: always; }
      .rec-header { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
      .rec-footer  { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
    }
  </style></head>
    <body><div class="pagina">${q.value.map(e=>{let r=Q(e),i=e.tipo_empleado===`W2`,a=`<span class="rec-badge ${i?`badge-w2`:`badge-1099`}">${e.tipo_empleado}</span>`,o=i?`Employee`:`Independent Contractor`,s=``;parseFloat(e.horas_regulares)>0&&(s+=`
      <tr><td>Regular Pay</td><td class="ta-r">${Z(e.horas_regulares)}</td>
      <td class="ta-r">${X(e.valor_hora)}</td><td class="ta-r">${X(e.bruto_regular)}</td></tr>`),parseFloat(e.horas_overtime)>0&&(s+=`
      <tr><td>Overtime (1.5×)</td><td class="ta-r">${Z(e.horas_overtime)}</td>
      <td class="ta-r">${X(e.valor_hora_ot)}</td><td class="ta-r">${X(e.bruto_overtime)}</td></tr>`),parseFloat(e.bruto_base)>0&&(s+=`
      <tr><td>${e.es_monto_fijo?`Fixed Weekly`:`Base Salary`}</td><td class="ta-r">—</td>
      <td class="ta-r">—</td><td class="ta-r">${X(e.bruto_base)}</td></tr>`);let c=``;return i&&(parseFloat(e.federal_income_tax)>0&&(c+=`<tr><td>Federal Income Tax</td><td class="ta-r">-${X(e.federal_income_tax)}</td></tr>`),parseFloat(e.social_security_emp)>0&&(c+=`<tr><td>Social Security (6.2%)</td><td class="ta-r">-${X(e.social_security_emp)}</td></tr>`),parseFloat(e.medicare_emp)>0&&(c+=`<tr><td>Medicare (1.45%)</td><td class="ta-r">-${X(e.medicare_emp)}</td></tr>`),parseFloat(e.workers_comp)>0&&(c+=`<tr><td>Workers' Comp</td><td class="ta-r">-${X(e.workers_comp)}</td></tr>`)),`
    <div class="recibo">
      <div class="rec-header">
        <div class="rec-empresa">${n}</div>
        <div class="rec-titulo">RECIBO DE PAGO</div>
        <div class="rec-periodo">${t}</div>
      </div>
      <div class="rec-emp-row">
        <div>
          <div class="rec-emp-nombre">${r}</div>
          <div class="rec-emp-tipo">${a} ${o}</div>
        </div>
        <div class="rec-neto-big">
          <div class="label">NET PAY</div>
          ${X(e.total_neto)}
        </div>
      </div>
      <div class="sec-title">EARNINGS</div>
      <table><thead><tr><th>DESCRIPTION</th><th class="ta-r">HRS</th><th class="ta-r">RATE</th><th class="ta-r">AMOUNT</th></tr></thead>
      <tbody>${s}<tr class="total"><td colspan="3">Gross Pay</td><td class="ta-r">${X(e.total_bruto)}</td></tr></tbody></table>
      ${i&&c?`
      <div class="sec-title">DEDUCTIONS</div>
      <table><tbody>${c}
      <tr class="total"><td>Total Deductions</td><td class="ta-r">-${X(e.total_deducciones)}</td></tr></tbody></table>`:``}
      <div class="rec-footer">
        <div class="rec-ytd"><div style="font-size:8px;color:#888">YTD GROSS</div>${X(e.ytd_bruto)}</div>
        <div class="rec-net"><div style="font-size:8px;color:#888">NET PAY</div>${X(e.total_neto)}</div>
      </div>
    </div>`}).join(``)}</div></body></html>`;e.document.write(r),e.document.close(),e.focus()}return u(Be),(e,o)=>(d(),m(r,null,{default:i(()=>[y(`div`,re,[y(`div`,ie,[y(`div`,ae,[v(b,{size:`20`,color:`white`},{default:i(()=>[...o[1]||=[h(`mdi-file-document-outline`,-1)]]),_:1})]),y(`div`,oe,[o[2]||=y(`h1`,{class:`nom-title`},`RECIBOS DE PAGO — PAY STUBS`,-1),K.value?(d(),p(`p`,se,[h(c(Y(K.value.semana_inicio))+` — `+c(Y(K.value.semana_fin))+` `,1),y(`span`,{class:g([`estado-badge`,`estado-${K.value.estado?.toLowerCase()}`])},c(K.value.estado),3)])):_(``,!0)]),y(`div`,ce,[te(y(`select`,{"onUpdate:modelValue":o[0]||=e=>G.value=e,class:`drw-select`,style:{width:`220px`},onChange:$},[o[3]||=y(`option`,{value:``},`— Seleccionar nómina —`,-1),(d(!0),p(l,null,s(W.value,e=>(d(),p(`option`,{key:e.id,value:e.id},c(Y(e.semana_inicio))+` · `+c(e.estado),9,le))),128))],544),[[a,G.value]]),q.value.length?(d(),m(n,{key:0,size:`small`,color:`#8b5cf6`,variant:`flat`,onClick:He},{default:i(()=>[v(b,{size:`14`,class:`mr-1`},{default:i(()=>[...o[4]||=[h(`mdi-printer`,-1)]]),_:1}),o[5]||=h(` Imprimir Todos `,-1)]),_:1})):_(``,!0)])]),J.value?(d(),p(`div`,ue,[v(t,{indeterminate:``,color:`#8b5cf6`,size:`28`})])):K.value&&q.value.length?(d(),p(`div`,de,[(d(!0),p(l,null,s(q.value,e=>(d(),p(`div`,{key:e.id,class:`recibo`},[y(`div`,fe,[y(`div`,pe,[y(`div`,x,c(U.value),1),o[6]||=y(`div`,{class:`rec-titulo`},`RECIBO DE PAGO`,-1),y(`div`,S,c(Y(K.value.semana_inicio))+` — `+c(Y(K.value.semana_fin)),1)]),v(n,{size:`x-small`,icon:`mdi-printer`,color:`white`,variant:`text`,onClick:t=>Ve(e),class:`rec-print-btn`,title:`Imprimir este recibo`},null,8,[`onClick`])]),y(`div`,C,[y(`div`,null,[y(`div`,w,c(Q(e)),1),y(`div`,T,[y(`span`,{class:g([`rec-badge`,e.tipo_empleado===`W2`?`badge-w2`:`badge-1099`])},c(e.tipo_empleado),3),h(` `+c(e.tipo_empleado===`W2`?`Employee`:`Independent Contractor`),1)])]),y(`div`,E,[o[7]||=y(`div`,{style:{"font-size":`10px`,color:`rgba(255,255,255,0.5)`}},`NET PAY`,-1),y(`div`,null,c(X(e.total_neto)),1)])]),o[29]||=y(`div`,{class:`rec-section-title`},`EARNINGS`,-1),y(`table`,D,[o[13]||=y(`thead`,null,[y(`tr`,null,[y(`th`,null,`DESCRIPTION`),y(`th`,{class:`ta-r`},`HOURS`),y(`th`,{class:`ta-r`},`RATE`),y(`th`,{class:`ta-r`},`AMOUNT`)])],-1),y(`tbody`,null,[parseFloat(e.horas_regulares)>0?(d(),p(`tr`,O,[o[8]||=y(`td`,null,`Regular Pay`,-1),y(`td`,k,c(Z(e.horas_regulares)),1),y(`td`,A,c(X(e.valor_hora))+`/h`,1),y(`td`,j,c(X(e.bruto_regular)),1)])):_(``,!0),parseFloat(e.horas_overtime)>0?(d(),p(`tr`,M,[o[9]||=y(`td`,null,`Overtime Pay (1.5×)`,-1),y(`td`,N,c(Z(e.horas_overtime)),1),y(`td`,P,c(X(e.valor_hora_ot))+`/h`,1),y(`td`,F,c(X(e.bruto_overtime)),1)])):_(``,!0),parseFloat(e.bruto_base)>0?(d(),p(`tr`,I,[y(`td`,null,c(e.es_monto_fijo?`Fixed Weekly Amount`:`Base Salary`),1),o[10]||=y(`td`,{class:`ta-r`},`—`,-1),o[11]||=y(`td`,{class:`ta-r`},`—`,-1),y(`td`,L,c(X(e.bruto_base)),1)])):_(``,!0),y(`tr`,R,[o[12]||=y(`td`,{colspan:`3`},[y(`strong`,null,`Gross Pay`)],-1),y(`td`,z,[y(`strong`,null,c(X(e.total_bruto)),1)])])])]),e.tipo_empleado===`W2`?(d(),p(l,{key:0},[o[25]||=y(`div`,{class:`rec-section-title`},`DEDUCTIONS`,-1),y(`table`,B,[y(`tbody`,null,[parseFloat(e.federal_income_tax)>0?(d(),p(`tr`,me,[o[14]||=y(`td`,null,`Federal Income Tax (FIT)`,-1),y(`td`,he,`-`+c(X(e.federal_income_tax)),1)])):_(``,!0),parseFloat(e.social_security_emp)>0?(d(),p(`tr`,ge,[o[15]||=y(`td`,null,`Social Security (6.2%)`,-1),y(`td`,_e,`-`+c(X(e.social_security_emp)),1)])):_(``,!0),parseFloat(e.medicare_emp)>0?(d(),p(`tr`,ve,[o[16]||=y(`td`,null,`Medicare (1.45%)`,-1),y(`td`,ye,`-`+c(X(e.medicare_emp)),1)])):_(``,!0),parseFloat(e.medicare_adicional)>0?(d(),p(`tr`,be,[o[17]||=y(`td`,null,`Additional Medicare (0.9%)`,-1),y(`td`,xe,`-`+c(X(e.medicare_adicional)),1)])):_(``,!0),parseFloat(e.workers_comp)>0?(d(),p(`tr`,Se,[o[18]||=y(`td`,null,`Workers' Compensation`,-1),y(`td`,V,`-`+c(X(e.workers_comp)),1)])):_(``,!0),parseFloat(e.otras_deducciones)>0?(d(),p(`tr`,Ce,[o[19]||=y(`td`,null,`Other Deductions`,-1),y(`td`,we,`-`+c(X(e.otras_deducciones)),1)])):_(``,!0),y(`tr`,Te,[o[20]||=y(`td`,null,[y(`strong`,null,`Total Deductions`)],-1),y(`td`,Ee,[y(`strong`,null,`-`+c(X(e.total_deducciones)),1)])])])]),o[26]||=y(`div`,{class:`rec-section-title`,style:{opacity:`0.5`}},`EMPLOYER CONTRIBUTIONS (informativo)`,-1),y(`table`,De,[y(`tbody`,null,[y(`tr`,null,[o[21]||=y(`td`,null,`Social Security (employer 6.2%)`,-1),y(`td`,Oe,c(X(e.social_security_er)),1)]),y(`tr`,null,[o[22]||=y(`td`,null,`Medicare (employer 1.45%)`,-1),y(`td`,ke,c(X(e.medicare_er)),1)]),parseFloat(e.futa)>0?(d(),p(`tr`,Ae,[o[23]||=y(`td`,null,`FUTA`,-1),y(`td`,je,c(X(e.futa)),1)])):_(``,!0),parseFloat(e.suta)>0?(d(),p(`tr`,Me,[o[24]||=y(`td`,null,`FL Reemployment Tax`,-1),y(`td`,Ne,c(X(e.suta)),1)])):_(``,!0)])])],64)):_(``,!0),y(`div`,Pe,[y(`div`,null,[o[27]||=y(`div`,{class:`rec-ytd-label`},`YTD Gross`,-1),y(`div`,Fe,c(X(e.ytd_bruto)),1)]),y(`div`,Ie,[o[28]||=y(`div`,{style:{"font-size":`10px`,opacity:`0.7`}},`NET PAY`,-1),y(`div`,null,c(X(e.total_neto)),1)])])]))),128))])):G.value&&!J.value?(d(),p(`div`,Le,[v(b,{size:`40`,color:`rgba(var(--v-theme-on-surface),0.15)`},{default:i(()=>[...o[30]||=[h(`mdi-file-document-outline`,-1)]]),_:1}),o[31]||=y(`div`,{style:{"margin-top":`10px`,"font-weight":`700`}},`Sin líneas de nómina`,-1),o[32]||=y(`div`,{style:{"font-size":`12px`,color:`rgba(var(--v-theme-on-surface),0.4)`,"margin-top":`4px`}},` Esta nómina no tiene recibos calculados. Calcula la nómina primero. `,-1)])):G.value?_(``,!0):(d(),p(`div`,Re,[v(b,{size:`40`,color:`rgba(var(--v-theme-on-surface),0.15)`},{default:i(()=>[...o[33]||=[h(`mdi-cash-register`,-1)]]),_:1}),o[34]||=y(`div`,{style:{"margin-top":`10px`,"font-weight":`700`}},`Selecciona una nómina`,-1),o[35]||=y(`div`,{style:{"font-size":`12px`,color:`rgba(var(--v-theme-on-surface),0.4)`,"margin-top":`4px`}},` Elige una nómina aprobada del selector para ver los recibos de pago. `,-1)]))])]),_:1}))}},[[`__scopeId`,`data-v-624e2a3c`]]);export{H as default};