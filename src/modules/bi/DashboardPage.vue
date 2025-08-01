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

        <div v-if="isHeaderSettingsVisible" class="page-window-overlay" @click="closeHeaderSettings">
          <div class="page-window" @click.stop>
            <HeaderSettings 
              :data="headerSettingsData" 
              @close="closeHeaderSettings"
              @save="saveHeaderSettings" 
            />
          </div>
        </div>

        <div v-if="isTextSettingsVisible" class="page-window-overlay" @click="closeTextSettings">
          <div class="page-window" @click.stop>
            <TextSettings 
              :data="textSettingsData" 
              @close="closeTextSettings"
              @save="saveTextSettings" 
            />
          </div>
        </div>

        <div v-if="isChartSettingsVisible" class="page-window-overlay" @click="closeChartSettings">
          <div class="page-window chart-settings-window" @click.stop>
            <ChartSettings 
              :data="chartSettingsData" 
              @close="closeChartSettings"
              @save="saveChartSettings" 
            />
          </div>
        </div>
        
        <div v-if="isSelectorSettingsVisible" class="page-window-overlay" @click="closeSelectorSettings">
          <div class="page-window selector-settings-window" @click.stop>
            <SelectorSettings 
              :data="selectorSettingsData" 
              @close="closeSelectorSettings"
              @save="saveSelectorSettings" 
            />
          </div>
        </div>
        
        <div class="body-content">
            <DashboardGrid
                ref="dashboardGridRef"
                :items="currentPageItems"
                :dragged-type="draggedType"
                :pages-count="pages.length"
                @update:items="updateCurrentPageItems"
                @item-select="handleItemSelect"
                @item-edit="handleItemEdit"
                @item-delete="handleItemDelete"
            />
        </div>
        
        <div class="body-footer" :style="{ left: footerLeftOffset, width: footerWidth }">
            <div class="footer-buttons">
                <DashboardToolbar 
                    @drag-start="handleToolbarDragStart"
                    @drag-end="handleToolbarDragEnd"
                />
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
import HeaderSettings from './components/DashboardComponents/HeaderSettings.vue'
import TextSettings from './components/DashboardComponents/TextSettings.vue'
import ChartSettings from './components/DashboardComponents/ChartSettings.vue'
import SelectorSettings from './components/DashboardComponents/SelectorSettings.vue'

import { isDatasetSidebarOpen } from '@/modules/bi/js/useSidebarStore.js'
import { isSidebarCollapsed, initializeSidebarTracking } from '@/modules/bi/js/useMainSidebarStore.js'

const HEADER_WIDGET_HEIGHTS = {
  'XS': 50,
  'S': 55,
  'M': 60,
  'L': 65,
  'XL': 70
};

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

const isHeaderSettingsVisible = ref(false)
const headerSettingsData = ref(null)
const isTextSettingsVisible = ref(false)
const textSettingsData = ref(null)
const isChartSettingsVisible = ref(false)
const chartSettingsData = ref(null)
const isSelectorSettingsVisible = ref(false)
const selectorSettingsData = ref(null)
const dashboardGridRef = ref(null)

const handleToolbarDragStart = (itemType) => {
            draggedType.value = itemType
}

const handleToolbarDragEnd = () => {
    draggedType.value = ''
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
  if (item.type === 'Заголовок') {
    headerSettingsData.value = { ...item }
    isHeaderSettingsVisible.value = true
  } else if (item.type === 'Текст') {
    textSettingsData.value = { ...item }
    isTextSettingsVisible.value = true
  } else if (item.type === 'Чарт') {
    chartSettingsData.value = { ...item }
    isChartSettingsVisible.value = true
  } else if (item.type === 'Селектор') {
    selectorSettingsData.value = { ...item }
    isSelectorSettingsVisible.value = true
  }
}

const handleItemDelete = (item) => {
}

const saveHeaderSettings = (updatedSettings) => {
  const itemIndex = currentPageItems.value.findIndex(item => item.id === updatedSettings.id);
  if (itemIndex !== -1) {
    const oldItem = currentPageItems.value[itemIndex];
    const oldHeight = oldItem.height;
    
    if (updatedSettings.type === 'Заголовок') {
      if (updatedSettings.autoHeight) {
        updatedSettings.height = 'auto';
      } else if (updatedSettings.size) {
        updatedSettings.height = HEADER_WIDGET_HEIGHTS[updatedSettings.size] || 50;
      }
    }
    
    const newItems = [...currentPageItems.value];
    newItems[itemIndex] = updatedSettings;
    updateCurrentPageItems(newItems);
    
    const heightChanged = oldHeight !== updatedSettings.height;
    if (heightChanged && dashboardGridRef.value) {
      setTimeout(() => {
        dashboardGridRef.value.triggerRecalculatePositions();
      }, 50);
    }
  }
  closeHeaderSettings();
};

function closeHeaderSettings() {
  isHeaderSettingsVisible.value = false
  headerSettingsData.value = null
}

function closeTextSettings() {
  isTextSettingsVisible.value = false
  textSettingsData.value = null
}

function closeChartSettings() {
  isChartSettingsVisible.value = false
  chartSettingsData.value = null
}

function closeSelectorSettings() {
  isSelectorSettingsVisible.value = false
  selectorSettingsData.value = null
}

const saveTextSettings = (updatedSettings) => {
  const itemIndex = currentPageItems.value.findIndex(item => item.id === updatedSettings.id);
  if (itemIndex !== -1) {
    const oldItem = currentPageItems.value[itemIndex];
    const oldHeight = oldItem.height;
    
    if (updatedSettings.type === 'Текст') {
      if (updatedSettings.autoHeight) {
        updatedSettings.height = 'auto';
      } else {
        updatedSettings.height = 150;
      }
    }
    
    const newItems = [...currentPageItems.value];
    newItems[itemIndex] = updatedSettings;
    updateCurrentPageItems(newItems);
    
    const heightChanged = oldHeight !== updatedSettings.height;
    if (heightChanged && dashboardGridRef.value) {
      setTimeout(() => {
        dashboardGridRef.value.triggerRecalculatePositions();
      }, 50);
    }
  }
  closeTextSettings();
};

const saveChartSettings = (updatedSettings) => {
  const itemIndex = currentPageItems.value.findIndex(item => item.id === updatedSettings.id);
  if (itemIndex !== -1) {
    const oldItem = currentPageItems.value[itemIndex];
    const oldHeight = oldItem.height;
    
    if (updatedSettings.type === 'Чарт') {
      if (updatedSettings.autoHeight) {
        updatedSettings.height = 'auto';
      } else {
        updatedSettings.height = 300;
      }
    }
    
    const newItems = [...currentPageItems.value];
    newItems[itemIndex] = {
      ...updatedSettings,
      title: updatedSettings.title,
      selectedChart: updatedSettings.selectedChart,
      description: updatedSettings.description,
      showDescription: updatedSettings.showDescription,
      hint: updatedSettings.hint,
      hintText: updatedSettings.hintText,
      autoHeight: updatedSettings.autoHeight,
      filtering: updatedSettings.filtering,
      chartsList: updatedSettings.chartsList,
      activeChartIndex: updatedSettings.activeChartIndex || 0
    };
    updateCurrentPageItems(newItems);
    
    const heightChanged = oldHeight !== updatedSettings.height;
    if (heightChanged && dashboardGridRef.value) {
      setTimeout(() => {
        dashboardGridRef.value.triggerRecalculatePositions();
      }, 50);
    }
  }
  closeChartSettings();
};

const saveSelectorSettings = (updatedSettings) => {
  const itemIndex = currentPageItems.value.findIndex(item => item.id === updatedSettings.id);
  if (itemIndex !== -1) {
    const oldItem = currentPageItems.value[itemIndex];
    const oldHeight = oldItem.height;
    
    if (updatedSettings.type === 'Селектор') {
      if (updatedSettings.autoHeight) {
        updatedSettings.height = 'auto';
      } else {
        updatedSettings.height = 50;
      }
    }
    
    const newItems = [...currentPageItems.value];
    newItems[itemIndex] = {
      ...updatedSettings,
      title: updatedSettings.title,
      titlePosition: updatedSettings.titlePosition,
      showInternalTitle: updatedSettings.showInternalTitle,
      internalTitle: updatedSettings.internalTitle,
      showColorAccent: updatedSettings.showColorAccent,
      showHint: updatedSettings.showHint,
      hintText: updatedSettings.hintText,
      sourceType: updatedSettings.sourceType,
      selectedDataset: updatedSettings.selectedDataset,
      selectedDatasetId: updatedSettings.selectedDatasetId,
      selectedField: updatedSettings.selectedField,
      selectorType: updatedSettings.selectorType,
      operation: updatedSettings.operation,
      multipleSelection: updatedSettings.multipleSelection,
      defaultValue: updatedSettings.defaultValue,
      required: updatedSettings.required,
      selectorsList: updatedSettings.selectorsList,
      activeSelectorIndex: updatedSettings.activeSelectorIndex || 0
    };
    updateCurrentPageItems(newItems);
    
    const heightChanged = oldHeight !== updatedSettings.height;
    if (heightChanged && dashboardGridRef.value) {
      setTimeout(() => {
        dashboardGridRef.value.triggerRecalculatePositions();
      }, 50);
    }
  }
  closeSelectorSettings();
};

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

watch(currentPageItems, (items, oldItems) => {
  if (items.length > oldItems.length) {
    const newItem = items[items.length - 1]
    if (newItem.type === 'Заголовок') {
      headerSettingsData.value = { ...newItem }
      isHeaderSettingsVisible.value = true
    } else if (newItem.type === 'Текст') {
      textSettingsData.value = { ...newItem }
      isTextSettingsVisible.value = true
    } else if (newItem.type === 'Чарт') {
      chartSettingsData.value = { ...newItem }
      isChartSettingsVisible.value = true
    } else if (newItem.type === 'Селектор') {
      selectorSettingsData.value = { ...newItem }
      isSelectorSettingsVisible.value = true
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
    padding-top: 20px;
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

.page-window-overlay {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background-color: rgba(0, 0, 0, 0.5);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 10000;
}

.page-window {
    background: var(--color-primary-background);
    border-radius: 12px;
    
    &.chart-settings-window {
        max-width: 90vw;
        max-height: 90vh;
        width: 960px;
        height: 470px;
    }
    
    &.selector-settings-window {
        max-width: 90vw;
        max-height: 90vh;
        width: 870px;
        height: 640px;
    }
    box-shadow: 0 10px 30px rgba(0, 0, 0, 0.3);
    width: 600px;
    min-height: 445px;
    display: flex;
    flex-direction: column;
    overflow: visible;
}

.chart-settings-window {
    width: 965px;
    height: 550px;
    min-height: 550px;
    max-height: 550px;
}
</style>