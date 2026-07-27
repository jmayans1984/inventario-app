<template>
  <span class="status-badge" :class="`status-badge--${tone}`" :style="customColor ? customStyle : null">
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
})

const customColor = computed(() => !!props.color)
const customStyle = computed(() => ({
  background: `color-mix(in srgb, ${props.color} 16%, transparent)`,
  color: props.color,
}))
</script>

<style scoped>
.status-badge {
  display: inline-flex;
  align-items: center;
  padding: 3px 9px;
  border-radius: var(--radius-sm);
  font-size: 11px;
  font-weight: 700;
  line-height: 1.4;
  white-space: nowrap;
}

.status-badge--success { background: rgba(var(--v-theme-success), 0.15); color: rgb(var(--v-theme-success)); }
.status-badge--warning  { background: rgba(var(--v-theme-warning), 0.15); color: rgb(var(--v-theme-warning)); }
.status-badge--error    { background: rgba(var(--v-theme-error), 0.15); color: rgb(var(--v-theme-error)); }
.status-badge--info     { background: rgba(var(--v-theme-info), 0.15); color: rgb(var(--v-theme-info)); }
.status-badge--neutral  { background: rgba(var(--v-theme-on-surface), 0.1); color: rgba(var(--v-theme-on-surface), 0.6); }
</style>
