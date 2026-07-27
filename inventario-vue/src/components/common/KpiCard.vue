<template>
  <div class="kpi-card">
    <div class="kpi-icon-wrap" :style="{ background: `color-mix(in srgb, ${color} 16%, transparent)`, color }">
      <v-icon size="22">{{ icon }}</v-icon>
    </div>
    <div class="kpi-content">
      <p class="kpi-label">{{ label }}</p>
      <p class="kpi-value num-tabular" :style="valueColor ? { color: valueColor } : null">{{ value }}</p>
      <p v-if="hint" class="kpi-hint">{{ hint }}</p>
    </div>
  </div>
</template>

<script setup>
defineProps({
  label: { type: String, required: true },
  value: { type: [String, Number], required: true },
  icon: { type: String, required: true },
  color: { type: String, default: 'var(--accent-blue)' },
  /** Color opcional solo para el valor (por defecto usa el color de texto normal) */
  valueColor: { type: String, default: '' },
  hint: { type: String, default: '' },
})
</script>

<style scoped>
.kpi-card {
  background: rgb(var(--v-theme-surface));
  border: 1px solid rgba(var(--v-theme-on-surface), 0.08);
  border-radius: var(--radius-lg);
  padding: var(--space-md);
  display: flex;
  align-items: center;
  gap: var(--space-md);
  transition: border-color 160ms var(--ease-out), box-shadow 160ms var(--ease-out), transform 160ms var(--ease-out);
}
.kpi-card:hover {
  border-color: rgba(var(--v-theme-on-surface), 0.14);
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.08);
  transform: translateY(-1px);
}
@media (prefers-reduced-motion: reduce) {
  .kpi-card { transition: none; }
  .kpi-card:hover { transform: none; }
}

.kpi-icon-wrap {
  width: 48px;
  height: 48px;
  border-radius: var(--radius-md);
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.kpi-content { flex: 1; min-width: 0; }
.kpi-label {
  font-size: 11px;
  font-weight: 700;
  letter-spacing: 0.6px;
  text-transform: uppercase;
  color: rgba(var(--v-theme-on-surface), 0.5);
  margin: 0;
}
.kpi-value {
  font-size: 22px;
  font-weight: 800;
  color: rgb(var(--v-theme-on-surface));
  margin: 4px 0 0;
  line-height: 1.1;
}
.kpi-hint {
  font-size: 11px;
  color: rgba(var(--v-theme-on-surface), 0.45);
  margin: 3px 0 0;
}
</style>
