<script setup>
import { ref, watch, computed } from 'vue'
import { 
  fetchCompetencies,
  createCompetence,
  deleteCompetence,
  fetchCompetenceMastery,
  updateCompetence
} from '@/js/api/services/expsysService'
import IndicatorDetailsModal from './IndicatorDetailsModal.vue'
import IndicatorsManager from './IndicatorsManager.vue'
import DropDown from '@/components/DropDown.vue'
import { EllipsisVertical, Edit, Trash, Info, SquarePlus, ArrowLeftToLine, Filter } from 'lucide-vue-next'
import { onMounted } from 'vue'
import CompetenceStats from '@/pages/expsys/CompetenceStats.vue'
import { useToast } from 'vue-toastification'

const toast = useToast()

const props = defineProps({
  subjectId: {
    type: Number,
    required: false
  },
  subjectName: {
    type: String,
    default: 'Не указано'
  },
})

const currentCompetence = ref(null)
const currentStats = ref([])
const statsLoading = ref(false)
const emit = defineEmits(['back'])

// Состояния для управления отображением
const showIndicatorsManager = ref(false)
const selectedCompetenceForIndicators = ref(null)
const showCompetenceList = ref(true)

// Реактивные состояния
const competencies = ref([])
const loading = ref(false)
const error = ref(null)
const showAddModal = ref(false)
const showDeleteModal = ref(false)
const competenceToDelete = ref(null)
const selectedCompetence = ref(null)
const saving = ref(false)
const deleting = ref(false)
const subjectsCounts = ref({})
const isCompetence = ref(false)

// Сортировка
const sortOptions = [
  { id: 'all', name: 'Все виды' },
  { id: 'professional', name: 'Профессиональные' },
  { id: 'general', name: 'Общеобразовательные' },
  { id: 'general_professional', name: 'Общепрофессиональные' }
]
const selectedSort = ref('all')

// Отсортированные компетенции
const sortedCompetencies = computed(() => {
  if (selectedSort.value === 'all') {
    return competencies.value
  }
  return competencies.value.filter(c => c.category === selectedSort.value)
})

// Открытие менеджера индикаторов для конкретной компетенции
function openIndicatorsManager(competence) {
  selectedCompetenceForIndicators.value = competence;
  showIndicatorsManager.value = true;
  showCompetenceList.value = false;
  isCompetence.value = true;
}

// Закрытие менеджера индикаторов
function closeIndicatorsManager() {
  showIndicatorsManager.value = false
  showCompetenceList.value = true
  selectedCompetenceForIndicators.value = null
}

async function saveCompetence() {
  saving.value = true
  error.value = null

  try {
    if (editingCompetence.value.id) {
      // Редактирование существующей компетенции
      const updatedCompetence = await updateCompetence(
        editingCompetence.value.id,
        {
          name: editingCompetence.value.name,
          description: editingCompetence.value.description,
          category: editingCompetence.value.type
        }
      )
      
      // Обновляем список компетенций
      const index = competencies.value.findIndex(c => c.id === updatedCompetence.id)
      if (index !== -1) {
        competencies.value[index] = updatedCompetence
      }
      toast.success('Компетенция успешно обновлена')
    } else {
      // Создание новой компетенции
      const createdCompetence = await createCompetence({
        name: editingCompetence.value.name,
        description: editingCompetence.value.description,
        category: editingCompetence.value.type
      })
      competencies.value.unshift(createdCompetence)
      toast.success('Компетенция успешно создана')
    }
    
    closeModal()
  } catch (err) {
    error.value = err.message || 'Не удалось сохранить компетенцию'
    toast.error(error.value)
    console.error('Ошибка сохранения компетенции:', err)
  } finally {
    saving.value = false
  }
}

const editingCompetence = ref({
  id: null,
  name: '',
  description: '',
  type: 'professional'
})

function getEmptyCompetence() {
  return {
    id: null,
    name: '',
    description: '',
    type: 'professional'
  }
}

async function loadCompetencies() {
  loading.value = true
  error.value = null

  try {
    competencies.value = await fetchCompetencies()
  } catch (err) {
    error.value = err.message || 'Не удалось загрузить компетенции'
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  loadCompetencies()
})

function addCompetence() {
  editingCompetence.value = getEmptyCompetence()
  showAddModal.value = true
}

function editCompetence(competence) {
  editingCompetence.value = { 
    id: competence.id,
    name: competence.name,
    description: competence.description,
    type: competence.category || 'professional'
  }
  showAddModal.value = true
}

function openDetails(competence) {
  selectedCompetence.value = competence
}

function closeDetails() {
  selectedCompetence.value = null
}

const showStatsModal = ref(false)

async function openStats(competence) {
  try {
    statsLoading.value = true
    currentCompetence.value = competence
    currentStats.value = await fetchCompetenceMastery(competence.id)
    showStatsModal.value = true
  } catch (err) {
    error.value = 'Не удалось загрузить статистику'
    console.error('Ошибка загрузки статистики:', err)
  } finally {
    statsLoading.value = false
  }
}

function confirmDelete(competence) {
  competenceToDelete.value = competence
  showDeleteModal.value = true
}

async function deleteCompetences() {
  if (!competenceToDelete.value) return
  
  deleting.value = true
  error.value = null
  
  try {
    await deleteCompetence(competenceToDelete.value.id)
    // Удаляем компетенцию из списка
    competencies.value = competencies.value.filter(c => c.id !== competenceToDelete.value.id)
    showDeleteModal.value = false
    competenceToDelete.value = null
    toast.success('Компетенция успешно удалена')
  } catch (err) {
    error.value = err.message || 'Не удалось удалить компетенцию'
    toast.error(error.value)
    console.error('Ошибка удаления компетенции:', err)
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

watch(() => props.subjectId, (newVal) => {
  if (newVal) {
    loadCompetencies()
  }
}, { immediate: true })
</script>

<template>
  <div class="competence-management">
    <IndicatorsManager 
      v-if="showIndicatorsManager && selectedCompetenceForIndicators"
      :competence="selectedCompetenceForIndicators"
      :competence-id="selectedCompetenceForIndicators.id"
      @close="closeIndicatorsManager"
    />
    
    <div v-if="showCompetenceList">
      <div class="d-flex justify-content-between align-items-center mb-4">
        <div class="d-flex gap-2">
          <button class="btn fw-bold d-flex align-items-center gap-2" @click="addCompetence">
            <SquarePlus class="icon" />
            Добавить компетенцию
          </button>
        </div>
        <button class="btn fw-bold d-flex align-items-center gap-2" @click="$emit('back')">
          <ArrowLeftToLine class="icon" />
          Назад
        </button>
      </div>
      
      <div class="d-flex justify-content-between align-items-center mb-4">
        <h2 class="mb-0">Компетенции</h2>
        <div class="d-flex align-items-center">
          <Filter class="me-2" />
          <select 
            v-model="selectedSort" 
            class="form-select form-select-sm"
            style="width: auto;"
          >
            <option 
              v-for="option in sortOptions" 
              :key="option.id" 
              :value="option.id"
            >
              {{ option.name }}
            </option>
          </select>
        </div>
      </div>

      <div v-if="loading" class="text-center">
        <div class="spinner-border"></div>
      </div>
      <div v-else-if="error" class="alert alert-danger">
        {{ error }}
      </div>
      <div v-else class="row">
        <div 
          v-for="competence in sortedCompetencies" 
          :key="competence.id" 
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
                  <li class="dropdown-item" @click="editCompetence(competence)">
                    <Edit :size="16" class="me-2" />
                    Редактировать
                  </li>
                  <li class="dropdown-item" @click="openDetails(competence)">
                    <Info :size="16" class="me-2" />
                    Подробнее
                  </li>
                  <li class="dropdown-divider"></li>
                  <li 
                    class="dropdown-item text-danger" 
                    @click="confirmDelete(competence)"
                  >
                    <Trash :size="16" class="me-2" />
                    Удалить
                  </li>
                </template>
              </DropDown>
            </div>
            <div class="card-body">
              <h5 class="card-title">{{ competence.name }}</h5>
              <p class="card-text text-muted">{{ competence.description }}</p>
              <div class="mt-2 mb-3">
                <span class="badge text-white" 
                  :class="{
                    'bg-primary': competence.category === 'professional',
                    'bg-success': competence.category === 'general',
                    'bg-info': competence.category === 'general_professional'
                  }"
                >
                  {{
                    sortOptions.find(o => o.id === competence.category)?.name || 'Не указан'
                  }}
                </span>
              </div>
              
              <div class="mt-3">
                <span class="badge bg-light text-dark">
                  Коэффициент освоенности: {{ 100 / subjectsCounts[competence.id] || 0 }} %
                </span>
              </div>
              
              <div class="text-center mt-3 d-flex flex-column align-items-center">
                <button class="btn btn-primary mb-2" @click="openStats(competence)">
                  Статистика освоения
                </button>
                <button class="btn btn-primary" @click="openIndicatorsManager(competence)">
                  Индикаторы
                </button>
              </div>
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
        <div v-if="statsLoading" class="text-center py-4">
          <div class="spinner-border text-primary" role="status">
            <span class="visually-hidden">Загрузка...</span>
          </div>
        </div>
        <CompetenceStats 
          v-else
          :selected-competence="currentCompetence"
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
              {{ editingCompetence.id ? 'Редактировать' : 'Добавить' }} компетенцию
            </h5>
            <button type="button" class="btn-close" @click="closeModal"></button>
          </div>
          <div class="modal-body">
            <form @submit.prevent="saveCompetence">
              <div class="mb-3">
                <label class="form-label">Название</label>
                <input 
                  type="text" 
                  v-model="editingCompetence.name" 
                  class="form-control" 
                  required 
                />
              </div>
              <div class="mb-3">
                <label class="form-label">Описание</label>
                <textarea 
                  v-model="editingCompetence.description" 
                  rows="3" 
                  class="form-control" 
                  required
                ></textarea>
              </div>
              <div class="mb-3">
                <label class="form-label">Вид компетенции</label>
                <select 
                  v-model="editingCompetence.type" 
                  class="form-select"
                  required
                >
                  <option 
                    v-for="option in sortOptions.filter(o => o.id !== 'all')" 
                    :key="option.id" 
                    :value="option.id"
                  >
                    {{ option.name }}
                  </option>
                </select>
              </div>
              <div v-if="error" class="alert alert-danger">{{ error }}</div>
              <div class="d-flex justify-content-end">
                <button class="btn btn-secondary me-2" @click="closeModal">
                  Отмена
                </button>
                <button class="btn btn-primary" :disabled="saving">
                  <span v-if="saving" class="spinner-border spinner-border-sm"></span>
                  {{ editingCompetence.id ? 'Обновить' : 'Сохранить' }}
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
            <p>Вы уверены, что хотите удалить компетенцию "{{ competenceToDelete?.name }}"?</p>
          </div>
          <div class="modal-footer">
            <button class="btn btn-secondary" @click="showDeleteModal = false">
              Отмена
            </button>
            <button 
              class="btn btn-danger" 
              @click="deleteCompetences" 
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
      v-if="selectedCompetence"
      :competence="selectedCompetence"
      :subject-name="subjectName"
      @close="closeDetails"
      @update="saveCompetence"
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

/* Стили для бейджей типов компетенций */
.bg-primary {
  background-color: #0d6efd !important;
}
.bg-success {
  background-color: #198754 !important;
}
.bg-info {
  background-color: #0dcaf0 !important;
}
</style>