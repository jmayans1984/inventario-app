import{Dr as e,Ft as t,Lr as n,Mt as r,Q as i,Rr as a,S as o,Ur as s,Z as c,Zr as l,_r as u,ar as ee,ei as d,fr as f,gr as p,hr as m,jr as h,kr as g,kt as _,mr as v,pr as y,ur as b,vr as x}from"./index.js";import{t as te}from"./MainLayout.js";import{t as ne}from"./PageHeader.js";var re={class:`nom-wrap`},ie=[`value`],ae={key:0,class:`nom-card`,style:{padding:`32px`,"text-align":`center`}},oe={key:1,class:`recibos-grid`},se={class:`rec-header-container`},ce={class:`rec-header`},le={class:`rec-empresa`},ue={class:`rec-periodo`},de={class:`rec-emp-row`},fe={class:`rec-emp-nombre`},pe={class:`rec-emp-tipo`},S={class:`rec-neto-big`},C={class:`rec-table`},w={key:0},T={class:`ta-r`},E={class:`ta-r`},D={class:`ta-r`},O={key:1},k={class:`ta-r`},A={class:`ta-r`},j={class:`ta-r`},M={key:2},N={class:`ta-r`},P={class:`rec-total-row`},F={class:`ta-r`},I={class:`rec-table`},L={key:0},R={class:`ta-r`},z={key:1},B={class:`ta-r`},me={key:2},he={class:`ta-r`},ge={key:3},V={class:`ta-r`},_e={key:4},ve={class:`ta-r`},ye={key:5},be={class:`ta-r`},xe={class:`rec-total-row`},Se={class:`ta-r`,style:{color:`var(--error)`}},Ce={class:`rec-table`,style:{opacity:`0.55`,"font-size":`10px`}},we={class:`ta-r`},Te={class:`ta-r`},Ee={key:0},De={class:`ta-r`},Oe={key:1},ke={class:`ta-r`},Ae={class:`rec-net-footer`},je={class:`rec-ytd-val`},Me={class:`rec-net-amount`},Ne={key:2,class:`nom-card estado-vacio`},Pe={key:3,class:`nom-card estado-vacio`},H=r({__name:`RecibosNominaView`,setup(r){let H=t(),Fe=f(()=>H.empresa||H.user?.empresa||localStorage.getItem(`empresaActual`)||``),U=f(()=>H.empresaNombre||H.user?.empresaNombre||`Mi Empresa`),W=s([]),G=s(``),K=s(null),q=s([]),J=s(!1);function Y(e){if(!e)return`—`;try{let t;t=e instanceof Date?`${e.getUTCFullYear()}-${String(e.getUTCMonth()+1).padStart(2,`0`)}-${String(e.getUTCDate()).padStart(2,`0`)}`:String(e).split(`T`)[0];let[n,r,i]=t.split(`-`);return`${r}/${i}/${n}`}catch{return String(e)}}function X(e){return`$`+parseFloat(e||0).toLocaleString(`en-US`,{minimumFractionDigits:2,maximumFractionDigits:2})}function Z(e){return parseFloat(e||0).toFixed(2)}function Q(e){return e.tipo_empleado===`1099`&&e.empresa_contratista?`${e.apellido}, ${e.nombre} — ${e.empresa_contratista}`:`${e.apellido}, ${e.nombre}`}async function Ie(){try{W.value=(await _.get(`/nomina/liquidaciones`,{params:{empresa:Fe.value}})).data?.data||[],W.value.length&&(G.value=W.value[0].id,await $())}catch(e){console.error(`Error cargando liquidaciones:`,e)}}async function $(){if(!G.value){K.value=null,q.value=[];return}J.value=!0;try{let e=await _.get(`/nomina/liquidaciones/${G.value}`);K.value=e.data.liquidacion,q.value=e.data.lineas||[]}catch(e){console.error(`Error cargando líneas:`,e),K.value=null,q.value=[]}finally{J.value=!1}}function Le(e){if(!K.value)return;let t=window.open(``,`_blank`);if(!t){alert(`Activa los pop-ups para imprimir el recibo`);return}let n=`${Y(K.value.semana_inicio)} — ${Y(K.value.semana_fin)}`,r=U.value,i=Q(e),a=e.tipo_empleado===`W2`,o=`<span class="rec-badge ${a?`badge-w2`:`badge-1099`}">${e.tipo_empleado}</span>`,s=a?`Employee`:`Independent Contractor`,c=``;parseFloat(e.horas_regulares)>0&&(c+=`
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
    </div>`}).join(``)}</div></body></html>`;e.document.write(r),e.document.close(),e.focus()}return e(Ie),(e,t)=>(g(),v(te,null,{default:n(()=>[y(`div`,re,[x(ne,{title:`Recibos de Pago — Pay Stubs`,description:K.value?`${Y(K.value.semana_inicio)} — ${Y(K.value.semana_fin)}`:``,crumbs:[`Nómina`,`Reportes`,`Recibos de Pago`]},{actions:n(()=>[K.value?(g(),p(`span`,{key:0,class:l([`estado-badge`,`estado-${K.value.estado?.toLowerCase()}`])},d(K.value.estado),3)):m(``,!0),a(y(`select`,{"onUpdate:modelValue":t[0]||=e=>G.value=e,class:`drw-select`,style:{width:`220px`},onChange:$},[t[1]||=y(`option`,{value:``},`— Seleccionar nómina —`,-1),(g(!0),p(b,null,h(W.value,e=>(g(),p(`option`,{key:e.id,value:e.id},d(Y(e.semana_inicio))+` · `+d(e.estado),9,ie))),128))],544),[[ee,G.value]]),q.value.length?(g(),v(o,{key:1,size:`small`,color:`secondary`,variant:`flat`,onClick:Re},{default:n(()=>[x(i,{size:`14`,class:`mr-1`},{default:n(()=>[...t[2]||=[u(`mdi-printer`,-1)]]),_:1}),t[3]||=u(` Imprimir Todos `,-1)]),_:1})):m(``,!0)]),_:1},8,[`description`]),J.value?(g(),p(`div`,ae,[x(c,{indeterminate:``,color:`secondary`,size:`28`})])):K.value&&q.value.length?(g(),p(`div`,oe,[(g(!0),p(b,null,h(q.value,e=>(g(),p(`div`,{key:e.id,class:`recibo`},[y(`div`,se,[y(`div`,ce,[y(`div`,le,d(U.value),1),t[4]||=y(`div`,{class:`rec-titulo`},`RECIBO DE PAGO`,-1),y(`div`,ue,d(Y(K.value.semana_inicio))+` — `+d(Y(K.value.semana_fin)),1)]),x(o,{size:`x-small`,icon:`mdi-printer`,color:`white`,variant:`text`,onClick:t=>Le(e),class:`rec-print-btn`,title:`Imprimir este recibo`},null,8,[`onClick`])]),y(`div`,de,[y(`div`,null,[y(`div`,fe,d(Q(e)),1),y(`div`,pe,[y(`span`,{class:l([`rec-badge`,e.tipo_empleado===`W2`?`badge-w2`:`badge-1099`])},d(e.tipo_empleado),3),u(` `+d(e.tipo_empleado===`W2`?`Employee`:`Independent Contractor`),1)])]),y(`div`,S,[t[5]||=y(`div`,{style:{"font-size":`10px`,color:`rgba(255,255,255,0.5)`}},`NET PAY`,-1),y(`div`,null,d(X(e.total_neto)),1)])]),t[27]||=y(`div`,{class:`rec-section-title`},`EARNINGS`,-1),y(`table`,C,[t[11]||=y(`thead`,null,[y(`tr`,null,[y(`th`,null,`DESCRIPTION`),y(`th`,{class:`ta-r`},`HOURS`),y(`th`,{class:`ta-r`},`RATE`),y(`th`,{class:`ta-r`},`AMOUNT`)])],-1),y(`tbody`,null,[parseFloat(e.horas_regulares)>0?(g(),p(`tr`,w,[t[6]||=y(`td`,null,`Regular Pay`,-1),y(`td`,T,d(Z(e.horas_regulares)),1),y(`td`,E,d(X(e.valor_hora))+`/h`,1),y(`td`,D,d(X(e.bruto_regular)),1)])):m(``,!0),parseFloat(e.horas_overtime)>0?(g(),p(`tr`,O,[t[7]||=y(`td`,null,`Overtime Pay (1.5×)`,-1),y(`td`,k,d(Z(e.horas_overtime)),1),y(`td`,A,d(X(e.valor_hora_ot))+`/h`,1),y(`td`,j,d(X(e.bruto_overtime)),1)])):m(``,!0),parseFloat(e.bruto_base)>0?(g(),p(`tr`,M,[y(`td`,null,d(e.es_monto_fijo?`Fixed Weekly Amount`:`Base Salary`),1),t[8]||=y(`td`,{class:`ta-r`},`—`,-1),t[9]||=y(`td`,{class:`ta-r`},`—`,-1),y(`td`,N,d(X(e.bruto_base)),1)])):m(``,!0),y(`tr`,P,[t[10]||=y(`td`,{colspan:`3`},[y(`strong`,null,`Gross Pay`)],-1),y(`td`,F,[y(`strong`,null,d(X(e.total_bruto)),1)])])])]),e.tipo_empleado===`W2`?(g(),p(b,{key:0},[t[23]||=y(`div`,{class:`rec-section-title`},`DEDUCTIONS`,-1),y(`table`,I,[y(`tbody`,null,[parseFloat(e.federal_income_tax)>0?(g(),p(`tr`,L,[t[12]||=y(`td`,null,`Federal Income Tax (FIT)`,-1),y(`td`,R,`-`+d(X(e.federal_income_tax)),1)])):m(``,!0),parseFloat(e.social_security_emp)>0?(g(),p(`tr`,z,[t[13]||=y(`td`,null,`Social Security (6.2%)`,-1),y(`td`,B,`-`+d(X(e.social_security_emp)),1)])):m(``,!0),parseFloat(e.medicare_emp)>0?(g(),p(`tr`,me,[t[14]||=y(`td`,null,`Medicare (1.45%)`,-1),y(`td`,he,`-`+d(X(e.medicare_emp)),1)])):m(``,!0),parseFloat(e.medicare_adicional)>0?(g(),p(`tr`,ge,[t[15]||=y(`td`,null,`Additional Medicare (0.9%)`,-1),y(`td`,V,`-`+d(X(e.medicare_adicional)),1)])):m(``,!0),parseFloat(e.workers_comp)>0?(g(),p(`tr`,_e,[t[16]||=y(`td`,null,`Workers' Compensation`,-1),y(`td`,ve,`-`+d(X(e.workers_comp)),1)])):m(``,!0),parseFloat(e.otras_deducciones)>0?(g(),p(`tr`,ye,[t[17]||=y(`td`,null,`Other Deductions`,-1),y(`td`,be,`-`+d(X(e.otras_deducciones)),1)])):m(``,!0),y(`tr`,xe,[t[18]||=y(`td`,null,[y(`strong`,null,`Total Deductions`)],-1),y(`td`,Se,[y(`strong`,null,`-`+d(X(e.total_deducciones)),1)])])])]),t[24]||=y(`div`,{class:`rec-section-title`,style:{opacity:`0.5`}},`EMPLOYER CONTRIBUTIONS (informativo)`,-1),y(`table`,Ce,[y(`tbody`,null,[y(`tr`,null,[t[19]||=y(`td`,null,`Social Security (employer 6.2%)`,-1),y(`td`,we,d(X(e.social_security_er)),1)]),y(`tr`,null,[t[20]||=y(`td`,null,`Medicare (employer 1.45%)`,-1),y(`td`,Te,d(X(e.medicare_er)),1)]),parseFloat(e.futa)>0?(g(),p(`tr`,Ee,[t[21]||=y(`td`,null,`FUTA`,-1),y(`td`,De,d(X(e.futa)),1)])):m(``,!0),parseFloat(e.suta)>0?(g(),p(`tr`,Oe,[t[22]||=y(`td`,null,`FL Reemployment Tax`,-1),y(`td`,ke,d(X(e.suta)),1)])):m(``,!0)])])],64)):m(``,!0),y(`div`,Ae,[y(`div`,null,[t[25]||=y(`div`,{class:`rec-ytd-label`},`YTD Gross`,-1),y(`div`,je,d(X(e.ytd_bruto)),1)]),y(`div`,Me,[t[26]||=y(`div`,{style:{"font-size":`10px`,opacity:`0.7`}},`NET PAY`,-1),y(`div`,null,d(X(e.total_neto)),1)])])]))),128))])):G.value&&!J.value?(g(),p(`div`,Ne,[x(i,{size:`40`,color:`rgba(var(--v-theme-on-surface),0.15)`},{default:n(()=>[...t[28]||=[u(`mdi-file-document-outline`,-1)]]),_:1}),t[29]||=y(`div`,{style:{"margin-top":`10px`,"font-weight":`700`}},`Sin líneas de nómina`,-1),t[30]||=y(`div`,{style:{"font-size":`12px`,color:`rgba(var(--v-theme-on-surface),0.4)`,"margin-top":`4px`}},` Esta nómina no tiene recibos calculados. Calcula la nómina primero. `,-1)])):G.value?m(``,!0):(g(),p(`div`,Pe,[x(i,{size:`40`,color:`rgba(var(--v-theme-on-surface),0.15)`},{default:n(()=>[...t[31]||=[u(`mdi-cash-register`,-1)]]),_:1}),t[32]||=y(`div`,{style:{"margin-top":`10px`,"font-weight":`700`}},`Selecciona una nómina`,-1),t[33]||=y(`div`,{style:{"font-size":`12px`,color:`rgba(var(--v-theme-on-surface),0.4)`,"margin-top":`4px`}},` Elige una nómina aprobada del selector para ver los recibos de pago. `,-1)]))])]),_:1}))}},[[`__scopeId`,`data-v-fa9f8392`]]);export{H as default};