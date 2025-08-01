<template>
  <div class="selector-widget" ref="selectorWidgetRef" :class="{ 'auto-height': effectiveAutoHeight }">
    <div class="selector-content">
      <div v-if="isLoading" class="selector-loading">
        <Loader2 class="spinner" :size="24" />
        <span>Загрузка селектора...</span>
      </div>
      
      <div v-else-if="error" class="selector-error">
        <AlertCircle :size="24" />
        <span>{{ error }}</span>
      </div>
      
      <div v-else-if="!currentSelector" class="selector-empty">
        <Filter :size="48" />
        <span>Селектор не выбран</span>
      </div>
      
              <div v-else class="selector-render-container">
          <!-- Отображение селектора в зависимости от типа -->
          <div v-if="currentSelector.selectorType === 'list'" class="selector-list" :class="getSelectorClasses()">
            <label v-if="shouldShowTitle()" class="selector-label" :class="getTitleClasses()">
              {{ getDisplayTitle() }}
            </label>
            <select class="selector-dropdown" v-model="selectedValue" @change="handleSelectionChange">
              <option value="">{{ currentSelector.defaultValue || 'Выберите значение' }}</option>
              <option v-for="option in selectorOptions" :key="option.value" :value="option.value">
                {{ option.label }}
              </option>
            </select>
          </div>
        
        <div v-else-if="currentSelector.selectorType === 'dropdown'" class="selector-dropdown-container" :class="getSelectorClasses()">
          <label v-if="shouldShowTitle()" class="selector-label" :class="getTitleClasses()">
            {{ getDisplayTitle() }}
          </label>
          <div class="custom-dropdown">
            <button class="dropdown-button" @click="toggleDropdown">
              <span>{{ selectedLabel || currentSelector.defaultValue || 'Выберите значение' }}</span>
              <ChevronDown :size="16" class="dropdown-icon" />
            </button>
            <div v-if="isDropdownOpen" class="dropdown-menu">
              <div 
                v-for="option in selectorOptions" 
                :key="option.value"
                class="dropdown-item"
                :class="{ 'selected': selectedValue === option.value }"
                @click="selectOption(option)"
              >
                {{ option.label }}
              </div>
            </div>
          </div>
        </div>
        
        <div v-else-if="currentSelector.selectorType === 'radio'" class="selector-radio" :class="getSelectorClasses()">
          <label v-if="shouldShowTitle()" class="selector-label" :class="getTitleClasses()">
            {{ getDisplayTitle() }}
          </label>
          <div class="radio-group">
            <label v-for="option in selectorOptions" :key="option.value" class="radio-item">
              <input 
                type="radio" 
                :value="option.value" 
                v-model="selectedValue"
                @change="handleSelectionChange"
              />
              <span class="radio-label">{{ option.label }}</span>
            </label>
          </div>
        </div>
        
        <div v-else-if="currentSelector.selectorType === 'checkbox'" class="selector-checkbox" :class="getSelectorClasses()">
          <label v-if="shouldShowTitle()" class="selector-label" :class="getTitleClasses()">
            {{ getDisplayTitle() }}
          </label>
          <div class="checkbox-group">
            <label v-for="option in selectorOptions" :key="option.value" class="checkbox-item">
              <input 
                type="checkbox" 
                :value="option.value" 
                v-model="selectedValues"
                @change="handleMultiSelectionChange"
              />
              <span class="checkbox-label">{{ option.label }}</span>
            </label>
          </div>
        </div>
        
        <div v-else-if="currentSelector.selectorType === 'date'" class="selector-date" :class="getSelectorClasses()">
          <label v-if="shouldShowTitle()" class="selector-label" :class="getTitleClasses()">
            {{ getDisplayTitle() }}
          </label>
          <input 
            type="date" 
            v-model="selectedValue"
            @change="handleSelectionChange"
            class="date-input"
          />
        </div>
        
        <div v-else-if="currentSelector.selectorType === 'range'" class="selector-range" :class="getSelectorClasses()">
          <label v-if="shouldShowTitle()" class="selector-label" :class="getTitleClasses()">
            {{ getDisplayTitle() }}
          </label>
          <div class="range-container">
            <input 
              type="range" 
              v-model="selectedValue"
              :min="rangeMin" 
              :max="rangeMax" 
              :step="rangeStep"
              @input="handleSelectionChange"
              class="range-input"
            />
            <span class="range-value">{{ selectedValue }}</span>
          </div>
        </div>
        
        <div v-else class="selector-default" :class="getSelectorClasses()">
          <label v-if="shouldShowTitle()" class="selector-label" :class="getTitleClasses()">
            {{ getDisplayTitle() }}
          </label>
          <select class="selector-dropdown" v-model="selectedValue" @change="handleSelectionChange">
            <option value="">{{ currentSelector.defaultValue || 'Выберите значение' }}</option>
            <option v-for="option in selectorOptions" :key="option.value" :value="option.value">
              {{ option.label }}
            </option>
          </select>
        </div>
      </div>
      
      <div v-else class="selector-empty">
        <Filter :size="48" />
        <span>Настройте селектор</span>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch, onMounted, onUnmounted, nextTick } from 'vue';
import { Loader2, AlertCircle, Filter, ChevronDown } from 'lucide-vue-next';

const props = defineProps({
  selectorsList: {
    type: Array,
    default: () => []
  },
  activeSelectorIndex: {
    type: Number,
    default: 0
  },
  autoHeight: {
    type: Boolean,
    default: false
  }
});

const emit = defineEmits(['selection-change', 'content-resized']);

const isLoading = ref(false);
const error = ref('');
const isDropdownOpen = ref(false);
const selectedValue = ref('');
const selectedValues = ref([]);
const selectorWidgetRef = ref(null);
const calculatedHeight = ref(null);

const currentSelector = computed(() => {
  return props.selectorsList[props.activeSelectorIndex] || null;
});

const effectiveAutoHeight = computed(() => {
  return props.autoHeight || false;
});

const selectorOptions = computed(() => {
  return [
    { value: 'option1', label: 'Опция 1' },
    { value: 'option2', label: 'Опция 2' },
    { value: 'option3', label: 'Опция 3' }
  ];
});

const selectedLabel = computed(() => {
  const option = selectorOptions.value.find(opt => opt.value === selectedValue.value);
  return option ? option.label : '';
});

const rangeMin = computed(() => {
  return currentSelector.value?.rangeMin || 0;
});

const rangeMax = computed(() => {
  return currentSelector.value?.rangeMax || 100;
});

const rangeStep = computed(() => {
  return currentSelector.value?.rangeStep || 1;
});

function shouldShowTitle() {
  return currentSelector.value?.titlePosition !== 'hidden';
}

function getDisplayTitle() {
  if (currentSelector.value?.showInternalTitle && currentSelector.value?.internalTitle) {
    return currentSelector.value.internalTitle;
  }
  return currentSelector.value?.title || 'Селектор';
}

function getTitleClasses() {
  const classes = [];
  if (currentSelector.value?.titlePosition === 'left') {
    classes.push('title-left');
  } else if (currentSelector.value?.titlePosition === 'top') {
    classes.push('title-top');
  }
  return classes;
}

function getSelectorClasses() {
  const classes = [];
  if (currentSelector.value?.showColorAccent) {
    classes.push('with-color-accent');
  }
  if (currentSelector.value?.titlePosition === 'left') {
    classes.push('title-position-left');
  } else if (currentSelector.value?.titlePosition === 'top') {
    classes.push('title-position-top');
  }
  return classes;
}

function toggleDropdown() {
  isDropdownOpen.value = !isDropdownOpen.value;
}

function selectOption(option) {
  selectedValue.value = option.value;
  isDropdownOpen.value = false;
  handleSelectionChange();
}

function handleSelectionChange() {
  emit('selection-change', {
    selectorId: currentSelector.value?.id,
    value: selectedValue.value,
    type: 'single'
  });
}

function handleMultiSelectionChange() {
  emit('selection-change', {
    selectorId: currentSelector.value?.id,
    value: selectedValues.value,
    type: 'multiple'
  });
}

function calculateWidgetHeight() {
  if (!effectiveAutoHeight.value || !selectorWidgetRef.value) return;
  
  nextTick(() => {
    const element = selectorWidgetRef.value;
    if (element) {
      element.style.height = 'auto';
      
      nextTick(() => {
        const rect = element.getBoundingClientRect();
        let newHeight = rect.height;
        
        const children = element.children;
        let totalChildrenHeight = 0;
        
        for (let child of children) {
          const childRect = child.getBoundingClientRect();
          totalChildrenHeight += childRect.height;
          
          const computedStyle = window.getComputedStyle(child);
          totalChildrenHeight += parseFloat(computedStyle.marginTop) + parseFloat(computedStyle.marginBottom);
        }
        
        newHeight = Math.max(newHeight, totalChildrenHeight);
        newHeight = Math.max(newHeight, 100);
        
        if (calculatedHeight.value !== newHeight) {
          calculatedHeight.value = newHeight;
          emit('content-resized', newHeight);
        }
      });
    }
  });
}

function triggerHeightRecalculation() {
  if (effectiveAutoHeight.value) {
    calculateWidgetHeight();
  }
}

function handleClickOutside(event) {
  if (!selectorWidgetRef.value?.contains(event.target)) {
    isDropdownOpen.value = false;
  }
}

onMounted(() => {
  document.addEventListener('click', handleClickOutside);
  
  if (effectiveAutoHeight.value) {
    calculateWidgetHeight();
  }
});

onUnmounted(() => {
  document.removeEventListener('click', handleClickOutside);
});

watch(() => props.selectorsList, () => {
  if (effectiveAutoHeight.value) {
    nextTick(() => {
      calculateWidgetHeight();
    });
  }
}, { deep: true });

watch(() => props.activeSelectorIndex, () => {
  if (effectiveAutoHeight.value) {
    nextTick(() => {
      calculateWidgetHeight();
    });
  }
});

defineExpose({
  triggerHeightRecalculation
});
</script>

<style scoped lang="scss">
.selector-widget {
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  background: var(--color-background);
  border-radius: 8px;
  padding: 16px;
  box-sizing: border-box;
  
  &.auto-height {
    height: auto;
  }
}

.selector-content {
  display: flex;
  flex-direction: column;
  height: 100%;
  gap: 12px;
}

.selector-loading {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 12px;
  color: var(--color-text-secondary);
  font-size: 14px;
  height: 100%;
  
  .spinner {
    animation: spin 1s linear infinite;
  }
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

.selector-error {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 12px;
  color: var(--color-accent);
  font-size: 14px;
  height: 100%;
}

.selector-empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 12px;
  color: var(--color-text-secondary);
  font-size: 14px;
  height: 100%;
  text-align: center;
}

.selector-render-container {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.selector-label {
  font-size: 14px;
  font-weight: 500;
  color: var(--color-text-primary);
  margin-bottom: 4px;
  
  &.title-left {
    margin-bottom: 0;
    margin-right: 8px;
  }
  
  &.title-top {
    margin-bottom: 8px;
  }
}

.selector-list,
.selector-dropdown-container,
.selector-radio,
.selector-checkbox,
.selector-date,
.selector-range,
.selector-default {
  &.title-position-left {
    display: flex;
    align-items: center;
    gap: 8px;
    
    .selector-label {
      flex-shrink: 0;
      margin-bottom: 0;
    }
    
    .selector-dropdown,
    .custom-dropdown,
    .radio-group,
    .checkbox-group,
    .date-input,
    .range-container {
      flex: 1;
    }
  }
  
  &.with-color-accent {
    border: 2px solid var(--color-primary);
    border-radius: 6px;
    padding: 8px;
  }
}

.selector-dropdown {
  width: 100%;
  padding: 8px 12px;
  border: 1px solid var(--color-border);
  border-radius: 4px;
  background: var(--color-background);
  color: var(--color-text-primary);
  font-size: 14px;
  
  &:focus {
    outline: none;
    border-color: var(--color-primary);
  }
}

.custom-dropdown {
  position: relative;
  width: 100%;
}

.dropdown-button {
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 8px 12px;
  border: 1px solid var(--color-border);
  border-radius: 4px;
  background: var(--color-background);
  color: var(--color-text-primary);
  font-size: 14px;
  cursor: pointer;
  
  &:hover {
    border-color: var(--color-primary);
  }
}

.dropdown-icon {
  transition: transform 0.2s ease;
}

.dropdown-menu {
  position: absolute;
  top: 100%;
  left: 0;
  right: 0;
  background: var(--color-background);
  border: 1px solid var(--color-border);
  border-radius: 4px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  z-index: 1000;
  max-height: 200px;
  overflow-y: auto;
}

.dropdown-item {
  padding: 8px 12px;
  cursor: pointer;
  font-size: 14px;
  color: var(--color-text-primary);
  
  &:hover {
    background: var(--color-hover-background);
  }
  
  &.selected {
    background: var(--color-primary-background);
    color: white;
  }
}

.radio-group {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.radio-item {
  display: flex;
  align-items: center;
  gap: 8px;
  cursor: pointer;
  font-size: 14px;
  color: var(--color-text-primary);
  
  input[type="radio"] {
    accent-color: var(--color-primary);
  }
}

.checkbox-group {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.checkbox-item {
  display: flex;
  align-items: center;
  gap: 8px;
  cursor: pointer;
  font-size: 14px;
  color: var(--color-text-primary);
  
  input[type="checkbox"] {
    accent-color: var(--color-primary);
  }
}

.date-input {
  width: 100%;
  padding: 8px 12px;
  border: 1px solid var(--color-border);
  border-radius: 4px;
  background: var(--color-background);
  color: var(--color-text-primary);
  font-size: 14px;
  
  &:focus {
    outline: none;
    border-color: var(--color-primary);
  }
}

.range-container {
  display: flex;
  align-items: center;
  gap: 12px;
}

.range-input {
  flex: 1;
  height: 6px;
  border-radius: 3px;
  background: var(--color-border);
  outline: none;
  cursor: pointer;
  
  &::-webkit-slider-thumb {
    appearance: none;
    width: 16px;
    height: 16px;
    border-radius: 50%;
    background: var(--color-primary);
    cursor: pointer;
  }
  
  &::-moz-range-thumb {
    width: 16px;
    height: 16px;
    border-radius: 50%;
    background: var(--color-primary);
    cursor: pointer;
    border: none;
  }
}

.range-value {
  font-size: 14px;
  color: var(--color-text-primary);
  min-width: 40px;
  text-align: center;
}
</style> 