<template>
  <div class="chart-area">
    <ChartPlaceholder v-if="!dataset || !fields.x.length || !fields.y.length" />
    <ChartRenderer v-else :type="chartType" :fields="fields" :dataset="dataset"/>
  </div>
</template>

<script setup>
import ChartPlaceholder from './ChartPlaceholder.vue'
import ChartRenderer from './ChartRenderer.vue'

const props = defineProps({
  dataset: [Object, Array],
  chartType: String,
  fields: Object,
})
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
