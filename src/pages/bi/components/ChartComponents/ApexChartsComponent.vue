<script setup>
import { computed, ref, onMounted, onBeforeUnmount } from 'vue'
import VueApexCharts from 'vue3-apexcharts'

const props = defineProps({
  type   : String,
  fields : Object,
  dataset: { type: Array, default: () => [] }
})

const basePalette = [
  '#41B883', '#00D8FF', '#DD1B16', '#f4b942', '#e35bcb',
  '#9288f8', '#f88d51', '#34a853', '#ea4335'
]

function getColumn (field) {
  return field ? props.dataset.map(r => r[field.name]) : []
}

const chartHeight   = ref(400)
const containerRef  = ref(null)
const xField        = computed(() => props.fields?.x?.[0])
const yFields       = computed(() => props.fields?.y || [])
const colorField    = computed(() => props.fields?.color?.[0] || null)
const labelsEnabled = computed(() => (props.fields?.labels?.length ?? 0) > 0)

onMounted(() => {
  resize();
  window.addEventListener('resize', resize)
})
onBeforeUnmount(() => window.removeEventListener('resize', resize))
function resize () {
  if (containerRef.value) chartHeight.value = containerRef.value.offsetHeight
}

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
  if (!xField.value || !yFields.value.length) return []

  if (['pie', 'donut'].includes(props.type)) {
    const y = yFields.value[0]
    return getColumn(y).map(Number)
  }

  if (['bar', 'line', 'area', 'radar'].includes(props.type)) {
    return yFields.value.map(y => ({
      name: y.name,
      data: getColumn(y).map(Number),
      color: colorField.value ? undefined : undefined
    }))
  }

  if (props.type === 'scatter' && yFields.value.length === 1) {
    const y = yFields.value[0]
    return [{
      name: y.name,
      data: props.dataset.map(r => ({
        x: +r[xField.value.name],
        y: +r[y.name],
        fillColor: colorField.value ? colorScale.value[r[colorField.value.name]] : basePalette[0]
      }))
    }]
  }

  if (props.type === 'heatmap' && yFields.value.length === 1) {
    const y = yFields.value[0]
    return [{
      name: y.name,
      data: props.dataset.map(r => ({
        x: r[xField.value.name],
        y: +r[y.name]
      }))
    }]
  }

  return []
})

const chartOptions = computed(() => {
  const opts = {
    chart: { type: props.type || 'bar', id: 'apex-chart', animations: { easing: 'easeinout' } },
    legend: { position: 'bottom' },
    dataLabels: { enabled: labelsEnabled.value },
    colors: seriesColors.value
  }

  if (xField.value) {
    opts.xaxis = { categories: getColumn(xField.value) }
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
