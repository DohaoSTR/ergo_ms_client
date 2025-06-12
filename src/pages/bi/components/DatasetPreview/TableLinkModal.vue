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
      <div v-for="(line, idx) in relationLines" :key="idx" class="body-line">
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

import { checkJoinCompatibility } from '@/pages/bi/components/DatasetPreview/js/autoJoin'
import datasetService from '@/js/api/services/bi/datasetService'

const joinType = ref('inner')
const isJoinLoading = ref(false)
const joinError = ref(null)

const selectedLeftColumn = ref(null)
const selectedRightColumn = ref(null)
const selectedJoinType = ref('INNER JOIN')

const datasetId = computed(() => props.datasetId)

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

const selectedTableId = ref(null)
const isEditMode = ref(false);

const selectedRightTableId = ref(props.editRelation?.rightTableId || null)
const linkedTable = computed(() => {
  return props.allTables.find(t => t.id === selectedRightTableId.value)
})

const mainTableColumns = ref([])
const linkedTableColumns = ref([])

const availableTables = computed(() => {
  return props.allTables.filter(
    t =>
      t.id !== props.mainTable.id &&
      !props.linkedTableIds.includes(t.id) &&
      t.id !== selectedRightTableId.value
  )
})

function getTableName(table) {
  const file = table.file_upload || {}
  let name = table.display_name || table.table_name || table.name || 'Неизвестная таблица'
  if (file.sheet_name) name += ` (${file.sheet_name})`
  if (file.original_filename) name += ` [${file.original_filename}]`
  return name
}

const relationLines = ref([])

function removeRelationLine(idx) {
  relationLines.value.splice(idx, 1)
}
function addRelationLine() {
  relationLines.value.push({ left: null, right: null })
}

function getTableColumnTypes(table) {
  return table?.columns_info?.types || [];
}

async function onApply() {
  if (!canApply.value) return;
  const lines = relationLines.value.map(line => ({
    left: line.left,
    right: line.right
  }));

  const linkedTable = props.allTables.find(t => t.id === selectedTableId.value);

  const ok = checkJoinCompatibility(props.mainTable, linkedTable, lines);
  if (!ok) {
    alert('Ошибка: типы выбранных столбцов не совпадают!');
    return;
  }

  emit('apply', {
    leftTableId: props.mainTable.id,
    rightTableId: selectedTableId.value,
    joinType: joinType.value,
    lines: lines
  });
  emit('close');
}

function getTableColumns(table) {
  if (!table || !table.columns_info) return []
  const cols = table.columns_info.columns
  if (Array.isArray(cols)) {
    if (typeof cols[0] === "string") return cols
    if (typeof cols[0] === "object" && cols[0]?.name) return cols.map(c => c.name)
  }
  return []
}

async function handleAutoJoinAndApply() {
  console.log("handleAutoJoinAndApply: called");
  isJoinLoading.value = true
  joinError.value = null

  try {
    // 1. Проверяем выбранную таблицу и связь
    const linkedTable = props.allTables.find(t => t.id === selectedTableId.value)
    if (!linkedTable) throw new Error('Таблица не выбрана')
    if (!relationLines.value.length) throw new Error('Не выбрана пара полей для связи')
    const mainLine = relationLines.value[0]
    if (!mainLine.left || !mainLine.right) throw new Error('Выберите оба поля для связи')

    // 2. Проверяем что datasetId есть!
    if (!props.datasetId) throw new Error('Не передан id датасета для добавления таблицы!')

    // 3. Проверяем stagingName
    let stagingName = linkedTable.table_ref || linkedTable.table_name || linkedTable.name;
    let fileId = linkedTable.file_id || linkedTable.id;

    // 4. Если staging/table_ref нет или не начинается с "staging_" или "temp_", вызываем addTableToDataset
    if (!stagingName || (!stagingName.startsWith('staging_') && !stagingName.startsWith('temp_'))) {
      console.log('[DEBUG] addTableToDataset: datasetId', props.datasetId, 'fileId', fileId)
      const resp = await datasetService.addTableToDataset(props.datasetId, fileId);
      const newTable = resp?.data;
      if (!newTable || !newTable.table_ref) {
        throw new Error('Сервер не вернул корректную staging-таблицу (table_ref)');
      }
      stagingName = newTable.table_ref;
    }

    // 5. Проверяем stagingName ещё раз
    if (!stagingName) throw new Error('У таблицы нет staging/table_ref (temp_xxxx)')

    // 6. Выполняем joinTable
    console.log('[DEBUG] joinTable: datasetId', props.datasetId, 'stagingName', stagingName)
    const joinResp = await datasetService.joinTable({
      datasetId: props.datasetId,
      stagingName,
      leftColumn: mainLine.left,
      rightColumn: mainLine.right,
      joinType: joinType.value?.toUpperCase() + ' JOIN' || 'INNER JOIN'
    });

    const data = joinResp?.data;
    if (data?.success) {
      onApply();
    } else {
      joinError.value = data?.error || 'Ошибка проверки';
    }
  } catch (e) {
    joinError.value = e.message || 'Ошибка соединения';
    console.error('catch error', e);
  } finally {
    isJoinLoading.value = false;
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
  (edit) => {
    if (edit && edit.rightTableId) {
      selectedTableId.value = Number(edit.rightTableId)
    } else {
      selectedTableId.value = null;
    }
  },
  { immediate: true }
)

console.log('mainTable:', props.mainTable)
console.log('mainTableColumns:', mainTableColumns.value)
console.log('linkedTable:', props.allTables.find(t => t.id === selectedTableId.value))
console.log('linkedTableColumns:', linkedTableColumns.value)

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