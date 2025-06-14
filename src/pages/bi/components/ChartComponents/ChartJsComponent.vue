<script setup>
import { Pie, Bar, Line, Doughnut, Scatter, Radar } from 'vue-chartjs'
import {
  Chart as ChartJS,
  ArcElement, BarElement, LineElement, CategoryScale, LinearScale,
  Tooltip, Legend, PointElement, RadialLinearScale
} from 'chart.js'
import { computed } from 'vue'

ChartJS.register(
  ArcElement, BarElement, LineElement, CategoryScale, LinearScale,
  Tooltip, Legend, PointElement, RadialLinearScale
)

const props = defineProps({
  type: String,      // 'pie', 'bar', 'line', 'doughnut', 'scatter', 'radar'
  fields: Object,    // { x: [fieldObj, ...], y: [fieldObj, ...], ... }
  dataset: {
    type: Array,
    default: () => []
  }
})

// Цветовая палитра для графиков
const palette = [
  '#41B883', '#00D8FF', '#DD1B16', '#f4b942', '#e35bcb', '#9288f8', '#f88d51', '#34a853', '#ea4335'
]

// Получение значений столбца по полю
function getColumn(field) {
  if (!field) return []
  return props.dataset.map(row => row[field.name])
}

// Сборка chartData для разных типов графика:
const chartData = computed(() => {
  if (!Array.isArray(props.dataset) || props.dataset.length === 0)
    return { labels: [], datasets: [] }

  const xField = props.fields?.x?.[0]
  const yFields = props.fields?.y || []
  if (!xField || !yFields.length) return { labels: [], datasets: [] }

  const labels = getColumn(xField)

  // PIE / DOUGHNUT
  if (props.type === 'pie' || props.type === 'doughnut') {
    const y = yFields[0]
    return {
      labels,
      datasets: [
        {
          label: y.name,
          data: getColumn(y).map(Number),
          backgroundColor: palette
        }
      ]
    }
  }

  // BAR / LINE / RADAR
  if (['bar', 'line', 'radar'].includes(props.type)) {
    return {
      labels,
      datasets: yFields.map((y, i) => ({
        label: y.name,
        data: getColumn(y).map(Number),
        backgroundColor: palette[i % palette.length],
        borderColor: palette[i % palette.length],
        fill: props.type === 'radar'
      }))
    }
  }

  // SCATTER: x и y — по одному
  if (props.type === 'scatter' && xField && yFields.length === 1) {
    const y = yFields[0]
    return {
      datasets: [
        {
          label: y.name,
          data: props.dataset.map(row => ({
            x: +row[xField.name],
            y: +row[y.name]
          })),
          backgroundColor: palette[0]
        }
      ]
    }
  }

  // Если что-то не выбрано — пустой график
  return { labels: [], datasets: [] }
})

// Опции графика
const chartOptions = {
  responsive: true,
  borderRadius: 8,
  plugins: { legend: { position: 'bottom' } }
}
</script>

<template>
  <Pie v-if="type === 'pie'" :data="chartData" :options="chartOptions" />
  <Doughnut v-else-if="type === 'doughnut'" :data="chartData" :options="chartOptions" />
  <Bar v-else-if="type === 'bar'" :data="chartData" :options="chartOptions" />
  <Line v-else-if="type === 'line'" :data="chartData" :options="chartOptions" />
  <Scatter v-else-if="type === 'scatter'" :data="chartData" :options="chartOptions" />
  <Radar v-else-if="type === 'radar'" :data="chartData" :options="chartOptions" />
  <div v-else>Неподдерживаемый тип графика</div>
</template>

<style scoped></style>
