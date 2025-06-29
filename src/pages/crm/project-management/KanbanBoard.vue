<template>
  <div class="kanban-board">
    <div class="pm-page-header d-flex justify-content-between align-items-center">
      <h2><i class="fas fa-columns me-2"></i>Канбан доска</h2>
      <div>
        <button class="btn btn-outline-secondary me-2" @click="refreshBoard">
          <i class="fas fa-sync-alt me-1"></i>Обновить
        </button>
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
              <option value="low">Низкий</option>
              <option value="medium">Средний</option>
              <option value="high">Высокий</option>
              <option value="urgent">Срочный</option>
            </select>
          </div>
          <div class="col-md-3">
            <label class="form-label">Исполнитель</label>
            <select class="form-select" v-model="filters.assignee" @change="loadKanbanData">
              <option value="">Все исполнители</option>
              <option v-for="user in users" :key="user.id" :value="user.id">
                {{ user.full_name }}
              </option>
            </select>
          </div>
          <div class="col-md-2 d-flex align-items-end">
            <div class="form-check">
              <input class="form-check-input" type="checkbox" v-model="filters.my_tasks" 
                     @change="loadKanbanData" id="myTasksKanban">
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
      <div class="row g-3">
        <div class="col-md-3" v-for="(column, status) in kanbanColumns" :key="status">
          <div class="kanban-column">
            <div class="kanban-header" :class="getColumnHeaderClass(status)">
              <h5 class="mb-0 d-flex align-items-center justify-content-between">
                <span>
                  <i :class="getColumnIcon(status)" class="me-2"></i>
                  {{ column.title }}
                </span>
                <span class="task-count">{{ column.tasks.length }}</span>
              </h5>
            </div>
            
            <div class="kanban-body" 
                 @drop="onDrop($event, status)" 
                 @dragover.prevent 
                 @dragenter.prevent>
              
              <div class="kanban-task pm-fade-in" 
                   v-for="task in column.tasks" 
                   :key="task.id"
                   draggable="true"
                   @dragstart="onDragStart($event, task)"
                   @click="viewTask(task)">
                
                <div class="task-header">
                  <span class="badge rounded-pill" :class="getPriorityClass(task.priority)">
                    {{ getPriorityText(task.priority) }}
                  </span>
                  <button class="btn btn-sm btn-link task-action" @click.stop="editTask(task)">
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
                <span class="badge ms-1" :class="getStatusClass(selectedTask.status)">
                  {{ getStatusText(selectedTask.status) }}
                </span>
              </div>
              <div class="col-md-6">
                <strong>Приоритет:</strong> 
                <span class="badge ms-1" :class="getPriorityClass(selectedTask.priority)">
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

export default {
  name: 'KanbanBoard',
  data() {
    return {
      kanbanColumns: {
        todo: { title: 'К выполнению', tasks: [] },
        in_progress: { title: 'В работе', tasks: [] },
        review: { title: 'На проверке', tasks: [] },
        done: { title: 'Выполнено', tasks: [] }
      },
      projects: [],
      users: [],
      filters: {
        project_id: '',
        priority: '',
        assignee: '',
        my_tasks: false
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
      draggedTask: null
    }
  },
  
  async mounted() {
    await this.loadProjects()
    await this.loadUsers()
    this.loadKanbanData()
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
        // Здесь должен быть API для получения пользователей
        this.users = []
      } catch (error) {
        console.error('Ошибка загрузки пользователей:', error)
      }
    },
    
    async loadKanbanData() {
      try {
        const params = { ...this.filters }
        
        // Убираем пустые фильтры
        Object.keys(params).forEach(key => {
          if (params[key] === '' || params[key] === false) {
            delete params[key]
          }
        })
        
        const response = await projectManagementApi.getKanbanTasks(params)
        
        // Обновляем данные колонок
        Object.keys(this.kanbanColumns).forEach(status => {
          this.kanbanColumns[status].tasks = response.data[status] || []
        })
      } catch (error) {
        console.error('Ошибка загрузки канбан данных:', error)
      }
    },
    
    onDragStart(event, task) {
      this.draggedTask = task
      event.dataTransfer.effectAllowed = 'move'
    },
    
    async onDrop(event, newStatus) {
      event.preventDefault()
      
      if (!this.draggedTask || this.draggedTask.status === newStatus) {
        return
      }
      
      try {
        // Обновляем статус задачи на сервере
        await projectManagementApi.updateTaskKanbanOrder(this.draggedTask.id, {
          status: newStatus,
          order: 0 // Можно добавить логику для определения позиции
        })
        
        // Перезагружаем данные
        this.loadKanbanData()
        
        this.$toast.success('Статус задачи обновлен')
      } catch (error) {
        console.error('Ошибка обновления статуса:', error)
        this.$toast.error('Ошибка обновления статуса')
      }
      
      this.draggedTask = null
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
        if (this.isEditing) {
          await projectManagementApi.updateTask(this.currentTask.id, this.currentTask)
        } else {
          await projectManagementApi.createTask(this.currentTask)
        }
        
        // Закрываем модальное окно
        const modal = Modal.getInstance(document.getElementById('taskModal'))
        modal.hide()
        
        // Перезагружаем данные
        this.loadKanbanData()
        
        this.$toast.success(this.isEditing ? 'Задача обновлена' : 'Задача создана')
      } catch (error) {
        console.error('Ошибка сохранения задачи:', error)
        this.$toast.error('Ошибка сохранения задачи')
      }
    },
    
    async deleteTask() {
      if (confirm('Вы уверены, что хотите удалить эту задачу?')) {
        try {
          await projectManagementApi.deleteTask(this.currentTask.id)
          
          // Закрываем модальное окно
          const modal = Modal.getInstance(document.getElementById('taskModal'))
          modal.hide()
          
          // Перезагружаем данные
          this.loadKanbanData()
          
          this.$toast.success('Задача удалена')
        } catch (error) {
          console.error('Ошибка удаления задачи:', error)
          this.$toast.error('Ошибка удаления задачи')
        }
      }
    },
    
    refreshBoard() {
      this.loadKanbanData()
    },
    
    getColumnHeaderClass(status) {
      const classes = {
        'todo': 'bg-secondary text-white',
        'in_progress': 'bg-info text-white',
        'review': 'bg-warning text-dark',
        'done': 'bg-success text-white'
      }
      return classes[status] || 'bg-secondary text-white'
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
    
    getDueDateClass(dueDate, status) {
      if (status === 'done') return 'text-muted'
      
      const now = new Date()
      const due = new Date(dueDate)
      
      if (due < now) return 'text-danger'
      if (due - now < 24 * 60 * 60 * 1000) return 'text-warning'
      return 'text-muted'
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
      return new Date(date).toISOString().slice(0, 16)
    },
    
    truncateText(text, maxLength) {
      if (!text) return ''
      return text.length > maxLength ? text.substring(0, maxLength) + '...' : text
    },
    
    getAvatarUrl(user) {
      // Возвращаем аватар пользователя или дефолтный
      return user.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(user.full_name)}&background=6c757d&color=fff&size=32`
    },
    
    getColumnIcon(status) {
      const icons = {
        'todo': 'fas fa-clipboard-list',
        'in_progress': 'fas fa-cog',
        'review': 'fas fa-eye',
        'done': 'fas fa-check'
      }
      return icons[status] || 'fas fa-question'
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
      this.currentTask = {
        title: '',
        description: '',
        project_id: '',
        assignee_id: '',
        status: status,
        priority: 'medium',
        due_date: '',
        estimated_hours: null
      }
      
      const modal = new Modal(document.getElementById('taskModal'))
      modal.show()
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

.kanban-column {
  height: calc(100vh - 300px);
  min-height: 500px;
  display: flex;
  flex-direction: column;
  @include pm-card;
  padding: 0;
  overflow: hidden;
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
}

.kanban-body {
  flex: 1;
  overflow-y: auto;
  padding: 1rem;
  background: var(--bs-gray-50);
  
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
  transition: all $pm-transition;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
  
  &:hover {
    transform: translateY(-2px);
    box-shadow: $pm-card-hover-shadow;
    border-color: var(--bs-primary);
  }
  
  &:active {
    cursor: grabbing;
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
.kanban-body.drag-over {
  background: var(--bs-light);
  border: 2px dashed var(--bs-primary);
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
  
  .kanban-container {
    overflow-x: auto;
    margin: 0 -1rem;
    padding: 0 1rem;
    
    .row {
      min-width: 1000px;
    }
  }
  
  .kanban-column {
    height: 400px;
    min-height: 400px;
  }
}
</style> 