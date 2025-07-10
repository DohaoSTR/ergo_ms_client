<script setup>
import { ref, watch, computed, onMounted, nextTick, onUnmounted } from 'vue'
import { Plus } from 'lucide-vue-next'
import { tierOptions, abundanceOptions } from '@/pages/bio/js/bio-constants'
import { getZoneTypeTranslation } from '@/pages/bio/js/bio-helpers'
import CustomDropdown from '@/pages/bio/components/CustomDropdown.vue'
import { PerfectScrollbar } from 'vue3-perfect-scrollbar'
import { useConsolidatedAnalysisStore } from '@/stores/consolidatedAnalysisStore'

const consolidatedStore = useConsolidatedAnalysisStore()

// Переменные для ограничения частоты обновления
let lastColumnUpdateTime = 0
let lastRowUpdateTime = 0
const THROTTLE_DELAY = 50 // миллисекунды

const props = defineProps({
  tableData: {
    type: Array,
    required: true,
  },

  sites: {
    type: Array,
    required: true,
  },

  loading: {
    type: Boolean,
    default: false,
  },
})

const emit = defineEmits(['update:tableData', 'add-site', 'add-species', 'cell-change'])

// Переменные для перетаскивания
const draggingRow = ref(null)
const draggingColumn = ref(null)
const dragOverRow = ref(null)
const dragOverColumn = ref(null)
const isDragging = ref(false) // Глобальное состояние перетаскивания

// Для плавного автоскроллинга
const isScrolling = ref(false)
const scrollDirectionY = ref(null) // 'up' или 'down'
const scrollDirectionX = ref(null) // 'left' или 'right'
const scrollSpeedY = ref(0)
const scrollSpeedX = ref(0)
const scrollAnimationId = ref(null)
const autoScrollThreshold = 80 // Расстояние от края для активации скроллинга
const maxScrollSpeed = 10 // Максимальная скорость скроллинга

// Состояния UI
const hoveringRowIndex = ref(null)
const hoveringColumnIndex = ref(null)
const editingTaxonIndex = ref(null)

const scrollbarRef = ref(null)

const showContextMenu = ref(false)
const contextMenuPosition = ref({ x: 0, y: 0 })
const contextMenuType = ref(null) // 'row' или 'column'
const contextMenuData = ref(null) // индекс строки или столбца

const localTableData = computed(() => consolidatedStore.tableData)
const localSites = computed(() => consolidatedStore.sites)

const updateSiteCountVariable = () => {
  const rootElement = document.documentElement
  rootElement.style.setProperty('--site-count', localSites.value.length)
}

watch(() => localSites.value.length, updateSiteCountVariable)

const getEditingValue = (rowIndex, field) => {
  const row = localTableData.value[rowIndex]
  return row ? row[field] : ''
}

const setEditingValue = (rowIndex, field, value) => {
  if (rowIndex < 0 || rowIndex >= localTableData.value.length) return

  // Сохраняем значение в хранилище
  consolidatedStore.updateCellValue(rowIndex, field, value)
  
  emit('update:tableData', consolidatedStore.tableData)
  emit('cell-change', rowIndex, field, value)
}

const handleDropdownChange = (rowIndex, field, value) => {
  setEditingValue(rowIndex, field, value)
}

const emptyImage = new Image()
emptyImage.src = 'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7'

const handleTableDragOver = (event) => {
  if (draggingRow.value === null && draggingColumn.value === null) return

  const scrollContainer = scrollbarRef.value?.ps?.element
  if (!scrollContainer) return

  const rect = scrollContainer.getBoundingClientRect()
  const mouseY = event.clientY
  const mouseX = event.clientX

  scrollDirectionY.value = null
  scrollDirectionX.value = null
  scrollSpeedY.value = 0
  scrollSpeedX.value = 0

  if (draggingRow.value !== null) {
    const fromTop = mouseY - rect.top
    const fromBottom = rect.bottom - mouseY

    if (fromTop < autoScrollThreshold) {
      const speedFactor = 1 - fromTop / autoScrollThreshold
      const speed = 1 + Math.floor(speedFactor * (maxScrollSpeed - 1))

      scrollDirectionY.value = 'up'
      scrollSpeedY.value = speed
    } else if (fromBottom < autoScrollThreshold) {
      const speedFactor = 1 - fromBottom / autoScrollThreshold
      const speed = 1 + Math.floor(speedFactor * (maxScrollSpeed - 1))

      scrollDirectionY.value = 'down'
      scrollSpeedY.value = speed
    }
  }

  if (draggingColumn.value !== null) {
    const fromLeft = mouseX - rect.left
    const fromRight = rect.right - mouseX

    if (fromLeft < autoScrollThreshold) {
      const speedFactor = 1 - fromLeft / autoScrollThreshold
      const speed = 1 + Math.floor(speedFactor * (maxScrollSpeed - 1))

      scrollDirectionX.value = 'left'
      scrollSpeedX.value = speed
    } else if (fromRight < autoScrollThreshold) {
      const speedFactor = 1 - fromRight / autoScrollThreshold
      const speed = 1 + Math.floor(speedFactor * (maxScrollSpeed - 1))

      scrollDirectionX.value = 'right'
      scrollSpeedX.value = speed
    }
  }

  if (scrollDirectionY.value || scrollDirectionX.value) {
    startSmoothScroll()
  } else {
    stopSmoothScroll()
  }
}

const startSmoothScroll = () => {
  if (isScrolling.value) return

  isScrolling.value = true

  const scrollAnimation = () => {
    const scrollContainer = scrollbarRef.value?.ps?.element
    if (!scrollContainer || !isScrolling.value) return

    if (scrollDirectionY.value === 'up') {
      scrollContainer.scrollTop -= scrollSpeedY.value
    } else if (scrollDirectionY.value === 'down') {
      scrollContainer.scrollTop += scrollSpeedY.value
    }

    if (scrollDirectionX.value === 'left') {
      scrollContainer.scrollLeft -= scrollSpeedX.value
    } else if (scrollDirectionX.value === 'right') {
      scrollContainer.scrollLeft += scrollSpeedX.value
    }

    if (scrollbarRef.value?.ps) {
      scrollbarRef.value.ps.update()
    }

    if (isScrolling.value) {
      scrollAnimationId.value = requestAnimationFrame(scrollAnimation)
    }
  }

  scrollAnimationId.value = requestAnimationFrame(scrollAnimation)
}

const stopSmoothScroll = () => {
  isScrolling.value = false
  scrollDirectionY.value = null
  scrollDirectionX.value = null
  scrollSpeedY.value = 0
  scrollSpeedX.value = 0

  if (scrollAnimationId.value) {
    cancelAnimationFrame(scrollAnimationId.value)
    scrollAnimationId.value = null
  }
}

const startDragRow = (index, event) => {
  if (!event || !event.dataTransfer) return

  draggingRow.value = index
  isDragging.value = true

  hoveringRowIndex.value = null
  hoveringColumnIndex.value = null

  event.dataTransfer.effectAllowed = 'move'
  event.dataTransfer.dropEffect = 'move'
  event.dataTransfer.setData('text/plain', `row-${index}`)

  event.dataTransfer.setDragImage(emptyImage, 0, 0)
  
  // Устанавливаем атрибут data-dragging-row для перетаскиваемой строки
  updateDraggingRowAttributes(index)
}

const onDragOverRow = (index, event) => {
  if (!event) return
  event.preventDefault()

  if (draggingColumn.value !== null) return

  if (draggingRow.value === null) return

  // Не обрабатываем перетаскивание над той же строкой, которую перетаскиваем
  if (draggingRow.value === index) {
    return
  }

  // Избегаем лишних обновлений, если мы уже над этой строкой
  if (dragOverRow.value === index) {
    return
  }

  // Применяем throttling для ограничения частоты обновлений
  const now = Date.now()
  if (now - lastRowUpdateTime > THROTTLE_DELAY) {
    lastRowUpdateTime = now
    
    // Очищаем предыдущие атрибуты
    clearDragOverRowAttributes()
    
    // Устанавливаем новые атрибуты
    updateDragOverRowAttributes(index)
    dragOverRow.value = index
  }
}

const onDragEnterRow = (index, event) => {
  event.preventDefault()

  if (draggingColumn.value !== null) return

  if (draggingRow.value === null) return

  // Не обрабатываем перетаскивание над той же строкой, которую перетаскиваем
  if (draggingRow.value === index) {
    return
  }

  // Избегаем лишних обновлений, если мы уже над этой строкой
  if (dragOverRow.value === index) {
    return
  }

  // Применяем throttling для ограничения частоты обновлений
  const now = Date.now()
  if (now - lastRowUpdateTime > THROTTLE_DELAY) {
    lastRowUpdateTime = now
    
    // Очищаем предыдущие атрибуты
    clearDragOverRowAttributes()
    
    // Устанавливаем новые атрибуты
    updateDragOverRowAttributes(index)
    dragOverRow.value = index
  }
}

const onDragLeaveRow = (index, event) => {
  if (!event) return

  if (draggingColumn.value !== null) return

  // Проверяем, действительно ли мы покидаем элемент
  // Это исключит срабатывание при переходе на дочерние элементы
  if (event.relatedTarget && event.currentTarget.contains(event.relatedTarget)) {
    return
  }

  if (dragOverRow.value === index) {
    // Не очищаем атрибуты сразу, а делаем это через небольшую задержку,
    // чтобы избежать моргания при быстром переходе между строками
    setTimeout(() => {
      // Проверяем, что за это время dragOverRow не изменился
      if (dragOverRow.value === index) {
        clearDragOverRowAttributes()
        dragOverRow.value = null
      }
    }, 50)
  }
}

const onDropRow = (index, event) => {
  if (!event) return
  event.preventDefault()

  if (draggingColumn.value !== null) return

  if (draggingRow.value === null || draggingRow.value === index) {
    draggingRow.value = null
    dragOverRow.value = null
    // Очищаем атрибуты при завершении перетаскивания
    clearDragOverRowAttributes()
    document.querySelectorAll('[data-dragging-row]').forEach(el => {
      el.removeAttribute('data-dragging-row')
    })
    return
  }

  const fromIndex = draggingRow.value
  const toIndex = index
  consolidatedStore.updateRowsOrder(fromIndex, toIndex)
  
  // Очищаем все атрибуты при завершении перетаскивания
  clearDragOverRowAttributes()
  document.querySelectorAll('[data-dragging-row]').forEach(el => {
    el.removeAttribute('data-dragging-row')
  })
  
  draggingRow.value = null
  dragOverRow.value = null

  updateScrollbar()
}

const startDragColumn = (index, event) => {
  draggingColumn.value = index
  isDragging.value = true

  hoveringRowIndex.value = null
  hoveringColumnIndex.value = null

  if (event.dataTransfer) {
    event.dataTransfer.effectAllowed = 'move'
    event.dataTransfer.setData('column-index', index.toString())
    event.dataTransfer.setDragImage(emptyImage, 0, 0)
  }

  // Устанавливаем атрибут data-dragging для перетаскиваемого столбца
  updateDraggingAttributes(index)
}

// Оптимизируем обработчик перетаскивания
const onDragOverColumn = (index, event) => {
  event.preventDefault()

  if (draggingRow.value !== null) {
    // Используем оптимизированную функцию getDataRows() вместо прямого обращения к DOM
    const rows = getDataRows()
    if (!rows.length) return

    for (let i = 0; i < rows.length; i++) {
      const rect = rows[i].getBoundingClientRect()
      if (event.clientY >= rect.top && event.clientY <= rect.bottom) {
        onDragEnterRow(i, event)
        return
      }
    }
    return
  }

  // Не обрабатываем перетаскивание над тем же столбцом, который перетаскивается
  if (draggingColumn.value === index) {
    return
  }

  // Избегаем лишних обновлений, если мы уже над этим столбцом
  if (dragOverColumn.value === index) {
    return
  }

  // Применяем throttling для ограничения частоты обновлений
  const now = Date.now()
  if (now - lastColumnUpdateTime > THROTTLE_DELAY) {
    lastColumnUpdateTime = now
    
    // Очищаем предыдущие атрибуты
    clearDragOverAttributes()
    
    // Устанавливаем новые атрибуты
    updateDragOverAttributes(index)
    dragOverColumn.value = index
  }
}

const onDragEnterColumn = (index, event) => {
  event.preventDefault()

  if (draggingRow.value !== null) {
    // Используем оптимизированную функцию getDataRows() вместо прямого обращения к DOM
    const rows = getDataRows()
    if (!rows.length) return

    for (let i = 0; i < rows.length; i++) {
      const rect = rows[i].getBoundingClientRect()
      if (event.clientY >= rect.top && event.clientY <= rect.bottom) {
        onDragEnterRow(i, event)
        return
      }
    }
    return
  }

  // Не обрабатываем перетаскивание над тем же столбцом, который перетаскивается
  if (draggingColumn.value === index) {
    return
  }

  // Избегаем лишних обновлений, если мы уже над этим столбцом
  if (dragOverColumn.value === index) {
    return
  }

  // Применяем throttling для ограничения частоты обновлений
  const now = Date.now()
  if (now - lastColumnUpdateTime > THROTTLE_DELAY) {
    lastColumnUpdateTime = now
    
    // Очищаем предыдущие атрибуты
    clearDragOverAttributes()
    
    // Устанавливаем новые атрибуты
    updateDragOverAttributes(index)
    dragOverColumn.value = index
  }
}

const onDragLeaveColumn = (index, event) => {
  if (draggingRow.value !== null) return

  // Проверяем, действительно ли мы покидаем элемент
  // Это исключит срабатывание при переходе на дочерние элементы
  if (event && event.relatedTarget) {
    const currentEl = event.currentTarget
    if (currentEl.contains(event.relatedTarget)) {
      return
    }
  }

  if (dragOverColumn.value === index) {
    // Не очищаем атрибуты сразу, а делаем это через небольшую задержку,
    // чтобы избежать моргания при быстром переходе между столбцами
    setTimeout(() => {
      // Проверяем, что за это время dragOverColumn не изменился
      if (dragOverColumn.value === index) {
        clearDragOverAttributes()
        dragOverColumn.value = null
      }
    }, 50)
  }
}

const onDropColumn = (index, event) => {
  event.preventDefault()
  event.stopPropagation()

  if (draggingRow.value !== null) {
    // Используем оптимизированную функцию getDataRows() вместо прямого обращения к DOM
    const rows = getDataRows()
    if (!rows.length) return

    for (let i = 0; i < rows.length; i++) {
      const rect = rows[i].getBoundingClientRect()
      if (event.clientY >= rect.top && event.clientY <= rect.bottom) {
        onDropRow(i, event)
        return
      }
    }
    return
  }

  if (
    draggingColumn.value === null ||
    draggingColumn.value === index ||
    index < 0 ||
    draggingColumn.value < 0
  ) {
    draggingColumn.value = null
    dragOverColumn.value = null
    // Очищаем атрибуты при завершении перетаскивания
    clearDragOverAttributes()
    document.querySelectorAll('[data-dragging]').forEach(el => {
      el.removeAttribute('data-dragging')
    })
    return
  }

  try {
    const fromIndex = draggingColumn.value
    const toIndex = index
    consolidatedStore.updateSitesOrder(fromIndex, toIndex)
    
    // Очищаем все атрибуты при завершении перетаскивания
    clearDragOverAttributes()
    document.querySelectorAll('[data-dragging]').forEach(el => {
      el.removeAttribute('data-dragging')
    })
    
    nextTick(() => {
      updateScrollbar()
    })
  } catch (error) {
    console.error('Ошибка при перетаскивании столбца:', error)
  }

  draggingColumn.value = null
  dragOverColumn.value = null
}

const addTaxonRow = (insertIndex = null) => {
  // Сохраняем в хранилище
  const result = consolidatedStore.addTaxon('', insertIndex)

  if (result.success) {
    // Находим индекс нового таксона для фокусировки
    const newIndex = insertIndex === -1 ? 0 : 
                   insertIndex !== null ? insertIndex + 1 : 
                   localTableData.value.length - 1
    
    // Сразу устанавливаем индекс редактируемого таксона
    editingTaxonIndex.value = newIndex
    
    // Ждем обновления DOM после изменения состояния
    nextTick(() => {
      // Находим новый таксон по его ID в обновленных данных
      const newRow = localTableData.value[newIndex]
      const inputElement = document.querySelector(`tr.taxon-row-${newRow.id} input`)
      if (inputElement) {
        inputElement.focus({ preventScroll: true })
      }
      updateScrollbar()
    })
  }
}

const addNewRow = (insertIndex = null) => {
  emit('add-species', insertIndex)
}

const addNewColumn = (insertIndex = null) => {
  emit('add-site', insertIndex)
}

const saveTaxonName = (rowIndex, value) => {
  if (rowIndex < 0 || rowIndex >= localTableData.value.length) return

  // Обновляем данные напрямую в хранилище
  consolidatedStore.updateCellValue(rowIndex, 'taxon_name', value)
  consolidatedStore.updateCellValue(rowIndex, 'isEditing', false)
  
  editingTaxonIndex.value = null
}

const editTaxonName = (rowIndex) => {
  if (rowIndex < 0 || rowIndex >= localTableData.value.length) return

  // Обновляем данные напрямую в хранилище
  consolidatedStore.updateCellValue(rowIndex, 'isEditing', true)
  
  editingTaxonIndex.value = rowIndex

  nextTick(() => {
    const inputElement = document.querySelector(
      `.taxon-row-${localTableData.value[rowIndex].id} input`,
    )
    if (inputElement) {
      inputElement.focus({ preventScroll: true })
    }
  })
}

const handleTaxonKeydown = (event, rowIndex) => {
  if (event.key === 'Enter') {
    saveTaxonName(rowIndex, event.target.value)
  } else if (event.key === 'Escape') {
    editingTaxonIndex.value = null
    
    if (!localTableData.value[rowIndex].taxon_name) {
      // Удаляем пустой таксон из хранилища
      consolidatedStore.removeRow(localTableData.value[rowIndex].id)
    } else {
      // Сбрасываем флаг редактирования
      consolidatedStore.updateCellValue(rowIndex, 'isEditing', false)
    }
  }
}

const handleRowMouseEnter = (index) => {
  if (draggingRow.value !== null || draggingColumn.value !== null || isDragging.value) return
  hoveringRowIndex.value = index
}

const handleRowMouseLeave = () => {
  if (draggingRow.value !== null || draggingColumn.value !== null || isDragging.value) return
  hoveringRowIndex.value = null
}

const handleColumnMouseEnter = (index) => {
  if (draggingRow.value !== null || draggingColumn.value !== null || isDragging.value) return
  hoveringColumnIndex.value = index
}

const handleColumnMouseLeave = () => {
  if (draggingRow.value !== null || draggingColumn.value !== null || isDragging.value) return
  hoveringColumnIndex.value = null
}

const updateScrollbar = async () => {
  await nextTick()
  if (scrollbarRef.value && scrollbarRef.value.ps) {
    scrollbarRef.value.ps.update()
  }
}

const removeRow = (index) => {
  if (index < 0 || index >= localTableData.value.length) return
  
  const rowId = localTableData.value[index].id
  
  // Сохраняем в хранилище
  consolidatedStore.removeRow(rowId)
  
  emit('update:tableData', consolidatedStore.tableData)
  
  updateScrollbar()
}

const removeColumn = (index) => {
  if (index < 0 || index >= localSites.value.length) return

  const siteId = localSites.value[index].id
  
  // Сохраняем в хранилище
  consolidatedStore.removeSite(siteId)
  
  emit('update:tableData', consolidatedStore.tableData)
  
  updateScrollbar()
}

// Используем вычисляемые свойства из хранилища
const emptySiteIds = computed(() => consolidatedStore.emptySiteIds)

const emptySpeciesIds = computed(() => consolidatedStore.emptySpeciesIds)

watch([() => localTableData.value.length, () => localSites.value.length], () => {
  updateScrollbar()
})

onMounted(() => {
  document.addEventListener('dragend', dragEnd)
  document.addEventListener('mouseup', handleGlobalMouseUp)
  document.addEventListener('click', handleGlobalClick)
  updateSiteCountVariable()
})

onUnmounted(() => {
  document.removeEventListener('dragend', dragEnd)
  document.removeEventListener('mouseup', handleGlobalMouseUp)
  document.removeEventListener('click', handleGlobalClick)

  stopSmoothScroll()
})

const handleGlobalMouseUp = () => {
  if (draggingRow.value !== null || draggingColumn.value !== null) {
    const tableContainer = document.querySelector('.consolidated-table-container')
    if (tableContainer) {
      tableContainer.classList.add('drag-just-ended')

      document.body.style.cursor = 'default'

      setTimeout(() => {
        tableContainer.classList.remove('drag-just-ended')
        document.body.style.cursor = ''
      }, 100)
    }
  }
}

const dragEnd = (event) => {
  // Сбрасываем переменные состояния
  draggingRow.value = null
  dragOverRow.value = null
  draggingColumn.value = null
  dragOverColumn.value = null
  isDragging.value = false
  
  // Очищаем все атрибуты data-* для визуализации
  clearDragOverAttributes()
  clearDragOverRowAttributes()
  document.querySelectorAll('[data-dragging]').forEach(el => {
    el.removeAttribute('data-dragging')
  })
  document.querySelectorAll('[data-dragging-row]').forEach(el => {
    el.removeAttribute('data-dragging-row')
  })

  // Сбрасываем индексы hovering
  hoveringRowIndex.value = null
  hoveringColumnIndex.value = null

  // Останавливаем скроллинг
  stopSmoothScroll()

  // Убираем курсор
  document.body.style.cursor = 'default'

  // Добавляем класс для предотвращения мгновенного срабатывания hover-эффектов
  const tableContainer = document.querySelector('.consolidated-table-container')
  if (tableContainer) {
    tableContainer.classList.add('drag-just-ended')

    setTimeout(() => {
      tableContainer.classList.remove('drag-just-ended')
      document.body.style.cursor = ''
    }, 100)
  }

  if (event) {
    event.preventDefault()
    event.stopPropagation()
  }
}

const handleContextMenu = (event, type, data) => {
  event.preventDefault()

  if (draggingRow.value !== null || draggingColumn.value !== null) {
    return
  }

  contextMenuType.value = type
  contextMenuData.value = data

  contextMenuPosition.value = {
    x: -9999,
    y: -9999,
  }
  showContextMenu.value = true

  nextTick(() => {
    const menuElement = document.querySelector('.context-menu')
    if (!menuElement) return

    const menuRect = menuElement.getBoundingClientRect()
    const menuWidth = menuRect.width
    const menuHeight = menuRect.height

    const windowWidth = window.innerWidth
    const windowHeight = window.innerHeight

    const cursorX = event.clientX
    const cursorY = event.clientY

    const hasSpaceBelow = cursorY + menuHeight <= windowHeight
    const hasSpaceRight = cursorX + menuWidth <= windowWidth

    let posX = cursorX
    let posY = cursorY

    if (!hasSpaceRight) {
      posX = cursorX - menuWidth
    }

    if (!hasSpaceBelow) {
      posY = cursorY - menuHeight
    }

    contextMenuPosition.value = {
      x: posX,
      y: posY,
    }
  })
}

const closeContextMenu = () => {
  showContextMenu.value = false
}

const handleContextMenuAction = (action) => {
  const index = contextMenuData.value

  switch (action) {
    case 'add-column-left':
      addNewColumn(index - 1)
      break
    case 'add-column-right':
      addNewColumn(index)
      break
    case 'add-species-above':
      addNewRow(index - 1)
      break
    case 'add-species-below':
      addNewRow(index)
      break
    case 'add-taxon-above':
      addTaxonRow(index - 1)
      break
    case 'add-taxon-below':
      addTaxonRow(index)
      break
    case 'remove-column':
      removeColumn(index)
      break
    case 'remove-row':
      removeRow(index)
      break
  }

  closeContextMenu()
}

const handleGlobalClick = (event) => {
  if (showContextMenu.value) {
    const menuElement = document.querySelector('.context-menu')
    if (menuElement && !menuElement.contains(event.target)) {
      closeContextMenu()
    }
  }
}

// Функция для получения строк таблицы
const getDataRows = () => {
  return Array.from(document.querySelectorAll('.data-row'));
}

// Функция для получения заголовков столбцов
const getSiteColumns = () => {
  return Array.from(document.querySelectorAll('.site-column'));
}

// Функция для обновления атрибутов data-dragging для перетаскиваемого столбца
const updateDraggingAttributes = (columnIndex) => {
  // Сначала удаляем все атрибуты dragging
  document.querySelectorAll('[data-dragging]').forEach(el => {
    el.removeAttribute('data-dragging')
  })
  
  // Заголовки столбцов
  const headers = getSiteColumns()
  if (headers[columnIndex]) {
    headers[columnIndex].setAttribute('data-dragging', 'true')
  }
  
  // Находим все строки в таблице
  const rows = getDataRows()
  
  // Устанавливаем атрибуты для ячеек в столбце
  rows.forEach(row => {
    // +4 для учета первых колонок (handle, name, author, tier)
    const cellIndex = columnIndex + 4
    const cells = Array.from(row.querySelectorAll('td'))
    if (cells.length > cellIndex) {
      cells[cellIndex].setAttribute('data-dragging', 'true')
    }
  })
}

// Функция для обновления атрибутов data-dragging-row
const updateDraggingRowAttributes = (rowIndex) => {
  // Сначала удаляем все атрибуты dragging-row
  document.querySelectorAll('[data-dragging-row]').forEach(el => {
    el.removeAttribute('data-dragging-row')
  })
  
  // Находим строку по индексу
  const rows = getDataRows()
  if (rows[rowIndex]) {
    rows[rowIndex].setAttribute('data-dragging-row', 'true')
  }
}

// Функция для обновления атрибутов data-drag-over-row
const updateDragOverRowAttributes = (rowIndex) => {
  // Запоминаем текущую выделенную строку
  const prevDragOver = document.querySelector('[data-drag-over-row="true"]')
  
  // Если перетаскивание над той же строкой, не делаем ничего
  if (prevDragOver) {
    const rowElemIndex = getDataRows()
      .findIndex(el => el.hasAttribute('data-drag-over-row'))
    if (rowElemIndex === rowIndex) {
      return // Уже установлен правильный атрибут
    }
  }

  // Сначала очищаем все существующие атрибуты
  clearDragOverRowAttributes()
  
  // Находим строку по индексу
  const rows = getDataRows()
  if (rows[rowIndex]) {
    rows[rowIndex].setAttribute('data-drag-over-row', 'true')
  }
}

// Функция для обновления data-drag-over атрибутов
const updateDragOverAttributes = (columnIndex) => {
  // Запоминаем текущий dragOver столбец
  const prevDragOver = document.querySelector('[data-drag-over="true"]')
  
  // Если перетаскивание над тем же столбцом, не делаем ничего
  if (prevDragOver) {
    const siteColumnIndex = getSiteColumns()
      .findIndex(el => el.hasAttribute('data-drag-over'))
    if (siteColumnIndex === columnIndex) {
      return // Уже установлен правильный атрибут
    }
  }

  // Сначала очищаем все существующие атрибуты
  clearDragOverAttributes()
  
  // Устанавливаем атрибут для заголовка столбца
  const headers = getSiteColumns()
  if (headers[columnIndex]) {
    headers[columnIndex].setAttribute('data-drag-over', 'true')
  }
  
  // Устанавливаем атрибуты для всех ячеек в столбце
  getDataRows().forEach(row => {
    // +4 для учета первых колонок (handle, name, author, tier)
    const cellIndex = columnIndex + 4
    const cells = Array.from(row.querySelectorAll('td'))
    if (cells.length > cellIndex) {
      cells[cellIndex].setAttribute('data-drag-over', 'true')
    }
  })
}

// Функция для очистки всех data-drag-over атрибутов
const clearDragOverAttributes = () => {
  // Находим все элементы с data-drag-over атрибутом
  const elements = document.querySelectorAll('[data-drag-over]')
  
  // Меняем атрибут на "fading" для анимации исчезновения
  elements.forEach(el => {
    el.removeAttribute('data-drag-over')
  })
}

// Функция для очистки всех data-drag-over-row атрибутов
const clearDragOverRowAttributes = () => {
  // Находим все элементы с data-drag-over-row атрибутом
  const elements = document.querySelectorAll('[data-drag-over-row]')
  
  // Удаляем атрибуты
  elements.forEach(el => {
    el.removeAttribute('data-drag-over-row')
  })
}
</script>

<template>
  <div
    class="consolidated-table-container"
    :class="{
      'no-data': localTableData.length === 0,
      'is-dragging': isDragging,
    }"
    @dragover="handleTableDragOver"
  >
    <PerfectScrollbar
      ref="scrollbarRef"
      class="horizontal-scroll"
      :options="{
        wheelSpeed: 1,
        wheelPropagation: true,
        minScrollbarLength: 40,
        suppressScrollX: false,
        suppressScrollY: false,
        swipeEasing: true,
      }"
    >
      <div class="table-wrapper">
        <table class="table table-striped mb-0">
          <thead>
            <tr>
              <th class="handle-column" :class="{ 'd-none': localTableData.length === 0 }"></th>
              <th class="title-column">Название вида</th>
              <th class="author-column">Автор</th>
              <th class="tier-column">Ярус</th>

              <!-- Заголовки площадок -->
              <th
                v-for="(site, siteIndex) in localSites"
                :key="site.id"
                class="site-column"
                @dragover.prevent="onDragOverColumn(siteIndex, $event)"
                @dragenter.prevent="onDragEnterColumn(siteIndex, $event)"
                @dragleave="onDragLeaveColumn(siteIndex, $event)"
                @drop.prevent="onDropColumn(siteIndex, $event)"
                @mouseenter="handleColumnMouseEnter(siteIndex)"
                @mouseleave="handleColumnMouseLeave"
                @contextmenu="handleContextMenu($event, 'column', siteIndex)"
              >
                <!-- Маркер столбца - теперь есть всегда с разным цветом -->
                <div
                  class="site-marker"
                  :class="{ 'site-marker-empty': emptySiteIds.includes(site.id) }"
                  v-tooltip :title="emptySiteIds.includes(site.id) ? 'Площадка пустая' : ''"
                ></div>

                <!-- Новая структура заголовка столбца -->
                <div class="site-header">
                  <!-- Верхняя панель с номером -->
                  <div class="site-header-top">
                    <!-- Номер площадки с цветным фоном в зависимости от типа местности -->
                    <div
                      :class="['site-number-badge', site.zone_type || 'default']"
                      v-tooltip :title="
                        site.zone_type
                          ? getZoneTypeTranslation(site.zone_type)
                          : 'Тип местности не указан'
                      "
                    >
                      {{ site.site_number }}
                    </div>
                  </div>

                  <!-- Контейнер для индикатора перетаскивания -->
                  <div
                    class="column-drag-container"
                    draggable="true"
                    @dragstart.stop="startDragColumn(siteIndex, $event)"
                    @dragend.stop="dragEnd($event)"
                  >
                    <div class="column-drag-indicator"></div>
                  </div>
                </div>
              </th>

              <!-- Столбец для добавления площадки, если не существует ни одной площадки -->
              <th v-if="localSites.length === 0" class="add-site-column">
                <button class="btn btn-sm btn-outline-primary" @click="addNewColumn()">
                  <Plus :size="16" class="me-1" />
                  <span>Добавить площадку</span>
                </button>
              </th>
            </tr>
          </thead>
          <tbody>
            <template v-if="loading">
              <tr>
                <td :colspan="4 + localSites.length" class="text-center py-4">
                  <div class="spinner-border text-primary" role="status">
                    <span class="visually-hidden">Загрузка...</span>
                  </div>
                </td>
              </tr>
            </template>
            <template v-else-if="localTableData.length === 0">
              <tr>
                <td :colspan="4 + localSites.length" class="text-center py-4">
                  <div class="empty-table-message">
                    <p class="mb-3">Нет данных для отображения</p>
                    <button class="btn btn-primary" @click="addNewRow()">
                      <Plus :size="16" class="me-1" />
                      <span>Добавить вид</span>
                    </button>
                  </div>
                </td>
              </tr>
            </template>
            <template v-else>
              <tr
                v-for="(row, rowIndex) in localTableData"
                :key="row.id"
                :class="{
                  'data-row': true,
                  'taxon-row': row.type === 'taxon',
                  [`taxon-row-${row.id}`]: row.type === 'taxon',
                }"
                @dragover="onDragOverRow(rowIndex, $event)"
                @dragenter="onDragEnterRow(rowIndex, $event)"
                @dragleave="onDragLeaveRow(rowIndex, $event)"
                @drop="onDropRow(rowIndex, $event)"
              >
                <!-- Ячейка с элементом перетаскивания строки -->
                <td
                  class="handle-column"
                  @mouseenter="handleRowMouseEnter(rowIndex)"
                  @mouseleave="handleRowMouseLeave"
                  @contextmenu="handleContextMenu($event, 'row', rowIndex)"
                >
                  <div class="handle-column-content">
                    <!-- Маркер строки - теперь есть всегда с разным цветом -->
                    <div
                      class="species-marker"
                      :class="{
                        'species-marker-empty':
                          row.type !== 'taxon' && emptySpeciesIds.includes(row.id),
                        'taxon-marker': row.type === 'taxon',
                        'invalid-species': row.type !== 'taxon' && (row.isValid === false || row.tierInvalid || row.invalidAbundances > 0)
                      }"
                      v-tooltip :title="
                        row.type === 'taxon'
                          ? ''
                          : emptySpeciesIds.includes(row.id)
                            ? 'Вид отсутствует на всех площадках'
                            : row.isValid === false || row.tierInvalid || row.invalidAbundances > 0
                              ? 'В строке есть невалидные значения'
                                : ''
                      "
                    ></div>

                    <!-- Контейнер для перетаскивания строки -->
                    <div
                      class="row-drag-container"
                      draggable="true"
                      @dragstart="startDragRow(rowIndex, $event)"
                      @dragend="dragEnd($event)"
                    >
                      <div class="row-drag-indicator"></div>
                    </div>
                  </div>
                </td>

                <!-- Для названий таксонов - специальное отображение -->
                <template v-if="row.type === 'taxon'">
                  <td :colspan="3 + localSites.length" class="taxon-cell">
                    <div
                      class="taxon-content"
                      v-if="row.isEditing || editingTaxonIndex === rowIndex"
                    >
                      <input
                        type="text"
                        class="form-control taxon-input"
                        :value="row.taxon_name"
                        placeholder="Введите название таксона растительного сообщества (например, союз Alnion incanae)"
                        @keydown="handleTaxonKeydown($event, rowIndex)"
                        @blur="saveTaxonName(rowIndex, $event.target.value)"
                      />
                    </div>
                    <div v-else class="taxon-name" @click="editTaxonName(rowIndex)">
                      {{
                        row.taxon_name ||
                        'Нажмите для ввода названия таксона растительного сообщества (например, союз Alnion incanae)'
                      }}
                    </div>
                  </td>
                </template>

                <!-- Для обычных строк оставляем стандартное отображение -->
                <template v-else>
                  <!-- Название вида -->
                  <td class="selectable-text" 
                      :class="{'invalid-field': row.isValid === false}"
                      v-tooltip :title="row.isValid === false ? row.validationMessage : ''">
                    <div class="d-flex align-items-center">
                      <span>{{ row.title }}</span>
                    </div>
                  </td>

                  <!-- Автор -->
                  <td class="selectable-text" 
                      :class="{'invalid-field': row.isValid === false}"
                      v-tooltip :title="row.isValid === false ? row.validationMessage : ''">
                    <div class="d-flex align-items-center">
                      <span>{{ row.author }}</span>
                    </div>
                  </td>

                  <!-- Ярус -->
                  <td class="p-0" :class="{'invalid-field': row.tierInvalid}">
                    <CustomDropdown
                      :value="getEditingValue(rowIndex, 'tier')"
                      :options="tierOptions"
                      :checkContainerBounds="true"
                      :displayValue="true"
                      :containerClasses="['consolidated-table-container', 'horizontal-scroll']"
                      v-tooltip :title="row.tierInvalid ? row.tierMessage : ''"
                      @update:value="(value) => handleDropdownChange(rowIndex, 'tier', value)"
                    />
                  </td>

                  <!-- Баллы обилия для каждой площадки -->
                  <td
                    v-for="(site, siteIndex) in localSites"
                    :key="`${row.id}-${site.id}`"
                    class="p-0"
                    :class="{
                      'invalid-field': row.abundanceMessages && row.abundanceMessages[`abundance_${site.id}`]
                    }"
                    @dragover.prevent="onDragOverColumn(siteIndex, $event)"
                    @dragenter.prevent="onDragEnterColumn(siteIndex, $event)"
                    @dragleave="onDragLeaveColumn(siteIndex, $event)"
                    @drop.prevent="onDropColumn(siteIndex, $event)"
                  >
                    <CustomDropdown
                      :value="row[`abundance_${site.id}`]"
                      :options="abundanceOptions"
                      :showEmptyOption="true"
                      :emptyOptionLabel="'Отсутствует'"
                      :displayValue="true"
                      :checkContainerBounds="true"
                      :containerClasses="['consolidated-table-container', 'horizontal-scroll']"
                      v-tooltip :title="row.abundanceMessages && row.abundanceMessages[`abundance_${site.id}`] || ''"
                      @update:value="
                        (value) => handleDropdownChange(rowIndex, `abundance_${site.id}`, value)
                      "
                    />
                  </td>
                </template>
              </tr>
            </template>
          </tbody>
        </table>
      </div>
    </PerfectScrollbar>

    <!-- Контекстное меню -->
    <div
      v-if="showContextMenu"
      class="context-menu"
      :style="{ top: `${contextMenuPosition.y}px`, left: `${contextMenuPosition.x}px` }"
    >
      <template v-if="contextMenuType === 'column'">
        <div class="context-menu-item" @click="handleContextMenuAction('add-column-left')">
          <Plus :size="12" class="me-1" />
          Добавить площадку слева
        </div>
        <div class="context-menu-item" @click="handleContextMenuAction('add-column-right')">
          <Plus :size="12" class="me-1" />
          Добавить площадку справа
        </div>
        <div
          class="context-menu-item text-danger"
          @click="handleContextMenuAction('remove-column')"
        >
          <span class="me-1">×</span>
          Удалить площадку
        </div>
      </template>

      <template v-else-if="contextMenuType === 'row'">
        <div class="context-menu-item" @click="handleContextMenuAction('add-species-above')">
          <Plus :size="12" class="me-1" />
          Добавить вид выше
        </div>
        <div class="context-menu-item" @click="handleContextMenuAction('add-species-below')">
          <Plus :size="12" class="me-1" />
          Добавить вид ниже
        </div>
        <div class="context-menu-item" @click="handleContextMenuAction('add-taxon-above')">
          <Plus :size="12" class="me-1" />
          Добавить таксон выше
        </div>
        <div class="context-menu-item" @click="handleContextMenuAction('add-taxon-below')">
          <Plus :size="12" class="me-1" />
          Добавить таксон ниже
        </div>
        <div class="context-menu-item text-danger" @click="handleContextMenuAction('remove-row')">
          <span class="me-1">×</span>
          Удалить {{ localTableData[contextMenuData]?.type === 'taxon' ? 'таксон' : 'вид' }}
        </div>
      </template>
    </div>
  </div>
</template>

<style scoped lang="scss">
.consolidated-table-container {
  border-radius: 0 0 var(--bs-border-radius) var(--bs-border-radius);
  position: relative;
  overflow: hidden;
  max-height: 70vh;
  display: flex;
  flex-direction: column;
  min-height: 350px;

  &.no-data {
    height: auto;
    min-height: auto;
  }
}

.table-wrapper {
  min-width: 100%;
}

.horizontal-scroll {
  flex: 1;
  position: relative;
  overflow: auto;
  max-height: 100%;
}

// Стиль для номера площадки
.site-number-badge {
  padding: 2px 6px;
  border-radius: 4px;
  font-weight: 500;
  font-size: 0.9rem;
  text-align: center;

  &.forest {
    background-color: rgba(25, 135, 84, 0.15);
    color: var(--bs-success);
  }

  &.meadow {
    background-color: rgba(255, 193, 7, 0.15);
    color: var(--bs-warning);
  }

  &.default {
    background-color: rgba(var(--bs-secondary-rgb), 0.1);
    color: var(--bs-secondary);
  }
}

.handle-column-content {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 100%;
  width: 100%;
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
}

:deep(.table) {
  margin-bottom: 0;
  border-collapse: separate;
  border-spacing: 0;
  position: relative;
  width: 100%;
  table-layout: auto;

  // Фиксация минимальной высоты строк для всех браузеров
  tr {
    min-height: 66px;
    height: 66px; // Явно устанавливаем высоту строки
  }

  // Настройки выравнивания для ячеек
  td {
    vertical-align: top; // Выравнивание содержимого по верху
  }

  th,
  td {
    border: 1px solid var(--bs-border-color);
  }

  /* При наличии площадок, делаем их равномерными */
  .site-column:first-of-type:not(:last-of-type),
  .site-column:not(:first-of-type):not(:last-of-type) {
    width: calc((100% - 75% - 46px) / var(--site-count, 1));
  }

  /* Удаляем внешние границы таблицы, чтобы не было двойных границ */
  border: none;
}

/* Настройка внешнего вида скроллбаров PerfectScrollbar */
:deep(.ps) {
  .ps__rail-x,
  .ps__rail-y {
    background-color: transparent !important;
    z-index: 100;
  }

  .ps__rail-x {
    height: 8px;

    &:hover {
      height: 8px;
    }
  }

  .ps__rail-y {
    width: 8px;

    &:hover {
      width: 8px;
    }
  }

  .ps__thumb-x,
  .ps__thumb-y {
    background-color: var(--bs-secondary) !important;
  }

  .ps__thumb-x {
    height: 7px;
    bottom: 1px;

    &:hover {
      height: 7px;
    }
  }

  .ps__thumb-y {
    width: 7px;
    right: 1px;

    &:hover {
      width: 7px;
    }
  }
}

// Закрепление заголовка таблицы
:deep(thead) {
  position: sticky !important;
  top: 0 !important;
  z-index: 50 !important;
  /* Комбинация свойств для предотвращения прыжков в Chrome */
  will-change: transform !important;

  tr {
    background-color: var(--bs-table-bg);
  }

  th {
    position: relative;
    background-color: var(--bs-table-bg);
    box-sizing: border-box;

    border-top: 1px solid var(--bs-border-color) !important;
    border-bottom: 1px solid var(--bs-border-color) !important;
    border-left: 1px solid var(--bs-border-color) !important;
    border-right: 1px solid var(--bs-border-color) !important;

    &::after {
      content: '';
      position: absolute;
      left: 0;
      right: 0;
      bottom: -1px;
      height: 1px;
      background-color: rgba(0, 0, 0, 0.05);
      z-index: 1;
    }
  }
}

// Обеспечиваем возможность выхода дропдаунов за границы таблицы
:deep(.dropdown-menu) {
  z-index: 1050 !important; // Высокий z-index для отображения поверх всего
}

// Ширина столбцов
.handle-column {
  padding: 0;
  white-space: nowrap; /* Не разрывать содержимое на новые строки */
  position: relative;
  height: 100%;
  width: calc(4px + 4px + 1rem);
  min-width: calc(4px + 4px + 1rem);
  max-width: calc(4px + 4px + 1rem);
}

// Стили для ячеек таблицы
:deep(td) {
  height: 100%;
}

:deep(tr) {
  height: 100%;
}

// Стили для выделения текста
.selectable-text {
  user-select: text;
  cursor: text;
}

.title-column {
  min-width: 200px;
  width: 20%;
}

.author-column {
  min-width: 170px;
  width: 15%;
}

.tier-column {
  min-width: 100px;
  width: 10%;
}

// Для столбцов с площадками - динамическое распределение с минимальным размером
.site-column {
  min-width: 90px;
  position: relative;
  padding: 0;
  box-sizing: border-box;
}

// Обновленный стиль заголовка площадок
.site-header {
  display: flex;
  flex-direction: column;
  align-items: center;
  width: 100%;
  height: 100%;
  position: relative;

  .site-header-top {
    display: flex;
    flex-direction: column;
    align-items: center;
    width: 100%;
    padding: 0.5rem;
  }

  // Контейнер для индикатора перетаскивания
  .column-drag-container {
    border-top: 2px solid var(--bs-border-color);
    width: 100%;
    padding: 0.5rem;
    cursor: grab;
    display: flex;
    justify-content: center;
    align-items: center;

    &:hover {
      background-color: rgba(var(--bs-primary-rgb), 0.1);
      transition: 0.2s ease;

      .column-drag-indicator {
        background-color: var(--bs-primary);
        transition: 0.2s ease;
      }
    }

    &:active {
      cursor: grabbing;
    }
  }

  // Сам индикатор теперь стал меньше и проще
  .column-drag-indicator {
    width: 35px;
    height: 4px;
    background-color: var(--bs-secondary);
    border-radius: 2px;
    transition: 0.2s ease;
  }
}

// Контейнер для индикатора перетаскивания строки
.row-drag-container {
  width: 100%;
  height: 100%;
  display: flex;
  justify-content: center;
  align-items: center;
  cursor: grab;
  padding: 0.5rem;
  box-sizing: border-box;
  transition: 0.2s ease;
  flex-shrink: 0;
  margin-left: 4px;

  .row-drag-indicator {
    flex-shrink: 0;
  }

  &:hover {
    background-color: rgba(var(--bs-primary-rgb), 0.1);
    transition: 0.2s ease;

    .row-drag-indicator {
      background-color: var(--bs-primary);
      transition: 0.2s ease;
    }
  }

  &:active {
    cursor: grabbing;
  }
}

// Индикатор перетаскивания строки
.row-drag-indicator {
  width: 4px;
  height: 35px;
  background-color: var(--bs-secondary);
  border-radius: 2px;
  transition: 0.2s ease;
}

// Стили для маркеров
.site-marker {
  height: 4px;
  width: 100%;
  background-color: rgba(var(--bs-success-rgb), 0.3);
  border-bottom-right-radius: 6px;
  border-bottom-left-radius: 6px;
}

.site-marker-empty {
  background-color: rgba(var(--bs-warning-rgb), 0.7);
}

.species-marker {
  width: 4px;
  height: 100%;
  background-color: rgba(var(--bs-success-rgb), 0.3);
  border-top-right-radius: 6px;
  border-bottom-right-radius: 6px;
  position: absolute;
  left: 0;
  flex-shrink: 0; /* Запрещаем сжатие */
}

.species-marker-empty {
  background-color: rgba(var(--bs-warning-rgb), 0.7);
}

.invalid-species {
  background-color: rgba(var(--bs-danger-rgb), 0.7) !important;
}

// Добавляем стиль для кнопки добавления площадки
.add-site-column {
  min-width: 180px;
  text-align: center;
  transition: 0.2s ease;

  .btn {
    white-space: nowrap;
    display: inline-flex;
    align-items: center;
    transition: 0.2s ease;
  }
}

// Стили для пустой таблицы
.empty-table-message {
  padding: 1rem;

  p {
    color: var(--bs-secondary);
    font-size: 1rem;
  }

  .btn {
    display: inline-flex;
    align-items: center;
    transition: 0.2s ease;
  }
}

// Добавляем стиль для оверлея
.column-drag-overlay {
  background-color: rgba(var(--bs-primary-rgb), 0.05);
  box-shadow: 0 0 0 1px rgba(var(--bs-primary-rgb), 0.1);
  pointer-events: none;
}

// Стили для строк - используем более строгие правила
.data-row {
  position: relative;
}

// Стили для таксономических строк
.taxon-row {
  background-color: rgba(var(--bs-info-rgb), 0.01) !important;

  // Переопределяем стили bootstrap-таблицы с высокой специфичностью
  &.taxon-row td,
  &.taxon-row:nth-of-type(odd) td {
    background-color: rgba(var(--bs-info-rgb), 0.01) !important;
  }

  .taxon-cell {
    padding: 0.25rem 0.75rem;
    vertical-align: middle !important;

    .taxon-content {
      width: 100%;
    }

    .taxon-input {
      width: 100%;
      height: 32px;
      padding: 0.25rem 0.5rem;
      font-size: 0.95rem;
      text-align: left;
    }

    .taxon-name {
      font-weight: 600;
      padding: 0.3rem 0;
      cursor: pointer;
      min-height: 32px;
      display: flex;
      align-items: center;

      &:hover {
        text-decoration: underline;
      }
    }
  }
}

// Дополнительно принудительно устанавливаем фон для полосатой таблицы
:deep(.table-striped) {
  > tbody > tr.taxon-row:nth-of-type(odd) > * {
    background-color: rgba(var(--bs-info-rgb), 0.05) !important;
  }

  > tbody > tr.taxon-row:hover > * {
    background-color: rgba(var(--bs-info-rgb), 0.1) !important;
  }
}

// Стили для маркера таксономической строки
.taxon-marker {
  background-color: rgba(var(--bs-info-rgb), 0.3) !important;
}

// Блокировка hover-эффектов при перетаскивании
.is-dragging,
.drag-just-ended {
  // Блокируем hover на строках таблицы
  :deep(.table tbody tr:hover > *) {
    background-color: inherit !important;
  }

  // Специально для таксонов сохраняем правильный фон
  :deep(.table tbody tr.taxon-row:nth-of-type(odd) > *) {
    background-color: rgba(var(--bs-info-rgb), 0.05) !important;
  }

  :deep(.table tbody tr.taxon-row:nth-of-type(even) > *) {
    background-color: rgba(var(--bs-info-rgb), 0.01) !important;
  }

  // Блокируем hover-эффекты для элементов перетаскивания
  .row-drag-container:hover,
  .column-drag-container:hover {
    background-color: transparent !important;

    .row-drag-indicator,
    .column-drag-indicator {
      background-color: var(--bs-secondary) !important;
    }
  }

  // Принудительный сброс курсора
  * {
    cursor: default !important;
  }

  .row-drag-container,
  .column-drag-container {
    cursor: grab !important;
  }
}

// Собственные стили для hover на строках
:deep(.table tbody tr) {
  transition: background-color 0.05s ease;

  // Hover-эффект для строк таблицы
  &:hover:not(.taxon-row) > * {
    background-color: rgba(var(--bs-secondary-rgb), 0.1);
  }

  // Специальный эффект для таксономических строк
  &.taxon-row:hover > * {
    background-color: rgba(var(--bs-info-rgb), 0.1) !important;
  }
}

td .custom-dropdown {
  position: absolute !important;
  top: 0 !important;
  left: 0 !important;
  right: 0 !important;
  bottom: 0 !important;
  width: 100% !important;
  height: 100% !important;
}

/* Принудительная высота для синтетической таблицы bootstrap */
:deep(td.p-0) {
  padding: 0 !important;
  height: 100% !important;
  position: relative !important;

  > div {
    height: 100% !important;
  }
}

// Стили для контекстного меню
.context-menu {
  position: fixed;
  z-index: 2000;
  background: var(--bs-body-bg);
  border: 1px solid var(--bs-border-color);
  border-radius: var(--bs-border-radius);
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
  padding: 4px 0;
  min-width: 180px;

  .context-menu-item {
    padding: 6px 12px;
    cursor: pointer;
    display: flex;
    align-items: center;
    font-size: 0.9rem;

    &:hover {
      background-color: rgba(var(--bs-primary-rgb), 0.1);
    }

    &.text-danger:hover {
      background-color: rgba(var(--bs-danger-rgb), 0.1);
    }
  }
}

// Стили для индикации невалидных данных
.invalid-field {
  color: var(--bs-danger) !important;
  background-color: rgba(var(--bs-danger-rgb), 0.05) !important;
  position: relative;
  
  &:hover {
    background-color: rgba(var(--bs-danger-rgb), 0.1) !important;
  }
}

// Стили для столбца, над которым находится перетаскиваемый элемент,
// используем CSS-переменную для более эффективной работы
:deep([data-drag-over="true"]) {
  position: relative;
  
  &::before {
    content: '';
    position: absolute;
    top: 0;
    left: -2px;
    right: -2px;
    bottom: 0;
    border-left: 2px dashed var(--bs-primary);
    border-right: 2px dashed var(--bs-primary);
    pointer-events: none;
    z-index: 11;
    background-color: rgba(var(--bs-primary-rgb), 0.05);
    animation: fadeIn 0.15s ease-in;
  }
}

@keyframes fadeIn {
  from {
    opacity: 0.7;
  }
  to {
    opacity: 1;
  }
}

// Стили для перетаскиваемого столбца (с атрибутом data-dragging)
:deep([data-dragging="true"]) {
  opacity: 0.5 !important;
  background-color: rgba(var(--bs-primary-rgb), 0.05) !important;
  z-index: 10 !important;
  position: relative !important;

  &::before {
    content: '';
    position: absolute;
    top: 0;
    left: -2px;
    right: -2px;
    bottom: -1px;
    border-left: 2px solid var(--bs-primary);
    border-right: 2px solid var(--bs-primary);
    pointer-events: none;
    z-index: 20;
  }
}

// Стили для перетаскиваемой строки
:deep([data-dragging-row="true"]) {
  opacity: 0.5 !important;
  background-color: rgba(var(--bs-primary-rgb), 0.05) !important;
  z-index: 10 !important;
  position: relative !important;

  &::after {
    content: '';
    position: absolute;
    inset: -1px;
    border-top: 2px solid var(--bs-primary);
    border-bottom: 2px solid var(--bs-primary);
    pointer-events: none;
    z-index: 25;
  }
}

// Стили для строки, над которой находится перетаскиваемый элемент
:deep([data-drag-over-row="true"]) {
  position: relative;
  
  &::after {
    content: '';
    position: absolute;
    top: -1px;
    left: 0;
    right: 0;
    bottom: -1px;
    border-top: 2px dashed var(--bs-primary);
    border-bottom: 2px dashed var(--bs-primary);
    border-left: none;
    border-right: none;
    pointer-events: none;
    z-index: 12;
    background-color: rgba(var(--bs-primary-rgb), 0.05);
    animation: fadeIn 0.15s ease-in;
  }
}

@keyframes fadeIn {
  from {
    opacity: 0.7;
  }
  to {
    opacity: 1;
  }
}

// Для столбцов с площадками - динамическое распределение с минимальным размером
.site-column {
  min-width: 90px;
  position: relative;
  padding: 0;
  box-sizing: border-box;
}
</style>

