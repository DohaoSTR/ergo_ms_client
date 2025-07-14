<script setup>
import { computed } from 'vue'
import { componentMap, defaultRenderer } from '../js'

defineOptions({ name: 'RecursiveRenderer' })

const { component } = defineProps({
  component: { type: Object, required: true },
})

const SelectedRenderer = computed(() => {
  return componentMap[component.component_type] || defaultRenderer
})
</script>

<template>
  <component :is="SelectedRenderer" :component="component" />
</template>
