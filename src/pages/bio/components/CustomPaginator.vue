<script setup>
import { ref, computed, watch } from 'vue'
import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from 'lucide-vue-next'
import {
  calculateTotalPages,
  generatePageNumbers,
  calculateVisibleRange,
} from '@/pages/bio/js/table-helpers'

const props = defineProps({
  totalItems: { type: Number, required: true },
  initialRowsPerPage: { type: Number, default: 10 },
  rowsPerPageOptions: { type: Array, default: () => [5, 10, 20, 50] },
  initialPage: { type: Number, default: 1 },
})

const emit = defineEmits(['page-change', 'rows-per-page-change'])

// Pagination state
const currentPage = ref(props.initialPage)
const currentRowsPerPage = ref(props.initialRowsPerPage)

// Watch for changes in initialPage from parent
watch(
  () => props.initialPage,
  (newPage) => {
    currentPage.value = newPage
  },
)

// Reset pagination when total items changes
watch(
  () => props.totalItems,
  () => {
    const totalPages = calculateTotalPages(props.totalItems, currentRowsPerPage.value)
    if (currentPage.value > totalPages) {
      currentPage.value = Math.max(1, totalPages)
    }
  },
)

// Calculate total pages
const totalPages = computed(() => {
  return calculateTotalPages(props.totalItems, currentRowsPerPage.value)
})

// Calculate visible range
const visibleRange = computed(() => {
  return calculateVisibleRange(currentPage.value, currentRowsPerPage.value, props.totalItems)
})

// Create array of page numbers for pagination
const pageNumbers = computed(() => {
  return generatePageNumbers(currentPage.value, totalPages.value)
})

// Handle page navigation
const goToPage = (page) => {
  if (page >= 1 && page <= totalPages.value) {
    currentPage.value = page
    emit('page-change', page)
  }
}

// Handle rows per page change
const handleRowsPerPageChange = (value) => {
  currentRowsPerPage.value = value
  currentPage.value = 1 // Reset to first page
  emit('rows-per-page-change', value)
  emit('page-change', 1)
}
</script>

<template>
  <div
    class="d-flex flex-column flex-md-row justify-content-between align-items-center gap-3 custom-paginator"
  >
    <!-- Information about displayed rows -->
    <div class="pagination-info text-muted">
      Показано {{ visibleRange.start }}-{{ visibleRange.end }} из {{ totalItems }} записей
    </div>

    <!-- Pagination controls -->
    <div class="d-flex align-items-center gap-3">
      <!-- Rows per page dropdown -->
      <div class="d-flex align-items-center gap-2">
        <span class="text-muted">Строк:</span>
        <select
          class="form-select form-select-sm"
          v-model="currentRowsPerPage"
          @change="handleRowsPerPageChange(+$event.target.value)"
        >
          <option v-for="option in rowsPerPageOptions" :key="option" :value="option">
            {{ option }}
          </option>
        </select>
      </div>

      <!-- Pagination buttons -->
      <nav aria-label="Навигация по страницам">
        <ul class="pagination pagination-sm mb-0">
          <!-- First page button -->
          <li class="page-item" :class="{ disabled: currentPage === 1 }">
            <a class="page-link" href="#" @click.prevent="goToPage(1)" aria-label="Первая">
              <ChevronsLeft :size="16" />
            </a>
          </li>

          <!-- Previous page button -->
          <li class="page-item" :class="{ disabled: currentPage === 1 }">
            <a
              class="page-link"
              href="#"
              @click.prevent="goToPage(currentPage - 1)"
              aria-label="Предыдущая"
            >
              <ChevronLeft :size="16" />
            </a>
          </li>

          <!-- Page numbers -->
          <li
            v-for="page in pageNumbers"
            :key="page"
            class="page-item"
            :class="{ active: page === currentPage, disabled: page === '...' }"
          >
            <a class="page-link" href="#" @click.prevent="page !== '...' && goToPage(page)">
              {{ page }}
            </a>
          </li>

          <!-- Next page button -->
          <li class="page-item" :class="{ disabled: currentPage === totalPages }">
            <a
              class="page-link"
              href="#"
              @click.prevent="goToPage(currentPage + 1)"
              aria-label="Следующая"
            >
              <ChevronRight :size="16" />
            </a>
          </li>

          <!-- Last page button -->
          <li class="page-item" :class="{ disabled: currentPage === totalPages }">
            <a
              class="page-link"
              href="#"
              @click.prevent="goToPage(totalPages)"
              aria-label="Последняя"
            >
              <ChevronsRight :size="16" />
            </a>
          </li>
        </ul>
      </nav>
    </div>
  </div>
</template>

<style lang="scss" scoped>
.pagination {
  .page-link {
    display: flex;
    align-items: center;
    justify-content: center;
    min-width: 32px;
    height: 32px;
    padding: 0.25rem;
  }

  .page-item.active .page-link {
    background-color: var(--bs-primary);
    border-color: var(--bs-primary);
  }
}

.form-select {
  min-width: 70px;
}

.custom-paginator {
  margin: 0.75rem 1rem;
}
</style>
