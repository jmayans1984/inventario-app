<template>
  <MainLayout>
    <div class="mod-container">

      <!-- HERO -->
      <div class="mod-hero" style="background: linear-gradient(135deg,#b45309,#92400e)">
        <div class="mod-hero-left">
          <div class="mod-hero-icon"><v-icon size="28" color="white">mdi-factory</v-icon></div>
          <div>
            <div class="mod-hero-title">PROVEEDURÍA</div>
            <div class="mod-hero-sub">Productos de venta, listas de precios y órdenes de compra</div>
          </div>
        </div>
      </div>

      <!-- SECCIÓN: CONFIGURACIÓN -->
      <div class="mod-section-label">CONFIGURACIÓN</div>
      <div class="mod-grid">
        <div class="mod-card" @click="go('/produccion/configuracion/productos-venta')">
          <div class="mod-card-icon" style="background:rgba(245,158,11,.12)">
            <v-icon size="22" color="#f59e0b">mdi-store-outline</v-icon>
          </div>
          <div class="mod-card-body">
            <div class="mod-card-title">Productos de Venta</div>
            <div class="mod-card-desc">Catálogo de productos que ofreces a tus clientes</div>
          </div>
          <v-icon size="16" color="#f59e0b" class="mod-card-arrow">mdi-arrow-right</v-icon>
        </div>

        <div class="mod-card" @click="go('/produccion/configuracion/grupo-productos')">
          <div class="mod-card-icon" style="background:rgba(245,158,11,.12)">
            <v-icon size="22" color="#f59e0b">mdi-tag-multiple-outline</v-icon>
          </div>
          <div class="mod-card-body">
            <div class="mod-card-title">Grupos de Productos</div>
            <div class="mod-card-desc">Categorías y agrupaciones de productos</div>
          </div>
          <v-icon size="16" color="#f59e0b" class="mod-card-arrow">mdi-arrow-right</v-icon>
        </div>

        <div class="mod-card" @click="go('/produccion/configuracion/lista-precios')">
          <div class="mod-card-icon" style="background:rgba(245,158,11,.12)">
            <v-icon size="22" color="#f59e0b">mdi-currency-usd</v-icon>
          </div>
          <div class="mod-card-body">
            <div class="mod-card-title">Lista de Precios</div>
            <div class="mod-card-desc">Define y actualiza precios de venta</div>
          </div>
          <v-icon size="16" color="#f59e0b" class="mod-card-arrow">mdi-arrow-right</v-icon>
        </div>
      </div>

      <!-- SECCIÓN: PROCESOS -->
      <div class="mod-section-label">PROCESOS</div>
      <div class="mod-grid">
        <div class="mod-card" @click="go('/produccion/procesos/ordenes-compra')">
          <div class="mod-card-icon" style="background:rgba(245,158,11,.12)">
            <v-icon size="22" color="#f59e0b">mdi-clipboard-play-outline</v-icon>
          </div>
          <div class="mod-card-body">
            <div class="mod-card-title">Órdenes de Compra</div>
            <div class="mod-card-desc">Gestiona órdenes de compra recibidas de clientes</div>
          </div>
          <v-icon size="16" color="#f59e0b" class="mod-card-arrow">mdi-arrow-right</v-icon>
        </div>
      </div>

      <!-- SECCIÓN: INFORMES -->
      <div class="mod-section-label">INFORMES</div>
      <div class="mod-grid">
        <div class="mod-card" @click="go('/produccion/informes/lista-precios')">
          <div class="mod-card-icon" style="background:rgba(245,158,11,.12)">
            <v-icon size="22" color="#f59e0b">mdi-file-chart-outline</v-icon>
          </div>
          <div class="mod-card-body">
            <div class="mod-card-title">Lista de Precios</div>
            <div class="mod-card-desc">Reporte imprimible de precios de venta</div>
          </div>
          <v-icon size="16" color="#f59e0b" class="mod-card-arrow">mdi-arrow-right</v-icon>
        </div>

        <div class="mod-card" @click="go('/produccion/informes/ordenes-compra')">
          <div class="mod-card-icon" style="background:rgba(245,158,11,.12)">
            <v-icon size="22" color="#f59e0b">mdi-file-document-multiple-outline</v-icon>
          </div>
          <div class="mod-card-body">
            <div class="mod-card-title">Reporte de Órdenes</div>
            <div class="mod-card-desc">Historial y estado de órdenes de compra</div>
          </div>
          <v-icon size="16" color="#f59e0b" class="mod-card-arrow">mdi-arrow-right</v-icon>
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
.mod-card:hover { border-color: #f59e0b; background: rgba(245,158,11,.03); transform: translateX(3px); }
.mod-card-icon { width: 40px; height: 40px; border-radius: 10px; display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
.mod-card-body { flex: 1; min-width: 0; }
.mod-card-title { font-size: 13px; font-weight: 700; margin-bottom: 2px; }
.mod-card-desc { font-size: 11px; color: rgba(var(--v-theme-on-surface),.5); line-height: 1.4; }
.mod-card-arrow { flex-shrink: 0; opacity: .5; transition: opacity .15s; }
.mod-card:hover .mod-card-arrow { opacity: 1; }
</style>
