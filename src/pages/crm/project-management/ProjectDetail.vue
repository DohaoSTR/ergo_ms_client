<template>
  <div class="project-detail">
    <div class="pm-page-header d-flex justify-content-between align-items-center">
      <div>
        <nav aria-label="breadcrumb">
          <ol class="breadcrumb mb-2">
            <li class="breadcrumb-item">
              <router-link to="/crm/project-management/dashboard">
                <i class="fas fa-home me-1"></i>Дашборд
              </router-link>
            </li>
            <li class="breadcrumb-item">
              <router-link to="/crm/project-management/projects">
                Проекты
              </router-link>
            </li>
            <li class="breadcrumb-item active" aria-current="page">
              {{ project?.name || 'Загрузка...' }}
            </li>
          </ol>
        </nav>
        <h2 class="mb-0">
          <i class="fas fa-folder-open me-2" v-if="project" :style="{ color: project.color }"></i>
          {{ project?.name || 'Загрузка проекта...' }}
        </h2>
      </div>
      <div class="d-flex gap-2" v-if="project">
        <button class="btn btn-outline-secondary" @click="editProject" title="Редактировать проект">
          <i class="fas fa-edit me-1"></i>Редактировать
        </button>
        <button class="btn btn-primary" @click="createTask" title="Добавить задачу">
          <i class="fas fa-plus me-2"></i>Добавить задачу
        </button>
      </div>
    </div>

    <div v-if="loading" class="text-center py-5">
      <div class="spinner-border text-primary" role="status">
        <span class="visually-hidden">Загрузка...</span>
      </div>
      <p class="text-muted mt-3">Загружаем данные проекта...</p>
    </div>

    <div v-else-if="error" class="alert alert-danger">
      <i class="fas fa-exclamation-triangle me-2"></i>{{ error }}
    </div>

    <div v-else-if="project">
      <!-- Информация о проекте -->
      <div class="row g-4 mb-4">
        <div class="col-lg-8">
          <div class="project-info-card">
            <div class="card-header">
              <h5 class="mb-0"><i class="fas fa-info-circle me-2"></i>Информация о проекте</h5>
            </div>
            <div class="card-body">
              <div class="project-description mb-4">
                <p class="mb-0">{{ project.description || 'Описание отсутствует' }}</p>
              </div>
              
              <div class="project-meta">
                <div class="row g-3">
                  <div class="col-sm-6 col-md-3">
                    <div class="meta-item">
                      <span class="meta-label">Статус</span>
                      <span class="badge rounded-pill" :class="getStatusClass(project.status)">
                        {{ getStatusText(project.status) }}
                      </span>
                    </div>
                  </div>
                  <div class="col-sm-6 col-md-3">
                    <div class="meta-item">
                      <span class="meta-label">Приоритет</span>
                      <span class="badge rounded-pill" :class="getPriorityClass(project.priority)">
                        {{ getPriorityText(project.priority) }}
                      </span>
                    </div>
                  </div>
                  <div class="col-sm-6 col-md-3">
                    <div class="meta-item">
                      <span class="meta-label">Дата начала</span>
                      <span class="meta-value">
                        <i class="fas fa-calendar-alt text-muted me-1"></i>
                        {{ formatDate(project.start_date) || 'Не указана' }}
                      </span>
                    </div>
                  </div>
                  <div class="col-sm-6 col-md-3">
                    <div class="meta-item">
                      <span class="meta-label">Дата окончания</span>
                      <span class="meta-value">
                        <i class="fas fa-calendar-check text-muted me-1"></i>
                        {{ formatDate(project.end_date) || 'Не указана' }}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
        
        <div class="col-lg-4">
          <div class="stats-card">
            <div class="card-header">
              <h5 class="mb-0"><i class="fas fa-chart-pie me-2"></i>Статистика проекта</h5>
            </div>
            <div class="card-body">
              <!-- Прогресс -->
              <div class="progress-section mb-4">
                <div class="d-flex justify-content-between align-items-center mb-2">
                  <span class="text-muted">Общий прогресс</span>
                  <span class="progress-percentage">{{ project.progress || 0 }}%</span>
                </div>
                <div class="progress progress-lg">
                  <div class="progress-bar progress-bar-striped progress-bar-animated" 
                       :style="{ width: (project.progress || 0) + '%' }"
                       :class="getProgressClass(project.progress || 0)">
                  </div>
                </div>
              </div>
              
              <!-- Задачи -->
              <div class="stats-items">
                <div class="stat-item">
                  <i class="fas fa-tasks text-primary"></i>
                  <div class="stat-content">
                    <div class="stat-value">{{ project.task_count || 0 }}</div>
                    <div class="stat-label">Всего задач</div>
                  </div>
                </div>
                <div class="stat-item">
                  <i class="fas fa-check-circle text-success"></i>
                  <div class="stat-content">
                    <div class="stat-value">{{ project.completed_task_count || 0 }}</div>
                    <div class="stat-label">Выполнено</div>
                  </div>
                </div>
                <div class="stat-item">
                  <i class="fas fa-clock text-warning"></i>
                  <div class="stat-content">
                    <div class="stat-value">{{ (project.task_count || 0) - (project.completed_task_count || 0) }}</div>
                    <div class="stat-label">В работе</div>
                  </div>
                </div>
              </div>
              
              <!-- Команда -->
              <div class="team-section mt-4" v-if="project.owner || project.manager">
                <h6 class="text-muted mb-3">Команда проекта</h6>
                <div class="team-members">
                  <div class="team-member" v-if="project.owner">
                    <img :src="getAvatarUrl(project.owner)" 
                         :alt="getUserDisplayName(project.owner)"
                         class="team-avatar">
                    <div class="team-info">
                      <div class="team-name">{{ getUserDisplayName(project.owner) }}</div>
                      <div class="team-role">Владелец</div>
                    </div>
                  </div>
                  <div class="team-member" v-if="project.manager">
                    <img :src="getAvatarUrl(project.manager)" 
                         :alt="getUserDisplayName(project.manager)"
                         class="team-avatar">
                    <div class="team-info">
                      <div class="team-name">{{ getUserDisplayName(project.manager) }}</div>
                      <div class="team-role">Менеджер</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Задачи проекта -->
      <div class="tasks-section">
        <div class="section-header">
          <h5 class="mb-0"><i class="fas fa-list-check me-2"></i>Задачи проекта</h5>
          <button class="btn btn-primary" @click="createTask">
            <i class="fas fa-plus me-2"></i>Добавить задачу
          </button>
        </div>
        
        <div class="tasks-content">
          <div v-if="tasks.length === 0" class="empty-state">
            <i class="fas fa-tasks fa-4x text-muted mb-3"></i>
            <h5 class="text-muted">В проекте пока нет задач</h5>
            <p class="text-muted mb-4">Создайте первую задачу для начала работы</p>
            <button class="btn btn-primary btn-lg rounded-pill" @click="createTask">
              <i class="fas fa-plus me-2"></i>Создать первую задачу
            </button>
          </div>
          
          <div v-else class="tasks-table-wrapper">
            <div class="table-responsive">
              <table class="table table-hover tasks-table mb-0">
                <thead>
                  <tr>
                    <th>Задача</th>
                    <th>Исполнитель</th>
                    <th>Статус</th>
                    <th>Приоритет</th>
                    <th>Срок</th>
                    <th>Действия</th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-for="task in tasks" :key="task.id" class="task-row">
                    <td class="task-cell-main">
                      <h6 class="task-title mb-1">{{ task.title }}</h6>
                      <p class="task-description mb-0" v-if="task.description">
                        {{ truncateText(task.description, 100) }}
                      </p>
                    </td>
                    <td>
                      <div class="assignee-info" v-if="task.assignee">
                        <img :src="getAvatarUrl(task.assignee)" 
                             :alt="getUserDisplayName(task.assignee)"
                             class="assignee-avatar">
                        <span class="assignee-name">{{ getUserDisplayName(task.assignee) }}</span>
                      </div>
                      <span v-else class="text-muted">Не назначен</span>
                    </td>
                    <td>
                      <span class="badge rounded-pill" :class="getTaskStatusClass(task.status)">
                        {{ getTaskStatusText(task.status) }}
                      </span>
                    </td>
                    <td>
                      <span class="badge rounded-pill" :class="getPriorityClass(task.priority)">
                        {{ getPriorityText(task.priority) }}
                      </span>
                    </td>
                    <td>
                      <span :class="getDueDateClass(task.due_date, task.status)">
                        <i class="fas fa-clock me-1"></i>{{ formatDate(task.due_date) || '-' }}
                      </span>
                    </td>
                    <td>
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
      </div>
    </div>

    <!-- Модальное окно редактирования проекта -->
    <div class="modal fade" id="projectModal" tabindex="-1" aria-labelledby="projectModalLabel" aria-hidden="true">
      <div class="modal-dialog">
        <div class="modal-content">
          <div class="modal-header">
            <h5 class="modal-title" id="projectModalLabel">Редактировать проект</h5>
            <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Закрыть"></button>
          </div>
          <div class="modal-body">
            <form @submit.prevent="submitProject">
              <div class="mb-3">
                <label class="form-label">Название проекта *</label>
                <input type="text" class="form-control" v-model="currentProject.name" required>
              </div>
              <div class="mb-3">
                <label class="form-label">Описание</label>
                <textarea class="form-control" rows="3" v-model="currentProject.description"></textarea>
              </div>
              <div class="row">
                <div class="col-md-6">
                  <div class="mb-3">
                    <label class="form-label">Дата начала</label>
                    <input type="date" class="form-control" v-model="currentProject.start_date">
                  </div>
                </div>
                <div class="col-md-6">
                  <div class="mb-3">
                    <label class="form-label">Дата окончания</label>
                    <input type="date" class="form-control" v-model="currentProject.end_date">
                  </div>
                </div>
              </div>
              <div class="row">
                <div class="col-md-6">
                  <div class="mb-3">
                    <label class="form-label">Статус</label>
                    <select class="form-select" v-model="currentProject.status">
                      <option value="planning">Планирование</option>
                      <option value="active">Активный</option>
                      <option value="on_hold">Приостановлен</option>
                      <option value="completed">Завершен</option>
                      <option value="cancelled">Отменен</option>
                    </select>
                  </div>
                </div>
                <div class="col-md-6">
                  <div class="mb-3">
                    <label class="form-label">Приоритет</label>
                    <select class="form-select" v-model="currentProject.priority">
                      <option value="low">Низкий</option>
                      <option value="medium">Средний</option>
                      <option value="high">Высокий</option>
                      <option value="urgent">Срочный</option>
                    </select>
                  </div>
                </div>
              </div>
              <div class="mb-3">
                <label class="form-label">Цвет проекта</label>
                <input type="color" class="form-control form-control-color" v-model="currentProject.color">
              </div>
            </form>
          </div>
          <div class="modal-footer">
            <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Отменить</button>
            <button type="button" class="btn btn-danger" @click="confirmDeleteProject">
              Удалить проект
            </button>
            <button type="button" class="btn btn-primary" @click="submitProject" :disabled="!currentProject.name">
              Сохранить
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- Модальное окно создания/редактирования задачи -->
    <div class="modal fade" id="taskModal" tabindex="-1" aria-labelledby="taskModalLabel" aria-hidden="true">
      <div class="modal-dialog modal-lg">
        <div class="modal-content">
          <div class="modal-header">
            <h5 class="modal-title" id="taskModalLabel">
              {{ isEditingTask ? 'Редактировать задачу' : 'Создать задачу' }}
            </h5>
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
                    <label class="form-label">Исполнитель</label>
                    <select class="form-select" v-model="currentTask.assignee_id">
                      <option value="">Не назначен</option>
                      <option v-for="user in users" :key="user.id" :value="user.id">
                        {{ getUserDisplayName(user) }}
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
                    <label class="form-label">Статус</label>
                    <select class="form-select" v-model="currentTask.status">
                      <option value="todo">К выполнению</option>
                      <option value="in_progress">В работе</option>
                      <option value="review">На проверке</option>
                      <option value="done">Выполнено</option>
                      <option value="cancelled">Отменено</option>
                    </select>
                  </div>
                </div>
                <div class="col-md-6">
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
              </div>
              
              <div class="row">
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
            <button type="button" class="btn btn-danger" v-if="isEditingTask" @click="confirmDeleteTask(currentTask)">
              Удалить задачу
            </button>
            <button type="button" class="btn btn-primary" @click="submitTask" :disabled="!currentTask.title">
              {{ isEditingTask ? 'Сохранить' : 'Создать задачу' }}
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

export default {
  name: 'ProjectDetail',
  setup() {
    const { showSuccess, showError, showConfirmDialog, closeConfirmDialog } = useNotifications()
    return { showSuccess, showError, showConfirmDialog, closeConfirmDialog }
  },
  data() {
    return {
      loading: false,
      error: null,
      project: null,
      tasks: [],
      users: [],
      currentTask: {
        title: '',
        description: '',
        assignee_id: '',
        status: 'todo',
        priority: 'medium',
        start_date: '',
        due_date: '',
        estimated_hours: null
      },
      currentProject: {
        name: '',
        description: '',
        start_date: '',
        end_date: '',
        status: 'planning',
        priority: 'medium',
        color: '#007bff'
      },
      isEditingTask: false,
      isEditingProject: false
    }
  },
  async mounted() {
    await this.loadUsers()
    this.loadProjectData()
  },
  watch: {
    '$route'() {
      this.loadProjectData()
    }
  },
  methods: {
    async loadProjectData() {
      const projectId = this.$route.params.id
      if (!projectId) {
        this.error = 'ID проекта не указан'
        return
      }

      this.loading = true
      this.error = null

      try {
        // Загружаем данные проекта
        const response = await projectManagementApi.getProject(projectId)
        this.project = response.data

        // Загружаем задачи проекта
        const tasksResponse = await projectManagementApi.getProjectTasks(projectId)
        this.tasks = Array.isArray(tasksResponse.data) ? tasksResponse.data : []
        
        // Обновляем прогресс проекта
        this.updateProjectProgress()
      } catch (error) {
        console.error('Ошибка загрузки проекта:', error)
        this.error = 'Ошибка загрузки данных проекта'
      } finally {
        this.loading = false
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

    editProject() {
      if (!this.project) return
      
      this.isEditingProject = true
      this.currentProject = {
        id: this.project.id,
        name: this.project.name,
        description: this.project.description,
        start_date: this.project.start_date || '',
        end_date: this.project.end_date || '',
        status: this.project.status,
        priority: this.project.priority,
        color: this.project.color
      }
      
      const modal = new Modal(document.getElementById('projectModal'))
      modal.show()
    },

    createTask() {
      if (!this.project) return
      
      this.isEditingTask = false
      this.currentTask = {
        title: '',
        description: '',
        project_id: this.project.id,
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
      this.isEditingTask = true
      this.currentTask = {
        id: task.id,
        title: task.title,
        description: task.description,
        project_id: task.project?.id || this.project.id,
        assignee_id: task.assignee?.id || '',
        status: task.status,
        priority: task.priority,
        start_date: task.start_date ? this.formatDateTimeLocal(new Date(task.start_date)) : '',
        due_date: task.due_date ? this.formatDateTimeLocal(new Date(task.due_date)) : '',
        estimated_hours: task.estimated_hours
      }
      
      const modal = new Modal(document.getElementById('taskModal'))
      modal.show()
    },

    async submitProject() {
      try {
        // Подготавливаем данные проекта
        const projectData = {
          ...this.currentProject,
          // Конвертируем пустые строки в null для дат
          start_date: this.currentProject.start_date || null,
          end_date: this.currentProject.end_date || null
        }
        
        await projectManagementApi.updateProject(projectData.id, projectData)
        
        // Закрываем модальное окно
        const modal = Modal.getInstance(document.getElementById('projectModal'))
        if (modal) {
          modal.hide()
        }
        
        // Перезагружаем данные проекта
        await this.loadProjectData()
        
        this.showSuccess('Проект успешно обновлен!')
      } catch (error) {
        console.error('Ошибка обновления проекта:', error)
        
        let errorMessage = 'Ошибка обновления проекта'
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
        
        if (this.isEditingTask) {
          await projectManagementApi.updateTask(taskData.id, taskData)
        } else {
          await projectManagementApi.createTask(taskData)
        }
        
        // Закрываем модальное окно
        const modal = Modal.getInstance(document.getElementById('taskModal'))
        if (modal) modal.hide()
        
        // Перезагружаем данные проекта
        await this.loadProjectData()
        
        this.showSuccess(this.isEditingTask ? 'Задача обновлена' : 'Задача создана')
      } catch (error) {
        console.error('Ошибка сохранения задачи:', error)
        
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

    async confirmDeleteProject() {
      const confirmed = await this.showConfirmDialog({
        title: 'Удаление проекта',
        message: `Вы уверены, что хотите удалить проект "${this.project.name}"? Это действие необратимо.`,
        confirmText: 'Удалить',
        cancelText: 'Отмена',
        variant: 'danger'
      })
      
      if (confirmed) {
        try {
          await projectManagementApi.deleteProject(this.project.id)
          this.closeConfirmDialog()
          this.showSuccess('Проект успешно удален!')
          // Переходим к списку проектов
          this.$router.push('/crm/project-management/projects')
        } catch (error) {
          console.error('Ошибка удаления проекта:', error)
          this.closeConfirmDialog()
          this.showError('Ошибка удаления проекта')
        }
      }
    },

    async confirmDeleteTask(task) {
      const confirmed = await this.showConfirmDialog({
        title: 'Удаление задачи',
        message: `Вы уверены, что хотите удалить задачу "${task.title}"?`,
        confirmText: 'Удалить',
        cancelText: 'Отмена',
        variant: 'danger'
      })
      
      if (confirmed) {
        try {
          await projectManagementApi.deleteTask(task.id)
          this.closeConfirmDialog()
          await this.loadProjectData()
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
        'planning': 'bg-secondary',
        'active': 'bg-success',
        'on_hold': 'bg-warning',
        'completed': 'bg-primary',
        'cancelled': 'bg-danger'
      }
      return classes[status] || 'bg-secondary'
    },

    getStatusText(status) {
      const texts = {
        'planning': 'Планирование',
        'active': 'Активный',
        'on_hold': 'Приостановлен',
        'completed': 'Завершен',
        'cancelled': 'Отменен'
      }
      return texts[status] || status
    },

    getTaskStatusClass(status) {
      const classes = {
        'todo': 'bg-secondary',
        'in_progress': 'bg-warning',
        'review': 'bg-info',
        'done': 'bg-success',
        'cancelled': 'bg-danger'
      }
      return classes[status] || 'bg-secondary'
    },

    getTaskStatusText(status) {
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
        'high': 'bg-warning',
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

    getProgressClass(progress) {
      if (progress >= 80) return 'bg-success'
      if (progress >= 50) return 'bg-warning'
      return 'bg-danger'
    },

    formatDate(date) {
      if (!date) return ''
      return new Date(date).toLocaleDateString('ru-RU')
    },

    formatDateTimeLocal(date) {
      if (!date) return ''
      return new Date(date).toISOString().slice(0, 16)
    },

    getUserDisplayName(user) {
      if (!user) return 'Неизвестно'
      return user.full_name || `${user.first_name} ${user.last_name}`.trim() || user.username
    },

    getAvatarUrl(user) {
      if (!user) return ''
      const name = this.getUserDisplayName(user)
      return user.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=6c757d&color=fff&size=32`
    },

    updateProjectProgress() {
      if (!this.project || !this.tasks.length) return
      
      const totalTasks = this.tasks.length
      const completedTasks = this.tasks.filter(task => task.status === 'done').length
      const progress = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0
      
      // Обновляем локальные данные проекта
      this.project.task_count = totalTasks
      this.project.completed_task_count = completedTasks
      this.project.progress = progress
    },

    truncateText(text, maxLength) {
      if (text.length > maxLength) {
        return text.slice(0, maxLength) + '...'
      }
      return text
    },

    getDueDateClass(dueDate, status) {
      if (!dueDate) return ''
      const date = new Date(dueDate)
      const today = new Date()
      const diffInDays = Math.ceil((date - today) / (1000 * 60 * 60 * 24))

      if (diffInDays < 0) {
        return 'text-danger'
      } else if (diffInDays === 0 && status === 'todo') {
        return 'text-warning'
      } else if (diffInDays <= 7 && status === 'in_progress') {
        return 'text-primary'
      } else {
        return ''
      }
    }
  }
}
</script>

<style scoped>
.project-detail {
  padding: 20px;
}

.pm-page-header {
  margin-bottom: 20px;
}

.breadcrumb {
  background-color: transparent;
  padding: 0;
}

.breadcrumb-item {
  font-size: 14px;
}

.breadcrumb-item.active {
  font-weight: 600;
}

.project-info-card {
  border: 1px solid #e9ecef;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
}

.project-description {
  margin-bottom: 20px;
}

.project-meta {
  display: flex;
  flex-wrap: wrap;
}

.meta-item {
  width: 50%;
}

.meta-label {
  font-weight: 600;
}

.meta-value {
  margin-left: 10px;
}

.stats-card {
  border: 1px solid #e9ecef;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
}

.progress-section {
  margin-bottom: 20px;
}

.progress-percentage {
  font-weight: 600;
}

.stats-items {
  margin-bottom: 20px;
}

.stat-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 10px;
}

.team-section {
  margin-top: 20px;
}

.team-members {
  display: flex;
  flex-wrap: wrap;
}

.team-member {
  width: 50%;
  margin-bottom: 10px;
}

.team-avatar {
  width: 32px;
  height: 32px;
  object-fit: cover;
  border-radius: 50%;
  margin-right: 10px;
}

.team-info {
  display: flex;
  flex-direction: column;
}

.team-name {
  font-weight: 600;
}

.team-role {
  font-size: 0.8em;
  color: #6c757d;
}

.tasks-section {
  margin-top: 20px;
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 10px;
}

.tasks-content {
  border: 1px solid #e9ecef;
  border-radius: 8px;
  padding: 20px;
}

.empty-state {
  text-align: center;
  padding: 40px;
}

.tasks-table-wrapper {
  overflow-x: auto;
}

.tasks-table {
  width: 100%;
}

.task-row {
  cursor: pointer;
}

.task-cell-main {
  width: 100%;
}

.task-title {
  font-weight: 600;
}

.task-description {
  margin-bottom: 0;
}

.assignee-info {
  display: flex;
  align-items: center;
}

.assignee-avatar {
  width: 32px;
  height: 32px;
  object-fit: cover;
  border-radius: 50%;
  margin-right: 10px;
}

.assignee-name {
  font-weight: 600;
}

.btn-group-sm > .btn {
  padding: 0.25rem 0.5rem;
  font-size: 0.875rem;
}
</style> 