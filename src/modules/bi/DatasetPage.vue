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
        <button v-if="isNewPage" class="btn btn-primary" :disabled="!canCreateDataset || saving"
          @click="showDatasetDialog = true">Создать датасет</button>

        <button class="btn btn-success save-btn" :hidden="isNewPage" :disabled="!isDirty || saving" @click="editDataset"
          style="color: var(--color-primary-background); min-width: 170px; position: relative;">
          <span v-if="!saving && !saveSuccess">Сохранить датасет</span>
          <span v-else-if="saving" class="saving-spinner">
            <svg class="spin" width="22" height="22" viewBox="0 0 44 44">
              <circle cx="22" cy="22" r="18" fill="none" stroke-width="5" stroke="#fff" stroke-linecap="round" />
            </svg>Сохраняем…</span>
          <span v-else-if="saveSuccess" style="display: flex; align-items: center; gap: 6px;">
            <svg width="22" height="22" viewBox="0 0 20 20">
              <polyline points="4,10 9,16 17,4" stroke="#fff" stroke-width="3" fill="none" />
            </svg>Сохранено!
          </span>
        </button>
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
        <footer class="footer-content" :style="{ height: footerHeight + 'px', position: 'relative' }">
          <template v-if="previewRows && previewRows.length">
            <DatasetTablePreview v-model:limit="previewLimit" :cols="previewCols" :rows="previewRows" :fields="fields"
              :dataset-id="dataset.value?.id" />
            <transition name="fade">
              <div v-if="isPreviewLoading" class="footer-overlay">
                <div class="spinner"></div>
                <span>Загружаем данные…</span>
              </div>
            </transition>
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
      <DatasetNameDialog v-model:visible="showDatasetDialog" :modelValue="dataset.value?.name" @saved="saveDataset" />
    </div>
  </transition>
</template>

<script setup>
import { ref, onMounted, onBeforeUnmount, watch, computed } from 'vue'
import { RefreshCw, Plus, Eye, Loader, Database } from 'lucide-vue-next'
import { useRoute, useRouter } from 'vue-router'

import datasetService from '@/modules/bi/js/datasetService'
import connectionService from '@/modules/bi/js/connectionService'
import { getAggregationOptions } from '@/modules/bi/components/DatasetPreview/js/DatasetPreviewFieldOptions.js'

import DatasetNameDialog from '@/modules/bi/components/DatasetNameDialog.vue'
import TableLinkModal from '@/modules/bi/components/DatasetPreview/TableLinkModal.vue'
import SourceSettings from '@/modules/bi/components/DatasetPreview/SourceSettings.vue'
import DatasetCreating from '@/modules/bi/components/DatasetPreview/DatasetCreating.vue'
import FieldsPage from '@/modules/bi/components/DatasetPreview/FieldsPage.vue'
import ParamsPage from '@/modules/bi/components/DatasetPreview/ParamsPage.vue'
import DatasetTablePreview from '@/modules/bi/components/DatasetPreview/DatasetTablePreview.vue'

const dataset = ref({})   // Текущий датасет (после sync с сервером)
const origDatasetRef = ref(null) // Оригинал с сервера (слепок при открытии/после sync)
const mainTable = ref(null) // Главная таблица (локально)
const allTablesOfConnection = ref([]) // Локальные таблицы (копия)
const relations = ref([])   // Локальный массив связей (draft)

function sanitizeRelations() {
  const mainId = mainTable.value?.id
  if (!mainId) return

  const originalLength = relations.value.length
  const filteredRelations = relations.value.filter(rel => String(rel.rightTableId) !== String(mainId))

  if (filteredRelations.length < originalLength) {
    relations.value = filteredRelations
  }
}

const isPreviewLoading = ref(false)
const fileUploadsCache = ref([])

const selectedConnection = ref(null)
const showTableLinkModal = ref(false)

const editingRelation = ref(null)
const editingRelationIndex = ref(null)

const route = useRoute()
const router = useRouter()
const datasetId = computed(() => route.params.id)
const isNewPage = computed(() => !datasetId.value)

const activeTab = ref('sources')
const isPreviewVisible = ref(true)

const fields = ref([])
const saving = ref(false)
const saveSuccess = ref(false)
const showDatasetDialog = ref(false)

const selectedTables = ref([])

const previewCols = ref([])
const previewRows = ref([])
const previewLimit = ref(10)

const currentDatasetId = computed(() => dataset.value?.id)

const emit = defineEmits([
  'update:selectedConnection',
  'tableDrop', 'limit'
])

const headerName = computed(() =>
  dataset.value?.name || 'Новый датасет'
)

const canCreateDataset = computed(() =>
  isNewPage.value && !!mainTable.value?.id
)

const isDirty = computed(() => {
  if (!origDatasetRef.value) return false;
  if (selectedConnection.value?.id !== origDatasetRef.value.connection) return true;
  if (mainTable.value?.file_id !== origDatasetRef.value.file_source) return true;
  const origMain = (origDatasetRef.value.tables || []).find(t => t.order === 0);
  const cur = JSON.stringify(normalizeRelations(relations.value));
  const orig = JSON.stringify(normalizeRelations(getRelationsFromDataset(origDatasetRef.value, origMain ? origMain.id : null)));
  if (cur !== orig) return true;
  if (isFieldsDirty()) return true;
  return false;
});

function isFieldsDirty() {
  if (!origDatasetRef.value || !Array.isArray(origDatasetRef.value.fields)) return false;

  const keysToCheck = ['name', 'aggregation', 'type', 'description'];
  const origMap = new Map(origDatasetRef.value.fields.map(f => [f.name, f]));

  // Если список полей отличается по именам
  const curNames = new Set(fields.value.map(f => f.name));
  const origNames = new Set(origDatasetRef.value.fields.map(f => f.name));
  if (curNames.size !== origNames.size || ![...curNames].every(n => origNames.has(n))) return true;

  // Сравнение по значимым параметрам
  for (const f of fields.value) {
    const orig = origMap.get(f.name);
    if (!orig) return true;

    for (const key of keysToCheck) {
      if ((f[key] || '') !== (orig[key] || '')) {
        return true;
      }
    }
  }

  return false;
}

function normalizeRelations (rels = []) {
  return rels
    .map(({ rightTableId, joinType, lines = [] }) => ({
      rightTableId: String(rightTableId),
      joinType: String(joinType),
      lines: lines
        .map(({ left, right }) => ({
          left: String(left),
          right: String(right)
        }))
        .sort((a, b) => (a.left + a.right).localeCompare(b.left + b.right))
    }))
    .sort((a, b) => String(a.rightTableId).localeCompare(String(b.rightTableId)))
}

async function saveDataset(finalName) {
  saving.value = true
  try {
    let dsId = dataset.value?.id

    const fieldsAgg = fields.value
      .filter(f => f.name)
      .map(f => ({
        name: f.name,
        aggregation: f.aggregation
      }));


    if (!dsId) {
      const payload = {
        name: finalName,
        description: dataset.value?.description || '',
        connection: selectedConnection.value?.id || null,
        file_source: mainTable.value?.file_id || null,
        table_ref: mainTable.value?.table_ref || null,
        fields: fieldsAgg.length ? fieldsAgg : undefined
      }
      const res = await datasetService.createDataset(payload)
      if (!res?.data?.id) throw new Error('Ошибка при создании датасета')
      dsId = res.data.id
      for (const rel of relations.value) {
        await datasetService.addRelation({
          datasetId: dsId,
          rightTableId: rel.rightTableId,
          joinType: rel.joinType,
          lines: rel.lines,
        })
      }
      const { data: updated } = await datasetService.getDataset(dsId)
      dataset.value = updated
    } else {
      const payload = { name: finalName }
      const putOk = await safeUpdateDataset(
        datasetService.updateDataset(dsId, payload)
      )
      if (!putOk) throw new Error('Ошибка при обновлении датасета')
      const { data: updated } = await datasetService.getDataset(dsId)
      dataset.value = updated
    }

    router.replace({ name: 'DatasetPage', params: { id: dsId } })
  } finally {
    saving.value = false
  }
}

function updateSelectedTables() {
  const tables = new Set();
  if (mainTable.value) tables.add(mainTable.value);

  relations.value.forEach(rel => {
    const tbl = allTablesOfConnection.value.find(t => t.id === rel.rightTableId);
    if (tbl) tables.add(tbl);
  });

  selectedTables.value = Array.from(tables);
}

async function editDataset(finalName = dataset.value?.name) {
  saving.value = true
  saveSuccess.value = false
  try {
    if (!dataset.value?.id) return;
    const dsId = dataset.value.id;
    let datasetName = finalName;
    if (typeof datasetName === 'object' && datasetName !== null) {
      if ('name' in datasetName) {
        datasetName = datasetName.name;
      } else if ('target' in datasetName && typeof datasetName.target.value === 'string') {
        datasetName = datasetName.target.value;
      } else {
        datasetName = undefined;
      }
    }

    const fieldsAgg = fields.value
  .filter(f => f.name)
  .map(f => ({
    id: (typeof f.id === 'number' || (typeof f.id === 'string' && !f.id.toString().startsWith('new_'))) ? f.id : undefined,
    name: f.name,
    aggregation: f.aggregation,
    type: f.type,
    description: f.description,
    source_column: f.source?.column,
    source_table: f.source_table,
  }));

    const patch = {};
    if (selectedConnection.value?.id !== origDatasetRef.value.connection)
      patch.connection = selectedConnection.value.id;
    if (mainTable.value?.file_id !== origDatasetRef.value.file_source) {
      patch.file_source = mainTable.value.file_id;
      patch.table_ref = mainTable.value.table_ref;
    }
    if (datasetName && datasetName !== origDatasetRef.value.name)
      patch.name = datasetName;

    if (fieldsAgg.length) {
      patch.fields = fieldsAgg;
    }

    if (Object.keys(patch).length) {
      await datasetService.updateDataset(dsId, patch);
    }

    const origMain = (origDatasetRef.value.tables || []).find(t => t.order === 0);
    const origMap = new Map(getRelationsFromDataset(origDatasetRef.value, origMain ? origMain.id : null).map(r => [String(r.rightTableId), r]));
    const curMap = new Map(relations.value.map(r => [String(r.rightTableId), r]));

    for (const [id, rel] of curMap) {
      const orig = origMap.get(id);
      if (
        orig &&
        orig.joinType === rel.joinType &&
        JSON.stringify(orig.lines) === JSON.stringify(rel.lines)
      ) {
        continue;
      }
      const tableObj = allTablesOfConnection.value.find(
        t => Number(t.id) === Number(rel.rightTableId)
      );
      const relationPayload = {
        datasetId: dataset.value.id,
        rightTableId: rel.rightTableId,
        joinType: rel.joinType,
        lines: rel.lines,
      };
      if (tableObj?.file_id) relationPayload.file_id = tableObj.file_id;

      await datasetService.addRelation(relationPayload);
    }

    const origMainId = origMain ? String(origMain.id) : null;
    for (const id of origMap.keys()) {
      if (id === origMainId) continue;
      if (!curMap.has(id)) {
        await datasetService.removeRelation({ datasetId: dsId, rightTableId: id });
      }
    }

    const { data: fresh } = await datasetService.getDataset(dsId)
    const { data: files } = await connectionService.getFiles(fresh.connection)
    fileUploadsCache.value = files
    await hydrateFromDataset(fresh)
    relations.value = getRelationsFromDataset(fresh, mainTable.value?.id)
    dataset.value = fresh
    origDatasetRef.value = JSON.parse(JSON.stringify(fresh));
    saveSuccess.value = true
    setTimeout(() => saveSuccess.value = false, 1000)
  } finally {
    saving.value = false
  }
}


function handleTablesLoaded(files) {
  fileUploadsCache.value = files
  buildAllTables(files)

  if (
    mainTable.value &&
    /^temp_[a-f0-9]{32}/.test(mainTable.value.display_name || '')
  ) {
    const match = files.find(
      f => mainTable.value.file_id
        ? f.id === mainTable.value.file_id
        : f.columns_info &&
        mainTable.value.columns_info &&
        JSON.stringify(f.columns_info.columns) ===
        JSON.stringify(mainTable.value.columns_info.columns)
    )

    if (match) {
      mainTable.value.display_name = match.original_filename
      mainTable.value.name = match.original_filename
      if (!mainTable.value.columns_info && match.columns_info) {
        mainTable.value.columns_info = match.columns_info
      }
    }
  }
}

async function fetchConnectionFiles(connId) {
  try {
    const { data } = await connectionService.getFiles(connId)
    fileUploadsCache.value = data
  } catch (e) {
    console.warn('Не удалось получить файлы подключения', e)
  }
}

function buildAllTables(files = fileUploadsCache.value, freshTables) {
  const dsTablesRaw = freshTables || dataset.value?.tables || [];
  const mainTableId = dsTablesRaw.find(t => t.order === 0)?.id;

  const dsTables = dsTablesRaw.map(t => ({
    ...t,
    id: Number(t.id),
    file_id: t.file_upload_id,
    display_name: t.display_name || t.file_upload_name || t.table_name,
    name: t.display_name || t.file_upload_name || t.table_name,
    columns_info: t.columns_info || null,
    file_upload_name: t.file_upload_name || null,
    isMain: Number(t.id) === Number(mainTableId),
  }));

  const uniqueStaging = new Map();
  (files || []).forEach(f => {
    uniqueStaging.set(f.id, {
      ...f,
      id: -f.id,
      file_id: f.id,
      order: 1,
      display_name: f.original_filename,
      name: f.original_filename,
      columns_info: f.columns_info || null,
      isMain: false
    });
  });

  dsTables.forEach(t => {
    const key = t.file_id || t.id;
    if (t.file_id && uniqueStaging.has(t.file_id)) {
      const fileData = uniqueStaging.get(t.file_id);
      const mergedData = { ...fileData, ...t, id: t.id };

      mergedData.display_name = t.display_name || fileData.display_name;
      mergedData.name = mergedData.display_name;

      uniqueStaging.set(t.file_id, mergedData);
    } else {
      uniqueStaging.set(key, t);
    }
  });


  allTablesOfConnection.value = Array.from(uniqueStaging.values());

  updateSelectedTables();

  relations.value = relations.value
    .map(rel => {
      const tbl =
        allTablesOfConnection.value.find(t => t.id === rel.rightTableId) ||
        allTablesOfConnection.value.find(t => t.file_id === rel.rightTableId);

      if (!tbl) return null;
      return { ...rel, rightTableId: tbl.id };
    })
    .filter(Boolean);

  const actualMain = allTablesOfConnection.value.find(t => t.isMain);
  if (actualMain) mainTable.value = actualMain;
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

    if ((!t.display_name || /^temp_[a-f0-9]{32}/.test(t.display_name)) && backupMain?.original_filename) {
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

  const looksTemp = /^temp_[a-f0-9]{32}/.test(t.display_name || '')
  const prettyName =
    (looksTemp && t.file_upload_name)
      ? t.file_upload_name
      : looksTemp && backup?.original_filename
        ? backup.original_filename
        : t.display_name
        || backup?.original_filename
        || t.name
        || t.table_name

  return {
    id: t.id,
    table_ref: t.table_name,
    display_name: prettyName,
    name: prettyName,
    columns_info: t.columns_info || backup?.columns_info || null,
    isMain: isMain
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
      await hydrateFromDataset(ds)
      selectedTables.value = ds.tables.map(mapTable).filter(Boolean)
      buildAllTables()
    } else {
      await loadDataset(ds.id)
    }
    return true
  } catch (err) {
    console.error(err)
    return false
  }
}

async function hydrateFromDataset(ds) {
  const main = (ds.tables || []).find(t => t.order === 0 || !t.joined_on_type) || (ds.tables ? ds.tables[0] : null);
  if (main) mainTable.value = mapTable(main)

  const connId = main?.connection || ds.selectedConnection
  if (connId) {
    if (!selectedConnection.value)
      selectedConnection.value = { id: connId, name: `Connection #${connId}` }

    await fetchConnectionFiles(connId)
    relations.value = getRelationsFromDataset(ds, main ? main.id : null)
    buildAllTables(fileUploadsCache.value, ds.tables)

    try {
      const resp = await connectionService.get(connId)
      const conn = resp?.data ?? resp
      if (conn && conn.name) {
        selectedConnection.value = {
          ...selectedConnection.value,
          name: conn.name || selectedConnection.value.name,
          connector_type: conn.connector_type ?? selectedConnection.value.connector_type
        }
      }
    } catch (e) {
      console.warn('Не удалось получить название подключения', e)
    }
  } else {
    selectedConnection.value = null
    relations.value = getRelationsFromDataset(ds, main ? main.id : null)
    buildAllTables(fileUploadsCache.value, ds.tables)
  }
  sanitizeRelations()
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

function handleRelationApply(relation) {
  let rightId = relation.rightTableId;
  let staging = allTablesOfConnection.value.find(tbl => tbl.id === rightId);

  if (!staging) {
    staging = allTablesOfConnection.value.find(tbl => tbl.file_id === rightId && tbl.id > 0);
    if (staging) rightId = staging.id;
  }

  if (!staging) {
    return;
  }

  const idx = relations.value.findIndex(r => r.rightTableId === rightId);
  const fixedRel = { ...relation, rightTableId: rightId };
  if (idx !== -1) relations.value[idx] = fixedRel;
  else relations.value.push(fixedRel);

  buildAllTables();
  updateSelectedTables();
  loadPreview();
  sanitizeRelations();
}

async function onEditRelation(rel, idx) {
  editingRelation.value = JSON.parse(JSON.stringify(rel))
  editingRelationIndex.value = idx
  if (selectedConnection.value?.id) {
    await fetchConnectionFiles(selectedConnection.value.id)
    buildAllTables(fileUploadsCache.value)
  }
  showTableLinkModal.value = true
}

function getRelationsFromDataset(ds, mainTableId) {
  const relationsMap = new Map();
  (ds.tables || [])
    .filter(t => t.id !== mainTableId && t.joined_on_type && t.joined_on_left && t.joined_on_right)
    .forEach(t => {
      const rightTableId = t.id;
      const line = { left: t.joined_on_left, right: t.joined_on_right };

      if (relationsMap.has(rightTableId)) {
        const existing = relationsMap.get(rightTableId);
        if (!existing.lines.some(l => l.left === line.left && l.right === line.right)) {
          existing.lines.push(line);
        }
      } else {
        relationsMap.set(rightTableId, {
          rightTableId: rightTableId,
          joinType: t.joined_on_type?.toLowerCase(),
          lines: [line]
        });
      }
    });
  return Array.from(relationsMap.values());
}

async function openTableLinkModal() {
  if (!selectedConnection.value?.id) return

  await fetchConnectionFiles(selectedConnection.value.id)
  buildAllTables(fileUploadsCache.value)

  editingRelation.value = null
  showTableLinkModal.value = true
}

function removeRelationById(rightTableId) {
  relations.value = relations.value.filter(rel => rel.rightTableId !== rightTableId)
  loadPreview()
}

function needsDataset(tab) {
  return tab === 'fields' || tab === 'params'
}
function tabLabel(tab) {
  return tab === 'fields' ? 'поля' : (tab === 'params' ? 'параметры' : '')
}

async function loadPreview() {
  isPreviewLoading.value = true
  try {
    const main = mainTable.value
    const joined = relations.value.map(rel => {
      const tbl = allTablesOfConnection.value.find(t => t.id === rel.rightTableId)
      if (!tbl) return null
      return {
        ...tbl,
        joinType: rel.joinType,
        lines: rel.lines
      }
    })
      .filter(Boolean)
    const resp = await datasetService.draftPreview({
      connection_id: selectedConnection.value?.id,
      mainTable: main,
      joinedTables: joined,
      limit: previewLimit.value,
    })
    if (resp && resp.data) {
      previewCols.value = resp.data.columns || []
      previewRows.value = resp.data.rows || []
      await loadFields()
    } else {
      previewCols.value = []
      previewRows.value = []
    }
  } finally {
    console.log('fields.value:', fields.value)
    isPreviewLoading.value = false
  }
}

watch(mainTable, async (val, oldVal) => {
  if (!val) return;

  // normalise `file_id` once
  if (val.file_type && !val.file_id) val.file_id = val.id;

  if ((val.file_id || val.table_name) && selectedConnection.value) {
    await loadPreview();
  }
  updateSelectedTables();
});

watch(previewLimit, val => {
  loadPreview()
})

watch(mainTable, async (val, oldVal) => {
  if (val && val.file_id && selectedConnection.value) {
    if (!oldVal || val.file_id !== oldVal.file_id) {
      await loadPreview()
    }
  }
  updateSelectedTables();
})

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
  if (previewCols.value.length && previewRows.value.length) {
    const allDraftTables = [
      mainTable.value,
      ...relations.value.map(r => allTablesOfConnection.value.find(t => t.id === r.rightTableId)).filter(Boolean)
    ];
    const col2Table = {};
    previewCols.value.forEach(col => {
      let foundTable = allDraftTables.find(t =>
        t?.columns_info?.columns?.includes(col)
      );
      col2Table[col] = foundTable || mainTable.value;
    });

    // 1. Загруженный датасет: поля из origDatasetRef.value.fields
    if (dataset.value?.id && Array.isArray(origDatasetRef.value?.fields) && origDatasetRef.value.fields.length) {
  const origFieldsMap = new Map(
  origDatasetRef.value.fields.map(f => [String(f.id ?? f.name), f])
);

  const fieldsList = previewCols.value.map((col, idx) => {
  // Пробуем найти по id, если id нет — fallback по name
  let orig = origDatasetRef.value.fields.find(f => f.source_column === col || f.name === col);
  if (origFieldsMap.has(String(orig?.id))) orig = origFieldsMap.get(String(orig.id));
  const tableObj = col2Table[col] || mainTable.value;
  const columnValues = previewRows.value.map(row => row[idx]);
  const colType = detectColumnType(columnValues);

  if (orig) {
    return {
      ...orig,
      source: orig.source || { table: tableObj?.display_name || tableObj?.name || tableObj?.table_name, column: col },
      source_table: orig.source_table || tableObj?.id,
      source_column: orig.source_column || col,
      values: columnValues,
    };
  }
  // Новое поле
  const aggOptions = getAggregationOptions(colType);
  return {
    id: 'new_' + idx,
    name: col,
    source: { table: tableObj?.display_name || tableObj?.name || tableObj?.table_name, column: col },
    source_table: tableObj?.id,
    source_column: col,
    type: colType,
    aggregation: aggOptions[0]?.value ?? 'none',
    description: ''
  }
});
fields.value = fieldsList;
  return;
}

    // 2. Новый датасет: дефолтная агрегация
    const newFields = previewCols.value.map((col, idx) => {
      const tableObj = col2Table[col] || mainTable.value;
      const tableName = tableObj?.display_name || tableObj?.name || tableObj?.table_name || 'НеизвестнаяТаблица';
      const columnValues = previewRows.value.map(row => row[idx]);
      const colType = detectColumnType(columnValues);
      const aggOptions = getAggregationOptions(colType);

      return {
        id: 'new_' + idx,
        name: col,
        source: { table: tableName, column: col },
        source_table: tableObj?.id,
        type: colType,
        aggregation: aggOptions[0]?.value ?? 'none',
        description: ''
      }
    });
    fields.value = newFields;
    return;
  }
  fields.value = [];
}

watch(datasetId, async (newId, oldId) => {
  if (newId && newId !== oldId) {
    await loadDataset(newId)
  }
})

watch(previewLimit, async (val, old) => {
  console.log('previewLimit changed:', old, '→', val)
  if (val !== old && isPreviewVisible.value && dataset.value?.id) {
    console.log('→ Делаем loadPreview() с лимитом', val)
    await loadPreview()
  }
})

async function loadDataset(id) {
  const { data } = await datasetService.getDataset(id)
  dataset.value = data
  origDatasetRef.value = JSON.parse(JSON.stringify(data))
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
let footerMax = 400
let isFooterResizing = false
let footerStartY = 0
let footerStartHeight = 0

function startFooterResize(e) {
  isFooterResizing = true
  footerStartY = e.clientY
  footerStartHeight = footerHeight.value

  const layout = document.querySelector('.layout')
  const toolbar = document.querySelector('.toolbar')

  if (layout && toolbar) {
    const layoutRect = layout.getBoundingClientRect()
    const toolbarRect = toolbar.getBoundingClientRect()
    footerMax = layoutRect.bottom - toolbarRect.bottom
  } else {
    footerMax = 600
  }

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

onBeforeUnmount(() => {
  stopFooterResize()
})

function togglePreview() {
  if (isPreviewVisible.value) {
    isPreviewVisible.value = false
  } else {
    isPreviewVisible.value = true
    loadPreview()
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
  position: relative;
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
  padding-bottom: 200px;
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
  background-color: var(--color-header-background);
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

.save-btn .saving-spinner {
  display: flex;
  align-items: center;
  gap: 8px;
}

.save-btn .spin {
  animation: spin 0.8s linear infinite;
  stroke: var(--color-primary);
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

.footer-overlay {
  position: absolute;
  inset: 0;
  z-index: 10;
  background: var(--color-primary-background);
  display: flex;
  align-items: center;
  justify-content: center;
  flex-direction: column;
  pointer-events: all;
  font-size: 1.1rem;
}

.spinner {
  width: 32px;
  height: 32px;
  border: 4px solid var(--color-border);
  border-top: 4px solid var(--color-secondary-text);
  border-radius: 50%;
  animation: spin .8s linear infinite;
  margin-bottom: 1rem;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

.fade-enter-active,
.fade-leave-active {
  transition: opacity .3s;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>
