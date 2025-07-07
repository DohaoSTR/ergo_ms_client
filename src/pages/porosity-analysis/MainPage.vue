<template>
  <div class="porosity-analysis-main">
    <div class="container-fluid">
      <div class="row">
        <div class="col-12">
          <!-- Заголовок -->
          <div class="d-flex justify-content-between align-items-center mb-4">
            <div>
              <h1 class="h2 mb-2 text-primary">
                <i class="fas fa-microscope me-3"></i>
                Анализ пористости
              </h1>
              <p class="text-muted mb-0">Создавайте и управляйте анализами пористости материалов</p>
            </div>
            <router-link to="/porosity-analysis/analyses" class="btn btn-outline-primary btn-lg">
              <i class="fas fa-list me-2"></i>
              Все анализы
            </router-link>
          </div>
          
          <!-- Статистика -->
          <div class="row mb-4">
            <div class="col-12">
              <AnalysisStats :stats="stats" :show-details="false" />
            </div>
          </div>
          
          <!-- Формы создания -->
          <div class="row g-4">
            <div class="col-lg-6">
              <div class="card h-100 shadow-sm border-0">
                <div class="card-header bg-primary text-white">
                  <h5 class="card-title mb-0">
                    <i class="fas fa-plus-circle me-2"></i>
                    Создать анализ
                  </h5>
                </div>
                <div class="card-body p-4">
                  <form @submit.prevent="createAnalysis">
                    <div class="mb-3">
                      <label for="analysisName" class="form-label fw-bold">Название анализа</label>
                      <input
                        type="text"
                        class="form-control form-control-lg"
                        id="analysisName"
                        v-model="newAnalysis.name"
                        required
                        placeholder="Введите название анализа"
                      />
                    </div>
                    
                    <div class="mb-3">
                      <label for="analysisDescription" class="form-label fw-bold">Описание</label>
                      <textarea
                        class="form-control"
                        id="analysisDescription"
                        v-model="newAnalysis.description"
                        rows="3"
                        placeholder="Подробное описание анализа"
                      ></textarea>
                    </div>
                    
                    <div class="row g-3">
                      <div class="col-md-6">
                        <div class="mb-3">
                          <label for="scaleValue" class="form-label fw-bold">Масштаб (мкм/пиксель)</label>
                          <input
                            type="number"
                            class="form-control"
                            id="scaleValue"
                            v-model="newAnalysis.scale_value"
                            step="0.01"
                            min="0"
                            placeholder="100.0"
                          />
                        </div>
                      </div>
                      <div class="col-md-6">
                        <div class="mb-3">
                          <label for="pixelsPerMicron" class="form-label fw-bold">Пикселей на микрон</label>
                          <input
                            type="number"
                            class="form-control"
                            id="pixelsPerMicron"
                            v-model="newAnalysis.pixels_per_micron"
                            step="0.01"
                            min="0"
                            placeholder="1.0"
                          />
                        </div>
                      </div>
                    </div>
                    
                    <div class="mb-3">
                      <label for="analysisImage" class="form-label fw-bold">Изображение для анализа</label>
                      <input
                        type="file"
                        class="form-control"
                        id="analysisImage"
                        @change="handleAnalysisImageUpload"
                        accept="image/*"
                        required
                        ref="analysisImageInput"
                      />
                    </div>
                    
                    <button type="submit" class="btn btn-primary btn-lg w-100" :disabled="isCreating || !selectedAnalysisImage">
                      <i class="fas fa-plus me-2"></i>
                      {{ isCreating ? 'Создание...' : 'Создать анализ' }}
                    </button>
                  </form>
                </div>
              </div>
            </div>
            
            <div class="col-lg-6">
              <div class="card h-100 shadow-sm border-0">
                <div class="card-header bg-success text-white">
                  <h5 class="card-title mb-0">
                    <i class="fas fa-upload me-2"></i>
                    Быстрая загрузка
                  </h5>
                </div>
                <div class="card-body p-4">
                  <div class="mb-4">
                    <label for="quickUpload" class="form-label fw-bold">Выберите изображения</label>
                    <div 
                      class="upload-area" 
                      @click="$refs.quickUploadInput.click()" 
                      @dragover.prevent="handleDragOver" 
                      @dragleave.prevent="handleDragLeave"
                      @drop.prevent="handleDrop"
                      :class="{ 'dragover': isDragOver }"
                    >
                      <input
                        type="file"
                        class="d-none"
                        id="quickUpload"
                        @change="handleQuickUpload"
                        multiple
                        accept="image/*"
                        ref="quickUploadInput"
                      />
                      <div class="text-center">
                        <i class="fas fa-cloud-upload-alt fa-3x text-muted mb-3"></i>
                        <p class="mb-2">Перетащите файлы сюда или нажмите для выбора</p>
                        <p class="text-muted small">Поддерживаются форматы: PNG, JPG, JPEG</p>
                      </div>
                    </div>
                  </div>
                  
                  <div v-if="quickUploadFiles.length > 0" class="mb-4">
                    <h6 class="fw-bold mb-3">Выбранные файлы:</h6>
                    <div class="selected-files">
                      <div
                        v-for="(file, index) in quickUploadFiles"
                        :key="index"
                        class="file-item d-flex justify-content-between align-items-center p-2 border rounded mb-2"
                      >
                        <div class="d-flex align-items-center">
                          <i class="fas fa-image text-primary me-2"></i>
                          <span class="text-truncate">{{ file.name }}</span>
                        </div>
                        <button
                          type="button"
                          class="btn btn-sm btn-outline-danger"
                          @click="removeQuickUploadFile(index)"
                        >
                          <i class="fas fa-times"></i>
                        </button>
                      </div>
                    </div>
                  </div>
                  
                  <button
                    type="button"
                    class="btn btn-success btn-lg w-100"
                    @click="createMultipleAnalyses"
                    :disabled="quickUploadFiles.length === 0 || isCreatingMultiple"
                  >
                    <i class="fas fa-upload me-2"></i>
                    {{ isCreatingMultiple ? 'Создание...' : `Создать ${quickUploadFiles.length} анализов` }}
                  </button>
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
import { porosityAnalysisAPI } from './js/porosity-analysis.js'
import AnalysisStats from './components/AnalysisStats.vue'

export default {
  components: {
    AnalysisStats
  },
  name: 'PorosityAnalysisMainPage',
  data() {
    return {
      newAnalysis: {
        name: '',
        description: '',
        scale_value: 100,  // Стандартное значение шкалы 100 мкм
        pixels_per_micron: null
      },
      selectedAnalysisImage: null,
      quickUploadFiles: [],
      isCreating: false,
      isCreatingMultiple: false,
      isDragOver: false,
      stats: {
        pending: 0,
        processing: 0,
        completed: 0,
        failed: 0
      }
    }
  },
  async mounted() {
    await this.loadStats()
  },
  methods: {
    handleAnalysisImageUpload(event) {
      const file = event.target.files[0]
      if (file) {
        this.selectedAnalysisImage = file
      }
    },
    
    async createAnalysis() {
      this.isCreating = true
      try {
        // Создаем анализ
        const response = await porosityAnalysisAPI.createAnalysis(this.newAnalysis)
        
        if (response && response.success) {
          let analysisId = null
          if (response.data && typeof response.data === 'object') {
            analysisId = response.data.id
          } else if (typeof response.data === 'number') {
            analysisId = response.data
          }
          

          
          if (analysisId && this.selectedAnalysisImage) {
            // Загружаем изображение для созданного анализа
            const uploadResponse = await porosityAnalysisAPI.uploadImage(analysisId, this.selectedAnalysisImage)
            if (uploadResponse && uploadResponse.success) {
              this.$toast.success('Анализ создан и изображение загружено успешно!')
              this.resetForm()
              this.$router.push(`/porosity-analysis/analysis/${analysisId}`)
            } else {
              this.$toast.error(uploadResponse?.message || 'Ошибка при загрузке изображения')
            }
          } else {
            this.$toast.success('Анализ создан успешно!')
            this.resetForm()
            this.$router.push('/porosity-analysis/analyses')
          }
        } else {
          this.$toast.error(response?.message || 'Ошибка при создании анализа')
        }
      } catch (error) {
        let errorMessage = 'Ошибка при создании анализа'
        if (error && typeof error === 'object') {
          errorMessage = error.response?.data?.message || error.message || errorMessage
        }
        this.$toast.error(errorMessage)
      } finally {
        this.isCreating = false
      }
    },
    
    handleQuickUpload(event) {
      const files = Array.from(event.target.files)
      this.quickUploadFiles = files
    },
    
    handleDragOver(event) {
      event.preventDefault()
      this.isDragOver = true
    },
    
    handleDragLeave(event) {
      event.preventDefault()
      this.isDragOver = false
    },
    
    handleDrop(event) {
      event.preventDefault()
      this.isDragOver = false
      const files = Array.from(event.dataTransfer.files)
      this.quickUploadFiles = files
    },
    
    removeQuickUploadFile(index) {
      this.quickUploadFiles.splice(index, 1)
    },
    
    async createMultipleAnalyses() {
      this.isCreatingMultiple = true
      try {
        const results = await porosityAnalysisAPI.createMultipleAnalyses(this.quickUploadFiles, 100.0)
        
        console.log('Multiple analyses results:', results)
        console.log('Results type:', typeof results)
        console.log('Results is array:', Array.isArray(results))
        
        if (Array.isArray(results) && results.length > 0) {
          const validResults = results.filter(r => r !== null && r !== undefined)
          const successCount = validResults.filter(r => r && typeof r === 'object' && r.success === true).length
          const failedCount = validResults.length - successCount
          
          console.log(`Valid results: ${validResults.length}, Success: ${successCount}, Failed: ${failedCount}`)
          
          if (successCount > 0) {
            this.$toast.success(`Создано ${successCount} из ${this.quickUploadFiles.length} анализов`)
          }
          
          if (failedCount > 0) {
            this.$toast.warning(`${failedCount} анализов не удалось создать`)
          }
        } else if (results && typeof results === 'object') {
          // Если API вернул одиночный результат
          if (results.success === true) {
            this.$toast.success('Анализ создан успешно')
          } else if (results.data) {
            console.log('Results with data:', results)
            this.$toast.success('Анализ создан успешно')
          } else {
            console.warn('Unexpected single result format:', results)
            this.$toast.success('Анализ отправлен на обработку')
          }
        } else {
          // Если результаты не в ожидаемом формате
          console.warn('Unexpected results format:', results)
          this.$toast.success('Анализы отправлены на обработку')
        }
        
        this.quickUploadFiles = []
        if (this.$refs.quickUploadInput) {
          this.$refs.quickUploadInput.value = ''
        }
        
        // Переходим к списку анализов
        this.$router.push('/porosity-analysis/analyses')
        
      } catch (error) {
        let errorMessage = 'Ошибка при создании анализов'
        if (error && typeof error === 'object') {
          if (error.response && error.response.data) {
            errorMessage = error.response.data.message || error.response.data.detail || errorMessage
          } else if (error.message) {
            errorMessage = error.message
          }
        } else if (error && typeof error === 'string') {
          errorMessage = error
        }
        console.error('Error creating multiple analyses:', error)
        this.$toast.error(errorMessage)
      } finally {
        this.isCreatingMultiple = false
      }
    },
    
    resetForm() {
      this.newAnalysis = {
        name: '',
        description: '',
        scale_value: 100,  // Стандартное значение шкалы 100 мкм
        pixels_per_micron: null
      }
      this.selectedAnalysisImage = null
      if (this.$refs.analysisImageInput) {
        this.$refs.analysisImageInput.value = ''
      }
    },
    
    async loadStats() {
      try {
        const response = await porosityAnalysisAPI.getStatistics()
        if (response && response.success) {
          this.stats = response.data
        }
      } catch (error) {
        // Устанавливаем значения по умолчанию при ошибке
        this.stats = {
          pending: 0,
          processing: 0,
          completed: 0,
          failed: 0
        }
      }
    }
  }
}
</script>

<style scoped>
.porosity-analysis-main {
  padding: 20px 0;
  background: linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%);
  min-height: 100vh;
}

.card {
  box-shadow: 0 0.5rem 1rem rgba(0, 0, 0, 0.15);
  border: none;
  border-radius: 15px;
  transition: transform 0.2s ease-in-out;
}

.card:hover {
  transform: translateY(-2px);
}

.card-header {
  border-radius: 15px 15px 0 0 !important;
  border: none;
}

.upload-area {
  border: 2px dashed #dee2e6;
  border-radius: 10px;
  padding: 2rem;
  text-align: center;
  cursor: pointer;
  transition: all 0.3s ease;
  background-color: #f8f9fa;
}

.upload-area:hover {
  border-color: #007bff;
  background-color: #e3f2fd;
}

.upload-area.dragover {
  border-color: #28a745;
  background-color: #d4edda;
  transform: scale(1.02);
  box-shadow: 0 0 20px rgba(40, 167, 69, 0.3);
}

.selected-files {
  max-height: 200px;
  overflow-y: auto;
}

.file-item {
  background-color: #f8f9fa;
  transition: all 0.2s ease;
}

.file-item:hover {
  background-color: #e9ecef;
}

.text-truncate {
  max-width: 200px;
}

.btn-lg {
  padding: 0.75rem 1.5rem;
  font-size: 1.1rem;
  border-radius: 10px;
}

.form-control-lg {
  border-radius: 10px;
  padding: 0.75rem 1rem;
}

.form-control {
  border-radius: 8px;
  border: 1px solid #dee2e6;
  transition: border-color 0.2s ease;
}

.form-control:focus {
  border-color: #007bff;
  box-shadow: 0 0 0 0.2rem rgba(0, 123, 255, 0.25);
}

.text-primary {
  color: #007bff !important;
}

.bg-primary {
  background-color: #007bff !important;
}

.bg-success {
  background-color: #28a745 !important;
}

.shadow-sm {
  box-shadow: 0 0.125rem 0.25rem rgba(0, 0, 0, 0.075) !important;
}
</style> 