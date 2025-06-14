<template>
  <div class="scrollable-table">
    <table class="custom-table">
      <thead class="transparent-header">
        <tr><th v-for="col in props.cols" :key="col.key">{{ col.label }}</th></tr>
      </thead>
      <tbody>
        <tr v-for="row in props.users" :key="row.id" class="table-row" @mouseenter="hoveredRow = row.id" @mouseleave="hoveredRow = null" @click="handleRowClick(row)">
          <td v-for="col in props.cols" :key="col.key" :style="{ position: 'relative', overflow: 'hidden' }" :class="{ 'td-actions': col.key === 'actions' }">
            <!-- Название -->
            <template v-if="col.key === 'name'">
              <template v-if="getIconComponent(row)">
                <img :src="getIconComponent(row).src" class="icon" @mouseenter="onIconHover($event, getIconComponent(row).tooltip)" @mouseleave="hideTooltip" />
              </template>
              <template v-else><Table class="icon" /></template>
              <span class="dataset-name">{{ getValue(row, col.key) ?? '—' }}</span>
            </template>

            <!-- Дата -->
            <template v-else-if="col.key === 'created_at'">
              <span class="tooltip-wrapper" @mouseenter="onIconHover($event, formatTooltipDate(getValue(row, col.key)))" @mouseleave="hideTooltip">
                {{ new Date(getValue(row, col.key)).toLocaleDateString() }}
              </span>
            </template>

            <!-- Действия -->
            <template v-else-if="col.key === 'actions'">
              <div class="actions-cell" :class="{ visible: hoveredRow === row.id || isFavorite(row.id) }">
                <div class="actions-inner">
                  <button class="action-btn star" :class="{ active: isFavorite(row.id) }" @click.stop="toggleFavorite(row.id)" title="Избранное">
                    <Star class="icon-inline" />
                  </button>
                  <button class="action-btn more" @click="onMoreClick($event, row.id)" title="Еще">
                    <MoreHorizontal class="icon-inline" />
                  </button>
                </div>
              </div>
            </template>

            <template v-else>
              {{ typeof col.format === 'function' ? col.format(getValue(row, col.key)) : getValue(row, col.key) ?? '—' }}
            </template>
          </td>
        </tr>

        <tr v-if="props.users.length === 0">
          <td :colspan="props.cols.length" class="no-data">Нет данных</td>
        </tr>
      </tbody>
    </table>

    <!-- Обычный тултип -->
    <div v-if="showTooltip" class="tooltip-fixed" :style="tooltipStyle">{{ tooltipText }}</div>

    <!-- Меню "Еще" -->
    <div v-if="showMenu" class="menu-dropdown" :style="menuPosition" @mouseleave="closeMenu">
      <div class="menu-item" @click="openRename(getRowById(menuRowId))"><CaseSensitive :size="18" :stroke-width="2" />Переименовать</div>
      <hr><div class="menu-item" @click="copyLink(getRowById(menuRowId))"><Link :size="18" :stroke-width="2" />Копировать ссылку</div>
      <hr><div class="menu-item danger" @click="askDelete(getRowById(menuRowId))"><Trash2 :size="18" :stroke-width="2" />Удалить</div>
    </div>

  </div>
  <!-- Модальное окно удаления -->
<transition name="fade-modal">
  <div v-if="showDeleteDialog" class="modal-overlay" @click.self="cancelDelete">
    <div class="modal-dialog">
      <div class="modal-title">Вы действительно хотите удалить
        <span class="item-name">"{{ rowToDelete?.name || rowToDelete?.original_filename || 'элемент' }}"</span>
        <span style="font-weight: normal">({{ getTypeName(rowToDelete) }})</span>?
      </div>
      <div class="modal-actions">
        <button class="btn btn-danger" @click="confirmDelete" :disabled="isDeleteLocked">{{ isDeleteLocked ? `Да (${deleteCountdown})` : 'Да' }}</button>
        <button class="btn btn-outline-secondary" @click="cancelDelete">Нет</button>
      </div>
    </div>
  </div>
</transition>

<!-- Модальное окно переименования -->
<transition name="fade-modal">
  <div v-if="showRenameDialog" class="modal-overlay" @click.self="cancelRename">
    <div class="modal-dialog">
      <div class="modal-title">Укажите новое название элементу</div>
      <input id="rename-input" class="form-control" v-model="renameValue" :disabled="renameLoading" maxlength="128" @keyup.enter="doRename" style="margin-bottom: 1rem; width: 100%; font-size: 1.05rem;" autocomplete="off"/>
      <div v-if="renameError" style="color: #f87171; margin-bottom: 1rem;">{{ renameError }}</div>
      <div class="modal-actions">
        <button class="btn btn-primary" @click="doRename" :disabled="renameLoading || !renameValue.trim()">Сохранить</button>
        <button class="btn btn-secondary" @click="cancelRename" :disabled="renameLoading">Отмена</button>
      </div>
    </div>
  </div>
</transition>

<!-- Модальное окно копирования ссылки в буфер обмена -->
<transition name="fade-modal">
  <div v-if="showCopySuccess" class="copy-success-toast" :style="{ opacity: copyOpacity }">
    Ссылка успешно скопирована в буфер обмена
  </div>
</transition>
</template>

<script setup>
import { ref, watch, onMounted } from 'vue'
import { Table, Star, MoreHorizontal, Trash2, CaseSensitive, Link } from 'lucide-vue-next'
import { useRouter } from 'vue-router'
import { apiClient } from '@/js/api/manager.js'
import ClickHouseIcon from '@/assets/bi/icons/clickhouse.svg'
import PostgresIcon from '@/assets/bi/icons/postgres.svg'
import MssqlIcon from '@/assets/bi/icons/mssql.svg'
import FileIcon from '@/assets/bi/icons/folder_windows_style.svg'

const props = defineProps({
  cols: Array,
  users: Array,
  isDatasetSidebarOpen: Boolean,
  currentPage: String
})

const hoveredRow = ref(null)
const favorites = ref(new Set())

const showDeleteDialog = ref(false)
const rowToDelete = ref(null)

const isDeleteLocked = ref(false)
const deleteCountdown = ref(3)
let countdownTimer = null

const showRenameDialog = ref(false)
const rowToRename = ref(null)
const renameValue = ref('')
const renameLoading = ref(false)
const renameError = ref('')

const showCopySuccess = ref(false)
const copyOpacity = ref(1)
let fadeTimeout = null
let fadeRaf = null

const router = useRouter()

function handleRowClick(row) {
  // Если отображаем датасеты (currentPage === 'datasets'), переходи на страницу датасета
  if (props.currentPage === 'datasets') {
    goToDataset(row)
  } else if (props.currentPage === 'connections') {
    goToConnection(row)
  }
}

function goToConnection(row) {
  if (!row || !row.id) return

  const type = (row.connector_type_display || row.connector_type || '').toLowerCase().trim()
  const isFileConnection = type === 'file' || type === 'files' || type.includes('файл')

  if (isFileConnection) {
    router.push(`/bi/connections/${row.id}/files/`)
  } else {
    router.push(`/bi/connections/${row.id}/`)
  }
}

function goToDataset(row) {
  if (!row || !row.id) return
  router.push(`/bi/dataset/${row.id}/`)
}

// localStorage избранное
function loadFavorites() {
  const raw = localStorage.getItem('favoriteDatasets')
  if (raw) {
    try {
      favorites.value = new Set(JSON.parse(raw))
    } catch {
      favorites.value = new Set()
    }
  }
}

function saveFavorites() {
  localStorage.setItem('favoriteDatasets', JSON.stringify([...favorites.value]))
}

function toggleFavorite(id) {
  if (favorites.value.has(id)) favorites.value.delete(id)
  else favorites.value.add(id)
}

function isFavorite(id) {
  return favorites.value.has(id)
}

onMounted(loadFavorites)
watch(favorites, saveFavorites, { deep: true })

function getValue(row, key) {
  return key.split('.').reduce((acc, part) => acc?.[part], row)
}

// Tooltip
const tooltipText = ref('')
const tooltipStyle = ref({ top: '0px', left: '0px' })
const showTooltip = ref(false)

const emit = defineEmits(['delete-row'])

function onIconHover(event, text) {
  tooltipText.value = text
  showTooltip.value = true
  const rect = event.target.getBoundingClientRect()
  tooltipStyle.value = {
    top: `${rect.top + window.scrollY - 32}px`,
    left: `${rect.left + rect.width / 2 + window.scrollX}px`
  }
}

function hideTooltip() {
  showTooltip.value = false
}

function getIconComponent(row) {
  const type = (row.connector_type_display || row.connector_type || '').toLowerCase().trim()

  if (type.includes('clickhouse')) return { src: ClickHouseIcon, tooltip: 'ClickHouse' }
  if (type.includes('postgres')) return { src: PostgresIcon, tooltip: 'PostgreSQL' }
  if (type.includes('sql server') || type.includes('mssql')) return { src: MssqlIcon, tooltip: 'Microsoft SQL Server' }
  if (type.includes('file') || type.includes('files') || type.includes('файл')) return { src: FileIcon, tooltip: 'Загруженные файлы' }

  return null
}

function formatTooltipDate(dateStr) {
  const months = ['января', 'февраля', 'марта', 'апреля', 'мая', 'июня', 'июля', 'августа', 'сентября', 'октября', 'ноября', 'декабря']
  const date = new Date(dateStr)
  return `${date.getDate()} ${months[date.getMonth()]} ${date.getFullYear()}, ${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}`
}

const showMenu = ref(false)
const menuPosition = ref({ top: '0px', left: '0px' })
const menuRowId = ref(null)

function onMoreClick(event, rowId) {
  event.stopPropagation()
  const rect = event.currentTarget.getBoundingClientRect()
  showMenu.value = true
  menuRowId.value = rowId
  menuPosition.value = {
    top: `${rect.bottom + window.scrollY + 6}px`,
    left: `${rect.left + window.scrollX}px`
  }
}

function closeMenu() {
  showMenu.value = false
}

function getTypeName(row) {
  if (!row) return ''
  if (props.currentPage === 'datasets') return 'датасет'
  if (props.currentPage === 'connections') return 'подключение'
  if (props.currentPage === 'charts') return 'чарт'
}

function getDeleteEndpoint(row) {
  if (row.type === 'connection') return `/bi_analysis/bi_connections/${row.id}/`
  if (row.type === 'chart') return `/bi_analysis/bi_charts/${row.id}/`
  return `/bi_analysis/bi_datasets/${row.id}/`
}

async function confirmDelete() {
  if (isDeleteLocked.value || !rowToDelete.value) return
  const endpoint = getDeleteEndpoint(rowToDelete.value)
  try {
    const res = await apiClient.delete(endpoint)
    if (res.success) {
      emit('delete-row', rowToDelete.value)
      closeMenu()
    } else {
      alert('Ошибка при удалении: ' + (res.message || ''))
    }
  } catch (err) {
    alert('Ошибка при удалении: ' + err)
  } finally {
    cancelDelete()
  }
}

function askDelete(row) {
  rowToDelete.value = row
  showDeleteDialog.value = true
  isDeleteLocked.value = true
  deleteCountdown.value = 3
  if (countdownTimer) clearInterval(countdownTimer)
  countdownTimer = setInterval(() => {
    if (deleteCountdown.value > 1) {
      deleteCountdown.value -= 1
    } else {
      isDeleteLocked.value = false
      clearInterval(countdownTimer)
    }
  }, 1000)
}

function cancelDelete() {
  showDeleteDialog.value = false
  rowToDelete.value = null
  isDeleteLocked.value = false
  if (countdownTimer) clearInterval(countdownTimer)
}

function getRowById(id) {
  return props.users.find(u => u.id === id)
}

function cancelRename() {
  showRenameDialog.value = false
  rowToRename.value = null
  renameValue.value = ''
  renameLoading.value = false
  renameError.value = ''
}

async function doRename() {
  if (!renameValue.value.trim()) {
    renameError.value = 'Имя не может быть пустым'
    return
  }
  renameLoading.value = true
  renameError.value = ''
  const row = rowToRename.value
  let endpoint = ''
  let payload = {}

  if (row.type === 'connection') {
    endpoint = `/bi_analysis/bi_connections/${row.id}/`
    payload = { name: renameValue.value }
  } else if (row.type === 'chart') {
    endpoint = `/bi_analysis/bi_charts/${row.id}/`
    payload = { name: renameValue.value }
  } else {
    endpoint = `/bi_analysis/bi_datasets/${row.id}/`
    payload = { name: renameValue.value }
  }

  try {
    const res = await apiClient.patch(endpoint, payload)
    if (res.success !== false) {
      const rowInList = props.users.find(u => u.id === row.id)
      if (rowInList) rowInList.name = renameValue.value
      cancelRename()
    } else {
      renameError.value = 'Ошибка: ' + (res.message || 'Не удалось переименовать')
    }
  } catch (e) {
    renameError.value = 'Ошибка: ' + e
  } finally {
    renameLoading.value = false
  }
}

function openRename(row) {
  rowToRename.value = row
  renameValue.value = row.name || row.original_filename || ''
  renameError.value = ''
  showRenameDialog.value = true
  closeMenu()
  setTimeout(() => {
    document.getElementById('rename-input')?.focus()
  }, 100)
}

function getCopyLink(row) {
  if (props.currentPage === 'connections') return `${window.location.origin}/bi/connections/${row.id}/`
  if (props.currentPage === 'datasets') return `${window.location.origin}/bi/datasets/${row.id}/`
  if (props.currentPage === 'charts') return `${window.location.origin}/bi/charts/${row.id}/`
  return window.location.href
}

async function copyLink(row) {
  try {
    await navigator.clipboard.writeText(getCopyLink(row))
    showCopySuccess.value = true
    copyOpacity.value = 1

    if (fadeTimeout) clearTimeout(fadeTimeout)
    if (fadeRaf) cancelAnimationFrame(fadeRaf)

    const start = performance.now()
    function fade(ts) {
      const elapsed = Math.min((ts - start) / 3000, 1)
      copyOpacity.value = 1 - elapsed
      if (elapsed < 1) {
        fadeRaf = requestAnimationFrame(fade)
      } else {
        showCopySuccess.value = false
        copyOpacity.value = 1
      }
    }
    fadeRaf = requestAnimationFrame(fade)
  } catch (err) {
    alert('Не удалось скопировать ссылку')
  }
  closeMenu()
}
</script>

<style scoped lang="scss">
.scrollable-table {
  overflow-x: auto;
  overflow-y: auto;
  max-height: calc(100vh - 115px - 2rem);
  font-size: 14px;
  color: var(--color-primary-text);
}

.custom-table {
  width: 100%;
  border-collapse: collapse;
  border-radius: 12px;
}

.transparent-header th {
  background-color: transparent;
  color: var(--color-secondary-text);
  font-weight: bold;
}

.custom-table th,
.custom-table td {
  padding: 12px 16px;
  text-align: left;
  white-space: nowrap;
}

.table-row:hover {
  background-color: var(--color-hover-background);
  cursor: pointer;
}

.td-actions {
  width: 96px;
  max-width: 96px;
  min-width: 96px;
  padding: 0 4px;
}

.icon {
  width: 24px;
  height: 24px;
  margin-right: 5px;
  vertical-align: middle;
  color: var(--color-accent);
}

.tooltip-wrapper {
  display: inline-block;
  margin-right: 8px;
  vertical-align: middle;
}

.tooltip-fixed {
  position: fixed;
  transform: translateX(-50%);
  background-color: var(--color-primary-background);
  color: var(--color-primary-text);
  padding: 6px 10px;
  border-radius: 6px;
  font-size: 12px;
  white-space: nowrap;
  z-index: 9999;
  pointer-events: none;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.4);
}

.dataset-name {
  vertical-align: middle;
}

.no-data {
  text-align: center;
  padding: 24px;
  color: #777;
}

.actions-cell {
  display: flex;
  justify-content: flex-end;
  align-items: center;
  opacity: 0;
  pointer-events: none;
  transition: opacity 0.2s ease, transform 0.2s ease;
  transform: translateY(-4px);
}

.actions-cell.visible {
  opacity: 1;
  pointer-events: auto;
  transform: translateY(0);
}

.actions-inner {
  display: flex;
  gap: 8px;
  align-items: center;
}

.action-btn {
  background: transparent;
  border: none;
  cursor: pointer;
  padding: 4px;
  border-radius: 6px;
  color: #bbb;
  transition: background 0.2s ease, color 0.2s ease;
}

.action-btn:hover {
  background-color: var(--color-background);
  color: var(--color-primary-text);
}

.action-btn.star.active {
  color: #facc15;
}

.icon-inline {
  width: 18px;
  height: 18px;
}

.menu-dropdown {
  position: fixed;
  background-color: var(--color-primary-background);
  border-radius: 8px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.6);
  padding: 8px 0;
  min-width: 120px;
  z-index: 10000;
}

.menu-item {
  display: flex;
  align-items: center;
  gap: 5px;
  padding: 8px 16px;
  color: var(--color-primary-text);
  cursor: pointer;
  transition: background 0.2s;
}

.menu-dropdown hr {
  margin: 4px 0;
}

.menu-item:hover {
  background-color: var(--color-hover-background);
}

.menu-item.danger {
  color: #f87171;
}

.fade-modal-enter-active,
.fade-modal-leave-active {
  transition: opacity 0.25s;
}

.fade-modal-enter-from,
.fade-modal-leave-to {
  opacity: 0;
}

.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  z-index: 10050;
  background: rgba(0, 0, 0, 0.48);
  display: flex;
  align-items: center;
  justify-content: center;
}

.modal-dialog {
  background: #212127;
  color: #fff;
  padding: 2rem 2.5rem;
  border-radius: 16px;
  box-shadow: 0 8px 40px 0 rgba(0, 0, 0, 0.32);
  min-width: 340px;
  max-width: 90vw;
  display: flex;
  flex-direction: column;
  align-items: center;
  pointer-events: all;
}

.modal-title {
  margin-bottom: 1.6rem;
  font-size: 1.15rem;
  text-align: center;
  font-weight: 500;
}

.item-name {
  font-weight: bold;
  color: #f87171;
  margin: 0 0.3em;
  word-break: break-all;
}

.modal-actions {
  display: flex;
  gap: 1.5rem;
}

.btn {
  min-width: 78px;
  padding: 0.5em 1.4em;
  border: none;
  border-radius: 6px;
  font-size: 1rem;
  transition: 
    background 0.2s, 
    color 0.2s, 
    box-shadow 0.15s;
}

.copy-success-toast {
  position: fixed;
  bottom: 44px;
  left: 50%;
  transform: translateX(-50%);
  background: var(--color-primary-background);
  color: var(--color-primary-text);
  font-size: 1rem;
  padding: 1.1rem 2rem;
  border-radius: 12px;
  z-index: 20000;
  box-shadow: 0 2px 12px #0007;
  pointer-events: none;
  opacity: 1;
  transition: opacity 0.2s linear;
}
</style>
