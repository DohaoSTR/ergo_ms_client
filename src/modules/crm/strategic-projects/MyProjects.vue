<template>
  <div class="my-projects">
    <!-- Красивый градиентный заголовок -->
    <div class="hero-section">
      <div class="container-fluid">
        <div class="row">
          <div class="col-12">
            <div class="hero-content">
              <div class="hero-text">
                <h1 class="hero-title">
                  <i class="fas fa-project-diagram mr-3"></i>
                  Мои проекты
                </h1>
                <p class="hero-subtitle">Управляйте вашими стратегическими проектами</p>
              </div>
              <div class="hero-stats">
                <div class="stat-item">
                  <div class="stat-number">{{ statistics.draft + statistics.on_approval + statistics.in_progress + statistics.completed }}</div>
                  <div class="stat-label">Всего проектов</div>
                </div>
                <div class="stat-item">
                  <div class="stat-number">{{ statistics.in_progress }}</div>
                  <div class="stat-label">В работе</div>
                </div>
                <div class="stat-item">
                  <div class="stat-number">{{ statistics.completed }}</div>
                  <div class="stat-label">Завершено</div>
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
                <li class="breadcrumb-item active">Мои проекты</li>
              </ol>
            </nav>
          </div>
        </div>
      </div>
    </div>

    <div class="container-fluid">

      <!-- Красивые фильтры -->
      <div class="row mb-4">
        <div class="col-12">
          <div class="filter-card">
            <div class="filter-header">
              <h5 class="filter-title">
                <i class="fas fa-filter mr-2"></i>
                Фильтры и поиск
              </h5>
            </div>
            <div class="filter-body">
              <div class="row align-items-end">
                <div class="col-md-3">
                  <div class="form-group">
                    <label class="filter-label">Статус проекта</label>
                    <div class="select-wrapper">
                      <select v-model="filters.status" class="form-control custom-select" @change="loadProjects">
                        <option value="">Все статусы</option>
                        <option value="draft">Черновик</option>
                        <option value="on_approval">На утверждении</option>
                        <option value="rejected">Отклонен</option>
                        <option value="approved">Утвержден</option>
                        <option value="in_progress">В работе</option>
                        <option value="completed">Завершен</option>
                      </select>
                      <i class="fas fa-chevron-down select-arrow"></i>
                    </div>
                  </div>
                </div>
                <div class="col-md-5">
                  <div class="form-group">
                    <label class="filter-label">Поиск</label>
                    <div class="search-wrapper">
                      <i class="fas fa-search search-icon"></i>
                      <input
                        v-model="filters.search"
                        type="text"
                        class="form-control search-input"
                        placeholder="Поиск по названию или коду проекта..."
                        @input="debounceSearch"
                      />
                    </div>
                  </div>
                </div>
                <div class="col-md-4">
                  <div class="form-group">
                    <router-link
                      v-if="canCreateProject"
                      to="/crm/strategic-projects/program-topics"
                      class="btn btn-create"
                    >
                      <i class="fas fa-plus mr-2"></i>
                      Создать новый проект
                    </router-link>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Красивая статистика -->
      <div class="row mb-4">
        <div class="col-md-3">
          <div class="stats-card stats-draft">
            <div class="stats-icon">
              <i class="fas fa-file-alt"></i>
            </div>
            <div class="stats-content">
              <div class="stats-number">{{ statistics.draft }}</div>
              <div class="stats-label">Черновики</div>
            </div>
            <div class="stats-chart">
              <div class="chart-line"></div>
            </div>
          </div>
        </div>
        <div class="col-md-3">
          <div class="stats-card stats-approval">
            <div class="stats-icon">
              <i class="fas fa-clock"></i>
            </div>
            <div class="stats-content">
              <div class="stats-number">{{ statistics.on_approval }}</div>
              <div class="stats-label">На рассмотрении</div>
            </div>
            <div class="stats-chart">
              <div class="chart-line"></div>
            </div>
          </div>
        </div>
        <div class="col-md-3">
          <div class="stats-card stats-progress">
            <div class="stats-icon">
              <i class="fas fa-play-circle"></i>
            </div>
            <div class="stats-content">
              <div class="stats-number">{{ statistics.in_progress }}</div>
              <div class="stats-label">В работе</div>
            </div>
            <div class="stats-chart">
              <div class="chart-line"></div>
            </div>
          </div>
        </div>
        <div class="col-md-3">
          <div class="stats-card stats-completed">
            <div class="stats-icon">
              <i class="fas fa-check-circle"></i>
            </div>
            <div class="stats-content">
              <div class="stats-number">{{ statistics.completed }}</div>
              <div class="stats-label">Завершено</div>
            </div>
            <div class="stats-chart">
              <div class="chart-line"></div>
            </div>
          </div>
        </div>
      </div>

      <!-- Красивая таблица проектов -->
      <div class="row">
        <div class="col-12">
          <div class="projects-card">
            <div class="projects-header">
              <h5 class="projects-title">
                <i class="fas fa-list mr-2"></i>
                Список проектов
                <span v-if="projects.length > 0" class="projects-count">
                  {{ projects.length }}
                </span>
              </h5>
            </div>
            <div class="projects-body">
              <div v-if="loading" class="loading-state">
                <div class="spinner-wrapper">
                  <div class="spinner-border" role="status">
                    <span class="sr-only">Загрузка...</span>
                  </div>
                  <p class="loading-text">Загружаем ваши проекты...</p>
                </div>
              </div>

              <div v-else-if="projects.length === 0" class="empty-state">
                <div class="empty-icon">
                  <i class="fas fa-folder-open"></i>
                </div>
                <h4 class="empty-title">У вас пока нет проектов</h4>
                <p class="empty-text">Создайте свой первый стратегический проект</p>
                <router-link
                  v-if="canCreateProject"
                  to="/crm/strategic-projects/program-topics"
                  class="btn btn-create"
                >
                  <i class="fas fa-plus mr-2"></i>
                  Создать первый проект
                </router-link>
              </div>

              <div v-else class="projects-table-wrapper">
                <div class="table-responsive">
                  <table class="table projects-table">
                    <thead>
                      <tr>
                        <th>Код проекта</th>
                        <th>Название</th>
                        <th>Статус</th>
                        <th>Прогресс</th>
                        <th>Сроки</th>
                        <th>Куратор</th>
                        <th>Действия</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr v-for="project in paginatedProjects" :key="project.id" class="project-row">
                        <td>
                          <router-link :to="`/crm/strategic-projects/project/${project.id}`" class="project-code">
                            {{ project.code }}
                          </router-link>
                        </td>
                        <td>
                          <div class="project-name">{{ project.name }}</div>
                        </td>
                        <td>
                          <span :class="getStatusBadgeClass(project.status)" class="status-badge">
                            <i :class="getStatusIcon(project.status)" class="mr-1"></i>
                            {{ getStatusLabel(project.status) }}
                          </span>
                        </td>
                        <td>
                          <div class="progress-wrapper">
                            <div class="progress custom-progress">
                              <div
                                class="progress-bar"
                                :class="getProgressBarClass(project.completion_percentage)"
                                :style="{ width: project.completion_percentage + '%' }"
                              >
                                <span class="progress-text">{{ project.completion_percentage }}%</span>
                              </div>
                            </div>
                          </div>
                        </td>
                        <td>
                          <div class="project-dates">
                            <div class="date-item">
                              <i class="fas fa-play text-success mr-1"></i>
                              {{ formatDate(project.planned_start_date) }}
                            </div>
                            <div class="date-item">
                              <i class="fas fa-flag text-danger mr-1"></i>
                              {{ formatDate(project.planned_end_date) }}
                            </div>
                          </div>
                        </td>
                        <td>
                          <div class="curator-info">
                            <i class="fas fa-user-tie mr-1"></i>
                            {{ project.curator_name || 'Не назначен' }}
                          </div>
                        </td>
                        <td>
                          <div class="action-buttons">
                            <router-link
                              :to="`/crm/strategic-projects/project/${project.id}`"
                              class="btn btn-action btn-view"
                              title="Просмотр"
                            >
                              <i class="fas fa-eye"></i>
                            </router-link>
                            <router-link
                              v-if="canEditProject(project)"
                              :to="`/crm/strategic-projects/project/${project.id}/edit`"
                              class="btn btn-action btn-edit"
                              title="Редактировать"
                            >
                              <i class="fas fa-edit"></i>
                            </router-link>
                          </div>
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>

                <!-- Стильная пагинация -->
                <nav v-if="totalPages > 1" class="pagination-wrapper">
                  <ul class="pagination custom-pagination">
                    <li class="page-item" :class="{ disabled: currentPage === 1 }">
                      <a class="page-link" @click="currentPage--" href="#" tabindex="-1">
                        <i class="fas fa-chevron-left"></i>
                      </a>
                    </li>
                    <li
                      v-for="page in displayedPages"
                      :key="page"
                      class="page-item"
                      :class="{ active: page === currentPage }"
                    >
                      <a class="page-link" @click="currentPage = page" href="#">{{ page }}</a>
                    </li>
                    <li class="page-item" :class="{ disabled: currentPage === totalPages }">
                      <a class="page-link" @click="currentPage++" href="#">
                        <i class="fas fa-chevron-right"></i>
                      </a>
                    </li>
                  </ul>
                </nav>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { ref, computed, onMounted, watch } from 'vue'
import { useUserStore } from '@/modules/cms/js/userStore'
import { format } from 'date-fns'
import { ru } from 'date-fns/locale'
import { apiClient } from '@/js/api/manager'

export default {
  name: 'MyProjects',
  
  setup() {
    const userStore = useUserStore()
    const projects = ref([])
    const loading = ref(false)
    const currentPage = ref(1)
    const itemsPerPage = ref(10)
    
    const filters = ref({
      status: '',
      search: ''
    })
    
    const statistics = ref({
      draft: 0,
      on_approval: 0,
      in_progress: 0,
      completed: 0
    })
    
    // Проверка прав пользователя
    const canCreateProject = computed(() => {
      // Временно даем права всем авторизованным пользователям
      // TODO: Реализовать систему ролей
      return userStore.isAuthenticated
    })
    
    // Загрузка проектов
    const loadProjects = async () => {
      loading.value = true
      try {
        const params = {
          my_projects: true
        }
        
        if (filters.value.status) {
          params.status = filters.value.status
        }
        
        if (filters.value.search) {
          params.search = filters.value.search
        }
        
        const response = await apiClient.get('/crm/strategic-projects/strategic-projects/', params)
        projects.value = response.data
        
        // Обновление статистики
        calculateStatistics()
        
      } catch (error) {
        console.error('Ошибка загрузки проектов:', error)
      } finally {
        loading.value = false
      }
    }
    
    // Расчет статистики
    const calculateStatistics = () => {
      statistics.value = {
        draft: projects.value.filter(p => p.status === 'draft').length,
        on_approval: projects.value.filter(p => p.status === 'on_approval').length,
        in_progress: projects.value.filter(p => p.status === 'in_progress').length,
        completed: projects.value.filter(p => p.status === 'completed').length
      }
    }
    
    // Дебаунс для поиска
    let searchTimeout = null
    const debounceSearch = () => {
      clearTimeout(searchTimeout)
      searchTimeout = setTimeout(() => {
        currentPage.value = 1
        loadProjects()
      }, 500)
    }
    
    // Пагинация
    const totalPages = computed(() => {
      return Math.ceil(projects.value.length / itemsPerPage.value)
    })
    
    const paginatedProjects = computed(() => {
      const start = (currentPage.value - 1) * itemsPerPage.value
      const end = start + itemsPerPage.value
      return projects.value.slice(start, end)
    })
    
    const displayedPages = computed(() => {
      const pages = []
      const maxPages = 5
      let startPage = Math.max(1, currentPage.value - Math.floor(maxPages / 2))
      let endPage = Math.min(totalPages.value, startPage + maxPages - 1)
      
      if (endPage - startPage < maxPages - 1) {
        startPage = Math.max(1, endPage - maxPages + 1)
      }
      
      for (let i = startPage; i <= endPage; i++) {
        pages.push(i)
      }
      
      return pages
    })
    
    // Проверка возможности редактирования проекта
    const canEditProject = (project) => {
      return ['draft', 'rejected'].includes(project.status)
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
    
    // Следим за изменением страницы
    watch(currentPage, () => {
      window.scrollTo(0, 0)
    })
    
    // Загрузка данных при монтировании
    onMounted(() => {
      loadProjects()
    })
    
    // Добавляю метод для иконок статусов
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

    // Добавляю метод для классов прогресс-бара
    const getProgressBarClass = (percentage) => {
      if (percentage >= 80) return 'bg-success'
      if (percentage >= 60) return 'bg-info'
      if (percentage >= 40) return 'bg-warning'
      return 'bg-danger'
    }

    return {
      projects,
      loading,
      filters,
      statistics,
      currentPage,
      totalPages,
      paginatedProjects,
      displayedPages,
      canCreateProject,
      loadProjects,
      debounceSearch,
      canEditProject,
      formatDate,
      getStatusBadgeClass,
      getStatusLabel,
      getStatusIcon,
      getProgressBarClass
    }
  }
}
</script>

<style scoped>
/* Основные стили */
.my-projects {
  min-height: 100vh;
  background: linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%);
}

/* Герой секция */
.hero-section {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
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
  border: none;
  transition: all 0.3s ease;
}

.filter-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 12px 40px rgba(0,0,0,0.15);
}

.filter-header {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
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

/* Кастомный селект */
.select-wrapper {
  position: relative;
}

.custom-select {
  appearance: none;
  background: white;
  border: 2px solid #e5e7eb;
  border-radius: 8px;
  padding: 0.75rem 2.5rem 0.75rem 1rem;
  font-size: 0.95rem;
  transition: all 0.3s ease;
  cursor: pointer;
}

.custom-select:focus {
  border-color: #667eea;
  box-shadow: 0 0 0 3px rgba(102,126,234,0.1);
  outline: none;
}

.select-arrow {
  position: absolute;
  right: 1rem;
  top: 50%;
  transform: translateY(-50%);
  color: #6b7280;
  pointer-events: none;
  transition: all 0.3s ease;
}

.custom-select:focus + .select-arrow {
  color: #667eea;
}

/* Поиск */
.search-wrapper {
  position: relative;
}

.search-icon {
  position: absolute;
  left: 1rem;
  top: 50%;
  transform: translateY(-50%);
  color: #6b7280;
  z-index: 2;
}

.search-input {
  padding-left: 2.5rem;
  border: 2px solid #e5e7eb;
  border-radius: 8px;
  padding-top: 0.75rem;
  padding-bottom: 0.75rem;
  font-size: 0.95rem;
  transition: all 0.3s ease;
}

.search-input:focus {
  border-color: #667eea;
  box-shadow: 0 0 0 3px rgba(102,126,234,0.1);
  outline: none;
}

/* Кнопка создания */
.btn-create {
  background: linear-gradient(135deg, #10b981 0%, #059669 100%);
  border: none;
  border-radius: 8px;
  padding: 0.75rem 1.5rem;
  color: white;
  font-weight: 600;
  text-decoration: none;
  display: inline-flex;
  align-items: center;
  transition: all 0.3s ease;
  box-shadow: 0 4px 12px rgba(16,185,129,0.3);
}

.btn-create:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 20px rgba(16,185,129,0.4);
  color: white;
  text-decoration: none;
}

/* Карточки статистики */
.stats-card {
  background: white;
  border-radius: 16px;
  padding: 1.5rem;
  box-shadow: 0 8px 32px rgba(0,0,0,0.1);
  border: none;
  position: relative;
  overflow: hidden;
  transition: all 0.3s ease;
  height: 120px;
  display: flex;
  align-items: center;
  gap: 1rem;
}

.stats-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 12px 40px rgba(0,0,0,0.15);
}

.stats-icon {
  width: 60px;
  height: 60px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.5rem;
  color: white;
  flex-shrink: 0;
}

.stats-draft .stats-icon {
  background: linear-gradient(135deg, #6b7280, #4b5563);
}

.stats-approval .stats-icon {
  background: linear-gradient(135deg, #f59e0b, #d97706);
}

.stats-progress .stats-icon {
  background: linear-gradient(135deg, #3b82f6, #2563eb);
}

.stats-completed .stats-icon {
  background: linear-gradient(135deg, #10b981, #059669);
}

.stats-content {
  flex: 1;
}

.stats-number {
  font-size: 2rem;
  font-weight: 700;
  color: #1f2937;
  line-height: 1;
  margin-bottom: 0.25rem;
}

.stats-label {
  font-size: 0.875rem;
  color: #6b7280;
  font-weight: 500;
}

.stats-chart {
  position: absolute;
  bottom: 0;
  right: 0;
  width: 40px;
  height: 20px;
  opacity: 0.1;
  overflow: hidden;
}

.chart-line {
  width: 100%;
  height: 100%;
  background: linear-gradient(45deg, currentColor 0%, transparent 100%);
}

/* Карточка проектов */
.projects-card {
  background: white;
  border-radius: 16px;
  box-shadow: 0 8px 32px rgba(0,0,0,0.1);
  overflow: hidden;
  border: none;
}

.projects-header {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  padding: 1.5rem;
}

.projects-title {
  margin: 0;
  font-size: 1.25rem;
  font-weight: 600;
  display: flex;
  align-items: center;
}

.projects-count {
  background: rgba(255,255,255,0.2);
  color: white;
  padding: 0.25rem 0.75rem;
  border-radius: 12px;
  font-size: 0.875rem;
  margin-left: 1rem;
}

.projects-body {
  padding: 0;
}

/* Состояния загрузки и пустое состояние */
.loading-state {
  text-align: center;
  padding: 4rem 2rem;
}

.spinner-wrapper {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 1rem;
}

.spinner-border {
  width: 3rem;
  height: 3rem;
  color: #667eea;
}

.loading-text {
  color: #6b7280;
  font-size: 1.1rem;
  margin: 0;
}

.empty-state {
  text-align: center;
  padding: 4rem 2rem;
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
  margin-bottom: 2rem;
}

/* Таблица проектов */
.projects-table-wrapper {
  overflow: hidden;
}

.projects-table {
  margin: 0;
  border: none;
}

.projects-table thead th {
  background: #f9fafb;
  border: none;
  color: #374151;
  font-weight: 600;
  padding: 1rem 1.5rem;
  font-size: 0.875rem;
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.projects-table tbody .project-row {
  border: none;
  transition: all 0.3s ease;
}

.projects-table tbody .project-row:hover {
  background: #f8fafc;
  transform: scale(1.01);
}

.projects-table tbody td {
  padding: 1.25rem 1.5rem;
  border: none;
  border-bottom: 1px solid #f3f4f6;
  vertical-align: middle;
}

.project-code {
  font-weight: 600;
  color: #667eea;
  text-decoration: none;
  font-family: 'Monaco', 'Consolas', monospace;
  background: #f3f4f6;
  padding: 0.25rem 0.5rem;
  border-radius: 4px;
  display: inline-block;
}

.project-code:hover {
  color: #5a67d8;
  text-decoration: none;
  background: #e5e7eb;
}

.project-name {
  font-weight: 500;
  color: #1f2937;
  line-height: 1.4;
}

.status-badge {
  display: inline-flex;
  align-items: center;
  padding: 0.5rem 0.75rem;
  border-radius: 12px;
  font-size: 0.875rem;
  font-weight: 500;
  border: none;
}

.progress-wrapper {
  min-width: 120px;
}

.custom-progress {
  height: 8px;
  border-radius: 12px;
  background: #f3f4f6;
  overflow: hidden;
}

.custom-progress .progress-bar {
  border-radius: 12px;
  transition: all 0.3s ease;
  position: relative;
  overflow: hidden;
}

.progress-text {
  position: absolute;
  top: -24px;
  left: 50%;
  transform: translateX(-50%);
  font-size: 0.75rem;
  font-weight: 600;
  color: #374151;
  white-space: nowrap;
}

.project-dates {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.date-item {
  display: flex;
  align-items: center;
  font-size: 0.875rem;
  color: #6b7280;
}

.curator-info {
  display: flex;
  align-items: center;
  font-size: 0.875rem;
  color: #374151;
}

/* Кнопки действий */
.action-buttons {
  display: flex;
  gap: 0.5rem;
}

.btn-action {
  width: 36px;
  height: 36px;
  border-radius: 8px;
  border: none;
  display: flex;
  align-items: center;
  justify-content: center;
  text-decoration: none;
  transition: all 0.3s ease;
  font-size: 0.875rem;
}

.btn-view {
  background: linear-gradient(135deg, #06b6d4, #0891b2);
  color: white;
  box-shadow: 0 2px 8px rgba(6,182,212,0.3);
}

.btn-view:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(6,182,212,0.4);
  color: white;
  text-decoration: none;
}

.btn-edit {
  background: linear-gradient(135deg, #8b5cf6, #7c3aed);
  color: white;
  box-shadow: 0 2px 8px rgba(139,92,246,0.3);
}

.btn-edit:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(139,92,246,0.4);
  color: white;
  text-decoration: none;
}

/* Пагинация */
.pagination-wrapper {
  padding: 2rem 0;
  border-top: 1px solid #f3f4f6;
  margin-top: 1rem;
  display: flex;
  justify-content: center;
}

.custom-pagination {
  margin: 0;
}

.custom-pagination .page-item .page-link {
  border: none;
  color: #6b7280;
  padding: 0.75rem 1rem;
  margin: 0 0.125rem;
  border-radius: 8px;
  font-weight: 500;
  transition: all 0.3s ease;
}

.custom-pagination .page-item .page-link:hover {
  background: #f3f4f6;
  color: #374151;
  transform: translateY(-1px);
}

.custom-pagination .page-item.active .page-link {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  box-shadow: 0 4px 12px rgba(102,126,234,0.3);
}

.custom-pagination .page-item.disabled .page-link {
  color: #d1d5db;
  cursor: not-allowed;
}

.custom-pagination .page-item.disabled .page-link:hover {
  background: transparent;
  transform: none;
}

/* Адаптивность */
@media (max-width: 768px) {
  .hero-content {
    flex-direction: column;
    gap: 2rem;
    text-align: center;
  }

  .hero-stats {
    flex-wrap: wrap;
    justify-content: center;
    gap: 1rem;
  }

  .stat-item {
    min-width: 120px;
  }

  .hero-title {
    font-size: 2rem;
  }

  .filter-body .row {
    gap: 1rem;
  }

  .filter-body .col-md-3,
  .filter-body .col-md-5,
  .filter-body .col-md-4 {
    flex: 0 0 100%;
    max-width: 100%;
  }

  .stats-card {
    margin-bottom: 1rem;
  }

  .projects-table {
    font-size: 0.875rem;
  }

  .projects-table thead th,
  .projects-table tbody td {
    padding: 0.75rem 1rem;
  }

  .action-buttons {
    flex-direction: column;
    gap: 0.25rem;
  }
}

@media (max-width: 576px) {
  .projects-table {
    font-size: 0.8rem;
  }
  
  .hero-section {
    padding: 2rem 0 1.5rem;
  }
  
  .hero-title {
    font-size: 1.75rem;
  }
  
  .stat-number {
    font-size: 1.5rem;
  }
}
</style>
