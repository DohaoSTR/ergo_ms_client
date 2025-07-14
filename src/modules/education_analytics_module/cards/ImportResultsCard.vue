<template>
  <div class="import-results-card card rounded-3 p-4 mb-4">
    <div class="container px-0">
      <!-- Заголовок и описание -->
      <div class="d-flex justify-content-between align-items-center mb-4">
        <h3 class="mb-0 text-primary d-flex align-items-center">
          <Database :size="22" class="me-2"/>
          Результаты импорта
        </h3>
        <button
          @click="refresh"
          class="btn btn-outline-primary d-flex align-items-center"
          :disabled="isLoading"
        >
          <RefreshCw :size="18" class="me-2" :class="{ 'spin': isLoading }"/>
          <span>Обновить</span>
        </button>
      </div>

      <!-- Статистика импорта -->
      <div class="import-stats mb-4">
        <div class="row g-4">
          <div class="col-md-4">
            <div class="stats-card bg-primary-subtle p-3 rounded-3 h-100">
              <div class="d-flex align-items-center mb-2">
                <FileText :size="20" class="me-2 text-primary"/>
                <h5 class="mb-0">Файлы</h5>
              </div>
              <div class="stats-number">{{ animatedStats.filesCount }}</div>
              <div class="stats-label">Всего обработано</div>
            </div>
          </div>
          <div class="col-md-4">
            <div class="stats-card bg-success-subtle p-3 rounded-3 h-100">
              <div class="d-flex align-items-center mb-2">
                <CheckCircle2 :size="20" class="me-2 text-success"/>
                <h5 class="mb-0">Импорт</h5>
              </div>
              <div class="stats-number">{{ animatedStats.totalRecords }}</div>
              <div class="stats-label">Всего записей</div>
            </div>
          </div>
          <div class="col-md-4">
            <div class="stats-card bg-info-subtle p-3 rounded-3 h-100">
              <div class="d-flex align-items-center mb-2">
                <Clock :size="20" class="me-2 text-info"/>
                <h5 class="mb-0">Последний</h5>
              </div>
              <div class="stats-time">{{ stats.lastImportDate }}</div>
              <div class="stats-label">Последний импорт</div>
            </div>
          </div>
        </div>
      </div>

      <!-- Таблица с историей импорта -->
      <div class="history-section mb-4">
        <div class="d-flex justify-content-between align-items-center mb-3">
          <h4 class="mb-0">История импорта</h4>
          <div class="input-group input-group-sm" style="width: 250px;">
            <span class="input-group-text">
              <Search :size="16"/>
            </span>
            <input type="text" class="form-control" v-model="searchQuery" placeholder="Поиск...">
          </div>
        </div>

        <div v-if="isLoading" class="text-center my-5">
          <div class="spinner-border text-primary" role="status">
            <span class="visually-hidden">Загрузка...</span>
          </div>
          <p class="mt-2 text-muted">Загрузка истории импорта...</p>
        </div>

        <div v-else-if="importHistory.length === 0" class="text-center my-5">
          <FileQuestion :size="48" class="text-muted mb-3" />
          <p class="text-muted">История импорта пуста</p>
        </div>

        <div v-else class="table-container" :class="{ 'visible': tableVisible }">
          <div class="table-responsive-x">
            <table class="modern-table-full">
              <thead>
                <tr>
                  <th>Дата и время</th>
                  <th>Тип данных</th>
                  <th>Файл</th>
                  <th>Записей</th>
                  <th>Результат</th>
                </tr>
              </thead>
              <tbody>
                                <tr v-for="(item, index) in filteredHistory" :key="index"                    :style="isInitialLoad ? { animationDelay: (index * 0.05) + 's' } : {}"                    :class="{ 'table-row-animate': isInitialLoad }">
                  <td>{{ formatDate(item.timestamp) }}</td>
                  <td>{{ translateDataType(item.dataType) }}</td>
                  <td class="text-truncate" style="max-width: 200px">{{ item.fileName }}</td>
                  <td>{{ item.recordsCount }}</td>
                  <td>
                    <span
                      class="badge status-badge"
                      :class="item.status === 'success' ? 'status-success' :
                             item.status === 'warning' ? 'status-warning' :
                             'status-danger'"
                    >
                      {{ translateStatus(item.status) }}
                    </span>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        <!-- Пагинация -->
        <div v-if="importHistory.length > pageSize" class="d-flex justify-content-center mt-4">
          <nav>
            <ul class="pagination">
              <li class="page-item" :class="{ disabled: currentPage === 1 }">
                <button class="page-link" @click="currentPage--" :disabled="currentPage === 1">
                  <ChevronLeft :size="16" />
                </button>
              </li>
              <li
                v-for="page in totalPages"
                :key="page"
                class="page-item"
                :class="{ active: page === currentPage }"
              >
                <button class="page-link" @click="currentPage = page">{{ page }}</button>
              </li>
              <li class="page-item" :class="{ disabled: currentPage === totalPages }">
                <button class="page-link" @click="currentPage++" :disabled="currentPage === totalPages">
                  <ChevronRight :size="16" />
                </button>
              </li>
            </ul>
          </nav>
        </div>
      </div>

      <!-- Детали импорта (модальное окно) -->
      <div v-if="selectedImport" class="detail-modal">
        <div class="modal fade" id="importDetailsModal" tabindex="-1" aria-hidden="true">
          <div class="modal-dialog modal-lg">
            <div class="modal-content">
              <div class="modal-header">
                <h5 class="modal-title">Детали импорта</h5>
                <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Закрыть"></button>
              </div>
              <div class="modal-body">
                <dl class="row">
                  <dt class="col-sm-4">Тип данных:</dt>
                  <dd class="col-sm-8">{{ translateDataType(selectedImport.dataType) }}</dd>

                  <dt class="col-sm-4">Файл:</dt>
                  <dd class="col-sm-8">{{ selectedImport.fileName }}</dd>

                  <dt class="col-sm-4">Дата и время:</dt>
                  <dd class="col-sm-8">{{ formatDate(selectedImport.timestamp, true) }}</dd>

                  <dt class="col-sm-4">Статус:</dt>
                  <dd class="col-sm-8">
                    <span
                      class="badge"
                      :class="selectedImport.status === 'success' ? 'text-bg-success' :
                            selectedImport.status === 'warning' ? 'text-bg-warning' :
                            'text-bg-danger'">
                      {{ translateStatus(selectedImport.status) }}
                    </span>
                  </dd>
                </dl>

                <h6>Статистика:</h6>
                <ul class="list-group mb-3">
                  <li class="list-group-item d-flex justify-content-between align-items-center">
                    Всего записей
                    <span class="badge text-bg-primary rounded-pill">{{ selectedImport.recordsCount }}</span>
                  </li>
                  <li class="list-group-item d-flex justify-content-between align-items-center">
                    Добавлено
                    <span class="badge text-bg-success rounded-pill">{{ selectedImport.stats?.added || 0 }}</span>
                  </li>
                  <li class="list-group-item d-flex justify-content-between align-items-center">
                    Обновлено
                    <span class="badge text-bg-info rounded-pill">{{ selectedImport.stats?.updated || 0 }}</span>
                  </li>
                  <li class="list-group-item d-flex justify-content-between align-items-center">
                    Пропущено
                    <span class="badge text-bg-warning rounded-pill">{{ selectedImport.stats?.skipped || 0 }}</span>
                  </li>
                  <li class="list-group-item d-flex justify-content-between align-items-center">
                    Ошибок
                    <span class="badge text-bg-danger rounded-pill">{{ selectedImport.stats?.errors || 0 }}</span>
                  </li>
                </ul>

                <div v-if="selectedImport.errorDetails && selectedImport.errorDetails.length > 0">
                  <h6>Детали ошибок:</h6>
                  <div class="alert alert-danger">
                    <ul class="mb-0">
                      <li v-for="(error, index) in selectedImport.errorDetails" :key="index">
                        {{ error }}
                      </li>
                    </ul>
                  </div>
                </div>
              </div>
              <div class="modal-footer">
                <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Закрыть</button>
                <button
                  v-if="selectedImport.canRepeat"
                  type="button"
                  class="btn btn-primary"
                  @click="repeatImport(selectedImport)"
                >
                  <Repeat :size="16" class="me-2"/>
                  Повторить импорт
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

    </div>
    <ToastNotification ref="toastRef" />
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue'
import { Database, FileText, CheckCircle2, Clock, Search,
        FileQuestion, ChevronLeft, ChevronRight, RefreshCw } from 'lucide-vue-next'
// Раскомментируем импорты для API
import { apiClient } from '@/js/api/manager'
import { endpoints } from '@/js/api/endpoints'
import ToastNotification from './ToastNotification.vue'

// Состояние
const isLoading = ref(false)
const importHistory = ref([])
const searchQuery = ref('')
const currentPage = ref(1)
const pageSize = 10
const selectedImport = ref(null)
const toastRef = ref(null)
// Флаг для отслеживания первоначальной загрузки (добавляем)
const isInitialLoad = ref(true)
const stats = ref({
  filesCount: 0,
  totalRecords: 0,
  lastImportDate: 'Не выполнялся'
})

// Анимируемые значения для статистики
const animatedStats = ref({
  filesCount: 0,
  totalRecords: 0
})

// Флаг для анимации таблицы
const tableVisible = ref(false)

// Фильтрация истории
const filteredHistory = computed(() => {
  let filtered = [...importHistory.value]

  if (searchQuery.value.trim()) {
    const query = searchQuery.value.toLowerCase()
    filtered = filtered.filter(item =>
      item.fileName.toLowerCase().includes(query) ||
      translateDataType(item.dataType).toLowerCase().includes(query) ||
      translateStatus(item.status).toLowerCase().includes(query)
    )
  }

  // Сортировка по дате (сначала новые)
  filtered.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))

  // Пагинация
  const startIndex = (currentPage.value - 1) * pageSize
  return filtered.slice(startIndex, startIndex + pageSize)
})

// Общее количество страниц
const totalPages = computed(() => {
  const filtered = searchQuery.value.trim()
    ? importHistory.value.filter(item =>
        item.fileName.toLowerCase().includes(searchQuery.value.toLowerCase()) ||
        translateDataType(item.dataType).toLowerCase().includes(searchQuery.value.toLowerCase()) ||
        translateStatus(item.status).toLowerCase().includes(searchQuery.value.toLowerCase())
      )
    : importHistory.value

  return Math.max(1, Math.ceil(filtered.length / pageSize))
})

// Сбросить страницу при изменении поискового запроса
watch(searchQuery, () => {
  currentPage.value = 1
})

// Следим за изменением страницы для моментального отображения таблицы (добавляем)
watch(currentPage, () => {
  if (!isInitialLoad.value) {
    // Если это не первая загрузка, сразу отображаем таблицу
    tableVisible.value = true
  }
})

// Инициализация
onMounted(() => {
  // Добавляем импорт шрифтов для новой стилизации таблицы
  const link = document.createElement('link')
  link.href = 'https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap'
  link.rel = 'stylesheet'
  document.head.appendChild(link)

  // Загрузка данных
  loadImportHistory()
})

// Анимация чисел
const animateNumber = (target, propertyName, endValue, duration = 1000) => {
  const startValue = target[propertyName]
  const startTime = Date.now()
  const changeInValue = endValue - startValue

  const animate = () => {
    const elapsedTime = Date.now() - startTime
    const progress = Math.min(elapsedTime / duration, 1)
    // Используем функцию easeOutQuad для более естественной анимации
    const easeOutQuad = t => t * (2 - t)
    const easedProgress = easeOutQuad(progress)

    target[propertyName] = Math.round(startValue + changeInValue * easedProgress)

    if (progress < 1) {
      requestAnimationFrame(animate)
    } else {
      target[propertyName] = endValue // Гарантируем конечное значение
    }
  }

  requestAnimationFrame(animate)
}

// Загрузка статистики импорта
const loadImportStats = async () => {
  try {
    const response = await apiClient.get(endpoints.learning_analytics.importStats.get);

    if (response.success && response.data) {
      // Получаем данные из ответа API
      const statsData = Array.isArray(response.data) ? response.data[0] : response.data;

      // Обновляем статистику
      stats.value.filesCount = statsData.sum_of_imported_files || 0;
      stats.value.totalRecords = statsData.sum_of_imported_records || 0;

      // Форматируем дату последнего импорта, если она есть
      if (statsData.last_file_timestamp) {
        stats.value.lastImportDate = formatDate(statsData.last_file_timestamp);
      } else {
        stats.value.lastImportDate = 'Не выполнялся';
      }

      // Запускаем анимацию чисел
      animateNumber(animatedStats.value, 'filesCount', stats.value.filesCount, 1500);
      animateNumber(animatedStats.value, 'totalRecords', stats.value.totalRecords, 2000);
    } else {
      // Если нет данных или ошибка, устанавливаем нулевые значения
      stats.value = {
        filesCount: 0,
        totalRecords: 0,
        lastImportDate: 'Не выполнялся'
      };

      // Обнуляем анимируемые значения
      animatedStats.value = {
        filesCount: 0,
        totalRecords: 0
      };
    }
  } catch (error) {
    console.error('Ошибка при загрузке статистики импорта:', error);
    toastRef.value?.show('Ошибка при загрузке статистики импорта', 'error');
  }
};

// Загрузка истории импорта
const loadImportHistory = async () => {
  isLoading.value = true;
  tableVisible.value = false;

  try {
    // Загружаем историю импорта через API
    const response = await apiClient.get(endpoints.learning_analytics.importHistory.get);

    if (response.success) {
      // Получаем данные из ответа
      const historyData = response.data?.data || response.data || [];

      // Преобразуем данные в нужный формат, если требуется
      importHistory.value = historyData.map(item => ({
        id: item.id,
        timestamp: item.created_at || item.timestamp,
        dataType: item.data_type,
        fileName: item.file_name,
        recordsCount: item.records_count,
        status: item.status,
        stats: {
          added: item.stats?.added || 0,
          updated: item.stats?.updated || 0,
          skipped: item.stats?.skipped || 0,
          errors: item.stats?.errors || 0
        },
        errorDetails: item.error_details || []
      }));

      // Загружаем статистику
      await loadImportStats();

      // Анимируем появление таблицы только при первой загрузке (изменяем)
      if (isInitialLoad.value) {
        setTimeout(() => {
          tableVisible.value = true;
          // После первой загрузки меняем флаг на false
          isInitialLoad.value = false;
        }, 100);
      } else {
        // При последующих загрузках сразу показываем таблицу без анимации
        tableVisible.value = true;
      }
    } else {
      // Если ошибка в ответе
      importHistory.value = [];
      toastRef.value?.show(response.message || 'Ошибка при загрузке истории импорта', 'error');
    }
  } catch (error) {
    console.error('Ошибка при загрузке истории импорта:', error);
    importHistory.value = [];
    toastRef.value?.show('Ошибка при загрузке истории импорта', 'error');
  } finally {
    isLoading.value = false;
  }
};

// Перевод типа данных
const translateDataType = (type) => {
  const types = {
    'curriculum': 'Учебный план',
    'competencies': 'Компетенции',
    'disciplines': 'Дисциплины',
    'vacancies': 'Вакансии',
    'custom': 'Пользовательский формат'
  }

  return types[type] || type
}

// Перевод статуса
const translateStatus = (status) => {
  const statuses = {
    'success': 'Успешно',
    'warning': 'С предупреждениями',
    'error': 'С ошибками'
  }

  return statuses[status] || status
}

// Форматирование даты
const formatDate = (dateString, detailed = false) => {
  if (!dateString) return ''

  const date = new Date(dateString)

  if (detailed) {
    return new Intl.DateTimeFormat('ru-RU', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    }).format(date)
  }

  return new Intl.DateTimeFormat('ru-RU', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit'
  }).format(date)
}

// Обновление данных
const refresh = async () => {
  // Сбрасываем значения для красивой анимации
  animatedStats.value = {
    filesCount: 0,
    totalRecords: 0
  };

  // Включаем анимацию при обновлении данных через кнопку (добавляем)
  isInitialLoad.value = true;

  await loadImportHistory();
  toastRef.value?.show('Данные обновлены', 'success');
};

// Функция showDetails удалена, так как больше не используется

// Повторить импорт
const repeatImport = async (importItem) => {
  toastRef.value?.show(`Повторный импорт ${importItem.fileName}. Функция в разработке.`, 'info');

  // Здесь можно добавить реальную логику повторного импорта
  // Например:
  // try {
  //   const response = await apiClient.post(endpoints.learning_analytics.reimport, { id: importItem.id });
  //   if (response.success) {
  //     toastRef.value?.show('Импорт успешно запущен', 'success');
  //     await loadImportHistory();
  //   } else {
  //     toastRef.value?.show(response.message || 'Ошибка при повторном импорте', 'error');
  //   }
  // } catch (error) {
  //   toastRef.value?.show('Ошибка при повторном импорте', 'error');
  // }
};
</script>

<style scoped>
/* Подключаем переменные для таблицы из TableEditor */
:root {
  --table-border-radius: 0.5rem;
  --table-shadow: 0 2px 12px rgba(0, 0, 0, 0.08);
  --table-border: 1px solid var(--bs-border-color);
  --color-primary-background: var(--bs-body-bg);
  --color-secondary-background: white;
  --color-primary-text: var(--bs-body-color);
  --color-secondary-text: var(--bs-secondary-color);
  --color-border: var(--bs-border-color);
  --color-accent: var(--bs-primary);
  --color-table-header: rgba(var(--bs-primary-rgb), 0.08);
  --color-table-row-hover: rgba(var(--bs-primary-rgb), 0.04);
  --color-success: var(--bs-success);
  --color-danger: var(--bs-danger);
  --color-warning: var(--bs-warning);
  --font-family-base: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
}

.import-results-card {
  background: rgba(--bs-body-bg, 0.8);
  border: 1px solid var(--bs-border-color);
  box-shadow: 0 4px 24px 0 rgba(60, 72, 88, 0.08), 0 1.5px 4px 0 rgba(60, 72, 88, 0.04);
  transition: box-shadow 0.2s;
}

.import-results-card:hover {
  box-shadow: 0 8px 32px 0 rgba(60, 72, 88, 0.16), 0 3px 8px 0 rgba(60, 72, 88, 0.08);
}

h3 {
  font-size: 1.45rem;
  font-weight: 700;
  letter-spacing: 0.01em;
}

h4 {
  font-size: 1.2rem;
  font-weight: 600;
  color: var(--bs-primary);
}

h5 {
  font-size: 1rem;
  font-weight: 600;
}

.stats-card {
  border-radius: 0.5rem;
  border: 1px solid transparent;
  transition: all 0.2s;
}

.stats-card:hover {
  transform: translateY(-3px);
  box-shadow: 0 5px 15px rgba(0,0,0,0.05);
}

.stats-number {
  font-size: 2rem;
  font-weight: 700;
  line-height: 1.2;
  margin: 0.5rem 0;
}

.stats-time {
  font-size: 1.2rem;
  font-weight: 600;
  line-height: 1.2;
  margin: 0.5rem 0;
}

.stats-label {
  font-size: 0.9rem;
  color: var(--bs-secondary-color);
}

/* Новые стили для улучшенной таблицы */
.table-responsive-x {
  width: 100%;
  margin: 0;
  padding: 0;
  overflow-x: auto;
  -webkit-overflow-scrolling: touch;
  border-radius: var(--table-border-radius);
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.08);
  background: var(--color-secondary-background);
  position: relative;
  border: 1px solid var(--bs-border-color);
}

.modern-table-full {
  width: 100%;
  border-radius: var(--table-border-radius);
  background: var(--color-secondary-background);
  margin: 0;
  border-collapse: separate;
  border-spacing: 0;
  font-family: var(--font-family-base);
  overflow: hidden;
}

.modern-table-full th,
.modern-table-full td {
  padding: 12px 16px;
  text-align: left;
  border-bottom: 1px solid var(--bs-border-color);
  border-right: 1px solid rgba(var(--bs-border-color-rgb), 0.5);
  font-size: 14px;
  line-height: 1.5;
  background: transparent;
  color: var(--color-primary-text);
  font-family: var(--font-family-base);
}

.modern-table-full th:last-child,
.modern-table-full td:last-child {
  border-right: none;
}

.modern-table-full th {
  background: rgba(var(--bs-primary-rgb), 0.08);
  font-weight: 600;
  white-space: nowrap;
  position: sticky;
  top: 0;
  z-index: 2;
  border-bottom: 2px solid var(--bs-primary);
  color: var(--bs-primary);
}

.modern-table-full td {
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.modern-table-full tbody tr {
  transition: background-color 0.15s ease-in-out;
}

.modern-table-full tbody tr:hover {
  background-color: rgba(var(--bs-primary-rgb), 0.04);
}

.modern-table-full tbody tr:nth-child(even) {
  background-color: rgba(var(--bs-tertiary-bg-rgb), 0.3);
}

/* Стили для статусных меток */
.status-badge {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 4px 8px;
  border-radius: 4px;
  font-size: 12px;
  font-weight: 500;
  letter-spacing: 0.01em;
}

.status-success {
  background-color: rgba(var(--bs-success-rgb), 0.1);
  color: var(--bs-success);
  border: 1px solid rgba(var(--bs-success-rgb), 0.2);
}

.status-warning {
  background-color: rgba(var(--bs-warning-rgb), 0.1);
  color: var(--bs-warning);
  border: 1px solid rgba(var(--bs-warning-rgb), 0.2);
}

.status-danger {
  background-color: rgba(var(--bs-danger-rgb), 0.1);
  color: var(--bs-danger);
  border: 1px solid rgba(var(--bs-danger-rgb), 0.2);
}

/* Улучшенные стили для анимаций */
.table-container {
  opacity: 0;
  transform: translateY(20px);
  transition: opacity 0.5s ease, transform 0.5s ease;
}

.table-container.visible {
  opacity: 1;
  transform: translateY(0);
}

.table-row-animate {
  animation: fadeInUp 0.5s ease forwards;
  opacity: 0;
}

@keyframes fadeInUp {
  from {
    opacity: 0;
    transform: translateY(10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

/* Стили для скроллбара */
.table-responsive-x::-webkit-scrollbar {
  height: 8px;
}

.table-responsive-x::-webkit-scrollbar-track {
  background: var(--color-primary-background);
  border-radius: 4px;
}

.table-responsive-x::-webkit-scrollbar-thumb {
  background: var(--color-border);
  border-radius: 4px;
}

.table-responsive-x::-webkit-scrollbar-thumb:hover {
  background: var(--color-accent);
}

.pagination .page-link {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 2.2rem;
  min-width: 2.2rem;
}

.spin {
  animation: spin 1s linear infinite;
}

@keyframes spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}

.stats-number, .stats-time {
  transition: all 0.3s ease;
}
</style>
