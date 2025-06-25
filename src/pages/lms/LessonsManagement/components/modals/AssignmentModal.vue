<template>
  <BaseModal
    :show="show"
    :title="editing ? 'Редактировать задание' : 'Создать задание'"
    :loading="loading"
    size="lg"
    @close="$emit('close')"
    @confirm="handleSave"
  >
    <template #icon>
      <ClipboardList :size="20" class="text-warning" />
    </template>

    <form @submit.prevent="handleSave">
      <div class="mb-3">
        <label class="form-label">Название задания *</label>
        <input 
          v-model="form.title" 
          type="text" 
          class="form-control" 
          :class="{ 'is-invalid': validationErrors.title }"
          required
          placeholder="Введите название задания"
        />
        <div v-if="validationErrors.title" class="invalid-feedback">
          {{ validationErrors.title }}
        </div>
      </div>
      
      <div class="mb-3">
        <label class="form-label">Описание</label>
        <textarea 
          v-model="form.description" 
          class="form-control" 
          rows="4"
          placeholder="Подробное описание задания"
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
            <div class="form-text">Если тема не выбрана, задание будет относиться ко всему курсу</div>
          </div>
        </div>
      </div>

      <div class="row">
        <div class="col-md-6">
          <div class="mb-3">
            <label class="form-label">Крайний срок</label>
            <input 
              v-model="form.deadline" 
              type="datetime-local" 
              class="form-control"
            />
          </div>
        </div>
        <div class="col-md-6">
          <div class="mb-3">
            <label class="form-label">Максимальная оценка</label>
            <input 
              v-model="form.max_grade" 
              type="number" 
              class="form-control"
              min="1"
              placeholder="100"
            />
          </div>
        </div>
      </div>

      <div class="row">
        <div class="col-md-6">
          <div class="mb-3">
            <label class="form-label">Тип подачи</label>
            <select v-model="form.submission_type" class="form-select">
              <option value="file">Файл</option>
              <option value="text">Текст</option>
              <option value="both">Файл и текст</option>
            </select>
          </div>
        </div>
        <div class="col-md-6">
          <div class="mb-3">
            <label class="form-label">Максимальный размер файла (MB)</label>
            <input 
              v-model="form.max_file_size_mb" 
              type="number" 
              class="form-control"
              min="1"
              placeholder="10"
            />
          </div>
        </div>
      </div>

      <div class="mb-3">
        <div class="form-check">
          <input 
            v-model="form.allow_late_submissions" 
            class="form-check-input" 
            type="checkbox" 
            id="allowLateSubmissions"
          />
          <label class="form-check-label" for="allowLateSubmissions">
            Разрешить поздние отправки
          </label>
        </div>
      </div>

      <div class="mb-3">
        <div class="form-check">
          <input 
            v-model="form.require_submission_statement" 
            class="form-check-input" 
            type="checkbox" 
            id="requireStatement"
          />
          <label class="form-check-label" for="requireStatement">
            Требовать заявление о самостоятельности
          </label>
        </div>
      </div>
    </form>
  </BaseModal>
</template>

<script setup>
import { ref, computed, watch } from 'vue'
import { ClipboardList } from 'lucide-vue-next'
import BaseModal from '../BaseModal.vue'

const props = defineProps({
  show: Boolean,
  editing: Boolean,
  assignmentData: Object,
  courses: Array,
  themes: Array,
  loading: Boolean
})

const emit = defineEmits(['close', 'save'])

const form = ref({
  title: '',
  description: '',
  course: null,
  theme: null,
  deadline: '',
  max_grade: 100,
  allow_late_submissions: false,
  submission_type: 'file',
  max_file_size_mb: 10,
  require_submission_statement: false
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
    title: '',
    description: '',
    course: null,
    theme: null,
    deadline: '',
    max_grade: 100,
    allow_late_submissions: false,
    submission_type: 'file',
    max_file_size_mb: 10,
    require_submission_statement: false
  }
  validationErrors.value = {}
}

function handleSave() {
  validationErrors.value = {}
  
  const errors = {}
  
  if (!form.value.title?.trim()) {
    errors.title = 'Название задания обязательно'
  }
  
  if (!form.value.course) {
    errors.course = 'Выберите курс'
  }

  if (Object.keys(errors).length > 0) {
    validationErrors.value = errors
    return
  }

  // Подготавливаем данные для отправки
  const assignmentData = {
    title: form.value.title?.trim(),
    description: form.value.description?.trim() || 'Описание задания',
    deadline: form.value.deadline || null,
    max_grade: form.value.max_grade || 100,
    allow_late_submissions: Boolean(form.value.allow_late_submissions),
    submission_type: form.value.submission_type || 'file',
    max_file_size: (form.value.max_file_size_mb || 10) * 1024 * 1024,
    // Привязка к теме через курс и тему
    course: form.value.course,
    theme: form.value.theme
  }

  emit('save', assignmentData, validationErrors)
}

watch(() => props.assignmentData, (newData) => {
  if (newData && Object.keys(newData).length > 0) {
    if (props.editing) {
      form.value = {
        title: newData.title || '',
        description: newData.description || '',
        course: newData.course || null,
        theme: newData.theme || null,
        deadline: newData.deadline ? new Date(newData.deadline).toISOString().slice(0, 16) : '',
        max_grade: newData.max_grade || 100,
        allow_late_submissions: newData.allow_late_submissions || false,
        submission_type: newData.submission_type || 'file',
        max_file_size_mb: newData.max_file_size ? Math.round(newData.max_file_size / (1024 * 1024)) : 10,
        require_submission_statement: newData.require_submission_statement || false
      }
    } else {
      // Для создания нового задания с предустановленными значениями
      form.value = {
        title: '',
        description: '',
        course: newData.course || null,
        theme: newData.theme || null,
        deadline: '',
        max_grade: 100,
        allow_late_submissions: false,
        submission_type: 'file',
        max_file_size_mb: 10,
        require_submission_statement: false
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