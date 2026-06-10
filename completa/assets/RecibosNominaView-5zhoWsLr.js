import{t as e}from"./api-DviA5Imh.js";import{$ as t,B as n,H as r,L as i,Lt as a,Pt as o,_ as s,b as c,c as l,et as u,g as d,h as f,lt as p,m,p as h,x as g}from"./vue-router-H2HaKoii.js";import{kt as ee,t as te}from"./_plugin-vue_export-helper-BEqRjA8R.js";import{m as ne,t as _}from"./VBtn-CBvurn8O.js";import{t as re}from"./MainLayout-C5Sf-eUQ.js";import{i as ie}from"./index-3g6OS_mU.js";import{t as v}from"./VIcon-ChosyInQ.js";var ae={class:`nom-wrap`},oe={class:`nom-header`},se={class:`nom-header-icon`},ce={class:`flex-1`},le={key:0,class:`nom-sub`},ue={style:{display:`flex`,gap:`8px`,"align-items":`center`,"flex-wrap":`wrap`}},de=[`value`],fe={key:0,class:`nom-card`,style:{padding:`32px`,"text-align":`center`}},pe={key:1,class:`recibos-grid`},y={class:`rec-header-container`},b={class:`rec-header`},x={class:`rec-empresa`},S={class:`rec-periodo`},C={class:`rec-emp-row`},w={class:`rec-emp-nombre`},T={class:`rec-emp-tipo`},E={class:`rec-neto-big`},D={class:`rec-table`},O={key:0},k={class:`ta-r`},A={class:`ta-r`},j={class:`ta-r`},M={key:1},N={class:`ta-r`},P={class:`ta-r`},F={class:`ta-r`},I={key:2},L={class:`ta-r`},R={class:`rec-total-row`},z={class:`ta-r`},B={class:`rec-table`},me={key:0},he={class:`ta-r`},ge={key:1},_e={class:`ta-r`},ve={key:2},ye={class:`ta-r`},V={key:3},be={class:`ta-r`},xe={key:4},Se={class:`ta-r`},Ce={key:5},we={class:`ta-r`},Te={class:`rec-total-row`},Ee={class:`ta-r`,style:{color:`#ef4444`}},De={class:`rec-table`,style:{opacity:`0.55`,"font-size":`10px`}},Oe={class:`ta-r`},ke={class:`ta-r`},Ae={key:0},je={class:`ta-r`},Me={key:1},Ne={class:`ta-r`},Pe={class:`rec-net-footer`},Fe={class:`rec-ytd-val`},Ie={class:`rec-net-amount`},Le={key:2,class:`nom-card estado-vacio`},Re={key:3,class:`nom-card estado-vacio`},H=te({__name:`RecibosNominaView`,setup(te){let H=ie(),ze=h(()=>H.empresa||H.user?.empresa||localStorage.getItem(`empresaActual`)||``),U=h(()=>H.empresaNombre||H.user?.empresaNombre||`Mi Empresa`),W=p([]),G=p(``),K=p(null),q=p([]),J=p(!1);function Y(e){if(!e)return`—`;try{let t;t=e instanceof Date?`${e.getUTCFullYear()}-${String(e.getUTCMonth()+1).padStart(2,`0`)}-${String(e.getUTCDate()).padStart(2,`0`)}`:String(e).split(`T`)[0];let[n,r,i]=t.split(`-`);return`${parseInt(i)} ${[``,`Ene`,`Feb`,`Mar`,`Abr`,`May`,`Jun`,`Jul`,`Ago`,`Sep`,`Oct`,`Nov`,`Dic`][parseInt(r)]} ${n}`}catch{return String(e)}}function X(e){return`$`+parseFloat(e||0).toLocaleString(`en-US`,{minimumFractionDigits:2,maximumFractionDigits:2})}function Z(e){return parseFloat(e||0).toFixed(2)}function Q(e){return e.tipo_empleado===`1099`&&e.empresa_contratista?`${e.apellido}, ${e.nombre} — ${e.empresa_contratista}`:`${e.apellido}, ${e.nombre}`}async function Be(){try{W.value=(await e.get(`/nomina/liquidaciones`,{params:{empresa:ze.value}})).data?.data||[],W.value.length&&(G.value=W.value[0].id,await $())}catch(e){console.error(`Error cargando liquidaciones:`,e)}}async function $(){if(!G.value){K.value=null,q.value=[];return}J.value=!0;try{let t=await e.get(`/nomina/liquidaciones/${G.value}`);K.value=t.data.liquidacion,q.value=t.data.lineas||[]}catch(e){console.error(`Error cargando líneas:`,e),K.value=null,q.value=[]}finally{J.value=!1}}function Ve(e){if(!K.value)return;let t=window.open(``,`_blank`);if(!t){alert(`Activa los pop-ups para imprimir el recibo`);return}let n=`${Y(K.value.semana_inicio)} — ${Y(K.value.semana_fin)}`,r=U.value,i=Q(e),a=e.tipo_empleado===`W2`,o=`<span class="rec-badge ${a?`badge-w2`:`badge-1099`}">${e.tipo_empleado}</span>`,s=a?`Employee`:`Independent Contractor`,c=``;parseFloat(e.horas_regulares)>0&&(c+=`
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
    </div>`}).join(``)}</div></body></html>`;e.document.write(r),e.document.close(),e.focus()}return i(Be),(e,i)=>(n(),f(re,null,{default:t(()=>[m(`div`,ae,[m(`div`,oe,[m(`div`,se,[g(v,{size:`20`,color:`white`},{default:t(()=>[...i[1]||=[c(`mdi-file-document-outline`,-1)]]),_:1})]),m(`div`,ce,[i[2]||=m(`h1`,{class:`nom-title`},`RECIBOS DE PAGO — PAY STUBS`,-1),K.value?(n(),s(`p`,le,[c(a(Y(K.value.semana_inicio))+` — `+a(Y(K.value.semana_fin))+` `,1),m(`span`,{class:o([`estado-badge`,`estado-${K.value.estado?.toLowerCase()}`])},a(K.value.estado),3)])):d(``,!0)]),m(`div`,ue,[u(m(`select`,{"onUpdate:modelValue":i[0]||=e=>G.value=e,class:`drw-select`,style:{width:`220px`},onChange:$},[i[3]||=m(`option`,{value:``},`— Seleccionar nómina —`,-1),(n(!0),s(l,null,r(W.value,e=>(n(),s(`option`,{key:e.id,value:e.id},a(Y(e.semana_inicio))+` · `+a(e.estado),9,de))),128))],544),[[ee,G.value]]),q.value.length?(n(),f(_,{key:0,size:`small`,color:`#8b5cf6`,variant:`flat`,onClick:He},{default:t(()=>[g(v,{size:`14`,class:`mr-1`},{default:t(()=>[...i[4]||=[c(`mdi-printer`,-1)]]),_:1}),i[5]||=c(` Imprimir Todos `,-1)]),_:1})):d(``,!0)])]),J.value?(n(),s(`div`,fe,[g(ne,{indeterminate:``,color:`#8b5cf6`,size:`28`})])):K.value&&q.value.length?(n(),s(`div`,pe,[(n(!0),s(l,null,r(q.value,e=>(n(),s(`div`,{key:e.id,class:`recibo`},[m(`div`,y,[m(`div`,b,[m(`div`,x,a(U.value),1),i[6]||=m(`div`,{class:`rec-titulo`},`RECIBO DE PAGO`,-1),m(`div`,S,a(Y(K.value.semana_inicio))+` — `+a(Y(K.value.semana_fin)),1)]),g(_,{size:`x-small`,icon:`mdi-printer`,color:`white`,variant:`text`,onClick:t=>Ve(e),class:`rec-print-btn`,title:`Imprimir este recibo`},null,8,[`onClick`])]),m(`div`,C,[m(`div`,null,[m(`div`,w,a(Q(e)),1),m(`div`,T,[m(`span`,{class:o([`rec-badge`,e.tipo_empleado===`W2`?`badge-w2`:`badge-1099`])},a(e.tipo_empleado),3),c(` `+a(e.tipo_empleado===`W2`?`Employee`:`Independent Contractor`),1)])]),m(`div`,E,[i[7]||=m(`div`,{style:{"font-size":`10px`,color:`rgba(255,255,255,0.5)`}},`NET PAY`,-1),m(`div`,null,a(X(e.total_neto)),1)])]),i[29]||=m(`div`,{class:`rec-section-title`},`EARNINGS`,-1),m(`table`,D,[i[13]||=m(`thead`,null,[m(`tr`,null,[m(`th`,null,`DESCRIPTION`),m(`th`,{class:`ta-r`},`HOURS`),m(`th`,{class:`ta-r`},`RATE`),m(`th`,{class:`ta-r`},`AMOUNT`)])],-1),m(`tbody`,null,[parseFloat(e.horas_regulares)>0?(n(),s(`tr`,O,[i[8]||=m(`td`,null,`Regular Pay`,-1),m(`td`,k,a(Z(e.horas_regulares)),1),m(`td`,A,a(X(e.valor_hora))+`/h`,1),m(`td`,j,a(X(e.bruto_regular)),1)])):d(``,!0),parseFloat(e.horas_overtime)>0?(n(),s(`tr`,M,[i[9]||=m(`td`,null,`Overtime Pay (1.5×)`,-1),m(`td`,N,a(Z(e.horas_overtime)),1),m(`td`,P,a(X(e.valor_hora_ot))+`/h`,1),m(`td`,F,a(X(e.bruto_overtime)),1)])):d(``,!0),parseFloat(e.bruto_base)>0?(n(),s(`tr`,I,[m(`td`,null,a(e.es_monto_fijo?`Fixed Weekly Amount`:`Base Salary`),1),i[10]||=m(`td`,{class:`ta-r`},`—`,-1),i[11]||=m(`td`,{class:`ta-r`},`—`,-1),m(`td`,L,a(X(e.bruto_base)),1)])):d(``,!0),m(`tr`,R,[i[12]||=m(`td`,{colspan:`3`},[m(`strong`,null,`Gross Pay`)],-1),m(`td`,z,[m(`strong`,null,a(X(e.total_bruto)),1)])])])]),e.tipo_empleado===`W2`?(n(),s(l,{key:0},[i[25]||=m(`div`,{class:`rec-section-title`},`DEDUCTIONS`,-1),m(`table`,B,[m(`tbody`,null,[parseFloat(e.federal_income_tax)>0?(n(),s(`tr`,me,[i[14]||=m(`td`,null,`Federal Income Tax (FIT)`,-1),m(`td`,he,`-`+a(X(e.federal_income_tax)),1)])):d(``,!0),parseFloat(e.social_security_emp)>0?(n(),s(`tr`,ge,[i[15]||=m(`td`,null,`Social Security (6.2%)`,-1),m(`td`,_e,`-`+a(X(e.social_security_emp)),1)])):d(``,!0),parseFloat(e.medicare_emp)>0?(n(),s(`tr`,ve,[i[16]||=m(`td`,null,`Medicare (1.45%)`,-1),m(`td`,ye,`-`+a(X(e.medicare_emp)),1)])):d(``,!0),parseFloat(e.medicare_adicional)>0?(n(),s(`tr`,V,[i[17]||=m(`td`,null,`Additional Medicare (0.9%)`,-1),m(`td`,be,`-`+a(X(e.medicare_adicional)),1)])):d(``,!0),parseFloat(e.workers_comp)>0?(n(),s(`tr`,xe,[i[18]||=m(`td`,null,`Workers' Compensation`,-1),m(`td`,Se,`-`+a(X(e.workers_comp)),1)])):d(``,!0),parseFloat(e.otras_deducciones)>0?(n(),s(`tr`,Ce,[i[19]||=m(`td`,null,`Other Deductions`,-1),m(`td`,we,`-`+a(X(e.otras_deducciones)),1)])):d(``,!0),m(`tr`,Te,[i[20]||=m(`td`,null,[m(`strong`,null,`Total Deductions`)],-1),m(`td`,Ee,[m(`strong`,null,`-`+a(X(e.total_deducciones)),1)])])])]),i[26]||=m(`div`,{class:`rec-section-title`,style:{opacity:`0.5`}},`EMPLOYER CONTRIBUTIONS (informativo)`,-1),m(`table`,De,[m(`tbody`,null,[m(`tr`,null,[i[21]||=m(`td`,null,`Social Security (employer 6.2%)`,-1),m(`td`,Oe,a(X(e.social_security_er)),1)]),m(`tr`,null,[i[22]||=m(`td`,null,`Medicare (employer 1.45%)`,-1),m(`td`,ke,a(X(e.medicare_er)),1)]),parseFloat(e.futa)>0?(n(),s(`tr`,Ae,[i[23]||=m(`td`,null,`FUTA`,-1),m(`td`,je,a(X(e.futa)),1)])):d(``,!0),parseFloat(e.suta)>0?(n(),s(`tr`,Me,[i[24]||=m(`td`,null,`FL Reemployment Tax`,-1),m(`td`,Ne,a(X(e.suta)),1)])):d(``,!0)])])],64)):d(``,!0),m(`div`,Pe,[m(`div`,null,[i[27]||=m(`div`,{class:`rec-ytd-label`},`YTD Gross`,-1),m(`div`,Fe,a(X(e.ytd_bruto)),1)]),m(`div`,Ie,[i[28]||=m(`div`,{style:{"font-size":`10px`,opacity:`0.7`}},`NET PAY`,-1),m(`div`,null,a(X(e.total_neto)),1)])])]))),128))])):G.value&&!J.value?(n(),s(`div`,Le,[g(v,{size:`40`,color:`rgba(var(--v-theme-on-surface),0.15)`},{default:t(()=>[...i[30]||=[c(`mdi-file-document-outline`,-1)]]),_:1}),i[31]||=m(`div`,{style:{"margin-top":`10px`,"font-weight":`700`}},`Sin líneas de nómina`,-1),i[32]||=m(`div`,{style:{"font-size":`12px`,color:`rgba(var(--v-theme-on-surface),0.4)`,"margin-top":`4px`}},` Esta nómina no tiene recibos calculados. Calcula la nómina primero. `,-1)])):G.value?d(``,!0):(n(),s(`div`,Re,[g(v,{size:`40`,color:`rgba(var(--v-theme-on-surface),0.15)`},{default:t(()=>[...i[33]||=[c(`mdi-cash-register`,-1)]]),_:1}),i[34]||=m(`div`,{style:{"margin-top":`10px`,"font-weight":`700`}},`Selecciona una nómina`,-1),i[35]||=m(`div`,{style:{"font-size":`12px`,color:`rgba(var(--v-theme-on-surface),0.4)`,"margin-top":`4px`}},` Elige una nómina aprobada del selector para ver los recibos de pago. `,-1)]))])]),_:1}))}},[[`__scopeId`,`data-v-912d90b5`]]);export{H as default};