<script setup>
const { component } = defineProps({ component: Object })
</script>

<template>
  <footer :class="component.class_list">
    <div class="container text-center">
      <slot>
        {{ component.extra_data.text || '© ' + new Date().getFullYear() }}
      </slot>
      <RecursiveRenderer v-for="child in component.children" :key="child.uid" :component="child" />
    </div>
  </footer>
</template>
