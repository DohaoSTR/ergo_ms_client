<script setup>
import { ref, onMounted } from 'vue'
import { Calendar, Clock, MapPin, Users } from 'lucide-vue-next'

const events = ref([])

function fetchEvents() {
  events.value = [
    {
      id: 1,
      title: 'Вебинар по JavaScript',
      description: 'Изучение асинхронного программирования',
      course: 'Основы веб-разработки',
      date: '2024-01-15',
      time: '14:00',
      duration: '1.5 часа',
      type: 'webinar',
      location: 'Онлайн'
    },
    {
      id: 2,
      title: 'Дедлайн проекта Python',
      description: 'Сдача финального проекта по курсу Python',
      course: 'Python для начинающих',
      date: '2024-01-18',
      time: '23:59',
      duration: null,
      type: 'deadline',
      location: null
    },
    {
      id: 3,
      title: 'Экзамен по дизайну',
      description: 'Финальный экзамен по курсу UX/UI дизайн',
      course: 'UX/UI дизайн интерфейсов',
      date: '2024-01-20',
      time: '10:00',
      duration: '2 часа',
      type: 'exam',
      location: 'Аудитория 301'
    }
  ]
}

function getEventTypeClass(type) {
  switch (type) {
    case 'webinar':
      return 'bg-primary'
    case 'deadline':
      return 'bg-warning'
    case 'exam':
      return 'bg-danger'
    default:
      return 'bg-secondary'
  }
}

function getEventTypeText(type) {
  switch (type) {
    case 'webinar':
      return 'Вебинар'
    case 'deadline':
      return 'Дедлайн'
    case 'exam':
      return 'Экзамен'
    default:
      return 'Событие'
  }
}

onMounted(fetchEvents)
</script>

<template>
  <div class="calendar-view">
    <h3 class="mb-4">Календарь событий</h3>
    
    <div class="events-list">
      <div v-for="event in events" :key="event.id" class="card event-card mb-3">
        <div class="card-body">
          <div class="row">
            <div class="col-lg-8">
              <div class="event-info">
                <div class="d-flex align-items-center gap-2 mb-2">
                  <span :class="`badge ${getEventTypeClass(event.type)}`">
                    {{ getEventTypeText(event.type) }}
                  </span>
                  <h6 class="mb-0">{{ event.title }}</h6>
                </div>
                
                <p class="text-muted mb-2">{{ event.description }}</p>
                <small class="text-muted">Курс: {{ event.course }}</small>
              </div>
            </div>
            
            <div class="col-lg-4">
              <div class="event-details">
                <div class="d-flex align-items-center mb-2">
                  <Calendar :size="16" class="text-muted me-2" />
                  <span>{{ new Date(event.date).toLocaleDateString('ru') }}</span>
                </div>
                
                <div class="d-flex align-items-center mb-2">
                  <Clock :size="16" class="text-muted me-2" />
                  <span>{{ event.time }}{{ event.duration ? ` (${event.duration})` : '' }}</span>
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
  </div>
</template>

<style scoped>
.event-card {
  transition: box-shadow 0.2s;
}

.event-card:hover {
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}
</style> 