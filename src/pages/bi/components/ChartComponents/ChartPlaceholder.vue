<template>
  <div class="empty-chart">
    <div class="alert alert-info info-box">
      <CircleAlert :size="40" class="me-1" />Прежде чем увидеть содержимое, добавьте датасет
    </div>
  </div>
</template>
<script setup>
import { CircleAlert } from 'lucide-vue-next'
</script>
<style scoped>
.empty-chart .info-box {
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  text-align: center;
  gap: 10px;
}
</style>