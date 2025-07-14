<template>
  <div class="project-view">
    <!-- Красивый заголовок проекта -->
    <div class="project-hero">
      <div class="container-fluid">
        <div class="row">
          <div class="col-12">
            <div class="hero-content">
              <div class="project-info">
                <div class="project-header">
                  <div class="project-meta">
                    <span class="project-code">
                      <i class="fas fa-hashtag mr-1"></i>
                      {{ project.code }}
                    </span>
                    <span :class="getStatusBadgeClass(project.status)" class="status-badge">
                      <i :class="getStatusIcon(project.status)" class="mr-1"></i>
                      {{ getStatusLabel(project.status) }}
                    </span>
                  </div>
                  <h1 class="project-title">{{ project.name }}</h1>
                  <p class="project-subtitle">Детальная информация о стратегическом проекте</p>
                </div>
                
                <div class="project-stats">
                  <div class="stat-card">
                    <div class="stat-icon">
                      <i class="fas fa-percentage"></i>
                    </div>
                    <div class="stat-content">
                      <div class="stat-number">{{ project.completion_percentage }}%</div>
                      <div class="stat-label">Прогресс</div>
                    </div>
                  </div>
                  
                  <div class="stat-card">
                    <div class="stat-icon">
                      <i class="fas fa-calendar-alt"></i>
                    </div>
                    <div class="stat-content">
                      <div class="stat-number">{{ getDaysRemaining() }}</div>
                      <div class="stat-label">Дней осталось</div>
                    </div>
                  </div>
                  
                  <div class="stat-card">
                    <div class="stat-icon">
                      <i class="fas fa-tasks"></i>
                    </div>
                    <div class="stat-content">
                      <div class="stat-number">{{ project.stages?.length || 0 }}</div>
                      <div class="stat-label">Этапов</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            
            <nav aria-label="breadcrumb" class="hero-breadcrumb">
              <ol class="breadcrumb">
                <li class="breadcrumb-item"><router-link to="/">Главная</router-link></li>
                <li class="breadcrumb-item"><router-link to="/crm">CRM</router-link></li>
                <li class="breadcrumb-item">
                  <router-link to="/crm/strategic-projects">Стратегические проекты</router-link>
                </li>
                <li class="breadcrumb-item active">Просмотр проекта</li>
              </ol>
            </nav>
          </div>
        </div>
      </div>
    </div>

    <div class="container-fluid">

      <!-- Красивые кнопки действий -->
      <div class="row mb-4">
        <div class="col-12">
          <div class="action-panel">
            <h5 class="action-title">
              <i class="fas fa-cogs mr-2"></i>
              Доступные действия
            </h5>
            <div class="action-buttons">
              <router-link
                v-if="canEdit"
                :to="`/crm/strategic-projects/${projectId}/edit`"
                class="btn btn-action btn-edit"
              >
                <i class="fas fa-edit mr-2"></i>
                <span>Редактировать</span>
              </router-link>
              
              <button
                v-if="project.status === 'on_approval' && isExpertGroup"
                @click="approveProject"
                class="btn btn-action btn-approve"
              >
                <i class="fas fa-check mr-2"></i>
                <span>Утвердить</span>
              </button>
              
              <button
                v-if="project.status === 'on_approval' && isExpertGroup"
                @click="rejectProject"
                class="btn btn-action btn-reject"
              >
                <i class="fas fa-times mr-2"></i>
                <span>Отклонить</span>
              </button>
              
              <button
                v-if="project.status === 'approved'"
                @click="startProject"
                class="btn btn-action btn-start"
              >
                <i class="fas fa-play mr-2"></i>
                <span>Запустить проект</span>
              </button>
              
              <router-link
                to="/crm/strategic-projects"
                class="btn btn-action btn-back"
              >
                <i class="fas fa-arrow-left mr-2"></i>
                <span>Назад к списку</span>
              </router-link>
            </div>
          </div>
        </div>
      </div>

      <!-- Основная информация -->
      <div class="row">
        <div class="col-lg-8">
          <div class="info-card mb-4">
            <div class="card-header">
              <h5 class="card-title">
                <i class="fas fa-info-circle mr-2"></i>
                Основная информация
              </h5>
            </div>
            <div class="card-body">
              <div class="info-section">
                <div class="info-label">
                  <i class="fas fa-bullseye mr-2"></i>
                  Цель проекта
                </div>
                <div class="info-content">
                  <p class="text-pre-wrap">{{ project.goal || 'Цель не указана' }}</p>
                </div>
              </div>
              
              <div class="info-section">
                <div class="info-label">
                  <i class="fas fa-list-ol mr-2"></i>
                  Задачи проекта
                </div>
                <div class="info-content">
                  <p class="text-pre-wrap">{{ project.tasks || 'Задачи не указаны' }}</p>
                </div>
              </div>
              
              <div v-if="project.planned_results?.length > 0" class="info-section">
                <div class="info-label">
                  <i class="fas fa-trophy mr-2"></i>
                  Планируемые результаты
                </div>
                <div class="info-content">
                  <div class="results-list">
                    <div v-for="(result, index) in project.planned_results" :key="index" class="result-item">
                      <i class="fas fa-check-circle mr-2"></i>
                      {{ result }}
                    </div>
                  </div>
                </div>
              </div>
              
              <div v-if="project.rejection_comment" class="rejection-alert">
                <div class="alert-header">
                  <i class="fas fa-exclamation-triangle mr-2"></i>
                  Причина отклонения
                </div>
                <div class="alert-content">
                  {{ project.rejection_comment }}
                </div>
              </div>
            </div>
          </div>
          
          <!-- Этапы проекта -->
          <div class="stages-card mb-4">
            <div class="card-header">
              <h5 class="card-title">
                <i class="fas fa-tasks mr-2"></i>
                План-график проекта
                <span class="stages-count">{{ project.stages?.length || 0 }} этапов</span>
              </h5>
            </div>
            <div class="card-body">
              <div v-if="!project.stages || project.stages.length === 0" class="empty-stages">
                <div class="empty-icon">
                  <i class="fas fa-calendar-times"></i>
                </div>
                <p class="empty-text">Этапы проекта еще не определены</p>
              </div>
              <div v-else class="stages-timeline">
                <div v-for="(stage, index) in project.stages" :key="stage.id" class="stage-item">
                  <div class="stage-number">
                    <span>{{ stage.order_number || index + 1 }}</span>
                  </div>
                  <div class="stage-content">
                    <div class="stage-header">
                      <h6 class="stage-name">{{ stage.name }}</h6>
                      <span :class="getStageBadgeClass(stage.status)" class="stage-status">
                        <i :class="getStageStatusIcon(stage.status)" class="mr-1"></i>
                        {{ getStageStatusLabel(stage.status) }}
                      </span>
                    </div>
                    <div class="stage-dates">
                      <div class="date-range">
                        <i class="fas fa-calendar-alt mr-1"></i>
                        {{ formatDate(stage.planned_start_date) }} - {{ formatDate(stage.planned_end_date) }}
                      </div>
                      <div v-if="stage.description" class="stage-description">
                        {{ stage.description }}
                      </div>
                    </div>
                  </div>
                  <div v-if="index < project.stages.length - 1" class="stage-connector"></div>
                </div>
              </div>
            </div>
          </div>
        </div>
        
        <div class="col-lg-4">
          <!-- Участники проекта -->
          <div class="participants-card mb-4">
            <div class="card-header">
              <h5 class="card-title">
                <i class="fas fa-users mr-2"></i>
                Участники проекта
              </h5>
            </div>
            <div class="card-body">
              <div class="participant-item">
                <div class="participant-role">
                  <i class="fas fa-crown mr-2"></i>
                  Руководитель
                </div>
                <div class="participant-name">
                  {{ project.leader_info?.full_name || 'Не назначен' }}
                </div>
              </div>
              
              <div class="participant-item">
                <div class="participant-role">
                  <i class="fas fa-user-tie mr-2"></i>
                  Куратор
                </div>
                <div class="participant-name">
                  {{ project.curator_info?.full_name || 'Не назначен' }}
                </div>
              </div>
              
              <div class="participant-item">
                <div class="participant-role">
                  <i class="fas fa-handshake mr-2"></i>
                  Заказчик
                </div>
                <div class="participant-name">
                  {{ project.customer_info?.full_name || 'Не назначен' }}
                </div>
              </div>
            </div>
          </div>
          
          <!-- Прогресс проекта -->
          <div class="progress-card mb-4">
            <div class="card-header">
              <h5 class="card-title">
                <i class="fas fa-chart-line mr-2"></i>
                Прогресс выполнения
              </h5>
            </div>
            <div class="card-body">
              <div class="progress-circle-wrapper">
                <div class="progress-circle">
                  <div class="progress-circle-inner">
                    <span class="progress-percentage">{{ project.completion_percentage }}%</span>
                  </div>
                </div>
              </div>
              <div class="progress-details">
                <div class="progress-item">
                  <div class="progress-label">Статус</div>
                  <div class="progress-value">{{ getStatusLabel(project.status) }}</div>
                </div>
                <div class="progress-item">
                  <div class="progress-label">Этапов завершено</div>
                  <div class="progress-value">{{ getCompletedStages() }} из {{ project.stages?.length || 0 }}</div>
                </div>
              </div>
            </div>
          </div>
          
          <!-- Сроки и бюджет -->
          <div class="timeline-card mb-4">
            <div class="card-header">
              <h5 class="card-title">
                <i class="fas fa-calendar-alt mr-2"></i>
                Сроки и бюджет
              </h5>
            </div>
            <div class="card-body">
              <div class="timeline-item">
                <div class="timeline-icon planned">
                  <i class="fas fa-calendar-plus"></i>
                </div>
                <div class="timeline-content">
                  <div class="timeline-label">Плановые сроки</div>
                  <div class="timeline-value">
                    {{ formatDate(project.planned_start_date) }} - {{ formatDate(project.planned_end_date) }}
                  </div>
                </div>
              </div>
              
              <div v-if="project.actual_start_date" class="timeline-item">
                <div class="timeline-icon actual">
                  <i class="fas fa-calendar-check"></i>
                </div>
                <div class="timeline-content">
                  <div class="timeline-label">Фактические сроки</div>
                  <div class="timeline-value">
                    {{ formatDate(project.actual_start_date) }} - {{ formatDate(project.actual_end_date) || 'в процессе' }}
                  </div>
                </div>
              </div>
              
              <div v-if="project.requires_budget" class="timeline-item">
                <div class="timeline-icon budget">
                  <i class="fas fa-dollar-sign"></i>
                </div>
                <div class="timeline-content">
                  <div class="timeline-label">Общий бюджет</div>
                  <div class="timeline-value">
                    {{ formatCurrency(project.total_budget) }}
                  </div>
                </div>
              </div>
              
              <div class="timeline-item">
                <div class="timeline-icon duration">
                  <i class="fas fa-clock"></i>
                </div>
                <div class="timeline-content">
                  <div class="timeline-label">Длительность</div>
                  <div class="timeline-value">
                    {{ getProjectDuration() }} дней
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { ref, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useUserStore } from '@/modules/cms/js/userStore'
import { format } from 'date-fns'
import { ru } from 'date-fns/locale'
import { apiClient } from '@/js/api/manager'

export default {
  name: 'ProjectView',
  
  setup() {
    const route = useRoute()
    const router = useRouter()
    const userStore = useUserStore()
    const projectId = route.params.id
    
    const project = ref({})
    const loading = ref(false)
    
    // Проверка прав пользователя
    const currentUser = computed(() => userStore.user)
    
    const isProjectLeader = computed(() => {
      return project.value.leader === currentUser.value?.id
    })
    
    const isExpertGroup = computed(() => {
      // Временно даем права всем авторизованным пользователям
      // TODO: Реализовать систему ролей
      return userStore.isAuthenticated
    })
    
    const canEdit = computed(() => {
      return isProjectLeader.value && 
             ['draft', 'rejected'].includes(project.value.status)
    })
    
    // Загрузка проекта
    const loadProject = async () => {
      loading.value = true
      try {
        const response = await apiClient.get(`/crm/strategic-projects/strategic-projects/${projectId}/`)
        project.value = response.data
      } catch (error) {
        console.error('Ошибка загрузки проекта:', error)
        alert('Ошибка при загрузке проекта')
        router.push('/crm/strategic-projects')
      } finally {
        loading.value = false
      }
    }
    
    // Форматирование даты
    const formatDate = (dateString) => {
      if (!dateString) return '-'
      return format(new Date(dateString), 'dd.MM.yyyy', { locale: ru })
    }
    
    // Форматирование валюты
    const formatCurrency = (amount) => {
      if (!amount) return '-'
      return new Intl.NumberFormat('ru-RU', {
        style: 'currency',
        currency: 'RUB'
      }).format(amount)
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
    
    // Получение класса для статуса этапа
    const getStageBadgeClass = (status) => {
      const classes = {
        planned: 'badge badge-secondary',
        in_progress: 'badge badge-primary',
        completed: 'badge badge-success',
        delayed: 'badge badge-danger'
      }
      return classes[status] || 'badge badge-secondary'
    }
    
    // Получение метки статуса этапа
    const getStageStatusLabel = (status) => {
      const labels = {
        planned: 'Запланирован',
        in_progress: 'В работе',
        completed: 'Завершен',
        delayed: 'Просрочен'
      }
      return labels[status] || status
    }
    
    // Утвердить проект
    const approveProject = async () => {
      if (!confirm('Утвердить проект?')) return
      
      try {
        await apiClient.post(`/crm/strategic-projects/strategic-projects/${projectId}/approve/`)
        alert('Проект успешно утвержден')
        loadProject()
      } catch (error) {
        console.error('Ошибка утверждения проекта:', error)
        alert('Ошибка при утверждении проекта')
      }
    }
    
    // Отклонить проект
    const rejectProject = async () => {
      const comment = prompt('Укажите причину отклонения:')
      if (!comment) return
      
      try {
        await apiClient.post(`/crm/strategic-projects/strategic-projects/${projectId}/reject/`, {
          comment
        })
        alert('Проект отклонен')
        loadProject()
      } catch (error) {
        console.error('Ошибка отклонения проекта:', error)
        alert('Ошибка при отклонении проекта')
      }
    }
    
    // Запуск проекта
    const startProject = async () => {
      if (!confirm('Запустить проект в работу?')) return
      
      try {
        await apiClient.post(`/crm/strategic-projects/strategic-projects/${projectId}/start_project/`)
        alert('Проект успешно запущен')
        loadProject()
      } catch (error) {
        console.error('Ошибка запуска проекта:', error)
        alert('Ошибка при запуске проекта')
      }
    }
    
    // Добавляю новые методы для улучшенного интерфейса
    const getStatusIcon = (status) => {
      const icons = {
        draft: 'fas fa-file-alt',
        on_approval: 'fas fa-clock',
        rejected: 'fas fa-times-circle',
        approved: 'fas fa-check-circle',
        in_progress: 'fas fa-play-circle',
        completed: 'fas fa-trophy',
        archived: 'fas fa-archive'
      }
      return icons[status] || 'fas fa-circle'
    }

    const getStageStatusIcon = (status) => {
      const icons = {
        planned: 'fas fa-calendar-alt',
        in_progress: 'fas fa-play-circle',
        completed: 'fas fa-check-circle',
        delayed: 'fas fa-exclamation-triangle'
      }
      return icons[status] || 'fas fa-circle'
    }

    const getDaysRemaining = () => {
      if (!project.value.planned_end_date) return 0
      const endDate = new Date(project.value.planned_end_date)
      const today = new Date()
      const diffTime = endDate.getTime() - today.getTime()
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
      return Math.max(0, diffDays)
    }

    const getCompletedStages = () => {
      if (!project.value.stages) return 0
      return project.value.stages.filter(stage => stage.status === 'completed').length
    }

    const getProjectDuration = () => {
      if (!project.value.planned_start_date || !project.value.planned_end_date) return 0
      const startDate = new Date(project.value.planned_start_date)
      const endDate = new Date(project.value.planned_end_date)
      const diffTime = endDate.getTime() - startDate.getTime()
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
      return Math.max(0, diffDays)
    }

    // Загрузка данных при монтировании
    onMounted(() => {
      loadProject()
    })
    
    return {
      project,
      projectId,
      loading,
      currentUser,
      isProjectLeader,
      isExpertGroup,
      canEdit,
      loadProject,
      formatDate,
      formatCurrency,
      getStatusBadgeClass,
      getStatusLabel,
      getStageBadgeClass,
      getStageStatusLabel,
      approveProject,
      rejectProject,
      startProject,
      getStatusIcon,
      getStageStatusIcon,
      getDaysRemaining,
      getCompletedStages,
      getProjectDuration
    }
  }
}
</script>

<style scoped>
/* Основные стили */
.project-view {
  min-height: 100vh;
  background: linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%);
}

/* Герой секция проекта */
.project-hero {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  padding: 3rem 0 2rem;
  margin-bottom: 2rem;
  position: relative;
  overflow: hidden;
}

.project-hero::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: url('data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><defs><pattern id="grain" width="100" height="100" patternUnits="userSpaceOnUse"><circle cx="25" cy="25" r="1" fill="rgba(255,255,255,0.1)"/><circle cx="75" cy="75" r="1" fill="rgba(255,255,255,0.1)"/><circle cx="50" cy="10" r="0.5" fill="rgba(255,255,255,0.1)"/></pattern></defs><rect width="100" height="100" fill="url(%23grain)"/></svg>');
  opacity: 0.1;
}

.hero-content {
  position: relative;
  z-index: 2;
}

.project-info {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  flex-wrap: wrap;
  gap: 2rem;
}

.project-header {
  flex: 1;
  min-width: 300px;
}

.project-meta {
  display: flex;
  align-items: center;
  gap: 1rem;
  margin-bottom: 1rem;
}

.project-code {
  background: rgba(255,255,255,0.15);
  padding: 0.5rem 1rem;
  border-radius: 8px;
  font-family: 'Monaco', 'Consolas', monospace;
  font-weight: 600;
  backdrop-filter: blur(10px);
  border: 1px solid rgba(255,255,255,0.2);
}

.status-badge {
  padding: 0.5rem 1rem;
  border-radius: 12px;
  font-weight: 600;
  display: inline-flex;
  align-items: center;
  background: rgba(255,255,255,0.9);
  color: #1f2937;
  border: none;
}

.project-title {
  font-size: 2.5rem;
  font-weight: 700;
  margin: 0 0 0.5rem;
  line-height: 1.2;
  text-shadow: 0 2px 4px rgba(0,0,0,0.1);
}

.project-subtitle {
  font-size: 1.1rem;
  opacity: 0.9;
  margin: 0;
}

.project-stats {
  display: flex;
  gap: 1rem;
  flex-wrap: wrap;
}

.stat-card {
  background: rgba(255,255,255,0.1);
  border-radius: 12px;
  padding: 1rem;
  backdrop-filter: blur(10px);
  border: 1px solid rgba(255,255,255,0.2);
  text-align: center;
  min-width: 100px;
}

.stat-icon {
  font-size: 1.5rem;
  margin-bottom: 0.5rem;
  opacity: 0.8;
}

.stat-number {
  font-size: 1.5rem;
  font-weight: 700;
  line-height: 1;
  margin-bottom: 0.25rem;
}

.stat-label {
  font-size: 0.875rem;
  opacity: 0.8;
}

.hero-breadcrumb {
  margin-top: 2rem;
}

.hero-breadcrumb .breadcrumb {
  background: rgba(255,255,255,0.1);
  border-radius: 8px;
  padding: 0.75rem 1rem;
  backdrop-filter: blur(10px);
}

.hero-breadcrumb .breadcrumb-item a {
  color: rgba(255,255,255,0.8);
  text-decoration: none;
}

.hero-breadcrumb .breadcrumb-item a:hover {
  color: white;
}

.hero-breadcrumb .breadcrumb-item.active {
  color: rgba(255,255,255,0.9);
}

/* Панель действий */
.action-panel {
  background: white;
  border-radius: 16px;
  padding: 1.5rem;
  box-shadow: 0 8px 32px rgba(0,0,0,0.1);
  border: none;
}

.action-title {
  color: #374151;
  font-size: 1.1rem;
  font-weight: 600;
  margin-bottom: 1rem;
  display: flex;
  align-items: center;
}

.action-buttons {
  display: flex;
  gap: 1rem;
  flex-wrap: wrap;
}

.btn-action {
  border: none;
  border-radius: 8px;
  padding: 0.75rem 1.5rem;
  font-weight: 600;
  text-decoration: none;
  display: inline-flex;
  align-items: center;
  transition: all 0.3s ease;
  cursor: pointer;
}

.btn-edit {
  background: linear-gradient(135deg, #8b5cf6, #7c3aed);
  color: white;
  box-shadow: 0 4px 12px rgba(139,92,246,0.3);
}

.btn-edit:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 20px rgba(139,92,246,0.4);
  color: white;
  text-decoration: none;
}

.btn-approve {
  background: linear-gradient(135deg, #10b981, #059669);
  color: white;
  box-shadow: 0 4px 12px rgba(16,185,129,0.3);
}

.btn-approve:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 20px rgba(16,185,129,0.4);
}

.btn-reject {
  background: linear-gradient(135deg, #ef4444, #dc2626);
  color: white;
  box-shadow: 0 4px 12px rgba(239,68,68,0.3);
}

.btn-reject:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 20px rgba(239,68,68,0.4);
}

.btn-start {
  background: linear-gradient(135deg, #06b6d4, #0891b2);
  color: white;
  box-shadow: 0 4px 12px rgba(6,182,212,0.3);
}

.btn-start:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 20px rgba(6,182,212,0.4);
}

.btn-back {
  background: linear-gradient(135deg, #6b7280, #4b5563);
  color: white;
  box-shadow: 0 4px 12px rgba(107,114,128,0.3);
}

.btn-back:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 20px rgba(107,114,128,0.4);
  color: white;
  text-decoration: none;
}

/* Карточки контента */
.info-card,
.stages-card,
.participants-card,
.progress-card,
.timeline-card {
  background: white;
  border-radius: 16px;
  box-shadow: 0 8px 32px rgba(0,0,0,0.1);
  overflow: hidden;
  border: none;
}

.card-header {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  padding: 1.5rem;
}

.card-title {
  margin: 0;
  font-size: 1.1rem;
  font-weight: 600;
  display: flex;
  align-items: center;
}

.card-body {
  padding: 1.5rem;
}

/* Секции информации */
.info-section {
  margin-bottom: 2rem;
}

.info-section:last-child {
  margin-bottom: 0;
}

.info-label {
  font-weight: 600;
  color: #374151;
  margin-bottom: 0.75rem;
  display: flex;
  align-items: center;
  font-size: 0.95rem;
}

.info-content {
  color: #6b7280;
  line-height: 1.6;
}

.text-pre-wrap {
  white-space: pre-wrap;
  margin: 0;
}

.results-list {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.result-item {
  display: flex;
  align-items: flex-start;
  gap: 0.5rem;
  padding: 0.5rem;
  background: #f8fafc;
  border-radius: 6px;
  color: #374151;
}

.result-item i {
  color: #10b981;
  margin-top: 0.125rem;
  flex-shrink: 0;
}

/* Алерт отклонения */
.rejection-alert {
  background: linear-gradient(135deg, #fef2f2, #fee2e2);
  border: 1px solid #fca5a5;
  border-radius: 12px;
  padding: 1rem;
  margin-top: 1rem;
}

.alert-header {
  font-weight: 600;
  color: #dc2626;
  margin-bottom: 0.5rem;
  display: flex;
  align-items: center;
}

.alert-content {
  color: #7f1d1d;
  line-height: 1.5;
}

/* Этапы проекта */
.stages-count {
  background: rgba(255,255,255,0.2);
  color: white;
  padding: 0.25rem 0.75rem;
  border-radius: 12px;
  font-size: 0.875rem;
  margin-left: 1rem;
}

.empty-stages {
  text-align: center;
  padding: 3rem 1rem;
}

.empty-icon {
  font-size: 3rem;
  color: #d1d5db;
  margin-bottom: 1rem;
}

.empty-text {
  color: #6b7280;
  font-size: 1.1rem;
  margin: 0;
}

.stages-timeline {
  position: relative;
}

.stage-item {
  display: flex;
  align-items: flex-start;
  gap: 1rem;
  margin-bottom: 1.5rem;
  position: relative;
}

.stage-item:last-child {
  margin-bottom: 0;
}

.stage-number {
  width: 40px;
  height: 40px;
  background: linear-gradient(135deg, #667eea, #764ba2);
  color: white;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 600;
  flex-shrink: 0;
  z-index: 2;
  position: relative;
}

.stage-content {
  flex: 1;
  background: #f8fafc;
  border-radius: 12px;
  padding: 1rem;
}

.stage-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 0.75rem;
  gap: 1rem;
}

.stage-name {
  font-size: 1rem;
  font-weight: 600;
  color: #374151;
  margin: 0;
  flex: 1;
}

.stage-status {
  padding: 0.25rem 0.75rem;
  border-radius: 12px;
  font-size: 0.8rem;
  font-weight: 500;
  display: inline-flex;
  align-items: center;
  flex-shrink: 0;
}

.stage-dates {
  color: #6b7280;
  font-size: 0.875rem;
}

.date-range {
  display: flex;
  align-items: center;
  margin-bottom: 0.5rem;
}

.stage-description {
  color: #4b5563;
  font-style: italic;
}

.stage-connector {
  position: absolute;
  left: 19px;
  top: 40px;
  bottom: -12px;
  width: 2px;
  background: linear-gradient(to bottom, #e5e7eb, transparent);
  z-index: 1;
}

/* Участники проекта */
.participant-item {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  padding: 1rem;
  background: #f8fafc;
  border-radius: 12px;
  margin-bottom: 1rem;
}

.participant-item:last-child {
  margin-bottom: 0;
}

.participant-role {
  font-size: 0.875rem;
  font-weight: 600;
  color: #6b7280;
  display: flex;
  align-items: center;
}

.participant-role i {
  color: #667eea;
}

.participant-name {
  font-weight: 500;
  color: #374151;
}

/* Прогресс */
.progress-circle-wrapper {
  display: flex;
  justify-content: center;
  margin-bottom: 1.5rem;
}

.progress-circle {
  width: 120px;
  height: 120px;
  border-radius: 50%;
  background: linear-gradient(135deg, #667eea, #764ba2);
  padding: 8px;
  position: relative;
}

.progress-circle-inner {
  width: 100%;
  height: 100%;
  border-radius: 50%;
  background: white;
  display: flex;
  align-items: center;
  justify-content: center;
}

.progress-percentage {
  font-size: 1.5rem;
  font-weight: 700;
  color: #374151;
}

.progress-details {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.progress-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0.75rem;
  background: #f8fafc;
  border-radius: 8px;
}

.progress-label {
  font-weight: 500;
  color: #6b7280;
}

.progress-value {
  font-weight: 600;
  color: #374151;
}

/* Временная шкала */
.timeline-item {
  display: flex;
  align-items: flex-start;
  gap: 1rem;
  margin-bottom: 1.5rem;
}

.timeline-item:last-child {
  margin-bottom: 0;
}

.timeline-icon {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-size: 0.875rem;
  flex-shrink: 0;
}

.timeline-icon.planned {
  background: linear-gradient(135deg, #3b82f6, #2563eb);
}

.timeline-icon.actual {
  background: linear-gradient(135deg, #10b981, #059669);
}

.timeline-icon.budget {
  background: linear-gradient(135deg, #f59e0b, #d97706);
}

.timeline-icon.duration {
  background: linear-gradient(135deg, #8b5cf6, #7c3aed);
}

.timeline-content {
  flex: 1;
}

.timeline-label {
  font-weight: 600;
  color: #374151;
  margin-bottom: 0.25rem;
}

.timeline-value {
  color: #6b7280;
  line-height: 1.4;
}

/* Адаптивность */
@media (max-width: 768px) {
  .project-info {
    flex-direction: column;
  }

  .project-stats {
    justify-content: center;
  }

  .project-title {
    font-size: 2rem;
  }

  .action-buttons {
    flex-direction: column;
  }

  .btn-action {
    justify-content: center;
  }

  .stage-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 0.5rem;
  }
}

@media (max-width: 576px) {
  .project-hero {
    padding: 2rem 0 1.5rem;
  }

  .project-title {
    font-size: 1.75rem;
  }

  .project-meta {
    flex-direction: column;
    align-items: flex-start;
    gap: 0.5rem;
  }

  .stat-card {
    min-width: 80px;
  }

  .stat-number {
    font-size: 1.25rem;
  }
}
</style>
