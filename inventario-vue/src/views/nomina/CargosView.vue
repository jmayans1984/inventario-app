<template>
  <MainLayout>
    <div class="nom-wrap">
      <PageHeader
        title="Cargos y Posiciones"
        description="Catálogo de cargos para empleados"
        :crumbs="['Nómina', 'Configuración', 'Cargos']"
      >
        <template #actions>
          <v-btn color="secondary" variant="flat" size="small" prepend-icon="mdi-plus" @click="abrirNuevo">
            Nuevo Cargo
          </v-btn>
        </template>
      </PageHeader>

      <div class="nom-card">
        <table class="nom-table">
          <thead><tr><th>CARGO</th><th>DESCRIPCIÓN</th><th></th></tr></thead>
          <tbody>
            <tr v-if="!cargos.length"><td colspan="3" class="nom-empty">Sin cargos registrados</td></tr>
            <tr v-for="c in cargos" :key="c.id" class="nom-row">
              <td><strong>{{ c.nombre }}</strong></td>
              <td style="font-size:12px;color:rgba(var(--v-theme-on-surface),0.5)">{{ c.descripcion || '—' }}</td>
              <td>
                <v-btn icon="mdi-delete-outline" size="x-small" variant="text" color="error"
                       @click="eliminar(c.id)" />
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <v-dialog v-model="dlg" max-width="400">
      <v-card rounded="lg">
        <v-card-title class="pa-4" style="font-size:15px;font-weight:700">Nuevo Cargo</v-card-title>
        <v-card-text>
          <div class="drw-field"><label>Nombre *</label><input v-model="form.nombre" class="drw-input" /></div>
          <div class="drw-field mt-2"><label>Descripción</label><input v-model="form.descripcion" class="drw-input" /></div>
        </v-card-text>
        <v-card-actions class="pa-4">
          <v-spacer />
          <v-btn variant="text" @click="dlg=false">Cancelar</v-btn>
          <v-btn color="secondary" variant="flat" @click="guardar">Guardar</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </MainLayout>
</template>
<script setup>
import { ref, computed, onMounted } from 'vue'
import MainLayout from '../../components/layouts/MainLayout.vue'
import PageHeader from '../../components/common/PageHeader.vue'
import api from '../../services/api'
import { useAuthStore } from '../../stores/auth'
const authStore = useAuthStore()
const empresa = computed(() => authStore.empresa || authStore.user?.empresa || localStorage.getItem('empresaActual') || '')
const cargos = ref([])
const dlg = ref(false)
const form = ref({ nombre: '', descripcion: '' })

async function cargar() {
  const r = await api.get('/nomina/cargos', { params: { empresa: empresa.value } })
  cargos.value = r.data?.data || []
}
function abrirNuevo() { form.value = { nombre: '', descripcion: '' }; dlg.value = true }
async function guardar() {
  if (!form.value.nombre) return
  await api.post('/nomina/cargos', { ...form.value, empresa: empresa.value })
  dlg.value = false; cargar()
}
async function eliminar(id) {
  await api.delete(`/nomina/cargos/${id}`)
  cargar()
}
onMounted(cargar)
</script>
<style scoped>
.nom-wrap { display: flex; flex-direction: column; gap: 16px; }
.flex-1 { flex: 1; }
.nom-card { background: rgb(var(--v-theme-surface)); border: 1px solid rgba(var(--v-theme-on-surface),0.07); border-radius: 14px; overflow: hidden; }
.nom-table { width: 100%; border-collapse: collapse; font-size: 13px; }
.nom-table thead { background: rgba(var(--v-theme-on-surface),0.04); }
.nom-table th { padding: 10px 14px; text-align: left; font-size: 10px; font-weight: 800; letter-spacing: 0.8px; color: rgba(var(--v-theme-on-surface),0.4); text-transform: uppercase; border-bottom: 1px solid rgba(var(--v-theme-on-surface),0.08); }
.nom-row td { padding: 11px 14px; border-bottom: 1px solid rgba(var(--v-theme-on-surface),0.05); }
.nom-empty { padding: 24px; text-align: center; color: rgba(var(--v-theme-on-surface),0.3); }
.drw-field { display: flex; flex-direction: column; gap: 4px; }
.drw-field label { font-size: 10px; font-weight: 700; color: rgba(var(--v-theme-on-surface),0.5); text-transform: uppercase; }
.drw-input { height: 36px; padding: 0 10px; border-radius: 7px; border: 1px solid rgba(var(--v-theme-on-surface),0.15); background: rgba(var(--v-theme-on-surface),0.03); color: rgb(var(--v-theme-on-surface)); font-size: 13px; outline: none; width: 100%; }
.mt-2 { margin-top: 10px; }
</style>
