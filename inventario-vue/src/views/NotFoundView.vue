<template>
  <div class="not-found-page">
    <div class="nf-content">
      <div class="nf-number">404</div>
      <div class="nf-icon-wrap">
        <v-icon size="48" color="rgba(255,255,255,0.3)">mdi-map-marker-off-outline</v-icon>
      </div>
      <p class="nf-title">Página no encontrada</p>
      <p class="nf-sub">La ruta que buscas no existe o fue movida a otra ubicación.</p>
      <v-btn
        color="white"
        variant="tonal"
        class="mt-6"
        prepend-icon="mdi-arrow-left"
        @click="router.push('/')"
      >
        Volver al Dashboard
      </v-btn>
    </div>
  </div>
</template>

<script setup>
import { useRouter } from 'vue-router'
const router = useRouter()
</script>

<style scoped>
.not-found-page {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #0f172a 0%, #1e293b 100%);
}
.nf-content {
  text-align: center;
  padding: 40px;
}
.nf-number {
  font-size: 120px;
  font-weight: 900;
  color: rgba(255,255,255,0.08);
  line-height: 1;
  letter-spacing: -8px;
  margin-bottom: -20px;
}
.nf-icon-wrap {
  margin-bottom: 16px;
}
.nf-title {
  color: white;
  font-size: 24px;
  font-weight: 800;
  margin: 0;
  letter-spacing: 0.3px;
}
.nf-sub {
  color: rgba(255,255,255,0.45);
  font-size: 14px;
  margin-top: 10px;
  max-width: 340px;
}
</style>
