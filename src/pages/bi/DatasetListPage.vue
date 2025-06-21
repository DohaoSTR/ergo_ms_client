<script setup>
import { ref, watch, onMounted, computed } from 'vue'
import { useRouter } from 'vue-router'
import { endpoints } from '@/js/api/endpoints.js'
import { apiClient } from '@/js/api/manager.js'
import { DatasetDTO } from '@/pages/bi/components/dto/dataset.js'
import { isDatasetSidebarOpen } from '@/js/bi/useSidebarStore'
import SimpleTableDataSet from '@/pages/bi/components/SimpleTableDataSet.vue'

const datasets = ref([])
const search = ref('')
const sort = ref('new')
const loading = ref(false)

const cols = [
  { key: 'name', label: 'Название' },
  { key: 'created_at', label: 'Дата', format: val => new Date(val).toLocaleDateString() },
  { key: 'actions', label: '' }
]

const router = useRouter()

function goToNewDataset() {
  router.push('/bi/dataset/new')
}

async function fetchDatasets () {
  loading.value = true
  try {
    const { data } = await apiClient.get(endpoints.bi.DatasetsList)
    const rows = Array.isArray(data) ? data : (data.results || [])
    datasets.value = rows.map(item => new DatasetDTO({
      id:   item.id,
      name: item.name,
      owner_username: item.owner_username,
      created_at: item.created_at,
      storage_type: item.storage_type
    }))
  } catch (err) {
    console.error('Ошибка загрузки датасетов:', err)
  } finally {
    loading.value = false
  }
}

watch(isDatasetSidebarOpen, (newVal) => {
  if (newVal) fetchDatasets()
})

const transformedData = computed(() => {
  const term = search.value.toLowerCase()
  let list = [...datasets.value]

  if (term) {
    list = list.filter(d =>
      d.name?.toLowerCase().includes(term) ||
      d.owner_username?.toLowerCase().includes(term)
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

 onMounted(fetchDatasets)
</script>

<template>
  <div class="fixed top-0 right-0 w-full sm:w-[540px] h-full bg-zinc-900 z-50 shadow-xl border-l border-zinc-700 flex flex-col" style="padding-left: 1rem; padding-right: 1rem; overflow-y: hidden;">
    <div class="space-y-4 flex-1 overflow-auto">
      <div class="flex gap-3" style="display: flex; flex-wrap: nowrap; margin-top: 1rem;">
        <input class="form-control" placeholder="Введите для поиска..." style="width: 25rem;" v-model="search" />
        <select class="form-select" style="width: 11rem;" v-model="sort">
          <option value="new">Сначала новые</option>
          <option value="old">Сначала старые</option>
          <option value="az">А-Я</option>
          <option value="za">Я-А</option>
        </select>
        <button type="button" class="btn btn-primary" style="width: 10rem;" @click="goToNewDataset">Создать датасет</button>
      </div>
      <div style="margin-top: 1rem;">
        <div v-if="loading" class="loader-center">
          <span class="loader"></span>
        </div>
        <SimpleTableDataSet v-else :cols="cols" current-page="datasets" :users="transformedData" :isDatasetSidebarOpen="isDatasetSidebarOpen"/>
      </div>
    </div>
  </div>
</template>

<style scoped lang="scss">
  .loader-center {
  min-height: 240px;
  display: flex; align-items: center; justify-content: center;
}
.loader {
  border: 4px solid var(--color-border);
  border-top: 4px solid var(--color-accent);
  border-radius: 50%;
  width: 42px; height: 42px;
  animation: spin 1s linear infinite;
}
@keyframes spin { 100% { transform: rotate(360deg); } }
</style>