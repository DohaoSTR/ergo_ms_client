<template>
  <div class="project-view">
    <div v-if="loading" class="text-center py-5">
      <div class="spinner-border text-primary" role="status">
        <span class="visually-hidden">Загрузка...</span>
      </div>
    </div>

    <div v-else-if="error" class="alert alert-danger">
      <h5>Ошибка</h5>
      <p>{{ error }}</p>
      <router-link to="/crm/project-management" class="btn btn-primary">
        Вернуться к списку проектов
      </router-link>
    </div>

    <div v-else-if="project">
      <nav class="mb-4">
        <ol class="breadcrumb">
          <li class="breadcrumb-item">
            <router-link to="/crm/project-management">Управление проектами</router-link>
          </li>
          <li class="breadcrumb-item active">{{ project.name }}</li>
        </ol>
      </nav>

      <div class="row">
        <div class="col-md-8">
          <div class="card">
            <div class="card-body">
              <h1>{{ project.name }}</h1>
              <p v-if="project.description">{{ project.description }}</p>
              
              <div class="row">
                <div class="col-md-6">
                  <strong>Статус:</strong> {{ project.status }}
                </div>
                <div class="col-md-6">
                  <strong>Приоритет:</strong> {{ project.priority }}
                </div>
              </div>
            </div>
          </div>
        </div>
        
        <div class="col-md-4">
          <div class="card">
            <div class="card-body">
              <h5>Действия</h5>
              <div class="d-grid gap-2">
                <button class="btn btn-primary" @click="createTask">
                  Создать задачу
                </button>
                <router-link to="/crm/project-management" class="btn btn-outline-secondary">
                  Вернуться к списку
                </router-link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import projectManagementApi from '@/modules/crm/project-management/js/projectManagementApi.js'

export default {
  name: 'ProjectView',
  props: {
    projectId: {
      type: [String, Number],
      required: false
    }
  },
  data() {
    return {
      project: null,
      loading: false,
      error: null
    }
  },
  
  computed: {
    currentProjectId() {
      return this.projectId || this.$route.query.project
    }
  },
  
  async mounted() {
    await this.loadProject()
  },

  watch: {
    currentProjectId: {
      handler(newId, oldId) {
        if (newId && newId !== oldId) {
          this.loadProject()
        }
      },
      immediate: false
    }
  },
  
  methods: {
    async loadProject() {
      try {
        this.loading = true
        this.error = null
        
        if (!this.currentProjectId) {
          this.error = 'Не указан ID проекта'
          return
        }
        
        const response = await projectManagementApi.getProject(this.currentProjectId)
        this.project = response.data
      } catch (error) {
        console.error('Ошибка загрузки проекта:', error)
        this.error = error.response?.status === 404 ? 'Проект не найден' : 'Ошибка загрузки проекта'
      } finally {
        this.loading = false
      }
    },
    
    createTask() {
      this.$router.push({
        path: '/crm/project-management',
        query: { tab: 'tasks', create: 'task', project: this.currentProjectId }
      })
    }
  }
}
</script>

<style scoped>
.project-view {
  padding: 20px;
}
</style> 