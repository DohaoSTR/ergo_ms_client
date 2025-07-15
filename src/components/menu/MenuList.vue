<script setup>
import { apiClient } from '@/js/api/manager'
import { endpoints } from '@/js/api/endpoints'
import { onMounted, ref, watch } from 'vue'
import { ChevronLeft, Cog, Minus } from 'lucide-vue-next'

import {
  allMenuSections,
  getSeparator,
  shouldShowSeparator,
  AdminPanelMenuSection
} from '@/js/menu-sections.js'

import MenuGroup from '@/components/menu/MenuGroup.vue'
import MenuToolbar from '@/components/menu/MenuToolbar.vue'
import { useRoute } from 'vue-router'
import { useRouter } from 'vue-router'
import { PerfectScrollbar } from 'vue3-perfect-scrollbar'
import { CheckAccessToAdminPanel, GetClosedPagesForUser } from '@/modules/cms/adp/admin/js/GroupsPolitics'
const props = defineProps({
  isVisible: Boolean,
  currentPage: String
})
watch(
  () => props.isVisible,
  (newValue) => {
    if (!newValue) {
      isHovering.value = true
    } else {
      // Пересчитываем ширину когда меню становится видимым
      initializeMenuWidth()
    }
  },
)


const emit = defineEmits(['left-padding', 'open-datasets', 'open-sidebar', 'reset-page'])

// Состояние меню
const isCollapsed = ref(false)
const isHovering = ref(true)
const menuWidth = ref(260) // Добавляем реактивную ширину меню
const minMenuWidth = 260 // Минимальная ширина
const maxMenuWidth = 400 // Максимальная ширина

// Функция для расчета оптимальной ширины меню
const calculateOptimalWidth = () => {
  // Проверяем, что мы находимся в браузере
  if (typeof window === 'undefined' || typeof document === 'undefined') {
    return minMenuWidth
  }
  
  // Создаем временный элемент для измерения текста
  const canvas = document.createElement('canvas')
  const context = canvas.getContext('2d')
  context.font = '14px system-ui, -apple-system, sans-serif' // Шрифт как в CSS
  
  let maxWidth = 0
  
  // Проверяем ширину названия сайта
  const siteNameWidth = context.measureText(siteName.value || 'ERGO MS').width + 80 // +80px для иконки и отступов
  maxWidth = Math.max(maxWidth, siteNameWidth)
  
  // Проверяем все секции меню
  if (menuSections.value && Array.isArray(menuSections.value)) {
    menuSections.value.forEach(section => {
    if (!section || !section.title) return
    
    // Ширина основного пункта меню
    const titleWidth = context.measureText(section.title).width + 100 // +100px для иконки, отступов и стрелки
    maxWidth = Math.max(maxWidth, titleWidth)
    
    // Ширина подпунктов
    if (section.list && Array.isArray(section.list)) {
      section.list.forEach(item => {
        if (!item || !item.name) return
        const itemWidth = context.measureText(item.name).width + 120 // +120px для отступов и точки
        maxWidth = Math.max(maxWidth, itemWidth)
      })
    }
  })
  }
  
  // Проверяем разделители
  if (menuSections.value && Array.isArray(menuSections.value)) {
    for (let i = 0; i < menuSections.value.length; i++) {
      if (shouldShowSeparator(i)) {
        const separatorText = getSeparator(i)
        if (separatorText) {
          const separatorWidth = context.measureText(separatorText).width + 80
          maxWidth = Math.max(maxWidth, separatorWidth)
        }
      }
    }
  }
  
  // Ограничиваем ширину в разумных пределах
  return Math.min(Math.max(maxWidth, minMenuWidth), maxMenuWidth)
}

const toggleMenu = () => {
  isCollapsed.value = !isCollapsed.value
  const padding = isCollapsed.value ? '120px' : `${menuWidth.value + 40}px`
  emit('left-padding', padding)
}

// Первоначальная установка ширины
const initializeMenuWidth = () => {
  if (typeof window !== 'undefined') {
    updateMenuWidth()
    // Устанавливаем правильный padding при инициализации
    setTimeout(() => {
      if (!isCollapsed.value) {
        emit('left-padding', `${menuWidth.value + 40}px`)
      }
    }, 200)
  }
}

// Обновляем ширину при изменении содержимого
const updateMenuWidth = () => {
  if (typeof window !== 'undefined') {
    setTimeout(() => {
      const newWidth = calculateOptimalWidth()
      if (newWidth !== menuWidth.value) {
        menuWidth.value = newWidth
        if (!isCollapsed.value) {
          emit('left-padding', `${newWidth + 40}px`)
        }
      }
    }, 100)
  }
}

const handleMouseEnter = () => {
  if (isCollapsed.value) isHovering.value = true
}
const handleMouseLeave = () => {
  if (isCollapsed.value) isHovering.value = false
}

const route = useRoute()
const openGroupRouteName = ref(null)
const preventAutoOpen = ref(false)
const nestedOpenStates = ref({})

// Рекурсивная функция для поиска родительской группы по маршруту
const findParentGroupByRoute = (routeName, menuSections) => {
  for (let section of menuSections) {
    // Проверяем основную группу
    if (section.routeName === routeName) {
      return section.routeName
    }
    
    // Проверяем прямые дочерние элементы
    if (section.list && Array.isArray(section.list)) {
      for (let item of section.list) {
        if (item.routeName === routeName) {
          return section.routeName
        }
      }
    }
    
    // Рекурсивно проверяем children
    if (section.children && Array.isArray(section.children)) {
      const found = findParentInChildren(routeName, section.children)
      if (found) {
        return section.routeName
      }
    }
  }
  return null
}

// Рекурсивная функция для поиска в дочерних элементах
const findParentInChildren = (routeName, children) => {
  for (let child of children) {
    if (child.routeName === routeName) {
      return true
    }
    if (child.children && Array.isArray(child.children)) {
      if (findParentInChildren(routeName, child.children)) {
        return true
      }
    }
  }
  return false
}

// Рекурсивная функция для открытия всех вложенных групп в пути к активному элементу
const openNestedGroupsForRoute = (routeName, menuSections) => {
  const findAndOpenNestedGroups = (routeName, children, parentId = '') => {
    for (let i = 0; i < children.length; i++) {
      const child = children[i]
      const childId = `${child.routeName || child.page || child.name}_${parentId ? parentId + '_' : ''}${i}`
      
      if (child.routeName === routeName) {
        // Найден целевой элемент, открываем все родительские группы
        return true
      }
      
      if (child.children && Array.isArray(child.children)) {
        if (findAndOpenNestedGroups(routeName, child.children, childId)) {
          // Открываем текущую группу, так как целевой элемент найден в её дочерних элементах
          nestedOpenStates.value[childId] = true
          return true
        }
      }
    }
    return false
  }
  
  // Проходим по всем секциям
  for (let section of menuSections) {
    if (section.children && Array.isArray(section.children)) {
      findAndOpenNestedGroups(routeName, section.children)
    }
  }
}

watch(
  () => route.matched,
  (newMatched) => {
    if (preventAutoOpen.value) {
      preventAutoOpen.value = false
      return
    }
    
    if (menuSections.value && Array.isArray(menuSections.value)) {
      const currentRouteName = newMatched[0]?.name
      
      // Находим родительскую группу для текущего маршрута
      const parentGroup = findParentGroupByRoute(currentRouteName, menuSections.value)
      
      if (parentGroup) {
        openGroupRouteName.value = parentGroup
        
        // Открываем все необходимые вложенные группы
        openNestedGroupsForRoute(currentRouteName, menuSections.value)
      }
    }
  },
  { immediate: false },
)

onMounted(async()=>{
  let closedpages = await GetClosedPagesForUser()  
  for (let clpage of closedpages)
  {
      let name = router.getRoutes().find(p=> p.path == clpage.path).name
      for(let menusection of menuSections.value){
        if(menusection.routeName == name){
          let index = menuSections.value.indexOf(menusection)
          menuSections.value.splice(index,1)
        }
        else{
        let b = menusection.list
        if(b!= null){
          for(let i=0; i<b.length; i++){
          if(b[i].path == name){
            menusection.list.splice(i,1)
            break
          }
        }
        }
      }
    }
  }
  const checkadm = await CheckAccessToAdminPanel()
  if(!checkadm.access_to_panel)
  {
    let index = menuSections.value.indexOf(AdminPanelMenuSection);
    if (index !== -1) {
      menuSections.value.splice(index, 1);
    }
  }
  else if (!checkadm.access_to_category){
    AdminPanelMenuSection.list.splice(0,1)
  }
  
  // Рассчитываем оптимальную ширину после загрузки данных
  initializeMenuWidth()
}
)

const toggleGroup = (routeName) => {
  if (openGroupRouteName.value === routeName) {
    // Если закрываем группу, устанавливаем флаг для предотвращения автоматического открытия
    preventAutoOpen.value = true
    openGroupRouteName.value = null
  } else {
    openGroupRouteName.value = routeName
  }
}

// Обработчик переключения вложенных групп
const toggleNestedGroup = (groupId) => {
  nestedOpenStates.value[groupId] = !nestedOpenStates.value[groupId]
}

function handleAction(action) {
  if (action === 'openDatasetSidebar') {
    emit('open-datasets')
  }
}

const router = useRouter()

function handleNavigate(item) {
  if (['datasets', 'connections', 'charts'].includes(item.page)) {
    emit('open-sidebar', item.page)
  } else if (item.path) {
    router.push({ name: item.path })
  }
}

function resetCurrentPage() {
  emit('reset-page')  
}

// Список секций меню загружается из JSON конфигурации
const menuSections = ref([...allMenuSections])

const separators = (index) => {
  return getSeparator(index)
}

const hasSeparator = (index) => {
  return shouldShowSeparator(index)
}

const siteName = ref('...')

// Следим за изменениями в меню для пересчета ширины
watch(menuSections, updateMenuWidth, { deep: true })
watch(siteName, updateMenuWidth)

onMounted(async () => {
  try {
    const res = await apiClient.get(endpoints.settings.lastSettings)
    if (res.success) {
      const settings = Array.isArray(res.data) ? res.data[0] : res.data
      siteName.value = settings?.site_name || 'ERGO MS'
    } else {
      siteName.value = 'ERGO MS'
    }
  } catch (error) {
    // Тихо устанавливаем значение по умолчанию без логирования ошибки
    siteName.value = 'ERGO MS'
  }
  
  // Обновляем ширину после загрузки названия сайта
  initializeMenuWidth()
})

</script>

<template>
  <aside
    class="side-menu card p-0"
    :class="{ collapsed: isCollapsed, hovering: isHovering, 'is-hidden': !isVisible }"
    :style="{ '--menu-width': `${menuWidth}px` }"
    @mouseenter="handleMouseEnter"
    @mouseleave="handleMouseLeave"
  >
    <div class="side-menu__header side-header">
      <RouterLink to="/" class="side-menu__logo">
        <div class="side-header__icon">
          <Cog :size="32" />
        </div>
        <div class="side-header__title text-smooth-animation" :class="{ hidden: !isHovering }">
          {{ siteName }}
        </div>
      </RouterLink>
      <div class="side-menu__toggle">
        <button @click="toggleMenu" class="btn btn-primary">
          <ChevronLeft :class="{ rotated: isCollapsed }" :size="20" class="menu-group__chevron" />
        </button>
      </div>
    </div>
    <div class="side-header__shadow" style="display: block"></div>
    <PerfectScrollbar :tag="'ul'" class="side-menu__list p-3" :class="{ short: !isHovering }">
      <li v-for="(section, index) in menuSections" :key="index">
        <!-- Сепаратор перед секцией -->
        <div v-if="hasSeparator(index)" class="side-menu__divider side-divider py-3">
          <div class="side-divider__icon"><Minus :size="20" /></div>
          <div class="side-divider__name text-smooth-animation" :class="{ hidden: !isHovering }">
            {{ separators(index) }}
          </div>
        </div>
        
        <MenuGroup
          :is-hovering="isHovering"
          :is-collapsed="!isCollapsed"
          :is-open="openGroupRouteName === section.routeName"
          :data="section"
          :current-page="props.currentPage"
          :nested-open-states="nestedOpenStates"
          @toggle="toggleGroup(section.routeName)"
          @action="handleAction"
          @navigate="handleNavigate"
          @reset-page="resetCurrentPage"
          @toggle-nested="toggleNestedGroup"
        />
      </li>
    </PerfectScrollbar>
    <MenuToolbar :is-collapsed="isCollapsed" :is-hovering="isHovering" />
  </aside>
  
</template>

<style lang="scss" scoped>
// Меню
.side-menu {
  position: fixed;
  inline-size: var(--menu-width, 260px);
  padding: $padding-external;
  height: 100dvh;

  transform: translateX(0);
  z-index: 1005;

  transition: all $transition;

  &.is-hidden {
    transform: translateX(-110%);
  }

  &.collapsed {
    width: 84px;
  }

  &.hovering {
    width: var(--menu-width, 260px);
  }
}

// Шапка меню
.side-header {
  position: relative;
  padding: 15px 0 15px 26px;

  a {
    @include flex-row-gap($padding-internal, center);
    text-decoration: none;
  }
}

// Тень
.side-header__shadow {
  position: absolute;
  top: 3.3125rem;
  width: 100%;
  height: 2rem;
  background: linear-gradient(var(--bs-card-bg) 41%, rgba(255, 255, 255, 0));
  pointer-events: none;
  z-index: 2;

  transition: background $transition;
}

// Иконка логотипа
.side-header__icon {
  width: 32px;
  height: 32px;
  color: var(--color-primary-text);
}

// Заголовок
.side-header__title {
  flex-grow: 1;

  color: var(--color-primary-text);
  font-size: $font-size-h1;
  font-weight: bold;
  white-space: nowrap;
  text-overflow: ellipsis;
  user-select: none;

  overflow: hidden;
}

// Кнопка переключения
.side-menu__toggle {
  position: absolute;
  top: 50%;
  right: 0;

  transform: translate(50%, -50%);
  cursor: pointer;

  border: 6px solid var(--bs-body-bg);
  border-radius: 50%;
  transition: border 0.5s ease;

  button {
    @include flex-row-gap(0, center, center);

    border-radius: 50%;
    height: 26px;
    width: 26px;
    padding: 0;
  }
}

// Анимация иконки
.menu-group__chevron {
  transition: transform 0.3s ease;

  &.rotated {
    transform: rotate(180deg);
  }
}

// Список меню
.side-menu__list {
  display: flex;
  flex-direction: column;
  flex: 1 1 auto;

  list-style: none;
  padding: 0;
  margin: 0;

  &.short {
    overflow: hidden;
  }
}

// Разделитель
.side-divider {
  @include flex-row-gap($padding-internal, center);
  padding: $padding-internal $padding-external;
  overflow: hidden;

  &__name,
  &__icon {
    user-select: none;
    color: var(--color-secondary-text);
    white-space: nowrap;
    text-overflow: ellipsis;
  }
}
</style>
