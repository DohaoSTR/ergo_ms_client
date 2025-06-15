<template>
  <div class="empty-chart" v-if="text">
    <div class="alert alert-info info-box">
      <CircleAlert :size="40" class="me-1" />
      {{ text }}
    </div>
  </div>
</template>

<script setup>
import { CircleAlert } from 'lucide-vue-next'
import { computed } from 'vue'

const props = defineProps({
  code:  { type: String, default: '' }
})

const messages = {
  'no-dataset': 'Прежде чем увидеть содержимое, добавьте датасет',
  'no-type'   : 'Прежде чем увидеть содержимое, выберите тип диаграммы',
  'no-fields' : 'Прежде чем увидеть содержимое, укажите параметры диаграммы'
}

const text = computed(() => messages[props.code] ?? '')
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
