<template>
  <div class="project-reports">
    <!-- Красивый градиентный заголовок -->
    <div class="hero-section">
      <div class="container-fluid">
        <div class="row">
          <div class="col-12">
            <div class="hero-content">
              <div class="hero-text">
                <h1 class="hero-title">
                  <i class="fas fa-chart-bar mr-3"></i>
                  Отчеты и аналитика
                </h1>
                <p class="hero-subtitle">Аналитические отчеты и статистика по стратегическим проектам</p>
              </div>
            </div>
            
            <nav aria-label="breadcrumb" class="hero-breadcrumb">
              <ol class="breadcrumb">
                <li class="breadcrumb-item"><router-link to="/">Главная</router-link></li>
                <li class="breadcrumb-item"><router-link to="/crm">CRM</router-link></li>
                <li class="breadcrumb-item">
                  <router-link to="/crm/strategic-projects">Стратегические проекты</router-link>
                </li>
                <li class="breadcrumb-item active">Отчеты</li>
              </ol>
            </nav>
          </div>
        </div>
      </div>
    </div>

    <div class="container-fluid py-4">
      <!-- Статистические карточки -->
      <div class="row mb-4">
        <div class="col-xl-3 col-md-6 mb-4">
          <div class="stat-card stat-card-primary">
            <div class="stat-icon">
              <i class="fas fa-project-diagram"></i>
            </div>
            <div class="stat-content">
              <h3 class="stat-value">{{ statistics.totalProjects }}</h3>
              <p class="stat-label">Всего проектов</p>
            </div>
          </div>
        </div>
        
        <div class="col-xl-3 col-md-6 mb-4">
          <div class="stat-card stat-card-success">
            <div class="stat-icon">
              <i class="fas fa-play-circle"></i>
            </div>
            <div class="stat-content">
              <h3 class="stat-value">{{ statistics.activeProjects }}</h3>
              <p class="stat-label">Активных проектов</p>
            </div>
          </div>
        </div>
        
        <div class="col-xl-3 col-md-6 mb-4">
          <div class="stat-card stat-card-warning">
            <div class="stat-icon">
              <i class="fas fa-hourglass-half"></i>
            </div>
            <div class="stat-content">
              <h3 class="stat-value">{{ statistics.onApproval }}</h3>
              <p class="stat-label">На утверждении</p>
            </div>
          </div>
        </div>
        
        <div class="col-xl-3 col-md-6 mb-4">
          <div class="stat-card stat-card-info">
            <div class="stat-icon">
              <i class="fas fa-check-circle"></i>
            </div>
            <div class="stat-content">
              <h3 class="stat-value">{{ statistics.completedProjects }}</h3>
              <p class="stat-label">Завершенных проектов</p>
            </div>
          </div>
        </div>
      </div>

      <!-- Графики и диаграммы -->
      <div class="row mb-4">
        <div class="col-lg-8 mb-4">
          <div class="chart-card">
            <div class="chart-header">
              <h5 class="chart-title">
                <i class="fas fa-chart-line mr-2"></i>
                Динамика проектов по месяцам
              </h5>
            </div>
            <div class="chart-body">
              <canvas ref="projectsChart" height="100"></canvas>
            </div>
          </div>
        </div>
        
        <div class="col-lg-4 mb-4">
          <div class="chart-card">
            <div class="chart-header">
              <h5 class="chart-title">
                <i class="fas fa-chart-pie mr-2"></i>
                Распределение по статусам
              </h5>
            </div>
            <div class="chart-body">
              <canvas ref="statusChart" height="200"></canvas>
            </div>
          </div>
        </div>
      </div>

      <!-- Фильтры и управление отчетами -->
      <div class="row">
        <div class="col-12">
          <div class="report-card">
            <div class="report-header">
              <h5 class="report-title">
                <i class="fas fa-file-alt mr-2"></i>
                Генерация отчетов
              </h5>
            </div>
            
            <div class="report-filters">
              <div class="row">
                <div class="col-md-3 mb-3">
                  <label class="form-label">Тип отчета</label>
                  <select v-model="reportFilters.type" class="form-select">
                    <option value="">Все типы</option>
                    <option value="summary">Сводный отчет</option>
                    <option value="detailed">Детальный отчет</option>
                    <option value="financial">Финансовый отчет</option>
                    <option value="progress">Отчет о прогрессе</option>
                    <option value="workload">Загруженность сотрудников</option>
                  </select>
                </div>
                
                <div class="col-md-3 mb-3">
                  <label class="form-label">Период</label>
                  <select v-model="reportFilters.period" class="form-select">
                    <option value="current_month">Текущий месяц</option>
                    <option value="current_quarter">Текущий квартал</option>
                    <option value="current_year">Текущий год</option>
                    <option value="custom">Произвольный период</option>
                  </select>
                </div>
                
                <div class="col-md-3 mb-3" v-if="reportFilters.period === 'custom'">
                  <label class="form-label">Дата начала</label>
                  <input type="date" v-model="reportFilters.startDate" class="form-control">
                </div>
                
                <div class="col-md-3 mb-3" v-if="reportFilters.period === 'custom'">
                  <label class="form-label">Дата окончания</label>
                  <input type="date" v-model="reportFilters.endDate" class="form-control">
                </div>
                
                <div class="col-md-3 mb-3">
                  <label class="form-label">Статус проектов</label>
                  <select v-model="reportFilters.status" class="form-select">
                    <option value="">Все статусы</option>
                    <option value="draft">Черновик</option>
                    <option value="on_approval">На утверждении</option>
                    <option value="approved">Утвержден</option>
                    <option value="in_progress">В работе</option>
                    <option value="completed">Завершен</option>
                    <option value="archived">Архив</option>
                  </select>
                </div>
                
                <div class="col-md-3 mb-3">
                  <label class="form-label">Программа развития</label>
                  <select v-model="reportFilters.program" class="form-select">
                    <option value="">Все программы</option>
                    <option v-for="program in programs" :key="program.id" :value="program.id">
                      {{ program.name }} ({{ program.year }})
                    </option>
                  </select>
                </div>
                
                <div class="col-md-3 mb-3">
                  <label class="form-label">Формат экспорта</label>
                  <select v-model="reportFilters.format" class="form-select">
                    <option value="pdf">PDF</option>
                    <option value="excel">Excel</option>
                    <option value="word">Word</option>
                    <option value="csv">CSV</option>
                  </select>
                </div>
                
                <div class="col-md-3 mb-3 d-flex align-items-end">
                  <button @click="generateReport" class="btn btn-primary w-100" :disabled="generating">
                    <i class="fas fa-download mr-2"></i>
                    {{ generating ? 'Генерация...' : 'Сформировать отчет' }}
                  </button>
                </div>
              </div>
            </div>

            <!-- Список последних отчетов -->
            <div class="recent-reports mt-4">
              <h6 class="mb-3">
                <i class="fas fa-history mr-2"></i>
                Последние сформированные отчеты
              </h6>
              
              <div class="table-responsive">
                <table class="table table-hover">
                  <thead>
                    <tr>
                      <th>Дата</th>
                      <th>Тип отчета</th>
                      <th>Период</th>
                      <th>Формат</th>
                      <th>Сформировал</th>
                      <th>Действия</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr v-for="report in recentReports" :key="report.id">
                      <td>{{ formatDate(report.created_at) }}</td>
                      <td>
                        <span class="badge" :class="getReportTypeBadgeClass(report.type)">
                          {{ getReportTypeLabel(report.type) }}
                        </span>
                      </td>
                      <td>{{ report.period_label }}</td>
                      <td>
                        <i :class="getFormatIcon(report.format)" class="mr-1"></i>
                        {{ report.format.toUpperCase() }}
                      </td>
                      <td>{{ report.created_by_name }}</td>
                      <td>
                        <button @click="downloadReport(report)" class="btn btn-sm btn-outline-primary">
                          <i class="fas fa-download"></i>
                        </button>
                        <button @click="viewReport(report)" class="btn btn-sm btn-outline-secondary ml-1">
                          <i class="fas fa-eye"></i>
                        </button>
                      </td>
                    </tr>
                  </tbody>
                </table>
                
                <div v-if="recentReports.length === 0" class="text-center py-4 text-muted">
                  Нет сформированных отчетов
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Дополнительные аналитические блоки -->
      <div class="row mt-4">
        <div class="col-lg-6 mb-4">
          <div class="analytics-card">
            <div class="analytics-header">
              <h5 class="analytics-title">
                <i class="fas fa-users mr-2"></i>
                Топ руководителей проектов
              </h5>
            </div>
            <div class="analytics-body">
              <div class="leader-item" v-for="leader in topLeaders" :key="leader.id">
                <div class="leader-info">
                  <div class="leader-avatar">
                    {{ getInitials(leader.name) }}
                  </div>
                  <div class="leader-details">
                    <h6 class="leader-name">{{ leader.name }}</h6>
                    <p class="leader-stats">{{ leader.projects_count }} проектов</p>
                  </div>
                </div>
                <div class="leader-progress">
                  <div class="progress">
                    <div class="progress-bar bg-success" 
                         :style="{width: leader.completion_rate + '%'}">
                      {{ leader.completion_rate }}%
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
        
        <div class="col-lg-6 mb-4">
          <div class="analytics-card">
            <div class="analytics-header">
              <h5 class="analytics-title">
                <i class="fas fa-tasks mr-2"></i>
                Выполнение этапов
              </h5>
            </div>
            <div class="analytics-body">
              <canvas ref="stagesChart" height="150"></canvas>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import Chart from 'chart.js/auto'
import axios from 'axios'

import { useToast } from 'vue-toastification'

const toast = useToast()

export default {
  name: 'ProjectReports',
  
  data() {
    return {
      statistics: {
        totalProjects: 0,
        activeProjects: 0,
        onApproval: 0,
        completedProjects: 0
      },
      reportFilters: {
        type: 'summary',
        period: 'current_month',
        startDate: '',
        endDate: '',
        status: '',
        program: '',
        format: 'pdf'
      },
      programs: [],
      recentReports: [],
      topLeaders: [],
      generating: false,
      charts: {
        projects: null,
        status: null,
        stages: null
      }
    }
  },
  
  mounted() {
    this.loadData()
    this.initCharts()
  },
  
  beforeDestroy() {
    // Очищаем графики при уничтожении компонента
    Object.values(this.charts).forEach(chart => {
      if (chart) chart.destroy()
    })
  },
  
  methods: {
    async loadData() {
      try {
        // Загружаем статистику
        const projectsResponse = await axios.get('/api/crm/strategic-projects/')
        const projects = projectsResponse.data
        
        this.calculateStatistics(projects)
        this.calculateTopLeaders(projects)
        
        // Загружаем программы развития
        const programsResponse = await axios.get('/api/crm/strategic-projects/development-programs/')
        this.programs = programsResponse.data
        
        // Загружаем последние отчеты (симуляция)
        this.recentReports = this.generateMockReports()
        
        // Обновляем графики
        this.updateCharts(projects)
        
      } catch (error) {
        console.error('Ошибка загрузки данных:', error)
        toast.error('Ошибка загрузки данных')
      }
    },
    
    calculateStatistics(projects) {
      this.statistics.totalProjects = projects.length
      this.statistics.activeProjects = projects.filter(p => p.status === 'in_progress').length
      this.statistics.onApproval = projects.filter(p => p.status === 'on_approval').length
      this.statistics.completedProjects = projects.filter(p => p.status === 'completed').length
    },
    
    calculateTopLeaders(projects) {
      const leadersMap = {}
      
      projects.forEach(project => {
        const leaderId = project.leader.id
        if (!leadersMap[leaderId]) {
          leadersMap[leaderId] = {
            id: leaderId,
            name: project.leader.full_name,
            projects_count: 0,
            completed_count: 0
          }
        }
        leadersMap[leaderId].projects_count++
        if (project.status === 'completed') {
          leadersMap[leaderId].completed_count++
        }
      })
      
      this.topLeaders = Object.values(leadersMap)
        .map(leader => ({
          ...leader,
          completion_rate: leader.projects_count > 0 
            ? Math.round((leader.completed_count / leader.projects_count) * 100)
            : 0
        }))
        .sort((a, b) => b.projects_count - a.projects_count)
        .slice(0, 5)
    },
    
    initCharts() {
      // График динамики проектов
      const projectsCtx = this.$refs.projectsChart.getContext('2d')
      this.charts.projects = new Chart(projectsCtx, {
        type: 'line',
        data: {
          labels: this.getLastMonths(6),
          datasets: [{
            label: 'Создано проектов',
            data: [0, 0, 0, 0, 0, 0],
            borderColor: '#667eea',
            backgroundColor: 'rgba(102, 126, 234, 0.1)',
            tension: 0.3
          }, {
            label: 'Завершено проектов',
            data: [0, 0, 0, 0, 0, 0],
            borderColor: '#48bb78',
            backgroundColor: 'rgba(72, 187, 120, 0.1)',
            tension: 0.3
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: {
              position: 'bottom'
            }
          }
        }
      })
      
      // График распределения по статусам
      const statusCtx = this.$refs.statusChart.getContext('2d')
      this.charts.status = new Chart(statusCtx, {
        type: 'doughnut',
        data: {
          labels: ['Черновики', 'На утверждении', 'В работе', 'Завершены'],
          datasets: [{
            data: [0, 0, 0, 0],
            backgroundColor: ['#cbd5e0', '#f6e05e', '#667eea', '#48bb78']
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: {
              position: 'bottom'
            }
          }
        }
      })
      
      // График выполнения этапов
      const stagesCtx = this.$refs.stagesChart.getContext('2d')
      this.charts.stages = new Chart(stagesCtx, {
        type: 'bar',
        data: {
          labels: ['План', 'Факт'],
          datasets: [{
            label: 'Этапов',
            data: [0, 0],
            backgroundColor: ['#667eea', '#48bb78']
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: {
              display: false
            }
          }
        }
      })
    },
    
    updateCharts(projects) {
      // Обновляем график динамики
      const monthsData = this.calculateMonthlyData(projects)
      this.charts.projects.data.datasets[0].data = monthsData.created
      this.charts.projects.data.datasets[1].data = monthsData.completed
      this.charts.projects.update()
      
      // Обновляем график статусов
      const statusData = this.calculateStatusData(projects)
      this.charts.status.data.datasets[0].data = statusData
      this.charts.status.update()
      
      // Обновляем график этапов
      const stagesData = this.calculateStagesData(projects)
      this.charts.stages.data.datasets[0].data = stagesData
      this.charts.stages.update()
    },
    
    calculateMonthlyData(projects) {
      const months = this.getLastMonths(6)
      const created = new Array(6).fill(0)
      const completed = new Array(6).fill(0)
      
      // Генерируем случайные данные для демонстрации
      for (let i = 0; i < 6; i++) {
        created[i] = Math.floor(Math.random() * 10) + 1
        completed[i] = Math.floor(Math.random() * 8)
      }
      
      return { created, completed }
    },
    
    calculateStatusData(projects) {
      return [
        projects.filter(p => p.status === 'draft').length,
        projects.filter(p => p.status === 'on_approval').length,
        projects.filter(p => p.status === 'in_progress').length,
        projects.filter(p => p.status === 'completed').length
      ]
    },
    
    calculateStagesData(projects) {
      let plannedStages = 0
      let completedStages = 0
      
      projects.forEach(project => {
        if (project.stages) {
          plannedStages += project.stages.length
          completedStages += project.stages.filter(s => s.status === 'completed').length
        }
      })
      
      return [plannedStages, completedStages]
    },
    
    getLastMonths(count) {
      const months = []
      const now = new Date()
      
      for (let i = count - 1; i >= 0; i--) {
        const date = new Date(now.getFullYear(), now.getMonth() - i, 1)
        months.push(date.toLocaleDateString('ru-RU', { month: 'short' }))
      }
      
      return months
    },
    
    async generateReport() {
      this.generating = true
      
      try {
        // Симуляция генерации отчета
        await new Promise(resolve => setTimeout(resolve, 2000))
        
        // В реальном приложении здесь был бы запрос к API
        const mockReport = {
          id: Date.now(),
          type: this.reportFilters.type,
          period_label: this.getPeriodLabel(),
          format: this.reportFilters.format,
          created_at: new Date(),
          created_by_name: 'Текущий пользователь',
          download_url: '#',
          view_url: '#'
        }
        
        this.recentReports.unshift(mockReport)
        toast.success('Отчет успешно сформирован')
        
      } catch (error) {
        console.error('Ошибка генерации отчета:', error)
        toast.error('Ошибка при формировании отчета')
      } finally {
        this.generating = false
      }
    },
    
    getPeriodLabel() {
      const labels = {
        current_month: 'Текущий месяц',
        current_quarter: 'Текущий квартал',
        current_year: 'Текущий год',
        custom: `${this.reportFilters.startDate} - ${this.reportFilters.endDate}`
      }
      return labels[this.reportFilters.period] || this.reportFilters.period
    },
    
    generateMockReports() {
      // Генерируем примеры отчетов для демонстрации
      const types = ['summary', 'detailed', 'financial', 'progress', 'workload']
      const formats = ['pdf', 'excel', 'word', 'csv']
      const periods = ['Текущий месяц', 'Прошлый квартал', 'Год 2023']
      
      return Array.from({ length: 5 }, (_, i) => ({
        id: i + 1,
        type: types[i % types.length],
        period_label: periods[i % periods.length],
        format: formats[i % formats.length],
        created_at: new Date(Date.now() - i * 86400000),
        created_by_name: ['Иванов И.И.', 'Петров П.П.', 'Сидоров С.С.'][i % 3],
        download_url: '#',
        view_url: '#'
      }))
    },
    
    downloadReport(report) {
      toast.info('Скачивание отчета...')
      // В реальном приложении здесь был бы переход по ссылке
    },
    
    viewReport(report) {
      if (report.format === 'pdf') {
        toast.info('Открытие отчета для просмотра...')
      } else {
        this.downloadReport(report)
      }
    },
    
    formatDate(date) {
      return new Date(date).toLocaleDateString('ru-RU', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      })
    },
    
    getReportTypeLabel(type) {
      const labels = {
        summary: 'Сводный',
        detailed: 'Детальный',
        financial: 'Финансовый',
        progress: 'Прогресс',
        workload: 'Загруженность'
      }
      return labels[type] || type
    },
    
    getReportTypeBadgeClass(type) {
      const classes = {
        summary: 'badge-primary',
        detailed: 'badge-info',
        financial: 'badge-success',
        progress: 'badge-warning',
        workload: 'badge-secondary'
      }
      return classes[type] || 'badge-light'
    },
    
    getFormatIcon(format) {
      const icons = {
        pdf: 'fas fa-file-pdf text-danger',
        excel: 'fas fa-file-excel text-success',
        word: 'fas fa-file-word text-primary',
        csv: 'fas fa-file-csv text-secondary'
      }
      return icons[format] || 'fas fa-file'
    },
    
    getInitials(name) {
      return name.split(' ')
        .map(word => word[0])
        .join('')
        .toUpperCase()
        .slice(0, 2)
    }
  }
}
</script>

<style scoped>
.project-reports {
  min-height: 100vh;
  background: #f5f7fa;
}

.hero-section {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  padding: 3rem 0 2rem;
  margin-bottom: 2rem;
  position: relative;
  overflow: hidden;
}

.hero-content {
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

.hero-breadcrumb .breadcrumb-item.active {
  color: rgba(255,255,255,0.9);
}

/* Статистические карточки */
.stat-card {
  background: white;
  border-radius: 12px;
  padding: 1.5rem;
  box-shadow: 0 2px 8px rgba(0,0,0,0.05);
  display: flex;
  align-items: center;
  transition: transform 0.2s, box-shadow 0.2s;
}

.stat-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 16px rgba(0,0,0,0.1);
}

.stat-icon {
  width: 60px;
  height: 60px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.5rem;
  margin-right: 1rem;
}

.stat-card-primary .stat-icon {
  background: rgba(102, 126, 234, 0.1);
  color: #667eea;
}

.stat-card-success .stat-icon {
  background: rgba(72, 187, 120, 0.1);
  color: #48bb78;
}

.stat-card-warning .stat-icon {
  background: rgba(246, 224, 94, 0.1);
  color: #f6ad55;
}

.stat-card-info .stat-icon {
  background: rgba(66, 153, 225, 0.1);
  color: #4299e1;
}

.stat-content {
  flex: 1;
}

.stat-value {
  font-size: 2rem;
  font-weight: 700;
  margin: 0;
  color: #2d3436;
}

.stat-label {
  color: #636e72;
  margin: 0;
  font-size: 0.9rem;
}

/* Карточки графиков */
.chart-card,
.report-card,
.analytics-card {
  background: white;
  border-radius: 12px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.05);
  overflow: hidden;
}

.chart-header,
.report-header,
.analytics-header {
  padding: 1.25rem;
  border-bottom: 1px solid #e9ecef;
}

.chart-title,
.report-title,
.analytics-title {
  margin: 0;
  color: #2d3436;
  font-size: 1.1rem;
  font-weight: 600;
}

.chart-body {
  padding: 1.5rem;
}

/* Фильтры отчетов */
.report-filters {
  padding: 1.5rem;
}

.form-label {
  font-weight: 500;
  color: #636e72;
  margin-bottom: 0.5rem;
}

.form-select,
.form-control {
  border: 1px solid #dee2e6;
  border-radius: 8px;
  padding: 0.5rem 0.75rem;
  transition: border-color 0.2s, box-shadow 0.2s;
}

.form-select:focus,
.form-control:focus {
  border-color: #667eea;
  box-shadow: 0 0 0 0.2rem rgba(102, 126, 234, 0.25);
}

/* Таблица отчетов */
.recent-reports {
  padding: 0 1.5rem 1.5rem;
}

.table {
  margin-bottom: 0;
}

.table th {
  border-top: none;
  font-weight: 600;
  color: #636e72;
  text-transform: uppercase;
  font-size: 0.85rem;
  letter-spacing: 0.5px;
}

.badge {
  padding: 0.35rem 0.65rem;
  font-weight: 500;
  border-radius: 6px;
}

/* Блок лидеров */
.analytics-body {
  padding: 1.5rem;
}

.leader-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0.75rem 0;
  border-bottom: 1px solid #f1f3f5;
}

.leader-item:last-child {
  border-bottom: none;
}

.leader-info {
  display: flex;
  align-items: center;
}

.leader-avatar {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 600;
  margin-right: 1rem;
}

.leader-details {
  flex: 1;
}

.leader-name {
  margin: 0;
  font-size: 0.95rem;
  font-weight: 600;
  color: #2d3436;
}

.leader-stats {
  margin: 0;
  font-size: 0.85rem;
  color: #636e72;
}

.leader-progress {
  width: 150px;
}

.progress {
  height: 8px;
  background-color: #e9ecef;
  border-radius: 4px;
}

.progress-bar {
  font-size: 0.7rem;
  line-height: 8px;
  font-weight: 600;
}

/* Кнопки */
.btn {
  border-radius: 8px;
  font-weight: 500;
  transition: all 0.2s;
}

.btn-primary {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border: none;
}

.btn-primary:hover {
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(102, 126, 234, 0.4);
}

.btn-outline-primary {
  color: #667eea;
  border-color: #667eea;
}

.btn-outline-primary:hover {
  background: #667eea;
  border-color: #667eea;
}

.btn-sm {
  padding: 0.25rem 0.5rem;
  font-size: 0.875rem;
}
</style> 