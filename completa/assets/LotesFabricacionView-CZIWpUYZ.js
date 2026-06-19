import{m as e,t}from"./VBtn-9pBMsrsZ.js";import{t as n}from"./MainLayout-_8ZCAPYN.js";import{$t as r,En as i,Gn as a,Gt as o,In as s,Jn as c,On as l,Wt as u,Yt as d,an as f,bn as p,c as m,en as h,hn as ee,i as te,in as g,kn as _,nn as v,rn as y,s as b,tn as ne,vn as x}from"./index-DOAa1Jsp.js";import{t as S}from"./VIcon-SoYOZ7UM.js";import{t as re}from"./VCard-My7L-T8b.js";import{t as ie}from"./VSpacer-DbqsVbD6.js";import{t as ae}from"./VDialog-XHC56xzX.js";var oe={class:`pg-container`},se={class:`breadcrumb`},ce={class:`page-header`},le={class:`header-left`},ue={class:`header-icon`},de={class:`toolbar`},fe={class:`search-wrap`},pe={class:`count-badge`},me={class:`tabla-card`},he={key:0,class:`loading-wrap`},ge={key:1,class:`crud-table`},_e={key:0},ve={colspan:`6`,class:`empty-row`},ye={class:`cod-badge`},be={class:`fw500`},xe={class:`col-center`},Se={class:`col-center`},C={class:`col-acc`},w={class:`modal-header`},T={class:`modal-body`},E={class:`field-group`},D={class:`cod-wrap`},O=[`disabled`],k={class:`cod-hint`},A={key:0,class:`error-txt`},j={class:`field-group`},Ce=[`value`],we={key:0,class:`error-txt`},Te={class:`form-row-2`},Ee={class:`field-group`},De={key:0,class:`error-txt`},Oe={class:`field-group`},ke={key:0,class:`hint-txt`},Ae={class:`field-group`},je=[`value`],Me={class:`field-group`},Ne={key:0,class:`api-error`},Pe={class:`modal-footer`},M=te({__name:`LotesFabricacionView`,setup(te){let M=b(),N=r(()=>M.empresaCodigo),P=s([]),F=s([]),I=s([]),L=s(``),R=s(!1),z=s(!1),B=s(null),V=s(!1),H=s(!1),U=s(``),W=s({}),G=()=>({codigo:``,etiqueta:``,fecha_fab:new Date().toISOString().split(`T`)[0],fecha_vence:``,responsable:``,observaciones:``}),K=s(G()),q=new Date,J=r(()=>`${String(q.getMonth()+1).padStart(2,`0`)}${String(q.getDate()).padStart(2,`0`)}${String(q.getFullYear()).slice(-2)}001`),Y=r(()=>!K.value.etiqueta||!K.value.fecha_fab?null:F.value.find(e=>e.codigo===K.value.etiqueta)?.dias_vencimiento||null),X=r(()=>{if(!Y.value||!K.value.fecha_fab)return``;let e=new Date(K.value.fecha_fab+`T12:00:00`);return e.setDate(e.getDate()+Y.value),e.toISOString().split(`T`)[0]});i([()=>K.value.etiqueta,()=>K.value.fecha_fab],()=>{X.value&&(K.value.fecha_vence=X.value)});let Z=r(()=>{let e=L.value.toLowerCase();return P.value.filter(t=>t.codigo.toLowerCase().includes(e)||(t.etiqueta_nombre||``).toLowerCase().includes(e)||(t.etiqueta||``).toLowerCase().includes(e)||(t.responsable||``).toLowerCase().includes(e))});function Q(e){return e?new Date(String(e).substring(0,10)+`T12:00:00`).toLocaleDateString(`es`,{day:`2-digit`,month:`short`,year:`numeric`}):`—`}function Fe(e){if(!e)return!1;let t=(new Date(String(e).substring(0,10)+`T12:00:00`)-new Date)/(1e3*60*60*24);return t>=0&&t<=7}async function Ie(){R.value=!0;try{let[e,t,n]=await Promise.all([fetch(`${m}/almacen/lotes-fabricacion?empresa=${N.value}`).then(e=>e.json()),fetch(`${m}/almacen/etiquetas-producto?empresa=${N.value}`).then(e=>e.json()),fetch(`${m}/nomina/empleados-basico?empresa=${N.value}`).then(e=>e.json())]);P.value=e.data||[],F.value=t.data||[],I.value=n.data||[]}catch(e){console.error(e)}finally{R.value=!1}}async function Le(){try{return(await(await fetch(`https://inventario-app-production-e8c8.up.railway.app/api/almacen/lotes-fabricacion/proximo-codigo`)).json()).codigo||J.value}catch{return J.value}}async function $(e=null){if(W.value={},U.value=``,H.value=!!e,e)K.value={codigo:e.codigo,etiqueta:e.etiqueta,fecha_fab:String(e.fecha_fab).substring(0,10),fecha_vence:e.fecha_vence?String(e.fecha_vence).substring(0,10):``,responsable:e.responsable||``,observaciones:e.observaciones||``};else{let e=await Le();K.value={...G(),codigo:e}}V.value=!0}function Re(){let e={};return K.value.codigo.trim()||(e.codigo=`Requerido`),K.value.etiqueta||(e.etiqueta=`Requerido`),K.value.fecha_fab||(e.fecha_fab=`Requerido`),W.value=e,Object.keys(e).length===0}async function ze(){if(Re()){z.value=!0,U.value=``;try{let e=H.value?`${m}/almacen/lotes-fabricacion/${K.value.codigo}`:`${m}/almacen/lotes-fabricacion`,t=await(await fetch(e,{method:H.value?`PUT`:`POST`,headers:{"Content-Type":`application/json`},body:JSON.stringify(K.value)})).json();if(!t.success)throw Error(t.error);if(H.value){let e=P.value.findIndex(e=>e.codigo===K.value.codigo);e>=0&&(P.value[e]=t.data)}else P.value.unshift(t.data);V.value=!1}catch(e){U.value=e.message}finally{z.value=!1}}}async function Be(e){B.value=e.codigo;try{let t=await(await fetch(`${m}/almacen/lotes-fabricacion/${e.codigo}`,{method:`DELETE`})).json();if(!t.success)throw Error(t.error);P.value=P.value.filter(t=>t.codigo!==e.codigo)}catch(e){alert(e.message)}finally{B.value=null}}function Ve(e){let t=M.empresaNombre||``,n=e=>e?new Date(String(e).substring(0,10)+`T12:00:00`).toLocaleDateString(`es`,{day:`2-digit`,month:`2-digit`,year:`numeric`}):`—`,r=e.barcode||e.codigo,i=`<!DOCTYPE html><html><head><meta charset="UTF-8">
<title>Label – ${e.etiqueta_nombre||e.etiqueta} – ${e.codigo}</title>
<script src="https://cdn.jsdelivr.net/npm/jsbarcode@3.11.6/dist/JsBarcode.all.min.js"><\/script>
<style>
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
        format: "CODE128", width: 1.8, height: 45,
        displayValue: false, margin: 0, background: "#ffffff", lineColor: "#000000"
      });
    } catch(e) {}
  };
<\/script>
</body></html>`,a=window.open(``,`_blank`);a.document.write(i),a.document.close()}return ee(Ie),(r,i)=>(x(),ne(n,null,{default:l(()=>[h(`div`,oe,[h(`div`,se,[i[13]||=h(`span`,{class:`bc-root`},`ALMACÉN`,-1),f(S,{size:`12`,class:`bc-sep`},{default:l(()=>[...i[11]||=[g(`mdi-chevron-right`,-1)]]),_:1}),i[14]||=h(`span`,{class:`bc-cat`},`Procesos`,-1),f(S,{size:`12`,class:`bc-sep`},{default:l(()=>[...i[12]||=[g(`mdi-chevron-right`,-1)]]),_:1}),i[15]||=h(`span`,{class:`bc-current`},`Órdenes de Producción`,-1)]),h(`div`,ce,[h(`div`,le,[h(`div`,ue,[f(S,{size:`24`,color:`white`},{default:l(()=>[...i[16]||=[g(`mdi-factory`,-1)]]),_:1})]),i[17]||=h(`div`,null,[h(`h1`,{class:`page-title`},`ÓRDENES DE PRODUCCIÓN`),h(`p`,{class:`page-sub`},`Lotes de fabricación por etiqueta de producto`)],-1)]),f(t,{color:`#047857`,variant:`flat`,"prepend-icon":`mdi-plus`,onClick:i[0]||=e=>$()},{default:l(()=>[...i[18]||=[g(` Nuevo Lote `,-1)]]),_:1})]),h(`div`,de,[h(`div`,fe,[f(S,{size:`17`,color:`rgba(var(--v-theme-on-surface),.4)`},{default:l(()=>[...i[19]||=[g(`mdi-magnify`,-1)]]),_:1}),_(h(`input`,{"onUpdate:modelValue":i[1]||=e=>L.value=e,type:`text`,placeholder:`Buscar por código, etiqueta o responsable...`,class:`search-input`},null,512),[[o,L.value]])]),h(`span`,pe,c(Z.value.length)+` lotes`,1)]),h(`div`,me,[R.value?(x(),y(`div`,he,[f(e,{indeterminate:``,color:`#10b981`,size:`36`})])):(x(),y(`table`,ge,[i[22]||=h(`thead`,null,[h(`tr`,null,[h(`th`,null,`CÓDIGO LOTE`),h(`th`,null,`PRODUCTO`),h(`th`,{class:`col-center`},`FECHA FABRICACIÓN`),h(`th`,{class:`col-center`},`FECHA VENCIMIENTO`),h(`th`,null,`RESPONSABLE`),h(`th`,{class:`col-acc`},`ACCIONES`)])],-1),h(`tbody`,null,[Z.value.length===0?(x(),y(`tr`,_e,[h(`td`,ve,[f(S,{size:`40`,color:`rgba(var(--v-theme-on-surface),.15)`},{default:l(()=>[...i[20]||=[g(`mdi-factory`,-1)]]),_:1}),i[21]||=h(`p`,null,`No hay lotes registrados`,-1)])])):v(``,!0),(x(!0),y(d,null,p(Z.value,e=>(x(),y(`tr`,{key:e.codigo,class:`data-row`},[h(`td`,null,[h(`span`,ye,c(e.codigo),1)]),h(`td`,be,c(e.etiqueta_nombre||`—`),1),h(`td`,xe,c(Q(e.fecha_fab)),1),h(`td`,Se,[h(`span`,{class:a(Fe(e.fecha_vence)?`chip-warn`:``)},c(Q(e.fecha_vence)),3)]),h(`td`,null,c(e.responsable||`—`),1),h(`td`,C,[f(t,{icon:`mdi-printer-outline`,size:`x-small`,variant:`text`,color:`#047857`,onClick:t=>Ve(e)},null,8,[`onClick`]),f(t,{icon:`mdi-pencil-outline`,size:`x-small`,variant:`text`,color:`primary`,onClick:t=>$(e)},null,8,[`onClick`]),f(t,{icon:`mdi-delete-outline`,size:`x-small`,variant:`text`,color:`error`,loading:B.value===e.codigo,onClick:t=>Be(e)},null,8,[`loading`,`onClick`])])]))),128))])]))]),f(ae,{modelValue:V.value,"onUpdate:modelValue":i[10]||=e=>V.value=e,"max-width":`560`},{default:l(()=>[f(re,{class:`modal-card`},{default:l(()=>[h(`div`,w,[f(S,{color:`#10b981`,class:`mr-2`},{default:l(()=>[...i[23]||=[g(`mdi-factory`,-1)]]),_:1}),h(`span`,null,c(H.value?`Editar Lote`:`Nuevo Lote de Fabricación`),1),f(ie),f(t,{icon:`mdi-close`,size:`small`,variant:`text`,onClick:i[2]||=e=>V.value=!1})]),h(`div`,T,[h(`div`,E,[i[24]||=h(`label`,{class:`field-label`},`Código de Lote`,-1),h(`div`,D,[_(h(`input`,{"onUpdate:modelValue":i[3]||=e=>K.value.codigo=e,disabled:H.value,type:`text`,maxlength:`20`,class:a([`field-input cod-input`,{"field-error":W.value.codigo}])},null,10,O),[[o,K.value.codigo]]),h(`span`,k,`Formato: MMDDAAXXX (ej. `+c(J.value)+`)`,1)]),W.value.codigo?(x(),y(`span`,A,c(W.value.codigo),1)):v(``,!0)]),h(`div`,j,[i[26]||=h(`label`,{class:`field-label`},`Producto *`,-1),_(h(`select`,{"onUpdate:modelValue":i[4]||=e=>K.value.etiqueta=e,class:a([`field-input field-select`,{"field-error":W.value.etiqueta}])},[i[25]||=h(`option`,{value:``},`— Seleccionar —`,-1),(x(!0),y(d,null,p(F.value,e=>(x(),y(`option`,{key:e.codigo,value:e.codigo},c(e.codigo)+` — `+c(e.producto),9,Ce))),128))],2),[[u,K.value.etiqueta]]),W.value.etiqueta?(x(),y(`span`,we,c(W.value.etiqueta),1)):v(``,!0)]),h(`div`,Te,[h(`div`,Ee,[i[27]||=h(`label`,{class:`field-label`},`Fecha de Fabricación *`,-1),_(h(`input`,{"onUpdate:modelValue":i[5]||=e=>K.value.fecha_fab=e,type:`date`,class:a([`field-input`,{"field-error":W.value.fecha_fab}])},null,2),[[o,K.value.fecha_fab]]),W.value.fecha_fab?(x(),y(`span`,De,c(W.value.fecha_fab),1)):v(``,!0)]),h(`div`,Oe,[i[28]||=h(`label`,{class:`field-label`},`Fecha de Vencimiento`,-1),_(h(`input`,{"onUpdate:modelValue":i[6]||=e=>K.value.fecha_vence=e,type:`date`,class:`field-input`},null,512),[[o,K.value.fecha_vence]]),Y.value?(x(),y(`span`,ke,` Sugerido: `+c(X.value)+` (`+c(Y.value)+` días) `,1)):v(``,!0)])]),h(`div`,Ae,[i[30]||=h(`label`,{class:`field-label`},`Responsable`,-1),_(h(`select`,{"onUpdate:modelValue":i[7]||=e=>K.value.responsable=e,class:`field-input field-select`},[i[29]||=h(`option`,{value:``},`— Seleccionar —`,-1),(x(!0),y(d,null,p(I.value,e=>(x(),y(`option`,{key:e.id,value:`${e.nombre} ${e.apellido}`},c(e.nombre)+` `+c(e.apellido),9,je))),128))],512),[[u,K.value.responsable]])]),h(`div`,Me,[i[31]||=h(`label`,{class:`field-label`},`Observaciones`,-1),_(h(`textarea`,{"onUpdate:modelValue":i[8]||=e=>K.value.observaciones=e,rows:`2`,class:`field-input field-textarea`},null,512),[[o,K.value.observaciones]])]),U.value?(x(),y(`div`,Ne,c(U.value),1)):v(``,!0)]),h(`div`,Pe,[f(t,{variant:`text`,onClick:i[9]||=e=>V.value=!1},{default:l(()=>[...i[32]||=[g(`Cancelar`,-1)]]),_:1}),f(t,{color:`#047857`,variant:`flat`,loading:z.value,onClick:ze},{default:l(()=>[g(c(H.value?`Guardar Cambios`:`Crear Lote`),1)]),_:1},8,[`loading`])])]),_:1})]),_:1},8,[`modelValue`])])]),_:1}))}},[[`__scopeId`,`data-v-07b2e170`]]);export{M as default};