import{Ar as e,Ft as t,Mr as n,Mt as r,Or as i,Q as a,Qr as o,Rr as s,S as c,Wr as l,Z as u,_r as d,dr as f,gr as p,hr as m,kt as h,mr as g,or as ee,pr as _,ti as v,vr as y,yr as b,zr as te}from"./index.js";import{t as ne}from"./MainLayout.js";import{t as re}from"./PageHeader.js";var ie={class:`nom-wrap`},ae=[`value`],oe={key:0,class:`nom-card`,style:{padding:`32px`,"text-align":`center`}},se={key:1,class:`recibos-grid`},ce={class:`rec-header-container`},le={class:`rec-header`},ue={class:`rec-empresa`},de={class:`rec-periodo`},fe={class:`rec-emp-row`},pe={class:`rec-emp-nombre`},x={class:`rec-emp-tipo`},S={class:`rec-neto-big`},C={class:`rec-table`},w={key:0},T={class:`ta-r`},E={class:`ta-r`},D={class:`ta-r`},O={key:1},k={class:`ta-r`},A={class:`ta-r`},j={class:`ta-r`},M={key:2},N={class:`ta-r`},P={class:`rec-total-row`},F={class:`ta-r`},I={class:`rec-table`},L={key:0},R={class:`ta-r`},z={key:1},B={class:`ta-r`},me={key:2},he={class:`ta-r`},ge={key:3},_e={class:`ta-r`},ve={key:4},V={class:`ta-r`},ye={key:5},be={class:`ta-r`},xe={class:`rec-total-row`},Se={class:`ta-r`,style:{color:`var(--error)`}},Ce={class:`rec-table`,style:{opacity:`0.55`,"font-size":`10px`}},we={class:`ta-r`},Te={class:`ta-r`},Ee={key:0},De={class:`ta-r`},Oe={key:1},ke={class:`ta-r`},Ae={class:`rec-net-footer`},je={class:`rec-ytd-val`},Me={class:`rec-net-amount`},Ne={key:2,class:`nom-card estado-vacio`},Pe={key:3,class:`nom-card estado-vacio`},H=r({__name:`RecibosNominaView`,setup(r){let H=t(),Fe=_(()=>H.empresa||H.user?.empresa||localStorage.getItem(`empresaActual`)||``),U=_(()=>H.empresaNombre||H.user?.empresaNombre||`Mi Empresa`),W=l([]),G=l(``),K=l(null),q=l([]),J=l(!1);function Y(e){if(!e)return`—`;try{let t;t=e instanceof Date?`${e.getUTCFullYear()}-${String(e.getUTCMonth()+1).padStart(2,`0`)}-${String(e.getUTCDate()).padStart(2,`0`)}`:String(e).split(`T`)[0];let[n,r,i]=t.split(`-`);return`${r}/${i}/${n}`}catch{return String(e)}}function X(e){return`$`+parseFloat(e||0).toLocaleString(`en-US`,{minimumFractionDigits:2,maximumFractionDigits:2})}function Z(e){return parseFloat(e||0).toFixed(2)}function Q(e){return e.tipo_empleado===`1099`&&e.empresa_contratista?`${e.apellido}, ${e.nombre} — ${e.empresa_contratista}`:`${e.apellido}, ${e.nombre}`}async function Ie(){try{W.value=(await h.get(`/nomina/liquidaciones`,{params:{empresa:Fe.value}})).data?.data||[],W.value.length&&(G.value=W.value[0].id,await $())}catch(e){console.error(`Error cargando liquidaciones:`,e)}}async function $(){if(!G.value){K.value=null,q.value=[];return}J.value=!0;try{let e=await h.get(`/nomina/liquidaciones/${G.value}`);K.value=e.data.liquidacion,q.value=e.data.lineas||[]}catch(e){console.error(`Error cargando líneas:`,e),K.value=null,q.value=[]}finally{J.value=!1}}function Le(e){if(!K.value)return;let t=window.open(``,`_blank`);if(!t){alert(`Activa los pop-ups para imprimir el recibo`);return}let n=`${Y(K.value.semana_inicio)} — ${Y(K.value.semana_fin)}`,r=U.value,i=Q(e),a=e.tipo_empleado===`W2`,o=`<span class="rec-badge ${a?`badge-w2`:`badge-1099`}">${e.tipo_empleado}</span>`,s=a?`Employee`:`Independent Contractor`,c=``;parseFloat(e.horas_regulares)>0&&(c+=`
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
    </div>`}).join(``)}</div></body></html>`;e.document.write(r),e.document.close(),e.focus()}return i(Ie),(t,r)=>(e(),m(ne,null,{default:s(()=>[g(`div`,ie,[b(re,{title:`Recibos de Pago — Pay Stubs`,description:K.value?`${Y(K.value.semana_inicio)} — ${Y(K.value.semana_fin)}`:``,crumbs:[`Nómina`,`Reportes`,`Recibos de Pago`]},{actions:s(()=>[K.value?(e(),d(`span`,{key:0,class:o([`estado-badge`,`estado-${K.value.estado?.toLowerCase()}`])},v(K.value.estado),3)):p(``,!0),te(g(`select`,{"onUpdate:modelValue":r[0]||=e=>G.value=e,class:`drw-select`,style:{width:`220px`},onChange:$},[r[1]||=g(`option`,{value:``},`— Seleccionar nómina —`,-1),(e(!0),d(f,null,n(W.value,t=>(e(),d(`option`,{key:t.id,value:t.id},v(Y(t.semana_inicio))+` · `+v(t.estado),9,ae))),128))],544),[[ee,G.value]]),q.value.length?(e(),m(c,{key:1,size:`small`,color:`secondary`,variant:`flat`,onClick:Re},{default:s(()=>[b(a,{size:`14`,class:`mr-1`},{default:s(()=>[...r[2]||=[y(`mdi-printer`,-1)]]),_:1}),r[3]||=y(` Imprimir Todos `,-1)]),_:1})):p(``,!0)]),_:1},8,[`description`]),J.value?(e(),d(`div`,oe,[b(u,{indeterminate:``,color:`secondary`,size:`28`})])):K.value&&q.value.length?(e(),d(`div`,se,[(e(!0),d(f,null,n(q.value,t=>(e(),d(`div`,{key:t.id,class:`recibo`},[g(`div`,ce,[g(`div`,le,[g(`div`,ue,v(U.value),1),r[4]||=g(`div`,{class:`rec-titulo`},`RECIBO DE PAGO`,-1),g(`div`,de,v(Y(K.value.semana_inicio))+` — `+v(Y(K.value.semana_fin)),1)]),b(c,{size:`x-small`,icon:`mdi-printer`,color:`white`,variant:`text`,onClick:e=>Le(t),class:`rec-print-btn`,title:`Imprimir este recibo`},null,8,[`onClick`])]),g(`div`,fe,[g(`div`,null,[g(`div`,pe,v(Q(t)),1),g(`div`,x,[g(`span`,{class:o([`rec-badge`,t.tipo_empleado===`W2`?`badge-w2`:`badge-1099`])},v(t.tipo_empleado),3),y(` `+v(t.tipo_empleado===`W2`?`Employee`:`Independent Contractor`),1)])]),g(`div`,S,[r[5]||=g(`div`,{style:{"font-size":`10px`,color:`rgba(255,255,255,0.5)`}},`NET PAY`,-1),g(`div`,null,v(X(t.total_neto)),1)])]),r[27]||=g(`div`,{class:`rec-section-title`},`EARNINGS`,-1),g(`table`,C,[r[11]||=g(`thead`,null,[g(`tr`,null,[g(`th`,null,`DESCRIPTION`),g(`th`,{class:`ta-r`},`HOURS`),g(`th`,{class:`ta-r`},`RATE`),g(`th`,{class:`ta-r`},`AMOUNT`)])],-1),g(`tbody`,null,[parseFloat(t.horas_regulares)>0?(e(),d(`tr`,w,[r[6]||=g(`td`,null,`Regular Pay`,-1),g(`td`,T,v(Z(t.horas_regulares)),1),g(`td`,E,v(X(t.valor_hora))+`/h`,1),g(`td`,D,v(X(t.bruto_regular)),1)])):p(``,!0),parseFloat(t.horas_overtime)>0?(e(),d(`tr`,O,[r[7]||=g(`td`,null,`Overtime Pay (1.5×)`,-1),g(`td`,k,v(Z(t.horas_overtime)),1),g(`td`,A,v(X(t.valor_hora_ot))+`/h`,1),g(`td`,j,v(X(t.bruto_overtime)),1)])):p(``,!0),parseFloat(t.bruto_base)>0?(e(),d(`tr`,M,[g(`td`,null,v(t.es_monto_fijo?`Fixed Weekly Amount`:`Base Salary`),1),r[8]||=g(`td`,{class:`ta-r`},`—`,-1),r[9]||=g(`td`,{class:`ta-r`},`—`,-1),g(`td`,N,v(X(t.bruto_base)),1)])):p(``,!0),g(`tr`,P,[r[10]||=g(`td`,{colspan:`3`},[g(`strong`,null,`Gross Pay`)],-1),g(`td`,F,[g(`strong`,null,v(X(t.total_bruto)),1)])])])]),t.tipo_empleado===`W2`?(e(),d(f,{key:0},[r[23]||=g(`div`,{class:`rec-section-title`},`DEDUCTIONS`,-1),g(`table`,I,[g(`tbody`,null,[parseFloat(t.federal_income_tax)>0?(e(),d(`tr`,L,[r[12]||=g(`td`,null,`Federal Income Tax (FIT)`,-1),g(`td`,R,`-`+v(X(t.federal_income_tax)),1)])):p(``,!0),parseFloat(t.social_security_emp)>0?(e(),d(`tr`,z,[r[13]||=g(`td`,null,`Social Security (6.2%)`,-1),g(`td`,B,`-`+v(X(t.social_security_emp)),1)])):p(``,!0),parseFloat(t.medicare_emp)>0?(e(),d(`tr`,me,[r[14]||=g(`td`,null,`Medicare (1.45%)`,-1),g(`td`,he,`-`+v(X(t.medicare_emp)),1)])):p(``,!0),parseFloat(t.medicare_adicional)>0?(e(),d(`tr`,ge,[r[15]||=g(`td`,null,`Additional Medicare (0.9%)`,-1),g(`td`,_e,`-`+v(X(t.medicare_adicional)),1)])):p(``,!0),parseFloat(t.workers_comp)>0?(e(),d(`tr`,ve,[r[16]||=g(`td`,null,`Workers' Compensation`,-1),g(`td`,V,`-`+v(X(t.workers_comp)),1)])):p(``,!0),parseFloat(t.otras_deducciones)>0?(e(),d(`tr`,ye,[r[17]||=g(`td`,null,`Other Deductions`,-1),g(`td`,be,`-`+v(X(t.otras_deducciones)),1)])):p(``,!0),g(`tr`,xe,[r[18]||=g(`td`,null,[g(`strong`,null,`Total Deductions`)],-1),g(`td`,Se,[g(`strong`,null,`-`+v(X(t.total_deducciones)),1)])])])]),r[24]||=g(`div`,{class:`rec-section-title`,style:{opacity:`0.5`}},`EMPLOYER CONTRIBUTIONS (informativo)`,-1),g(`table`,Ce,[g(`tbody`,null,[g(`tr`,null,[r[19]||=g(`td`,null,`Social Security (employer 6.2%)`,-1),g(`td`,we,v(X(t.social_security_er)),1)]),g(`tr`,null,[r[20]||=g(`td`,null,`Medicare (employer 1.45%)`,-1),g(`td`,Te,v(X(t.medicare_er)),1)]),parseFloat(t.futa)>0?(e(),d(`tr`,Ee,[r[21]||=g(`td`,null,`FUTA`,-1),g(`td`,De,v(X(t.futa)),1)])):p(``,!0),parseFloat(t.suta)>0?(e(),d(`tr`,Oe,[r[22]||=g(`td`,null,`FL Reemployment Tax`,-1),g(`td`,ke,v(X(t.suta)),1)])):p(``,!0)])])],64)):p(``,!0),g(`div`,Ae,[g(`div`,null,[r[25]||=g(`div`,{class:`rec-ytd-label`},`YTD Gross`,-1),g(`div`,je,v(X(t.ytd_bruto)),1)]),g(`div`,Me,[r[26]||=g(`div`,{style:{"font-size":`10px`,opacity:`0.7`}},`NET PAY`,-1),g(`div`,null,v(X(t.total_neto)),1)])])]))),128))])):G.value&&!J.value?(e(),d(`div`,Ne,[b(a,{size:`40`,color:`rgba(var(--v-theme-on-surface),0.15)`},{default:s(()=>[...r[28]||=[y(`mdi-file-document-outline`,-1)]]),_:1}),r[29]||=g(`div`,{style:{"margin-top":`10px`,"font-weight":`700`}},`Sin líneas de nómina`,-1),r[30]||=g(`div`,{style:{"font-size":`12px`,color:`rgba(var(--v-theme-on-surface),0.4)`,"margin-top":`4px`}},` Esta nómina no tiene recibos calculados. Calcula la nómina primero. `,-1)])):G.value?p(``,!0):(e(),d(`div`,Pe,[b(a,{size:`40`,color:`rgba(var(--v-theme-on-surface),0.15)`},{default:s(()=>[...r[31]||=[y(`mdi-cash-register`,-1)]]),_:1}),r[32]||=g(`div`,{style:{"margin-top":`10px`,"font-weight":`700`}},`Selecciona una nómina`,-1),r[33]||=g(`div`,{style:{"font-size":`12px`,color:`rgba(var(--v-theme-on-surface),0.4)`,"margin-top":`4px`}},` Elige una nómina aprobada del selector para ver los recibos de pago. `,-1)]))])]),_:1}))}},[[`__scopeId`,`data-v-6d6c7571`]]);export{H as default};