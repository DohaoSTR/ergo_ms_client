<template>
  <div class="expert-approval">
    <!-- Красивый градиентный заголовок -->
    <div class="hero-section">
      <div class="container-fluid">
        <div class="row">
          <div class="col-12">
            <div class="hero-content">
              <div class="hero-text">
                <h1 class="hero-title">
                  <i class="fas fa-gavel mr-3"></i>
                  Экспертная оценка проектов
                </h1>
                <p class="hero-subtitle">Рассмотрение и утверждение стратегических проектов</p>
              </div>
              <div class="hero-stats">
                <div class="stat-item">
                  <div class="stat-number">{{ projectsForApproval.length }}</div>
                  <div class="stat-label">На рассмотрении</div>
                </div>
                <div class="stat-item">
                  <div class="stat-number">{{ todayProjects }}</div>
                  <div class="stat-label">Поступили сегодня</div>
                </div>
                <div class="stat-item">
                  <div class="stat-number">{{ urgentProjects }}</div>
                  <div class="stat-label">Требуют срочного решения</div>
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
                <li class="breadcrumb-item active">Экспертная оценка</li>
              </ol>
            </nav>
          </div>
        </div>
      </div>
    </div>

    <div class="container-fluid">

      <!-- Фильтры и сортировка -->
      <div class="row mb-4">
        <div class="col-12">
          <div class="filter-card">
            <div class="filter-header">
              <h5 class="filter-title">
                <i class="fas fa-filter mr-2"></i>
                Фильтры и сортировка
              </h5>
            </div>
            <div class="filter-body">
              <div class="row">
                <div class="col-md-3">
                  <div class="form-group">
                    <label class="filter-label">Приоритет</label>
                    <select v-model="filters.priority" class="form-control">
                      <option value="">Все проекты</option>
                      <option value="urgent">Срочные</option>
                      <option value="normal">Обычные</option>
                    </select>
                  </div>
                </div>
                <div class="col-md-3">
                  <div class="form-group">
                    <label class="filter-label">Дата подачи</label>
                    <select v-model="filters.dateRange" class="form-control">
                      <option value="">Все даты</option>
                      <option value="today">Сегодня</option>
                      <option value="week">За неделю</option>
                      <option value="month">За месяц</option>
                    </select>
                  </div>
                </div>
                <div class="col-md-4">
                  <div class="form-group">
                    <label class="filter-label">Поиск</label>
                    <input
                      v-model="filters.search"
                      type="text"
                      class="form-control"
                      placeholder="Поиск по названию, коду, руководителю..."
                    />
                  </div>
                </div>
                <div class="col-md-2">
                  <div class="form-group">
                    <label class="filter-label">&nbsp;</label>
                    <button @click="applyFilters" class="btn btn-primary btn-block">
                      <i class="fas fa-search mr-2"></i>
                      Применить
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Список проектов для рассмотрения -->
      <div class="row">
        <div class="col-12">
          <div v-if="loading" class="text-center py-5">
            <div class="spinner-border text-primary" role="status">
              <span class="sr-only">Загрузка...</span>
            </div>
          </div>

          <div v-else-if="filteredProjects.length === 0" class="empty-state-card">
            <div class="empty-icon">
              <i class="fas fa-clipboard-check"></i>
            </div>
            <h4 class="empty-title">Нет проектов для рассмотрения</h4>
            <p class="empty-text">Все проекты уже рассмотрены</p>
          </div>

          <div v-else class="projects-list">
            <transition-group name="project-list" tag="div">
              <div
                v-for="project in filteredProjects"
                :key="project.id"
                class="project-approval-card"
                :class="{ 'urgent': isUrgentProject(project) }"
              >
                <div class="project-approval-header">
                  <div class="project-main-info">
                    <div class="project-title-section">
                      <h5 class="project-title">
                        {{ project.name }}
                        <span class="project-code">{{ project.code }}</span>
                      </h5>
                      <div class="project-meta">
                        <span class="meta-item">
                          <i class="fas fa-user mr-1"></i>
                          Руководитель: <strong>{{ project.leader_name }}</strong>
                        </span>
                        <span class="meta-item">
                          <i class="fas fa-calendar mr-1"></i>
                          Подан: <strong>{{ formatDate(project.created_at) }}</strong>
                        </span>
                        <span class="meta-item">
                          <i class="fas fa-clock mr-1"></i>
                          Ожидает: <strong>{{ getDaysWaiting(project) }} дней</strong>
                        </span>
                      </div>
                    </div>
                    <div class="project-priority-badge" v-if="isUrgentProject(project)">
                      <i class="fas fa-exclamation-triangle mr-1"></i>
                      Срочно
                    </div>
                  </div>
                </div>

                <div class="project-approval-body">
                  <div class="row">
                    <div class="col-md-8">
                      <div class="project-details">
                        <div class="detail-section">
                          <h6 class="detail-title">
                            <i class="fas fa-bullseye mr-2"></i>
                            Цель проекта
                          </h6>
                          <p class="detail-content">{{ project.goal }}</p>
                        </div>
                        
                        <div class="detail-section">
                          <h6 class="detail-title">
                            <i class="fas fa-tasks mr-2"></i>
                            Основные задачи
                          </h6>
                          <p class="detail-content">{{ project.tasks }}</p>
                        </div>
                      </div>
                    </div>
                    
                    <div class="col-md-4">
                      <div class="project-sidebar">
                        <div class="sidebar-section">
                          <h6 class="sidebar-title">Участники</h6>
                          <div class="participant-list">
                            <div class="participant-item">
                              <i class="fas fa-user-tie mr-2"></i>
                              <span>Куратор: {{ project.curator_name || 'Не назначен' }}</span>
                            </div>
                            <div class="participant-item">
                              <i class="fas fa-handshake mr-2"></i>
                              <span>Заказчик: {{ project.customer_name || 'Не назначен' }}</span>
                            </div>
                          </div>
                        </div>
                        
                        <div class="sidebar-section">
                          <h6 class="sidebar-title">Сроки реализации</h6>
                          <div class="timeline-info">
                            <div class="timeline-item">
                              <i class="fas fa-play text-success mr-2"></i>
                              {{ formatDate(project.planned_start_date) }}
                            </div>
                            <div class="timeline-item">
                              <i class="fas fa-flag text-danger mr-2"></i>
                              {{ formatDate(project.planned_end_date) }}
                            </div>
                            <div class="timeline-item">
                              <i class="fas fa-calendar-alt text-info mr-2"></i>
                              {{ getProjectDuration(project) }} дней
                            </div>
                          </div>
                        </div>
                        
                        <div class="sidebar-section" v-if="project.requires_budget">
                          <h6 class="sidebar-title">Бюджет</h6>
                          <div class="budget-info">
                            <i class="fas fa-ruble-sign mr-2"></i>
                            {{ formatCurrency(project.total_budget) }}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <div class="project-approval-footer">
                  <div class="footer-info">
                    <span class="stages-info">
                      <i class="fas fa-tasks mr-1"></i>
                      Этапов: {{ project.stages_count || 0 }}
                    </span>
                    <span class="results-info">
                      <i class="fas fa-trophy mr-1"></i>
                      Планируемых результатов: {{ project.planned_results?.length || 0 }}
                    </span>
                  </div>
                  
                  <div class="approval-actions">
                    <router-link
                      :to="`/crm/strategic-projects/project/${project.id}`"
                      class="btn btn-view"
                    >
                      <i class="fas fa-eye mr-2"></i>
                      Детальный просмотр
                    </router-link>
                    
                    <button
                      @click="showRejectModal(project)"
                      class="btn btn-reject"
                    >
                      <i class="fas fa-times mr-2"></i>
                      Отклонить
                    </button>
                    
                    <button
                      @click="approveProject(project)"
                      class="btn btn-approve"
                    >
                      <i class="fas fa-check mr-2"></i>
                      Утвердить проект
                    </button>
                  </div>
                </div>
              </div>
            </transition-group>
          </div>
        </div>
      </div>

      <!-- Модальное окно отклонения -->
      <div
        class="modal fade"
        id="rejectModal"
        tabindex="-1"
        role="dialog"
        aria-labelledby="rejectModalLabel"
        aria-hidden="true"
      >
        <div class="modal-dialog modal-lg" role="document">
          <div class="modal-content">
            <div class="modal-header">
              <h5 class="modal-title" id="rejectModalLabel">
                <i class="fas fa-times-circle mr-2"></i>
                Отклонение проекта
              </h5>
              <button type="button" class="close" @click="closeRejectModal" aria-label="Close">
                <span aria-hidden="true">&times;</span>
              </button>
            </div>
            <div class="modal-body">
              <div class="alert alert-warning">
                <i class="fas fa-exclamation-triangle mr-2"></i>
                Вы собираетесь отклонить проект: <strong>{{ selectedProject?.name }}</strong>
              </div>
              
              <div class="form-group">
                <label for="rejectReason">
                  Причина отклонения
                  <span class="text-danger">*</span>
                </label>
                <textarea
                  v-model="rejectComment"
                  id="rejectReason"
                  class="form-control"
                  rows="4"
                  placeholder="Укажите подробную причину отклонения проекта..."
                  required
                ></textarea>
                <small class="form-text text-muted">
                  Эта информация будет отправлена руководителю проекта
                </small>
              </div>
              
              <div class="form-group">
                <label>Рекомендации по доработке</label>
                <textarea
                  v-model="recommendations"
                  class="form-control"
                  rows="3"
                  placeholder="Укажите, что необходимо доработать для повторной подачи..."
                ></textarea>
              </div>
            </div>
            <div class="modal-footer">
              <button type="button" class="btn btn-secondary" @click="closeRejectModal">
                Отмена
              </button>
              <button
                type="button"
                class="btn btn-danger"
                @click="rejectProject"
                :disabled="!rejectComment || rejecting"
              >
                <span v-if="rejecting" class="spinner-border spinner-border-sm mr-2"></span>
                <i v-else class="fas fa-times mr-2"></i>
                Отклонить проект
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { ref, computed, onMounted } from 'vue'
import { apiClient } from '@/js/api/manager'
import { format } from 'date-fns'
import { ru } from 'date-fns/locale'

export default {
  name: 'ExpertApproval',
  
  setup() {
    const projectsForApproval = ref([])
    const loading = ref(false)
    const selectedProject = ref(null)
    const rejectComment = ref('')
    const recommendations = ref('')
    const rejecting = ref(false)
    
    const filters = ref({
      priority: '',
      dateRange: '',
      search: ''
    })
    
    // Загрузка проектов для утверждения
    const loadProjects = async () => {
      loading.value = true
      try {
        const response = await apiClient.get('/crm/strategic-projects/strategic-projects/', {
          params: { for_approval: true }
        })
        projectsForApproval.value = response.data
      } catch (error) {
        console.error('Ошибка загрузки проектов:', error)
        alert('Ошибка при загрузке проектов для утверждения')
      } finally {
        loading.value = false
      }
    }
    
    // Фильтрованные проекты
    const filteredProjects = computed(() => {
      let result = [...projectsForApproval.value]
      
      // Фильтр по приоритету
      if (filters.value.priority === 'urgent') {
        result = result.filter(p => isUrgentProject(p))
      } else if (filters.value.priority === 'normal') {
        result = result.filter(p => !isUrgentProject(p))
      }
      
      // Фильтр по дате
      if (filters.value.dateRange) {
        const now = new Date()
        result = result.filter(p => {
          const projectDate = new Date(p.created_at)
          switch (filters.value.dateRange) {
            case 'today':
              return projectDate.toDateString() === now.toDateString()
            case 'week':
              const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
              return projectDate >= weekAgo
            case 'month':
              const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
              return projectDate >= monthAgo
            default:
              return true
          }
        })
      }
      
      // Поиск
      if (filters.value.search) {
        const search = filters.value.search.toLowerCase()
        result = result.filter(p => 
          p.name.toLowerCase().includes(search) ||
          p.code.toLowerCase().includes(search) ||
          p.leader_name.toLowerCase().includes(search)
        )
      }
      
      return result
    })
    
    // Статистика
    const todayProjects = computed(() => {
      const today = new Date().toDateString()
      return projectsForApproval.value.filter(p => 
        new Date(p.created_at).toDateString() === today
      ).length
    })
    
    const urgentProjects = computed(() => {
      return projectsForApproval.value.filter(p => isUrgentProject(p)).length
    })
    
    // Проверка срочности проекта
    const isUrgentProject = (project) => {
      const daysWaiting = getDaysWaiting(project)
      return daysWaiting > 3 // Более 3 дней ожидания считается срочным
    }
    
    // Получение количества дней ожидания
    const getDaysWaiting = (project) => {
      const created = new Date(project.created_at)
      const now = new Date()
      const diffTime = now.getTime() - created.getTime()
      return Math.floor(diffTime / (1000 * 60 * 60 * 24))
    }
    
    // Получение длительности проекта
    const getProjectDuration = (project) => {
      if (!project.planned_start_date || !project.planned_end_date) return 0
      const start = new Date(project.planned_start_date)
      const end = new Date(project.planned_end_date)
      const diffTime = end.getTime() - start.getTime()
      return Math.ceil(diffTime / (1000 * 60 * 60 * 24))
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
    
    // Применение фильтров
    const applyFilters = () => {
      // Фильтры применяются автоматически через computed
    }
    
    // Утверждение проекта
    const approveProject = async (project) => {
      if (!confirm(`Утвердить проект "${project.name}"?`)) return
      
      try {
        await apiClient.post(`/crm/strategic-projects/strategic-projects/${project.id}/approve/`)
        alert('Проект успешно утвержден')
        
        // Удаляем проект из списка
        projectsForApproval.value = projectsForApproval.value.filter(p => p.id !== project.id)
      } catch (error) {
        console.error('Ошибка утверждения проекта:', error)
        alert('Ошибка при утверждении проекта')
      }
    }
    
    // Показать модальное окно отклонения
    const showRejectModal = (project) => {
      selectedProject.value = project
      rejectComment.value = ''
      recommendations.value = ''
      
      // Показываем модальное окно
      const modal = document.getElementById('rejectModal')
      if (modal) {
        modal.style.display = 'block'
        modal.classList.add('show')
        document.body.classList.add('modal-open')
        
        // Добавляем backdrop
        const backdrop = document.createElement('div')
        backdrop.className = 'modal-backdrop fade show'
        document.body.appendChild(backdrop)
      }
    }
    
    // Закрыть модальное окно
    const closeRejectModal = () => {
      const modal = document.getElementById('rejectModal')
      const backdrop = document.querySelector('.modal-backdrop')
      if (modal) {
        modal.style.display = 'none'
        modal.classList.remove('show')
        document.body.classList.remove('modal-open')
        if (backdrop) backdrop.remove()
      }
      
      selectedProject.value = null
      rejectComment.value = ''
      recommendations.value = ''
    }
    
    // Отклонение проекта
    const rejectProject = async () => {
      if (!selectedProject.value || !rejectComment.value) return
      
      rejecting.value = true
      try {
        let comment = rejectComment.value
        if (recommendations.value) {
          comment += '\n\nРекомендации по доработке:\n' + recommendations.value
        }
        
        await apiClient.post(
          `/crm/strategic-projects/strategic-projects/${selectedProject.value.id}/reject/`,
          { comment }
        )
        
        alert('Проект отклонен')
        
        // Удаляем проект из списка
        projectsForApproval.value = projectsForApproval.value.filter(
          p => p.id !== selectedProject.value.id
        )
        
        closeRejectModal()
      } catch (error) {
        console.error('Ошибка отклонения проекта:', error)
        alert('Ошибка при отклонении проекта')
      } finally {
        rejecting.value = false
      }
    }
    
    // Загрузка данных при монтировании
    onMounted(() => {
      loadProjects()
    })
    
    return {
      projectsForApproval,
      loading,
      filters,
      filteredProjects,
      todayProjects,
      urgentProjects,
      selectedProject,
      rejectComment,
      recommendations,
      rejecting,
      loadProjects,
      applyFilters,
      isUrgentProject,
      getDaysWaiting,
      getProjectDuration,
      formatDate,
      formatCurrency,
      approveProject,
      showRejectModal,
      closeRejectModal,
      rejectProject
    }
  }
}
</script>

<style scoped>
/* Основные стили */
.expert-approval {
  min-height: 100vh;
  background: linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%);
}

/* Герой секция */
.hero-section {
  background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%);
  color: white;
  padding: 3rem 0 2rem;
  margin-bottom: 2rem;
  position: relative;
  overflow: hidden;
}

.hero-section::before {
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
  display: flex;
  justify-content: space-between;
  align-items: center;
  position: relative;
  z-index: 2;
}

.hero-title {
  font-size: 2.5rem;
  font-weight: 700;
  margin: 0;
  display: flex;
  align-items: center;
  text-shadow: 0 2px 4px rgba(0,0,0,0.1);
}

.hero-subtitle {
  font-size: 1.1rem;
  opacity: 0.9;
  margin: 0.5rem 0 0;
}

.hero-stats {
  display: flex;
  gap: 2rem;
}

.stat-item {
  text-align: center;
  padding: 1rem;
  background: rgba(255,255,255,0.1);
  border-radius: 12px;
  backdrop-filter: blur(10px);
  border: 1px solid rgba(255,255,255,0.2);
}

.stat-number {
  font-size: 2rem;
  font-weight: 700;
  line-height: 1;
}

.stat-label {
  font-size: 0.9rem;
  opacity: 0.8;
  margin-top: 0.5rem;
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

/* Карточка фильтров */
.filter-card {
  background: white;
  border-radius: 16px;
  box-shadow: 0 8px 32px rgba(0,0,0,0.1);
  overflow: hidden;
  margin-bottom: 2rem;
}

.filter-header {
  background: linear-gradient(135deg, #6b7280 0%, #4b5563 100%);
  color: white;
  padding: 1rem 1.5rem;
}

.filter-title {
  margin: 0;
  font-size: 1.1rem;
  font-weight: 600;
}

.filter-body {
  padding: 1.5rem;
}

.filter-label {
  font-weight: 600;
  color: #374151;
  margin-bottom: 0.5rem;
  display: block;
}

/* Пустое состояние */
.empty-state-card {
  background: white;
  border-radius: 16px;
  padding: 4rem 2rem;
  text-align: center;
  box-shadow: 0 8px 32px rgba(0,0,0,0.1);
}

.empty-icon {
  font-size: 4rem;
  color: #d1d5db;
  margin-bottom: 1.5rem;
}

.empty-title {
  color: #374151;
  font-size: 1.5rem;
  font-weight: 600;
  margin-bottom: 0.5rem;
}

.empty-text {
  color: #6b7280;
  font-size: 1.1rem;
}

/* Карточки проектов */
.projects-list {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.project-approval-card {
  background: white;
  border-radius: 16px;
  box-shadow: 0 8px 32px rgba(0,0,0,0.1);
  overflow: hidden;
  transition: all 0.3s ease;
}

.project-approval-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 12px 40px rgba(0,0,0,0.15);
}

.project-approval-card.urgent {
  border: 2px solid #f59e0b;
}

.project-approval-header {
  padding: 1.5rem;
  border-bottom: 1px solid #f3f4f6;
}

.project-main-info {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 1rem;
}

.project-title {
  font-size: 1.25rem;
  font-weight: 600;
  color: #1f2937;
  margin: 0 0 0.5rem;
}

.project-code {
  font-size: 0.875rem;
  color: #6b7280;
  font-family: 'Monaco', 'Consolas', monospace;
  background: #f3f4f6;
  padding: 0.125rem 0.5rem;
  border-radius: 4px;
  margin-left: 0.5rem;
}

.project-meta {
  display: flex;
  gap: 1.5rem;
  flex-wrap: wrap;
}

.meta-item {
  font-size: 0.875rem;
  color: #6b7280;
  display: flex;
  align-items: center;
}

.meta-item strong {
  color: #374151;
  margin-left: 0.25rem;
}

.project-priority-badge {
  background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%);
  color: white;
  padding: 0.5rem 1rem;
  border-radius: 8px;
  font-weight: 600;
  display: flex;
  align-items: center;
  white-space: nowrap;
}

.project-approval-body {
  padding: 1.5rem;
}

.detail-section {
  margin-bottom: 1.5rem;
}

.detail-section:last-child {
  margin-bottom: 0;
}

.detail-title {
  font-size: 0.9rem;
  font-weight: 600;
  color: #374151;
  margin-bottom: 0.5rem;
  display: flex;
  align-items: center;
}

.detail-content {
  color: #6b7280;
  line-height: 1.6;
}

.project-sidebar {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.sidebar-section {
  background: #f9fafb;
  border-radius: 8px;
  padding: 1rem;
}

.sidebar-title {
  font-size: 0.875rem;
  font-weight: 600;
  color: #374151;
  margin-bottom: 0.75rem;
}

.participant-list,
.timeline-info {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.participant-item,
.timeline-item {
  font-size: 0.875rem;
  color: #6b7280;
  display: flex;
  align-items: center;
}

.budget-info {
  font-size: 1.25rem;
  font-weight: 600;
  color: #059669;
  display: flex;
  align-items: center;
}

.project-approval-footer {
  background: #f9fafb;
  padding: 1.5rem;
  display: flex;
  justify-content: space-between;
  align-items: center;
  border-top: 1px solid #e5e7eb;
}

.footer-info {
  display: flex;
  gap: 1.5rem;
}

.stages-info,
.results-info {
  font-size: 0.875rem;
  color: #6b7280;
  display: flex;
  align-items: center;
}

.approval-actions {
  display: flex;
  gap: 0.75rem;
}

/* Кнопки действий */
.btn-view,
.btn-reject,
.btn-approve {
  border: none;
  border-radius: 8px;
  padding: 0.75rem 1.5rem;
  font-weight: 600;
  display: inline-flex;
  align-items: center;
  transition: all 0.3s ease;
  cursor: pointer;
}

.btn-view {
  background: linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%);
  color: white;
  text-decoration: none;
}

.btn-view:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(139,92,246,0.3);
  color: white;
  text-decoration: none;
}

.btn-reject {
  background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%);
  color: white;
}

.btn-reject:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(239,68,68,0.3);
}

.btn-approve {
  background: linear-gradient(135deg, #10b981 0%, #059669 100%);
  color: white;
}

.btn-approve:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(16,185,129,0.3);
}

/* Анимация списка */
.project-list-enter-active,
.project-list-leave-active {
  transition: all 0.5s ease;
}

.project-list-enter-from {
  opacity: 0;
  transform: translateX(-30px);
}

.project-list-leave-to {
  opacity: 0;
  transform: translateX(30px);
}

/* Модальное окно */
.modal-content {
  border-radius: 16px;
  border: none;
}

.modal-header {
  background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%);
  color: white;
  border-radius: 16px 16px 0 0;
  border: none;
}

.modal-title {
  font-weight: 600;
  display: flex;
  align-items: center;
}

.close {
  color: white;
  opacity: 0.8;
  font-size: 1.5rem;
}

.close:hover {
  color: white;
  opacity: 1;
}

.alert {
  border-radius: 8px;
  border: none;
}

.form-control {
  border: 2px solid #e5e7eb;
  border-radius: 8px;
  transition: all 0.3s ease;
}

.form-control:focus {
  border-color: #ef4444;
  box-shadow: 0 0 0 3px rgba(239,68,68,0.1);
}

.btn {
  border-radius: 8px;
  font-weight: 600;
  padding: 0.75rem 1.5rem;
  transition: all 0.3s ease;
}

.btn-secondary {
  background: #6b7280;
  border: none;
}

.btn-danger {
  background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%);
  border: none;
}

.btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}
</style> 