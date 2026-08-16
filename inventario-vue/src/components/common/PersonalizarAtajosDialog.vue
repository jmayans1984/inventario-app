<template>
  <v-dialog :model-value="modelValue" max-width="720" scrollable @update:model-value="$emit('update:modelValue', $event)">
    <div class="pa-card">
      <div class="pa-head">
        <div>
          <div class="pa-title">Personalizar accesos</div>
          <div class="pa-sub">Oculta, reordena o renombra las tarjetas de este módulo. Solo cambia para tu usuario.</div>
        </div>
        <button class="pa-x" @click="cerrar"><v-icon size="18">mdi-close</v-icon></button>
      </div>

      <div class="pa-body">
        <div v-for="sec in borrador" :key="sec.label" class="pa-sec">
          <div class="pa-sec-label">{{ sec.label }}</div>

          <div v-for="(item, idx) in sec.items" :key="item.path" class="pa-item" :class="item.oculto && 'pa-item-off'">
            <div class="pa-row">
              <div class="pa-ord">
                <button class="pa-arrow" :disabled="idx === 0" @click="mover(sec, idx, -1)">
                  <v-icon size="15">mdi-chevron-up</v-icon>
                </button>
                <button class="pa-arrow" :disabled="idx === sec.items.length - 1" @click="mover(sec, idx, 1)">
                  <v-icon size="15">mdi-chevron-down</v-icon>
                </button>
              </div>

              <button class="pa-icon-btn" title="Cambiar ícono" @click="abrirIconos(item)">
                <v-icon size="19">{{ item.icon }}</v-icon>
              </button>

              <div class="pa-txt">
                <div class="pa-txt-title">{{ item.title }}</div>
                <div class="pa-txt-desc">{{ item.desc }}</div>
              </div>

              <button class="pa-act" :title="expandido === item.path ? 'Cerrar' : 'Editar textos'" @click="expandido = expandido === item.path ? null : item.path">
                <v-icon size="17">mdi-pencil-outline</v-icon>
              </button>
              <button class="pa-act" :title="item.oculto ? 'Mostrar' : 'Ocultar'" @click="item.oculto = !item.oculto">
                <v-icon size="17">{{ item.oculto ? 'mdi-eye-off-outline' : 'mdi-eye-outline' }}</v-icon>
              </button>
            </div>

            <div v-if="expandido === item.path" class="pa-edit">
              <v-text-field v-model="item.title" label="Título" density="compact" variant="outlined" hide-details autocomplete="off" />
              <v-text-field v-model="item.desc" label="Descripción" density="compact" variant="outlined" hide-details autocomplete="off" />
              <button class="pa-reset" @click="restaurarItem(item)">
                <v-icon size="14">mdi-restore</v-icon> Restaurar original
              </button>
            </div>
          </div>
        </div>
      </div>

      <div class="pa-foot">
        <button class="pa-btn pa-btn-ghost" @click="pedirRestablecer">Restablecer todo</button>
        <div class="pa-foot-right">
          <button class="pa-btn pa-btn-ghost" @click="cerrar">Cancelar</button>
          <button class="pa-btn pa-btn-primary" @click="aplicar">Guardar cambios</button>
        </div>
      </div>
    </div>

    <!-- Selector de íconos -->
    <v-dialog v-model="iconDialog" max-width="560" scrollable>
      <div class="pa-card">
        <div class="pa-head">
          <div class="pa-title">Elegir ícono</div>
          <button class="pa-x" @click="iconDialog = false"><v-icon size="18">mdi-close</v-icon></button>
        </div>
        <div class="pa-icon-search">
          <v-text-field
            v-model="iconQuery"
            placeholder="Buscar ícono (ej. banco, factura, chart)"
            density="compact"
            variant="outlined"
            hide-details
            autocomplete="off"
            prepend-inner-icon="mdi-magnify"
          />
        </div>
        <div class="pa-icon-grid">
          <div v-if="iconsLoading" class="pa-icon-loading">
            <v-progress-circular indeterminate size="22" width="2" />
          </div>
          <button
            v-for="name in iconosFiltrados"
            :key="name"
            class="pa-icon-cell"
            :class="itemIcono?.icon === name && 'pa-icon-cell-sel'"
            :title="name"
            @click="elegirIcono(name)"
          >
            <v-icon size="20">{{ name }}</v-icon>
          </button>
          <div v-if="!iconsLoading && iconosFiltrados.length === 0" class="pa-icon-empty">Sin resultados</div>
        </div>
      </div>
    </v-dialog>
  </v-dialog>
</template>

<script setup>
import { ref, computed, watch } from 'vue'

const props = defineProps({
  modelValue: { type: Boolean, default: false },
  secciones: { type: Array, required: true },
})
const emit = defineEmits(['update:modelValue', 'guardar', 'restablecer'])

const borrador = ref([])
const expandido = ref(null)

watch(() => props.modelValue, (abierto) => {
  if (!abierto) return
  expandido.value = null
  borrador.value = props.secciones.map(sec => ({
    label: sec.label,
    items: sec.items.map(i => ({
      path: i.path,
      title: i.title,
      desc: i.desc,
      icon: i.icon,
      oculto: i.oculto,
      _orig: i._orig,
    })),
  }))
}, { immediate: true })

function mover(sec, idx, delta) {
  const destino = idx + delta
  if (destino < 0 || destino >= sec.items.length) return
  const [it] = sec.items.splice(idx, 1)
  sec.items.splice(destino, 0, it)
}

function restaurarItem(item) {
  item.title = item._orig.title
  item.desc = item._orig.desc
  item.icon = item._orig.icon
}

function cerrar() {
  emit('update:modelValue', false)
}

function aplicar() {
  const config = {}
  borrador.value.forEach(sec => {
    sec.items.forEach((item, orden) => {
      const cambios = { orden }
      if (item.oculto) cambios.oculto = true
      if (item.title !== item._orig.title) cambios.titulo = item.title
      if (item.desc !== item._orig.desc) cambios.descripcion = item.desc
      if (item.icon !== item._orig.icon) cambios.icono = item.icon
      config[item.path] = cambios
    })
  })
  emit('guardar', config)
  cerrar()
}

function pedirRestablecer() {
  emit('restablecer')
  cerrar()
}

// ─── Selector de íconos (MDI cargado bajo demanda) ───
const iconDialog = ref(false)
const iconQuery = ref('')
const itemIcono = ref(null)
const todosLosIconos = ref([])
const iconsLoading = ref(false)

async function abrirIconos(item) {
  itemIcono.value = item
  iconDialog.value = true
  if (todosLosIconos.value.length) return
  iconsLoading.value = true
  try {
    const mod = await import('@mdi/js')
    todosLosIconos.value = Object.keys(mod)
      .filter(k => k.startsWith('mdi'))
      .map(k => 'mdi-' + k.slice(3).replace(/([a-z0-9])([A-Z])/g, '$1-$2').toLowerCase())
  } catch (e) {
    console.error('cargar iconos:', e)
  } finally {
    iconsLoading.value = false
  }
}

const iconosFiltrados = computed(() => {
  const q = iconQuery.value.trim().toLowerCase()
  const lista = todosLosIconos.value
  if (!q) return lista.slice(0, 240)
  return lista.filter(n => n.includes(q)).slice(0, 240)
})

function elegirIcono(name) {
  if (itemIcono.value) itemIcono.value.icon = name
  iconDialog.value = false
}
</script>

<style scoped>
.pa-card {
  background: rgb(var(--v-theme-surface));
  border-radius: 16px;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  max-height: 86vh;
}
.pa-head {
  display: flex; align-items: flex-start; justify-content: space-between; gap: 16px;
  padding: 18px 20px 14px;
  border-bottom: 1px solid rgba(var(--v-theme-on-surface), .08);
}
.pa-title { font-size: 15px; font-weight: 800; }
.pa-sub { font-size: 12px; color: rgba(var(--v-theme-on-surface), .55); margin-top: 3px; line-height: 1.4; }
.pa-x {
  border: none; background: transparent; cursor: pointer; border-radius: 8px;
  padding: 4px; color: rgba(var(--v-theme-on-surface), .6);
  transition: background-color 150ms ease-out;
}
.pa-x:hover { background: rgba(var(--v-theme-on-surface), .07); }

.pa-body { padding: 14px 20px; overflow-y: auto; flex: 1; }
.pa-sec { margin-bottom: 18px; }
.pa-sec-label {
  font-size: 10px; font-weight: 800; letter-spacing: 1.1px; text-transform: uppercase;
  color: rgba(var(--v-theme-on-surface), .42); margin-bottom: 8px;
}
.pa-item {
  border: 1px solid rgba(var(--v-theme-on-surface), .08);
  border-radius: 11px; margin-bottom: 7px; padding: 8px 10px;
  transition: opacity 150ms ease-out, border-color 150ms ease-out;
}
.pa-item-off { opacity: .45; }
.pa-row { display: flex; align-items: center; gap: 10px; }
.pa-ord { display: flex; flex-direction: column; gap: 1px; }
.pa-arrow {
  border: none; background: transparent; cursor: pointer; border-radius: 5px;
  color: rgba(var(--v-theme-on-surface), .5); line-height: 0; padding: 1px 2px;
  transition: background-color 150ms ease-out;
}
.pa-arrow:hover:not(:disabled) { background: rgba(var(--v-theme-on-surface), .08); }
.pa-arrow:disabled { opacity: .25; cursor: default; }
.pa-icon-btn {
  width: 36px; height: 36px; border-radius: 10px; flex-shrink: 0;
  display: flex; align-items: center; justify-content: center;
  border: 1px solid rgba(var(--v-theme-on-surface), .12);
  background: rgba(var(--v-theme-on-surface), .04);
  cursor: pointer; transition: border-color 150ms ease-out;
}
.pa-icon-btn:hover { border-color: var(--indigo); }
.pa-txt { flex: 1; min-width: 0; }
.pa-txt-title { font-size: 13px; font-weight: 700; }
.pa-txt-desc {
  font-size: 11px; color: rgba(var(--v-theme-on-surface), .5);
  white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
}
.pa-act {
  border: none; background: transparent; cursor: pointer; border-radius: 8px;
  padding: 6px; color: rgba(var(--v-theme-on-surface), .55); line-height: 0;
  transition: background-color 150ms ease-out, color 150ms ease-out;
}
.pa-act:hover { background: rgba(var(--v-theme-on-surface), .08); color: rgb(var(--v-theme-on-surface)); }

.pa-edit {
  display: flex; flex-direction: column; gap: 10px;
  padding: 12px 2px 4px; margin-top: 8px;
  border-top: 1px dashed rgba(var(--v-theme-on-surface), .12);
}
.pa-reset {
  align-self: flex-start; border: none; background: transparent; cursor: pointer;
  font-size: 11px; font-weight: 600; color: rgba(var(--v-theme-on-surface), .55);
  display: flex; align-items: center; gap: 4px; padding: 3px 6px; border-radius: 6px;
}
.pa-reset:hover { background: rgba(var(--v-theme-on-surface), .07); }

.pa-foot {
  display: flex; align-items: center; justify-content: space-between; gap: 12px;
  padding: 14px 20px; border-top: 1px solid rgba(var(--v-theme-on-surface), .08);
}
.pa-foot-right { display: flex; gap: 8px; }
.pa-btn {
  border: none; cursor: pointer; border-radius: 9px;
  padding: 9px 15px; font-size: 12.5px; font-weight: 700;
  transition: background-color 150ms ease-out, transform 150ms ease-out;
}
.pa-btn:active { transform: scale(.97); }
.pa-btn-ghost { background: transparent; color: rgba(var(--v-theme-on-surface), .65); }
.pa-btn-ghost:hover { background: rgba(var(--v-theme-on-surface), .07); }
.pa-btn-primary { background: var(--indigo); color: white; }
.pa-btn-primary:hover { filter: brightness(1.08); }
.pa-btn-primary:disabled { opacity: .6; cursor: default; }

/* Selector de íconos */
.pa-icon-search { padding: 14px 20px 4px; }
.pa-icon-grid {
  display: grid; grid-template-columns: repeat(auto-fill, minmax(44px, 1fr));
  gap: 6px; padding: 14px 20px 20px; overflow-y: auto;
}
.pa-icon-cell {
  aspect-ratio: 1; border-radius: 9px; cursor: pointer;
  display: flex; align-items: center; justify-content: center;
  border: 1px solid rgba(var(--v-theme-on-surface), .08);
  background: transparent; color: rgba(var(--v-theme-on-surface), .75);
  transition: border-color 150ms ease-out, background-color 150ms ease-out;
}
.pa-icon-cell:hover { border-color: var(--indigo); background: rgba(var(--v-theme-on-surface), .05); }
.pa-icon-cell-sel { border-color: var(--indigo); background: var(--indigo-wash); }
.pa-icon-loading, .pa-icon-empty {
  grid-column: 1 / -1; display: flex; justify-content: center; padding: 24px 0;
  font-size: 12px; color: rgba(var(--v-theme-on-surface), .5);
}
</style>
