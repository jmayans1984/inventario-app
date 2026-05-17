<template>
  <div class="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-600 to-purple-700 px-4">
    <div class="w-full max-w-md">
      <div class="bg-white rounded-xl shadow-2xl p-8">
        <!-- Header -->
        <div class="text-center mb-8">
          <div class="text-4xl mb-4">🏢</div>
          <h1 class="text-2xl font-bold text-gray-900 mb-2">RestManager Pro</h1>
          <p class="text-gray-600">Sistema de Gestión Empresarial</p>
        </div>

        <!-- Login Form -->
        <form @submit.prevent="handleLogin" class="space-y-6">
          <!-- Usuario -->
          <div>
            <label for="usuario" class="block text-sm font-semibold text-gray-700 mb-2">
              Usuario
            </label>
            <input
              v-model="formData.usuario"
              type="text"
              id="usuario"
              placeholder="Ingresa tu usuario"
              class="form-input"
              required
            />
          </div>

          <!-- Contraseña -->
          <div>
            <label for="clave" class="block text-sm font-semibold text-gray-700 mb-2">
              Contraseña
            </label>
            <input
              v-model="formData.clave"
              type="password"
              id="clave"
              placeholder="Ingresa tu contraseña"
              class="form-input"
              required
            />
          </div>

          <!-- Modo Selector -->
          <div class="bg-gray-100 rounded-lg p-4 flex items-center justify-between">
            <div class="flex flex-col gap-1">
              <span class="text-sm font-semibold text-gray-900">🚀 Versión</span>
              <div class="flex items-center gap-2 text-xs">
                <span :class="{ 'font-bold text-blue-600': !isModoCompleto, 'text-gray-500': isModoCompleto }">
                  Light
                </span>
                <span class="text-gray-400">/</span>
                <span :class="{ 'font-bold text-blue-600': isModoCompleto, 'text-gray-500': !isModoCompleto }">
                  Completo
                </span>
              </div>
            </div>
            <label class="relative inline-flex items-center cursor-pointer">
              <input
                v-model="isModoCompleto"
                type="checkbox"
                class="sr-only peer"
              />
              <div class="w-14 h-7 bg-gray-300 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-[4px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-6 after:w-6 after:transition-all peer-checked:bg-blue-600"></div>
            </label>
          </div>

          <!-- Tema Toggle -->
          <div class="bg-gray-100 rounded-lg p-4 flex items-center justify-between">
            <span class="text-sm font-semibold text-gray-900">🌙 Modo Oscuro</span>
            <label class="relative inline-flex items-center cursor-pointer">
              <input
                v-model="isDarkMode"
                @change="toggleTema"
                type="checkbox"
                class="sr-only peer"
              />
              <div class="w-14 h-7 bg-gray-300 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-[4px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-6 after:w-6 after:transition-all peer-checked:bg-blue-600"></div>
            </label>
          </div>

          <!-- Login Button -->
          <button
            type="submit"
            :disabled="isLoading"
            class="w-full btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <span v-if="!isLoading">Iniciar Sesión</span>
            <span v-else>Cargando...</span>
          </button>

          <!-- Error Message -->
          <div v-if="errorMessage" class="bg-red-50 border border-red-200 rounded-lg p-3">
            <p class="text-red-800 text-sm">❌ {{ errorMessage }}</p>
          </div>
        </form>

        <!-- Empresa Selector -->
        <div v-if="showEmpresaSelector" class="mt-6 pt-6 border-t border-gray-200">
          <p class="text-sm font-semibold text-gray-900 mb-3">Selecciona una empresa:</p>
          <div class="space-y-2 max-h-48 overflow-y-auto">
            <button
              v-for="emp in empresas"
              :key="emp.empresa"
              @click="selectEmpresa(emp.empresa)"
              class="w-full text-left p-3 rounded-lg border border-gray-200 hover:bg-blue-50 hover:border-blue-300 transition-all"
            >
              <strong class="text-gray-900">{{ emp.empresa_nombre }}</strong>
              <p class="text-xs text-gray-500">NIT: {{ emp.empresa }}</p>
            </button>
          </div>
        </div>

        <!-- Footer -->
        <p class="text-center text-xs text-gray-500 mt-6">
          Sistema de Gestión v2.0
        </p>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '../stores/auth'
import { useAppStore } from '../stores/app'
import authService from '../services/auth.service'

const router = useRouter()
const authStore = useAuthStore()
const appStore = useAppStore()

const formData = ref({
  usuario: '',
  clave: '',
})

const isModoCompleto = ref(localStorage.getItem('modoApp') === 'completo')
const isDarkMode = ref(appStore.tema === 'dark')
const isLoading = ref(false)
const errorMessage = ref('')
const showEmpresaSelector = ref(false)
const empresas = ref([])

const handleLogin = async () => {
  isLoading.value = true
  errorMessage.value = ''

  try {
    const result = await authService.login(formData.value.usuario, formData.value.clave)

    if (result.success) {
      // Save user data to store
      authStore.setUsuario(result.data)

      // Save modo selection
      const modo = isModoCompleto.value ? 'completo' : 'light'
      authStore.setModoApp(modo)
      localStorage.setItem('modoApp', modo)

      // Handle empresa selection
      if (result.data.requiere_seleccion && result.data.empresas.length > 1) {
        empresas.value = result.data.empresas
        showEmpresaSelector.value = true
      } else {
        // Single empresa or no selection required
        const empresaCod = result.data.empresas[0]?.empresa
        if (empresaCod) {
          authStore.setEmpresa(empresaCod)
          redirectToMain()
        }
      }
    } else {
      errorMessage.value = result.error || 'Error en login'
    }
  } catch (error) {
    console.error('Login error:', error)
    errorMessage.value = 'Error al conectar con el servidor'
  } finally {
    isLoading.value = false
  }
}

const selectEmpresa = (empresaCod) => {
  const empresa = empresas.value.find(e => e.empresa === empresaCod)
  if (empresa) {
    authStore.setEmpresa(empresaCod, empresa.empresa_nombre)
    redirectToMain()
  }
}

const redirectToMain = () => {
  const modo = localStorage.getItem('modoApp') || 'light'
  if (modo === 'completo') {
    // Go to Vue dashboard
    router.push('/')
  } else {
    // Go to original HTML version
    window.location.href = '/principal.html'
  }
}

const toggleTema = () => {
  const newTema = isDarkMode.value ? 'dark' : 'light'
  appStore.setTema(newTema)
}

// Watch for modo change
const watchModo = computed({
  get: () => isModoCompleto.value,
  set: (value) => {
    isModoCompleto.value = value
    const modo = value ? 'completo' : 'light'
    localStorage.setItem('modoApp', modo)
  },
})
</script>
