<template>
  <div class="course-list">
    <!-- Поиск и фильтры -->
    <SearchAndFilter
      v-model="filters"
      :filters="filterOptions"
      search-placeholder="Поиск курсов..."
      @filter-change="onFilterChange"
    />

    <!-- Загрузка -->
    <BaseCard
      v-if="loading"
      loading
      loading-text="Загрузка курсов..."
      empty-icon="BookOpen"
    />

    <!-- Список курсов -->
    <div v-else-if="filteredCourses.length > 0" class="row">
      <div 
        v-for="course in filteredCourses" 
        :key="course.id"
        class="col-md-6 col-lg-4 mb-4"
      >
        <BaseCard
          :title="course.name"
          :subtitle="course.instructor"
          shadow
          clickable
          show-dropdown
          @click="openCourse(course.id)"
        >
          <template #dropdown-items>
            <li><a class="dropdown-item" href="#" @click.prevent="viewCourse(course)">
              <Eye :size="16" class="me-2" />Просмотр
            </a></li>
            <li><a class="dropdown-item" href="#" @click.prevent="enrollInCourse(course.id)">
              <Users :size="16" class="me-2" />Записаться
            </a></li>
            <li><a class="dropdown-item" href="#" @click.prevent="toggleFavorite(course)">
              <Star :size="16" class="me-2" />{{ course.isFavorite ? 'Убрать из избранного' : 'В избранное' }}
            </a></li>
          </template>

          <!-- Изображение курса -->
          <div class="course-image mb-3">
            <img 
              v-if="getCourseImageUrl(course)"
              :src="getCourseImageUrl(course)"
              :alt="course.name"
              class="img-fluid rounded"
            />
            <CourseImagePlaceholder v-else :course-name="course.name" />
          </div>

          <!-- Описание -->
          <p class="text-muted small mb-3">
            {{ truncateText(course.description, 100) }}
          </p>

          <!-- Метаданные -->
          <div class="course-meta small text-muted mb-3">
            <div class="d-flex align-items-center gap-2 mb-1">
              <Calendar :size="14" />
              <span>{{ formatDate(course.start_date) }}</span>
            </div>
            <div class="d-flex align-items-center gap-2">
              <Users :size="14" />
              <span>{{ course.studentsCount || 0 }} студентов</span>
            </div>
          </div>

          <template #footer>
            <div class="d-flex justify-content-between align-items-center">
              <div class="d-flex gap-2">
                <span v-if="course.status" :class="getStatusBadge(course.status).class" class="badge">
                  {{ getStatusBadge(course.status).text }}
                </span>
                <span v-if="course.isFavorite" class="badge bg-warning">
                  <Star :size="12" /> Избранный
                </span>
              </div>
              
              <!-- Прогресс для записанных курсов -->
              <div v-if="course.progress !== undefined" class="progress-info">
                <small class="text-muted">{{ course.progress }}%</small>
                <div class="progress mt-1" style="height: 4px; width: 60px;">
                  <div 
                    class="progress-bar"
                    :class="`bg-${getProgressColor(course.progress)}`"
                    :style="`width: ${course.progress}%`"
                  ></div>
                </div>
              </div>
            </div>
          </template>
        </BaseCard>
      </div>
    </div>

    <!-- Пустое состояние -->
    <BaseCard
      v-else
      empty-text="Курсы не найдены"
      empty-icon="BookOpen"
    />
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { Eye, Users, Star, Calendar } from 'lucide-vue-next'
import { useLmsData } from '../composables/useApi'
import { useUtils, STATUS_BADGES } from '../composables/useUtils'
import { useNotifications } from '../composables/useNotifications'
import BaseCard from './BaseCard.vue'
import SearchAndFilter from './SearchAndFilter.vue'
import CourseImagePlaceholder from './CourseImagePlaceholder.vue'

const props = defineProps({
  // Фильтр по типу курсов (все, мои, доступные)
  courseType: {
    type: String,
    default: 'all', // 'all', 'enrolled', 'available'
    validator: value => ['all', 'enrolled', 'available'].includes(value)
  },
  // Показывать ли кнопки записи
  showEnrollActions: {
    type: Boolean,
    default: true
  }
})

const emit = defineEmits(['course-selected', 'enrollment-changed'])

const { lmsApi, loading } = useLmsData()
const { formatDate, truncateText, getProgressColor, createSearchFilter } = useUtils()
const { showSuccess, showError, showConfirmDialog } = useNotifications()

// Данные
const courses = ref([])
const filters = ref({
  search: '',
  category: '',
  status: '',
  instructor: ''
})

// Опции фильтров
const filterOptions = computed(() => [
  {
    key: 'category',
    label: 'Категория',
    type: 'select',
    options: getCategoryOptions(),
    cols: 'col-md-3'
  },
  {
    key: 'status',
    label: 'Статус',
    type: 'select',
    options: getStatusOptions(),
    cols: 'col-md-3'
  },
  {
    key: 'instructor',
    label: 'Преподаватель',
    type: 'select',
    options: getInstructorOptions(),
    cols: 'col-md-3'
  }
])

// Фильтрованные курсы
const filteredCourses = computed(() => {
  let filtered = courses.value

  // Поиск
  if (filters.value.search) {
    const searchFilter = createSearchFilter(filters.value.search, ['name', 'description', 'instructor'])
    filtered = filtered.filter(searchFilter)
  }

  // Фильтры
  if (filters.value.category) {
    filtered = filtered.filter(course => course.category === filters.value.category)
  }

  if (filters.value.status) {
    filtered = filtered.filter(course => course.status === filters.value.status)
  }

  if (filters.value.instructor) {
    filtered = filtered.filter(course => course.instructor_id === filters.value.instructor)
  }

  return filtered
})

// Методы
async function loadCourses() {
  try {
    let response
    
    switch (props.courseType) {
      case 'enrolled':
        response = await lmsApi.getEnrollments()
        courses.value = response.data.results?.map(enrollment => ({
          ...enrollment.subject,
          progress: enrollment.progress || 0,
          status: enrollment.status,
          enrollmentDate: enrollment.enrollment_date
        })) || []
        break
        
      case 'available':
        response = await lmsApi.getCourses()
        courses.value = response.data.results?.filter(course => course.is_published) || []
        break
        
      default:
        response = await lmsApi.getCourses()
        courses.value = response.data.results || []
    }
  } catch (error) {
    showError('Ошибка загрузки курсов')
    console.error('Ошибка загрузки курсов:', error)
  }
}

function getCategoryOptions() {
  const categories = [...new Set(courses.value.map(c => c.category).filter(Boolean))]
  return categories.map(cat => ({ value: cat, label: cat }))
}

function getStatusOptions() {
  return Object.entries(STATUS_BADGES).map(([key, value]) => ({
    value: key,
    label: value.text
  }))
}

function getInstructorOptions() {
  const instructors = [...new Set(courses.value.map(c => ({
    id: c.instructor_id,
    name: c.instructor
  })).filter(i => i.name))]
  
  return instructors.map(instructor => ({
    value: instructor.id,
    label: instructor.name
  }))
}

function getStatusBadge(status) {
  return STATUS_BADGES[status] || { class: 'bg-secondary', text: 'Неизвестно' }
}

function getCourseImageUrl(course) {
  if (!course.image) return null
  
  // Возвращаем реальный URL изображения
  return course.image.startsWith('http') ? course.image : `${window.location.origin}${course.image}`
}

async function enrollInCourse(courseId) {
  try {
    await lmsApi.enrollInCourse(courseId)
    emit('enrollment-changed', { courseId, action: 'enrolled' })
    await loadCourses() // Перезагружаем список
  } catch (error) {
    showError('Ошибка при записи на курс')
  }
}

async function toggleFavorite(course) {
  try {
    // Вызываем API для добавления/удаления из избранного
    if (course.isFavorite) {
      await lmsApi.removeFromFavorites(course.id)
      course.isFavorite = false
      showSuccess('Удалено из избранного')
    } else {
      await lmsApi.addToFavorites(course.id)
      course.isFavorite = true
      showSuccess('Добавлено в избранное')
    }
  } catch (error) {
    showError('Ошибка при изменении избранного')
    console.error('Ошибка избранного:', error)
  }
}

function openCourse(courseId) {
  emit('course-selected', courseId)
}

function viewCourse(course) {
  // Открытие модального окна с подробностями курса
  console.log('Просмотр курса:', course)
}

function onFilterChange(filterData) {
  // Обработка изменения фильтров
  console.log('Фильтры изменены:', filterData)
}

onMounted(loadCourses)
</script>

<style scoped>
.course-image {
  height: 160px;
  overflow: hidden;
  border-radius: 0.375rem;
}

.course-image img {
  height: 100%;
  width: 100%;
  object-fit: cover;
}

.course-meta {
  border-top: 1px solid var(--bs-border-color);
  padding-top: 0.75rem;
}

.progress-info {
  text-align: right;
}
</style> 