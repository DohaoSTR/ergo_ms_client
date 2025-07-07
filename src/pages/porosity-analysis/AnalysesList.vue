<template>
  <div class="porosity-analyses-list">
    <!-- Модальное окно подтверждения удаления -->
    <ConfirmDialog
      :show="showDeleteConfirm"
      title="Удаление анализа"
      message="Вы уверены, что хотите удалить этот анализ? Это действие нельзя отменить."
      confirm-text="Удалить"
      cancel-text="Отмена"
      variant="danger"
      :loading="deletingAnalysis !== null"
      @confirm="confirmDeleteAnalysis"
      @cancel="cancelDeleteAnalysis"
      @close="cancelDeleteAnalysis"
    />
    
    <div class="row">
      <div class="col-12">
        <div class="card">
          <div class="card-header d-flex justify-content-between align-items-center">
            <h4 class="card-title mb-0">
              <List class="me-2" size="20" />
              Список анализируемых образцов
            </h4>

            <div class="d-flex align-items-center gap-3">
              <div class="filter-buttons">
                <button
                  type="button"
                  class="filter-btn"
                  :class="{ active: currentFilter === 'all' }"
                  data-filter="all"
                  @click="setFilter('all')"
                >
                  <List class="me-1" size="16" />
                  Все
                </button>
                <button
                  type="button"
                  class="filter-btn"
                  :class="{ active: currentFilter === 'pending' }"
                  data-filter="pending"
                  @click="setFilter('pending')"
                >
                  <Clock class="me-1" size="16" />
                  Ожидающие
                </button>
                <button
                  type="button"
                  class="filter-btn"
                  :class="{ active: currentFilter === 'processing' }"
                  data-filter="processing"
                  @click="setFilter('processing')"
                >
                  <Loader2 class="me-1" size="16" />
                  Обрабатываются
                </button>
                <button
                  type="button"
                  class="filter-btn"
                  :class="{ active: currentFilter === 'completed' }"
                  data-filter="completed"
                  @click="setFilter('completed')"
                >
                  <CheckCircle class="me-1" size="16" />
                  Завершенные
                </button>
                <button
                  type="button"
                  class="filter-btn"
                  :class="{ active: currentFilter === 'failed' }"
                  data-filter="failed"
                  @click="setFilter('failed')"
                >
                  <AlertTriangle class="me-1" size="16" />
                  Ошибки
                </button>
              </div>
              
              <div class="bulk-actions">
                <button
                  v-if="failedAnalyses.length > 0"
                  type="button"
                  class="btn btn-warning btn-sm"
                  @click="restartFailedAnalyses"
                  :disabled="restartingMultiple"
                >
                  <RotateCcw class="me-1" size="16" />
                  {{ restartingMultiple ? 'Перезапуск...' : `Перезапустить ошибки (${failedAnalyses.length})` }}
                </button>
              </div>
            </div>
          </div>
          <div class="card-body">
            <div v-if="loading" class="text-center py-4">
              <div class="spinner-border" role="status">
                <span class="visually-hidden">Загрузка...</span>
              </div>
            </div>
            
            <div v-else-if="filteredAnalyses.length === 0" class="text-center py-4">
              <Inbox class="text-muted mb-3" size="48" />
              <h5 class="text-muted">Анализы не найдены</h5>
              <p class="text-muted">Создайте первый анализ для начала работы</p>
              <router-link to="/porosity-analysis" class="btn btn-primary">
                <Plus class="me-2" size="16" />
                Создать анализ
              </router-link>
            </div>
            
            <div v-else class="row">
              <div
                v-for="analysis in filteredAnalyses"
                :key="analysis.id"
                class="col-md-6 col-lg-4 mb-4"
              >
                <div class="analysis-card">
                  <div class="card-header">
                    <div class="d-flex justify-content-between align-items-start">
                      <h6 class="card-title mb-0">{{ analysis.name }}</h6>
                      <span :class="getStatusBadgeClass(analysis.status)">
                        <component :is="getStatusIcon(analysis.status)" class="me-1" size="14" />
                        {{ getStatusText(analysis.status) }}
                      </span>
                    </div>
                  </div>
                  <div class="card-body">
                    <p class="card-text text-muted small">
                      {{ analysis.description || 'Описание отсутствует' }}
                    </p>
                    
                    <div class="analysis-info">
                      <div class="info-row">
                        <div class="info-item">
                          <Calendar class="me-1" size="14" />
                          <small class="text-muted">Создан:</small>
                          <div>{{ formatDate(analysis.created_at) }}</div>
                        </div>
                        <div class="info-item">
                          <Ruler class="me-1" size="14" />
                          <small class="text-muted">Шкала:</small>
                          <div>{{ analysis.scale_value }} мкм</div>
                        </div>
                      </div>
                      
                      <div v-if="analysis.status === 'completed'" class="results-row">
                        <div class="info-item">
                          <BarChart3 class="me-1" size="14" />
                          <small class="text-muted">Пористость:</small>
                          <div class="fw-bold text-success">{{ analysis.porosity_percentage?.toFixed(2) }}%</div>
                        </div>
                        <div class="info-item">
                          <CircleDot class="me-1" size="14" />
                          <small class="text-muted">Пор:</small>
                          <div class="fw-bold">{{ analysis.number_of_pores }}</div>
                        </div>
                      </div>
                      
                      <div v-if="analysis.status === 'failed'" class="error-row">
                        <div class="alert alert-danger small mb-0">
                          <AlertTriangle class="me-1" size="14" />
                          {{ analysis.error_message || 'Неизвестная ошибка' }}
                        </div>
                      </div>
                    </div>
                  </div>
                  <div class="card-footer">
                    <div class="action-buttons">
                      <router-link
                        :to="`/porosity-analysis/analysis/${analysis.id}`"
                        class="action-btn primary"
                      >
                        <Eye class="me-1" size="16" />
                        Просмотр
                      </router-link>
                      
                      <button
                        v-if="analysis.status === 'failed'"
                        type="button"
                        class="action-btn warning"
                        @click="restartAnalysis(analysis.id)"
                        :disabled="restartingAnalysis === analysis.id"
                        title="Перезапустить анализ с ошибкой"
                      >
                        <RotateCcw class="me-1" size="16" />
                        {{ restartingAnalysis === analysis.id ? 'Перезапуск...' : 'Перезапустить' }}
                      </button>
                      
                      <button
                        v-if="analysis.status === 'completed'"
                        type="button"
                        class="action-btn info"
                        @click="restartAnalysis(analysis.id)"
                        :disabled="restartingAnalysis === analysis.id"
                        title="Перезапустить завершенный анализ"
                      >
                        <RotateCcw class="me-1" size="16" />
                        {{ restartingAnalysis === analysis.id ? 'Перезапуск...' : 'Перезапустить' }}
                      </button>
                      
                      <button
                        v-if="analysis.status === 'pending'"
                        type="button"
                        class="action-btn secondary"
                        @click="restartAnalysis(analysis.id)"
                        :disabled="restartingAnalysis === analysis.id"
                        title="Перезапустить ожидающий анализ"
                      >
                        <RotateCcw class="me-1" size="16" />
                        {{ restartingAnalysis === analysis.id ? 'Перезапуск...' : 'Перезапустить' }}
                      </button>
                      
                      <div v-if="analysis.status === 'completed'" class="dropdown d-inline-block">
                        <button
                          type="button"
                          class="action-btn success dropdown-toggle"
                          data-bs-toggle="dropdown"
                          aria-expanded="false"
                          :disabled="downloadingAnalysis === analysis.id"
                        >
                          <Download class="me-1" size="16" />
                          {{ downloadingAnalysis === analysis.id ? 'Скачивание...' : 'Скачать' }}
                        </button>
                        <ul class="dropdown-menu">
                          <li>
                            <a class="dropdown-item" href="#" @click.prevent="downloadResults(analysis.id)">
                              <Download class="me-2" size="16" />
                              Архив результатов
                            </a>
                          </li>
                          <li>
                            <a class="dropdown-item" href="#" @click.prevent="downloadReport(analysis.id, 'pdf')">
                              <FileText class="me-2" size="16" />
                              PDF отчет
                            </a>
                          </li>
                          <li>
                            <a class="dropdown-item" href="#" @click.prevent="downloadReport(analysis.id, 'docx')">
                              <FileText class="me-2" size="16" />
                              Word отчет
                            </a>
                          </li>
                        </ul>
                      </div>
                      
                      <button
                        type="button"
                        class="action-btn danger"
                        @click="deleteAnalysis(analysis.id)"
                        :disabled="deletingAnalysis === analysis.id"
                      >
                        <Trash2 class="me-1" size="16" />
                        {{ deletingAnalysis === analysis.id ? 'Удаление...' : 'Удалить' }}
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
  </div>
</template>

<script>
import { porosityAnalysisAPI } from './js/porosity-analysis.js'
import ConfirmDialog from '@/components/ConfirmDialog.vue'
import { 
  List, Clock, Loader2, CheckCircle, AlertTriangle, Inbox, Plus, 
  Calendar, Ruler, BarChart3, CircleDot, Eye, RotateCcw, Download, Trash2, FileText
} from 'lucide-vue-next'

export default {
  name: 'PorosityAnalysesList',
  components: {
    ConfirmDialog,
    List, Clock, Loader2, CheckCircle, AlertTriangle, Inbox, Plus,
    Calendar, Ruler, BarChart3, CircleDot, Eye, RotateCcw, Download, Trash2, FileText
  },
  data() {
    return {
      analyses: [],
      loading: true,
      currentFilter: 'all',
      restartingAnalysis: null,
      downloadingAnalysis: null,
      deletingAnalysis: null,
      showDeleteConfirm: false,
      analysisToDelete: null,
      restartingMultiple: false
    }
  },
  computed: {
    filteredAnalyses() {
      if (this.currentFilter === 'all') {
        return this.analyses
      }
      return this.analyses.filter(analysis => analysis.status === this.currentFilter)
    },
    
    failedAnalyses() {
      return this.analyses.filter(analysis => analysis.status === 'failed')
    }
  },
  async mounted() {
    await this.loadAnalyses()
  },
  methods: {
    async loadAnalyses() {
      this.loading = true
      try {
        const response = await porosityAnalysisAPI.getAnalyses()
        if (response && response.success && response.data) {
          this.analyses = response.data.results || response.data || []
        } else {
          this.$toast.error(response?.message || 'Ошибка при загрузке анализов')
          this.analyses = []
        }
      } catch (error) {
        let errorMessage = 'Ошибка при загрузке анализов'
        if (error && typeof error === 'object') {
          if (error.response && error.response.data) {
            errorMessage = error.response.data.message || error.response.data.detail || errorMessage
          } else if (error.message) {
            errorMessage = error.message
          }
        }
        this.$toast.error(errorMessage)
        // Устанавливаем пустой массив при ошибке
        this.analyses = []
      } finally {
        this.loading = false
      }
    },
    
    setFilter(filter) {
      this.currentFilter = filter
    },
    
    getStatusBadgeClass(status) {
      const classes = {
        pending: 'badge badge-warning',
        processing: 'badge badge-info',
        completed: 'badge badge-success',
        failed: 'badge badge-danger'
      }
      return classes[status] || 'badge badge-secondary'
    },
    
    getStatusIcon(status) {
      const icons = {
        pending: 'Clock',
        processing: 'Loader2',
        completed: 'CheckCircle',
        failed: 'AlertTriangle'
      }
      return icons[status] || 'HelpCircle'
    },
    
    getStatusText(status) {
      const texts = {
        pending: 'Ожидает',
        processing: 'Обрабатывается',
        completed: 'Завершен',
        failed: 'Ошибка'
      }
      return texts[status] || status
    },
    
    formatDate(dateString) {
      const date = new Date(dateString)
      return date.toLocaleDateString('ru-RU', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      })
    },
    
    async restartAnalysis(analysisId) {
      this.restartingAnalysis = analysisId
      try {
        const response = await porosityAnalysisAPI.restartAnalysis(analysisId)
        if (response && response.success) {
          this.$toast.success('Анализ перезапущен')
          
          // Немедленно обновляем статус анализа в списке
          const analysisIndex = this.analyses.findIndex(a => a.id === analysisId)
          if (analysisIndex !== -1) {
            this.analyses[analysisIndex].status = 'pending'
            this.analyses[analysisIndex].updated_at = new Date().toISOString()
          }
          
          // Обновляем список в фоне с обработкой ошибок
          try {
            await this.loadAnalyses()
          } catch (error) {
            console.warn('Ошибка при обновлении списка анализов:', error)
            // Не показываем ошибку пользователю, так как основной функционал работает
          }
        } else {
          this.$toast.error((response && response.message) ? response.message : 'Ошибка при перезапуске анализа')
        }
      } catch (error) {
        let errorMessage = 'Ошибка при перезапуске анализа'
        if (error && typeof error === 'object') {
          if (error.response && error.response.data) {
            errorMessage = error.response.data.message || error.response.data.detail || errorMessage
          } else if (error.message) {
            errorMessage = error.message
          }
        }
        this.$toast.error(errorMessage)
      } finally {
        this.restartingAnalysis = null
      }
    },
    
    async restartFailedAnalyses() {
      if (this.failedAnalyses.length === 0) {
        this.$toast.warning('Нет анализов с ошибками для перезапуска')
        return
      }
      
      this.restartingMultiple = true
      try {
        const response = await porosityAnalysisAPI.restartMultipleAnalyses({
          status: 'failed'
        })
        
        if (response && response.success) {
          this.$toast.success(`Перезапущено ${response.restarted_count} анализов`)
          
          // Немедленно обновляем статусы анализов в списке
          this.failedAnalyses.forEach(analysis => {
            const analysisIndex = this.analyses.findIndex(a => a.id === analysis.id)
            if (analysisIndex !== -1) {
              this.analyses[analysisIndex].status = 'pending'
              this.analyses[analysisIndex].updated_at = new Date().toISOString()
            }
          })
          
          // Обновляем список в фоне
          try {
            await this.loadAnalyses()
          } catch (error) {
            console.warn('Ошибка при обновлении списка анализов:', error)
          }
        } else {
          this.$toast.error((response && response.message) ? response.message : 'Ошибка при массовом перезапуске')
        }
      } catch (error) {
        let errorMessage = 'Ошибка при массовом перезапуске'
        if (error && typeof error === 'object') {
          if (error.response && error.response.data) {
            errorMessage = error.response.data.message || error.response.data.detail || errorMessage
          } else if (error.message) {
            errorMessage = error.message
          }
        }
        this.$toast.error(errorMessage)
      } finally {
        this.restartingMultiple = false
      }
    },
    
    async downloadResults(analysisId) {
      this.downloadingAnalysis = analysisId
      try {
        const response = await porosityAnalysisAPI.getDownloadResults(analysisId)
        if (response && response.success) {
          // Создаем ссылку для скачивания ZIP архива
          const url = window.URL.createObjectURL(response.data)
          const link = document.createElement('a')
          link.href = url
          link.download = `analysis_${analysisId}_results.zip`
          document.body.appendChild(link)
          link.click()
          document.body.removeChild(link)
          window.URL.revokeObjectURL(url)
          
          if (this.$toast && this.$toast.success) {
            this.$toast.success('Архив с результатами скачивается')
          }
        } else {
          if (this.$toast && this.$toast.error) {
            this.$toast.error((response && response.message) ? response.message : 'Ошибка при скачивании результатов')
          }
        }
      } catch (error) {
        let errorMessage = 'Ошибка при скачивании результатов'
        if (error && typeof error === 'object') {
          if (error.response && error.response.data) {
            errorMessage = error.response.data.message || error.response.data.detail || errorMessage
          } else if (error.message) {
            errorMessage = error.message
          }
        }
        if (this.$toast && this.$toast.error) {
          this.$toast.error(errorMessage)
        }
      } finally {
        this.downloadingAnalysis = null
      }
    },
    
    deleteAnalysis(analysisId) {
      this.analysisToDelete = analysisId
      this.showDeleteConfirm = true
    },
    
    async confirmDeleteAnalysis() {
      if (!this.analysisToDelete) return
      
      this.deletingAnalysis = this.analysisToDelete
      try {
        const response = await porosityAnalysisAPI.deleteAnalysis(this.analysisToDelete)
        
        // Проверяем успешность удаления - учитываем разные форматы ответов
        const isSuccess = response && (
          response.success === true || 
          response.status === 204 || 
          response.status === 200 ||
          (response.data && response.data.success === true)
        )
        
        if (isSuccess) {
          this.$toast.success('Анализ удален')
          
          // Немедленно удаляем анализ из списка
          this.analyses = this.analyses.filter(analysis => analysis.id !== this.analysisToDelete)
          
          // Пытаемся обновить список в фоне, но не блокируем UI
          this.loadAnalyses().catch(() => {
            // Игнорируем ошибки при обновлении списка
          })
        } else {
          const errorMsg = (response && response.message) ? response.message : 'Ошибка при удалении анализа'
          this.$toast.error(errorMsg)
        }
      } catch (error) {
        let errorMessage = 'Ошибка при удалении анализа'
        if (error && typeof error === 'object') {
          if (error.response && error.response.data) {
            errorMessage = error.response.data.message || error.response.data.detail || errorMessage
          } else if (error.message) {
            errorMessage = error.message
          }
        }
        this.$toast.error(errorMessage)
      } finally {
        this.deletingAnalysis = null
        this.showDeleteConfirm = false
        this.analysisToDelete = null
      }
    },
    
    cancelDeleteAnalysis() {
      this.showDeleteConfirm = false
      this.analysisToDelete = null
    },
    
    async downloadReport(analysisId, reportType) {
      this.downloadingAnalysis = analysisId
      try {
        console.log(`Downloading report type: ${reportType} for analysis: ${analysisId}`)
        
        // Используем API клиент для скачивания файла
        const response = await porosityAnalysisAPI.downloadReport(analysisId, reportType)
        
        if (response && response.success && response.data) {
          // Создаем blob из данных
          const blob = new Blob([response.data], {
            type: reportType === 'pdf' ? 'application/pdf' : 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
          })
          
          // Создаем ссылку для скачивания
          const url = window.URL.createObjectURL(blob)
          const link = document.createElement('a')
          link.href = url
          link.download = `porosity_analysis_${analysisId}_${new Date().toISOString().split('T')[0]}.${reportType}`
          
          // Добавляем ссылку в DOM, кликаем и удаляем
          document.body.appendChild(link)
          link.click()
          document.body.removeChild(link)
          
          // Освобождаем URL
          window.URL.revokeObjectURL(url)
          
          this.$toast.success(`Отчет ${reportType.toUpperCase()} скачивается`)
        } else {
          throw new Error((response && response.message) ? response.message : 'Ошибка при скачивании отчета')
        }
      } catch (error) {
        console.error('Download error:', error)
        this.$toast.error(error.message || 'Ошибка при скачивании отчета')
      } finally {
        this.downloadingAnalysis = null
      }
    }
  }
}
</script>

<style scoped>
.porosity-analyses-list {
  padding: 20px 0;
}

.filter-buttons {
  display: flex;
  gap: 0.5rem;
  flex-wrap: wrap;
}

.filter-btn {
  display: flex;
  align-items: center;
  padding: 0.5rem 1rem;
  border: 1px solid #dee2e6;
  background-color: #fff;
  color: #6c757d;
  border-radius: 0.375rem;
  font-size: 0.875rem;
  font-weight: 500;
  transition: all 0.2s ease;
  text-decoration: none;
  cursor: pointer;
}

/* Цветные стили для кнопок фильтров */
.filter-btn[data-filter="all"] {
  border-color: #6c757d;
  color: #6c757d;
}

.filter-btn[data-filter="all"]:hover {
  background-color: #6c757d;
  border-color: #6c757d;
  color: #fff;
  transform: translateY(-1px);
}

.filter-btn[data-filter="all"].active {
  background-color: #6c757d;
  border-color: #6c757d;
  color: #fff;
  box-shadow: 0 2px 4px rgba(108, 117, 125, 0.3);
}

.filter-btn[data-filter="pending"] {
  border-color: #ffc107;
  color: #856404;
}

.filter-btn[data-filter="pending"]:hover {
  background-color: #ffc107;
  border-color: #ffc107;
  color: #212529;
  transform: translateY(-1px);
}

.filter-btn[data-filter="pending"].active {
  background-color: #ffc107;
  border-color: #ffc107;
  color: #212529;
  box-shadow: 0 2px 4px rgba(255, 193, 7, 0.3);
}

.filter-btn[data-filter="processing"] {
  border-color: #17a2b8;
  color: #0c5460;
}

.filter-btn[data-filter="processing"]:hover {
  background-color: #17a2b8;
  border-color: #17a2b8;
  color: #fff;
  transform: translateY(-1px);
}

.filter-btn[data-filter="processing"].active {
  background-color: #17a2b8;
  border-color: #17a2b8;
  color: #fff;
  box-shadow: 0 2px 4px rgba(23, 162, 184, 0.3);
}

.filter-btn[data-filter="completed"] {
  border-color: #28a745;
  color: #155724;
}

.filter-btn[data-filter="completed"]:hover {
  background-color: #28a745;
  border-color: #28a745;
  color: #fff;
  transform: translateY(-1px);
}

.filter-btn[data-filter="completed"].active {
  background-color: #28a745;
  border-color: #28a745;
  color: #fff;
  box-shadow: 0 2px 4px rgba(40, 167, 69, 0.3);
}

.filter-btn[data-filter="failed"] {
  border-color: #dc3545;
  color: #721c24;
}

.filter-btn[data-filter="failed"]:hover {
  background-color: #dc3545;
  border-color: #dc3545;
  color: #fff;
  transform: translateY(-1px);
}

.filter-btn[data-filter="failed"].active {
  background-color: #dc3545;
  border-color: #dc3545;
  color: #fff;
  box-shadow: 0 2px 4px rgba(220, 53, 69, 0.3);
}

.analysis-card {
  background: #fff;
  border: 1px solid #e9ecef;
  border-radius: 0.5rem;
  transition: all 0.3s ease;
  height: 100%;
  display: flex;
  flex-direction: column;
  max-width: 480px;
  margin: 0 auto;
}

.analysis-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 8px 25px rgba(0, 0, 0, 0.15);
  border-color: #007bff;
}

.card-header {
  background: linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%);
  border-bottom: 1px solid #e9ecef;
  padding: 1rem;
  border-radius: 0.5rem 0.5rem 0 0;
}

.card-title {
  font-weight: 600;
  color: #212529;
  margin: 0;
  line-height: 1.2;
}

.badge {
  display: inline-flex;
  align-items: center;
  padding: 0.25rem 0.75rem;
  font-size: 0.75rem;
  font-weight: 500;
  border-radius: 1rem;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.badge-warning {
  background-color: #fff3cd;
  color: #856404;
  border: 1px solid #ffeaa7;
}

.badge-info {
  background-color: #d1ecf1;
  color: #0c5460;
  border: 1px solid #bee5eb;
}

.badge-success {
  background-color: #d4edda;
  color: #155724;
  border: 1px solid #c3e6cb;
}

.badge-danger {
  background-color: #f8d7da;
  color: #721c24;
  border: 1px solid #f5c6cb;
}

/* Стили для цветных иконок в статусах */
.badge svg {
  flex-shrink: 0;
  margin-right: 0.25rem;
}

.badge-warning svg {
  color: #ffc107;
}

.badge-info svg {
  color: #17a2b8;
}

.badge-success svg {
  color: #28a745;
}

.badge-danger svg {
  color: #dc3545;
}

/* Дополнительные стили для иконок в фильтрах */
.filter-btn svg {
  flex-shrink: 0;
  margin-right: 0.25rem;
}

/* Цветные иконки для фильтров */
.filter-btn[data-filter="all"] svg {
  color: #6c757d;
}

.filter-btn[data-filter="all"]:hover svg,
.filter-btn[data-filter="all"].active svg {
  color: #fff;
}

.filter-btn[data-filter="pending"] svg {
  color: #856404;
}

.filter-btn[data-filter="pending"]:hover svg,
.filter-btn[data-filter="pending"].active svg {
  color: #212529;
}

.filter-btn[data-filter="processing"] svg {
  color: #0c5460;
}

.filter-btn[data-filter="processing"]:hover svg,
.filter-btn[data-filter="processing"].active svg {
  color: #fff;
}

.filter-btn[data-filter="completed"] svg {
  color: #155724;
}

.filter-btn[data-filter="completed"]:hover svg,
.filter-btn[data-filter="completed"].active svg {
  color: #fff;
}

.filter-btn[data-filter="failed"] svg {
  color: #721c24;
}

.filter-btn[data-filter="failed"]:hover svg,
.filter-btn[data-filter="failed"].active svg {
  color: #fff;
}

/* Стили для иконок в кнопках действий */
.action-btn svg {
  flex-shrink: 0;
  margin-right: 0.25rem;
}

/* Специальные цвета для иконок в кнопках */
.action-btn.primary svg {
  color: #fff;
}

.action-btn.warning svg {
  color: #212529;
}

.action-btn.success svg {
  color: #fff;
}

.action-btn.danger svg {
  color: #fff;
}

.action-btn.info svg {
  color: #fff;
}

.action-btn.secondary svg {
  color: #fff;
}

/* Стили для кнопки массового перезапуска */
.bulk-actions .btn svg {
  flex-shrink: 0;
  margin-right: 0.25rem;
  color: #212529;
}

.bulk-actions .btn:hover svg {
  color: #212529;
}

.bulk-actions .btn:disabled svg {
  color: #6c757d;
}

.card-body {
  padding: 1rem;
  flex-grow: 1;
  display: flex;
  flex-direction: column;
}

.card-text {
  margin-bottom: 1rem;
  line-height: 1.5;
}

.analysis-info {
  margin-top: auto;
}

.info-row, .results-row {
  display: flex;
  gap: 1rem;
  margin-bottom: 0.75rem;
}

.info-item {
  flex: 1;
  display: flex;
  flex-direction: row;
  align-items: center;
  gap: 0.1rem;
  margin-bottom: 0.25rem;
  flex-wrap: wrap;
}

.info-item .lucide {
  min-width: 18px;
  min-height: 18px;
  width: 18px;
  height: 18px;
  margin-right: 0.15rem;
  display: inline-block;
  vertical-align: middle;
  color: #6c757d;
}

/* Цветные иконки для информационных блоков */
.info-item .lucide[data-icon="calendar"] {
  color: #17a2b8;
}

.info-item .lucide[data-icon="ruler"] {
  color: #6f42c1;
}

.info-item .lucide[data-icon="bar-chart-3"] {
  color: #28a745;
}

.info-item .lucide[data-icon="circle-dot"] {
  color: #fd7e14;
}

.info-item .lucide[data-icon="alert-triangle"] {
  color: #dc3545;
}

.info-item .date-text {
  font-size: 0.8em;
  word-break: break-all;
}

.info-item small {
  font-size: 0.75rem;
  margin-bottom: 0;
}

.info-item div {
  font-size: 0.875rem;
  font-weight: 500;
}

.error-row {
  margin-top: 0.75rem;
}

.card-footer {
  padding: 1rem;
  background-color: #f8f9fa;
  border-top: 1px solid #e9ecef;
  border-radius: 0 0 0.5rem 0.5rem;
}

.action-buttons {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(140px, 1fr));
  gap: 0.5rem;
  width: 100%;
}

.action-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 0.5rem 0.75rem;
  border: 1px solid transparent;
  border-radius: 0.375rem;
  font-size: 0.875rem;
  font-weight: 500;
  text-decoration: none;
  cursor: pointer;
  transition: all 0.2s ease;
  width: 100%;
  height: 40px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  min-width: 0;
  text-align: center;
  line-height: 1.2;
}

.action-btn:hover {
  transform: translateY(-1px);
  text-decoration: none;
}

.action-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
  transform: none;
}

.action-btn.primary {
  background-color: #007bff;
  color: #fff;
  border-color: #007bff;
}

.action-btn.primary:hover {
  background-color: #0056b3;
  border-color: #0056b3;
  color: #fff;
}

.action-btn.warning {
  background-color: #ffc107;
  color: #212529;
  border-color: #ffc107;
}

.action-btn.warning:hover {
  background-color: #e0a800;
  border-color: #e0a800;
  color: #212529;
}

.action-btn.success {
  background-color: #28a745;
  color: #fff;
  border-color: #28a745;
}

.action-btn.success:hover {
  background-color: #218838;
  border-color: #218838;
  color: #fff;
}

.action-btn.danger {
  background-color: #dc3545;
  color: #fff;
  border-color: #dc3545;
}

.action-btn.danger:hover {
  background-color: #c82333;
  border-color: #c82333;
  color: #fff;
}

.action-btn.info {
  background-color: #17a2b8;
  color: #fff;
  border-color: #17a2b8;
}

.action-btn.info:hover {
  background-color: #138496;
  border-color: #138496;
  color: #fff;
}

.action-btn.secondary {
  background-color: #6c757d;
  color: #fff;
  border-color: #6c757d;
}

.action-btn.secondary:hover {
  background-color: #5a6268;
  border-color: #5a6268;
  color: #fff;
}

@media (max-width: 768px) {
  .filter-buttons {
    flex-direction: column;
    width: 100%;
  }
  
  .filter-btn {
    justify-content: center;
  }
  
  .action-buttons {
    grid-template-columns: 1fr;
    gap: 0.5rem;
  }
  
  .info-row, .results-row {
    flex-direction: column;
    gap: 0.5rem;
  }
  
  .action-btn {
    width: 100%;
    justify-content: center;
    height: 44px; /* Увеличиваем высоту для лучшего тапа на мобильных */
  }
  
  .analysis-card .dropdown {
    width: 100%;
  }
  
  /* Улучшение отображения кнопок перезапуска на мобильных */
  .action-btn[title*="Перезапустить"] {
    font-size: 0.8rem;
    padding: 0.4rem 0.8rem;
  }
}

/* Стили для dropdown меню в карточках анализов */
.analysis-card .dropdown {
  width: 100%;
  display: block;
}

.analysis-card .dropdown .action-btn {
  width: 100%;
}

.analysis-card .dropdown-menu {
  min-width: 180px;
  margin-top: 0.25rem;
}

/* Дополнительные стили для grid-сетки кнопок */
.action-buttons > * {
  width: 100%;
}

.analysis-card .dropdown-item {
  display: flex;
  align-items: center;
  padding: 0.5rem 1rem;
  font-size: 0.875rem;
}

.analysis-card .dropdown-item svg {
  flex-shrink: 0;
  margin-right: 0.5rem;
  color: #6c757d;
}

.analysis-card .dropdown-item:hover {
  background-color: #f8f9fa;
}

.analysis-card .dropdown-item:hover svg {
  color: #495057;
}

/* Стиль для кнопки с dropdown */
.action-btn.dropdown-toggle::after {
  margin-left: 0.5rem;
}
</style> 