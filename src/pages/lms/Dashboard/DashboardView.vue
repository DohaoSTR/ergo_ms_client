<script setup>
import { ref, computed, onMounted } from 'vue'
import { BookOpen, FileCheck, Award, Clock, TrendingUp, Users, Star, MessageSquare, GraduationCap, ClipboardCheck } from 'lucide-vue-next'
import { apiClient } from '@/js/api/manager'
import { endpoints } from '@/js/api/endpoints'
import { globalUserRole } from '../composables/useUserRole'

const dashboardData = ref({
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
})

const loading = ref(true)
const userRole = globalUserRole

// Данные в зависимости от роли
const roleBasedData = computed(() => {
  if (userRole.isTeacher.value || userRole.isAdmin.value) {
    return {
      stats: {
        createdCourses: 8,
        totalStudents: 156,
        pendingGrades: 23,
        teachingHours: 240
      },
      statsLabels: {
        createdCourses: 'Созданных курсов',
        totalStudents: 'Всего студентов',
        pendingGrades: 'К проверке',
        teachingHours: 'Часов преподавания'
      },
      statsIcons: [BookOpen, Users, ClipboardCheck, Clock],
      recentActivities: [
        { id: 1, title: 'Новый студент в курсе "JavaScript"', type: 'enrollment', time: '2 часа назад' },
        { id: 2, title: 'Сданное задание требует проверки', type: 'assignment', time: '4 часа назад' },
        { id: 3, title: 'Вопрос на форуме курса "Python"', type: 'forum', time: '1 день назад' }
      ]
    }
  } else {
    return {
      stats: {
        enrolledCourses: 5,
        completedTests: 12,
        earnedBadges: 8,
        studyHours: 47
      },
      statsLabels: {
        enrolledCourses: 'Записанных курсов',
        completedTests: 'Пройденных тестов',
        earnedBadges: 'Получено значков',
        studyHours: 'Часов обучения'
      },
      statsIcons: [BookOpen, FileCheck, Award, Clock],
      recentActivities: [
        { id: 1, title: 'Новое задание в курсе "JavaScript"', type: 'assignment', time: '2 часа назад' },
        { id: 2, title: 'Получен новый значок "Активный студент"', type: 'badge', time: '1 день назад' },
        { id: 3, title: 'Комментарий преподавателя к работе', type: 'feedback', time: '2 дня назад' }
      ]
    }
  }
})

async function loadDashboardData() {
  try {
    loading.value = true
    
    if (userRole.isStudent.value) {
      // Загружаем данные для студентов
      const response = await apiClient.get(endpoints.lms.studentStats)
      console.log('Статистика студента:', response.data)
      dashboardData.value = {
        enrolledCourses: response.data.enrolled_courses || 0,
        completedCourses: response.data.completed_courses || 0,
        averageGrade: response.data.average_grade || 0,
        testsCompleted: response.data.tests_completed || 0,
        recentCourses: response.data.recent_courses || [],
        upcomingEvents: response.data.upcoming_events || [],
        notifications: response.data.notifications || [],
        recentGrades: response.data.recent_grades || [],
        badges: response.data.badges || []
      }
    } else if (userRole.isTeacher.value) {
      // Загружаем данные для преподавателей
      const response = await apiClient.get(endpoints.lms.teacherStats)
      console.log('Статистика преподавателя:', response.data)
      dashboardData.value = {
        totalCourses: response.data.total_courses || 0,
        totalStudents: response.data.total_students || 0,
        averageGrade: response.data.average_grade || 0,
        activeTests: response.data.active_tests || 0,
        recentCourses: response.data.recent_courses || [],
        upcomingEvents: response.data.upcoming_events || [],
        notifications: response.data.notifications || [],
        pendingGrades: response.data.pending_grades || [],
        courseStats: response.data.course_stats || []
      }
    } else {
      // Загружаем общие данные дашборда
      const response = await apiClient.get(endpoints.lms.dashboard)
      console.log('Общая статистика:', response.data)
      dashboardData.value = response.data
    }
  } catch (error) {
    console.error('Ошибка загрузки данных дашборда:', error)
    // Устанавливаем пустые данные вместо демо-данных
    if (userRole.isStudent.value) {
      dashboardData.value = {
        enrolledCourses: 0,
        completedCourses: 0,
        averageGrade: 0,
        testsCompleted: 0,
        recentCourses: [],
        upcomingEvents: [],
        notifications: [],
        recentGrades: [],
        badges: []
      }
    } else if (userRole.isTeacher.value) {
      dashboardData.value = {
        totalCourses: 0,
        totalStudents: 0,
        averageGrade: 0,
        activeTests: 0,
        recentCourses: [],
        upcomingEvents: [],
        notifications: [],
        pendingGrades: [],
        courseStats: []
      }
    } else {
      dashboardData.value = {
        recentCourses: [],
        upcomingEvents: [],
        notifications: []
      }
    }
  } finally {
    loading.value = false
  }
}

// Функция для получения цвета статистики
function getStatColor(index) {
  const colors = ['primary', 'success', 'warning', 'info']
  return colors[index % colors.length]
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
              Нет активных курсов
            </div>
            <div v-else>
              <div v-for="course in dashboardData.recentCourses" :key="course.id" class="course-item mb-3">
                <div class="d-flex justify-content-between align-items-start mb-2">
                  <div>
                    <h6 class="mb-1">{{ course.title }}</h6>
                    <p class="text-muted small mb-1">Преподаватель: {{ course.instructor }}</p>
                  </div>
                  <span class="badge bg-primary">{{ course.progress }}%</span>
                </div>
                <div class="progress" style="height: 6px;">
                  <div class="progress-bar" role="progressbar" :style="`width: ${course.progress}%`"></div>
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
              Нет предстоящих событий
            </div>
            <div v-else>
              <div v-for="event in dashboardData.upcomingEvents" :key="event.id" class="event-item d-flex align-items-center gap-3 mb-3">
                <div class="event-date text-center">
                  <div class="date-day fw-bold">{{ new Date(event.date).getDate() }}</div>
                  <div class="date-month small text-muted">
                    {{ new Date(event.date).toLocaleDateString('ru', { month: 'short' }) }}
                  </div>
                </div>
                <div class="flex-grow-1">
                  <h6 class="mb-1">{{ event.title }}</h6>
                  <p class="text-muted small mb-0">{{ event.time }}</p>
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
              Нет новых уведомлений
            </div>
            <div v-else>
              <div v-for="notification in dashboardData.notifications" :key="notification.id" 
                   :class="`alert alert-${notification.type === 'success' ? 'success' : notification.type === 'warning' ? 'warning' : 'info'} py-2`">
                {{ notification.text }}
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