<script setup>
import { ref, computed, onMounted } from 'vue'
import { BookOpen, FileCheck, Award, Clock, TrendingUp, Users, Star, MessageSquare, GraduationCap, ClipboardCheck } from 'lucide-vue-next'
import { useUserRole } from '../composables/useUserRole'
import { useLmsData } from '../composables/useApi'
import { useUtils } from '../composables/useUtils'
import BaseCard from '../components/BaseCard.vue'

const { lmsApi, loading } = useLmsData()
const userRole = useUserRole()
const { formatDate, formatRelativeTime } = useUtils()

const dashboardData = ref({
  stats: {},
  recentCourses: [],
  upcomingEvents: [],
  notifications: [],
  achievements: []
})

// Данные в зависимости от роли
const roleBasedData = computed(() => {
  if (userRole.isTeacher.value) {
    return {
      statsLabels: {
        createdCourses: 'Созданных курсов',
        totalStudents: 'Всего студентов',
        pendingGrades: 'К проверке',
        teachingHours: 'Часов преподавания'
      },
      statsIcons: [BookOpen, Users, ClipboardCheck, Clock]
    }
  } else if (userRole.isAdmin.value) {
    return {
      statsLabels: {
        totalCourses: 'Всего курсов',
        totalStudents: 'Всего студентов',
        totalTeachers: 'Преподавателей',
        systemHealth: 'Работоспособность'
      },
      statsIcons: [BookOpen, Users, GraduationCap, TrendingUp]
    }
  } else {
    return {
      statsLabels: {
        enrolledCourses: 'Записанных курсов',
        completedTests: 'Пройденных тестов',
        earnedBadges: 'Получено значков',
        studyHours: 'Часов обучения'
      },
      statsIcons: [BookOpen, FileCheck, Award, Clock]
    }
  }
})

async function loadDashboardData() {
  try {
    let response
    
    if (userRole.isStudent.value) {
      response = await lmsApi.getStudentStats()
      dashboardData.value = processStudentData(response?.data)
    } else if (userRole.isTeacher.value) {
      response = await lmsApi.getTeacherStats()
      dashboardData.value = processTeacherData(response?.data)
    } else {
      response = await lmsApi.getDashboardData()
      dashboardData.value = processAdminData(response?.data)
    }
  } catch (error) {
    console.error('Ошибка загрузки данных дашборда:', error)
    // Показываем пустые данные при ошибке
    dashboardData.value = getEmptyData()
  }
}

function processStudentData(data) {
  if (!data) return getEmptyStudentData()
  
  return {
    stats: {
      enrolledCourses: data.enrolled_courses || 0,
      completedTests: data.tests_completed || 0,
      earnedBadges: data.badges_count || 0,
      studyHours: data.study_hours || 0
    },
    recentCourses: data.recent_courses || [],
    upcomingEvents: data.upcoming_events || [],
    notifications: data.notifications || [],
    achievements: data.achievements || []
  }
}

function processTeacherData(data) {
  if (!data) return getEmptyTeacherData()
  
  return {
    stats: {
      createdCourses: data.total_courses || 0,
      totalStudents: data.total_students || 0,
      pendingGrades: data.pending_grades || 0,
      teachingHours: data.teaching_hours || 0
    },
    recentCourses: data.recent_courses || [],
    upcomingEvents: data.upcoming_events || [],
    notifications: data.notifications || [],
    achievements: data.achievements || []
  }
}

function processAdminData(data) {
  if (!data) return getEmptyAdminData()
  
  return {
    stats: {
      totalCourses: data.total_courses || 0,
      totalStudents: data.total_students || 0,
      totalTeachers: data.total_teachers || 0,
      systemHealth: data.system_health || 0
    },
    recentCourses: data.recent_courses || [],
    upcomingEvents: data.upcoming_events || [],
    notifications: data.notifications || [],
    achievements: data.achievements || []
  }
}

// Функции для пустых состояний (когда нет данных с сервера)
function getEmptyStudentData() {
  return {
    stats: {
      enrolledCourses: 0,
      completedTests: 0,
      earnedBadges: 0,
      studyHours: 0
    },
    recentCourses: [],
    upcomingEvents: [],
    notifications: [],
    achievements: []
  }
}

function getEmptyTeacherData() {
  return {
    stats: {
      createdCourses: 0,
      totalStudents: 0,
      pendingGrades: 0,
      teachingHours: 0
    },
    recentCourses: [],
    upcomingEvents: [],
    notifications: [],
    achievements: []
  }
}

function getEmptyAdminData() {
  return {
    stats: {
      totalCourses: 0,
      totalStudents: 0,
      totalTeachers: 0,
      systemHealth: 0
    },
    recentCourses: [],
    upcomingEvents: [],
    notifications: [],
    achievements: []
  }
}

function getEmptyData() {
  if (userRole.isStudent.value) {
    return getEmptyStudentData()
  } else if (userRole.isTeacher.value) {
    return getEmptyTeacherData()
  } else {
    return getEmptyAdminData()
  }
}

// Функция для получения цвета статистики
function getStatColor(index) {
  const colors = ['primary', 'success', 'warning', 'info']
  return colors[index % colors.length]
}

// Функция для получения типа уведомления
function getNotificationType(type) {
  const typeMap = {
    'success': 'success',
    'error': 'danger',
    'warning': 'warning',
    'info': 'info',
    'assignment': 'primary',
    'badge': 'success',
    'enrollment': 'info',
    'grading': 'warning'
  }
  return typeMap[type] || 'info'
}

// Заголовок в зависимости от роли
const welcomeMessage = computed(() => {
  if (userRole.isTeacher.value) {
    return 'Добро пожаловать в панель преподавателя!'
  } else if (userRole.isAdmin.value) {
    return 'Добро пожаловать в панель администратора!'
  } else {
    return 'Добро пожаловать в систему обучения!'
  }
})

onMounted(loadDashboardData)
</script>

<template>
  <div class="dashboard">
    <div class="row mb-4">
      <div class="col-12">
        <h3 class="mb-3">{{ welcomeMessage }}</h3>
        <p v-if="userRole.primaryRole.value" class="text-muted">
          Вы вошли как <strong>{{ userRole.getRoleDisplayName(userRole.primaryRole.value) }}</strong>
        </p>
      </div>
    </div>

    <!-- Статистические карточки -->
    <div class="row mb-4">
      <div 
        v-for="(value, key, index) in dashboardData.stats" 
        :key="key"
        class="col-lg-3 col-md-6 mb-3"
      >
        <div class="card stats-card text-center h-100">
          <div class="card-body">
            <div :class="`stats-icon bg-${getStatColor(index)}-subtle text-${getStatColor(index)} mb-3`">
              <component :is="roleBasedData.statsIcons[index]" :size="24" />
            </div>
            <h4 class="mb-1">{{ value }}</h4>
            <p class="text-muted mb-0">{{ roleBasedData.statsLabels[key] }}</p>
          </div>
        </div>
      </div>
    </div>

    <div class="row">
      <!-- Недавние курсы -->
      <div class="col-lg-6 mb-4">
        <div class="card h-100">
          <div class="card-header d-flex align-items-center gap-2">
            <TrendingUp :size="20" />
            <h5 class="mb-0">Текущие курсы</h5>
          </div>
          <div class="card-body">
            <div v-if="loading" class="text-center py-4">
              <div class="spinner-border" role="status">
                <span class="visually-hidden">Загрузка...</span>
              </div>
            </div>
            <div v-else-if="!dashboardData.recentCourses || dashboardData.recentCourses.length === 0" class="text-center py-4 text-muted">
              <BookOpen :size="32" class="mb-2" />
              <p class="mb-0">Нет активных курсов</p>
              <small>Запишитесь на курсы в каталоге</small>
            </div>
            <div v-else>
              <div v-for="course in dashboardData.recentCourses" :key="course.id" class="course-item mb-3">
                <div class="d-flex justify-content-between align-items-start mb-2">
                  <div>
                    <h6 class="mb-1">{{ course.name || course.title }}</h6>
                    <p class="text-muted small mb-1">
                      Преподаватель: {{ course.instructor || course.teacher?.username || 'Не указан' }}
                    </p>
                  </div>
                  <span class="badge bg-primary">{{ course.progress || 0 }}%</span>
                </div>
                <div class="progress" style="height: 6px;">
                  <div class="progress-bar" role="progressbar" :style="`width: ${course.progress || 0}%`"></div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Предстоящие события -->
      <div class="col-lg-6 mb-4">
        <div class="card h-100">
          <div class="card-header d-flex align-items-center gap-2">
            <Clock :size="20" />
            <h5 class="mb-0">Предстоящие события</h5>
          </div>
          <div class="card-body">
            <div v-if="loading" class="text-center py-4">
              <div class="spinner-border" role="status">
                <span class="visually-hidden">Загрузка...</span>
              </div>
            </div>
            <div v-else-if="!dashboardData.upcomingEvents || dashboardData.upcomingEvents.length === 0" class="text-center py-4 text-muted">
              <Clock :size="32" class="mb-2" />
              <p class="mb-0">Нет предстоящих событий</p>
            </div>
            <div v-else>
              <div v-for="event in dashboardData.upcomingEvents" :key="event.id" class="event-item d-flex align-items-center gap-3 mb-3">
                <div class="event-date text-center">
                  <div class="date-day fw-bold">{{ formatDate(event.date, { day: 'numeric' }) }}</div>
                  <div class="date-month small text-muted">
                    {{ formatDate(event.date, { month: 'short' }) }}
                  </div>
                </div>
                <div class="flex-grow-1">
                  <h6 class="mb-1">{{ event.title || event.name }}</h6>
                  <p class="text-muted small mb-0">{{ event.description || formatDate(event.date, { hour: '2-digit', minute: '2-digit' }) }}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Уведомления и достижения -->
    <div class="row">
      <div class="col-lg-8 mb-4">
        <div class="card">
          <div class="card-header d-flex align-items-center gap-2">
            <MessageSquare :size="20" />
            <h5 class="mb-0">Последние уведомления</h5>
          </div>
          <div class="card-body">
            <div v-if="loading" class="text-center py-4">
              <div class="spinner-border" role="status">
                <span class="visually-hidden">Загрузка...</span>
              </div>
            </div>
            <div v-else-if="!dashboardData.notifications || dashboardData.notifications.length === 0" class="text-center py-4 text-muted">
              <MessageSquare :size="32" class="mb-2" />
              <p class="mb-0">Нет новых уведомлений</p>
            </div>
            <div v-else>
              <div v-for="notification in dashboardData.notifications" :key="notification.id" 
                   :class="`alert alert-${getNotificationType(notification.type)} py-2 mb-2`">
                <div class="d-flex justify-content-between align-items-start">
                  <div>
                    {{ notification.message || notification.text }}
                  </div>
                  <small class="text-muted">{{ formatRelativeTime(notification.createdAt || notification.created_at) }}</small>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div class="col-lg-4 mb-4">
        <div class="card">
          <div class="card-header d-flex align-items-center gap-2">
            <Award :size="20" />
            <h5 class="mb-0">Достижения</h5>
          </div>
          <div class="card-body">
            <div v-for="achievement in (dashboardData.achievements || [])" :key="achievement.id" class="achievement-item d-flex align-items-center gap-3 mb-3">
              <div class="achievement-icon">
                <Star :size="20" :class="achievement.earned ? 'text-warning' : 'text-muted'" />
              </div>
              <div class="flex-grow-1">
                <h6 class="mb-1" :class="achievement.earned ? '' : 'text-muted'">{{ achievement.title }}</h6>
                <p class="text-muted small mb-0">{{ achievement.description }}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style lang="scss" scoped>
.dashboard {
  .stats-card {
    transition: transform 0.2s;
    
    &:hover {
      transform: translateY(-2px);
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
  }
  
  .course-item {
    padding-bottom: 1rem;
    border-bottom: 1px solid var(--bs-border-color);
    
    &:last-child {
      border-bottom: none;
      padding-bottom: 0;
    }
  }
  
  .event-item {
    .event-date {
      width: 60px;
      padding: 8px;
      border: 2px solid var(--bs-primary);
      border-radius: 8px;
      
      .date-day {
        font-size: 1.2rem;
        color: var(--bs-primary);
      }
    }
  }
  
  .achievement-item {
    .achievement-icon {
      width: 40px;
      height: 40px;
      border-radius: 50%;
      background: var(--bs-light);
      display: flex;
      align-items: center;
      justify-content: center;
    }
  }
}
</style> 