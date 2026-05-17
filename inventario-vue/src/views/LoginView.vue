<template>
  <v-container class="fill-height" fluid>
    <v-row align="center" justify="center">
      <v-col cols="12" sm="8" md="6" lg="4">
        <v-card elevation="12" rounded="lg">
          <!-- Header -->
          <v-card-item>
            <div class="text-center py-6">
              <div class="text-5xl mb-4">🏢</div>
              <h1 class="text-2xl font-weight-bold">RestManager Pro</h1>
              <p class="text-gray-600">Sistema de Gestión Empresarial</p>
            </div>
          </v-card-item>

          <v-divider></v-divider>

          <!-- Form -->
          <v-card-text class="py-6">
            <v-form @submit.prevent="handleLogin" class="space-y-4">
              <!-- Usuario -->
              <v-text-field
                v-model="formData.usuario"
                label="Usuario"
                placeholder="Ingresa tu usuario"
                prepend-inner-icon="mdi-account"
                variant="outlined"
                required
              ></v-text-field>

              <!-- Contraseña -->
              <v-text-field
                v-model="formData.clave"
                label="Contraseña"
                placeholder="Ingresa tu contraseña"
                type="password"
                prepend-inner-icon="mdi-lock"
                variant="outlined"
                required
              ></v-text-field>

              <!-- Modo Selector -->
              <v-card variant="tonal" class="mb-4">
                <v-card-text>
                  <div class="d-flex justify-space-between align-center">
                    <div>
                      <p class="text-sm font-weight-bold mb-1">🚀 Versión</p>
                      <div class="d-flex gap-2 align-center text-xs">
                        <span :class="{ 'font-weight-bold text-blue-600': !isModoCompleto }">
                          Light
                        </span>
                        <span>/</span>
                        <span :class="{ 'font-weight-bold text-blue-600': isModoCompleto }">
                          Completo
                        </span>
                      </div>
                    </div>
                    <v-switch
                      v-model="isModoCompleto"
                      hide-details
                      color="primary"
                    ></v-switch>
                  </div>
                </v-card-text>
              </v-card>

              <!-- Tema Toggle -->
              <v-card variant="tonal" class="mb-4">
                <v-card-text>
                  <div class="d-flex justify-space-between align-center">
                    <p class="text-sm font-weight-bold">🌙 Modo Oscuro</p>
                    <v-switch
                      v-model="isDarkMode"
                      @change="toggleTema"
                      hide-details
                      color="primary"
                    ></v-switch>
                  </div>
                </v-card-text>
              </v-card>

              <!-- Error Message -->
              <v-alert
                v-if="errorMessage"
                type="error"
                variant="tonal"
                closable
                @click:close="errorMessage = ''"
              >
                {{ errorMessage }}
              </v-alert>

              <!-- Login Button -->
              <v-btn
                type="submit"
                color="primary"
                size="large"
                block
                :loading="isLoading"
              >
                Iniciar Sesión
              </v-btn>
            </v-form>
          </v-card-text>

          <!-- Empresa Selector -->
          <div v-if="showEmpresaSelector">
            <v-divider></v-divider>
            <v-card-text class="py-4">
              <p class="text-sm font-weight-bold mb-3">Selecciona una empresa:</p>
              <v-list class="border" max-height="300">
                <v-list-item
                  v-for="emp in empresas"
                  :key="emp.empresa"
                  @click="selectEmpresa(emp.empresa)"
                  class="cursor-pointer"
                >
                  <template v-slot:prepend>
                    <v-icon>mdi-building</v-icon>
                  </template>
                  <v-list-item-title>{{ emp.empresa_nombre }}</v-list-item-title>
                  <v-list-item-subtitle>NIT: {{ emp.empresa }}</v-list-item-subtitle>
                </v-list-item>
              </v-list>
            </v-card-text>
          </div>

          <!-- Footer -->
          <v-divider></v-divider>
          <v-card-text class="text-center py-4">
            <p class="text-xs text-gray-500">Sistema de Gestión v2.0</p>
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>
  </v-container>
</template>

<script setup>
import { ref } from 'vue'
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
      authStore.setUsuario(result.data)

      const modo = isModoCompleto.value ? 'completo' : 'light'
      authStore.setModoApp(modo)
      localStorage.setItem('modoApp', modo)

      if (result.data.requiere_seleccion && result.data.empresas.length > 1) {
        empresas.value = result.data.empresas
        showEmpresaSelector.value = true
      } else {
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
    router.push('/')
  } else {
    window.location.href = '/principal.html'
  }
}

const toggleTema = () => {
  const newTema = isDarkMode.value ? 'dark' : 'light'
  appStore.setTema(newTema)
}
</script>

<style scoped>
.v-container {
  background: linear-gradient(135deg, #0f172a 0%, #1e3a5f 100%);
}

.space-y-4 > * + * {
  margin-top: 1rem;
}
</style>
