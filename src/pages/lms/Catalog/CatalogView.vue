<script setup>
import { ref, onMounted, computed } from 'vue'
import { BookOpen, Search, Filter, Users, Clock, Star, Plus, ChevronDown, Edit, Calendar, FileText, User, FolderPlus, Tag, Trash2, RotateCcw, Copy } from 'lucide-vue-next'
import { apiClient } from '@/js/api/manager'
import { endpoints } from '@/js/api/endpoints'
import { lmsApi } from '@/js/api/lmsApi'
import { globalUserRole } from '../composables/useUserRole'
import { 
  showSuccess, 
  showError, 
  showWarning,
  handleApiError,
  showValidationError,
  showSaveSuccess,
  showDeleteSuccess
} from '@/js/utils/notifications'
import { useNotifications } from '../composables/useNotifications'
import RoleGuard from '../components/RoleGuard.vue'
import CourseImagePlaceholder from '../components/CourseImagePlaceholder.vue'
import ConfirmDialog from '@/components/ConfirmDialog.vue'
import ChoiceDialog from '@/components/ChoiceDialog.vue'

const courses = ref([])
const categories = ref([])
const courseFormats = ref([])
const loading = ref(true)
const searchQuery = ref('')
const selectedCategory = ref('all')
const selectedFormat = ref('all')
const selectedLevel = ref('all')
const selectedSort = ref('newest')
const showFilters = ref(false)
const showCreateModal = ref(false)
const showEditModal = ref(false)
const showCreateCategoryModal = ref(false)
const showCreateFormatModal = ref(false)
const showEditCategoryModal = ref(false)
const showEditFormatModal = ref(false)
const editingCategory = ref(null)
const editingFormat = ref(null)
const userRole = globalUserRole
const { clearAllNotifications } = useNotifications()
const editingCourse = ref(null)
const originalCourseData = ref({})

// Состояния для красивых диалогов
const showConfirmDialog = ref(false)
const showChoiceDialogModal = ref(false)
const confirmDialogData = ref({
  title: '',
  message: '',
  onConfirm: null
})
const choiceDialogData = ref({
  title: '',
  message: '',
  choices: [],
  onChoice: null
})
const dialogLoading = ref(false)

// Форма создания курса
const courseForm = ref({
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
  image: null // Поле для загрузки изображения
})

// Добавляем состояние валидации
const validationErrors = ref({})
const isSubmitting = ref(false)

// Валидация для категорий
const categoryValidationErrors = ref({})
const isCategorySubmitting = ref(false)

// Валидация для форматов
const formatValidationErrors = ref({})
const isFormatSubmitting = ref(false)

// Форма создания категории
const categoryForm = ref({
  name: '',
  description: '',
  parent: null,
  sort_order: 0,
  is_visible: true
})

// Форма создания формата
const formatForm = ref({
  name: '',
  description: '',
  is_active: true
})

const levelOptions = [
  { value: 'all', label: 'Все уровни' },
  { value: 'beginner', label: 'Начинающий' },
  { value: 'intermediate', label: 'Средний' },
  { value: 'advanced', label: 'Продвинутый' }
]

const sortOptions = [
  { value: 'newest', label: 'Новые' },
  { value: 'popular', label: 'Популярные' },
  { value: 'rating', label: 'По рейтингу' },
  { value: 'name', label: 'По названию' }
]

const formatOptions = [
  { value: 'topics', label: 'Темы' },
  { value: 'weeks', label: 'Недели' },
  { value: 'social', label: 'Социальный формат' },
  { value: 'single', label: 'Одна активность' }
]

const availableFormats = computed(() => {
  try {
    if (courseFormats.value && Array.isArray(courseFormats.value) && courseFormats.value.length > 0) {
      // Фильтруем и валидируем форматы
      const validFormats = courseFormats.value.filter(format => {
        if (!format || typeof format !== 'object') return false
        if (format.id === undefined || format.id === null) return false
        if (!format.name || typeof format.name !== 'string') return false
        return true
      })
      
      // Если есть валидные форматы, возвращаем их
      if (validFormats.length > 0) {
        return validFormats
      }
    }
  } catch (error) {
    console.error('Ошибка при обработке форматов:', error)
  }
  
  // Если нет форматов из API, возвращаем пустой массив
  return []
})

const filteredCourses = computed(() => {
  let filtered = courses.value

  if (searchQuery.value) {
    const query = searchQuery.value.toLowerCase()
    filtered = filtered.filter(course =>
      course.name.toLowerCase().includes(query) ||
      course.description.toLowerCase().includes(query) ||
      course.summary.toLowerCase().includes(query)
    )
  }

  if (selectedCategory.value !== 'all') {
    filtered = filtered.filter(course => {
      const categoryId = course.category?.id || course.category
      return categoryId && categoryId.toString() === selectedCategory.value
    })
  }

  if (selectedFormat.value !== 'all') {
    filtered = filtered.filter(course => {
      const formatId = course.course_format?.id || course.course_format
      return formatId && formatId.toString() === selectedFormat.value
    })
  }

  // Сортировка
  filtered.sort((a, b) => {
    switch (selectedSort.value) {
      case 'name':
        return a.name.localeCompare(b.name)
      case 'popular':
        return (b.enrollment_count || 0) - (a.enrollment_count || 0)
      case 'newest':
      default:
        return new Date(b.creationdate) - new Date(a.creationdate)
    }
  })

  return filtered
})

async function fetchCourses() {
  try {
    loading.value = true
    const response = await apiClient.get(endpoints.lms.subjects)
    console.log('Загруженные курсы:', response.data)
    const coursesData = response.data.results || response.data || []
    
    // Если пользователь студент, проверяем статус записи для каждого курса
    if (userRole.isStudent.value) {
      await checkEnrollmentStatus(coursesData)
    }
    
    courses.value = coursesData
    console.log('📋 Финальные курсы с проверенным статусом записи:', courses.value.map(c => ({
      id: c.id,
      name: c.name,
      isEnrolled: c.isEnrolled
    })))
  } catch (error) {
    console.error('Ошибка загрузки курсов:', error)
    courses.value = []
  } finally {
    loading.value = false
  }
}

async function checkEnrollmentStatus(coursesData) {
  try {
    console.log('🔍 Проверяем статус записи для курсов:', coursesData.length)
    
    // Пытаемся получить список записей пользователя
    let enrolledCourseIds = []
    
    try {
      console.log('📝 Получаем список записей пользователя')
      const enrolledResponse = await apiClient.get(endpoints.lms.enrollments)
      console.log('📋 Ответ от API записей:', enrolledResponse.data)
      
      const enrollments = enrolledResponse.data.results || enrolledResponse.data || []
      console.log('📚 Найдено записей:', enrollments.length)
      
      // Правильно извлекаем ID курсов из записей
      enrolledCourseIds = enrollments.map(enrollment => {
        // В записи subject может быть объектом или ID
        const subjectId = enrollment.subject?.id || enrollment.subject
        console.log('🎯 Запись на курс:', subjectId, 'статус:', enrollment.status)
        return subjectId
      }).filter(id => id !== undefined && id !== null)
      
      console.log('✅ ID курсов, на которые записан пользователь:', enrolledCourseIds)
      
    } catch (apiError) {
      console.log('❌ Не удалось получить список записей:', apiError)
      console.log('🔄 Проверяем каждый курс индивидуально')
      
      // Если нет специального API, проверяем статус каждого курса индивидуально
      for (const course of coursesData) {
        try {
          await apiClient.get(`${endpoints.lms.subjects}${course.id}/enrollment_status/`)
          course.isEnrolled = true
          console.log('✅ Пользователь записан на курс:', course.name)
        } catch {
          course.isEnrolled = false
          console.log('❌ Пользователь НЕ записан на курс:', course.name)
        }
      }
      return
    }
    
    // Устанавливаем статус записи для каждого курса
    coursesData.forEach(course => {
      const wasEnrolled = course.isEnrolled
      course.isEnrolled = enrolledCourseIds.includes(course.id)
      
      if (course.isEnrolled !== wasEnrolled) {
        console.log(`🔄 Изменение статуса для курса "${course.name}": ${wasEnrolled} → ${course.isEnrolled}`)
      }
    })
    
    const enrolledCount = coursesData.filter(course => course.isEnrolled).length
    console.log(`📊 Итого записан на ${enrolledCount} из ${coursesData.length} курсов`)
    
  } catch (error) {
    console.error('❌ Ошибка проверки статуса записи:', error)
    // Если ошибка, просто не устанавливаем статус
  }
}

async function fetchCategories() {
  try {
    const response = await apiClient.get(endpoints.lms.categories)
    console.log('Загруженные категории:', response.data)
    categories.value = response.data.results || response.data || []
  } catch (error) {
    console.error('Ошибка загрузки категорий:', error)
    categories.value = []
  }
}

async function fetchCourseFormats() {
  try {
    const response = await apiClient.get(endpoints.lms.courseFormats)
    console.log('Загруженные форматы:', response.data)
    
    // Проверяем что данные корректные
    if (response.data && (Array.isArray(response.data) || response.data.results)) {
      const rawFormats = response.data.results || response.data || []
      // Фильтруем и валидируем форматы
      courseFormats.value = rawFormats.filter(format => 
        format && 
        typeof format === 'object' && 
        format.id !== undefined && 
        format.id !== null &&
        format.name
      )
      
      if (courseFormats.value.length === 0) {
        throw new Error('Нет корректных форматов от сервера')
      }
    } else {
      throw new Error('Некорректные данные от сервера')
    }
  } catch (error) {
    console.error('Ошибка загрузки форматов (используем fallback):', error.response?.status || error.message)
    // Fallback на стандартные форматы
    courseFormats.value = formatOptions.map(opt => ({ 
      id: opt.value, 
      name: opt.label, 
      description: opt.label,
      is_active: true 
    }))
    console.log('Использованы fallback форматы:', courseFormats.value)
  }
}

async function enrollCourse(course) {
  if (course.isEnrolled) {
    showWarning('Вы уже записаны на этот курс')
    return
  }
  
  // Проверяем авторизацию пользователя
  if (!userRole.currentUser.value?.id) {
    showError('Для записи на курс необходимо авторизоваться')
    return
  }
  
  try {
    console.log('Записываемся на курс:', course.name, 'ID:', course.id)
    console.log('Текущий пользователь:', userRole.currentUser.value)
    
    // Используем lmsApi для записи на курс
    await lmsApi.enrollInCourse(course.id)
    
    // Обновляем статус курса
    course.isEnrolled = true
    course.enrollment_count = (course.enrollment_count || 0) + 1
    course.enrolled_students_count = (course.enrolled_students_count || 0) + 1
    
    showSuccess(`Вы успешно записались на курс "${course.name}"`)
    console.log('Успешно записались на курс:', course.name)
  } catch (error) {
    console.error('Ошибка записи на курс:', error)
    
    if (error.response?.status === 400) {
      const errorData = error.response?.data
      if (typeof errorData === 'string' && errorData.includes('уже записаны')) {
        showError('Вы уже записаны на этот курс')
        course.isEnrolled = true
      } else if (errorData?.non_field_errors) {
        showError(errorData.non_field_errors[0] || 'Ошибка валидации данных')
      } else {
        showError('Неверные данные для записи на курс')
        console.error('Детали ошибки 400:', errorData)
      }
    } else if (error.response?.status === 403) {
      showError('У вас нет прав для записи на этот курс')
    } else if (error.response?.status === 404) {
      showError('Курс не найден')
    } else if (error.response?.status === 409) {
      showError('Вы уже записаны на этот курс')
      course.isEnrolled = true
    } else {
      showError('Ошибка при записи на курс. Попробуйте позже.')
    }
  }
}

async function createCourse() {
  // Очищаем старые уведомления перед началом
  clearAllNotifications()
  
  isSubmitting.value = true
  validationErrors.value = {}

  try {
    // Детальная валидация
    const errors = {}
    
    // Валидация названия
    if (!courseForm.value.name || !courseForm.value.name.trim()) {
      errors.name = 'Название курса обязательно для заполнения'
    } else if (courseForm.value.name.trim().length < 3) {
      errors.name = 'Название курса должно содержать минимум 3 символа'
    } else if (courseForm.value.name.trim().length > 100) {
      errors.name = 'Название курса не должно превышать 100 символов'
    }
    
    // Валидация описания
    if (!courseForm.value.description || !courseForm.value.description.trim()) {
      errors.description = 'Описание курса обязательно для заполнения'
    } else if (courseForm.value.description.trim().length < 10) {
      errors.description = 'Описание курса должно содержать минимум 10 символов'
    }

    // Валидация краткого описания
    if (courseForm.value.summary && courseForm.value.summary.length > 500) {
      errors.summary = 'Краткое описание не должно превышать 500 символов'
    }

    // Валидация дат - улучшенная версия
    if (courseForm.value.start_date || courseForm.value.end_date) {
      if (courseForm.value.start_date && courseForm.value.end_date) {
        const startDate = new Date(courseForm.value.start_date)
        const endDate = new Date(courseForm.value.end_date)
        
        // Проверка валидности дат
        if (isNaN(startDate.getTime())) {
          errors.start_date = 'Некорректная дата начала'
        }
        if (isNaN(endDate.getTime())) {
          errors.end_date = 'Некорректная дата окончания'
        }
        
        // Проверка что дата окончания позже начала
        if (!isNaN(startDate.getTime()) && !isNaN(endDate.getTime())) {
          if (startDate >= endDate) {
            errors.start_date = 'Дата начала должна быть раньше даты окончания'
            errors.end_date = 'Дата окончания должна быть позже даты начала'
          }
        }
      } else if (courseForm.value.start_date && !courseForm.value.end_date) {
        // Если есть дата начала без даты окончания
        errors.end_date = 'Укажите дату окончания курса'
      } else if (!courseForm.value.start_date && courseForm.value.end_date) {
        // Если есть дата окончания без даты начала
        errors.start_date = 'Укажите дату начала курса'
      }
    }

    // Валидация макс студентов
    if (courseForm.value.max_enrollment !== null && courseForm.value.max_enrollment !== undefined && courseForm.value.max_enrollment !== '') {
      if (isNaN(Number(courseForm.value.max_enrollment)) || Number(courseForm.value.max_enrollment) < 1) {
        errors.max_enrollment = 'Максимум студентов должен быть положительным числом'
      }
    }

    // Валидация ключа записи
    if (courseForm.value.enrollment_key && courseForm.value.enrollment_key.length > 50) {
      errors.enrollment_key = 'Ключ записи не должен превышать 50 символов'
    }

    // Валидация формата курса
    if (!courseForm.value.course_format) {
      errors.course_format = 'Выберите формат курса'
    }

    // Если есть ошибки валидации, показываем их
    if (Object.keys(errors).length > 0) {
      validationErrors.value = errors
      showValidationError('Пожалуйста, исправьте ошибки в форме')
      return
    }
    
    // Подготавливаем данные для отправки
    const courseData = {
      ...courseForm.value,
      teacher: userRole.currentUser.value?.id,
      name: courseForm.value.name.trim(),
      description: courseForm.value.description.trim(),
      summary: courseForm.value.summary?.trim() || '',
      max_enrollment: courseForm.value.max_enrollment || null
    }
    
    // Убираем пустые даты
    if (!courseData.start_date) {
      delete courseData.start_date
    }
    if (!courseData.end_date) {
      delete courseData.end_date
    }
    
    console.log('Создание курса:', courseData)
    
    let response
    
    // Если есть изображение, отправляем как FormData
    if (courseForm.value.image) {
      const formData = new FormData()
      
      // Добавляем все поля курса
      Object.keys(courseData).forEach(key => {
        if (courseData[key] !== null && courseData[key] !== undefined) {
          formData.append(key, courseData[key])
        }
      })
      
      // Добавляем изображение
      formData.append('image', courseForm.value.image)
      
      response = await apiClient.post(endpoints.lms.subjects, formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      })
    } else {
      response = await apiClient.post(endpoints.lms.subjects, courseData)
    }
    
    // Только если запрос успешен - добавляем курс и закрываем модальное окно
    courses.value.unshift(response.data)
    showCreateModal.value = false
    resetCourseForm()
    showSaveSuccess('Курс')
    
  } catch (error) {
    console.error('Ошибка создания курса:', error)
    
    // Обработка ошибок валидации от сервера
    if (error.response?.status === 400 && error.response.data) {
      const serverErrors = {}
      const errorData = error.response.data
      
      // Обрабатываем ошибки полей
      Object.keys(errorData).forEach(field => {
        if (Array.isArray(errorData[field])) {
          // Берем первое сообщение об ошибке для каждого поля
          serverErrors[field] = errorData[field][0]
        } else if (typeof errorData[field] === 'string') {
          serverErrors[field] = errorData[field]
        } else {
          serverErrors[field] = 'Некорректное значение поля'
        }
      })
      
      validationErrors.value = serverErrors
      
      // Показываем общее сообщение об ошибке валидации
      const errorCount = Object.keys(serverErrors).length
      showValidationError(`Найдено ${errorCount} ошибок в форме. Пожалуйста, исправьте их.`)
    } else {
      handleApiError(error, 'Ошибка при создании курса')
    }
  } finally {
    // КРИТИЧНО: всегда сбрасываем состояние загрузки
    isSubmitting.value = false
  }
}

function resetCourseForm() {
  courseForm.value = {
    name: '',
    description: '',
    summary: '',
    category: null,
    course_format: '', // Пустой формат для принудительного выбора
    start_date: '',
    end_date: '',
    enrollment_key: '',
    max_enrollment: null,
    is_self_enrollment: true,
    is_published: false,
    image: null
  }
  validationErrors.value = {}
  
  // Сбрасываем input файла
  const fileInput = document.querySelector('input[type="file"]')
  if (fileInput) {
    fileInput.value = ''
  }
}

function closeCreateModal() {
  // Принудительно сбрасываем состояние и закрываем модальное окно
  isSubmitting.value = false
  showCreateModal.value = false
  resetCourseForm()
}

function closeEditModal() {
  // Принудительно сбрасываем состояние и закрываем модальное окно редактирования
  isSubmitting.value = false
  showEditModal.value = false
  editingCourse.value = null
  originalCourseData.value = {}
  resetCourseForm()
}

// Функция для сравнения данных курса
function hasChanges() {
  const current = {
    name: courseForm.value.name || '',
    description: courseForm.value.description || '',
    summary: courseForm.value.summary || '',
    category: courseForm.value.category,
    course_format: courseForm.value.course_format,
    start_date: courseForm.value.start_date || '',
    end_date: courseForm.value.end_date || '',
    enrollment_key: courseForm.value.enrollment_key || '',
    max_enrollment: courseForm.value.max_enrollment,
    is_self_enrollment: courseForm.value.is_self_enrollment,
    is_published: courseForm.value.is_published
  }
  
  // Сравниваем каждое поле
  return (
    current.name !== originalCourseData.value.name ||
    current.description !== originalCourseData.value.description ||
    current.summary !== originalCourseData.value.summary ||
    current.category !== originalCourseData.value.category ||
    current.course_format !== originalCourseData.value.course_format ||
    current.start_date !== originalCourseData.value.start_date ||
    current.end_date !== originalCourseData.value.end_date ||
    current.enrollment_key !== originalCourseData.value.enrollment_key ||
    current.max_enrollment !== originalCourseData.value.max_enrollment ||
    current.is_self_enrollment !== originalCourseData.value.is_self_enrollment ||
    current.is_published !== originalCourseData.value.is_published ||
    courseForm.value.image !== null // Если выбрано новое изображение
  )
}

async function updateCourse() {
  // Проверяем, были ли изменения в данных
  if (!hasChanges()) {
    showWarning('Данные курса не были изменены')
    return
  }
  
  // Очищаем старые уведомления перед началом
  clearAllNotifications()
  
  isSubmitting.value = true
  validationErrors.value = {}

  try {
    // Детальная валидация (такая же как и при создании)
    const errors = {}
    
    // Валидация названия
    if (!courseForm.value.name || !courseForm.value.name.trim()) {
      errors.name = 'Название курса обязательно для заполнения'
    } else if (courseForm.value.name.trim().length < 3) {
      errors.name = 'Название курса должно содержать минимум 3 символа'
    } else if (courseForm.value.name.trim().length > 100) {
      errors.name = 'Название курса не должно превышать 100 символов'
    }
    
    // Валидация описания
    if (!courseForm.value.description || !courseForm.value.description.trim()) {
      errors.description = 'Описание курса обязательно для заполнения'
    } else if (courseForm.value.description.trim().length < 10) {
      errors.description = 'Описание курса должно содержать минимум 10 символов'
    }

    // Валидация краткого описания
    if (courseForm.value.summary && courseForm.value.summary.length > 500) {
      errors.summary = 'Краткое описание не должно превышать 500 символов'
    }

    // Валидация дат - улучшенная версия
    if (courseForm.value.start_date || courseForm.value.end_date) {
      if (courseForm.value.start_date && courseForm.value.end_date) {
        const startDate = new Date(courseForm.value.start_date)
        const endDate = new Date(courseForm.value.end_date)
        
        // Проверка валидности дат
        if (isNaN(startDate.getTime())) {
          errors.start_date = 'Некорректная дата начала'
        }
        if (isNaN(endDate.getTime())) {
          errors.end_date = 'Некорректная дата окончания'
        }
        
        // Проверка что дата окончания позже начала
        if (!isNaN(startDate.getTime()) && !isNaN(endDate.getTime())) {
          if (startDate >= endDate) {
            errors.start_date = 'Дата начала должна быть раньше даты окончания'
            errors.end_date = 'Дата окончания должна быть позже даты начала'
          }
        }
      } else if (courseForm.value.start_date && !courseForm.value.end_date) {
        // Если есть дата начала без даты окончания
        errors.end_date = 'Укажите дату окончания курса'
      } else if (!courseForm.value.start_date && courseForm.value.end_date) {
        // Если есть дата окончания без даты начала
        errors.start_date = 'Укажите дату начала курса'
      }
    }

    // Валидация макс студентов
    if (courseForm.value.max_enrollment !== null && courseForm.value.max_enrollment !== undefined && courseForm.value.max_enrollment !== '') {
      if (isNaN(Number(courseForm.value.max_enrollment)) || Number(courseForm.value.max_enrollment) < 1) {
        errors.max_enrollment = 'Максимум студентов должен быть положительным числом'
      }
    }

    // Валидация ключа записи
    if (courseForm.value.enrollment_key && courseForm.value.enrollment_key.length > 50) {
      errors.enrollment_key = 'Ключ записи не должен превышать 50 символов'
    }

    // Валидация формата курса
    if (!courseForm.value.course_format) {
      errors.course_format = 'Выберите формат курса'
    }

    // Если есть ошибки валидации, показываем их
    if (Object.keys(errors).length > 0) {
      validationErrors.value = errors
      showValidationError('Пожалуйста, исправьте ошибки в форме')
      return
    }
    
    // Подготавливаем данные для отправки
    const courseData = {
      ...courseForm.value,
      name: courseForm.value.name.trim(),
      description: courseForm.value.description.trim(),
      summary: courseForm.value.summary?.trim() || '',
      max_enrollment: courseForm.value.max_enrollment || null
    }
    
    // Убираем пустые даты
    if (!courseData.start_date) {
      delete courseData.start_date
    }
    if (!courseData.end_date) {
      delete courseData.end_date
    }
    
    console.log('Обновление курса:', courseData)
    
    let response
    
    // Если есть изображение, отправляем как FormData
    if (courseForm.value.image) {
      const formData = new FormData()
      
      // Добавляем все поля курса
      Object.keys(courseData).forEach(key => {
        if (courseData[key] !== null && courseData[key] !== undefined) {
          formData.append(key, courseData[key])
        }
      })
      
      // Добавляем изображение
      formData.append('image', courseForm.value.image)
      
      response = await apiClient.put(`${endpoints.lms.subjects}${editingCourse.value.id}/`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      })
    } else {
      response = await apiClient.put(endpoints.lms.subjects + editingCourse.value.id + '/', courseData)
    }
    
    // Только если запрос успешен - обновляем курс в списке и закрываем модальное окно
    const index = courses.value.findIndex(c => c.id === editingCourse.value.id)
    if (index !== -1) {
      courses.value[index] = response.data
    }
    
    showEditModal.value = false
    editingCourse.value = null
    originalCourseData.value = {}
    resetCourseForm()
    showSaveSuccess('Курс обновлен')
    
  } catch (error) {
    console.error('Ошибка обновления курса:', error)
    
    // Обработка ошибок валидации от сервера
    if (error.response?.status === 400 && error.response.data) {
      const serverErrors = {}
      const errorData = error.response.data
      
      // Обрабатываем ошибки полей
      Object.keys(errorData).forEach(field => {
        if (Array.isArray(errorData[field])) {
          // Берем первое сообщение об ошибке для каждого поля
          serverErrors[field] = errorData[field][0]
        } else if (typeof errorData[field] === 'string') {
          serverErrors[field] = errorData[field]
        } else {
          serverErrors[field] = 'Некорректное значение поля'
        }
      })
      
      validationErrors.value = serverErrors
      
      // Показываем общее сообщение об ошибке валидации
      const errorCount = Object.keys(serverErrors).length
      showValidationError(`Найдено ${errorCount} ошибок в форме. Пожалуйста, исправьте их.`)
    } else {
      handleApiError(error, 'Ошибка при обновлении курса')
    }
  } finally {
    // КРИТИЧНО: всегда сбрасываем состояние загрузки
    isSubmitting.value = false
  }
}

function editCourse(course) {
  console.log('Редактировать курс:', course.id)
  editingCourse.value = course
  
  // Заполняем форму данными курса
  courseForm.value = {
    name: course.name || '',
    description: course.description || '',
    summary: course.summary || '',
    category: course.category?.id || course.category,
    course_format: course.course_format?.id || course.course_format,
    start_date: course.start_date || '',
    end_date: course.end_date || '',
    enrollment_key: course.enrollment_key || '',
    max_enrollment: course.max_enrollment,
    is_self_enrollment: course.is_self_enrollment,
    is_published: course.is_published,
    image: null // Сбрасываем поле image при редактировании
  }
  
  // Сохраняем оригинальные данные для сравнения
  originalCourseData.value = {
    name: course.name || '',
    description: course.description || '',
    summary: course.summary || '',
    category: course.category?.id || course.category,
    course_format: course.course_format?.id || course.course_format,
    start_date: course.start_date || '',
    end_date: course.end_date || '',
    enrollment_key: course.enrollment_key || '',
    max_enrollment: course.max_enrollment,
    is_self_enrollment: course.is_self_enrollment,
    is_published: course.is_published
  }
  
  validationErrors.value = {}
  showEditModal.value = true
}

function canEditCourse(course) {
  // Преподаватель может редактировать только свои курсы
  // Администратор может редактировать любые курсы
  if (userRole.isAdmin.value) return true
  
  if (userRole.isTeacher.value) {
    // Учитываем что teacher может быть объектом или ID
    const teacherId = typeof course.teacher === 'object' ? course.teacher?.id : course.teacher
    return teacherId === userRole.currentUser.value?.id
  }
  
  return false
}

async function deleteCourse(course) {
  showConfirmDeleteDialog(
    'Удаление курса',
    `Вы уверены, что хотите удалить курс "${course.name}"? Это действие нельзя отменить.`,
    async () => {
      try {
        await apiClient.delete(endpoints.lms.subjects + course.id + '/')
        
        // Удаляем курс из списка только после успешного удаления
        courses.value = courses.value.filter(c => c.id !== course.id)
        
        closeDialogs()
        showDeleteSuccess('Курс')
      } catch (error) {
        console.error('Ошибка удаления курса:', error)
        closeDialogs()
        handleApiError(error, 'Ошибка при удалении курса')
      }
    }
  )
}

async function duplicateCourse(course) {
  try {
    // Создаем копию данных курса
    const duplicatedData = {
      name: `Копия - ${course.name}`,
      description: course.description,
      summary: course.summary,
      category: course.category?.id || course.category,
      course_format: course.course_format?.id || course.course_format,
      enrollment_key: '', // Убираем ключ записи для копии
      max_enrollment: course.max_enrollment,
      is_self_enrollment: course.is_self_enrollment,
      is_published: false // Копия создается как черновик
    }
    
    const response = await apiClient.post(endpoints.lms.subjects, duplicatedData)
    
    // Добавляем новый курс в начало списка
    courses.value.unshift(response.data)
    
    showSuccess(`Курс "${course.name}" успешно дублирован`)
  } catch (error) {
    console.error('Ошибка дублирования курса:', error)
    handleApiError(error, 'Ошибка при дублировании курса')
  }
}

function formatDate(dateString) {
  if (!dateString) return 'Не указано'
  return new Date(dateString).toLocaleDateString('ru-RU')
}

function getCategoryName(category) {
  if (!category) return 'Без категории'
  
  // Если category - это объект, возвращаем его name
  if (typeof category === 'object' && category.name) {
    return category.name
  }
  
  // Если category - это ID, ищем в списке категорий
  const categoryObj = categories.value.find(c => c.id === category)
  return categoryObj ? categoryObj.name : 'Без категории'
}

function getFormatName(format) {
  if (!format) return 'Не указано'
  
  // Если format - это объект, возвращаем его name
  if (typeof format === 'object' && format.name) {
    return format.name
  }
  
  // Если format - это ID, ищем в списке форматов
  if (!availableFormats.value || availableFormats.value.length === 0) return format
  const formatObj = availableFormats.value.find(f => f?.id === format)
  return formatObj?.name || format
}

function getTeacherName(teacher) {
  if (!teacher) return 'Не указано'
  
  // Если teacher - это объект пользователя
  if (typeof teacher === 'object' && teacher.full_name) {
    return teacher.full_name
  }
  
  // Если teacher - это объект пользователя без full_name, собираем имя
  if (typeof teacher === 'object') {
    if (teacher.first_name || teacher.last_name) {
      return `${teacher.first_name || ''} ${teacher.last_name || ''}`.trim()
    }
    return teacher.username || teacher.email || 'Неизвестный преподаватель'
  }
  
  // Если teacher - это ID, возвращаем его
  return `ID: ${teacher}`
}

function getCourseImageUrl(course) {
  if (course.image) {
    // Если есть изображение, возвращаем его URL
    if (typeof course.image === 'string') {
      return course.image.startsWith('http') ? course.image : `${window.location.origin}${course.image}`
    }
  }
  
  // Возвращаем null для использования компонента-заглушки
  return null
}

function handleImageUpload(event) {
  const file = event.target.files[0]
  if (file) {
    // Проверяем тип файла
    if (!file.type.startsWith('image/')) {
      showError('Пожалуйста, выберите файл изображения')
      return
    }
    
    // Проверяем размер файла (максимум 5MB)
    if (file.size > 5 * 1024 * 1024) {
      showError('Размер файла не должен превышать 5MB')
      return
    }
    
    courseForm.value.image = file
  }
}

function viewCourse(course) {
  // Логика просмотра курса - переход на страницу курса
  console.log('Просмотр курса:', course.id)
  // Можно использовать роутер для перехода
  // router.push(`/lms/courses/${course.id}`)
  // Или открыть в новой вкладке
  window.open(`/lms/courses/${course.id}/view`, '_blank')
}

async function createCategory() {
  // Проверяем валидацию
  if (!validateCategoryForm()) {
    showValidationError('Проверьте правильность заполнения полей')
    return
  }

  isCategorySubmitting.value = true
  
  try {
    console.log('Создание категории:', categoryForm.value)
    const response = await apiClient.post(endpoints.lms.categories, categoryForm.value)
    
    // Добавляем новую категорию в список
    categories.value.push(response.data)
    
    // Сортируем категории по sort_order и имени
    categories.value.sort((a, b) => {
      if (a.sort_order !== b.sort_order) {
        return a.sort_order - b.sort_order
      }
      return a.name.localeCompare(b.name)
    })
    
    showCreateCategoryModal.value = false
    resetCategoryForm()
    
    // Автоматически выбираем созданную категорию если мы в модальном окне создания курса
    if (showCreateModal.value) {
      courseForm.value.category = response.data.id
    }
    
    showSaveSuccess('Категория "' + response.data.name + '"')
  } catch (error) {
    console.error('Ошибка создания категории:', error)
    handleApiError(error, 'Ошибка при создании категории')
  } finally {
    isCategorySubmitting.value = false
  }
}

function resetCategoryForm() {
  categoryForm.value = {
    name: '',
    description: '',
    parent: null,
    sort_order: 0,
    is_visible: true
  }
  categoryValidationErrors.value = {}
}

function validateCategoryForm() {
  const errors = {}
  
  // Проверка названия категории
  if (!categoryForm.value.name || !categoryForm.value.name.trim()) {
    errors.name = 'Название категории обязательно для заполнения'
  } else if (categoryForm.value.name.trim().length < 2) {
    errors.name = 'Название категории должно содержать минимум 2 символа'
  } else if (categoryForm.value.name.trim().length > 100) {
    errors.name = 'Название категории не должно превышать 100 символов'
  }
  
  // Проверка описания (если заполнено)
  if (categoryForm.value.description && categoryForm.value.description.trim().length > 500) {
    errors.description = 'Описание не должно превышать 500 символов'
  }
  
  // Проверка порядка сортировки
  if (categoryForm.value.sort_order !== null && categoryForm.value.sort_order !== undefined) {
    const sortOrder = Number(categoryForm.value.sort_order)
    if (isNaN(sortOrder) || sortOrder < 0) {
      errors.sort_order = 'Порядок сортировки должен быть положительным числом'
    }
  }
  
  categoryValidationErrors.value = errors
  return Object.keys(errors).length === 0
}

function openCreateCategoryModal() {
  resetCategoryForm()
  showCreateCategoryModal.value = true
}

function closeCategoryModal() {
  showCreateCategoryModal.value = false
  resetCategoryForm()
}

function editCategory(category) {
  editingCategory.value = category
  categoryForm.value = {
    name: category.name || '',
    description: category.description || '',
    parent: category.parent || null,
    sort_order: category.sort_order || 0,
    is_visible: category.is_visible !== undefined ? category.is_visible : true
  }
  categoryValidationErrors.value = {}
  showEditCategoryModal.value = true
}

function closeEditCategoryModal() {
  showEditCategoryModal.value = false
  editingCategory.value = null
  resetCategoryForm()
}

async function updateCategory() {
  if (!validateCategoryForm()) {
    showValidationError('Проверьте правильность заполнения полей')
    return
  }

  isCategorySubmitting.value = true
  
  try {
    const response = await apiClient.put(`${endpoints.lms.categories}${editingCategory.value.id}/`, categoryForm.value)
    
    // Обновляем категорию в списке
    const index = categories.value.findIndex(c => c.id === editingCategory.value.id)
    if (index !== -1) {
      categories.value[index] = response.data
    }
    
    showEditCategoryModal.value = false
    editingCategory.value = null
    resetCategoryForm()
    showSaveSuccess('Категория "' + response.data.name + '"')
  } catch (error) {
    console.error('Ошибка обновления категории:', error)
    handleApiError(error, 'Ошибка при обновлении категории')
  } finally {
    isCategorySubmitting.value = false
  }
}



async function createFormat() {
  // Проверяем валидацию
  if (!validateFormatForm()) {
    showValidationError('Проверьте правильность заполнения полей')
    return
  }

  isFormatSubmitting.value = true
  
  try {
    console.log('Создание формата:', formatForm.value)
    const response = await apiClient.post(endpoints.lms.courseFormats, formatForm.value)
    
    // Добавляем новый формат в список
    courseFormats.value.push(response.data)
    
    showCreateFormatModal.value = false
    resetFormatForm()
    
    // Автоматически выбираем созданный формат если мы в модальном окне создания курса
    if (showCreateModal.value) {
      courseForm.value.course_format = response.data.id
    }
    
    showSaveSuccess('Формат "' + response.data.name + '"')
  } catch (error) {
    console.error('Ошибка создания формата:', error)
    
    // Если API недоступно, создаем формат локально
    if (error.response?.status === 404) {
      const newFormat = {
        id: formatForm.value.name.toLowerCase().replace(/\s+/g, '_'),
        name: formatForm.value.name,
        description: formatForm.value.description,
        is_active: formatForm.value.is_active
      }
      
      courseFormats.value.push(newFormat)
      
      showCreateFormatModal.value = false
      resetFormatForm()
      
      // Автоматически выбираем созданный формат если мы в модальном окне создания курса
      if (showCreateModal.value) {
        courseForm.value.course_format = newFormat.id
      }
      
      console.log('Формат создан локально:', newFormat.name)
      showSuccess('Формат "' + newFormat.name + '" создан локально')
    } else {
      handleApiError(error, 'Ошибка при создании формата')
    }
  } finally {
    isFormatSubmitting.value = false
  }
}

function resetFormatForm() {
  formatForm.value = {
    name: '',
    description: '',
    is_active: true
  }
  formatValidationErrors.value = {}
}

function validateFormatForm() {
  const errors = {}
  
  // Проверка названия формата
  if (!formatForm.value.name || !formatForm.value.name.trim()) {
    errors.name = 'Название формата обязательно для заполнения'
  } else if (formatForm.value.name.trim().length < 2) {
    errors.name = 'Название формата должно содержать минимум 2 символа'
  } else if (formatForm.value.name.trim().length > 100) {
    errors.name = 'Название формата не должно превышать 100 символов'
  }
  
  // Проверка описания (если заполнено)
  if (formatForm.value.description && formatForm.value.description.trim().length > 500) {
    errors.description = 'Описание не должно превышать 500 символов'
  }
  
  formatValidationErrors.value = errors
  return Object.keys(errors).length === 0
}

function openCreateFormatModal() {
  resetFormatForm()
  showCreateFormatModal.value = true
}

function closeFormatModal() {
  showCreateFormatModal.value = false
  resetFormatForm()
}

function editFormat(format) {
  editingFormat.value = format
  formatForm.value = {
    name: format.name || '',
    description: format.description || '',
    is_active: format.is_active !== undefined ? format.is_active : true
  }
  formatValidationErrors.value = {}
  showEditFormatModal.value = true
}

function closeEditFormatModal() {
  showEditFormatModal.value = false
  editingFormat.value = null
  resetFormatForm()
}

async function updateFormat() {
  if (!validateFormatForm()) {
    showValidationError('Проверьте правильность заполнения полей')
    return
  }

  isFormatSubmitting.value = true
  
  try {
    const response = await apiClient.put(`${endpoints.lms.courseFormats}${editingFormat.value.id}/`, formatForm.value)
    
    // Обновляем формат в списке
    const index = courseFormats.value.findIndex(f => f.id === editingFormat.value.id)
    if (index !== -1) {
      courseFormats.value[index] = response.data
    }
    
    showEditFormatModal.value = false
    editingFormat.value = null
    resetFormatForm()
    showSaveSuccess('Формат "' + response.data.name + '"')
  } catch (error) {
    console.error('Ошибка обновления формата:', error)
    
    // Если API недоступно, обновляем локально
    if (error.response?.status === 404) {
      const index = courseFormats.value.findIndex(f => f.id === editingFormat.value.id)
      if (index !== -1) {
        courseFormats.value[index] = {
          ...courseFormats.value[index],
          ...formatForm.value
        }
      }
      
      showEditFormatModal.value = false
      editingFormat.value = null
      resetFormatForm()
      showSuccess('Формат "' + formatForm.value.name + '" обновлен локально')
    } else {
      handleApiError(error, 'Ошибка при обновлении формата')
    }
  } finally {
    isFormatSubmitting.value = false
  }
}



async function handleCategoryDeletionWithCourses(category, coursesCount) {
  const choice = await showChoiceDialog({
    title: 'Категория используется в курсах',
    message: `Категория "${category.name}" используется в ${coursesCount} курсах. Что вы хотите сделать?`,
    choices: [
      {
        label: `Удалить категорию и все ${coursesCount} курсов`,
        value: 'delete_all',
        variant: 'danger',
        icon: Trash2
      },
      {
        label: 'Переместить курсы в другую категорию',
        value: 'move_courses',
        variant: 'warning',
        icon: RotateCcw
      }
    ]
  })
  
  if (!choice) {
    closeChoiceDialog()
    return
  }
  
  if (choice === 'delete_all') {
    await deleteCategoryWithCourses(category, coursesCount)
  } else if (choice === 'move_courses') {
    await moveCoursesCategoryDialog(category, coursesCount)
  }
}

async function deleteCategoryWithCourses(category, coursesCount) {
  try {
    // Удаляем категорию с каскадным удалением курсов
    await apiClient.delete(endpoints.lms.deleteCategory(category.id), {
      params: { cascade: true }
    })
    
    // Удаляем категорию из списка
    categories.value = categories.value.filter(c => c.id !== category.id)
    
    // Если была выбрана удаленная категория, сбрасываем фильтр
    if (selectedCategory.value === category.id.toString()) {
      selectedCategory.value = 'all'
    }
    
    // Обновляем список курсов
    await fetchCourses()
    
    closeChoiceDialog()
    showSuccess(`Категория "${category.name}" и ${coursesCount} связанных курсов удалены`)
  } catch (error) {
    console.error('Ошибка каскадного удаления категории:', error)
    closeChoiceDialog()
    handleApiError(error, 'Ошибка при удалении категории и курсов')
  }
}

async function moveCoursesCategoryDialog(category, coursesCount) {
  // Получаем список других категорий
  const otherCategories = categories.value.filter(c => c.id !== category.id)
  
  if (otherCategories.length === 0) {
    closeChoiceDialog()
    showWarning('Нет других категорий для перемещения курсов. Создайте новую категорию или удалите все курсы.')
    return
  }
  
  const choices = otherCategories.map(cat => ({
    label: cat.name,
    value: cat.id,
    variant: 'primary'
  }))
  
  choices.push({
    label: 'Убрать категорию (сделать без категории)',
    value: null,
    variant: 'secondary'
  })
  
  const targetCategoryId = await showChoiceDialog({
    title: 'Выберите новую категорию',
    message: `Переместить ${coursesCount} курсов из категории "${category.name}" в:`,
    choices
  })
  
  if (targetCategoryId === undefined) {
    closeChoiceDialog()
    return
  }
  
  try {
    // Перемещаем курсы в другую категорию
    await apiClient.patch(endpoints.lms.deleteCategory(category.id), {
      move_courses_to: targetCategoryId
    })
    
    // Удаляем категорию из списка
    categories.value = categories.value.filter(c => c.id !== category.id)
    
    // Если была выбрана удаленная категория, сбрасываем фильтр
    if (selectedCategory.value === category.id.toString()) {
      selectedCategory.value = 'all'
    }
    
    // Обновляем список курсов
    await fetchCourses()
    
    closeChoiceDialog()
    const targetCategoryName = targetCategoryId ? 
      otherCategories.find(c => c.id === targetCategoryId)?.name || 'другую категорию' : 
      'без категории'
    showSuccess(`Категория "${category.name}" удалена, ${coursesCount} курсов перемещены в "${targetCategoryName}"`)
  } catch (error) {
    console.error('Ошибка перемещения курсов:', error)
    closeChoiceDialog()
    handleApiError(error, 'Ошибка при перемещении курсов')
  }
}

async function handleFormatDeletionWithCourses(format, coursesCount) {
  const choice = await showChoiceDialog({
    title: 'Формат используется в курсах',
    message: `Формат "${format.name}" используется в ${coursesCount} курсах. Что вы хотите сделать?`,
    choices: [
      {
        label: `Удалить формат и все ${coursesCount} курсов`,
        value: 'delete_all',
        variant: 'danger',
        icon: Trash2
      },
      {
        label: 'Изменить формат у курсов на другой',
        value: 'change_format',
        variant: 'warning',
        icon: RotateCcw
      }
    ]
  })
  
  if (!choice) {
    closeChoiceDialog()
    return
  }
  
  if (choice === 'delete_all') {
    await deleteFormatWithCourses(format, coursesCount)
  } else if (choice === 'change_format') {
    await changeCoursesFormatDialog(format, coursesCount)
  }
}

async function deleteFormatWithCourses(format, coursesCount) {
  try {
    // Удаляем формат с каскадным удалением курсов
    await apiClient.delete(endpoints.lms.deleteCourseFormat(format.id), {
      params: { cascade: true }
    })
    
    // Удаляем формат из списка
    courseFormats.value = courseFormats.value.filter(f => f.id !== format.id)
    
    // Если был выбран удаленный формат, сбрасываем фильтр
    if (selectedFormat.value === format.id.toString()) {
      selectedFormat.value = 'all'
    }
    
    // Обновляем список курсов
    await fetchCourses()
    
    closeChoiceDialog()
    showSuccess(`Формат "${format.name}" и ${coursesCount} связанных курсов удалены`)
  } catch (error) {
    console.error('Ошибка каскадного удаления формата:', error)
    closeChoiceDialog()
    handleApiError(error, 'Ошибка при удалении формата и курсов')
  }
}

async function changeCoursesFormatDialog(format, coursesCount) {
  // Получаем список других форматов
  const otherFormats = courseFormats.value.filter(f => f.id !== format.id)
  
  if (otherFormats.length === 0) {
    closeChoiceDialog()
    showWarning('Нет других форматов. Создайте новый формат или удалите все курсы.')
    return
  }
  
  const choices = otherFormats.map(fmt => ({
    label: fmt.name,
    value: fmt.id,
    variant: 'primary'
  }))
  
  const targetFormatId = await showChoiceDialog({
    title: 'Выберите новый формат',
    message: `Изменить формат у ${coursesCount} курсов с "${format.name}" на:`,
    choices
  })
  
  if (targetFormatId === undefined) {
    closeChoiceDialog()
    return
  }
  
  try {
    // Изменяем формат у курсов
    await apiClient.patch(endpoints.lms.deleteCourseFormat(format.id), {
      move_courses_to: targetFormatId
    })
    
    // Удаляем формат из списка
    courseFormats.value = courseFormats.value.filter(f => f.id !== format.id)
    
    // Если был выбран удаленный формат, сбрасываем фильтр
    if (selectedFormat.value === format.id.toString()) {
      selectedFormat.value = 'all'
    }
    
    // Обновляем список курсов
    await fetchCourses()
    
    closeChoiceDialog()
    const targetFormatName = otherFormats.find(f => f.id === targetFormatId)?.name || 'другой формат'
    showSuccess(`Формат "${format.name}" удален, у ${coursesCount} курсов изменен формат на "${targetFormatName}"`)
  } catch (error) {
    console.error('Ошибка изменения формата курсов:', error)
    closeChoiceDialog()
    handleApiError(error, 'Ошибка при изменении формата курсов')
  }
}

async function deleteCategory(category) {
  showConfirmDeleteDialog(
    'Удаление категории',
    `Вы уверены, что хотите удалить категорию "${category.name}"? Это действие нельзя отменить.`,
    async () => {
      try {
        await apiClient.delete(`${endpoints.lms.categories}${category.id}/`)
        
        // Удаляем из списка только после успешного удаления
        categories.value = categories.value.filter(c => c.id !== category.id)
        
        // Если была выбрана удаленная категория, сбрасываем фильтр
        if (selectedCategory.value === category.id.toString()) {
          selectedCategory.value = 'all'
        }
        
        closeDialogs()
        showDeleteSuccess('Категория')
      } catch (error) {
        console.error('Ошибка удаления категории:', error)
        closeDialogs()
        
        // Проверяем, есть ли связанные курсы
        if (error.response?.status === 400 && error.response?.data?.error) {
          const errorMessage = error.response.data.error
          // Извлекаем количество курсов из сообщения об ошибке
          const coursesMatch = errorMessage.match(/(\d+)\s+курсах/)
          const coursesCount = coursesMatch ? parseInt(coursesMatch[1]) : 0
          
          if (coursesCount > 0) {
            await handleCategoryDeletionWithCourses(category, coursesCount)
          } else {
            showError(errorMessage)
          }
        } else {
          handleApiError(error, 'Ошибка при удалении категории')
        }
      }
    }
  )
}



async function deleteCourseFormat(format) {
  showConfirmDeleteDialog(
    'Удаление формата курса',
    `Вы уверены, что хотите удалить формат "${format.name}"? Это действие нельзя отменить.`,
    async () => {
      try {
        await apiClient.delete(`${endpoints.lms.courseFormats}${format.id}/`)
        
        // Удаляем из списка только после успешного удаления
        courseFormats.value = courseFormats.value.filter(f => f.id !== format.id)
        
        // Если был выбран удаленный формат, сбрасываем фильтр
        if (selectedFormat.value === format.id.toString()) {
          selectedFormat.value = 'all'
        }
        
        closeDialogs()
        showDeleteSuccess('Формат курса')
      } catch (error) {
        console.error('Ошибка удаления формата:', error)
        closeDialogs()
        
        // Проверяем, есть ли связанные курсы
        if (error.response?.status === 400 && error.response?.data?.error) {
          const errorMessage = error.response.data.error
          // Извлекаем количество курсов из сообщения об ошибке
          const coursesMatch = errorMessage.match(/(\d+)\s+курсах/)
          const coursesCount = coursesMatch ? parseInt(coursesMatch[1]) : 0
          
          if (coursesCount > 0) {
            await handleFormatDeletionWithCourses(format, coursesCount)
          } else {
            showError(errorMessage)
          }
        } else {
          handleApiError(error, 'Ошибка при удалении формата')
        }
      }
    }
  )
}

// Функции для красивых диалогов
function showConfirmDeleteDialog(title, message, onConfirm) {
  confirmDialogData.value = {
    title,
    message,
    onConfirm
  }
  showConfirmDialog.value = true
}

function showChoiceDeleteDialog(title, message, choices, onChoice) {
  choiceDialogData.value = {
    title,
    message,
    choices,
    onChoice
  }
  showChoiceDialogModal.value = true
}

function handleConfirmDialog() {
  dialogLoading.value = true
  if (confirmDialogData.value.onConfirm) {
    confirmDialogData.value.onConfirm()
  }
}

function handleChoiceDialog(choice) {
  dialogLoading.value = true
  if (choiceDialogData.value.onChoice) {
    choiceDialogData.value.onChoice(choice)
  }
}

function closeDialogs() {
  showConfirmDialog.value = false
  showChoiceDialogModal.value = false
  dialogLoading.value = false
  confirmDialogData.value = {
    title: '',
    message: '',
    onConfirm: null
  }
  choiceDialogData.value = {
    title: '',
    message: '',
    choices: [],
    onChoice: null
  }
}

onMounted(async () => {
  await Promise.all([
    fetchCourses(),
    fetchCategories(),
    fetchCourseFormats()
  ])
})
</script>

<template>
  <div class="catalog-view">
    <!-- Заголовок с кнопкой создания курса -->
    <div class="row mb-4">
      <div class="col-12">
        <div class="d-flex justify-content-between align-items-center mb-3">
          <h3 class="mb-0">Каталог курсов</h3>
          <RoleGuard :roles="['teacher', 'admin']">
            <button 
              @click="showCreateModal = true"
              class="btn btn-primary d-flex align-items-center gap-2"
            >
              <Plus :size="20" />
              Создать курс
            </button>
          </RoleGuard>
        </div>
        
        <!-- Поиск -->
        <div class="search-container mb-3">
          <div class="input-group">
            <span class="input-group-text">
              <Search :size="20" />
            </span>
            <input
              v-model="searchQuery"
              type="text"
              class="form-control"
              placeholder="Поиск курсов..."
            />
          </div>
        </div>
      </div>
    </div>

    <div class="row">
      <!-- Боковая панель с фильтрами -->
      <div class="col-lg-3 mb-4">
        <div class="card">
          <div class="card-header">
            <h6 class="mb-0">Фильтры</h6>
          </div>
          <div class="card-body">
            <div class="mb-3">
              <label class="form-label mb-2">Категория</label>
              <select v-model="selectedCategory" class="form-select">
                <option value="all">Все категории</option>
                <option v-for="category in categories" :key="category.id" :value="category.id.toString()">
                  {{ category.name }}
                </option>
              </select>
            </div>
            <div class="mb-3">
              <label class="form-label mb-2">Формат</label>
              <select v-model="selectedFormat" class="form-select">
                <option value="all">Все форматы</option>
                <option v-for="courseFormat in availableFormats" :key="courseFormat?.id || courseFormat" :value="(courseFormat?.id || courseFormat).toString()">
                  {{ courseFormat?.name || courseFormat }}
                </option>
              </select>
            </div>
            
            <div class="mb-3">
              <label class="form-label">Сортировка</label>
              <select v-model="selectedSort" class="form-select">
                <option v-for="sort in sortOptions" :key="sort.value" :value="sort.value">
                  {{ sort.label }}
                </option>
              </select>
            </div>
          </div>
        </div>
      </div>

      <!-- Список курсов -->
      <div class="col-lg-9">
        <div v-if="loading" class="text-center py-5">
          <div class="spinner-border"></div>
          <p class="mt-2">Загрузка курсов...</p>
        </div>

        <div v-else-if="filteredCourses.length === 0" class="text-center py-5">
          <BookOpen :size="48" class="text-muted mb-3" />
          <h5 class="text-muted">Курсы не найдены</h5>
          <p class="text-muted">Попробуйте изменить параметры поиска</p>
        </div>

        <div v-else class="row">
          <div v-for="course in filteredCourses" :key="course.id" class="col-md-6 col-xl-4 mb-4">
            <div class="card h-100">
              <!-- Изображение курса -->
              <img 
                v-if="getCourseImageUrl(course)"
                :src="getCourseImageUrl(course)" 
                class="card-img-top" 
                alt="Изображение курса"
                style="height: 200px; object-fit: cover;"
              />
              <CourseImagePlaceholder 
                v-else
                height="200px"
                :text="course.name || 'Курс'"
              />
              <div class="card-body">
                <div class="d-flex justify-content-between align-items-start mb-2">
                  <h6 class="card-title">{{ course.name }}</h6>
                  <div class="dropdown" v-if="canEditCourse(course)">
                    <button class="btn btn-sm btn-outline-secondary" data-bs-toggle="dropdown">
                      <ChevronDown :size="16" />
                    </button>
                    <ul class="dropdown-menu">
                      <li>
                        <a class="dropdown-item" href="#" @click.prevent="editCourse(course)">
                          <Edit :size="16" class="me-2" />
                          Редактировать
                        </a>
                      </li>
                      <li v-if="canEditCourse(course)">
                        <hr class="dropdown-divider">
                      </li>
                      <li v-if="userRole.isTeacher.value || userRole.isAdmin.value">
                        <a class="dropdown-item" href="#" @click.prevent="duplicateCourse(course)">
                          <Copy :size="16" class="me-2" />
                          Дублировать
                        </a>
                      </li>
                      <li v-if="canEditCourse(course)">
                        <a class="dropdown-item text-danger" href="#" @click.prevent="deleteCourse(course)">
                          <Trash2 :size="16" class="me-2" />
                          Удалить
                        </a>
                      </li>
                    </ul>
                  </div>
                </div>
                
                <p class="card-text text-muted small mb-3">{{ course.summary || course.description }}</p>
                
                <div class="course-meta small text-muted mb-3">
                  <div class="d-flex align-items-center gap-2 mb-1">
                    <User :size="14" />
                    <span>Преподаватель: {{ getTeacherName(course.teacher) }}</span>
                  </div>
                  <div class="d-flex align-items-center gap-2 mb-1">
                    <BookOpen :size="14" />
                    <span>{{ getCategoryName(course.category) }}</span>
                  </div>
                  <div class="d-flex align-items-center gap-2 mb-1">
                    <Calendar :size="14" />
                    <span>{{ formatDate(course.creationdate) }}</span>
                  </div>
                  <div class="d-flex align-items-center gap-2">
                    <FileText :size="14" />
                    <span>{{ getFormatName(course.course_format) }}</span>
                  </div>
                </div>

                <div class="d-flex align-items-center justify-content-between">
                  <div class="d-flex align-items-center gap-2">
                    <Users :size="16" class="text-muted" />
                    <span class="small text-muted">{{ course.enrolled_students_count || course.enrollment_count || 0 }}</span>
                  </div>
                  
                  <div class="d-flex gap-2">
                    <span v-if="course.is_published" class="badge bg-success">Опубликован</span>
                    <span v-else class="badge bg-warning">Черновик</span>
                  </div>
                </div>
              </div>
              
              <div class="card-footer">
                <div v-if="userRole.isStudent.value" class="d-grid">
                  <button 
                    v-if="!course.isEnrolled"
                    @click="enrollCourse(course)"
                    class="btn btn-primary btn-sm"
                    :disabled="!course.is_published"
                  >
                    Записаться
                  </button>
                  <router-link 
                    v-else
                    :to="`/lms/course/${course.id}`"
                    class="btn btn-success btn-sm"
                  >
                    <BookOpen :size="16" class="me-1" />
                    Изучать
                  </router-link>
                </div>
                <div v-else-if="userRole.isTeacher.value || userRole.isAdmin.value" class="d-flex gap-2">
                  <button 
                    @click="viewCourse(course)"
                    class="btn btn-outline-primary btn-sm flex-fill"
                  >
                    Просмотр
                  </button>
                  <button 
                    v-if="canEditCourse(course)"
                    @click="editCourse(course)"
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

    <!-- Модальное окно создания курса -->
    <div class="modal fade" :class="{ 'show d-block': showCreateModal }" tabindex="-1" v-if="showCreateModal">
      <div class="modal-dialog modal-lg">
        <div class="modal-content">
          <div class="modal-header">
            <h5 class="modal-title">Создать новый курс</h5>
            <button type="button" class="btn-close" @click="closeCreateModal" :disabled="isSubmitting"></button>
          </div>
          <div class="modal-body">
            <form @submit.prevent="createCourse">
              <div class="row">
                <div class="col-12 mb-3">
                  <label class="form-label">Название курса *</label>
                  <input 
                    v-model="courseForm.name" 
                    type="text" 
                    :class="['form-control', validationErrors.name ? 'is-invalid' : '']"
                    required
                    placeholder="Введите название курса"
                  />
                  <div v-if="validationErrors.name" class="invalid-feedback">
                    {{ validationErrors.name }}
                  </div>
                </div>
                
                <div class="col-12 mb-3">
                  <label class="form-label">Краткое описание</label>
                  <textarea 
                    v-model="courseForm.summary" 
                    :class="['form-control', validationErrors.summary ? 'is-invalid' : '']"
                    rows="2"
                    placeholder="Краткое описание курса для каталога"
                  ></textarea>
                  <div v-if="validationErrors.summary" class="invalid-feedback">
                    {{ validationErrors.summary }}
                  </div>
                </div>
                
                <div class="col-12 mb-3">
                  <label class="form-label">Полное описание *</label>
                  <textarea 
                    v-model="courseForm.description" 
                    :class="['form-control', validationErrors.description ? 'is-invalid' : '']"
                    rows="4"
                    placeholder="Подробное описание курса"
                    required
                  ></textarea>
                  <div v-if="validationErrors.description" class="invalid-feedback">
                    {{ validationErrors.description }}
                  </div>
                </div>
                
                <div class="col-md-6 mb-3">
                  <label class="form-label">Категория</label>
                  <div class="d-flex gap-2">
                    <select v-model="courseForm.category" class="form-select">
                      <option :value="null">Без категории</option>
                      <option v-for="category in categories" :key="category.id" :value="category.id">
                        {{ category.name }}
                      </option>
                    </select>
                    <button 
                      type="button"
                      @click="openCreateCategoryModal"
                      class="btn btn-outline-secondary"
                      title="Создать новую категорию"
                    >
                      <Plus :size="16" />
                    </button>
                  </div>
                </div>
                
                <div class="col-md-6 mb-3">
                  <label class="form-label">Формат курса *</label>
                  <div class="d-flex gap-2">
                    <select 
                      v-model="courseForm.course_format" 
                      :class="['form-select', validationErrors.course_format ? 'is-invalid' : '']"
                    >
                      <option value="">Выберите формат курса</option>
                      <option v-for="courseFormat in availableFormats" :key="courseFormat?.id || courseFormat || Math.random()" :value="courseFormat?.id || courseFormat">
                        {{ courseFormat?.name || courseFormat || 'Неизвестный формат' }}
                      </option>
                    </select>
                    <button 
                      type="button"
                      @click="openCreateFormatModal"
                      class="btn btn-outline-secondary"
                      title="Создать новый формат"
                    >
                      <Plus :size="16" />
                    </button>
                  </div>
                  <div v-if="validationErrors.course_format" class="invalid-feedback">
                    {{ validationErrors.course_format }}
                  </div>
                </div>
                
                <div class="col-md-6 mb-3">
                  <label class="form-label">Дата начала</label>
                  <input 
                    v-model="courseForm.start_date" 
                    type="date" 
                    :class="['form-control', validationErrors.start_date ? 'is-invalid' : '']"
                  />
                  <div v-if="validationErrors.start_date" class="invalid-feedback">
                    {{ validationErrors.start_date }}
                  </div>
                </div>
                
                <div class="col-md-6 mb-3">
                  <label class="form-label">Дата окончания</label>
                  <input 
                    v-model="courseForm.end_date" 
                    type="date" 
                    :class="['form-control', validationErrors.end_date ? 'is-invalid' : '']"
                  />
                  <div v-if="validationErrors.end_date" class="invalid-feedback">
                    {{ validationErrors.end_date }}
                  </div>
                </div>
                
                <div class="col-md-6 mb-3">
                  <label class="form-label">Ключ записи</label>
                  <input 
                    v-model="courseForm.enrollment_key" 
                    type="text" 
                    :class="['form-control', validationErrors.enrollment_key ? 'is-invalid' : '']"
                    placeholder="Оставьте пустым для открытой записи"
                  />
                  <div v-if="validationErrors.enrollment_key" class="invalid-feedback">
                    {{ validationErrors.enrollment_key }}
                  </div>
                </div>
                
                <div class="col-md-6 mb-3">
                  <label class="form-label">Максимум студентов</label>
                  <input 
                    v-model="courseForm.max_enrollment" 
                    type="number" 
                    :class="['form-control', validationErrors.max_enrollment ? 'is-invalid' : '']"
                    placeholder="Без ограничений"
                    min="1"
                  />
                  <div v-if="validationErrors.max_enrollment" class="invalid-feedback">
                    {{ validationErrors.max_enrollment }}
                  </div>
                </div>
                
                <div class="col-12 mb-3">
                  <div class="form-check">
                    <input 
                      v-model="courseForm.is_self_enrollment" 
                      class="form-check-input" 
                      type="checkbox" 
                      id="selfEnrollment"
                    />
                    <label class="form-check-label" for="selfEnrollment">
                      Разрешить самостоятельную запись
                    </label>
                  </div>
                </div>
                
                <div class="col-12 mb-3">
                  <div class="form-check">
                    <input 
                      v-model="courseForm.is_published" 
                      class="form-check-input" 
                      type="checkbox" 
                      id="publishCourse"
                    />
                    <label class="form-check-label" for="publishCourse">
                      Опубликовать курс сразу
                    </label>
                  </div>
                </div>
                
                <div class="col-12 mb-3">
                  <label class="form-label">Изображение курса</label>
                  <input 
                    type="file" 
                    class="form-control"
                    accept="image/*"
                    @change="handleImageUpload"
                  />
                  <div class="form-text">
                    Выберите изображение для курса (максимум 5MB). Поддерживаются форматы: JPG, PNG, GIF.
                  </div>
                </div>
              </div>
            </form>
          </div>
          <div class="modal-footer">
            <button 
              type="button" 
              class="btn btn-secondary" 
              @click="closeCreateModal"
              :disabled="isSubmitting"
            >
              Отмена
            </button>
            <button 
              type="button" 
              class="btn btn-primary" 
              @click="createCourse"
              :disabled="isSubmitting"
            >
              <span v-if="isSubmitting" class="spinner-border spinner-border-sm me-2" role="status"></span>
              {{ isSubmitting ? 'Создание...' : 'Создать курс' }}
            </button>
          </div>
        </div>
      </div>
    </div>
    <div v-if="showCreateModal" class="modal-backdrop fade show"></div>

    <!-- Модальное окно редактирования курса -->
    <div class="modal fade" :class="{ 'show d-block': showEditModal }" tabindex="-1" v-if="showEditModal">
      <div class="modal-dialog modal-lg">
        <div class="modal-content">
          <div class="modal-header">
            <h5 class="modal-title">Редактировать курс</h5>
            <button type="button" class="btn-close" @click="closeEditModal" :disabled="isSubmitting"></button>
          </div>
          <div class="modal-body">
            <form @submit.prevent="updateCourse">
              <div class="row">
                <div class="col-12 mb-3">
                  <label class="form-label">Название курса *</label>
                  <input 
                    v-model="courseForm.name" 
                    type="text" 
                    :class="['form-control', validationErrors.name ? 'is-invalid' : '']"
                    required
                    placeholder="Введите название курса"
                  />
                  <div v-if="validationErrors.name" class="invalid-feedback">
                    {{ validationErrors.name }}
                  </div>
                </div>
                
                <div class="col-12 mb-3">
                  <label class="form-label">Краткое описание</label>
                  <textarea 
                    v-model="courseForm.summary" 
                    :class="['form-control', validationErrors.summary ? 'is-invalid' : '']"
                    rows="2"
                    placeholder="Краткое описание курса для каталога"
                  ></textarea>
                  <div v-if="validationErrors.summary" class="invalid-feedback">
                    {{ validationErrors.summary }}
                  </div>
                </div>
                
                <div class="col-12 mb-3">
                  <label class="form-label">Полное описание *</label>
                  <textarea 
                    v-model="courseForm.description" 
                    :class="['form-control', validationErrors.description ? 'is-invalid' : '']"
                    rows="4"
                    placeholder="Подробное описание курса"
                    required
                  ></textarea>
                  <div v-if="validationErrors.description" class="invalid-feedback">
                    {{ validationErrors.description }}
                  </div>
                </div>
                
                <div class="col-md-6 mb-3">
                  <label class="form-label">Категория</label>
                  <div class="d-flex gap-2">
                    <select v-model="courseForm.category" class="form-select">
                      <option :value="null">Без категории</option>
                      <option v-for="category in categories" :key="category.id" :value="category.id">
                        {{ category.name }}
                      </option>
                    </select>
                    <button 
                      type="button"
                      @click="openCreateCategoryModal"
                      class="btn btn-outline-secondary"
                      title="Создать новую категорию"
                    >
                      <Plus :size="16" />
                    </button>
                  </div>
                </div>
                
                <div class="col-md-6 mb-3">
                  <label class="form-label">Формат курса *</label>
                  <div class="d-flex gap-2">
                    <select 
                      v-model="courseForm.course_format" 
                      :class="['form-select', validationErrors.course_format ? 'is-invalid' : '']"
                    >
                      <option value="">Выберите формат курса</option>
                      <option v-for="courseFormat in availableFormats" :key="courseFormat?.id || courseFormat || Math.random()" :value="courseFormat?.id || courseFormat">
                        {{ courseFormat?.name || courseFormat || 'Неизвестный формат' }}
                      </option>
                    </select>
                    <button 
                      type="button"
                      @click="openCreateFormatModal"
                      class="btn btn-outline-secondary"
                      title="Создать новый формат"
                    >
                      <Plus :size="16" />
                    </button>
                  </div>
                  <div v-if="validationErrors.course_format" class="invalid-feedback">
                    {{ validationErrors.course_format }}
                  </div>
                </div>
                
                <div class="col-md-6 mb-3">
                  <label class="form-label">Дата начала</label>
                  <input 
                    v-model="courseForm.start_date" 
                    type="date" 
                    :class="['form-control', validationErrors.start_date ? 'is-invalid' : '']"
                  />
                  <div v-if="validationErrors.start_date" class="invalid-feedback">
                    {{ validationErrors.start_date }}
                  </div>
                </div>
                
                <div class="col-md-6 mb-3">
                  <label class="form-label">Дата окончания</label>
                  <input 
                    v-model="courseForm.end_date" 
                    type="date" 
                    :class="['form-control', validationErrors.end_date ? 'is-invalid' : '']"
                  />
                  <div v-if="validationErrors.end_date" class="invalid-feedback">
                    {{ validationErrors.end_date }}
                  </div>
                </div>
                
                <div class="col-md-6 mb-3">
                  <label class="form-label">Ключ записи</label>
                  <input 
                    v-model="courseForm.enrollment_key" 
                    type="text" 
                    :class="['form-control', validationErrors.enrollment_key ? 'is-invalid' : '']"
                    placeholder="Оставьте пустым для открытой записи"
                  />
                  <div v-if="validationErrors.enrollment_key" class="invalid-feedback">
                    {{ validationErrors.enrollment_key }}
                  </div>
                </div>
                
                <div class="col-md-6 mb-3">
                  <label class="form-label">Максимум студентов</label>
                  <input 
                    v-model="courseForm.max_enrollment" 
                    type="number" 
                    :class="['form-control', validationErrors.max_enrollment ? 'is-invalid' : '']"
                    placeholder="Без ограничений"
                    min="1"
                  />
                  <div v-if="validationErrors.max_enrollment" class="invalid-feedback">
                    {{ validationErrors.max_enrollment }}
                  </div>
                </div>
                
                <div class="col-12 mb-3">
                  <div class="form-check">
                    <input 
                      v-model="courseForm.is_self_enrollment" 
                      class="form-check-input" 
                      type="checkbox" 
                      id="editSelfEnrollment"
                    />
                    <label class="form-check-label" for="editSelfEnrollment">
                      Разрешить самостоятельную запись
                    </label>
                  </div>
                </div>
                
                <div class="col-12 mb-3">
                  <div class="form-check">
                    <input 
                      v-model="courseForm.is_published" 
                      class="form-check-input" 
                      type="checkbox" 
                      id="editPublishCourse"
                    />
                    <label class="form-check-label" for="editPublishCourse">
                      Опубликовать курс
                    </label>
                  </div>
                </div>
                
                <div class="col-12 mb-3">
                  <label class="form-label">Изображение курса</label>
                  <input 
                    type="file" 
                    class="form-control"
                    accept="image/*"
                    @change="handleImageUpload"
                  />
                  <div class="form-text">
                    Выберите новое изображение для курса (максимум 5MB). Поддерживаются форматы: JPG, PNG, GIF.
                  </div>
                </div>
              </div>
            </form>
          </div>
          <div class="modal-footer">
            <button 
              type="button" 
              class="btn btn-secondary" 
              @click="closeEditModal"
              :disabled="isSubmitting"
            >
              Отмена
            </button>
            <button 
              type="button" 
              class="btn btn-primary" 
              @click="updateCourse"
              :disabled="isSubmitting"
            >
              <span v-if="isSubmitting" class="spinner-border spinner-border-sm me-2" role="status"></span>
              {{ isSubmitting ? 'Сохранение...' : 'Сохранить изменения' }}
            </button>
          </div>
        </div>
      </div>
    </div>
    <div v-if="showEditModal" class="modal-backdrop fade show"></div>

    <!-- Модальное окно создания категории -->
    <div class="modal fade" :class="{ 'show d-block': showCreateCategoryModal }" tabindex="-1" v-if="showCreateCategoryModal">
      <div class="modal-dialog">
        <div class="modal-content">
          <div class="modal-header">
            <h5 class="modal-title d-flex align-items-center gap-2">
              <FolderPlus :size="20" class="text-primary" />
              Создать новую категорию
            </h5>
            <button type="button" class="btn-close" @click="closeCategoryModal"></button>
          </div>
          <div class="modal-body">
            <form @submit.prevent="createCategory">
              <div class="mb-3">
                <label class="form-label">Название категории *</label>
                <input 
                  v-model="categoryForm.name" 
                  type="text" 
                  class="form-control" 
                  :class="{ 'is-invalid': categoryValidationErrors.name }"
                  required
                  placeholder="Введите название категории"
                />
                <div v-if="categoryValidationErrors.name" class="invalid-feedback">
                  {{ categoryValidationErrors.name }}
                </div>
              </div>
              
              <div class="mb-3">
                <label class="form-label">Описание</label>
                <textarea 
                  v-model="categoryForm.description" 
                  class="form-control" 
                  :class="{ 'is-invalid': categoryValidationErrors.description }"
                  rows="3"
                  placeholder="Описание категории"
                ></textarea>
                <div v-if="categoryValidationErrors.description" class="invalid-feedback">
                  {{ categoryValidationErrors.description }}
                </div>
              </div>
              
                             <div class="mb-3">
                 <label class="form-label">Родительская категория</label>
                 <select v-model="categoryForm.parent" class="form-select">
                   <option :value="null">Без родительской категории</option>
                   <option v-for="category in categories" :key="category.id" :value="category.id">
                     {{ category.parent ? '↳ ' : '' }}{{ category.name }}
                   </option>
                 </select>
                 <div class="form-text">
                   Выберите родительскую категорию для создания подкатегории. 
                   Отступ ↳ показывает вложенные категории.
                 </div>
               </div>
              
              <div class="mb-3">
                <label class="form-label">Порядок сортировки</label>
                <input 
                  v-model="categoryForm.sort_order" 
                  type="number" 
                  class="form-control"
                  :class="{ 'is-invalid': categoryValidationErrors.sort_order }"
                  placeholder="0"
                />
                <div v-if="categoryValidationErrors.sort_order" class="invalid-feedback">
                  {{ categoryValidationErrors.sort_order }}
                </div>
                <div v-else class="form-text">Чем меньше число, тем выше в списке</div>
              </div>
              
              <div class="mb-3">
                <div class="form-check">
                  <input 
                    v-model="categoryForm.is_visible" 
                    class="form-check-input" 
                    type="checkbox" 
                    id="categoryVisible"
                  />
                  <label class="form-check-label" for="categoryVisible">
                    Видимая категория
                  </label>
                </div>
              </div>
            </form>
          </div>
          <div class="modal-footer">
            <button 
              type="button" 
              class="btn btn-secondary" 
              @click="closeCategoryModal"
              :disabled="isCategorySubmitting"
            >
              Отмена
            </button>
            <button 
              type="button" 
              class="btn btn-primary" 
              @click="createCategory"
              :disabled="isCategorySubmitting"
            >
              <span v-if="isCategorySubmitting" class="spinner-border spinner-border-sm me-2" role="status"></span>
              {{ isCategorySubmitting ? 'Создание...' : 'Создать категорию' }}
            </button>
          </div>
        </div>
      </div>
    </div>
    <div v-if="showCreateCategoryModal" class="modal-backdrop fade show"></div>

    <!-- Модальное окно создания формата курса -->
    <div class="modal fade" :class="{ 'show d-block': showCreateFormatModal }" tabindex="-1" v-if="showCreateFormatModal">
      <div class="modal-dialog">
        <div class="modal-content">
          <div class="modal-header">
            <h5 class="modal-title d-flex align-items-center gap-2">
              <Tag :size="20" class="text-primary" />
              Создать новый формат курса
            </h5>
            <button type="button" class="btn-close" @click="closeFormatModal"></button>
          </div>
          <div class="modal-body">
            <form @submit.prevent="createFormat">
              <div class="mb-3">
                <label class="form-label">Название формата *</label>
                <input 
                  v-model="formatForm.name" 
                  type="text" 
                  class="form-control" 
                  :class="{ 'is-invalid': formatValidationErrors.name }"
                  required
                  placeholder="Введите название формата (например: Проектный формат)"
                />
                <div v-if="formatValidationErrors.name" class="invalid-feedback">
                  {{ formatValidationErrors.name }}
                </div>
              </div>
              
              <div class="mb-3">
                <label class="form-label">Описание</label>
                <textarea 
                  v-model="formatForm.description" 
                  class="form-control" 
                  :class="{ 'is-invalid': formatValidationErrors.description }"
                  rows="3"
                  placeholder="Описание формата курса"
                ></textarea>
                <div v-if="formatValidationErrors.description" class="invalid-feedback">
                  {{ formatValidationErrors.description }}
                </div>
              </div>
              
              <div class="mb-3">
                <div class="form-check">
                  <input 
                    v-model="formatForm.is_active" 
                    class="form-check-input" 
                    type="checkbox" 
                    id="formatActive"
                  />
                  <label class="form-check-label" for="formatActive">
                    Активный формат
                  </label>
                </div>
              </div>
            </form>
          </div>
          <div class="modal-footer">
            <button 
              type="button" 
              class="btn btn-secondary" 
              @click="closeFormatModal"
              :disabled="isFormatSubmitting"
            >
              Отмена
            </button>
            <button 
              type="button" 
              class="btn btn-primary" 
              @click="createFormat"
              :disabled="isFormatSubmitting"
            >
              <span v-if="isFormatSubmitting" class="spinner-border spinner-border-sm me-2" role="status"></span>
              {{ isFormatSubmitting ? 'Создание...' : 'Создать формат' }}
            </button>
          </div>
        </div>
      </div>
    </div>
    <div v-if="showCreateFormatModal" class="modal-backdrop fade show"></div>

    <!-- Модальное окно редактирования категории -->
    <div class="modal fade" :class="{ 'show d-block': showEditCategoryModal }" tabindex="-1" v-if="showEditCategoryModal">
      <div class="modal-dialog">
        <div class="modal-content">
          <div class="modal-header">
            <h5 class="modal-title d-flex align-items-center gap-2">
              <Edit :size="20" class="text-primary" />
              Редактировать категорию
            </h5>
            <button type="button" class="btn-close" @click="closeEditCategoryModal"></button>
          </div>
          <div class="modal-body">
            <form @submit.prevent="updateCategory">
              <div class="mb-3">
                <label class="form-label">Название категории *</label>
                <input 
                  v-model="categoryForm.name" 
                  type="text" 
                  class="form-control" 
                  :class="{ 'is-invalid': categoryValidationErrors.name }"
                  required
                  placeholder="Введите название категории"
                />
                <div v-if="categoryValidationErrors.name" class="invalid-feedback">
                  {{ categoryValidationErrors.name }}
                </div>
              </div>
              
              <div class="mb-3">
                <label class="form-label">Описание</label>
                <textarea 
                  v-model="categoryForm.description" 
                  class="form-control" 
                  :class="{ 'is-invalid': categoryValidationErrors.description }"
                  rows="3"
                  placeholder="Описание категории"
                ></textarea>
                <div v-if="categoryValidationErrors.description" class="invalid-feedback">
                  {{ categoryValidationErrors.description }}
                </div>
              </div>
              
              <div class="mb-3">
                <label class="form-label">Родительская категория</label>
                <select v-model="categoryForm.parent" class="form-select">
                  <option :value="null">Без родительской категории</option>
                  <option v-for="category in categories.filter(c => c.id !== editingCategory?.id)" :key="category.id" :value="category.id">
                    {{ category.parent ? '↳ ' : '' }}{{ category.name }}
                  </option>
                </select>
                <div class="form-text">
                  Выберите родительскую категорию для создания подкатегории.
                </div>
              </div>
              
              <div class="mb-3">
                <label class="form-label">Порядок сортировки</label>
                <input 
                  v-model="categoryForm.sort_order" 
                  type="number" 
                  class="form-control"
                  :class="{ 'is-invalid': categoryValidationErrors.sort_order }"
                  placeholder="0"
                />
                <div v-if="categoryValidationErrors.sort_order" class="invalid-feedback">
                  {{ categoryValidationErrors.sort_order }}
                </div>
                <div v-else class="form-text">Чем меньше число, тем выше в списке</div>
              </div>
              
              <div class="mb-3">
                <div class="form-check">
                  <input 
                    v-model="categoryForm.is_visible" 
                    class="form-check-input" 
                    type="checkbox" 
                    id="editCategoryVisible"
                  />
                  <label class="form-check-label" for="editCategoryVisible">
                    Видимая категория
                  </label>
                </div>
              </div>
            </form>
          </div>
          <div class="modal-footer">
            <button 
              type="button" 
              class="btn btn-secondary" 
              @click="closeEditCategoryModal"
              :disabled="isCategorySubmitting"
            >
              Отмена
            </button>
            <button 
              type="button" 
              class="btn btn-primary" 
              @click="updateCategory"
              :disabled="isCategorySubmitting"
            >
              <span v-if="isCategorySubmitting" class="spinner-border spinner-border-sm me-2" role="status"></span>
              {{ isCategorySubmitting ? 'Сохранение...' : 'Сохранить изменения' }}
            </button>
          </div>
        </div>
      </div>
    </div>
    <div v-if="showEditCategoryModal" class="modal-backdrop fade show"></div>

    <!-- Модальное окно редактирования формата -->
    <div class="modal fade" :class="{ 'show d-block': showEditFormatModal }" tabindex="-1" v-if="showEditFormatModal">
      <div class="modal-dialog">
        <div class="modal-content">
          <div class="modal-header">
            <h5 class="modal-title d-flex align-items-center gap-2">
              <Edit :size="20" class="text-primary" />
              Редактировать формат курса
            </h5>
            <button type="button" class="btn-close" @click="closeEditFormatModal"></button>
          </div>
          <div class="modal-body">
            <form @submit.prevent="updateFormat">
              <div class="mb-3">
                <label class="form-label">Название формата *</label>
                <input 
                  v-model="formatForm.name" 
                  type="text" 
                  class="form-control" 
                  :class="{ 'is-invalid': formatValidationErrors.name }"
                  required
                  placeholder="Введите название формата"
                />
                <div v-if="formatValidationErrors.name" class="invalid-feedback">
                  {{ formatValidationErrors.name }}
                </div>
              </div>
              
              <div class="mb-3">
                <label class="form-label">Описание</label>
                <textarea 
                  v-model="formatForm.description" 
                  class="form-control" 
                  :class="{ 'is-invalid': formatValidationErrors.description }"
                  rows="3"
                  placeholder="Описание формата курса"
                ></textarea>
                <div v-if="formatValidationErrors.description" class="invalid-feedback">
                  {{ formatValidationErrors.description }}
                </div>
              </div>
              
              <div class="mb-3">
                <div class="form-check">
                  <input 
                    v-model="formatForm.is_active" 
                    class="form-check-input" 
                    type="checkbox" 
                    id="editFormatActive"
                  />
                  <label class="form-check-label" for="editFormatActive">
                    Активный формат
                  </label>
                </div>
              </div>
            </form>
          </div>
          <div class="modal-footer">
            <button 
              type="button" 
              class="btn btn-secondary" 
              @click="closeEditFormatModal"
              :disabled="isFormatSubmitting"
            >
              Отмена
            </button>
            <button 
              type="button" 
              class="btn btn-primary" 
              @click="updateFormat"
              :disabled="isFormatSubmitting"
            >
              <span v-if="isFormatSubmitting" class="spinner-border spinner-border-sm me-2" role="status"></span>
              {{ isFormatSubmitting ? 'Сохранение...' : 'Сохранить изменения' }}
            </button>
          </div>
        </div>
      </div>
    </div>
    <div v-if="showEditFormatModal" class="modal-backdrop fade show"></div>

    <!-- Красивые диалоги подтверждения -->
    <ConfirmDialog
      :show="showConfirmDialog"
      :title="confirmDialogData.title"
      :message="confirmDialogData.message"
      :loading="dialogLoading"
      @confirm="handleConfirmDialog"
      @cancel="closeDialogs"
      @close="closeDialogs"
    />

    <ChoiceDialog
      :show="showChoiceDialogModal"
      :title="choiceDialogData.title"
      :message="choiceDialogData.message"
      :choices="choiceDialogData.choices"
      :loading="dialogLoading"
      @choice="handleChoiceDialog"
      @cancel="closeDialogs"
      @close="closeDialogs"
    />
  </div>
</template>

<style scoped>
.search-container {
  max-width: 400px;
}
</style> 