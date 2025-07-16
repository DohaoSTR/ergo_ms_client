<script setup>
import { computed } from 'vue'
import DatasetListPage from '@/modules/bi/DatasetListPage.vue'
import ConnectionListPage from '@/modules/bi/ConnectionListPage.vue'
import ChartListPage from '@/modules/bi/ChartListPage.vue'
import DashboardListPage from '@/modules/bi/DashboardListPage.vue'

defineProps({
  isDatasetSidebarOpen: Boolean,
  currentPage:          String
})

const emit = defineEmits(['close'])

const titleMap = {
  datasets: 'Датасеты',
  connections: 'Подключения',
  charts: 'Чарты',
  dashboards: 'Дашборды'
}

const title = computed(() => titleMap[props.currentPage] || '')
</script>

<template>
  <div
    class="offcanvas offcanvas-start"
    :class="{ show: isDatasetSidebarOpen }"
    :style="{ visibility: isDatasetSidebarOpen ? 'visible' : 'hidden', width: '768px', left: '260px' }"
    tabindex="-1"
  >
    <div class="offcanvas-header">
      <h5 class="offcanvas-title">
        {{ currentPage === 'datasets' ? 'Датасеты'
            : currentPage === 'connections' ? 'Подключения'
            : currentPage === 'charts' ? 'Чарты'
            : currentPage === 'dashboards' ? 'Дашборды'
            : '' }}
      </h5>
      <button type="button" class="btn-close" @click="$emit('close')" aria-label="Закрыть" />
    </div>

    <div class="offcanvas-body p-0" style="overflow-y: hidden;">
      <component
        :is="{
          datasets:    DatasetListPage,
          connections: ConnectionListPage,
          charts:      ChartListPage,
          dashboards:  DashboardListPage
        }[ currentPage ]"
      />
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