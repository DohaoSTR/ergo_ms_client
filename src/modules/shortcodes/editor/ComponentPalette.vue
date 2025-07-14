<script setup>
import { ref, onMounted, computed, watch, nextTick } from 'vue'
import { shortcodesService } from '@/js/api/services/shortcodes'
import Popover from 'bootstrap/js/dist/popover'
import * as Icons from 'lucide-vue-next'

const templates = ref([])
const searchTerm = ref('')
const selectedCategory = ref('')
const openCats = ref(new Set())

const categories = computed(() => [...new Set(
  templates.value.map(t => t.component_type).filter(Boolean)
)])

const filtered = computed(() => {
  const term = searchTerm.value.toLowerCase().trim()
  return templates.value.filter(tpl => {
    if (!tpl.is_active) return false
    if (selectedCategory.value && tpl.component_type !== selectedCategory.value) return false
    if (!term) return true
    return (
      String(tpl.id).includes(term) ||
      tpl.name.toLowerCase().includes(term) ||
      tpl.component_type?.toLowerCase().includes(term)
    )
  })
})

const grouped = computed(() => {
  const g = {}
  filtered.value.forEach(tpl => {
    if (!g[tpl.component_type]) g[tpl.component_type] = []
    g[tpl.component_type].push(tpl)
  })
  return g
})

const onDragStart = (e, tpl) =>
  e.dataTransfer.setData('application/json', JSON.stringify(tpl))

let popovers = []
const initPopovers = () => {
  popovers.forEach(p => p.dispose())
  popovers = []
  nextTick(() => {
    document.querySelectorAll('[data-bs-toggle="popover"]')
      .forEach(el => popovers.push(new Popover(el, {
        sanitize: false, html: true, container: 'body', trigger: 'hover focus'
      })))
  })
}

const toggleCat = async (cat) => {
  openCats.value.has(cat) ? openCats.value.delete(cat)
    : openCats.value.add(cat)

  await nextTick()
  initPopovers()
}
const isOpen = cat => openCats.value.has(cat)

const pv = tpl => `
<table class="table table-sm mb-0">
<tr><th>Название</th><td>${tpl.name}</td></tr>
<tr><th>ID</th><td>${tpl.id}</td></tr>
<tr><th>Класс</th><td><code>${tpl.class_list || ''}</code></td></tr>
</table>`

onMounted(async () => {
  const r = await shortcodesService.getTemplates()
  if (r.success) templates.value = r.data
})
watch(grouped, initPopovers)
</script>

<template>
  <div class="card shadow-sm mb-3 h-100">
    <div class="card-header bg-primary text-white py-2">
      <div class="d-flex align-items-center mb-2">
        <Icons.Puzzle class="me-2" />
        <h5 class="mb-0 flex-grow-1 fs-6">Компоненты</h5>
      </div>

      <input v-model="searchTerm" type="text" class="form-control form-control-sm mb-2" placeholder="Поиск…" />

      <select v-model="selectedCategory" class="form-select form-select-sm">
        <option value="">Все категории</option>
        <option v-for="c in categories" :key="c" :value="c">{{ c }}</option>
      </select>
    </div>

    <div class="card-body p-2 components-scroll">
      <div v-for="(tpls, cat) in grouped" :key="cat" class="mb-3">
        <!-- заголовок-кнопка -->
        <div class="d-flex align-items-center fw-semibold small mb-2">
          <span class="flex-grow-1">{{ cat }}</span>
          <button class="btn btn-sm btn-light" @click="toggleCat(cat)">
            <Icons.ChevronDown v-if="isOpen(cat)" />
            <Icons.ChevronRight v-else />
          </button>
        </div>

        <!-- грид -->
        <transition name="fade">
          <div v-if="isOpen(cat)" class="icon-grid">
            <div v-for="tpl in tpls" :key="tpl.id" class="icon-tile" draggable="true"
              @dragstart="onDragStart($event, tpl)" data-bs-toggle="popover" :data-bs-content="pv(tpl)"
              :title="tpl.name">
              <component :is="Icons[tpl.icon_name] || Icons.Box" class="icon-svg" />
            </div>
          </div>
        </transition>
      </div>
    </div>
  </div>
</template>

<style scoped>
.components-scroll {
  max-height: 68vh;
  overflow-y: auto;
}

/* fade */
.fade-enter-active,
.fade-leave-active {
  transition: all .15s;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
  height: 0
}

/* grid */
.icon-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(60px, 1fr));
  gap: 4px;
}

.icon-tile {
  width: 60px;
  height: 60px;
  background: #f8f9fa;
  border: 1px dashed #ced4da;
  border-radius: .4rem;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: grab;
  user-select: none;
  transition: transform .15s, border-color .15s;
}

.icon-tile:hover {
  transform: scale(1.05);
  border-color: var(--bs-primary);
}

.icon-svg {
  width: 24px;
  height: 24px;
}
</style>
