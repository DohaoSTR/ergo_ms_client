<template>
  <div class="projects-archive">
    <div class="container-fluid">
      <!-- Заголовок страницы -->
      <div class="page-header-gradient mb-4">
        <div class="row align-items-center">
          <div class="col-lg-8">
            <h1 class="page-title mb-2">
              <i class="fas fa-archive mr-3"></i>
              Архив проектов
            </h1>
            <nav aria-label="breadcrumb">
              <ol class="breadcrumb breadcrumb-transparent">
                <li class="breadcrumb-item"><router-link to="/">Главная</router-link></li>
                <li class="breadcrumb-item"><router-link to="/crm">CRM</router-link></li>
                <li class="breadcrumb-item">
                  <router-link to="/crm/strategic-projects">Стратегические проекты</router-link>
                </li>
                <li class="breadcrumb-item active">Архив</li>
              </ol>
            </nav>
          </div>
        </div>
      </div>

      <!-- Статистика архива -->
      <div class="row mb-4">
        <div class="col-lg-3 col-md-6 mb-3">
          <div class="stat-card">
            <div class="stat-icon bg-dark">
              <i class="fas fa-archive"></i>
            </div>
            <div class="stat-info">
              <div class="stat-label">Всего в архиве</div>
              <div class="stat-value">{{ archivedProjects.length }}</div>
            </div>
          </div>
        </div>
        <div class="col-lg-3 col-md-6 mb-3">
          <div class="stat-card">
            <div class="stat-icon bg-success">
              <i class="fas fa-check-circle"></i>
            </div>
            <div class="stat-info">
              <div class="stat-label">Успешно завершенных</div>
              <div class="stat-value">{{ completedCount }}</div>
            </div>
          </div>
        </div>
        <div class="col-lg-3 col-md-6 mb-3">
          <div class="stat-card">
            <div class="stat-icon bg-danger">
              <i class="fas fa-times-circle"></i>
            </div>
            <div class="stat-info">
              <div class="stat-label">Отмененных</div>
              <div class="stat-value">{{ cancelledCount }}</div>
            </div>
          </div>
        </div>
        <div class="col-lg-3 col-md-6 mb-3">
          <div class="stat-card">
            <div class="stat-icon bg-info">
              <i class="fas fa-calendar-alt"></i>
            </div>
            <div class="stat-info">
              <div class="stat-label">Средний срок проекта</div>
              <div class="stat-value">{{ averageDuration }} дней</div>
            </div>
          </div>
        </div>
      </div>

      <!-- Фильтры -->
      <div class="row mb-4">
        <div class="col-12">
          <div class="filters-section">
            <h5 class="section-title mb-3">
              <i class="fas fa-filter mr-2"></i>
              Фильтры
            </h5>
            <div class="row">
              <div class="col-md-3">
                <div class="form-group">
                  <label>Год архивации</label>
                  <select v-model="filters.year" class="form-control">
                    <option value="">Все годы</option>
                    <option v-for="year in availableYears" :key="year" :value="year">
                      {{ year }}
                    </option>
                  </select>
                </div>
              </div>
              <div class="col-md-3">
                <div class="form-group">
                  <label>Причина архивации</label>
                  <select v-model="filters.reason" class="form-control">
                    <option value="">Все причины</option>
                    <option value="completed">Успешно завершен</option>
                    <option value="cancelled">Отменен</option>
                    <option value="other">Другое</option>
                  </select>
                </div>
              </div>
              <div class="col-md-4">
                <div class="form-group">
                  <label>Поиск</label>
                  <input
                    v-model="filters.search"
                    type="text"
                    class="form-control"
                    placeholder="Поиск по названию, коду..."
                  />
                </div>
              </div>
              <div class="col-md-2">
                <div class="form-group">
                  <label>&nbsp;</label>
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

      <!-- Таблица архивных проектов -->
      <div class="row">
        <div class="col-12">
          <div class="archive-table-section">
            <div class="section-header">
              <h5 class="section-title">
                <i class="fas fa-list mr-2"></i>
                Архивные проекты
              </h5>
              <div class="section-actions">
                <button @click="exportArchive" class="btn btn-outline-primary btn-sm">
                  <i class="fas fa-download mr-1"></i>
                  Экспорт в Excel
                </button>
              </div>
            </div>
            
            <div v-if="loading" class="text-center py-5">
              <div class="spinner-border text-primary" role="status">
                <span class="sr-only">Загрузка...</span>
              </div>
            </div>

            <div v-else-if="filteredProjects.length === 0" class="text-center py-5">
              <div class="empty-state">
                <i class="fas fa-inbox fa-4x text-muted mb-3"></i>
                <p class="text-muted">Архивные проекты не найдены</p>
              </div>
            </div>

            <div v-else class="archive-list">
              <div 
                v-for="project in paginatedProjects" 
                :key="project.id"
                class="archive-item"
              >
                <div class="archive-item-header">
                  <div class="project-info">
                    <h6 class="project-title">
                      {{ project.name }}
                      <span class="project-code">{{ project.code }}</span>
                    </h6>
                    <div class="project-meta">
                      <span class="meta-item">
                        <i class="fas fa-user mr-1"></i>
                        Руководитель: {{ project.leader_name }}
                      </span>
                      <span class="meta-item">
                        <i class="fas fa-calendar mr-1"></i>
                        Период: {{ formatDate(project.actual_start_date) }} - {{ formatDate(project.actual_end_date) }}
                      </span>
                      <span class="meta-item">
                        <i class="fas fa-clock mr-1"></i>
                        Длительность: {{ getProjectDuration(project) }} дней
                      </span>
                    </div>
                  </div>
                  <div class="archive-status">
                    <span :class="getArchiveStatusClass(project.archive_reason)">
                      {{ getArchiveStatusLabel(project.archive_reason) }}
                    </span>
                  </div>
                </div>
                
                <div class="archive-item-body">
                  <div class="row">
                    <div class="col-md-6">
                      <div class="info-group">
                        <strong>Цель проекта:</strong>
                        <p class="mb-0">{{ project.goal }}</p>
                      </div>
                    </div>
                    <div class="col-md-3">
                      <div class="info-group">
                        <strong>Дата архивации:</strong>
                        <p class="mb-0">{{ formatDate(project.archived_at) }}</p>
                      </div>
                    </div>
                    <div class="col-md-3">
                      <div class="archive-actions">
                        <router-link 
                          :to="`/crm/strategic-projects/project/${project.id}`"
                          class="btn btn-sm btn-outline-primary"
                        >
                          <i class="fas fa-eye mr-1"></i>
                          Просмотр
                        </router-link>
                        <button 
                          @click="downloadProjectReport(project)"
                          class="btn btn-sm btn-outline-secondary ml-2"
                        >
                          <i class="fas fa-file-pdf mr-1"></i>
                          Отчет
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <!-- Пагинация -->
            <nav v-if="totalPages > 1" aria-label="Page navigation" class="mt-4">
              <ul class="pagination justify-content-center">
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
</template>

<script>
import { ref, computed, onMounted } from 'vue'
import { apiClient } from '@/js/api/manager'
import { format } from 'date-fns'
import { ru } from 'date-fns/locale'

export default {
  name: 'ProjectsArchive',
  
  setup() {
    const archivedProjects = ref([])
    const loading = ref(false)
    const currentPage = ref(1)
    const itemsPerPage = ref(10)
    
    const filters = ref({
      year: '',
      reason: '',
      search: ''
    })
    
    // Загрузка архивных проектов
    const loadArchivedProjects = async () => {
      loading.value = true
      try {
        const response = await apiClient.get('/crm/strategic-projects/strategic-projects/', {
          status: 'archived'
        })
        // Временные данные для демонстрации
        archivedProjects.value = [
          {
            id: 1,
            code: 'IT-001-2023-ИИП',
            name: 'Разработка системы мониторинга',
            leader_name: 'Иванов И.И.',
            goal: 'Создание автоматизированной системы мониторинга производственных процессов',
            actual_start_date: '2023-01-15',
            actual_end_date: '2023-11-30',
            archived_at: '2023-12-15',
            archive_reason: 'completed'
          },
          {
            id: 2,
            code: 'AN-002-2023-ППП',
            name: 'Оптимизация бизнес-процессов',
            leader_name: 'Петров П.П.',
            goal: 'Анализ и оптимизация основных бизнес-процессов компании',
            actual_start_date: '2023-03-01',
            actual_end_date: '2023-09-15',
            archived_at: '2023-09-30',
            archive_reason: 'cancelled'
          }
        ]
      } catch (error) {
        console.error('Ошибка загрузки архивных проектов:', error)
      } finally {
        loading.value = false
      }
    }
    
    // Фильтрованные проекты
    const filteredProjects = computed(() => {
      let result = [...archivedProjects.value]
      
      if (filters.value.year) {
        result = result.filter(p => 
          new Date(p.archived_at).getFullYear() === parseInt(filters.value.year)
        )
      }
      
      if (filters.value.reason) {
        result = result.filter(p => p.archive_reason === filters.value.reason)
      }
      
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
    const completedCount = computed(() => 
      archivedProjects.value.filter(p => p.archive_reason === 'completed').length
    )
    
    const cancelledCount = computed(() => 
      archivedProjects.value.filter(p => p.archive_reason === 'cancelled').length
    )
    
    const averageDuration = computed(() => {
      if (archivedProjects.value.length === 0) return 0
      
      const durations = archivedProjects.value.map(p => {
        const start = new Date(p.actual_start_date)
        const end = new Date(p.actual_end_date)
        return Math.floor((end - start) / (1000 * 60 * 60 * 24))
      })
      
      const sum = durations.reduce((a, b) => a + b, 0)
      return Math.round(sum / durations.length)
    })
    
    const availableYears = computed(() => {
      const years = new Set()
      archivedProjects.value.forEach(p => {
        years.add(new Date(p.archived_at).getFullYear())
      })
      return Array.from(years).sort((a, b) => b - a)
    })
    
    // Пагинация
    const totalPages = computed(() => {
      return Math.ceil(filteredProjects.value.length / itemsPerPage.value)
    })
    
    const paginatedProjects = computed(() => {
      const start = (currentPage.value - 1) * itemsPerPage.value
      const end = start + itemsPerPage.value
      return filteredProjects.value.slice(start, end)
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
    
    // Применение фильтров
    const applyFilters = () => {
      currentPage.value = 1
    }
    
    // Форматирование даты
    const formatDate = (dateString) => {
      if (!dateString) return '-'
      return format(new Date(dateString), 'dd.MM.yyyy', { locale: ru })
    }
    
    // Расчет длительности проекта
    const getProjectDuration = (project) => {
      if (!project.actual_start_date || !project.actual_end_date) return 0
      
      const start = new Date(project.actual_start_date)
      const end = new Date(project.actual_end_date)
      return Math.floor((end - start) / (1000 * 60 * 60 * 24))
    }
    
    // Получение класса статуса архивации
    const getArchiveStatusClass = (reason) => {
      const classes = {
        completed: 'badge badge-success',
        cancelled: 'badge badge-danger',
        other: 'badge badge-secondary'
      }
      return classes[reason] || 'badge badge-secondary'
    }
    
    // Получение метки статуса архивации
    const getArchiveStatusLabel = (reason) => {
      const labels = {
        completed: 'Завершен успешно',
        cancelled: 'Отменен',
        other: 'Другое'
      }
      return labels[reason] || 'Архивирован'
    }
    
    // Экспорт архива
    const exportArchive = () => {
      alert('Функция экспорта будет реализована позже')
    }
    
    // Скачивание отчета по проекту
    const downloadProjectReport = (project) => {
      alert(`Скачивание отчета по проекту ${project.code}`)
    }
    
    // Загрузка данных при монтировании
    onMounted(() => {
      loadArchivedProjects()
    })
    
    return {
      archivedProjects,
      loading,
      filters,
      filteredProjects,
      completedCount,
      cancelledCount,
      averageDuration,
      availableYears,
      currentPage,
      totalPages,
      paginatedProjects,
      displayedPages,
      applyFilters,
      formatDate,
      getProjectDuration,
      getArchiveStatusClass,
      getArchiveStatusLabel,
      exportArchive,
      downloadProjectReport
    }
  }
}
</script>

<style scoped>
.projects-archive {
  padding: 20px 0;
  background-color: #f8f9fc;
  min-height: 100vh;
}

/* Заголовок страницы */
.page-header-gradient {
  background: linear-gradient(135deg, #6c757d 0%, #495057 100%);
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

/* Карточки статистики */
.stat-card {
  background: white;
  border-radius: 12px;
  padding: 1.5rem;
  box-shadow: 0 5px 20px rgba(0, 0, 0, 0.08);
  display: flex;
  align-items: center;
  gap: 1rem;
  transition: transform 0.3s ease;
}

.stat-card:hover {
  transform: translateY(-5px);
}

.stat-icon {
  width: 60px;
  height: 60px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-size: 1.5rem;
}

.stat-label {
  font-size: 0.875rem;
  color: #6c757d;
  margin-bottom: 0.25rem;
}

.stat-value {
  font-size: 1.75rem;
  font-weight: 700;
  color: #2d3436;
}

/* Секция фильтров */
.filters-section {
  background: white;
  border-radius: 15px;
  padding: 2rem;
  box-shadow: 0 5px 20px rgba(0, 0, 0, 0.08);
}

.section-title {
  font-size: 1.25rem;
  font-weight: 600;
  color: #2d3436;
}

/* Таблица архива */
.archive-table-section {
  background: white;
  border-radius: 15px;
  box-shadow: 0 5px 20px rgba(0, 0, 0, 0.08);
  overflow: hidden;
}

.section-header {
  padding: 1.5rem;
  border-bottom: 1px solid #e9ecef;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

/* Список архивных проектов */
.archive-list {
  padding: 1.5rem;
}

.archive-item {
  background: #f8f9fa;
  border-radius: 12px;
  padding: 1.5rem;
  margin-bottom: 1rem;
  transition: all 0.3s ease;
}

.archive-item:hover {
  background: white;
  box-shadow: 0 5px 20px rgba(0, 0, 0, 0.08);
}

.archive-item-header {
  display: flex;
  justify-content: space-between;
  align-items: start;
  margin-bottom: 1rem;
}

.project-title {
  font-size: 1.125rem;
  font-weight: 600;
  color: #2d3436;
  margin-bottom: 0.5rem;
}

.project-code {
  font-size: 0.875rem;
  color: #6c757d;
  font-weight: 400;
  margin-left: 0.5rem;
}

.project-meta {
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

.archive-item-body {
  border-top: 1px solid #e9ecef;
  padding-top: 1rem;
}

.info-group {
  margin-bottom: 0.5rem;
}

.info-group strong {
  font-size: 0.875rem;
  color: #495057;
}

.info-group p {
  font-size: 0.875rem;
  color: #6c757d;
  margin-top: 0.25rem;
}

.archive-actions {
  display: flex;
  justify-content: flex-end;
  align-items: center;
}

/* Пустое состояние */
.empty-state {
  padding: 3rem;
}

/* Пагинация */
.pagination {
  margin: 0;
}

.page-link {
  border-radius: 8px;
  margin: 0 2px;
  color: #007bff;
  border: 1px solid #dee2e6;
}

.page-item.active .page-link {
  background-color: #007bff;
  border-color: #007bff;
}

/* Адаптивность */
@media (max-width: 768px) {
  .archive-item-header {
    flex-direction: column;
    gap: 1rem;
  }
  
  .project-meta {
    flex-direction: column;
    gap: 0.5rem;
  }
  
  .archive-actions {
    justify-content: start;
    margin-top: 1rem;
  }
}
</style> 