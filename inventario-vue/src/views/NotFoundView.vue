<template>
  <div class="min-h-screen flex items-center justify-center bg-gray-50">
    <div class="text-center">
      <h1 class="text-6xl font-bold text-gray-900 mb-4">404</h1>
      <p class="text-gray-600 mb-8">Página no encontrada</p>
      <router-link to="/" class="btn-primary">Volver al Dashboard</router-link>
    </div>
  </div>
</template>

<script setup>
import { useRouter } from 'vue-router'
</script>
