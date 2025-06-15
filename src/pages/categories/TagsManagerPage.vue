<template>
  <div class="container py-4">
    <div class="mb-3">
      <label class="fw-bold">Категория страницы</label>
      <input
        type="text"
        class="form-control my-2"
        placeholder="Поиск категории..."
        v-model="categorySearch"
      />
      <div class="category-tree bg-light p-2 rounded" style="max-height: 340px; overflow-y: auto;">
        <CategoryTreeClick
          :categories="filteredCategories"
          :selected-id="selectedCategoryId"
          @select="onSelectCategory"
        />
      </div>
    </div>

    <div v-if="selectedCategory">
      <div class="card p-3 mb-3">
        <h5>
          <span class="text-secondary">
            {{ selectedCategory.level === 0 ? 'Категория' : 'Подкатегория' }}:
          </span>
          <span class="text-primary">{{ selectedCategory.name }}</span>
        </h5>
        <div class="mb-2">
          <input
            v-model="newTagName"
            class="form-control d-inline-block w-auto"
            placeholder="Название тега"
            @keyup.enter="addTag"
          />
          <button class="btn btn-success text-light ms-2" @click="addTag">Добавить тег</button>
        </div>
        <div>
          <b>Теги этой категории:</b>
          <ul class="list-group mt-2" v-if="categoryTags.length">
            <li v-for="tag in categoryTags" :key="tag.id"
                class="list-group-item d-flex justify-content-between align-items-center">
              <span>{{ tag.name }}</span>
              <div>
                <button class="btn btn-sm btn-outline-primary me-1" @click="editTag(tag)">Редактировать</button>
                <button class="btn btn-sm btn-outline-danger" @click="deleteTag(tag)">Удалить</button>
              </div>
            </li>
          </ul>
          <p v-else class="text-muted mt-2">Тегов пока нет.</p>
        </div>
      </div>
    </div>
    <div v-else class="alert alert-info">Выберите категорию, чтобы просмотреть и добавить теги</div>
    <div v-if="error" class="alert alert-danger mt-3">{{ error }}</div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import CategoryTreeClick from './CategoryTreeClick.vue'
import { endpoints } from '@/js/api/endpoints'
import { apiClient } from '@/js/api/manager'

const categories = ref([])
const tags = ref([])
const error = ref('')
const newTagName = ref('')
const selectedCategoryId = ref(null)
const categorySearch = ref('')

function filterCategoriesTree(list, search) {
  if (!search.trim()) return list
  const searchLower = search.trim().toLowerCase()
  function filterNode(node) {
    const match = node.name.toLowerCase().includes(searchLower)
    const filteredChildren = (node.children || []).map(filterNode).filter(Boolean)
    if (match || filteredChildren.length)
      return { ...node, children: filteredChildren }
    return null
  }
  return list.map(filterNode).filter(Boolean)
}

const filteredCategories = computed(() => filterCategoriesTree(categories.value, categorySearch.value))

function flattenCategories(list, parent = null, level = 0) {
  let result = []
  list.forEach(cat => {
    result.push({ ...cat, level })
    if (cat.children && cat.children.length) {
      result = result.concat(flattenCategories(cat.children, cat, level + 1))
    }
  })
  return result
}

const flatCategories = computed(() => flattenCategories(categories.value))

const selectedCategory = computed(() =>
  flatCategories.value.find(cat => cat.id === selectedCategoryId.value)
)

const categoryTags = computed(() =>
  tags.value.filter(tag => tag.category === selectedCategoryId.value)
)

async function fetchCategories() {
  error.value = ''
  try {
    const resp = await apiClient.get(endpoints.categories.list)
    if (Array.isArray(resp.data)) {
      categories.value = buildTree(resp.data)
    } else if (resp.data.results) {
      categories.value = buildTree(resp.data.results)
    } else {
      categories.value = []
    }
  } catch (e) {
    error.value = 'Ошибка загрузки категорий'
    categories.value = []
  }
}

function buildTree(list) {
  const map = {}
  const roots = []
  list.forEach(item => {
    map[item.id] = { ...item, children: [] }
  })
  list.forEach(item => {
    if (item.parent === null || item.parent === undefined) {
      roots.push(map[item.id])
    } else if (map[item.parent]) {
      map[item.parent].children.push(map[item.id])
    }
  })
  return roots
}

async function fetchTags() {
  error.value = ''
  try {
    const resp = await apiClient.get(endpoints.tags.list)
    tags.value = Array.isArray(resp.data) ? resp.data : (resp.data.results || [])
  } catch (e) {
    error.value = 'Ошибка загрузки тегов'
    tags.value = []
  }
}

async function addTag() {
  const name = newTagName.value.trim()
  if (!name || !selectedCategoryId.value) return
  try {
    await apiClient.post(endpoints.tags.create, {
      name,
      category: selectedCategoryId.value
    })
    newTagName.value = ''
    await fetchTags()
  } catch (e) {
    error.value = 'Ошибка добавления тега'
  }
}

async function editTag(tag) {
  const name = prompt('Новое название тега:', tag.name)
  if (!name) return
  try {
    await apiClient.patch(endpoints.tags.update(tag.id), { name })
    await fetchTags()
  } catch (e) {
    error.value = 'Ошибка редактирования тега'
  }
}

async function deleteTag(tag) {
  if (!confirm('Удалить тег?')) return
  try {
    await apiClient.delete(endpoints.tags.delete(tag.id))
    await fetchTags()
  } catch (e) {
    error.value = 'Ошибка удаления тега'
  }
}

// События дерева
function onSelectCategory(id) {
  selectedCategoryId.value = id
  newTagName.value = ''
}

onMounted(async () => {
  await fetchCategories()
  await fetchTags()
})
</script>

<style scoped>
.category-node:hover {
  background: #e6f0fb !important;
  transition: background 0.2s;
}
</style>
