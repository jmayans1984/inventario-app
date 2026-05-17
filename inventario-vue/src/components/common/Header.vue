<template>
  <header class="bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 shadow-sm">
    <div class="flex items-center justify-between px-6 py-4">
      <!-- Left side - Title -->
      <div>
        <h1 class="text-2xl font-bold text-gray-900 dark:text-white">
          Bienvenido de vuelta
        </h1>
        <p class="text-sm text-gray-600 dark:text-gray-400">{{ currentDate }}</p>
      </div>

      <!-- Right side - User Info & Actions -->
      <div class="flex items-center gap-6">
        <!-- Theme Toggle -->
        <button
          @click="toggleTema"
          class="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
          :title="appStore.isDarkMode ? 'Cambiar a modo claro' : 'Cambiar a modo oscuro'"
        >
          <span class="text-xl">{{ appStore.isDarkMode ? '☀️' : '🌙' }}</span>
        </button>

        <!-- User Info -->
        <div class="flex items-center gap-4">
          <div class="text-right">
            <p class="font-semibold text-gray-900 dark:text-white">
              {{ authStore.userName }}
            </p>
            <p class="text-xs text-gray-600 dark:text-gray-400">
              {{ authStore.empresaNombre }}
            </p>
          </div>

          <!-- User Avatar -->
          <div class="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-bold">
            {{ avatarInitials }}
          </div>
        </div>

        <!-- Logout Button -->
        <button
          @click="handleLogout"
          class="p-2 rounded-lg hover:bg-red-50 dark:hover:bg-red-900 transition-colors text-red-600 dark:text-red-400"
          title="Cerrar sesión"
        >
          🚪
        </button>
      </div>
    </div>
  </header>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '../../stores/auth'
import { useAppStore } from '../../stores/app'

const router = useRouter()
const authStore = useAuthStore()
const appStore = useAppStore()

const currentDate = ref('')

const avatarInitials = computed(() => {
  const name = authStore.userNombre || authStore.userName
  const parts = name.split(' ')
  return parts.map(p => p.charAt(0)).join('').toUpperCase().slice(0, 2)
})

onMounted(() => {
  const today = new Date()
  const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }
  currentDate.value = today.toLocaleDateString('es-ES', options)
})

const toggleTema = () => {
  appStore.toggleTema()
  document.documentElement.setAttribute('data-theme', appStore.tema)
}

const handleLogout = () => {
  if (confirm('¿Estás seguro de cerrar sesión?')) {
    authStore.logout()
    appStore.setTema('light')
    router.push('/login')
  }
}
</script>
