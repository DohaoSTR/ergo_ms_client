<script setup>
import { ref } from 'vue'
import { DatePicker } from 'v-calendar'
import { useCalendarStore } from '@/stores/calendarStore.js'

// Хранилище
const calendarStore = useCalendarStore()

defineEmits(['toggleCalendarMenu'])

// Дата из мини-календаря
const dateFromMiniCalendar = ref(new Date())

// Добавление события по нажатию на кнопку "Добавить событие"
const addEvent = () => {
  // Данные из мини-календаря
  const eventStartDate = new Date(dateFromMiniCalendar.value)
  const eventEndDate = new Date(eventStartDate)
  eventEndDate.setHours(eventStartDate.getHours() + 24)

  calendarStore.setSelectedEvent({
    id: +Date.now(),
    eventTitle: null,
    category: null,
    startDate: eventStartDate,
    endDate: eventEndDate,
    allDay: true,
  })
}
</script>

<template>
  <div class="menu-container">
    <div class="menu-content">
      <div class="mb-1 d-flex justify-content-between align-items-center">
        <button class="btn btn-primary w-100" @click="addEvent">Добавить событие</button>
        <button class="close-menu btn btn-close ms-3" @click="$emit('toggleCalendarMenu')"></button>
      </div>
      <div class="pt-4">
        <DatePicker v-model="dateFromMiniCalendar" expanded borderless />
      </div>
      <div class="pt-4 pb-2">
        <h5 class="fw-bold mb-2">Фильтры</h5>
        <ul class="list-unstyled mb-0">
          <li
            v-for="filter in calendarStore.filters"
            :key="filter.id"
            class="hover-section rounded p-2 filter-item"
            :class="'filter-' + filter.id"
          >
            <div class="form-check">
              <input
                class="form-check-input"
                type="checkbox"
                :id="filter.id"
                :checked="filter.active"
                @change="calendarStore.setActiveFilters(filter.id)"
              />
              <label class="form-check-label w-100" :for="filter.id" style="cursor: pointer;">
                {{ filter.name }}
              </label>
            </div>
          </li>
        </ul>
      </div>
    </div>
  </div>
</template>

<style scoped lang="scss">
.menu-container {
  height: calc(100vh - 60px); /* Адаптируйте под ваш layout */
  overflow-y: auto;
  padding-right: 10px;

  .menu-content {
    padding-bottom: 20px;
  }
}
.flatpickr-input {
  display: none;
}

.close-menu {
  @media (width > 992px) {
    display: none;
  }
}

/* === Фильтры событий — уникальные цвета === */
input[id='calendarEventFilterAll']:checked {
  background-color: var(--bs-orange); // вместо danger
  box-shadow: 0 0.125rem 0.25rem 0 rgba(var(--bs-orange-rgb), 0.4);
}

input[id='calendarEventFilterPersonal']:checked {
  background-color: var(--bs-indigo); // вместо success
  box-shadow: 0 0.125rem 0.25rem 0 rgba(var(--bs-indigo-rgb), 0.4);
}



input[id='calendarEventFilterHolidays']:checked {
  background-color: var(--bs-purple); // вместо warning
  box-shadow: 0 0.125rem 0.25rem 0 rgba(var(--bs-darkorange-rgb), 0.4);
}
//
/* Добавить стили для приоритетов */
input[id='task-priority-1']:checked {
  background-color: var(--bs-danger);
  box-shadow: 0 0.125rem 0.25rem 0 rgba(var(--bs-danger-rgb), 0.4);
}

input[id='task-priority-2']:checked {
  background-color: var(--bs-warning);
  box-shadow: 0 0.125rem 0.25rem 0 rgba(var(--bs-warning-rgb), 0.4);
}

input[id='task-priority-3']:checked {
  background-color: var(--bs-info);
  box-shadow: 0 0.125rem 0.25rem 0 rgba(var(--bs-info-rgb), 0.4);
}

input[id='task-priority-4']:checked {
  background-color: var(--bs-success);
  box-shadow: 0 0.125rem 0.25rem 0 rgba(var(--bs-success-rgb), 0.4);
}

</style>
