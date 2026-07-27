<template>
  <MainLayout>
    <div class="op-container">

      <PageHeader
        title="Mapeo Subproductos → Inventario"
        description="Asocia cada subproducto (receta) con el código de producto controlado que se descuenta en inventario"
        :crumbs="['Almacén', 'Configuración', 'Mapeo Subproductos']"
      >
        <template #actions>
          <v-btn color="success" variant="flat" prepend-icon="mdi-plus" @click="abrirNuevo">
            Nuevo Mapeo
          </v-btn>
        </template>
      </PageHeader>

      <!-- INFO -->
      <div class="info-banner">
        <v-icon size="18" color="primary">mdi-information-outline</v-icon>
        <span>
          Cuando un subproducto (ej. "BOLLO LIMPIO") se vende dentro de un plato, el sistema descuenta inventario
          usando el código del <strong>producto controlado</strong>, que puede ser distinto al código de la receta.
          Este mapeo permite que Órdenes de Producción calcule el consumo real correctamente.
        </span>
      </div>

      <!-- TABLA -->
      <div class="op-card">
        <div v-if="loading" class="op-loading">
          <v-progress-circular indeterminate color="success" size="40" />
        </div>
        <div v-else class="op-table-wrap">
          <table class="op-table">
            <thead>
              <tr>
                <th>SUBPRODUCTO (RECETA)</th>
                <th>UND</th>
                <th class="tc">→</th>
                <th>PRODUCTO CONTROLADO</th>
                <th>UND</th>
                <th class="tc">ACCIONES</th>
              </tr>
            </thead>
            <tbody>
              <tr v-if="!mapeos.length">
                <td colspan="6" class="empty-row">
                  <v-icon size="40" color="rgba(var(--v-theme-on-surface),.15)">mdi-link-variant-off</v-icon>
                  <p>No hay mapeos registrados</p>
                </td>
              </tr>
              <tr v-for="m in mapeos" :key="m.codigo_receta" class="op-tr">
                <td class="fw600">
                  <span class="cod-badge">{{ m.codigo_receta }}</span>
                  {{ m.receta_nombre || '—' }}
                </td>
                <td class="text-dim">{{ m.receta_und || '—' }}</td>
                <td class="tc"><v-icon size="16" color="rgba(var(--v-theme-on-surface),.35)">mdi-arrow-right</v-icon></td>
                <td class="fw600">
                  <span class="cod-badge">{{ m.codigo_producto }}</span>
                  {{ m.producto_nombre || '—' }}
                </td>
                <td class="text-dim">{{ m.producto_und || '—' }}</td>
                <td class="tc">
                  <v-btn icon="mdi-pencil-outline" size="x-small" variant="text" color="primary" @click="editar(m)" />
                  <v-btn icon="mdi-delete-outline" size="x-small" variant="text" color="error"
                    :loading="eliminando === m.codigo_receta" @click="eliminar(m)" />
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <!-- ══════════ DIALOG NUEVO/EDITAR MAPEO ══════════ -->
      <v-dialog v-model="dlg" max-width="560" persistent>
        <v-card class="modal-card">
          <div class="modal-header">
            <v-icon color="success" class="mr-2">mdi-link-variant</v-icon>
            <span>{{ editando ? 'Editar Mapeo' : 'Nuevo Mapeo' }}</span>
            <v-spacer />
            <v-btn icon="mdi-close" size="small" variant="text" @click="dlg = false" />
          </div>
          <div class="modal-body">
            <div class="field-group" style="margin-bottom:16px">
              <label class="field-label">Subproducto (receta) *</label>
              <v-autocomplete
                v-model="form.codigo_receta"
                :items="subproductos"
                item-title="nombre"
                item-value="codigo"
                variant="outlined"
                density="compact"
                :disabled="editando"
                placeholder="Buscar subproducto..."
                hide-details
              >
                <template #item="{ item, props }">
                  <v-list-item v-bind="props" :title="item.raw.nombre">
                    <template #append>
                      <span style="font-size:10px;color:rgba(var(--v-theme-on-surface),0.4)">{{ item.raw.codigo }} · {{ item.raw.und }}</span>
                    </template>
                  </v-list-item>
                </template>
              </v-autocomplete>
            </div>

            <div class="field-group">
              <label class="field-label">Producto controlado (inventario) *</label>
              <v-autocomplete
                v-model="form.codigo_producto"
                :items="productos"
                item-title="nombre"
                item-value="codigo"
                variant="outlined"
                density="compact"
                placeholder="Buscar producto..."
                hide-details
                @update:search="val => fetchProductos(val)"
              >
                <template #item="{ item, props }">
                  <v-list-item v-bind="props" :title="item.raw.nombre">
                    <template #append>
                      <span style="font-size:10px;color:rgba(var(--v-theme-on-surface),0.4)">{{ item.raw.codigo }} · {{ item.raw.und }}</span>
                    </template>
                  </v-list-item>
                </template>
              </v-autocomplete>
            </div>

            <div v-if="saveError" class="save-error">
              <v-icon size="15" color="error">mdi-alert-circle-outline</v-icon>
              <span>{{ saveError }}</span>
            </div>
          </div>
          <div class="modal-footer">
            <v-btn variant="text" @click="dlg = false">Cancelar</v-btn>
            <v-btn color="success" variant="flat" prepend-icon="mdi-content-save-outline"
              :disabled="!form.codigo_receta || !form.codigo_producto" :loading="guardando" @click="guardar">
              Guardar
            </v-btn>
          </div>
        </v-card>
      </v-dialog>

    </div>
  </MainLayout>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import MainLayout from '../../components/layouts/MainLayout.vue'
import PageHeader from '../../components/common/PageHeader.vue'
import { API_BASE } from '../../utils/constants.js'

const loading      = ref(false)
const mapeos       = ref([])
const subproductos = ref([])
const productos    = ref([])
const eliminando   = ref(null)

const dlg       = ref(false)
const editando  = ref(false)
const guardando = ref(false)
const saveError = ref('')
const form = ref({ codigo_receta: '', codigo_producto: '' })

async function cargarMapeos() {
  loading.value = true
  try {
    const res = await fetch(`${API_BASE}/produccion/receta-producto`)
    const j = await res.json()
    mapeos.value = j.data || []
  } catch (e) {
    console.error('receta-producto:', e)
  } finally {
    loading.value = false
  }
}

async function cargarSubproductos() {
  try {
    const res = await fetch(`${API_BASE}/recetas/para-selector`)
    const j = await res.json()
    subproductos.value = j.data || []
  } catch (e) {
    console.error('subproductos:', e)
  }
}

async function fetchProductos(q = '') {
  try {
    const params = q && q.trim() ? `?q=${encodeURIComponent(q.trim())}` : ''
    const res = await fetch(`${API_BASE}/productos/controlados${params}`)
    const j = await res.json()
    productos.value = j.data || []
  } catch (e) {
    console.error('productos/controlados:', e)
  }
}

function abrirNuevo() {
  editando.value = false
  form.value = { codigo_receta: '', codigo_producto: '' }
  saveError.value = ''
  dlg.value = true
  fetchProductos()
}

function editar(m) {
  editando.value = true
  form.value = { codigo_receta: m.codigo_receta, codigo_producto: m.codigo_producto }
  saveError.value = ''
  dlg.value = true
  fetchProductos()
}

async function guardar() {
  if (!form.value.codigo_receta || !form.value.codigo_producto) return
  guardando.value = true
  saveError.value = ''
  try {
    const res = await fetch(`${API_BASE}/produccion/receta-producto`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form.value),
    })
    const j = await res.json()
    if (!j.success) throw new Error(j.error)
    dlg.value = false
    cargarMapeos()
  } catch (e) {
    saveError.value = e.message || 'Error al guardar'
  } finally {
    guardando.value = false
  }
}

async function eliminar(m) {
  if (!confirm(`¿Eliminar el mapeo de "${m.receta_nombre || m.codigo_receta}"?`)) return
  eliminando.value = m.codigo_receta
  try {
    await fetch(`${API_BASE}/produccion/receta-producto/${m.codigo_receta}`, { method: 'DELETE' })
    mapeos.value = mapeos.value.filter(x => x.codigo_receta !== m.codigo_receta)
  } catch (e) {
    console.error('eliminar mapeo:', e)
  } finally {
    eliminando.value = null
  }
}

onMounted(() => {
  cargarMapeos()
  cargarSubproductos()
})
</script>

<style scoped>
.op-container { padding: 0 0 32px; }

/* BREADCRUMB */
.breadcrumb { display: flex; align-items: center; gap: 6px; margin-bottom: 20px; }
.bc-root { font-size: 11px; font-weight: 800; letter-spacing: 1px; color: rgba(var(--v-theme-on-surface), 0.4); text-transform: uppercase; }
.bc-sep { color: rgba(var(--v-theme-on-surface), 0.25); }
.bc-cat { font-size: 11px; font-weight: 600; color: rgba(var(--v-theme-on-surface), 0.5); }
.bc-current { font-size: 11px; font-weight: 700; color: rgb(var(--v-theme-on-surface)); }

/* HEADER */
.op-header { display: flex; align-items: center; justify-content: space-between; gap: 16px; margin-bottom: 20px; flex-wrap: wrap; }
.op-header-left { display: flex; align-items: center; gap: 16px; }
.op-icon-wrap {
  width: 52px; height: 52px; border-radius: 14px; flex-shrink: 0;
  background: linear-gradient(135deg, var(--success), var(--success));
  display: flex; align-items: center; justify-content: center;
}
.op-title { font-size: 22px; font-weight: 800; margin: 0 0 2px; color: rgb(var(--v-theme-on-surface)); }
.op-sub { font-size: 13px; color: rgba(var(--v-theme-on-surface), 0.5); margin: 0; }

/* INFO BANNER */
.info-banner {
  display: flex; align-items: flex-start; gap: 10px;
  background: rgba(8,145,178,0.06); border: 1px solid rgba(8,145,178,0.2);
  border-radius: 10px; padding: 12px 16px; margin-bottom: 20px;
  font-size: 12.5px; color: rgba(var(--v-theme-on-surface), 0.7); line-height: 1.5;
}

/* CARD / TABLA */
.op-card {
  background: rgb(var(--v-theme-surface));
  border: 1px solid rgba(var(--v-theme-on-surface), 0.08);
  border-radius: 12px; padding: 6px 0; overflow: hidden;
}
.op-loading { display: flex; justify-content: center; padding: 60px 0; }
.op-table-wrap { overflow-x: auto; }
.op-table { width: 100%; border-collapse: collapse; font-size: 13px; }
.op-table th {
  text-align: left; font-size: 10.5px; font-weight: 800; letter-spacing: 0.5px;
  color: rgba(var(--v-theme-on-surface), 0.45); text-transform: uppercase;
  padding: 12px 14px; border-bottom: 1px solid rgba(var(--v-theme-on-surface), 0.1);
  white-space: nowrap;
}
.op-table td { padding: 10px 14px; border-bottom: 1px solid rgba(var(--v-theme-on-surface), 0.05); white-space: nowrap; }
.op-table .tc { text-align: center; }
.op-tr:hover { background: rgba(var(--v-theme-on-surface), 0.03); }
.empty-row { text-align: center; padding: 48px 0 !important; color: rgba(var(--v-theme-on-surface), 0.4); }
.empty-row p { margin: 8px 0 0; font-size: 13px; }
.fw600 { font-weight: 600; }
.text-dim { color: rgba(var(--v-theme-on-surface), 0.45); }
.cod-badge {
  font-family: monospace; font-size: 12px; font-weight: 700;
  background: rgba(var(--v-theme-on-surface), 0.06); padding: 2px 8px; border-radius: 6px;
  margin-right: 6px;
}

/* MODAL */
.modal-card { border-radius: 14px !important; }
.modal-header {
  display: flex; align-items: center; padding: 16px 20px;
  border-bottom: 1px solid rgba(var(--v-theme-on-surface), 0.08);
  font-size: 15px; font-weight: 700;
}
.modal-body { padding: 20px; }
.modal-footer {
  display: flex; justify-content: flex-end; gap: 8px; padding: 14px 20px;
  border-top: 1px solid rgba(var(--v-theme-on-surface), 0.08);
}
.field-group { display: flex; flex-direction: column; gap: 5px; }
.field-label { font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.4px; color: rgba(var(--v-theme-on-surface), 0.5); }
.save-error {
  display: flex; align-items: center; gap: 8px; margin-top: 14px;
  background: rgba(239,68,68,0.08); border: 1px solid rgba(239,68,68,0.2);
  border-radius: 8px; padding: 8px 12px; font-size: 12.5px; color: var(--error);
}
</style>
