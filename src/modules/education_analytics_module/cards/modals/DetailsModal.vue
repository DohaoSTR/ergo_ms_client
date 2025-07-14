<template>
  <div v-if="show" class="modal-overlay" @click="onClose">
    <div class="modal-content details-modal" @click.stop>
      <div class="modal-header">
        <div class="header-title-block">
          <h3>
            <span v-if="!isEditing">Детали записи</span>
            <span v-else>Редактирование записи</span>
            <span v-if="selectedRow.id" class="record-id">ID: {{ selectedRow.id }}</span>
          </h3>
          <div v-if="isEditDisabled" class="edit-disabled-message-compact">
            <svg width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" viewBox="0 0 24 24" style="margin-right:7px;"><rect x="3" y="11" width="18" height="8" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
            Редактирование записей в этой таблице отключено
          </div>
        </div>

        <!-- Кнопки редактирования и удаления в шапке -->
        <div class="modal-header-actions">
          <button
            v-if="!isEditing && !isRelationTable && !isEditDisabled"
            class="modal-header-action-btn modal-header-edit-btn"
            @click="fetchAndStartEdit"
            title="Редактировать запись"
          >
            <svg width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" viewBox="0 0 24 24">
              <path d="M17 3a2.85 2.85 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z"/>
            </svg>
          </button>
          <button
            v-if="!isEditing"
            class="modal-header-action-btn modal-header-refresh-btn"
            @click="fetchAndRefresh"
            title="Обновить данные"
            :disabled="isLoading"
          >
            <svg width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" viewBox="0 0 24 24">
              <path d="M1 4v6h6"/>
              <path d="M3.51 15a9 9 0 1 0 2.13-9.36L1 10"/>
            </svg>
          </button>
          <button
            v-if="!isEditing && !isRelationTable"
            class="modal-header-action-btn modal-header-delete-btn"
            @click="$emit('delete', selectedRow.id)"
            title="Удалить запись"
          >
            <svg width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" viewBox="0 0 24 24">
              <polyline points="3 6 5 6 21 6"/>
              <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v2"/>
              <line x1="10" y1="11" x2="10" y2="17"/>
              <line x1="14" y1="11" x2="14" y2="17"/>
            </svg>
          </button>
        </div>

        <button class="close-button" @click="onClose" title="Закрыть">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <line x1="18" y1="6" x2="6" y2="18"/>
            <line x1="6" y1="6" x2="18" y2="18"/>
          </svg>
        </button>
      </div>

      <!-- Содержимое модального окна -->
      <div class="details-content">
        <!-- Индикатор загрузки -->
        <div v-if="isLoading" class="loading-indicator">
          <div class="spinner"></div>
          <span>{{ loadingMessage }}</span>
        </div>

        <!-- Режим редактирования - JSON редактор -->
        <div v-else-if="isEditing && !isRelationTable && !isEditDisabled" class="json-editor-container">
          <div class="json-editor-header">
            <h4>Введите данные в формате JSON</h4>
          </div>

          <div class="json-editor-body">
            <textarea
              v-model="jsonEditValue"
              class="json-textarea"
              rows="15"
              placeholder="Введите JSON данных для редактирования"
              @input="validateJson"
            ></textarea>
          </div>

          <div v-if="jsonError" class="json-editor-error">
            {{ jsonError }}
          </div>

          <div class="modal-actions-row">
            <button
              class="save-button"
              @click="saveChanges"
              :disabled="!!jsonError || isSaving"
              :title="jsonError ? 'Исправьте ошибки JSON для сохранения' : 'Сохранить изменения'"
            >
              <svg v-if="!isSaving" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" viewBox="0 0 24 24">
                <polyline points="20 6 9 17 4 12"/>
              </svg>
              <div v-else class="button-spinner"></div>
              {{ isSaving ? 'Сохранение...' : 'Сохранить' }}
            </button>
            <button class="cancel-button" @click="$emit('cancelEdit')">
              <svg width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" viewBox="0 0 24 24">
                <line x1="18" y1="6" x2="6" y2="18"/>
                <line x1="6" y1="6" x2="18" y2="18"/>
              </svg>
              Отмена
            </button>
          </div>
        </div>

        <!-- Режим просмотра - детальное отображение полей -->
        <div v-else class="details-view">
          <div v-for="col in columns" :key="col" class="detail-row">
            <div class="detail-label">{{ col }}:</div>
            <div class="detail-value">
              <!-- Отображение значения -->
              <div v-if="isJsonField(selectedRow[col])" class="json-value">
                {{ formatJsonField(selectedRow[col]) }}
              </div>
              <div v-else-if="typeof selectedRow[col] === 'boolean'" class="boolean-value">
                {{ selectedRow[col] }}
              </div>
              <div v-else class="text-value">
                {{ selectedRow[col] !== null && selectedRow[col] !== undefined ? selectedRow[col] : '-' }}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, watch, onMounted } from 'vue';
import { apiClient } from '@/js/api/manager';
import { endpoints } from '@/js/api/endpoints';

const emit = defineEmits(['edit', 'save', 'cancelEdit', 'close', 'delete', 'update:editBuffer', 'update:selectedRow']);

const props = defineProps({
  show: Boolean,
  isEditing: Boolean,
  isRelationTable: Boolean,
  isEditDisabled: Boolean,
  columns: Array,
  editableFields: Array,
  fieldTypes: Object,
  editBuffer: Object,
  selectedRow: Object,
  apiEndpoints: Object
});

// Состояния
const isLoading = ref(false);
const isSaving = ref(false);
const loadingMessage = ref('Загрузка данных...');
const jsonEditValue = ref('');
const jsonError = ref('');
const localEditBuffer = ref({});
const originalData = ref(null);

// Получение данных с сервера перед редактированием
async function fetchAndStartEdit() {
  if (!props.selectedRow || !props.selectedRow.id) {
    console.error('Не удалось получить ID записи для редактирования');
    return;
  }

  const recordId = props.selectedRow.id;

  isLoading.value = true;
  loadingMessage.value = 'Загрузка актуальных данных...';

  try {
    // Формируем URL запроса, явно указывая ID в параметре запроса
    let endpoint;

    if (props.apiEndpoints && props.apiEndpoints.get) {
      endpoint = typeof props.apiEndpoints.get === 'function'
        ? props.apiEndpoints.get(recordId)
        : `${props.apiEndpoints.get}?id=${recordId}`;
    } else {
      const recordType = determineRecordType(props.selectedRow);
      if (recordType && endpoints.learning_analytics[recordType]) {
        const apiPath = endpoints.learning_analytics[recordType];
        endpoint = typeof apiPath.get === 'function'
          ? apiPath.get(recordId)
          : `${apiPath.get}?id=${recordId}`;
      } else {
        throw new Error('Не удалось определить API endpoint для текущей записи');
      }
    }

    console.log(`Запрашиваем данные по URL для ID=${recordId}:`, endpoint);
    const response = await apiClient.get(endpoint);

    // Получаем данные из ответа сервера, но всегда используем исходный ID
    let fetchedData = null;

    // Обрабатываем различные форматы ответа сервера
    if (response.data && response.data.data) {
      if (Array.isArray(response.data.data)) {
        // Если в ответе массив данных
        if (response.data.data.length > 0) {
          // Получаем или первую запись, или ту, которая имеет такой же ID
          fetchedData = response.data.data.find(item =>
            item.id === recordId || item.id === Number(recordId)
          ) || response.data.data[0];

          // Гарантируем, что ID не изменился
          fetchedData = { ...fetchedData, id: recordId };
        }
      } else {
        // Если data не массив, а объект
        fetchedData = { ...response.data.data, id: recordId };
      }
    } else if (Array.isArray(response.data)) {
      // Если в ответе просто массив
      if (response.data.length > 0) {
        fetchedData = response.data.find(item =>
          item.id === recordId || item.id === Number(recordId)
        ) || response.data[0];

        // Гарантируем, что ID не изменился
        fetchedData = { ...fetchedData, id: recordId };
      }
    } else if (response.data) {
      // Если в ответе просто объект
      fetchedData = { ...response.data, id: recordId };
    }

    if (!fetchedData) {
      console.warn('API не вернул данные для редактирования, используем текущие данные');
      fetchedData = { ...props.selectedRow };
    }

    console.log('Получены данные для редактирования, устанавливаем ID =', recordId);

    // Сохраняем оригинальные данные для возможности отката
    originalData.value = fetchedData;

    // Запускаем редактирование с полученными данными
    startEdit(fetchedData);
  } catch (error) {
    console.error('Ошибка при загрузке данных:', error);
    jsonError.value = `Не удалось загрузить данные: ${error.message}`;

    // При ошибке используем локальные данные с сохранением ID
    startEdit({ ...props.selectedRow });
  } finally {
    isLoading.value = false;
  }
}

// Функция для принудительного обновления данных записи
async function fetchAndRefresh() {
  if (!props.selectedRow || !props.selectedRow.id) {
    console.error('Не удалось получить ID записи для обновления');
    return;
  }

  const recordId = props.selectedRow.id;

  isLoading.value = true;
  loadingMessage.value = 'Обновление данных...';

  try {
    // Формируем URL запроса, явно указывая ID в параметре запроса
    let endpoint;

    if (props.apiEndpoints && props.apiEndpoints.get) {
      endpoint = typeof props.apiEndpoints.get === 'function'
        ? props.apiEndpoints.get(recordId)
        : `${props.apiEndpoints.get}?id=${recordId}`;
    } else {
      const recordType = determineRecordType(props.selectedRow);
      if (recordType && endpoints.learning_analytics[recordType]) {
        const apiPath = endpoints.learning_analytics[recordType];
        endpoint = typeof apiPath.get === 'function'
          ? apiPath.get(recordId)
          : `${apiPath.get}?id=${recordId}`;
      } else {
        throw new Error('Не удалось определить API endpoint для текущей записи');
      }
    }

    console.log(`Обновление данных по URL для ID=${recordId}:`, endpoint);
    const response = await apiClient.get(endpoint);

    // Получаем данные из ответа сервера, но всегда используем исходный ID
    let fetchedData = null;

    // Обрабатываем различные форматы ответа сервера
    if (response.data && response.data.data) {
      if (Array.isArray(response.data.data)) {
        // Если в ответе массив данных
        if (response.data.data.length > 0) {
          // Получаем или первую запись, или ту, которая имеет такой же ID
          fetchedData = response.data.data.find(item =>
            item.id === recordId || item.id === Number(recordId)
          ) || response.data.data[0];

          // Гарантируем, что ID не изменился
          fetchedData = { ...fetchedData, id: recordId };
        }
      } else {
        // Если data не массив, а объект
        fetchedData = { ...response.data.data, id: recordId };
      }
    } else if (Array.isArray(response.data)) {
      // Если в ответе просто массив
      if (response.data.length > 0) {
        fetchedData = response.data.find(item =>
          item.id === recordId || item.id === Number(recordId)
        ) || response.data[0];

        // Гарантируем, что ID не изменился
        fetchedData = { ...fetchedData, id: recordId };
      }
    } else if (response.data) {
      // Если в ответе просто объект
      fetchedData = { ...response.data, id: recordId };
    }

    if (!fetchedData) {
      console.warn('API не вернул данные при обновлении, используем текущие данные');
      fetchedData = { ...props.selectedRow };
    } else {
      // Обновляем данные в компоненте через событие
      emit('update:selectedRow', fetchedData);

      // Показываем индикатор успешного обновления
      const refreshIndicator = document.createElement('div');
      refreshIndicator.className = 'refresh-success-indicator';
      refreshIndicator.textContent = 'Данные обновлены';
      document.body.appendChild(refreshIndicator);

      // Удаляем индикатор через 2 секунды
      setTimeout(() => {
        document.body.removeChild(refreshIndicator);
      }, 2000);
    }

    console.log('Данные успешно обновлены');
  } catch (error) {
    console.error('Ошибка при обновлении данных:', error);

    // Показываем индикатор ошибки
    const errorIndicator = document.createElement('div');
    errorIndicator.className = 'refresh-error-indicator';
    errorIndicator.textContent = `Ошибка: ${error.message}`;
    document.body.appendChild(errorIndicator);

    // Удаляем индикатор через 3 секунды
    setTimeout(() => {
      document.body.removeChild(errorIndicator);
    }, 3000);
  } finally {
    isLoading.value = false;
  }
}

// Определение типа записи на основе её структуры
function determineRecordType(record) {
  if (!record) return null;

  // Более точное определение на основе уникальных комбинаций полей
  if ('company_name' in record && 'email' in record) {
    return 'employers';
  }

  if ('code' in record && 'specialization' in record && 'faculty' in record) {
    return 'specialities';
  }

  if ('speciality' in record && 'education_duration' in record) {
    return 'curriculums';
  }

  if ('name' in record && 'description' in record && 'popularity' in record && 'rating' in record) {
    return 'technologies';
  }

  if ('code' in record && 'blooms_level' in record && 'complexity' in record && 'demand' in record) {
    return 'competencies';
  }

  if ('code' in record && 'name' in record && 'description' in record && !('curriculum' in record) && !('technologies' in record)) {
    return 'baseDisciplines';
  }

  if ('curriculum' in record && 'base_discipline' in record && 'semesters' in record) {
    return 'disciplines';
  }

  if ('employer' in record && 'title' in record && 'salary_min' in record) {
    return 'vacancies';
  }

  if ('curriculum' in record && 'discipline_list' in record && 'technology_stack' in record) {
    return 'acms';
  }

  if ('vacancy' in record && ('competencies_stack' in record || 'technology_stack' in record)) {
    return 'vcms';
  }

  if ('user_id' in record && ('competencies_stack' in record || 'technology_stack' in record)) {
    return 'ucms';
  }

  // Если не удалось определить по комбинациям, используем ID записи
  // и текущую открытую таблицу для определения типа
  const apiEndpoints = getApiEndpointsForTable();

  if (apiEndpoints && apiEndpoints.get) {
    const endpointParts = typeof apiEndpoints.get === 'string'
      ? apiEndpoints.get.split('/')
      : [];

    // Извлекаем тип из пути API
    for (const part of endpointParts) {
      const knownTypes = ['specialities', 'curriculums', 'technologies', 'competencies',
                          'baseDisciplines', 'base_disciplines', 'disciplines',
                          'vacancies', 'employers', 'acms', 'vcms', 'ucms'];
      if (knownTypes.includes(part)) {
        console.log(`Определен тип записи по пути API: ${part}`);
        return part === 'base_disciplines' ? 'baseDisciplines' : part;
      }
    }
  }

  console.warn('Не удалось определить тип записи по структуре данных:', record);
  return null;
}

// Получает API endpoints для текущей таблицы
function getApiEndpointsForTable() {
  // Маппинг названий таблиц к конечным точкам API
  const tableApiMap = {
    la_df_speciality: endpoints.learning_analytics.specialities,
    la_df_curriculum: endpoints.learning_analytics.curriculums,
    la_df_technology: endpoints.learning_analytics.technologies,
    la_df_competency: endpoints.learning_analytics.competencies,
    la_df_base_discipline: endpoints.learning_analytics.baseDisciplines,
    la_df_basediscipline: endpoints.learning_analytics.baseDisciplines,
    la_df_discipline: endpoints.learning_analytics.disciplines,
    la_df_vacancy: endpoints.learning_analytics.vacancies,
    la_employer: endpoints.learning_analytics.employers,
    la_df_academic_competence_matrix: endpoints.learning_analytics.acms,
    la_df_acm: endpoints.learning_analytics.acms,
    la_df_competency_profile_of_vacancy: endpoints.learning_analytics.vcms,
    la_df_vcm: endpoints.learning_analytics.vcms,
    la_df_user_competency_matrix: endpoints.learning_analytics.ucms,
    la_df_ucm: endpoints.learning_analytics.ucms
  };

  // Получаем имя открытой таблицы из DOM (если возможно)
  const tableTitle = document.querySelector('.table-editor-full h2')?.textContent;
  if (tableTitle && tableApiMap[tableTitle]) {
    return tableApiMap[tableTitle];
  }

  // Ищем ближайшие индикаторы в URL или метаданных
  const pathname = window.location.pathname;
  const urlParts = pathname.split('/');

  for (const part of urlParts) {
    if (tableApiMap[part]) {
      return tableApiMap[part];
    }
  }

  // Если передан selectedRow, пытаемся определить по нему
  if (props.selectedRow && props.selectedRow.id) {
    for (const [tableName, api] of Object.entries(tableApiMap)) {
      if (tableName.toLowerCase().includes(window.location.pathname.toLowerCase())) {
        return api;
      }
    }
  }

  return null;
}

// Инициализация редактирования
function startEdit(data = null) {
  // Используем данные из API или из props.selectedRow, если данные API недоступны
  const originalId = props.selectedRow.id;
  const editData = data ? { ...data } : { ...props.selectedRow };

  // Сохраняем ID отдельно, но удаляем из JSON для редактирования
  // ID не должен меняться и не должен отображаться в окне редактирования
  delete editData.id;

  // Удаляем технические поля, если они есть
  const skipFields = ['created_at', 'updated_at'];
  skipFields.forEach(field => {
    if (field in editData) {
      delete editData[field];
    }
  });

  // Форматируем JSON для отображения в редакторе
  jsonEditValue.value = JSON.stringify(editData, null, 2);
  console.log(`Данные установлены в редактор для записи с ID=${originalId}`);

  // Обновляем локальный буфер (без ID)
  localEditBuffer.value = { ...editData };

  // Очищаем ошибки
  jsonError.value = '';

  // Вызываем событие редактирования и обновляем editBuffer в родительском компоненте
  emit('edit');
  emit('update:editBuffer', editData);
}

// Валидация JSON
function validateJson() {
  try {
    if (!jsonEditValue.value.trim()) {
      jsonError.value = 'JSON не может быть пустым';
      return;
    }

    const parsedData = JSON.parse(jsonEditValue.value);

    // Проверяем, что это объект
    if (typeof parsedData !== 'object' || parsedData === null || Array.isArray(parsedData)) {
      jsonError.value = 'Введенная структура должна быть объектом JSON';
      return;
    }

    localEditBuffer.value = parsedData;
    jsonError.value = '';
    emit('update:editBuffer', parsedData);
  } catch (error) {
    console.error('Ошибка валидации JSON:', error);
    jsonError.value = 'Введенная структура не соответствует формату JSON';
  }
}

// Сохранение изменений
async function saveChanges() {
  if (jsonError.value) {
    console.error('Не удалось сохранить из-за ошибок JSON:', jsonError.value);
    return; // Не сохраняем, если есть ошибки
  }

  try {
    // Еще раз валидируем JSON перед сохранением
    validateJson();

    if (jsonError.value) {
      return; // Если ошибка возникла при валидации
    }

    const updatedData = JSON.parse(jsonEditValue.value);

    // ID не должен содержаться в редактируемом JSON
    if ('id' in updatedData) {
      delete updatedData.id;
    }

    console.log('Данные для сохранения:', updatedData);

    emit('save', updatedData);
  } catch (error) {
    console.error('Ошибка при сохранении:', error);
    jsonError.value = 'Ошибка при подготовке данных: структура не соответствует формату JSON';
  }
}

// Отслеживаем изменения в редактируемых данных
watch(() => props.editBuffer, (val) => {
  if (props.isEditing) {
    // Обновляем локальный буфер
    localEditBuffer.value = { ...val };
    jsonEditValue.value = JSON.stringify(val, null, 2);
  }
}, { deep: true });

// Форматирование для отображения JSON полей
function isJsonField(value) {
  return Array.isArray(value) || (typeof value === 'object' && value !== null && value !== undefined);
}

function formatJsonField(value) {
  if (Array.isArray(value)) {
    return value.join(', ');
  } else if (typeof value === 'object' && value !== null) {
    return JSON.stringify(value, null, 2);
  }
  return value;
}

/**
 * Жизненный цикл компонента
 */
onMounted(() => {
  console.log('DetailsModal смонтирован, isEditing =', props.isEditing);

  // При монтировании компонента, если мы находимся в режиме редактирования, запускаем редактирование
  if (props.isEditing) {
    fetchAndStartEdit();
  }
});

// Отслеживаем изменения в режиме редактирования
watch(() => props.isEditing, (newValue) => {
  console.log('Изменение режима редактирования:', newValue);
  if (newValue === true) {
    fetchAndStartEdit();
  }
});

// Отслеживаем изменения в выбранной записи
watch(() => props.selectedRow, (newValue) => {
  console.log('Изменение выбранной записи:', newValue);
  if (props.isEditing && newValue && Object.keys(newValue).length > 0) {
    // Если выбрана новая запись и мы в режиме редактирования, запускаем редактирование
    fetchAndStartEdit();
  }
}, { deep: true });

// Закрытие модального окна
const onClose = () => emit('close');
</script>

<style scoped>
.modal-overlay {
  position: fixed;
  z-index: 9998;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
  background: var(--modal-overlay-bg, rgba(0, 0, 0, 0.35));
  display: flex;
  align-items: center;
  justify-content: center;
}

.modal-content.details-modal {
  background: var(--color-secondary-background);
  color: var(--color-primary-text);
  border-radius: 16px;
  box-shadow: 0 8px 32px rgba(0,0,0,0.15);
  min-width: 340px;
  max-width: 700px;
  width: 90%;
  padding: 32px 24px 24px 24px;
  max-height: 80vh;
  overflow-y: auto;
  position: relative;
}

.modal-header {
  display: flex;
  justify-content: flex-start;
  align-items: flex-start;
  margin-bottom: 24px;
  padding-bottom: 16px;
  border-bottom: 2px solid var(--color-border);
  position: relative;
}

.header-title-block {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  flex: 1;
  margin-right: 80px;
}

.modal-header h3 {
  margin: 0;
  font-size: 22px;
  color: var(--color-accent);
  font-weight: 700;
  flex: 1;
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 12px;
}

.record-id {
  font-size: 14px;
  font-weight: 500;
  background: var(--bs-primary-bg-subtle);
  color: var(--bs-primary);
  padding: 4px 10px;
  border-radius: 16px;
  display: inline-flex;
  align-items: center;
  margin-left: 2px;
}

.close-button {
  position: absolute;
  top: 0;
  right: 0;
  margin: 0;
  width: 36px;
  height: 36px;
  padding: 6px;
  border: none;
  background: transparent;
  color: var(--color-secondary-text);
  cursor: pointer;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: background 0.18s, color 0.18s, box-shadow 0.18s, transform 0.25s;
}

.close-button:hover {
  background: var(--color-danger-bg);
  color: var(--color-danger);
  box-shadow: 0 2px 8px rgba(211,47,47,0.08);
  transform: rotate(90deg);
}

.details-content {
  max-height: 60vh;
  overflow-y: auto;
  padding-right: 16px;
  margin-right: -16px;
}

.details-content::-webkit-scrollbar {
  width: 8px;
}

.details-content::-webkit-scrollbar-track {
  background: var(--color-primary-background);
  border-radius: 4px;
}

.details-content::-webkit-scrollbar-thumb {
  background: var(--color-border);
  border-radius: 4px;
}

.details-content::-webkit-scrollbar-thumb:hover {
  background: var(--color-accent);
}

.detail-row {
  display: flex;
  margin-bottom: 16px;
  padding-bottom: 16px;
  border-bottom: 1px solid var(--color-border);
}

.detail-row:last-child {
  margin-bottom: 0;
  padding-bottom: 0;
  border-bottom: none;
}

.detail-label {
  flex: 0 0 200px;
  font-weight: 600;
  color: var(--color-secondary-text);
  padding-right: 20px;
  font-size: 15px;
}

.detail-value {
  flex: 1;
  color: var(--color-primary-text);
  word-break: break-word;
  font-size: 15px;
  line-height: 1.5;
  display: flex;
  flex-direction: column;
}

.modal-actions-row {
  display: flex;
  gap: 10px;
  margin-top: 20px;
  justify-content: flex-end;
}

.save-button, .cancel-button {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 18px;
  border-radius: 6px;
  font-size: 15px;
  font-weight: 500;
  transition: all 0.25s ease;
  border: none;
  cursor: pointer;
}

.save-button {
  background-color: var(--bs-success);
  color: white;
}

.save-button:hover:not(:disabled) {
  background-color: var(--bs-success-hover, var(--bs-success));
  transform: translateY(-2px);
  box-shadow: 0 4px 8px rgba(40, 167, 69, 0.2);
}

.save-button:disabled {
  background-color: var(--bs-secondary);
  color: var(--bs-gray-600);
  cursor: not-allowed;
}

.cancel-button {
  background-color: var(--bs-danger);
  color: white;
}

.cancel-button:hover {
  background-color: var(--bs-danger-hover, var(--bs-danger));
  transform: translateY(-2px);
  box-shadow: 0 4px 8px rgba(220, 53, 69, 0.2);
}

.modal-header-actions {
  display: flex;
  position: absolute;
  right: 50px;
  top: 0;
  gap: 8px;
}

.modal-header-action-btn {
  width: 36px;
  height: 36px;
  border-radius: 50%;
  background: transparent;
  border: none;
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--color-secondary-text);
  cursor: pointer;
  transition: all 0.2s ease;
}

.modal-header-edit-btn:hover {
  background-color: var(--bs-primary-bg-subtle);
  color: var(--bs-primary);
  box-shadow: 0 2px 8px rgba(var(--bs-primary-rgb, 208, 50, 45), 0.08);
}

.modal-header-delete-btn:hover {
  background-color: var(--bs-danger-bg-subtle);
  color: var(--bs-danger);
  box-shadow: 0 2px 8px rgba(var(--bs-danger-rgb, 220, 53, 69), 0.08);
}

.edit-disabled-message-compact {
  font-size: 13px;
  color: var(--color-warning);
  margin-top: 8px;
  display: flex;
  align-items: center;
}

.json-value {
  font-family: monospace;
  white-space: pre-wrap;
  max-height: 200px;
  overflow-y: auto;
  background: var(--color-primary-background);
  padding: 8px;
  border-radius: 4px;
  font-size: 13px;
}

.boolean-value {
  font-weight: 500;
}

.text-value {
  font-weight: 400;
}

/* Стили для JSON редактора */
.json-editor-container {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.json-editor-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.json-editor-header h4 {
  margin: 0;
  font-size: 18px;
  color: var(--color-accent);
  display: flex;
  align-items: center;
}

.json-textarea {
  width: 100%;
  font-family: monospace;
  font-size: 14px;
  line-height: 1.5;
  padding: 12px;
  border: 2px solid var(--color-border);
  border-radius: 6px;
  resize: vertical;
  transition: all 0.2s ease;
  min-height: 250px;
  background: var(--color-primary-background);
  color: var(--color-primary-text);
}

.json-textarea:focus {
  outline: none;
  border-color: var(--color-accent);
  box-shadow: 0 0 0 3px rgba(var(--color-accent-rgb), 0.15);
}

.json-editor-error {
  padding: 10px 12px;
  background: var(--color-danger-bg);
  border-radius: 4px;
  color: var(--color-danger);
  font-size: 14px;
  border-left: 3px solid var(--color-danger);
}

/* Индикаторы загрузки */
.loading-indicator {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 40px 20px;
  color: var(--color-secondary-text);
  gap: 16px;
}

.loading-indicator span {
  font-size: 15px;
}

.spinner {
  width: 32px;
  height: 32px;
  border: 3px solid var(--color-border);
  border-top-color: var(--color-accent);
  border-radius: 50%;
  animation: spinner 1s linear infinite;
}

.button-spinner {
  width: 16px;
  height: 16px;
  border: 2px solid rgba(255, 255, 255, 0.3);
  border-top-color: white;
  border-radius: 50%;
  animation: spinner 1s linear infinite;
}

@keyframes spinner {
  to {
    transform: rotate(360deg);
  }
}
</style>
