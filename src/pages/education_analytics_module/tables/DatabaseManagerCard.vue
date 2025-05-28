<template>
  <div class="db-manager-container">
    <h2>Управление аналитическими данными</h2>

    <div class="manager-actions">
      <div class="tables-section">
        <h3>Таблицы БД</h3>
        <div v-if="loadingTables" class="loading-indicator">
          <div class="spinner"></div>
          <span>Загрузка таблиц...</span>
        </div>
        <div v-else-if="tables.length > 0" class="tables-list">
          <div
            v-for="table in tables"
            :key="table.name"
            class="table-item"
            :class="{ 'active': selectedTable === table.name }"
            @click="selectTable(table.name)"
          >
            <span class="table-name">{{ table.name }}</span>
            <span class="table-size">{{ table.rows }} записей</span>
          </div>
        </div>
        <p v-else class="no-data">Таблицы не найдены</p>
      </div>

      <div class="table-preview">
        <div class="preview-header">
          <h3>{{ selectedTable ? `Данные таблицы: ${selectedTable}` : 'Выберите таблицу' }}</h3>
          <div v-if="selectedTable" class="preview-actions">
            <button class="refresh-btn" @click="loadTableData">
              <span class="material-icons">refresh</span>
            </button>
          </div>
        </div>

        <div v-if="loadingTableData" class="loading-indicator">
          <div class="spinner"></div>
          <span>Загрузка данных...</span>
        </div>

        <div v-else-if="selectedTable && tableData.columns && tableData.rows" class="table-data">
          <div class="table-scroll">
            <table>
              <thead>
                <tr>
                  <th v-for="column in tableData.columns" :key="column.name">
                    {{ column.name }}
                    <small>{{ column.type }}</small>
                  </th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="(row, index) in tableData.rows" :key="index">
                  <td v-for="column in tableData.columns" :key="column.name">
                    {{ row[column.name] !== null ? row[column.name] : 'NULL' }}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          <div class="table-info">
            <p>Всего записей: {{ tableData.rows.length }}</p>
            <p>Колонок: {{ tableData.columns.length }}</p>
          </div>
        </div>

        <div v-else-if="selectedTable" class="no-data">
          <p>Данные не найдены или ошибка загрузки</p>
        </div>

        <div v-else class="no-table-selected">
          <p>Выберите таблицу для просмотра данных</p>
        </div>
      </div>
    </div>

    <div class="admin-actions">
      <button class="danger-btn" @click="confirmClearTables">
        <span class="material-icons">delete_sweep</span>
        Очистить все таблицы
      </button>
    </div>

    <!-- Модальное окно подтверждения -->
    <div v-if="showConfirmModal" class="modal-backdrop">
      <div class="modal-content">
        <h3>Подтверждение</h3>
        <p>Вы уверены, что хотите очистить все аналитические таблицы? Это действие нельзя отменить.</p>
        <div class="modal-actions">
          <button class="cancel-btn" @click="showConfirmModal = false">Отмена</button>
          <button class="confirm-btn" @click="clearTables">Подтвердить</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { endpoints } from '@/js/api/endpoints';
import { apiClient } from '@/js/api/manager';

const tables = ref([]);
const selectedTable = ref(null);
const tableData = ref({ columns: [], rows: [] });
const loadingTables = ref(true);
const loadingTableData = ref(false);
const showConfirmModal = ref(false);
const clearingTables = ref(false);

// Загрузка списка таблиц
const loadTables = async () => {
  loadingTables.value = true;
  try {
    const response = await apiClient.get(endpoints.learning_analytics.tables);
    if (response.success && response.data.tables) {
      tables.value = response.data.tables;
    } else {
      tables.value = [];
    }
  } catch (error) {
    console.error('Ошибка при загрузке таблиц:', error);
    tables.value = [];
  } finally {
    loadingTables.value = false;
  }
};

// Загрузка данных выбранной таблицы
const loadTableData = async () => {
  if (!selectedTable.value) return;

  loadingTableData.value = true;
  try {
    const response = await apiClient.get(
      endpoints.learning_analytics.tables,
      { table: selectedTable.value }
    );

    if (response.success) {
      tableData.value = {
        columns: response.data.columns || [],
        rows: response.data.rows || []
      };
    } else {
      tableData.value = { columns: [], rows: [] };
    }
  } catch (error) {
    console.error('Ошибка при загрузке данных таблицы:', error);
    tableData.value = { columns: [], rows: [] };
  } finally {
    loadingTableData.value = false;
  }
};

// Выбор таблицы
const selectTable = (tableName) => {
  selectedTable.value = tableName;
  loadTableData();
};

// Подтверждение очистки таблиц
const confirmClearTables = () => {
  showConfirmModal.value = true;
};

// Очистка всех таблиц
const clearTables = async () => {
  clearingTables.value = true;
  showConfirmModal.value = false;

  try {
    const response = await apiClient.post(endpoints.learning_analytics.clearTables);
    if (response.success) {
      alert('Таблицы успешно очищены');
      // Перезагружаем список таблиц и данные
      await loadTables();
      if (selectedTable.value) {
        await loadTableData();
      }
    } else {
      alert('Ошибка при очистке таблиц: ' + (response.errors?.message || 'Неизвестная ошибка'));
    }
  } catch (error) {
    console.error('Ошибка при очистке таблиц:', error);
    alert('Ошибка при очистке таблиц');
  } finally {
    clearingTables.value = false;
  }
};

onMounted(() => {
  loadTables();
});
</script>

<style scoped>
.db-manager-container {
  background: var(--color-primary-background, #f8f9fa);
  border-radius: 12px;
  padding: 20px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  margin-bottom: 20px;
}

h2 {
  font-size: clamp(18px, 4vw, 24px);
  color: var(--color-accent, #d0322d);
  margin-bottom: 20px;
}

h3 {
  font-size: 16px;
  color: var(--color-primary-text, #333);
  margin-bottom: 10px;
}

.manager-actions {
  display: flex;
  gap: 20px;
  margin-bottom: 20px;
}

.tables-section {
  flex: 0 0 300px;
  background: var(--color-secondary-background, #ffffff);
  border-radius: 8px;
  padding: 15px;
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.1);
}

.tables-list {
  max-height: 500px;
  overflow-y: auto;
}

.table-item {
  display: flex;
  justify-content: space-between;
  padding: 8px 12px;
  margin-bottom: 5px;
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.2s ease;
}

.table-item:hover {
  background-color: rgba(208, 50, 45, 0.1);
}

.table-item.active {
  background-color: rgba(208, 50, 45, 0.2);
  font-weight: bold;
}

.table-name {
  font-size: 14px;
  color: var(--color-primary-text, #333);
}

.table-size {
  font-size: 12px;
  color: var(--color-secondary-text, #777);
}

.table-preview {
  flex: 1;
  background: var(--color-secondary-background, #ffffff);
  border-radius: 8px;
  padding: 15px;
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.1);
}

.preview-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 15px;
}

.preview-actions button {
  background: none;
  border: none;
  cursor: pointer;
  color: var(--color-secondary-text, #777);
  transition: color 0.2s ease;
}

.preview-actions button:hover {
  color: var(--color-accent, #d0322d);
}

.table-scroll {
  max-height: 400px;
  overflow-y: auto;
  margin-bottom: 10px;
}

table {
  width: 100%;
  border-collapse: collapse;
  font-size: 14px;
}

th, td {
  padding: 8px 12px;
  text-align: left;
  border-bottom: 1px solid var(--color-border, #ddd);
}

th {
  background-color: var(--color-primary-background, #f8f9fa);
  position: sticky;
  top: 0;
  z-index: 1;
}

th small {
  display: block;
  font-size: 10px;
  font-weight: normal;
  color: var(--color-secondary-text, #777);
}

.table-info {
  display: flex;
  justify-content: space-between;
  padding-top: 10px;
  font-size: 12px;
  color: var(--color-secondary-text, #777);
}

.admin-actions {
  display: flex;
  justify-content: flex-end;
  margin-top: 20px;
}

.danger-btn {
  display: flex;
  align-items: center;
  gap: 5px;
  background-color: #f44336;
  color: white;
  border: none;
  padding: 8px 15px;
  border-radius: 6px;
  cursor: pointer;
  font-size: 14px;
  transition: background-color 0.2s ease;
}

.danger-btn:hover {
  background-color: #d32f2f;
}

.modal-backdrop {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.5);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 100;
}

.modal-content {
  background-color: var(--color-secondary-background, #ffffff);
  padding: 20px;
  border-radius: 10px;
  width: 90%;
  max-width: 500px;
  box-shadow: 0 5px 15px rgba(0, 0, 0, 0.2);
}

.modal-content h3 {
  margin-top: 0;
  color: var(--color-primary-text, #333);
}

.modal-actions {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
  margin-top: 20px;
}

.cancel-btn, .confirm-btn {
  padding: 8px 15px;
  border-radius: 6px;
  cursor: pointer;
  font-size: 14px;
  transition: all 0.2s ease;
}

.cancel-btn {
  background-color: transparent;
  border: 1px solid var(--color-border, #ddd);
  color: var(--color-primary-text, #333);
}

.cancel-btn:hover {
  background-color: var(--color-primary-background, #f8f9fa);
}

.confirm-btn {
  background-color: #f44336;
  border: none;
  color: white;
}

.confirm-btn:hover {
  background-color: #d32f2f;
}

.loading-indicator {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 20px 0;
}

.spinner {
  width: 30px;
  height: 30px;
  border: 3px solid rgba(208, 50, 45, 0.3);
  border-radius: 50%;
  border-top-color: var(--color-accent, #d0322d);
  animation: spin 1s ease-in-out infinite;
  margin-bottom: 10px;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

.no-data, .no-table-selected {
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 40px 0;
  color: var(--color-secondary-text, #777);
  font-style: italic;
}

@media (max-width: 768px) {
  .manager-actions {
    flex-direction: column;
  }

  .tables-section {
    flex: none;
    width: 100%;
  }

  .tables-list {
    max-height: 300px;
  }

  .table-scroll {
    max-height: 300px;
  }

  th, td {
    padding: 6px 8px;
    font-size: 12px;
  }
}
</style>
