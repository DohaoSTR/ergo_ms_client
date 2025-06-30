<template>
  <div class="task-calendar">
    <div class="pm-page-header d-flex justify-content-between align-items-center">
      <h2><i class="fas fa-calendar-alt me-2"></i>Календарь задач</h2>
    </div>

    <!-- Навигация по календарю -->
    <div class="calendar-navigation">
      <div class="d-flex justify-content-between align-items-center">
        <div class="calendar-nav-buttons">
          <!-- Навигация по годам -->
          <div class="year-nav-group">
            <button class="btn btn-nav btn-year" @click="previousYear" title="Предыдущий год">
              <ChevronsLeft :size="16" />
            </button>
            <span class="year-display">{{ currentDate.getFullYear() }}</span>
            <button class="btn btn-nav btn-year" @click="nextYear" title="Следующий год">
              <ChevronsRight :size="16" />
            </button>
          </div>
          
          <!-- Навигация по месяцам -->
          <div class="month-nav-group">
            <button class="btn btn-nav" @click="previousMonth" title="Предыдущий месяц">
              <ChevronLeft :size="20" />
            </button>
            <button class="btn btn-today" @click="goToToday" title="Перейти к сегодняшнему дню">
              <Calendar :size="16" />
              <span>Сегодня</span>
            </button>
            <button class="btn btn-nav" @click="nextMonth" title="Следующий месяц">
              <ChevronRight :size="20" />
            </button>
          </div>
        </div>
        <h3 class="mb-0 text-center flex-grow-1">{{ currentMonthYear }}</h3>
        <div class="calendar-view-options">
          <div class="form-check form-switch form-check-inline">
            <input class="form-check-input" type="checkbox" v-model="showTasks" @change="loadEvents" id="showTasks">
            <label class="form-check-label" for="showTasks">
              <i class="fas fa-tasks text-primary"></i> Задачи
            </label>
          </div>
          <div class="form-check form-switch form-switch form-check-inline">
            <input class="form-check-input" type="checkbox" v-model="showProjects" @change="loadEvents" id="showProjects">
            <label class="form-check-label" for="showProjects">
              <i class="fas fa-project-diagram text-success"></i> Проекты
            </label>
          </div>
        </div>
      </div>
    </div>

    <!-- Фильтры -->
    <div class="pm-filters-card">
      <div class="card-body">
        <div class="row g-3">
          <div class="col-md-3">
            <label class="form-label">Проект</label>
            <select class="form-select" v-model="filters.project_id" @change="loadEvents">
              <option value="">Все проекты</option>
              <option v-for="project in projects" :key="project.id" :value="project.id">
                {{ project.name }}
              </option>
            </select>
          </div>
          <div class="col-md-3">
            <label class="form-label">Статус</label>
            <select class="form-select" v-model="filters.status" @change="loadEvents">
              <option value="">Все статусы</option>
              <option v-for="status in taskStatuses" :key="status.id" :value="status.code">
                {{ status.name }}
              </option>
            </select>
          </div>
          <div class="col-md-3">
            <label class="form-label">Приоритет</label>
            <select class="form-select" v-model="filters.priority" @change="loadEvents">
              <option value="">Все приоритеты</option>
              <option v-for="priority in taskPriorities" :key="priority.id" :value="priority.code">
                {{ priority.name }}
              </option>
            </select>
          </div>
          <div class="col-md-3 d-flex align-items-end">
            <div class="form-check">
              <input class="form-check-input" type="checkbox" v-model="filters.my_tasks" @change="loadEvents" id="myTasksFilter">
              <label class="form-check-label" for="myTasksFilter">
                Только мои задачи
              </label>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Календарь -->
    <div class="calendar-wrapper">
      <!-- Заголовки дней недели -->
      <div class="calendar-header">
        <div class="calendar-day-header" v-for="day in weekDays" :key="day">
          {{ day }}
        </div>
      </div>
      
      <!-- Дни календаря -->
      <div class="calendar-body">
        <div class="calendar-week" v-for="(week, weekIndex) in calendarWeeks" :key="weekIndex">
          <div class="calendar-day" 
               v-for="(day, dayIndex) in week" 
               :key="dayIndex"
               :class="getDayClasses(day)"
               @click="selectDate(day.date)">
            
            <div class="day-header">
              <span class="day-number">{{ day.number }}</span>
              <span class="event-count" v-if="getEventsCount(day.date) > 0">
                {{ getEventsCount(day.date) }}
              </span>
            </div>
            
            <!-- События на этот день -->
            <div class="day-events">
              <!-- Проекты -->
              <div class="event-item project-event" 
                   v-for="(project, index) in getProjectsForDay(day.date).slice(0, 3)" 
                   :key="'project-' + project.id + '-' + project.eventType"
                   :style="{ backgroundColor: project.color + '20', borderColor: project.color }"
                   @click.stop.prevent="viewProject(project)"
                   :title="project.displayTitle"
                   :class="'event-' + project.eventType">
                <div class="event-content">
                  <div class="event-title">
                    <i class="fas fa-circle" :style="{ color: project.color }"></i>
                    <span>{{ truncateText(project.displayTitle, 15) }}</span>
                  </div>
                </div>
              </div>
              
              <!-- Задачи -->
              <div class="event-item task-event" 
                   v-for="(task, index) in getTasksForDay(day.date).slice(0, 3)" 
                   :key="'task-' + task.id + '-' + task.eventType"
                   :class="['priority-' + task.priority, 'event-' + task.eventType]"
                   @click.stop.prevent="viewTask(task)"
                   :title="task.displayTitle">
                <div class="event-content">
                  <div class="event-title">
                    <span>{{ truncateText(task.displayTitle, 15) }}</span>
                  </div>
                </div>
              </div>
              
              <!-- Показать больше -->
              <div class="event-more" v-if="getEventsCount(day.date) > 6">
                +{{ getEventsCount(day.date) - 6 }}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Список событий для выбранной даты -->
    <div class="selected-date-events" v-if="selectedDate && (projectsForSelectedDate.length > 0 || tasksForSelectedDate.length > 0)">
      <div class="events-header d-flex justify-content-between align-items-center">
        <h5><i class="fas fa-calendar-check me-2"></i>События на {{ formatSelectedDate(selectedDate) }}</h5>
        <button class="btn btn-sm btn-primary" @click="createTaskForDate(selectedDate)">
          <i class="fas fa-plus me-1"></i>Добавить задачу
        </button>
      </div>
      <div class="events-body">
        <div class="row g-4">
          <!-- Проекты -->
          <div class="col-md-6" v-if="projectsForSelectedDate.length > 0">
            <h6 class="section-title text-success">
              <i class="fas fa-project-diagram me-2"></i>Проекты ({{ projectsForSelectedDate.length }})
            </h6>
            <div class="event-list">
              <div class="event-card project-card" v-for="project in projectsForSelectedDate" :key="project.id">
                <div class="event-card-header" :style="{ borderColor: project.color }">
                  <h6 class="mb-1">{{ project.name }}</h6>
                  <div class="badges">
                    <span class="badge rounded-pill" :class="getProjectPriorityClass(project.priority)">
                      {{ getProjectPriorityText(project.priority) }}
                    </span>
                    <span class="badge rounded-pill" :class="getProjectStatusClass(project.status)">
                      {{ getProjectStatusText(project.status) }}
                    </span>
                  </div>
                </div>
                <div class="event-card-body">
                  <p class="text-muted small mb-2">{{ project.description }}</p>
                  <div class="event-meta">
                    <i class="fas fa-calendar-alt text-muted"></i>
                    <span>{{ formatDateRange(project.start_date, project.end_date) }}</span>
                  </div>
                  <div class="event-indicators mt-2">
                    <span v-if="hasProjectEventOnDate(project, 'start')" class="badge badge-start me-1">
                      <i class="fas fa-play"></i> Начало
                    </span>
                    <span v-if="hasProjectEventOnDate(project, 'end')" class="badge badge-end">
                      <i class="fas fa-stop"></i> Окончание
                    </span>
                  </div>
                </div>
                <div class="event-card-footer">
                  <router-link :to="`/crm/project-management/project/${project.id}`" 
                               class="btn btn-sm btn-outline-primary">
                    <i class="fas fa-eye me-1"></i>Открыть
                  </router-link>
                </div>
              </div>
            </div>
          </div>
          
          <!-- Задачи -->
          <div class="col-md-6" v-if="tasksForSelectedDate.length > 0">
            <h6 class="section-title text-primary">
              <i class="fas fa-tasks me-2"></i>Задачи ({{ tasksForSelectedDate.length }})
            </h6>
            <div class="event-list">
              <div class="event-card task-card" v-for="task in tasksForSelectedDate" :key="task.id">
                <div class="event-card-header">
                  <h6 class="mb-1">{{ task.title }}</h6>
                  <div class="badges">
                    <span class="badge rounded-pill" :class="getPriorityClass(task.priority)">
                      {{ getPriorityText(task.priority) }}
                    </span>
                    <span class="badge rounded-pill" :class="getStatusClass(task.status)">
                      {{ getStatusText(task.status) }}
                    </span>
                  </div>
                </div>
                <div class="event-card-body">
                  <p class="text-primary small mb-2">
                    <i class="fas fa-folder me-1"></i>{{ task.project?.name }}
                  </p>
                  <div class="event-meta">
                    <i class="fas fa-clock" :class="getDueDateIconClass(task.due_date, task.status)"></i>
                    <span :class="getDueDateClass(task.due_date, task.status)">
                      {{ formatDateTime(task.due_date) }}
                    </span>
                  </div>
                  <div class="event-meta" v-if="task.assignee">
                    <i class="fas fa-user text-muted"></i>
                    <span>{{ task.assignee.full_name }}</span>
                  </div>
                  <div class="event-indicators mt-2">
                    <span v-if="hasTaskEventOnDate(task, 'start')" class="badge badge-start me-1">
                      <i class="fas fa-play"></i> Начало
                    </span>
                    <span v-if="hasTaskEventOnDate(task, 'due')" class="badge badge-due me-1">
                      <i class="fas fa-clock"></i> Срок
                    </span>
                    <span v-if="hasTaskEventOnDate(task, 'end')" class="badge badge-end">
                      <i class="fas fa-stop"></i> Окончание
                    </span>
                  </div>
                </div>
                <div class="event-card-footer">
                  <button class="btn btn-sm btn-outline-primary" @click="editTask(task)">
                    <i class="fas fa-edit me-1"></i>Редактировать
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Блок для выбранной даты без событий -->
    <div class="selected-date-events" v-if="selectedDate && projectsForSelectedDate.length === 0 && tasksForSelectedDate.length === 0">
      <div class="events-header d-flex justify-content-between align-items-center">
        <h5><i class="fas fa-calendar-check me-2"></i>{{ formatSelectedDate(selectedDate) }}</h5>
        <button class="btn btn-sm btn-primary" @click="createTaskForDate(selectedDate)">
          <i class="fas fa-plus me-1"></i>Создать задачу
        </button>
      </div>
      <div class="events-body">
        <div class="text-center text-muted py-4">
          <i class="fas fa-calendar-plus fa-3x mb-3"></i>
          <p>На эту дату нет запланированных событий</p>
          <p class="small">Нажмите кнопку выше, чтобы создать новую задачу</p>
        </div>
      </div>
    </div>

    <!-- Модальное окно создания/редактирования задачи -->
    <div class="modal fade" id="taskModal" role="dialog" aria-labelledby="taskModalLabel" aria-modal="true">
      <div class="modal-dialog modal-lg">
        <div class="modal-content">
          <div class="modal-header">
            <h5 class="modal-title" id="taskModalLabel">{{ isEditing ? 'Редактировать задачу' : 'Создать задачу' }}</h5>
            <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Закрыть"></button>
          </div>
          <div class="modal-body">
            <form @submit.prevent="submitTask">
              <div class="row">
                <div class="col-md-8">
                  <div class="mb-3">
                    <label class="form-label">Название задачи *</label>
                    <input type="text" class="form-control" v-model="currentTask.title" required>
                  </div>
                </div>
                <div class="col-md-4">
                  <div class="mb-3">
                    <label class="form-label">Проект *</label>
                    <select class="form-select" v-model="currentTask.project_id" required>
                      <option value="">Выберите проект</option>
                      <option v-for="project in projects" :key="project.id" :value="project.id">
                        {{ project.name }}
                      </option>
                    </select>
                  </div>
                </div>
              </div>
              
              <div class="mb-3">
                <label class="form-label">Описание</label>
                <textarea class="form-control" rows="3" v-model="currentTask.description"></textarea>
              </div>
              
              <div class="row">
                <div class="col-md-6">
                  <div class="mb-3">
                    <label class="form-label">Исполнитель</label>
                    <select class="form-select" v-model="currentTask.assignee_id">
                      <option value="">Не назначен</option>
                      <option v-for="user in users" :key="user.id" :value="user.id">
                        {{ user.full_name }}
                      </option>
                    </select>
                  </div>
                </div>
                <div class="col-md-6">
                  <div class="mb-3">
                    <label class="form-label">Статус</label>
                    <select class="form-select" v-model="currentTask.status">
                      <option v-for="status in taskStatuses" :key="status.id" :value="status.code">
                        {{ status.name }}
                      </option>
                    </select>
                  </div>
                </div>
              </div>
              
              <div class="row">
                <div class="col-md-4">
                  <div class="mb-3">
                    <label class="form-label">Приоритет</label>
                    <select class="form-select" v-model="currentTask.priority">
                      <option v-for="priority in taskPriorities" :key="priority.id" :value="priority.code">
                        {{ priority.name }}
                      </option>
                    </select>
                  </div>
                </div>
                <div class="col-md-4">
                  <div class="mb-3">
                    <label class="form-label">Дата начала</label>
                    <input type="datetime-local" class="form-control" v-model="currentTask.start_date">
                  </div>
                </div>
                <div class="col-md-4">
                  <div class="mb-3">
                    <label class="form-label">Срок выполнения</label>
                    <input type="datetime-local" class="form-control" v-model="currentTask.due_date">
                  </div>
                </div>
              </div>
              
              <div class="mb-3">
                <label class="form-label">Оценка времени (часы)</label>
                <input type="number" class="form-control" step="0.5" v-model="currentTask.estimated_hours">
              </div>
            </form>
          </div>
          <div class="modal-footer">
            <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Отменить</button>
            <button type="button" class="btn btn-danger" v-if="isEditing" @click="deleteTask">
              Удалить
            </button>
            <button type="button" class="btn btn-primary" @click="submitTask" :disabled="!currentTask.title || !currentTask.project_id">
              {{ isEditing ? 'Сохранить' : 'Создать' }}
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- Модальное окно просмотра задачи -->
    <div class="modal fade" id="taskViewModal" role="dialog" aria-labelledby="taskViewModalLabel" aria-modal="true">
      <div class="modal-dialog">
        <div class="modal-content">
          <div class="modal-header">
            <h5 class="modal-title" id="taskViewModalLabel">{{ viewTaskData.title }}</h5>
            <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Закрыть"></button>
          </div>
          <div class="modal-body">
            <div v-if="viewTaskData.description" class="mb-3">
              <strong>Описание:</strong>
              <p>{{ viewTaskData.description }}</p>
            </div>
            
            <div class="row">
              <div class="col-md-6">
                <strong>Проект:</strong> {{ viewTaskData.project?.name }}
              </div>
              <div class="col-md-6">
                <strong>Исполнитель:</strong> {{ viewTaskData.assignee?.full_name || 'Не назначен' }}
              </div>
            </div>
            
            <div class="row mt-2">
              <div class="col-md-6">
                <strong>Статус:</strong> 
                <span class="badge ms-1" :class="getStatusClass(viewTaskData.status)">
                  {{ getStatusText(viewTaskData.status) }}
                </span>
              </div>
              <div class="col-md-6">
                <strong>Приоритет:</strong> 
                <span class="badge ms-1" :class="getPriorityClass(viewTaskData.priority)">
                  {{ getPriorityText(viewTaskData.priority) }}
                </span>
              </div>
            </div>
            
            <div class="row mt-2">
              <div class="col-md-6">
                <strong>Дата начала:</strong> {{ formatDateTime(viewTaskData.start_date) }}
              </div>
              <div class="col-md-6">
                <strong>Срок выполнения:</strong> {{ formatDateTime(viewTaskData.due_date) }}
              </div>
            </div>
            
            <div v-if="viewTaskData.estimated_hours" class="mt-2">
              <strong>Оценка времени:</strong> {{ viewTaskData.estimated_hours }} ч.
            </div>
          </div>
          <div class="modal-footer">
            <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Закрыть</button>
            <button type="button" class="btn btn-primary" @click="editTask(viewTaskData)">
              Редактировать
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { ChevronLeft, ChevronRight, Calendar, ChevronsLeft, ChevronsRight } from 'lucide-vue-next'
import { Modal } from 'bootstrap'
import projectManagementApi from '@/js/api/projectManagementApi.js'
import { useNotifications } from '@/pages/lms/composables/useNotifications'

export default {
  name: 'TaskCalendar',
  components: {
    ChevronLeft,
    ChevronRight,
    Calendar,
    ChevronsLeft,
    ChevronsRight
  },
  setup() {
    const { showSuccess, showError, showConfirmDialog, closeConfirmDialog } = useNotifications()
    return { showSuccess, showError, showConfirmDialog, closeConfirmDialog }
  },
  data() {
    return {
      currentDate: new Date(),
      selectedDate: null,
      tasks: [],
      projects: [],
      allProjects: [], // Все проекты для календаря
      users: [],
      taskStatuses: [], // Статусы задач
      taskPriorities: [], // Приоритеты задач
      projectStatuses: [], // Статусы проектов
      projectPriorities: [], // Приоритеты проектов
      filters: {
        project_id: '',
        status: '',
        priority: '',
        my_tasks: true
      },
      currentTask: {
        title: '',
        description: '',
        project_id: '',
        assignee_id: '',
        status: 'todo',
        priority: 'medium',
        start_date: '',
        due_date: '',
        estimated_hours: null
      },
      viewTaskData: {},
      isEditing: false,
      weekDays: ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс'],
      showTasks: true,
      showProjects: true
    }
  },
  
  computed: {
    currentMonthYear() {
      return this.currentDate.toLocaleDateString('ru-RU', { 
        year: 'numeric', 
        month: 'long' 
      })
    },
    
    calendarWeeks() {
      const year = this.currentDate.getFullYear()
      const month = this.currentDate.getMonth()
      
      // Первый день месяца
      const firstDay = new Date(year, month, 1)
      // Последний день месяца
      const lastDay = new Date(year, month + 1, 0)
      
      // Понедельник первой недели
      const startDate = new Date(firstDay)
      const startDayOfWeek = firstDay.getDay() === 0 ? 7 : firstDay.getDay()
      startDate.setDate(firstDay.getDate() - (startDayOfWeek - 1))
      
      const weeks = []
      const currentWeekDate = new Date(startDate)
      
      while (currentWeekDate <= lastDay || weeks.length < 6) {
        const week = []
        
        for (let i = 0; i < 7; i++) {
          const date = new Date(currentWeekDate)
          week.push({
            date: new Date(date),
            number: date.getDate(),
            isCurrentMonth: date.getMonth() === month,
            isToday: this.isToday(date),
            isSelected: this.selectedDate && this.isSameDay(date, this.selectedDate)
          })
          currentWeekDate.setDate(currentWeekDate.getDate() + 1)
        }
        
        weeks.push(week)
        
        if (currentWeekDate.getMonth() !== month && weeks.length >= 4) {
          break
        }
      }
      
      return weeks
    },
    
    tasksForSelectedDate() {
      if (!this.selectedDate) return []
      const taskEvents = this.getTasksForDay(this.selectedDate)
      
      // Группируем события по задачам, чтобы не дублировать задачи
      const uniqueTasks = new Map()
      taskEvents.forEach(event => {
        if (!uniqueTasks.has(event.id)) {
          const { eventType, displayTitle, eventDate, ...taskData } = event
          uniqueTasks.set(event.id, taskData)
        }
      })
      
      return Array.from(uniqueTasks.values())
    },
    
    projectsForSelectedDate() {
      if (!this.selectedDate) return []
      const projectEvents = this.getProjectsForDay(this.selectedDate)
      
      // Группируем события по проектам, чтобы не дублировать проекты
      const uniqueProjects = new Map()
      projectEvents.forEach(event => {
        if (!uniqueProjects.has(event.id)) {
          const { eventType, displayTitle, eventDate, ...projectData } = event
          uniqueProjects.set(event.id, projectData)
        }
      })
      
      return Array.from(uniqueProjects.values())
    }
  },
  
  async mounted() {
    await this.loadProjects()
    await this.loadUsers()
    await this.loadTaskStatuses()
    await this.loadTaskPriorities()
    await this.loadProjectStatuses()
    await this.loadProjectPriorities()
    this.loadEvents()
  },

  watch: {
    // Отслеживаем изменение фильтра "только мои задачи" для обновления проектов и задач
    'filters.my_tasks'() {
      this.loadProjects()
      this.loadEvents()
    }
  },
  
  methods: {
    async loadProjects() {
      try {
        // Загружаем все проекты для фильтра
        const response = await projectManagementApi.getProjects({ page_size: 1000 })
        this.projects = Array.isArray(response.data.results) ? response.data.results : 
                        Array.isArray(response.data) ? response.data : []
        
        // Получаем диапазон дат для всех видимых дней календаря
        const calendarRange = this.getCalendarDateRange()
        
        // Загружаем проекты пользователя для календаря с фильтрацией по датам
        const allProjectsResponse = await projectManagementApi.getProjects({ 
          my_projects: this.filters.my_tasks, // Используем тот же фильтр что и для задач
          start_date: calendarRange.start.toISOString().split('T')[0],
          end_date: calendarRange.end.toISOString().split('T')[0],
          page_size: 1000 
        })
        this.allProjects = Array.isArray(allProjectsResponse.data.results) ? allProjectsResponse.data.results : 
                           Array.isArray(allProjectsResponse.data) ? allProjectsResponse.data : []
      } catch (error) {
        console.error('Ошибка загрузки проектов:', error)
        this.projects = []
        this.allProjects = []
      }
    },
    
    async loadUsers() {
      try {
        const response = await projectManagementApi.getUsers()
        this.users = Array.isArray(response.data) ? response.data : []
      } catch (error) {
        console.error('Ошибка загрузки пользователей:', error)
        this.users = []
      }
    },
    
    async loadTaskStatuses() {
      try {
        const response = await projectManagementApi.getTaskStatuses()
        this.taskStatuses = Array.isArray(response.data) ? response.data : []
      } catch (error) {
        console.error('Ошибка загрузки статусов задач:', error)
        this.taskStatuses = []
      }
    },
    
    async loadTaskPriorities() {
      try {
        const response = await projectManagementApi.getTaskPriorities()
        this.taskPriorities = Array.isArray(response.data) ? response.data : []
      } catch (error) {
        console.error('Ошибка загрузки приоритетов задач:', error)
        this.taskPriorities = []
      }
    },
    
    async loadProjectStatuses() {
      try {
        const response = await projectManagementApi.getProjectStatuses()
        this.projectStatuses = Array.isArray(response.data) ? response.data : []
      } catch (error) {
        console.error('Ошибка загрузки статусов проектов:', error)
        this.projectStatuses = []
      }
    },
    
    async loadProjectPriorities() {
      try {
        const response = await projectManagementApi.getProjectPriorities()
        this.projectPriorities = Array.isArray(response.data) ? response.data : []
      } catch (error) {
        console.error('Ошибка загрузки приоритетов проектов:', error)
        this.projectPriorities = []
      }
    },
    
    getCalendarDateRange() {
      const year = this.currentDate.getFullYear()
      const month = this.currentDate.getMonth()
      
      // Первый день месяца
      const firstDay = new Date(year, month, 1)
      // Последний день месяца
      const lastDay = new Date(year, month + 1, 0)
      
      // Понедельник первой недели (начало календаря)
      const startDate = new Date(firstDay)
      const startDayOfWeek = firstDay.getDay() === 0 ? 7 : firstDay.getDay()
      startDate.setDate(firstDay.getDate() - (startDayOfWeek - 1))
      
      // Воскресенье последней недели (конец календаря)
      const endDate = new Date(lastDay)
      const endDayOfWeek = lastDay.getDay() === 0 ? 7 : lastDay.getDay()
      endDate.setDate(lastDay.getDate() + (7 - endDayOfWeek))
      
      return {
        start: startDate,
        end: endDate
      }
    },

    async loadEvents() {
      try {
        if (this.showTasks) {
          // Получаем диапазон дат для всех видимых дней календаря
          const calendarRange = this.getCalendarDateRange()
          
          const params = {
            start_date: calendarRange.start.toISOString().split('T')[0],
            end_date: calendarRange.end.toISOString().split('T')[0],
            ...this.filters
          }
          
          // Убираем пустые фильтры, но оставляем булевые значения для my_tasks
          Object.keys(params).forEach(key => {
            if (params[key] === '' || params[key] === null || params[key] === undefined || 
               (params[key] === false && key !== 'my_tasks')) {
              delete params[key]
            }
          })
          
          const response = await projectManagementApi.getTasks(params)
          this.tasks = Array.isArray(response.data.results) ? response.data.results : 
                       Array.isArray(response.data) ? response.data : []
        } else {
          this.tasks = []
        }
      } catch (error) {
        console.error('Ошибка загрузки задач:', error)
        this.tasks = []
      }
    },
    
    getProjectsForDay(date) {
      if (!this.showProjects) return []
      
      const events = []
      
      // Фильтруем проекты по выбранному проекту если указан
      const filteredProjects = this.filters.project_id ? 
        this.allProjects.filter(p => p.id.toString() === this.filters.project_id.toString()) :
        this.allProjects
      
      filteredProjects.forEach(project => {
        if (!project) return
        
        const projectStart = project.start_date ? new Date(project.start_date) : null
        const projectEnd = project.end_date ? new Date(project.end_date) : null
        
        // Событие начала проекта
        if (projectStart && this.isSameDay(projectStart, date)) {
          events.push({
            ...project,
            eventType: 'start',
            displayTitle: `▶ ${project.name}`,
            eventDate: projectStart
          })
        }
        
        // Событие окончания проекта
        if (projectEnd && this.isSameDay(projectEnd, date)) {
          events.push({
            ...project,
            eventType: 'end',
            displayTitle: `⏹ ${project.name}`,
            eventDate: projectEnd
          })
        }
      })
      
      return events
    },
    
    getTasksForDay(date) {
      if (!this.showTasks) return []
      
      const events = []
      
      this.tasks.forEach(task => {
        if (!task) return
        
        const taskStart = task.start_date ? new Date(task.start_date) : null
        const taskDue = task.due_date ? new Date(task.due_date) : null
        const taskEnd = task.end_date ? new Date(task.end_date) : null
        
        // Событие начала задачи
        if (taskStart && this.isSameDay(taskStart, date)) {
          events.push({
            ...task,
            eventType: 'start',
            displayTitle: `▶ ${task.title}`,
            eventDate: taskStart
          })
        }
        
        // Событие срока выполнения задачи
        if (taskDue && this.isSameDay(taskDue, date)) {
          events.push({
            ...task,
            eventType: 'due',
            displayTitle: `⏰ ${task.title}`,
            eventDate: taskDue
          })
        }
        
        // Событие окончания задачи (если есть дата окончания и она отличается от срока выполнения)
        if (taskEnd && this.isSameDay(taskEnd, date) && (!taskDue || !this.isSameDay(taskEnd, taskDue))) {
          events.push({
            ...task,
            eventType: 'end',
            displayTitle: `⏹ ${task.title}`,
            eventDate: taskEnd
          })
        }
      })
      
      return events
    },
    
    isToday(date) {
      const today = new Date()
      return this.isSameDay(date, today)
    },
    
    isSameDay(date1, date2) {
      return date1.getDate() === date2.getDate() &&
             date1.getMonth() === date2.getMonth() &&
             date1.getFullYear() === date2.getFullYear()
    },
    
    getDayClasses(day) {
      const hasProjects = this.getProjectsForDay(day.date).length > 0
      const hasTasks = this.getTasksForDay(day.date).length > 0
      
      return {
        'calendar-day-current-month': day.isCurrentMonth,
        'calendar-day-other-month': !day.isCurrentMonth,
        'calendar-day-today': day.isToday,
        'calendar-day-selected': day.isSelected,
        'calendar-day-has-tasks': hasTasks,
        'calendar-day-has-projects': hasProjects,
        'calendar-day-has-events': hasProjects || hasTasks
      }
    },
    
    getTaskItemClass(task) {
      return {
        'task-item-urgent': task.priority === 'urgent',
        'task-item-high': task.priority === 'high',
        'task-item-medium': task.priority === 'medium',
        'task-item-low': task.priority === 'low',
        'task-item-done': task.status === 'done'
      }
    },
    
    getProjectItemClass(project) {
      return {
        'project-item': true,
        'project-item-urgent': project.priority === 'urgent',
        'project-item-high': project.priority === 'high',
        'project-item-medium': project.priority === 'medium',
        'project-item-low': project.priority === 'low'
      }
    },
    
    selectDate(date) {
      this.selectedDate = date
      // Сразу создаем задачу при клике на день
      this.createTaskForDate(date)
    },

    createTaskForDate(date) {
      // Метод для создания задачи на конкретную дату
      this.selectedDate = date
      this.currentTask.start_date = this.formatDateTimeLocal(date)
      this.createTask()
    },
    
    previousMonth() {
      this.currentDate = new Date(this.currentDate.getFullYear(), this.currentDate.getMonth() - 1, 1)
      this.loadProjects()
      this.loadEvents()
    },
    
    nextMonth() {
      this.currentDate = new Date(this.currentDate.getFullYear(), this.currentDate.getMonth() + 1, 1)
      this.loadProjects()
      this.loadEvents()
    },
    
    previousYear() {
      this.currentDate = new Date(this.currentDate.getFullYear() - 1, this.currentDate.getMonth(), 1)
      this.loadProjects()
      this.loadEvents()
    },
    
    nextYear() {
      this.currentDate = new Date(this.currentDate.getFullYear() + 1, this.currentDate.getMonth(), 1)
      this.loadProjects()
      this.loadEvents()
    },
    
    goToToday() {
      this.currentDate = new Date()
      this.selectedDate = new Date()
      this.loadProjects()
      this.loadEvents()
    },
    
    createTask() {
      this.isEditing = false
      
      // Устанавливаем значения по умолчанию из API
      const defaultStatus = this.taskStatuses.find(s => s.is_default) || this.taskStatuses[0]
      const defaultPriority = this.taskPriorities.find(p => p.is_default) || this.taskPriorities[0]
      
      // Если есть выбранная дата, используем её как дату начала
      const initialStartDate = this.selectedDate ? 
        this.formatDateTimeLocal(this.selectedDate) : ''
      
      this.currentTask = {
        title: '',
        description: '',
        project_id: '',
        assignee_id: '',
        status: defaultStatus ? defaultStatus.code : 'todo',
        priority: defaultPriority ? defaultPriority.code : 'medium',
        start_date: initialStartDate,
        due_date: '',
        estimated_hours: null
      }
      
      const modal = new Modal(document.getElementById('taskModal'))
      modal.show()
    },
    
    editTask(task) {
      this.isEditing = true
      this.currentTask = {
        id: task.id,
        title: task.title,
        description: task.description,
        project_id: task.project?.id,
        assignee_id: task.assignee?.id,
        status: task.status,
        priority: task.priority,
        start_date: task.start_date ? this.formatDateTimeLocal(task.start_date) : '',
        due_date: task.due_date ? this.formatDateTimeLocal(task.due_date) : '',
        estimated_hours: task.estimated_hours
      }
      
      // Закрываем модальное окно просмотра
      const viewModal = Modal.getInstance(document.getElementById('taskViewModal'))
      if (viewModal) viewModal.hide()
      
      // Открываем модальное окно редактирования
      const editModal = new Modal(document.getElementById('taskModal'))
      editModal.show()
    },
    
    viewTask(taskEvent) {
      if (!taskEvent) {
        console.error('Некорректные данные задачи:', taskEvent)
        this.showError('Ошибка открытия задачи')
        return
      }
      
      try {
        // Создаем объект задачи без дополнительных полей события
        const { eventType, displayTitle, eventDate, ...taskData } = taskEvent
        this.viewTaskData = taskData
        const modal = new Modal(document.getElementById('taskViewModal'))
        modal.show()
      } catch (error) {
        console.error('Ошибка открытия модального окна:', error)
        this.showError('Ошибка отображения задачи')
      }
    },
    
    async submitTask() {
      try {
        // Подготавливаем данные задачи
        const taskData = { ...this.currentTask }
        
        // Правильно форматируем даты для отправки на сервер
        if (taskData.start_date) {
          taskData.start_date = this.formatDateForAPI(taskData.start_date)
        } else {
          delete taskData.start_date // Удаляем пустое поле
        }
        
        if (taskData.due_date) {
          taskData.due_date = this.formatDateForAPI(taskData.due_date)
        } else {
          delete taskData.due_date // Удаляем пустое поле
        }
        
        // Убираем пустые значения
        if (!taskData.assignee_id) {
          delete taskData.assignee_id
        }
        
        if (!taskData.estimated_hours || taskData.estimated_hours === '') {
          delete taskData.estimated_hours
        }
        
        let response
        
        if (this.isEditing) {
          response = await projectManagementApi.updateTask(this.currentTask.id, taskData)
        } else {
          response = await projectManagementApi.createTask(taskData)
        }
        
        // Закрываем модальное окно
        const modal = Modal.getInstance(document.getElementById('taskModal'))
        modal.hide()
        
        // Сбрасываем форму
        const defaultStatus = this.taskStatuses.find(s => s.is_default) || this.taskStatuses[0]
        const defaultPriority = this.taskPriorities.find(p => p.is_default) || this.taskPriorities[0]
        
        this.currentTask = {
          title: '',
          description: '',
          project_id: '',
          assignee_id: '',
          status: defaultStatus ? defaultStatus.code : 'todo',
          priority: defaultPriority ? defaultPriority.code : 'medium',
          start_date: '',
          due_date: '',
          estimated_hours: null
        }
        
        // Перезагружаем события
        this.loadEvents()
        
        this.showSuccess(this.isEditing ? 'Задача обновлена' : 'Задача создана')
      } catch (error) {
        console.error('Ошибка сохранения задачи:', error)
        this.showError('Ошибка сохранения задачи')
      }
    },
    
    async deleteTask() {
      const confirmed = await this.showConfirmDialog({
        title: 'Удаление задачи',
        message: 'Вы уверены, что хотите удалить эту задачу?',
        confirmText: 'Удалить',
        cancelText: 'Отмена',
        variant: 'danger'
      })
      
      if (confirmed) {
        try {
          await projectManagementApi.deleteTask(this.currentTask.id)
          
          // Закрываем модальное окно
          const modal = Modal.getInstance(document.getElementById('taskModal'))
          modal.hide()
          
          this.closeConfirmDialog()
          
          // Перезагружаем события
          this.loadEvents()
          
          this.showSuccess('Задача удалена')
        } catch (error) {
          console.error('Ошибка удаления задачи:', error)
          this.closeConfirmDialog()
          this.showError('Ошибка удаления задачи')
        }
      }
    },
    
    formatDateTimeLocal(date) {
      if (!date) return ''
      const d = new Date(date)
      // Корректируем для локального времени
      const offsetMs = d.getTimezoneOffset() * 60 * 1000
      const localTime = new Date(d.getTime() - offsetMs)
      return localTime.toISOString().slice(0, 16)
    },
    
    formatDateForAPI(dateString) {
      if (!dateString) return null
      
      // Если уже в правильном формате ISO, возвращаем как есть
      if (dateString.includes('T') && dateString.includes(':')) {
        // Добавляем секунды если их нет
        if (dateString.length === 16) { // YYYY-MM-DDTHH:MM
          dateString += ':00'
        }
        
        // Добавляем таймзону если её нет
        if (!dateString.includes('Z') && !dateString.includes('+') && !dateString.includes('-', 10)) {
          // Получаем смещение таймзоны
          const date = new Date(dateString)
          const offsetMinutes = date.getTimezoneOffset()
          const offsetHours = Math.abs(Math.floor(offsetMinutes / 60))
          const offsetMins = Math.abs(offsetMinutes % 60)
          const offsetSign = offsetMinutes <= 0 ? '+' : '-'
          const timezoneOffset = `${offsetSign}${offsetHours.toString().padStart(2, '0')}:${offsetMins.toString().padStart(2, '0')}`
          dateString += timezoneOffset
        }
        
        return dateString
      }
      
      // Иначе считаем что это локальная дата и преобразуем в ISO
      const date = new Date(dateString)
      return date.toISOString()
    },
    
    formatDateTime(date) {
      if (!date) return 'Не указана'
      try {
        const d = new Date(date)
        if (isNaN(d.getTime())) return 'Неверная дата'
        return d.toLocaleDateString('ru-RU', {
          year: 'numeric',
          month: 'long',
          day: 'numeric',
          hour: '2-digit',
          minute: '2-digit'
        })
      } catch (e) {
        console.warn('Ошибка форматирования даты:', e)
        return 'Ошибка даты'
      }
    },
    
    formatSelectedDate(date) {
      return date.toLocaleDateString('ru-RU', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      })
    },
    
    getStatusClass(status) {
      const classes = {
        'todo': 'bg-secondary',
        'in_progress': 'bg-info',
        'review': 'bg-warning text-dark',
        'done': 'bg-success',
        'cancelled': 'bg-danger'
      }
      return classes[status] || 'bg-secondary'
    },
    
    getStatusText(status) {
      const statusObj = this.taskStatuses.find(s => s.code === status)
      if (statusObj) return statusObj.name
      
      // Fallback для старых значений
      const texts = {
        'todo': 'К выполнению',
        'in_progress': 'В работе',
        'review': 'На проверке',
        'done': 'Выполнено',
        'cancelled': 'Отменено'
      }
      return texts[status] || status
    },
    
    getPriorityClass(priority) {
      const classes = {
        'low': 'bg-secondary',
        'medium': 'bg-primary',
        'high': 'bg-warning text-dark',
        'urgent': 'bg-danger'
      }
      return classes[priority] || 'bg-secondary'
    },
    
    getPriorityText(priority) {
      const priorityObj = this.taskPriorities.find(p => p.code === priority)
      if (priorityObj) return priorityObj.name
      
      // Fallback для старых значений
      const texts = {
        'low': 'Низкий',
        'medium': 'Средний',
        'high': 'Высокий',
        'urgent': 'Срочный'
      }
      return texts[priority] || priority
    },
    
    getDueDateClass(dueDate, status) {
      if (status === 'done') return 'text-muted'
      if (!dueDate) return 'text-muted'
      
      const now = new Date()
      const due = new Date(dueDate)
      
      if (due < now) return 'text-danger'
      if (due - now < 24 * 60 * 60 * 1000) return 'text-warning'
      return 'text-muted'
    },
    
    truncateText(text, maxLength) {
      if (!text) return ''
      return text.length > maxLength ? text.substring(0, maxLength) + '...' : text
    },
    
    getProjectPriorityClass(priority) {
      const classes = {
        'low': 'bg-secondary',
        'medium': 'bg-primary',
        'high': 'bg-warning text-dark',
        'urgent': 'bg-danger'
      }
      return classes[priority] || 'bg-secondary'
    },
    
    getProjectPriorityText(priority) {
      const priorityObj = this.projectPriorities.find(p => p.code === priority)
      if (priorityObj) return priorityObj.name
      
      // Fallback для старых значений
      const texts = {
        'low': 'Низкий',
        'medium': 'Средний',
        'high': 'Высокий',
        'urgent': 'Срочный'
      }
      return texts[priority] || priority
    },
    
    getProjectStatusClass(status) {
      const classes = {
        'todo': 'bg-secondary',
        'in_progress': 'bg-info',
        'review': 'bg-warning text-dark',
        'done': 'bg-success',
        'cancelled': 'bg-danger'
      }
      return classes[status] || 'bg-secondary'
    },
    
    getProjectStatusText(status) {
      const statusObj = this.projectStatuses.find(s => s.code === status)
      if (statusObj) return statusObj.name
      
      // Fallback для старых значений
      const texts = {
        'todo': 'К выполнению',
        'in_progress': 'В работе',
        'review': 'На проверке',
        'done': 'Выполнено',
        'cancelled': 'Отменено'
      }
      return texts[status] || status
    },
    
    formatDate(date) {
      if (!date) return 'Не указана'
      try {
        const d = new Date(date)
        if (isNaN(d.getTime())) return 'Неверная дата'
        return d.toLocaleDateString('ru-RU', {
          year: 'numeric',
          month: 'long',
          day: 'numeric'
        })
      } catch (e) {
        console.warn('Ошибка форматирования даты:', e)
        return 'Ошибка даты'
      }
    },
    
    viewProject(projectEvent) {
      // Переходим к детальному просмотру проекта
      if (!projectEvent || !projectEvent.id) {
        console.error('Некорректные данные проекта:', projectEvent)
        this.showError('Ошибка открытия проекта')
        return
      }
      
      try {
        this.$router.push({
          name: 'ProjectDetail',
          params: { id: projectEvent.id.toString() }
        })
      } catch (error) {
        console.error('Ошибка навигации:', error)
        this.showError('Ошибка перехода к проекту')
      }
    },
    
    getEventsCount(date) {
      const projects = this.getProjectsForDay(date).length
      const tasks = this.getTasksForDay(date).length
      return projects + tasks
    },
    
    getDueDateIconClass(dueDate, status) {
      if (status === 'done') return 'text-muted'
      
      const now = new Date()
      const due = new Date(dueDate)
      
      if (due < now) return 'text-danger'
      if (due - now < 24 * 60 * 60 * 1000) return 'text-warning'
      return 'text-muted'
    },
    
    formatDateRange(startDate, endDate) {
      const formatDate = (date) => {
        if (!date) return null
        try {
          const d = new Date(date)
          if (isNaN(d.getTime())) return null
          return d.toLocaleDateString('ru-RU')
        } catch (e) {
          console.warn('Ошибка форматирования даты в диапазоне:', e)
          return null
        }
      }
      
      const start = formatDate(startDate)
      const end = formatDate(endDate)
      
      if (start && end) return `${start} - ${end}`
      if (start) return `с ${start}`
      if (end) return `до ${end}`
      return 'Даты не указаны'
    },
    
    formatEventTime(startDate, endDate) {
      if (!startDate && !endDate) return ''
      
      const formatTime = (date) => {
        if (!date) return ''
        try {
          const d = new Date(date)
          // Проверяем что дата валидна
          if (isNaN(d.getTime())) return ''
          return d.toLocaleTimeString('ru-RU', { 
            hour: '2-digit', 
            minute: '2-digit' 
          })
        } catch (e) {
          console.warn('Ошибка форматирования времени:', e)
          return ''
        }
      }
      
      const startTime = formatTime(startDate)
      const endTime = formatTime(endDate)
      
      if (startTime && endTime) {
        return `${startTime} - ${endTime}`
      } else if (startTime) {
        return `с ${startTime}`
      } else if (endTime) {
        return `до ${endTime}`
      }
      
      return ''
    },
    
    hasProjectEventOnDate(project, eventType) {
      if (!this.selectedDate || !project) return false
      
      const projectEvents = this.getProjectsForDay(this.selectedDate)
      return projectEvents.some(event => 
        event.id === project.id && event.eventType === eventType
      )
    },
    
    hasTaskEventOnDate(task, eventType) {
      if (!this.selectedDate || !task) return false
      
      const taskEvents = this.getTasksForDay(this.selectedDate)
      return taskEvents.some(event => 
        event.id === task.id && event.eventType === eventType
      )
    }
  }
}
</script>

<style scoped lang="scss">
@import './project-management.scss';

.task-calendar {
  padding: 20px;
  min-height: 100vh;
  background: var(--bs-gray-100);
}

.pm-page-header {
  margin-bottom: 20px;
  
  .btn {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 0.5rem;
    padding: 0.75rem 1.25rem;
    font-weight: 600;
    border-radius: 8px;
    transition: all 0.2s ease;
    text-align: center;
    
    &:hover {
      transform: translateY(-1px);
      box-shadow: 0 4px 8px rgba(0, 0, 0, 0.15);
    }
    
    &:active {
      transform: translateY(0);
    }
  }
  
  .btn-outline-primary {
    border: 2px solid var(--bs-primary);
    color: var(--bs-primary);
    background: transparent;
    
    &:hover {
      background: var(--bs-primary);
      color: white;
      border-color: var(--bs-primary);
    }
  }
  
  .btn-primary {
    background: var(--bs-primary);
    border: 2px solid var(--bs-primary);
    color: white;
    
    &:hover {
      background: var(--bs-primary-dark);
      border-color: var(--bs-primary-dark);
    }
  }
}

.calendar-navigation {
  @include pm-card;
  padding: 1.5rem;
  margin-bottom: 2rem;
  
  h3 {
    font-size: $font-size-h2;
    font-weight: $font-weight-bold;
    color: var(--bs-heading-color);
    margin: 0;
  }
  
  .calendar-nav-buttons {
    display: flex;
    align-items: center;
    gap: 2rem;
    
    .btn-nav {
      width: 44px;
      height: 44px;
      padding: 0;
      display: flex;
      align-items: center;
      justify-content: center;
      border-radius: 50%;
      background: linear-gradient(135deg, #f8fbff 60%, #e3f0ff 100%);
      border: 2.5px solid var(--bs-primary);
      color: var(--bs-primary);
      transition: all 0.18s cubic-bezier(.4,0,.2,1);
      font-weight: 700;
      box-shadow: 0 2px 8px rgba(0,123,255,0.07);
      outline: none;
      position: relative;
      z-index: 1;
      
      svg {
        width: 26px;
        height: 26px;
        color: var(--bs-primary);
        transition: color 0.18s;
      }
      
      &:hover, &:focus {
        background: linear-gradient(135deg, #e3f0ff 60%, #b6d6ff 100%);
        color: #fff;
        border-color: var(--bs-primary);
        box-shadow: 0 6px 18px rgba(0,123,255,0.13);
        transform: scale(1.08) translateY(-2px);
        svg {
          color: #0056b3;
        }
      }
      &:active {
        transform: scale(0.97);
        box-shadow: 0 2px 6px rgba(0,123,255,0.10);
      }
    }
    
    .year-nav-group {
      display: flex;
      align-items: center;
      gap: 0.75rem;
      padding: 0.5rem 1rem;
      background: linear-gradient(135deg, #f8fbff 60%, #e3f0ff 100%);
      border: 2px solid var(--bs-primary);
      border-radius: 25px;
      box-shadow: 0 2px 8px rgba(0,123,255,0.07);
      
      .year-display {
        font-weight: 700;
        font-size: 1rem;
        color: var(--bs-primary);
        min-width: 3rem;
        text-align: center;
        letter-spacing: 0.5px;
      }
      
      .btn-year {
        width: 32px;
        height: 32px;
        padding: 0;
        border-radius: 50%;
        background: transparent;
        border: 1px solid var(--bs-primary);
        color: var(--bs-primary);
        font-size: 0.875rem;
        transition: all 0.18s;
        display: flex;
        align-items: center;
        justify-content: center;
        
        svg {
          color: var(--bs-primary);
          transition: color 0.18s;
        }
        
        &:hover {
          background: var(--bs-primary);
          color: white;
          transform: scale(1.1);
          
          svg {
            color: white;
          }
        }
        
        &:active {
          transform: scale(0.95);
        }
      }
    }
    
    .month-nav-group {
      display: flex;
      align-items: center;
      gap: 1.25rem;
    }
    
    .btn-today {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      padding: 0.5rem 1.25rem;
      border-radius: 999px;
      background: transparent;
      border: 2px solid var(--bs-primary);
      color: var(--bs-primary);
      font-weight: 600;
      transition: all 0.2s;
      box-shadow: none;
      outline: none;
      
      svg {
        color: var(--bs-primary);
      }
      
      &:hover, &:focus {
        background: var(--bs-primary);
        color: #fff;
        svg {
          color: #fff;
        }
        box-shadow: 0 4px 12px rgba(0,123,255,0.10);
        border-color: var(--bs-primary);
        transform: translateY(-2px);
      }
      &:active {
        transform: scale(0.97);
      }
    }
  }
  
  .calendar-view-options {
    .form-check-label {
      font-size: $font-size-small;
      cursor: pointer;
    }
  }
}

.calendar-wrapper {
  @include pm-card;
  padding: 0;
  overflow: hidden;
}

.calendar-header {
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  background: var(--bs-light);
  border-bottom: 2px solid var(--bs-border-color);
  
  .calendar-day-header {
    padding: 1rem;
    font-weight: $font-weight-bold;
    text-align: center;
    font-size: $font-size-small;
    color: var(--bs-secondary-color);
    text-transform: uppercase;
    letter-spacing: 0.5px;
    
    &:first-child {
      color: var(--bs-primary);
    }
    
    &:last-child {
      color: var(--bs-danger);
    }
  }
}

.calendar-body {
  .calendar-week {
    display: grid;
    grid-template-columns: repeat(7, 1fr);
    
    &:not(:last-child) {
      border-bottom: 1px solid var(--bs-border-color);
    }
  }
  
  .calendar-day {
    min-height: 120px;
    padding: 0.75rem;
    border-right: 1px solid var(--bs-border-color);
    cursor: pointer;
    transition: all $pm-transition;
    position: relative;
    overflow: hidden;
    
    &:last-child {
      border-right: none;
    }
    
    &:hover {
      background-color: var(--bs-light);
    }
    
    &.calendar-day-other-month {
      background-color: var(--bs-gray-100);
      
      .day-number {
        color: var(--bs-gray-500);
      }
    }
    
    &.calendar-day-today {
      background-color: rgba($primary, 0.05);
      
      .day-number {
        background: var(--bs-primary);
        color: white;
        width: 28px;
        height: 28px;
        border-radius: 50%;
        display: inline-flex;
        align-items: center;
        justify-content: center;
      }
    }
    
    &.calendar-day-selected {
      background-color: rgba($primary, 0.1);
      border: 2px solid var(--bs-primary);
    }
    
    .day-header {
      display: flex;
      justify-content: space-between;
      align-items: start;
      margin-bottom: 0.5rem;
      
      .day-number {
        font-weight: $font-weight-bold;
        font-size: $font-size-usual;
      }
      
      .event-count {
        background: var(--bs-primary);
        color: white;
        font-size: $font-size-micro;
        padding: 2px 6px;
        border-radius: 10px;
        font-weight: $font-weight-bold;
      }
    }
    
    .day-events {
      display: flex;
      flex-direction: column;
      gap: 4px;
      
      .event-item {
        padding: 3px 6px;
        border-radius: 4px;
        font-size: $font-size-micro;
        cursor: pointer;
        transition: all $pm-transition;
        overflow: hidden;
        
        &:hover {
          transform: translateX(2px);
        }
        
        &.project-event {
          border-left: 3px solid;
          
          &.event-start {
            border-left-style: solid;
            opacity: 0.9;
          }
          
          &.event-end {
            border-left-style: dashed;
            opacity: 0.8;
          }
        }
        
        &.task-event {
          background: var(--bs-light);
          border-left: 3px solid var(--bs-primary);
          
          &.event-start {
            border-left-style: solid;
            opacity: 0.9;
          }
          
          &.event-due {
            border-left-style: dashed;
            opacity: 0.8;
            background: rgba($warning, 0.15);
          }
          
          &.event-end {
            border-left-style: dotted;
            opacity: 0.8;
            background: rgba($success, 0.15);
          }
          
          &.priority-urgent {
            border-left-color: var(--bs-danger);
            background: rgba($danger, 0.1);
            
            &.event-due {
              background: rgba($danger, 0.15);
            }
            
            &.event-end {
              background: rgba($danger, 0.12);
            }
          }
          
          &.priority-high {
            border-left-color: var(--bs-warning);
            background: rgba($warning, 0.1);
            
            &.event-end {
              background: rgba($warning, 0.12);
            }
          }
          
          &.priority-medium {
            border-left-color: var(--bs-primary);
            background: rgba($primary, 0.1);
            
            &.event-end {
              background: rgba($primary, 0.12);
            }
          }
          
          &.priority-low {
            border-left-color: var(--bs-secondary);
            background: rgba($secondary, 0.1);
            
            &.event-end {
              background: rgba($secondary, 0.12);
            }
          }
        }
        
        .event-content {
          display: flex;
          flex-direction: column;
          gap: 2px;
          
          .event-title {
            display: flex;
            align-items: center;
            gap: 4px;
            white-space: nowrap;
            overflow: hidden;
            text-overflow: ellipsis;
            
            i {
              font-size: 8px;
              flex-shrink: 0;
            }
          }
          
          .event-time {
            font-size: 9px;
            color: var(--bs-secondary-color);
            line-height: 1;
            opacity: 0.8;
            
            small {
              font-size: inherit;
            }
          }
        }
      }
      
      .event-more {
        text-align: center;
        font-size: $font-size-micro;
        color: var(--bs-primary);
        font-weight: $font-weight-bold;
        cursor: pointer;
      }
    }
  }
}

// Стили для индикаторов событий
.event-indicators {
  .badge {
    font-size: 10px;
    padding: 3px 6px;
    
    &.badge-start {
      background-color: var(--bs-success);
      color: white;
    }
    
    &.badge-end {
      background-color: var(--bs-secondary);
      color: white;
    }
    
    &.badge-due {
      background-color: var(--bs-warning);
      color: var(--bs-dark);
    }
    
    i {
      font-size: 8px;
    }
  }
}

.selected-date-events {
  @include pm-card;
  margin-top: 2rem;
  padding: 0;
  
  .events-header {
    padding: 1rem 1.5rem;
    background: var(--bs-light);
    border-bottom: 1px solid var(--bs-border-color);
    
    h5 {
      margin: 0;
      font-size: $font-size-h3;
      font-weight: $font-weight-bold;
      color: var(--bs-heading-color);
    }
  }
  
  .events-body {
    padding: 1.5rem;
    
    .section-title {
      font-size: $font-size-usual;
      font-weight: $font-weight-bold;
      margin-bottom: 1rem;
    }
    
    .event-list {
      display: flex;
      flex-direction: column;
      gap: 1rem;
    }
    
    .event-card {
      background: var(--bs-light);
      border-radius: $radius-small;
      overflow: hidden;
      transition: all $pm-transition;
      
      &:hover {
        transform: translateY(-2px);
        box-shadow: $pm-card-hover-shadow;
      }
      
      &.project-card {
        .event-card-header {
          border-left: 4px solid;
        }
      }
      
      .event-card-header {
        padding: 1rem;
        background: white;
        border-bottom: 1px solid var(--bs-border-color);
        
        h6 {
          font-size: $font-size-usual;
          font-weight: $font-weight-bold;
          margin-bottom: 0.5rem;
        }
        
        .badges {
          display: flex;
          gap: 0.5rem;
          flex-wrap: wrap;
        }
      }
      
      .event-card-body {
        padding: 1rem;
        
        .event-meta {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          font-size: $font-size-small;
          margin-bottom: 0.5rem;
          
          i {
            width: 16px;
            text-align: center;
          }
        }
      }
      
      .event-card-footer {
        padding: 1rem;
        background: white;
        border-top: 1px solid var(--bs-border-color);
      }
    }
  }
}

.badge {
  @include pm-badge;
}

.btn {
  @include pm-button;
}

// Адаптивность
@media (max-width: 768px) {
  .task-calendar {
    padding: 1rem;
  }
  
  .pm-page-header {
    flex-direction: column;
    gap: 1rem;
    
    h2 {
      font-size: $font-size-h2;
    }
  }
  
  .calendar-navigation {
    padding: 1rem;
    
    h3 {
      font-size: $font-size-h3;
    }
    
    .d-flex {
      flex-wrap: wrap;
      gap: 1rem;
    }
    
    .calendar-nav-buttons {
      gap: 1rem;
      
      .year-nav-group {
        padding: 0.4rem 0.8rem;
        
        .year-display {
          font-size: 0.9rem;
          min-width: 2.5rem;
        }
        
        .btn-year {
          width: 28px;
          height: 28px;
          font-size: 0.75rem;
          
          svg {
            width: 14px;
            height: 14px;
          }
        }
      }
      
      .month-nav-group {
        gap: 1rem;
        
        .btn-nav {
          width: 36px;
          height: 36px;
        }
        
        .btn-today {
          padding: 0.4rem 1rem;
          font-size: 0.875rem;
          
          span {
            display: none;
          }
        }
      }
    }
    
    .calendar-view-options {
      flex-direction: column;
      gap: 0.5rem;
      
      .form-check {
        margin: 0;
      }
    }
  }
  
  .calendar-body {
    .calendar-day {
      min-height: 80px;
      padding: 0.5rem;
      
      .day-header {
        .day-number {
          font-size: $font-size-small;
        }
      }
      
      .day-events {
        .event-item {
          font-size: 10px;
          padding: 2px 4px;
        }
      }
    }
  }
}
</style> 