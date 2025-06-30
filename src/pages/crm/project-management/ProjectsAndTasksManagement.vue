<template>
  <div class="projects-tasks-management">
    <div class="pm-page-header">
      <h2><i class="fas fa-cogs me-2"></i>Управление проектами и задачами</h2>
    </div>

    <!-- Вкладки -->
    <div class="management-tabs">
      <ul class="nav nav-tabs" id="managementTabs" role="tablist">
        <li class="nav-item" role="presentation">
          <button class="nav-link active" id="projects-tab" data-bs-toggle="tab" 
                  data-bs-target="#projects" type="button" role="tab" aria-controls="projects" 
                  aria-selected="true" @click="activeTab = 'projects'">
            <i class="fas fa-folder-open me-2"></i>Проекты
          </button>
        </li>
        <li class="nav-item" role="presentation">
          <button class="nav-link" id="tasks-tab" data-bs-toggle="tab" 
                  data-bs-target="#tasks" type="button" role="tab" aria-controls="tasks" 
                  aria-selected="false" @click="activeTab = 'tasks'">
            <i class="fas fa-tasks me-2"></i>Задачи
          </button>
        </li>
        <li class="nav-item" role="presentation">
          <button class="nav-link" id="statuses-tab" data-bs-toggle="tab" 
                  data-bs-target="#statuses" type="button" role="tab" aria-controls="statuses" 
                  aria-selected="false" @click="activeTab = 'statuses'">
            <i class="fas fa-flag me-2"></i>Статусы
          </button>
        </li>
        <li class="nav-item" role="presentation">
          <button class="nav-link" id="priorities-tab" data-bs-toggle="tab" 
                  data-bs-target="#priorities" type="button" role="tab" aria-controls="priorities" 
                  aria-selected="false" @click="activeTab = 'priorities'">
            <i class="fas fa-exclamation-triangle me-2"></i>Приоритеты
          </button>
        </li>
      </ul>
    </div>

    <!-- Содержимое вкладок -->
    <div class="tab-content" id="managementTabContent">
      <!-- Вкладка проектов -->
      <div class="tab-pane fade show active" id="projects" role="tabpanel" aria-labelledby="projects-tab">
        <!-- Просмотр отдельного проекта -->
        <div v-if="viewMode === 'project-view'" class="project-view-section">
          <div class="d-flex justify-content-between align-items-center mb-4">
            <div class="d-flex align-items-center">
              <button class="btn btn-outline-secondary me-3" @click="backToProjectsList">
                <i class="fas fa-arrow-left me-2"></i>К списку проектов
              </button>
              <h5 class="mb-0">Просмотр проекта</h5>
            </div>
          </div>
          
          <ProjectView :key="selectedProjectId" :project-id="selectedProjectId" />
        </div>

        <!-- Управление проектами (список) -->
        <div v-else class="projects-management-section">
          <div class="d-flex justify-content-between align-items-center mb-4">
            <h5 class="mb-0">Управление проектами</h5>
            <button class="btn btn-primary" @click="createProject">
              <i class="fas fa-plus me-2"></i>Создать проект
            </button>
          </div>
          
          <!-- Встроенное управление проектами -->
          <ProjectsList 
            ref="projectsComponent"
            :management-mode="true"
            @refresh="refreshData" 
          />
        </div>
      </div>

      <!-- Вкладка задач -->
      <div class="tab-pane fade" id="tasks" role="tabpanel" aria-labelledby="tasks-tab">
        <div class="tasks-management-section">
          <div class="d-flex justify-content-between align-items-center mb-4">
            <h5 class="mb-0">Управление задачами</h5>
            <button class="btn btn-primary" @click="createTask">
              <i class="fas fa-plus me-2"></i>Создать задачу
            </button>
          </div>
          
                     <!-- Встроенное управление задачами -->
           <TasksList 
             ref="tasksComponent"
             :management-mode="true"
             @refresh="refreshData" 
           />
        </div>
      </div>

      <!-- Вкладка статусов -->
      <div class="tab-pane fade" id="statuses" role="tabpanel" aria-labelledby="statuses-tab">
        <div class="statuses-management-section">
          <!-- Подвкладки для статусов проектов и задач -->
          <ul class="nav nav-pills mb-4" id="statusesSubTabs" role="tablist">
            <li class="nav-item" role="presentation">
              <button class="nav-link active" id="project-statuses-tab" data-bs-toggle="pill" 
                      data-bs-target="#project-statuses" type="button" role="tab" 
                      aria-controls="project-statuses" aria-selected="true">
                <i class="fas fa-folder-open me-2"></i>Статусы проектов
              </button>
            </li>
            <li class="nav-item" role="presentation">
              <button class="nav-link" id="task-statuses-tab" data-bs-toggle="pill" 
                      data-bs-target="#task-statuses" type="button" role="tab" 
                      aria-controls="task-statuses" aria-selected="false">
                <i class="fas fa-tasks me-2"></i>Статусы задач
              </button>
            </li>
          </ul>

          <div class="tab-content" id="statusesSubTabContent">
            <div class="tab-pane fade show active" id="project-statuses" role="tabpanel" aria-labelledby="project-statuses-tab">
              <ProjectStatusManagement @statusChanged="onProjectStatusChanged" />
            </div>
            <div class="tab-pane fade" id="task-statuses" role="tabpanel" aria-labelledby="task-statuses-tab">
              <TaskStatusManagement @statusChanged="onTaskStatusChanged" />
            </div>
          </div>
        </div>
      </div>

      <!-- Вкладка приоритетов -->
      <div class="tab-pane fade" id="priorities" role="tabpanel" aria-labelledby="priorities-tab">
        <div class="priorities-management-section">
          <!-- Подвкладки для приоритетов проектов и задач -->
          <ul class="nav nav-pills mb-4" id="prioritiesSubTabs" role="tablist">
            <li class="nav-item" role="presentation">
              <button class="nav-link active" id="project-priorities-tab" data-bs-toggle="pill" 
                      data-bs-target="#project-priorities" type="button" role="tab" 
                      aria-controls="project-priorities" aria-selected="true">
                <i class="fas fa-folder-open me-2"></i>Приоритеты проектов
              </button>
            </li>
            <li class="nav-item" role="presentation">
              <button class="nav-link" id="task-priorities-tab" data-bs-toggle="pill" 
                      data-bs-target="#task-priorities" type="button" role="tab" 
                      aria-controls="task-priorities" aria-selected="false">
                <i class="fas fa-tasks me-2"></i>Приоритеты задач
              </button>
            </li>
          </ul>

          <div class="tab-content" id="prioritiesSubTabContent">
            <div class="tab-pane fade show active" id="project-priorities" role="tabpanel" aria-labelledby="project-priorities-tab">
              <ProjectPriorityManagement @priorityChanged="onProjectPriorityChanged" />
            </div>
            <div class="tab-pane fade" id="task-priorities" role="tabpanel" aria-labelledby="task-priorities-tab">
              <TaskPriorityManagement @priorityChanged="onTaskPriorityChanged" />
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import ProjectsList from './ProjectsList.vue'
import TasksList from './TasksList.vue'
import ProjectView from './ProjectView.vue'
import ProjectStatusManagement from './ProjectStatusManagement.vue'
import ProjectPriorityManagement from './ProjectPriorityManagement.vue'
import TaskStatusManagement from './TaskStatusManagement.vue'
import TaskPriorityManagement from './TaskPriorityManagement.vue'

export default {
  name: 'ProjectsAndTasksManagement',
  components: {
    ProjectsList,
    TasksList,
    ProjectView,
    ProjectStatusManagement,
    ProjectPriorityManagement,
    TaskStatusManagement,
    TaskPriorityManagement
  },
  data() {
    return {
      activeTab: 'projects',
      viewMode: 'list', // 'list' или 'project-view'
      selectedProjectId: null
    }
  },
  
  mounted() {
    // Проверяем URL параметры при загрузке
    this.handleRouteParams()
  },

  watch: {
    // Отслеживаем смену вкладок
    activeTab(newTab, oldTab) {
      if (newTab === 'projects' || newTab === 'tasks') {
        // Обновляем статусы и приоритеты при возврате к проектам/задачам
        this.$nextTick(() => {
          this.refreshComponentData(newTab)
        })
      }
    },

    // Отслеживаем изменения маршрута
    '$route'() {
      this.handleRouteParams()
    }
  },
  methods: {
    async createProject() {
      if (this.$refs.projectsComponent) {
        await this.$refs.projectsComponent.createProject()
      }
    },
    
    async createTask() {
      if (this.$refs.tasksComponent) {
        await this.$refs.tasksComponent.createTask()
      }
    },
    
    refreshData() {
      if (this.activeTab === 'projects' && this.$refs.projectsComponent) {
        this.$refs.projectsComponent.loadProjects()
      } else if (this.activeTab === 'tasks' && this.$refs.tasksComponent) {
        this.$refs.tasksComponent.loadTasks()
      }
    },

    async refreshComponentData(tab) {
      // Обновляем статусы и приоритеты в соответствующих компонентах
      if (tab === 'projects' && this.$refs.projectsComponent) {
        await this.$refs.projectsComponent.refreshStatusesAndPriorities()
      } else if (tab === 'tasks' && this.$refs.tasksComponent) {
        await this.$refs.tasksComponent.refreshStatusesAndPriorities()
      }
    },

    // Метод для обновления всех данных (вызывается из дочерних компонентов)
    async refreshAllData() {
      // Обновляем статусы и приоритеты во всех компонентах
      if (this.$refs.projectsComponent) {
        await this.$refs.projectsComponent.refreshStatusesAndPriorities()
      }
      if (this.$refs.tasksComponent) {
        await this.$refs.tasksComponent.refreshStatusesAndPriorities()
      }
    },

    // Обработчики событий от компонентов управления статусами и приоритетами
    async onProjectStatusChanged() {
      console.log('Статус проекта изменен, обновляем данные...')
      if (this.$refs.projectsComponent) {
        await this.$refs.projectsComponent.refreshStatusesAndPriorities()
      }
    },

    async onProjectPriorityChanged() {
      console.log('Приоритет проекта изменен, обновляем данные...')
      if (this.$refs.projectsComponent) {
        await this.$refs.projectsComponent.refreshStatusesAndPriorities()
      }
    },

    async onTaskStatusChanged() {
      console.log('Статус задачи изменен, обновляем данные...')
      if (this.$refs.tasksComponent) {
        await this.$refs.tasksComponent.refreshStatusesAndPriorities()
      }
    },

    async onTaskPriorityChanged() {
      console.log('Приоритет задачи изменен, обновляем данные...')
      if (this.$refs.tasksComponent) {
        await this.$refs.tasksComponent.refreshStatusesAndPriorities()
      }
    },

    // Обработка URL параметров
    handleRouteParams() {
      const query = this.$route.query
      
      // Проверяем, есть ли параметр для просмотра отдельного проекта
      if (query.project && query.view === 'project') {
        this.selectedProjectId = query.project
        this.viewMode = 'project-view'
        this.activeTab = 'projects'
      } else {
        this.viewMode = 'list'
        this.selectedProjectId = null
      }
      
      // Устанавливаем активную вкладку из URL
      if (query.tab) {
        this.activeTab = query.tab
      }
    },

    // Возврат к списку проектов
    backToProjectsList() {
      this.viewMode = 'list'
      this.selectedProjectId = null
      this.$router.push({ 
        path: '/crm/project-management',
        query: { tab: 'projects' }
      })
    }
  }
}
</script>

<style scoped lang="scss">
@import './project-management.scss';

.projects-tasks-management {
  padding: 20px;
  min-height: 100vh;
  background: var(--bs-gray-100);
}

.management-tabs {
  background: white;
  border-radius: $radius-usual $radius-usual 0 0;
  overflow: hidden;
  margin-bottom: 0;
  
  .nav-tabs {
    border-bottom: none;
    margin-bottom: 0;
    
    .nav-link {
      border: none;
      background: transparent;
      color: var(--bs-secondary-color);
      padding: 1rem 2rem;
      font-weight: $font-weight-bold;
      border-radius: 0;
      
      &:hover {
        border-color: transparent;
        color: var(--bs-primary);
        background: var(--bs-light);
      }
      
      &.active {
        color: var(--bs-primary);
        background: var(--bs-light);
        border-color: transparent;
        border-bottom: 3px solid var(--bs-primary);
      }
    }
  }
}

.tab-content {
  background: white;
  border-radius: 0 0 $radius-usual $radius-usual;
  box-shadow: $pm-card-shadow;
  
  .tab-pane {
    padding: 2rem;
  }
}

.projects-management-section,
.tasks-management-section,
.statuses-management-section,
.priorities-management-section {
  h5 {
    color: var(--bs-heading-color);
    font-weight: $font-weight-bold;
  }
}

// Стили для подвкладок
.nav-pills {
  .nav-link {
    border-radius: $radius-usual;
    margin-right: 0.5rem;
    color: var(--bs-secondary-color);
    background: transparent;
    border: 1px solid var(--bs-border-color);
    
    &:hover {
      color: var(--bs-primary);
      background: var(--bs-light);
    }
    
    &.active {
      color: white;
      background: var(--bs-primary);
      border-color: var(--bs-primary);
    }
  }
}

.btn {
  @include pm-button;
}

// Адаптивность
@media (max-width: 768px) {
  .projects-tasks-management {
    padding: 1rem;
  }
  
  .management-tabs .nav-tabs .nav-link {
    padding: 0.75rem 1rem;
    font-size: $font-size-small;
  }
  
  .tab-content .tab-pane {
    padding: 1rem;
  }
}
</style> 