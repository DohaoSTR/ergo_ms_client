<template>
  <div class="chart-area">
    <ChartPlaceholder v-if="!chartType || !fields.x.length || !fields.y.length" />
    <ChartRenderer v-else :type="chartType" :fields="fields" :dataset="datasetFilteredSorted"/>
  </div>
</template>

<script setup>
import { toRef } from 'vue'
import ChartPlaceholder from './ChartPlaceholder.vue'
import ChartRenderer from './ChartRenderer.vue'
import useProcessedDataset from '@/js/api/services/bi/useProcessedDataset.js'

const props = defineProps({
  dataset   : Array,
  chartType: String,
  fields: Object,
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
