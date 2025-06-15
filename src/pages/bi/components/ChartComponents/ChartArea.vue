<template>
  <div class="chart-area">
    <div v-if="isLoading" class="chart-loader">
      <Loader2 class="chart-loader-spinner" size="40"/>
      <span>Загружаем график...</span>
    </div>
    <div v-else style="display: flex; justify-content: center; align-items: center; width: 100%; height: 100%;">
      <ChartPlaceholder v-if="placeholderCode" :code="placeholderCode" />
      <ChartRenderer v-else :type="chartType" :fields="fields" :settings="settings" :dataset="datasetFilteredSorted"/>
    </div>
  </div>
</template>

<script setup>
import { toRef, computed, watch, ref } from 'vue'
import { Loader2 } from 'lucide-vue-next'
import ChartPlaceholder from './ChartPlaceholder.vue'
import ChartRenderer from './ChartRenderer.vue'
import useProcessedDataset from '@/js/api/services/bi/useProcessedDataset.js'

const props = defineProps({
  dataset   : Array,
  chartType: String,
  fields: Object,
  settings: Array
})

const isLoading = ref(false)

const placeholderCode = computed(() => {
  if (!props.dataset?.length) return 'no-dataset'
  if (!props.chartType) return 'no-type'

  const needField = props.settings?.some(setting => (props.fields[setting.key] || []).length > 0)
  if (!needField) return 'no-fields'

  return ''
})

const datasetFilteredSorted = useProcessedDataset(
  toRef(props, 'dataset'),
  toRef(props, 'fields')
)

watch(
  [() => props.dataset, () => props.fields],
  () => {
    isLoading.value = true
    setTimeout(() => { isLoading.value = false }, 300)  // подстрой задержку под реальное время
  },
  { immediate: true }
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
.chart-loader {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 350px;
  gap: 10px;
}
.chart-loader-spinner {
  animation: spin 1s linear infinite;
}
@keyframes spin {
  100% { transform: rotate(360deg);}
}
</style>
