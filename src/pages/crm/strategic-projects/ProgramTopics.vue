<template>
  <div class="program-topics">
    <div class="container-fluid">
      <!-- Заголовок страницы -->
      <div class="row mb-4">
        <div class="col-12">
          <h1 class="h3 mb-3">Темы программы развития</h1>
          <nav aria-label="breadcrumb">
            <ol class="breadcrumb">
              <li class="breadcrumb-item"><router-link to="/">Главная</router-link></li>
              <li class="breadcrumb-item"><router-link to="/crm">CRM</router-link></li>
              <li class="breadcrumb-item">
                <router-link to="/crm/strategic-projects">Стратегические проекты</router-link>
              </li>
              <li class="breadcrumb-item active">Темы программы развития</li>
            </ol>
          </nav>
        </div>
      </div>

      <!-- Фильтры -->
      <div class="row mb-4">
        <div class="col-12">
          <div class="card">
            <div class="card-header">
              <h5 class="card-title mb-0">Фильтры</h5>
            </div>
            <div class="card-body">
              <div class="row">
                <div class="col-md-3">
                  <div class="form-group">
                    <label>Программа развития</label>
                    <select v-model="filters.programId" class="form-control">
                      <option value="">Все программы</option>
                      <option
                        v-for="program in developmentPrograms"
                        :key="program.id"
                        :value="program.id"
                      >
                        {{ program.name }} ({{ program.year }})
                      </option>
                    </select>
                  </div>
                </div>
                <div class="col-md-3">
                  <div class="form-group">
                    <label>Статус темы</label>
                    <select v-model="filters.status" class="form-control">
                      <option value="">Все темы</option>
                      <option value="free">Только свободные</option>
                      <option value="reserved">Только занятые</option>
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
                      placeholder="Поиск по названию, коду направления..."
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
      </div>

      <!-- Таблица тем -->
      <div class="row">
        <div class="col-12">
          <div class="card">
            <div class="card-header">
              <h5 class="card-title mb-0">
                Список тем
                <span v-if="filteredTopics.length" class="badge badge-primary ml-2">
                  {{ filteredTopics.length }}
                </span>
              </h5>
            </div>
            <div class="card-body">
              <div v-if="loading" class="text-center py-4">
                <div class="spinner-border text-primary" role="status">
                  <span class="sr-only">Загрузка...</span>
                </div>
              </div>

              <div v-else-if="filteredTopics.length === 0" class="text-center py-4">
                <p class="text-muted">Темы не найдены</p>
              </div>

              <div v-else class="table-responsive">
                <table class="table table-hover">
                  <thead>
                    <tr>
                      <th>Код направления</th>
                      <th>Номер темы</th>
                      <th>Наименование</th>
                      <th>Сроки реализации</th>
                      <th>Статус</th>
                      <th>Действия</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr v-for="topic in paginatedTopics" :key="topic.id">
                      <td>{{ topic.direction_code }}</td>
                      <td>{{ topic.topic_number }}</td>
                      <td>
                        <div>{{ topic.name }}</div>
                        <small v-if="topic.description" class="text-muted">
                          {{ topic.description }}
                        </small>
                      </td>
                      <td>
                        {{ formatDate(topic.planned_start_date) }} -
                        {{ formatDate(topic.planned_end_date) }}
                      </td>
                      <td>
                        <span
                          :class="topic.status === 'free' ? 'badge badge-success' : 'badge badge-secondary'"
                        >
                          {{ topic.status === 'free' ? 'Свободно' : 'Занято' }}
                        </span>
                      </td>
                      <td>
                        <button
                          v-if="topic.status === 'free'"
                          @click="showCreateProjectModal(topic)"
                          class="btn btn-sm btn-primary"
                        >
                          <i class="fas fa-plus mr-1"></i>
                          Создать проект
                        </button>
                        <router-link
                          v-else-if="topic.project"
                          :to="`/crm/strategic-projects/${topic.project}`"
                          class="btn btn-sm btn-info"
                        >
                          <i class="fas fa-eye mr-1"></i>
                          Просмотр проекта
                        </router-link>
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

      <!-- Модальное окно создания проекта -->
      <div
        class="modal fade"
        id="createProjectModal"
        tabindex="-1"
        role="dialog"
        aria-labelledby="createProjectModalLabel"
        aria-hidden="true"
      >
        <div class="modal-dialog modal-lg" role="document">
          <div class="modal-content">
            <div class="modal-header">
              <h5 class="modal-title" id="createProjectModalLabel">
                Создание проекта на основе темы
              </h5>
              <button type="button" class="close" @click="closeModal" aria-label="Close">
                <span aria-hidden="true">&times;</span>
              </button>
            </div>
            <div class="modal-body" v-if="selectedTopic">
              <div class="alert alert-info">
                <h6 class="alert-heading">Информация о теме:</h6>
                <p class="mb-0">
                  <strong>Код:</strong> {{ selectedTopic.direction_code }}-{{ selectedTopic.topic_number }}<br />
                  <strong>Название:</strong> {{ selectedTopic.name }}<br />
                  <strong>Сроки:</strong> {{ formatDate(selectedTopic.planned_start_date) }} -
                  {{ formatDate(selectedTopic.planned_end_date) }}
                </p>
              </div>
              <p>
                После создания проекта вы будете перенаправлены на страницу редактирования,
                где сможете заполнить все необходимые поля.
              </p>
              <div class="alert alert-warning">
                <i class="fas fa-exclamation-triangle mr-2"></i>
                Внимание! После создания проекта тема будет забронирована за вами.
              </div>
            </div>
            <div class="modal-footer">
              <button type="button" class="btn btn-secondary" @click="closeModal">
                Отмена
              </button>
              <button
                type="button"
                class="btn btn-primary"
                @click="createProject"
                :disabled="creatingProject"
              >
                <span v-if="creatingProject" class="spinner-border spinner-border-sm mr-2"></span>
                Создать проект
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
import { useRouter } from 'vue-router'
import { format } from 'date-fns'
import { ru } from 'date-fns/locale'
import { apiClient } from '@/js/api/manager'

export default {
  name: 'ProgramTopics',
  
  setup() {
    const router = useRouter()
    const topics = ref([])
    const developmentPrograms = ref([])
    const loading = ref(false)
    const selectedTopic = ref(null)
    const creatingProject = ref(false)
    const currentPage = ref(1)
    const itemsPerPage = ref(20)
    
    const filters = ref({
      programId: '',
      status: 'free',
      search: ''
    })
    
    // Загрузка программ развития
    const loadDevelopmentPrograms = async () => {
      try {
        const response = await apiClient.get('/crm/strategic-projects/development-programs/')
        developmentPrograms.value = response.data
      } catch (error) {
        console.error('Ошибка загрузки программ развития:', error)
      }
    }
    
    // Загрузка тем
    const loadTopics = async () => {
      loading.value = true
      try {
        const params = {}
        if (filters.value.programId) {
          params.program_id = filters.value.programId
        }
        if (filters.value.status) {
          params.status = filters.value.status
        }
        if (filters.value.search) {
          params.search = filters.value.search
        }
        
        const response = await apiClient.get('/crm/strategic-projects/program-topics/', params)
        topics.value = response.data
      } catch (error) {
        console.error('Ошибка загрузки тем:', error)
      } finally {
        loading.value = false
      }
    }
    
    // Фильтрованные темы
    const filteredTopics = computed(() => {
      return topics.value
    })
    
    // Пагинация
    const totalPages = computed(() => {
      return Math.ceil(filteredTopics.value.length / itemsPerPage.value)
    })
    
    const paginatedTopics = computed(() => {
      const start = (currentPage.value - 1) * itemsPerPage.value
      const end = start + itemsPerPage.value
      return filteredTopics.value.slice(start, end)
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
      loadTopics()
    }
    
    // Форматирование даты
    const formatDate = (dateString) => {
      if (!dateString) return '-'
      return format(new Date(dateString), 'dd.MM.yyyy', { locale: ru })
    }
    
    // Показать модальное окно создания проекта
    const showCreateProjectModal = (topic) => {
      selectedTopic.value = topic
      
      // Показ модального окна без jQuery
      const modal = document.getElementById('createProjectModal')
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
    const closeModal = () => {
      const modal = document.getElementById('createProjectModal')
      const backdrop = document.querySelector('.modal-backdrop')
      if (modal) {
        modal.style.display = 'none'
        modal.classList.remove('show')
        document.body.classList.remove('modal-open')
        if (backdrop) backdrop.remove()
      }
    }
    
    // Создание проекта
    const createProject = async () => {
      if (!selectedTopic.value) return
      
      creatingProject.value = true
      try {
        const response = await apiClient.post(
          `/crm/strategic-projects/program-topics/${selectedTopic.value.id}/reserve_and_create_project/`
        )
        
        // Закрытие модального окна без jQuery
        const modal = document.getElementById('createProjectModal')
        const backdrop = document.querySelector('.modal-backdrop')
        if (modal) {
          modal.style.display = 'none'
          modal.classList.remove('show')
          document.body.classList.remove('modal-open')
          if (backdrop) backdrop.remove()
        }
        
        // Перенаправление на страницу редактирования проекта
        router.push(`/crm/strategic-projects/${response.data.id}/edit`)
      } catch (error) {
        console.error('Ошибка создания проекта:', error)
        alert('Ошибка при создании проекта. Попробуйте еще раз.')
      } finally {
        creatingProject.value = false
      }
    }
    
    // Загрузка данных при монтировании
    onMounted(() => {
      loadDevelopmentPrograms()
      loadTopics()
    })
    
    return {
      topics,
      developmentPrograms,
      filters,
      loading,
      selectedTopic,
      creatingProject,
      currentPage,
      totalPages,
      filteredTopics,
      paginatedTopics,
      displayedPages,
      applyFilters,
      formatDate,
      showCreateProjectModal,
      closeModal,
      createProject
    }
  }
}
</script>

<style scoped>
.program-topics {
  padding: 20px 0;
}

.table td {
  vertical-align: middle;
}

.badge {
  font-size: 0.875rem;
}
</style> 