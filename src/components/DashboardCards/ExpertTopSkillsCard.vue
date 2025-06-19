<script setup>
import { ref, computed, onMounted } from 'vue'
import VueApexCharts from 'vue3-apexcharts'
import {
  TrendingUp, Users, CheckCircle, TestTube2, Award,
  AlertCircle, RotateCcw
} from 'lucide-vue-next'
import { dashboardService } from '@/js/api/services/dashboardService.js'

const isLoading = ref(true)
const error = ref(null)
const skills = ref([])

// Настройки для столбчатой диаграммы
const chartOptions = computed(() => ({
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
      horizontal: true,
      borderRadius: 6,
      dataLabels: {
        position: 'top'
      }
    }
  },
  dataLabels: {
    enabled: true,
    offsetX: 30,
    style: {
      fontSize: '11px',
      fontWeight: 'bold',
      colors: ['var(--color-text-primary)']
    }
  },
  xaxis: {
    categories: skills.value.map(skill => skill.skill_name),
    labels: {
      style: {
        fontSize: '11px',
        colors: 'var(--color-text-secondary)'
      }
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

const chartSeries = computed(() => [
  {
    name: 'Всего пользователей',
    data: skills.value.map(skill => skill.total_users)
  },
  {
    name: 'Подтверждённые',
    data: skills.value.map(skill => skill.confirmed_users)
  }
])

const fetchTopSkills = async () => {
  try {
    isLoading.value = true
    error.value = null

    const response = await dashboardService.getExpertTopSkills(10)

    if (!response || !Array.isArray(response)) {
      throw new Error('Полученные данные имеют неверный формат')
    }

    skills.value = response

  } catch (err) {
    error.value = err.response?.data?.message ||
                 err.message ||
                 'Неизвестная ошибка при загрузке данных'
    console.error('Произошла ошибка:', err)
  } finally {
    isLoading.value = false
  }
}

const refreshData = () => {
  fetchTopSkills()
}

onMounted(() => {
  fetchTopSkills()
})
</script>

<template>
  <div class="skills-card">
    <div class="card-header">
      <div class="header-content">
        <span class="title">Топ навыки системы</span>
        <h3 class="subtitle">Популярные навыки среди пользователей</h3>
      </div>
      <button @click="refreshData" class="refresh-btn" :disabled="isLoading">
        <RotateCcw :class="['refresh-icon', { spinning: isLoading }]" />
      </button>
    </div>

    <div v-if="isLoading" class="loading-state">
      <div class="spinner"></div>
    </div>

    <div v-else-if="error" class="error-state">
      {{ error }}
      <button @click="fetchTopSkills" class="retry-btn">Попробовать снова</button>
    </div>

    <div v-else class="content">
      <!-- Список навыков -->
      <div class="skills-list">
        <div v-for="(skill, index) in skills.slice(0, 5)" :key="skill.skill_id" class="skill-item">
          <div class="skill-rank">{{ index + 1 }}</div>
          <div class="skill-content">
            <div class="skill-name">{{ skill.skill_name }}</div>
            <div class="skill-stats">
              <span class="stat">
                <Users class="stat-icon" />
                {{ skill.total_users }} чел.
              </span>
              <span class="stat">
                <CheckCircle class="stat-icon" />
                {{ skill.confirmed_users }} подтв.
              </span>
              <span v-if="skill.has_test" class="stat">
                <TestTube2 class="stat-icon" />
                {{ skill.success_rate }}%
              </span>
            </div>
          </div>
          <div class="skill-progress">
            <div class="progress-bar">
              <div
                class="progress-fill"
                :style="{ width: `${Math.min(100, (skill.confirmed_users / Math.max(skill.total_users, 1)) * 100)}%` }"
              ></div>
            </div>
            <span class="progress-text">
              {{ Math.round((skill.confirmed_users / Math.max(skill.total_users, 1)) * 100) }}%
            </span>
          </div>
        </div>
      </div>

      <!-- График -->
      <div v-if="skills.length > 0" class="chart-container">
        <VueApexCharts
          width="100%"
          height="300"
          type="bar"
          :options="chartOptions"
          :series="chartSeries"
        />
      </div>

      <div v-else class="no-data">
        <AlertCircle class="no-data-icon" />
        <p>Нет данных о навыках</p>
      </div>
    </div>
  </div>
</template>

<style scoped>
.skills-card {
  background: var(--color-primary-background);
  border-radius: 12px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  padding: 20px;
  margin-bottom: 24px;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 20px;
}

.header-content {
  flex: 1;
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

.refresh-btn {
  background: var(--color-secondary-background);
  border: 1px solid var(--color-border);
  border-radius: 6px;
  padding: 8px;
  cursor: pointer;
  color: var(--color-text-secondary);
  transition: all 0.2s;
}

.refresh-btn:hover:not(:disabled) {
  background: var(--color-accent);
  color: white;
}

.refresh-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.refresh-icon {
  width: 16px;
  height: 16px;
  transition: transform 0.2s;
}

.spinning {
  animation: spin 1s linear infinite;
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

.skills-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.skill-item {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 16px;
  background: var(--color-secondary-background);
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
  margin-bottom: 4px;
}

.skill-stats {
  display: flex;
  gap: 16px;
  flex-wrap: wrap;
}

.stat {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 12px;
  color: var(--color-text-secondary);
}

.stat-icon {
  width: 12px;
  height: 12px;
}

.skill-progress {
  display: flex;
  align-items: center;
  gap: 8px;
  min-width: 80px;
}

.progress-bar {
  width: 60px;
  height: 6px;
  background: var(--color-border);
  border-radius: 3px;
  overflow: hidden;
}

.progress-fill {
  height: 100%;
  background: linear-gradient(90deg, #3b82f6, #8b5cf6);
  border-radius: 3px;
  transition: width 0.3s ease;
}

.progress-text {
  font-size: 11px;
  font-weight: 500;
  color: var(--color-text-secondary);
  min-width: 32px;
}

.chart-container {
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
  .skill-item {
    flex-direction: column;
    align-items: flex-start;
    gap: 12px;
  }

  .skill-progress {
    width: 100%;
    justify-content: space-between;
  }

  .progress-bar {
    flex: 1;
    margin-right: 8px;
  }
}
</style>