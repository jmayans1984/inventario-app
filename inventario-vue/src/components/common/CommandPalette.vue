<template>
  <v-dialog :model-value="modelValue" max-width="640" scrim="rgba(10,10,15,.55)" @update:model-value="cerrar">
    <div class="cp-card" @keydown.esc="cerrar" @keydown.up.prevent="mover(-1)" @keydown.down.prevent="mover(1)" @keydown.enter.prevent="elegirActivo">
      <div class="cp-input-row">
        <v-icon size="19" color="rgba(var(--v-theme-on-surface),.4)">mdi-magnify</v-icon>
        <input
          ref="inputRef"
          v-model="q"
          class="cp-input"
          type="text"
          placeholder="Buscar proveedores, productos, facturas, pantallas…"
          autocomplete="off"
          @keydown.up.prevent="mover(-1)"
          @keydown.down.prevent="mover(1)"
          @keydown.enter.prevent="elegirActivo"
        />
        <kbd class="cp-kbd">Esc</kbd>
      </div>

      <div class="cp-body">
        <div v-if="loading" class="cp-loading">
          <v-progress-circular indeterminate size="18" width="2" />
        </div>

        <template v-else>
          <div v-if="gruposVisibles.length === 0" class="cp-empty">
            <v-icon size="26" color="rgba(var(--v-theme-on-surface),.25)">mdi-text-search</v-icon>
            <span>Sin resultados para "{{ q }}"</span>
          </div>

          <div v-for="grupo in gruposVisibles" :key="grupo.tipo" class="cp-grupo">
            <div class="cp-grupo-label">{{ grupo.tipo }}</div>
            <button
              v-for="item in grupo.items"
              :key="item._idx"
              class="cp-item"
              :class="item._idx === activo && 'cp-item-activo'"
              @mouseenter="activo = item._idx"
              @click="elegir(item)"
            >
              <v-icon size="17" :color="item._idx === activo ? 'white' : 'rgba(var(--v-theme-on-surface),.55)'">{{ item.icono }}</v-icon>
              <div class="cp-item-txt">
                <div class="cp-item-title">{{ item.titulo }}</div>
                <div v-if="item.subtitulo" class="cp-item-sub">{{ item.subtitulo }}</div>
              </div>
              <v-icon size="15" class="cp-item-arrow" :color="item._idx === activo ? 'white' : 'rgba(var(--v-theme-on-surface),.35)'">mdi-arrow-right</v-icon>
            </button>
          </div>
        </template>
      </div>

      <div class="cp-foot">
        <span><kbd class="cp-kbd">↑↓</kbd> navegar</span>
        <span><kbd class="cp-kbd">Enter</kbd> ir</span>
        <span class="cp-foot-brand">Búsqueda global</span>
      </div>
    </div>
  </v-dialog>
</template>

<script setup>
import { ref, computed, watch, nextTick } from 'vue'
import { useRouter } from 'vue-router'
import { MODULES } from '../../utils/constants'
import { useAuthStore } from '../../stores/auth'
import busquedaGlobalService from '../../services/busqueda-global.service'

const props = defineProps({ modelValue: { type: Boolean, default: false } })
const emit = defineEmits(['update:modelValue'])

const router = useRouter()
const auth = useAuthStore()
const inputRef = ref(null)
const q = ref('')
const activo = ref(0)
const loading = ref(false)
const resultadosApi = ref([])

let debounceTimer = null
let seq = 0

// ─── Pantallas (estático, se filtra al instante) ───
const pantallas = computed(() => {
  const out = []
  for (const mod of MODULES) {
    for (const grupo of mod.children || []) {
      for (const item of grupo.items || []) {
        if (item.hidden) continue
        if (item.requiredTipo && item.requiredTipo !== auth.empresaTipo) continue
        out.push({ titulo: item.name, subtitulo: `${mod.name} · ${grupo.name}`, icono: item.icon, ruta: item.path })
      }
    }
  }
  return out
})

const pantallasFiltradas = computed(() => {
  const term = q.value.trim().toLowerCase()
  if (!term) return []
  return pantallas.value.filter(p => p.titulo.toLowerCase().includes(term)).slice(0, 6)
})

const gruposVisibles = computed(() => {
  let idx = 0
  const grupos = []

  if (pantallasFiltradas.value.length) {
    grupos.push({
      tipo: 'Pantallas',
      items: pantallasFiltradas.value.map(p => ({ ...p, _idx: idx++, _pantalla: true })),
    })
  }

  const porTipo = new Map()
  for (const r of resultadosApi.value) {
    if (!porTipo.has(r.tipo)) porTipo.set(r.tipo, [])
    porTipo.get(r.tipo).push(r)
  }
  for (const [tipo, items] of porTipo) {
    grupos.push({ tipo, items: items.map(r => ({ ...r, _idx: idx++ })) })
  }

  return grupos
})

watch(q, (val) => {
  activo.value = 0
  clearTimeout(debounceTimer)
  const term = val.trim()
  if (term.length < 2) {
    resultadosApi.value = []
    loading.value = false
    return
  }
  loading.value = true
  const miSeq = ++seq
  debounceTimer = setTimeout(async () => {
    try {
      const data = await busquedaGlobalService.buscar(term)
      if (miSeq === seq) resultadosApi.value = data
    } finally {
      if (miSeq === seq) loading.value = false
    }
  }, 250)
})

watch(() => props.modelValue, async (abierto) => {
  if (abierto) {
    q.value = ''
    resultadosApi.value = []
    activo.value = 0
    await nextTick()
    inputRef.value?.focus()
  }
})

function cerrar() {
  emit('update:modelValue', false)
}

function mover(delta) {
  const total = gruposVisibles.value.reduce((s, g) => s + g.items.length, 0)
  if (!total) return
  activo.value = (activo.value + delta + total) % total
}

function elegirActivo() {
  for (const g of gruposVisibles.value) {
    const item = g.items.find(i => i._idx === activo.value)
    if (item) return elegir(item)
  }
}

function elegir(item) {
  if (item._pantalla) {
    router.push(item.ruta)
  } else {
    router.push({ path: item.ruta, query: item.buscar ? { buscar: item.buscar } : {} })
  }
  cerrar()
}
</script>

<style scoped>
.cp-card {
  background: rgb(var(--v-theme-surface));
  border-radius: 16px;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  max-height: 70vh;
  box-shadow: 0 20px 60px rgba(0,0,0,.35);
}
.cp-input-row {
  display: flex; align-items: center; gap: 10px;
  padding: 14px 16px;
  border-bottom: 1px solid rgba(var(--v-theme-on-surface), .08);
}
.cp-input {
  flex: 1; border: none; outline: none; background: transparent;
  font-size: 15px; color: rgb(var(--v-theme-on-surface));
}
.cp-input::placeholder { color: rgba(var(--v-theme-on-surface), .4); }
.cp-kbd {
  font-family: var(--font-mono, monospace); font-size: 10.5px; font-weight: 600;
  color: rgba(var(--v-theme-on-surface), .5);
  background: rgba(var(--v-theme-on-surface), .07);
  border: 1px solid rgba(var(--v-theme-on-surface), .1);
  border-radius: 5px; padding: 2px 6px;
}

.cp-body { overflow-y: auto; padding: 8px; min-height: 80px; }
.cp-loading { display: flex; justify-content: center; padding: 26px 0; }
.cp-empty {
  display: flex; flex-direction: column; align-items: center; gap: 8px;
  padding: 30px 0; font-size: 13px; color: rgba(var(--v-theme-on-surface), .5);
}

.cp-grupo { margin-bottom: 6px; }
.cp-grupo-label {
  font-size: 10px; font-weight: 800; letter-spacing: 1px; text-transform: uppercase;
  color: rgba(var(--v-theme-on-surface), .4);
  padding: 8px 10px 4px;
}
.cp-item {
  width: 100%; display: flex; align-items: center; gap: 11px;
  padding: 9px 10px; border-radius: 10px; border: none; background: transparent;
  cursor: pointer; text-align: left;
  transition: background-color 120ms var(--ease-out, ease-out);
}
.cp-item-activo { background: var(--indigo); }
.cp-item-activo .cp-item-title, .cp-item-activo .cp-item-sub { color: white; }
.cp-item-txt { flex: 1; min-width: 0; }
.cp-item-title { font-size: 13px; font-weight: 600; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.cp-item-sub { font-size: 11px; color: rgba(var(--v-theme-on-surface), .5); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; margin-top: 1px; }
.cp-item-arrow { flex-shrink: 0; opacity: 0; transition: opacity 120ms ease-out; }
.cp-item-activo .cp-item-arrow { opacity: 1; }

.cp-foot {
  display: flex; align-items: center; gap: 14px;
  padding: 9px 16px; border-top: 1px solid rgba(var(--v-theme-on-surface), .08);
  font-size: 11px; color: rgba(var(--v-theme-on-surface), .45);
}
.cp-foot span { display: flex; align-items: center; gap: 5px; }
.cp-foot-brand { margin-left: auto; font-weight: 700; }

@media (prefers-reduced-motion: reduce) {
  .cp-item { transition: none; }
}
</style>
