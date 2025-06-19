<script setup>
import { ref, watch, computed, onMounted } from 'vue'
import { endpoints } from '@/js/api/endpoints.js'
import { apiClient } from '@/js/api/manager.js'
import { isDatasetSidebarOpen } from '@/js/bi/useSidebarStore'
import { useRouter } from 'vue-router'
import SimpleTableDataSet from '@/pages/bi/components/SimpleTableDataSet.vue'

const connections = ref([])
const search = ref('')
const sort = ref('new')

const cols = [
  { key: 'name', label: 'Название' },
  { key: 'created_at', label: 'Дата', format: val => new Date(val).toLocaleDateString() },
  { key: 'actions', label: '' }
]

const fetchConnections = async () => {
  const response = await apiClient.get(endpoints.bi.ConnectionsList)

  if (Array.isArray(response.data)) {
    connections.value = response.data.map(item => ({
      id: item.id,
      name: item.name || '—',
      connector_type_display: item.connector_type_display || item.connector_type || '—',
      created_at: item.created_at,
      config: item.config,
      owner: item.owner
    }))
  } else {
    console.error('Ошибка: ответ от API не является массивом', response)
  }
}

watch(isDatasetSidebarOpen, (newVal) => {
  if (newVal) fetchConnections()
})

const transformedData = computed(() => {
  const term = search.value.toLowerCase()
  let list = [...connections.value]

  if (term) {
    list = list.filter(c =>
      c.name?.toLowerCase().includes(term) ||
      c.connector_type_display?.toLowerCase().includes(term)
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

const goToCreateConnection = async () => {
  emit('close')
  await router.push('/bi/connections/new')
}

onMounted(fetchConnections)
</script>

<template>
  <div class="fixed top-0 right-0 w-full sm:w-[540px] h-full bg-zinc-900 text-white z-50 shadow-xl border-l border-zinc-700 flex flex-col" style="padding-left: 1rem; padding-right: 1rem;">
    <div class="space-y-4 flex-1 overflow-auto">
      <div class="flex gap-3" style="display: flex; flex-wrap: nowrap; margin-top: 1rem;">
        <input class="form-control" placeholder="Поиск..." style="width: 20.5rem;" v-model="search" />
        <select class="form-select" style="width: 11rem;" v-model="sort">
          <option value="new">Сначала новые</option>
          <option value="old">Сначала старые</option>
          <option value="az">А-Я</option>
          <option value="za">Я-А</option>
        </select>
        <button type="button" class="btn btn-primary" style="width: 12.5rem;" @click="goToCreateConnection">Создать подключение</button>
      </div>
      <div style="margin-top: 1rem;">
        <SimpleTableDataSet :cols="cols" :users="transformedData" :isDatasetSidebarOpen="isDatasetSidebarOpen" />
      </div>
    </div>
  </div>
</template>
