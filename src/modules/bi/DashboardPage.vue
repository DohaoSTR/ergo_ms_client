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
        <div class="body-content" 
             :class="{ 'drag-over': isDragOver }"
             @dragover="handleDragOver" 
             @drop="handleDrop"
             @dragenter="handleDragEnter"
             @dragleave="handleDragLeave">
            <div v-if="dashboardItems.length === 0" class="empty-dashboard">
                <div class="empty-icon">
                    <LayoutDashboard :size="64" />
                </div>
                <h3 class="empty-title">Дашборд пока пустой</h3>
                <p class="empty-description">
                    Перетаскивайте блоки с панели снизу, чтобы добавить на дашборд чарт, селектор или поясняющий текст
                </p>
            </div>
            <div v-else class="dashboard-items">
                <!-- Здесь будут отображаться добавленные элементы -->
                <div v-for="(item, index) in dashboardItems" :key="index" class="dashboard-item">
                    {{ item.type }} - {{ item.id }}
                </div>
            </div>
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
const dashboardItems = ref([])
const isDragOver = ref(false)

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

// Обработчики перетаскивания
const handleDragStart = (event, itemType) => {
    event.dataTransfer.setData('text/plain', itemType)
    event.dataTransfer.effectAllowed = 'copy'
}

const handleDragOver = (event) => {
    event.preventDefault()
    event.dataTransfer.dropEffect = 'copy'
    isDragOver.value = true
}

const handleDragEnter = (event) => {
    event.preventDefault()
    isDragOver.value = true
}

const handleDragLeave = (event) => {
    // Проверяем, что курсор действительно покинул область
    if (!event.currentTarget.contains(event.relatedTarget)) {
        isDragOver.value = false
    }
}

const handleDrop = (event) => {
    event.preventDefault()
    isDragOver.value = false
    
    const itemType = event.dataTransfer.getData('text/plain')
    if (itemType) {
        const newItem = {
            id: Date.now(),
            type: itemType,
            position: { x: event.offsetX, y: event.offsetY }
        }
        dashboardItems.value.push(newItem)
    }
}

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

.body-content {
    flex: 1;
    padding: 20px;
    position: relative;
    transition: background-color 0.2s ease;
    
    &.drag-over {
        background-color: rgba(var(--color-primary-rgb), 0.05);
    }
}

.empty-dashboard {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    height: 100%;
    text-align: center;
    color: var(--color-text-secondary);
}

.empty-icon {
    margin-bottom: 20px;
    opacity: 0.6;
}

.empty-title {
    font-size: 1.5rem;
    font-weight: 600;
    margin-bottom: 10px;
    color: var(--color-text-primary);
}

.empty-description {
    font-size: 1rem;
    line-height: 1.5;
    max-width: 400px;
    margin: 0 auto;
}

.dashboard-items {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
    gap: 20px;
    padding: 20px 0;
}

.dashboard-item {
    background: var(--color-primary-background);
    border: 2px solid var(--color-border);
    border-radius: 8px;
    padding: 20px;
    min-height: 200px;
    display: flex;
    align-items: center;
    justify-content: center;
    font-weight: 500;
    color: var(--color-text-primary);
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
}

.footer-buttons{
    border: 2.5px solid var(--color-border);
    border-radius: 6px;
    box-shadow: 0 -2px 10px rgba(0, 0, 0, 0.1);
}

.border-elements {
    border-radius: 8px;
}

.elements-color {
    background-color: var(--color-primary-background);
}
</style>