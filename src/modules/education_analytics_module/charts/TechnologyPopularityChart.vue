<template>
  <div class="chart-container">
    <h2>Популярность технологий</h2>
    <apexchart
      v-if="popularitySeries.length"
      type="area"
      :options="lineOptions"
      :series="lineSeries"
      :width="chartWidth"
      :height="chartHeight"
    ></apexchart>
    <div v-else class="loading-state">
      <div class="spinner"></div>
      <p>Загрузка данных...</p>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from "vue";
import { endpoints } from '@/js/api/endpoints'
import { apiClient } from '@/js/api/manager'
const color = "var(--color-accent)";
const popularitySeries = ref([]);
const ratingSeries = ref([]);
const categories = ref([]);

const chartWidth = ref("100%");
const chartHeight = ref("400");

const updateChartSize = () => {
  if (window.innerWidth < 768) {
    chartWidth.value = "100%";
    chartHeight.value = "300";
  } else {
    chartWidth.value = "100%";
    chartHeight.value = "400";
  }
};

const fetchData = async () => {
  try {
    const response = await apiClient.get(endpoints.learning_analytics.technologies.get);
    const techs = Array.isArray(response.data?.data) ? response.data.data : [];
    if (techs.length) {
      // Без ограничения: выводим все технологии
      const sorted = [...techs].sort((a, b) => b.popularity - a.popularity);
      popularitySeries.value = sorted.map((tech) => Number(tech.popularity));
      ratingSeries.value = sorted.map((tech) => Number(tech.rating));
      categories.value = sorted.map((tech) => tech.name);
    } else {
      popularitySeries.value = [];
      ratingSeries.value = [];
      categories.value = [];
    }
  } catch {
    popularitySeries.value = [];
    ratingSeries.value = [];
    categories.value = [];
  }
};

onMounted(() => {
  fetchData();
  updateChartSize();
  window.addEventListener("resize", updateChartSize);
});

onUnmounted(() => {
  window.removeEventListener("resize", updateChartSize);
});


const zoomed = ref(false);

const minPopularity = computed(() =>
  popularitySeries.value.length ? Math.min(...popularitySeries.value) : 0
);
const maxPopularity = computed(() =>
  popularitySeries.value.length ? Math.max(...popularitySeries.value) : 100
);
const minRating = computed(() =>
  ratingSeries.value.length ? Math.min(...ratingSeries.value) : 0
);
const maxRating = computed(() =>
  ratingSeries.value.length ? Math.max(...ratingSeries.value) : 5
);

const lineSeries = computed(() => [
  {
    name: "Популярность, %",
    type: 'line',
    data: popularitySeries.value,
  },
  {
    name: "Рейтинг",
    type: 'line',
    data: ratingSeries.value,
  }
]);

const lineOptions = computed(() => ({
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
    events: {
      zoomed() {
        zoomed.value = true;
      },
      beforeResetZoom() {
        zoomed.value = false;
      }
    },
    sparkline: { enabled: false },
  },
  colors: [color, '#00b894'],
  dataLabels: {
    enabled: false,
  },
  stroke: {
    width: 4,
    curve: "smooth",
    lineCap: 'round',
  },
  markers: {
    size: 0, // отключаем точки на кривых
    colors: [color, '#00b894'],
    strokeColors: [color, '#00b894'],
    strokeWidth: 3,
    hover: { size: 0 },
  },
  tooltip: {
    theme: document.documentElement.classList.contains('dark-theme') ? 'dark' : 'light',
    shared: true,
    x: { show: true },
    custom: ({series, dataPointIndex}) => {
      const name = categories.value[dataPointIndex];
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
          '>${name}</div>
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
            <span style='color: var(--color-secondary-text); font-size: 12px;'>Популярность:</span>
            <b style='
              margin-left: 2px;
              color: var(--color-primary-text);
              font-size: 13px;
            '>${series[0][dataPointIndex]}%</b>
          </div>
          <div style='
            display: flex;
            align-items: center;
            gap: 6px;
            margin-top: 6px;
          '>
            <span style='
              display: inline-block;
              width: 10px;
              height: 10px;
              border-radius: 50%;
              background: #00b894;
            '></span>
            <span style='color: var(--color-secondary-text); font-size: 12px;'>Рейтинг:</span>
            <b style='
              margin-left: 2px;
              color: var(--color-primary-text);
              font-size: 13px;
            '>${series[1][dataPointIndex]}★</b>
          </div>
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
    categories: categories.value,
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
      minHeight: 50,
      maxHeight: 140,
      hideOverlappingLabels: false,
      showDuplicates: true,
      formatter: (val) => val,
      tooltip: { enabled: true, offsetY: 10, style: { fontWeight: 600 } },
    },
    axisTicks: { show: false },
    axisBorder: { show: false },
    tooltip: { enabled: true },
  },
  yaxis: [
    {
      title: { text: undefined },
      labels: {
        style: {
          colors: "var(--color-secondary-text)",
          fontSize: window.innerWidth < 768 ? "12px" : "14px",
        },
      },
      min: minPopularity.value,
      max: maxPopularity.value,
      tickAmount: 5,
    },
    {
      opposite: true,
      title: { text: undefined },
      labels: {
        style: {
          colors: "#00b894",
          fontSize: window.innerWidth < 768 ? "12px" : "14px",
        },
      },
      min: minRating.value,
      max: maxRating.value,
      tickAmount: 5,
    }
  ],
  legend: {
    show: true,
    position: 'top',
    fontSize: '16px',
    fontWeight: 500,
    labels: { colors: 'var(--color-primary-text)', useSeriesColors: true },
    markers: { width: 16, height: 16, strokeWidth: 2 },
    itemMargin: { horizontal: 20, vertical: 0 },
    containerMargin: { left: 0, top: 10 },
    onItemClick: { toggleDataSeries: true },
    onItemHover: { highlightDataSeries: true },
    formatter: undefined,
  },
}));
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
}
</style>
