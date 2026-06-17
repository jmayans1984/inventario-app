import{t as e}from"./api-Ckz6uiv4.js";import{m as t,t as n}from"./VBtn-T_xNQqKx.js";import{t as r}from"./MainLayout-5PWET2el.js";import{$t as i,Gn as a,In as o,Jn as s,On as c,Wt as l,Yt as u,an as d,bn as f,en as p,hn as ee,i as te,in as m,kn as ne,nn as h,rn as g,s as re,tn as _,vn as v}from"./index-tzgd4pks.js";import{t as y}from"./VIcon-D6ntKD2C.js";var ie={class:`nom-wrap`},ae={class:`nom-header`},oe={class:`nom-header-icon`},se={class:`flex-1`},ce={key:0,class:`nom-sub`},le={style:{display:`flex`,gap:`8px`,"align-items":`center`,"flex-wrap":`wrap`}},ue=[`value`],de={key:0,class:`nom-card`,style:{padding:`32px`,"text-align":`center`}},fe={key:1,class:`recibos-grid`},pe={class:`rec-header-container`},b={class:`rec-header`},x={class:`rec-empresa`},S={class:`rec-periodo`},C={class:`rec-emp-row`},w={class:`rec-emp-nombre`},T={class:`rec-emp-tipo`},E={class:`rec-neto-big`},D={class:`rec-table`},O={key:0},k={class:`ta-r`},A={class:`ta-r`},j={class:`ta-r`},M={key:1},N={class:`ta-r`},P={class:`ta-r`},F={class:`ta-r`},I={key:2},L={class:`ta-r`},R={class:`rec-total-row`},z={class:`ta-r`},B={class:`rec-table`},me={key:0},he={class:`ta-r`},ge={key:1},_e={class:`ta-r`},ve={key:2},ye={class:`ta-r`},be={key:3},xe={class:`ta-r`},Se={key:4},V={class:`ta-r`},Ce={key:5},we={class:`ta-r`},Te={class:`rec-total-row`},Ee={class:`ta-r`,style:{color:`#ef4444`}},De={class:`rec-table`,style:{opacity:`0.55`,"font-size":`10px`}},Oe={class:`ta-r`},ke={class:`ta-r`},Ae={key:0},je={class:`ta-r`},Me={key:1},Ne={class:`ta-r`},Pe={class:`rec-net-footer`},Fe={class:`rec-ytd-val`},Ie={class:`rec-net-amount`},Le={key:2,class:`nom-card estado-vacio`},Re={key:3,class:`nom-card estado-vacio`},H=te({__name:`RecibosNominaView`,setup(te){let H=re(),ze=i(()=>H.empresa||H.user?.empresa||localStorage.getItem(`empresaActual`)||``),U=i(()=>H.empresaNombre||H.user?.empresaNombre||`Mi Empresa`),W=o([]),G=o(``),K=o(null),q=o([]),J=o(!1);function Y(e){if(!e)return`—`;try{let t;t=e instanceof Date?`${e.getUTCFullYear()}-${String(e.getUTCMonth()+1).padStart(2,`0`)}-${String(e.getUTCDate()).padStart(2,`0`)}`:String(e).split(`T`)[0];let[n,r,i]=t.split(`-`);return`${r}/${i}/${n}`}catch{return String(e)}}function X(e){return`$`+parseFloat(e||0).toLocaleString(`en-US`,{minimumFractionDigits:2,maximumFractionDigits:2})}function Z(e){return parseFloat(e||0).toFixed(2)}function Q(e){return e.tipo_empleado===`1099`&&e.empresa_contratista?`${e.apellido}, ${e.nombre} — ${e.empresa_contratista}`:`${e.apellido}, ${e.nombre}`}async function Be(){try{W.value=(await e.get(`/nomina/liquidaciones`,{params:{empresa:ze.value}})).data?.data||[],W.value.length&&(G.value=W.value[0].id,await $())}catch(e){console.error(`Error cargando liquidaciones:`,e)}}async function $(){if(!G.value){K.value=null,q.value=[];return}J.value=!0;try{let t=await e.get(`/nomina/liquidaciones/${G.value}`);K.value=t.data.liquidacion,q.value=t.data.lineas||[]}catch(e){console.error(`Error cargando líneas:`,e),K.value=null,q.value=[]}finally{J.value=!1}}function Ve(e){if(!K.value)return;let t=window.open(``,`_blank`);if(!t){alert(`Activa los pop-ups para imprimir el recibo`);return}let n=`${Y(K.value.semana_inicio)} — ${Y(K.value.semana_fin)}`,r=U.value,i=Q(e),a=e.tipo_empleado===`W2`,o=`<span class="rec-badge ${a?`badge-w2`:`badge-1099`}">${e.tipo_empleado}</span>`,s=a?`Employee`:`Independent Contractor`,c=``;parseFloat(e.horas_regulares)>0&&(c+=`
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
    </div>`}).join(``)}</div></body></html>`;e.document.write(r),e.document.close(),e.focus()}return ee(Be),(e,i)=>(v(),_(r,null,{default:c(()=>[p(`div`,ie,[p(`div`,ae,[p(`div`,oe,[d(y,{size:`20`,color:`white`},{default:c(()=>[...i[1]||=[m(`mdi-file-document-outline`,-1)]]),_:1})]),p(`div`,se,[i[2]||=p(`h1`,{class:`nom-title`},`RECIBOS DE PAGO — PAY STUBS`,-1),K.value?(v(),g(`p`,ce,[m(s(Y(K.value.semana_inicio))+` — `+s(Y(K.value.semana_fin))+` `,1),p(`span`,{class:a([`estado-badge`,`estado-${K.value.estado?.toLowerCase()}`])},s(K.value.estado),3)])):h(``,!0)]),p(`div`,le,[ne(p(`select`,{"onUpdate:modelValue":i[0]||=e=>G.value=e,class:`drw-select`,style:{width:`220px`},onChange:$},[i[3]||=p(`option`,{value:``},`— Seleccionar nómina —`,-1),(v(!0),g(u,null,f(W.value,e=>(v(),g(`option`,{key:e.id,value:e.id},s(Y(e.semana_inicio))+` · `+s(e.estado),9,ue))),128))],544),[[l,G.value]]),q.value.length?(v(),_(n,{key:0,size:`small`,color:`#8b5cf6`,variant:`flat`,onClick:He},{default:c(()=>[d(y,{size:`14`,class:`mr-1`},{default:c(()=>[...i[4]||=[m(`mdi-printer`,-1)]]),_:1}),i[5]||=m(` Imprimir Todos `,-1)]),_:1})):h(``,!0)])]),J.value?(v(),g(`div`,de,[d(t,{indeterminate:``,color:`#8b5cf6`,size:`28`})])):K.value&&q.value.length?(v(),g(`div`,fe,[(v(!0),g(u,null,f(q.value,e=>(v(),g(`div`,{key:e.id,class:`recibo`},[p(`div`,pe,[p(`div`,b,[p(`div`,x,s(U.value),1),i[6]||=p(`div`,{class:`rec-titulo`},`RECIBO DE PAGO`,-1),p(`div`,S,s(Y(K.value.semana_inicio))+` — `+s(Y(K.value.semana_fin)),1)]),d(n,{size:`x-small`,icon:`mdi-printer`,color:`white`,variant:`text`,onClick:t=>Ve(e),class:`rec-print-btn`,title:`Imprimir este recibo`},null,8,[`onClick`])]),p(`div`,C,[p(`div`,null,[p(`div`,w,s(Q(e)),1),p(`div`,T,[p(`span`,{class:a([`rec-badge`,e.tipo_empleado===`W2`?`badge-w2`:`badge-1099`])},s(e.tipo_empleado),3),m(` `+s(e.tipo_empleado===`W2`?`Employee`:`Independent Contractor`),1)])]),p(`div`,E,[i[7]||=p(`div`,{style:{"font-size":`10px`,color:`rgba(255,255,255,0.5)`}},`NET PAY`,-1),p(`div`,null,s(X(e.total_neto)),1)])]),i[29]||=p(`div`,{class:`rec-section-title`},`EARNINGS`,-1),p(`table`,D,[i[13]||=p(`thead`,null,[p(`tr`,null,[p(`th`,null,`DESCRIPTION`),p(`th`,{class:`ta-r`},`HOURS`),p(`th`,{class:`ta-r`},`RATE`),p(`th`,{class:`ta-r`},`AMOUNT`)])],-1),p(`tbody`,null,[parseFloat(e.horas_regulares)>0?(v(),g(`tr`,O,[i[8]||=p(`td`,null,`Regular Pay`,-1),p(`td`,k,s(Z(e.horas_regulares)),1),p(`td`,A,s(X(e.valor_hora))+`/h`,1),p(`td`,j,s(X(e.bruto_regular)),1)])):h(``,!0),parseFloat(e.horas_overtime)>0?(v(),g(`tr`,M,[i[9]||=p(`td`,null,`Overtime Pay (1.5×)`,-1),p(`td`,N,s(Z(e.horas_overtime)),1),p(`td`,P,s(X(e.valor_hora_ot))+`/h`,1),p(`td`,F,s(X(e.bruto_overtime)),1)])):h(``,!0),parseFloat(e.bruto_base)>0?(v(),g(`tr`,I,[p(`td`,null,s(e.es_monto_fijo?`Fixed Weekly Amount`:`Base Salary`),1),i[10]||=p(`td`,{class:`ta-r`},`—`,-1),i[11]||=p(`td`,{class:`ta-r`},`—`,-1),p(`td`,L,s(X(e.bruto_base)),1)])):h(``,!0),p(`tr`,R,[i[12]||=p(`td`,{colspan:`3`},[p(`strong`,null,`Gross Pay`)],-1),p(`td`,z,[p(`strong`,null,s(X(e.total_bruto)),1)])])])]),e.tipo_empleado===`W2`?(v(),g(u,{key:0},[i[25]||=p(`div`,{class:`rec-section-title`},`DEDUCTIONS`,-1),p(`table`,B,[p(`tbody`,null,[parseFloat(e.federal_income_tax)>0?(v(),g(`tr`,me,[i[14]||=p(`td`,null,`Federal Income Tax (FIT)`,-1),p(`td`,he,`-`+s(X(e.federal_income_tax)),1)])):h(``,!0),parseFloat(e.social_security_emp)>0?(v(),g(`tr`,ge,[i[15]||=p(`td`,null,`Social Security (6.2%)`,-1),p(`td`,_e,`-`+s(X(e.social_security_emp)),1)])):h(``,!0),parseFloat(e.medicare_emp)>0?(v(),g(`tr`,ve,[i[16]||=p(`td`,null,`Medicare (1.45%)`,-1),p(`td`,ye,`-`+s(X(e.medicare_emp)),1)])):h(``,!0),parseFloat(e.medicare_adicional)>0?(v(),g(`tr`,be,[i[17]||=p(`td`,null,`Additional Medicare (0.9%)`,-1),p(`td`,xe,`-`+s(X(e.medicare_adicional)),1)])):h(``,!0),parseFloat(e.workers_comp)>0?(v(),g(`tr`,Se,[i[18]||=p(`td`,null,`Workers' Compensation`,-1),p(`td`,V,`-`+s(X(e.workers_comp)),1)])):h(``,!0),parseFloat(e.otras_deducciones)>0?(v(),g(`tr`,Ce,[i[19]||=p(`td`,null,`Other Deductions`,-1),p(`td`,we,`-`+s(X(e.otras_deducciones)),1)])):h(``,!0),p(`tr`,Te,[i[20]||=p(`td`,null,[p(`strong`,null,`Total Deductions`)],-1),p(`td`,Ee,[p(`strong`,null,`-`+s(X(e.total_deducciones)),1)])])])]),i[26]||=p(`div`,{class:`rec-section-title`,style:{opacity:`0.5`}},`EMPLOYER CONTRIBUTIONS (informativo)`,-1),p(`table`,De,[p(`tbody`,null,[p(`tr`,null,[i[21]||=p(`td`,null,`Social Security (employer 6.2%)`,-1),p(`td`,Oe,s(X(e.social_security_er)),1)]),p(`tr`,null,[i[22]||=p(`td`,null,`Medicare (employer 1.45%)`,-1),p(`td`,ke,s(X(e.medicare_er)),1)]),parseFloat(e.futa)>0?(v(),g(`tr`,Ae,[i[23]||=p(`td`,null,`FUTA`,-1),p(`td`,je,s(X(e.futa)),1)])):h(``,!0),parseFloat(e.suta)>0?(v(),g(`tr`,Me,[i[24]||=p(`td`,null,`FL Reemployment Tax`,-1),p(`td`,Ne,s(X(e.suta)),1)])):h(``,!0)])])],64)):h(``,!0),p(`div`,Pe,[p(`div`,null,[i[27]||=p(`div`,{class:`rec-ytd-label`},`YTD Gross`,-1),p(`div`,Fe,s(X(e.ytd_bruto)),1)]),p(`div`,Ie,[i[28]||=p(`div`,{style:{"font-size":`10px`,opacity:`0.7`}},`NET PAY`,-1),p(`div`,null,s(X(e.total_neto)),1)])])]))),128))])):G.value&&!J.value?(v(),g(`div`,Le,[d(y,{size:`40`,color:`rgba(var(--v-theme-on-surface),0.15)`},{default:c(()=>[...i[30]||=[m(`mdi-file-document-outline`,-1)]]),_:1}),i[31]||=p(`div`,{style:{"margin-top":`10px`,"font-weight":`700`}},`Sin líneas de nómina`,-1),i[32]||=p(`div`,{style:{"font-size":`12px`,color:`rgba(var(--v-theme-on-surface),0.4)`,"margin-top":`4px`}},` Esta nómina no tiene recibos calculados. Calcula la nómina primero. `,-1)])):G.value?h(``,!0):(v(),g(`div`,Re,[d(y,{size:`40`,color:`rgba(var(--v-theme-on-surface),0.15)`},{default:c(()=>[...i[33]||=[m(`mdi-cash-register`,-1)]]),_:1}),i[34]||=p(`div`,{style:{"margin-top":`10px`,"font-weight":`700`}},`Selecciona una nómina`,-1),i[35]||=p(`div`,{style:{"font-size":`12px`,color:`rgba(var(--v-theme-on-surface),0.4)`,"margin-top":`4px`}},` Elige una nómina aprobada del selector para ver los recibos de pago. `,-1)]))])]),_:1}))}},[[`__scopeId`,`data-v-624e2a3c`]]);export{H as default};