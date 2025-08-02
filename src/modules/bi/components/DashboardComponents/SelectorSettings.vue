<template>
  <div class="widget-settings">
    <div class="widget-settings-left-side">
      <h5 class="widget-settings-left-side-title">Селекторы</h5>
      <div class="selectors-list">
        <transition-group name="selector-list" tag="div" class="selectors-container">
          <div v-for="(selector, index) in selectorsList" :key="selector.id" class="selector-item" :class="{ 
              active: activeSelectorIndex === index,
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
            @click="setActiveSelector(index)">
            <span class="selector-icon">
              <GripVertical absoluteStrokeWidth size="14" class="drag-handle"/>
              <Star size="20" :class="{ 
                  'star-favorite': selector.isFavorite,
                  'star-regular': !selector.isFavorite
                }" @click.stop="toggleFavorite(index)"/>
            </span>
            <span class="selector-name" :title="selector.title">{{ selector.title }}</span>
            <button v-if="selectorsList.length > 1" class="delete-selector-btn" @click.stop="removeSelector(index)" title="Удалить селектор">✕</button>
          </div>
        </transition-group>
        <button class="add-selector-btn" @click="addNewSelector"><span class="plus-icon">➕</span>Добавить селектор</button>
      </div>
      <button class="advanced-settings-btn" @click="openAdvancedSettings">
        <Settings size="16" />
        Расширенные настройки
      </button>
    </div>
    <div class="widget-settings-right-side">
      <div class="widget-settings-right-side-header">
        <h5 class="widget-settings-right-side-title">Настройки селектора</h5>
        <button class="close-btn" @click="onCancel" title="Закрыть">
          <span class="close-icon">×</span>
        </button>
      </div>
      <div class="widget-settings-right-side-content">
        <div class="settings-table">
          <!-- Секция "Данные" -->
          <div class="settings-section">
            <h6 class="section-title">Данные</h6>
            
            <div class="settings-row">
              <div class="settings-label">Источник</div>
              <div class="settings-control">
                <div class="source-selector">
                  <div class="input-group">
                    <div class="input-wrapper">
                      <div v-if="currentSelector.sourceType === 'dataset' && currentSelector.selectedDataset" class="input-icon-wrapper">
                        <Database class="input-icon" />
                      </div>
                      <div v-if="currentSelector.sourceType === 'url' && currentSelector.datasetUrl" class="input-icon-wrapper">
                        <Link class="input-icon" />
                      </div>
                      <input 
                        v-model="sourceInputValue"
                        type="text" 
                        class="form-control-button"
                        style="border-top-right-radius: 0px !important;  border-bottom-right-radius: 0px !important;"
                        :placeholder="sourceInputPlaceholder"
                        @click="handleSourceInputClick"
                        @input="handleSourceInputChange"
                        :readonly="currentSelector.sourceType === 'dataset'"
                        :class="['form-control', { 
                          'source-select-mode': currentSelector.sourceType === 'dataset',
                          'has-icon': (currentSelector.sourceType === 'dataset' && currentSelector.selectedDataset) || (currentSelector.sourceType === 'url' && currentSelector.datasetUrl),
                          'source-url-error': currentSelector.sourceType === 'url' && urlValidationResult && !urlValidationResult.isValid,
                          'source-url-success': currentSelector.sourceType === 'url' && urlValidationResult && urlValidationResult.isValid
                        }]"
                      />
                    </div>
                    <button 
                      :class="['btn btn-outline-secondary dropdown-toggle', {
                        'source-url-error': currentSelector.sourceType === 'url' && urlValidationResult && !urlValidationResult.isValid,
                        'source-url-success': currentSelector.sourceType === 'url' && urlValidationResult && urlValidationResult.isValid
                      }]"
                      @click.stop="toggleDropdown"
                      type="button"
                      :aria-expanded="isDropdownOpen"
                    >
                      {{ currentSelector.sourceType === 'dataset' ? 'Датасет' : 'URL' }}
                    </button>
                    <ul v-if="isDropdownOpen" class="dropdown-menu">
                      <li>
                        <a class="dropdown-item" @click.stop="selectSourceType('dataset')" :class="{ active: currentSelector.sourceType === 'dataset' }">
                          Датасет
                        </a>
                      </li>
                      <li>
                        <a class="dropdown-item" @click.stop="selectSourceType('url')" :class="{ active: currentSelector.sourceType === 'url' }">
                          URL
                        </a>
                      </li>
                    </ul>
                  </div>
                </div>
                
                <!-- Результат валидации URL источника -->
                <div v-if="currentSelector.sourceType === 'url' && (isUrlValidating || urlValidationResult)" class="url-validation-result">
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
            
            <div class="settings-row" v-if="currentSelector.sourceType === 'dataset' && currentSelector.selectedDataset">
              <div class="settings-label">Поле</div>
              <div class="settings-control">
                <select v-model="currentSelector.selectedField" class="form-select form-select-sm">
                  <option value="">Выберите поле</option>
                  <option v-for="field in availableFields" :key="field.id" :value="field.id">
                    {{ field.name }}
                  </option>
                </select>
              </div>
            </div>
          </div>
          
          <!-- Секция "Фильтрация" -->
          <div class="settings-section">
            <h6 class="section-title">Фильтрация</h6>
            
            <div class="settings-row">
              <div class="settings-label">Тип селектора</div>
              <div class="settings-control">
                <div class="selector-type-dropdown">
                  <button 
                    class="selector-type-toggle"
                    @click="toggleSelectorTypeDropdown"
                    :class="{ 'open': isSelectorTypeDropdownOpen }"
                  >
                    <span class="selector-type-icon">
                      <List v-if="currentSelector.selectorType === 'list'" size="16" />
                      <Type v-else-if="currentSelector.selectorType === 'input'" size="16" />
                      <Calendar v-else-if="currentSelector.selectorType === 'calendar'" size="16" />
                      <CheckSquare v-else-if="currentSelector.selectorType === 'checkbox'" size="16" />
                      <ChevronDown v-else size="16" />
                    </span>
                    <span class="selector-type-text">
                      {{ getSelectorTypeLabel(currentSelector.selectorType) }}
                    </span>
                    <ChevronDown size="14" class="dropdown-arrow" />
                  </button>
                  <div v-if="isSelectorTypeDropdownOpen" class="selector-type-menu">
                    <div 
                      v-for="type in selectorTypes" 
                      :key="type.value"
                      class="selector-type-option"
                      :class="{ 'active': currentSelector.selectorType === type.value }"
                      @click="selectSelectorType(type.value)"
                    >
                      <span class="selector-type-icon">
                        <List v-if="type.value === 'list'" size="16" />
                        <Type v-else-if="type.value === 'input'" size="16" />
                        <Calendar v-else-if="type.value === 'calendar'" size="16" />
                        <CheckSquare v-else-if="type.value === 'checkbox'" size="16" />
                      </span>
                      <span class="selector-type-text">{{ type.label }}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            
            <div class="settings-row">
              <div class="settings-label">
                Операция
              </div>
              <div class="settings-control">
                <select v-model="currentSelector.operation" class="form-select form-select-sm">
                  <option value="">—</option>
                  <option value="equals">Равно</option>
                  <option value="contains">Содержит</option>
                  <option value="starts_with">Начинается с</option>
                  <option value="ends_with">Заканчивается на</option>
                  <option value="greater_than">Больше</option>
                  <option value="less_than">Меньше</option>
                  <option value="between">Между</option>
                </select>
              </div>
            </div>
            
            <div class="settings-row">
              <div class="settings-label">
                <input type="checkbox" v-model="currentSelector.multipleSelection" />
                Множественный выбор
              </div>
            </div>
            
            <div class="settings-row">
              <div class="settings-label">Значение по умолчанию</div>
              <div class="settings-control">
                <select v-model="currentSelector.defaultValue" class="form-select form-select-sm">
                  <option value="">Не определено</option>
                  <option v-for="option in selectorOptions" :key="option.value" :value="option.value">
                    {{ option.label }}
                  </option>
                </select>
              </div>
            </div>
            
            <div class="settings-row">
              <div class="settings-label">
                <input type="checkbox" v-model="currentSelector.required" />
                Обязательное поле
              </div>
            </div>
          </div>
          
          <!-- Секция "Отображение" -->
          <div class="settings-section">
            <h6 class="section-title">Отображение</h6>
            
            <div class="settings-row">
              <div class="settings-label">Заголовок</div>
              <div class="settings-control">
                <div class="input-group">
                  <input 
                    v-model="currentSelector.title" 
                    type="text" 
                    placeholder="Заголовок селектора"
                    class="form-control"
                  />
                </div>
                <div class="title-position-buttons">
                  <button 
                    class="position-btn" 
                    style="border-top-right-radius: 0px !important;  border-bottom-right-radius: 0px !important; border-right-width: 0px;"
                    :class="{ active: currentSelector.titlePosition === 'hidden' }"
                    @click="setTitlePosition('hidden')"
                  >
                    Скрыт
                  </button>
                  <button 
                    class="position-btn" 
                    style="border-radius: 0px !important; border-right-width: 0.5px;"
                    :class="{ active: currentSelector.titlePosition === 'left' }"
                    @click="setTitlePosition('left')"
                  >
                    Слева
                  </button>
                  <button 
                    class="position-btn" 
                    style="border-top-left-radius: 0px !important;  border-bottom-left-radius: 0px !important; border-left-width: 0px;"
                    :class="{ active: currentSelector.titlePosition === 'top' }"
                    @click="setTitlePosition('top')"
                  >
                    Сверху
                  </button>
                </div>
              </div>
            </div>
            
            <div class="settings-row">
              <div class="settings-label">
                <input type="checkbox" v-model="currentSelector.showInternalTitle" />Внутренний заголовок
                <div class="help-icon-wrapper">
                  <HelpCircle 
                    size="14" 
                    class="help-icon" 
                    @mouseenter="showInternalTitleTooltip = true"
                    @mouseleave="showInternalTitleTooltip = false"
                  />
                  <div v-if="showInternalTitleTooltip" class="custom-tooltip">
                    Внутренний заголовок позволяет указать текст внутри селектора. Например, его можно использовать для отображения операции внутри селектора.<br><br>Недоступен в селекторах типа «Чекбокс».
                  </div>
                </div>
              </div>
              <div class="settings-control" v-if="currentSelector.showInternalTitle">
                <input 
                  v-model="currentSelector.internalTitle" 
                  type="text" 
                  placeholder="Внутренний заголовок"
                  class="form-control"
                />
              </div>
            </div>
            
            <div class="settings-row">
              <div class="settings-label">
                <input type="checkbox" v-model="currentSelector.showColorAccent" />
                Цветовой акцент
                <div class="help-icon-wrapper">
                  <HelpCircle 
                    size="14" 
                    class="help-icon" 
                    @mouseenter="showColorAccentTooltip = true"
                    @mouseleave="showColorAccentTooltip = false"
                  />
                  <div v-if="showColorAccentTooltip" class="custom-tooltip">
                    Используйте опцию для выделения цветом важных селекторов
                  </div>
                </div>
              </div>
            </div>
            
            <div class="settings-row">
              <div class="settings-label">
                <input type="checkbox" v-model="currentSelector.showHint" />
                Подсказка
              </div>
              <div class="settings-control" v-if="currentSelector.showHint">
                <div class="text-editor-wrapper">
                  <TextEditor 
                    v-model:hintText="currentSelector.hintText"
                    :content="currentSelector.hintText"
                    @update:hintText="updateHintText"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      <div class="widget-settings-right-side-actions">
        <button @click="onCancel" class="cancel">Отменить</button>
        <button class="btn btn-primary" @click="onSubmit" :disabled="!isFormValid">Сохранить</button>
      </div>
    </div>
    
    <!-- Модальное окно выбора датасетов с использованием DatasetsTooltip -->
    <div v-if="isDatasetModalOpen" class="dataset-modal-overlay" @click.self="closeDatasetModal">
      <div class="dataset-modal-container">
        <div class="dataset-modal-header">
          <h6 class="dataset-modal-title">Выбор датасета</h6>
          <button class="dataset-modal-close" @click="closeDatasetModal" title="Закрыть">
            <span class="close-icon">×</span>
          </button>
        </div>
        <div class="dataset-modal-content">
          <DatasetsTooltip
            :selected-dataset="currentSelector.selectedDataset"
            :datasets="availableDatasets"
            :is-loading="isDatasetsLoading"
            @select="selectDataset"
          />
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, watch, computed, onMounted, onUnmounted } from 'vue';
import { Star, GripVertical, Settings, Database, HelpCircle, ChevronDown, Link, CheckCircle, CircleAlert, List, Type, Calendar, CheckSquare } from 'lucide-vue-next';
import DatasetsTooltip from '../ChartComponents/DatasetsTooltip.vue';
import TextEditor from './TextEditor.vue';
import datasetService from '../../js/datasetService.js';

const props = defineProps({
  data: {
    type: Object,
    default: () => ({})
  }
});

const emit = defineEmits(['close', 'save']);

const selectorsList = ref([
  {
    id: 1,
    title: 'Селектор 1',
    titlePosition: 'left',
    showInternalTitle: false,
    internalTitle: '',
    showColorAccent: false,
    showHint: false,
    hintText: '',
    sourceType: 'dataset',
    selectedDataset: '',
    selectedDatasetId: null,
    selectedField: '',
    selectorType: 'list',
    operation: '',
    multipleSelection: false,
    defaultValue: '',
    required: false,
    isFavorite: true
  }
]);

const activeSelectorIndex = ref(0);
const draggedIndex = ref(null);
const dragOverIndex = ref(null);
const isDatasetModalOpen = ref(false);
const availableDatasets = ref([]);
const availableFields = ref([]);
const selectorOptions = ref([]);
const isDatasetsLoading = ref(false);

const originalData = ref(null);

const currentSelector = computed(() => {
  return selectorsList.value[activeSelectorIndex.value] || {};
});

const isFormValid = computed(() => {
  const selector = currentSelector.value;
  return selector.title && selector.title.trim().length > 0;
});

const sourceInputValue = computed(() => {
  if (currentSelector.value.sourceType === 'dataset') {
    return currentSelector.value.selectedDataset || '';
  } else if (currentSelector.value.sourceType === 'url') {
    return currentSelector.value.datasetUrl || '';
  }
  return '';
});

const sourceInputPlaceholder = computed(() => {
  if (currentSelector.value.sourceType === 'dataset') {
    return 'Выберите датасет';
  } else if (currentSelector.value.sourceType === 'url') {
    return 'Введите URL источника данных';
  }
  return '';
});

const isDropdownOpen = ref(false);
const isSelectorTypeDropdownOpen = ref(false);
const isUrlValidating = ref(false);
const urlValidationResult = ref(null);
const showColorAccentTooltip = ref(false);
const showInternalTitleTooltip = ref(false);

const selectorTypes = ref([
  { value: 'list', label: 'Список', icon: 'List' },
  { value: 'input', label: 'Поле ввода', icon: 'Type' },
  { value: 'calendar', label: 'Календарь', icon: 'Calendar' },
  { value: 'checkbox', label: 'Чекбокс', icon: 'CheckSquare' }
]);

function createNewSelector() {
  return {
    id: Date.now() + Math.random(),
    title: `Селектор ${selectorsList.value.length + 1}`,
    titlePosition: 'left',
    showInternalTitle: false,
    internalTitle: '',
    showColorAccent: false,
    showHint: false,
    hintText: '',
    sourceType: 'dataset',
    selectedDataset: '',
    selectedDatasetId: null,
    datasetUrl: '',
    selectedField: '',
    selectorType: 'list',
    operation: '',
    multipleSelection: false,
    defaultValue: '',
    required: false,
    isFavorite: false
  };
}

function addNewSelector() {
  const newSelector = createNewSelector();
  selectorsList.value.push(newSelector);
  activeSelectorIndex.value = selectorsList.value.length - 1;
}

function removeSelector(index) {
  if (selectorsList.value.length <= 1) return;
  
  const wasRemovalFavorite = selectorsList.value[index].isFavorite;
  
  selectorsList.value.splice(index, 1);
  
  if (wasRemovalFavorite && selectorsList.value.length > 0) {
    selectorsList.value[0].isFavorite = true;
  }
  
  if (activeSelectorIndex.value >= selectorsList.value.length) {
    activeSelectorIndex.value = selectorsList.value.length - 1;
  } else if (activeSelectorIndex.value > index) {
    activeSelectorIndex.value--;
  }
}

function setActiveSelector(index) {
  activeSelectorIndex.value = index;
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
  
  const draggedSelector = selectorsList.value[draggedIndex.value];
  selectorsList.value.splice(draggedIndex.value, 1);
  selectorsList.value.splice(targetIndex, 0, draggedSelector);
  
  if (activeSelectorIndex.value === draggedIndex.value) {
    activeSelectorIndex.value = targetIndex;
  } else if (activeSelectorIndex.value > draggedIndex.value && activeSelectorIndex.value <= targetIndex) {
    activeSelectorIndex.value--;
  } else if (activeSelectorIndex.value < draggedIndex.value && activeSelectorIndex.value >= targetIndex) {
    activeSelectorIndex.value++;
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
  if (selectorsList.value[index].isFavorite) {
    return;
  }
  
  selectorsList.value.forEach((selector, i) => {
    selector.isFavorite = i === index;
  });
}

function openAdvancedSettings() {
  console.log('Открытие расширенных настроек');
}

function handleDatasetInputClick() {
  openDatasetModal();
}

function openDatasetModal() {
  isDatasetModalOpen.value = true;
  loadAvailableDatasets();
}

function closeDatasetModal() {
  isDatasetModalOpen.value = false;
}

async function loadAvailableDatasets() {
  try {
    isDatasetsLoading.value = true;
    const response = await datasetService.getUserDatasets();
    availableDatasets.value = response.data || [];
  } catch (error) {
    console.error('Ошибка загрузки датасетов:', error);
    availableDatasets.value = [];
  } finally {
    isDatasetsLoading.value = false;
  }
}

function selectDataset(dataset) {
  currentSelector.value.selectedDataset = dataset.name;
  currentSelector.value.selectedDatasetId = dataset.id;
  currentSelector.value.sourceType = 'dataset';
  currentSelector.value.datasetUrl = '';
  currentSelector.value.selectedField = '';
  urlValidationResult.value = null;
  isUrlValidating.value = false;
  isDropdownOpen.value = false;
  closeDatasetModal();
  loadAvailableFields();
}

async function loadAvailableFields() {
  if (!currentSelector.value.selectedDatasetId) {
    availableFields.value = [];
    return;
  }
  
  try {
    const response = await datasetService.listFields({ dataset: currentSelector.value.selectedDatasetId });
    availableFields.value = response.data || [];
  } catch (error) {
    console.error('Ошибка загрузки полей:', error);
    availableFields.value = [];
  }
}

function specifyDatasetLink() {
  console.log('Указание ссылки на датасет');
}

function setTitlePosition(position) {
  currentSelector.value.titlePosition = position;
}

function toggleTitleDropdown() {
  console.log('Переключение выпадающего списка заголовков');
}

function toggleDropdown() {
  isDropdownOpen.value = !isDropdownOpen.value;
}

function toggleSelectorTypeDropdown() {
  isSelectorTypeDropdownOpen.value = !isSelectorTypeDropdownOpen.value;
}

function selectSelectorType(type) {
  currentSelector.value.selectorType = type;
  isSelectorTypeDropdownOpen.value = false;
}

function getSelectorTypeLabel(type) {
  const selectorType = selectorTypes.value.find(t => t.value === type);
  return selectorType ? selectorType.label : 'Выберите тип';
}

function selectSourceType(type) {
  currentSelector.value.sourceType = type;
  isDropdownOpen.value = false;
  urlValidationResult.value = null;
  isUrlValidating.value = false;
  
  if (type === 'dataset') {
    currentSelector.value.datasetUrl = '';
    currentSelector.value.selectedField = '';
  } else if (type === 'url') {
    currentSelector.value.selectedDataset = '';
    currentSelector.value.selectedDatasetId = null;
    currentSelector.value.selectedField = '';
  }
}

function handleSourceInputClick() {
  if (currentSelector.value.sourceType === 'dataset') {
    openDatasetModal();
  }
}

function handleSourceInputChange() {
  if (currentSelector.value.sourceType === 'url') {
    currentSelector.value.datasetUrl = sourceInputValue.value;
    const url = sourceInputValue.value.trim();
    if (url) {
      validateUrl(url);
    } else {
      urlValidationResult.value = null;
      isUrlValidating.value = false;
    }
  }
}

function validateUrl(url) {
  isUrlValidating.value = true;
  urlValidationResult.value = null;
  setTimeout(() => {
    const isValid = /^https?:\/\/[^\s]+$/.test(url);
    urlValidationResult.value = {
      isValid: isValid,
      message: isValid ? 'URL валиден' : 'Пожалуйста, введите корректный URL (например, https://example.com)'
    };
    isUrlValidating.value = false;
  }, 1000);
}

function handleClickOutside(event) {
  if (!isDropdownOpen.value && !isSelectorTypeDropdownOpen.value) {
    return;
  }
  
  const dropdownToggle = event.target.closest('.dropdown-toggle');
  const dropdownMenu = event.target.closest('.dropdown-menu');
  const selectorTypeToggle = event.target.closest('.selector-type-toggle');
  const selectorTypeMenu = event.target.closest('.selector-type-menu');
   
  if (dropdownToggle || dropdownMenu) {
    return;
  }
  
  if (selectorTypeToggle || selectorTypeMenu) {
    return;
  }
  
  isDropdownOpen.value = false;
  isSelectorTypeDropdownOpen.value = false;
}

function handleKeyDown(event) {
  if (event.key === 'Escape') {
    if (isDatasetModalOpen.value) {
      isDatasetModalOpen.value = false;
    } else if (isDropdownOpen.value) {
      isDropdownOpen.value = false;
    } else if (isSelectorTypeDropdownOpen.value) {
      isSelectorTypeDropdownOpen.value = false;
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
});

watch(() => props.data, (newData) => {
  if (newData && newData.selectorsList) {
    originalData.value = JSON.parse(JSON.stringify(newData));
    
    selectorsList.value = JSON.parse(JSON.stringify(newData.selectorsList));
    activeSelectorIndex.value = newData.activeSelectorIndex || 0;
    
    selectorsList.value.forEach((selector, index) => {
      if (selector.isFavorite === undefined) {
        selector.isFavorite = index === 0;
      }
      if (selector.sourceType === undefined) {
        selector.sourceType = 'dataset';
      }
      if (selector.datasetUrl === undefined) {
        selector.datasetUrl = '';
      }
      if (selector.selectedDatasetId === undefined) {
        selector.selectedDatasetId = null;
      }
    });
    
    const hasFavorite = selectorsList.value.some(selector => selector.isFavorite);
    if (!hasFavorite && selectorsList.value.length > 0) {
      selectorsList.value[0].isFavorite = true;
    }
  }
}, { immediate: true });

watch(() => currentSelector.value, (newSelector) => {
  if (newSelector) {
    urlValidationResult.value = null;
    isUrlValidating.value = false;
  }
}, { immediate: true });

function onCancel() {
  if (originalData.value) {
    emit('save', originalData.value);
  }
  emit('close');
}

function updateHintText(value) {
  currentSelector.value.hintText = value;
}

function onSubmit() {
  const settings = {
    ...props.data,
    selectorsList: selectorsList.value,
    activeSelectorIndex: activeSelectorIndex.value
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
  overflow: visible;
}

.widget-settings-left-side {
  max-width: 255px;
  min-width: 255px;
  min-height: 300px;
  height: 100%;
  border-top-left-radius: 8px;
  border-bottom-left-radius: 8px;
  background-color: var(--color-background);
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  overflow: visible;
}

.widget-settings-left-side-title{
  padding: 24px 24px 0 24px;
}

.selectors-list {
  display: flex;
  padding-top: 12px;
  padding-bottom: 12px;
  flex-direction: column;
  gap: 8px;
  flex: 1;
  min-height: 0;
  overflow: visible;
}

.selectors-container {
  display: flex;
  flex-direction: column;
  gap: 8px;
  overflow: visible;
  min-height: 0;
}

.selector-list-move {
  transition: all 0.3s cubic-bezier(0.25, 0.8, 0.25, 1);
}

.selector-list-enter-active {
  transition: all 0.3s cubic-bezier(0.25, 0.8, 0.25, 1);
}

.selector-list-leave-active {
  transition: all 0.3s cubic-bezier(0.25, 0.8, 0.25, 1);
  position: absolute;
  width: calc(100% - 24px);
  margin: 0 12px;
}

.selector-list-enter-from {
  opacity: 0;
  transform: translateX(-20px) scale(0.95);
}

.selector-list-leave-to {
  opacity: 0;
  transform: translateX(20px) scale(0.95);
}

.selector-item {
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
  
  &:hover .delete-selector-btn {
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

.selector-icon {
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

.selector-item.dragging .drag-handle {
  cursor: grabbing;
  color: white;
}

.selector-name {
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

.delete-selector-btn {
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

.add-selector-btn {
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

.add-selector-btn:hover .plus-icon {
  transform: rotate(90deg);
}

.advanced-settings-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 12px;
  border: none;
  background: none;
  color: var(--color-text-secondary);
  font-size: 14px;
  cursor: pointer;
  margin: 0 12px 24px 12px;
  transition: all 0.2s ease;
  
  &:hover {
    color: var(--color-primary);
  }
}

.widget-settings-right-side {
  width: 100%;
  border-top-right-radius: 8px;
  border-bottom-right-radius: 8px;
  position: relative;
  display: flex;
  flex-direction: column;
  height: 100%;
  overflow-y: visible;
}

.widget-settings-right-side-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 24px 24px 9px 24px;
  flex-shrink: 0;
}

.widget-settings-right-side-title {
  color: var(--color-text-primary);
  margin: 0;
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
  gap: 24px;
  overflow: visible;
}

.settings-section {
  display: flex;
  flex-direction: column;
  gap: 16px;
  overflow: visible;
}

.section-title {
  font-size: 16px;
  font-weight: 600;
  color: var(--color-text-primary);
  margin: 0;
  padding-bottom: 8px;
  border-bottom: 1px solid var(--color-border);
}

.settings-row {
  display: flex;
  align-items: flex-start;
  min-height: 40px;
  overflow: visible;
}

.settings-label {
  width: 215px;
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
  
  .help-icon {
    color: var(--color-text-secondary);
    cursor: help;
  }
}

.settings-control {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.form-select {
  background: var(--color-background);
  color: var(--color-text-primary);
  border: 1px solid var(--color-border);
  border-radius: 4px;
  font-size: 14px;
  width: 100%;
  height: 31px;
  transition: border-color 0.2s ease;
  
  &:hover {
    border-color: var(--color-primary-text);
  }
  
  &:focus {
    outline: none;
    border-color: var(--color-primary-text);
    box-shadow: 0 0 0 2px rgba(var(--color-accent-rgb), 0.2);
  }
}

.form-control {
  background: var(--color-background);
  color: var(--color-text-primary);
  border: 1px solid var(--color-border);
  border-radius: 4px;
  padding: 8px 12px;
  font-size: 14px;
  width: 100%;
  height: 31px;
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
  
  &.has-icon {
    padding-left: 40px;
  }
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

.input-icon-wrapper {
  position: absolute;
  left: 16px;
  top: 15%;
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
  height: 31px;
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
  
  &.source-url-error {
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
  
  &.source-url-success {
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

.link-btn {
  background: none;
  border: none;
  color: var(--color-primary);
  font-size: 12px;
  cursor: pointer;
  padding: 4px 0;
  text-decoration: underline;
  
  &:hover {
    color: var(--color-primary-dark);
  }
}

.title-position-buttons {
  display: flex;
  width: 100%;
}

.position-btn {
  flex: 1;
  padding: 6px 12px;
  border: 1px solid var(--color-border);
  border-radius: 4px;
  background: var(--color-background);
  color: var(--color-text-primary);
  font-size: 12px;
  cursor: pointer;
  transition: all 0.2s ease;
  text-align: center;
  
  &:hover {
    border-color: var(--color-primary);
    background: var(--color-hover-background);
    border-width: 1px !important;
  }
  
  &.active {
    background: var(--color-primary-background);
    color: var(--color-primary-text);
    font-weight: 650;
    border-color: var(--color-primary);
    border-width: 1px !important;
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

/* Стили для модального окна выбора датасетов */
.dataset-modal-overlay {
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

.dataset-modal-container {
  background: var(--color-primary-background);
  border-radius: 12px;
  box-shadow: 0 20px 40px rgba(0, 0, 0, 0.3);
  max-width: 450px;
  width: 90vw;
  max-height: 600px;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.dataset-modal-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 20px 24px 16px 24px;
  flex-shrink: 0;
}

.dataset-modal-title {
  font-size: 18px;
  font-weight: 600;
  color: var(--color-primary-text);
  margin: 0;
}

.dataset-modal-close {
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

.dataset-modal-content {
  padding: 0px 24px 24px 24px;
  flex: 1;
  min-height: 0;
  overflow: hidden;
  display: flex;
  flex-direction: column;
}

/* Стили для валидации URL */
.url-validation-result {
  margin-top: 8px;
  padding: 8px 12px;
  border-radius: 4px;
  background-color: var(--color-background);
  border: 1px solid var(--color-border);
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 13px;
  color: var(--color-text-primary);
}

.validation-loading {
  display: flex;
  align-items: center;
  gap: 8px;
  color: var(--color-primary);
}

.loading-spinner {
  border: 2px solid var(--color-text-secondary);
  border-top: 2px solid var(--color-primary);
  border-radius: 50%;
  width: 16px;
  height: 16px;
  animation: spin 1s linear infinite;
}

.loading-text {
  color: var(--color-text-secondary);
}

.validation-message {
  display: flex;
  align-items: center;
  gap: 8px;
}

.validation-icon {
  color: var(--color-text-secondary);
}

.success-message {
  color: var(--color-success);
  border-color: var(--color-success);
}

.error-message {
  color: var(--color-error);
  border-color: var(--color-error);
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

/* Стили для source-selector */
.source-selector {
  display: flex;
  flex-direction: column;
  gap: 8px;
  width: 100%;
}

.form-control {
  background: var(--color-background);
  color: var(--color-text-primary);
  border: 1px solid var(--color-border);
  border-radius: 4px;
  padding: 8px 12px;
  font-size: 14px;
  width: 100%;
  height: 31px;
  transition: border-color 0.2s ease;
  
  &::placeholder {
    color: var(--color-text-secondary);
  }
  
  &:focus {
    outline: none;
    border-color: var(--color-primary-text);
    box-shadow: 0 0 0 2px rgba(var(--color-accent-rgb), 0.2);
  }
  
  &.source-select-mode {
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
  }
  
  &.source-url-error {
    border-color: var(--color-accent) !important;
    box-shadow: -2px 0 0 0 rgba(var(--color-accent-rgb), 0.2), 0 -2px 0 0 rgba(var(--color-accent-rgb), 0.2), 0 2px 0 0 rgba(var(--color-accent-rgb), 0.2) !important;
    
    &:focus {
      border-color: var(--color-accent) !important;
      box-shadow: -2px 0 0 0 rgba(var(--color-accent-rgb), 0.3), 0 -2px 0 0 rgba(var(--color-accent-rgb), 0.3), 0 2px 0 0 rgba(var(--color-accent-rgb), 0.3) !important;
    }
  }
  
  &.source-url-success {
    border-color: var(--color-success, #22c55e) !important;
    box-shadow: -2px 0 0 0 rgba(34, 197, 94, 0.2), 0 -2px 0 0 rgba(34, 197, 94, 0.2), 0 2px 0 0 rgba(34, 197, 94, 0.2) !important;
    
    &:focus {
      border-color: var(--color-success, #22c55e) !important;
      box-shadow: -2px 0 0 0 rgba(34, 197, 94, 0.3), 0 -2px 0 0 rgba(34, 197, 94, 0.3), 0 2px 0 0 rgba(34, 197, 94, 0.3) !important;
    }
  }
}

.form-control-button{
  &:hover {
    border-color: var(--color-primary-text);
    background-color: var(--color-hover-background);
  }
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

.input-icon-wrapper {
  position: absolute;
  left: 16px;
  top: 3%;
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
  
  &.source-url-error {
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
  
  &.source-url-success {
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

/* Стили для выпадающего списка типов селекторов */
.selector-type-dropdown {
  position: relative;
  width: 100%;
}

.selector-type-toggle {
  display: flex;
  align-items: center;
  gap: 8px;
  width: 100%;
  height: 31px;
  padding: 8px 12px;
  background: var(--color-background);
  color: var(--color-text-primary);
  border: 1px solid var(--color-border);
  border-radius: 4px;
  font-size: 14px;
  cursor: pointer;
  transition: all 0.2s ease;
  
  &:hover {
    border-color: var(--color-primary-text);
  }
  
  &.open {
    border-color: var(--color-primary-text);
    box-shadow: 0 0 0 2px rgba(var(--color-accent-rgb), 0.2);
  }
}

.selector-type-icon {
  display: flex;
  align-items: center;
  color: var(--color-text-secondary);
}

.selector-type-text {
  flex: 1;
  text-align: left;
}

.dropdown-arrow {
  color: var(--color-text-secondary);
  transition: transform 0.2s ease;
}

.selector-type-toggle.open .dropdown-arrow {
  transform: rotate(180deg);
}

.selector-type-menu {
  position: absolute;
  top: 100%;
  left: 0;
  right: 0;
  z-index: 1000;
  margin-top: 2px;
  background: var(--color-background);
  border: 1px solid var(--color-border);
  border-radius: 4px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  overflow: hidden;
}

.selector-type-option {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 12px;
  cursor: pointer;
  transition: background-color 0.2s ease;
  
  &:hover {
    background: var(--color-hover-background);
  }
  
  &.active {
    background: var(--color-primary-background);
    color: white;
    
    .selector-type-icon {
      color: white;
    }
  }
  
  .selector-type-icon {
    color: var(--color-text-secondary);
    transition: color 0.2s ease;
  }
  
  &:hover .selector-type-icon {
    color: var(--color-text-primary);
  }
  
  &.active .selector-type-icon {
    color: white;
  }
}

/* Стили для кастомного тултипа */
.help-icon-wrapper {
  position: relative;
  display: inline-block;
}

.custom-tooltip {
  position: absolute;
  bottom: 100%;
  left: 50%;
  transform: translateX(-50%);
  background: var(--color-background);
  color: var(--color-text-primary);
  padding: 8px 12px;
  border-radius: 6px;
  font-size: 12px;
  font-weight: 400;
  white-space: normal;
  z-index: 1000;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
  border: 1px solid var(--color-border);
  margin-bottom: 8px;
  max-width: 250px;
  min-width: 150px;
  width: max-content;
  word-wrap: break-word;
  text-align: center;
  
  &::after {
    content: '';
    position: absolute;
    top: 100%;
    left: 50%;
    transform: translateX(-50%);
    width: 0;
    height: 0;
    border-left: 6px solid transparent;
    border-right: 6px solid transparent;
    border-top: 6px solid var(--color-background);
    filter: drop-shadow(0 1px 0 var(--color-border));
  }
}

.settings-label {
  position: relative;
}

/* Стили для обертки TextEditor в настройках */
.text-editor-wrapper {
  max-width: 100%;
  overflow: hidden;
  
  :deep(.text-editor) {
    max-width: 100%;
    width: 100%;
    
    .editor-toolbar {
      flex-wrap: wrap;
      gap: 2px;
      
      .toolbar-formatting,
      .toolbar-styles,
      .toolbar-actions {
        flex-wrap: wrap;
      }
    }
    
    .editor-content {
      max-width: 100%;
      
      .editor-textarea {
        max-width: 100%;
        word-wrap: break-word;
        overflow-wrap: break-word;
      }
    }
  }
}
</style>