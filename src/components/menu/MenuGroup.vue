<!--
  КОМПОНЕНТ ГРУППЫ МЕНЮ
  
  Представляет отдельную секцию (группу) в боковом меню с возможностью
  содержать подразделы. Поддерживает различные типы навигации и 
  адаптивное отображение в зависимости от состояния родительского меню.
  
  Функциональность:
  - Отображение основного пункта меню с иконкой и названием
  - Сворачивание/разворачивание списка подразделов с анимацией
  - Поддержка многоуровневой вложенности через компонент MenuItem
  - Поддержка двух типов подразделов:
    * Обычные Vue маршруты (RouterLink навигация)
    * BI offcanvas вкладки (emit событие для открытия боковой панели)
  - Адаптивное скрытие/показ элементов в зависимости от hover состояния
  - Активное состояние для текущей страницы/раздела
  - Плавные анимации появления подразделов с задержкой
  
  Props:
  - data: объект секции меню из menu-sections.js
  - isOpen: состояние открытости группы
  - isCollapsed: состояние сворачивания родительского меню
  - isHovering: состояние наведения на свернутое меню
  - currentPage: текущая активная страница для подсветки
  - nestedOpenStates: объект с состояниями открытости вложенных групп
  
  События:
  - toggle: переключение состояния группы
  - navigate: навигация для offcanvas вкладок
  - reset-page: сброс текущей страницы
  - toggle-nested: переключение состояния вложенной группы
-->

<script setup>
import { ChevronRight, Dot } from 'lucide-vue-next'
import { computed } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import MenuItem from './MenuItem.vue'

const props = defineProps({
  data: { type: Object, required: true },
  isOpen: { type: Boolean, required: true },
  isCollapsed: { type: Boolean, required: true },
  isHovering: { type: Boolean, required: true },
  currentPage: { type: String, required: true },
  nestedOpenStates: { type: Object, default: () => ({}) },
})

const showFull = computed(() => props.isCollapsed || props.isHovering)

// Объединяем list и children в один массив для отображения
const menuItems = computed(() => {
  const items = []
  if (props.data.list) {
    items.push(...props.data.list)
  }
  if (props.data.children) {
    items.push(...props.data.children)
  }
  return items
})

// Проверяем, есть ли вообще элементы для отображения
const hasMenuItems = computed(() => {
  return (props.data.list && props.data.list.length > 0) || 
         (props.data.children && props.data.children.length > 0)
})

const router = useRouter()
const route = useRoute()
const emit = defineEmits(['toggle', 'action', 'navigate', 'reset-page', 'toggle-nested'])

const isCurrentRoute = computed(() => {
  return route.name === props.data.routeName
})

const isCurrentGroupPage = computed(() => {
  // Проверяем, находится ли пользователь на основной странице группы
  if (route.name === props.data.routeName) {
    return true
  }
  
  // Проверяем, находится ли пользователь на одной из подстраниц группы
  if (menuItems.value.length > 0) {
    return menuItems.value.some(item => {
      // Для обычных Vue страниц
      if (item.path && route.name === item.path) {
        return true
      }
      
      // Для BI offcanvas страниц - проверяем что мы находимся на BI странице
      if (item.isOffcanvas && item.page === props.currentPage) {
        // Дополнительно проверяем, что мы действительно на BI странице
        if (route.name === 'BI' || route.path.startsWith('/bi')) {
          return true
        }
      }
      
      // Для BI элементов с подвкладками (только с разделителями)
      if (item.isOffcanvas && item.page && props.currentPage && item.page.length > 2) {
        if (props.currentPage.startsWith(item.page + '-') || 
            props.currentPage.startsWith(item.page + '_') || 
            props.currentPage.startsWith(item.page + '.')) {
          return true
        }
      }
      
      // Для BI элементов с page без isOffcanvas флага
      if (item.page && !item.isOffcanvas && item.page === props.currentPage) {
        return true
      }
      
      // Дополнительная проверка для BI элементов с иерархией подвкладок
      // Только если currentPage начинается с itemPage и есть разделитель (более строгая проверка)
      if (item.page && props.currentPage && item.page.length > 2) {
        const itemPage = item.page.toLowerCase()
        const currentPage = props.currentPage.toLowerCase()
        
        // Проверяем только если currentPage начинается с itemPage + разделитель
        if (currentPage.startsWith(itemPage + '-') || currentPage.startsWith(itemPage + '_') || 
            currentPage.startsWith(itemPage + '.')) {
          return true
        }
      }
      
      return false
    })
  }
  
  return false
})

// Новый computed для выделения основного элемента меню
const shouldHighlightMainItem = computed(() => {
  // Выделяем если пользователь находится на основной странице группы
  if (route.name === props.data.routeName) {
    return true
  }
  
  // Выделяем если пользователь находится на любой подстранице этой группы
  if (menuItems.value.length > 0) {
    return menuItems.value.some(item => {
      // Для обычных Vue страниц
      if (item.path && route.name === item.path) {
        return true
      }
      
      // Для BI offcanvas страниц - проверяем что мы находимся на BI странице
      if (item.isOffcanvas && item.page === props.currentPage) {
        // Дополнительно проверяем, что мы действительно на BI странице
        if (route.name === 'BI' || route.path.startsWith('/bi')) {
          return true
        }
      }
      
      // Для BI элементов с подвкладками (только с разделителями)
      if (item.isOffcanvas && item.page && props.currentPage && item.page.length > 2) {
        const basePage = item.page
        const currentPage = props.currentPage
        // Проверяем если текущая страница является подвкладкой данной BI вкладки
        if (currentPage.startsWith(basePage + '-') || 
            currentPage.startsWith(basePage + '_') || 
            currentPage.startsWith(basePage + '.')) {
          return true
        }
      }
      
      // Для BI элементов с page без isOffcanvas флага
      if (item.page && !item.isOffcanvas && item.page === props.currentPage) {
        return true
      }
      
      // Дополнительная проверка для BI элементов с иерархией подвкладок
      // Только если currentPage начинается с itemPage и есть разделитель (более строгая проверка)
      if (item.page && props.currentPage && item.page.length > 2) {
        const itemPage = item.page.toLowerCase()
        const currentPage = props.currentPage.toLowerCase()
        
        // Проверяем только если currentPage начинается с itemPage + разделитель
        if (currentPage.startsWith(itemPage + '-') || currentPage.startsWith(itemPage + '_') || 
            currentPage.startsWith(itemPage + '.')) {
          return true
        }
      }
      
      return false
    })
  }
  
  return false
})



// Обработчик переключения вложенных групп
function handleToggleNested(groupId) {
  emit('toggle-nested', groupId)
}

// Обработчик навигации для вложенных элементов
function handleNestedNavigate(item) {
  emit('navigate', item)
}

function routeClick(event) {
  event.preventDefault() // Всегда блокируем стандартную навигацию RouterLink
  
  if (hasMenuItems.value) {
    // Если у элемента есть подменю
    if (props.isOpen) {
      // Если группа открыта - просто закрываем, не переходим никуда
      emit('toggle')
    } 
    else {
      // Если группа закрыта - открываем
      emit('toggle')
      
      // Переходим на основную страницу только если пользователь НЕ находится в пределах этой группы
      if (!isCurrentGroupPage.value) {
        router.push({ name: props.data.routeName })
      }
    }
  } else {
    // Если подменю нет - просто переходим на страницу
    router.push({ name: props.data.routeName })
  }
}

</script>

<template>
  <li class="side-menu__group side-group">
    <div
      class="side-title nav-btn"
      :class="{ 'side-title--active': shouldHighlightMainItem }"
      @click="routeClick($event)"
    >
      <div class="side-title__label">
        <div class="side-icon icon-flex">
          <component :is="data.icon" :size="20" />
        </div>
        <div class="side-title__name text-smooth-animation" :class="{ hidden: !isHovering }">
          {{ data.title }}
        </div>
      </div>
      <div v-if="isHovering && hasMenuItems" class="nav-icon icon-flex">
        <ChevronRight :size="20" :class="{ rotated: isOpen }" />
      </div>
    </div>

    <ul
      v-if="hasMenuItems"
      class="side-group__list"
      :class="showFull ? (isOpen ? 'is-open' : '') : ''"
    >
      <MenuItem
        v-for="(item, index) in menuItems"
        :key="index"
        :item="item"
        :level="0"
        :isHovering="isHovering"
        :currentPage="currentPage"
        :openStates="nestedOpenStates"
        :style="{ transitionDelay: `${index * 50}ms` }"
        @navigate="handleNestedNavigate"
        @toggle-group="handleToggleNested"
      />
    </ul>
  </li>
</template>

<style lang="scss" scoped>
.side-group {
  @include flex-column-gap(2px);
}

.side-title,
.side-subtitle {
  @include flex-row-gap(0, center, space-between);
  cursor: pointer;
  color: var(--color-primary-text);
  text-decoration: none;

  &__label {
    @include flex-row-gap($padding-internal, center);
    flex: 1;
    min-width: 0; // Позволяет flex элементам сжиматься ниже их естественной ширины
  }
}

.side-title--active {
  color: var(--bs-primary);
  background-color: var(--bs-primary-bg-subtle);
}
.side-subtitle--active .nav-icon,
.side-subtitle--active .side-subtitle__name {
  color: var(--bs-primary);
  padding-left: 0.5rem;
}

.nav-btn {
  padding: $padding-internal $padding-external;
  border-radius: $radius-small;
  transition: all $transition;
  overflow: hidden;

  &:not(.side-title--active):hover {
    background-color: var(--color-secondary-background);
  }
  &.side-title--active:hover {
    background-color: var(--bs-primary-border-subtle);
  }
}

.side-subtitle--active {
  background-color: var(--bs-primary-bg-subtle);
  color: var(--bs-primary);
}

.side-title__name {
  white-space: nowrap;
}

.side-subtitle__name {
  white-space: nowrap;
  overflow: visible;
  text-overflow: unset;
  flex: 1;
}

.nav-icon svg {
  transition: transform 0.3s ease;
}
.rotated {
  transform: rotate(90deg);
}

.side-group__list {
  overflow: hidden;
  max-height: 0;
  opacity: 0;
  padding: 0;
  margin: 0;
  list-style: none;

  transition:
    max-height 0.5s ease,
    opacity 0.5s ease-in-out;
}

.side-group__list.is-open {
  max-height: none;
  opacity: 1;
}

.side-group__list-item {
  opacity: 0;
  transform: translateY(-10px);
  transition:
    opacity 0.3s ease,
    transform 0.3s ease;
}

.side-group__list.is-open .side-group__list-item {
  opacity: 1;
  transform: translateY(0);
}
</style>