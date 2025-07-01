<script setup>
import { ref, onMounted, computed } from 'vue'
import { BookOpen, Play, CheckCircle, Clock, Users, Star, Search, Filter } from 'lucide-vue-next'
import { apiClient } from '@/js/api/manager'
import { endpoints } from '@/js/api/endpoints'
import { useRouter } from 'vue-router'
import CourseImagePlaceholder from '../components/CourseImagePlaceholder.vue'

const router = useRouter()
const courses = ref([])
const loading = ref(true)
const searchQuery = ref('')
const selectedFilter = ref('all')

const filterOptions = [
  { value: 'all', label: 'Все курсы' },
  { value: 'active', label: 'Активные' },
  { value: 'completed', label: 'Завершенные' },
  { value: 'favorite', label: 'Избранные' }
]

const filteredCourses = computed(() => {
  let filtered = courses.value

  // Фильтрация по тексту
  if (searchQuery.value) {
    filtered = filtered.filter(course => {
      const subject = course.subject || course
      return (
        subject.name?.toLowerCase().includes(searchQuery.value.toLowerCase()) ||
        subject.description?.toLowerCase().includes(searchQuery.value.toLowerCase()) ||
        subject.teacher?.username?.toLowerCase().includes(searchQuery.value.toLowerCase())
      )
    })
  }

  // Фильтрация по статусу
  if (selectedFilter.value !== 'all') {
    filtered = filtered.filter(course => {
      switch (selectedFilter.value) {
        case 'active':
          return course.status === 'active'
        case 'completed':
          return course.status === 'completed'
        case 'favorite':
          return course.isFavorite
        default:
          return true
      }
    })
  }

  return filtered
})

async function fetchCourses() {
  try {
    loading.value = true
    const response = await apiClient.get(endpoints.lms.enrollments)
    
    // Получаем записи пользователя на курсы
    const enrollments = response.data.results || response.data || []
    
    // Преобразуем данные записей в формат, удобный для отображения
    courses.value = enrollments.map(enrollment => {
      const subject = enrollment.subject
      return {
        id: enrollment.id,
        subjectId: subject.id,
        name: subject.name,
        description: subject.description,
        summary: subject.summary,
        instructor: subject.teacher ? `${subject.teacher.first_name} ${subject.teacher.last_name}`.trim() || subject.teacher.username : 'Неизвестный преподаватель',
        progress: 0, // TODO: рассчитать прогресс
        status: enrollment.status,
        enrollmentDate: enrollment.enrollment_date,
        lastAccessed: enrollment.last_accessed || enrollment.enrollment_date,
        studentsCount: subject.enrolled_students_count || 0,
        rating: 0, // TODO: добавить рейтинг
        category: subject.category,
        course_format: subject.course_format,
        start_date: subject.start_date,
        end_date: subject.end_date,
        is_published: subject.is_published,
        isFavorite: enrollment.is_favorite || false,
        image: subject.image,
        subject: subject // Сохраняем полные данные курса
      }
    })
    
    console.log('Загружены мои курсы:', courses.value)
    
  } catch (error) {
    console.error('Ошибка загрузки моих курсов:', error)
    
    if (error.response?.status === 404 || error.response?.status === 401) {
      // Пользователь не записан ни на один курс или нет доступа
      courses.value = []
    } else {
      // Показываем ошибку
      console.error('Ошибка при загрузке курсов:', error)
      courses.value = []
    }
  } finally {
    loading.value = false
  }
}

function getStatusBadge(status) {
  switch (status) {
    case 'active':
      return { class: 'bg-primary', text: 'Активный' }
    case 'completed':
      return { class: 'bg-success', text: 'Завершен' }
    default:
      return { class: 'bg-secondary', text: 'Неизвестно' }
  }
}

function getCourseImageUrl(course) {
  if (course.image && typeof course.image === 'string') {
    return course.image.startsWith('http') ? course.image : `${window.location.origin}${course.image}`
  }
  
  // Возвращаем null для использования компонента-заглушки
  return null
}

function openCourse(courseId) {
  // Найдем курс по ID
  const course = courses.value.find(c => c.id === courseId)
  if (!course) {
    console.error('Курс не найден:', courseId)
    return
  }

  console.log('🔗 Переход к курсу:', course.name, 'ID:', course.subjectId)
  
  // Переходим на страницу курса
  router.push({
    name: 'LMSCourseView',
    params: { id: course.subjectId }
  })
}

// Удалены неиспользуемые функции showCourseResults, openLessonForCourse, isLessonCompleted

async function toggleFavorite(course) {
  try {
    if (course.isFavorite) {
      await apiClient.delete(`${endpoints.lms.subjects}${course.id}/favorite/`)
      course.isFavorite = false
    } else {
      await apiClient.post(`${endpoints.lms.subjects}${course.id}/favorite/`)
      course.isFavorite = true
    }
  } catch (error) {
    console.error('Ошибка изменения избранного:', error)
  }
}

onMounted(fetchCourses)
</script>

<template>
  <div class="courses-view">
    <div class="row mb-4">
      <div class="col-12">
        <div class="d-flex justify-content-between align-items-center flex-wrap gap-3">
          <h3 class="mb-0">Мои курсы</h3>
          <div class="d-flex gap-2">
            <div class="search-container">
              <div class="input-group">
                <span class="input-group-text border-end-0 bg-white">
                  <Search :size="18" class="text-muted" />
                </span>
                <input
                  v-model="searchQuery"
                  type="text"
                  class="form-control border-start-0"
                  placeholder="Поиск курсов..."
                />
              </div>
            </div>
            <select v-model="selectedFilter" class="form-select" style="width: auto;">
              <option v-for="option in filterOptions" :key="option.value" :value="option.value">
                {{ option.label }}
              </option>
            </select>
          </div>
        </div>
      </div>
    </div>

    <div v-if="loading" class="text-center py-5">
      <div class="spinner-border" role="status">
        <span class="visually-hidden">Загрузка...</span>
      </div>
    </div>

    <div v-else-if="filteredCourses.length === 0" class="text-center py-5">
      <BookOpen :size="48" class="text-muted mb-3" />
      <h5 class="text-muted">Курсы не найдены</h5>
      <p class="text-muted">Попробуйте изменить критерии поиска</p>
    </div>

    <div v-else class="row">
      <div v-for="course in filteredCourses" :key="course.id" class="col-lg-6 col-xl-4 mb-4">
        <div class="card course-card h-100">
          <div class="course-image">
            <img 
              v-if="getCourseImageUrl(course)"
              :src="getCourseImageUrl(course)" 
              :alt="course.name" 
              class="card-img-top" 
            />
            <CourseImagePlaceholder 
              v-else
              height="200px"
              :text="course.name || 'Курс'"
            />
            <div class="course-overlay">
              <button @click="openCourse(course.id)" class="btn btn-primary btn-sm">
                <Play :size="16" class="me-1" />
                {{ course.status === 'completed' ? 'Повторить' : 'Продолжить' }}
              </button>
            </div>
            <div class="course-favorite" @click="toggleFavorite(course)">
              <Star :size="18" :class="course.isFavorite ? 'text-warning filled' : 'text-white'" />
            </div>
          </div>
          
          <div class="card-body">
            <div class="d-flex justify-content-between align-items-start mb-2">
              <h6 class="card-title mb-0">{{ course.name }}</h6>
              <span :class="`badge ${getStatusBadge(course.status).class}`">
                {{ getStatusBadge(course.status).text }}
              </span>
            </div>
            
            <p class="text-muted small mb-2">{{ course.description }}</p>
            
            <div class="course-meta mb-3">
              <div class="d-flex align-items-center gap-3 text-muted small">
                <span class="d-flex align-items-center gap-1">
                  <Users :size="14" />
                  {{ course.studentsCount }}
                </span>
                <span v-if="course.start_date" class="d-flex align-items-center gap-1">
                  <Clock :size="14" />
                  Начало: {{ new Date(course.start_date).toLocaleDateString('ru') }}
                </span>
                <span v-if="course.rating > 0" class="d-flex align-items-center gap-1">
                  <Star :size="14" />
                  {{ course.rating }}
                </span>
              </div>
            </div>

            <div class="instructor mb-3">
              <small class="text-muted">Преподаватель: {{ course.instructor }}</small>
            </div>

            <div v-if="course.status === 'active'" class="progress-section">
              <div class="d-flex justify-content-between align-items-center mb-2">
                <small class="text-muted">Прогресс</small>
                <small class="fw-bold">{{ course.progress }}%</small>
              </div>
              <div class="progress mb-2" style="height: 6px;">
                <div class="progress-bar" :style="`width: ${course.progress}%`"></div>
              </div>
              <small class="text-muted">Записан: {{ new Date(course.enrollmentDate).toLocaleDateString('ru') }}</small>
            </div>

            <div v-else-if="course.status === 'completed'" class="completed-section text-center">
              <CheckCircle :size="24" class="text-success mb-2" />
              <small class="text-muted">Завершен {{ course.lastAccessed ? new Date(course.lastAccessed).toLocaleDateString('ru') : 'недавно' }}</small>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style lang="scss" scoped>
.courses-view {
  .search-container {
    min-width: 250px;
  }
  
  .course-card {
    transition: transform 0.2s, box-shadow 0.2s;
    
    &:hover {
      transform: translateY(-4px);
      box-shadow: 0 8px 25px rgba(0, 0, 0, 0.1);
    }
    
    .course-image {
      position: relative;
      overflow: hidden;
      height: 200px;
      
      img {
        width: 100%;
        height: 100%;
        object-fit: cover;
        transition: transform 0.3s;
      }
      
      .course-overlay {
        position: absolute;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background: rgba(0, 0, 0, 0.6);
        display: flex;
        align-items: center;
        justify-content: center;
        opacity: 0;
        transition: opacity 0.3s;
      }
      
      .course-favorite {
        position: absolute;
        top: 12px;
        right: 12px;
        width: 36px;
        height: 36px;
        background: rgba(0, 0, 0, 0.5);
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        cursor: pointer;
        transition: background 0.2s;
        
        &:hover {
          background: rgba(0, 0, 0, 0.7);
        }
      }
      
      &:hover {
        img {
          transform: scale(1.05);
        }
        
        .course-overlay {
          opacity: 1;
        }
      }
    }
    
    .course-meta {
      border-bottom: 1px solid var(--bs-border-color);
      padding-bottom: 0.75rem;
    }
    
    .progress-section {
      .progress {
        background: var(--bs-gray-200);
      }
    }
  }
  
  .filled {
    fill: currentColor;
  }
}

@media (max-width: 768px) {
  .courses-view {
    .search-container {
      min-width: 200px;
    }
    
    .d-flex.justify-content-between {
      flex-direction: column;
      align-items: flex-start !important;
      
      .d-flex.gap-2 {
        width: 100%;
        margin-top: 1rem;
        
        .search-container {
          flex: 1;
          min-width: auto;
        }
      }
    }
  }
}
</style> 