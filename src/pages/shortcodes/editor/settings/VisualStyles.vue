<script setup>
import { toRefs } from 'vue'

const props = defineProps({ component: Object })
const { component } = toRefs(props)

const fontSizes = ['fs-1', 'fs-2', 'fs-3', 'fs-4', 'fs-5']
const bgColors = ['primary', 'secondary', 'success', 'danger', 'warning', 'info', 'light', 'dark']
const textColors = ['dark', 'light', 'primary', 'secondary', 'success', 'danger', 'warning', 'info']

function hasClass(c) {
  return component.value.class_list?.includes(c)
}
function toggleClass(cls, group) {
  const list = (component.value.class_list || []).filter((c) => !group.includes(c))
  list.push(cls)
  component.value.class_list = list
}
</script>

<template>
  <div class="accordion-item visual-settings">
    <div id="vis" class="accordion-collapse collapse show">
      <div class="accordion-body">
        <!-- Размер текста -->
        <div class="mb-3">
          <label class="form-label">Размер текста</label>
          <div class="btn-group flex-wrap mb-1 gap-2">
            <button v-for="s in fontSizes" :key="s" class="btn btn-outline-primary" :class="{ active: hasClass(s) }"
              @click="toggleClass(s, fontSizes)">
              {{ s }}
            </button>
          </div>
        </div>

        <!-- Цвет фона -->
        <div class="mb-3">
          <label class="form-label">Цвет фона</label>
          <div class="btn-color-grid mb-1">
            <button v-for="c in bgColors" :key="c" class="btn btn-bg-chip"
              :class="['btn-' + c, { active: hasClass('bg-' + c) }]" @click="
                toggleClass(
                  'bg-' + c,
                  bgColors.map((b) => 'bg-' + b)
                )
                ">
              {{ c }}
            </button>
          </div>
        </div>

        <!-- Цвет текста -->
        <div class="mb-3">
          <label class="form-label">Цвет текста</label>
          <div class="btn-color-grid mb-1">
            <button v-for="c in textColors" :key="c" class="btn btn-text-chip" :class="[
              'text-' + c,
              { active: hasClass('text-' + c), 'bg-light': c === 'light' },
              'border-' + c,
            ]" @click="
              toggleClass(
                'text-' + c,
                textColors.map((t) => 'text-' + t)
              )
              ">
              {{ c }}
            </button>
          </div>
        </div>

        <!-- Выравнивание -->
        <div class="mb-4">
          <label class="form-label">Выравнивание</label>
          <select v-model="component.extra_data.align" class="form-select">
            <option value="">auto</option>
            <option value="text-start">Слева</option>
            <option value="text-center">Центр</option>
            <option value="text-end">Справа</option>
          </select>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.visual-settings .btn-group,
.visual-settings .btn-color-grid {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
}

.btn-color-grid {
  display: grid;
  grid-template-columns: repeat(4, minmax(64px, 1fr));
  gap: 8px;
}

.btn-bg-chip {
  border-radius: 10px;
  min-width: 70px;
  font-weight: 600;
  color: #fff !important;
  border: none;
  box-shadow: 0 1px 4px #0001;
  transition: filter 0.15s;
}

.btn-bg-chip.bg-light {
  color: #222 !important;
}

.btn-bg-chip.active,
.btn-bg-chip:focus {
  outline: 2px solid #1b1c1d66;
  filter: brightness(0.92);
}

.btn-text-chip {
  border-radius: 10px;
  min-width: 70px;
  font-weight: 600;
  border: 2px solid #d1d5db;
  background: #fff;
  color: inherit;
  transition: border 0.15s, background 0.15s, color 0.15s;
}

.btn-text-chip.active {
  border-width: 3px;
  background: #f8f9fa;
  box-shadow: 0 1px 4px #0001;
}

.btn-text-chip.text-primary {
  border-color: #0d6efd;
  color: #0d6efd;
}

.btn-text-chip.text-success {
  border-color: #198754;
  color: #198754;
}

.btn-text-chip.text-danger {
  border-color: #dc3545;
  color: #dc3545;
}

.btn-text-chip.text-warning {
  border-color: #ffc107;
  color: #ffc107;
}

.btn-text-chip.text-info {
  border-color: #0dcaf0;
  color: #0dcaf0;
}

.btn-text-chip.text-dark {
  border-color: #212529;
  color: #212529;
}

.btn-text-chip.text-secondary {
  border-color: #6c757d;
  color: #6c757d;
}

.btn-text-chip.text-light {
  border-color: #e9ecef;
  color: #f8f9fa;
  background: #222;
}

.btn-text-chip.bg-light {
  color: #212529 !important;
}

.btn-bg-chip.active,
.btn-text-chip.active {
  box-shadow: 0 2px 10px #0002;
  font-weight: 700;
  filter: brightness(0.95);
}
</style>
