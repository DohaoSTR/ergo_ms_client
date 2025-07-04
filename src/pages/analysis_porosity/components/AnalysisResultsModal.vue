<template>
  <!-- Модальное окно результатов -->
  <div 
    class="modal fade"
    :class="{ show: show }"
    :style="{ display: show ? 'block' : 'none' }"
    tabindex="-1"
    @click="handleBackdropClick"
  >
    <div class="modal-dialog modal-xl modal-dialog-scrollable">
      <div class="modal-content">
        <!-- Заголовок -->
        <div class="modal-header">
          <h5 class="modal-title">
            <i class="fas fa-chart-line me-2"></i>
            Результаты анализа: {{ analysis.title }}
          </h5>
          <button
            type="button"
            class="btn-close"
            @click="$emit('hide')"
          ></button>
        </div>

        <!-- Содержимое -->
        <div class="modal-body">
          <!-- Информация об анализе -->
          <div class="row mb-4">
            <div class="col-md-4">
              <div class="card">
                <div class="card-body text-center">
                  <img
                    v-if="analysis.original_image_url"
                    :src="analysis.original_image_url"
                    :alt="analysis.title"
                    class="img-fluid rounded mb-2"
                    style="max-height: 200px;"
                  >
                  <h6>{{ analysis.title }}</h6>
                  <p v-if="analysis.description" class="text-muted small">
                    {{ analysis.description }}
                  </p>
                </div>
              </div>
            </div>
            <div class="col-md-8">
              <div class="card">
                <div class="card-header">
                  <h6 class="mb-0">Основные метрики</h6>
                </div>
                <div class="card-body">
                  <div v-if="analysis.result" class="row">
                    <!-- Пористость -->
                    <div class="col-md-6 mb-3">
                      <div class="metric-item">
                        <div class="metric-label">Пористость</div>
                        <div class="metric-value text-primary">
                          {{ analysis.result.porosity_percentage.toFixed(2) }}%
                        </div>
                      </div>
                    </div>
                    
                    <!-- Количество пор -->
                    <div class="col-md-6 mb-3">
                      <div class="metric-item">
                        <div class="metric-label">Количество пор</div>
                        <div class="metric-value text-info">
                          {{ analysis.result.number_of_pores }}
                        </div>
                      </div>
                    </div>
                    
                    <!-- Средний размер поры -->
                    <div class="col-md-6 mb-3">
                      <div class="metric-item">
                        <div class="metric-label">Средний размер поры</div>
                        <div class="metric-value text-success">
                          {{ analysis.result.mean_pore_size_microns.toFixed(2) }} мкм²
                        </div>
                      </div>
                    </div>
                    
                    <!-- Средний диаметр поры -->
                    <div class="col-md-6 mb-3">
                      <div class="metric-item">
                        <div class="metric-label">Средний диаметр поры</div>
                        <div class="metric-value text-warning">
                          {{ analysis.result.mean_pore_diameter_microns.toFixed(2) }} мкм
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  <div v-else class="text-center text-muted">
                    <i class="fas fa-exclamation-triangle fa-2x mb-2"></i>
                    <p>Результаты анализа недоступны</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- Файлы результатов -->
          <div v-if="analysis.files && analysis.files.length > 0" class="card">
            <div class="card-header">
              <h6 class="mb-0">
                <i class="fas fa-images me-2"></i>
                Файлы результатов ({{ analysis.files.length }})
              </h6>
            </div>
            <div class="card-body">
              <div class="row">
                <div
                  v-for="file in analysis.files"
                  :key="file.id"
                  class="col-lg-3 col-md-4 col-sm-6 mb-3"
                >
                  <div class="card result-file-card">
                    <div class="result-image-wrapper">
                      <img
                        :src="file.file_url"
                        :alt="file.file_type_display"
                        class="card-img-top result-image"
                        @click="openImageModal(file)"
                        @error="handleImageError"
                      >
                      <div class="image-overlay">
                        <button
                          type="button"
                          class="btn btn-light btn-sm"
                          @click="openImageModal(file)"
                        >
                          <i class="fas fa-expand me-1"></i>
                          Увеличить
                        </button>
                      </div>
                    </div>
                    <div class="card-body">
                      <h6 class="card-title small">{{ file.file_type_display }}</h6>
                      <button
                        type="button"
                        class="btn btn-outline-primary btn-sm w-100"
                        @click="downloadFile(file)"
                      >
                        <i class="fas fa-download me-1"></i>
                        Скачать
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- Детальная статистика -->
          <div v-if="analysis.result" class="card mt-4">
            <div class="card-header">
              <h6 class="mb-0">
                <i class="fas fa-chart-bar me-2"></i>
                Детальная статистика
              </h6>
            </div>
            <div class="card-body">
              <div class="row">
                <div class="col-md-6">
                  <h6>Размеры пор</h6>
                  <table class="table table-sm">
                    <tr>
                      <td>Средний размер:</td>
                      <td class="text-end">{{ analysis.result.mean_pore_size_microns.toFixed(2) }} мкм²</td>
                    </tr>
                    <tr>
                      <td>Медианный размер:</td>
                      <td class="text-end">{{ analysis.result.median_pore_size_microns.toFixed(2) }} мкм²</td>
                    </tr>
                    <tr>
                      <td>Средний диаметр:</td>
                      <td class="text-end">{{ analysis.result.mean_pore_diameter_microns.toFixed(2) }} мкм</td>
                    </tr>
                    <tr>
                      <td>Медианный диаметр:</td>
                      <td class="text-end">{{ analysis.result.median_pore_diameter_microns.toFixed(2) }} мкм</td>
                    </tr>
                  </table>
                </div>
                <div class="col-md-6">
                  <h6>Исключенные области</h6>
                  <table class="table table-sm">
                    <tr>
                      <td>Область шкалы:</td>
                      <td class="text-end">{{ getExcludedPercentage('scale_excluded_pixels') }}%</td>
                    </tr>
                    <tr>
                      <td>Области линий:</td>
                      <td class="text-end">{{ getExcludedPercentage('lines_excluded_pixels') }}%</td>
                    </tr>
                    <tr>
                      <td>Аномальные области:</td>
                      <td class="text-end">{{ getExcludedPercentage('anomalies_excluded_pixels') }}%</td>
                    </tr>
                    <tr class="table-active">
                      <td><strong>Общая исключенная область:</strong></td>
                      <td class="text-end"><strong>{{ getExcludedPercentage('total_excluded_pixels') }}%</strong></td>
                    </tr>
                  </table>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Подвал -->
        <div class="modal-footer">
          <button
            type="button"
            class="btn btn-secondary"
            @click="$emit('hide')"
          >
            Закрыть
          </button>
          <button
            v-if="analysis.files && analysis.files.length > 0"
            type="button"
            class="btn btn-primary"
            @click="downloadAllFiles"
          >
            <i class="fas fa-download me-2"></i>
            Скачать все файлы
          </button>
        </div>
      </div>
    </div>
  </div>

  <!-- Модальное окно для просмотра изображения -->
  <div 
    v-if="selectedImage"
    class="modal fade show"
    style="display: block;"
    tabindex="-1"
    @click="closeImageModal"
  >
    <div class="modal-dialog modal-lg modal-dialog-centered">
      <div class="modal-content">
        <div class="modal-header">
          <h5 class="modal-title">{{ selectedImage.file_type_display }}</h5>
          <button
            type="button"
            class="btn-close"
            @click="closeImageModal"
          ></button>
        </div>
        <div class="modal-body text-center">
          <img
            :src="selectedImage.file_url"
            :alt="selectedImage.file_type_display"
            class="img-fluid"
          >
        </div>
      </div>
    </div>
  </div>

  <!-- Фон модального окна -->
  <div v-if="show || selectedImage" class="modal-backdrop fade show"></div>
</template>

<script>
import { porosityAnalysisApi } from '../../../js/api/porosityAnalysisApi.js'

export default {
  name: 'AnalysisResultsModal',
  props: {
    analysis: {
      type: Object,
      required: true
    },
    show: {
      type: Boolean,
      default: false
    }
  },
  emits: ['hide'],
  data() {
    return {
      selectedImage: null
    }
  },
  methods: {
    getExcludedPercentage(field) {
      if (!this.analysis.result || !this.analysis.result.total_pixels) return '0.00'
      
      const excluded = this.analysis.result[field] || 0
      const total = this.analysis.result.total_pixels
      return ((excluded / total) * 100).toFixed(2)
    },

    handleBackdropClick(event) {
      if (event.target === event.currentTarget) {
        this.$emit('hide')
      }
    },

    openImageModal(file) {
      this.selectedImage = file
    },

    closeImageModal() {
      this.selectedImage = null
    },

    async downloadFile(file) {
      try {
        await porosityAnalysisApi.downloadFile(file.file_url, file.filename)
        this.$toast.success(`Файл "${file.filename}" скачан`)
      } catch (error) {
        console.error('Ошибка скачивания файла:', error)
        this.$toast.error('Ошибка скачивания файла')
      }
    },

    async downloadAllFiles() {
      if (!this.analysis.files || this.analysis.files.length === 0) return

      try {
        for (const file of this.analysis.files) {
          if (file.file_url) {
            await porosityAnalysisApi.downloadFile(file.file_url, file.filename)
            await new Promise(resolve => setTimeout(resolve, 500))
          }
        }
        this.$toast.success(`Скачано ${this.analysis.files.length} файлов`)
      } catch (error) {
        console.error('Ошибка скачивания файлов:', error)
        this.$toast.error('Ошибка скачивания файлов')
      }
    },

    handleImageError(event) {
      event.target.style.display = 'none'
      const placeholder = document.createElement('div')
      placeholder.className = 'text-center text-muted p-3'
      placeholder.innerHTML = '<i class="fas fa-exclamation-triangle"></i><br>Ошибка загрузки изображения'
      event.target.parentElement.appendChild(placeholder)
    }
  },
  watch: {
    show(newVal) {
      if (newVal) {
        document.body.classList.add('modal-open')
      } else {
        document.body.classList.remove('modal-open')
        this.selectedImage = null
      }
    }
  }
}
</script>

<style scoped>
.modal {
  background-color: rgba(0, 0, 0, 0.5);
}

.metric-item {
  text-align: center;
}

.metric-label {
  font-size: 0.875rem;
  color: #6c757d;
  margin-bottom: 0.25rem;
}

.metric-value {
  font-size: 1.5rem;
  font-weight: 600;
}

.result-file-card {
  transition: transform 0.2s ease-in-out;
  border: none;
  box-shadow: 0 0.125rem 0.25rem rgba(0, 0, 0, 0.075);
}

.result-file-card:hover {
  transform: translateY(-2px);
}

.result-image-wrapper {
  position: relative;
  height: 150px;
  overflow: hidden;
}

.result-image {
  width: 100%;
  height: 100%;
  object-fit: cover;
  cursor: pointer;
  transition: transform 0.3s ease;
}

.result-image:hover {
  transform: scale(1.05);
}

.image-overlay {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  opacity: 0;
  transition: opacity 0.3s ease;
}

.result-image-wrapper:hover .image-overlay {
  opacity: 1;
}

.table-sm td {
  padding: 0.25rem 0.5rem;
  border-top: 1px solid #dee2e6;
}

.modal-backdrop {
  z-index: 1040;
}

.modal {
  z-index: 1050;
}
</style> 