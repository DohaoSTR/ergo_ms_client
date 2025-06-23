<template>
  <div class="search-and-filter">
    <div class="row g-3">
      <!-- Поиск -->
      <div v-if="showSearch" :class="searchCols">
        <label v-if="!hideLabels" class="form-label">{{ searchLabel }}</label>
        <div class="input-group">
          <span class="input-group-text">
            <Search :size="16" />
          </span>
          <input
            :value="searchQuery"
            @input="updateSearch"
            type="text"
            class="form-control"
            :placeholder="searchPlaceholder"
          />
          <button
            v-if="searchQuery"
            @click="clearSearch"
            class="btn btn-outline-secondary"
            type="button"
          >
            <X :size="16" />
          </button>
        </div>
      </div>

      <!-- Фильтры -->
      <div 
        v-for="filter in filters" 
        :key="filter.key"
        :class="filter.cols || 'col-md-3'"
      >
        <label v-if="!hideLabels" class="form-label">{{ filter.label }}</label>
        <select
          :value="getFilterValue(filter.key)"
          @change="updateFilter(filter.key, $event.target.value)"
          class="form-select"
        >
          <option value="">{{ filter.placeholder || 'Все' }}</option>
          <option
            v-for="option in filter.options"
            :key="option.value"
            :value="option.value"
          >
            {{ option.label }}
          </option>
        </select>
      </div>

      <!-- Кнопка сброса -->
      <div v-if="showClearButton && hasActiveFilters" class="col-auto d-flex align-items-end">
        <button
          @click="clearAllFilters"
          class="btn btn-outline-danger"
          type="button"
        >
          <RotateCcw :size="16" />
          <span v-if="!compact" class="ms-2">Сбросить</span>
        </button>
      </div>
    </div>

    <!-- Активные фильтры -->
    <div v-if="showActiveTags && activeFilterTags.length > 0" class="mt-3">
      <div class="d-flex flex-wrap gap-2">
        <span class="text-muted small me-2">Фильтры:</span>
        <span
          v-for="tag in activeFilterTags"
          :key="tag.key"
          class="badge bg-primary"
        >
          {{ tag.label }}
          <button
            @click="removeFilter(tag.key)"
            class="btn-close btn-close-white ms-1"
            style="font-size: 0.7em;"
          ></button>
        </span>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { Search, X, RotateCcw } from 'lucide-vue-next'

const props = defineProps({
  modelValue: { type: Object, default: () => ({}) },
  showSearch: { type: Boolean, default: true },
  searchLabel: { type: String, default: 'Поиск' },
  searchPlaceholder: { type: String, default: 'Поиск...' },
  searchKey: { type: String, default: 'search' },
  filters: { type: Array, default: () => [] },
  compact: Boolean,
  hideLabels: Boolean,
  showClearButton: { type: Boolean, default: true },
  showActiveTags: { type: Boolean, default: true },
  searchCols: { type: String, default: 'col-md-4' }
})

const emit = defineEmits(['update:modelValue', 'filter-change'])

const searchQuery = computed(() => props.modelValue[props.searchKey] || '')

const hasActiveFilters = computed(() => 
  Object.values(props.modelValue).some(value => value && value !== '')
)

const activeFilterTags = computed(() => {
  return props.filters
    .filter(filter => {
      const value = props.modelValue[filter.key]
      return value && value !== ''
    })
    .map(filter => {
      const option = filter.options.find(opt => opt.value === props.modelValue[filter.key])
      return {
        key: filter.key,
        label: `${filter.label}: ${option?.label || props.modelValue[filter.key]}`
      }
    })
})

function getFilterValue(key) {
  return props.modelValue[key] || ''
}

function updateSearch(event) {
  updateValue(props.searchKey, event.target.value)
}

function updateFilter(key, value) {
  updateValue(key, value)
}

function updateValue(key, value) {
  emit('update:modelValue', { ...props.modelValue, [key]: value })
  emit('filter-change', { key, value })
}

function clearSearch() {
  updateValue(props.searchKey, '')
}

function removeFilter(key) {
  updateValue(key, '')
}

function clearAllFilters() {
  const cleared = {}
  Object.keys(props.modelValue).forEach(key => {
    cleared[key] = ''
  })
  emit('update:modelValue', cleared)
  emit('filter-change', { key: 'all', value: null })
}
</script> 