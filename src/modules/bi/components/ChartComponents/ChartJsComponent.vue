<script setup>
import { Pie, Bar, Line, Doughnut, Scatter, Radar } from 'vue-chartjs'
import { Chart as ChartJS, ArcElement, BarElement, LineElement, CategoryScale, LinearScale, Tooltip, Legend, PointElement, RadialLinearScale } from 'chart.js'
import { computed } from 'vue'
import {
  getPieData, getBarData, getLineData, getRadarData, getScatterData
} from '@/modules/bi/components/ChartComponents/js/chartDataTransform.js'

ChartJS.register(ArcElement, BarElement, LineElement, CategoryScale, LinearScale, Tooltip, Legend, PointElement, RadialLinearScale)

const props = defineProps({
  type:   { type: String, default: 'bar' },
  fields: { type: Object, default: () => ({}) },
  settings: { type: Array, default: () => [] },
  dataset:{ type: Array,  default: () => [] }
})

function findField(keys, many=false) {
  for (const k of keys) {
    if (props.fields[k] && props.fields[k].length)
      return many ? props.fields[k] : props.fields[k][0]
  }
  return many ? [] : null
}

const chartData = computed(() => {
  if (!props.dataset.length) return { labels: [], datasets: [] }

  if (props.type === 'line') {
    // поля, разрешающие мультивыбор
    const xFields     = findField(['x'],  true)
    const yFields     = findField(['y'],  true)
    const y2Fields    = findField(['y2'], true)

    const colorField  = findField(['color', 'colors'])
    const sortFields  = props.fields?.sort ?? []
    const labelField  = findField(['labels', 'label'])   // одно поле подписи
    const filters     = props.fields?.filters ?? []

    return getLineData(
      props.dataset,    // строки
      xFields,          // массив X
      yFields,          // массив Y
      y2Fields,         // массив Y2
      colorField,       // «цвет»
      sortFields,       // сортировка
      labelField,       // подписи
      filters           // фильтры
    )
  }

  if (props.type === 'bar') {
  const xField     = findField(['x'],    true)
  const yField     = findField(['y'],    true)
  const colorField = findField(['color', 'colors'])
  const filters = props.fields?.filters ?? []
  const labelFields = findField(['labels', 'label'], true)
  const sort = props.fields?.sort ?? null
  return getBarData(
    props.dataset,
    xField,
    yField,
    colorField,
    {
      filters,
      labelFields,
      sort
    }
  )
}

  if (props.type === 'pie' || props.type === 'doughnut') {
  const categoryFields = findField(['category','categories','x','labels'], true)
  const valueFields    = findField(['indicators','values','y'], true)
  const colorFields    = findField(['color','colors'], true)

  return getPieData(
    props.dataset,
    categoryFields,
    valueFields,
    colorFields,
    props.fields?.sort    ?? [],
    props.fields?.filters ?? [],
  )
}

  if (props.type === 'scatter' || props.type === 'bubble') {
    const data = getScatterData(
      props.dataset,
      findField(['x'],       true),
      findField(['y'],       true),
      findField(['points'],  true),
      findField(['size'],    true),
      findField(['color'],   true),
      props.fields?.sort    ?? [],
      props.fields?.filters ?? [],
    )

    // Явно добавляем подписи и заголовки осей, если они есть
    const options = {
      responsive: true,
      plugins: {
        legend: { position: 'bottom' },
        tooltip: { mode: 'index', intersect: false }
      },
      scales: {}
    }
    if (data.meta?.xLabels) {
      options.scales.x = {
        type: 'category',
        labels: data.meta.xLabels,
        title: { display: true, text: findField(['x'])?.label || 'X' }
      }
    }
    if (data.meta?.yLabels) {
      options.scales.y = {
        type: 'category',
        labels: data.meta.yLabels,
        title: { display: true, text: findField(['y'])?.label || 'Y' }
      }
    }

    return { ...data, ...options }
  }

  if (props.type === 'radar') {
  const categoryField = findField(['category', 'labels', 'x'])
  const valueFields   = findField(['indicators', 'y'], true)
  const colorField    = findField(['color', 'colors'])
  const sortFields    = props.fields?.sort    ?? []
  const filters       = props.fields?.filters ?? []

  return getRadarData(
    props.dataset,
    categoryField,
    valueFields,
    colorField,
    filters,
    sortFields,
  )
}

  if (props.type === 'heatmap') {
    const xField = findField(['x'])
    const yField = findField(['y'])
    const valueField = findField(['value', 'y2', 'indicator'])
    const colorField = findField(['color', 'colors'])
    return getHeatmapData(props.dataset, xField, yField, valueField, colorField)
  }

  return { labels: [], datasets: [] }
})

const chartOptions = computed(() => {
  // findField(['y'], true) вернет массив всех Y (включая Y2, если выбран)
  const yFields = findField(['y'], true)
  const hasY2 = Array.isArray(yFields) && yFields.length > 1

  switch (props.type) {
    case 'line':
      return {
        responsive: true,
        plugins: {
          legend: { position: 'bottom' },
          tooltip: { mode: 'index', intersect: false }
        },
        interaction: { mode: 'nearest', axis: 'x', intersect: false },
        scales: hasY2
          ? {
              y: {
                type: 'linear',
                position: 'left',
                title: { display: true, text: 'Y' },
                beginAtZero: true
              },
              y2: {
                type: 'linear',
                position: 'right',
                grid: { drawOnChartArea: false },
                title: { display: true, text: 'Y2' },
                beginAtZero: true
              }
            }
          : {
              y: {
                type: 'linear',
                position: 'left',
                title: { display: true, text: 'Y' },
                beginAtZero: true
              }
            }
      }

    case 'bar':
      // Только одна ось Y
      return {
        responsive: true,
        plugins: {
          legend: { position: 'bottom' },
          tooltip: { mode: 'index', intersect: false }
        },
        scales: {
          y: {
            type: 'linear',
            position: 'left',
            beginAtZero: true,
            title: { display: true, text: 'Y' }
          }
        }
      }

    case 'pie':
    case 'doughnut':
      // Для круговых графиков оси не нужны
      return {
        responsive: true,
        plugins: {
          legend: { position: 'bottom' },
          tooltip: { mode: 'index', intersect: false }
        }
      }

    default:
      // По умолчанию одна ось
      return {
        responsive: true,
        plugins: {
          legend: { position: 'bottom' },
          tooltip: { mode: 'index', intersect: false }
        },
        scales: {
          y: {
            type: 'linear',
            position: 'left',
            beginAtZero: true
          }
        }
      }
  }
})
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

<style scoped lang="scss"></style>
