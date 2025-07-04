<template>
  <div class="create-analysis">
    <div class="row">
      <div class="col-lg-8 mx-auto">
        <div class="card">
          <div class="card-header">
            <h5 class="mb-0">
              <i class="fas fa-plus-circle me-2"></i>
              Создать новый анализ пористости
            </h5>
          </div>
          <div class="card-body">
            <form @submit.prevent="submitForm" enctype="multipart/form-data">
              <!-- Название анализа -->
              <div class="mb-3">
                <label for="title" class="form-label">
                  Название анализа <span class="text-danger">*</span>
                </label>
                <input
                  type="text"
                  class="form-control"
                  id="title"
                  v-model="form.title"
                  :class="{ 'is-invalid': errors.title }"
                  placeholder="Введите название анализа"
                  required
                >
                <div v-if="errors.title" class="invalid-feedback">
                  {{ errors.title }}
                </div>
              </div>

              <!-- Описание -->
              <div class="mb-3">
                <label for="description" class="form-label">Описание</label>
                <textarea
                  class="form-control"
                  id="description"
                  v-model="form.description"
                  :class="{ 'is-invalid': errors.description }"
                  rows="3"
                  placeholder="Опишите детали анализа (необязательно)"
                ></textarea>
                <div v-if="errors.description" class="invalid-feedback">
                  {{ errors.description }}
                </div>
              </div>

              <!-- Загрузка изображения -->
              <div class="mb-3">
                <label for="image" class="form-label">
                  Изображение микроскопии <span class="text-danger">*</span>
                </label>
                <div class="input-group">
                  <input
                    type="file"
                    class="form-control"
                    id="image"
                    ref="imageInput"
                    @change="handleImageChange"
                    :class="{ 'is-invalid': errors.original_image }"
                    accept=".jpg,.jpeg,.png,.bmp,.tiff,.tif"
                    required
                  >
                  <button
                    type="button"
                    class="btn btn-outline-secondary"
                    @click="clearImage"
                    v-if="selectedImage"
                  >
                    <i class="fas fa-times"></i>
                  </button>
                </div>
                <div class="form-text">
                  Поддерживаются форматы: JPEG, PNG, BMP, TIFF. Максимальный размер: 10 МБ
                </div>
                <div v-if="errors.original_image" class="invalid-feedback d-block">
                  {{ errors.original_image }}
                </div>
                
                <!-- Предварительный просмотр изображения -->
                <div v-if="imagePreview" class="mt-3">
                  <div class="card">
                    <div class="card-body text-center">
                      <h6 class="card-title">Предварительный просмотр</h6>
                      <img
                        :src="imagePreview"
                        alt="Предварительный просмотр"
                        class="img-fluid rounded"
                        style="max-height: 300px;"
                      >
                      <div class="mt-2 text-muted">
                        <small>
                          {{ selectedImage.name }} 
                          ({{ formatFileSize(selectedImage.size) }})
                        </small>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <!-- Значение шкалы -->
              <div class="mb-4">
                <label for="scaleValue" class="form-label">
                  Значение шкалы <span class="text-danger">*</span>
                </label>
                <div class="input-group">
                  <input
                    type="number"
                    class="form-control"
                    id="scaleValue"
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
                  Укажите значение масштабной линейки в микрометрах (от 0.1 до 10000)
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
                  {{ loading ? 'Создание...' : 'Создать и запустить анализ' }}
                </button>
              </div>
            </form>
          </div>
        </div>

        <!-- Информационная панель -->
        <div class="alert alert-info mt-4">
          <h6 class="alert-heading">
            <i class="fas fa-info-circle me-2"></i>
            Информация об анализе
          </h6>
          <p class="mb-2">
            Анализ пористости автоматически определяет масштабную линейку на изображении 
            и вычисляет следующие параметры:
          </p>
          <ul class="mb-0">
            <li>Общая пористость поверхности (%)</li>
            <li>Количество и размеры пор</li>
            <li>Распределение пор по размерам</li>
            <li>Межпоровые расстояния</li>
            <li>Ориентация и форма пор</li>
            <li>Статистические характеристики</li>
          </ul>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { porosityAnalysisApi } from '../../../js/api/porosityAnalysisApi.js'

export default {
  name: 'CreateAnalysis',
  emits: ['analysis-created'],
  data() {
    return {
      loading: false,
      selectedImage: null,
      imagePreview: null,
      form: {
        title: '',
        description: '',
        scale_value: 100
      },
      errors: {}
    }
  },
  computed: {
    isFormValid() {
      return this.form.title.trim() && 
             this.selectedImage && 
             this.form.scale_value > 0 && 
             this.form.scale_value <= 10000
    }
  },
  methods: {
    handleImageChange(event) {
      const file = event.target.files[0]
      if (!file) {
        this.clearImage()
        return
      }

      // Валидация файла
      const validation = porosityAnalysisApi.validateImageFile(file)
      if (!validation.valid) {
        this.errors.original_image = validation.errors.join(', ')
        this.clearImage()
        return
      }

      this.selectedImage = file
      this.errors.original_image = ''

      // Создаем предварительный просмотр
      const reader = new FileReader()
      reader.onload = (e) => {
        this.imagePreview = e.target.result
      }
      reader.readAsDataURL(file)
    },

    clearImage() {
      this.selectedImage = null
      this.imagePreview = null
      this.errors.original_image = ''
      if (this.$refs.imageInput) {
        this.$refs.imageInput.value = ''
      }
    },

    formatFileSize(bytes) {
      return porosityAnalysisApi.formatFileSize(bytes)
    },

    validateForm() {
      this.errors = {}

      if (!this.form.title.trim()) {
        this.errors.title = 'Название анализа обязательно'
      }

      if (!this.selectedImage) {
        this.errors.original_image = 'Изображение обязательно'
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
        // Создаем FormData для отправки файла
        const formData = new FormData()
        formData.append('title', this.form.title)
        formData.append('description', this.form.description)
        formData.append('original_image', this.selectedImage)
        formData.append('scale_value', this.form.scale_value)

        // Отправляем запрос
        const response = await porosityAnalysisApi.createAnalysis(formData)
        
        if (response && response.success && response.data) {
          // Уведомляем родительский компонент
          this.$emit('analysis-created', response.data)
          
          // Сбрасываем форму
          this.resetForm()
          
          // Показываем сообщение об успехе
          this.$toast.success('Анализ создан и запущен в обработку')
        } else {
          // Обрабатываем ошибки валидации
          if (response && response.errors) {
            this.errors = response.errors
          } else {
            this.$toast.error((response && response.message) || 'Ошибка создания анализа')
          }
        }
        
      } catch (error) {
        console.error('Ошибка создания анализа:', error)
        
        // Обрабатываем ошибки валидации
        if (error && error.response && error.response.data && error.response.data.errors) {
          this.errors = error.response.data.errors
        } else if (error && error.response && error.response.data && error.response.data.message) {
          this.$toast.error(error.response.data.message)
        } else if (error && error.message) {
          this.$toast.error(error.message)
        } else {
          this.$toast.error('Ошибка создания анализа')
        }
      } finally {
        this.loading = false
      }
    },

    resetForm() {
      this.form = {
        title: '',
        description: '',
        scale_value: 100
      }
      this.clearImage()
      this.errors = {}
    }
  }
}
</script>

<style scoped>
.create-analysis {
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

.img-fluid {
  border: 1px solid #dee2e6;
}
</style> 