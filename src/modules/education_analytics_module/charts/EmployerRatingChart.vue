<template>
  <div class="chart-container">
    <h2>Рейтинг работодателей</h2>
    <div class="chart-controls">
      <label>
        <span>Показать:</span>
        <select v-model="limitCount" class="limit-select">
          <option value="5">5</option>
          <option value="10">10</option>
          <option value="20">20</option>
          <option value="0">Все</option>
        </select>
      </label>
    </div>
    <div v-if="ratingData.length" class="chart-wrapper">
      <apexchart
        type="area"
        :options="chartOptions"
        :series="chartSeries"
        height="350"
      ></apexchart>
    </div>
    <div v-else class="loading-state">
      <div class="spinner"></div>
      <p>Загрузка данных...</p>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted, watch } from "vue";
import { endpoints } from '@/js/api/endpoints';
import { apiClient } from '@/js/api/manager';

const employers = ref([]);
const ratingData = ref([]);
const limitCount = ref(10); // По умолчанию показываем 10 компаний

// Получение данных работодателей
const fetchData = async () => {
  try {
    const response = await apiClient.get(endpoints.learning_analytics.employers.get);
    if (Array.isArray(response.data)) {
      employers.value = response.data;
    } else if (Array.isArray(response.data?.data)) {
      employers.value = response.data.data;
    } else {
      employers.value = [];
    }
    processData();
  } catch (error) {
    console.error("Ошибка загрузки данных работодателей:", error);
    employers.value = [];
    ratingData.value = [];
  }
};

// Обработка данных для графика
const processData = () => {
  if (!employers.value.length) {
    ratingData.value = [];
    return;
  }

  // Сортировка по рейтингу (по убыванию)
  const sorted = [...employers.value].sort((a, b) => b.rating - a.rating);

  // Применение ограничения, если выбрано
  const filtered = limitCount.value > 0
    ? sorted.slice(0, limitCount.value)
    : sorted;

  ratingData.value = filtered.map(emp => ({
    name: emp.company_name,
    rating: parseFloat(emp.rating)
  }));
};

// Следим за изменением лимита для обновления данных
watch(limitCount, processData);

// Минимальное и максимальное значение рейтинга для графика
const minRating = computed(() => Math.min(...ratingData.value.map(item => item.rating), 0));
const maxRating = computed(() => Math.max(...ratingData.value.map(item => item.rating), 5));

// Создание данных для графика в формате, аналогичном графику технологий
const chartSeries = computed(() => [{
  name: 'Рейтинг',
  type: 'line',
  data: ratingData.value.map(item => item.rating)
}]);

// Настройки графика аналогичные графику технологий
const chartOptions = computed(() => ({
  chart: {
    parentHeightOffset: 0,
    toolbar: { show: false },
    background: "transparent",
    animations: { enabled: true, easing: "easeinout", speed: 900 },
    fontFamily: 'Inter, system-ui, sans-serif',
    stacked: false,
    zoom: {
      enabled: true,
      type: 'x',
      autoScaleYaxis: true,
      resetIcon: {
        offsetX: 0,
        offsetY: 0,
        fillColor: 'var(--color-primary-background)',
        strokeColor: 'var(--color-secondary-text)',
      },
      selection: {
        enabled: true,
        fill: {
          color: 'var(--color-accent)',
          opacity: 0.15
        },
        stroke: {
          color: 'var(--color-accent)',
          opacity: 0.4,
          width: 2
        }
      }
    },
    sparkline: { enabled: false },
  },
  colors: ['var(--color-accent)'],
  dataLabels: {
    enabled: false,
  },
  stroke: {
    width: 4,
    curve: "smooth",
    lineCap: 'round',
  },
  markers: {
    size: 6,
    colors: ['var(--color-accent)'],
    strokeColors: ['var(--color-accent)'],
    strokeWidth: 2,
    hover: {
      size: 8,
      sizeOffset: 3
    },
  },
  fill: {
    type: 'gradient',
    gradient: {
      shade: 'light',
      type: 'vertical',
      shadeIntensity: 0.3,
      opacityFrom: 0.7,
      opacityTo: 0.2,
      stops: [0, 90, 100]
    }
  },
  tooltip: {
    theme: document.documentElement.classList.contains('dark-theme') ? 'dark' : 'light',
    shared: false,
    intersect: true,
    custom: ({series, seriesIndex, dataPointIndex}) => {
      const company = ratingData.value[dataPointIndex].name;
      const rating = series[seriesIndex][dataPointIndex];

      let starsHTML = '';
      const fullStars = Math.floor(rating);
      const halfStar = rating % 1 >= 0.5;
      const emptyStars = 5 - fullStars - (halfStar ? 1 : 0);

      for (let i = 0; i < fullStars; i++) {
        starsHTML += '<span style="color:#FFD700">★</span>';
      }
      if (halfStar) {
        starsHTML += '<span style="color:#FFD700">☆</span>';
      }
      for (let i = 0; i < emptyStars; i++) {
        starsHTML += '<span style="color:#ccc">☆</span>';
      }

      return `
        <div style='
          padding: 12px 14px;
          background: var(--color-secondary-background);
          border-radius: 8px;
          box-shadow: 0 4px 16px rgba(0, 0, 0, 0.1);
          min-width: 200px;
          border: none;
          font-family: Inter, system-ui, sans-serif;
        '>
          <div style='
            font-size: 13px;
            font-weight: 600;
            color: var(--color-primary-text);
            margin-bottom: 8px;
            padding-bottom: 6px;
            border-bottom: 1px solid rgba(0, 0, 0, 0.05);
          '>${company}</div>
          <div style='
            display: flex;
            align-items: center;
            gap: 6px;
          '>
            <span style='
              display: inline-block;
              width: 10px;
              height: 10px;
              border-radius: 50%;
              background: var(--color-accent);
            '></span>
            <span style='color: var(--color-secondary-text); font-size: 12px;'>Рейтинг:</span>
            <b style='
              margin-left: 2px;
              color: var(--color-primary-text);
              font-size: 13px;
            '>${rating.toFixed(1)}</b>
          </div>
          <div style='
            margin-top: 6px;
            display: flex;
            align-items: center;
            font-size: 16px;
            color: var(--color-primary-text);
          '>${starsHTML}</div>
        </div>
      `;
    }
  },
  grid: {
    borderColor: "var(--color-border)",
    strokeDashArray: 4,
    padding: { top: 10, left: 10, right: 10, bottom: 10 },
    xaxis: { lines: { show: false } },
    yaxis: { lines: { show: true } },
  },
  xaxis: {
    categories: ratingData.value.map(item => item.name),
    tickPlacement: 'on',
    labels: {
      style: {
        colors: "var(--color-secondary-text)",
        fontSize: "9px",
        fontWeight: 500,
        lineHeight: 1.2,
      },
      rotate: -35,
      trim: false,
      hideOverlappingLabels: false,
    },
    axisTicks: { show: false },
    axisBorder: { show: false },
    tooltip: { enabled: true },
  },
  yaxis: {
    min: minRating.value,
    max: maxRating.value,
    tickAmount: 5,
    title: { text: undefined },
    labels: {
      style: {
        colors: "var(--color-secondary-text)",
        fontSize: "12px",
      },
      formatter: function(val) {
        return val.toFixed(1);
      }
    },
  },
  legend: {
    show: true,
    position: 'top',
    fontSize: '16px',
    fontWeight: 500,
    labels: { colors: 'var(--color-primary-text)', useSeriesColors: true },
    markers: { width: 16, height: 16, strokeWidth: 2 },
    itemMargin: { horizontal: 20, vertical: 0 },
    containerMargin: { left: 0, top: 10 },
  }
}));

onMounted(() => {
  fetchData();
});

onUnmounted(() => {});
</script>

<style scoped>
.chart-container {
  background: var(--color-secondary-background);
  border-radius: 12px;
  padding: 16px;
  box-shadow: 0 4px 12px 0 rgba(13, 35, 67, 0.03);
  margin-bottom: 16px;
  transition: all 0.3s ease-in-out;
  border: 1px solid var(--color-border);
  max-width: 850px;
  margin: 0 auto 16px;
}

h2 {
  font-size: 18px;
  color: var(--color-accent);
  margin-bottom: 16px;
  font-weight: 500;
}

.chart-controls {
  display: flex;
  justify-content: flex-end;
  margin-bottom: 16px;
}

.chart-controls span {
  color: var(--color-secondary-text);
  font-size: 14px;
  margin-right: 8px;
}

.limit-select {
  padding: 4px 8px;
  border-radius: 8px;
  border: 1px solid var(--color-border);
  background-color: var(--color-primary-background);
  font-size: 14px;
  color: var(--color-primary-text);
  outline: none;
  transition: all 0.3s ease-in-out;
  cursor: pointer;
}

.limit-select:focus {
  border-color: var(--color-accent);
  box-shadow: 0 0 0 2px rgba(208, 50, 45, 0.1);
}

.chart-wrapper {
  border-radius: 8px;
  overflow: hidden;
}

.loading-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 300px;
  color: var(--color-secondary-text);
}

.spinner {
  width: 2rem;
  height: 2rem;
  border: 0.1875rem solid var(--color-border);
  border-radius: 50%;
  border-top-color: var(--color-accent);
  animation: spin 1s ease-in-out infinite;
  margin-bottom: 16px;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

@media (max-width: 768px) {
  .chart-container {
    padding: 12px;
  }

  .chart-controls {
    margin-bottom: 8px;
  }

  .limit-select {
    padding: 3px 6px;
    font-size: 12px;
  }
}
</style>
