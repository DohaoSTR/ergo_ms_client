<template>
  <div class="text-danger">
    Неизвестный шорткод: {{ component.component_type }}
  </div>
</template>

<script setup>
defineOptions({ name: 'UnknownShortcode' })

const props = defineProps({
  component: {
    type: Object,
    required: true
  }
})
</script>
