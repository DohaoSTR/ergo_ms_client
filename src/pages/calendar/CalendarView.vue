<script setup>
import { computed,watch } from 'vue'
import FullCalendar from '@fullcalendar/vue3'
import dayGridPlugin from '@fullcalendar/daygrid'
import timeGridPlugin from '@fullcalendar/timegrid'
import listPlugin from '@fullcalendar/list'
import interactionPlugin from '@fullcalendar/interaction'
import ruLocale from '@fullcalendar/core/locales/ru'
import bootstrap5Plugin from '@fullcalendar/bootstrap5'
import { useCalendarStore } from '@/stores/calendarStore.js'

const calendarStore = useCalendarStore()
// === Логируем события для дебага ===
watch(
  () => calendarStore.events,
  (newVal) => {
  },
  { immediate: true }
)
// === Фильтрованные события ===
const filteredEvents = computed(() => {
  return calendarStore.events.filter((event) => {
    if (!event || !event.classNames) return false
    const categories = Array.isArray(event.classNames)
      ? event.classNames
      : [event.classNames]
    return categories.some(category =>
      calendarStore.activeFilterIds.includes(category)
    )
  })
})
// Клик по событию
const handleEventClick = (info) => {
  const eventId = info.event.id
  const numericId = parseInt(eventId.replace('task-', '').replace('event-', ''), 10)

  calendarStore.setSelectedEvent({
    id: numericId,
    title: info.event.title,
    category: info.event.classNames[0],
    startDate: info.event.start,
    endDate: info.event.end,
    allDay: info.event.allDay
  })
}
// Клик по дате
const handleDateClick = (info) => {
  // Защита: если нажали на событие — не вызываем форму создания
  if (info.jsEvent.detail === 0 && info.view.type !== 'listMonth') {
    console.warn('Клик по событию, пропускаем создание')
    return
  }
  const eventStartDate = info.date
  const eventEndDate = new Date(eventStartDate)
  eventEndDate.setDate(eventStartDate.getDate() + 1)
  eventEndDate.setHours(23, 59, 59, 999)

  calendarStore.setSelectedEvent({
    id: calendarStore.getNextEventId(),
    title: null,
    category: null,
    startDate: eventStartDate,
    endDate: eventEndDate,
    allDay: true,
  })
}



// === Подключаем вычисляемое свойство из хранилища ===
const calendarOptions = computed(() => ({
  plugins: [dayGridPlugin, timeGridPlugin, listPlugin, interactionPlugin, bootstrap5Plugin],
  initialView: 'dayGridMonth',
  locale: 'RU',
  locales: [ruLocale],
  events: filteredEvents.value, // ✅ Передаем напрямую
  dateClick: handleDateClick,
  eventClick: handleEventClick,
  eventContent: (arg) => {

    const priority = calendarStore.getPriorityName(arg.event.extendedProps.priority)
    let holidayLabel = ''
  if (arg.event.classNames.includes('calendarEventFilterHolidays')) {
    holidayLabel = '<div class="fc-event-holiday">🎉 Праздник</div>'
  }
    return {
      html: `
       <div class="fc-event-task ${arg.event.classNames.join(' ')}">
      <div class="fc-event-title">${arg.event.title}</div>
      ${holidayLabel}
      ${priority ? `<div class="fc-event-priority">${priority}</div>` : ''}
    </div>
      `
    }
  },

  themeSystem: 'bootstrap5',
  contentHeight: 'auto',
  customButtons: {
    menuButton: {
      text: '☰',
      click: function () {
        if (window.innerWidth > 992) return
        this.$emit('toggleCalendarMenu', true)
      },
    },
  },
  buttonText: { prev: 'Назад', next: 'Вперёд', list: 'Список' },
  headerToolbar: {
    left: 'menuButton prev,next',
    center: 'title',
    right: 'dayGridMonth,timeGridWeek,timeGridDay,listMonth',
  },
  titleFormat: { year: 'numeric', month: 'long' },
}
))

</script>

<template>
 <div class="calendar-container">
    <FullCalendar :options="calendarOptions" />
  </div>
</template>

<style lang="scss">
.calendar-container {
  height: calc(100vh - 60px); /* Вычитаем высоту header, если есть */
  overflow-y: auto;
  padding-bottom: 20px;

  .fc {
    min-height: 100%;
  }
}
// Календарь fullcalendar
.fc-header-toolbar {
  @media (width <= 1330px) {
    flex-direction: column;
    gap: 8px;
  }
  @media (width <= 1199px) {
    flex-direction: row;
  }
  @media (width <= 1100px) {
    flex-direction: column;
    gap: 8px;
  }
}


.fc-menuButton-button {
  @media (width > 992px) {
    display: none !important;
  }
}

.fc-toolbar-chunk:nth-child(1) .btn-group {
  @media (width > 992px) {
    margin-left: 0 !important;
  }
}

.fc-event {
  padding: 0.25rem 0.5rem;
  border: none;

  .fc-event-title {
    font-weight: 500;
  }
}

.calendarEventFilterPersonal {
  background-color: var(--bs-success-bg-subtle);
  .fc-event-title {
    color: var(--bs-success-text-emphasis);
  }
}

.calendarEventFilterBusiness {
  background-color: var(--bs-info-bg-subtle);
  .fc-event-title {
    color: var(--bs-info-text-emphasis);
  }
}

.calendarEventFilterHolidays {
  background-color: var(--bs-warning-bg-subtle);
  .fc-event-title {
    color: var(--bs-warning-text-emphasis);
  }
}
.fc-event-task {
  padding: 2px 4px;
  .fc-event-title {
    font-weight: 500;
    margin-bottom: 2px;
  }
  .fc-event-priority {
    font-size: 0.75rem;
    opacity: 0.8;
  }
}

.task-priority-1 {
  background-color: var(--bs-danger-bg-subtle);
  .fc-event-title {
    color: var(--bs-danger-text-emphasis);
  }
  border-left: 3px solid var(--bs-danger);
}

.task-priority-2 {
  background-color: var(--bs-warning-bg-subtle);
  .fc-event-title {
    color: var(--bs-warning-text-emphasis);
  }
  border-left: 3px solid var(--bs-warning);
}

.task-priority-3 {
  background-color: var(--bs-info-bg-subtle);
  .fc-event-title {
    color: var(--bs-info-text-emphasis);
  }
  border-left: 3px solid var(--bs-info);
}

.task-priority-4 {
  background-color: var(--bs-success-bg-subtle);
  .fc-event-title {
    color: var(--bs-success-text-emphasis);
  }
  border-left: 3px solid var(--bs-success);
}
.fc-event-holiday {
  font-size: 0.75rem;
  color: #e67e22;
  margin-top: 2px;
}
.calendarEventFilterHolidays {
  background-color: var(--bs-warning-bg-subtle);
  .fc-event-title {
    color: var(--bs-warning-text-emphasis);
  }
}
</style>
