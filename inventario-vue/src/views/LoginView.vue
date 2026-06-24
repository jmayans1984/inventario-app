<template>
  <div :class="['login-page', isDarkMode ? 'dark' : 'light']">

    <!-- Panel izquierdo — Branding -->
    <div class="panel-brand">
      <div class="brand-inner">
        <img :src="logoSrc" class="brand-logo" alt="Logo" />
        <h1 class="brand-name">RestManager Pro</h1>
        <p class="brand-tagline">Sistema de Gestión Empresarial</p>

        <div class="brand-pills">
          <div class="pill" v-for="f in features" :key="f.text">
            <v-icon size="14" color="rgba(255,255,255,0.55)">{{ f.icon }}</v-icon>
            <span>{{ f.text }}</span>
          </div>
        </div>

        <div class="brand-ver">v2.0</div>
      </div>
    </div>

    <!-- Panel derecho — Formulario -->
    <div class="panel-form">

      <div class="form-box">

        <!-- Toggle tema -->
        <button class="theme-btn" type="button" @click="toggleTema" :title="isDarkMode ? 'Modo claro' : 'Modo oscuro'">
          <v-icon size="17">{{ isDarkMode ? 'mdi-weather-sunny' : 'mdi-weather-night' }}</v-icon>
        </button>

        <!-- Header -->
        <div class="form-head">
          <div class="form-head-logo">
            <img :src="logoSrc" alt="Logo" />
          </div>
          <h2 class="form-title">Iniciar sesión</h2>
          <p class="form-sub">Ingresa tus credenciales para continuar</p>
        </div>

        <!-- Formulario -->
        <form @submit.prevent="handleLogin">

          <div class="field">
            <label class="field-lbl">USUARIO</label>
            <div class="field-wrap">
              <v-icon class="f-icon" size="17">mdi-account-outline</v-icon>
              <input
                v-model="formData.usuario"
                type="text"
                class="f-input"
                placeholder="Nombre de usuario"
                autocomplete="username"
                required
              />
            </div>
          </div>

          <div class="field">
            <label class="field-lbl">CONTRASEÑA</label>
            <div class="field-wrap">
              <v-icon class="f-icon" size="17">mdi-lock-outline</v-icon>
              <input
                v-model="formData.clave"
                :type="showPassword ? 'text' : 'password'"
                class="f-input"
                placeholder="Contraseña"
                autocomplete="current-password"
                required
              />
              <v-icon class="f-icon-r" size="17" @click="showPassword = !showPassword">
                {{ showPassword ? 'mdi-eye-off-outline' : 'mdi-eye-outline' }}
              </v-icon>
            </div>
          </div>

          <label class="remember">
            <input v-model="rememberUser" type="checkbox" />
            <span>Recordar usuario</span>
          </label>

          <div v-if="errorMessage" class="error-msg">
            <v-icon size="15">mdi-alert-circle-outline</v-icon>
            {{ errorMessage }}
          </div>

          <button type="submit" class="btn-submit" :disabled="isLoading">
            <span v-if="isLoading" class="dots">
              <span></span><span></span><span></span>
            </span>
            <span v-else>Entrar</span>
          </button>

        </form>

        <!-- Selector de empresas -->
        <div v-if="showEmpresaSelector" class="emp-list">
          <p class="emp-title">Selecciona tu empresa</p>
          <div
            v-for="emp in empresas"
            :key="emp.empresa"
            class="emp-item"
            @click="selectEmpresa(emp.empresa, emp.empresa_nombre, emp.tipo)"
          >
            <div class="emp-icon">
              <v-icon size="18">mdi-domain</v-icon>
            </div>
            <div>
              <p class="emp-name">{{ emp.empresa_nombre }}</p>
              <p class="emp-nit">NIT: {{ emp.empresa }}</p>
            </div>
            <v-icon size="16" class="emp-arrow">mdi-chevron-right</v-icon>
          </div>
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
import logoSrc from '../assets/logo.png'

const router    = useRouter()
const authStore = useAuthStore()
const appStore  = useAppStore()

const formData           = ref({ usuario: '', clave: '' })
const isDarkMode         = ref(appStore.tema === 'dark')
const isLoading          = ref(false)
const errorMessage       = ref('')
const showEmpresaSelector= ref(false)
const empresas           = ref([])
const showPassword       = ref(false)
const rememberUser       = ref(false)

const features = [
  { icon: 'mdi-shield-check-outline',  text: 'Acceso seguro y encriptado'       },
  { icon: 'mdi-domain',                text: 'Soporte multi-empresa'             },
  { icon: 'mdi-chart-line',            text: 'Reportes en tiempo real'           },
  { icon: 'mdi-cloud-sync-outline',    text: 'Datos sincronizados en la nube'    },
]

onMounted(() => {
  const saved = localStorage.getItem('savedUsuario')
  if (saved) { formData.value.usuario = saved; rememberUser.value = true }
})

watch(rememberUser, val => {
  if (val && formData.value.usuario) localStorage.setItem('savedUsuario', formData.value.usuario)
  else if (!val) localStorage.removeItem('savedUsuario')
})

const handleLogin = async () => {
  isLoading.value    = true
  errorMessage.value = ''
  if (rememberUser.value) localStorage.setItem('savedUsuario', formData.value.usuario)
  try {
    const result = await authService.login(formData.value.usuario, formData.value.clave)
    if (result.success) {
      authStore.setUsuario(result.data)
      if (result.data.requiere_seleccion && result.data.empresas.length > 1) {
        empresas.value = result.data.empresas; showEmpresaSelector.value = true
      } else {
        const emp = result.data.empresas[0]
        if (emp) { authStore.setEmpresa(emp.empresa, emp.empresa_nombre, emp.tipo); redirectToMain() }
      }
    } else {
      errorMessage.value = result.error || 'Usuario o contraseña incorrectos'
    }
  } catch { errorMessage.value = 'Error al conectar con el servidor' }
  finally  { isLoading.value = false }
}

const selectEmpresa  = (cod, nombre, tipo = null) => { authStore.setEmpresa(cod, nombre, tipo); redirectToMain() }
const redirectToMain = () => router.push('/')
const toggleTema     = () => {
  isDarkMode.value = !isDarkMode.value
  appStore.setTema(isDarkMode.value ? 'dark' : 'light')
}
</script>

<style scoped>
/* ── Variables ─────────────────────────────────────────────── */
.login-page {
  --accent:      #F5A623;
  --accent-text: #111111;

  display: flex;
  min-height: 100vh;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
}

/* Light */
.login-page.light {
  --bg:         #FFFFFF;
  --bg2:        #F5F5F5;
  --text:       #111111;
  --text-muted: #888888;
  --border:     #E5E5E5;
  --input-bg:   #FAFAFA;
  --card-shadow:0 2px 24px rgba(0,0,0,0.08);
}

/* Dark */
.login-page.dark {
  --bg:         #111111;
  --bg2:        #1A1A1A;
  --text:       #F0F0F0;
  --text-muted: #666666;
  --border:     rgba(255,255,255,0.08);
  --input-bg:   #1E1E1E;
  --card-shadow:0 2px 32px rgba(0,0,0,0.5);
}

/* ── Panel izquierdo (siempre oscuro) ──────────────────────── */
.panel-brand {
  width: 400px;
  flex-shrink: 0;
  background: #0D0D0D;
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
  overflow: hidden;
}

/* Halo amarillo de fondo */
.panel-brand::before {
  content: '';
  position: absolute;
  width: 560px;
  height: 560px;
  border-radius: 50%;
  background: radial-gradient(circle, rgba(245,166,35,0.07) 0%, transparent 65%);
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  pointer-events: none;
}

.brand-inner {
  padding: 48px 44px;
  position: relative;
  z-index: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
}

.brand-logo {
  width: 88px;
  height: 88px;
  border-radius: 22px;
  margin-bottom: 22px;
  box-shadow: 0 0 0 1px rgba(245,166,35,0.2),
              0 8px 32px rgba(245,166,35,0.15);
}

.brand-name {
  font-size: 26px;
  font-weight: 800;
  color: #FFFFFF;
  letter-spacing: -0.5px;
  margin-bottom: 6px;
}

.brand-tagline {
  font-size: 13px;
  color: rgba(255,255,255,0.38);
  margin-bottom: 44px;
  letter-spacing: 0.2px;
}

.brand-pills {
  display: flex;
  flex-direction: column;
  gap: 14px;
  margin-bottom: 52px;
}

.pill {
  display: flex;
  align-items: center;
  gap: 11px;
  font-size: 13px;
  color: rgba(255,255,255,0.5);
}

.brand-ver {
  font-size: 10px;
  letter-spacing: 1.5px;
  text-transform: uppercase;
  color: rgba(255,255,255,0.18);
}

/* ── Panel derecho ─────────────────────────────────────────── */
.panel-form {
  flex: 1;
  background: var(--bg);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 40px 24px;
  transition: background 0.25s;
}

.form-box {
  width: 100%;
  max-width: 380px;
  position: relative;
}

/* ── Toggle tema ───────────────────────────────────────────── */
.theme-btn {
  position: absolute;
  top: 0;
  right: 0;
  width: 36px;
  height: 36px;
  border: 1px solid var(--border);
  border-radius: 10px;
  background: var(--bg2);
  color: var(--text-muted);
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s;
}
.theme-btn:hover { border-color: var(--accent); color: var(--accent); }

/* ── Cabecera del form ─────────────────────────────────────── */
.form-head {
  margin-bottom: 36px;
}

.form-head-logo {
  display: none; /* solo visible en móvil */
}

.form-title {
  font-size: 26px;
  font-weight: 800;
  color: var(--text);
  letter-spacing: -0.5px;
  margin-bottom: 6px;
}

.form-sub {
  font-size: 13px;
  color: var(--text-muted);
}

/* ── Campos ────────────────────────────────────────────────── */
.field {
  display: flex;
  flex-direction: column;
  gap: 6px;
  margin-bottom: 18px;
}

.field-lbl {
  font-size: 10px;
  font-weight: 700;
  letter-spacing: 1.3px;
  color: var(--text-muted);
}

.field-wrap {
  display: flex;
  align-items: center;
  gap: 10px;
  background: var(--input-bg);
  border: 1.5px solid var(--border);
  border-radius: 10px;
  padding: 0 14px;
  height: 50px;
  transition: border-color 0.2s, box-shadow 0.2s;
}

.field-wrap:focus-within {
  border-color: var(--accent);
  box-shadow: 0 0 0 3px rgba(245,166,35,0.12);
}

.f-icon   { color: var(--text-muted); flex-shrink: 0; }
.f-icon-r { color: var(--text-muted); flex-shrink: 0; cursor: pointer; }
.f-icon-r:hover { color: var(--accent); }

.f-input {
  flex: 1;
  border: none;
  outline: none;
  background: transparent;
  font-size: 14px;
  color: var(--text);
  font-family: inherit;
}
.f-input::placeholder { color: var(--text-muted); opacity: 0.6; }

/* ── Remember ──────────────────────────────────────────────── */
.remember {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 12px;
  color: var(--text-muted);
  cursor: pointer;
  margin-bottom: 22px;
  user-select: none;
}
.remember input { accent-color: var(--accent); width: 14px; height: 14px; cursor: pointer; }

/* ── Error ─────────────────────────────────────────────────── */
.error-msg {
  display: flex;
  align-items: center;
  gap: 7px;
  background: rgba(239,68,68,0.08);
  border: 1px solid rgba(239,68,68,0.25);
  border-radius: 8px;
  padding: 10px 13px;
  font-size: 12px;
  color: #ef4444;
  margin-bottom: 18px;
}

/* ── Botón ─────────────────────────────────────────────────── */
.btn-submit {
  width: 100%;
  height: 52px;
  background: var(--accent);
  color: var(--accent-text);
  border: none;
  border-radius: 10px;
  font-size: 14px;
  font-weight: 800;
  letter-spacing: 0.8px;
  text-transform: uppercase;
  cursor: pointer;
  font-family: inherit;
  transition: all 0.2s;
  box-shadow: 0 4px 20px rgba(245,166,35,0.3);
}
.btn-submit:hover   { transform: translateY(-2px); box-shadow: 0 8px 28px rgba(245,166,35,0.4); }
.btn-submit:active  { transform: translateY(0); }
.btn-submit:disabled{ opacity: 0.65; cursor: not-allowed; transform: none; }

/* Loading dots */
.dots { display: flex; gap: 4px; justify-content: center; align-items: center; }
.dots span {
  width: 6px; height: 6px; background: var(--accent-text);
  border-radius: 50%; animation: bounce 1.2s infinite;
}
.dots span:nth-child(2) { animation-delay: 0.2s; }
.dots span:nth-child(3) { animation-delay: 0.4s; }

@keyframes bounce {
  0%, 80%, 100% { transform: scale(0.8); opacity: 0.4; }
  40%           { transform: scale(1.2); opacity: 1; }
}

/* ── Selector empresas ─────────────────────────────────────── */
.emp-list {
  margin-top: 24px;
  padding-top: 20px;
  border-top: 1px solid var(--border);
}
.emp-title {
  font-size: 10px;
  font-weight: 700;
  letter-spacing: 1.3px;
  text-transform: uppercase;
  color: var(--text-muted);
  margin-bottom: 12px;
}
.emp-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 14px;
  border: 1.5px solid var(--border);
  border-radius: 10px;
  cursor: pointer;
  margin-bottom: 8px;
  transition: all 0.2s;
  background: var(--bg2);
}
.emp-item:hover { border-color: var(--accent); background: rgba(245,166,35,0.05); }
.emp-icon {
  width: 36px; height: 36px;
  background: rgba(245,166,35,0.1);
  border-radius: 8px;
  display: flex; align-items: center; justify-content: center;
  flex-shrink: 0;
  color: var(--accent);
}
.emp-name  { font-size: 13px; font-weight: 600; color: var(--text); }
.emp-nit   { font-size: 11px; color: var(--text-muted); }
.emp-arrow { color: var(--text-muted); margin-left: auto; }

/* ── Responsive ────────────────────────────────────────────── */
@media (max-width: 768px) {
  .panel-brand { display: none; }

  .panel-form { background: var(--bg); }

  .form-head-logo {
    display: flex;
    justify-content: center;
    margin-bottom: 20px;
  }
  .form-head-logo img {
    width: 72px;
    height: 72px;
    border-radius: 18px;
    box-shadow: 0 4px 20px rgba(245,166,35,0.2);
  }
  .form-title { text-align: center; }
  .form-sub   { text-align: center; }
}
</style>
