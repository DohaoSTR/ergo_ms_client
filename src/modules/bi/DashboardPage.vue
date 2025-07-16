<template>
    <div class="dashboard-page">
        <div class="body-header border-elements elements-color">
            <div class="header-label-icon">
                <LayoutDashboard />
                <div ref="headerLabelTextRef" 
                     class="header-label-text" 
                     :class="{ 'clickable': pages.length > 1, 'dropdown-open': showPageDropdown }"
                     @click="togglePageDropdown"
                     @mouseenter="handleHeaderHover"
                     @mouseleave="handleHeaderLeave">
                    <h4 class="header-label" :style="{ marginBottom: pages.length > 1 ? '-2px' : '3px' }">{{ dashboardName }}</h4>
                    <div v-if="pages.length > 1" 
                         class="header-label-pages" 
                         :class="{ 'flipping': isFlipping }"
                         style="color: var(--color-secondary-text); font-size: 14px;">
                        <span class="text-content">{{ displayText }}</span>
                    </div>
                    
                    <!-- Выпадающее меню страниц -->
                    <div v-if="showPageDropdown && pages.length > 1" 
                         class="page-dropdown"
                         :style="{ width: dropdownWidth + 'px' }">
                        <div v-for="(page, index) in pages" 
                             :key="index" 
                             class="page-dropdown-item"
                             :class="{ 'active': index === currentPageIndex }"
                             @click="selectPage(index, $event)">
                            {{ page.name }}
                        </div>
                    </div>
                </div>
                <button class="btn btn-sm fw-bold btn-dashboard-action" style="padding: 0; margin: 0; display: flex;" hidden>
                    <Ellipsis size="20" />
                </button>
            </div>
            
            <div class="header-label-buttons">
                <button class="btn btn-sm btn-secondary" @click="isPageWindowVisible = true">Страницы</button>
                <button class="btn btn-sm btn-primary" :disabled="!dashboardRequiredFieldsFilled || !isDashboardDirty"
                    @click="isSaveModalVisible = true">{{ isEditMode ? 'Сохранить изменения' : 'Создать дашборд' }}
                </button>
            </div>
        </div>
        
        <!-- Модальное окно управления страницами -->
        <PageWindow 
            v-if="isPageWindowVisible"
            v-model="pages"
            @close="isPageWindowVisible = false"
        />
        
        <div class="body-content" :class="{ 'drag-over': isDragOver }" @dragover="handleDragOver" @drop="handleDrop" @dragenter="handleDragEnter" @dragleave="handleDragLeave">
            <div v-if="dashboardItems.length === 0" class="empty-dashboard">
                <div class="empty-icon">
                    <LayoutDashboard :size="64" />
                </div>
                <h3 class="empty-title">{{ emptyTitleText }}</h3>
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
import { ref, computed, onMounted, onUnmounted, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { LayoutDashboard, Ellipsis } from 'lucide-vue-next'
import DashboardToolbar from './components/DashboardComponents/DashboardToolbar.vue'
import PageWindow from './components/DashboardComponents/PageWindow.vue'

// Импорт состояния сайдбаров
import { isDatasetSidebarOpen } from '@/modules/bi/js/useSidebarStore.js'
import { isSidebarCollapsed, initializeSidebarTracking } from '@/modules/bi/js/useMainSidebarStore.js'

// Реактивные переменные
const dashboardName = ref('Новый дашборд')
const isSaveModalVisible = ref(false)
const isEditMode = ref(false)
const dashboardItems = ref([])
const isDragOver = ref(false)
const isPageWindowVisible = ref(false)
const pages = ref([{ name: 'Страница 1' }])
const currentPageIndex = ref(0)
const showPageDropdown = ref(false)
const headerHoverText = ref('')
const isFlipping = ref(false)
const headerLabelTextRef = ref(null)
const dropdownWidth = ref(200)
const route = useRoute()
const router = useRouter()

// Вычисляемые свойства
const dashboardRequiredFieldsFilled = computed(() => {
    return dashboardName.value.trim().length > 0
})

const isDashboardDirty = computed(() => {
    // TODO: Добавить логику проверки изменений
    return true
})

const currentPageName = computed(() => {
    return pages.value[currentPageIndex.value]?.name || 'Страница 1'
})

const displayText = computed(() => {
    if (showPageDropdown.value) {
        return 'Сменить страницу'
    }
    return headerHoverText.value || currentPageName.value
})

const emptyTitleText = computed(() => {
    if (pages.value.length > 1) {
        return 'На этой странице дашборда пока пусто'
    }
    return 'Дашборд пока пустой'
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

// Методы для работы со страницами
const togglePageDropdown = () => {
    if (pages.value.length > 1) {
        showPageDropdown.value = !showPageDropdown.value
        if (showPageDropdown.value && headerLabelTextRef.value) {
            // Вычисляем ширину header-label-text
            dropdownWidth.value = headerLabelTextRef.value.offsetWidth
        }
        console.log('Dropdown toggled:', showPageDropdown.value, 'Pages:', pages.value.length)
    }
}

const handleHeaderHover = () => {
    if (pages.value.length > 1) {
        isFlipping.value = true
        setTimeout(() => {
            headerHoverText.value = 'Сменить страницу'
            isFlipping.value = false
        }, 150)
    }
}

const handleHeaderLeave = () => {
    if (pages.value.length > 1) {
        isFlipping.value = true
        setTimeout(() => {
            headerHoverText.value = ''
            isFlipping.value = false
        }, 150)
    }
}

const selectPage = (index, event) => {
    event.stopPropagation() // Останавливаем всплытие события
    currentPageIndex.value = index
    showPageDropdown.value = false
}

const updateUrlForPage = (pageIndex) => {
    if (pages.value.length > 1) {
        const newQuery = { ...route.query, tab: pageIndex.toString() }
        router.replace({ query: newQuery })
    } else {
        // Если страница только одна или нет страниц, убираем параметр tab из URL
        const newQuery = { ...route.query }
        delete newQuery.tab
        router.replace({ query: newQuery })
    }
}

const initializePageFromUrl = () => {
    const tabParam = route.query.tab
    if (tabParam && pages.value.length > 1) {
        const pageIndex = parseInt(tabParam)
        if (pageIndex >= 0 && pageIndex < pages.value.length) {
            currentPageIndex.value = pageIndex
        } else {
            // Если индекс страницы некорректный, переключаемся на первую страницу
            currentPageIndex.value = 0
            updateUrlForPage(0)
        }
    } else if (pages.value.length === 0) {
        // Если нет страниц, убираем параметр tab из URL
        const newQuery = { ...route.query }
        delete newQuery.tab
        router.replace({ query: newQuery })
    }
}

const handleClickOutside = (event) => {
    const headerLabelText = event.target.closest('.header-label-text')
    const pageDropdown = event.target.closest('.page-dropdown')
    
    if (!headerLabelText && !pageDropdown) {
        showPageDropdown.value = false
    }
}

// Инициализация отслеживания состояния сайдбара
let cleanupSidebarTracking = null

onMounted(() => {
    cleanupSidebarTracking = initializeSidebarTracking()
    
    // Добавляем обработчик клика вне выпадающего списка
    document.addEventListener('click', handleClickOutside)
    
    // Инициализируем текущую страницу из URL
    initializePageFromUrl()
})

// Следим за изменениями количества страниц и обновляем URL
watch(() => pages.value.length, (newLength) => {
    if (newLength === 0) {
        // Если нет страниц, убираем параметр tab из URL
        const newQuery = { ...route.query }
        delete newQuery.tab
        router.replace({ query: newQuery })
    } else if (newLength === 1) {
        // Если осталась только одна страница, убираем параметр tab из URL
        const newQuery = { ...route.query }
        delete newQuery.tab
        router.replace({ query: newQuery })
    } else if (newLength > 1) {
        // Если стало больше одной страницы, добавляем параметр tab
        if (currentPageIndex.value >= newLength) {
            // Если текущая страница больше не существует, переключаемся на последнюю
            currentPageIndex.value = newLength - 1
        }
        updateUrlForPage(currentPageIndex.value)
    }
})

// Следим за изменениями текущей страницы и обновляем URL
watch(currentPageIndex, (newIndex) => {
    if (pages.value.length > 1) {
        updateUrlForPage(newIndex)
    }
})

onUnmounted(() => {
    if (cleanupSidebarTracking) {
        cleanupSidebarTracking()
    }
    
    // Удаляем обработчик клика вне выпадающего списка
    document.removeEventListener('click', handleClickOutside)
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
    padding: 15px 15px;
    flex-shrink: 0;
    position: relative;
}

.header-label-icon {
    display: flex;
    justify-content: flex-start;
    gap: 10px;
    align-items: center;
    position: relative;
    flex: 1;
}

.header-label-text{
    position: relative;
    overflow: visible; /* Изменено с hidden на visible для отображения dropdown */
    white-space: nowrap;
    text-overflow: ellipsis;
    padding: 5px;
    border-radius: 6px;
    transition: all 0.2s ease;
    
    &.clickable:hover{
        cursor: pointer;
        background-color: var(--color-hover-background);
    }
    
    &.dropdown-open{
        background-color: var(--color-hover-background);
    }
}

.page-dropdown {
    position: absolute;
    top: calc(100% + 2px); /* Минимальный отступ */
    left: 0; /* Выравнивание по левому краю header-label-text */
    background: var(--color-primary-background);
    border: 1px solid var(--color-border);
    border-radius: 8px;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
    z-index: 10000; /* Повышенный z-index для отображения поверх всех элементов */
    min-width: 150px; /* Минимальная ширина */
    animation: dropdownFadeIn 0.2s ease;
}

.page-dropdown-item {
    padding: 10px 16px;
    cursor: pointer;
    color: var(--color-text-primary);
    font-size: 14px;
    transition: background-color 0.2s ease;
    
    &:hover {
        background-color: var(--color-hover-background);
    }
    
    &.active {
        background-color: var(--color-primary);
        color: white;
    }
    
    &:first-child {
        border-radius: 8px 8px 0 0;
    }
    
    &:last-child {
        border-radius: 0 0 8px 8px;
    }
}

.header-label-pages {
    position: relative;
    overflow: hidden;
    height: 20px;
    
    .text-content {
        transition: transform 0.3s ease;
    }
    
    &.flipping .text-content {
        transform: rotateX(90deg);
    }
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
    min-height: calc(100vh - 200px); /* Учитываем высоту хедера и футера */
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

@keyframes dropdownFadeIn {
    from {
        opacity: 0;
        transform: translateY(-10px);
    }
    to {
        opacity: 1;
        transform: translateY(0);
    }
}
</style>