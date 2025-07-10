<script setup>
import { ref, computed, onMounted } from 'vue'
import ModalCenter from '@/pages/bio/components/modals/ModalCenter.vue'
import { ChevronDown, ChevronRight } from 'lucide-vue-next'
import { siteFieldLabels } from '@/pages/bio/js/bio-constants'

const props = defineProps({
  modalId: { type: String, required: true, default: 'exportSettingsModal' },
  exportFormat: { type: String, required: true, default: 'xlsx' },
  initialSelectedFields: { type: Array, default: () => Object.keys(siteFieldLabels) },
})

const emits = defineEmits(['export'])

// Настройки экспорта
const includeHeader = ref(true)
const selectedSiteFields = ref(props.initialSelectedFields)
const emptyAbundanceValue = ref('.') // Значение по умолчанию - точка
const calculateConstancy = ref(true) // Пока без реализации
const showFieldsSelection = ref(false) // По умолчанию свернуто

// Computed properties
const modalTitle = computed(
  () => `Настройки экспорта ${props.exportFormat === 'xlsx' ? 'Excel' : 'CSV'}`,
)

// Check if all fields are selected
const allFieldsSelected = computed(() => {
  return selectedSiteFields.value.length === Object.keys(siteFieldLabels).length
})

// Toggle all fields
const toggleAllFields = (checked) => {
  if (checked) {
    selectedSiteFields.value = Object.keys(siteFieldLabels)
  } else {
    selectedSiteFields.value = []
  }
}

// Переключить видимость выбора полей
const toggleFieldsSelection = () => {
  showFieldsSelection.value = !showFieldsSelection.value
}

// Handle export action
const handleExport = () => {
  emits('export', {
    format: props.exportFormat,
    includeHeader: includeHeader.value,
    selectedFields: includeHeader.value ? selectedSiteFields.value : [],
    emptyAbundanceValue: emptyAbundanceValue.value,
    calculateConstancy: calculateConstancy.value,
  })
}

// Reset form when modal is hidden
const resetForm = () => {
  includeHeader.value = true
  selectedSiteFields.value = [...props.initialSelectedFields]
  emptyAbundanceValue.value = '.'
  calculateConstancy.value = true
  showFieldsSelection.value = false
}

// Set up modal event listeners
onMounted(() => {
  const modalEl = document.getElementById(props.modalId)
  if (modalEl) {
    // Reset form when modal is hidden
    modalEl.addEventListener('hidden.bs.modal', resetForm)

    // Update fields when modal is shown
    modalEl.addEventListener('show.bs.modal', () => {
      selectedSiteFields.value = [...props.initialSelectedFields]
    })
  }
})
</script>

<template>
  <ModalCenter :modalId="modalId" :title="modalTitle" :showFooter="true">
    <div class="export-settings">
      <!-- Настройка добавления шапки с полями площадок -->
      <div class="setting-group mb-3">
        <div class="form-check mb-2">
          <input
            class="form-check-input"
            type="checkbox"
            id="includeHeader"
            v-model="includeHeader"
          />
          <label class="form-check-label fw-bold" for="includeHeader">
            Добавить шапку с информацией о площадках
          </label>
        </div>

        <div v-if="includeHeader" class="fields-selector ms-4">
          <div
            class="field-header d-flex align-items-center mb-2"
            @click="toggleFieldsSelection"
            style="cursor: pointer"
          >
            <span v-if="showFieldsSelection">
              <ChevronDown :size="16" />
            </span>
            <span v-else>
              <ChevronRight :size="16" />
            </span>
            <span class="ms-1">Выбрать поля для экспорта</span>
          </div>

          <div v-if="showFieldsSelection" class="fields-list">
            <div class="form-check mb-2">
              <input
                class="form-check-input"
                type="checkbox"
                id="selectAllFields"
                :checked="allFieldsSelected"
                @change="toggleAllFields($event.target.checked)"
              />
              <label class="form-check-label" for="selectAllFields"> Выбрать все поля </label>
            </div>

            <div class="field-selection">
              <div v-for="(label, field) in siteFieldLabels" :key="field" class="form-check">
                <input
                  class="form-check-input"
                  type="checkbox"
                  :id="`field_${field}`"
                  :value="field"
                  v-model="selectedSiteFields"
                />
                <label class="form-check-label" :for="`field_${field}`">
                  {{ label }}
                </label>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Настройка заполнения пустых полей обилия -->
      <div class="setting-group mb-3">
        <label class="form-label fw-bold mb-2">Заполнение пустых полей обилия</label>
        <div class="ms-4">
          <div class="form-check">
            <input
              class="form-check-input"
              type="radio"
              id="emptyValue1"
              value="."
              v-model="emptyAbundanceValue"
            />
            <label class="form-check-label" for="emptyValue1"> Точка </label>
          </div>
          <div class="form-check">
            <input
              class="form-check-input"
              type="radio"
              id="emptyValue2"
              value=""
              v-model="emptyAbundanceValue"
            />
            <label class="form-check-label" for="emptyValue2"> Пустая ячейка </label>
          </div>
        </div>
      </div>

      <!-- Настройка расчета класса постоянства -->
      <div class="setting-group">
        <div class="form-check">
          <input
            class="form-check-input"
            type="checkbox"
            id="calculateConstancy"
            v-model="calculateConstancy"
          />
          <label class="form-check-label fw-bold" for="calculateConstancy">
            Рассчитать класс постоянства
          </label>
          <div class="form-text text-muted mt-1">
            Добавляет дополнительный столбец с классом постоянства видов
          </div>
          <div v-if="calculateConstancy" class="constancy-classes-info mt-2">
            <div class="constancy-classes-title mb-1">Классы постоянства:</div>
            <div class="constancy-class"><span class="fw-bold">I</span> — 1-20% (вид редкий)</div>
            <div class="constancy-class">
              <span class="fw-bold">II</span> — 21-40% (вид встречается нечасто)
            </div>
            <div class="constancy-class">
              <span class="fw-bold">III</span> — 41-60% (вид умеренно распространён)
            </div>
            <div class="constancy-class">
              <span class="fw-bold">IV</span> — 61-80% (вид часто встречается)
            </div>
            <div class="constancy-class">
              <span class="fw-bold">V</span> — 81-100% (вид очень распространён)
            </div>
          </div>
        </div>
      </div>
    </div>

    <template #footer>
      <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Отмена</button>
      <button type="button" class="btn btn-primary" @click="handleExport">Экспортировать</button>
    </template>
  </ModalCenter>
</template>

<style scoped lang="scss">
.field-selection {
  max-height: 200px;
  overflow-y: auto;
  padding-right: 10px;
  border-left: 2px solid var(--bs-border-color);
  padding-left: 10px;
  margin-left: 5px;

  .form-check {
    margin-bottom: 8px;
  }
}

.setting-group {
  padding-bottom: 1rem;
  border-bottom: 1px solid var(--bs-border-color);

  &:last-child {
    border-bottom: none;
    padding-bottom: 0;
  }
}

.export-settings {
  overflow-y: auto;
}

.constancy-classes-info {
  font-size: 0.9rem;
  padding-left: 1rem;
  color: var(--bs-secondary);

  .constancy-classes-title {
    font-style: italic;
  }

  .constancy-class {
    margin-left: 0.5rem;
    font-size: 0.85rem;
  }
}
</style>
