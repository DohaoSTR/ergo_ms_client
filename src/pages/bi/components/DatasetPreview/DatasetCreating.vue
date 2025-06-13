<template>
    <div class="dataset-creating-main">
        <div class="dataset-connections">
            <div class="main-connections">
                <div>Подключение:</div>
                <button v-if="!selectedConnection" type="button" class="btn btn-primary button-card-connection" @click="openTooltip" ref="buttonRef">
                    <Cable :size="24" />Выбрать подключение
                </button>
                <div v-else class="selected-connection" @click="openTooltip" ref="buttonRef">
                    <img v-if="getIconComponent(selectedConnection)" :src="getIconComponent(selectedConnection).src" class="icon" />
                    <span>{{ selectedConnection.name }}</span>
                </div>
            </div>
        </div>

        <transition name="fade-slide" appear>
            <div class="connection-tables" v-if="selectedConnection">
                <div class="main-connections">
                    <div>Главная таблица:</div>
                    <button v-if="!mainTable" type="button" class="btn btn-primary button-card-connection" @click="openTableTooltip" ref="buttonRef">
                        <Grid2x2Plus :size="24" />Выбрать главную таблицу
                    </button>
                    <div v-else class="selected-connection" @click="openTableTooltip">
                        <Table :size="24" class="icon" />
                        <span>{{ mainTable.name || (mainTable.schema + '.' + mainTable.table) }}</span>
                    </div>
                </div>
            </div>
        </transition>

        <transition name="fade-slide" appear>
            <div class="table-links" v-if="mainTable">
                <div class="main-connections">
                    <div>Связи:</div>
                    <div style="display: flex; flex-direction: column; gap: 10px;">
                        <div class="relation-list" v-if="relations && relations.length">
                            <div v-for="(rel, idx) in relations" :key="idx" class="selected-connection relation-item" @click="onEditRelation(rel, idx)">
                                <div style="display: flex; gap: 10px; align-items: center; justify-content: center;">
                                    <component :is="getJoinIcon(rel.joinType)" class="join-icon icon" style="width: 28px; height: 28px;" />
                                    <span class="linked-table-name">{{ rel.rightTableName || getTableNameById(rel.rightTableId) }}</span>
                                </div>
                                <button type="button" class="btn btn-link btn-sm relation-remove-btn" @click.stop="emit('removeRelation', idx)" title="Удалить связь" style="margin-left: 16px; padding: 2px 8px; font-size: 18px; display: flex; align-items: center; justify-content: center;">
                                    <X :size="22"/>
                                </button>
                            </div>
                        </div>
                        <button type="button" v-if="availableTablesForRelation.length" class="btn btn-primary button-card-connection" ref="buttonRef" @click="emit('openTableLinkModal')">
                            <Plus :size="24" />Добавить связь
                        </button>
                    </div>
                </div>
            </div>
        </transition>

        <div v-if="showTooltip || showTableTooltip" class="tooltip-panel" :style="{ left: tooltipPosition.x + 'px', top: tooltipPosition.y + 'px' }" ref="tooltipRef">
            <ConnectionsTooltip v-if="showTooltip" @select="handleSelect" />
            <TableTooltip v-if="showTableTooltip" :connection-id="selectedConnection.id" :connection-type="selectedConnection.connector_type" :selected-table="mainTable" @select="handleTableSelect" @tablesLoaded="(tables) => $emit('tablesLoaded', tables)"/>
        </div>

    </div>
</template>

<script setup>
import { ref, onMounted, onBeforeUnmount, computed } from 'vue'
import { Cable, Grid2x2Plus, Plus, Table, X } from 'lucide-vue-next'
import ClickHouseIcon from '@/assets/bi/icons/clickhouse.svg'
import PostgresIcon from '@/assets/bi/icons/postgres.svg'
import MssqlIcon from '@/assets/bi/icons/mssql.svg'
import FileIcon from '@/assets/bi/icons/folder_windows_style.svg'
import ConnectionsTooltip from '@/pages/bi/components/DatasetPreview/ConnectionsTooltip.vue'
import TableTooltip from '@/pages/bi/components/DatasetPreview/TablesTooltip.vue'

import JoinInnerIcon from '@/pages/bi/components/icons/JoinInnerIcon.vue'
import JoinLeftIcon from '@/pages/bi/components/icons/JoinLeftIcon.vue'
import JoinRightIcon from '@/pages/bi/components/icons/JoinRightIcon.vue'
import JoinFullIcon from '@/pages/bi/components/icons/JoinFullIcon.vue'

const showTooltip = ref(false)
const showTableTooltip = ref(false)
const tableLinksVisible = ref(false)

const tooltipPosition = ref({ x: 0, y: 0 })
const tableTooltipPosition = ref({ x: 0, y: 0 })

const tooltipRef = ref(null)
const buttonRef = ref(null)

const editingRelation = ref(null)

const props = defineProps({
  selectedConnection: Object,
  mainTable: Object,
  allTables: {
    type: Array,
    default: () => []
  },
  relations: { type: Array, default: () => [] }
})
const emit = defineEmits(['update:selectedConnection', 'update:mainTable', 'openTableLinkModal', 'tablesLoaded', 'editRelation'])

/* 1.  temp-id всех уже подключённых таблиц (строками)  */
const usedTableIds = computed(() => {
  const set = new Set(props.relations.map(r => Number(r.rightTableId)))
  if (props.mainTable) set.add(Number(props.mainTable.id))   // сама главная
  return set                           // { 128, 130, 1369 … }
})

/* 2.  id исходного файла главной таблицы                */
const mainFileId = props.mainTable?.file_id ?? null

const availableTablesForRelation = computed(() => {
  if (!props.mainTable) return []

  return props.allTables.filter(t => {
    const idNum = Number(t.id)
    /* а) сама главная или её клон */
    if (t.isMain || idNum === props.mainTable.id) return false

    /* б) отрицательный «сырой» двойник главной */
    if (mainFileId !== null && idNum === -mainFileId) return false

    /* в) таблица того же файла, что уже использован */
    if (mainFileId !== null && t.file_id === mainFileId) return false

    /* г) FileUpload – «отрицательный дубликат» существующей temp-таблицы */
    if (idNum < 0 && usedTableIds.value.has(Math.abs(idNum))) return false

    /* д) temp-таблица уже в связях */
    return !usedTableIds.value.has(idNum)
  })
})

function openTooltip(event) {
    tooltipPosition.value = { x: event.clientX, y: event.clientY + 8 }
    showTooltip.value = true
}

function openTableTooltip(event) {
    showTableTooltip.value = true
    tableTooltipPosition.value = { x: event.clientX, y: event.clientY }
}

function closeTooltip() {
    showTooltip.value = false
    showTableTooltip.value = false
}
function handleSelect(connection) {
    emit('update:selectedConnection', connection)
    showTooltip.value = false
}
async function handleTableSelect(table) {
  emit('update:mainTable', table)
  showTableTooltip.value = false
}

function findDataSetTableByFileUploadId(fileUploadId) {
  return props.allTables.find(t => t.file_upload?.id === Number(fileUploadId))
}

function getTableNameById(tableId) {
  const arr = Array.isArray(props.allTables) ? props.allTables : (props.allTables?.value ?? []);
  const found = arr.find(t => String(t.id) === String(tableId));
  return (
    found?.display_name ||
    found?.table_name ||
    found?.original_filename ||
    found?.name ||
    found?.alias ||
    found?.sheet_name ||
    found?.id ||
    'Неизвестно'
  );
}

function getIconComponent(connection) {
    if (!connection) return null
    const type = (connection.connector_type_display || connection.connector_type || '').toLowerCase().trim()
    if (type.includes('clickhouse')) return { src: ClickHouseIcon }
    if (type.includes('postgres')) return { src: PostgresIcon }
    if (type.includes('sql server') || type.includes('mssql')) return { src: MssqlIcon }
    if (type.includes('file') || type.includes('файл')) return { src: FileIcon }
    return null
}

function getJoinIcon(type) {
  switch ((type || '').toLowerCase()) {
    case 'left':  return JoinLeftIcon;
    case 'right': return JoinRightIcon;
    case 'full':  return JoinFullIcon;
    case 'inner': return JoinInnerIcon;
    default:      return JoinInnerIcon;
  }
}

function onClickOutside(event) {
    const tooltipEl = tooltipRef.value
    const buttonEl = buttonRef.value
    if (
        tooltipEl && !tooltipEl.contains(event.target) &&
        buttonEl && !buttonEl.contains(event.target)
    ) {
        closeTooltip()
    }
}

function onEditRelation(rel, idx) {
  emit('editRelation', rel, idx)
  console.log('free tables:', availableTablesForRelation.value)
}

onMounted(() => {
    document.addEventListener('mousedown', onClickOutside)
})
onBeforeUnmount(() => {
    document.removeEventListener('mousedown', onClickOutside)
})
</script>

<style scoped lang="scss">
.dataset-creating-main {
    display: flex;
    width: 100%;
    height: 100%;
    align-items: center;
    justify-content: center;
    flex-direction: column;
}

.main-connections {
    min-height: 100px;
    display: flex;
    align-items: center;
    flex-direction: row;
    gap: 10px;
}

.tooltip-panel {
    position: fixed;
    top: 300px;
    left: 385px;
    width: 416px;
    height: 436px;
    background-color: var(--color-primary-background);
    border-radius: 8px;
    box-shadow: 0 0 15px rgba(0, 0, 0, 0.6);
    z-index: 100;
    padding: 1rem;
    color: var(--color-primary-text);
}

.connections-list {
    padding: 0 10px;
}

.connection-item {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 8px 10px;
    border-radius: 6px;
    margin-top: 8px;
    transition: background 0.2s;

    &:hover {
        background-color: var(--color-hover-background);
    }
}

.connection-left {
    display: flex;
    align-items: center;
    gap: 8px;
}

.icon {
    width: 22px;
    height: 22px;
    color: var(--color-accent);
}

.connection-actions {
    width: 32px;
    height: 100%;
    display: flex;
    justify-content: flex-end;
    align-items: center;
    transition: opacity 0.2s ease;
}

.connection-actions .action-btn {
    opacity: 0;
    visibility: hidden;
    transition: opacity 0.2s ease, visibility 0.2s ease;
}

.connection-item:hover .connection-actions .action-btn {
    opacity: 1;
    visibility: visible;
}

.action-btn {
    background: transparent;
    border: none;
    color: var(--color-secondary-text);
    cursor: pointer;
    padding: 4px;
    border-radius: 6px;

    &:hover {
        backdrop-filter: brightness(150%);
    }
}

.menu-dropdown {
    position: fixed;
    background-color: var(--color-primary-background);
    border-radius: 8px;
    box-shadow: 0 2px 10px rgba(0, 0, 0, 0.6);
    padding: 8px 0;
    min-width: 160px;
    z-index: 10000;
    pointer-events: auto;
}

.menu-item {
    padding: 8px 16px;
    color: var(--color-primary-text);
    cursor: pointer;
    transition: background 0.2s;
}

.menu-item:hover {
    background-color: var(--color-hover-background);
}

.menu-item.danger {
    color: var(--color-accent);
}

.button-card-connection {
    height: 46px;
    display: flex;
    align-items: center;
    gap: 10px;
}

.selected-connection {
    display: flex;
    align-items: center;
    gap: 10px;
    background: var(--color-primary-background);
    border: 1.5px solid #198754;
    border-radius: 10px;
    min-height: 46px;
    width: 280px;
    padding: 0 18px;
    cursor: pointer;
    transition: border 0.15s;

    &:hover {
        background: var(--color-hover-background);
    }

    .connection-name {
        font-weight: 600;
        font-size: 16px;
        color: var(--color-primary-text);
    }
}

.fade-slide-enter-active,
.fade-slide-leave-active {
    transition: opacity 0.32s cubic-bezier(.5, 1.8, .5, 1), transform 0.62s cubic-bezier(.5, 1.8, .5, 1);
}

.fade-slide-enter-from,
.fade-slide-leave-to {
    opacity: 0;
    transform: translateY(32px);
}

.fade-slide-enter-to,
.fade-slide-leave-from {
    opacity: 1;
    transform: translateY(0);
}

.join-icon {
  vertical-align: middle;
}
.relation-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.relation-list{
    display: flex;
    flex-direction: column;
    gap: 10px;
}

.relation-remove-btn {
  background: transparent;
  border: none;
  cursor: pointer;
  color: var(--color-secondary-text);
  transition: color .18s;
  &:hover {
    color: var(--color-accent);
  }
}
</style>
