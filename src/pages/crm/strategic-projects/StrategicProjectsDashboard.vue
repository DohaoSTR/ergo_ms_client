<template>
  <div class="strategic-projects-dashboard">
    <div class="container-fluid">
      <!-- Заголовок страницы -->
      <div class="row mb-4">
        <div class="col-12">
          <h1 class="h3 mb-3">Управление стратегическими проектами</h1>
          <nav aria-label="breadcrumb">
            <ol class="breadcrumb">
              <li class="breadcrumb-item"><router-link to="/">Главная</router-link></li>
              <li class="breadcrumb-item"><router-link to="/crm">CRM</router-link></li>
              <li class="breadcrumb-item active">Стратегические проекты</li>
            </ol>
          </nav>
        </div>
      </div>

      <!-- Статистические карточки -->
      <div class="row mb-4">
        <div class="col-xl-3 col-md-6 mb-3">
          <div class="card border-left-primary h-100 py-2">
            <div class="card-body">
              <div class="row no-gutters align-items-center">
                <div class="col mr-2">
                  <div class="text-xs font-weight-bold text-primary text-uppercase mb-1">
                    Всего проектов
                  </div>
                  <div class="h5 mb-0 font-weight-bold text-gray-800">{{ statistics.total }}</div>
                </div>
                <div class="col-auto">
                  <i class="fas fa-project-diagram fa-2x text-gray-300"></i>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div class="col-xl-3 col-md-6 mb-3">
          <div class="card border-left-warning h-100 py-2">
            <div class="card-body">
              <div class="row no-gutters align-items-center">
                <div class="col mr-2">
                  <div class="text-xs font-weight-bold text-warning text-uppercase mb-1">
                    На утверждении
                  </div>
                  <div class="h5 mb-0 font-weight-bold text-gray-800">{{ statistics.onApproval }}</div>
                </div>
                <div class="col-auto">
                  <i class="fas fa-clock fa-2x text-gray-300"></i>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div class="col-xl-3 col-md-6 mb-3">
          <div class="card border-left-success h-100 py-2">
            <div class="card-body">
              <div class="row no-gutters align-items-center">
                <div class="col mr-2">
                  <div class="text-xs font-weight-bold text-success text-uppercase mb-1">
                    В работе
                  </div>
                  <div class="h5 mb-0 font-weight-bold text-gray-800">{{ statistics.inProgress }}</div>
                </div>
                <div class="col-auto">
                  <i class="fas fa-spinner fa-2x text-gray-300"></i>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div class="col-xl-3 col-md-6 mb-3">
          <div class="card border-left-info h-100 py-2">
            <div class="card-body">
              <div class="row no-gutters align-items-center">
                <div class="col mr-2">
                  <div class="text-xs font-weight-bold text-info text-uppercase mb-1">
                    Завершено
                  </div>
                  <div class="h5 mb-0 font-weight-bold text-gray-800">{{ statistics.completed }}</div>
                </div>
                <div class="col-auto">
                  <i class="fas fa-check-circle fa-2x text-gray-300"></i>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Быстрые действия -->
      <div class="row mb-4" v-if="userPermissions.canCreateProject || userPermissions.canImportProgram">
        <div class="col-12">
          <div class="card">
            <div class="card-header">
              <h5 class="card-title mb-0">Быстрые действия</h5>
            </div>
            <div class="card-body">
              <div class="btn-group" role="group">
                <router-link
                  v-if="userPermissions.canCreateProject"
                  to="/crm/strategic-projects/program-topics"
                  class="btn btn-primary"
                >
                  <i class="fas fa-plus mr-2"></i>
                  Создать проект
                </router-link>
                <router-link
                  v-if="userPermissions.canImportProgram"
                  to="/crm/strategic-projects/import-program"
                  class="btn btn-secondary"
                >
                  <i class="fas fa-file-import mr-2"></i>
                  Импорт программы развития
                </router-link>
                <router-link
                  to="/crm/strategic-projects/my-projects"
                  class="btn btn-outline-primary"
                >
                  <i class="fas fa-user mr-2"></i>
                  Мои проекты
                </router-link>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Список проектов для экспертной группы -->
      <div class="row mb-4" v-if="userPermissions.isExpertGroup && projectsForApproval.length > 0">
        <div class="col-12">
          <div class="card">
            <div class="card-header bg-warning text-white">
              <h5 class="card-title mb-0">
                <i class="fas fa-exclamation-triangle mr-2"></i>
                Проекты на утверждении
              </h5>
            </div>
            <div class="card-body">
              <div class="table-responsive">
                <table class="table table-hover">
                  <thead>
                    <tr>
                      <th>Код проекта</th>
                      <th>Название</th>
                      <th>Руководитель</th>
                      <th>Дата подачи</th>
                      <th>Действия</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr v-for="project in projectsForApproval" :key="project.id">
                      <td>{{ project.code }}</td>
                      <td>{{ project.name }}</td>
                      <td>{{ project.leader_name }}</td>
                      <td>{{ formatDate(project.created_at) }}</td>
                      <td>
                        <router-link
                          :to="`/crm/strategic-projects/${project.id}`"
                          class="btn btn-sm btn-primary"
                        >
                          <i class="fas fa-eye"></i>
                          Рассмотреть
                        </router-link>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Мои проекты -->
      <div class="row">
        <div class="col-12">
          <div class="card">
            <div class="card-header">
              <h5 class="card-title mb-0">Мои проекты</h5>
            </div>
            <div class="card-body">
              <div class="table-responsive">
                <table class="table table-hover">
                  <thead>
                    <tr>
                      <th>Код проекта</th>
                      <th>Название</th>
                      <th>Статус</th>
                      <th>Прогресс</th>
                      <th>Сроки</th>
                      <th>Действия</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr v-for="project in myProjects" :key="project.id">
                      <td>{{ project.code }}</td>
                      <td>{{ project.name }}</td>
                      <td>
                        <span :class="getStatusBadgeClass(project.status)">
                          {{ getStatusLabel(project.status) }}
                        </span>
                      </td>
                      <td>
                        <div class="progress">
                          <div
                            class="progress-bar"
                            :style="{ width: project.completion_percentage + '%' }"
                          >
                            {{ project.completion_percentage }}%
                          </div>
                        </div>
                      </td>
                      <td>
                        {{ formatDate(project.planned_start_date) }} - 
                        {{ formatDate(project.planned_end_date) }}
                      </td>
                      <td>
                        <router-link
                          :to="`/crm/strategic-projects/${project.id}`"
                          class="btn btn-sm btn-primary"
                        >
                          <i class="fas fa-edit"></i>
                          Открыть
                        </router-link>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
              
              <div v-if="myProjects.length === 0" class="text-center py-4">
                <p class="text-muted">У вас пока нет проектов</p>
                <router-link
                  v-if="userPermissions.canCreateProject"
                  to="/crm/strategic-projects/program-topics"
                  class="btn btn-primary"
                >
                  <i class="fas fa-plus mr-2"></i>
                  Создать первый проект
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
import { ref, onMounted, computed } from 'vue'
import { useUserStore } from '@/stores/userStore'
import { format } from 'date-fns'
import { ru } from 'date-fns/locale'
import { apiClient } from '@/js/api/manager'

export default {
  name: 'StrategicProjectsDashboard',
  
  setup() {
    const userStore = useUserStore()
    const statistics = ref({
      total: 0,
      onApproval: 0,
      inProgress: 0,
      completed: 0
    })
    const myProjects = ref([])
    const projectsForApproval = ref([])
    const loading = ref(false)
    
    // Вычисляемые права пользователя
    const userPermissions = computed(() => {
      const user = userStore.user
      // Временно даем все права авторизованным пользователям
      // TODO: Реализовать систему ролей
      const isAuthenticated = userStore.isAuthenticated
      
      return {
        canCreateProject: isAuthenticated,
        canImportProgram: isAuthenticated,
        isExpertGroup: isAuthenticated
      }
    })
    
    // Загрузка статистики
    const loadStatistics = async () => {
      try {
        const response = await apiClient.get('/crm/strategic-projects/strategic-projects/')
        const projects = response.data
        
        statistics.value = {
          total: projects.length,
          onApproval: projects.filter(p => p.status === 'on_approval').length,
          inProgress: projects.filter(p => p.status === 'in_progress').length,
          completed: projects.filter(p => p.status === 'completed').length
        }
      } catch (error) {
        console.error('Ошибка загрузки статистики:', error)
      }
    }
    
    // Загрузка моих проектов
    const loadMyProjects = async () => {
      try {
        const response = await apiClient.get('/crm/strategic-projects/strategic-projects/', {
          my_projects: true
        })
        myProjects.value = response.data
      } catch (error) {
        console.error('Ошибка загрузки проектов:', error)
      }
    }
    
    // Загрузка проектов на утверждении
    const loadProjectsForApproval = async () => {
      if (!userPermissions.value.isExpertGroup) return
      
      try {
        const response = await apiClient.get('/crm/strategic-projects/strategic-projects/', {
          for_approval: true
        })
        projectsForApproval.value = response.data
      } catch (error) {
        console.error('Ошибка загрузки проектов на утверждении:', error)
      }
    }
    
    // Форматирование даты
    const formatDate = (dateString) => {
      if (!dateString) return '-'
      return format(new Date(dateString), 'dd.MM.yyyy', { locale: ru })
    }
    
    // Получение класса для статуса
    const getStatusBadgeClass = (status) => {
      const classes = {
        draft: 'badge badge-secondary',
        on_approval: 'badge badge-warning',
        rejected: 'badge badge-danger',
        approved: 'badge badge-info',
        in_progress: 'badge badge-primary',
        completed: 'badge badge-success',
        archived: 'badge badge-dark'
      }
      return classes[status] || 'badge badge-secondary'
    }
    
    // Получение метки статуса
    const getStatusLabel = (status) => {
      const labels = {
        draft: 'Черновик',
        on_approval: 'На утверждении',
        rejected: 'Отклонен',
        approved: 'Утвержден',
        in_progress: 'В работе',
        completed: 'Завершен',
        archived: 'Архив'
      }
      return labels[status] || status
    }
    
    // Загрузка данных при монтировании
    onMounted(async () => {
      loading.value = true
      await Promise.all([
        loadStatistics(),
        loadMyProjects(),
        loadProjectsForApproval()
      ])
      loading.value = false
    })
    
    return {
      statistics,
      myProjects,
      projectsForApproval,
      userPermissions,
      loading,
      formatDate,
      getStatusBadgeClass,
      getStatusLabel
    }
  }
}
</script>

<style scoped>
.strategic-projects-dashboard {
  padding: 20px 0;
}

.border-left-primary {
  border-left: 4px solid #007bff;
}

.border-left-warning {
  border-left: 4px solid #ffc107;
}

.border-left-success {
  border-left: 4px solid #28a745;
}

.border-left-info {
  border-left: 4px solid #17a2b8;
}

.progress {
  height: 20px;
}

.progress-bar {
  font-size: 12px;
  line-height: 20px;
}
</style>
