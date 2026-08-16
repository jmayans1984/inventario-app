import { ref, computed, onMounted } from 'vue'
import api from '../services/api'
import { useAuthStore } from '../stores/auth'

// Pantallas ancladas como favoritas arriba del menú lateral, por usuario.
// Estado singleton: MainLayout renderiza la lista y cada item hoja expone
// el botón de anclar/desanclar; ambos comparten esta misma lista reactiva.
const favoritos = ref([])
let cargado = false

export function useFavoritos() {
  const auth = useAuthStore()

  const rutasFavoritas = computed(() => new Set(favoritos.value.map(f => f.path)))

  async function cargar() {
    if (!auth.empresa) return
    const usuario = auth.usuario?.codigo || auth.usuario?.usuario
    if (!usuario) return
    try {
      const { data } = await api.get('/favoritos-sidebar', { params: { empresa: auth.empresa, usuario } })
      if (data.success) favoritos.value = data.data || []
    } catch (e) {
      console.error('cargar favoritos:', e)
    }
  }

  async function guardar() {
    const usuario = auth.usuario?.codigo || auth.usuario?.usuario
    if (!auth.empresa || !usuario) return
    try {
      await api.put('/favoritos-sidebar', { empresa: auth.empresa, usuario, rutas: favoritos.value })
    } catch (e) {
      console.error('guardar favoritos:', e)
    }
  }

  function esFavorito(path) {
    return rutasFavoritas.value.has(path)
  }

  function toggleFavorito(item) {
    const idx = favoritos.value.findIndex(f => f.path === item.path)
    if (idx >= 0) {
      favoritos.value.splice(idx, 1)
    } else {
      favoritos.value.push({ path: item.path, name: item.name, icon: item.icon || 'mdi-star-outline' })
    }
    guardar()
  }

  onMounted(() => {
    if (!cargado) {
      cargado = true
      cargar()
    }
  })

  return { favoritos, esFavorito, toggleFavorito, cargar }
}
