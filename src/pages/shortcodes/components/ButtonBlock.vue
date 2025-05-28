<script setup>
const props = defineProps({
  component: { type: Object, required: true }
})
</script>

<template>
  <button
    :class="['btn', 'btn-' + (component.extra_data.variant || 'primary'), ...component.class_list]"
    @click="component.extra_data.onClick?.()"
  >
    {{ component.extra_data.text }}
  </button>
</template>
