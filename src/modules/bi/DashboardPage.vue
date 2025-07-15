<template>
    <div class="dashboard-page">
        <div class="body-header border-elements elements-color">
            <div class="header-label-icon">
                <LayoutDashboard />
                <div style="overflow: hidden; white-space: nowrap; text-overflow: ellipsis;">
                    <h4 class="header-label" style="margin-bottom: 3px;">{{ dashboardName }}</h4>
                </div>
                <button class="btn btn-sm fw-bold btn-dashboard-action" style="padding: 0; margin: 0; display: flex;"
                    hidden>
                    <Ellipsis size="20" />
                </button>
            </div>
            <div class="header-label-buttons">
                <button class="btn btn-sm btn-primary" :disabled="!dashboardRequiredFieldsFilled || !isDashboardDirty"
                    @click="isSaveModalVisible = true">{{ isEditMode ? 'Сохранить изменения' : 'Создать дашборд' }}</button>
            </div>
        </div>
        <div class="body-content">

        </div>
        <div class="body-footer" :style="{ left: footerLeftOffset, width: footerWidth }">
            <div class="footer-buttons">
                <DashboardToolbar />
            </div>
        </div>
    </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { LayoutDashboard, Ellipsis } from 'lucide-vue-next'
import DashboardToolbar from './components/DashboardComponents/DashboardToolbar.vue'

// Импорт состояния сайдбаров
import { isDatasetSidebarOpen } from '@/modules/bi/js/useSidebarStore.js'
import { isSidebarCollapsed, initializeSidebarTracking } from '@/modules/bi/js/useMainSidebarStore.js'

// Реактивные переменные
const dashboardName = ref('Новый дашборд')
const isSaveModalVisible = ref(false)
const isEditMode = ref(false)

// Вычисляемые свойства
const dashboardRequiredFieldsFilled = computed(() => {
    return dashboardName.value.trim().length > 0
})

const isDashboardDirty = computed(() => {
    // TODO: Добавить логику проверки изменений
    return true
})

// Вычисляем отступ для футера в зависимости от состояния сайдбаров
const footerLeftOffset = computed(() => {
    const mainSidebarWidth = isSidebarCollapsed.value ? 120 : 260
    const biSidebarWidth = isDatasetSidebarOpen.value ? 768 : 0
    return `${mainSidebarWidth + biSidebarWidth}px`
})

const footerWidth = computed(() => {
    const mainSidebarWidth = isSidebarCollapsed.value ? 120 : 260
    const biSidebarWidth = isDatasetSidebarOpen.value ? 768 : 0
    return `calc(100% - ${mainSidebarWidth + biSidebarWidth}px)`
})

// Инициализация отслеживания состояния сайдбара
let cleanupSidebarTracking = null

onMounted(() => {
    cleanupSidebarTracking = initializeSidebarTracking()
})

onUnmounted(() => {
    if (cleanupSidebarTracking) {
        cleanupSidebarTracking()
    }
})
</script>

<style scoped lang="scss">
.dashboard-page {
    display: flex;
    flex-direction: column;
    justify-content: space-between;
    min-height: 100vh;
    padding-bottom: 80px; /* Отступ для закрепленного футера */
}

.body-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 15px 20px;
    flex-shrink: 0;
}

.header-label-icon {
    display: flex;
    justify-content: center;
    gap: 15px;
    align-items: center;
}

.header-label-buttons {
    display: flex;
    gap: 15px;
}

.body-footer{
    position: fixed;
    bottom: 0;
    right: 0;
    display: flex;
    justify-content: center;
    align-items: center;
    padding: 10px;
    z-index: 1000;
    box-shadow: 0 -2px 10px rgba(0, 0, 0, 0.1);
}

.footer-buttons{
    border: 2.5px solid var(--color-border);
    border-radius: 6px;
}

.border-elements {
    border-radius: 8px;
}

.elements-color {
    background-color: var(--color-primary-background);
}
</style>