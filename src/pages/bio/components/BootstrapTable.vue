<script setup>
import { ref, watch, computed } from 'vue'
import { ChevronUp, ChevronDown } from 'lucide-vue-next'
import { sortData, paginateData, toggleSort as toggleSortHelper } from '@/pages/bio/js/table-helpers'
import CustomPaginator from '@/pages/bio/components/CustomPaginator.vue'

const props = defineProps({
  // Data
  data: { type: Array, required: true },
  loading: { type: Boolean, default: false },
  emptyMessage: { type: String, default: 'Нет данных' },

  // Pagination
  rowsPerPage: { type: Number, default: 10 },
  rowsPerPageOptions: { type: Array, default: () => [5, 10, 20, 50] },

  // Sorting
  initialSortField: { type: String, default: null },
  initialSortOrder: { type: Number, default: null },

  // Styling
  tableClass: { type: String, default: 'table table-hover table-striped table-bordered mb-0' },
  theadClass: { type: String, default: 'thead-light' },

  // Column config
  columns: { type: Array, default: () => [] },

  // Selection
  selectable: { type: Boolean, default: false },
})

const emit = defineEmits(['selection-change'])

// Sorting state
const sortField = ref(props.initialSortField)
const sortOrder = ref(props.initialSortOrder)

// Pagination state
const currentPage = ref(1)
const currentRowsPerPage = ref(props.rowsPerPage)

// Selection state
const selectedRows = ref([])

// Initialize sorting on mount
if (props.initialSortField && props.initialSortOrder) {
  sortField.value = props.initialSortField
  sortOrder.value = props.initialSortOrder
}

// Reset pagination when data changes (items added/removed)
watch(
  () => props.data.length,
  () => {
    currentPage.value = 1

    // Clean up selectedRows when data changes to prevent stale selections
    if (selectedRows.value.length > 0) {
      const validIds = new Set(props.data.map((item) => item.id))
      selectedRows.value = selectedRows.value.filter((id) => validIds.has(id))
      emit('selection-change', selectedRows.value)
    }
  },
)

// Handle sorting with 3 states (ascending, descending, none)
const toggleSort = (field) => {
  const result = toggleSortHelper(sortField.value, sortOrder.value, field)
  sortField.value = result.sortField
  sortOrder.value = result.sortOrder

  // Reset to first page when sorting changes
  currentPage.value = 1
}

// Handle page change
const handlePageChange = (page) => {
  currentPage.value = page
}

// Handle rows per page change
const handleRowsPerPageChange = (value) => {
  currentRowsPerPage.value = value
  currentPage.value = 1 // Reset to first page
}

// Sort the data
const sortedData = computed(() => {
  return sortData(props.data, sortField.value, sortOrder.value)
})

// Calculate current page data
const paginatedData = computed(() => {
  return paginateData(sortedData.value, currentPage.value, currentRowsPerPage.value)
})

// Selection methods
const isSelected = (row) => {
  return selectedRows.value.includes(row.id)
}

const selectRow = (row, checked) => {
  if (checked) {
    if (!isSelected(row)) {
      selectedRows.value.push(row.id)
    }
  } else {
    const index = selectedRows.value.indexOf(row.id)
    if (index > -1) {
      selectedRows.value.splice(index, 1)
    }
  }
  emit('selection-change', selectedRows.value)
}

const selectAllVisible = (checked) => {
  if (checked) {
    // Add all visible rows that aren't already selected
    paginatedData.value.forEach((row) => {
      if (row.id && !selectedRows.value.includes(row.id)) {
        selectedRows.value.push(row.id)
      }
    })
  } else {
    // Remove all visible rows
    const visibleIds = new Set(paginatedData.value.map((row) => row.id))
    selectedRows.value = selectedRows.value.filter((id) => !visibleIds.has(id))
  }
  emit('selection-change', selectedRows.value)
}

// Определяем состояние заголовка (выбраны все, не все, не выбраны)
const headerCheckboxState = computed(() => {
  const visibleIds = paginatedData.value.map((row) => row.id)
  // Если нет видимых строк, вернуть "none"
  if (visibleIds.length === 0) return 'none'

  // Проверяем, все ли видимые строки выбраны
  const allSelected = visibleIds.every((id) => selectedRows.value.includes(id))
  if (allSelected) return 'all'

  // Проверяем, выбрана ли хотя бы одна видимая строка
  const someSelected = visibleIds.some((id) => selectedRows.value.includes(id))
  if (someSelected) return 'some'

  // Ничего не выбрано
  return 'none'
})

// Очистка выбора
const clearSelection = () => {
  selectedRows.value = []
  emit('selection-change', selectedRows.value)
}

// Предоставить доступ к выбранным строкам извне
defineExpose({
  selectedRows,
  clearSelection,
})
</script>

<template>
  <div class="bootstrap-table-container">
    <div class="table-responsive" :class="{ 'no-data': data.length === 0 }">
      <table :class="tableClass">
        <thead :class="theadClass">
          <tr>
            <!-- Checkbox column header -->
            <th v-if="selectable" scope="col" class="selection-column">
              <div class="d-flex justify-content-center">
                <div class="form-check m-0">
                  <input
                    class="form-check-input"
                    type="checkbox"
                    :checked="headerCheckboxState === 'all'"
                    :indeterminate="headerCheckboxState === 'some'"
                    @click.stop="selectAllVisible(headerCheckboxState !== 'all')"
                  />
                </div>
              </div>
            </th>

            <!-- Regular columns -->
            <template v-for="(column, index) in columns" :key="index">
              <th
                scope="col"
                class="fw-bold text-dark-emphasis"
                :class="{ sortable: column.sortable }"
                @click="column.sortable && toggleSort(column.field)"
              >
                <div class="d-flex align-items-center">
                  <span>{{ column.header }}</span>
                  <div v-if="column.sortable" class="sort-icon">
                    <ChevronUp v-if="sortField === column.field && sortOrder === 1" :size="16" />
                    <ChevronDown v-if="sortField === column.field && sortOrder === -1" :size="16" />
                  </div>
                </div>
              </th>
            </template>
            <slot name="header"></slot>
          </tr>
        </thead>
        <tbody>
          <template v-if="loading">
            <tr>
              <td
                :colspan="(selectable ? 1 : 0) + columns.length + (!!$slots.header ? 1 : 0)"
                class="text-center py-4"
              >
                <div class="spinner-border text-primary" role="status">
                  <span class="visually-hidden">Загрузка...</span>
                </div>
              </td>
            </tr>
          </template>
          <template v-else-if="paginatedData.length === 0">
            <tr>
              <td
                :colspan="(selectable ? 1 : 0) + columns.length + (!!$slots.header ? 1 : 0)"
                class="text-center py-3"
              >
                {{ emptyMessage }}
              </td>
            </tr>
          </template>
          <template v-else>
            <tr
              v-for="(row, rowIndex) in paginatedData"
              :key="row.id || rowIndex"
              class="text-dark-emphasis"
              :class="{ 'selected-row': isSelected(row) }"
            >
              <!-- Row selection checkbox -->
              <td v-if="selectable" class="selection-column">
                <div class="d-flex justify-content-center">
                  <div class="form-check m-0">
                    <input
                      class="form-check-input"
                      type="checkbox"
                      :checked="isSelected(row)"
                      @click.stop="selectRow(row, !isSelected(row))"
                    />
                  </div>
                </div>
              </td>

              <!-- Regular columns -->
              <template v-for="(column, colIndex) in columns" :key="`${rowIndex}-${colIndex}`">
                <td>
                  <slot
                    :name="`cell-${column.field}`"
                    :data="row"
                    :rowIndex="rowIndex"
                    :colIndex="colIndex"
                  >
                    {{ row[column.field] !== undefined ? row[column.field] : '-' }}
                  </slot>
                </td>
              </template>
              <slot name="row-actions" :row="row" :rowIndex="rowIndex"></slot>
            </tr>
          </template>
        </tbody>
      </table>
    </div>

    <!-- Paginator -->
    <CustomPaginator
      :totalItems="sortedData.length"
      :initialRowsPerPage="currentRowsPerPage"
      :rowsPerPageOptions="rowsPerPageOptions"
      :initialPage="currentPage"
      @page-change="handlePageChange"
      @rows-per-page-change="handleRowsPerPageChange"
    />
  </div>
</template>

<style scoped lang="scss">
.sortable {
  cursor: pointer;
  user-select: none;

  &:hover {
    background-color: rgba(0, 0, 0, 0.03);
  }

  .d-flex {
    justify-content: space-between;
  }

  .sort-icon {
    width: 16px;
    display: inline-flex;
    justify-content: center;
    margin-left: 4px;
  }
}

.selection-column {
  width: 45px;
  min-width: 45px;
  max-width: 45px;
  vertical-align: middle;
}

:deep(.table tr.selected-row > td) {
  background-color: rgba(var(--bs-primary-rgb), 0.07) !important;
}

td.actions-column {
  vertical-align: middle;
}

:deep(td) {
  vertical-align: middle !important;
  height: 100%;
}

:deep(tr) {
  height: 100%;
}

.table-responsive {
  min-height: 255px;

  &.no-data {
    min-height: auto;
  }
}
</style>
