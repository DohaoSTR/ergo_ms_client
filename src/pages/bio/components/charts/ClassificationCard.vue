<script setup>
import { ref, computed } from 'vue'
import { CircleAlert, InfoIcon, HelpCircle, ChevronDown, ChevronUp } from 'lucide-vue-next'

const props = defineProps({
  classifications: { type: Array, required: true },
  isLoading: { type: Boolean, default: false },
  error: { type: [String, null], default: null },
})

const showAllResults = ref(false)

// Группировка ассоциаций с одинаковыми названиями
const groupedClassifications = computed(() => {
  const associationMap = new Map()

  props.classifications.forEach((item) => {
    const key = item.association

    if (!associationMap.has(key)) {
      associationMap.set(key, {
        association: key,
        items: [],
        maxConfidence: 0,
        maxConfidenceValue: 0,
      })
    }

    const group = associationMap.get(key)
    group.items.push(item)

    // Обновляем максимальную вероятность для группы
    if (item.confidence_value > group.maxConfidenceValue) {
      group.maxConfidence = item.confidence
      group.maxConfidenceValue = item.confidence_value
    }
  })

  // Преобразуем Map в массив и сортируем по убыванию вероятности
  return Array.from(associationMap.values()).sort(
    (a, b) => b.maxConfidenceValue - a.maxConfidenceValue,
  )
})

const hasResults = computed(() => props.classifications.length > 0)
const topResult = computed(() => (hasResults.value ? props.classifications[0] : null))
const hasMultipleResults = computed(() => props.classifications.length > 1)

const toggleResults = () => {
  showAllResults.value = !showAllResults.value
}
</script>

<template>
  <div class="classification-card">
    <div v-if="isLoading" class="text-center py-3">
      <div class="spinner-border spinner-border-sm text-primary" role="status">
        <span class="visually-hidden">Загрузка...</span>
      </div>
    </div>

    <div v-else-if="error" class="alert alert-danger p-2 mb-0">
      <div class="d-flex align-items-center gap-2">
        <CircleAlert :size="16" />
        <small>{{ error }}</small>
      </div>
    </div>

    <div v-else-if="!hasResults" class="alert alert-info p-2 mb-0">
      <div class="d-flex align-items-center gap-2">
        <InfoIcon :size="16" />
        <small>Не удалось определить растительное сообщество</small>
      </div>
    </div>

    <div v-else>
      <div class="d-flex justify-content-between align-items-center mb-2">
        <div class="d-flex align-items-center">
          <h6 class="mb-0 me-1">Определение сообщества</h6>
          <HelpCircle
            :size="16"
            class="text-muted cursor-help"
            v-tooltip title="
              Определение растительного сообщества выполняется с помощью алгоритмов машинного обучения на основе видового состава
            "
          />
        </div>
        <div v-if="hasMultipleResults">
          <button
            @click="toggleResults"
            class="btn btn-sm btn-link text-decoration-none p-0 d-flex align-items-center"
          >
            <small>{{ showAllResults ? 'Скрыть' : 'Другие варианты' }}</small>
            <component :is="showAllResults ? ChevronUp : ChevronDown" :size="14" class="ms-1" />
          </button>
        </div>
      </div>

      <!-- Основной результат -->
      <div class="card border mb-2 p-0">
        <div class="card-body">
          <div class="d-flex justify-content-between align-items-center">
            <div>
              <div class="fw-bold">{{ topResult.association }}</div>
              <small v-if="topResult.sub_element" class="text-muted">{{
                topResult.sub_element
              }}</small>
            </div>
            <span
              class="badge bg-success"
              v-tooltip title="Вероятность принадлежности к конкретному сообществу"
              >{{ topResult.confidence }}</span
            >
          </div>
          <div class="progress mt-2" style="height: 4px">
            <div
              class="progress-bar bg-success"
              role="progressbar"
              :style="`width: ${topResult.confidence_value}%`"
              :aria-valuenow="topResult.confidence_value"
              aria-valuemin="0"
              aria-valuemax="100"
            ></div>
          </div>
        </div>
      </div>

      <!-- Полный список результатов -->
      <Transition name="fade">
        <div v-if="showAllResults" class="all-results mt-2">
          <div class="table-responsive">
            <table class="table table-sm table-hover mb-0 small">
              <thead>
                <tr>
                  <th class="border-top">Ассоциация</th>
                  <th class="border-top text-end">Вероятность</th>
                </tr>
              </thead>
              <tbody>
                <template v-for="(group, groupIndex) in groupedClassifications" :key="groupIndex">
                  <!-- Заголовок группы ассоциаций -->
                  <tr :class="{ 'table-success': groupIndex === 0 }">
                    <td class="fw-bold">{{ group.association }}</td>
                    <td class="text-end">
                      <span
                        v-tooltip title="Максимальная вероятность из всех вариантов данной ассоциации"
                      >
                        {{ group.maxConfidence }}
                        <small v-if="group.items.length > 1" class="opacity-75">(макс.)</small>
                      </span>
                    </td>
                  </tr>
                  <!-- Подэлементы, если их больше одного -->
                  <template v-if="group.items.length > 1">
                    <tr
                      v-for="(item, itemIndex) in group.items"
                      :key="`${groupIndex}_${itemIndex}`"
                      class="sub-element-row"
                    >
                      <td class="ps-3">
                        <small class="text-muted">{{ item.sub_element || 'без уточнения' }}</small>
                      </td>
                      <td class="text-end">{{ item.confidence }}</td>
                    </tr>
                  </template>
                  <!-- Если только один подэлемент, показываем его в основной строке -->
                  <tr v-else-if="group.items[0].sub_element" class="sub-element-single">
                    <td colspan="2" class="ps-3 text-muted">
                      <small>{{ group.items[0].sub_element }}</small>
                    </td>
                  </tr>
                </template>
              </tbody>
            </table>
          </div>
        </div>
      </Transition>
    </div>
  </div>
</template>

<style lang="scss" scoped>
.classification-card {
  min-height: 100px;
}

.cursor-help {
  cursor: help;
}

// Стили для строк с подэлементами
.sub-element-row td {
  border-top: none;
  padding-top: 0.2rem;
  padding-bottom: 0.2rem;
}

.sub-element-single td {
  border-top: none;
  padding-top: 0;
}

.table.small {
  font-size: 0.875rem;
}

.fade-enter-active {
  animation: fadeIn 0.2s ease-in-out;
}

.fade-leave-active {
  animation: fadeOut 0.2s ease-in-out;
}

@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(-5px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@keyframes fadeOut {
  from {
    opacity: 1;
    transform: translateY(0);
  }
  to {
    opacity: 0;
    transform: translateY(-5px);
  }
}
</style>
