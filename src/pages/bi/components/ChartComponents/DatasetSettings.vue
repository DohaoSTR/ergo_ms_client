<template>
  <div v-if="!dataset" style="height: 100%;">
    <div class="alert alert-info" style="height: 100%; text-align: center; display: flex; justify-content: center; align-items: center; flex-direction: column; gap: 10px;">
      <CircleAlert :size="40" class="me-1" />Прежде чем увидеть содержимое, добавьте датасет
    </div>
  </div>
  <div v-else style="height: 100%; display: flex; justify-content: center; align-items: center; color: var(--color-secondary-text);">
    <i>Параметры не найдены</i>
  </div>
</template>

<script setup>
    import { CircleAlert } from 'lucide-vue-next'
    const props = defineProps({ dataset: Object })
</script>