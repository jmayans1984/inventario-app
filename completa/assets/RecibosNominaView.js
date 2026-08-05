import{t as e}from"./VBtn.js";import{t}from"./MainLayout.js";import{An as n,Gt as r,Kn as i,Ln as a,Xt as o,Yn as s,a as c,an as l,en as u,gn as ee,in as d,kn as f,n as te,nn as p,on as m,rn as h,tn as g,xn as _,yn as v}from"./index.js";import{n as y}from"./logo.js";import{t as b}from"./VIcon.js";import{t as ne}from"./VProgressCircular.js";import{t as re}from"./PageHeader.js";var ie={class:`nom-wrap`},ae=[`value`],oe={key:0,class:`nom-card`,style:{padding:`32px`,"text-align":`center`}},se={key:1,class:`recibos-grid`},ce={class:`rec-header-container`},le={class:`rec-header`},ue={class:`rec-empresa`},de={class:`rec-periodo`},fe={class:`rec-emp-row`},pe={class:`rec-emp-nombre`},x={class:`rec-emp-tipo`},S={class:`rec-neto-big`},C={class:`rec-table`},w={key:0},T={class:`ta-r`},E={class:`ta-r`},D={class:`ta-r`},O={key:1},k={class:`ta-r`},A={class:`ta-r`},j={class:`ta-r`},M={key:2},N={class:`ta-r`},P={class:`rec-total-row`},F={class:`ta-r`},I={class:`rec-table`},L={key:0},R={class:`ta-r`},z={key:1},B={class:`ta-r`},me={key:2},he={class:`ta-r`},ge={key:3},_e={class:`ta-r`},ve={key:4},V={class:`ta-r`},ye={key:5},be={class:`ta-r`},xe={class:`rec-total-row`},Se={class:`ta-r`,style:{color:`var(--error)`}},Ce={class:`rec-table`,style:{opacity:`0.55`,"font-size":`10px`}},we={class:`ta-r`},Te={class:`ta-r`},Ee={key:0},De={class:`ta-r`},Oe={key:1},ke={class:`ta-r`},Ae={class:`rec-net-footer`},je={class:`rec-ytd-val`},Me={class:`rec-net-amount`},Ne={key:2,class:`nom-card estado-vacio`},Pe={key:3,class:`nom-card estado-vacio`},H=te({__name:`RecibosNominaView`,setup(te){let H=c(),Fe=u(()=>H.empresa||H.user?.empresa||localStorage.getItem(`empresaActual`)||``),U=u(()=>H.empresaNombre||H.user?.empresaNombre||`Mi Empresa`),W=a([]),G=a(``),K=a(null),q=a([]),J=a(!1);function Y(e){if(!e)return`—`;try{let t;t=e instanceof Date?`${e.getUTCFullYear()}-${String(e.getUTCMonth()+1).padStart(2,`0`)}-${String(e.getUTCDate()).padStart(2,`0`)}`:String(e).split(`T`)[0];let[n,r,i]=t.split(`-`);return`${r}/${i}/${n}`}catch{return String(e)}}function X(e){return`$`+parseFloat(e||0).toLocaleString(`en-US`,{minimumFractionDigits:2,maximumFractionDigits:2})}function Z(e){return parseFloat(e||0).toFixed(2)}function Q(e){return e.tipo_empleado===`1099`&&e.empresa_contratista?`${e.apellido}, ${e.nombre} — ${e.empresa_contratista}`:`${e.apellido}, ${e.nombre}`}async function Ie(){try{W.value=(await y.get(`/nomina/liquidaciones`,{params:{empresa:Fe.value}})).data?.data||[],W.value.length&&(G.value=W.value[0].id,await $())}catch(e){console.error(`Error cargando liquidaciones:`,e)}}async function $(){if(!G.value){K.value=null,q.value=[];return}J.value=!0;try{let e=await y.get(`/nomina/liquidaciones/${G.value}`);K.value=e.data.liquidacion,q.value=e.data.lineas||[]}catch(e){console.error(`Error cargando líneas:`,e),K.value=null,q.value=[]}finally{J.value=!1}}function Le(e){if(!K.value)return;let t=window.open(``,`_blank`);if(!t){alert(`Activa los pop-ups para imprimir el recibo`);return}let n=`${Y(K.value.semana_inicio)} — ${Y(K.value.semana_fin)}`,r=U.value,i=Q(e),a=e.tipo_empleado===`W2`,o=`<span class="rec-badge ${a?`badge-w2`:`badge-1099`}">${e.tipo_empleado}</span>`,s=a?`Employee`:`Independent Contractor`,c=``;parseFloat(e.horas_regulares)>0&&(c+=`
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
    </div>`}).join(``)}</div></body></html>`;e.document.write(r),e.document.close(),e.focus()}return ee(Ie),(a,c)=>(v(),p(t,null,{default:f(()=>[g(`div`,ie,[m(re,{title:`Recibos de Pago — Pay Stubs`,description:K.value?`${Y(K.value.semana_inicio)} — ${Y(K.value.semana_fin)}`:``,crumbs:[`Nómina`,`Reportes`,`Recibos de Pago`]},{actions:f(()=>[K.value?(v(),d(`span`,{key:0,class:i([`estado-badge`,`estado-${K.value.estado?.toLowerCase()}`])},s(K.value.estado),3)):h(``,!0),n(g(`select`,{"onUpdate:modelValue":c[0]||=e=>G.value=e,class:`drw-select`,style:{width:`220px`},onChange:$},[c[1]||=g(`option`,{value:``},`— Seleccionar nómina —`,-1),(v(!0),d(o,null,_(W.value,e=>(v(),d(`option`,{key:e.id,value:e.id},s(Y(e.semana_inicio))+` · `+s(e.estado),9,ae))),128))],544),[[r,G.value]]),q.value.length?(v(),p(e,{key:1,size:`small`,color:`secondary`,variant:`flat`,onClick:Re},{default:f(()=>[m(b,{size:`14`,class:`mr-1`},{default:f(()=>[...c[2]||=[l(`mdi-printer`,-1)]]),_:1}),c[3]||=l(` Imprimir Todos `,-1)]),_:1})):h(``,!0)]),_:1},8,[`description`]),J.value?(v(),d(`div`,oe,[m(ne,{indeterminate:``,color:`secondary`,size:`28`})])):K.value&&q.value.length?(v(),d(`div`,se,[(v(!0),d(o,null,_(q.value,t=>(v(),d(`div`,{key:t.id,class:`recibo`},[g(`div`,ce,[g(`div`,le,[g(`div`,ue,s(U.value),1),c[4]||=g(`div`,{class:`rec-titulo`},`RECIBO DE PAGO`,-1),g(`div`,de,s(Y(K.value.semana_inicio))+` — `+s(Y(K.value.semana_fin)),1)]),m(e,{size:`x-small`,icon:`mdi-printer`,color:`white`,variant:`text`,onClick:e=>Le(t),class:`rec-print-btn`,title:`Imprimir este recibo`},null,8,[`onClick`])]),g(`div`,fe,[g(`div`,null,[g(`div`,pe,s(Q(t)),1),g(`div`,x,[g(`span`,{class:i([`rec-badge`,t.tipo_empleado===`W2`?`badge-w2`:`badge-1099`])},s(t.tipo_empleado),3),l(` `+s(t.tipo_empleado===`W2`?`Employee`:`Independent Contractor`),1)])]),g(`div`,S,[c[5]||=g(`div`,{style:{"font-size":`10px`,color:`rgba(255,255,255,0.5)`}},`NET PAY`,-1),g(`div`,null,s(X(t.total_neto)),1)])]),c[27]||=g(`div`,{class:`rec-section-title`},`EARNINGS`,-1),g(`table`,C,[c[11]||=g(`thead`,null,[g(`tr`,null,[g(`th`,null,`DESCRIPTION`),g(`th`,{class:`ta-r`},`HOURS`),g(`th`,{class:`ta-r`},`RATE`),g(`th`,{class:`ta-r`},`AMOUNT`)])],-1),g(`tbody`,null,[parseFloat(t.horas_regulares)>0?(v(),d(`tr`,w,[c[6]||=g(`td`,null,`Regular Pay`,-1),g(`td`,T,s(Z(t.horas_regulares)),1),g(`td`,E,s(X(t.valor_hora))+`/h`,1),g(`td`,D,s(X(t.bruto_regular)),1)])):h(``,!0),parseFloat(t.horas_overtime)>0?(v(),d(`tr`,O,[c[7]||=g(`td`,null,`Overtime Pay (1.5×)`,-1),g(`td`,k,s(Z(t.horas_overtime)),1),g(`td`,A,s(X(t.valor_hora_ot))+`/h`,1),g(`td`,j,s(X(t.bruto_overtime)),1)])):h(``,!0),parseFloat(t.bruto_base)>0?(v(),d(`tr`,M,[g(`td`,null,s(t.es_monto_fijo?`Fixed Weekly Amount`:`Base Salary`),1),c[8]||=g(`td`,{class:`ta-r`},`—`,-1),c[9]||=g(`td`,{class:`ta-r`},`—`,-1),g(`td`,N,s(X(t.bruto_base)),1)])):h(``,!0),g(`tr`,P,[c[10]||=g(`td`,{colspan:`3`},[g(`strong`,null,`Gross Pay`)],-1),g(`td`,F,[g(`strong`,null,s(X(t.total_bruto)),1)])])])]),t.tipo_empleado===`W2`?(v(),d(o,{key:0},[c[23]||=g(`div`,{class:`rec-section-title`},`DEDUCTIONS`,-1),g(`table`,I,[g(`tbody`,null,[parseFloat(t.federal_income_tax)>0?(v(),d(`tr`,L,[c[12]||=g(`td`,null,`Federal Income Tax (FIT)`,-1),g(`td`,R,`-`+s(X(t.federal_income_tax)),1)])):h(``,!0),parseFloat(t.social_security_emp)>0?(v(),d(`tr`,z,[c[13]||=g(`td`,null,`Social Security (6.2%)`,-1),g(`td`,B,`-`+s(X(t.social_security_emp)),1)])):h(``,!0),parseFloat(t.medicare_emp)>0?(v(),d(`tr`,me,[c[14]||=g(`td`,null,`Medicare (1.45%)`,-1),g(`td`,he,`-`+s(X(t.medicare_emp)),1)])):h(``,!0),parseFloat(t.medicare_adicional)>0?(v(),d(`tr`,ge,[c[15]||=g(`td`,null,`Additional Medicare (0.9%)`,-1),g(`td`,_e,`-`+s(X(t.medicare_adicional)),1)])):h(``,!0),parseFloat(t.workers_comp)>0?(v(),d(`tr`,ve,[c[16]||=g(`td`,null,`Workers' Compensation`,-1),g(`td`,V,`-`+s(X(t.workers_comp)),1)])):h(``,!0),parseFloat(t.otras_deducciones)>0?(v(),d(`tr`,ye,[c[17]||=g(`td`,null,`Other Deductions`,-1),g(`td`,be,`-`+s(X(t.otras_deducciones)),1)])):h(``,!0),g(`tr`,xe,[c[18]||=g(`td`,null,[g(`strong`,null,`Total Deductions`)],-1),g(`td`,Se,[g(`strong`,null,`-`+s(X(t.total_deducciones)),1)])])])]),c[24]||=g(`div`,{class:`rec-section-title`,style:{opacity:`0.5`}},`EMPLOYER CONTRIBUTIONS (informativo)`,-1),g(`table`,Ce,[g(`tbody`,null,[g(`tr`,null,[c[19]||=g(`td`,null,`Social Security (employer 6.2%)`,-1),g(`td`,we,s(X(t.social_security_er)),1)]),g(`tr`,null,[c[20]||=g(`td`,null,`Medicare (employer 1.45%)`,-1),g(`td`,Te,s(X(t.medicare_er)),1)]),parseFloat(t.futa)>0?(v(),d(`tr`,Ee,[c[21]||=g(`td`,null,`FUTA`,-1),g(`td`,De,s(X(t.futa)),1)])):h(``,!0),parseFloat(t.suta)>0?(v(),d(`tr`,Oe,[c[22]||=g(`td`,null,`FL Reemployment Tax`,-1),g(`td`,ke,s(X(t.suta)),1)])):h(``,!0)])])],64)):h(``,!0),g(`div`,Ae,[g(`div`,null,[c[25]||=g(`div`,{class:`rec-ytd-label`},`YTD Gross`,-1),g(`div`,je,s(X(t.ytd_bruto)),1)]),g(`div`,Me,[c[26]||=g(`div`,{style:{"font-size":`10px`,opacity:`0.7`}},`NET PAY`,-1),g(`div`,null,s(X(t.total_neto)),1)])])]))),128))])):G.value&&!J.value?(v(),d(`div`,Ne,[m(b,{size:`40`,color:`rgba(var(--v-theme-on-surface),0.15)`},{default:f(()=>[...c[28]||=[l(`mdi-file-document-outline`,-1)]]),_:1}),c[29]||=g(`div`,{style:{"margin-top":`10px`,"font-weight":`700`}},`Sin líneas de nómina`,-1),c[30]||=g(`div`,{style:{"font-size":`12px`,color:`rgba(var(--v-theme-on-surface),0.4)`,"margin-top":`4px`}},` Esta nómina no tiene recibos calculados. Calcula la nómina primero. `,-1)])):G.value?h(``,!0):(v(),d(`div`,Pe,[m(b,{size:`40`,color:`rgba(var(--v-theme-on-surface),0.15)`},{default:f(()=>[...c[31]||=[l(`mdi-cash-register`,-1)]]),_:1}),c[32]||=g(`div`,{style:{"margin-top":`10px`,"font-weight":`700`}},`Selecciona una nómina`,-1),c[33]||=g(`div`,{style:{"font-size":`12px`,color:`rgba(var(--v-theme-on-surface),0.4)`,"margin-top":`4px`}},` Elige una nómina aprobada del selector para ver los recibos de pago. `,-1)]))])]),_:1}))}},[[`__scopeId`,`data-v-fa9f8392`]]);export{H as default};