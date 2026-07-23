import{t as e,v as t}from"./VBtn.js";import{c as n,o as r,t as i,x as a}from"./MainLayout.js";import{An as o,Dn as s,Gt as c,Kn as l,Kt as u,Ln as d,Xt as f,Yn as p,an as m,c as h,en as g,gn as ee,i as te,in as _,kn as v,nn as ne,on as y,rn as b,s as re,tn as x,xn as S,yn as C}from"./index.js";import{t as w}from"./VIcon.js";var ie={class:`pg-container`},ae={class:`breadcrumb`},oe={class:`page-header`},se={class:`header-left`},ce={class:`header-icon`},le={class:`toolbar`},ue={class:`search-wrap`},de={class:`count-badge`},fe={class:`tabla-card`},pe={key:0,class:`loading-wrap`},me={key:1,class:`crud-table`},he={key:0},ge={colspan:`6`,class:`empty-row`},_e={class:`cod-badge`},ve={class:`fw500`},ye={class:`col-center`},be={class:`col-center`},xe={class:`col-acc`},Se={class:`modal-header`},Ce={class:`modal-body`},we={class:`field-group`},T={class:`cod-wrap`},E=[`disabled`],D={class:`cod-hint`},O={key:0,class:`error-txt`},k={class:`field-group`},Te=[`value`],Ee={key:0,class:`error-txt`},De={class:`form-row-2`},Oe={class:`field-group`},ke={key:0,class:`error-txt`},Ae={class:`field-group`},je={key:0,class:`hint-txt`},Me={class:`field-group`},Ne=[`value`],Pe={class:`field-group`},Fe={key:0,class:`api-error`},A={class:`modal-footer`},j=te({__name:`LotesFabricacionView`,setup(te){let j=re(),M=g(()=>j.empresaCodigo),N=d([]),P=d([]),F=d([]),I=d(``),L=d(`6x4`),R=d(!1),z=d(!1),B=d(null),V=d(!1),H=d(!1),U=d(``),W=d({}),G=()=>({codigo:``,etiqueta:``,fecha_fab:new Date().toISOString().split(`T`)[0],fecha_vence:``,responsable:``,observaciones:``}),K=d(G()),q=new Date,J=g(()=>`${String(q.getMonth()+1).padStart(2,`0`)}${String(q.getDate()).padStart(2,`0`)}${String(q.getFullYear()).slice(-2)}001`),Y=g(()=>!K.value.etiqueta||!K.value.fecha_fab?null:P.value.find(e=>e.codigo===K.value.etiqueta)?.dias_vencimiento||null),X=g(()=>{if(!Y.value||!K.value.fecha_fab)return``;let e=new Date(K.value.fecha_fab+`T12:00:00`);return e.setDate(e.getDate()+Y.value),e.toISOString().split(`T`)[0]});s([()=>K.value.etiqueta,()=>K.value.fecha_fab],()=>{X.value&&(K.value.fecha_vence=X.value)});let Z=g(()=>{let e=I.value.toLowerCase();return N.value.filter(t=>t.codigo.toLowerCase().includes(e)||(t.etiqueta_nombre||``).toLowerCase().includes(e)||(t.etiqueta||``).toLowerCase().includes(e)||(t.responsable||``).toLowerCase().includes(e))});function Q(e){return e?new Date(String(e).substring(0,10)+`T12:00:00`).toLocaleDateString(`es`,{day:`2-digit`,month:`short`,year:`numeric`}):`—`}function Ie(e){if(!e)return!1;let t=(new Date(String(e).substring(0,10)+`T12:00:00`)-new Date)/(1e3*60*60*24);return t>=0&&t<=7}async function Le(){R.value=!0;try{let[e,t,n,r]=await Promise.all([fetch(`${h}/almacen/lotes-fabricacion?empresa=${M.value}`).then(e=>e.json()),fetch(`${h}/almacen/etiquetas-producto?empresa=${M.value}`).then(e=>e.json()),fetch(`${h}/nomina/empleados-basico?empresa=${M.value}`).then(e=>e.json()),fetch(`${h}/empresas/formato-etiqueta-produccion?empresa=${M.value}`).then(e=>e.json())]);N.value=e.data||[],P.value=t.data||[],F.value=n.data||[],L.value=r.data?.formato_etiqueta_produccion||`6x4`}catch(e){console.error(e)}finally{R.value=!1}}async function Re(){try{return(await(await fetch(`https://inventario-app-production-e8c8.up.railway.app/api/almacen/lotes-fabricacion/proximo-codigo`)).json()).codigo||J.value}catch{return J.value}}async function $(e=null){if(W.value={},U.value=``,H.value=!!e,e)K.value={codigo:e.codigo,etiqueta:e.etiqueta,fecha_fab:String(e.fecha_fab).substring(0,10),fecha_vence:e.fecha_vence?String(e.fecha_vence).substring(0,10):``,responsable:e.responsable||``,observaciones:e.observaciones||``};else{let e=await Re();K.value={...G(),codigo:e}}V.value=!0}function ze(){let e={};return K.value.codigo.trim()||(e.codigo=`Requerido`),K.value.etiqueta||(e.etiqueta=`Requerido`),K.value.fecha_fab||(e.fecha_fab=`Requerido`),W.value=e,Object.keys(e).length===0}async function Be(){if(ze()){z.value=!0,U.value=``;try{let e=H.value?`${h}/almacen/lotes-fabricacion/${K.value.codigo}`:`${h}/almacen/lotes-fabricacion`,t=await(await fetch(e,{method:H.value?`PUT`:`POST`,headers:{"Content-Type":`application/json`},body:JSON.stringify(K.value)})).json();if(!t.success)throw Error(t.error);if(H.value){let e=N.value.findIndex(e=>e.codigo===K.value.codigo);e>=0&&(N.value[e]=t.data)}else N.value.unshift(t.data);V.value=!1}catch(e){U.value=e.message}finally{z.value=!1}}}async function Ve(e){B.value=e.codigo;try{let t=await(await fetch(`${h}/almacen/lotes-fabricacion/${e.codigo}`,{method:`DELETE`})).json();if(!t.success)throw Error(t.error);N.value=N.value.filter(t=>t.codigo!==e.codigo)}catch(e){alert(e.message)}finally{B.value=null}}function He(e){let t=j.empresaNombre||``,n=e=>e?new Date(String(e).substring(0,10)+`T12:00:00`).toLocaleDateString(`es`,{day:`2-digit`,month:`2-digit`,year:`numeric`}):`—`,r=e.barcode||e.codigo,i=L.value===`3x4`,a=i?32:45,o=i?1.3:1.8,s=i?`
  @page { size: 3in 4in; margin: 0; }
  * { box-sizing: border-box; margin: 0; padding: 0; font-family: Arial, Helvetica, sans-serif; }
  body { width: 3in; min-height: 4in; background: #fff; color: #000; }

  .lbl { display: flex; flex-direction: column; min-height: 4in; border: 1px solid #000; }

  .lbl-header { padding: 4px 8px 3px; text-align: center; border-bottom: 1.5px solid #000; }
  .emp-name { font-size: 9pt; font-weight: 900; letter-spacing: 0.3px; text-transform: uppercase; }
  .emp-sub  { font-size: 5pt; color: #333; margin-top: 1px; }

  .lbl-product { padding: 4px 8px 4px; text-align: center; border-bottom: 1px solid #000; }
  .prod-name { font-size: 11pt; font-weight: 900; text-transform: uppercase; line-height: 1.05; }
  .lot-tag   { font-size: 5.5pt; font-family: monospace; letter-spacing: 1px; margin-top: 2px; color: #333; }

  .lbl-body { flex: 1; padding: 4px 8px; display: flex; flex-direction: column; gap: 4px; }

  .dates-row { display: flex; gap: 5px; }
  .date-box  { flex: 1; border: 1px solid #000; padding: 2px 4px; }
  .date-lbl  { font-size: 4.5pt; font-weight: 900; text-transform: uppercase; letter-spacing: 0.3px; }
  .date-val  { font-size: 7.5pt; font-weight: 900; }

  .weight-row { display: flex; gap: 4px; }
  .w-box { flex: 1; text-align: center; border: 1px solid #000; padding: 2px 3px; }
  .w-lbl { font-size: 4.5pt; text-transform: uppercase; font-weight: 700; }
  .w-val { font-size: 6.5pt; font-weight: 900; }

  .section-title { font-size: 5pt; font-weight: 900; text-transform: uppercase; letter-spacing: 0.5px; border-bottom: 1px solid #000; padding-bottom: 1px; margin-bottom: 1px; }
  .section-txt   { font-size: 5.5pt; line-height: 1.25; }
  .alerg-txt     { font-size: 5.5pt; font-weight: 700; line-height: 1.2; }
  .instr-txt     { font-size: 5pt; font-style: italic; line-height: 1.2; }

  .lbl-barcode { padding: 3px 8px 5px; text-align: center; border-top: 1px solid #000; }
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
</div>
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
</body></html>`,l=window.open(``,`_blank`);l.document.write(c),l.document.close()}return ee(Le),(s,d)=>(C(),ne(i,null,{default:v(()=>[x(`div`,ie,[x(`div`,ae,[d[13]||=x(`span`,{class:`bc-root`},`ALMACÉN`,-1),y(w,{size:`12`,class:`bc-sep`},{default:v(()=>[...d[11]||=[m(`mdi-chevron-right`,-1)]]),_:1}),d[14]||=x(`span`,{class:`bc-cat`},`Procesos`,-1),y(w,{size:`12`,class:`bc-sep`},{default:v(()=>[...d[12]||=[m(`mdi-chevron-right`,-1)]]),_:1}),d[15]||=x(`span`,{class:`bc-current`},`Órdenes de Producción`,-1)]),x(`div`,oe,[x(`div`,se,[x(`div`,ce,[y(w,{size:`24`,color:`white`},{default:v(()=>[...d[16]||=[m(`mdi-factory`,-1)]]),_:1})]),d[17]||=x(`div`,null,[x(`h1`,{class:`page-title`},`ÓRDENES DE PRODUCCIÓN`),x(`p`,{class:`page-sub`},`Lotes de fabricación por etiqueta de producto`)],-1)]),y(e,{color:`#047857`,variant:`flat`,"prepend-icon":`mdi-plus`,onClick:d[0]||=e=>$()},{default:v(()=>[...d[18]||=[m(` Nuevo Lote `,-1)]]),_:1})]),x(`div`,le,[x(`div`,ue,[y(w,{size:`17`,color:`rgba(var(--v-theme-on-surface),.4)`},{default:v(()=>[...d[19]||=[m(`mdi-magnify`,-1)]]),_:1}),o(x(`input`,{"onUpdate:modelValue":d[1]||=e=>I.value=e,type:`text`,placeholder:`Buscar por código, etiqueta o responsable...`,class:`search-input`},null,512),[[u,I.value]])]),x(`span`,de,p(Z.value.length)+` lotes`,1)]),x(`div`,fe,[R.value?(C(),_(`div`,pe,[y(t,{indeterminate:``,color:`#10b981`,size:`36`})])):(C(),_(`table`,me,[d[22]||=x(`thead`,null,[x(`tr`,null,[x(`th`,null,`CÓDIGO LOTE`),x(`th`,null,`PRODUCTO`),x(`th`,{class:`col-center`},`FECHA FABRICACIÓN`),x(`th`,{class:`col-center`},`FECHA VENCIMIENTO`),x(`th`,null,`RESPONSABLE`),x(`th`,{class:`col-acc`},`ACCIONES`)])],-1),x(`tbody`,null,[Z.value.length===0?(C(),_(`tr`,he,[x(`td`,ge,[y(w,{size:`40`,color:`rgba(var(--v-theme-on-surface),.15)`},{default:v(()=>[...d[20]||=[m(`mdi-factory`,-1)]]),_:1}),d[21]||=x(`p`,null,`No hay lotes registrados`,-1)])])):b(``,!0),(C(!0),_(f,null,S(Z.value,t=>(C(),_(`tr`,{key:t.codigo,class:`data-row`},[x(`td`,null,[x(`span`,_e,p(t.codigo),1)]),x(`td`,ve,p(t.etiqueta_nombre||`—`),1),x(`td`,ye,p(Q(t.fecha_fab)),1),x(`td`,be,[x(`span`,{class:l(Ie(t.fecha_vence)?`chip-warn`:``)},p(Q(t.fecha_vence)),3)]),x(`td`,null,p(t.responsable||`—`),1),x(`td`,xe,[y(e,{icon:`mdi-printer-outline`,size:`x-small`,variant:`text`,color:`#047857`,onClick:e=>He(t)},null,8,[`onClick`]),y(e,{icon:`mdi-pencil-outline`,size:`x-small`,variant:`text`,color:`primary`,onClick:e=>$(t)},null,8,[`onClick`]),y(e,{icon:`mdi-delete-outline`,size:`x-small`,variant:`text`,color:`error`,loading:B.value===t.codigo,onClick:e=>Ve(t)},null,8,[`loading`,`onClick`])])]))),128))])]))]),y(n,{modelValue:V.value,"onUpdate:modelValue":d[10]||=e=>V.value=e,"max-width":`560`},{default:v(()=>[y(a,{class:`modal-card`},{default:v(()=>[x(`div`,Se,[y(w,{color:`#10b981`,class:`mr-2`},{default:v(()=>[...d[23]||=[m(`mdi-factory`,-1)]]),_:1}),x(`span`,null,p(H.value?`Editar Lote`:`Nuevo Lote de Fabricación`),1),y(r),y(e,{icon:`mdi-close`,size:`small`,variant:`text`,onClick:d[2]||=e=>V.value=!1})]),x(`div`,Ce,[x(`div`,we,[d[24]||=x(`label`,{class:`field-label`},`Código de Lote`,-1),x(`div`,T,[o(x(`input`,{"onUpdate:modelValue":d[3]||=e=>K.value.codigo=e,disabled:H.value,type:`text`,maxlength:`20`,class:l([`field-input cod-input`,{"field-error":W.value.codigo}])},null,10,E),[[u,K.value.codigo]]),x(`span`,D,`Formato: MMDDAAXXX (ej. `+p(J.value)+`)`,1)]),W.value.codigo?(C(),_(`span`,O,p(W.value.codigo),1)):b(``,!0)]),x(`div`,k,[d[26]||=x(`label`,{class:`field-label`},`Producto *`,-1),o(x(`select`,{"onUpdate:modelValue":d[4]||=e=>K.value.etiqueta=e,class:l([`field-input field-select`,{"field-error":W.value.etiqueta}])},[d[25]||=x(`option`,{value:``},`— Seleccionar —`,-1),(C(!0),_(f,null,S(P.value,e=>(C(),_(`option`,{key:e.codigo,value:e.codigo},p(e.codigo)+` — `+p(e.producto),9,Te))),128))],2),[[c,K.value.etiqueta]]),W.value.etiqueta?(C(),_(`span`,Ee,p(W.value.etiqueta),1)):b(``,!0)]),x(`div`,De,[x(`div`,Oe,[d[27]||=x(`label`,{class:`field-label`},`Fecha de Fabricación *`,-1),o(x(`input`,{"onUpdate:modelValue":d[5]||=e=>K.value.fecha_fab=e,type:`date`,class:l([`field-input`,{"field-error":W.value.fecha_fab}])},null,2),[[u,K.value.fecha_fab]]),W.value.fecha_fab?(C(),_(`span`,ke,p(W.value.fecha_fab),1)):b(``,!0)]),x(`div`,Ae,[d[28]||=x(`label`,{class:`field-label`},`Fecha de Vencimiento`,-1),o(x(`input`,{"onUpdate:modelValue":d[6]||=e=>K.value.fecha_vence=e,type:`date`,class:`field-input`},null,512),[[u,K.value.fecha_vence]]),Y.value?(C(),_(`span`,je,` Sugerido: `+p(X.value)+` (`+p(Y.value)+` días) `,1)):b(``,!0)])]),x(`div`,Me,[d[30]||=x(`label`,{class:`field-label`},`Responsable`,-1),o(x(`select`,{"onUpdate:modelValue":d[7]||=e=>K.value.responsable=e,class:`field-input field-select`},[d[29]||=x(`option`,{value:``},`— Seleccionar —`,-1),(C(!0),_(f,null,S(F.value,e=>(C(),_(`option`,{key:e.id,value:`${e.nombre} ${e.apellido}`},p(e.nombre)+` `+p(e.apellido),9,Ne))),128))],512),[[c,K.value.responsable]])]),x(`div`,Pe,[d[31]||=x(`label`,{class:`field-label`},`Observaciones`,-1),o(x(`textarea`,{"onUpdate:modelValue":d[8]||=e=>K.value.observaciones=e,rows:`2`,class:`field-input field-textarea`},null,512),[[u,K.value.observaciones]])]),U.value?(C(),_(`div`,Fe,p(U.value),1)):b(``,!0)]),x(`div`,A,[y(e,{variant:`text`,onClick:d[9]||=e=>V.value=!1},{default:v(()=>[...d[32]||=[m(`Cancelar`,-1)]]),_:1}),y(e,{color:`#047857`,variant:`flat`,loading:z.value,onClick:Be},{default:v(()=>[m(p(H.value?`Guardar Cambios`:`Crear Lote`),1)]),_:1},8,[`loading`])])]),_:1})]),_:1},8,[`modelValue`])])]),_:1}))}},[[`__scopeId`,`data-v-3ffb6f0c`]]);export{j as default};