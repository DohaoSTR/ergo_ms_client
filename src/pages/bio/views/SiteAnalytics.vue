<script setup>
import { computed, ref } from 'vue'
import ScalesChart from '@/pages/bio/components/charts/ScalesChart.vue'
import SpectrumChart from '@/pages/bio/components/charts/SpectrumChart.vue'
import ClassificationCard from '@/pages/bio/components/charts/ClassificationCard.vue'
import { SCALES_TYPES, SPECTRUM_TYPES } from '@/pages/bio/js/bio-constants'
import { CircleAlert, Info } from 'lucide-vue-next'

const props = defineProps({
  descriptions: { type: Array, required: true },
  isLoading: { type: Boolean, default: false },
  analyticsData: { 
    type: Object, 
    required: true,
    default: () => ({
      scales: {},
      spectra: {},
      classification: { data: [], isLoading: false, error: null }
    })
  }
})

// Локальные данные
const error = ref(null)

// Проверка наличия описаний растений с учётом состояния загрузки
const noSpeciesData = computed(() => 
  // Показываем "Нет данных" только если не идет загрузка И описания действительно пусты
  !props.isLoading && props.descriptions.length === 0
)

// Параметры отображения графиков
const showClassification = ref(true)
const showScales = ref(true)
const showSpectra = ref(true)
const activeTab = ref('all') // 'all', 'classification', 'scales', 'spectra'

// Переключение вкладок
const setActiveTab = (tab) => {
  activeTab.value = tab

  if (tab === 'all') {
    showClassification.value = true
    showScales.value = true
    showSpectra.value = true
  } else if (tab === 'classification') {
    showClassification.value = true
    showScales.value = false
    showSpectra.value = false
  } else if (tab === 'scales') {
    showClassification.value = false
    showScales.value = true
    showSpectra.value = false
  } else if (tab === 'spectra') {
    showClassification.value = false
    showScales.value = false
    showSpectra.value = true
  }
}

const computeClass = (index, total) => {
  if (total === 1) {
    return 'col-12'
  }
  if (total % 2 !== 0 && index === total - 1) {
    return 'col-12'
  }
  return 'col-12 col-lg-6'
}
</script>

<template>
  <!-- Error Display -->
  <div v-if="error" class="alert alert-danger mb-4">
    <div class="d-flex align-items-center gap-3">
      <CircleAlert :size="24" />
      <div>{{ error }}</div>
    </div>
  </div>

  <!-- No Species Data Warning -->
  <div v-if="noSpeciesData" class="alert alert-info mb-4">
    <div class="d-flex align-items-center gap-3">
      <Info :size="24" />
      <div>
        <strong>Нет данных для анализа.</strong>
        <p class="mb-0">
          На данной площадке отсутствуют описание растительности. Добавьте описание растительности во вкладке "Описание растительности",
          чтобы увидеть аналитику.
        </p>
      </div>
    </div>
  </div>

  <div v-else class="card p-0">
    <div class="card-header analytics-header">
      <div class="d-flex justify-content-between align-items-center">
        <h5 class="mb-0">Аналитика и графики</h5>
        <div class="btn-group">
          <button
            type="button"
            class="btn btn-sm"
            :class="activeTab === 'all' ? 'btn-light' : 'btn-outline-light'"
            @click="setActiveTab('all')"
          >
            Все
          </button>
          <button
            type="button"
            class="btn btn-sm"
            :class="activeTab === 'classification' ? 'btn-light' : 'btn-outline-light'"
            @click="setActiveTab('classification')"
          >
            Сообщество
          </button>
          <button
            type="button"
            class="btn btn-sm"
            :class="activeTab === 'scales' ? 'btn-light' : 'btn-outline-light'"
            @click="setActiveTab('scales')"
          >
            Шкалы
          </button>
          <button
            type="button"
            class="btn btn-sm"
            :class="activeTab === 'spectra' ? 'btn-light' : 'btn-outline-light'"
            @click="setActiveTab('spectra')"
          >
            Спектры
          </button>
        </div>
      </div>
    </div>
    <div class="card-body">
      <!-- Классификация ассоциаций -->
      <div v-if="showClassification" :class="{ 'mb-5': activeTab !== 'classification' }">
        <div v-if="analyticsData.classification.isLoading" class="classification-loading">
          <div class="card p-0 mb-4">
            <div class="card-header d-flex justify-content-between align-items-center">
              <h6 class="mb-0">Классификация растительного сообщества</h6>
              <div class="d-flex align-items-center">
                <div class="spinner-border spinner-border-sm text-primary me-2" role="status">
                  <span class="visually-hidden">Загрузка...</span>
                </div>
                <span class="text-muted">Определение сообществ...</span>
              </div>
            </div>
            <div class="card-body">
              <div class="skeleton-card"></div>
            </div>
          </div>
        </div>
        <ClassificationCard 
          v-else
          :classifications="analyticsData.classification.data" 
          :isLoading="false" 
          :error="analyticsData.classification.error" 
        />
      </div>

      <!-- Шкалы -->
      <div v-if="showScales" :class="{ 'mb-5': activeTab !== 'scales' }">
        <h5 class="border-bottom pb-2 mb-4">Экологические шкалы</h5>
        <div class="row g-4">
          <div
            v-for="(scale, index) in SCALES_TYPES"
            :key="scale.value"
            :class="computeClass(index, SCALES_TYPES.length)"
          >
            <div class="card h-100 p-0">
              <div class="card-header d-flex justify-content-between align-items-center">
                <h6 class="mb-0">{{ scale.label }}</h6>
                <div v-if="analyticsData.scales[scale.value]?.isLoading" class="d-flex align-items-center">
                  <div class="spinner-border spinner-border-sm text-primary me-2" role="status">
                    <span class="visually-hidden">Загрузка...</span>
                  </div>
                  <span class="text-muted fs-sm">Загрузка...</span>
                </div>
              </div>
              <div class="card-body">
                <ScalesChart
                  :chartData="analyticsData.scales[scale.value]?.data"
                  :isLoading="analyticsData.scales[scale.value]?.isLoading || false"
                  :error="analyticsData.scales[scale.value]?.error"
                  :scaleType="scale.value"
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Спектры -->
      <div v-if="showSpectra">
        <h5 class="border-bottom pb-2 mb-4">Спектры распределения</h5>
        <div class="row g-4">
          <div
            v-for="(spectrum, index) in SPECTRUM_TYPES"
            :key="spectrum.value"
            :class="computeClass(index, SPECTRUM_TYPES.length)"
          >
            <div class="card h-100 p-0">
              <div class="card-header d-flex justify-content-between align-items-center">
                <h6 class="mb-0">{{ spectrum.label }}</h6>
                <div v-if="analyticsData.spectra[spectrum.value]?.isLoading" class="d-flex align-items-center">
                  <div class="spinner-border spinner-border-sm text-primary me-2" role="status">
                    <span class="visually-hidden">Загрузка...</span>
                  </div>
                  <span class="text-muted fs-sm">Загрузка...</span>
                </div>
              </div>
              <div class="card-body">
                <SpectrumChart
                  :chartData="analyticsData.spectra[spectrum.value]?.data"
                  :isLoading="analyticsData.spectra[spectrum.value]?.isLoading || false"
                  :error="analyticsData.spectra[spectrum.value]?.error"
                  :spectrumType="spectrum.value"
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style lang="scss" scoped>
.card-header {
  padding: 0.75rem 1rem;
}

.card-body {
  padding: 1.25rem;
}

.btn-light {
  box-shadow: none;
}

// Стиль для заголовка аналитики
.analytics-header {
  background-color: rgba(66, 99, 136, 0.85);
  color: white;
}

// Убираем паддинг у card-body, содержащих графики
.scales-chart,
.spectrum-chart {
  + .card-body {
    padding: 0;
  }
}

// Адаптация отображения графиков
.card .card-body .card-body {
  padding: 0;
}

// Стиль для индикатора загрузки классификации
.classification-loading {
  .skeleton-card {
    height: 120px;
    background-color: rgba(0, 0, 0, 0.04);
    border-radius: 4px;
    animation: skeleton-pulse 1.5s infinite ease-in-out;
  }
}

@keyframes skeleton-pulse {
  0% {
    opacity: 0.6;
  }
  50% {
    opacity: 0.4;
  }
  100% {
    opacity: 0.6;
  }
}

[data-bs-theme="dark"] {
  .classification-loading {
    .skeleton-card {
      background-color: rgba(255, 255, 255, 0.08);
    }
  }
  
  .fs-sm {
    font-size: 0.875rem;
  }
}
</style>
