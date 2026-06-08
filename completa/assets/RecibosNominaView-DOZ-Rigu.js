import{t as e}from"./api-Ckz6uiv4.js";import{m as t,t as n}from"./VBtn-CbyxCY1o.js";import{t as r}from"./MainLayout-ByCVEXc-.js";import{$t as i,Dn as a,Fn as o,Ht as s,On as c,Qt as l,Wn as u,Zt as d,_n as f,a as ee,en as p,in as m,mn as te,qn as h,qt as g,rn as _,tn as v,yn as y}from"./index-DtNOZBLp.js";import{c as ne,t as b}from"./VIcon-CEa9CjOP.js";var re={class:`nom-wrap`},ie={class:`nom-header`},ae={class:`nom-header-icon`},oe={class:`flex-1`},se={key:0,class:`nom-sub`},ce={style:{display:`flex`,gap:`8px`,"align-items":`center`,"flex-wrap":`wrap`}},le=[`value`],ue={key:0,class:`nom-card`,style:{padding:`32px`,"text-align":`center`}},de={key:1,class:`recibos-grid`},fe={class:`rec-header-container`},pe={class:`rec-header`},x={class:`rec-empresa`},S={class:`rec-periodo`},C={class:`rec-emp-row`},w={class:`rec-emp-nombre`},T={class:`rec-emp-tipo`},E={class:`rec-neto-big`},D={class:`rec-table`},O={key:0},k={class:`ta-r`},A={class:`ta-r`},j={class:`ta-r`},M={key:1},N={class:`ta-r`},P={class:`ta-r`},F={class:`ta-r`},I={key:2},L={class:`ta-r`},R={class:`rec-total-row`},z={class:`ta-r`},B={class:`rec-table`},me={key:0},he={class:`ta-r`},ge={key:1},_e={class:`ta-r`},ve={key:2},ye={class:`ta-r`},be={key:3},xe={class:`ta-r`},Se={key:4},V={class:`ta-r`},Ce={key:5},we={class:`ta-r`},Te={class:`rec-total-row`},Ee={class:`ta-r`,style:{color:`#ef4444`}},De={class:`rec-table`,style:{opacity:`0.55`,"font-size":`10px`}},Oe={class:`ta-r`},ke={class:`ta-r`},Ae={key:0},je={class:`ta-r`},Me={key:1},Ne={class:`ta-r`},Pe={class:`rec-net-footer`},Fe={class:`rec-ytd-val`},Ie={class:`rec-net-amount`},Le={key:2,class:`nom-card estado-vacio`},Re={key:3,class:`nom-card estado-vacio`},H=ne({__name:`RecibosNominaView`,setup(ne){let H=ee(),ze=d(()=>H.empresa||H.user?.empresa||localStorage.getItem(`empresaActual`)||``),U=d(()=>H.empresaNombre||H.user?.empresaNombre||`Mi Empresa`),W=o([]),G=o(``),K=o(null),q=o([]),J=o(!1);function Y(e){if(!e)return`—`;try{let t;t=e instanceof Date?`${e.getUTCFullYear()}-${String(e.getUTCMonth()+1).padStart(2,`0`)}-${String(e.getUTCDate()).padStart(2,`0`)}`:String(e).split(`T`)[0];let[n,r,i]=t.split(`-`);return`${parseInt(i)} ${[``,`Ene`,`Feb`,`Mar`,`Abr`,`May`,`Jun`,`Jul`,`Ago`,`Sep`,`Oct`,`Nov`,`Dic`][parseInt(r)]} ${n}`}catch{return String(e)}}function X(e){return`$`+parseFloat(e||0).toLocaleString(`en-US`,{minimumFractionDigits:2,maximumFractionDigits:2})}function Z(e){return parseFloat(e||0).toFixed(2)}function Q(e){return e.tipo_empleado===`1099`&&e.empresa_contratista?`${e.apellido}, ${e.nombre} — ${e.empresa_contratista}`:`${e.apellido}, ${e.nombre}`}async function Be(){try{W.value=(await e.get(`/nomina/liquidaciones`,{params:{empresa:ze.value}})).data?.data||[],W.value.length&&(G.value=W.value[0].id,await $())}catch(e){console.error(`Error cargando liquidaciones:`,e)}}async function $(){if(!G.value){K.value=null,q.value=[];return}J.value=!0;try{let t=await e.get(`/nomina/liquidaciones/${G.value}`);K.value=t.data.liquidacion,q.value=t.data.lineas||[]}catch(e){console.error(`Error cargando líneas:`,e),K.value=null,q.value=[]}finally{J.value=!1}}function Ve(e){if(!K.value)return;let t=window.open(``,`_blank`);if(!t){alert(`Activa los pop-ups para imprimir el recibo`);return}let n=`${Y(K.value.semana_inicio)} — ${Y(K.value.semana_fin)}`,r=U.value,i=Q(e),a=e.tipo_empleado===`W2`,o=`<span class="rec-badge ${a?`badge-w2`:`badge-1099`}">${e.tipo_empleado}</span>`,s=a?`Employee`:`Independent Contractor`,c=``;parseFloat(e.horas_regulares)>0&&(c+=`
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
    </div>`}).join(``)}</div></body></html>`;e.document.write(r),e.document.close(),e.focus()}return te(Be),(e,o)=>(f(),i(r,null,{default:a(()=>[l(`div`,re,[l(`div`,ie,[l(`div`,ae,[m(b,{size:`20`,color:`white`},{default:a(()=>[...o[1]||=[_(`mdi-file-document-outline`,-1)]]),_:1})]),l(`div`,oe,[o[2]||=l(`h1`,{class:`nom-title`},`RECIBOS DE PAGO — PAY STUBS`,-1),K.value?(f(),v(`p`,se,[_(h(Y(K.value.semana_inicio))+` — `+h(Y(K.value.semana_fin))+` `,1),l(`span`,{class:u([`estado-badge`,`estado-${K.value.estado?.toLowerCase()}`])},h(K.value.estado),3)])):p(``,!0)]),l(`div`,ce,[c(l(`select`,{"onUpdate:modelValue":o[0]||=e=>G.value=e,class:`drw-select`,style:{width:`220px`},onChange:$},[o[3]||=l(`option`,{value:``},`— Seleccionar nómina —`,-1),(f(!0),v(g,null,y(W.value,e=>(f(),v(`option`,{key:e.id,value:e.id},h(Y(e.semana_inicio))+` · `+h(e.estado),9,le))),128))],544),[[s,G.value]]),q.value.length?(f(),i(n,{key:0,size:`small`,color:`#8b5cf6`,variant:`flat`,onClick:He},{default:a(()=>[m(b,{size:`14`,class:`mr-1`},{default:a(()=>[...o[4]||=[_(`mdi-printer`,-1)]]),_:1}),o[5]||=_(` Imprimir Todos `,-1)]),_:1})):p(``,!0)])]),J.value?(f(),v(`div`,ue,[m(t,{indeterminate:``,color:`#8b5cf6`,size:`28`})])):K.value&&q.value.length?(f(),v(`div`,de,[(f(!0),v(g,null,y(q.value,e=>(f(),v(`div`,{key:e.id,class:`recibo`},[l(`div`,fe,[l(`div`,pe,[l(`div`,x,h(U.value),1),o[6]||=l(`div`,{class:`rec-titulo`},`RECIBO DE PAGO`,-1),l(`div`,S,h(Y(K.value.semana_inicio))+` — `+h(Y(K.value.semana_fin)),1)]),m(n,{size:`x-small`,icon:`mdi-printer`,color:`white`,variant:`text`,onClick:t=>Ve(e),class:`rec-print-btn`,title:`Imprimir este recibo`},null,8,[`onClick`])]),l(`div`,C,[l(`div`,null,[l(`div`,w,h(Q(e)),1),l(`div`,T,[l(`span`,{class:u([`rec-badge`,e.tipo_empleado===`W2`?`badge-w2`:`badge-1099`])},h(e.tipo_empleado),3),_(` `+h(e.tipo_empleado===`W2`?`Employee`:`Independent Contractor`),1)])]),l(`div`,E,[o[7]||=l(`div`,{style:{"font-size":`10px`,color:`rgba(255,255,255,0.5)`}},`NET PAY`,-1),l(`div`,null,h(X(e.total_neto)),1)])]),o[29]||=l(`div`,{class:`rec-section-title`},`EARNINGS`,-1),l(`table`,D,[o[13]||=l(`thead`,null,[l(`tr`,null,[l(`th`,null,`DESCRIPTION`),l(`th`,{class:`ta-r`},`HOURS`),l(`th`,{class:`ta-r`},`RATE`),l(`th`,{class:`ta-r`},`AMOUNT`)])],-1),l(`tbody`,null,[parseFloat(e.horas_regulares)>0?(f(),v(`tr`,O,[o[8]||=l(`td`,null,`Regular Pay`,-1),l(`td`,k,h(Z(e.horas_regulares)),1),l(`td`,A,h(X(e.valor_hora))+`/h`,1),l(`td`,j,h(X(e.bruto_regular)),1)])):p(``,!0),parseFloat(e.horas_overtime)>0?(f(),v(`tr`,M,[o[9]||=l(`td`,null,`Overtime Pay (1.5×)`,-1),l(`td`,N,h(Z(e.horas_overtime)),1),l(`td`,P,h(X(e.valor_hora_ot))+`/h`,1),l(`td`,F,h(X(e.bruto_overtime)),1)])):p(``,!0),parseFloat(e.bruto_base)>0?(f(),v(`tr`,I,[l(`td`,null,h(e.es_monto_fijo?`Fixed Weekly Amount`:`Base Salary`),1),o[10]||=l(`td`,{class:`ta-r`},`—`,-1),o[11]||=l(`td`,{class:`ta-r`},`—`,-1),l(`td`,L,h(X(e.bruto_base)),1)])):p(``,!0),l(`tr`,R,[o[12]||=l(`td`,{colspan:`3`},[l(`strong`,null,`Gross Pay`)],-1),l(`td`,z,[l(`strong`,null,h(X(e.total_bruto)),1)])])])]),e.tipo_empleado===`W2`?(f(),v(g,{key:0},[o[25]||=l(`div`,{class:`rec-section-title`},`DEDUCTIONS`,-1),l(`table`,B,[l(`tbody`,null,[parseFloat(e.federal_income_tax)>0?(f(),v(`tr`,me,[o[14]||=l(`td`,null,`Federal Income Tax (FIT)`,-1),l(`td`,he,`-`+h(X(e.federal_income_tax)),1)])):p(``,!0),parseFloat(e.social_security_emp)>0?(f(),v(`tr`,ge,[o[15]||=l(`td`,null,`Social Security (6.2%)`,-1),l(`td`,_e,`-`+h(X(e.social_security_emp)),1)])):p(``,!0),parseFloat(e.medicare_emp)>0?(f(),v(`tr`,ve,[o[16]||=l(`td`,null,`Medicare (1.45%)`,-1),l(`td`,ye,`-`+h(X(e.medicare_emp)),1)])):p(``,!0),parseFloat(e.medicare_adicional)>0?(f(),v(`tr`,be,[o[17]||=l(`td`,null,`Additional Medicare (0.9%)`,-1),l(`td`,xe,`-`+h(X(e.medicare_adicional)),1)])):p(``,!0),parseFloat(e.workers_comp)>0?(f(),v(`tr`,Se,[o[18]||=l(`td`,null,`Workers' Compensation`,-1),l(`td`,V,`-`+h(X(e.workers_comp)),1)])):p(``,!0),parseFloat(e.otras_deducciones)>0?(f(),v(`tr`,Ce,[o[19]||=l(`td`,null,`Other Deductions`,-1),l(`td`,we,`-`+h(X(e.otras_deducciones)),1)])):p(``,!0),l(`tr`,Te,[o[20]||=l(`td`,null,[l(`strong`,null,`Total Deductions`)],-1),l(`td`,Ee,[l(`strong`,null,`-`+h(X(e.total_deducciones)),1)])])])]),o[26]||=l(`div`,{class:`rec-section-title`,style:{opacity:`0.5`}},`EMPLOYER CONTRIBUTIONS (informativo)`,-1),l(`table`,De,[l(`tbody`,null,[l(`tr`,null,[o[21]||=l(`td`,null,`Social Security (employer 6.2%)`,-1),l(`td`,Oe,h(X(e.social_security_er)),1)]),l(`tr`,null,[o[22]||=l(`td`,null,`Medicare (employer 1.45%)`,-1),l(`td`,ke,h(X(e.medicare_er)),1)]),parseFloat(e.futa)>0?(f(),v(`tr`,Ae,[o[23]||=l(`td`,null,`FUTA`,-1),l(`td`,je,h(X(e.futa)),1)])):p(``,!0),parseFloat(e.suta)>0?(f(),v(`tr`,Me,[o[24]||=l(`td`,null,`FL Reemployment Tax`,-1),l(`td`,Ne,h(X(e.suta)),1)])):p(``,!0)])])],64)):p(``,!0),l(`div`,Pe,[l(`div`,null,[o[27]||=l(`div`,{class:`rec-ytd-label`},`YTD Gross`,-1),l(`div`,Fe,h(X(e.ytd_bruto)),1)]),l(`div`,Ie,[o[28]||=l(`div`,{style:{"font-size":`10px`,opacity:`0.7`}},`NET PAY`,-1),l(`div`,null,h(X(e.total_neto)),1)])])]))),128))])):G.value&&!J.value?(f(),v(`div`,Le,[m(b,{size:`40`,color:`rgba(var(--v-theme-on-surface),0.15)`},{default:a(()=>[...o[30]||=[_(`mdi-file-document-outline`,-1)]]),_:1}),o[31]||=l(`div`,{style:{"margin-top":`10px`,"font-weight":`700`}},`Sin líneas de nómina`,-1),o[32]||=l(`div`,{style:{"font-size":`12px`,color:`rgba(var(--v-theme-on-surface),0.4)`,"margin-top":`4px`}},` Esta nómina no tiene recibos calculados. Calcula la nómina primero. `,-1)])):G.value?p(``,!0):(f(),v(`div`,Re,[m(b,{size:`40`,color:`rgba(var(--v-theme-on-surface),0.15)`},{default:a(()=>[...o[33]||=[_(`mdi-cash-register`,-1)]]),_:1}),o[34]||=l(`div`,{style:{"margin-top":`10px`,"font-weight":`700`}},`Selecciona una nómina`,-1),o[35]||=l(`div`,{style:{"font-size":`12px`,color:`rgba(var(--v-theme-on-surface),0.4)`,"margin-top":`4px`}},` Elige una nómina aprobada del selector para ver los recibos de pago. `,-1)]))])]),_:1}))}},[[`__scopeId`,`data-v-dde8d49f`]]);export{H as default};