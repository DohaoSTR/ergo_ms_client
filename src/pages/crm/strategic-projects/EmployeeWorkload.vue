<template>
  <div class="employee-workload">
    <div class="container-fluid">
      <!-- Заголовок страницы -->
      <div class="page-header-gradient mb-4">
        <div class="row align-items-center">
          <div class="col-lg-8">
            <h1 class="page-title mb-2">
              <i class="fas fa-chart-pie mr-3"></i>
              Занятость сотрудников
            </h1>
            <nav aria-label="breadcrumb">
              <ol class="breadcrumb breadcrumb-transparent">
                <li class="breadcrumb-item"><router-link to="/">Главная</router-link></li>
                <li class="breadcrumb-item"><router-link to="/crm">CRM</router-link></li>
                <li class="breadcrumb-item">
                  <router-link to="/crm/strategic-projects">Стратегические проекты</router-link>
                </li>
                <li class="breadcrumb-item active">Занятость сотрудников</li>
              </ol>
            </nav>
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
                  <label>Подразделение</label>
                  <select v-model="filters.department" class="form-control">
                    <option value="">Все подразделения</option>
                    <option value="it">IT отдел</option>
                    <option value="research">Научный отдел</option>
                    <option value="education">Образовательный отдел</option>
                  </select>
                </div>
              </div>
              <div class="col-md-3">
                <div class="form-group">
                  <label>Период</label>
                  <select v-model="filters.period" class="form-control">
                    <option value="current">Текущий месяц</option>
                    <option value="quarter">Текущий квартал</option>
                    <option value="year">Текущий год</option>
                  </select>
                </div>
              </div>
              <div class="col-md-4">
                <div class="form-group">
                  <label>Поиск сотрудника</label>
                  <input
                    v-model="filters.search"
                    type="text"
                    class="form-control"
                    placeholder="Введите ФИО сотрудника"
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

      <!-- Общая статистика -->
      <div class="row mb-4">
        <div class="col-lg-3 col-md-6 mb-3">
          <div class="stat-card">
            <div class="stat-icon bg-primary">
              <i class="fas fa-users"></i>
            </div>
            <div class="stat-info">
              <div class="stat-label">Всего сотрудников</div>
              <div class="stat-value">{{ statistics.totalEmployees }}</div>
            </div>
          </div>
        </div>
        <div class="col-lg-3 col-md-6 mb-3">
          <div class="stat-card">
            <div class="stat-icon bg-success">
              <i class="fas fa-check-circle"></i>
            </div>
            <div class="stat-info">
              <div class="stat-label">Оптимальная загрузка</div>
              <div class="stat-value">{{ statistics.optimalLoad }}</div>
            </div>
          </div>
        </div>
        <div class="col-lg-3 col-md-6 mb-3">
          <div class="stat-card">
            <div class="stat-icon bg-warning">
              <i class="fas fa-exclamation-triangle"></i>
            </div>
            <div class="stat-info">
              <div class="stat-label">Перегруженные</div>
              <div class="stat-value">{{ statistics.overloaded }}</div>
            </div>
          </div>
        </div>
        <div class="col-lg-3 col-md-6 mb-3">
          <div class="stat-card">
            <div class="stat-icon bg-info">
              <i class="fas fa-user-clock"></i>
            </div>
            <div class="stat-info">
              <div class="stat-label">Недозагруженные</div>
              <div class="stat-value">{{ statistics.underloaded }}</div>
            </div>
          </div>
        </div>
      </div>

      <!-- Детальная загруженность -->
      <div class="row">
        <div class="col-12">
          <div class="workload-table-section">
            <div class="section-header">
              <h5 class="section-title">
                <i class="fas fa-table mr-2"></i>
                Детальная загруженность сотрудников
              </h5>
              <div class="section-actions">
                <button class="btn btn-outline-primary btn-sm">
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

            <div v-else class="workload-list">
              <div 
                v-for="employee in employees" 
                :key="employee.id"
                class="employee-card"
              >
                <div class="employee-header">
                  <div class="employee-info">
                    <div class="employee-avatar">
                      {{ getInitials(employee.name) }}
                    </div>
                    <div>
                      <h6 class="employee-name">{{ employee.name }}</h6>
                      <div class="employee-position">{{ employee.position }}</div>
                    </div>
                  </div>
                  <div class="workload-indicator" :class="getWorkloadClass(employee.totalWorkload)">
                    <span class="workload-value">{{ employee.totalWorkload }}%</span>
                    <span class="workload-label">загрузка</span>
                  </div>
                </div>

                <div class="employee-projects">
                  <h6 class="projects-title">Участие в проектах:</h6>
                  <div class="projects-list">
                    <div 
                      v-for="project in employee.projects" 
                      :key="project.id"
                      class="project-item"
                    >
                      <div class="project-info">
                        <router-link 
                          :to="`/crm/strategic-projects/project/${project.id}`"
                          class="project-link"
                        >
                          {{ project.code }} - {{ project.name }}
                        </router-link>
                        <div class="project-role">{{ project.role }}</div>
                      </div>
                      <div class="project-workload">
                        <div class="workload-bar">
                          <div 
                            class="workload-fill"
                            :style="`width: ${project.workload}%`"
                            :class="getWorkloadBarClass(project.workload)"
                          ></div>
                        </div>
                        <span class="workload-text">{{ project.workload }}%</span>
                      </div>
                    </div>
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
import { ref, onMounted } from 'vue'
import { apiClient } from '@/js/api/manager'

export default {
  name: 'EmployeeWorkload',
  
  setup() {
    const loading = ref(false)
    const employees = ref([])
    const statistics = ref({
      totalEmployees: 0,
      optimalLoad: 0,
      overloaded: 0,
      underloaded: 0
    })
    
    const filters = ref({
      department: '',
      period: 'current',
      search: ''
    })
    
    // Загрузка данных о загруженности
    const loadWorkloadData = async () => {
      loading.value = true
      try {
        // Временные данные для демонстрации
        employees.value = [
          {
            id: 1,
            name: 'Иванов Иван Иванович',
            position: 'Старший разработчик',
            totalWorkload: 120,
            projects: [
              { id: 1, code: 'IT-001-2025', name: 'Разработка системы учета', role: 'Руководитель', workload: 60 },
              { id: 2, code: 'IT-002-2025', name: 'Модернизация инфраструктуры', role: 'Консультант', workload: 30 },
              { id: 3, code: 'IT-003-2025', name: 'Внедрение CRM', role: 'Исполнитель', workload: 30 }
            ]
          },
          {
            id: 2,
            name: 'Петров Петр Петрович',
            position: 'Аналитик',
            totalWorkload: 80,
            projects: [
              { id: 4, code: 'AN-001-2025', name: 'Анализ бизнес-процессов', role: 'Руководитель', workload: 50 },
              { id: 5, code: 'AN-002-2025', name: 'Оптимизация затрат', role: 'Исполнитель', workload: 30 }
            ]
          },
          {
            id: 3,
            name: 'Сидорова Елена Александровна',
            position: 'Менеджер проектов',
            totalWorkload: 40,
            projects: [
              { id: 6, code: 'PM-001-2025', name: 'Координация проектов отдела', role: 'Куратор', workload: 40 }
            ]
          }
        ]
        
        // Подсчет статистики
        const total = employees.value.length
        const optimal = employees.value.filter(e => e.totalWorkload >= 70 && e.totalWorkload <= 100).length
        const overloaded = employees.value.filter(e => e.totalWorkload > 100).length
        const underloaded = employees.value.filter(e => e.totalWorkload < 70).length
        
        statistics.value = {
          totalEmployees: total,
          optimalLoad: optimal,
          overloaded: overloaded,
          underloaded: underloaded
        }
      } catch (error) {
        console.error('Ошибка загрузки данных:', error)
      } finally {
        loading.value = false
      }
    }
    
    // Применение фильтров
    const applyFilters = () => {
      loadWorkloadData()
    }
    
    // Получение инициалов
    const getInitials = (name) => {
      return name.split(' ').map(n => n[0]).join('').toUpperCase()
    }
    
    // Определение класса для загруженности
    const getWorkloadClass = (workload) => {
      if (workload > 100) return 'workload-overloaded'
      if (workload >= 70) return 'workload-optimal'
      return 'workload-underloaded'
    }
    
    // Определение класса для полосы загруженности
    const getWorkloadBarClass = (workload) => {
      if (workload > 100) return 'bg-danger'
      if (workload >= 70) return 'bg-success'
      return 'bg-info'
    }
    
    // Загрузка данных при монтировании
    onMounted(() => {
      loadWorkloadData()
    })
    
    return {
      loading,
      employees,
      statistics,
      filters,
      applyFilters,
      getInitials,
      getWorkloadClass,
      getWorkloadBarClass
    }
  }
}
</script>

<style scoped>
.employee-workload {
  padding: 20px 0;
  background-color: #f8f9fc;
  min-height: 100vh;
}

/* Заголовок страницы */
.page-header-gradient {
  background: linear-gradient(135deg, #ffc107 0%, #ff9800 100%);
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

/* Секция фильтров */
.filters-section {
  background: white;
  border-radius: 15px;
  padding: 2rem;
  box-shadow: 0 5px 20px rgba(0, 0, 0, 0.08);
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

/* Секция таблицы загруженности */
.workload-table-section {
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

.section-title {
  font-size: 1.25rem;
  font-weight: 600;
  color: #2d3436;
  margin: 0;
}

/* Список сотрудников */
.workload-list {
  padding: 1.5rem;
}

.employee-card {
  background: #f8f9fa;
  border-radius: 12px;
  padding: 1.5rem;
  margin-bottom: 1rem;
  transition: all 0.3s ease;
}

.employee-card:hover {
  background: white;
  box-shadow: 0 5px 20px rgba(0, 0, 0, 0.08);
}

.employee-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1.5rem;
}

.employee-info {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.employee-avatar {
  width: 50px;
  height: 50px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 600;
  font-size: 1.125rem;
}

.employee-name {
  font-size: 1.125rem;
  font-weight: 600;
  color: #2d3436;
  margin: 0;
}

.employee-position {
  font-size: 0.875rem;
  color: #6c757d;
}

/* Индикатор загруженности */
.workload-indicator {
  text-align: center;
  padding: 0.75rem 1.5rem;
  border-radius: 12px;
}

.workload-value {
  display: block;
  font-size: 1.5rem;
  font-weight: 700;
}

.workload-label {
  display: block;
  font-size: 0.75rem;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.workload-optimal {
  background: rgba(40, 167, 69, 0.1);
  color: #28a745;
}

.workload-overloaded {
  background: rgba(220, 53, 69, 0.1);
  color: #dc3545;
}

.workload-underloaded {
  background: rgba(23, 162, 184, 0.1);
  color: #17a2b8;
}

/* Проекты сотрудника */
.employee-projects {
  border-top: 1px solid #e9ecef;
  padding-top: 1rem;
}

.projects-title {
  font-size: 0.875rem;
  font-weight: 600;
  color: #6c757d;
  margin-bottom: 1rem;
}

.project-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0.75rem 0;
  border-bottom: 1px solid #e9ecef;
}

.project-item:last-child {
  border-bottom: none;
}

.project-link {
  color: #007bff;
  text-decoration: none;
  font-weight: 500;
}

.project-link:hover {
  text-decoration: underline;
}

.project-role {
  font-size: 0.875rem;
  color: #6c757d;
}

.project-workload {
  display: flex;
  align-items: center;
  gap: 1rem;
  min-width: 150px;
}

.workload-bar {
  flex: 1;
  height: 8px;
  background: #e9ecef;
  border-radius: 4px;
  overflow: hidden;
}

.workload-fill {
  height: 100%;
  transition: width 0.3s ease;
}

.workload-text {
  font-size: 0.875rem;
  font-weight: 600;
  min-width: 40px;
  text-align: right;
}

/* Медиа запросы */
@media (max-width: 768px) {
  .employee-header {
    flex-direction: column;
    align-items: start;
    gap: 1rem;
  }
  
  .workload-indicator {
    align-self: stretch;
  }
  
  .project-item {
    flex-direction: column;
    align-items: start;
    gap: 0.5rem;
  }
  
  .project-workload {
    width: 100%;
  }
}
</style> 