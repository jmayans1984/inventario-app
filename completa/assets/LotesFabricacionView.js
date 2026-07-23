import{t as e,u as t}from"./VBtn.js";import{o as n,t as r}from"./MainLayout.js";import{An as i,Dn as a,Gt as o,Kn as s,Kt as c,Ln as l,Xt as u,Yn as d,an as f,c as p,en as m,gn as ee,i as te,in as h,kn as g,nn as _,on as v,rn as y,s as ne,tn as b,xn as x,yn as S}from"./index.js";import{t as C}from"./VIcon.js";import{t as re}from"./VCard.js";import{t as ie}from"./VSpacer.js";var ae={class:`pg-container`},oe={class:`breadcrumb`},se={class:`page-header`},ce={class:`header-left`},le={class:`header-icon`},ue={class:`toolbar`},de={class:`search-wrap`},fe={class:`count-badge`},pe={class:`tabla-card`},me={key:0,class:`loading-wrap`},he={key:1,class:`crud-table`},ge={key:0},_e={colspan:`6`,class:`empty-row`},ve={class:`cod-badge`},ye={class:`fw500`},be={class:`col-center`},xe={class:`col-center`},Se={class:`col-acc`},Ce={class:`modal-header`},w={class:`modal-body`},T={class:`field-group`},E={class:`cod-wrap`},D=[`disabled`],O={class:`cod-hint`},k={key:0,class:`error-txt`},A={class:`field-group`},we=[`value`],Te={key:0,class:`error-txt`},Ee={class:`form-row-2`},De={class:`field-group`},Oe={key:0,class:`error-txt`},ke={class:`field-group`},Ae={key:0,class:`hint-txt`},je={class:`field-group`},Me=[`value`],Ne={class:`field-group`},Pe={key:0,class:`api-error`},Fe={class:`modal-footer`},j=te({__name:`LotesFabricacionView`,setup(te){let j=ne(),M=m(()=>j.empresaCodigo),N=l([]),P=l([]),F=l([]),I=l(``),L=l(`6x4`),R=l(!1),z=l(!1),B=l(null),V=l(!1),H=l(!1),U=l(``),W=l({}),G=()=>({codigo:``,etiqueta:``,fecha_fab:new Date().toISOString().split(`T`)[0],fecha_vence:``,responsable:``,observaciones:``}),K=l(G()),q=new Date,J=m(()=>`${String(q.getMonth()+1).padStart(2,`0`)}${String(q.getDate()).padStart(2,`0`)}${String(q.getFullYear()).slice(-2)}001`),Y=m(()=>!K.value.etiqueta||!K.value.fecha_fab?null:P.value.find(e=>e.codigo===K.value.etiqueta)?.dias_vencimiento||null),X=m(()=>{if(!Y.value||!K.value.fecha_fab)return``;let e=new Date(K.value.fecha_fab+`T12:00:00`);return e.setDate(e.getDate()+Y.value),e.toISOString().split(`T`)[0]});a([()=>K.value.etiqueta,()=>K.value.fecha_fab],()=>{X.value&&(K.value.fecha_vence=X.value)});let Z=m(()=>{let e=I.value.toLowerCase();return N.value.filter(t=>t.codigo.toLowerCase().includes(e)||(t.etiqueta_nombre||``).toLowerCase().includes(e)||(t.etiqueta||``).toLowerCase().includes(e)||(t.responsable||``).toLowerCase().includes(e))});function Q(e){return e?new Date(String(e).substring(0,10)+`T12:00:00`).toLocaleDateString(`es`,{day:`2-digit`,month:`short`,year:`numeric`}):`—`}function Ie(e){if(!e)return!1;let t=(new Date(String(e).substring(0,10)+`T12:00:00`)-new Date)/(1e3*60*60*24);return t>=0&&t<=7}async function Le(){R.value=!0;try{let[e,t,n,r]=await Promise.all([fetch(`${p}/almacen/lotes-fabricacion?empresa=${M.value}`).then(e=>e.json()),fetch(`${p}/almacen/etiquetas-producto?empresa=${M.value}`).then(e=>e.json()),fetch(`${p}/nomina/empleados-basico?empresa=${M.value}`).then(e=>e.json()),fetch(`${p}/empresas/formato-etiqueta-produccion?empresa=${M.value}`).then(e=>e.json())]);N.value=e.data||[],P.value=t.data||[],F.value=n.data||[],L.value=r.data?.formato_etiqueta_produccion||`6x4`}catch(e){console.error(e)}finally{R.value=!1}}async function Re(){try{return(await(await fetch(`https://inventario-app-production-e8c8.up.railway.app/api/almacen/lotes-fabricacion/proximo-codigo`)).json()).codigo||J.value}catch{return J.value}}async function $(e=null){if(W.value={},U.value=``,H.value=!!e,e)K.value={codigo:e.codigo,etiqueta:e.etiqueta,fecha_fab:String(e.fecha_fab).substring(0,10),fecha_vence:e.fecha_vence?String(e.fecha_vence).substring(0,10):``,responsable:e.responsable||``,observaciones:e.observaciones||``};else{let e=await Re();K.value={...G(),codigo:e}}V.value=!0}function ze(){let e={};return K.value.codigo.trim()||(e.codigo=`Requerido`),K.value.etiqueta||(e.etiqueta=`Requerido`),K.value.fecha_fab||(e.fecha_fab=`Requerido`),W.value=e,Object.keys(e).length===0}async function Be(){if(ze()){z.value=!0,U.value=``;try{let e=H.value?`${p}/almacen/lotes-fabricacion/${K.value.codigo}`:`${p}/almacen/lotes-fabricacion`,t=await(await fetch(e,{method:H.value?`PUT`:`POST`,headers:{"Content-Type":`application/json`},body:JSON.stringify(K.value)})).json();if(!t.success)throw Error(t.error);if(H.value){let e=N.value.findIndex(e=>e.codigo===K.value.codigo);e>=0&&(N.value[e]=t.data)}else N.value.unshift(t.data);V.value=!1}catch(e){U.value=e.message}finally{z.value=!1}}}async function Ve(e){B.value=e.codigo;try{let t=await(await fetch(`${p}/almacen/lotes-fabricacion/${e.codigo}`,{method:`DELETE`})).json();if(!t.success)throw Error(t.error);N.value=N.value.filter(t=>t.codigo!==e.codigo)}catch(e){alert(e.message)}finally{B.value=null}}function He(e){let t=j.empresaNombre||``,n=e=>e?new Date(String(e).substring(0,10)+`T12:00:00`).toLocaleDateString(`es`,{day:`2-digit`,month:`2-digit`,year:`numeric`}):`—`,r=e.barcode||e.codigo,i=L.value===`3x4`,a=i?32:45,o=i?1.3:1.8,s=i?`
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
</body></html>`,l=window.open(``,`_blank`);l.document.write(c),l.document.close()}return ee(Le),(a,l)=>(S(),_(r,null,{default:g(()=>[b(`div`,ae,[b(`div`,oe,[l[13]||=b(`span`,{class:`bc-root`},`ALMACÉN`,-1),v(C,{size:`12`,class:`bc-sep`},{default:g(()=>[...l[11]||=[f(`mdi-chevron-right`,-1)]]),_:1}),l[14]||=b(`span`,{class:`bc-cat`},`Procesos`,-1),v(C,{size:`12`,class:`bc-sep`},{default:g(()=>[...l[12]||=[f(`mdi-chevron-right`,-1)]]),_:1}),l[15]||=b(`span`,{class:`bc-current`},`Órdenes de Producción`,-1)]),b(`div`,se,[b(`div`,ce,[b(`div`,le,[v(C,{size:`24`,color:`white`},{default:g(()=>[...l[16]||=[f(`mdi-factory`,-1)]]),_:1})]),l[17]||=b(`div`,null,[b(`h1`,{class:`page-title`},`ÓRDENES DE PRODUCCIÓN`),b(`p`,{class:`page-sub`},`Lotes de fabricación por etiqueta de producto`)],-1)]),v(e,{color:`#047857`,variant:`flat`,"prepend-icon":`mdi-plus`,onClick:l[0]||=e=>$()},{default:g(()=>[...l[18]||=[f(` Nuevo Lote `,-1)]]),_:1})]),b(`div`,ue,[b(`div`,de,[v(C,{size:`17`,color:`rgba(var(--v-theme-on-surface),.4)`},{default:g(()=>[...l[19]||=[f(`mdi-magnify`,-1)]]),_:1}),i(b(`input`,{"onUpdate:modelValue":l[1]||=e=>I.value=e,type:`text`,placeholder:`Buscar por código, etiqueta o responsable...`,class:`search-input`},null,512),[[c,I.value]])]),b(`span`,fe,d(Z.value.length)+` lotes`,1)]),b(`div`,pe,[R.value?(S(),h(`div`,me,[v(t,{indeterminate:``,color:`#10b981`,size:`36`})])):(S(),h(`table`,he,[l[22]||=b(`thead`,null,[b(`tr`,null,[b(`th`,null,`CÓDIGO LOTE`),b(`th`,null,`PRODUCTO`),b(`th`,{class:`col-center`},`FECHA FABRICACIÓN`),b(`th`,{class:`col-center`},`FECHA VENCIMIENTO`),b(`th`,null,`RESPONSABLE`),b(`th`,{class:`col-acc`},`ACCIONES`)])],-1),b(`tbody`,null,[Z.value.length===0?(S(),h(`tr`,ge,[b(`td`,_e,[v(C,{size:`40`,color:`rgba(var(--v-theme-on-surface),.15)`},{default:g(()=>[...l[20]||=[f(`mdi-factory`,-1)]]),_:1}),l[21]||=b(`p`,null,`No hay lotes registrados`,-1)])])):y(``,!0),(S(!0),h(u,null,x(Z.value,t=>(S(),h(`tr`,{key:t.codigo,class:`data-row`},[b(`td`,null,[b(`span`,ve,d(t.codigo),1)]),b(`td`,ye,d(t.etiqueta_nombre||`—`),1),b(`td`,be,d(Q(t.fecha_fab)),1),b(`td`,xe,[b(`span`,{class:s(Ie(t.fecha_vence)?`chip-warn`:``)},d(Q(t.fecha_vence)),3)]),b(`td`,null,d(t.responsable||`—`),1),b(`td`,Se,[v(e,{icon:`mdi-printer-outline`,size:`x-small`,variant:`text`,color:`#047857`,onClick:e=>He(t)},null,8,[`onClick`]),v(e,{icon:`mdi-pencil-outline`,size:`x-small`,variant:`text`,color:`primary`,onClick:e=>$(t)},null,8,[`onClick`]),v(e,{icon:`mdi-delete-outline`,size:`x-small`,variant:`text`,color:`error`,loading:B.value===t.codigo,onClick:e=>Ve(t)},null,8,[`loading`,`onClick`])])]))),128))])]))]),v(n,{modelValue:V.value,"onUpdate:modelValue":l[10]||=e=>V.value=e,"max-width":`560`},{default:g(()=>[v(re,{class:`modal-card`},{default:g(()=>[b(`div`,Ce,[v(C,{color:`#10b981`,class:`mr-2`},{default:g(()=>[...l[23]||=[f(`mdi-factory`,-1)]]),_:1}),b(`span`,null,d(H.value?`Editar Lote`:`Nuevo Lote de Fabricación`),1),v(ie),v(e,{icon:`mdi-close`,size:`small`,variant:`text`,onClick:l[2]||=e=>V.value=!1})]),b(`div`,w,[b(`div`,T,[l[24]||=b(`label`,{class:`field-label`},`Código de Lote`,-1),b(`div`,E,[i(b(`input`,{"onUpdate:modelValue":l[3]||=e=>K.value.codigo=e,disabled:H.value,type:`text`,maxlength:`20`,class:s([`field-input cod-input`,{"field-error":W.value.codigo}])},null,10,D),[[c,K.value.codigo]]),b(`span`,O,`Formato: MMDDAAXXX (ej. `+d(J.value)+`)`,1)]),W.value.codigo?(S(),h(`span`,k,d(W.value.codigo),1)):y(``,!0)]),b(`div`,A,[l[26]||=b(`label`,{class:`field-label`},`Producto *`,-1),i(b(`select`,{"onUpdate:modelValue":l[4]||=e=>K.value.etiqueta=e,class:s([`field-input field-select`,{"field-error":W.value.etiqueta}])},[l[25]||=b(`option`,{value:``},`— Seleccionar —`,-1),(S(!0),h(u,null,x(P.value,e=>(S(),h(`option`,{key:e.codigo,value:e.codigo},d(e.codigo)+` — `+d(e.producto),9,we))),128))],2),[[o,K.value.etiqueta]]),W.value.etiqueta?(S(),h(`span`,Te,d(W.value.etiqueta),1)):y(``,!0)]),b(`div`,Ee,[b(`div`,De,[l[27]||=b(`label`,{class:`field-label`},`Fecha de Fabricación *`,-1),i(b(`input`,{"onUpdate:modelValue":l[5]||=e=>K.value.fecha_fab=e,type:`date`,class:s([`field-input`,{"field-error":W.value.fecha_fab}])},null,2),[[c,K.value.fecha_fab]]),W.value.fecha_fab?(S(),h(`span`,Oe,d(W.value.fecha_fab),1)):y(``,!0)]),b(`div`,ke,[l[28]||=b(`label`,{class:`field-label`},`Fecha de Vencimiento`,-1),i(b(`input`,{"onUpdate:modelValue":l[6]||=e=>K.value.fecha_vence=e,type:`date`,class:`field-input`},null,512),[[c,K.value.fecha_vence]]),Y.value?(S(),h(`span`,Ae,` Sugerido: `+d(X.value)+` (`+d(Y.value)+` días) `,1)):y(``,!0)])]),b(`div`,je,[l[30]||=b(`label`,{class:`field-label`},`Responsable`,-1),i(b(`select`,{"onUpdate:modelValue":l[7]||=e=>K.value.responsable=e,class:`field-input field-select`},[l[29]||=b(`option`,{value:``},`— Seleccionar —`,-1),(S(!0),h(u,null,x(F.value,e=>(S(),h(`option`,{key:e.id,value:`${e.nombre} ${e.apellido}`},d(e.nombre)+` `+d(e.apellido),9,Me))),128))],512),[[o,K.value.responsable]])]),b(`div`,Ne,[l[31]||=b(`label`,{class:`field-label`},`Observaciones`,-1),i(b(`textarea`,{"onUpdate:modelValue":l[8]||=e=>K.value.observaciones=e,rows:`2`,class:`field-input field-textarea`},null,512),[[c,K.value.observaciones]])]),U.value?(S(),h(`div`,Pe,d(U.value),1)):y(``,!0)]),b(`div`,Fe,[v(e,{variant:`text`,onClick:l[9]||=e=>V.value=!1},{default:g(()=>[...l[32]||=[f(`Cancelar`,-1)]]),_:1}),v(e,{color:`#047857`,variant:`flat`,loading:z.value,onClick:Be},{default:g(()=>[f(d(H.value?`Guardar Cambios`:`Crear Lote`),1)]),_:1},8,[`loading`])])]),_:1})]),_:1},8,[`modelValue`])])]),_:1}))}},[[`__scopeId`,`data-v-3ffb6f0c`]]);export{j as default};