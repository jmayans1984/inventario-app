import{p as e,t}from"./VBtn-Bkn9bau6.js";import{t as n}from"./MainLayout-Bbs6TZAi.js";import{An as r,Rn as i,Sn as a,Xn as o,Xt as s,Yn as c,_n as l,bn as u,c as d,en as f,i as p,in as m,nn as h,on as g,qn as _,rn as v,s as y,sn as b,tn as x}from"./index-XxQ0hXtu.js";import{t as S}from"./VIcon-blCSi6-Z.js";import{t as C}from"./VTextField-CA7wlXPu.js";import{t as ee}from"./VSpacer-DxICi8BW.js";var te={class:`rn-container`},ne={class:`rn-breadcrumb`},re={class:`rn-header`},ie={class:`rn-header-left`},ae={class:`rn-icon-wrap`},oe={class:`rn-filters-card`},se={class:`rn-filters-row`},ce={class:`filter-group`},le={class:`filter-group`},ue={key:1,class:`rn-kpi-grid`},de={class:`rn-kpi`,style:{"--kc":`#ec4899`}},fe={class:`kpi-icon`},pe={class:`kpi-body`},me={class:`kpi-val`},he={class:`rn-kpi`,style:{"--kc":`#ef4444`}},ge={class:`kpi-icon`},w={class:`kpi-body`},T={class:`kpi-val`,style:{color:`#ef4444`}},E={class:`rn-kpi`,style:{"--kc":`#22c55e`}},D={class:`kpi-icon`},O={class:`kpi-body`},k={class:`kpi-val`,style:{color:`#22c55e`}},A={class:`rn-kpi`,style:{"--kc":`#f59e0b`}},j={class:`kpi-icon`},M={class:`kpi-body`},N={class:`kpi-val`,style:{color:`#f59e0b`}},P={class:`rn-kpi`,style:{"--kc":`#8b5cf6`}},F={class:`kpi-icon`},I={class:`kpi-body`},L={class:`kpi-val`,style:{color:`#8b5cf6`}},_e={class:`rn-kpi`,style:{"--kc":`#06b6d4`}},ve={class:`kpi-icon`},ye={class:`kpi-body`},be={class:`kpi-val`,style:{color:`#06b6d4`}},xe={key:2,class:`rn-tabs-card`},Se={class:`rn-tabs-header`},Ce=[`onClick`],we={key:0,class:`rn-empty`},Te={key:1,class:`rn-table-wrap`},Ee={class:`rn-table`},De={class:`periodo-label`},Oe={class:`periodo-sub`},ke={class:`ta-r`},Ae={class:`ta-r font-mono`},je={class:`ta-r font-mono text-error`},Me={class:`ta-r font-mono text-warning`},Ne={class:`ta-r font-mono text-success`},Pe={class:`ta-r font-mono text-purple`},Fe={class:`rn-tfoot`},Ie={class:`ta-r`},Le={class:`ta-r font-mono`},Re={class:`ta-r font-mono text-error`},ze={class:`ta-r font-mono text-warning`},Be={class:`ta-r font-mono text-success`},Ve={class:`ta-r font-mono text-purple`},He={key:2,class:`rn-table-wrap`},Ue={class:`rn-table`},We={class:`font-weight-medium`},Ge={class:`ta-c`},Ke={class:`ta-r`},qe={class:`ta-r font-mono`},Je={class:`ta-r font-mono`},Ye={class:`ta-r font-mono`},Xe={class:`ta-r font-mono text-error`},Ze={class:`ta-r font-mono text-warning`},Qe={class:`ta-r font-mono text-success`},$e={class:`ta-r font-mono text-purple`},et={class:`rn-tfoot`},tt={class:`ta-r font-mono`},nt={class:`ta-r font-mono text-error`},rt={class:`ta-r font-mono text-warning`},it={class:`ta-r font-mono text-success`},at={class:`ta-r font-mono text-purple`},R={key:3,class:`rn-table-wrap`},ot={class:`rn-table`},st={class:`font-weight-medium`},ct={class:`ta-c text-caption font-mono`,style:{color:`rgba(var(--v-theme-on-surface),.5)`}},lt={class:`ta-r`},ut={class:`ta-r font-mono`},dt={class:`ta-r font-mono`},ft={class:`ta-r font-mono text-purple`},pt={class:`ta-r`},mt={class:`pct-bar-wrap`},ht={class:`pct-label`},gt={class:`rn-tfoot`},_t={class:`ta-r font-mono`},vt={class:`ta-r font-mono text-purple`},yt={key:4,class:`rn-table-wrap`},bt={class:`rn-table`},xt={class:`periodo-label`},St={class:`periodo-sub`},Ct={class:`ta-r font-mono`},wt={class:`ta-r font-mono`},Tt={class:`ta-r font-mono`},Et={class:`ta-r font-mono`},Dt={class:`ta-r font-mono`},Ot={class:`ta-r font-mono`},kt={class:`ta-r font-mono`},At={class:`ta-r font-mono`},jt={class:`ta-r font-mono text-error font-weight-bold`},Mt={class:`rn-tfoot`},Nt={class:`ta-r font-mono`},Pt={class:`ta-r font-mono`},Ft={class:`ta-r font-mono`},It={class:`ta-r font-mono`},Lt={class:`ta-r font-mono`},Rt={class:`ta-r font-mono`},zt={class:`ta-r font-mono`},Bt={class:`ta-r font-mono`},Vt={class:`ta-r font-mono text-error font-weight-bold`},z=p({__name:`ReporteNominaView`,setup(p){let z=y(),B=()=>z.empresaCodigo||z.empresa||localStorage.getItem(`empresaActual`),V=i(!1),H=i(!1),U=i(null),W=i([]),G=i(`periodo`);i({periodo:[],empleado:[],ccosto:[],impuestos:[]});let K=new Date().getFullYear(),q=i({fechaInicio:`${K}-01-01`,fechaFin:`${K}-12-31`}),Ht=[{val:`periodo`,label:`Por Período`,icon:`mdi-calendar-range-outline`},{val:`empleado`,label:`Por Empleado`,icon:`mdi-account-group-outline`},{val:`ccosto`,label:`Por Centro de Costo`,icon:`mdi-sitemap-outline`},{val:`impuestos`,label:`Impuestos y Taxes`,icon:`mdi-receipt-text-outline`}],Ut=f(()=>W.value.reduce((e,t)=>e+parseFloat(t.costo_bruto||0),0)),J=f(()=>W.value.reduce((e,t)=>e+parseFloat(t.costo_total||0),0));function Y(e){let t=J.value;return t>0?parseFloat(e)/t*100:0}async function X(){V.value=!0;try{let e=B(),t=new URLSearchParams({empresa:e,fechaInicio:q.value.fechaInicio,fechaFin:q.value.fechaFin,vista:G.value}),n=await(await fetch(`${d}/nomina/reporte?${t}`)).json();if(!n.success)throw Error(n.error);U.value=n.kpis,W.value=n.data||[]}catch(e){console.error(e)}finally{V.value=!1}}async function Wt(e){G.value=e,await X()}function Z(e){return`$`+(parseFloat(e)||0).toLocaleString(`en-US`,{minimumFractionDigits:2,maximumFractionDigits:2})}function Q(e){return(parseFloat(e)||0).toLocaleString(`en-US`,{minimumFractionDigits:2,maximumFractionDigits:2})}function $(e){if(!e)return`—`;let[t,n,r]=String(e).split(`T`)[0].split(`-`);return`${n}/${r}/${t}`}async function Gt(){if(U.value){H.value=!0;try{let e={empresa:B(),fechaInicio:q.value.fechaInicio,fechaFin:q.value.fechaFin},[t,n,r,i]=await Promise.all([fetch(`${d}/nomina/reporte?${new URLSearchParams({...e,vista:`periodo`})}`).then(e=>e.json()),fetch(`${d}/nomina/reporte?${new URLSearchParams({...e,vista:`empleado`})}`).then(e=>e.json()),fetch(`${d}/nomina/reporte?${new URLSearchParams({...e,vista:`ccosto`})}`).then(e=>e.json()),fetch(`${d}/nomina/reporte?${new URLSearchParams({...e,vista:`impuestos`})}`).then(e=>e.json())]),a=U.value,o=t.data||[],s=n.data||[],c=r.data||[],l=i.data||[],u=c.reduce((e,t)=>e+parseFloat(t.costo_bruto||0),0),f=c.reduce((e,t)=>e+parseFloat(t.costo_total||0),0);l.reduce((e,t)=>e+parseFloat(t.total_impuestos||0),0);let p=`
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
        ${p}
        ${m}
        ${h}
        ${g}
      </body></html>`,y=window.open(``,`_blank`);if(!y){alert(`Activa los pop-ups para generar el PDF`);return}y.document.write(v),y.document.close(),y.focus()}catch(e){console.error(e)}finally{H.value=!1}}}return l(X),(i,l)=>(u(),h(n,null,{default:r(()=>[x(`div`,te,[x(`div`,ne,[l[4]||=x(`span`,{class:`bc-root`},`NÓMINA`,-1),b(S,{size:`13`,class:`bc-sep`},{default:r(()=>[...l[2]||=[g(`mdi-chevron-right`,-1)]]),_:1}),l[5]||=x(`span`,{class:`bc-cat`},`Reportes`,-1),b(S,{size:`13`,class:`bc-sep`},{default:r(()=>[...l[3]||=[g(`mdi-chevron-right`,-1)]]),_:1}),l[6]||=x(`span`,{class:`bc-current`},`Reporte de Nómina`,-1)]),x(`div`,re,[x(`div`,ie,[x(`div`,ae,[b(S,{size:`22`,color:`white`},{default:r(()=>[...l[7]||=[g(`mdi-chart-bar`,-1)]]),_:1})]),l[8]||=x(`div`,null,[x(`h1`,{class:`rn-title`},`REPORTE DE NÓMINA`),x(`p`,{class:`rn-sub`},`Análisis de costos por período, empleado, centro de costo e impuestos`)],-1)])]),x(`div`,oe,[x(`div`,se,[x(`div`,ce,[l[9]||=x(`div`,{class:`filter-label`},`FECHA INICIO`,-1),b(C,{modelValue:q.value.fechaInicio,"onUpdate:modelValue":l[0]||=e=>q.value.fechaInicio=e,type:`date`,variant:`outlined`,density:`compact`,"hide-details":``,style:{"min-width":`160px`}},null,8,[`modelValue`])]),x(`div`,le,[l[10]||=x(`div`,{class:`filter-label`},`FECHA FIN`,-1),b(C,{modelValue:q.value.fechaFin,"onUpdate:modelValue":l[1]||=e=>q.value.fechaFin=e,type:`date`,variant:`outlined`,density:`compact`,"hide-details":``,style:{"min-width":`160px`}},null,8,[`modelValue`])]),b(t,{color:`#ec4899`,variant:`flat`,rounded:`lg`,loading:V.value,onClick:X,height:`40`},{default:r(()=>[b(S,{start:``},{default:r(()=>[...l[11]||=[g(`mdi-magnify`,-1)]]),_:1}),l[12]||=g(`Generar Reporte `,-1)]),_:1},8,[`loading`]),b(ee),U.value?(u(),h(t,{key:0,variant:`flat`,color:`#ec4899`,rounded:`lg`,height:`40`,loading:H.value,onClick:Gt},{default:r(()=>[b(S,{start:``},{default:r(()=>[...l[13]||=[g(`mdi-file-pdf-box`,-1)]]),_:1}),l[14]||=g(`Exportar PDF `,-1)]),_:1},8,[`loading`])):v(``,!0)])]),V.value?(u(),h(e,{key:0,indeterminate:``,color:`#ec4899`,height:`3`,class:`mb-4`})):v(``,!0),U.value?(u(),m(`div`,ue,[x(`div`,de,[x(`div`,fe,[b(S,{size:`18`,color:`#ec4899`},{default:r(()=>[...l[15]||=[g(`mdi-cash-multiple`,-1)]]),_:1})]),x(`div`,pe,[l[16]||=x(`div`,{class:`kpi-lbl`},`BRUTO PAGADO`,-1),x(`div`,me,o(Z(U.value.total_bruto)),1)])]),x(`div`,he,[x(`div`,ge,[b(S,{size:`18`,color:`#ef4444`},{default:r(()=>[...l[17]||=[g(`mdi-minus-circle-outline`,-1)]]),_:1})]),x(`div`,w,[l[18]||=x(`div`,{class:`kpi-lbl`},`DEDUCCIONES EMP.`,-1),x(`div`,T,o(Z(U.value.total_deducciones)),1)])]),x(`div`,E,[x(`div`,D,[b(S,{size:`18`,color:`#22c55e`},{default:r(()=>[...l[19]||=[g(`mdi-bank-transfer-out`,-1)]]),_:1})]),x(`div`,O,[l[20]||=x(`div`,{class:`kpi-lbl`},`NETO PAGADO`,-1),x(`div`,k,o(Z(U.value.total_neto)),1)])]),x(`div`,A,[x(`div`,j,[b(S,{size:`18`,color:`#f59e0b`},{default:r(()=>[...l[21]||=[g(`mdi-office-building-outline`,-1)]]),_:1})]),x(`div`,M,[l[22]||=x(`div`,{class:`kpi-lbl`},`APORTES EMPLEADOR`,-1),x(`div`,N,o(Z(U.value.total_aportes_er)),1)])]),x(`div`,P,[x(`div`,F,[b(S,{size:`18`,color:`#8b5cf6`},{default:r(()=>[...l[23]||=[g(`mdi-domain`,-1)]]),_:1})]),x(`div`,I,[l[24]||=x(`div`,{class:`kpi-lbl`},`COSTO TOTAL EMPRESA`,-1),x(`div`,L,o(Z(U.value.costo_total_empresa)),1)])]),x(`div`,_e,[x(`div`,ve,[b(S,{size:`18`,color:`#06b6d4`},{default:r(()=>[...l[25]||=[g(`mdi-account-group-outline`,-1)]]),_:1})]),x(`div`,ye,[l[26]||=x(`div`,{class:`kpi-lbl`},`NÓMINAS / EMPLEADOS`,-1),x(`div`,be,o(U.value.total_nominas)+` / `+o(U.value.total_empleados),1)])])])):v(``,!0),U.value||W.value.length?(u(),m(`div`,xe,[x(`div`,Se,[(u(),m(s,null,a(Ht,e=>x(`button`,{key:e.val,class:_([`rn-tab`,{"rn-tab--active":G.value===e.val}]),onClick:t=>Wt(e.val)},[b(S,{size:`15`,class:`mr-1`},{default:r(()=>[g(o(e.icon),1)]),_:2},1024),g(o(e.label),1)],10,Ce)),64))]),!V.value&&W.value.length===0?(u(),m(`div`,we,[b(S,{size:`40`,color:`rgba(var(--v-theme-on-surface),.15)`,class:`mb-2`},{default:r(()=>[...l[27]||=[g(`mdi-file-search-outline`,-1)]]),_:1}),l[28]||=x(`div`,null,`No hay nóminas aprobadas en el período seleccionado`,-1)])):G.value===`periodo`&&W.value.length?(u(),m(`div`,Te,[x(`table`,Ee,[l[30]||=x(`thead`,null,[x(`tr`,null,[x(`th`,null,`PERÍODO`),x(`th`,{class:`ta-r`},`EMPLEADOS`),x(`th`,{class:`ta-r`},`BRUTO`),x(`th`,{class:`ta-r`},`DEDUCCIONES`),x(`th`,{class:`ta-r`},`APORTES ER`),x(`th`,{class:`ta-r`},`NETO`),x(`th`,{class:`ta-r`},`COSTO EMPRESA`)])],-1),x(`tbody`,null,[(u(!0),m(s,null,a(W.value,e=>(u(),m(`tr`,{key:e.id},[x(`td`,null,[x(`div`,De,o($(e.semana_inicio)),1),x(`div`,Oe,`al `+o($(e.semana_fin)),1)]),x(`td`,ke,o(e.empleados),1),x(`td`,Ae,o(Z(e.total_bruto)),1),x(`td`,je,o(Z(e.total_deducciones)),1),x(`td`,Me,o(Z(e.total_aportes_er)),1),x(`td`,Ne,o(Z(e.total_neto)),1),x(`td`,Pe,o(Z(e.costo_empresa)),1)]))),128))]),x(`tfoot`,null,[x(`tr`,Fe,[l[29]||=x(`td`,null,[x(`strong`,null,`TOTAL`)],-1),x(`td`,Ie,o(U.value.total_empleados),1),x(`td`,Le,o(Z(U.value.total_bruto)),1),x(`td`,Re,o(Z(U.value.total_deducciones)),1),x(`td`,ze,o(Z(U.value.total_aportes_er)),1),x(`td`,Be,o(Z(U.value.total_neto)),1),x(`td`,Ve,o(Z(U.value.costo_total_empresa)),1)])])])])):G.value===`empleado`&&W.value.length?(u(),m(`div`,He,[x(`table`,Ue,[l[32]||=x(`thead`,null,[x(`tr`,null,[x(`th`,null,`EMPLEADO`),x(`th`,{class:`ta-c`},`TIPO`),x(`th`,{class:`ta-r`},`NÓMINAS`),x(`th`,{class:`ta-r`},`HRS REG`),x(`th`,{class:`ta-r`},`HRS OT`),x(`th`,{class:`ta-r`},`BRUTO`),x(`th`,{class:`ta-r`},`DEDUCCIONES`),x(`th`,{class:`ta-r`},`APORTES ER`),x(`th`,{class:`ta-r`},`NETO`),x(`th`,{class:`ta-r`},`COSTO EMP.`)])],-1),x(`tbody`,null,[(u(!0),m(s,null,a(W.value,e=>(u(),m(`tr`,{key:e.empleado_id},[x(`td`,We,o(e.nombre),1),x(`td`,Ge,[x(`span`,{class:_(e.tipo_empleado===`W2`?`badge-w2`:`badge-1099`)},o(e.tipo_empleado),3)]),x(`td`,Ke,o(e.total_nominas),1),x(`td`,qe,o(Q(e.horas_regulares)),1),x(`td`,Je,o(Q(e.horas_overtime)),1),x(`td`,Ye,o(Z(e.total_bruto)),1),x(`td`,Xe,o(Z(e.total_deducciones)),1),x(`td`,Ze,o(Z(e.total_aportes_er)),1),x(`td`,Qe,o(Z(e.total_neto)),1),x(`td`,$e,o(Z(e.costo_empresa)),1)]))),128))]),x(`tfoot`,null,[x(`tr`,et,[l[31]||=x(`td`,{colspan:`5`},[x(`strong`,null,`TOTAL`)],-1),x(`td`,tt,o(Z(U.value.total_bruto)),1),x(`td`,nt,o(Z(U.value.total_deducciones)),1),x(`td`,rt,o(Z(U.value.total_aportes_er)),1),x(`td`,it,o(Z(U.value.total_neto)),1),x(`td`,at,o(Z(U.value.costo_total_empresa)),1)])])])])):G.value===`ccosto`&&W.value.length?(u(),m(`div`,R,[x(`table`,ot,[l[35]||=x(`thead`,null,[x(`tr`,null,[x(`th`,null,`CENTRO DE COSTO`),x(`th`,{class:`ta-c`},`CÓD.`),x(`th`,{class:`ta-r`},`EMPLEADOS`),x(`th`,{class:`ta-r`},`HORAS`),x(`th`,{class:`ta-r`},`COSTO BRUTO`),x(`th`,{class:`ta-r`},`COSTO TOTAL`),x(`th`,{class:`ta-r`},`% DEL TOTAL`)])],-1),x(`tbody`,null,[(u(!0),m(s,null,a(W.value,e=>(u(),m(`tr`,{key:e.ccosto},[x(`td`,st,o(e.ccosto_nombre),1),x(`td`,ct,o(e.ccosto),1),x(`td`,lt,o(e.empleados),1),x(`td`,ut,o(Q(e.horas)),1),x(`td`,dt,o(Z(e.costo_bruto)),1),x(`td`,ft,o(Z(e.costo_total)),1),x(`td`,pt,[x(`div`,mt,[x(`div`,{class:`pct-bar`,style:c({width:Y(e.costo_total)+`%`})},null,4),x(`span`,ht,o(Y(e.costo_total).toFixed(1))+`%`,1)])])]))),128))]),x(`tfoot`,null,[x(`tr`,gt,[l[33]||=x(`td`,{colspan:`4`},[x(`strong`,null,`TOTAL`)],-1),x(`td`,_t,o(Z(Ut.value)),1),x(`td`,vt,o(Z(J.value)),1),l[34]||=x(`td`,{class:`ta-r`},`100%`,-1)])])])])):G.value===`impuestos`&&W.value.length?(u(),m(`div`,yt,[x(`table`,bt,[l[37]||=x(`thead`,null,[x(`tr`,null,[x(`th`,null,`PERÍODO`),x(`th`,{class:`ta-r`},`FED. INC. TAX`),x(`th`,{class:`ta-r`},`SS EMP.`),x(`th`,{class:`ta-r`},`SS ER`),x(`th`,{class:`ta-r`},`MEDICARE EMP.`),x(`th`,{class:`ta-r`},`MEDICARE ER`),x(`th`,{class:`ta-r`},`FUTA`),x(`th`,{class:`ta-r`},`SUTA`),x(`th`,{class:`ta-r`},`W.COMP`),x(`th`,{class:`ta-r text-error`},`TOTAL IMP.`)])],-1),x(`tbody`,null,[(u(!0),m(s,null,a(W.value,e=>(u(),m(`tr`,{key:e.semana_inicio},[x(`td`,null,[x(`div`,xt,o($(e.semana_inicio)),1),x(`div`,St,`al `+o($(e.semana_fin)),1)]),x(`td`,Ct,o(Z(e.federal_income_tax)),1),x(`td`,wt,o(Z(e.ss_emp)),1),x(`td`,Tt,o(Z(e.ss_er)),1),x(`td`,Et,o(Z(e.medicare_emp)),1),x(`td`,Dt,o(Z(e.medicare_er)),1),x(`td`,Ot,o(Z(e.futa)),1),x(`td`,kt,o(Z(e.suta)),1),x(`td`,At,o(Z(e.workers_comp)),1),x(`td`,jt,o(Z(e.total_impuestos)),1)]))),128))]),x(`tfoot`,null,[x(`tr`,Mt,[l[36]||=x(`td`,null,[x(`strong`,null,`TOTAL`)],-1),x(`td`,Nt,o(Z(U.value.federal_income_tax)),1),x(`td`,Pt,o(Z(U.value.social_security_emp)),1),x(`td`,Ft,o(Z(U.value.social_security_er)),1),x(`td`,It,o(Z(U.value.medicare_emp)),1),x(`td`,Lt,o(Z(U.value.medicare_er)),1),x(`td`,Rt,o(Z(U.value.futa)),1),x(`td`,zt,o(Z(U.value.suta)),1),x(`td`,Bt,o(Z(U.value.workers_comp)),1),x(`td`,Vt,o(Z(+U.value.federal_income_tax+ +U.value.social_security_emp+ +U.value.social_security_er+ +U.value.medicare_emp+ +U.value.medicare_er+ +U.value.futa+ +U.value.suta+ +U.value.workers_comp)),1)])])])])):v(``,!0)])):v(``,!0)])]),_:1}))}},[[`__scopeId`,`data-v-f251245b`]]);export{z as default};