<script setup>
import { ref, onMounted, watch } from 'vue'
import { Chart, registerables } from 'chart.js'

Chart.register(...registerables)

const props = defineProps({
  type: { type: String, required: true },
  data: { type: Object, required: true },
  options: { type: Object, default: () => ({}) },
  width: { type: String, default: '100%' },
  height: { type: String, default: '300px' },
  xLabel: { type: String, default: '' },
  yLabel: { type: String, default: '' },
  title: { type: String, default: '' },
})

const chartRef = ref(null)
const chartInstance = ref(null)

// Преобразование данных API в формат для Chart.js
const prepareChartData = () => {
  if (!props.data || !props.data.data) {
    return {
      labels: [],
      datasets: [],
    }
  }

  const labels = props.data.data.map((item) => item.scale)
  const values = props.data.data.map((item) => item.value)

  return {
    labels,
    datasets: [
      {
        label: props.title,
        data: values,
        backgroundColor: generateColors(values.length),
      },
    ],
  }
}

// Создание базовых опций для графика
const createChartOptions = () => {
  return {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: props.type === 'pie' || props.type === 'doughnut',
        position: 'top',
      },
      title: {
        display: Boolean(props.title),
        text: props.title || '',
        font: {
          size: 14,
          weight: 'normal',
        },
        padding: {
          top: 10,
          bottom: 10,
        },
      },
      tooltip: {
        enabled: true,
      },
    },
    scales:
      props.type !== 'pie' && props.type !== 'doughnut'
        ? {
            y: {
              beginAtZero: true,
              title: {
                display: Boolean(props.yLabel),
                text: props.yLabel,
              },
            },
            x: {
              title: {
                display: Boolean(props.xLabel),
                text: props.xLabel,
              },
            },
          }
        : {},
  }
}

// Генерация цветов для графика с максимальной различимостью
const generateColors = (count) => {
  // Использование золотого угла (около 137.5°) для максимального распределения цветов
  const colors = []
  const saturation = 75 // %
  const lightness = 60 // %
  const goldenAngle = 0.381966 * 360 // ~137.5 градусов (золотое сечение)

  // Начальный оттенок (немного сдвигаем для лучших результатов)
  let hue = 47

  for (let i = 0; i < count; i++) {
    // Добавляем золотой угол к текущему оттенку для максимального контраста
    hue = (hue + goldenAngle) % 360

    // Небольшая вариация насыщенности и яркости для большей различимости
    // Используем детерминированную последовательность
    const adjustedSaturation = saturation - (i % 3) * 5
    const adjustedLightness = lightness + (i % 3) * 10

    colors.push(`hsl(${hue}, ${adjustedSaturation}%, ${adjustedLightness}%)`)
  }

  return colors
}

// Создание и обновление графика
const createChart = () => {
  if (chartInstance.value) {
    chartInstance.value.destroy()
  }

  if (!chartRef.value) return

  const ctx = chartRef.value.getContext('2d')
  const chartData = prepareChartData()
  const chartOptions = { ...createChartOptions(), ...props.options }

  chartInstance.value = new Chart(ctx, {
    type: props.type,
    data: chartData,
    options: chartOptions,
  })
}

// Инициализация графика при монтировании
onMounted(() => {
  createChart()
})

// Обновление графика при изменении данных
watch(
  () => props.data,
  () => {
    createChart()
  },
  { deep: true },
)

// Обновление при изменении параметров
watch(
  () => [props.xLabel, props.yLabel, props.title],
  () => {
    createChart()
  },
)
</script>

<template>
  <div class="chart-container" :style="{ width, height }">
    <canvas ref="chartRef"></canvas>
  </div>
</template>

<style scoped>
.chart-container {
  position: relative;
}
</style>
