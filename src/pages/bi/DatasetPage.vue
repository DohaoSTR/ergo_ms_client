<template>
  <div class="layout" :class="{ 'with-sidebar': activeTab === 'sources', 'resizing-sidebar': isSidebarResizing }"
    :style="{
      gridTemplateColumns: activeTab === 'sources' ? sidebarWidth + 'px 1fr' : '0px 1fr',
      '--footer-height': isPreviewVisible ? footerHeight + 'px' : '0px'
    }">
    <header class="file_area_header">
      <div class="file_area_header_label">
        <nav aria-label="breadcrumb">
          <ol class="breadcrumb">
            <li class="breadcrumb-item"><a href="#">BI</a></li>
            <li class="breadcrumb-item"><a href="#">Датасеты</a></li>
            <li class="breadcrumb-item active" aria-current="page">Новый датасет</li>
          </ol>
        </nav>
      </div>
      <div class="file_area_header_buttons">
        <button type="button" class="btn btn-secondary">Создать чарт</button>
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
        <button v-if="activeTab === 'fields'" class="btn btn-outline-secondary" style="display: flex; gap: 5px;"
          @click="refreshFields">
          <template v-if="isPreviewLoading">
            <Loader class="icon-loading" />
            Загрузка…
          </template>
          <template v-else>
            <RefreshCw :size="18" />Обновить поля
          </template>
        </button>
        <button class="btn btn-outline-secondary" style="display: flex; gap: 5px;" @click="togglePreview"
          :disabled="isPreviewLoading">
          <Eye :size="18" /> Предпросмотр
        </button>
        <button v-if="activeTab === 'fields'" class="btn btn-outline-secondary" style="display: flex; gap: 5px;"
          @click="addField">
          <Plus :size="18" />Добавить поле
        </button>
      </div>
    </div>

    <transition name="slide">
      <div v-if="activeTab === 'sources'" class="sidebar-wrapper">
        <aside class="sidebar" :style="{ width: sidebarWidth + 'px' }" :class="{ 'rounded-bottom': !isPreviewVisible }">
          <div class="sidebar-resizer" @mousedown.prevent="startSidebarResize"></div>
          <SourcesPage v-model:selectedConnection="selectedConnection" v-model:selectedTables="selectedTables"
            @update:selectedTables="onTablesChange" />
        </aside>
      </div>
    </transition>

    <main class="file_area" :class="{ 'rounded-bottom': !isPreviewVisible }">
      <div v-if="activeTab === 'sources'" class="flow-wrapper">
        <SourcesPageLinks v-model:selectedTables="selectedTables" v-model:relations="selectedRelations" />
      </div>
      <div v-else>
        <component v-if="activeTab === 'fields' && selectedTables.length" :is="getTabComponent(activeTab)"
          v-model:fields="fields" :tables="selectedTables" :cols="previewCols" :rows="previewRows"
          :dataset-id="needsDataset(activeTab) && dataset.value ? dataset.value.id : null"
          @remove-table="handleRemoveTable" @update:fields="fields = $event" />
        <div v-else class="text-muted p-4"
          style="display: flex; justify-content: center; align-items: center; height: 100%; width: 100%; text-align: center;">
          Сначала выберите таблицу и создайте датасет,<br>чтобы редактировать {{ tabLabel(activeTab) }}.
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
              Выберите подключение и перетяните на основное поле таблицы, чтобы увидеть превью
            </div>
          </template>
        </footer>
      </div>
    </transition>
  </div>
  <transition name="fade">
    <div v-if="showModal" class="modal-overlay">
      <div class="modal-window">
        <div class="modal-header">
          <h5>Настройка поля</h5>
          <button class="close-btn" @click="showModal = false">&times;</button>
        </div>
        <SourceSettings v-if="showModal" :field="selectedField" :tables="selectedTables" :cols="previewCols"
          :rows="previewRows" @close="showModal = false" @save="onSourceSave" />
      </div>
    </div>
  </transition>
</template>

<script setup>
import { ref, onMounted, onBeforeUnmount, watch, } from 'vue'
import { RefreshCw, Plus, Eye, Loader } from 'lucide-vue-next'
import { useRoute } from 'vue-router'

import datasetService from '@/js/api/services/bi/datasetService'
import { getAggregationOptions } from '@/pages/bi/components/DatasetPreview/js/DatasetPreviewFieldOptions.js'
import { useAutoJoin } from '@/pages/bi/components/DatasetPreview/js/useAutoJoin.js'

import SourceSettings from '@/pages/bi/components/DatasetPreview/SourceSettings.vue'
import SourcesPage from '@/pages/bi/components/DatasetPreview/SourcesPage.vue'
import SourcesPageLinks from '@/pages/bi/components/DatasetPreview/SourcesPageLinks.vue'
import FieldsPage from '@/pages/bi/components/DatasetPreview/FieldsPage.vue'
import ParamsPage from '@/pages/bi/components/DatasetPreview/ParamsPage.vue'
import DatasetTablePreview from '@/pages/bi/components/DatasetPreview/DatasetTablePreview.vue'

const isPreviewLoading = ref(false)

// Параметр из урла (если есть)
const route = useRoute()
const datasetId = route.params.id

// Состояния
const activeTab = ref('sources')
const isPreviewVisible = ref(true)

const dataset = ref(null)
const fields = ref([])

// Источник
const selectedConnection = ref(null)

// Доп.список таблиц (SourcesPageLinks)
const selectedTables = ref([])
const selectedRelations = ref([])

// Preview state
const previewCols = ref([])
const previewRows = ref([])
const previewLimit = ref(10)

// ==== Сайдбар ресайз ====
const sidebarWidth = ref(260)
const sidebarMin = 150
const sidebarMax = 400
let isSidebarResizing = false
let sidebarStartX = 0
let sidebarStartWidth = 0

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
  // 1. Если есть datasetId — грузим с API
  if (dataset.value?.id) {
    const resp = await datasetService.listFields({ dataset: datasetId })
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
    const tableName = selectedTables.value[0]?.name || 'НеизвестнаяТаблица';
    fields.value = previewCols.value.map((col, idx) => {
      const columnValues = previewRows.value.map(row => row[idx]);
      const colType = detectColumnType(columnValues);
      const aggOptions = getAggregationOptions(colType);
      return {
        id: 'new_' + idx,
        name: col,
        source: { table: tableName, column: col },
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
    let source = f.source;
    if (!source || typeof source !== 'object') {
      let tableName = f.source_table || fallbackTable;
      const found = Array.isArray(selectedTables?.value)
        ? selectedTables.value.find(t => String(t.id) === String(tableName))
        : null;
      if (found) tableName = found.name || found.table || fallbackTable;
      source = {
        table: tableName,
        column: f.source_column || f.name || `col${idx + 1}`
      }
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

onMounted(async () => {
  if (datasetId) {
    const { data } = await datasetService.getDataset(datasetId)
    dataset.value = data
    selectedTables.value = data.tables.map(t => ({
      id: t.id,
      schema: t.connection_name,
      table: t.table_name,
      name: t.table_name,
      table_ref: t.table_ref,
    }))
    selectedRelations.value = data.tables.map(t => ({
      source: String(data.tables[0].id),
      target: String(t.id),
      joinType: t.joined_on.type
    }))
  }
})

async function onTablesChange(newTables) {
  selectedTables.value = newTables
  if (!dataset.value && newTables.length) {
    await createDatasetFrom(newTables[0])
    await doPreview()
  }
}

async function createDatasetFrom(tbl) {
  const payload = {
    name: `${tbl.name || tbl.table}_${Date.now()}`,
    connection: selectedConnection.value.id,
    file_source: tbl.id,
    is_temporary: true
  }
  const { success, data, errors } = await datasetService.createDataset(payload)
  if (success) {
    dataset.value = data
    if (data.tables && data.tables.length > 0) {
      // Найди staging-таблицу
      const mainTable = data.tables.find(t => t.table_name.startsWith('staging_')) || data.tables[0]
      selectedTables.value = [{
        id: mainTable.id,
        table_ref: mainTable.table_name,          // staging-имя (для join/preview)
        display_name: tbl.original_filename || tbl.name, // красивое имя для UI
        file_id: tbl.id,                          // связь с FileUpload (если надо)
      }]
    }
    if (data?.is_temporary) localStorage.setItem('temp_dataset_id', data.id)
    await doPreview()
    await loadFields()
  } else {
    console.error(errors)
  }
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

    const fieldsResp = await datasetService.listFields({ dataset: dataset.value.id });
    if (fieldsResp && fieldsResp.data) {
      fields.value = fieldsResp.data;
    }
  }
  await loadPreview();
}

function startSidebarResize(e) {
  isSidebarResizing = true
  sidebarStartX = e.clientX
  sidebarStartWidth = sidebarWidth.value
  window.addEventListener('mousemove', resizeSidebar)
  window.addEventListener('mouseup', stopSidebarResize)
}

function resizeSidebar(e) {
  if (!isSidebarResizing) return
  const delta = e.clientX - sidebarStartX
  sidebarWidth.value = Math.min(
    sidebarMax,
    Math.max(sidebarMin, sidebarStartWidth + delta)
  )
}

function stopSidebarResize() {
  isSidebarResizing = false
  window.removeEventListener('mousemove', resizeSidebar)
  window.removeEventListener('mouseup', stopSidebarResize)
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
  stopSidebarResize()
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

watch(
  () => selectedTables.value.slice(),
  async (newTables, oldTables) => {
    // 1) создаём датасет на основе первой таблицы
    if (!dataset.value && newTables.length > 0) {
      if (!selectedConnection.value) return;
      const tbl = newTables[0];
      const payload = {
        name: `${tbl.name || tbl.table}_${Date.now()}`,
        connection: selectedConnection.value.id,
        file_source: tbl.id,
        is_temporary: true
      };
      const { success, data, errors } = await datasetService.createDataset(payload);
      if (!success) {
        console.error('Ошибка создания датасета:', errors);
        return;
      }
      if (data?.is_temporary) {
        localStorage.setItem('temp_dataset_id', data.id);
      }
      dataset.value = data;

      // Перезаписываем selectedTables staging-таблицей!
      if (data.tables && data.tables.length > 0) {
        const mainTable = data.tables.find(t => t.table_name.startsWith('staging_')) || data.tables[0];
        selectedTables.value = [{
          id: mainTable.id,
          table_ref: mainTable.table_name,
          display_name: tbl.original_filename || tbl.name, // сохраняем реальное имя файла
          // другие поля если надо
        }];
      }

      await doPreview();
      return;
    }

    // 2) джойн новой таблицы
    if (dataset.value && newTables.length > oldTables.length) {
      const added = newTables.find(t => !oldTables.includes(t));
      const { success: joinOk, data, errors: joinErr } = await datasetService.createTable({
        dataset: dataset.value.id,
        connection: dataset.value.connection,
        table_name: added.table_ref || added.staging_name || added.name,
      });

      if (joinOk && data.tables && data.tables.length > 0) {
        // Перезаписываем selectedTables новым списком staging/temp-таблиц
        selectedTables.value = data.tables.map(t => ({
          id: t.id,
          table_ref: t.table_name,
          name: t.table_name,
        }));
      }

      if (!joinOk) console.warn('Авто-JOIN не сработал:', joinErr);
      await refreshFields();
    }
  },
  { immediate: false }
);

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

onMounted(async () => {
  const tempDatasetId = localStorage.getItem('temp_dataset_id')
  if (tempDatasetId) {
    try {
      await datasetService.deleteDataset(tempDatasetId)
    } catch (e) {
    }
    localStorage.removeItem('temp_dataset_id')
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
  stroke: #e53935;
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
  background: #2e2f35;
  color: #fff;
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
  color: #fff;
}

.layout {
  display: grid;
  grid-template-rows: 56px 50px 1fr var(--footer-height, 200px);
  border: 1px solid #4e5058;
  border-radius: 12px;
  grid-template-areas:
    "header header"
    "toolbar toolbar"
    "sidebar chat"
    "footer footer";
  height: 90vh;
  transition: grid-template-columns 0.4s ease;
}

.layout.with-sidebar {
  --sidebar-width: 260px;
}

.layout.resizing-sidebar {
  transition: none;
}

.header,
.file_area_header {
  position: relative;
  grid-area: header;
  background-color: #313338;
  display: flex;
  align-items: center;
  padding: 0 1rem;
  gap: 20px;
  height: 61px;
  border-top-left-radius: 12px;
  border-top-right-radius: 12px;
  border-bottom: 1px solid #4e5058;
}

.file_area_header_buttons {
  margin-left: auto;
  display: flex;
  gap: 10px;
}

.toolbar {
  grid-area: toolbar;
  background-color: #313338;
  display: flex;
  align-items: center;
  padding: 0 1rem;
  margin-top: 5px;
  gap: 1rem;
  border-bottom: 1px solid #4e5058;
}

.tab-group {
  display: inline-flex;
  align-items: center;
  border: 1px solid #e53935;
  border-radius: 6px;
  overflow: hidden;
  height: 2rem;
}

.tab-button {
  background: transparent;
  color: #e53935;
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
  background: #e53935;
  color: #fff;
}

.tab-button:not(.active):hover {
  background: rgba(229, 57, 53, 0.2);
}

.sidebar-wrapper {
  display: flex;
  grid-area: sidebar;
  height: 100%;
}

.sidebar {
  position: relative;
  min-width: 260px;
  background-color: #1e1f22;
  border-right: 1px solid #4e5058;
  overflow: hidden;
  cursor: default;
}

.sidebar.rounded-bottom {
  border-bottom-left-radius: 12px !important;
  border-bottom-right-radius: 0 !important;
}

.sidebar::after {
  content: "";
  position: absolute;
  top: 0;
  right: 0;
  width: 6px;
  height: 100%;
  cursor: ew-resize;
  z-index: 1;
}

.sidebar-resizer {
  position: absolute;
  top: 0;
  right: 0;
  width: 6px;
  height: 100%;
  cursor: ew-resize;
  z-index: 10;
}

.file_area {
  grid-area: chat;
  background-color: #313338;
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
  background-color: #2c2e33;
  padding: 10px;
  text-align: center;
  color: #aaa;
  font-size: 0.9rem;
  border-top: 1px solid #4e5058;
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
  background-color: #2c2e33;
  border-top: 1px solid #4e5058;
  border-bottom-left-radius: 12px;
  border-bottom-right-radius: 12px;
  overflow: hidden;
}

.button-preview {
  margin-left: auto;
  display: flex;
  gap: 10px;
}

.btn-secondary,
.btn-outline-secondary {
  width: 10rem;
  height: 2rem;
  border-radius: 6px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.btn-outline-secondary {
  color: white;
}

.btn-success {
  width: 13rem;
  height: 2rem;
  border-radius: 6px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
}

.breadcrumb {
  display: flex;
  background: transparent;
  padding: 0;
  margin: 0;
  list-style: none;
  font-size: 0.95rem;
  color: #b0b0b0;
}

.breadcrumb-item {
  display: flex;
  align-items: center;
  color: #b0b0b0;
}

.breadcrumb-item.active {
  color: var(--bs-primary);
}

.breadcrumb-item a {
  color: #e0e0e0;
  text-decoration: none;
}

.breadcrumb-item a:hover {
  color: var(--bs-primary);
}

.preview-placeholder {
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #888;
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
  background: #2a2a2a;
  width: min(1200px, 95vw);
  height: min(750px, 90vh);
  border-radius: 12px;
  padding: 1.5rem;
  position: relative;
  overflow-y: hidden;
  transform: translateX(140px);
}

.modal-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding-bottom: 1rem;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
}

.modal-header h5 {
  margin: 0;
  font-size: 1.25rem;
  color: #fff;
}

.close-btn {
  background: transparent;
  border: none;
  font-size: 1.5rem;
  line-height: 1;
  cursor: pointer;
  color: #fff;
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
</style>
