<template>
  <div class="excel-upload-card card rounded-3 p-4 mb-4">
    <div class="container px-0">
      <!-- Заголовок и описание -->
      <div class="d-flex justify-content-between align-items-center mb-4">
        <h3 class="mb-0 text-primary d-flex align-items-center">
          <FileSpreadsheet :size="22" class="me-2"/>
          Загрузка файлов
        </h3>
      </div>

      <div class="alert alert-info mb-4" role="alert">
        <Info :size="18" class="me-2 text-primary"/>
        <span>Загрузите Excel файлы для извлечения и анализа данных</span>
      </div>

      <!-- Форма загрузки -->
      <div class="upload-form mb-4">
        <div class="mb-3">
          <label for="uploadType" class="form-label">Тип загружаемых данных:</label>
          <select v-model="uploadType" class="form-select" id="uploadType">
            <option value="" disabled>Выберите тип данных</option>
            <option value="curriculum">Учебный план, .xsls</option>
            <option value="competencies">Компетенции, .csv</option>
            <option value="technologies">Технологии, . csv</option>
            <option value="vacancies">Вакансии, .csv</option>
            <option value="custom">Пользовательский формат, .json</option>
          </select>
        </div>

        <div class="mb-3">
          <label for="excelFile" class="form-label d-flex justify-content-between align-items-center">
            <span>Выберите файл:</span>
            <small v-if="!uploadType" class="text-danger">Выберите входной тип данных</small>
          </label>
          <input
            type="file"
            class="form-control"
            id="excelFile"
            ref="fileInput"
            accept=".xlsx,.xls"
            @change="handleFileChange"
            :disabled="!uploadType"
          />
        </div>

        <div v-if="uploadType === 'custom'" class="mb-3">
          <label for="sheetName" class="form-label">Имя листа (опционально):</label>
          <input
            type="text"
            class="form-control"
            id="sheetName"
            v-model="sheetName"
            placeholder="Оставьте пустым для первого листа"
          />
        </div>

        <div v-if="selectedFile" class="selected-file-info mb-3">
          <div class="d-flex align-items-center">
            <File :size="18" class="me-2 text-primary"/>
            <strong>{{ selectedFile.name }}</strong>
            <span class="ms-2 text-muted">({{ formatFileSize(selectedFile.size) }})</span>
            <button
              class="btn btn-sm btn-link text-danger ms-auto"
              @click="clearSelectedFile"
            >
              <X :size="16"/>
            </button>
          </div>
        </div>

        <div class="d-flex gap-2">
          <button
            @click="uploadFile"
            :disabled="!canUpload || isUploading || isProcessing"
            class="btn btn-primary d-flex align-items-center action-btn">
            <template v-if="isUploading">
              <span class="spinner-border spinner-border-sm me-2" role="status"></span>
              Загрузка...
            </template>
            <template v-else>
              <Upload :size="18" class="me-2"/>
              <span>Загрузить файл</span>
            </template>
          </button>

          <button
            @click="processFile"
            :disabled="!canProcess"
            class="btn btn-primary d-flex align-items-center action-btn">
            <template v-if="isProcessing">
              <span class="spinner-border spinner-border-sm me-2" role="status"></span>
              Обработка...
            </template>
            <template v-else>
              <BarChartBig :size="18" class="me-2"/>
              <span>Обработать данные</span>
            </template>
          </button>
        </div>
      </div>

      <!-- Результаты предварительного просмотра -->
      <div v-if="previewData && previewData.length > 0" class="preview-section mb-4">
        <h4 class="mb-3">Предварительный просмотр данных</h4>
        <div class="preview-container">
          <table class="table table-bordered table-hover table-sm preview-table">
            <thead>
              <tr>
                <th v-for="(column, index) in previewHeaders || []" :key="index">{{ column }}</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="(row, rowIndex) in (previewData || []).slice(0, 5)" :key="rowIndex">
                <td v-for="(cell, cellIndex) in row || []" :key="cellIndex">{{ cell }}</td>
              </tr>
            </tbody>
          </table>
          <div v-if="previewData && previewData.length > 5" class="text-muted text-center mt-2">
            Показаны первые 5 строк из {{ previewData.length }}
          </div>
        </div>
      </div>

      <!-- Краткая информация о файле учебного плана -->
      <div v-if="uploadType === 'curriculum' && Object.keys(fileSummary).length > 0" class="file-summary-section mb-4">
        <h5 class="summary-title mb-3"><FileSpreadsheet class="me-2" :size="18" /> Информация об учебном плане</h5>
        <div class="summary-container p-3">
          <div class="row g-3">
            <!-- Основная информация -->
            <div class="col-md-12 mb-2">
              <div class="d-flex align-items-center mb-2">
                <span class="info-badge specialty">{{ fileSummary.specialty_code || '' }}</span>
                <span class="ms-2 specialty-name">{{ fileSummary.specialty_name || 'Не указано' }}</span>
              </div>
              <div class="info-secondary mb-1" v-if="fileSummary.specialization">
                Специализация: {{ fileSummary.specialization }}
              </div>
              <div class="info-secondary" v-if="fileSummary.department">
                Кафедра: {{ fileSummary.department }}
              </div>
            </div>

            <!-- Дополнительная информация -->
            <div class="col-sm-6 col-lg-3">
              <div class="info-tile">
                <span class="info-label">Год набора</span>
                <span class="info-value">{{ fileSummary.year_of_admission || 'Не указано' }}</span>
              </div>
            </div>
            <div class="col-sm-6 col-lg-3">
              <div class="info-tile">
                <span class="info-label">Срок обучения</span>
                <span class="info-value">{{ fileSummary.education_duration || '-' }} семестров</span>
              </div>
            </div>
            <div class="col-sm-6 col-lg-3">
              <div class="info-tile">
                <span class="info-label">Дисциплины</span>
                <span class="info-value">{{ disciplinesCount || 0 }}</span>
              </div>
            </div>
            <div class="col-sm-6 col-lg-3">
              <div class="info-tile">
                <span class="info-label">Компетенции</span>
                <span class="info-value">{{ competenciesCount || 0 }}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Результаты обработки -->
      <div v-if="processingResults" class="processing-results">
        <h4 class="mb-3">Результаты обработки</h4>
        <div class="alert" :class="processingSuccess ? 'alert-success' : 'alert-danger'">
          <div class="d-flex align-items-start">
            <CheckCircle2 v-if="processingSuccess" :size="20" class="me-2"/>
            <AlertCircle v-else :size="20" class="me-2"/>
            <div>
              <p class="mb-1"><strong>{{ processingResults.message }}</strong></p>
              <div v-if="processingResults.details">
                <p class="mb-1">{{ processingResults.details }}</p>
              </div>
              <div v-if="processingResults.stats" class="mt-2">
                <div v-for="(value, key) in processingResults.stats" :key="key" class="d-flex mb-1">
                  <span class="text-muted me-2">{{ key }}:</span>
                  <strong>{{ value }}</strong>
                </div>
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
import { ref, computed } from 'vue'
import { FileSpreadsheet, File, Info, Upload, BarChartBig, X, CheckCircle2, AlertCircle } from 'lucide-vue-next'
import { apiClient } from '@/js/api/manager'
import { endpoints } from '@/js/api/endpoints'
import ToastNotification from './ToastNotification.vue'

const toastRef = ref(null)
const fileInput = ref(null)
const selectedFile = ref(null)
const uploadType = ref('')
const sheetName = ref('')
const isUploading = ref(false)
const isProcessing = ref(false)
const isFileUploaded = ref(false)
const previewData = ref([])
const previewHeaders = ref([])
const processingResults = ref(null)
const processingSuccess = ref(false)
const fileSummary = ref({})
const disciplinesCount = ref(0)
const competenciesCount = ref(0)

// Проверка наличия выбранного файла
const canUpload = computed(() => {
  return selectedFile.value !== null && uploadType.value !== ''
})

// Проверка возможности обработки данных
const canProcess = computed(() => {
  return isFileUploaded.value && !isProcessing.value
})

// Обработка выбора файла
const handleFileChange = (event) => {
  const files = event.target.files
  if (files.length > 0) {
    selectedFile.value = files[0]
    // Сбрасываем предыдущие результаты
    resetResults()
  } else {
    selectedFile.value = null
  }
}

// Очистка выбранного файла
const clearSelectedFile = () => {
  selectedFile.value = null
  if (fileInput.value) {
    fileInput.value.value = ''
  }
  resetResults()
}

// Сброс результатов
const resetResults = () => {
  previewData.value = []
  previewHeaders.value = []
  processingResults.value = null
  isFileUploaded.value = false
  fileSummary.value = {}
  disciplinesCount.value = 0
  competenciesCount.value = 0
}

// Форматирование размера файла
const formatFileSize = (bytes) => {
  if (bytes === 0) return '0 Байт'
  const k = 1024
  const sizes = ['Байт', 'КБ', 'МБ', 'ГБ']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
}

// Загрузка файла
const uploadFile = async () => {
  if (!selectedFile.value || !uploadType.value) {
    toastRef.value?.show('Выберите файл и тип данных', 'warning')
    return
  }

  isUploading.value = true
  try {
    const formData = new FormData()
    formData.append('file', selectedFile.value)
    formData.append('type', uploadType.value)
    if (uploadType.value === 'custom' && sheetName.value) {
      formData.append('sheet_name', sheetName.value)
    }

    // Используем apiClient для отправки запроса
    const response = await apiClient.post(
      endpoints.learning_analytics.excel.upload,
      formData,
      true
    )

    if (response && response.success) {
      // Логирование для отладки

      // Устанавливаем заголовки и данные для предпросмотра, с проверкой на наличие данных
      previewHeaders.value = response.data?.headers || []
      previewData.value = response.data?.preview || []
      isFileUploaded.value = true

      // Устанавливаем краткую информацию о файле, если она есть
      fileSummary.value = response.data?.file_summary || {}
      disciplinesCount.value = response.data?.disciplines_count || 0
      competenciesCount.value = response.data?.competencies_count || 0

      // Дополнительное логирование для отладки

      toastRef.value?.show('Файл успешно загружен', 'success')
    } else {
      const errorMessage = response?.message || 'Ошибка при загрузке файла'
      toastRef.value?.show(errorMessage, 'error')
    }

  } catch (error) {
    console.error('Ошибка при загрузке файла:', error)
    toastRef.value?.show(`Ошибка при загрузке файла: ${error.message || 'Неизвестная ошибка'}`, 'error')
    // Сбрасываем данные предпросмотра в случае ошибки
    previewData.value = []
    previewHeaders.value = []
    fileSummary.value = {}
    disciplinesCount.value = 0
    competenciesCount.value = 0
  } finally {
    isUploading.value = false
  }
}

// Обработка загруженного файла
const processFile = async () => {
  if (!isFileUploaded.value) {
    toastRef.value?.show('Сначала загрузите файл', 'warning')
    return
  }

  isProcessing.value = true
  try {
    // Используем apiClient для обработки данных
    const response = await apiClient.post(
      endpoints.learning_analytics.excel.process,
      {
        type: uploadType.value,
        sheet_name: sheetName.value || undefined
      },
      true
    )

    processingResults.value = {
      success: response?.success || false,
      message: response?.message || 'Обработка завершена',
      details: response?.details,
      stats: response?.stats
    }
    processingSuccess.value = response?.success || false
    toastRef.value?.show(response?.message || 'Обработка завершена', processingSuccess.value ? 'success' : 'error')

  } catch (error) {
    console.error('Ошибка при обработке файла:', error)
    processingResults.value = {
      success: false,
      message: 'Ошибка при обработке файла',
      details: error.message || 'Произошла неизвестная ошибка'
    }
    processingSuccess.value = false
    toastRef.value?.show(`Ошибка при обработке файла: ${error.message || 'Неизвестная ошибка'}`, 'error')
  } finally {
    isProcessing.value = false
  }
}
</script>

<style scoped>
.excel-upload-card {
  background-color: var(--color-primary-background);
  border: 1px solid var(--color-border);
  box-shadow: 0 4px 12px 0 rgba(13, 35, 67, 0.03);
  transition: background-color 0.3s ease-in-out, box-shadow 0.3s ease-in-out;
}

.excel-upload-card:hover {
  box-shadow: 0 8px 32px 0 rgba(0, 0, 0, 0.1);
}

.action-btn {
  min-width: 170px;
  transition: all 0.3s ease-in-out;
  font-weight: 500;
  letter-spacing: 0.01em;
  box-shadow: 0 0.125rem 0.25rem 0 rgba(var(--bs-primary-rgb), 0.4);
  background-color: var(--color-accent);
  border-color: var(--color-accent);
  color: #ffffff;
}

.action-btn:not(:disabled):hover {
  transform: translateY(-2px) scale(1.04);
  box-shadow: 0 0.25rem 0.75rem 0 rgba(var(--bs-primary-rgb), 0.35);
  z-index: 1;
  background-color: var(--color-accent);
  border-color: var(--color-accent);
  filter: brightness(108%);
}

.action-btn:active:not(:disabled) {
  background-color: var(--color-accent);
  border-color: var(--color-accent);
  filter: brightness(95%);
}

.preview-container {
  max-height: 300px;
  overflow-y: auto;
  border: 1px solid var(--color-border);
  border-radius: 8px;
}

.selected-file-info {
  padding: 8px;
  background-color: var(--color-secondary-background);
  border-radius: 8px;
  border: 1px solid var(--color-border);
}

h3 {
  font-size: 22px;
  font-weight: 500;
  letter-spacing: 0.01em;
  color: var(--color-primary-text);
}

h4 {
  font-size: 18px;
  font-weight: 500;
  color: var(--color-accent);
  margin-top: 1.5rem;
}

.alert {
  background-color: var(--color-secondary-background);
  color: var(--color-primary-text);
  border: none;
  box-shadow: 0 1px 4px 0 rgba(0, 0, 0, 0.04);
  display: flex;
  align-items: center;
  font-size: 16px;
  font-weight: 500;
}

.spinner-border {
  animation: spinner-border 0.75s linear infinite;
}

@keyframes spinner-border {
  to { transform: rotate(360deg); }
}

.preview-table {
  width: 100%;
  color: var(--color-primary-text);
  background-color: var(--color-primary-background);
  border-color: var(--color-border);
}

.preview-table thead {
  background-color: var(--color-secondary-background);
  color: var(--color-primary-text);
  border-bottom: 2px solid var(--color-border);
}

.preview-table th,
.preview-table td {
  padding: 8px;
  border-color: var(--color-border);
}

.preview-table tbody tr:hover {
  background-color: var(--color-hover-background);
}

.text-muted {
  color: var(--color-secondary-text) !important;
}

.file-summary-section {
  margin-top: 1.5rem;
}

.summary-title {
  font-size: 1.25rem;
  font-weight: 600;
  color: var(--color-primary-text);
  display: flex;
  align-items: center;
}

.summary-container {
  background-color: var(--color-primary-background);
  border: 1px solid var(--color-border);
  border-radius: 6px;
}

.specialty-name {
  font-size: 1.15rem;
  font-weight: 600;
  color: var(--color-primary-text);
}

.info-secondary {
  font-size: 0.95rem;
  color: var(--color-secondary-text);
}

.info-badge {
  display: inline-block;
  padding: 0.25rem 0.6rem;
  border-radius: 4px;
  font-size: 1rem;
  font-weight: 600;
  color: white;
}

.info-badge.specialty {
  background-color: var(--color-accent);
}

.info-tile {
  display: flex;
  flex-direction: column;
  padding: 0.75rem;
  background-color: var(--color-secondary-background);
  border-radius: 6px;
  height: 100%;
}

.info-label {
  font-size: 0.9rem;
  color: var(--color-secondary-text);
  margin-bottom: 0.25rem;
}

.info-value {
  font-size: 1.4rem;
  font-weight: 600;
  color: var(--color-primary-text);
}

/* Уменьшаем размер для мобильных устройств */
@media (max-width: 768px) {
  .info-value {
    font-size: 1.25rem;
  }

  .specialty-name {
    font-size: 1.1rem;
  }
}
</style>
