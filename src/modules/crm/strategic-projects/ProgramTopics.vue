<template>
  <div class="program-topics">
    <!-- Красивый градиентный заголовок -->
    <div class="hero-section">
      <div class="container-fluid">
        <div class="row">
          <div class="col-12">
            <div class="hero-content">
              <div class="hero-text">
                <h1 class="hero-title">
                  <i class="fas fa-lightbulb mr-3"></i>
                  Темы программы развития
                </h1>
                <p class="hero-subtitle">Выберите тему для создания нового стратегического проекта</p>
              </div>
              <div class="hero-stats">
                <div class="stat-item">
                  <div class="stat-number">{{ filteredTopics.length }}</div>
                  <div class="stat-label">Всего тем</div>
                </div>
                <div class="stat-item">
                  <div class="stat-number">{{ getFreeTopicsCount() }}</div>
                  <div class="stat-label">Доступно</div>
                </div>
                <div class="stat-item">
                  <div class="stat-number">{{ getReservedTopicsCount() }}</div>
                  <div class="stat-label">Занято</div>
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
                <li class="breadcrumb-item active">Темы программы развития</li>
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
                <i class="fas fa-sliders-h mr-2"></i>
                Фильтры поиска
              </h5>
            </div>
            <div class="filter-body">
              <div class="row align-items-end">
                <div class="col-md-3">
                  <div class="form-group">
                    <label class="filter-label">Программа развития</label>
                    <div class="select-wrapper">
                      <select v-model="filters.programId" class="form-control custom-select">
                        <option value="">Все программы</option>
                        <option
                          v-for="program in developmentPrograms"
                          :key="program.id"
                          :value="program.id"
                        >
                          {{ program.name }} ({{ program.year }})
                        </option>
                      </select>
                      <i class="fas fa-chevron-down select-arrow"></i>
                    </div>
                  </div>
                </div>
                <div class="col-md-3">
                  <div class="form-group">
                    <label class="filter-label">Статус темы</label>
                    <div class="select-wrapper">
                      <select v-model="filters.status" class="form-control custom-select">
                        <option value="">Все темы</option>
                        <option value="free">Только свободные</option>
                        <option value="reserved">Только занятые</option>
                      </select>
                      <i class="fas fa-chevron-down select-arrow"></i>
                    </div>
                  </div>
                </div>
                <div class="col-md-4">
                  <div class="form-group">
                    <label class="filter-label">Поиск</label>
                    <div class="search-wrapper">
                      <i class="fas fa-search search-icon"></i>
                      <input
                        v-model="filters.search"
                        type="text"
                        class="form-control search-input"
                        placeholder="Поиск по названию, коду направления..."
                      />
                    </div>
                  </div>
                </div>
                <div class="col-md-2">
                  <div class="form-group">
                    <button @click="applyFilters" class="btn btn-apply">
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

      <!-- Красивая таблица тем -->
      <div class="row">
        <div class="col-12">
          <div class="topics-card">
            <div class="topics-header">
              <h5 class="topics-title">
                <i class="fas fa-list-ul mr-2"></i>
                Список тем
                <span v-if="filteredTopics.length" class="topics-count">
                  {{ filteredTopics.length }}
                </span>
              </h5>
            </div>
            <div class="topics-body">
              <div v-if="loading" class="loading-state">
                <div class="spinner-wrapper">
                  <div class="spinner-border" role="status">
                    <span class="sr-only">Загрузка...</span>
                  </div>
                  <p class="loading-text">Загружаем темы программы...</p>
                </div>
              </div>

              <div v-else-if="filteredTopics.length === 0" class="empty-state">
                <div class="empty-icon">
                  <i class="fas fa-search"></i>
                </div>
                <h4 class="empty-title">Темы не найдены</h4>
                <p class="empty-text">Попробуйте изменить критерии поиска</p>
              </div>

              <div v-else class="topics-grid">
                <div v-for="topic in paginatedTopics" :key="topic.id" class="topic-card">
                  <div class="topic-header">
                    <div class="topic-code">
                      <span class="direction-code">{{ topic.direction_code }}</span>
                      <span class="topic-number">#{{ topic.topic_number }}</span>
                    </div>
                    <div class="topic-status">
                      <span :class="getTopicStatusClass(topic.status)" class="status-badge">
                        <i :class="getTopicStatusIcon(topic.status)" class="mr-1"></i>
                        {{ getTopicStatusLabel(topic.status) }}
                      </span>
                    </div>
                  </div>
                  
                  <div class="topic-content">
                    <h6 class="topic-title">{{ topic.name }}</h6>
                    <p v-if="topic.description" class="topic-description">
                      {{ topic.description }}
                    </p>
                    
                    <div class="topic-dates">
                      <div class="date-item">
                        <i class="fas fa-calendar-alt mr-1"></i>
                        {{ formatDate(topic.planned_start_date) }} - {{ formatDate(topic.planned_end_date) }}
                      </div>
                      <div class="duration-item">
                        <i class="fas fa-clock mr-1"></i>
                        {{ getTopicDuration(topic) }} дней
                      </div>
                    </div>
                  </div>
                  
                  <div class="topic-actions">
                    <button
                      v-if="topic.status === 'free'"
                      @click="showCreateProjectModal(topic)"
                      class="btn btn-create-project"
                    >
                      <i class="fas fa-plus mr-2"></i>
                      Создать проект
                    </button>
                    <router-link
                      v-else-if="topic.project"
                      :to="`/crm/strategic-projects/project/${topic.project}`"
                      class="btn btn-view-project"
                    >
                      <i class="fas fa-eye mr-2"></i>
                      Просмотр проекта
                    </router-link>
                  </div>
                </div>
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

      <!-- Красивое модальное окно создания проекта -->
      <div
        class="modal fade"
        id="createProjectModal"
        tabindex="-1"
        role="dialog"
        aria-labelledby="createProjectModalLabel"
        aria-hidden="true"
      >
        <div class="modal-dialog modal-lg" role="document">
          <div class="modal-content custom-modal">
            <div class="modal-header custom-modal-header">
              <div class="modal-title-container">
                <h5 class="modal-title" id="createProjectModalLabel">
                  <i class="fas fa-plus-circle mr-2"></i>
                  Создание проекта на основе темы
                </h5>
              </div>
              <button type="button" class="btn-close" @click="closeModal" aria-label="Close">
                <i class="fas fa-times"></i>
              </button>
            </div>
            <div class="modal-body custom-modal-body" v-if="selectedTopic">
              <div class="topic-info-card">
                <div class="info-header">
                  <i class="fas fa-info-circle mr-2"></i>
                  Информация о теме
                </div>
                <div class="info-content">
                  <div class="info-row">
                    <span class="info-label">Код:</span>
                    <span class="info-value">{{ selectedTopic.direction_code }}-{{ selectedTopic.topic_number }}</span>
                  </div>
                  <div class="info-row">
                    <span class="info-label">Название:</span>
                    <span class="info-value">{{ selectedTopic.name }}</span>
                  </div>
                  <div class="info-row">
                    <span class="info-label">Сроки:</span>
                    <span class="info-value">
                      {{ formatDate(selectedTopic.planned_start_date) }} - {{ formatDate(selectedTopic.planned_end_date) }}
                    </span>
                  </div>
                </div>
              </div>
              
              <div class="instruction-card">
                <p class="instruction-text">
                  После создания проекта вы будете перенаправлены на страницу редактирования,
                  где сможете заполнить все необходимые поля.
                </p>
              </div>
              
              <div class="warning-card">
                <div class="warning-icon">
                  <i class="fas fa-exclamation-triangle"></i>
                </div>
                <div class="warning-text">
                  <strong>Внимание!</strong> После создания проекта тема будет забронирована за вами.
                </div>
              </div>
            </div>
            <div class="modal-footer custom-modal-footer">
              <button type="button" class="btn btn-cancel" @click="closeModal">
                <i class="fas fa-times mr-2"></i>
                Отмена
              </button>
              <button
                type="button"
                class="btn btn-create"
                @click="createProject"
                :disabled="creatingProject"
              >
                <span v-if="creatingProject" class="spinner-border spinner-border-sm mr-2"></span>
                <i v-else class="fas fa-plus mr-2"></i>
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
        router.push(`/crm/strategic-projects/project/${response.data.id}/edit`)
      } catch (error) {
        console.error('Ошибка создания проекта:', error)
        alert('Ошибка при создании проекта. Попробуйте еще раз.')
      } finally {
        creatingProject.value = false
      }
    }
    
    // Добавляю новые методы для улучшенного интерфейса
    const getFreeTopicsCount = () => {
      return filteredTopics.value.filter(topic => topic.status === 'free').length
    }

    const getReservedTopicsCount = () => {
      return filteredTopics.value.filter(topic => topic.status === 'reserved').length
    }

    const getTopicStatusClass = (status) => {
      return status === 'free' ? 'status-free' : 'status-reserved'
    }

    const getTopicStatusIcon = (status) => {
      return status === 'free' ? 'fas fa-check-circle' : 'fas fa-lock'
    }

    const getTopicStatusLabel = (status) => {
      return status === 'free' ? 'Свободно' : 'Занято'
    }

    const getTopicDuration = (topic) => {
      if (!topic.planned_start_date || !topic.planned_end_date) return 0
      const startDate = new Date(topic.planned_start_date)
      const endDate = new Date(topic.planned_end_date)
      const diffTime = endDate.getTime() - startDate.getTime()
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
      return Math.max(0, diffDays)
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
      createProject,
      getFreeTopicsCount,
      getReservedTopicsCount,
      getTopicStatusClass,
      getTopicStatusIcon,
      getTopicStatusLabel,
      getTopicDuration
    }
  }
}
</script>

<style scoped>
/* Основные стили */
.program-topics {
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
  width: 100%;
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
  width: 100%;
}

.search-input:focus {
  border-color: #667eea;
  box-shadow: 0 0 0 3px rgba(102,126,234,0.1);
  outline: none;
}

/* Кнопка применения */
.btn-apply {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border: none;
  border-radius: 8px;
  padding: 0.75rem 1.5rem;
  color: white;
  font-weight: 600;
  transition: all 0.3s ease;
  box-shadow: 0 4px 12px rgba(102,126,234,0.3);
  width: 100%;
}

.btn-apply:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 20px rgba(102,126,234,0.4);
}

/* Карточка тем */
.topics-card {
  background: white;
  border-radius: 16px;
  box-shadow: 0 8px 32px rgba(0,0,0,0.1);
  overflow: hidden;
  border: none;
}

.topics-header {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  padding: 1.5rem;
}

.topics-title {
  margin: 0;
  font-size: 1.25rem;
  font-weight: 600;
  display: flex;
  align-items: center;
}

.topics-count {
  background: rgba(255,255,255,0.2);
  color: white;
  padding: 0.25rem 0.75rem;
  border-radius: 12px;
  font-size: 0.875rem;
  margin-left: 1rem;
}

.topics-body {
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

/* Сетка тем */
.topics-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(350px, 1fr));
  gap: 1.5rem;
  padding: 1.5rem;
}

/* Карточка темы */
.topic-card {
  background: white;
  border-radius: 12px;
  box-shadow: 0 4px 16px rgba(0,0,0,0.08);
  border: 2px solid #f3f4f6;
  transition: all 0.3s ease;
  overflow: hidden;
}

.topic-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 12px 32px rgba(0,0,0,0.15);
  border-color: #667eea;
}

.topic-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  padding: 1.25rem 1.25rem 0;
  gap: 1rem;
}

.topic-code {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.direction-code {
  background: linear-gradient(135deg, #667eea, #764ba2);
  color: white;
  padding: 0.25rem 0.75rem;
  border-radius: 6px;
  font-weight: 600;
  font-size: 0.875rem;
  font-family: 'Monaco', 'Consolas', monospace;
}

.topic-number {
  background: #f3f4f6;
  color: #6b7280;
  padding: 0.25rem 0.5rem;
  border-radius: 4px;
  font-weight: 600;
  font-size: 0.8rem;
  font-family: 'Monaco', 'Consolas', monospace;
}

.topic-status .status-badge {
  padding: 0.25rem 0.75rem;
  border-radius: 12px;
  font-size: 0.8rem;
  font-weight: 500;
  display: inline-flex;
  align-items: center;
}

.status-free {
  background: linear-gradient(135deg, #10b981, #059669);
  color: white;
}

.status-reserved {
  background: linear-gradient(135deg, #6b7280, #4b5563);
  color: white;
}

.topic-content {
  padding: 0 1.25rem 1rem;
}

.topic-title {
  font-size: 1rem;
  font-weight: 600;
  color: #1f2937;
  margin: 1rem 0 0.75rem;
  line-height: 1.4;
}

.topic-description {
  color: #6b7280;
  font-size: 0.875rem;
  line-height: 1.5;
  margin-bottom: 1rem;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.topic-dates {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  margin-bottom: 1rem;
}

.date-item,
.duration-item {
  display: flex;
  align-items: center;
  font-size: 0.875rem;
  color: #6b7280;
}

.date-item i,
.duration-item i {
  color: #667eea;
  margin-right: 0.5rem;
  width: 14px;
}

.topic-actions {
  padding: 1rem 1.25rem;
  border-top: 1px solid #f3f4f6;
  background: #f9fafb;
}

.btn-create-project {
  background: linear-gradient(135deg, #10b981, #059669);
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
  width: 100%;
  justify-content: center;
  cursor: pointer;
}

.btn-create-project:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 20px rgba(16,185,129,0.4);
}

.btn-view-project {
  background: linear-gradient(135deg, #06b6d4, #0891b2);
  border: none;
  border-radius: 8px;
  padding: 0.75rem 1.5rem;
  color: white;
  font-weight: 600;
  text-decoration: none;
  display: inline-flex;
  align-items: center;
  transition: all 0.3s ease;
  box-shadow: 0 4px 12px rgba(6,182,212,0.3);
  width: 100%;
  justify-content: center;
}

.btn-view-project:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 20px rgba(6,182,212,0.4);
  color: white;
  text-decoration: none;
}

/* Пагинация */
.pagination-wrapper {
  padding: 2rem;
  border-top: 1px solid #f3f4f6;
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

/* Модальное окно */
.custom-modal {
  border: none;
  border-radius: 16px;
  overflow: hidden;
  box-shadow: 0 20px 60px rgba(0,0,0,0.3);
}

.custom-modal-header {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  padding: 1.5rem;
  border: none;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.modal-title-container .modal-title {
  margin: 0;
  font-size: 1.25rem;
  font-weight: 600;
  display: flex;
  align-items: center;
}

.btn-close {
  background: rgba(255,255,255,0.1);
  border: 1px solid rgba(255,255,255,0.2);
  border-radius: 8px;
  width: 40px;
  height: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  transition: all 0.3s ease;
  cursor: pointer;
}

.btn-close:hover {
  background: rgba(255,255,255,0.2);
  border-color: rgba(255,255,255,0.3);
}

.custom-modal-body {
  padding: 2rem;
}

.topic-info-card {
  background: linear-gradient(135deg, #f0f9ff, #e0f2fe);
  border: 1px solid #bae6fd;
  border-radius: 12px;
  padding: 1.5rem;
  margin-bottom: 1.5rem;
}

.info-header {
  font-weight: 600;
  color: #0369a1;
  margin-bottom: 1rem;
  display: flex;
  align-items: center;
  font-size: 1.1rem;
}

.info-content {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.info-row {
  display: flex;
  gap: 1rem;
}

.info-label {
  font-weight: 600;
  color: #075985;
  min-width: 80px;
}

.info-value {
  color: #0c4a6e;
  flex: 1;
}

.instruction-card {
  background: #f8fafc;
  border-radius: 8px;
  padding: 1rem;
  margin-bottom: 1.5rem;
}

.instruction-text {
  color: #475569;
  margin: 0;
  line-height: 1.5;
}

.warning-card {
  background: linear-gradient(135deg, #fef3c7, #fde68a);
  border: 1px solid #f59e0b;
  border-radius: 8px;
  padding: 1rem;
  display: flex;
  align-items: flex-start;
  gap: 0.75rem;
}

.warning-icon {
  color: #d97706;
  font-size: 1.25rem;
  flex-shrink: 0;
  margin-top: 0.125rem;
}

.warning-text {
  color: #92400e;
  line-height: 1.4;
}

.custom-modal-footer {
  padding: 1.5rem 2rem;
  border-top: 1px solid #e5e7eb;
  display: flex;
  justify-content: flex-end;
  gap: 1rem;
}

.btn-cancel {
  background: #f3f4f6;
  border: 1px solid #d1d5db;
  border-radius: 8px;
  padding: 0.75rem 1.5rem;
  color: #374151;
  font-weight: 500;
  transition: all 0.3s ease;
  cursor: pointer;
}

.btn-cancel:hover {
  background: #e5e7eb;
  border-color: #9ca3af;
}

.btn-create {
  background: linear-gradient(135deg, #10b981, #059669);
  border: none;
  border-radius: 8px;
  padding: 0.75rem 1.5rem;
  color: white;
  font-weight: 600;
  transition: all 0.3s ease;
  box-shadow: 0 4px 12px rgba(16,185,129,0.3);
  cursor: pointer;
}

.btn-create:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 8px 20px rgba(16,185,129,0.4);
}

.btn-create:disabled {
  opacity: 0.6;
  cursor: not-allowed;
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
  .filter-body .col-md-4,
  .filter-body .col-md-2 {
    flex: 0 0 100%;
    max-width: 100%;
  }

  .topics-grid {
    grid-template-columns: 1fr;
    gap: 1rem;
    padding: 1rem;
  }

  .topic-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 0.75rem;
  }
}

@media (max-width: 576px) {
  .hero-section {
    padding: 2rem 0 1.5rem;
  }

  .hero-title {
    font-size: 1.75rem;
  }

  .stat-number {
    font-size: 1.5rem;
  }

  .custom-modal-body {
    padding: 1.5rem;
  }

  .custom-modal-footer {
    padding: 1rem 1.5rem;
    flex-direction: column;
  }

  .btn-cancel,
  .btn-create {
    width: 100%;
    justify-content: center;
  }
}
</style> 