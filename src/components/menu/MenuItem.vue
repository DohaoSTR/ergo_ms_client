<!--
  КОМПОНЕНТ ЭЛЕМЕНТА МЕНЮ
  
  Рекурсивный компонент для отображения элементов меню с поддержкой неограниченной вложенности.
  Поддерживает обычные Vue маршруты, BI offcanvas вкладки и группировку элементов.
  
  Props:
  - item: объект элемента меню
  - level: уровень вложенности (для отступов)
  - isHovering: состояние наведения на свернутое меню
  - currentPage: текущая активная страница для подсветки
  - openStates: объект с состояниями открытости групп
  
  События:
  - navigate: навигация для offcanvas вкладок  
  - toggle-group: переключение состояния группы
-->

<script setup>
import { ChevronRight, Dot } from 'lucide-vue-next'
import { computed } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { iconMapping } from '@/config/icons-mapping.js'

const props = defineProps({
  item: { type: Object, required: true },
  level: { type: Number, default: 0 },
  isHovering: { type: Boolean, required: true },
  currentPage: { type: String, required: true },
  openStates: { type: Object, required: true }
})

const router = useRouter()
const route = useRoute()
const emit = defineEmits(['navigate', 'toggle-group'])

// Уникальный идентификатор для группы
const groupId = computed(() => {
  return `${props.item.routeName || props.item.page || props.item.name}_${props.level}`
})

// Проверка, является ли элемент группой (имеет дочерние элементы)
const isGroup = computed(() => {
  return props.item.children && props.item.children.length > 0
})

// Состояние открытости группы
const isOpen = computed(() => {
  return props.openStates[groupId.value] || false
})

// Проверка активности текущего элемента
const isActive = computed(() => {
  // Для элементов с routeName
  if (props.item.routeName && route.name === props.item.routeName) {
    return true
  }
  
  // Для BI offcanvas страниц - проверяем что мы находимся на BI странице
  if (props.item.isOffcanvas && props.item.page === props.currentPage) {
    // Дополнительно проверяем, что мы действительно на BI странице
    if (route.name === 'BI' || route.path.startsWith('/bi')) {
      return true
    }
  }
  
  // Для BI элементов с подвкладками
  if (props.item.page && props.currentPage && props.item.page.length > 2) {
    if (props.currentPage.startsWith(props.item.page + '-') ||
        props.currentPage.startsWith(props.item.page + '_') ||
        props.currentPage.startsWith(props.item.page + '.')) {
      return true
    }
  }
  
  return false
})

// Проверка, активна ли группа (есть ли активные дочерние элементы)
const isGroupActive = computed(() => {
  if (!isGroup.value) return false
  
  return checkChildrenActive(props.item.children, props.currentPage)
})

function checkChildrenActive(children, currentPage) {
  return children.some(child => {
    // Проверяем прямую активность
    if (child.routeName && route.name === child.routeName) return true
    
    // Для BI offcanvas страниц - проверяем что мы находимся на BI странице
    if (child.isOffcanvas && child.page === currentPage) {
      // Дополнительно проверяем, что мы действительно на BI странице
      if (route.name === 'BI' || route.path.startsWith('/bi')) {
        return true
      }
    }
    
    if (child.page && currentPage && child.page.length > 2) {
      if (currentPage.startsWith(child.page + '-') ||
          currentPage.startsWith(child.page + '_') ||
          currentPage.startsWith(child.page + '.')) {
        return true
      }
    }
    
    // Рекурсивно проверяем дочерние элементы
    if (child.children && child.children.length > 0) {
      return checkChildrenActive(child.children, currentPage)
    }
    
    return false
  })
}

// Обработка клика по элементу
function handleClick(event) {
  event.preventDefault()
  
  if (isGroup.value) {
    // Если это группа - переключаем состояние
    if (isOpen.value) {
      // Если группа открыта - просто закрываем
      emit('toggle-group', groupId.value)
    } else {
      // Если группа закрыта - открываем
      emit('toggle-group', groupId.value)
      
      // Если у группы есть маршрут, переходим на него (для redirect)
      if (props.item.routeName) {
        router.push({ name: props.item.routeName })
      }
    }
  } else if (props.item.isOffcanvas || props.item.page) {
    // Если это BI offcanvas элемент
    emit('navigate', props.item)
  } else if (props.item.routeName) {
    // Если это обычная Vue страница
    router.push({ name: props.item.routeName })
  }
}

// Вычисление отступа в зависимости от уровня вложенности
const paddingLeft = computed(() => {
  return `${20 + (props.level * 16)}px`
})
</script>

<template>
  <li class="menu-item" :class="{ 'menu-item--group': isGroup }">
    <!-- Основной элемент -->
    <div
      class="menu-item__content nav-btn"
      :class="{ 
        'menu-item--active': isActive || isGroupActive,
        'menu-item--group-active': isGroupActive && !isActive
      }"
      :style="{ paddingLeft: paddingLeft }"
      @click="handleClick"
    >
      <div class="menu-item__label">
        <!-- Иконка если указана, иначе точка -->
        <div class="menu-item__icon icon-flex">
          <component v-if="item.icon && iconMapping[item.icon]" :is="iconMapping[item.icon]" :size="20" />
          <Dot v-else :size="20" />
        </div>
        
        <!-- Название элемента -->
        <div 
          v-if="isHovering"
          class="menu-item__name text-smooth-animation"
          :title="item.name || item.title"
        >
          {{ item.name || item.title }}
        </div>
      </div>
      
      <!-- Стрелка для групп -->
      <div v-if="isGroup && isHovering" class="menu-item__chevron icon-flex">
        <ChevronRight :size="16" :class="{ rotated: isOpen }" />
      </div>
    </div>
    
    <!-- Дочерние элементы -->
    <ul
      v-if="isGroup"
      class="menu-item__children"
      :class="{ 'is-open': isOpen }"
    >
      <MenuItem
        v-for="(child, index) in item.children"
        :key="index"
        :item="child"
        :level="level + 1"
        :isHovering="isHovering"
        :currentPage="currentPage"
        :openStates="openStates"
        :style="{ transitionDelay: `${index * 30}ms` }"
        @navigate="$emit('navigate', $event)"
        @toggle-group="$emit('toggle-group', $event)"
      />
    </ul>
  </li>
</template>

<style lang="scss" scoped>
.menu-item {
  @include flex-column-gap(2px);
}

.menu-item__content {
  @include flex-row-gap(0, center, space-between);
  cursor: pointer;
  color: var(--color-primary-text);
  text-decoration: none;
  padding: $padding-internal $padding-external;
  border-radius: $radius-small;
  transition: all $transition;
  overflow: hidden;
  
  &:not(.menu-item--active):hover {
    background-color: var(--color-secondary-background);
  }
}

.menu-item__label {
  @include flex-row-gap($padding-internal, center);
  flex: 1;
  min-width: 0; // Позволяет flex элементам сжиматься ниже их естественной ширины
}

.menu-item__icon {
  flex-shrink: 0;
}

.menu-item__name {
  white-space: nowrap;
  overflow: visible;
  text-overflow: unset;
  flex: 1;
}

.menu-item__chevron svg {
  transition: transform 0.3s ease;
}

.rotated {
  transform: rotate(90deg);
}

// Активные состояния - точно такие же как в MenuGroup
.menu-item--active {
  background-color: var(--bs-primary-bg-subtle);
  color: var(--bs-primary);
  
  .menu-item__icon,
  .menu-item__name {
    color: var(--bs-primary);
  }
  
  &:hover {
    background-color: var(--bs-primary-border-subtle);
  }
}

.menu-item--group-active {
  background-color: var(--color-secondary-background);
  
  &:hover {
    background-color: var(--bs-primary-bg-subtle);
  }
}

// Дочерние элементы
.menu-item__children {
  overflow: hidden;
  max-height: 0;
  opacity: 0;
  padding: 0;
  margin: 0;
  list-style: none;
  transition:
    max-height 0.5s ease,
    opacity 0.5s ease-in-out;
    
  &.is-open {
    max-height: none;
    opacity: 1;
  }
}

// Анимация появления дочерних элементов
.menu-item__children .menu-item {
  opacity: 0;
  transform: translateY(-10px);
  transition:
    opacity 0.3s ease,
    transform 0.3s ease;
}

.menu-item__children.is-open .menu-item {
  opacity: 1;
  transform: translateY(0);
}
</style> 