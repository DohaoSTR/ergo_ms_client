<template>
  <div 
    class="modal fade" 
    :id="modalId" 
    tabindex="-1" 
    role="dialog" 
    aria-labelledby="resourceModalLabel" 
    aria-hidden="true"
  >
    <div class="modal-dialog modal-lg" role="document">
      <div class="modal-content">
        <div class="modal-header">
          <h5 class="modal-title" id="resourceModalLabel">
            {{ isEdit ? 'Редактировать ресурс' : 'Добавить ресурс' }}
          </h5>
          <button 
            type="button" 
            class="btn-close" 
            data-bs-dismiss="modal" 
            aria-label="Close"
            @click="closeModal"
          ></button>
        </div>
        <div class="modal-body">
          <form @submit.prevent="handleSubmit">
            <!-- Название ресурса -->
            <div class="mb-3">
              <label for="resourceName" class="form-label">
                Название ресурса <span class="text-danger">*</span>
              </label>
              <input 
                type="text" 
                class="form-control" 
                id="resourceName"
                v-model="formData.name"
                :class="{ 'is-invalid': errors.name }"
                placeholder="Введите название ресурса"
                required
              >
              <div v-if="errors.name" class="invalid-feedback">
                {{ errors.name }}
              </div>
            </div>

            <!-- Описание -->
            <div class="mb-3">
              <label for="resourceDescription" class="form-label">Описание</label>
              <textarea 
                class="form-control" 
                id="resourceDescription"
                v-model="formData.description"
                :class="{ 'is-invalid': errors.description }"
                placeholder="Описание ресурса (необязательно)"
                rows="3"
              ></textarea>
              <div v-if="errors.description" class="invalid-feedback">
                {{ errors.description }}
              </div>
            </div>

            <!-- Файл -->
            <div class="mb-3">
              <label for="resourceFile" class="form-label">
                Файл {{ isEdit ? '' : '<span class="text-danger">*</span>' }}
              </label>
              <input 
                type="file" 
                class="form-control" 
                id="resourceFile"
                @change="handleFileChange"
                :class="{ 'is-invalid': errors.file }"
                :required="!isEdit"
                accept=".pdf,.doc,.docx,.ppt,.pptx,.xls,.xlsx,.zip,.rar,.txt,.jpg,.jpeg,.png,.gif,.mp4,.avi,.mov"
              >
              <div v-if="errors.file" class="invalid-feedback">
                {{ errors.file }}
              </div>
              <div class="form-text">
                Поддерживаемые форматы: PDF, DOC, DOCX, PPT, PPTX, XLS, XLSX, ZIP, RAR, TXT, JPG, PNG, GIF, MP4, AVI, MOV. 
                Максимальный размер: 100 МБ
              </div>
              <div v-if="isEdit && resourceData?.file" class="mt-2">
                <small class="text-muted">
                  Текущий файл: {{ resourceData.name }}
                  <span v-if="resourceData.file_size_formatted"> ({{ resourceData.file_size_formatted }})</span>
                </small>
              </div>
            </div>

            <!-- Контекст размещения -->
            <div class="mb-3">
              <h6>Где разместить ресурс?</h6>
              
              <!-- Курс -->
              <div class="form-check">
                <input 
                  class="form-check-input" 
                  type="radio" 
                  name="context" 
                  id="contextCourse"
                  value="course"
                  v-model="contextType"
                  @change="updateContext"
                >
                <label class="form-check-label" for="contextCourse">
                  В курсе (общий ресурс курса)
                </label>
              </div>

              <!-- Тема -->
              <div class="form-check">
                <input 
                  class="form-check-input" 
                  type="radio" 
                  name="context" 
                  id="contextTheme"
                  value="theme"
                  v-model="contextType"
                  @change="updateContext"
                >
                <label class="form-check-label" for="contextTheme">
                  В теме (ресурс для конкретной темы)
                </label>
              </div>

              <!-- Урок -->
              <div class="form-check">
                <input 
                  class="form-check-input" 
                  type="radio" 
                  name="context" 
                  id="contextLesson"
                  value="lesson"
                  v-model="contextType"
                  @change="updateContext"
                >
                <label class="form-check-label" for="contextLesson">
                  В уроке (ресурс для конкретного урока)
                </label>
              </div>
            </div>

            <!-- Выбор курса -->
            <div v-if="contextType" class="mb-3">
              <label for="subjectSelect" class="form-label">
                Курс <span class="text-danger">*</span>
              </label>
              <select 
                class="form-select" 
                id="subjectSelect"
                v-model="formData.subject"
                :class="{ 'is-invalid': errors.subject }"
                @change="onSubjectChange"
                required
              >
                <option value="">Выберите курс</option>
                <option 
                  v-for="subject in availableSubjects" 
                  :key="subject.id" 
                  :value="subject.id"
                >
                  {{ subject.name }}
                </option>
              </select>
              <div v-if="errors.subject" class="invalid-feedback">
                {{ errors.subject }}
              </div>
            </div>

            <!-- Выбор темы -->
            <div v-if="contextType === 'theme' || contextType === 'lesson'" class="mb-3">
              <label for="themeSelect" class="form-label">
                Тема <span class="text-danger">*</span>
              </label>
              <select 
                class="form-select" 
                id="themeSelect"
                v-model="formData.theme"
                :class="{ 'is-invalid': errors.theme }"
                @change="onThemeChange"
                :disabled="!formData.subject"
                required
              >
                <option value="">Выберите тему</option>
                <option 
                  v-for="theme in availableThemes" 
                  :key="theme.id" 
                  :value="theme.id"
                >
                  {{ theme.name }}
                </option>
              </select>
              <div v-if="errors.theme" class="invalid-feedback">
                {{ errors.theme }}
              </div>
            </div>

            <!-- Выбор урока -->
            <div v-if="contextType === 'lesson'" class="mb-3">
              <label for="lessonSelect" class="form-label">
                Урок <span class="text-danger">*</span>
              </label>
              <select 
                class="form-select" 
                id="lessonSelect"
                v-model="formData.lesson"
                :class="{ 'is-invalid': errors.lesson }"
                :disabled="!formData.theme"
                required
              >
                <option value="">Выберите урок</option>
                <option 
                  v-for="lesson in availableLessons" 
                  :key="lesson.id" 
                  :value="lesson.id"
                >
                  {{ lesson.name }}
                </option>
              </select>
              <div v-if="errors.lesson" class="invalid-feedback">
                {{ errors.lesson }}
              </div>
            </div>

            <!-- Порядок сортировки -->
            <div class="mb-3">
              <label for="sortOrder" class="form-label">Порядок сортировки</label>
              <input 
                type="number" 
                class="form-control" 
                id="sortOrder"
                v-model.number="formData.sort_order"
                :class="{ 'is-invalid': errors.sort_order }"
                placeholder="Автоматически"
                min="0"
              >
              <div v-if="errors.sort_order" class="invalid-feedback">
                {{ errors.sort_order }}
              </div>
              <div class="form-text">
                Оставьте пустым для автоматического назначения
              </div>
            </div>

            <!-- Видимость -->
            <div class="mb-3">
              <div class="form-check">
                <input 
                  class="form-check-input" 
                  type="checkbox" 
                  id="isVisible"
                  v-model="formData.is_visible"
                >
                <label class="form-check-label" for="isVisible">
                  Ресурс видим студентам
                </label>
              </div>
            </div>
          </form>
        </div>
        <div class="modal-footer">
          <button 
            type="button" 
            class="btn btn-secondary" 
            data-bs-dismiss="modal"
            @click="closeModal"
          >
            Отмена
          </button>
          <button 
            type="button" 
            class="btn btn-primary" 
            @click="handleSubmit"
            :disabled="isLoading"
          >
            <span v-if="isLoading" class="spinner-border spinner-border-sm me-2" role="status"></span>
            {{ isEdit ? 'Сохранить' : 'Создать ресурс' }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { ref, reactive, computed, watch, onMounted } from 'vue'
import { apiManager } from '@/js/api/manager.js'
import { handleApiError } from '@/js/utils/errorHandling.js'

export default {
  name: 'ResourceModal',
  emits: ['resourceCreated', 'resourceUpdated', 'close'],
  props: {
    modalId: {
      type: String,
      default: 'resourceModal'
    },
    resourceData: {
      type: Object,
      default: null
    },
    subjectId: {
      type: [String, Number],
      default: null
    },
    themeId: {
      type: [String, Number],
      default: null
    },
    lessonId: {
      type: [String, Number],
      default: null
    }
  },
  setup(props, { emit }) {
    const isLoading = ref(false)
    const selectedFile = ref(null)
    const contextType = ref('course')
    
    const availableSubjects = ref([])
    const availableThemes = ref([])
    const availableLessons = ref([])
    
    const formData = reactive({
      name: '',
      description: '',
      subject: null,
      theme: null,
      lesson: null,
      sort_order: null,
      is_visible: true
    })
    
    const errors = reactive({})
    
    const isEdit = computed(() => !!props.resourceData)
    
    // Инициализация формы
    const initializeForm = () => {
      if (props.resourceData) {
        // Режим редактирования
        Object.assign(formData, {
          name: props.resourceData.name || '',
          description: props.resourceData.description || '',
          subject: props.resourceData.subject?.id || null,
          theme: props.resourceData.theme?.id || null,
          lesson: props.resourceData.lesson?.id || null,
          sort_order: props.resourceData.sort_order || null,
          is_visible: props.resourceData.is_visible !== false
        })
        
        // Определяем контекст
        if (props.resourceData.lesson) {
          contextType.value = 'lesson'
        } else if (props.resourceData.theme) {
          contextType.value = 'theme'
        } else {
          contextType.value = 'course'
        }
      } else {
        // Режим создания
        if (props.lessonId) {
          contextType.value = 'lesson'
          formData.lesson = Number(props.lessonId)
        } else if (props.themeId) {
          contextType.value = 'theme'
          formData.theme = Number(props.themeId)
        } else if (props.subjectId) {
          contextType.value = 'course'
          formData.subject = Number(props.subjectId)
        }
      }
    }
    
    // Загрузка доступных курсов
    const loadSubjects = async () => {
      try {
        const response = await apiManager.get('lms.subjects')
        if (response.success) {
          availableSubjects.value = response.data.results || response.data
        }
      } catch (error) {
        console.error('Ошибка загрузки курсов:', error)
      }
    }
    
    // Загрузка тем для выбранного курса
    const loadThemes = async (subjectId) => {
      if (!subjectId) {
        availableThemes.value = []
        return
      }
      
      try {
        const response = await apiManager.get('lms.themes', { subject: subjectId })
        if (response.success) {
          availableThemes.value = response.data.results || response.data
        }
      } catch (error) {
        console.error('Ошибка загрузки тем:', error)
        availableThemes.value = []
      }
    }
    
    // Загрузка уроков для выбранной темы
    const loadLessons = async (themeId) => {
      if (!themeId) {
        availableLessons.value = []
        return
      }
      
      try {
        const response = await apiManager.get('lms.lessons', { theme: themeId })
        if (response.success) {
          availableLessons.value = response.data.results || response.data
        }
      } catch (error) {
        console.error('Ошибка загрузки уроков:', error)
        availableLessons.value = []
      }
    }
    
    // Обработка изменения типа контекста
    const updateContext = () => {
      // Сбрасываем поля в зависимости от выбранного контекста
      if (contextType.value === 'course') {
        formData.theme = null
        formData.lesson = null
      } else if (contextType.value === 'theme') {
        formData.lesson = null
      }
    }
    
    // Обработка изменения курса
    const onSubjectChange = () => {
      formData.theme = null
      formData.lesson = null
      availableThemes.value = []
      availableLessons.value = []
      
      if (formData.subject) {
        loadThemes(formData.subject)
      }
    }
    
    // Обработка изменения темы
    const onThemeChange = () => {
      formData.lesson = null
      availableLessons.value = []
      
      if (formData.theme) {
        loadLessons(formData.theme)
      }
    }
    
    // Обработка выбора файла
    const handleFileChange = (event) => {
      const file = event.target.files[0]
      selectedFile.value = file
      
      // Валидация файла
      if (file) {
        const maxSize = 100 * 1024 * 1024 // 100 МБ
        if (file.size > maxSize) {
          errors.file = 'Размер файла превышает 100 МБ'
          selectedFile.value = null
          event.target.value = ''
        } else {
          delete errors.file
        }
      }
    }
    
    // Валидация формы
    const validateForm = () => {
      const newErrors = {}
      
      if (!formData.name?.trim()) {
        newErrors.name = 'Название ресурса обязательно'
      }
      
      if (!isEdit.value && !selectedFile.value) {
        newErrors.file = 'Файл обязателен'
      }
      
      if (!formData.subject) {
        newErrors.subject = 'Курс обязателен'
      }
      
      if (contextType.value === 'theme' || contextType.value === 'lesson') {
        if (!formData.theme) {
          newErrors.theme = 'Тема обязательна'
        }
      }
      
      if (contextType.value === 'lesson') {
        if (!formData.lesson) {
          newErrors.lesson = 'Урок обязателен'
        }
      }
      
      Object.assign(errors, newErrors)
      return Object.keys(newErrors).length === 0
    }
    
    // Отправка формы
    const handleSubmit = async () => {
      // Очищаем предыдущие ошибки
      Object.keys(errors).forEach(key => delete errors[key])
      
      if (!validateForm()) {
        return
      }
      
      isLoading.value = true
      
      try {
        const formDataToSend = new FormData()
        
        // Добавляем основные поля
        formDataToSend.append('name', formData.name.trim())
        if (formData.description?.trim()) {
          formDataToSend.append('description', formData.description.trim())
        }
        
        // Добавляем контекст
        if (contextType.value === 'lesson' && formData.lesson) {
          formDataToSend.append('lesson', formData.lesson)
          formDataToSend.append('theme', formData.theme)
          formDataToSend.append('subject', formData.subject)
        } else if (contextType.value === 'theme' && formData.theme) {
          formDataToSend.append('theme', formData.theme)
          formDataToSend.append('subject', formData.subject)
        } else if (formData.subject) {
          formDataToSend.append('subject', formData.subject)
        }
        
        if (formData.sort_order) {
          formDataToSend.append('sort_order', formData.sort_order)
        }
        
        formDataToSend.append('is_visible', formData.is_visible)
        
        // Добавляем файл если есть
        if (selectedFile.value) {
          formDataToSend.append('file', selectedFile.value)
        }
        
        let response
        if (isEdit.value) {
          response = await apiManager.put(`lms.resources`, props.resourceData.id, formDataToSend)
          if (response.success) {
            emit('resourceUpdated', response.data)
          }
        } else {
          response = await apiManager.post('lms.resources', formDataToSend)
          if (response.success) {
            emit('resourceCreated', response.data)
          }
        }
        
        if (response.success) {
          closeModal()
        }
      } catch (error) {
        handleApiError(error, 'ресурс', errors)
      } finally {
        isLoading.value = false
      }
    }
    
    // Закрытие модального окна
    const closeModal = () => {
      // Сбрасываем форму
      Object.assign(formData, {
        name: '',
        description: '',
        subject: null,
        theme: null,
        lesson: null,
        sort_order: null,
        is_visible: true
      })
      
      selectedFile.value = null
      contextType.value = 'course'
      Object.keys(errors).forEach(key => delete errors[key])
      
      // Очищаем input файла
      const fileInput = document.getElementById('resourceFile')
      if (fileInput) {
        fileInput.value = ''
      }
      
      emit('close')
    }
    
    // Watchers
    watch(() => props.resourceData, () => {
      initializeForm()
    })
    
    watch(() => formData.subject, (newValue) => {
      if (newValue) {
        loadThemes(newValue)
      }
    })
    
    watch(() => formData.theme, (newValue) => {
      if (newValue) {
        loadLessons(newValue)
      }
    })
    
    // Lifecycle
    onMounted(() => {
      loadSubjects()
      initializeForm()
    })
    
    return {
      isLoading,
      selectedFile,
      contextType,
      availableSubjects,
      availableThemes,
      availableLessons,
      formData,
      errors,
      isEdit,
      updateContext,
      onSubjectChange,
      onThemeChange,
      handleFileChange,
      handleSubmit,
      closeModal
    }
  }
}
</script>

<style scoped>
.form-check {
  margin-bottom: 0.5rem;
}

.spinner-border-sm {
  width: 1rem;
  height: 1rem;
}

.form-text {
  font-size: 0.875rem;
  color: #6c757d;
}

.invalid-feedback {
  display: block;
}
</style> 