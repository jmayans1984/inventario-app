import { ref } from 'vue'

// Singleton — mismo ref compartido entre App.vue y MiniCalculadora.vue
const show      = ref(false)
const focusedEl = ref(null)

export function useCalculadora() {
  function openCalc(el) {
    focusedEl.value = el
    show.value = true
  }
  function closeCalc() {
    show.value = false
  }
  return { show, focusedEl, openCalc, closeCalc }
}
