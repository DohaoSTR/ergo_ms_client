<script setup>
import { ref, computed, onMounted } from 'vue'
import VueApexCharts from 'vue3-apexcharts'
import { BookOpen, AlertCircle, Users, CheckCircle, TestTube2, Award, TrendingUp } from 'lucide-vue-next'
import { dashboardService } from '@/js/api/services/dashboardService.js'

const isLoading = ref(true)
const error = ref(null)
const skillsData = ref([])

// Настройки для столбчатой диаграммы пользователей
const usersChartOptions = computed(() => ({
  chart: {
    type: 'bar',
    fontFamily: 'Inter, sans-serif',
    background: 'transparent',
    toolbar: { show: false },
    animations: {
      enabled: true,
      easing: 'easeinout',
      speed: 800
    }
  },
  plotOptions: {
    bar: {
      horizontal: false,
      columnWidth: '60%',
      borderRadius: 4,
      dataLabels: {
        position: 'top'
      }
    }
  },
  dataLabels: {
    enabled: true,
    offsetY: -20,
    style: {
      fontSize: '10px',
      fontWeight: 'bold',
      colors: ['var(--color-text-primary)']
    }
  },
  xaxis: {
    categories: skillsData.value.slice(0, 10).map(skill => skill.skill_name),
    labels: {
      style: {
        fontSize: '10px',
        colors: 'var(--color-text-secondary)'
      },
      rotate: -45
    }
  },
  yaxis: {
    labels: {
      style: {
        fontSize: '11px',
        colors: 'var(--color-text-secondary)'
      }
    }
  },
  grid: {
    borderColor: 'var(--color-border)',
    strokeDashArray: 3
  },
  colors: ['#3b82f6', '#10b981'],
  legend: {
    position: 'top',
    horizontalAlign: 'left',
    fontSize: '12px',
    labels: {
      colors: 'var(--color-text-primary)'
    }
  },
  tooltip: {
    enabled: true,
    style: {
      fontSize: '12px'
    }
  }
}))

// Настройки для scatter диаграммы успешности тестов
const testSuccessOptions = computed(() => ({
  chart: {
    type: 'scatter',
    fontFamily: 'Inter, sans-serif',
    background: 'transparent',
    toolbar: { show: false },
    animations: {
      enabled: true,
      easing: 'easeinout',
      speed: 800
    }
  },
  xaxis: {
    type: 'numeric',
    title: {
      text: 'Количество попыток тестов',
      style: {
        fontSize: '12px',
        color: 'var(--color-text-secondary)'
      }
    },
    labels: {
      style: {
        fontSize: '11px',
        colors: 'var(--color-text-secondary)'
      }
    }
  },
  yaxis: {
    title: {
      text: 'Процент успеха (%)',
      style: {
        fontSize: '12px',
        color: 'var(--color-text-secondary)'
      }
    },
    labels: {
      style: {
        fontSize: '11px',
        colors: 'var(--color-text-secondary)'
      }
    }
  },
  colors: ['#8b5cf6'],
  markers: {
    size: 6,
    hover: {
      size: 8
    }
  },
  grid: {
    borderColor: 'var(--color-border)',
    strokeDashArray: 3
  },
  tooltip: {
    enabled: true,
    custom: function({ series, seriesIndex, dataPointIndex, w }) {
      const skill = skillsData.value[dataPointIndex]
      return `
        <div style="padding: 8px; background: var(--color-primary-background); border-radius: 4px;">
          <strong>${skill?.skill_name || 'N/A'}</strong><br/>
          Попытки: ${skill?.test_attempts || 0}<br/>
          Успех: ${skill?.success_rate || 0}%<br/>
          Ср. балл: ${skill?.avg_test_score || 0}
        </div>
      `
    }
  }
}))

const usersChartSeries = computed(() => [
  {
    name: 'Всего пользователей',
    data: skillsData.value.slice(0, 10).map(skill => skill.total_users || 0)
  },
  {
    name: 'Подтвержденные',
    data: skillsData.value.slice(0, 10).map(skill => skill.confirmed_users || 0)
  }
])

const testSuccessSeries = computed(() => [{
  name: 'Навыки с тестами',
  data: skillsData.value
    .filter(skill => (skill.test_attempts || 0) > 0)
    .map(skill => [skill.test_attempts || 0, skill.success_rate || 0])
}])

const topSkills = computed(() => skillsData.value.slice(0, 8))

const getSuccessRateColor = (rate) => {
  if (rate >= 80) return 'text-green-600'
  if (rate >= 60) return 'text-yellow-600'
  return 'text-red-600'
}

const getSuccessRateColorClass = (rate) => {
  if (rate >= 80) return 'bg-green-500'
  if (rate >= 60) return 'bg-yellow-500'
  return 'bg-red-500'
}

const fetchSkillsAnalytics = async () => {
  try {
    isLoading.value = true
    error.value = null

    const response = await dashboardService.getExpertSkillsAnalytics()

    if (!response || !Array.isArray(response)) {
      throw new Error('Полученные данные имеют неверный формат')
    }

    skillsData.value = response

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
  fetchSkillsAnalytics()
})
</script>

<template>
  <div class="skills-analytics-card">
    <div class="card-header">
      <span class="title">Детальная аналитика навыков</span>
      <h3 class="subtitle">Комплексный анализ использования и тестирования навыков</h3>
    </div>

    <div v-if="isLoading" class="loading-state">
      <div class="spinner"></div>
    </div>

    <div v-else-if="error" class="error-state">
      {{ error }}
      <button @click="fetchSkillsAnalytics" class="retry-btn">Попробовать снова</button>
    </div>

    <div v-else class="content">
      <!-- Топ навыки в карточках -->
      <div class="top-skills-section">
        <h4 class="section-title">Топ навыки по активности</h4>
        <div class="skills-grid">
          <div v-for="(skill, index) in topSkills" :key="skill.skill_id" class="skill-card">
            <div class="skill-rank">{{ index + 1 }}</div>
            <div class="skill-content">
              <div class="skill-name">{{ skill.skill_name }}</div>
              <div class="skill-metrics">
                <div class="metric">
                  <Users class="metric-icon" />
                  <span>{{ skill.total_users || 0 }}</span>
                </div>
                <div class="metric">
                  <CheckCircle class="metric-icon" />
                  <span>{{ skill.confirmed_users || 0 }}</span>
                </div>
                <div v-if="skill.test_count > 0" class="metric">
                  <TestTube2 class="metric-icon" />
                  <span>{{ skill.success_rate || 0 }}%</span>
                </div>
              </div>
            </div>
            <div class="skill-progress">
              <div class="progress-circle" :style="{
                background: `conic-gradient(#3b82f6 ${(skill.confirmed_users / Math.max(skill.total_users, 1)) * 360}deg, #e5e7eb 0deg)`
              }">
                <div class="progress-text">
                  {{ Math.round((skill.confirmed_users / Math.max(skill.total_users, 1)) * 100) }}%
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Графики -->
      <div class="charts-section">
        <div class="chart-container">
          <h4 class="chart-title">Активность пользователей по навыкам</h4>
          <div v-if="skillsData.length > 0" class="chart-wrapper">
            <VueApexCharts
              width="100%"
              height="300"
              type="bar"
              :options="usersChartOptions"
              :series="usersChartSeries"
            />
          </div>
          <div v-else class="no-data">
            <AlertCircle class="no-data-icon" />
            <p>Нет данных для отображения</p>
          </div>
        </div>

        <div class="chart-container">
          <h4 class="chart-title">Корреляция попыток и успешности тестов</h4>
          <div v-if="testSuccessSeries[0]?.data?.length > 0" class="chart-wrapper">
            <VueApexCharts
              width="100%"
              height="300"
              type="scatter"
              :options="testSuccessOptions"
              :series="testSuccessSeries"
            />
          </div>
          <div v-else class="no-data">
            <AlertCircle class="no-data-icon" />
            <p>Нет данных о тестах</p>
          </div>
        </div>
      </div>

      <!-- Детальная таблица -->
      <div class="table-section">
        <h4 class="section-title">Подробная статистика навыков</h4>
        <div class="table-container">
          <!-- Заголовки для десктопа -->
          <div class="table-header">
            <div class="header-cell name">Навык</div>
            <div class="header-cell">Пользователи</div>
            <div class="header-cell">Подтверждено</div>
            <div class="header-cell">Тесты</div>
            <div class="header-cell">Успешность</div>
            <div class="header-cell">Ср. балл</div>
          </div>

          <!-- Строки данных -->
          <div class="table-body">
            <div v-for="skill in skillsData.slice(0, 15)" :key="skill.skill_id" class="table-row">
              <!-- Мобильная версия -->
              <div class="mobile-card">
                <div class="mobile-header">
                  <h5 class="skill-name-mobile">{{ skill.skill_name }}</h5>
                  <div v-if="skill.test_count > 0" class="test-badge">
                    {{ skill.test_count }} тест{{ skill.test_count > 1 ? 'а' : '' }}
                  </div>
                </div>
                <div class="mobile-stats">
                  <div class="mobile-stat">
                    <span class="label">Пользователи:</span>
                    <span class="value">{{ skill.total_users || 0 }}</span>
                  </div>
                  <div class="mobile-stat">
                    <span class="label">Подтверждено:</span>
                    <span class="value">{{ skill.confirmed_users || 0 }}</span>
                  </div>
                  <div class="mobile-stat">
                    <span class="label">Успешность:</span>
                    <span class="value" :class="getSuccessRateColor(skill.success_rate)">
                      {{ skill.success_rate || 0 }}%
                    </span>
                  </div>
                  <div class="mobile-stat">
                    <span class="label">Ср. балл:</span>
                    <span class="value">{{ skill.avg_test_score || 0 }}</span>
                  </div>
                </div>
              </div>

              <!-- Десктопная версия -->
              <div class="desktop-row">
                <div class="cell name">
                  <div class="skill-indicator"></div>
                  <span class="skill-name-desktop">{{ skill.skill_name }}</span>
                </div>
                <div class="cell">
                  <div class="stat-group">
                    <span class="primary-stat">{{ skill.total_users || 0 }}</span>
                    <span class="secondary-stat">{{ skill.unconfirmed_users || 0 }} неподтв.</span>
                  </div>
                </div>
                <div class="cell">
                  <div class="stat-group">
                    <span class="primary-stat confirmed">{{ skill.confirmed_users || 0 }}</span>
                    <div class="mini-progress">
                      <div
                        class="mini-progress-fill"
                        :style="{ width: `${skill.total_users > 0 ? (skill.confirmed_users / skill.total_users) * 100 : 0}%` }"
                      ></div>
                    </div>
                  </div>
                </div>
                <div class="cell">
                  <div class="stat-group">
                    <span class="primary-stat">{{ skill.test_attempts || 0 }}</span>
                    <span class="secondary-stat">{{ skill.test_passes || 0 }} успешно</span>
                  </div>
                </div>
                <div class="cell">
                  <div class="stat-group">
                    <span class="primary-stat" :class="getSuccessRateColor(skill.success_rate)">
                      {{ skill.success_rate || 0 }}%
                    </span>
                    <div class="mini-progress">
                      <div
                        class="mini-progress-fill"
                        :class="getSuccessRateColorClass(skill.success_rate)"
                        :style="{ width: `${skill.success_rate || 0}%` }"
                      ></div>
                    </div>
                  </div>
                </div>
                <div class="cell">
                  <span class="primary-stat score">{{ skill.avg_test_score || 0 }}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div v-if="skillsData.length > 15" class="table-footer">
          <p class="footer-text">Показано 15 из {{ skillsData.length }} навыков</p>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.skills-analytics-card {
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
  gap: 32px;
}

.section-title {
  font-size: 14px;
  font-weight: 600;
  color: var(--color-text-primary);
  margin-bottom: 16px;
}

.top-skills-section {
  background: var(--color-secondary-background);
  border-radius: 8px;
  padding: 20px;
  border: 1px solid var(--color-border);
}

.skills-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 16px;
}

.skill-card {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 16px;
  background: var(--color-primary-background);
  border-radius: 8px;
  border: 1px solid var(--color-border);
}

.skill-rank {
  width: 32px;
  height: 32px;
  background: #3b82f6;
  color: white;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 600;
  font-size: 14px;
  flex-shrink: 0;
}

.skill-content {
  flex: 1;
  min-width: 0;
}

.skill-name {
  font-weight: 500;
  color: var(--color-text-primary);
  margin-bottom: 8px;
  font-size: 14px;
}

.skill-metrics {
  display: flex;
  gap: 12px;
  flex-wrap: wrap;
}

.metric {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 12px;
  color: var(--color-text-secondary);
}

.metric-icon {
  width: 12px;
  height: 12px;
}

.skill-progress {
  flex-shrink: 0;
}

.progress-circle {
  width: 48px;
  height: 48px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
}

.progress-circle::before {
  content: '';
  position: absolute;
  inset: 4px;
  background: var(--color-primary-background);
  border-radius: 50%;
}

.progress-text {
  position: relative;
  z-index: 1;
  font-size: 10px;
  font-weight: 600;
  color: var(--color-text-primary);
}

.charts-section {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 24px;
}

.chart-container {
  background: var(--color-secondary-background);
  border-radius: 8px;
  padding: 20px;
  border: 1px solid var(--color-border);
}

.chart-title {
  font-size: 14px;
  font-weight: 600;
  color: var(--color-text-primary);
  margin-bottom: 16px;
  text-align: center;
}

.chart-wrapper {
  display: flex;
  justify-content: center;
  align-items: center;
}

.table-section {
  background: var(--color-secondary-background);
  border-radius: 8px;
  padding: 20px;
  border: 1px solid var(--color-border);
}

.table-container {
  border-radius: 6px;
  overflow: hidden;
  border: 1px solid var(--color-border);
}

.table-header {
  display: none;
  background: var(--color-primary-background);
  padding: 12px;
  border-bottom: 1px solid var(--color-border);
  font-size: 12px;
  font-weight: 600;
  color: var(--color-text-secondary);
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.header-cell {
  text-align: center;
}

.header-cell.name {
  text-align: left;
  flex: 2;
}

.table-body {
  display: flex;
  flex-direction: column;
}

.table-row {
  border-bottom: 1px solid var(--color-border);
}

.table-row:last-child {
  border-bottom: none;
}

.mobile-card {
  display: block;
  padding: 16px;
  background: var(--color-primary-background);
}

.mobile-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
}

.skill-name-mobile {
  font-weight: 500;
  color: var(--color-text-primary);
  font-size: 14px;
  margin: 0;
}

.test-badge {
  font-size: 10px;
  background: #dbeafe;
  color: #3b82f6;
  padding: 4px 8px;
  border-radius: 12px;
}

.mobile-stats {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 8px;
}

.mobile-stat {
  display: flex;
  justify-content: space-between;
  font-size: 12px;
}

.mobile-stat .label {
  color: var(--color-text-secondary);
}

.mobile-stat .value {
  font-weight: 500;
  color: var(--color-text-primary);
}

.desktop-row {
  display: none;
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

.table-footer {
  text-align: center;
  margin-top: 16px;
}

.footer-text {
  font-size: 12px;
  color: var(--color-text-secondary);
}

/* Цветовые классы */
.text-green-600 { color: #059669; }
.text-yellow-600 { color: #d97706; }
.text-red-600 { color: #dc2626; }
.bg-green-500 { background-color: #10b981; }
.bg-yellow-500 { background-color: #eab308; }
.bg-red-500 { background-color: #ef4444; }

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

/* Десктопные стили */
@media (min-width: 1024px) {
  .mobile-card {
    display: none;
  }

  .desktop-row {
    display: grid;
    grid-template-columns: 2fr 1fr 1fr 1fr 1fr 1fr;
    gap: 16px;
    align-items: center;
    padding: 16px;
    background: var(--color-primary-background);
  }

  .table-header {
    display: grid;
    grid-template-columns: 2fr 1fr 1fr 1fr 1fr 1fr;
    gap: 16px;
  }

  .cell {
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .cell.name {
    justify-content: flex-start;
    gap: 8px;
  }

  .skill-indicator {
    width: 8px;
    height: 8px;
    background: #3b82f6;
    border-radius: 50%;
    flex-shrink: 0;
  }

  .skill-name-desktop {
    font-weight: 500;
    color: var(--color-text-primary);
    font-size: 13px;
  }

  .stat-group {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 4px;
  }

  .primary-stat {
    font-size: 14px;
    font-weight: 600;
    color: var(--color-text-primary);
  }

  .primary-stat.confirmed {
    color: #059669;
  }

  .primary-stat.score {
    color: #d97706;
  }

  .secondary-stat {
    font-size: 10px;
    color: var(--color-text-secondary);
  }

  .mini-progress {
    width: 40px;
    height: 3px;
    background: var(--color-border);
    border-radius: 2px;
    overflow: hidden;
  }

  .mini-progress-fill {
    height: 100%;
    background: #10b981;
    border-radius: 2px;
    transition: width 0.3s ease;
  }
}

@media (max-width: 768px) {
  .charts-section {
    grid-template-columns: 1fr;
  }

  .skills-grid {
    grid-template-columns: 1fr;
  }
}
</style>