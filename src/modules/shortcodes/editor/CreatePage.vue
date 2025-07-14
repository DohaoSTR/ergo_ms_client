<template>
  <div class="template-editor d-flex align-items-center justify-content-center">
    <div class="card shadow p-5 w-100" style="max-width: 1100px">
      <div class="row g-4">
        <div class="col-lg-7 border-end">
          <h3 class="mb-4 fw-semibold">Создание страницы</h3>

          <div class="mb-4">
            <label class="form-label fs-5">Название страницы</label>
            <input
              v-model="meta.title"
              type="text"
              class="form-control form-control-lg"
              placeholder="Введите название"
            />
          </div>

          <div class="mb-4" v-if="!meta.index">
            <label class="form-label fs-5">URL страницы (slug)</label>
            <input
              v-model="meta.slug"
              type="text"
              class="form-control form-control-lg"
              @input="onSlugInput"
            />
          </div>

          <div class="form-check form-switch mb-4">
            <input class="form-check-input" type="checkbox" id="indexSwitch" v-model="meta.index" />
            <label class="form-check-label fs-5" for="indexSwitch">
              Сделать «главной» страницей выбранной категории
            </label>
          </div>

          <div class="mb-4">
            <label class="form-label fs-5">URL полностью:</label>
            <div class="fw-bold text-primary fs-4 user-select-all">{{ fullUrl }}</div>
          </div>

          <div class="mb-4">
            <label class="form-label fs-5">Категория:</label>
            <div
              v-if="selectedCategory"
              class="alert alert-info py-3 px-4 mt-2 d-flex align-items-center mb-2 fs-6"
            >
              <span
                ><span class="text-secondary">Путь:</span
                ><b class="ms-2">{{ categoryPathString }}</b></span
              >
              <button class="btn btn-link text-danger ms-auto fs-4 p-0 lh-1" @click="resetCategory">
                &times;
              </button>
            </div>
            <div v-else class="form-text text-muted fs-6 mt-1 mb-0">Выберите категорию справа</div>
          </div>

          <div class="mb-4">
            <label class="form-label fs-5">Теги страницы:</label>
            <div v-if="tagsOfCurrentCategory.length" class="d-flex flex-wrap gap-2">
              <span
                v-for="t in tagsOfCurrentCategory"
                :key="t.id"
                class="badge tag-badge px-3 py-2 fs-6"
                :class="
                  selectedTagIds.includes(t.id)
                    ? 'bg-primary text-white'
                    : 'bg-light text-primary border border-primary'
                "
                @click="toggleTag(t.id)"
                >{{ t.name }}</span
              >
            </div>
            <div v-else class="form-text text-muted">Для этой категории нет тегов</div>
            <div class="form-text mt-1">
              Выбрано: <span v-if="selectedTagNames.length">{{ selectedTagNames.join(', ') }}</span
              ><span v-else>нет</span>
            </div>
          </div>

          <button
            class="btn btn-success text-white btn-lg mt-2 px-5 py-2 fs-5"
            :disabled="!selectedCategory"
            @click="savePage"
          >
            Создать страницу
          </button>
        </div>

        <div class="col-lg-5">
          <div class="card category-card shadow-sm border-0 h-100">
            <div class="card-body pb-2">
              <h5 class="card-title mb-3 fw-semibold">Категория страницы</h5>
              <input
                v-model="categorySearch"
                class="form-control form-control-lg mb-3 fs-5"
                type="text"
                placeholder="Поиск категории…"
              />
              <div class="category-scroll border rounded bg-light py-2 px-2">
                <CategoryTree
                  :categories="filteredCategories"
                  :selectedPath="selectedPath"
                  @select="handleSelect"
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { slugify as translitSlugify } from 'transliteration'
import CategoryTree from './CategoryTree.vue'
import { apiClient } from '@/js/api/manager'
import { endpoints } from '@/js/api/endpoints'
import { shortcodesService } from '@/modules/cms/js/shortcodes'

const meta = ref({ title: '', slug: '', index: false })
const slugEdited = ref(false)
const categories = ref([])
const categorySearch = ref('')
const selectedCategory = ref(null)
const selectedPath = ref([])
const allTags = ref([])
const selectedTagIds = ref([])
const router = useRouter()

const makeSlug = (t) => translitSlugify(t, { lowercase: true, separator: '-' })

watch(
  () => meta.value.title,
  (nt) => {
    if (!meta.value.index && !slugEdited.value) meta.value.slug = makeSlug(nt)
  }
)
const onSlugInput = () => (slugEdited.value = meta.value.slug.length > 0)
watch(
  () => meta.value.slug,
  (ns) => {
    if (meta.value.index) return
    if (!ns) {
      slugEdited.value = false
      meta.value.slug = makeSlug(meta.value.title)
    }
  }
)

const filterTree = (list, q) =>
  list
    .map((c) => {
      const hit = c.name.toLowerCase().includes(q)
      const kids = c.children ? filterTree(c.children, q) : []
      return hit || kids.length ? { ...c, children: kids } : null
    })
    .filter(Boolean)

const filteredCategories = computed(() =>
  categorySearch.value.trim()
    ? filterTree(categories.value, categorySearch.value.trim().toLowerCase())
    : categories.value
)

const handleSelect = ({ category, path }) => {
  selectedCategory.value = category
  selectedPath.value = path.concat([{ id: category.id, name: category.name, slug: category.slug }])
  selectedTagIds.value = []
}
const resetCategory = () => {
  selectedCategory.value = null
  selectedPath.value = []
  selectedTagIds.value = []
}

const categoryPathString = computed(() => selectedPath.value.map((p) => p.name).join(' → '))
const categoryPathSlugs = computed(() => selectedPath.value.map((p) => p.slug).join('/'))

const fullUrl = computed(() => {
  if (meta.value.index) return selectedPath.value.length ? '/' + categoryPathSlugs.value : '/'
  if (!meta.value.slug) return '/'
  return selectedPath.value.length
    ? '/' + categoryPathSlugs.value + '/' + meta.value.slug
    : '/' + meta.value.slug
})

const tagsOfCurrentCategory = computed(() =>
  selectedCategory.value
    ? allTags.value.filter((t) => t.category === selectedCategory.value.id)
    : []
)
const selectedTagNames = computed(() =>
  allTags.value.filter((t) => selectedTagIds.value.includes(t.id)).map((t) => t.name)
)
const toggleTag = (id) => {
  const i = selectedTagIds.value.indexOf(id)
  i === -1 ? selectedTagIds.value.push(id) : selectedTagIds.value.splice(i, 1)
}

const savePage = async () => {
  if (!selectedCategory.value) return

  const payload = {
    name: meta.value.title,
    category_id: selectedCategory.value.id,
    tags_ids: selectedTagIds.value,
    category_index: meta.value.index,
    // slug нужен только если страница не index
    ...(meta.value.index ? {} : { slug: meta.value.slug }),
  }

  const resp = await shortcodesService.createPage(payload)

  if (!resp.success) {
    alert(resp.message || 'Ошибка создания страницы')
    console.error(resp.errors)
    return
  }

  const page = resp.data
  router.push({ path: '/shortcodes/shortcode-editor', query: { page: page.id } })
}

const buildTree = (list) => {
  const m = {},
    roots = []
  list.forEach((i) => (m[i.id] = { ...i, children: [] }))
  list.forEach((i) => (i.parent ? m[i.parent]?.children.push(m[i.id]) : roots.push(m[i.id])))
  return roots
}
const fetchCategories = async () => {
  const r = await apiClient.get(endpoints.categories.list)
  categories.value = buildTree(Array.isArray(r.data) ? r.data : r.data.results || [])
}
const fetchTags = async () => {
  const r = await apiClient.get(endpoints.tags.list)
  allTags.value = Array.isArray(r.data) ? r.data : r.data.results || []
}
onMounted(() => {
  fetchCategories()
  fetchTags()
})
</script>

<style scoped>
.card {
  border-radius: 1.4rem;
  border: none;
}
.category-card {
  min-height: 400px;
  background: #f8faff;
}
.category-scroll {
  min-height: 140px;
  max-height: 380px;
  overflow-y: auto;
  border: 2px solid #e4e7ee !important;
  background: #f4f7fa;
}
.form-label {
  font-weight: 600;
  color: #2a384c;
}
.tag-badge {
  cursor: pointer;
  font-size: 1.1rem;
  border-radius: 2rem;
  transition: 0.15s;
  user-select: none;
}
.tag-badge.bg-primary {
  box-shadow: 0 2px 12px #2688eb22;
}
.tag-badge.bg-light {
  border: 1.5px solid #2688eb !important;
}
.btn-outline-primary {
  transition: 0.15s;
}
.btn-outline-primary:hover,
.btn-outline-primary:focus {
  background: #d0e6fa !important;
  color: #0d306b !important;
  border-color: #94baf3 !important;
}
.btn-primary.text-white {
  background: #2688eb !important;
  color: #fff !important;
  border-color: #2688eb !important;
}
.alert-info {
  font-size: 1.12rem;
  background: #eaf4fc;
  border-color: #bbe1fa;
}
@media (max-width: 991px) {
  .card {
    padding: 2rem 0.7rem !important;
  }
  .category-card {
    margin-top: 2rem;
  }
  .border-end {
    border-right: none !important;
    border-bottom: 2px solid #f0f0f0 !important;
    margin-bottom: 2rem;
  }
}
</style>
