<template>
  <MainLayout>
    <div class="bodega-container">

      <!-- BREADCRUMB -->
      <div class="bodega-breadcrumb">
        <span class="bc-root">CONFIGURACIÓN</span>
        <v-icon size="13" class="bc-sep">mdi-chevron-right</v-icon>
        <span class="bc-current">Bodega Maestra</span>
      </div>

      <!-- HEADER -->
      <div class="bodega-header">
        <div class="bodega-header-left">
          <div class="bodega-icon-wrap">
            <v-icon size="22" color="white">mdi-warehouse</v-icon>
          </div>
          <div>
            <h1 class="bodega-title">BODEGA MAESTRA / PROVEEDURÍA</h1>
            <p class="bodega-sub">Designa qué bodega es la principal para control de stock y operaciones críticas</p>
          </div>
        </div>
      </div>

      <!-- CONTENIDO -->
      <div class="bodega-content">
        <v-card class="bodega-card">
          <v-card-text class="pt-8">
            <div v-if="loading" class="bodega-loading">
              <v-progress-circular indeterminate color="#0891b2" size="36" />
              <p>Cargando información...</p>
            </div>

            <template v-else>
              <div class="info-section">
                <div class="info-title">Información de tu Empresa</div>
                <div class="info-box">
                  <div class="info-row">
                    <span class="label">Código de Empresa:</span>
                    <span class="value">{{ empresaCodigo }}</span>
                  </div>
                  <div class="info-row">
                    <span class="label">Nombre:</span>
                    <span class="value">{{ empresaNombre }}</span>
                  </div>
                </div>
              </div>

              <div class="bodega-section">
                <div class="section-title">
                  <v-icon size="20" color="#0891b2">mdi-warehouse-box</v-icon>
                  <span>Designar Bodega Maestra</span>
                </div>

                <div class="bodega-description">
                  <p>
                    La <strong>Bodega Maestra</strong> es la bodega principal de tu operación. Esta designación es importante para:
                  </p>
                  <ul>
                    <li>Control centralizado de stock mínimo y alertas de inventario</li>
                    <li>Operaciones críticas del sistema</li>
                    <li>Reportes y análisis de inventario</li>
                  </ul>
                </div>

                <div class="toggle-wrapper">
                  <div class="toggle-info">
                    <span class="toggle-label">Esta bodega es la bodega maestra</span>
                    <span v-if="bodegaMaestra === 'SI'" class="status-active">
                      <v-icon size="16">mdi-check-circle</v-icon> Activo
                    </span>
                    <span v-else class="status-inactive">
                      <v-icon size="16">mdi-alert-circle</v-icon> Inactivo
                    </span>
                  </div>

                  <v-switch
                    :model-value="bodegaMaestra === 'SI'"
                    color="#0891b2"
                    size="large"
                    @update:model-value="cambiarBodegaMaestra"
                    :loading="actualizando"
                  />
                </div>
              </div>

              <div class="warning-box" v-if="bodegaMaestra === 'SI'">
                <v-icon size="18" color="#0891b2">mdi-information-outline</v-icon>
                <div>
                  <strong>Bodega Maestra Activa</strong>
                  <p>Esta bodega es tu bodega principal. Los controles de stock mínimo y alertas de inventario se aplicarán a esta bodega.</p>
                </div>
              </div>

              <div v-if="error" class="error-box">
                <v-icon size="18" color="#ef4444">mdi-alert-circle</v-icon>
                <span>{{ error }}</span>
              </div>

              <div v-if="success" class="success-box">
                <v-icon size="18" color="#10b981">mdi-check-circle</v-icon>
                <span>{{ success }}</span>
              </div>
            </template>
          </v-card-text>
        </v-card>
      </div>

      <!-- SNACKBAR -->
      <v-snackbar v-model="snack.show" :color="snack.color" :timeout="3000" location="bottom right">
        {{ snack.msg }}
      </v-snackbar>

    </div>
  </MainLayout>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import MainLayout from '../components/layouts/MainLayout.vue'
import { useAuthStore } from '../stores/auth'
import { bodegaMaestraService } from '../services/bodega-maestra.service'

const authStore = useAuthStore()
const loading = ref(false)
const actualizando = ref(false)
const error = ref('')
const success = ref('')

const empresaCodigo = ref('')
const empresaNombre = ref('')
const bodegaMaestra = ref('NO')

const snack = ref({ show: false, msg: '', color: 'success' })

async function cargar() {
  loading.value = true
  error.value = ''
  try {
    empresaCodigo.value = authStore.empresa
    empresaNombre.value = authStore.empresaNombre

    const res = await bodegaMaestraService.obtenerBodegaMaestra()
    bodegaMaestra.value = res.data.bodega_maestra
  } catch (e) {
    console.error('Error cargando:', e)
    error.value = 'Error al cargar información de bodega maestra'
  } finally {
    loading.value = false
  }
}

async function cambiarBodegaMaestra(valor) {
  actualizando.value = true
  error.value = ''
  success.value = ''

  try {
    const nuevoValor = valor ? 'SI' : 'NO'
    const res = await bodegaMaestraService.actualizarBodegaMaestra(nuevoValor)
    bodegaMaestra.value = res.data.bodega_maestra

    if (valor) {
      success.value = '✓ Bodega Maestra activada correctamente'
    } else {
      success.value = '✓ Bodega Maestra desactivada'
    }

    mostrarSnack(success.value, 'success')
  } catch (e) {
    console.error('Error actualizando:', e)
    error.value = e.response?.data?.error || 'Error al actualizar bodega maestra'
    mostrarSnack(error.value, 'error')
    // Revertir cambio
    bodegaMaestra.value = bodegaMaestra.value === 'SI' ? 'NO' : 'SI'
  } finally {
    actualizando.value = false
  }
}

function mostrarSnack(msg, color = 'success') {
  snack.value = { show: true, msg, color }
}

onMounted(cargar)
</script>

<style scoped>
.bodega-container { padding: 24px; max-width: 900px; margin: 0 auto; }

.bodega-breadcrumb { display: flex; align-items: center; gap: 6px; margin-bottom: 20px; }
.bc-root { font-size: 12px; font-weight: 700; color: #06b6d4; text-transform: uppercase; letter-spacing: .5px; }
.bc-sep { color: rgba(var(--v-theme-on-surface),.3); }
.bc-current { font-size: 12px; color: rgba(var(--v-theme-on-surface),.8); font-weight: 500; }

.bodega-header { display: flex; align-items: center; gap: 16px; margin-bottom: 24px; }
.bodega-header-left { display: flex; align-items: center; gap: 16px; }
.bodega-icon-wrap { width: 48px; height: 48px; border-radius: 12px; background: linear-gradient(135deg,#0891b2,#06b6d4); display: flex; align-items: center; justify-content: center; box-shadow: 0 4px 14px rgba(8,145,178,.35); }
.bodega-title { font-size: 20px; font-weight: 800; letter-spacing: .5px; margin: 0; }
.bodega-sub { font-size: 12px; color: rgba(var(--v-theme-on-surface),.5); margin: 2px 0 0; }

.bodega-content { margin-bottom: 24px; }
.bodega-card { border-radius: 12px; box-shadow: 0 2px 8px rgba(0,0,0,.06); }
.bodega-loading { text-align: center; padding: 40px 20px; }

.info-section { margin-bottom: 32px; }
.info-title { font-size: 14px; font-weight: 700; color: rgba(var(--v-theme-on-surface),.7); text-transform: uppercase; letter-spacing: .4px; margin-bottom: 12px; }
.info-box { background: rgba(var(--v-theme-on-surface),.03); padding: 16px; border-radius: 8px; border-left: 3px solid #0891b2; }
.info-row { display: flex; justify-content: space-between; padding: 8px 0; }
.info-row .label { font-weight: 600; color: rgba(var(--v-theme-on-surface),.6); }
.info-row .value { color: rgb(var(--v-theme-on-surface)); font-weight: 500; }

.bodega-section { margin-bottom: 32px; }
.section-title { display: flex; align-items: center; gap: 8px; font-size: 16px; font-weight: 700; color: rgb(var(--v-theme-on-surface)); margin-bottom: 16px; }

.bodega-description { margin-bottom: 20px; }
.bodega-description p { font-size: 13px; color: rgba(var(--v-theme-on-surface),.7); margin-bottom: 8px; }
.bodega-description ul { margin: 8px 0 0 20px; padding: 0; }
.bodega-description li { font-size: 13px; color: rgba(var(--v-theme-on-surface),.7); margin: 4px 0; }

.toggle-wrapper {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px;
  background: rgba(8,145,178,.08);
  border-radius: 8px;
  border: 1px solid rgba(8,145,178,.2);
}

.toggle-info { display: flex; align-items: center; gap: 12px; }
.toggle-label { font-weight: 600; color: rgb(var(--v-theme-on-surface)); }
.status-active { font-size: 12px; color: #10b981; display: flex; align-items: center; gap: 4px; }
.status-inactive { font-size: 12px; color: #f59e0b; display: flex; align-items: center; gap: 4px; }

.warning-box {
  display: flex;
  gap: 12px;
  padding: 12px 16px;
  background: rgba(8,145,178,.08);
  border-left: 3px solid #0891b2;
  border-radius: 6px;
  margin-top: 16px;
}

.warning-box strong { color: #0891b2; display: block; margin-bottom: 4px; }
.warning-box p { font-size: 12px; color: rgba(var(--v-theme-on-surface),.6); margin: 0; }

.error-box {
  display: flex;
  gap: 10px;
  padding: 10px 14px;
  background: rgba(239,68,68,.08);
  border-left: 3px solid #ef4444;
  border-radius: 6px;
  color: #ef4444;
  font-size: 13px;
  margin-top: 16px;
}

.success-box {
  display: flex;
  gap: 10px;
  padding: 10px 14px;
  background: rgba(16,185,129,.08);
  border-left: 3px solid #10b981;
  border-radius: 6px;
  color: #10b981;
  font-size: 13px;
  margin-top: 16px;
}
</style>
