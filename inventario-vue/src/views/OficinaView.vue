<template>
  <MainLayout>
    <div class="ofi-container">
      <iframe
        ref="frame"
        @load="enviarTema"
        :src="OFICINA_URL + '?escena=imagen'"
        class="ofi-frame"
        title="Oficina virtual MAYDO"
        allow="fullscreen; clipboard-write; clipboard-read; microphone; local-network-access; loopback-network"
        referrerpolicy="no-referrer"
      />
    </div>
  </MainLayout>
</template>

<script setup>
import { ref, watch, onMounted, onBeforeUnmount } from 'vue'
import MainLayout from '../components/layouts/MainLayout.vue'
import { OFICINA_URL } from '../utils/constants'
import { useAppStore } from '../stores/app'

// La oficina va en un iframe de otro dominio: le avisamos el tema (claro/oscuro) para que el escáner use el mismo.
const appStore = useAppStore()
const frame = ref(null)
const enviarTema = () => frame.value?.contentWindow?.postMessage({ ofi: 'tema', oscuro: appStore.isDarkMode }, '*')
const alMensaje = (e) => { if (e.data && e.data.ofi === 'listo') enviarTema() }
watch(() => appStore.isDarkMode, enviarTema)
onMounted(() => window.addEventListener('message', alMensaje))
onBeforeUnmount(() => window.removeEventListener('message', alMensaje))
</script>

<style scoped>
.ofi-container { position: relative; height: calc(100vh - 64px); padding: 0; }
.ofi-frame { width: 100%; height: 100%; border: 0; display: block; background: #eef2f8; }
</style>
