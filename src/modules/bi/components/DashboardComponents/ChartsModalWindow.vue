<template>
  <input class="form-control mb-2" type="text" placeholder="Поиск по названию" v-model="filter" autocomplete="off" />
  
  <ul v-if="props.isLoading" class="chart-list">
    <li v-for="n in 4" :key="n" class="chart-item loading">
      <div class="skeleton-icon" />
      <div class="chart-info">
        <div class="skeleton-text skeleton-name" />
        <div class="skeleton-text skeleton-date" />
      </div>
    </li>
  </ul>
  
  <ul v-else-if="filteredCharts.length > 0" class="chart-list">
    <li v-for="chart in filteredCharts" :key="chart.id" class="chart-item"
      :class="{ selected: isSelected(chart) }" @click="emit('select', chart)">
      <BarChart3 class="icon" />
      <div class="chart-info">
        <span class="chart-name">{{ chart.name }}</span>
        <span class="chart-date">{{ formatDate(chart.created_at || chart.updated_at) }}</span>
      </div>
    </li>
  </ul>
  
  <div v-else class="no-data">
    Нет чартов
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { BarChart3 } from 'lucide-vue-next'

const props = defineProps({
  selectedChart: Object,
  charts: Array,
  isLoading: Boolean,
})
const emit = defineEmits(['select'])

const filter = ref('')

function isSelected(chart) {
  if (!props.selectedChart) return false
  return String(chart.id) === String(props.selectedChart.id)
}

function formatDate(dateStr) {
  if (!dateStr) return ''
  const date = new Date(dateStr)
  return date.toLocaleDateString('ru-RU', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric'
  })
}

const filteredCharts = computed(() => {
  const search = filter.value.toLowerCase()
  return (props.charts || []).filter(chart =>
    chart.name && chart.name.toLowerCase().includes(search)
  )
})
</script>

<style scoped lang="scss">
.section-title {
  font-weight: bold;
  color: var(--color-primary-text);
  margin-bottom: 10px;
}

.chart-list {
  list-style: none;
  padding: 0 0 10px 0;
  margin: 0;
  display: flex;
  flex-direction: column;
  gap: 6px;
  width: 100%;
  height: 100%;
  overflow-y: auto;
}

.chart-item {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 6px 8px;
  border-radius: 6px;
  transition: background 0.2s;
  width: 100%;
  cursor: pointer;

  &:hover,
  &.selected {
    background-color: var(--color-hover-background);
  }
}

.icon {
  width: 16px;
  height: 16px;
  color: var(--color-accent);
  flex-shrink: 0;
}

.chart-info {
  display: flex;
  flex-direction: column;
  gap: 2px;
  min-width: 0;
  flex: 1;
}

.chart-name {
  font-size: 14px;
  color: var(--color-primary-text);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  font-weight: 500;
}

.chart-date {
  font-size: 12px;
  color: var(--color-secondary-text);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.no-data {
  padding: 12px;
  text-align: center;
  font-size: 14px;
  color: var(--color-primary-text);
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 120px;
  height: 100%;
}

.loading {
  pointer-events: none;
  background: transparent !important;
}

.skeleton-icon,
.skeleton-text {
  background: linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 37%, #f0f0f0 63%);
  background-size: 400% 100%;
  border-radius: 4px;
  animation: shimmer 1.3s infinite ease-in-out;
}

.skeleton-icon {
  width: 16px;
  height: 16px;
  flex-shrink: 0;
}

.skeleton-name {
  width: 120px;
  height: 14px;
}

.skeleton-date {
  width: 80px;
  height: 12px;
}

@keyframes shimmer {
  0% {
    background-position: 100% 0;
    opacity: 0.5;
  }

  100% {
    background-position: 0 0;
    opacity: 1;
  }
}

.chart-item.selected {
  border: 1.5px solid #198754;
  background-color: var(--color-hover-background);
}
</style>