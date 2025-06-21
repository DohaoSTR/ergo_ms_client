<template>
  <div class="modal">
    <div class="header">
      <h4>Связь</h4>
      <button type="button" class="btn-close" aria-label="Закрыть" @click="emit('close')"></button>
    </div>
    <div class="body">
      <div class="body-label body-label-sheet">
        <div>Таблица:</div>
        <select v-model="selectedTableId" class="form-select">
          <option v-for="table in availableTables" :key="table.id" :value="table.id">
            {{ getTableName(table) }}
          </option>
        </select>
      </div>
      <div class="body-label">
        <div>Тип связи:</div>
        <select v-model="joinType" class="form-select" style="max-width:140px;">
          <option value="inner">INNER JOIN</option>
          <option value="left">LEFT JOIN</option>
          <option value="right">RIGHT JOIN</option>
          <option value="full">FULL JOIN</option>
        </select>
      </div>
      <div v-for="(line, idx) in relationLines" v-if="relationLines.length" :key="idx" class="body-line">
        <select v-model="line.left" class="form-select" style="max-width:220px;">
          <option v-for="col in mainTableColumns" :key="col" :value="col">{{ col }}</option>
        </select>
        <div>=</div>
        <select v-model="line.right" class="form-select" style="max-width:220px;">
          <option v-for="col in linkedTableColumns" :key="col" :value="col">{{ col }}</option>
        </select>
        <button type="button" class="btn-remove" aria-label="Удалить связь" @click="removeRelationLine(idx)">
          <div class="icon-button">
            <Trash2 size="29" />
          </div>
        </button>
      </div>
      <div class="body-line-button">
        <button class="btn btn-primary mx-auto" @click="addRelationLine" :disabled="!selectedTableId">Добавить
          связь</button>
      </div>
    </div>
    <div class="footer">
      <div class="footer-buttons">
        <div class="footer-buttons">
          <button class="btn btn-primary" @click="handleAutoJoinAndApply" :disabled="isJoinLoading || !canApply">
            <template v-if="isJoinLoading">
              <Loader :size="20" class="icon-loading" />Проверка...
            </template>
            <template v-else>
              Применить
            </template>
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch } from 'vue'
import { Trash2, Loader } from 'lucide-vue-next'

const joinType = ref('inner')
const relationLines  = ref([])
const isJoinLoading = ref(false)
const joinError = ref(null)

const emit = defineEmits(['close', 'apply', 'selectTable'])

const props = defineProps({
  allTables: Array,
  mainTable: Object,
  linkedTableIds: { type: Array, default: () => [] },
  editRelation: Object,
  datasetId: [String, Number],
})

const canApply = computed(() =>
  relationLines.value.length > 0 &&
  relationLines.value.every(line => line.left && line.right)
)

const isEditMode      = computed(() => !!props.editRelation)
const selectedTableId = ref(isEditMode.value
  ? Number(props.editRelation.rightTableId)
  : null)
  
const linkedTable = computed(() =>
  props.allTables.find(t => t.id === selectedTableId.value)
)

const mainTableColumns = ref([])
const linkedTableColumns = ref([])

mainTableColumns.value = getTableColumns(props.mainTable)

const usedStagingIds = props.linkedTableIds || [];
const usedFileIds = props.allTables
  .filter(t => usedStagingIds.includes(t.id))
  .map(t => t.file_id);

const availableTables = computed(() => {
  if (!props.mainTable) return [];
  return props.allTables.filter(t => {
    if (t.id === props.mainTable.id) return false;
    if (t.isMain) return false;
    if (t.file_id && t.file_id === props.mainTable.file_id) return false;
    if (usedStagingIds.includes(t.id)) return false;
    if (t.file_id && usedFileIds.includes(t.file_id)) return false;
    if (t.file_upload_id == null && t.file_id == null) return false;
    return true;
  });
});

function getTableName(table) {
  if (!table) return 'Неизвестно';
  const file = table.file_upload || {};
  let name = table.display_name || table.table_name || table.name || 'Неизвестная таблица';
  if (file.sheet_name) name += ` (${file.sheet_name})`;
  if (file.original_filename) name += ` [${file.original_filename}]`;
  if (!file.original_filename && table.file_upload_name) name = table.file_upload_name;
  return name;
}

function removeRelationLine(idx) {
  relationLines.value.splice(idx, 1)
}
function addRelationLine() {
  relationLines.value.push({ left: null, right: null })
}

function getTableColumns(table) {
  if (!table) return []
  if (!table?.columns_info && table?.file_id) {
    const backup = props.allTables.find(f => f.id === -table.file_id)
    if (backup?.columns_info) table.columns_info = backup.columns_info
  }

  return table.columns_info?.columns || []
}

async function handleAutoJoinAndApply() {
  isJoinLoading.value = true
  joinError.value = null

  try {
    const linkedTable = props.allTables.find(t => t.id === selectedTableId.value)
    if (!linkedTable) throw new Error('Таблица не выбрана')
    if (!relationLines.value.length) throw new Error('Не выбрана пара полей для связи')
    const mainLine = relationLines.value[0]
    if (!mainLine.left || !mainLine.right) throw new Error('Выберите оба поля для связи')

    const lines = relationLines.value.map(line => ({
      left: line.left,
      right: line.right
    }));

    const rightTableId = linkedTable.id

    emit('apply', {
      leftTableId: props.mainTable.id,
      rightTableId,
      joinType: joinType.value,
      lines
    });
    emit('close');
  } catch (e) {
    joinError.value = e.message || 'Ошибка соединения';
    console.error('catch error', e);
  } finally {
    isJoinLoading.value = false
  }
}

watch(selectedTableId, (newId, oldId) => {
  const tbl = props.allTables.find(t => t.id === newId)
  linkedTableColumns.value = getTableColumns(tbl)
  if (!isEditMode.value) relationLines.value = []
})

watch(
  () => props.mainTable,
  (tbl) => {
    mainTableColumns.value = getTableColumns(tbl)
  },
  { immediate: true }
)

watch(linkedTable, (tbl) => {
  linkedTableColumns.value = getTableColumns(tbl)
}, { immediate: true })

watch(
   () => props.editRelation,
   (rel) => {
     if (!rel) {
      joinType.value      = 'inner'
      relationLines.value = []
      return
     }
     selectedTableId.value = Number(rel.rightTableId)
     joinType.value = (rel.joinType || 'INNER JOIN')
                     .split(' ')[0]
                     .toLowerCase()
     relationLines.value   = rel.lines?.length
       ? rel.lines.map(l => ({ left: l.left,  right: l.right }))
       : [{ left: rel.leftColumn, right: rel.rightColumn }]
   },
   { immediate: true }
)
</script>

<style scoped lang="scss">
.modal {
  display: flex;
  flex-direction: column;
  padding: 15px 15px 0 15px;
  overflow: hidden;
}

.header {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.header-button {
  border: none;
  background: var(--color-primary-background);
  border-radius: 50%;
  width: 36px;
  height: 36px;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: background 0.2s;
  cursor: pointer;
  padding: 0;
}

.header-button:hover {
  background: var(--color-hover-background);
}

.body {
  display: flex;
  flex-direction: column;
  gap: 15px;
  padding: 10px 10px 0 10px;
  overflow-y: auto;
}

.body-label {
  display: flex;
  align-items: center;
  width: 100%;
  gap: 10px;
}

.body-line {
  display: flex;
  align-items: center;
  width: 100%;
  justify-content: space-between;
}

.footer {
  display: flex;
  justify-content: flex-end;
  padding-bottom: 15px;
  padding-top: 20px;
}

.footer-buttons {
  display: flex;
  gap: 10px;
}

.btn-remove {
  background: transparent;
  border: none;
  outline: none;
  border-radius: 50%;
  cursor: pointer;
  padding: 4px;
  transition: background 0.15s;
  display: flex;
  align-items: center;
  justify-content: center;
}

.icon-button {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 26px;
  height: 26px;
}

.btn-remove .icon-button svg {
  color: var(--color-secondary-text);
  transition: color 0.15s;
}

.btn-remove:hover .icon-button svg,
.btn-remove:focus-visible .icon-button svg {
  color: var(--color-accent);
}

.body-line-button {
  padding-top: 20px;
}
</style>