<template>
  <div class="container py-4">
    <div class="d-flex align-items-center mb-4">
      <h2 class="mb-4 fw-semibold">Список страниц</h2>
      <button class="btn btn-success text-white mb-3 ms-3" @click="goCreatePage"
        style="font-size: 1.3rem; font-weight: 500">
        + Создать страницу
      </button>
    </div>

    <div class="row mb-4 align-items-start">
      <div class="col-md-4 mb-3 mb-md-0">
        <label class="form-label">Категория</label>
        <input v-model="categorySearch" class="form-control form-control-lg mb-2" type="text"
          placeholder="Поиск категории…" />
        <div class="category-tree border rounded bg-light py-2 px-2">
          <CategoryTree :categories="filteredCategories" :selectedPath="selectedPath" @select="handleSelect" />
        </div>
        <div v-if="selectedCategory" class="form-text text-muted mt-2">
          Выбрано: <b>{{ categoryPathString }}</b>
          <button class="btn btn-link btn-sm text-danger p-0 ms-2" @click="resetCategory">
            ×
          </button>
        </div>
      </div>

      <div class="col-md-8">
        <label class="form-label">Теги (в категории)</label>
        <div>
          <button v-for="tag in tagsOfCurrentCategory" :key="tag.id" @click="toggleTag(tag.id)"
            class="badge tag-badge rounded-pill me-2 mb-2" :class="selectedTagIds.includes(tag.id)
              ? 'bg-primary text-white'
              : 'bg-light text-dark border border-primary'">
            {{ tag.name }}
          </button>
          <span v-if="selectedCategory && !tagsOfCurrentCategory.length" class="text-muted">
            Нет тегов для этой категории
          </span>
        </div>
      </div>
    </div>

    <div class="row g-4">
      <div v-for="page in filteredPages" :key="page.id" class="col-12 col-md-6 col-lg-4">
        <div class="card h-100 shadow-sm">
          <div class="card-body">
            <h5 class="card-title mb-1">
              <a :href="pageUrl(page)" class="text-decoration-none" target="_blank" style="color: inherit">
                {{ page.name }}
              </a>
            </h5>

            <p class="card-subtitle mb-2 text-muted">{{ page.full_url }}</p>

            <div class="mb-2">
              <span class="badge bg-secondary me-1">
                {{ page.category?.name || 'Без категории' }}
              </span>
              <span v-for="tag in page.tags" :key="tag.id" class="badge bg-primary me-1">
                {{ tag.name }}
              </span>
            </div>

            <a :href="`/shortcodes/shortcode-editor?page=${page.id}`" class="btn btn-secondary btn-sm mt-2">
              Редактировать
            </a>

            <button class="btn btn-danger btn-sm mt-2 ms-2" :disabled="deletingId === page.id"
              @click="removePage(page)">
              <span v-if="deletingId === page.id" class="spinner-border spinner-border-sm me-1" />
              Удалить
            </button>

            <a :href="pageUrl(page)" class="btn btn-success text-white btn-sm mt-2 ms-2" target="_blank">
              Открыть
            </a>
          </div>
        </div>
      </div>
    </div>

    <div v-if="!filteredPages.length" class="alert alert-info mt-4">
      Нет страниц по выбранным фильтрам.
    </div>
  </div>
</template>

<script setup>
import { useRouter } from 'vue-router'
import { ref, computed, onMounted, watch } from 'vue'
import CategoryTree from './editor/CategoryTree.vue'
import { shortcodesService } from '@/modules/cms/js/shortcodes'

const pages = ref([])
const categories = ref([])
const allTags = ref([])
const deletingId = ref(null)

const router = useRouter()
const goCreatePage = () => router.push('/shortcodes/create-page')

const categorySearch = ref('')
const selectedCategory = ref(null)
const selectedCatIds = ref([])
const selectedPath = ref([])
const selectedTagIds = ref([])

const pageUrl = (p) => (p.full_url.startsWith('/') ? p.full_url : `/${p.full_url}`)

const categoryMap = ref({})
function buildTree(list) {
  const map = Object.fromEntries(list.map(i => [i.id, { ...i, children: [] }]))
  const roots = []
  list.forEach(i => (i.parent ? map[i.parent]?.children.push(map[i.id]) : roots.push(map[i.id])))
  categoryMap.value = map
  return roots
}
function collectIds(node) {
  const stack = [node], ids = []
  while (stack.length) {
    const cur = stack.pop()
    ids.push(cur.id)
    if (cur.children?.length) stack.push(...cur.children)
  }
  return ids
}
function filterTree(nodes, q) {
  return nodes.map(n => {
    const hit = n.name.toLowerCase().includes(q)
    const kids = n.children ? filterTree(n.children, q) : []
    return (hit || kids.length) ? { ...n, children: kids } : null
  }).filter(Boolean)
}

const filteredCategories = computed(() =>
  categorySearch.value.trim()
    ? filterTree(categories.value, categorySearch.value.trim().toLowerCase())
    : categories.value
)
const categoryPathString = computed(() => selectedPath.value.map(p => p.name).join(' → '))
const tagsOfCurrentCategory = computed(() =>
  !selectedCatIds.value.length
    ? []
    : allTags.value.filter(t => selectedCatIds.value.includes(t.category))
)
const filteredPages = computed(() => {
  let list = pages.value
  if (selectedCatIds.value.length)
    list = list.filter(p => p.category && selectedCatIds.value.includes(p.category.id))
  if (selectedTagIds.value.length)
    list = list.filter(p =>
      selectedTagIds.value.every(tid => p.tags.some(tag => tag.id === tid))
    )
  return list
})

function handleSelect({ category, path }) {
  selectedCategory.value = category
  selectedPath.value = path.concat([{ id: category.id, name: category.name }])
  selectedCatIds.value = collectIds(category)
}
function resetCategory() {
  selectedCategory.value = null
  selectedPath.value = []
  selectedCatIds.value = []
  selectedTagIds.value = []
}
function toggleTag(id) {
  const i = selectedTagIds.value.indexOf(id)
  i === -1 ? selectedTagIds.value.push(id) : selectedTagIds.value.splice(i, 1)
}

async function removePage(p) {
  const ok = confirm(`Удалить страницу «${p.name}»? Это действие необратимо.`)
  if (!ok) return
  deletingId.value = p.id
  const r = await shortcodesService.deletePage(p.slug);
  deletingId.value = null
  if (!r.success) return alert(r.message || 'Не удалось удалить страницу')
  pages.value = pages.value.filter(pg => pg.id !== p.id)
}

async function fetchData() {
  const pageResp = await shortcodesService.getPages()
  pages.value = Array.isArray(pageResp.data) ? pageResp.data : pageResp.data.results || []

  const catResp = await shortcodesService.getCategories()
  categories.value = buildTree(
    Array.isArray(catResp.data) ? catResp.data : catResp.data.results || []
  )

  const tagResp = await shortcodesService.getTags()
  allTags.value = Array.isArray(tagResp.data) ? tagResp.data : tagResp.data.results || []
}
watch(selectedCategory, () => (selectedTagIds.value = []))
onMounted(fetchData)
</script>

<style scoped>
.badge {
  user-select: none;
  transition: background 0.15s, color 0.15s;
}

.tag-badge {
  font-size: 1.1rem;
  border-radius: 2rem;
  cursor: pointer;
}

.tag-badge.bg-primary {
  box-shadow: 0 1px 6px #2688eb22;
}

.card {
  border-radius: 1.3rem;
}

.category-tree {
  min-height: 120px;
  max-height: 320px;
  overflow-y: auto;
  border: 2px solid #e4e7ee !important;
  background: #f4f7fa;
}

.btn-danger {
  --bs-btn-hover-bg: #f8d7da;
  --bs-btn-hover-border-color: #dc3545;
}
</style>
