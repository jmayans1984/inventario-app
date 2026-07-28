import{p as e,t}from"./VBtn.js";import{o as n,t as r}from"./MainLayout.js";import{Jn as i,Kn as a,Ln as o,Xt as s,Yn as c,a as l,an as u,en as d,gn as f,in as p,kn as m,n as h,nn as g,o as _,on as v,rn as y,tn as b,xn as x,yn as S}from"./index.js";import{t as C}from"./VIcon.js";import{t as w}from"./VTextField.js";import{t as ee}from"./PageHeader.js";import{t as T}from"./KpiCard.js";var te={class:`rn-container`},ne={class:`rn-filters-card`},re={class:`rn-filters-row`},ie={class:`filter-group`},ae={class:`filter-group`},oe={key:1,class:`kpi-grid`},se={key:2,class:`rn-tabs-card`},ce={class:`rn-tabs-header`},le=[`onClick`],ue={key:0,class:`rn-empty`},de={key:1,class:`rn-table-wrap`},fe={class:`rn-table`},pe={class:`periodo-label`},me={class:`periodo-sub`},he={class:`ta-r`},ge={class:`ta-r font-mono`},E={class:`ta-r font-mono text-error`},D={class:`ta-r font-mono text-warning`},O={class:`ta-r font-mono text-success`},k={class:`ta-r font-mono text-purple`},A={class:`rn-tfoot`},j={class:`ta-r`},M={class:`ta-r font-mono`},N={class:`ta-r font-mono text-error`},P={class:`ta-r font-mono text-warning`},F={class:`ta-r font-mono text-success`},I={class:`ta-r font-mono text-purple`},L={key:2,class:`rn-table-wrap`},_e={class:`rn-table`},ve={class:`font-weight-medium`},ye={class:`ta-c`},be={class:`ta-r`},xe={class:`ta-r font-mono`},Se={class:`ta-r font-mono`},Ce={class:`ta-r font-mono`},we={class:`ta-r font-mono text-error`},Te={class:`ta-r font-mono text-warning`},Ee={class:`ta-r font-mono text-success`},De={class:`ta-r font-mono text-purple`},Oe={class:`rn-tfoot`},ke={class:`ta-r font-mono`},Ae={class:`ta-r font-mono text-error`},je={class:`ta-r font-mono text-warning`},Me={class:`ta-r font-mono text-success`},Ne={class:`ta-r font-mono text-purple`},Pe={key:3,class:`rn-table-wrap`},Fe={class:`rn-table`},Ie={class:`font-weight-medium`},Le={class:`ta-c text-caption font-mono`,style:{color:`rgba(var(--v-theme-on-surface),.5)`}},Re={class:`ta-r`},ze={class:`ta-r font-mono`},Be={class:`ta-r font-mono`},Ve={class:`ta-r font-mono text-purple`},He={class:`ta-r`},Ue={class:`pct-bar-wrap`},R={class:`pct-label`},We={class:`rn-tfoot`},Ge={class:`ta-r font-mono`},Ke={class:`ta-r font-mono text-purple`},qe={key:4,class:`rn-table-wrap`},Je={class:`rn-table`},Ye={class:`periodo-label`},Xe={class:`periodo-sub`},Ze={class:`ta-r font-mono`},Qe={class:`ta-r font-mono`},$e={class:`ta-r font-mono`},et={class:`ta-r font-mono`},tt={class:`ta-r font-mono`},nt={class:`ta-r font-mono`},rt={class:`ta-r font-mono`},it={class:`ta-r font-mono`},at={class:`ta-r font-mono text-error font-weight-bold`},ot={class:`rn-tfoot`},st={class:`ta-r font-mono`},ct={class:`ta-r font-mono`},lt={class:`ta-r font-mono`},ut={class:`ta-r font-mono`},dt={class:`ta-r font-mono`},ft={class:`ta-r font-mono`},pt={class:`ta-r font-mono`},mt={class:`ta-r font-mono`},ht={class:`ta-r font-mono text-error font-weight-bold`},z=h({__name:`ReporteNominaView`,setup(h){let z=l(),B=()=>z.empresaCodigo||z.empresa||localStorage.getItem(`empresaActual`),V=o(!1),H=o(!1),U=o(null),W=o([]),G=o(`periodo`);o({periodo:[],empleado:[],ccosto:[],impuestos:[]});let K=new Date().getFullYear(),q=o({fechaInicio:`${K}-01-01`,fechaFin:`${K}-12-31`}),gt=[{val:`periodo`,label:`Por Período`,icon:`mdi-calendar-range-outline`},{val:`empleado`,label:`Por Empleado`,icon:`mdi-account-group-outline`},{val:`ccosto`,label:`Por Centro de Costo`,icon:`mdi-sitemap-outline`},{val:`impuestos`,label:`Impuestos y Taxes`,icon:`mdi-receipt-text-outline`}],_t=d(()=>W.value.reduce((e,t)=>e+parseFloat(t.costo_bruto||0),0)),J=d(()=>W.value.reduce((e,t)=>e+parseFloat(t.costo_total||0),0));function Y(e){let t=J.value;return t>0?parseFloat(e)/t*100:0}async function X(){V.value=!0;try{let e=B(),t=new URLSearchParams({empresa:e,fechaInicio:q.value.fechaInicio,fechaFin:q.value.fechaFin,vista:G.value}),n=await(await fetch(`${_}/nomina/reporte?${t}`)).json();if(!n.success)throw Error(n.error);U.value=n.kpis,W.value=n.data||[]}catch(e){console.error(e)}finally{V.value=!1}}async function vt(e){G.value=e,await X()}function Z(e){return`$`+(parseFloat(e)||0).toLocaleString(`en-US`,{minimumFractionDigits:2,maximumFractionDigits:2})}function Q(e){return(parseFloat(e)||0).toLocaleString(`en-US`,{minimumFractionDigits:2,maximumFractionDigits:2})}function $(e){if(!e)return`—`;let[t,n,r]=String(e).split(`T`)[0].split(`-`);return`${n}/${r}/${t}`}async function yt(){if(U.value){H.value=!0;try{let e={empresa:B(),fechaInicio:q.value.fechaInicio,fechaFin:q.value.fechaFin},[t,n,r,i]=await Promise.all([fetch(`${_}/nomina/reporte?${new URLSearchParams({...e,vista:`periodo`})}`).then(e=>e.json()),fetch(`${_}/nomina/reporte?${new URLSearchParams({...e,vista:`empleado`})}`).then(e=>e.json()),fetch(`${_}/nomina/reporte?${new URLSearchParams({...e,vista:`ccosto`})}`).then(e=>e.json()),fetch(`${_}/nomina/reporte?${new URLSearchParams({...e,vista:`impuestos`})}`).then(e=>e.json())]),a=U.value,o=t.data||[],s=n.data||[],c=r.data||[],l=i.data||[],u=c.reduce((e,t)=>e+parseFloat(t.costo_bruto||0),0),d=c.reduce((e,t)=>e+parseFloat(t.costo_total||0),0);l.reduce((e,t)=>e+parseFloat(t.total_impuestos||0),0);let f=`
      <div class="section">
        <div class="section-title">Por Período</div>
        <table>
          <thead><tr>
            <th>PERÍODO</th><th>EMPL.</th><th>BRUTO</th><th>DEDUCCIONES</th><th>APORTES ER</th><th>NETO</th><th>COSTO EMPRESA</th>
          </tr></thead>
          <tbody>
            ${o.map(e=>`<tr>
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
            <td>TOTAL</td><td>${a.total_empleados}</td>
            <td>${Z(a.total_bruto)}</td>
            <td class="text-red">${Z(a.total_deducciones)}</td>
            <td class="text-amber">${Z(a.total_aportes_er)}</td>
            <td class="text-green">${Z(a.total_neto)}</td>
            <td class="text-purple">${Z(a.costo_total_empresa)}</td>
          </tr></tfoot>
        </table>
      </div>`,p=`
      <div class="section">
        <div class="section-title">Por Empleado</div>
        <table>
          <thead><tr>
            <th>EMPLEADO</th><th>TIPO</th><th>NÓM.</th><th>HRS REG</th><th>HRS OT</th><th>BRUTO</th><th>DEDUCCIONES</th><th>APORTES ER</th><th>NETO</th><th>COSTO EMP.</th>
          </tr></thead>
          <tbody>
            ${s.map(e=>`<tr>
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
            <td>${Z(a.total_bruto)}</td>
            <td class="text-red">${Z(a.total_deducciones)}</td>
            <td class="text-amber">${Z(a.total_aportes_er)}</td>
            <td class="text-green">${Z(a.total_neto)}</td>
            <td class="text-purple">${Z(a.costo_total_empresa)}</td>
          </tr></tfoot>
        </table>
      </div>`,m=`
      <div class="section">
        <div class="section-title">Por Centro de Costo</div>
        <table>
          <thead><tr>
            <th>CENTRO DE COSTO</th><th>CÓD.</th><th>EMPL.</th><th>HORAS</th><th>COSTO BRUTO</th><th>COSTO TOTAL</th><th>% DEL TOTAL</th>
          </tr></thead>
          <tbody>
            ${c.map(e=>{let t=d>0?(parseFloat(e.costo_total)/d*100).toFixed(1):`0.0`,n=Math.max(2,Math.round(parseFloat(t)));return`<tr>
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
            <td>${Z(u)}</td>
            <td class="text-purple">${Z(d)}</td>
            <td>100%</td>
          </tr></tfoot>
        </table>
      </div>`,h=`
      <div class="section">
        <div class="section-title">Impuestos y Taxes</div>
        <table>
          <thead><tr>
            <th>PERÍODO</th><th>FED.INC.TAX</th><th>SS EMP.</th><th>SS ER</th><th>MED.EMP.</th><th>MED.ER</th><th>FUTA</th><th>SUTA</th><th>W.COMP</th><th class="text-red">TOTAL IMP.</th>
          </tr></thead>
          <tbody>
            ${l.map(e=>`<tr>
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
            <td>${Z(a.federal_income_tax)}</td>
            <td>${Z(a.social_security_emp)}</td>
            <td>${Z(a.social_security_er)}</td>
            <td>${Z(a.medicare_emp)}</td>
            <td>${Z(a.medicare_er)}</td>
            <td>${Z(a.futa)}</td>
            <td>${Z(a.suta)}</td>
            <td>${Z(a.workers_comp)}</td>
            <td class="text-red">${Z(+a.federal_income_tax+ +a.social_security_emp+ +a.social_security_er+ +a.medicare_emp+ +a.medicare_er+ +a.futa+ +a.suta+ +a.workers_comp)}</td>
          </tr></tfoot>
        </table>
      </div>`,g=`
      <div class="kpi-row">
        <div class="kpi"><div class="kpi-lbl">BRUTO PAGADO</div><div class="kpi-val">${Z(a.total_bruto)}</div></div>
        <div class="kpi"><div class="kpi-lbl">DEDUCCIONES EMP.</div><div class="kpi-val text-red">${Z(a.total_deducciones)}</div></div>
        <div class="kpi"><div class="kpi-lbl">NETO PAGADO</div><div class="kpi-val text-green">${Z(a.total_neto)}</div></div>
        <div class="kpi"><div class="kpi-lbl">APORTES EMPLEADOR</div><div class="kpi-val text-amber">${Z(a.total_aportes_er)}</div></div>
        <div class="kpi"><div class="kpi-lbl">COSTO TOTAL EMPRESA</div><div class="kpi-val text-purple">${Z(a.costo_total_empresa)}</div></div>
        <div class="kpi"><div class="kpi-lbl">NÓMINAS / EMPLEADOS</div><div class="kpi-val">${a.total_nominas} / ${a.total_empleados}</div></div>
      </div>`,v=`<!DOCTYPE html><html><head><meta charset="UTF-8">
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
      .pct-bar { height: 5px; border-radius: 3px; background: linear-gradient(90deg,#ec4899,#8b5cf6); display: inline-block; min-width: 2px; }
      @media print { body { padding: 12px; } }
    </style></head>
      <body>
        <h1>REPORTE DE NÓMINA</h1>
        <div class="sub">Período: ${$(q.value.fechaInicio)} — ${$(q.value.fechaFin)}</div>
        ${g}
        ${f}
        ${p}
        ${m}
        ${h}
      </body></html>`,y=window.open(``,`_blank`);if(!y){alert(`Activa los pop-ups para generar el PDF`);return}y.document.write(v),y.document.close(),y.focus()}catch(e){console.error(e)}finally{H.value=!1}}}return f(X),(o,l)=>(S(),g(r,null,{default:m(()=>[b(`div`,te,[v(ee,{title:`Reporte de Nómina`,description:`Análisis de costos por período, empleado, centro de costo e impuestos`,crumbs:[`Nómina`,`Reportes`,`Reporte de Nómina`]}),b(`div`,ne,[b(`div`,re,[b(`div`,ie,[l[2]||=b(`div`,{class:`filter-label`},`FECHA INICIO`,-1),v(w,{modelValue:q.value.fechaInicio,"onUpdate:modelValue":l[0]||=e=>q.value.fechaInicio=e,type:`date`,variant:`outlined`,density:`compact`,"hide-details":``,style:{"min-width":`160px`}},null,8,[`modelValue`])]),b(`div`,ae,[l[3]||=b(`div`,{class:`filter-label`},`FECHA FIN`,-1),v(w,{modelValue:q.value.fechaFin,"onUpdate:modelValue":l[1]||=e=>q.value.fechaFin=e,type:`date`,variant:`outlined`,density:`compact`,"hide-details":``,style:{"min-width":`160px`}},null,8,[`modelValue`])]),v(t,{color:`secondary`,variant:`flat`,rounded:`lg`,loading:V.value,onClick:X,height:`40`},{default:m(()=>[v(C,{start:``},{default:m(()=>[...l[4]||=[u(`mdi-magnify`,-1)]]),_:1}),l[5]||=u(`Generar Reporte `,-1)]),_:1},8,[`loading`]),v(n),U.value?(S(),g(t,{key:0,variant:`flat`,color:`secondary`,rounded:`lg`,height:`40`,loading:H.value,onClick:yt},{default:m(()=>[v(C,{start:``},{default:m(()=>[...l[6]||=[u(`mdi-file-pdf-box`,-1)]]),_:1}),l[7]||=u(`Exportar PDF `,-1)]),_:1},8,[`loading`])):y(``,!0)])]),V.value?(S(),g(e,{key:0,indeterminate:``,color:`secondary`,height:`3`,class:`mb-4`})):y(``,!0),U.value?(S(),p(`div`,oe,[v(T,{index:0,label:`Bruto Pagado`,value:Z(U.value.total_bruto),icon:`mdi-cash-multiple`,color:`var(--indigo)`},null,8,[`value`]),v(T,{index:1,label:`Deducciones Emp.`,value:Z(U.value.total_deducciones),icon:`mdi-minus-circle-outline`,color:`var(--error)`,"value-color":`var(--error)`},null,8,[`value`]),v(T,{index:2,label:`Neto Pagado`,value:Z(U.value.total_neto),icon:`mdi-bank-transfer-out`,color:`var(--success)`,"value-color":`var(--success)`},null,8,[`value`]),v(T,{index:3,label:`Aportes Empleador`,value:Z(U.value.total_aportes_er),icon:`mdi-office-building-outline`,color:`var(--gold)`,"value-color":`var(--gold)`},null,8,[`value`]),v(T,{index:4,label:`Costo Total Empresa`,value:Z(U.value.costo_total_empresa),icon:`mdi-domain`,color:`var(--indigo)`,"value-color":`var(--indigo)`},null,8,[`value`]),v(T,{index:5,label:`Nóminas / Empleados`,value:`${U.value.total_nominas} / ${U.value.total_empleados}`,icon:`mdi-account-group-outline`,color:`var(--indigo)`,"value-color":`var(--indigo)`},null,8,[`value`])])):y(``,!0),U.value||W.value.length?(S(),p(`div`,se,[b(`div`,ce,[(S(),p(s,null,x(gt,e=>b(`button`,{key:e.val,class:a([`rn-tab`,{"rn-tab--active":G.value===e.val}]),onClick:t=>vt(e.val)},[v(C,{size:`15`,class:`mr-1`},{default:m(()=>[u(c(e.icon),1)]),_:2},1024),u(c(e.label),1)],10,le)),64))]),!V.value&&W.value.length===0?(S(),p(`div`,ue,[v(C,{size:`40`,color:`rgba(var(--v-theme-on-surface),.15)`,class:`mb-2`},{default:m(()=>[...l[8]||=[u(`mdi-file-search-outline`,-1)]]),_:1}),l[9]||=b(`div`,null,`No hay nóminas aprobadas en el período seleccionado`,-1)])):G.value===`periodo`&&W.value.length?(S(),p(`div`,de,[b(`table`,fe,[l[11]||=b(`thead`,null,[b(`tr`,null,[b(`th`,null,`PERÍODO`),b(`th`,{class:`ta-r`},`EMPLEADOS`),b(`th`,{class:`ta-r`},`BRUTO`),b(`th`,{class:`ta-r`},`DEDUCCIONES`),b(`th`,{class:`ta-r`},`APORTES ER`),b(`th`,{class:`ta-r`},`NETO`),b(`th`,{class:`ta-r`},`COSTO EMPRESA`)])],-1),b(`tbody`,null,[(S(!0),p(s,null,x(W.value,e=>(S(),p(`tr`,{key:e.id},[b(`td`,null,[b(`div`,pe,c($(e.semana_inicio)),1),b(`div`,me,`al `+c($(e.semana_fin)),1)]),b(`td`,he,c(e.empleados),1),b(`td`,ge,c(Z(e.total_bruto)),1),b(`td`,E,c(Z(e.total_deducciones)),1),b(`td`,D,c(Z(e.total_aportes_er)),1),b(`td`,O,c(Z(e.total_neto)),1),b(`td`,k,c(Z(e.costo_empresa)),1)]))),128))]),b(`tfoot`,null,[b(`tr`,A,[l[10]||=b(`td`,null,[b(`strong`,null,`TOTAL`)],-1),b(`td`,j,c(U.value.total_empleados),1),b(`td`,M,c(Z(U.value.total_bruto)),1),b(`td`,N,c(Z(U.value.total_deducciones)),1),b(`td`,P,c(Z(U.value.total_aportes_er)),1),b(`td`,F,c(Z(U.value.total_neto)),1),b(`td`,I,c(Z(U.value.costo_total_empresa)),1)])])])])):G.value===`empleado`&&W.value.length?(S(),p(`div`,L,[b(`table`,_e,[l[13]||=b(`thead`,null,[b(`tr`,null,[b(`th`,null,`EMPLEADO`),b(`th`,{class:`ta-c`},`TIPO`),b(`th`,{class:`ta-r`},`NÓMINAS`),b(`th`,{class:`ta-r`},`HRS REG`),b(`th`,{class:`ta-r`},`HRS OT`),b(`th`,{class:`ta-r`},`BRUTO`),b(`th`,{class:`ta-r`},`DEDUCCIONES`),b(`th`,{class:`ta-r`},`APORTES ER`),b(`th`,{class:`ta-r`},`NETO`),b(`th`,{class:`ta-r`},`COSTO EMP.`)])],-1),b(`tbody`,null,[(S(!0),p(s,null,x(W.value,e=>(S(),p(`tr`,{key:e.empleado_id},[b(`td`,ve,c(e.nombre),1),b(`td`,ye,[b(`span`,{class:a(e.tipo_empleado===`W2`?`badge-w2`:`badge-1099`)},c(e.tipo_empleado),3)]),b(`td`,be,c(e.total_nominas),1),b(`td`,xe,c(Q(e.horas_regulares)),1),b(`td`,Se,c(Q(e.horas_overtime)),1),b(`td`,Ce,c(Z(e.total_bruto)),1),b(`td`,we,c(Z(e.total_deducciones)),1),b(`td`,Te,c(Z(e.total_aportes_er)),1),b(`td`,Ee,c(Z(e.total_neto)),1),b(`td`,De,c(Z(e.costo_empresa)),1)]))),128))]),b(`tfoot`,null,[b(`tr`,Oe,[l[12]||=b(`td`,{colspan:`5`},[b(`strong`,null,`TOTAL`)],-1),b(`td`,ke,c(Z(U.value.total_bruto)),1),b(`td`,Ae,c(Z(U.value.total_deducciones)),1),b(`td`,je,c(Z(U.value.total_aportes_er)),1),b(`td`,Me,c(Z(U.value.total_neto)),1),b(`td`,Ne,c(Z(U.value.costo_total_empresa)),1)])])])])):G.value===`ccosto`&&W.value.length?(S(),p(`div`,Pe,[b(`table`,Fe,[l[16]||=b(`thead`,null,[b(`tr`,null,[b(`th`,null,`CENTRO DE COSTO`),b(`th`,{class:`ta-c`},`CÓD.`),b(`th`,{class:`ta-r`},`EMPLEADOS`),b(`th`,{class:`ta-r`},`HORAS`),b(`th`,{class:`ta-r`},`COSTO BRUTO`),b(`th`,{class:`ta-r`},`COSTO TOTAL`),b(`th`,{class:`ta-r`},`% DEL TOTAL`)])],-1),b(`tbody`,null,[(S(!0),p(s,null,x(W.value,e=>(S(),p(`tr`,{key:e.ccosto},[b(`td`,Ie,c(e.ccosto_nombre),1),b(`td`,Le,c(e.ccosto),1),b(`td`,Re,c(e.empleados),1),b(`td`,ze,c(Q(e.horas)),1),b(`td`,Be,c(Z(e.costo_bruto)),1),b(`td`,Ve,c(Z(e.costo_total)),1),b(`td`,He,[b(`div`,Ue,[b(`div`,{class:`pct-bar`,style:i({width:Y(e.costo_total)+`%`})},null,4),b(`span`,R,c(Y(e.costo_total).toFixed(1))+`%`,1)])])]))),128))]),b(`tfoot`,null,[b(`tr`,We,[l[14]||=b(`td`,{colspan:`4`},[b(`strong`,null,`TOTAL`)],-1),b(`td`,Ge,c(Z(_t.value)),1),b(`td`,Ke,c(Z(J.value)),1),l[15]||=b(`td`,{class:`ta-r`},`100%`,-1)])])])])):G.value===`impuestos`&&W.value.length?(S(),p(`div`,qe,[b(`table`,Je,[l[18]||=b(`thead`,null,[b(`tr`,null,[b(`th`,null,`PERÍODO`),b(`th`,{class:`ta-r`},`FED. INC. TAX`),b(`th`,{class:`ta-r`},`SS EMP.`),b(`th`,{class:`ta-r`},`SS ER`),b(`th`,{class:`ta-r`},`MEDICARE EMP.`),b(`th`,{class:`ta-r`},`MEDICARE ER`),b(`th`,{class:`ta-r`},`FUTA`),b(`th`,{class:`ta-r`},`SUTA`),b(`th`,{class:`ta-r`},`W.COMP`),b(`th`,{class:`ta-r text-error`},`TOTAL IMP.`)])],-1),b(`tbody`,null,[(S(!0),p(s,null,x(W.value,e=>(S(),p(`tr`,{key:e.semana_inicio},[b(`td`,null,[b(`div`,Ye,c($(e.semana_inicio)),1),b(`div`,Xe,`al `+c($(e.semana_fin)),1)]),b(`td`,Ze,c(Z(e.federal_income_tax)),1),b(`td`,Qe,c(Z(e.ss_emp)),1),b(`td`,$e,c(Z(e.ss_er)),1),b(`td`,et,c(Z(e.medicare_emp)),1),b(`td`,tt,c(Z(e.medicare_er)),1),b(`td`,nt,c(Z(e.futa)),1),b(`td`,rt,c(Z(e.suta)),1),b(`td`,it,c(Z(e.workers_comp)),1),b(`td`,at,c(Z(e.total_impuestos)),1)]))),128))]),b(`tfoot`,null,[b(`tr`,ot,[l[17]||=b(`td`,null,[b(`strong`,null,`TOTAL`)],-1),b(`td`,st,c(Z(U.value.federal_income_tax)),1),b(`td`,ct,c(Z(U.value.social_security_emp)),1),b(`td`,lt,c(Z(U.value.social_security_er)),1),b(`td`,ut,c(Z(U.value.medicare_emp)),1),b(`td`,dt,c(Z(U.value.medicare_er)),1),b(`td`,ft,c(Z(U.value.futa)),1),b(`td`,pt,c(Z(U.value.suta)),1),b(`td`,mt,c(Z(U.value.workers_comp)),1),b(`td`,ht,c(Z(+U.value.federal_income_tax+ +U.value.social_security_emp+ +U.value.social_security_er+ +U.value.medicare_emp+ +U.value.medicare_er+ +U.value.futa+ +U.value.suta+ +U.value.workers_comp)),1)])])])])):y(``,!0)])):y(``,!0)])]),_:1}))}},[[`__scopeId`,`data-v-5169365b`]]);export{z as default};