<template>
  <div class="analysis-results">
    <div class="results-grid">
      <div class="result-item">
        <div class="result-value">{{ analysis.porosity_percentage?.toFixed(2) }}%</div>
        <div class="result-label">Пористость</div>
      </div>
      
      <div class="result-item">
        <div class="result-value">{{ analysis.number_of_pores }}</div>
        <div class="result-label">Количество пор</div>
      </div>
      
      <div class="result-item">
        <div class="result-value">{{ analysis.average_pore_size?.toFixed(2) }} мкм</div>
        <div class="result-label">Средний размер пор</div>
      </div>
      
      <div class="result-item">
        <div class="result-value">{{ analysis.max_pore_size?.toFixed(2) }} мкм</div>
        <div class="result-label">Максимальный размер пор</div>
      </div>
      
      <div class="result-item">
        <div class="result-value">{{ analysis.min_pore_size?.toFixed(2) }} мкм</div>
        <div class="result-label">Минимальный размер пор</div>
      </div>
      
      <div class="result-item">
        <div class="result-value">{{ analysis.pore_density?.toFixed(2) }}</div>
        <div class="result-label">Плотность пор (пор/мкм²)</div>
      </div>
      
      <div v-if="analysis.average_interpore_distance" class="result-item">
        <div class="result-value">{{ analysis.average_interpore_distance?.toFixed(2) }} мкм</div>
        <div class="result-label">Среднее межпоровое расстояние</div>
      </div>
    </div>
    
    <div v-if="showFiles && resultFiles.length > 0" class="row mt-4">
      <div class="col-12">
        <div class="card">
          <div class="card-header d-flex justify-content-between align-items-center">
            <h6 class="card-title mb-0">
              <FileText class="me-2" size="20" />
              Файлы результатов
            </h6>
                          <button
                type="button"
                class="btn btn-success btn-sm"
                @click="$emit('download-all')"
                :disabled="downloading"
              >
                <Download class="me-2" size="16" />
                {{ downloading ? 'Скачивание...' : 'Скачать все' }}
              </button>
          </div>
          <div class="card-body">
            <div class="row">
              <div
                v-for="file in resultFiles"
                :key="file.name"
                class="col-md-6 col-lg-4 mb-3"
              >
                <div class="file-card">
                  <div class="file-icon">
                    <ImageIcon size="20" />
                  </div>
                  <div class="file-info">
                    <div class="file-name">{{ file.name }}</div>
                    <div class="file-size">{{ (file.size_mb).toFixed(2) }} МБ</div>
                  </div>
                  <div class="file-actions">
                    <button
                      type="button"
                      class="btn btn-outline-primary btn-sm"
                      @click="$emit('download-file', file.path)"
                      title="Скачать файл"
                    >
                      <Download size="16" />
                    </button>
                  </div>
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
import { PieChart, FileText, Download, Image as ImageIcon } from 'lucide-vue-next'

export default {
  name: 'AnalysisResults',
  components: {
    PieChart,
    FileText,
    Download,
    ImageIcon
  },
  props: {
    analysis: {
      type: Object,
      required: true
    },
    resultFiles: {
      type: Array,
      default: () => []
    },
    showFiles: {
      type: Boolean,
      default: true
    },
    downloading: {
      type: Boolean,
      default: false
    }
  },
  emits: ['download-all', 'download-file'],
  methods: {
    formatDate(dateString) {
      const date = new Date(dateString)
      return date.toLocaleDateString('ru-RU', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      })
    }
  }
}
</script>

<style scoped>
.analysis-results {
  margin-top: 1rem;
  padding-top: 1rem;
}

/* Стили для кнопок с иконками */
.btn {
  display: inline-flex;
  align-items: center;
}

.btn svg {
  flex-shrink: 0;
}



.results-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 1rem;
  padding: 1rem 0;
}

.result-item {
  text-align: center;
  padding: 1.5rem;
  border: 1px solid #dee2e6;
  border-radius: 0.375rem;
  background-color: #f8f9fa;
  transition: transform 0.2s, box-shadow 0.2s;
  margin-bottom: 0;
  height: 120px;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
}

.result-item:hover {
  transform: translateY(-2px);
  box-shadow: 0 0.25rem 0.5rem rgba(0, 0, 0, 0.1);
}

.result-value {
  font-size: 1.25rem;
  font-weight: bold;
  color: #0d6efd;
  margin-bottom: 0.25rem;
}

.result-label {
  font-size: 0.8rem;
  color: #6c757d;
  text-align: center;
}



.file-card {
  display: flex;
  align-items: center;
  padding: 1rem;
  border: 1px solid #dee2e6;
  border-radius: 0.375rem;
  background-color: #fff;
  transition: box-shadow 0.2s;
  margin-bottom: 0.75rem;
}

.file-card:hover {
  box-shadow: 0 0.125rem 0.25rem rgba(0, 0, 0, 0.075);
}

.file-icon {
  font-size: 1.25rem;
  color: #0d6efd;
  margin-right: 0.75rem;
}

.file-info {
  flex: 1;
}

.file-name {
  font-weight: 500;
  color: #495057;
  margin-bottom: 0.125rem;
  font-size: 0.9rem;
}

.file-size {
  font-size: 0.8rem;
  color: #6c757d;
}

.file-actions {
  margin-left: 0.75rem;
}

.card {
  box-shadow: 0 0.125rem 0.25rem rgba(0, 0, 0, 0.075);
  border: 1px solid rgba(0, 0, 0, 0.125);
}

.card-header {
  background-color: #f8f9fa;
  border-bottom: 1px solid rgba(0, 0, 0, 0.125);
}

.card-header .card-title {
  display: flex;
  align-items: center;
  margin-bottom: 0;
}

.card-header .card-title svg {
  flex-shrink: 0;
}

/* Стили для равных карточек */
.row {
  display: flex;
  flex-wrap: wrap;
}

.row > [class*="col-"] {
  display: flex;
  flex-direction: column;
}

.card.h-100 {
  height: 100% !important;
  display: flex;
  flex-direction: column;
}

.card.h-100 .card-body {
  flex: 1;
  display: flex;
  flex-direction: column;
}

.card-body {
  padding: 1.5rem;
}

.card-body .row {
  margin-bottom: 1.5rem;
}
</style> 