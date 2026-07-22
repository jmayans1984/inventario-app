import{n as e}from"./logo.js";import{l as t,t as n}from"./VBtn.js";import{o as r,t as ee}from"./MainLayout.js";import{An as te,Fn as i,Gt as ne,Jn as re,Jt as ie,Kn as a,Kt as ae,Ln as o,Xt as s,Yn as c,Yt as oe,an as l,b as se,c as u,en as d,gn as ce,i as le,in as f,kn as p,nn as m,on as h,rn as g,s as ue,tn as _,un as de,xn as v,yn as y}from"./index.js";import{t as b}from"./VIcon.js";import{n as fe,t as x}from"./VCard.js";import{t as pe}from"./VTextField.js";import{t as me}from"./VSnackbar.js";import{t as he}from"./VSpacer.js";import{t as ge}from"./VTooltip.js";var _e={class:`oc-container`},ve={class:`oc-breadcrumb`},ye={class:`oc-header`},be={class:`oc-header-left`},xe={class:`oc-icon-wrap`},Se={class:`oc-sub`},Ce={key:0,class:`lista-chip`},we={class:`oc-kpi-row`},Te={class:`oc-kpi`,style:{"--kc":`#f59e0b`}},Ee={class:`kpi-val`},De={class:`oc-kpi`,style:{"--kc":`#3b82f6`}},Oe={class:`kpi-val`},ke={class:`oc-kpi`,style:{"--kc":`#22c55e`}},Ae={class:`kpi-val`},je={class:`oc-kpi`,style:{"--kc":`#10b981`}},Me={class:`kpi-val`},Ne={class:`oc-table-card`},Pe={class:`oc-filter-bar`},Fe={class:`oc-estado-chips`},Ie=[`onClick`],Le={key:1,class:`oc-empty`},Re={key:2,class:`oc-table`},ze={class:`cod-badge`},Be={class:`dim-text`},Ve={class:`dim-text`},He={class:`ta-c`},Ue={class:`precio-badge`},We={class:`ta-c dim-text`},Ge={class:`ta-r font-mono`},Ke={class:`ta-c`},qe={class:`ta-c`},Je={class:`d-flex gap-1 justify-center`},Ye={class:`nueva-header`},Xe={class:`nueva-header-left`},Ze={class:`nueva-icon`},Qe={class:`nueva-sub`},$e={class:`nueva-header-right`},et={class:`nueva-total-val`},tt={class:`nueva-filters`},nt={class:`nueva-search`},rt=[`value`],it={key:1,class:`items-badge`},at={style:{flex:`1`,"overflow-y":`auto`,"min-height":`0`}},ot={key:0,class:`prod-grid-empty`},st={class:`prod-grupo-header`},ct={class:`prod-grupo-count`},lt=[`onFocusin`],ut={class:`col-prod-nombre`},dt={class:`prod-nombre`},ft={class:`col-prod-desc dim-text`},pt={class:`col-prod-und ta-c dim-text`},mt={class:`col-prod-precio ta-r font-mono text-success`},ht={class:`col-prod-cant ta-c`},gt=[`value`,`data-codigo`,`onInput`,`onKeydown`],_t={class:`nueva-footer`},vt={key:0,class:`stock-alerta-bar`},yt={class:`nueva-footer-campos`},bt={class:`footer-field`},xt={class:`footer-field`,style:{flex:`1`}},St={class:`nueva-footer-actions`},Ct={key:0,class:`footer-resumen`},wt={class:`footer-items`},Tt={class:`footer-total`},Et={class:`det-header`},Dt={class:`det-header-left`},Ot={class:`det-icon`},kt={class:`det-title`},At={class:`det-sub`},jt={style:{display:`flex`,gap:`8px`}},Mt={key:1},Nt={class:`det-grupo-header`},Pt={class:`det-table`},Ft={class:`font-weight-medium`,style:{width:`50%`}},It={class:`ta-r`,style:{width:`12%`}},Lt={class:`ta-r font-mono`,style:{width:`19%`}},Rt={class:`ta-r font-mono text-success`,style:{width:`19%`}},zt={class:`det-total-section`},Bt={class:`det-total-row`},Vt={class:`det-total-value`},Ht={key:2,class:`det-obs mt-4`},Ut={style:{display:`flex`,"justify-content":`flex-end`,padding:`12px 16px`,"border-top":`1px solid rgba(var(--v-theme-on-surface),.08)`,gap:`8px`}},Wt={class:`det-header`},Gt={class:`det-sub`},Kt={key:1,class:`det-obs text-center py-6`},qt={key:2,class:`soporte-grid`},Jt={class:`soporte-img-wrap`},Yt=[`src`,`onClick`],Xt={key:1,class:`soporte-file`},Zt={class:`soporte-name`},Qt={class:`soporte-fecha`},$t={style:{display:`flex`,"justify-content":`flex-end`,padding:`12px 16px`,"border-top":`1px solid rgba(var(--v-theme-on-surface),.08)`}},en=[`src`],tn={class:`nueva-header`},nn={class:`nueva-header-left`},rn={class:`nueva-icon`},an={class:`nueva-title`},on={class:`nueva-header-right`},sn={class:`nueva-total-val`},cn={class:`nueva-filters`},ln={class:`nueva-search`},un=[`value`],dn={key:0,class:`items-badge`},fn={style:{flex:`1`,"overflow-y":`auto`,"min-height":`0`}},pn={class:`prod-grupo-header`},mn={class:`prod-grupo-count`},hn=[`onFocusin`],gn={class:`col-prod-nombre`},_n={class:`prod-nombre`},vn={class:`col-prod-desc dim-text`},yn={class:`col-prod-und ta-c dim-text`},bn={class:`col-prod-precio ta-r font-mono text-success`},xn={class:`col-prod-cant ta-c`},Sn=[`value`,`data-codigo`,`onInput`,`onKeydown`],Cn={class:`nueva-footer`},wn={key:0,class:`stock-alerta-bar`},Tn={class:`nueva-footer-campos`},En={class:`footer-field`},Dn={class:`footer-field`,style:{flex:`1`}},On={class:`nueva-footer-actions`},kn={key:0,class:`footer-resumen`},An={class:`footer-items`},jn={class:`footer-total`},Mn=le({__name:`OrdenesCompraView`,setup(le){let Mn=ue(),Nn=se(),Pn=d(()=>Nn.current.value.dark?`rgba(251,191,36,.2)`:`#fee2e2`),S=o(null),Fn=()=>Mn.empresaCodigo||Mn.empresa||localStorage.getItem(`empresaActual`),C=o([]),w=o([]),T=o(null),E=o(null),In=o(!1),Ln=o(!1),D=o(!1),O=i({}),Rn=o(``),k=o(``),A=o(``),j=o(``),zn=o(!1),M=o(null),N=o([]),P=o(!1),Bn=o(!1),Vn=o(null),F=o([]),I=o(!1),L=o(!1),Hn=o(``),R=o(!1),Un=o(null),z=i({}),Wn=o(``),B=o(``),V=o(``),H=o(``),Gn=o(!1),U=o({show:!1,msg:``,color:`success`}),W=o({}),G=o({}),K=o({});async function Kn(){if(T.value?.codigo)try{let t=await e.get(`/almacen/stock-bodega-maestra`,{params:{empresa:T.value.codigo}});t.data?.success&&(K.value=t.data.data||{})}catch(e){console.error(`Error cargando stock:`,e)}}function qn(e){let t=parseFloat(O[e])||0;return t<=0||K.value[e]===void 0?!1:t>K.value[e]}function Jn(e){let t=parseFloat(z[e])||0;return t<=0||K.value[e]===void 0?!1:t>K.value[e]}let Yn=d(()=>Object.keys(O).filter(e=>qn(e)&&parseFloat(O[e])>0)),Xn=d(()=>Object.keys(z).filter(e=>Jn(e)&&parseFloat(z[e])>0)),Zn=[{val:`PENDIENTE`,label:`Pendiente`},{val:`ENTREGADA`,label:`Entregada`},{val:`FACTURADA`,label:`Facturada`},{val:`ANULADA`,label:`Anulada`}],q=o([`PENDIENTE`,`ENTREGADA`]);function Qn(e){let t=q.value.indexOf(e);t>=0?q.value.splice(t,1):q.value.push(e)}let $n=d(()=>q.value.length===0?C.value:C.value.filter(e=>q.value.includes(e.estado))),er=d(()=>C.value.filter(e=>e.estado===`PENDIENTE`).reduce((e,t)=>e+parseFloat(t.total||0),0)),tr=d(()=>parseInt(E.value?.nivel)||1);function J(e){let t=tr.value;return parseFloat(t===1?e.precio_venta1:t===2?e.precio_venta2:e.precio_venta3)||0}let nr=d(()=>[...new Set(w.value.map(e=>e.grupo_nombre||e.grupo||`SIN GRUPO`))].sort()),rr=d(()=>{let e=Rn.value.toLowerCase();return w.value.filter(t=>{let n=!k.value||(t.grupo_nombre||t.grupo)===k.value,r=!e||t.codigo.toLowerCase().includes(e)||t.nombre.toLowerCase().includes(e);return n&&r})}),ir=d(()=>{let e={};return rr.value.forEach(t=>{let n=t.grupo_nombre||t.grupo||`SIN GRUPO`;e[n]||(e[n]=[]),e[n].push(t)}),Object.entries(e).sort(([e],[t])=>e.localeCompare(t,`es`))}),Y=d(()=>Object.values(O).filter(e=>parseFloat(e)>0).length),ar=d(()=>!A.value&&Y.value>0),or=d(()=>{let e=Wn.value.toLowerCase();return w.value.filter(t=>{let n=!B.value||(t.grupo_nombre||t.grupo)===B.value,r=!e||t.codigo.toLowerCase().includes(e)||t.nombre.toLowerCase().includes(e);return n&&r})}),sr=d(()=>{let e={};return or.value.forEach(t=>{let n=t.grupo_nombre||t.grupo||`SIN GRUPO`;e[n]||(e[n]=[]),e[n].push(t)}),Object.entries(e).sort(([e],[t])=>e.localeCompare(t,`es`))}),X=d(()=>Object.values(z).filter(e=>parseFloat(e)>0).length),cr=d(()=>w.value.reduce((e,t)=>{let n=parseFloat(z[t.codigo])||0;return e+(n>0?n*J(t):0)},0)),lr=d(()=>w.value.reduce((e,t)=>{let n=parseFloat(O[t.codigo])||0;return e+(n>0?n*J(t):0)},0)),ur=d(()=>{let e={};return N.value.forEach(t=>{let n=t.grupo_nombre||`SIN GRUPO`;e[n]||(e[n]=[]),e[n].push(t)}),Object.fromEntries(Object.entries(e).sort(([e],[t])=>e.localeCompare(t,`es`)))});function Z(e){return`$`+(parseFloat(e)||0).toLocaleString(`en-US`,{minimumFractionDigits:2,maximumFractionDigits:2})}function Q(e){if(!e)return`—`;let t=new Date(e+(e.includes(`T`)?``:`T00:00:00`));return`${String(t.getMonth()+1).padStart(2,`0`)}/${String(t.getDate()).padStart(2,`0`)}/${t.getFullYear()}`}function dr(e){U.value={show:!0,msg:e,color:`success`}}function $(e){U.value={show:!0,msg:e,color:`error`}}function fr(e,t){let n=parseFloat(t);isNaN(n)||n<=0?delete O[e]:O[e]=n}function pr(){Object.keys(O).forEach(e=>delete O[e])}async function mr(){In.value=!0;let e=Fn();try{let[t,n]=await Promise.all([fetch(`${u}/empresas/proveedor`).then(e=>e.json()),fetch(`${u}/ordenes-compra/mis-ordenes?cliente=${e}`).then(e=>e.json())]);t.success&&(T.value=t.data),n.success&&(C.value=n.data||[]);let r=await fetch(`${u}/empresas/clientes`).then(e=>e.json());if(r.success){let t=(r.data||[]).find(t=>String(t.codigo)===String(e));if(t?.lista_precio_id){let e=((await fetch(`https://inventario-app-production-e8c8.up.railway.app/api/produccion/lista-precios`).then(e=>e.json())).data||[]).find(e=>e.id===t.lista_precio_id);e&&(E.value=e)}}}catch{$(`Error al cargar datos`)}finally{In.value=!1}}async function hr(){try{if(Mn.empresaTipo!==`CLIENTE`){$(`Solo empresas CLIENTE pueden hacer órdenes de compra`);return}w.value=((await e.get(`/almacen/productos`)).data?.data||[]).filter(e=>e.para_venta===`SI`)}catch(e){console.error(`Error cargando productos:`,e),$(`Error cargando productos`)}}async function gr(){if(!T.value){$(`No se encontró empresa proveedor`);return}if(!E.value){$(`No tienes una lista de precios asignada. Contacta al proveedor.`);return}pr(),Rn.value=``,k.value=``,A.value=``,j.value=``,w.value.length||await hr(),Kn(),D.value=!0}async function _r(e){Vn.value=e,F.value=[],I.value=!0,Bn.value=!0;try{F.value=((await fetch(`https://inventario-app-production-e8c8.up.railway.app/api/soportes-entrega/${e.codigo}`).then(e=>e.json())).data||[]).map(e=>{let t=e.archivo_data||null,n=e.tipo_archivo||(t?t.split(`;`)[0].replace(`data:`,``):`image/jpeg`);return{...e,url:t,tipo_mime:n}})}catch{$(`Error al cargar soportes`)}finally{I.value=!1}}function vr(e){Hn.value=e,L.value=!0}function yr(e){let t=document.createElement(`a`);t.href=e.url,t.download=e.nombre_archivo||`soporte-${e.id}`,t.click()}async function br(e){if(e.estado===`PENDIENTE`){Un.value=e,Wn.value=``,B.value=``,V.value=e.fecha_entrega?e.fecha_entrega.substring(0,10):``,H.value=e.observaciones||``,Object.keys(z).forEach(e=>delete z[e]),w.value.length||await hr(),Kn(),P.value=!0;try{let t=await fetch(`${u}/ordenes-compra/${e.codigo}/detalles`).then(e=>e.json());(t.detalles||t.data||[]).forEach(e=>{parseFloat(e.cantidad)>0&&(z[e.producto_venta]=parseFloat(e.cantidad))})}catch(e){console.error(e)}finally{P.value=!1}R.value=!0}}function xr(e,t){let n=parseFloat(t);isNaN(n)||n<=0?delete z[e]:z[e]=n}function Sr(e,t){let n=[...document.querySelectorAll(`[data-codigo^="edit-"]`)],r=n.findIndex(e=>e.dataset.codigo===`edit-${t}`);r>=0&&r<n.length-1&&(e.preventDefault(),n[r+1].focus(),n[r+1].select())}async function Cr(){if(X.value!==0){if(!V.value){$(`La fecha de entrega es obligatoria`);return}if(Xn.value.length>0){let e=`Es posible que no se puedan suministrar la cantidad solicitada`;H.value.includes(e)||(H.value=H.value?`${H.value} | ${e}`:e)}Gn.value=!0;try{let t=w.value.filter(e=>(parseFloat(z[e.codigo])||0)>0).map(e=>({producto_venta:e.codigo,cantidad:parseFloat(z[e.codigo]),precio_unitario:J(e),subtotal:parseFloat(z[e.codigo])*J(e)})),n=await e.put(`/ordenes-compra/${Un.value.codigo}`,{fecha_entrega:V.value,observaciones:H.value,detalles:t,total:cr.value});if(!n.data?.success)throw Error(n.data?.details||n.data?.error||`Error al actualizar`);dr(`Orden actualizada correctamente`),R.value=!1,await mr()}catch(e){$(e?.response?.data?.details||e?.response?.data?.error||e.message)}finally{Gn.value=!1}}}function wr(e,t){let n=[...document.querySelectorAll(`.cant-input`)],r=n.findIndex(e=>e.dataset.codigo===t);r>=0&&r<n.length-1&&(e.preventDefault(),n[r+1].focus(),n[r+1].select())}async function Tr(){if(Y.value!==0){if(!A.value){$(`La fecha de entrega es obligatoria`);return}if(Yn.value.length>0){let e=`Es posible que no se puedan suministrar la cantidad solicitada`;j.value.includes(e)||(j.value=j.value?`${j.value} | ${e}`:e)}Ln.value=!0;try{let e=Fn(),t=`precio_venta${tr.value}`,n=w.value.filter(e=>(parseFloat(O[e.codigo])||0)>0).map(e=>({producto_venta:e.codigo,cantidad:parseFloat(O[e.codigo]),precio_unitario:J(e),subtotal:parseFloat(O[e.codigo])*J(e)})),r=await(await fetch(`${u}/ordenes-compra/crear`,{method:`POST`,headers:{"Content-Type":`application/json`},body:JSON.stringify({empresa:T.value.codigo,cliente:e,tipo_precio:t,fecha_entrega:A.value||null,dias_credito:E.value?.dias_credito||0,observaciones:j.value,total:lr.value,detalles:n})})).json();if(!r.success)throw Error(r.error||r.details);dr(`✅ Orden ${r.codigo} enviada correctamente`),D.value=!1,await mr()}catch(e){$(e.message)}finally{Ln.value=!1}}}async function Er(e){M.value=e,N.value=[],zn.value=!0,P.value=!0;try{let t=await fetch(`${u}/ordenes-compra/${e.codigo}/detalles`).then(e=>e.json());N.value=t.detalles||t.data||[],W.value=t.proveedor||{},G.value=t.cliente||{}}catch(e){console.error(e)}finally{P.value=!1}}function Dr(){let e=N.value,t=parseFloat(M.value.total)||0,n=`<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>${M.value.codigo}</title>
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap');
    * { margin:0; padding:0; box-sizing:border-box; }
    body { font-family: 'Inter', Arial, sans-serif; font-size:13px; color:#1a1a2e; background:#fff; }
    .page { width:8.5in; min-height:11in; margin:0 auto; padding:30px 35px; display:flex; flex-direction:column; }

    /* ── TOP BANNER ── */
    .top-banner { display:flex; align-items:stretch; margin-bottom:18px; border-radius:4px; overflow:hidden; border:1px solid #e2e8f0; }
    .banner-left { background:#1a1a2e; color:#fff; padding:14px 20px; min-width:240px; display:flex; flex-direction:column; justify-content:center; }
    .banner-doc-label { font-size:11px; font-weight:600; letter-spacing:2px; text-transform:uppercase; color:#94a3b8; margin-bottom:4px; }
    .banner-doc-title { font-size:22px; font-weight:700; letter-spacing:1px; color:#fff; }
    .banner-doc-num { font-size:14px; font-weight:500; color:#38bdf8; margin-top:3px; }
    .banner-right { flex:1; padding:12px 20px; display:grid; grid-template-columns:1fr 1fr; gap:10px; align-items:center; background:#f8fafc; }
    .banner-field { display:flex; flex-direction:column; gap:2px; }
    .banner-field-label { font-size:10px; font-weight:700; letter-spacing:1.5px; text-transform:uppercase; color:#94a3b8; }
    .banner-field-val { font-size:13px; font-weight:600; color:#1a1a2e; }
    .banner-field-val.accent { color:#0ea5e9; }

    /* ── PARTIES ── */
    .parties { display:grid; grid-template-columns:1fr 1fr; gap:12px; margin-bottom:14px; }
    .party-card { border:1px solid #e2e8f0; border-radius:4px; overflow:hidden; }
    .party-header { background:#1a1a2e; color:#fff; padding:4px 10px; font-size:10px; font-weight:700; letter-spacing:1.5px; text-transform:uppercase; }
    .party-body { padding:8px 10px; background:#fafafa; }
    .party-name { font-size:13px; font-weight:700; color:#1a1a2e; margin-bottom:2px; }
    .party-detail { font-size:11px; color:#64748b; line-height:1.5; }

    /* ── OBSERVACIONES ── */
    .obs-bar { border:1px solid #e2e8f0; border-radius:4px; padding:6px 10px; margin-bottom:14px; display:flex; gap:8px; align-items:flex-start; background:#fafafa; }
    .obs-label { font-size:10px; font-weight:700; letter-spacing:1.5px; text-transform:uppercase; color:#94a3b8; white-space:nowrap; margin-top:1px; }
    .obs-val { font-size:12px; color:#374151; flex:1; }

    /* ── TABLA ── */
    .tabla-wrap { }
    .tabla { width:100%; border-collapse:collapse; }
    .tabla thead tr { background:#fff; }
    .tabla thead th { padding:6px 8px; font-size:11px; font-weight:700; letter-spacing:1px; text-transform:uppercase; color:#1a1a2e; text-align:left; border-top:2px solid #1a1a2e; border-bottom:2px solid #1a1a2e; }
    .tabla thead th.ta-c { text-align:center; }
    .tabla thead th.ta-r { text-align:right; }
    .tabla tbody tr { border-bottom:none; }
    .tabla tbody tr.empty-row { background:#fff !important; }
    .tabla tbody tr.empty-row td { color:transparent; }
    .tabla tbody tr.last-row td { border-bottom:2px solid #1a1a2e; }
    .tabla td { padding:4px 8px; font-size:12px; color:#374151; }
    .tabla td.ta-c { text-align:center; }
    .tabla td.ta-r { text-align:right; font-variant-numeric:tabular-nums; }
    .tabla td.cod { font-weight:600; color:#0ea5e9; font-family:monospace; font-size:12px; }
    .tabla td.prod-name { font-weight:500; color:#1a1a2e; }
    .tabla td.det { color:#94a3b8; font-size:11px; font-style:italic; }
    .tabla td.qty { font-weight:600; color:#374151; }
    .tabla td.price { color:#374151; }
    .tabla td.total-cell { font-weight:600; color:#1a1a2e; }

    /* ── FOOTER ── */
    .footer { margin-top:8px; }
    .footer-top { display:flex; justify-content:flex-end; margin-bottom:20px; }
    .totals-box { width:300px; border:1px solid #e2e8f0; border-radius:4px; overflow:hidden; }
    .totals-row { display:flex; justify-content:space-between; padding:6px 14px; font-size:12px; border-bottom:1px solid #f1f5f9; }
    .totals-row .lbl { color:#64748b; font-weight:500; }
    .totals-row .val { font-weight:500; color:#374151; }
    .totals-row.grand { background:#1a1a2e; border-bottom:none; }
    .totals-row.grand .lbl { color:#94a3b8; font-weight:700; font-size:12px; letter-spacing:.5px; text-transform:uppercase; }
    .totals-row.grand .val { color:#38bdf8; font-weight:700; font-size:14px; }

    /* ── FIRMAS ── */
    .firmas { display:grid; grid-template-columns:repeat(4,1fr); gap:14px; margin-top:6px; }
    .firma { display:flex; flex-direction:column; }
    .firma-space { height:50px; border-bottom:1px solid #94a3b8; margin-bottom:4px; }
    .firma-label { font-size:10px; font-weight:700; letter-spacing:1px; text-transform:uppercase; color:#64748b; text-align:center; }

    /* ── WATERMARK número ── */
    .doc-number-side { position:fixed; right:10px; top:50%; transform:rotate(90deg) translateX(-50%); font-size:11px; color:#e2e8f0; letter-spacing:2px; font-weight:700; }
  </style>
</head>
<body>
<div class="page">

  <!-- TOP BANNER -->
  <div class="top-banner">
    <div class="banner-left">
      <div class="banner-doc-label">Documento</div>
      <div class="banner-doc-title">ORDEN DE<br>COMPRA</div>
      <div class="banner-doc-num">${M.value.codigo}</div>
    </div>
    <div class="banner-right">
      <div class="banner-field">
        <span class="banner-field-label">Fecha de Orden</span>
        <span class="banner-field-val">${Q(M.value.fecha)}</span>
      </div>
      <div class="banner-field">
        <span class="banner-field-label">Fecha de Entrega</span>
        <span class="banner-field-val accent">${Q(M.value.fecha_entrega)||`—`}</span>
      </div>
      <div class="banner-field">
        <span class="banner-field-label">Tipo de Precio</span>
        <span class="banner-field-val">${M.value.tipo_precio||`—`}</span>
      </div>
      <div class="banner-field">
        <span class="banner-field-label">Estado</span>
        <span class="banner-field-val">${M.value.estado||`—`}</span>
      </div>
    </div>
  </div>

  <!-- PARTIES -->
  <div class="parties">
    <div class="party-card">
      <div class="party-header">Vendedor / Proveedor</div>
      <div class="party-body">
        <div class="party-name">${W.value?.nombre||`N/A`}</div>
        <div class="party-detail">
          ${W.value?.direccion||``}${W.value?.direccion?`<br>`:``}
          ${W.value?.telefono?`Tel: `+W.value.telefono:``}
        </div>
      </div>
    </div>
    <div class="party-card">
      <div class="party-header">Enviar A / Cliente</div>
      <div class="party-body">
        <div class="party-name">${G.value?.nombre||`N/A`}</div>
        <div class="party-detail">
          ${G.value?.direccion||``}${G.value?.direccion?`<br>`:``}
          ${G.value?.telefono?`Tel: `+G.value.telefono:``}
        </div>
      </div>
    </div>
  </div>

  <!-- OBSERVACIONES -->
  <div class="obs-bar">
    <span class="obs-label">Observaciones</span>
    <span class="obs-val">${M.value.observaciones||`—`}</span>
  </div>

  <!-- TABLA PRODUCTOS -->
  <div class="tabla-wrap">
    <table class="tabla">
      <thead>
        <tr>
          <th style="width:7%">Código</th>
          <th style="width:38%">Producto</th>
          <th style="width:18%">Detalles</th>
          <th style="width:7%" class="ta-c">Cant.</th>
          <th style="width:13%" class="ta-r">Vr. Unitario</th>
          <th style="width:13%" class="ta-r">Total</th>
        </tr>
      </thead>
      <tbody>
        ${e.map((t,n)=>`
        <tr${n===e.length-1?` class="last-row"`:``}>
          <td class="cod ta-c">${t.producto_venta}</td>
          <td class="prod-name">${t.producto_nombre||t.nombre_producto||``}</td>
          <td class="det">${t.producto_descripcion||t.descripcion||``}</td>
          <td class="qty ta-c">${t.cantidad}</td>
          <td class="price ta-r">$${parseFloat(t.precio_unitario).toLocaleString(`en-US`,{minimumFractionDigits:2,maximumFractionDigits:2})}</td>
          <td class="total-cell ta-r">$${parseFloat(t.subtotal).toLocaleString(`en-US`,{minimumFractionDigits:2,maximumFractionDigits:2})}</td>
        </tr>`).join(``)}
      </tbody>
    </table>
  </div>

  <!-- FOOTER -->
  <div class="footer">
    <div class="footer-top">
      <div class="totals-box">
        <div class="totals-row">
          <span class="lbl">Subtotal</span>
          <span class="val">$${t.toLocaleString(`en-US`,{minimumFractionDigits:2,maximumFractionDigits:2})}</span>
        </div>
        <div class="totals-row">
          <span class="lbl">Impuestos</span>
          <span class="val">—</span>
        </div>
        <div class="totals-row grand">
          <span class="lbl">Total</span>
          <span class="val">$${t.toLocaleString(`en-US`,{minimumFractionDigits:2,maximumFractionDigits:2})}</span>
        </div>
      </div>
    </div>

    <div class="firmas">
      <div class="firma">
        <div class="firma-space"></div>
        <div class="firma-label">Entregado Por</div>
      </div>
      <div class="firma">
        <div class="firma-space"></div>
        <div class="firma-label">Recibido Por</div>
      </div>
      <div class="firma">
        <div class="firma-space"></div>
        <div class="firma-label">Fecha</div>
      </div>
      <div class="firma">
        <div class="firma-space"></div>
        <div class="firma-label">Observaciones</div>
      </div>
    </div>
  </div>

</div>
</body>
</html>`,r=window.open(``,`_blank`);r.document.write(n),r.document.close()}return ce(mr),(e,i)=>(y(),m(ee,null,{default:p(()=>[_(`div`,_e,[_(`div`,ve,[i[27]||=_(`span`,{class:`bc-root`},`ALMACÉN`,-1),h(b,{size:`13`,class:`bc-sep`},{default:p(()=>[...i[25]||=[l(`mdi-chevron-right`,-1)]]),_:1}),i[28]||=_(`span`,{class:`bc-cat`},`Procesos`,-1),h(b,{size:`13`,class:`bc-sep`},{default:p(()=>[...i[26]||=[l(`mdi-chevron-right`,-1)]]),_:1}),i[29]||=_(`span`,{class:`bc-current`},`Órdenes de Compra`,-1)]),_(`div`,ye,[_(`div`,be,[_(`div`,xe,[h(b,{size:`22`,color:`white`},{default:p(()=>[...i[30]||=[l(`mdi-clipboard-list-outline`,-1)]]),_:1})]),_(`div`,null,[i[32]||=_(`h1`,{class:`oc-title`},`ÓRDENES DE COMPRA`,-1),_(`p`,Se,[i[31]||=l(` Pedidos a `,-1),_(`strong`,null,c(T.value?.nombre||`...`),1),E.value?(y(),f(`span`,Ce,c(E.value.lista),1)):g(``,!0)])])]),h(n,{color:`#10b981`,variant:`flat`,rounded:`lg`,onClick:gr},{default:p(()=>[h(b,{start:``},{default:p(()=>[...i[33]||=[l(`mdi-plus`,-1)]]),_:1}),i[34]||=l(`Nueva Orden `,-1)]),_:1})]),_(`div`,we,[_(`div`,Te,[h(b,{size:`18`,color:`#f59e0b`},{default:p(()=>[...i[35]||=[l(`mdi-clock-outline`,-1)]]),_:1}),_(`div`,null,[_(`div`,Ee,c(C.value.filter(e=>e.estado===`PENDIENTE`).length),1),i[36]||=_(`div`,{class:`kpi-lbl`},`PENDIENTES`,-1)])]),_(`div`,De,[h(b,{size:`18`,color:`#3b82f6`},{default:p(()=>[...i[37]||=[l(`mdi-truck-check-outline`,-1)]]),_:1}),_(`div`,null,[_(`div`,Oe,c(C.value.filter(e=>e.estado===`ENTREGADA`).length),1),i[38]||=_(`div`,{class:`kpi-lbl`},`ENTREGADAS`,-1)])]),_(`div`,ke,[h(b,{size:`18`,color:`#22c55e`},{default:p(()=>[...i[39]||=[l(`mdi-receipt-text-check-outline`,-1)]]),_:1}),_(`div`,null,[_(`div`,Ae,c(C.value.filter(e=>e.estado===`FACTURADA`).length),1),i[40]||=_(`div`,{class:`kpi-lbl`},`FACTURADAS`,-1)])]),_(`div`,je,[h(b,{size:`18`,color:`#10b981`},{default:p(()=>[...i[41]||=[l(`mdi-currency-usd`,-1)]]),_:1}),_(`div`,null,[_(`div`,Me,c(Z(er.value)),1),i[42]||=_(`div`,{class:`kpi-lbl`},`TOTAL PENDIENTE`,-1)])])]),_(`div`,Ne,[_(`div`,Pe,[i[43]||=_(`span`,{class:`oc-filter-label`},`Filtrar por estado:`,-1),_(`div`,Fe,[(y(),f(s,null,v(Zn,e=>_(`button`,{key:e.val,class:a([`estado-chip`,`estado-chip--${e.val.toLowerCase()}`,{active:q.value.includes(e.val)}]),onClick:t=>Qn(e.val)},c(e.label),11,Ie)),64))])]),In.value?(y(),m(t,{key:0,indeterminate:``,color:`#10b981`,height:`3`})):g(``,!0),!In.value&&$n.value.length===0?(y(),f(`div`,Le,[h(b,{size:`48`,color:`rgba(var(--v-theme-on-surface),.12)`,class:`mb-2`},{default:p(()=>[...i[44]||=[l(`mdi-clipboard-text-off-outline`,-1)]]),_:1}),i[45]||=_(`div`,null,`No hay órdenes con los filtros seleccionados`,-1)])):(y(),f(`table`,Re,[i[46]||=_(`thead`,null,[_(`tr`,null,[_(`th`,null,`CÓDIGO`),_(`th`,null,`FECHA`),_(`th`,null,`FECHA ENTREGA`),_(`th`,{class:`ta-c`},`TIPO PRECIO`),_(`th`,{class:`ta-c`},`DÍAS CRÉDITO`),_(`th`,{class:`ta-r`},`TOTAL`),_(`th`,{class:`ta-c`},`ESTADO`),_(`th`,{class:`ta-c`},`ACCIONES`)])],-1),_(`tbody`,null,[(y(!0),f(s,null,v($n.value,e=>(y(),f(`tr`,{key:e.codigo,class:`oc-row`},[_(`td`,null,[_(`span`,ze,c(e.codigo),1)]),_(`td`,Be,c(Q(e.fecha)),1),_(`td`,Ve,c(e.fecha_entrega?Q(e.fecha_entrega):`—`),1),_(`td`,He,[_(`span`,Ue,c(e.tipo_precio),1)]),_(`td`,We,c(e.dias_credito??0)+`d`,1),_(`td`,Ge,c(Z(e.total)),1),_(`td`,Ke,[_(`span`,{class:a(`estado-badge estado-${(e.estado||``).toLowerCase()}`)},c(e.estado),3)]),_(`td`,qe,[_(`div`,Je,[h(ge,{text:`Ver detalle`},{activator:p(({props:t})=>[h(n,de({ref_for:!0},t,{icon:`mdi-eye-outline`,size:`x-small`,variant:`tonal`,color:`#10b981`,onClick:t=>Er(e)}),null,16,[`onClick`])]),_:2},1024),h(ge,{text:`Soportes de entrega`},{activator:p(({props:t})=>[h(n,de({ref_for:!0},t,{icon:`mdi-file-image-outline`,size:`x-small`,variant:`tonal`,color:`#06b6d4`,onClick:t=>_r(e)}),null,16,[`onClick`])]),_:2},1024),e.estado===`PENDIENTE`?(y(),m(ge,{key:0,text:`Editar orden`},{activator:p(({props:t})=>[h(n,de({ref_for:!0},t,{icon:`mdi-pencil-outline`,size:`x-small`,variant:`tonal`,color:`#f59e0b`,onClick:t=>br(e)}),null,16,[`onClick`])]),_:2},1024)):g(``,!0)])])]))),128))])]))])]),h(r,{modelValue:D.value,"onUpdate:modelValue":i[8]||=e=>D.value=e,"max-width":`1100`,scrollable:``},{default:p(()=>[h(x,{rounded:`xl`,style:{overflow:`hidden`,display:`flex`,"flex-direction":`column`,"max-height":`88vh`}},{default:p(()=>[_(`div`,Ye,[_(`div`,Xe,[_(`div`,Ze,[h(b,{size:`20`,color:`white`},{default:p(()=>[...i[47]||=[l(`mdi-clipboard-plus-outline`,-1)]]),_:1})]),_(`div`,null,[i[48]||=_(`div`,{class:`nueva-title`},`NUEVA ORDEN DE COMPRA`,-1),_(`div`,Qe,`Proveedor: `+c(T.value?.nombre)+` · Lista: `+c(E.value?.lista||`Sin lista asignada`),1)])]),_(`div`,$e,[i[49]||=_(`div`,{class:`nueva-total-label`},`TOTAL PEDIDO`,-1),_(`div`,et,c(Z(lr.value)),1)]),h(n,{icon:`mdi-close`,size:`small`,variant:`text`,color:`white`,onClick:i[0]||=e=>D.value=!1})]),_(`div`,tt,[_(`div`,nt,[h(b,{size:`16`,color:`rgba(var(--v-theme-on-surface),.4)`},{default:p(()=>[...i[50]||=[l(`mdi-magnify`,-1)]]),_:1}),te(_(`input`,{"onUpdate:modelValue":i[1]||=e=>Rn.value=e,type:`text`,placeholder:`Buscar producto...`,class:`nueva-search-input`},null,512),[[ae,Rn.value]])]),te(_(`select`,{"onUpdate:modelValue":i[2]||=e=>k.value=e,class:`nueva-select`},[i[51]||=_(`option`,{value:``},`Todos los grupos`,-1),(y(!0),f(s,null,v(nr.value,e=>(y(),f(`option`,{key:e,value:e},c(e),9,rt))),128))],512),[[ne,k.value]]),Y.value>0?(y(),m(n,{key:0,size:`small`,variant:`tonal`,color:`error`,onClick:pr},{default:p(()=>[h(b,{start:``,size:`14`},{default:p(()=>[...i[52]||=[l(`mdi-broom`,-1)]]),_:1}),i[53]||=l(`Limpiar `,-1)]),_:1})):g(``,!0),Y.value>0?(y(),f(`span`,it,c(Y.value)+` producto`+c(Y.value===1?``:`s`)+` en pedido `,1)):g(``,!0)]),_(`div`,at,[i[57]||=_(`div`,{class:`prod-grid-head`},[_(`span`,{class:`col-prod-nombre`},`PRODUCTO`),_(`span`,{class:`col-prod-desc`},`DESCRIPCIÓN`),_(`span`,{class:`col-prod-und ta-c`},`UND`),_(`span`,{class:`col-prod-precio ta-r`},`PRECIO`),_(`span`,{class:`col-prod-cant ta-c`},`CANTIDAD`),_(`span`,{class:`col-prod-sub ta-r`},`SUBTOTAL`)],-1),rr.value.length===0?(y(),f(`div`,ot,[h(b,{size:`36`,color:`rgba(var(--v-theme-on-surface),.2)`},{default:p(()=>[...i[54]||=[l(`mdi-package-variant-closed`,-1)]]),_:1}),i[55]||=_(`div`,{class:`mt-2`},`Sin productos que mostrar`,-1)])):g(``,!0),(y(!0),f(s,null,v(ir.value,([e,t])=>(y(),f(s,{key:e},[_(`div`,st,[h(b,{size:`13`,color:`#10b981`,class:`mr-1`},{default:p(()=>[...i[56]||=[l(`mdi-folder-outline`,-1)]]),_:1}),l(` `+c(e)+` `,1),_(`span`,ct,c(t.length)+` ítem`+c(t.length===1?``:`s`),1)]),(y(!0),f(s,null,v(t,e=>(y(),f(`div`,{key:e.codigo,class:a([`prod-row`,{"prod-row--selected":(O[e.codigo]||0)>0}]),style:re(S.value===e.codigo?{background:Pn.value}:{}),onFocusin:t=>S.value=e.codigo,onFocusout:i[4]||=e=>S.value=null},[_(`div`,ut,[_(`div`,dt,c(e.nombre),1)]),_(`div`,ft,c(e.descripcion||`—`),1),_(`div`,pt,c(e.und||`—`),1),_(`div`,mt,c(Z(J(e))),1),_(`div`,ht,[_(`input`,{value:O[e.codigo]||``,type:`number`,min:`0`,step:`1`,class:a([`cant-input`,{"cant-input--active":(O[e.codigo]||0)>0,"cant-input--warn":qn(e.codigo)}]),"data-codigo":e.codigo,onInput:t=>fr(e.codigo,t.target.value),onFocus:i[3]||=e=>e.target.select(),onKeydown:ie(t=>wr(t,e.codigo),[`enter`]),placeholder:`0`},null,42,gt)]),_(`div`,{class:a([`col-prod-sub ta-r font-mono`,(O[e.codigo]||0)>0?`text-success`:`dim-text`])},c((O[e.codigo]||0)>0?Z(J(e)*(O[e.codigo]||0)):`—`),3)],46,lt))),128))],64))),128))]),_(`div`,_t,[Yn.value.length>0?(y(),f(`div`,vt,[h(b,{size:`15`,color:`#f59e0b`},{default:p(()=>[...i[58]||=[l(`mdi-alert-outline`,-1)]]),_:1}),_(`span`,null,[_(`strong`,null,c(Yn.value.length)+` producto`+c(Yn.value.length===1?``:`s`),1),i[59]||=l(` superan el stock disponible. Se agregará una observación automática al enviar. `,-1)])])):g(``,!0),_(`div`,yt,[_(`div`,bt,[i[60]||=_(`div`,{class:`footer-field-label`},[l(`Fecha de entrega `),_(`span`,{style:{color:`#ef4444`}},`*`)],-1),h(pe,{modelValue:A.value,"onUpdate:modelValue":i[5]||=e=>A.value=e,type:`date`,variant:`outlined`,density:`compact`,"hide-details":``,error:ar.value,style:{"min-width":`180px`}},null,8,[`modelValue`,`error`])]),_(`div`,xt,[i[61]||=_(`div`,{class:`footer-field-label`},`Observaciones`,-1),h(pe,{modelValue:j.value,"onUpdate:modelValue":i[6]||=e=>j.value=e,variant:`outlined`,density:`compact`,"hide-details":``,placeholder:`Notas adicionales para el proveedor...`},null,8,[`modelValue`])])]),_(`div`,St,[Y.value>0?(y(),f(`div`,Ct,[_(`span`,wt,c(Y.value)+` producto`+c(Y.value===1?``:`s`),1),i[62]||=_(`span`,{class:`footer-sep`},`·`,-1),_(`span`,Tt,c(Z(lr.value)),1)])):g(``,!0),h(he),h(n,{color:`error`,variant:`tonal`,rounded:`lg`,onClick:i[7]||=e=>D.value=!1},{default:p(()=>[h(b,{start:``,size:`16`},{default:p(()=>[...i[63]||=[l(`mdi-close`,-1)]]),_:1}),i[64]||=l(`Cancelar `,-1)]),_:1}),h(n,{color:`#10b981`,variant:`flat`,rounded:`lg`,disabled:Y.value===0,loading:Ln.value,onClick:Tr},{default:p(()=>[h(b,{start:``,size:`16`},{default:p(()=>[...i[65]||=[l(`mdi-send-outline`,-1)]]),_:1}),i[66]||=l(`Enviar Orden `,-1)]),_:1},8,[`disabled`,`loading`])])])]),_:1})]),_:1},8,[`modelValue`]),h(r,{modelValue:zn.value,"onUpdate:modelValue":i[10]||=e=>zn.value=e,"max-width":`900`,scrollable:``},{default:p(()=>[h(x,{rounded:`xl`,style:{overflow:`hidden`,display:`flex`,"flex-direction":`column`,"max-height":`88vh`}},{default:p(()=>[_(`div`,Et,[_(`div`,Dt,[_(`div`,Ot,[h(b,{size:`20`,color:`white`},{default:p(()=>[...i[67]||=[l(`mdi-clipboard-text-outline`,-1)]]),_:1})]),_(`div`,null,[_(`div`,kt,c(M.value?.codigo),1),_(`div`,At,c(Q(M.value?.fecha))+` · `+c(T.value?.nombre)+` · `+c(M.value?.tipo_precio),1)])]),_(`span`,{class:a(`estado-badge estado-${(M.value?.estado||``).toLowerCase()}`)},c(M.value?.estado),3),_(`div`,jt,[h(n,{icon:`mdi-printer-outline`,size:`small`,variant:`text`,color:`white`,onClick:Dr,title:`Imprimir`})])]),h(fe,{class:`pa-4`,style:{flex:`1`,"overflow-y":`auto`}},{default:p(()=>[P.value?(y(),m(t,{key:0,indeterminate:``,color:`#10b981`,height:`3`,class:`mb-3`})):g(``,!0),N.value.length?(y(),f(`div`,Mt,[(y(!0),f(s,null,v(ur.value,(e,t)=>(y(),f(s,{key:t},[_(`div`,Nt,[h(b,{size:`13`,color:`#10b981`,class:`mr-1`},{default:p(()=>[...i[68]||=[l(`mdi-folder-outline`,-1)]]),_:1}),l(` `+c(t),1)]),_(`table`,Pt,[_(`tbody`,null,[(y(!0),f(s,null,v(e,e=>(y(),f(`tr`,{key:e.id},[_(`td`,Ft,c(e.producto_nombre||e.nombre_producto||e.producto_venta),1),_(`td`,It,c(e.cantidad),1),_(`td`,Lt,c(Z(e.precio_unitario)),1),_(`td`,Rt,c(Z(e.subtotal)),1)]))),128))])])],64))),128)),_(`div`,zt,[_(`div`,Bt,[i[69]||=_(`span`,{class:`det-total-label`},`TOTAL`,-1),_(`span`,Vt,c(Z(M.value?.total)),1)])])])):g(``,!0),M.value?.observaciones?(y(),f(`div`,Ht,[h(b,{size:`14`,class:`mr-1`},{default:p(()=>[...i[70]||=[l(`mdi-note-outline`,-1)]]),_:1}),i[71]||=_(`strong`,null,`Observaciones:`,-1),l(` `+c(M.value.observaciones),1)])):g(``,!0)]),_:1}),_(`div`,Ut,[h(n,{color:`error`,variant:`flat`,rounded:`lg`,onClick:i[9]||=e=>zn.value=!1},{default:p(()=>[h(b,{start:``,size:`15`},{default:p(()=>[...i[72]||=[l(`mdi-close`,-1)]]),_:1}),i[73]||=l(`Cerrar `,-1)]),_:1})])]),_:1})]),_:1},8,[`modelValue`]),h(r,{modelValue:Bn.value,"onUpdate:modelValue":i[12]||=e=>Bn.value=e,"max-width":`640`,scrollable:``},{default:p(()=>[h(x,{rounded:`xl`,style:{overflow:`hidden`}},{default:p(()=>[_(`div`,Wt,[_(`div`,null,[i[74]||=_(`div`,{class:`det-title`},`Soportes de Entrega`,-1),_(`div`,Gt,c(Vn.value?.codigo),1)])]),h(fe,{class:`pa-4`},{default:p(()=>[I.value?(y(),m(t,{key:0,indeterminate:``,color:`#06b6d4`,height:`3`,class:`mb-3`})):g(``,!0),!I.value&&F.value.length===0?(y(),f(`div`,Kt,[h(b,{size:`40`,color:`rgba(var(--v-theme-on-surface),.15)`,class:`mb-2 d-block`},{default:p(()=>[...i[75]||=[l(`mdi-file-image-off-outline`,-1)]]),_:1}),i[76]||=l(` No hay soportes de entrega para esta orden `,-1)])):(y(),f(`div`,qt,[(y(!0),f(s,null,v(F.value,e=>(y(),f(`div`,{key:e.id,class:`soporte-item`},[_(`div`,Jt,[e.tipo_mime?.startsWith(`image`)?(y(),f(`img`,{key:0,src:e.url,class:`soporte-img`,onClick:t=>vr(e.url)},null,8,Yt)):(y(),f(`div`,Xt,[h(b,{size:`28`,color:`#06b6d4`},{default:p(()=>[...i[77]||=[l(`mdi-file-pdf-box`,-1)]]),_:1}),_(`div`,Zt,c(e.nombre_archivo),1)])),h(n,{icon:`mdi-download`,size:`x-small`,variant:`flat`,color:`#06b6d4`,class:`soporte-download-btn`,onClick:oe(t=>yr(e),[`stop`])},null,8,[`onClick`])]),_(`div`,Qt,c(Q(e.fecha_subida)),1)]))),128))]))]),_:1}),_(`div`,$t,[h(n,{color:`error`,variant:`flat`,rounded:`lg`,onClick:i[11]||=e=>Bn.value=!1},{default:p(()=>[h(b,{start:``,size:`15`},{default:p(()=>[...i[78]||=[l(`mdi-close`,-1)]]),_:1}),i[79]||=l(`Cerrar `,-1)]),_:1})])]),_:1})]),_:1},8,[`modelValue`]),h(r,{modelValue:L.value,"onUpdate:modelValue":i[14]||=e=>L.value=e,"max-width":`800`},{default:p(()=>[h(x,{rounded:`xl`,style:{overflow:`hidden`,background:`#000`}},{default:p(()=>[_(`img`,{src:Hn.value,style:{width:`100%`,"max-height":`80vh`,"object-fit":`contain`}},null,8,en),h(n,{icon:`mdi-close`,size:`small`,variant:`flat`,color:`white`,style:{position:`absolute`,top:`8px`,right:`8px`},onClick:i[13]||=e=>L.value=!1})]),_:1})]),_:1},8,[`modelValue`]),h(r,{modelValue:R.value,"onUpdate:modelValue":i[23]||=e=>R.value=e,"max-width":`1100`,scrollable:``},{default:p(()=>[h(x,{rounded:`xl`,style:{overflow:`hidden`,display:`flex`,"flex-direction":`column`,"max-height":`88vh`}},{default:p(()=>[_(`div`,tn,[_(`div`,nn,[_(`div`,rn,[h(b,{size:`20`,color:`white`},{default:p(()=>[...i[80]||=[l(`mdi-pencil-outline`,-1)]]),_:1})]),_(`div`,null,[_(`div`,an,`EDITAR ORDEN — `+c(Un.value?.codigo),1),i[81]||=_(`div`,{class:`nueva-sub`},`Solo se pueden editar órdenes en estado PENDIENTE`,-1)])]),_(`div`,on,[i[82]||=_(`div`,{class:`nueva-total-label`},`TOTAL`,-1),_(`div`,sn,c(Z(cr.value)),1)]),h(n,{icon:`mdi-close`,size:`small`,variant:`text`,color:`white`,onClick:i[15]||=e=>R.value=!1})]),_(`div`,cn,[_(`div`,ln,[h(b,{size:`16`,color:`rgba(var(--v-theme-on-surface),.4)`},{default:p(()=>[...i[83]||=[l(`mdi-magnify`,-1)]]),_:1}),te(_(`input`,{"onUpdate:modelValue":i[16]||=e=>Wn.value=e,type:`text`,placeholder:`Buscar producto...`,class:`nueva-search-input`},null,512),[[ae,Wn.value]])]),te(_(`select`,{"onUpdate:modelValue":i[17]||=e=>B.value=e,class:`nueva-select`},[i[84]||=_(`option`,{value:``},`Todos los grupos`,-1),(y(!0),f(s,null,v(nr.value,e=>(y(),f(`option`,{key:e,value:e},c(e),9,un))),128))],512),[[ne,B.value]]),X.value>0?(y(),f(`span`,dn,c(X.value)+` producto`+c(X.value===1?``:`s`)+` en pedido `,1)):g(``,!0)]),_(`div`,fn,[i[86]||=_(`div`,{class:`prod-grid-head`},[_(`span`,{class:`col-prod-nombre`},`PRODUCTO`),_(`span`,{class:`col-prod-desc`},`DESCRIPCIÓN`),_(`span`,{class:`col-prod-und ta-c`},`UND`),_(`span`,{class:`col-prod-precio ta-r`},`PRECIO`),_(`span`,{class:`col-prod-cant ta-c`},`CANTIDAD`),_(`span`,{class:`col-prod-sub ta-r`},`SUBTOTAL`)],-1),(y(!0),f(s,null,v(sr.value,([e,t])=>(y(),f(s,{key:e},[_(`div`,pn,[h(b,{size:`13`,color:`#10b981`,class:`mr-1`},{default:p(()=>[...i[85]||=[l(`mdi-folder-outline`,-1)]]),_:1}),l(` `+c(e)+` `,1),_(`span`,mn,c(t.length)+` ítem`+c(t.length===1?``:`s`),1)]),(y(!0),f(s,null,v(t,e=>(y(),f(`div`,{key:e.codigo,class:a([`prod-row`,{"prod-row--selected":(z[e.codigo]||0)>0}]),style:re(S.value===e.codigo?{background:Pn.value}:{}),onFocusin:t=>S.value=e.codigo,onFocusout:i[19]||=e=>S.value=null},[_(`div`,gn,[_(`div`,_n,c(e.nombre),1)]),_(`div`,vn,c(e.descripcion||`—`),1),_(`div`,yn,c(e.und||`—`),1),_(`div`,bn,c(Z(J(e))),1),_(`div`,xn,[_(`input`,{value:z[e.codigo]||``,type:`number`,min:`0`,class:a([`cant-input`,{"cant-input--active":(z[e.codigo]||0)>0,"cant-input--warn":Jn(e.codigo)}]),"data-codigo":`edit-${e.codigo}`,onInput:t=>xr(e.codigo,t.target.value),onFocus:i[18]||=e=>e.target.select(),onKeydown:ie(t=>Sr(t,e.codigo),[`enter`]),placeholder:`0`},null,42,Sn)]),_(`div`,{class:a([`col-prod-sub ta-r font-mono`,(z[e.codigo]||0)>0?`text-success`:`dim-text`])},c((z[e.codigo]||0)>0?Z(J(e)*(z[e.codigo]||0)):`—`),3)],46,hn))),128))],64))),128))]),_(`div`,Cn,[Xn.value.length>0?(y(),f(`div`,wn,[h(b,{size:`15`,color:`#f59e0b`},{default:p(()=>[...i[87]||=[l(`mdi-alert-outline`,-1)]]),_:1}),_(`span`,null,[_(`strong`,null,c(Xn.value.length)+` producto`+c(Xn.value.length===1?``:`s`),1),i[88]||=l(` superan el stock disponible. Se agregará una observación automática al guardar. `,-1)])])):g(``,!0),_(`div`,Tn,[_(`div`,En,[i[89]||=_(`div`,{class:`footer-field-label`},[l(`Fecha de entrega `),_(`span`,{style:{color:`#ef4444`}},`*`)],-1),h(pe,{modelValue:V.value,"onUpdate:modelValue":i[20]||=e=>V.value=e,type:`date`,variant:`outlined`,density:`compact`,"hide-details":``,style:{"min-width":`180px`}},null,8,[`modelValue`])]),_(`div`,Dn,[i[90]||=_(`div`,{class:`footer-field-label`},`Observaciones`,-1),h(pe,{modelValue:H.value,"onUpdate:modelValue":i[21]||=e=>H.value=e,variant:`outlined`,density:`compact`,"hide-details":``,placeholder:`Notas adicionales...`},null,8,[`modelValue`])])]),_(`div`,On,[X.value>0?(y(),f(`div`,kn,[_(`span`,An,c(X.value)+` productos`,1),i[91]||=_(`span`,{class:`footer-sep`},`·`,-1),_(`span`,jn,c(Z(cr.value)),1)])):g(``,!0),h(he),h(n,{color:`error`,variant:`tonal`,rounded:`lg`,onClick:i[22]||=e=>R.value=!1},{default:p(()=>[h(b,{start:``,size:`16`},{default:p(()=>[...i[92]||=[l(`mdi-close`,-1)]]),_:1}),i[93]||=l(`Cancelar `,-1)]),_:1}),h(n,{color:`#f59e0b`,variant:`flat`,rounded:`lg`,disabled:X.value===0,loading:Gn.value,onClick:Cr},{default:p(()=>[h(b,{start:``,size:`16`},{default:p(()=>[...i[94]||=[l(`mdi-content-save-outline`,-1)]]),_:1}),i[95]||=l(`Guardar Cambios `,-1)]),_:1},8,[`disabled`,`loading`])])])]),_:1})]),_:1},8,[`modelValue`]),h(me,{modelValue:U.value.show,"onUpdate:modelValue":i[24]||=e=>U.value.show=e,color:U.value.color,timeout:`4000`,location:`bottom right`},{default:p(()=>[l(c(U.value.msg),1)]),_:1},8,[`modelValue`,`color`])]),_:1}))}},[[`__scopeId`,`data-v-47745b69`]]);export{Mn as default};