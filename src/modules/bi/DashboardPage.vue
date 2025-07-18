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
            </div>
            
            <div class="header-label-buttons">
                <button class="btn btn-sm btn-secondary" @click="isPageWindowVisible = true">Страницы</button>
                <button class="btn btn-sm btn-primary" :disabled="!dashboardRequiredFieldsFilled || !isDashboardDirty"
                    @click="isSaveModalVisible = true">{{ isEditMode ? 'Сохранить изменения' : 'Создать дашборд' }}
                </button>
            </div>
        </div>
        
        <PageWindow 
            v-if="isPageWindowVisible"
            v-model="pages"
            @close="isPageWindowVisible = false"
        />
        
        <div class="body-content">
            <DashboardGrid
                :items="currentPageItems"
                :dragged-type="draggedType"
                @update:items="updateCurrentPageItems"
                @item-select="handleItemSelect"
                @item-edit="handleItemEdit"
                @item-delete="handleItemDelete"
            />
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
import { LayoutDashboard } from 'lucide-vue-next'
import DashboardToolbar from './components/DashboardComponents/DashboardToolbar.vue'
import PageWindow from './components/DashboardComponents/PageWindow.vue'
import DashboardGrid from './components/DashboardComponents/DashboardGrid.vue'

import { isDatasetSidebarOpen } from '@/modules/bi/js/useSidebarStore.js'
import { isSidebarCollapsed, initializeSidebarTracking } from '@/modules/bi/js/useMainSidebarStore.js'

const dashboardName = ref('Новый дашборд')
const isSaveModalVisible = ref(false)
const isEditMode = ref(false)
const dashboardItems = ref({})
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
const draggedType = ref('')

const handleGlobalDragStart = (event) => {
    if (event.target.closest('.dashboard-toolbar .button')) {
        const button = event.target.closest('.button')
        const itemType = button.querySelector('.button-text')?.textContent?.trim()
        if (itemType && ['Чарт', 'Селектор', 'Текст', 'Заголовок'].includes(itemType)) {
            draggedType.value = itemType
            console.log('Drag started with type:', itemType)
            
            event.dataTransfer.setData('text/plain', itemType)
            event.dataTransfer.effectAllowed = 'copy'
        }
    }
}

const handleGlobalDragEnd = () => {
    console.log('Drag ended, clearing type:', draggedType.value)
    draggedType.value = ''
}

const handleGlobalMouseMove = (event) => {
    if (draggedType.value) {
        const dashboardGrid = document.querySelector('.dashboard-grid')
        if (dashboardGrid) {
            const gridRect = dashboardGrid.getBoundingClientRect()
            const isOverGrid = event.clientX >= gridRect.left && 
                              event.clientX <= gridRect.right && 
                              event.clientY >= gridRect.top && 
                              event.clientY <= gridRect.bottom
            
            if (isOverGrid) {
                console.log('Mouse over grid with dragged type:', draggedType.value)
            }
        }
    }
}

const dashboardRequiredFieldsFilled = computed(() => {
    return dashboardName.value.trim().length > 0
})

const isDashboardDirty = computed(() => {
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

const currentPageItems = computed(() => {
    return dashboardItems.value[currentPageIndex.value] || []
})

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

const updateCurrentPageItems = (newItems) => {
    dashboardItems.value[currentPageIndex.value] = newItems
}

const handleItemSelect = (item) => {
}

const handleItemEdit = (item) => {
}

const handleItemDelete = (item) => {
}

const togglePageDropdown = () => {
    if (pages.value.length > 1) {
        showPageDropdown.value = !showPageDropdown.value
        if (showPageDropdown.value && headerLabelTextRef.value) {
            dropdownWidth.value = headerLabelTextRef.value.offsetWidth
        }
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
    event.stopPropagation()
    currentPageIndex.value = index
    showPageDropdown.value = false
}

const updateUrlForPage = (pageIndex) => {
    if (pages.value.length > 1) {
        const newQuery = { ...route.query, tab: pageIndex.toString() }
        router.replace({ query: newQuery })
    } else {
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
            currentPageIndex.value = 0
            updateUrlForPage(0)
        }
    } else if (pages.value.length === 0) {
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

let cleanupSidebarTracking = null

onMounted(() => {
    cleanupSidebarTracking = initializeSidebarTracking()
    document.addEventListener('click', handleClickOutside)
    document.addEventListener('dragstart', handleGlobalDragStart)
    document.addEventListener('dragend', handleGlobalDragEnd)
    document.addEventListener('mousemove', handleGlobalMouseMove)
    initializePageFromUrl()
    
    if (!dashboardItems.value[0]) {
        dashboardItems.value[0] = []
    }
})

watch(() => pages.value.length, (newLength, oldLength) => {
    if (newLength === 0) {
        const newQuery = { ...route.query }
        delete newQuery.tab
        router.replace({ query: newQuery })
    } else if (newLength === 1) {
        const newQuery = { ...route.query }
        delete newQuery.tab
        router.replace({ query: newQuery })
    } else if (newLength > 1) {
        if (currentPageIndex.value >= newLength) {
            currentPageIndex.value = newLength - 1
        }
        updateUrlForPage(currentPageIndex.value)
    }
    
    if (newLength > oldLength) {
        const newPageIndex = newLength - 1
        if (!dashboardItems.value[newPageIndex]) {
            dashboardItems.value[newPageIndex] = []
        }
    } else if (newLength < oldLength) {
        const deletedPageIndex = oldLength - 1
        if (dashboardItems.value[deletedPageIndex]) {
            delete dashboardItems.value[deletedPageIndex]
        }
        
        if (currentPageIndex.value >= newLength) {
            currentPageIndex.value = newLength - 1
        }
    }
})

watch(currentPageIndex, (newIndex) => {
    if (pages.value.length > 1) {
        updateUrlForPage(newIndex)
    }
})

onUnmounted(() => {
    if (cleanupSidebarTracking) {
        cleanupSidebarTracking()
    }
    document.removeEventListener('click', handleClickOutside)
    document.removeEventListener('dragstart', handleGlobalDragStart)
    document.removeEventListener('dragend', handleGlobalDragEnd)
    document.removeEventListener('mousemove', handleGlobalMouseMove)
})
</script>

<style scoped lang="scss">
.dashboard-page {
    display: flex;
    flex-direction: column;
    justify-content: space-between;
    min-height: 100vh;
    padding-bottom: 80px;
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
    overflow: visible;
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
    top: calc(100% + 2px);
    left: 0;
    background: var(--color-primary-background);
    border: 1px solid var(--color-border);
    border-radius: 8px;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
    z-index: 10000;
    min-width: 150px;
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
    position: relative;
    overflow: hidden;
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