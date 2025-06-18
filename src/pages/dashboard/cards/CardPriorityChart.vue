<script setup>
import { ref, onMounted, computed } from 'vue'
import VueApexCharts from 'vue3-apexcharts'
import { crmService } from '@/js/api/services/crmService'

const priorityLabels = {
  1: 'Низкий',
  2: 'Средний',
  3: 'Высокий',
  4: 'Критический'
}

const isLoading = ref(true)
const error = ref(null)
const priorityData = ref([])

const fetchPriorityStats = async () => {
  try {
    isLoading.value = true
    error.value = null

    const response = await crmService.getPriorityStats()

    if (!response || !response.data || !Array.isArray(response.data)) {
      throw new Error('Полученные данные имеют неверный формат')
    }

    // Обработка данных с сервера
    priorityData.value = response.data.map(item => {
      return {
        ...item,
        priority_name: priorityLabels[item.priority] || `Приоритет ${item.priority}`
      }
    }).sort((a, b) => a.priority - b.priority)

  } catch (err) {
    error.value = err.response?.data?.message ||
                 err.message ||
                 'Неизвестная ошибка при загрузке данных'
    console.error('Произошла ошибка:', err)
  } finally {
    isLoading.value = false
  }
}

// Настройки для столбчатой диаграммы
const barChartOptions = computed(() => ({
  chart: {
    type: 'bar',
    stacked: true,
    toolbar: { show: false },
    fontFamily: 'Inter, sans-serif',
    background: 'transparent',
    foreColor: 'var(--color-background-primary)'
  },
  plotOptions: {
    bar: {
      horizontal: false,
      columnWidth: '55%',
      borderRadius: 5,
      dataLabels: {
        position: 'top'
      }
    }
  },
  dataLabels: {
    enabled: false
  },
  stroke: {
    show: true,
    width: 2,
    colors: ['transparent']
  },
  xaxis: {
    categories: priorityData.value.map(item => item.priority_name),
    labels: {
      style: {
        colors: 'var(--color-background-primary)',
        fontSize: '12px',
        fontFamily: 'Inter, sans-serif'
      }
    }
  },
  yaxis: {
    title: {
      text: 'Количество задач',
      style: {
        color: 'var(--color-background-primary)'
      }
    },
    labels: {
      style: {
        colors: 'var(--color-background-primary)'
      }
    }
  },
  colors: ['#66bb6a', '#ff7979'],
  legend: {
    position: 'top',
    horizontalAlign: 'center',
    offsetY: 5,
    labels: {
      colors: 'var(--color-background-primary)'
    }
  },
  fill: {
    opacity: 1
  },
  tooltip: {
    theme: 'dark',
    y: {
      formatter: function (val) {
        return val + " задач"
      }
    }
  },
  theme: {
    mode: 'dark'
  }
}))

// Данные для диаграммы
const chartSeries = computed(() => {
  if (priorityData.value.length === 0) return []

  return [
    {
      name: 'Выполнено',
      data: priorityData.value.map(item => item.completed_tasks)
    },
    {
      name: 'В работе',
      data: priorityData.value.map(item => item.pending_tasks)
    }
  ]
})

onMounted(() => {
  fetchPriorityStats()
})
</script>

<template>
  <div class="priority-chart-card">
    <div class="card-header">
      <span class="title">Задачи по приоритетам</span>
      <h3 class="subtitle">Распределение выполненных и невыполненных задач</h3>
    </div>

    <div v-if="isLoading" class="loading-state">
      <div class="spinner"></div>
    </div>

    <div v-else-if="error" class="error-state">
      {{ error }}
      <button @click="fetchPriorityStats" class="retry-btn">Попробовать снова</button>
    </div>

    <div v-else-if="priorityData.length === 0" class="no-data-state">
      <div class="no-data-message">Нет данных для отображения</div>
    </div>

    <div v-else class="chart-container">
      <VueApexCharts
        width="100%"
        height="350"
        type="bar"
        :options="barChartOptions"
        :series="chartSeries"
      />
    </div>
  </div>
</template>

<style scoped>
.priority-chart-card {
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

.no-data-state {
  display: flex;
  justify-content: center;
  align-items: center;
  height: 300px;
  background: var(--color-secondary-background);
  border-radius: 8px;
}

.no-data-message {
  color: var(--color-text-secondary);
  font-size: 16px;
}

.chart-container {
  min-height: 350px;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}
</style>
