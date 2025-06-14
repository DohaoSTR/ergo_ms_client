<script setup>
import { ref, computed } from 'vue'
import ApexChartsComponent from './ApexChartsComponent.vue'
import ChartJsComponent from './ChartJsComponent.vue'

const props = defineProps({
  type: String,
  fields: Object,
  dataset: [Object, Array],
})

const selectedEngine = ref('chartjs')

const chartTypeMap = {
  "1": "line",
  "2": "bar",
  "3": "pie",
  "4": "doughnut",
  "5": "scatter",
  "6": "radar",
  "7": "heatmap"
}

const chartKind = computed(() => chartTypeMap[props.type] || "bar")

// Список поддерживаемых типов для каждой библиотеки (можно расширить)
const supportedByApex = ['line', 'bar', 'pie', 'donut', 'area', 'scatter', 'radar', 'heatmap']
const supportedByChartJs = ['line', 'bar', 'pie', 'doughnut', 'scatter', 'radar']

const isTypeSupported = computed(() =>
  selectedEngine.value === 'apex'
    ? supportedByApex.includes(chartKind.value)
    : supportedByChartJs.includes(chartKind.value)
)
</script>

<template>
  <div class="area" style="display: flex; flex-direction: column; height: 100%; width: 100%; gap: 10px;">
    <div class="header" style="display: flex; justify-content: flex-end;">
      <select v-model="selectedEngine" class="form-select" style="width: 10rem;">
        <option value="chartjs">Chart.js</option>
        <option value="apex">ApexCharts</option>
      </select>
    </div>
    <div class="chart" style="display: flex; height: 100%; width: 100%;">
      <ChartJsComponent v-if="selectedEngine === 'chartjs' && isTypeSupported"
        :type="chartKind"
        :fields="fields"
        :dataset="dataset"
      />
      <ApexChartsComponent v-else-if="selectedEngine === 'apex' && isTypeSupported"
        :type="chartKind"
        :fields="fields"
        :dataset="dataset"
      />
      <div v-else class="alert alert-warning mt-4">
        Такой тип графика не поддерживается выбранной библиотекой.
      </div>
    </div>
  </div>
</template>
