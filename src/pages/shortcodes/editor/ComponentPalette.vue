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
        class="form-control form-control-sm"
        placeholder="Поиск"
      />
    </div>
    <div class="card-body p-2">
      <div class="row g-2">
        <div v-for="template in filteredTemplates" :key="template.id" class="col-6 col-md-3">
          <div
            class="tile position-relative bg-light rounded shadow-sm p-3"
            draggable="true"
            @dragstart="onDragStart($event, template)"
            data-bs-toggle="popover"
            data-bs-trigger="hover focus"
            data-bs-html="true"
            :title="template.name"
            :data-bs-content="getPopoverContent(template)"
          >
            <div class="tile-title text-truncate">
              <component :is="Icons[template.icon_name] || Icons.Box" />
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

// Фильтрация по ID, имени, типу
const filteredTemplates = computed(() => {
  const term = searchTerm.value.toLowerCase().trim()
  const active = templates.value.filter((tpl) => tpl.is_active)
  if (!term) return active
  return active.filter((tpl) => {
    return (
      String(tpl.id).includes(term) ||
      tpl.name.toLowerCase().includes(term) ||
      tpl.component_type.toLowerCase().includes(term)
    )
  })
})

const getPopoverContent = (tpl) =>
  `<div><strong>ID:</strong> ${tpl.id}</div>
     <div><strong>Type:</strong> ${tpl.component_type}</div>`

let popovers = []
const initPopovers = () => {
  popovers.forEach((p) => p.dispose())
  popovers = []
  nextTick(() => {
    document.querySelectorAll('[data-bs-toggle="popover"]').forEach((el) => {
      popovers.push(new Popover(el))
    })
  })
}

watch(filteredTemplates, initPopovers, { immediate: true })

onMounted(async () => {
  await loadTemplates()
  initPopovers()
})
</script>

<style scoped>
.card-body {
  border: 2px dashed var(--bs-primary);
}
.tile {
  border: 2px dashed gray;
  cursor: grab;
  transition:
    transform 0.2s,
    box-shadow 0.2s;
}
.tile:hover {
  transform: translateY(-4px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}
</style>
