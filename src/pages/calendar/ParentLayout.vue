<script setup>
import { onBeforeUnmount, onMounted, ref } from 'vue'

import CalendarNavbar from '@/pages/calendar/CalendarMenu.vue'
import CalendarContent from '@/pages/calendar/CalendarView.vue'
import CalendarManageEvents from '@/pages/calendar/CalendarEdit.vue'

import { useCalendarStore } from '@/stores/calendarStore.js'

const calendarStore = useCalendarStore()


onMounted(async () => {
  await calendarStore.initialize()
  await calendarStore.loadTasksFromAPI()
  await calendarStore.loadProjects()

  if (calendarStore.projects.length > 0) {
    const firstProjectId = calendarStore.projects[0].id
    await calendarStore.loadSectionsByProject(firstProjectId)}
})


// Боковое основное меню
const isCalendarMenuOpen = ref(window.innerWidth >= 992)
const isOverlayVisible = ref(false)

// Переключение видимости меню
const toggleCalendarMenu = () => {
  isCalendarMenuOpen.value = !isCalendarMenuOpen.value
  isOverlayVisible.value = isCalendarMenuOpen.value
}

// Переключение видимости меню в зависимости от ширины экрана
const autoToggleCalendarMenu = () => {
 const width = window.innerWidth

  if (width > 1300) {
    // Полный десктопный режим
    isCalendarMenuOpen.value = true
    isOverlayVisible.value = false
  } else if (width > 767 && width <= 1300) {
    // Средние экраны
    isCalendarMenuOpen.value = true
    isOverlayVisible.value = false
  } else {
    // Мобильные устройства
    isCalendarMenuOpen.value = false
    isOverlayVisible.value = false
  }
}

// Инициализация
onMounted(() => window.addEventListener('resize', autoToggleCalendarMenu))
onBeforeUnmount(() => window.removeEventListener('resize', autoToggleCalendarMenu))
</script>

<template>
  <div class="calendar card p-0 overflow-hidden">
    <Transition name="slide">
      <div
        v-if="isCalendarMenuOpen"
        class="calendar-sidebar beautiful-scrollbar card shadow-none rounded-0 border-end"
      >
        <CalendarNavbar @toggleCalendarMenu="toggleCalendarMenu" />
      </div>
    </Transition>

    <div
      ref="calendarContent"
      class="calendar-content beautiful-scrollbar card shadow-none position-relative"
    >
      <CalendarContent @toggleCalendarMenu="toggleCalendarMenu" />
    </div>

    <CalendarManageEvents />

    <div
      @click="toggleCalendarMenu"
      class="layout-overlay"
      :class="{ active: isOverlayVisible }"
    ></div>
  </div>
</template>

<style scoped lang="scss">
.calendar {
  height: 85dvh;
}

.calendar-content {
  padding-left: calc(20rem + 1rem);
  height: 85dvh;

  @media (width <= 991px) {
    padding-left: 1rem;
  }
}

// Левое боковое меню
.calendar-sidebar {
  position: absolute;
  top: 0;
  left: 0;
  width: 20rem;
  height: 100%;
  z-index: 11;

  @media (width <= 767px) {
    width: 100%;
  }
}

.slide-enter-active,
.slide-leave-active {
  transition: all $transition;
}
.slide-enter-from,
.slide-leave-to {
  transform: translateX(-100%);
}
.slide-enter-to,
.slide-leave-from {
  transform: translateX(0);
}

// Правое боковое меню
.calendar-add-event {
  position: absolute;
  top: 0;
  right: 0;
  width: 20rem;
  height: 100%;
  z-index: 11;

  @media (width <= 767px) {
    width: 100%;
  }
}
</style>
