<template>
  <div class="analysis-porosity-page">
    <!-- Заголовок страницы -->
    <div class="row mb-4">
      <div class="col-12">
        <h1 class="h3 text-primary">
          <i class="fas fa-microscope me-2"></i>
          Анализ пористости поверхности
        </h1>
        <p class="text-muted">
          Модуль для автоматического анализа пористости изображений микроскопии
        </p>
      </div>
    </div>

    <!-- Навигационные вкладки -->
    <ul class="nav nav-tabs mb-4" id="analysisTab" role="tablist">
      <li class="nav-item" role="presentation">
        <button
          class="nav-link"
          :class="{ active: activeTab === 'list' }"
          @click="activeTab = 'list'"
          type="button"
        >
          <i class="fas fa-list me-2"></i>
          Мои анализы
          <span v-if="analyses.length > 0" class="badge bg-primary ms-2">{{ analyses.length }}</span>
        </button>
      </li>
      <li class="nav-item" role="presentation">
        <button
          class="nav-link"
          :class="{ active: activeTab === 'create' }"
          @click="activeTab = 'create'"
          type="button"
        >
          <i class="fas fa-plus me-2"></i>
          Новый анализ
        </button>
      </li>
      <li class="nav-item" role="presentation">
        <button
          class="nav-link"
          :class="{ active: activeTab === 'batch' }"
          @click="activeTab = 'batch'"
          type="button"
        >
          <i class="fas fa-layer-group me-2"></i>
          Пакетный анализ
        </button>
      </li>
    </ul>

    <!-- Содержимое вкладок -->
    <div class="tab-content">
      <!-- Вкладка списка анализов -->
      <div v-if="activeTab === 'list'" class="tab-pane fade show active">
        <AnalysisList
          :analyses="analyses"
          :loading="loading"
          @refresh="loadAnalyses"
          @view-results="viewAnalysisResults"
          @delete="deleteAnalysis"
        />
      </div>

      <!-- Вкладка создания нового анализа -->
      <div v-if="activeTab === 'create'" class="tab-pane fade show active">
        <CreateAnalysis
          @analysis-created="onAnalysisCreated"
        />
      </div>

      <!-- Вкладка пакетного анализа -->
      <div v-if="activeTab === 'batch'" class="tab-pane fade show active">
        <BatchAnalysis
          @analyses-created="onBatchAnalysesCreated"
        />
      </div>
    </div>

    <!-- Модальное окно с результатами анализа -->
    <AnalysisResultsModal
      v-if="selectedAnalysis"
      :analysis="selectedAnalysis"
      :show="showResultsModal"
      @hide="closeResultsModal"
    />
  </div>
</template>

<script>
import AnalysisList from './components/AnalysisList.vue'
import CreateAnalysis from './components/CreateAnalysis.vue'
import BatchAnalysis from './components/BatchAnalysis.vue'
import AnalysisResultsModal from './components/AnalysisResultsModal.vue'
import { porosityAnalysisApi } from '../../js/api/porosityAnalysisApi.js'

export default {
  name: 'AnalysisPorosityPage',
  components: {
    AnalysisList,
    CreateAnalysis,
    BatchAnalysis,
    AnalysisResultsModal
  },
  data() {
    return {
      activeTab: 'list',
      analyses: [],
      loading: false,
      selectedAnalysis: null,
      showResultsModal: false
    }
  },
  async mounted() {
    await this.loadAnalyses()
  },
  methods: {
    async loadAnalyses() {
      this.loading = true
      try {
        const response = await porosityAnalysisApi.getAnalyses()
        
        // Проверяем успешность ответа и структуру данных
        if (response.success && response.data) {
          if (Array.isArray(response.data)) {
            this.analyses = response.data
          } else if (Array.isArray(response.data.results)) {
            this.analyses = response.data.results
          } else {
            this.analyses = []
          }
        } else {
          this.analyses = []
        }
      } catch (error) {
        console.error('Ошибка загрузки анализов:', error)
        this.$toast.error('Ошибка загрузки списка анализов')
        this.analyses = []
      } finally {
        this.loading = false
      }
    },

    onAnalysisCreated(newAnalysis) {
      // Проверяем, что newAnalysis является объектом
      if (newAnalysis && typeof newAnalysis === 'object') {
        // Добавляем новый анализ в начало списка
        this.analyses.unshift(newAnalysis)
        
        // Переключаемся на вкладку со списком
        this.activeTab = 'list'
      } else {
        console.error('Неверный формат данных анализа:', newAnalysis)
        this.$toast.error('Ошибка обработки созданного анализа')
      }
    },

    onBatchAnalysesCreated(newAnalyses) {
      // Проверяем, что newAnalyses является массивом
      if (Array.isArray(newAnalyses) && newAnalyses.length > 0) {
        // Добавляем новые анализы в начало списка
        this.analyses.unshift(...newAnalyses)
        
        // Переключаемся на вкладку со списком
        this.activeTab = 'list'
        
        this.$toast.success(`Создано ${newAnalyses.length} анализов и запущена обработка`)
      } else {
        console.error('Неверный формат данных пакетных анализов:', newAnalyses)
        this.$toast.error('Ошибка обработки созданных анализов')
      }
    },

    async viewAnalysisResults(analysis) {
      try {
        // Загружаем полную информацию об анализе
        const response = await porosityAnalysisApi.getAnalysisDetail(analysis.id)
        if (response && response.success && response.data) {
          this.selectedAnalysis = response.data
          this.showResultsModal = true
        } else {
          this.$toast.error((response && response.message) || 'Ошибка загрузки результатов анализа')
        }
      } catch (error) {
        console.error('Ошибка загрузки результатов:', error)
        
        // Обрабатываем различные типы ошибок
        if (error && error.response && error.response.data && error.response.data.message) {
          this.$toast.error(error.response.data.message)
        } else if (error && error.message) {
          this.$toast.error(error.message)
        } else {
          this.$toast.error('Ошибка загрузки результатов анализа')
        }
      }
    },

    closeResultsModal() {
      this.showResultsModal = false
      this.selectedAnalysis = null
    },

    async deleteAnalysis(analysis) {
      if (!confirm(`Вы уверены, что хотите удалить анализ "${analysis.title}"?`)) {
        return
      }

      try {
        const response = await porosityAnalysisApi.deleteAnalysis(analysis.id)
        
        if (response && response.success) {
          // Удаляем из списка
          const index = this.analyses.findIndex(a => a.id === analysis.id)
          if (index !== -1) {
            this.analyses.splice(index, 1)
          }
          
          this.$toast.success('Анализ удален')
        } else {
          this.$toast.error((response && response.message) || 'Ошибка удаления анализа')
        }
      } catch (error) {
        console.error('Ошибка удаления анализа:', error)
        
        // Обрабатываем различные типы ошибок
        if (error && error.response && error.response.data && error.response.data.message) {
          this.$toast.error(error.response.data.message)
        } else if (error && error.message) {
          this.$toast.error(error.message)
        } else {
          this.$toast.error('Ошибка удаления анализа')
        }
      }
    }
  }
}
</script>

<style scoped>
.analysis-porosity-page {
  padding: 20px;
}

.nav-tabs .nav-link {
  color: #6c757d;
  border: none;
  border-bottom: 3px solid transparent;
  background: transparent;
}

.nav-tabs .nav-link:hover {
  color: #495057;
  border-bottom-color: #dee2e6;
}

.nav-tabs .nav-link.active {
  color: #0d6efd;
  border-bottom-color: #0d6efd;
  background: transparent;
}

.tab-content {
  min-height: 400px;
}
</style> 