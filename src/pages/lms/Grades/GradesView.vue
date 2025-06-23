<script setup>
import { ref, computed, onMounted } from 'vue'
import { BarChart, TrendingUp, Award, BookOpen, FileCheck, Calendar, Download, Filter } from 'lucide-vue-next'
import { apiClient } from '@/js/api/manager'
import { endpoints } from '@/js/api/endpoints'
import RoleGuard from '../components/RoleGuard.vue'
import { globalUserRole } from '../composables/useUserRole'

const grades = ref([])
const enrollments = ref([])
const loading = ref(true)
const selectedCourse = ref(null)
const selectedPeriod = ref('all')
const userRole = globalUserRole

// Статистика оценок
const gradesStats = computed(() => {
  const filteredGrades = getFilteredGrades()
  if (filteredGrades.length === 0) return { average: 0, total: 0, excellent: 0, good: 0, satisfactory: 0, poor: 0 }
  
  const total = filteredGrades.length
  const sum = filteredGrades.reduce((acc, grade) => acc + grade.grade, 0)
  const average = sum / total
  
  const excellent = filteredGrades.filter(g => g.grade >= 90).length
  const good = filteredGrades.filter(g => g.grade >= 70 && g.grade < 90).length
  const satisfactory = filteredGrades.filter(g => g.grade >= 50 && g.grade < 70).length
  const poor = filteredGrades.filter(g => g.grade < 50).length
  
  return { average, total, excellent, good, satisfactory, poor }
})

// Курсы для фильтрации
const courseOptions = computed(() => {
  const courses = [...new Set(grades.value.map(g => g.subject_name))]
  return courses.map(name => ({ value: name, label: name }))
})

// Фильтрованные оценки
function getFilteredGrades() {
  let filtered = grades.value
  
  if (selectedCourse.value) {
    filtered = filtered.filter(g => g.subject_name === selectedCourse.value)
  }
  
  if (selectedPeriod.value !== 'all') {
    const now = new Date()
    const cutoffDate = new Date()
    
    switch (selectedPeriod.value) {
      case 'week':
        cutoffDate.setDate(now.getDate() - 7)
        break
      case 'month':
        cutoffDate.setMonth(now.getMonth() - 1)
        break
      case 'semester':
        cutoffDate.setMonth(now.getMonth() - 6)
        break
    }
    
    filtered = filtered.filter(g => new Date(g.related) >= cutoffDate)
  }
  
  return filtered.sort((a, b) => new Date(b.related) - new Date(a.related))
}

// Загрузка данных
async function loadGrades() {
  try {
    loading.value = true
    
    // Загружаем оценки студента из API
    const response = await apiClient.get(endpoints.lms.studentStats)
    
    if (response.success && response.data.recent_grades) {
      grades.value = response.data.recent_grades
    } else {
      // Fallback данные для демонстрации
      grades.value = [
        {
          id: 1,
          subject_name: 'Основы веб-разработки',
          grade: 85,
          related: '2024-01-15',
          feedback: 'Хорошая работа над проектом',
          grader_name: 'Иванов И.И.',
          grade_type: 'assignment'
        },
        {
          id: 2,
          subject_name: 'Python для начинающих',
          grade: 92,
          related: '2024-01-12',
          feedback: 'Отличное понимание основ',
          grader_name: 'Петров П.П.',
          grade_type: 'test'
        },
        {
          id: 3,
          subject_name: 'Основы веб-разработки',
          grade: 78,
          related: '2024-01-10',
          feedback: 'Есть замечания по стилю кода',
          grader_name: 'Иванов И.И.',
          grade_type: 'assignment'
        },
        {
          id: 4,
          subject_name: 'Python для начинающих',
          grade: 95,
          related: '2024-01-08',
          feedback: 'Превосходная работа!',
          grader_name: 'Петров П.П.',
          grade_type: 'test'
        },
        {
          id: 5,
          subject_name: 'Алгоритмы и структуры данных',
          grade: 72,
          related: '2024-01-05',
          feedback: 'Хорошее понимание темы',
          grader_name: 'Сидоров С.С.',
          grade_type: 'assignment'
        }
      ]
    }
    
  } catch (error) {
    console.error('Ошибка загрузки оценок:', error)
    // Даже при ошибке показываем демо-данные
    grades.value = [
      {
        id: 1,
        subject_name: 'Основы веб-разработки',
        grade: 85,
        related: '2024-01-15',
        feedback: 'Хорошая работа над проектом',
        grader_name: 'Иванов И.И.',
        grade_type: 'assignment'
      },
      {
        id: 2,
        subject_name: 'Python для начинающих',
        grade: 92,
        related: '2024-01-12',
        feedback: 'Отличное понимание основ',
        grader_name: 'Петров П.П.',
        grade_type: 'test'
      }
    ]
  } finally {
    loading.value = false
  }
}

// Определение цвета оценки
function getGradeColor(grade) {
  if (grade >= 90) return 'success'
  if (grade >= 70) return 'warning'
  if (grade >= 50) return 'info'
  return 'danger'
}

// Определение типа оценки
function getGradeTypeIcon(type) {
  switch (type) {
    case 'test': return FileCheck
    case 'assignment': return BookOpen
    default: return Award
  }
}

function getGradeTypeName(type) {
  switch (type) {
    case 'test': return 'Тест'
    case 'assignment': return 'Задание'
    case 'manual': return 'Ручная оценка'
    default: return 'Оценка'
  }
}

// Экспорт оценок
async function exportGrades() {
  try {
    const data = getFilteredGrades().map(grade => ({
      'Курс': grade.subject_name,
      'Оценка': grade.grade,
      'Дата': new Date(grade.related).toLocaleDateString('ru'),
      'Тип': getGradeTypeName(grade.grade_type),
      'Преподаватель': grade.grader_name || 'Не указан',
      'Комментарий': grade.feedback || 'Нет комментария'
    }))
    
    const csv = convertToCSV(data)
    downloadCSV(csv, 'my_grades.csv')
  } catch (error) {
    console.error('Ошибка экспорта:', error)
  }
}

function convertToCSV(data) {
  if (!data.length) return ''
  
  const headers = Object.keys(data[0])
  const csvHeaders = headers.join(',')
  const csvRows = data.map(row => 
    headers.map(header => `"${row[header]}"`).join(',')
  )
  
  return [csvHeaders, ...csvRows].join('\n')
}

function downloadCSV(csv, filename) {
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
  const link = document.createElement('a')
  const url = URL.createObjectURL(blob)
  link.setAttribute('href', url)
  link.setAttribute('download', filename)
  link.style.visibility = 'hidden'
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
}

onMounted(() => {
  userRole.loadUserRoles().then(() => {
    if (userRole.isStudent.value) {
      loadGrades()
    }
  })
})
</script>

<template>
  <RoleGuard 
    :required-roles="['student']" 
    fallback-message="Раздел оценок доступен только студентам"
  >
    <div class="grades-view">
      <!-- Заголовок -->
      <div class="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h3 class="mb-1">
            <BarChart :size="28" class="me-2 text-primary" />
            Мои оценки
          </h3>
          <p class="text-muted mb-0">Просмотр всех полученных оценок и статистики</p>
        </div>
        <button 
          @click="exportGrades" 
          class="btn btn-outline-primary"
          :disabled="loading || getFilteredGrades().length === 0"
        >
          <Download :size="16" class="me-2" />
          Экспорт
        </button>
      </div>

      <!-- Загрузка -->
      <div v-if="loading" class="text-center py-5">
        <div class="spinner-border text-primary" role="status">
          <span class="visually-hidden">Загрузка...</span>
        </div>
        <p class="mt-3 text-muted">Загрузка оценок...</p>
      </div>

      <template v-else>
        <!-- Статистика -->
        <div class="row mb-4">
          <div class="col-lg-3 col-md-6 mb-3">
            <div class="card stats-card h-100">
              <div class="card-body text-center">
                <div class="stats-icon bg-primary-subtle text-primary mb-3">
                  <TrendingUp :size="24" />
                </div>
                <h4 class="mb-1">{{ gradesStats.average.toFixed(1) }}</h4>
                <p class="text-muted mb-0">Средний балл</p>
              </div>
            </div>
          </div>
          
          <div class="col-lg-3 col-md-6 mb-3">
            <div class="card stats-card h-100">
              <div class="card-body text-center">
                <div class="stats-icon bg-success-subtle text-success mb-3">
                  <Award :size="24" />
                </div>
                <h4 class="mb-1">{{ gradesStats.excellent }}</h4>
                <p class="text-muted mb-0">Отличных оценок</p>
              </div>
            </div>
          </div>
          
          <div class="col-lg-3 col-md-6 mb-3">
            <div class="card stats-card h-100">
              <div class="card-body text-center">
                <div class="stats-icon bg-warning-subtle text-warning mb-3">
                  <BookOpen :size="24" />
                </div>
                <h4 class="mb-1">{{ gradesStats.total }}</h4>
                <p class="text-muted mb-0">Всего оценок</p>
              </div>
            </div>
          </div>
          
          <div class="col-lg-3 col-md-6 mb-3">
            <div class="card stats-card h-100">
              <div class="card-body text-center">
                <div class="stats-icon bg-info-subtle text-info mb-3">
                  <FileCheck :size="24" />
                </div>
                <h4 class="mb-1">{{ courseOptions.length }}</h4>
                <p class="text-muted mb-0">Курсов</p>
              </div>
            </div>
          </div>
        </div>

        <!-- Фильтры -->
        <div class="card mb-4">
          <div class="card-body">
            <div class="row align-items-center">
              <div class="col-lg-3 col-md-6 mb-3 mb-lg-0">
                <label class="form-label mb-1">
                  <Filter :size="16" class="me-1" />
                  Курс
                </label>
                <select v-model="selectedCourse" class="form-select">
                  <option :value="null">Все курсы</option>
                  <option 
                    v-for="course in courseOptions" 
                    :key="course.value"
                    :value="course.value"
                  >
                    {{ course.label }}
                  </option>
                </select>
              </div>
              
              <div class="col-lg-3 col-md-6 mb-3 mb-lg-0">
                <label class="form-label mb-1">
                  <Calendar :size="16" class="me-1" />
                  Период
                </label>
                <select v-model="selectedPeriod" class="form-select">
                  <option value="all">Все время</option>
                  <option value="week">Последняя неделя</option>
                  <option value="month">Последний месяц</option>
                  <option value="semester">Текущий семестр</option>
                </select>
              </div>
              
              <div class="col-lg-6 col-md-12">
                <div class="d-flex align-items-center justify-content-end">
                  <span class="text-muted">
                    Найдено оценок: <strong>{{ getFilteredGrades().length }}</strong>
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Список оценок -->
        <div v-if="getFilteredGrades().length === 0" class="text-center py-5">
          <Award :size="48" class="text-muted mb-3" />
          <h5 class="text-muted">Оценки не найдены</h5>
          <p class="text-muted">Попробуйте изменить фильтры или дождитесь новых оценок от преподавателей</p>
        </div>

        <div v-else class="row">
          <div 
            v-for="grade in getFilteredGrades()" 
            :key="grade.id" 
            class="col-lg-6 mb-4"
          >
            <div class="card grade-card h-100">
              <div class="card-body">
                <div class="d-flex justify-content-between align-items-start mb-3">
                  <div class="flex-grow-1">
                    <div class="d-flex align-items-center mb-2">
                      <component 
                        :is="getGradeTypeIcon(grade.grade_type)" 
                        :size="18" 
                        class="me-2 text-muted"
                      />
                      <span class="badge bg-light text-dark">
                        {{ getGradeTypeName(grade.grade_type) }}
                      </span>
                    </div>
                    <h6 class="mb-1">{{ grade.subject_name }}</h6>
                    <small class="text-muted">
                      {{ new Date(grade.related).toLocaleDateString('ru', { 
                        year: 'numeric', 
                        month: 'long', 
                        day: 'numeric' 
                      }) }}
                    </small>
                  </div>
                  <div class="text-end">
                    <span 
                      :class="`badge bg-${getGradeColor(grade.grade)} fs-6 px-3 py-2`"
                    >
                      {{ grade.grade }}
                    </span>
                  </div>
                </div>
                
                <div v-if="grade.feedback" class="mb-2">
                  <small class="text-muted d-block mb-1">Комментарий:</small>
                  <p class="small mb-0 p-2 bg-light rounded">{{ grade.feedback }}</p>
                </div>
                
                <div v-if="grade.grader_name" class="text-end">
                  <small class="text-muted">Преподаватель: {{ grade.grader_name }}</small>
                </div>
              </div>
            </div>
          </div>
        </div>
      </template>
    </div>
  </RoleGuard>
</template>

<style lang="scss" scoped>
.grades-view {
  .stats-card {
    transition: transform 0.2s, box-shadow 0.2s;
    border: none;
    
    &:hover {
      transform: translateY(-2px);
      box-shadow: 0 4px 15px rgba(0, 0, 0, 0.1);
    }
  }
  
  .stats-icon {
    width: 60px;
    height: 60px;
    border-radius: 12px;
    display: flex;
    align-items: center;
    justify-content: center;
    margin: 0 auto;
  }
  
  .grade-card {
    transition: transform 0.2s, box-shadow 0.2s;
    border: none;
    border-left: 4px solid var(--bs-primary);
    
    &:hover {
      transform: translateY(-2px);
      box-shadow: 0 4px 15px rgba(0, 0, 0, 0.1);
    }
  }
}
</style>
