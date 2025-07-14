<!--
  ОСНОВНОЙ LAYOUT КОМПОНЕНТ С БОКОВЫМ МЕНЮ
  
  Данный компонент представляет собой основную структуру приложения ERGO MS,
  включающую боковое меню, шапку и основную область контента.
  
  Функциональность:
  - Адаптивное боковое меню с возможностью сворачивания/разворачивания
  - Автоматическое скрытие меню на мобильных устройствах (<1200px)
  - Overlay для закрытия меню на мобильных устройствах
  - Боковая панель (offcanvas) для BI модуля с поддержкой датасетов, подключений и чартов
  - Динамическое изменение отступов основного контента в зависимости от состояния меню
  - Интеграция с системой маршрутизации Vue Router
  
  Состояния меню:
  - isMenuVisible: видимость меню (учитывает размер экрана и ручное управление)
  - isMenuToggledManually: флаг ручного управления меню пользователем
  - isOverlayVisible: показ затемняющего overlay на мобильных устройствах
  - leftPadding: динамический отступ для основного контента
-->

<script setup>
import { ref, onMounted, onBeforeUnmount } from 'vue'
import { isDatasetSidebarOpen, currentSidebarPage } from '@/modules/bi/js/useSidebarStore'
import { useUserStore } from '@/modules/cms/js/userStore.js'
import MenuList from '@/components/menu/MenuList.vue'
import TheHeader from '@/components/header/TheHeader.vue'

import StorageSidebar from '@/modules/bi/components/StorageSidebar.vue'

const userStore = useUserStore()
const leftPadding = ref('280px')
const isMenuVisible = ref(window.innerWidth >= 1200)
const isMenuToggledManually = ref(false)
const isOverlayVisible = ref(false)

function updateMenuVisibility() {
  if (window.innerWidth >= 1200) {
    isMenuVisible.value = true
    isOverlayVisible.value = false
    isMenuToggledManually.value = false
  } else if (!isMenuToggledManually.value) {
    isMenuVisible.value = false
    isOverlayVisible.value = false
  }
}

function toggleMenu(isVisible) {
  isMenuToggledManually.value = true
  isMenuVisible.value = isVisible
  isOverlayVisible.value = isVisible && window.innerWidth < 1200
}

function closeMenu() {
  isMenuVisible.value = false
  isOverlayVisible.value = false
  isMenuToggledManually.value = false
}

function leftToggle(val) {
  leftPadding.value = val
}

function openSidebarWithPage(pageName) {
  currentSidebarPage.value = pageName
  isDatasetSidebarOpen.value = true
}

function openSidebarFromMenu(page) {
  openSidebarWithPage(page)
}

function closeSidebar() {
  isDatasetSidebarOpen.value = false
  currentSidebarPage.value = ''
}

onMounted(async () => {
  updateMenuVisibility()
  window.addEventListener('resize', updateMenuVisibility)
  
  // Инициализируем пользователя при загрузке авторизованной области
  await userStore.initializeUser()
})

onBeforeUnmount(() => {
  window.removeEventListener('resize', updateMenuVisibility)
})
</script>

<template>
  <div class="layout-container">
    <MenuList
      :current-page="currentSidebarPage"
      @left-padding="leftToggle"
      :is-visible="isMenuVisible"
      @open-sidebar="openSidebarFromMenu"
      @reset-page="() => currentSidebarPage = ''"
    />
    <div class="layout-page" :style="{ paddingLeft: leftPadding }">
      <div class="pt-4 container-xxl">
        <TheHeader @toggleMenu="toggleMenu" />
      </div>
      <div class="py-4 container-xxl">
        <RouterView :key="$route.path" />
      </div>
    </div>
  </div>

  <div @click="closeMenu" class="layout-overlay" :class="{ active: isOverlayVisible }" />
  <StorageSidebar :isDatasetSidebarOpen="isDatasetSidebarOpen" :currentPage="currentSidebarPage" @close="closeSidebar"/>
</template>

<style scoped lang="scss">
.layout-page {
  padding-inline-start: v-bind(leftPadding);
  transition: padding-inline-start 0.3s ease;
}
.layout-overlay {
  z-index: 1004;
}
@media (width < 1200px) {
  .layout-page {
    padding-inline-start: 0;
  }
}
</style>
