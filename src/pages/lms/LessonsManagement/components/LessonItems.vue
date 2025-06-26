<template>
  <div class="lesson-items">
    <div class="d-flex justify-content-between align-items-center mb-3">
      <h6 class="mb-0 d-flex align-items-center gap-2">
        <Layers :size="18" />
        Материалы урока
        <span class="badge bg-primary">{{ items.length }}</span>
      </h6>
      
      <div class="btn-group">
        <button 
          @click="$emit('createTest')" 
          class="btn btn-sm btn-outline-info"
          title="Добавить тест"
        >
          <FileCheck :size="14" />
        </button>
        <button 
          @click="$emit('createAssignment')" 
          class="btn btn-sm btn-outline-warning"
          title="Добавить задание"
        >
          <ClipboardList :size="14" />
        </button>
        <button 
          @click="$emit('createResource')" 
          class="btn btn-sm btn-outline-success"
          title="Добавить ресурс"
        >
          <Upload :size="14" />
        </button>
      </div>
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
          <div class="card" :class="getItemCardClass(item)">
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

                    <!-- Меню действий -->
                    <div class="dropdown">
                      <button class="btn btn-sm btn-outline-secondary" data-bs-toggle="dropdown">
                        <MoreVertical :size="14" />
                      </button>
                      <ul class="dropdown-menu">
                        <!-- Общие действия -->
                        <li>
                          <a class="dropdown-item" href="#" @click.prevent="handleEdit(item)">
                            <Edit :size="14" class="me-2" />
                            Редактировать
                          </a>
                        </li>
                        
                        <!-- Специфичные для типа действия -->
                        <template v-if="item.item_type === 'test'">
                          <li>
                            <a class="dropdown-item" href="#" @click.prevent="$emit('openQuestionManagement', item.content)">
                              <HelpCircle :size="14" class="me-2" />
                              Управление вопросами
                            </a>
                          </li>
                          <li>
                            <a class="dropdown-item" href="#" @click.prevent="$emit('duplicateTest', item.content)">
                              <Copy :size="14" class="me-2" />
                              Дублировать
                            </a>
                          </li>
                        </template>
                        
                        <template v-if="item.item_type === 'resource'">
                          <li>
                            <a class="dropdown-item" href="#" @click.prevent="downloadResource(item.content)">
                              <Download :size="14" class="me-2" />
                              Скачать
                            </a>
                          </li>
                        </template>
                        
                        <li><hr class="dropdown-divider"></li>
                        <li>
                          <a class="dropdown-item text-danger" href="#" @click.prevent="handleDelete(item)">
                            <Trash2 :size="14" class="me-2" />
                            Удалить
                          </a>
                        </li>
                      </ul>
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

// Скачивание ресурса
const downloadResource = (resource) => {
  if (resource.file) {
    const link = document.createElement('a')
    link.href = resource.file
    link.download = resource.name || 'download'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }
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
</style> 