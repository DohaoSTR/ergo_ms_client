<template>
  <div class="card shadow-sm mb-4">
    <div class="card-header bg-primary text-white d-flex align-items-center flex-wrap gap-2">
      <!-- Шаг 1 -->
      <ListTree class="me-2" data-step="1" data-intro="Навигационное дерево страниц" />

      <!-- Шаг 2 -->
      <h5 class="mb-0 me-auto" data-step="2" data-intro="Заголовок рабочей области">
        Рабочая область
      </h5>

      <!-- Шаг 3 -->
      <div v-if="pageInfo" class="page-info text-white-50 me-auto small lh-sm" data-step="3"
        data-intro="Текущая страница и её URL">
        <span class="d-block fw-semibold">{{ pageInfo.name }}</span>
        <span class="d-block">{{ pageInfo.full_url }}</span>
      </div>

      <!-- Шаг 4 -->
      <select v-if="templatePages.length" v-model="selectedTemplateId" class="form-select form-select-sm w-auto"
        data-step="4" data-intro="Выберите готовую страницу как шаблон">
        <option :value="null" disabled>Загрузить шаблон…</option>
        <option v-for="p in templatePages" :key="p.id" :value="p.id">{{ p.name }}</option>
      </select>

      <!-- Шаг 5 -->
      <button v-if="selectedTemplateId" class="btn btn-sm btn-outline-light" @click="applyTemplate" data-step="5"
        data-intro="Загрузить выбранный шаблон">
        Загрузить
      </button>

      <!-- Шаг 6 -->
      <button class="btn btn-sm btn-outline-light ms-2" @click="startIntro(true)" data-step="6"
        data-intro="Перезапустить тур подсказок">
        ❓
      </button>

      <!-- Шаг 7 -->
      <button class="btn btn-sm btn-outline-warning ms-2" @click="showDebug = !showDebug" data-step="7"
        data-intro="Показать/скрыть отладочную информацию">
        {{ showDebug ? 'Скрыть отладку' : 'Отладка для опытных' }}
      </button>
    </div>

    <div class="card-body p-0 position-relative">
      <div v-if="loadError" class="alert alert-danger m-4">{{ loadError }}</div>

      <!-- Аудит H1 -->
      <div v-if="showAudit" class="alert alert-info d-flex align-items-center m-3" data-step="8"
        data-intro="Добавьте H1‑заголовок — это важно для SEO и доступности">
        <strong class="me-2">ℹ️</strong>
        Страница пока без <code>&lt;h1&gt;</code>. Рекомендуем добавить главный заголовок.
        <button class="btn-close ms-auto" @click="showAudit = false" />
      </div>

      <!-- Drag & Drop дерево -->
      <Draggable v-model="internalTree" :key="treeKey" :external-data-handler="externalDataHandler"
        :on-external-drag-over="() => true" :eachDroppable="eachDroppable" tree-line value-key="uid"
        class="drop-area overflow-auto p-3" data-step="9"
        data-intro="Перетаскивайте блоки, чтобы сформировать страницу">
        <template #default="{ node, stat }">
          <div>
            <OpenIcon v-if="stat.children.length" :open="stat.open" class="me-2 text-primary"
              @click="stat.open = !stat.open" />
            <div class="d-flex justify-content-between align-items-center p-2 mb-2 bg-white rounded shadow-sm">
              <div>
                <b>{{ node.template_name }}</b><br />
                <small class="text-muted">{{ node.component_type }}</small>
              </div>
              <div class="btn-group btn-group-sm">
                <button class="btn btn-outline-secondary" @click="$emit('open-settings', node)">
                  ⚙️
                </button>
                <button class="btn btn-outline-danger" @click="removeNode(node.uid)">🗑️</button>
              </div>
            </div>
          </div>
        </template>
      </Draggable>

      <!-- Кнопка публикации -->
      <div class="d-flex justify-content-end mt-4 mb-2 px-3" data-step="10"
        data-intro="Сохранить и посмотреть страницу">
        <button class="btn btn-success text-white btn-lg px-5 py-2 fs-5" :disabled="isSaving || !internalTree.length"
          @click="saveToDb">
          <span v-if="isSaving" class="spinner-border spinner-border-sm me-2"></span>
          Опубликовать
        </button>
      </div>

      <!-- Отладка -->
      <div v-if="showDebug" class="p-3 bg-light border-top" data-step="11" data-intro="Внутренние структуры и различия">
        <div class="row">
          <div class="col-12 col-md-4">
            <h6>Исходное дерево</h6>
            <pre class="debug-box">{{ JSON.stringify(internalTree, null, 2) }}</pre>
          </div>
          <div class="col-12 col-md-4">
            <h6>Flat‑дерево</h6>
            <pre class="debug-box">{{ JSON.stringify(flatTree, null, 2) }}</pre>
          </div>
          <div class="col-12 col-md-4">
            <h6>Восстановленное дерево</h6>
            <pre class="debug-box">{{ JSON.stringify(rebuiltTree, null, 2) }}</pre>
          </div>
        </div>
        <div class="mt-3">
          <h6>Различия</h6>
          <pre class="debug-box">{{ diffResult || 'Нет различий!' }}</pre>
        </div>
      </div>

      <div v-if="!showAudit && !hasH1" class="alert alert-warning m-3 small">
        ⚠️ Страница без H1‑заголовка. Добавьте его для лучшей индексации.
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { v4 as uuidv4 } from 'uuid'
import { Draggable, OpenIcon } from '@he-tree/vue'
import { ListTree } from 'lucide-vue-next'
import introJs from 'intro.js'
import 'intro.js/introjs.css'
import { shortcodesService } from '@/modules/cms/js/shortcodes'

const props = defineProps({
  modelValue: { type: Array, default: () => [] },
})
const emit = defineEmits(['update:modelValue', 'open-settings'])

const route = useRoute()
const router = useRouter()

// состояния
const treeKey = ref(0)
const showDebug = ref(false)
const isSaving = ref(false)
const loadError = ref('')
const showAudit = ref(false)

const pageInfo = ref(null)
const allPages = ref([])
const selectedTemplateId = ref(null)

const INTRO_SEEN_KEY = 'cms_shortcodes_intro_seen'

// вычисления
const pageId = computed(() => {
  const val = route.query.page ?? route.params.page
  const num = Number(val)
  return isNaN(num) ? null : num
})

const internalTree = computed({
  get: () => props.modelValue,
  set: (val) => emit('update:modelValue', val),
})

const flatTree = computed(() => flattenTree(internalTree.value))
const rebuiltTree = computed(() => rebuildTree(flatTree.value))
const diffResult = computed(() => simpleDiff(internalTree.value, rebuiltTree.value).join('\n'))

const hasH1 = computed(() => {
  const isH1 = (node) => {
    const type = (node.component_type || '').toLowerCase()

    if (type === 'h1')
      return true

    if (
      type === 'heading' &&
      (node.extra_data?.level === 1 ||
        (node.extra_data?.tag || '').toLowerCase() === 'h1')
    ) {
      return true
    }

    return /(^|\s)h1\b/i.test(node.template_name || '')
  }

  return flatTree.value.some(isH1)
})

const templatePages = computed(() =>
  pageInfo.value
    ? allPages.value.filter(
      (p) => p.id !== pageInfo.value.id && p.category?.id === pageInfo.value.category?.id
    )
    : []
)

// DnD вспомогательные
const eachDroppable = (stat) => stat.data.allow_children === true
const externalDataHandler = (event) => {
  const tpl = JSON.parse(event.dataTransfer.getData('application/json'))
  return assignUidsRecursively({
    ...tpl,
    template: tpl.template ?? tpl.id,
    template_name: tpl.template_name ?? tpl.name,
  })
}

// функции дерева/UID/дифф
function assignUidsRecursively(node) {
  return {
    ...node,
    uid: uuidv4(),
    children: node.children ? node.children.map(assignUidsRecursively) : [],
  }
}

function flattenTree(tree, parent = null) {
  return tree.flatMap((node, idx) => {
    const { children, ...rest } = node
    const item = {
      ...rest,
      template: rest.template ?? rest.id,
      parent: parent ? parent.uid : null,
      position: idx,
    }
    return [item, ...(children ? flattenTree(children, node) : [])]
  })
}

function rebuildTree(flat) {
  if (!Array.isArray(flat)) return []
  const map = Object.fromEntries(flat.map((i) => [i.uid, { ...i, children: [] }]))
  const roots = []
  flat.forEach((i) =>
    i.parent ? map[i.parent]?.children.push(map[i.uid]) : roots.push(map[i.uid])
  )
  return roots
}

function simpleDiff(a, b, path = '') {
  let out = []
  if (Array.isArray(a) && Array.isArray(b)) {
    for (let i = 0; i < Math.max(a.length, b.length); i++) {
      out = out.concat(simpleDiff(a[i], b[i], `${path}.${i}`))
    }
    return out
  }
  if (typeof a === 'object' && typeof b === 'object' && a && b) {
    for (const k of Object.keys(a)) {
      if (['parent', 'position', 'uid'].includes(k)) continue
      if (!(k in b)) out.push(`${path}.${k}: Нет во втором`)
      else out = out.concat(simpleDiff(a[k], b[k], `${path}.${k}`))
    }
    for (const k of Object.keys(b)) {
      if (!['parent', 'position', 'uid'].includes(k) && !(k in a))
        out.push(`${path}.${k}: Нет в первом`)
    }
    return out
  }
  if (a !== b) return [`${path}: "${a}" ≠ "${b}"`]
  return []
}

// удаление узла
function removeNode(uid) {
  if (internalTree.value.length === 1 && internalTree.value[0].uid === uid) {
    alert('Нельзя удалить последний компонент!')
    return
  }
  const deepRemove = (arr) =>
    arr
      .filter((n) => n.uid !== uid)
      .map((n) => ({ ...n, children: n.children ? deepRemove(n.children) : [] }))
  emit('update:modelValue', deepRemove(internalTree.value))
  treeKey.value++
}

// загрузка данных страницы
async function loadPageInfo() {
  const resp = await shortcodesService.getPages()
  allPages.value = Array.isArray(resp.data) ? resp.data : resp.data.results || []
  pageInfo.value = allPages.value.find((p) => p.id === pageId.value) || null
}

async function loadFromDb() {
  if (!pageId.value) {
    loadError.value = 'Не передан pageId в URL'
    return
  }
  try {
    loadError.value = ''
    const resp = await shortcodesService.getInstancesTree({ page: pageId.value })
    emit('update:modelValue', Array.isArray(resp.data) ? resp.data : [])
    treeKey.value++
  } catch (e) {
    loadError.value = 'Ошибка загрузки: ' + (e?.message || e)
  }
}

// сохранение
async function saveToDb() {
  if (!pageId.value) {
    alert('Нет pageId — невозможно сохранить!')
    return
  }
  isSaving.value = true
  try {
    const data = flatTree.value.map((n) => ({ ...n, page: pageId.value }))
    await shortcodesService.bulkCreateInstances(data)
    if (pageInfo.value?.full_url) {
      const url = pageInfo.value.full_url.startsWith('/')
        ? pageInfo.value.full_url
        : '/' + pageInfo.value.full_url
      router.push(url)
    }
  } catch (e) {
    alert('Ошибка сохранения: ' + (e?.message || e))
  } finally {
    isSaving.value = false
  }
}

// шаблоны
async function applyTemplate() {
  if (!selectedTemplateId.value) return
  const ok = confirm(
    'Заменить текущее дерево компонентами из выбранной страницы?\nНесохранённые изменения будут потеряны.'
  )
  if (!ok) return
  try {
    const resp = await shortcodesService.getInstancesTree({ page: selectedTemplateId.value })
    const tplTree = Array.isArray(resp.data) ? resp.data : []
    emit('update:modelValue', tplTree.map(assignUidsRecursively))
    treeKey.value++
    selectedTemplateId.value = null
  } catch (e) {
    alert('Не удалось загрузить шаблон: ' + (e?.message || e))
  }
}

// подсказки Intro.js
function startIntro(force = false) {
  if (!force && localStorage.getItem(INTRO_SEEN_KEY) === '1') return

  showAudit.value = false // скрываем аудит во время тура

  introJs()
    .setOptions({
      tooltipClass: 'customTooltip',
      highlightClass: 'customHighlight',
      showProgress: true,
      overlayOpacity: 0.8,
      exitOnOverlayClick: true,
      nextLabel: 'Далее →',
      prevLabel: '← Назад',
      doneLabel: 'Понятно',
      skipLabel: 'Пропустить',
    })
    .start()
    .oncomplete(() => localStorage.setItem(INTRO_SEEN_KEY, '1'))
    .onexit(() => localStorage.setItem(INTRO_SEEN_KEY, '1'))
}

// инициализация
onMounted(async () => {
  await Promise.all([loadPageInfo(), loadFromDb()])

  // автозапуск тура, если у пользователя < 10 страниц и тур ещё не проходили
  if (allPages.value.length < 10) startIntro(false)

  // показываем аудит, если нет H1
  showAudit.value = !hasH1.value
})

watch(hasH1, (v) => {
  showAudit.value = !v
})
</script>

<style scoped>
.drop-area {
  min-height: 150px;
  border: 2px dashed var(--bs-primary);
  border-radius: 0.375rem;
  background-color: var(--bs-light);
  transition: background-color 0.2s ease;
}

.drop-area:hover {
  background-color: rgba(var(--bs-primary-rgb), 0.1);
}

.debug-box {
  max-height: 320px;
  overflow: auto;
  background: #fff;
  border: 1px solid #dee2e6;
  border-radius: 0.375rem;
  padding: 0.5rem;
  font-family: monospace;
  font-size: 0.825rem;
}

.customTooltip {
  background: #fff;
  color: #333;
  border-radius: 8px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.2);
  padding: 1rem;
  max-width: 320px;
}

.customHighlight {
  box-shadow: 0 0 0 4px rgba(13, 110, 253, 0.25);
  border-radius: 8px;
}

.introjs-tooltip-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 0.5rem;
}

.introjs-skipbutton {
  margin-left: auto !important;
  color: #dc3545 !important;
  opacity: 1 !important;
}
</style>
