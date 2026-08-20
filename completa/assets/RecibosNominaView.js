import{t as e}from"./MainLayout.js";import{$n as t,Fn as n,G as r,H as i,In as a,Jn as o,Ln as s,Mn as c,Nn as l,Pn as u,Rn as d,Zn as f,a as p,ar as m,fr as h,kn as g,or as ee,r as te,wn as ne,wr as _,xr as v,z as y}from"./index.js";import{t as b}from"./VBtn.js";import{t as re}from"./PageHeader.js";var ie={class:`nom-wrap`},ae=[`value`],oe={key:0,class:`nom-card`,style:{padding:`32px`,"text-align":`center`}},se={key:1,class:`recibos-grid`},ce={class:`rec-header-container`},le={class:`rec-header`},ue={class:`rec-empresa`},de={class:`rec-periodo`},fe={class:`rec-emp-row`},pe={class:`rec-emp-nombre`},x={class:`rec-emp-tipo`},S={class:`rec-neto-big`},C={class:`rec-table`},w={key:0},T={class:`ta-r`},E={class:`ta-r`},D={class:`ta-r`},O={key:1},k={class:`ta-r`},A={class:`ta-r`},j={class:`ta-r`},M={key:2},N={class:`ta-r`},P={class:`rec-total-row`},F={class:`ta-r`},I={class:`rec-table`},L={key:0},R={class:`ta-r`},z={key:1},B={class:`ta-r`},me={key:2},he={class:`ta-r`},ge={key:3},_e={class:`ta-r`},V={key:4},ve={class:`ta-r`},ye={key:5},be={class:`ta-r`},xe={class:`rec-total-row`},Se={class:`ta-r`,style:{color:`var(--error)`}},Ce={class:`rec-table`,style:{opacity:`0.55`,"font-size":`10px`}},we={class:`ta-r`},Te={class:`ta-r`},Ee={key:0},De={class:`ta-r`},Oe={key:1},ke={class:`ta-r`},Ae={class:`rec-net-footer`},je={class:`rec-ytd-val`},Me={class:`rec-net-amount`},Ne={key:2,class:`nom-card estado-vacio`},Pe={key:3,class:`nom-card estado-vacio`},H=i({__name:`RecibosNominaView`,setup(i){let H=r(),Fe=c(()=>H.empresa||H.user?.empresa||localStorage.getItem(`empresaActual`)||``),U=c(()=>H.empresaNombre||H.user?.empresaNombre||`Mi Empresa`),W=h([]),G=h(``),K=h(null),q=h([]),J=h(!1);function Y(e){if(!e)return`—`;try{let t;t=e instanceof Date?`${e.getUTCFullYear()}-${String(e.getUTCMonth()+1).padStart(2,`0`)}-${String(e.getUTCDate()).padStart(2,`0`)}`:String(e).split(`T`)[0];let[n,r,i]=t.split(`-`);return`${r}/${i}/${n}`}catch{return String(e)}}function X(e){return`$`+parseFloat(e||0).toLocaleString(`en-US`,{minimumFractionDigits:2,maximumFractionDigits:2})}function Z(e){return parseFloat(e||0).toFixed(2)}function Q(e){return e.tipo_empleado===`1099`&&e.empresa_contratista?`${e.apellido}, ${e.nombre} — ${e.empresa_contratista}`:`${e.apellido}, ${e.nombre}`}async function Ie(){try{W.value=(await y.get(`/nomina/liquidaciones`,{params:{empresa:Fe.value}})).data?.data||[],W.value.length&&(G.value=W.value[0].id,await $())}catch(e){console.error(`Error cargando liquidaciones:`,e)}}async function $(){if(!G.value){K.value=null,q.value=[];return}J.value=!0;try{let e=await y.get(`/nomina/liquidaciones/${G.value}`);K.value=e.data.liquidacion,q.value=e.data.lineas||[]}catch(e){console.error(`Error cargando líneas:`,e),K.value=null,q.value=[]}finally{J.value=!1}}function Le(e){if(!K.value)return;let t=window.open(``,`_blank`);if(!t){alert(`Activa los pop-ups para imprimir el recibo`);return}let n=`${Y(K.value.semana_inicio)} — ${Y(K.value.semana_fin)}`,r=U.value,i=Q(e),a=e.tipo_empleado===`W2`,o=`<span class="rec-badge ${a?`badge-w2`:`badge-1099`}">${e.tipo_empleado}</span>`,s=a?`Employee`:`Independent Contractor`,c=``;parseFloat(e.horas_regulares)>0&&(c+=`
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
    </div>`}</body></html>`;t.document.write(u),t.document.close(),t.focus()}function Re(){if(!q.value.length||!K.value)return;let e=window.open(``,`_blank`);if(!e){alert(`Activa los pop-ups para imprimir los recibos`);return}let t=`${Y(K.value.semana_inicio)} — ${Y(K.value.semana_fin)}`,n=U.value,r=`<!DOCTYPE html><html><head><meta charset="UTF-8">
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
    </div>`}).join(``)}</div></body></html>`;e.document.write(r),e.document.close(),e.focus()}return o(Ie),(r,i)=>(f(),u(e,null,{default:m(()=>[l(`div`,ie,[d(re,{title:`Recibos de Pago — Pay Stubs`,description:K.value?`${Y(K.value.semana_inicio)} — ${Y(K.value.semana_fin)}`:``,crumbs:[`Nómina`,`Reportes`,`Recibos de Pago`]},{actions:m(()=>[K.value?(f(),a(`span`,{key:0,class:v([`estado-badge`,`estado-${K.value.estado?.toLowerCase()}`])},_(K.value.estado),3)):n(``,!0),ee(l(`select`,{"onUpdate:modelValue":i[0]||=e=>G.value=e,class:`drw-select`,style:{width:`220px`},onChange:$},[i[1]||=l(`option`,{value:``},`— Seleccionar nómina —`,-1),(f(!0),a(g,null,t(W.value,e=>(f(),a(`option`,{key:e.id,value:e.id},_(Y(e.semana_inicio))+` · `+_(e.estado),9,ae))),128))],544),[[ne,G.value]]),q.value.length?(f(),u(b,{key:1,size:`small`,color:`secondary`,variant:`flat`,onClick:Re},{default:m(()=>[d(p,{size:`14`,class:`mr-1`},{default:m(()=>[...i[2]||=[s(`mdi-printer`,-1)]]),_:1}),i[3]||=s(` Imprimir Todos `,-1)]),_:1})):n(``,!0)]),_:1},8,[`description`]),J.value?(f(),a(`div`,oe,[d(te,{indeterminate:``,color:`secondary`,size:`28`})])):K.value&&q.value.length?(f(),a(`div`,se,[(f(!0),a(g,null,t(q.value,e=>(f(),a(`div`,{key:e.id,class:`recibo`},[l(`div`,ce,[l(`div`,le,[l(`div`,ue,_(U.value),1),i[4]||=l(`div`,{class:`rec-titulo`},`RECIBO DE PAGO`,-1),l(`div`,de,_(Y(K.value.semana_inicio))+` — `+_(Y(K.value.semana_fin)),1)]),d(b,{size:`x-small`,icon:`mdi-printer`,color:`white`,variant:`text`,onClick:t=>Le(e),class:`rec-print-btn`,title:`Imprimir este recibo`},null,8,[`onClick`])]),l(`div`,fe,[l(`div`,null,[l(`div`,pe,_(Q(e)),1),l(`div`,x,[l(`span`,{class:v([`rec-badge`,e.tipo_empleado===`W2`?`badge-w2`:`badge-1099`])},_(e.tipo_empleado),3),s(` `+_(e.tipo_empleado===`W2`?`Employee`:`Independent Contractor`),1)])]),l(`div`,S,[i[5]||=l(`div`,{style:{"font-size":`10px`,color:`rgba(255,255,255,0.5)`}},`NET PAY`,-1),l(`div`,null,_(X(e.total_neto)),1)])]),i[27]||=l(`div`,{class:`rec-section-title`},`EARNINGS`,-1),l(`table`,C,[i[11]||=l(`thead`,null,[l(`tr`,null,[l(`th`,null,`DESCRIPTION`),l(`th`,{class:`ta-r`},`HOURS`),l(`th`,{class:`ta-r`},`RATE`),l(`th`,{class:`ta-r`},`AMOUNT`)])],-1),l(`tbody`,null,[parseFloat(e.horas_regulares)>0?(f(),a(`tr`,w,[i[6]||=l(`td`,null,`Regular Pay`,-1),l(`td`,T,_(Z(e.horas_regulares)),1),l(`td`,E,_(X(e.valor_hora))+`/h`,1),l(`td`,D,_(X(e.bruto_regular)),1)])):n(``,!0),parseFloat(e.horas_overtime)>0?(f(),a(`tr`,O,[i[7]||=l(`td`,null,`Overtime Pay (1.5×)`,-1),l(`td`,k,_(Z(e.horas_overtime)),1),l(`td`,A,_(X(e.valor_hora_ot))+`/h`,1),l(`td`,j,_(X(e.bruto_overtime)),1)])):n(``,!0),parseFloat(e.bruto_base)>0?(f(),a(`tr`,M,[l(`td`,null,_(e.es_monto_fijo?`Fixed Weekly Amount`:`Base Salary`),1),i[8]||=l(`td`,{class:`ta-r`},`—`,-1),i[9]||=l(`td`,{class:`ta-r`},`—`,-1),l(`td`,N,_(X(e.bruto_base)),1)])):n(``,!0),l(`tr`,P,[i[10]||=l(`td`,{colspan:`3`},[l(`strong`,null,`Gross Pay`)],-1),l(`td`,F,[l(`strong`,null,_(X(e.total_bruto)),1)])])])]),e.tipo_empleado===`W2`?(f(),a(g,{key:0},[i[23]||=l(`div`,{class:`rec-section-title`},`DEDUCTIONS`,-1),l(`table`,I,[l(`tbody`,null,[parseFloat(e.federal_income_tax)>0?(f(),a(`tr`,L,[i[12]||=l(`td`,null,`Federal Income Tax (FIT)`,-1),l(`td`,R,`-`+_(X(e.federal_income_tax)),1)])):n(``,!0),parseFloat(e.social_security_emp)>0?(f(),a(`tr`,z,[i[13]||=l(`td`,null,`Social Security (6.2%)`,-1),l(`td`,B,`-`+_(X(e.social_security_emp)),1)])):n(``,!0),parseFloat(e.medicare_emp)>0?(f(),a(`tr`,me,[i[14]||=l(`td`,null,`Medicare (1.45%)`,-1),l(`td`,he,`-`+_(X(e.medicare_emp)),1)])):n(``,!0),parseFloat(e.medicare_adicional)>0?(f(),a(`tr`,ge,[i[15]||=l(`td`,null,`Additional Medicare (0.9%)`,-1),l(`td`,_e,`-`+_(X(e.medicare_adicional)),1)])):n(``,!0),parseFloat(e.workers_comp)>0?(f(),a(`tr`,V,[i[16]||=l(`td`,null,`Workers' Compensation`,-1),l(`td`,ve,`-`+_(X(e.workers_comp)),1)])):n(``,!0),parseFloat(e.otras_deducciones)>0?(f(),a(`tr`,ye,[i[17]||=l(`td`,null,`Other Deductions`,-1),l(`td`,be,`-`+_(X(e.otras_deducciones)),1)])):n(``,!0),l(`tr`,xe,[i[18]||=l(`td`,null,[l(`strong`,null,`Total Deductions`)],-1),l(`td`,Se,[l(`strong`,null,`-`+_(X(e.total_deducciones)),1)])])])]),i[24]||=l(`div`,{class:`rec-section-title`,style:{opacity:`0.5`}},`EMPLOYER CONTRIBUTIONS (informativo)`,-1),l(`table`,Ce,[l(`tbody`,null,[l(`tr`,null,[i[19]||=l(`td`,null,`Social Security (employer 6.2%)`,-1),l(`td`,we,_(X(e.social_security_er)),1)]),l(`tr`,null,[i[20]||=l(`td`,null,`Medicare (employer 1.45%)`,-1),l(`td`,Te,_(X(e.medicare_er)),1)]),parseFloat(e.futa)>0?(f(),a(`tr`,Ee,[i[21]||=l(`td`,null,`FUTA`,-1),l(`td`,De,_(X(e.futa)),1)])):n(``,!0),parseFloat(e.suta)>0?(f(),a(`tr`,Oe,[i[22]||=l(`td`,null,`FL Reemployment Tax`,-1),l(`td`,ke,_(X(e.suta)),1)])):n(``,!0)])])],64)):n(``,!0),l(`div`,Ae,[l(`div`,null,[i[25]||=l(`div`,{class:`rec-ytd-label`},`YTD Gross`,-1),l(`div`,je,_(X(e.ytd_bruto)),1)]),l(`div`,Me,[i[26]||=l(`div`,{style:{"font-size":`10px`,opacity:`0.7`}},`NET PAY`,-1),l(`div`,null,_(X(e.total_neto)),1)])])]))),128))])):G.value&&!J.value?(f(),a(`div`,Ne,[d(p,{size:`40`,color:`rgba(var(--v-theme-on-surface),0.15)`},{default:m(()=>[...i[28]||=[s(`mdi-file-document-outline`,-1)]]),_:1}),i[29]||=l(`div`,{style:{"margin-top":`10px`,"font-weight":`700`}},`Sin líneas de nómina`,-1),i[30]||=l(`div`,{style:{"font-size":`12px`,color:`rgba(var(--v-theme-on-surface),0.4)`,"margin-top":`4px`}},` Esta nómina no tiene recibos calculados. Calcula la nómina primero. `,-1)])):G.value?n(``,!0):(f(),a(`div`,Pe,[d(p,{size:`40`,color:`rgba(var(--v-theme-on-surface),0.15)`},{default:m(()=>[...i[31]||=[s(`mdi-cash-register`,-1)]]),_:1}),i[32]||=l(`div`,{style:{"margin-top":`10px`,"font-weight":`700`}},`Selecciona una nómina`,-1),i[33]||=l(`div`,{style:{"font-size":`12px`,color:`rgba(var(--v-theme-on-surface),0.4)`,"margin-top":`4px`}},` Elige una nómina aprobada del selector para ver los recibos de pago. `,-1)]))])]),_:1}))}},[[`__scopeId`,`data-v-fa9f8392`]]);export{H as default};