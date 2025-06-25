<template>
  <BaseModal
    :show="show"
    :title="editing ? 'Редактирование курса' : 'Создание нового курса'"
    :icon="BookOpen"
    icon-class="text-primary"
    size="xl"
    :confirm-text="editing ? 'Сохранить изменения' : 'Создать курс'"
    :loading="loading"
    @close="$emit('close')"
    @confirm="handleSave"
  >
    <form @submit.prevent="handleSave">
      <div class="row">
        <div class="col-md-8">
          <div class="mb-3">
            <label class="form-label">Название курса *</label>
            <input
              v-model="form.name"
              type="text"
              class="form-control"
              :class="{ 'is-invalid': errors.name }"
              placeholder="Введите название курса (минимум 3 символа)"
              maxlength="100"
            />
            <div v-if="errors.name" class="invalid-feedback">
              {{ errors.name }}
            </div>
            <div class="form-text">От 3 до 100 символов</div>
          </div>
        </div>
        <div class="col-md-4">
          <div class="mb-3">
            <label class="form-label">Категория *</label>
            <select
              v-model="form.category"
              class="form-select"
              :class="{ 'is-invalid': errors.category }"
            >
              <option value="">Выберите категорию</option>
              <option v-for="category in categories" :key="category.id" :value="category.id">
                {{ category.name }}
              </option>
            </select>
            <div v-if="errors.category" class="invalid-feedback">
              {{ errors.category }}
            </div>
          </div>
        </div>
      </div>

      <div class="mb-3">
        <label class="form-label">Краткое описание</label>
        <textarea
          v-model="form.summary"
          class="form-control"
          :class="{ 'is-invalid': errors.summary }"
          rows="2"
          placeholder="Краткое описание курса"
          maxlength="500"
        ></textarea>
        <div v-if="errors.summary" class="invalid-feedback">
          {{ errors.summary }}
        </div>
        <div class="form-text">Максимум 500 символов</div>
      </div>

      <div class="mb-3">
        <label class="form-label">Полное описание *</label>
        <textarea
          v-model="form.description"
          class="form-control"
          :class="{ 'is-invalid': errors.description }"
          rows="4"
          placeholder="Подробное описание курса (минимум 10 символов)"
        ></textarea>
        <div v-if="errors.description" class="invalid-feedback">
          {{ errors.description }}
        </div>
        <div class="form-text">Минимум 10 символов</div>
      </div>

      <div class="row">
        <div class="col-md-6">
          <div class="mb-3">
            <label class="form-label">Формат курса *</label>
            <select
              v-model="form.course_format"
              class="form-select"
              :class="{ 'is-invalid': errors.course_format }"
            >
              <option value="">Выберите формат</option>
              <option v-for="format in courseFormats" :key="format.id" :value="format.id">
                {{ format.name }}
              </option>
            </select>
            <div v-if="errors.course_format" class="invalid-feedback">
              {{ errors.course_format }}
            </div>
          </div>
        </div>
        <div class="col-md-6">
          <div class="mb-3">
            <label class="form-label">Максимальное количество студентов</label>
            <input
              v-model="form.max_enrollment"
              type="number"
              class="form-control"
              :class="{ 'is-invalid': errors.max_enrollment }"
              placeholder="Без ограничений"
              min="0"
            />
            <div v-if="errors.max_enrollment" class="invalid-feedback">
              {{ errors.max_enrollment }}
            </div>
          </div>
        </div>
      </div>

      <div class="row">
        <div class="col-md-6">
          <div class="mb-3">
            <label class="form-label">Дата начала</label>
            <input
              v-model="form.start_date"
              type="date"
              class="form-control"
              :class="{ 'is-invalid': errors.start_date }"
            />
            <div v-if="errors.start_date" class="invalid-feedback">
              {{ errors.start_date }}
            </div>
            <div class="form-text">Если указываете дату начала, обязательно укажите дату окончания</div>
          </div>
        </div>
        <div class="col-md-6">
          <div class="mb-3">
            <label class="form-label">Дата окончания</label>
            <input
              v-model="form.end_date"
              type="date"
              class="form-control"
              :class="{ 'is-invalid': errors.end_date }"
            />
            <div v-if="errors.end_date" class="invalid-feedback">
              {{ errors.end_date }}
            </div>
          </div>
        </div>
      </div>

      <div class="row mb-3">
        <div class="col-md-6">
          <div class="form-check">
            <input
              v-model="form.is_self_enrollment"
              class="form-check-input"
              type="checkbox"
              id="isSelfEnrollment"
            />
            <label class="form-check-label" for="isSelfEnrollment">
              Разрешить самостоятельную запись
            </label>
          </div>
        </div>
        <div class="col-md-6">
          <div class="form-check">
            <input
              v-model="form.completion_tracking"
              class="form-check-input"
              type="checkbox"
              id="completionTracking"
            />
            <label class="form-check-label" for="completionTracking">
              Отслеживать выполнение
            </label>
          </div>
        </div>
      </div>

      <div class="row mb-3">
        <div class="col-md-6">
          <div class="form-check">
            <input
              v-model="form.is_published"
              class="form-check-input"
              type="checkbox"
              id="isPublished"
            />
            <label class="form-check-label" for="isPublished">
              Опубликовать курс
            </label>
          </div>
        </div>
        <div class="col-md-6">
          <div class="form-check">
            <input
              v-model="form.guest_access"
              class="form-check-input"
              type="checkbox"
              id="guestAccess"
            />
            <label class="form-check-label" for="guestAccess">
              Гостевой доступ
            </label>
          </div>
        </div>
      </div>

      <div class="mb-3">
        <label class="form-label">Ключ записи на курс</label>
        <input
          v-model="form.enrollment_key"
          type="text"
          class="form-control"
          :class="{ 'is-invalid': errors.enrollment_key }"
          placeholder="Оставьте пустым, если ключ не требуется"
        />
        <div v-if="errors.enrollment_key" class="invalid-feedback">
          {{ errors.enrollment_key }}
        </div>
      </div>

      <div class="mb-3">
        <label class="form-label">Изображение курса</label>
        <input
          type="file"
          class="form-control"
          :class="{ 'is-invalid': errors.image }"
          @change="onImageChange"
          accept="image/*"
          ref="imageInput"
        />
        <div v-if="errors.image" class="invalid-feedback">
          {{ errors.image }}
        </div>
        <div class="form-text">Максимальный размер файла: 5MB. Поддерживаемые форматы: JPG, PNG, GIF</div>
        
        <!-- Предпросмотр изображения -->
        <div v-if="imagePreview || (props.editing && props.courseData?.course_image && !form.remove_image)" class="mt-2">
          <div class="d-flex align-items-center gap-3">
            <img 
              :src="imagePreview || props.courseData?.course_image" 
              alt="Изображение курса" 
              class="rounded"
              style="width: 80px; height: 80px; object-fit: cover;"
            />
            <button 
              type="button" 
              class="btn btn-sm btn-outline-danger"
              @click="removeImage"
            >
              Удалить изображение
            </button>
          </div>
        </div>
        
        <!-- Сообщение об удалении изображения -->
        <div v-if="props.editing && form.remove_image" class="mt-2">
          <div class="alert alert-warning d-flex align-items-center gap-2">
            <span>Изображение будет удалено при сохранении курса.</span>
            <button 
              type="button" 
              class="btn btn-sm btn-outline-secondary"
              @click="undoRemoveImage"
            >
              Отменить удаление
            </button>
          </div>
        </div>
      </div>
    </form>
  </BaseModal>
</template>

<script setup>
import { ref, watch } from 'vue'
import { BookOpen } from 'lucide-vue-next'
import BaseModal from '../BaseModal.vue'
import { showError } from '@/js/utils/notifications'

const props = defineProps({
  show: {
    type: Boolean,
    default: false
  },
  editing: {
    type: Boolean,
    default: false
  },
  courseData: {
    type: Object,
    default: () => ({})
  },
  categories: {
    type: Array,
    default: () => []
  },
  courseFormats: {
    type: Array,
    default: () => []
  },
  loading: {
    type: Boolean,
    default: false
  }
})

const emit = defineEmits(['close', 'save'])

const form = ref({
  name: '',
  description: '',
  summary: '',
  category: null,
  course_format: null,
  start_date: '',
  end_date: '',
  enrollment_key: '',
  max_enrollment: null,
  is_self_enrollment: true,
  is_published: false,
  completion_tracking: false,
  guest_access: false,
  image: null,
  remove_image: false
})

const errors = ref({})
const imagePreview = ref(null)
const imageInput = ref(null)

// Сброс формы при изменении props
watch(() => props.show, (newVal) => {
  if (newVal) {
    resetForm()
    if (props.editing && props.courseData) {
      fillForm(props.courseData)
    }
  }
})

function resetForm() {
  form.value = {
    name: '',
    description: '',
    summary: '',
    category: null,
    course_format: null,
    start_date: '',
    end_date: '',
    enrollment_key: '',
    max_enrollment: null,
    is_self_enrollment: true,
    is_published: false,
    completion_tracking: false,
    guest_access: false,
    image: null,
    remove_image: false
  }
  errors.value = {}
  imagePreview.value = null
  if (imageInput.value) {
    imageInput.value.value = ''
  }
}

function fillForm(data) {
  form.value = {
    name: data.name || '',
    description: data.description || '',
    summary: data.summary || '',
    category: data.category?.id || data.category || null,
    course_format: data.course_format?.id || data.course_format || null,
    start_date: data.start_date ? data.start_date.split('T')[0] : '',
    end_date: data.end_date ? data.end_date.split('T')[0] : '',
    enrollment_key: data.enrollment_key || '',
    max_enrollment: data.max_enrollment || null,
    is_self_enrollment: data.is_self_enrollment !== undefined ? data.is_self_enrollment : true,
    is_published: data.is_published !== undefined ? data.is_published : false,
    completion_tracking: data.completion_tracking !== undefined ? data.completion_tracking : false,
    guest_access: data.guest_access !== undefined ? data.guest_access : false,
    image: null,
    remove_image: false
  }
}

function validate() {
  const newErrors = {}
  
  if (!form.value.name || !form.value.name.trim()) {
    newErrors.name = 'Название курса обязательно'
  } else if (form.value.name.trim().length < 3) {
    newErrors.name = 'Название курса должно содержать минимум 3 символа'
  } else if (form.value.name.trim().length > 100) {
    newErrors.name = 'Название курса не должно превышать 100 символов'
  }

  if (!form.value.description || !form.value.description.trim()) {
    newErrors.description = 'Описание курса обязательно для заполнения'
  } else if (form.value.description.trim().length < 10) {
    newErrors.description = 'Описание курса должно содержать минимум 10 символов'
  }

  if (!form.value.category) {
    newErrors.category = 'Выберите категорию'
  }

  if (!form.value.course_format) {
    newErrors.course_format = 'Выберите формат курса'
  }

  // Валидация дат
  const startDate = form.value.start_date
  const endDate = form.value.end_date
  
  if (startDate && !endDate) {
    newErrors.end_date = 'Укажите дату окончания курса'
  } else if (endDate && !startDate) {
    newErrors.start_date = 'Укажите дату начала курса'
  } else if (startDate && endDate) {
    const startDateTime = new Date(startDate)
    const endDateTime = new Date(endDate)
    
    if (startDateTime >= endDateTime) {
      newErrors.start_date = 'Дата начала должна быть раньше даты окончания'
      newErrors.end_date = 'Дата окончания должна быть позже даты начала'
    }
  }

  if (form.value.enrollment_key && form.value.enrollment_key.length > 50) {
    newErrors.enrollment_key = 'Ключ записи не должен превышать 50 символов'
  }

  if (form.value.max_enrollment !== null && form.value.max_enrollment < 1) {
    newErrors.max_enrollment = 'Максимум студентов должен быть больше 0'
  }

  if (form.value.summary && form.value.summary.length > 500) {
    newErrors.summary = 'Краткое описание не должно превышать 500 символов'
  }

  errors.value = newErrors
  return Object.keys(newErrors).length === 0
}

function handleSave() {
  if (!validate()) {
    showError('Пожалуйста, исправьте ошибки в форме')
    return
  }

  const formData = new FormData()
  formData.append('name', form.value.name.trim())
  formData.append('description', form.value.description.trim())
  formData.append('summary', form.value.summary?.trim() || '')
  formData.append('category', form.value.category)
  formData.append('course_format', form.value.course_format)
  formData.append('is_self_enrollment', form.value.is_self_enrollment)
  formData.append('is_published', form.value.is_published)
  formData.append('completion_tracking', form.value.completion_tracking)
  formData.append('guest_access', form.value.guest_access)

  if (form.value.start_date) {
    formData.append('start_date', form.value.start_date)
  }
  if (form.value.end_date) {
    formData.append('end_date', form.value.end_date)
  }
  if (form.value.enrollment_key) {
    formData.append('enrollment_key', form.value.enrollment_key)
  }
  if (form.value.max_enrollment) {
    formData.append('max_enrollment', form.value.max_enrollment)
  }
  if (form.value.image) {
    formData.append('course_image', form.value.image)
  }
  
  if (form.value.remove_image) {
    formData.append('remove_image', 'true')
  }

  emit('save', formData, errors)
}

function onImageChange(event) {
  const file = event.target.files[0]
  if (file) {
    // Проверка размера файла
    if (file.size > 5 * 1024 * 1024) { // 5MB
      showError('Размер файла не должен превышать 5MB')
      event.target.value = ''
      return
    }
    
    // Проверка типа файла
    const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp']
    if (!allowedTypes.includes(file.type)) {
      showError('Поддерживаются только изображения форматов JPG, PNG, GIF, WebP')
      event.target.value = ''
      return
    }
    
    form.value.image = file
    
    // Создание предпросмотра
    const reader = new FileReader()
    reader.onload = (e) => {
      imagePreview.value = e.target.result
    }
    reader.readAsDataURL(file)
  }
}

function removeImage() {
  form.value.image = null
  imagePreview.value = null
  if (imageInput.value) {
    imageInput.value.value = ''
  }
  
  // Если мы редактируем курс и хотим удалить существующее изображение
  if (props.editing && props.courseData?.course_image) {
    // Отмечаем, что изображение нужно удалить
    form.value.remove_image = true
  }
}

function undoRemoveImage() {
  form.value.remove_image = false
}
</script> 