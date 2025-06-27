<script setup>
import { ref, computed, watch, defineProps, defineEmits, toRef } from 'vue'
import { Loader2 }             from 'lucide-vue-next'
import ChartPlaceholder        from './ChartPlaceholder.vue'
import ChartRenderer           from './ChartRenderer.vue'
import useProcessedDataset     from '@/js/api/services/bi/useProcessedDataset.js'

const props = defineProps({
  dataset :  { type: Array,            default: () => [] },
  chartType: { type: String,           default: ''       },
  fields  :  { type: Object,           default: () => ({}) },
  settings:  { type: Array,            default: () => [] },
  engine  :  { type: String,           default: 'chartjs' }
})
const emit = defineEmits(['update:engine'])

const currentEngine = ref(props.engine)

watch(() => props.engine, e => {
  if (e && e !== currentEngine.value) currentEngine.value = e
})
watch(currentEngine, e => emit('update:engine', e))

const isLoading = ref(false)

const placeholderCode = computed(() => {
  if (!props.dataset.length)              return 'no-dataset'
  if (!props.chartType)                   return 'no-type'
  const hasAnyField = props.settings.some(s => (props.fields[s.key]||[]).length)
  return hasAnyField ? '' : 'no-fields'
})

const datasetFilteredSorted = useProcessedDataset(
  toRef(props,'dataset'),
  toRef(props,'fields')
)

watch([() => props.dataset, () => props.fields], () => {
  isLoading.value = true
  setTimeout(() => { isLoading.value = false }, 300)
}, { immediate: true })
</script>

<template>
  <div class="chart-area">
    <div v-if="isLoading" class="chart-loader">
      <Loader2 class="chart-loader-spinner" size="40"/>
      <span>Загружаем график…</span>
    </div>

    <div v-else class="d-flex justify-content-center align-items-center w-100 h-100">
      <ChartPlaceholder v-if="placeholderCode" :code="placeholderCode"/>
      <ChartRenderer v-if="!placeholderCode" :type="chartType" :fields="fields" :settings="settings" :dataset="datasetFilteredSorted" @engineChange="val => emit('engineChange', val)"/>
    </div>
  </div>
</template>

<style scoped>
.chart-area      { height:100%; width:100%; display:flex; justify-content:center; align-items:center; }
.chart-loader    { display:flex; flex-direction:column; align-items:center; justify-content:center; gap:10px; height:350px; }
.chart-loader-spinner { animation: spin 1s linear infinite; }
@keyframes spin  { to { transform:rotate(360deg);} }
</style>
