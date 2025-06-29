<template>
  <div class="task-calendar">
    <div class="pm-page-header d-flex justify-content-between align-items-center">
      <h2><i class="fas fa-calendar-alt me-2"></i>Календарь проектов и задач</h2>
      <div>
        <button class="btn btn-outline-secondary me-2" @click="goToToday">
          <i class="fas fa-calendar-day me-1"></i>Сегодня
        </button>
        <button class="btn btn-primary" @click="createTask">
          <i class="fas fa-plus me-2"></i>Создать задачу
        </button>
      </div>
    </div>

    <!-- Навигация по календарю -->
    <div class="calendar-navigation">
      <div class="d-flex justify-content-between align-items-center">
        <div class="btn-group">
          <button class="btn btn-light" @click="previousMonth">
            <i class="fas fa-chevron-left"></i>
          </button>
          <button class="btn btn-light" @click="goToToday">
            Сегодня
          </button>
          <button class="btn btn-light" @click="nextMonth">
            <i class="fas fa-chevron-right"></i>
          </button>
        </div>
        <h3 class="mb-0 text-center flex-grow-1">{{ currentMonthYear }}</h3>
        <div class="calendar-view-options">
          <div class="form-check form-switch form-check-inline">
            <input class="form-check-input" type="checkbox" v-model="showTasks" @change="loadEvents" id="showTasks">
            <label class="form-check-label" for="showTasks">
              <i class="fas fa-tasks text-primary"></i> Задачи
            </label>
          </div>
          <div class="form-check form-switch form-check-inline">
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
              <option value="todo">К выполнению</option>
              <option value="in_progress">В работе</option>
              <option value="review">На проверке</option>
              <option value="done">Выполнено</option>
            </select>
          </div>
          <div class="col-md-3">
            <label class="form-label">Приоритет</label>
            <select class="form-select" v-model="filters.priority" @change="loadEvents">
              <option value="">Все приоритеты</option>
              <option value="low">Низкий</option>
              <option value="medium">Средний</option>
              <option value="high">Высокий</option>
              <option value="urgent">Срочный</option>
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
                   v-for="(project, index) in getProjectsForDay(day.date).slice(0, 2)" 
                   :key="'project-' + project.id"
                   :style="{ backgroundColor: project.color + '20', borderColor: project.color }"
                   @click.stop="viewProject(project)"
                   :title="project.name">
                <i class="fas fa-circle" :style="{ color: project.color }"></i>
                <span>{{ truncateText(project.name, 12) }}</span>
              </div>
              
              <!-- Задачи -->
              <div class="event-item task-event" 
                   v-for="(task, index) in getTasksForDay(day.date).slice(0, 2)" 
                   :key="'task-' + task.id"
                   :class="'priority-' + task.priority"
                   @click.stop="viewTask(task)"
                   :title="task.title">
                <span>{{ truncateText(task.title, 12) }}</span>
              </div>
              
              <!-- Показать больше -->
              <div class="event-more" v-if="getEventsCount(day.date) > 4">
                +{{ getEventsCount(day.date) - 4 }}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Список событий для выбранной даты -->
    <div class="selected-date-events" v-if="selectedDate && (projectsForSelectedDate.length > 0 || tasksForSelectedDate.length > 0)">
      <div class="events-header">
        <h5><i class="fas fa-calendar-check me-2"></i>События на {{ formatSelectedDate(selectedDate) }}</h5>
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

    <!-- Модальное окно создания/редактирования задачи -->
    <div class="modal fade" id="taskModal" tabindex="-1">
      <div class="modal-dialog modal-lg">
        <div class="modal-content">
          <div class="modal-header">
            <h5 class="modal-title">{{ isEditing ? 'Редактировать задачу' : 'Создать задачу' }}</h5>
            <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
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
                      <option value="todo">К выполнению</option>
                      <option value="in_progress">В работе</option>
                      <option value="review">На проверке</option>
                      <option value="done">Выполнено</option>
                    </select>
                  </div>
                </div>
              </div>
              
              <div class="row">
                <div class="col-md-4">
                  <div class="mb-3">
                    <label class="form-label">Приоритет</label>
                    <select class="form-select" v-model="currentTask.priority">
                      <option value="low">Низкий</option>
                      <option value="medium">Средний</option>
                      <option value="high">Высокий</option>
                      <option value="urgent">Срочный</option>
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
    <div class="modal fade" id="taskViewModal" tabindex="-1">
      <div class="modal-dialog">
        <div class="modal-content">
          <div class="modal-header">
            <h5 class="modal-title">{{ viewTaskData.title }}</h5>
            <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
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
import { Modal } from 'bootstrap'
import projectManagementApi from '@/js/api/projectManagementApi.js'

export default {
  name: 'TaskCalendar',
  data() {
    return {
      currentDate: new Date(),
      selectedDate: null,
      tasks: [],
      projects: [],
      allProjects: [], // Все проекты для календаря
      users: [],
      filters: {
        project_id: '',
        status: '',
        priority: '',
        my_tasks: false
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
      return this.getTasksForDay(this.selectedDate)
    },
    
    projectsForSelectedDate() {
      if (!this.selectedDate) return []
      return this.getProjectsForDay(this.selectedDate)
    }
  },
  
  async mounted() {
    await this.loadProjects()
    await this.loadUsers()
    this.loadEvents()
  },
  
  methods: {
    async loadProjects() {
      try {
        const response = await projectManagementApi.getProjects({ my_projects: true })
        this.projects = Array.isArray(response.data.results) ? response.data.results : 
                        Array.isArray(response.data) ? response.data : []
        
        // Загружаем все проекты для календаря
        const allProjectsResponse = await projectManagementApi.getProjects({})
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
    
    async loadEvents() {
      try {
        if (this.showTasks) {
          const startOfMonth = new Date(this.currentDate.getFullYear(), this.currentDate.getMonth(), 1)
          const endOfMonth = new Date(this.currentDate.getFullYear(), this.currentDate.getMonth() + 1, 0)
          
          const params = {
            start_date: startOfMonth.toISOString().split('T')[0],
            end_date: endOfMonth.toISOString().split('T')[0],
            ...this.filters
          }
          
          // Убираем пустые фильтры
          Object.keys(params).forEach(key => {
            if (params[key] === '' || params[key] === false) {
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
      
      return this.allProjects.filter(project => {
        if (!project) return false
        
        const projectStart = project.start_date ? new Date(project.start_date) : null
        const projectEnd = project.end_date ? new Date(project.end_date) : null
        
        // Проект отображается если он начинается в этот день или завершается
        if (projectStart && this.isSameDay(projectStart, date)) return true
        if (projectEnd && this.isSameDay(projectEnd, date)) return true
        
        return false
      })
    },
    
    getTasksForDay(date) {
      if (!this.showTasks) return []
      
      return this.tasks.filter(task => {
        if (!task) return false
        
        const taskStart = task.start_date ? new Date(task.start_date) : null
        const taskDue = task.due_date ? new Date(task.due_date) : null
        
        // Задача отображается если она начинается в этот день или должна быть завершена
        if (taskStart && this.isSameDay(taskStart, date)) return true
        if (taskDue && this.isSameDay(taskDue, date)) return true
        
        return false
      })
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
      const hasEvents = this.getTasksForDay(date).length > 0 || this.getProjectsForDay(date).length > 0
      
      if (!hasEvents) {
        // Если нет событий на эту дату, предлагаем создать задачу
        this.currentTask.start_date = this.formatDateTimeLocal(date)
        this.createTask()
      }
    },
    
    previousMonth() {
      this.currentDate = new Date(this.currentDate.getFullYear(), this.currentDate.getMonth() - 1, 1)
      this.loadEvents()
    },
    
    nextMonth() {
      this.currentDate = new Date(this.currentDate.getFullYear(), this.currentDate.getMonth() + 1, 1)
      this.loadEvents()
    },
    
    goToToday() {
      this.currentDate = new Date()
      this.selectedDate = new Date()
      this.loadEvents()
    },
    
    createTask() {
      this.isEditing = false
      if (!this.currentTask.start_date) {
        this.currentTask.start_date = this.formatDateTimeLocal(this.selectedDate || new Date())
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
        start_date: task.start_date ? this.formatDateTimeLocal(new Date(task.start_date)) : '',
        due_date: task.due_date ? this.formatDateTimeLocal(new Date(task.due_date)) : '',
        estimated_hours: task.estimated_hours
      }
      
      // Закрываем модальное окно просмотра
      const viewModal = Modal.getInstance(document.getElementById('taskViewModal'))
      if (viewModal) viewModal.hide()
      
      // Открываем модальное окно редактирования
      const editModal = new Modal(document.getElementById('taskModal'))
      editModal.show()
    },
    
    viewTask(task) {
      this.viewTaskData = task
      const modal = new Modal(document.getElementById('taskViewModal'))
      modal.show()
    },
    
    async submitTask() {
      try {
        let response
        
        if (this.isEditing) {
          response = await projectManagementApi.updateTask(this.currentTask.id, this.currentTask)
        } else {
          response = await projectManagementApi.createTask(this.currentTask)
        }
        
        // Закрываем модальное окно
        const modal = Modal.getInstance(document.getElementById('taskModal'))
        modal.hide()
        
        // Сбрасываем форму
        this.currentTask = {
          title: '',
          description: '',
          project_id: '',
          assignee_id: '',
          status: 'todo',
          priority: 'medium',
          start_date: '',
          due_date: '',
          estimated_hours: null
        }
        
        // Перезагружаем события
        this.loadEvents()
        
        this.$toast?.success(this.isEditing ? 'Задача обновлена' : 'Задача создана')
      } catch (error) {
        console.error('Ошибка сохранения задачи:', error)
        this.$toast?.error('Ошибка сохранения задачи')
      }
    },
    
    async deleteTask() {
      if (confirm('Вы уверены, что хотите удалить эту задачу?')) {
        try {
          await projectManagementApi.deleteTask(this.currentTask.id)
          
          // Закрываем модальное окно
          const modal = Modal.getInstance(document.getElementById('taskModal'))
          modal.hide()
          
          // Перезагружаем события
          this.loadEvents()
          
          this.$toast?.success('Задача удалена')
        } catch (error) {
          console.error('Ошибка удаления задачи:', error)
          this.$toast?.error('Ошибка удаления задачи')
        }
      }
    },
    
    formatDateTimeLocal(date) {
      if (!date) return ''
      const d = new Date(date)
      return d.toISOString().slice(0, 16)
    },
    
    formatDateTime(date) {
      if (!date) return 'Не указана'
      return new Date(date).toLocaleDateString('ru-RU', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      })
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
      return new Date(date).toLocaleDateString('ru-RU', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      })
    },
    
    viewProject(project) {
      // Переходим к детальному просмотру проекта
      this.$router.push({
        name: 'project-detail',
        params: { id: project.id }
      })
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
        return new Date(date).toLocaleDateString('ru-RU')
      }
      
      const start = formatDate(startDate)
      const end = formatDate(endDate)
      
      if (start && end) return `${start} - ${end}`
      if (start) return `с ${start}`
      if (end) return `до ${end}`
      return 'Даты не указаны'
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
        display: flex;
        align-items: center;
        gap: 4px;
        overflow: hidden;
        white-space: nowrap;
        text-overflow: ellipsis;
        
        &:hover {
          transform: translateX(2px);
        }
        
        i {
          font-size: 8px;
        }
        
        &.project-event {
          border-left: 3px solid;
        }
        
        &.task-event {
          background: var(--bs-light);
          border-left: 3px solid var(--bs-primary);
          
          &.priority-urgent {
            border-left-color: var(--bs-danger);
            background: rgba($danger, 0.1);
          }
          
          &.priority-high {
            border-left-color: var(--bs-warning);
            background: rgba($warning, 0.1);
          }
          
          &.priority-medium {
            border-left-color: var(--bs-primary);
            background: rgba($primary, 0.1);
          }
          
          &.priority-low {
            border-left-color: var(--bs-secondary);
            background: rgba($secondary, 0.1);
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

.selected-date-events {
  @include pm-card;
  margin-top: 2rem;
  padding: 0;
  
  .events-header {
    padding: 1.5rem;
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