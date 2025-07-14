<template>
  <BaseModal
    :show="show"
    :title="editing ? 'Редактировать ресурс' : 'Добавить ресурс'"
    :loading="loading"
    size="lg"
    @close="$emit('close')"
    @confirm="handleSave"
  >
    <template #icon>
      <Upload :size="20" class="text-success" />
    </template>

    <form @submit.prevent="handleSave">
      <div class="mb-3">
        <label class="form-label">Название ресурса *</label>
        <input 
          v-model="form.name" 
          type="text" 
          class="form-control" 
          :class="{ 'is-invalid': validationErrors.name }"
          required
          placeholder="Введите название ресурса"
        />
        <div v-if="validationErrors.name" class="invalid-feedback">
          {{ validationErrors.name }}
        </div>
      </div>
      
      <div class="mb-3">
        <label class="form-label">Описание</label>
        <textarea 
          v-model="form.description" 
          class="form-control" 
          rows="3"
          placeholder="Описание ресурса"
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
              @change="onThemeChange"
              class="form-select"
              :disabled="!form.course"
            >
              <option value="">Выберите тему (необязательно)</option>
              <option v-for="theme in filteredThemes" :key="theme.id" :value="theme.id">
                {{ theme.name }}
              </option>
            </select>
            <div class="form-text">Если тема не выбрана, ресурс будет относиться ко всему курсу</div>
          </div>
        </div>
      </div>

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
        <div class="form-text">Если урок не выбран, ресурс будет относиться к теме</div>
      </div>

      <div class="mb-3">
        <label class="form-label">Файл *</label>
        <input 
          ref="fileInput"
          type="file" 
          class="form-control" 
          :class="{ 'is-invalid': validationErrors.file }"
          @change="onFileSelect"
          :required="!editing"
        />
        <div v-if="validationErrors.file" class="invalid-feedback">
          {{ validationErrors.file }}
        </div>
        <div class="form-text">
          Максимальный размер файла: 50 МБ. Поддерживаемые форматы: PDF, DOC, DOCX, PPT, PPTX, XLS, XLSX, JPG, PNG, MP4, MP3, ZIP
        </div>
      </div>

      <div v-if="selectedFile" class="mb-3">
        <div class="alert alert-info d-flex align-items-center">
          <FileText :size="16" class="me-2" />
          <div>
            <strong>{{ selectedFile.name }}</strong><br>
            <small>{{ formatFileSize(selectedFile.size) }}</small>
          </div>
        </div>
      </div>

      <div class="row">
        <div class="col-md-6">
          <div class="mb-3">
            <label class="form-label">Порядок сортировки</label>
            <input 
              v-model="form.sort_order" 
              type="number" 
              class="form-control"
              min="0"
              placeholder="0"
            />
          </div>
        </div>
        <div class="col-md-6">
          <div class="mb-3 d-flex align-items-end">
            <div class="form-check">
              <input 
                v-model="form.is_visible" 
                class="form-check-input" 
                type="checkbox" 
                id="isVisible"
              />
              <label class="form-check-label" for="isVisible">
                Видимый для студентов
              </label>
            </div>
          </div>
        </div>
      </div>
    </form>
  </BaseModal>
</template>

<script setup>
import { ref, computed, watch } from 'vue'
import { Upload, FileText } from 'lucide-vue-next'
import BaseModal from '../BaseModal.vue'

const props = defineProps({
  show: Boolean,
  editing: Boolean,
  resourceData: Object,
  courses: Array,
  themes: Array,
  lessons: Array,
  loading: Boolean
})

const emit = defineEmits(['close', 'save'])

const form = ref({
  name: '',
  description: '',
  course: null,
  theme: null,
  lesson: null,
  sort_order: 0,
  is_visible: true
})

const validationErrors = ref({})
const selectedFile = ref(null)
const fileInput = ref(null)

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

function onFileSelect(event) {
  const file = event.target.files[0]
  if (file) {
    selectedFile.value = file
    if (!form.value.name) {
      // Автоматически заполняем название из имени файла
      const nameWithoutExtension = file.name.replace(/\.[^/.]+$/, "")
      form.value.name = nameWithoutExtension
    }
  } else {
    selectedFile.value = null
  }
}

function formatFileSize(bytes) {
  if (bytes === 0) return '0 Bytes'
  const k = 1024
  const sizes = ['Bytes', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
}

function resetForm() {
  form.value = {
    name: '',
    description: '',
    course: null,
    theme: null,
    lesson: null,
    sort_order: 0,
    is_visible: true
  }
  selectedFile.value = null
  validationErrors.value = {}
  if (fileInput.value) {
    fileInput.value.value = ''
  }
}

function handleSave() {
  validationErrors.value = {}
  
  const errors = {}
  
  if (!form.value.name?.trim()) {
    errors.name = 'Название ресурса обязательно'
  }
  
  if (!form.value.course) {
    errors.course = 'Выберите курс'
  }

  if (!props.editing && !selectedFile.value) {
    errors.file = 'Выберите файл'
  }

  if (selectedFile.value && selectedFile.value.size > 50 * 1024 * 1024) {
    errors.file = 'Размер файла не должен превышать 50 МБ'
  }

  if (Object.keys(errors).length > 0) {
    validationErrors.value = errors
    return
  }

  // Подготавливаем FormData для отправки файла
  const formData = new FormData()
  
  formData.append('name', form.value.name?.trim())
  formData.append('description', form.value.description?.trim() || '')
  formData.append('sort_order', form.value.sort_order || 0)
  formData.append('is_visible', Boolean(form.value.is_visible))
  
  // Привязка к сущностям
  if (form.value.course) {
    formData.append('subject', form.value.course)
  }
  if (form.value.theme) {
    formData.append('theme', form.value.theme)
  }
  if (form.value.lesson) {
    formData.append('lesson', form.value.lesson)
  }
  
  // Добавляем файл только если он выбран
  if (selectedFile.value) {
    formData.append('file', selectedFile.value)
  }

  emit('save', formData, validationErrors)
}

watch(() => props.resourceData, (newData) => {
  if (newData && Object.keys(newData).length > 0) {
    if (props.editing) {
      form.value = {
        name: newData.name || '',
        description: newData.description || '',
        course: newData.subject?.id || newData.subject || null,
        theme: newData.theme?.id || newData.theme || null,
        lesson: newData.lesson?.id || newData.lesson || null,
        sort_order: newData.sort_order || 0,
        is_visible: newData.is_visible !== undefined ? newData.is_visible : true
      }
    } else {
      // Для создания нового ресурса с предустановленными значениями
      form.value = {
        name: '',
        description: '',
        course: newData.course || null,
        theme: newData.theme || null,
        lesson: newData.lesson || null,
        sort_order: 0,
        is_visible: true
      }
    }
  } else if (!props.editing) {
    resetForm()
  }
}, { immediate: true })

watch(() => props.show, (newShow) => {
  if (!newShow) {
    validationErrors.value = {}
    if (!props.editing) {
      selectedFile.value = null
      if (fileInput.value) {
        fileInput.value.value = ''
      }
    }
  }
})
</script> 