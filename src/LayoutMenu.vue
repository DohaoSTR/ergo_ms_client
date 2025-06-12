<script setup>
import { ref, onMounted, onBeforeUnmount } from 'vue'
import MenuList from '@/components/menu/MenuList.vue'
import TheHeader from '@/components/header/TheHeader.vue'

import DatasetListPage from '@/pages/bi/DatasetListPage.vue'
import ConnectionListPage from '@/pages/bi/ConnectionListPage.vue'
import ChartListPage from '@/pages/bi/ChartListPage.vue'

const leftPadding = ref('280px')
const isMenuVisible = ref(window.innerWidth >= 1200)
const isMenuToggledManually = ref(false)
const isOverlayVisible = ref(false)

const isDatasetSidebarOpen = ref(false)
const currentSidebarPage = ref('datasets')

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

function closeSidebar() {
  isDatasetSidebarOpen.value = false
}

onMounted(() => {
  updateMenuVisibility()
  window.addEventListener('resize', updateMenuVisibility)
})

onBeforeUnmount(() => {
  window.removeEventListener('resize', updateMenuVisibility)
})

function openSidebarFromMenu(pageName) {
  openSidebarWithPage(pageName)
}
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

  <div id="datasetSidebar" class="offcanvas offcanvas-start" :class="{ show: isDatasetSidebarOpen }" :style="{ visibility: isDatasetSidebarOpen ? 'visible' : 'hidden', width: '768px', left: '260px' }" tabindex="-1">
    <div class="offcanvas-header">
      <h5 class="offcanvas-title">
        {{
          currentSidebarPage === 'datasets'
            ? 'Датасеты'
            : currentSidebarPage === 'connections'
              ? 'Подключения'
              : currentSidebarPage === 'charts'
                ? 'Чарты'
                : 'Раздел'
        }}
      </h5>
      <button type="button" class="btn-close btn-close" @click="closeSidebar" aria-label="Закрыть" />
    </div>
    <div class="offcanvas-body p-0" style="overflow-y: hidden;">
      <component
        :is="{
          datasets: DatasetListPage,
          connections: ConnectionListPage,
          charts: ChartListPage
        }[currentSidebarPage] || null"
      />
    </div>
  </div>
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
