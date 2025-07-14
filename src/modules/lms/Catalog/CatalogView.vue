<script setup>
import { ref, onMounted, computed } from 'vue'
import { BookOpen, Search, Users, Calendar, FileText, User } from 'lucide-vue-next'
import { apiClient } from '@/js/api/manager'
import { endpoints } from '@/js/api/endpoints'
import { lmsApi } from '@/modules/lms/js/lmsApi'
import { globalUserRole } from '../composables/useUserRole'
import { 
  showSuccess, 
  showError, 
  showWarning,
  handleApiError
} from '@/js/utils/notifications'
import CourseImagePlaceholder from '../components/CourseImagePlaceholder.vue'

const courses = ref([])
const categories = ref([])
const courseFormats = ref([])
const loading = ref(true)
const searchQuery = ref('')
const selectedCategory = ref('all')
const selectedFormat = ref('all')
const selectedSort = ref('newest')
const userRole = globalUserRole

const sortOptions = [
  { value: 'newest', label: 'Новые' },
  { value: 'popular', label: 'Популярные' },
  { value: 'rating', label: 'По рейтингу' },
  { value: 'name', label: 'По названию' }
]

const availableFormats = computed(() => {
  try {
    if (courseFormats.value && Array.isArray(courseFormats.value) && courseFormats.value.length > 0) {
      const validFormats = courseFormats.value.filter(format => {
        if (!format || typeof format !== 'object') return false
        if (format.id === undefined || format.id === null) return false
        if (!format.name || typeof format.name !== 'string') return false
        return true
      })
      
      if (validFormats.length > 0) {
        return validFormats
      }
    }
  } catch (error) {
    console.error('Ошибка при обработке форматов:', error)
  }
  
  return []
})

const filteredCourses = computed(() => {
  let filtered = courses.value

  if (searchQuery.value) {
    const query = searchQuery.value.toLowerCase()
    filtered = filtered.filter(course =>
      course.name.toLowerCase().includes(query) ||
      course.description.toLowerCase().includes(query) ||
      (course.summary && course.summary.toLowerCase().includes(query))
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
    if (userRole.isStudent?.value) {
      await checkEnrollmentStatus(coursesData)
    }
    
    courses.value = coursesData
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
    
    let enrolledCourseIds = []
    
    try {
      const enrolledResponse = await apiClient.get(endpoints.lms.enrollments)
      const enrollments = enrolledResponse.data.results || enrolledResponse.data || []
      
      enrolledCourseIds = enrollments.map(enrollment => {
        const subjectId = enrollment.subject?.id || enrollment.subject
        return subjectId
      }).filter(id => id !== undefined && id !== null)
      
    } catch (apiError) {
      console.log('❌ Не удалось получить список записей:', apiError)
      
      // Если нет специального API, проверяем статус каждого курса индивидуально
      for (const course of coursesData) {
        try {
          await apiClient.get(`${endpoints.lms.subjects}${course.id}/enrollment_status/`)
          course.isEnrolled = true
        } catch {
          course.isEnrolled = false
        }
      }
      return
    }
    
    // Устанавливаем статус записи для каждого курса
    coursesData.forEach(course => {
      course.isEnrolled = enrolledCourseIds.includes(course.id)
    })
    
  } catch (error) {
    console.error('❌ Ошибка проверки статуса записи:', error)
  }
}

async function fetchCategories() {
  try {
    const response = await apiClient.get(endpoints.lms.categories)
    categories.value = response.data.results || response.data || []
  } catch (error) {
    console.error('Ошибка загрузки категорий:', error)
    categories.value = []
  }
}

async function fetchCourseFormats() {
  try {
    const response = await apiClient.get(endpoints.lms.courseFormats)
    
    if (response.data && (Array.isArray(response.data) || response.data.results)) {
      const rawFormats = response.data.results || response.data || []
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
    courseFormats.value = [
      { id: 'topics', name: 'Темы', description: 'Темы', is_active: true },
      { id: 'weeks', name: 'Недели', description: 'Недели', is_active: true },
      { id: 'social', name: 'Социальный формат', description: 'Социальный формат', is_active: true },
      { id: 'single', name: 'Одна активность', description: 'Одна активность', is_active: true }
    ]
  }
}

async function enrollCourse(course) {
  if (course.isEnrolled) {
    showWarning('Вы уже записаны на этот курс')
    return
  }
  
  // Проверяем авторизацию пользователя
  if (!userRole.currentUser?.value?.id) {
    showError('Для записи на курс необходимо авторизоваться')
    return
  }
  
  // Проверяем роль пользователя - записываться могут только студенты
  if (!userRole.isStudent?.value) {
    showError('Записываться на курсы могут только студенты')
    return
  }
  
  try {
    console.log('Записываемся на курс:', course.name, 'ID:', course.id)
    
    await lmsApi.enrollInCourse(course.id)
    
    // Обновляем статус курса
    course.isEnrolled = true
    course.enrollment_count = (course.enrollment_count || 0) + 1
    course.enrolled_students_count = (course.enrolled_students_count || 0) + 1
    
    showSuccess(`Вы успешно записались на курс "${course.name}"`)
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

function formatDate(dateString) {
  if (!dateString) return 'Не указано'
  return new Date(dateString).toLocaleDateString('ru-RU')
}

function getCategoryName(category) {
  if (!category) return 'Без категории'
  
  if (typeof category === 'object' && category.name) {
    return category.name
  }
  
  const categoryObj = categories.value.find(c => c.id === category)
  return categoryObj ? categoryObj.name : 'Без категории'
}

function getFormatName(format) {
  if (!format) return 'Не указано'
  
  if (typeof format === 'object' && format.name) {
    return format.name
  }
  
  if (!availableFormats.value || availableFormats.value.length === 0) return format
  const formatObj = availableFormats.value.find(f => f?.id === format)
  return formatObj?.name || format
}

function getTeacherName(teacher) {
  if (!teacher) return 'Не указано'
  
  if (typeof teacher === 'object' && teacher.full_name) {
    return teacher.full_name
  }
  
  if (typeof teacher === 'object') {
    if (teacher.first_name || teacher.last_name) {
      return `${teacher.first_name || ''} ${teacher.last_name || ''}`.trim()
    }
    return teacher.username || teacher.email || 'Неизвестный преподаватель'
  }
  
  return `ID: ${teacher}`
}

function getCourseImageUrl(course) {
  if (course.image) {
    if (typeof course.image === 'string') {
      return course.image.startsWith('http') ? course.image : `${window.location.origin}${course.image}`
    }
  }
  
  return null
}

function viewCourse(course) {
  console.log('Просмотр курса:', course.id)
  // Используем правильный маршрут для просмотра курса
  window.location.href = `/lms/course/${course.id}`
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
    <!-- Заголовок каталога курсов -->
    <div class="row mb-4">
      <div class="col-12">
        <div class="d-flex justify-content-between align-items-center mb-3">
          <h3 class="mb-0">Каталог курсов</h3>
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
                <div class="mb-2">
                  <h6 class="card-title">{{ course.name }}</h6>
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
                <div class="d-grid">
                  <!-- Кнопка записи для студентов (если авторизован и не записан) -->
                  <button 
                    v-if="userRole.isStudent?.value && !course.isEnrolled"
                    @click="enrollCourse(course)"
                    class="btn btn-primary btn-sm"
                    :disabled="!course.is_published"
                  >
                    Записаться
                  </button>
                  <!-- Кнопка изучения для записанных студентов -->
                  <router-link 
                    v-else-if="userRole.isStudent?.value && course.isEnrolled"
                    :to="`/lms/course/${course.id}`"
                    class="btn btn-success btn-sm"
                  >
                    <BookOpen :size="16" class="me-1" />
                    Изучать
                  </router-link>
                  <!-- Кнопка просмотра для преподавателей и администраторов -->
                  <button 
                    v-else-if="userRole.isTeacher?.value || userRole.isAdmin?.value"
                    @click="viewCourse(course)"
                    class="btn btn-outline-primary btn-sm"
                  >
                    <BookOpen :size="16" class="me-1" />
                    Просмотр курса
                  </button>
                  <!-- Кнопка просмотра для неавторизованных пользователей -->
                  <button 
                    v-else
                    @click="viewCourse(course)"
                    class="btn btn-outline-secondary btn-sm"
                  >
                    <BookOpen :size="16" class="me-1" />
                    Просмотр
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.search-container {
  max-width: 400px;
}
</style> 