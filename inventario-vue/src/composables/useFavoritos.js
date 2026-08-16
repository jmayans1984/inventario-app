import { ref, computed, onMounted } from 'vue'
import api from '../services/api'
import { useAuthStore } from '../stores/auth'

// Pantallas ancladas como favoritas arriba del menú lateral, por usuario.
// Estado singleton: MainLayout renderiza la lista y cada item hoja expone
// el botón de anclar/desanclar; ambos comparten esta misma lista reactiva.
//
// El logout/login es una navegación de cliente (sin recargar la página), así
// que este módulo sigue vivo entre sesiones de distintos usuarios en la misma
// pestaña. Por eso NO se usa un flag de "ya cargué una vez": se recuerda para
// qué (empresa, usuario) se cargó la lista, y se vuelve a pedir al backend
// en cuanto cambia — evitando que el usuario B vea los favoritos del A.
const favoritos = ref([])
let claveCargada = null

export function useFavoritos() {
  const auth = useAuthStore()

  const rutasFavoritas = computed(() => new Set(favoritos.value.map(f => f.path)))

  async function cargar() {
    if (!auth.empresa) return
    const usuario = auth.usuario?.codigo || auth.usuario?.usuario
    if (!usuario) return
    const clave = `${auth.empresa}:${usuario}`
    if (clave === claveCargada) return
    claveCargada = clave
    favoritos.value = []
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

  onMounted(cargar)

  return { favoritos, esFavorito, toggleFavorito, cargar }
}
