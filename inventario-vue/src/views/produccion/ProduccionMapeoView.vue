<template>
  <MainLayout>
    <div class="mapeo-wrap">
      <!-- HEADER -->
      <div class="mapeo-header">
        <div class="mapeo-header-icon"><v-icon size="20" color="white">mdi-link-variant</v-icon></div>
        <div class="flex-1">
          <h1 class="mapeo-title">MAPEO RECETAS ↔ PRODUCTOS</h1>
          <p class="mapeo-sub">Asocia cada receta con su producto correspondiente en inventario</p>
        </div>
      </div>

      <!-- CONTENIDO -->
      <v-card style="margin-top: 24px;">
        <v-card-text>
          <div style="display: flex; gap: 16px; margin-bottom: 20px; flex-wrap: wrap;">
            <v-select
              v-model="recetaSeleccionada"
              :items="recetas"
              item-title="nombre"
              item-value="codigo"
              label="Seleccionar Receta"
              density="compact"
              style="max-width: 300px;"
            />
            <v-select
              v-model="productoSeleccionado"
              :items="productos"
              item-title="nombre"
              item-value="codigo"
              label="Seleccionar Producto"
              density="compact"
              style="max-width: 300px;"
            />
            <v-btn color="#8b5cf6" variant="flat" @click="guardarMapeo" size="small">
              <v-icon start>mdi-check</v-icon> Guardar
            </v-btn>
          </div>

          <!-- TABLA DE MAPEOS -->
          <v-table density="compact">
            <thead>
              <tr>
                <th>RECETA (CÓDIGO)</th>
                <th>RECETA (NOMBRE)</th>
                <th>PRODUCTO (CÓDIGO)</th>
                <th>PRODUCTO (NOMBRE)</th>
                <th style="width: 80px;">ACCIONES</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="mapeo in mapeos" :key="mapeo.codigo_receta">
                <td><strong>{{ mapeo.codigo_receta }}</strong></td>
                <td>{{ obtenerNombreReceta(mapeo.codigo_receta) }}</td>
                <td><strong>{{ mapeo.codigo_producto }}</strong></td>
                <td>{{ obtenerNombreProducto(mapeo.codigo_producto) }}</td>
                <td style="text-align: center;">
                  <v-btn size="x-small" variant="text" color="#ef4444" @click="eliminarMapeo(mapeo.codigo_receta)">
                    <v-icon size="14">mdi-delete</v-icon>
                  </v-btn>
                </td>
              </tr>
            </tbody>
          </v-table>

          <div v-if="mapeos.length === 0" style="text-align: center; padding: 40px; color: rgba(var(--v-theme-on-surface), 0.5);">
            <v-icon size="48" style="margin-bottom: 12px;">mdi-inbox-outline</v-icon>
            <p>No hay mapeos creados. Crea el primero seleccionando una receta y un producto.</p>
          </div>
        </v-card-text>
      </v-card>
    </div>
  </MainLayout>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import MainLayout from '../../components/layouts/MainLayout.vue'
import { API_BASE } from '../../utils/constants.js'

const recetas = ref([])
const productos = ref([])
const mapeos = ref([])
const recetaSeleccionada = ref('')
const productoSeleccionado = ref('')
const cargando = ref(false)

function obtenerNombreReceta(codigo) {
  return recetas.value.find(r => r.codigo === codigo)?.nombre || '—'
}

function obtenerNombreProducto(codigo) {
  return productos.value.find(p => p.codigo === codigo)?.nombre || '—'
}

async function cargarDatos() {
  try {
    cargando.value = true

    const [recetasRes, productosRes, mapeosRes] = await Promise.all([
      fetch(`${API_BASE}/recetas`).then(r => r.json()),
      fetch(`${API_BASE}/productos`).then(r => r.json()),
      fetch(`${API_BASE}/produccion/receta-producto`).then(r => r.json())
    ])

    recetas.value = (recetasRes.data || []).filter(r => r.subproducto === 'SI')
    productos.value = productosRes.data || []
    mapeos.value = mapeosRes.data || []
  } catch (e) {
    console.error('Error cargando datos:', e)
    alert('Error al cargar los datos')
  } finally {
    cargando.value = false
  }
}

async function guardarMapeo() {
  if (!recetaSeleccionada.value || !productoSeleccionado.value) {
    return
  }

  try {
    const res = await fetch(`${API_BASE}/produccion/receta-producto`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        codigo_receta: recetaSeleccionada.value,
        codigo_producto: productoSeleccionado.value
      })
    })

    if (!res.ok) {
      throw new Error('Error al guardar el mapeo')
    }

    recetaSeleccionada.value = ''
    productoSeleccionado.value = ''
    await cargarDatos()
  } catch (e) {
    console.error('Error:', e)
    alert('Error al guardar el mapeo')
  }
}

async function eliminarMapeo(codigoReceta) {
  if (!confirm('¿Está seguro de que desea eliminar este mapeo?')) return

  try {
    const res = await fetch(`${API_BASE}/produccion/receta-producto/${codigoReceta}`, {
      method: 'DELETE'
    })

    if (!res.ok) {
      throw new Error('Error al eliminar el mapeo')
    }

    await cargarDatos()
  } catch (e) {
    console.error('Error:', e)
    alert('Error al eliminar el mapeo')
  }
}

onMounted(cargarDatos)
</script>

<style scoped>
.mapeo-wrap {
  padding: 24px;
  max-width: 1200px;
  margin: 0 auto;
}

.mapeo-header {
  display: flex;
  align-items: center;
  gap: 16px;
  background: linear-gradient(135deg, #6d28d9, #8b5cf6);
  border-radius: 12px;
  padding: 20px 24px;
  margin-bottom: 30px;
}

.mapeo-header-icon {
  width: 48px;
  height: 48px;
  border-radius: 10px;
  background: rgba(255, 255, 255, 0.2);
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.mapeo-title {
  font-size: 24px;
  font-weight: 800;
  color: white;
  margin: 0;
}

.mapeo-sub {
  font-size: 13px;
  color: rgba(255, 255, 255, 0.8);
  margin: 4px 0 0 0;
}

.flex-1 {
  flex: 1;
}
</style>
