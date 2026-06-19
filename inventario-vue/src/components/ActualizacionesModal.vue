<template>
  <v-dialog v-model="mostrar" max-width="600px">
    <v-card>
      <v-card-title class="bg-primary text-white">
        <v-icon>mdi-star-circle</v-icon>
        Actualizaciones del Sistema
      </v-card-title>

      <v-card-text class="pa-4">
        <div v-if="cargando" class="text-center py-6">
          <v-progress-circular indeterminate color="primary" />
        </div>

        <div v-else-if="actualizaciones.length === 0" class="text-center py-6 text-secondary">
          No hay actualizaciones disponibles
        </div>

        <div v-else class="actualizaciones-list">
          <div
            v-for="(act, idx) in actualizaciones"
            :key="act.id"
            class="update-item"
            :class="{ 'border-b': idx < actualizaciones.length - 1 }"
          >
            <div class="update-header">
              <div class="update-title">
                <v-icon color="primary" class="mr-2">mdi-bell-circle</v-icon>
                <span class="font-weight-600">{{ act.titulo }}</span>
              </div>
              <div class="update-date text-caption text-secondary">
                {{ formatFecha(act.fecha_creacion) }}
              </div>
            </div>
            <div class="update-description pl-9 mt-2">
              {{ act.mensaje }}
            </div>
          </div>
        </div>
      </v-card-text>

      <v-card-actions class="pa-4">
        <v-spacer />
        <v-btn variant="text" @click="cerrar">Cerrar</v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<script setup>
import { ref, watch, defineProps, defineEmits } from 'vue'
import { notificacionesService } from '../services/notificaciones.service'

const props = defineProps({
  mostrar: {
    type: Boolean,
    required: true
  }
})

const emit = defineEmits(['update:mostrar'])

const cargando = ref(false)
const actualizaciones = ref([])

const mostrar = ref(props.mostrar)

watch(() => props.mostrar, (newVal) => {
  mostrar.value = newVal
  if (newVal) {
    cargarActualizaciones()
  }
})

watch(mostrar, (newVal) => {
  emit('update:mostrar', newVal)
})

async function cargarActualizaciones() {
  cargando.value = true
  try {
    const res = await notificacionesService.obtenerNotificaciones()
    const notificaciones = res.data || []
    if (Array.isArray(notificaciones)) {
      actualizaciones.value = notificaciones
        .filter(n => n.tipo === 'actualizaciones')
        .sort((a, b) => new Date(b.fecha_creacion) - new Date(a.fecha_creacion))
    }
  } catch (e) {
    console.error('Error cargando actualizaciones:', e)
    actualizaciones.value = []
  } finally {
    cargando.value = false
  }
}

function formatFecha(fecha) {
  if (!fecha) return '—'
  const d = new Date(fecha)
  const hoy = new Date()
  const ayer = new Date(hoy)
  ayer.setDate(ayer.getDate() - 1)

  const fechaDate = new Date(d)
  const esHoy = fechaDate.toDateString() === hoy.toDateString()
  const esAyer = fechaDate.toDateString() === ayer.toDateString()

  if (esHoy) {
    return `Hoy ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`
  } else if (esAyer) {
    return `Ayer ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`
  } else {
    return `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}/${d.getFullYear()}`
  }
}

function cerrar() {
  mostrar.value = false
}
</script>

<style scoped>
.actualizaciones-list {
  max-height: 400px;
  overflow-y: auto;
}

.update-item {
  padding: 16px 0;
}

.update-item.border-b {
  border-bottom: 1px solid #eee;
}

.update-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.update-title {
  display: flex;
  align-items: center;
}

.update-description {
  color: #666;
  font-size: 0.9rem;
  line-height: 1.5;
  white-space: pre-wrap;
  word-break: break-word;
}

.bg-primary {
  background: linear-gradient(135deg, #667eea, #764ba2);
}
</style>
