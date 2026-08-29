import{$r as e,A as t,Dr as n,Ft as r,It as i,Lr as a,Mt as o,Nr as s,Q as c,S as l,Ur as u,Zr as d,_r as f,ei as p,fr as m,gr as h,hr as g,jr as _,kr as v,mr as y,pr as b,ur as x,vr as S,x as ee}from"./index.js";import{t as te}from"./MainLayout.js";import{t as ne}from"./PageHeader.js";import{t as C}from"./KpiCard.js";var re={class:`rn-container`},ie={class:`rn-filters-card`},ae={class:`rn-filters-row`},oe={class:`filter-group`},se={class:`filter-group`},ce={key:1,class:`kpi-grid`},le={key:2,class:`rn-tabs-card`},ue={class:`rn-tabs-header`},de=[`onClick`],fe={key:0,class:`rn-empty`},pe={key:1,class:`rn-table-wrap`},me={class:`rn-table`},he={class:`periodo-label`},ge={class:`periodo-sub`},_e={class:`ta-r`},ve={class:`ta-r font-mono`},w={class:`ta-r font-mono text-error`},T={class:`ta-r font-mono text-warning`},E={class:`ta-r font-mono text-success`},D={class:`ta-r font-mono text-purple`},O={class:`rn-tfoot`},k={class:`ta-r`},A={class:`ta-r font-mono`},j={class:`ta-r font-mono text-error`},M={class:`ta-r font-mono text-warning`},N={class:`ta-r font-mono text-success`},P={class:`ta-r font-mono text-purple`},F={key:2,class:`rn-table-wrap`},ye={class:`rn-nota`},be={class:`rn-table`},xe={class:`rn-mes-head`},Se={class:`mes-sub`},Ce={class:`ta-r font-mono`},we={class:`ta-r font-mono`},Te={class:`ta-r font-mono`},Ee={class:`ta-r font-mono text-error`},De={class:`ta-r font-mono text-warning`},Oe={class:`ta-r font-mono text-success`},ke={class:`ta-r font-mono text-purple`},Ae={class:`periodo-label`},je={key:0,class:`badge-partido`,title:`Esta nómina cruza dos meses: solo se muestra la parte que corresponde a este mes`},Me={class:`periodo-sub`},Ne={class:`ta-r font-mono`},Pe={class:`ta-r font-mono`},Fe={class:`ta-r font-mono`},Ie={class:`ta-r font-mono`},Le={class:`ta-r font-mono text-error`},Re={class:`ta-r font-mono text-warning`},ze={class:`ta-r font-mono text-success`},Be={class:`ta-r font-mono text-purple`},Ve={class:`rn-tfoot`},He={class:`ta-r font-mono`},Ue={class:`ta-r font-mono text-error`},We={class:`ta-r font-mono text-warning`},Ge={class:`ta-r font-mono text-success`},Ke={class:`ta-r font-mono text-purple`},qe={key:3,class:`rn-table-wrap`},Je={class:`rn-table`},Ye={class:`font-weight-medium`},Xe={class:`ta-c`},Ze={class:`ta-r`},Qe={class:`ta-r font-mono`},$e={class:`ta-r font-mono`},et={class:`ta-r font-mono`},tt={class:`ta-r font-mono text-error`},nt={class:`ta-r font-mono text-warning`},rt={class:`ta-r font-mono text-success`},it={class:`ta-r font-mono text-purple`},at={class:`rn-tfoot`},ot={class:`ta-r font-mono`},st={class:`ta-r font-mono text-error`},ct={class:`ta-r font-mono text-warning`},I={class:`ta-r font-mono text-success`},lt={class:`ta-r font-mono text-purple`},ut={key:4,class:`rn-table-wrap`},dt={class:`rn-table`},ft={class:`font-weight-medium`},pt={class:`ta-c text-caption font-mono`,style:{color:`rgba(var(--v-theme-on-surface),.5)`}},mt={class:`ta-r`},ht={class:`ta-r font-mono`},gt={class:`ta-r font-mono`},_t={class:`ta-r font-mono text-purple`},vt={class:`ta-r`},yt={class:`pct-bar-wrap`},bt={class:`pct-label`},xt={class:`rn-tfoot`},St={class:`ta-r font-mono`},Ct={class:`ta-r font-mono text-purple`},wt={key:5,class:`rn-table-wrap`},Tt={class:`rn-table`},Et={class:`periodo-label`},Dt={class:`periodo-sub`},Ot={class:`ta-r font-mono`},kt={class:`ta-r font-mono`},At={class:`ta-r font-mono`},jt={class:`ta-r font-mono`},Mt={class:`ta-r font-mono`},Nt={class:`ta-r font-mono`},Pt={class:`ta-r font-mono`},Ft={class:`ta-r font-mono`},It={class:`ta-r font-mono text-error font-weight-bold`},Lt={class:`rn-tfoot`},Rt={class:`ta-r font-mono`},zt={class:`ta-r font-mono`},Bt={class:`ta-r font-mono`},Vt={class:`ta-r font-mono`},Ht={class:`ta-r font-mono`},Ut={class:`ta-r font-mono`},Wt={class:`ta-r font-mono`},Gt={class:`ta-r font-mono`},Kt={class:`ta-r font-mono text-error font-weight-bold`},L=o({__name:`ReporteNominaView`,setup(o){let L=r(),R=()=>L.empresaCodigo||L.empresa||localStorage.getItem(`empresaActual`),z=u(!1),B=u(!1),V=u(null),H=u([]),U=u(`periodo`);u({periodo:[],empleado:[],ccosto:[],impuestos:[]});let W=new Date().getFullYear(),G=u({fechaInicio:`${W}-01-01`,fechaFin:`${W}-12-31`}),qt=[{val:`periodo`,label:`Por Período`,icon:`mdi-calendar-range-outline`},{val:`meses`,label:`Por Mes`,icon:`mdi-calendar-month-outline`},{val:`empleado`,label:`Por Empleado`,icon:`mdi-account-group-outline`},{val:`ccosto`,label:`Por Centro de Costo`,icon:`mdi-sitemap-outline`},{val:`impuestos`,label:`Impuestos y Taxes`,icon:`mdi-receipt-text-outline`}],Jt=[`Enero`,`Febrero`,`Marzo`,`Abril`,`Mayo`,`Junio`,`Julio`,`Agosto`,`Septiembre`,`Octubre`,`Noviembre`,`Diciembre`];function Yt(e){if(!e)return`—`;let[t,n]=String(e).split(`-`);return`${Jt[parseInt(n,10)-1]||n} ${t}`}let K=[`total_bruto`,`total_deducciones`,`total_aportes_er`,`total_neto`,`costo_empresa`];function q(e){let t=new Map;for(let n of e){t.has(n.mes)||t.set(n.mes,{mes:n.mes,nombre:Yt(n.mes),filas:[],totales:Object.fromEntries(K.map(e=>[e,0])),dias:0,horas:0});let e=t.get(n.mes);e.filas.push(n);for(let t of K)e.totales[t]+=parseFloat(n[t]||0);e.dias+=parseFloat(n.dias_en_mes||0),e.horas+=parseFloat(n.horas_en_mes||0)}return[...t.values()]}let Xt=m(()=>q(H.value)),Zt=m(()=>H.value.reduce((e,t)=>e+parseFloat(t.costo_bruto||0),0)),J=m(()=>H.value.reduce((e,t)=>e+parseFloat(t.costo_total||0),0));function Y(e){let t=J.value;return t>0?parseFloat(e)/t*100:0}async function X(){z.value=!0;try{let e=R(),t=new URLSearchParams({empresa:e,fechaInicio:G.value.fechaInicio,fechaFin:G.value.fechaFin,vista:U.value}),n=await(await fetch(`${i}/nomina/reporte?${t}`)).json();if(!n.success)throw Error(n.error);V.value=n.kpis,H.value=n.data||[]}catch(e){console.error(e)}finally{z.value=!1}}async function Qt(e){U.value=e,await X()}function Z(e){return`$`+(parseFloat(e)||0).toLocaleString(`en-US`,{minimumFractionDigits:2,maximumFractionDigits:2})}function Q(e){return(parseFloat(e)||0).toLocaleString(`en-US`,{minimumFractionDigits:2,maximumFractionDigits:2})}function $(e){if(!e)return`—`;let[t,n,r]=String(e).split(`T`)[0].split(`-`);return`${n}/${r}/${t}`}async function $t(){if(V.value){B.value=!0;try{let e={empresa:R(),fechaInicio:G.value.fechaInicio,fechaFin:G.value.fechaFin},[t,n,r,a,o]=await Promise.all([fetch(`${i}/nomina/reporte?${new URLSearchParams({...e,vista:`periodo`})}`).then(e=>e.json()),fetch(`${i}/nomina/reporte?${new URLSearchParams({...e,vista:`meses`})}`).then(e=>e.json()),fetch(`${i}/nomina/reporte?${new URLSearchParams({...e,vista:`empleado`})}`).then(e=>e.json()),fetch(`${i}/nomina/reporte?${new URLSearchParams({...e,vista:`ccosto`})}`).then(e=>e.json()),fetch(`${i}/nomina/reporte?${new URLSearchParams({...e,vista:`impuestos`})}`).then(e=>e.json())]),s=V.value,c=t.data||[],l=q(n.data||[]),u=r.data||[],d=a.data||[],f=o.data||[],p=d.reduce((e,t)=>e+parseFloat(t.costo_bruto||0),0),m=d.reduce((e,t)=>e+parseFloat(t.costo_total||0),0);f.reduce((e,t)=>e+parseFloat(t.total_impuestos||0),0);let h=`
      <div class="section">
        <div class="section-title">Por Período</div>
        <table>
          <thead><tr>
            <th>PERÍODO</th><th>EMPL.</th><th>BRUTO</th><th>DEDUCCIONES</th><th>APORTES ER</th><th>NETO</th><th>COSTO EMPRESA</th>
          </tr></thead>
          <tbody>
            ${c.map(e=>`<tr>
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
            <td>TOTAL</td><td>${s.total_empleados}</td>
            <td>${Z(s.total_bruto)}</td>
            <td class="text-red">${Z(s.total_deducciones)}</td>
            <td class="text-amber">${Z(s.total_aportes_er)}</td>
            <td class="text-green">${Z(s.total_neto)}</td>
            <td class="text-purple">${Z(s.costo_total_empresa)}</td>
          </tr></tfoot>
        </table>
      </div>`,g=`
      <div class="section">
        <div class="section-title">Reparto por Mes</div>
        <div class="nota">Las nóminas que cruzan dos meses se reparten según las horas trabajadas en cada mes; si no hay horario cargado, por días calendario.</div>
        <table>
          <thead><tr>
            <th>MES / NÓMINA</th><th>DÍAS</th><th>HORAS</th><th>% NÓM.</th><th>BRUTO</th><th>DEDUCCIONES</th><th>APORTES ER</th><th>NETO</th><th>COSTO EMPRESA</th>
          </tr></thead>
          <tbody>
            ${l.map(e=>`
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
            <td>${Z(s.total_bruto)}</td>
            <td class="text-red">${Z(s.total_deducciones)}</td>
            <td class="text-amber">${Z(s.total_aportes_er)}</td>
            <td class="text-green">${Z(s.total_neto)}</td>
            <td class="text-purple">${Z(s.costo_total_empresa)}</td>
          </tr></tfoot>
        </table>
      </div>`,_=`
      <div class="section">
        <div class="section-title">Por Empleado</div>
        <table>
          <thead><tr>
            <th>EMPLEADO</th><th>TIPO</th><th>NÓM.</th><th>HRS REG</th><th>HRS OT</th><th>BRUTO</th><th>DEDUCCIONES</th><th>APORTES ER</th><th>NETO</th><th>COSTO EMP.</th>
          </tr></thead>
          <tbody>
            ${u.map(e=>`<tr>
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
            <td>${Z(s.total_bruto)}</td>
            <td class="text-red">${Z(s.total_deducciones)}</td>
            <td class="text-amber">${Z(s.total_aportes_er)}</td>
            <td class="text-green">${Z(s.total_neto)}</td>
            <td class="text-purple">${Z(s.costo_total_empresa)}</td>
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
            ${d.map(e=>{let t=m>0?(parseFloat(e.costo_total)/m*100).toFixed(1):`0.0`,n=Math.max(2,Math.round(parseFloat(t)));return`<tr>
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
            <td>${Z(p)}</td>
            <td class="text-purple">${Z(m)}</td>
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
            ${f.map(e=>`<tr>
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
            <td>${Z(s.federal_income_tax)}</td>
            <td>${Z(s.social_security_emp)}</td>
            <td>${Z(s.social_security_er)}</td>
            <td>${Z(s.medicare_emp)}</td>
            <td>${Z(s.medicare_er)}</td>
            <td>${Z(s.futa)}</td>
            <td>${Z(s.suta)}</td>
            <td>${Z(s.workers_comp)}</td>
            <td class="text-red">${Z(+s.federal_income_tax+ +s.social_security_emp+ +s.social_security_er+ +s.medicare_emp+ +s.medicare_er+ +s.futa+ +s.suta+ +s.workers_comp)}</td>
          </tr></tfoot>
        </table>
      </div>`,b=`
      <div class="kpi-row">
        <div class="kpi"><div class="kpi-lbl">BRUTO PAGADO</div><div class="kpi-val">${Z(s.total_bruto)}</div></div>
        <div class="kpi"><div class="kpi-lbl">DEDUCCIONES EMP.</div><div class="kpi-val text-red">${Z(s.total_deducciones)}</div></div>
        <div class="kpi"><div class="kpi-lbl">NETO PAGADO</div><div class="kpi-val text-green">${Z(s.total_neto)}</div></div>
        <div class="kpi"><div class="kpi-lbl">APORTES EMPLEADOR</div><div class="kpi-val text-amber">${Z(s.total_aportes_er)}</div></div>
        <div class="kpi"><div class="kpi-lbl">COSTO TOTAL EMPRESA</div><div class="kpi-val text-purple">${Z(s.costo_total_empresa)}</div></div>
        <div class="kpi"><div class="kpi-lbl">NÓMINAS / EMPLEADOS</div><div class="kpi-val">${s.total_nominas} / ${s.total_empleados}</div></div>
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
        ${h}
        ${g}
        ${_}
        ${v}
        ${y}
      </body></html>`,S=window.open(``,`_blank`);if(!S){alert(`Activa los pop-ups para generar el PDF`);return}S.document.write(x),S.document.close(),S.focus()}catch(e){console.error(e)}finally{B.value=!1}}}return n(X),(n,r)=>{let i=s(`CampoFecha`);return v(),y(te,null,{default:a(()=>[b(`div`,re,[S(ne,{title:`Reporte de Nómina`,description:`Análisis de costos por período, empleado, centro de costo e impuestos`,crumbs:[`Nómina`,`Reportes`,`Reporte de Nómina`]}),b(`div`,ie,[b(`div`,ae,[b(`div`,oe,[r[2]||=b(`div`,{class:`filter-label`},`FECHA INICIO`,-1),S(i,{modelValue:G.value.fechaInicio,"onUpdate:modelValue":r[0]||=e=>G.value.fechaInicio=e,variant:`outlined`,density:`compact`,"hide-details":``,style:{"min-width":`160px`}},null,8,[`modelValue`])]),b(`div`,se,[r[3]||=b(`div`,{class:`filter-label`},`FECHA FIN`,-1),S(i,{modelValue:G.value.fechaFin,"onUpdate:modelValue":r[1]||=e=>G.value.fechaFin=e,variant:`outlined`,density:`compact`,"hide-details":``,style:{"min-width":`160px`}},null,8,[`modelValue`])]),S(l,{color:`secondary`,variant:`flat`,rounded:`lg`,loading:z.value,onClick:X,height:`40`},{default:a(()=>[S(c,{start:``},{default:a(()=>[...r[4]||=[f(`mdi-magnify`,-1)]]),_:1}),r[5]||=f(`Generar Reporte `,-1)]),_:1},8,[`loading`]),S(ee),V.value?(v(),y(l,{key:0,variant:`flat`,color:`secondary`,rounded:`lg`,height:`40`,loading:B.value,onClick:$t},{default:a(()=>[S(c,{start:``},{default:a(()=>[...r[6]||=[f(`mdi-file-pdf-box`,-1)]]),_:1}),r[7]||=f(`Exportar PDF `,-1)]),_:1},8,[`loading`])):g(``,!0)])]),z.value?(v(),y(t,{key:0,indeterminate:``,color:`secondary`,height:`3`,class:`mb-4`})):g(``,!0),V.value?(v(),h(`div`,ce,[S(C,{index:0,label:`Bruto Pagado`,value:Z(V.value.total_bruto),icon:`mdi-cash-multiple`,color:`var(--indigo)`},null,8,[`value`]),S(C,{index:1,label:`Deducciones Emp.`,value:Z(V.value.total_deducciones),icon:`mdi-minus-circle-outline`,color:`var(--error)`,"value-color":`var(--error)`},null,8,[`value`]),S(C,{index:2,label:`Neto Pagado`,value:Z(V.value.total_neto),icon:`mdi-bank-transfer-out`,color:`var(--success)`,"value-color":`var(--success)`},null,8,[`value`]),S(C,{index:3,label:`Aportes Empleador`,value:Z(V.value.total_aportes_er),icon:`mdi-office-building-outline`,color:`var(--gold)`,"value-color":`var(--gold)`},null,8,[`value`]),S(C,{index:4,label:`Costo Total Empresa`,value:Z(V.value.costo_total_empresa),icon:`mdi-domain`,color:`var(--indigo)`,"value-color":`var(--indigo)`},null,8,[`value`]),S(C,{index:5,label:`Nóminas / Empleados`,value:`${V.value.total_nominas} / ${V.value.total_empleados}`,icon:`mdi-account-group-outline`,color:`var(--indigo)`,"value-color":`var(--indigo)`},null,8,[`value`])])):g(``,!0),V.value||H.value.length?(v(),h(`div`,le,[b(`div`,ue,[(v(),h(x,null,_(qt,e=>b(`button`,{key:e.val,class:d([`rn-tab`,{"rn-tab--active":U.value===e.val}]),onClick:t=>Qt(e.val)},[S(c,{size:`15`,class:`mr-1`},{default:a(()=>[f(p(e.icon),1)]),_:2},1024),f(p(e.label),1)],10,de)),64))]),!z.value&&H.value.length===0?(v(),h(`div`,fe,[S(c,{size:`40`,color:`rgba(var(--v-theme-on-surface),.15)`,class:`mb-2`},{default:a(()=>[...r[8]||=[f(`mdi-file-search-outline`,-1)]]),_:1}),r[9]||=b(`div`,null,`No hay nóminas aprobadas en el período seleccionado`,-1)])):U.value===`periodo`&&H.value.length?(v(),h(`div`,pe,[b(`table`,me,[r[11]||=b(`thead`,null,[b(`tr`,null,[b(`th`,null,`PERÍODO`),b(`th`,{class:`ta-r`},`EMPLEADOS`),b(`th`,{class:`ta-r`},`BRUTO`),b(`th`,{class:`ta-r`},`DEDUCCIONES`),b(`th`,{class:`ta-r`},`APORTES ER`),b(`th`,{class:`ta-r`},`NETO`),b(`th`,{class:`ta-r`},`COSTO EMPRESA`)])],-1),b(`tbody`,null,[(v(!0),h(x,null,_(H.value,e=>(v(),h(`tr`,{key:e.id},[b(`td`,null,[b(`div`,he,p($(e.semana_inicio)),1),b(`div`,ge,`al `+p($(e.semana_fin)),1)]),b(`td`,_e,p(e.empleados),1),b(`td`,ve,p(Z(e.total_bruto)),1),b(`td`,w,p(Z(e.total_deducciones)),1),b(`td`,T,p(Z(e.total_aportes_er)),1),b(`td`,E,p(Z(e.total_neto)),1),b(`td`,D,p(Z(e.costo_empresa)),1)]))),128))]),b(`tfoot`,null,[b(`tr`,O,[r[10]||=b(`td`,null,[b(`strong`,null,`TOTAL`)],-1),b(`td`,k,p(V.value.total_empleados),1),b(`td`,A,p(Z(V.value.total_bruto)),1),b(`td`,j,p(Z(V.value.total_deducciones)),1),b(`td`,M,p(Z(V.value.total_aportes_er)),1),b(`td`,N,p(Z(V.value.total_neto)),1),b(`td`,P,p(Z(V.value.costo_total_empresa)),1)])])])])):U.value===`meses`&&H.value.length?(v(),h(`div`,F,[b(`div`,ye,[S(c,{size:`15`,color:`var(--indigo)`},{default:a(()=>[...r[12]||=[f(`mdi-information-outline`,-1)]]),_:1}),r[13]||=b(`span`,null,[f(` Las nóminas que cruzan dos meses se reparten entre ellos según las `),b(`strong`,null,`horas trabajadas en cada mes`),f(`. Cuando la nómina no tiene horario cargado, el reparto se hace por días calendario. `)],-1)]),b(`table`,be,[r[19]||=b(`thead`,null,[b(`tr`,null,[b(`th`,null,`MES / NÓMINA`),b(`th`,{class:`ta-r`},`DÍAS`),b(`th`,{class:`ta-r`},`HORAS`),b(`th`,{class:`ta-r`},`% NÓMINA`),b(`th`,{class:`ta-r`},`BRUTO`),b(`th`,{class:`ta-r`},`DEDUCCIONES`),b(`th`,{class:`ta-r`},`APORTES ER`),b(`th`,{class:`ta-r`},`NETO`),b(`th`,{class:`ta-r`},`COSTO EMPRESA`)])],-1),b(`tbody`,null,[(v(!0),h(x,null,_(Xt.value,e=>(v(),h(x,{key:e.mes},[b(`tr`,xe,[b(`td`,null,[S(c,{size:`15`,class:`mr-1`},{default:a(()=>[...r[14]||=[f(`mdi-calendar-month-outline`,-1)]]),_:1}),b(`strong`,null,p(e.nombre),1),b(`span`,Se,p(e.filas.length)+` nómina`+p(e.filas.length===1?``:`s`),1)]),b(`td`,Ce,p(e.dias),1),b(`td`,we,p(Q(e.horas)),1),r[15]||=b(`td`,{class:`ta-r`},`—`,-1),b(`td`,Te,p(Z(e.totales.total_bruto)),1),b(`td`,Ee,p(Z(e.totales.total_deducciones)),1),b(`td`,De,p(Z(e.totales.total_aportes_er)),1),b(`td`,Oe,p(Z(e.totales.total_neto)),1),b(`td`,ke,p(Z(e.totales.costo_empresa)),1)]),(v(!0),h(x,null,_(e.filas,t=>(v(),h(`tr`,{key:e.mes+`_`+t.liquidacion_id,class:`rn-mes-detalle`},[b(`td`,null,[b(`div`,Ae,[f(p($(t.semana_inicio))+` — `+p($(t.semana_fin))+` `,1),t.periodo_partido?(v(),h(`span`,je,[S(c,{size:`10`},{default:a(()=>[...r[16]||=[f(`mdi-call-split`,-1)]]),_:1}),r[17]||=f(`PARCIAL `,-1)])):g(``,!0)]),b(`div`,Me,p(t.prorrateo_por_horas?`Repartido por horas trabajadas`:`Repartido por días calendario`),1)]),b(`td`,Ne,p(t.dias_en_mes),1),b(`td`,Pe,p(Q(t.horas_en_mes)),1),b(`td`,Fe,p(Q(t.porcentaje))+`%`,1),b(`td`,Ie,p(Z(t.total_bruto)),1),b(`td`,Le,p(Z(t.total_deducciones)),1),b(`td`,Re,p(Z(t.total_aportes_er)),1),b(`td`,ze,p(Z(t.total_neto)),1),b(`td`,Be,p(Z(t.costo_empresa)),1)]))),128))],64))),128))]),b(`tfoot`,null,[b(`tr`,Ve,[r[18]||=b(`td`,{colspan:`4`},[b(`strong`,null,`TOTAL`)],-1),b(`td`,He,p(Z(V.value.total_bruto)),1),b(`td`,Ue,p(Z(V.value.total_deducciones)),1),b(`td`,We,p(Z(V.value.total_aportes_er)),1),b(`td`,Ge,p(Z(V.value.total_neto)),1),b(`td`,Ke,p(Z(V.value.costo_total_empresa)),1)])])])])):U.value===`empleado`&&H.value.length?(v(),h(`div`,qe,[b(`table`,Je,[r[21]||=b(`thead`,null,[b(`tr`,null,[b(`th`,null,`EMPLEADO`),b(`th`,{class:`ta-c`},`TIPO`),b(`th`,{class:`ta-r`},`NÓMINAS`),b(`th`,{class:`ta-r`},`HRS REG`),b(`th`,{class:`ta-r`},`HRS OT`),b(`th`,{class:`ta-r`},`BRUTO`),b(`th`,{class:`ta-r`},`DEDUCCIONES`),b(`th`,{class:`ta-r`},`APORTES ER`),b(`th`,{class:`ta-r`},`NETO`),b(`th`,{class:`ta-r`},`COSTO EMP.`)])],-1),b(`tbody`,null,[(v(!0),h(x,null,_(H.value,e=>(v(),h(`tr`,{key:e.empleado_id},[b(`td`,Ye,p(e.nombre),1),b(`td`,Xe,[b(`span`,{class:d(e.tipo_empleado===`W2`?`badge-w2`:`badge-1099`)},p(e.tipo_empleado),3)]),b(`td`,Ze,p(e.total_nominas),1),b(`td`,Qe,p(Q(e.horas_regulares)),1),b(`td`,$e,p(Q(e.horas_overtime)),1),b(`td`,et,p(Z(e.total_bruto)),1),b(`td`,tt,p(Z(e.total_deducciones)),1),b(`td`,nt,p(Z(e.total_aportes_er)),1),b(`td`,rt,p(Z(e.total_neto)),1),b(`td`,it,p(Z(e.costo_empresa)),1)]))),128))]),b(`tfoot`,null,[b(`tr`,at,[r[20]||=b(`td`,{colspan:`5`},[b(`strong`,null,`TOTAL`)],-1),b(`td`,ot,p(Z(V.value.total_bruto)),1),b(`td`,st,p(Z(V.value.total_deducciones)),1),b(`td`,ct,p(Z(V.value.total_aportes_er)),1),b(`td`,I,p(Z(V.value.total_neto)),1),b(`td`,lt,p(Z(V.value.costo_total_empresa)),1)])])])])):U.value===`ccosto`&&H.value.length?(v(),h(`div`,ut,[b(`table`,dt,[r[24]||=b(`thead`,null,[b(`tr`,null,[b(`th`,null,`CENTRO DE COSTO`),b(`th`,{class:`ta-c`},`CÓD.`),b(`th`,{class:`ta-r`},`EMPLEADOS`),b(`th`,{class:`ta-r`},`HORAS`),b(`th`,{class:`ta-r`},`COSTO BRUTO`),b(`th`,{class:`ta-r`},`COSTO TOTAL`),b(`th`,{class:`ta-r`},`% DEL TOTAL`)])],-1),b(`tbody`,null,[(v(!0),h(x,null,_(H.value,t=>(v(),h(`tr`,{key:t.ccosto},[b(`td`,ft,p(t.ccosto_nombre),1),b(`td`,pt,p(t.ccosto),1),b(`td`,mt,p(t.empleados),1),b(`td`,ht,p(Q(t.horas)),1),b(`td`,gt,p(Z(t.costo_bruto)),1),b(`td`,_t,p(Z(t.costo_total)),1),b(`td`,vt,[b(`div`,yt,[b(`div`,{class:`pct-bar`,style:e({width:Y(t.costo_total)+`%`})},null,4),b(`span`,bt,p(Y(t.costo_total).toFixed(1))+`%`,1)])])]))),128))]),b(`tfoot`,null,[b(`tr`,xt,[r[22]||=b(`td`,{colspan:`4`},[b(`strong`,null,`TOTAL`)],-1),b(`td`,St,p(Z(Zt.value)),1),b(`td`,Ct,p(Z(J.value)),1),r[23]||=b(`td`,{class:`ta-r`},`100%`,-1)])])])])):U.value===`impuestos`&&H.value.length?(v(),h(`div`,wt,[b(`table`,Tt,[r[26]||=b(`thead`,null,[b(`tr`,null,[b(`th`,null,`PERÍODO`),b(`th`,{class:`ta-r`},`FED. INC. TAX`),b(`th`,{class:`ta-r`},`SS EMP.`),b(`th`,{class:`ta-r`},`SS ER`),b(`th`,{class:`ta-r`},`MEDICARE EMP.`),b(`th`,{class:`ta-r`},`MEDICARE ER`),b(`th`,{class:`ta-r`},`FUTA`),b(`th`,{class:`ta-r`},`SUTA`),b(`th`,{class:`ta-r`},`W.COMP`),b(`th`,{class:`ta-r text-error`},`TOTAL IMP.`)])],-1),b(`tbody`,null,[(v(!0),h(x,null,_(H.value,e=>(v(),h(`tr`,{key:e.semana_inicio},[b(`td`,null,[b(`div`,Et,p($(e.semana_inicio)),1),b(`div`,Dt,`al `+p($(e.semana_fin)),1)]),b(`td`,Ot,p(Z(e.federal_income_tax)),1),b(`td`,kt,p(Z(e.ss_emp)),1),b(`td`,At,p(Z(e.ss_er)),1),b(`td`,jt,p(Z(e.medicare_emp)),1),b(`td`,Mt,p(Z(e.medicare_er)),1),b(`td`,Nt,p(Z(e.futa)),1),b(`td`,Pt,p(Z(e.suta)),1),b(`td`,Ft,p(Z(e.workers_comp)),1),b(`td`,It,p(Z(e.total_impuestos)),1)]))),128))]),b(`tfoot`,null,[b(`tr`,Lt,[r[25]||=b(`td`,null,[b(`strong`,null,`TOTAL`)],-1),b(`td`,Rt,p(Z(V.value.federal_income_tax)),1),b(`td`,zt,p(Z(V.value.social_security_emp)),1),b(`td`,Bt,p(Z(V.value.social_security_er)),1),b(`td`,Vt,p(Z(V.value.medicare_emp)),1),b(`td`,Ht,p(Z(V.value.medicare_er)),1),b(`td`,Ut,p(Z(V.value.futa)),1),b(`td`,Wt,p(Z(V.value.suta)),1),b(`td`,Gt,p(Z(V.value.workers_comp)),1),b(`td`,Kt,p(Z(+V.value.federal_income_tax+ +V.value.social_security_emp+ +V.value.social_security_er+ +V.value.medicare_emp+ +V.value.medicare_er+ +V.value.futa+ +V.value.suta+ +V.value.workers_comp)),1)])])])])):g(``,!0)])):g(``,!0)])]),_:1})}}},[[`__scopeId`,`data-v-c6c4f3ef`]]);export{L as default};