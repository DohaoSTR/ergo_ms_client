
<template>
  <div class="database-tables card rounded-3 p-4 mb-4">
    <div class="container">
      <!-- Заголовок карточки -->
      <div class="d-flex justify-content-between align-items-center mb-4">
        <h3 class="mb-0 text-primary d-flex align-items-center">
          <i class="bi bi-table me-2"></i>Таблицы модуля
          <!-- Кнопка перезагрузки -->
          <button
            class="btn btn-link btn-sm ms-2 p-0 reload-button"
            :disabled="isLoading"
            @click="$emit('reload')"
            title="Обновить таблицы"
          >
            <RefreshCcw
              :size="20"
              :class="['reload-icon', { spinning: isLoading }]"
            />
          </button>
        </h3>
      </div>

      <div class="row">
        <div class="col-12">
          <!-- Блок загрузки -->
          <div v-if="isLoading" class="text-center my-4">
            <div class="spinner-border text-primary" role="status">
              <span class="visually-hidden">Загрузка...</span>
            </div>
            <div class="mt-2 text-muted">Загрузка списка таблиц...</div>
          </div>

          <!-- Таблица с данными -->
          <div v-else-if="tables.length" class="table-responsive">
            <table class="table table-hover">
              <thead>
                <tr>
                  <th>Название таблицы</th>
                  <th class="text-end">Количество полей</th>
                  <th class="text-end">Количество записей</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                <!-- Перебор таблиц, выделение выбранной, кнопка для редактирования -->
                <tr v-for="table in tables" :key="table.name" :class="{'table-active': selectedTable === table.name}">
                  <td>{{ table.name }}</td>
                  <td class="text-end">{{ table.columns_count }}</td>
                  <td class="text-end">{{ table.rows_count }}</td>
                  <td class="text-end">
                    <button
                      @click="$emit('select-table', table.name)"
                      class="btn btn-sm"
                      :class="[
                        selectedTable === table.name
                        ? 'btn-primary'
                        : 'btn-outline-primary'
                      ]">
                      <Eye :size="16" class="me-1"/>
                      {{ selectedTable === table.name ? 'Просматривается' : 'Просмотреть' }}
                    </button>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          <!-- Сообщение, если таблиц нет -->
          <div v-else class="alert alert-info text-center">
            <i class="bi bi-info-circle me-2"></i>
            Нет доступных таблиц
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
// Импорт иконки для кнопки редактирования
import { Eye, RefreshCcw } from 'lucide-vue-next'

// Описание входных параметров компонента
// isLoading: флаг загрузки
// selectedTable: имя выбранной таблицы
// tables: массив объектов с описанием таблиц
defineProps({
  isLoading: Boolean,
  selectedTable: String,
  tables: {
    type: Array,
    default: () => []
  }
})

// Описание события, которое эмитится при выборе таблицы
// select-table: имя выбранной таблицы
defineEmits(['select-table', 'reload'])
</script>

<style scoped>
/* Стили для выделения выбранной строки таблицы */
.table-active {
  background-color: rgba(var(--bs-primary-rgb), 0.1);
}

.reload-button {
  color: var(--bs-primary);
  transition: all 0.2s ease;
  opacity: 0.8;
}

.reload-button:hover {
  opacity: 1;
  transform: scale(1.1);
}

.reload-button:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.reload-icon {
  transition: transform 0.3s;
  display: inline-block;
  transform-origin: 50% 50%;
}

.spinning {
  animation: spin 2s linear infinite;
}

@keyframes spin {
  100% { transform: rotate(360deg); }
}
</style>
