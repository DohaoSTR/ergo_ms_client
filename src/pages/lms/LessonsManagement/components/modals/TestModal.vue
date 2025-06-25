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
        <div class="col-md-6">
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
        <div class="col-md-6">
          <div class="mb-3">
            <label class="form-label">Тема</label>
            <select 
              v-model="form.theme" 
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
      </div>

      <div class="row">
        <div class="col-md-6">
          <div class="mb-3">
            <label class="form-label">Тип теста</label>
            <select v-model="form.type" class="form-select">
              <option value="close">Закрытые вопросы</option>
              <option value="open">Открытые вопросы</option>
              <option value="game">Игровой формат</option>
            </select>
          </div>
        </div>
        <div class="col-md-6">
          <div class="mb-3">
            <label class="form-label">Длительность (мин)</label>
            <input 
              v-model="form.duration_minutes" 
              type="number" 
              class="form-control"
              min="1"
              placeholder="60"
            />
          </div>
        </div>
      </div>

      <div class="row">
        <div class="col-md-6">
          <div class="mb-3">
            <label class="form-label">Проходной балл (%)</label>
            <input 
              v-model="form.passing_score" 
              type="number" 
              class="form-control"
              min="0"
              max="100"
              placeholder="70"
            />
          </div>
        </div>
        <div class="col-md-6">
          <div class="mb-3">
            <label class="form-label">Максимум попыток</label>
            <input 
              v-model="form.max_attempts" 
              type="number" 
              class="form-control"
              min="1"
              placeholder="1"
            />
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
    </form>
  </BaseModal>
</template>

<script setup>
import { ref, computed, watch, onMounted } from 'vue'
import { FileCheck } from 'lucide-vue-next'
import BaseModal from '../BaseModal.vue'

const props = defineProps({
  show: Boolean,
  editing: Boolean,
  testData: Object,
  courses: Array,
  themes: Array,
  loading: Boolean
})

const emit = defineEmits(['close', 'save'])

const form = ref({
  name: '',
  title: '',
  description: '',
  course: null,
  theme: null,
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

const validationErrors = ref({})

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

function onCourseChange() {
  form.value.theme = null
}

function resetForm() {
  form.value = {
    name: '',
    title: '',
    description: '',
    course: null,
    theme: null,
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

  if (Object.keys(errors).length > 0) {
    validationErrors.value = errors
    return
  }

  // Подготавливаем данные для отправки
  const testData = {
    name: form.value.name?.trim(),
    title: form.value.title?.trim(),
    description: form.value.description?.trim() || 'Описание теста',
    type: form.value.type || 'close',
    duration_minutes: form.value.duration_minutes || 60,
    passing_score: form.value.passing_score || 70,
    max_attempts: form.value.max_attempts || 1,
    show_correct_answers: Boolean(form.value.show_correct_answers),
    randomize_questions: Boolean(form.value.randomize_questions),
    available_from: form.value.available_from || null,
    available_until: form.value.available_until || null,
    is_active: Boolean(form.value.is_active),
    // Привязка к теме через курс и тему
    course: form.value.course,
    theme: form.value.theme
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
        course: newData.course || null,
        theme: newData.theme || null,
        type: newData.type || 'close',
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