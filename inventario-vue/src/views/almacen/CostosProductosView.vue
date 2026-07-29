<template>
  <MainLayout>
    <div class="cp-container">

      <PageHeader
        title="Actualizar Precio de Costo"
        description="Edite el costo de cada producto — se guarda automáticamente al salir de la fila"
        :crumbs="['Almacén', 'Configuración', 'Precio de Costo']"
      />

      <!-- CONTROLES -->
      <div class="cp-controles">
        <div class="cp-search">
          <v-icon size="18" style="color:rgba(var(--v-theme-on-surface),.4)">mdi-magnify</v-icon>
          <input
            v-model="search"
            type="text"
            placeholder="Buscar por código o nombre..."
            class="cp-search-input"
            @keyup.escape="search = ''"
          />
          <v-icon v-if="search" size="16" style="cursor:pointer;color:rgba(var(--v-theme-on-surface),.4)" @click="search = ''">mdi-close</v-icon>
        </div>

        <v-select
          v-model="grupoFiltro"
          :items="gruposFiltro"
          item-title="nombre"
          item-value="key"
          label="Grupo"
          variant="outlined"
          density="compact"
          hide-details
          style="min-width:220px;max-width:280px"
        />

        <v-checkbox
          v-model="soloSinCosto"
          label="Solo sin costo"
          color="primary"
          density="compact"
          hide-details
        />

        <div class="cp-spacer"></div>

        <div v-if="!esPrincipal && !loading" class="cp-capa-badge" title="Los cambios se guardan en la capa de costo de esta empresa, sin afectar el costo base">
          <v-icon size="14">mdi-layers-outline</v-icon>
          Capa de costo por empresa
        </div>

        <v-btn variant="text" prepend-icon="mdi-refresh" :loading="loading" @click="cargar">
          Recargar
        </v-btn>
      </div>

      <!-- AYUDA -->
      <div class="cp-hint">
        <v-icon size="16" color="primary">mdi-information-outline</v-icon>
        <span>
          Escriba el nuevo costo y salga de la fila (Tab, Enter o clic en otra fila) — el guardado es automático.
        </span>
      </div>

      <!-- TABLA -->
      <div class="cp-table-wrap">
        <div v-if="loading" class="cp-loading">
          <v-progress-circular indeterminate color="primary" size="36" />
        </div>

        <div v-else-if="productosFiltrados.length === 0" class="cp-empty">
          <v-icon size="44" color="rgba(var(--v-theme-on-surface),.2)">mdi-package-variant</v-icon>
          <p>No hay productos que coincidan con el filtro</p>
        </div>

        <table v-else class="cp-table">
          <thead>
            <tr>
              <th class="th-cod">CÓDIGO</th>
              <th>PRODUCTO</th>
              <th class="th-desc">DESCRIPCIÓN</th>
              <th class="th-und">UND</th>
              <th class="th-grupo">GRUPO</th>
              <th class="th-costo">PRECIO COSTO</th>
              <th class="th-estado"></th>
            </tr>
          </thead>
          <tbody>
            <tr
              v-for="p in productosFiltrados"
              :key="p.codigo"
              class="cp-row"
              :class="{ 'row-editando': p._sucio, 'row-guardado': p._flash, 'row-error': p._error }"
              @focusout="onRowFocusOut($event, p)"
            >
              <td><span class="badge-cod">{{ p.codigo }}</span></td>
              <td class="td-nom">{{ p.nombre }}</td>
              <td class="td-desc" :title="p.descripcion">{{ p.descripcion || '—' }}</td>
              <td><span class="badge-und">{{ p.und }}</span></td>
              <td class="td-grupo">{{ p.grupo_nombre }}</td>
              <td class="td-costo">
                <div class="input-wrap" :class="{ 'sin-costo': !parseFloat(p.precio_costo) }">
                  <span class="currency">$</span>
                  <input
                    v-model="p.precio_costo"
                    type="number"
                    step="0.01"
                    min="0"
                    class="costo-input"
                    :data-idx="indiceDe(p)"
                    :disabled="p._guardando"
                    @input="p._sucio = true; p._error = ''"
                    @keydown.enter.prevent="saltarSiguiente(p)"
                    @focus="$event.target.select()"
                  />
                </div>
              </td>
              <td class="td-estado">
                <v-progress-circular v-if="p._guardando" indeterminate size="16" width="2" color="primary" />
                <v-icon v-else-if="p._error" size="18" color="error" :title="p._error">mdi-alert-circle</v-icon>
                <v-icon v-else-if="p._flash" size="18" color="success">mdi-check-circle</v-icon>
                <v-icon v-else-if="p._sucio" size="18" color="warning" title="Sin guardar">mdi-circle-medium</v-icon>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <div v-if="!loading" class="cp-footer">
        {{ productosFiltrados.length }} de {{ productos.length }} productos
        <span v-if="sinCostoCount > 0" class="cp-warn"> · {{ sinCostoCount }} sin costo asignado</span>
      </div>

      <v-snackbar v-model="snack.show" :color="snack.color" :timeout="2500" location="bottom right">
        {{ snack.msg }}
      </v-snackbar>

    </div>
  </MainLayout>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import MainLayout from '../../components/layouts/MainLayout.vue'
import PageHeader from '../../components/common/PageHeader.vue'
import { useAuthStore } from '../../stores/auth'
import api from '../../services/api'

const auth    = useAuthStore()
const empresa = computed(() => auth.empresa)

const productos    = ref([])
const loading      = ref(false)
const esPrincipal  = ref(true)
const search       = ref('')
const grupoFiltro  = ref('__todos__')
const soloSinCosto = ref(false)
const snack        = ref({ show: false, msg: '', color: 'success' })

// ── Carga ─────────────────────────────────────────────────────────
async function cargar() {
  if (!empresa.value) return
  loading.value = true
  try {
    const res = await api.get('/almacen/costos-productos', { params: { empresa: empresa.value } })
    esPrincipal.value = res.data?.esPrincipal !== false
    productos.value = (res.data?.data || []).map(p => ({
      ...p,
      precio_costo: parseFloat(p.precio_costo) || 0,
      _original:  parseFloat(p.precio_costo) || 0,
      _sucio:     false,
      _guardando: false,
      _flash:     false,
      _error:     '',
    }))
  } catch (e) {
    snack.value = { show: true, msg: e?.response?.data?.error || 'Error cargando productos', color: 'error' }
  } finally {
    loading.value = false
  }
}

onMounted(cargar)

// ── Filtros ───────────────────────────────────────────────────────
const gruposFiltro = computed(() => {
  const mapa = new Map()
  for (const p of productos.value) {
    if (!mapa.has(p.grupo)) mapa.set(p.grupo, { key: p.grupo, nombre: p.grupo_nombre })
  }
  return [{ key: '__todos__', nombre: 'Todos los grupos' }, ...Array.from(mapa.values())]
})

const productosFiltrados = computed(() => {
  let lista = productos.value
  if (grupoFiltro.value !== '__todos__') lista = lista.filter(p => p.grupo === grupoFiltro.value)
  if (soloSinCosto.value) lista = lista.filter(p => !parseFloat(p.precio_costo))
  const q = search.value.trim().toUpperCase()
  if (q) lista = lista.filter(p => p.nombre?.toUpperCase().includes(q) || String(p.codigo).toUpperCase().includes(q))
  return lista
})

const sinCostoCount = computed(() => productos.value.filter(p => !parseFloat(p.precio_costo)).length)

function indiceDe(p) {
  return productosFiltrados.value.indexOf(p)
}

// ── Autoguardado al salir de la fila ──────────────────────────────
function onRowFocusOut(e, p) {
  // Si el foco sigue dentro de la misma fila, no hacemos nada
  if (e.currentTarget.contains(e.relatedTarget)) return
  guardarFila(p)
}

async function guardarFila(p) {
  if (!p._sucio || p._guardando) return

  const nuevo = Math.round((parseFloat(p.precio_costo) || 0) * 100) / 100

  if (nuevo < 0) {
    p._error = 'El costo no puede ser negativo'
    p.precio_costo = p._original
    p._sucio = false
    return
  }

  // Sin cambio real → limpiar estado y salir
  if (nuevo === p._original) {
    p.precio_costo = nuevo
    p._sucio = false
    return
  }

  p._guardando = true
  p._error = ''
  try {
    await api.put(`/almacen/costos-productos/${encodeURIComponent(p.codigo)}`, {
      empresa: empresa.value,
      precio_costo: nuevo,
    })
    p.precio_costo = nuevo
    p._original    = nuevo
    p._sucio       = false
    p._flash       = true
    setTimeout(() => { p._flash = false }, 1500)
  } catch (e) {
    p._error = e?.response?.data?.error || 'Error al guardar'
    p.precio_costo = p._original
    p._sucio = false
    snack.value = { show: true, msg: `${p.nombre}: ${p._error}`, color: 'error' }
  } finally {
    p._guardando = false
  }
}

// Enter → salta al input de la fila siguiente (dispara el autoguardado por focusout)
function saltarSiguiente(p) {
  const idx = productosFiltrados.value.indexOf(p)
  const siguiente = document.querySelector(`.costo-input[data-idx="${idx + 1}"]`)
  if (siguiente) siguiente.focus()
  else document.activeElement?.blur()
}
</script>

<style scoped>
.cp-container { padding: 24px; max-width: 1400px; margin: 0 auto; }

/* CONTROLES */
.cp-controles {
  display: flex; align-items: center; gap: 12px; flex-wrap: wrap;
  background: rgb(var(--v-theme-surface));
  border: 1px solid rgba(var(--v-theme-on-surface),.08);
  border-radius: 10px; padding: 12px 16px; margin-bottom: 12px;
}
.cp-spacer { flex: 1; }

.cp-search {
  display: flex; align-items: center; gap: 8px;
  border: 1px solid rgba(var(--v-theme-on-surface),.18);
  border-radius: 8px; padding: 6px 12px; min-width: 260px; flex: 0 1 320px;
  transition: border-color .15s;
}
.cp-search:focus-within { border-color: rgb(var(--v-theme-primary)); }
.cp-search-input {
  flex: 1; border: none; outline: none; background: transparent;
  font-size: 13.5px; color: rgb(var(--v-theme-on-surface));
}

.cp-capa-badge {
  display: inline-flex; align-items: center; gap: 6px;
  background: rgba(139,92,246,.1); color: #8b5cf6;
  border-radius: 8px; padding: 6px 12px;
  font-size: 11.5px; font-weight: 700; white-space: nowrap;
}

.cp-hint {
  display: flex; align-items: center; gap: 8px;
  font-size: 12.5px; color: rgba(var(--v-theme-on-surface),.6);
  margin-bottom: 12px; padding: 0 4px;
}

/* TABLA */
.cp-table-wrap {
  background: rgb(var(--v-theme-surface));
  border: 1px solid rgba(var(--v-theme-on-surface),.08);
  border-radius: 10px; overflow-x: auto;
}
.cp-table { width: 100%; border-collapse: collapse; font-size: 13px; }
.cp-table thead th {
  padding: 10px 12px; text-align: left;
  font-size: 10.5px; font-weight: 800; letter-spacing: .6px; text-transform: uppercase;
  color: rgba(var(--v-theme-on-surface),.45);
  background: rgba(var(--v-theme-on-surface),.03);
  border-bottom: 2px solid rgba(var(--v-theme-on-surface),.1);
  white-space: nowrap; position: sticky; top: 0; z-index: 2;
}
.th-cod    { width: 90px; }
.th-desc   { min-width: 160px; }
.th-und    { width: 70px; }
.th-grupo  { width: 150px; }
.th-costo  { width: 150px; text-align: right !important; }
.th-estado { width: 40px; }

.cp-row td { padding: 4px 12px; border-bottom: 1px solid rgba(var(--v-theme-on-surface),.05); }
.cp-row:hover { background: rgba(var(--v-theme-on-surface),.025); }
.cp-row:focus-within { background: rgba(var(--v-theme-primary),.06); }
.row-editando { background: rgba(245,158,11,.07) !important; }
.row-guardado { background: rgba(16,185,129,.1) !important; transition: background .4s; }
.row-error    { background: rgba(239,68,68,.08) !important; }

.td-nom   { font-weight: 500; }
.td-desc  { color: rgba(var(--v-theme-on-surface),.5); font-size: 12px; max-width: 240px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.td-grupo { color: rgba(var(--v-theme-on-surface),.55); font-size: 12px; }
.td-costo { text-align: right; }
.td-estado { text-align: center; width: 40px; }

.badge-cod { display:inline-block; padding:1px 6px; border-radius:4px; font-size:11px; font-weight:700; font-family:monospace; background:rgba(var(--v-theme-on-surface),.07); }
.badge-und { display:inline-block; padding:1px 6px; border-radius:4px; font-size:11px; background:rgba(8,145,178,.1); color:var(--indigo); font-weight:600; }

/* INPUT COSTO */
.input-wrap {
  display: inline-flex; align-items: center; gap: 2px;
  border: 1px solid rgba(var(--v-theme-on-surface),.18);
  border-radius: 7px; padding: 3px 8px; background: rgb(var(--v-theme-surface));
  transition: border-color .15s, box-shadow .15s;
}
.input-wrap:focus-within {
  border-color: rgb(var(--v-theme-primary));
  box-shadow: 0 0 0 3px rgba(var(--v-theme-primary),.12);
}
.input-wrap.sin-costo { border-color: rgba(245,158,11,.5); background: rgba(245,158,11,.05); }
.currency { font-size: 12px; color: rgba(var(--v-theme-on-surface),.4); font-weight: 600; }
.costo-input {
  width: 96px; border: none; outline: none; background: transparent;
  text-align: right; font-size: 13.5px; font-weight: 600;
  font-variant-numeric: tabular-nums;
  color: rgb(var(--v-theme-on-surface));
}
.costo-input::-webkit-outer-spin-button,
.costo-input::-webkit-inner-spin-button { -webkit-appearance: none; margin: 0; }
.costo-input[type=number] { -moz-appearance: textfield; }
.costo-input:disabled { opacity: .5; }

/* ESTADOS */
.cp-loading { display: flex; justify-content: center; padding: 60px 0; }
.cp-empty {
  display: flex; flex-direction: column; align-items: center; gap: 12px;
  padding: 60px 24px; color: rgba(var(--v-theme-on-surface),.4); font-size: 14px;
}
.cp-footer {
  margin-top: 12px; font-size: 12.5px; color: rgba(var(--v-theme-on-surface),.5); padding: 0 4px;
}
.cp-warn { color: #f59e0b; font-weight: 600; }
</style>
