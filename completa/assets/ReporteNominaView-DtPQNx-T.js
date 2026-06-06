import{p as e,t}from"./VBtn-D00QZk8s.js";import{$t as n,En as r,Gn as i,Kn as a,Kt as o,Pn as s,Qt as c,Un as l,Xt as u,Zt as d,a as f,en as p,gn as m,nn as h,o as g,pn as _,rn as v,vn as y}from"./index-CIEeDQzK.js";import{t as ee}from"./MainLayout-D6J42E7p.js";import{c as te,t as b}from"./VIcon-DNvyaaEf.js";import{t as ne}from"./VSpacer-wZXhGx1S.js";import{t as x}from"./VTextField-DKK3c5Y0.js";var re={class:`rn-container`},ie={class:`rn-breadcrumb`},ae={class:`rn-header`},oe={class:`rn-header-left`},se={class:`rn-icon-wrap`},ce={class:`rn-filters-card`},le={class:`rn-filters-row`},ue={class:`filter-group`},de={class:`filter-group`},fe={key:1,class:`rn-kpi-grid`},pe={class:`rn-kpi`,style:{"--kc":`#ec4899`}},me={class:`kpi-icon`},he={class:`kpi-body`},ge={class:`kpi-val`},S={class:`rn-kpi`,style:{"--kc":`#ef4444`}},C={class:`kpi-icon`},w={class:`kpi-body`},T={class:`kpi-val`,style:{color:`#ef4444`}},E={class:`rn-kpi`,style:{"--kc":`#22c55e`}},D={class:`kpi-icon`},O={class:`kpi-body`},k={class:`kpi-val`,style:{color:`#22c55e`}},A={class:`rn-kpi`,style:{"--kc":`#f59e0b`}},j={class:`kpi-icon`},M={class:`kpi-body`},N={class:`kpi-val`,style:{color:`#f59e0b`}},P={class:`rn-kpi`,style:{"--kc":`#8b5cf6`}},F={class:`kpi-icon`},I={class:`kpi-body`},L={class:`kpi-val`,style:{color:`#8b5cf6`}},_e={class:`rn-kpi`,style:{"--kc":`#06b6d4`}},ve={class:`kpi-icon`},ye={class:`kpi-body`},be={class:`kpi-val`,style:{color:`#06b6d4`}},xe={key:2,class:`rn-tabs-card`},Se={class:`rn-tabs-header`},Ce=[`onClick`],we={key:0,class:`rn-empty`},Te={key:1,class:`rn-table-wrap`},Ee={class:`rn-table`},De={class:`periodo-label`},Oe={class:`periodo-sub`},ke={class:`ta-r`},Ae={class:`ta-r font-mono`},je={class:`ta-r font-mono text-error`},Me={class:`ta-r font-mono text-warning`},Ne={class:`ta-r font-mono text-success`},Pe={class:`ta-r font-mono text-purple`},Fe={class:`rn-tfoot`},Ie={class:`ta-r`},Le={class:`ta-r font-mono`},Re={class:`ta-r font-mono text-error`},ze={class:`ta-r font-mono text-warning`},Be={class:`ta-r font-mono text-success`},Ve={class:`ta-r font-mono text-purple`},He={key:2,class:`rn-table-wrap`},Ue={class:`rn-table`},We={class:`font-weight-medium`},Ge={class:`ta-c`},Ke={class:`ta-r`},qe={class:`ta-r font-mono`},Je={class:`ta-r font-mono`},Ye={class:`ta-r font-mono`},Xe={class:`ta-r font-mono text-error`},Ze={class:`ta-r font-mono text-warning`},Qe={class:`ta-r font-mono text-success`},$e={class:`ta-r font-mono text-purple`},et={class:`rn-tfoot`},tt={class:`ta-r font-mono`},R={class:`ta-r font-mono text-error`},nt={class:`ta-r font-mono text-warning`},rt={class:`ta-r font-mono text-success`},it={class:`ta-r font-mono text-purple`},at={key:3,class:`rn-table-wrap`},ot={class:`rn-table`},st={class:`font-weight-medium`},ct={class:`ta-c text-caption font-mono`,style:{color:`rgba(var(--v-theme-on-surface),.5)`}},lt={class:`ta-r`},ut={class:`ta-r font-mono`},dt={class:`ta-r font-mono`},ft={class:`ta-r font-mono text-purple`},pt={class:`ta-r`},mt={class:`pct-bar-wrap`},ht={class:`pct-label`},gt={class:`rn-tfoot`},_t={class:`ta-r font-mono`},vt={class:`ta-r font-mono text-purple`},yt={key:4,class:`rn-table-wrap`},bt={class:`rn-table`},xt={class:`periodo-label`},St={class:`periodo-sub`},Ct={class:`ta-r font-mono`},wt={class:`ta-r font-mono`},Tt={class:`ta-r font-mono`},Et={class:`ta-r font-mono`},Dt={class:`ta-r font-mono`},Ot={class:`ta-r font-mono`},kt={class:`ta-r font-mono`},At={class:`ta-r font-mono`},jt={class:`ta-r font-mono text-error font-weight-bold`},Mt={class:`rn-tfoot`},Nt={class:`ta-r font-mono`},Pt={class:`ta-r font-mono`},Ft={class:`ta-r font-mono`},It={class:`ta-r font-mono`},Lt={class:`ta-r font-mono`},Rt={class:`ta-r font-mono`},zt={class:`ta-r font-mono`},Bt={class:`ta-r font-mono`},Vt={class:`ta-r font-mono text-error font-weight-bold`},z=te({__name:`ReporteNominaView`,setup(te){let z=f(),B=()=>z.empresaCodigo||z.empresa||localStorage.getItem(`empresaActual`),V=s(!1),H=s(!1),U=s(null),W=s([]),G=s(`periodo`);s({periodo:[],empleado:[],ccosto:[],impuestos:[]});let K=new Date().getFullYear(),q=s({fechaInicio:`${K}-01-01`,fechaFin:`${K}-12-31`}),Ht=[{val:`periodo`,label:`Por Período`,icon:`mdi-calendar-range-outline`},{val:`empleado`,label:`Por Empleado`,icon:`mdi-account-group-outline`},{val:`ccosto`,label:`Por Centro de Costo`,icon:`mdi-sitemap-outline`},{val:`impuestos`,label:`Impuestos y Taxes`,icon:`mdi-receipt-text-outline`}],Ut=u(()=>W.value.reduce((e,t)=>e+parseFloat(t.costo_bruto||0),0)),J=u(()=>W.value.reduce((e,t)=>e+parseFloat(t.costo_total||0),0));function Y(e){let t=J.value;return t>0?parseFloat(e)/t*100:0}async function X(){V.value=!0;try{let e=B(),t=new URLSearchParams({empresa:e,fechaInicio:q.value.fechaInicio,fechaFin:q.value.fechaFin,vista:G.value}),n=await(await fetch(`${g}/nomina/reporte?${t}`)).json();if(!n.success)throw Error(n.error);U.value=n.kpis,W.value=n.data||[]}catch(e){console.error(e)}finally{V.value=!1}}async function Wt(e){G.value=e,await X()}function Z(e){return`$`+(parseFloat(e)||0).toLocaleString(`en-US`,{minimumFractionDigits:2,maximumFractionDigits:2})}function Q(e){return(parseFloat(e)||0).toLocaleString(`en-US`,{minimumFractionDigits:2,maximumFractionDigits:2})}function $(e){return e?new Date(e+`T00:00:00`).toLocaleDateString(`es`,{day:`2-digit`,month:`short`,year:`numeric`}):`—`}async function Gt(){if(U.value){H.value=!0;try{let e={empresa:B(),fechaInicio:q.value.fechaInicio,fechaFin:q.value.fechaFin},[t,n,r,i]=await Promise.all([fetch(`${g}/nomina/reporte?${new URLSearchParams({...e,vista:`periodo`})}`).then(e=>e.json()),fetch(`${g}/nomina/reporte?${new URLSearchParams({...e,vista:`empleado`})}`).then(e=>e.json()),fetch(`${g}/nomina/reporte?${new URLSearchParams({...e,vista:`ccosto`})}`).then(e=>e.json()),fetch(`${g}/nomina/reporte?${new URLSearchParams({...e,vista:`impuestos`})}`).then(e=>e.json())]),a=U.value,o=t.data||[],s=n.data||[],c=r.data||[],l=i.data||[],u=c.reduce((e,t)=>e+parseFloat(t.costo_bruto||0),0),d=c.reduce((e,t)=>e+parseFloat(t.costo_total||0),0);l.reduce((e,t)=>e+parseFloat(t.total_impuestos||0),0);let f=`
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
        ${_}
        ${f}
        ${p}
        ${m}
        ${h}
      </body></html>`,y=window.open(``,`_blank`);if(!y){alert(`Activa los pop-ups para generar el PDF`);return}y.document.write(v),y.document.close(),y.focus()}catch(e){console.error(e)}finally{H.value=!1}}}return _(X),(s,u)=>(m(),c(ee,null,{default:r(()=>[d(`div`,re,[d(`div`,ie,[u[4]||=d(`span`,{class:`bc-root`},`NÓMINA`,-1),v(b,{size:`13`,class:`bc-sep`},{default:r(()=>[...u[2]||=[h(`mdi-chevron-right`,-1)]]),_:1}),u[5]||=d(`span`,{class:`bc-cat`},`Reportes`,-1),v(b,{size:`13`,class:`bc-sep`},{default:r(()=>[...u[3]||=[h(`mdi-chevron-right`,-1)]]),_:1}),u[6]||=d(`span`,{class:`bc-current`},`Reporte de Nómina`,-1)]),d(`div`,ae,[d(`div`,oe,[d(`div`,se,[v(b,{size:`22`,color:`white`},{default:r(()=>[...u[7]||=[h(`mdi-chart-bar`,-1)]]),_:1})]),u[8]||=d(`div`,null,[d(`h1`,{class:`rn-title`},`REPORTE DE NÓMINA`),d(`p`,{class:`rn-sub`},`Análisis de costos por período, empleado, centro de costo e impuestos`)],-1)])]),d(`div`,ce,[d(`div`,le,[d(`div`,ue,[u[9]||=d(`div`,{class:`filter-label`},`FECHA INICIO`,-1),v(x,{modelValue:q.value.fechaInicio,"onUpdate:modelValue":u[0]||=e=>q.value.fechaInicio=e,type:`date`,variant:`outlined`,density:`compact`,"hide-details":``,style:{"min-width":`160px`}},null,8,[`modelValue`])]),d(`div`,de,[u[10]||=d(`div`,{class:`filter-label`},`FECHA FIN`,-1),v(x,{modelValue:q.value.fechaFin,"onUpdate:modelValue":u[1]||=e=>q.value.fechaFin=e,type:`date`,variant:`outlined`,density:`compact`,"hide-details":``,style:{"min-width":`160px`}},null,8,[`modelValue`])]),v(t,{color:`#ec4899`,variant:`flat`,rounded:`lg`,loading:V.value,onClick:X,height:`40`},{default:r(()=>[v(b,{start:``},{default:r(()=>[...u[11]||=[h(`mdi-magnify`,-1)]]),_:1}),u[12]||=h(`Generar Reporte `,-1)]),_:1},8,[`loading`]),v(ne),U.value?(m(),c(t,{key:0,variant:`flat`,color:`#ec4899`,rounded:`lg`,height:`40`,loading:H.value,onClick:Gt},{default:r(()=>[v(b,{start:``},{default:r(()=>[...u[13]||=[h(`mdi-file-pdf-box`,-1)]]),_:1}),u[14]||=h(`Exportar PDF `,-1)]),_:1},8,[`loading`])):n(``,!0)])]),V.value?(m(),c(e,{key:0,indeterminate:``,color:`#ec4899`,height:`3`,class:`mb-4`})):n(``,!0),U.value?(m(),p(`div`,fe,[d(`div`,pe,[d(`div`,me,[v(b,{size:`18`,color:`#ec4899`},{default:r(()=>[...u[15]||=[h(`mdi-cash-multiple`,-1)]]),_:1})]),d(`div`,he,[u[16]||=d(`div`,{class:`kpi-lbl`},`BRUTO PAGADO`,-1),d(`div`,ge,a(Z(U.value.total_bruto)),1)])]),d(`div`,S,[d(`div`,C,[v(b,{size:`18`,color:`#ef4444`},{default:r(()=>[...u[17]||=[h(`mdi-minus-circle-outline`,-1)]]),_:1})]),d(`div`,w,[u[18]||=d(`div`,{class:`kpi-lbl`},`DEDUCCIONES EMP.`,-1),d(`div`,T,a(Z(U.value.total_deducciones)),1)])]),d(`div`,E,[d(`div`,D,[v(b,{size:`18`,color:`#22c55e`},{default:r(()=>[...u[19]||=[h(`mdi-bank-transfer-out`,-1)]]),_:1})]),d(`div`,O,[u[20]||=d(`div`,{class:`kpi-lbl`},`NETO PAGADO`,-1),d(`div`,k,a(Z(U.value.total_neto)),1)])]),d(`div`,A,[d(`div`,j,[v(b,{size:`18`,color:`#f59e0b`},{default:r(()=>[...u[21]||=[h(`mdi-office-building-outline`,-1)]]),_:1})]),d(`div`,M,[u[22]||=d(`div`,{class:`kpi-lbl`},`APORTES EMPLEADOR`,-1),d(`div`,N,a(Z(U.value.total_aportes_er)),1)])]),d(`div`,P,[d(`div`,F,[v(b,{size:`18`,color:`#8b5cf6`},{default:r(()=>[...u[23]||=[h(`mdi-domain`,-1)]]),_:1})]),d(`div`,I,[u[24]||=d(`div`,{class:`kpi-lbl`},`COSTO TOTAL EMPRESA`,-1),d(`div`,L,a(Z(U.value.costo_total_empresa)),1)])]),d(`div`,_e,[d(`div`,ve,[v(b,{size:`18`,color:`#06b6d4`},{default:r(()=>[...u[25]||=[h(`mdi-account-group-outline`,-1)]]),_:1})]),d(`div`,ye,[u[26]||=d(`div`,{class:`kpi-lbl`},`NÓMINAS / EMPLEADOS`,-1),d(`div`,be,a(U.value.total_nominas)+` / `+a(U.value.total_empleados),1)])])])):n(``,!0),U.value||W.value.length?(m(),p(`div`,xe,[d(`div`,Se,[(m(),p(o,null,y(Ht,e=>d(`button`,{key:e.val,class:l([`rn-tab`,{"rn-tab--active":G.value===e.val}]),onClick:t=>Wt(e.val)},[v(b,{size:`15`,class:`mr-1`},{default:r(()=>[h(a(e.icon),1)]),_:2},1024),h(a(e.label),1)],10,Ce)),64))]),!V.value&&W.value.length===0?(m(),p(`div`,we,[v(b,{size:`40`,color:`rgba(var(--v-theme-on-surface),.15)`,class:`mb-2`},{default:r(()=>[...u[27]||=[h(`mdi-file-search-outline`,-1)]]),_:1}),u[28]||=d(`div`,null,`No hay nóminas aprobadas en el período seleccionado`,-1)])):G.value===`periodo`&&W.value.length?(m(),p(`div`,Te,[d(`table`,Ee,[u[30]||=d(`thead`,null,[d(`tr`,null,[d(`th`,null,`PERÍODO`),d(`th`,{class:`ta-r`},`EMPLEADOS`),d(`th`,{class:`ta-r`},`BRUTO`),d(`th`,{class:`ta-r`},`DEDUCCIONES`),d(`th`,{class:`ta-r`},`APORTES ER`),d(`th`,{class:`ta-r`},`NETO`),d(`th`,{class:`ta-r`},`COSTO EMPRESA`)])],-1),d(`tbody`,null,[(m(!0),p(o,null,y(W.value,e=>(m(),p(`tr`,{key:e.id},[d(`td`,null,[d(`div`,De,a($(e.semana_inicio)),1),d(`div`,Oe,`al `+a($(e.semana_fin)),1)]),d(`td`,ke,a(e.empleados),1),d(`td`,Ae,a(Z(e.total_bruto)),1),d(`td`,je,a(Z(e.total_deducciones)),1),d(`td`,Me,a(Z(e.total_aportes_er)),1),d(`td`,Ne,a(Z(e.total_neto)),1),d(`td`,Pe,a(Z(e.costo_empresa)),1)]))),128))]),d(`tfoot`,null,[d(`tr`,Fe,[u[29]||=d(`td`,null,[d(`strong`,null,`TOTAL`)],-1),d(`td`,Ie,a(U.value.total_empleados),1),d(`td`,Le,a(Z(U.value.total_bruto)),1),d(`td`,Re,a(Z(U.value.total_deducciones)),1),d(`td`,ze,a(Z(U.value.total_aportes_er)),1),d(`td`,Be,a(Z(U.value.total_neto)),1),d(`td`,Ve,a(Z(U.value.costo_total_empresa)),1)])])])])):G.value===`empleado`&&W.value.length?(m(),p(`div`,He,[d(`table`,Ue,[u[32]||=d(`thead`,null,[d(`tr`,null,[d(`th`,null,`EMPLEADO`),d(`th`,{class:`ta-c`},`TIPO`),d(`th`,{class:`ta-r`},`NÓMINAS`),d(`th`,{class:`ta-r`},`HRS REG`),d(`th`,{class:`ta-r`},`HRS OT`),d(`th`,{class:`ta-r`},`BRUTO`),d(`th`,{class:`ta-r`},`DEDUCCIONES`),d(`th`,{class:`ta-r`},`APORTES ER`),d(`th`,{class:`ta-r`},`NETO`),d(`th`,{class:`ta-r`},`COSTO EMP.`)])],-1),d(`tbody`,null,[(m(!0),p(o,null,y(W.value,e=>(m(),p(`tr`,{key:e.empleado_id},[d(`td`,We,a(e.nombre),1),d(`td`,Ge,[d(`span`,{class:l(e.tipo_empleado===`W2`?`badge-w2`:`badge-1099`)},a(e.tipo_empleado),3)]),d(`td`,Ke,a(e.total_nominas),1),d(`td`,qe,a(Q(e.horas_regulares)),1),d(`td`,Je,a(Q(e.horas_overtime)),1),d(`td`,Ye,a(Z(e.total_bruto)),1),d(`td`,Xe,a(Z(e.total_deducciones)),1),d(`td`,Ze,a(Z(e.total_aportes_er)),1),d(`td`,Qe,a(Z(e.total_neto)),1),d(`td`,$e,a(Z(e.costo_empresa)),1)]))),128))]),d(`tfoot`,null,[d(`tr`,et,[u[31]||=d(`td`,{colspan:`5`},[d(`strong`,null,`TOTAL`)],-1),d(`td`,tt,a(Z(U.value.total_bruto)),1),d(`td`,R,a(Z(U.value.total_deducciones)),1),d(`td`,nt,a(Z(U.value.total_aportes_er)),1),d(`td`,rt,a(Z(U.value.total_neto)),1),d(`td`,it,a(Z(U.value.costo_total_empresa)),1)])])])])):G.value===`ccosto`&&W.value.length?(m(),p(`div`,at,[d(`table`,ot,[u[35]||=d(`thead`,null,[d(`tr`,null,[d(`th`,null,`CENTRO DE COSTO`),d(`th`,{class:`ta-c`},`CÓD.`),d(`th`,{class:`ta-r`},`EMPLEADOS`),d(`th`,{class:`ta-r`},`HORAS`),d(`th`,{class:`ta-r`},`COSTO BRUTO`),d(`th`,{class:`ta-r`},`COSTO TOTAL`),d(`th`,{class:`ta-r`},`% DEL TOTAL`)])],-1),d(`tbody`,null,[(m(!0),p(o,null,y(W.value,e=>(m(),p(`tr`,{key:e.ccosto},[d(`td`,st,a(e.ccosto_nombre),1),d(`td`,ct,a(e.ccosto),1),d(`td`,lt,a(e.empleados),1),d(`td`,ut,a(Q(e.horas)),1),d(`td`,dt,a(Z(e.costo_bruto)),1),d(`td`,ft,a(Z(e.costo_total)),1),d(`td`,pt,[d(`div`,mt,[d(`div`,{class:`pct-bar`,style:i({width:Y(e.costo_total)+`%`})},null,4),d(`span`,ht,a(Y(e.costo_total).toFixed(1))+`%`,1)])])]))),128))]),d(`tfoot`,null,[d(`tr`,gt,[u[33]||=d(`td`,{colspan:`4`},[d(`strong`,null,`TOTAL`)],-1),d(`td`,_t,a(Z(Ut.value)),1),d(`td`,vt,a(Z(J.value)),1),u[34]||=d(`td`,{class:`ta-r`},`100%`,-1)])])])])):G.value===`impuestos`&&W.value.length?(m(),p(`div`,yt,[d(`table`,bt,[u[37]||=d(`thead`,null,[d(`tr`,null,[d(`th`,null,`PERÍODO`),d(`th`,{class:`ta-r`},`FED. INC. TAX`),d(`th`,{class:`ta-r`},`SS EMP.`),d(`th`,{class:`ta-r`},`SS ER`),d(`th`,{class:`ta-r`},`MEDICARE EMP.`),d(`th`,{class:`ta-r`},`MEDICARE ER`),d(`th`,{class:`ta-r`},`FUTA`),d(`th`,{class:`ta-r`},`SUTA`),d(`th`,{class:`ta-r`},`W.COMP`),d(`th`,{class:`ta-r text-error`},`TOTAL IMP.`)])],-1),d(`tbody`,null,[(m(!0),p(o,null,y(W.value,e=>(m(),p(`tr`,{key:e.semana_inicio},[d(`td`,null,[d(`div`,xt,a($(e.semana_inicio)),1),d(`div`,St,`al `+a($(e.semana_fin)),1)]),d(`td`,Ct,a(Z(e.federal_income_tax)),1),d(`td`,wt,a(Z(e.ss_emp)),1),d(`td`,Tt,a(Z(e.ss_er)),1),d(`td`,Et,a(Z(e.medicare_emp)),1),d(`td`,Dt,a(Z(e.medicare_er)),1),d(`td`,Ot,a(Z(e.futa)),1),d(`td`,kt,a(Z(e.suta)),1),d(`td`,At,a(Z(e.workers_comp)),1),d(`td`,jt,a(Z(e.total_impuestos)),1)]))),128))]),d(`tfoot`,null,[d(`tr`,Mt,[u[36]||=d(`td`,null,[d(`strong`,null,`TOTAL`)],-1),d(`td`,Nt,a(Z(U.value.federal_income_tax)),1),d(`td`,Pt,a(Z(U.value.social_security_emp)),1),d(`td`,Ft,a(Z(U.value.social_security_er)),1),d(`td`,It,a(Z(U.value.medicare_emp)),1),d(`td`,Lt,a(Z(U.value.medicare_er)),1),d(`td`,Rt,a(Z(U.value.futa)),1),d(`td`,zt,a(Z(U.value.suta)),1),d(`td`,Bt,a(Z(U.value.workers_comp)),1),d(`td`,Vt,a(Z(+U.value.federal_income_tax+ +U.value.social_security_emp+ +U.value.social_security_er+ +U.value.medicare_emp+ +U.value.medicare_er+ +U.value.futa+ +U.value.suta+ +U.value.workers_comp)),1)])])])])):n(``,!0)])):n(``,!0)])]),_:1}))}},[[`__scopeId`,`data-v-2a668d47`]]);export{z as default};