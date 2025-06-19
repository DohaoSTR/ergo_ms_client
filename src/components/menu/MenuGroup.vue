<!--
  КОМПОНЕНТ ГРУППЫ МЕНЮ
  
  Представляет отдельную секцию (группу) в боковом меню с возможностью
  содержать подразделы. Поддерживает различные типы навигации и 
  адаптивное отображение в зависимости от состояния родительского меню.
  
  Функциональность:
  - Отображение основного пункта меню с иконкой и названием
  - Сворачивание/разворачивание списка подразделов с анимацией
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
  
  События:
  - toggle: переключение состояния группы
  - navigate: навигация для offcanvas вкладок
  - reset-page: сброс текущей страницы
-->

<script setup>
import { ChevronRight, Dot } from 'lucide-vue-next'
import { computed } from 'vue'
import { useRouter, useRoute } from 'vue-router'

const props = defineProps({
  data: { type: Object, required: true },
  isOpen: { type: Boolean, required: true },
  isCollapsed: { type: Boolean, required: true },
  isHovering: { type: Boolean, required: true },
  currentPage: { type: String, required: true },
})

const showFull = computed(() => props.isCollapsed || props.isHovering)

const router = useRouter()
const route = useRoute()
const emit = defineEmits(['toggle', 'action', 'navigate', 'reset-page'])

const isCurrentRoute = computed(() => {
  return route.name === props.data.routeName
})

const isCurrentGroupPage = computed(() => {
  // Проверяем, находится ли пользователь на основной странице группы
  if (route.name === props.data.routeName) {
    return true
  }
  
  // Проверяем, находится ли пользователь на одной из подстраниц группы
  if (props.data.list) {
    return props.data.list.some(item => {
      // Для обычных Vue страниц
      if (item.path && route.name === item.path) {
        return true
      }
      // Для BI offcanvas страниц
      if (item.isOffcanvas && item.page === props.currentPage) {
        return true
      }
      return false
    })
  }
  
  return false
})

function emitNavigate(item) {
  if (item.page) {
    emit('navigate', item)
  }
}

function routeClick(event) {
  event.preventDefault() // Всегда блокируем стандартную навигацию RouterLink
  
  if (props.data.list) {
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
      :class="{ 'side-title--active': isCurrentRoute }"
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
      <div v-if="isHovering && data.list" class="nav-icon icon-flex">
        <ChevronRight :size="20" :class="{ rotated: isOpen }" />
      </div>
    </div>

    <ul
      v-if="data.list"
      class="side-group__list"
      :class="showFull ? (isOpen ? 'is-open' : '') : ''"
    >
      <li
        v-for="(item, index) in data.list"
        :key="index"
        class="side-group__list-item"
        :style="{ transitionDelay: `${index * 50}ms` }"
      >
        <!-- 🔷 BI-вкладки -->
        <template v-if="item.isOffcanvas">
          <a
            href="#"
            class="side-subtitle nav-btn"
            :class="{ 'side-subtitle--active': item.page === currentPage }"
            @click.prevent="emitNavigate(item)"
          >
            <div class="side-subtitle__label">
              <div class="nav-icon icon-flex"><Dot :size="20" /></div>
              <div
                v-if="showFull"
                class="d-inline-block text-truncate side-subtitle__name"
                style="max-width: 9.375rem"
                :title="item.name"
              >
                {{ item.name }}
              </div>
            </div>
          </a>
        </template>

        <!-- 🔶 Обычные Vue страницы -->
        <template v-else>
          <RouterLink
            :to="{ name: item.path }"
            class="side-subtitle nav-btn"
            active-class="side-subtitle--active"
            exact-active-class="side-subtitle--exact-active"
          >
            <div class="side-subtitle__label">
              <div class="nav-icon icon-flex"><Dot :size="20" /></div>
              <div
                v-if="showFull"
                class="d-inline-block text-truncate side-subtitle__name"
                style="max-width: 9.375rem"
                :title="item.name"
              >
                {{ item.name }}
              </div>
            </div>
          </RouterLink>
        </template>
      </li>
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
    @include flex-row-gap($padding-internal, center, space-between);
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
