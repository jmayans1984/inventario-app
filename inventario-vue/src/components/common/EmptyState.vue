<template>
  <div class="empty-state">
    <div class="empty-icon-wrap">
      <v-icon size="28">{{ icon }}</v-icon>
    </div>
    <p class="empty-title">{{ title }}</p>
    <p v-if="description" class="empty-description">{{ description }}</p>
    <div v-if="$slots.action" class="empty-action">
      <slot name="action" />
    </div>
  </div>
</template>

<script setup>
defineProps({
  icon: { type: String, default: 'mdi-inbox-outline' },
  title: { type: String, required: true },
  description: { type: String, default: '' },
})
</script>

<style scoped>
.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  padding: var(--space-2xl) var(--space-lg);
}
.empty-icon-wrap {
  width: 56px;
  height: 56px;
  border-radius: var(--radius-lg);
  background: var(--surface-sunken);
  color: var(--ink-400);
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: var(--space-md);
}
.empty-title {
  font-size: var(--text-md);
  font-weight: 700;
  color: var(--ink-700);
}
.empty-description {
  font-size: var(--text-sm);
  color: var(--ink-400);
  margin-top: 4px;
  max-width: 360px;
}
.empty-action { margin-top: var(--space-md); }
</style>
