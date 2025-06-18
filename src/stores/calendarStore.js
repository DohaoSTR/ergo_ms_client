// useCalendarStore.js

import { defineStore } from 'pinia'
import { useToast } from 'vue-toastification'
import { ref, computed } from 'vue'
import { Offcanvas } from 'bootstrap/dist/js/bootstrap.bundle.min.js'
import { apiClient } from '@/js/api/manager.js'
import Cookies from 'js-cookie' // Добавляем импорт
//import { endpoints } from '@/js/api/endpoints.js'

export const useCalendarStore = defineStore('calendarStore', () => {
  const toast = useToast()

  // ==== STATES ====
  const events = ref([
    {
      id: 1,
      title: 'Врач',
      start: new Date(new Date().getFullYear(), new Date().getMonth(), 10, 15, 30),
      end: new Date(new Date().getFullYear(), new Date().getMonth(), 10, 16, 30),
      classNames: ['calendarEventFilterPersonal'],
      allDay: false,
    },
    {
      id: 2,
      title: 'Поездка на дачу',
      start: new Date(new Date().getFullYear(), new Date().getMonth(), 14),
      end: new Date(new Date().getFullYear(), new Date().getMonth(), 16),
      classNames: ['calendarEventFilterPersonal'],
      allDay: true,
    },
    {
      id: 3,
      title: 'Собрание',
      start: new Date(new Date().getFullYear(), new Date().getMonth(), 19),
      end: new Date(new Date().getFullYear(), new Date().getMonth(), 21),
      classNames: ['calendarEventFilterBusiness'],
      allDay: true,
    },
    {
      id: 4,
      title: 'Встреча',
      start: new Date(new Date().getFullYear(), new Date().getMonth(), 20, 18, 10),
      end: new Date(new Date().getFullYear(), new Date().getMonth(), 20, 19, 50),
      classNames: ['calendarEventFilterBusiness'],
      allDay: false,
    },
    {
      id: 5,
      title: 'День рождение',
      start: new Date(new Date().getFullYear(), new Date().getMonth(), 25),
      end: new Date(new Date().getFullYear(), new Date().getMonth(), 26),
      classNames: ['calendarEventFilterHolidays'],
      allDay: true,
    },
    {
      id: 6,
      title: 'Супер мега корпоратив',
      start: new Date(new Date().getFullYear(), new Date().getMonth(), 30),
      end: new Date(new Date().getFullYear(), new Date().getMonth() + 1, 1),
      classNames: ['calendarEventFilterHolidays'],
      allDay: true,
    },
  ])
  const projects = ref([]) // ✅ Добавьте это
  const currentUserId = ref(null) // ✅ Добавьте это
  const sections = ref([])
  const isLoading = ref(false)

  const selectedEvent = ref(null)

  const filters = ref([
    { id: 'calendarEventFilterAll', name: 'Все', active: true },
    { id: 'calendarEventFilterPersonal', name: 'Личное', active: true },
    
    { id: 'calendarEventFilterHolidays', name: 'Праздники', active: true },
    { id: 'task-priority-1', name: 'Критическая', active: true },
    { id: 'task-priority-2', name: 'Важная', active: true },
    { id: 'task-priority-3', name: 'Срочная', active: true },
    { id: 'task-priority-4', name: 'Рутинная', active: true },
  ])

  const activeFilterIds = ref(filters.value.map(f => f.id))

  // ==== GETTERS ====
  // Инициализация - получаем ID пользователя из кук
  const initialize =async () => {
      try {
    // 1. Проверяем куки
    const userIdFromCookies = parseInt(Cookies.get('userId'))

    // 2. Если куки нет, проверяем защищенный эндпоинт
    if (!userIdFromCookies) {
      const response = await apiClient.get('http://localhost:8000/api/cms/adp/protected/')
      if (response?.success && response.data?.id) {
        currentUserId.value = response.data.id
        Cookies.set('userId', currentUserId.value.toString(), { expires: 7 })
        toast.success(`Добро пожаловать, ${response.data.username || 'пользователь'}!`)
      } else {
        throw new Error('Пользователь не авторизован')
      }
    } else {
      currentUserId.value = userIdFromCookies
      // Не загружаем пользователя повторно, если уже есть ID
    }

    console.log('Пользователь из кук:', currentUserId.value)
    return true

  } catch (error) {
    console.error('Ошибка авторизации:', error)
    currentUserId.value = null
    toast.error('Необходима авторизация')
    return false
  }
    }
  const getEventById = (eventId) => {
    if (!eventId) return -1

  const numericId = parseInt(eventId.toString().replace('event-', '').replace('task-', ''), 10)
  console.log(numericId)
  return events.value.findIndex((el) => {
    const currentId = typeof el.id === 'string'
      ? parseInt(el.id.replace('event-', '').replace('task-', ''), 10)
      : el.id

    return currentId === numericId
  })

}

  const getNextEventId = () => {
    const maxId = events.value.reduce((max, task) => Math.max(max, task.id), 0)
    return maxId + 1
  }

  const getPriorityName = (priority) => {
    switch(priority) {
      case 1: return 'Критическая'
      case 2: return 'Важная'
      case 3: return 'Срочная'
      case 4: return 'Рутинная'
      default: return ''
    }
  }

  // ==== ACTIONS ====

  const setSelectedEvent = (event) => {
    selectedEvent.value = event
    const bsOffcanvas = new Offcanvas('#calendarCanvas')
    bsOffcanvas.show()
  }

  const cleanSelectedEvent = () => {
    selectedEvent.value = null
  }

  const updateEvent = (event) => {
    const index = getEventById(event.id)
    if (index !== -1) {
      events.value.splice(index, 1, event)
      toast.success('Событие обновлено!')
    } else {
      events.value.push(event)
      toast.success('Событие добавлено!')
    }
  }

  const deleteEvent = (eventId) => {
  // Парсим ID события
  const numericEventId = parseInt(eventId.toString().replace('task-', '').replace('event-', ''), 10)

  if (!numericEventId) {
    toast.warning('Неверный ID события')
    return
  }

  const eventIndex = events.value.findIndex((el) => {
    const currentId = typeof el.id === 'string'
      ? parseInt(el.id.replace('task-', '').replace('event-', ''), 10)
      : el.id
    return currentId === numericEventId
  })

  if (eventIndex === -1) {
    toast.warning('Событие не найдено')
    return
  }

  // Вызываем удаление через API
  deleteTaskFromAPI(numericEventId)
    .then(() => {
      events.value.splice(eventIndex, 1)
      toast.success('Задача и событие удалены')
    })
    .catch(() => {
      toast.error('Не удалось удалить задачу на сервере')
    })
}
  const setActiveFilters = (filterId) => {
    const targetFilter = filters.value.find(f => f.id === filterId)
  if (!targetFilter) return

  // Если нажата "Все", активируем/деактивируем все фильтры
  if (filterId === 'calendarEventFilterAll') {
    const allActive = !targetFilter.active
    filters.value.forEach(filter => {
      filter.active = allActive
    })
    targetFilter.active = allActive
  } else {
    targetFilter.active = !targetFilter.active
  }

  // Обновляем список активных фильтров
  activeFilterIds.value = filters.value
    .filter(f => f.active)
    .map(f => f.id)
  }

  // ===== Загрузка задач из API =====
   const loadTasksFromAPI = async () => {
    try {
      const result = await apiClient.get('http://localhost:8000/api/crm/calendar/tasks/')
      console.log('Ответ от API:', result)
       console.log('data:', result.data)
       console.log('Является ли result.data массивом?', Array.isArray(result.data))

    if (!result) {
      throw new Error('Пустой ответ от API')
    }

    let tasks = []

    // === Определяем источник задач ===
    if (Array.isArray(result.data)) {
      tasks = result.data // ← Если это уже массив задач
    } else if (typeof result.data === 'object') {
      // Если data — объект с массивом внутри
      tasks = Object.values(result.data).filter(Array.isArray)[0] || []
    } else {
      tasks = [result.data] // ← Если пришёл один объект
    }

    console.log('Список задач:', tasks)

    // === Добавляем каждую задачу как событие ===
    tasks.forEach(task => {
      if (!task.deadline) {
        console.warn('Задача без дедлайна пропущена:', task)
        return
      }

      console.log('Добавляем задачу:', task)
      addTaskAsEvent(task)
    })
    } catch (error) {
      console.error('Ошибка при загрузке задач:', error)
      toast.error(error.message || 'Не удалось загрузить задачи.')
    }
     // Загрузка праздников
  await loadHolidays()
  }



  // ===== Добавление задачи как события =====
  const addTaskAsEvent = (task) => {
  console.log('addTaskAsEvent: Полученная задача', task)
  const taskId = task.id
  const taskText = task.text || task.title || 'Без названия'
  //const taskUsername = task.user?.username || task.user_id ? `ID ${task.user_id}` : ""
 // Проверяем наличие deadline и его формат
  if (!task.deadline) {
    console.warn('Задача без дедлайна:', task)
    return // Пропускаем задачи без дедлайна
  }

  let deadlineDate

  if (typeof task.deadline === 'string') {
    const [year, month, day] = task.deadline.split('-').map(Number)
    if (!isNaN(year) && !isNaN(month) && !isNaN(day)) {
      deadlineDate = new Date(year, month - 1, day, 23, 59, 59) // Конец дня
    }
  } else if (task.deadline instanceof Date) {
    deadlineDate = task.deadline
  }

  if (!deadlineDate || isNaN(deadlineDate.getTime())) {
    console.warn('Некорректная дата:', task.deadline)
    return
  }
  const eventStart = new Date(deadlineDate)
  const eventEnd = new Date(deadlineDate)
  eventEnd.setDate(eventEnd.getDate() + 1)
  eventEnd.setHours(0, 0, 0, 0)
  console.log('Задача:', task)
  console.log('Парсированная дата:', deadlineDate)

  const priority = task.priority || 4 // Если приоритет не указан — ставим "Рутинная"
  const calendarEvent = {
    id: `task-${taskId}`,
    title: `${taskText}`,
    start: eventStart,
    end: eventEnd,
    allDay: true,
     classNames: [`task-priority-${task.priority}`],
    extendedProps: {
      priority: priority,
      priorityName: getPriorityName(task.priority),
      isTask: true,
      taskId: taskId,
      description: task.description,
      projectId: task.project?.id || task.projectId,
      sectionId: task.section?.id || task.sectionId,
    }

  }
  console.log('Добавляем событие:', calendarEvent)
  console.log('Событие добавлено на:', eventStart.toDateString())
  console.log(task)
  if (!events.value.some(e => e.id === calendarEvent.id)) {
    events.value.push(calendarEvent)
    toast.info(`Задача "${taskText}" добавлена в календарь`)
    console.log(task)
  }
}




const loadProjects = async () => {
  if (!currentUserId.value && !initialize()) {
    toast.error('Необходима авторизация для загрузки проектов')
    return
  }

  isLoading.value = true
  try {
    const response = await fetch(
      `http://localhost:8000/api/crm/projects/project-all/?user_id=${currentUserId.value}`,
      {
        headers: {
          'Content-Type': 'application/json',
          'X-CSRFToken': Cookies.get('csrftoken') || '',
        },
      }
    )

    if (!response.ok) {
      const errorData = await response.json()
      throw new Error(errorData.message || 'Ошибка при загрузке проектов')
    }

    const data = await response.json()
    projects.value = Array.isArray(data) ? data : data.data || []

  } catch (error) {
    console.error('Ошибка загрузки проектов:', error)
    toast.error(error.message || 'Не удалось загрузить проекты')
    throw error
  } finally {
    isLoading.value = false
  }
}

const loadSectionsByProject = async (projectId) => {
  try {
    // Убедимся, что projectId - число
    const numericId = Number(projectId)
    if (isNaN(numericId)) {
      throw new Error("Invalid project ID")
    }

    const response = await apiClient.get(
      `http://localhost:8000/api/crm/calendar/projects/${numericId}/sections/`,
      {
        headers: {
          'X-CSRFToken': Cookies.get('csrftoken') || '',
          'Content-Type': 'application/json'
        }
      }
    )

    if (!response.data) {
      throw new Error("Empty response from server")
    }

    sections.value = response.data
    console.log(`Loaded ${sections.value.length} sections`)

  } catch (error) {
    console.error("Failed to load sections:", {
      error: error.message,
      status: error.response?.status,
      url: error.config?.url
    })
    sections.value = []
  }
}
const createCalendarTask = async (taskData) => {
  if (!taskData.user) {
      toast.warning('ID пользователя не указан')
      taskData.user = currentUserId.value
    }
    try {
      const response = await apiClient.post('http://localhost:8000/api/crm/calendar/task-new/', taskData)
      const createdTask = response.data
      const calendarEvent = createCalendarEvent(createdTask)

      if (calendarEvent && !events.value.some(e => e.id === calendarEvent.id)) {
        events.value.push(calendarEvent)
        toast.success('Задача успешно создана')
      }

      return createdTask
    } catch (error) {
      console.error('Ошибка при создании задачи:', error)
      toast.error('Не удалось создать задачу')
      throw error
    }
  }
const createCalendarEvent = (task) => {
    if (!task || !task.id || !task.text || !task.deadline) {
      console.error('Невалидные данные задачи:', task)
      return null
    }

    let startDate, endDate

    try {
      const parseDate = (dateStr) => {
        const [year, month, day] = dateStr.split('-').map(Number)
        return new Date(year, month - 1, day)
      }

      startDate = parseDate(task.deadline)
      endDate = new Date(startDate)
      endDate.setDate(startDate.getDate() + 1)
      endDate.setHours(0, 0, 0, 0)
    } catch (e) {
      console.error('Ошибка парсинга даты:', e.message)
      return null
    }

    return {
      id: `event-${task.id}`,
      title: task.text,
      start: startDate,
      end: endDate,
      allDay: true,
      classNames: [`task-priority-${task.priority || 4}`],
      extendedProps: {
        taskId: task.id,
        projectId: task.project?.id || task.projectId,
        sectionId: task.section?.id || task.sectionId,
        priority: task.priority || 4,
        description: task.description || '',
        isTask: true
      },
    }
  }
const deleteTaskFromAPI = async (taskId) => {
  try {
    const response = await apiClient.delete(`http://localhost:8000/api/crm/calendar/delete-task/${taskId}/`)
    if (response.success) {
      toast.success('Задача удалена')
      return Promise.resolve(response)
    } else {
      throw new Error('Не удалось удалить задачу')
    }
  } catch (error) {
    console.error('Ошибка при удалении:', error)
    toast.error('Не удалось удалить задачу с сервера')
    return Promise.reject(error)
  }
}
  /* // ==== COMPUTED PROPERTIES ====
  const filteredEvents = computed(() => {
    return events.value.filter(event => {
      // Защита: если нет classNames → не показываем
      if (!event.classNames) return false

      const categories = Array.isArray(event.classNames)
        ? event.classNames
        : [event.classNames]

      return categories.some(category =>
        activeFilterIds.value.includes(category)
      )
    })
  })
  watch(
  () => activeFilterIds,
  (newVal) => {
    console.log('Активные фильтры:', newVal)
  },
  { immediate: true }
) */
  const categoryFilters = computed(() => {
    return filters.value.filter(f => f.id.startsWith('calendarEventFilter'))
  })

  const priorityFilters = computed(() => {
    return filters.value.filter(f => f.id.startsWith('task-priority'))
  })
  const loadHolidays = async () => {
  try {
    const response = await apiClient.get('http://localhost:8000/api/crm/calendar/holidays/');

    if (!response?.data) {
      throw new Error('Не удалось загрузить праздники');
    }

    const holidays = Array.isArray(response.data) ? response.data : [response.data];

    holidays.forEach(holiday => {
      const [year, month, day] = holiday.date.split('-').map(Number);
      const date = new Date(year, month - 1, day);

      if (isNaN(date.getTime())) {
        console.error(`Некорректная дата: ${holiday.date}`);
        return;
      }

      const holidayEvent = {
        id: holiday.id,
        title: holiday.name,
        start: date,  // Только start, так как праздник однодневный
        allDay: true, // allDay: true означает, что событие на весь день
        classNames: ['calendarEventFilterHolidays'],
        extendedProps: {
          isHoliday: true
        }
      };

      if (!events.value.some(e => e.id === holidayEvent.id)) {
        events.value.push(holidayEvent);
      }
    });

    console.log(`Добавлено ${holidays.length} праздников`);
  } catch (error) {
    console.error('Ошибка загрузки праздников:', error);
    toast.error('Не удалось загрузить праздники');
  }
};

  return {
    events,
    selectedEvent,
    filters,
    activeFilterIds,
    getEventById,
    getNextEventId,
    setSelectedEvent,
    cleanSelectedEvent,
    updateEvent,
    deleteEvent,
    setActiveFilters,
    loadTasksFromAPI,
    addTaskAsEvent,
    getPriorityName,
    loadHolidays,
    createCalendarTask,
    createCalendarEvent,
    deleteTaskFromAPI,
    projects,
    currentUserId,
    sections,
    isLoading,
    loadProjects,
     initialize,
    loadSectionsByProject,
    // Для CalendarView
   // filteredEvents,
    categoryFilters,
    priorityFilters
  }
})
