<template>
  <div :class="['login-page', isDarkMode ? 'dark' : 'light']">
    <section class="login-stage" aria-label="RestManager Pro">
      <div class="brand-composition">
        <div class="brand-emblem">
          <img :src="logoSrc" class="brand-logo" alt="RestManager Pro" />
        </div>

        <div class="brand-copy">
          <p class="brand-kicker">RestManager Pro</p>
          <h1 class="brand-title">Gestiona tu operación desde un solo lugar.</h1>
          <p class="brand-subtitle">
            Inventario, tesorería, nómina y reportes conectados para trabajar con claridad.
          </p>
        </div>
      </div>

      <div class="module-showcase" aria-hidden="true">
        <div class="module-card module-card--active">
          <v-icon size="20">mdi-view-dashboard-outline</v-icon>
          <span>Gerencia</span>
        </div>
        <div class="module-card">
          <v-icon size="20">mdi-bank-outline</v-icon>
          <span>Tesorería</span>
        </div>
        <div class="module-card">
          <v-icon size="20">mdi-warehouse</v-icon>
          <span>Almacén</span>
        </div>
        <div class="module-card">
          <v-icon size="20">mdi-account-group-outline</v-icon>
          <span>Nómina</span>
        </div>
      </div>

      <div class="stage-footer">
        <div>
          <span class="stage-label">Acceso</span>
          <strong>Seguro</strong>
        </div>
        <div>
          <span class="stage-label">Modo</span>
          <strong>Multiempresa</strong>
        </div>
        <div>
          <span class="stage-label">Version</span>
          <strong>2.0</strong>
        </div>
      </div>
    </section>

    <main class="login-panel">
      <div class="panel-shell">
        <button
          class="theme-btn"
          type="button"
          @click="toggleTema"
          :aria-label="isDarkMode ? 'Cambiar a modo claro' : 'Cambiar a modo oscuro'"
          :title="isDarkMode ? 'Modo claro' : 'Modo oscuro'"
        >
          <v-icon size="18">{{ isDarkMode ? 'mdi-weather-sunny' : 'mdi-weather-night' }}</v-icon>
        </button>

        <div class="mobile-brand">
          <img :src="logoSrc" class="mobile-logo" alt="RestManager Pro" />
          <span>RestManager Pro</span>
        </div>

        <header class="form-head">
          <p class="form-eyebrow">Acceso privado</p>
          <h2 class="form-title">Iniciar sesión</h2>
          <p class="form-sub">Ingresa con tu usuario para continuar.</p>
        </header>

        <form class="login-form" @submit.prevent="handleLogin">
          <div class="field">
            <label class="field-lbl" for="login-usuario">Usuario</label>
            <div class="field-wrap">
              <v-icon class="field-icon" size="18">mdi-account-outline</v-icon>
              <input
                id="login-usuario"
                v-model="formData.usuario"
                type="text"
                class="field-input"
                placeholder="Nombre de usuario"
                autocomplete="username"
                required
              />
            </div>
          </div>

          <div class="field">
            <label class="field-lbl" for="login-clave">Contraseña</label>
            <div class="field-wrap">
              <v-icon class="field-icon" size="18">mdi-lock-outline</v-icon>
              <input
                id="login-clave"
                v-model="formData.clave"
                :type="showPassword ? 'text' : 'password'"
                class="field-input"
                placeholder="Contraseña"
                autocomplete="current-password"
                required
              />
              <button
                class="password-btn"
                type="button"
                :aria-label="showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'"
                @click="showPassword = !showPassword"
              >
                <v-icon size="18">{{ showPassword ? 'mdi-eye-off-outline' : 'mdi-eye-outline' }}</v-icon>
              </button>
            </div>
          </div>

          <div class="form-options">
            <label class="remember">
              <input v-model="rememberUser" type="checkbox" />
              <span>Recordar usuario</span>
            </label>
          </div>

          <div v-if="errorMessage" class="error-msg" role="alert">
            <v-icon size="16">mdi-alert-circle-outline</v-icon>
            <span>{{ errorMessage }}</span>
          </div>

          <button type="submit" class="btn-submit" :disabled="isLoading">
            <span v-if="isLoading" class="loader-line"></span>
            <template v-else>
              <v-icon size="18">mdi-login</v-icon>
              <span>Ingresar</span>
            </template>
          </button>
        </form>

        <section v-if="showEmpresaSelector" class="emp-list" aria-label="Seleccionar empresa">
          <div class="emp-head">
            <p class="emp-title">Selecciona tu empresa</p>
            <span>{{ empresas.length }}</span>
          </div>
          <button
            v-for="emp in empresas"
            :key="emp.empresa"
            class="emp-item"
            type="button"
            @click="selectEmpresa(emp.empresa, emp.empresa_nombre, emp.tipo)"
          >
            <span class="emp-icon">
              <v-icon size="18">mdi-domain</v-icon>
            </span>
            <span class="emp-copy">
              <strong>{{ emp.empresa_nombre }}</strong>
              <small>NIT: {{ emp.empresa }}</small>
            </span>
            <v-icon size="18" class="emp-arrow">mdi-chevron-right</v-icon>
          </button>
        </section>
      </div>
    </main>
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

const formData            = ref({ usuario: '', clave: '' })
const isDarkMode          = ref(appStore.tema === 'dark')
const isLoading           = ref(false)
const errorMessage        = ref('')
const showEmpresaSelector = ref(false)
const empresas            = ref([])
const showPassword        = ref(false)
const rememberUser        = ref(false)

onMounted(() => {
  const saved = localStorage.getItem('savedUsuario')
  if (saved) {
    formData.value.usuario = saved
    rememberUser.value = true
  }
})

watch(rememberUser, val => {
  if (val && formData.value.usuario) localStorage.setItem('savedUsuario', formData.value.usuario)
  else if (!val) localStorage.removeItem('savedUsuario')
})

const handleLogin = async () => {
  isLoading.value = true
  errorMessage.value = ''
  if (rememberUser.value) localStorage.setItem('savedUsuario', formData.value.usuario)

  try {
    const result = await authService.login(formData.value.usuario, formData.value.clave)
    if (result.success) {
      authStore.setUsuario(result.data)
      if (result.data.requiere_seleccion && result.data.empresas.length > 1) {
        empresas.value = result.data.empresas
        showEmpresaSelector.value = true
      } else {
        const emp = result.data.empresas[0]
        if (emp) {
          authStore.setEmpresa(emp.empresa, emp.empresa_nombre, emp.tipo)
          redirectToMain()
        }
      }
    } else {
      errorMessage.value = result.error || 'Usuario o contraseña incorrectos'
    }
  } catch {
    errorMessage.value = 'Error al conectar con el servidor'
  } finally {
    isLoading.value = false
  }
}

const selectEmpresa = (cod, nombre, tipo = null) => {
  authStore.setEmpresa(cod, nombre, tipo)
  redirectToMain()
}

const redirectToMain = () => router.push('/')

const toggleTema = () => {
  isDarkMode.value = !isDarkMode.value
  appStore.setTema(isDarkMode.value ? 'dark' : 'light')
}
</script>

<style scoped>
.login-page {
  --login-accent: #b8720b;
  --login-accent-strong: #8f5708;
  --login-ink: #1b1815;
  --login-muted: #736a5d;
  --login-line: #e7e1d4;
  --login-panel: #fffdfa;
  --login-field: #f7f3eb;
  --login-stage: #17130e;
  --login-stage-soft: #241c12;
  --login-stage-text: #f5f1e8;
  --login-success: #15803d;
  --login-warning: #b45309;

  display: grid;
  grid-template-columns: minmax(420px, 0.95fr) minmax(420px, 1.05fr);
  min-height: 100vh;
  background: var(--login-panel);
  color: var(--login-ink);
  font-family: var(--font-sans);
}

.login-page.dark {
  --login-accent: #f0a83c;
  --login-accent-strong: #f5b85c;
  --login-ink: #f5f1e8;
  --login-muted: #b3aa9a;
  --login-line: #332d24;
  --login-panel: #14120f;
  --login-field: #1d1a15;
  --login-stage: #100e0b;
  --login-stage-soft: #1d1710;
  --login-stage-text: #f5f1e8;
  --login-success: #4ade80;
  --login-warning: #fbbf24;
}

.login-stage {
  position: relative;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  min-height: 100vh;
  padding: 44px;
  overflow: hidden;
  color: var(--login-stage-text);
  background:
    linear-gradient(140deg, rgba(240, 168, 60, 0.13) 0 1px, transparent 1px 100%),
    radial-gradient(circle at 18% 18%, rgba(240, 168, 60, 0.14), transparent 34%),
    linear-gradient(145deg, #120f0b 0%, var(--login-stage) 46%, var(--login-stage-soft) 100%);
  background-size: auto, auto, auto;
}

.login-stage::before {
  content: '';
  position: absolute;
  top: 0;
  bottom: 0;
  right: 74px;
  width: 118px;
  background: linear-gradient(180deg, transparent, rgba(240, 168, 60, 0.28), transparent);
  transform: skewX(-14deg);
  opacity: 0.75;
  pointer-events: none;
}

.login-stage::after {
  content: '';
  position: absolute;
  inset: 28px;
  border: 1px solid rgba(245, 241, 232, 0.07);
  border-radius: 8px;
  pointer-events: none;
}

.brand-composition,
.module-showcase,
.stage-footer {
  position: relative;
  z-index: 1;
}

.brand-composition {
  display: grid;
  align-content: start;
  gap: 28px;
  max-width: 520px;
  animation: login-enter var(--dur-slow) var(--ease-out) both;
}

.brand-emblem {
  display: inline-grid;
  place-items: center;
  width: 104px;
  height: 104px;
  border-radius: 8px;
  background:
    linear-gradient(145deg, rgba(245, 241, 232, 0.13), rgba(245, 241, 232, 0.03));
  box-shadow:
    inset 0 0 0 1px rgba(245, 241, 232, 0.12),
    0 24px 54px rgba(0, 0, 0, 0.30);
}

.brand-logo {
  width: 76px;
  height: 76px;
  border-radius: 8px;
  object-fit: cover;
  box-shadow: 0 0 0 1px rgba(245, 241, 232, 0.12);
}

.brand-kicker,
.form-eyebrow,
.stage-label,
.emp-title {
  margin: 0;
  color: color-mix(in srgb, currentColor 58%, transparent);
  font-size: 11px;
  font-weight: 800;
  letter-spacing: 0;
  text-transform: uppercase;
}

.brand-title {
  max-width: 500px;
  margin: 8px 0 0;
  font-size: clamp(36px, 4.7vw, 58px);
  line-height: 0.98;
  font-weight: 900;
  letter-spacing: 0;
}

.brand-subtitle {
  max-width: 420px;
  margin: 18px 0 0;
  color: rgba(245, 241, 232, 0.56);
  font-size: 15px;
  line-height: 1.55;
}

.module-showcase {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 10px;
  width: min(100%, 420px);
  margin: 34px 0 auto;
  animation: login-enter var(--dur-slow) var(--ease-out) 70ms both;
}

.module-card {
  display: flex;
  align-items: center;
  gap: 10px;
  min-height: 58px;
  padding: 0 14px;
  border-radius: 8px;
  color: rgba(245, 241, 232, 0.68);
  background: rgba(245, 241, 232, 0.06);
  box-shadow:
    inset 0 0 0 1px rgba(245, 241, 232, 0.08),
    0 12px 28px rgba(0, 0, 0, 0.10);
  font-size: 13px;
  font-weight: 800;
}

.module-card--active {
  color: #1b1508;
  background: linear-gradient(135deg, var(--login-accent), var(--login-accent-strong));
  box-shadow:
    inset 0 1px 0 rgba(255, 255, 255, 0.26),
    0 20px 38px rgba(0, 0, 0, 0.22);
}

.stage-footer {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  align-items: end;
  gap: 12px;
  color: rgba(245, 241, 232, 0.82);
  animation: login-enter var(--dur-slow) var(--ease-out) 110ms both;
}

.stage-footer div {
  display: grid;
  gap: 4px;
  padding-top: 14px;
  border-top: 1px solid rgba(245, 241, 232, 0.10);
}

.stage-footer strong {
  font-size: 13px;
  font-weight: 800;
}

.login-panel {
  display: grid;
  place-items: center;
  min-height: 100vh;
  padding: 40px 28px;
  background:
    linear-gradient(180deg, color-mix(in srgb, var(--login-accent) 6%, transparent), transparent 34%),
    var(--login-panel);
}

.panel-shell {
  position: relative;
  width: min(100%, 420px);
  animation: login-panel-in var(--dur-slow) var(--ease-out) both;
}

.theme-btn {
  position: absolute;
  top: 0;
  right: 0;
  display: inline-grid;
  place-items: center;
  width: 38px;
  height: 38px;
  border: 1px solid var(--login-line);
  border-radius: 8px;
  background: color-mix(in srgb, var(--login-field) 88%, transparent);
  color: var(--login-muted);
  cursor: pointer;
  transition:
    transform var(--dur-fast) var(--ease-out),
    border-color var(--dur-base) var(--ease-out),
    color var(--dur-base) var(--ease-out),
    background-color var(--dur-base) var(--ease-out);
}

.theme-btn:hover {
  border-color: var(--login-accent);
  color: var(--login-accent);
  transform: translateY(-1px);
}

.theme-btn:active,
.btn-submit:active,
.emp-item:active,
.password-btn:active {
  transform: scale(0.98);
}

.mobile-brand {
  display: none;
  align-items: center;
  gap: 10px;
  margin-bottom: 34px;
  font-size: 13px;
  font-weight: 900;
}

.mobile-logo {
  width: 38px;
  height: 38px;
  border-radius: 8px;
  object-fit: cover;
}

.form-head {
  margin-bottom: 30px;
  padding-right: 54px;
}

.form-title {
  margin: 6px 0 6px;
  color: var(--login-ink);
  font-size: 31px;
  line-height: 1.1;
  font-weight: 900;
  letter-spacing: 0;
}

.form-sub {
  margin: 0;
  color: var(--login-muted);
  font-size: 14px;
}

.login-form {
  display: grid;
  gap: 16px;
}

.field {
  display: grid;
  gap: 7px;
}

.field-lbl {
  color: var(--login-muted);
  font-size: 12px;
  font-weight: 800;
}

.field-wrap {
  display: flex;
  align-items: center;
  gap: 10px;
  height: 52px;
  padding: 0 13px;
  border: 1px solid var(--login-line);
  border-radius: 8px;
  background: var(--login-field);
  transition:
    border-color var(--dur-base) var(--ease-out),
    box-shadow var(--dur-base) var(--ease-out),
    background-color var(--dur-base) var(--ease-out);
}

.field-wrap:focus-within {
  border-color: color-mix(in srgb, var(--login-accent) 78%, var(--login-line));
  box-shadow:
    0 0 0 4px color-mix(in srgb, var(--login-accent) 14%, transparent),
    0 8px 18px color-mix(in srgb, var(--login-accent) 9%, transparent);
}

.field-icon {
  flex: 0 0 auto;
  color: var(--login-muted);
}

.field-input {
  width: 100%;
  min-width: 0;
  border: 0;
  outline: 0;
  background: transparent;
  color: var(--login-ink);
  font: inherit;
  font-size: 14px;
}

.field-input::placeholder {
  color: color-mix(in srgb, var(--login-muted) 72%, transparent);
}

.password-btn {
  display: inline-grid;
  place-items: center;
  flex: 0 0 auto;
  width: 32px;
  height: 32px;
  border: 0;
  border-radius: 8px;
  background: transparent;
  color: var(--login-muted);
  cursor: pointer;
  transition:
    background-color var(--dur-fast) var(--ease-out),
    color var(--dur-fast) var(--ease-out),
    transform var(--dur-fast) var(--ease-out);
}

.password-btn:hover {
  background: color-mix(in srgb, var(--login-accent) 12%, transparent);
  color: var(--login-accent);
}

.form-options {
  display: flex;
  align-items: center;
  justify-content: space-between;
  min-height: 22px;
}

.remember {
  display: inline-flex;
  align-items: center;
  gap: 9px;
  color: var(--login-muted);
  font-size: 13px;
  cursor: pointer;
  user-select: none;
}

.remember input {
  width: 15px;
  height: 15px;
  accent-color: var(--login-accent);
  cursor: pointer;
}

.error-msg {
  display: flex;
  align-items: center;
  gap: 8px;
  min-height: 42px;
  padding: 10px 12px;
  border: 1px solid color-mix(in srgb, var(--error) 28%, transparent);
  border-radius: 8px;
  background: color-mix(in srgb, var(--error) 9%, transparent);
  color: var(--error);
  font-size: 13px;
}

.btn-submit {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 9px;
  width: 100%;
  height: 52px;
  border: 0;
  border-radius: 8px;
  background: linear-gradient(135deg, var(--login-accent), var(--login-accent-strong));
  color: var(--on-gold);
  box-shadow:
    0 1px 0 rgba(255, 255, 255, 0.26) inset,
    0 14px 28px color-mix(in srgb, var(--login-accent) 28%, transparent);
  cursor: pointer;
  font-family: inherit;
  font-size: 14px;
  font-weight: 900;
  transition:
    transform var(--dur-fast) var(--ease-out),
    box-shadow var(--dur-base) var(--ease-out),
    filter var(--dur-base) var(--ease-out);
}

.btn-submit:hover {
  transform: translateY(-1px);
  filter: saturate(1.04);
  box-shadow:
    0 1px 0 rgba(255, 255, 255, 0.26) inset,
    0 18px 34px color-mix(in srgb, var(--login-accent) 32%, transparent);
}

.btn-submit:disabled {
  cursor: not-allowed;
  opacity: 0.72;
  transform: none;
  filter: none;
}

.loader-line {
  width: 94px;
  height: 3px;
  border-radius: 999px;
  background:
    linear-gradient(90deg, transparent, var(--on-gold), transparent)
    0 0 / 45% 100% no-repeat,
    color-mix(in srgb, var(--on-gold) 26%, transparent);
  animation: loader-sweep 850ms var(--ease-out) infinite;
}

.emp-list {
  margin-top: 24px;
  padding-top: 20px;
  border-top: 1px solid var(--login-line);
  animation: login-panel-in var(--dur-slow) var(--ease-out) both;
}

.emp-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 12px;
  color: var(--login-muted);
}

.emp-head span {
  display: inline-grid;
  place-items: center;
  min-width: 24px;
  height: 24px;
  border-radius: 8px;
  background: color-mix(in srgb, var(--login-accent) 13%, transparent);
  color: var(--login-accent);
  font-family: var(--font-mono);
  font-size: 12px;
  font-weight: 800;
}

.emp-item {
  display: grid;
  grid-template-columns: 38px 1fr 22px;
  align-items: center;
  gap: 12px;
  width: 100%;
  min-height: 62px;
  margin-bottom: 9px;
  padding: 10px 12px;
  border: 1px solid var(--login-line);
  border-radius: 8px;
  background: var(--login-field);
  color: var(--login-ink);
  text-align: left;
  cursor: pointer;
  transition:
    transform var(--dur-fast) var(--ease-out),
    border-color var(--dur-base) var(--ease-out),
    background-color var(--dur-base) var(--ease-out);
}

.emp-item:hover {
  border-color: var(--login-accent);
  background: color-mix(in srgb, var(--login-field) 88%, var(--login-accent) 12%);
  transform: translateY(-1px);
}

.emp-icon {
  display: inline-grid;
  place-items: center;
  width: 38px;
  height: 38px;
  border-radius: 8px;
  background: color-mix(in srgb, var(--login-accent) 13%, transparent);
  color: var(--login-accent);
}

.emp-copy {
  display: grid;
  gap: 3px;
  min-width: 0;
}

.emp-copy strong,
.emp-copy small {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.emp-copy strong {
  font-size: 13px;
  font-weight: 800;
}

.emp-copy small {
  color: var(--login-muted);
  font-size: 11px;
}

.emp-arrow {
  color: var(--login-muted);
}

@keyframes login-enter {
  from { opacity: 0; transform: translateY(10px); filter: blur(4px); }
  to { opacity: 1; transform: translateY(0); filter: blur(0); }
}

@keyframes login-panel-in {
  from { opacity: 0; transform: translateY(8px); }
  to { opacity: 1; transform: translateY(0); }
}

@keyframes loader-sweep {
  from { background-position: -45% 0, 0 0; }
  to { background-position: 145% 0, 0 0; }
}

@media (max-width: 920px) {
  .login-page {
    grid-template-columns: 1fr;
  }

  .login-stage {
    display: none;
  }

  .login-panel {
    padding: 28px 20px;
  }

  .mobile-brand {
    display: flex;
  }

  .panel-shell {
    width: min(100%, 390px);
  }
}

@media (max-width: 420px) {
  .login-panel {
    place-items: start center;
    padding: 22px 16px;
  }

  .form-head {
    padding-right: 48px;
  }

  .form-title {
    font-size: 27px;
  }

  .field-wrap,
  .btn-submit {
    min-width: 0;
  }
}

@media (prefers-reduced-motion: reduce) {
  .brand-composition,
  .module-showcase,
  .stage-footer,
  .panel-shell,
  .emp-list,
  .loader-line {
    animation: none !important;
  }

  .theme-btn,
  .btn-submit,
  .emp-item,
  .password-btn {
    transition-duration: 0.01ms !important;
  }
}
</style>
