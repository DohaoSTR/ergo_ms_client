<template>
    <div class="sources-main">
        <div class="main-connections">
            <div style="font-weight: bold; padding-left: 15px; padding-top: 15px;">Подключения</div>
            <button v-if="!selectedConnection" type="button" class="btn btn-outline-light" @click="showTooltip = !showTooltip" ref="buttonRef">
                <Plus :size="20" :stroke-width="2" />Добавить
            </button>
            <div class="connections-list">
                <div v-if="selectedConnection" class="connection-item" @mouseenter="hovered = true" @mouseleave="hovered = false">
                    <div class="connection-left">
                        <img :src="getIconComponent(selectedConnection)?.src" class="icon" />
                        <span class="connection-name">{{ selectedConnection.name }}</span>
                    </div>
                    <div class="connection-actions">
                        <button class="action-btn" :class="{ visible: hovered }" @click="openActionMenu(selectedConnection, $event)">
                            <MoreHorizontal :size="18" />
                        </button>
                    </div>
                </div>
            </div>
        </div>
        <hr>
        <div class="tables-list">
            <div v-if="!selectedConnection" class="tables-list-empty">Добавьте подключение, чтобы отобразить список таблиц</div>
            <div v-else>
                <ConnectionTables :connection-id="selectedConnection.id" :connection-type="selectedConnection.connector_type" :selected-tables="selectedTables"/>
            </div>
        </div>
    </div>
    <div v-if="showTooltip" class="tooltip-panel" ref="tooltipRef">
        <ConnectionsTooltip @select="handleSelect" />
    </div>
    <div v-if="actionMenu.visible" class="menu-dropdown" :style="{ top: actionMenu.y + 'px', left: actionMenu.x + 'px' }" @mouseleave="actionMenu.visible = false">
        <div class="menu-item" @click="handleOpen">Открыть подключение</div>
        <div class="menu-item" @click="handleReplace">Заменить подключение</div>
        <div class="menu-item danger" @click="handleDelete">Удалить подключение</div>
    </div>
</template>

<script setup>
import { ref, onMounted, onBeforeUnmount } from 'vue'
import { Plus } from 'lucide-vue-next'
import { MoreHorizontal } from 'lucide-vue-next'
import ClickHouseIcon from '@/assets/bi/icons/clickhouse.svg'
import PostgresIcon from '@/assets/bi/icons/postgres.svg'
import MssqlIcon from '@/assets/bi/icons/mssql.svg'
import FileIcon from '@/assets/bi/icons/folder_windows_style.svg'
import ConnectionsTooltip from '@/modules/bi/components/DatasetPreview/ConnectionsTooltip.vue'
import ConnectionTables from '@/modules/bi/components/DatasetPreview/ConnectionTables.vue'

const showTooltip = ref(false)
const tooltipRef = ref(null)
const buttonRef = ref(null)

const hovered = ref(false)

const props = defineProps({
  selectedConnection: Object,
  selectedTables: Array
})

const emit = defineEmits([
  'update:selectedConnection',
  'table-drop',
  'update:selectedTables'
])

function handleClickOutside(event) {
  const clickedOutsideTooltip = tooltipRef.value && !tooltipRef.value.contains(event.target)
  const clickedOutsideButton = buttonRef.value && !buttonRef.value.contains(event.target)
  const clickedOutsideMenu = !event.target.closest('.menu-dropdown')

  if (clickedOutsideTooltip && clickedOutsideButton) {
    showTooltip.value = false
  }

  if (actionMenu.value.visible && clickedOutsideMenu) {
    actionMenu.value.visible = false
  }
}

function handleSelect(connection) {
  emit('update:selectedConnection', connection)
  showTooltip.value = false
}

function getIconComponent(row) {
    const type = (row.connector_type_display || row.connector_type || '').toLowerCase().trim()
    if (type.includes('clickhouse')) return { src: ClickHouseIcon }
    if (type.includes('postgres')) return { src: PostgresIcon }
    if (type.includes('sql server') || type.includes('mssql')) return { src: MssqlIcon }
    if (type.includes('file') || type.includes('файл')) return { src: FileIcon }
    return null
}

const actionMenu = ref({
  visible: false,
  x: 0,
  y: 0,
  connection: null
})

function openActionMenu(connection, event) {
  const rect = event.currentTarget.getBoundingClientRect()
  actionMenu.value = {
    visible: true,
    x: rect.left,
    y: rect.bottom + 6,
    connection
  }
}

function handleOpen() {
  console.log('Открыть', actionMenu.value.connection)
  actionMenu.value.visible = false
}

function handleReplace() {
  console.log('Заменить', actionMenu.value.connection)
  actionMenu.value.visible = false
}

function handleDelete() {
  console.log('Удалить', actionMenu.value.connection)
  actionMenu.value.visible = false
}

onMounted(() => {
    document.addEventListener('mousedown', handleClickOutside)
})

onBeforeUnmount(() => {
    document.removeEventListener('mousedown', handleClickOutside)
})
</script>

<style scoped lang="scss">
.sources-main {
    display: flex;
    flex-direction: column;
    height: 100%;
    position: relative;
}

.main-connections {
    min-height: 200px;
    display: flex;
    flex-direction: column;
}

.main-tables {
    display: flex;
    flex-direction: column;
    flex: 1;
}

.btn {
    width: 120px;
    height: 30px;
    display: flex;
    justify-content: center;
    align-items: center;
    gap: 3px;
    border: 0;
}

.tables-list {
    flex: 1;
    display: flex;
    flex-direction: column;
    width: 100%;
}

.tables-list-empty {
    flex: 1;
    display: flex;
    justify-content: center;
    flex-direction: column;
    align-items: center;
    text-align: center;
}

.tooltip-panel {
    position: fixed;
    top: 300px;
    left: 385px;
    width: 416px;
    height: 436px;
    background-color: #2b2b2b;
    border-radius: 8px;
    box-shadow: 0 0 15px rgba(0, 0, 0, 0.6);
    z-index: 100;
    padding: 1rem;
    color: white;
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
        background-color: #3a3a3a;
    }
}

.connection-left {
    display: flex;
    align-items: center;
    gap: 8px;
}

.icon {
    width: 18px;
    height: 18px;
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
    color: #bbb;
    cursor: pointer;
    padding: 4px;
    border-radius: 6px;

    &:hover {
        background-color: #444;
        color: #fff;
    }
}

.menu-dropdown {
  position: fixed;
  background-color: #2a2a2a;
  border-radius: 8px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.6);
  padding: 8px 0;
  min-width: 160px;
  z-index: 10000;
  pointer-events: auto;
}

.menu-item {
  padding: 8px 16px;
  color: #eee;
  cursor: pointer;
  transition: background 0.2s;
}

.menu-item:hover {
  background-color: #444;
}

.menu-item.danger {
  color: #f87171;
}
</style>