<template>
  <div class="mk-screen">
    <div class="mk-card">
      <div class="mk-logo">
        <v-icon size="26" color="white">mdi-nfc-variant</v-icon>
      </div>

      <!-- CARGANDO ESTADO INICIAL -->
      <div v-if="cargando" class="mk-loading">
        <v-progress-circular indeterminate color="white" size="28" />
      </div>

      <!-- SIN CONTEXTO DE TAG (no vino de un tap) -->
      <template v-else-if="!punto && !enrolado">
        <div class="mk-title">Control de Asistencia</div>
        <p class="mk-msg">Para marcar, acerca tu celular al tag NFC de tu punto de trabajo.</p>
      </template>

      <!-- ENROLAMIENTO: primera vez que este celular se usa -->
      <template v-else-if="!enrolado">
        <div class="mk-title">Primera vez aquí</div>
        <p class="mk-msg">Escribe tu código de empleado y el PIN que te dio tu supervisor.</p>
        <input v-model="enrolCodigo" inputmode="numeric" placeholder="Código de empleado" class="mk-input" />
        <input v-model="enrolPin" inputmode="numeric" maxlength="6" placeholder="PIN (6 dígitos)" class="mk-input" />
        <div v-if="enrolError" class="mk-error">{{ enrolError }}</div>
        <button class="mk-btn" :disabled="enrolando" @click="enrolar">
          <v-progress-circular v-if="enrolando" indeterminate size="18" width="2" color="white" />
          <span v-else>Vincular este celular</span>
        </button>
      </template>

      <!-- YA ENROLADO PERO SIN HABER TOCADO UN TAG TODAVÍA -->
      <template v-else-if="!punto">
        <div class="mk-title">Hola, {{ empleado.nombre }}</div>
        <p class="mk-msg">Acerca el celular al tag de tu punto de trabajo para marcar {{ estadoActual === 'DENTRO' ? 'salida' : 'entrada' }}.</p>
      </template>

      <!-- PANTALLA DE MARCAJE -->
      <template v-else-if="!resultado">
        <div class="mk-title">Hola, {{ empleado.nombre }}</div>
        <div class="mk-estado-pill" :class="estadoActual === 'DENTRO' ? 'pill-dentro' : 'pill-fuera'">
          {{ estadoActual === 'DENTRO' ? 'Estás dentro del turno' : 'Estás fuera del turno' }}
        </div>

        <div v-if="!requierePin">
          <button class="mk-btn mk-btn-grande" :class="estadoActual === 'DENTRO' ? 'btn-salida' : 'btn-entrada'"
                  :disabled="marcando" @click="marcar()">
            <v-progress-circular v-if="marcando" indeterminate size="20" width="2" color="white" />
            <span v-else>{{ estadoActual === 'DENTRO' ? 'MARCAR SALIDA' : 'MARCAR ENTRADA' }}</span>
          </button>
        </div>

        <div v-else class="mk-desafio">
          <p class="mk-msg mk-msg-warn">
            <v-icon size="16" color="#facc15">mdi-alert-outline</v-icon>
            Este marcaje necesita tu PIN para confirmarse.
          </p>
          <input v-model="desafioPin" inputmode="numeric" maxlength="6" placeholder="Tu PIN" class="mk-input" />
          <button class="mk-btn" :disabled="marcando" @click="marcar(desafioPin)">
            <v-progress-circular v-if="marcando" indeterminate size="18" width="2" color="white" />
            <span v-else>Confirmar con PIN</span>
          </button>
          <button class="mk-btn-texto" :disabled="marcando" @click="marcar(null, true)">
            No tengo mi PIN, marcar igual
          </button>
        </div>

        <div v-if="marcarError" class="mk-error">{{ marcarError }}</div>
      </template>

      <!-- CONFIRMACIÓN -->
      <template v-else>
        <div class="mk-check">
          <v-icon size="48" :color="resultado.estado === 'VALIDO' ? '#4ade80' : '#facc15'">
            {{ resultado.estado === 'VALIDO' ? 'mdi-check-circle-outline' : 'mdi-alert-circle-outline' }}
          </v-icon>
        </div>
        <div class="mk-title">{{ resultado.tipo === 'ENTRADA' ? 'Entrada registrada' : 'Salida registrada' }}</div>
        <p class="mk-msg">{{ horaResultado }}</p>
        <p v-if="resultado.estado !== 'VALIDO'" class="mk-msg mk-msg-warn">
          Quedó marcado como sospechoso; tu supervisor lo revisará.
        </p>
      </template>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, computed, watch } from 'vue'
import { useRoute } from 'vue-router'
import axios from 'axios'

const API_BASE = import.meta.env.PROD
  ? 'https://inventario-app-production-e8c8.up.railway.app/api'
  : '/api'

const route = useRoute()
const cargando = ref(true)
// computed, no ref: si el navegador reutiliza la pestaña al volver a tocar el
// tag (navegación de solo-fragmento), route.query.punto cambia sin remontar
// el componente — un ref leído una sola vez se quedaría con el valor viejo.
const punto = computed(() => route.query.punto || null)
const enrolado = ref(false)
const empleado = ref({})
const estadoActual = ref('FUERA')

const enrolCodigo = ref('')
const enrolPin = ref('')
const enrolError = ref('')
const enrolando = ref(false)

const requierePin = ref(false)
const desafioPin = ref('')
const marcando = ref(false)
const marcarError = ref('')
const resultado = ref(null)

function tokenGuardado() {
  return localStorage.getItem('asistencia_dispositivo_token') || ''
}

function headerToken() {
  const t = tokenGuardado()
  return t ? { 'X-Dispositivo-Token': t } : {}
}

async function cargarEstado() {
  try {
    const r = await axios.get(`${API_BASE}/asistencia/estado`, { headers: headerToken() })
    const d = r.data?.data
    if (d?.enrolado) {
      enrolado.value = true
      empleado.value = d.empleado
      estadoActual.value = d.estadoActual
    } else {
      enrolado.value = false
    }
  } catch (e) {
    enrolado.value = false
  } finally {
    cargando.value = false
  }
}

async function enrolar() {
  enrolError.value = ''
  if (!enrolCodigo.value || !enrolPin.value) {
    enrolError.value = 'Escribe tu código y tu PIN'
    return
  }
  enrolando.value = true
  try {
    const r = await axios.post(`${API_BASE}/asistencia/enrolar`, {
      empleado_id: enrolCodigo.value,
      pin: enrolPin.value,
    })
    const { token, empleado: emp } = r.data.data
    localStorage.setItem('asistencia_dispositivo_token', token)
    enrolado.value = true
    empleado.value = emp
    await cargarEstado()
  } catch (e) {
    enrolError.value = e?.response?.data?.error || 'No se pudo vincular. Intenta de nuevo.'
  } finally {
    enrolando.value = false
  }
}

async function marcar(pin = null, forzar = false) {
  marcarError.value = ''
  marcando.value = true
  try {
    const r = await axios.post(`${API_BASE}/asistencia/marcar`,
      { punto: punto.value, pin, forzar },
      { headers: headerToken() })
    const d = r.data.data
    if (d.requierePin) {
      requierePin.value = true
    } else {
      resultado.value = d
    }
  } catch (e) {
    marcarError.value = e?.response?.data?.error || 'No se pudo registrar el marcaje.'
  } finally {
    marcando.value = false
  }
}

const horaResultado = computed(() => {
  if (!resultado.value?.momento) return ''
  return new Date(resultado.value.momento).toLocaleString('es-US', {
    weekday: 'long', hour: '2-digit', minute: '2-digit',
  })
})

// Si se vuelve a tocar el tag en la misma pestaña (punto cambia sin recargar
// la página), se limpia el resultado anterior para que aparezca el botón de
// marcar de nuevo en vez de quedar congelado en la confirmación previa.
watch(punto, () => {
  resultado.value = null
  requierePin.value = false
  desafioPin.value = ''
  marcarError.value = ''
})

onMounted(cargarEstado)
</script>

<style scoped>
.mk-screen {
  min-height: 100vh;
  display: flex; align-items: center; justify-content: center;
  padding: 24px;
  background: radial-gradient(circle at 30% 20%, #312e81 0%, #0f0f23 60%);
}
.mk-card {
  width: 100%; max-width: 380px;
  display: flex; flex-direction: column; align-items: center; gap: 14px;
  text-align: center;
  padding: 36px 28px;
  background: rgba(255,255,255,0.04);
  border: 1px solid rgba(255,255,255,0.1);
  border-radius: 20px;
  backdrop-filter: blur(12px);
}
.mk-logo {
  width: 52px; height: 52px; border-radius: 16px;
  background: linear-gradient(135deg, #4f46e5, #6366f1);
  display: flex; align-items: center; justify-content: center;
  margin-bottom: 4px;
}
.mk-loading { padding: 20px 0; }
.mk-title { font-size: 19px; font-weight: 800; color: #fff; letter-spacing: -0.3px; }
.mk-msg { font-size: 13px; color: rgba(255,255,255,0.6); line-height: 1.5; margin: 0; }
.mk-msg-warn { color: #facc15; display: flex; align-items: center; gap: 6px; justify-content: center; }
.mk-error { font-size: 12px; color: #f87171; font-weight: 600; }

.mk-input {
  width: 100%; height: 46px; padding: 0 14px; border-radius: 10px;
  border: 1px solid rgba(255,255,255,0.15);
  background: rgba(255,255,255,0.06);
  color: #fff; font-size: 16px; text-align: center;
  letter-spacing: 1px;
  outline: none;
}
.mk-input:focus { border-color: #6366f1; background: rgba(255,255,255,0.09); }
.mk-input::placeholder { color: rgba(255,255,255,0.35); }

.mk-btn {
  width: 100%; height: 46px; border: none; border-radius: 10px;
  background: linear-gradient(135deg, #4f46e5, #6366f1);
  color: #fff; font-size: 14px; font-weight: 700;
  display: flex; align-items: center; justify-content: center; gap: 8px;
  cursor: pointer; transition: transform 0.15s, opacity 0.15s;
}
.mk-btn:active { transform: scale(0.97); }
.mk-btn:disabled { opacity: 0.6; cursor: default; }

.mk-btn-grande { height: 96px; border-radius: 18px; font-size: 17px; letter-spacing: 0.5px; }
.btn-entrada { background: linear-gradient(135deg, #16a34a, #22c55e); }
.btn-salida { background: linear-gradient(135deg, #dc2626, #ef4444); }

.mk-btn-texto {
  border: none; background: none; color: rgba(255,255,255,0.45);
  font-size: 12px; text-decoration: underline; cursor: pointer; padding: 4px;
}

.mk-estado-pill {
  padding: 6px 14px; border-radius: 20px; font-size: 12px; font-weight: 700;
}
.pill-dentro { background: rgba(34,197,94,0.15); color: #4ade80; }
.pill-fuera { background: rgba(255,255,255,0.08); color: rgba(255,255,255,0.5); }

.mk-desafio { display: flex; flex-direction: column; gap: 10px; width: 100%; }
.mk-check { margin: 4px 0; }
</style>
