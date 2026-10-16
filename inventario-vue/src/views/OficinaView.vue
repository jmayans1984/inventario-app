<template>
  <MainLayout>
    <div class="ofi-container">
      <iframe
        :src="OFICINA_URL"
        class="ofi-frame"
        title="Oficina virtual MAYDO"
        allow="fullscreen; clipboard-write; clipboard-read"
        referrerpolicy="no-referrer"
      />
      <a :href="OFICINA_URL" target="_blank" rel="noopener" class="ofi-abrir">
        <v-icon size="14">mdi-open-in-new</v-icon> Abrir en pestaña nueva
      </a>
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
.ofi-abrir {
  position: absolute; right: 14px; top: 10px; z-index: 2; display: inline-flex; gap: 4px; align-items: center;
  font-size: 11.5px; padding: 3px 9px; border-radius: 999px; text-decoration: none;
  background: rgba(255, 255, 255, .85); color: #334155; box-shadow: 0 2px 8px rgba(0, 0, 0, .15);
}
</style>
