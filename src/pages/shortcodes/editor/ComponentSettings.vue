<template>
  <div>
    <!-- Название и текст -->
    <div class="mb-4">
      <label class="form-label fw-bold">Название</label>
      <input v-model="component.name" type="text" class="form-control" />
    </div>
    <div class="mb-4">
      <label class="form-label fw-bold">Текст</label>
      <input v-model="component.extra_data.text" type="text" class="form-control" />
    </div>

    <div class="accordion" id="settingsAccordion">
      <!-- Визуальные настройки -->
      <div class="accordion-item">
        <h2 class="accordion-header" id="headingVisual">
          <button
            class="accordion-button bg-light"
            type="button"
            data-bs-toggle="collapse"
            data-bs-target="#collapseVisual"
            aria-expanded="true"
            aria-controls="collapseVisual"
          >
            🎨 Визуальные настройки
          </button>
        </h2>
        <div
          id="collapseVisual"
          class="accordion-collapse collapse show"
          aria-labelledby="headingVisual"
        >
          <div class="accordion-body">
            <!-- Размер текста -->
            <div class="mb-3">
              <label class="form-label">Размер текста</label>
              <div class="btn-group flex-wrap">
                <button
                  v-for="size in fontSizes"
                  :key="size"
                  type="button"
                  class="btn btn-outline-primary m-1"
                  :class="{ active: hasClass(size) }"
                  @click="toggleClass(size, fontSizes)"
                >
                  {{ size }}
                </button>
              </div>
            </div>

            <!-- Цвет фона -->
            <div class="mb-3">
              <label class="form-label">Цвет фона</label>
              <div class="btn-group flex-wrap">
                <button
                  v-for="color in bgColors"
                  :key="color"
                  type="button"
                  class="btn m-1"
                  :class="['btn-' + color, { active: hasClass('bg-' + color) }]"
                  @click="
                    toggleClass(
                      'bg-' + color,
                      bgColors.map((c) => 'bg-' + c),
                    )
                  "
                >
                  {{ color }}
                </button>
              </div>
            </div>

            <!-- Цвет текста -->
            <div class="mb-3">
              <label class="form-label">Цвет текста</label>
              <div class="btn-group flex-wrap">
                <button
                  v-for="color in textColors"
                  :key="color"
                  type="button"
                  class="btn m-1"
                  :class="['btn-outline-' + color, { active: hasClass('text-' + color) }]"
                  @click="
                    toggleClass(
                      'text-' + color,
                      textColors.map((c) => 'text-' + c),
                    )
                  "
                >
                  {{ color }}
                </button>
              </div>
            </div>

            <!-- Выравнивание -->
            <div class="mb-3">
              <label class="form-label">Выравнивание</label>
              <select v-model="component.extra_data.align" class="form-select">
                <option value="">По умолчанию</option>
                <option value="text-start">Слева</option>
                <option value="text-center">По центру</option>
                <option value="text-end">Справа</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      <!-- Отступы (Padding) -->
      <div class="accordion-item">
        <h2 class="accordion-header" id="headingPadding">
          <button
            class="accordion-button collapsed bg-light"
            type="button"
            data-bs-toggle="collapse"
            data-bs-target="#collapsePadding"
            aria-expanded="false"
            aria-controls="collapsePadding"
          >
            📏 Внутренние отступы (Padding)
          </button>
        </h2>
        <div
          id="collapsePadding"
          class="accordion-collapse collapse"
          aria-labelledby="headingPadding"
        >
          <div class="accordion-body">
            <div v-for="prefix in paddingKeys" :key="prefix" class="mb-3">
              <label class="form-label">{{ spacingPrefixes[prefix] }}</label>
              <input
                type="range"
                min="0"
                max="5"
                v-model.number="spacingValues[prefix]"
                @input="applySpacing(prefix, spacingValues[prefix])"
                class="form-range"
              />
            </div>
          </div>
        </div>
      </div>

      <!-- Отступы (Margin) -->
      <div class="accordion-item">
        <h2 class="accordion-header" id="headingMargin">
          <button
            class="accordion-button collapsed bg-light"
            type="button"
            data-bs-toggle="collapse"
            data-bs-target="#collapseMargin"
            aria-expanded="false"
            aria-controls="collapseMargin"
          >
            📐 Внешние отступы (Margin)
          </button>
        </h2>
        <div
          id="collapseMargin"
          class="accordion-collapse collapse"
          aria-labelledby="headingMargin"
        >
          <div class="accordion-body">
            <div v-for="prefix in marginKeys" :key="prefix" class="mb-3">
              <label class="form-label">{{ spacingPrefixes[prefix] }}</label>
              <input
                type="range"
                min="0"
                max="5"
                v-model.number="spacingValues[prefix]"
                @input="applySpacing(prefix, spacingValues[prefix])"
                class="form-range"
              />
            </div>
          </div>
        </div>
      </div>

      <!-- Прочее -->
      <div class="accordion-item">
        <h2 class="accordion-header" id="headingExtra">
          <button
            class="accordion-button collapsed bg-light"
            type="button"
            data-bs-toggle="collapse"
            data-bs-target="#collapseExtra"
            aria-expanded="false"
            aria-controls="collapseExtra"
          >
            ⚙️ Прочее
          </button>
        </h2>
        <div id="collapseExtra" class="accordion-collapse collapse" aria-labelledby="headingExtra">
          <div class="accordion-body">
            <div class="form-check mb-3">
              <input
                class="form-check-input"
                type="checkbox"
                id="toggleVisibility"
                :checked="hasClass('d-none')"
                @change="toggleVisibility"
              />
              <label class="form-check-label" for="toggleVisibility">
                Скрыть компонент (d-none)
              </label>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Предпросмотр классов -->
    <div class="alert alert-secondary mt-4">
      <code>{{ component.class_list }}</code>
    </div>

    <button type="button" class="btn btn-outline-danger w-100 mt-2" @click="resetSettings">
      🔄 Сбросить настройки
    </button>
  </div>
</template>

<script setup>
import { reactive, toRefs, watch } from 'vue'

const props = defineProps({
  component: { type: Object, required: true },
})

const { component } = toRefs(props)

const fontSizes = ['fs-1', 'fs-2', 'fs-3', 'fs-4', 'fs-5']
const bgColors = ['primary', 'secondary', 'success', 'danger', 'warning', 'info', 'light', 'dark']
const textColors = ['dark', 'light', 'primary', 'secondary', 'success', 'danger', 'warning', 'info']

const spacingPrefixes = {
  px: 'Горизонтальные внутренние отступы (px)',
  py: 'Вертикальные внутренние отступы (py)',
  pt: 'Верхний внутренний отступ (pt)',
  pb: 'Нижний внутренний отступ (pb)',
  ps: 'Левый внутренний отступ (ps)',
  pe: 'Правый внутренний отступ (pe)',
  mx: 'Горизонтальные внешние отступы (mx)',
  mb: 'Нижний внешний отступ (mb)',
  mt: 'Верхний внешний отступ (mt)',
  me: 'Правый внешний отступ (me)',
  ms: 'Левый внешний отступ (ms)',
}
const paddingKeys = ['px', 'py', 'pt', 'pb', 'ps', 'pe']
const marginKeys = ['mx', 'mb', 'mt', 'me', 'ms']

const spacingValues = reactive({})
// При старте и при любом изменении class_list — синхронизируем начальные значения
watch(
  () => component.value.class_list,
  (list) => {
    paddingKeys.concat(marginKeys).forEach((prefix) => {
      spacingValues[prefix] = extractSpacing(prefix, list)
    })
  },
  { immediate: true },
)

function hasClass(cls) {
  return Array.isArray(component.value.class_list) && component.value.class_list.includes(cls)
}

// Включить/выключить класс из группы
function toggleClass(targetClass, classGroup) {
  const list = Array.isArray(component.value.class_list) ? [...component.value.class_list] : []

  const filtered = list.filter((c) => !classGroup.includes(c))
  // добавляем новую
  filtered.push(targetClass)
  component.value.class_list = filtered
}

// Установить отступ по префиксу и значению
function applySpacing(prefix, value) {
  const group = Array.from({ length: 6 }, (_, i) => `${prefix}-${i}`)
  toggleClass(`${prefix}-${value}`, group)
}

// Вытащить число отступа из массива классов
function extractSpacing(prefix, list) {
  if (!Array.isArray(list)) return 0
  const cls = list.find((c) => c.startsWith(`${prefix}-`))
  return cls ? Number(cls.split('-')[1]) : 0
}

// Скрыть / показать (d-none)
function toggleVisibility(event) {
  const list = Array.isArray(component.value.class_list) ? [...component.value.class_list] : []
  const idx = list.indexOf('d-none')
  if (event.target.checked && idx === -1) {
    list.push('d-none')
  } else if (!event.target.checked && idx !== -1) {
    list.splice(idx, 1)
  }
  component.value.class_list = list
}

// Полный сброс
function resetSettings() {
  component.value.class_list = []
  paddingKeys.concat(marginKeys).forEach((prefix) => {
    spacingValues[prefix] = 0
  })
}
</script>
