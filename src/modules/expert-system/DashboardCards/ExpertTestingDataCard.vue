<script setup>
import { ref, computed, onMounted } from 'vue'
import VueApexCharts from 'vue3-apexcharts'
import {
  TestTube2, Clock, CheckCircle, AlertCircle, TrendingUp, Award
} from 'lucide-vue-next'
import { dashboardService } from '@/js/api/services/dashboardService.js'

const isLoading = ref(true)
const error = ref(null)
const testData = ref({})

// Настройки для круговой диаграммы распределения баллов
const scoreDistributionOptions = computed(() => ({
  chart: {
    type: 'pie',
    fontFamily: 'Inter, sans-serif',
    background: 'transparent',
    animations: {
      enabled: true,
      easing: 'easeinout',
      speed: 800
    },
    toolbar: { show: false }
  },
  labels: ['90-100', '80-89', '70-79', '60-69', '< 60'],
  colors: ['#10b981', '#3b82f6', '#f59e0b', '#f97316', '#ef4444'],
  legend: {
    position: 'bottom',
    fontSize: '12px',
    fontFamily: 'Inter, sans-serif',
    labels: {
      colors: 'var(--color-text-primary)'
    }
  },
  dataLabels: {
    enabled: true,
    style: {
      fontSize: '11px',
      fontWeight: 'bold',
      colors: ['#fff']
    },
    formatter: function(val, opts) {
      return Math.round(val) + '%'
    }
  },
  plotOptions: {
    pie: {
      donut: {
        size: '0%'
      }
    }
  },
  tooltip: {
    enabled: true,
    style: {
      fontSize: '12px'
    },
    y: {
      formatter: function(val, opts) {
        const total = testData.value.total_attempts || 1
        const count = scoreRanges.value[opts.seriesIndex]?.count || 0
        return `${count} попыток (${Math.round(val)}%)`
      }
    }
  },
  responsive: [{
    breakpoint: 768,
    options: {
      legend: {
        position: 'bottom'
      }
    }
  }]
}))

// Настройки для полукруговой диаграммы успешности
const successRateOptions = computed(() => ({
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
      startAngle: -90,
      endAngle: 90,
      hollow: {
        margin: 15,
        size: '70%'
      },
      track: {
        background: '#e7e7e7',
        strokeWidth: '97%',
        margin: 5
      },
      dataLabels: {
        name: {
          show: true,
          fontSize: '14px',
          fontWeight: 600,
          color: 'var(--color-text-primary)',
          offsetY: -10
        },
        value: {
          offsetY: 16,
          fontSize: '24px',
          fontWeight: 700,
          color: 'var(--color-text-primary)',
          formatter: function(val) {
            return val + '%'
          }
        }
      }
    }
  },
  fill: {
    type: 'gradient',
    gradient: {
      shade: 'light',
      shadeIntensity: 0.4,
      inverseColors: false,
      opacityFrom: 1,
      opacityTo: 1,
      stops: [0, 50, 53, 91]
    }
  },
  colors: ['#10b981'],
  labels: ['Успешность'],
  stroke: {
    dashArray: 4
  }
}))

const scoreRanges = computed(() => {
  const total = testData.value.total_attempts || 1

  return [
    {
      label: '90-100',
      count: testData.value.score_90_100 || 0,
      percentage: Math.round(((testData.value.score_90_100 || 0) / total) * 100),
      colorClass: 'bg-green-500'
    },
    {
      label: '80-89',
      count: testData.value.score_80_89 || 0,
      percentage: Math.round(((testData.value.score_80_89 || 0) / total) * 100),
      colorClass: 'bg-blue-500'
    },
    {
      label: '70-79',
      count: testData.value.score_70_79 || 0,
      percentage: Math.round(((testData.value.score_70_79 || 0) / total) * 100),
      colorClass: 'bg-yellow-500'
    },
    {
      label: '60-69',
      count: testData.value.score_60_69 || 0,
      percentage: Math.round(((testData.value.score_60_69 || 0) / total) * 100),
      colorClass: 'bg-orange-500'
    },
    {
      label: '< 60',
      count: testData.value.score_below_60 || 0,
      percentage: Math.round(((testData.value.score_below_60 || 0) / total) * 100),
      colorClass: 'bg-red-500'
    }
  ]
})

const scoreDistributionSeries = computed(() => scoreRanges.value.map(range => range.count))
const successRateSeries = computed(() => [Math.round(testData.value.success_rate || 0)])

const fetchTestingData = async () => {
  try {
    isLoading.value = true
    error.value = null

    const response = await dashboardService.getExpertTestingAnalytics()

    if (!response) {
      throw new Error('Полученные данные имеют неверный формат')
    }

    testData.value = response

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
  fetchTestingData()
})
</script>

<template>
  <div class="testing-card">
    <div class="card-header">
      <span class="title">Аналитика тестирования</span>
      <h3 class="subtitle">Результаты и статистика прохождения тестов</h3>
    </div>

    <div v-if="isLoading" class="loading-state">
      <div class="spinner"></div>
    </div>

    <div v-else-if="error" class="error-state">
      {{ error }}
      <button @click="fetchTestingData" class="retry-btn">Попробовать снова</button>
    </div>

    <div v-else class="content">
      <!-- Основные метрики -->
      <div class="metrics-grid">
        <div class="metric-card primary">
          <div class="metric-icon">
            <Clock class="icon" />
          </div>
          <div class="metric-content">
            <div class="metric-value">{{ testData.total_attempts || 0 }}</div>
            <div class="metric-label">Всего попыток</div>
          </div>
        </div>

        <div class="metric-card success">
          <div class="metric-icon">
            <CheckCircle class="icon" />
          </div>
          <div class="metric-content">
            <div class="metric-value">{{ testData.passed_attempts || 0 }}</div>
            <div class="metric-label">Успешно</div>
          </div>
        </div>

        <div class="metric-card warning">
          <div class="metric-icon">
            <TestTube2 class="icon" />
          </div>
          <div class="metric-content">
            <div class="metric-value">{{ testData.unique_tests || 0 }}</div>
            <div class="metric-label">Уникальных тестов</div>
          </div>
        </div>

        <div class="metric-card info">
          <div class="metric-icon">
            <Award class="icon" />
          </div>
          <div class="metric-content">
            <div class="metric-value">{{ Math.round(testData.average_score || 0) }}</div>
            <div class="metric-label">Средний балл</div>
          </div>
        </div>
      </div>

      <!-- Графики -->
      <div class="charts-grid">
        <!-- График успешности -->
        <div class="chart-section">
          <h4 class="chart-title">Процент успеха</h4>
          <div class="chart-container">
            <VueApexCharts
              width="100%"
              height="200"
              type="radialBar"
              :options="successRateOptions"
              :series="successRateSeries"
            />
          </div>
        </div>

        <!-- Распределение по баллам -->
        <div class="chart-section">
          <h4 class="chart-title">Распределение по баллам</h4>
          <div v-if="scoreDistributionSeries.some(val => val > 0)" class="chart-container">
            <VueApexCharts
              width="100%"
              height="300"
              type="pie"
              :options="scoreDistributionOptions"
              :series="scoreDistributionSeries"
            />
          </div>
          <div v-else class="no-data">
            <AlertCircle class="no-data-icon" />
            <p>Нет данных о баллах</p>
          </div>
        </div>
      </div>

      <!-- Детальная таблица баллов -->
      <div class="table-section">
        <h4 class="table-title">Детальное распределение баллов</h4>
        <div class="scores-grid">
          <div v-for="range in scoreRanges" :key="range.label" class="score-item">
            <div class="score-header">
              <div class="score-color" :class="range.colorClass"></div>
              <span class="score-label">{{ range.label }}</span>
            </div>
            <div class="score-stats">
              <div class="score-count">{{ range.count }}</div>
              <div class="score-percentage">{{ range.percentage }}%</div>
            </div>
            <div class="score-bar">
              <div
                class="score-fill"
                :class="range.colorClass"
                :style="{ width: `${range.percentage}%` }"
              ></div>
            </div>
          </div>
        </div>
      </div>

      <!-- Дополнительная статистика -->
      <div class="additional-stats">
        <div class="stat-row">
          <span class="stat-label">Активных пользователей:</span>
          <span class="stat-value">{{ testData.unique_users || 0 }}</span>
        </div>
        <div class="stat-row">
          <span class="stat-label">Неудачных попыток:</span>
          <span class="stat-value">{{ testData.failed_attempts || 0 }}</span>
        </div>
        <div class="stat-row">
          <span class="stat-label">Процент успеха:</span>
          <span class="stat-value success">{{ Math.round(testData.success_rate || 0) }}%</span>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.testing-card {
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
  grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
  gap: 16px;
}

.metric-card {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 16px;
  border-radius: 8px;
  border: 1px solid var(--color-border);
}

.metric-card.primary {
  background: #eff6ff;
  border-color: #3b82f6;
}

.metric-card.success {
  background: #f0fdf4;
  border-color: #10b981;
}

.metric-card.warning {
  background: #fffbeb;
  border-color: #f59e0b;
}

.metric-card.info {
  background: #f5f3ff;
  border-color: #8b5cf6;
}

.metric-icon {
  width: 40px;
  height: 40px;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.primary .metric-icon { background: #3b82f6; }
.success .metric-icon { background: #10b981; }
.warning .metric-icon { background: #f59e0b; }
.info .metric-icon { background: #8b5cf6; }

.icon {
  width: 20px;
  height: 20px;
  color: white;
}

.metric-content {
  flex: 1;
}

.metric-value {
  font-size: 20px;
  font-weight: 700;
  color: var(--color-text-primary);
  line-height: 1;
}

.metric-label {
  font-size: 12px;
  color: var(--color-text-secondary);
  margin-top: 4px;
}

.charts-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 24px;
}

.chart-section {
  background: var(--color-secondary-background);
  border-radius: 8px;
  padding: 16px;
  border: 1px solid var(--color-border);
}

.chart-title {
  font-size: 14px;
  font-weight: 600;
  color: var(--color-text-primary);
  margin-bottom: 16px;
  text-align: center;
}

.chart-container {
  display: flex;
  justify-content: center;
  align-items: center;
}

.table-section {
  background: var(--color-secondary-background);
  border-radius: 8px;
  padding: 16px;
  border: 1px solid var(--color-border);
}

.table-title {
  font-size: 14px;
  font-weight: 600;
  color: var(--color-text-primary);
  margin-bottom: 16px;
}

.scores-grid {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.score-item {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 12px;
  background: var(--color-primary-background);
  border-radius: 6px;
}

.score-header {
  display: flex;
  align-items: center;
  gap: 8px;
  min-width: 80px;
}

.score-color {
  width: 12px;
  height: 12px;
  border-radius: 50%;
}

.score-label {
  font-size: 12px;
  font-weight: 500;
  color: var(--color-text-primary);
}

.score-stats {
  display: flex;
  flex-direction: column;
  align-items: center;
  min-width: 60px;
}

.score-count {
  font-size: 16px;
  font-weight: 600;
  color: var(--color-text-primary);
}

.score-percentage {
  font-size: 11px;
  color: var(--color-text-secondary);
}

.score-bar {
  flex: 1;
  height: 6px;
  background: var(--color-border);
  border-radius: 3px;
  overflow: hidden;
}

.score-fill {
  height: 100%;
  border-radius: 3px;
  transition: width 0.3s ease;
}

.additional-stats {
  background: var(--color-secondary-background);
  border-radius: 8px;
  padding: 16px;
  border: 1px solid var(--color-border);
}

.stat-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 8px 0;
  border-bottom: 1px solid var(--color-border);
}

.stat-row:last-child {
  border-bottom: none;
}

.stat-label {
  font-size: 13px;
  color: var(--color-text-secondary);
}

.stat-value {
  font-size: 14px;
  font-weight: 600;
  color: var(--color-text-primary);
}

.stat-value.success {
  color: #10b981;
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

/* Цветовые классы для индикаторов */
.bg-green-500 { background-color: #10b981; }
.bg-blue-500 { background-color: #3b82f6; }
.bg-yellow-500 { background-color: #eab308; }
.bg-orange-500 { background-color: #f97316; }
.bg-red-500 { background-color: #ef4444; }

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

@media (max-width: 768px) {
  .metrics-grid {
    grid-template-columns: repeat(2, 1fr);
  }

  .charts-grid {
    grid-template-columns: 1fr;
  }

  .score-item {
    flex-direction: column;
    align-items: flex-start;
    gap: 8px;
  }

  .score-bar {
    width: 100%;
  }
}
</style>