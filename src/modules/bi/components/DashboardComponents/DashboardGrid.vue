<template>
  <div 
    class="dashboard-grid" 
    @dragover="handleDragOver"
    @drop="handleDrop"
    @dragenter="handleDragEnter" 
    @dragleave="handleDragLeave"
    @mousemove="handleMouseMove"
    ref="gridContainer"
  >
    <div v-if="items.length === 0" class="empty-grid" :class="{ 'drag-over': isDragOver }">
      <div class="empty-content">
        <LayoutDashboard :size="48" />
        <h3>{{ pagesCount > 1 ? 'На этой странице пока пусто' : 'Дашборд пока пустой' }}</h3>
        <p>Перетаскивайте блоки с панели снизу, чтобы добавить на дашборд чарт, селектор или поясняющий текст</p>
      </div>
    </div>

    <div v-else class="grid-container">
      <div
        v-for="item in items"
        :key="item.id"
        class="grid-item"
        :class="getItemClass(item)"
        :style="getItemStyle(item)"
        :data-item-id="item.id"
        @click="selectItem(item)"
        @dblclick="editItem(item)"
        @mousedown="handleMouseDown(item, $event)"
      >
        <div class="item-header">
          <span class="item-type">{{ item.type }}</span>
          <div class="item-actions">
            <button class="btn-edit" @click.stop="editItem(item)">
              <Settings2 :size="16" />
            </button>
            <button class="btn-delete" @click.stop="deleteItem(item)">
              <X :size="16" />
            </button>
          </div>
        </div>
        <div class="item-content">
          <div v-if="item.type === 'Заголовок'" class="header-widget-title" :style="getHeaderStyle(item)">
            <span>{{ item.title || 'Заголовок' }}</span>
            <div v-if="item.hint" class="hint-icon-wrapper" @mouseenter="showHint(item, $event)" @mouseleave="hideHint">
              <CircleHelp :size="16" />
            </div>
          </div>
          <div v-else-if="item.type === 'Текст'" class="text-widget-content" v-html="item.content || 'Текстовое содержимое'">
          </div>
          <div v-else-if="item.type === 'Чарт'" class="chart-widget-container">
            <ChartWidget 
              :charts-list="item.chartsList || []"
              :active-chart-index="item.activeChartIndex || 0"
              @update:active-chart-index="updateActiveChart(item, $event)"
            />
          </div>
          <div v-else class="item-preview">
            {{ getItemPreview(item) }}
          </div>
        </div>
        
        <div v-if="item.selected" class="resize-indicators">
          <div class="resize-indicator resize-left" @mousedown.stop="startResize(item, 'w', $event)"></div>
          <div class="resize-indicator resize-right" @mousedown.stop="startResize(item, 'e', $event)"></div>
          <div class="resize-indicator resize-bottom" @mousedown.stop="startResize(item, 's', $event)"></div>
        </div>
      </div>
    </div>

    <Teleport to="body">
      <div v-if="showGrayPlaceholder && grayPlaceholderStyle" class="gray-placeholder" :style="grayPlaceholderStyle"></div>
    </Teleport>
    
    <div v-if="showYellowPlaceholder && yellowPlaceholderStyle" class="yellow-placeholder" :style="yellowPlaceholderStyle">
      <div class="placeholder-content">
        <span>Разместить здесь</span>
      </div>
    </div>

    <Teleport to="body">
      <div v-if="isDraggingExisting && draggedItem && draggedElementCursorPosition" 
           :style="{
             position: 'fixed',
             left: `${draggedElementCursorPosition.x - draggedElementCursorOffset.x}px`,
             top: `${draggedElementCursorPosition.y - draggedElementCursorOffset.y}px`,
             width: `${draggedItem.width || ELEMENT_SIZES[draggedItem.type]?.width || 200}px`,
             height: `${draggedItem.height || ELEMENT_SIZES[draggedItem.type]?.height || 150}px`,
             zIndex: 2000,
             pointerEvents: 'none',
             opacity: 0.85,
             boxShadow: '0 8px 20px rgba(0,0,0,0.25)',
             border: '2px solid var(--color-primary)',
             borderRadius: '8px',
             background: 'var(--color-primary-background)'
           }"
           class="dragged-element-preview">
        <div class="item-header">
          <span class="item-type">{{ draggedItem.type }}</span>
        </div>
        <div class="item-content">
          <div class="item-preview">{{ getItemPreview(draggedItem) }}</div>
        </div>
      </div>
    </Teleport>

    <Teleport to="body">
      <div v-if="hintVisible"
           class="hint-tooltip" 
           :style="hintTooltipStyle"
           @mouseenter="cancelHideHint"
           @mouseleave="hideHint">
        <div v-html="hintContent" class="hint-content"></div>
      </div>
    </Teleport>
  </div>
</template>

<script setup>
import { ref, computed, watch, nextTick, onMounted, onUnmounted } from 'vue'
import { Teleport } from 'vue'
import { Settings2, X, LayoutDashboard, CircleHelp } from 'lucide-vue-next'
import ChartWidget from './ChartWidget.vue'

const ELEMENT_SIZES = {
  'Чарт': { width: 560, height: 300 },
  'Селектор': { width: 370, height: 50 },
  'Текст': { width: 560, height: 150 },
  'Заголовок': { width: MAX_PAGE_WIDTH - GRID_PADDING * 2 - 4, height: 50 }
}

const GRID_GAP = 10
const GRID_PADDING = 10
const MAX_PAGE_WIDTH = 1320

const props = defineProps({
  items: {
    type: Array,
    default: () => []
  },
  draggedType: {
    type: String,
    default: ''
  },
  pagesCount: {
    type: Number,
    default: 1
  }
})

const emit = defineEmits([
  'update:items',
  'item-select',
  'item-edit', 
  'item-delete'
])

const gridContainer = ref(null)
const localItems = ref([])
const isDragOver = ref(false)
const showGrayPlaceholder = ref(false)
const showYellowPlaceholder = ref(false)
const grayPlaceholderPosition = ref({ x: 0, y: 0 })
const yellowPlaceholderPosition = ref({ x: 0, y: 0, width: 0, height: 0 })
const currentDraggedType = ref('')
const draggedItem = ref(null)
const dragOffset = ref({ x: 0, y: 0 })
const isDraggingExisting = ref(false)
const resizingItem = ref(null)
const resizeStartPos = ref({ x: 0, y: 0 })
const resizeStartSize = ref({ width: 0, height: 0 })
const resizeDirection = ref('')
const draggedElementCursorOffset = ref({ x: 0, y: 0 })
const draggedElementCursorPosition = ref({ x: 0, y: 0 })
const isMouseDown = ref(false)
const hintVisible = ref(false)
const hintContent = ref('')
const hintTooltipStyle = ref({})
let hideHintTimer = null
const resizeObserver = ref(null)
const autoHeightItems = ref(new Map())
const isRecalculatingPositions = ref(false)

const grayPlaceholderStyle = computed(() => {
  if (!showGrayPlaceholder.value || !currentDraggedType.value) return null
  
  const size = ELEMENT_SIZES[currentDraggedType.value]
  if (!size) return null
  
  return {
    position: 'fixed',
    left: `${grayPlaceholderPosition.value.x - size.width / 2}px`,
    top: `${grayPlaceholderPosition.value.y - size.height / 2}px`,
    width: `${size.width}px`,
    height: `${size.height}px`,
    pointerEvents: 'none',
    zIndex: 9999
  }
})

const yellowPlaceholderStyle = computed(() => {
  if (!showYellowPlaceholder.value) return null
  
  return {
    position: 'absolute',
    left: `${yellowPlaceholderPosition.value.x}px`,
    top: `${yellowPlaceholderPosition.value.y}px`,
    width: `${yellowPlaceholderPosition.value.width}px`,
    height: `${yellowPlaceholderPosition.value.height}px`,
    pointerEvents: 'none'
  }
})

const shiftedItemsStyle = computed(() => {
  if (!showYellowPlaceholder.value || isDraggingExisting.value) {
    return {}
  }
  
  const placeholderX = yellowPlaceholderPosition.value.x
  const placeholderY = yellowPlaceholderPosition.value.y
  const placeholderWidth = yellowPlaceholderPosition.value.width
  const placeholderHeight = yellowPlaceholderPosition.value.height
  
  const styles = {}
  
  localItems.value.forEach(item => {
    const itemX = item.x || 0
    const itemY = item.y || 0
    const itemWidth = item.width || ELEMENT_SIZES[item.type]?.width || 200
    const itemHeight = item.height || ELEMENT_SIZES[item.type]?.height || 150
    
    const itemBottom = itemY + itemHeight
    const placeholderBottom = placeholderY + placeholderHeight
    
    if (itemY >= placeholderY) {
      const shiftAmount = placeholderHeight + GRID_GAP
      styles[item.id] = {
        transform: `translateY(${shiftAmount}px)`,
        transition: 'transform 0.2s ease'
      }
    }
    else if (itemY < placeholderY && itemBottom > placeholderY) {
      const shiftAmount = placeholderY + placeholderHeight - itemY + GRID_GAP
      styles[item.id] = {
        transform: `translateY(${shiftAmount}px)`,
        transition: 'transform 0.2s ease'
      }
    }
  })
  
  return styles
})

const getItemClass = (item) => {
  return {
    [`item-${item.type.toLowerCase()}`]: true,
    'item-selected': item.selected,
    'item-dragging': draggedItem.value && draggedItem.value.id === item.id,
    'item-hidden-drag': isDraggingExisting.value && draggedItem.value && draggedItem.value.id === item.id,
    'item-auto-height': item.autoHeight && item.height === 'auto'
  }
}

const getItemStyle = (item) => {
  const baseStyle = {
    position: 'absolute',
    left: `${item.x || 0}px`,
    top: `${item.y || 0}px`,
    width: `${item.width || ELEMENT_SIZES[item.type]?.width || 200}px`,
    height: item.height === 'auto' ? 'auto' : `${item.height || ELEMENT_SIZES[item.type]?.height || 150}px`
  };

  if (item.background) {
    baseStyle.background = item.background;
  }
  
  if (draggedItem.value && draggedItem.value.id === item.id) {
    baseStyle.zIndex = 1000;
    baseStyle.opacity = 0.8;
  }
  
  const shiftStyle = shiftedItemsStyle.value[item.id]
  if (shiftStyle) {
    Object.assign(baseStyle, shiftStyle)
  }
  
  return baseStyle
}

const getItemPreview = (item) => {
  const itemWidth = item.width || ELEMENT_SIZES[item.type]?.width || 200
  const itemHeight = item.height || ELEMENT_SIZES[item.type]?.height || 150
  
  let preview = ''
  switch (item.type) {
    case 'Чарт': 
      preview = itemWidth < 300 ? '📊 График' : '📊 График данных'
      break
    case 'Селектор': 
      preview = itemWidth < 200 ? '🔽' : '🔽 Фильтр'
      break
    case 'Текст': 
      preview = itemWidth < 300 ? '📝 Текст' : '📝 Поясняющий текст'
      break
    case 'Заголовок': 
      preview = itemWidth < 400 ? '📋 Заголовок' : '📋 Заголовок раздела'
      break
    default: 
      preview = item.type
  }
  
  return preview
}

const showHint = (item, event) => {
  if (hideHintTimer) {
    clearTimeout(hideHintTimer);
    hideHintTimer = null;
  }
  if (item.hintText) {
    hintContent.value = item.hintText; 
    const rect = event.target.getBoundingClientRect();
    hintTooltipStyle.value = {
      display: 'flex',
      textAlign: 'center',
      justifyContent: 'center',
      alignItems: 'center',
      marginBottom: '0',
      top: `${rect.bottom + 5}px`,
      left: `${rect.left}px`,
    };
    hintVisible.value = true;
  }
};

const hideHint = () => {
  hideHintTimer = setTimeout(() => {
    hintVisible.value = false;
  }, 200);
};

const cancelHideHint = () => {
  if (hideHintTimer) {
    clearTimeout(hideHintTimer);
    hideHintTimer = null;
  }
};

const getHeaderStyle = (item) => {
  if (item.type !== 'Заголовок' || !item.size) {
    return {};
  }

  const style = {};
  switch (item.size) {
    case 'XS':
      style.fontSize = '16px';
      break;
    case 'S':
      style.fontSize = '20px';
      break;
    case 'M':
      style.fontSize = '24px';
      break;
    case 'L':
      style.fontSize = '28px';
      break;
    case 'XL':
      style.fontSize = '32px';
      break;
  }
  return style;
};

const selectItem = (item) => {
  if (draggedItem.value || isDraggingExisting.value || isMouseDown.value) return
  
  localItems.value.forEach(i => i.selected = false)
  item.selected = true
  emit('item-select', item)
  emit('update:items', localItems.value)
}

const editItem = (item) => {
  emit('item-edit', item)
}

const deleteItem = (item) => {
  const index = localItems.value.findIndex(i => i.id === item.id)
  if (index !== -1) {
    localItems.value.splice(index, 1)
    emit('update:items', localItems.value)
    emit('item-delete', item)
  }
}

const updateActiveChart = (item, newIndex) => {
  item.activeChartIndex = newIndex
  emit('update:items', localItems.value)
}

const calculateDropPosition = (mouseX, mouseY, elementType) => {
  if (!gridContainer.value) return { x: 0, y: 0 }
  
  const rect = gridContainer.value.getBoundingClientRect()
  const relativeX = mouseX - rect.left
  const relativeY = mouseY - rect.top
  
  const elementSize = ELEMENT_SIZES[elementType]
  if (!elementSize) return { x: 0, y: 0 }
  
  if (localItems.value.length === 0) {
    const gridWidth = Math.min(gridContainer.value.clientWidth, MAX_PAGE_WIDTH - GRID_PADDING)
    const initialX = Math.max(0, relativeX - elementSize.width / 2)
    
    if (initialX + elementSize.width > gridWidth) {
      return {
        x: Math.max(0, (gridWidth - elementSize.width) / 2),
        y: 0
      }
    }
    
    return {
      x: initialX,
      y: 0
    }
  }
  
  const gridWidth = Math.min(gridContainer.value.clientWidth, MAX_PAGE_WIDTH)
  const snapX = Math.max(0, Math.min(gridWidth - elementSize.width, relativeX - elementSize.width / 2))
  
  const nearestRow = findNearestRow(relativeY, elementSize.height)
  const snappedPosition = findNearestValidPositionInRow(snapX, nearestRow, elementSize.width, elementSize.height)
  
  return snappedPosition
}

const findNearestRow = (mouseY, elementHeight) => {
  if (localItems.value.length === 0) return 0
  
  const occupiedAreas = localItems.value.map(item => {
    const actualSize = getActualItemSize(item)
    return {
      top: item.y || 0,
      bottom: (item.y || 0) + actualSize.height
    }
  })
  
  const rows = []
  
  for (const area of occupiedAreas) {
    const rowTop = area.top
    const rowBottom = area.bottom + GRID_GAP
    
    if (!rows.some(row => Math.abs(row.top - rowTop) < 10)) {
      rows.push({ top: rowTop, bottom: rowBottom })
    }
  }
  
  rows.sort((a, b) => a.top - b.top)
  
  let nearestRow = 0
  let minDistance = Infinity
  
  for (const row of rows) {
    const distance = Math.abs(mouseY - (row.top + row.bottom) / 2)
    if (distance < minDistance) {
      minDistance = distance
      nearestRow = row.top
    }
  }
  
  return nearestRow
}

const findNearestValidPositionInRow = (x, rowY, width, height, excludeItemId) => {
  const gridWidth = gridContainer.value ? 
    Math.min(gridContainer.value.clientWidth, MAX_PAGE_WIDTH) : 
    MAX_PAGE_WIDTH
  
  x = Math.max(0, Math.min(gridWidth - width, x))
  
  const rowItems = localItems.value
    .filter(item => {
      if (excludeItemId && item.id === excludeItemId) return false
      const itemY = item.y || 0
      const actualSize = getActualItemSize(item)
      return Math.abs(itemY - rowY) < 10
    })
    .map(item => {
      const actualSize = getActualItemSize(item)
      return {
        left: item.x || 0,
        right: (item.x || 0) + actualSize.width
      }
    })
    .sort((a, b) => a.left - b.left)
  
  if (rowItems.length === 0) {
    if (x + width > gridWidth) {
      return { x: 0, y: rowY + height + GRID_GAP }
    }
    return { x, y: rowY }
  }
  
  const newArea = { left: x, right: x + width }
  
  for (const item of rowItems) {
    if (newArea.left < item.right + GRID_GAP && newArea.right > item.left - GRID_GAP) {
      const nextX = item.right + GRID_GAP
      if (nextX + width > gridWidth) {
        return { x: 0, y: rowY + height + GRID_GAP }
      }
      return { x: nextX, y: rowY }
    }
  }
  
  if (x + width > gridWidth) {
    return { x: 0, y: rowY + height + GRID_GAP }
  }
  
  return { x, y: rowY }
}

const calculatePotentialPlacement = (mouseX, mouseY, elementType) => {
  if (!gridContainer.value) return { x: 0, y: 0 }
  
  const rect = gridContainer.value.getBoundingClientRect()
  const relativeX = mouseX - rect.left
  const relativeY = mouseY - rect.top
  
  const elementSize = ELEMENT_SIZES[elementType]
  if (!elementSize) return { x: 0, y: 0 }
  
  const gridWidth = Math.min(gridContainer.value.clientWidth, MAX_PAGE_WIDTH)
  
  if (localItems.value.length === 0) {
    const snapX = Math.max(0, Math.min(gridWidth - elementSize.width, relativeX - elementSize.width / 2))
    return { x: snapX, y: 0 }
  }
  
  let nearestItem = null
  let minDistance = Infinity
  
  for (const item of localItems.value) {
    const actualSize = getActualItemSize(item)
    const itemCenterX = (item.x || 0) + actualSize.width / 2
    const itemCenterY = (item.y || 0) + actualSize.height / 2
    
    const distance = Math.sqrt(
      Math.pow(relativeX - itemCenterX, 2) + Math.pow(relativeY - itemCenterY, 2)
    )
    
    if (distance < minDistance) {
      minDistance = distance
      nearestItem = item
    }
  }
  
  if (!nearestItem) {
    return { x: 0, y: 0 }
  }
  
  const nearestItemActualSize = getActualItemSize(nearestItem)
  const nearestItemWidth = nearestItemActualSize.width
  const nearestItemHeight = nearestItemActualSize.height
  const nearestItemX = nearestItem.x || 0
  const nearestItemY = nearestItem.y || 0
  
  const rightOfNearest = nearestItemX + nearestItemWidth + GRID_GAP
  const canFitRight = rightOfNearest + elementSize.width <= gridWidth
  
  const mouseIsAbove = relativeY < nearestItemY + nearestItemHeight / 2
  const mouseIsLeft = relativeX < nearestItemX + nearestItemWidth / 2

  if (mouseIsAbove) {
    if (nearestItemX + elementSize.width <= gridWidth) {
      return { x: nearestItemX, y: Math.max(0, nearestItemY - elementSize.height - GRID_GAP) }
    }
    
    const centerX = Math.max(0, (gridWidth - elementSize.width) / 2)
    return { x: centerX, y: Math.max(0, nearestItemY - elementSize.height - GRID_GAP) }
  }
  
  if (mouseIsLeft && nearestItemX >= elementSize.width + GRID_GAP) {
    const leftPosition = Math.max(0, nearestItemX - elementSize.width - GRID_GAP)
    if (leftPosition + elementSize.width <= gridWidth) {
      return { x: leftPosition, y: nearestItemY }
    }
  }
  
  if (canFitRight) {
    return { x: rightOfNearest, y: nearestItemY }
  }
  
  const belowNearest = nearestItemY + nearestItemHeight + GRID_GAP
  
  let leftMostX = nearestItemX
  
  for (const item of localItems.value) {
    const itemY = item.y || 0
    const itemX = item.x || 0
    
    if (Math.abs(itemY - nearestItemY) < 10) {
      if (itemX < leftMostX) {
        leftMostX = itemX
      }
    }
  }
  
  if (leftMostX + elementSize.width <= gridWidth) {
    return { x: leftMostX, y: belowNearest }
  }
  
  const centerX = Math.max(0, (gridWidth - elementSize.width) / 2)
  return { x: centerX, y: belowNearest }
}

const calculateFinalPlacement = (elementType) => {
  if (!yellowPlaceholderPosition.value || !elementType) {
    return { x: 0, y: 0 }
  }
  
  const placeholderX = yellowPlaceholderPosition.value.x
  const placeholderY = yellowPlaceholderPosition.value.y
  const elementSize = ELEMENT_SIZES[elementType]
  
  if (!elementSize) return { x: 0, y: 0 }
  
  const elementsToShift = []
  
  localItems.value.forEach(item => {
    const itemY = item.y || 0
    const actualSize = getActualItemSize(item)
    const itemHeight = actualSize.height
    
    if (itemY >= placeholderY) {
      elementsToShift.push(item)
    }
    else if (itemY < placeholderY && itemY + itemHeight > placeholderY) {
      elementsToShift.push(item)
    }
  })
  
  elementsToShift.forEach(item => {
    const itemY = item.y || 0
    const actualSize = getActualItemSize(item)
    const itemHeight = actualSize.height
    
    if (itemY >= placeholderY) {
      item.y = itemY + elementSize.height + GRID_GAP
    } else {
      item.y = placeholderY + elementSize.height + GRID_GAP
    }
  })
  
  return { x: placeholderX, y: placeholderY }
}

const checkCollision = (x, y, width, height, excludeItemId) => {
  const occupiedAreas = localItems.value
    .filter(item => !excludeItemId || item.id !== excludeItemId)
    .map(item => {
      const actualSize = getActualItemSize(item)
      return {
        left: item.x || 0,
        top: item.y || 0,
        right: (item.x || 0) + actualSize.width,
        bottom: (item.y || 0) + actualSize.height
      }
    })
  
  const newArea = {
    left: x,
    top: y,
    right: x + width,
    bottom: y + height
  }
  
  return occupiedAreas.some(area => 
    newArea.left < area.right + GRID_GAP &&
    newArea.right > area.left - GRID_GAP &&
    newArea.top < area.bottom + GRID_GAP &&
    newArea.bottom > area.top - GRID_GAP
  )
}

const handleMouseDown = (item, event) => {
  if (event.button !== 0) return
  
  isMouseDown.value = true
  
  const startX = event.clientX
  const startY = event.clientY
  
  const handleMouseMove = (moveEvent) => {
    const deltaX = Math.abs(moveEvent.clientX - startX)
    const deltaY = Math.abs(moveEvent.clientY - startY)
    
    if (deltaX > 5 || deltaY > 5) {
      document.removeEventListener('mousemove', handleMouseMove)
      document.removeEventListener('mouseup', handleMouseUp)
      
      startDrag(item, moveEvent)
    }
  }
  
  const handleMouseUp = () => {
    isMouseDown.value = false
    document.removeEventListener('mousemove', handleMouseMove)
    document.removeEventListener('mouseup', handleMouseUp)
  }
  
  document.addEventListener('mousemove', handleMouseMove)
  document.addEventListener('mouseup', handleMouseUp)
}

const startDrag = (item, event) => {
  event.preventDefault()
  draggedItem.value = item
  isDraggingExisting.value = true

  const rect = gridContainer.value.getBoundingClientRect()
  const itemWidth = item.width || ELEMENT_SIZES[item.type]?.width || 200
  const itemHeight = item.height || ELEMENT_SIZES[item.type]?.height || 150
  draggedElementCursorOffset.value = {
    x: itemWidth / 2,
    y: itemHeight / 2
  }
  draggedElementCursorPosition.value = {
    x: event.clientX,
    y: event.clientY
  }
  dragOffset.value = {
    x: event.clientX - rect.left - (item.x || 0),
    y: event.clientY - rect.top - (item.y || 0)
  }
  document.addEventListener('mousemove', handleExistingItemDrag)
  document.addEventListener('mouseup', stopDrag)
}

const handleExistingItemDrag = (event) => {
  if (!draggedItem.value || !gridContainer.value) return
  draggedElementCursorPosition.value = {
    x: event.clientX,
    y: event.clientY
  }
  const rect = gridContainer.value.getBoundingClientRect()
  const mouseX = event.clientX - rect.left
  const mouseY = event.clientY - rect.top
  const actualSize = getActualItemSize(draggedItem.value)
  const itemWidth = actualSize.width
  const itemHeight = actualSize.height
  const gridWidth = Math.min(gridContainer.value.clientWidth, MAX_PAGE_WIDTH)
  const snapX = Math.max(0, Math.min(gridWidth - itemWidth, mouseX - itemWidth / 2))
  let snapY = 0
  if (localItems.value.length > 1) {
    let nearestItem = null
    let minDistance = Infinity
    for (const item of localItems.value) {
      if (item.id === draggedItem.value.id) continue
      const itemActualSize = getActualItemSize(item)
      const itemCenterX = (item.x || 0) + itemActualSize.width / 2
      const itemCenterY = (item.y || 0) + itemActualSize.height / 2
      const distance = Math.sqrt(
        Math.pow(mouseX - itemCenterX, 2) + Math.pow(mouseY - itemCenterY, 2)
      )
      if (distance < minDistance) {
        minDistance = distance
        nearestItem = item
      }
    }
    if (nearestItem) {
      const nearestItemActualSize = getActualItemSize(nearestItem)
      const nearestItemHeight = nearestItemActualSize.height
      const nearestItemY = nearestItem.y || 0
      const mouseIsAbove = mouseY < nearestItemY + nearestItemHeight / 2
      if (mouseIsAbove) {
        const topPosition = nearestItemY - itemHeight - GRID_GAP
        snapY = topPosition >= 0 ? topPosition : nearestItemY
      } else {
        snapY = nearestItemY + nearestItemHeight + GRID_GAP
      }
    }
  } else {
    snapY = 0
  }
  yellowPlaceholderPosition.value = {
    x: snapX,
    y: snapY,
    width: itemWidth,
    height: itemHeight
  }
  showYellowPlaceholder.value = true
}

const stopDrag = () => {
  if (draggedItem.value && isDraggingExisting.value) {
    if (showYellowPlaceholder.value && yellowPlaceholderPosition.value) {
      const newX = yellowPlaceholderPosition.value.x;
      const newY = yellowPlaceholderPosition.value.y;
      draggedItem.value.x = newX;
      draggedItem.value.y = newY;
      const sorted = [...localItems.value].sort((a, b) => a.y - b.y);
      let currentY = 0;
      for (let i = 0; i < sorted.length; i++) {
        sorted[i].y = currentY;
        const actualSize = getActualItemSize(sorted[i]);
        currentY += actualSize.height + GRID_GAP;
      }
      localItems.value = sorted;
    }
    emit('update:items', localItems.value)
  }
  draggedItem.value = null
  isDraggingExisting.value = false
  isMouseDown.value = false
  showYellowPlaceholder.value = false
  draggedElementCursorPosition.value = { x: 0, y: 0 }
  document.removeEventListener('mousemove', handleExistingItemDrag)
  document.removeEventListener('mouseup', stopDrag)
}

const startResize = (item, direction, event) => {
  event.preventDefault()
  event.stopPropagation()
  
  resizingItem.value = item
  resizeDirection.value = direction
  resizeStartPos.value = { x: event.clientX, y: event.clientY }
  resizeStartSize.value = { 
    width: item.width || ELEMENT_SIZES[item.type]?.width || 200,
    height: item.height || ELEMENT_SIZES[item.type]?.height || 150
  }
  
  document.addEventListener('mousemove', handleResize)
  document.addEventListener('mouseup', stopResize)
}

const handleResize = (event) => {
  if (!resizingItem.value) return
  
  const deltaX = event.clientX - resizeStartPos.value.x
  const deltaY = event.clientY - resizeStartPos.value.y
  
  let newWidth = resizeStartSize.value.width
  let newHeight = resizeStartSize.value.height
  let newX = resizingItem.value.x || 0
  let newY = resizingItem.value.y || 0
  
  const gridWidth = gridContainer.value ? 
    Math.min(gridContainer.value.clientWidth, MAX_PAGE_WIDTH) : 
    MAX_PAGE_WIDTH
  
  if (resizeDirection.value === 'e') {
    newWidth = Math.max(100, resizeStartSize.value.width + deltaX)
    if (newX + newWidth > gridWidth - GRID_PADDING * 2) {
      newWidth = gridWidth - GRID_PADDING * 2 - newX
    }
  }
  if (resizeDirection.value === 'w') {
    newWidth = Math.max(100, resizeStartSize.value.width - deltaX)
    newX = (resizingItem.value.x || 0) + deltaX
    if (newX < GRID_PADDING) {
      newX = GRID_PADDING
      newWidth = resizeStartSize.value.width + (resizingItem.value.x || 0) - GRID_PADDING
    }
  }
  if (resizeDirection.value === 's') {
    newHeight = Math.max(50, resizeStartSize.value.height + deltaY)
  }
  
  if (!checkCollision(newX, newY, newWidth, newHeight, resizingItem.value.id)) {
    resizingItem.value.width = newWidth
    resizingItem.value.height = newHeight
    resizingItem.value.x = newX
    resizingItem.value.y = newY
  }
}

const stopResize = () => {
  if (resizingItem.value) {
    emit('update:items', localItems.value)
  }
  
  resizingItem.value = null
  resizeDirection.value = ''
  
  document.removeEventListener('mousemove', handleResize)
  document.removeEventListener('mouseup', stopResize)
}

const handleDragEnter = (event) => {
  event.preventDefault()
  isDragOver.value = true
  
  if (props.draggedType && !isDraggingExisting.value) {
    currentDraggedType.value = props.draggedType
    showGrayPlaceholder.value = true
    showYellowPlaceholder.value = true
    
    grayPlaceholderPosition.value = {
      x: event.clientX,
      y: event.clientY
    }
    
    const position = calculatePotentialPlacement(event.clientX, event.clientY, currentDraggedType.value)
    const size = ELEMENT_SIZES[currentDraggedType.value]
    
    yellowPlaceholderPosition.value = {
      x: position.x,
      y: position.y,
      width: size.width,
      height: size.height
    }
  }
}

const handleDragOver = (event) => {
  event.preventDefault()
  event.dataTransfer.dropEffect = 'copy'
  
  if (currentDraggedType.value && !isDraggingExisting.value) {
    grayPlaceholderPosition.value = {
      x: event.clientX,
      y: event.clientY
    }
    
    const position = calculatePotentialPlacement(event.clientX, event.clientY, currentDraggedType.value)
    const size = ELEMENT_SIZES[currentDraggedType.value]
    
    yellowPlaceholderPosition.value = {
      x: position.x,
      y: position.y,
      width: size.width,
      height: size.height
    }
  }
}

const handleDrop = (event) => {
  event.preventDefault()
  
  let itemType = currentDraggedType.value || event.dataTransfer.getData('text/plain')
  
  if (itemType && ELEMENT_SIZES[itemType] && !isDraggingExisting.value) {
    const position = calculateFinalPlacement(itemType)
    const size = ELEMENT_SIZES[itemType]
    
    if (!checkCollision(position.x, position.y, size.width, size.height)) {
      const newItem = {
        id: Date.now() + Math.random(),
        type: itemType,
        selected: false,
        x: position.x,
        y: position.y,
        width: size.width,
        height: size.height
      }
      
      // Добавляем специфичные для чарта поля
      if (itemType === 'Чарт') {
        newItem.chartsList = [
          {
            id: 1,
            title: 'Заголовок 1',
            selectedChart: '',
            selectedChartId: null,
            chartType: 'select',
            chartUrl: '',
            description: '',
            hintText: '',
            showDescription: false,
            hint: false,
            autoHeight: false,
            isFavorite: true
          }
        ]
        newItem.activeChartIndex = 0
      }
      
      localItems.value.push(newItem)
      emit('update:items', localItems.value)
    }
  }
  
  resetDragState()
}

const resetDragState = () => {
  isDragOver.value = false
  showGrayPlaceholder.value = false
  showYellowPlaceholder.value = false
  currentDraggedType.value = ''
  
  grayPlaceholderPosition.value = { x: 0, y: 0 }
  yellowPlaceholderPosition.value = { x: 0, y: 0, width: 0, height: 0 }
}

const getActualItemSize = (item) => {
  const element = document.querySelector(`[data-item-id="${item.id}"]`)
  if (element && item.height === 'auto') {
    const rect = element.getBoundingClientRect()
    return {
      width: item.width || ELEMENT_SIZES[item.type]?.width || 200,
      height: rect.height
    }
  }
  return {
    width: item.width || ELEMENT_SIZES[item.type]?.width || 200,
    height: item.height || ELEMENT_SIZES[item.type]?.height || 150
  }
}

const recalculatePositions = () => {
  if (isRecalculatingPositions.value || localItems.value.length === 0) return
  
  isRecalculatingPositions.value = true
  
  nextTick(() => {
    const sortedItems = [...localItems.value].sort((a, b) => (a.y || 0) - (b.y || 0))
    
    let currentY = 0
    
    for (let i = 0; i < sortedItems.length; i++) {
      const item = sortedItems[i]
      const actualSize = getActualItemSize(item)
      
      item.y = currentY
      
      currentY += actualSize.height + GRID_GAP
    }
    
    emit('update:items', localItems.value)
    isRecalculatingPositions.value = false
  })
}

const handleItemResize = (entries) => {
  let hasChanges = false
  
  for (const entry of entries) {
    const itemId = entry.target.getAttribute('data-item-id')
    const item = localItems.value.find(i => i.id === itemId)
    
    if (item && item.height === 'auto') {
      const newHeight = entry.contentRect.height
      const storedHeight = autoHeightItems.value.get(itemId)
      
      if (storedHeight !== newHeight) {
        autoHeightItems.value.set(itemId, newHeight)
        hasChanges = true
      }
    }
  }
  
  if (hasChanges) {
    recalculatePositions()
  }
}

const setupResizeObserver = (element, item) => {
  if (item.height === 'auto' && resizeObserver.value) {
    element.setAttribute('data-item-id', item.id)
    resizeObserver.value.observe(element)
    
    nextTick(() => {
      const rect = element.getBoundingClientRect()
      autoHeightItems.value.set(item.id, rect.height)
    })
  }
}

const removeResizeObserver = (item) => {
  if (resizeObserver.value) {
    const element = document.querySelector(`[data-item-id="${item.id}"]`)
    if (element) {
      resizeObserver.value.unobserve(element)
    }
    autoHeightItems.value.delete(item.id)
  }
}

const handleMouseMove = (event) => {
  if (showGrayPlaceholder.value && currentDraggedType.value && !isDraggingExisting.value) {
    grayPlaceholderPosition.value = {
      x: event.clientX,
      y: event.clientY
    }
    
    if (gridContainer.value) {
      const rect = gridContainer.value.getBoundingClientRect()
      if (event.clientX >= rect.left && event.clientX <= rect.right && 
          event.clientY >= rect.top && event.clientY <= rect.bottom) {
        const position = calculatePotentialPlacement(event.clientX, event.clientY, currentDraggedType.value)
        const size = ELEMENT_SIZES[currentDraggedType.value]
        
        yellowPlaceholderPosition.value = {
          x: position.x,
          y: position.y,
          width: size.width,
          height: size.height
        }
      }
    }
  } else if (isDraggingExisting.value && draggedItem.value) {
    const rect = gridContainer.value.getBoundingClientRect()
    const newX = event.clientX - rect.left - dragOffset.value.x
    const newY = event.clientY - rect.top - dragOffset.value.y
    
    const gridWidth = Math.min(gridContainer.value.clientWidth, MAX_PAGE_WIDTH)
    const actualSize = getActualItemSize(draggedItem.value)
    const itemWidth = actualSize.width
    const itemHeight = actualSize.height
    
    const clampedX = Math.max(0, Math.min(gridWidth - itemWidth, newX))
    const clampedY = Math.max(0, newY)
    
    if (localItems.value.length === 1) {
      if (!checkCollision(clampedX, draggedItem.value.y, itemWidth, itemHeight, draggedItem.value.id)) {
        draggedItem.value.x = clampedX
      }
    } else {
      if (!checkCollision(clampedX, clampedY, itemWidth, itemHeight, draggedItem.value.id)) {
        draggedItem.value.x = clampedX
        draggedItem.value.y = clampedY
      }
    }
    
    const mouseX = event.clientX - rect.left
    const mouseY = event.clientY - rect.top
    
    const snapX = Math.max(0, Math.min(gridWidth - itemWidth, mouseX))
    
    let snapY = draggedItem.value.y || 0
    
    if (localItems.value.length > 1) {
      let nearestItem = null
      let minDistance = Infinity
      
      for (const item of localItems.value) {
        if (item.id === draggedItem.value.id) continue
        
        const itemActualSize = getActualItemSize(item)
        const itemCenterX = (item.x || 0) + itemActualSize.width / 2
        const itemCenterY = (item.y || 0) + itemActualSize.height / 2
        
        const distance = Math.sqrt(
          Math.pow(mouseX - itemCenterX, 2) + Math.pow(mouseY - itemCenterY, 2)
        )
        
        if (distance < minDistance) {
          minDistance = distance
          nearestItem = item
        }
      }
      
      if (nearestItem) {
        const nearestItemActualSize = getActualItemSize(nearestItem)
        const nearestItemHeight = nearestItemActualSize.height
        const nearestItemY = nearestItem.y || 0
        
        const mouseIsAbove = mouseY < nearestItemY + nearestItemHeight / 2
        
        if (mouseIsAbove) {
          const topPosition = nearestItemY - itemHeight - GRID_GAP
          if (topPosition >= 0) {
            snapY = topPosition
          } else {
            snapY = nearestItemY
          }
        } else {
          snapY = nearestItemY + nearestItemHeight + GRID_GAP
        }
      }
    }
    
    yellowPlaceholderPosition.value = {
      x: snapX,
      y: snapY,
      width: itemWidth,
      height: itemHeight
    }
  }
}

const handleDragLeave = (event) => {
  if (!event.currentTarget.contains(event.relatedTarget)) {
    showGrayPlaceholder.value = false
    showYellowPlaceholder.value = false
    grayPlaceholderPosition.value = { x: 0, y: 0 }
    yellowPlaceholderPosition.value = { x: 0, y: 0, width: 0, height: 0 }
  }
}

watch(() => props.items, (newItems) => {
  if (JSON.stringify(localItems.value) !== JSON.stringify(newItems)) {
    localItems.value = [...newItems]
  }
}, { deep: true, immediate: true })

watch(localItems, (newItems, oldItems) => {
  if (!resizeObserver.value) return
  
  nextTick(() => {
    oldItems.forEach(oldItem => {
      const stillExists = newItems.find(newItem => newItem.id === oldItem.id)
      if (!stillExists) {
        removeResizeObserver(oldItem)
      }
    })
    
    newItems.forEach(newItem => {
      if (newItem.height === 'auto') {
        const element = document.querySelector(`[data-item-id="${newItem.id}"]`)
        if (element && !autoHeightItems.value.has(newItem.id)) {
          setupResizeObserver(element, newItem)
        }
      } else {
        removeResizeObserver(newItem)
      }
    })
    
    const hasAutoHeightItems = newItems.some(item => item.height === 'auto')
    if (hasAutoHeightItems) {
      setTimeout(() => {
        recalculatePositions()
      }, 100)
    }
  })
}, { deep: true })

watch(() => props.draggedType, (newType) => {
  if (newType && ELEMENT_SIZES[newType] && !isDraggingExisting.value) {
    currentDraggedType.value = newType
    showGrayPlaceholder.value = true
    if (isDragOver.value) {
      showYellowPlaceholder.value = true
    }
  } else if (!newType) {
    resetDragState()
  }
}, { immediate: true })

const triggerRecalculatePositions = () => {
  nextTick(() => {
    recalculatePositions()
  })
}

defineExpose({
  triggerRecalculatePositions
})

onMounted(() => {
  localItems.value.forEach((item, index) => {
    if (item.x === undefined || item.y === undefined) {
      const size = ELEMENT_SIZES[item.type] || { width: 200, height: 150 }
      item.x = 0
      item.y = index * (size.height + GRID_GAP)
      if (!item.width) item.width = size.width
      if (!item.height) item.height = size.height
    }
  })
  
  if (localItems.value.length > 0) {
    emit('update:items', localItems.value)
  }

  resizeObserver.value = new ResizeObserver(handleItemResize)
  
  nextTick(() => {
    localItems.value.forEach(item => {
      if (item.height === 'auto') {
        const element = document.querySelector(`[data-item-id="${item.id}"]`)
        if (element) {
          setupResizeObserver(element, item)
        }
      }
    })
  })
})

onUnmounted(() => {
  document.removeEventListener('mousemove', handleExistingItemDrag)
  document.removeEventListener('mouseup', stopDrag)
  document.removeEventListener('mousemove', handleResize)
  document.removeEventListener('mouseup', stopResize)
  
  if (resizeObserver.value) {
    resizeObserver.value.disconnect()
    resizeObserver.value = null
  }
  autoHeightItems.value.clear()
})
</script>

<style scoped lang="scss">
.dashboard-grid {
  position: relative;
  width: 100%;
  height: 100%;
  min-height: calc(100vh - 200px);
  overflow: hidden;
}

.empty-grid {
  width: 100%;
  height: 100%;
  min-height: calc(100vh - 200px);
  display: flex;
  align-items: center;
  justify-content: center;
  border: 2px dashed var(--color-border);
  border-radius: 8px;
  transition: all 0.2s ease;
  
  &.drag-over {
    border-color: var(--color-primary);
    background: rgba(var(--color-primary-rgb), 0.05);
  }
}

.empty-content {
  text-align: center;
  color: var(--color-text-secondary);
  
  h3 {
    margin: 15px 0 10px 0;
    font-size: 18px;
    font-weight: 600;
    color: var(--color-text-primary);
  }
  
  p {
    margin: 0;
    font-size: 14px;
    line-height: 1.5;
    max-width: 400px;
  }
}

.grid-container {
  position: relative;
  width: 100%;
  min-height: 100%;
  padding: 20px;
}

.grid-item {
  background: var(--color-primary-background);
  border: 2px solid var(--color-border);
  border-radius: 8px;
  padding: 12px;
  cursor: move;
  transition: all 0.2s ease;
  display: flex;
  flex-direction: column;
  user-select: none;
  overflow: hidden;
  box-sizing: border-box;
  
  &:hover {
    border-color: var(--color-primary);
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
    
    .item-actions, .item-header {
      opacity: 1;
    }
  }
  
  &.item-selected {
    border-color: var(--color-primary);
    box-shadow: 0 0 0 2px rgba(var(--color-primary-rgb), 0.2);
  }
  
  &.item-dragging {
    transform: scale(1.02);
    box-shadow: 0 8px 20px rgba(0, 0, 0, 0.2);
  }
}

.grid-item.item-hidden-drag {
  opacity: 0 !important;
  pointer-events: none !important;
}

.item-header {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-shrink: 0;
  min-height: 20px;
  overflow: hidden;
  opacity: 0;
  transition: opacity 0.2s ease;
  padding: 8px 12px;
  background: rgba(45, 45, 61, 0.7);
  backdrop-filter: blur(4px);
  z-index: 10;
  border-radius: 8px 8px 0 0;
}

.item-type {
  font-weight: 600;
  font-size: 14px;
  color: var(--color-text-primary);
  text-transform: uppercase;
  letter-spacing: 0.5px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  max-width: 60%;
}

.header-widget-title {
  display: flex;
  align-items: center;
  font-weight: 500;
  color: var(--color-text-primary);
  text-align: left;
  width: 100%;
  word-break: break-word;
  white-space: normal;
}

.text-widget-content {
  color: var(--color-text-primary);
  font-size: 14px;
  line-height: 1.5;
  width: 100%;
  height: 100%;
  overflow: auto;
  padding: 8px;
  word-wrap: break-word;
  overflow-wrap: break-word;
  hyphens: auto;
  
  :deep(h1, h2, h3, h4, h5, h6) {
    margin: 0.5em 0;
    font-weight: 600;
  }
  
  :deep(p) {
    margin: 0.5em 0;
  }
  
  :deep(ul, ol) {
    margin: 0.5em 0;
    padding-left: 1.5em;
  }
  
  :deep(blockquote) {
    margin: 1em 0;
    padding: 0.5em 1em;
    border-left: 4px solid var(--color-border);
    background: var(--color-background);
  }
  
  :deep(pre) {
    background: var(--color-background);
    border: 1px solid var(--color-border);
    border-radius: 4px;
    padding: 1em;
    overflow-x: auto;
    font-family: monospace;
  }
  
  :deep(code) {
    background: var(--color-background);
    padding: 0.2em 0.4em;
    border-radius: 3px;
    font-family: monospace;
  }
}

.chart-widget-container {
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.item-auto-height {
  height: auto !important;
  min-height: 50px;
  
  .text-widget-content {
    height: auto !important;
    overflow: visible;
    display: block;
  }
  
  .item-content {
    height: auto !important;
    min-height: auto;
  }
}

.hint-icon-wrapper {
  margin-left: 5px;
  cursor: pointer;
}

.hint-tooltip {
  position: fixed;
  background: var(--color-primary-background);
  color: var(--color-text-primary);
  border: 1px solid var(--color-border);
  border-radius: 6px;
  padding: 10px;
  white-space: normal;
  z-index: 10000;
  box-shadow: 0 2px 8px rgba(0,0,0,0.15);
  font-size: 13px;
  max-width: 300px;
  overflow-wrap: break-word;

  :deep(p) {
    margin-bottom: 0;
  }
}

.item-actions {
  display: flex;
  gap: 5px;
  opacity: 0;
  transition: opacity 0.2s ease;
  z-index: 1;
}

.btn-edit,
.btn-delete {
  background: none;
  border: none;
  padding: 4px;
  border-radius: 4px;
  cursor: pointer;
  color: var(--color-text-secondary);
  transition: all 0.2s ease;
  
  &:hover {
    background: var(--color-hover-background);
    color: var(--color-text-primary);
  }
}

.btn-delete:hover {
  color: var(--color-danger);
}

.item-content {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
}

.item-preview {
  text-align: center;
  color: var(--color-text-secondary);
  font-size: 14px;
  line-height: 1.4;
  word-wrap: break-word;
  overflow-wrap: break-word;
  hyphens: auto;
  max-width: 100%;
  max-height: 100%;
  overflow: hidden;
  display: -webkit-box;
  -webkit-line-clamp: 3;
  line-clamp: 3;
  -webkit-box-orient: vertical;
  
  @media (max-width: 400px) {
    font-size: 12px;
    -webkit-line-clamp: 2;
    line-clamp: 2;
  }
}

.resize-indicators {
  position: absolute;
  inset: 0;
  pointer-events: none;
}

.resize-indicator {
  position: absolute;
  background: var(--color-primary);
  pointer-events: auto;
  opacity: 0.6;
  transition: opacity 0.2s ease;
  
  &:hover {
    opacity: 1;
  }
  
  &.resize-left {
    left: 0;
    top: 50%;
    transform: translateY(-50%);
    width: 8px;
    height: 30px;
    cursor: w-resize;
    border-radius: 4px 0 0 4px;
  }
  
  &.resize-right {
    right: 0;
    top: 50%;
    transform: translateY(-50%);
    width: 8px;
    height: 30px;
    cursor: e-resize;
    border-radius: 0 4px 4px 0;
  }
  
  &.resize-bottom {
    bottom: 0;
    left: 50%;
    transform: translateX(-50%);
    width: 30px;
    height: 8px;
    cursor: s-resize;
    border-radius: 0 0 4px 4px;
  }
}

.item-селектор .resize-indicator,
.item-заголовок .resize-indicator {
  &.resize-left,
  &.resize-right {
    height: 24px;
  }
  
  &.resize-bottom {
    width: 24px;
  }
}

.gray-placeholder {
  background: rgba(128, 128, 128, 0.7);
  border: 2px solid rgba(64, 64, 64, 0.9);
  border-radius: 8px;
  backdrop-filter: blur(4px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
  opacity: 0.9;
  pointer-events: none;
}

.yellow-placeholder {
  background: rgba(255, 193, 7, 0.15);
  border: 3px dashed rgba(255, 193, 7, 0.8);
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  pointer-events: none;
  animation: placeholderPulse 1.5s ease-in-out infinite alternate;
  
  &::before {
    content: '';
    position: absolute;
    inset: 4px;
    background: rgba(255, 193, 7, 0.08);
    border-radius: 4px;
  }
  
  .placeholder-content {
    font-size: 14px;
    font-weight: 600;
    color: rgba(255, 140, 0, 0.9);
    text-transform: uppercase;
    letter-spacing: 0.8px;
    position: relative;
    z-index: 1;
    background: rgba(255, 255, 255, 0.9);
    padding: 8px 16px;
    border-radius: 20px;
    box-shadow: 0 2px 8px rgba(255, 193, 7, 0.2);
  }
}

@keyframes placeholderPulse {
  0% {
    opacity: 0.4;
    transform: scale(0.95);
    border-color: rgba(255, 193, 7, 0.5);
  }
  50% {
    opacity: 0.8;
    transform: scale(1.0);
    border-color: rgba(255, 193, 7, 0.9);
  }
  100% {
    opacity: 0.6;
    transform: scale(0.98);
    border-color: rgba(255, 193, 7, 0.7);
  }
}

.item-чарт {
  background: linear-gradient(135deg, var(--color-primary-background) 0%, rgba(var(--color-primary-rgb), 0.05) 100%);
}

.item-селектор {
  background: linear-gradient(135deg, var(--color-primary-background) 0%, rgba(54, 162, 235, 0.05) 100%);
  
  .item-preview {
    font-size: 12px;
    display: -webkit-box;
    -webkit-line-clamp: 1;
    line-clamp: 1;
    -webkit-box-orient: vertical;
  }
}

.item-текст {
  background: linear-gradient(135deg, var(--color-primary-background) 0%, rgba(75, 192, 192, 0.05) 100%);
}

.item-заголовок {
  background: linear-gradient(135deg, var(--color-primary-background) 0%, rgba(255, 206, 86, 0.05) 100%);
  
  .item-content {
    padding: 6px;
  }
  
  .item-preview {
    font-size: 13px;
    display: -webkit-box;
    -webkit-line-clamp: 1;
    line-clamp: 1;
    -webkit-box-orient: vertical;
  }
}

.dragged-element-preview {
  pointer-events: none;
  opacity: 0.85;
  box-shadow: 0 8px 20px rgba(0,0,0,0.25);
  border: 2px solid var(--color-primary);
  border-radius: 8px;
  background: var(--color-primary-background);
  transition: box-shadow 0.2s, opacity 0.2s;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  z-index: 2000;
}

.hint-content {
  text-align: center;
  display: flex;
  justify-content: center;
  align-items: center;
  max-width: 100%;
  overflow-wrap: break-word;
  word-wrap: break-word;
  word-break: break-word;
  hyphens: auto;
}
</style> 