<script setup>
import { ref, watch } from 'vue'

const props = defineProps({
  type: { type: String, required: true },
  series: { type: Array, required: true },
  options: { type: Object, default: () => ({}) },
  height: { type: [String, Number], default: 350 },
  width: { type: [String, Number], default: '100%' },
})

const chartOptions = ref({
  chart: {
    type: props.type,
    height: props.height,
    width: props.width,
  },
  ...props.options,
})

// Обновление опций при изменении props
watch(
  () => props.options,
  (newOptions) => {
    chartOptions.value = { 
      ...chartOptions.value, 
      ...newOptions,
      chart: {
        ...chartOptions.value.chart,
        ...newOptions.chart,
        type: props.type
      }
    }
  },
  { deep: true }
)

// Обновление типа графика при изменении props.type
watch(
  () => props.type,
  (newType) => {
    chartOptions.value.chart.type = newType
  }
)

// Экспортируем методы и свойства для использования в дочерних компонентах
defineExpose({
  chartOptions,
})
</script>

<template>
  <div class="apex-chart-container">
    <apexchart 
      :type="type" 
      :height="height" 
      :width="width" 
      :options="chartOptions" 
      :series="series"
    ></apexchart>
  </div>
</template>

<style scoped>
.apex-chart-container {
  position: relative;
  width: 100%;
}
</style> 