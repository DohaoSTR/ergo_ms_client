<script setup>
import { ref, computed, onMounted } from 'vue'
import ModalCenter from '@/pages/bio/components/modals/ModalCenter.vue'
import { BarChart2 } from 'lucide-vue-next'
import { SPECTRUM_TYPES, SCALES_TYPES } from '@/pages/bio/js/bio-constants'
import { useConsolidatedAnalysisStore } from '@/stores/consolidatedAnalysisStore'

const consolidatedStore = useConsolidatedAnalysisStore()

const props = defineProps({
  modalId: { type: String, required: true, default: 'analysisSettingsModal' }
})

const emits = defineEmits(['run-analysis'])

// Настройки анализа из store
const selectedElements = ref([...consolidatedStore.analysisSettings.selectedElements])
const showAllSitesChart = ref(consolidatedStore.analysisSettings.showAllSitesChart)
const showIndividualSiteCharts = ref(consolidatedStore.analysisSettings.showIndividualSiteCharts)
const showClassification = ref(consolidatedStore.analysisSettings.showClassification)

// Computed properties
const noElementsSelected = computed(() => selectedElements.value.length === 0)

// Check if all spectrums are selected
const allSpectrumsSelected = computed(() => {
  return SPECTRUM_TYPES.every(spectrum => selectedElements.value.includes(spectrum.value))
})

// Check if all scales are selected
const allScalesSelected = computed(() => {
  return SCALES_TYPES.every(scale => selectedElements.value.includes(scale.value))
})

// Toggle all spectrums
const toggleAllSpectrums = (checked) => {
  const spectrumValues = SPECTRUM_TYPES.map(s => s.value)
  
  if (checked) {
    // Add all spectrum values that are not already selected
    spectrumValues.forEach(value => {
      if (!selectedElements.value.includes(value)) {
        selectedElements.value.push(value)
      }
    })
  } else {
    // Remove all spectrum values
    selectedElements.value = selectedElements.value.filter(el => !spectrumValues.includes(el))
  }
}

// Toggle all scales
const toggleAllScales = (checked) => {
  const scaleValues = SCALES_TYPES.map(s => s.value)
  
  if (checked) {
    // Add all scale values that are not already selected
    scaleValues.forEach(value => {
      if (!selectedElements.value.includes(value)) {
        selectedElements.value.push(value)
      }
    })
  } else {
    // Remove all scale values
    selectedElements.value = selectedElements.value.filter(el => !scaleValues.includes(el))
  }
}

// Handle run analysis action
const handleRunAnalysis = () => {
  emits('run-analysis', {
    selectedElements: selectedElements.value,
    showAllSitesChart: showAllSitesChart.value,
    showIndividualSiteCharts: showIndividualSiteCharts.value,
    showClassification: showClassification.value
  })
}

// Reset form when modal is hidden
const resetForm = () => {
  selectedElements.value = [...consolidatedStore.analysisSettings.selectedElements]
  showAllSitesChart.value = consolidatedStore.analysisSettings.showAllSitesChart
  showIndividualSiteCharts.value = consolidatedStore.analysisSettings.showIndividualSiteCharts
  showClassification.value = consolidatedStore.analysisSettings.showClassification
}

// Set up modal event listeners
onMounted(() => {
  const modalEl = document.getElementById(props.modalId)
  if (modalEl) {
    // Reset form when modal is hidden
    modalEl.addEventListener('hidden.bs.modal', resetForm)

    // Update when modal is shown
    modalEl.addEventListener('show.bs.modal', () => {
      selectedElements.value = [...consolidatedStore.analysisSettings.selectedElements]
      showAllSitesChart.value = consolidatedStore.analysisSettings.showAllSitesChart
      showIndividualSiteCharts.value = consolidatedStore.analysisSettings.showIndividualSiteCharts
      showClassification.value = consolidatedStore.analysisSettings.showClassification
    })
  }
})
</script>

<template>
  <ModalCenter :modalId="modalId" title="Настройки анализа" :showFooter="true">
    <div class="analysis-settings">
      <div class="setting-group mb-3">
        <label class="form-label fw-bold mb-2">Выбор элементов для анализа</label>
        <div v-if="noElementsSelected" class="alert alert-warning" role="alert">
          <small>Выберите хотя бы один элемент для анализа</small>
        </div>
        
        <!-- Блок спектров -->
        <div class="element-group mb-3">
          <div class="element-group-header mb-2">
            <div class="form-check">
              <input
                class="form-check-input"
                type="checkbox"
                id="selectAllSpectrums"
                :checked="allSpectrumsSelected"
                @change="toggleAllSpectrums($event.target.checked)"
              />
              <label class="form-check-label fw-bold" for="selectAllSpectrums">
                Спектры
              </label>
            </div>
          </div>
          
          <div class="elements-list ms-4">
            <div 
              v-for="spectrum in SPECTRUM_TYPES" 
              :key="spectrum.value" 
              class="form-check mb-2"
            >
              <input
                class="form-check-input"
                type="checkbox"
                :id="`spectrum_${spectrum.value}`"
                :value="spectrum.value"
                v-model="selectedElements"
              />
              <label class="form-check-label" :for="`spectrum_${spectrum.value}`">
                {{ spectrum.label }}
              </label>
            </div>
          </div>
        </div>
        
        <!-- Блок шкал -->
        <div class="element-group">
          <div class="element-group-header mb-2">
            <div class="form-check">
              <input
                class="form-check-input"
                type="checkbox"
                id="selectAllScales"
                :checked="allScalesSelected"
                @change="toggleAllScales($event.target.checked)"
              />
              <label class="form-check-label fw-bold" for="selectAllScales">
                Экологические шкалы
              </label>
            </div>
          </div>
          
          <div class="elements-list ms-4">
            <div 
              v-for="scale in SCALES_TYPES" 
              :key="scale.value" 
              class="form-check mb-2"
            >
              <input
                class="form-check-input"
                type="checkbox"
                :id="`scale_${scale.value}`"
                :value="scale.value"
                v-model="selectedElements"
              />
              <label class="form-check-label" :for="`scale_${scale.value}`">
                {{ scale.label }}
              </label>
            </div>
          </div>
        </div>
      </div>
      
      <div class="setting-group">
        <label class="form-label fw-bold mb-2">Настройки отображения</label>
        
        <div class="display-options ms-2">
          <div class="form-check mb-2">
            <input
              class="form-check-input"
              type="checkbox"
              id="showClassification"
              v-model="showClassification"
            />
            <label class="form-check-label" for="showClassification">
              Определение сообщества
            </label>
            <div class="form-text text-muted mt-1">
              Отображает классификацию растительного сообщества для каждой площадки
            </div>
          </div>
          
          <div class="form-check mb-2">
            <input
              class="form-check-input"
              type="checkbox"
              id="showAllSitesChart"
              v-model="showAllSitesChart"
            />
            <label class="form-check-label" for="showAllSitesChart">
              Показывать сводный график по всем площадкам
            </label>
            <div class="form-text text-muted mt-1">
              Отображает stacked bar график для сравнения данных по всем площадкам
            </div>
          </div>
          
          <div class="form-check mb-2">
            <input
              class="form-check-input"
              type="checkbox"
              id="showIndividualSiteCharts"
              v-model="showIndividualSiteCharts"
            />
            <label class="form-check-label" for="showIndividualSiteCharts">
              Показывать графики для отдельных площадок
            </label>
            <div class="form-text text-muted mt-1">
              Создает отдельную вкладку с графиками для каждой площадки
            </div>
          </div>
        </div>
      </div>
    </div>

    <template #footer>
      <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Отмена</button>
      <button 
        type="button" 
        class="btn btn-primary" 
        @click="handleRunAnalysis"
        :disabled="noElementsSelected"
        data-bs-dismiss="modal"
      >
        <BarChart2 :size="18" class="me-1" />
        Выполнить анализ
      </button>
    </template>
  </ModalCenter>
</template>

<style scoped lang="scss">
.setting-group {
  padding-bottom: 16px;
  border-bottom: 1px solid var(--bs-border-color);

  &:last-child {
    border-bottom: none;
    padding-bottom: 0;
  }
}

.analysis-settings {
  overflow-y: auto;
}

.elements-list {
  padding-left: 10px;
  border-left: 2px solid var(--bs-border-color);
}
</style> 