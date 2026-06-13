import{t as e}from"./api-Ckz6uiv4.js";import{m as t,t as n}from"./VBtn-5WiSQslC.js";import{t as r}from"./MainLayout-jOS_GNP4.js";import{$t as i,An as a,Kn as o,Ln as s,Wt as c,Yn as l,Yt as u,an as d,en as f,gn as ee,i as te,kn as p,nn as m,on as h,rn as g,s as ne,tn as _,xn as v,yn as y}from"./index-LcUwdEx9.js";import{t as b}from"./VIcon-Dzy66wjI.js";var re={class:`nom-wrap`},ie={class:`nom-header`},ae={class:`nom-header-icon`},oe={class:`flex-1`},se={key:0,class:`nom-sub`},ce={style:{display:`flex`,gap:`8px`,"align-items":`center`,"flex-wrap":`wrap`}},le=[`value`],ue={key:0,class:`nom-card`,style:{padding:`32px`,"text-align":`center`}},de={key:1,class:`recibos-grid`},fe={class:`rec-header-container`},pe={class:`rec-header`},x={class:`rec-empresa`},S={class:`rec-periodo`},C={class:`rec-emp-row`},w={class:`rec-emp-nombre`},T={class:`rec-emp-tipo`},E={class:`rec-neto-big`},D={class:`rec-table`},O={key:0},k={class:`ta-r`},A={class:`ta-r`},j={class:`ta-r`},M={key:1},N={class:`ta-r`},P={class:`ta-r`},F={class:`ta-r`},I={key:2},L={class:`ta-r`},R={class:`rec-total-row`},z={class:`ta-r`},B={class:`rec-table`},me={key:0},he={class:`ta-r`},ge={key:1},_e={class:`ta-r`},ve={key:2},ye={class:`ta-r`},be={key:3},xe={class:`ta-r`},Se={key:4},V={class:`ta-r`},Ce={key:5},we={class:`ta-r`},Te={class:`rec-total-row`},Ee={class:`ta-r`,style:{color:`#ef4444`}},De={class:`rec-table`,style:{opacity:`0.55`,"font-size":`10px`}},Oe={class:`ta-r`},ke={class:`ta-r`},Ae={key:0},je={class:`ta-r`},Me={key:1},Ne={class:`ta-r`},Pe={class:`rec-net-footer`},Fe={class:`rec-ytd-val`},Ie={class:`rec-net-amount`},Le={key:2,class:`nom-card estado-vacio`},Re={key:3,class:`nom-card estado-vacio`},H=te({__name:`RecibosNominaView`,setup(te){let H=ne(),ze=i(()=>H.empresa||H.user?.empresa||localStorage.getItem(`empresaActual`)||``),U=i(()=>H.empresaNombre||H.user?.empresaNombre||`Mi Empresa`),W=s([]),G=s(``),K=s(null),q=s([]),J=s(!1);function Y(e){if(!e)return`—`;try{let t;t=e instanceof Date?`${e.getUTCFullYear()}-${String(e.getUTCMonth()+1).padStart(2,`0`)}-${String(e.getUTCDate()).padStart(2,`0`)}`:String(e).split(`T`)[0];let[n,r,i]=t.split(`-`);return`${parseInt(i)} ${[``,`Ene`,`Feb`,`Mar`,`Abr`,`May`,`Jun`,`Jul`,`Ago`,`Sep`,`Oct`,`Nov`,`Dic`][parseInt(r)]} ${n}`}catch{return String(e)}}function X(e){return`$`+parseFloat(e||0).toLocaleString(`en-US`,{minimumFractionDigits:2,maximumFractionDigits:2})}function Z(e){return parseFloat(e||0).toFixed(2)}function Q(e){return e.tipo_empleado===`1099`&&e.empresa_contratista?`${e.apellido}, ${e.nombre} — ${e.empresa_contratista}`:`${e.apellido}, ${e.nombre}`}async function Be(){try{W.value=(await e.get(`/nomina/liquidaciones`,{params:{empresa:ze.value}})).data?.data||[],W.value.length&&(G.value=W.value[0].id,await $())}catch(e){console.error(`Error cargando liquidaciones:`,e)}}async function $(){if(!G.value){K.value=null,q.value=[];return}J.value=!0;try{let t=await e.get(`/nomina/liquidaciones/${G.value}`);K.value=t.data.liquidacion,q.value=t.data.lineas||[]}catch(e){console.error(`Error cargando líneas:`,e),K.value=null,q.value=[]}finally{J.value=!1}}function Ve(e){if(!K.value)return;let t=window.open(``,`_blank`);if(!t){alert(`Activa los pop-ups para imprimir el recibo`);return}let n=`${Y(K.value.semana_inicio)} — ${Y(K.value.semana_fin)}`,r=U.value,i=Q(e),a=e.tipo_empleado===`W2`,o=`<span class="rec-badge ${a?`badge-w2`:`badge-1099`}">${e.tipo_empleado}</span>`,s=a?`Employee`:`Independent Contractor`,c=``;parseFloat(e.horas_regulares)>0&&(c+=`
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
    </div>`}).join(``)}</div></body></html>`;e.document.write(r),e.document.close(),e.focus()}return ee(Be),(e,i)=>(y(),_(r,null,{default:p(()=>[f(`div`,re,[f(`div`,ie,[f(`div`,ae,[h(b,{size:`20`,color:`white`},{default:p(()=>[...i[1]||=[d(`mdi-file-document-outline`,-1)]]),_:1})]),f(`div`,oe,[i[2]||=f(`h1`,{class:`nom-title`},`RECIBOS DE PAGO — PAY STUBS`,-1),K.value?(y(),g(`p`,se,[d(l(Y(K.value.semana_inicio))+` — `+l(Y(K.value.semana_fin))+` `,1),f(`span`,{class:o([`estado-badge`,`estado-${K.value.estado?.toLowerCase()}`])},l(K.value.estado),3)])):m(``,!0)]),f(`div`,ce,[a(f(`select`,{"onUpdate:modelValue":i[0]||=e=>G.value=e,class:`drw-select`,style:{width:`220px`},onChange:$},[i[3]||=f(`option`,{value:``},`— Seleccionar nómina —`,-1),(y(!0),g(u,null,v(W.value,e=>(y(),g(`option`,{key:e.id,value:e.id},l(Y(e.semana_inicio))+` · `+l(e.estado),9,le))),128))],544),[[c,G.value]]),q.value.length?(y(),_(n,{key:0,size:`small`,color:`#8b5cf6`,variant:`flat`,onClick:He},{default:p(()=>[h(b,{size:`14`,class:`mr-1`},{default:p(()=>[...i[4]||=[d(`mdi-printer`,-1)]]),_:1}),i[5]||=d(` Imprimir Todos `,-1)]),_:1})):m(``,!0)])]),J.value?(y(),g(`div`,ue,[h(t,{indeterminate:``,color:`#8b5cf6`,size:`28`})])):K.value&&q.value.length?(y(),g(`div`,de,[(y(!0),g(u,null,v(q.value,e=>(y(),g(`div`,{key:e.id,class:`recibo`},[f(`div`,fe,[f(`div`,pe,[f(`div`,x,l(U.value),1),i[6]||=f(`div`,{class:`rec-titulo`},`RECIBO DE PAGO`,-1),f(`div`,S,l(Y(K.value.semana_inicio))+` — `+l(Y(K.value.semana_fin)),1)]),h(n,{size:`x-small`,icon:`mdi-printer`,color:`white`,variant:`text`,onClick:t=>Ve(e),class:`rec-print-btn`,title:`Imprimir este recibo`},null,8,[`onClick`])]),f(`div`,C,[f(`div`,null,[f(`div`,w,l(Q(e)),1),f(`div`,T,[f(`span`,{class:o([`rec-badge`,e.tipo_empleado===`W2`?`badge-w2`:`badge-1099`])},l(e.tipo_empleado),3),d(` `+l(e.tipo_empleado===`W2`?`Employee`:`Independent Contractor`),1)])]),f(`div`,E,[i[7]||=f(`div`,{style:{"font-size":`10px`,color:`rgba(255,255,255,0.5)`}},`NET PAY`,-1),f(`div`,null,l(X(e.total_neto)),1)])]),i[29]||=f(`div`,{class:`rec-section-title`},`EARNINGS`,-1),f(`table`,D,[i[13]||=f(`thead`,null,[f(`tr`,null,[f(`th`,null,`DESCRIPTION`),f(`th`,{class:`ta-r`},`HOURS`),f(`th`,{class:`ta-r`},`RATE`),f(`th`,{class:`ta-r`},`AMOUNT`)])],-1),f(`tbody`,null,[parseFloat(e.horas_regulares)>0?(y(),g(`tr`,O,[i[8]||=f(`td`,null,`Regular Pay`,-1),f(`td`,k,l(Z(e.horas_regulares)),1),f(`td`,A,l(X(e.valor_hora))+`/h`,1),f(`td`,j,l(X(e.bruto_regular)),1)])):m(``,!0),parseFloat(e.horas_overtime)>0?(y(),g(`tr`,M,[i[9]||=f(`td`,null,`Overtime Pay (1.5×)`,-1),f(`td`,N,l(Z(e.horas_overtime)),1),f(`td`,P,l(X(e.valor_hora_ot))+`/h`,1),f(`td`,F,l(X(e.bruto_overtime)),1)])):m(``,!0),parseFloat(e.bruto_base)>0?(y(),g(`tr`,I,[f(`td`,null,l(e.es_monto_fijo?`Fixed Weekly Amount`:`Base Salary`),1),i[10]||=f(`td`,{class:`ta-r`},`—`,-1),i[11]||=f(`td`,{class:`ta-r`},`—`,-1),f(`td`,L,l(X(e.bruto_base)),1)])):m(``,!0),f(`tr`,R,[i[12]||=f(`td`,{colspan:`3`},[f(`strong`,null,`Gross Pay`)],-1),f(`td`,z,[f(`strong`,null,l(X(e.total_bruto)),1)])])])]),e.tipo_empleado===`W2`?(y(),g(u,{key:0},[i[25]||=f(`div`,{class:`rec-section-title`},`DEDUCTIONS`,-1),f(`table`,B,[f(`tbody`,null,[parseFloat(e.federal_income_tax)>0?(y(),g(`tr`,me,[i[14]||=f(`td`,null,`Federal Income Tax (FIT)`,-1),f(`td`,he,`-`+l(X(e.federal_income_tax)),1)])):m(``,!0),parseFloat(e.social_security_emp)>0?(y(),g(`tr`,ge,[i[15]||=f(`td`,null,`Social Security (6.2%)`,-1),f(`td`,_e,`-`+l(X(e.social_security_emp)),1)])):m(``,!0),parseFloat(e.medicare_emp)>0?(y(),g(`tr`,ve,[i[16]||=f(`td`,null,`Medicare (1.45%)`,-1),f(`td`,ye,`-`+l(X(e.medicare_emp)),1)])):m(``,!0),parseFloat(e.medicare_adicional)>0?(y(),g(`tr`,be,[i[17]||=f(`td`,null,`Additional Medicare (0.9%)`,-1),f(`td`,xe,`-`+l(X(e.medicare_adicional)),1)])):m(``,!0),parseFloat(e.workers_comp)>0?(y(),g(`tr`,Se,[i[18]||=f(`td`,null,`Workers' Compensation`,-1),f(`td`,V,`-`+l(X(e.workers_comp)),1)])):m(``,!0),parseFloat(e.otras_deducciones)>0?(y(),g(`tr`,Ce,[i[19]||=f(`td`,null,`Other Deductions`,-1),f(`td`,we,`-`+l(X(e.otras_deducciones)),1)])):m(``,!0),f(`tr`,Te,[i[20]||=f(`td`,null,[f(`strong`,null,`Total Deductions`)],-1),f(`td`,Ee,[f(`strong`,null,`-`+l(X(e.total_deducciones)),1)])])])]),i[26]||=f(`div`,{class:`rec-section-title`,style:{opacity:`0.5`}},`EMPLOYER CONTRIBUTIONS (informativo)`,-1),f(`table`,De,[f(`tbody`,null,[f(`tr`,null,[i[21]||=f(`td`,null,`Social Security (employer 6.2%)`,-1),f(`td`,Oe,l(X(e.social_security_er)),1)]),f(`tr`,null,[i[22]||=f(`td`,null,`Medicare (employer 1.45%)`,-1),f(`td`,ke,l(X(e.medicare_er)),1)]),parseFloat(e.futa)>0?(y(),g(`tr`,Ae,[i[23]||=f(`td`,null,`FUTA`,-1),f(`td`,je,l(X(e.futa)),1)])):m(``,!0),parseFloat(e.suta)>0?(y(),g(`tr`,Me,[i[24]||=f(`td`,null,`FL Reemployment Tax`,-1),f(`td`,Ne,l(X(e.suta)),1)])):m(``,!0)])])],64)):m(``,!0),f(`div`,Pe,[f(`div`,null,[i[27]||=f(`div`,{class:`rec-ytd-label`},`YTD Gross`,-1),f(`div`,Fe,l(X(e.ytd_bruto)),1)]),f(`div`,Ie,[i[28]||=f(`div`,{style:{"font-size":`10px`,opacity:`0.7`}},`NET PAY`,-1),f(`div`,null,l(X(e.total_neto)),1)])])]))),128))])):G.value&&!J.value?(y(),g(`div`,Le,[h(b,{size:`40`,color:`rgba(var(--v-theme-on-surface),0.15)`},{default:p(()=>[...i[30]||=[d(`mdi-file-document-outline`,-1)]]),_:1}),i[31]||=f(`div`,{style:{"margin-top":`10px`,"font-weight":`700`}},`Sin líneas de nómina`,-1),i[32]||=f(`div`,{style:{"font-size":`12px`,color:`rgba(var(--v-theme-on-surface),0.4)`,"margin-top":`4px`}},` Esta nómina no tiene recibos calculados. Calcula la nómina primero. `,-1)])):G.value?m(``,!0):(y(),g(`div`,Re,[h(b,{size:`40`,color:`rgba(var(--v-theme-on-surface),0.15)`},{default:p(()=>[...i[33]||=[d(`mdi-cash-register`,-1)]]),_:1}),i[34]||=f(`div`,{style:{"margin-top":`10px`,"font-weight":`700`}},`Selecciona una nómina`,-1),i[35]||=f(`div`,{style:{"font-size":`12px`,color:`rgba(var(--v-theme-on-surface),0.4)`,"margin-top":`4px`}},` Elige una nómina aprobada del selector para ver los recibos de pago. `,-1)]))])]),_:1}))}},[[`__scopeId`,`data-v-b85d41c5`]]);export{H as default};