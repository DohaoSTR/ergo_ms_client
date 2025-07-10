/**
 * Вспомогательные функции для работы с таблицами (Bootstrap)
 */

import { abundanceOptions } from '@/pages/bio/js/bio-constants'

/**
 * Сортирует данные по указанному полю и порядку
 * @param {Array} data - Массив данных для сортировки
 * @param {string} field - Поле, по которому производится сортировка
 * @param {number} order - Порядок сортировки (1 для возрастания, -1 для убывания, null для отмены сортировки)
 * @returns {Array} Отсортированный массив
 */
export const sortData = (data, field, order) => {
  if (!field || order === null || order === undefined || !Array.isArray(data)) {
    return [...data]
  }

  return [...data].sort((a, b) => {
    let valueA = a[field]
    let valueB = b[field]

    // Handle null/undefined values
    if (valueA == null && valueB == null) return 0
    if (valueA == null) return order > 0 ? 1 : -1
    if (valueB == null) return order > 0 ? -1 : 1

    if (field === 'abundance') {
      const abundanceOrder = Object.fromEntries(
        abundanceOptions.map((item, index) => [item.value, index + 1]),
      )
      const orderA = abundanceOrder[valueA] || 0
      const orderB = abundanceOrder[valueB] || 0
      return order * (orderA - orderB)
    }

    if (
      field === 'date' ||
      (typeof valueA === 'string' &&
        valueA.match(/^\d{4}-\d{2}-\d{2}/) &&
        typeof valueB === 'string' &&
        valueB.match(/^\d{4}-\d{2}-\d{2}/))
    ) {
      return order * (new Date(valueA) - new Date(valueB))
    }

    if (typeof valueA === 'number' && typeof valueB === 'number') {
      return order * (valueA - valueB)
    }

    // For string fields
    return order * String(valueA).localeCompare(String(valueB))
  })
}

/**
 * Переключает состояние сортировки с циклом через три состояния: по возрастанию, по убыванию, без сортировки
 * @param {string} currentSortField - Текущее поле сортировки
 * @param {number|null} currentSortOrder - Текущий порядок сортировки (1, -1 или null)
 * @param {string} field - Поле, для которого переключается сортировка
 * @param {boolean} allowNoSort - Разрешать ли третье состояние (без сортировки), по умолчанию true
 * @returns {Object} Объект с обновленными значениями { sortField, sortOrder }
 */
export const toggleSort = (currentSortField, currentSortOrder, field, allowNoSort = true) => {
  let newSortField = currentSortField
  let newSortOrder = currentSortOrder

  if (currentSortField === field) {
    if (currentSortOrder === 1) {
      newSortOrder = -1
    } else if (currentSortOrder === -1 && allowNoSort) {
      newSortOrder = null
      newSortField = null
    } else {
      newSortOrder = 1
    }
  } else {
    newSortField = field
    newSortOrder = 1
  }

  return { sortField: newSortField, sortOrder: newSortOrder }
}

/**
 * Разбивает данные на страницы
 * @param {Array} data - Массив данных для пагинации
 * @param {number} page - Номер текущей страницы (начиная с 1)
 * @param {number} rowsPerPage - Количество строк на странице
 * @returns {Array} Данные для текущей страницы
 */
export const paginateData = (data, page, rowsPerPage) => {
  if (!Array.isArray(data) || page < 1 || rowsPerPage < 1) {
    return []
  }

  const start = (page - 1) * rowsPerPage
  const end = start + rowsPerPage
  return data.slice(start, end)
}

/**
 * Вычисляет общее количество страниц
 * @param {number} totalItems - Общее количество элементов
 * @param {number} rowsPerPage - Количество строк на странице
 * @returns {number} Общее количество страниц
 */
export const calculateTotalPages = (totalItems, rowsPerPage) => {
  if (totalItems <= 0 || rowsPerPage <= 0) return 1
  return Math.ceil(totalItems / rowsPerPage)
}

/**
 * Генерирует массив номеров страниц для пагинации с эллипсисами
 * @param {number} currentPage - Текущая страница
 * @param {number} totalPages - Общее количество страниц
 * @param {number} delta - Количество страниц, отображаемых с каждой стороны от текущей
 * @returns {Array} Массив номеров страниц и эллипсисов ('...')
 */
export const generatePageNumbers = (currentPage, totalPages, delta = 1) => {
  if (totalPages <= 1) return [1]

  let pages = []

  // Always include first page
  pages.push(1)

  // Calculate range around current page
  const rangeStart = Math.max(2, currentPage - delta)
  const rangeEnd = Math.min(totalPages - 1, currentPage + delta)

  // Add ellipsis if there's a gap after page 1
  if (rangeStart > 2) {
    pages.push('...')
  }

  // Add pages in the range
  for (let i = rangeStart; i <= rangeEnd; i++) {
    pages.push(i)
  }

  // Add ellipsis if there's a gap before last page
  if (rangeEnd < totalPages - 1) {
    pages.push('...')
  }

  // Always include last page
  if (totalPages > 1) {
    pages.push(totalPages)
  }

  return pages
}

/**
 * Вычисляет диапазон видимых записей для текущей страницы
 * @param {number} currentPage - Текущая страница
 * @param {number} rowsPerPage - Количество строк на странице
 * @param {number} totalItems - Общее количество элементов
 * @returns {Object} Объект с началом и концом диапазона {start, end}
 */
export const calculateVisibleRange = (currentPage, rowsPerPage, totalItems) => {
  const start = Math.min((currentPage - 1) * rowsPerPage + 1, totalItems)
  const end = Math.min(start + rowsPerPage - 1, totalItems)
  return { start, end }
}
