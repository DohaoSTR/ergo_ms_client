<script setup>
import { computed } from 'vue'
import { isDatasetSidebarOpen } from '@/js/bi/useSidebarStore'
import DatasetListPage from '@/pages/bi/DatasetListPage.vue'
import ConnectionListPage from '@/pages/bi/ConnectionListPage.vue'
import ChartListPage from '@/pages/bi/ChartListPage.vue'

const props = defineProps({
  currentPage: String
})

const emit = defineEmits(['close'])

const titleMap = {
  datasets: 'Датасеты',
  connections: 'Подключения',
  charts: 'Чарты'
}

const title = computed(() => titleMap[props.currentPage] || 'Раздел')
</script>

<template>
  <div class="storage-sidebar" :class="{ show: isDatasetSidebarOpen }" :style="{ visibility: isDatasetSidebarOpen ? 'visible' : 'hidden' }">
    <div class="header d-flex justify-content-between align-items-center p-3">
      <h5 class="m-0">{{ title }}</h5>
      <button class="btn-close" @click="isDatasetSidebarOpen = false" />
    </div>
    <div class="body p-3">
      <DatasetListPage v-if="currentPage === 'datasets'" />
      <ConnectionListPage v-else-if="currentPage === 'connections'" />
      <ChartListPage v-else-if="currentPage === 'charts'" />
    </div>
  </div>
</template>

<style scoped lang="scss">
.banner-wrapper {
  height: 260px;
  border-radius: 10px;
  background-image: linear-gradient(to right, rgba(0, 0, 0, 0.75), rgba(0, 0, 0, 0.35), rgba(0, 0, 0, 0)), url('/src/assets/carousel/photo-3.png');
  background-size: cover;
  background-position: center;
  display: flex;
  align-items: center;
  box-shadow: 0 8px 20px rgba(0, 0, 0, 0.4);
  overflow: hidden;
}

.banner-content {
  color: var(--color-primary-background);
  padding-left: 30px;
  max-width: 560px;
}

.card-section {
  padding: 20px;
  display: flex;
  flex-direction: column;
  background-color: var(--color-primary-background);
  border-radius: 15px;
}

.storage-sidebar {
  position: fixed;
  top: 0;
  left: 260px;
  width: 768px;
  height: 100vh;
  background-color: var(--color-primary-background);
  z-index: 1050;
  box-shadow: 0 0 20px rgba(0, 0, 0, 0.4);
  transform: translateX(-100%);
  transition: transform 0.3s ease-in-out;

  &.show {
    transform: translateX(0);
  }

  display: flex;
  flex-direction: column;
}

.header {
  flex: 0 0 auto;
}

.body {
  flex: 1 1 auto;
  overflow-y: auto;
  min-height: 0;
}
</style>