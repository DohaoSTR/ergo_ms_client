<script setup>
import { ref, computed, watch, defineEmits, defineProps } from 'vue'
import ApexChartsComponent  from './ApexChartsComponent.vue'
import ChartJsComponent     from './ChartJsComponent.vue'
import { CircleAlert }      from 'lucide-vue-next'

const props = defineProps({
  type   : { type: [String, Number], default: '' },
  fields : Object,
  settings: Array,
  dataset : { type: [Array, Object], default: () => [] },
  engine : { type: String, default: 'chartjs' },
})
const emit = defineEmits(['update:engine'])

const localEngine = ref(props.engine)

watch(() => props.engine, e => {
  if (e && e !== localEngine.value) localEngine.value = e
})
watch(localEngine, e => emit('update:engine', e))

const supportedByApex    = ['line','bar','area','radar','heatmap']
const supportedByChartJs = ['line','bar','pie','doughnut','scatter','radar']

const chartTypeMap = { 1:'line',2:'bar',3:'pie',4:'doughnut',5:'scatter',6:'radar',7:'heatmap' }

const chartKind = computed(() => {
  if (!props.type)                         return 'bar'
  if (typeof props.type === 'string')      return props.type
  return chartTypeMap[props.type] || 'bar'
})

const isTypeSupported = computed(() =>
  localEngine.value === 'apex'
    ? supportedByApex.includes(chartKind.value)
    : supportedByChartJs.includes(chartKind.value)
)

const availableEngines = computed(() => {
  const list = []
  if (supportedByChartJs.includes(chartKind.value)) list.push('chartjs')
  if (supportedByApex   .includes(chartKind.value)) list.push('apex')
  return list
})

watch([chartKind, availableEngines], () => {
  if (!availableEngines.value.includes(localEngine.value)) {
    localEngine.value = availableEngines.value[0]
  }
})

const colorField = computed(() =>
  Array.isArray(props.fields.color) && props.fields.color.length
    ? props.fields.color[0]
    : null
)
</script>

<template>
  <div class="area d-flex flex-column h-100 w-100 gap-2">
    <div class="header d-flex justify-content-end">
      <select v-model="localEngine" class="form-select" style="width:10rem;">
        <option v-for="e in availableEngines" :key="e" :value="e">
          {{ e === 'chartjs' ? 'Chart.js' : 'ApexCharts' }}
        </option>
      </select>
    </div>

    <div class="chart d-flex h-100 w-100 justify-content-center align-items-center">
      <ChartJsComponent
        v-if   ="localEngine==='chartjs' && isTypeSupported"
        :type  ="chartKind"
        :fields="fields"
        :settings="settings"
        :color-field="colorField"
        :dataset="dataset"
      />
      <ApexChartsComponent
        v-else-if="localEngine==='apex' && isTypeSupported"
        :type  ="chartKind"
        :fields="fields"
        :settings="settings"
        :color-field="colorField"
        :dataset="dataset"
      />
      <div v-else class="alert alert-warning mt-4 d-flex flex-column justify-content-center align-items-center gap-2">
        <CircleAlert :size="40" /> Такой тип графика не поддерживается выбранной библиотекой.
      </div>
    </div>
  </div>
</template>
