<template>
  <v-dialog v-model="mostrar" max-width="500px">
    <template #activator="{ props }">
      <v-btn v-bind="props" color="primary" size="small">
        <v-icon>mdi-bell-plus</v-icon>
        Nueva Actualización
      </v-btn>
    </template>

    <v-card>
      <v-card-title class="bg-primary text-white">
        <v-icon>mdi-star-circle</v-icon>
        Registrar Nueva Actualización
      </v-card-title>

      <v-card-text class="pa-6">
        <div class="mb-4">
          <v-text-field
            v-model="formData.titulo"
            label="Título de la actualización"
            placeholder="ej: Nuevo módulo de reportes"
            variant="outlined"
            density="compact"
            class="mb-3"
          />

          <v-textarea
            v-model="formData.mensaje"
            label="Descripción (¿Qué cambió?)"
            placeholder="Detalla los cambios, mejoras o nuevas características..."
            variant="outlined"
            density="compact"
            rows="4"
            class="mb-3"
          />
        </div>

        <v-divider class="my-4" />

        <div class="text-caption text-secondary mb-3">
          Los usuarios serán notificados automáticamente en el dashboard
        </div>
      </v-card-text>

      <v-card-actions class="pa-4">
        <v-spacer />
        <v-btn variant="text" @click="cerrar">Cancelar</v-btn>
        <v-btn
          color="primary"
          @click="registrar"
          :loading="cargando"
          :disabled="!formData.titulo || !formData.mensaje"
        >
          <v-icon>mdi-send</v-icon>
          Publicar
        </v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<script setup>
import { ref } from 'vue'
import adminActualizacionesService from '../services/admin-actualizaciones.service.js'

const mostrar = ref(false)
const cargando = ref(false)
const formData = ref({
  titulo: '',
  mensaje: ''
})

async function registrar() {
  cargando.value = true
  try {
    await adminActualizacionesService.crearActualizacion(
      formData.value.titulo,
      formData.value.mensaje
    )
    // Limpiar y cerrar
    formData.value = { titulo: '', mensaje: '' }
    mostrar.value = false
    // Aquí podrías emitir un evento o recargar notificaciones si tienes acceso
  } catch (e) {
    console.error('Error registrando actualización:', e)
    alert('Error al registrar la actualización')
  } finally {
    cargando.value = false
  }
}

function cerrar() {
  formData.value = { titulo: '', mensaje: '' }
  mostrar.value = false
}
</script>

<style scoped>
.bg-primary {
  background: linear-gradient(135deg, #667eea, #764ba2);
}
</style>
