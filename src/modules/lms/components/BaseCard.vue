<template>
  <div class="base-card" :class="cardClasses">
    <!-- Заголовок карточки -->
    <div v-if="hasHeader" class="card-header" :class="headerClasses">
      <div class="d-flex justify-content-between align-items-center">
        <div class="header-content">
          <slot name="header">
            <h6 class="mb-0" v-if="title">{{ title }}</h6>
            <small class="text-muted" v-if="subtitle">{{ subtitle }}</small>
          </slot>
        </div>
        <div class="header-actions" v-if="hasHeaderActions">
          <slot name="header-actions">
            <div class="dropdown" v-if="showDropdown">
              <button 
                class="btn btn-sm btn-outline-secondary" 
                data-bs-toggle="dropdown"
                :disabled="loading"
              >
                <ChevronDown :size="16" />
              </button>
              <ul class="dropdown-menu">
                <slot name="dropdown-items"></slot>
              </ul>
            </div>
          </slot>
        </div>
      </div>
    </div>

    <!-- Основной контент -->
    <div class="card-body" :class="bodyClasses">
      <div v-if="loading" class="text-center py-3">
        <div class="spinner-border spinner-border-sm" role="status"></div>
        <p class="mt-2 mb-0 text-muted small">{{ loadingText }}</p>
      </div>
      
      <div v-else-if="error" class="alert alert-danger py-2 mb-0">
        <small>{{ error }}</small>
      </div>
      
      <div v-else-if="isEmpty && emptyText" class="text-center py-3 text-muted">
        <component v-if="emptyIcon" :is="emptyIcon" :size="32" class="mb-2" />
        <p class="mb-0">{{ emptyText }}</p>
      </div>
      
      <div v-else>
        <slot></slot>
      </div>
    </div>

    <!-- Футер карточки -->
    <div v-if="hasFooter" class="card-footer" :class="footerClasses">
      <slot name="footer"></slot>
    </div>
  </div>
</template>

<script setup>
import { computed, useSlots } from 'vue'
import { ChevronDown } from 'lucide-vue-next'

const props = defineProps({
  // Основные свойства
  title: String,
  subtitle: String,
  loading: Boolean,
  error: String,
  isEmpty: Boolean,
  emptyText: String,
  emptyIcon: String,
  loadingText: {
    type: String,
    default: 'Загрузка...'
  },

  // Стили
  variant: {
    type: String,
    default: 'default',
    validator: value => ['default', 'outline', 'flush', 'elevated'].includes(value)
  },
  size: {
    type: String,
    default: 'default',
    validator: value => ['sm', 'default', 'lg'].includes(value)
  },
  rounded: {
    type: Boolean,
    default: true
  },
  shadow: {
    type: Boolean,
    default: false
  },

  // Поведение
  showDropdown: Boolean,
  clickable: Boolean,
  disabled: Boolean,

  // Дополнительные классы
  cardClass: String,
  headerClass: String,
  bodyClass: String,
  footerClass: String
})

const emit = defineEmits(['click', 'dropdown-action'])

const slots = useSlots()

// Вычисляемые свойства для слотов
const hasHeader = computed(() => {
  return props.title || props.subtitle || slots.header || slots['header-actions']
})

const hasHeaderActions = computed(() => {
  return props.showDropdown || slots['header-actions']
})

const hasFooter = computed(() => {
  return slots.footer
})

// Классы для карточки
const cardClasses = computed(() => {
  const classes = ['card']
  
  // Вариант отображения
  if (props.variant === 'outline') classes.push('border')
  else if (props.variant === 'flush') classes.push('border-0')
  else if (props.variant === 'elevated') classes.push('shadow-lg')
  else classes.push('border')

  // Размер
  if (props.size === 'sm') classes.push('card-sm')
  else if (props.size === 'lg') classes.push('card-lg')

  // Скругление
  if (props.rounded) classes.push('rounded')
  else classes.push('rounded-0')

  // Тень
  if (props.shadow) classes.push('shadow')

  // Интерактивность
  if (props.clickable) classes.push('card-clickable')
  if (props.disabled) classes.push('card-disabled')

  // Высота
  classes.push('h-100')

  // Дополнительные классы
  if (props.cardClass) classes.push(props.cardClass)

  return classes
})

const headerClasses = computed(() => {
  const classes = []
  if (props.headerClass) classes.push(props.headerClass)
  return classes
})

const bodyClasses = computed(() => {
  const classes = []
  if (props.bodyClass) classes.push(props.bodyClass)
  return classes
})

const footerClasses = computed(() => {
  const classes = []
  if (props.footerClass) classes.push(props.footerClass)
  return classes
})

// Обработчик клика
function handleClick(event) {
  if (!props.disabled && props.clickable) {
    emit('click', event)
  }
}
</script>

<style scoped>
.card-clickable {
  cursor: pointer;
  transition: transform 0.2s ease, box-shadow 0.2s ease;
}

.card-clickable:hover:not(.card-disabled) {
  transform: translateY(-2px);
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1) !important;
}

.card-disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.card-sm .card-body {
  padding: 0.75rem;
}

.card-lg .card-body {
  padding: 2rem;
}

.header-content {
  min-width: 0; /* Для правильного обрезания текста */
}

.header-actions {
  flex-shrink: 0;
}
</style> 