import{$r as e,A as t,Dr as n,Ft as r,It as i,Lr as a,Mt as o,Nr as s,Q as c,S as l,Ur as u,Zr as d,_r as f,ei as p,fr as m,gr as h,hr as g,jr as _,kr as v,mr as y,pr as b,ur as x,vr as S,x as C}from"./index.js";import{t as w}from"./MainLayout.js";import{t as T}from"./PageHeader.js";import{t as E}from"./KpiCard.js";var ee={class:`rn-container`},te={class:`rn-filters-card`},ne={class:`rn-filters-row`},re={class:`filter-group`},ie={class:`filter-group`},ae={key:1,class:`kpi-grid`},oe={key:2,class:`rn-tabs-card`},se={class:`rn-tabs-header`},ce=[`onClick`],le={key:0,class:`rn-empty`},ue={key:1,class:`rn-table-wrap`},de={class:`rn-table`},fe={class:`periodo-label`},pe={class:`periodo-sub`},me={class:`ta-r`},he={class:`ta-r font-mono`},ge={class:`ta-r font-mono text-error`},_e={class:`ta-r font-mono text-warning`},ve={class:`ta-r font-mono text-success`},ye={class:`ta-r font-mono text-purple`},be={class:`ta-c`},xe={class:`rn-tfoot`},D={class:`ta-r`},O={class:`ta-r font-mono`},k={class:`ta-r font-mono text-error`},A={class:`ta-r font-mono text-warning`},j={class:`ta-r font-mono text-success`},M={class:`ta-r font-mono text-purple`},Se={key:2,class:`rn-table-wrap`},Ce={class:`rn-nota`},we={class:`rn-table`},Te={class:`rn-mes-head`},Ee={class:`mes-sub`},De={class:`ta-r font-mono`},Oe={class:`ta-r font-mono`},ke={class:`ta-r font-mono`},Ae={class:`ta-r font-mono text-error`},je={class:`ta-r font-mono text-warning`},Me={class:`ta-r font-mono text-success`},Ne={class:`ta-r font-mono text-purple`},Pe={class:`periodo-label`},Fe={key:0,class:`badge-partido`,title:`Esta nómina cruza dos meses: solo se muestra la parte que corresponde a este mes`},Ie={class:`periodo-sub`},Le={class:`ta-r font-mono`},Re={class:`ta-r font-mono`},ze={class:`ta-r font-mono`},Be={class:`ta-r font-mono`},Ve={class:`ta-r font-mono text-error`},He={class:`ta-r font-mono text-warning`},Ue={class:`ta-r font-mono text-success`},We={class:`ta-r font-mono text-purple`},Ge={class:`rn-tfoot`},Ke={class:`ta-r font-mono`},qe={class:`ta-r font-mono text-error`},Je={class:`ta-r font-mono text-warning`},Ye={class:`ta-r font-mono text-success`},Xe={class:`ta-r font-mono text-purple`},Ze={key:3,class:`rn-table-wrap`},Qe={class:`rn-table`},$e={class:`font-weight-medium`},et={class:`ta-c`},tt={class:`ta-r`},nt={class:`ta-r font-mono`},rt={class:`ta-r font-mono`},it={class:`ta-r font-mono`},at={class:`ta-r font-mono text-error`},ot={class:`ta-r font-mono text-warning`},st={class:`ta-r font-mono text-success`},ct={class:`ta-r font-mono text-purple`},lt={class:`rn-tfoot`},ut={class:`ta-r font-mono`},dt={class:`ta-r font-mono text-error`},ft={class:`ta-r font-mono text-warning`},pt={class:`ta-r font-mono text-success`},mt={class:`ta-r font-mono text-purple`},ht={key:4,class:`rn-table-wrap`},gt={class:`rn-table`},_t={class:`font-weight-medium`},vt={class:`ta-c text-caption font-mono`,style:{color:`rgba(var(--v-theme-on-surface),.5)`}},yt={class:`ta-r`},bt={class:`ta-r font-mono`},xt={class:`ta-r font-mono`},N={class:`ta-r font-mono text-purple`},St={class:`ta-r`},Ct={class:`pct-bar-wrap`},wt={class:`pct-label`},Tt={class:`rn-tfoot`},Et={class:`ta-r font-mono`},Dt={class:`ta-r font-mono text-purple`},Ot={key:5,class:`rn-table-wrap`},kt={class:`rn-table`},At={class:`periodo-label`},jt={class:`periodo-sub`},Mt={class:`ta-r font-mono`},Nt={class:`ta-r font-mono`},Pt={class:`ta-r font-mono`},Ft={class:`ta-r font-mono`},It={class:`ta-r font-mono`},Lt={class:`ta-r font-mono`},Rt={class:`ta-r font-mono`},zt={class:`ta-r font-mono`},Bt={class:`ta-r font-mono text-error font-weight-bold`},Vt={class:`rn-tfoot`},Ht={class:`ta-r font-mono`},Ut={class:`ta-r font-mono`},Wt={class:`ta-r font-mono`},Gt={class:`ta-r font-mono`},Kt={class:`ta-r font-mono`},qt={class:`ta-r font-mono`},Jt={class:`ta-r font-mono`},Yt={class:`ta-r font-mono`},Xt={class:`ta-r font-mono text-error font-weight-bold`},P=o({__name:`ReporteNominaView`,setup(o){let P=r(),F=()=>P.empresaCodigo||P.empresa||localStorage.getItem(`empresaActual`),I=u(!1),L=u(!1),R=u(null),z=u(null);async function Zt(e){if(e){z.value=e.id;try{let t=String(e.semana_inicio).split(`T`)[0],n=String(e.semana_fin).split(`T`)[0],r={empresa:F(),fechaInicio:t,fechaFin:n},[a,o]=await Promise.all([fetch(`${i}/nomina/reporte?${new URLSearchParams({...r,vista:`horas`})}`).then(e=>e.json()),fetch(`${i}/nomina/reporte?${new URLSearchParams({...r,vista:`horas_ccosto`})}`).then(e=>e.json())]),s=a?.data||[],c=o?.data||[],l=s.reduce((e,t)=>({reg:e.reg+(parseFloat(t.horas_regulares)||0),ot:e.ot+(parseFloat(t.horas_overtime)||0),dias:e.dias+(parseFloat(t.dias_trabajados)||0),bruto:e.bruto+(parseFloat(t.total_bruto)||0)}),{reg:0,ot:0,dias:0,bruto:0}),u=s.map(e=>`
      <tr>
        <td>${e.nombre}</td>
        <td class="c"><span class="badge ${e.tipo_empleado===`W2`?`w2`:`c1099`}">${e.tipo_empleado}</span></td>
        <td class="c"><span class="badge tipo">${e.tipo_salario}</span></td>
        <td>${X(e.salario_base)}</td>
        <td>${+e.horas_regulares?Z(e.horas_regulares):`—`}</td>
        <td class="text-amber">${+e.horas_overtime?Z(e.horas_overtime):`—`}</td>
        <td>${+e.dias_trabajados||`—`}</td>
        <td class="b">${X(e.total_bruto)}</td>
      </tr>`).join(``),d={};for(let e of c){let t=e.ccosto_nombre||e.ccosto;d[t]=(d[t]||0)+(parseFloat(e.horas)||0)}let f=Object.keys(d).sort((e,t)=>d[t]-d[e]),p=new Map;for(let e of c){p.has(e.empleado_id)||p.set(e.empleado_id,{nombre:e.nombre,horas:{},total:0});let t=p.get(e.empleado_id),n=e.ccosto_nombre||e.ccosto,r=parseFloat(e.horas)||0;t.horas[n]=(t.horas[n]||0)+r,t.total+=r}let m=[...p.values()].sort((e,t)=>t.total-e.total),h=m.reduce((e,t)=>e+t.total,0),g=m.map(e=>`
      <tr>
        <td>${e.nombre}</td>
        ${f.map(t=>`<td class="${e.horas[t]?``:`cero`}">${e.horas[t]?Z(e.horas[t]):`—`}</td>`).join(``)}
        <td class="b">${Z(e.total)}</td>
      </tr>`).join(``),_=`<!DOCTYPE html><html><head><meta charset="UTF-8">
      <title>Horas Trabajadas ${Q(t)} - ${Q(n)}</title>
      <style>
      * { box-sizing: border-box; margin: 0; padding: 0; }
      body { font-family: Arial, sans-serif; font-size: 11px; color: #111; padding: 24px; background: white; }
      h1 { font-size: 18px; font-weight: 900; color: #be185d; margin-bottom: 4px; }
      .sub { font-size: 11px; color: #888; margin-bottom: 22px; }
      .section { margin-bottom: 30px; }
      .section-title { font-size: 12px; font-weight: 800; text-transform: uppercase; letter-spacing: .8px; color: #be185d; border-bottom: 2px solid #ec4899; padding-bottom: 4px; margin-bottom: 10px; }
      table { width: 100%; border-collapse: collapse; font-size: 10px; }
      th { background: #fdf2f8; padding: 5px 9px; text-align: right; font-size: 9px; font-weight: 700; letter-spacing: .5px; text-transform: uppercase; color: #9ca3af; border-bottom: 1px solid #e5e7eb; white-space: nowrap; }
      th:first-child { text-align: left; }
      td { padding: 4px 9px; text-align: right; border-bottom: 1px solid #f3f4f6; }
      td:first-child { text-align: left; font-weight: 500; }
      td.c { text-align: center; }
      td.b { font-weight: 700; }
      td.cero { color: #d1d5db; }
      tr:nth-child(even) { background: #fafafa; }
      .tfoot td { background: #fdf2f8; font-weight: 700; font-size: 10.5px; border-top: 2px solid #f9a8d4; padding: 5px 9px; }
      .badge { font-size: 8.5px; font-weight: 700; padding: 1px 6px; border-radius: 3px; white-space: nowrap; }
      .w2    { background: #dcfce7; color: #15803d; }
      .c1099 { background: #ede9fe; color: #7c3aed; }
      .tipo  { background: #f3f4f6; color: #4b5563; }
      .text-amber { color: #b45309; }
      @media print { body { padding: 12px; } .section { page-break-inside: avoid; } }
    </style></head>
      <body>
        <h1>HORAS TRABAJADAS</h1>
        <div class="sub">Semana del ${Q(t)} al ${Q(n)}</div>

        <div class="section">
          <div class="section-title">Por Trabajador</div>
          <table>
            <thead><tr>
              <th>TRABAJADOR</th><th style="text-align:center">TIPO</th>
              <th style="text-align:center">SALARIO BASE</th><th>VALOR</th>
              <th>H. REG.</th><th>H. EXTRA</th><th>DÍAS</th><th>BRUTO</th>
            </tr></thead>
            <tbody>${u||`<tr><td colspan="8">Sin datos</td></tr>`}</tbody>
            <tfoot><tr class="tfoot">
              <td colspan="4">TOTAL ${s.length} TRABAJADORES</td>
              <td>${Z(l.reg)}</td>
              <td class="text-amber">${Z(l.ot)}</td>
              <td>${l.dias||`—`}</td>
              <td>${X(l.bruto)}</td>
            </tr></tfoot>
          </table>
        </div>

        <div class="section">
          <div class="section-title">Horas por Centro de Costo</div>
          <table>
            <thead><tr>
              <th>TRABAJADOR</th>${f.map(e=>`<th>${e}</th>`).join(``)}<th>TOTAL</th>
            </tr></thead>
            <tbody>${g||`<tr><td colspan="${f.length+2}">Sin datos</td></tr>`}</tbody>
            <tfoot><tr class="tfoot">
              <td>TOTAL</td>
              ${f.map(e=>`<td>${Z(d[e])}</td>`).join(``)}
              <td>${Z(h)}</td>
            </tr></tfoot>
          </table>
        </div>
      </body></html>`,v=window.open(``,`_blank`);if(!v){alert(`Activa los pop-ups para generar el informe`);return}v.document.write(_),v.document.close(),v.focus()}catch(e){console.error(`Error generando el informe de horas:`,e),alert(`No se pudo generar el informe. Revisa la consola para el detalle.`)}finally{z.value=null}}}function Qt(e,t){if(!e||!t)return 0;let[n,r,i]=String(e).split(`T`)[0].split(`-`).map(Number),[a,o,s]=String(t).split(`T`)[0].split(`-`).map(Number);return Math.round((Date.UTC(a,o-1,s)-Date.UTC(n,r-1,i))/864e5)+1}let B=u(null),V=u([]),H=u(`periodo`);u({periodo:[],empleado:[],ccosto:[],impuestos:[]});let U=new Date().getFullYear(),W=u({fechaInicio:`${U}-01-01`,fechaFin:`${U}-12-31`}),$t=[{val:`periodo`,label:`Por Período`,icon:`mdi-calendar-range-outline`},{val:`meses`,label:`Por Mes`,icon:`mdi-calendar-month-outline`},{val:`empleado`,label:`Por Empleado`,icon:`mdi-account-group-outline`},{val:`ccosto`,label:`Por Centro de Costo`,icon:`mdi-sitemap-outline`},{val:`impuestos`,label:`Impuestos y Taxes`,icon:`mdi-receipt-text-outline`}],en=[`Enero`,`Febrero`,`Marzo`,`Abril`,`Mayo`,`Junio`,`Julio`,`Agosto`,`Septiembre`,`Octubre`,`Noviembre`,`Diciembre`];function tn(e){if(!e)return`—`;let[t,n]=String(e).split(`-`);return`${en[parseInt(n,10)-1]||n} ${t}`}let G=[`total_bruto`,`total_deducciones`,`total_aportes_er`,`total_neto`,`costo_empresa`];function K(e){let t=new Map;for(let n of e){t.has(n.mes)||t.set(n.mes,{mes:n.mes,nombre:tn(n.mes),filas:[],totales:Object.fromEntries(G.map(e=>[e,0])),dias:0,horas:0});let e=t.get(n.mes);e.filas.push(n);for(let t of G)e.totales[t]+=parseFloat(n[t]||0);e.dias+=parseFloat(n.dias_en_mes||0),e.horas+=parseFloat(n.horas_en_mes||0)}return[...t.values()]}let nn=m(()=>K(V.value)),rn=m(()=>V.value.reduce((e,t)=>e+parseFloat(t.costo_bruto||0),0)),q=m(()=>V.value.reduce((e,t)=>e+parseFloat(t.costo_total||0),0));function J(e){let t=q.value;return t>0?parseFloat(e)/t*100:0}async function Y(){I.value=!0;try{let e=F(),t=new URLSearchParams({empresa:e,fechaInicio:W.value.fechaInicio,fechaFin:W.value.fechaFin,vista:H.value}),n=await(await fetch(`${i}/nomina/reporte?${t}`)).json();if(!n.success)throw Error(n.error);B.value=n.kpis,V.value=n.data||[]}catch(e){console.error(e)}finally{I.value=!1}}async function an(e){H.value=e,await Y()}function X(e){return`$`+(parseFloat(e)||0).toLocaleString(`en-US`,{minimumFractionDigits:2,maximumFractionDigits:2})}function Z(e){return(parseFloat(e)||0).toLocaleString(`en-US`,{minimumFractionDigits:2,maximumFractionDigits:2})}function Q(e){if(!e)return`—`;let[t,n,r]=String(e).split(`T`)[0].split(`-`);return`${n}/${r}/${t}`}async function on(){if(B.value){L.value=!0;try{await $(W.value.fechaInicio,W.value.fechaFin)}finally{L.value=!1}}}async function sn(e){if(e){R.value=e.id;try{await $(String(e.semana_inicio).split(`T`)[0],String(e.semana_fin).split(`T`)[0])}finally{R.value=null}}}async function $(e,t){try{let n={empresa:F(),fechaInicio:e,fechaFin:t},r=Qt(e,t)<=7,[a,o,s,c,l]=await Promise.all([fetch(`${i}/nomina/reporte?${new URLSearchParams({...n,vista:`periodo`})}`).then(e=>e.json()),fetch(`${i}/nomina/reporte?${new URLSearchParams({...n,vista:`meses`})}`).then(e=>e.json()),fetch(`${i}/nomina/reporte?${new URLSearchParams({...n,vista:`empleado`})}`).then(e=>e.json()),fetch(`${i}/nomina/reporte?${new URLSearchParams({...n,vista:`ccosto`})}`).then(e=>e.json()),fetch(`${i}/nomina/reporte?${new URLSearchParams({...n,vista:`impuestos`})}`).then(e=>e.json())]),u=a.kpis||B.value,d=a.data||[],f=K(o.data||[]),p=s.data||[],m=c.data||[],h=l.data||[],g=m.reduce((e,t)=>e+parseFloat(t.costo_bruto||0),0),_=m.reduce((e,t)=>e+parseFloat(t.costo_total||0),0);h.reduce((e,t)=>e+parseFloat(t.total_impuestos||0),0);let v=`
      <div class="section">
        <div class="section-title">Por Período</div>
        <table>
          <thead><tr>
            <th>PERÍODO</th><th>EMPL.</th><th>BRUTO</th><th>DEDUCCIONES</th><th>APORTES ER</th><th>NETO</th><th>COSTO EMPRESA</th>
          </tr></thead>
          <tbody>
            ${d.map(e=>`<tr>
              <td>${Q(e.semana_inicio)} — ${Q(e.semana_fin)}</td>
              <td>${e.empleados}</td>
              <td>${X(e.total_bruto)}</td>
              <td class="text-red">${X(e.total_deducciones)}</td>
              <td class="text-amber">${X(e.total_aportes_er)}</td>
              <td class="text-green">${X(e.total_neto)}</td>
              <td class="text-purple">${X(e.costo_empresa)}</td>
            </tr>`).join(``)}
          </tbody>
          <tfoot><tr class="tfoot">
            <td>TOTAL</td><td>${u.total_empleados}</td>
            <td>${X(u.total_bruto)}</td>
            <td class="text-red">${X(u.total_deducciones)}</td>
            <td class="text-amber">${X(u.total_aportes_er)}</td>
            <td class="text-green">${X(u.total_neto)}</td>
            <td class="text-purple">${X(u.costo_total_empresa)}</td>
          </tr></tfoot>
        </table>
      </div>`,y=`
      <div class="section">
        <div class="section-title">Reparto por Mes</div>
        <div class="nota">Las nóminas que cruzan dos meses se reparten según las horas trabajadas en cada mes; si no hay horario cargado, por días calendario.</div>
        <table>
          <thead><tr>
            <th>MES / NÓMINA</th><th>DÍAS</th><th>HORAS</th><th>% NÓM.</th><th>BRUTO</th><th>DEDUCCIONES</th><th>APORTES ER</th><th>NETO</th><th>COSTO EMPRESA</th>
          </tr></thead>
          <tbody>
            ${f.map(e=>`
              <tr class="mes-head">
                <td>${e.nombre} <span style="font-weight:400;color:#9ca3af">(${e.filas.length} nómina${e.filas.length===1?``:`s`})</span></td>
                <td>${e.dias}</td>
                <td>${Z(e.horas)}</td>
                <td>—</td>
                <td>${X(e.totales.total_bruto)}</td>
                <td class="text-red">${X(e.totales.total_deducciones)}</td>
                <td class="text-amber">${X(e.totales.total_aportes_er)}</td>
                <td class="text-green">${X(e.totales.total_neto)}</td>
                <td class="text-purple">${X(e.totales.costo_empresa)}</td>
              </tr>
              ${e.filas.map(e=>`<tr>
                <td style="padding-left:24px">
                  ${Q(e.semana_inicio)} — ${Q(e.semana_fin)}
                  ${e.periodo_partido?`<span class="badge parcial">PARCIAL</span>`:``}
                </td>
                <td>${e.dias_en_mes}</td>
                <td>${Z(e.horas_en_mes)}</td>
                <td>${Z(e.porcentaje)}%</td>
                <td>${X(e.total_bruto)}</td>
                <td class="text-red">${X(e.total_deducciones)}</td>
                <td class="text-amber">${X(e.total_aportes_er)}</td>
                <td class="text-green">${X(e.total_neto)}</td>
                <td class="text-purple">${X(e.costo_empresa)}</td>
              </tr>`).join(``)}
            `).join(``)}
          </tbody>
          <tfoot><tr class="tfoot">
            <td colspan="4">TOTAL</td>
            <td>${X(u.total_bruto)}</td>
            <td class="text-red">${X(u.total_deducciones)}</td>
            <td class="text-amber">${X(u.total_aportes_er)}</td>
            <td class="text-green">${X(u.total_neto)}</td>
            <td class="text-purple">${X(u.costo_total_empresa)}</td>
          </tr></tfoot>
        </table>
      </div>`,b=`
      <div class="section">
        <div class="section-title">Por Empleado</div>
        <table>
          <thead><tr>
            <th>EMPLEADO</th><th>TIPO</th><th>NÓM.</th><th>HRS REG</th><th>HRS OT</th><th>BRUTO</th><th>DEDUCCIONES</th><th>APORTES ER</th><th>NETO</th><th>COSTO EMP.</th>
          </tr></thead>
          <tbody>
            ${p.map(e=>`<tr>
              <td>${e.nombre||`—`}</td>
              <td><span class="badge ${e.tipo_empleado===`W2`?`w2`:`c1099`}">${e.tipo_empleado||`—`}</span></td>
              <td>${e.total_nominas}</td>
              <td>${Z(e.horas_regulares)}</td>
              <td>${Z(e.horas_overtime)}</td>
              <td>${X(e.total_bruto)}</td>
              <td class="text-red">${X(e.total_deducciones)}</td>
              <td class="text-amber">${X(e.total_aportes_er)}</td>
              <td class="text-green">${X(e.total_neto)}</td>
              <td class="text-purple">${X(e.costo_empresa)}</td>
            </tr>`).join(``)}
          </tbody>
          <tfoot><tr class="tfoot">
            <td colspan="5">TOTAL</td>
            <td>${X(u.total_bruto)}</td>
            <td class="text-red">${X(u.total_deducciones)}</td>
            <td class="text-amber">${X(u.total_aportes_er)}</td>
            <td class="text-green">${X(u.total_neto)}</td>
            <td class="text-purple">${X(u.costo_total_empresa)}</td>
          </tr></tfoot>
        </table>
      </div>`,x=`
      <div class="section">
        <div class="section-title">Por Centro de Costo</div>
        <table>
          <thead><tr>
            <th>CENTRO DE COSTO</th><th>CÓD.</th><th>EMPL.</th><th>HORAS</th><th>COSTO BRUTO</th><th>COSTO TOTAL</th><th>% DEL TOTAL</th>
          </tr></thead>
          <tbody>
            ${m.map(e=>{let t=_>0?(parseFloat(e.costo_total)/_*100).toFixed(1):`0.0`,n=Math.max(2,Math.round(parseFloat(t)));return`<tr>
                <td>${e.ccosto_nombre}</td>
                <td>${e.ccosto}</td>
                <td>${e.empleados}</td>
                <td>${Z(e.horas)}</td>
                <td>${X(e.costo_bruto)}</td>
                <td class="text-purple">${X(e.costo_total)}</td>
                <td><span class="pct-bar" style="width:${n}px"></span> ${t}%</td>
              </tr>`}).join(``)}
          </tbody>
          <tfoot><tr class="tfoot">
            <td colspan="4">TOTAL</td>
            <td>${X(g)}</td>
            <td class="text-purple">${X(_)}</td>
            <td>100%</td>
          </tr></tfoot>
        </table>
      </div>`,S=`
      <div class="section">
        <div class="section-title">Impuestos y Taxes</div>
        <table>
          <thead><tr>
            <th>PERÍODO</th><th>FED.INC.TAX</th><th>SS EMP.</th><th>SS ER</th><th>MED.EMP.</th><th>MED.ER</th><th>FUTA</th><th>SUTA</th><th>W.COMP</th><th class="text-red">TOTAL IMP.</th>
          </tr></thead>
          <tbody>
            ${h.map(e=>`<tr>
              <td>${Q(e.semana_inicio)} — ${Q(e.semana_fin)}</td>
              <td>${X(e.federal_income_tax)}</td>
              <td>${X(e.ss_emp)}</td>
              <td>${X(e.ss_er)}</td>
              <td>${X(e.medicare_emp)}</td>
              <td>${X(e.medicare_er)}</td>
              <td>${X(e.futa)}</td>
              <td>${X(e.suta)}</td>
              <td>${X(e.workers_comp)}</td>
              <td class="text-red" style="font-weight:700">${X(e.total_impuestos)}</td>
            </tr>`).join(``)}
          </tbody>
          <tfoot><tr class="tfoot">
            <td>TOTAL</td>
            <td>${X(u.federal_income_tax)}</td>
            <td>${X(u.social_security_emp)}</td>
            <td>${X(u.social_security_er)}</td>
            <td>${X(u.medicare_emp)}</td>
            <td>${X(u.medicare_er)}</td>
            <td>${X(u.futa)}</td>
            <td>${X(u.suta)}</td>
            <td>${X(u.workers_comp)}</td>
            <td class="text-red">${X(+u.federal_income_tax+ +u.social_security_emp+ +u.social_security_er+ +u.medicare_emp+ +u.medicare_er+ +u.futa+ +u.suta+ +u.workers_comp)}</td>
          </tr></tfoot>
        </table>
      </div>`,C=`
      <div class="kpi-row">
        <div class="kpi"><div class="kpi-lbl">BRUTO PAGADO</div><div class="kpi-val">${X(u.total_bruto)}</div></div>
        <div class="kpi"><div class="kpi-lbl">DEDUCCIONES EMP.</div><div class="kpi-val text-red">${X(u.total_deducciones)}</div></div>
        <div class="kpi"><div class="kpi-lbl">NETO PAGADO</div><div class="kpi-val text-green">${X(u.total_neto)}</div></div>
        <div class="kpi"><div class="kpi-lbl">APORTES EMPLEADOR</div><div class="kpi-val text-amber">${X(u.total_aportes_er)}</div></div>
        <div class="kpi"><div class="kpi-lbl">COSTO TOTAL EMPRESA</div><div class="kpi-val text-purple">${X(u.costo_total_empresa)}</div></div>
        <div class="kpi"><div class="kpi-lbl">NÓMINAS / EMPLEADOS</div><div class="kpi-val">${u.total_nominas} / ${u.total_empleados}</div></div>
      </div>`,w=`<!DOCTYPE html><html><head><meta charset="UTF-8">
      <title>Reporte de Nómina</title>
      <style>
      * { box-sizing: border-box; margin: 0; padding: 0; }
      body { font-family: Arial, sans-serif; font-size: 11px; color: #111; padding: 24px; background: white; }
      h1 { font-size: 18px; font-weight: 900; color: #be185d; margin-bottom: 4px; }
      .sub { font-size: 11px; color: #888; margin-bottom: 20px; }
      .kpi-row { display: grid; grid-template-columns: repeat(3, 1fr); gap: 10px; margin-bottom: 28px; }
      .kpi { border: 1px solid #e5e7eb; border-radius: 8px; padding: 10px 14px; border-left: 3px solid #ec4899; }
      .kpi-lbl { font-size: 9px; font-weight: 700; text-transform: uppercase; letter-spacing: .6px; color: #9ca3af; margin-bottom: 3px; }
      .kpi-val { font-size: 15px; font-weight: 800; font-family: monospace; }
      .section { margin-bottom: 36px; }
      .section-title { font-size: 12px; font-weight: 800; text-transform: uppercase; letter-spacing: .8px; color: #be185d; border-bottom: 2px solid #ec4899; padding-bottom: 4px; margin-bottom: 10px; }
      table { width: 100%; border-collapse: collapse; font-size: 10px; }
      th { background: #fdf2f8; padding: 4px 10px; text-align: right; font-size: 9px; font-weight: 700; letter-spacing: .5px; text-transform: uppercase; color: #9ca3af; border-bottom: 1px solid #e5e7eb; }
      th:first-child { text-align: left; }
      td { padding: 4px 10px; text-align: right; border-bottom: 1px solid #f3f4f6; }
      td:first-child { text-align: left; font-weight: 500; }
      tr:nth-child(even) { background: #fafafa; }
      .tfoot td { background: #fdf2f8; font-weight: 700; font-size: 11px; border-top: 2px solid #f9a8d4; padding: 5px 10px; }
      .text-red  { color: #ef4444; }
      .text-green{ color: #22c55e; }
      .text-amber{ color: #f59e0b; }
      .text-purple{color: #8b5cf6; }
      .badge { font-size: 9px; font-weight: 700; padding: 1px 5px; border-radius: 3px; }
      .w2    { background: #ede9fe; color: #7c3aed; }
      .c1099 { background: #fef3c7; color: #b45309; }
      .parcial { background: #fef3c7; color: #b45309; margin-left: 6px; }
      .nota { font-size: 9.5px; color: #6b7280; background: #f9fafb; border: 1px solid #e5e7eb; border-radius: 5px; padding: 5px 8px; margin-bottom: 8px; }
      tr.mes-head td { background: #f5f3ff; font-weight: 700; border-top: 1.5px solid #c4b5fd; }
      tr.mes-head td:first-child { color: #6d28d9; }
      .pct-bar { height: 5px; border-radius: 3px; background: linear-gradient(90deg,#ec4899,#8b5cf6); display: inline-block; min-width: 2px; }
      @media print { body { padding: 12px; } }
    </style></head>
      <body>
        <h1>${r?`NÓMINA`:`REPORTE DE NÓMINA`}</h1>
        <div class="sub">${r?`Semana del ${Q(e)} al ${Q(t)}`:`Período: ${Q(e)} — ${Q(t)}`}</div>
        ${C}
        ${v}
        ${y}
        ${b}
        ${x}
        ${S}
      </body></html>`,T=window.open(``,`_blank`);if(!T){alert(`Activa los pop-ups para generar el PDF`);return}T.document.write(w),T.document.close(),T.focus()}catch(e){console.error(`Error generando el PDF de nómina:`,e),alert(`No se pudo generar el PDF. Revisa la consola para el detalle.`)}}return n(Y),(n,r)=>{let i=s(`CampoFecha`);return v(),y(w,null,{default:a(()=>[b(`div`,ee,[S(T,{title:`Reporte de Nómina`,description:`Análisis de costos por período, empleado, centro de costo e impuestos`,crumbs:[`Nómina`,`Reportes`,`Reporte de Nómina`]}),b(`div`,te,[b(`div`,ne,[b(`div`,re,[r[2]||=b(`div`,{class:`filter-label`},`FECHA INICIO`,-1),S(i,{modelValue:W.value.fechaInicio,"onUpdate:modelValue":r[0]||=e=>W.value.fechaInicio=e,variant:`outlined`,density:`compact`,"hide-details":``,style:{"min-width":`160px`}},null,8,[`modelValue`])]),b(`div`,ie,[r[3]||=b(`div`,{class:`filter-label`},`FECHA FIN`,-1),S(i,{modelValue:W.value.fechaFin,"onUpdate:modelValue":r[1]||=e=>W.value.fechaFin=e,variant:`outlined`,density:`compact`,"hide-details":``,style:{"min-width":`160px`}},null,8,[`modelValue`])]),S(l,{color:`secondary`,variant:`flat`,rounded:`lg`,loading:I.value,onClick:Y,height:`40`},{default:a(()=>[S(c,{start:``},{default:a(()=>[...r[4]||=[f(`mdi-magnify`,-1)]]),_:1}),r[5]||=f(`Generar Reporte `,-1)]),_:1},8,[`loading`]),S(C),B.value?(v(),y(l,{key:0,variant:`flat`,color:`secondary`,rounded:`lg`,height:`40`,loading:L.value,disabled:R.value!==null,onClick:on,title:`Informe consolidado de todo el período filtrado`},{default:a(()=>[S(c,{start:``},{default:a(()=>[...r[6]||=[f(`mdi-file-pdf-box`,-1)]]),_:1}),r[7]||=f(`Exportar todo el período `,-1)]),_:1},8,[`loading`,`disabled`])):g(``,!0)])]),I.value?(v(),y(t,{key:0,indeterminate:``,color:`secondary`,height:`3`,class:`mb-4`})):g(``,!0),B.value?(v(),h(`div`,ae,[S(E,{index:0,label:`Bruto Pagado`,value:X(B.value.total_bruto),icon:`mdi-cash-multiple`,color:`var(--indigo)`},null,8,[`value`]),S(E,{index:1,label:`Deducciones Emp.`,value:X(B.value.total_deducciones),icon:`mdi-minus-circle-outline`,color:`var(--error)`,"value-color":`var(--error)`},null,8,[`value`]),S(E,{index:2,label:`Neto Pagado`,value:X(B.value.total_neto),icon:`mdi-bank-transfer-out`,color:`var(--success)`,"value-color":`var(--success)`},null,8,[`value`]),S(E,{index:3,label:`Aportes Empleador`,value:X(B.value.total_aportes_er),icon:`mdi-office-building-outline`,color:`var(--gold)`,"value-color":`var(--gold)`},null,8,[`value`]),S(E,{index:4,label:`Costo Total Empresa`,value:X(B.value.costo_total_empresa),icon:`mdi-domain`,color:`var(--indigo)`,"value-color":`var(--indigo)`},null,8,[`value`]),S(E,{index:5,label:`Nóminas / Empleados`,value:`${B.value.total_nominas} / ${B.value.total_empleados}`,icon:`mdi-account-group-outline`,color:`var(--indigo)`,"value-color":`var(--indigo)`},null,8,[`value`])])):g(``,!0),B.value||V.value.length?(v(),h(`div`,oe,[b(`div`,se,[(v(),h(x,null,_($t,e=>b(`button`,{key:e.val,class:d([`rn-tab`,{"rn-tab--active":H.value===e.val}]),onClick:t=>an(e.val)},[S(c,{size:`15`,class:`mr-1`},{default:a(()=>[f(p(e.icon),1)]),_:2},1024),f(p(e.label),1)],10,ce)),64))]),!I.value&&V.value.length===0?(v(),h(`div`,le,[S(c,{size:`40`,color:`rgba(var(--v-theme-on-surface),.15)`,class:`mb-2`},{default:a(()=>[...r[8]||=[f(`mdi-file-search-outline`,-1)]]),_:1}),r[9]||=b(`div`,null,`No hay nóminas aprobadas en el período seleccionado`,-1)])):H.value===`periodo`&&V.value.length?(v(),h(`div`,ue,[b(`table`,de,[r[14]||=b(`thead`,null,[b(`tr`,null,[b(`th`,null,`PERÍODO`),b(`th`,{class:`ta-r`},`EMPLEADOS`),b(`th`,{class:`ta-r`},`BRUTO`),b(`th`,{class:`ta-r`},`DEDUCCIONES`),b(`th`,{class:`ta-r`},`APORTES ER`),b(`th`,{class:`ta-r`},`NETO`),b(`th`,{class:`ta-r`},`COSTO EMPRESA`),b(`th`,{class:`ta-c`},`PDF`)])],-1),b(`tbody`,null,[(v(!0),h(x,null,_(V.value,e=>(v(),h(`tr`,{key:e.id},[b(`td`,null,[b(`div`,fe,p(Q(e.semana_inicio)),1),b(`div`,pe,`al `+p(Q(e.semana_fin)),1)]),b(`td`,me,p(e.empleados),1),b(`td`,he,p(X(e.total_bruto)),1),b(`td`,ge,p(X(e.total_deducciones)),1),b(`td`,_e,p(X(e.total_aportes_er)),1),b(`td`,ve,p(X(e.total_neto)),1),b(`td`,ye,p(X(e.costo_empresa)),1),b(`td`,be,[S(l,{icon:``,variant:`text`,size:`x-small`,color:`secondary`,loading:R.value===e.id,disabled:L.value||R.value!==null&&R.value!==e.id,title:`PDF de la nómina del ${Q(e.semana_inicio)} al ${Q(e.semana_fin)}`,onClick:t=>sn(e)},{default:a(()=>[S(c,{size:`19`},{default:a(()=>[...r[10]||=[f(`mdi-file-pdf-box`,-1)]]),_:1})]),_:1},8,[`loading`,`disabled`,`title`,`onClick`]),S(l,{icon:``,variant:`text`,size:`x-small`,color:`primary`,loading:z.value===e.id,disabled:z.value!==null&&z.value!==e.id,title:`Horas trabajadas del ${Q(e.semana_inicio)} al ${Q(e.semana_fin)}`,onClick:t=>Zt(e)},{default:a(()=>[S(c,{size:`19`},{default:a(()=>[...r[11]||=[f(`mdi-clock-outline`,-1)]]),_:1})]),_:1},8,[`loading`,`disabled`,`title`,`onClick`])])]))),128))]),b(`tfoot`,null,[b(`tr`,xe,[r[12]||=b(`td`,null,[b(`strong`,null,`TOTAL`)],-1),b(`td`,D,p(B.value.total_empleados),1),b(`td`,O,p(X(B.value.total_bruto)),1),b(`td`,k,p(X(B.value.total_deducciones)),1),b(`td`,A,p(X(B.value.total_aportes_er)),1),b(`td`,j,p(X(B.value.total_neto)),1),b(`td`,M,p(X(B.value.costo_total_empresa)),1),r[13]||=b(`td`,null,null,-1)])])])])):H.value===`meses`&&V.value.length?(v(),h(`div`,Se,[b(`div`,Ce,[S(c,{size:`15`,color:`var(--indigo)`},{default:a(()=>[...r[15]||=[f(`mdi-information-outline`,-1)]]),_:1}),r[16]||=b(`span`,null,[f(` Las nóminas que cruzan dos meses se reparten entre ellos según las `),b(`strong`,null,`horas trabajadas en cada mes`),f(`. Cuando la nómina no tiene horario cargado, el reparto se hace por días calendario. `)],-1)]),b(`table`,we,[r[22]||=b(`thead`,null,[b(`tr`,null,[b(`th`,null,`MES / NÓMINA`),b(`th`,{class:`ta-r`},`DÍAS`),b(`th`,{class:`ta-r`},`HORAS`),b(`th`,{class:`ta-r`},`% NÓMINA`),b(`th`,{class:`ta-r`},`BRUTO`),b(`th`,{class:`ta-r`},`DEDUCCIONES`),b(`th`,{class:`ta-r`},`APORTES ER`),b(`th`,{class:`ta-r`},`NETO`),b(`th`,{class:`ta-r`},`COSTO EMPRESA`)])],-1),b(`tbody`,null,[(v(!0),h(x,null,_(nn.value,e=>(v(),h(x,{key:e.mes},[b(`tr`,Te,[b(`td`,null,[S(c,{size:`15`,class:`mr-1`},{default:a(()=>[...r[17]||=[f(`mdi-calendar-month-outline`,-1)]]),_:1}),b(`strong`,null,p(e.nombre),1),b(`span`,Ee,p(e.filas.length)+` nómina`+p(e.filas.length===1?``:`s`),1)]),b(`td`,De,p(e.dias),1),b(`td`,Oe,p(Z(e.horas)),1),r[18]||=b(`td`,{class:`ta-r`},`—`,-1),b(`td`,ke,p(X(e.totales.total_bruto)),1),b(`td`,Ae,p(X(e.totales.total_deducciones)),1),b(`td`,je,p(X(e.totales.total_aportes_er)),1),b(`td`,Me,p(X(e.totales.total_neto)),1),b(`td`,Ne,p(X(e.totales.costo_empresa)),1)]),(v(!0),h(x,null,_(e.filas,t=>(v(),h(`tr`,{key:e.mes+`_`+t.liquidacion_id,class:`rn-mes-detalle`},[b(`td`,null,[b(`div`,Pe,[f(p(Q(t.semana_inicio))+` — `+p(Q(t.semana_fin))+` `,1),t.periodo_partido?(v(),h(`span`,Fe,[S(c,{size:`10`},{default:a(()=>[...r[19]||=[f(`mdi-call-split`,-1)]]),_:1}),r[20]||=f(`PARCIAL `,-1)])):g(``,!0)]),b(`div`,Ie,p(t.prorrateo_por_horas?`Repartido por horas trabajadas`:`Repartido por días calendario`),1)]),b(`td`,Le,p(t.dias_en_mes),1),b(`td`,Re,p(Z(t.horas_en_mes)),1),b(`td`,ze,p(Z(t.porcentaje))+`%`,1),b(`td`,Be,p(X(t.total_bruto)),1),b(`td`,Ve,p(X(t.total_deducciones)),1),b(`td`,He,p(X(t.total_aportes_er)),1),b(`td`,Ue,p(X(t.total_neto)),1),b(`td`,We,p(X(t.costo_empresa)),1)]))),128))],64))),128))]),b(`tfoot`,null,[b(`tr`,Ge,[r[21]||=b(`td`,{colspan:`4`},[b(`strong`,null,`TOTAL`)],-1),b(`td`,Ke,p(X(B.value.total_bruto)),1),b(`td`,qe,p(X(B.value.total_deducciones)),1),b(`td`,Je,p(X(B.value.total_aportes_er)),1),b(`td`,Ye,p(X(B.value.total_neto)),1),b(`td`,Xe,p(X(B.value.costo_total_empresa)),1)])])])])):H.value===`empleado`&&V.value.length?(v(),h(`div`,Ze,[b(`table`,Qe,[r[24]||=b(`thead`,null,[b(`tr`,null,[b(`th`,null,`EMPLEADO`),b(`th`,{class:`ta-c`},`TIPO`),b(`th`,{class:`ta-r`},`NÓMINAS`),b(`th`,{class:`ta-r`},`HRS REG`),b(`th`,{class:`ta-r`},`HRS OT`),b(`th`,{class:`ta-r`},`BRUTO`),b(`th`,{class:`ta-r`},`DEDUCCIONES`),b(`th`,{class:`ta-r`},`APORTES ER`),b(`th`,{class:`ta-r`},`NETO`),b(`th`,{class:`ta-r`},`COSTO EMP.`)])],-1),b(`tbody`,null,[(v(!0),h(x,null,_(V.value,e=>(v(),h(`tr`,{key:e.empleado_id},[b(`td`,$e,p(e.nombre),1),b(`td`,et,[b(`span`,{class:d(e.tipo_empleado===`W2`?`badge-w2`:`badge-1099`)},p(e.tipo_empleado),3)]),b(`td`,tt,p(e.total_nominas),1),b(`td`,nt,p(Z(e.horas_regulares)),1),b(`td`,rt,p(Z(e.horas_overtime)),1),b(`td`,it,p(X(e.total_bruto)),1),b(`td`,at,p(X(e.total_deducciones)),1),b(`td`,ot,p(X(e.total_aportes_er)),1),b(`td`,st,p(X(e.total_neto)),1),b(`td`,ct,p(X(e.costo_empresa)),1)]))),128))]),b(`tfoot`,null,[b(`tr`,lt,[r[23]||=b(`td`,{colspan:`5`},[b(`strong`,null,`TOTAL`)],-1),b(`td`,ut,p(X(B.value.total_bruto)),1),b(`td`,dt,p(X(B.value.total_deducciones)),1),b(`td`,ft,p(X(B.value.total_aportes_er)),1),b(`td`,pt,p(X(B.value.total_neto)),1),b(`td`,mt,p(X(B.value.costo_total_empresa)),1)])])])])):H.value===`ccosto`&&V.value.length?(v(),h(`div`,ht,[b(`table`,gt,[r[27]||=b(`thead`,null,[b(`tr`,null,[b(`th`,null,`CENTRO DE COSTO`),b(`th`,{class:`ta-c`},`CÓD.`),b(`th`,{class:`ta-r`},`EMPLEADOS`),b(`th`,{class:`ta-r`},`HORAS`),b(`th`,{class:`ta-r`},`COSTO BRUTO`),b(`th`,{class:`ta-r`},`COSTO TOTAL`),b(`th`,{class:`ta-r`},`% DEL TOTAL`)])],-1),b(`tbody`,null,[(v(!0),h(x,null,_(V.value,t=>(v(),h(`tr`,{key:t.ccosto},[b(`td`,_t,p(t.ccosto_nombre),1),b(`td`,vt,p(t.ccosto),1),b(`td`,yt,p(t.empleados),1),b(`td`,bt,p(Z(t.horas)),1),b(`td`,xt,p(X(t.costo_bruto)),1),b(`td`,N,p(X(t.costo_total)),1),b(`td`,St,[b(`div`,Ct,[b(`div`,{class:`pct-bar`,style:e({width:J(t.costo_total)+`%`})},null,4),b(`span`,wt,p(J(t.costo_total).toFixed(1))+`%`,1)])])]))),128))]),b(`tfoot`,null,[b(`tr`,Tt,[r[25]||=b(`td`,{colspan:`4`},[b(`strong`,null,`TOTAL`)],-1),b(`td`,Et,p(X(rn.value)),1),b(`td`,Dt,p(X(q.value)),1),r[26]||=b(`td`,{class:`ta-r`},`100%`,-1)])])])])):H.value===`impuestos`&&V.value.length?(v(),h(`div`,Ot,[b(`table`,kt,[r[29]||=b(`thead`,null,[b(`tr`,null,[b(`th`,null,`PERÍODO`),b(`th`,{class:`ta-r`},`FED. INC. TAX`),b(`th`,{class:`ta-r`},`SS EMP.`),b(`th`,{class:`ta-r`},`SS ER`),b(`th`,{class:`ta-r`},`MEDICARE EMP.`),b(`th`,{class:`ta-r`},`MEDICARE ER`),b(`th`,{class:`ta-r`},`FUTA`),b(`th`,{class:`ta-r`},`SUTA`),b(`th`,{class:`ta-r`},`W.COMP`),b(`th`,{class:`ta-r text-error`},`TOTAL IMP.`)])],-1),b(`tbody`,null,[(v(!0),h(x,null,_(V.value,e=>(v(),h(`tr`,{key:e.semana_inicio},[b(`td`,null,[b(`div`,At,p(Q(e.semana_inicio)),1),b(`div`,jt,`al `+p(Q(e.semana_fin)),1)]),b(`td`,Mt,p(X(e.federal_income_tax)),1),b(`td`,Nt,p(X(e.ss_emp)),1),b(`td`,Pt,p(X(e.ss_er)),1),b(`td`,Ft,p(X(e.medicare_emp)),1),b(`td`,It,p(X(e.medicare_er)),1),b(`td`,Lt,p(X(e.futa)),1),b(`td`,Rt,p(X(e.suta)),1),b(`td`,zt,p(X(e.workers_comp)),1),b(`td`,Bt,p(X(e.total_impuestos)),1)]))),128))]),b(`tfoot`,null,[b(`tr`,Vt,[r[28]||=b(`td`,null,[b(`strong`,null,`TOTAL`)],-1),b(`td`,Ht,p(X(B.value.federal_income_tax)),1),b(`td`,Ut,p(X(B.value.social_security_emp)),1),b(`td`,Wt,p(X(B.value.social_security_er)),1),b(`td`,Gt,p(X(B.value.medicare_emp)),1),b(`td`,Kt,p(X(B.value.medicare_er)),1),b(`td`,qt,p(X(B.value.futa)),1),b(`td`,Jt,p(X(B.value.suta)),1),b(`td`,Yt,p(X(B.value.workers_comp)),1),b(`td`,Xt,p(X(+B.value.federal_income_tax+ +B.value.social_security_emp+ +B.value.social_security_er+ +B.value.medicare_emp+ +B.value.medicare_er+ +B.value.futa+ +B.value.suta+ +B.value.workers_comp)),1)])])])])):g(``,!0)])):g(``,!0)])]),_:1})}}},[[`__scopeId`,`data-v-fe47f92f`]]);export{P as default};