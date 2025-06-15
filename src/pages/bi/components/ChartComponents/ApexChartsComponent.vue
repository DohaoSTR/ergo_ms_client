<script setup>
import { computed, ref, onMounted, onBeforeUnmount } from 'vue'
import VueApexCharts from 'vue3-apexcharts'

const props = defineProps({
  type   : String,
  fields : Object,
  settings: { type: Array, default: () => [] },
  dataset: { type: Array, default: () => [] },
  colorField: { type: [Object, null], default: null }
})

const basePalette = [
  '#41B883', '#00D8FF', '#DD1B16', '#f4b942', '#e35bcb',
  '#9288f8', '#f88d51', '#34a853', '#ea4335'
]

function getColumn (field) {
  return field ? props.dataset.map(r => r[field.name]) : []
}

function findField(keys, many=false) {
  for (const k of keys) {
    if (props.fields[k] && props.fields[k].length)
      return many ? props.fields[k] : props.fields[k][0]
  }
  return many ? [] : null
}

const chartHeight   = ref(400)
const containerRef  = ref(null)

onMounted(() => {
  resize();
  window.addEventListener('resize', resize)
})

onBeforeUnmount(() => window.removeEventListener('resize', resize))

function resize () {
  if (containerRef.value) chartHeight.value = containerRef.value.offsetHeight
}

const colorField = computed(() =>
  findField(['color'])
)
const colorScale = computed(() => {
  if (!colorField.value) return {}
  const uniq = [...new Set(props.dataset.map(r => r[colorField.value.name]))]
  return Object.fromEntries(
    uniq.map((val, i) => [val, basePalette[i % basePalette.length]])
  )
})
const seriesColors = computed(() => {
  if (!colorField.value) return basePalette
  return Object.values(colorScale.value)
})

const series = computed(() => {
  // PIE / DONUT
  if (['pie', 'donut'].includes(props.type)) {
    const labelField = findField(['category', 'labels', 'x'])
    const valueField = findField(['indicators', 'y'])
    if (!labelField || !valueField) return []
    return getColumn(valueField).map(Number)
  }

if (['bar','line','area','radar'].includes(props.type)) {
  const xField = findField(['x'])
  let yFields = [
    ...(props.fields.indicators || []),
    ...(props.fields.y || []),
    ...(props.fields.y2 || [])
  ]
  if (!xField || !yFields.length) return []

  const isNumeric = arr =>
    arr.some(val => typeof val === 'number' && !isNaN(val) && val !== null)

  return yFields
    .map((y, i) => ({
      name: y.name,
      data: getColumn(y).map(Number),
      color: colorField.value ? undefined : undefined
    }))
    .filter(seriesObj => isNumeric(seriesObj.data))
}

  if (props.type === 'scatter') {
    const xField = findField(['x'])
    const yField = findField(['y'])
    if (!xField || !yField) return []
    return [{
      name: yField.name,
      data: props.dataset.map(r => ({
        x: +r[xField.name],
        y: +r[yField.name],
        fillColor: colorField.value ? colorScale.value[r[colorField.value.name]] : basePalette[0]
      }))
    }]
  }

  if (props.type === 'heatmap') {
  const xField = findField(['x'])
  const yField = findField(['y'])
  const valueField = findField(['value', 'indicators', 'y'])
  if (!xField || !yField || !valueField) return []

  const yValues = [...new Set(getColumn(yField))]
  const xValues = [...new Set(getColumn(xField))]

  const series = yValues.map((yval, idx) => ({
    name: yval,
    data: xValues.map(xval => {
      const row = props.dataset.find(
        r => r[xField.name] === xval && r[yField.name] === yval
      )
      return {
        x: xval,
        y: row ? Number(row[valueField.name]) : null
      }
    })
  }))
  console.log('HEATMAP series:', series)
  return series
}

  return []
})

const labelsEnabled = computed(() => !!findField(['labels']))

const chartOptions = computed(() => {
  const opts = {
    chart: { type: props.type || 'bar', id: 'apex-chart', animations: { easing: 'easeinout' } },
    legend: { position: 'bottom' },
    dataLabels: { enabled: labelsEnabled.value },
    colors: seriesColors.value
  }

  if (['pie','donut','radar'].includes(props.type)) {
    const labelField = findField(['category', 'labels', 'x'])
    if (labelField) opts.labels = getColumn(labelField)
  }
  if (['bar','line','area','scatter','heatmap'].includes(props.type)) {
    const xField = findField(['x'])
    if (xField) opts.xaxis = { categories: getColumn(xField) }
  }
  opts.tooltip = { theme: 'light' }
  return opts
})
</script>

<template>
  <div ref="containerRef" style="height: 100%; width: 100%;">
    <vue-apex-charts
      v-if="props.type && series.length"
      :type="props.type"
      height="100%"
      width="100%"
      :options="chartOptions"
      :series="series"
    />
  </div>
</template>

<style scoped></style>
