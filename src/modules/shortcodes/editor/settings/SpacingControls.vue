<template>
  <div class="accordion" id="spacingAccordion">
    <!-- Внутренние отступы -->
    <div class="accordion-item">
      <h2 class="accordion-header" id="headingPadding">
        <button class="accordion-button" type="button" data-bs-toggle="collapse" data-bs-target="#collapsePadding"
          aria-expanded="true" aria-controls="collapsePadding">
          📐 Внутренние отступы
        </button>
      </h2>
      <div id="collapsePadding" class="accordion-collapse collapse show" aria-labelledby="headingPadding"
        data-bs-parent="#spacingAccordion">
        <div class="accordion-body">
          <div class="d-grid gap-3" style="grid-template-columns: repeat(auto-fill, minmax(260px, 1fr));">
            <div v-for="control in paddingControls" :key="control.key" class="d-flex align-items-center flex-nowrap">
              <label :for="control.key" class="form-label mb-0 flex-shrink-0" style="width: 6rem;">
                {{ control.label }}
              </label>
              <div class="flex-grow-1 mx-2">
                <input :id="control.key" type="range" min="0" max="5" v-model.number="spacingValues[control.key]"
                  @input="applySpacing(control.key, spacingValues[control.key])" class="form-range w-100" />
              </div>
              <input type="number" v-model.number="spacingValues[control.key]"
                @input="applySpacing(control.key, spacingValues[control.key])"
                class="form-control form-control-sm text-center flex-shrink-0"
                style="width: 3rem; padding: 0; height: 1.75rem;" min="0" max="5" />
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Внешние отступы -->
    <div class="accordion-item">
      <h2 class="accordion-header" id="headingMargin">
        <button class="accordion-button collapsed" type="button" data-bs-toggle="collapse"
          data-bs-target="#collapseMargin" aria-expanded="false" aria-controls="collapseMargin">
          📏 Внешние отступы
        </button>
      </h2>
      <div id="collapseMargin" class="accordion-collapse collapse" aria-labelledby="headingMargin"
        data-bs-parent="#spacingAccordion">
        <div class="accordion-body">
          <div class="d-grid gap-3" style="grid-template-columns: repeat(auto-fill, minmax(260px, 1fr));">
            <div v-for="control in marginControls" :key="control.key" class="d-flex align-items-center flex-nowrap">
              <label :for="control.key" class="form-label mb-0 flex-shrink-0" style="width: 6rem;">
                {{ control.label }}
              </label>
              <div class="flex-grow-1 mx-2">
                <input :id="control.key" type="range" min="0" max="5" v-model.number="spacingValues[control.key]"
                  @input="applySpacing(control.key, spacingValues[control.key])" class="form-range w-100" />
              </div>
              <input type="number" v-model.number="spacingValues[control.key]"
                @input="applySpacing(control.key, spacingValues[control.key])"
                class="form-control form-control-sm text-center flex-shrink-0"
                style="width: 3rem; padding: 0; height: 1.75rem;" min="0" max="5" />
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { reactive, toRefs, watch } from 'vue'

const props = defineProps({ component: Object })
const { component } = toRefs(props)

// Контролы внутренних отступов
const paddingControls = [
  { key: 'pt', label: 'Внутренний отступ сверху' },
  { key: 'pb', label: 'Внутренний отступ снизу' },
  { key: 'ps', label: 'Внутренний отступ слева' },
  { key: 'pe', label: 'Внутренний отступ справа' },
  { key: 'px', label: 'Горизонтальный внутренний отступ' },
  { key: 'py', label: 'Вертикальный внутренний отступ' },
]

// Контролы внешних отступов
const marginControls = [
  { key: 'mt', label: 'Внешний отступ сверху' },
  { key: 'mb', label: 'Внешний отступ снизу' },
  { key: 'ms', label: 'Внешний отступ слева' },
  { key: 'me', label: 'Внешний отступ справа' },
  { key: 'mx', label: 'Горизонтальный внешний отступ' },
  { key: 'my', label: 'Вертикальный внешний отступ' },
]

// Текущие значения отступов
const spacingValues = reactive({})

// При изменении class_list инициализируем значения
watch(
  () => component.value.class_list,
  (list) => {
    [...paddingControls, ...marginControls].forEach(({ key }) => {
      spacingValues[key] = extractSpacing(key, list)
    })
  },
  { immediate: true }
)

// Удаляем старые классы группы и добавляем новый
function toggleClass(cls, group) {
  const list = (component.value.class_list || []).filter(
    (c) => !group.includes(c)
  )
  list.push(cls)
  component.value.class_list = list
}

// Применяем отступ: префикс + значение
function applySpacing(prefix, val) {
  toggleClass(
    `${prefix}-${val}`,
    Array.from({ length: 6 }, (_, i) => `${prefix}-${i}`)
  )
}

// Извлекаем текущее значение из списка классов
function extractSpacing(prefix, list) {
  if (!Array.isArray(list)) return 0
  const found = list.find((c) => c.startsWith(`${prefix}-`))
  return found ? Number(found.split('-')[1]) : 0
}
</script>
