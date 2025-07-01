<script setup>
import { ref, computed, onMounted } from 'vue'
import { Calendar, Clock, MapPin, Users, Plus, Filter, ChevronLeft, ChevronRight, AlertCircle, BookOpen } from 'lucide-vue-next'
import { apiClient } from '@/js/api/manager'
import { endpoints } from '@/js/api/endpoints'
import { globalUserRole } from '../composables/useUserRole'

const events = ref([])
const loading = ref(true)
const currentDate = ref(new Date())
const selectedView = ref('month') // month, week, day
const selectedEventType = ref('all')
const userRole = globalUserRole

// Типы событий
const eventTypes = [
  { value: 'all', label: 'Все события', color: 'secondary' },
  { value: 'assignment', label: 'Задания', color: 'primary' },
  { value: 'quiz', label: 'Тесты', color: 'info' },
  { value: 'lesson', label: 'Уроки', color: 'success' },
  { value: 'exam', label: 'Экзамены', color: 'danger' },
  { value: 'deadline', label: 'Крайние сроки', color: 'warning' },
  { value: 'other', label: 'Другие', color: 'secondary' }
]

// Фильтрованные события
const filteredEvents = computed(() => {
  let filtered = events.value
  
  if (selectedEventType.value !== 'all') {
    filtered = filtered.filter(event => event.event_type === selectedEventType.value)
  }
  
  // Фильтрация по текущему периоду просмотра
  const today = new Date()
  const currentYear = currentDate.value.getFullYear()
  const currentMonth = currentDate.value.getMonth()
  
  if (selectedView.value === 'month') {
    filtered = filtered.filter(event => {
      const eventDate = new Date(event.start_date)
      return eventDate.getFullYear() === currentYear && eventDate.getMonth() === currentMonth
    })
  } else if (selectedView.value === 'week') {
    const weekStart = getWeekStart(currentDate.value)
    const weekEnd = new Date(weekStart)
    weekEnd.setDate(weekEnd.getDate() + 6)
    
    filtered = filtered.filter(event => {
      const eventDate = new Date(event.start_date)
      return eventDate >= weekStart && eventDate <= weekEnd
    })
  } else if (selectedView.value === 'day') {
    filtered = filtered.filter(event => {
      const eventDate = new Date(event.start_date)
      return eventDate.toDateString() === currentDate.value.toDateString()
    })
  }
  
  return filtered.sort((a, b) => new Date(a.start_date) - new Date(b.start_date))
})

// События по дням для календарной сетки
const eventsByDate = computed(() => {
  const eventMap = {}
  filteredEvents.value.forEach(event => {
    const dateKey = new Date(event.start_date).toDateString()
    if (!eventMap[dateKey]) {
      eventMap[dateKey] = []
    }
    eventMap[dateKey].push(event)
  })
  return eventMap
})

// Загрузка событий
async function loadEvents() {
  try {
    loading.value = true
    
    // Загружаем события календаря
    const response = await apiClient.get(endpoints.lms.calendar)
    let calendarEvents = []
    
    if (response.success) {
      calendarEvents = response.data.results || response.data || []
    }
    
    // Также загружаем предстоящие дедлайны заданий
    try {
      const assignmentsResponse = await apiClient.get(endpoints.lms.assignments)
      if (assignmentsResponse.success) {
        const assignments = assignmentsResponse.data.results || assignmentsResponse.data || []
        
        // Преобразуем задания в события календаря
        assignments.forEach(assignment => {
          if (assignment.deadline) {
            calendarEvents.push({
              id: `assignment-${assignment.id}`,
              title: `Дедлайн: ${assignment.title}`,
              description: assignment.description,
              event_type: 'deadline',
              start_date: assignment.deadline,
              end_date: null,
              location: '',
              is_all_day: true,
              subject: assignment.subject ? { name: assignment.subject.name } : { name: 'Общее' }
            })
          }
        })
      }
    } catch (error) {
      console.warn('Не удалось загрузить дедлайны заданий:', error)
    }
    
    // Загружаем предстоящие тесты
    try {
      const testsResponse = await apiClient.get(endpoints.lms.tests)
      if (testsResponse.success) {
        const tests = testsResponse.data.results || testsResponse.data || []
        
        tests.forEach(test => {
          if (test.available_until) {
            calendarEvents.push({
              id: `test-${test.id}`,
              title: `Тест: ${test.name || test.title}`,
              description: test.description,
              event_type: 'quiz',
              start_date: test.available_from || new Date().toISOString(),
              end_date: test.available_until,
              location: 'Онлайн',
              is_all_day: false,
              subject: test.subject ? { name: test.subject.name } : { name: 'Общее' }
            })
          }
        })
      }
    } catch (error) {
      console.warn('Не удалось загрузить информацию о тестах:', error)
    }
    
    events.value = calendarEvents
    
  } catch (error) {
    console.error('Ошибка загрузки событий:', error)
    // При ошибке показываем пустой календарь
    events.value = []
  } finally {
    loading.value = false
  }
}

function getEventTypeInfo(type) {
  return eventTypes.find(t => t.value === type) || eventTypes[0]
}

function formatEventTime(event) {
  if (event.is_all_day) return 'Весь день'
  
  const startTime = new Date(event.start_date).toLocaleTimeString('ru', { 
    hour: '2-digit', 
    minute: '2-digit' 
  })
  
  if (event.end_date) {
    const endTime = new Date(event.end_date).toLocaleTimeString('ru', { 
      hour: '2-digit', 
      minute: '2-digit' 
    })
    return `${startTime} - ${endTime}`
  }
  
  return startTime
}

function getEventDuration(event) {
  if (!event.end_date || event.is_all_day) return null
  
  const start = new Date(event.start_date)
  const end = new Date(event.end_date)
  const diffMs = end - start
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60))
  const diffMinutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60))
  
  if (diffHours > 0) {
    return diffMinutes > 0 ? `${diffHours}ч ${diffMinutes}м` : `${diffHours}ч`
  }
  return `${diffMinutes}м`
}

function getWeekStart(date) {
  const start = new Date(date)
  const day = start.getDay()
  const diff = start.getDate() - day + (day === 0 ? -6 : 1) // Понедельник как начало недели
  start.setDate(diff)
  return start
}

function navigateDate(direction) {
  const newDate = new Date(currentDate.value)
  
  if (selectedView.value === 'month') {
    newDate.setMonth(newDate.getMonth() + direction)
  } else if (selectedView.value === 'week') {
    newDate.setDate(newDate.getDate() + (direction * 7))
  } else if (selectedView.value === 'day') {
    newDate.setDate(newDate.getDate() + direction)
  }
  
  currentDate.value = newDate
}

function goToToday() {
  currentDate.value = new Date()
}

function getCurrentPeriodText() {
  const date = currentDate.value
  const options = { year: 'numeric', month: 'long' }
  
  if (selectedView.value === 'month') {
    return date.toLocaleDateString('ru', options)
  } else if (selectedView.value === 'week') {
    const weekStart = getWeekStart(date)
    const weekEnd = new Date(weekStart)
    weekEnd.setDate(weekEnd.getDate() + 6)
    return `${weekStart.getDate()} - ${weekEnd.getDate()} ${weekEnd.toLocaleDateString('ru', { month: 'long', year: 'numeric' })}`
  } else if (selectedView.value === 'day') {
    return date.toLocaleDateString('ru', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })
  }
  
  return ''
}

function isEventToday(event) {
  const today = new Date()
  const eventDate = new Date(event.start_date)
  return eventDate.toDateString() === today.toDateString()
}

function isEventOverdue(event) {
  if (event.event_type !== 'deadline' && event.event_type !== 'assignment') return false
  const now = new Date()
  const eventDate = new Date(event.start_date)
  return eventDate < now
}

onMounted(() => {
  userRole.loadUserRoles().then(() => {
    loadEvents()
  })
})
</script>

<template>
  <div class="calendar-view">
    <!-- Заголовок -->
    <div class="d-flex justify-content-between align-items-center mb-4">
      <div>
        <h3 class="mb-1">
          <Calendar :size="28" class="me-2 text-primary" />
          Календарь событий
        </h3>
        <p class="text-muted mb-0">Отслеживайте важные события и сроки</p>
      </div>
    </div>

    <!-- Загрузка -->
    <div v-if="loading" class="text-center py-5">
      <div class="spinner-border text-primary" role="status">
        <span class="visually-hidden">Загрузка...</span>
      </div>
      <p class="mt-3 text-muted">Загрузка событий...</p>
    </div>

    <template v-else>
      <!-- Навигация и фильтры -->
      <div class="row mb-4">
        <div class="col-lg-8">
          <div class="card">
            <div class="card-body">
              <div class="d-flex align-items-center justify-content-between">
                <!-- Навигация по периодам -->
                <div class="d-flex align-items-center gap-2">
                  <button 
                    @click="navigateDate(-1)" 
                    class="btn btn-outline-secondary btn-sm"
                  >
                    <ChevronLeft :size="16" />
                  </button>
                  
                  <h5 class="mb-0 mx-3">{{ getCurrentPeriodText() }}</h5>
                  
                  <button 
                    @click="navigateDate(1)" 
                    class="btn btn-outline-secondary btn-sm"
                  >
                    <ChevronRight :size="16" />
                  </button>
                  
                  <button 
                    @click="goToToday" 
                    class="btn btn-outline-primary btn-sm ms-3"
                  >
                    Сегодня
                  </button>
                </div>
                
                <!-- Выбор вида -->
                <div class="btn-group" role="group">
                  <input 
                    type="radio" 
                    class="btn-check" 
                    id="view-month" 
                    v-model="selectedView" 
                    value="month"
                  >
                  <label class="btn btn-outline-primary btn-sm" for="view-month">Месяц</label>
                  
                  <input 
                    type="radio" 
                    class="btn-check" 
                    id="view-week" 
                    v-model="selectedView" 
                    value="week"
                  >
                  <label class="btn btn-outline-primary btn-sm" for="view-week">Неделя</label>
                  
                  <input 
                    type="radio" 
                    class="btn-check" 
                    id="view-day" 
                    v-model="selectedView" 
                    value="day"
                  >
                  <label class="btn btn-outline-primary btn-sm" for="view-day">День</label>
                </div>
              </div>
            </div>
          </div>
        </div>
        
        <div class="col-lg-4">
          <div class="card">
            <div class="card-body">
              <label class="form-label mb-2">
                <Filter :size="16" class="me-1" />
                Тип событий
              </label>
              <select v-model="selectedEventType" class="form-select">
                <option 
                  v-for="type in eventTypes" 
                  :key="type.value" 
                  :value="type.value"
                >
                  {{ type.label }}
                </option>
              </select>
            </div>
          </div>
        </div>
      </div>

      <!-- Список событий -->
      <div v-if="filteredEvents.length === 0" class="text-center py-5">
        <Calendar :size="48" class="text-muted mb-3" />
        <h5 class="text-muted">События не найдены</h5>
        <p class="text-muted">В выбранном периоде нет событий</p>
      </div>

      <div v-else class="events-list">
        <div 
          v-for="event in filteredEvents" 
          :key="event.id" 
          class="card event-card mb-3"
          :class="{
            'border-danger': isEventOverdue(event),
            'border-warning': isEventToday(event) && !isEventOverdue(event)
          }"
        >
          <div class="card-body">
            <div class="row align-items-center">
              <div class="col-lg-8">
                <div class="event-info">
                  <div class="d-flex align-items-center gap-2 mb-2">
                    <span 
                      :class="`badge bg-${getEventTypeInfo(event.event_type).color}`"
                    >
                      {{ getEventTypeInfo(event.event_type).label }}
                    </span>
                    
                    <AlertCircle 
                      v-if="isEventOverdue(event)" 
                      :size="16" 
                      class="text-danger"
                      title="Просрочено"
                    />
                    
                    <h6 class="mb-0 flex-grow-1">{{ event.title }}</h6>
                  </div>
                  
                  <p class="text-muted mb-2">{{ event.description }}</p>
                  
                  <div class="d-flex align-items-center gap-3">
                    <small class="text-muted d-flex align-items-center">
                      <BookOpen :size="14" class="me-1" />
                      {{ event.subject?.name || 'Общее событие' }}
                    </small>
                  </div>
                </div>
              </div>
              
              <div class="col-lg-4">
                <div class="event-details">
                  <div class="d-flex align-items-center mb-2">
                    <Calendar :size="16" class="text-muted me-2" />
                    <span>{{ new Date(event.start_date).toLocaleDateString('ru') }}</span>
                  </div>
                  
                  <div class="d-flex align-items-center mb-2">
                    <Clock :size="16" class="text-muted me-2" />
                    <span>
                      {{ formatEventTime(event) }}
                      <span v-if="getEventDuration(event)" class="text-muted">
                        ({{ getEventDuration(event) }})
                      </span>
                    </span>
                  </div>
                  
                  <div v-if="event.location" class="d-flex align-items-center">
                    <MapPin :size="16" class="text-muted me-2" />
                    <span>{{ event.location }}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </template>
  </div>
</template>

<style lang="scss" scoped>
.calendar-view {
  .event-card {
    transition: transform 0.2s, box-shadow 0.2s;
    border: none;
    border-left: 4px solid var(--bs-primary);
    
    &:hover {
      transform: translateY(-2px);
      box-shadow: 0 4px 15px rgba(0, 0, 0, 0.1);
    }
    
    &.border-danger {
      border-left-color: var(--bs-danger) !important;
      background: rgba(var(--bs-danger-rgb), 0.02);
    }
    
    &.border-warning {
      border-left-color: var(--bs-warning) !important;
      background: rgba(var(--bs-warning-rgb), 0.02);
    }
  }
  
  .btn-group .btn {
    border-radius: 0;
    
    &:first-child {
      border-top-left-radius: 0.375rem;
      border-bottom-left-radius: 0.375rem;
    }
    
    &:last-child {
      border-top-right-radius: 0.375rem;
      border-bottom-right-radius: 0.375rem;
    }
  }
}
</style> 