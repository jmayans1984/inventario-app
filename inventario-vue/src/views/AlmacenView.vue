<template>
  <MainLayout>
    <div class="mod-container">

      <!-- HERO -->
      <div class="mod-hero" style="background: linear-gradient(135deg,#047857,#065f46)">
        <div class="mod-hero-left">
          <div class="mod-hero-icon"><v-icon size="28" color="white">mdi-warehouse</v-icon></div>
          <div>
            <div class="mod-hero-title">ALMACÉN</div>
            <div class="mod-hero-sub">Control de inventario, stock, toma física y órdenes de compra</div>
          </div>
        </div>
      </div>

      <!-- SECCIÓN: CONFIGURACIÓN -->
      <div class="mod-section-label">CONFIGURACIÓN</div>
      <div class="mod-grid">
        <div class="mod-card" @click="go('/almacen/configuracion/productos')">
          <div class="mod-card-icon" style="background:rgba(16,185,129,.12)">
            <v-icon size="22" color="#10b981">mdi-package-variant</v-icon>
          </div>
          <div class="mod-card-body">
            <div class="mod-card-title">Productos</div>
            <div class="mod-card-desc">Catálogo de productos del inventario</div>
          </div>
          <v-icon size="16" color="#10b981" class="mod-card-arrow">mdi-arrow-right</v-icon>
        </div>

        <div class="mod-card" @click="go('/almacen/configuracion/control-inventario')">
          <div class="mod-card-icon" style="background:rgba(16,185,129,.12)">
            <v-icon size="22" color="#10b981">mdi-tune-vertical</v-icon>
          </div>
          <div class="mod-card-body">
            <div class="mod-card-title">Control de Inventario</div>
            <div class="mod-card-desc">Parámetros y niveles de stock mínimo</div>
          </div>
          <v-icon size="16" color="#10b981" class="mod-card-arrow">mdi-arrow-right</v-icon>
        </div>

        <div class="mod-card" @click="go('/almacen/configuracion/impresion-barcodes')">
          <div class="mod-card-icon" style="background:rgba(16,185,129,.12)">
            <v-icon size="22" color="#10b981">mdi-barcode</v-icon>
          </div>
          <div class="mod-card-body">
            <div class="mod-card-title">Impresión de Códigos de Barras</div>
            <div class="mod-card-desc">Etiquetas con nombre y código del producto</div>
          </div>
          <v-icon size="16" color="#10b981" class="mod-card-arrow">mdi-arrow-right</v-icon>
        </div>

        <div class="mod-card" @click="go('/almacen/configuracion/grupo-productos')">
          <div class="mod-card-icon" style="background:rgba(16,185,129,.12)">
            <v-icon size="22" color="#10b981">mdi-folder-multiple-outline</v-icon>
          </div>
          <div class="mod-card-body">
            <div class="mod-card-title">Grupo de Productos</div>
            <div class="mod-card-desc">Categorías para organizar el catálogo</div>
          </div>
          <v-icon size="16" color="#10b981" class="mod-card-arrow">mdi-arrow-right</v-icon>
        </div>
      </div>

      <!-- SECCIÓN: PROCESOS -->
      <div class="mod-section-label">PROCESOS</div>
      <div class="mod-grid">
        <div class="mod-card" @click="go('/almacen/procesos/gestion-inventario')">
          <div class="mod-card-icon" style="background:rgba(16,185,129,.12)">
            <v-icon size="22" color="#10b981">mdi-clipboard-list-outline</v-icon>
          </div>
          <div class="mod-card-body">
            <div class="mod-card-title">Gestión de Inventario</div>
            <div class="mod-card-desc">Entradas, salidas y ajustes de stock</div>
          </div>
          <v-icon size="16" color="#10b981" class="mod-card-arrow">mdi-arrow-right</v-icon>
        </div>

        <div class="mod-card" @click="go('/almacen/procesos/toma-fisica')">
          <div class="mod-card-icon" style="background:rgba(16,185,129,.12)">
            <v-icon size="22" color="#10b981">mdi-barcode-scan</v-icon>
          </div>
          <div class="mod-card-body">
            <div class="mod-card-title">Toma Física</div>
            <div class="mod-card-desc">Conteo físico de inventario y ajustes</div>
          </div>
          <v-icon size="16" color="#10b981" class="mod-card-arrow">mdi-arrow-right</v-icon>
        </div>

        <div class="mod-card" @click="go('/almacen/procesos/valoracion')">
          <div class="mod-card-icon" style="background:rgba(16,185,129,.12)">
            <v-icon size="22" color="#10b981">mdi-currency-usd</v-icon>
          </div>
          <div class="mod-card-body">
            <div class="mod-card-title">Valoración</div>
            <div class="mod-card-desc">Valor del inventario por costo promedio</div>
          </div>
          <v-icon size="16" color="#10b981" class="mod-card-arrow">mdi-arrow-right</v-icon>
        </div>

        <div class="mod-card" @click="go('/almacen/procesos/ordenes-compra')">
          <div class="mod-card-icon" style="background:rgba(16,185,129,.12)">
            <v-icon size="22" color="#10b981">mdi-cart-outline</v-icon>
          </div>
          <div class="mod-card-body">
            <div class="mod-card-title">Órdenes de Compra</div>
            <div class="mod-card-desc">Gestiona órdenes de compra a proveedores</div>
          </div>
          <v-icon size="16" color="#10b981" class="mod-card-arrow">mdi-arrow-right</v-icon>
        </div>
      </div>

      <!-- SECCIÓN: REPORTES -->
      <div class="mod-section-label">REPORTES</div>
      <div class="mod-grid">
        <div class="mod-card" @click="go('/almacen/reportes/kardex')">
          <div class="mod-card-icon" style="background:rgba(16,185,129,.12)">
            <v-icon size="22" color="#10b981">mdi-file-chart-outline</v-icon>
          </div>
          <div class="mod-card-body">
            <div class="mod-card-title">Kardex</div>
            <div class="mod-card-desc">Movimientos históricos por producto</div>
          </div>
          <v-icon size="16" color="#10b981" class="mod-card-arrow">mdi-arrow-right</v-icon>
        </div>

        <div class="mod-card" @click="go('/almacen/reportes/consumos')">
          <div class="mod-card-icon" style="background:rgba(16,185,129,.12)">
            <v-icon size="22" color="#10b981">mdi-chart-bar</v-icon>
          </div>
          <div class="mod-card-body">
            <div class="mod-card-title">Reporte de Consumos</div>
            <div class="mod-card-desc">Consumo de productos por período</div>
          </div>
          <v-icon size="16" color="#10b981" class="mod-card-arrow">mdi-arrow-right</v-icon>
        </div>

        <div class="mod-card" @click="go('/almacen/reportes/consumo-insumos')">
          <div class="mod-card-icon" style="background:rgba(16,185,129,.12)">
            <v-icon size="22" color="#10b981">mdi-package-down</v-icon>
          </div>
          <div class="mod-card-body">
            <div class="mod-card-title">Consumo de Insumos</div>
            <div class="mod-card-desc">Traslados desde bodega maestra por período</div>
          </div>
          <v-icon size="16" color="#10b981" class="mod-card-arrow">mdi-arrow-right</v-icon>
        </div>

        <div class="mod-card" @click="go('/almacen/reportes/movimiento-producto')">
          <div class="mod-card-icon" style="background:rgba(16,185,129,.12)">
            <v-icon size="22" color="#10b981">mdi-swap-vertical-bold</v-icon>
          </div>
          <div class="mod-card-body">
            <div class="mod-card-title">Movimiento por Producto</div>
            <div class="mod-card-desc">Detalle día a día por rango de fechas y CC</div>
          </div>
          <v-icon size="16" color="#10b981" class="mod-card-arrow">mdi-arrow-right</v-icon>
        </div>

        <div class="mod-card" @click="go('/almacen/reportes/kardex-consolidado')">
          <div class="mod-card-icon" style="background:rgba(16,185,129,.12)">
            <v-icon size="22" color="#10b981">mdi-table-multiple</v-icon>
          </div>
          <div class="mod-card-body">
            <div class="mod-card-title">Kardex Consolidado</div>
            <div class="mod-card-desc">Stock actual detallado por centro de costos</div>
          </div>
          <v-icon size="16" color="#10b981" class="mod-card-arrow">mdi-arrow-right</v-icon>
        </div>

        <div class="mod-card" @click="go('/almacen/reportes/prediccion-agotamiento')">
          <div class="mod-card-icon" style="background:rgba(220,38,38,.12)">
            <v-icon size="22" color="#dc2626">mdi-chart-line</v-icon>
          </div>
          <div class="mod-card-body">
            <div class="mod-card-title">Predicción Agotamiento</div>
            <div class="mod-card-desc">Cuándo se acabará el stock según consumo</div>
          </div>
          <v-icon size="16" color="#dc2626" class="mod-card-arrow">mdi-arrow-right</v-icon>
        </div>
      </div>

    </div>
  </MainLayout>
</template>

<script setup>
import { useRouter } from 'vue-router'
import MainLayout from '../components/layouts/MainLayout.vue'
const router = useRouter()
const go = (path) => router.push(path)
</script>

<style scoped>
.mod-container { padding: 24px; max-width: 1200px; margin: 0 auto; }
.mod-hero { border-radius: 16px; padding: 24px 28px; margin-bottom: 28px; display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: 16px; }
.mod-hero-left { display: flex; align-items: center; gap: 16px; }
.mod-hero-icon { width: 52px; height: 52px; border-radius: 13px; background: rgba(255,255,255,.18); display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
.mod-hero-title { font-size: 22px; font-weight: 900; color: white; letter-spacing: .5px; }
.mod-hero-sub { font-size: 13px; color: rgba(255,255,255,.7); margin-top: 3px; }
.mod-section-label { font-size: 10px; font-weight: 800; letter-spacing: 1.2px; text-transform: uppercase; color: rgba(var(--v-theme-on-surface),.35); margin: 20px 0 10px; }
.mod-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(260px, 1fr)); gap: 10px; margin-bottom: 4px; }
.mod-card { display: flex; align-items: center; gap: 14px; padding: 14px 16px; border-radius: 12px; background: rgb(var(--v-theme-surface)); border: 1px solid rgba(var(--v-theme-on-surface),.07); cursor: pointer; transition: all .15s; }
.mod-card:hover { border-color: #10b981; background: rgba(16,185,129,.03); transform: translateX(3px); }
.mod-card-icon { width: 40px; height: 40px; border-radius: 10px; display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
.mod-card-body { flex: 1; min-width: 0; }
.mod-card-title { font-size: 13px; font-weight: 700; margin-bottom: 2px; }
.mod-card-desc { font-size: 11px; color: rgba(var(--v-theme-on-surface),.5); line-height: 1.4; }
.mod-card-arrow { flex-shrink: 0; opacity: .5; transition: opacity .15s; }
.mod-card:hover .mod-card-arrow { opacity: 1; }
</style>
