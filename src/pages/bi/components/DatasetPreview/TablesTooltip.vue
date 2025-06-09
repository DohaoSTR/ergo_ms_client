<template>
    <div class="section-title">Таблицы</div>
    <input class="form-control mb-2" type="text" placeholder="Поиск по имени" v-model="filter" autocomplete="off"/>
    <ul class="table-list">
      <template v-if="isLoading">
        <li v-for="n in 4" :key="n" class="table-item loading">
          <div class="skeleton-icon" />
          <div class="skeleton-text" />
        </li>
      </template>
      <template v-else>
        <li v-for="table in filteredTables" :key="table.id" class="table-item" :class="{ selected: isSelected(table) }" @click="emit('select', table)">
          <Table class="icon"/>
          <span class="table-name">{{ table.name || (table.schema + '.' + table.table) }}</span>
        </li>
      </template>
    </ul>
    <div v-if="!isLoading && filteredTables.length === 0" class="no-data">
      Нет таблиц
    </div>
</template>

<script setup>
import { ref, computed, watch } from 'vue'
import { Table } from 'lucide-vue-next'
import { useFileList } from '@/pages/bi/components/js/useFileList'
import { useDbTablesList } from '@/pages/bi/components/js/useDbTablesList'

const props = defineProps({
  connectionId: Number,
  connectionType: String,
  selectedTable: Object
})

const emit = defineEmits(['select', 'tablesLoaded'])

const filter = ref('')
const isLoading = ref(true)
const uploadedFiles = ref([])

const { loadDbTables, dbTables } = useDbTablesList()
const { loadUserFiles } = useFileList(
  ref([]), ref(null), uploadedFiles, ref(null), ref([]), ref(null), ref(false)
)

function isSelected(table) {
  // Безопасно сравнивать id
  return props.selectedTable && table.id === props.selectedTable.id
}

// Фильтрация по поиску
const filteredTables = computed(() => {
  const search = filter.value.toLowerCase()
  return uploadedFiles.value.filter(table =>
    (table.name && table.name.toLowerCase().includes(search)) ||
    (table.table && table.table.toLowerCase().includes(search))
  )
})

// Загрузка таблиц при смене подключения
watch(() => props.connectionId, async (id) => {
  if (!id) return
  isLoading.value = true
  if (props.connectionType === 'file') {
    await loadUserFiles(id)
  } else {
    await loadDbTables(id)
    uploadedFiles.value = dbTables.value
  }

  emit('tablesLoaded', uploadedFiles.value)

  isLoading.value = false
}, { immediate: true })
</script>

<style scoped lang="scss">
.table-tooltip {
  border-radius: 10px;
  box-shadow: 0 8px 32px #000a;
  padding: 16px;
  min-width: 320px;
  max-width: 420px;
}
.section-title {
  font-weight: bold;
  color: #e0e0e0;
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
  max-height: 355px;
  overflow-y: auto;
}
.table-item {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 6px 8px;
  border-radius: 6px;
  transition: background 0.2s;
  width: 100%;
  cursor: pointer;
  &:hover,
  &.linked {
    background-color: rgba(255, 255, 255, 0.07);
  }
}
.table-item.linked {
  background-color: rgba(0, 160, 255, 0.07);
}
.icon {
  width: 16px;
  height: 16px;
  color: #d0322d;
}
.table-name {
  font-size: 14px;
  color: #ddd;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.no-data {
  padding: 12px;
  text-align: center;
  font-size: 14px;
  color: #777;
}
.loading {
  pointer-events: none;
  background: transparent !important;
}
.skeleton-icon,
.skeleton-text {
  background-color: rgba(255, 255, 255, 0.08);
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
  0% { opacity: 0.4; }
  50% { opacity: 1; }
  100% { opacity: 0.4; }
}

.table-item.selected {
  border: 1.5px solid #198754;
  background-color: rgba(255, 255, 255, 0.07);
}
</style>
