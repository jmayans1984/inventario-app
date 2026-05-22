<template>
  <v-dialog v-model="isOpen" fullscreen persistent>
    <v-card class="preview-card">
      <!-- HEADER -->
      <div class="preview-header">
        <div class="preview-title-section">
          <v-icon size="24" class="preview-icon">
            {{ getFileIcon(fileName) }}
          </v-icon>
          <div>
            <h2 class="preview-title">{{ fileName }}</h2>
            <p class="preview-subtitle">{{ formatFileSize(fileSize) }}</p>
          </div>
        </div>
        <div class="preview-close">
          <v-btn icon size="small" variant="text" @click="closeModal">
            <v-icon>mdi-close</v-icon>
          </v-btn>
        </div>
      </div>

      <!-- TOOLBAR -->
      <div class="preview-toolbar">
        <div class="toolbar-left">
          <span class="toolbar-label">VISTA:</span>
        </div>
        <div class="toolbar-center">
          <!-- Zoom Controls -->
          <v-btn
            icon
            size="small"
            variant="outlined"
            @click="zoomOut"
            :disabled="zoom <= 50"
            class="toolbar-btn"
          >
            <v-icon>mdi-minus</v-icon>
          </v-btn>
          <span class="zoom-display">{{ zoom }}%</span>
          <v-btn
            icon
            size="small"
            variant="outlined"
            @click="zoomIn"
            :disabled="zoom >= 300"
            class="toolbar-btn"
          >
            <v-icon>mdi-plus</v-icon>
          </v-btn>
          <v-divider vertical class="mx-2" />

          <!-- Rotation Controls -->
          <v-btn
            icon
            size="small"
            variant="outlined"
            @click="rotateLeft"
            class="toolbar-btn"
          >
            <v-icon>mdi-rotate-left</v-icon>
          </v-btn>
          <span class="rotation-display">{{ rotation }}°</span>
          <v-btn
            icon
            size="small"
            variant="outlined"
            @click="rotateRight"
            class="toolbar-btn"
          >
            <v-icon>mdi-rotate-right</v-icon>
          </v-btn>
          <v-divider vertical class="mx-2" />

          <!-- Reset Button -->
          <v-btn
            icon
            size="small"
            variant="outlined"
            @click="resetTransform"
            class="toolbar-btn"
          >
            <v-icon>mdi-restore</v-icon>
          </v-btn>
        </div>
        <div class="toolbar-right">
          <v-btn
            icon
            size="small"
            color="success"
            variant="outlined"
            @click="downloadFile"
            class="toolbar-btn"
          >
            <v-icon>mdi-download</v-icon>
          </v-btn>
        </div>
      </div>

      <!-- PREVIEW CONTENT -->
      <div class="preview-content">
        <!-- IMAGE PREVIEW -->
        <div
          v-if="isImage"
          class="image-container"
          @wheel.prevent="handleMouseWheel"
        >
          <img
            :src="fileData"
            :alt="fileName"
            :style="{
              transform: `scale(${zoom / 100}) rotate(${rotation}deg)`,
              transition: 'transform 0.2s ease'
            }"
            class="preview-image"
          />
        </div>

        <!-- PDF PREVIEW -->
        <div v-else-if="isPdf" class="pdf-container">
          <iframe
            :src="fileData"
            class="preview-pdf"
            allow="fullscreen"
          />
        </div>

        <!-- UNKNOWN FORMAT -->
        <div v-else class="preview-unsupported">
          <v-icon size="64" color="warning" class="mb-4">
            mdi-file-question-outline
          </v-icon>
          <p class="unsupported-text">Formato no soportado para previsualización</p>
          <p class="unsupported-sub">{{ fileType }}</p>
          <v-btn
            color="primary"
            @click="downloadFile"
            class="mt-4"
          >
            📥 Descargar Archivo
          </v-btn>
        </div>
      </div>

      <!-- FOOTER -->
      <div class="preview-footer">
        <span class="footer-info">{{ getTypeLabel() }}</span>
        <div class="footer-buttons">
          <v-btn variant="text" @click="closeModal">Cerrar</v-btn>
          <v-btn
            color="primary"
            variant="elevated"
            @click="downloadFile"
            class="ml-2"
          >
            📥 Descargar
          </v-btn>
        </div>
      </div>
    </v-card>
  </v-dialog>
</template>

<script setup>
import { ref, computed, watch } from 'vue'

const props = defineProps({
  open: {
    type: Boolean,
    default: false
  },
  fileName: {
    type: String,
    required: true
  },
  fileData: {
    type: String,
    required: true
  },
  fileSize: {
    type: Number,
    default: 0
  },
  downloadFunction: {
    type: Function,
    required: true
  }
})

const emit = defineEmits(['close'])

const isOpen = ref(props.open)
const zoom = ref(100)
const rotation = ref(0)

const fileExtension = computed(() => {
  return props.fileName.split('.').pop().toLowerCase()
})

const fileType = computed(() => {
  const ext = fileExtension.value
  const types = {
    jpg: 'JPEG Image',
    jpeg: 'JPEG Image',
    png: 'PNG Image',
    gif: 'GIF Image',
    bmp: 'Bitmap Image',
    webp: 'WebP Image',
    pdf: 'PDF Document',
    txt: 'Text File'
  }
  return types[ext] || `Archivo (.${ext})`
})

const isImage = computed(() => {
  const imageExts = ['jpg', 'jpeg', 'png', 'gif', 'bmp', 'webp']
  return imageExts.includes(fileExtension.value)
})

const isPdf = computed(() => {
  return fileExtension.value === 'pdf'
})

const zoomIn = () => {
  if (zoom.value < 300) {
    zoom.value += 25
  }
}

const zoomOut = () => {
  if (zoom.value > 50) {
    zoom.value -= 25
  }
}

const rotateLeft = () => {
  rotation.value = (rotation.value - 90 + 360) % 360
}

const rotateRight = () => {
  rotation.value = (rotation.value + 90) % 360
}

const resetTransform = () => {
  zoom.value = 100
  rotation.value = 0
}

const handleMouseWheel = (event) => {
  if (event.deltaY > 0) {
    zoomOut()
  } else {
    zoomIn()
  }
}

const closeModal = () => {
  resetTransform()
  isOpen.value = false
  emit('close')
}

const downloadFile = () => {
  props.downloadFunction()
}

const getFileIcon = (fileName) => {
  const ext = fileName.split('.').pop().toLowerCase()
  const icons = {
    jpg: 'mdi-image',
    jpeg: 'mdi-image',
    png: 'mdi-image',
    gif: 'mdi-image',
    pdf: 'mdi-file-pdf-box',
    txt: 'mdi-file-document-outline'
  }
  return icons[ext] || 'mdi-file-outline'
}

const getTypeLabel = () => {
  if (isImage.value) return '📷 Imagen'
  if (isPdf.value) return '📄 PDF'
  return '📎 Archivo'
}

const formatFileSize = (bytes) => {
  if (!bytes) return '0 B'
  const k = 1024
  const sizes = ['B', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return (bytes / Math.pow(k, i)).toFixed(2) + ' ' + sizes[i]
}

// Watch for external open changes
watch(
  () => props.open,
  (newVal) => {
    isOpen.value = newVal
  }
)
</script>

<style scoped>
.preview-card {
  display: flex;
  flex-direction: column;
  height: 100vh;
  max-height: 100vh;
  background: var(--v-theme-surface) !important;
  opacity: 1 !important;
}

.preview-header {
  padding: 1.5rem;
  border-bottom: 1px solid rgba(var(--v-theme-on-surface), 0.08);
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-shrink: 0;
}

.preview-title-section {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.preview-icon {
  color: rgb(var(--v-theme-primary));
}

.preview-title {
  font-size: 1.25rem;
  font-weight: 700;
  margin: 0;
  color: rgb(var(--v-theme-on-surface));
}

.preview-subtitle {
  font-size: 0.85rem;
  color: rgba(var(--v-theme-on-surface), 0.6);
  margin: 0.25rem 0 0 0;
}

.preview-close {
  flex-shrink: 0;
}

.preview-toolbar {
  padding: 1rem;
  background: rgba(var(--v-theme-primary), 0.05);
  border-bottom: 1px solid rgba(var(--v-theme-on-surface), 0.08);
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 1rem;
  flex-shrink: 0;
}

.toolbar-left,
.toolbar-right {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.toolbar-label {
  font-size: 0.75rem;
  font-weight: 700;
  color: rgba(var(--v-theme-on-surface), 0.5);
  text-transform: uppercase;
}

.toolbar-center {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  flex: 1;
  justify-content: center;
}

.toolbar-btn {
  min-width: auto;
  width: 32px !important;
  height: 32px !important;
}

.zoom-display,
.rotation-display {
  font-size: 0.85rem;
  font-weight: 600;
  color: rgb(var(--v-theme-on-surface));
  min-width: 45px;
  text-align: center;
}

.preview-content {
  flex: 1;
  overflow: auto;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(0, 0, 0, 0.1);
  padding: 2rem;
  flex-shrink: 1;
}

.image-container {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  height: 100%;
  overflow: auto;
}

.preview-image {
  max-width: 100%;
  max-height: 100%;
  object-fit: contain;
  cursor: grab;
}

.preview-image:active {
  cursor: grabbing;
}

.pdf-container {
  width: 100%;
  height: 100%;
  display: flex;
  background: white;
  border-radius: 8px;
  overflow: hidden;
}

.preview-pdf {
  width: 100%;
  height: 100%;
  border: none;
}

.preview-unsupported {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 3rem;
  text-align: center;
}

.unsupported-text {
  font-size: 1.1rem;
  font-weight: 600;
  color: rgb(var(--v-theme-on-surface));
  margin: 1rem 0 0 0;
}

.unsupported-sub {
  font-size: 0.9rem;
  color: rgba(var(--v-theme-on-surface), 0.6);
  margin: 0.5rem 0 0 0;
}

.preview-footer {
  padding: 1rem 1.5rem;
  border-top: 1px solid rgba(var(--v-theme-on-surface), 0.08);
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-shrink: 0;
  background: rgba(var(--v-theme-primary), 0.02);
}

.footer-info {
  font-size: 0.85rem;
  color: rgba(var(--v-theme-on-surface), 0.7);
}

.footer-buttons {
  display: flex;
  gap: 0.75rem;
}

/* Responsive */
@media (max-width: 600px) {
  .preview-toolbar {
    flex-wrap: wrap;
  }

  .toolbar-center {
    width: 100%;
    order: 3;
  }

  .preview-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 1rem;
  }

  .preview-close {
    align-self: flex-end;
    margin-top: -2rem;
  }
}
</style>
