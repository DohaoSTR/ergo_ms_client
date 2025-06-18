<template>
  <div>
    <div class="card-body p-0 position-relative">
      <div v-if="!components.length" class="text-muted text-center alert alert-danger" role="alert">
        Пустая страница!
      </div>
      <div v-else>
        <RecursiveRenderer v-for="comp in components" :key="comp.uid" :component="comp" />
      </div>
    </div>
  </div>
</template>

<script setup>
import RecursiveRenderer from './editor/RecursiveRenderer.vue'

defineProps({
  components: {
    type: Array,
    required: true,
  },
})
</script>
<style scoped>
.card-body {
  min-height: 100vh;
}
</style>