<template>
  <div class="lesson-manager">
    <!-- Заголовок с кнопкой создания урока -->
    <div class="d-flex justify-content-between align-items-center mb-4">
      <div>
        <h4 class="mb-1">Управление уроками</h4>
        <p class="text-muted mb-0" v-if="selectedTheme">
          Тема: {{ selectedTheme.name }}
        </p>
      </div>
      <button 
        @click="openCreateModal"
        class="btn btn-primary d-flex align-items-center gap-2"
        :disabled="!selectedTheme"
      >
        <Plus :size="20" />
        Создать урок
      </button>
    </div>

    <!-- Фильтры и поиск -->
    <div class="row mb-4">
      <div class="col-md-4">
        <label class="form-label">Выберите тему</label>
        <select v-model="selectedThemeId" @change="onThemeChange" class="form-select">
          <option value="">Выберите тему</option>
          <option v-for="theme in themes" :key="theme.id" :value="theme.id">
            {{ theme.name }}
          </option>
        </select>
      </div>
      <div class="col-md-4">
        <label class="form-label">Поиск уроков</label>
        <div class="input-group">
          <span class="input-group-text">
            <Search :size="16" />
          </span>
          <input
            v-model="searchQuery"
            type="text"
            class="form-control"
            placeholder="Название урока..."
          />
        </div>
      </div>
      <div class="col-md-4">
        <label class="form-label">Тип урока</label>
        <select v-model="selectedType" class="form-select">
          <option value="">Все типы</option>
          <option v-for="type in lessonTypes" :key="type.value" :value="type.value">
            {{ type.label }}
          </option>
        </select>
      </div>
    </div>

    <!-- Список уроков -->
    <div v-if="loading" class="text-center py-5">
      <div class="spinner-border"></div>
      <p class="mt-2">Загрузка уроков...</p>
    </div>

    <div v-else-if="filteredLessons.length === 0" class="text-center py-5">
      <BookOpen :size="48" class="text-muted mb-3" />
      <h5 class="text-muted">Уроки не найдены</h5>
      <p class="text-muted" v-if="!selectedTheme">Выберите тему для просмотра уроков</p>
      <p class="text-muted" v-else>В этой теме еще нет уроков</p>
    </div>

    <div v-else class="row">
      <div v-for="lesson in filteredLessons" :key="lesson.id" class="col-md-6 col-lg-4 mb-4">
        <div class="card h-100">
          <div class="card-body">
            <div class="d-flex justify-content-between align-items-start mb-2">
              <h6 class="card-title">{{ lesson.name }}</h6>
              <div class="dropdown">
                <button class="btn btn-sm btn-outline-secondary" data-bs-toggle="dropdown">
                  <ChevronDown :size="16" />
                </button>
                <ul class="dropdown-menu">
                  <li>
                    <a class="dropdown-item" href="#" @click.prevent="editLesson(lesson)">
                      <Edit :size="16" class="me-2" />
                      Редактировать
                    </a>
                  </li>
                  <li>
                    <a class="dropdown-item" href="#" @click.prevent="viewLesson(lesson)">
                      <Eye :size="16" class="me-2" />
                      Просмотр
                    </a>
                  </li>
                  <li>
                    <a class="dropdown-item" href="#" @click.prevent="duplicateLesson(lesson)">
                      <Copy :size="16" class="me-2" />
                      Дублировать
                    </a>
                  </li>
                  <li><hr class="dropdown-divider"></li>
                  <li>
                    <a class="dropdown-item text-danger" href="#" @click.prevent="deleteLesson(lesson)">
                      <Trash2 :size="16" class="me-2" />
                      Удалить
                    </a>
                  </li>
                </ul>
              </div>
            </div>
            
            <p class="card-text text-muted small mb-3">{{ lesson.description || 'Без описания' }}</p>
            
            <div class="lesson-meta small text-muted mb-3">
              <div class="d-flex align-items-center gap-2 mb-1">
                <component :is="getLessonTypeIcon(lesson.lessontype)" :size="14" />
                <span>{{ getLessonTypeName(lesson.lessontype) }}</span>
              </div>
              <div class="d-flex align-items-center gap-2 mb-1">
                <Calendar :size="14" />
                <span>{{ formatDate(lesson.creationdate) }}</span>
              </div>
              <div class="d-flex align-items-center gap-2">
                <Hash :size="14" />
                <span>Порядок: {{ lesson.sort_order || 0 }}</span>
              </div>
            </div>

            <div class="d-flex justify-content-between align-items-center">
              <div class="d-flex gap-2">
                <span v-if="lesson.is_visible" class="badge bg-success">Видимый</span>
                <span v-else class="badge bg-secondary">Скрытый</span>
                <span v-if="lesson.completion_required" class="badge bg-warning">Обязательный</span>
              </div>
              <div class="btn-group" role="group">
                <button 
                  @click="editLesson(lesson)"
                  class="btn btn-sm btn-outline-primary"
                  title="Редактировать"
                >
                  <Edit :size="14" />
                </button>
                <button 
                  @click="viewLesson(lesson)"
                  class="btn btn-sm btn-outline-info"
                  title="Просмотр"
                >
                  <Eye :size="14" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Модальное окно создания/редактирования урока -->
    <div class="modal fade" :id="modalId" tabindex="-1" ref="lessonModal">
      <div class="modal-dialog modal-lg">
        <div class="modal-content">
          <div class="modal-header">
            <h5 class="modal-title">
              {{ editingLesson ? 'Редактирование урока' : 'Создание урока' }}
            </h5>
            <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
          </div>
          <div class="modal-body">
            <form @submit.prevent="saveLesson">
              <div class="row">
                <div class="col-md-8">
                  <div class="mb-3">
                    <label class="form-label required">Название урока</label>
                    <input
                      v-model="lessonForm.name"
                      type="text"
                      class="form-control"
                      :class="{ 'is-invalid': validationErrors.name }"
                      required
                    />
                    <div v-if="validationErrors.name" class="invalid-feedback">
                      {{ validationErrors.name }}
                    </div>
                  </div>
                </div>
                <div class="col-md-4">
                  <div class="mb-3">
                    <label class="form-label">Порядок сортировки</label>
                    <input
                      v-model="lessonForm.sort_order"
                      type="number"
                      class="form-control"
                      min="0"
                    />
                  </div>
                </div>
              </div>

              <div class="mb-3">
                <label class="form-label">Описание урока</label>
                <textarea
                  v-model="lessonForm.description"
                  class="form-control"
                  rows="3"
                  :class="{ 'is-invalid': validationErrors.description }"
                ></textarea>
                <div v-if="validationErrors.description" class="invalid-feedback">
                  {{ validationErrors.description }}
                </div>
              </div>

              <div class="row">
                <div class="col-md-6">
                  <div class="mb-3">
                    <label class="form-label required">Тип урока</label>
                    <select 
                      v-model="lessonForm.lessontype" 
                      class="form-select"
                      :class="{ 'is-invalid': validationErrors.lessontype }"
                      required
                    >
                      <option value="">Выберите тип</option>
                      <option v-for="type in lessonTypes" :key="type.value" :value="type.value">
                        {{ type.label }}
                      </option>
                    </select>
                    <div v-if="validationErrors.lessontype" class="invalid-feedback">
                      {{ validationErrors.lessontype }}
                    </div>
                  </div>
                </div>
                <div class="col-md-6">
                  <div class="mb-3">
                    <label class="form-label">Тема</label>
                    <select 
                      v-model="lessonForm.theme" 
                      class="form-select"
                      :class="{ 'is-invalid': validationErrors.theme }"
                      required
                    >
                      <option value="">Выберите тему</option>
                      <option v-for="theme in themes" :key="theme.id" :value="theme.id">
                        {{ theme.name }}
                      </option>
                    </select>
                    <div v-if="validationErrors.theme" class="invalid-feedback">
                      {{ validationErrors.theme }}
                    </div>
                  </div>
                </div>
              </div>

              <!-- Дополнительные поля в зависимости от типа урока -->
              <div v-if="lessonForm.lessontype === 'V'" class="mb-3">
                <label class="form-label">URL видео</label>
                <input
                  v-model="lessonForm.video_url"
                  type="url"
                  class="form-control"
                  placeholder="https://www.youtube.com/watch?v=..."
                />
                <div class="form-text">Поддерживаются YouTube, Vimeo и прямые ссылки на видео</div>
              </div>

              <div v-if="lessonForm.lessontype === 'URL'" class="mb-3">
                <label class="form-label">Внешняя ссылка</label>
                <input
                  v-model="lessonForm.external_url"
                  type="url"
                  class="form-control"
                  placeholder="https://example.com"
                />
              </div>

              <div v-if="['L', 'A', 'F'].includes(lessonForm.lessontype)" class="mb-3">
                <label class="form-label">Содержание урока</label>
                <textarea
                  v-model="lessonForm.content_text"
                  class="form-control"
                  rows="6"
                  placeholder="Введите содержание урока (поддерживается Markdown)"
                ></textarea>
                <div class="form-text">Поддерживается разметка Markdown</div>
              </div>

              <div v-if="lessonForm.lessontype === 'FILE'" class="mb-3">
                <label class="form-label">Файлы материалов</label>
                <input
                  type="file"
                  class="form-control"
                  multiple
                  @change="handleFileUpload"
                  accept=".pdf,.doc,.docx,.ppt,.pptx,.zip,.rar"
                />
                <div class="form-text">Поддерживаются: PDF, Word, PowerPoint, архивы. Максимум 10MB на файл</div>
                
                <!-- Список загруженных файлов -->
                <div v-if="lessonForm.files && lessonForm.files.length > 0" class="mt-2">
                  <div class="small text-muted mb-1">Прикрепленные файлы:</div>
                  <div v-for="(file, index) in lessonForm.files" :key="index" class="d-flex align-items-center gap-2 mb-1">
                    <FileText :size="16" />
                    <span class="small">{{ file.name }} ({{ formatFileSize(file.size) }})</span>
                    <button 
                      type="button" 
                      @click="removeFile(index)"
                      class="btn btn-sm btn-outline-danger"
                    >
                      <X :size="12" />
                    </button>
                  </div>
                </div>
              </div>

              <div class="row">
                <div class="col-md-6">
                  <div class="mb-3">
                    <label class="form-label">Доступно с</label>
                    <input
                      v-model="lessonForm.availability_start"
                      type="datetime-local"
                      class="form-control"
                    />
                  </div>
                </div>
                <div class="col-md-6">
                  <div class="mb-3">
                    <label class="form-label">Доступно до</label>
                    <input
                      v-model="lessonForm.availability_end"
                      type="datetime-local"
                      class="form-control"
                    />
                  </div>
                </div>
              </div>

              <div class="row">
                <div class="col-md-6">
                  <div class="form-check mb-3">
                    <input
                      v-model="lessonForm.is_visible"
                      class="form-check-input"
                      type="checkbox"
                      id="isVisible"
                    />
                    <label class="form-check-label" for="isVisible">
                      Урок видимый для студентов
                    </label>
                  </div>
                </div>
                <div class="col-md-6">
                  <div class="form-check mb-3">
                    <input
                      v-model="lessonForm.completion_required"
                      class="form-check-input"
                      type="checkbox"
                      id="completionRequired"
                    />
                    <label class="form-check-label" for="completionRequired">
                      Обязательно для завершения курса
                    </label>
                  </div>
                </div>
              </div>
            </form>
          </div>
          <div class="modal-footer">
            <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">
              Отмена
            </button>
            <button 
              type="button" 
              @click="saveLesson"
              class="btn btn-primary"
              :disabled="isSubmitting"
            >
              <span v-if="isSubmitting" class="spinner-border spinner-border-sm me-2"></span>
              {{ editingLesson ? 'Сохранить изменения' : 'Создать урок' }}
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- Модальное окно просмотра урока -->
    <div class="modal fade" :id="viewModalId" tabindex="-1" ref="viewModal">
      <div class="modal-dialog modal-xl">
        <div class="modal-content">
          <div class="modal-header">
            <h5 class="modal-title">{{ viewingLesson?.name }}</h5>
            <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
          </div>
          <div class="modal-body">
            <LessonViewer v-if="viewingLesson" :lesson="viewingLesson" />
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, computed, nextTick } from 'vue'
import { 
  BookOpen, Plus, Search, ChevronDown, Edit, Eye, Copy, Trash2, 
  Calendar, Hash, FileText, Video, ExternalLink, PresentationChart,
  Users, MessageSquare, HelpCircle, X, Play
} from 'lucide-vue-next'
import { apiClient } from '@/js/api/manager'
import { endpoints } from '@/js/api/endpoints'
import { 
  showSuccess, 
  showError, 
  showValidationError,
  showSaveSuccess,
  showDeleteSuccess,
  handleApiError
} from '@/js/utils/notifications'
import LessonViewer from './LessonViewer.vue'

const props = defineProps({
  subjectId: {
    type: [Number, String],
    required: true
  }
})

// Данные
const lessons = ref([])
const themes = ref([])
const loading = ref(false)
const searchQuery = ref('')
const selectedThemeId = ref('')
const selectedType = ref('')
const editingLesson = ref(null)
const viewingLesson = ref(null)
const isSubmitting = ref(false)
const validationErrors = ref({})

// ID для модальных окон
const modalId = 'lessonModal'
const viewModalId = 'viewLessonModal'

// Типы уроков
const lessonTypes = [
  { value: 'V', label: 'Видео урок' },
  { value: 'L', label: 'Лекция' },
  { value: 'A', label: 'Задание' },
  { value: 'Q', label: 'Тест' },
  { value: 'F', label: 'Форум' },
  { value: 'FILE', label: 'Файловый материал' },
  { value: 'URL', label: 'Внешняя ссылка' },
  { value: 'C', label: 'Конференция' }
]

// Форма урока
const lessonForm = ref({
  name: '',
  description: '',
  lessontype: '',
  theme: '',
  sort_order: 0,
  is_visible: true,
  completion_required: false,
  availability_start: '',
  availability_end: '',
  video_url: '',
  external_url: '',
  content_text: '',
  files: []
})

// Вычисляемые свойства
const selectedTheme = computed(() => {
  return themes.value.find(t => t.id == selectedThemeId.value)
})

const filteredLessons = computed(() => {
  let filtered = lessons.value

  if (selectedThemeId.value) {
    filtered = filtered.filter(lesson => lesson.theme == selectedThemeId.value)
  }

  if (searchQuery.value) {
    const query = searchQuery.value.toLowerCase()
    filtered = filtered.filter(lesson =>
      lesson.name.toLowerCase().includes(query) ||
      lesson.description.toLowerCase().includes(query)
    )
  }

  if (selectedType.value) {
    filtered = filtered.filter(lesson => lesson.lessontype === selectedType.value)
  }

  return filtered.sort((a, b) => (a.sort_order || 0) - (b.sort_order || 0))
})

// Методы
async function fetchThemes() {
  try {
    const response = await apiClient.get(endpoints.lms.themes, {
      params: { subject: props.subjectId }
    })
    themes.value = response.data.results || response.data || []
  } catch (error) {
    console.error('Ошибка загрузки тем:', error)
    handleApiError(error, 'Ошибка при загрузке тем')
  }
}

async function fetchLessons() {
  if (!selectedThemeId.value) {
    lessons.value = []
    return
  }

  try {
    loading.value = true
    const response = await apiClient.get(endpoints.lms.lessons, {
      params: { theme: selectedThemeId.value }
    })
    lessons.value = response.data.results || response.data || []
  } catch (error) {
    console.error('Ошибка загрузки уроков:', error)
    handleApiError(error, 'Ошибка при загрузке уроков')
  } finally {
    loading.value = false
  }
}

function onThemeChange() {
  fetchLessons()
}

function openCreateModal() {
  editingLesson.value = null
  resetForm()
  lessonForm.value.theme = selectedThemeId.value
  const modal = new bootstrap.Modal(document.getElementById(modalId))
  modal.show()
}

function editLesson(lesson) {
  editingLesson.value = lesson
  fillForm(lesson)
  const modal = new bootstrap.Modal(document.getElementById(modalId))
  modal.show()
}

function viewLesson(lesson) {
  viewingLesson.value = lesson
  const modal = new bootstrap.Modal(document.getElementById(viewModalId))
  modal.show()
}

async function duplicateLesson(lesson) {
  try {
    const duplicatedData = {
      ...lesson,
      name: `Копия - ${lesson.name}`,
      id: undefined,
      creationdate: undefined,
      lastupdate: undefined
    }
    delete duplicatedData.id
    delete duplicatedData.creationdate
    delete duplicatedData.lastupdate
    
    const response = await apiClient.post(endpoints.lms.lessons, duplicatedData)
    lessons.value.push(response.data)
    showSuccess(`Урок "${lesson.name}" успешно дублирован`)
  } catch (error) {
    console.error('Ошибка дублирования урока:', error)
    handleApiError(error, 'Ошибка при дублировании урока')
  }
}

async function deleteLesson(lesson) {
  if (!confirm(`Вы уверены, что хотите удалить урок "${lesson.name}"?`)) {
    return
  }

  try {
    await apiClient.delete(`${endpoints.lms.lessons}${lesson.id}/`)
    lessons.value = lessons.value.filter(l => l.id !== lesson.id)
    showDeleteSuccess('Урок')
  } catch (error) {
    console.error('Ошибка удаления урока:', error)
    handleApiError(error, 'Ошибка при удалении урока')
  }
}

async function saveLesson() {
  if (!validateForm()) {
    showValidationError('Проверьте правильность заполнения полей')
    return
  }

  isSubmitting.value = true

  try {
    const formData = new FormData()
    
    // Основные поля
    Object.keys(lessonForm.value).forEach(key => {
      if (key !== 'files' && lessonForm.value[key] !== null && lessonForm.value[key] !== '') {
        formData.append(key, lessonForm.value[key])
      }
    })

    // Файлы
    if (lessonForm.value.files && lessonForm.value.files.length > 0) {
      lessonForm.value.files.forEach((file, index) => {
        formData.append(`file_${index}`, file)
      })
    }

    let response
    if (editingLesson.value) {
      response = await apiClient.put(`${endpoints.lms.lessons}${editingLesson.value.id}/`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      })
      
      // Обновляем урок в списке
      const index = lessons.value.findIndex(l => l.id === editingLesson.value.id)
      if (index !== -1) {
        lessons.value[index] = response.data
      }
    } else {
      response = await apiClient.post(endpoints.lms.lessons, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      })
      lessons.value.push(response.data)
    }

    const modal = bootstrap.Modal.getInstance(document.getElementById(modalId))
    modal.hide()
    
    showSaveSuccess(`Урок "${response.data.name}"`)
  } catch (error) {
    console.error('Ошибка сохранения урока:', error)
    handleApiError(error, 'Ошибка при сохранении урока')
  } finally {
    isSubmitting.value = false
  }
}

function validateForm() {
  const errors = {}

  if (!lessonForm.value.name || !lessonForm.value.name.trim()) {
    errors.name = 'Название урока обязательно для заполнения'
  }

  if (!lessonForm.value.lessontype) {
    errors.lessontype = 'Выберите тип урока'
  }

  if (!lessonForm.value.theme) {
    errors.theme = 'Выберите тему'
  }

  validationErrors.value = errors
  return Object.keys(errors).length === 0
}

function resetForm() {
  lessonForm.value = {
    name: '',
    description: '',
    lessontype: '',
    theme: selectedThemeId.value,
    sort_order: 0,
    is_visible: true,
    completion_required: false,
    availability_start: '',
    availability_end: '',
    video_url: '',
    external_url: '',
    content_text: '',
    files: []
  }
  validationErrors.value = {}
}

function fillForm(lesson) {
  lessonForm.value = {
    name: lesson.name || '',
    description: lesson.description || '',
    lessontype: lesson.lessontype || '',
    theme: lesson.theme || '',
    sort_order: lesson.sort_order || 0,
    is_visible: lesson.is_visible !== false,
    completion_required: lesson.completion_required || false,
    availability_start: lesson.availability_start ? formatDateTimeForInput(lesson.availability_start) : '',
    availability_end: lesson.availability_end ? formatDateTimeForInput(lesson.availability_end) : '',
    video_url: lesson.video_url || '',
    external_url: lesson.external_url || '',
    content_text: lesson.content_text || '',
    files: []
  }
  validationErrors.value = {}
}

function handleFileUpload(event) {
  const files = Array.from(event.target.files)
  
  // Проверяем размер файлов
  const maxSize = 10 * 1024 * 1024 // 10MB
  const validFiles = files.filter(file => {
    if (file.size > maxSize) {
      showError(`Файл "${file.name}" слишком большой. Максимальный размер: 10MB`)
      return false
    }
    return true
  })

  lessonForm.value.files = [...(lessonForm.value.files || []), ...validFiles]
}

function removeFile(index) {
  lessonForm.value.files.splice(index, 1)
}

function formatFileSize(bytes) {
  if (bytes === 0) return '0 Bytes'
  const k = 1024
  const sizes = ['Bytes', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
}

function formatDate(dateString) {
  if (!dateString) return 'Не указано'
  return new Date(dateString).toLocaleDateString('ru-RU')
}

function formatDateTimeForInput(dateString) {
  if (!dateString) return ''
  const date = new Date(dateString)
  const offset = date.getTimezoneOffset()
  const localDate = new Date(date.getTime() - (offset * 60 * 1000))
  return localDate.toISOString().slice(0, 16)
}

function getLessonTypeName(type) {
  const lessonType = lessonTypes.find(t => t.value === type)
  return lessonType ? lessonType.label : type
}

function getLessonTypeIcon(type) {
  const icons = {
    'V': Video,
    'L': PresentationChart,
    'A': FileText,
    'Q': HelpCircle,
    'F': MessageSquare,
    'FILE': FileText,
    'URL': ExternalLink,
    'C': Users
  }
  return icons[type] || BookOpen
}

// Хуки жизненного цикла
onMounted(async () => {
  await fetchThemes()
  
  // Если есть только одна тема, выбираем её автоматически
  if (themes.value.length === 1) {
    selectedThemeId.value = themes.value[0].id
    await fetchLessons()
  }
})
</script>

<style scoped>
.lesson-manager {
  padding: 1rem;
}

.card {
  transition: all 0.2s ease;
}

.card:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0,0,0,0.1);
}

.required::after {
  content: " *";
  color: red;
}

.lesson-meta {
  border-top: 1px solid #eee;
  padding-top: 0.5rem;
}

.btn-group .btn {
  border-radius: 0.25rem;
}

.modal-xl {
  max-width: 90%;
}
</style>