<template>
  <div class="container py-4">
    <h2>Менеджер категорий</h2>

    <button class="btn btn-danger mb-2" @click="showAddRootInput = true" v-if="!showAddRootInput">
      Добавить корневую категорию
    </button>
    <div v-if="showAddRootInput" class="mb-3">
      <input v-model="newRootCategoryName" class="form-control d-inline-block w-auto" placeholder="Название категории" @keyup.enter="addCategory(null)" />
      <button class="btn btn-success text-light ms-2" @click="addCategory(null)">Сохранить</button>
      <button class="btn btn-secondary ms-1" @click="cancelAddRoot">Отмена</button>
    </div>

    <CategoryTreeWithTags
      :categories="categories"
      :tags="tags"
      :level="0"
      @add="addCategory"
      @edit="editCategory"
      @delete="deleteCategory"
    />

    <div v-if="error" class="alert alert-danger mt-3">{{ error }}</div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { endpoints } from '@/js/api/endpoints'
import { apiClient } from '@/js/api/manager'
import CategoryTreeWithTags from '@/pages/categories/CategoryTreeWithTags.vue'

const categories = ref([])
const tags = ref([])
const error = ref('')
const showAddRootInput = ref(false)
const newRootCategoryName = ref('')

function buildTree(list) {
  const map = {}, roots = []
  list.forEach(item => map[item.id] = { ...item, children: [] })
  list.forEach(item => {
    if (!item.parent) roots.push(map[item.id])
    else if (map[item.parent]) map[item.parent].children.push(map[item.id])
  })
  return roots
}

async function fetchCategories() {
  error.value = ''
  try {
    const resp = await apiClient.get(endpoints.categories.list)
    categories.value = buildTree(Array.isArray(resp.data) ? resp.data : (resp.data.results ?? []))
  } catch {
    error.value = 'Ошибка загрузки категорий'
    categories.value = []
  }
}
async function fetchTags() {
  error.value = ''
  try {
    const resp = await apiClient.get(endpoints.tags.list)
    tags.value = Array.isArray(resp.data) ? resp.data : (resp.data.results ?? [])
  } catch {
    error.value = 'Ошибка загрузки тегов'
    tags.value = []
  }
}
async function addCategory(parentId) {
  let name
  if (parentId === null) {
    name = newRootCategoryName.value.trim()
    if (!name) return
  } else {
    name = prompt('Название подкатегории:')
    if (!name) return
  }
  try {
    await apiClient.post(endpoints.categories.create, { name, parent: parentId })
    showAddRootInput.value = false
    newRootCategoryName.value = ''
    await fetchCategories()
  } catch {
    error.value = 'Ошибка добавления'
  }
}
async function editCategory(category) {
  const name = prompt('Новое название:', category.name)
  if (!name) return
  try {
    await apiClient.patch(endpoints.categories.update(category.id), { name })
    await fetchCategories()
  } catch {
    error.value = 'Ошибка редактирования'
  }
}
async function deleteCategory(category) {
  // Проверяем, есть ли дочерние категории
  const hasChildren = categories.value.some(cat => 
    findCategoryInTree(categories.value, cat.id)?.children?.length > 0
  )
  
  let confirmMessage = `Удалить категорию "${category.name}"?`
  if (hasChildren) {
    confirmMessage = `Удалить категорию "${category.name}" и все её подкатегории? Это действие нельзя отменить.`
  }
  
  if (!confirm(confirmMessage)) return
  
  try {
    console.log('Удаляем категорию:', category.id)
    
    // Отправляем DELETE запрос
    const response = await apiClient.delete(endpoints.categories.delete(category.id))
    console.log('Ответ сервера:', response)
    
    // Перезагружаем список категорий
    await fetchCategories()
    
    // Показываем уведомление об успехе
    alert(`Категория "${category.name}" успешно удалена`)
    
  } catch (e) {
    console.error('Ошибка удаления категории:', e)
    
    // Более детальная обработка ошибок
    let errorMessage = 'Ошибка удаления категории'
    
    if (e.response) {
      // Ошибка от сервера
      if (e.response.status === 404) {
        errorMessage = 'Категория не найдена'
      } else if (e.response.status === 403) {
        errorMessage = 'Нет прав для удаления категории'
      } else if (e.response.status === 400) {
        errorMessage = 'Невозможно удалить категорию: ' + (e.response.data?.detail || 'неверные данные')
      } else if (e.response.data?.detail) {
        errorMessage = e.response.data.detail
      } else if (e.response.data?.message) {
        errorMessage = e.response.data.message
      }
    } else if (e.request) {
      // Проблема с сетью
      errorMessage = 'Проблема с подключением к серверу'
    } else {
      // Другая ошибка
      errorMessage = e.message || 'Неизвестная ошибка'
    }
    
    error.value = errorMessage
  }
}

// Функция для поиска категории в дереве
function findCategoryInTree(tree, categoryId) {
  for (const item of tree) {
    if (item.id === categoryId) {
      return item
    }
    if (item.children && item.children.length > 0) {
      const found = findCategoryInTree(item.children, categoryId)
      if (found) return found
    }
  }
  return null
}
function cancelAddRoot() {
  showAddRootInput.value = false
  newRootCategoryName.value = ''
}

onMounted(() => {
  fetchCategories()
  fetchTags()
})
</script>
