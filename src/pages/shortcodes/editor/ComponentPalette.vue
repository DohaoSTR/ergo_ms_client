<template>
  <div class="card shadow-sm mb-4">
    <div class="card-header bg-primary text-white align-items-center">
      <div class="d-flex align-items-center pb-2">
        <Icons.Puzzle class="me-2" />
        <h5 class="mb-0">Компоненты</h5>
      </div>
      <input
        v-model="searchTerm"
        type="text"
        class="form-control form-control-sm my-2"
        placeholder="Поиск"
      />
      <div class="row g-2 mb-2">
        <div class="col">
          <select v-model="selectedCategory" class="form-select form-select-sm">
            <option value="">Все категории</option>
            <option v-for="cat in categories" :key="cat" :value="cat">{{ cat }}</option>
          </select>
        </div>
      </div>
    </div>
    <div class="card-body p-2">
      <div v-for="(templates, cat, idx) in groupedTemplates" :key="cat">
        <div v-if="idx > 0" class="category-separator my-3"></div>
        <div class="mb-1 fw-bold fs-5">{{ cat }}</div>
        <div class="row g-0 mb-2">
          <div
            v-for="(template, tIdx) in templates"
            :key="template.id"
            class="col-6 col-md-3 tile-wrap"
            :class="{ 'separator-left': tIdx % 2 !== 0 }"
          >
            <div
              class="tile position-relative bg-light rounded shadow-sm"
              draggable="true"
              @dragstart="onDragStart($event, template)"
              data-bs-toggle="popover"
              data-bs-trigger="hover focus"
              data-bs-html="true"
              :title="template.name"
              :data-bs-content="getPopoverContent(template)"
            >
              <div class="tile-title big-icon">
                <component :is="Icons[template.icon_name] || Icons.Box" />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, computed, watch, nextTick } from 'vue'
import { shortcodesService } from '@/js/api/services/shortcodes'
import Popover from 'bootstrap/js/dist/popover'
import * as Icons from 'lucide-vue-next'

const templates = ref([])
const searchTerm = ref('')
const selectedCategory = ref('')

// Получаем уникальные категории для селектора
const categories = computed(() => {
  const cats = templates.value.map((t) => t.component_type).filter(Boolean)
  return [...new Set(cats)]
})

// Группировка по категориям с фильтрацией по поиску и категории
const groupedTemplates = computed(() => {
  const term = searchTerm.value.toLowerCase().trim()
  const filtered = templates.value.filter((tpl) => {
    if (!tpl.is_active) return false
    if (selectedCategory.value && tpl.component_type !== selectedCategory.value) return false
    if (!term) return true
    return (
      String(tpl.id).includes(term) ||
      tpl.name.toLowerCase().includes(term) ||
      tpl.component_type?.toLowerCase().includes(term)
    )
  })
  // Группируем по категориям
  const groups = {}
  filtered.forEach((tpl) => {
    if (!groups[tpl.component_type]) groups[tpl.component_type] = []
    groups[tpl.component_type].push(tpl)
  })
  return groups
})

const onDragStart = (e, tpl) => {
  e.dataTransfer.setData('application/json', JSON.stringify(tpl))
  hideAllPopovers()
}
const hideAllPopovers = () => {
  popovers.forEach((p) => p.hide())
}

const loadTemplates = async () => {
  const res = await shortcodesService.getTemplates()
  if (res.success) templates.value = res.data
  else console.error('Ошибка загрузки шаблонов:', res.errors)
}

const getPopoverContent = (tpl) => `
  <table class="table table-bordered table-sm mb-0">
    <tr>
      <th>Название</th>
      <td>${tpl.name}</td>
    </tr>
    <tr>
      <th>ID</th>
      <td>${tpl.id}</td>
    </tr>
    <tr>
      <th>Категория</th>
      <td>${tpl.component_type}</td>
    </tr>
    <tr>
      <th>Классы</th>
      <td><code>${tpl.class_list || ''}</code></td>
    </tr>
  </table>
`

let popovers = []
const initPopovers = () => {
  popovers.forEach((p) => p.dispose())
  popovers = []
  nextTick(() => {
    document.querySelectorAll('[data-bs-toggle="popover"]').forEach((el) => {
      popovers.push(new Popover(el, { sanitize: false, container: 'body', html: true }))
    })
  })
}

watch(groupedTemplates, initPopovers, { immediate: true })

onMounted(async () => {
  await loadTemplates()
  initPopovers()
})
</script>

<style scoped>
.card-body {
  border: 2px dashed var(--bs-primary);
}
.category-separator {
  border-top: 3px solid var(--bs-danger);
  opacity: 0.5;
}
.row.g-0 {
  --bs-gutter-x: 0;
}
.tile-wrap {
  position: relative;
}
.col-6,
.col-md-3 {
  padding: 0;
}
.tile {
  border: 1.5px dashed gray;
  cursor: grab;
  transition: transform 0.2s, box-shadow 0.2s;
  aspect-ratio: 1/1;
  width: 100%;
  min-width: 0;
  background: var(--bs-light);
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  margin-bottom: 0;
}
.separator-left {
  border-left: 3px solid var(--bs-danger);
}
.tile-title.big-icon {
  width: 100%;
  height: 100%;
  display: flex;
  justify-content: center;
  align-items: center;
  font-size: 3.5rem;
}
.tile:hover {
  transform: translateY(-4px) scale(1.04);
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.2);
  border-color: var(--bs-primary);
  z-index: 2;
}
</style>
