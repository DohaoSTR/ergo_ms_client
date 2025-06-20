<script setup>
import { ref, onMounted, computed } from 'vue'
import { Play, Clock, CheckCircle, XCircle, Award, BookOpen, Plus, Edit, Users, FileText } from 'lucide-vue-next'
import RoleGuard from '../components/RoleGuard.vue'
import { globalUserRole } from '../composables/useUserRole'
import { apiClient } from '@/js/api/manager'
import { endpoints } from '@/js/api/endpoints'

const tests = ref([])
const testAttempts = ref([])
const subjects = ref([])
const lessons = ref([])
const loading = ref(true)
const showCreateModal = ref(false)
const userRole = globalUserRole

// Форма создания теста
const testForm = ref({
  name: '',
  title: '',
  description: '',
  lesson: null,
  type: 'close',
  duration_minutes: 60,
  passing_score: 70,
  max_attempts: 1,
  show_correct_answers: false,
  randomize_questions: false,
  available_from: '',
  available_until: '',
  is_active: true
})

const testTypes = [
  { value: 'close', label: 'Закрытые вопросы' },
  { value: 'open', label: 'Открытые вопросы' },
  { value: 'game', label: 'Игровой формат' }
]

// Фильтрация тестов в зависимости от роли пользователя
const availableTests = computed(() => {
  if (userRole.isTeacher.value || userRole.isAdmin.value) {
    return tests.value
  }
  // Студенты видят только активные тесты
  return tests.value.filter(test => test.is_active)
})

async function loadTests() {
  try {
    loading.value = true
    const response = await apiClient.get(endpoints.lms.tests)
    console.log('Загруженные тесты:', response.data)
    tests.value = response.data.results || response.data || []
  } catch (error) {
    console.error('Ошибка загрузки тестов:', error)
    tests.value = []
  } finally {
    loading.value = false
  }
}

async function loadSubjects() {
  try {
    const response = await apiClient.get(endpoints.lms.subjects)
    subjects.value = response.data.results || response.data || []
  } catch (error) {
    console.error('Ошибка загрузки курсов:', error)
    subjects.value = []
  }
}

async function loadLessons() {
  try {
    const response = await apiClient.get(endpoints.lms.lessons)
    lessons.value = response.data.results || response.data || []
  } catch (error) {
    console.error('Ошибка загрузки уроков:', error)
    lessons.value = []
  }
}

async function loadTestAttempts() {
  if (!userRole.isStudent.value) return
  
  try {
    const response = await apiClient.get(endpoints.lms.testAttempts)
    testAttempts.value = response.data.results || response.data || []
  } catch (error) {
    console.error('Ошибка загрузки попыток:', error)
    testAttempts.value = []
  }
}

async function createTest() {
  try {
    console.log('Создание теста:', testForm.value)
    const response = await apiClient.post(endpoints.lms.tests, testForm.value)
    
    tests.value.unshift(response.data)
    showCreateModal.value = false
    resetTestForm()
    
    alert('Тест успешно создан!')
  } catch (error) {
    console.error('Ошибка создания теста:', error)
    alert('Ошибка при создании теста')
  }
}

async function startTest(test) {
  try {
    const response = await apiClient.post(endpoints.lms.startTest(test.id))
    console.log('Начат тест:', response.data)
    // Переход к прохождению теста
    alert(`Начат тест: ${test.name}`)
  } catch (error) {
    console.error('Ошибка запуска теста:', error)
    alert('Ошибка при запуске теста')
  }
}

function resetTestForm() {
  testForm.value = {
    name: '',
    title: '',
    description: '',
    lesson: null,
    type: 'close',
    duration_minutes: 60,
    passing_score: 70,
    max_attempts: 1,
    show_correct_answers: false,
    randomize_questions: false,
    available_from: '',
    available_until: '',
    is_active: true
  }
}

function editTest(test) {
  console.log('Редактировать тест:', test.id)
  // TODO: Добавить модальное окно редактирования
}

function canEditTest(test) {
  return userRole.isAdmin.value || 
         (userRole.isTeacher.value && test.lesson && canEditLesson(test.lesson))
}

function canEditLesson(lessonId) {
  const lesson = lessons.value.find(l => l.id === lessonId)
  if (!lesson) return false
  // Проверяем через subject
  const subject = subjects.value.find(s => s.id === lesson.theme?.subject)
  return subject && subject.teacher === userRole.currentUser.value?.id
}

function getTestAttempt(testId) {
  return testAttempts.value.find(attempt => attempt.test === testId)
}

function getTestStatus(test) {
  if (!userRole.isStudent.value) return null
  
  const attempt = getTestAttempt(test.id)
  if (!attempt) return 'not_started'
  
  if (attempt.completed_at) {
    return attempt.is_passed ? 'passed' : 'failed'
  }
  return 'in_progress'
}

function getStatusBadge(status) {
  switch (status) {
    case 'passed':
      return { class: 'bg-success', text: 'Пройден', icon: CheckCircle }
    case 'failed':
      return { class: 'bg-danger', text: 'Не пройден', icon: XCircle }
    case 'in_progress':
      return { class: 'bg-warning', text: 'В процессе', icon: Clock }
    default:
      return { class: 'bg-secondary', text: 'Не начат', icon: Play }
  }
}

function getTypeLabel(type) {
  const typeOption = testTypes.find(t => t.value === type)
  return typeOption ? typeOption.label : type
}

function formatDuration(minutes) {
  if (minutes < 60) return `${minutes} мин`
  const hours = Math.floor(minutes / 60)
  const remainingMinutes = minutes % 60
  return remainingMinutes > 0 ? `${hours}ч ${remainingMinutes}м` : `${hours}ч`
}

function formatDate(dateString) {
  if (!dateString) return 'Не указано'
  return new Date(dateString).toLocaleDateString('ru-RU')
}

function isTestAvailable(test) {
  const now = new Date()
  const availableFrom = test.available_from ? new Date(test.available_from) : null
  const availableUntil = test.available_until ? new Date(test.available_until) : null
  
  if (availableFrom && now < availableFrom) return false
  if (availableUntil && now > availableUntil) return false
  
  return true
}

onMounted(async () => {
  await Promise.all([
    loadTests(),
    loadSubjects(),
    loadLessons(),
    loadTestAttempts()
  ])
})
</script>

<template>
  <div class="tests-view">
    <!-- Заголовок с кнопкой создания теста -->
    <div class="row mb-4">
      <div class="col-12">
        <div class="d-flex justify-content-between align-items-center mb-3">
          <h3 class="mb-0">Тестирование</h3>
          <RoleGuard :roles="['teacher', 'admin']">
            <button 
              @click="showCreateModal = true"
              class="btn btn-primary d-flex align-items-center gap-2"
            >
              <Plus :size="20" />
              Создать тест
            </button>
          </RoleGuard>
        </div>
      </div>
    </div>

    <!-- Загрузка -->
    <div v-if="loading" class="text-center py-5">
      <div class="spinner-border"></div>
      <p class="mt-2">Загрузка тестов...</p>
    </div>

    <!-- Пустое состояние -->
    <div v-else-if="availableTests.length === 0" class="text-center py-5">
      <FileText :size="48" class="text-muted mb-3" />
      <h5 class="text-muted">Тесты не найдены</h5>
      <p class="text-muted">
        <span v-if="userRole.isTeacher.value || userRole.isAdmin.value">
          Создайте первый тест для ваших курсов
        </span>
        <span v-else>
          Пока нет доступных тестов
        </span>
      </p>
    </div>

    <!-- Список тестов -->
    <div v-else class="row">
      <div v-for="test in availableTests" :key="test.id" class="col-md-6 col-lg-4 mb-4">
        <div class="card h-100">
          <div class="card-body">
            <div class="d-flex justify-content-between align-items-start mb-2">
              <h6 class="card-title">{{ test.name || test.title }}</h6>
              <div class="dropdown" v-if="canEditTest(test)">
                <button class="btn btn-sm btn-outline-secondary" data-bs-toggle="dropdown">
                  <Edit :size="16" />
                </button>
                <ul class="dropdown-menu">
                  <li>
                    <a class="dropdown-item" href="#" @click.prevent="editTest(test)">
                      <Edit :size="16" class="me-2" />
                      Редактировать
                    </a>
                  </li>
                </ul>
              </div>
            </div>
            
            <p class="card-text text-muted small mb-3">{{ test.description }}</p>
            
            <!-- Метаинформация теста -->
            <div class="test-meta small text-muted mb-3">
              <div class="d-flex align-items-center gap-2 mb-1">
                <Clock :size="14" />
                <span>{{ formatDuration(test.duration_minutes || 60) }}</span>
              </div>
              <div class="d-flex align-items-center gap-2 mb-1">
                <Award :size="14" />
                <span>Проходной балл: {{ test.passing_score || 70 }}%</span>
              </div>
              <div class="d-flex align-items-center gap-2 mb-1">
                <Users :size="14" />
                <span>Попыток: {{ test.max_attempts || 1 }}</span>
              </div>
              <div class="d-flex align-items-center gap-2">
                <BookOpen :size="14" />
                <span>{{ getTypeLabel(test.type) }}</span>
              </div>
            </div>

            <!-- Доступность -->
            <div v-if="test.available_from || test.available_until" class="availability small text-muted mb-3">
              <div v-if="test.available_from">
                Доступен с: {{ formatDate(test.available_from) }}
              </div>
              <div v-if="test.available_until">
                Доступен до: {{ formatDate(test.available_until) }}
              </div>
            </div>

            <!-- Статус для студентов -->
            <div v-if="userRole.isStudent.value" class="mb-3">
              <div v-if="getTestStatus(test)" class="d-flex align-items-center gap-2">
                <component 
                  :is="getStatusBadge(getTestStatus(test)).icon" 
                  :size="16" 
                  :class="`text-${getStatusBadge(getTestStatus(test)).class.replace('bg-', '')}`"
                />
                <span :class="`badge ${getStatusBadge(getTestStatus(test)).class}`">
                  {{ getStatusBadge(getTestStatus(test)).text }}
                </span>
              </div>
            </div>

            <!-- Информация для преподавателей -->
            <div v-else-if="userRole.isTeacher.value || userRole.isAdmin.value" class="d-flex align-items-center justify-content-between">
              <div class="d-flex gap-2">
                <span v-if="test.is_active" class="badge bg-success">Активный</span>
                <span v-else class="badge bg-secondary">Неактивный</span>
              </div>
            </div>
          </div>
          
          <!-- Кнопки действий -->
          <div class="card-footer">
            <div v-if="userRole.isStudent.value" class="d-grid">
              <button 
                v-if="getTestStatus(test) === 'not_started' || getTestStatus(test) === 'in_progress'"
                @click="startTest(test)"
                class="btn btn-primary btn-sm"
                :disabled="!isTestAvailable(test) || !test.is_active"
              >
                <Play :size="16" class="me-1" />
                {{ getTestStatus(test) === 'in_progress' ? 'Продолжить' : 'Начать' }}
              </button>
              <button 
                v-else-if="getTestStatus(test) === 'passed' || getTestStatus(test) === 'failed'"
                class="btn btn-outline-secondary btn-sm"
                disabled
              >
                Просмотр результата
              </button>
            </div>
            <div v-else-if="userRole.isTeacher.value || userRole.isAdmin.value" class="d-flex gap-2">
              <button class="btn btn-outline-primary btn-sm flex-fill">
                Результаты
              </button>
              <button 
                v-if="canEditTest(test)"
                @click="editTest(test)"
                class="btn btn-outline-secondary btn-sm"
              >
                <Edit :size="16" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Модальное окно создания теста -->
    <div class="modal fade" :class="{ 'show d-block': showCreateModal }" tabindex="-1" v-if="showCreateModal">
      <div class="modal-dialog modal-lg">
        <div class="modal-content">
          <div class="modal-header">
            <h5 class="modal-title">Создать новый тест</h5>
            <button type="button" class="btn-close" @click="showCreateModal = false"></button>
          </div>
          <div class="modal-body">
            <form @submit.prevent="createTest">
              <div class="row">
                <div class="col-12 mb-3">
                  <label class="form-label">Название теста *</label>
                  <input 
                    v-model="testForm.name" 
                    type="text" 
                    class="form-control" 
                    required
                    placeholder="Введите название теста"
                  />
                </div>
                
                <div class="col-12 mb-3">
                  <label class="form-label">Заголовок</label>
                  <input 
                    v-model="testForm.title" 
                    type="text" 
                    class="form-control"
                    placeholder="Заголовок теста (необязательно)"
                  />
                </div>
                
                <div class="col-12 mb-3">
                  <label class="form-label">Описание</label>
                  <textarea 
                    v-model="testForm.description" 
                    class="form-control" 
                    rows="3"
                    placeholder="Описание теста"
                  ></textarea>
                </div>
                
                <div class="col-md-6 mb-3">
                  <label class="form-label">Урок *</label>
                  <select v-model="testForm.lesson" class="form-select" required>
                    <option :value="null">Выберите урок</option>
                    <option v-for="lesson in lessons" :key="lesson.id" :value="lesson.id">
                      {{ lesson.name }}
                    </option>
                  </select>
                </div>
                
                <div class="col-md-6 mb-3">
                  <label class="form-label">Тип теста</label>
                  <select v-model="testForm.type" class="form-select">
                    <option v-for="type in testTypes" :key="type.value" :value="type.value">
                      {{ type.label }}
                    </option>
                  </select>
                </div>
                
                <div class="col-md-4 mb-3">
                  <label class="form-label">Время (минуты)</label>
                  <input 
                    v-model="testForm.duration_minutes" 
                    type="number" 
                    class="form-control"
                    min="1"
                    placeholder="60"
                  />
                </div>
                
                <div class="col-md-4 mb-3">
                  <label class="form-label">Проходной балл (%)</label>
                  <input 
                    v-model="testForm.passing_score" 
                    type="number" 
                    class="form-control"
                    min="0"
                    max="100"
                    placeholder="70"
                  />
                </div>
                
                <div class="col-md-4 mb-3">
                  <label class="form-label">Макс. попыток</label>
                  <input 
                    v-model="testForm.max_attempts" 
                    type="number" 
                    class="form-control"
                    min="1"
                    placeholder="1"
                  />
                </div>
                
                <div class="col-md-6 mb-3">
                  <label class="form-label">Доступен с</label>
                  <input v-model="testForm.available_from" type="datetime-local" class="form-control" />
                </div>
                
                <div class="col-md-6 mb-3">
                  <label class="form-label">Доступен до</label>
                  <input v-model="testForm.available_until" type="datetime-local" class="form-control" />
                </div>
                
                <div class="col-12 mb-3">
                  <div class="form-check">
                    <input 
                      v-model="testForm.show_correct_answers" 
                      class="form-check-input" 
                      type="checkbox" 
                      id="showAnswers"
                    />
                    <label class="form-check-label" for="showAnswers">
                      Показывать правильные ответы после прохождения
                    </label>
                  </div>
                </div>
                
                <div class="col-12 mb-3">
                  <div class="form-check">
                    <input 
                      v-model="testForm.randomize_questions" 
                      class="form-check-input" 
                      type="checkbox" 
                      id="randomizeQuestions"
                    />
                    <label class="form-check-label" for="randomizeQuestions">
                      Перемешивать вопросы
                    </label>
                  </div>
                </div>
                
                <div class="col-12 mb-3">
                  <div class="form-check">
                    <input 
                      v-model="testForm.is_active" 
                      class="form-check-input" 
                      type="checkbox" 
                      id="isActive"
                    />
                    <label class="form-check-label" for="isActive">
                      Активировать тест сразу
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
            <button type="button" class="btn btn-primary" @click="createTest">
              Создать тест
            </button>
          </div>
        </div>
      </div>
    </div>
    <div v-if="showCreateModal" class="modal-backdrop fade show"></div>
  </div>
</template>

<style scoped>
.test-meta .d-flex {
  margin-bottom: 0.25rem;
}

.availability {
  border-left: 3px solid #007bff;
  padding-left: 0.5rem;
}

.card-title {
  color: #2c3e50;
  font-weight: 600;
}

.badge {
  font-size: 0.75rem;
}
</style> 