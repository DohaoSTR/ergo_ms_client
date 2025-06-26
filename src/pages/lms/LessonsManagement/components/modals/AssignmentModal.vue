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
            <div class="form-text">Если тема не выбрана, задание будет относиться ко всему курсу</div>
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
            <div class="form-text">Если урок не выбран, задание будет относиться к теме</div>
          </div>
        </div>
      </div>

      <div class="row">
        <div class="col-md-6">
          <div class="mb-3">
            <label class="form-label">Крайний срок *</label>
            <input 
              v-model="form.deadline" 
              type="date" 
              class="form-control"
              :class="{ 'is-invalid': validationErrors.deadline }"
              required
            />
            <div v-if="validationErrors.deadline" class="invalid-feedback">
              {{ validationErrors.deadline }}
            </div>
          </div>
        </div>
        <div class="col-md-6">
          <div class="mb-3">
            <label class="form-label">Максимальная оценка *</label>
            <input 
              v-model="form.max_grade" 
              type="number" 
              class="form-control"
              :class="{ 'is-invalid': validationErrors.max_grade }"
              min="1"
              required
              placeholder="100"
            />
            <div v-if="validationErrors.max_grade" class="invalid-feedback">
              {{ validationErrors.max_grade }}
            </div>
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
  lessons: Array,
  loading: Boolean
})

const emit = defineEmits(['close', 'save'])

const form = ref({
  title: '',
  description: '',
  course: null,
  theme: null,
  lesson: null,
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

function resetForm() {
  form.value = {
    title: '',
    description: '',
    course: null,
    theme: null,
    lesson: null,
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
  
  if (!form.value.deadline?.trim()) {
    errors.deadline = 'Крайний срок обязателен'
  }
  
  if (!form.value.max_grade || form.value.max_grade < 1) {
    errors.max_grade = 'Максимальная оценка должна быть больше 0'
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
    // Привязка к сущностям (используем правильные имена полей из API)
    subject: form.value.course || null,
    theme: form.value.theme || null,
    lesson: form.value.lesson || null
  }

  emit('save', assignmentData, validationErrors)
}

watch(() => props.assignmentData, (newData) => {
  if (newData && Object.keys(newData).length > 0) {
    if (props.editing) {
      form.value = {
        title: newData.title || '',
        description: newData.description || '',
        course: newData.subject?.id || newData.course || null,
        theme: newData.theme?.id || newData.theme || null,
        lesson: newData.lesson?.id || newData.lesson || null,
        deadline: newData.deadline ? new Date(newData.deadline).toISOString().slice(0, 10) : '',
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
        lesson: newData.lesson || null,
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