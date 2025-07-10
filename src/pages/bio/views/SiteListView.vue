<script setup>
import { ref, onMounted, computed } from 'vue'
import {
  getSites,
  createSite,
  deleteSite,
  deleteMultipleSites,
  updateSite,
} from '@/js/api/services/bio-index'
import { CircleAlert, Plus, Eye, Pencil, Trash2, BarChart2, MapPin } from 'lucide-vue-next'
import SiteFormModal from '@/pages/bio/components/modals/SiteFormModal.vue'
import DeleteConfirmModal from '@/pages/bio/components/modals/DeleteConfirmModal.vue'
import AddToCAModal from '@/pages/bio/components/modals/AddToCAModal.vue'
import BootstrapTable from '@/pages/bio/components/BootstrapTable.vue'
import { useToast } from 'vue-toastification'
import { useRouter } from 'vue-router'
import { handleApiError, formatDate, getZoneTypeTranslation } from '@/pages/bio/js/bio-helpers'
import { useConsolidatedAnalysisStore } from '@/stores/consolidatedAnalysisStore'

const toast = useToast()
const router = useRouter()
const consolidatedStore = useConsolidatedAnalysisStore()

const sites = ref([])
const isLoading = ref(true)
const error = ref(null)
const search = ref('')
const rowsPerPage = ref(10)
const createSiteModalId = 'createSiteModal'
const editSiteModalId = 'editSiteModal'
const deleteSiteConfirmModalId = 'deleteSiteModal'
const deleteSitesConfirmModalId = 'deleteSitesModal'
const addToCAModalId = 'addToCAModal'
const siteToDelete = ref(null)
const siteToEdit = ref(null)
const isDeletingSite = ref(false)
const isDeletingMultiple = ref(false)
const selectedSites = ref([])
const tableRef = ref(null)
const modalLoading = ref(false)
const duplicateSites = ref([])

const columns = [
  { field: 'site_number', header: '№', sortable: true },
  { field: 'zone_type', header: 'Тип местности', sortable: true },
  { field: 'date', header: 'Дата', sortable: true },
  { field: 'size', header: 'Площадь (м²)', sortable: true },
  { field: 'district', header: 'Район', sortable: true },
  { field: 'coordinates', header: 'Координаты', sortable: false },
]

const filteredSites = computed(() => {
  if (!search.value) return sites.value

  const term = search.value.toLowerCase()
  return sites.value.filter((site) => {
    const siteNumber = String(site.site_number || '').toLowerCase()
    const district = String(site.district || '').toLowerCase()
    const zoneTypeTranslated = String(getZoneTypeTranslation(site.zone_type) || '').toLowerCase()
    const dateISO = String(site.date || '').toLowerCase()

    let formattedDate = '-'
    if (site.date) {
      const date = new Date(site.date)
      if (!isNaN(date.getTime())) {
        formattedDate = date.toLocaleDateString('ru-RU').toLowerCase()
      }
    }

    return (
      siteNumber.includes(term) ||
      zoneTypeTranslated.includes(term) ||
      district.includes(term) ||
      dateISO.includes(term) ||
      formattedDate.includes(term)
    )
  })
})

const handleViewSite = (site) => {
  const siteNumber = site.site_number
  const zoneType = site.zone_type
  router.push({
    name: 'SiteView',
    params: { siteNumber, zoneType },
  })
}

const handleEditSite = (site) => {
  siteToEdit.value = { ...site }
}

const closeModal = (modalId) => {
  const dismissBtn = document.querySelector(`#${modalId} [data-bs-dismiss="modal"]`)
  if (dismissBtn) {
    dismissBtn.click()
  }

  if (modalId === editSiteModalId) {
    siteToEdit.value = null
  }
}

const confirmDeleteSite = (site) => {
  siteToDelete.value = site
}

const fetchSites = async () => {
  isLoading.value = true
  error.value = null

  try {
    const response = await getSites()
    if (response.success) {
      const data = response.data.results || response.data
      sites.value = data.map((site) => {
        return {
          ...site,
          coordinates:
            site.latitude && site.longitude ? `${site.latitude}, ${site.longitude}` : '-',
        }
      })
    } else {
      error.value = handleApiError(response, 'Ошибка загрузки площадок', toast)
    }
  } catch (err) {
    error.value = handleApiError(err, 'Ошибка загрузки площадок', toast)
  } finally {
    isLoading.value = false
  }
}

const handleUpdateSite = async (siteData, callback) => {
  isLoading.value = true
  error.value = null

  try {
    const response = await updateSite(siteData.site_number, siteData.zone_type, siteData)
    if (response.success) {
      await fetchSites()
      closeModal(editSiteModalId)
      toast.success(`Площадка №${siteData.site_number} успешно обновлена`)
      callback && callback(null)
    } else {
      const errorMessage = handleApiError(response, 'Ошибка обновления площадки', toast)
      callback && callback(errorMessage)
    }
  } catch (err) {
    const errorMessage = handleApiError(err, 'Ошибка обновления площадки', toast)
    callback && callback(errorMessage)
  } finally {
    isLoading.value = false
  }
}

const handleCreateSite = async (siteData, callback) => {
  isLoading.value = true
  error.value = null

  try {
    const response = await createSite(siteData)
    if (response.success) {
      await fetchSites()
      closeModal(createSiteModalId)
      toast.success(`Площадка №${response.data.site_number || ''} успешно создана`)
      callback && callback(null)
    } else {
      const errorMessage = handleApiError(response, 'Ошибка создания площадки', toast)
      callback && callback(errorMessage)
    }
  } catch (err) {
    const errorMessage = handleApiError(err, 'Ошибка создания площадки', toast)
    callback && callback(errorMessage)
  } finally {
    isLoading.value = false
  }
}

const handleDeleteSite = async () => {
  if (!siteToDelete.value) return

  isDeletingSite.value = true

  try {
    const response = await deleteSite(siteToDelete.value.site_number, siteToDelete.value.zone_type)
    if (response.success) {
      await fetchSites()
      if (tableRef.value) {
        tableRef.value.clearSelection()
      }
      closeModal(deleteSiteConfirmModalId)
      toast.success(`Площадка №${siteToDelete.value.site_number} успешно удалена`)
      siteToDelete.value = null
    } else {
      handleApiError(response, 'Ошибка удаления площадки', toast)
    }
  } catch (err) {
    handleApiError(err, 'Ошибка удаления площадки', toast)
  } finally {
    isDeletingSite.value = false
  }
}

const handleSearchSites = (term) => {
  search.value = term
}

const handleSelectionChange = (selectedIds) => {
  selectedSites.value = selectedIds
}

const goToConsolidatedAnalysis = async () => {
  if (selectedSites.value.length === 0) return
  
  modalLoading.value = true
  duplicateSites.value = []
  
  try {
    // Проверяем наличие дубликатов
    const existingSiteNumbers = consolidatedStore.sites.map(site => 
      `${site.site_number}_${site.zone_type}`
    )
    
    // Загружаем данные о выбранных площадках для проверки
    for (const id of selectedSites.value) {
      const siteDetails = await consolidatedStore.fetchSiteById(id, toast)
      
      if (siteDetails) {
        const siteKey = `${siteDetails.site_number}_${siteDetails.zone_type}`
        
        if (existingSiteNumbers.includes(siteKey)) {
          // Находим существующую площадку с таким же номером и типом
          const existingSite = consolidatedStore.sites.find(
            site => site.site_number === siteDetails.site_number && site.zone_type === siteDetails.zone_type
          )
          
          // Добавляем информацию о дубликате
          duplicateSites.value.push({
            id: siteDetails.id,
            site_number: siteDetails.site_number,
            zone_type: siteDetails.zone_type,
            zone_type_translated: getZoneTypeTranslation(siteDetails.zone_type),
            existingSiteId: existingSite?.id
          })
        }
      }
    }

    // Если есть дубликаты, показываем диалог
    if (duplicateSites.value.length > 0) {
      showAddToCAModal()
      return
    }
    
    // Если дубликатов нет, сразу переходим к анализу
    await handleAddToCA()
    
  } catch (err) {
    toast.error(`Ошибка при проверке площадок: ${err.message}`)
    modalLoading.value = false
  }
}

const showAddToCAModal = () => {
  // Открываем диалоговое окно
  const modal = document.createElement('button')
  modal.setAttribute('data-bs-toggle', 'modal')
  modal.setAttribute('data-bs-target', `#${addToCAModalId}`)
  modal.style.display = 'none'
  document.body.appendChild(modal)
  modal.click()
  document.body.removeChild(modal)
  modalLoading.value = false
}

const handleAddToCA = async () => {
  try {
    modalLoading.value = true
    
    // Используем все выбранные площадки, включая дубликаты
    const siteIdsToAdd = selectedSites.value
    
    if (siteIdsToAdd.length === 0) {
      toast.error('Нет площадок для добавления')
      modalLoading.value = false
      return
    }
    
    // Добавляем площадки в анализ
    const result = await consolidatedStore.addSitesToTable(siteIdsToAdd, toast)
    
    if (!result.success) {
      toast.error(result.errorMessage)
    } else {
      if (result.skippedSites > 0) {
        toast.info(`Добавлено площадок: ${result.addedSites}, пропущено: ${result.skippedSites}`)
      } else {
        toast.success(`Добавлено площадок: ${result.addedSites}`)
      }
      
      // Переходим на страницу анализа
      router.push({ name: 'SiteConsolidatedAnalysis' })
    }
  } catch (err) {
    toast.error(`Ошибка при добавлении площадок: ${err.message}`)
  } finally {
    modalLoading.value = false
    closeModal(addToCAModalId)
  }
}

const handleReplaceAndAdd = async () => {
  try {
    modalLoading.value = true
    
    // Удаляем дублирующиеся площадки
    for (const dupSite of duplicateSites.value) {
      if (dupSite.existingSiteId) {
        consolidatedStore.removeSite(dupSite.existingSiteId)
      }
    }
    
    // Добавляем все выбранные площадки
    await handleAddToCA()
    
  } catch (err) {
    toast.error(`Ошибка при замене площадок: ${err.message}`)
    modalLoading.value = false
  }
}

const handleCancelModal = () => {
  closeModal(addToCAModalId)
  modalLoading.value = false
}

const handleDeleteMultiple = async () => {
  if (selectedSites.value.length === 0) return

  isDeletingMultiple.value = true

  try {
    const response = await deleteMultipleSites(selectedSites.value)
    if (response.success) {
      const deletedCount = selectedSites.value.length
      await fetchSites()
      if (tableRef.value) {
        tableRef.value.clearSelection()
      }
      closeModal(deleteSitesConfirmModalId)
      toast.success(`Удалено площадок: ${deletedCount}`)
      selectedSites.value = []
    } else {
      handleApiError(response, 'Ошибка удаления площадок', toast)
    }
  } catch (err) {
    handleApiError(err, 'Ошибка удаления площадок', toast)
  } finally {
    isDeletingMultiple.value = false
  }
}

// Открытие площадки на карте
const openOnMap = (site) => {
  if (site.latitude && site.longitude) {
    router.push({
      name: 'SitesMap',
      query: {
        siteNumber: site.site_number,
        zoneType: site.zone_type,
      }
    });
  }
};

onMounted(() => {
  fetchSites()
})
</script>

<template>
  <!-- Error Display -->
  <div v-if="error" class="alert alert-danger mb-4">
    <div class="d-flex align-items-center gap-3">
      <CircleAlert :size="24" />
      <div>{{ error }}</div>
    </div>
  </div>

  <div class="card p-0">
    <div
      class="card-header custom-card-header border border-bottom-0 text-white d-flex justify-content-between align-items-center"
    >
      <h5 class="mb-0">Площадки</h5>
      <div class="d-flex gap-2">
        <button
          v-if="selectedSites.length > 0"
          class="btn btn-sm btn-danger text-nowrap"
          data-bs-toggle="modal"
          :data-bs-target="`#${deleteSitesConfirmModalId}`"
        >
          <Trash2 :size="16" class="me-1" /> Удалить ({{ selectedSites.length }})
        </button>
        <div
          v-if="selectedSites.length > 0"
          class="d-inline-block"
        >
          <button
            class="btn btn-sm btn-success text-nowrap btn-consolidated-analysis"
            @click="goToConsolidatedAnalysis"
            :disabled="modalLoading"
          >
            <span v-if="modalLoading" class="spinner-border spinner-border-sm me-1"></span>
            <BarChart2 v-else :size="16" class="me-1" /> 
            Добавить в сводный анализ ({{ selectedSites.length }})
          </button>
        </div>
        <input
          type="search"
          class="form-control form-control-sm"
          placeholder="Поиск..."
          @input="handleSearchSites($event.target.value)"
        />
        <button
          class="btn btn-sm btn-primary text-nowrap"
          data-bs-toggle="modal"
          :data-bs-target="`#${createSiteModalId}`"
        >
          <Plus :size="16" class="me-1" /> Создать площадку
        </button>
      </div>
    </div>

    <div class="card-body">
      <div
        v-if="sites.length === 0 && !isLoading"
        class="alert alert-info mb-0 rounded-0 rounded-bottom"
      >
        Нет доступных площадок. Создайте новую площадку, нажав кнопку выше.
      </div>

      <div v-else>
        <!-- Sites table -->
        <div class="site-table-container">
          <BootstrapTable
            ref="tableRef"
            :data="filteredSites"
            :loading="isLoading"
            :rowsPerPage="rowsPerPage"
            initialSortField="created_at"
            :initialSortOrder="-1"
            emptyMessage="Нет площадок"
            :columns="columns"
            :selectable="true"
            @selection-change="handleSelectionChange"
          >
            <!-- Добавляем заголовок для actions-column -->
            <template #header>
              <th scope="col" class="fw-bold text-dark-emphasis text-center">Действия</th>
            </template>

            <!-- Zone Type column custom rendering -->
            <template #cell-zone_type="{ data }">
              {{ getZoneTypeTranslation(data.zone_type) }}
            </template>

            <!-- Date column custom rendering -->
            <template #cell-date="{ data }">
              {{ formatDate(data.date) }}
            </template>

            <!-- Size column custom rendering -->
            <template #cell-size="{ data }">
              {{ data.size || '-' }}
            </template>

            <!-- District column custom rendering -->
            <template #cell-district="{ data }">
              {{ data.district || '-' }}
            </template>

            <!-- Coordinates column custom rendering -->
            <template #cell-coordinates="{ data }">
              <div class="d-flex align-items-center justify-content-between gap-1">
                <span class="coord-text">{{ data.coordinates }}</span>
                <button
                  v-if="data.latitude && data.longitude"
                  class="btn btn-icon btn-sm text-primary"
                  @click="openOnMap(data)"
                  v-tooltip
                  title="Посмотреть на карте"
                >
                  <MapPin :size="14" />
                </button>
              </div>
            </template>

            <!-- Actions column -->
            <template #row-actions="{ row }">
              <td class="actions-column">
                <div class="d-flex gap-1 justify-content-center">
                  <button
                    class="btn btn-icon text-info"
                    @click="handleViewSite(row)"
                    v-tooltip
                    title="Просмотр"
                  >
                    <Eye :size="16" />
                  </button>
                  <button
                    class="btn btn-icon text-success"
                    @click="handleEditSite(row)"
                    v-tooltip
                    title="Редактировать"
                    data-bs-toggle="modal"
                    :data-bs-target="`#${editSiteModalId}`"
                  >
                    <Pencil :size="16" />
                  </button>
                  <button
                    class="btn btn-icon text-danger"
                    @click="confirmDeleteSite(row)"
                    v-tooltip
                    title="Удалить"
                    data-bs-toggle="modal"
                    :data-bs-target="`#${deleteSiteConfirmModalId}`"
                  >
                    <Trash2 :size="16" />
                  </button>
                </div>
              </td>
            </template>
          </BootstrapTable>
        </div>
      </div>
    </div>

    <!-- Create Site Modal -->
    <SiteFormModal :modalId="createSiteModalId" @createSite="handleCreateSite" />

    <!-- Edit Site Modal -->
    <SiteFormModal
      :modalId="editSiteModalId"
      :initialData="siteToEdit"
      :isEdit="true"
      @updateSite="handleUpdateSite"
    />

    <!-- Delete Confirmation Modal -->
    <DeleteConfirmModal
      :modalId="deleteSiteConfirmModalId"
      :title="`Подтвердите удаление площадки`"
      :message="`Вы уверены, что хотите удалить площадку №${siteToDelete?.site_number || ''}?`"
      :loading="isDeletingSite"
      warningText="Это действие нельзя будет отменить."
      @confirm="handleDeleteSite"
    />

    <!-- Delete Multiple Confirmation Modal -->
    <DeleteConfirmModal
      :modalId="deleteSitesConfirmModalId"
      :title="`Подтвердите удаление площадок`"
      :message="`Вы уверены, что хотите удалить выбранные площадки (${selectedSites.length})?`"
      :loading="isDeletingMultiple"
      warningText="Это действие нельзя будет отменить."
      @confirm="handleDeleteMultiple"
    />
    
    <!-- Диалог для работы с дублирующимися площадками -->
    <AddToCAModal
      :modalId="addToCAModalId"
      :duplicateSites="duplicateSites"
      :loading="modalLoading"
      :selectedSitesCount="selectedSites.length"
      @replaceAndAdd="handleReplaceAndAdd"
      @skipDuplicates="handleAddToCA"
      @cancel="handleCancelModal"
    />
  </div>
</template>

<style lang="scss" scoped>
.actions-column {
  width: 1%;
  white-space: nowrap;
  padding: 0.25rem !important;
}

.btn-icon {
  padding: 0.25rem;
  line-height: 1;

  &:hover {
    background-color: var(--bs-tertiary-bg);
    border-radius: 0.25rem;
  }

  &:focus {
    box-shadow: none;
  }
}

.card-header {
  padding: 0.75rem 1rem;
}

.card-body {
  padding: 0;
}

.btn-consolidated-analysis {
  &:disabled {
    opacity: 0.5;
    cursor: not-allowed !important;
    pointer-events: all !important;
  }
}

.custom-card-header {
  background-color: var(--bs-secondary);
  border-bottom: none;
  
  [data-bs-theme="dark"] & {
    background-color: rgba(var(--bs-secondary-rgb), 0.07);
  }
}

.coord-text {
  overflow: hidden;
  text-overflow: ellipsis;
}
</style>
