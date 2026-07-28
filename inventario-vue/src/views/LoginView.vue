<template>
  <div :class="['login-page', isDarkMode ? 'dark' : 'light']">
    <section class="login-stage" aria-label="RestManager Pro">
      <div class="brand-mark">
        <img :src="logoSrc" class="brand-logo" alt="RestManager Pro" />
        <div>
          <p class="brand-kicker">RestManager Pro</p>
          <h1 class="brand-title">Control operativo para cada turno.</h1>
        </div>
      </div>

      <div class="operation-board" aria-hidden="true">
        <div class="board-row board-row--head">
          <span>Caja</span>
          <span>Estado</span>
          <span>Cierre</span>
        </div>
        <div class="board-row">
          <span>Ventas</span>
          <span class="status-dot status-dot--ok">Activo</span>
          <strong>$ 8,420</strong>
        </div>
        <div class="board-row">
          <span>Tesorería</span>
          <span class="status-dot status-dot--warn">Revisión</span>
          <strong>$ 2,180</strong>
        </div>
        <div class="board-row">
          <span>Inventario</span>
          <span class="status-dot status-dot--ok">Listo</span>
          <strong>96%</strong>
        </div>
      </div>

      <div class="stage-footer">
        <div>
          <span class="stage-label">Sesión segura</span>
          <strong>Multiempresa</strong>
        </div>
        <div>
          <span class="stage-label">Versión</span>
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
    linear-gradient(90deg, rgba(245, 241, 232, 0.055) 1px, transparent 1px),
    linear-gradient(180deg, rgba(245, 241, 232, 0.045) 1px, transparent 1px),
    linear-gradient(145deg, var(--login-stage) 0%, var(--login-stage-soft) 68%, #2d2112 100%);
  background-size: 44px 44px, 44px 44px, auto;
}

.login-stage::before {
  content: '';
  position: absolute;
  inset: 0;
  background:
    linear-gradient(118deg, transparent 0 56%, rgba(240, 168, 60, 0.16) 56% 56.35%, transparent 56.35%),
    linear-gradient(118deg, transparent 0 68%, rgba(245, 241, 232, 0.10) 68% 68.18%, transparent 68.18%);
  pointer-events: none;
}

.brand-mark,
.operation-board,
.stage-footer {
  position: relative;
  z-index: 1;
}

.brand-mark {
  display: flex;
  align-items: center;
  gap: 18px;
  max-width: 470px;
  animation: login-enter var(--dur-slow) var(--ease-out) both;
}

.brand-logo {
  width: 64px;
  height: 64px;
  border-radius: 8px;
  object-fit: cover;
  box-shadow:
    0 0 0 1px rgba(245, 241, 232, 0.12),
    0 14px 32px rgba(0, 0, 0, 0.28);
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
  max-width: 440px;
  margin: 4px 0 0;
  font-size: 34px;
  line-height: 1.04;
  font-weight: 900;
  letter-spacing: 0;
}

.operation-board {
  width: min(100%, 560px);
  margin: auto 0;
  border-radius: 8px;
  background: rgba(245, 241, 232, 0.075);
  box-shadow:
    inset 0 0 0 1px rgba(245, 241, 232, 0.09),
    0 24px 60px rgba(0, 0, 0, 0.26);
  backdrop-filter: blur(8px);
  animation: login-enter var(--dur-slow) var(--ease-out) 70ms both;
}

.board-row {
  display: grid;
  grid-template-columns: 1fr 0.8fr 0.75fr;
  gap: 16px;
  align-items: center;
  min-height: 58px;
  padding: 0 18px;
  border-bottom: 1px solid rgba(245, 241, 232, 0.08);
  color: rgba(245, 241, 232, 0.78);
  font-size: 13px;
}

.board-row:last-child { border-bottom: 0; }
.board-row strong {
  justify-self: end;
  font-family: var(--font-mono);
  font-size: 13px;
  font-variant-numeric: tabular-nums;
  color: #fff;
}
.board-row--head {
  min-height: 42px;
  color: rgba(245, 241, 232, 0.38);
  font-size: 10.5px;
  font-weight: 800;
  text-transform: uppercase;
}

.status-dot {
  display: inline-flex;
  align-items: center;
  gap: 7px;
  color: rgba(245, 241, 232, 0.72);
}

.status-dot::before {
  content: '';
  width: 7px;
  height: 7px;
  border-radius: 50%;
  background: currentColor;
}

.status-dot--ok::before { background: var(--login-success); }
.status-dot--warn::before { background: var(--login-warning); }

.stage-footer {
  display: flex;
  align-items: end;
  justify-content: space-between;
  gap: 24px;
  color: rgba(245, 241, 232, 0.82);
  animation: login-enter var(--dur-slow) var(--ease-out) 110ms both;
}

.stage-footer div {
  display: grid;
  gap: 4px;
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

  .board-row,
  .field-wrap,
  .btn-submit {
    min-width: 0;
  }
}

@media (prefers-reduced-motion: reduce) {
  .brand-mark,
  .operation-board,
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
