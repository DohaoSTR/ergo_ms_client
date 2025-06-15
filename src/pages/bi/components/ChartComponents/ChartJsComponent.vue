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
  type:   { type: String, default: 'bar' },
  fields: { type: Object, default: () => ({}) },
  settings: { type: Array, default: () => [] },
  dataset:{ type: Array,  default: () => [] }
})

const palette = [
  '#41B883', '#00D8FF', '#DD1B16', '#f4b942', '#e35bcb',
  '#9288f8', '#f88d51', '#34a853', '#ea4335'
]

// Универсальная функция получения массива значений из dataset по имени поля
function getColumn(field){
  if(!field) return []
  return props.dataset.map(row => row?.[field.name])
}

// Универсальный выбор нужных полей для любого типа графика
function findField(keys, many=false) {
  for (const k of keys) {
    if (props.fields[k] && props.fields[k].length)
      return many ? props.fields[k] : props.fields[k][0]
  }
  return many ? [] : null
}

const chartData = computed(() => {
  if (!props.dataset.length) return { labels: [], datasets: [] }

  // Универсальные ключи для разных графиков
  // Для pie/doughnut
  const labelFieldPie = findField(['category', 'labels', 'x'])
  const valueFieldPie = findField(['indicators', 'y'])
  // Для bar/line
  const xFieldBar = findField(['x'])
  const yFieldsBar = findField(['y'], true)
  // Для radar
  const labelFieldRadar = findField(['category', 'labels', 'x'])
  const valueFieldsRadar = findField(['indicators', 'y'], true)
  // Для scatter
  const xFieldScatter = findField(['x'])
  const yFieldScatter = findField(['y'])
  // Для heatmap (будет пусто, если не реализовывать)
  
  if (['pie','doughnut'].includes(props.type)) {
  if (!labelFieldPie || !valueFieldPie) return { labels: [], datasets: [] }
  return {
    labels: getColumn(labelFieldPie),
    datasets: [{
      label: valueFieldPie.name,
      data : getColumn(valueFieldPie).map(Number),
      backgroundColor: palette
    }]
  }
}

  if (['bar','line'].includes(props.type)) {
  if (!xFieldBar || !yFieldsBar.length) return { labels: [], datasets: [] }
  const labels = getColumn(xFieldBar)
  const isNumeric = arr => arr.some(val => typeof val === 'number' && !isNaN(val) && val !== null)
  const datasets = yFieldsBar
    .map((y, i) => ({
      label: y.name,
      data : getColumn(y).map(Number),
      backgroundColor: palette[i % palette.length],
      borderColor:     palette[i % palette.length],
      fill: false,
      yAxisID: i === 1 ? 'y2' : 'y'
    }))
    .filter(ds => isNumeric(ds.data))

  return {
    labels,
    datasets
  }
}

  if (props.type === 'radar') {
  if (!labelFieldRadar || !valueFieldsRadar.length) return { labels: [], datasets: [] }
  const labels = getColumn(labelFieldRadar)
  const isNumeric = arr => arr.some(val => typeof val === 'number' && !isNaN(val) && val !== null)
  const datasets = valueFieldsRadar
    .map((v, i) => ({
      label: v.name,
      data : getColumn(v).map(Number),
      backgroundColor: palette[i % palette.length] + '44',
      borderColor: palette[i % palette.length],
      fill: true
    }))
    .filter(ds => isNumeric(ds.data))

  return {
    labels,
    datasets
  }
}

  if (props.type === 'scatter') {
    if (!xFieldScatter || !yFieldScatter) return { labels: [], datasets: [] }
    return {
      datasets: [{
        label: yFieldScatter.name,
        data: props.dataset.map(row => ({
          x: +row[xFieldScatter.name],
          y: +row[yFieldScatter.name]
        })),
        backgroundColor: palette[0]
      }]
    }
  }

  return { labels: [], datasets: [] }
})

const chartOptions = {
  responsive: true,
  plugins: {
    legend: { position: 'bottom' }
  },
  scales: {
    y: {
      type: 'linear',
      position: 'left'
    },
    y2: {
      type: 'linear',
      position: 'right',
      grid: { drawOnChartArea: false }
    }
  }
}
</script>

<template>
  <Pie      v-if="type === 'pie'"       :data="chartData" :options="chartOptions" />
  <Doughnut v-else-if="type === 'doughnut'" :data="chartData" :options="chartOptions" />
  <Bar      v-else-if="type === 'bar'"      :data="chartData" :options="chartOptions" />
  <Line     v-else-if="type === 'line'"     :data="chartData" :options="chartOptions" />
  <Scatter  v-else-if="type === 'scatter'"  :data="chartData" :options="chartOptions" />
  <Radar    v-else-if="type === 'radar'"    :data="chartData" :options="chartOptions" />
  <div v-else>Неподдерживаемый тип графика</div>
</template>

<style scoped></style>
