<template>
  <div class="strategic-projects-dashboard">
    <div class="container-fluid">
      <!-- Верхний блок с заголовком и кнопками -->
      <div class="row mb-4">
        <div class="col-lg-8">
          <h1 class="dashboard-title">
            <i class="fas fa-project-diagram mr-3"></i>
            Стратегические проекты
          </h1>
          <p class="dashboard-subtitle">Управление инициативными и инновационными проектами университета</p>
        </div>
        <div class="col-lg-4 text-right">
          <div class="header-actions">
            <NotificationCenter />
            <button 
              v-if="canCreateProject"
              @click="openNewProjectModal" 
              class="btn btn-gradient btn-lg"
            >
              <i class="fas fa-plus mr-2"></i>
              Новый проект
            </button>
          </div>
        </div>
      </div>

      <!-- Статистические карточки с анимацией -->
      <div class="row mb-4">
        <div class="col-xl-3 col-md-6 mb-4">
          <div class="statistics-card card-primary">
            <div class="card-content">
              <div class="card-icon">
                <i class="fas fa-layer-group"></i>
              </div>
              <div class="card-info">
                <h6 class="card-subtitle">Всего проектов</h6>
                <h3 class="card-value">{{ statistics.total }}</h3>
                <div class="card-progress">
                  <div class="progress">
                    <div class="progress-bar bg-primary" style="width: 100%"></div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div class="col-xl-3 col-md-6 mb-4">
          <div class="statistics-card card-warning">
            <div class="card-content">
              <div class="card-icon">
                <i class="fas fa-hourglass-half"></i>
              </div>
              <div class="card-info">
                <h6 class="card-subtitle">На утверждении</h6>
                <h3 class="card-value">{{ statistics.onApproval }}</h3>
                <div class="card-progress">
                  <div class="progress">
                    <div class="progress-bar bg-warning" :style="`width: ${getPercentage(statistics.onApproval)}%`"></div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div class="col-xl-3 col-md-6 mb-4">
          <div class="statistics-card card-success">
            <div class="card-content">
              <div class="card-icon">
                <i class="fas fa-cogs"></i>
              </div>
              <div class="card-info">
                <h6 class="card-subtitle">В работе</h6>
                <h3 class="card-value">{{ statistics.inProgress }}</h3>
                <div class="card-progress">
                  <div class="progress">
                    <div class="progress-bar bg-success" :style="`width: ${getPercentage(statistics.inProgress)}%`"></div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div class="col-xl-3 col-md-6 mb-4">
          <div class="statistics-card card-info">
            <div class="card-content">
              <div class="card-icon">
                <i class="fas fa-trophy"></i>
              </div>
              <div class="card-info">
                <h6 class="card-subtitle">Завершено</h6>
                <h3 class="card-value">{{ statistics.completed }}</h3>
                <div class="card-progress">
                  <div class="progress">
                    <div class="progress-bar bg-info" :style="`width: ${getPercentage(statistics.completed)}%`"></div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Быстрые действия с красивым дизайном -->
      <div class="row mb-4">
        <div class="col-12">
          <div class="quick-actions-section">
            <h5 class="section-title mb-4">
              <i class="fas fa-bolt mr-2"></i>
              Быстрые действия
            </h5>
            <div class="row">
              <div class="col-lg-3 col-md-6 mb-3" v-if="userPermissions.canCreateProject">
                <div class="action-card action-card-primary">
                  <router-link to="/crm/strategic-projects/program-topics" class="action-link">
                    <div class="action-icon">
                      <i class="fas fa-plus-circle"></i>
                    </div>
                    <h6 class="action-title">Создать из темы</h6>
                    <p class="action-description">Выберите тему из программы развития</p>
                  </router-link>
                </div>
              </div>
              
              <div class="col-lg-3 col-md-6 mb-3" v-if="userPermissions.canCreateProject">
                <div class="action-card action-card-secondary">
                  <router-link to="/crm/strategic-projects/project/create" class="action-link">
                    <div class="action-icon">
                      <i class="fas fa-file-plus"></i>
                    </div>
                    <h6 class="action-title">Новый проект</h6>
                    <p class="action-description">Создать проект с нуля</p>
                  </router-link>
                </div>
              </div>
              
              <div class="col-lg-3 col-md-6 mb-3" v-if="userPermissions.canImportProgram">
                <div class="action-card action-card-success">
                  <router-link to="/crm/strategic-projects/import-program" class="action-link">
                    <div class="action-icon">
                      <i class="fas fa-file-import"></i>
                    </div>
                    <h6 class="action-title">Импорт программы</h6>
                    <p class="action-description">Загрузите программу развития из CSV</p>
                  </router-link>
                </div>
              </div>
              
              <div class="col-lg-3 col-md-6 mb-3">
                <div class="action-card action-card-info">
                  <router-link to="/crm/strategic-projects/my-projects" class="action-link">
                    <div class="action-icon">
                      <i class="fas fa-briefcase"></i>
                    </div>
                    <h6 class="action-title">Мои проекты</h6>
                    <p class="action-description">Просмотр и управление проектами</p>
                  </router-link>
                </div>
              </div>
              
              <div class="col-lg-3 col-md-6 mb-3" v-if="userPermissions.canViewWorkload">
                <div class="action-card action-card-warning">
                  <router-link to="/crm/strategic-projects/workload" class="action-link">
                    <div class="action-icon">
                      <i class="fas fa-chart-pie"></i>
                    </div>
                    <h6 class="action-title">Занятость сотрудников</h6>
                    <p class="action-description">Анализ загруженности команды</p>
                  </router-link>
                </div>
              </div>
            </div>
            
            <!-- Дополнительные быстрые действия -->
            <div class="row mt-3">
              <div class="col-lg-3 col-md-6 mb-3">
                <div class="action-card action-card-dark">
                  <router-link to="/crm/strategic-projects/archive" class="action-link">
                    <div class="action-icon">
                      <i class="fas fa-archive"></i>
                    </div>
                    <h6 class="action-title">Архив проектов</h6>
                    <p class="action-description">Завершенные и отмененные проекты</p>
                  </router-link>
                </div>
              </div>
              
              <div class="col-lg-3 col-md-6 mb-3">
                <div class="action-card action-card-teal">
                  <router-link to="/crm/strategic-projects/reports" class="action-link">
                    <div class="action-icon">
                      <i class="fas fa-chart-bar"></i>
                    </div>
                    <h6 class="action-title">Отчеты и аналитика</h6>
                    <p class="action-description">Сводные отчеты по проектам</p>
                  </router-link>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Список проектов для экспертной группы -->
      <div class="row mb-4" v-if="userPermissions.isExpertGroup && projectsForApproval.length > 0">
        <div class="col-12">
          <div class="approval-section">
            <div class="section-header-warning">
              <h5 class="section-title">
                <i class="fas fa-gavel mr-2"></i>
                Проекты на утверждении
                <span class="badge badge-warning ml-2">{{ projectsForApproval.length }}</span>
              </h5>
            </div>
            <div class="approval-list">
              <div 
                v-for="project in projectsForApproval" 
                :key="project.id"
                class="approval-item"
              >
                <div class="approval-item-content">
                  <div class="approval-main">
                    <div class="approval-icon">
                      <i class="fas fa-file-signature"></i>
                    </div>
                    <div class="approval-info">
                      <h6 class="approval-title">{{ project.name }}</h6>
                      <div class="approval-meta">
                        <span class="meta-item">
                          <i class="fas fa-fingerprint mr-1"></i>
                          {{ project.code }}
                        </span>
                        <span class="meta-item">
                          <i class="fas fa-user mr-1"></i>
                          {{ project.leader_name }}
                        </span>
                        <span class="meta-item">
                          <i class="fas fa-calendar mr-1"></i>
                          {{ formatDate(project.created_at) }}
                        </span>
                      </div>
                    </div>
                  </div>
                  <div class="approval-actions">
                    <router-link
                      :to="`/crm/strategic-projects/project/${project.id}`"
                      class="btn btn-warning btn-icon-split"
                    >
                      <span class="icon">
                        <i class="fas fa-search"></i>
                      </span>
                      <span class="text">Рассмотреть</span>
                    </router-link>
                  </div>
                </div>
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
                          :to="`/crm/strategic-projects/project/${project.id}`"
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
import { useUserStore } from '@/modules/cms/js/userStore'
import { format } from 'date-fns'
import { ru } from 'date-fns/locale'
import { apiClient } from '@/js/api/manager'
import NotificationCenter from '@/components/crm/strategic-projects/NotificationCenter.vue'

export default {
  name: 'StrategicProjectsDashboard',
  
  components: {
    NotificationCenter
  },
  
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
    const userRole = ref(null)
    
    // Роли пользователя
    const userRoleLabel = computed(() => {
      const roleLabels = {
        'admin': 'Администратор СтрПр',
        'curator_sp': 'Куратор СтрПр',
        'expert_group': 'Экспертная группа',
        'expert_lead': 'Руководитель ЭГ',
        'project_lead': 'Руководитель проекта',
        'customer': 'Заказчик проекта'
      }
      return roleLabels[userRole.value] || 'Пользователь'
    })
    
    // Вычисляемые права пользователя
    const userPermissions = computed(() => {
      const isAuthenticated = userStore.isAuthenticated
      const isAdmin = userRole.value === 'admin'
      const isCurator = userRole.value === 'curator_sp'
      const isExpert = userRole.value === 'expert_group' || userRole.value === 'expert_lead'
      
      return {
        canCreateProject: isAuthenticated,
        canImportProgram: isAdmin || isCurator,
        isExpertGroup: isExpert,
        canViewWorkload: isAdmin || isCurator,
        canManageRoles: isAdmin
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
          params: { my_projects: true }
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
          params: { for_approval: true }
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
    
    // Получение процента для прогресс-бара
    const getPercentage = (value) => {
      if (statistics.value.total === 0) return 0
      return Math.round((value / statistics.value.total) * 100)
    }
    
    // Загрузка роли пользователя
    const loadUserRole = async () => {
      try {
        const response = await apiClient.get('/crm/strategic-projects/user-roles/my_role/')
        if (response.data && response.data.role) {
          userRole.value = response.data.role
        } else {
          // Если роль не назначена, проверяем - может пользователь может создавать проекты
          userRole.value = 'project_lead'
        }
      } catch (error) {
        console.error('Ошибка загрузки роли пользователя:', error)
        // По умолчанию устанавливаем роль руководителя проекта
        userRole.value = 'project_lead'
      }
    }
    
    // Загрузка данных при монтировании
    onMounted(async () => {
      loading.value = true
      await Promise.all([
        loadUserRole(),
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
      userRole,
      userRoleLabel,
      loading,
      formatDate,
      getStatusBadgeClass,
      getStatusLabel,
      getPercentage
    }
  }
}
</script>

<style scoped>
.strategic-projects-dashboard {
  padding: 20px 0;
  background-color: #f8f9fc;
  min-height: 100vh;
}

/* Заголовок страницы с градиентом */
.page-header-gradient {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  padding: 2rem;
  border-radius: 15px;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.1);
}

.page-title {
  font-size: 2rem;
  font-weight: 700;
  margin: 0;
}

.breadcrumb-transparent {
  background-color: transparent;
  padding: 0;
  margin: 0;
}

.breadcrumb-transparent .breadcrumb-item a {
  color: rgba(255, 255, 255, 0.8);
  text-decoration: none;
}

.breadcrumb-transparent .breadcrumb-item.active {
  color: white;
}

.user-role-badge {
  background: rgba(255,255,255,0.2);
  color: white;
  padding: 0.5rem 1rem;
  border-radius: 8px;
  font-size: 0.9rem;
  display: inline-flex;
  align-items: center;
  border: 1px solid rgba(255,255,255,0.3);
}

/* Header actions */
.header-actions {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 1rem;
}

.dashboard-title {
  font-size: 2rem;
  font-weight: 700;
  color: #1f2937;
  margin-bottom: 0.5rem;
}

.dashboard-subtitle {
  font-size: 1.1rem;
  color: #6b7280;
  margin: 0;
}

.btn-gradient {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border: none;
  color: white;
  padding: 0.75rem 1.5rem;
  border-radius: 12px;
  font-weight: 600;
  transition: all 0.3s ease;
  box-shadow: 0 4px 12px rgba(102,126,234,0.3);
}

.btn-gradient:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 20px rgba(102,126,234,0.4);
  color: white;
}

/* Статистические карточки */
.statistics-card {
  background: white;
  border-radius: 15px;
  padding: 1.5rem;
  box-shadow: 0 5px 20px rgba(0, 0, 0, 0.08);
  transition: all 0.3s ease;
  position: relative;
  overflow: hidden;
}

.statistics-card:hover {
  transform: translateY(-5px);
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.15);
}

.statistics-card::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 5px;
}

.statistics-card.card-primary::before {
  background: linear-gradient(90deg, #007bff 0%, #0056b3 100%);
}

.statistics-card.card-warning::before {
  background: linear-gradient(90deg, #ffc107 0%, #e0a800 100%);
}

.statistics-card.card-success::before {
  background: linear-gradient(90deg, #28a745 0%, #1e7e34 100%);
}

.statistics-card.card-info::before {
  background: linear-gradient(90deg, #17a2b8 0%, #117a8b 100%);
}

.card-content {
  display: flex;
  align-items: center;
  gap: 1.5rem;
}

.card-icon {
  width: 60px;
  height: 60px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.5rem;
  color: white;
}

.card-primary .card-icon {
  background: linear-gradient(135deg, #007bff 0%, #0056b3 100%);
}

.card-warning .card-icon {
  background: linear-gradient(135deg, #ffc107 0%, #e0a800 100%);
}

.card-success .card-icon {
  background: linear-gradient(135deg, #28a745 0%, #1e7e34 100%);
}

.card-info .card-icon {
  background: linear-gradient(135deg, #17a2b8 0%, #117a8b 100%);
}

.card-info {
  flex: 1;
}

.card-subtitle {
  color: #6c757d;
  font-size: 0.875rem;
  font-weight: 500;
  margin-bottom: 0.5rem;
}

.card-value {
  font-size: 2rem;
  font-weight: 700;
  margin: 0;
  color: #2d3436;
}

.card-progress {
  margin-top: 0.5rem;
}

.card-progress .progress {
  height: 5px;
  background-color: #e9ecef;
  border-radius: 5px;
}

/* Быстрые действия */
.quick-actions-section {
  background: white;
  border-radius: 15px;
  padding: 2rem;
  box-shadow: 0 5px 20px rgba(0, 0, 0, 0.08);
}

.section-title {
  font-size: 1.25rem;
  font-weight: 600;
  color: #2d3436;
  margin: 0;
}

.action-card {
  background: white;
  border-radius: 12px;
  padding: 1.5rem;
  text-align: center;
  transition: all 0.3s ease;
  border: 2px solid transparent;
  height: 100%;
}

.action-card:hover {
  transform: translateY(-5px);
}

.action-card-primary:hover {
  border-color: #007bff;
  box-shadow: 0 10px 30px rgba(0, 123, 255, 0.2);
}

.action-card-secondary:hover {
  border-color: #6c757d;
  box-shadow: 0 10px 30px rgba(108, 117, 125, 0.2);
}

.action-card-success:hover {
  border-color: #28a745;
  box-shadow: 0 10px 30px rgba(40, 167, 69, 0.2);
}

.action-card-info:hover {
  border-color: #17a2b8;
  box-shadow: 0 10px 30px rgba(23, 162, 184, 0.2);
}

.action-card-warning:hover {
  border-color: #ffc107;
  box-shadow: 0 10px 30px rgba(255, 193, 7, 0.2);
}

.action-card-dark:hover {
  border-color: #343a40;
  box-shadow: 0 10px 30px rgba(52, 58, 64, 0.2);
}

.action-card-purple:hover {
  border-color: #6f42c1;
  box-shadow: 0 10px 30px rgba(111, 66, 193, 0.2);
}

.action-card-teal:hover {
  border-color: #20c997;
  box-shadow: 0 10px 30px rgba(32, 201, 151, 0.2);
}

.action-card-orange:hover {
  border-color: #fd7e14;
  box-shadow: 0 10px 30px rgba(253, 126, 20, 0.2);
}

.action-link {
  text-decoration: none;
  color: inherit;
}

.action-icon {
  width: 60px;
  height: 60px;
  margin: 0 auto 1rem;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.5rem;
}

.action-card-primary .action-icon {
  background: rgba(0, 123, 255, 0.1);
  color: #007bff;
}

.action-card-secondary .action-icon {
  background: rgba(108, 117, 125, 0.1);
  color: #6c757d;
}

.action-card-success .action-icon {
  background: rgba(40, 167, 69, 0.1);
  color: #28a745;
}

.action-card-info .action-icon {
  background: rgba(23, 162, 184, 0.1);
  color: #17a2b8;
}

.action-card-warning .action-icon {
  background: rgba(255, 193, 7, 0.1);
  color: #ffc107;
}

.action-card-dark .action-icon {
  background: rgba(52, 58, 64, 0.1);
  color: #343a40;
}

.action-card-purple .action-icon {
  background: rgba(111, 66, 193, 0.1);
  color: #6f42c1;
}

.action-card-teal .action-icon {
  background: rgba(32, 201, 151, 0.1);
  color: #20c997;
}

.action-card-orange .action-icon {
  background: rgba(253, 126, 20, 0.1);
  color: #fd7e14;
}

.action-title {
  font-size: 1rem;
  font-weight: 600;
  color: #2d3436;
  margin-bottom: 0.5rem;
}

.action-description {
  font-size: 0.875rem;
  color: #6c757d;
  margin: 0;
}

/* Секция утверждения */
.approval-section {
  background: white;
  border-radius: 15px;
  overflow: hidden;
  box-shadow: 0 5px 20px rgba(0, 0, 0, 0.08);
}

.section-header-warning {
  background: linear-gradient(135deg, #ffc107 0%, #e0a800 100%);
  color: white;
  padding: 1.5rem;
}

.approval-list {
  padding: 1.5rem;
}

.approval-item {
  border-bottom: 1px solid #e9ecef;
  padding: 1.5rem 0;
  transition: background-color 0.3s ease;
}

.approval-item:last-child {
  border-bottom: none;
}

.approval-item:hover {
  background-color: #f8f9fa;
}

.approval-item-content {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
}

.approval-main {
  display: flex;
  align-items: center;
  gap: 1rem;
  flex: 1;
}

.approval-icon {
  width: 50px;
  height: 50px;
  background: rgba(255, 193, 7, 0.1);
  color: #ffc107;
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.25rem;
}

.approval-title {
  font-size: 1rem;
  font-weight: 600;
  color: #2d3436;
  margin-bottom: 0.5rem;
}

.approval-meta {
  display: flex;
  gap: 1.5rem;
  flex-wrap: wrap;
}

.meta-item {
  font-size: 0.875rem;
  color: #6c757d;
  display: flex;
  align-items: center;
}

/* Кнопки */
.btn-icon-split {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  border-radius: 8px;
  transition: all 0.3s ease;
}

.btn-icon-split .icon {
  display: flex;
  align-items: center;
  justify-content: center;
}

.btn-icon-split:hover {
  transform: translateY(-2px);
  box-shadow: 0 5px 15px rgba(0, 0, 0, 0.15);
}

/* Таблица проектов */
.projects-table {
  background: white;
  border-radius: 15px;
  overflow: hidden;
  box-shadow: 0 5px 20px rgba(0, 0, 0, 0.08);
}

.table-header {
  background: #f8f9fa;
  padding: 1.5rem;
  border-bottom: 1px solid #e9ecef;
}

.projects-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(350px, 1fr));
  gap: 1.5rem;
  padding: 1.5rem;
}

.project-card {
  background: white;
  border: 1px solid #e9ecef;
  border-radius: 12px;
  padding: 1.5rem;
  transition: all 0.3s ease;
}

.project-card:hover {
  border-color: #007bff;
  box-shadow: 0 5px 20px rgba(0, 123, 255, 0.15);
}

.project-header {
  display: flex;
  justify-content: space-between;
  align-items: start;
  margin-bottom: 1rem;
}

.project-code {
  font-size: 0.875rem;
  font-weight: 600;
  color: #6c757d;
}

.project-title {
  font-size: 1.125rem;
  font-weight: 600;
  color: #2d3436;
  margin-bottom: 0.5rem;
}

.project-meta {
  display: flex;
  gap: 1rem;
  margin-bottom: 1rem;
  flex-wrap: wrap;
}

.meta-item {
  font-size: 0.875rem;
  color: #6c757d;
  display: flex;
  align-items: center;
  gap: 0.25rem;
}

.project-progress {
  margin-bottom: 1rem;
}

.progress {
  height: 8px;
  background-color: #e9ecef;
  border-radius: 4px;
  overflow: hidden;
}

.progress-bar {
  background: linear-gradient(90deg, #007bff 0%, #0056b3 100%);
  transition: width 0.3s ease;
}

.project-actions {
  display: flex;
  gap: 0.5rem;
}

/* Медиа запросы */
@media (max-width: 768px) {
  .page-header-gradient {
    padding: 1rem;
  }
  
  .page-title {
    font-size: 1.5rem;
  }
  
  .approval-item-content {
    flex-direction: column;
    align-items: start;
  }
  
  .approval-actions {
    width: 100%;
    margin-top: 1rem;
  }
  
  .btn-icon-split {
    width: 100%;
    justify-content: center;
  }
}
</style>
