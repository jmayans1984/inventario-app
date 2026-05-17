<template>
  <div class="login-page">

    <!-- Panel izquierdo - Branding -->
    <div class="login-brand">
      <div class="brand-content">
        <div class="brand-logo">
          <v-icon size="48" color="white">mdi-chart-donut-variant</v-icon>
        </div>
        <h1 class="brand-title">RestManager Pro</h1>
        <p class="brand-subtitle">Sistema de Gestión Empresarial</p>

        <div class="brand-features">
          <div class="brand-feature" v-for="f in features" :key="f.text">
            <v-icon size="16" color="rgba(255,255,255,0.7)">{{ f.icon }}</v-icon>
            <span>{{ f.text }}</span>
          </div>
        </div>

        <div class="brand-footer">
          <span>Sistema ERP v2.0</span>
        </div>
      </div>
    </div>

    <!-- Panel derecho - Formulario -->
    <div class="login-form-panel">
      <div class="login-form-wrapper">

        <!-- Cabecera -->
        <div class="form-header">
          <h2 class="form-title">Iniciar Sesión</h2>
          <p class="form-subtitle">Ingresa tus credenciales para continuar</p>
        </div>

        <!-- Formulario -->
        <form @submit.prevent="handleLogin" class="login-form">

          <!-- Usuario -->
          <div class="field-group">
            <label class="field-label">USUARIO</label>
            <div class="field-input-wrap">
              <v-icon class="field-icon" size="18">mdi-account-outline</v-icon>
              <input
                v-model="formData.usuario"
                type="text"
                class="field-input"
                placeholder="Nombre de usuario"
                autocomplete="username"
                required
              />
            </div>
          </div>

          <!-- Contraseña -->
          <div class="field-group">
            <label class="field-label">CONTRASEÑA</label>
            <div class="field-input-wrap">
              <v-icon class="field-icon" size="18">mdi-lock-outline</v-icon>
              <input
                v-model="formData.clave"
                :type="showPassword ? 'text' : 'password'"
                class="field-input"
                placeholder="Contraseña"
                autocomplete="current-password"
                required
              />
              <v-icon
                class="field-icon-right"
                size="18"
                @click="showPassword = !showPassword"
              >
                {{ showPassword ? 'mdi-eye-off-outline' : 'mdi-eye-outline' }}
              </v-icon>
            </div>
          </div>

          <!-- Recordar + Versión -->
          <div class="form-options">
            <label class="remember-label">
              <input v-model="rememberUser" type="checkbox" class="remember-check" />
              <span>Recordar usuario</span>
            </label>

            <div class="version-toggle">
              <span :class="['ver-opt', !isModoCompleto ? 'ver-active' : '']">Light</span>
              <div class="toggle-pill" @click="isModoCompleto = !isModoCompleto">
                <div class="toggle-thumb" :class="{ 'toggle-on': isModoCompleto }"></div>
              </div>
              <span :class="['ver-opt', isModoCompleto ? 'ver-active' : '']">Completo</span>
            </div>
          </div>

          <!-- Error -->
          <div v-if="errorMessage" class="error-box">
            <v-icon size="16" color="#ef4444">mdi-alert-circle-outline</v-icon>
            <span>{{ errorMessage }}</span>
          </div>

          <!-- Botón -->
          <button type="submit" class="btn-login" :disabled="isLoading">
            <span v-if="isLoading" class="loading-dots">
              <span></span><span></span><span></span>
            </span>
            <span v-else>Iniciar Sesión</span>
          </button>

        </form>

        <!-- Selector de empresas -->
        <div v-if="showEmpresaSelector" class="empresa-selector">
          <p class="empresa-title">Selecciona tu empresa</p>
          <div
            v-for="emp in empresas"
            :key="emp.empresa"
            class="empresa-option"
            @click="selectEmpresa(emp.empresa, emp.empresa_nombre)"
          >
            <div class="empresa-icon">
              <v-icon size="20" color="#667eea">mdi-building</v-icon>
            </div>
            <div>
              <p class="empresa-name">{{ emp.empresa_nombre }}</p>
              <p class="empresa-nit">NIT: {{ emp.empresa }}</p>
            </div>
            <v-icon size="16" color="#667eea">mdi-chevron-right</v-icon>
          </div>
        </div>

        <!-- Tema -->
        <div class="theme-row">
          <v-icon size="15" color="#94a3b8">{{ isDarkMode ? 'mdi-weather-sunny' : 'mdi-weather-night' }}</v-icon>
          <span class="theme-text" @click="toggleTema">
            {{ isDarkMode ? 'Cambiar a modo claro' : 'Cambiar a modo oscuro' }}
          </span>
        </div>

      </div>
    </div>

  </div>
</template>

<script setup>
import { ref, onMounted, watch } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '../stores/auth'
import { useAppStore } from '../stores/app'
import authService from '../services/auth.service'

const router = useRouter()
const authStore = useAuthStore()
const appStore = useAppStore()

const formData = ref({ usuario: '', clave: '' })
const isModoCompleto = ref(localStorage.getItem('modoApp') === 'completo')
const isDarkMode = ref(appStore.tema === 'dark')
const isLoading = ref(false)
const errorMessage = ref('')
const showEmpresaSelector = ref(false)
const empresas = ref([])
const showPassword = ref(false)
const rememberUser = ref(false)

const features = [
  { icon: 'mdi-shield-check-outline', text: 'Acceso seguro y encriptado' },
  { icon: 'mdi-domain', text: 'Soporte multi-empresa' },
  { icon: 'mdi-chart-line', text: 'Reportes y análisis en tiempo real' },
  { icon: 'mdi-cloud-sync-outline', text: 'Datos sincronizados en la nube' },
]

onMounted(() => {
  // Cargar usuario guardado
  const saved = localStorage.getItem('savedUsuario')
  if (saved) {
    formData.value.usuario = saved
    rememberUser.value = true
  }
})

// Guardar/borrar usuario al cambiar el checkbox
watch(rememberUser, (val) => {
  if (val && formData.value.usuario) {
    localStorage.setItem('savedUsuario', formData.value.usuario)
  } else if (!val) {
    localStorage.removeItem('savedUsuario')
  }
})

const handleLogin = async () => {
  isLoading.value = true
  errorMessage.value = ''

  // Guardar usuario si está marcado
  if (rememberUser.value) {
    localStorage.setItem('savedUsuario', formData.value.usuario)
  }

  try {
    const result = await authService.login(formData.value.usuario, formData.value.clave)

    if (result.success) {
      authStore.setUsuario(result.data)
      const modo = isModoCompleto.value ? 'completo' : 'light'
      authStore.setModoApp(modo)
      localStorage.setItem('modoApp', modo)

      if (result.data.requiere_seleccion && result.data.empresas.length > 1) {
        empresas.value = result.data.empresas
        showEmpresaSelector.value = true
      } else {
        const emp = result.data.empresas[0]
        if (emp) {
          authStore.setEmpresa(emp.empresa, emp.empresa_nombre)
          redirectToMain()
        }
      }
    } else {
      errorMessage.value = result.error || 'Usuario o contraseña incorrectos'
    }
  } catch (e) {
    errorMessage.value = 'Error al conectar con el servidor'
  } finally {
    isLoading.value = false
  }
}

const selectEmpresa = (cod, nombre) => {
  authStore.setEmpresa(cod, nombre)
  redirectToMain()
}

const redirectToMain = () => {
  const modo = localStorage.getItem('modoApp') || 'light'
  if (modo === 'completo') router.push('/')
  else window.location.href = '/principal.html'
}

const toggleTema = () => {
  isDarkMode.value = !isDarkMode.value
  const t = isDarkMode.value ? 'dark' : 'light'
  appStore.setTema(t)
}
</script>

<style scoped>
/* ─── LAYOUT ─── */
.login-page {
  display: flex;
  min-height: 100vh;
  background: #0f172a;
}

/* ─── PANEL IZQUIERDO ─── */
.login-brand {
  width: 420px;
  flex-shrink: 0;
  background: linear-gradient(145deg, #1e3a5f 0%, #0f172a 60%, #1a1040 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
  overflow: hidden;
}

.login-brand::before {
  content: '';
  position: absolute;
  width: 500px;
  height: 500px;
  border-radius: 50%;
  background: radial-gradient(circle, rgba(102,126,234,0.15) 0%, transparent 70%);
  top: -100px;
  left: -100px;
}

.login-brand::after {
  content: '';
  position: absolute;
  width: 300px;
  height: 300px;
  border-radius: 50%;
  background: radial-gradient(circle, rgba(118,75,162,0.12) 0%, transparent 70%);
  bottom: -50px;
  right: -50px;
}

.brand-content {
  padding: 40px;
  position: relative;
  z-index: 1;
}

.brand-logo {
  width: 80px;
  height: 80px;
  background: linear-gradient(135deg, #667eea, #764ba2);
  border-radius: 20px;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 28px;
  box-shadow: 0 20px 40px rgba(102,126,234,0.3);
}

.brand-title {
  font-size: 28px;
  font-weight: 800;
  color: white;
  margin-bottom: 8px;
  letter-spacing: -0.5px;
}

.brand-subtitle {
  font-size: 14px;
  color: rgba(255,255,255,0.5);
  margin-bottom: 48px;
}

.brand-features {
  display: flex;
  flex-direction: column;
  gap: 16px;
  margin-bottom: 60px;
}

.brand-feature {
  display: flex;
  align-items: center;
  gap: 12px;
  color: rgba(255,255,255,0.65);
  font-size: 13px;
}

.brand-footer {
  color: rgba(255,255,255,0.25);
  font-size: 11px;
  letter-spacing: 1px;
  text-transform: uppercase;
}

/* ─── PANEL DERECHO ─── */
.login-form-panel {
  flex: 1;
  background: #f8fafc;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 40px 20px;
}

.login-form-wrapper {
  width: 100%;
  max-width: 400px;
}

.form-header {
  margin-bottom: 36px;
}

.form-title {
  font-size: 26px;
  font-weight: 800;
  color: #0f172a;
  margin-bottom: 6px;
  letter-spacing: -0.5px;
}

.form-subtitle {
  font-size: 13px;
  color: #94a3b8;
}

/* ─── CAMPOS ─── */
.login-form { display: flex; flex-direction: column; gap: 20px; }

.field-group { display: flex; flex-direction: column; gap: 6px; }

.field-label {
  font-size: 10px;
  font-weight: 700;
  letter-spacing: 1.2px;
  color: #64748b;
}

.field-input-wrap {
  display: flex;
  align-items: center;
  gap: 10px;
  background: white;
  border: 1.5px solid #e2e8f0;
  border-radius: 10px;
  padding: 0 14px;
  height: 50px;
  transition: border-color 0.2s;
}

.field-input-wrap:focus-within {
  border-color: #667eea;
  box-shadow: 0 0 0 3px rgba(102,126,234,0.1);
}

.field-icon { color: #94a3b8; flex-shrink: 0; }
.field-icon-right { color: #94a3b8; flex-shrink: 0; cursor: pointer; }
.field-icon-right:hover { color: #667eea; }

.field-input {
  flex: 1;
  border: none;
  outline: none;
  background: transparent;
  font-size: 14px;
  color: #0f172a;
  font-family: 'Inter', sans-serif;
}

.field-input::placeholder { color: #cbd5e1; }

/* ─── OPCIONES ─── */
.form-options {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.remember-label {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 12px;
  color: #64748b;
  cursor: pointer;
  user-select: none;
}

.remember-check {
  width: 15px;
  height: 15px;
  accent-color: #667eea;
  cursor: pointer;
}

.version-toggle {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 11px;
}

.ver-opt { color: #cbd5e1; font-weight: 500; transition: color 0.2s; }
.ver-active { color: #667eea; font-weight: 700; }

.toggle-pill {
  width: 36px;
  height: 20px;
  background: #e2e8f0;
  border-radius: 10px;
  position: relative;
  cursor: pointer;
  transition: background 0.25s;
}

.toggle-thumb {
  position: absolute;
  width: 14px;
  height: 14px;
  background: white;
  border-radius: 50%;
  top: 3px;
  left: 3px;
  transition: transform 0.25s;
  box-shadow: 0 1px 3px rgba(0,0,0,0.2);
}

.toggle-on { transform: translateX(16px); }
.toggle-pill:has(.toggle-on) { background: #667eea; }

/* ─── ERROR ─── */
.error-box {
  display: flex;
  align-items: center;
  gap: 8px;
  background: #fef2f2;
  border: 1px solid #fecaca;
  border-radius: 8px;
  padding: 10px 14px;
  font-size: 12px;
  color: #ef4444;
}

/* ─── BOTÓN ─── */
.btn-login {
  height: 52px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  border: none;
  border-radius: 10px;
  font-size: 14px;
  font-weight: 700;
  letter-spacing: 1px;
  text-transform: uppercase;
  cursor: pointer;
  width: 100%;
  transition: all 0.3s;
  font-family: 'Inter', sans-serif;
  box-shadow: 0 8px 24px rgba(102,126,234,0.35);
}

.btn-login:hover { transform: translateY(-2px); box-shadow: 0 12px 28px rgba(102,126,234,0.45); }
.btn-login:active { transform: translateY(0); }
.btn-login:disabled { opacity: 0.7; cursor: not-allowed; transform: none; }

/* Loading dots */
.loading-dots { display: flex; gap: 4px; justify-content: center; align-items: center; height: 100%; }
.loading-dots span {
  width: 6px; height: 6px; background: white; border-radius: 50%;
  animation: bounce 1.2s infinite;
}
.loading-dots span:nth-child(2) { animation-delay: 0.2s; }
.loading-dots span:nth-child(3) { animation-delay: 0.4s; }

@keyframes bounce {
  0%, 80%, 100% { transform: scale(0.8); opacity: 0.5; }
  40% { transform: scale(1.2); opacity: 1; }
}

/* ─── SELECTOR EMPRESA ─── */
.empresa-selector {
  margin-top: 24px;
  border-top: 1px solid #e2e8f0;
  padding-top: 20px;
}
.empresa-title {
  font-size: 11px;
  font-weight: 700;
  letter-spacing: 1px;
  color: #94a3b8;
  text-transform: uppercase;
  margin-bottom: 12px;
}
.empresa-option {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 14px;
  border: 1.5px solid #e2e8f0;
  border-radius: 10px;
  cursor: pointer;
  margin-bottom: 8px;
  transition: all 0.2s;
}
.empresa-option:hover { border-color: #667eea; background: #f0f4ff; }
.empresa-icon { width: 36px; height: 36px; background: #eef2ff; border-radius: 8px; display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
.empresa-name { font-size: 13px; font-weight: 600; color: #0f172a; }
.empresa-nit { font-size: 11px; color: #94a3b8; }

/* ─── TEMA ─── */
.theme-row {
  display: flex;
  align-items: center;
  gap: 6px;
  margin-top: 28px;
  justify-content: center;
  cursor: pointer;
}
.theme-text { font-size: 12px; color: #94a3b8; }
.theme-text:hover { color: #667eea; }

/* ─── RESPONSIVE ─── */
@media (max-width: 768px) {
  .login-brand { display: none; }
  .login-form-panel { background: #0f172a; }
  .form-title { color: white; }
  .form-subtitle { color: rgba(255,255,255,0.5); }
  .field-label { color: rgba(255,255,255,0.6); }
  .field-input-wrap { background: rgba(255,255,255,0.07); border-color: rgba(255,255,255,0.1); }
  .field-input { color: white; }
  .field-input::placeholder { color: rgba(255,255,255,0.3); }
  .remember-label { color: rgba(255,255,255,0.5); }
}
</style>
