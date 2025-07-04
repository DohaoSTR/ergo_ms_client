<template>
  <div class="analysis-list">
    <!-- Заголовок и кнопка обновления -->
    <div class="row mb-3">
      <div class="col-md-6">
        <h5 class="mb-0">
          <i class="fas fa-list me-2"></i>
          Мои анализы
          <span v-if="analyses.length > 0" class="badge bg-secondary ms-2">{{ analyses.length }}</span>
        </h5>
      </div>
      <div class="col-md-6 text-end">
        <div class="btn-group" role="group">
          <button
            type="button"
            class="btn btn-outline-success btn-sm"
            @click="startAllPending"
            :disabled="loading"
            title="Запустить все ожидающие анализы"
          >
            <i class="fas fa-play me-1"></i>
            Запустить все
          </button>
          <button
            type="button"
            class="btn btn-outline-danger btn-sm"
            @click="deleteAllFailed"
            :disabled="loading"
            title="Удалить все неудачные анализы"
          >
            <i class="fas fa-trash me-1"></i>
            Очистить ошибки
          </button>
          <button
            type="button"
            class="btn btn-outline-primary btn-sm"
            @click="$emit('refresh')"
            :disabled="loading"
          >
            <i v-if="loading" class="fas fa-spinner fa-spin me-2"></i>
            <i v-else class="fas fa-sync-alt me-2"></i>
            Обновить
          </button>
        </div>
      </div>
    </div>

    <!-- Загрузка -->
    <div v-if="loading" class="text-center py-4">
      <div class="spinner-border text-primary" role="status">
        <span class="visually-hidden">Загрузка...</span>
      </div>
      <p class="mt-2 text-muted">Загрузка анализов...</p>
    </div>

    <!-- Пустой список -->
    <div v-else-if="analyses.length === 0" class="text-center py-5">
      <i class="fas fa-microscope fa-3x text-muted mb-3"></i>
      <h5 class="text-muted">Анализы не найдены</h5>
      <p class="text-muted">Создайте первый анализ пористости</p>
    </div>

    <!-- Список анализов -->
    <div v-else class="row">
      <div
        v-for="analysis in analyses"
        :key="analysis.id"
        class="col-lg-6 col-xl-4 mb-4"
      >
        <div class="card h-100 analysis-card">
          <!-- Изображение -->
          <div class="card-img-top-wrapper">
            <img
              v-if="analysis.original_image_url"
              :src="analysis.original_image_url"
              :alt="analysis.title"
              class="card-img-top"
              @error="handleImageError"
            >
            <div v-else class="card-img-placeholder">
              <i class="fas fa-image fa-2x text-muted"></i>
            </div>
            
            <!-- Статус анализа -->
            <div class="status-badge">
              <span 
                class="badge"
                :class="getStatusBadgeClass(analysis.status)"
              >
                <i :class="getStatusIcon(analysis.status)" class="me-1"></i>
                {{ analysis.status_display }}
              </span>
            </div>
          </div>

          <!-- Содержимое карточки -->
          <div class="card-body d-flex flex-column">
            <h6 class="card-title mb-2">{{ analysis.title }}</h6>
            
            <p v-if="analysis.description" class="card-text text-muted small mb-2">
              {{ truncateText(analysis.description, 100) }}
            </p>

            <!-- Информация об анализе -->
            <div class="analysis-info small text-muted mb-3">
              <div class="mb-1">
                <i class="fas fa-ruler me-1"></i>
                Шкала: {{ analysis.scale_value }} мкм
              </div>
              <div class="mb-1">
                <i class="fas fa-calendar-alt me-1"></i>
                Создано: {{ formatDate(analysis.created_at) }}
              </div>
              <div v-if="analysis.processed_at">
                <i class="fas fa-check me-1"></i>
                Обработано: {{ formatDate(analysis.processed_at) }}
              </div>
            </div>

            <!-- Кнопки действий -->
            <div class="mt-auto">
              <div class="btn-group w-100" role="group">
                <!-- Кнопка просмотра результатов -->
                <button
                  type="button"
                  class="btn btn-primary btn-sm"
                  @click="$emit('view-results', analysis)"
                  :disabled="analysis.status !== 'completed'"
                  :title="analysis.status === 'completed' ? 'Просмотреть результаты' : 'Анализ еще не завершен'"
                >
                  <i class="fas fa-eye me-1"></i>
                  {{ analysis.status === 'completed' ? 'Результаты' : 'Ожидание' }}
                </button>

                <!-- Дополнительные действия -->
                <div class="btn-group" role="group">
                  <button
                    type="button"
                    class="btn btn-outline-secondary btn-sm dropdown-toggle"
                    data-bs-toggle="dropdown"
                    aria-expanded="false"
                  >
                    <i class="fas fa-ellipsis-v"></i>
                  </button>
                  <ul class="dropdown-menu">
                    <li>
                      <button
                        type="button"
                        class="dropdown-item"
                        @click="$emit('view-results', analysis)"
                        :disabled="analysis.status !== 'completed'"
                      >
                        <i class="fas fa-eye me-2"></i>
                        Просмотреть детали
                      </button>
                    </li>
                    <li>
                      <button
                        type="button"
                        class="dropdown-item"
                        @click="downloadResults(analysis)"
                        :disabled="analysis.status !== 'completed'"
                      >
                        <i class="fas fa-download me-2"></i>
                        Скачать результаты
                      </button>
                    </li>
                    <li><hr class="dropdown-divider"></li>
                    <li>
                      <button
                        type="button"
                        class="dropdown-item text-danger"
                        @click="confirmDelete(analysis)"
                        :disabled="analysis.status === 'processing'"
                      >
                        <i class="fas fa-trash me-2"></i>
                        Удалить
                      </button>
                    </li>
                  </ul>
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
import { porosityAnalysisApi } from '../../../js/api/porosityAnalysisApi.js'

export default {
  name: 'AnalysisList',
  props: {
    analyses: {
      type: Array,
      required: true
    },
    loading: {
      type: Boolean,
      default: false
    }
  },
  emits: ['refresh', 'view-results', 'delete'],
  methods: {
    async startAllPending() {
      if (!confirm('Запустить все ожидающие анализы?')) {
        return
      }

      try {
        const response = await porosityAnalysisApi.startAllPending()
        if (response && response.success) {
          this.$toast.success(response.message || 'Все ожидающие анализы запущены')
          this.$emit('refresh')
        } else {
          this.$toast.error((response && response.message) || 'Ошибка запуска анализов')
        }
      } catch (error) {
        console.error('Ошибка запуска анализов:', error)
        
        // Обрабатываем различные типы ошибок
        if (error && error.response && error.response.data && error.response.data.message) {
          this.$toast.error(error.response.data.message)
        } else if (error && error.message) {
          this.$toast.error(error.message)
        } else {
          this.$toast.error('Ошибка запуска анализов')
        }
      }
    },

    async deleteAllFailed() {
      if (!confirm('Удалить все неудачные анализы?')) {
        return
      }

      try {
        const response = await porosityAnalysisApi.deleteAllFailed()
        if (response && response.success) {
          this.$toast.success(response.message || 'Неудачные анализы удалены')
          this.$emit('refresh')
        } else {
          this.$toast.error((response && response.message) || 'Ошибка удаления анализов')
        }
      } catch (error) {
        console.error('Ошибка удаления анализов:', error)
        
        // Обрабатываем различные типы ошибок
        if (error && error.response && error.response.data && error.response.data.message) {
          this.$toast.error(error.response.data.message)
        } else if (error && error.message) {
          this.$toast.error(error.message)
        } else {
          this.$toast.error('Ошибка удаления анализов')
        }
      }
    },

    getStatusBadgeClass(status) {
      const classes = {
        'pending': 'bg-warning text-dark',
        'processing': 'bg-info text-white',
        'completed': 'bg-success text-white',
        'error': 'bg-danger text-white'
      }
      return classes[status] || 'bg-secondary text-white'
    },

    getStatusIcon(status) {
      return porosityAnalysisApi.getStatusIcon(status)
    },

    formatDate(dateString) {
      if (!dateString) return ''
      
      const date = new Date(dateString)
      return date.toLocaleDateString('ru-RU', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      })
    },

    truncateText(text, maxLength) {
      if (!text) return ''
      return text.length > maxLength ? text.substring(0, maxLength) + '...' : text
    },

    handleImageError(event) {
      // Заменяем битое изображение на плейсхолдер
      event.target.style.display = 'none'
      event.target.parentElement.classList.add('image-error')
    },

    async downloadResults(analysis) {
      try {
        // Получаем список файлов анализа
        const response = await porosityAnalysisApi.getAnalysisFiles(analysis.id)
        
        if (!response || !response.success || !response.data || !response.data.files) {
          this.$toast.warning('Файлы результатов не найдены')
          return
        }
        
        const files = response.data.files

        if (files.length === 0) {
          this.$toast.warning('Файлы результатов не найдены')
          return
        }

        // Скачиваем все файлы по очереди
        for (const file of files) {
          if (file.file_url) {
            try {
              await porosityAnalysisApi.downloadFile(file.file_url, file.filename)
              // Небольшая задержка между скачиваниями
              await new Promise(resolve => setTimeout(resolve, 500))
            } catch (downloadError) {
              console.error(`Ошибка скачивания файла ${file.filename}:`, downloadError)
              // Продолжаем скачивание других файлов
            }
          }
        }

        this.$toast.success(`Скачано ${files.length} файлов`)
      } catch (error) {
        console.error('Ошибка скачивания файлов:', error)
        
        // Обрабатываем различные типы ошибок
        if (error && error.response && error.response.data && error.response.data.message) {
          this.$toast.error(error.response.data.message)
        } else if (error && error.message) {
          this.$toast.error(error.message)
        } else {
          this.$toast.error('Ошибка скачивания файлов результатов')
        }
      }
    },

    confirmDelete(analysis) {
      if (analysis.status === 'processing') {
        this.$toast.warning('Нельзя удалить обрабатываемый анализ')
        return
      }

      this.$emit('delete', analysis)
    }
  }
}
</script>

<style scoped>
.analysis-card {
  transition: transform 0.2s ease-in-out, box-shadow 0.2s ease-in-out;
  border: none;
  box-shadow: 0 0.125rem 0.25rem rgba(0, 0, 0, 0.075);
}

.analysis-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 0.5rem 1rem rgba(0, 0, 0, 0.15);
}

.card-img-top-wrapper {
  position: relative;
  height: 200px;
  overflow: hidden;
  background-color: #f8f9fa;
}

.card-img-top {
  width: 100%;
  height: 100%;
  object-fit: cover;
  transition: opacity 0.3s ease;
}

.card-img-placeholder {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: #e9ecef;
}

.image-error::after {
  content: "";
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: #e9ecef;
  display: flex;
  align-items: center;
  justify-content: center;
}

.status-badge {
  position: absolute;
  top: 10px;
  right: 10px;
  z-index: 1;
}

.analysis-info {
  font-size: 0.85rem;
  line-height: 1.4;
}

.btn-group .dropdown-toggle::after {
  border: none;
  font-size: 0.7rem;
}

.dropdown-menu {
  font-size: 0.875rem;
}

.dropdown-item:disabled {
  opacity: 0.5;
  pointer-events: none;
}

@media (max-width: 768px) {
  .card-img-top-wrapper {
    height: 150px;
  }
  
  .btn-group {
    flex-direction: column;
  }
  
  .btn-group .btn {
    border-radius: 0.375rem !important;
    margin-bottom: 0.25rem;
  }
  
  .btn-group .dropdown-toggle {
    margin-bottom: 0;
  }
}
</style> 