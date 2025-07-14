<script setup>
import { ref, watch, computed, onMounted } from 'vue'
import { endpoints } from '@/js/api/endpoints.js'
import { apiClient } from '@/js/api/manager.js'
import { isDatasetSidebarOpen } from '@/js/bi/useSidebarStore'
import { useRouter } from 'vue-router'
import SimpleTableDataSet from '@/modules/bi/components/SimpleTableDataSet.vue'

const charts = ref([])
const search = ref('')
const sort = ref('new')

const cols = [
  { key: 'name', label: 'Название' },
  { key: 'created_at', label: 'Дата', format: val => new Date(val).toLocaleDateString() },
  { key: 'actions', label: '' }
]

const fetchCharts = async () => {
  const response = await apiClient.get(endpoints.bi.ChartsList)
  if (Array.isArray(response.data)) {
    charts.value = response.data.map(item => ({
      id: item.id,
      name: item.name || '—',
      type_display: item.type_display || item.type || '—',
      created_at: item.created_at,
      owner: item.owner,
      type: 'chart'
    }))
  } else {
    console.error('Ошибка: ответ от API не является массивом', response)
  }
}

watch(isDatasetSidebarOpen, (newVal) => {
  if (newVal) fetchCharts()
})

const transformedData = computed(() => {
  const term = search.value.toLowerCase()
  let list = [...charts.value]

  if (term) {
    list = list.filter(c =>
      c.name?.toLowerCase().includes(term) ||
      c.type_display?.toLowerCase().includes(term)
    )
  }

  switch (sort.value) {
    case 'new':
      list.sort((a, b) => new Date(b.created_at) - new Date(a.created_at)); break
    case 'old':
      list.sort((a, b) => new Date(a.created_at) - new Date(b.created_at)); break
    case 'az':
      list.sort((a, b) => a.name.localeCompare(b.name)); break
    case 'za':
      list.sort((a, b) => b.name.localeCompare(a.name)); break
  }

  return list
})

const emit = defineEmits(['close'])
const router = useRouter()

const goToCreateChart = async () => {
  emit('close')
  await router.push('/bi/chart/new')
}

function handleDeleteRow(row) {
  const idx = charts.value.findIndex(u => u.id === row.id)
  if (idx !== -1) charts.value.splice(idx, 1)
}

onMounted(fetchCharts)
</script>

<template>
  <div class="fixed top-0 right-0 w-full sm:w-[540px] h-full bg-zinc-900 z-50 shadow-xl border-l border-zinc-700 flex flex-col" style="padding-left: 1rem; padding-right: 1rem;">
    <div class="space-y-4 flex-1 overflow-auto">
      <div class="flex gap-3" style="display: flex; flex-wrap: nowrap; margin-top: 1rem;">
        <input class="form-control" placeholder="Поиск..." style="width: 30rem;" v-model="search" />
        <select class="form-select" style="width: 11rem;" v-model="sort">
          <option value="new">Сначала новые</option>
          <option value="old">Сначала старые</option>
          <option value="az">А-Я</option>
          <option value="za">Я-А</option>
        </select>
        <button type="button" class="btn btn-primary" style="width: 12.5rem;" @click="goToCreateChart">Создать чарт</button>
      </div>
      <div style="margin-top: 1rem;">
        <SimpleTableDataSet :cols="cols" :users="transformedData" :isDatasetSidebarOpen="isDatasetSidebarOpen" :currentPage="'charts'" @delete-row="handleDeleteRow"/>
      </div>
    </div>
  </div>
</template>
