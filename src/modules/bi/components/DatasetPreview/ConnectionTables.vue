<template>
    <div class="connection-tables">
        <div class="section-title">Таблицы</div>
        <ul class="table-list">
            <template v-if="isLoading">
                <li v-for="n in 4" :key="n" class="table-item loading">
                    <div class="skeleton-icon" />
                    <div class="skeleton-text" />
                </li>
            </template>
            <template v-else>
                <li v-for="file in uploadedFiles" :key="file.id" class="table-item" :class="{ linked: isLinked(file) }" draggable="true" @dragstart="(event) => handleDragStart(file, event)">
                    <Table class="icon red" />
                    <span class="table-name">{{ file.name || (file.schema + '.' + file.table) }}</span>
                </li>
            </template>
        </ul>
        <div v-if="!isLoading && uploadedFiles.length === 0" class="no-data">
            Нет таблиц
        </div>
    </div>
</template>

<script setup>
import { ref, watch, onMounted } from 'vue'
import { useFileList } from '@/modules/bi/components/js/useFileList'
import { useDbTablesList } from '@/modules/bi/components/js/useDbTablesList'
import { Table } from 'lucide-vue-next'

const props = defineProps({
  connectionId: Number,
  connectionType: String,
  selectedTables: {
    type: Array,
    default: () => []
  }
})

const tempUploadedFiles = ref([])
const selectedFile = ref(null)
const currentUploadFile = ref(null)
const availableSheets = ref([])
const sheetBeingEdited = ref(null)
const isSheetPickerVisible = ref(false)

const isLoading = ref(true)
const uploadedFiles = ref([])

const {
  loadDbTables,
  dbTables,
  isDbLoading
} = useDbTablesList()

const {
  loadUserFiles
} = useFileList(
  ref([]), // tempUploadedFiles
  ref(null), // selectedFile
  uploadedFiles,
  ref(null), // currentUploadFile
  ref([]),   // availableSheets
  ref(null), // sheetBeingEdited
  ref(false) // isSheetPickerVisible
)

function handleDragStart(file, event) {
  if (!event.dataTransfer) return; // игнорировать некорректные вызовы
  event.dataTransfer.setData('application/json', JSON.stringify(file))
}

function isLinked(item) {
  const result = props.selectedTables.some(tbl => {
    if (item.file_id || tbl.file_id) {
      const cmp = String(tbl.file_id) === String(item.id)
      if (cmp) {
        console.log('[isLinked] file_id совпал:', { tbl, item })
      }
      return cmp
    }
    if (item.table_name || tbl.table_name) {
      const cmp = tbl.table_name === item.table_name
      if (cmp) {
        console.log('[isLinked] table_name совпал:', { tbl, item })
      }
      return cmp
    }
    return false
  })
  if (result) {
    console.log('[isLinked] TRUE для:', item)
  }
  return result
}

onMounted(() => {
  console.log('ConnectionTables selectedTables:', props.selectedTables)
})

watch(() => props.connectionId, async (id) => {
  if (!id) return
  isLoading.value = true

  if (props.connectionType === 'file') {
    await loadUserFiles(id)
  } else {
    await loadDbTables(id)
    uploadedFiles.value = dbTables.value
  }

  isLoading.value = false
}, { immediate: true })

</script>

<style scoped lang="scss">
.connection-tables {
    padding: 10px 15px;
    width: 100%;
}

.section-title {
    font-weight: bold;
    color: var(--color-secondary-text);
    margin-bottom: 10px;
}

.table-list {
    list-style: none;
    padding: 0;
    margin: 0;
    display: flex;
    flex-direction: column;
    gap: 6px;
    width: 100%;
}

.table-item {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 6px 8px;
  border-radius: 6px;
  transition: background 0.2s;
  width: 100%;
  cursor: grab;

  &:active {
    cursor: grabbing;
  }

  &:hover,
  :deep(.linked) {
    background-color: var(--color-hover-background);
  }
}

.table-item.linked {
  background-color: var(--color-hover-background);
}

.icon {
    width: 16px;
    height: 16px;
    color: var(--color-secondary-text);

    &.red {
        color: var(--color-accent);
    }
}

.table-name {
    font-size: 14px;
    color: var(--color-primary-text);
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
}

.no-data {
    padding: 12px;
    text-align: center;
    font-size: 14px;
    color: var(--color-primary-text);
}

.loading {
    pointer-events: none;
    background: transparent !important;
}

.skeleton-icon,
.skeleton-text {
    background-color: var(--color-primary-background);
    border-radius: 4px;
    animation: shimmer 1.3s infinite ease-in-out;
}

.skeleton-icon {
    width: 16px;
    height: 16px;
}

.skeleton-text {
    width: 150px;
    height: 14px;
    margin-left: 10px;
    border-radius: 4px;
}

@keyframes shimmer {
    0% {
        opacity: 0.4;
    }

    50% {
        opacity: 1;
    }

    100% {
        opacity: 0.4;
    }
}
</style>
