<template>
  <div class="container-fluid px-4 py-3">
    <RoleGuard :allowedRoles="['admin', 'teacher']">
      <!-- Заголовок -->
      <div class="d-flex align-items-center justify-content-between mb-4">
        <div>
          <h1 class="h3 mb-2 text-gray-800">Управление структурой курсов</h1>
          <p class="text-muted">Управление категориями курсов и форматами обучения</p>
        </div>
      </div>

      <!-- Вкладки -->
      <ul class="nav nav-tabs mb-4">
        <li class="nav-item">
          <button 
            class="nav-link" 
            :class="{ active: activeTab === 'categories' }"
            @click="activeTab = 'categories'"
          >
            <FolderPlus :size="18" class="me-2" />
            Категории курсов
          </button>
        </li>
        <li class="nav-item">
          <button 
            class="nav-link" 
            :class="{ active: activeTab === 'formats' }"
            @click="activeTab = 'formats'"
          >
            <Tag :size="18" class="me-2" />
            Форматы курсов
          </button>
        </li>
      </ul>

      <!-- Содержимое вкладок -->
      <div class="tab-content">
        <!-- Вкладка категорий -->
        <div 
          class="tab-pane fade" 
          :class="{ 'show active': activeTab === 'categories' }"
        >
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
              <!-- Поиск и фильтры для категорий -->
              <div class="row mb-4">
                <div class="col-md-4">
                  <div class="input-group">
                    <span class="input-group-text">
                      <Search :size="16" />
                    </span>
                    <input
                      v-model="categorySearchQuery"
                      type="text"
                      class="form-control"
                      placeholder="Поиск категории..."
                    />
                  </div>
                </div>
                <div class="col-md-4">
                  <select v-model="categoryVisibilityFilter" class="form-select">
                    <option value="">Все категории</option>
                    <option value="visible">Только видимые</option>
                    <option value="hidden">Только скрытые</option>
                  </select>
                </div>
                <div class="col-md-4">
                  <select v-model="categorySortBy" class="form-select">
                    <option value="name">Сортировать по названию</option>
                    <option value="sort_order">Сортировать по порядку</option>
                    <option value="courses_count">Сортировать по кол-ву курсов</option>
                  </select>
                </div>
              </div>

              <div v-if="loading" class="text-center py-4">
                <div class="spinner-border" role="status">
                  <span class="visually-hidden">Загрузка...</span>
                </div>
              </div>
              
              <div v-else-if="filteredCategories.length === 0" class="text-center py-4 text-muted">
                <FolderPlus :size="48" class="mb-3 opacity-50" />
                <p v-if="categorySearchQuery || categoryVisibilityFilter">Категории не найдены по заданным критериям</p>
                <p v-else>Пока нет созданных категорий</p>
              </div>
              
              <!-- Древовидное отображение категорий -->
              <div v-else class="category-tree">
                <CategoryTreeItem
                  v-for="category in categoryTree"
                  :key="category.id"
                  :category="category"
                  :categories="categories"
                  :filteredCategories="filteredCategories"
                  :searchQuery="categorySearchQuery"
                  @edit="editCategory"
                  @delete="deleteCategory"
                />
              </div>
            </div>
          </div>
        </div>

        <!-- Вкладка форматов -->
        <div 
          class="tab-pane fade" 
          :class="{ 'show active': activeTab === 'formats' }"
        >
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
              <!-- Поиск и фильтры для форматов -->
              <div class="row mb-4">
                <div class="col-md-4">
                  <div class="input-group">
                    <span class="input-group-text">
                      <Search :size="16" />
                    </span>
                    <input
                      v-model="formatSearchQuery"
                      type="text"
                      class="form-control"
                      placeholder="Поиск формата..."
                    />
                  </div>
                </div>
                <div class="col-md-4">
                  <select v-model="formatActiveFilter" class="form-select">
                    <option value="">Все форматы</option>
                    <option value="active">Только активные</option>
                    <option value="inactive">Только неактивные</option>
                  </select>
                </div>
                <div class="col-md-4">
                  <select v-model="formatSortBy" class="form-select">
                    <option value="name">Сортировать по названию</option>
                    <option value="courses_count">Сортировать по кол-ву курсов</option>
                  </select>
                </div>
              </div>

              <div v-if="loading" class="text-center py-4">
                <div class="spinner-border" role="status">
                  <span class="visually-hidden">Загрузка...</span>
                </div>
              </div>
              
              <div v-else-if="filteredFormats.length === 0" class="text-center py-4 text-muted">
                <Tag :size="48" class="mb-3 opacity-50" />
                <p v-if="formatSearchQuery || formatActiveFilter">Форматы не найдены по заданным критериям</p>
                <p v-else>Пока нет созданных форматов</p>
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
                    <tr v-for="format in filteredFormats" :key="format.id">
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
    </RoleGuard>

    <!-- Модальные окна -->
    <div class="modal fade" :class="{ 'show d-block': showCreateCategoryModal }" tabindex="-1" v-if="showCreateCategoryModal">
      <div class="modal-dialog">
        <div class="modal-content">
          <div class="modal-header">
            <h5 class="modal-title">Создать категорию</h5>
            <button type="button" class="btn-close" @click="closeCreateCategoryModal"></button>
          </div>
          <div class="modal-body">
            <div class="mb-3">
              <label class="form-label">Название категории *</label>
                              <input 
                  v-model="categoryForm.name" 
                  type="text" 
                  class="form-control" 
                  :class="{ 'is-invalid': categoryValidationErrors.name }"
                  required
                  placeholder="Введите название категории"
                  @blur="validateCategoryField('name', categoryForm.name)"
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
                  @blur="validateCategoryField('description', categoryForm.description)"
                ></textarea>
                <div v-if="categoryValidationErrors.description" class="invalid-feedback">
                  {{ categoryValidationErrors.description }}
                </div>
            </div>
            
            <div class="mb-3">
              <label class="form-label">Родительская категория</label>
              <select v-model="categoryForm.parent" class="form-select">
                <option :value="null">Без родительской категории</option>
                <option 
                  v-for="category in categories" 
                  :key="category.id" 
                  :value="category.id"
                >
                  {{ category.parent ? '↳ ' : '' }}{{ category.name }}
                </option>
              </select>
            </div>
            
            <div class="mb-3">
              <label class="form-label">Порядок сортировки</label>
              <input 
                v-model="categoryForm.sort_order" 
                type="number" 
                class="form-control"
                placeholder="0"
              />
              <div class="form-text">Чем меньше число, тем выше в списке</div>
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

    <!-- Модальное окно создания формата -->
    <div class="modal fade" :class="{ 'show d-block': showCreateFormatModal }" tabindex="-1" v-if="showCreateFormatModal">
      <div class="modal-dialog">
        <div class="modal-content">
          <div class="modal-header">
            <h5 class="modal-title">Создать формат курса</h5>
            <button type="button" class="btn-close" @click="closeCreateFormatModal"></button>
          </div>
          <div class="modal-body">
            <div class="mb-3">
              <label class="form-label">Название формата *</label>
                              <input 
                  v-model="formatForm.name" 
                  type="text" 
                  class="form-control" 
                  :class="{ 'is-invalid': formatValidationErrors.name }"
                  required
                  placeholder="Введите название формата"
                  @blur="validateFormatField('name', formatForm.name)"
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
                  @blur="validateFormatField('description', formatForm.description)"
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

    <!-- Модальное окно редактирования категории -->
    <div class="modal fade" :class="{ 'show d-block': showEditCategoryModal }" tabindex="-1" v-if="showEditCategoryModal">
      <div class="modal-dialog">
        <div class="modal-content">
          <div class="modal-header">
            <h5 class="modal-title d-flex align-items-center gap-2">
              <Edit :size="20" class="text-primary" />
              Редактировать категорию
            </h5>
            <button type="button" class="btn-close" @click="closeEditCategoryModal"></button>
          </div>
          <div class="modal-body">
            <form @submit.prevent="updateCategory">
              <div class="mb-3">
                <label class="form-label">Название категории *</label>
                <input 
                  v-model="categoryForm.name" 
                  type="text" 
                  class="form-control" 
                  :class="{ 'is-invalid': categoryValidationErrors.name }"
                  required
                  placeholder="Введите название категории"
                  @blur="validateCategoryField('name', categoryForm.name)"
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
                  @blur="validateCategoryField('description', categoryForm.description)"
                ></textarea>
                <div v-if="categoryValidationErrors.description" class="invalid-feedback">
                  {{ categoryValidationErrors.description }}
                </div>
              </div>
              
              <div class="mb-3">
                <label class="form-label">Родительская категория</label>
                <select v-model="categoryForm.parent" class="form-select">
                  <option :value="null">Без родительской категории</option>
                  <option 
                    v-for="category in categories.filter(c => c.id !== editingCategory?.id)" 
                    :key="category.id" 
                    :value="category.id"
                  >
                    {{ category.parent ? '↳ ' : '' }}{{ category.name }}
                  </option>
                </select>
              </div>
              
              <div class="mb-3">
                <label class="form-label">Порядок сортировки</label>
                <input 
                  v-model="categoryForm.sort_order" 
                  type="number" 
                  class="form-control"
                  placeholder="0"
                />
                <div class="form-text">Чем меньше число, тем выше в списке</div>
              </div>
              
              <div class="mb-3">
                <div class="form-check">
                  <input 
                    v-model="categoryForm.is_visible" 
                    class="form-check-input" 
                    type="checkbox" 
                    id="editCategoryVisible"
                  />
                  <label class="form-check-label" for="editCategoryVisible">
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
              @click="closeEditCategoryModal"
              :disabled="isCategorySubmitting"
            >
              Отмена
            </button>
            <button 
              type="button" 
              class="btn btn-primary" 
              @click="updateCategory"
              :disabled="isCategorySubmitting"
            >
              <span v-if="isCategorySubmitting" class="spinner-border spinner-border-sm me-2" role="status"></span>
              {{ isCategorySubmitting ? 'Сохранение...' : 'Сохранить изменения' }}
            </button>
          </div>
        </div>
      </div>
    </div>
    <div v-if="showEditCategoryModal" class="modal-backdrop fade show"></div>

    <!-- Модальное окно редактирования формата -->
    <div class="modal fade" :class="{ 'show d-block': showEditFormatModal }" tabindex="-1" v-if="showEditFormatModal">
      <div class="modal-dialog">
        <div class="modal-content">
          <div class="modal-header">
            <h5 class="modal-title d-flex align-items-center gap-2">
              <Edit :size="20" class="text-primary" />
              Редактировать формат курса
            </h5>
            <button type="button" class="btn-close" @click="closeEditFormatModal"></button>
          </div>
          <div class="modal-body">
            <form @submit.prevent="updateFormat">
              <div class="mb-3">
                <label class="form-label">Название формата *</label>
                <input 
                  v-model="formatForm.name" 
                  type="text" 
                  class="form-control" 
                  :class="{ 'is-invalid': formatValidationErrors.name }"
                  required
                  placeholder="Введите название формата"
                  @blur="validateFormatField('name', formatForm.name)"
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
                  @blur="validateFormatField('description', formatForm.description)"
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
                    id="editFormatActive"
                  />
                  <label class="form-check-label" for="editFormatActive">
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
              @click="closeEditFormatModal"
              :disabled="isFormatSubmitting"
            >
              Отмена
            </button>
            <button 
              type="button" 
              class="btn btn-primary" 
              @click="updateFormat"
              :disabled="isFormatSubmitting"
            >
              <span v-if="isFormatSubmitting" class="spinner-border spinner-border-sm me-2" role="status"></span>
              {{ isFormatSubmitting ? 'Сохранение...' : 'Сохранить изменения' }}
            </button>
          </div>
        </div>
      </div>
    </div>
    <div v-if="showEditFormatModal" class="modal-backdrop fade show"></div>

    <!-- Модальное окно подтверждения удаления -->
    <div class="modal fade" :class="{ 'show d-block': showDeleteConfirmModal }" tabindex="-1" v-if="showDeleteConfirmModal">
      <div class="modal-dialog modal-dialog-centered">
        <div class="modal-content">
          <div class="modal-header">
            <h5 class="modal-title">
              <AlertTriangle :size="20" class="text-danger me-2" />
              Подтверждение удаления
            </h5>
            <button type="button" class="btn-close" @click="closeDeleteConfirmModal"></button>
          </div>
          <div class="modal-body">
            <p v-if="itemToDelete?.type === 'category'">
              Вы действительно хотите удалить категорию <strong>"{{ itemToDelete?.item?.name }}"</strong>?
              <span v-if="hasChildCategories" class="text-danger">
                <br><br>
                <AlertTriangle :size="16" class="me-1" />
                Внимание! У этой категории есть подкатегории, которые также будут удалены.
              </span>
              <span v-if="itemToDelete?.item?.courses_count > 0" class="text-danger">
                <br><br>
                <AlertTriangle :size="16" class="me-1" />
                В данной категории есть {{ itemToDelete.item.courses_count }} курс(ов).
              </span>
            </p>
            <p v-else>
              Вы действительно хотите удалить формат <strong>"{{ itemToDelete?.item?.name }}"</strong>?
              <span v-if="itemToDelete?.item?.courses_count > 0" class="text-danger">
                <br><br>
                <AlertTriangle :size="16" class="me-1" />
                Данный формат используется в {{ itemToDelete.item.courses_count }} курсе(ах).
              </span>
            </p>
          </div>
          <div class="modal-footer">
            <button type="button" class="btn btn-secondary" @click="closeDeleteConfirmModal">
              Отмена
            </button>
            <button 
              type="button" 
              class="btn btn-danger"
              :disabled="isDeleting"
              @click="confirmDelete"
            >
              <span v-if="isDeleting" class="spinner-border spinner-border-sm me-2" role="status"></span>
              Удалить
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- Затемнение фона при открытых модальных окнах -->
    <div 
      class="modal-backdrop fade show" 
      v-if="showCreateCategoryModal || showEditCategoryModal || showCreateFormatModal || showEditFormatModal || showDeleteConfirmModal"
    ></div>
  </div>
</template>

<script setup>
import { ref, onMounted, watch, computed } from 'vue'
import { FolderPlus, Tag, Plus, Edit, Trash2, Search, AlertTriangle } from 'lucide-vue-next'
import { apiClient } from '@/js/api/manager'
import { endpoints } from '@/js/api/endpoints'
import RoleGuard from '../components/RoleGuard.vue'
import CategoryTreeItem from './CategoryTreeItem.vue'
import { 
  showSuccess, 
  showError, 
  showWarning,
  handleApiError,
  showValidationError,
  showSaveSuccess,
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
const showEditCategoryModal = ref(false)
const showEditFormatModal = ref(false)
const showDeleteConfirmModal = ref(false)

// Состояния редактирования
const editingCategory = ref(null)
const editingFormat = ref(null)

// Диалоги подтверждения
const showConfirmDialog = ref(false)
const confirmDialogData = ref({
  title: '',
  message: '',
  confirmText: 'Удалить',
  onConfirm: null
})
const dialogLoading = ref(false)

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

// Поиск и фильтры
const categorySearchQuery = ref('')
const categoryVisibilityFilter = ref('')
const categorySortBy = ref('name')
const formatSearchQuery = ref('')
const formatActiveFilter = ref('')
const formatSortBy = ref('name')

// Состояние для модального окна подтверждения удаления
const itemToDelete = ref(null)
const isDeleting = ref(false)

// Вычисляемые свойства для фильтрации и сортировки
const filteredCategories = computed(() => {
  let filtered = [...categories.value]

  // Применяем фильтр по видимости
  if (categoryVisibilityFilter.value) {
    const isVisible = categoryVisibilityFilter.value === 'visible'
    filtered = filtered.filter(category => {
      // Если категория соответствует фильтру видимости
      if (category.is_visible === isVisible) {
        return true
      }
      
      // Проверяем родительские категории
      if (category.parent) {
        let parent = categories.value.find(c => c.id === category.parent)
        while (parent) {
          if (parent.is_visible === isVisible) {
            return true
          }
          parent = categories.value.find(c => c.id === parent.parent)
        }
      }
      
      // Проверяем дочерние категории
      const hasVisibleChildren = categories.value.some(c => 
        c.parent === category.id && c.is_visible === isVisible
      )
      return hasVisibleChildren
    })
  }

  // Применяем поиск
  if (categorySearchQuery.value) {
    const query = categorySearchQuery.value.toLowerCase()
    filtered = filtered.filter(category => {
      const matchesSearch = 
        category.name.toLowerCase().includes(query) ||
        (category.description && category.description.toLowerCase().includes(query))
      
      // Включаем родителей найденных категорий
      if (matchesSearch && category.parent) {
        let parent = category
        while (parent.parent) {
          parent = categories.value.find(c => c.id === parent.parent)
          if (parent) filtered.push(parent)
        }
      }
      
      return matchesSearch
    })
    
    // Удаляем дубликаты
    filtered = [...new Set(filtered)]
  }

  // Сортировка
  filtered.sort((a, b) => {
    switch (categorySortBy.value) {
      case 'name':
        return a.name.localeCompare(b.name)
      case 'sort_order':
        return (a.sort_order || 0) - (b.sort_order || 0)
      case 'courses_count':
        return (b.courses_count || 0) - (a.courses_count || 0)
      default:
        return 0
    }
  })

  return filtered
})

// Построение дерева категорий
const categoryTree = computed(() => {
  // Получаем только корневые категории (без родителей) из отфильтрованного списка
  return filteredCategories.value.filter(c => !c.parent || !filteredCategories.value.find(fc => fc.id === c.parent))
})

// Вычисляемые свойства для форматов
const filteredFormats = computed(() => {
  let filtered = courseFormats.value

  // Поиск
  if (formatSearchQuery.value) {
    const query = formatSearchQuery.value.toLowerCase()
    filtered = filtered.filter(format =>
      format.name.toLowerCase().includes(query) ||
      (format.description && format.description.toLowerCase().includes(query))
    )
  }

  // Фильтр по активности
  if (formatActiveFilter.value === 'active') {
    filtered = filtered.filter(format => format.is_active)
  } else if (formatActiveFilter.value === 'inactive') {
    filtered = filtered.filter(format => !format.is_active)
  }

  // Сортировка
  filtered.sort((a, b) => {
    switch (formatSortBy.value) {
      case 'name':
        return a.name.localeCompare(b.name)
      case 'courses_count':
        return (b.courses_count || 0) - (a.courses_count || 0)
      default:
        return 0
    }
  })

  return filtered
})

// Проверка наличия подкатегорий
const hasChildCategories = computed(() => {
  if (itemToDelete.value?.type !== 'category') return false
  return categories.value.some(c => c.parent === itemToDelete.value.item.id)
})

// Валидация в реальном времени
watch(() => categoryForm.value.name, (newName) => {
  if (newName && categoryValidationErrors.value.name) {
    validateCategoryField('name', newName)
  }
})

watch(() => categoryForm.value.description, (newDescription) => {
  if (newDescription && categoryValidationErrors.value.description) {
    validateCategoryField('description', newDescription)
  }
})

watch(() => formatForm.value.name, (newName) => {
  if (newName && formatValidationErrors.value.name) {
    validateFormatField('name', newName)
  }
})

watch(() => formatForm.value.description, (newDescription) => {
  if (newDescription && formatValidationErrors.value.description) {
    validateFormatField('description', newDescription)
  }
})

// Функции валидации
function validateCategoryField(field, value) {
  switch (field) {
    case 'name':
      if (!value || !value.trim()) {
        categoryValidationErrors.value.name = 'Название категории обязательно'
      } else if (value.trim().length < 2) {
        categoryValidationErrors.value.name = 'Название должно содержать минимум 2 символа'
      } else if (value.trim().length > 100) {
        categoryValidationErrors.value.name = 'Название не должно превышать 100 символов'
      } else {
        delete categoryValidationErrors.value.name
      }
      break
    case 'description':
      if (value && value.length > 500) {
        categoryValidationErrors.value.description = 'Описание не должно превышать 500 символов'
      } else {
        delete categoryValidationErrors.value.description
      }
      break
  }
}

function validateFormatField(field, value) {
  switch (field) {
    case 'name':
      if (!value || !value.trim()) {
        formatValidationErrors.value.name = 'Название формата обязательно'
      } else if (value.trim().length < 2) {
        formatValidationErrors.value.name = 'Название должно содержать минимум 2 символа'
      } else if (value.trim().length > 100) {
        formatValidationErrors.value.name = 'Название не должно превышать 100 символов'
      } else {
        delete formatValidationErrors.value.name
      }
      break
    case 'description':
      if (value && value.length > 500) {
        formatValidationErrors.value.description = 'Описание не должно превышать 500 символов'
      } else {
        delete formatValidationErrors.value.description
      }
      break
  }
}

// Функции загрузки данных
async function fetchCategories() {
  try {
    const response = await apiClient.get(endpoints.lms.categories)
    categories.value = response.data.results || response.data || []
    console.log('Загружено категорий:', categories.value.length)
  } catch (error) {
    console.error('Ошибка загрузки категорий:', error)
    handleApiError(error, 'Ошибка при загрузке категорий')
  }
}

async function fetchCourseFormats() {
  try {
    const response = await apiClient.get(endpoints.lms.courseFormats)
    courseFormats.value = response.data.results || response.data || []
    console.log('Загружено форматов:', courseFormats.value.length)
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
  editingCategory.value = null
  showCreateCategoryModal.value = true
}

function closeCreateCategoryModal() {
  showCreateCategoryModal.value = false
  resetCategoryForm()
}

function openEditCategoryModal() {
  showEditCategoryModal.value = true
}

function closeEditCategoryModal() {
  showEditCategoryModal.value = false
  resetCategoryForm()
  editingCategory.value = null
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

// Валидация перед отправкой
function validateCategoryForm() {
  categoryValidationErrors.value = {}
  
  validateCategoryField('name', categoryForm.value.name)
  validateCategoryField('description', categoryForm.value.description)
  
  return Object.keys(categoryValidationErrors.value).length === 0
}

async function createCategory() {
  if (!validateCategoryForm()) {
    return
  }

  try {
    isCategorySubmitting.value = true

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
  editingCategory.value = category
  categoryForm.value = {
    name: category.name,
    description: category.description || '',
    parent: category.parent,
    sort_order: category.sort_order || 0,
    is_visible: category.is_visible
  }
  categoryValidationErrors.value = {}
  openEditCategoryModal()
}

async function updateCategory() {
  if (!validateCategoryForm()) {
    return
  }

  try {
    isCategorySubmitting.value = true

    const data = {
      name: categoryForm.value.name.trim(),
      description: categoryForm.value.description.trim(),
      parent: categoryForm.value.parent,
      sort_order: categoryForm.value.sort_order || 0,
      is_visible: categoryForm.value.is_visible
    }

    await apiClient.put(`${endpoints.lms.categories}${editingCategory.value.id}/`, data)
    showSuccess('Категория успешно обновлена')
    await fetchCategories()
    closeEditCategoryModal()

  } catch (error) {
    console.error('Ошибка обновления категории:', error)
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
      handleApiError(error, 'Ошибка при обновлении категории')
    }
  } finally {
    isCategorySubmitting.value = false
  }
}

function deleteCategory(category) {
  itemToDelete.value = { type: 'category', item: category }
  showDeleteConfirmModal.value = true
}

// Управление форматами
function openCreateFormatModal() {
  resetFormatForm()
  editingFormat.value = null
  showCreateFormatModal.value = true
}

function closeCreateFormatModal() {
  showCreateFormatModal.value = false
  resetFormatForm()
}

function openEditFormatModal() {
  showEditFormatModal.value = true
}

function closeEditFormatModal() {
  showEditFormatModal.value = false
  resetFormatForm()
  editingFormat.value = null
}

function resetFormatForm() {
  formatForm.value = {
    name: '',
    description: '',
    is_active: true
  }
  formatValidationErrors.value = {}
}

// Валидация перед отправкой
function validateFormatForm() {
  formatValidationErrors.value = {}
  
  validateFormatField('name', formatForm.value.name)
  validateFormatField('description', formatForm.value.description)
  
  return Object.keys(formatValidationErrors.value).length === 0
}

async function createFormat() {
  if (!validateFormatForm()) {
    return
  }

  try {
    isFormatSubmitting.value = true

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
  editingFormat.value = format
  formatForm.value = {
    name: format.name,
    description: format.description || '',
    is_active: format.is_active
  }
  formatValidationErrors.value = {}
  openEditFormatModal()
}

async function updateFormat() {
  if (!validateFormatForm()) {
    return
  }

  try {
    isFormatSubmitting.value = true

    const data = {
      name: formatForm.value.name.trim(),
      description: formatForm.value.description.trim(),
      is_active: formatForm.value.is_active
    }

    await apiClient.put(`${endpoints.lms.courseFormats}${editingFormat.value.id}/`, data)
    showSuccess('Формат курса успешно обновлён')
    await fetchCourseFormats()
    closeEditFormatModal()

  } catch (error) {
    console.error('Ошибка обновления формата:', error)
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
      handleApiError(error, 'Ошибка при обновлении формата')
    }
  } finally {
    isFormatSubmitting.value = false
  }
}

function deleteFormat(format) {
  itemToDelete.value = { type: 'format', item: format }
  showDeleteConfirmModal.value = true
}

// Функции для работы с модальным окном удаления
function closeDeleteConfirmModal() {
  showDeleteConfirmModal.value = false
  itemToDelete.value = null
  isDeleting.value = false
}

async function confirmDelete() {
  if (!itemToDelete.value) return

  isDeleting.value = true
  try {
    if (itemToDelete.value.type === 'category') {
      await deleteCategoryRequest(itemToDelete.value.item.id)
      await fetchCategories()
    } else {
      await deleteFormatRequest(itemToDelete.value.item.id)
      await fetchCourseFormats()
    }
    closeDeleteConfirmModal()
  } catch (error) {
    console.error('Error deleting item:', error)
  } finally {
    isDeleting.value = false
  }
}

// Инициализация
onMounted(() => {
  fetchData()
})
</script>

<style scoped>
/* Стили для древовидного отображения */
.category-tree {
  padding: 1rem 0;
}

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

/* Стили для модального окна подтверждения */
.modal-dialog-centered {
  display: flex;
  align-items: center;
  min-height: calc(100% - 1rem);
}

@media (min-width: 576px) {
  .modal-dialog-centered {
    min-height: calc(100% - 3.5rem);
  }
}
</style>
