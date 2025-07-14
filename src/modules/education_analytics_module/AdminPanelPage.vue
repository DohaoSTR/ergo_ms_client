<template>
  <div>
    <h2 class="mb-4">Админ-панель</h2>

    <div class="tabs-container mb-4">
      <ul class="nav nav-tabs">
        <li class="nav-item" v-for="tab in tabs" :key="tab.id">
          <a class="nav-link" :class="{ active: activeTab === tab.id }" @click="switchTab(tab.id)">
            {{ tab.name }}
          </a>
        </li>
      </ul>
    </div>

    <div class="tab-content">
      <!-- Вкладка "БД" -->
      <div v-if="activeTab === 'database'" class="tab-pane active">
        <DatabaseManagementCard
          :is-downloading="isDownloading"
          v-model:is-uploading="isUploading"
          @download="downloadAllData"
          @clear="showConfirmationModal"
          @reload="delayedReload"
          :is-clearing="isClearing"
        />
        <DatabaseTablesCard
          :is-loading="isReloading || isLoading"
          :tables="tables"
          :selected-table="selectedTable"
          @select-table="selectTable"
          @reload="delayedReload"
        />
        <TableEditor
          v-if="selectedTable"
          :selected-table="selectedTable"
          @error="handleError"
        />
      </div>

      <!-- Вкладка "Извлечение данных" -->
      <div v-if="activeTab === 'data_extraction'" class="tab-pane active">
        <h3 class="mb-4">Извлечение данных</h3>
        <ExcelUploadCard />
        <ImportResultsCard />
      </div>

      <!-- Вкладка "Настройки" -->
      <div v-if="activeTab === 'settings'" class="tab-pane active">
        <h3>Настройки</h3>
        <p>Настройки аналитического модуля образования.</p>
      </div>

      <!-- Вкладка "Справка" -->
      <div v-if="activeTab === 'info'" class="tab-pane active">
        <h3>Справка</h3>
        <p>Справка по использованию аналитического модуля образования.</p>
        <p>В разработке...</p>
      </div>
    </div>

    <router-view />
    <ToastNotification ref="toast"/>
    <ClearDatabaseModal ref="clearModal" @confirm="clearDatabase"/>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { endpoints } from '@/js/api/endpoints'
import { apiClient } from '@/js/api/manager'
import DatabaseManagementCard from './cards/DatabaseManagementCard.vue'
import DatabaseTablesCard from './cards/DatabaseTablesCard.vue'
import ToastNotification from './cards/ToastNotification.vue'
import ClearDatabaseModal from './cards/ClearDatabaseModal.vue'
import TableEditor from './cards/TableEditor.vue'
import ExcelUploadCard from './cards/ExcelUploadCard.vue'
import ImportResultsCard from './cards/ImportResultsCard.vue'

const isLoading = ref(false)
const isDownloading = ref(false)
const isUploading = ref(false)
const isClearing = ref(false)
const isReloading = ref(false)
const tables = ref([])
const selectedTable = ref(null)

const toast = ref(null)
const clearModal = ref(null)

// Конфигурация вкладок
const tabs = ref([
  { id: 'database', name: 'БД' },
  { id: 'data_extraction', name: 'Извлечение данных' },
  { id: 'settings', name: 'Настройки' },
  { id: 'info', name: 'Справка' }
])
const activeTab = ref('database')

const switchTab = (tabId) => {
  activeTab.value = tabId
}

const TOAST_TYPES = {
  SUCCESS: 'success',
  ERROR: 'danger',
  INFO: 'primary'
}

const showToast = (message, type = TOAST_TYPES.SUCCESS) => {
  toast.value?.show(message, type)
}

const handleApiResponse = (response, successMsg) => {
  if (response.success) {
    if (successMsg) showToast(successMsg, TOAST_TYPES.SUCCESS)
    return response.data
  } else {
    showToast(response.errors || 'Ошибка запроса', TOAST_TYPES.ERROR)
    return null
  }
}

onMounted(async () => {
  await fetchTablesList()
})

const fetchTablesList = async () => {
  isLoading.value = true
  try {
    const response = await apiClient.get(endpoints.learning_analytics.tables)
    const data = handleApiResponse(response)
    tables.value = data?.tables || []
    if (tables.value.length > 0) {
      showToast(`Загружено ${tables.value.length} таблиц`, TOAST_TYPES.SUCCESS)
    }
  } finally {
    isLoading.value = false
  }
}

const downloadAllData = async () => {
  if (isDownloading.value) return
  isDownloading.value = true
  showToast('Функция еще не реализована', TOAST_TYPES.INFO)
  await new Promise(resolve => setTimeout(resolve, 1000))
  isDownloading.value = false
}

const showConfirmationModal = () => {
  clearModal.value?.show()
}

const clearDatabase = async () => {
  if (isClearing.value) return
  isClearing.value = true
  showToast('Очистка базы данных...', TOAST_TYPES.INFO)
  const response = await apiClient.post(endpoints.learning_analytics.clearTables)
  handleApiResponse(response, 'База данных успешно очищена')
  selectedTable.value = null
  await fetchTablesList()
  isClearing.value = false
}

const selectTable = (tableName) => {
  selectedTable.value = tableName === selectedTable.value ? null : tableName
  if (selectedTable.value) {
    showToast(`Выбрана таблица "${tableName}"`, TOAST_TYPES.INFO)
  }
}

const handleError = (message) => {
  showToast(message, TOAST_TYPES.ERROR)
}

const delayedReload = () => {
  isReloading.value = true
  setTimeout(async () => {
    await fetchTablesList()
    isReloading.value = false
  }, 1200)
}
</script>

<style scoped>
.tabs-container {
  border-bottom: 1px solid var(--bs-border-color, #dee2e6);
  margin-bottom: 1.5rem;
}

.nav-tabs {
  border-bottom-color: var(--bs-border-color, #dee2e6);
}

.nav-tabs .nav-item {
  margin-bottom: -1px;
}

.nav-tabs .nav-link {
  cursor: pointer;
  color: var(--bs-secondary, #6c757d);
  background-color: transparent;
  border: 1px solid transparent;
  border-top-left-radius: 0.25rem;
  border-top-right-radius: 0.25rem;
  padding: 0.75rem 1.25rem;
  font-weight: 500;
  transition: color 0.2s, border-color 0.2s, background-color 0.2s;
}

.nav-tabs .nav-link:hover {
  color: var(--bs-primary, #0d6efd);
  border-color: var(--bs-border-color, #dee2e6) var(--bs-border-color, #dee2e6) transparent;
}

.nav-tabs .nav-link.active {
  color: var(--bs-primary, #0d6efd);
  background-color: var(--bs-body-bg, #fff);
  border-color: var(--bs-border-color, #dee2e6) var(--bs-border-color, #dee2e6) var(--bs-body-bg, #fff);
}

.tab-content {
  padding-top: 1.5rem;
  background-color: var(--bs-body-bg, #fff);
}

.tab-pane {
  animation: fadeIn 0.3s ease-in-out;
}

@keyframes fadeIn {
  from { opacity: 0; transform: translateY(5px); }
  to { opacity: 1; transform: translateY(0); }
}
</style>
