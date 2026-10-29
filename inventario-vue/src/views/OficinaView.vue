<template>
  <MainLayout>
    <div class="ofi-container">
      <img :src="imagen" class="ofi-img" :alt="esDia ? 'Oficina de día' : 'Oficina de noche'" />
    </div>
  </MainLayout>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'
import MainLayout from '../components/layouts/MainLayout.vue'

// Día de 06:00 a 18:00; el resto, noche. Se re-evalúa cada minuto por si la pantalla queda abierta.
const hora = ref(new Date().getHours())
const esDia = computed(() => hora.value >= 6 && hora.value < 18)
const base = import.meta.env.BASE_URL
const imagen = computed(() => `${base}oficina/${esDia.value ? 'dia' : 'noche'}.jpg`)

let timer
onMounted(() => { timer = setInterval(() => { hora.value = new Date().getHours() }, 60000) })
onUnmounted(() => clearInterval(timer))
</script>

<style scoped>
.ofi-container {
  height: calc(100vh - 64px); padding: 0; background: #0f1115;
  display: flex; align-items: center; justify-content: center; overflow: hidden;
}
.ofi-img { max-width: 100%; max-height: 100%; object-fit: contain; display: block; }
</style>
