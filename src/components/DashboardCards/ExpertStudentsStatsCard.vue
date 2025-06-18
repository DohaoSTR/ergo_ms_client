<script setup>
import { ref, computed, onMounted } from 'vue'
import VueApexCharts from 'vue3-apexcharts'
import {
  GraduationCap, Users, Briefcase, AlertCircle, Target, BookOpen
} from 'lucide-vue-next'
import { dashboardService } from '@/js/api/services/dashboardService.js'

const isLoading = ref(true)
const error = ref(null)
const stats = ref({})

// Настройки для радиального графика
const chartOptions = computed(() => ({
  chart: {
    type: 'radialBar',
    fontFamily: 'Inter, sans-serif',
    background: 'transparent',
    animations: {
      enabled: true,
      easing: 'easeinout',
      speed: 800
    }
  },
  plotOptions: {
    radialBar: {
      offsetY: 0,
      startAngle: 0,
      endAngle: 270,
      hollow: {
        margin: 5,
        size: '30%',
        background: 'transparent'
      },
      dataLabels: {
        name: {
          show: false
        },
        value: {
          show: false
        }
      }
    }
  },
  colors: ['#10b981', '#3b82f6', '#8b5cf6'],
  labels: ['Опыт в IT', 'Выбрали роль', 'Активны в тестах'],
  legend: {
    show: true,
    floating: true,
    fontSize: '12px',
    position: 'left',
    offsetX: 10,
    offsetY: 15,
    labels: {
      useSeriesColors: true,
      colors: 'var(--color-text-primary)'
    },
    formatter: function(seriesName, opts) {
      return seriesName + ': ' + opts.w.globals.series[opts.seriesIndex] + '%'
    }
  },
  responsive: [{
    breakpoint: 768,
    options: {
      legend: {
        show: false
      }
    }
  }]
}))

const chartSeries = computed(() => [
  stats.value.experience_percentage || 0,
  stats.value.role_selection_percentage || 0,
  stats.value.test_activity_percentage || 0
])

const fetchStudentsStats = async () => {
  try {
    isLoading.value = true
    error.value = null

    const response = await dashboardService.getExpertStudentsStats()

    if (!response) {
      throw new Error('Полученные данные имеют неверный формат')
    }

    stats.value = response

  } catch (err) {
    error.value = err.response?.data?.message ||
                 err.message ||
                 'Неизвестная ошибка при загрузке данных'
    console.error('Произошла ошибка:', err)
  } finally {
    isLoading.value = false
  }
}

onMounted(() => {
  fetchStudentsStats()
})
</script>

<template>
  <div class="students-card">
    <div class="card-header">
      <span class="title">Статистика студентов</span>
      <h3 class="subtitle">Активность и вовлеченность</h3>
    </div>

    <div v-if="isLoading" class="loading-state">
      <div class="spinner"></div>
    </div>

    <div v-else-if="error" class="error-state">
      {{ error }}
      <button @click="fetchStudentsStats" class="retry-btn">Попробовать снова</button>
    </div>

    <div v-else class="content">
      <!-- Основные показатели -->
      <div class="stats-grid">
        <div class="stat-card primary">
          <div class="stat-icon">
            <Users class="icon" />
          </div>
          <div class="stat-content">
            <div class="stat-value">{{ stats.total_students || 0 }}</div>
            <div class="stat-label">Всего студентов</div>
          </div>
        </div>

        <div class="stat-card success">
          <div class="stat-icon">
            <Briefcase class="icon" />
          </div>
          <div class="stat-content">
            <div class="stat-value">{{ stats.students_with_experience || 0 }}</div>
            <div class="stat-label">С опытом</div>
          </div>
        </div>

        <div class="stat-card warning">
          <div class="stat-icon">
            <Target class="icon" />
          </div>
          <div class="stat-content">
            <div class="stat-value">{{ stats.students_with_role || 0 }}</div>
            <div class="stat-label">Выбрали роль</div>
          </div>
        </div>

        <div class="stat-card info">
          <div class="stat-icon">
            <BookOpen class="icon" />
          </div>
          <div class="stat-content">
            <div class="stat-value">{{ stats.active_in_tests || 0 }}</div>
            <div class="stat-label">Активны в тестах</div>
          </div>
        </div>
      </div>

      <!-- График процентов -->
      <div v-if="chartSeries.some(val => val > 0)" class="chart-container">
        <VueApexCharts
          width="100%"
          height="250"
          type="radialBar"
          :options="chartOptions"
          :series="chartSeries"
        />
      </div>

      <!-- Средние показатели -->
      <div class="averages-grid">
        <div class="average-item">
          <div class="average-value">{{ stats.avg_skills_per_student || 0 }}</div>
          <div class="average-label">Ср. навыков на студента</div>
        </div>
        <div class="average-item">
          <div class="average-value">{{ stats.avg_confirmed_skills || 0 }}</div>
          <div class="average-label">Ср. подтвержденных навыков</div>
        </div>
        <div class="average-item">
          <div class="average-value">{{ stats.avg_tests_per_student || 0 }}</div>
          <div class="average-label">Ср. тестов на студента</div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.students-card {
  background: var(--color-primary-background);
  border-radius: 12px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  padding: 20px;
  margin-bottom: 24px;
}

.card-header {
  margin-bottom: 20px;
}

.title {
  font-size: 16px;
  font-weight: 600;
  color: var(--color-text-primary);
}

.subtitle {
  font-size: 14px;
  color: var(--color-text-secondary);
  margin-top: 4px;
  font-weight: normal;
}

.loading-state {
  display: flex;
  justify-content: center;
  align-items: center;
  height: 200px;
}

.spinner {
  width: 40px;
  height: 40px;
  border: 4px solid #e2e8f0;
  border-top: 4px solid #3b82f6;
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

.error-state {
  padding: 20px;
  background: #fee2e2;
  color: #b91c1c;
  border-radius: 8px;
  text-align: center;
}

.retry-btn {
  margin-top: 10px;
  background: #ef4444;
  color: white;
  border: none;
  padding: 8px 16px;
  border-radius: 6px;
  cursor: pointer;
  font-size: 14px;
}

.content {
  display: flex;
  flex-direction: column;
  gap: 24px;
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
  gap: 16px;
}

.stat-card {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 16px;
  border-radius: 8px;
  border: 1px solid var(--color-border);
}

.stat-card.primary {
  background: #eff6ff;
  border-color: #3b82f6;
}

.stat-card.success {
  background: #f0fdf4;
  border-color: #10b981;
}

.stat-card.warning {
  background: #fffbeb;
  border-color: #f59e0b;
}

.stat-card.info {
  background: #f5f3ff;
  border-color: #8b5cf6;
}

.stat-icon {
  width: 40px;
  height: 40px;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.primary .stat-icon { background: #3b82f6; }
.success .stat-icon { background: #10b981; }
.warning .stat-icon { background: #f59e0b; }
.info .stat-icon { background: #8b5cf6; }

.icon {
  width: 20px;
  height: 20px;
  color: white;
}

.stat-content {
  flex: 1;
}

.stat-value {
  font-size: 20px;
  font-weight: 700;
  color: var(--color-text-primary);
  line-height: 1;
}

.stat-label {
  font-size: 12px;
  color: var(--color-text-secondary);
  margin-top: 4px;
}

.chart-container {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 250px;
}

.averages-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
  gap: 16px;
  padding-top: 16px;
  border-top: 1px solid var(--color-border);
}

.average-item {
  text-align: center;
  padding: 12px;
  background: var(--color-secondary-background);
  border-radius: 8px;
}

.average-value {
  font-size: 18px;
  font-weight: 600;
  color: var(--color-text-primary);
}

.average-label {
  font-size: 11px;
  color: var(--color-text-secondary);
  margin-top: 4px;
  line-height: 1.3;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

@media (max-width: 768px) {
  .stats-grid {
    grid-template-columns: repeat(2, 1fr);
  }

  .averages-grid {
    grid-template-columns: 1fr;
  }
}
</style>