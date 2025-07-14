<script setup>
import { computed } from 'vue'
import RecursiveRenderer from '../editor/RecursiveRenderer.vue'

const props = defineProps({
  component: { type: Object, required: true },
})

/* кастомная ширина, если передали extra_data.max_width */
const maxW = computed(
  () => props.component.extra_data?.max_width || '100vw'
)
</script>

<template>
  <div :class="[
    props.component.class_list,
    'mx-auto py-3 px-2',
    'd-flex flex-wrap gap-3',
    'border'
  ]" :style="{ maxWidth: maxW }">
    <RecursiveRenderer v-for="child in props.component.children || []" :key="child.uid" :component="child" />
  </div>
</template>
