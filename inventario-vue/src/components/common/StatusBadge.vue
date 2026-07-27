<template>
  <span class="status-badge" :class="`status-badge--${tone}`" :style="customColor ? customStyle : null">
    <span v-if="dot" class="status-dot" />
    {{ label }}
  </span>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({
  label: { type: String, required: true },
  /** success | warning | error | info | neutral */
  tone: { type: String, default: 'neutral' },
  /** Color hex custom, cuando ninguno de los tonos semánticos aplica (p.ej. badges de categoría) */
  color: { type: String, default: '' },
  /** Punto de color a la izquierda (patrón "pill" tipo Linear) */
  dot: { type: Boolean, default: false },
})

const customColor = computed(() => !!props.color)
const customStyle = computed(() => ({
  background: `color-mix(in srgb, ${props.color} 14%, transparent)`,
  color: props.color,
}))
</script>

<style scoped>
.status-badge {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  padding: 3px 9px;
  border-radius: var(--radius-full);
  font-size: var(--text-xs);
  font-weight: 700;
  line-height: 1.4;
  white-space: nowrap;
}
.status-dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: currentColor;
  flex-shrink: 0;
}

.status-badge--success { background: var(--success-wash); color: var(--success); }
.status-badge--warning  { background: var(--warning-wash); color: var(--warning); }
.status-badge--error    { background: var(--error-wash); color: var(--error); }
.status-badge--info     { background: var(--info-wash); color: var(--info); }
.status-badge--neutral  { background: var(--surface-sunken); color: var(--ink-600); }
</style>
