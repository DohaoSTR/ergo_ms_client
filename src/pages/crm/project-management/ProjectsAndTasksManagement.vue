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
      </ul>
    </div>

    <!-- Содержимое вкладок -->
    <div class="tab-content" id="managementTabContent">
      <!-- Вкладка проектов -->
      <div class="tab-pane fade show active" id="projects" role="tabpanel" aria-labelledby="projects-tab">
        <div class="projects-management-section">
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
    </div>
  </div>
</template>

<script>
import ProjectsList from './ProjectsList.vue'
import TasksList from './TasksList.vue'

export default {
  name: 'ProjectsAndTasksManagement',
  components: {
    ProjectsList,
    TasksList
  },
  data() {
    return {
      activeTab: 'projects'
    }
  },
  methods: {
    createProject() {
      if (this.$refs.projectsComponent) {
        this.$refs.projectsComponent.createProject()
      }
    },
    
    createTask() {
      if (this.$refs.tasksComponent) {
        this.$refs.tasksComponent.createTask()
      }
    },
    
    refreshData() {
      if (this.activeTab === 'projects' && this.$refs.projectsComponent) {
        this.$refs.projectsComponent.loadProjects()
      } else if (this.activeTab === 'tasks' && this.$refs.tasksComponent) {
        this.$refs.tasksComponent.loadTasks()
      }
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
.tasks-management-section {
  h5 {
    color: var(--bs-heading-color);
    font-weight: $font-weight-bold;
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