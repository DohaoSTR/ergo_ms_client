<template>
  <div class="import-program">
    <!-- Красивый градиентный заголовок -->
    <div class="hero-section">
      <div class="container-fluid">
        <div class="row">
          <div class="col-12">
            <div class="hero-content">
              <div class="hero-text">
                <h1 class="hero-title">
                  <i class="fas fa-upload mr-3"></i>
                  Импорт программы развития
                </h1>
                <p class="hero-subtitle">Загрузите CSV файл с темами программы развития для создания проектов</p>
              </div>
              <div class="hero-icon">
                <div class="upload-icon">
                  <i class="fas fa-file-csv"></i>
                </div>
              </div>
            </div>
            
            <nav aria-label="breadcrumb" class="hero-breadcrumb">
              <ol class="breadcrumb">
                <li class="breadcrumb-item"><router-link to="/">Главная</router-link></li>
                <li class="breadcrumb-item"><router-link to="/crm">CRM</router-link></li>
                <li class="breadcrumb-item">
                  <router-link to="/crm/strategic-projects">Стратегические проекты</router-link>
                </li>
                <li class="breadcrumb-item active">Импорт программы</li>
              </ol>
            </nav>
          </div>
        </div>
      </div>
    </div>

    <div class="container-fluid">

      <div class="row">
        <div class="col-lg-8">
          <!-- Красивая форма импорта -->
          <div class="import-card mb-4">
            <div class="card-header">
              <h5 class="card-title">
                <i class="fas fa-file-upload mr-2"></i>
                Загрузка файла программы развития
              </h5>
            </div>
            <div class="card-body">
              <form @submit.prevent="importProgram" class="import-form">
                <div class="form-section">
                  <div class="form-group">
                    <label class="form-label">
                      <i class="fas fa-tag mr-2"></i>
                      Название программы
                      <span class="required">*</span>
                    </label>
                    <input
                      v-model="form.name"
                      type="text"
                      class="form-control modern-input"
                      placeholder="Например: Программа развития на 2025 год"
                      required
                    />
                  </div>

                  <div class="form-group">
                    <label class="form-label">
                      <i class="fas fa-calendar-alt mr-2"></i>
                      Год программы
                      <span class="required">*</span>
                    </label>
                    <input
                      v-model="form.year"
                      type="number"
                      class="form-control modern-input"
                      :min="new Date().getFullYear()"
                      :max="new Date().getFullYear() + 10"
                      required
                    />
                  </div>
                </div>

                <div class="form-section">
                  <label class="form-label">
                    <i class="fas fa-file-csv mr-2"></i>
                    CSV файл
                    <span class="required">*</span>
                  </label>
                  <div class="file-upload-area" :class="{ 'has-file': form.file, 'drag-over': isDragOver }"
                       @dragover.prevent="isDragOver = true"
                       @dragleave.prevent="isDragOver = false"
                       @drop.prevent="handleFileDrop">
                    <input
                      type="file"
                      class="file-input"
                      id="csvFile"
                      accept=".csv"
                      @change="handleFileSelect"
                      required
                    />
                    <div class="file-upload-content">
                      <div v-if="!form.file" class="upload-placeholder">
                        <i class="fas fa-cloud-upload-alt upload-icon"></i>
                        <p class="upload-text">Перетащите CSV файл сюда или нажмите для выбора</p>
                        <p class="upload-hint">Максимальный размер файла: 10MB</p>
                      </div>
                      <div v-else class="file-selected">
                        <i class="fas fa-file-csv file-icon"></i>
                        <div class="file-info">
                          <p class="file-name">{{ form.file.name }}</p>
                          <p class="file-size">{{ formatFileSize(form.file.size) }}</p>
                        </div>
                        <button type="button" class="btn-remove-file" @click="removeFile">
                          <i class="fas fa-times"></i>
                        </button>
                      </div>
                    </div>
                  </div>
                  <small class="form-hint">
                    <i class="fas fa-info-circle mr-1"></i>
                    Файл должен быть в формате CSV с кодировкой UTF-8
                  </small>
                </div>

                <div v-if="error" class="alert-card alert-error">
                  <i class="fas fa-exclamation-circle mr-2"></i>
                  {{ error }}
                </div>

                <div v-if="success" class="alert-card alert-success">
                  <i class="fas fa-check-circle mr-2"></i>
                  {{ success }}
                </div>

                <div class="form-actions">
                  <button
                    type="submit"
                    class="btn btn-import"
                    :disabled="importing || !form.file"
                  >
                    <span v-if="importing" class="spinner-border spinner-border-sm mr-2"></span>
                    <i v-else class="fas fa-upload mr-2"></i>
                    <span>{{ importing ? 'Импортируем...' : 'Импортировать' }}</span>
                  </button>
                  <router-link to="/crm/strategic-projects" class="btn btn-cancel">
                    <i class="fas fa-times mr-2"></i>
                    Отмена
                  </router-link>
                </div>
              </form>
            </div>
          </div>

          <!-- История загрузок -->
          <div class="history-card">
            <div class="card-header">
              <h5 class="card-title">
                <i class="fas fa-history mr-2"></i>
                Последние загруженные программы
              </h5>
            </div>
            <div class="card-body">
              <div v-if="loadingPrograms" class="loading-state">
                <div class="spinner-wrapper">
                  <div class="spinner-border" role="status">
                    <span class="sr-only">Загрузка...</span>
                  </div>
                  <p class="loading-text">Загружаем историю...</p>
                </div>
              </div>

              <div v-else-if="programs.length === 0" class="empty-state">
                <div class="empty-icon">
                  <i class="fas fa-folder-open"></i>
                </div>
                <p class="empty-text">Программы развития еще не загружались</p>
              </div>

              <div v-else class="programs-list">
                <div v-for="program in programs" :key="program.id" class="program-item">
                  <div class="program-info">
                    <h6 class="program-name">{{ program.name }}</h6>
                    <div class="program-meta">
                      <div class="meta-item">
                        <i class="fas fa-calendar-alt mr-1"></i>
                        {{ program.year }}
                      </div>
                      <div class="meta-item">
                        <i class="fas fa-list mr-1"></i>
                        {{ program.topics_count }} тем
                      </div>
                      <div class="meta-item">
                        <i class="fas fa-clock mr-1"></i>
                        {{ formatDate(program.created_at) }}
                      </div>
                    </div>
                  </div>
                  <div class="program-badge">
                    <span class="topics-count">{{ program.topics_count }}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div class="col-lg-4">
          <!-- Красивая инструкция -->
          <div class="instruction-card">
            <div class="card-header">
              <h5 class="card-title">
                <i class="fas fa-book mr-2"></i>
                Инструкция по импорту
              </h5>
            </div>
            <div class="card-body">
              <div class="instruction-section">
                <h6 class="section-title">
                  <i class="fas fa-table mr-2"></i>
                  Формат CSV файла
                </h6>
                <p class="section-description">Файл должен содержать следующие колонки:</p>
                <div class="columns-list">
                  <div class="column-item">
                    <code class="column-code">direction_code</code>
                    <span class="column-description">Код направления</span>
                  </div>
                  <div class="column-item">
                    <code class="column-code">topic_number</code>
                    <span class="column-description">Номер темы</span>
                  </div>
                  <div class="column-item">
                    <code class="column-code">name</code>
                    <span class="column-description">Наименование темы</span>
                  </div>
                  <div class="column-item">
                    <code class="column-code">description</code>
                    <span class="column-description">Описание (опционально)</span>
                  </div>
                  <div class="column-item">
                    <code class="column-code">start_date</code>
                    <span class="column-description">Дата начала (YYYY-MM-DD)</span>
                  </div>
                  <div class="column-item">
                    <code class="column-code">end_date</code>
                    <span class="column-description">Дата окончания (YYYY-MM-DD)</span>
                  </div>
                  <div class="column-item">
                    <code class="column-code">expected_results</code>
                    <span class="column-description">Ожидаемые результаты (через точку с запятой)</span>
                  </div>
                </div>
              </div>

              <div class="instruction-section">
                <h6 class="section-title">
                  <i class="fas fa-code mr-2"></i>
                  Пример содержимого
                </h6>
                <div class="code-example">
                  <div class="code-header">
                    <i class="fas fa-file-csv mr-1"></i>
                    example.csv
                  </div>
                  <pre class="code-content">direction_code,topic_number,name,description,start_date,end_date,expected_results
IT,001,Разработка системы учета,Создание системы для учета ресурсов,2025-01-01,2025-12-31,Система учета;Документация;Обучение
IT,002,Модернизация инфраструктуры,Обновление серверной инфраструктуры,2025-02-01,2025-10-31,Новые сервера;Миграция данных</pre>
                </div>
              </div>

              <div class="warning-section">
                <div class="warning-icon">
                  <i class="fas fa-exclamation-triangle"></i>
                </div>
                <div class="warning-content">
                  <strong>Важно!</strong><br>
                  При импорте новой программы все существующие свободные темы будут обновлены.
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { format } from 'date-fns'
import { ru } from 'date-fns/locale'
import { apiClient } from '@/js/api/manager'

export default {
  name: 'ImportProgram',
  
  setup() {
    const router = useRouter()
    
    const form = ref({
      name: '',
      year: new Date().getFullYear(),
      file: null
    })
    
    const programs = ref([])
    const loadingPrograms = ref(false)
    const importing = ref(false)
    const error = ref('')
    const success = ref('')
    const isDragOver = ref(false)
    
    // Загрузка списка программ
    const loadPrograms = async () => {
      loadingPrograms.value = true
      try {
        const response = await apiClient.get('/crm/strategic-projects/development-programs/')
        programs.value = response.data
      } catch (error) {
        console.error('Ошибка загрузки программ:', error)
      } finally {
        loadingPrograms.value = false
      }
    }
    
    // Обработка выбора файла
    const handleFileSelect = (event) => {
      const file = event.target.files[0]
      if (file && file.type === 'text/csv') {
        form.value.file = file
        error.value = ''
      } else {
        form.value.file = null
        error.value = 'Пожалуйста, выберите файл в формате CSV'
      }
    }

    // Обработка drag & drop
    const handleFileDrop = (event) => {
      isDragOver.value = false
      const files = event.dataTransfer.files
      if (files.length > 0) {
        const file = files[0]
        if (file.type === 'text/csv') {
          form.value.file = file
          error.value = ''
          
          // Обновляем input элемент
          const fileInput = document.getElementById('csvFile')
          const dataTransfer = new DataTransfer()
          dataTransfer.items.add(file)
          fileInput.files = dataTransfer.files
        } else {
          error.value = 'Пожалуйста, выберите файл в формате CSV'
        }
      }
    }

    // Удаление файла
    const removeFile = () => {
      form.value.file = null
      const fileInput = document.getElementById('csvFile')
      fileInput.value = ''
      error.value = ''
    }

    // Форматирование размера файла
    const formatFileSize = (bytes) => {
      if (bytes === 0) return '0 Bytes'
      const k = 1024
      const sizes = ['Bytes', 'KB', 'MB', 'GB']
      const i = Math.floor(Math.log(bytes) / Math.log(k))
      return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
    }
    
    // Импорт программы
    const importProgram = async () => {
      if (!form.value.file) {
        error.value = 'Пожалуйста, выберите файл для импорта'
        return
      }
      
      importing.value = true
      error.value = ''
      success.value = ''
      
      const formData = new FormData()
      formData.append('file', form.value.file)
      formData.append('name', form.value.name)
      formData.append('year', form.value.year)
      
      try {
        const response = await apiClient.post(
          '/crm/strategic-projects/development-programs/import_program/',
          formData
        )
        
        success.value = response.data.message
        
        // Очистка формы
        form.value = {
          name: '',
          year: new Date().getFullYear(),
          file: null
        }
        
        // Обновление файлового input
        document.getElementById('csvFile').value = ''
        
        // Обновление списка программ
        loadPrograms()
        
        // Перенаправление через 2 секунды
        setTimeout(() => {
          router.push('/crm/strategic-projects/program-topics')
        }, 2000)
        
      } catch (error) {
        console.error('Ошибка импорта:', error)
        error.value = error.response?.data?.error || 'Ошибка при импорте программы'
      } finally {
        importing.value = false
      }
    }
    
    // Форматирование даты
    const formatDate = (dateString) => {
      if (!dateString) return '-'
      return format(new Date(dateString), 'dd.MM.yyyy HH:mm', { locale: ru })
    }
    
    // Загрузка данных при монтировании
    onMounted(() => {
      loadPrograms()
    })
    
    return {
      form,
      programs,
      loadingPrograms,
      importing,
      error,
      success,
      isDragOver,
      handleFileSelect,
      handleFileDrop,
      removeFile,
      formatFileSize,
      importProgram,
      formatDate
    }
  }
}
</script>

<style scoped>
/* Основные стили */
.import-program {
  min-height: 100vh;
  background: linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%);
}

/* Герой секция */
.hero-section {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  padding: 3rem 0 2rem;
  margin-bottom: 2rem;
  position: relative;
  overflow: hidden;
}

.hero-section::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: url('data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><defs><pattern id="grain" width="100" height="100" patternUnits="userSpaceOnUse"><circle cx="25" cy="25" r="1" fill="rgba(255,255,255,0.1)"/><circle cx="75" cy="75" r="1" fill="rgba(255,255,255,0.1)"/><circle cx="50" cy="10" r="0.5" fill="rgba(255,255,255,0.1)"/></pattern></defs><rect width="100" height="100" fill="url(%23grain)"/></svg>');
  opacity: 0.1;
}

.hero-content {
  display: flex;
  justify-content: space-between;
  align-items: center;
  position: relative;
  z-index: 2;
}

.hero-title {
  font-size: 2.5rem;
  font-weight: 700;
  margin: 0;
  display: flex;
  align-items: center;
  text-shadow: 0 2px 4px rgba(0,0,0,0.1);
}

.hero-subtitle {
  font-size: 1.1rem;
  opacity: 0.9;
  margin: 0.5rem 0 0;
}

.hero-icon {
  display: flex;
  align-items: center;
}

.upload-icon {
  width: 80px;
  height: 80px;
  background: rgba(255,255,255,0.1);
  border-radius: 20px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 2rem;
  backdrop-filter: blur(10px);
  border: 1px solid rgba(255,255,255,0.2);
}

.hero-breadcrumb {
  margin-top: 2rem;
}

.hero-breadcrumb .breadcrumb {
  background: rgba(255,255,255,0.1);
  border-radius: 8px;
  padding: 0.75rem 1rem;
  backdrop-filter: blur(10px);
}

.hero-breadcrumb .breadcrumb-item a {
  color: rgba(255,255,255,0.8);
  text-decoration: none;
}

.hero-breadcrumb .breadcrumb-item a:hover {
  color: white;
}

.hero-breadcrumb .breadcrumb-item.active {
  color: rgba(255,255,255,0.9);
}

/* Карточки */
.import-card,
.history-card,
.instruction-card {
  background: white;
  border-radius: 16px;
  box-shadow: 0 8px 32px rgba(0,0,0,0.1);
  overflow: hidden;
  border: none;
}

.card-header {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  padding: 1.5rem;
}

.card-title {
  margin: 0;
  font-size: 1.1rem;
  font-weight: 600;
  display: flex;
  align-items: center;
}

.card-body {
  padding: 2rem;
}

/* Форма импорта */
.import-form {
  display: flex;
  flex-direction: column;
  gap: 2rem;
}

.form-section {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.form-group {
  display: flex;
  flex-direction: column;
}

.form-label {
  font-weight: 600;
  color: #374151;
  margin-bottom: 0.75rem;
  display: flex;
  align-items: center;
  font-size: 0.95rem;
}

.required {
  color: #ef4444;
  margin-left: 0.25rem;
}

.modern-input {
  border: 2px solid #e5e7eb;
  border-radius: 8px;
  padding: 0.75rem 1rem;
  font-size: 0.95rem;
  transition: all 0.3s ease;
  background: white;
}

.modern-input:focus {
  border-color: #667eea;
  box-shadow: 0 0 0 3px rgba(102,126,234,0.1);
  outline: none;
}

/* Область загрузки файла */
.file-upload-area {
  border: 2px dashed #d1d5db;
  border-radius: 12px;
  padding: 2rem;
  text-align: center;
  transition: all 0.3s ease;
  cursor: pointer;
  position: relative;
  background: #f9fafb;
}

.file-upload-area:hover {
  border-color: #667eea;
  background: #f0f9ff;
}

.file-upload-area.drag-over {
  border-color: #667eea;
  background: linear-gradient(135deg, #f0f9ff, #e0f2fe);
  transform: scale(1.02);
}

.file-upload-area.has-file {
  border-color: #10b981;
  background: linear-gradient(135deg, #f0fdf4, #ecfdf5);
}

.file-input {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  opacity: 0;
  cursor: pointer;
}

.file-upload-content {
  pointer-events: none;
}

.upload-placeholder {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 1rem;
}

.upload-icon {
  font-size: 3rem;
  color: #9ca3af;
  margin-bottom: 0.5rem;
}

.upload-text {
  font-size: 1.1rem;
  font-weight: 500;
  color: #374151;
  margin: 0;
}

.upload-hint {
  font-size: 0.875rem;
  color: #6b7280;
  margin: 0;
}

.file-selected {
  display: flex;
  align-items: center;
  gap: 1rem;
  background: white;
  border-radius: 8px;
  padding: 1rem;
  box-shadow: 0 2px 8px rgba(0,0,0,0.1);
}

.file-icon {
  font-size: 2rem;
  color: #10b981;
  flex-shrink: 0;
}

.file-info {
  flex: 1;
  text-align: left;
}

.file-name {
  font-weight: 600;
  color: #374151;
  margin: 0 0 0.25rem;
}

.file-size {
  font-size: 0.875rem;
  color: #6b7280;
  margin: 0;
}

.btn-remove-file {
  background: #fee2e2;
  border: 1px solid #fca5a5;
  border-radius: 6px;
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #dc2626;
  cursor: pointer;
  transition: all 0.3s ease;
  flex-shrink: 0;
}

.btn-remove-file:hover {
  background: #fecaca;
  border-color: #f87171;
}

.form-hint {
  color: #6b7280;
  font-size: 0.875rem;
  margin-top: 0.5rem;
  display: flex;
  align-items: center;
}

/* Алерты */
.alert-card {
  border-radius: 8px;
  padding: 1rem;
  margin: 1rem 0;
  display: flex;
  align-items: center;
}

.alert-error {
  background: linear-gradient(135deg, #fef2f2, #fee2e2);
  border: 1px solid #fca5a5;
  color: #dc2626;
}

.alert-success {
  background: linear-gradient(135deg, #f0fdf4, #dcfce7);
  border: 1px solid #86efac;
  color: #059669;
}

/* Кнопки действий */
.form-actions {
  display: flex;
  gap: 1rem;
  justify-content: flex-start;
  flex-wrap: wrap;
}

.btn-import {
  background: linear-gradient(135deg, #10b981, #059669);
  border: none;
  border-radius: 8px;
  padding: 0.75rem 2rem;
  color: white;
  font-weight: 600;
  transition: all 0.3s ease;
  box-shadow: 0 4px 12px rgba(16,185,129,0.3);
  cursor: pointer;
  display: flex;
  align-items: center;
}

.btn-import:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 8px 20px rgba(16,185,129,0.4);
}

.btn-import:disabled {
  opacity: 0.6;
  cursor: not-allowed;
  transform: none;
}

.btn-cancel {
  background: #f3f4f6;
  border: 1px solid #d1d5db;
  border-radius: 8px;
  padding: 0.75rem 1.5rem;
  color: #374151;
  font-weight: 500;
  text-decoration: none;
  transition: all 0.3s ease;
  display: flex;
  align-items: center;
}

.btn-cancel:hover {
  background: #e5e7eb;
  border-color: #9ca3af;
  color: #374151;
  text-decoration: none;
}

/* История программ */
.loading-state {
  text-align: center;
  padding: 3rem 1rem;
}

.spinner-wrapper {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 1rem;
}

.spinner-border {
  width: 2.5rem;
  height: 2.5rem;
  color: #667eea;
}

.loading-text {
  color: #6b7280;
  margin: 0;
}

.empty-state {
  text-align: center;
  padding: 3rem 1rem;
}

.empty-icon {
  font-size: 3rem;
  color: #d1d5db;
  margin-bottom: 1rem;
}

.empty-text {
  color: #6b7280;
  margin: 0;
}

.programs-list {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.program-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 1rem;
  background: #f8fafc;
  border-radius: 8px;
  border: 1px solid #e2e8f0;
  transition: all 0.3s ease;
}

.program-item:hover {
  background: #f1f5f9;
  border-color: #cbd5e1;
}

.program-info {
  flex: 1;
}

.program-name {
  font-weight: 600;
  color: #1e293b;
  margin: 0 0 0.5rem;
  font-size: 1rem;
}

.program-meta {
  display: flex;
  flex-wrap: wrap;
  gap: 1rem;
}

.meta-item {
  display: flex;
  align-items: center;
  font-size: 0.875rem;
  color: #64748b;
}

.meta-item i {
  color: #667eea;
  margin-right: 0.25rem;
  width: 12px;
}

.program-badge {
  flex-shrink: 0;
}

.topics-count {
  background: linear-gradient(135deg, #667eea, #764ba2);
  color: white;
  padding: 0.5rem 0.75rem;
  border-radius: 12px;
  font-weight: 600;
  font-size: 0.875rem;
}

/* Инструкции */
.instruction-section {
  margin-bottom: 2rem;
}

.instruction-section:last-child {
  margin-bottom: 0;
}

.section-title {
  color: #374151;
  font-size: 1rem;
  font-weight: 600;
  margin-bottom: 0.75rem;
  display: flex;
  align-items: center;
}

.section-description {
  color: #6b7280;
  margin-bottom: 1rem;
  line-height: 1.5;
}

.columns-list {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.column-item {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.75rem;
  background: #f8fafc;
  border-radius: 6px;
  border: 1px solid #e2e8f0;
}

.column-code {
  background: #1e293b;
  color: #e2e8f0;
  padding: 0.25rem 0.5rem;
  border-radius: 4px;
  font-family: 'Monaco', 'Consolas', monospace;
  font-size: 0.8rem;
  font-weight: 600;
  min-width: 140px;
  text-align: center;
}

.column-description {
  color: #475569;
  font-size: 0.875rem;
  flex: 1;
}

.code-example {
  background: #f8fafc;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  overflow: hidden;
}

.code-header {
  background: #1e293b;
  color: #e2e8f0;
  padding: 0.75rem 1rem;
  font-size: 0.875rem;
  font-weight: 500;
  display: flex;
  align-items: center;
}

.code-content {
  background: #f1f5f9;
  color: #334155;
  padding: 1rem;
  margin: 0;
  font-family: 'Monaco', 'Consolas', monospace;
  font-size: 0.8rem;
  line-height: 1.4;
  overflow-x: auto;
  border: none;
}

.warning-section {
  background: linear-gradient(135deg, #fef3c7, #fde68a);
  border: 1px solid #f59e0b;
  border-radius: 8px;
  padding: 1rem;
  display: flex;
  align-items: flex-start;
  gap: 0.75rem;
  margin-top: 1.5rem;
}

.warning-icon {
  color: #d97706;
  font-size: 1.25rem;
  flex-shrink: 0;
  margin-top: 0.125rem;
}

.warning-content {
  color: #92400e;
  line-height: 1.4;
  flex: 1;
}

/* Адаптивность */
@media (max-width: 768px) {
  .hero-content {
    flex-direction: column;
    gap: 2rem;
    text-align: center;
  }

  .hero-title {
    font-size: 2rem;
  }

  .card-body {
    padding: 1.5rem;
  }

  .form-actions {
    flex-direction: column;
  }

  .btn-import,
  .btn-cancel {
    width: 100%;
    justify-content: center;
  }

  .program-meta {
    flex-direction: column;
    gap: 0.5rem;
  }

  .program-item {
    flex-direction: column;
    align-items: flex-start;
    gap: 1rem;
  }

  .column-item {
    flex-direction: column;
    align-items: flex-start;
    gap: 0.5rem;
  }

  .column-code {
    min-width: auto;
    text-align: left;
  }
}

@media (max-width: 576px) {
  .hero-section {
    padding: 2rem 0 1.5rem;
  }

  .hero-title {
    font-size: 1.75rem;
  }

  .upload-icon {
    width: 60px;
    height: 60px;
    font-size: 1.5rem;
  }

  .card-body {
    padding: 1rem;
  }

  .file-upload-area {
    padding: 1.5rem 1rem;
  }

  .upload-icon {
    font-size: 2rem;
  }

  .code-content {
    font-size: 0.7rem;
  }
}
</style> 