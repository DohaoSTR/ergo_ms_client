<script setup>
import { ref, computed } from 'vue'
import { useRoute } from 'vue-router'
import {
  createDescriptions,
  patchDescriptions,
  deleteDescription,
  deleteMultipleDescriptions,
} from '@/js/api/services/bio-index'
import { Plus, Trash2, Info } from 'lucide-vue-next'
import { useToast } from 'vue-toastification'
import { handleApiError } from '@/pages/bio/js/bio-helpers'
import { tierOptions, abundanceOptions } from '@/pages/bio/js/bio-constants'

import BootstrapTable from '@/pages/bio/components/BootstrapTable.vue'
import SpeciesFormModal from '@/pages/bio/components/modals/SpeciesFormModal.vue'
import DeleteConfirmModal from '@/pages/bio/components/modals/DeleteConfirmModal.vue'
import CustomDropdown from '@/pages/bio/components/CustomDropdown.vue'

const route = useRoute()
const toast = useToast()

const emit = defineEmits(['update-descriptions'])

const props = defineProps({
  descriptions: { type: Array, required: true },
  isLoading: { type: Boolean, default: false }
})

// Локальные данные
const error = ref(null)
const addSpeciesModalId = 'addSpeciesModal'
const deleteSpeciesConfirmModalId = 'deleteSpeciesConfirmModal'
const tableRef = ref(null)
const selectedDescriptions = ref([])
const isDeletingMultiple = ref(false)
const savingDescriptions = ref(new Set())

const editingValues = ref({})
const editingField = ref(null)

const search = ref('')

const siteNumber = computed(() => route.params.siteNumber)
const zoneType = computed(() => route.params.zoneType)

// Отфильтрованное описание растительности на основе поискового запроса
const filteredDescriptions = computed(() => {
  if (!search.value) return props.descriptions

  const term = search.value.toLowerCase()
  return props.descriptions.filter((description) => {
    const title = String(description.title || '').toLowerCase()
    const author = String(description.author || '').toLowerCase()

    return title.includes(term) || author.includes(term)
  })
})

const columns = [
  { field: 'title', header: 'Название вида', sortable: true, width: '35%' },
  { field: 'author', header: 'Автор', sortable: true, width: '25%' },
  { field: 'tier', header: 'Ярус', sortable: true, width: '20%' },
  { field: 'abundance', header: 'Балл обилия', sortable: true, width: '20%' },
]

const closeModal = (modalId) => {
  const dismissBtn = document.querySelector(`#${modalId} [data-bs-dismiss="modal"]`)
  if (dismissBtn) {
    dismissBtn.click()
  }
}

const handleAddSpecies = async (speciesData, callback) => {
  error.value = null

  try {
    const response = await createDescriptions(siteNumber.value, zoneType.value, speciesData)

    if (response.success) {
      toast.success('Виды успешно добавлены')
      closeModal(addSpeciesModalId)
      callback && callback(null)
      
      // Уведомляем родителя о необходимости обновить данные
      emit('update-descriptions')
    } else {
      const errorMessage = handleApiError(response, 'Ошибка при добавлении видов', toast)
      callback && callback(errorMessage)
    }
  } catch (err) {
    const errorMessage = handleApiError(err, 'Ошибка при добавлении видов', toast)
    callback && callback(errorMessage)
  }
}

// Получить текущее значение для редактирования
const getEditingValue = (descriptionId, field) => {
  const key = `${descriptionId}_${field}`

  // Если значение находится в процессе редактирования (есть в editingValues),
  // возвращаем его независимо от того, идет ли сохранение
  if (key in editingValues.value) {
    return editingValues.value[key]
  }

  // Иначе берем значение из основных данных
  const description = props.descriptions.find((d) => d.id === descriptionId)
  return description ? description[field] : ''
}

// Установить редактируемое значение
const setEditingValue = (descriptionId, field, value) => {
  const key = `${descriptionId}_${field}`
  editingValues.value[key] = value

  // Устанавливаем текущее редактируемое поле
  editingField.value = key

  // Запускаем обновление данных
  updateDescriptionField(descriptionId, field, value)
}

// Функция обновления поля описания (ярус или балл обилия)
const updateDescriptionField = async (descriptionId, field, value) => {
  if (!descriptionId) return

  // Найдем исходное описание для сравнения
  const description = props.descriptions.find((d) => d.id === descriptionId)
  if (!description) return

  // Если значение не изменилось, ничего не делаем
  if (description[field] === value) return

  // Отмечаем описание как редактируемое
  savingDescriptions.value.add(descriptionId)

  // Подготовим данные для обновления
  const updatedData = {
    title: description.title,
    author: description.author,
    tier: field === 'tier' ? value : description.tier,
    abundance: field === 'abundance' ? value : description.abundance,
  }

  // Проверим, меняется ли ярус
  const tierChanged = field === 'tier' && value !== description.tier

  try {
    if (tierChanged) {
      // Если меняется ярус, используем логику с удалением + созданием
      const createResponse = await patchDescriptions(siteNumber.value, zoneType.value, [
        updatedData,
      ])

      if (createResponse.success) {
        const deleteResponse = await deleteDescription(descriptionId)

        if (deleteResponse.success) {
          // Удаляем редактируемые значения для этой записи
          Object.keys(editingValues.value).forEach((key) => {
            if (key.startsWith(`${descriptionId}_`)) {
              delete editingValues.value[key]
            }
          })

          emit('update-descriptions')
          toast.success('Ярус успешно обновлен')
        } else {
          delete editingValues.value[`${descriptionId}_${field}`]
          error.value = handleApiError(deleteResponse, 'Ошибка при изменении яруса', toast)
        }
      } else {
        delete editingValues.value[`${descriptionId}_${field}`]
        error.value = handleApiError(
          createResponse,
          'Ошибка при создании обновленного описания',
          toast,
        )
      }
    } else {
      // Стандартное обновление одного поля
      const response = await patchDescriptions(siteNumber.value, zoneType.value, [updatedData])

      if (response.success) {
        emit('update-descriptions')
        toast.success(`${field === 'tier' ? 'Ярус' : 'Балл обилия'} успешно обновлен`)

        delete editingValues.value[`${descriptionId}_${field}`]
      } else {
        delete editingValues.value[`${descriptionId}_${field}`]
        error.value = handleApiError(
          response,
          `Ошибка при обновлении ${field === 'tier' ? 'яруса' : 'балла обилия'}`,
          toast,
        )
      }
    }
  } catch (err) {
    delete editingValues.value[`${descriptionId}_${field}`]
    error.value = handleApiError(
      err,
      `Ошибка при обновлении ${field === 'tier' ? 'яруса' : 'балла обилия'}`,
      toast,
    )
  } finally {
    savingDescriptions.value.delete(descriptionId)
    editingField.value = null
  }
}

const handleDropdownChange = (descriptionId, field, value) => {
  setEditingValue(descriptionId, field, value)
}

const handleSelectionChange = (selectedIds) => {
  selectedDescriptions.value = selectedIds
}

const handleDeleteSelected = async () => {
  if (selectedDescriptions.value.length === 0) return

  isDeletingMultiple.value = true

  try {
    const response = await deleteMultipleDescriptions(selectedDescriptions.value)

    if (response.success) {
      toast.success(`Удалено описаний: ${selectedDescriptions.value.length}`)

      // Очищаем редактируемые значения для удаленных записей
      selectedDescriptions.value.forEach((id) => {
        Object.keys(editingValues.value).forEach((key) => {
          if (key.startsWith(`${id}_`)) {
            delete editingValues.value[key]
          }
        })
      })

      emit('update-descriptions')

      // Clear selection
      if (tableRef.value) {
        tableRef.value.clearSelection()
      }

      // Закрытие модального окна
      closeModal(deleteSpeciesConfirmModalId)
    } else {
      error.value = handleApiError(response, 'Ошибка при удалении описаний', toast)
    }
  } catch (err) {
    error.value = handleApiError(err, 'Ошибка при удалении описаний', toast)
  } finally {
    isDeletingMultiple.value = false
  }
}

// Обработчик поиска
const handleSearch = (term) => {
  search.value = term
}
</script>

<template>
  <!-- Error Display -->
  <div v-if="error" class="alert alert-danger mb-4">
    <div class="d-flex align-items-center gap-3">
      <Info :size="24" />
      <div>{{ error }}</div>
    </div>
  </div>

  <div class="card p-0">
    <div
      class="card-header custom-card-header border border-bottom-0 text-white d-flex justify-content-between align-items-center"
    >
      <h5 class="mb-0">Описание растительности</h5>
      <div class="d-flex gap-2">
        <button
          v-if="selectedDescriptions.length > 0"
          class="btn btn-sm btn-danger text-nowrap"
          data-bs-toggle="modal"
          :data-bs-target="`#${deleteSpeciesConfirmModalId}`"
        >
          <Trash2 :size="16" class="me-1" /> Удалить ({{ selectedDescriptions.length }})
        </button>
        <input
          type="search"
          class="form-control form-control-sm"
          placeholder="Поиск..."
          @input="handleSearch($event.target.value)"
        />
        <button
          class="btn btn-sm btn-primary text-nowrap"
          data-bs-toggle="modal"
          :data-bs-target="`#${addSpeciesModalId}`"
        >
          <Plus :size="16" class="me-1" /> Добавить вид
        </button>
      </div>
    </div>
    <div class="card-body">
      <div
        v-if="descriptions.length === 0 && !isLoading"
        class="alert alert-info mb-0 rounded-0 rounded-bottom"
      >
        Нет описания растительности для данной площадки. Добавьте описание растительности, используя кнопку выше.
      </div>
      <template v-else>
        <BootstrapTable
          ref="tableRef"
          :data="filteredDescriptions"
          :loading="isLoading"
          :rowsPerPage="10"
          emptyMessage="Нет описания растительности"
          :columns="columns"
          initialSortField="title"
          :initialSortOrder="1"
          :selectable="true"
          @selection-change="handleSelectionChange"
        >
          <!-- Tier column custom rendering -->
          <template #cell-tier="{ data }">
            <CustomDropdown
              :value="getEditingValue(data.id, 'tier')"
              :options="tierOptions"
              :disabled="savingDescriptions.has(data.id)"
              @update:value="(value) => handleDropdownChange(data.id, 'tier', value)"
            >
              <template
                v-if="savingDescriptions.has(data.id) && editingField === `${data.id}_tier`"
                #toggle-icon
              >
                <span class="spinner-border spinner-border-sm" role="status"></span>
              </template>
            </CustomDropdown>
          </template>

          <!-- Abundance column custom rendering -->
          <template #cell-abundance="{ data }">
            <CustomDropdown
              :value="getEditingValue(data.id, 'abundance')"
              :options="abundanceOptions"
              :disabled="savingDescriptions.has(data.id)"
              @update:value="(value) => handleDropdownChange(data.id, 'abundance', value)"
            >
              <template
                v-if="savingDescriptions.has(data.id) && editingField === `${data.id}_abundance`"
                #toggle-icon
              >
                <span class="spinner-border spinner-border-sm" role="status"></span>
              </template>
            </CustomDropdown>
          </template>
        </BootstrapTable>
      </template>
    </div>
  </div>

  <!-- Модальное окно подтверждения удаления -->
  <DeleteConfirmModal
    :modalId="deleteSpeciesConfirmModalId"
    message="Вы уверены, что хотите удалить выбранные виды?"
    :count="selectedDescriptions.length"
    :loading="isDeletingMultiple"
    @confirm="handleDeleteSelected"
  />

  <!-- Species Form Modal -->
  <SpeciesFormModal
    :modalId="addSpeciesModalId"
    :existingDescriptions="descriptions"
    @addSpecies="handleAddSpecies"
  />
</template>

<style lang="scss" scoped>
.card-header {
  padding: 0.75rem 1rem;
}

.card-body {
  padding: 0;
}

/* Устанавливаем ширину колонок */
:deep(th:nth-child(2)) {
  width: v-bind('columns[0].width');
}
:deep(th:nth-child(3)) {
  width: v-bind('columns[1].width');
}
:deep(th:nth-child(4)) {
  width: v-bind('columns[2].width');
}
:deep(th:nth-child(5)) {
  width: v-bind('columns[3].width');
}

/* Убираем паддинг только для ячеек с дропдаунами */
:deep(td:nth-child(4)),
:deep(td:nth-child(5)) {
  padding: 0 !important;
  position: relative !important;
  height: 100% !important;
}

/* Растягиваем дропдаун на всю высоту ячейки */
:deep(td) .custom-dropdown {
  position: absolute !important;
  top: 0 !important;
  left: 0 !important;
  right: 0 !important;
  bottom: 0 !important;
  width: 100% !important;
  height: 100% !important;
}

/* Стили для таблицы */
:deep(.table) {
  table-layout: fixed;

  td {
    vertical-align: top !important;
  }
}

/* Добавляем стиль для .table-responsive, чтобы overflow не обрезал дропдауны */
:deep(.table-responsive) {
  overflow: visible;
}

/* Стили для спиннера в дропдауне */
.spinner-border {
  width: 14px;
  height: 14px;
  color: var(--color-secondary-text);
}

.custom-card-header {
  background-color: var(--bs-secondary);
  border-bottom: none;
  
  [data-bs-theme="dark"] & {
    background-color: rgba(var(--bs-secondary-rgb), 0.07);
  }
}
</style>
