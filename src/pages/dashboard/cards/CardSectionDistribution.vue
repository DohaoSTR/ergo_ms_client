<script setup>
import { ref, onMounted, computed } from 'vue'
import VueApexCharts from 'vue3-apexcharts'
import { crmService } from '@/js/api/services/crmService'

const isLoading = ref(true)
const error = ref(null)
const sectionData = ref([])

const fetchSectionStats = async () => {
  try {
    isLoading.value = true
    error.value = null

    const response = await crmService.getSectionStats()

    if (!response || !response.data || !Array.isArray(response.data)) {
      throw new Error('Полученные данные имеют неверный формат')
    }

    sectionData.value = response.data
  } catch (err) {
    error.value = err.response?.data?.message ||
                 err.message ||
                 'Неизвестная ошибка при загрузке данных'
    console.error('Произошла ошибка:', err)
  } finally {
    isLoading.value = false
  }
}

// Настройки для полярной диаграммы
const polarChartOptions = computed(() => ({
  chart: {
    type: 'polarArea',
    toolbar: { show: false },
    fontFamily: 'Inter, sans-serif',
    foreColor: 'var(--color-background-primary)',
    height: '100%'
  },
  stroke: {
    colors: ['#fff']
  },
  fill: {
    opacity: 0.8
  },
  responsive: [{
    breakpoint: 480,
    options: {
      chart: {
        width: '100%'
      },
      legend: {
        position: 'bottom',
        horizontalAlign: 'center'
      }
    }
  }],
  labels: sectionData.value.map(item => item.section_name),
  legend: {
    position: 'right',
    horizontalAlign: 'left',
    floating: false,
    fontSize: '14px',
    offsetX: 10,
    offsetY: 0,
    width: 300,
    height: undefined,
    itemMargin: {
      horizontal: 5,
      vertical: 8
    },
    labels: {
      colors: 'var(--color-background-primary)'
    },
    formatter: function(seriesName, opts) {
      return seriesName + ': ' + opts.w.globals.series[opts.seriesIndex] + ' задач'
    }
  },
  plotOptions: {
    polarArea: {
      rings: {
        strokeWidth: 1,
        strokeColor: '#e8e8e8'
      },
      spokes: {
        strokeWidth: 1,
        connectorColors: '#e8e8e8'
      }
    }
  },
  colors: ['#008FFB', '#00E396', '#FEB019', '#FF4560', '#775DD0', '#4CAF50', '#2196F3', '#FF9800'],
  tooltip: {
    theme: 'dark',
    y: {
      formatter: function(val) {
        return val + ' задач'
      }
    }
  },
  theme: {
    mode: 'dark'
  }
}))

// Данные для диаграммы
const chartSeries = computed(() => {
  return sectionData.value.map(item => item.tasks_count)
})

onMounted(() => {
  fetchSectionStats()
})
</script>

<template>
  <div class="section-chart-card">
    <div class="card-header">
      <span class="title">Распределение задач по секциям</span>
      <h3 class="subtitle">Количество задач в каждой секции</h3>
    </div>

    <div v-if="isLoading" class="loading-state">
      <div class="spinner"></div>
    </div>

    <div v-else-if="error" class="error-state">
      {{ error }}
      <button @click="fetchSectionStats" class="retry-btn">Попробовать снова</button>
    </div>

    <div v-else-if="sectionData.length === 0" class="no-data-state">
      <div class="no-data-message">Нет данных для отображения</div>
    </div>

    <div v-else class="chart-container">
      <VueApexCharts
        width="100%"
        height="600"
        type="polarArea"
        :options="polarChartOptions"
        :series="chartSeries"
      />
    </div>
  </div>
</template>

<style scoped>
.section-chart-card {
  background: var(--color-primary-background);
  border-radius: 12px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  padding: 20px;
  margin-bottom: 24px;
  min-height: 700px;
  display: flex;
  flex-direction: column;
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
  height: 600px;
}

.spinner {
  width: 40px;
  height: 40px;
  border: 4px solid #e2e8f0;
  border-top: 4px solid #3b82f6;
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

.error-state {
  padding: 20px;
  background: #fee2e2;
  color: #b91c1c;
  border-radius: 8px;
  text-align: center;
  height: 600px;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
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

.no-data-state {
  display: flex;
  justify-content: center;
  align-items: center;
  height: 600px;
  background: var(--color-secondary-background);
  border-radius: 8px;
}

.no-data-message {
  color: var(--color-text-secondary);
  font-size: 16px;
}

.chart-container {
  height: 600px;
  flex-grow: 1;
  position: relative;
  margin-right: 40px;
}
</style>
