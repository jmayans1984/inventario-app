<template>
  <div class="page-header">
    <div v-if="crumbs.length" class="page-crumbs">
      <template v-for="(c, i) in crumbs" :key="i">
        <span class="crumb" :class="{ 'crumb--last': i === crumbs.length - 1 }">{{ c }}</span>
        <v-icon v-if="i < crumbs.length - 1" size="12" class="crumb-sep">mdi-chevron-right</v-icon>
      </template>
    </div>
    <div class="page-header-row">
      <div class="page-header-left">
        <h1 class="page-title">{{ title }}</h1>
        <p v-if="description" class="page-description">{{ description }}</p>
      </div>
      <div v-if="$slots.actions" class="page-header-actions">
        <slot name="actions" />
      </div>
    </div>
  </div>
</template>

<script setup>
defineProps({
  title: { type: String, required: true },
  description: { type: String, default: '' },
  /** Migas de pan, ej. ["Contabilidad", "Procesos", "Gestión de Gastos"] */
  crumbs: { type: Array, default: () => [] },
})
</script>

<style scoped>
.page-header { margin-bottom: var(--space-lg); }

.page-crumbs {
  display: flex;
  align-items: center;
  gap: 5px;
  margin-bottom: var(--space-sm);
}
.crumb {
  font-size: var(--text-xs);
  font-weight: 600;
  letter-spacing: 0.4px;
  color: var(--ink-400);
  text-transform: uppercase;
}
.crumb--last { color: var(--ink-600); }
.crumb-sep { color: var(--ink-400); opacity: 0.6; }

.page-header-row {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: var(--space-lg);
  flex-wrap: wrap;
}
.page-header-left { min-width: 0; }
.page-title {
  font-size: var(--text-2xl);
  font-weight: 700;
  letter-spacing: -0.3px;
  color: var(--ink-900);
  line-height: 1.2;
}
.page-description {
  font-size: var(--text-base);
  color: var(--ink-600);
  margin-top: 4px;
}
.page-header-actions {
  display: flex;
  align-items: center;
  gap: var(--space-sm);
  flex-shrink: 0;
}

@media (max-width: 640px) {
  .page-title { font-size: var(--text-xl); }
  .page-header-actions { width: 100%; }
}
</style>
