/* almacen-alertas-stock.js */
(function () {
    'use strict';

    const API_BASE = 'https://inventario-app-production-e8c8.up.railway.app/api';

    function getEmpresa() {
        return window.sesion?.empresa || window.sesion?.empresaCodigo || '';
    }

    function fmtNum(v) {
        const n = parseFloat(v) || 0;
        return n.toLocaleString('es-CO', { minimumFractionDigits: 1, maximumFractionDigits: 1 });
    }

    function nivelPct(actual, minimo) {
        const a = parseFloat(actual) || 0;
        const m = parseFloat(minimo) || 1;
        if (a <= 0) return 0;
        return Math.min(Math.round((a / m) * 100), 99);
    }

    window.generarReporte = async function () {
        const btn = document.getElementById('btnGenerar');
        const contenido = document.getElementById('asContent');

        btn.disabled = true;
        contenido.innerHTML = `
            <div class="as-spinner">
                <div class="as-spin"></div>
                Consultando stock...
            </div>`;

        try {
            const empresa = getEmpresa();
            if (!empresa) throw new Error('No hay empresa en sesión');

            const res = await fetch(`${API_BASE}/almacen/reporte-alertas-stock?empresa=${encodeURIComponent(empresa)}`);
            if (!res.ok) throw new Error(`Error ${res.status}`);
            const json = await res.json();
            if (!json.success) throw new Error(json.error || 'Error al generar');

            renderResultado(json.data || [], json.bodega || '', json.advertencia || '');

        } catch (err) {
            contenido.innerHTML = `
                <div class="as-empty">
                    <div class="as-empty-icon">❌</div>
                    <div class="as-empty-title">Error al cargar</div>
                    <div class="as-empty-sub">${err.message}</div>
                </div>`;
        } finally {
            btn.disabled = false;
        }
    };

    function renderResultado(filas, bodega, advertencia) {
        const contenido = document.getElementById('asContent');
        let html = '';

        // Advertencia
        if (advertencia) {
            html += `<div class="as-advertencia">⚠️ ${advertencia}</div>`;
        }

        // Sin datos
        if (filas.length === 0) {
            html += `
                <div class="as-ok">
                    <div class="as-ok-icon">✅</div>
                    <div class="as-ok-title">¡Todo en orden!</div>
                    <div class="as-ok-sub">No hay productos por debajo del stock mínimo en la Bodega Maestra${bodega ? ' (' + bodega + ')' : ''}.</div>
                </div>`;
            contenido.innerHTML = html;
            return;
        }

        // Resumen
        const totalCero = filas.filter(f => parseFloat(f.stock_actual) <= 0).length;
        html += `
            <div class="as-resumen">
                <span class="as-chip as-chip-total">⚠️ ${filas.length} producto${filas.length !== 1 ? 's' : ''} en alerta</span>
                <span class="as-chip as-chip-cero">🔴 ${totalCero} con stock cero</span>
                ${bodega ? `<span class="as-chip as-chip-bodega">🏭 ${bodega}</span>` : ''}
            </div>`;

        // Agrupar por grupo_nombre (ya vienen ordenados por grupo_codigo desde el API)
        const grupos = [];
        const grupoMap = {};
        for (const f of filas) {
            const nombre = f.grupo_nombre || 'Sin Grupo';
            if (!grupoMap[nombre]) {
                grupoMap[nombre] = { nombre, items: [] };
                grupos.push(grupoMap[nombre]);
            }
            grupoMap[nombre].items.push(f);
        }

        for (const grupo of grupos) {
            html += `
                <div class="as-grupo">
                    <div class="as-grupo-header">
                        <span style="font-size:11px;opacity:.5">▸</span>
                        <span class="as-grupo-nombre">${grupo.nombre}</span>
                        <span class="as-grupo-cnt">${grupo.items.length}</span>
                    </div>`;

            for (const p of grupo.items) {
                const cero = parseFloat(p.stock_actual) <= 0;
                const pct  = nivelPct(p.stock_actual, p.stock_minimo);
                const valClass  = cero ? 'val-cero' : 'val-bajo';
                const faltClass = cero ? 'val-falt-cero' : 'val-falt';
                const barraClass = cero ? 'barra-cero' : 'barra-bajo';

                html += `
                    <div class="as-fila${cero ? ' fila-cero' : ''}">
                        <div class="as-fila-top">
                            <span class="as-cod">${p.codigo}</span>
                            <span class="as-nombre">${p.nombre}</span>
                            <span class="as-und">${p.und || ''}</span>
                        </div>
                        ${p.descripcion ? `<div class="as-fila-desc">${p.descripcion}</div>` : ''}
                        <div class="as-fila-stocks">
                            <div class="as-stock-item">
                                <span class="as-stock-label">Mínimo</span>
                                <span class="as-stock-val val-min">${fmtNum(p.stock_minimo)}</span>
                            </div>
                            <div class="as-stock-item">
                                <span class="as-stock-label">Actual</span>
                                <span class="as-stock-val ${valClass}">${fmtNum(p.stock_actual)}</span>
                            </div>
                            <div class="as-stock-item">
                                <span class="as-stock-label">Faltante</span>
                                <span class="as-stock-val ${faltClass}">${fmtNum(p.faltante)}</span>
                            </div>
                            <div class="as-barra-wrap">
                                <div class="as-barra-bg">
                                    <div class="as-barra-fill ${barraClass}" style="width:${pct}%"></div>
                                </div>
                                <span class="as-barra-pct">${pct}%</span>
                            </div>
                        </div>
                    </div>`;
            }

            html += `</div>`; // cierra as-grupo
        }

        contenido.innerHTML = html;
    }

})();
