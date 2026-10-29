<template>
  <MainLayout>
    <div class="ofi-container">
      <iframe
        :src="OFICINA_URL + '?escena=imagen'"
        class="ofi-frame"
        title="Oficina virtual MAYDO"
        allow="fullscreen; clipboard-write; clipboard-read"
        referrerpolicy="no-referrer"
      />
    </div>
  </MainLayout>
</template>

<script setup>
import MainLayout from '../components/layouts/MainLayout.vue'
import { OFICINA_URL } from '../utils/constants'
</script>

<style scoped>
.ofi-container { position: relative; height: calc(100vh - 64px); padding: 0; }
.ofi-frame { width: 100%; height: 100%; border: 0; display: block; background: #eef2f8; }
</style>
