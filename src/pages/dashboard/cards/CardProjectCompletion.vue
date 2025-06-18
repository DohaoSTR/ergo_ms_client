<!-- CardProjectCompletion.vue -->
<script setup>
import { ref, onMounted, computed } from 'vue'
import VueApexCharts from 'vue3-apexcharts'
import { crmService } from '@/js/api/services/crmService'

const statsData = ref([])
const isLoading = ref(true)
const error = ref(null)

const fetchStats = async () => {
  try {
    isLoading.value = true
    error.value = null

    const response = await crmService.getProjectCompletionStats()

    if (!response || !response.data || !Array.isArray(response.data)) {
      throw new Error('Полученные данные имеют неверный формат')
    }

    statsData.value = response.data

  } catch (err) {
    error.value = err.response?.data?.message ||
                 err.message ||
                 'Неизвестная ошибка при загрузке данных'
    console.error('Произошла ошибка:', err)
  } finally {
    isLoading.value = false
  }
}

const chartOptions = computed(() => ({
  chart: {
    type: 'bar',
    height: 350,
    toolbar: { show: false },
    fontFamily: 'Inter, sans-serif',
    background: 'transparent',
    foreColor: 'var(--color-background-primary)'
  },
  plotOptions: {
    bar: {
      horizontal: true,
      borderRadius: 4,
      dataLabels: {
        position: 'top',
      },
    }
  },
  dataLabels: {
    enabled: true,
    formatter: function (val) {
      return val + '%';
    },
    offsetX: 0,
    style: {
      fontSize: '12px',
      colors: ['var(--color-background-primary)']
    }
  },
  colors: ['#66bb6a'],
  xaxis: {
    categories: statsData.value.map(item => item.project_name),
    labels: {
      style: {
        fontSize: '10px',
        fontFamily: 'Inter, sans-serif',
        color: 'var(--color-background-primary)'
      }
    }
  },
  yaxis: {
    labels: {
      style: {
        fontSize: '11px',
        fontFamily: 'Inter, sans-serif',
        color: 'var(--color-background-primary)'
      }
    }
  },
  tooltip: {
    y: {
      formatter: function(val) {
        return val + "%";
      }
    }
  }
}))

const chartSeries = computed(() => [{
  name: 'Процент выполнения',
  data: statsData.value.map(item => item.completion_percentage)
}])

onMounted(() => {
  fetchStats()
})
</script>

<template>
  <div class="stats-card">
    <div class="card-header">
      <span class="title">Статистика проектов</span>
      <h3 class="subtitle">Процент выполнения</h3>
    </div>

    <div v-if="isLoading" class="loading-state">
      <div class="spinner"></div>
    </div>

    <div v-else-if="error" class="error-state">
      {{ error }}
      <button @click="fetchStats" class="retry-btn">Попробовать снова</button>
    </div>

    <div v-else class="chart-container">
      <VueApexCharts
        width="100%"
        height="350"
        type="bar"
        :options="chartOptions"
        :series="chartSeries"
      />
    </div>
  </div>
</template>

<style scoped>
.stats-card {
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
  height: 300px;
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

.chart-container {
  min-height: 350px;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}
</style>