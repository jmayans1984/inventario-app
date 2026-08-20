import{c as e,o as t,t as n}from"./MainLayout.js";import{$n as r,Fn as i,G as a,H as o,In as s,Jn as c,K as l,Ln as u,Mn as d,Nn as f,Pn as ee,Rn as p,Tn as m,Zn as h,a as g,ar as _,fr as v,kn as y,l as b,or as x,r as te,rr as ne,wn as S,wr as C,xr as w}from"./index.js";import{t as T}from"./VBtn.js";import{t as re}from"./PageHeader.js";var ie={class:`pg-container`},ae={class:`toolbar`},oe={class:`search-wrap`},se={class:`count-badge`},ce={class:`tabla-card`},le={key:0,class:`loading-wrap`},ue={key:1,class:`crud-table`},de={key:0},fe={colspan:`6`,class:`empty-row`},pe={class:`cod-badge`},me={class:`fw500`},he={class:`col-center`},ge={class:`col-center`},_e={class:`col-acc`},ve={class:`modal-header`},ye={class:`modal-body`},be={class:`field-group`},xe={class:`cod-wrap`},Se=[`disabled`],Ce={class:`cod-hint`},we={key:0,class:`error-txt`},E={class:`field-group`},D=[`value`],O={key:0,class:`error-txt`},k={class:`form-row-2`},Te={class:`field-group`},Ee={key:0,class:`error-txt`},De={class:`field-group`},Oe={key:0,class:`hint-txt`},ke={class:`field-group`},Ae=[`value`],je={class:`field-group`},Me={key:0,class:`api-error`},Ne={class:`modal-footer`},A=o({__name:`LotesFabricacionView`,setup(o){let A=a(),j=d(()=>A.empresaCodigo),M=v([]),N=v([]),P=v([]),F=v(``),I=v(`6x4`),L=v(!1),R=v(!1),z=v(null),B=v(!1),V=v(!1),H=v(``),U=v({}),W=()=>({codigo:``,etiqueta:``,fecha_fab:new Date().toISOString().split(`T`)[0],fecha_vence:``,responsable:``,observaciones:``}),G=v(W()),K=new Date,q=d(()=>`${String(K.getMonth()+1).padStart(2,`0`)}${String(K.getDate()).padStart(2,`0`)}${String(K.getFullYear()).slice(-2)}001`),J=d(()=>!G.value.etiqueta||!G.value.fecha_fab?null:N.value.find(e=>e.codigo===G.value.etiqueta)?.dias_vencimiento||null),Y=d(()=>{if(!J.value||!G.value.fecha_fab)return``;let e=new Date(G.value.fecha_fab+`T12:00:00`);return e.setDate(e.getDate()+J.value),e.toISOString().split(`T`)[0]});ne([()=>G.value.etiqueta,()=>G.value.fecha_fab],()=>{Y.value&&(G.value.fecha_vence=Y.value)});let X=d(()=>{let e=F.value.toLowerCase();return M.value.filter(t=>t.codigo.toLowerCase().includes(e)||(t.etiqueta_nombre||``).toLowerCase().includes(e)||(t.etiqueta||``).toLowerCase().includes(e)||(t.responsable||``).toLowerCase().includes(e))});function Z(e){if(!e)return`—`;let t=new Date(String(e).substring(0,10)+`T12:00:00`);return`${String(t.getMonth()+1).padStart(2,`0`)}/${String(t.getDate()).padStart(2,`0`)}/${t.getFullYear()}`}function Q(e){if(!e)return!1;let t=(new Date(String(e).substring(0,10)+`T12:00:00`)-new Date)/(1e3*60*60*24);return t>=0&&t<=7}async function Pe(){L.value=!0;try{let[e,t,n,r]=await Promise.all([fetch(`${l}/almacen/lotes-fabricacion?empresa=${j.value}`).then(e=>e.json()),fetch(`${l}/almacen/etiquetas-producto?empresa=${j.value}`).then(e=>e.json()),fetch(`${l}/nomina/empleados-basico?empresa=${j.value}`).then(e=>e.json()),fetch(`${l}/empresas/formato-etiqueta-produccion?empresa=${j.value}`).then(e=>e.json())]);M.value=e.data||[],N.value=t.data||[],P.value=n.data||[],I.value=r.data?.formato_etiqueta_produccion||`6x4`}catch(e){console.error(e)}finally{L.value=!1}}async function Fe(){try{return(await(await fetch(`https://inventario-app-production-e8c8.up.railway.app/api/almacen/lotes-fabricacion/proximo-codigo`)).json()).codigo||q.value}catch{return q.value}}async function $(e=null){if(U.value={},H.value=``,V.value=!!e,e)G.value={codigo:e.codigo,etiqueta:e.etiqueta,fecha_fab:String(e.fecha_fab).substring(0,10),fecha_vence:e.fecha_vence?String(e.fecha_vence).substring(0,10):``,responsable:e.responsable||``,observaciones:e.observaciones||``};else{let e=await Fe();G.value={...W(),codigo:e}}B.value=!0}function Ie(){let e={};return G.value.codigo.trim()||(e.codigo=`Requerido`),G.value.etiqueta||(e.etiqueta=`Requerido`),G.value.fecha_fab||(e.fecha_fab=`Requerido`),U.value=e,Object.keys(e).length===0}async function Le(){if(Ie()){R.value=!0,H.value=``;try{let e=V.value?`${l}/almacen/lotes-fabricacion/${G.value.codigo}`:`${l}/almacen/lotes-fabricacion`,t=await(await fetch(e,{method:V.value?`PUT`:`POST`,headers:{"Content-Type":`application/json`},body:JSON.stringify(G.value)})).json();if(!t.success)throw Error(t.error);if(V.value){let e=M.value.findIndex(e=>e.codigo===G.value.codigo);e>=0&&(M.value[e]=t.data)}else M.value.unshift(t.data);B.value=!1}catch(e){H.value=e.message}finally{R.value=!1}}}async function Re(e){z.value=e.codigo;try{let t=await(await fetch(`${l}/almacen/lotes-fabricacion/${e.codigo}`,{method:`DELETE`})).json();if(!t.success)throw Error(t.error);M.value=M.value.filter(t=>t.codigo!==e.codigo)}catch(e){alert(e.message)}finally{z.value=null}}function ze(e){let t=A.empresaNombre||``,n=e=>{if(!e)return`—`;let t=new Date(String(e).substring(0,10)+`T12:00:00`);return`${String(t.getMonth()+1).padStart(2,`0`)}/${String(t.getDate()).padStart(2,`0`)}/${t.getFullYear()}`},r=e.barcode||e.codigo,i=I.value===`3x4`,a=i?32:45,o=i?1.3:1.8,s=i?`
  @page { size: 4in 3in; margin: 0; }
  * { box-sizing: border-box; margin: 0; padding: 0; font-family: Arial, Helvetica, sans-serif; }
  body { width: 4in; min-height: 3in; background: #fff; color: #000; }

  .lbl { display: flex; flex-direction: column; min-height: 3in; border: 1.5px solid #000; }

  /* Top strip: icon box + badge type "FRAGILE" */
  .lbl-top { display: flex; align-items: stretch; border-bottom: 1.5px solid #000; }
  .top-icon-box { width: 22%; border-right: 1.5px solid #000; padding: 4px; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 2px; }
  .top-icon { width: 18px; height: 18px; border: 1.5px solid #000; border-radius: 3px; display: flex; align-items: center; justify-content: center; font-size: 9pt; font-weight: 900; }
  .top-icon-cap { font-size: 5.5pt; text-align: center; line-height: 1.2; color: #333; text-transform: uppercase; }
  .top-badge { flex: 1; padding: 4px 6px; display: flex; flex-direction: column; align-items: flex-end; justify-content: center; text-align: right; }
  .badge-title { font-size: 7.5pt; font-weight: 900; text-transform: uppercase; line-height: 1.05; }
  .badge-sub   { font-size: 6pt; font-weight: 700; text-transform: uppercase; color: #333; margin-top: 1px; }

  /* Product title bar – centered, no lot reference (shown in footer) */
  .lbl-header-bar { padding: 4px 8px; border-bottom: 1.5px solid #000; text-align: center; }
  .prod-name { font-size: 12pt; font-weight: 900; text-transform: uppercase; line-height: 1.05; }

  /* Net weight / servings boxes */
  .weight-row { display: flex; gap: 4px; padding: 3px 8px; border-bottom: 1px solid #000; }
  .w-box { flex: 1; text-align: center; border: 1px solid #000; padding: 2px 3px; }
  .w-lbl { font-size: 5.5pt; text-transform: uppercase; font-weight: 700; }
  .w-val { font-size: 7.5pt; font-weight: 900; }

  /* From/To style dates section */
  .two-col { display: flex; border-bottom: 1px solid #000; }
  .col { flex: 1; padding: 3px 6px; }
  .col:first-child { border-right: 1px solid #000; }
  .col-title { font-size: 6pt; font-weight: 900; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 2px; }
  .col-row { font-size: 6.5pt; line-height: 1.4; }
  .col-lbl { color: #555; }
  .col-val { font-weight: 700; margin-left: 2px; font-size: 8pt; }
  .col-warn { display: inline-block; margin-top: 2px; font-size: 5.5pt; font-weight: 900; text-transform: uppercase; border: 1px solid #000; padding: 1px 4px; border-radius: 3px; }

  /* Additional information */
  .lbl-extra { flex: 1; padding: 3px 8px; display: flex; flex-direction: column; gap: 2px; }
  .section-title { font-size: 6pt; font-weight: 900; text-transform: uppercase; letter-spacing: 0.5px; border-bottom: 1px solid #000; padding-bottom: 1px; margin-bottom: 1px; }
  .section-txt   { font-size: 6.5pt; line-height: 1.2; }
  .alerg-txt     { font-size: 6.5pt; font-weight: 700; line-height: 1.15; }

  /* Footer: batch code + barcode */
  .lbl-barcode { padding: 3px 8px 5px; text-align: center; border-top: 1.5px solid #000; }
  .footer-title { font-size: 6.5pt; font-weight: 900; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 1px; }
  .lbl-barcode svg { max-width: 100%; }
  .bc-num { font-size: 6.5pt; margin-top: 1px; font-family: monospace; letter-spacing: 0.5px; }
`:`
  @page { size: 4in 6in; margin: 0; }
  * { box-sizing: border-box; margin: 0; padding: 0; font-family: Arial, Helvetica, sans-serif; }
  body { width: 4in; min-height: 6in; background: #fff; color: #000; }

  .lbl { display: flex; flex-direction: column; min-height: 6in; border: 1.5px solid #000; }

  /* Header: empresa – solo borde inferior, sin fondo */
  .lbl-header { padding: 7px 12px 5px; text-align: center; border-bottom: 2px solid #000; }
  .emp-name { font-size: 13pt; font-weight: 900; letter-spacing: 0.5px; text-transform: uppercase; }
  .emp-sub  { font-size: 8.5pt; color: #333; margin-top: 1px; }

  /* Producto – centrado, sin fondo */
  .lbl-product { padding: 7px 12px 6px; text-align: center; border-bottom: 1.5px solid #000; }
  .prod-name { font-size: 16pt; font-weight: 900; text-transform: uppercase; line-height: 1.1; }
  .lot-tag   { font-size: 9pt; font-family: monospace; letter-spacing: 1.5px; margin-top: 3px; color: #333; }

  /* Cuerpo */
  .lbl-body { flex: 1; padding: 7px 12px; display: flex; flex-direction: column; gap: 6px; }

  /* Fechas */
  .dates-row { display: flex; gap: 8px; }
  .date-box  { flex: 1; border: 1px solid #000; padding: 4px 7px; }
  .date-lbl  { font-size: 8pt; font-weight: 900; text-transform: uppercase; letter-spacing: 0.5px; }
  .date-val  { font-size: 14.5pt; font-weight: 900; }

  /* Pesos */
  .weight-row { display: flex; gap: 6px; }
  .w-box { flex: 1; text-align: center; border: 1px solid #000; padding: 3px 5px; }
  .w-lbl { font-size: 8pt; text-transform: uppercase; font-weight: 700; }
  .w-val { font-size: 11pt; font-weight: 900; }

  /* Secciones */
  .section-title { font-size: 8pt; font-weight: 900; text-transform: uppercase; letter-spacing: 0.8px; border-bottom: 1px solid #000; padding-bottom: 1px; margin-bottom: 2px; }
  .section-txt   { font-size: 9pt; line-height: 1.35; }
  .alerg-txt     { font-size: 9pt; font-weight: 700; line-height: 1.3; }

  /* Barcode */
  .lbl-barcode { padding: 6px 12px 8px; text-align: center; border-top: 1.5px solid #000; }
  .lbl-barcode svg { max-width: 100%; }
  .bc-num { font-size: 8.5pt; margin-top: 1px; font-family: monospace; letter-spacing: 1px; }
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
      ${Q(e.fecha_vence)?`<div class="col-warn">Expiring Soon</div>`:``}
    </div>
  </div>

  ${e.ingredientes||e.alergenos?`
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
</body></html>`,l=window.open(``,`_blank`);l.document.write(c),l.document.close()}return c(Pe),(a,o)=>(h(),ee(n,null,{default:_(()=>[f(`div`,ie,[p(re,{title:`Lotes de Fabricación`,description:`Lotes de fabricación por etiqueta de producto`,crumbs:[`Almacén`,`Procesos`,`Lotes de Fabricación`]},{actions:_(()=>[p(T,{color:`success`,variant:`flat`,"prepend-icon":`mdi-plus`,onClick:o[0]||=e=>$()},{default:_(()=>[...o[11]||=[u(` Nuevo Lote `,-1)]]),_:1})]),_:1}),f(`div`,ae,[f(`div`,oe,[p(g,{size:`17`,color:`rgba(var(--v-theme-on-surface),.4)`},{default:_(()=>[...o[12]||=[u(`mdi-magnify`,-1)]]),_:1}),x(f(`input`,{"onUpdate:modelValue":o[1]||=e=>F.value=e,type:`text`,placeholder:`Buscar por código, etiqueta o responsable...`,class:`search-input`},null,512),[[m,F.value]])]),f(`span`,se,C(X.value.length)+` lotes`,1)]),f(`div`,ce,[L.value?(h(),s(`div`,le,[p(te,{indeterminate:``,color:`success`,size:`36`})])):(h(),s(`table`,ue,[o[15]||=f(`thead`,null,[f(`tr`,null,[f(`th`,null,`CÓDIGO LOTE`),f(`th`,null,`PRODUCTO`),f(`th`,{class:`col-center`},`FECHA FABRICACIÓN`),f(`th`,{class:`col-center`},`FECHA VENCIMIENTO`),f(`th`,null,`RESPONSABLE`),f(`th`,{class:`col-acc`},`ACCIONES`)])],-1),f(`tbody`,null,[X.value.length===0?(h(),s(`tr`,de,[f(`td`,fe,[p(g,{size:`40`,color:`rgba(var(--v-theme-on-surface),.15)`},{default:_(()=>[...o[13]||=[u(`mdi-factory`,-1)]]),_:1}),o[14]||=f(`p`,null,`No hay lotes registrados`,-1)])])):i(``,!0),(h(!0),s(y,null,r(X.value,e=>(h(),s(`tr`,{key:e.codigo,class:`data-row`},[f(`td`,null,[f(`span`,pe,C(e.codigo),1)]),f(`td`,me,C(e.etiqueta_nombre||`—`),1),f(`td`,he,C(Z(e.fecha_fab)),1),f(`td`,ge,[f(`span`,{class:w(Q(e.fecha_vence)?`chip-warn`:``)},C(Z(e.fecha_vence)),3)]),f(`td`,null,C(e.responsable||`—`),1),f(`td`,_e,[p(T,{icon:`mdi-printer-outline`,size:`x-small`,variant:`text`,color:`success`,onClick:t=>ze(e)},null,8,[`onClick`]),p(T,{icon:`mdi-pencil-outline`,size:`x-small`,variant:`text`,color:`primary`,onClick:t=>$(e)},null,8,[`onClick`]),p(T,{icon:`mdi-delete-outline`,size:`x-small`,variant:`text`,color:`error`,loading:z.value===e.codigo,onClick:t=>Re(e)},null,8,[`loading`,`onClick`])])]))),128))])]))]),p(b,{modelValue:B.value,"onUpdate:modelValue":o[10]||=e=>B.value=e,"max-width":`560`},{default:_(()=>[p(e,{class:`modal-card`},{default:_(()=>[f(`div`,ve,[p(g,{color:`success`,class:`mr-2`},{default:_(()=>[...o[16]||=[u(`mdi-factory`,-1)]]),_:1}),f(`span`,null,C(V.value?`Editar Lote`:`Nuevo Lote de Fabricación`),1),p(t),p(T,{icon:`mdi-close`,size:`small`,variant:`text`,onClick:o[2]||=e=>B.value=!1})]),f(`div`,ye,[f(`div`,be,[o[17]||=f(`label`,{class:`field-label`},`Código de Lote`,-1),f(`div`,xe,[x(f(`input`,{"onUpdate:modelValue":o[3]||=e=>G.value.codigo=e,disabled:V.value,type:`text`,maxlength:`20`,class:w([`field-input cod-input`,{"field-error":U.value.codigo}])},null,10,Se),[[m,G.value.codigo]]),f(`span`,Ce,`Formato: MMDDAAXXX (ej. `+C(q.value)+`)`,1)]),U.value.codigo?(h(),s(`span`,we,C(U.value.codigo),1)):i(``,!0)]),f(`div`,E,[o[19]||=f(`label`,{class:`field-label`},`Producto *`,-1),x(f(`select`,{"onUpdate:modelValue":o[4]||=e=>G.value.etiqueta=e,class:w([`field-input field-select`,{"field-error":U.value.etiqueta}])},[o[18]||=f(`option`,{value:``},`— Seleccionar —`,-1),(h(!0),s(y,null,r(N.value,e=>(h(),s(`option`,{key:e.codigo,value:e.codigo},C(e.codigo)+` — `+C(e.producto),9,D))),128))],2),[[S,G.value.etiqueta]]),U.value.etiqueta?(h(),s(`span`,O,C(U.value.etiqueta),1)):i(``,!0)]),f(`div`,k,[f(`div`,Te,[o[20]||=f(`label`,{class:`field-label`},`Fecha de Fabricación *`,-1),x(f(`input`,{"onUpdate:modelValue":o[5]||=e=>G.value.fecha_fab=e,type:`date`,class:w([`field-input`,{"field-error":U.value.fecha_fab}])},null,2),[[m,G.value.fecha_fab]]),U.value.fecha_fab?(h(),s(`span`,Ee,C(U.value.fecha_fab),1)):i(``,!0)]),f(`div`,De,[o[21]||=f(`label`,{class:`field-label`},`Fecha de Vencimiento`,-1),x(f(`input`,{"onUpdate:modelValue":o[6]||=e=>G.value.fecha_vence=e,type:`date`,class:`field-input`},null,512),[[m,G.value.fecha_vence]]),J.value?(h(),s(`span`,Oe,` Sugerido: `+C(Z(Y.value))+` (`+C(J.value)+` días) `,1)):i(``,!0)])]),f(`div`,ke,[o[23]||=f(`label`,{class:`field-label`},`Responsable`,-1),x(f(`select`,{"onUpdate:modelValue":o[7]||=e=>G.value.responsable=e,class:`field-input field-select`},[o[22]||=f(`option`,{value:``},`— Seleccionar —`,-1),(h(!0),s(y,null,r(P.value,e=>(h(),s(`option`,{key:e.id,value:`${e.nombre} ${e.apellido}`},C(e.nombre)+` `+C(e.apellido),9,Ae))),128))],512),[[S,G.value.responsable]])]),f(`div`,je,[o[24]||=f(`label`,{class:`field-label`},`Observaciones`,-1),x(f(`textarea`,{"onUpdate:modelValue":o[8]||=e=>G.value.observaciones=e,rows:`2`,class:`field-input field-textarea`},null,512),[[m,G.value.observaciones]])]),H.value?(h(),s(`div`,Me,C(H.value),1)):i(``,!0)]),f(`div`,Ne,[p(T,{variant:`text`,onClick:o[9]||=e=>B.value=!1},{default:_(()=>[...o[25]||=[u(`Cancelar`,-1)]]),_:1}),p(T,{color:`success`,variant:`flat`,loading:R.value,onClick:Le},{default:_(()=>[u(C(V.value?`Guardar Cambios`:`Crear Lote`),1)]),_:1},8,[`loading`])])]),_:1})]),_:1},8,[`modelValue`])])]),_:1}))}},[[`__scopeId`,`data-v-41c65268`]]);export{A as default};