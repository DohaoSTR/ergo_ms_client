<template>
  <div class="tasks-list">
    <div class="pm-page-header d-flex justify-content-between align-items-center">
      <h2><i class="fas fa-list-check me-2"></i>Мои задачи</h2>
      <button class="btn btn-primary" @click="createTask">
        <i class="fas fa-plus me-2"></i>Создать задачу
      </button>
    </div>

    <!-- Фильтры и поиск -->
    <div class="pm-filters-card">
      <div class="card-body">
        <div class="row g-3">
          <div class="col-md-3">
            <label class="form-label"><i class="fas fa-search me-1"></i>Поиск</label>
            <input type="text" class="form-control" v-model="filters.search" @input="debouncedSearch" 
                   placeholder="Поиск по названию...">
          </div>
          <div class="col-md-2">
            <label class="form-label">Статус</label>
            <select class="form-select" v-model="filters.status" @change="loadTasks">
              <option value="">Все статусы</option>
              <option value="todo">К выполнению</option>
              <option value="in_progress">В работе</option>
              <option value="review">На проверке</option>
              <option value="done">Выполнено</option>
              <option value="cancelled">Отменено</option>
            </select>
          </div>
          <div class="col-md-2">
            <label class="form-label">Приоритет</label>
            <select class="form-select" v-model="filters.priority" @change="loadTasks">
              <option value="">Все приоритеты</option>
              <option value="low">Низкий</option>
              <option value="medium">Средний</option>
              <option value="high">Высокий</option>
              <option value="urgent">Срочный</option>
            </select>
          </div>
          <div class="col-md-2">
            <label class="form-label">Проект</label>
            <select class="form-select" v-model="filters.project" @change="loadTasks">
              <option value="">Все проекты</option>
              <option v-for="project in projects" :key="project.id" :value="project.id">
                {{ project.name }}
              </option>
            </select>
          </div>
          <div class="col-md-2">
            <label class="form-label">Сортировка</label>
            <select class="form-select" v-model="filters.ordering" @change="loadTasks">
              <option value="-created_at">По дате создания ↓</option>
              <option value="created_at">По дате создания ↑</option>
              <option value="due_date">По сроку ↑</option>
              <option value="-due_date">По сроку ↓</option>
              <option value="priority">По приоритету ↑</option>
              <option value="-priority">По приоритету ↓</option>
            </select>
          </div>
          <div class="col-md-1 d-flex align-items-end">
            <div class="form-check">
              <input class="form-check-input" type="checkbox" v-model="filters.my_tasks" @change="loadTasks" id="myTasksFilter">
              <label class="form-check-label" for="myTasksFilter">
                Мои
              </label>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Список задач -->
    <div v-if="loading" class="text-center py-5">
      <div class="spinner-border text-primary" role="status">
        <span class="visually-hidden">Загрузка...</span>
      </div>
      <p class="text-muted mt-3">Загружаем задачи...</p>
    </div>

    <div v-else-if="tasks.length === 0" class="empty-state">
      <div class="text-center">
        <i class="fas fa-check-circle fa-5x text-success mb-4"></i>
        <h4 class="text-muted mb-3">Задач не найдено</h4>
        <p class="text-muted mb-4">Попробуйте изменить фильтры или создайте новую задачу</p>
        <button class="btn btn-primary btn-lg rounded-pill" @click="createTask">
          <i class="fas fa-plus me-2"></i>Создать задачу
        </button>
      </div>
    </div>

    <div v-else>
      <!-- Табличный вид -->
      <div class="tasks-table-wrapper">
        <div class="table-responsive">
          <table class="table table-hover tasks-table mb-0">
            <thead>
              <tr>
                <th>Задача</th>
                <th>Проект</th>
                <th>Исполнитель</th>
                <th>Статус</th>
                <th>Приоритет</th>
                <th>Срок</th>
                <th>Действия</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="task in tasks" :key="task?.id" class="task-row" @click="viewTask(task)">
                <td class="task-cell-main">
                  <div class="task-info">
                    <h6 class="task-title mb-1">{{ task.title || 'Без названия' }}</h6>
                    <p class="task-description mb-0" v-if="task.description">
                      {{ truncateText(task.description, 80) }}
                    </p>
                    <div class="task-badges mt-2" v-if="task.comment_count || task.attachment_count">
                      <span class="badge bg-light text-dark me-2" v-if="task.comment_count">
                        <i class="fas fa-comment me-1"></i>{{ task.comment_count }}
                      </span>
                      <span class="badge bg-light text-dark" v-if="task.attachment_count">
                        <i class="fas fa-paperclip me-1"></i>{{ task.attachment_count }}
                      </span>
                    </div>
                  </div>
                </td>
                <td>
                  <span class="project-badge" :style="{ backgroundColor: task.project?.color || '#f8f9fa' }">
                    {{ task.project?.name || 'Без проекта' }}
                  </span>
                </td>
                <td>
                  <div class="assignee-info" v-if="task.assignee">
                    <img :src="getAvatarUrl(task.assignee)" 
                         :alt="task.assignee.full_name || task.assignee.username"
                         class="assignee-avatar">
                    <span class="assignee-name">{{ task.assignee.full_name || `${task.assignee.first_name} ${task.assignee.last_name}`.trim() || task.assignee.username }}</span>
                  </div>
                  <span class="text-muted" v-else>Не назначен</span>
                </td>
                <td>
                  <span class="badge rounded-pill" :class="getStatusClass(task.status)">
                    {{ getStatusText(task.status) }}
                  </span>
                </td>
                <td>
                  <span class="badge rounded-pill" :class="getPriorityClass(task.priority)">
                    {{ getPriorityText(task.priority) }}
                  </span>
                </td>
                <td>
                  <span :class="getDueDateClass(task.due_date, task.status)">
                    <i class="fas fa-clock me-1"></i>{{ formatDate(task.due_date) }}
                  </span>
                </td>
                <td @click.stop>
                  <div class="btn-group btn-group-sm">
                    <button class="btn btn-light" @click="editTask(task)" title="Редактировать">
                      <i class="fas fa-edit"></i>
                    </button>
                    <button class="btn btn-light text-danger" @click="deleteTask(task)" title="Удалить">
                      <i class="fas fa-trash"></i>
                    </button>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>

    <!-- Пагинация -->
    <nav v-if="pagination.total_pages > 1" class="mt-5">
      <ul class="pagination pagination-modern justify-content-center">
        <li class="page-item" :class="{ disabled: !pagination.previous }">
          <button class="page-link" @click="changePage(pagination.current_page - 1)" 
                  :disabled="!pagination.previous">
            <i class="fas fa-chevron-left"></i>
          </button>
        </li>
        
        <li class="page-item" 
            v-for="page in getPageNumbers()" 
            :key="page"
            :class="{ active: page === pagination.current_page }">
          <button class="page-link" @click="changePage(page)">{{ page }}</button>
        </li>
        
        <li class="page-item" :class="{ disabled: !pagination.next }">
          <button class="page-link" @click="changePage(pagination.current_page + 1)" 
                  :disabled="!pagination.next">
            <i class="fas fa-chevron-right"></i>
          </button>
        </li>
      </ul>
    </nav>

    <!-- Модальное окно создания/редактирования задачи -->
    <div class="modal fade" id="taskModal" tabindex="-1">
      <div class="modal-dialog modal-lg">
        <div class="modal-content border-0">
          <div class="modal-header border-bottom">
            <h5 class="modal-title">
              <i class="fas fa-tasks me-2"></i>
              {{ isEditing ? 'Редактировать задачу' : 'Создать задачу' }}
            </h5>
            <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
          </div>
          <div class="modal-body p-4">
            <form @submit.prevent="submitTask">
              <div class="row g-3 mb-4">
                <div class="col-md-8">
                  <label class="form-label fw-bold">Название задачи <span class="text-danger">*</span></label>
                  <input type="text" class="form-control" v-model="currentTask.title" required
                         placeholder="Введите название задачи">
                </div>
                <div class="col-md-4">
                  <label class="form-label fw-bold">Проект <span class="text-danger">*</span></label>
                  <select class="form-select" v-model="currentTask.project_id" required>
                    <option value="">Выберите проект</option>
                    <option v-for="project in projects" :key="project.id" :value="project.id">
                      {{ project.name }}
                    </option>
                  </select>
                </div>
              </div>
              
              <div class="mb-4">
                <label class="form-label fw-bold">Описание</label>
                <textarea class="form-control" rows="3" v-model="currentTask.description"
                          placeholder="Опишите задачу подробнее"></textarea>
              </div>
              
              <div class="row g-3 mb-4">
                <div class="col-md-6">
                  <label class="form-label fw-bold">Исполнитель</label>
                  <select class="form-select" v-model="currentTask.assignee_id">
                    <option value="">Не назначен</option>
                    <option v-for="user in users" :key="user.id" :value="user.id">
                      {{ user.full_name || `${user.first_name} ${user.last_name}`.trim() || user.username }}
                    </option>
                  </select>
                </div>
                <div class="col-md-6">
                  <label class="form-label fw-bold">Статус</label>
                  <select class="form-select" v-model="currentTask.status">
                    <option value="todo">К выполнению</option>
                    <option value="in_progress">В работе</option>
                    <option value="review">На проверке</option>
                    <option value="done">Выполнено</option>
                    <option value="cancelled">Отменено</option>
                  </select>
                </div>
              </div>
              
              <div class="row g-3 mb-4">
                <div class="col-md-4">
                  <label class="form-label fw-bold">Приоритет</label>
                  <select class="form-select" v-model="currentTask.priority">
                    <option value="low">Низкий</option>
                    <option value="medium">Средний</option>
                    <option value="high">Высокий</option>
                    <option value="urgent">Срочный</option>
                  </select>
                </div>
                <div class="col-md-4">
                  <label class="form-label fw-bold">Дата начала</label>
                  <input type="datetime-local" class="form-control" v-model="currentTask.start_date">
                </div>
                <div class="col-md-4">
                  <label class="form-label fw-bold">Срок выполнения</label>
                  <input type="datetime-local" class="form-control" v-model="currentTask.due_date">
                </div>
              </div>
              
              <div class="mb-4">
                <label class="form-label fw-bold">Оценка времени (часы)</label>
                <input type="number" class="form-control" step="0.5" v-model="currentTask.estimated_hours"
                       placeholder="Сколько часов потребуется">
              </div>
            </form>
          </div>
          <div class="modal-footer border-top">
            <button type="button" class="btn btn-light" data-bs-dismiss="modal">Отменить</button>
            <button type="button" class="btn btn-danger" v-if="isEditing" @click="confirmDeleteTask">
              <i class="fas fa-trash me-2"></i>Удалить
            </button>
            <button type="button" class="btn btn-primary" @click="submitTask" 
                    :disabled="!currentTask.title || !currentTask.project_id">
              <i class="fas fa-save me-2"></i>{{ isEditing ? 'Сохранить' : 'Создать' }}
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- Модальное окно просмотра задачи -->
    <div class="modal fade" id="taskViewModal" tabindex="-1">
      <div class="modal-dialog modal-lg">
        <div class="modal-content border-0">
          <div class="modal-header border-bottom">
            <h5 class="modal-title">
              <i class="fas fa-eye me-2"></i>{{ selectedTask.title }}
            </h5>
            <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
          </div>
          <div class="modal-body p-4">
            <div class="row g-4">
              <div class="col-12" v-if="selectedTask.description">
                <div class="info-section">
                  <h6 class="text-muted mb-2">Описание</h6>
                  <p class="mb-0">{{ selectedTask.description }}</p>
                </div>
              </div>
              
              <div class="col-md-6">
                <div class="info-section">
                  <h6 class="text-muted mb-2">Информация</h6>
                  <div class="info-list">
                    <div class="info-item">
                      <i class="fas fa-folder text-primary me-2"></i>
                      <span class="text-muted me-2">Проект:</span>
                      <strong>{{ selectedTask.project?.name || 'Без проекта' }}</strong>
                    </div>
                    <div class="info-item">
                      <i class="fas fa-user text-primary me-2"></i>
                      <span class="text-muted me-2">Исполнитель:</span>
                      <strong>{{ selectedTask.assignee?.full_name || 'Не назначен' }}</strong>
                    </div>
                    <div class="info-item">
                      <i class="fas fa-clock text-primary me-2"></i>
                      <span class="text-muted me-2">Создана:</span>
                      <strong>{{ formatDateTime(selectedTask.created_at) }}</strong>
                      <span v-if="selectedTask.creator" class="text-muted"> ({{ selectedTask.creator.full_name }})</span>
                    </div>
                  </div>
                </div>
              </div>
              
              <div class="col-md-6">
                <div class="info-section">
                  <h6 class="text-muted mb-2">Статус и сроки</h6>
                  <div class="info-list">
                    <div class="info-item">
                      <span class="text-muted me-2">Статус:</span>
                      <span class="badge rounded-pill" :class="getStatusClass(selectedTask.status)">
                        {{ getStatusText(selectedTask.status) }}
                      </span>
                    </div>
                    <div class="info-item">
                      <span class="text-muted me-2">Приоритет:</span>
                      <span class="badge rounded-pill" :class="getPriorityClass(selectedTask.priority)">
                        {{ getPriorityText(selectedTask.priority) }}
                      </span>
                    </div>
                    <div class="info-item" v-if="selectedTask.due_date">
                      <i class="fas fa-calendar-check text-primary me-2"></i>
                      <span class="text-muted me-2">Срок:</span>
                      <strong :class="getDueDateClass(selectedTask.due_date, selectedTask.status)">
                        {{ formatDateTime(selectedTask.due_date) }}
                      </strong>
                    </div>
                  </div>
                </div>
              </div>
              
              <div class="col-12" v-if="selectedTask.estimated_hours || selectedTask.actual_hours">
                <div class="info-section">
                  <h6 class="text-muted mb-2">Время</h6>
                  <div class="row">
                    <div class="col-md-6" v-if="selectedTask.estimated_hours">
                      <div class="time-card">
                        <i class="fas fa-hourglass-half text-info"></i>
                        <div>
                          <div class="time-value">{{ selectedTask.estimated_hours }} ч.</div>
                          <div class="time-label">Оценка времени</div>
                        </div>
                      </div>
                    </div>
                    <div class="col-md-6" v-if="selectedTask.actual_hours">
                      <div class="time-card">
                        <i class="fas fa-clock text-success"></i>
                        <div>
                          <div class="time-value">{{ selectedTask.actual_hours }} ч.</div>
                          <div class="time-label">Потрачено времени</div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
          <div class="modal-footer border-top">
            <button type="button" class="btn btn-light" data-bs-dismiss="modal">Закрыть</button>
            <router-link :to="`/crm/project-management/task/${selectedTask.id}`" class="btn btn-info">
              <i class="fas fa-external-link-alt me-2"></i>Подробно
            </router-link>
            <button type="button" class="btn btn-primary" @click="editTaskFromView">
              <i class="fas fa-edit me-2"></i>Редактировать
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
  name: 'TasksList',
  data() {
    return {
      tasks: [],
      projects: [],
      users: [],
      loading: false,
      filters: {
        search: '',
        status: '',
        priority: '',
        project: '',
        ordering: '-created_at',
        my_tasks: false
      },
      pagination: {
        current_page: 1,
        total_pages: 1,
        previous: null,
        next: null,
        count: 0
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
      selectedTask: {},
      isEditing: false,
      searchTimeout: null
    }
  },
  
  async mounted() {
    await this.loadProjects()
    await this.loadUsers()
    this.loadTasks()
  },
  
  computed: {
    debouncedSearch() {
      return () => {
        clearTimeout(this.searchTimeout)
        this.searchTimeout = setTimeout(() => {
          this.pagination.current_page = 1
          this.loadTasks()
        }, 500)
      }
    }
  },
  
  methods: {
    async loadProjects() {
      try {
        const response = await projectManagementApi.getProjects({ my_projects: true })
        this.projects = Array.isArray(response.data.results) ? response.data.results : 
                        Array.isArray(response.data) ? response.data : []
      } catch (error) {
        console.error('Ошибка загрузки проектов:', error)
        this.projects = []
      }
    },
    
    async loadUsers() {
      try {
        const response = await projectManagementApi.getUsers()
        this.users = Array.isArray(response.data.results) ? response.data.results : 
                     Array.isArray(response.data) ? response.data : []
      } catch (error) {
        console.error('Ошибка загрузки пользователей:', error)
        this.users = []
      }
    },
    
    async loadTasks() {
      this.loading = true
      try {
        const params = {
          page: this.pagination.current_page,
          page_size: 20,
          ...this.filters
        }
        
        // Убираем пустые фильтры, но оставляем булевые true
        Object.keys(params).forEach(key => {
          if (params[key] === '' || (params[key] === false && key !== 'my_tasks')) {
            delete params[key]
          }
        })
        
        const response = await projectManagementApi.getTasks(params)
        
        if (response.data.results) {
          this.tasks = response.data.results
          this.pagination = {
            current_page: response.data.current_page || 1,
            total_pages: response.data.total_pages || 1,
            previous: response.data.previous,
            next: response.data.next,
            count: response.data.count || 0
          }
        } else {
          this.tasks = Array.isArray(response.data) ? response.data : []
        }
      } catch (error) {
        console.error('Ошибка загрузки задач:', error)
        this.tasks = []
      } finally {
        this.loading = false
      }
    },
    
    changePage(page) {
      if (page >= 1 && page <= this.pagination.total_pages) {
        this.pagination.current_page = page
        this.loadTasks()
      }
    },
    
    getPageNumbers() {
      const pages = []
      const current = this.pagination.current_page
      const total = this.pagination.total_pages
      
      for (let i = Math.max(1, current - 2); i <= Math.min(total, current + 2); i++) {
        pages.push(i)
      }
      
      return pages
    },
    
    createTask() {
      this.isEditing = false
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
        // Подготавливаем данные задачи, конвертируя пустые строки в null
        const taskData = {
          ...this.currentTask,
          project_id: this.currentTask.project_id || null,
          assignee_id: this.currentTask.assignee_id || null,
          start_date: this.currentTask.start_date || null,
          due_date: this.currentTask.due_date || null,
          estimated_hours: this.currentTask.estimated_hours || null
        }
        
        if (this.isEditing) {
          await projectManagementApi.updateTask(taskData.id, taskData)
        } else {
          await projectManagementApi.createTask(taskData)
        }
        
        // Закрываем модальное окно
        const modal = Modal.getInstance(document.getElementById('taskModal'))
        if (modal) modal.hide()
        
        // Перезагружаем список
        this.loadTasks()
        
        alert(this.isEditing ? 'Задача обновлена' : 'Задача создана')
      } catch (error) {
        console.error('Ошибка сохранения задачи:', error)
        console.error('Детали ошибки:', error.response?.data)
        
        // Показываем детали ошибки
        let errorMessage = 'Ошибка сохранения задачи'
        
        if (error.response?.data) {
          if (typeof error.response.data === 'object') {
            const errors = []
            for (const [field, messages] of Object.entries(error.response.data)) {
              if (Array.isArray(messages)) {
                errors.push(`${field}: ${messages.join(', ')}`)
              } else {
                errors.push(`${field}: ${messages}`)
              }
            }
            if (errors.length > 0) {
              errorMessage += ':\n' + errors.join('\n')
            }
          } else {
            errorMessage += ': ' + error.response.data
          }
        }
        
        alert(errorMessage)
      }
    },
    
    deleteTask(task) {
      this.currentTask = task
      this.confirmDeleteTask()
    },
    
    async confirmDeleteTask() {
      if (confirm(`Вы уверены, что хотите удалить задачу "${this.currentTask.title}"?`)) {
        try {
          await projectManagementApi.deleteTask(this.currentTask.id)
          
          // Закрываем модальное окно если открыто
          const modal = Modal.getInstance(document.getElementById('taskModal'))
          if (modal) modal.hide()
          
          // Перезагружаем список
          this.loadTasks()
          
          this.$toast?.success('Задача удалена')
        } catch (error) {
          console.error('Ошибка удаления задачи:', error)
          this.$toast?.error('Ошибка удаления задачи')
        }
      }
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
        'low': 'bg-light text-dark',
        'medium': 'bg-primary',
        'high': 'bg-warning text-dark',
        'urgent': 'bg-danger'
      }
      return classes[priority] || 'bg-light text-dark'
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
      if (!dueDate) return 'text-muted'
      if (status === 'done') return 'text-muted'
      
      const now = new Date()
      const due = new Date(dueDate)
      
      if (due < now) return 'text-danger fw-bold'
      if (due - now < 24 * 60 * 60 * 1000) return 'text-warning fw-bold'
      return 'text-muted'
    },
    
    formatDate(date) {
      if (!date) return 'Не указан'
      return new Date(date).toLocaleDateString('ru-RU', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric'
      })
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
    
    formatDateTimeLocal(date) {
      if (!date) return ''
      return new Date(date).toISOString().slice(0, 16)
    },
    
    truncateText(text, maxLength) {
      if (!text) return ''
      return text.length > maxLength ? text.substring(0, maxLength) + '...' : text
    },
    
    getAvatarUrl(user) {
      if (!user) return ''
      const name = user.full_name || `${user.first_name} ${user.last_name}`.trim() || user.username || 'User'
      return user.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=6c757d&color=fff&size=32`
    }
  }
}
</script>

<style scoped lang="scss">
@import './project-management.scss';

.tasks-list {
  padding: 20px;
  min-height: 100vh;
  background: var(--bs-gray-100);
}

.empty-state {
  padding: 4rem 2rem;
  background: white;
  border-radius: $radius-usual;
  box-shadow: $pm-card-shadow;
  margin-top: 2rem;
}

.tasks-table-wrapper {
  @include pm-card;
  padding: 0;
  overflow: hidden;
}

.tasks-table {
  margin-bottom: 0;
  
  thead {
    background: var(--bs-light);
    
    th {
      border-top: none;
      border-bottom: 2px solid var(--bs-border-color);
      font-weight: $font-weight-bold;
      font-size: $font-size-small;
      color: var(--bs-secondary-color);
      padding: 1rem;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      
      &:first-child {
        width: 35%;
      }
      &:nth-child(2) {
        width: 15%;
      }
      &:nth-child(3) {
        width: 15%;
      }
      &:nth-child(4) {
        width: 10%;
      }
      &:nth-child(5) {
        width: 10%;
      }
      &:nth-child(6) {
        width: 10%;
      }
      &:last-child {
        width: 5%;
        text-align: center;
      }
    }
  }
  
  .task-row {
    cursor: pointer;
    transition: all $pm-transition;
    
    &:hover {
      background-color: var(--bs-light);
      transform: translateX(2px);
    }
    
    td {
      vertical-align: middle;
      padding: 1rem;
      border-bottom: 1px solid var(--bs-gray-200);
    }
  }
  
  .task-cell-main {
    .task-title {
      font-size: $font-size-usual;
      font-weight: $font-weight-bold;
      color: var(--bs-heading-color);
      margin-bottom: 0.25rem;
    }
    
    .task-description {
      font-size: $font-size-small;
      color: var(--bs-secondary-color);
      line-height: 1.5;
      margin-bottom: 0;
    }
  }
  
  .project-badge {
    @include pm-badge;
    color: white;
    text-shadow: 0 1px 2px rgba(0, 0, 0, 0.1);
  }
  
  .assignee-info {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    
    .assignee-avatar {
      width: 32px;
      height: 32px;
      border-radius: 50%;
      object-fit: cover;
      border: 2px solid var(--bs-gray-200);
    }
    
    .assignee-name {
      font-size: $font-size-small;
      color: var(--bs-heading-color);
    }
  }
}

.badge {
  @include pm-badge;
}

.btn {
  @include pm-button;
}

// Пагинация
.pagination-modern {
  .page-item {
    margin: 0 2px;
    
    &:first-child .page-link {
      border-radius: $radius-small 0 0 $radius-small;
    }
    
    &:last-child .page-link {
      border-radius: 0 $radius-small $radius-small 0;
    }
  }
  
  .page-link {
    border: none;
    background: white;
    color: var(--bs-secondary-color);
    padding: 0.5rem 1rem;
    font-weight: $font-weight-bold;
    box-shadow: $pm-card-shadow;
    transition: all $pm-transition;
    
    &:hover {
      background: var(--bs-primary);
      color: white;
      transform: translateY(-2px);
      box-shadow: $pm-card-hover-shadow;
    }
    
    &:focus {
      box-shadow: 0 0 0 0.2rem rgba($primary, 0.25);
    }
  }
  
  .page-item.active .page-link {
    background: var(--bs-primary);
    color: white;
  }
  
  .page-item.disabled .page-link {
    background: var(--bs-gray-200);
    opacity: 0.5;
    cursor: not-allowed;
  }
}

// Модальные окна
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

// Модальное окно просмотра
.info-section {
  margin-bottom: 1.5rem;
  
  h6 {
    font-size: $font-size-micro;
    text-transform: uppercase;
    letter-spacing: 1px;
    margin-bottom: 1rem;
  }
  
  .info-list {
    .info-item {
      display: flex;
      align-items: center;
      margin-bottom: 0.75rem;
      
      i {
        width: 20px;
        text-align: center;
      }
    }
  }
}

.time-card {
  display: flex;
  align-items: center;
  gap: 1rem;
  padding: 1rem;
  background: var(--bs-light);
  border-radius: $radius-small;
  
  i {
    font-size: 2rem;
  }
  
  .time-value {
    font-size: 1.5rem;
    font-weight: $font-weight-bold;
    color: var(--bs-heading-color);
  }
  
  .time-label {
    font-size: $font-size-small;
    color: var(--bs-secondary-color);
  }
}

// Классы для сроков
.text-danger {
  &.fw-bold {
    font-weight: $font-weight-bold !important;
  }
}

// Адаптивность
@media (max-width: 768px) {
  .tasks-list {
    padding: 1rem;
  }
  
  .pm-page-header {
    flex-direction: column;
    gap: 1rem;
    
    h2 {
      font-size: $font-size-h2;
    }
  }
  
  .tasks-table-wrapper {
    overflow-x: auto;
    
    .tasks-table {
      min-width: 800px;
    }
  }
}
</style> 