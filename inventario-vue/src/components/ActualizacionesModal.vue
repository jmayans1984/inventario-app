<template>
  <v-dialog v-model="mostrar" max-width="650px">
    <v-card class="rounded-lg">
      <!-- Header Moderno -->
      <div class="header-gradient pa-6 text-white">
        <div class="d-flex align-center gap-3">
          <div class="header-icon">
            <v-icon size="32">mdi-rocket-launch</v-icon>
          </div>
          <div>
            <div class="text-h5 font-weight-700">Actualizaciones</div>
            <div class="text-caption opacity-75">Novedades del sistema</div>
          </div>
        </div>
      </div>

      <!-- Contenido -->
      <v-card-text class="updates-container pa-6">
        <div v-if="cargando" class="text-center py-12">
          <v-progress-circular indeterminate color="primary" size="48" />
          <div class="mt-4 text-secondary">Cargando actualizaciones...</div>
        </div>

        <div v-else-if="actualizaciones.length === 0" class="text-center py-12">
          <div class="empty-icon">✨</div>
          <div class="text-h6 font-weight-600 mt-3">Sin actualizaciones</div>
          <div class="text-secondary text-sm">Todo está al día</div>
        </div>

        <div v-else class="actualizaciones-list">
          <div
            v-for="(act, idx) in actualizaciones"
            :key="act.id"
            class="update-card"
            :class="{ 'mb-3': idx < actualizaciones.length - 1 }"
          >
            <div class="update-card-inner">
              <div class="update-badge">
                <v-icon size="20">mdi-star</v-icon>
              </div>

              <div class="update-content">
                <div class="d-flex justify-space-between align-start">
                  <h3 class="update-title">{{ act.titulo }}</h3>
                  <span class="update-time">{{ formatFecha(act.fecha_creacion) }}</span>
                </div>

                <!-- El aviso viene con formato. Se pasa SIEMPRE por el
                     sanitizador antes de pintarlo: v-html con contenido de la
                     base sin filtrar sería una vía de inyección hacia el panel
                     de todos los usuarios. -->
                <div class="update-description aviso-fmt" v-html="limpio(act.mensaje)"></div>
              </div>
            </div>
          </div>
        </div>
      </v-card-text>

      <!-- Footer -->
      <v-divider />
      <v-card-actions class="pa-4">
        <v-spacer />
        <v-btn
          variant="elevated"
          color="primary"
          @click="cerrar"
          class="px-6"
        >
          Cerrar
        </v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<script setup>
import { sanitizarHtml } from '../utils/sanitizarHtml.js'
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

// Los avisos se guardan con formato; se limpian aquí antes de mostrarlos.
const limpio = (html) => sanitizarHtml(html)

</script>

<style scoped>
.header-gradient {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 50%, #f093fb 100%);
  border-radius: 8px 8px 0 0;
}

.header-icon {
  width: 56px;
  height: 56px;
  background: rgba(255, 255, 255, 0.15);
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  backdrop-filter: blur(10px);
}

.updates-container {
  background: #f8f9fa;
  min-height: 300px;
}

.actualizaciones-list {
  max-height: 450px;
  overflow-y: auto;
  padding-right: 4px;
}

.actualizaciones-list::-webkit-scrollbar {
  width: 6px;
}

.actualizaciones-list::-webkit-scrollbar-track {
  background: transparent;
}

.actualizaciones-list::-webkit-scrollbar-thumb {
  background: #d0d0d0;
  border-radius: 3px;
}

.actualizaciones-list::-webkit-scrollbar-thumb:hover {
  background: #999;
}

.update-card {
  background: white;
  border-radius: 12px;
  overflow: hidden;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  border: 1px solid #e8e8f0;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04);
}

.update-card:hover {
  box-shadow: 0 8px 24px rgba(102, 126, 234, 0.12);
  transform: translateY(-2px);
  border-color: #667eea;
}

.update-card-inner {
  padding: 16px;
  display: flex;
  gap: 12px;
}

.update-badge {
  width: 40px;
  height: 40px;
  background: linear-gradient(135deg, #667eea, #764ba2);
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  flex-shrink: 0;
}

.update-content {
  flex: 1;
  min-width: 0;
}

.update-title {
  font-size: 0.95rem;
  font-weight: 600;
  color: #1a1a2e;
  margin: 0;
  margin-bottom: 6px;
  line-height: 1.4;
}

.update-description {
  color: rgba(var(--v-theme-on-surface), .72);
  font-size: 0.85rem;
  line-height: 1.6;
  /* Antes era pre-wrap porque el aviso era texto plano y los saltos de linea
     venian del propio texto. Ahora trae formato: los saltos los dan <p> y
     <br>, y mantener pre-wrap agregaria espacios en blanco de sobra. */
  white-space: normal;
  word-break: break-word;
  margin: 0;
}

.update-time {
  font-size: 0.75rem;
  color: #9ca3af;
  white-space: nowrap;
  margin-left: 12px;
  font-weight: 500;
}

.empty-icon {
  font-size: 48px;
}

.opacity-75 {
  opacity: 0.75;
}

.gap-3 {
  gap: 12px;
}

.text-sm {
  font-size: 0.875rem;
}

/* Animación de entrada */
.update-card {
  animation: slideIn 0.3s ease-out;
}

@keyframes slideIn {
  from {
    opacity: 0;
    transform: translateY(8px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

/* Responsive */
@media (max-width: 600px) {
  .update-card-inner {
    padding: 12px;
  }

  .update-title {
    font-size: 0.9rem;
  }

  .update-description {
    font-size: 0.8rem;
  }
}
</style>
