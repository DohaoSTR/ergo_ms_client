<template>
  <div class="batch-analysis">
    <div class="row">
      <div class="col-lg-10 mx-auto">
        <div class="card">
          <div class="card-header">
            <h5 class="mb-0">
              <i class="fas fa-layer-group me-2"></i>
              Пакетный анализ пористости
            </h5>
          </div>
          <div class="card-body">
            <form @submit.prevent="submitForm" enctype="multipart/form-data">
              <!-- Базовое название -->
              <div class="mb-3">
                <label for="baseTitle" class="form-label">
                  Базовое название анализов <span class="text-danger">*</span>
                </label>
                <input
                  type="text"
                  class="form-control"
                  id="baseTitle"
                  v-model="form.base_title"
                  :class="{ 'is-invalid': errors.base_title }"
                  placeholder="Например: Анализ образца"
                  required
                >
                <div class="form-text">
                  К каждому анализу будет добавлен номер (например: "Анализ образца #01", "Анализ образца #02")
                </div>
                <div v-if="errors.base_title" class="invalid-feedback">
                  {{ errors.base_title }}
                </div>
              </div>

              <!-- Описание -->
              <div class="mb-3">
                <label for="batchDescription" class="form-label">Описание</label>
                <textarea
                  class="form-control"
                  id="batchDescription"
                  v-model="form.description"
                  :class="{ 'is-invalid': errors.description }"
                  rows="2"
                  placeholder="Общее описание для всех анализов (необязательно)"
                ></textarea>
                <div v-if="errors.description" class="invalid-feedback">
                  {{ errors.description }}
                </div>
              </div>

              <!-- Загрузка изображений -->
              <div class="mb-3">
                <label for="batchImages" class="form-label">
                  Изображения микроскопии <span class="text-danger">*</span>
                </label>
                <div class="input-group">
                  <input
                    type="file"
                    class="form-control"
                    id="batchImages"
                    ref="imagesInput"
                    @change="handleImagesChange"
                    :class="{ 'is-invalid': errors.images }"
                    accept=".jpg,.jpeg,.png,.bmp,.tiff,.tif"
                    multiple
                    required
                  >
                  <button
                    type="button"
                    class="btn btn-outline-secondary"
                    @click="clearImages"
                    v-if="selectedFiles.length > 0"
                  >
                    <i class="fas fa-times"></i>
                  </button>
                </div>
                <div class="form-text">
                  Выберите несколько файлов (максимум 20). Поддерживаются: JPEG, PNG, BMP, TIFF. Максимальный размер каждого файла: 10 МБ
                </div>
                <div v-if="errors.images" class="invalid-feedback d-block">
                  {{ errors.images }}
                </div>
                
                <!-- Список выбранных файлов -->
                <div v-if="selectedFiles.length > 0" class="mt-3">
                  <div class="card">
                    <div class="card-header">
                      <h6 class="mb-0">
                        <i class="fas fa-images me-2"></i>
                        Выбранные файлы ({{ selectedFiles.length }})
                      </h6>
                    </div>
                    <div class="card-body">
                      <div class="row">
                        <div
                          v-for="(file, index) in selectedFiles"
                          :key="index"
                          class="col-lg-3 col-md-4 col-sm-6 mb-3"
                        >
                          <div class="card file-preview-card">
                            <div class="file-preview-wrapper">
                              <img
                                v-if="filePreviews[index]"
                                :src="filePreviews[index]"
                                :alt="file.name"
                                class="file-preview-image"
                              >
                              <div v-else class="file-preview-placeholder">
                                <i class="fas fa-image fa-2x text-muted"></i>
                              </div>
                            </div>
                            <div class="card-body p-2">
                              <h6 class="card-title small mb-1">{{ file.name }}</h6>
                              <small class="text-muted">{{ formatFileSize(file.size) }}</small>
                              <button
                                type="button"
                                class="btn btn-sm btn-outline-danger mt-1"
                                @click="removeFile(index)"
                              >
                                <i class="fas fa-times"></i>
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <!-- Значение шкалы -->
              <div class="mb-4">
                <label for="batchScaleValue" class="form-label">
                  Значение шкалы <span class="text-danger">*</span>
                </label>
                <div class="input-group">
                  <input
                    type="number"
                    class="form-control"
                    id="batchScaleValue"
                    v-model.number="form.scale_value"
                    :class="{ 'is-invalid': errors.scale_value }"
                    placeholder="100"
                    min="0.1"
                    max="10000"
                    step="0.1"
                    required
                  >
                  <span class="input-group-text">мкм</span>
                </div>
                <div class="form-text">
                  Общее значение масштабной линейки в микрометрах для всех анализов (от 0.1 до 10000)
                </div>
                <div v-if="errors.scale_value" class="invalid-feedback d-block">
                  {{ errors.scale_value }}
                </div>
              </div>

              <!-- Кнопки управления -->
              <div class="d-flex justify-content-between">
                <button
                  type="button"
                  class="btn btn-secondary"
                  @click="resetForm"
                  :disabled="loading"
                >
                  <i class="fas fa-undo me-2"></i>
                  Сбросить
                </button>
                
                <button
                  type="submit"
                  class="btn btn-primary"
                  :disabled="loading || !isFormValid"
                >
                  <i v-if="loading" class="fas fa-spinner fa-spin me-2"></i>
                  <i v-else class="fas fa-play me-2"></i>
                  {{ loading ? 'Создание...' : `Создать ${selectedFiles.length} анализов` }}
                </button>
              </div>
            </form>
          </div>
        </div>

        <!-- Информационная панель -->
        <div class="alert alert-info mt-4">
          <h6 class="alert-heading">
            <i class="fas fa-info-circle me-2"></i>
            Пакетный анализ
          </h6>
          <p class="mb-2">
            Загрузите несколько изображений микроскопии для одновременного анализа. 
            Каждое изображение будет обработано отдельно с одинаковыми параметрами:
          </p>
          <ul class="mb-0">
            <li>Все изображения будут проанализированы с одинаковым значением шкалы</li>
            <li>Каждый анализ получит уникальное название с номером</li>
            <li>Обработка происходит в фоновом режиме</li>
            <li>Максимум 20 файлов за один раз</li>
            <li>Максимальный размер каждого файла: 10 МБ</li>
          </ul>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { porosityAnalysisApi } from '../../../js/api/porosityAnalysisApi.js'

export default {
  name: 'BatchAnalysis',
  emits: ['analyses-created'],
  data() {
    return {
      loading: false,
      selectedFiles: [],
      filePreviews: {},
      form: {
        base_title: '',
        description: '',
        scale_value: 100
      },
      errors: {}
    }
  },
  computed: {
    isFormValid() {
      return this.form.base_title.trim() && 
             this.selectedFiles.length > 0 && 
             this.form.scale_value > 0 && 
             this.form.scale_value <= 10000
    }
  },
  methods: {
    handleImagesChange(event) {
      const files = event.target.files
      if (!files || files.length === 0) {
        this.clearImages()
        return
      }

      // Валидация файлов
      const validation = porosityAnalysisApi.validateImageFiles(files)
      if (!validation.valid) {
        this.errors.images = validation.errors.join(', ')
        this.clearImages()
        return
      }

      this.selectedFiles = Array.from(files)
      this.errors.images = ''

      // Создаем предварительные просмотры
      this.createFilePreviews()
    },

    createFilePreviews() {
      this.filePreviews = {}
      
      this.selectedFiles.forEach((file, index) => {
        const reader = new FileReader()
        reader.onload = (e) => {
          this.$set(this.filePreviews, index, e.target.result)
        }
        reader.readAsDataURL(file)
      })
    },

    removeFile(index) {
      this.selectedFiles.splice(index, 1)
      this.$delete(this.filePreviews, index)
      
      // Обновляем input
      const dt = new DataTransfer()
      this.selectedFiles.forEach(file => dt.items.add(file))
      this.$refs.imagesInput.files = dt.files
    },

    clearImages() {
      this.selectedFiles = []
      this.filePreviews = {}
      this.errors.images = ''
      if (this.$refs.imagesInput) {
        this.$refs.imagesInput.value = ''
      }
    },

    formatFileSize(bytes) {
      return porosityAnalysisApi.formatFileSize(bytes)
    },

    validateForm() {
      this.errors = {}

      if (!this.form.base_title.trim()) {
        this.errors.base_title = 'Базовое название обязательно'
      }

      if (this.selectedFiles.length === 0) {
        this.errors.images = 'Выберите хотя бы один файл'
      }

      if (!this.form.scale_value || this.form.scale_value <= 0) {
        this.errors.scale_value = 'Значение шкалы должно быть положительным числом'
      } else if (this.form.scale_value > 10000) {
        this.errors.scale_value = 'Значение шкалы не должно превышать 10000 мкм'
      }

      return Object.keys(this.errors).length === 0
    },

    async submitForm() {
      if (!this.validateForm()) {
        return
      }

      this.loading = true
      
      try {
        // Подготавливаем FormData
        const formData = porosityAnalysisApi.prepareBatchFormData(
          this.selectedFiles,
          this.form.base_title,
          this.form.scale_value,
          this.form.description
        )

        // Отправляем запрос
        const response = await porosityAnalysisApi.createBatchAnalysis(formData)
        
        if (response && response.success && response.data && response.data.analyses) {
          // Уведомляем родительский компонент
          this.$emit('analyses-created', response.data.analyses)
          
          // Сбрасываем форму
          this.resetForm()
          
          // Показываем сообщение об успехе
          this.$toast.success('Пакетный анализ создан и запущен в обработку')
        } else {
          // Обрабатываем ошибки валидации
          if (response && response.errors) {
            this.errors = response.errors
          } else {
            this.$toast.error((response && response.message) || 'Ошибка создания пакетного анализа')
          }
        }
        
      } catch (error) {
        console.error('Ошибка создания пакетного анализа:', error)
        
        // Обрабатываем ошибки валидации
        if (error && error.response && error.response.data && error.response.data.errors) {
          this.errors = error.response.data.errors
        } else if (error && error.response && error.response.data && error.response.data.message) {
          this.$toast.error(error.response.data.message)
        } else if (error && error.message) {
          this.$toast.error(error.message)
        } else {
          this.$toast.error('Ошибка создания пакетного анализа')
        }
      } finally {
        this.loading = false
      }
    },

    resetForm() {
      this.form = {
        base_title: '',
        description: '',
        scale_value: 100
      }
      this.clearImages()
      this.errors = {}
    }
  }
}
</script>

<style scoped>
.batch-analysis {
  max-width: 100%;
}

.card {
  border: none;
  box-shadow: 0 0.125rem 0.25rem rgba(0, 0, 0, 0.075);
}

.card-header {
  background-color: #f8f9fa;
  border-bottom: 1px solid #dee2e6;
}

.form-label {
  font-weight: 500;
}

.input-group-text {
  background-color: #e9ecef;
  border-color: #ced4da;
}

.alert-info {
  background-color: #e7f3ff;
  border-color: #b8daff;
  color: #004085;
}

.file-preview-card {
  border: 1px solid #dee2e6;
  transition: transform 0.2s ease-in-out;
}

.file-preview-card:hover {
  transform: translateY(-2px);
}

.file-preview-wrapper {
  position: relative;
  height: 120px;
  overflow: hidden;
  background-color: #f8f9fa;
}

.file-preview-image {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.file-preview-placeholder {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: #e9ecef;
}

.card-title {
  font-size: 0.875rem;
  line-height: 1.2;
  word-break: break-word;
}
</style> 