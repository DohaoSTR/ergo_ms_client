<template>
  <div 
    class="dashboard-grid" 
    @dragover="handleDragOver"
    @drop="handleDrop"
    @dragenter="handleDragEnter" 
    @dragleave="handleDragLeave"
    @mousemove="handleMouseMove"
  >
    <div 
      v-if="items.length === 0"
      class="empty-grid"
      :class="{ 'drag-over': isDragOver }"
    >
      <div class="empty-content">
        <LayoutDashboard :size="48" />
        <p>Перетащите элемент сюда чтобы начать</p>
      </div>
    </div>

    <draggable
      v-else
      v-model="localItems"
      :group="{ name: 'dashboard-items', pull: true, put: true }"
      :animation="200"
      :ghost-class="'ghost-item'"
      :chosen-class="'chosen-item'"
      :drag-class="'drag-item'"
      :force-fallback="false"
      item-key="id"
      class="grid-container"
      @start="onDragStart"
      @end="onDragEnd"
      @change="onChange"
    >
      <template #item="{ element }">
        <div
          :key="element.id"
          class="grid-item"
          :class="getItemClass(element)"
          :style="getItemStyle(element)"
          @click="selectItem(element)"
          @dblclick="editItem(element)"
        >
          <div class="item-header">
            <span class="item-type">{{ element.type }}</span>
            <div class="item-actions">
              <button class="btn-edit" @click.stop="editItem(element)">
                <Settings2 :size="16" />
              </button>
              <button class="btn-delete" @click.stop="deleteItem(element)">
                <X :size="16" />
              </button>
            </div>
          </div>
          <div class="item-content">
            <div class="item-preview">
              {{ getItemPreview(element) }}
            </div>
          </div>
        </div>
      </template>
    </draggable>

    <div 
      v-if="showDropZone && localItems.length === 0 && activeDraggedType" 
      class="drop-zone-placeholder empty-drop-zone"
      :style="{
        gridColumn: '1 / span 2',
        gridRow: '1 / span 2'
      }"
    >
      <div class="drop-zone-content">
        <span>Разместить здесь</span>
      </div>
    </div>
    
    <div 
      v-if="showDropZone && localItems.length > 0 && dropZoneStyle" 
      class="drop-zone-placeholder"
      :style="dropZoneStyle"
    >
      <div class="drop-zone-content">
        <span>Разместить здесь</span>
      </div>
    </div>
    
    <Teleport to="body">
      <div 
        v-if="showDragPreview && activeDraggedType" 
        class="drag-preview"
        :style="dragPreviewStyle"
      >
        <div class="preview-content">
          <span>{{ activeDraggedType }}</span>
        </div>
      </div>
    </Teleport>
  </div>
</template>

<script setup>
import { ref, computed, watch } from 'vue'
import { Teleport } from 'vue'
import draggable from 'vuedraggable'
import { Settings2, X, LayoutDashboard } from 'lucide-vue-next'

const ELEMENT_SIZES = {
  'Чарт': { cols: 2, rows: 2 },
  'Селектор': { cols: 2, rows: 1 },
  'Текст': { cols: 2, rows: 1 },
  'Заголовок': { cols: 4, rows: 1 }
}

const GRID_COLS = 4
const GRID_GAP = 10

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

const localItems = ref([])
const isDragOver = ref(false)
const showDragPreview = ref(false)
const showDropZone = ref(false)
const localDraggedType = ref('')
const dragPreviewPosition = ref({ x: 0, y: 0 })
const dropZonePosition = ref({ gridColumn: 1, gridRow: 1, cols: 1, rows: 1 })

const activeDraggedType = computed(() => {
  return props.draggedType || localDraggedType.value
})

const dragPreviewStyle = computed(() => {
  if (!showDragPreview.value || !activeDraggedType.value) return { display: 'none' }
  
  return {
    position: 'fixed',
    left: `${dragPreviewPosition.value.x}px`,
    top: `${dragPreviewPosition.value.y}px`,
    transform: 'translate(-50%, -50%)',
    pointerEvents: 'none',
    zIndex: 9999,
    userSelect: 'none',
    display: 'block'
  }
})

const dropZoneStyle = computed(() => {
  if (!showDropZone.value) return null
  
  const pos = dropZonePosition.value
  return {
    gridColumn: `${pos.gridColumn} / span ${pos.cols}`,
    gridRow: `${pos.gridRow} / span ${pos.rows}`
  }
})

const getItemClass = (item) => {
  return {
    [`item-${item.type.toLowerCase()}`]: true,
    'item-selected': item.selected
  }
}

const getItemStyle = (item) => {
  const size = ELEMENT_SIZES[item.type] || ELEMENT_SIZES['Чарт']
  return {
    gridColumn: `span ${size.cols}`,
    gridRow: `span ${size.rows}`
  }
}

const getItemPreview = (item) => {
  switch (item.type) {
    case 'Чарт': return '📊 График данных'
    case 'Селектор': return '🔽 Фильтр'
    case 'Текст': return '📝 Поясняющий текст'
    case 'Заголовок': return '📋 Заголовок раздела'
    default: return item.type
  }
}

const selectItem = (item) => {
  localItems.value.forEach(i => i.selected = false)
  item.selected = true
  emit('item-select', item)
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

const calculateDropPosition = (event, elementType) => {
  const container = event.currentTarget
  const rect = container.getBoundingClientRect()
  const mouseX = event.clientX - rect.left - GRID_GAP
  const mouseY = event.clientY - rect.top - GRID_GAP
  
  const containerWidth = rect.width - (GRID_GAP * 2)
  const colWidth = containerWidth / GRID_COLS
  const rowHeight = 150 + GRID_GAP
  
  let gridColumn = Math.floor(mouseX / colWidth) + 1
  let gridRow = Math.floor(mouseY / rowHeight) + 1
  
  const elementSize = ELEMENT_SIZES[elementType] || ELEMENT_SIZES['Чарт']
  
  gridColumn = Math.max(1, Math.min(GRID_COLS - elementSize.cols + 1, gridColumn))
  gridRow = Math.max(1, gridRow)
  
  if (localItems.value.length === 0) {
    return {
      gridColumn: Math.max(1, Math.min(GRID_COLS - elementSize.cols + 1, gridColumn)),
      gridRow: 1,
      cols: elementSize.cols,
      rows: elementSize.rows
    }
  }
  
  const canPlaceAtPosition = checkCanPlaceAtPosition(gridColumn, gridRow, elementSize.cols, elementSize.rows)
  
  if (canPlaceAtPosition) {
    return {
      gridColumn,
      gridRow,
      cols: elementSize.cols,
      rows: elementSize.rows
    }
  }
  
  const nearestPosition = findNearestFreePosition(gridColumn, gridRow, elementType)
  return {
    gridColumn: nearestPosition.gridColumn,
    gridRow: nearestPosition.gridRow,
    cols: elementSize.cols,
    rows: elementSize.rows
  }
}

const findNearestFreePosition = (preferredCol, preferredRow, elementType) => {
  const elementSize = ELEMENT_SIZES[elementType]
  
  if (localItems.value.length === 0) {
    return { gridColumn: 1, gridRow: 1 }
  }
  
  const firstItem = localItems.value[0]
  const firstItemSize = ELEMENT_SIZES[firstItem.type]
  
  const canPlaceNextToFirst = checkCanPlaceAtPosition(
    firstItemSize.cols + 1, 
    1, 
    elementSize.cols, 
    elementSize.rows
  )
  
  const canPlaceUnderFirst = checkCanPlaceAtPosition(
    1, 
    firstItemSize.rows + 1, 
    elementSize.cols, 
    elementSize.rows
  )
  
  if (canPlaceNextToFirst && preferredCol > firstItemSize.cols) {
    return { gridColumn: firstItemSize.cols + 1, gridRow: 1 }
  }
  
  if (canPlaceUnderFirst) {
    return { gridColumn: 1, gridRow: firstItemSize.rows + 1 }
  }
  
  const maxRow = Math.max(1, ...localItems.value.map(item => getItemGridRow(item) + ELEMENT_SIZES[item.type].rows - 1))
  
  for (let distance = 0; distance <= maxRow + 2; distance++) {
    for (let row = Math.max(1, preferredRow - distance); row <= preferredRow + distance; row++) {
      for (let col = Math.max(1, preferredCol - distance); col <= Math.min(GRID_COLS - elementSize.cols + 1, preferredCol + distance); col++) {
        if (checkCanPlaceAtPosition(col, row, elementSize.cols, elementSize.rows)) {
          return { gridColumn: col, gridRow: row }
        }
      }
    }
  }
  
  return { gridColumn: 1, gridRow: maxRow + 1 }
}

const checkCanPlaceAtPosition = (startCol, startRow, spanCols, spanRows) => {
  const endCol = startCol + spanCols - 1
  const endRow = startRow + spanRows - 1
  
  if (endCol > GRID_COLS) return false
  
  for (const item of localItems.value) {
    const itemSize = ELEMENT_SIZES[item.type]
    const itemStartRow = getItemGridRow(item)
    const itemEndRow = itemStartRow + itemSize.rows - 1
    const itemStartCol = getItemGridColumn(item)
    const itemEndCol = itemStartCol + itemSize.cols - 1
    
    const colOverlap = !(endCol < itemStartCol || startCol > itemEndCol)
    const rowOverlap = !(endRow < itemStartRow || startRow > itemEndRow)
    
    if (colOverlap && rowOverlap) {
      return false
    }
  }
  
  return true
}

const getItemGridColumn = (item) => {
  const itemIndex = localItems.value.findIndex(i => i.id === item.id)
  if (itemIndex === -1) return 1
  
  if (itemIndex === 0) return 1
  
  let currentRow = 1
  let currentCol = 1
  
  for (let i = 0; i < itemIndex; i++) {
    const currentItem = localItems.value[i]
    const itemSize = ELEMENT_SIZES[currentItem.type]
    
    if (currentCol + itemSize.cols - 1 > GRID_COLS) {
      currentRow++
      currentCol = 1
    }
    
    if (i === itemIndex - 1) break
    
    currentCol += itemSize.cols
    if (currentCol > GRID_COLS) {
      currentRow++
      currentCol = 1
    }
  }
  
  return currentCol
}

const getItemGridRow = (item) => {
  const itemIndex = localItems.value.findIndex(i => i.id === item.id)
  if (itemIndex === -1) return 1
  
  if (itemIndex === 0) return 1
  
  let currentRow = 1
  let currentCol = 1
  
  for (let i = 0; i < itemIndex; i++) {
    const currentItem = localItems.value[i]
    const itemSize = ELEMENT_SIZES[currentItem.type]
    
    if (currentCol + itemSize.cols - 1 > GRID_COLS) {
      currentRow++
      currentCol = 1
    }
    
    currentCol += itemSize.cols
    if (currentCol > GRID_COLS) {
      currentRow++
      currentCol = 1
    }
  }
  
  return currentRow
}

const handleDragEnter = (event) => {
  event.preventDefault()
  isDragOver.value = true
  
  if (activeDraggedType.value) {
    showDragPreview.value = true
    showDropZone.value = true
    console.log('Drag enter: showing preview and drop zone')
  }
}

const handleDragOver = (event) => {
  event.preventDefault()
  event.dataTransfer.dropEffect = 'copy'
  
  if (activeDraggedType.value) {
    showDragPreview.value = true
    showDropZone.value = true
    
    const position = calculateDropPosition(event, activeDraggedType.value)
    dropZonePosition.value = position
    
    dragPreviewPosition.value = {
      x: event.clientX,
      y: event.clientY
    }
  }
}

const handleDrop = (event) => {
  event.preventDefault()
  
  let itemType = activeDraggedType.value
  
  if (!itemType) {
    itemType = event.dataTransfer.getData('text/plain')
  }
  
  if (itemType && ELEMENT_SIZES[itemType]) {
    const newItem = {
      id: Date.now() + Math.random(),
      type: itemType,
      selected: false
    }
    
    localItems.value.push(newItem)
    emit('update:items', localItems.value)
  }
  
  resetDragState()
}

const resetDragState = () => {
  isDragOver.value = false
  showDropZone.value = false
  showDragPreview.value = false
  localDraggedType.value = ''
}

const handleMouseMove = (event) => {
  if (showDragPreview.value && activeDraggedType.value) {
    dragPreviewPosition.value = {
      x: event.clientX,
      y: event.clientY
    }
  }
}

const handleDragLeave = (event) => {
  if (!event.currentTarget.contains(event.relatedTarget)) {
    resetDragState()
  }
}

const onDragStart = (event) => {
  const itemElement = event.item._underlying_vm_
  if (itemElement) {
    itemElement.selected = false
  }
}

const onDragEnd = (event) => {
  emit('update:items', localItems.value)
}

const onChange = (event) => {
  emit('update:items', localItems.value)
}

watch(() => props.items, (newItems) => {
  if (JSON.stringify(localItems.value) !== JSON.stringify(newItems)) {
    localItems.value = [...newItems]
  }
}, { deep: true, immediate: true })

watch(localItems, (newItems) => {
  emit('update:items', newItems)
}, { deep: true })

watch(() => props.draggedType, (newType) => {
  console.log('DashboardGrid: draggedType changed to:', newType)
  if (newType && ELEMENT_SIZES[newType]) {
    showDragPreview.value = true
    localDraggedType.value = newType
    console.log('DashboardGrid: showing drag preview and drop zone')
    
    if (localItems.value.length === 0) {
      showDropZone.value = true
      console.log('DashboardGrid: empty state, showing drop zone')
    }
  } else {
    showDragPreview.value = false
    showDropZone.value = false
    localDraggedType.value = ''
    console.log('DashboardGrid: hiding all placeholders')
  }
}, { immediate: true })

watch(() => localItems.value.length, (length) => {
  console.log('DashboardGrid: items length changed to:', length)
  if (length === 0 && activeDraggedType.value) {
    showDropZone.value = true
    console.log('DashboardGrid: empty state with dragged type, showing drop zone')
  }
})
</script>

<style scoped lang="scss">
.dashboard-grid {
  position: relative;
  width: 100%;
  height: 100%;
  min-height: calc(100vh - 200px);
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
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  grid-auto-rows: 150px;
  gap: 10px;
  padding: 10px;
  min-height: 100%;
  width: 100%;
}

.grid-item {
  background: var(--color-primary-background);
  border: 2px solid var(--color-border);
  border-radius: 8px;
  padding: 12px;
  cursor: move;
  transition: all 0.2s ease;
  position: relative;
  display: flex;
  flex-direction: column;
  
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
}

.item-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 10px;
  flex-shrink: 0;
}

.item-type {
  font-weight: 600;
  font-size: 14px;
  color: var(--color-text-primary);
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.item-actions {
  display: flex;
  gap: 5px;
  opacity: 0;
  transition: opacity 0.2s ease;
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
}

.item-preview {
  text-align: center;
  color: var(--color-text-secondary);
  font-size: 14px;
}

.drag-preview {
  background: linear-gradient(135deg, rgba(64, 64, 64, 0.95) 0%, rgba(32, 32, 32, 0.95) 100%);
  border: 3px solid rgba(255, 255, 255, 0.8);
  border-radius: 12px;
  padding: 16px 24px;
  font-size: 16px;
  font-weight: 700;
  color: white;
  backdrop-filter: blur(8px);
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.4), 0 0 0 1px rgba(255, 255, 255, 0.1);
  z-index: 9999;
  min-width: 120px;
  text-align: center;
  
  .preview-content {
    white-space: nowrap;
    text-shadow: 0 2px 4px rgba(0, 0, 0, 0.8);
    letter-spacing: 0.5px;
  }
}

.drop-zone-placeholder {
  background: rgba(255, 165, 0, 0.15);
  border: 3px dashed rgba(255, 165, 0, 0.7);
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  pointer-events: none;
  animation: placeholderPulse 1.5s ease-in-out infinite alternate;
  min-height: 150px;
  position: relative;
  
  &::before {
    content: '';
    position: absolute;
    inset: 4px;
    background: rgba(255, 165, 0, 0.08);
    border-radius: 4px;
  }
  
  .drop-zone-content {
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
    box-shadow: 0 2px 8px rgba(255, 165, 0, 0.2);
  }
}

@keyframes placeholderPulse {
  0% {
    opacity: 0.4;
    transform: scale(0.95);
    border-color: rgba(255, 165, 0, 0.5);
  }
  50% {
    opacity: 0.8;
    transform: scale(1.0);
    border-color: rgba(255, 165, 0, 0.9);
  }
  100% {
    opacity: 0.6;
    transform: scale(0.98);
    border-color: rgba(255, 165, 0, 0.7);
  }
}

.ghost-item {
  opacity: 0.3;
  background: var(--color-primary);
  border-color: var(--color-primary);
}

.chosen-item {
  border-color: var(--color-primary);
  box-shadow: 0 0 0 2px rgba(var(--color-primary-rgb), 0.3);
}

.drag-item {
  opacity: 0.8;
  transform: scale(1.02);
  box-shadow: 0 8px 20px rgba(0, 0, 0, 0.2);
}

.item-чарт {
  background: linear-gradient(135deg, var(--color-primary-background) 0%, rgba(var(--color-primary-rgb), 0.05) 100%);
}

.item-селектор {
  background: linear-gradient(135deg, var(--color-primary-background) 0%, rgba(54, 162, 235, 0.05) 100%);
}

.item-текст {
  background: linear-gradient(135deg, var(--color-primary-background) 0%, rgba(75, 192, 192, 0.05) 100%);
}

.item-заголовок {
  background: linear-gradient(135deg, var(--color-primary-background) 0%, rgba(255, 206, 86, 0.05) 100%);
}

.empty-drop-zone {
  position: absolute;
  top: 10px;
  left: 10px;
  right: 10px;
  bottom: 10px;
  z-index: 10;
  background: rgba(255, 165, 0, 0.2);
  border: 3px dashed rgba(255, 165, 0, 0.8);
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  pointer-events: none;
  animation: placeholderPulse 1.5s ease-in-out infinite alternate;
  
  .drop-zone-content {
    font-size: 18px;
    font-weight: 700;
    color: rgba(255, 140, 0, 1);
    text-transform: uppercase;
    letter-spacing: 1px;
    background: rgba(255, 255, 255, 0.95);
    padding: 16px 24px;
    border-radius: 25px;
    box-shadow: 0 4px 16px rgba(255, 165, 0, 0.3);
  }
}
</style> 