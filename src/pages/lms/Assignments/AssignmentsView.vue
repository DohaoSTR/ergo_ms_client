<script setup>
import { ref, onMounted, computed } from 'vue'
import { ClipboardList, Calendar, Clock, CheckCircle, AlertCircle, FileText, Upload, Download, Plus, Edit, Users } from 'lucide-vue-next'
import { apiClient } from '@/js/api/manager'
import { endpoints } from '@/js/api/endpoints'
import { globalUserRole } from '../composables/useUserRole'
import RoleGuard from '../components/RoleGuard.vue'

const assignments = ref([])
const submittedAssignments = ref([])
const lessons = ref([])
const loading = ref(true)
const selectedTab = ref('all')
const showCreateModal = ref(false)
const userRole = globalUserRole

// Форма создания задания
const assignmentForm = ref({
  title: '',
  description: '',
  lesson: null,
  deadline: '',
  max_grade: 100,
  allow_late_submissions: false,
  submission_type: 'file',
  max_file_size: 10485760, // 10MB
})

const tabs = [
  { value: 'all', label: 'Все задания', icon: ClipboardList },
  { value: 'pending', label: 'К выполнению', icon: Clock },
  { value: 'submitted', label: 'Отправленные', icon: Upload },
  { value: 'graded', label: 'Оцененные', icon: CheckCircle }
]

const submissionTypes = [
  { value: 'file', label: 'Файл' },
  { value: 'text', label: 'Текст' },
  { value: 'both', label: 'Файл и текст' }
]

const filteredAssignments = computed(() => {
  if (selectedTab.value === 'all') return assignments.value
  
  return assignments.value.filter(assignment => {
    const submission = getSubmission(assignment.id)
    switch (selectedTab.value) {
      case 'pending':
        return !submission
      case 'submitted':
        return submission && !submission.graded_at
      case 'graded':
        return submission && submission.graded_at
      default:
        return true
    }
  })
})

async function fetchAssignments() {
  try {
    loading.value = true
    const response = await apiClient.get(endpoints.lms.assignments)
    console.log('Загруженные задания:', response.data)
    assignments.value = response.data.results || response.data || []
  } catch (error) {
    console.error('Ошибка загрузки заданий:', error)
    assignments.value = []
  } finally {
    loading.value = false
  }
}

async function fetchSubmittedAssignments() {
  if (!userRole.isStudent.value) return
  
  try {
    const response = await apiClient.get(endpoints.lms.submittedAssignments)
    console.log('Загруженные сданные задания:', response.data)
    submittedAssignments.value = response.data.results || response.data || []
  } catch (error) {
    console.error('Ошибка загрузки сданных заданий:', error)
    submittedAssignments.value = []
  }
}

async function fetchLessons() {
  try {
    const response = await apiClient.get(endpoints.lms.lessons)
    lessons.value = response.data.results || response.data || []
  } catch (error) {
    console.error('Ошибка загрузки уроков:', error)
    lessons.value = []
  }
}

async function createAssignment() {
  try {
    console.log('Создание задания:', assignmentForm.value)
    const response = await apiClient.post(endpoints.lms.assignments, assignmentForm.value)
    
    assignments.value.unshift(response.data)
    showCreateModal.value = false
    resetAssignmentForm()
    
    alert('Задание успешно создано!')
  } catch (error) {
    console.error('Ошибка создания задания:', error)
    alert('Ошибка при создании задания')
  }
}

function resetAssignmentForm() {
  assignmentForm.value = {
    title: '',
    description: '',
    lesson: null,
    deadline: '',
    max_grade: 100,
    allow_late_submissions: false,
    submission_type: 'file',
    max_file_size: 10485760,
  }
}

function getSubmission(assignmentId) {
  return submittedAssignments.value.find(sub => sub.assignment === assignmentId)
}

function getStatusBadge(assignment) {
  const submission = getSubmission(assignment.id)
  
  if (!submission) {
    return { class: 'bg-warning text-dark', text: 'К выполнению' }
  } else if (submission && !submission.graded_at) {
    return { class: 'bg-primary', text: 'Отправлено' }
  } else {
    return { class: 'bg-success', text: 'Оценено' }
  }
}

function getDaysLeft(deadline) {
  const now = new Date()
  const due = new Date(deadline)
  const diffTime = due - now
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
  
  if (diffDays < 0) return { text: 'Просрочено', class: 'text-danger' }
  if (diffDays === 0) return { text: 'Сегодня', class: 'text-warning' }
  if (diffDays === 1) return { text: '1 день', class: 'text-warning' }
  if (diffDays <= 3) return { text: `${diffDays} дня`, class: 'text-warning' }
  return { text: `${diffDays} дней`, class: 'text-muted' }
}

function formatDate(dateString) {
  if (!dateString) return 'Не указано'
  return new Date(dateString).toLocaleDateString('ru', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  })
}

function formatFileSize(bytes) {
  if (bytes === 0) return '0 Bytes'
  const k = 1024
  const sizes = ['Bytes', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
}

function openAssignment(assignment) {
  console.log('Открыть задание:', assignment.id)
  // TODO: Добавить модальное окно или переход к деталям задания
}

function editAssignment(assignment) {
  console.log('Редактировать задание:', assignment.id)
  // TODO: Добавить модальное окно редактирования
}

function canEditAssignment(assignment) {
  return userRole.isAdmin.value || 
         (userRole.isTeacher.value && assignment.lesson && canEditLesson(assignment.lesson))
}

function canEditLesson(lessonId) {
  const lesson = lessons.value.find(l => l.id === lessonId)
  return lesson && lesson.teacher === userRole.currentUser.value?.id
}

function getSubmissionType(type) {
  const submissionType = submissionTypes.find(t => t.value === type)
  return submissionType ? submissionType.label : type
}

onMounted(async () => {
  await Promise.all([
    fetchAssignments(),
    fetchSubmittedAssignments(),
    fetchLessons()
  ])
})
</script>

<template>
  <div class="assignments-view">
    <div class="row mb-4">
      <div class="col-12">
        <div class="d-flex justify-content-between align-items-center mb-3">
          <h3 class="mb-0">Задания</h3>
          <RoleGuard :roles="['teacher', 'admin']">
            <button 
              @click="showCreateModal = true"
              class="btn btn-primary d-flex align-items-center gap-2"
            >
              <Plus :size="20" />
              Создать задание
            </button>
          </RoleGuard>
        </div>
        
        <!-- Табы -->
        <div class="nav nav-pills mb-4" role="tablist">
          <button
            v-for="tab in tabs"
            :key="tab.value"
            @click="selectedTab = tab.value"
            :class="`nav-link ${selectedTab === tab.value ? 'active' : ''}`"
            type="button"
          >
            <component :is="tab.icon" :size="18" class="me-2" />
            {{ tab.label }}
            <span v-if="tab.value !== 'all'" class="badge bg-light text-dark ms-2">
              {{ filteredAssignments.length }}
            </span>
          </button>
        </div>
      </div>
    </div>

    <div v-if="loading" class="text-center py-5">
      <div class="spinner-border" role="status">
        <span class="visually-hidden">Загрузка...</span>
      </div>
    </div>

    <div v-else-if="filteredAssignments.length === 0" class="text-center py-5">
      <ClipboardList :size="48" class="text-muted mb-3" />
      <h5 class="text-muted">Заданий не найдено</h5>
      <p class="text-muted">
        <span v-if="userRole.isTeacher.value || userRole.isAdmin.value">
          Создайте первое задание для ваших уроков
        </span>
        <span v-else>
          В данной категории пока нет заданий
        </span>
      </p>
    </div>

    <div v-else class="assignments-list">
      <div v-for="assignment in filteredAssignments" :key="assignment.id" class="card assignment-card mb-4">
        <div class="card-body">
          <div class="row">
            <div class="col-lg-8">
              <div class="assignment-header mb-3">
                <div class="d-flex justify-content-between align-items-start mb-2">
                  <h5 class="assignment-title mb-0">{{ assignment.title }}</h5>
                  <div class="d-flex gap-2">
                    <span :class="`badge ${getStatusBadge(assignment).class}`">
                      {{ getStatusBadge(assignment).text }}
                    </span>
                    <div class="dropdown" v-if="canEditAssignment(assignment)">
                      <button class="btn btn-sm btn-outline-secondary" data-bs-toggle="dropdown">
                        <Edit :size="16" />
                      </button>
                      <ul class="dropdown-menu">
                        <li>
                          <a class="dropdown-item" href="#" @click.prevent="editAssignment(assignment)">
                            <Edit :size="16" class="me-2" />
                            Редактировать
                          </a>
                        </li>
                      </ul>
                    </div>
                  </div>
                </div>
                
                <!-- Метаинформация -->
                <div class="assignment-meta small text-muted mb-3">
                  <div class="d-flex align-items-center gap-3">
                    <span>Урок ID: {{ assignment.lesson }}</span>
                    <span>Макс. балл: {{ assignment.max_grade || 100 }}</span>
                    <span>{{ getSubmissionType(assignment.submission_type) }}</span>
                  </div>
                </div>
              </div>
              
              <p class="assignment-description text-muted mb-3">{{ assignment.description }}</p>
              
              <!-- Информация о сдаче для студентов -->
              <div v-if="userRole.isStudent.value && getSubmission(assignment.id)" class="submission-info mb-3">
                <div class="card bg-light">
                  <div class="card-body py-2">
                    <div class="d-flex justify-content-between align-items-center">
                      <div>
                        <span class="fw-bold">Сдано:</span>
                        {{ formatDate(getSubmission(assignment.id).dateofsubmit) }}
                      </div>
                      <div v-if="getSubmission(assignment.id).grade > 0">
                        <span class="fw-bold">Оценка:</span>
                        <span class="badge bg-primary">{{ getSubmission(assignment.id).grade }}</span>
                      </div>
                    </div>
                    <div v-if="getSubmission(assignment.id).feedback" class="mt-2">
                      <span class="fw-bold">Отзыв:</span>
                      <p class="mb-0 text-muted">{{ getSubmission(assignment.id).feedback }}</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            
            <div class="col-lg-4">
              <div class="assignment-details">
                <!-- Дедлайн -->
                <div class="deadline-info mb-3">
                  <div class="d-flex align-items-center gap-2 mb-1">
                    <Calendar :size="16" class="text-muted" />
                    <span class="small fw-bold">Дедлайн:</span>
                  </div>
                  <div class="deadline-date">{{ formatDate(assignment.deadline) }}</div>
                  <div v-if="assignment.deadline" :class="`small ${getDaysLeft(assignment.deadline).class}`">
                    {{ getDaysLeft(assignment.deadline).text }}
                  </div>
                </div>
                
                <!-- Дополнительная информация -->
                <div class="additional-info small text-muted">
                  <div v-if="assignment.allow_late_submissions" class="mb-1">
                    ✓ Разрешена поздняя сдача
                  </div>
                  <div class="mb-1">
                    Макс. размер файла: {{ formatFileSize(assignment.max_file_size || 10485760) }}
                  </div>
                </div>
                
                <!-- Кнопки действий -->
                <div class="assignment-actions mt-3">
                  <div v-if="userRole.isStudent.value" class="d-grid gap-2">
                    <button 
                      v-if="!getSubmission(assignment.id)"
                      @click="openAssignment(assignment)"
                      class="btn btn-primary btn-sm"
                    >
                      <Upload :size="16" class="me-1" />
                      Сдать задание
                    </button>
                    <button 
                      v-else
                      @click="openAssignment(assignment)"
                      class="btn btn-outline-primary btn-sm"
                    >
                      <FileText :size="16" class="me-1" />
                      Просмотр сдачи
                    </button>
                  </div>
                  <div v-else-if="userRole.isTeacher.value || userRole.isAdmin.value" class="d-flex gap-2">
                    <button class="btn btn-outline-primary btn-sm flex-fill">
                      <Users :size="16" class="me-1" />
                      Сдачи
                    </button>
                    <button 
                      v-if="canEditAssignment(assignment)"
                      @click="editAssignment(assignment)"
                      class="btn btn-outline-secondary btn-sm"
                    >
                      <Edit :size="16" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Модальное окно создания задания -->
    <div class="modal fade" :class="{ 'show d-block': showCreateModal }" tabindex="-1" v-if="showCreateModal">
      <div class="modal-dialog modal-lg">
        <div class="modal-content">
          <div class="modal-header">
            <h5 class="modal-title">Создать новое задание</h5>
            <button type="button" class="btn-close" @click="showCreateModal = false"></button>
          </div>
          <div class="modal-body">
            <form @submit.prevent="createAssignment">
              <div class="row">
                <div class="col-12 mb-3">
                  <label class="form-label">Название задания *</label>
                  <input 
                    v-model="assignmentForm.title" 
                    type="text" 
                    class="form-control" 
                    required
                    placeholder="Введите название задания"
                  />
                </div>
                
                <div class="col-12 mb-3">
                  <label class="form-label">Описание</label>
                  <textarea 
                    v-model="assignmentForm.description" 
                    class="form-control" 
                    rows="4"
                    placeholder="Подробное описание задания"
                  ></textarea>
                </div>
                
                <div class="col-md-6 mb-3">
                  <label class="form-label">Урок *</label>
                  <select v-model="assignmentForm.lesson" class="form-select" required>
                    <option :value="null">Выберите урок</option>
                    <option v-for="lesson in lessons" :key="lesson.id" :value="lesson.id">
                      {{ lesson.name }}
                    </option>
                  </select>
                </div>
                
                <div class="col-md-6 mb-3">
                  <label class="form-label">Дедлайн</label>
                  <input v-model="assignmentForm.deadline" type="datetime-local" class="form-control" />
                </div>
                
                <div class="col-md-6 mb-3">
                  <label class="form-label">Максимальный балл</label>
                  <input 
                    v-model="assignmentForm.max_grade" 
                    type="number" 
                    class="form-control"
                    min="1"
                    placeholder="100"
                  />
                </div>
                
                <div class="col-md-6 mb-3">
                  <label class="form-label">Тип сдачи</label>
                  <select v-model="assignmentForm.submission_type" class="form-select">
                    <option v-for="type in submissionTypes" :key="type.value" :value="type.value">
                      {{ type.label }}
                    </option>
                  </select>
                </div>
                
                <div class="col-md-6 mb-3">
                  <label class="form-label">Макс. размер файла (байты)</label>
                  <input 
                    v-model="assignmentForm.max_file_size" 
                    type="number" 
                    class="form-control"
                    placeholder="10485760"
                  />
                  <div class="form-text">{{ formatFileSize(assignmentForm.max_file_size || 10485760) }}</div>
                </div>
                
                <div class="col-12 mb-3">
                  <div class="form-check">
                    <input 
                      v-model="assignmentForm.allow_late_submissions" 
                      class="form-check-input" 
                      type="checkbox" 
                      id="allowLate"
                    />
                    <label class="form-check-label" for="allowLate">
                      Разрешить сдачу после дедлайна
                    </label>
                  </div>
                </div>
              </div>
            </form>
          </div>
          <div class="modal-footer">
            <button type="button" class="btn btn-secondary" @click="showCreateModal = false">
              Отмена
            </button>
            <button type="button" class="btn btn-primary" @click="createAssignment">
              Создать задание
            </button>
          </div>
        </div>
      </div>
    </div>
    <div v-if="showCreateModal" class="modal-backdrop fade show"></div>
  </div>
</template>

<style lang="scss" scoped>
.assignments-view {
  .nav-pills {
    .nav-link {
      display: flex;
      align-items: center;
      color: var(--bs-gray-600);
      
      &.active {
        background-color: var(--bs-primary);
        color: white;
        
        .badge {
          background-color: rgba(255, 255, 255, 0.2) !important;
          color: white !important;
        }
      }
      
      &:not(.active):hover {
        background-color: var(--bs-gray-100);
      }
    }
  }
  
  .assignment-card {
    border: 1px solid var(--bs-border-color);
    transition: box-shadow 0.2s;
    
    &:hover {
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
    }
    
    .assignment-title {
      color: var(--bs-dark);
      cursor: pointer;
      
      &:hover {
        color: var(--bs-primary);
      }
    }
    
    .attachment-item {
      display: flex;
      align-items: center;
      padding: 0.5rem 0.75rem;
      background: var(--bs-light);
      border-radius: 0.375rem;
      cursor: pointer;
      transition: background-color 0.2s;
      
      &:hover {
        background: var(--bs-gray-200);
      }
      
      .attachment-name {
        font-size: 0.875rem;
      }
    }
    
    .deadline-card,
    .points-card {
      border: 1px solid var(--bs-border-color);
    }
    
    .deadline-date {
      font-weight: 600;
      font-size: 0.95rem;
    }
    
    .feedback-text {
      border: 1px solid var(--bs-border-color);
      font-style: italic;
    }
    
    .submission-info {
      border-top: 1px solid var(--bs-border-color);
      padding-top: 1rem;
      margin-top: 1rem;
    }
  }
}

@media (max-width: 768px) {
  .assignments-view {
    .nav-pills {
      flex-direction: column;
      
      .nav-link {
        justify-content: flex-start;
        margin-bottom: 0.25rem;
      }
    }
    
    .assignment-card {
      .row {
        flex-direction: column;
      }
      
      .assignment-details {
        margin-top: 1rem;
      }
    }
  }
}
</style> 