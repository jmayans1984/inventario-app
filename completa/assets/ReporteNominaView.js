import{p as e,t}from"./VBtn.js";import{o as n,t as r}from"./MainLayout.js";import{Jn as i,Kn as a,Ln as o,Xt as s,Yn as c,an as l,c as u,en as d,gn as f,i as p,in as m,kn as h,nn as g,on as _,rn as v,s as y,tn as b,xn as x,yn as S}from"./index.js";import{t as C}from"./VIcon.js";import{t as w}from"./VTextField.js";var ee={class:`rn-container`},te={class:`rn-breadcrumb`},ne={class:`rn-header`},re={class:`rn-header-left`},ie={class:`rn-icon-wrap`},ae={class:`rn-filters-card`},oe={class:`rn-filters-row`},se={class:`filter-group`},ce={class:`filter-group`},le={key:1,class:`rn-kpi-grid`},ue={class:`rn-kpi`,style:{"--kc":`#ec4899`}},de={class:`kpi-icon`},fe={class:`kpi-body`},pe={class:`kpi-val`},me={class:`rn-kpi`,style:{"--kc":`#ef4444`}},he={class:`kpi-icon`},ge={class:`kpi-body`},T={class:`kpi-val`,style:{color:`#ef4444`}},E={class:`rn-kpi`,style:{"--kc":`#22c55e`}},D={class:`kpi-icon`},O={class:`kpi-body`},k={class:`kpi-val`,style:{color:`#22c55e`}},A={class:`rn-kpi`,style:{"--kc":`#f59e0b`}},j={class:`kpi-icon`},M={class:`kpi-body`},N={class:`kpi-val`,style:{color:`#f59e0b`}},P={class:`rn-kpi`,style:{"--kc":`#8b5cf6`}},F={class:`kpi-icon`},I={class:`kpi-body`},L={class:`kpi-val`,style:{color:`#8b5cf6`}},_e={class:`rn-kpi`,style:{"--kc":`#06b6d4`}},ve={class:`kpi-icon`},ye={class:`kpi-body`},be={class:`kpi-val`,style:{color:`#06b6d4`}},xe={key:2,class:`rn-tabs-card`},Se={class:`rn-tabs-header`},Ce=[`onClick`],we={key:0,class:`rn-empty`},Te={key:1,class:`rn-table-wrap`},Ee={class:`rn-table`},De={class:`periodo-label`},Oe={class:`periodo-sub`},ke={class:`ta-r`},Ae={class:`ta-r font-mono`},je={class:`ta-r font-mono text-error`},Me={class:`ta-r font-mono text-warning`},Ne={class:`ta-r font-mono text-success`},Pe={class:`ta-r font-mono text-purple`},Fe={class:`rn-tfoot`},Ie={class:`ta-r`},Le={class:`ta-r font-mono`},Re={class:`ta-r font-mono text-error`},ze={class:`ta-r font-mono text-warning`},Be={class:`ta-r font-mono text-success`},Ve={class:`ta-r font-mono text-purple`},He={key:2,class:`rn-table-wrap`},Ue={class:`rn-table`},We={class:`font-weight-medium`},Ge={class:`ta-c`},Ke={class:`ta-r`},qe={class:`ta-r font-mono`},Je={class:`ta-r font-mono`},Ye={class:`ta-r font-mono`},Xe={class:`ta-r font-mono text-error`},Ze={class:`ta-r font-mono text-warning`},Qe={class:`ta-r font-mono text-success`},$e={class:`ta-r font-mono text-purple`},et={class:`rn-tfoot`},tt={class:`ta-r font-mono`},nt={class:`ta-r font-mono text-error`},rt={class:`ta-r font-mono text-warning`},it={class:`ta-r font-mono text-success`},at={class:`ta-r font-mono text-purple`},R={key:3,class:`rn-table-wrap`},ot={class:`rn-table`},st={class:`font-weight-medium`},ct={class:`ta-c text-caption font-mono`,style:{color:`rgba(var(--v-theme-on-surface),.5)`}},lt={class:`ta-r`},ut={class:`ta-r font-mono`},dt={class:`ta-r font-mono`},ft={class:`ta-r font-mono text-purple`},pt={class:`ta-r`},mt={class:`pct-bar-wrap`},ht={class:`pct-label`},gt={class:`rn-tfoot`},_t={class:`ta-r font-mono`},vt={class:`ta-r font-mono text-purple`},yt={key:4,class:`rn-table-wrap`},bt={class:`rn-table`},xt={class:`periodo-label`},St={class:`periodo-sub`},Ct={class:`ta-r font-mono`},wt={class:`ta-r font-mono`},Tt={class:`ta-r font-mono`},Et={class:`ta-r font-mono`},Dt={class:`ta-r font-mono`},Ot={class:`ta-r font-mono`},kt={class:`ta-r font-mono`},At={class:`ta-r font-mono`},jt={class:`ta-r font-mono text-error font-weight-bold`},Mt={class:`rn-tfoot`},Nt={class:`ta-r font-mono`},Pt={class:`ta-r font-mono`},Ft={class:`ta-r font-mono`},It={class:`ta-r font-mono`},Lt={class:`ta-r font-mono`},Rt={class:`ta-r font-mono`},zt={class:`ta-r font-mono`},Bt={class:`ta-r font-mono`},Vt={class:`ta-r font-mono text-error font-weight-bold`},z=p({__name:`ReporteNominaView`,setup(p){let z=y(),B=()=>z.empresaCodigo||z.empresa||localStorage.getItem(`empresaActual`),V=o(!1),H=o(!1),U=o(null),W=o([]),G=o(`periodo`);o({periodo:[],empleado:[],ccosto:[],impuestos:[]});let K=new Date().getFullYear(),q=o({fechaInicio:`${K}-01-01`,fechaFin:`${K}-12-31`}),Ht=[{val:`periodo`,label:`Por Período`,icon:`mdi-calendar-range-outline`},{val:`empleado`,label:`Por Empleado`,icon:`mdi-account-group-outline`},{val:`ccosto`,label:`Por Centro de Costo`,icon:`mdi-sitemap-outline`},{val:`impuestos`,label:`Impuestos y Taxes`,icon:`mdi-receipt-text-outline`}],Ut=d(()=>W.value.reduce((e,t)=>e+parseFloat(t.costo_bruto||0),0)),J=d(()=>W.value.reduce((e,t)=>e+parseFloat(t.costo_total||0),0));function Y(e){let t=J.value;return t>0?parseFloat(e)/t*100:0}async function X(){V.value=!0;try{let e=B(),t=new URLSearchParams({empresa:e,fechaInicio:q.value.fechaInicio,fechaFin:q.value.fechaFin,vista:G.value}),n=await(await fetch(`${u}/nomina/reporte?${t}`)).json();if(!n.success)throw Error(n.error);U.value=n.kpis,W.value=n.data||[]}catch(e){console.error(e)}finally{V.value=!1}}async function Wt(e){G.value=e,await X()}function Z(e){return`$`+(parseFloat(e)||0).toLocaleString(`en-US`,{minimumFractionDigits:2,maximumFractionDigits:2})}function Q(e){return(parseFloat(e)||0).toLocaleString(`en-US`,{minimumFractionDigits:2,maximumFractionDigits:2})}function $(e){if(!e)return`—`;let[t,n,r]=String(e).split(`T`)[0].split(`-`);return`${n}/${r}/${t}`}async function Gt(){if(U.value){H.value=!0;try{let e={empresa:B(),fechaInicio:q.value.fechaInicio,fechaFin:q.value.fechaFin},[t,n,r,i]=await Promise.all([fetch(`${u}/nomina/reporte?${new URLSearchParams({...e,vista:`periodo`})}`).then(e=>e.json()),fetch(`${u}/nomina/reporte?${new URLSearchParams({...e,vista:`empleado`})}`).then(e=>e.json()),fetch(`${u}/nomina/reporte?${new URLSearchParams({...e,vista:`ccosto`})}`).then(e=>e.json()),fetch(`${u}/nomina/reporte?${new URLSearchParams({...e,vista:`impuestos`})}`).then(e=>e.json())]),a=U.value,o=t.data||[],s=n.data||[],c=r.data||[],l=i.data||[],d=c.reduce((e,t)=>e+parseFloat(t.costo_bruto||0),0),f=c.reduce((e,t)=>e+parseFloat(t.costo_total||0),0);l.reduce((e,t)=>e+parseFloat(t.total_impuestos||0),0);let p=`
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
      </div>`,m=`
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
      </div>`,h=`
      <div class="section">
        <div class="section-title">Por Centro de Costo</div>
        <table>
          <thead><tr>
            <th>CENTRO DE COSTO</th><th>CÓD.</th><th>EMPL.</th><th>HORAS</th><th>COSTO BRUTO</th><th>COSTO TOTAL</th><th>% DEL TOTAL</th>
          </tr></thead>
          <tbody>
            ${c.map(e=>{let t=f>0?(parseFloat(e.costo_total)/f*100).toFixed(1):`0.0`,n=Math.max(2,Math.round(parseFloat(t)));return`<tr>
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
            <td>${Z(d)}</td>
            <td class="text-purple">${Z(f)}</td>
            <td>100%</td>
          </tr></tfoot>
        </table>
      </div>`,g=`
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
      </div>`,_=`
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
        ${_}
        ${p}
        ${m}
        ${h}
        ${g}
      </body></html>`,y=window.open(``,`_blank`);if(!y){alert(`Activa los pop-ups para generar el PDF`);return}y.document.write(v),y.document.close(),y.focus()}catch(e){console.error(e)}finally{H.value=!1}}}return f(X),(o,u)=>(S(),g(r,null,{default:h(()=>[b(`div`,ee,[b(`div`,te,[u[4]||=b(`span`,{class:`bc-root`},`NÓMINA`,-1),_(C,{size:`13`,class:`bc-sep`},{default:h(()=>[...u[2]||=[l(`mdi-chevron-right`,-1)]]),_:1}),u[5]||=b(`span`,{class:`bc-cat`},`Reportes`,-1),_(C,{size:`13`,class:`bc-sep`},{default:h(()=>[...u[3]||=[l(`mdi-chevron-right`,-1)]]),_:1}),u[6]||=b(`span`,{class:`bc-current`},`Reporte de Nómina`,-1)]),b(`div`,ne,[b(`div`,re,[b(`div`,ie,[_(C,{size:`22`,color:`white`},{default:h(()=>[...u[7]||=[l(`mdi-chart-bar`,-1)]]),_:1})]),u[8]||=b(`div`,null,[b(`h1`,{class:`rn-title`},`REPORTE DE NÓMINA`),b(`p`,{class:`rn-sub`},`Análisis de costos por período, empleado, centro de costo e impuestos`)],-1)])]),b(`div`,ae,[b(`div`,oe,[b(`div`,se,[u[9]||=b(`div`,{class:`filter-label`},`FECHA INICIO`,-1),_(w,{modelValue:q.value.fechaInicio,"onUpdate:modelValue":u[0]||=e=>q.value.fechaInicio=e,type:`date`,variant:`outlined`,density:`compact`,"hide-details":``,style:{"min-width":`160px`}},null,8,[`modelValue`])]),b(`div`,ce,[u[10]||=b(`div`,{class:`filter-label`},`FECHA FIN`,-1),_(w,{modelValue:q.value.fechaFin,"onUpdate:modelValue":u[1]||=e=>q.value.fechaFin=e,type:`date`,variant:`outlined`,density:`compact`,"hide-details":``,style:{"min-width":`160px`}},null,8,[`modelValue`])]),_(t,{color:`#ec4899`,variant:`flat`,rounded:`lg`,loading:V.value,onClick:X,height:`40`},{default:h(()=>[_(C,{start:``},{default:h(()=>[...u[11]||=[l(`mdi-magnify`,-1)]]),_:1}),u[12]||=l(`Generar Reporte `,-1)]),_:1},8,[`loading`]),_(n),U.value?(S(),g(t,{key:0,variant:`flat`,color:`#ec4899`,rounded:`lg`,height:`40`,loading:H.value,onClick:Gt},{default:h(()=>[_(C,{start:``},{default:h(()=>[...u[13]||=[l(`mdi-file-pdf-box`,-1)]]),_:1}),u[14]||=l(`Exportar PDF `,-1)]),_:1},8,[`loading`])):v(``,!0)])]),V.value?(S(),g(e,{key:0,indeterminate:``,color:`#ec4899`,height:`3`,class:`mb-4`})):v(``,!0),U.value?(S(),m(`div`,le,[b(`div`,ue,[b(`div`,de,[_(C,{size:`18`,color:`#ec4899`},{default:h(()=>[...u[15]||=[l(`mdi-cash-multiple`,-1)]]),_:1})]),b(`div`,fe,[u[16]||=b(`div`,{class:`kpi-lbl`},`BRUTO PAGADO`,-1),b(`div`,pe,c(Z(U.value.total_bruto)),1)])]),b(`div`,me,[b(`div`,he,[_(C,{size:`18`,color:`#ef4444`},{default:h(()=>[...u[17]||=[l(`mdi-minus-circle-outline`,-1)]]),_:1})]),b(`div`,ge,[u[18]||=b(`div`,{class:`kpi-lbl`},`DEDUCCIONES EMP.`,-1),b(`div`,T,c(Z(U.value.total_deducciones)),1)])]),b(`div`,E,[b(`div`,D,[_(C,{size:`18`,color:`#22c55e`},{default:h(()=>[...u[19]||=[l(`mdi-bank-transfer-out`,-1)]]),_:1})]),b(`div`,O,[u[20]||=b(`div`,{class:`kpi-lbl`},`NETO PAGADO`,-1),b(`div`,k,c(Z(U.value.total_neto)),1)])]),b(`div`,A,[b(`div`,j,[_(C,{size:`18`,color:`#f59e0b`},{default:h(()=>[...u[21]||=[l(`mdi-office-building-outline`,-1)]]),_:1})]),b(`div`,M,[u[22]||=b(`div`,{class:`kpi-lbl`},`APORTES EMPLEADOR`,-1),b(`div`,N,c(Z(U.value.total_aportes_er)),1)])]),b(`div`,P,[b(`div`,F,[_(C,{size:`18`,color:`#8b5cf6`},{default:h(()=>[...u[23]||=[l(`mdi-domain`,-1)]]),_:1})]),b(`div`,I,[u[24]||=b(`div`,{class:`kpi-lbl`},`COSTO TOTAL EMPRESA`,-1),b(`div`,L,c(Z(U.value.costo_total_empresa)),1)])]),b(`div`,_e,[b(`div`,ve,[_(C,{size:`18`,color:`#06b6d4`},{default:h(()=>[...u[25]||=[l(`mdi-account-group-outline`,-1)]]),_:1})]),b(`div`,ye,[u[26]||=b(`div`,{class:`kpi-lbl`},`NÓMINAS / EMPLEADOS`,-1),b(`div`,be,c(U.value.total_nominas)+` / `+c(U.value.total_empleados),1)])])])):v(``,!0),U.value||W.value.length?(S(),m(`div`,xe,[b(`div`,Se,[(S(),m(s,null,x(Ht,e=>b(`button`,{key:e.val,class:a([`rn-tab`,{"rn-tab--active":G.value===e.val}]),onClick:t=>Wt(e.val)},[_(C,{size:`15`,class:`mr-1`},{default:h(()=>[l(c(e.icon),1)]),_:2},1024),l(c(e.label),1)],10,Ce)),64))]),!V.value&&W.value.length===0?(S(),m(`div`,we,[_(C,{size:`40`,color:`rgba(var(--v-theme-on-surface),.15)`,class:`mb-2`},{default:h(()=>[...u[27]||=[l(`mdi-file-search-outline`,-1)]]),_:1}),u[28]||=b(`div`,null,`No hay nóminas aprobadas en el período seleccionado`,-1)])):G.value===`periodo`&&W.value.length?(S(),m(`div`,Te,[b(`table`,Ee,[u[30]||=b(`thead`,null,[b(`tr`,null,[b(`th`,null,`PERÍODO`),b(`th`,{class:`ta-r`},`EMPLEADOS`),b(`th`,{class:`ta-r`},`BRUTO`),b(`th`,{class:`ta-r`},`DEDUCCIONES`),b(`th`,{class:`ta-r`},`APORTES ER`),b(`th`,{class:`ta-r`},`NETO`),b(`th`,{class:`ta-r`},`COSTO EMPRESA`)])],-1),b(`tbody`,null,[(S(!0),m(s,null,x(W.value,e=>(S(),m(`tr`,{key:e.id},[b(`td`,null,[b(`div`,De,c($(e.semana_inicio)),1),b(`div`,Oe,`al `+c($(e.semana_fin)),1)]),b(`td`,ke,c(e.empleados),1),b(`td`,Ae,c(Z(e.total_bruto)),1),b(`td`,je,c(Z(e.total_deducciones)),1),b(`td`,Me,c(Z(e.total_aportes_er)),1),b(`td`,Ne,c(Z(e.total_neto)),1),b(`td`,Pe,c(Z(e.costo_empresa)),1)]))),128))]),b(`tfoot`,null,[b(`tr`,Fe,[u[29]||=b(`td`,null,[b(`strong`,null,`TOTAL`)],-1),b(`td`,Ie,c(U.value.total_empleados),1),b(`td`,Le,c(Z(U.value.total_bruto)),1),b(`td`,Re,c(Z(U.value.total_deducciones)),1),b(`td`,ze,c(Z(U.value.total_aportes_er)),1),b(`td`,Be,c(Z(U.value.total_neto)),1),b(`td`,Ve,c(Z(U.value.costo_total_empresa)),1)])])])])):G.value===`empleado`&&W.value.length?(S(),m(`div`,He,[b(`table`,Ue,[u[32]||=b(`thead`,null,[b(`tr`,null,[b(`th`,null,`EMPLEADO`),b(`th`,{class:`ta-c`},`TIPO`),b(`th`,{class:`ta-r`},`NÓMINAS`),b(`th`,{class:`ta-r`},`HRS REG`),b(`th`,{class:`ta-r`},`HRS OT`),b(`th`,{class:`ta-r`},`BRUTO`),b(`th`,{class:`ta-r`},`DEDUCCIONES`),b(`th`,{class:`ta-r`},`APORTES ER`),b(`th`,{class:`ta-r`},`NETO`),b(`th`,{class:`ta-r`},`COSTO EMP.`)])],-1),b(`tbody`,null,[(S(!0),m(s,null,x(W.value,e=>(S(),m(`tr`,{key:e.empleado_id},[b(`td`,We,c(e.nombre),1),b(`td`,Ge,[b(`span`,{class:a(e.tipo_empleado===`W2`?`badge-w2`:`badge-1099`)},c(e.tipo_empleado),3)]),b(`td`,Ke,c(e.total_nominas),1),b(`td`,qe,c(Q(e.horas_regulares)),1),b(`td`,Je,c(Q(e.horas_overtime)),1),b(`td`,Ye,c(Z(e.total_bruto)),1),b(`td`,Xe,c(Z(e.total_deducciones)),1),b(`td`,Ze,c(Z(e.total_aportes_er)),1),b(`td`,Qe,c(Z(e.total_neto)),1),b(`td`,$e,c(Z(e.costo_empresa)),1)]))),128))]),b(`tfoot`,null,[b(`tr`,et,[u[31]||=b(`td`,{colspan:`5`},[b(`strong`,null,`TOTAL`)],-1),b(`td`,tt,c(Z(U.value.total_bruto)),1),b(`td`,nt,c(Z(U.value.total_deducciones)),1),b(`td`,rt,c(Z(U.value.total_aportes_er)),1),b(`td`,it,c(Z(U.value.total_neto)),1),b(`td`,at,c(Z(U.value.costo_total_empresa)),1)])])])])):G.value===`ccosto`&&W.value.length?(S(),m(`div`,R,[b(`table`,ot,[u[35]||=b(`thead`,null,[b(`tr`,null,[b(`th`,null,`CENTRO DE COSTO`),b(`th`,{class:`ta-c`},`CÓD.`),b(`th`,{class:`ta-r`},`EMPLEADOS`),b(`th`,{class:`ta-r`},`HORAS`),b(`th`,{class:`ta-r`},`COSTO BRUTO`),b(`th`,{class:`ta-r`},`COSTO TOTAL`),b(`th`,{class:`ta-r`},`% DEL TOTAL`)])],-1),b(`tbody`,null,[(S(!0),m(s,null,x(W.value,e=>(S(),m(`tr`,{key:e.ccosto},[b(`td`,st,c(e.ccosto_nombre),1),b(`td`,ct,c(e.ccosto),1),b(`td`,lt,c(e.empleados),1),b(`td`,ut,c(Q(e.horas)),1),b(`td`,dt,c(Z(e.costo_bruto)),1),b(`td`,ft,c(Z(e.costo_total)),1),b(`td`,pt,[b(`div`,mt,[b(`div`,{class:`pct-bar`,style:i({width:Y(e.costo_total)+`%`})},null,4),b(`span`,ht,c(Y(e.costo_total).toFixed(1))+`%`,1)])])]))),128))]),b(`tfoot`,null,[b(`tr`,gt,[u[33]||=b(`td`,{colspan:`4`},[b(`strong`,null,`TOTAL`)],-1),b(`td`,_t,c(Z(Ut.value)),1),b(`td`,vt,c(Z(J.value)),1),u[34]||=b(`td`,{class:`ta-r`},`100%`,-1)])])])])):G.value===`impuestos`&&W.value.length?(S(),m(`div`,yt,[b(`table`,bt,[u[37]||=b(`thead`,null,[b(`tr`,null,[b(`th`,null,`PERÍODO`),b(`th`,{class:`ta-r`},`FED. INC. TAX`),b(`th`,{class:`ta-r`},`SS EMP.`),b(`th`,{class:`ta-r`},`SS ER`),b(`th`,{class:`ta-r`},`MEDICARE EMP.`),b(`th`,{class:`ta-r`},`MEDICARE ER`),b(`th`,{class:`ta-r`},`FUTA`),b(`th`,{class:`ta-r`},`SUTA`),b(`th`,{class:`ta-r`},`W.COMP`),b(`th`,{class:`ta-r text-error`},`TOTAL IMP.`)])],-1),b(`tbody`,null,[(S(!0),m(s,null,x(W.value,e=>(S(),m(`tr`,{key:e.semana_inicio},[b(`td`,null,[b(`div`,xt,c($(e.semana_inicio)),1),b(`div`,St,`al `+c($(e.semana_fin)),1)]),b(`td`,Ct,c(Z(e.federal_income_tax)),1),b(`td`,wt,c(Z(e.ss_emp)),1),b(`td`,Tt,c(Z(e.ss_er)),1),b(`td`,Et,c(Z(e.medicare_emp)),1),b(`td`,Dt,c(Z(e.medicare_er)),1),b(`td`,Ot,c(Z(e.futa)),1),b(`td`,kt,c(Z(e.suta)),1),b(`td`,At,c(Z(e.workers_comp)),1),b(`td`,jt,c(Z(e.total_impuestos)),1)]))),128))]),b(`tfoot`,null,[b(`tr`,Mt,[u[36]||=b(`td`,null,[b(`strong`,null,`TOTAL`)],-1),b(`td`,Nt,c(Z(U.value.federal_income_tax)),1),b(`td`,Pt,c(Z(U.value.social_security_emp)),1),b(`td`,Ft,c(Z(U.value.social_security_er)),1),b(`td`,It,c(Z(U.value.medicare_emp)),1),b(`td`,Lt,c(Z(U.value.medicare_er)),1),b(`td`,Rt,c(Z(U.value.futa)),1),b(`td`,zt,c(Z(U.value.suta)),1),b(`td`,Bt,c(Z(U.value.workers_comp)),1),b(`td`,Vt,c(Z(+U.value.federal_income_tax+ +U.value.social_security_emp+ +U.value.social_security_er+ +U.value.medicare_emp+ +U.value.medicare_er+ +U.value.futa+ +U.value.suta+ +U.value.workers_comp)),1)])])])])):v(``,!0)])):v(``,!0)])]),_:1}))}},[[`__scopeId`,`data-v-7722ffab`]]);export{z as default};