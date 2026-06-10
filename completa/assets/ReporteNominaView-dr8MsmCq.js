import{$ as e,B as t,H as n,It as r,L as i,Lt as a,Pt as o,_ as s,b as c,c as l,g as u,h as d,lt as f,m as p,p as m,x as h}from"./vue-router-H2HaKoii.js";import{t as g}from"./_plugin-vue_export-helper-BEqRjA8R.js";import{p as _,t as v}from"./VBtn-CBvurn8O.js";import{t as ee}from"./MainLayout-C5Sf-eUQ.js";import{a as y,i as te}from"./index-3g6OS_mU.js";import{t as b}from"./VIcon-ChosyInQ.js";import{t as x}from"./VTextField-Bek7no45.js";import{t as ne}from"./VSpacer-DUhmiPjX.js";var re={class:`rn-container`},ie={class:`rn-breadcrumb`},ae={class:`rn-header`},oe={class:`rn-header-left`},se={class:`rn-icon-wrap`},ce={class:`rn-filters-card`},le={class:`rn-filters-row`},ue={class:`filter-group`},de={class:`filter-group`},fe={key:1,class:`rn-kpi-grid`},pe={class:`rn-kpi`,style:{"--kc":`#ec4899`}},me={class:`kpi-icon`},he={class:`kpi-body`},ge={class:`kpi-val`},S={class:`rn-kpi`,style:{"--kc":`#ef4444`}},C={class:`kpi-icon`},w={class:`kpi-body`},T={class:`kpi-val`,style:{color:`#ef4444`}},E={class:`rn-kpi`,style:{"--kc":`#22c55e`}},D={class:`kpi-icon`},O={class:`kpi-body`},k={class:`kpi-val`,style:{color:`#22c55e`}},A={class:`rn-kpi`,style:{"--kc":`#f59e0b`}},j={class:`kpi-icon`},M={class:`kpi-body`},N={class:`kpi-val`,style:{color:`#f59e0b`}},P={class:`rn-kpi`,style:{"--kc":`#8b5cf6`}},F={class:`kpi-icon`},I={class:`kpi-body`},L={class:`kpi-val`,style:{color:`#8b5cf6`}},_e={class:`rn-kpi`,style:{"--kc":`#06b6d4`}},ve={class:`kpi-icon`},ye={class:`kpi-body`},be={class:`kpi-val`,style:{color:`#06b6d4`}},xe={key:2,class:`rn-tabs-card`},Se={class:`rn-tabs-header`},Ce=[`onClick`],we={key:0,class:`rn-empty`},Te={key:1,class:`rn-table-wrap`},Ee={class:`rn-table`},De={class:`periodo-label`},Oe={class:`periodo-sub`},ke={class:`ta-r`},Ae={class:`ta-r font-mono`},je={class:`ta-r font-mono text-error`},Me={class:`ta-r font-mono text-warning`},Ne={class:`ta-r font-mono text-success`},Pe={class:`ta-r font-mono text-purple`},Fe={class:`rn-tfoot`},Ie={class:`ta-r`},Le={class:`ta-r font-mono`},Re={class:`ta-r font-mono text-error`},ze={class:`ta-r font-mono text-warning`},Be={class:`ta-r font-mono text-success`},Ve={class:`ta-r font-mono text-purple`},He={key:2,class:`rn-table-wrap`},Ue={class:`rn-table`},We={class:`font-weight-medium`},Ge={class:`ta-c`},Ke={class:`ta-r`},qe={class:`ta-r font-mono`},Je={class:`ta-r font-mono`},Ye={class:`ta-r font-mono`},Xe={class:`ta-r font-mono text-error`},Ze={class:`ta-r font-mono text-warning`},Qe={class:`ta-r font-mono text-success`},$e={class:`ta-r font-mono text-purple`},et={class:`rn-tfoot`},R={class:`ta-r font-mono`},tt={class:`ta-r font-mono text-error`},nt={class:`ta-r font-mono text-warning`},rt={class:`ta-r font-mono text-success`},it={class:`ta-r font-mono text-purple`},at={key:3,class:`rn-table-wrap`},ot={class:`rn-table`},st={class:`font-weight-medium`},ct={class:`ta-c text-caption font-mono`,style:{color:`rgba(var(--v-theme-on-surface),.5)`}},lt={class:`ta-r`},ut={class:`ta-r font-mono`},dt={class:`ta-r font-mono`},ft={class:`ta-r font-mono text-purple`},pt={class:`ta-r`},mt={class:`pct-bar-wrap`},ht={class:`pct-label`},gt={class:`rn-tfoot`},_t={class:`ta-r font-mono`},vt={class:`ta-r font-mono text-purple`},yt={key:4,class:`rn-table-wrap`},bt={class:`rn-table`},xt={class:`periodo-label`},St={class:`periodo-sub`},Ct={class:`ta-r font-mono`},wt={class:`ta-r font-mono`},Tt={class:`ta-r font-mono`},Et={class:`ta-r font-mono`},Dt={class:`ta-r font-mono`},Ot={class:`ta-r font-mono`},kt={class:`ta-r font-mono`},At={class:`ta-r font-mono`},jt={class:`ta-r font-mono text-error font-weight-bold`},Mt={class:`rn-tfoot`},Nt={class:`ta-r font-mono`},Pt={class:`ta-r font-mono`},Ft={class:`ta-r font-mono`},It={class:`ta-r font-mono`},Lt={class:`ta-r font-mono`},Rt={class:`ta-r font-mono`},zt={class:`ta-r font-mono`},Bt={class:`ta-r font-mono`},Vt={class:`ta-r font-mono text-error font-weight-bold`},z=g({__name:`ReporteNominaView`,setup(g){let z=te(),B=()=>z.empresaCodigo||z.empresa||localStorage.getItem(`empresaActual`),V=f(!1),H=f(!1),U=f(null),W=f([]),G=f(`periodo`);f({periodo:[],empleado:[],ccosto:[],impuestos:[]});let K=new Date().getFullYear(),q=f({fechaInicio:`${K}-01-01`,fechaFin:`${K}-12-31`}),Ht=[{val:`periodo`,label:`Por Período`,icon:`mdi-calendar-range-outline`},{val:`empleado`,label:`Por Empleado`,icon:`mdi-account-group-outline`},{val:`ccosto`,label:`Por Centro de Costo`,icon:`mdi-sitemap-outline`},{val:`impuestos`,label:`Impuestos y Taxes`,icon:`mdi-receipt-text-outline`}],Ut=m(()=>W.value.reduce((e,t)=>e+parseFloat(t.costo_bruto||0),0)),J=m(()=>W.value.reduce((e,t)=>e+parseFloat(t.costo_total||0),0));function Y(e){let t=J.value;return t>0?parseFloat(e)/t*100:0}async function X(){V.value=!0;try{let e=B(),t=new URLSearchParams({empresa:e,fechaInicio:q.value.fechaInicio,fechaFin:q.value.fechaFin,vista:G.value}),n=await(await fetch(`${y}/nomina/reporte?${t}`)).json();if(!n.success)throw Error(n.error);U.value=n.kpis,W.value=n.data||[]}catch(e){console.error(e)}finally{V.value=!1}}async function Wt(e){G.value=e,await X()}function Z(e){return`$`+(parseFloat(e)||0).toLocaleString(`en-US`,{minimumFractionDigits:2,maximumFractionDigits:2})}function Q(e){return(parseFloat(e)||0).toLocaleString(`en-US`,{minimumFractionDigits:2,maximumFractionDigits:2})}function $(e){return e?new Date(e+`T00:00:00`).toLocaleDateString(`es`,{day:`2-digit`,month:`short`,year:`numeric`}):`—`}async function Gt(){if(U.value){H.value=!0;try{let e={empresa:B(),fechaInicio:q.value.fechaInicio,fechaFin:q.value.fechaFin},[t,n,r,i]=await Promise.all([fetch(`${y}/nomina/reporte?${new URLSearchParams({...e,vista:`periodo`})}`).then(e=>e.json()),fetch(`${y}/nomina/reporte?${new URLSearchParams({...e,vista:`empleado`})}`).then(e=>e.json()),fetch(`${y}/nomina/reporte?${new URLSearchParams({...e,vista:`ccosto`})}`).then(e=>e.json()),fetch(`${y}/nomina/reporte?${new URLSearchParams({...e,vista:`impuestos`})}`).then(e=>e.json())]),a=U.value,o=t.data||[],s=n.data||[],c=r.data||[],l=i.data||[],u=c.reduce((e,t)=>e+parseFloat(t.costo_bruto||0),0),d=c.reduce((e,t)=>e+parseFloat(t.costo_total||0),0);l.reduce((e,t)=>e+parseFloat(t.total_impuestos||0),0);let f=`
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
      </div>`,_=`<!DOCTYPE html><html><head><meta charset="UTF-8">
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
      th { background: #fdf2f8; padding: 7px 10px; text-align: right; font-size: 9px; font-weight: 700; letter-spacing: .5px; text-transform: uppercase; color: #9ca3af; border-bottom: 1px solid #e5e7eb; }
      th:first-child { text-align: left; }
      td { padding: 7px 10px; text-align: right; border-bottom: 1px solid #f3f4f6; }
      td:first-child { text-align: left; font-weight: 500; }
      tr:nth-child(even) { background: #fafafa; }
      .tfoot td { background: #fdf2f8; font-weight: 700; font-size: 11px; border-top: 2px solid #f9a8d4; padding: 8px 10px; }
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
      </body></html>`,v=window.open(``,`_blank`);if(!v){alert(`Activa los pop-ups para generar el PDF`);return}v.document.write(_),v.document.close(),v.focus()}catch(e){console.error(e)}finally{H.value=!1}}}return i(X),(i,f)=>(t(),d(ee,null,{default:e(()=>[p(`div`,re,[p(`div`,ie,[f[4]||=p(`span`,{class:`bc-root`},`NÓMINA`,-1),h(b,{size:`13`,class:`bc-sep`},{default:e(()=>[...f[2]||=[c(`mdi-chevron-right`,-1)]]),_:1}),f[5]||=p(`span`,{class:`bc-cat`},`Reportes`,-1),h(b,{size:`13`,class:`bc-sep`},{default:e(()=>[...f[3]||=[c(`mdi-chevron-right`,-1)]]),_:1}),f[6]||=p(`span`,{class:`bc-current`},`Reporte de Nómina`,-1)]),p(`div`,ae,[p(`div`,oe,[p(`div`,se,[h(b,{size:`22`,color:`white`},{default:e(()=>[...f[7]||=[c(`mdi-chart-bar`,-1)]]),_:1})]),f[8]||=p(`div`,null,[p(`h1`,{class:`rn-title`},`REPORTE DE NÓMINA`),p(`p`,{class:`rn-sub`},`Análisis de costos por período, empleado, centro de costo e impuestos`)],-1)])]),p(`div`,ce,[p(`div`,le,[p(`div`,ue,[f[9]||=p(`div`,{class:`filter-label`},`FECHA INICIO`,-1),h(x,{modelValue:q.value.fechaInicio,"onUpdate:modelValue":f[0]||=e=>q.value.fechaInicio=e,type:`date`,variant:`outlined`,density:`compact`,"hide-details":``,style:{"min-width":`160px`}},null,8,[`modelValue`])]),p(`div`,de,[f[10]||=p(`div`,{class:`filter-label`},`FECHA FIN`,-1),h(x,{modelValue:q.value.fechaFin,"onUpdate:modelValue":f[1]||=e=>q.value.fechaFin=e,type:`date`,variant:`outlined`,density:`compact`,"hide-details":``,style:{"min-width":`160px`}},null,8,[`modelValue`])]),h(v,{color:`#ec4899`,variant:`flat`,rounded:`lg`,loading:V.value,onClick:X,height:`40`},{default:e(()=>[h(b,{start:``},{default:e(()=>[...f[11]||=[c(`mdi-magnify`,-1)]]),_:1}),f[12]||=c(`Generar Reporte `,-1)]),_:1},8,[`loading`]),h(ne),U.value?(t(),d(v,{key:0,variant:`flat`,color:`#ec4899`,rounded:`lg`,height:`40`,loading:H.value,onClick:Gt},{default:e(()=>[h(b,{start:``},{default:e(()=>[...f[13]||=[c(`mdi-file-pdf-box`,-1)]]),_:1}),f[14]||=c(`Exportar PDF `,-1)]),_:1},8,[`loading`])):u(``,!0)])]),V.value?(t(),d(_,{key:0,indeterminate:``,color:`#ec4899`,height:`3`,class:`mb-4`})):u(``,!0),U.value?(t(),s(`div`,fe,[p(`div`,pe,[p(`div`,me,[h(b,{size:`18`,color:`#ec4899`},{default:e(()=>[...f[15]||=[c(`mdi-cash-multiple`,-1)]]),_:1})]),p(`div`,he,[f[16]||=p(`div`,{class:`kpi-lbl`},`BRUTO PAGADO`,-1),p(`div`,ge,a(Z(U.value.total_bruto)),1)])]),p(`div`,S,[p(`div`,C,[h(b,{size:`18`,color:`#ef4444`},{default:e(()=>[...f[17]||=[c(`mdi-minus-circle-outline`,-1)]]),_:1})]),p(`div`,w,[f[18]||=p(`div`,{class:`kpi-lbl`},`DEDUCCIONES EMP.`,-1),p(`div`,T,a(Z(U.value.total_deducciones)),1)])]),p(`div`,E,[p(`div`,D,[h(b,{size:`18`,color:`#22c55e`},{default:e(()=>[...f[19]||=[c(`mdi-bank-transfer-out`,-1)]]),_:1})]),p(`div`,O,[f[20]||=p(`div`,{class:`kpi-lbl`},`NETO PAGADO`,-1),p(`div`,k,a(Z(U.value.total_neto)),1)])]),p(`div`,A,[p(`div`,j,[h(b,{size:`18`,color:`#f59e0b`},{default:e(()=>[...f[21]||=[c(`mdi-office-building-outline`,-1)]]),_:1})]),p(`div`,M,[f[22]||=p(`div`,{class:`kpi-lbl`},`APORTES EMPLEADOR`,-1),p(`div`,N,a(Z(U.value.total_aportes_er)),1)])]),p(`div`,P,[p(`div`,F,[h(b,{size:`18`,color:`#8b5cf6`},{default:e(()=>[...f[23]||=[c(`mdi-domain`,-1)]]),_:1})]),p(`div`,I,[f[24]||=p(`div`,{class:`kpi-lbl`},`COSTO TOTAL EMPRESA`,-1),p(`div`,L,a(Z(U.value.costo_total_empresa)),1)])]),p(`div`,_e,[p(`div`,ve,[h(b,{size:`18`,color:`#06b6d4`},{default:e(()=>[...f[25]||=[c(`mdi-account-group-outline`,-1)]]),_:1})]),p(`div`,ye,[f[26]||=p(`div`,{class:`kpi-lbl`},`NÓMINAS / EMPLEADOS`,-1),p(`div`,be,a(U.value.total_nominas)+` / `+a(U.value.total_empleados),1)])])])):u(``,!0),U.value||W.value.length?(t(),s(`div`,xe,[p(`div`,Se,[(t(),s(l,null,n(Ht,t=>p(`button`,{key:t.val,class:o([`rn-tab`,{"rn-tab--active":G.value===t.val}]),onClick:e=>Wt(t.val)},[h(b,{size:`15`,class:`mr-1`},{default:e(()=>[c(a(t.icon),1)]),_:2},1024),c(a(t.label),1)],10,Ce)),64))]),!V.value&&W.value.length===0?(t(),s(`div`,we,[h(b,{size:`40`,color:`rgba(var(--v-theme-on-surface),.15)`,class:`mb-2`},{default:e(()=>[...f[27]||=[c(`mdi-file-search-outline`,-1)]]),_:1}),f[28]||=p(`div`,null,`No hay nóminas aprobadas en el período seleccionado`,-1)])):G.value===`periodo`&&W.value.length?(t(),s(`div`,Te,[p(`table`,Ee,[f[30]||=p(`thead`,null,[p(`tr`,null,[p(`th`,null,`PERÍODO`),p(`th`,{class:`ta-r`},`EMPLEADOS`),p(`th`,{class:`ta-r`},`BRUTO`),p(`th`,{class:`ta-r`},`DEDUCCIONES`),p(`th`,{class:`ta-r`},`APORTES ER`),p(`th`,{class:`ta-r`},`NETO`),p(`th`,{class:`ta-r`},`COSTO EMPRESA`)])],-1),p(`tbody`,null,[(t(!0),s(l,null,n(W.value,e=>(t(),s(`tr`,{key:e.id},[p(`td`,null,[p(`div`,De,a($(e.semana_inicio)),1),p(`div`,Oe,`al `+a($(e.semana_fin)),1)]),p(`td`,ke,a(e.empleados),1),p(`td`,Ae,a(Z(e.total_bruto)),1),p(`td`,je,a(Z(e.total_deducciones)),1),p(`td`,Me,a(Z(e.total_aportes_er)),1),p(`td`,Ne,a(Z(e.total_neto)),1),p(`td`,Pe,a(Z(e.costo_empresa)),1)]))),128))]),p(`tfoot`,null,[p(`tr`,Fe,[f[29]||=p(`td`,null,[p(`strong`,null,`TOTAL`)],-1),p(`td`,Ie,a(U.value.total_empleados),1),p(`td`,Le,a(Z(U.value.total_bruto)),1),p(`td`,Re,a(Z(U.value.total_deducciones)),1),p(`td`,ze,a(Z(U.value.total_aportes_er)),1),p(`td`,Be,a(Z(U.value.total_neto)),1),p(`td`,Ve,a(Z(U.value.costo_total_empresa)),1)])])])])):G.value===`empleado`&&W.value.length?(t(),s(`div`,He,[p(`table`,Ue,[f[32]||=p(`thead`,null,[p(`tr`,null,[p(`th`,null,`EMPLEADO`),p(`th`,{class:`ta-c`},`TIPO`),p(`th`,{class:`ta-r`},`NÓMINAS`),p(`th`,{class:`ta-r`},`HRS REG`),p(`th`,{class:`ta-r`},`HRS OT`),p(`th`,{class:`ta-r`},`BRUTO`),p(`th`,{class:`ta-r`},`DEDUCCIONES`),p(`th`,{class:`ta-r`},`APORTES ER`),p(`th`,{class:`ta-r`},`NETO`),p(`th`,{class:`ta-r`},`COSTO EMP.`)])],-1),p(`tbody`,null,[(t(!0),s(l,null,n(W.value,e=>(t(),s(`tr`,{key:e.empleado_id},[p(`td`,We,a(e.nombre),1),p(`td`,Ge,[p(`span`,{class:o(e.tipo_empleado===`W2`?`badge-w2`:`badge-1099`)},a(e.tipo_empleado),3)]),p(`td`,Ke,a(e.total_nominas),1),p(`td`,qe,a(Q(e.horas_regulares)),1),p(`td`,Je,a(Q(e.horas_overtime)),1),p(`td`,Ye,a(Z(e.total_bruto)),1),p(`td`,Xe,a(Z(e.total_deducciones)),1),p(`td`,Ze,a(Z(e.total_aportes_er)),1),p(`td`,Qe,a(Z(e.total_neto)),1),p(`td`,$e,a(Z(e.costo_empresa)),1)]))),128))]),p(`tfoot`,null,[p(`tr`,et,[f[31]||=p(`td`,{colspan:`5`},[p(`strong`,null,`TOTAL`)],-1),p(`td`,R,a(Z(U.value.total_bruto)),1),p(`td`,tt,a(Z(U.value.total_deducciones)),1),p(`td`,nt,a(Z(U.value.total_aportes_er)),1),p(`td`,rt,a(Z(U.value.total_neto)),1),p(`td`,it,a(Z(U.value.costo_total_empresa)),1)])])])])):G.value===`ccosto`&&W.value.length?(t(),s(`div`,at,[p(`table`,ot,[f[35]||=p(`thead`,null,[p(`tr`,null,[p(`th`,null,`CENTRO DE COSTO`),p(`th`,{class:`ta-c`},`CÓD.`),p(`th`,{class:`ta-r`},`EMPLEADOS`),p(`th`,{class:`ta-r`},`HORAS`),p(`th`,{class:`ta-r`},`COSTO BRUTO`),p(`th`,{class:`ta-r`},`COSTO TOTAL`),p(`th`,{class:`ta-r`},`% DEL TOTAL`)])],-1),p(`tbody`,null,[(t(!0),s(l,null,n(W.value,e=>(t(),s(`tr`,{key:e.ccosto},[p(`td`,st,a(e.ccosto_nombre),1),p(`td`,ct,a(e.ccosto),1),p(`td`,lt,a(e.empleados),1),p(`td`,ut,a(Q(e.horas)),1),p(`td`,dt,a(Z(e.costo_bruto)),1),p(`td`,ft,a(Z(e.costo_total)),1),p(`td`,pt,[p(`div`,mt,[p(`div`,{class:`pct-bar`,style:r({width:Y(e.costo_total)+`%`})},null,4),p(`span`,ht,a(Y(e.costo_total).toFixed(1))+`%`,1)])])]))),128))]),p(`tfoot`,null,[p(`tr`,gt,[f[33]||=p(`td`,{colspan:`4`},[p(`strong`,null,`TOTAL`)],-1),p(`td`,_t,a(Z(Ut.value)),1),p(`td`,vt,a(Z(J.value)),1),f[34]||=p(`td`,{class:`ta-r`},`100%`,-1)])])])])):G.value===`impuestos`&&W.value.length?(t(),s(`div`,yt,[p(`table`,bt,[f[37]||=p(`thead`,null,[p(`tr`,null,[p(`th`,null,`PERÍODO`),p(`th`,{class:`ta-r`},`FED. INC. TAX`),p(`th`,{class:`ta-r`},`SS EMP.`),p(`th`,{class:`ta-r`},`SS ER`),p(`th`,{class:`ta-r`},`MEDICARE EMP.`),p(`th`,{class:`ta-r`},`MEDICARE ER`),p(`th`,{class:`ta-r`},`FUTA`),p(`th`,{class:`ta-r`},`SUTA`),p(`th`,{class:`ta-r`},`W.COMP`),p(`th`,{class:`ta-r text-error`},`TOTAL IMP.`)])],-1),p(`tbody`,null,[(t(!0),s(l,null,n(W.value,e=>(t(),s(`tr`,{key:e.semana_inicio},[p(`td`,null,[p(`div`,xt,a($(e.semana_inicio)),1),p(`div`,St,`al `+a($(e.semana_fin)),1)]),p(`td`,Ct,a(Z(e.federal_income_tax)),1),p(`td`,wt,a(Z(e.ss_emp)),1),p(`td`,Tt,a(Z(e.ss_er)),1),p(`td`,Et,a(Z(e.medicare_emp)),1),p(`td`,Dt,a(Z(e.medicare_er)),1),p(`td`,Ot,a(Z(e.futa)),1),p(`td`,kt,a(Z(e.suta)),1),p(`td`,At,a(Z(e.workers_comp)),1),p(`td`,jt,a(Z(e.total_impuestos)),1)]))),128))]),p(`tfoot`,null,[p(`tr`,Mt,[f[36]||=p(`td`,null,[p(`strong`,null,`TOTAL`)],-1),p(`td`,Nt,a(Z(U.value.federal_income_tax)),1),p(`td`,Pt,a(Z(U.value.social_security_emp)),1),p(`td`,Ft,a(Z(U.value.social_security_er)),1),p(`td`,It,a(Z(U.value.medicare_emp)),1),p(`td`,Lt,a(Z(U.value.medicare_er)),1),p(`td`,Rt,a(Z(U.value.futa)),1),p(`td`,zt,a(Z(U.value.suta)),1),p(`td`,Bt,a(Z(U.value.workers_comp)),1),p(`td`,Vt,a(Z(+U.value.federal_income_tax+ +U.value.social_security_emp+ +U.value.social_security_er+ +U.value.medicare_emp+ +U.value.medicare_er+ +U.value.futa+ +U.value.suta+ +U.value.workers_comp)),1)])])])])):u(``,!0)])):u(``,!0)])]),_:1}))}},[[`__scopeId`,`data-v-e47cacc5`]]);export{z as default};