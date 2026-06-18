import{m as e,t}from"./VBtn-BkwQl8Lh.js";import{t as n}from"./MainLayout-CzCIc_NJ.js";import{$t as r,En as i,Gn as a,Gt as o,In as s,Jn as c,On as l,Wt as u,Yt as d,an as f,bn as p,c as m,en as h,hn as ee,i as te,in as g,kn as _,nn as v,rn as y,s as ne,tn as re,vn as b}from"./index-D4Gn6J6x.js";import{t as x}from"./VIcon-DVntdii7.js";import{t as ie}from"./VCard-ZOJ1WDup.js";import{t as ae}from"./VSpacer-CJikDze_.js";import{t as oe}from"./VDialog-BWNsu-G1.js";var se={class:`pg-container`},ce={class:`breadcrumb`},le={class:`page-header`},ue={class:`header-left`},de={class:`header-icon`},fe={class:`toolbar`},pe={class:`search-wrap`},me={class:`count-badge`},he={class:`tabla-card`},ge={key:0,class:`loading-wrap`},_e={key:1,class:`crud-table`},ve={key:0},ye={colspan:`6`,class:`empty-row`},be={class:`cod-badge`},xe={class:`fw500`},Se={class:`sub-txt`},Ce={class:`col-center`},S={class:`col-center`},C={class:`col-acc`},w={class:`modal-header`},T={class:`modal-body`},E={class:`field-group`},D={class:`cod-wrap`},O=[`disabled`],k={class:`cod-hint`},A={key:0,class:`error-txt`},we={class:`field-group`},Te=[`value`],Ee={key:0,class:`error-txt`},De={class:`form-row-2`},Oe={class:`field-group`},ke={key:0,class:`error-txt`},Ae={class:`field-group`},je={key:0,class:`hint-txt`},Me={class:`field-group`},Ne=[`value`],Pe={class:`field-group`},Fe={key:0,class:`api-error`},Ie={class:`modal-footer`},j=te({__name:`LotesFabricacionView`,setup(te){let j=ne(),M=r(()=>j.empresaCodigo),N=s([]),P=s([]),F=s([]),I=s(``),L=s(!1),R=s(!1),z=s(null),B=s(!1),V=s(!1),H=s(``),U=s({}),W=()=>({codigo:``,etiqueta:``,fecha_fab:new Date().toISOString().split(`T`)[0],fecha_vence:``,responsable:``,observaciones:``}),G=s(W()),K=new Date,q=r(()=>`${String(K.getMonth()+1).padStart(2,`0`)}${String(K.getDate()).padStart(2,`0`)}${String(K.getFullYear()).slice(-2)}001`),J=r(()=>!G.value.etiqueta||!G.value.fecha_fab?null:P.value.find(e=>e.codigo===G.value.etiqueta)?.dias_vencimiento||null),Y=r(()=>{if(!J.value||!G.value.fecha_fab)return``;let e=new Date(G.value.fecha_fab+`T12:00:00`);return e.setDate(e.getDate()+J.value),e.toISOString().split(`T`)[0]});i([()=>G.value.etiqueta,()=>G.value.fecha_fab],()=>{Y.value&&(G.value.fecha_vence=Y.value)});let X=r(()=>{let e=I.value.toLowerCase();return N.value.filter(t=>t.codigo.toLowerCase().includes(e)||(t.etiqueta_nombre||``).toLowerCase().includes(e)||(t.etiqueta||``).toLowerCase().includes(e)||(t.responsable||``).toLowerCase().includes(e))});function Z(e){return e?new Date(String(e).substring(0,10)+`T12:00:00`).toLocaleDateString(`es`,{day:`2-digit`,month:`short`,year:`numeric`}):`—`}function Q(e){if(!e)return!1;let t=(new Date(String(e).substring(0,10)+`T12:00:00`)-new Date)/(1e3*60*60*24);return t>=0&&t<=7}async function Le(){L.value=!0;try{let[e,t,n]=await Promise.all([fetch(`${m}/almacen/lotes-fabricacion?empresa=${M.value}`).then(e=>e.json()),fetch(`${m}/almacen/etiquetas-producto?empresa=${M.value}`).then(e=>e.json()),fetch(`${m}/nomina/empleados-basico?empresa=${M.value}`).then(e=>e.json())]);N.value=e.data||[],P.value=t.data||[],F.value=n.data||[]}catch(e){console.error(e)}finally{L.value=!1}}async function Re(){try{return(await(await fetch(`https://inventario-app-production-e8c8.up.railway.app/api/almacen/lotes-fabricacion/proximo-codigo`)).json()).codigo||q.value}catch{return q.value}}async function $(e=null){if(U.value={},H.value=``,V.value=!!e,e)G.value={codigo:e.codigo,etiqueta:e.etiqueta,fecha_fab:String(e.fecha_fab).substring(0,10),fecha_vence:e.fecha_vence?String(e.fecha_vence).substring(0,10):``,responsable:e.responsable||``,observaciones:e.observaciones||``};else{let e=await Re();G.value={...W(),codigo:e}}B.value=!0}function ze(){let e={};return G.value.codigo.trim()||(e.codigo=`Requerido`),G.value.etiqueta||(e.etiqueta=`Requerido`),G.value.fecha_fab||(e.fecha_fab=`Requerido`),U.value=e,Object.keys(e).length===0}async function Be(){if(ze()){R.value=!0,H.value=``;try{let e=V.value?`${m}/almacen/lotes-fabricacion/${G.value.codigo}`:`${m}/almacen/lotes-fabricacion`,t=await(await fetch(e,{method:V.value?`PUT`:`POST`,headers:{"Content-Type":`application/json`},body:JSON.stringify(G.value)})).json();if(!t.success)throw Error(t.error);if(V.value){let e=N.value.findIndex(e=>e.codigo===G.value.codigo);e>=0&&(N.value[e]=t.data)}else N.value.unshift(t.data);B.value=!1}catch(e){H.value=e.message}finally{R.value=!1}}}async function Ve(e){z.value=e.codigo;try{let t=await(await fetch(`${m}/almacen/lotes-fabricacion/${e.codigo}`,{method:`DELETE`})).json();if(!t.success)throw Error(t.error);N.value=N.value.filter(t=>t.codigo!==e.codigo)}catch(e){alert(e.message)}finally{z.value=null}}function He(e){let t=j.empresaNombre||``,n=e=>e?new Date(String(e).substring(0,10)+`T12:00:00`).toLocaleDateString(`es`,{day:`2-digit`,month:`2-digit`,year:`numeric`}):`—`,r=e.barcode||e.codigo,i=`<!DOCTYPE html><html><head><meta charset="UTF-8">
<title>Etiqueta ${e.codigo}</title>
<script src="https://cdn.jsdelivr.net/npm/jsbarcode@3.11.6/dist/JsBarcode.all.min.js"><\/script>
<style>
  @page { size: 4in 6in; margin: 0; }
  * { box-sizing: border-box; margin: 0; padding: 0; font-family: Arial, Helvetica, sans-serif; }
  body { width: 4in; height: 6in; background: #fff; color: #111; overflow: hidden; }

  .lbl { display: flex; flex-direction: column; height: 6in; padding: 0; }

  .lbl-header { background: #064e3b; color: #fff; padding: 8px 12px; text-align: center; }
  .lbl-header .emp-name { font-size: 13pt; font-weight: 900; letter-spacing: 1px; text-transform: uppercase; }
  .lbl-header .lot-code { font-size: 8pt; color: #6ee7b7; margin-top: 2px; letter-spacing: 2px; font-weight: 700; font-family: monospace; }

  .lbl-product { background: #f0fdf4; padding: 8px 12px; border-bottom: 2px solid #064e3b; }
  .lbl-product .prod-name { font-size: 15pt; font-weight: 900; color: #064e3b; text-transform: uppercase; line-height: 1.1; }
  .lbl-product .prod-sub { font-size: 7.5pt; color: #555; margin-top: 3px; }

  .lbl-body { flex: 1; padding: 7px 12px; display: flex; flex-direction: column; gap: 5px; }

  .section-title { font-size: 6.5pt; font-weight: 900; text-transform: uppercase; letter-spacing: 0.8px; color: #064e3b; border-bottom: 1px solid #d1fae5; padding-bottom: 1px; margin-bottom: 2px; }
  .section-txt { font-size: 7.5pt; color: #222; line-height: 1.35; }
  .alerg-txt { font-size: 7.5pt; color: #92400e; font-weight: 700; line-height: 1.3; }

  .dates-row { display: flex; gap: 8px; margin-top: 2px; }
  .date-box { flex: 1; background: #f0fdf4; border: 1px solid #a7f3d0; border-radius: 5px; padding: 4px 7px; }
  .date-box.exp { background: #fff7ed; border-color: #fed7aa; }
  .date-lbl { font-size: 6pt; font-weight: 900; text-transform: uppercase; color: #6b7280; letter-spacing: 0.5px; }
  .date-val { font-size: 9.5pt; font-weight: 900; color: #064e3b; }
  .date-box.exp .date-val { color: #c2410c; }

  .weight-row { display: flex; gap: 8px; }
  .w-box { flex: 1; text-align: center; background: #f9fafb; border: 1px solid #e5e7eb; border-radius: 5px; padding: 3px 5px; }
  .w-lbl { font-size: 6pt; text-transform: uppercase; color: #6b7280; font-weight: 700; }
  .w-val { font-size: 9pt; font-weight: 900; color: #111; }

  .resp-row { font-size: 7pt; color: #555; }
  .resp-row span { font-weight: 700; color: #111; }

  .lbl-barcode { padding: 6px 12px 8px; text-align: center; border-top: 1px solid #e5e7eb; background: #fff; }
  .lbl-barcode svg { max-width: 100%; }
  .bc-num { font-size: 7pt; color: #555; margin-top: 1px; font-family: monospace; letter-spacing: 1px; }

  .instr-txt { font-size: 7pt; color: #444; font-style: italic; }
</style>
</head><body>
<div class="lbl">
  <div class="lbl-header">
    <div class="emp-name">${t}</div>
    <div class="lot-code">LOTE: ${e.codigo}</div>
  </div>

  <div class="lbl-product">
    <div class="prod-name">${e.etiqueta_nombre||e.etiqueta}</div>
    ${e.tamano_porcion||e.porciones?`<div class="prod-sub">${e.porciones?`Porciones: `+e.porciones:``}${e.porciones&&e.tamano_porcion?` &nbsp;|&nbsp; `:``}${e.tamano_porcion?`Tamaño porción: `+e.tamano_porcion:``}</div>`:``}
  </div>

  <div class="lbl-body">
    <div class="dates-row">
      <div class="date-box">
        <div class="date-lbl">Fecha Fabricación</div>
        <div class="date-val">${n(e.fecha_fab)}</div>
      </div>
      <div class="date-box exp">
        <div class="date-lbl">Fecha Vencimiento</div>
        <div class="date-val">${n(e.fecha_vence)}</div>
      </div>
    </div>

    ${e.peso_neto_oz||e.peso_neto_g?`
    <div class="weight-row">
      ${e.peso_neto_oz?`<div class="w-box"><div class="w-lbl">Peso Neto</div><div class="w-val">${e.peso_neto_oz} oz</div></div>`:``}
      ${e.peso_neto_g?`<div class="w-box"><div class="w-lbl">Peso Neto</div><div class="w-val">${e.peso_neto_g} g</div></div>`:``}
    </div>`:``}

    ${e.ingredientes?`
    <div>
      <div class="section-title">Ingredientes</div>
      <div class="section-txt">${e.ingredientes}</div>
    </div>`:``}

    ${e.alergenos?`
    <div>
      <div class="section-title">Contiene / Alérgenos</div>
      <div class="alerg-txt">${e.alergenos}</div>
    </div>`:``}

    ${e.instrucciones?`
    <div>
      <div class="section-title">Instrucciones</div>
      <div class="instr-txt">${e.instrucciones}</div>
    </div>`:``}

    ${e.responsable?`<div class="resp-row">Responsable: <span>${e.responsable}</span></div>`:``}
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
        format: "CODE128", width: 1.6, height: 40,
        displayValue: false, margin: 0, background: "#ffffff"
      });
    } catch(e) {}
    setTimeout(function(){ window.print(); }, 400);
  };
<\/script>
</body></html>`,a=window.open(``,`_blank`,`width=400,height=620`);a.document.write(i),a.document.close()}return ee(Le),(r,i)=>(b(),re(n,null,{default:l(()=>[h(`div`,se,[h(`div`,ce,[i[13]||=h(`span`,{class:`bc-root`},`ALMACÉN`,-1),f(x,{size:`12`,class:`bc-sep`},{default:l(()=>[...i[11]||=[g(`mdi-chevron-right`,-1)]]),_:1}),i[14]||=h(`span`,{class:`bc-cat`},`Procesos`,-1),f(x,{size:`12`,class:`bc-sep`},{default:l(()=>[...i[12]||=[g(`mdi-chevron-right`,-1)]]),_:1}),i[15]||=h(`span`,{class:`bc-current`},`Órdenes de Producción`,-1)]),h(`div`,le,[h(`div`,ue,[h(`div`,de,[f(x,{size:`24`,color:`white`},{default:l(()=>[...i[16]||=[g(`mdi-factory`,-1)]]),_:1})]),i[17]||=h(`div`,null,[h(`h1`,{class:`page-title`},`ÓRDENES DE PRODUCCIÓN`),h(`p`,{class:`page-sub`},`Lotes de fabricación por etiqueta de producto`)],-1)]),f(t,{color:`#047857`,variant:`flat`,"prepend-icon":`mdi-plus`,onClick:i[0]||=e=>$()},{default:l(()=>[...i[18]||=[g(` Nuevo Lote `,-1)]]),_:1})]),h(`div`,fe,[h(`div`,pe,[f(x,{size:`17`,color:`rgba(var(--v-theme-on-surface),.4)`},{default:l(()=>[...i[19]||=[g(`mdi-magnify`,-1)]]),_:1}),_(h(`input`,{"onUpdate:modelValue":i[1]||=e=>I.value=e,type:`text`,placeholder:`Buscar por código, etiqueta o responsable...`,class:`search-input`},null,512),[[o,I.value]])]),h(`span`,me,c(X.value.length)+` lotes`,1)]),h(`div`,he,[L.value?(b(),y(`div`,ge,[f(e,{indeterminate:``,color:`#10b981`,size:`36`})])):(b(),y(`table`,_e,[i[22]||=h(`thead`,null,[h(`tr`,null,[h(`th`,null,`CÓDIGO LOTE`),h(`th`,null,`PRODUCTO / ETIQUETA`),h(`th`,{class:`col-center`},`FECHA FABRICACIÓN`),h(`th`,{class:`col-center`},`FECHA VENCIMIENTO`),h(`th`,null,`RESPONSABLE`),h(`th`,{class:`col-acc`},`ACCIONES`)])],-1),h(`tbody`,null,[X.value.length===0?(b(),y(`tr`,ve,[h(`td`,ye,[f(x,{size:`40`,color:`rgba(var(--v-theme-on-surface),.15)`},{default:l(()=>[...i[20]||=[g(`mdi-factory`,-1)]]),_:1}),i[21]||=h(`p`,null,`No hay lotes registrados`,-1)])])):v(``,!0),(b(!0),y(d,null,p(X.value,e=>(b(),y(`tr`,{key:e.codigo,class:`data-row`},[h(`td`,null,[h(`span`,be,c(e.codigo),1)]),h(`td`,null,[h(`div`,xe,c(e.etiqueta_nombre||`—`),1),h(`div`,Se,c(e.etiqueta),1)]),h(`td`,Ce,c(Z(e.fecha_fab)),1),h(`td`,S,[h(`span`,{class:a(Q(e.fecha_vence)?`chip-warn`:``)},c(Z(e.fecha_vence)),3)]),h(`td`,null,c(e.responsable||`—`),1),h(`td`,C,[f(t,{icon:`mdi-printer-outline`,size:`x-small`,variant:`text`,color:`#047857`,onClick:t=>He(e)},null,8,[`onClick`]),f(t,{icon:`mdi-pencil-outline`,size:`x-small`,variant:`text`,color:`primary`,onClick:t=>$(e)},null,8,[`onClick`]),f(t,{icon:`mdi-delete-outline`,size:`x-small`,variant:`text`,color:`error`,loading:z.value===e.codigo,onClick:t=>Ve(e)},null,8,[`loading`,`onClick`])])]))),128))])]))]),f(oe,{modelValue:B.value,"onUpdate:modelValue":i[10]||=e=>B.value=e,"max-width":`560`},{default:l(()=>[f(ie,{class:`modal-card`},{default:l(()=>[h(`div`,w,[f(x,{color:`#10b981`,class:`mr-2`},{default:l(()=>[...i[23]||=[g(`mdi-factory`,-1)]]),_:1}),h(`span`,null,c(V.value?`Editar Lote`:`Nuevo Lote de Fabricación`),1),f(ae),f(t,{icon:`mdi-close`,size:`small`,variant:`text`,onClick:i[2]||=e=>B.value=!1})]),h(`div`,T,[h(`div`,E,[i[24]||=h(`label`,{class:`field-label`},`Código de Lote`,-1),h(`div`,D,[_(h(`input`,{"onUpdate:modelValue":i[3]||=e=>G.value.codigo=e,disabled:V.value,type:`text`,maxlength:`20`,class:a([`field-input cod-input`,{"field-error":U.value.codigo}])},null,10,O),[[o,G.value.codigo]]),h(`span`,k,`Formato: MMDDAAXXX (ej. `+c(q.value)+`)`,1)]),U.value.codigo?(b(),y(`span`,A,c(U.value.codigo),1)):v(``,!0)]),h(`div`,we,[i[26]||=h(`label`,{class:`field-label`},`Etiqueta de Producto *`,-1),_(h(`select`,{"onUpdate:modelValue":i[4]||=e=>G.value.etiqueta=e,class:a([`field-input field-select`,{"field-error":U.value.etiqueta}])},[i[25]||=h(`option`,{value:``},`— Seleccionar —`,-1),(b(!0),y(d,null,p(P.value,e=>(b(),y(`option`,{key:e.codigo,value:e.codigo},c(e.codigo)+` — `+c(e.producto),9,Te))),128))],2),[[u,G.value.etiqueta]]),U.value.etiqueta?(b(),y(`span`,Ee,c(U.value.etiqueta),1)):v(``,!0)]),h(`div`,De,[h(`div`,Oe,[i[27]||=h(`label`,{class:`field-label`},`Fecha de Fabricación *`,-1),_(h(`input`,{"onUpdate:modelValue":i[5]||=e=>G.value.fecha_fab=e,type:`date`,class:a([`field-input`,{"field-error":U.value.fecha_fab}])},null,2),[[o,G.value.fecha_fab]]),U.value.fecha_fab?(b(),y(`span`,ke,c(U.value.fecha_fab),1)):v(``,!0)]),h(`div`,Ae,[i[28]||=h(`label`,{class:`field-label`},`Fecha de Vencimiento`,-1),_(h(`input`,{"onUpdate:modelValue":i[6]||=e=>G.value.fecha_vence=e,type:`date`,class:`field-input`},null,512),[[o,G.value.fecha_vence]]),J.value?(b(),y(`span`,je,` Sugerido: `+c(Y.value)+` (`+c(J.value)+` días) `,1)):v(``,!0)])]),h(`div`,Me,[i[30]||=h(`label`,{class:`field-label`},`Responsable`,-1),_(h(`select`,{"onUpdate:modelValue":i[7]||=e=>G.value.responsable=e,class:`field-input field-select`},[i[29]||=h(`option`,{value:``},`— Seleccionar —`,-1),(b(!0),y(d,null,p(F.value,e=>(b(),y(`option`,{key:e.id,value:`${e.nombre} ${e.apellido}`},c(e.nombre)+` `+c(e.apellido),9,Ne))),128))],512),[[u,G.value.responsable]])]),h(`div`,Pe,[i[31]||=h(`label`,{class:`field-label`},`Observaciones`,-1),_(h(`textarea`,{"onUpdate:modelValue":i[8]||=e=>G.value.observaciones=e,rows:`2`,class:`field-input field-textarea`},null,512),[[o,G.value.observaciones]])]),H.value?(b(),y(`div`,Fe,c(H.value),1)):v(``,!0)]),h(`div`,Ie,[f(t,{variant:`text`,onClick:i[9]||=e=>B.value=!1},{default:l(()=>[...i[32]||=[g(`Cancelar`,-1)]]),_:1}),f(t,{color:`#047857`,variant:`flat`,loading:R.value,onClick:Be},{default:l(()=>[g(c(V.value?`Guardar Cambios`:`Crear Lote`),1)]),_:1},8,[`loading`])])]),_:1})]),_:1},8,[`modelValue`])])]),_:1}))}},[[`__scopeId`,`data-v-fa03ce04`]]);export{j as default};