<template>
  <div class="section-title">Датасеты</div>
  <input class="form-control mb-2" type="text" placeholder="Поиск по имени" v-model="filter" autocomplete="off" />
  
  <ul v-if="props.isLoading" class="dataset-list">
    <li v-for="n in 4" :key="n" class="dataset-item loading">
      <div class="skeleton-icon" />
      <div class="skeleton-text" />
    </li>
  </ul>
  
  <ul v-else-if="filteredDatasets.length > 0" class="dataset-list">
    <li v-for="dataset in filteredDatasets" :key="dataset.id" class="dataset-item"
      :class="{ selected: isSelected(dataset) }" @click="emit('select', dataset)">
      <Database class="icon" />
      <span class="dataset-name">{{ dataset.name }}</span>
    </li>
  </ul>
  
  <div v-else class="no-data">
    Нет датасетов
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { Database } from 'lucide-vue-next'

const props = defineProps({
  selectedDataset: Object,
  datasets: Array,
  isLoading: Boolean,
})
const emit = defineEmits(['select'])

const filter = ref('')

function isSelected(dataset) {
  if (!props.selectedDataset) return false
  return String(dataset.id) === String(props.selectedDataset.id)
}

const filteredDatasets = computed(() => {
  const search = filter.value.toLowerCase()
  return (props.datasets || []).filter(ds =>
    ds.name && ds.name.toLowerCase().includes(search)
  )
})
</script>

<style scoped lang="scss">
.section-title {
  font-weight: bold;
  color: var(--color-primary-text);
  margin-bottom: 10px;
}

.dataset-list {
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

.dataset-item {
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
}

.dataset-name {
  font-size: 14px;
  color: var(--color-primary-text);
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
  background-color: var(--color-secondary-text);
  border-radius: 4px;
  animation: shimmer 1.3s infinite ease-in-out;
}

.skeleton-icon {
  width: 16px;
  height: 16px;
}

.skeleton-text {
  width: 150px;
  height: 14px;
  margin-left: 10px;
}

.skeleton-icon,
.skeleton-text {
  background: linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 37%, #f0f0f0 63%);
  background-size: 400% 100%;
  border-radius: 4px;
  animation: shimmer 1.3s infinite ease-in-out;
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

.dataset-item.selected {
  border: 1.5px solid #198754;
  background-color: var(--color-hover-background);
}
</style>
