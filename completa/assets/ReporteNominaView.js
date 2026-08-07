import{p as e,t}from"./VBtn.js";import{o as n,t as r}from"./MainLayout.js";import{Jn as i,Kn as a,Ln as o,Xt as s,Yn as c,a as l,an as u,en as d,gn as f,in as p,kn as m,n as h,nn as g,o as _,on as v,rn as y,tn as b,xn as x,yn as S}from"./index.js";import{t as C}from"./VIcon.js";import{t as w}from"./VTextField.js";import{t as ee}from"./PageHeader.js";import{t as T}from"./KpiCard.js";var te={class:`rn-container`},ne={class:`rn-filters-card`},re={class:`rn-filters-row`},ie={class:`filter-group`},ae={class:`filter-group`},oe={key:1,class:`kpi-grid`},se={key:2,class:`rn-tabs-card`},ce={class:`rn-tabs-header`},le=[`onClick`],ue={key:0,class:`rn-empty`},de={key:1,class:`rn-table-wrap`},fe={class:`rn-table`},pe={class:`periodo-label`},me={class:`periodo-sub`},he={class:`ta-r`},ge={class:`ta-r font-mono`},_e={class:`ta-r font-mono text-error`},ve={class:`ta-r font-mono text-warning`},E={class:`ta-r font-mono text-success`},D={class:`ta-r font-mono text-purple`},O={class:`rn-tfoot`},k={class:`ta-r`},A={class:`ta-r font-mono`},j={class:`ta-r font-mono text-error`},M={class:`ta-r font-mono text-warning`},N={class:`ta-r font-mono text-success`},P={class:`ta-r font-mono text-purple`},F={key:2,class:`rn-table-wrap`},ye={class:`rn-nota`},be={class:`rn-table`},xe={class:`rn-mes-head`},Se={class:`mes-sub`},Ce={class:`ta-r font-mono`},we={class:`ta-r font-mono`},Te={class:`ta-r font-mono`},Ee={class:`ta-r font-mono text-error`},De={class:`ta-r font-mono text-warning`},Oe={class:`ta-r font-mono text-success`},ke={class:`ta-r font-mono text-purple`},Ae={class:`periodo-label`},je={key:0,class:`badge-partido`,title:`Esta nómina cruza dos meses: solo se muestra la parte que corresponde a este mes`},Me={class:`periodo-sub`},Ne={class:`ta-r font-mono`},Pe={class:`ta-r font-mono`},Fe={class:`ta-r font-mono`},Ie={class:`ta-r font-mono`},Le={class:`ta-r font-mono text-error`},Re={class:`ta-r font-mono text-warning`},ze={class:`ta-r font-mono text-success`},Be={class:`ta-r font-mono text-purple`},Ve={class:`rn-tfoot`},He={class:`ta-r font-mono`},Ue={class:`ta-r font-mono text-error`},We={class:`ta-r font-mono text-warning`},Ge={class:`ta-r font-mono text-success`},Ke={class:`ta-r font-mono text-purple`},qe={key:3,class:`rn-table-wrap`},Je={class:`rn-table`},Ye={class:`font-weight-medium`},Xe={class:`ta-c`},Ze={class:`ta-r`},Qe={class:`ta-r font-mono`},$e={class:`ta-r font-mono`},et={class:`ta-r font-mono`},tt={class:`ta-r font-mono text-error`},nt={class:`ta-r font-mono text-warning`},rt={class:`ta-r font-mono text-success`},it={class:`ta-r font-mono text-purple`},at={class:`rn-tfoot`},ot={class:`ta-r font-mono`},st={class:`ta-r font-mono text-error`},ct={class:`ta-r font-mono text-warning`},lt={class:`ta-r font-mono text-success`},ut={class:`ta-r font-mono text-purple`},dt={key:4,class:`rn-table-wrap`},ft={class:`rn-table`},pt={class:`font-weight-medium`},mt={class:`ta-c text-caption font-mono`,style:{color:`rgba(var(--v-theme-on-surface),.5)`}},ht={class:`ta-r`},I={class:`ta-r font-mono`},gt={class:`ta-r font-mono`},_t={class:`ta-r font-mono text-purple`},vt={class:`ta-r`},yt={class:`pct-bar-wrap`},bt={class:`pct-label`},xt={class:`rn-tfoot`},St={class:`ta-r font-mono`},Ct={class:`ta-r font-mono text-purple`},wt={key:5,class:`rn-table-wrap`},Tt={class:`rn-table`},Et={class:`periodo-label`},Dt={class:`periodo-sub`},Ot={class:`ta-r font-mono`},kt={class:`ta-r font-mono`},At={class:`ta-r font-mono`},jt={class:`ta-r font-mono`},Mt={class:`ta-r font-mono`},Nt={class:`ta-r font-mono`},Pt={class:`ta-r font-mono`},Ft={class:`ta-r font-mono`},It={class:`ta-r font-mono text-error font-weight-bold`},Lt={class:`rn-tfoot`},Rt={class:`ta-r font-mono`},zt={class:`ta-r font-mono`},Bt={class:`ta-r font-mono`},Vt={class:`ta-r font-mono`},Ht={class:`ta-r font-mono`},Ut={class:`ta-r font-mono`},Wt={class:`ta-r font-mono`},Gt={class:`ta-r font-mono`},Kt={class:`ta-r font-mono text-error font-weight-bold`},L=h({__name:`ReporteNominaView`,setup(h){let L=l(),R=()=>L.empresaCodigo||L.empresa||localStorage.getItem(`empresaActual`),z=o(!1),B=o(!1),V=o(null),H=o([]),U=o(`periodo`);o({periodo:[],empleado:[],ccosto:[],impuestos:[]});let W=new Date().getFullYear(),G=o({fechaInicio:`${W}-01-01`,fechaFin:`${W}-12-31`}),qt=[{val:`periodo`,label:`Por Período`,icon:`mdi-calendar-range-outline`},{val:`meses`,label:`Por Mes`,icon:`mdi-calendar-month-outline`},{val:`empleado`,label:`Por Empleado`,icon:`mdi-account-group-outline`},{val:`ccosto`,label:`Por Centro de Costo`,icon:`mdi-sitemap-outline`},{val:`impuestos`,label:`Impuestos y Taxes`,icon:`mdi-receipt-text-outline`}],Jt=[`Enero`,`Febrero`,`Marzo`,`Abril`,`Mayo`,`Junio`,`Julio`,`Agosto`,`Septiembre`,`Octubre`,`Noviembre`,`Diciembre`];function Yt(e){if(!e)return`—`;let[t,n]=String(e).split(`-`);return`${Jt[parseInt(n,10)-1]||n} ${t}`}let K=[`total_bruto`,`total_deducciones`,`total_aportes_er`,`total_neto`,`costo_empresa`];function q(e){let t=new Map;for(let n of e){t.has(n.mes)||t.set(n.mes,{mes:n.mes,nombre:Yt(n.mes),filas:[],totales:Object.fromEntries(K.map(e=>[e,0])),dias:0,horas:0});let e=t.get(n.mes);e.filas.push(n);for(let t of K)e.totales[t]+=parseFloat(n[t]||0);e.dias+=parseFloat(n.dias_en_mes||0),e.horas+=parseFloat(n.horas_en_mes||0)}return[...t.values()]}let Xt=d(()=>q(H.value)),Zt=d(()=>H.value.reduce((e,t)=>e+parseFloat(t.costo_bruto||0),0)),J=d(()=>H.value.reduce((e,t)=>e+parseFloat(t.costo_total||0),0));function Y(e){let t=J.value;return t>0?parseFloat(e)/t*100:0}async function X(){z.value=!0;try{let e=R(),t=new URLSearchParams({empresa:e,fechaInicio:G.value.fechaInicio,fechaFin:G.value.fechaFin,vista:U.value}),n=await(await fetch(`${_}/nomina/reporte?${t}`)).json();if(!n.success)throw Error(n.error);V.value=n.kpis,H.value=n.data||[]}catch(e){console.error(e)}finally{z.value=!1}}async function Qt(e){U.value=e,await X()}function Z(e){return`$`+(parseFloat(e)||0).toLocaleString(`en-US`,{minimumFractionDigits:2,maximumFractionDigits:2})}function Q(e){return(parseFloat(e)||0).toLocaleString(`en-US`,{minimumFractionDigits:2,maximumFractionDigits:2})}function $(e){if(!e)return`—`;let[t,n,r]=String(e).split(`T`)[0].split(`-`);return`${n}/${r}/${t}`}async function $t(){if(V.value){B.value=!0;try{let e={empresa:R(),fechaInicio:G.value.fechaInicio,fechaFin:G.value.fechaFin},[t,n,r,i,a]=await Promise.all([fetch(`${_}/nomina/reporte?${new URLSearchParams({...e,vista:`periodo`})}`).then(e=>e.json()),fetch(`${_}/nomina/reporte?${new URLSearchParams({...e,vista:`meses`})}`).then(e=>e.json()),fetch(`${_}/nomina/reporte?${new URLSearchParams({...e,vista:`empleado`})}`).then(e=>e.json()),fetch(`${_}/nomina/reporte?${new URLSearchParams({...e,vista:`ccosto`})}`).then(e=>e.json()),fetch(`${_}/nomina/reporte?${new URLSearchParams({...e,vista:`impuestos`})}`).then(e=>e.json())]),o=V.value,s=t.data||[],c=q(n.data||[]),l=r.data||[],u=i.data||[],d=a.data||[],f=u.reduce((e,t)=>e+parseFloat(t.costo_bruto||0),0),p=u.reduce((e,t)=>e+parseFloat(t.costo_total||0),0);d.reduce((e,t)=>e+parseFloat(t.total_impuestos||0),0);let m=`
      <div class="section">
        <div class="section-title">Por Período</div>
        <table>
          <thead><tr>
            <th>PERÍODO</th><th>EMPL.</th><th>BRUTO</th><th>DEDUCCIONES</th><th>APORTES ER</th><th>NETO</th><th>COSTO EMPRESA</th>
          </tr></thead>
          <tbody>
            ${s.map(e=>`<tr>
              <td>${$(e.semana_inicio)} — ${$(e.semana_fin)}</td>
              <td>${e.empleados}</td>
              <td>${Z(e.total_bruto)}</td>
              <td class="text-red">${Z(e.total_deducciones)}</td>
              <td class="text-amber">${Z(e.total_aportes_er)}</td>
              <td class="text-green">${Z(e.total_neto)}</td>
              <td class="text-purple">${Z(e.costo_empresa)}</td>
            </tr>`).join(``)}
          </tbody>
          <tfoot><tr class="tfoot">
            <td>TOTAL</td><td>${o.total_empleados}</td>
            <td>${Z(o.total_bruto)}</td>
            <td class="text-red">${Z(o.total_deducciones)}</td>
            <td class="text-amber">${Z(o.total_aportes_er)}</td>
            <td class="text-green">${Z(o.total_neto)}</td>
            <td class="text-purple">${Z(o.costo_total_empresa)}</td>
          </tr></tfoot>
        </table>
      </div>`,h=`
      <div class="section">
        <div class="section-title">Reparto por Mes</div>
        <div class="nota">Las nóminas que cruzan dos meses se reparten según las horas trabajadas en cada mes; si no hay horario cargado, por días calendario.</div>
        <table>
          <thead><tr>
            <th>MES / NÓMINA</th><th>DÍAS</th><th>HORAS</th><th>% NÓM.</th><th>BRUTO</th><th>DEDUCCIONES</th><th>APORTES ER</th><th>NETO</th><th>COSTO EMPRESA</th>
          </tr></thead>
          <tbody>
            ${c.map(e=>`
              <tr class="mes-head">
                <td>${e.nombre} <span style="font-weight:400;color:#9ca3af">(${e.filas.length} nómina${e.filas.length===1?``:`s`})</span></td>
                <td>${e.dias}</td>
                <td>${Q(e.horas)}</td>
                <td>—</td>
                <td>${Z(e.totales.total_bruto)}</td>
                <td class="text-red">${Z(e.totales.total_deducciones)}</td>
                <td class="text-amber">${Z(e.totales.total_aportes_er)}</td>
                <td class="text-green">${Z(e.totales.total_neto)}</td>
                <td class="text-purple">${Z(e.totales.costo_empresa)}</td>
              </tr>
              ${e.filas.map(e=>`<tr>
                <td style="padding-left:24px">
                  ${$(e.semana_inicio)} — ${$(e.semana_fin)}
                  ${e.periodo_partido?`<span class="badge parcial">PARCIAL</span>`:``}
                </td>
                <td>${e.dias_en_mes}</td>
                <td>${Q(e.horas_en_mes)}</td>
                <td>${Q(e.porcentaje)}%</td>
                <td>${Z(e.total_bruto)}</td>
                <td class="text-red">${Z(e.total_deducciones)}</td>
                <td class="text-amber">${Z(e.total_aportes_er)}</td>
                <td class="text-green">${Z(e.total_neto)}</td>
                <td class="text-purple">${Z(e.costo_empresa)}</td>
              </tr>`).join(``)}
            `).join(``)}
          </tbody>
          <tfoot><tr class="tfoot">
            <td colspan="4">TOTAL</td>
            <td>${Z(o.total_bruto)}</td>
            <td class="text-red">${Z(o.total_deducciones)}</td>
            <td class="text-amber">${Z(o.total_aportes_er)}</td>
            <td class="text-green">${Z(o.total_neto)}</td>
            <td class="text-purple">${Z(o.costo_total_empresa)}</td>
          </tr></tfoot>
        </table>
      </div>`,g=`
      <div class="section">
        <div class="section-title">Por Empleado</div>
        <table>
          <thead><tr>
            <th>EMPLEADO</th><th>TIPO</th><th>NÓM.</th><th>HRS REG</th><th>HRS OT</th><th>BRUTO</th><th>DEDUCCIONES</th><th>APORTES ER</th><th>NETO</th><th>COSTO EMP.</th>
          </tr></thead>
          <tbody>
            ${l.map(e=>`<tr>
              <td>${e.nombre||`—`}</td>
              <td><span class="badge ${e.tipo_empleado===`W2`?`w2`:`c1099`}">${e.tipo_empleado||`—`}</span></td>
              <td>${e.total_nominas}</td>
              <td>${Q(e.horas_regulares)}</td>
              <td>${Q(e.horas_overtime)}</td>
              <td>${Z(e.total_bruto)}</td>
              <td class="text-red">${Z(e.total_deducciones)}</td>
              <td class="text-amber">${Z(e.total_aportes_er)}</td>
              <td class="text-green">${Z(e.total_neto)}</td>
              <td class="text-purple">${Z(e.costo_empresa)}</td>
            </tr>`).join(``)}
          </tbody>
          <tfoot><tr class="tfoot">
            <td colspan="5">TOTAL</td>
            <td>${Z(o.total_bruto)}</td>
            <td class="text-red">${Z(o.total_deducciones)}</td>
            <td class="text-amber">${Z(o.total_aportes_er)}</td>
            <td class="text-green">${Z(o.total_neto)}</td>
            <td class="text-purple">${Z(o.costo_total_empresa)}</td>
          </tr></tfoot>
        </table>
      </div>`,v=`
      <div class="section">
        <div class="section-title">Por Centro de Costo</div>
        <table>
          <thead><tr>
            <th>CENTRO DE COSTO</th><th>CÓD.</th><th>EMPL.</th><th>HORAS</th><th>COSTO BRUTO</th><th>COSTO TOTAL</th><th>% DEL TOTAL</th>
          </tr></thead>
          <tbody>
            ${u.map(e=>{let t=p>0?(parseFloat(e.costo_total)/p*100).toFixed(1):`0.0`,n=Math.max(2,Math.round(parseFloat(t)));return`<tr>
                <td>${e.ccosto_nombre}</td>
                <td>${e.ccosto}</td>
                <td>${e.empleados}</td>
                <td>${Q(e.horas)}</td>
                <td>${Z(e.costo_bruto)}</td>
                <td class="text-purple">${Z(e.costo_total)}</td>
                <td><span class="pct-bar" style="width:${n}px"></span> ${t}%</td>
              </tr>`}).join(``)}
          </tbody>
          <tfoot><tr class="tfoot">
            <td colspan="4">TOTAL</td>
            <td>${Z(f)}</td>
            <td class="text-purple">${Z(p)}</td>
            <td>100%</td>
          </tr></tfoot>
        </table>
      </div>`,y=`
      <div class="section">
        <div class="section-title">Impuestos y Taxes</div>
        <table>
          <thead><tr>
            <th>PERÍODO</th><th>FED.INC.TAX</th><th>SS EMP.</th><th>SS ER</th><th>MED.EMP.</th><th>MED.ER</th><th>FUTA</th><th>SUTA</th><th>W.COMP</th><th class="text-red">TOTAL IMP.</th>
          </tr></thead>
          <tbody>
            ${d.map(e=>`<tr>
              <td>${$(e.semana_inicio)} — ${$(e.semana_fin)}</td>
              <td>${Z(e.federal_income_tax)}</td>
              <td>${Z(e.ss_emp)}</td>
              <td>${Z(e.ss_er)}</td>
              <td>${Z(e.medicare_emp)}</td>
              <td>${Z(e.medicare_er)}</td>
              <td>${Z(e.futa)}</td>
              <td>${Z(e.suta)}</td>
              <td>${Z(e.workers_comp)}</td>
              <td class="text-red" style="font-weight:700">${Z(e.total_impuestos)}</td>
            </tr>`).join(``)}
          </tbody>
          <tfoot><tr class="tfoot">
            <td>TOTAL</td>
            <td>${Z(o.federal_income_tax)}</td>
            <td>${Z(o.social_security_emp)}</td>
            <td>${Z(o.social_security_er)}</td>
            <td>${Z(o.medicare_emp)}</td>
            <td>${Z(o.medicare_er)}</td>
            <td>${Z(o.futa)}</td>
            <td>${Z(o.suta)}</td>
            <td>${Z(o.workers_comp)}</td>
            <td class="text-red">${Z(+o.federal_income_tax+ +o.social_security_emp+ +o.social_security_er+ +o.medicare_emp+ +o.medicare_er+ +o.futa+ +o.suta+ +o.workers_comp)}</td>
          </tr></tfoot>
        </table>
      </div>`,b=`
      <div class="kpi-row">
        <div class="kpi"><div class="kpi-lbl">BRUTO PAGADO</div><div class="kpi-val">${Z(o.total_bruto)}</div></div>
        <div class="kpi"><div class="kpi-lbl">DEDUCCIONES EMP.</div><div class="kpi-val text-red">${Z(o.total_deducciones)}</div></div>
        <div class="kpi"><div class="kpi-lbl">NETO PAGADO</div><div class="kpi-val text-green">${Z(o.total_neto)}</div></div>
        <div class="kpi"><div class="kpi-lbl">APORTES EMPLEADOR</div><div class="kpi-val text-amber">${Z(o.total_aportes_er)}</div></div>
        <div class="kpi"><div class="kpi-lbl">COSTO TOTAL EMPRESA</div><div class="kpi-val text-purple">${Z(o.costo_total_empresa)}</div></div>
        <div class="kpi"><div class="kpi-lbl">NÓMINAS / EMPLEADOS</div><div class="kpi-val">${o.total_nominas} / ${o.total_empleados}</div></div>
      </div>`,x=`<!DOCTYPE html><html><head><meta charset="UTF-8">
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
        <h1>REPORTE DE NÓMINA</h1>
        <div class="sub">Período: ${$(G.value.fechaInicio)} — ${$(G.value.fechaFin)}</div>
        ${b}
        ${m}
        ${h}
        ${g}
        ${v}
        ${y}
      </body></html>`,S=window.open(``,`_blank`);if(!S){alert(`Activa los pop-ups para generar el PDF`);return}S.document.write(x),S.document.close(),S.focus()}catch(e){console.error(e)}finally{B.value=!1}}}return f(X),(o,l)=>(S(),g(r,null,{default:m(()=>[b(`div`,te,[v(ee,{title:`Reporte de Nómina`,description:`Análisis de costos por período, empleado, centro de costo e impuestos`,crumbs:[`Nómina`,`Reportes`,`Reporte de Nómina`]}),b(`div`,ne,[b(`div`,re,[b(`div`,ie,[l[2]||=b(`div`,{class:`filter-label`},`FECHA INICIO`,-1),v(w,{modelValue:G.value.fechaInicio,"onUpdate:modelValue":l[0]||=e=>G.value.fechaInicio=e,type:`date`,variant:`outlined`,density:`compact`,"hide-details":``,style:{"min-width":`160px`}},null,8,[`modelValue`])]),b(`div`,ae,[l[3]||=b(`div`,{class:`filter-label`},`FECHA FIN`,-1),v(w,{modelValue:G.value.fechaFin,"onUpdate:modelValue":l[1]||=e=>G.value.fechaFin=e,type:`date`,variant:`outlined`,density:`compact`,"hide-details":``,style:{"min-width":`160px`}},null,8,[`modelValue`])]),v(t,{color:`secondary`,variant:`flat`,rounded:`lg`,loading:z.value,onClick:X,height:`40`},{default:m(()=>[v(C,{start:``},{default:m(()=>[...l[4]||=[u(`mdi-magnify`,-1)]]),_:1}),l[5]||=u(`Generar Reporte `,-1)]),_:1},8,[`loading`]),v(n),V.value?(S(),g(t,{key:0,variant:`flat`,color:`secondary`,rounded:`lg`,height:`40`,loading:B.value,onClick:$t},{default:m(()=>[v(C,{start:``},{default:m(()=>[...l[6]||=[u(`mdi-file-pdf-box`,-1)]]),_:1}),l[7]||=u(`Exportar PDF `,-1)]),_:1},8,[`loading`])):y(``,!0)])]),z.value?(S(),g(e,{key:0,indeterminate:``,color:`secondary`,height:`3`,class:`mb-4`})):y(``,!0),V.value?(S(),p(`div`,oe,[v(T,{index:0,label:`Bruto Pagado`,value:Z(V.value.total_bruto),icon:`mdi-cash-multiple`,color:`var(--indigo)`},null,8,[`value`]),v(T,{index:1,label:`Deducciones Emp.`,value:Z(V.value.total_deducciones),icon:`mdi-minus-circle-outline`,color:`var(--error)`,"value-color":`var(--error)`},null,8,[`value`]),v(T,{index:2,label:`Neto Pagado`,value:Z(V.value.total_neto),icon:`mdi-bank-transfer-out`,color:`var(--success)`,"value-color":`var(--success)`},null,8,[`value`]),v(T,{index:3,label:`Aportes Empleador`,value:Z(V.value.total_aportes_er),icon:`mdi-office-building-outline`,color:`var(--gold)`,"value-color":`var(--gold)`},null,8,[`value`]),v(T,{index:4,label:`Costo Total Empresa`,value:Z(V.value.costo_total_empresa),icon:`mdi-domain`,color:`var(--indigo)`,"value-color":`var(--indigo)`},null,8,[`value`]),v(T,{index:5,label:`Nóminas / Empleados`,value:`${V.value.total_nominas} / ${V.value.total_empleados}`,icon:`mdi-account-group-outline`,color:`var(--indigo)`,"value-color":`var(--indigo)`},null,8,[`value`])])):y(``,!0),V.value||H.value.length?(S(),p(`div`,se,[b(`div`,ce,[(S(),p(s,null,x(qt,e=>b(`button`,{key:e.val,class:a([`rn-tab`,{"rn-tab--active":U.value===e.val}]),onClick:t=>Qt(e.val)},[v(C,{size:`15`,class:`mr-1`},{default:m(()=>[u(c(e.icon),1)]),_:2},1024),u(c(e.label),1)],10,le)),64))]),!z.value&&H.value.length===0?(S(),p(`div`,ue,[v(C,{size:`40`,color:`rgba(var(--v-theme-on-surface),.15)`,class:`mb-2`},{default:m(()=>[...l[8]||=[u(`mdi-file-search-outline`,-1)]]),_:1}),l[9]||=b(`div`,null,`No hay nóminas aprobadas en el período seleccionado`,-1)])):U.value===`periodo`&&H.value.length?(S(),p(`div`,de,[b(`table`,fe,[l[11]||=b(`thead`,null,[b(`tr`,null,[b(`th`,null,`PERÍODO`),b(`th`,{class:`ta-r`},`EMPLEADOS`),b(`th`,{class:`ta-r`},`BRUTO`),b(`th`,{class:`ta-r`},`DEDUCCIONES`),b(`th`,{class:`ta-r`},`APORTES ER`),b(`th`,{class:`ta-r`},`NETO`),b(`th`,{class:`ta-r`},`COSTO EMPRESA`)])],-1),b(`tbody`,null,[(S(!0),p(s,null,x(H.value,e=>(S(),p(`tr`,{key:e.id},[b(`td`,null,[b(`div`,pe,c($(e.semana_inicio)),1),b(`div`,me,`al `+c($(e.semana_fin)),1)]),b(`td`,he,c(e.empleados),1),b(`td`,ge,c(Z(e.total_bruto)),1),b(`td`,_e,c(Z(e.total_deducciones)),1),b(`td`,ve,c(Z(e.total_aportes_er)),1),b(`td`,E,c(Z(e.total_neto)),1),b(`td`,D,c(Z(e.costo_empresa)),1)]))),128))]),b(`tfoot`,null,[b(`tr`,O,[l[10]||=b(`td`,null,[b(`strong`,null,`TOTAL`)],-1),b(`td`,k,c(V.value.total_empleados),1),b(`td`,A,c(Z(V.value.total_bruto)),1),b(`td`,j,c(Z(V.value.total_deducciones)),1),b(`td`,M,c(Z(V.value.total_aportes_er)),1),b(`td`,N,c(Z(V.value.total_neto)),1),b(`td`,P,c(Z(V.value.costo_total_empresa)),1)])])])])):U.value===`meses`&&H.value.length?(S(),p(`div`,F,[b(`div`,ye,[v(C,{size:`15`,color:`var(--indigo)`},{default:m(()=>[...l[12]||=[u(`mdi-information-outline`,-1)]]),_:1}),l[13]||=b(`span`,null,[u(` Las nóminas que cruzan dos meses se reparten entre ellos según las `),b(`strong`,null,`horas trabajadas en cada mes`),u(`. Cuando la nómina no tiene horario cargado, el reparto se hace por días calendario. `)],-1)]),b(`table`,be,[l[19]||=b(`thead`,null,[b(`tr`,null,[b(`th`,null,`MES / NÓMINA`),b(`th`,{class:`ta-r`},`DÍAS`),b(`th`,{class:`ta-r`},`HORAS`),b(`th`,{class:`ta-r`},`% NÓMINA`),b(`th`,{class:`ta-r`},`BRUTO`),b(`th`,{class:`ta-r`},`DEDUCCIONES`),b(`th`,{class:`ta-r`},`APORTES ER`),b(`th`,{class:`ta-r`},`NETO`),b(`th`,{class:`ta-r`},`COSTO EMPRESA`)])],-1),b(`tbody`,null,[(S(!0),p(s,null,x(Xt.value,e=>(S(),p(s,{key:e.mes},[b(`tr`,xe,[b(`td`,null,[v(C,{size:`15`,class:`mr-1`},{default:m(()=>[...l[14]||=[u(`mdi-calendar-month-outline`,-1)]]),_:1}),b(`strong`,null,c(e.nombre),1),b(`span`,Se,c(e.filas.length)+` nómina`+c(e.filas.length===1?``:`s`),1)]),b(`td`,Ce,c(e.dias),1),b(`td`,we,c(Q(e.horas)),1),l[15]||=b(`td`,{class:`ta-r`},`—`,-1),b(`td`,Te,c(Z(e.totales.total_bruto)),1),b(`td`,Ee,c(Z(e.totales.total_deducciones)),1),b(`td`,De,c(Z(e.totales.total_aportes_er)),1),b(`td`,Oe,c(Z(e.totales.total_neto)),1),b(`td`,ke,c(Z(e.totales.costo_empresa)),1)]),(S(!0),p(s,null,x(e.filas,t=>(S(),p(`tr`,{key:e.mes+`_`+t.liquidacion_id,class:`rn-mes-detalle`},[b(`td`,null,[b(`div`,Ae,[u(c($(t.semana_inicio))+` — `+c($(t.semana_fin))+` `,1),t.periodo_partido?(S(),p(`span`,je,[v(C,{size:`10`},{default:m(()=>[...l[16]||=[u(`mdi-call-split`,-1)]]),_:1}),l[17]||=u(`PARCIAL `,-1)])):y(``,!0)]),b(`div`,Me,c(t.prorrateo_por_horas?`Repartido por horas trabajadas`:`Repartido por días calendario`),1)]),b(`td`,Ne,c(t.dias_en_mes),1),b(`td`,Pe,c(Q(t.horas_en_mes)),1),b(`td`,Fe,c(Q(t.porcentaje))+`%`,1),b(`td`,Ie,c(Z(t.total_bruto)),1),b(`td`,Le,c(Z(t.total_deducciones)),1),b(`td`,Re,c(Z(t.total_aportes_er)),1),b(`td`,ze,c(Z(t.total_neto)),1),b(`td`,Be,c(Z(t.costo_empresa)),1)]))),128))],64))),128))]),b(`tfoot`,null,[b(`tr`,Ve,[l[18]||=b(`td`,{colspan:`4`},[b(`strong`,null,`TOTAL`)],-1),b(`td`,He,c(Z(V.value.total_bruto)),1),b(`td`,Ue,c(Z(V.value.total_deducciones)),1),b(`td`,We,c(Z(V.value.total_aportes_er)),1),b(`td`,Ge,c(Z(V.value.total_neto)),1),b(`td`,Ke,c(Z(V.value.costo_total_empresa)),1)])])])])):U.value===`empleado`&&H.value.length?(S(),p(`div`,qe,[b(`table`,Je,[l[21]||=b(`thead`,null,[b(`tr`,null,[b(`th`,null,`EMPLEADO`),b(`th`,{class:`ta-c`},`TIPO`),b(`th`,{class:`ta-r`},`NÓMINAS`),b(`th`,{class:`ta-r`},`HRS REG`),b(`th`,{class:`ta-r`},`HRS OT`),b(`th`,{class:`ta-r`},`BRUTO`),b(`th`,{class:`ta-r`},`DEDUCCIONES`),b(`th`,{class:`ta-r`},`APORTES ER`),b(`th`,{class:`ta-r`},`NETO`),b(`th`,{class:`ta-r`},`COSTO EMP.`)])],-1),b(`tbody`,null,[(S(!0),p(s,null,x(H.value,e=>(S(),p(`tr`,{key:e.empleado_id},[b(`td`,Ye,c(e.nombre),1),b(`td`,Xe,[b(`span`,{class:a(e.tipo_empleado===`W2`?`badge-w2`:`badge-1099`)},c(e.tipo_empleado),3)]),b(`td`,Ze,c(e.total_nominas),1),b(`td`,Qe,c(Q(e.horas_regulares)),1),b(`td`,$e,c(Q(e.horas_overtime)),1),b(`td`,et,c(Z(e.total_bruto)),1),b(`td`,tt,c(Z(e.total_deducciones)),1),b(`td`,nt,c(Z(e.total_aportes_er)),1),b(`td`,rt,c(Z(e.total_neto)),1),b(`td`,it,c(Z(e.costo_empresa)),1)]))),128))]),b(`tfoot`,null,[b(`tr`,at,[l[20]||=b(`td`,{colspan:`5`},[b(`strong`,null,`TOTAL`)],-1),b(`td`,ot,c(Z(V.value.total_bruto)),1),b(`td`,st,c(Z(V.value.total_deducciones)),1),b(`td`,ct,c(Z(V.value.total_aportes_er)),1),b(`td`,lt,c(Z(V.value.total_neto)),1),b(`td`,ut,c(Z(V.value.costo_total_empresa)),1)])])])])):U.value===`ccosto`&&H.value.length?(S(),p(`div`,dt,[b(`table`,ft,[l[24]||=b(`thead`,null,[b(`tr`,null,[b(`th`,null,`CENTRO DE COSTO`),b(`th`,{class:`ta-c`},`CÓD.`),b(`th`,{class:`ta-r`},`EMPLEADOS`),b(`th`,{class:`ta-r`},`HORAS`),b(`th`,{class:`ta-r`},`COSTO BRUTO`),b(`th`,{class:`ta-r`},`COSTO TOTAL`),b(`th`,{class:`ta-r`},`% DEL TOTAL`)])],-1),b(`tbody`,null,[(S(!0),p(s,null,x(H.value,e=>(S(),p(`tr`,{key:e.ccosto},[b(`td`,pt,c(e.ccosto_nombre),1),b(`td`,mt,c(e.ccosto),1),b(`td`,ht,c(e.empleados),1),b(`td`,I,c(Q(e.horas)),1),b(`td`,gt,c(Z(e.costo_bruto)),1),b(`td`,_t,c(Z(e.costo_total)),1),b(`td`,vt,[b(`div`,yt,[b(`div`,{class:`pct-bar`,style:i({width:Y(e.costo_total)+`%`})},null,4),b(`span`,bt,c(Y(e.costo_total).toFixed(1))+`%`,1)])])]))),128))]),b(`tfoot`,null,[b(`tr`,xt,[l[22]||=b(`td`,{colspan:`4`},[b(`strong`,null,`TOTAL`)],-1),b(`td`,St,c(Z(Zt.value)),1),b(`td`,Ct,c(Z(J.value)),1),l[23]||=b(`td`,{class:`ta-r`},`100%`,-1)])])])])):U.value===`impuestos`&&H.value.length?(S(),p(`div`,wt,[b(`table`,Tt,[l[26]||=b(`thead`,null,[b(`tr`,null,[b(`th`,null,`PERÍODO`),b(`th`,{class:`ta-r`},`FED. INC. TAX`),b(`th`,{class:`ta-r`},`SS EMP.`),b(`th`,{class:`ta-r`},`SS ER`),b(`th`,{class:`ta-r`},`MEDICARE EMP.`),b(`th`,{class:`ta-r`},`MEDICARE ER`),b(`th`,{class:`ta-r`},`FUTA`),b(`th`,{class:`ta-r`},`SUTA`),b(`th`,{class:`ta-r`},`W.COMP`),b(`th`,{class:`ta-r text-error`},`TOTAL IMP.`)])],-1),b(`tbody`,null,[(S(!0),p(s,null,x(H.value,e=>(S(),p(`tr`,{key:e.semana_inicio},[b(`td`,null,[b(`div`,Et,c($(e.semana_inicio)),1),b(`div`,Dt,`al `+c($(e.semana_fin)),1)]),b(`td`,Ot,c(Z(e.federal_income_tax)),1),b(`td`,kt,c(Z(e.ss_emp)),1),b(`td`,At,c(Z(e.ss_er)),1),b(`td`,jt,c(Z(e.medicare_emp)),1),b(`td`,Mt,c(Z(e.medicare_er)),1),b(`td`,Nt,c(Z(e.futa)),1),b(`td`,Pt,c(Z(e.suta)),1),b(`td`,Ft,c(Z(e.workers_comp)),1),b(`td`,It,c(Z(e.total_impuestos)),1)]))),128))]),b(`tfoot`,null,[b(`tr`,Lt,[l[25]||=b(`td`,null,[b(`strong`,null,`TOTAL`)],-1),b(`td`,Rt,c(Z(V.value.federal_income_tax)),1),b(`td`,zt,c(Z(V.value.social_security_emp)),1),b(`td`,Bt,c(Z(V.value.social_security_er)),1),b(`td`,Vt,c(Z(V.value.medicare_emp)),1),b(`td`,Ht,c(Z(V.value.medicare_er)),1),b(`td`,Ut,c(Z(V.value.futa)),1),b(`td`,Wt,c(Z(V.value.suta)),1),b(`td`,Gt,c(Z(V.value.workers_comp)),1),b(`td`,Kt,c(Z(+V.value.federal_income_tax+ +V.value.social_security_emp+ +V.value.social_security_er+ +V.value.medicare_emp+ +V.value.medicare_er+ +V.value.futa+ +V.value.suta+ +V.value.workers_comp)),1)])])])])):y(``,!0)])):y(``,!0)])]),_:1}))}},[[`__scopeId`,`data-v-1d16877f`]]);export{L as default};