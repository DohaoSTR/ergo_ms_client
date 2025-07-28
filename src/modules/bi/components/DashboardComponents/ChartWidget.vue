<template>
  <div class="chart-widget">
    <!-- Строка 1: Вкладки с заголовками чартов -->
    <div v-if="chartsList && chartsList.length > 1" class="chart-tabs">
      <div class="tabs-container">
        <div class="visible-tabs" ref="visibleTabsContainer">
          <button 
            v-for="(chart, index) in visibleCharts" 
            :key="chart.id"
            class="chart-tab"
            :class="{ 
              'active': activeChartIndex === (showFromIndex + index),
              'favorite': chart.isFavorite 
            }"
            @click="setActiveChart(showFromIndex + index)"
            :title="chart.title"
          >
            <Star v-if="chart.isFavorite" :size="12" class="tab-star" />
            <span class="tab-title">{{ chart.title }}</span>
          </button>
        </div>
        
        <div v-if="hiddenCharts.length > 0" class="overflow-dropdown">
          <button 
            class="dropdown-btn"
            @click="toggleDropdown"
            :class="{ 'active': isDropdownOpen }"
          >
            <MoreHorizontal :size="16" />
            <span class="hidden-count">+{{ hiddenCharts.length }}</span>
          </button>
          
          <div v-if="isDropdownOpen" class="dropdown-menu">
            <button
              v-for="(chart, index) in hiddenCharts"
              :key="chart.id"
              class="dropdown-item"
              :class="{ 
                'active': activeChartIndex === (visibleCharts.length + showFromIndex + index),
                'favorite': chart.isFavorite 
              }"
              @click="selectHiddenChart(visibleCharts.length + showFromIndex + index)"
            >
              <Star v-if="chart.isFavorite" :size="12" class="item-star" />
              <span>{{ chart.title }}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
    
    <!-- Строка 2: Сам чарт -->
    <div class="chart-content">
      <div v-if="isLoading" class="chart-loading">
        <Loader2 class="spinner" :size="24" />
        <span>Загрузка чарта...</span>
      </div>
      
      <div v-else-if="error" class="chart-error">
        <AlertCircle :size="24" />
        <span>{{ error }}</span>
      </div>
      
      <div v-else-if="!currentChart" class="chart-empty">
        <BarChart3 :size="48" />
        <span>Чарт не выбран</span>
      </div>
      
      <!-- Отображение чарта через iframe для URL -->
      <iframe 
        v-else-if="currentChart.chartType === 'url' && currentChart.chartUrl"
        :src="getChartUrl(currentChart.chartUrl)"
        class="chart-iframe"
        frameborder="0"
        @load="handleIframeLoad"
        @error="handleIframeError"
      ></iframe>
      
      <!-- Отображение чарта через API для выбранных чартов -->
      <div 
        v-else-if="currentChart.chartType === 'select' && currentChart.selectedChartId"
        class="chart-api-container"
      >
        <div v-if="chartLoading" class="chart-loading">
          <Loader2 class="spinner" :size="24" />
          <span>Загрузка данных чарта...</span>
        </div>
        
        <div v-else-if="chartError" class="chart-error">
          <AlertCircle :size="24" />
          <span>{{ chartError }}</span>
        </div>
        
        <div v-else-if="chartData && datasetRows && chartData.chart_type" class="chart-render-container">
          <ChartJsComponent
            v-if="chartData.engine === 'chartjs'"
            :type="chartData.chart_type"
            :fields="chartData.params || {}"
            :dataset="datasetRows"
          />
          <ApexChartsComponent
            v-else-if="chartData.engine === 'apex'"
            :type="chartData.chart_type"
            :fields="chartData.params || {}"
            :dataset="datasetRows"
          />
          <div v-else class="chart-error">
            <AlertCircle :size="24" />
            <span>Неподдерживаемый тип движка: {{ chartData.engine || 'не указан' }}</span>
          </div>
        </div>
        
        <div v-else class="chart-placeholder">
          <BarChart3 :size="48" />
          <span>{{ currentChart.selectedChart || 'Выбранный чарт' }}</span>
          <small>ID: {{ currentChart.selectedChartId }}</small>
          <div v-if="chartData" style="font-size: 10px; margin-top: 8px; color: #666; text-align: left;">
            <div><strong>Debug info:</strong></div>
            <div>Engine: {{ chartData.engine || 'не указан' }}</div>
            <div>Type: {{ chartData.chart_type || 'не указан' }}</div>
            <div>Dataset: {{ chartData.dataset || 'не указан' }}</div>
            <div>Params: {{ chartData.params ? JSON.stringify(chartData.params).substring(0, 100) + '...' : 'пустые' }}</div>
            <div>DatasetRows: {{ datasetRows ? `${datasetRows.length} строк` : 'нет данных' }}</div>
            <div v-if="datasetRows && datasetRows.length > 0">
              Sample row: {{ JSON.stringify(datasetRows[0]).substring(0, 50) + '...' }}
            </div>
          </div>
        </div>
      </div>
      
      <div v-else class="chart-empty">
        <BarChart3 :size="48" />
        <span>Настройте чарт</span>
      </div>
    </div>
    
    <!-- Строка 3: Описание -->
    <div v-if="currentChart && currentChart.showDescription && currentChart.description" class="chart-description">
      <div v-html="currentChart.description" class="description-content"></div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch, onMounted, onUnmounted, nextTick } from 'vue';
import { Star, MoreHorizontal, Loader2, AlertCircle, BarChart3 } from 'lucide-vue-next';
import ApexChartsComponent from '../ChartComponents/ApexChartsComponent.vue';
import ChartJsComponent from '../ChartComponents/ChartJsComponent.vue';
import chartService from '@/modules/bi/js/chartService.js';

const props = defineProps({
  chartsList: {
    type: Array,
    default: () => []
  },
  activeChartIndex: {
    type: Number,
    default: 0
  }
});

const emit = defineEmits(['update:activeChartIndex']);

const isLoading = ref(false);
const error = ref('');
const isDropdownOpen = ref(false);
const visibleTabsContainer = ref(null);
const showFromIndex = ref(0);

// Состояние загрузки чарта
const chartLoading = ref(false);
const chartError = ref('');
const chartData = ref(null);
const datasetRows = ref(null);

const currentChart = computed(() => {
  return props.chartsList[props.activeChartIndex] || null;
});

const visibleCharts = computed(() => {
  if (!props.chartsList || props.chartsList.length <= 1) return [];
  
  // Показываем максимум 3 видимых чарта
  const maxVisible = Math.min(3, props.chartsList.length);
  
  // Убеждаемся что активный чарт видим
  let startIndex = showFromIndex.value;
  if (props.activeChartIndex < startIndex || props.activeChartIndex >= startIndex + maxVisible) {
    startIndex = Math.max(0, Math.min(props.activeChartIndex, props.chartsList.length - maxVisible));
    showFromIndex.value = startIndex;
  }
  
  return props.chartsList.slice(startIndex, startIndex + maxVisible);
});

const hiddenCharts = computed(() => {
  if (!props.chartsList || props.chartsList.length <= 1) return [];
  
  const maxVisible = Math.min(3, props.chartsList.length);
  const startIndex = showFromIndex.value;
  const totalHidden = props.chartsList.length - maxVisible;
  
  if (totalHidden <= 0) return [];
  
  return props.chartsList.slice(startIndex + maxVisible);
});

function setActiveChart(index) {
  emit('update:activeChartIndex', index);
  isDropdownOpen.value = false;
}

function selectHiddenChart(index) {
  setActiveChart(index);
}

function toggleDropdown() {
  isDropdownOpen.value = !isDropdownOpen.value;
}

function getChartUrl(url) {
  // Валидируем и очищаем URL
  if (!url) return '';
  
  try {
    new URL(url);
    return url;
  } catch {
    return '';
  }
}

function getApiChartUrl(chartId) {
  // Формируем URL для API чарта
  if (!chartId) return '';
  
  // Временно используем статический URL для демонстрации
  // TODO: Добавить реальный эндпоинт когда API будет готово
  return `#chart-${chartId}`;
}

function handleIframeLoad() {
  isLoading.value = false;
  error.value = '';
}

function handleIframeError() {
  isLoading.value = false;
  error.value = 'Ошибка загрузки чарта';
}

function handleClickOutside(event) {
  if (!isDropdownOpen.value) return;
  
  const dropdownBtn = event.target.closest('.dropdown-btn');
  const dropdownMenu = event.target.closest('.dropdown-menu');
  
  if (!dropdownBtn && !dropdownMenu) {
    isDropdownOpen.value = false;
  }
}

async function loadChartData(chartId) {
  if (!chartId) {
    chartData.value = null;
    datasetRows.value = null;
    return;
  }
  
  try {
    chartLoading.value = true;
    chartError.value = '';
    
    console.log('Загрузка чарта с ID:', chartId);
    
    // Загружаем данные чарта
    const chartResponse = await chartService.getChart(chartId);
    console.log('Ответ от getChart:', chartResponse);
    
    if (!chartResponse.success) {
      throw new Error(chartResponse.message || 'Не удалось загрузить чарт');
    }
    
    chartData.value = chartResponse.data;
    console.log('Данные чарта:', chartData.value);
    
    // Загружаем данные датасета
    if (chartData.value.dataset) {
      console.log('Загрузка данных датасета с ID:', chartData.value.dataset);
      
      try {
        // Сначала пробуем загрузить агрегированные данные, если есть параметры
        if (chartData.value.params && Object.keys(chartData.value.params).length > 0) {
          console.log('Попытка загрузки агрегированных данных с параметрами:', chartData.value.params);
          const aggResponse = await chartService.getDatasetRowsAgg(chartData.value.dataset, chartData.value.params);
          console.log('Ответ от getDatasetRowsAgg:', aggResponse);
          
          if (aggResponse.success && aggResponse.data) {
            let rows = [];
            if (Array.isArray(aggResponse.data)) {
              rows = aggResponse.data;
            } else if (aggResponse.data.rows && Array.isArray(aggResponse.data.rows)) {
              rows = aggResponse.data.rows;
            } else if (aggResponse.data.data && Array.isArray(aggResponse.data.data)) {
              rows = aggResponse.data.data;
            }
            
            if (rows.length > 0) {
              datasetRows.value = rows;
              console.log('Использованы агрегированные данные:', datasetRows.value);
              return; // Успешно загрузили агрегированные данные
            }
          }
        }
        
        // Если агрегированные данные не получены, пробуем обычные
        console.log('Загрузка обычных данных датасета');
        const datasetResponse = await chartService.getDatasetRows(chartData.value.dataset);
        console.log('Ответ от getDatasetRows:', datasetResponse);
        
        if (!datasetResponse.success) {
          throw new Error(datasetResponse.message || 'Не удалось загрузить данные');
        }
        
        // Обрабатываем разные форматы ответа от сервера
        let rows = [];
        if (datasetResponse.data) {
          if (Array.isArray(datasetResponse.data)) {
            rows = datasetResponse.data;
          } else if (datasetResponse.data.rows && Array.isArray(datasetResponse.data.rows)) {
            rows = datasetResponse.data.rows;
          } else if (datasetResponse.data.data && Array.isArray(datasetResponse.data.data)) {
            rows = datasetResponse.data.data;
          } else {
            console.warn('Неожиданный формат данных датасета:', datasetResponse.data);
            rows = [];
          }
        }
        
        datasetRows.value = rows;
        console.log('Обработанные данные датасета:', datasetRows.value);
        
             } catch (datasetError) {
         console.error('Ошибка загрузки данных датасета:', datasetError);
         
         // Для тестирования создадим mock данные если это bar или line чарт
         if (chartData.value.chart_type === 'bar' || chartData.value.chart_type === 'line') {
           console.log('Создание mock данных для тестирования');
           datasetRows.value = [
             { category: 'A', value: 10, year: 2023 },
             { category: 'B', value: 20, year: 2023 },
             { category: 'C', value: 15, year: 2023 },
             { category: 'A', value: 12, year: 2024 },
             { category: 'B', value: 25, year: 2024 },
             { category: 'C', value: 18, year: 2024 }
           ];
           
           // Также создадим базовые параметры если их нет
           if (!chartData.value.params || Object.keys(chartData.value.params).length === 0) {
             chartData.value.params = {
               x: [{ name: 'category', label: 'Категория' }],
               y: [{ name: 'value', label: 'Значение' }]
             };
           }
         } else {
           datasetRows.value = [];
         }
       }
    } else {
      datasetRows.value = [];
      console.log('У чарта нет датасета');
    }
    
  } catch (err) {
    console.error('Ошибка загрузки чарта:', err);
    chartError.value = err.message || 'Произошла ошибка при загрузке чарта';
    chartData.value = null;
    datasetRows.value = null;
  } finally {
    chartLoading.value = false;
  }
}

watch(() => currentChart.value, (newChart) => {
  if (newChart) {
    isLoading.value = true;
    error.value = '';
    
    // Загружаем данные чарта если это API чарт
    if (newChart.chartType === 'select' && newChart.selectedChartId) {
      loadChartData(newChart.selectedChartId);
    } else {
      // Сбрасываем данные чарта для других типов
      chartData.value = null;
      datasetRows.value = null;
      chartError.value = '';
      chartLoading.value = false;
    }
    
    // Устанавливаем таймаут для loading состояния iframe
    setTimeout(() => {
      if (isLoading.value) {
        isLoading.value = false;
      }
    }, 5000);
  }
}, { immediate: true });

onMounted(() => {
  document.addEventListener('click', handleClickOutside);
});

onUnmounted(() => {
  document.removeEventListener('click', handleClickOutside);
});
</script>

<style scoped lang="scss">
.chart-widget {
  display: flex;
  flex-direction: column;
  height: 100%;
  width: 100%;
  background: var(--color-primary-background);
  border-radius: 8px;
  overflow: hidden;
}

/* Строка 1: Вкладки */
.chart-tabs {
  border-bottom: 1px solid var(--color-border);
  background: var(--color-background);
  padding: 0;
  min-height: 40px;
  display: flex;
  align-items: center;
}

.tabs-container {
  display: flex;
  align-items: center;
  width: 100%;
  overflow: hidden;
}

.visible-tabs {
  display: flex;
  flex: 1;
  overflow: hidden;
}

.chart-tab {
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 8px 12px;
  border: none;
  background: none;
  color: var(--color-text-secondary);
  font-size: 13px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
  white-space: nowrap;
  border-bottom: 2px solid transparent;
  min-width: 0;
  
  &:hover {
    color: var(--color-text-primary);
    background: var(--color-hover-background);
  }
  
  &.active {
    color: var(--color-primary);
    border-bottom-color: var(--color-primary);
    background: var(--color-hover-background);
  }
  
  &.favorite .tab-star {
    color: var(--color-warning, #ffc107);
    fill: var(--color-warning, #ffc107);
  }
}

.tab-title {
  overflow: hidden;
  text-overflow: ellipsis;
  max-width: 120px;
}

.overflow-dropdown {
  position: relative;
  flex-shrink: 0;
}

.dropdown-btn {
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 8px 12px;
  border: none;
  background: none;
  color: var(--color-text-secondary);
  font-size: 12px;
  cursor: pointer;
  transition: all 0.2s ease;
  border-bottom: 2px solid transparent;
  
  &:hover, &.active {
    color: var(--color-text-primary);
    background: var(--color-hover-background);
  }
}

.hidden-count {
  font-weight: 600;
}

.dropdown-menu {
  position: absolute;
  top: 100%;
  right: 0;
  z-index: 1000;
  background: var(--color-primary-background);
  border: 1px solid var(--color-border);
  border-radius: 6px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  min-width: 180px;
  max-height: 200px;
  overflow-y: auto;
  padding: 4px 0;
}

.dropdown-item {
  display: flex;
  align-items: center;
  gap: 6px;
  width: 100%;
  padding: 8px 12px;
  border: none;
  background: none;
  color: var(--color-text-primary);
  font-size: 13px;
  text-align: left;
  cursor: pointer;
  transition: background-color 0.2s ease;
  
  &:hover {
    background: var(--color-hover-background);
  }
  
  &.active {
    background: var(--color-primary);
    color: white;
  }
  
  &.favorite .item-star {
    color: var(--color-warning, #ffc107);
    fill: var(--color-warning, #ffc107);
  }
  
  span {
    overflow: hidden;
    text-overflow: ellipsis;
  }
}

/* Строка 2: Контент чарта */
.chart-content {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
  min-height: 200px;
  padding: 16px;
}

.chart-loading,
.chart-error,
.chart-empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12px;
  color: var(--color-text-secondary);
  font-size: 14px;
}

.chart-error {
  color: var(--color-accent);
}

.spinner {
  animation: spin 1s linear infinite;
}

@keyframes spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}

.chart-iframe {
  width: 100%;
  height: 100%;
  min-height: 250px;
  border: none;
  border-radius: 6px;
  background: white;
}

.chart-api-container {
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
}

.chart-placeholder {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 8px;
  height: 100%;
  color: var(--color-text-secondary);
  
  span {
    font-size: 14px;
    font-weight: 500;
  }
  
  small {
    font-size: 12px;
    opacity: 0.7;
  }
}

.chart-render-container {
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  min-height: 250px;
}

/* Строка 3: Описание */
.chart-description {
  border-top: 1px solid var(--color-border);
  background: var(--color-background);
  padding: 12px 16px;
  max-height: 120px;
  overflow-y: auto;
}

.description-content {
  font-size: 13px;
  line-height: 1.5;
  color: var(--color-text-primary);
  
  :deep(p) {
    margin: 0 0 8px 0;
    
    &:last-child {
      margin-bottom: 0;
    }
  }
  
  :deep(h1, h2, h3, h4, h5, h6) {
    margin: 0 0 6px 0;
    font-size: inherit;
    font-weight: 600;
  }
  
  :deep(ul, ol) {
    margin: 0 0 8px 0;
    padding-left: 1.2em;
  }
  
  :deep(li) {
    margin-bottom: 2px;
  }
}
</style> 