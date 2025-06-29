<template>
  <div class="my-projects">
    <div class="container-fluid">
      <!-- Заголовок страницы -->
      <div class="row mb-4">
        <div class="col-12">
          <h1 class="h3 mb-3">Мои проекты</h1>
          <nav aria-label="breadcrumb">
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

      <!-- Фильтры и поиск -->
      <div class="row mb-4">
        <div class="col-12">
          <div class="card">
            <div class="card-body">
              <div class="row">
                <div class="col-md-3">
                  <div class="form-group mb-0">
                    <label>Статус проекта</label>
                    <select v-model="filters.status" class="form-control" @change="loadProjects">
                      <option value="">Все статусы</option>
                      <option value="draft">Черновик</option>
                      <option value="on_approval">На утверждении</option>
                      <option value="rejected">Отклонен</option>
                      <option value="approved">Утвержден</option>
                      <option value="in_progress">В работе</option>
                      <option value="completed">Завершен</option>
                    </select>
                  </div>
                </div>
                <div class="col-md-5">
                  <div class="form-group mb-0">
                    <label>Поиск</label>
                    <input
                      v-model="filters.search"
                      type="text"
                      class="form-control"
                      placeholder="Поиск по названию или коду проекта..."
                      @input="debounceSearch"
                    />
                  </div>
                </div>
                <div class="col-md-4">
                  <label>&nbsp;</label>
                  <div>
                    <router-link
                      v-if="canCreateProject"
                      to="/crm/strategic-projects/program-topics"
                      class="btn btn-primary"
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

      <!-- Статистика -->
      <div class="row mb-4">
        <div class="col-md-3">
          <div class="card border-left-secondary">
            <div class="card-body">
              <div class="text-xs font-weight-bold text-secondary text-uppercase mb-1">
                Черновики
              </div>
              <div class="h5 mb-0 font-weight-bold text-gray-800">{{ statistics.draft }}</div>
            </div>
          </div>
        </div>
        <div class="col-md-3">
          <div class="card border-left-warning">
            <div class="card-body">
              <div class="text-xs font-weight-bold text-warning text-uppercase mb-1">
                На рассмотрении
              </div>
              <div class="h5 mb-0 font-weight-bold text-gray-800">{{ statistics.on_approval }}</div>
            </div>
          </div>
        </div>
        <div class="col-md-3">
          <div class="card border-left-primary">
            <div class="card-body">
              <div class="text-xs font-weight-bold text-primary text-uppercase mb-1">
                В работе
              </div>
              <div class="h5 mb-0 font-weight-bold text-gray-800">{{ statistics.in_progress }}</div>
            </div>
          </div>
        </div>
        <div class="col-md-3">
          <div class="card border-left-success">
            <div class="card-body">
              <div class="text-xs font-weight-bold text-success text-uppercase mb-1">
                Завершено
              </div>
              <div class="h5 mb-0 font-weight-bold text-gray-800">{{ statistics.completed }}</div>
            </div>
          </div>
        </div>
      </div>

      <!-- Список проектов -->
      <div class="row">
        <div class="col-12">
          <div class="card">
            <div class="card-header">
              <h5 class="card-title mb-0">
                Список проектов
                <span v-if="projects.length > 0" class="badge badge-primary ml-2">
                  {{ projects.length }}
                </span>
              </h5>
            </div>
            <div class="card-body">
              <div v-if="loading" class="text-center py-4">
                <div class="spinner-border text-primary" role="status">
                  <span class="sr-only">Загрузка...</span>
                </div>
              </div>

              <div v-else-if="projects.length === 0" class="text-center py-4">
                <p class="text-muted mb-3">У вас пока нет проектов</p>
                <router-link
                  v-if="canCreateProject"
                  to="/crm/strategic-projects/program-topics"
                  class="btn btn-primary"
                >
                  <i class="fas fa-plus mr-2"></i>
                  Создать первый проект
                </router-link>
              </div>

              <div v-else>
                <div class="table-responsive">
                  <table class="table table-hover">
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
                      <tr v-for="project in paginatedProjects" :key="project.id">
                        <td>
                          <router-link :to="`/crm/strategic-projects/${project.id}`">
                            {{ project.code }}
                          </router-link>
                        </td>
                        <td>{{ project.name }}</td>
                        <td>
                          <span :class="getStatusBadgeClass(project.status)">
                            {{ getStatusLabel(project.status) }}
                          </span>
                        </td>
                        <td>
                          <div class="progress" style="min-width: 100px;">
                            <div
                              class="progress-bar"
                              :style="{ width: project.completion_percentage + '%' }"
                            >
                              {{ project.completion_percentage }}%
                            </div>
                          </div>
                        </td>
                        <td>
                          <small>
                            {{ formatDate(project.planned_start_date) }} -<br />
                            {{ formatDate(project.planned_end_date) }}
                          </small>
                        </td>
                        <td>{{ project.curator_name || '-' }}</td>
                        <td>
                          <div class="btn-group" role="group">
                            <router-link
                              :to="`/crm/strategic-projects/${project.id}`"
                              class="btn btn-sm btn-info"
                              title="Просмотр"
                            >
                              <i class="fas fa-eye"></i>
                            </router-link>
                            <router-link
                              v-if="canEditProject(project)"
                              :to="`/crm/strategic-projects/${project.id}/edit`"
                              class="btn btn-sm btn-primary"
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

                <!-- Пагинация -->
                <nav v-if="totalPages > 1" aria-label="Page navigation">
                  <ul class="pagination justify-content-center">
                    <li class="page-item" :class="{ disabled: currentPage === 1 }">
                      <a class="page-link" @click="currentPage--" href="#" tabindex="-1">
                        Предыдущая
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
                      <a class="page-link" @click="currentPage++" href="#">Следующая</a>
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
import { useUserStore } from '@/stores/userStore'
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
      getStatusLabel
    }
  }
}
</script>

<style scoped>
.my-projects {
  padding: 20px 0;
}

.border-left-secondary {
  border-left: 4px solid #6c757d;
}

.border-left-warning {
  border-left: 4px solid #ffc107;
}

.border-left-primary {
  border-left: 4px solid #007bff;
}

.border-left-success {
  border-left: 4px solid #28a745;
}

.progress {
  height: 20px;
}

.progress-bar {
  font-size: 12px;
  line-height: 20px;
}

.btn-group .btn {
  padding: 0.25rem 0.5rem;
}
</style>
