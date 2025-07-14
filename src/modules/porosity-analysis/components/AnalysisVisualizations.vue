<template>
  <div class="analysis-visualizations">
    <div class="row">
      <div class="col-12">
        <div class="card">
          <div class="card-body">
            <div v-if="loading" class="text-center py-4">
              <div class="spinner-border" role="status">
                <span class="visually-hidden">Загрузка...</span>
              </div>
            </div>
            
            <div v-else-if="resultFiles.length === 0" class="text-center py-4">
              <Images class="text-muted mb-2" size="48" />
              <div class="text-muted">Визуализации будут доступны после завершения анализа</div>

            </div>
            
            <div v-else class="visualizations-grid">
              <div
                v-for="file in resultFiles"
                :key="file.name"
                class="visualization-item"
              >
                <div class="visualization-card">
                  <div class="visualization-header">
                    <h6 class="visualization-title">{{ file.description }}</h6>
                    <div class="visualization-actions">
                      <button
                        type="button"
                        class="btn btn-primary btn-sm"
                        @click="downloadFile(null, file.name)"
                      >
                        <Download class="me-2" size="16" />
                        Скачать
                      </button>
                    </div>
                  </div>
                  
                  <div class="visualization-content">
                    
                    <!-- Индикатор загрузки -->
                    <div v-if="isImageLoading(file)" class="image-placeholder">
                      <div class="spinner-border text-primary" role="status">
                        <span class="visually-hidden">Загрузка...</span>
                      </div>
                      <div class="text-muted mt-2">Загрузка изображения...</div>
                    </div>
                    
                    <!-- Ошибка загрузки -->
                    <div v-else-if="hasImageError(file)" class="image-placeholder">
                      <AlertTriangle class="text-warning mb-2" size="32" />
                      <div class="text-muted mb-2">Ошибка загрузки изображения</div>
                      <button 
                        class="btn btn-sm btn-primary"
                        @click="retryImageLoad(file)"
                      >
                        <RefreshCw class="me-1" size="16" />
                        Повторить
                      </button>
                    </div>
                    
                    <!-- Изображение -->
                    <img
                      v-else-if="getImageUrlSync(file)"
                      :src="getImageUrlSync(file)"
                      :alt="file.description"
                      class="visualization-image"
                      @error="handleImageError"
                      @load="handleImageLoad"
                      @click="openModal(file)"
                      title="Нажмите для увеличения"
                    />
                    
                    <!-- Заглушка для не загруженного изображения -->
                    <div v-else class="image-placeholder">
                      <ImageIcon class="text-muted" size="32" />
                      <div class="text-muted mt-2">Изображение не загружено</div>
                    </div>
                  </div>
                  

                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
    
    <!-- Модальное окно для увеличенного просмотра -->
    <teleport to="body">
      <div
        v-if="selectedImage"
        class="image-modal"
        @click.self="closeModal"
      >
        <div class="image-modal-content">
          <div class="image-modal-header">
            <h5 class="image-modal-title">{{ selectedImage.description }}</h5>
            <button
              type="button"
              class="btn-close"
              @click="closeModal"
              aria-label="Закрыть"
            ></button>
          </div>
          <div class="image-modal-body">
            <img
              :src="getImageUrlSync(selectedImage)"
              :alt="selectedImage.description"
              :class="['modal-image', { 'zoomed': imageZoomed }]"
              @click="toggleImageZoom"
              @wheel="handleWheel"
              :title="'Используйте колесико мыши для масштабирования'"
            />

          </div>
          <div class="image-modal-footer">
            <div class="d-flex gap-2">
              <button
                type="button"
                class="btn btn-primary"
                @click="downloadFile(null, selectedImage.name)"
              >
                <Download class="me-2" size="16" />
                Скачать изображение
              </button>
            </div>
          </div>
        </div>
      </div>
    </teleport>
  </div>
</template>

<script>
import { apiClient } from '../../../js/api/manager.js'
import { TrendingUp, Images, FileText, Image as ImageIcon, Search, Download, AlertTriangle, RefreshCw, X } from 'lucide-vue-next'

export default {
  name: 'AnalysisVisualizations',
  components: {
    TrendingUp,
    Images,
    FileText,
    ImageIcon,
    Search,
    Download,
    AlertTriangle,
    RefreshCw,
    X
  },
  props: {
    resultFiles: {
      type: Array,
      default: () => []
    },
    loading: {
      type: Boolean,
      default: false
    },

  },
  mounted() {
    // Компонент смонтирован
  },
  
  beforeUnmount() {
    // Очищаем blob URL чтобы избежать утечек памяти
    for (const url of this.imageUrls.values()) {
      URL.revokeObjectURL(url)
    }
    this.imageUrls.clear()
    
    // Убираем обработчик событий клавиатуры
    document.removeEventListener('keydown', this.handleKeyDown)
    document.body.classList.remove('modal-open')
  },
  watch: {
    resultFiles: {
      handler(newFiles) {
        this.loadImages()
      },
      immediate: true
    }
  },
  data() {
    return {
      selectedImage: null,
      imageLoadErrors: new Set(),
      imageUrls: new Map(), // Кэш для blob URL изображений
      loadingImages: new Set(), // Отслеживание загружаемых изображений
      imageZoomed: false, // Состояние увеличения изображения в модале
      isDragging: false,
      dragStart: { x: 0, y: 0 },
      imageTransform: { x: 0, y: 0, scale: 1 }
    }
  },
  methods: {
    openModal(file) {
      this.selectedImage = file
      this.imageZoomed = false
      this.imageTransform = { x: 0, y: 0, scale: 1 }
      document.body.classList.add('modal-open')
      document.body.style.overflow = 'hidden'
      document.addEventListener('keydown', this.handleKeyDown)
    },
    
    closeModal() {
      this.selectedImage = null
      this.imageZoomed = false
      this.isDragging = false
      this.imageTransform = { x: 0, y: 0, scale: 1 }
      document.body.classList.remove('modal-open')
      document.body.style.overflow = ''
      document.removeEventListener('keydown', this.handleKeyDown)
    },

    handleKeyDown(event) {
      if (event.key === 'Escape') {
        this.closeModal()
      }
    },

    toggleImageZoom() {
      this.imageZoomed = !this.imageZoomed
      if (!this.imageZoomed) {
        this.imageTransform = { x: 0, y: 0, scale: 1 }
      } else {
        this.imageTransform.scale = 1.5
      }
      this.updateImageTransform()
    },

    handleWheel(event) {
      if (this.selectedImage) {
        event.preventDefault()
        const delta = event.deltaY > 0 ? -0.1 : 0.1
        const newScale = Math.max(0.5, Math.min(5, this.imageTransform.scale + delta))
        this.imageTransform.scale = newScale
        
        // Если масштаб меньше 1, считаем что изображение не увеличено
        if (newScale <= 1) {
          this.imageZoomed = false
        } else {
          this.imageZoomed = true
        }
        
        this.updateImageTransform()
      }
    },

    handleImageClick(event) {
      if (this.selectedImage && this.imageZoomed) {
        const rect = event.target.getBoundingClientRect()
        const clickX = event.clientX - rect.left
        const clickY = event.clientY - rect.top
        
        // Простое перемещение к точке клика
        this.imageTransform.x = -clickX * this.imageTransform.scale + rect.width / 2
        this.imageTransform.y = -clickY * this.imageTransform.scale + rect.height / 2
        
        this.updateImageTransform()
      }
    },

    updateImageTransform() {
      const img = document.querySelector('.modal-image')
      if (img) {
        img.style.transform = `translate(${this.imageTransform.x}px, ${this.imageTransform.y}px) scale(${this.imageTransform.scale})`
      }
    },


    
    async downloadFile(url, filename) {
      try {
        const analysisId = this.$route.params.id
        const response = await apiClient.downloadFile(`analysis_porosity/analyses/${analysisId}/image/`, { file: filename })
        
        if (response.success) {
          // Создаем blob URL для скачивания
          const blob = new Blob([response.data], { type: 'image/png' })
          const blobUrl = URL.createObjectURL(blob)
          
          const link = document.createElement('a')
          link.href = blobUrl
          link.download = filename
          document.body.appendChild(link)
          link.click()
          document.body.removeChild(link)
          
          // Очищаем blob URL
          URL.revokeObjectURL(blobUrl)
        } else {
          // Ошибка при скачивании файла
        }
      } catch (error) {
        // Ошибка при скачивании файла
      }
    },
    
    handleImageError(event) {
      const img = event.target
      const filename = img.alt
      
      // Находим файл по имени и добавляем его в список ошибок
      const file = this.resultFiles.find(f => f.description === filename)
      if (file) {
        this.imageLoadErrors.add(file.name)
      }
    },
    
    handleImageLoad(event) {
      const img = event.target
      const filename = img.alt
      
      // Находим файл по имени и убираем его из списка ошибок
      const file = this.resultFiles.find(f => f.description === filename)
      if (file) {
        this.imageLoadErrors.delete(file.name)
      }
    },
    
    async loadImages() {
      // Загружаем все изображения асинхронно
      for (const file of this.resultFiles) {
        await this.getImageUrl(file)
      }
    },

    async getImageUrl(file) {
      // Проверяем, есть ли уже загруженное изображение в кэше
      const cacheKey = `${this.$route.params.id}_${file.name}`
      if (this.imageUrls.has(cacheKey)) {
        return this.imageUrls.get(cacheKey)
      }

      // Проверяем, не загружается ли уже это изображение
      if (this.loadingImages.has(file.name)) {
        return ''
      }

      try {
        // Отмечаем, что изображение загружается
        this.loadingImages.add(file.name)
        
        // Загружаем изображение через API клиент
        const analysisId = this.$route.params.id
        const response = await apiClient.downloadFile(`analysis_porosity/analyses/${analysisId}/image/`, { file: file.name })
        
        if (response.success) {
          // Создаем blob URL для изображения
          const blob = new Blob([response.data], { type: 'image/png' })
          const url = URL.createObjectURL(blob)
          
          // Кэшируем URL
          this.imageUrls.set(cacheKey, url)
          
          return url
        } else {
          throw new Error(response.message || 'Ошибка загрузки изображения')
        }
      } catch (error) {
        this.imageLoadErrors.add(file.name)
        return ''
      } finally {
        // Убираем из списка загружаемых
        this.loadingImages.delete(file.name)
      }
    },

    getImageUrlSync(file) {
      // Синхронный метод для получения URL из кэша
      const cacheKey = `${this.$route.params.id}_${file.name}`
      return this.imageUrls.get(cacheKey) || ''
    },

    isImageLoading(file) {
      return this.loadingImages.has(file.name)
    },

    hasImageError(file) {
      return this.imageLoadErrors.has(file.name)
    },

    async retryImageLoad(file) {
      // Убираем из списка ошибок
      this.imageLoadErrors.delete(file.name)
      
      // Очищаем кэш для этого изображения
      const cacheKey = `${this.$route.params.id}_${file.name}`
      if (this.imageUrls.has(cacheKey)) {
        URL.revokeObjectURL(this.imageUrls.get(cacheKey))
        this.imageUrls.delete(cacheKey)
      }
      
      // Повторно загружаем изображение
      await this.getImageUrl(file)
    },
    

  }
}
</script>

<style scoped>
.analysis-visualizations {
  margin-top: 1rem;
}

/* Стили для кнопок с иконками */
.btn {
  display: inline-flex;
  align-items: center;
}

.btn svg {
  flex-shrink: 0;
}

.visualizations-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(400px, 1fr));
  gap: 2rem;
}

.visualization-card {
  border: 1px solid #dee2e6;
  border-radius: 0.375rem;
  background-color: #fff;
  transition: transform 0.2s, box-shadow 0.2s;
  overflow: hidden;
  height: 400px;
  display: flex;
  flex-direction: column;
}

.visualization-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 0.25rem 0.5rem rgba(0, 0, 0, 0.1);
}

.visualization-header {
  padding: 1rem;
  border-bottom: 1px solid #dee2e6;
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-shrink: 0;
}

.card-header .card-title {
  display: flex;
  align-items: center;
  margin-bottom: 0;
}

.card-header .card-title svg {
  flex-shrink: 0;
}

.visualization-title {
  margin: 0;
  font-size: 0.9rem;
  font-weight: 600;
  color: #495057;
}

.visualization-actions {
  display: flex;
  gap: 0.5rem;
}

.visualization-content {
  position: relative;
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: #f8f9fa;
  padding: 1rem;
  overflow: hidden;
}

.visualization-image {
  max-width: 100%;
  max-height: 100%;
  width: auto;
  height: auto;
  object-fit: contain;
  border-radius: 0.375rem;
  cursor: pointer;
  transition: transform 0.2s ease, box-shadow 0.2s ease;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.visualization-image:hover {
  transform: scale(1.02);
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.15);
}

.image-placeholder {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100%;
  color: #6c757d;
}



.image-modal {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-color: rgba(0, 0, 0, 0.8);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 9999;
}

.image-modal-content {
  position: relative;
  width: 90%;
  height: 90%;
  max-width: 1200px;
  background: white;
  border-radius: 0.5rem;
  display: flex;
  flex-direction: column;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.3);
}

.image-modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1rem 1.5rem;
  border-bottom: 1px solid #dee2e6;
  background-color: #f8f9fa;
  border-radius: 0.5rem 0.5rem 0 0;
}

.image-modal-title {
  color: #495057;
  margin: 0;
  font-size: 1.2rem;
  font-weight: 600;
}

.image-modal-body {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 1.5rem;
  overflow: auto;
  background-color: #f8f9fa;
  position: relative;
}



.image-modal-footer {
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 1rem 1.5rem;
  border-top: 1px solid #dee2e6;
  background-color: white;
  border-radius: 0 0 0.5rem 0.5rem;
}

.image-modal-footer .d-flex {
  justify-content: center;
  width: 100%;
}

.image-modal-footer .btn {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  min-width: 200px;
}



.modal-image {
  max-width: 100%;
  max-height: 100%;
  object-fit: contain;
  border-radius: 0.375rem;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  cursor: zoom-in;
  transition: transform 0.3s ease;
  border: 1px solid #dee2e6;
  transform-origin: center;
  user-select: none;
}

.modal-image.zoomed {
  max-width: none;
  max-height: none;
  width: auto;
  height: auto;
  transform: scale(1.5);
  cursor: pointer;
  transition: transform 0.1s ease;
}

@media (max-width: 768px) {
  .visualizations-grid {
    grid-template-columns: 1fr;
    gap: 1.5rem;
  }
  
  .visualization-card {
    height: 350px;
  }
  
  .visualization-content {
    padding: 0.5rem;
  }
  
  .visualization-image {
    max-height: 100%;
  }
  
  .visualization-header {
    flex-direction: column;
    align-items: center;
    gap: 0.75rem;
    text-align: center;
  }
  
  .visualization-actions {
    align-self: center;
  }
  
  .image-modal-content {
    width: 95%;
    height: 95%;
  }
  
  .image-modal-header {
    padding: 0.75rem 1rem;
  }
  
  .image-modal-title {
    font-size: 1rem;
  }
  
  .image-modal-body {
    padding: 1rem;
  }
  
  .image-modal-footer {
    padding: 0.75rem 1rem;
  }
  
  .image-modal-footer .btn {
    min-width: 150px;
    font-size: 0.875rem;
  }
  
  .modal-image.zoomed {
    transform: scale(1.3);
  }
}
</style> 