import{t as e}from"./VBtn.js";import{c as t,o as n,t as r,x as i}from"./MainLayout.js";import{An as a,Dn as o,Gt as s,Kn as c,Kt as l,Ln as u,Xt as d,Yn as f,a as ee,an as p,en as m,gn as te,in as h,kn as g,n as ne,nn as re,o as _,on as v,rn as y,tn as b,xn as x,yn as S}from"./index.js";import{t as C}from"./VIcon.js";import{t as ie}from"./VProgressCircular.js";import{t as ae}from"./PageHeader.js";var oe={class:`pg-container`},se={class:`toolbar`},ce={class:`search-wrap`},le={class:`count-badge`},ue={class:`tabla-card`},de={key:0,class:`loading-wrap`},fe={key:1,class:`crud-table`},pe={key:0},me={colspan:`6`,class:`empty-row`},he={class:`cod-badge`},ge={class:`fw500`},_e={class:`col-center`},ve={class:`col-center`},ye={class:`col-acc`},be={class:`modal-header`},xe={class:`modal-body`},Se={class:`field-group`},Ce={class:`cod-wrap`},we=[`disabled`],Te={class:`cod-hint`},w={key:0,class:`error-txt`},T={class:`field-group`},E=[`value`],D={key:0,class:`error-txt`},O={class:`form-row-2`},Ee={class:`field-group`},De={key:0,class:`error-txt`},Oe={class:`field-group`},ke={key:0,class:`hint-txt`},Ae={class:`field-group`},je=[`value`],Me={class:`field-group`},Ne={key:0,class:`api-error`},Pe={class:`modal-footer`},k=ne({__name:`LotesFabricacionView`,setup(ne){let k=ee(),A=m(()=>k.empresaCodigo),j=u([]),M=u([]),N=u([]),P=u(``),F=u(`6x4`),I=u(!1),L=u(!1),R=u(null),z=u(!1),B=u(!1),V=u(``),H=u({}),U=()=>({codigo:``,etiqueta:``,fecha_fab:new Date().toISOString().split(`T`)[0],fecha_vence:``,responsable:``,observaciones:``}),W=u(U()),G=new Date,K=m(()=>`${String(G.getMonth()+1).padStart(2,`0`)}${String(G.getDate()).padStart(2,`0`)}${String(G.getFullYear()).slice(-2)}001`),q=m(()=>!W.value.etiqueta||!W.value.fecha_fab?null:M.value.find(e=>e.codigo===W.value.etiqueta)?.dias_vencimiento||null),J=m(()=>{if(!q.value||!W.value.fecha_fab)return``;let e=new Date(W.value.fecha_fab+`T12:00:00`);return e.setDate(e.getDate()+q.value),e.toISOString().split(`T`)[0]});o([()=>W.value.etiqueta,()=>W.value.fecha_fab],()=>{J.value&&(W.value.fecha_vence=J.value)});let Y=m(()=>{let e=P.value.toLowerCase();return j.value.filter(t=>t.codigo.toLowerCase().includes(e)||(t.etiqueta_nombre||``).toLowerCase().includes(e)||(t.etiqueta||``).toLowerCase().includes(e)||(t.responsable||``).toLowerCase().includes(e))});function X(e){return e?new Date(String(e).substring(0,10)+`T12:00:00`).toLocaleDateString(`es`,{day:`2-digit`,month:`short`,year:`numeric`}):`—`}function Z(e){if(!e)return!1;let t=(new Date(String(e).substring(0,10)+`T12:00:00`)-new Date)/(1e3*60*60*24);return t>=0&&t<=7}async function Fe(){I.value=!0;try{let[e,t,n,r]=await Promise.all([fetch(`${_}/almacen/lotes-fabricacion?empresa=${A.value}`).then(e=>e.json()),fetch(`${_}/almacen/etiquetas-producto?empresa=${A.value}`).then(e=>e.json()),fetch(`${_}/nomina/empleados-basico?empresa=${A.value}`).then(e=>e.json()),fetch(`${_}/empresas/formato-etiqueta-produccion?empresa=${A.value}`).then(e=>e.json())]);j.value=e.data||[],M.value=t.data||[],N.value=n.data||[],F.value=r.data?.formato_etiqueta_produccion||`6x4`}catch(e){console.error(e)}finally{I.value=!1}}async function Ie(){try{return(await(await fetch(`https://inventario-app-production-e8c8.up.railway.app/api/almacen/lotes-fabricacion/proximo-codigo`)).json()).codigo||K.value}catch{return K.value}}async function Q(e=null){if(H.value={},V.value=``,B.value=!!e,e)W.value={codigo:e.codigo,etiqueta:e.etiqueta,fecha_fab:String(e.fecha_fab).substring(0,10),fecha_vence:e.fecha_vence?String(e.fecha_vence).substring(0,10):``,responsable:e.responsable||``,observaciones:e.observaciones||``};else{let e=await Ie();W.value={...U(),codigo:e}}z.value=!0}function Le(){let e={};return W.value.codigo.trim()||(e.codigo=`Requerido`),W.value.etiqueta||(e.etiqueta=`Requerido`),W.value.fecha_fab||(e.fecha_fab=`Requerido`),H.value=e,Object.keys(e).length===0}async function $(){if(Le()){L.value=!0,V.value=``;try{let e=B.value?`${_}/almacen/lotes-fabricacion/${W.value.codigo}`:`${_}/almacen/lotes-fabricacion`,t=await(await fetch(e,{method:B.value?`PUT`:`POST`,headers:{"Content-Type":`application/json`},body:JSON.stringify(W.value)})).json();if(!t.success)throw Error(t.error);if(B.value){let e=j.value.findIndex(e=>e.codigo===W.value.codigo);e>=0&&(j.value[e]=t.data)}else j.value.unshift(t.data);z.value=!1}catch(e){V.value=e.message}finally{L.value=!1}}}async function Re(e){R.value=e.codigo;try{let t=await(await fetch(`${_}/almacen/lotes-fabricacion/${e.codigo}`,{method:`DELETE`})).json();if(!t.success)throw Error(t.error);j.value=j.value.filter(t=>t.codigo!==e.codigo)}catch(e){alert(e.message)}finally{R.value=null}}function ze(e){let t=k.empresaNombre||``,n=e=>e?new Date(String(e).substring(0,10)+`T12:00:00`).toLocaleDateString(`es`,{day:`2-digit`,month:`2-digit`,year:`numeric`}):`—`,r=e.barcode||e.codigo,i=F.value===`3x4`,a=i?32:45,o=i?1.3:1.8,s=i?`
  @page { size: 4in 3in; margin: 0; }
  * { box-sizing: border-box; margin: 0; padding: 0; font-family: Arial, Helvetica, sans-serif; }
  body { width: 4in; min-height: 3in; background: #fff; color: #000; }

  .lbl { display: flex; flex-direction: column; min-height: 3in; border: 1.5px solid #000; }

  /* Top strip: icon box + badge type "FRAGILE" */
  .lbl-top { display: flex; align-items: stretch; border-bottom: 1.5px solid #000; }
  .top-icon-box { width: 22%; border-right: 1.5px solid #000; padding: 4px; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 2px; }
  .top-icon { width: 18px; height: 18px; border: 1.5px solid #000; border-radius: 3px; display: flex; align-items: center; justify-content: center; font-size: 9pt; font-weight: 900; }
  .top-icon-cap { font-size: 4pt; text-align: center; line-height: 1.2; color: #333; text-transform: uppercase; }
  .top-badge { flex: 1; padding: 4px 6px; display: flex; flex-direction: column; align-items: flex-end; justify-content: center; text-align: right; }
  .badge-title { font-size: 7.5pt; font-weight: 900; text-transform: uppercase; line-height: 1.05; }
  .badge-sub   { font-size: 4.5pt; font-weight: 700; text-transform: uppercase; color: #333; margin-top: 1px; }

  /* Product title bar – centered, no lot reference (shown in footer) */
  .lbl-header-bar { padding: 4px 8px; border-bottom: 1.5px solid #000; text-align: center; }
  .prod-name { font-size: 12pt; font-weight: 900; text-transform: uppercase; line-height: 1.05; }

  /* Net weight / servings boxes */
  .weight-row { display: flex; gap: 4px; padding: 3px 8px; border-bottom: 1px solid #000; }
  .w-box { flex: 1; text-align: center; border: 1px solid #000; padding: 2px 3px; }
  .w-lbl { font-size: 4pt; text-transform: uppercase; font-weight: 700; }
  .w-val { font-size: 6pt; font-weight: 900; }

  /* From/To style dates section */
  .two-col { display: flex; border-bottom: 1px solid #000; }
  .col { flex: 1; padding: 3px 6px; }
  .col:first-child { border-right: 1px solid #000; }
  .col-title { font-size: 4.5pt; font-weight: 900; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 2px; }
  .col-row { font-size: 5pt; line-height: 1.4; }
  .col-lbl { color: #555; }
  .col-val { font-weight: 700; margin-left: 2px; }
  .col-warn { display: inline-block; margin-top: 2px; font-size: 4pt; font-weight: 900; text-transform: uppercase; border: 1px solid #000; padding: 1px 4px; border-radius: 3px; }

  /* Additional information */
  .lbl-extra { flex: 1; padding: 3px 8px; display: flex; flex-direction: column; gap: 2px; }
  .section-title { font-size: 4.5pt; font-weight: 900; text-transform: uppercase; letter-spacing: 0.5px; border-bottom: 1px solid #000; padding-bottom: 1px; margin-bottom: 1px; }
  .section-txt   { font-size: 5pt; line-height: 1.2; }
  .alerg-txt     { font-size: 5pt; font-weight: 700; line-height: 1.15; }
  .instr-txt     { font-size: 4.5pt; font-style: italic; line-height: 1.15; }

  /* Footer: batch code + barcode */
  .lbl-barcode { padding: 3px 8px 5px; text-align: center; border-top: 1.5px solid #000; }
  .footer-title { font-size: 5pt; font-weight: 900; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 1px; }
  .lbl-barcode svg { max-width: 100%; }
  .bc-num { font-size: 5pt; margin-top: 1px; font-family: monospace; letter-spacing: 0.5px; }
`:`
  @page { size: 4in 6in; margin: 0; }
  * { box-sizing: border-box; margin: 0; padding: 0; font-family: Arial, Helvetica, sans-serif; }
  body { width: 4in; min-height: 6in; background: #fff; color: #000; }

  .lbl { display: flex; flex-direction: column; min-height: 6in; border: 1.5px solid #000; }

  /* Header: empresa – solo borde inferior, sin fondo */
  .lbl-header { padding: 7px 12px 5px; text-align: center; border-bottom: 2px solid #000; }
  .emp-name { font-size: 13pt; font-weight: 900; letter-spacing: 0.5px; text-transform: uppercase; }
  .emp-sub  { font-size: 7pt; color: #333; margin-top: 1px; }

  /* Producto – centrado, sin fondo */
  .lbl-product { padding: 7px 12px 6px; text-align: center; border-bottom: 1.5px solid #000; }
  .prod-name { font-size: 16pt; font-weight: 900; text-transform: uppercase; line-height: 1.1; }
  .lot-tag   { font-size: 7.5pt; font-family: monospace; letter-spacing: 1.5px; margin-top: 3px; color: #333; }

  /* Cuerpo */
  .lbl-body { flex: 1; padding: 7px 12px; display: flex; flex-direction: column; gap: 6px; }

  /* Fechas */
  .dates-row { display: flex; gap: 8px; }
  .date-box  { flex: 1; border: 1px solid #000; padding: 4px 7px; }
  .date-lbl  { font-size: 6pt; font-weight: 900; text-transform: uppercase; letter-spacing: 0.5px; }
  .date-val  { font-size: 10pt; font-weight: 900; }

  /* Pesos */
  .weight-row { display: flex; gap: 6px; }
  .w-box { flex: 1; text-align: center; border: 1px solid #000; padding: 3px 5px; }
  .w-lbl { font-size: 6pt; text-transform: uppercase; font-weight: 700; }
  .w-val { font-size: 9pt; font-weight: 900; }

  /* Secciones */
  .section-title { font-size: 6.5pt; font-weight: 900; text-transform: uppercase; letter-spacing: 0.8px; border-bottom: 1px solid #000; padding-bottom: 1px; margin-bottom: 2px; }
  .section-txt   { font-size: 7.5pt; line-height: 1.35; }
  .alerg-txt     { font-size: 7.5pt; font-weight: 700; line-height: 1.3; }
  .instr-txt     { font-size: 7pt; font-style: italic; line-height: 1.3; }

  /* Barcode */
  .lbl-barcode { padding: 6px 12px 8px; text-align: center; border-top: 1.5px solid #000; }
  .lbl-barcode svg { max-width: 100%; }
  .bc-num { font-size: 7pt; margin-top: 1px; font-family: monospace; letter-spacing: 1px; }
`,c=`<!DOCTYPE html><html><head><meta charset="UTF-8">
<title>Label – ${e.etiqueta_nombre||e.etiqueta} – ${e.codigo}</title>
<script src="https://cdn.jsdelivr.net/npm/jsbarcode@3.11.6/dist/JsBarcode.all.min.js"><\/script>
<style>
${s}
  /* Botón imprimir – solo pantalla */
  @media screen {
    .print-btn-wrap { text-align: center; padding: 12px; }
    .print-btn { background: #000; color: #fff; border: none; padding: 8px 24px; font-size: 11pt; font-weight: 700; cursor: pointer; border-radius: 4px; }
    .print-btn:hover { background: #333; }
  }
  @media print {
    .print-btn-wrap { display: none; }
    body { margin: 0; }
  }
</style>
</head><body>
<div class="print-btn-wrap">
  <button class="print-btn" onclick="window.print()">🖨 Print Label</button>
</div>
${i?`
<div class="lbl">
  <div class="lbl-top">
    <div class="top-icon-box">
      <div class="top-icon">${(t||`P`).charAt(0).toUpperCase()}</div>
      <div class="top-icon-cap">${t}</div>
    </div>
    <div class="top-badge">
      <div class="badge-title">PRODUCTION<br>BATCH</div>
    </div>
  </div>

  <div class="lbl-header-bar">
    <div class="prod-name">${e.etiqueta_nombre||e.etiqueta}</div>
  </div>

  ${e.peso_neto_oz||e.peso_neto_g||e.porciones||e.tamano_porcion?`
  <div class="weight-row">
    ${e.peso_neto_oz?`<div class="w-box"><div class="w-lbl">Net Weight</div><div class="w-val">${e.peso_neto_oz} oz</div></div>`:``}
    ${e.peso_neto_g?`<div class="w-box"><div class="w-lbl">Net Weight</div><div class="w-val">${e.peso_neto_g} g</div></div>`:``}
    ${e.porciones?`<div class="w-box"><div class="w-lbl">Servings</div><div class="w-val">${e.porciones}</div></div>`:``}
    ${e.tamano_porcion?`<div class="w-box"><div class="w-lbl">Serving Size</div><div class="w-val">${e.tamano_porcion}</div></div>`:``}
  </div>`:``}

  <div class="two-col">
    <div class="col">
      <div class="col-title">Manufactured</div>
      <div class="col-row"><span class="col-lbl">Date:</span><span class="col-val">${n(e.fecha_fab)}</span></div>
    </div>
    <div class="col">
      <div class="col-title">Best By / Exp.</div>
      <div class="col-row"><span class="col-lbl">Date:</span><span class="col-val">${n(e.fecha_vence)}</span></div>
      ${Z(e.fecha_vence)?`<div class="col-warn">Expiring Soon</div>`:``}
    </div>
  </div>

  ${e.ingredientes||e.alergenos||e.instrucciones?`
  <div class="lbl-extra">
    ${e.ingredientes?`
    <div>
      <div class="section-title">Ingredients</div>
      <div class="section-txt">${e.ingredientes}</div>
    </div>`:``}

    ${e.alergenos?`
    <div>
      <div class="section-title">Contains / Allergens</div>
      <div class="alerg-txt">${e.alergenos}</div>
    </div>`:``}

    ${e.instrucciones?`
    <div>
      <div class="section-title">Storage Instructions</div>
      <div class="instr-txt">${e.instrucciones}</div>
    </div>`:``}
  </div>`:``}

  <div class="lbl-barcode">
    <svg id="bc"></svg>
    <div class="bc-num">${r}</div>
  </div>
</div>`:`
<div class="lbl">
  <div class="lbl-header">
    <div class="emp-name">${t}</div>
  </div>

  <div class="lbl-product">
    <div class="prod-name">${e.etiqueta_nombre||e.etiqueta}</div>
    <div class="lot-tag">LOT: ${e.codigo}</div>
  </div>

  <div class="lbl-body">
    <div class="dates-row">
      <div class="date-box">
        <div class="date-lbl">Manufactured</div>
        <div class="date-val">${n(e.fecha_fab)}</div>
      </div>
      <div class="date-box">
        <div class="date-lbl">Best By / Exp. Date</div>
        <div class="date-val">${n(e.fecha_vence)}</div>
      </div>
    </div>

    ${e.peso_neto_oz||e.peso_neto_g||e.porciones||e.tamano_porcion?`
    <div class="weight-row">
      ${e.peso_neto_oz?`<div class="w-box"><div class="w-lbl">Net Weight</div><div class="w-val">${e.peso_neto_oz} oz</div></div>`:``}
      ${e.peso_neto_g?`<div class="w-box"><div class="w-lbl">Net Weight</div><div class="w-val">${e.peso_neto_g} g</div></div>`:``}
      ${e.porciones?`<div class="w-box"><div class="w-lbl">Servings</div><div class="w-val">${e.porciones}</div></div>`:``}
      ${e.tamano_porcion?`<div class="w-box"><div class="w-lbl">Serving Size</div><div class="w-val">${e.tamano_porcion}</div></div>`:``}
    </div>`:``}

    ${e.ingredientes?`
    <div>
      <div class="section-title">Ingredients</div>
      <div class="section-txt">${e.ingredientes}</div>
    </div>`:``}

    ${e.alergenos?`
    <div>
      <div class="section-title">Contains / Allergens</div>
      <div class="alerg-txt">${e.alergenos}</div>
    </div>`:``}

    ${e.instrucciones?`
    <div>
      <div class="section-title">Storage Instructions</div>
      <div class="instr-txt">${e.instrucciones}</div>
    </div>`:``}
  </div>

  <div class="lbl-barcode">
    <svg id="bc"></svg>
    <div class="bc-num">${r}</div>
  </div>
</div>`}
<script>
  window.onload = function() {
    try {
      JsBarcode("#bc", "${r}", {
        format: "CODE128", width: ${o}, height: ${a},
        displayValue: false, margin: 0, background: "#ffffff", lineColor: "#000000"
      });
    } catch(e) {}
  };
<\/script>
</body></html>`,l=window.open(``,`_blank`);l.document.write(c),l.document.close()}return te(Fe),(o,u)=>(S(),re(r,null,{default:g(()=>[b(`div`,oe,[v(ae,{title:`Lotes de Fabricación`,description:`Lotes de fabricación por etiqueta de producto`,crumbs:[`Almacén`,`Procesos`,`Lotes de Fabricación`]},{actions:g(()=>[v(e,{color:`success`,variant:`flat`,"prepend-icon":`mdi-plus`,onClick:u[0]||=e=>Q()},{default:g(()=>[...u[11]||=[p(` Nuevo Lote `,-1)]]),_:1})]),_:1}),b(`div`,se,[b(`div`,ce,[v(C,{size:`17`,color:`rgba(var(--v-theme-on-surface),.4)`},{default:g(()=>[...u[12]||=[p(`mdi-magnify`,-1)]]),_:1}),a(b(`input`,{"onUpdate:modelValue":u[1]||=e=>P.value=e,type:`text`,placeholder:`Buscar por código, etiqueta o responsable...`,class:`search-input`},null,512),[[l,P.value]])]),b(`span`,le,f(Y.value.length)+` lotes`,1)]),b(`div`,ue,[I.value?(S(),h(`div`,de,[v(ie,{indeterminate:``,color:`success`,size:`36`})])):(S(),h(`table`,fe,[u[15]||=b(`thead`,null,[b(`tr`,null,[b(`th`,null,`CÓDIGO LOTE`),b(`th`,null,`PRODUCTO`),b(`th`,{class:`col-center`},`FECHA FABRICACIÓN`),b(`th`,{class:`col-center`},`FECHA VENCIMIENTO`),b(`th`,null,`RESPONSABLE`),b(`th`,{class:`col-acc`},`ACCIONES`)])],-1),b(`tbody`,null,[Y.value.length===0?(S(),h(`tr`,pe,[b(`td`,me,[v(C,{size:`40`,color:`rgba(var(--v-theme-on-surface),.15)`},{default:g(()=>[...u[13]||=[p(`mdi-factory`,-1)]]),_:1}),u[14]||=b(`p`,null,`No hay lotes registrados`,-1)])])):y(``,!0),(S(!0),h(d,null,x(Y.value,t=>(S(),h(`tr`,{key:t.codigo,class:`data-row`},[b(`td`,null,[b(`span`,he,f(t.codigo),1)]),b(`td`,ge,f(t.etiqueta_nombre||`—`),1),b(`td`,_e,f(X(t.fecha_fab)),1),b(`td`,ve,[b(`span`,{class:c(Z(t.fecha_vence)?`chip-warn`:``)},f(X(t.fecha_vence)),3)]),b(`td`,null,f(t.responsable||`—`),1),b(`td`,ye,[v(e,{icon:`mdi-printer-outline`,size:`x-small`,variant:`text`,color:`success`,onClick:e=>ze(t)},null,8,[`onClick`]),v(e,{icon:`mdi-pencil-outline`,size:`x-small`,variant:`text`,color:`primary`,onClick:e=>Q(t)},null,8,[`onClick`]),v(e,{icon:`mdi-delete-outline`,size:`x-small`,variant:`text`,color:`error`,loading:R.value===t.codigo,onClick:e=>Re(t)},null,8,[`loading`,`onClick`])])]))),128))])]))]),v(t,{modelValue:z.value,"onUpdate:modelValue":u[10]||=e=>z.value=e,"max-width":`560`},{default:g(()=>[v(i,{class:`modal-card`},{default:g(()=>[b(`div`,be,[v(C,{color:`success`,class:`mr-2`},{default:g(()=>[...u[16]||=[p(`mdi-factory`,-1)]]),_:1}),b(`span`,null,f(B.value?`Editar Lote`:`Nuevo Lote de Fabricación`),1),v(n),v(e,{icon:`mdi-close`,size:`small`,variant:`text`,onClick:u[2]||=e=>z.value=!1})]),b(`div`,xe,[b(`div`,Se,[u[17]||=b(`label`,{class:`field-label`},`Código de Lote`,-1),b(`div`,Ce,[a(b(`input`,{"onUpdate:modelValue":u[3]||=e=>W.value.codigo=e,disabled:B.value,type:`text`,maxlength:`20`,class:c([`field-input cod-input`,{"field-error":H.value.codigo}])},null,10,we),[[l,W.value.codigo]]),b(`span`,Te,`Formato: MMDDAAXXX (ej. `+f(K.value)+`)`,1)]),H.value.codigo?(S(),h(`span`,w,f(H.value.codigo),1)):y(``,!0)]),b(`div`,T,[u[19]||=b(`label`,{class:`field-label`},`Producto *`,-1),a(b(`select`,{"onUpdate:modelValue":u[4]||=e=>W.value.etiqueta=e,class:c([`field-input field-select`,{"field-error":H.value.etiqueta}])},[u[18]||=b(`option`,{value:``},`— Seleccionar —`,-1),(S(!0),h(d,null,x(M.value,e=>(S(),h(`option`,{key:e.codigo,value:e.codigo},f(e.codigo)+` — `+f(e.producto),9,E))),128))],2),[[s,W.value.etiqueta]]),H.value.etiqueta?(S(),h(`span`,D,f(H.value.etiqueta),1)):y(``,!0)]),b(`div`,O,[b(`div`,Ee,[u[20]||=b(`label`,{class:`field-label`},`Fecha de Fabricación *`,-1),a(b(`input`,{"onUpdate:modelValue":u[5]||=e=>W.value.fecha_fab=e,type:`date`,class:c([`field-input`,{"field-error":H.value.fecha_fab}])},null,2),[[l,W.value.fecha_fab]]),H.value.fecha_fab?(S(),h(`span`,De,f(H.value.fecha_fab),1)):y(``,!0)]),b(`div`,Oe,[u[21]||=b(`label`,{class:`field-label`},`Fecha de Vencimiento`,-1),a(b(`input`,{"onUpdate:modelValue":u[6]||=e=>W.value.fecha_vence=e,type:`date`,class:`field-input`},null,512),[[l,W.value.fecha_vence]]),q.value?(S(),h(`span`,ke,` Sugerido: `+f(J.value)+` (`+f(q.value)+` días) `,1)):y(``,!0)])]),b(`div`,Ae,[u[23]||=b(`label`,{class:`field-label`},`Responsable`,-1),a(b(`select`,{"onUpdate:modelValue":u[7]||=e=>W.value.responsable=e,class:`field-input field-select`},[u[22]||=b(`option`,{value:``},`— Seleccionar —`,-1),(S(!0),h(d,null,x(N.value,e=>(S(),h(`option`,{key:e.id,value:`${e.nombre} ${e.apellido}`},f(e.nombre)+` `+f(e.apellido),9,je))),128))],512),[[s,W.value.responsable]])]),b(`div`,Me,[u[24]||=b(`label`,{class:`field-label`},`Observaciones`,-1),a(b(`textarea`,{"onUpdate:modelValue":u[8]||=e=>W.value.observaciones=e,rows:`2`,class:`field-input field-textarea`},null,512),[[l,W.value.observaciones]])]),V.value?(S(),h(`div`,Ne,f(V.value),1)):y(``,!0)]),b(`div`,Pe,[v(e,{variant:`text`,onClick:u[9]||=e=>z.value=!1},{default:g(()=>[...u[25]||=[p(`Cancelar`,-1)]]),_:1}),v(e,{color:`success`,variant:`flat`,loading:L.value,onClick:$},{default:g(()=>[p(f(B.value?`Guardar Cambios`:`Crear Lote`),1)]),_:1},8,[`loading`])])]),_:1})]),_:1},8,[`modelValue`])])]),_:1}))}},[[`__scopeId`,`data-v-14738783`]]);export{k as default};