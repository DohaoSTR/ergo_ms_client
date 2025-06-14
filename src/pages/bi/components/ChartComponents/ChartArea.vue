<template>
  <div class="chart-area">
    <ChartPlaceholder v-if="placeholderCode" :code="placeholderCode" />
    <ChartRenderer v-else :type="chartType" :fields="fields" :dataset="datasetFilteredSorted"/>
  </div>
</template>

<script setup>
import { toRef, computed } from 'vue'
import ChartPlaceholder from './ChartPlaceholder.vue'
import ChartRenderer from './ChartRenderer.vue'
import useProcessedDataset from '@/js/api/services/bi/useProcessedDataset.js'

const props = defineProps({
  dataset   : Array,
  chartType: String,
  fields: Object,
})

const placeholderCode = computed(() => {
  if (!props.dataset?.length)             return 'no-dataset'
  if (!props.chartType)                   return 'no-type'
  if (!props.fields.x.length || !props.fields.y.length) return 'no-fields'
  return ''
})

const datasetFilteredSorted = useProcessedDataset(
  toRef(props, 'dataset'),
  toRef(props, 'fields')
)
</script>

<style scoped>
.chart-area {
  height: 100%;
  width: 100%;
  display: flex;
  justify-content: center;
  align-items: center;
}
</style>
