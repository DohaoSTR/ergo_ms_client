<template>
  <div>
    <!-- Фильтры -->
    <div class="row mb-4">
      <div class="col-lg-3">
        <label class="form-label">Выберите курс</label>
        <select :value="selectedCourseId" @input="$emit('update:selectedCourseId', $event.target.value)" class="form-select">
          <option value="">Все курсы</option>
          <option v-for="course in courses" :key="course.id" :value="course.id">
            {{ course.name }}
          </option>
        </select>
      </div>
      <div class="col-lg-3">
        <label class="form-label">Поиск</label>
        <div class="input-group">
          <span class="input-group-text">
            <Search :size="16" />
          </span>
          <input
            :value="searchQuery"
            @input="$emit('update:searchQuery', $event.target.value)"
            type="text"
            class="form-control"
            placeholder="Поиск по названию..."
          />
        </div>
      </div>
      <div class="col-lg-3">
        <label class="form-label">Категория</label>
        <select :value="selectedCategory" @input="$emit('update:selectedCategory', $event.target.value)" class="form-select">
          <option value="">Все категории</option>
          <option v-for="category in categories" :key="category.id" :value="category.id">
            {{ category.name }}
          </option>
        </select>
      </div>
      <div class="col-lg-3">
        <label class="form-label">Формат</label>
        <select :value="selectedFormat" @input="$emit('update:selectedFormat', $event.target.value)" class="form-select">
          <option value="">Все форматы</option>
          <option v-for="format in courseFormats" :key="format.id" :value="format.id">
            {{ format.name }}
          </option>
        </select>
      </div>
    </div>

    <!-- Сортировка -->
    <div class="row mb-4">
      <div class="col-lg-4">
        <label class="form-label">Сортировать по</label>
        <select :value="sortBy" @input="$emit('update:sortBy', $event.target.value)" class="form-select">
          <option value="name">Названию</option>
          <option value="category">Категории</option>
          <option value="format">Формату</option>
        </select>
      </div>
      <div class="col-lg-4">
        <label class="form-label">Порядок</label>
        <select :value="sortOrder" @input="$emit('update:sortOrder', $event.target.value)" class="form-select">
          <option value="asc">По возрастанию</option>
          <option value="desc">По убыванию</option>
        </select>
      </div>
      <div class="col-lg-4">
        <label class="form-label">Статус</label>
        <select :value="selectedStatus" @input="$emit('update:selectedStatus', $event.target.value)" class="form-select">
          <option value="">Все</option>
          <option value="visible">Видимые</option>
          <option value="hidden">Скрытые</option>
          <option value="required">Обязательные</option>
        </select>
      </div>
    </div>
  </div>
</template>

<script setup>
import { Search } from 'lucide-vue-next'

defineProps({
  selectedCourseId: String,
  searchQuery: String,
  selectedCategory: String,
  selectedFormat: String,
  sortBy: String,
  sortOrder: String,
  selectedStatus: String,
  courses: Array,
  categories: Array,
  courseFormats: Array
})

defineEmits(['update:selectedCourseId', 'update:searchQuery', 'update:selectedCategory', 'update:selectedFormat', 'update:sortBy', 'update:sortOrder', 'update:selectedStatus'])
</script>

<style scoped>
/* Центрирование иконки поиска */
.input-group-text {
  display: flex !important;
  align-items: center !important;
  justify-content: center !important;
}

.input-group-text svg {
  display: inline-block !important;
  vertical-align: middle !important;
}

/* Центрирование для всех svg иконок */
svg {
  display: inline-block !important;
  vertical-align: middle !important;
}
</style> 