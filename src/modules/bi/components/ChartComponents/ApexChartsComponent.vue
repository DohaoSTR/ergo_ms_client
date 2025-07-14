<script setup>
import { ref, computed } from 'vue'
import ApexCharts from 'vue3-apexcharts'
import { getApexSeries, getApexColors } from '@/modules/bi/components/ChartComponents/js/apexDataTransform.js'

/**
 * Адаптированный компонент ApexCharts, повторяющий гибкость ChartJS‑аналога.
 *
 * • Поддерживает те же props (type, fields, dataset).
 * • Автоматически строит series / colors через apexDataTransform.
 * • Формирует chartOptions по типу графика, поддерживая:
 *   – двойную ось Y (y & y2) для line;
 *   – категории/labels для bar, pie/donut, radar;
 *   – кастомные оси и подписи для scatter;
 *   – heatmap без лишних осей.
 */

const props = defineProps({
  type:    { type: String, default: 'bar' },
  fields:  { type: Object, default: () => ({}) },
  dataset: { type: Array,  default: () => [] }
})

/**
 * Поиск поля по приоритетному набору ключей.
 * @param {string[]} keys  – возможные алиасы поля
 * @param {boolean}  many  – вернуть массив вместо первого найденного
 */
function findField (keys, many = false) {
  for (const k of keys) {
    if (props.fields[k] && props.fields[k].length)
      return many ? props.fields[k] : props.fields[k][0]
  }
  return many ? [] : null
}

// --- СЕРИИ И ЦВЕТА -------------------------------------------------------------------------
const series = computed(() =>
  getApexSeries({ type: props.type, fields: props.fields, dataset: props.dataset })
)
const seriesColors = computed(() =>
  getApexColors({ type: props.type, fields: props.fields, dataset: props.dataset })
)

// --- CHART OPTIONS -------------------------------------------------------------------------
const chartOptions = computed(() => {
  // Базовые опции, общие для всех графиков
  const base = {
    chart: {
      id: 'apex-chart',
      type: props.type,
      animations: { easing: 'easeinout' },
      toolbar: { show: false }
    },
    legend: { position: 'bottom' },
    dataLabels: { enabled: !!findField(['labels', 'label']) },
    tooltip: { theme: 'light' },
    colors: seriesColors.value
  }

  // Индивидуальные настройки под каждый тип
  switch (props.type) {
    //------------------------------------------------------------------ LINE / AREA
    case 'line':
    case 'area': {
      // Явно вычисляем необходимость второй оси (y2)
      const yFields = findField(['y'], true)
      const hasY2   = Array.isArray(yFields) && yFields.length > 1

      if (hasY2) {
        base.yaxis = [
          {
            seriesName: yFields[0]?.label || 'Y',
            title: { text: yFields[0]?.label || 'Y' },
            decimalsInFloat: 2,
            forceNiceScale: true
          },
          {
            opposite: true,
            seriesName: yFields[1]?.label || 'Y2',
            title: { text: yFields[1]?.label || 'Y2' },
            decimalsInFloat: 2,
            forceNiceScale: true
          }
        ]
      }

      const xField = findField(['x'])
      if (xField) base.xaxis = { categories: props.dataset.map(r => r[xField.name]) }
      return base
    }

    //------------------------------------------------------------------ BAR
    case 'bar': {
      const xField = findField(['x'])
      if (xField) base.xaxis = { categories: props.dataset.map(r => r[xField.name]) }
      base.yaxis = {
        title: { text: findField(['y'])?.label || 'Y' },
        decimalsInFloat: 2,
        forceNiceScale: true
      }
      return base
    }

    //------------------------------------------------------------------ PIE / DONUT
    case 'pie':
    case 'donut': {
      const labelField = findField(['category', 'labels', 'indicators'])
      if (labelField) {
        // только уникальные категории!
        base.labels = [...new Set(props.dataset.map(r => r[labelField.name]))]
      }
      return base
    }

    //------------------------------------------------------------------ SCATTER / BUBBLE
    case 'scatter':
    case 'bubble': {
      base.chart.zoom = { enabled: true }
      base.tooltip.shared = true

      // Категориальные оси, если переданы массивы подписей из meta
      const xLabels = props.dataset?.meta?.xLabels || null
      const yLabels = props.dataset?.meta?.yLabels || null
      if (xLabels) base.xaxis = { type: 'category', categories: xLabels, title: { text: findField(['x'])?.label || 'X' } }
      if (yLabels) base.yaxis = { type: 'category', categories: yLabels, title: { text: findField(['y'])?.label || 'Y' } }
      return base
    }

    //------------------------------------------------------------------ RADAR
    case 'radar': {
      const labelField = findField(['category', 'labels', 'x'])
      if (labelField) base.labels = props.dataset.map(r => r[labelField.name])
      return base
    }

    //------------------------------------------------------------------ HEATMAP
    case 'heatmap': {
      base.plotOptions = {
        heatmap: {
          shadeIntensity: 0.5,
          colorScale: {
            ranges: [
              { from: -Infinity, to: 0, color: '#F2F2F2' }
            ]
          }
        }
      }
      // Для наглядности используем алиасы колонок как подписи
      const xField = findField(['x'])
      const yField = findField(['y'])
      if (xField) base.xaxis = { categories: [...new Set(props.dataset.map(r => r[xField.name]))] }
      if (yField) base.yaxis = { title: { text: yField.label || 'Y' } }
      return base
    }

    //------------------------------------------------------------------ DEFAULT
    default: {
      return base
    }
  }
})
</script>

<template>
  <div style="height: 100%; width: 100%;">
    <ApexCharts
      v-if="props.type && series.length"
      :type="props.type"
      :height="'100%'"
      :width="'100%'"
      :options="chartOptions"
      :series="series"
    />
  </div>
</template>

<style scoped>
/* Небольшой helper, чтобы график занимал всё доступное пространство */
#apex-chart {
  height: 100% !important;
  width:  100% !important;
}
</style>
