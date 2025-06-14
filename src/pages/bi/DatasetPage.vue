<template>
  <div class="layout" :style="{
    gridTemplateColumns: activeTab === 'sources' ? '250px 1fr' : '1fr',
    '--footer-height': isPreviewVisible ? footerHeight + 'px' : '0px'
  }">
    <header class="file_area_header">
      <div class="file_area_header_label">
        <Database />
        <div style="overflow: hidden; white-space: nowrap; text-overflow: ellipsis;">
          <h4 class="header-label" style="margin-bottom:3px;">{{ headerName }}</h4>
        </div>
      </div>
      <div class="file_area_header_buttons">
        <button v-if="isNewPage" class="btn btn-primary" :disabled="!canCreateDataset || saving" @click="showDatasetDialog=true">Создать датасет</button>
        <button v-else-if="isDraft" class="btn btn-success" disabled>Сохранить датасет</button>
      </div>
    </header>

    <div class="toolbar">
      <div class="tab-group">
        <button class="tab-button" :class="{ active: activeTab === 'sources' }"
          @click="activeTab = 'sources'">Источники</button>
        <button class="tab-button" :class="{ active: activeTab === 'fields' }"
          @click="activeTab = 'fields'">Поля</button>
        <button class="tab-button" hidden :class="{ active: activeTab === 'params' }"
          @click="activeTab = 'params'">Параметры</button>
      </div>
      <div class="button-preview">
        <button v-if="activeTab === 'fields'" class="btn btn-secondary" style="display: flex; gap: 5px;"
          @click="refreshFields">
          <template v-if="isPreviewLoading">
            <Loader class="icon-loading" />Загрузка…
          </template>
          <template v-else>
            <RefreshCw :size="18" />Обновить поля
          </template>
        </button>
        <button class="btn btn-secondary" style="display: flex; gap: 5px;" @click="togglePreview"
          :disabled="isPreviewLoading">
          <Eye :size="18" />Предпросмотр
        </button>
        <button v-if="activeTab === 'fields'" class="btn btn-secondary" style="display: flex; gap: 5px;"
          @click="addField" hidden>
          <Plus :size="18" />Добавить поле
        </button>
      </div>
    </div>

    <main class="file_area" :class="{ 'rounded-bottom': !isPreviewVisible }">
      <div v-if="activeTab === 'sources'" class="flow-wrapper">
        <DatasetCreating v-model:selectedConnection="selectedConnection" v-model:mainTable="mainTable"
          :relations="relations" :all-tables="allTablesOfConnection" @editRelation="onEditRelation"
          @removeRelation="removeRelationById" @openTableLinkModal="openTableLinkModal"
          @tablesLoaded="handleTablesLoaded" />
      </div>
      <div v-else>
        <component v-if="activeTab === 'fields' && selectedTables.length" :is="getTabComponent(activeTab)"
          v-model:fields="fields" :tables="selectedTables" :cols="previewCols" :rows="previewRows"
          :dataset-id="needsDataset(activeTab) && dataset.value ? dataset.value.id : null"
          @remove-table="handleRemoveTable" @update:fields="fields = $event" />
        <div v-else class="text-muted p-4"
          style="display: flex; justify-content: center; align-items: center; height: 100%; width: 100%; text-align: center;">
          Сначала выберите таблицу из подключения и создайте датасет,<br>чтобы редактировать {{ tabLabel(activeTab) }}.
        </div>
      </div>
    </main>

    <transition name="slide-footer">
      <div class="footer-wrapper" v-if="isPreviewVisible">
        <div class="footer-resizer" @mousedown.prevent="startFooterResize"></div>
        <footer class="footer-content" :style="{ height: footerHeight + 'px' }">
          <template v-if="isPreviewLoading"></template>
          <template v-else-if="previewRows && previewRows.length">
            <DatasetTablePreview :cols="previewCols" :rows="previewRows" :loading="isPreviewLoading" :fields="fields"
              :limit="previewLimit" />
          </template>
          <template v-else>
            <div class="preview-placeholder">
              Чтобы увидеть предпросмотр выберите подключение и таблицу, которая ляжет в основу датасета
            </div>
          </template>
        </footer>
      </div>
    </transition>
  </div>
  <transition name="fade">
    <div v-if="showModal" class="modal-overlay">
      <div class="modal-window modal-window-fields">
        <div class="modal-header">
          <h5>Настройка поля</h5>
          <button class="close-btn" @click="showModal = false">&times;</button>
        </div>
        <SourceSettings v-if="showModal" :field="selectedField" :tables="selectedTables" :cols="previewCols"
          :rows="previewRows" @close="showModal = false" @save="onSourceSave" />
      </div>
    </div>
  </transition>

  <transition name="fade">
    <div v-if="showTableLinkModal" class="modal-overlay">
      <div class="modal-window table-link-modal">
        <TableLinkModal :all-tables="allTablesOfConnection" :linked-table-ids="computedLinkedTableIds"
          :main-table="mainTable" :edit-relation="editingRelation" :dataset-id="currentDatasetId"
          @close="showTableLinkModal = false" @apply="handleRelationApply" />
      </div>
    </div>
  </transition>

  <transition name="fade">
    <div v-if="showDatasetDialog" class="modal-overlay">
      <DatasetNameDialog v-model:visible="showDatasetDialog" :modelValue="dataset.value?.name" @saved="saveDataset"/>
    </div>
  </transition>
</template>

<script setup>
import { ref, onMounted, onBeforeUnmount, watch, computed } from 'vue'
import { RefreshCw, Plus, Eye, Loader, Database } from 'lucide-vue-next'
import { useRoute, useRouter } from 'vue-router'

import datasetService     from '@/js/api/services/bi/datasetService'
import connectionService  from '@/js/api/services/bi/connectionService'
import { getAggregationOptions } from '@/pages/bi/components/DatasetPreview/js/DatasetPreviewFieldOptions.js'

import DatasetNameDialog from '@/pages/bi/components/DatasetNameDialog.vue'
import TableLinkModal from '@/pages/bi/components/DatasetPreview/TableLinkModal.vue'
import SourceSettings from '@/pages/bi/components/DatasetPreview/SourceSettings.vue'
import DatasetCreating from '@/pages/bi/components/DatasetPreview/DatasetCreating.vue'
import FieldsPage from '@/pages/bi/components/DatasetPreview/FieldsPage.vue'
import ParamsPage from '@/pages/bi/components/DatasetPreview/ParamsPage.vue'
import DatasetTablePreview from '@/pages/bi/components/DatasetPreview/DatasetTablePreview.vue'

const isPreviewLoading = ref(false)
const fileUploadsCache = ref([])

const selectedConnection = ref(null)
const mainTable = ref(null)
const showTableLinkModal = ref(false)

const editingRelation = ref(null)
const editingRelationIndex = ref(null)

const allTablesOfConnection = ref([])
const columnToTableMap = ref({})

const route = useRoute()
const router = useRouter()
const datasetId     = computed(() => route.params.id)
const isNewPage     = computed(() => !datasetId.value)

const activeTab = ref('sources')
const isPreviewVisible = ref(true)

const dataset = ref({})
const fields = ref([])
const relations = ref([])
const saving = ref(false)
const showDatasetDialog = ref(false)

const selectedTables = ref([])
const selectedRelations = ref([])

const previewCols = ref([])
const previewRows = ref([])
const previewLimit = ref(10)

const currentDatasetId = computed(() => dataset.value?.id)

const emit = defineEmits([
  'update:selectedConnection',
  'tableDrop'
])

const props = defineProps({
  previewLimit: {
    type: Number,
    default: 10
  }
})

const headerName = computed(() =>
  dataset.value?.name || 'Новый датасет'
)

const isDraft       = computed(() =>
  !isNewPage.value && dataset.value?.is_temporary
)

const canCreateDataset = computed(() =>
  isNewPage.value && !!mainTable.value?.id
)

async function saveDataset(finalName) {
  if (!dataset.value?.id) return
  saving.value = true
  try {
    const payload = { name: finalName, is_temporary: false }
    const putOk = await safeUpdateDataset(datasetService.updateDataset(dataset.value.id, payload))
    if (putOk) {
      await safeUpdateDataset(
       datasetService.getDataset(dataset.value.id)
     )

     router.replace({ name:'DatasetPage', params:{ id: dataset.value.id } })
   }
  } finally { saving.value = false }
}

function handleTablesLoaded (files) {
  fileUploadsCache.value = files
  buildAllTables(files)

  /* ── если главная таблица всё ещё temp_… — заменяем название ── */
  if (
    mainTable.value &&
    /^temp_[a-f0-9]{32}/.test(mainTable.value.display_name || '')
  ) {
   const match = files.find(
     f => mainTable.value.file_id                // temp-таблица знает file_id
          ? f.id === mainTable.value.file_id
          : f.columns_info &&                    // fallback: раньше не было file_id
            mainTable.value.columns_info &&
            JSON.stringify(f.columns_info.columns) ===
            JSON.stringify(mainTable.value.columns_info.columns)
   )

    if (match) {
      mainTable.value.display_name = match.original_filename
      mainTable.value.name         = match.original_filename
      /* columns_info тоже можно дописать, если ещё пусто */
      if (!mainTable.value.columns_info && match.columns_info) {
        mainTable.value.columns_info = match.columns_info
      }
    }
  }
}

function buildAllTables (files = fileUploadsCache.value) {
  const dsTables = (dataset.value?.tables || []).map(t => ({
    ...t,
    id: Number(t.id),
    file_id: t.file_upload_id,
    display_name: t.display_name || t.file_upload_name || t.table_name,
    name:         t.display_name || t.file_upload_name || t.table_name,
    columns_info: t.columns_info || null,
    file_upload_name: t.file_upload_name || null,
    isMain: !t.joined_on
  }))

  const merged = []

  ;(files || []).forEach(f => {
    const ds = dsTables.find(dt =>
      dt.file_id === f.id ||
      dt.display_name    === f.original_filename ||
      dt.file_upload_name === f.original_filename ||
      dt.table_name      === f.table_name ||
      ( dt.columns_info && f.columns_info &&
        JSON.stringify(dt.columns_info.columns) ===
        JSON.stringify(f.columns_info.columns) )
    )

    /* ── 1. исходный файл уже представлен temp-таблицей ── */
    if (ds) {
      /* дописываем схему, если не была сохранена */
      if (!ds.columns_info && f.columns_info) ds.columns_info = f.columns_info

      /* заменяем temp_… на оригинальное имя */
      if (/^temp_[a-f0-9]{32}/.test(ds.display_name)) {
        const pretty = ds.file_upload_name || f.original_filename
        ds.display_name = pretty
        ds.name         = pretty
      }

      merged.push(ds)
      return
    }

    /* ── 2. файла нет в dataset → «сырой» FileUpload ── */
    merged.push({
      ...f,
      id: -f.id,
      file_id: f.id,
      order: 1,
      display_name: f.original_filename,
      name:         f.original_filename,
      columns_info: f.columns_info || null,
      isMain: false
    })
  })

  /* temp-таблицы, которые не связаны с файлами (sql-view и т. д.) */
  dsTables.forEach(dt => {
    if (!merged.some(m => m.id === dt.id)) merged.push(dt)
  })

  allTablesOfConnection.value = merged

  /* ссылка на актуальную главную таблицу */
  const actualMain = merged.find(t => t.isMain)
  if (actualMain) mainTable.value = actualMain
}

function mapTable(t) {
  const isMain = t.order === 0
  if (!isMain && 
    /^temp_[a-f0-9]{32}/.test(t.table_name) &&
    !t.columns_info &&
    (t.file_upload_id == null && t.file_id == null)) {
    return
  }
  if (isMain) {
    const backupMain = mainTable?.value || fileUploadsCache.value.find(f => f.id === t.file_upload_id)

    if (!t.columns_info && backupMain?.columns_info) {
      t.columns_info = backupMain.columns_info
    }

    if ((!t.display_name || /^temp_[a-f0-9]{32}/.test(t.display_name)) && backupMain?.original_filename) 
    {
      t.display_name = backupMain.original_filename
    }
  }
  if (isMain && !t.columns_info) {
    const backup = fileUploadsCache.value.find(
      f => f.original_filename === t.display_name || f.id === t.file_upload_id
    )
    if (backup?.columns_info) t.columns_info = backup.columns_info
  }
    let backup = null
  if (t.file_upload_id != null) {
    backup = fileUploadsCache.value.find(f => f.id === t.file_upload_id)
  }
  if (!backup && t.display_name?.endsWith('.xlsx')) {
    backup = fileUploadsCache.value.find(
      f => f.original_filename === t.display_name
    )
  }

  /* ── ключевая логика ── */
  const looksTemp = /^temp_[a-f0-9]{32}/.test(t.display_name || '')
  const prettyName =
     /* 1. temp_… + в объекте уже есть file_upload_name */
     (looksTemp && t.file_upload_name)
       ? t.file_upload_name
     /* 2. temp_… + нашли backup-файл → original_filename */
      : looksTemp && backup?.original_filename
          ? backup.original_filename
      /* 3. все остальные случаи */
          : t.display_name
         || backup?.original_filename
         || t.name
         || t.table_name

  return {
    id:           t.id,
    table_ref:    t.table_name,
    display_name: prettyName,   // ← уже человеческое
    name:         prettyName,   // ← то же самое для DatasetCreating
    columns_info: t.columns_info || backup?.columns_info || null,
    isMain:       isMain
  }
}

async function safeUpdateDataset(promise) {
  try {
    const resp = await promise

    const payload = resp && resp.data ? resp.data : resp

    let ok = false
    let ds = null
    if (payload && typeof payload === 'object') {
      if ('success' in payload) {
        ok = payload.success
        ds = payload.dataset ?? payload.data
      } else if ('id' in payload) {
        ok = true
        ds = payload
      }
    }

    if (!ok || !ds?.id) {
      if (payload?.error) console.error(payload.error)
      return false
    }

    dataset.value = ds
    if (Array.isArray(ds.tables) && ds.tables.length) {
      /* объект полный → наполняем всё локально */
      await hydrateFromDataset(ds)
      selectedTables.value = ds.tables.map(mapTable).filter(Boolean)
      buildAllTables()
    } else {
      /* ответ укороченный → дотягиваем полный датасет   */
      await loadDataset(ds.id)          // внутри loadDataset вызывается
    }
    return true
  } catch (err) {
    console.error(err)
    return false
  }
}

async function hydrateFromDataset(ds) {
  const main = ds.tables.find(t => !t.joined_on) || ds.tables[0]
  if (main) mainTable.value = mapTable(main)

  const connId = main?.connection || ds.selectedConnection
if (connId) {
  try {
    const conn = await connectionService.get(connId)
    selectedConnection.value = conn
  } catch (e) {
    console.warn('Не удалось получить подключение', e)
    selectedConnection.value = { id: connId, name: `Connection #${connId}` }
  }
} else {
  selectedConnection.value = null
}

  relations.value = getRelationsFromDataset(ds)
}

const usedRightTableIds = computed(() =>
  (relations.value || []).map(r => r.rightTableId)
)

const computedLinkedTableIds = computed(() => {
  if (editingRelation.value?.rightTableId) {
    return usedRightTableIds.value.filter(
      id => String(id) !== String(editingRelation.value.rightTableId)
    )
  }
  return usedRightTableIds.value
})

async function handleRelationApply(relation) {
  const ok = await safeUpdateDataset(datasetService.getDataset(dataset.value.id));
  if (!ok) return;
  relations.value = getRelationsFromDataset(dataset.value)
  await loadPreview();
}

function onEditRelation(rel, idx) {
  editingRelation.value = JSON.parse(JSON.stringify(rel))
  editingRelationIndex.value = idx
  showTableLinkModal.value = true
}

function getRelationsFromDataset(data) {
  if (!data || !data.tables) return []
  const mainTable = data.tables.find(t => !t.joined_on) || data.tables[0]
  return data.tables
    .filter(t => t.joined_on)
    .map(t => ({
      leftTableId: mainTable.id,
      rightTableId: t.id,
      joinType: t.joined_on?.type,
      leftColumn: t.joined_on?.left_column,
      rightColumn: t.joined_on?.right_column,
      rightTableName: t.display_name || t.table_name,
    }))
}

function openTableLinkModal() {
  const id = dataset.value && dataset.value.id
  if (!id || isNaN(Number(id))) {
    alert('Создайте датасет…')
    return
  }
  buildAllTables()
  editingRelation.value = null
  showTableLinkModal.value = true
}

async function removeRelationById(rightTableId) {
  if (!dataset.value?.id) return

  const ok = await safeUpdateDataset(
    datasetService.removeRelation({ datasetId: dataset.value.id, rightTableId })
  )
  if (ok) {
    await loadPreview()
    buildAllTables()
  }
}

function needsDataset(tab) {
  return tab === 'fields' || tab === 'params'
}
function tabLabel(tab) {
  return tab === 'fields' ? 'поля' : (tab === 'params' ? 'параметры' : '')
}

async function loadPreview() {
  if (!dataset.value || !dataset.value.id) return;
  isPreviewLoading.value = true;
  try {
    const { success, data } = await datasetService.preview(dataset.value.id, { limit: previewLimit.value });
    if (success) {
      previewCols.value = data.columns;
      previewRows.value = data.rows;
      await loadFields();
    }
  } finally {
    isPreviewLoading.value = false;
  }
}

function detectColumnType(values) {
  const filtered = values.filter(v => v !== null && v !== undefined && v !== '')
  if (!filtered.length) return 'string'
  if (filtered.every(v => /^(\d{4}-\d{2}-\d{2})$/.test(v) || v instanceof Date)) return 'date'
  if (filtered.every(v => /^(\d{4}-\d{2}-\d{2} \d{2}:\d{2}(:\d{2})?)$/.test(v))) return 'date&time'
  if (filtered.every(v => v === 'true' || v === 'false' || typeof v === 'boolean')) return 'bool'
  if (filtered.every(v => !isNaN(v) && Number.isInteger(+v))) return 'integer'
  if (filtered.every(v => !isNaN(v) && !Number.isNaN(parseFloat(v)))) return 'float'
  return 'string'
}

async function loadFields() {
  if (dataset.value?.id) {
    const resp = await datasetService.listFields({ dataset: dataset.value.id })
      .then(response => {
        fields.value = response.data
      })
    if (resp && resp.data && resp.data.length > 0) {
      fields.value = normalizeFields(resp.data, selectedTables.value[0]?.name || 'НеизвестнаяТаблица');
      return;
    }
  }

  if (previewCols.value.length && previewRows.value.length) {
    const col2Table = {};
    (selectedTables.value || []).forEach(t => {
      const cols = t.columns_info?.columns || []
      cols.forEach(c => {
        if (!col2Table[c]) col2Table[c] = t
      })
    })
    columnToTableMap.value = col2Table
    const mainObj = selectedTables.value.find(t => t?.order === 0)
    previewCols.value.forEach(c => {
      if (!col2Table[c] && mainObj) col2Table[c] = mainObj
    })
    fields.value = previewCols.value.map((col, idx) => {
      const tableObj = col2Table[col]
      const tableName = tableObj
        ? (tableObj.display_name || tableObj.name || tableObj.table_name)
        : 'НеизвестнаяТаблица'
      const columnName = col
      let tableId = tableObj?.id;

      const columnValues = previewRows.value.map(row => row[idx]);
      const colType = detectColumnType(columnValues);
      const aggOptions = getAggregationOptions(colType);
      return {
        id: 'new_' + idx,
        name: columnName,
        source: { table: tableName, column: columnName },
        source_table: tableId,
        type: colType,
        aggregation: aggOptions[0]?.value || 'none',
        description: ''
      }
    });
    return;
  }

  if (previewCols.value.length) {
    fields.value = previewCols.value.map((col, idx) => ({
      id: 'new_' + idx,
      name: col,
      source: { table: 'НеизвестнаяТаблица', column: col },
      type: 'string',
      aggregation: '',
      description: ''
    }));
    return;
  }

  fields.value = [];
}

function normalizeFields(fields, fallbackTable = 'НеизвестнаяТаблица') {
  return fields.map((f, idx) => {
    let tableObj =
      selectedTables.value?.find(t => String(t.id) === String(f.source_table))
      || columnToTableMap.value[f.name]
    let tableName = tableObj?.display_name || tableObj?.name || tableObj?.table || fallbackTable;
    let source = {
      table: tableName,
      column: f.source_column || f.name || `col${idx + 1}`
    }
    let type = f.type;
    if (!type) {
      let colIdx = previewCols.value.findIndex(c => c === (f.name || f.source_column));
      let values = (colIdx !== -1)
        ? previewRows.value.map(row => row[colIdx])
        : [];
      type = detectColumnType(values);
    }
    return { ...f, source, type };
  });
}

watch(
  () => dataset.value?.tables?.length,
  () => buildAllTables()
)

watch(datasetId, async (newId, oldId) => {
  if (newId && newId !== oldId) {
    await loadDataset(newId)      // см. функцию ниже
  }
})

async function loadDataset(id) {
  const { data } = await datasetService.getDataset(id)
  dataset.value   = data
  selectedTables.value = data.tables.map(mapTable).filter(Boolean)
  buildAllTables()
  await hydrateFromDataset(data)
  await loadPreview()
}

onMounted(async () => {
  if (datasetId.value) {
    await loadDataset(datasetId.value)
  }
})

async function createDatasetFrom(tbl) {
  const payload = {
    name: 'Новый датасет',
    connection: selectedConnection.value.id,
    file_source: tbl.id,
    is_temporary: true
  }

  const resp = await datasetService.createDataset(payload)

  let ok = false
  let dataset = null

  if (resp?.success) {
    if (resp.dataset) {
      ok = true
      dataset = resp.dataset
    } else if (resp.data) {
      ok = true
      dataset = resp.data
    }
  }

  if (!ok || !dataset?.id) {
    console.error('[CREATE] unexpected response', resp)
    return
  }

  const target =
    dataset.tables.find(t => t.file_upload_id === tbl.id) || dataset.tables[0]

  if (target && !target.columns_info && tbl.columns_info) {
    target.columns_info = tbl.columns_info
  }

  const pretty = tbl.original_filename || tbl.name
  if (pretty && (!target.display_name || target.display_name.startsWith('temp_'))) {
    target.display_name = pretty
    target.name         = pretty
  }

  const ok2 = await safeUpdateDataset(Promise.resolve(dataset))
  if (!ok2) return

  await hydrateFromDataset(dataset)
  await loadPreview()
}

async function refreshFields() {
  if (!dataset.value || !dataset.value.id) return;
  const renames = fields.value
    .filter(f => f.name && f.source && f.source.column)
    .map(f => ({
      old_name: f.source.column,
      new_name: f.name,
    }));

  if (renames.length && dataset.value && dataset.value.id) {
    const { data, error } = await datasetService.renameColumns(dataset.value.id, renames);
    if (error) return;

    const fieldsResp = await datasetService.listFields({ dataset: dataset.value.id })
    if (fieldsResp && fieldsResp.data) {
      fields.value = fieldsResp.data;
    }
  }
  await loadPreview();
}

// ==== Футер ресайз ====
const footerHeight = ref(200)
const footerMin = 200
const footerMax = 400
let isFooterResizing = false
let footerStartY = 0
let footerStartHeight = 0

function startFooterResize(e) {
  isFooterResizing = true
  footerStartY = e.clientY
  footerStartHeight = footerHeight.value
  window.addEventListener('mousemove', resizeFooter)
  window.addEventListener('mouseup', stopFooterResize)
}

function resizeFooter(e) {
  if (!isFooterResizing) return
  const delta = e.clientY - footerStartY
  footerHeight.value = Math.min(
    footerMax,
    Math.max(footerMin, footerStartHeight - delta)
  )
}

function stopFooterResize() {
  isFooterResizing = false
  window.removeEventListener('mousemove', resizeFooter)
  window.removeEventListener('mouseup', stopFooterResize)
}

// чтобы при уходе со страницы не оставить слушателей
onBeforeUnmount(() => {
  stopFooterResize()
})

function togglePreview() {
  // Если футер уже открыт — скрываем его
  if (isPreviewVisible.value) {
    isPreviewVisible.value = false
  } else {
    // Открываем и загружаем предпросмотр
    isPreviewVisible.value = true
    loadPreview()
  }
}

watch(mainTable, async (newTable, oldTable) => {
  if (newTable && newTable !== oldTable) {
    // Если датасет еще не создан — создай
    if (!dataset.value?.id) {
      await createDatasetFrom(newTable)
    }
    // После этого — загрузи предпросмотр
    await loadPreview()
  }
})

async function doPreview() {
  if (!dataset.value?.id) {
    console.warn('Нет id датасета для предпросмотра', dataset.value);
    return;
  }
  const { success, data } = await datasetService.preview(dataset.value.id, {
    limit: previewLimit.value
  });
  if (success) {
    previewCols.value = data.columns;
    previewRows.value = data.rows;
    await loadFields();
  }
}
const selectedField = ref(null)
const showModal = ref(false)

function addField() {
  selectedField.value = null
  showModal.value = true
}

function handleRemoveTable(t) {
  const i = selectedTables.value.indexOf(t)
  if (i !== -1) selectedTables.value.splice(i, 1)
}

function getTabComponent(tab) {
  const cmp = { fields: FieldsPage, params: ParamsPage }[tab] || null
  return cmp
}

function onSourceSave(newField) {
  fields.value = [...fields.value, newField]
  showModal.value = false
}

onMounted(() => {
  if (mainTable.value && dataset.value?.id) {
    loadPreview()
  }
})
</script>

<style scoped lang="scss">
* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

.preview-loading {
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
}

.spinner {
  animation: rotate 1s linear infinite;
  width: 40px;
  height: 40px;
  stroke: var(--color-accent);
  fill: none;
  stroke-width: 4;
}

@keyframes rotate {
  0% {
    transform: rotate(0deg);
  }

  100% {
    transform: rotate(360deg);
  }
}

.tooltip {
  position: absolute;
  background: var(--color-primary-background);
  color: var(--color-primary-text);
  padding: 6px 10px;
  border-radius: 6px;
  font-size: 0.85rem;
  white-space: nowrap;
  z-index: auto;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);
  pointer-events: none;
  opacity: 0;
  transform: translateY(-5px) translateX(-50%);
  transition: opacity 0.2s ease, transform 0.2s ease;
}

.tooltip.show {
  opacity: 1;
  transform: translateY(0) translateX(-50%);
}

html,
body {
  height: 100%;
  font-family: sans-serif;
  color: var(--color-primary-text);
}

.file_area_header_label {
  display: flex;
  justify-content: center;
  gap: 15px;
  align-items: center;
}

.layout {
  display: grid;
  grid-template-rows: 56px 50px 1fr var(--footer-height, 200px);
  border: 1px solid var(--color-border);
  border-radius: 12px;
  grid-template-areas:
    "header header"
    "toolbar toolbar"
    "field field"
    "footer footer";
  height: 90vh;
  transition: grid-template-columns 0.4s ease;
}

.header,
.file_area_header {
  position: relative;
  grid-area: header;
  background-color: var(--color-header-background);
  display: flex;
  align-items: center;
  padding: 0 1rem;
  gap: 20px;
  height: 61px;
  border-top-left-radius: 12px;
  border-top-right-radius: 12px;
  border-bottom: 1px solid var(--color-border);
}

.file_area_header_buttons {
  margin-left: auto;
  display: flex;
  gap: 10px;
}

.toolbar {
  grid-area: toolbar;
  display: flex;
  background-color: var(--color-header-background);
  align-items: center;
  padding: 0 1rem;
  margin-top: 5px;
  gap: 1rem;
  border-bottom: 1px solid var(--color-border);
}

.tab-group {
  display: inline-flex;
  align-items: center;
  border: 1px solid var(--color-accent);
  border-radius: 6px;
  overflow: hidden;
  height: 2rem;
}

.tab-button {
  background: transparent;
  color: var(--color-accent);
  border: none;
  padding: 0 1rem;
  font-size: 0.85rem;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: background 0.2s;
}

.tab-button.active {
  background: var(--color-accent);
  color: white;
}

.tab-button:not(.active):hover {
  background: rgba(229, 57, 53, 0.2);
}

.file_area {
  grid-area: field;
  padding: 1rem;
  display: flex;
  flex-direction: column;
  height: 100%;
  overflow-y: auto;
  border-bottom-left-radius: 0;
}

.file_area.rounded-bottom {
  border-bottom-right-radius: 12px !important;
}

.flow-wrapper {
  flex: 1;
  position: relative;
}

.footer {
  grid-area: footer;
  padding: 10px;
  text-align: center;
  color: var(--color-secondary-text);
  font-size: 0.9rem;
  border-top: 1px solid var(--color-border);
  border-bottom-left-radius: 12px;
  border-bottom-right-radius: 12px;
  min-height: 100px;
  max-height: 400px;
  overflow: hidden;
  position: relative;
}

.footer::before {
  content: "";
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 6px;
  cursor: row-resize;
  z-index: 1;
}

.footer-wrapper {
  position: relative;
  grid-area: footer;
  overflow: hidden !important;
}

.footer-resizer {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 6px;
  cursor: row-resize;
  z-index: 10;
}

.footer-content {
  position: relative;
  padding: 0.75rem 0 0.75rem 0.75rem;
  padding-bottom: 6px !important;
  background-color: var(--color-hover-background);
  border-top: 1px solid var(--color-border);
  border-bottom-left-radius: 12px;
  border-bottom-right-radius: 12px;
  overflow: hidden;
}

.button-preview {
  margin-left: auto;
  display: flex;
  gap: 10px;
}

.btn-success,
.btn-primary,
.btn-secondary {
  width: 10rem;
  height: 2rem;
  border-radius: 6px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.preview-placeholder {
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--color-secondary-text);
  font-style: italic;
}

.modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.6);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 3;
}

.modal-window {
  background: var(--color-primary-background);
  border-radius: 12px;
  padding: 1.5rem;
  position: relative;
  transform: translateX(140px);
}

.modal-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding-bottom: 1rem;
  border-bottom: 1px solid var(--color-border);
}

.modal-header h5 {
  margin: 0;
  font-size: 1.25rem;
  color: var(--color-primary-text);
}

.close-btn {
  background: transparent;
  border: none;
  font-size: 1.5rem;
  line-height: 1;
  cursor: pointer;
  color: var(--color-secondary-text);
  padding: 0;
}

.fade-enter-active,
.fade-leave-active {
  transition: opacity .3s;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

.table-link-modal {
  width: 624px;
  min-height: 310px;
  background: var(--color-primary-background);
  border-radius: 12px;
  box-shadow: 0 8px 32px #000b;
  padding: 0;
  position: relative;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
}

.modal-window-field {
  width: min(1200px, 95vw);
  height: min(750px, 90vh);
}
</style>
