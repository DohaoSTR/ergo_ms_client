<template>
  <div class="image-upload">
    <div v-if="!hasImage" class="upload-area">
      <div class="upload-content">
        <Upload class="text-muted mb-2" size="48" />
        <h6 class="text-muted">Изображение не загружено</h6>
        <p class="text-muted small">Загрузите изображение для начала анализа</p>
        
        <div class="mt-2">
          <input
            type="file"
            class="form-control"
            @change="handleFileSelect"
            accept="image/*"
            ref="fileInput"
            style="max-width: 300px; margin: 0 auto;"
          />
        </div>
        
        <div class="mt-2">
          <small class="text-muted">
            Поддерживаемые форматы: PNG, JPG, JPEG, GIF
          </small>
        </div>
      </div>
    </div>
    
    <div v-else class="image-preview">
      <div class="image-container">
        <img
          :src="imageUrl"
          alt="Исходное изображение"
          class="preview-image"
          @load="onImageLoad"
          @error="onImageError"
          @click="openModal"
          :title="'Нажмите для увеличения'"
        />
      </div>
      
      <div class="image-info mt-1">
        <small class="text-muted">
          Размер: {{ imageInfo.width }}x{{ imageInfo.height }} пикселей
        </small>
      </div>
    </div>
    
    <div v-if="uploading" class="upload-progress mt-3">
      <div class="progress">
        <div class="progress-bar progress-bar-striped progress-bar-animated" 
             role="progressbar" 
             style="width: 100%">
        </div>
      </div>
      <small class="text-muted">Загрузка изображения...</small>
    </div>

    <!-- Модальное окно для увеличенного просмотра -->
    <teleport to="body">
      <div
        v-if="showModal"
        class="image-modal"
        @click.self="closeModal"
      >
        <div class="image-modal-content">
          <div class="image-modal-header">
            <h5 class="image-modal-title">Исходное изображение</h5>
            <button
              type="button"
              class="btn-close"
              @click="closeModal"
              aria-label="Закрыть"
            ></button>
          </div>
          <div class="image-modal-body">
            <img
              :src="imageUrl"
              alt="Исходное изображение"
              :class="['modal-image', { 'zoomed': imageZoomed }]"
              @click="toggleImageZoom"
              @wheel="handleWheel"
              :title="'Используйте колесико мыши для масштабирования'"
            />

          </div>

        </div>
      </div>
    </teleport>
  </div>
</template>

<script>
import { Upload, X } from 'lucide-vue-next'

export default {
  name: 'ImageUpload',
  components: {
    Upload,
    X
  },
  props: {
    imageUrl: {
      type: String,
      default: ''
    },
    hasImage: {
      type: Boolean,
      default: false
    },
    uploading: {
      type: Boolean,
      default: false
    }
  },
  data() {
    return {
      imageInfo: {
        width: 0,
        height: 0
      },
      showModal: false,
      imageZoomed: false,
      isDragging: false,
      dragStart: { x: 0, y: 0 },
      imageTransform: { x: 0, y: 0, scale: 1 }
    }
  },
  emits: ['file-select', 'change-image'],
  mounted() {
    document.addEventListener('keydown', this.handleKeyDown)
  },
  beforeUnmount() {
    document.removeEventListener('keydown', this.handleKeyDown)
    document.body.classList.remove('modal-open')
  },
  methods: {
    handleFileSelect(event) {
      const file = event.target.files[0]
      if (file) {
        this.$emit('file-select', file)
      }
    },
    
    onImageLoad(event) {
      const img = event.target
      this.imageInfo = {
        width: img.naturalWidth,
        height: img.naturalHeight
      }
    },
    
    onImageError() {
      this.imageInfo = {
        width: 0,
        height: 0
      }
    },

    openModal() {
      this.showModal = true
      this.imageZoomed = false
      this.imageTransform = { x: 0, y: 0, scale: 1 }
      document.body.classList.add('modal-open')
      document.body.style.overflow = 'hidden'
    },
    
    closeModal() {
      this.showModal = false
      this.imageZoomed = false
      this.isDragging = false
      this.imageTransform = { x: 0, y: 0, scale: 1 }
      document.body.classList.remove('modal-open')
      document.body.style.overflow = ''
    },

    handleKeyDown(event) {
      if (event.key === 'Escape' && this.showModal) {
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
      if (this.showModal) {
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
      if (this.showModal && this.imageZoomed) {
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


  }
}
</script>

<style scoped>
.image-upload {
  width: 100%;
}

.upload-area {
  border: 2px dashed #dee2e6;
  border-radius: 0.375rem;
  padding: 1.5rem;
  text-align: center;
  background-color: #f8f9fa;
  transition: border-color 0.2s;
}

.upload-area:hover {
  border-color: #0d6efd;
}

.upload-content {
  display: flex;
  flex-direction: column;
  align-items: center;
}

.image-preview {
  position: relative;
  display: flex;
  flex-direction: column;
  align-items: center;
}

.image-container {
  position: relative;
  display: inline-block;
  border-radius: 0.375rem;
  overflow: hidden;
  box-shadow: 0 0.125rem 0.25rem rgba(0, 0, 0, 0.075);
  cursor: pointer;
  transition: transform 0.2s ease, box-shadow 0.2s ease;
}

.image-container:hover {
  transform: scale(1.02);
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.15);
}

.preview-image {
  max-width: 100%;
  max-height: 400px;
  display: block;
  cursor: pointer;
}

.upload-progress {
  text-align: center;
}

.progress {
  height: 0.5rem;
  background-color: #e9ecef;
  border-radius: 0.25rem;
  overflow: hidden;
}

.progress-bar {
  background-color: #007bff;
  transition: width 0.6s ease;
}

.image-info {
  text-align: center;
}

/* Стили для кнопок с иконками */
.btn {
  display: inline-flex;
  align-items: center;
}

.btn svg {
  flex-shrink: 0;
}

/* Стили модального окна */
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
  

  
  .modal-image.zoomed {
    transform: scale(1.3);
  }
}
</style> 