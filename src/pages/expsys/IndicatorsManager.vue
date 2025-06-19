<script setup>
import { ref, watch } from 'vue'
import { 
  fetchSubjectCompetencies,
  fetchIndicators, 
  fetchSubjectsCountByIndicator,
  fetchIndicatorsCompetencie,
  createIndicator,
  deleteIndicator,
  updateIndicator
} from '@/js/api/services/expsysService'
import IndicatorDetailsModal from './IndicatorDetailsModal.vue'
import DropDown from '@/components/DropDown.vue'
import { EllipsisVertical, Edit, Trash, Info, SquarePlus, ArrowLeftToLine } from 'lucide-vue-next'
import { onMounted } from 'vue'
import CompetenceStats from '@/pages/expsys/CompetenceStats.vue'
import { useToast } from 'vue-toastification'
const toast = useToast()

const props = defineProps({
  subjectId: {
    type: Number,
    required: false
  },
  competenceId: {
    type: Number,
    required: false
  },
  competence: {
    type: Object,
    required: false
  },
  subjectName: {
    type: String,
    default: 'Не указано'
  },
  isIndicator: {
    type: Boolean,
    default: false
  },
  isCompetence: {
    type: Boolean,
    default: false
  }
})
const emit = defineEmits(['back', 'close'])

// Реактивные состояния
const indicators = ref([])
const loading = ref(false)
const error = ref(null)
const showAddModal = ref(false)
const showDeleteModal = ref(false)
const indicatorToDelete = ref(null)
const selectedIndicator = ref(null)
const saving = ref(false)
const deleting = ref(false)
const subjectsCounts = ref({})
const editingIndicator = ref(getEmptyIndicator())

function getEmptyIndicator() {
  return {
    id: null,
    name: '',
    description: '',
    category: ''
  }
}

async function saveIndicator() {
  saving.value = true
  error.value = null
  try {
    if (!editingIndicator.value.name?.trim()) {
      throw new Error('Название индикатора обязательно')
    }

    const payload = {
      name: editingIndicator.value.name.trim(),
      description: editingIndicator.value.description?.trim() || '',
      category: editingIndicator.value.category?.trim() || '',
      ...(props.subjectId && { subject_id: props.subjectId }),
      ...(props.competenceId && { competence_id: props.competenceId })
    }

    let updatedIndicator

    if (editingIndicator.value.id) {
      // Редактирование существующего индикатора
      updatedIndicator = await updateIndicator(editingIndicator.value.id, payload)
      const index = indicators.value.findIndex(i => i.id === updatedIndicator.id)
      if (index !== -1) {
        indicators.value[index] = updatedIndicator
      }
      toast.success('Индикатор успешно обновлён')
    } else {
      // Создание нового индикатора
      updatedIndicator = await createIndicator(payload)
      indicators.value.unshift(updatedIndicator)
      toast.success('Индикатор успешно создан')
    }

    closeModal()
  } catch (err) {
    error.value = err.message || 'Не удалось сохранить индикатор'
    toast.error(error.value)
    console.error('Ошибка сохранения индикатора:', err)
  } finally {
    saving.value = false
  }
}

async function loadIndicators() {
  loading.value = true
  error.value = null
  try {
    if (props.isIndicator && props.subjectId) {
      // Загрузка для предмета
      const data = await fetchSubjectCompetencies(props.subjectId)
      indicators.value = Array.isArray(data) ? data : []
      await loadSubjectsCounts()
    } else if (!props.isCompetence && props.competenceId) {
      // Загрузка для компетенции
      indicators.value = await fetchIndicatorsCompetencie(props.competenceId)
    } else {
      // Общая загрузка всех индикаторов
      indicators.value = await fetchIndicators()
    }
  } catch (err) {
    error.value = err.message || 'Не удалось загрузить индикаторы'
    console.error('Ошибка загрузки индикаторов:', err)
  } finally {
    loading.value = false
  }
}

async function loadSubjectsCounts() {
  try {
    if (!indicators.value.length) return
    const countsPromises = indicators.value.map(async indicator => {
      try {
        if (indicator.id === undefined || indicator.id === null) {
          console.warn('Невалидный ID индикатора:', indicator)
          return { id: indicator.id, count: 0 }
        }
        const res = await fetchSubjectsCountByIndicator(indicator.id)
        return { id: indicator.id, count: res.count }
      } catch (err) {
        console.error(`Ошибка для индикатора ${indicator.id}:`, err)
        return { id: indicator.id, count: 0 }
      }
    })
    const counts = await Promise.all(countsPromises)
    subjectsCounts.value = counts.reduce((acc, { id, count }) => {
      if (id !== undefined && id !== null) {
        acc[id] = count
      }
      return acc
    }, {})
  } catch (err) {
    console.error('Ошибка при загрузке количества предметов:', err)
  }
}

function addIndicator() {
  editingIndicator.value = getEmptyIndicator()
  showAddModal.value = true
}

function editIndicator(indicator) {
  editingIndicator.value = { ...indicator }
  showAddModal.value = true
}

function openDetails(indicator) {
  selectedIndicator.value = indicator
}

function closeDetails() {
  selectedIndicator.value = null
}

const showStatsModal = ref(false)

function saveIndicatorLocal(updatedIndicator) {
  const index = indicators.value.findIndex(i => i.id === updatedIndicator.id)
  if (index !== -1) {
    indicators.value.splice(index, 1, updatedIndicator)
  }
}

function confirmDelete(indicator) {
  indicatorToDelete.value = indicator
  showDeleteModal.value = true
}

async function deleteIndicators() {
  if (!indicatorToDelete.value) return
  deleting.value = true
  error.value = null
  try {
    await deleteIndicator(indicatorToDelete.value.id)
    // Удаляем индикатор из списка
    indicators.value = indicators.value.filter(i => i.id !== indicatorToDelete.value.id)
    showDeleteModal.value = false
    indicatorToDelete.value = null
    toast.success('Индикатор успешно удалён')
  } catch (err) {
    error.value = err.message || 'Не удалось удалить индикатор'
    toast.error(error.value)
    console.error('Ошибка удаления индикатора:', err)
  } finally {
    deleting.value = false
  }
}

function closeModal() {
  showAddModal.value = false
}

function closeStatsModal() {
  showStatsModal.value = false
}

// Наблюдатели за изменением props
watch(() => props.subjectId, (newVal) => {
  if (newVal) {
    loadIndicators()
  }
}, { immediate: true })

watch(() => props.competenceId, (newVal) => {
  if (newVal) {
    loadIndicators()
  }
}, { immediate: true })

onMounted(() => {
  loadIndicators()
})
</script>

<template>
  <div class="indicator-management">
    <div class="d-flex justify-content-between align-items-center mb-4">
      <h2 v-if="isIndicator">Индикаторы предмета "{{ subjectName }}"</h2>
      <h2 v-else-if="isCompetence">Индикаторы компетенции "{{ competence?.name }}"</h2>
      <h2 v-else>Все индикаторы</h2>
    </div>
    <div class="d-flex justify-content-between align-items-center">
      <button class="btn fw-bold d-flex align-items-center gap-2" @click="addIndicator">
        <SquarePlus class="icon" />
        Добавить индикатор
      </button>
      <button class="btn fw-bold d-flex align-items-center gap-2" @click="$emit('back')">
        <ArrowLeftToLine class="icon" />
        Назад
      </button>
    </div>
    <div v-if="loading" class="text-center">
      <div class="spinner-border"></div>
    </div>
    <div v-else-if="error" class="alert alert-danger">
      {{ error }}
    </div>
    <div v-else class="row">
      <div 
        v-for="indicator in indicators" 
        :key="indicator.id" 
        class="col-md-4 mb-3"
      >
        <div class="card h-100 position-relative">
          <div class="position-absolute top-0 end-0 mt-2 me-2">
            <DropDown dropdownMenuClass="dropdown-menu-end">
              <template #main>
                <button class="btn btn-sm btn-link text-secondary">
                  <EllipsisVertical :size="20" />
                </button>
              </template>
              <template #list>
                <li class="dropdown-item" @click="editIndicator(indicator)">
                  <Edit :size="16" class="me-2" />
                  Редактировать
                </li>
                <li class="dropdown-item" @click="openDetails(indicator)">
                  <Info :size="16" class="me-2" />
                  Подробнее
                </li>
                <li class="dropdown-divider"></li>
                <li 
                  class="dropdown-item text-danger" 
                  @click="confirmDelete(indicator)"
                >
                  <Trash :size="16" class="me-2" />
                  Удалить
                </li>
              </template>
            </DropDown>
          </div>
          <div class="card-body">
            <h5 class="card-title">{{ indicator.name }}</h5>
            <p class="card-text text-muted">{{ indicator.description }}</p>
            <div class="mt-2">
              <span class="badge bg-light text-dark">
                Категория: {{ indicator.category || 'не указана' }}
              </span>
            </div>
            <div class="mt-3">
              <span class="badge bg-light text-dark">
                Коэффициент освоенности: {{ 100 / subjectsCounts[indicator.id] || 0 }} %
              </span>
            </div>
      
          </div>
        </div>
      </div>
    </div>

    <!-- Модальное окно статистики -->
    <div v-if="showStatsModal" class="stats-modal">
      <div class="stats-modal-backdrop" @click="closeStatsModal"></div>
      <div class="stats-modal-content">
        <div class="stats-modal-header">
          <h3></h3>
          <button class="btn-close" @click="closeStatsModal" aria-label="Закрыть"></button>
        </div>
        <div v-if="loading" class="text-center py-4">
          <div class="spinner-border text-primary" role="status">
            <span class="visually-hidden">Загрузка...</span>
          </div>
        </div>
        <CompetenceStats 
          v-else
          :selected-competence="selectedIndicator"
          :students-data="currentStats"
        />
      </div>
    </div>

    <!-- Модальное окно добавления/редактирования -->
    <div 
      class="modal fade" 
      :class="{ show: showAddModal }" 
      tabindex="-1" 
      style="display: block;" 
      v-if="showAddModal"
    >
      <div class="modal-dialog">
        <div class="modal-content">
          <div class="modal-header">
            <h5 class="modal-title">
              {{ editingIndicator.id ? 'Редактировать' : 'Добавить' }} индикатор
            </h5>
            <button type="button" class="btn-close" @click="closeModal"></button>
          </div>
          <div class="modal-body">
            <form @submit.prevent="saveIndicator">
              <div class="mb-3">
                <label class="form-label">Название</label>
                <input 
                  type="text" 
                  v-model="editingIndicator.name" 
                  class="form-control" 
                  required 
                  placeholder="Введите название индикатора"
                />
              </div>
              <div class="mb-3">
                <label class="form-label">Описание</label>
                <textarea 
                  v-model="editingIndicator.description" 
                  rows="3" 
                  class="form-control" 
                  placeholder="Введите описание индикатора"
                ></textarea>
              </div>
              <div class="mb-3">
                <label class="form-label">Категория</label>
                <input 
                  type="text" 
                  v-model="editingIndicator.category" 
                  class="form-control" 
                  placeholder="Введите категорию индикатора"
                />
              </div>
              <div v-if="error" class="alert alert-danger">{{ error }}</div>
              <div class="d-flex justify-content-end">
                <button class="btn btn-secondary me-2" @click="closeModal">
                  Отмена
                </button>
                <button class="btn btn-primary" :disabled="saving">
                  <span v-if="saving" class="spinner-border spinner-border-sm"></span>
                  {{ editingIndicator.id ? 'Обновить' : 'Сохранить' }}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
    <div class="modal-backdrop fade show" v-if="showAddModal"></div>

    <!-- Модальное окно удаления -->
    <div 
      class="modal fade" 
      :class="{ show: showDeleteModal }" 
      tabindex="-1" 
      style="display: block;" 
      v-if="showDeleteModal"
    >
      <div class="modal-dialog">
        <div class="modal-content">
          <div class="modal-header">
            <h5 class="modal-title">Подтверждение удаления</h5>
            <button 
              type="button" 
              class="btn-close" 
              @click="showDeleteModal = false"
            ></button>
          </div>
          <div class="modal-body">
            <p>Вы уверены, что хотите удалить индикатор "{{ indicatorToDelete?.name }}"?</p>
          </div>
          <div class="modal-footer">
            <button class="btn btn-secondary" @click="showDeleteModal = false">
              Отмена
            </button>
            <button 
              class="btn btn-danger" 
              @click="deleteIndicators" 
              :disabled="deleting"
            >
              <span v-if="deleting" class="spinner-border spinner-border-sm"></span>
              Удалить
            </button>
          </div>
        </div>
      </div>
    </div>
    <div class="modal-backdrop fade show" v-if="showDeleteModal"></div>

    <!-- Модальное окно подробностей -->
    <IndicatorDetailsModal
      v-if="selectedIndicator"
      :indicator="selectedIndicator"
      :subject-name="subjectName"
      @close="closeDetails"
      @update="saveIndicatorLocal"
    />
  </div>
</template>

<style scoped>
.card {
  transition: transform 0.2s;
}
.card:hover {
  transform: translateY(-2px);
}
.dropdown-toggle::after {
  display: none;
}
.stats-modal {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1050;
}
.stats-modal-content {
  background: white;
  border-radius: 8px;
  padding: 20px;
  width: 90%;
  max-width: 1200px;
  max-height: 90vh;
  overflow-y: auto;
  position: relative;
  z-index: 2;
  box-shadow: 0 5px 15px rgba(0, 0, 0, 0.2);
}
.stats-modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
  padding-bottom: 15px;
  border-bottom: 1px solid #eee;
}
.stats-modal-backdrop {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(0, 0, 0, 0.5);
  z-index: 1;
}
.btn-close {
  font-size: 1.5rem;
  padding: 0.5rem;
}
</style>
