<template>
  <div class="widget-settings">
    <div class="widget-settings-left-side">
      <h5 class="widget-settings-left-side-title">Чарт</h5>
      <div class="charts-list">
        <transition-group name="chart-list" tag="div" class="charts-container">
          <div v-for="(chart, index) in chartsList" :key="chart.id" class="chart-item" :class="{ 
              active: activeChartIndex === index,
              dragging: draggedIndex === index,
              'drag-over': dragOverIndex === index && draggedIndex !== index
            }"
            draggable="true"
            @dragstart="handleDragStart(index, $event)"
            @dragover.prevent="handleDragOver(index, $event)"
            @drop="handleDrop(index, $event)"
            @dragenter.prevent="handleDragEnter(index, $event)"
            @dragleave="handleDragLeave($event)"
            @dragend="handleDragEnd"
            @click="setActiveChart(index)">
            <span class="chart-icon">
              <GripVertical absoluteStrokeWidth size="14" class="drag-handle"/>
              <Star size="20" :class="{ 
                  'star-favorite': chart.isFavorite,
                  'star-regular': !chart.isFavorite
                }" @click.stop="toggleFavorite(index)"/>
            </span>
            <span class="chart-name" :title="chart.title">{{ chart.title }}</span>
            <button v-if="chartsList.length > 1" class="delete-chart-btn" @click.stop="removeChart(index)" title="Удалить чарт">✕</button>
          </div>
        </transition-group>
        <button class="add-chart-btn" @click="addNewChart"><span class="plus-icon">➕</span>Добавить</button>
      </div>
    </div>
    <div class="widget-settings-right-side">
      <div class="widget-settings-right-side-header">
        <button class="close-btn" @click="onCancel" title="Закрыть">
          <span class="close-icon">×</span>
        </button>
      </div>
      <div class="widget-settings-right-side-content">
        <div class="settings-table">
          <div class="settings-row">
            <div class="settings-label">Заголовок</div>
            <div class="settings-control">
              <input 
                id="title" 
                v-model="currentChart.title" 
                type="text" 
                placeholder="Заголовок чарта" 
                :class="{ 'error': !isTitleValid }"
              />
              <div v-if="!isTitleValid" class="error-message">
                <span class="error-icon"><CircleAlert size="16" /></span>
                <span class="error-text">Строка не должна быть пустой</span>
              </div>
            </div>
          </div>
          
          <div class="settings-row">
            <div class="settings-label">Чарт</div>
            <div class="settings-control">
              <div class="chart-selector">
                <div class="input-group">
                  <div class="input-wrapper">
                    <div v-if="currentChart.chartType === 'select' && currentChart.selectedChart" class="input-icon-wrapper">
                      <BarChart3 class="input-icon" />
                    </div>
                    <input 
                      v-model="chartInputValue"
                      id="chart-input"
                      type="text" 
                      :placeholder="chartInputPlaceholder"
                      @click="handleChartInputClick"
                      @input="handleChartInputChange"
                      :readonly="currentChart.chartType === 'select'"
                      :class="['form-control', { 
                        'chart-select-mode': currentChart.chartType === 'select',
                        'has-icon': currentChart.chartType === 'select' && currentChart.selectedChart,
                        'chart-url-error': currentChart.chartType === 'url' && urlValidationResult && !urlValidationResult.isValid,
                        'chart-url-success': currentChart.chartType === 'url' && urlValidationResult && urlValidationResult.isValid
                      }]"
                    />
                  </div>
                  <button 
                    :class="['btn btn-outline-secondary dropdown-toggle', {
                      'chart-url-error': currentChart.chartType === 'url' && urlValidationResult && !urlValidationResult.isValid,
                      'chart-url-success': currentChart.chartType === 'url' && urlValidationResult && urlValidationResult.isValid
                    }]"
                    @click.stop="toggleDropdown"
                    type="button"
                    :aria-expanded="isDropdownOpen"
                  >
                    {{ currentChart.chartType === 'select' ? 'Чарт' : 'URL' }}
                  </button>
                  <ul v-if="isDropdownOpen" class="dropdown-menu">
                    <li>
                      <a class="dropdown-item" @click.stop="selectChartType('select')" :class="{ active: currentChart.chartType === 'select' }">
                        Чарт
                      </a>
                    </li>
                    <li>
                      <a class="dropdown-item" @click.stop="selectChartType('url')" :class="{ active: currentChart.chartType === 'url' }">
                        URL
                      </a>
                    </li>
                  </ul>
                </div>
              </div>
              
              <!-- Результат валидации URL чарта -->
              <div v-if="currentChart.chartType === 'url' && (isUrlValidating || urlValidationResult)" class="url-validation-result">
                <div v-if="isUrlValidating" class="validation-loading">
                  <span class="loading-spinner"></span>
                  <span class="loading-text">Проверка URL...</span>
                </div>
                <div v-else-if="urlValidationResult" :class="['validation-message', urlValidationResult.isValid ? 'success-message' : 'error-message']">
                  <span class="validation-icon">
                    <CheckCircle v-if="urlValidationResult.isValid" size="16" />
                    <CircleAlert v-else size="16" />
                  </span>
                  <span class="validation-text">{{ urlValidationResult.message }}</span>
                </div>
              </div>
            </div>
          </div>
          
          <div class="settings-row">
            <div class="settings-label">
              <input type="checkbox" v-model="currentChart.showDescription" />
              Описание
            </div>
            <div class="settings-control">
              <div v-if="currentChart.showDescription" class="text-editor-container">
                <TextEditor :content="currentChart.description" @update:content="val => currentChart.description = val" />
              </div>
            </div>
          </div>
          
          <div class="settings-row">
            <div class="settings-label">
              <input type="checkbox" v-model="currentChart.hint" />
              Подсказка
            </div>
            <div class="settings-control">
              <div v-if="currentChart.hint" class="text-editor-container">
                <TextEditor :content="currentChart.hintText" @update:content="val => currentChart.hintText = val" />
              </div>
            </div>
          </div>
          
          <div class="settings-row">
            <div class="settings-label">
              <input type="checkbox" v-model="elementAutoHeight" />
              Автовысота
            </div>
            <div class="settings-control"></div>
          </div>
          
          <div class="settings-row">
            <div class="settings-label">
              <span class="chevron" :class="{ 'expanded': showParameters }">▼</span>
              Параметры
            </div>
            <div class="settings-control"></div>
          </div>
        </div>
      </div>
      <div class="widget-settings-right-side-actions">
        <button @click="onCancel" class="cancel">Отменить</button>
        <button class="btn btn-primary" @click="onSubmit" :disabled="!isFormValid">Добавить</button>
      </div>
    </div>
    
    <!-- Модальное окно выбора чартов -->
    <div v-if="isChartsModalOpen" class="charts-modal-overlay" @click.self="closeChartsModal">
      <div class="charts-modal-container">
        <div class="charts-modal-header">
          <h6 class="charts-modal-title">Выбор чарта</h6>
          <button class="charts-modal-close" @click="closeChartsModal" title="Закрыть">
            <span class="close-icon">×</span>
          </button>
        </div>
        <div class="charts-modal-content">
          <ChartsModalWindow 
            :charts="availableCharts"
            :selectedChart="currentChart.selectedChartId ? { id: currentChart.selectedChartId, name: currentChart.selectedChart } : null"
            :isLoading="isChartsLoading"
            @select="handleChartSelect"
          />
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, watch, computed, onMounted, onUnmounted } from 'vue';
import { Star, GripVertical, CircleAlert, BarChart3, CheckCircle } from 'lucide-vue-next';
import TextEditor from './TextEditor.vue';
import ChartsModalWindow from './ChartsModalWindow.vue';
import { apiClient } from '@/js/api/manager.js';
import { endpoints } from '@/js/api/endpoints.js';
import { validateChartUrlWithAccess } from '@/modules/bi/components/DashboardComponents/js/chartUrlUtils.js';

const props = defineProps({
  data: {
    type: Object,
    default: () => ({})
  }
});

const emit = defineEmits(['close', 'save']);

const chartsList = ref([
  {
    id: 1,
    title: 'Заголовок 1',
    selectedChart: '',
    description: '',
    hintText: '',
    showDescription: false,
    hint: false,
    autoHeight: false,
    isFavorite: true
  }
]);

const activeChartIndex = ref(0);
const showParameters = ref(false);
const draggedIndex = ref(null);
const dragOverIndex = ref(null);
const isDropdownOpen = ref(false);
const chartInputValue = ref('');
const isChartsModalOpen = ref(false);
const availableCharts = ref([]);
const isChartsLoading = ref(false);

const isUrlValidating = ref(false);
const urlValidationResult = ref(null);
let validationTimeout = null;

const originalData = ref(null);

const currentChart = computed(() => {
  const chart = chartsList.value[activeChartIndex.value] || {};
  if (chart && chart.chartType === undefined) {
    chart.chartType = 'select';
  }
  return chart;
});

const isTitleValid = computed(() => {
  const title = currentChart.value.title;
  return title && title.trim().length > 0;
});

const isChartValid = computed(() => {
  if (currentChart.value.chartType === 'select') {
    return currentChart.value.selectedChart && currentChart.value.selectedChart.trim().length > 0;
  } else if (currentChart.value.chartType === 'url') {
    return urlValidationResult.value && urlValidationResult.value.isValid;
  }
  return false;
});

const isFormValid = computed(() => {
  return isTitleValid.value && isChartValid.value;
});

const chartInputPlaceholder = computed(() => {
  if (currentChart.value.chartType === 'select') {
    return 'Нажмите чтобы выбрать чарт';
  } else {
    return 'Укажите полную ссылку на чарт';
  }
});

const elementAutoHeight = ref(false);

function createNewChart() {
  return {
    id: Date.now() + Math.random(),
    title: `Заголовок ${chartsList.value.length + 1}`,
    selectedChart: '',
    selectedChartId: null,
    chartType: 'select',
    chartUrl: '',
    description: '',
    hintText: '',
    showDescription: false,
    hint: false,
    autoHeight: false,
    isFavorite: false
  };
}

function addNewChart() {
  const newChart = createNewChart();
  chartsList.value.push(newChart);
  activeChartIndex.value = chartsList.value.length - 1;
}

function removeChart(index) {
  if (chartsList.value.length <= 1) return;
  
  const wasRemovalFavorite = chartsList.value[index].isFavorite;
  
  chartsList.value.splice(index, 1);
  
  if (wasRemovalFavorite && chartsList.value.length > 0) {
    chartsList.value[0].isFavorite = true;
  }
  
  if (activeChartIndex.value >= chartsList.value.length) {
    activeChartIndex.value = chartsList.value.length - 1;
  } else if (activeChartIndex.value > index) {
    activeChartIndex.value--;
  }
}

function setActiveChart(index) {
  activeChartIndex.value = index;
}

function handleDragStart(index, event) {
  draggedIndex.value = index;
  event.dataTransfer.effectAllowed = 'move';
  event.dataTransfer.setData('text/plain', index.toString());
  
  setTimeout(() => {
    if (event.target) {
      event.target.style.opacity = '0.5';
    }
  }, 0);
}

function handleDragOver(index, event) {
  event.preventDefault();
  event.dataTransfer.dropEffect = 'move';
}

function handleDragEnter(index, event) {
  event.preventDefault();
  if (draggedIndex.value !== null && draggedIndex.value !== index) {
    dragOverIndex.value = index;
  }
}

function handleDragLeave(event) {
  if (!event.currentTarget.contains(event.relatedTarget)) {
    dragOverIndex.value = null;
  }
}

function handleDrop(targetIndex, event) {
  event.preventDefault();
  
  if (draggedIndex.value === null || draggedIndex.value === targetIndex) {
    return;
  }
  
  const draggedChart = chartsList.value[draggedIndex.value];
  chartsList.value.splice(draggedIndex.value, 1);
  chartsList.value.splice(targetIndex, 0, draggedChart);
  
  if (activeChartIndex.value === draggedIndex.value) {
    activeChartIndex.value = targetIndex;
  } else if (activeChartIndex.value > draggedIndex.value && activeChartIndex.value <= targetIndex) {
    activeChartIndex.value--;
  } else if (activeChartIndex.value < draggedIndex.value && activeChartIndex.value >= targetIndex) {
    activeChartIndex.value++;
  }
  
  draggedIndex.value = null;
  dragOverIndex.value = null;
}

function handleDragEnd(event) {
  if (event.target) {
    event.target.style.opacity = '';
  }
  draggedIndex.value = null;
  dragOverIndex.value = null;
}

function toggleFavorite(index) {
  if (chartsList.value[index].isFavorite) {
    return;
  }
  
  chartsList.value.forEach((chart, i) => {
    chart.isFavorite = i === index;
  });
}

watch(() => props.data, (newData) => {
  if (newData && newData.chartsList) {
    originalData.value = JSON.parse(JSON.stringify(newData));
    
    chartsList.value = JSON.parse(JSON.stringify(newData.chartsList));
    activeChartIndex.value = newData.activeChartIndex || 0;
    
    chartsList.value.forEach((chart, index) => {
      if (chart.isFavorite === undefined) {
        chart.isFavorite = index === 0;
      }
      if (chart.chartType === undefined) {
        chart.chartType = 'select';
      }
      if (chart.chartUrl === undefined) {
        chart.chartUrl = '';
      }
      if (chart.selectedChartId === undefined) {
        chart.selectedChartId = null;
      }
      if (chart.selectedChartId && !chart.selectedChart) {
        chart.selectedChart = null;
        chart.selectedChartId = null;
      }
    });
    
    const hasFavorite = chartsList.value.some(chart => chart.isFavorite);
    if (!hasFavorite && chartsList.value.length > 0) {
      chartsList.value[0].isFavorite = true;
    }
    elementAutoHeight.value = newData.autoHeight || false;
  }
}, { immediate: true });

watch(() => currentChart.value, (newChart) => {
  if (newChart) {
    urlValidationResult.value = null;
    if (validationTimeout) {
      clearTimeout(validationTimeout);
    }
    
    if (newChart.chartType === 'select') {
      chartInputValue.value = newChart.selectedChart || '';
    } else {
      chartInputValue.value = newChart.chartUrl || '';
      if (chartInputValue.value.trim()) {
        validateChartUrl();
      }
    }
  }
}, { immediate: true });

function toggleDropdown() {
  isDropdownOpen.value = !isDropdownOpen.value;
}

function selectChartType(type) {
  currentChart.value.chartType = type;
  isDropdownOpen.value = false;
  
  urlValidationResult.value = null;
  
  if (type === 'select') {
    chartInputValue.value = currentChart.value.selectedChart || '';
  } else {
    chartInputValue.value = currentChart.value.chartUrl || '';
    if (chartInputValue.value.trim()) {
      validateChartUrl();
    }
  }
}

function handleChartInputClick() {
  if (currentChart.value.chartType === 'select') {
    openChartModal();
  }
}

function handleChartInputChange() {
  if (currentChart.value.chartType === 'select') {
    currentChart.value.selectedChart = chartInputValue.value;
  } else {
    currentChart.value.chartUrl = chartInputValue.value;
    validateChartUrl();
  }
}

function validateChartUrl() {
  if (validationTimeout) {
    clearTimeout(validationTimeout);
  }
  
  urlValidationResult.value = null;
  
  const url = currentChart.value.chartUrl;
  
  if (!url || !url.trim()) {
    return;
  }
  
  validationTimeout = setTimeout(async () => {
    isUrlValidating.value = true;
    
    try {
      const result = await validateChartUrlWithAccess(url.trim(), apiClient);
      
      urlValidationResult.value = {
        isValid: result.isValid,
        message: result.isValid ? 'Чарт успешно выбран!' : `Произошла ошибка: ${result.error}`,
        chartId: result.chartId
      };
    } catch (error) {
      console.error('Ошибка при валидации URL чарта:', error);
      urlValidationResult.value = {
        isValid: false,
        message: 'Произошла ошибка: Не удалось проверить URL',
        chartId: null
      };
    } finally {
      isUrlValidating.value = false;
    }
  }, 500);
}

function openChartModal() {
  isChartsModalOpen.value = true;
  loadAvailableCharts();
}

async function loadAvailableCharts() {
  try {
    isChartsLoading.value = true;
    
    const response = await apiClient.get(endpoints.bi.ChartsList);
    
    if (response.success) {
      availableCharts.value = response.data.results || response.data || [];
    } else {
      console.error('Ошибка загрузки чартов:', response.message);
      availableCharts.value = [];
    }
  } catch (error) {
    console.error('Ошибка при загрузке чартов:', error);
    availableCharts.value = [];
  } finally {
    isChartsLoading.value = false;
  }
}

function handleChartSelect(chart) {
  currentChart.value.selectedChart = chart.name || chart.title;
  chartInputValue.value = chart.name || chart.title;
  currentChart.value.selectedChartId = chart.id;
  isChartsModalOpen.value = false;
}

function closeChartsModal() {
  isChartsModalOpen.value = false;
}

function handleClickOutside(event) {
  if (!isDropdownOpen.value) {
    return;
  }
  
  const dropdownToggle = event.target.closest('.dropdown-toggle');
  const dropdownMenu = event.target.closest('.dropdown-menu');
   
  if (dropdownToggle || dropdownMenu) {
    return;
  }
  
  isDropdownOpen.value = false;
}

function handleKeyDown(event) {
  if (event.key === 'Escape') {
    if (isChartsModalOpen.value) {
      isChartsModalOpen.value = false;
    } else if (isDropdownOpen.value) {
      isDropdownOpen.value = false;
    }
  }
}

onMounted(() => {
  document.addEventListener('click', handleClickOutside, true);
  document.addEventListener('keydown', handleKeyDown);
});

onUnmounted(() => {
  document.removeEventListener('click', handleClickOutside, true);
  document.removeEventListener('keydown', handleKeyDown);
  
  if (validationTimeout) {
    clearTimeout(validationTimeout);
  }
});

function toggleParameters() {
  showParameters.value = !showParameters.value;
}

function onCancel() {
  if (originalData.value) {
    emit('save', originalData.value);
  }
  emit('close');
}

function onSubmit() {
  const settings = {
    ...props.data,
    chartsList: chartsList.value,
    activeChartIndex: activeChartIndex.value,
    autoHeight: elementAutoHeight.value
  };
  
  emit('save', settings);
  emit('close');
}
</script>

<style scoped lang="scss">
.widget-settings {
  display: flex;
  border-radius: 8px;
  height: 100%;
  background: var(--color-primary-background);
}

.widget-settings-left-side {
  max-width: 255px;
  min-width: 255px;
  min-height: 300px;
  border-top-left-radius: 8px;
  border-bottom-left-radius: 8px;
  background-color: var(--color-background);
  max-height: 550px;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
}

.widget-settings-left-side-title{
  padding: 24px 24px 0 24px;
}

.charts-list {
  display: flex;
  padding-top: 12px;
  padding-bottom: 24px;
  flex-direction: column;
  gap: 8px;
  flex: 1;
  min-height: 0;
}

.charts-container {
  display: flex;
  flex-direction: column;
  gap: 8px;
  overflow-y: hidden;
  min-height: 0;
}

.chart-list-move {
  transition: all 0.3s cubic-bezier(0.25, 0.8, 0.25, 1);
}

.chart-list-enter-active {
  transition: all 0.3s cubic-bezier(0.25, 0.8, 0.25, 1);
}

.chart-list-leave-active {
  transition: all 0.3s cubic-bezier(0.25, 0.8, 0.25, 1);
  position: absolute;
  width: calc(100% - 24px);
  margin: 0 12px;
}

.chart-list-enter-from {
  opacity: 0;
  transform: translateX(-20px) scale(0.95);
}

.chart-list-leave-to {
  opacity: 0;
  transform: translateX(20px) scale(0.95);
}

.chart-item {
  display: flex;
  align-items: center;
  padding: 12px 12px 12px 12px;
  gap: 12px;
  cursor: pointer;
  color: var(--color-text-primary);
  position: relative;
  transition: all 0.2s cubic-bezier(0.25, 0.8, 0.25, 1);
  border-radius: 6px;
  margin: 0 12px;
  
  &.active {
    background: var(--color-primary-background);
    color: white;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
  }
  
  &:hover:not(.active):not(.dragging) {
    background: var(--color-hover-background);
  }
  
  &.dragging {
    opacity: 0.5;
    transform: rotate(3deg) scale(1.02);
    box-shadow: 0 8px 25px rgba(0, 0, 0, 0.3);
    z-index: 1000;
    background: var(--color-primary-background);
    color: white;
  }
  
  &.drag-over {
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(var(--color-primary-rgb), 0.3);
    background: var(--color-hover-background);
    
    &::before {
      content: '';
      position: absolute;
      top: -4px;
      left: 12px;
      right: 12px;
      height: 2px;
      background: var(--color-primary);
      border-radius: 1px;
      animation: pulse 1s infinite;
    }
  }
  
  &:hover .delete-chart-btn {
    opacity: 1;
  }
}

@keyframes pulse {
  0%, 100% {
    opacity: 1;
    transform: scaleX(1);
  }
  50% {
    opacity: 0.7;
    transform: scaleX(0.95);
  }
}

.chart-icon {
  display: flex;
  align-items: center;
  gap: 4px;
}

.star-favorite {
  fill: var(--color-warning, #ffc107);
  stroke: var(--color-warning, #ffc107);
  cursor: pointer;
  transition: all 0.2s ease;
  
  &:hover {
    transform: scale(1.1);
    filter: brightness(1.1);
  }
}

.star-regular {
  fill: none;
  stroke: var(--color-text-secondary, #888);
  cursor: pointer;
  transition: all 0.2s ease;
  
  &:hover {
    fill: var(--color-warning-light, rgba(255, 193, 7, 0.2));
    stroke: var(--color-warning, #ffc107);
    transform: scale(1.1);
  }
}

.drag-handle {
  cursor: grab;
  transition: all 0.2s ease;
  color: var(--color-secondary-text);
  
  &:hover {
    color: var(--color-primary);
    transform: scale(1.1);
  }
  
  &:active {
    cursor: grabbing;
    transform: scale(0.95);
  }
}

.chart-item.dragging .drag-handle {
  cursor: grabbing;
  color: white;
}

.chart-name {
  font-size: 14px;
  display: flex;
  font-weight: 500;
  flex: 1;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  min-width: 0;
  transition: all 0.2s ease;
}

.delete-chart-btn {
  background: none;
  border: none;
  color: var(--color-text-secondary);
  font-size: 12px;
  cursor: pointer;
  opacity: 0;
  transition: all 0.2s ease;
  padding: 4px;
  margin-left: auto;
  border-radius: 3px;
  
  &:hover {
    color: #ff4757;
    background: rgba(255, 71, 87, 0.1);
    transform: scale(1.1);
  }
}

.add-chart-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 12px;
  border: 2px dashed var(--color-border);
  border-radius: 6px;
  background: none;
  color: var(--color-text-secondary);
  font-size: 14px;
  cursor: pointer;
  margin: 8px 12px 0 12px;
  transition: all 0.3s cubic-bezier(0.25, 0.8, 0.25, 1);
  
  &:hover {
    border-color: var(--color-primary);
    color: var(--color-primary);
    background: rgba(var(--color-primary-rgb), 0.05);
    transform: translateY(-1px);
    box-shadow: 0 4px 12px rgba(var(--color-primary-rgb), 0.15);
  }
  
  &:active {
    transform: translateY(0);
  }
}

.plus-icon {
  font-size: 12px;
  transition: transform 0.2s ease;
}

.add-chart-btn:hover .plus-icon {
  transform: rotate(90deg);
}

.widget-settings-right-side {
  width: 100%;
  border-top-right-radius: 8px;
  border-bottom-right-radius: 8px;
  position: relative;
  display: flex;
  flex-direction: column;
  height: 100%;
}

.widget-settings-right-side-header {
  display: flex;
  justify-content: flex-end;
  padding: 24px 24px 9px 24px;
  flex-shrink: 0;
}

.close-btn {
  background: none;
  border: none;
  width: 24px;
  height: 24px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.2s ease;
  color: var(--color-secondary-text);
  
  &:hover {
    color: var(--color-primary-text);
  }
}

.close-icon {
  font-size: 32px;
  font-weight: 300;
}



input[type="text"] {
  background: var(--color-background);
  color: var(--color-text-primary);
  border: 1px solid var(--color-border);
  border-radius: 4px;
  padding: 8px 12px;
  font-size: 14px;
  width: 100%;
  transition: border-color 0.2s ease;
  
  &::placeholder {
    color: var(--color-text-secondary);
  }

  &:hover {
    border-color: var(--color-primary-text);
  }

  
  &:focus {
    outline: none;
    border-color: var(--color-primary-text);
    box-shadow: 0 0 0 2px rgba(var(--color-accent-rgb), 0.2);
  }
  
  &.error {
    border-color: var(--color-accent);
    box-shadow: 0 0 0 2px rgba(var(--color-accent-rgb), 0.2);
  }
}

.error-message {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 12px;
  color: var(--color-accent);
}

.error-icon {
  font-weight: bold;
  font-size: 14px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.error-text {
  font-weight: 500;
}

  /* Стили для валидации URL чарта */
  
  .validation-loading {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 12px;
  color: var(--color-text-secondary);
}

.loading-spinner {
  width: 12px;
  height: 12px;
  border: 2px solid var(--color-border);
  border-top: 2px solid var(--color-primary);
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

.loading-text {
  font-weight: 500;
}

.validation-message {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 12px;
}

.success-message {
  color: var(--color-success, #22c55e);
}

.success-message .validation-icon {
  color: var(--color-success, #22c55e);
}

.error-message .validation-icon {
  color: var(--color-accent);
}

.validation-icon {
  display: flex;
  align-items: center;
  justify-content: center;
}

.validation-text {
  font-weight: 500;
}

.chart-selector {
  display: flex;
  flex-direction: column;
  gap: 8px;
  width: 100%;
}

.input-group {
  display: flex;
  position: relative;
  overflow: visible;
  align-items: center;
  width: 100%;
  max-width: 100%;
}

.input-wrapper {
  flex: 1;
  position: relative;
  display: flex;
  align-items: center;
  min-width: 0;
}

.form-control {
  flex: 1;
  width: 100%;
  border-top-right-radius: 0 !important;
  border-bottom-right-radius: 0 !important;
  border-right: none;
  border-top-left-radius: 4px;
  border-bottom-left-radius: 4px;
  min-width: 0;
  
  &.chart-select-mode {
    cursor: pointer;
    user-select: none;
    caret-color: transparent;
    
    &:focus {
      outline: none;
      border-color: var(--color-primary-text);
      box-shadow: 0 0 0 2px rgba(var(--color-accent-rgb), 0.2);
    }
  }
  
  &.has-icon {
    padding-left: 40px;
    border-top-left-radius: 4px !important;
    border-bottom-left-radius: 4px !important;
  }
  
  &.chart-url-error {
    border-color: var(--color-accent) !important;
    box-shadow: -2px 0 0 0 rgba(var(--color-accent-rgb), 0.2), 0 -2px 0 0 rgba(var(--color-accent-rgb), 0.2), 0 2px 0 0 rgba(var(--color-accent-rgb), 0.2) !important;
    
    &:focus {
      border-color: var(--color-accent) !important;
      box-shadow: -2px 0 0 0 rgba(var(--color-accent-rgb), 0.3), 0 -2px 0 0 rgba(var(--color-accent-rgb), 0.3), 0 2px 0 0 rgba(var(--color-accent-rgb), 0.3) !important;
    }
  }
  
  &.chart-url-success {
    border-color: var(--color-success, #22c55e) !important;
    box-shadow: -2px 0 0 0 rgba(34, 197, 94, 0.2), 0 -2px 0 0 rgba(34, 197, 94, 0.2), 0 2px 0 0 rgba(34, 197, 94, 0.2) !important;
    
    &:focus {
      border-color: var(--color-success, #22c55e) !important;
      box-shadow: -2px 0 0 0 rgba(34, 197, 94, 0.3), 0 -2px 0 0 rgba(34, 197, 94, 0.3), 0 2px 0 0 rgba(34, 197, 94, 0.3) !important;
    }
  }
}

.input-icon-wrapper {
  position: absolute;
  left: 17px;
  top: 12%;
  transform: translateY(-50%);
  z-index: 2;
  pointer-events: none;
  width: 0;
  height: 0;
  overflow: visible;
}

.input-icon {
  width: 16px;
  height: 16px;
  color: var(--color-accent);
}

.btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 8px 12px;
  font-size: 14px;
  font-weight: 500;
  line-height: 1.5;
  text-align: center;
  text-decoration: none;
  vertical-align: middle;
  cursor: pointer;
  user-select: none;
  border: 1px solid transparent;
  border-radius: 4px;
  transition: all 0.15s ease-in-out;
}

.btn-outline-secondary {
  color: var(--color-text-primary);
  background-color: var(--color-background);
  border-color: var(--color-border);
  border-left: none;
  border-top-left-radius: 0;
  border-bottom-left-radius: 0;
  flex-shrink: 0;
  min-width: 80px;
  
  &:hover {
    color: var(--color-text-primary);
    background-color: var(--color-hover-background);
    border-color: var(--color-primary);
  }
  
  &.chart-url-error {
    border-color: var(--color-accent) !important;
    box-shadow: 2px 0 0 0 rgba(var(--color-accent-rgb), 0.2), 0 -2px 0 0 rgba(var(--color-accent-rgb), 0.2), 0 2px 0 0 rgba(var(--color-accent-rgb), 0.2) !important;
    
    &:hover {
      border-color: var(--color-accent) !important;
      box-shadow: 2px 0 0 0 rgba(var(--color-accent-rgb), 0.2), 0 -2px 0 0 rgba(var(--color-accent-rgb), 0.2), 0 2px 0 0 rgba(var(--color-accent-rgb), 0.2) !important;
    }
    
    &:focus {
      border-color: var(--color-accent) !important;
      box-shadow: 2px 0 0 0 rgba(var(--color-accent-rgb), 0.3), 0 -2px 0 0 rgba(var(--color-accent-rgb), 0.3), 0 2px 0 0 rgba(var(--color-accent-rgb), 0.3) !important;
    }
  }
  
  &.chart-url-success {
    border-color: var(--color-success, #22c55e) !important;
    box-shadow: 2px 0 0 0 rgba(34, 197, 94, 0.2), 0 -2px 0 0 rgba(34, 197, 94, 0.2), 0 2px 0 0 rgba(34, 197, 94, 0.2) !important;
    
    &:hover {
      border-color: var(--color-success, #22c55e) !important;
      box-shadow: 2px 0 0 0 rgba(34, 197, 94, 0.2), 0 -2px 0 0 rgba(34, 197, 94, 0.2), 0 2px 0 0 rgba(34, 197, 94, 0.2) !important;
    }
    
    &:focus {
      border-color: var(--color-success, #22c55e) !important;
      box-shadow: 2px 0 0 0 rgba(34, 197, 94, 0.3), 0 -2px 0 0 rgba(34, 197, 94, 0.3), 0 2px 0 0 rgba(34, 197, 94, 0.3) !important;
    }
  }
}

.dropdown-toggle {
  position: relative;
  
  &::after {
    content: '';
    display: inline-block;
    margin-left: 6px;
    vertical-align: middle;
    border-top: 4px solid;
    border-right: 4px solid transparent;
    border-bottom: 0;
    border-left: 4px solid transparent;
  }
}

.dropdown-menu {
  position: absolute;
  top: 100%;
  right: 0;
  z-index: 9999;
  display: block;
  min-width: 120px;
  margin: 2px 0 0 0;
  padding: 0.5rem 0;
  background-color: var(--color-background);
  border: 1px solid var(--color-border);
  border-radius: 4px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  list-style: none;
}

.dropdown-item {
  display: block;
  width: 100%;
  padding: 8px 12px;
  clear: both;
  font-weight: 400;
  color: var(--color-text-primary);
  text-align: inherit;
  text-decoration: none;
  white-space: nowrap;
  background-color: transparent;
  border: 0;
  cursor: pointer;
  transition: background-color 0.2s ease;
  
  &:hover {
    background-color: var(--color-hover-background);
    color: var(--color-text-primary);
  }
  
  &.active {
    background-color: var(--bs-primary-border-subtle);
    color: white;
    
    &:hover {
      background-color: var(--bs-primary);
      color: white;
    }
  }
}



.widget-settings-right-side-content{
  display: flex;
  flex-direction: column;
  overflow-y: auto;
  flex: 1;
  padding: 3px 24px 0 24px;
  min-height: 0;
}

.settings-table {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.settings-row {
  display: flex;
  align-items: flex-start;
  min-height: 40px;
}

.settings-label {
  width: 120px;
  flex-shrink: 0;
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 14px;
  font-weight: 500;
  color: var(--color-text-primary);
  padding-right: 16px;
  
  input[type="checkbox"] {
    margin: 0;
    accent-color: var(--color-accent);
  }
  
  .chevron {
    font-size: 12px;
    transition: transform 0.2s ease;
    cursor: pointer;
    
    &.expanded {
      transform: rotate(180deg);
    }
  }
}

.settings-control {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.text-editor-container {
  width: 100%;
  max-width: 100%;
  overflow: hidden;
  box-sizing: border-box;
  
  :deep(*) {
    max-width: 100% !important;
    overflow-wrap: break-word !important;
    word-break: break-all !important;
    box-sizing: border-box !important;
  }
  
  :deep(.tiptap) {
    word-wrap: break-word !important;
    overflow-wrap: break-word !important;
    word-break: break-all !important;
    white-space: pre-wrap !important;
    max-width: 100% !important;
    overflow-x: hidden !important;
    width: 100% !important;
    box-sizing: border-box !important;
  }
  
  :deep(.ProseMirror) {
    word-wrap: break-word !important;
    overflow-wrap: break-word !important;
    word-break: break-all !important;
    white-space: pre-wrap !important;
    max-width: 100% !important;
    overflow-x: hidden !important;
    width: 100% !important;
    box-sizing: border-box !important;
  }
  
  :deep(div) {
    word-wrap: break-word !important;
    overflow-wrap: break-word !important;
    word-break: break-all !important;
    max-width: 100% !important;
    box-sizing: border-box !important;
  }
  
  :deep(p) {
    word-wrap: break-word !important;
    overflow-wrap: break-word !important;
    word-break: break-all !important;
    max-width: 100% !important;
    margin: 0 !important;
  }
}

.widget-settings-right-side-actions {
  display: flex;
  justify-content: flex-end;
  gap: 16px;
  padding: 16px 24px 24px 24px;
  background: var(--color-primary-background);
  flex-shrink: 0;
}

button.cancel {
  background: none;
  color: var(--color-secondary-text);
  border: none;
  font-size: 16px;
  cursor: pointer;
}
button.cancel:hover {
  color: var(--color-primary-text);
  transition: background 0.2s, color 0.2s, opacity 0.2s;
  cursor: pointer;
}

.btn.btn-primary {
  border: none;
  border-radius: 6px;
  padding: 8px 24px;
  font-size: 16px;
  cursor: pointer;
  
  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
    background: var(--color-border);
    color: var(--color-text-secondary);
  }
}



/* Стили для модального окна выбора чартов */
.charts-modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.6);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 10000;
  backdrop-filter: blur(4px);
}

.charts-modal-container {
  background: var(--color-primary-background);
  border-radius: 12px;
  box-shadow: 0 20px 40px rgba(0, 0, 0, 0.3);
  max-width: 500px;
  width: 90vw;
  max-height: 600px;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.charts-modal-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 20px 24px 16px 24px;
  flex-shrink: 0;
}

.charts-modal-title {
  font-size: 18px;
  font-weight: 600;
  color: var(--color-primary-text);
  margin: 0;
}

.charts-modal-close {
  background: none;
  border: none;
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.2s ease;
  color: var(--color-secondary-text);
  border-radius: 6px;
  
  &:hover {
    color: var(--color-primary-text);
    background: var(--color-hover-background);
  }
  
  .close-icon {
    font-size: 24px;
    font-weight: 300;
  }
}

.charts-modal-content {
  padding: 0px 24px 24px 24px;
  flex: 1;
  min-height: 0;
  overflow: hidden;
}
</style>