<script setup>
import { ref, watch, computed, onMounted } from 'vue'
import { endpoints } from '@/js/api/endpoints.js'
import { apiClient } from '@/js/api/manager.js'
import { isDatasetSidebarOpen } from '@/modules/bi/js/useSidebarStore'
import { useRouter } from 'vue-router'
import SimpleTableDataSet from '@/modules/bi/components/SimpleTableDataSet.vue'

const props = defineProps({
  // Конфигурация для типа элементов
  config: {
    type: Object,
    required: true,
    validator: (config) => {
      return config.type && config.endpoint && config.createRoute && config.createButtonText
    }
  }
})

const items = ref([])
const search = ref('')
const sort = ref('new')
const loading = ref(false)

// Универсальные колонки для всех типов
const cols = [
  { key: 'name', label: 'Название' },
  { key: 'created_at', label: 'Дата', format: val => new Date(val).toLocaleDateString() },
  { key: 'actions', label: '' }
]

const router = useRouter()

// Функция для перехода к созданию нового элемента
function goToCreate() {
  router.push(props.config.createRoute)
}

// Универсальная функция загрузки данных
async function fetchItems() {
  loading.value = true
  try {
    const { data } = await apiClient.get(props.config.endpoint)
    const rows = Array.isArray(data) ? data : (data.results || [])
    
    // Применяем маппинг данных если он предоставлен
    if (props.config.mapData) {
      items.value = rows.map(props.config.mapData)
    } else {
      // Стандартный маппинг
      items.value = rows.map(item => ({
        id: item.id,
        name: item.name || '—',
        created_at: item.created_at,
        owner_username: item.owner_username,
        type: props.config.type,
        ...item // включаем все остальные поля
      }))
    }
  } catch (err) {
    console.error(`Ошибка загрузки ${props.config.type}:`, err)
  } finally {
    loading.value = false
  }
}

// Обработчик удаления элемента
function handleDeleteRow(row) {
  const idx = items.value.findIndex(item => item.id === row.id)
  if (idx !== -1) items.value.splice(idx, 1)
}

// Наблюдаем за открытием сайдбара
watch(isDatasetSidebarOpen, (newVal) => {
  if (newVal) fetchItems()
})

// Фильтрация и сортировка данных
const transformedData = computed(() => {
  const term = search.value.toLowerCase()
  let list = [...items.value]

  if (term) {
    // Используем кастомную функцию фильтрации если предоставлена
    if (props.config.filterFunction) {
      list = list.filter(props.config.filterFunction(term))
    } else {
      // Стандартная фильтрация по имени и владельцу
      list = list.filter(item =>
        item.name?.toLowerCase().includes(term) ||
        item.owner_username?.toLowerCase().includes(term)
      )
    }
  }

  // Сортировка
  switch (sort.value) {
    case 'new':
      list.sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
      break
    case 'old':
      list.sort((a, b) => new Date(a.created_at) - new Date(b.created_at))
      break
    case 'az':
      list.sort((a, b) => a.name.localeCompare(b.name))
      break
    case 'za':
      list.sort((a, b) => b.name.localeCompare(a.name))
      break
  }

  return list
})

onMounted(fetchItems)
</script>

<template>
  <div class="fixed top-0 right-0 w-full sm:w-[540px] h-full bg-zinc-900 z-50 shadow-xl border-l border-zinc-700 flex flex-col" 
       style="padding-left: 1rem; padding-right: 1rem; overflow-y: hidden;">
    <div class="space-y-4 flex-1 overflow-auto">
      <!-- Панель управления -->
      <div class="flex gap-3" style="display: flex; flex-wrap: nowrap; margin-top: 1rem;">
        <input 
          class="form-control" 
          :placeholder="config.searchPlaceholder || 'Введите для поиска...'" 
          style="width: 25rem;" 
          v-model="search" 
        />
        <select class="form-select" style="width: 11rem;" v-model="sort">
          <option value="new">Сначала новые</option>
          <option value="old">Сначала старые</option>
          <option value="az">А-Я</option>
          <option value="za">Я-А</option>
        </select>
        <button 
          type="button" 
          class="btn btn-primary" 
          :style="{ width: config.createButtonWidth || '11rem' }" 
          @click="goToCreate"
        >
          {{ config.createButtonText }}
        </button>
      </div>
      
      <!-- Таблица -->
      <div style="margin-top: 1rem;">
        <div v-if="loading" class="loader-center">
          <span class="loader"></span>
        </div>
        <SimpleTableDataSet 
          v-else 
          :cols="cols" 
          :current-page="config.type" 
          :users="transformedData" 
          :isDatasetSidebarOpen="isDatasetSidebarOpen"
          @delete-row="handleDeleteRow"
        />
      </div>
    </div>
  </div>
</template>

<style scoped lang="scss">
.loader-center {
  min-height: 240px;
  display: flex; 
  align-items: center; 
  justify-content: center;
}

.loader {
  border: 4px solid var(--color-border);
  border-top: 4px solid var(--color-accent);
  border-radius: 50%;
  width: 42px; 
  height: 42px;
  animation: spin 1s linear infinite;
}

@keyframes spin { 
  100% { 
    transform: rotate(360deg); 
  } 
}
</style> 