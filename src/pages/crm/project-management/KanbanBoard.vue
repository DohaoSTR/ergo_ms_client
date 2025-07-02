<template>
  <div class="kanban-board">
    <div class="pm-page-header d-flex justify-content-between align-items-center">
      <div>
        <h2><i class="fas fa-columns"></i> Доска задач</h2>
        <small class="text-muted" v-if="Object.keys(kanbanColumns).length > 0">
          {{ Object.keys(kanbanColumns).length }} {{ Object.keys(kanbanColumns).length === 1 ? 'колонка' : Object.keys(kanbanColumns).length < 5 ? 'колонки' : 'колонок' }}
        </small>
      </div>
      <div>
        <button class="btn btn-primary" @click="createTask">
          <i class="fas fa-plus me-2"></i>Создать задачу
        </button>
      </div>
    </div>

    <!-- Фильтры -->
    <div class="pm-filters-card">
      <div class="card-body">
        <div class="row g-3">
          <div class="col-md-4">
            <label class="form-label">Проект</label>
            <select class="form-select" v-model="filters.project_id" @change="loadKanbanData">
              <option value="">Все проекты</option>
              <option v-for="project in projects" :key="project.id" :value="project.id">
                {{ project.name }}
              </option>
            </select>
          </div>
          <div class="col-md-3">
            <label class="form-label">Приоритет</label>
            <select class="form-select" v-model="filters.priority" @change="loadKanbanData">
              <option value="">Все приоритеты</option>
              <option v-for="priority in taskPriorities" :key="priority.id" :value="priority.code">
                {{ priority.name }}
              </option>
            </select>
          </div>
          <div class="col-md-3">
            <label class="form-label">Исполнитель</label>
            <select class="form-select" v-model="filters.assignee" @change="onAssigneeChange">
              <option value="">Все исполнители</option>
              <option v-for="user in users" :key="user.id" :value="user.id">
                {{ user.full_name }}
              </option>
            </select>
          </div>
          <div class="col-md-2">
            <label class="form-label">Сортировка</label>
            <select class="form-select" v-model="filters.ordering" @change="loadKanbanData">
              <option value="kanban_order">По порядку в доске</option>
              <option value="-created_at">По дате создания ↓</option>
              <option value="created_at">По дате создания ↑</option>
              <option value="due_date">По сроку выполнения ↑</option>
              <option value="-due_date">По сроку выполнения ↓</option>
              <option value="priority">По приоритету ↑</option>
              <option value="-priority">По приоритету ↓</option>
              <option value="assignee">По исполнителю ↑</option>
              <option value="-assignee">По исполнителю ↓</option>
            </select>
          </div>
        </div>
        <div class="row g-3 mt-2">
          <div class="col-md-4 d-flex align-items-center">
            <div class="form-check">
              <input class="form-check-input" type="checkbox" v-model="filters.my_tasks" 
                     @change="onMyTasksChange" id="myTasksKanban">
              <label class="form-check-label" for="myTasksKanban">
                Только мои задачи
              </label>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Канбан колонки -->
    <div class="kanban-container">
      <!-- Показываем сообщение если нет колонок -->
      <div v-if="Object.keys(kanbanColumns).length === 0" class="text-center py-5">
        <div class="spinner-border text-primary mb-3" role="status">
          <span class="visually-hidden">Загрузка...</span>
        </div>
        <p class="text-muted">Загрузка колонок канбан доски...</p>
      </div>
      
      <!-- Тестовая область для drag and drop -->
      <div v-if="false" class="test-area mb-4">
        <h5>Тест Drag and Drop:</h5>
        <div style="display: flex; gap: 20px;">
          <div style="min-height: 100px; background: #f0f0f0; padding: 10px; flex: 1;"
               @drop.prevent="console.log('Test drop 1')"
               @dragover.prevent="console.log('Test dragover 1')">
            <div draggable="true" 
                 @dragstart="console.log('Test dragstart')"
                 style="background: white; padding: 10px; cursor: grab;">
              Тестовая задача
            </div>
          </div>
          <div style="min-height: 100px; background: #e0e0e0; padding: 10px; flex: 1;"
               @drop.prevent="console.log('Test drop 2')"
               @dragover.prevent="console.log('Test dragover 2')">
            Зона 2
          </div>
        </div>
      </div>
      
      <div v-else class="kanban-columns-container">
        <div :class="`${columnClass} kanban-drop-zone`" 
             v-for="(column, status) in sortedKanbanColumns" 
             :key="status"
             @drop="onDrop($event, status)" 
             @dragover="onDragOver($event, status)"
             @dragenter="onDragEnter($event, status)"
             @dragleave="onDragLeave($event, status)">
          <div class="kanban-column">
            <div class="kanban-header" 
                 :class="getColumnHeaderClass(status)"
                 :style="getColumnHeaderStyle(status)">
              <h5 class="mb-0 d-flex align-items-center justify-content-between">
                <span>
                  <i :class="getColumnIcon(status)" class="me-2"></i>
                  {{ column.title }}
                </span>
                <span class="task-count">{{ column.tasks.length }}</span>
              </h5>
            </div>
            
            <div class="kanban-body" 
                 :class="{ 'drag-over': dragOverColumn === status }">
              
              <div class="kanban-task pm-fade-in" 
                   v-for="(task, index) in column.tasks" 
                   :key="task.id"
                   :data-task-id="task.id"
                   :data-task-index="index"
                   draggable="true"
                   @dragstart="onDragStart($event, task)"
                   @dragend="onDragEnd"
                   @dragover.prevent="onTaskDragOver($event, task, status, index)"
                   @drop.prevent.stop="onTaskDrop($event, task, status, index)"
                   @dragleave="onTaskDragLeave($event)"
                   @click="viewTask(task)">
                
                <div class="task-header">
                  <span class="badge rounded-pill" 
                        :class="getPriorityClass(task.priority)" 
                        :style="getPriorityStyle(task.priority)">
                    {{ getPriorityText(task.priority) }}
                  </span>
                  <button class="btn btn-sm btn-link task-action" 
                          @click.stop.prevent="editTask(task)"
                          @dragstart.stop.prevent
                          :draggable="false">
                    <i class="fas fa-ellipsis-h"></i>
                  </button>
                </div>
                
                <h6 class="task-title">{{ task.title }}</h6>
                
                <p class="task-description" v-if="task.description">
                  {{ truncateText(task.description, 80) }}
                </p>
                
                <div class="task-meta">
                  <div class="meta-item" v-if="task.project">
                    <i class="fas fa-folder text-muted"></i>
                    <small class="text-muted">{{ task.project.name }}</small>
                  </div>
                  
                  <div class="meta-item" v-if="task.due_date">
                    <i class="fas fa-clock" :class="getDueDateIconClass(task.due_date, task.status)"></i>
                    <small :class="getDueDateClass(task.due_date, task.status)">
                      {{ formatDate(task.due_date) }}
                    </small>
                  </div>
                  
                  <div class="meta-item" v-if="task.estimated_hours">
                    <i class="fas fa-hourglass-half text-info"></i>
                    <small class="text-muted">{{ task.estimated_hours }}ч</small>
                  </div>
                </div>
                
                <div class="task-footer" v-if="task.assignee">
                  <img :src="getAvatarUrl(task.assignee)" 
                       :alt="task.assignee.full_name"
                       class="task-assignee-avatar"
                       :title="task.assignee.full_name">
                  <span class="task-assignee-name">{{ task.assignee.full_name }}</span>
                </div>
              </div>
              
              <!-- Сообщение о пустой колонке -->
              <div v-if="column.tasks.length === 0" class="empty-column">
                <i :class="getColumnIcon(status)" class="fa-3x text-muted mb-3"></i>
                <p class="text-muted mb-0">Нет задач</p>
                <button class="btn btn-sm btn-outline-primary mt-2" @click="createTaskForStatus(status)">
                  <i class="fas fa-plus me-1"></i>Добавить
                </button>
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
                    <label class="form-label">Срок выполнения</label>
                    <input type="datetime-local" class="form-control" v-model="currentTask.due_date">
                  </div>
                </div>
                <div class="col-md-4">
                  <div class="mb-3">
                    <label class="form-label">Оценка времени (часы)</label>
                    <input type="number" class="form-control" step="0.5" v-model="currentTask.estimated_hours">
                  </div>
                </div>
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
            <h5 class="modal-title">{{ selectedTask.title }}</h5>
            <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
          </div>
          <div class="modal-body">
            <div v-if="selectedTask.description" class="mb-3">
              <strong>Описание:</strong>
              <p>{{ selectedTask.description }}</p>
            </div>
            
            <div class="row">
              <div class="col-md-6">
                <strong>Проект:</strong> {{ selectedTask.project?.name }}
              </div>
              <div class="col-md-6">
                <strong>Исполнитель:</strong> {{ selectedTask.assignee?.full_name || 'Не назначен' }}
              </div>
            </div>
            
            <div class="row mt-2">
              <div class="col-md-6">
                <strong>Статус:</strong> 
                <span class="badge ms-1" 
                      :class="getStatusClass(selectedTask.status)"
                      :style="getStatusStyle(selectedTask.status)">
                  {{ getStatusText(selectedTask.status) }}
                </span>
              </div>
              <div class="col-md-6">
                <strong>Приоритет:</strong> 
                <span class="badge ms-1" 
                      :class="getPriorityClass(selectedTask.priority)"
                      :style="getPriorityStyle(selectedTask.priority)">
                  {{ getPriorityText(selectedTask.priority) }}
                </span>
              </div>
            </div>
            
            <div class="row mt-2" v-if="selectedTask.due_date">
              <div class="col-12">
                <strong>Срок выполнения:</strong> {{ formatDate(selectedTask.due_date) }}
              </div>
            </div>
            
            <div v-if="selectedTask.estimated_hours" class="mt-2">
              <strong>Оценка времени:</strong> {{ selectedTask.estimated_hours }} ч.
            </div>
          </div>
          <div class="modal-footer">
            <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Закрыть</button>
            <button type="button" class="btn btn-primary" @click="editTaskFromView">
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
import { useNotifications } from '@/pages/lms/composables/useNotifications'
import { getAvatarUrl } from '@/js/utils/avatarUtils.js'

export default {
  name: 'KanbanBoard',
  setup() {
    const { showSuccess, showError, showConfirmDialog, closeConfirmDialog } = useNotifications()
    return { showSuccess, showError, showConfirmDialog, closeConfirmDialog }
  },
  data() {
    return {
      kanbanColumns: {},
      projects: [],
      users: [],
      taskStatuses: [],
      taskPriorities: [],
      filters: {
        project_id: '',
        priority: '',
        assignee: '',
        my_tasks: false,  // По умолчанию false, чтобы не конфликтовать с фильтром по исполнителю
        ordering: 'kanban_order'
      },
      currentTask: {
        title: '',
        description: '',
        project_id: '',
        assignee_id: '',
        status: 'todo',
        priority: 'medium',
        due_date: '',
        estimated_hours: null
      },
      selectedTask: {},
      isEditing: false,
      draggedTask: null,
      dragOverColumn: null,
      dragDiagnosticsCleanup: null,
      dragOverTask: null,
      dragOverPosition: null
    }
  },
  
        computed: {
    sortedKanbanColumns() {
      // Сортируем колонки по order, затем по алфавиту
      const entries = Object.entries(this.kanbanColumns)
      const sorted = entries.sort((a, b) => {
        const orderA = a[1].order || 0
        const orderB = b[1].order || 0
        if (orderA !== orderB) {
          return orderA - orderB
        }
        return a[1].title.localeCompare(b[1].title)
      })
      
      // Возвращаем объект в правильном порядке
      const result = {}
      sorted.forEach(([status, column]) => {
        result[status] = column
      })
      return result
    },
    
    columnClass() {
      // Теперь используем только класс для flex layout
      return 'kanban-column-wrapper'
    },

  },
  
      async mounted() {
    console.log('KanbanBoard mounted')
    
    await this.loadProjects()
    await this.loadUsers()
    await this.loadTaskStatuses()  // Теперь это также инициализирует колонки
    await this.loadTaskPriorities()
    this.loadKanbanData()
    
    // Добавляем обработчик клавиши Escape для отмены drag операции
    document.addEventListener('keydown', this.handleEscapeKey)
    
    // Глобальная диагностика drag событий
    this.setupDragDiagnostics()
    
    // Проверяем поддержку drag and drop после загрузки данных
    setTimeout(() => {
      console.log('Checking drag and drop support:')
      console.log('- dragstart event:', 'ondragstart' in window)
      console.log('- dragover event:', 'ondragover' in window)
      console.log('- drop event:', 'ondrop' in window)
      
      const taskElements = document.querySelectorAll('.kanban-task')
      console.log(`Found ${taskElements.length} task elements`)
      
      const dropZones = document.querySelectorAll('.kanban-body')
      console.log(`Found ${dropZones.length} drop zones`)
    }, 1000)
  },
  
  beforeUnmount() {
    document.removeEventListener('keydown', this.handleEscapeKey)
    
    // Удаляем глобальные обработчики
    if (this.dragDiagnosticsCleanup) {
      this.dragDiagnosticsCleanup()
    }
  },
  
  updated() {
    // Проверяем наличие элементов после обновления DOM
    this.$nextTick(() => {
      const taskElements = document.querySelectorAll('.kanban-task')
      const dropZones = document.querySelectorAll('.kanban-body')
      console.log(`Updated: ${taskElements.length} tasks, ${dropZones.length} drop zones`)
    })
  },
  
  methods: {
    async loadProjects() {
      try {
        const response = await projectManagementApi.getProjects({ my_projects: true })
        this.projects = response.data.results || response.data
      } catch (error) {
        console.error('Ошибка загрузки проектов:', error)
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
        console.log('Loading task statuses...')
        const response = await projectManagementApi.getTaskStatuses()
        this.taskStatuses = Array.isArray(response.data) ? response.data : []
        console.log('Loaded task statuses:', this.taskStatuses)
        
        // Инициализируем колонки канбан на основе статусов
        await this.initializeKanbanColumns()
      } catch (error) {
        console.error('Ошибка загрузки статусов задач:', error)
        this.taskStatuses = []
        // Все равно пытаемся инициализировать колонки с fallback
        await this.initializeKanbanColumns()
      }
    },
    
    async initializeKanbanColumns() {
      try {
        console.log('Initializing kanban columns...')
        console.log('Available task statuses:', this.taskStatuses)
        
        // Создаем колонки на основе всех активных статусов
        this.kanbanColumns = {}
        
        // Используем все активные статусы задач
        const activeStatuses = this.taskStatuses.filter(status => status.is_active)
        
        if (activeStatuses.length > 0) {
          console.log('Using all active task statuses')
          activeStatuses.forEach((status, index) => {
            this.kanbanColumns[status.code] = {
              title: status.name,
              tasks: [],
              color: status.color || this.getDefaultColorForStatus(status.code),
              order: status.order !== undefined ? status.order : index
            }
          })
        } else {
          // Fallback: создаем базовые колонки если вообще нет статусов
          console.log('No statuses found, creating default columns')
          this.createDefaultKanbanColumns()
        }
        
        console.log('Initialized kanban columns:', this.kanbanColumns)
      } catch (error) {
        console.error('Ошибка инициализации колонок канбан:', error)
        this.createDefaultKanbanColumns()
      }
    },
    
    createDefaultKanbanColumns() {
      this.kanbanColumns = {
        todo: { title: 'К выполнению', tasks: [], color: '#6c757d', order: 0 },
        in_progress: { title: 'В работе', tasks: [], color: '#17a2b8', order: 1 },
        review: { title: 'На проверке', tasks: [], color: '#ffc107', order: 2 },
        done: { title: 'Выполнено', tasks: [], color: '#28a745', order: 3 }
      }
    },
    
    getDefaultColorForStatus(statusCode) {
      const colorMap = {
        'todo': '#6c757d',
        'new': '#6c757d',
        'in_progress': '#17a2b8',
        'active': '#17a2b8',
        'working': '#17a2b8',
        'review': '#ffc107',
        'testing': '#ffc107',
        'done': '#28a745',
        'completed': '#28a745',
        'finished': '#28a745',
        'cancelled': '#dc3545',
        'blocked': '#dc3545'
      }
      
      // Пробуем найти по точному коду
      if (colorMap[statusCode]) {
        return colorMap[statusCode]
      }
      
      // Пробуем найти по частичному совпадению
      const statusLower = statusCode.toLowerCase()
      for (const [key, color] of Object.entries(colorMap)) {
        if (statusLower.includes(key) || key.includes(statusLower)) {
          return color
        }
      }
      
      return '#007bff' // По умолчанию синий
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
    
    async loadKanbanData() {
      try {
        console.log('Loading kanban data with filters:', this.filters)
        
        const params = { ...this.filters }
        
        // Убираем пустые фильтры (но оставляем булевые значения)
        Object.keys(params).forEach(key => {
          if (params[key] === '' || params[key] === null || params[key] === undefined) {
            delete params[key]
          }
          // Для булевых значений оставляем false, так как это валидный фильтр
          if (typeof params[key] === 'boolean' && params[key] === false && key !== 'my_tasks') {
            delete params[key]
          }
        })
        
        const response = await projectManagementApi.getKanbanTasks(params)
        console.log('Kanban data loaded:', response.data)
        
        // Обновляем данные колонок
        Object.keys(this.kanbanColumns).forEach(status => {
          const tasks = response.data[status] || []
          // Задачи уже отсортированы на сервере
          this.kanbanColumns[status].tasks = tasks
          console.log(`Column ${status} has ${tasks.length} tasks`)
        })
        
        // Если нет данных для некоторых статусов, убеждаемся что у них пустые массивы
        Object.keys(this.kanbanColumns).forEach(status => {
          if (!this.kanbanColumns[status].tasks) {
            this.kanbanColumns[status].tasks = []
          }
        })
        
        // После загрузки данных проверяем элементы
        this.$nextTick(() => {
          const taskElements = document.querySelectorAll('.kanban-task')
          const dropZones = document.querySelectorAll('.kanban-body')
          console.log(`After data load: ${taskElements.length} draggable tasks, ${dropZones.length} drop zones`)
          
          // Убедимся что draggable атрибут установлен
          taskElements.forEach((el, index) => {
            if (!el.draggable) {
              console.warn(`Task ${index} is not draggable!`)
            }
          })
        })
      } catch (error) {
        console.error('Ошибка загрузки канбан данных:', error)
        this.showError('Ошибка загрузки данных канбан доски')
      }
    },
    
    onDragStart(event, task) {
      console.log('Drag start:', task.title, 'ID:', task.id)
      this.draggedTask = task
      
      // Установка типа операции перетаскивания
      event.dataTransfer.effectAllowed = 'move'
      
      // ВАЖНО: обязательно нужно установить какие-то данные
      event.dataTransfer.setData('text/plain', task.id.toString())
      
      // Создаем изображение для перетаскивания
      const dragImage = event.target.cloneNode(true)
      dragImage.style.position = 'absolute'
      dragImage.style.top = '-1000px'
      document.body.appendChild(dragImage)
      event.dataTransfer.setDragImage(dragImage, event.offsetX, event.offsetY)
      setTimeout(() => document.body.removeChild(dragImage), 0)
      
      // Добавляем визуальные эффекты
      event.target.classList.add('dragging')
      event.target.style.opacity = '0.5'
    },
    
    onDragOver(event, status) {
      console.log('Drag over:', status)
      event.preventDefault()
      event.dataTransfer.dropEffect = 'move'
      return false
    },
    
    onDragEnter(event, status) {
      console.log('Drag enter:', status, 'dragged task:', this.draggedTask?.title)
      event.preventDefault()
      if (this.draggedTask) {
        this.dragOverColumn = status
      }
      return false
    },
    
    onDragLeave(event, status) {
      console.log('Drag leave:', status)
      // Проверяем, что мы действительно покинули элемент
      if (event.target === event.currentTarget) {
        this.dragOverColumn = null
      }
    },
    
    async onDrop(event, newStatus) {
      event.preventDefault()
      this.dragOverColumn = null
      
      console.log('Drop event on column:', { task: this.draggedTask?.title, newStatus })
      
      if (!this.draggedTask) {
        console.log('No dragged task found')
        this.resetDragState()
        return
      }
      
      if (this.draggedTask.status === newStatus) {
        console.log('Same status, dropping at the end')
        // Если это та же колонка, добавляем в конец
        await this.moveTaskToPosition(this.draggedTask, newStatus, this.kanbanColumns[newStatus].tasks.length)
      } else {
        // Если другая колонка, перемещаем в конец новой колонки
        try {
          const tasksInColumn = this.kanbanColumns[newStatus].tasks
          const newOrder = tasksInColumn.length
          
          console.log('Updating task order:', { taskId: this.draggedTask.id, newStatus, newOrder })
          
          const updateData = {
            status: newStatus,
            order: newOrder
          }
          
          const response = await projectManagementApi.updateTaskKanbanOrder(this.draggedTask.id, updateData)
          console.log('API response:', response.data)
          
          // Обновляем локальные данные
          this.updateLocalTaskOrder(this.draggedTask, newStatus, newOrder)
          
          this.showSuccess(`Задача перемещена в "${this.kanbanColumns[newStatus].title}"`)
        } catch (error) {
          console.error('Ошибка обновления статуса:', error)
          this.showError('Ошибка обновления статуса: ' + (error.response?.data?.detail || error.message))
          
          // При ошибке перезагружаем данные
          this.loadKanbanData()
        }
      }
      
      this.resetDragState()
    },
    
    resetDragState() {
      console.log('Resetting drag state')
      
      if (this.draggedTask) {
        // Восстанавливаем визуальное состояние
        const draggedElements = document.querySelectorAll(`[data-task-id="${this.draggedTask.id}"]`)
        draggedElements.forEach(element => {
          element.style.opacity = '1'
          element.classList.remove('dragging')
        })
      }
      
      // Также очищаем все элементы с классом dragging на всякий случай
      const allDraggingElements = document.querySelectorAll('.dragging')
      allDraggingElements.forEach(element => {
        element.style.opacity = '1'
        element.classList.remove('dragging')
      })
      
      // Очищаем индикаторы позиции вставки
      document.querySelectorAll('.drag-over-before, .drag-over-after').forEach(el => {
        el.classList.remove('drag-over-before', 'drag-over-after')
      })
      
      this.draggedTask = null
      this.dragOverColumn = null
      this.dragOverTask = null
      this.dragOverPosition = null
    },
    
    updateLocalTaskOrder(task, newStatus, newOrder) {
      // Удаляем задачу из старой колонки
      const oldStatus = task.status
      const oldColumn = this.kanbanColumns[oldStatus]
      if (oldColumn && oldColumn.tasks) {
        const oldColumnIndex = oldColumn.tasks.findIndex(t => t.id === task.id)
        if (oldColumnIndex !== -1) {
          oldColumn.tasks.splice(oldColumnIndex, 1)
        }
      }
      
      // Обновляем статус задачи
      task.status = newStatus
      task.kanban_order = newOrder
      
      // Добавляем в новую колонку
      const newColumn = this.kanbanColumns[newStatus]
      if (newColumn && newColumn.tasks) {
        newColumn.tasks.push(task)
        
        // После drag and drop перезагружаем данные для правильной сортировки
        // Закомментировано: локальная сортировка больше не нужна
        // this.sortTasks(newColumn.tasks)
      }
    },
    
    createTask() {
      this.isEditing = false
      
      // Устанавливаем значения по умолчанию из API
      const defaultStatus = this.taskStatuses.find(s => s.is_default) || this.taskStatuses[0]
      const defaultPriority = this.taskPriorities.find(p => p.is_default) || this.taskPriorities[0]
      
      this.currentTask = {
        title: '',
        description: '',
        project_id: '',
        assignee_id: '',
        status: defaultStatus ? defaultStatus.code : 'todo',
        priority: defaultPriority ? defaultPriority.code : 'medium',
        due_date: '',
        estimated_hours: null
      }
      
      const modal = new Modal(document.getElementById('taskModal'))
      modal.show()
    },

    createTaskForStatus(status) {
      this.isEditing = false
      
      // Устанавливаем статус для конкретной колонки
      const defaultPriority = this.taskPriorities.find(p => p.is_default) || this.taskPriorities[0]
      
      this.currentTask = {
        title: '',
        description: '',
        project_id: '',
        assignee_id: '',
        status: status,
        priority: defaultPriority ? defaultPriority.code : 'medium',
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
        due_date: task.due_date ? this.formatDateTimeLocal(new Date(task.due_date)) : '',
        estimated_hours: task.estimated_hours
      }
      
      const modal = new Modal(document.getElementById('taskModal'))
      modal.show()
    },
    
    editTaskFromView() {
      this.editTask(this.selectedTask)
      
      // Закрываем модальное окно просмотра
      const viewModal = Modal.getInstance(document.getElementById('taskViewModal'))
      if (viewModal) viewModal.hide()
    },
    
    viewTask(task) {
      this.selectedTask = task
      const modal = new Modal(document.getElementById('taskViewModal'))
      modal.show()
    },
    
    async submitTask() {
      try {
        // Подготавливаем данные задачи
        const taskData = { ...this.currentTask }
        
        // Правильно форматируем дату для отправки на сервер
        if (taskData.due_date) {
          taskData.due_date = this.formatDateForAPI(taskData.due_date)
        } else {
          delete taskData.due_date
        }
        
        // Убираем пустые значения
        if (!taskData.assignee_id) {
          delete taskData.assignee_id
        }
        
        if (!taskData.estimated_hours || taskData.estimated_hours === '') {
          delete taskData.estimated_hours
        }
        
        if (this.isEditing) {
          await projectManagementApi.updateTask(this.currentTask.id, taskData)
        } else {
          await projectManagementApi.createTask(taskData)
        }
        
        // Закрываем модальное окно
        const modal = Modal.getInstance(document.getElementById('taskModal'))
        modal.hide()
        
        // Перезагружаем данные
        this.loadKanbanData()
        
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
          
          // Перезагружаем данные
          this.loadKanbanData()
          
          this.showSuccess('Задача удалена')
        } catch (error) {
          console.error('Ошибка удаления задачи:', error)
          this.closeConfirmDialog()
          this.showError('Ошибка удаления задачи')
        }
      }
    },
    
    getColumnHeaderClass(status) {
      // Используем цвет из статуса, если доступен
      const column = this.kanbanColumns[status]
      if (column && column.color) {
        return 'kanban-header-custom'
      }
      
      // Fallback для стандартных статусов
      const classes = {
        'todo': 'bg-secondary text-white',
        'in_progress': 'bg-info text-white',
        'review': 'bg-warning text-dark',
        'done': 'bg-success text-white'
      }
      return classes[status] || 'bg-secondary text-white'
    },
    
    getColumnHeaderStyle(status) {
      const column = this.kanbanColumns[status]
      if (column && column.color) {
        return {
          background: `linear-gradient(135deg, ${column.color} 0%, ${this.darkenColor(column.color, 20)} 100%)`,
          color: this.getContrastColor(column.color)
        }
      }
      return {}
    },
    
    darkenColor(hex, percent) {
      // Затемняем цвет на указанный процент
      const num = parseInt(hex.replace('#', ''), 16)
      const amt = Math.round(2.55 * percent)
      const R = (num >> 16) + amt
      const G = (num >> 8 & 0x00FF) + amt
      const B = (num & 0x0000FF) + amt
      return '#' + (0x1000000 + (R < 255 ? R < 1 ? 0 : R : 255) * 0x10000 +
        (G < 255 ? G < 1 ? 0 : G : 255) * 0x100 +
        (B < 255 ? B < 1 ? 0 : B : 255)).toString(16).slice(1)
    },
    
    getContrastColor(hexColor) {
      // Определяем контрастный цвет (белый или черный) для фона
      const r = parseInt(hexColor.substr(1, 2), 16)
      const g = parseInt(hexColor.substr(3, 2), 16)
      const b = parseInt(hexColor.substr(5, 2), 16)
      const brightness = ((r * 299) + (g * 587) + (b * 114)) / 1000
      return brightness > 155 ? '#000000' : '#ffffff'
    },
    
    getPriorityClass(priority) {
      // Если есть кастомный цвет из API, не используем стандартные классы
      const priorityObj = this.taskPriorities.find(p => p.code === priority)
      if (priorityObj && priorityObj.color) {
        return '' // Пустой класс, так как стили будут через :style
      }
      
      // Fallback для стандартных значений
      const classes = {
        'low': 'bg-secondary text-white',
        'medium': 'bg-primary text-white',
        'high': 'bg-warning text-dark',
        'urgent': 'bg-danger text-white'
      }
      return classes[priority] || 'bg-secondary text-white'
    },
    
    getPriorityText(priority) {
      const priorityObj = this.taskPriorities.find(p => p.code === priority)
      if (priorityObj) return priorityObj.name
      
      // Fallback
      const texts = {
        'low': 'Низкий',
        'medium': 'Средний',
        'high': 'Высокий',
        'urgent': 'Срочный'
      }
      return texts[priority] || priority
    },
    
    getPriorityStyle(priority) {
      const priorityObj = this.taskPriorities.find(p => p.code === priority)
      if (priorityObj && priorityObj.color) {
        return {
          backgroundColor: priorityObj.color,
          color: '#fff'
        }
      }
      return {}
    },
    
    getStatusClass(status) {
      // Если есть кастомный цвет из API, не используем стандартные классы
      const statusObj = this.taskStatuses.find(s => s.code === status)
      if (statusObj && statusObj.color) {
        return '' // Пустой класс, так как стили будут через :style
      }
      
      // Fallback для стандартных значений
      const classes = {
        'todo': 'bg-secondary text-white',
        'in_progress': 'bg-info text-white',
        'review': 'bg-warning text-dark',
        'done': 'bg-success text-white',
        'cancelled': 'bg-danger text-white'
      }
      return classes[status] || 'bg-secondary text-white'
    },
    
    getStatusStyle(status) {
      const statusObj = this.taskStatuses.find(s => s.code === status)
      if (statusObj && statusObj.color) {
        return {
          backgroundColor: statusObj.color,
          color: '#fff'
        }
      }
      return {}
    },
    
    getStatusText(status) {
      const statusObj = this.taskStatuses.find(s => s.code === status)
      if (statusObj) return statusObj.name
      
      // Fallback
      const texts = {
        'todo': 'К выполнению',
        'in_progress': 'В работе',
        'review': 'На проверке',
        'done': 'Выполнено',
        'cancelled': 'Отменено'
      }
      return texts[status] || status
    },
    
    getDueDateClass(dueDate, status) {
      if (status === 'done') return 'text-muted'
      
      const now = new Date()
      const due = new Date(dueDate)
      
      if (due < now) return 'text-danger'
      if (due - now < 24 * 60 * 60 * 1000) return 'text-warning'
      return 'text-muted'
    },

    getDueDateIconClass(dueDate, status) {
      if (status === 'done') return 'text-muted'
      
      const now = new Date()
      const due = new Date(dueDate)
      
      if (due < now) return 'text-danger'
      if (due - now < 24 * 60 * 60 * 1000) return 'text-warning'
      return 'text-muted'
    },

    getColumnIcon(status) {
      const icons = {
        'todo': 'fas fa-clipboard-list',
        'new': 'fas fa-plus-circle',
        'in_progress': 'fas fa-cog fa-spin',
        'active': 'fas fa-play',
        'working': 'fas fa-cog fa-spin',
        'review': 'fas fa-eye',
        'testing': 'fas fa-vials',
        'done': 'fas fa-check-circle',
        'completed': 'fas fa-check-circle',
        'finished': 'fas fa-check-circle',
        'cancelled': 'fas fa-times-circle',
        'blocked': 'fas fa-ban'
      }
      
      return icons[status] || 'fas fa-circle'
    },

    truncateText(text, maxLength) {
      if (!text || typeof text !== 'string') return ''
      if (text.length > maxLength) {
        return text.slice(0, maxLength) + '...'
      }
      return text
    },

    getAvatarUrl(user) {
      // Используем локальную утилиту для генерации аватаров
      return getAvatarUrl(user, 24)
    },
    
    formatDate(date) {
      if (!date) return ''
      return new Date(date).toLocaleDateString('ru-RU', {
        month: 'short',
        day: 'numeric'
      })
    },
    
    formatDateTimeLocal(date) {
      if (!date) return ''
      const d = new Date(date)
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
    
    onDragEnd(event) {
      console.log('Drag end event')
      // Всегда сбрасываем состояние при окончании перетаскивания
      // Небольшая задержка для завершения всех drag событий
      setTimeout(() => {
        this.resetDragState()
      }, 150)
    },
    
    handleEscapeKey(event) {
      if (event.key === 'Escape' && this.draggedTask) {
        this.resetDragState()
      }
    },
    
    setupDragDiagnostics() {
      console.log('Setting up drag diagnostics...')
      
      const handlers = {
        dragstart: (e) => console.log('Global dragstart:', e.target.className),
        dragend: (e) => console.log('Global dragend:', e.target.className),
        dragover: (e) => {
          // Предотвращаем действие по умолчанию для всех dragover событий
          e.preventDefault()
          // Логируем только если это наша зона
          if (e.target.closest('.kanban-body') || e.target.closest('.kanban-column')) {
            console.log('Global dragover on kanban element')
          }
        },
        drop: (e) => {
          if (e.target.closest('.kanban-body') || e.target.closest('.kanban-column')) {
            console.log('Global drop on kanban element')
          }
        }
      }
      
      // Добавляем обработчики
      Object.entries(handlers).forEach(([event, handler]) => {
        document.addEventListener(event, handler, true)
      })
      
      // Функция очистки
      this.dragDiagnosticsCleanup = () => {
        Object.entries(handlers).forEach(([event, handler]) => {
          document.removeEventListener(event, handler, true)
        })
      }
    },
    
    truncateText(text, maxLength) {
      if (!text) return ''
      return text.length > maxLength ? text.substring(0, maxLength) + '...' : text
    },
    
    // Дублирующая функция удалена, используем импортированную getAvatarUrl
    
    getColumnIcon(status) {
      // Пытаемся определить иконку по названию или коду статуса
      const statusLower = status.toLowerCase()
      
      if (statusLower.includes('todo') || statusLower.includes('к_выполнению') || statusLower.includes('new') || statusLower.includes('новый')) {
        return 'fas fa-clipboard-list'
      }
      if (statusLower.includes('progress') || statusLower.includes('работе') || statusLower.includes('active') || statusLower.includes('активный')) {
        return 'fas fa-cogs'
      }
      if (statusLower.includes('review') || statusLower.includes('проверке') || statusLower.includes('test') || statusLower.includes('тест')) {
        return 'fas fa-eye'
      }
      if (statusLower.includes('done') || statusLower.includes('выполнено') || statusLower.includes('complete') || statusLower.includes('завершен')) {
        return 'fas fa-check'
      }
      if (statusLower.includes('cancel') || statusLower.includes('отмен') || statusLower.includes('blocked') || statusLower.includes('заблок')) {
        return 'fas fa-times'
      }
      if (statusLower.includes('wait') || statusLower.includes('ожидан') || statusLower.includes('pending') || statusLower.includes('приостан')) {
        return 'fas fa-pause'
      }
      
      // Fallback для известных статусов
      const icons = {
        'todo': 'fas fa-clipboard-list',
        'in_progress': 'fas fa-cogs',
        'review': 'fas fa-eye',
        'done': 'fas fa-check',
        'cancelled': 'fas fa-times',
        'blocked': 'fas fa-ban',
        'waiting': 'fas fa-clock'
      }
      
      return icons[status] || 'fas fa-tasks'
    },
    
    getDueDateIconClass(dueDate, status) {
      if (status === 'done') return 'text-muted'
      
      const now = new Date()
      const due = new Date(dueDate)
      
      if (due < now) return 'text-danger'
      if (due - now < 24 * 60 * 60 * 1000) return 'text-warning'
      return 'text-muted'
    },
    
    createTaskForStatus(status) {
      this.isEditing = false
      
      // Устанавливаем значения по умолчанию из API
      const defaultPriority = this.taskPriorities.find(p => p.is_default) || this.taskPriorities[0]
      
      this.currentTask = {
        title: '',
        description: '',
        project_id: '',
        assignee_id: '',
        status: status,
        priority: defaultPriority ? defaultPriority.code : 'medium',
        due_date: '',
        estimated_hours: null
      }
      
      const modal = new Modal(document.getElementById('taskModal'))
      modal.show()
    },
    
    // Новые обработчики drag and drop
    handleDragOver(event, status) {
      console.log('handleDragOver:', status)
      event.preventDefault()
      event.stopPropagation()
      return false
    },
    
    handleDragEnter(event, status) {
      console.log('handleDragEnter:', status)
      event.preventDefault()
      event.stopPropagation()
      if (this.draggedTask) {
        this.dragOverColumn = status
      }
    },
    
    handleDragLeave(event, status) {
      console.log('handleDragLeave:', status)
      // Проверяем что мы действительно покинули колонку
      const relatedTarget = event.relatedTarget
      const currentColumn = event.currentTarget
      
      if (!currentColumn.contains(relatedTarget)) {
        this.dragOverColumn = null
      }
    },
    
    handleDrop(event, status) {
      console.log('handleDrop:', status)
      event.preventDefault()
      event.stopPropagation()
      
      // Вызываем оригинальный onDrop
      this.onDrop(event, status)
    },
    
    onTaskDragOver(event, task, status, index) {
      if (!this.draggedTask || this.draggedTask.id === task.id) {
        return
      }
      
      // Определяем позицию для вставки
      const rect = event.currentTarget.getBoundingClientRect()
      const y = event.clientY - rect.top
      const height = rect.height
      
      // Если курсор в верхней половине - вставляем перед, иначе после
      const insertBefore = y < height / 2
      
      this.dragOverTask = task
      this.dragOverPosition = insertBefore ? 'before' : 'after'
      
      // Добавляем визуальную индикацию
      event.currentTarget.classList.remove('drag-over-before', 'drag-over-after')
      event.currentTarget.classList.add(insertBefore ? 'drag-over-before' : 'drag-over-after')
    },
    
    onTaskDragLeave(event) {
      // Убираем визуальные индикаторы при уходе курсора
      event.currentTarget.classList.remove('drag-over-before', 'drag-over-after')
    },
    
    async onTaskDrop(event, targetTask, status, targetIndex) {
      console.log('Drop on task:', targetTask.title, 'at index:', targetIndex)
      
      if (!this.draggedTask || this.draggedTask.id === targetTask.id) {
        this.resetDragState()
        return
      }
      
      // Определяем новую позицию
      const rect = event.currentTarget.getBoundingClientRect()
      const y = event.clientY - rect.top
      const insertBefore = y < rect.height / 2
      
      // Вычисляем новый индекс
      let newIndex = insertBefore ? targetIndex : targetIndex + 1
      
      // Если перемещаем в той же колонке, корректируем индекс
      if (this.draggedTask.status === status) {
        const currentIndex = this.kanbanColumns[status].tasks.findIndex(t => t.id === this.draggedTask.id)
        if (currentIndex < newIndex) {
          newIndex--
        }
      }
      
      await this.moveTaskToPosition(this.draggedTask, status, newIndex)
      
      // Убираем визуальную индикацию
      document.querySelectorAll('.drag-over-before, .drag-over-after').forEach(el => {
        el.classList.remove('drag-over-before', 'drag-over-after')
      })
      
      this.resetDragState()
    },
    
    async moveTaskToPosition(task, newStatus, newIndex) {
      console.log('Moving task to position:', { task: task.title, newStatus, newIndex })
      
      try {
        const oldStatus = task.status
        const oldColumn = this.kanbanColumns[oldStatus]
        const newColumn = this.kanbanColumns[newStatus]
        
        // Удаляем задачу из старой позиции
        const oldIndex = oldColumn.tasks.findIndex(t => t.id === task.id)
        if (oldIndex !== -1) {
          oldColumn.tasks.splice(oldIndex, 1)
        }
        
        // Обновляем статус задачи
        task.status = newStatus
        
        // Вставляем в новую позицию
        newColumn.tasks.splice(newIndex, 0, task)
        
        // Обновляем порядок для всех задач в затронутых колонках
        await this.updateTasksOrder(oldStatus)
        if (oldStatus !== newStatus) {
          await this.updateTasksOrder(newStatus)
        }
        
        this.showSuccess('Порядок задач обновлен')
      } catch (error) {
        console.error('Ошибка перемещения задачи:', error)
        this.showError('Ошибка обновления порядка задач')
        
        // При ошибке перезагружаем данные
        this.loadKanbanData()
      }
    },
    
    sortTasks(tasks) {
      const ordering = this.filters.ordering || 'kanban_order'
      
      tasks.sort((a, b) => {
        switch (ordering) {
          case 'kanban_order':
            return (a.kanban_order || 0) - (b.kanban_order || 0)
          
          case '-created_at':
            return new Date(b.created_at || 0) - new Date(a.created_at || 0)
          
          case 'created_at':
            return new Date(a.created_at || 0) - new Date(b.created_at || 0)
          
          case 'due_date':
            // Задачи без срока в конце
            if (!a.due_date && !b.due_date) return 0
            if (!a.due_date) return 1
            if (!b.due_date) return -1
            return new Date(a.due_date) - new Date(b.due_date)
          
          case '-due_date':
            // Задачи без срока в конце
            if (!a.due_date && !b.due_date) return 0
            if (!a.due_date) return 1
            if (!b.due_date) return -1
            return new Date(b.due_date) - new Date(a.due_date)
          
          case 'priority':
            // Сортировка по уровню приоритета из API
            const priorityA = this.getPriorityLevel(a.priority)
            const priorityB = this.getPriorityLevel(b.priority)
            return priorityA - priorityB
          
          case '-priority':
            // Обратная сортировка по уровню приоритета
            const priorityADesc = this.getPriorityLevel(a.priority)
            const priorityBDesc = this.getPriorityLevel(b.priority)
            return priorityBDesc - priorityADesc
          
          case 'assignee':
            // Сортировка по имени исполнителя (задачи без исполнителя в конце)
            const nameA = a.assignee?.full_name || a.assignee?.username || 'zzz'
            const nameB = b.assignee?.full_name || b.assignee?.username || 'zzz'
            return nameA.localeCompare(nameB, 'ru')
          
          case '-assignee':
            // Обратная сортировка по имени исполнителя
            const nameADesc = a.assignee?.full_name || a.assignee?.username || ''
            const nameBDesc = b.assignee?.full_name || b.assignee?.username || ''
            return nameBDesc.localeCompare(nameADesc, 'ru')
          
          default:
            return (a.kanban_order || 0) - (b.kanban_order || 0)
        }
      })
    },

    getPriorityLevel(priority) {
      // Получаем уровень приоритета из API данных
      const priorityObj = this.taskPriorities.find(p => p.code === priority)
      if (priorityObj && priorityObj.level !== undefined) {
        return priorityObj.level
      }
      
      // Fallback для стандартных приоритетов
      const fallbackLevels = { 
        low: 1, 
        medium: 2, 
        high: 3, 
        urgent: 4 
      }
      return fallbackLevels[priority] || 0
    },

    async updateTasksOrder(status) {
      console.log('Updating tasks order for status:', status)
      
      const tasks = this.kanbanColumns[status].tasks
      const updatePromises = []
      
      // Собираем только те задачи, у которых изменился порядок
      tasks.forEach((task, index) => {
        if (task.kanban_order !== index) {
          task.kanban_order = index
          updatePromises.push(
            projectManagementApi.updateTaskKanbanOrder(task.id, {
              status: task.status,
              order: index
            })
          )
        }
      })
      
      if (updatePromises.length > 0) {
        console.log(`Updating ${updatePromises.length} tasks in column ${status}`)
        await Promise.all(updatePromises)
      }
    },
    
    onAssigneeChange() {
      // Когда выбран конкретный исполнитель, сбрасываем "Мои задачи"
      if (this.filters.assignee) {
        this.filters.my_tasks = false
      }
      this.loadKanbanData()
    },
    
    onMyTasksChange() {
      // Когда включен "Мои задачи", сбрасываем фильтр по исполнителю
      if (this.filters.my_tasks) {
        this.filters.assignee = ''
      }
      this.loadKanbanData()
    }
  }
}
</script>

<style scoped lang="scss">
@import './project-management.scss';

.kanban-board {
  padding: 20px;
  min-height: 100vh;
  background: var(--bs-gray-100);
}

.kanban-container {
  margin-top: 2rem;
}

.kanban-columns-container {
  display: flex;
  flex-wrap: wrap;
  gap: 1rem;
  align-items: flex-start;
  
  .kanban-column-wrapper {
    // Адаптивная ширина в зависимости от количества колонок
    min-width: 280px;
    flex: 1 1 280px;
    max-width: 350px;
    
    // Для большого количества колонок
    @media (max-width: 1400px) {
      min-width: 260px;
      flex: 1 1 260px;
      max-width: 320px;
    }
    
    @media (max-width: 1200px) {
      min-width: 240px;
      flex: 1 1 240px;
      max-width: 300px;
    }
    
    @media (max-width: 992px) {
      min-width: 220px;
      flex: 1 1 220px;
      max-width: 280px;
    }
    
    @media (max-width: 768px) {
      min-width: 100%;
      flex: 1 1 100%;
      max-width: none;
    }
    
    &.kanban-drop-zone {
      margin-bottom: 1rem;
    }
  }
}

.kanban-column {
  height: calc(100vh - 300px);
  min-height: 500px;
  max-height: 700px;
  display: flex;
  flex-direction: column;
  @include pm-card;
  padding: 0;
  overflow: hidden;
  
  // Для адаптивности при многих колонках
  @media (max-width: 1200px) {
    height: calc(100vh - 350px);
    min-height: 450px;
    max-height: 600px;
  }
  
  @media (max-width: 768px) {
    height: auto;
    min-height: 400px;
    max-height: 500px;
  }
}

.kanban-header {
  padding: 1rem 1.25rem;
  border-bottom: 2px solid;
  
  h5 {
    font-size: $font-size-usual;
    font-weight: $font-weight-bold;
    margin: 0;
    color: white;
  }
  
  .task-count {
    background: rgba(255, 255, 255, 0.2);
    padding: 2px 8px;
    border-radius: 12px;
    font-size: $font-size-small;
    font-weight: normal;
  }
  
  &.bg-secondary {
    background: linear-gradient(135deg, #6c757d 0%, #5a6268 100%);
    border-color: #5a6268;
  }
  
  &.bg-info {
    background: linear-gradient(135deg, #17a2b8 0%, #138496 100%);
    border-color: #138496;
  }
  
  &.bg-warning {
    background: linear-gradient(135deg, #ffc107 0%, #e0a800 100%);
    border-color: #e0a800;
    
    h5 {
      color: #212529;
    }
    
    .task-count {
      background: rgba(0, 0, 0, 0.1);
    }
  }
  
  &.bg-success {
    background: linear-gradient(135deg, #28a745 0%, #218838 100%);
    border-color: #218838;
  }
  
  // Кастомные цвета для динамических статусов
  &.kanban-header-custom {
    border-bottom: 2px solid;
    
    h5 {
      font-size: $font-size-usual;
      font-weight: $font-weight-bold;
      margin: 0;
    }
    
    .task-count {
      background: rgba(255, 255, 255, 0.2);
      padding: 2px 8px;
      border-radius: 12px;
      font-size: $font-size-small;
      font-weight: normal;
    }
  }
}

.kanban-body {
  flex: 1;
  overflow-y: auto;
  padding: 1rem;
  background: var(--bs-gray-50);
  min-height: 200px;
  
  &::-webkit-scrollbar {
    width: 6px;
  }
  
  &::-webkit-scrollbar-track {
    background: transparent;
  }
  
  &::-webkit-scrollbar-thumb {
    background: var(--bs-gray-400);
    border-radius: 3px;
  }
}

.kanban-task {
  background: white;
  border: 1px solid var(--bs-border-color);
  border-radius: $radius-small;
  padding: 1rem;
  margin-bottom: 0.75rem;
  cursor: grab;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
  user-select: none;
  position: relative;
  transition: transform 0.2s ease, box-shadow 0.2s ease;
  
  &:active {
    cursor: grabbing;
  }
  
  &[draggable="true"] {
    cursor: grab;
    
    &:hover {
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
    }
  }
  
  .task-header {
    display: flex;
    justify-content: space-between;
    align-items: start;
    margin-bottom: 0.75rem;
    
    .task-action {
      padding: 0;
      color: var(--bs-gray-500);
      opacity: 0;
      transition: opacity $pm-transition;
      
      &:hover {
        color: var(--bs-primary);
      }
    }
  }
  
  &:hover .task-action {
    opacity: 1;
  }
  
  .task-title {
    font-size: $font-size-usual;
    font-weight: $font-weight-bold;
    color: var(--bs-heading-color);
    margin-bottom: 0.5rem;
    line-height: 1.4;
  }
  
  .task-description {
    font-size: $font-size-small;
    color: var(--bs-secondary-color);
    margin-bottom: 1rem;
    line-height: 1.5;
    display: -webkit-box;
    -webkit-line-clamp: 2;
    -webkit-box-orient: vertical;
    overflow: hidden;
  }
  
  .task-meta {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
    margin-bottom: 1rem;
    
    .meta-item {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      font-size: $font-size-small;
      
      i {
        width: 16px;
        text-align: center;
      }
    }
  }
  
  .task-footer {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    padding-top: 0.75rem;
    border-top: 1px solid var(--bs-gray-200);
    
    .task-assignee-avatar {
      width: 24px;
      height: 24px;
      border-radius: 50%;
      object-fit: cover;
    }
    
    .task-assignee-name {
      font-size: $font-size-small;
      color: var(--bs-secondary-color);
    }
  }
}

.empty-column {
  text-align: center;
  padding: 3rem 1rem;
  
  p {
    font-size: $font-size-small;
  }
}

.badge {
  @include pm-badge;
}

.btn {
  @include pm-button;
}

// Состояние перетаскивания
.kanban-body {
  transition: all 0.2s ease;
  position: relative;
  
  &.drag-over {
  background: linear-gradient(135deg, rgba(13, 110, 253, 0.1) 0%, rgba(13, 110, 253, 0.05) 100%);
  border: 2px dashed #0d6efd;
  border-radius: 8px;
  transform: scale(1.01);
  box-shadow: 0 0 15px rgba(13, 110, 253, 0.2);
}
}

// Колонка для drop
.kanban-drop-zone {
  position: relative;
  
  &.drag-over {
    .kanban-body {
      background: rgba(13, 110, 253, 0.1);
    }
  }
}

// Обеспечиваем правильный z-index для перетаскиваемых элементов
.kanban-drop-zone {
  position: relative;
  z-index: 1;
}

// Устраняем возможные проблемы с pointer-events
* {
  &[draggable="true"] {
    -webkit-user-drag: element;
    -khtml-user-drag: element;
    -moz-user-drag: element;
    -o-user-drag: element;
    user-drag: element;
  }
}

.kanban-task {
  transition: all 0.2s ease;
  position: relative;
  
  &.dragging {
    opacity: 0.6 !important;
    transform: rotate(2deg) scale(1.03);
    box-shadow: 0 8px 25px rgba(0, 0, 0, 0.25);
    z-index: 1000;
    border: 2px solid #0d6efd;
    cursor: grabbing !important;
  }
  
  &:hover:not(.dragging) {
    transform: translateY(-2px);
    box-shadow: 0 4px 15px rgba(0, 0, 0, 0.1);
    border-color: var(--bs-primary);
  }
  
  // Визуальная индикация места вставки
  &.drag-over-before {
    &::before {
      content: '';
      position: absolute;
      top: -2px;
      left: 0;
      right: 0;
      height: 3px;
      background: #0d6efd;
      border-radius: 2px;
      z-index: 100;
    }
  }
  
  &.drag-over-after {
    &::after {
      content: '';
      position: absolute;
      bottom: -2px;
      left: 0;
      right: 0;
      height: 3px;
      background: #0d6efd;
      border-radius: 2px;
      z-index: 100;
    }
  }
}

// Модальные окна используют те же стили что и в TasksList
.modal-content {
  border-radius: $radius-usual;
  box-shadow: 0 10px 40px rgba(0, 0, 0, 0.1);
}

.modal-header {
  background: var(--bs-light);
  padding: 1.5rem;
  
  .modal-title {
    font-size: $font-size-h3;
    font-weight: $font-weight-bold;
    color: var(--bs-heading-color);
  }
}

.form-label {
  color: var(--bs-secondary-color);
  font-size: $font-size-small;
  margin-bottom: 0.5rem;
}

.form-control,
.form-select {
  border-radius: $radius-small;
  border-color: var(--bs-border-color);
  
  &:focus {
    border-color: var(--bs-primary);
    box-shadow: 0 0 0 0.2rem rgba($primary, 0.25);
  }
}

// Адаптивность
@media (max-width: 768px) {
  .kanban-board {
    padding: 1rem;
  }
  
  .pm-page-header {
    flex-direction: column;
    gap: 1rem;
    
    h2 {
      font-size: $font-size-h2;
    }
    
    > div {
      display: flex;
      gap: 0.5rem;
      width: 100%;
      
      .btn {
        flex: 1;
      }
    }
  }
  
  .kanban-columns-container {
    flex-direction: column;
    gap: 1rem;
    
    .kanban-column-wrapper {
      min-width: 100%;
      flex: 1 1 100%;
      max-width: none;
      
      &.kanban-drop-zone {
        margin-bottom: 1rem;
      }
    }
  }
}
</style> 