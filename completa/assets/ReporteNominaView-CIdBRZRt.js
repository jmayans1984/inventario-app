import{p as e,t}from"./VBtn-CooEdsci.js";import{t as n}from"./MainLayout-ClLpBmV6.js";import{$t as r,Gn as i,In as a,Jn as o,On as s,Yt as c,an as l,bn as u,c as d,en as f,hn as p,i as m,in as h,nn as g,qn as _,rn as v,s as y,tn as b,vn as x}from"./index-C6Swsbwr.js";import{t as S}from"./VIcon-DiNRfrlk.js";import{t as C}from"./VTextField-Cx7sWs-9.js";import{t as ee}from"./VSpacer-Bw6DBpUu.js";var te={class:`rn-container`},ne={class:`rn-breadcrumb`},re={class:`rn-header`},ie={class:`rn-header-left`},ae={class:`rn-icon-wrap`},oe={class:`rn-filters-card`},se={class:`rn-filters-row`},ce={class:`filter-group`},le={class:`filter-group`},ue={key:1,class:`rn-kpi-grid`},de={class:`rn-kpi`,style:{"--kc":`#ec4899`}},fe={class:`kpi-icon`},pe={class:`kpi-body`},me={class:`kpi-val`},he={class:`rn-kpi`,style:{"--kc":`#ef4444`}},ge={class:`kpi-icon`},w={class:`kpi-body`},T={class:`kpi-val`,style:{color:`#ef4444`}},E={class:`rn-kpi`,style:{"--kc":`#22c55e`}},D={class:`kpi-icon`},O={class:`kpi-body`},k={class:`kpi-val`,style:{color:`#22c55e`}},A={class:`rn-kpi`,style:{"--kc":`#f59e0b`}},j={class:`kpi-icon`},M={class:`kpi-body`},N={class:`kpi-val`,style:{color:`#f59e0b`}},P={class:`rn-kpi`,style:{"--kc":`#8b5cf6`}},F={class:`kpi-icon`},I={class:`kpi-body`},L={class:`kpi-val`,style:{color:`#8b5cf6`}},_e={class:`rn-kpi`,style:{"--kc":`#06b6d4`}},ve={class:`kpi-icon`},ye={class:`kpi-body`},be={class:`kpi-val`,style:{color:`#06b6d4`}},xe={key:2,class:`rn-tabs-card`},Se={class:`rn-tabs-header`},Ce=[`onClick`],we={key:0,class:`rn-empty`},Te={key:1,class:`rn-table-wrap`},Ee={class:`rn-table`},De={class:`periodo-label`},Oe={class:`periodo-sub`},ke={class:`ta-r`},Ae={class:`ta-r font-mono`},je={class:`ta-r font-mono text-error`},Me={class:`ta-r font-mono text-warning`},Ne={class:`ta-r font-mono text-success`},Pe={class:`ta-r font-mono text-purple`},Fe={class:`rn-tfoot`},Ie={class:`ta-r`},Le={class:`ta-r font-mono`},Re={class:`ta-r font-mono text-error`},ze={class:`ta-r font-mono text-warning`},Be={class:`ta-r font-mono text-success`},Ve={class:`ta-r font-mono text-purple`},He={key:2,class:`rn-table-wrap`},Ue={class:`rn-table`},We={class:`font-weight-medium`},Ge={class:`ta-c`},Ke={class:`ta-r`},qe={class:`ta-r font-mono`},Je={class:`ta-r font-mono`},Ye={class:`ta-r font-mono`},Xe={class:`ta-r font-mono text-error`},Ze={class:`ta-r font-mono text-warning`},Qe={class:`ta-r font-mono text-success`},$e={class:`ta-r font-mono text-purple`},et={class:`rn-tfoot`},tt={class:`ta-r font-mono`},nt={class:`ta-r font-mono text-error`},rt={class:`ta-r font-mono text-warning`},R={class:`ta-r font-mono text-success`},it={class:`ta-r font-mono text-purple`},at={key:3,class:`rn-table-wrap`},ot={class:`rn-table`},st={class:`font-weight-medium`},ct={class:`ta-c text-caption font-mono`,style:{color:`rgba(var(--v-theme-on-surface),.5)`}},lt={class:`ta-r`},ut={class:`ta-r font-mono`},dt={class:`ta-r font-mono`},ft={class:`ta-r font-mono text-purple`},pt={class:`ta-r`},mt={class:`pct-bar-wrap`},ht={class:`pct-label`},gt={class:`rn-tfoot`},_t={class:`ta-r font-mono`},vt={class:`ta-r font-mono text-purple`},yt={key:4,class:`rn-table-wrap`},bt={class:`rn-table`},xt={class:`periodo-label`},St={class:`periodo-sub`},Ct={class:`ta-r font-mono`},wt={class:`ta-r font-mono`},Tt={class:`ta-r font-mono`},Et={class:`ta-r font-mono`},Dt={class:`ta-r font-mono`},Ot={class:`ta-r font-mono`},kt={class:`ta-r font-mono`},At={class:`ta-r font-mono`},jt={class:`ta-r font-mono text-error font-weight-bold`},Mt={class:`rn-tfoot`},Nt={class:`ta-r font-mono`},Pt={class:`ta-r font-mono`},Ft={class:`ta-r font-mono`},It={class:`ta-r font-mono`},Lt={class:`ta-r font-mono`},Rt={class:`ta-r font-mono`},zt={class:`ta-r font-mono`},Bt={class:`ta-r font-mono`},Vt={class:`ta-r font-mono text-error font-weight-bold`},z=m({__name:`ReporteNominaView`,setup(m){let z=y(),B=()=>z.empresaCodigo||z.empresa||localStorage.getItem(`empresaActual`),V=a(!1),H=a(!1),U=a(null),W=a([]),G=a(`periodo`);a({periodo:[],empleado:[],ccosto:[],impuestos:[]});let K=new Date().getFullYear(),q=a({fechaInicio:`${K}-01-01`,fechaFin:`${K}-12-31`}),Ht=[{val:`periodo`,label:`Por Período`,icon:`mdi-calendar-range-outline`},{val:`empleado`,label:`Por Empleado`,icon:`mdi-account-group-outline`},{val:`ccosto`,label:`Por Centro de Costo`,icon:`mdi-sitemap-outline`},{val:`impuestos`,label:`Impuestos y Taxes`,icon:`mdi-receipt-text-outline`}],Ut=r(()=>W.value.reduce((e,t)=>e+parseFloat(t.costo_bruto||0),0)),J=r(()=>W.value.reduce((e,t)=>e+parseFloat(t.costo_total||0),0));function Y(e){let t=J.value;return t>0?parseFloat(e)/t*100:0}async function X(){V.value=!0;try{let e=B(),t=new URLSearchParams({empresa:e,fechaInicio:q.value.fechaInicio,fechaFin:q.value.fechaFin,vista:G.value}),n=await(await fetch(`${d}/nomina/reporte?${t}`)).json();if(!n.success)throw Error(n.error);U.value=n.kpis,W.value=n.data||[]}catch(e){console.error(e)}finally{V.value=!1}}async function Wt(e){G.value=e,await X()}function Z(e){return`$`+(parseFloat(e)||0).toLocaleString(`en-US`,{minimumFractionDigits:2,maximumFractionDigits:2})}function Q(e){return(parseFloat(e)||0).toLocaleString(`en-US`,{minimumFractionDigits:2,maximumFractionDigits:2})}function $(e){if(!e)return`—`;let[t,n,r]=String(e).split(`T`)[0].split(`-`);return`${n}/${r}/${t}`}async function Gt(){if(U.value){H.value=!0;try{let e={empresa:B(),fechaInicio:q.value.fechaInicio,fechaFin:q.value.fechaFin},[t,n,r,i]=await Promise.all([fetch(`${d}/nomina/reporte?${new URLSearchParams({...e,vista:`periodo`})}`).then(e=>e.json()),fetch(`${d}/nomina/reporte?${new URLSearchParams({...e,vista:`empleado`})}`).then(e=>e.json()),fetch(`${d}/nomina/reporte?${new URLSearchParams({...e,vista:`ccosto`})}`).then(e=>e.json()),fetch(`${d}/nomina/reporte?${new URLSearchParams({...e,vista:`impuestos`})}`).then(e=>e.json())]),a=U.value,o=t.data||[],s=n.data||[],c=r.data||[],l=i.data||[],u=c.reduce((e,t)=>e+parseFloat(t.costo_bruto||0),0),f=c.reduce((e,t)=>e+parseFloat(t.costo_total||0),0);l.reduce((e,t)=>e+parseFloat(t.total_impuestos||0),0);let p=`
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
            <td>${Z(u)}</td>
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
      </body></html>`,y=window.open(``,`_blank`);if(!y){alert(`Activa los pop-ups para generar el PDF`);return}y.document.write(v),y.document.close(),y.focus()}catch(e){console.error(e)}finally{H.value=!1}}}return p(X),(r,a)=>(x(),b(n,null,{default:s(()=>[f(`div`,te,[f(`div`,ne,[a[4]||=f(`span`,{class:`bc-root`},`NÓMINA`,-1),l(S,{size:`13`,class:`bc-sep`},{default:s(()=>[...a[2]||=[h(`mdi-chevron-right`,-1)]]),_:1}),a[5]||=f(`span`,{class:`bc-cat`},`Reportes`,-1),l(S,{size:`13`,class:`bc-sep`},{default:s(()=>[...a[3]||=[h(`mdi-chevron-right`,-1)]]),_:1}),a[6]||=f(`span`,{class:`bc-current`},`Reporte de Nómina`,-1)]),f(`div`,re,[f(`div`,ie,[f(`div`,ae,[l(S,{size:`22`,color:`white`},{default:s(()=>[...a[7]||=[h(`mdi-chart-bar`,-1)]]),_:1})]),a[8]||=f(`div`,null,[f(`h1`,{class:`rn-title`},`REPORTE DE NÓMINA`),f(`p`,{class:`rn-sub`},`Análisis de costos por período, empleado, centro de costo e impuestos`)],-1)])]),f(`div`,oe,[f(`div`,se,[f(`div`,ce,[a[9]||=f(`div`,{class:`filter-label`},`FECHA INICIO`,-1),l(C,{modelValue:q.value.fechaInicio,"onUpdate:modelValue":a[0]||=e=>q.value.fechaInicio=e,type:`date`,variant:`outlined`,density:`compact`,"hide-details":``,style:{"min-width":`160px`}},null,8,[`modelValue`])]),f(`div`,le,[a[10]||=f(`div`,{class:`filter-label`},`FECHA FIN`,-1),l(C,{modelValue:q.value.fechaFin,"onUpdate:modelValue":a[1]||=e=>q.value.fechaFin=e,type:`date`,variant:`outlined`,density:`compact`,"hide-details":``,style:{"min-width":`160px`}},null,8,[`modelValue`])]),l(t,{color:`#ec4899`,variant:`flat`,rounded:`lg`,loading:V.value,onClick:X,height:`40`},{default:s(()=>[l(S,{start:``},{default:s(()=>[...a[11]||=[h(`mdi-magnify`,-1)]]),_:1}),a[12]||=h(`Generar Reporte `,-1)]),_:1},8,[`loading`]),l(ee),U.value?(x(),b(t,{key:0,variant:`flat`,color:`#ec4899`,rounded:`lg`,height:`40`,loading:H.value,onClick:Gt},{default:s(()=>[l(S,{start:``},{default:s(()=>[...a[13]||=[h(`mdi-file-pdf-box`,-1)]]),_:1}),a[14]||=h(`Exportar PDF `,-1)]),_:1},8,[`loading`])):g(``,!0)])]),V.value?(x(),b(e,{key:0,indeterminate:``,color:`#ec4899`,height:`3`,class:`mb-4`})):g(``,!0),U.value?(x(),v(`div`,ue,[f(`div`,de,[f(`div`,fe,[l(S,{size:`18`,color:`#ec4899`},{default:s(()=>[...a[15]||=[h(`mdi-cash-multiple`,-1)]]),_:1})]),f(`div`,pe,[a[16]||=f(`div`,{class:`kpi-lbl`},`BRUTO PAGADO`,-1),f(`div`,me,o(Z(U.value.total_bruto)),1)])]),f(`div`,he,[f(`div`,ge,[l(S,{size:`18`,color:`#ef4444`},{default:s(()=>[...a[17]||=[h(`mdi-minus-circle-outline`,-1)]]),_:1})]),f(`div`,w,[a[18]||=f(`div`,{class:`kpi-lbl`},`DEDUCCIONES EMP.`,-1),f(`div`,T,o(Z(U.value.total_deducciones)),1)])]),f(`div`,E,[f(`div`,D,[l(S,{size:`18`,color:`#22c55e`},{default:s(()=>[...a[19]||=[h(`mdi-bank-transfer-out`,-1)]]),_:1})]),f(`div`,O,[a[20]||=f(`div`,{class:`kpi-lbl`},`NETO PAGADO`,-1),f(`div`,k,o(Z(U.value.total_neto)),1)])]),f(`div`,A,[f(`div`,j,[l(S,{size:`18`,color:`#f59e0b`},{default:s(()=>[...a[21]||=[h(`mdi-office-building-outline`,-1)]]),_:1})]),f(`div`,M,[a[22]||=f(`div`,{class:`kpi-lbl`},`APORTES EMPLEADOR`,-1),f(`div`,N,o(Z(U.value.total_aportes_er)),1)])]),f(`div`,P,[f(`div`,F,[l(S,{size:`18`,color:`#8b5cf6`},{default:s(()=>[...a[23]||=[h(`mdi-domain`,-1)]]),_:1})]),f(`div`,I,[a[24]||=f(`div`,{class:`kpi-lbl`},`COSTO TOTAL EMPRESA`,-1),f(`div`,L,o(Z(U.value.costo_total_empresa)),1)])]),f(`div`,_e,[f(`div`,ve,[l(S,{size:`18`,color:`#06b6d4`},{default:s(()=>[...a[25]||=[h(`mdi-account-group-outline`,-1)]]),_:1})]),f(`div`,ye,[a[26]||=f(`div`,{class:`kpi-lbl`},`NÓMINAS / EMPLEADOS`,-1),f(`div`,be,o(U.value.total_nominas)+` / `+o(U.value.total_empleados),1)])])])):g(``,!0),U.value||W.value.length?(x(),v(`div`,xe,[f(`div`,Se,[(x(),v(c,null,u(Ht,e=>f(`button`,{key:e.val,class:i([`rn-tab`,{"rn-tab--active":G.value===e.val}]),onClick:t=>Wt(e.val)},[l(S,{size:`15`,class:`mr-1`},{default:s(()=>[h(o(e.icon),1)]),_:2},1024),h(o(e.label),1)],10,Ce)),64))]),!V.value&&W.value.length===0?(x(),v(`div`,we,[l(S,{size:`40`,color:`rgba(var(--v-theme-on-surface),.15)`,class:`mb-2`},{default:s(()=>[...a[27]||=[h(`mdi-file-search-outline`,-1)]]),_:1}),a[28]||=f(`div`,null,`No hay nóminas aprobadas en el período seleccionado`,-1)])):G.value===`periodo`&&W.value.length?(x(),v(`div`,Te,[f(`table`,Ee,[a[30]||=f(`thead`,null,[f(`tr`,null,[f(`th`,null,`PERÍODO`),f(`th`,{class:`ta-r`},`EMPLEADOS`),f(`th`,{class:`ta-r`},`BRUTO`),f(`th`,{class:`ta-r`},`DEDUCCIONES`),f(`th`,{class:`ta-r`},`APORTES ER`),f(`th`,{class:`ta-r`},`NETO`),f(`th`,{class:`ta-r`},`COSTO EMPRESA`)])],-1),f(`tbody`,null,[(x(!0),v(c,null,u(W.value,e=>(x(),v(`tr`,{key:e.id},[f(`td`,null,[f(`div`,De,o($(e.semana_inicio)),1),f(`div`,Oe,`al `+o($(e.semana_fin)),1)]),f(`td`,ke,o(e.empleados),1),f(`td`,Ae,o(Z(e.total_bruto)),1),f(`td`,je,o(Z(e.total_deducciones)),1),f(`td`,Me,o(Z(e.total_aportes_er)),1),f(`td`,Ne,o(Z(e.total_neto)),1),f(`td`,Pe,o(Z(e.costo_empresa)),1)]))),128))]),f(`tfoot`,null,[f(`tr`,Fe,[a[29]||=f(`td`,null,[f(`strong`,null,`TOTAL`)],-1),f(`td`,Ie,o(U.value.total_empleados),1),f(`td`,Le,o(Z(U.value.total_bruto)),1),f(`td`,Re,o(Z(U.value.total_deducciones)),1),f(`td`,ze,o(Z(U.value.total_aportes_er)),1),f(`td`,Be,o(Z(U.value.total_neto)),1),f(`td`,Ve,o(Z(U.value.costo_total_empresa)),1)])])])])):G.value===`empleado`&&W.value.length?(x(),v(`div`,He,[f(`table`,Ue,[a[32]||=f(`thead`,null,[f(`tr`,null,[f(`th`,null,`EMPLEADO`),f(`th`,{class:`ta-c`},`TIPO`),f(`th`,{class:`ta-r`},`NÓMINAS`),f(`th`,{class:`ta-r`},`HRS REG`),f(`th`,{class:`ta-r`},`HRS OT`),f(`th`,{class:`ta-r`},`BRUTO`),f(`th`,{class:`ta-r`},`DEDUCCIONES`),f(`th`,{class:`ta-r`},`APORTES ER`),f(`th`,{class:`ta-r`},`NETO`),f(`th`,{class:`ta-r`},`COSTO EMP.`)])],-1),f(`tbody`,null,[(x(!0),v(c,null,u(W.value,e=>(x(),v(`tr`,{key:e.empleado_id},[f(`td`,We,o(e.nombre),1),f(`td`,Ge,[f(`span`,{class:i(e.tipo_empleado===`W2`?`badge-w2`:`badge-1099`)},o(e.tipo_empleado),3)]),f(`td`,Ke,o(e.total_nominas),1),f(`td`,qe,o(Q(e.horas_regulares)),1),f(`td`,Je,o(Q(e.horas_overtime)),1),f(`td`,Ye,o(Z(e.total_bruto)),1),f(`td`,Xe,o(Z(e.total_deducciones)),1),f(`td`,Ze,o(Z(e.total_aportes_er)),1),f(`td`,Qe,o(Z(e.total_neto)),1),f(`td`,$e,o(Z(e.costo_empresa)),1)]))),128))]),f(`tfoot`,null,[f(`tr`,et,[a[31]||=f(`td`,{colspan:`5`},[f(`strong`,null,`TOTAL`)],-1),f(`td`,tt,o(Z(U.value.total_bruto)),1),f(`td`,nt,o(Z(U.value.total_deducciones)),1),f(`td`,rt,o(Z(U.value.total_aportes_er)),1),f(`td`,R,o(Z(U.value.total_neto)),1),f(`td`,it,o(Z(U.value.costo_total_empresa)),1)])])])])):G.value===`ccosto`&&W.value.length?(x(),v(`div`,at,[f(`table`,ot,[a[35]||=f(`thead`,null,[f(`tr`,null,[f(`th`,null,`CENTRO DE COSTO`),f(`th`,{class:`ta-c`},`CÓD.`),f(`th`,{class:`ta-r`},`EMPLEADOS`),f(`th`,{class:`ta-r`},`HORAS`),f(`th`,{class:`ta-r`},`COSTO BRUTO`),f(`th`,{class:`ta-r`},`COSTO TOTAL`),f(`th`,{class:`ta-r`},`% DEL TOTAL`)])],-1),f(`tbody`,null,[(x(!0),v(c,null,u(W.value,e=>(x(),v(`tr`,{key:e.ccosto},[f(`td`,st,o(e.ccosto_nombre),1),f(`td`,ct,o(e.ccosto),1),f(`td`,lt,o(e.empleados),1),f(`td`,ut,o(Q(e.horas)),1),f(`td`,dt,o(Z(e.costo_bruto)),1),f(`td`,ft,o(Z(e.costo_total)),1),f(`td`,pt,[f(`div`,mt,[f(`div`,{class:`pct-bar`,style:_({width:Y(e.costo_total)+`%`})},null,4),f(`span`,ht,o(Y(e.costo_total).toFixed(1))+`%`,1)])])]))),128))]),f(`tfoot`,null,[f(`tr`,gt,[a[33]||=f(`td`,{colspan:`4`},[f(`strong`,null,`TOTAL`)],-1),f(`td`,_t,o(Z(Ut.value)),1),f(`td`,vt,o(Z(J.value)),1),a[34]||=f(`td`,{class:`ta-r`},`100%`,-1)])])])])):G.value===`impuestos`&&W.value.length?(x(),v(`div`,yt,[f(`table`,bt,[a[37]||=f(`thead`,null,[f(`tr`,null,[f(`th`,null,`PERÍODO`),f(`th`,{class:`ta-r`},`FED. INC. TAX`),f(`th`,{class:`ta-r`},`SS EMP.`),f(`th`,{class:`ta-r`},`SS ER`),f(`th`,{class:`ta-r`},`MEDICARE EMP.`),f(`th`,{class:`ta-r`},`MEDICARE ER`),f(`th`,{class:`ta-r`},`FUTA`),f(`th`,{class:`ta-r`},`SUTA`),f(`th`,{class:`ta-r`},`W.COMP`),f(`th`,{class:`ta-r text-error`},`TOTAL IMP.`)])],-1),f(`tbody`,null,[(x(!0),v(c,null,u(W.value,e=>(x(),v(`tr`,{key:e.semana_inicio},[f(`td`,null,[f(`div`,xt,o($(e.semana_inicio)),1),f(`div`,St,`al `+o($(e.semana_fin)),1)]),f(`td`,Ct,o(Z(e.federal_income_tax)),1),f(`td`,wt,o(Z(e.ss_emp)),1),f(`td`,Tt,o(Z(e.ss_er)),1),f(`td`,Et,o(Z(e.medicare_emp)),1),f(`td`,Dt,o(Z(e.medicare_er)),1),f(`td`,Ot,o(Z(e.futa)),1),f(`td`,kt,o(Z(e.suta)),1),f(`td`,At,o(Z(e.workers_comp)),1),f(`td`,jt,o(Z(e.total_impuestos)),1)]))),128))]),f(`tfoot`,null,[f(`tr`,Mt,[a[36]||=f(`td`,null,[f(`strong`,null,`TOTAL`)],-1),f(`td`,Nt,o(Z(U.value.federal_income_tax)),1),f(`td`,Pt,o(Z(U.value.social_security_emp)),1),f(`td`,Ft,o(Z(U.value.social_security_er)),1),f(`td`,It,o(Z(U.value.medicare_emp)),1),f(`td`,Lt,o(Z(U.value.medicare_er)),1),f(`td`,Rt,o(Z(U.value.futa)),1),f(`td`,zt,o(Z(U.value.suta)),1),f(`td`,Bt,o(Z(U.value.workers_comp)),1),f(`td`,Vt,o(Z(+U.value.federal_income_tax+ +U.value.social_security_emp+ +U.value.social_security_er+ +U.value.medicare_emp+ +U.value.medicare_er+ +U.value.futa+ +U.value.suta+ +U.value.workers_comp)),1)])])])])):g(``,!0)])):g(``,!0)])]),_:1}))}},[[`__scopeId`,`data-v-7722ffab`]]);export{z as default};