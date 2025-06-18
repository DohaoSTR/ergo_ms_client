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

    const response = await crmService.getEfficiencyStats()

    if (!response || !response.data || !Array.isArray(response.data)) {
      throw new Error('Полученные данные имеют неверный формат')
    }

    const apiData = response.data

    // Форматируем данные для графика
    statsData.value = apiData.map(task => ({
      x: new Date(task.deadline).getTime(),
      y: new Date(task.completed_at).getTime(),
      priority: task.priority,
      name: task.text,
      duration: task.actual_duration,
      planned: task.planned_duration,
      is_on_time: task.is_on_time
    }))

  } catch (err) {
    error.value = err.response?.data?.message ||
                 err.message ||
                 'Неизвестная ошибка при загрузке данных'
    console.error('Произошла ошибка:', err)
  } finally {
    isLoading.value = false
  }
}

// Вычисляем минимальную и максимальную даты для осей
const dateRange = computed(() => {
  if (!statsData.value.length) return { min: new Date(), max: new Date() }

  const dates = statsData.value.flatMap(item => [item.x, item.y])
  return {
    min: new Date(Math.min(...dates)),
    max: new Date(Math.max(...dates))
  }
})

// Настройки графика
const chartOptions = computed(() => ({
  chart: {
    type: 'scatter',
    toolbar: { show: false },
    fontFamily: 'Inter, sans-serif',
    background: 'transparent',
    animations: {
      enabled: false
    },
    locales: [{
      name: 'ru',
      options: {
        months: ['Январь', 'Февраль', 'Март', 'Апрель', 'Май', 'Июнь', 'Июль', 'Август', 'Сентябрь', 'Октябрь', 'Ноябрь', 'Декабрь'],
        shortMonths: ['Янв', 'Фев', 'Мар', 'Апр', 'Май', 'Июн', 'Июл', 'Авг', 'Сен', 'Окт', 'Ноя', 'Дек']
      }
    }],
    defaultLocale: 'ru'
  },
  xaxis: {
    type: 'datetime',
    min: dateRange.value.min.getTime(),
    max: dateRange.value.max.getTime(),
    title: {
      text: 'Плановая дата завершения',
      style: {
        fontSize: '12px',
        fontFamily: 'Inter, sans-serif'
      }
    },
    labels: {
      style: {
        fontSize: '10px',
        fontFamily: 'Inter, sans-serif'
      },
      formatter: function(value) {
        return new Date(value).toLocaleDateString('ru-RU', {
          day: '2-digit',
          month: 'short',
          year: 'numeric'
        })
      }
    },
    tooltip: {
      enabled: false
    }
  },
  yaxis: {
    type: 'datetime',
    min: dateRange.value.min.getTime(),
    max: dateRange.value.max.getTime(),
    title: {
      text: 'Фактическая дата завершения',
      style: {
        fontSize: '12px',
        fontFamily: 'Inter, sans-serif'
      }
    },
    labels: {
      style: {
        fontSize: '10px',
        fontFamily: 'Inter, sans-serif'
      },
      formatter: function(value) {
        return new Date(value).toLocaleDateString('ru-RU', {
          day: '2-digit',
          month: 'short',
          year: 'numeric'
        })
      }
    }
  },
  tooltip: {
    custom: function({ dataPointIndex, seriesIndex }) {
      const point = statsData.value.filter(task =>
        seriesIndex === 0 ? task.is_on_time : !task.is_on_time
      )[dataPointIndex]

      const dateFormat = { day: '2-digit', month: 'short', year: 'numeric' }
      const planDate = new Date(point.x).toLocaleDateString('ru-RU', dateFormat)
      const factDate = new Date(point.y).toLocaleDateString('ru-RU', dateFormat)

      return `
        <div class="custom-tooltip">
          <div><b>${point.name}</b></div>
          <div>Приоритет: ${point.priority}</div>
          <div>План: ${planDate}</div>
          <div>Факт: ${factDate}</div>
          <div>Длительность: ${point.duration} дней</div>
          <div>План: ${point.planned} дней</div>
          <div>${point.is_on_time ? '✅ В срок' : '❌ С опозданием'}</div>
        </div>
      `
    }
  },
  markers: {
    size: [4, 7],
    strokeWidth: 0,
    colors: ['#66bb6a', '#FF7979'],
    fillOpacity: 1
  },
  colors: ['#66bb6a', '#FF7979'],
  legend: {
    show: true,
    position: 'bottom',
    labels: {
      colors: 'var(--color-background-primary)'
    }
  }
}))

// Данные для графика с разделением на выполненные в срок и с опозданием
const chartSeries = computed(() => [
  {
    name: 'В срок',
    data: statsData.value.filter(task => task.is_on_time)
  },
  {
    name: 'С опозданием',
    data: statsData.value.filter(task => !task.is_on_time)
  }
])

onMounted(() => {
  fetchStats()
})
</script>

<template>
  <div class="efficiency-stats-card">
    <div class="card-header">
      <span class="title">Эффективность выполнения задач</span>
      <h3 class="subtitle">График распределения сроков</h3>
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
        type="scatter"
        :options="chartOptions"
        :series="chartSeries"
      />
    </div>
  </div>
</template>

<style scoped>
.efficiency-stats-card {
  background: var(--color-primary-background);
  border-radius: 12px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  padding: 20px;
  height: 480px;
}

.card-header {
  margin-bottom: 20px;
}

.title {
  font-size: 16px;
  font-weight: 600;
  color: var(--color-text-primary);
  display: block;
}

.subtitle {
  font-size: 14px;
  color: var(--color-text-secondary);
  margin-top: 4px;
  font-weight: normal;
  display: block;
}

.loading-state {
  display: flex;
  justify-content: center;
  align-items: center;
  height: calc(100% - 60px);
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
  margin-top: 20px;
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
  height: calc(100% - 60px);
}

.custom-tooltip {
  background: var(--color-background-primary);
  border-radius: 8px;
  padding: 0.75rem;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
  font-size: 0.875rem;
  line-height: 1.4;
}

.custom-tooltip div {
  margin-bottom: 0.25rem;
}

.custom-tooltip div:last-child {
  margin-bottom: 0;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}
</style>
