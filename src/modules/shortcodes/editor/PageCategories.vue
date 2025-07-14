<template>
  <div class="page-categories p-4">
    <h1 class="mb-4">Управление категориями</h1>

    <div class="card mb-4">
      <div class="card-header">
        <h5 class="mb-0">{{ isEditing ? 'Редактировать категорию' : 'Новая категория' }}</h5>
      </div>
      <div class="card-body">
        <form @submit.prevent="saveCategory">
          <div class="row g-3 align-items-end">
            <div class="col-md-6">
              <label class="form-label">Название</label>
              <input
                v-model="form.name"
                type="text"
                class="form-control"
                placeholder="Название"
                required
              />
            </div>
            <div class="col-md-2 d-grid">
              <button type="submit" class="btn btn-primary">
                {{ isEditing ? 'Сохранить' : 'Добавить' }}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>

    <!-- Таблица категорий -->
    <div class="table-responsive">
      <table class="table table-striped align-middle">
        <thead>
          <tr>
            <th>ID</th>
            <th>Название</th>
            <th class="text-end">Действия</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="cat in sortedCategories" :key="cat.id">
            <td>{{ cat.id }}</td>
            <td>{{ cat.name }}</td>
            <td class="text-end">
              <button
                @click="openEditForm(cat)"
                class="btn btn-sm btn-outline-secondary me-2"
                title="Редактировать"
              >
                <Icons.Pencil size="16" />
              </button>
              <button
                @click="deleteCategory(cat.id)"
                class="btn btn-sm btn-outline-danger"
                title="Удалить"
              >
                <Icons.Trash2 size="16" />
              </button>
            </td>
          </tr>
          <tr v-if="!categories.length">
            <td colspan="3" class="text-center text-muted">Нет ни одной категории</td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue'
import * as Icons from 'lucide-vue-next'
import { categoryService } from '@/modules/cms/js/shortcodeCategoryService'

const categories = ref([])
const form = ref({ id: null, name: '' })
const isEditing = ref(false)

const sortedCategories = computed(() => [...categories.value].sort((a, b) => a.id - b.id))

async function loadCategories() {
  const res = await categoryService.getCategories()
  if (res.success) {
    categories.value = res.data
  } else {
    alert('Ошибка загрузки: ' + JSON.stringify(res.errors))
  }
}

function resetForm() {
  form.value = { id: null, name: '' }
  isEditing.value = false
}

function openEditForm(cat) {
  form.value = { id: cat.id, name: cat.name }
  isEditing.value = true
}

async function saveCategory() {
  try {
    const payload = { name: form.value.name }
    let res = isEditing.value
      ? await categoryService.updateCategory(form.value.id, payload)
      : await categoryService.createCategory(payload)
    if (res.success) {
      await loadCategories()
      resetForm()
    } else {
      alert('Ошибка сохранения: ' + JSON.stringify(res.errors))
    }
  } catch (e) {
    console.error(e)
    alert('Ошибка запроса')
  }
}

async function deleteCategory(id) {
  if (!confirm('Удалить эту категорию?')) return
  const res = await categoryService.deleteCategory(id)
  if (res.success) {
    await loadCategories()
  } else {
    alert('Ошибка удаления: ' + JSON.stringify(res.errors))
  }
}

onMounted(loadCategories)
</script>

<style scoped>
.page-categories {
  background-color: #f8f9fa;
}

.card {
  border: none;
}

.table thead {
  background-color: #e9edf2;
}

.table-striped > tbody > tr:nth-of-type(odd) {
  background-color: #fff;
}

.btn-outline-secondary:hover,
.btn-outline-danger:hover {
  opacity: 0.8;
}
</style>
