<template>
  <MainLayout>
    <div class="mod-container">

      <!-- HERO -->
      <div class="mod-hero" style="background: linear-gradient(135deg, var(--gold), color-mix(in srgb, var(--gold) 60%, black))">
        <div class="mod-hero-left">
          <div class="mod-hero-icon"><v-icon size="28" color="white">mdi-chef-hat</v-icon></div>
          <div>
            <div class="mod-hero-title">RECETAS</div>
            <div class="mod-hero-sub">Estandarización de recetas, subrecetas, costos y artículos</div>
          </div>
        </div>
      </div>

      <div class="mod-nav-top">
        <button class="mod-personalizar" @click="dialogAbierto = true">
          <v-icon size="14">mdi-tune-variant</v-icon>
          Personalizar accesos
        </button>
      </div>

      <template v-for="sec in secciones" :key="sec.label">
        <div class="mod-section-label">{{ sec.label }}</div>
        <div class="mod-grid">
          <div v-for="item in sec.items" :key="item.path" class="mod-card" @click="go(item.path)">
            <div class="mod-card-icon" style="background:var(--gold-wash)">
              <v-icon size="22" color="warning">{{ item.icon }}</v-icon>
            </div>
            <div class="mod-card-body">
              <div class="mod-card-title">{{ item.title }}</div>
              <div class="mod-card-desc">{{ item.desc }}</div>
            </div>
            <v-icon size="16" color="warning" class="mod-card-arrow">mdi-arrow-right</v-icon>
          </div>
        </div>
      </template>

      <PersonalizarAtajosDialog
        v-model="dialogAbierto"
        :secciones="seccionesTodas"
        @guardar="guardar"
        @restablecer="restablecer"
      />
    </div>
  </MainLayout>
</template>

<script setup>
import { useRouter } from 'vue-router'
import MainLayout from '../components/layouts/MainLayout.vue'
import PersonalizarAtajosDialog from '../components/common/PersonalizarAtajosDialog.vue'
import { useAtajosModulo } from '../composables/useAtajosModulo'
const router = useRouter()
const go = (path) => router.push(path)

const seccionesBase = [
  {
    label: 'CONFIGURACIÓN',
    items: [
      { path: '/recetas/configuracion/catalogo',  icon: 'mdi-book-open-variant-outline', title: 'Catálogo de Recetas', desc: 'Crea y gestiona recetas con subrecetas jerárquicas' },
      { path: '/recetas/configuracion/articulos', icon: 'mdi-food-apple-outline',        title: 'Artículos e Insumos', desc: 'Gestiona ingredientes y precios de compra' },
      { path: '/recetas/configuracion/precios',   icon: 'mdi-tag-outline',               title: 'Precios de Venta',    desc: 'Configura precios de venta de las recetas' },
    ],
  },
  {
    label: 'PROCESOS',
    items: [
      { path: '/recetas/procesos/costos', icon: 'mdi-calculator-variant-outline', title: 'Gestión de Costos', desc: 'Recalcula costos de todas las recetas automáticamente' },
    ],
  },
  {
    label: 'REPORTES',
    items: [
      { path: '/recetas/reportes/costos', icon: 'mdi-file-chart-outline',    title: 'Reporte de Costos', desc: 'Análisis de costos, márgenes y % por receta' },
      { path: '/recetas/reportes/fichas', icon: 'mdi-file-document-outline', title: 'Fichas Técnicas',   desc: 'Visualiza e imprime fichas técnicas de recetas' },
    ],
  },
]

const { secciones, seccionesTodas, dialogAbierto, guardar, restablecer } =
  useAtajosModulo('recetas', seccionesBase)
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
.mod-card:hover { border-color: var(--gold); background: color-mix(in srgb, var(--gold) 4%, transparent); transform: translateX(3px); }
.mod-card-icon { width: 40px; height: 40px; border-radius: 10px; display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
.mod-card-body { flex: 1; min-width: 0; }
.mod-card-title { font-size: 13px; font-weight: 700; margin-bottom: 2px; }
.mod-card-desc { font-size: 11px; color: rgba(var(--v-theme-on-surface),.5); line-height: 1.4; }
.mod-card-arrow { flex-shrink: 0; opacity: .5; transition: opacity .15s; }
.mod-card:hover .mod-card-arrow { opacity: 1; }
</style>
