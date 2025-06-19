<script setup>
import { reactive, watch,computed } from 'vue'
import Datepicker from 'vue3-datepicker'
import { useCalendarStore } from '@/stores/calendarStore.js'
import { useToast } from 'vue-toastification'

const calendarStore = useCalendarStore()
const toast = useToast()

// ==== Форма задачи ====
const formData = reactive({
  id: null,
  title: '',
  category: '',
  dateofcreation: new Date(), // ❗️Всегда валидная дата
  deadline: new Date(new Date().setDate(new Date().getDate() + 1)), // завтрашний день
  priority: 4,
  description: '',
  sectionId: null,
  allDay: true,
})


// ==== Секции проекта ====
watch(
  () => formData.projectId,
  async (newProjectId) => {
    if (!newProjectId) {
      formData.sectionId = null
      return
    }

    try {
      await calendarStore.loadSectionsByProject(newProjectId)
      if (calendarStore.sections.length > 0) {
        formData.sectionId = calendarStore.sections[0].id
      } else {
        formData.sectionId = null
        toast.warning('Нет разделов в выбранном проекте')
      }
    } catch (error) {
      console.error('Ошибка загрузки разделов:', error)
      toast.error('Не удалось загрузить разделы проекта')
    }
  },
  { immediate: true }
)
// В watch на изменение дат добавь проверку:
watch(
  () => formData.dateStart,
  (newVal) => {
    if (!newVal || !(newVal instanceof Date) || isNaN(newVal)) {
      formData.dateStart = new Date()
    }
  }
)

watch(
  () => formData.dateEnd,
  (newVal) => {
    if (!newVal || !(newVal instanceof Date) || isNaN(newVal)) {
      formData.dateEnd = new Date()
    }
  }
)

// ==== Валидация формы ====
const errors = reactive({
  title: null,
  category: null,
  dateofcreation: null,
  deadline: null,
  priority: null,
  project: null,
  section: null,
})

const validate = () => {
  let isValid = true

  // Название
  if (!formData.title || formData.title.trim().length < 3) {
    errors.title = 'Введите название не менее 3 символов'
    isValid = false
  }

  // Проект
  if (!formData.projectId) {
    errors.project = 'Выберите проект'
    isValid = false
  }

  // Раздел
  if (!formData.sectionId) {
    errors.section = 'Выберите раздел'
    isValid = false
  }

  // Приоритет
  if (!formData.priority) {
    errors.priority = 'Выберите приоритет'
    isValid = false
  }

  return isValid
}

const handleSubmit = async () => {
  if (!validate()) return
  if (!formData.projectId || !formData.sectionId) {
  if (!formData.projectId) errors.project = 'Проект обязателен'
  if (!formData.sectionId) errors.section = 'Раздел обязателен'
  return false
}

  const taskData = {
    text: formData.title,
    section_id: formData.sectionId,   // ← важно: именно section_id
    description: formData.description || '',
    deadline: formData.dateEnd.toISOString(),  // ← будет использоваться как deadline
    date_start: formData.dateStart.toISOString(),
    date_end: formData.dateEnd.toISOString(),
    allDay: formData.allDay,
    priority: formData.priority,
    project: formData.projectId,
    user_id: calendarStore.currentUserId,
    isdone: true

  }

  console.log('Отправляемая задача:', taskData)
  try {
    // Создаём задачу через API
    const createdTask = await calendarStore.createCalendarTask(taskData)

    // Теперь у нас есть id → создаём событие
    const calendarEvent = calendarStore.createCalendarEvent(createdTask)
    if (calendarEvent) {
      calendarStore.events.push(calendarEvent)
      toast.success('Задача успешно создана')
      calendarStore.cleanSelectedEvent()
    }

  } catch (error) {
    console.error('Ошибка при отправке задачи:', error)
    toast.error('Не удалось сохранить задачу')
  }
}
watch(
  () => calendarStore.selectedEvent,
  (newVal) => {
    if (newVal && newVal.id) {  // ← защита от null
      formData.id = newVal.id
      formData.title = newVal.title
      formData.category = newVal.category
      formData.dateStart = newVal.startDate
      formData.dateEnd = newVal.endDate
      formData.allDay = newVal.allDay
    } else {
      formData.id = null
      formData.title = ''
      formData.category = ''
      formData.dateStart = new Date()
      formData.dateEnd = (() => {
        const tomorrow = new Date()
        tomorrow.setDate(new Date().getDate() + 1)
        return tomorrow
      })()
      formData.allDay = true
    }
  },
  { immediate: true }
)
const isEditMode = computed(() => {
  if (!formData.id) return false
  return calendarStore.getEventById(formData.id) !== -1
})
// ==== Удаление события ====
const deleteEvent = (eventId) => {
  calendarStore.deleteEvent(eventId)
  calendarStore.cleanSelectedEvent()
}
console.log('formData.id:', formData.id)

console.log('Событие в хранилище:', calendarStore.events.find(e => e.id === formData.id))
</script>

<template>
  <div class="offcanvas offcanvas-end" tabindex="-1" id="calendarCanvas">
    <div class="offcanvas-header">
      <h5 class="offcanvas-title">Редактирование события</h5>
      <button type="button" class="btn-close" data-bs-dismiss="offcanvas"></button>
    </div>
    <div class="offcanvas-body">
      <form @submit.prevent="handleSubmit" novalidate>
        <!-- Название -->
        <div class="mb-3">
          <label for="name" class="form-label">Название</label>
          <input
            v-model="formData.title"
            type="text"
            id="name"
            placeholder="Название задачи"
            class="form-control"
            :class="{ 'is-invalid': errors.title }"
            required
          />
          <div v-if="errors.title" class="invalid-feedback">{{ errors.title }}</div>
        </div>

        <!-- Приоритет -->
        <div class="mb-3">
          <label for="priority" class="form-label">Приоритет</label>
          <select
            id="priority"
            class="form-select"
            v-model="formData.priority"
            :class="{ 'is-invalid': errors.priority }"
          >
            <option value="" disabled>Выберите приоритет</option>
            <option value="1">Критическая</option>
            <option value="2">Важная</option>
            <option value="3">Срочная</option>
            <option value="4">Рутинная</option>
          </select>
          <div v-if="errors.priority" class="invalid-feedback">{{ errors.priority }}</div>
        </div>

        <!-- Проект -->
        <div class="mb-3">
          <label for="project" class="form-label">Проект</label>
          <select
            v-model="formData.projectId"
            id="project"
            class="form-select"
            :class="{ 'is-invalid': errors.project }"
          >
            <option value="" disabled>Выберите проект</option>
            <option v-for="project in calendarStore.projects" :key="project.id" :value="project.id">
              {{ project.name }}
            </option>
          </select>
          <div v-if="errors.project" class="invalid-feedback">{{ errors.project }}</div>
        </div>

        <!-- Раздел -->
        <div class="mb-3">
          <label for="section" class="form-label">Раздел</label>
          <select
            v-model="formData.sectionId"
            id="section"
            class="form-select"
            :class="{ 'is-invalid': errors.section }"
          >
            <option value="" disabled>Выберите раздел</option>
            <option v-for="section in calendarStore.sections" :key="section.id" :value="section.id">
              {{ section.name }}
            </option>
          </select>
          <div v-if="errors.section" class="invalid-feedback">{{ errors.section }}</div>
        </div>

        <!-- Описание -->
        <div class="mb-3">
          <label for="description" class="form-label">Описание</label>
          <textarea
            v-model="formData.description"
            id="description"
            class="form-control"
            placeholder="Описание задачи"
          ></textarea>
        </div>

        <!-- Дата начала -->
        <!-- Дата начала -->
        <div class="mb-3">
          <label for="date-start" class="form-label">Дата начала</label>
          <datepicker v-model="formData.dateStart" input-class-name="form-control" :placeholder="'Выберите дату'" />
          <div v-if="errors.dateStart" class="invalid-feedback">{{ errors.dateStart }}</div>
        </div>

        <!-- Дата окончания -->
        <div class="mb-3">
          <label for="date-end" class="form-label">Дата окончания</label>
          <datepicker v-model="formData.dateEnd" input-class-name="form-control" :placeholder="'Выберите дату'" />
          <div v-if="errors.dateEnd" class="invalid-feedback">{{ errors.dateEnd }}</div>
        </div>



        <!-- Кнопки -->
        <div class="d-flex gap-2">
          <button type="submit" class="btn btn-primary" data-bs-dismiss="offcanvas">
            {{ calendarStore.getEventById(formData.id) === -1 ? 'Добавить' : 'Обновить' }}
          </button>
          <button
  v-if="isEditMode"
  type="reset"
  class="btn btn-danger"
  data-bs-dismiss="offcanvas"
  @click="deleteEvent(formData.id)"
>
  Удалить
</button>
        </div>

      </form>
    </div>
  </div>
</template>

<style scoped lang="scss">
select:disabled {
  opacity: 0.5;
  pointer-events: none;
}
</style>
