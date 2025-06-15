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
              style="font-size: 1.15rem"
            />
          </div>
          <div class="mb-4">
            <label class="form-label fs-5">URL страницы (slug)</label>
            <input
              v-model="meta.slug"
              type="text"
              class="form-control form-control-lg"
              @input="onSlugInput"
              style="font-size: 1.08rem"
            />
          </div>
          <div class="mb-4">
            <label class="form-label fs-5">URL страницы полностью:</label>
            <div class="fw-bold text-primary fs-4 user-select-all">{{ fullUrl }}</div>
          </div>
          <div class="mb-4">
            <label class="form-label fs-5">Категория:</label>
            <div
              v-if="selectedCategory"
              class="alert alert-info py-3 px-4 mt-2 d-flex align-items-center mb-2 fs-6"
              style="font-size: 1.1rem"
            >
              <span>
                <span class="text-secondary">Путь:</span>
                <b class="ms-2">{{ categoryPathString }}</b>
              </span>
              <button
                class="btn btn-link text-danger ms-auto fs-4 p-0 lh-1"
                style="margin-top: -5px"
                @click="resetCategory"
                title="Сбросить выбор"
              >
                &times;
              </button>
            </div>
            <div v-else class="form-text text-muted fs-6 mt-1 mb-0">Выберите категорию справа</div>
          </div>
          <button
            class="btn btn-success text-white btn-lg mt-2 px-5 py-2 fs-5"
            @click="savePage"
            :disabled="!meta.title || !meta.slug"
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
                placeholder="Поиск категории..."
                style="font-size: 1.12rem"
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
import { ref, computed, watch } from 'vue'
import { slugify as translitSlugify } from 'transliteration'
import CategoryTree from './CategoryTree.vue'

// тестовые данные
const mockCategories = [
  {
    id: 1,
    name: 'Электроника',
    slug: 'electronics',
    children: [
      {
        id: 2,
        name: 'Ноутбуки',
        slug: 'notebooks',
        children: [
          { id: 3, name: 'Dell', slug: 'dell' },
          { id: 4, name: 'HP', slug: 'hp' },
        ],
      },
      {
        id: 5,
        name: 'Смартфоны',
        slug: 'smartphones',
        children: [
          { id: 6, name: 'Apple', slug: 'apple' },
          { id: 7, name: 'Samsung', slug: 'samsung' },
        ],
      },
    ],
  },
  {
    id: 11,
    name: 'Одежда',
    slug: 'clothes',
    children: [
      {
        id: 12,
        name: 'Мужская',
        slug: 'mens',
        children: [
          { id: 13, name: 'Рубашки', slug: 'shirts' },
          { id: 14, name: 'Джинсы', slug: 'jeans' },
        ],
      },
      {
        id: 15,
        name: 'Женская',
        slug: 'womens',
        children: [
          { id: 16, name: 'Платья', slug: 'dresses' },
          { id: 17, name: 'Юбки', slug: 'skirts' },
        ],
      },
    ],
  },
]
const categoriesTree = ref(mockCategories)

// поиск и фильтрация категорий
const categorySearch = ref('')
function filterTree(categories, search) {
  return categories
    .map((cat) => {
      let found = cat.name.toLowerCase().includes(search)
      let filteredChildren = cat.children ? filterTree(cat.children, search) : []
      if (filteredChildren.length) found = true
      if (found)
        return {
          ...cat,
          children: filteredChildren,
        }
      return null
    })
    .filter(Boolean)
}
const filteredCategories = computed(() => {
  if (!categorySearch.value.trim()) return categoriesTree.value
  return filterTree(categoriesTree.value, categorySearch.value.trim().toLowerCase())
})

// генерация slug
const meta = ref({
  title: '',
  slug: '',
})
const slugEdited = ref(false)
function makeSlug(text) {
  return translitSlugify(text, { lowercase: true, separator: '-' })
}
watch(
  () => meta.value.title,
  (newTitle) => {
    if (!slugEdited.value) meta.value.slug = makeSlug(newTitle)
  }
)
function onSlugInput() {
  slugEdited.value = meta.value.slug.length > 0
}
watch(
  () => meta.value.slug,
  (newSlug) => {
    if (!newSlug) {
      slugEdited.value = false
      meta.value.slug = makeSlug(meta.value.title)
    }
  }
)

// Выбор категории
const selectedCategory = ref(null)
const selectedPath = ref([])
function handleSelect({ category, path }) {
  selectedCategory.value = category
  selectedPath.value = path.concat([{ name: category.name, slug: category.slug, id: category.id }])
}
function resetCategory() {
  selectedCategory.value = null
  selectedPath.value = []
}
const categoryPathString = computed(() => selectedPath.value.map((p) => p.name).join(' → '))
const categoryPathSlugs = computed(() => selectedPath.value.map((p) => p.slug))

const fullUrl = computed(() => {
  if (!meta.value.slug) return '/'
  if (!categoryPathSlugs.value.length) return '/' + meta.value.slug
  return '/' + [...categoryPathSlugs.value, meta.value.slug].join('/')
})

function savePage() {
  alert(
    `Создана страница:\nНазвание: ${meta.value.title}\nSlug: ${meta.value.slug}\nКатегория: ${categoryPathString.value}\nURL: ${fullUrl.value}`
  )
}
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
.btn-outline-primary {
  transition: background 0.15s, color 0.15s, border 0.15s;
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
.fs-4,
.fs-5,
.fs-6 {
  font-size: 1.5rem !important;
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