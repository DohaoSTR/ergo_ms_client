<template>
  <div class="project-dashboard">
    <div class="pm-page-header d-flex justify-content-between align-items-center">
      <h2><i class="fas fa-project-diagram me-2"></i>Управление проектами</h2>
      <button class="btn btn-primary" @click="createProject">
        <i class="fas fa-plus me-2"></i>Создать проект
      </button>
    </div>

    <!-- Статистика -->
    <div class="row g-3 mb-4">
      <div class="col-sm-6 col-md-3">
        <div class="pm-stats-card bg-primary text-white">
          <div class="card-body">
            <div class="d-flex justify-content-between align-items-start">
              <div>
                <h6 class="text-white-50">Всего проектов</h6>
                <h3>{{ statistics.totalProjects }}</h3>
              </div>
              <i class="fas fa-project-diagram fa-3x stats-icon"></i>
            </div>
          </div>
        </div>
      </div>
      <div class="col-sm-6 col-md-3">
        <div class="pm-stats-card bg-success text-white">
          <div class="card-body">
            <div class="d-flex justify-content-between align-items-start">
              <div>
                <h6 class="text-white-50">Активных проектов</h6>
                <h3>{{ statistics.activeProjects }}</h3>
              </div>
              <i class="fas fa-play-circle fa-3x stats-icon"></i>
            </div>
          </div>
        </div>
      </div>
      <div class="col-sm-6 col-md-3">
        <div class="pm-stats-card bg-warning text-white">
          <div class="card-body">
            <div class="d-flex justify-content-between align-items-start">
              <div>
                <h6 class="text-white-50">Мои задачи</h6>
                <h3>{{ statistics.myTasks }}</h3>
              </div>
              <i class="fas fa-tasks fa-3x stats-icon"></i>
            </div>
          </div>
        </div>
      </div>
      <div class="col-sm-6 col-md-3">
        <div class="pm-stats-card bg-danger text-white">
          <div class="card-body">
            <div class="d-flex justify-content-between align-items-start">
              <div>
                <h6 class="text-white-50">Просроченные</h6>
                <h3>{{ statistics.overdueTasks }}</h3>
              </div>
              <i class="fas fa-exclamation-triangle fa-3x stats-icon"></i>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Быстрые действия -->
    <div class="row mb-4">
      <div class="col-12">
        <div class="card shadow-sm border-0">
          <div class="card-header bg-transparent border-bottom">
            <h5 class="mb-0"><i class="fas fa-rocket me-2"></i>Быстрые действия</h5>
          </div>
          <div class="card-body p-4">
            <div class="row g-3">
              <div class="col-sm-6 col-md-3">
                <router-link to="/crm/project-management/calendar" class="btn btn-outline-primary w-100 py-3 rounded-3">
                  <i class="fas fa-calendar-alt d-block mb-2 fs-4"></i>
                  <span>Календарь задач</span>
                </router-link>
              </div>
              <div class="col-sm-6 col-md-3">
                <router-link to="/crm/project-management/kanban" class="btn btn-outline-success w-100 py-3 rounded-3">
                  <i class="fas fa-columns d-block mb-2 fs-4"></i>
                  <span>Канбан доска</span>
                </router-link>
              </div>
              <div class="col-sm-6 col-md-3">
                <router-link to="/crm/project-management/projects" class="btn btn-outline-info w-100 py-3 rounded-3">
                  <i class="fas fa-folder-open d-block mb-2 fs-4"></i>
                  <span>Мои проекты</span>
                </router-link>
              </div>
              <div class="col-sm-6 col-md-3">
                <router-link to="/crm/project-management/tasks" class="btn btn-outline-warning w-100 py-3 rounded-3">
                  <i class="fas fa-list-check d-block mb-2 fs-4"></i>
                  <span>Мои задачи</span>
                </router-link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Последние проекты -->
    <div class="row g-4">
      <div class="col-lg-8">
        <div class="card shadow-sm border-0 h-100">
          <div class="card-header bg-transparent border-bottom d-flex justify-content-between align-items-center">
            <h5 class="mb-0"><i class="fas fa-folder me-2"></i>Мои проекты</h5>
            <router-link to="/crm/project-management/projects" class="btn btn-sm btn-outline-primary rounded-pill">
              Все проекты <i class="fas fa-arrow-right ms-1"></i>
            </router-link>
          </div>
          <div class="card-body p-4">
            <div v-if="loading" class="text-center py-5">
              <div class="spinner-border text-primary" role="status">
                <span class="visually-hidden">Загрузка...</span>
              </div>
            </div>
            <div v-else-if="projects.length === 0" class="text-center py-5">
              <i class="fas fa-folder-open fa-4x text-muted mb-3"></i>
              <p class="text-muted mb-3">У вас пока нет проектов</p>
              <button class="btn btn-primary rounded-pill" @click="createProject">
                <i class="fas fa-plus me-2"></i>Создать первый проект
              </button>
            </div>
            <div v-else>
              <div class="row g-3">
                <div class="col-md-6" v-for="project in projects" :key="project?.id || Math.random()">
                  <div class="project-card h-100" v-if="project">
                    <div class="project-card-header">
                      <div class="d-flex justify-content-between align-items-start">
                        <h6 class="mb-0 text-truncate">{{ project.name || 'Без названия' }}</h6>
                        <span class="badge rounded-pill" :class="getStatusClass(project.status)">
                          {{ getStatusText(project.status) }}
                        </span>
                      </div>
                    </div>
                    <div class="project-card-body">
                      <p class="text-muted small mb-3">{{ project.description || 'Нет описания' }}</p>
                      
                      <div class="mb-3">
                        <div class="d-flex justify-content-between align-items-center mb-1">
                          <small class="text-muted">Прогресс</small>
                          <small class="text-primary fw-bold">{{ project.progress || 0 }}%</small>
                        </div>
                        <div class="pm-progress">
                          <div class="progress-bar" 
                               :style="{ width: (project.progress || 0) + '%' }"
                               :class="getProgressClass(project.progress || 0)">
                          </div>
                        </div>
                      </div>
                      
                      <div class="d-flex justify-content-between align-items-center">
                        <div class="project-stats">
                          <span class="badge bg-light text-dark me-2">
                            <i class="fas fa-tasks me-1"></i>{{ project.task_count || 0 }}
                          </span>
                          <span class="badge bg-light text-success">
                            <i class="fas fa-check-circle me-1"></i>{{ project.completed_task_count || 0 }}
                          </span>
                        </div>
                        <div class="btn-group btn-group-sm">
                          <button class="btn btn-light" @click="editProject(project)" title="Редактировать">
                            <i class="fas fa-edit"></i>
                          </button>
                          <router-link :to="`/crm/project-management/project/${project.id}`" 
                                       class="btn btn-light" title="Открыть">
                            <i class="fas fa-arrow-right"></i>
                          </router-link>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      <!-- Недавние задачи -->
      <div class="col-lg-4">
        <div class="card shadow-sm border-0 h-100">
          <div class="card-header bg-transparent border-bottom d-flex justify-content-between align-items-center">
            <h5 class="mb-0"><i class="fas fa-list-check me-2"></i>Мои задачи</h5>
            <router-link to="/crm/project-management/tasks" class="btn btn-sm btn-outline-primary rounded-pill">
              Все <i class="fas fa-arrow-right ms-1"></i>
            </router-link>
          </div>
          <div class="card-body p-4">
            <div v-if="tasks.length === 0" class="text-center py-4">
              <i class="fas fa-check-circle fa-3x text-success mb-3"></i>
              <p class="text-muted">Нет активных задач</p>
            </div>
            <div v-else>
              <div class="task-list">
                <div class="task-item" v-for="task in tasks" :key="task?.id || Math.random()">
                  <div v-if="task">
                    <div class="d-flex justify-content-between align-items-start mb-2">
                      <h6 class="mb-0 task-title">{{ task.title || 'Без названия' }}</h6>
                      <span class="badge rounded-pill ms-2" :class="getPriorityClass(task.priority)">
                        {{ getPriorityText(task.priority) }}
                      </span>
                    </div>
                    <p class="text-muted small mb-2">
                      <i class="fas fa-folder me-1"></i>{{ task.project?.name || 'Без проекта' }}
                    </p>
                    <div class="d-flex align-items-center">
                      <small class="text-muted">
                        <i class="fas fa-clock me-1"></i>{{ formatDate(task.due_date) }}
                      </small>
                      <router-link :to="`/crm/project-management/task/${task.id}`" 
                                   class="btn btn-sm btn-link ms-auto">
                        Подробнее <i class="fas fa-arrow-right"></i>
                      </router-link>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Модальное окно создания/редактирования проекта -->
    <div class="modal fade" id="projectModal" tabindex="-1" aria-labelledby="projectModalLabel" aria-hidden="true">
      <div class="modal-dialog modal-lg">
        <div class="modal-content border-0">
          <div class="modal-header border-bottom">
            <h5 class="modal-title" id="projectModalLabel">
              <i class="fas fa-folder me-2"></i>
              {{ isEditingProject ? 'Редактировать проект' : 'Создать новый проект' }}
            </h5>
            <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Закрыть"></button>
          </div>
          <div class="modal-body p-4">
            <form @submit.prevent="submitProject">
              <div class="mb-4">
                <label class="form-label fw-bold">Название проекта <span class="text-danger">*</span></label>
                <input type="text" class="form-control" v-model="currentProject.name" required ref="projectNameInput" 
                       placeholder="Введите название проекта">
              </div>
              <div class="mb-4">
                <label class="form-label fw-bold">Описание</label>
                <textarea class="form-control" rows="3" v-model="currentProject.description" 
                          placeholder="Опишите цели и задачи проекта"></textarea>
              </div>
              <div class="row g-3 mb-4">
                <div class="col-md-6">
                  <label class="form-label fw-bold">Дата начала</label>
                  <input type="date" class="form-control" v-model="currentProject.start_date">
                </div>
                <div class="col-md-6">
                  <label class="form-label fw-bold">Дата окончания</label>
                  <input type="date" class="form-control" v-model="currentProject.end_date">
                </div>
              </div>
              <div class="row g-3 mb-4">
                <div class="col-md-6">
                  <label class="form-label fw-bold">Статус</label>
                  <select class="form-select" v-model="currentProject.status">
                    <option value="planning">Планирование</option>
                    <option value="active">Активный</option>
                    <option value="on_hold">Приостановлен</option>
                    <option value="completed">Завершен</option>
                    <option value="cancelled">Отменен</option>
                  </select>
                </div>
                <div class="col-md-6">
                  <label class="form-label fw-bold">Приоритет</label>
                  <select class="form-select" v-model="currentProject.priority">
                    <option value="low">Низкий</option>
                    <option value="medium">Средний</option>
                    <option value="high">Высокий</option>
                    <option value="urgent">Срочный</option>
                  </select>
                </div>
              </div>
              <div class="mb-4">
                <label class="form-label fw-bold">Цвет проекта</label>
                <div class="d-flex align-items-center gap-2">
                  <input type="color" class="form-control form-control-color" v-model="currentProject.color">
                  <span class="text-muted">Выберите цвет для визуального выделения</span>
                </div>
              </div>
            </form>
          </div>
          <div class="modal-footer border-top">
            <button type="button" class="btn btn-light" data-bs-dismiss="modal">Отменить</button>
            <button type="button" class="btn btn-danger" v-if="isEditingProject" @click="confirmDeleteProject">
              <i class="fas fa-trash me-2"></i>Удалить
            </button>
            <button type="button" class="btn btn-primary" @click="submitProject" :disabled="!currentProject.name">
              <i class="fas fa-save me-2"></i>{{ isEditingProject ? 'Сохранить' : 'Создать' }}
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
  name: 'ProjectDashboard',
  data() {
    return {
      loading: false,
      projects: [],
      tasks: [],
      statistics: {
        totalProjects: 0,
        activeProjects: 0,
        myTasks: 0,
        overdueTasks: 0
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
      isEditingProject: false
    }
  },
  mounted() {
    this.loadData()
  },
  methods: {
    async loadData() {
      this.loading = true
      try {
        // Загружаем мои проекты
        const projectsResponse = await projectManagementApi.getProjects({ my_projects: true, page_size: 6 })
        this.projects = Array.isArray(projectsResponse.data.results) ? projectsResponse.data.results : 
                        Array.isArray(projectsResponse.data) ? projectsResponse.data : []
        
        // Загружаем мои задачи
        const tasksResponse = await projectManagementApi.getTasks({ my_tasks: true, page_size: 5 })
        this.tasks = Array.isArray(tasksResponse.data.results) ? tasksResponse.data.results : 
                     Array.isArray(tasksResponse.data) ? tasksResponse.data : []
        
        // Обновляем статистику
        this.updateStatistics()
      } catch (error) {
        console.error('Ошибка загрузки данных:', error)
        // Устанавливаем пустые массивы при ошибке
        this.projects = []
        this.tasks = []
        this.updateStatistics()
      } finally {
        this.loading = false
      }
    },
    
    updateStatistics() {
      this.statistics.totalProjects = this.projects.length
      this.statistics.activeProjects = this.projects.filter(p => p.status === 'active').length
      this.statistics.myTasks = this.tasks.length
      this.statistics.overdueTasks = this.tasks.filter(t => 
        t.due_date && new Date(t.due_date) < new Date() && t.status !== 'done'
      ).length
    },
    
    createProject() {
      this.isEditingProject = false
      this.currentProject = {
        name: '',
        description: '',
        start_date: '',
        end_date: '',
        status: 'planning',
        priority: 'medium',
        color: '#007bff'
      }
      
      const modalElement = document.getElementById('projectModal')
      const modal = new Modal(modalElement)
      
      // Обработчик для правильного фокуса
      modalElement.addEventListener('shown.bs.modal', () => {
        if (this.$refs.projectNameInput) {
          this.$refs.projectNameInput.focus()
        }
      }, { once: true })
      
      modal.show()
    },

    editProject(project) {
      this.isEditingProject = true
      this.currentProject = {
        id: project.id,
        name: project.name,
        description: project.description,
        start_date: project.start_date || '',
        end_date: project.end_date || '',
        status: project.status,
        priority: project.priority,
        color: project.color
      }
      
      const modalElement = document.getElementById('projectModal')
      const modal = new Modal(modalElement)
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
        
        if (this.isEditingProject) {
          await projectManagementApi.updateProject(projectData.id, projectData)
        } else {
          await projectManagementApi.createProject(projectData)
        }
        
        // Закрываем модальное окно
        const modal = Modal.getInstance(document.getElementById('projectModal'))
        if (modal) {
          modal.hide()
        }
        
        // Перезагружаем данные
        this.loadData()
        
        // Показываем уведомление об успехе
        alert(this.isEditingProject ? 'Проект успешно обновлен!' : 'Проект успешно создан!')
      } catch (error) {
        console.error('Ошибка сохранения проекта:', error)
        console.error('Детали ошибки:', error.response?.data)
        
        // Показываем детали ошибки
        let errorMessage = this.isEditingProject ? 'Ошибка обновления проекта' : 'Ошибка создания проекта'
        
        if (error.response?.data) {
          // Если есть детали валидации
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
        } else if (error.response?.statusText) {
          errorMessage += ': ' + error.response.statusText
        } else if (error.message) {
          errorMessage += ': ' + error.message
        }
        
        alert(errorMessage)
      }
    },

    async confirmDeleteProject() {
      if (confirm(`Вы уверены, что хотите удалить проект "${this.currentProject.name}"? Это действие необратимо.`)) {
        try {
          await projectManagementApi.deleteProject(this.currentProject.id)
          
          // Закрываем модальное окно
          const modal = Modal.getInstance(document.getElementById('projectModal'))
          if (modal) {
            modal.hide()
          }
          
          // Перезагружаем данные
          this.loadData()
          
          alert('Проект успешно удален!')
        } catch (error) {
          console.error('Ошибка удаления проекта:', error)
          alert('Ошибка удаления проекта')
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
    
    getProgressClass(progress) {
      if (progress >= 80) return 'bg-success'
      if (progress >= 50) return 'bg-warning'
      return 'bg-danger'
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
    
    formatDate(date) {
      if (!date) return ''
      return new Date(date).toLocaleDateString('ru-RU')
    }
  }
}
</script>

<style scoped lang="scss">
@import './project-management.scss';

.project-dashboard {
  padding: 20px;
  min-height: 100vh;
  background: var(--bs-gray-100);
}

.project-card {
  @include pm-card;
  padding: 0;
  overflow: hidden;
  cursor: pointer;
  
  &-header {
    padding: 1rem 1.25rem;
    background: var(--bs-light);
    border-bottom: 1px solid var(--bs-border-color);
  }
  
  &-body {
    padding: 1.25rem;
  }
  
  .task-title {
    font-size: $font-size-usual;
    color: var(--bs-heading-color);
  }
  
  .project-stats {
    display: flex;
    align-items: center;
    gap: 0.5rem;
  }
}

.task-list {
  .task-item {
    padding: 1rem 0;
    border-bottom: 1px solid var(--bs-border-color);
    transition: all $pm-transition;
    
    &:last-child {
      border-bottom: none;
      padding-bottom: 0;
    }
    
    &:hover {
      background: var(--bs-gray-100);
      margin: 0 -1rem;
      padding-left: 1rem;
      padding-right: 1rem;
      border-radius: $radius-small;
    }
  }
  
  .task-title {
    font-size: $font-size-small;
    font-weight: $font-weight-bold;
    color: var(--bs-heading-color);
  }
}

.badge {
  @include pm-badge;
}

.btn {
  @include pm-button;
}

.btn-link {
  text-decoration: none;
  color: var(--bs-primary);
  font-size: $font-size-small;
  
  &:hover {
    transform: none;
    box-shadow: none;
    color: var(--bs-primary-dark);
  }
}

.rounded-pill {
  border-radius: 2rem !important;
}

.rounded-3 {
  border-radius: $radius-usual !important;
}

// Модальное окно
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

.form-control-color {
  width: 50px;
  height: 38px;
  cursor: pointer;
}

// Адаптивность
@media (max-width: 768px) {
  .project-dashboard {
    padding: 1rem;
  }
  
  .pm-page-header {
    flex-direction: column;
    gap: 1rem;
    text-align: center;
    
    h2 {
      font-size: $font-size-h2;
    }
  }
  
  .pm-stats-card {
    h3 {
      font-size: 1.5rem;
    }
  }
}
</style> 