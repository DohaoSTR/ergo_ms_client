<script setup>
import { computed, onMounted, onBeforeUnmount, ref } from 'vue'
import VueApexCharts from 'vue3-apexcharts'

const props = defineProps({
  type: String,    // 'line', 'bar', 'pie', 'donut', 'scatter', 'radar', 'heatmap'
  fields: Object,  // { x: [fieldObj], y: [fieldObj, ...], ... }
  dataset: {
    type: Array,
    default: () => []
  }
})

const chartHeight = ref(400) // стартовое значение

const containerRef = ref(null)

function setChartHeight() {
  if (containerRef.value) {
    chartHeight.value = containerRef.value.offsetHeight
  }
}

onMounted(() => {
  setChartHeight()
  window.addEventListener('resize', setChartHeight)
})

onBeforeUnmount(() => {
  window.removeEventListener('resize', setChartHeight)
})

// Палитра
const palette = [
  '#41B883', '#00D8FF', '#DD1B16', '#f4b942', '#e35bcb', '#9288f8', '#f88d51', '#34a853', '#ea4335'
]

// Вспомогательная функция — массив значений для поля
function getColumn(field) {
  if (!field) return []
  return props.dataset.map(row => row[field.name])
}

const xField   = computed(() => props.fields?.x?.[0])
const yFields  = computed(() => props.fields?.y || [])

const series = computed(() => {
  // PIE/DOUGHNUT
  if ((props.type === 'pie' || props.type === 'donut') && xField.value && yFields.value.length) {
    const y = yFields.value[0]
    return getColumn(y).map(Number)
  }
  // BAR / LINE / AREA / RADAR
  if (['bar', 'line', 'area', 'radar'].includes(props.type) && xField.value && yFields.value.length) {
    return yFields.value.map((y, i) => ({
      name: y.name,
      data: getColumn(y).map(Number)
    }))
  }
  // SCATTER
  if (props.type === 'scatter' && xField.value && yFields.value.length === 1) {
    const y = yFields.value[0]
    return [
      {
        name: y.name,
        data: props.dataset.map(row => [
          Number(row[xField.value.name]),
          Number(row[y.name])
        ])
      }
    ]
  }
  // HEATMAP и прочее
  return []
})

const chartOptions = computed(() => {
  // PIE/DOUGHNUT
  if ((props.type === 'pie' || props.type === 'donut') && xField.value) {
    return {
      chart: { type: props.type },
      labels: getColumn(xField.value),
      colors: palette,
      legend: { position: 'bottom' }
    }
  }
  // BAR / LINE / AREA / RADAR
  if (['bar', 'line', 'area', 'radar'].includes(props.type) && xField.value) {
    return {
      chart: { type: props.type },
      xaxis: { categories: getColumn(xField.value) },
      colors: palette,
      legend: { position: 'bottom' }
    }
  }
  // SCATTER
  if (props.type === 'scatter' && xField.value) {
    return {
      chart: { type: 'scatter' },
      colors: palette,
      legend: { position: 'bottom' }
    }
  }
  // HEATMAP
  if (props.type === 'heatmap') {
    return {
      chart: { type: 'heatmap' },
      colors: palette,
      legend: { position: 'bottom' }
    }
  }
  // fallback
  return {
    chart: { type: props.type || 'bar' },
    legend: { position: 'bottom' }
  }
})
console.log('Apex type:', props.type)
console.log('Apex series:', series.value)
console.log('Apex options:', chartOptions.value)
</script>

<template>
  <div ref="containerRef" style="height: 100%; width: 100%;">
<VueApexCharts
  v-if="props.type && series && series.length"
  :type="props.type"
  height="100%"
  width="100%"
  :options="chartOptions"
  :series="series"
/>
  </div>
</template>

<style scoped></style>
