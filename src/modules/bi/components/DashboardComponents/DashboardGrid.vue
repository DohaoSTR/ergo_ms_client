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
        <p>Перетащите элемент сюда чтобы начать</p>
      </div>
    </div>

    <div v-else class="grid-container">
      <div
        v-for="item in items"
        :key="item.id"
        class="grid-item"
        :class="getItemClass(item)"
        :style="getItemStyle(item)"
        @click="selectItem(item)"
        @dblclick="editItem(item)"
        @mousedown="startDrag(item, $event)"
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
          <div class="item-preview">
            {{ getItemPreview(item) }}
          </div>
        </div>
        
        <div 
          v-if="item.selected"
          class="resize-handles"
        >
          <div class="resize-handle resize-se" @mousedown.stop="startResize(item, 'se', $event)"></div>
          <div class="resize-handle resize-sw" @mousedown.stop="startResize(item, 'sw', $event)"></div>
          <div class="resize-handle resize-ne" @mousedown.stop="startResize(item, 'ne', $event)"></div>
          <div class="resize-handle resize-nw" @mousedown.stop="startResize(item, 'nw', $event)"></div>
        </div>
      </div>
    </div>

    <Teleport to="body">
      <div 
        v-if="showGrayPlaceholder && grayPlaceholderStyle" 
        class="gray-placeholder"
        :style="grayPlaceholderStyle"
      >
      </div>
    </Teleport>
    
    <div 
      v-if="showYellowPlaceholder && yellowPlaceholderStyle" 
      class="yellow-placeholder"
      :style="yellowPlaceholderStyle"
    >
      <div class="placeholder-content">
        <span>Разместить здесь</span>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch, nextTick, onMounted, onUnmounted } from 'vue'
import { Teleport } from 'vue'
import { Settings2, X, LayoutDashboard } from 'lucide-vue-next'

const ELEMENT_SIZES = {
  'Чарт': { width: 560, height: 300 },
  'Селектор': { width: 370, height: 50 },
  'Текст': { width: 560, height: 150 },
  'Заголовок': { width: Math.min(1320, MAX_PAGE_WIDTH - GRID_PADDING * 2), height: 50 }
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

// Вычисляем стили для временного сдвига существующих элементов
const shiftedItemsStyle = computed(() => {
  if (!showYellowPlaceholder.value) {
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
    
    // Проверяем, пересекается ли элемент с плейсхолдером по вертикали
    const itemBottom = itemY + itemHeight
    const placeholderBottom = placeholderY + placeholderHeight
    
    // Если элемент находится на той же строке или ниже плейсхолдера, сдвигаем его вниз
    if (itemY >= placeholderY) {
      const shiftAmount = placeholderHeight + GRID_GAP
      styles[item.id] = {
        transform: `translateY(${shiftAmount}px)`,
        transition: 'transform 0.2s ease'
      }
    }
    // Если элемент пересекается с плейсхолдером по вертикали, сдвигаем его вниз
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
    'item-dragging': draggedItem.value && draggedItem.value.id === item.id
  }
}

const getItemStyle = (item) => {
  const baseStyle = {
    position: 'absolute',
    left: `${item.x || 0}px`,
    top: `${item.y || 0}px`,
    width: `${item.width || ELEMENT_SIZES[item.type]?.width || 200}px`,
    height: `${item.height || ELEMENT_SIZES[item.type]?.height || 150}px`
  }
  
  if (draggedItem.value && draggedItem.value.id === item.id) {
    baseStyle.zIndex = 1000
    baseStyle.opacity = 0.8
  }
  
  // Применяем временные стили сдвига
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

const selectItem = (item) => {
  if (draggedItem.value) return
  
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

const calculateDropPosition = (mouseX, mouseY, elementType) => {
  if (!gridContainer.value) return { x: 0, y: 0 }
  
  const rect = gridContainer.value.getBoundingClientRect()
  const relativeX = mouseX - rect.left
  const relativeY = mouseY - rect.top
  
  const elementSize = ELEMENT_SIZES[elementType]
  if (!elementSize) return { x: 0, y: 0 }
  
  if (localItems.value.length === 0) {
    // Проверяем, поместится ли элемент в начальную позицию
    const gridWidth = Math.min(gridContainer.value.clientWidth, MAX_PAGE_WIDTH)
    const initialX = Math.max(0, relativeX - elementSize.width / 2)
    
    if (initialX + elementSize.width > gridWidth) {
      // Если не помещается, центрируем элемент в пределах доступной ширины
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
  
  // Используем реальную ширину контейнера, но ограничиваем максимальной шириной страницы
  const gridWidth = Math.min(gridContainer.value.clientWidth, MAX_PAGE_WIDTH)
  const snapX = Math.max(0, Math.min(gridWidth - elementSize.width, relativeX - elementSize.width / 2))
  
  const nearestRow = findNearestRow(relativeY, elementSize.height)
  const snappedPosition = findNearestValidPositionInRow(snapX, nearestRow, elementSize.width, elementSize.height)
  
  return snappedPosition
}

const findNearestRow = (mouseY, elementHeight) => {
  if (localItems.value.length === 0) return 0
  
  const occupiedAreas = localItems.value.map(item => ({
    top: item.y || 0,
    bottom: (item.y || 0) + (item.height || ELEMENT_SIZES[item.type]?.height || 150)
  }))
  
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
      const itemHeight = item.height || ELEMENT_SIZES[item.type]?.height || 150
      return Math.abs(itemY - rowY) < 10
    })
    .map(item => ({
      left: item.x || 0,
      right: (item.x || 0) + (item.width || ELEMENT_SIZES[item.type]?.width || 200)
    }))
    .sort((a, b) => a.left - b.left)
  
  if (rowItems.length === 0) {
    // Проверяем, поместится ли элемент в строку
    if (x + width > gridWidth) {
      // Если не помещается, возвращаем позицию для новой строки
      return { x: 0, y: rowY + height + GRID_GAP }
    }
    return { x, y: rowY }
  }
  
  const newArea = { left: x, right: x + width }
  
  for (const item of rowItems) {
    if (newArea.left < item.right + GRID_GAP && newArea.right > item.left - GRID_GAP) {
      const nextX = item.right + GRID_GAP
      // Проверяем, поместится ли элемент после текущего элемента
      if (nextX + width > gridWidth) {
        // Если не помещается, возвращаем позицию для новой строки
        return { x: 0, y: rowY + height + GRID_GAP }
      }
      return { x: nextX, y: rowY }
    }
  }
  
  // Проверяем, поместится ли элемент в текущую позицию
  if (x + width > gridWidth) {
    // Если не помещается, возвращаем позицию для новой строки
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
    // Если нет элементов, плейсхолдер центрируется относительно курсора
    const snapX = Math.max(0, Math.min(gridWidth - elementSize.width, relativeX - elementSize.width / 2))
    return { x: snapX, y: 0 }
  }
  
  // Находим ближайший элемент к позиции мыши
  let nearestItem = null
  let minDistance = Infinity
  
  for (const item of localItems.value) {
    const itemCenterX = (item.x || 0) + (item.width || ELEMENT_SIZES[item.type]?.width || 200) / 2
    const itemCenterY = (item.y || 0) + (item.height || ELEMENT_SIZES[item.type]?.height || 150) / 2
    
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
  
  const nearestItemWidth = nearestItem.width || ELEMENT_SIZES[nearestItem.type]?.width || 200
  const nearestItemHeight = nearestItem.height || ELEMENT_SIZES[nearestItem.type]?.height || 150
  const nearestItemX = nearestItem.x || 0
  const nearestItemY = nearestItem.y || 0
  
  // Проверяем возможность размещения рядом с ближайшим элементом
  const rightOfNearest = nearestItemX + nearestItemWidth + GRID_GAP
  const canFitRight = rightOfNearest + elementSize.width <= gridWidth
  
  // Определяем приоритет размещения на основе позиции мыши
  const mouseIsAbove = relativeY < nearestItemY + nearestItemHeight / 2
  const mouseIsLeft = relativeX < nearestItemX + nearestItemWidth / 2
  
  // Если мышь выше элемента, размещаем над ним
  if (mouseIsAbove) {
    // Проверяем, поместится ли элемент в позиции слева
    if (nearestItemX + elementSize.width <= gridWidth) {
      return { x: nearestItemX, y: Math.max(0, nearestItemY - elementSize.height - GRID_GAP) }
    }
    
    // Если не помещается, центрируем элемент
    const centerX = Math.max(0, (gridWidth - elementSize.width) / 2)
    return { x: centerX, y: Math.max(0, nearestItemY - elementSize.height - GRID_GAP) }
  }
  
  // Если мышь слева от элемента и есть место, размещаем слева
  if (mouseIsLeft && nearestItemX >= elementSize.width + GRID_GAP) {
    const leftPosition = Math.max(0, nearestItemX - elementSize.width - GRID_GAP)
    // Проверяем, поместится ли элемент в этой позиции
    if (leftPosition + elementSize.width <= gridWidth) {
      return { x: leftPosition, y: nearestItemY }
    }
  }
  
  // Если есть место справа, размещаем справа
  if (canFitRight) {
    return { x: rightOfNearest, y: nearestItemY }
  }
  
  // Иначе размещаем под элементом
  const belowNearest = nearestItemY + nearestItemHeight + GRID_GAP
  
  // Находим самый левый элемент в строке для правильной привязки
  let leftMostX = nearestItemX
  
  for (const item of localItems.value) {
    const itemY = item.y || 0
    const itemX = item.x || 0
    
    // Если элемент находится в той же строке или пересекается с ней
    if (Math.abs(itemY - nearestItemY) < 10) {
      if (itemX < leftMostX) {
        leftMostX = itemX
      }
    }
  }
  
  // Проверяем, поместится ли элемент в позиции слева
  if (leftMostX + elementSize.width <= gridWidth) {
    return { x: leftMostX, y: belowNearest }
  }
  
  // Если не помещается слева, центрируем элемент в доступном пространстве
  const centerX = Math.max(0, (gridWidth - elementSize.width) / 2)
  return { x: centerX, y: belowNearest }
}

// Функция для расчета финальной позиции с учетом сдвинутых элементов
const calculateFinalPlacement = (elementType) => {
  if (!yellowPlaceholderPosition.value || !elementType) {
    return { x: 0, y: 0 }
  }
  
  const placeholderX = yellowPlaceholderPosition.value.x
  const placeholderY = yellowPlaceholderPosition.value.y
  const elementSize = ELEMENT_SIZES[elementType]
  
  if (!elementSize) return { x: 0, y: 0 }
  
  // Проверяем, есть ли элементы, которые нужно сдвинуть навсегда
  const elementsToShift = []
  
  localItems.value.forEach(item => {
    const itemY = item.y || 0
    const itemHeight = item.height || ELEMENT_SIZES[item.type]?.height || 150
    
    // Если элемент находится на той же строке или ниже плейсхолдера
    if (itemY >= placeholderY) {
      elementsToShift.push(item)
    }
    // Если элемент пересекается с плейсхолдером по вертикали
    else if (itemY < placeholderY && itemY + itemHeight > placeholderY) {
      elementsToShift.push(item)
    }
  })
  
  // Сдвигаем элементы навсегда
  elementsToShift.forEach(item => {
    const itemY = item.y || 0
    const itemHeight = item.height || ELEMENT_SIZES[item.type]?.height || 150
    
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
    .map(item => ({
      left: item.x || 0,
      top: item.y || 0,
      right: (item.x || 0) + (item.width || ELEMENT_SIZES[item.type]?.width || 200),
      bottom: (item.y || 0) + (item.height || ELEMENT_SIZES[item.type]?.height || 150)
    }))
  
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

const startDrag = (item, event) => {
  if (event.button !== 0) return
  
  event.preventDefault()
  draggedItem.value = item
  isDraggingExisting.value = true
  
  const rect = gridContainer.value.getBoundingClientRect()
  dragOffset.value = {
    x: event.clientX - rect.left - (item.x || 0),
    y: event.clientY - rect.top - (item.y || 0)
  }
  
  document.addEventListener('mousemove', handleExistingItemDrag)
  document.addEventListener('mouseup', stopDrag)
}

const handleExistingItemDrag = (event) => {
  if (!draggedItem.value || !gridContainer.value) return
  
  const rect = gridContainer.value.getBoundingClientRect()
  const newX = event.clientX - rect.left - dragOffset.value.x
  const newY = event.clientY - rect.top - dragOffset.value.y
  
  const gridWidth = Math.min(gridContainer.value.clientWidth, MAX_PAGE_WIDTH)
  const itemWidth = draggedItem.value.width || ELEMENT_SIZES[draggedItem.value.type]?.width || 200
  const itemHeight = draggedItem.value.height || ELEMENT_SIZES[draggedItem.value.type]?.height || 150
  
  const clampedX = Math.max(0, Math.min(gridWidth - itemWidth, newX))
  const clampedY = Math.max(0, newY)
  
  if (localItems.value.length === 1) {
    // Если элемент один, разрешаем перемещение только по оси X
    if (!checkCollision(clampedX, draggedItem.value.y, itemWidth, itemHeight, draggedItem.value.id)) {
      draggedItem.value.x = clampedX
    }
  } else {
    // Если элементов несколько, разрешаем свободное перемещение
    if (!checkCollision(clampedX, clampedY, itemWidth, itemHeight, draggedItem.value.id)) {
      draggedItem.value.x = clampedX
      draggedItem.value.y = clampedY
    }
  }
  
  showYellowPlaceholder.value = true
  
  // Обновляем позицию желтого плейсхолдера, чтобы он следовал за курсором
  const mouseX = event.clientX - rect.left
  const mouseY = event.clientY - rect.top
  
  // Плейсхолдер всегда следует за курсором по горизонтали
  const snapX = Math.max(0, Math.min(gridWidth - itemWidth, mouseX))
  
  // Определяем Y позицию на основе ближайшего элемента
  let snapY = draggedItem.value.y || 0
  
  if (localItems.value.length > 1) {
    let nearestItem = null
    let minDistance = Infinity
    
    for (const item of localItems.value) {
      // Исключаем перетаскиваемый элемент из поиска
      if (item.id === draggedItem.value.id) continue
      
      const itemCenterX = (item.x || 0) + (item.width || ELEMENT_SIZES[item.type]?.width || 200) / 2
      const itemCenterY = (item.y || 0) + (item.height || ELEMENT_SIZES[item.type]?.height || 150) / 2
      
      const distance = Math.sqrt(
        Math.pow(mouseX - itemCenterX, 2) + Math.pow(mouseY - itemCenterY, 2)
      )
      
      if (distance < minDistance) {
        minDistance = distance
        nearestItem = item
      }
    }
    
    if (nearestItem) {
      const nearestItemHeight = nearestItem.height || ELEMENT_SIZES[nearestItem.type]?.height || 150
      const nearestItemY = nearestItem.y || 0
      
      const mouseIsAbove = mouseY < nearestItemY + nearestItemHeight / 2
      
      if (mouseIsAbove) {
        // Проверяем, есть ли место выше элемента
        const topPosition = nearestItemY - itemHeight - GRID_GAP
        if (topPosition >= 0) {
          snapY = topPosition
        } else {
          // Если нет места выше, оставляем на той же строке
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

const stopDrag = () => {
  if (draggedItem.value && isDraggingExisting.value) {
    const originalY = draggedItem.value.y || 0
    const itemHeight = draggedItem.value.height || ELEMENT_SIZES[draggedItem.value.type]?.height || 150
    
    // Используем позицию желтого плейсхолдера для финального размещения
    if (showYellowPlaceholder.value && yellowPlaceholderPosition.value) {
      const newY = yellowPlaceholderPosition.value.y
      
      // Если элемент перемещается вниз (сверху вниз)
      if (newY > originalY) {
        // Сдвигаем элементы, которые находятся между исходной и новой позицией, вверх
        localItems.value.forEach(item => {
          if (item.id === draggedItem.value.id) return
          
          const itemY = item.y || 0
          
          // Элементы, которые находятся между исходной и новой позицией, сдвигаем вверх
          if (itemY >= originalY && itemY < newY) {
            item.y = Math.max(0, itemY - itemHeight - GRID_GAP)
          }
        })
        
        // Затем сдвигаем элементы в новой позиции вниз
        localItems.value.forEach(item => {
          if (item.id === draggedItem.value.id) return
          
          const itemY = item.y || 0
          const itemItemHeight = item.height || ELEMENT_SIZES[item.type]?.height || 150
          
          // Элементы, которые находятся на новой позиции или пересекаются с ней
          if (itemY >= newY || (itemY < newY && itemY + itemItemHeight > newY)) {
            item.y = itemY + itemHeight + GRID_GAP
          }
        })
        
        // Устанавливаем элемент в позицию, которая учитывает сдвинутые элементы
        draggedItem.value.x = yellowPlaceholderPosition.value.x
        // Находим самую нижнюю позицию среди сдвинутых элементов
        let maxY = 0
        localItems.value.forEach(item => {
          if (item.id !== draggedItem.value.id) {
            const itemY = item.y || 0
            const itemItemHeight = item.height || ELEMENT_SIZES[item.type]?.height || 150
            maxY = Math.max(maxY, itemY + itemItemHeight)
          }
        })
        draggedItem.value.y = maxY + GRID_GAP
      }
      
      // Если элемент перемещается вверх (снизу вверх), сдвигаем элементы в старой позиции вверх
      if (newY < originalY) {
        localItems.value.forEach(item => {
          if (item.id === draggedItem.value.id) return
          
          const itemY = item.y || 0
          
          // Элементы, которые находятся ниже исходной позиции, сдвигаем вверх
          if (itemY > originalY) {
            item.y = Math.max(0, itemY - itemHeight - GRID_GAP)
          }
        })
        
        // Также сдвигаем элементы в новой позиции вниз
        localItems.value.forEach(item => {
          if (item.id === draggedItem.value.id) return
          
          const itemY = item.y || 0
          const itemItemHeight = item.height || ELEMENT_SIZES[item.type]?.height || 150
          
          // Элементы, которые находятся на новой позиции или пересекаются с ней
          if (itemY >= newY || (itemY < newY && itemY + itemItemHeight > newY)) {
            item.y = itemY + itemHeight + GRID_GAP
          }
        })
        
        draggedItem.value.x = yellowPlaceholderPosition.value.x
        draggedItem.value.y = yellowPlaceholderPosition.value.y
      }
    } else {
      // Fallback: если плейсхолдер не активен, используем старую логику
      const itemWidth = draggedItem.value.width || ELEMENT_SIZES[draggedItem.value.type]?.width || 200
      
      if (localItems.value.length === 1) {
        // Если элемент один, фиксируем только X позицию
        const finalPosition = findNearestValidPositionInRow(draggedItem.value.x, draggedItem.value.y, itemWidth, itemHeight, draggedItem.value.id)
        draggedItem.value.x = finalPosition.x
      } else {
        // Если элементов несколько, находим ближайшую строку для финальной позиции
        const nearestRow = findNearestRow(draggedItem.value.y, itemHeight)
        const finalPosition = findNearestValidPositionInRow(draggedItem.value.x, nearestRow, itemWidth, itemHeight, draggedItem.value.id)
        draggedItem.value.x = finalPosition.x
        draggedItem.value.y = finalPosition.y
      }
    }
    
    emit('update:items', localItems.value)
  }
  
  draggedItem.value = null
  isDraggingExisting.value = false
  showYellowPlaceholder.value = false
  
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
  
  if (resizeDirection.value.includes('e')) {
    newWidth = Math.max(100, resizeStartSize.value.width + deltaX)
  }
  if (resizeDirection.value.includes('w')) {
    newWidth = Math.max(100, resizeStartSize.value.width - deltaX)
    newX = (resizingItem.value.x || 0) + deltaX
  }
  if (resizeDirection.value.includes('s')) {
    newHeight = Math.max(50, resizeStartSize.value.height + deltaY)
  }
  if (resizeDirection.value.includes('n')) {
    newHeight = Math.max(50, resizeStartSize.value.height - deltaY)
    newY = (resizingItem.value.y || 0) + deltaY
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
    
    // Сразу устанавливаем позицию серого плейсхолдера по курсору
    grayPlaceholderPosition.value = {
      x: event.clientX,
      y: event.clientY
    }
    
    // И рассчитываем начальную позицию для желтого плейсхолдера
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
    // Серый плейсхолдер всегда следует за курсором
    grayPlaceholderPosition.value = {
      x: event.clientX,
      y: event.clientY
    }
    
    // Используем новую функцию для расчета потенциального места размещения
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
    // Используем функцию для финального размещения с учетом сдвинутых элементов
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
  
  // Сбрасываем позиции плейсхолдеров
  grayPlaceholderPosition.value = { x: 0, y: 0 }
  yellowPlaceholderPosition.value = { x: 0, y: 0, width: 0, height: 0 }
}

const handleMouseMove = (event) => {
  // Для новых элементов с панели инструментов - серый плейсхолдер всегда следует за курсором
  if (showGrayPlaceholder.value && currentDraggedType.value && !isDraggingExisting.value) {
    // Обновляем позицию серого плейсхолдера точно по координатам курсора
    grayPlaceholderPosition.value = {
      x: event.clientX,
      y: event.clientY
    }
    
    // Обновляем позицию желтого плейсхолдера только если мышь над грид-контейнером
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
    const itemWidth = draggedItem.value.width || ELEMENT_SIZES[draggedItem.value.type]?.width || 200
    const itemHeight = draggedItem.value.height || ELEMENT_SIZES[draggedItem.value.type]?.height || 150
    
    const clampedX = Math.max(0, Math.min(gridWidth - itemWidth, newX))
    const clampedY = Math.max(0, newY)
    
    if (localItems.value.length === 1) {
      // Если элемент один, разрешаем перемещение только по оси X
      if (!checkCollision(clampedX, draggedItem.value.y, itemWidth, itemHeight, draggedItem.value.id)) {
        draggedItem.value.x = clampedX
      }
    } else {
      // Если элементов несколько, разрешаем свободное перемещение
      if (!checkCollision(clampedX, clampedY, itemWidth, itemHeight, draggedItem.value.id)) {
        draggedItem.value.x = clampedX
        draggedItem.value.y = clampedY
      }
    }
    
    // Плейсхолдер всегда следует за курсором по горизонтали
    const mouseX = event.clientX - rect.left
    const mouseY = event.clientY - rect.top
    
    const snapX = Math.max(0, Math.min(gridWidth - itemWidth, mouseX))
    
    // Определяем Y позицию на основе ближайшего элемента
    let snapY = draggedItem.value.y || 0
    
    if (localItems.value.length > 1) {
      let nearestItem = null
      let minDistance = Infinity
      
      for (const item of localItems.value) {
        // Исключаем перетаскиваемый элемент из поиска
        if (item.id === draggedItem.value.id) continue
        
        const itemCenterX = (item.x || 0) + (item.width || ELEMENT_SIZES[item.type]?.width || 200) / 2
        const itemCenterY = (item.y || 0) + (item.height || ELEMENT_SIZES[item.type]?.height || 150) / 2
        
        const distance = Math.sqrt(
          Math.pow(mouseX - itemCenterX, 2) + Math.pow(mouseY - itemCenterY, 2)
        )
        
        if (distance < minDistance) {
          minDistance = distance
          nearestItem = item
        }
      }
      
      if (nearestItem) {
        const nearestItemHeight = nearestItem.height || ELEMENT_SIZES[nearestItem.type]?.height || 150
        const nearestItemY = nearestItem.y || 0
        
        const mouseIsAbove = mouseY < nearestItemY + nearestItemHeight / 2
        
        if (mouseIsAbove) {
          // Проверяем, есть ли место выше элемента
          const topPosition = nearestItemY - itemHeight - GRID_GAP
          if (topPosition >= 0) {
            snapY = topPosition
          } else {
            // Если нет места выше, оставляем на той же строке
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
    // Сбрасываем только плейсхолдеры, но не весь drag state
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

onMounted(() => {
  localItems.value.forEach((item, index) => {
    if (item.x === undefined || item.y === undefined) {
      const size = ELEMENT_SIZES[item.type] || { width: 200, height: 150 }
      item.x = 0
      item.y = index * (size.height + GRID_GAP)
      item.width = size.width
      item.height = size.height
    }
  })
  
  if (localItems.value.length > 0) {
    emit('update:items', localItems.value)
  }
})

onUnmounted(() => {
  document.removeEventListener('mousemove', handleExistingItemDrag)
  document.removeEventListener('mouseup', stopDrag)
  document.removeEventListener('mousemove', handleResize)
  document.removeEventListener('mouseup', stopResize)
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
  
  p {
    margin-top: 15px;
    font-size: 16px;
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
    
    .item-actions {
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

.item-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 10px;
  flex-shrink: 0;
  min-height: 24px;
  overflow: hidden;
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

.item-actions {
  display: flex;
  gap: 5px;
  opacity: 0;
  transition: opacity 0.2s ease;
  flex-shrink: 0;
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
  padding: 8px;
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
  -webkit-box-orient: vertical;
  line-clamp: 3;
  
  @media (max-width: 400px) {
    font-size: 12px;
    -webkit-line-clamp: 2;
    line-clamp: 2;
  }
}

.resize-handles {
  position: absolute;
  inset: 0;
  pointer-events: none;
}

.resize-handle {
  position: absolute;
  width: 12px;
  height: 12px;
  background: var(--color-primary);
  border: 2px solid white;
  border-radius: 50%;
  pointer-events: auto;
  opacity: 0.8;
  transition: opacity 0.2s ease;
  
  &:hover {
    opacity: 1;
    transform: scale(1.2);
  }
  
  &.resize-se {
    bottom: -6px;
    right: -6px;
    cursor: se-resize;
  }
  
  &.resize-sw {
    bottom: -6px;
    left: -6px;
    cursor: sw-resize;
  }
  
  &.resize-ne {
    top: -6px;
    right: -6px;
    cursor: ne-resize;
  }
  
  &.resize-nw {
    top: -6px;
    left: -6px;
    cursor: nw-resize;
  }
}

.item-селектор .resize-handle,
.item-заголовок .resize-handle {
  width: 10px;
  height: 10px;
  
  &.resize-se {
    bottom: -5px;
    right: -5px;
  }
  
  &.resize-sw {
    bottom: -5px;
    left: -5px;
  }
  
  &.resize-ne {
    top: -5px;
    right: -5px;
  }
  
  &.resize-nw {
    top: -5px;
    left: -5px;
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
  
  .item-content {
    padding: 4px;
  }
  
  .item-preview {
    font-size: 12px;
    -webkit-line-clamp: 1;
    line-clamp: 1;
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
    -webkit-line-clamp: 1;
    line-clamp: 1;
  }
}
</style> 