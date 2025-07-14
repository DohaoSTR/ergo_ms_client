<template>
  <div class="category-item">
    <div class="category-content" :class="{ 'has-children': hasChildren }">
      <div class="category-info">
        <button
          v-if="hasChildren"
          class="btn btn-sm btn-link expand-btn"
          @click="toggleExpanded"
        >
          <ChevronRight v-if="!isExpanded" :size="16" />
          <ChevronDown v-else :size="16" />
        </button>
        <span v-else class="expand-placeholder"></span>
        
        <strong class="category-name" v-html="highlightText(category.name)"></strong>
        
        <span v-if="category.description" class="text-muted ms-2" v-html="highlightText(category.description)"></span>
        
        <span class="badge bg-info ms-2">{{ category.courses_count || 0 }} курс(ов)</span>
        
        <span 
          class="badge ms-2" 
          :class="category.is_visible ? 'bg-success' : 'bg-secondary'"
        >
          {{ category.is_visible ? 'Видимая' : 'Скрытая' }}
        </span>
      </div>
      
      <div class="category-actions">
        <button 
          class="btn btn-sm btn-outline-primary"
          @click="$emit('edit', category)"
          title="Редактировать"
        >
          <Edit :size="14" />
        </button>
        <button 
          class="btn btn-sm btn-outline-danger"
          @click="$emit('delete', category)"
          title="Удалить"
        >
          <Trash2 :size="14" />
        </button>
      </div>
    </div>
    
    <div v-if="hasChildren && isExpanded" class="category-children">
      <CategoryTreeItem
        v-for="child in children"
        :key="child.id"
        :category="child"
        :categories="categories"
        :filteredCategories="filteredCategories"
        :searchQuery="searchQuery"
        @edit="$emit('edit', $event)"
        @delete="$emit('delete', $event)"
      />
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { ChevronRight, ChevronDown, Edit, Trash2 } from 'lucide-vue-next'

const props = defineProps({
  category: {
    type: Object,
    required: true
  },
  categories: {
    type: Array,
    required: true
  },
  filteredCategories: {
    type: Array,
    default: () => []
  },
  searchQuery: {
    type: String,
    default: ''
  }
})

defineEmits(['edit', 'delete'])

const isExpanded = ref(true)

const children = computed(() => {
  const categoriesToUse = props.filteredCategories.length > 0 ? props.filteredCategories : props.categories
  return categoriesToUse.filter(c => c.parent === props.category.id)
})

const hasChildren = computed(() => {
  return children.value.length > 0
})

const highlightText = (text) => {
  if (!props.searchQuery || !text) return text
  
  const query = props.searchQuery.toLowerCase()
  const parts = text.split(new RegExp(`(${escapeRegExp(query)})`, 'gi'))
  
  return parts
    .map(part => 
      part.toLowerCase() === query.toLowerCase()
        ? `<mark class="search-highlight">${part}</mark>`
        : part
    )
    .join('')
}

function escapeRegExp(string) {
  return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

function toggleExpanded() {
  isExpanded.value = !isExpanded.value
}
</script>

<style scoped>
.category-item {
  margin-bottom: 0.5rem;
}

.category-content {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0.75rem;
  background-color: #f8f9fa;
  border-radius: 0.375rem;
  transition: background-color 0.2s;
}

.category-content:hover {
  background-color: #e9ecef;
}

.category-info {
  display: flex;
  align-items: center;
  flex: 1;
}

.expand-btn {
  padding: 0;
  margin-right: 0.5rem;
  background: none;
  border: none;
  color: #6c757d;
}

.expand-placeholder {
  width: 32px;
  display: inline-block;
}

.category-name {
  font-size: 1rem;
}

.category-actions {
  display: flex;
  gap: 0.25rem;
}

.category-children {
  margin-left: 2rem;
  margin-top: 0.5rem;
}

/* Улучшенные стили для подсветки поиска */
:deep(.search-highlight) {
  background-color: rgba(255, 193, 7, 0.3);
  color: inherit;
  padding: 0.1em 0.2em;
  border-radius: 0.2em;
  margin: 0 -0.1em;
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.1);
  font-weight: 600;
  display: inline-block;
  line-height: normal;
  vertical-align: baseline;
  position: relative;
  z-index: 1;
}

/* Анимация при появлении подсветки */
:deep(.search-highlight) {
  animation: highlight-fade-in 0.2s ease-out;
}

@keyframes highlight-fade-in {
  from {
    background-color: rgba(255, 193, 7, 0.6);
  }
  to {
    background-color: rgba(255, 193, 7, 0.3);
  }
}
</style> 