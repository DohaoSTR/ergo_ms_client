<template>
  <BaseModal
    :show="show"
    :title="editing ? 'Редактирование урока' : 'Создание урока'"
    :icon="BookOpen"
    icon-class="text-success"
    size="lg"
    :confirm-text="editing ? 'Сохранить изменения' : 'Создать урок'"
    confirm-variant="success"
    :loading="loading"
    @close="$emit('close')"
    @confirm="handleSave"
  >
    <form @submit.prevent="handleSave">
      <!-- Основная информация -->
      <h6 class="mb-3 border-bottom pb-2">Основная информация</h6>
      
      <div class="mb-3">
        <label class="form-label">Название урока *</label>
        <input 
          ref="nameInput"
          v-model="form.name" 
          type="text" 
          class="form-control" 
          :class="{ 'is-invalid': errors.name }"
          placeholder="Введите название урока"
        />
        <div v-if="errors.name" class="invalid-feedback">
          {{ errors.name }}
        </div>
      </div>

      <div class="mb-3">
        <label class="form-label">Описание</label>
        <textarea 
          v-model="form.description" 
          class="form-control" 
          :class="{ 'is-invalid': errors.description }"
          rows="3"
          placeholder="Описание урока"
        ></textarea>
        <div v-if="errors.description" class="invalid-feedback">
          {{ errors.description }}
        </div>
      </div>

      <!-- Тип урока и содержание -->
      <h6 class="mb-3 border-bottom pb-2 mt-4">Тип урока и содержание</h6>
      
      <div class="mb-3">
        <label class="form-label">Тип урока *</label>
        <select 
          v-model="form.lessontype" 
          class="form-select"
          :class="{ 'is-invalid': errors.lessontype }"
        >
          <option v-for="type in lessonTypes" :key="type.value" :value="type.value">
            {{ type.label }}
          </option>
        </select>
        <div v-if="errors.lessontype" class="invalid-feedback">
          {{ errors.lessontype }}
        </div>
      </div>

      <div class="mb-3">
        <label class="form-label">Контент урока</label>
        <textarea 
          v-model="form.content" 
          class="form-control" 
          :class="{ 'is-invalid': errors.content }"
          rows="6"
          placeholder="Содержание урока (текст, ссылки, HTML)"
        ></textarea>
        <small class="text-muted">Можно использовать HTML теги для форматирования</small>
        <div v-if="errors.content" class="invalid-feedback">
          {{ errors.content }}
        </div>
      </div>

      <!-- Даты доступности -->
      <h6 class="mb-3 border-bottom pb-2 mt-4">Настройки доступности</h6>
      
      <div class="row">
        <div class="col-md-6">
          <div class="mb-3">
            <label class="form-label">Доступен с</label>
            <input 
              v-model="form.availability_start" 
              type="datetime-local" 
              class="form-control" 
              :class="{ 'is-invalid': errors.availability_start }"
            />
            <div v-if="errors.availability_start" class="invalid-feedback">
              {{ errors.availability_start }}
            </div>
          </div>
        </div>
        
        <div class="col-md-6">
          <div class="mb-3">
            <label class="form-label">Доступен до</label>
            <input 
              v-model="form.availability_end" 
              type="datetime-local" 
              class="form-control" 
              :class="{ 'is-invalid': errors.availability_end }"
            />
            <div v-if="errors.availability_end" class="invalid-feedback">
              {{ errors.availability_end }}
            </div>
          </div>
        </div>
      </div>

      <!-- Настройки урока -->
      <h6 class="mb-3 border-bottom pb-2 mt-4">Настройки урока</h6>
      
      <div class="row">
        <div class="col-md-4">
          <div class="form-check mb-3">
            <input 
              v-model="form.is_visible" 
              class="form-check-input" 
              type="checkbox" 
              id="lessonVisible"
            />
            <label class="form-check-label" for="lessonVisible">
              Видимый урок
            </label>
            <small class="d-block text-muted">Урок будет отображаться студентам</small>
          </div>
        </div>
        
        <div class="col-md-4">
          <div class="form-check mb-3">
            <input 
              v-model="form.completion_required" 
              class="form-check-input" 
              type="checkbox" 
              id="lessonRequired"
            />
            <label class="form-check-label" for="lessonRequired">
              Обязательный урок
            </label>
            <small class="d-block text-muted">Требуется для завершения курса</small>
          </div>
        </div>
      </div>

      <!-- Курс и тема -->
      <h6 class="mb-3 border-bottom pb-2 mt-4">Привязка к курсу</h6>
      
      <div class="row">
        <div class="col-md-6">
          <div class="mb-3">
            <label class="form-label">Курс *</label>
            <select 
              v-model="form.course" 
              class="form-select"
              :class="{ 'is-invalid': errors.course }"
              @change="onCourseChange"
            >
              <option value="">Выберите курс</option>
              <option v-for="course in courses" :key="course.id" :value="course.id">
                {{ course.name }}
              </option>
            </select>
            <div v-if="errors.course" class="invalid-feedback">
              {{ errors.course }}
            </div>
          </div>
        </div>
        
        <div class="col-md-6">
          <div class="mb-3">
            <label class="form-label">Тема *</label>
            <select 
              v-model="form.theme" 
              class="form-select"
              :class="{ 'is-invalid': errors.theme }"
              :disabled="!form.course"
            >
              <option value="">Выберите тему</option>
              <option v-for="theme in availableThemes" :key="theme.id" :value="theme.id">
                {{ theme.name }}
              </option>
            </select>
            <div v-if="errors.theme" class="invalid-feedback">
              {{ errors.theme }}
            </div>
          </div>
        </div>
      </div>
    </form>
  </BaseModal>
</template>

<script setup>
import { ref, watch, computed } from 'vue'
import { BookOpen } from 'lucide-vue-next'
import BaseModal from '../BaseModal.vue'
import { showError } from '@/js/utils/notifications'

const props = defineProps({
  show: Boolean,
  editing: Boolean,
  lessonData: Object,
  courses: Array,
  themes: Array,
  loading: Boolean
})

const emit = defineEmits(['close', 'save'])

const lessonTypes = [
  { value: 'L', label: 'Лекция' },
  { value: 'V', label: 'Видео' },
  { value: 'URL', label: 'Ссылка' },
  { value: 'F', label: 'Форум' },
  { value: 'A', label: 'Задание' },
  { value: 'Q', label: 'Тест' },
  { value: 'C', label: 'Конференция' },
  { value: 'FILE', label: 'Файл' }
]

const form = ref({
  name: '',
  description: '',
  lessontype: 'L',
  course: null,
  theme: null,
  is_visible: true,
  completion_required: false,
  availability_start: '',
  availability_end: '',
  content: ''
})

const errors = ref({})
const nameInput = ref(null)

const availableThemes = computed(() => {
  if (!form.value.course) return []
  return props.themes.filter(theme => {
    let themeCourseId = theme.subject
    if (typeof themeCourseId === 'object' && themeCourseId?.id) {
      themeCourseId = themeCourseId.id
    }
    return parseInt(themeCourseId) === parseInt(form.value.course)
  })
})

watch(() => props.show, (newVal) => {
  if (newVal) {
    resetForm()
    if (props.editing && props.lessonData) {
      fillForm(props.lessonData)
    } else if (!props.editing && props.lessonData) {
      // При создании нового урока с предзаполненными данными
      console.log('📝 Предзаполнение формы создания урока:', props.lessonData)
      fillFormForCreation(props.lessonData)
    }
    
    // Фокусируемся на поле названия после небольшой задержки
    setTimeout(() => {
      if (nameInput.value) {
        nameInput.value.focus()
      }
    }, 300)
  }
})

function resetForm() {
  form.value = {
    name: '',
    description: '',
    lessontype: 'L',
    course: null,
    theme: null,
    is_visible: true,
    completion_required: false,
    availability_start: '',
    availability_end: '',
    content: ''
  }
  errors.value = {}
}

function fillForm(data) {
  // Получаем курс из темы урока
  const theme = props.themes.find(t => parseInt(t.id) === parseInt(data.theme?.id || data.theme))
  let courseId = null
  if (theme) {
    courseId = theme.subject?.id || theme.subject
  }
  
  form.value = {
    name: data.name || '',
    description: data.description || '',
    lessontype: data.lessontype || 'L',
    course: courseId,
    theme: data.theme?.id || data.theme,
    is_visible: data.is_visible !== undefined ? data.is_visible : true,
    completion_required: data.completion_required || false,
    availability_start: data.availability_start ? new Date(data.availability_start).toISOString().slice(0, 16) : '',
    availability_end: data.availability_end ? new Date(data.availability_end).toISOString().slice(0, 16) : '',
    content: data.content || ''
  }
}

function fillFormForCreation(data) {
  // Заполняем форму для создания нового урока с предзаполненными данными
  console.log('🔄 Предзаполнение данных для создания урока:', data)
  
  form.value = {
    name: data.name || '',
    description: data.description || '',
    lessontype: data.lessontype || 'L',
    course: data.course || null,
    theme: data.theme || null,
    is_visible: data.is_visible !== undefined ? data.is_visible : true,
    completion_required: data.completion_required || false,
    availability_start: data.availability_start || '',
    availability_end: data.availability_end || '',
    content: data.content || ''
  }
  
  console.log('✅ Форма предзаполнена:', form.value)
}

function onCourseChange() {
  // Сбрасываем выбранную тему при изменении курса
  form.value.theme = null
}

function validate() {
  const newErrors = {}
  
  if (!form.value.name || !form.value.name.trim()) {
    newErrors.name = 'Название урока обязательно'
  } else if (form.value.name.trim().length < 3) {
    newErrors.name = 'Название урока должно содержать минимум 3 символа'
  }
  
  if (!form.value.lessontype) {
    newErrors.lessontype = 'Выберите тип урока'
  }
  
  if (!form.value.course) {
    newErrors.course = 'Выберите курс'
  }
  
  if (!form.value.theme) {
    newErrors.theme = 'Выберите тему'
  }

  // Валидация дат доступности
  if (form.value.availability_start && form.value.availability_end) {
    const startDate = new Date(form.value.availability_start)
    const endDate = new Date(form.value.availability_end)
    
    if (startDate >= endDate) {
      newErrors.availability_start = 'Дата начала должна быть раньше даты окончания'
      newErrors.availability_end = 'Дата окончания должна быть позже даты начала'
    }
  }

  errors.value = newErrors
  return Object.keys(newErrors).length === 0
}

function handleSave() {
  if (!validate()) {
    showError('Пожалуйста, исправьте ошибки в форме')
    return
  }

  const data = {
    name: form.value.name.trim(),
    description: form.value.description?.trim() || '',
    lessontype: form.value.lessontype,
    theme: parseInt(form.value.theme),
    is_visible: Boolean(form.value.is_visible),
    completion_required: Boolean(form.value.completion_required),
    availability_start: form.value.availability_start || null,
    availability_end: form.value.availability_end || null,
    content: form.value.content || ''
  }

  // Удаляем пустые поля
  Object.keys(data).forEach(key => {
    if (data[key] === null || data[key] === '' || data[key] === undefined) {
      delete data[key]
    }
  })

  emit('save', data, errors)
}
</script> 