<template>
  <MainLayout>
    <div class="view-container">
      <!-- BREADCRUMB -->
      <div class="breadcrumb">
        <span class="bc-root">ALMACÉN</span>
        <v-icon size="13" class="bc-sep">mdi-chevron-right</v-icon>
        <span class="bc-cat">Configuración</span>
        <v-icon size="13" class="bc-sep">mdi-chevron-right</v-icon>
        <span class="bc-current">Productos</span>
      </div>

      <!-- HEADER -->
      <div class="page-header">
        <div class="header-left">
          <div class="header-icon-wrap">
            <v-icon size="22" color="white">mdi-package-variant</v-icon>
          </div>
          <div>
            <h1 class="page-title">PRODUCTOS</h1>
            <p class="page-sub">Gestiona el catálogo de productos del almacén</p>
          </div>
        </div>
        <div class="header-actions">
          <v-btn
            color="success"
            prepend-icon="mdi-plus"
            @click="abrirFormulario()"
          >
            Nuevo Producto
          </v-btn>
        </div>
      </div>

      <!-- KPI CARDS -->
      <div class="kpi-grid">
        <div class="kpi-card">
          <div class="kpi-label">TOTAL PRODUCTOS</div>
          <div class="kpi-value">{{ store.totalProductos }}</div>
          <div class="kpi-sub">{{ store.productosActivos.length }} activos</div>
        </div>
        <div class="kpi-card">
          <div class="kpi-label">VALOR INVENTARIO</div>
          <div class="kpi-value">{{ formatMoneda(store.totalInventario) }}</div>
          <div class="kpi-sub">Valoración total</div>
        </div>
      </div>

      <!-- FILTROS -->
      <div class="filtros-bar">
        <div class="search-bar">
          <v-icon size="18" class="search-icon">mdi-magnify</v-icon>
          <input
            v-model="store.filtrosProductos.busqueda"
            type="text"
            placeholder="Buscar producto..."
            class="search-input"
          />
        </div>

        <v-select
          v-model="store.filtrosProductos.estado"
          :items="['ACTIVO', 'INACTIVO', 'TODOS']"
          label="Estado"
          variant="outlined"
          size="small"
          class="estado-select"
        />

        <v-btn
          variant="text"
          prepend-icon="mdi-refresh"
          @click="cargarProductos"
          :loading="store.loading"
        >
          Actualizar
        </v-btn>
      </div>

      <!-- TABLA DE PRODUCTOS -->
      <div class="tabla-container">
        <div class="tabla-wrapper">
          <table class="data-table">
            <thead>
              <tr>
                <th class="col-codigo">CÓDIGO</th>
                <th class="col-nombre">NOMBRE</th>
                <th class="col-categoria">CATEGORÍA</th>
                <th class="col-precio">PRECIO</th>
                <th class="col-stock">STOCK</th>
                <th class="col-valor">VALOR</th>
                <th class="col-estado">ESTADO</th>
                <th class="col-acciones">ACCIONES</th>
              </tr>
            </thead>
            <tbody>
              <tr v-if="store.productos.length === 0">
                <td colspan="8" class="tabla-empty">
                  <v-icon size="32" class="empty-icon">mdi-inbox-outline</v-icon>
                  <p class="empty-text">No hay productos registrados</p>
                </td>
              </tr>
              <tr v-for="prod in store.productos" :key="prod.id" class="tabla-row">
                <td class="col-codigo">
                  <span class="codigo-badge">{{ prod.codigo || '-' }}</span>
                </td>
                <td class="col-nombre">{{ prod.nombre }}</td>
                <td class="col-categoria">{{ prod.categoria || '-' }}</td>
                <td class="col-precio">{{ formatMoneda(prod.precio) }}</td>
                <td class="col-stock">
                  <span class="stock-text">{{ prod.stock || 0 }}</span>
                </td>
                <td class="col-valor">
                  {{ formatMoneda((prod.stock || 0) * (prod.precio || 0)) }}
                </td>
                <td class="col-estado">
                  <v-chip
                    :color="prod.estado === 'ACTIVO' ? 'success' : 'default'"
                    variant="flat"
                    size="small"
                  >
                    {{ prod.estado }}
                  </v-chip>
                </td>
                <td class="col-acciones">
                  <div class="action-buttons">
                    <v-btn
                      icon="mdi-pencil"
                      size="x-small"
                      variant="text"
                      color="primary"
                      @click="abrirFormulario(prod)"
                      title="Editar"
                    />
                    <v-btn
                      icon="mdi-delete"
                      size="x-small"
                      variant="text"
                      color="error"
                      @click="eliminarProducto(prod.id)"
                      title="Eliminar"
                    />
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <!-- ERROR -->
      <v-alert
        v-if="store.error"
        type="error"
        closable
        @click:close="store.clearError"
        class="mt-4"
      >
        {{ store.error }}
      </v-alert>
    </div>
  </MainLayout>
</template>

<script setup>
import { onMounted } from 'vue'
import MainLayout from '../../components/layouts/MainLayout.vue'
import { useAlmacenStore } from '../../stores/almacen'
import { formatMoneda } from '../../utils/formatters'

const store = useAlmacenStore()

async function cargarProductos() {
  await store.fetchProductos(store.filtrosProductos)
}

function abrirFormulario(producto = null) {
  // TODO: Implementar modal de formulario
  alert('Formulario: ' + (producto ? 'Editar ' + producto.nombre : 'Crear nuevo producto'))
}

async function eliminarProducto(id) {
  if (confirm('¿Eliminar este producto?')) {
    await store.eliminarProducto(id)
  }
}

onMounted(async () => {
  await cargarProductos()
})
</script>

<style scoped>
.view-container { padding: 24px; max-width: 1400px; margin: 0 auto; }

.breadcrumb { display: flex; align-items: center; gap: 6px; margin-bottom: 20px; }

.bc-root { font-size: 12px; font-weight: 700; color: #06b6d4; text-transform: uppercase; letter-spacing: 0.5px; }

.bc-sep { color: rgba(var(--v-theme-on-surface), 0.3); }

.bc-cat { font-size: 12px; color: rgba(var(--v-theme-on-surface), 0.5); }

.bc-current { font-size: 12px; color: rgba(var(--v-theme-on-surface), 0.8); font-weight: 500; }

.page-header { display: flex; align-items: center; justify-content: space-between; margin-bottom: 24px; }

.header-left { display: flex; align-items: center; gap: 16px; }

.header-icon-wrap { width: 48px; height: 48px; border-radius: 12px; background: linear-gradient(135deg, #06b6d4, #0891b2); display: flex; align-items: center; justify-content: center; box-shadow: 0 4px 14px rgba(6, 182, 212, 0.35); }

.page-title { font-size: 20px; font-weight: 800; letter-spacing: 0.5px; margin: 0; }

.page-sub { font-size: 13px; color: rgba(var(--v-theme-on-surface), 0.5); margin: 2px 0 0; }

.kpi-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 16px; margin-bottom: 24px; }

.kpi-card { background: rgb(var(--v-theme-surface)); border: 1px solid rgba(var(--v-theme-on-surface), 0.08); border-radius: 12px; padding: 20px; text-align: center; }

.kpi-label { font-size: 11px; font-weight: 700; color: rgba(var(--v-theme-on-surface), 0.5); text-transform: uppercase; letter-spacing: 0.5px; }

.kpi-value { font-size: 28px; font-weight: 800; color: #06b6d4; margin: 8px 0; }

.kpi-sub { font-size: 12px; color: rgba(var(--v-theme-on-surface), 0.6); }

.filtros-bar { display: flex; gap: 12px; align-items: center; margin-bottom: 20px; flex-wrap: wrap; }

.search-bar { display: flex; align-items: center; gap: 8px; padding: 8px 12px; background: rgba(var(--v-theme-on-surface), 0.03); border-radius: 8px; border: 1px solid rgba(var(--v-theme-on-surface), 0.08); flex: 1; min-width: 250px; }

.search-icon { color: rgba(var(--v-theme-on-surface), 0.4); }

.search-input { flex: 1; border: none; background: transparent; outline: none; font-size: 14px; }

.search-input::placeholder { color: rgba(var(--v-theme-on-surface), 0.4); }

.estado-select { min-width: 150px; }

.tabla-container { background: rgb(var(--v-theme-surface)); border-radius: 12px; border: 1px solid rgba(var(--v-theme-on-surface), 0.08); overflow: hidden; }

.tabla-wrapper { overflow-x: auto; }

.data-table { width: 100%; border-collapse: collapse; font-size: 13px; }

.data-table thead { background: rgba(var(--v-theme-on-surface), 0.04); }

.data-table thead th { padding: 12px 10px; text-align: left; font-weight: 700; font-size: 11px; letter-spacing: 0.5px; text-transform: uppercase; color: rgba(var(--v-theme-on-surface), 0.6); border-bottom: 1px solid rgba(var(--v-theme-on-surface), 0.08); }

.data-table tbody tr { border-bottom: 1px solid rgba(var(--v-theme-on-surface), 0.05); }

.data-table tbody tr:hover { background: rgba(var(--v-theme-on-surface), 0.02); }

.data-table tbody td { padding: 11px 10px; color: rgb(var(--v-theme-on-surface)); }

.col-codigo { width: 90px; }
.col-nombre { width: 25%; }
.col-categoria { width: 15%; }
.col-precio { width: 100px; text-align: right; }
.col-stock { width: 80px; text-align: center; }
.col-valor { width: 100px; text-align: right; }
.col-estado { width: 100px; }
.col-acciones { width: 90px; text-align: center; }

.codigo-badge { background: rgba(6, 182, 212, 0.15); color: #06b6d4; padding: 3px 8px; border-radius: 6px; font-weight: 600; font-size: 12px; }

.stock-text { font-weight: 600; font-family: 'Courier New', monospace; }

.action-buttons { display: flex; gap: 4px; justify-content: center; }

.tabla-empty { text-align: center !important; padding: 40px !important; }

.empty-icon { color: rgba(var(--v-theme-on-surface), 0.2); display: block; margin: 0 auto 8px; }

.empty-text { color: rgba(var(--v-theme-on-surface), 0.4); font-size: 14px; margin: 0; }
</style>
