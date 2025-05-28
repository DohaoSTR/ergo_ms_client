<template>
  <div class="card shadow-sm mb-4">
    <div class="card-header bg-primary text-white d-flex align-items-center">
      <ScanEye class="me-2" />
      <h5 class="mb-0">Предпросмотр</h5>
    </div>
    <div class="card-body p-0 position-relative">
      <div v-if="!components.length" class="text-muted text-center alert alert-danger" role="alert">
        Здесь будет предпросмотр вашей страницы
      </div>

      <div v-else>
        <RecursiveRenderer v-for="comp in components" :key="comp.uid" :component="comp" />
      </div>
    </div>
  </div>
</template>

<script setup>
import { ScanEye } from 'lucide-vue-next'
import RecursiveRenderer from './RecursiveRenderer.vue'

const props = defineProps({
  components: {
    type: Array,
    required: true,
  },
})
</script>
<style scoped>
.card-body {
  min-height: 500px;
  border: 1px solid var(--bs-primary);
}
</style>
