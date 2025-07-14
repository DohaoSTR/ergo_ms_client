<template>
  <BaseModal
    :show="show"
    :title="editing ? 'Редактировать тест' : 'Создать тест'"
    :loading="loading"
    size="lg"
    @close="$emit('close')"
    @confirm="handleSave"
  >
    <template #icon>
      <FileCheck :size="20" class="text-info" />
    </template>

    <form @submit.prevent="handleSave">
      <div class="row">
        <div class="col-md-6">
          <div class="mb-3">
            <label class="form-label">Название теста *</label>
            <input 
              v-model="form.name" 
              type="text" 
              class="form-control" 
              :class="{ 'is-invalid': validationErrors.name }"
              required
              placeholder="Введите название теста"
            />
            <div v-if="validationErrors.name" class="invalid-feedback">
              {{ validationErrors.name }}
            </div>
          </div>
        </div>
        <div class="col-md-6">
          <div class="mb-3">
            <label class="form-label">Заголовок теста *</label>
            <input 
              v-model="form.title" 
              type="text" 
              class="form-control" 
              :class="{ 'is-invalid': validationErrors.title }"
              required
              placeholder="Введите заголовок теста"
            />
            <div v-if="validationErrors.title" class="invalid-feedback">
              {{ validationErrors.title }}
            </div>
          </div>
        </div>
      </div>
      
      <div class="mb-3">
        <label class="form-label">Описание</label>
        <textarea 
          v-model="form.description" 
          class="form-control" 
          rows="3"
          placeholder="Описание теста"
        ></textarea>
      </div>

      <div class="row">
        <div class="col-md-4">
          <div class="mb-3">
            <label class="form-label">Курс *</label>
            <select 
              v-model="form.course" 
              @change="onCourseChange"
              class="form-select"
              :class="{ 'is-invalid': validationErrors.course }"
              required
            >
              <option value="">Выберите курс</option>
              <option v-for="course in courses" :key="course.id" :value="course.id">
                {{ course.name }}
              </option>
            </select>
            <div v-if="validationErrors.course" class="invalid-feedback">
              {{ validationErrors.course }}
            </div>
          </div>
        </div>
        <div class="col-md-4">
          <div class="mb-3">
            <label class="form-label">Тема</label>
            <select 
              v-model="form.theme" 
              @change="onThemeChange"
              class="form-select"
              :disabled="!form.course"
            >
              <option value="">Выберите тему (необязательно)</option>
              <option v-for="theme in filteredThemes" :key="theme.id" :value="theme.id">
                {{ theme.name }}
              </option>
            </select>
            <div class="form-text">Если тема не выбрана, тест будет относиться ко всему курсу</div>
          </div>
        </div>
        <div class="col-md-4">
          <div class="mb-3">
            <label class="form-label">Урок</label>
            <select 
              v-model="form.lesson" 
              class="form-select"
              :disabled="!form.theme"
            >
              <option value="">Выберите урок (необязательно)</option>
              <option v-for="lesson in filteredLessons" :key="lesson.id" :value="lesson.id">
                {{ lesson.name }}
              </option>
            </select>
            <div class="form-text">Если урок не выбран, тест будет относиться к теме</div>
          </div>
        </div>
      </div>

      <div class="row">
        <div class="col-md-6">
          <div class="mb-3">
            <label class="form-label">Тип теста *</label>
            <select v-model="form.type" class="form-select" :class="{ 'is-invalid': validationErrors.type }" required>
              <option value="C">Закрытые вопросы</option>
              <option value="O">Открытые вопросы</option>
              <option value="G">Игровой формат</option>
            </select>
            <div v-if="validationErrors.type" class="invalid-feedback">
              {{ validationErrors.type }}
            </div>
          </div>
        </div>
        <div class="col-md-6">
          <div class="mb-3">
            <label class="form-label">Длительность (мин) *</label>
            <input 
              v-model="form.duration_minutes" 
              type="number" 
              class="form-control"
              :class="{ 'is-invalid': validationErrors.duration_minutes }"
              min="1"
              required
              placeholder="60"
            />
            <div v-if="validationErrors.duration_minutes" class="invalid-feedback">
              {{ validationErrors.duration_minutes }}
            </div>
          </div>
        </div>
      </div>

      <div class="row">
        <div class="col-md-6">
          <div class="mb-3">
            <label class="form-label">Проходной балл (%) *</label>
            <input 
              v-model="form.passing_score" 
              type="number" 
              class="form-control"
              :class="{ 'is-invalid': validationErrors.passing_score }"
              min="0"
              max="100"
              required
              placeholder="70"
            />
            <div v-if="validationErrors.passing_score" class="invalid-feedback">
              {{ validationErrors.passing_score }}
            </div>
          </div>
        </div>
        <div class="col-md-6">
          <div class="mb-3">
            <label class="form-label">Максимум попыток *</label>
            <input 
              v-model="form.max_attempts" 
              type="number" 
              class="form-control"
              :class="{ 'is-invalid': validationErrors.max_attempts }"
              min="1"
              required
              placeholder="1"
            />
            <div v-if="validationErrors.max_attempts" class="invalid-feedback">
              {{ validationErrors.max_attempts }}
            </div>
          </div>
        </div>
      </div>

      <div class="row mb-3">
        <div class="col-md-6">
          <div class="form-check">
            <input 
              v-model="form.show_correct_answers" 
              class="form-check-input" 
              type="checkbox" 
              id="showCorrectAnswers"
            />
            <label class="form-check-label" for="showCorrectAnswers">
              Показывать правильные ответы
            </label>
          </div>
        </div>
        <div class="col-md-6">
          <div class="form-check">
            <input 
              v-model="form.randomize_questions" 
              class="form-check-input" 
              type="checkbox" 
              id="randomizeQuestions"
            />
            <label class="form-check-label" for="randomizeQuestions">
              Перемешивать вопросы
            </label>
          </div>
        </div>
      </div>

      <div class="row">
        <div class="col-md-6">
          <div class="mb-3">
            <label class="form-label">Доступен с</label>
            <input 
              v-model="form.available_from" 
              type="datetime-local" 
              class="form-control"
            />
          </div>
        </div>
        <div class="col-md-6">
          <div class="mb-3">
            <label class="form-label">Доступен до</label>
            <input 
              v-model="form.available_until" 
              type="datetime-local" 
              class="form-control"
            />
          </div>
        </div>
      </div>

      <div class="mb-3">
        <div class="form-check">
          <input 
            v-model="form.is_active" 
            class="form-check-input" 
            type="checkbox" 
            id="isActive"
          />
          <label class="form-check-label" for="isActive">
            Активный тест
          </label>
        </div>
      </div>

      <!-- Управление вопросами для существующих тестов -->
      <div v-if="editing && testData?.id" class="mb-3">
        <hr class="my-4">
        <div class="d-flex justify-content-between align-items-center">
          <div>
            <h6 class="mb-1">Вопросы теста</h6>
            <small class="text-muted">Управление вопросами и их содержимым</small>
          </div>
          <button 
            type="button" 
            class="btn btn-outline-primary"
            @click="openQuestionManagement"
          >
            <Settings :size="16" class="me-1" />
            Управление вопросами
          </button>
        </div>
      </div>

      <!-- Сохранить и управлять вопросами для новых тестов -->
      <div v-else-if="!editing" class="mb-3">
        <div class="alert alert-info py-2">
          <Info :size="16" class="me-2" />
          <small>После создания теста вы сможете добавить вопросы</small>
        </div>
      </div>
    </form>

    <!-- Модальное окно управления вопросами -->
    <QuestionManagementModal
      :show="showQuestionManagement"
      :test-data="currentTestData"
      :loading="questionManagementLoading"
      @close="closeQuestionManagement"
      @save="handleQuestionManagementSave"
    />
  </BaseModal>
</template>

<script setup>
import { ref, computed, watch, onMounted } from 'vue'
import { FileCheck, Settings, Info } from 'lucide-vue-next'
import BaseModal from '../BaseModal.vue'
import QuestionManagementModal from './QuestionManagementModal.vue'

const props = defineProps({
  show: Boolean,
  editing: Boolean,
  testData: Object,
  courses: Array,
  themes: Array,
  lessons: Array,
  loading: Boolean
})

const emit = defineEmits(['close', 'save', 'save-questions'])

const form = ref({
  name: '',
  title: '',
  description: '',
  course: null,
  theme: null,
  lesson: null,
  type: 'C',
  duration_minutes: 60,
  passing_score: 70,
  max_attempts: 1,
  show_correct_answers: false,
  randomize_questions: false,
  available_from: '',
  available_until: '',
  is_active: true
})

const validationErrors = ref({})
const showQuestionManagement = ref(false)
const questionManagementLoading = ref(false)
const currentTestData = ref(null)

const filteredThemes = computed(() => {
  if (!form.value.course || !props.themes) return []
  return props.themes.filter(theme => {
    let themeSubject = theme.subject
    if (typeof themeSubject === 'object' && themeSubject?.id) {
      themeSubject = themeSubject.id
    }
    return parseInt(themeSubject) === parseInt(form.value.course)
  })
})

const filteredLessons = computed(() => {
  if (!form.value.theme || !props.lessons) return []
  return props.lessons.filter(lesson => {
    let lessonTheme = lesson.theme
    if (typeof lessonTheme === 'object' && lessonTheme?.id) {
      lessonTheme = lessonTheme.id
    }
    return parseInt(lessonTheme) === parseInt(form.value.theme)
  })
})

function onCourseChange() {
  form.value.theme = null
  form.value.lesson = null
}

function onThemeChange() {
  form.value.lesson = null
}

// Управление вопросами
function openQuestionManagement() {
  currentTestData.value = { ...props.testData }
  showQuestionManagement.value = true
}

function closeQuestionManagement() {
  showQuestionManagement.value = false
  currentTestData.value = null
}

function handleQuestionManagementSave(data) {
  emit('save-questions', data)
  closeQuestionManagement()
}

function resetForm() {
  form.value = {
    name: '',
    title: '',
    description: '',
    course: null,
    theme: null,
    lesson: null,
    type: 'C',
    duration_minutes: 60,
    passing_score: 70,
    max_attempts: 1,
    show_correct_answers: false,
    randomize_questions: false,
    available_from: '',
    available_until: '',
    is_active: true
  }
  validationErrors.value = {}
}

function handleSave() {
  validationErrors.value = {}
  
  const errors = {}
  
  if (!form.value.name?.trim()) {
    errors.name = 'Название теста обязательно'
  }
  
  if (!form.value.title?.trim()) {
    errors.title = 'Заголовок теста обязателен'
  }
  
  if (!form.value.course) {
    errors.course = 'Выберите курс'
  }
  
  if (!form.value.duration_minutes || form.value.duration_minutes < 1) {
    errors.duration_minutes = 'Длительность должна быть больше 0'
  }
  
  if (form.value.passing_score === null || form.value.passing_score === undefined || form.value.passing_score < 0 || form.value.passing_score > 100) {
    errors.passing_score = 'Проходной балл должен быть от 0 до 100'
  }
  
  if (!form.value.max_attempts || form.value.max_attempts < 1) {
    errors.max_attempts = 'Максимум попыток должен быть больше 0'
  }

  if (Object.keys(errors).length > 0) {
    validationErrors.value = errors
    return
  }

  // Подготавливаем данные для отправки
  const testData = {
    name: form.value.name?.trim(),
    title: form.value.title?.trim(),
    description: form.value.description?.trim() || 'Описание теста',
    type: form.value.type || 'C',
    duration_minutes: form.value.duration_minutes || 60,
    passing_score: form.value.passing_score || 70,
    max_attempts: form.value.max_attempts || 1,
    show_correct_answers: Boolean(form.value.show_correct_answers),
    randomize_questions: Boolean(form.value.randomize_questions),
    available_from: form.value.available_from || null,
    available_until: form.value.available_until || null,
    is_active: Boolean(form.value.is_active),
    // Привязка к сущностям (используем правильные имена полей из API)
    subject: form.value.course || null,
    theme: form.value.theme || null,
    lesson: form.value.lesson || null
  }

  emit('save', testData, validationErrors)
}

watch(() => props.testData, (newData) => {
  if (newData && Object.keys(newData).length > 0) {
    if (props.editing) {
      form.value = {
        name: newData.name || '',
        title: newData.title || '',
        description: newData.description || '',
        course: newData.subject?.id || newData.course || null,
        theme: newData.theme?.id || newData.theme || null,
        lesson: newData.lesson?.id || newData.lesson || null,
        type: newData.type || 'C',
        duration_minutes: newData.duration_minutes || 60,
        passing_score: newData.passing_score || 70,
        max_attempts: newData.max_attempts || 1,
        show_correct_answers: newData.show_correct_answers || false,
        randomize_questions: newData.randomize_questions || false,
        available_from: newData.available_from ? new Date(newData.available_from).toISOString().slice(0, 16) : '',
        available_until: newData.available_until ? new Date(newData.available_until).toISOString().slice(0, 16) : '',
        is_active: newData.is_active !== undefined ? newData.is_active : true
      }
    } else {
      // Для создания нового теста с предустановленными значениями
      form.value = {
        name: '',
        title: '',
        description: '',
        course: newData.course || null,
        theme: newData.theme || null,
        lesson: newData.lesson || null,
        type: 'C',
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
  } else if (!props.editing) {
    resetForm()
  }
}, { immediate: true })

watch(() => props.show, (newShow) => {
  if (!newShow) {
    validationErrors.value = {}
  }
})
</script> 