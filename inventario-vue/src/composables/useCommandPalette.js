import { ref } from 'vue'

// Estado compartido (singleton) para abrir la búsqueda global (Ctrl+K)
// desde cualquier componente: el botón del header y el listener de teclado
// en App.vue apuntan al mismo ref.
const open = ref(false)

export function useCommandPalette() {
  return { open }
}
