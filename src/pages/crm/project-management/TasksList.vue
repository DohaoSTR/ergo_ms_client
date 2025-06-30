<template>
  <div class="tasks-list">
    <div class="pm-page-header d-flex justify-content-between align-items-center" v-if="!managementMode">
      <h2><i class="fas fa-list-check me-2"></i>Мои задачи</h2>
      <button class="btn btn-primary" @click="createTask">
        <i class="fas fa-plus me-2"></i>Создать задачу
      </button>
    </div>
    <!-- В режиме управления заголовок и кнопка создания показываются в родительском компоненте -->

    <!-- Фильтры и поиск -->
    <div class="pm-filters-card">
      <div class="card-body">
        <div class="row g-3">
          <div class="col-lg-2 col-md-3">
            <label class="form-label"><i class="fas fa-search me-1"></i>Поиск</label>
            <input type="text" class="form-control" v-model="filters.search" @input="debouncedSearch" 
                   placeholder="Поиск по названию...">
          </div>
          <div class="col-lg-2 col-md-3">
            <label class="form-label">Статус</label>
            <select class="form-select" v-model="filters.status" @change="loadTasks" :disabled="loadingStatuses">
              <option value="">Все статусы</option>
              <option v-if="loadingStatuses">Загрузка...</option>
              <option v-else v-for="status in taskStatuses" :key="status.id" :value="status.code">
                {{ status.name }}
              </option>
            </select>
          </div>
          <div class="col-lg-2 col-md-3">
            <label class="form-label">Приоритет</label>
            <select class="form-select" v-model="filters.priority" @change="loadTasks" :disabled="loadingStatuses">
              <option value="">Все приоритеты</option>
              <option v-if="loadingStatuses">Загрузка...</option>
              <option v-else v-for="priority in taskPriorities" :key="priority.id" :value="priority.code">
                {{ priority.name }}
              </option>
            </select>
          </div>
          <div class="col-lg-2 col-md-3">
            <label class="form-label">Проект</label>
            <select class="form-select" v-model="filters.project" @change="loadTasks">
              <option value="">Все проекты</option>
              <option v-for="project in projects" :key="project.id" :value="project.id">
                {{ project.name }}
              </option>
            </select>
          </div>
          <div class="col-lg-2 col-md-3">
            <label class="form-label">Исполнитель</label>
            <select class="form-select" v-model="filters.assignee" @change="onAssigneeChange">
              <option value="">Все исполнители</option>
              <option v-for="user in users" :key="user.id" :value="user.id">
                {{ user.full_name || user.username }}
              </option>
            </select>
          </div>
          <div class="col-lg-2 col-md-3">
            <label class="form-label">Сортировка</label>
            <select class="form-select" v-model="filters.ordering" @change="loadTasks">
              <option value="-created_at">По дате создания ↓</option>
              <option value="created_at">По дате создания ↑</option>
              <option value="due_date">По сроку ↑</option>
              <option value="-due_date">По сроку ↓</option>
              <option value="priority">По приоритету ↑</option>
              <option value="-priority">По приоритету ↓</option>
              <option value="assignee">По исполнителю ↑</option>
              <option value="-assignee">По исполнителю ↓</option>
            </select>
          </div>
        </div>
        <div class="row g-3 mt-2">
          <div class="col-12 d-flex align-items-center">
            <div class="form-check">
              <input class="form-check-input" type="checkbox" v-model="filters.my_tasks" @change="onMyTasksChange" id="myTasksFilter">
              <label class="form-check-label" for="myTasksFilter">
                Показать только мои задачи
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
                    <div class="task-badges mt-2" v-if="task.attachment_count">
                      <span class="badge bg-light text-dark" v-if="task.attachment_count">
                        <i class="fas fa-paperclip me-1"></i>{{ task.attachment_count }}
                      </span>
                    </div>
                  </div>
                </td>
                <td class="project-cell">
                  <div class="project-info" v-if="task.project">
                    <div class="project-badge" 
                         :style="{ backgroundColor: task.project.color || '#007bff' }" 
                         :title="task.project.name">
                      <i class="fas fa-folder me-1"></i>
                      <span class="project-name">{{ task.project.name }}</span>
                    </div>
                  </div>
                  <div v-else class="project-empty">
                    <span class="text-muted">
                      <i class="fas fa-folder-open me-1"></i>
                      Без проекта
                    </span>
                  </div>
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
                <td @click.stop class="actions-cell">
                  <div class="action-buttons">
                    <button class="btn btn-edit-icon" @click="editTask(task)" title="Редактировать">
                      <Edit />
                    </button>
                    <button class="btn btn-delete-icon" @click="deleteTask(task)" title="Удалить">
                      <Trash2 />
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
                  <select class="form-select" v-model="currentTask.status" :disabled="loadingStatuses">
                    <option v-if="loadingStatuses">Загрузка...</option>
                    <option v-else v-for="status in taskStatuses" :key="status.id" :value="status.code">
                      {{ status.name }}
                    </option>
                  </select>
                </div>
              </div>
              
              <div class="row g-3 mb-4">
                <div class="col-md-4">
                  <label class="form-label fw-bold">Приоритет</label>
                  <select class="form-select" v-model="currentTask.priority" :disabled="loadingStatuses">
                    <option v-if="loadingStatuses">Загрузка...</option>
                    <option v-else v-for="priority in taskPriorities" :key="priority.id" :value="priority.code">
                      {{ priority.name }}
                    </option>
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
          <div class="modal-header bg-light border-bottom">
            <div class="d-flex align-items-center gap-3 w-100">
              <div class="icon-wrapper bg-primary bg-opacity-10 p-2 rounded-circle flex-shrink-0">
                <i class="fas fa-clipboard-check fa-lg text-primary"></i>
              </div>
              <div class="flex-grow-1 overflow-hidden">
                <h5 class="modal-title mb-0 text-truncate" :title="selectedTask.title">{{ selectedTask.title }}</h5>
              </div>
            </div>
            <button type="button" class="btn-close flex-shrink-0 ms-3" data-bs-dismiss="modal"></button>
          </div>
          <div class="modal-body p-4">
            <div class="task-view-content">
              <!-- Статус и приоритет -->
              <div class="mb-4 d-flex gap-3">
                <span class="badge rounded-pill px-3 py-2" :class="getStatusClass(selectedTask.status)">
                  <i class="fas fa-circle me-1" style="font-size: 0.5rem;"></i>
                  {{ getStatusText(selectedTask.status) }}
                </span>
                <span class="badge rounded-pill px-3 py-2" :class="getPriorityClass(selectedTask.priority)">
                  <i class="fas fa-flag me-1"></i>
                  {{ getPriorityText(selectedTask.priority) }}
                </span>
              </div>

              <!-- Описание -->
              <div class="description-section mb-4 p-3 bg-light rounded" v-if="selectedTask.description">
                <h6 class="text-uppercase text-muted small mb-2">
                  <i class="fas fa-align-left me-2"></i>Описание
                </h6>
                <p class="mb-0 text-dark">{{ selectedTask.description }}</p>
              </div>

              <!-- Основная информация в карточках -->
              <div class="row g-3 mb-4">
                <!-- Проект -->
                <div class="col-md-6">
                  <div class="info-card h-100 p-3 border rounded">
                    <div class="d-flex align-items-center mb-2">
                      <div class="icon-sm bg-primary bg-opacity-10 p-2 rounded me-2">
                        <i class="fas fa-folder text-primary"></i>
                      </div>
                      <h6 class="mb-0 text-muted small">
                        <i class="fas fa-project-diagram me-1"></i>ПРОЕКТ
                      </h6>
                    </div>
                    <div class="fw-bold text-dark">
                      {{ selectedTask.project?.name || 'Без проекта' }}
                    </div>
                    <div class="project-color-bar mt-2" v-if="selectedTask.project" 
                         :style="{ backgroundColor: selectedTask.project.color || '#007bff' }">
                    </div>
                  </div>
                </div>

                <!-- Исполнитель -->
                <div class="col-md-6">
                  <div class="info-card h-100 p-3 border rounded">
                    <div class="d-flex align-items-center mb-2">
                      <div class="icon-sm bg-success bg-opacity-10 p-2 rounded me-2">
                        <i class="fas fa-user text-success"></i>
                      </div>
                      <h6 class="mb-0 text-muted small">
                        <i class="fas fa-user-check me-1"></i>ИСПОЛНИТЕЛЬ
                      </h6>
                    </div>
                    <div class="d-flex align-items-center" v-if="selectedTask.assignee">
                      <img :src="getAvatarUrl(selectedTask.assignee)" 
                           :alt="selectedTask.assignee.full_name || selectedTask.assignee.username"
                           class="rounded-circle me-2"
                           style="width: 32px; height: 32px; object-fit: cover;">
                      <div class="fw-bold text-dark">
                        {{ selectedTask.assignee?.full_name || 'Не назначен' }}
                      </div>
                    </div>
                    <div v-else class="fw-bold text-muted">
                      <i class="fas fa-user-slash me-2"></i>Не назначен
                    </div>
                  </div>
                </div>
              </div>

              <!-- Даты и время -->
              <div class="row g-3 mb-4">
                <!-- Сроки -->
                <div class="col-md-6">
                  <div class="info-card h-100 p-3 border rounded">
                    <div class="d-flex align-items-center mb-2">
                      <div class="icon-sm bg-warning bg-opacity-10 p-2 rounded me-2">
                        <i class="fas fa-calendar-alt text-warning"></i>
                      </div>
                      <h6 class="mb-0 text-muted small">
                        <i class="fas fa-calendar-check me-1"></i>СРОКИ
                      </h6>
                    </div>
                    <div v-if="selectedTask.due_date">
                      <div class="mb-1">
                        <small class="text-muted">
                          <i class="fas fa-hourglass-end me-1"></i>Срок выполнения:
                        </small>
                      </div>
                      <div class="fw-bold" :class="getDueDateClass(selectedTask.due_date, selectedTask.status)">
                        <i class="fas fa-calendar-day me-1"></i>
                        {{ formatDateTime(selectedTask.due_date) }}
                      </div>
                    </div>
                    <div v-else class="fw-bold text-muted">
                      <i class="fas fa-calendar-times me-2"></i>Срок не установлен
                    </div>
                  </div>
                </div>

                <!-- Время -->
                <div class="col-md-6" v-if="selectedTask.estimated_hours || selectedTask.actual_hours">
                  <div class="info-card h-100 p-3 border rounded">
                    <div class="d-flex align-items-center mb-2">
                      <div class="icon-sm bg-info bg-opacity-10 p-2 rounded me-2">
                        <i class="fas fa-clock text-info"></i>
                      </div>
                      <h6 class="mb-0 text-muted small">
                        <i class="fas fa-hourglass-half me-1"></i>ВРЕМЯ
                      </h6>
                    </div>
                    <div class="d-flex justify-content-around">
                      <div v-if="selectedTask.estimated_hours" class="text-center">
                        <div class="fw-bold text-info">
                          <i class="fas fa-hourglass-start me-1"></i>{{ selectedTask.estimated_hours }}ч
                        </div>
                        <small class="text-muted">Оценка</small>
                      </div>
                      <div v-if="selectedTask.actual_hours" class="text-center">
                        <div class="fw-bold text-success">
                          <i class="fas fa-business-time me-1"></i>{{ selectedTask.actual_hours }}ч
                        </div>
                        <small class="text-muted">Потрачено</small>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <!-- Метаинформация -->
              <div class="meta-info p-3 bg-light rounded">
                <div class="row g-3">
                  <div class="col-6">
                    <small class="text-muted d-block mb-1">
                      <i class="fas fa-plus-circle me-1"></i>Создана
                    </small>
                    <div class="small">
                      {{ formatDateTime(selectedTask.created_at) }}
                      <span v-if="selectedTask.creator" class="text-muted">
                        ({{ selectedTask.creator.full_name }})
                      </span>
                    </div>
                  </div>
                  <div class="col-6" v-if="selectedTask.updated_at">
                    <small class="text-muted d-block mb-1">
                      <i class="fas fa-edit me-1"></i>Обновлена
                    </small>
                    <div class="small">{{ formatDateTime(selectedTask.updated_at) }}</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
          <div class="modal-footer bg-light border-top">
            <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">
              <i class="fas fa-times me-2"></i>Закрыть
            </button>
            <button v-if="selectedTask.project" 
                    @click="goToProject"
                    class="btn btn-primary">
              <i class="fas fa-folder-open me-2"></i>Перейти к проекту
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { Modal } from 'bootstrap'
import { Edit, Trash2 } from 'lucide-vue-next'
import projectManagementApi from '@/js/api/projectManagementApi.js'
import { useNotifications } from '@/pages/lms/composables/useNotifications'

export default {
  name: 'TasksList',
  components: {
    Edit,
    Trash2
  },
  props: {
    managementMode: {
      type: Boolean,
      default: false
    }
  },
  setup() {
    const { showSuccess, showError, showConfirmDialog, closeConfirmDialog } = useNotifications()
    return { showSuccess, showError, showConfirmDialog, closeConfirmDialog }
  },
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
        assignee: '', // Добавляем фильтр по исполнителю
        ordering: '-created_at',
        my_tasks: false // По умолчанию false, чтобы не конфликтовать с другими фильтрами
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
      searchTimeout: null,
      // Динамические данные для статусов и приоритетов
      taskStatuses: [],
      taskPriorities: [],
      loadingStatuses: false
    }
  },
  
  async mounted() {
    await this.loadProjects()
    await this.loadUsers()
    await this.loadStatusesAndPriorities()
    this.loadTasks()
    
    // Проверяем URL параметры для автоматического создания задачи
    this.handleUrlParams()
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
    
    onAssigneeChange() {
      // Когда выбран конкретный исполнитель, сбрасываем "Мои задачи"
      if (this.filters.assignee) {
        this.filters.my_tasks = false
      }
      this.pagination.current_page = 1  // Сбрасываем на первую страницу
      this.loadTasks()
    },
    
    onMyTasksChange() {
      // Когда включен "Мои задачи", сбрасываем фильтр по исполнителю
      if (this.filters.my_tasks) {
        this.filters.assignee = ''
      }
      this.pagination.current_page = 1  // Сбрасываем на первую страницу
      this.loadTasks()
    },

    async loadStatusesAndPriorities() {
      try {
        this.loadingStatuses = true
        const [statusesResponse, prioritiesResponse] = await Promise.all([
          projectManagementApi.getTaskStatuses(),
          projectManagementApi.getTaskPriorities()
        ])
        
        // Обрабатываем ответ - может быть массив или объект с results
        this.taskStatuses = Array.isArray(statusesResponse.data) ? 
          statusesResponse.data.filter(s => s.is_active) : 
          (statusesResponse.data.results || []).filter(s => s.is_active)
          
        this.taskPriorities = Array.isArray(prioritiesResponse.data) ? 
          prioritiesResponse.data.filter(p => p.is_active) : 
          (prioritiesResponse.data.results || []).filter(p => p.is_active)
          
        console.log(`Загружено статусов задач: ${this.taskStatuses.length}, приоритетов: ${this.taskPriorities.length}`)
        console.log('Статусы задач:', this.taskStatuses.map(s => s.name))
        console.log('Приоритеты задач:', this.taskPriorities.map(p => p.name))
        
        // Устанавливаем значения по умолчанию если есть
        const defaultStatus = this.taskStatuses.find(s => s.is_default)
        const defaultPriority = this.taskPriorities.find(p => p.is_default)
        
        if (defaultStatus && !this.isEditing) {
          this.currentTask.status = defaultStatus.code
        }
        if (defaultPriority && !this.isEditing) {
          this.currentTask.priority = defaultPriority.code
        }
      } catch (error) {
        console.error('Ошибка загрузки статусов и приоритетов:', error)
        // Fallback к жестко заданным значениям
        this.taskStatuses = [
          { id: 1, name: 'К выполнению', code: 'todo' },
          { id: 2, name: 'В работе', code: 'in_progress' },
          { id: 3, name: 'На проверке', code: 'review' },
          { id: 4, name: 'Выполнено', code: 'done' },
          { id: 5, name: 'Отменено', code: 'cancelled' }
        ]
        this.taskPriorities = [
          { id: 1, name: 'Низкий', code: 'low' },
          { id: 2, name: 'Средний', code: 'medium' },
          { id: 3, name: 'Высокий', code: 'high' },
          { id: 4, name: 'Срочный', code: 'urgent' }
        ]
      } finally {
        this.loadingStatuses = false
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

    // Публичный метод для обновления статусов и приоритетов
    async refreshStatusesAndPriorities() {
      await this.loadStatusesAndPriorities()
      console.log('Статусы и приоритеты задач обновлены:', this.taskStatuses.length, this.taskPriorities.length)
    },
    
    async createTask() {
      this.isEditing = false
      
      // Обновляем статусы и приоритеты перед созданием задачи
      console.log('Обновляем статусы перед созданием задачи...')
      await this.refreshStatusesAndPriorities()
      
      // Устанавливаем значения по умолчанию из загруженных данных
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
        
        this.showSuccess(this.isEditing ? 'Задача обновлена' : 'Задача создана')
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
        
        this.showError(errorMessage)
      }
    },
    
    deleteTask(task) {
      this.currentTask = task
      this.confirmDeleteTask()
    },
    
    async confirmDeleteTask() {
      const confirmed = await this.showConfirmDialog({
        title: 'Удаление задачи',
        message: `Вы уверены, что хотите удалить задачу "${this.currentTask.title}"?`,
        confirmText: 'Удалить',
        cancelText: 'Отмена',
        variant: 'danger'
      })
      
      if (confirmed) {
        try {
          await projectManagementApi.deleteTask(this.currentTask.id)
          
          // Закрываем модальное окно если открыто
          const modal = Modal.getInstance(document.getElementById('taskModal'))
          if (modal) modal.hide()
          
          this.closeConfirmDialog()
          
          // Перезагружаем список
          this.loadTasks()
          
          this.showSuccess('Задача удалена')
        } catch (error) {
          console.error('Ошибка удаления задачи:', error)
          this.closeConfirmDialog()
          this.showError('Ошибка удаления задачи')
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
      const statusObj = this.taskStatuses.find(s => s.code === status)
      return statusObj ? statusObj.name : status
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
      const priorityObj = this.taskPriorities.find(p => p.code === priority)
      return priorityObj ? priorityObj.name : priority
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
    },

    // Обработка URL параметров
    handleUrlParams() {
      const query = this.$route.query
      
      // Автоматическое создание задачи, если есть соответствующие параметры
      if (query.create === 'task') {
        // Небольшая задержка для завершения инициализации
        setTimeout(() => {
          this.createTask()
          
          // Если указан проект, предустанавливаем его
          if (query.project && this.projects.length > 0) {
            this.currentTask.project_id = query.project
          }
        }, 500)
      }
    },

    goToProject() {
      if (this.selectedTask.project) {
        // Закрываем модальное окно перед переходом
        const modal = Modal.getInstance(document.getElementById('taskViewModal'))
        if (modal) {
          modal.hide()
        }
        
        // Делаем переход после небольшой задержки, чтобы модальное окно успело закрыться
        setTimeout(() => {
          this.$router.push(`/crm/project-management/project/${this.selectedTask.project.id}`)
        }, 300)
      }
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
  
  .table-responsive {
    overflow-x: auto;
    overflow-y: visible;
  }
}

.tasks-table {
  margin-bottom: 0;
  table-layout: fixed;
  
  thead {
    background: var(--bs-light);
    
    th {
      border-top: none;
      border-bottom: 2px solid var(--bs-border-color);
      font-weight: $font-weight-bold;
      font-size: 0.75rem;
      color: var(--bs-secondary-color);
      padding: 0.75rem;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      
      &:first-child {
        width: 24%;
      }
      &:nth-child(2) {
        width: 18%;
        min-width: 140px;
      }
      &:nth-child(3) {
        width: 12%;
      }
      &:nth-child(4) {
        width: 10%;
      }
      &:nth-child(5) {
        width: 10%;
      }
      &:nth-child(6) {
        width: 16%;
      }
      &:last-child {
        width: 10%;
        text-align: center;
      }
    }
  }
  
  .task-row {
    cursor: pointer;
    transition: all $pm-transition;
    
    &:hover {
      background-color: var(--bs-light);
    }
    
    td {
      vertical-align: middle;
      padding: 0.75rem;
      border-bottom: 1px solid var(--bs-gray-200);
      overflow: hidden;
      word-wrap: break-word;
      
      &.task-cell-main {
        white-space: normal;
      }
      
      &.project-cell,
      &.actions-cell {
        white-space: nowrap;
        text-overflow: ellipsis;
      }
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
    
    .task-badges {
      display: flex;
      gap: 0.25rem;
      margin-top: 0.5rem;
      
      .badge {
        font-size: 0.65rem;
        padding: 0.2rem 0.4rem;
      }
    }
  }
  
  .project-cell {
    .project-info {
      .project-badge {
        color: white;
        text-shadow: 0 1px 2px rgba(0, 0, 0, 0.2);
        padding: 0.35rem 0.65rem;
        border-radius: 6px;
        font-size: 0.75rem;
        font-weight: 500;
        display: inline-block;
        max-width: 100%;
        border: none;
        box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
        
        .project-name {
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
          display: inline-block;
          max-width: 140px;
        }
        
        &:hover {
          transform: translateY(-1px);
          box-shadow: 0 2px 6px rgba(0, 0, 0, 0.2);
        }
        
        i {
          margin-right: 0.3rem;
          font-size: 0.7rem;
        }
      }
    }
    
    .project-empty {
      font-size: 0.875rem;
      font-style: italic;
      color: var(--bs-secondary);
    }
  }
  
  .assignee-info {
    display: flex;
    align-items: center;
    gap: 0.4rem;
    max-width: 100%;
    
    .assignee-avatar {
      width: 28px;
      height: 28px;
      border-radius: 50%;
      object-fit: cover;
      border: 2px solid var(--bs-gray-200);
      flex-shrink: 0;
    }
    
    .assignee-name {
      font-size: 0.8rem;
      color: var(--bs-heading-color);
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
      flex: 1;
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

// Новые стили для улучшенного модального окна
.task-view-content {
  .icon-wrapper {
    width: 48px;
    height: 48px;
    display: flex;
    align-items: center;
    justify-content: center;
  }
  
  .icon-sm {
    width: 32px;
    height: 32px;
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
  }
  
  .info-card {
    transition: all 0.2s ease;
    border-color: var(--bs-gray-300) !important;
    
    &:hover {
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
      transform: translateY(-1px);
    }
  }
  
  .project-color-bar {
    height: 3px;
    border-radius: 2px;
    width: 100%;
  }
  
  .description-section {
    background-color: var(--bs-gray-100) !important;
    border: 1px solid var(--bs-gray-200);
  }
  
  .meta-info {
    background-color: var(--bs-gray-100) !important;
    border: 1px solid var(--bs-gray-200);
    
    small {
      font-size: 0.75rem;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 0.5px;
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

// Стили для кнопок действий
.actions-cell {
  .action-buttons {
    display: flex;
    gap: 0.25rem;
    justify-content: center;
    
    .btn-action {
      padding: 0.375rem 0.5rem;
      border-radius: 6px;
      font-size: 0.875rem;
      transition: all 0.2s ease;
      border-width: 1px;
      
      &:hover {
        transform: translateY(-1px);
        box-shadow: 0 2px 6px rgba(0, 0, 0, 0.15);
      }
      
      i {
        font-size: 0.85rem;
      }
    }
    
    .btn-primary {
      &:hover {
        opacity: 0.9;
        transform: translateY(-1px);
      }
    }
    
    .btn-danger {
      &:hover {
        opacity: 0.9;
        transform: translateY(-1px);
      }
    }
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