import { ref, computed, onMounted } from 'vue'
import api from '../services/api'
import { useAuthStore } from '../stores/auth'

// Personalización de los atajos del panel principal de un módulo, por usuario.
// La config guarda solo lo que el usuario cambió: { "<ruta>": { oculto, titulo, descripcion, icono, orden } }
export function useAtajosModulo(modulo, seccionesBase) {
  const auth = useAuthStore()
  const config = ref({})
  const dialogAbierto = ref(false)

  const usuario = computed(() => auth.usuario?.codigo || auth.usuario?.usuario || '')

  // Todas las tarjetas del módulo con la personalización aplicada, incluidas las ocultas.
  // Cada item conserva sus valores originales en `_orig` para poder restablecerlos.
  const seccionesTodas = computed(() => {
    const base = typeof seccionesBase === 'function' ? seccionesBase() : (seccionesBase.value ?? seccionesBase)
    return base.map(sec => ({
      ...sec,
      items: sec.items
        .map((item, i) => {
          const ov = config.value[item.path] || {}
          return {
            ...item,
            title: ov.titulo || item.title,
            desc: ov.descripcion || item.desc,
            icon: ov.icono || item.icon,
            oculto: !!ov.oculto,
            _orden: Number.isFinite(ov.orden) ? ov.orden : i,
            _orig: { title: item.title, desc: item.desc, icon: item.icon },
          }
        })
        .sort((a, b) => a._orden - b._orden),
    }))
  })

  const secciones = computed(() =>
    seccionesTodas.value.map(sec => ({ ...sec, items: sec.items.filter(i => !i.oculto) }))
  )

  async function cargar() {
    if (!auth.empresa || !usuario.value) return
    try {
      const { data } = await api.get('/atajos-modulo', {
        params: { empresa: auth.empresa, usuario: usuario.value, modulo },
      })
      if (data.success) config.value = data.data || {}
    } catch (e) {
      console.error('cargar atajos:', e)
    }
  }

  async function guardar(nuevaConfig) {
    config.value = nuevaConfig
    await api.put('/atajos-modulo', {
      empresa: auth.empresa,
      usuario: usuario.value,
      modulo,
      config: nuevaConfig,
    })
  }

  async function restablecer() {
    config.value = {}
    await api.delete('/atajos-modulo', {
      params: { empresa: auth.empresa, usuario: usuario.value, modulo },
    })
  }

  onMounted(cargar)

  return { secciones, seccionesTodas, config, dialogAbierto, guardar, restablecer, cargar }
}
