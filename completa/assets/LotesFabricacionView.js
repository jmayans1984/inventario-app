import{Dr as e,Fr as t,Ft as n,It as r,Lr as i,Mt as a,Nr as o,Q as s,Rr as c,S as l,Ur as u,Z as ee,Zr as d,_r as f,ar as p,ei as m,fr as h,gr as g,hr as _,jr as v,kr as y,mr as te,nt as ne,or as b,pr as x,ur as S,vr as C,x as re}from"./index.js";import{o as ie,t as ae}from"./MainLayout.js";import{t as oe}from"./PageHeader.js";var se={class:`pg-container`},ce={class:`toolbar`},le={class:`search-wrap`},ue={class:`count-badge`},de={class:`tabla-card`},fe={key:0,class:`loading-wrap`},pe={key:1,class:`crud-table`},me={key:0},he={colspan:`6`,class:`empty-row`},ge={class:`cod-badge`},_e={class:`fw500`},ve={class:`col-center`},ye={class:`col-center`},be={class:`col-acc`},xe={class:`modal-header`},Se={class:`modal-body`},Ce={class:`field-group`},we={class:`cod-wrap`},Te=[`disabled`],w={class:`cod-hint`},T={key:0,class:`error-txt`},E={class:`field-group`},D=[`value`],O={key:0,class:`error-txt`},Ee={class:`form-row-2`},De={class:`field-group`},Oe={key:0,class:`error-txt`},ke={class:`field-group`},Ae={key:0,class:`hint-txt`},je={class:`field-group`},Me=[`value`],Ne={class:`field-group`},k={key:0,class:`api-error`},Pe={class:`modal-footer`},A=a({__name:`LotesFabricacionView`,setup(a){let A=n(),j=h(()=>A.empresaCodigo),M=u([]),N=u([]),P=u([]),F=u(``),I=u(`6x4`),L=u(!1),R=u(!1),z=u(null),B=u(!1),V=u(!1),H=u(``),U=u({}),W=()=>({codigo:``,etiqueta:``,fecha_fab:new Date().toISOString().split(`T`)[0],fecha_vence:``,responsable:``,observaciones:``}),G=u(W()),K=new Date,q=h(()=>`${String(K.getMonth()+1).padStart(2,`0`)}${String(K.getDate()).padStart(2,`0`)}${String(K.getFullYear()).slice(-2)}001`),J=h(()=>!G.value.etiqueta||!G.value.fecha_fab?null:N.value.find(e=>e.codigo===G.value.etiqueta)?.dias_vencimiento||null),Y=h(()=>{if(!J.value||!G.value.fecha_fab)return``;let e=new Date(G.value.fecha_fab+`T12:00:00`);return e.setDate(e.getDate()+J.value),e.toISOString().split(`T`)[0]});t([()=>G.value.etiqueta,()=>G.value.fecha_fab],()=>{Y.value&&(G.value.fecha_vence=Y.value)});let X=h(()=>{let e=F.value.toLowerCase();return M.value.filter(t=>t.codigo.toLowerCase().includes(e)||(t.etiqueta_nombre||``).toLowerCase().includes(e)||(t.etiqueta||``).toLowerCase().includes(e)||(t.responsable||``).toLowerCase().includes(e))});function Z(e){if(!e)return`—`;let t=new Date(String(e).substring(0,10)+`T12:00:00`);return`${String(t.getMonth()+1).padStart(2,`0`)}/${String(t.getDate()).padStart(2,`0`)}/${t.getFullYear()}`}function Q(e){if(!e)return!1;let t=(new Date(String(e).substring(0,10)+`T12:00:00`)-new Date)/(1e3*60*60*24);return t>=0&&t<=7}async function Fe(){L.value=!0;try{let[e,t,n,i]=await Promise.all([fetch(`${r}/almacen/lotes-fabricacion?empresa=${j.value}`).then(e=>e.json()),fetch(`${r}/almacen/etiquetas-producto?empresa=${j.value}`).then(e=>e.json()),fetch(`${r}/nomina/empleados-basico?empresa=${j.value}`).then(e=>e.json()),fetch(`${r}/empresas/formato-etiqueta-produccion?empresa=${j.value}`).then(e=>e.json())]);M.value=e.data||[],N.value=t.data||[],P.value=n.data||[],I.value=i.data?.formato_etiqueta_produccion||`6x4`}catch(e){console.error(e)}finally{L.value=!1}}async function Ie(){try{return(await(await fetch(`https://inventario-app-production-e8c8.up.railway.app/api/almacen/lotes-fabricacion/proximo-codigo`)).json()).codigo||q.value}catch{return q.value}}async function $(e=null){if(U.value={},H.value=``,V.value=!!e,e)G.value={codigo:e.codigo,etiqueta:e.etiqueta,fecha_fab:String(e.fecha_fab).substring(0,10),fecha_vence:e.fecha_vence?String(e.fecha_vence).substring(0,10):``,responsable:e.responsable||``,observaciones:e.observaciones||``};else{let e=await Ie();G.value={...W(),codigo:e}}B.value=!0}function Le(){let e={};return G.value.codigo.trim()||(e.codigo=`Requerido`),G.value.etiqueta||(e.etiqueta=`Requerido`),G.value.fecha_fab||(e.fecha_fab=`Requerido`),U.value=e,Object.keys(e).length===0}async function Re(){if(Le()){R.value=!0,H.value=``;try{let e=V.value?`${r}/almacen/lotes-fabricacion/${G.value.codigo}`:`${r}/almacen/lotes-fabricacion`,t=await(await fetch(e,{method:V.value?`PUT`:`POST`,headers:{"Content-Type":`application/json`},body:JSON.stringify(G.value)})).json();if(!t.success)throw Error(t.error);if(V.value){let e=M.value.findIndex(e=>e.codigo===G.value.codigo);e>=0&&(M.value[e]=t.data)}else M.value.unshift(t.data);B.value=!1}catch(e){H.value=e.message}finally{R.value=!1}}}async function ze(e){z.value=e.codigo;try{let t=await(await fetch(`${r}/almacen/lotes-fabricacion/${e.codigo}`,{method:`DELETE`})).json();if(!t.success)throw Error(t.error);M.value=M.value.filter(t=>t.codigo!==e.codigo)}catch(e){alert(e.message)}finally{z.value=null}}function Be(e){let t=A.empresaNombre||``,n=e=>{if(!e)return`—`;let t=new Date(String(e).substring(0,10)+`T12:00:00`);return`${String(t.getMonth()+1).padStart(2,`0`)}/${String(t.getDate()).padStart(2,`0`)}/${t.getFullYear()}`},r=e.barcode||e.codigo,i=I.value===`3x4`,a=i?32:45,o=i?1.3:1.8,s=i?`
  @page { size: 4in 3in; margin: 0; }
  * { box-sizing: border-box; margin: 0; padding: 0; font-family: Arial, Helvetica, sans-serif; }
  body { width: 4in; min-height: 3in; background: #fff; color: #000; }

  .lbl { display: flex; flex-direction: column; min-height: 3in; border: 1.5px solid #000; }

  /* Top strip: icon box + badge type "FRAGILE" */
  .lbl-top { display: flex; align-items: stretch; border-bottom: 1.5px solid #000; }
  .top-icon-box { width: 22%; border-right: 1.5px solid #000; padding: 3px 4px; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 1px; }
  .top-icon { width: 18px; height: 18px; border: 1.5px solid #000; border-radius: 3px; display: flex; align-items: center; justify-content: center; font-size: 9pt; font-weight: 900; }
  .top-icon-cap { font-size: 5.5pt; text-align: center; line-height: 1.2; color: #333; text-transform: uppercase; }
  .top-badge { flex: 1; padding: 3px 6px; display: flex; flex-direction: column; align-items: flex-end; justify-content: center; text-align: right; }
  .badge-title { font-size: 7.5pt; font-weight: 900; text-transform: uppercase; line-height: 1.05; }
  .badge-sub   { font-size: 6pt; font-weight: 700; text-transform: uppercase; color: #333; margin-top: 1px; }

  /* Product title bar – centered, no lot reference (shown in footer) */
  .lbl-header-bar { padding: 3px 8px; border-bottom: 1.5px solid #000; text-align: center; }
  .prod-name { font-size: 12pt; font-weight: 900; text-transform: uppercase; line-height: 1.05; }

  /* Net weight / servings boxes */
  .weight-row { display: flex; gap: 4px; padding: 1px 8px; border-bottom: 1px solid #000; }
  .w-box { flex: 1; text-align: center; border: 1px solid #000; padding: 1px 3px; }
  .w-lbl { font-size: 5.5pt; text-transform: uppercase; font-weight: 700; }
  .w-val { font-size: 7.5pt; font-weight: 900; }

  /* From/To style dates section */
  .two-col { display: flex; border-bottom: 1px solid #000; }
  .col { flex: 1; padding: 1px 6px; }
  .col:first-child { border-right: 1px solid #000; }
  .col-title { font-size: 6pt; font-weight: 900; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 1px; }
  .col-row { font-size: 6.5pt; line-height: 1.25; }
  .col-lbl { color: #555; }
  .col-val { font-weight: 700; margin-left: 2px; font-size: 8pt; }
  .col-warn { display: inline-block; margin-top: 2px; font-size: 5.5pt; font-weight: 900; text-transform: uppercase; border: 1px solid #000; padding: 1px 4px; border-radius: 3px; }

  /* Additional information */
  .lbl-extra { flex: 1; padding: 2px 8px; display: flex; flex-direction: column; gap: 1px; }
  .section-title { font-size: 6pt; font-weight: 900; text-transform: uppercase; letter-spacing: 0.5px; border-bottom: 1px solid #000; padding-bottom: 0px; margin-bottom: 0px; }
  .section-txt   { font-size: 6.5pt; line-height: 1.2; }
  .alerg-txt     { font-size: 6.5pt; font-weight: 700; line-height: 1.2; }

  /* Footer: batch code + barcode */
  .lbl-barcode { padding: 1px 8px 2px; text-align: center; border-top: 1.5px solid #000; }
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
      <div class="badge-sub">${e.codigo}</div>
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
</body></html>`,l=window.open(``,`_blank`);l.document.write(c),l.document.close()}return e(Fe),(e,t)=>{let n=o(`CampoFecha`);return y(),te(ae,null,{default:i(()=>[x(`div`,se,[C(oe,{title:`Lotes de Fabricación`,description:`Lotes de fabricación por etiqueta de producto`,crumbs:[`Almacén`,`Procesos`,`Lotes de Fabricación`]},{actions:i(()=>[C(l,{color:`success`,variant:`flat`,"prepend-icon":`mdi-plus`,onClick:t[0]||=e=>$()},{default:i(()=>[...t[11]||=[f(` Nuevo Lote `,-1)]]),_:1})]),_:1}),x(`div`,ce,[x(`div`,le,[C(s,{size:`17`,color:`rgba(var(--v-theme-on-surface),.4)`},{default:i(()=>[...t[12]||=[f(`mdi-magnify`,-1)]]),_:1}),c(x(`input`,{"onUpdate:modelValue":t[1]||=e=>F.value=e,type:`text`,placeholder:`Buscar por código, etiqueta o responsable...`,class:`search-input`},null,512),[[b,F.value]])]),x(`span`,ue,m(X.value.length)+` lotes`,1)]),x(`div`,de,[L.value?(y(),g(`div`,fe,[C(ee,{indeterminate:``,color:`success`,size:`36`})])):(y(),g(`table`,pe,[t[15]||=x(`thead`,null,[x(`tr`,null,[x(`th`,null,`CÓDIGO LOTE`),x(`th`,null,`PRODUCTO`),x(`th`,{class:`col-center`},`FECHA FABRICACIÓN`),x(`th`,{class:`col-center`},`FECHA VENCIMIENTO`),x(`th`,null,`RESPONSABLE`),x(`th`,{class:`col-acc`},`ACCIONES`)])],-1),x(`tbody`,null,[X.value.length===0?(y(),g(`tr`,me,[x(`td`,he,[C(s,{size:`40`,color:`rgba(var(--v-theme-on-surface),.15)`},{default:i(()=>[...t[13]||=[f(`mdi-factory`,-1)]]),_:1}),t[14]||=x(`p`,null,`No hay lotes registrados`,-1)])])):_(``,!0),(y(!0),g(S,null,v(X.value,e=>(y(),g(`tr`,{key:e.codigo,class:`data-row`},[x(`td`,null,[x(`span`,ge,m(e.codigo),1)]),x(`td`,_e,m(e.etiqueta_nombre||`—`),1),x(`td`,ve,m(Z(e.fecha_fab)),1),x(`td`,ye,[x(`span`,{class:d(Q(e.fecha_vence)?`chip-warn`:``)},m(Z(e.fecha_vence)),3)]),x(`td`,null,m(e.responsable||`—`),1),x(`td`,be,[C(l,{icon:`mdi-printer-outline`,size:`x-small`,variant:`text`,color:`success`,onClick:t=>Be(e)},null,8,[`onClick`]),C(l,{icon:`mdi-pencil-outline`,size:`x-small`,variant:`text`,color:`primary`,onClick:t=>$(e)},null,8,[`onClick`]),C(l,{icon:`mdi-delete-outline`,size:`x-small`,variant:`text`,color:`error`,loading:z.value===e.codigo,onClick:t=>ze(e)},null,8,[`loading`,`onClick`])])]))),128))])]))]),C(ne,{modelValue:B.value,"onUpdate:modelValue":t[10]||=e=>B.value=e,"max-width":`560`},{default:i(()=>[C(ie,{class:`modal-card`},{default:i(()=>[x(`div`,xe,[C(s,{color:`success`,class:`mr-2`},{default:i(()=>[...t[16]||=[f(`mdi-factory`,-1)]]),_:1}),x(`span`,null,m(V.value?`Editar Lote`:`Nuevo Lote de Fabricación`),1),C(re),C(l,{icon:`mdi-close`,size:`small`,variant:`text`,onClick:t[2]||=e=>B.value=!1})]),x(`div`,Se,[x(`div`,Ce,[t[17]||=x(`label`,{class:`field-label`},`Código de Lote`,-1),x(`div`,we,[c(x(`input`,{"onUpdate:modelValue":t[3]||=e=>G.value.codigo=e,disabled:V.value,type:`text`,maxlength:`20`,class:d([`field-input cod-input`,{"field-error":U.value.codigo}])},null,10,Te),[[b,G.value.codigo]]),x(`span`,w,`Formato: MMDDAAXXX (ej. `+m(q.value)+`)`,1)]),U.value.codigo?(y(),g(`span`,T,m(U.value.codigo),1)):_(``,!0)]),x(`div`,E,[t[19]||=x(`label`,{class:`field-label`},`Producto *`,-1),c(x(`select`,{"onUpdate:modelValue":t[4]||=e=>G.value.etiqueta=e,class:d([`field-input field-select`,{"field-error":U.value.etiqueta}])},[t[18]||=x(`option`,{value:``},`— Seleccionar —`,-1),(y(!0),g(S,null,v(N.value,e=>(y(),g(`option`,{key:e.codigo,value:e.codigo},m(e.codigo)+` — `+m(e.producto),9,D))),128))],2),[[p,G.value.etiqueta]]),U.value.etiqueta?(y(),g(`span`,O,m(U.value.etiqueta),1)):_(``,!0)]),x(`div`,Ee,[x(`div`,De,[t[20]||=x(`label`,{class:`field-label`},`Fecha de Fabricación *`,-1),C(n,{modelValue:G.value.fecha_fab,"onUpdate:modelValue":t[5]||=e=>G.value.fecha_fab=e,class:d([`field-input`,{"field-error":U.value.fecha_fab}])},null,8,[`modelValue`,`class`]),U.value.fecha_fab?(y(),g(`span`,Oe,m(U.value.fecha_fab),1)):_(``,!0)]),x(`div`,ke,[t[21]||=x(`label`,{class:`field-label`},`Fecha de Vencimiento`,-1),C(n,{modelValue:G.value.fecha_vence,"onUpdate:modelValue":t[6]||=e=>G.value.fecha_vence=e,class:`field-input`},null,8,[`modelValue`]),J.value?(y(),g(`span`,Ae,` Sugerido: `+m(Z(Y.value))+` (`+m(J.value)+` días) `,1)):_(``,!0)])]),x(`div`,je,[t[23]||=x(`label`,{class:`field-label`},`Responsable`,-1),c(x(`select`,{"onUpdate:modelValue":t[7]||=e=>G.value.responsable=e,class:`field-input field-select`},[t[22]||=x(`option`,{value:``},`— Seleccionar —`,-1),(y(!0),g(S,null,v(P.value,e=>(y(),g(`option`,{key:e.id,value:`${e.nombre} ${e.apellido}`},m(e.nombre)+` `+m(e.apellido),9,Me))),128))],512),[[p,G.value.responsable]])]),x(`div`,Ne,[t[24]||=x(`label`,{class:`field-label`},`Observaciones`,-1),c(x(`textarea`,{"onUpdate:modelValue":t[8]||=e=>G.value.observaciones=e,rows:`2`,class:`field-input field-textarea`},null,512),[[b,G.value.observaciones]])]),H.value?(y(),g(`div`,k,m(H.value),1)):_(``,!0)]),x(`div`,Pe,[C(l,{variant:`text`,onClick:t[9]||=e=>B.value=!1},{default:i(()=>[...t[25]||=[f(`Cancelar`,-1)]]),_:1}),C(l,{color:`success`,variant:`flat`,loading:R.value,onClick:Re},{default:i(()=>[f(m(V.value?`Guardar Cambios`:`Crear Lote`),1)]),_:1},8,[`loading`])])]),_:1})]),_:1},8,[`modelValue`])])]),_:1})}}},[[`__scopeId`,`data-v-ba1df829`]]);export{A as default};