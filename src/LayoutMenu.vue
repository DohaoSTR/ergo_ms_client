<script setup>
import { ref, onMounted, onBeforeUnmount } from 'vue'
import { isDatasetSidebarOpen, currentSidebarPage } from '@/js/bi/useSidebarStore'
import MenuList from '@/components/menu/MenuList.vue'
import TheHeader from '@/components/header/TheHeader.vue'

import StorageSidebar from '@/pages/bi/components/StorageSidebar.vue'

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

function openSidebarWithPage(page) {
  currentSidebarPage.value   = page
  isDatasetSidebarOpen.value = true
}

function openSidebarFromMenu(page) {
  openSidebarWithPage(page)
}

function closeSidebar() {
  isDatasetSidebarOpen.value = false
  currentSidebarPage.value   = ''
}

onMounted(() => {
  updateMenuVisibility()
  window.addEventListener('resize', updateMenuVisibility)
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
