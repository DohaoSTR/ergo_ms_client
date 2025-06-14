<template>
  <div class="section-title">Датасеты</div>
  <input class="form-control mb-2" type="text" placeholder="Поиск по имени" v-model="filter" autocomplete="off"/>
  <ul class="dataset-list">
    <template v-if="isLoading">
      <li v-for="n in 4" :key="n" class="dataset-item loading">
        <div class="skeleton-icon" />
        <div class="skeleton-text" />
      </li>
    </template>
    <template v-else>
      <li v-for="dataset in filteredDatasets"
          :key="dataset.id"
          class="dataset-item"
          :class="{ selected: isSelected(dataset) }"
          @click="emit('select', dataset)">
        <Database class="icon"/>
        <span class="dataset-name">{{ dataset.name }}</span>
      </li>
    </template>
  </ul>
  <div v-if="!isLoading && filteredDatasets.length === 0" class="no-data">
    Нет датасетов
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { Database } from 'lucide-vue-next'
import { apiClient } from '@/js/api/manager'
import { endpoints } from '@/js/api/endpoints'

const props = defineProps({
  selectedDataset: Object
})
const emit = defineEmits(['select'])

const filter = ref('')
const isLoading = ref(true)
const datasets = ref([])

function isSelected(dataset) {
  if (!props.selectedDataset) return false
  return String(dataset.id) === String(props.selectedDataset.id)
}

// API загрузка датасетов как в листе
async function fetchDatasets() {
  isLoading.value = true
  try {
    const { data } = await apiClient.get(endpoints.bi.DatasetsList, { params: { is_temporary: false } })
    const rows = Array.isArray(data) ? data : (data.results || [])
    datasets.value = rows.filter(item => item.is_temporary === false)
  } catch (err) {
    console.error('Ошибка загрузки датасетов:', err)
  } finally {
    isLoading.value = false
  }
}

const filteredDatasets = computed(() => {
  const search = filter.value.toLowerCase()
  return datasets.value.filter(ds =>
    ds.name && ds.name.toLowerCase().includes(search)
  )
})

onMounted(fetchDatasets)
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
  border-radius: 4px;
}
@keyframes shimmer {
  0% { opacity: 0.4; }
  50% { opacity: 1; }
  100% { opacity: 0.4; }
}

.dataset-item.selected {
  border: 1.5px solid #198754;
  background-color: var(--color-hover-background);
}
</style>
