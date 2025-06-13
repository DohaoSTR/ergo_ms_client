<template>
  <div class="layout" :style="{
    gridTemplateColumns: activeTab === 'sources' ? '250px 1fr' : '1fr',
    '--footer-height': isPreviewVisible ? footerHeight + 'px' : '0px'
  }">
    <header class="file_area_header">
      <div class="file_area_header_label">
        <Database />
        <div style="overflow: hidden; white-space: nowrap; text-overflow: ellipsis;">
          <h4 class="header-label" style="margin-bottom: 3px;">Новый датасет</h4>
        </div>
      </div>
      <div class="file_area_header_buttons">
        <button type="button" class="btn btn-primary">Создать датасет</button>
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
</template>

<script setup>
import { ref, onMounted, onBeforeUnmount, watch, computed } from 'vue'
import { RefreshCw, Plus, Eye, Loader, Database } from 'lucide-vue-next'
import { useRoute } from 'vue-router'

import datasetService from '@/js/api/services/bi/datasetService'
import { getAggregationOptions } from '@/pages/bi/components/DatasetPreview/js/DatasetPreviewFieldOptions.js'

import TableLinkModal from '@/pages/bi/components/DatasetPreview/TableLinkModal.vue'
import SourceSettings from '@/pages/bi/components/DatasetPreview/SourceSettings.vue'
import DatasetCreating from '@/pages/bi/components/DatasetPreview/DatasetCreating.vue'
import FieldsPage from '@/pages/bi/components/DatasetPreview/FieldsPage.vue'
import ParamsPage from '@/pages/bi/components/DatasetPreview/ParamsPage.vue'
import DatasetTablePreview from '@/pages/bi/components/DatasetPreview/DatasetTablePreview.vue'

const isPreviewLoading = ref(false)
const isLoading = ref(false)
const fileUploadsCache = ref([])

const selectedConnection = ref(null)
const mainTable = ref(null)
const showTableLinkModal = ref(false)

const editingRelation = ref(null)
const editingRelationIndex = ref(null)

const allTablesOfConnection = ref([])
const columnToTableMap = ref({})

// Параметр из урла (если есть)
const route = useRoute()
const datasetId = route.params.id

// Состояния
const activeTab = ref('sources')
const isPreviewVisible = ref(true)

const dataset = ref({})
const fields = ref([])
const relations = ref([])

const isSyncFromBackend = ref(false)

// Доп.список таблиц (SourcesPageLinks)
const selectedTables = ref([])
const selectedRelations = ref([])

// Preview state
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

function handleTablesLoaded(files) {
  fileUploadsCache.value = files          // сохраняем
  buildAllTables(files)
}

function buildAllTables(files = fileUploadsCache.value) {
  /* === 1. Все DataSetTable-ы из датасета ========================== */
  const dsTables = (dataset.value?.tables || []).map(t => ({
    ...t,
    id: Number(t.id),                // id именно DataSetTable
    file_id: t.file_upload_id,            // поможет склеить с FileUpload
    display_name: t.display_name || t.table_name,
    columns_info: t.columns_info || null
  }))

  /* === 2. Формируем единый массив без дублей ====================== */
  const merged = [];
  (files || []).forEach(f => {
    /* temp-таблица уже создана? */
    const ds = dsTables.find(dt =>
      dt.file_id === f.id ||                       // старое условие
      dt.display_name === f.original_filename ||   // temp уже переименована
      dt.table_name === f.table_name             // редкий случай
    )

    if (ds) {
      if (!ds.columns_info && f.columns_info)      // копируем список колонок
        ds.columns_info = f.columns_info

      /* красивое имя: берем original_filename */
      if (!ds.display_name ||
        /^temp_[a-f0-9]{32}/.test(ds.display_name))
        ds.display_name = f.original_filename
      merged.push(ds)
    } else {
      /* файл ещё не добавлен в датасет */
      merged.push({
        ...f,
        id: -f.id,                    // отрицательный id
        file_id: f.id,
        display_name: f.original_filename,
        columns_info: f.columns_info || null,
        isMain: false
      })
    }
  })

  /* === 3. temp-таблицы, у которых нет исходного файла ============= */
  dsTables.forEach(dt => {
    if (!merged.some(m => m.id === dt.id)) merged.push(dt)
  })

  allTablesOfConnection.value = merged
}

function mapTable(t) {
  const isMain = !t.joined_on || t.joined_on === null

  /* 1. Удаляем только тех, у кого  ➜ temp_*   И   НЕТ columns_info   И   не main */
  if (!isMain &&
    /^temp_[a-f0-9]{32}/.test(t.table_name) &&
    !t.columns_info &&
    (t.file_upload_id == null && t.file_id == null)) {
    return            // undefined → filter(Boolean) уберёт
  }
  /* 2. Если это ГЛАВНАЯ и у неё всё ещё нет схемы либо нормального имени —
        берём их из выбранного mainTable или из FileUpload-кеша */
  if (isMain) {
    const backupMain = mainTable?.value             // выбранный файл
                      || fileUploadsCache.value.find(
                          f => f.id === t.file_upload_id
                        )

    /* columns_info */
    if (!t.columns_info && backupMain?.columns_info) {
      t.columns_info = backupMain.columns_info
    }

    /* красивое имя */
    if (
      (!t.display_name || /^temp_[a-f0-9]{32}/.test(t.display_name)) &&
      backupMain?.original_filename
    ) {
      t.display_name = backupMain.original_filename
    }
  }
  if (isMain && !t.columns_info) {
    const backup = fileUploadsCache.value.find(
      f => f.original_filename === t.display_name || f.id === t.file_upload_id
    )
    if (backup?.columns_info) t.columns_info = backup.columns_info
  }
  /* ищем исходный файл */
  let backup = null
  if (t.file_upload_id != null) {
    backup = fileUploadsCache.value.find(f => f.id === t.file_upload_id)
  }
  if (!backup && t.display_name?.endsWith('.xlsx')) {
    backup = fileUploadsCache.value.find(
      f => f.original_filename === t.display_name
    )
  }

  return {
    id: t.id,
    table_ref: t.table_name,
    display_name: t.display_name || t.table_name,
    columns_info: t.columns_info || backup?.columns_info || null
  }
}

async function safeUpdateDataset(promise) {
  try {
    const resp = await promise

    const p = resp && resp.data ? resp.data : resp

    let ok, ds
    if (p && typeof p === 'object') {
      if ('success' in p) {
        ok = p.success
        ds = p.dataset ?? p.data
      } else if ('id' in p) {
        ok = true
        ds = p
      }
    }

    if (!ok || !ds?.id) {
      if (p?.error) console.error(p.error)
      return false
    }

    dataset.value = ds
    relations.value = getRelationsFromDataset(ds)

    selectedTables.value = ds.tables.map(mapTable).filter(Boolean)

    buildAllTables()
    return true
  } catch (err) {
    console.error(err)
    return false
  }
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
  // ... сохраняешь связь (JOIN)
  const ok = await safeUpdateDataset(datasetService.getDataset(dataset.value.id));
  if (!ok) return;
  console.log('dataset.value после JOIN:', dataset.value)
  console.log('DATASET: ', JSON.stringify(dataset.value, null, 2));
  console.log('TABLES: ', dataset.value.tables);
  relations.value = getRelationsFromDataset(dataset.value)
  console.log('[AFTER JOIN] dataset:', dataset.value);
  await loadPreview();
}

function onEditRelation(rel, idx) {
  // НЕ просто копия {...rel}, а полный клон без реактивности:
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
      rightTableName: t.display_name || t.table_name, // если понадобится
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
    /* safeUpdateDataset уже обновил dataset.value и relations */
    await loadPreview()
    buildAllTables()                      // чтобы обновился селект
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
  console.log('[PREVIEW_DEBUG] datasetId:', dataset.value.id, 'table_ref:', dataset.value.table_ref);
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
  // 1. Если есть datasetId — грузим с API
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

  // 2. Если есть cols и rows (т.е. предпросмотр)
  if (previewCols.value.length && previewRows.value.length) {
    // --- строим карту: имя_колонки → таблица ---------------------------
    console.group('[DEBUG] selectedTables с columns_info');
    console.table((selectedTables.value || []).map(t => ({
      id: t.id,
      name: t.display_name || t.table_name,
      hasColumnsInfo: !!t.columns_info,
      cols: t.columns_info?.columns?.length || 0
    })));
    console.groupEnd();
    const col2Table = {};
    (selectedTables.value || []).forEach(t => {
      const cols = t.columns_info?.columns || []
      cols.forEach(c => {          // если несколько таблиц содержат одно
        if (!col2Table[c]) col2Table[c] = t   // имя – берём первую
      })
    })
    columnToTableMap.value = col2Table
    const liveMain = selectedTables.value.find(
      t => t && !/^temp_[a-f0-9]{32}/.test(t.display_name)
    ) || selectedTables.value[0]         // первая всегда главная
    previewCols.value.forEach(c => {
      if (!col2Table[c] && liveMain) col2Table[c] = liveMain
    })
    fields.value = previewCols.value.map((col, idx) => {
      // --- определяем источник поля ---
      const tableObj = col2Table[col]           // <— ищем в карте
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

  // 3. Если только cols (нет rows)
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

onMounted(async () => {
  if (datasetId) {
    const { data } = await datasetService.getDataset(datasetId)
    dataset.value = data
    relations.value = getRelationsFromDataset(data)
    selectedTables.value = data.tables.map(mapTable).filter(Boolean)
    selectedRelations.value = data.tables.map(t => ({
      source: String(data.tables[0].id),
      target: String(t.id),
      joinType: t.joined_on.type
    }))
    buildAllTables()
  }
})

async function createDatasetFrom(tbl) {
  const payload = {
    name: `${tbl.name || tbl.table}_${Date.now()}`,
    connection: selectedConnection.value.id,
    file_source: tbl.id,
    is_temporary: true
  }

  /* 1. получаем ответ от сервиса */
  const resp = await datasetService.createDataset(payload)

  /* 2. нормализуем */
  let ok = false
  let dataset = null

  if (resp?.success) {                   // оба формата содержат success
    if (resp.dataset) {
      ok = true
      dataset = resp.dataset             // формат №2
    } else if (resp.data) {
      ok = true
      dataset = resp.data                // формат №1
    }
  }

  if (!ok || !dataset?.id) {
    console.error('[CREATE] unexpected response', resp)
    return
  }

  /* 3. копируем columns_info из файла во вновь-созданную таблицу */
  const target =
    dataset.tables.find(t => t.file_upload_id === tbl.id) || dataset.tables[0]

  if (target && !target.columns_info && tbl.columns_info) {
    target.columns_info = tbl.columns_info
  }

  const pretty = tbl.original_filename || tbl.name
  if (pretty && (!target.display_name || target.display_name.startsWith('temp_'))) {
    target.display_name = pretty
  }

  /* 4. передаём объект дальше как promise-like */
  const ok2 = await safeUpdateDataset(Promise.resolve(dataset))
  if (!ok2) return

  selectedTables.value = dataset.tables.map(mapTable).filter(Boolean)
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

watch(dataset, (val) => {
  console.log('Dataset changed:', val)
})

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
  color: var(--color-primary-text);
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
