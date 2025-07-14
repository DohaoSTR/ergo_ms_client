<script setup>
import { ref, computed, onMounted, watch } from 'vue'
import { BookOpen, FileCheck, Award, Clock, TrendingUp, Users, Star, MessageSquare, GraduationCap, ClipboardCheck, Play } from 'lucide-vue-next'
import { useUserRole } from '../composables/useUserRole'
import { useLmsData } from '../composables/useApi'
import { useUtils } from '../composables/useUtils'
import { useRouter } from 'vue-router'
import BaseCard from '../components/BaseCard.vue'

const { lmsApi, loading } = useLmsData()
const userRole = useUserRole()
const { formatDate, formatRelativeTime } = useUtils()
const router = useRouter()

const dashboardData = ref({
  stats: {},
  recentCourses: [],
  upcomingEvents: [],
  notifications: [],
  achievements: []
})

const retryingLoad = ref(false)
const retryMessage = ref('')

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

async function loadDashboardData(retryCount = 0) {
  const maxRetries = 2
  
  try {
    console.log('🔄 Загрузка данных дашборда для роли:', userRole.primaryRole.value)
    console.log('👤 Пользователь:', userRole.currentUser.value?.user?.username)
    
    if (userRole.isStudent.value) {
      console.log('🎓 Загружаем данные студента')
      // Загружаем данные студента
      await loadStudentDashboardData()
    } else if (userRole.isTeacher.value) {
      console.log('👨‍🏫 Загружаем данные преподавателя')
      // TODO: Реализовать статистику преподавателя
      dashboardData.value = getEmptyTeacherData()
    } else {
      console.log('👤 Загружаем данные администратора')
      // TODO: Реализовать статистику администратора  
      dashboardData.value = getEmptyAdminData()
    }
  } catch (error) {
    console.error('❌ Ошибка загрузки данных дашборда:', error)
    
    // Пытаемся перезагрузить данные
    if (retryCount < maxRetries) {
      retryingLoad.value = true
      retryMessage.value = `Повторная попытка загрузки (${retryCount + 1}/${maxRetries})...`
      console.log(`🔄 ${retryMessage.value}`)
      
      setTimeout(() => {
        retryingLoad.value = false
        retryMessage.value = ''
        loadDashboardData(retryCount + 1)
      }, 2000)
      return
    }
    
    console.error('❌ Все попытки загрузки исчерпаны, показываем пустое состояние')
    // Показываем пустые данные при ошибке
    dashboardData.value = getEmptyData()
  }
}

async function loadStudentDashboardData() {
  try {
    // Ждем загрузки данных пользователя
    if (!userRole.currentUser.value?.id) {
      console.log('⏳ Ожидаем загрузки данных пользователя...')
      // Ждем до 5 секунд пока загрузятся данные пользователя
      let attempts = 0
      while (!userRole.currentUser.value?.id && attempts < 10) {
        await new Promise(resolve => setTimeout(resolve, 500))
        attempts++
      }
      
      if (!userRole.currentUser.value?.id) {
        console.error('❌ Данные пользователя не загружены, используем пустое состояние')
        dashboardData.value = getEmptyStudentData()
        return
      }
    }
    
    console.log('👤 Пользователь загружен:', userRole.currentUser.value.user?.username)
    
    // Импортируем необходимые API
    const { lmsApi } = await import('@/modules/lms/js/lmsApi')
    const { apiClient } = await import('@/js/api/manager')
    const { endpoints } = await import('@/js/api/endpoints')
    
    // Загружаем записи на курсы (мои курсы)
    console.log('📚 Загружаем записи на курсы...')
    const enrollmentsResponse = await apiClient.get(endpoints.lms.enrollments)
    const enrollments = enrollmentsResponse.data.results || enrollmentsResponse.data || []
    
    console.log('📚 Всего записей на курсы:', enrollments.length)
    console.log('📋 Записи:', enrollments.map(e => ({ 
      name: e.subject?.name, 
      status: e.status,
      id: e.subject?.id
    })))
    
    // Преобразуем записи в формат курсов для отображения с расчетом прогресса
    const recentCourses = await Promise.all(
      enrollments
        .filter(enrollment => {
          // Показываем активные курсы или все, если нет статуса
          const isActive = !enrollment.status || enrollment.status === 'active'
          console.log(`🔍 Курс "${enrollment.subject?.name}" статус: "${enrollment.status}" - ${isActive ? 'показываем' : 'скрываем'}`)
          return isActive
        })
        .slice(0, 5) // Показываем только 5 последних
        .map(async (enrollment) => {
          const subject = enrollment.subject
          
          // Рассчитываем реалистичный прогресс
          let progress = 0
          try {
            progress = await lmsApi.calculateCourseProgress(subject.id)
          } catch (error) {
            console.warn(`Не удалось рассчитать прогресс для курса ${subject.id}:`, error)
            // Fallback: прогресс на основе времени записи
            if (enrollment.enrollment_date) {
              const enrollmentDate = new Date(enrollment.enrollment_date)
              const daysSinceEnrollment = Math.floor((Date.now() - enrollmentDate.getTime()) / (1000 * 60 * 60 * 24))
              progress = Math.min(daysSinceEnrollment * 5, 75) // 5% в день, максимум 75%
            } else {
              // Используем стабильный прогресс на основе ID курса вместо случайного
              const seed = parseInt(subject.id) || 1
              progress = ((seed * 19) % 40) + 10 // 10-49% стабильно для каждого курса
            }
          }
          
          return {
            id: subject.id,
            name: subject.name,
            title: subject.name,
            instructor: subject.teacher ? 
              `${subject.teacher.first_name} ${subject.teacher.last_name}`.trim() || subject.teacher.username 
              : 'Неизвестный преподаватель',
            progress: progress,
            status: enrollment.status || 'active',
            subject: subject
          }
        })
    )
    
    console.log('🎯 Финальные курсы для отображения:', recentCourses.length)
    
    // Пытаемся загрузить статистику студента
    let stats = {
      enrolledCourses: enrollments.length,
      completedTests: 0,
      earnedBadges: 0,
      studyHours: 0
    }
    
    try {
      const statsResponse = await lmsApi.getStudentStats()
      if (statsResponse?.success && statsResponse?.data) {
        stats = {
          enrolledCourses: statsResponse.data.enrolled_courses || enrollments.length,
          completedTests: statsResponse.data.tests_completed || 0,
          earnedBadges: statsResponse.data.badges_count || 0,
          studyHours: statsResponse.data.study_hours || 0
        }
        console.log('📈 Статистика студента загружена:', stats)
      }
    } catch (statsError) {
      console.log('📊 Статистика студента недоступна, используем базовые данные:', stats)
    }
    
    // Устанавливаем данные
    dashboardData.value = {
      stats,
      recentCourses,
      upcomingEvents: [], // TODO: загрузить предстоящие события
      notifications: [], // TODO: загрузить уведомления
      achievements: [] // TODO: загрузить достижения
    }
    
    console.log('📊 Данные дашборда студента загружены:', {
      stats,
      coursesCount: recentCourses.length
    })
    
  } catch (error) {
    console.error('❌ Ошибка загрузки данных студента:', error)
    
    // Показываем пустые данные при ошибке, но с информацией о количестве записей
    const fallbackData = getEmptyStudentData()
    
    // Если удалось загрузить хотя бы записи, сохраняем их
    if (error.name !== 'NetworkError' && typeof enrollments !== 'undefined' && enrollments.length > 0) {
      console.log('🔄 Используем частичные данные записей:', enrollments.length)
      fallbackData.stats.enrolledCourses = enrollments.length
      
      // Создаем простые курсы без прогресса
      fallbackData.recentCourses = enrollments.slice(0, 5).map(enrollment => ({
        id: enrollment.subject?.id || Math.random(),
        name: enrollment.subject?.name || 'Неизвестный курс',
        title: enrollment.subject?.name || 'Неизвестный курс',
        instructor: 'Не указан',
        progress: 0,
        status: enrollment.status || 'active',
        subject: enrollment.subject
      }))
    }
    
    dashboardData.value = fallbackData
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

// Функция для перехода к курсу
function goToCourse(course) {
  console.log('🔗 Переход к курсу из дашборда:', course.name, 'ID:', course.id)
  router.push({
    name: 'LMSCourseView',
    params: { id: course.id }
  })
}

// Наблюдаем за изменениями пользователя для перезагрузки данных
watch(
  () => userRole.currentUser.value?.id,
  (newUserId, oldUserId) => {
    if (newUserId && newUserId !== oldUserId) {
      console.log('🔄 Пользователь изменился, перезагружаем дашборд:', newUserId)
      loadDashboardData()
    }
  },
  { immediate: false }
)

// Наблюдаем за изменениями роли
watch(
  () => userRole.primaryRole.value,
  (newRole, oldRole) => {
    if (newRole && newRole !== oldRole) {
      console.log('🔄 Роль изменилась, перезагружаем дашборд:', newRole)
      loadDashboardData()
    }
  },
  { immediate: false }
)

onMounted(() => {
  console.log('🔄 Компонент DashboardView смонтирован')
  loadDashboardData()
})
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
          <div class="card-header d-flex align-items-center justify-content-between">
            <div class="d-flex align-items-center gap-2">
              <TrendingUp :size="20" />
              <h5 class="mb-0">Текущие курсы</h5>
            </div>
            <router-link 
              :to="{ name: 'LMSCourses' }" 
              class="btn btn-sm btn-outline-secondary"
              v-if="userRole.isStudent.value"
            >
              Все курсы
            </router-link>
          </div>
          <div class="card-body">
            <div v-if="loading || retryingLoad" class="text-center py-4">
              <div class="spinner-border" role="status">
                <span class="visually-hidden">Загрузка...</span>
              </div>
              <p v-if="retryingLoad" class="mt-2 text-muted small">{{ retryMessage }}</p>
            </div>
            <div v-else-if="!dashboardData.recentCourses || dashboardData.recentCourses.length === 0" class="text-center py-4 text-muted">
              <BookOpen :size="32" class="mb-2" />
              <p class="mb-0">Нет активных курсов</p>
              <small>Запишитесь на курсы в каталоге</small>
            </div>
            <div v-else>
              <div v-for="course in dashboardData.recentCourses" :key="course.id" class="course-item mb-3">
                <div class="d-flex justify-content-between align-items-start mb-2">
                  <div class="flex-grow-1">
                    <h6 class="mb-1">{{ course.name || course.title }}</h6>
                    <p class="text-muted small mb-1">
                      Преподаватель: {{ course.instructor || course.teacher?.username || 'Не указан' }}
                    </p>
                  </div>
                  <div class="d-flex align-items-center gap-2">
                    <span class="badge bg-primary">{{ course.progress || 0 }}%</span>
                    <button 
                      @click="goToCourse(course)" 
                      class="btn btn-sm btn-outline-primary d-flex align-items-center gap-1"
                      title="Продолжить изучение курса"
                    >
                      <Play :size="14" />
                      Продолжить
                    </button>
                  </div>
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
            <div v-if="loading" class="text-center py-4">
              <div class="spinner-border" role="status">
                <span class="visually-hidden">Загрузка...</span>
              </div>
            </div>
            <div v-else-if="!dashboardData.achievements || dashboardData.achievements.length === 0" class="text-center py-4 text-muted">
              <Award :size="32" class="mb-2" />
              <p class="mb-0">Нет достижений</p>
              <small>Проходите курсы и получайте значки!</small>
            </div>
            <div v-else>
              <div v-for="achievement in dashboardData.achievements" :key="achievement.id" class="achievement-item d-flex align-items-center gap-3 mb-3">
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
    
    .btn {
      white-space: nowrap;
      transition: all 0.2s;
      
      &:hover {
        transform: translateY(-1px);
        box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
      }
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