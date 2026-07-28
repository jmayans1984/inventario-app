import{t as e,v as t}from"./VBtn.js";import{c as n,o as r,t as i,x as a}from"./MainLayout.js";import{An as o,Dn as s,Gt as c,Kn as l,Kt as u,Ln as d,Xt as f,Yn as p,a as ee,an as m,en as h,gn as te,in as g,kn as _,n as ne,nn as re,o as v,on as y,rn as b,tn as x,xn as S,yn as C}from"./index.js";import{t as w}from"./VIcon.js";import{t as ie}from"./PageHeader.js";var ae={class:`pg-container`},oe={class:`toolbar`},se={class:`search-wrap`},ce={class:`count-badge`},le={class:`tabla-card`},ue={key:0,class:`loading-wrap`},de={key:1,class:`crud-table`},fe={key:0},pe={colspan:`6`,class:`empty-row`},me={class:`cod-badge`},he={class:`fw500`},ge={class:`col-center`},_e={class:`col-center`},ve={class:`col-acc`},ye={class:`modal-header`},be={class:`modal-body`},xe={class:`field-group`},Se={class:`cod-wrap`},Ce=[`disabled`],we={class:`cod-hint`},Te={key:0,class:`error-txt`},T={class:`field-group`},E=[`value`],D={key:0,class:`error-txt`},O={class:`form-row-2`},Ee={class:`field-group`},De={key:0,class:`error-txt`},Oe={class:`field-group`},ke={key:0,class:`hint-txt`},Ae={class:`field-group`},je=[`value`],Me={class:`field-group`},Ne={key:0,class:`api-error`},Pe={class:`modal-footer`},k=ne({__name:`LotesFabricacionView`,setup(ne){let k=ee(),A=h(()=>k.empresaCodigo),j=d([]),M=d([]),N=d([]),P=d(``),F=d(`6x4`),I=d(!1),L=d(!1),R=d(null),z=d(!1),B=d(!1),V=d(``),H=d({}),U=()=>({codigo:``,etiqueta:``,fecha_fab:new Date().toISOString().split(`T`)[0],fecha_vence:``,responsable:``,observaciones:``}),W=d(U()),G=new Date,K=h(()=>`${String(G.getMonth()+1).padStart(2,`0`)}${String(G.getDate()).padStart(2,`0`)}${String(G.getFullYear()).slice(-2)}001`),q=h(()=>!W.value.etiqueta||!W.value.fecha_fab?null:M.value.find(e=>e.codigo===W.value.etiqueta)?.dias_vencimiento||null),J=h(()=>{if(!q.value||!W.value.fecha_fab)return``;let e=new Date(W.value.fecha_fab+`T12:00:00`);return e.setDate(e.getDate()+q.value),e.toISOString().split(`T`)[0]});s([()=>W.value.etiqueta,()=>W.value.fecha_fab],()=>{J.value&&(W.value.fecha_vence=J.value)});let Y=h(()=>{let e=P.value.toLowerCase();return j.value.filter(t=>t.codigo.toLowerCase().includes(e)||(t.etiqueta_nombre||``).toLowerCase().includes(e)||(t.etiqueta||``).toLowerCase().includes(e)||(t.responsable||``).toLowerCase().includes(e))});function X(e){return e?new Date(String(e).substring(0,10)+`T12:00:00`).toLocaleDateString(`es`,{day:`2-digit`,month:`short`,year:`numeric`}):`—`}function Z(e){if(!e)return!1;let t=(new Date(String(e).substring(0,10)+`T12:00:00`)-new Date)/(1e3*60*60*24);return t>=0&&t<=7}async function Fe(){I.value=!0;try{let[e,t,n,r]=await Promise.all([fetch(`${v}/almacen/lotes-fabricacion?empresa=${A.value}`).then(e=>e.json()),fetch(`${v}/almacen/etiquetas-producto?empresa=${A.value}`).then(e=>e.json()),fetch(`${v}/nomina/empleados-basico?empresa=${A.value}`).then(e=>e.json()),fetch(`${v}/empresas/formato-etiqueta-produccion?empresa=${A.value}`).then(e=>e.json())]);j.value=e.data||[],M.value=t.data||[],N.value=n.data||[],F.value=r.data?.formato_etiqueta_produccion||`6x4`}catch(e){console.error(e)}finally{I.value=!1}}async function Ie(){try{return(await(await fetch(`https://inventario-app-production-e8c8.up.railway.app/api/almacen/lotes-fabricacion/proximo-codigo`)).json()).codigo||K.value}catch{return K.value}}async function Q(e=null){if(H.value={},V.value=``,B.value=!!e,e)W.value={codigo:e.codigo,etiqueta:e.etiqueta,fecha_fab:String(e.fecha_fab).substring(0,10),fecha_vence:e.fecha_vence?String(e.fecha_vence).substring(0,10):``,responsable:e.responsable||``,observaciones:e.observaciones||``};else{let e=await Ie();W.value={...U(),codigo:e}}z.value=!0}function Le(){let e={};return W.value.codigo.trim()||(e.codigo=`Requerido`),W.value.etiqueta||(e.etiqueta=`Requerido`),W.value.fecha_fab||(e.fecha_fab=`Requerido`),H.value=e,Object.keys(e).length===0}async function $(){if(Le()){L.value=!0,V.value=``;try{let e=B.value?`${v}/almacen/lotes-fabricacion/${W.value.codigo}`:`${v}/almacen/lotes-fabricacion`,t=await(await fetch(e,{method:B.value?`PUT`:`POST`,headers:{"Content-Type":`application/json`},body:JSON.stringify(W.value)})).json();if(!t.success)throw Error(t.error);if(B.value){let e=j.value.findIndex(e=>e.codigo===W.value.codigo);e>=0&&(j.value[e]=t.data)}else j.value.unshift(t.data);z.value=!1}catch(e){V.value=e.message}finally{L.value=!1}}}async function Re(e){R.value=e.codigo;try{let t=await(await fetch(`${v}/almacen/lotes-fabricacion/${e.codigo}`,{method:`DELETE`})).json();if(!t.success)throw Error(t.error);j.value=j.value.filter(t=>t.codigo!==e.codigo)}catch(e){alert(e.message)}finally{R.value=null}}function ze(e){let t=k.empresaNombre||``,n=e=>e?new Date(String(e).substring(0,10)+`T12:00:00`).toLocaleDateString(`es`,{day:`2-digit`,month:`2-digit`,year:`numeric`}):`—`,r=e.barcode||e.codigo,i=F.value===`3x4`,a=i?32:45,o=i?1.3:1.8,s=i?`
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
</body></html>`,l=window.open(``,`_blank`);l.document.write(c),l.document.close()}return te(Fe),(s,d)=>(C(),re(i,null,{default:_(()=>[x(`div`,ae,[y(ie,{title:`Lotes de Fabricación`,description:`Lotes de fabricación por etiqueta de producto`,crumbs:[`Almacén`,`Procesos`,`Lotes de Fabricación`]},{actions:_(()=>[y(e,{color:`success`,variant:`flat`,"prepend-icon":`mdi-plus`,onClick:d[0]||=e=>Q()},{default:_(()=>[...d[11]||=[m(` Nuevo Lote `,-1)]]),_:1})]),_:1}),x(`div`,oe,[x(`div`,se,[y(w,{size:`17`,color:`rgba(var(--v-theme-on-surface),.4)`},{default:_(()=>[...d[12]||=[m(`mdi-magnify`,-1)]]),_:1}),o(x(`input`,{"onUpdate:modelValue":d[1]||=e=>P.value=e,type:`text`,placeholder:`Buscar por código, etiqueta o responsable...`,class:`search-input`},null,512),[[u,P.value]])]),x(`span`,ce,p(Y.value.length)+` lotes`,1)]),x(`div`,le,[I.value?(C(),g(`div`,ue,[y(t,{indeterminate:``,color:`success`,size:`36`})])):(C(),g(`table`,de,[d[15]||=x(`thead`,null,[x(`tr`,null,[x(`th`,null,`CÓDIGO LOTE`),x(`th`,null,`PRODUCTO`),x(`th`,{class:`col-center`},`FECHA FABRICACIÓN`),x(`th`,{class:`col-center`},`FECHA VENCIMIENTO`),x(`th`,null,`RESPONSABLE`),x(`th`,{class:`col-acc`},`ACCIONES`)])],-1),x(`tbody`,null,[Y.value.length===0?(C(),g(`tr`,fe,[x(`td`,pe,[y(w,{size:`40`,color:`rgba(var(--v-theme-on-surface),.15)`},{default:_(()=>[...d[13]||=[m(`mdi-factory`,-1)]]),_:1}),d[14]||=x(`p`,null,`No hay lotes registrados`,-1)])])):b(``,!0),(C(!0),g(f,null,S(Y.value,t=>(C(),g(`tr`,{key:t.codigo,class:`data-row`},[x(`td`,null,[x(`span`,me,p(t.codigo),1)]),x(`td`,he,p(t.etiqueta_nombre||`—`),1),x(`td`,ge,p(X(t.fecha_fab)),1),x(`td`,_e,[x(`span`,{class:l(Z(t.fecha_vence)?`chip-warn`:``)},p(X(t.fecha_vence)),3)]),x(`td`,null,p(t.responsable||`—`),1),x(`td`,ve,[y(e,{icon:`mdi-printer-outline`,size:`x-small`,variant:`text`,color:`success`,onClick:e=>ze(t)},null,8,[`onClick`]),y(e,{icon:`mdi-pencil-outline`,size:`x-small`,variant:`text`,color:`primary`,onClick:e=>Q(t)},null,8,[`onClick`]),y(e,{icon:`mdi-delete-outline`,size:`x-small`,variant:`text`,color:`error`,loading:R.value===t.codigo,onClick:e=>Re(t)},null,8,[`loading`,`onClick`])])]))),128))])]))]),y(n,{modelValue:z.value,"onUpdate:modelValue":d[10]||=e=>z.value=e,"max-width":`560`},{default:_(()=>[y(a,{class:`modal-card`},{default:_(()=>[x(`div`,ye,[y(w,{color:`success`,class:`mr-2`},{default:_(()=>[...d[16]||=[m(`mdi-factory`,-1)]]),_:1}),x(`span`,null,p(B.value?`Editar Lote`:`Nuevo Lote de Fabricación`),1),y(r),y(e,{icon:`mdi-close`,size:`small`,variant:`text`,onClick:d[2]||=e=>z.value=!1})]),x(`div`,be,[x(`div`,xe,[d[17]||=x(`label`,{class:`field-label`},`Código de Lote`,-1),x(`div`,Se,[o(x(`input`,{"onUpdate:modelValue":d[3]||=e=>W.value.codigo=e,disabled:B.value,type:`text`,maxlength:`20`,class:l([`field-input cod-input`,{"field-error":H.value.codigo}])},null,10,Ce),[[u,W.value.codigo]]),x(`span`,we,`Formato: MMDDAAXXX (ej. `+p(K.value)+`)`,1)]),H.value.codigo?(C(),g(`span`,Te,p(H.value.codigo),1)):b(``,!0)]),x(`div`,T,[d[19]||=x(`label`,{class:`field-label`},`Producto *`,-1),o(x(`select`,{"onUpdate:modelValue":d[4]||=e=>W.value.etiqueta=e,class:l([`field-input field-select`,{"field-error":H.value.etiqueta}])},[d[18]||=x(`option`,{value:``},`— Seleccionar —`,-1),(C(!0),g(f,null,S(M.value,e=>(C(),g(`option`,{key:e.codigo,value:e.codigo},p(e.codigo)+` — `+p(e.producto),9,E))),128))],2),[[c,W.value.etiqueta]]),H.value.etiqueta?(C(),g(`span`,D,p(H.value.etiqueta),1)):b(``,!0)]),x(`div`,O,[x(`div`,Ee,[d[20]||=x(`label`,{class:`field-label`},`Fecha de Fabricación *`,-1),o(x(`input`,{"onUpdate:modelValue":d[5]||=e=>W.value.fecha_fab=e,type:`date`,class:l([`field-input`,{"field-error":H.value.fecha_fab}])},null,2),[[u,W.value.fecha_fab]]),H.value.fecha_fab?(C(),g(`span`,De,p(H.value.fecha_fab),1)):b(``,!0)]),x(`div`,Oe,[d[21]||=x(`label`,{class:`field-label`},`Fecha de Vencimiento`,-1),o(x(`input`,{"onUpdate:modelValue":d[6]||=e=>W.value.fecha_vence=e,type:`date`,class:`field-input`},null,512),[[u,W.value.fecha_vence]]),q.value?(C(),g(`span`,ke,` Sugerido: `+p(J.value)+` (`+p(q.value)+` días) `,1)):b(``,!0)])]),x(`div`,Ae,[d[23]||=x(`label`,{class:`field-label`},`Responsable`,-1),o(x(`select`,{"onUpdate:modelValue":d[7]||=e=>W.value.responsable=e,class:`field-input field-select`},[d[22]||=x(`option`,{value:``},`— Seleccionar —`,-1),(C(!0),g(f,null,S(N.value,e=>(C(),g(`option`,{key:e.id,value:`${e.nombre} ${e.apellido}`},p(e.nombre)+` `+p(e.apellido),9,je))),128))],512),[[c,W.value.responsable]])]),x(`div`,Me,[d[24]||=x(`label`,{class:`field-label`},`Observaciones`,-1),o(x(`textarea`,{"onUpdate:modelValue":d[8]||=e=>W.value.observaciones=e,rows:`2`,class:`field-input field-textarea`},null,512),[[u,W.value.observaciones]])]),V.value?(C(),g(`div`,Ne,p(V.value),1)):b(``,!0)]),x(`div`,Pe,[y(e,{variant:`text`,onClick:d[9]||=e=>z.value=!1},{default:_(()=>[...d[25]||=[m(`Cancelar`,-1)]]),_:1}),y(e,{color:`success`,variant:`flat`,loading:L.value,onClick:$},{default:_(()=>[m(p(B.value?`Guardar Cambios`:`Crear Lote`),1)]),_:1},8,[`loading`])])]),_:1})]),_:1},8,[`modelValue`])])]),_:1}))}},[[`__scopeId`,`data-v-14738783`]]);export{k as default};