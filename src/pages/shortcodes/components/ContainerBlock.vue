<script setup>
import RecursiveRenderer from '../editor/RecursiveRenderer.vue'

const {component} = defineProps({
  component: { type: Object, required: true }
})
</script>

<template>
  <div :class="[component.class_list,component.extra_data.align,'border']">
    <p v-if="component.extra_data.text">{{ component.extra_data.text }}</p>
    <!-- рекурсия по дочерним элементам -->
    <div v-if="component.children?.length" class="border">
      <RecursiveRenderer
        v-for="child in component.children"
        :key="child.uid"
        :component="child"
      />
    </div>
  </div>
</template>
