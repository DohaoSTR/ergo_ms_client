<script setup>
import { ref, onMounted, computed } from 'vue'
import VueApexCharts from 'vue3-apexcharts'
import { crmService } from '@/js/api/services/crmService'

const statsData = ref([])
const isLoading = ref(true)
const error = ref(null)
const years = ref([])
const months = ref(['Янв', 'Фев', 'Мар', 'Апр', 'Май', 'Июн', 'Июл', 'Авг', 'Сен', 'Окт', 'Ноя', 'Дек'])
const currentDate = new Date()
const currentYear = currentDate.getFullYear()
const currentMonth = currentDate.getMonth() + 1

const fetchStats = async () => {
  try {
    isLoading.value = true
    error.value = null

    const response = await crmService.getMonthlyStats()

    if (!response || !response.data || !Array.isArray(response.data)) {
      throw new Error('Полученные данные имеют неверный формат')
    }

    const apiData = response.data

    // Обработка данных
    years.value = [...new Set(apiData.map(item => item.year))].sort((a, b) => a - b)

    const formattedData = []
    years.value.forEach(year => {
      const monthToShow = year === currentYear ? currentMonth :12

      for (let monthIndex = 0; monthIndex < monthToShow; monthIndex++) {
        const monthNum = monthIndex + 1
        const dataPoint = apiData.find(item =>
          item.year === year && item.month === monthNum
        )

        formattedData.push({
          x: months.value[monthIndex],
          y: year.toString(),
          value: dataPoint ? dataPoint.total_tasks : 0,
          month: `${year}-${monthNum.toString().padStart(2, '0')}`
        })
      }
    })

    statsData.value = formattedData

  } catch (err) {
    error.value = err.response?.data?.message ||
                 err.message ||
                 'Неизвестная ошибка при загрузке данных'
    console.error('Произошла ошибка:', err)
  } finally {
    isLoading.value = false
  }
}

// Настройки графика для тепловой карты
const chartOptions = computed(() => ({
  chart: {
    type: 'heatmap',
    toolbar: { show: false },
    fontFamily: 'Inter, sans-serif',
    background: 'transparent',
    animations: {
      enabled: false
    },
    foreColor: 'var(--color-background-primary)'
  },
  dataLabels: {
    enabled: false,
    style: {
      fontSize: '10px',
      fontWeight: 'normal'
    },
    background: {
      enabled: false
    }
  },
  stroke: {
    width: 2,
    colors: ['rgba(0,0,0,0.2)']
  },
  tooltip: {
    enabled: true,
    x: {
      show: true
    },
    y: {
      title: {
        formatter: function() {
          return 'Всего задач:';
        }
      }
    },
    marker: {
      show: false
    }
  },
  xaxis: {
    categories: months.value,
    labels: {
      style: {
        fontSize: '10px',
        fontFamily: 'Inter, sans-serif',
        color: 'var(--color-background-primary)'
      }
    }
  },
  yaxis: {
    categories: years.value.map(y => y.toString()),
    reversed: false,
    labels: {
      style: {
        fontSize: '11px',
        fontFamily: 'Inter, sans-serif',
        color: 'var(--color-background-primary)'
      }
    }
  },
  plotOptions: {
    heatmap: {
      enableShades: false,
      radius: 0,
      distributed: false,
      useFillColorAsStroke: false,
      colorScale: {
        inverse: false,
        min: 0,
        max: 100,
        ranges: [
          {
            from: 0,
            to: 0,
            color: '#e0e0e0',
            name: 'Нет задач'
          },
          {
            from: 1,
            to: 5,
            color: '#FF7979',
            name: 'Мало',
            foreColor: '#ffffff'
          },
          {
            from: 6,
            to: 20,
            color: '#ffcc80',
            name: 'Средне',
            foreColor: '#ffffff'
          },
          {
            from: 21,
            to: 50,
            color: '#a5d6a7',
            name: 'Много',
            foreColor: '#ffffff'
          },
          {
            from: 51,
            to: 1000,
            color: '#66bb6a',
            name: 'Очень много',
            foreColor: '#ffffff'
          }
        ]
      }
    }
  },
  legend: {
    position: 'bottom',
    horizontalAlign: 'center',
    onItemClick: {
      toggleDataSeries: true
    },
    onItemHover: {
      highlightDataSeries: true
    },
    markers: {
      fillColors: ['#e0e0e0', '#FF7979', '#ffcc80', '#a5d6a7', '#66bb6a'],
      radius: 2
    },
    labels: {
      color: 'var(--color-background-primary)'
    }
  },
  states: {
    hover: {
      filter: {
        type: 'darken',
        value: 0.85
      }
    },
    active: {
      allowMultipleDataPointsSelection: false,
      filter: {
        type: 'darken',
        value: 0.85
      }
    }
  },
  grid: {
    padding: {
      top: 0,
      right: 0,
      bottom: 0,
      left: 15
    }
  },
}))

// Преобразуем данные в формат, понятный ApexCharts
const chartSeries = computed(() => {
  if (!statsData.value.length) return []

  const seriesData = years.value.map(year => {
    const yearStr = year.toString()

    const yearData = []
    const monthToShow = year === currentYear ? currentMonth : 12

    for (let i = 0; i < monthToShow; i++) {
      const monthData = statsData.value.find(item =>
        item.y === yearStr && item.x === months.value[i]
      )

      yearData.push(monthData ? monthData.value : 0)
    }

    return {
      name: yearStr,
      data: yearData
    }
  })

  return seriesData
})

// Обновление графика при изменении темы
const setupThemeChangeListener = () => {
  if (typeof window !== 'undefined') {
    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        if (mutation.attributeName === 'data-theme') {
          fetchStats()
        }
      })
    })

    observer.observe(document.documentElement, { attributes: true })
  }
}

onMounted(() => {
  fetchStats()
  setupThemeChangeListener()
})
</script>

<template>
  <div class="month-stats-card">
    <div class="card-header">
      <span class="title">Статистика задач</span>
      <h3 class="subtitle">Тепловая карта по месяцам</h3>
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
        type="heatmap"
        :options="chartOptions"
        :series="chartSeries"
      />
    </div>
  </div>
</template>

<style scoped>
.month-stats-card {
  background: var(--color-primary-background);
  border-radius: 12px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  padding: 20px;
  margin-bottom: 24px;
  grid-column: 1 / -1;
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