<script setup>
import { ref, computed } from 'vue'
import BaseChart from '@/pages/bio/components/charts/BaseChart.vue'
import { getElementTitle } from '@/pages/bio/js/bio-helpers'

const props = defineProps({
  chartData: { type: [Object, null], default: () => ({}) },
  scaleType: { type: String, required: true },
  title: { type: String, default: 'Среднее значение шкалы' },
  isLoading: { type: Boolean, default: false },
  error: { type: [String, null], default: null }
})

const chartType = ref('bar')
const chartOptions = ref({
  plugins: {
    tooltip: {
      callbacks: {
        label: function (context) {
          let label = context.dataset.label || ''
          if (label) {
            label += `: ${context.parsed.y.toFixed(2)}`
          }
          return label
        },
      },
    },
  },
})

const xLabel = computed(() => 'Параметр')
const yLabel = computed(() => 'Значение')

// Проверка на нулевые значения всех данных
const allValuesAreZero = computed(() => {
  if (!props.chartData || !props.chartData.data || props.chartData.data.length === 0) {
    return false
  }
  
  // Проверяем, все ли значения равны 0
  return props.chartData.data.every(item => {
    // item имеет структуру {scale: "название", value: число}
    return item.value === 0
  })
})

</script>

<template>
  <div class="scales-chart h-100">
    <div v-if="isLoading" class="text-center py-4">
      <div class="spinner-border text-primary" role="status">
        <span class="visually-hidden">Загрузка...</span>
      </div>
    </div>

    <div v-else-if="error" class="alert alert-danger mb-0 rounded-0 rounded-bottom border-0 h-100">
      {{ error }}
    </div>

    <div
      v-else-if="!chartData || !chartData.data || chartData.data.length === 0 || allValuesAreZero"
      class="alert alert-info mb-0 rounded-0 rounded-bottom border-0 h-100"
    >
      <span v-if="allValuesAreZero">
        Для растений на этой площадке не указаны значения экологических шкал "{{ getElementTitle(scaleType) }}"
      </span>
      <span v-else>
        Нет данных для отображения графика шкал "{{ getElementTitle(scaleType) }}"
      </span>
    </div>

    <BaseChart
      v-else
      :type="chartType"
      :data="chartData"
      :options="chartOptions"
      :xLabel="xLabel"
      :yLabel="yLabel"
      :title="title"
      height="300px"
    />
  </div>
</template>