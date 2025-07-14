<template>
  <div class="lesson-items">
    <div class="d-flex justify-content-between align-items-center mb-3">
      <h6 class="mb-0 d-flex align-items-center gap-2">
        <Layers :size="18" />
        Материалы урока
        <span class="badge bg-primary">{{ items.length }}</span>
      </h6>
    </div>

    <!-- Пустое состояние -->
    <div v-if="items.length === 0" class="text-center py-4 bg-light rounded">
      <Layers :size="32" class="text-muted mb-2" />
      <p class="text-muted mb-2">В уроке нет материалов</p>
      <small class="text-muted">Добавьте тесты, задания или ресурсы</small>
    </div>

    <!-- Список элементов с drag and drop -->
    <draggable 
      v-else
      v-model="sortableItems" 
      group="lesson-items"
      :animation="300"
      @end="handleReorder"
      item-key="id"
      tag="div"
      class="lesson-items-list"
      handle=".item-drag-handle"
      :disabled="false"
      ghost-class="sortable-ghost"
      chosen-class="sortable-chosen"
      drag-class="sortable-drag"
    >
      <template #item="{ element: item }">
        <div class="lesson-item-card mb-3" :data-item-id="item.id">
          <div class="card" :class="getItemCardClass(item)" style="position: relative; z-index: 1;">
            <div class="card-body p-3">
              <div class="d-flex align-items-start gap-3">
                <!-- Drag handle -->
                <div class="item-drag-handle d-flex align-items-center cursor-pointer">
                  <GripVertical :size="16" class="text-muted" />
                </div>

                <!-- Иконка типа элемента -->
                <div class="item-icon d-flex align-items-center">
                  <component :is="getItemIcon(item)" :size="20" :class="getItemIconClass(item)" />
                </div>

                <!-- Основная информация -->
                <div class="flex-grow-1">
                  <div class="d-flex justify-content-between align-items-start">
                    <div>
                      <h6 class="mb-1">{{ getItemTitle(item) }}</h6>
                      <p class="text-muted small mb-2" v-if="getItemDescription(item)">
                        {{ getItemDescription(item) }}
                      </p>
                      
                      <!-- Метаданные элемента -->
                      <div class="item-meta d-flex flex-wrap gap-1">
                        <span class="badge" :class="getItemTypeBadgeClass(item)">
                          {{ getItemTypeLabel(item) }}
                        </span>
                        
                        <!-- Специфичные для типа badges -->
                        <template v-if="item.item_type === 'test'">
                          <span class="badge bg-info small">{{ item.content?.duration_minutes || 0 }}мин</span>
                          <span class="badge bg-secondary small">{{ item.content?.passing_score || 0 }}%</span>
                          <span class="badge bg-primary small">{{ item.content?.questions_count || 0 }} вопросов</span>
                        </template>
                        
                        <template v-if="item.item_type === 'assignment'">
                          <span class="badge bg-warning small">{{ item.content?.max_grade || 0 }} баллов</span>
                          <span v-if="item.content?.deadline" class="badge bg-secondary small">
                            {{ formatDate(item.content.deadline) }}
                          </span>
                        </template>
                        
                        <template v-if="item.item_type === 'resource'">
                          <span class="badge bg-success small">{{ item.content?.file_size_formatted || 'N/A' }}</span>
                          <span class="badge bg-secondary small">{{ item.content?.download_count || 0 }} скачиваний</span>
                        </template>
                      </div>
                    </div>

                    <!-- Кнопки действий -->
                    <div class="btn-group">
                      <button @click="handleEdit(item)" class="btn btn-sm btn-outline-primary">
                        <Edit :size="14" />
                      </button>
                      <button 
                        v-if="item.item_type === 'test'" 
                        @click="$emit('openQuestionManagement', item.content)" 
                        class="btn btn-sm btn-outline-info"
                      >
                        <HelpCircle :size="14" />
                        Вопросы
                      </button>
                      <ResourceDownloadButton 
                        v-if="item.item_type === 'resource'" 
                        :resource="item.content"
                        variant="outline-success"
                        size="sm"
                        :showText="true"
                        @downloadSuccess="onResourceDownloaded"
                        @downloadError="onResourceDownloadError"
                      />
                      <button @click="handleDelete(item)" class="btn btn-sm btn-outline-danger">
                        <Trash2 :size="14" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </template>
    </draggable>
  </div>
</template>

<script setup>
import { computed, ref } from 'vue'
import draggable from 'vuedraggable'
import {
  Layers, GripVertical, FileCheck, ClipboardList, Upload,
  MoreVertical, Edit, HelpCircle, Copy, Download, Trash2,
  Eye, EyeOff
} from 'lucide-vue-next'
import { apiClient } from '@/js/api/manager'
import { endpoints } from '@/js/api/endpoints'
import { downloadResource as downloadResourceUtil } from '@/modules/cms/filemanager/js/resourceDownload'
import ResourceDownloadButton from '../../components/ResourceDownloadButton.vue'

const props = defineProps({
  items: {
    type: Array,
    default: () => []
  },
  lessonId: {
    type: Number,
    required: true
  }
})

const emit = defineEmits([
  'reorder',
  'createTest',
  'createAssignment', 
  'createResource',
  'editTest',
  'editAssignment',
  'editResource',
  'deleteTest',
  'deleteAssignment',
  'deleteResource',
  'openQuestionManagement',
  'duplicateTest'
])

// Локальная копия элементов для drag and drop
const sortableItems = computed({
  get: () => props.items,
  set: (value) => {
    // Этот setter вызывается библиотекой draggable
    // Мы обновляем порядок через emit в handleReorder
  }
})

// Обработка изменения порядка
const handleReorder = (event) => {
  if (event.oldIndex !== event.newIndex) {
    // Формируем новый порядок элементов
    const reorderedItems = [...sortableItems.value].map((item, index) => ({
      id: item.id,
      sort_order: index + 1
    }))
    
    emit('reorder', {
      lesson_id: props.lessonId,
      items: reorderedItems
    })
  }
}

// Получение иконки для типа элемента
const getItemIcon = (item) => {
  switch (item.item_type) {
    case 'test':
      return FileCheck
    case 'assignment':
      return ClipboardList
    case 'resource':
      return Upload
    default:
      return Layers
  }
}

// Классы для иконок
const getItemIconClass = (item) => {
  switch (item.item_type) {
    case 'test':
      return 'text-info'
    case 'assignment':
      return 'text-warning'
    case 'resource':
      return 'text-success'
    default:
      return 'text-secondary'
  }
}

// Классы для карточек
const getItemCardClass = (item) => {
  switch (item.item_type) {
    case 'test':
      return 'border-info'
    case 'assignment':
      return 'border-warning'
    case 'resource':
      return 'border-success'
    default:
      return 'border-secondary'
  }
}

// Классы для badges типов
const getItemTypeBadgeClass = (item) => {
  switch (item.item_type) {
    case 'test':
      return 'bg-info'
    case 'assignment':
      return 'bg-warning'
    case 'resource':
      return 'bg-success'
    default:
      return 'bg-secondary'
  }
}

// Лейблы типов
const getItemTypeLabel = (item) => {
  switch (item.item_type) {
    case 'test':
      return 'Тест'
    case 'assignment':
      return 'Задание'
    case 'resource':
      return 'Ресурс'
    default:
      return 'Неизвестно'
  }
}

// Получение заголовка элемента
const getItemTitle = (item) => {
  if (!item.content) return item.display_name || 'Без названия'
  
  return item.content.title || item.content.name || item.display_name || 'Без названия'
}

// Получение описания элемента
const getItemDescription = (item) => {
  if (!item.content) return ''
  
  const description = item.content.description || ''
  return description.length > 100 ? description.substring(0, 100) + '...' : description
}

// Форматирование даты
const formatDate = (dateString) => {
  if (!dateString) return ''
  const date = new Date(dateString)
  return date.toLocaleDateString('ru-RU')
}

// Обработка редактирования
const handleEdit = (item) => {
  switch (item.item_type) {
    case 'test':
      emit('editTest', item.content)
      break
    case 'assignment':
      emit('editAssignment', item.content)
      break
    case 'resource':
      emit('editResource', item.content)
      break
  }
}

// Обработка удаления
const handleDelete = (item) => {
  switch (item.item_type) {
    case 'test':
      emit('deleteTest', item.content)
      break
    case 'assignment':
      emit('deleteAssignment', item.content)
      break
    case 'resource':
      emit('deleteResource', item.content)
      break
  }
}

// Обработчики для скачивания ресурсов
const onResourceDownloaded = (resource) => {
  console.log('Ресурс успешно скачан:', resource.name)
}

const onResourceDownloadError = (errorMsg, resource) => {
  console.error('Ошибка скачивания ресурса:', resource.name, errorMsg)
  alert(errorMsg)
}
</script>

<style scoped>
.lesson-items-list {
  min-height: 50px;
}

.lesson-item-card {
  transition: all 0.3s ease;
}

.lesson-item-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 8px rgba(0,0,0,0.1);
}

.item-drag-handle {
  cursor: grab;
  opacity: 0.6;
  transition: opacity 0.2s;
}

.item-drag-handle:hover {
  opacity: 1;
}

.item-drag-handle:active {
  cursor: grabbing;
}

.item-icon {
  flex-shrink: 0;
}

.item-meta .badge {
  font-size: 0.7rem;
}

/* Стили для drag and drop */
.sortable-ghost {
  opacity: 0.5;
  background: #f8f9fa;
  border: 2px dashed #dee2e6;
}

.sortable-chosen {
  transform: rotate(2deg);
}

.sortable-drag {
  opacity: 0.8;
  transform: rotate(5deg);
}

/* Анимации */
.lesson-item-card {
  animation: fadeInUp 0.3s ease;
}

@keyframes fadeInUp {
  from {
    opacity: 0;
    transform: translateY(10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.dropdown-menu {
  position: absolute !important;
  z-index: 2000 !important;
}

/* Стили для курсора кнопок */
.btn {
  cursor: pointer !important;
  position: relative;
}

.btn:hover {
  cursor: pointer !important;
}

.btn:disabled {
  cursor: not-allowed !important;
}

/* Все дочерние элементы кнопки не должны перехватывать события мыши */
.btn * {
  pointer-events: none !important;
  cursor: inherit !important;
}

/* Группы кнопок */
.btn-group .btn {
  cursor: pointer !important;
}

.btn-group .btn:hover {
  cursor: pointer !important;
}

.btn-group .btn:disabled {
  cursor: not-allowed !important;
}

/* Обеспечиваем что весь контент кнопки наследует курсор */
.btn:not(:disabled) *,
.btn:not(:disabled) svg,
.btn:not(:disabled) span {
  cursor: pointer !important;
  pointer-events: none !important;
}

.btn:disabled *,
.btn:disabled svg,
.btn:disabled span {
  cursor: not-allowed !important;
  pointer-events: none !important;
}

/* Центрирование иконок в кнопках */
.btn {
  display: inline-flex !important;
  align-items: center !important;
  justify-content: center !important;
  gap: 0.25rem !important;
}

.btn svg {
  display: inline-block !important;
  vertical-align: middle !important;
  flex-shrink: 0 !important;
}

/* Для кнопок в группах */
.btn-group .btn {
  display: inline-flex !important;
  align-items: center !important;
  justify-content: center !important;
  gap: 0.25rem !important;
}

.btn-group .btn svg {
  display: inline-block !important;
  vertical-align: middle !important;
  flex-shrink: 0 !important;
}

/* Центрирование для всех svg иконок */
svg {
  display: inline-block !important;
  vertical-align: middle !important;
}
</style> 