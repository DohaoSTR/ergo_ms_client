<template>
  <div class="container-fluid px-4 py-3">
    <RoleGuard :allowedRoles="['admin', 'teacher']">
      <!-- Заголовок -->
      <div class="d-flex align-items-center justify-content-between mb-4">
        <div>
          <h1 class="h3 mb-2 text-gray-800">Управление категориями и форматами</h1>
          <p class="text-muted">Создание и управление категориями курсов и форматами обучения</p>
        </div>
      </div>

      <!-- Вкладки -->
      <ul class="nav nav-tabs mb-4" id="managementTabs" role="tablist">
        <li class="nav-item" role="presentation">
          <button 
            class="nav-link active" 
            id="categories-tab" 
            data-bs-toggle="tab" 
            data-bs-target="#categories" 
            type="button" 
            role="tab"
            :class="{ active: activeTab === 'categories' }"
            @click="activeTab = 'categories'"
          >
            <FolderPlus :size="18" class="me-2" />
            Категории курсов
          </button>
        </li>
        <li class="nav-item" role="presentation">
          <button 
            class="nav-link" 
            id="formats-tab" 
            data-bs-toggle="tab" 
            data-bs-target="#formats" 
            type="button" 
            role="tab"
            :class="{ active: activeTab === 'formats' }"
            @click="activeTab = 'formats'"
          >
            <Tag :size="18" class="me-2" />
            Форматы курсов
          </button>
        </li>
      </ul>

      <!-- Содержимое вкладок -->
      <div class="tab-content" id="managementTabsContent">
        <!-- Вкладка категорий -->
        <div 
          class="tab-pane fade" 
          :class="{ 'show active': activeTab === 'categories' }"
          id="categories" 
          role="tabpanel"
        >
          <div class="row">
            <div class="col-12">
              <!-- Панель управления категориями -->
              <div class="card">
                <div class="card-header d-flex justify-content-between align-items-center">
                  <h5 class="mb-0">
                    <FolderPlus :size="20" class="me-2" />
                    Категории курсов
                  </h5>
                  <button 
                    type="button" 
                    class="btn btn-primary"
                    @click="openCreateCategoryModal"
                  >
                    <Plus :size="18" class="me-2" />
                    Создать категорию
                  </button>
                </div>
                <div class="card-body">
                  <div v-if="loading" class="text-center py-4">
                    <div class="spinner-border" role="status">
                      <span class="visually-hidden">Загрузка...</span>
                    </div>
                  </div>
                  
                  <div v-else-if="categories.length === 0" class="text-center py-4 text-muted">
                    <FolderPlus :size="48" class="mb-3 opacity-50" />
                    <p>Пока нет созданных категорий</p>
                  </div>
                  
                  <div v-else class="table-responsive">
                    <table class="table table-hover">
                      <thead class="table-light">
                        <tr>
                          <th>Название</th>
                          <th>Описание</th>
                          <th>Родительская</th>
                          <th>Курсов</th>
                          <th>Статус</th>
                          <th>Действия</th>
                        </tr>
                      </thead>
                      <tbody>
                        <tr v-for="category in categories" :key="category.id">
                          <td>
                            <strong>{{ category.name }}</strong>
                          </td>
                          <td>
                            <span class="text-muted">{{ category.description || 'Нет описания' }}</span>
                          </td>
                          <td>
                            <span v-if="category.parent" class="badge bg-light text-dark">
                              {{ getParentCategoryName(category.parent) }}
                            </span>
                            <span v-else class="text-muted">—</span>
                          </td>
                          <td>
                            <span class="badge bg-info">{{ category.courses_count || 0 }}</span>
                          </td>
                          <td>
                            <span 
                              class="badge" 
                              :class="category.is_visible ? 'bg-success' : 'bg-secondary'"
                            >
                              {{ category.is_visible ? 'Видимая' : 'Скрытая' }}
                            </span>
                          </td>
                          <td>
                            <div class="btn-group">
                              <button 
                                class="btn btn-sm btn-outline-primary"
                                @click="editCategory(category)"
                                title="Редактировать"
                              >
                                <Edit :size="14" />
                              </button>
                              <button 
                                class="btn btn-sm btn-outline-danger"
                                @click="deleteCategory(category)"
                                :disabled="category.courses_count > 0"
                                title="Удалить"
                              >
                                <Trash2 :size="14" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Вкладка форматов -->
        <div 
          class="tab-pane fade" 
          :class="{ 'show active': activeTab === 'formats' }"
          id="formats" 
          role="tabpanel"
        >
          <div class="row">
            <div class="col-12">
              <!-- Панель управления форматами -->
              <div class="card">
                <div class="card-header d-flex justify-content-between align-items-center">
                  <h5 class="mb-0">
                    <Tag :size="20" class="me-2" />
                    Форматы курсов
                  </h5>
                  <button 
                    type="button" 
                    class="btn btn-primary"
                    @click="openCreateFormatModal"
                  >
                    <Plus :size="18" class="me-2" />
                    Создать формат
                  </button>
                </div>
                <div class="card-body">
                  <div v-if="loading" class="text-center py-4">
                    <div class="spinner-border" role="status">
                      <span class="visually-hidden">Загрузка...</span>
                    </div>
                  </div>
                  
                  <div v-else-if="courseFormats.length === 0" class="text-center py-4 text-muted">
                    <Tag :size="48" class="mb-3 opacity-50" />
                    <p>Пока нет созданных форматов</p>
                  </div>
                  
                  <div v-else class="table-responsive">
                    <table class="table table-hover">
                      <thead class="table-light">
                        <tr>
                          <th>Название</th>
                          <th>Описание</th>
                          <th>Курсов</th>
                          <th>Статус</th>
                          <th>Действия</th>
                        </tr>
                      </thead>
                      <tbody>
                        <tr v-for="format in courseFormats" :key="format.id">
                          <td>
                            <strong>{{ format.name }}</strong>
                          </td>
                          <td>
                            <span class="text-muted">{{ format.description || 'Нет описания' }}</span>
                          </td>
                          <td>
                            <span class="badge bg-info">{{ format.courses_count || 0 }}</span>
                          </td>
                          <td>
                            <span 
                              class="badge" 
                              :class="format.is_active ? 'bg-success' : 'bg-secondary'"
                            >
                              {{ format.is_active ? 'Активный' : 'Неактивный' }}
                            </span>
                          </td>
                          <td>
                            <div class="btn-group">
                              <button 
                                class="btn btn-sm btn-outline-primary"
                                @click="editFormat(format)"
                                title="Редактировать"
                              >
                                <Edit :size="14" />
                              </button>
                              <button 
                                class="btn btn-sm btn-outline-danger"
                                @click="deleteFormat(format)"
                                :disabled="format.courses_count > 0"
                                title="Удалить"
                              >
                                <Trash2 :size="14" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </RoleGuard>

    <!-- Модальные окна создания/редактирования категорий -->
    <div class="modal fade" :class="{ 'show d-block': showCreateCategoryModal }" tabindex="-1" v-if="showCreateCategoryModal">
      <div class="modal-dialog">
        <div class="modal-content">
          <div class="modal-header">
            <h5 class="modal-title d-flex align-items-center gap-2">
              <FolderPlus :size="20" class="text-primary" />
              Создать категорию
            </h5>
            <button type="button" class="btn-close" @click="closeCreateCategoryModal"></button>
          </div>
          <div class="modal-body">
            <form @submit.prevent="createCategory">
              <div class="mb-3">
                <label class="form-label">Название категории *</label>
                <input 
                  v-model="categoryForm.name" 
                  type="text" 
                  class="form-control" 
                  :class="{ 'is-invalid': categoryValidationErrors.name }"
                  required
                  placeholder="Введите название категории"
                />
                <div v-if="categoryValidationErrors.name" class="invalid-feedback">
                  {{ categoryValidationErrors.name }}
                </div>
              </div>
              
              <div class="mb-3">
                <label class="form-label">Описание</label>
                <textarea 
                  v-model="categoryForm.description" 
                  class="form-control" 
                  :class="{ 'is-invalid': categoryValidationErrors.description }"
                  rows="3"
                  placeholder="Описание категории"
                ></textarea>
                <div v-if="categoryValidationErrors.description" class="invalid-feedback">
                  {{ categoryValidationErrors.description }}
                </div>
              </div>
              
              <div class="mb-3">
                <label class="form-label">Родительская категория</label>
                <select v-model="categoryForm.parent" class="form-select">
                  <option :value="null">Без родительской категории</option>
                  <option v-for="category in categories" :key="category.id" :value="category.id">
                    {{ category.parent ? '↳ ' : '' }}{{ category.name }}
                  </option>
                </select>
                <div class="form-text">
                  Выберите родительскую категорию для создания подкатегории.
                </div>
              </div>
              
              <div class="mb-3">
                <label class="form-label">Порядок сортировки</label>
                <input 
                  v-model="categoryForm.sort_order" 
                  type="number" 
                  class="form-control"
                  :class="{ 'is-invalid': categoryValidationErrors.sort_order }"
                  placeholder="0"
                />
                <div v-if="categoryValidationErrors.sort_order" class="invalid-feedback">
                  {{ categoryValidationErrors.sort_order }}
                </div>
                <div v-else class="form-text">Чем меньше число, тем выше в списке</div>
              </div>
              
              <div class="mb-3">
                <div class="form-check">
                  <input 
                    v-model="categoryForm.is_visible" 
                    class="form-check-input" 
                    type="checkbox" 
                    id="categoryVisible"
                  />
                  <label class="form-check-label" for="categoryVisible">
                    Видимая категория
                  </label>
                </div>
              </div>
            </form>
          </div>
          <div class="modal-footer">
            <button 
              type="button" 
              class="btn btn-secondary" 
              @click="closeCreateCategoryModal"
              :disabled="isCategorySubmitting"
            >
              Отмена
            </button>
            <button 
              type="button" 
              class="btn btn-primary" 
              @click="createCategory"
              :disabled="isCategorySubmitting"
            >
              <span v-if="isCategorySubmitting" class="spinner-border spinner-border-sm me-2" role="status"></span>
              {{ isCategorySubmitting ? 'Создание...' : 'Создать категорию' }}
            </button>
          </div>
        </div>
      </div>
    </div>
    <div v-if="showCreateCategoryModal" class="modal-backdrop fade show"></div>

    <!-- Аналогично для форматов -->
    <div class="modal fade" :class="{ 'show d-block': showCreateFormatModal }" tabindex="-1" v-if="showCreateFormatModal">
      <div class="modal-dialog">
        <div class="modal-content">
          <div class="modal-header">
            <h5 class="modal-title d-flex align-items-center gap-2">
              <Tag :size="20" class="text-primary" />
              Создать формат курса
            </h5>
            <button type="button" class="btn-close" @click="closeCreateFormatModal"></button>
          </div>
          <div class="modal-body">
            <form @submit.prevent="createFormat">
              <div class="mb-3">
                <label class="form-label">Название формата *</label>
                <input 
                  v-model="formatForm.name" 
                  type="text" 
                  class="form-control" 
                  :class="{ 'is-invalid': formatValidationErrors.name }"
                  required
                  placeholder="Введите название формата"
                />
                <div v-if="formatValidationErrors.name" class="invalid-feedback">
                  {{ formatValidationErrors.name }}
                </div>
              </div>
              
              <div class="mb-3">
                <label class="form-label">Описание</label>
                <textarea 
                  v-model="formatForm.description" 
                  class="form-control" 
                  :class="{ 'is-invalid': formatValidationErrors.description }"
                  rows="3"
                  placeholder="Описание формата курса"
                ></textarea>
                <div v-if="formatValidationErrors.description" class="invalid-feedback">
                  {{ formatValidationErrors.description }}
                </div>
              </div>
              
              <div class="mb-3">
                <div class="form-check">
                  <input 
                    v-model="formatForm.is_active" 
                    class="form-check-input" 
                    type="checkbox" 
                    id="formatActive"
                  />
                  <label class="form-check-label" for="formatActive">
                    Активный формат
                  </label>
                </div>
              </div>
            </form>
          </div>
          <div class="modal-footer">
            <button 
              type="button" 
              class="btn btn-secondary" 
              @click="closeCreateFormatModal"
              :disabled="isFormatSubmitting"
            >
              Отмена
            </button>
            <button 
              type="button" 
              class="btn btn-primary" 
              @click="createFormat"
              :disabled="isFormatSubmitting"
            >
              <span v-if="isFormatSubmitting" class="spinner-border spinner-border-sm me-2" role="status"></span>
              {{ isFormatSubmitting ? 'Создание...' : 'Создать формат' }}
            </button>
          </div>
        </div>
      </div>
    </div>
    <div v-if="showCreateFormatModal" class="modal-backdrop fade show"></div>
  </div>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue'
import { FolderPlus, Tag, Plus, Edit, Trash2 } from 'lucide-vue-next'
import { apiClient } from '@/js/api/manager'
import { endpoints } from '@/js/api/endpoints'
import RoleGuard from '../components/RoleGuard.vue'
import { 
  showSuccess, 
  showError, 
  showWarning,
  handleApiError,
  showDeleteSuccess
} from '@/js/utils/notifications'

// Состояние
const activeTab = ref('categories')
const loading = ref(true)
const categories = ref([])
const courseFormats = ref([])

// Модальные окна
const showCreateCategoryModal = ref(false)
const showCreateFormatModal = ref(false)

// Формы
const categoryForm = ref({
  name: '',
  description: '',
  parent: null,
  sort_order: 0,
  is_visible: true
})

const formatForm = ref({
  name: '',
  description: '',
  is_active: true
})

// Валидация
const categoryValidationErrors = ref({})
const formatValidationErrors = ref({})
const isCategorySubmitting = ref(false)
const isFormatSubmitting = ref(false)

// Функции загрузки данных
async function fetchCategories() {
  try {
    const response = await apiClient.get(endpoints.lms.categories)
    categories.value = response.data.results || response.data || []
  } catch (error) {
    console.error('Ошибка загрузки категорий:', error)
    handleApiError(error, 'Ошибка при загрузке категорий')
  }
}

async function fetchCourseFormats() {
  try {
    const response = await apiClient.get(endpoints.lms.courseFormats)
    courseFormats.value = response.data.results || response.data || []
  } catch (error) {
    console.error('Ошибка загрузки форматов:', error)
    handleApiError(error, 'Ошибка при загрузке форматов курсов')
  }
}

async function fetchData() {
  loading.value = true
  try {
    await Promise.all([fetchCategories(), fetchCourseFormats()])
  } finally {
    loading.value = false
  }
}

// Управление категориями
function openCreateCategoryModal() {
  resetCategoryForm()
  showCreateCategoryModal.value = true
}

function closeCreateCategoryModal() {
  showCreateCategoryModal.value = false
  resetCategoryForm()
}

function resetCategoryForm() {
  categoryForm.value = {
    name: '',
    description: '',
    parent: null,
    sort_order: 0,
    is_visible: true
  }
  categoryValidationErrors.value = {}
}

async function createCategory() {
  try {
    isCategorySubmitting.value = true
    categoryValidationErrors.value = {}

    if (!categoryForm.value.name.trim()) {
      categoryValidationErrors.value.name = 'Название категории обязательно'
      return
    }

    const data = {
      name: categoryForm.value.name.trim(),
      description: categoryForm.value.description.trim(),
      parent: categoryForm.value.parent,
      sort_order: categoryForm.value.sort_order || 0,
      is_visible: categoryForm.value.is_visible
    }

    await apiClient.post(endpoints.lms.categories, data)
    showSuccess('Категория успешно создана')
    await fetchCategories()
    closeCreateCategoryModal()

  } catch (error) {
    console.error('Ошибка создания категории:', error)
    if (error.response?.data) {
      const errorData = error.response.data
      if (typeof errorData === 'object') {
        Object.keys(errorData).forEach(field => {
          if (Array.isArray(errorData[field])) {
            categoryValidationErrors.value[field] = errorData[field][0]
          } else {
            categoryValidationErrors.value[field] = errorData[field]
          }
        })
      }
    } else {
      handleApiError(error, 'Ошибка при создании категории')
    }
  } finally {
    isCategorySubmitting.value = false
  }
}

function editCategory(category) {
  // TODO: Реализовать редактирование
  showWarning('Функция редактирования будет добавлена позже')
}

async function deleteCategory(category) {
  if (category.courses_count > 0) {
    showError('Нельзя удалить категорию, в которой есть курсы')
    return
  }

  if (!confirm(`Вы уверены, что хотите удалить категорию "${category.name}"?`)) {
    return
  }

  try {
    await apiClient.delete(`${endpoints.lms.categories}${category.id}/`)
    showDeleteSuccess('Категория')
    await fetchCategories()
  } catch (error) {
    console.error('Ошибка удаления категории:', error)
    handleApiError(error, 'Ошибка при удалении категории')
  }
}

// Управление форматами
function openCreateFormatModal() {
  resetFormatForm()
  showCreateFormatModal.value = true
}

function closeCreateFormatModal() {
  showCreateFormatModal.value = false
  resetFormatForm()
}

function resetFormatForm() {
  formatForm.value = {
    name: '',
    description: '',
    is_active: true
  }
  formatValidationErrors.value = {}
}

async function createFormat() {
  try {
    isFormatSubmitting.value = true
    formatValidationErrors.value = {}

    if (!formatForm.value.name.trim()) {
      formatValidationErrors.value.name = 'Название формата обязательно'
      return
    }

    const data = {
      name: formatForm.value.name.trim(),
      description: formatForm.value.description.trim(),
      is_active: formatForm.value.is_active
    }

    await apiClient.post(endpoints.lms.courseFormats, data)
    showSuccess('Формат курса успешно создан')
    await fetchCourseFormats()
    closeCreateFormatModal()

  } catch (error) {
    console.error('Ошибка создания формата:', error)
    if (error.response?.data) {
      const errorData = error.response.data
      if (typeof errorData === 'object') {
        Object.keys(errorData).forEach(field => {
          if (Array.isArray(errorData[field])) {
            formatValidationErrors.value[field] = errorData[field][0]
          } else {
            formatValidationErrors.value[field] = errorData[field]
          }
        })
      }
    } else {
      handleApiError(error, 'Ошибка при создании формата')
    }
  } finally {
    isFormatSubmitting.value = false
  }
}

function editFormat(format) {
  // TODO: Реализовать редактирование
  showWarning('Функция редактирования будет добавлена позже')
}

async function deleteFormat(format) {
  if (format.courses_count > 0) {
    showError('Нельзя удалить формат, который используется в курсах')
    return
  }

  if (!confirm(`Вы уверены, что хотите удалить формат "${format.name}"?`)) {
    return
  }

  try {
    await apiClient.delete(`${endpoints.lms.courseFormats}${format.id}/`)
    showDeleteSuccess('Формат')
    await fetchCourseFormats()
  } catch (error) {
    console.error('Ошибка удаления формата:', error)
    handleApiError(error, 'Ошибка при удалении формата')
  }
}

// Вспомогательные функции
function getParentCategoryName(parentId) {
  const parent = categories.value.find(c => c.id === parentId)
  return parent ? parent.name : 'Неизвестная'
}

// Инициализация
onMounted(() => {
  fetchData()
})
</script>

<style scoped>
.nav-tabs .nav-link {
  border: none;
  border-bottom: 3px solid transparent;
}

.nav-tabs .nav-link.active {
  border-bottom-color: var(--bs-primary);
  background: none;
}

.table th {
  border-top: none;
  font-weight: 600;
}

.badge {
  font-size: 0.75rem;
}
</style> 