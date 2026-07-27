<template>
  <div class="kpi-card stagger-in" :style="{ '--stagger-index': index }">
    <div class="kpi-top">
      <div class="kpi-icon-wrap" :style="{ background: `color-mix(in srgb, ${color} 14%, transparent)`, color }">
        <v-icon size="20">{{ icon }}</v-icon>
      </div>
      <span v-if="trend" class="kpi-trend" :class="trendDirection">
        <v-icon size="13">{{ trendDirection === 'kpi-trend--up' ? 'mdi-trending-up' : trendDirection === 'kpi-trend--down' ? 'mdi-trending-down' : 'mdi-trending-neutral' }}</v-icon>
        {{ trend }}
      </span>
    </div>
    <p class="kpi-label">{{ label }}</p>
    <p class="kpi-value num-mono" :style="valueColor ? { color: valueColor } : null">{{ value }}</p>
    <p v-if="hint" class="kpi-hint">{{ hint }}</p>
  </div>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({
  label: { type: String, required: true },
  value: { type: [String, Number], required: true },
  icon: { type: String, required: true },
  color: { type: String, default: 'var(--gold)' },
  /** Color opcional solo para el valor (por defecto usa el color de texto normal) */
  valueColor: { type: String, default: '' },
  hint: { type: String, default: '' },
  /** Texto de tendencia opcional, ej. "+12% vs mes anterior" */
  trend: { type: String, default: '' },
  trendUp: { type: Boolean, default: null },
  /** Índice para escalonar la animación de entrada dentro de una grilla */
  index: { type: Number, default: 0 },
})

const trendDirection = computed(() => {
  if (props.trendUp === true) return 'kpi-trend--up'
  if (props.trendUp === false) return 'kpi-trend--down'
  return 'kpi-trend--neutral'
})
</script>

<style scoped>
.kpi-card {
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: var(--radius-lg);
  padding: var(--space-md);
  transition: border-color var(--dur-base) var(--ease-out), box-shadow var(--dur-base) var(--ease-out), transform var(--dur-base) var(--ease-out);
}
.kpi-card:hover {
  border-color: var(--border-strong);
  box-shadow: var(--shadow-md);
  transform: translateY(-2px);
}
@media (prefers-reduced-motion: reduce) {
  .kpi-card { transition: none; }
  .kpi-card:hover { transform: none; }
}

.kpi-top {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: var(--space-sm);
}

.kpi-icon-wrap {
  width: 40px;
  height: 40px;
  border-radius: var(--radius-md);
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.kpi-trend {
  display: inline-flex;
  align-items: center;
  gap: 2px;
  font-size: var(--text-xs);
  font-weight: 700;
  font-family: var(--font-mono);
}
.kpi-trend--up { color: var(--success); }
.kpi-trend--down { color: var(--error); }
.kpi-trend--neutral { color: var(--ink-400); }

.kpi-label {
  font-size: var(--text-xs);
  font-weight: 700;
  letter-spacing: 0.5px;
  text-transform: uppercase;
  color: var(--ink-600);
  margin: 0;
}
.kpi-value {
  font-size: var(--text-2xl);
  font-weight: 600;
  color: var(--ink-900);
  margin: 4px 0 0;
  line-height: 1.15;
}
.kpi-hint {
  font-size: var(--text-xs);
  color: var(--ink-400);
  margin: 4px 0 0;
}
</style>
