<script setup>
import { ref, onMounted, computed } from 'vue'
import { BookOpen, Search, Filter, Users, Clock, Star, Plus, ChevronDown, Edit, Calendar, FileText, User, FolderPlus, Tag, Trash2, RotateCcw } from 'lucide-vue-next'
import { apiClient } from '@/js/api/manager'
import { endpoints } from '@/js/api/endpoints'
import { globalUserRole } from '../composables/useUserRole'
import { 
  showSuccess, 
  showError, 
  showWarning,
  confirmDelete,
  handleApiError,
  showValidationError,
  showSaveSuccess,
  showDeleteSuccess,
  closeConfirmDialog,
  showChoiceDialog,
  closeChoiceDialog
} from '@/js/utils/notifications'
import RoleGuard from '../components/RoleGuard.vue'

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
const showCreateCategoryModal = ref(false)
const showCreateFormatModal = ref(false)
const userRole = globalUserRole

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
  is_published: false
})

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
  return courseFormats.value && courseFormats.value.length > 0 
    ? courseFormats.value 
    : formatOptions.map(opt => ({ 
        id: opt.value, 
        name: opt.label, 
        description: opt.label,
        is_active: true 
      }))
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
    filtered = filtered.filter(course => 
      course.category && course.category.toString() === selectedCategory.value
    )
  }

  if (selectedFormat.value !== 'all') {
    filtered = filtered.filter(course => 
      course.course_format && course.course_format.toString() === selectedFormat.value
    )
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
    courses.value = response.data.results || response.data || []
  } catch (error) {
    console.error('Ошибка загрузки курсов:', error)
    courses.value = []
  } finally {
    loading.value = false
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
      courseFormats.value = response.data.results || response.data || []
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
  if (course.isEnrolled) return
  
  try {
    await apiClient.post(endpoints.lms.enroll(course.id))
    course.isEnrolled = true
    course.enrollment_count = (course.enrollment_count || 0) + 1
    console.log('Успешно записались на курс:', course.name)
  } catch (error) {
    console.error('Ошибка записи на курс:', error)
    showError('Ошибка при записи на курс')
  }
}

async function createCourse() {
  try {
    // Валидация
    if (!courseForm.value.name || !courseForm.value.name.trim()) {
      showValidationError('Название курса обязательно для заполнения')
      return
    }
    
    if (!courseForm.value.description || !courseForm.value.description.trim()) {
      showValidationError('Описание курса обязательно для заполнения')
      return
    }
    
    const courseData = {
      ...courseForm.value,
      teacher: userRole.currentUser.value?.id,
      name: courseForm.value.name.trim(),
      description: courseForm.value.description.trim(),
      summary: courseForm.value.summary?.trim() || ''
    }
    
    console.log('Создание курса:', courseData)
    const response = await apiClient.post(endpoints.lms.subjects, courseData)
    
    courses.value.unshift(response.data)
    showCreateModal.value = false
    resetCourseForm()
    
    showSaveSuccess('Курс')
  } catch (error) {
    console.error('Ошибка создания курса:', error)
    handleApiError(error, 'Ошибка при создании курса')
  }
}

function resetCourseForm() {
  courseForm.value = {
    name: '',
    description: '',
    summary: '',
    category: null,
    course_format: availableFormats.value?.length > 0 ? availableFormats.value[0].id : 'topics',
    start_date: '',
    end_date: '',
    enrollment_key: '',
    max_enrollment: null,
    is_self_enrollment: true,
    is_published: false
  }
}

function editCourse(course) {
  console.log('Редактировать курс:', course.id)
  // TODO: Добавить модальное окно редактирования или переход к странице редактирования
}

function canEditCourse(course) {
  // Преподаватель может редактировать только свои курсы
  // Администратор может редактировать любые курсы
  return userRole.isAdmin.value || 
         (userRole.isTeacher.value && course.teacher === userRole.currentUser.value?.id)
}

function formatDate(dateString) {
  if (!dateString) return 'Не указано'
  return new Date(dateString).toLocaleDateString('ru-RU')
}

function getCategoryName(categoryId) {
  if (!categoryId) return 'Без категории'
  const category = categories.value.find(c => c.id === categoryId)
  return category ? category.name : 'Без категории'
}

function getFormatName(formatId) {
  if (!formatId) return 'Не указано'
  if (!availableFormats.value || availableFormats.value.length === 0) return formatId
  const format = availableFormats.value.find(f => f.id === formatId)
  return format ? format.name : formatId
}

async function createCategory() {
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
}

function openCreateCategoryModal() {
  showCreateCategoryModal.value = true
}

async function createFormat() {
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
    }
}

function resetFormatForm() {
  formatForm.value = {
    name: '',
    description: '',
    is_active: true
  }
}

function openCreateFormatModal() {
  showCreateFormatModal.value = true
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
  const confirmed = await confirmDelete(category.name, 'категорию')
  
  if (!confirmed) {
    closeConfirmDialog()
    return
  }
  
  try {
    await apiClient.delete(endpoints.lms.deleteCategory(category.id))
    
    // Удаляем из списка только после успешного удаления
    categories.value = categories.value.filter(c => c.id !== category.id)
    
    // Если была выбрана удаленная категория, сбрасываем фильтр
    if (selectedCategory.value === category.id.toString()) {
      selectedCategory.value = 'all'
    }
    
    closeConfirmDialog()
    showDeleteSuccess('Категория')
  } catch (error) {
    console.error('Ошибка удаления категории:', error)
    closeConfirmDialog()
    
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

async function deleteCourseFormat(format) {
  const confirmed = await confirmDelete(format.name, 'формат курса')
  
  if (!confirmed) {
    closeConfirmDialog()
    return
  }
  
  try {
    await apiClient.delete(endpoints.lms.deleteCourseFormat(format.id))
    
    // Удаляем из списка только после успешного удаления
    courseFormats.value = courseFormats.value.filter(f => f.id !== format.id)
    
    // Если был выбран удаленный формат, сбрасываем фильтр
    if (selectedFormat.value === format.id.toString()) {
      selectedFormat.value = 'all'
    }
    
    closeConfirmDialog()
    showDeleteSuccess('Формат курса')
  } catch (error) {
    console.error('Ошибка удаления формата:', error)
    closeConfirmDialog()
    
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
              <div class="d-flex justify-content-between align-items-center mb-2">
                <label class="form-label mb-0">Категория</label>
                <RoleGuard :roles="['teacher', 'admin']" :show-fallback="false">
                  <button 
                    @click="openCreateCategoryModal"
                    class="btn btn-sm btn-outline-primary"
                    title="Создать категорию"
                  >
                    <Plus :size="14" />
                  </button>
                </RoleGuard>
              </div>
              <select v-model="selectedCategory" class="form-select mb-2">
                <option value="all">Все категории</option>
                <option v-for="category in categories" :key="category.id" :value="category.id.toString()">
                  {{ category.name }}
                </option>
              </select>
              
              <!-- Список категорий для управления -->
              <RoleGuard :roles="['admin']" :show-fallback="false">
                <div v-if="categories.length > 0" class="small">
                  <div class="text-muted mb-1">Управление категориями:</div>
                  <div class="d-flex flex-wrap gap-1">
                    <span 
                      v-for="category in categories" 
                      :key="category.id" 
                      class="badge bg-light text-dark d-flex align-items-center gap-1"
                    >
                      {{ category.name }}
                      <button 
                        @click="deleteCategory(category)"
                        class="btn btn-sm p-0 border-0 bg-transparent text-danger"
                        style="line-height: 1;"
                        title="Удалить категорию"
                      >
                        <Trash2 :size="12" />
                      </button>
                    </span>
                  </div>
                </div>
              </RoleGuard>
            </div>
            <div class="mb-3">
              <div class="d-flex justify-content-between align-items-center mb-2">
                <label class="form-label mb-0">Формат</label>
                <RoleGuard :roles="['teacher', 'admin']" :show-fallback="false">
                  <button 
                    @click="openCreateFormatModal"
                    class="btn btn-sm btn-outline-primary"
                    title="Создать формат"
                  >
                    <Plus :size="14" />
                  </button>
                </RoleGuard>
              </div>
              <select v-model="selectedFormat" class="form-select mb-2">
                <option value="all">Все форматы</option>
                <option v-for="format in availableFormats" :key="format?.id || format" :value="(format?.id || format).toString()">
                  {{ format?.name || format }}
                </option>
              </select>
              
              <!-- Список форматов для управления -->
              <RoleGuard :roles="['admin']" :show-fallback="false">
                <div v-if="courseFormats.length > 0" class="small">
                  <div class="text-muted mb-1">Управление форматами:</div>
                  <div class="d-flex flex-wrap gap-1">
                    <span 
                      v-for="format in courseFormats" 
                      :key="format.id" 
                      class="badge bg-light text-dark d-flex align-items-center gap-1"
                    >
                      {{ format.name }}
                      <button 
                        @click="deleteCourseFormat(format)"
                        class="btn btn-sm p-0 border-0 bg-transparent text-danger"
                        style="line-height: 1;"
                        title="Удалить формат"
                      >
                        <Trash2 :size="12" />
                      </button>
                    </span>
                  </div>
                </div>
              </RoleGuard>
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
                    </ul>
                  </div>
                </div>
                
                <p class="card-text text-muted small mb-3">{{ course.summary || course.description }}</p>
                
                <div class="course-meta small text-muted mb-3">
                  <div class="d-flex align-items-center gap-2 mb-1">
                    <User :size="14" />
                    <span>ID преподавателя: {{ course.teacher }}</span>
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
                    <span class="small text-muted">{{ course.enrollment_count || 0 }}</span>
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
                  <span v-else class="badge bg-success">Вы записаны</span>
                </div>
                <div v-else-if="userRole.isTeacher.value || userRole.isAdmin.value" class="d-flex gap-2">
                  <button class="btn btn-outline-primary btn-sm flex-fill">
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
            <button type="button" class="btn-close" @click="showCreateModal = false"></button>
          </div>
          <div class="modal-body">
            <form @submit.prevent="createCourse">
              <div class="row">
                <div class="col-12 mb-3">
                  <label class="form-label">Название курса *</label>
                  <input 
                    v-model="courseForm.name" 
                    type="text" 
                    class="form-control" 
                    required
                    placeholder="Введите название курса"
                  />
                </div>
                
                <div class="col-12 mb-3">
                  <label class="form-label">Краткое описание</label>
                  <textarea 
                    v-model="courseForm.summary" 
                    class="form-control" 
                    rows="2"
                    placeholder="Краткое описание курса для каталога"
                  ></textarea>
                </div>
                
                <div class="col-12 mb-3">
                  <label class="form-label">Полное описание</label>
                  <textarea 
                    v-model="courseForm.description" 
                    class="form-control" 
                    rows="4"
                    placeholder="Подробное описание курса"
                  ></textarea>
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
                  <label class="form-label">Формат курса</label>
                  <div class="d-flex gap-2">
                    <select v-model="courseForm.course_format" class="form-select">
                      <option v-for="format in availableFormats" :key="format?.id || format" :value="format?.id || format">
                        {{ format?.name || format }}
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
                </div>
                
                <div class="col-md-6 mb-3">
                  <label class="form-label">Дата начала</label>
                  <input v-model="courseForm.start_date" type="date" class="form-control" />
                </div>
                
                <div class="col-md-6 mb-3">
                  <label class="form-label">Дата окончания</label>
                  <input v-model="courseForm.end_date" type="date" class="form-control" />
                </div>
                
                <div class="col-md-6 mb-3">
                  <label class="form-label">Ключ записи</label>
                  <input 
                    v-model="courseForm.enrollment_key" 
                    type="text" 
                    class="form-control"
                    placeholder="Оставьте пустым для открытой записи"
                  />
                </div>
                
                <div class="col-md-6 mb-3">
                  <label class="form-label">Максимум студентов</label>
                  <input 
                    v-model="courseForm.max_enrollment" 
                    type="number" 
                    class="form-control"
                    placeholder="Без ограничений"
                  />
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
              </div>
            </form>
          </div>
          <div class="modal-footer">
            <button type="button" class="btn btn-secondary" @click="showCreateModal = false">
              Отмена
            </button>
            <button type="button" class="btn btn-primary" @click="createCourse">
              Создать курс
            </button>
          </div>
        </div>
      </div>
    </div>
    <div v-if="showCreateModal" class="modal-backdrop fade show"></div>

    <!-- Модальное окно создания категории -->
    <div class="modal fade" :class="{ 'show d-block': showCreateCategoryModal }" tabindex="-1" v-if="showCreateCategoryModal">
      <div class="modal-dialog">
        <div class="modal-content">
          <div class="modal-header">
            <h5 class="modal-title d-flex align-items-center gap-2">
              <FolderPlus :size="20" class="text-primary" />
              Создать новую категорию
            </h5>
            <button type="button" class="btn-close" @click="showCreateCategoryModal = false"></button>
          </div>
          <div class="modal-body">
            <form @submit.prevent="createCategory">
              <div class="mb-3">
                <label class="form-label">Название категории *</label>
                <input 
                  v-model="categoryForm.name" 
                  type="text" 
                  class="form-control" 
                  required
                  placeholder="Введите название категории"
                />
              </div>
              
              <div class="mb-3">
                <label class="form-label">Описание</label>
                <textarea 
                  v-model="categoryForm.description" 
                  class="form-control" 
                  rows="3"
                  placeholder="Описание категории"
                ></textarea>
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
                  placeholder="0"
                />
                <div class="form-text">Чем меньше число, тем выше в списке</div>
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
            <button type="button" class="btn btn-secondary" @click="showCreateCategoryModal = false">
              Отмена
            </button>
            <button type="button" class="btn btn-primary" @click="createCategory">
              Создать категорию
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
            <button type="button" class="btn-close" @click="showCreateFormatModal = false"></button>
          </div>
          <div class="modal-body">
            <form @submit.prevent="createFormat">
              <div class="mb-3">
                <label class="form-label">Название формата *</label>
                <input 
                  v-model="formatForm.name" 
                  type="text" 
                  class="form-control" 
                  required
                  placeholder="Введите название формата (например: Проектный формат)"
                />
              </div>
              
              <div class="mb-3">
                <label class="form-label">Описание</label>
                <textarea 
                  v-model="formatForm.description" 
                  class="form-control" 
                  rows="3"
                  placeholder="Описание формата курса"
                ></textarea>
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
            <button type="button" class="btn btn-secondary" @click="showCreateFormatModal = false">
              Отмена
            </button>
            <button type="button" class="btn btn-primary" @click="createFormat">
              Создать формат
            </button>
          </div>
        </div>
      </div>
    </div>
    <div v-if="showCreateFormatModal" class="modal-backdrop fade show"></div>
  </div>
</template>

<style scoped>
.search-container {
  max-width: 400px;
}
</style> 