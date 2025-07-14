<script setup>
import { ref, computed, onMounted } from 'vue'
import VueApexCharts from 'vue3-apexcharts'
import {
  BarChart3, Users, Building2, Briefcase,
  BookOpen, TestTube2, AlertCircle,
  CheckCircle, Clock
} from 'lucide-vue-next'
import { dashboardService } from '@/js/api/services/dashboardService.js'

const isLoading = ref(true)
const error = ref(null)
const metrics = ref([])

const formattedMetrics = computed(() => {
  if (!metrics.value?.length) return []

  const iconMap = {
    'students': { icon: Users, color: '#3b82f6', label: 'Студенты' },
    'companies': { icon: Building2, color: '#10b981', label: 'Компании' },
    'skills': { icon: BookOpen, color: '#8b5cf6', label: 'Навыки' },
    'tests': { icon: TestTube2, color: '#f59e0b', label: 'Тесты' },
    'vacancies': { icon: Briefcase, color: '#06b6d4', label: 'Вакансии' },
    'user_skills': { icon: CheckCircle, color: '#059669', label: 'Навыки пользователей' },
    'test_results': { icon: Clock, color: '#d97706', label: 'Результаты тестов' }
  }

  return metrics.value.map(metric => {
    const config = iconMap[metric.metric_type] || {}
    let subtitle = ''
    let active = 0

    switch (metric.metric_type) {
      case 'students':
        active = metric.with_experience || 0
        break
      case 'companies':
        active = metric.verified || 0
        break
      case 'user_skills':
        active = metric.confirmed || 0
        break
      case 'test_results':
        active = metric.passed || 0
        break
      default:
        active = metric.total_count || 0
    }

    return {
      type: metric.metric_type,
      label: config.label || metric.metric_type,
      value: metric.total_count || 0,
      active,
      subtitle,
      icon: config.icon || BarChart3,
      color: config.color || '#6b7280'
    }
  })
})

// Настройки для круговой диаграммы
const chartOptions = computed(() => ({
  chart: {
    type: 'donut',
    fontFamily: 'Inter, sans-serif',
    background: 'transparent',
    animations: {
      enabled: true,
      easing: 'easeinout',
      speed: 800
    },
    toolbar: { show: false }
  },
  labels: formattedMetrics.value.map(item => item.label),
  colors: formattedMetrics.value.map(item => item.color),
  legend: {
    position: 'bottom',
    fontSize: '12px',
    fontFamily: 'Inter, sans-serif',
    labels: {
      colors: 'var(--color-text-primary)'
    }
  },
  plotOptions: {
    pie: {
      donut: {
        size: '65%',
        labels: {
          show: true,
          total: {
            show: true,
            label: 'Всего',
            fontSize: '14px',
            fontWeight: 600,
            color: 'var(--color-text-primary)',
            formatter: function(w) {
              return w.globals.seriesTotals.reduce((a, b) => a + b, 0)
            }
          }
        }
      }
    }
  },
  dataLabels: {
    enabled: true,
    style: {
      fontSize: '11px',
      fontWeight: 'bold',
      colors: ['#fff']
    },
    dropShadow: {
      enabled: false
    }
  },
  responsive: [{
    breakpoint: 768,
    options: {
      legend: {
        position: 'bottom'
      }
    }
  }],
  tooltip: {
    enabled: true,
    style: {
      fontSize: '12px',
      fontFamily: 'Inter, sans-serif'
    }
  }
}))

const chartSeries = computed(() => formattedMetrics.value.map(item => item.value))

const fetchMetrics = async () => {
  try {
    isLoading.value = true
    error.value = null

    const response = await dashboardService.getExpertSystemMetrics()

    if (!response || !Array.isArray(response)) {
      throw new Error('Полученные данные имеют неверный формат')
    }

    metrics.value = response

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
  fetchMetrics()
})
</script>

<template>
  <div class="metrics-card">
    <div class="card-header">
      <span class="title">Системные метрики</span>
      <h3 class="subtitle">Основные показатели экспертной системы</h3>
    </div>

    <div v-if="isLoading" class="loading-state">
      <div class="spinner"></div>
    </div>

    <div v-else-if="error" class="error-state">
      {{ error }}
      <button @click="fetchMetrics" class="retry-btn">Попробовать снова</button>
    </div>

    <div v-else class="content">
      <!-- Метрики в карточках -->
      <div class="metrics-grid">
        <div v-for="metric in formattedMetrics" :key="metric.type" class="metric-item">
          <div class="metric-icon" :style="{ backgroundColor: metric.color + '20', color: metric.color }">
            <component :is="metric.icon" class="icon" />
          </div>
          <div class="metric-content">
            <div class="metric-value">{{ metric.value }}</div>
            <div class="metric-label">{{ metric.label }}</div>
            <div v-if="metric.subtitle" class="metric-subtitle">{{ metric.subtitle }}</div>
          </div>
        </div>
      </div>

      <!-- График -->
      <div v-if="chartSeries.length > 0 && chartSeries.some(val => val > 0)" class="chart-container">
        <VueApexCharts
          width="100%"
          height="300"
          type="donut"
          :options="chartOptions"
          :series="chartSeries"
        />
      </div>

      <div v-else class="no-data">
        <AlertCircle class="no-data-icon" />
        <p>Нет данных для отображения графика</p>
      </div>
    </div>
  </div>
</template>

<style scoped>
.metrics-card {
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

.metrics-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 16px;
}

.metric-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 16px;
  background: var(--color-secondary-background);
  border-radius: 8px;
  border: 1px solid var(--color-border);
}

.metric-icon {
  width: 48px;
  height: 48px;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.icon {
  width: 24px;
  height: 24px;
}

.metric-content {
  flex: 1;
  min-width: 0;
}

.metric-value {
  font-size: 24px;
  font-weight: 700;
  color: var(--color-text-primary);
  line-height: 1;
}

.metric-label {
  font-size: 13px;
  font-weight: 500;
  color: var(--color-text-primary);
  margin-top: 4px;
}

.metric-subtitle {
  font-size: 11px;
  color: var(--color-text-secondary);
  margin-top: 2px;
  line-height: 1.3;
}

.chart-container {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 300px;
}

.no-data {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 40px;
  color: var(--color-text-secondary);
}

.no-data-icon {
  width: 48px;
  height: 48px;
  margin-bottom: 12px;
  opacity: 0.5;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

@media (max-width: 768px) {
  .metrics-grid {
    grid-template-columns: 1fr;
  }

  .metric-item {
    padding: 12px;
  }

  .metric-value {
    font-size: 20px;
  }
}
</style>