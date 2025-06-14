<template>
    <div class="list-main">
        <input class="form-control mb-2" type="text" placeholder="Фильтр по имени" v-model="filter" />
        <ul class="connection-list">
            <li v-if="isLoading" v-for="n in 3" :key="'skeleton-' + n" class="connection-item loading-placeholder">
                <div class="connection-left">
                    <div class="skeleton-icon"></div>
                    <div class="skeleton-text"></div>
                </div>
                <div class="skeleton-date"></div>
            </li>
            <li v-for="item in filteredUsers" :key="item.id" class="connection-item" :class="{ selected: isSelected(item) }" v-show="!isLoading" @click="emit('select', item)">
                <div class="connection-left">
                    <img :src="getIconComponent(item)?.src" class="icon" @mouseenter="onIconHover($event, getIconComponent(item)?.tooltip)" @mouseleave="hideTooltip"/>
                    <span class="connection-name">{{ item.name }}</span>
                </div>
                <div class="connection-date">
                    {{ new Date(item.created_at).toLocaleDateString() }}
                </div>
            </li>
            <li v-if="!isLoading && filteredUsers.length === 0" class="no-data">Нет данных</li>
        </ul>
    </div>
    <div v-if="showTooltip" class="tooltip-fixed" :style="tooltipStyle">
        {{ tooltipText }}
    </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import ClickHouseIcon from '@/assets/bi/icons/clickhouse.svg'
import PostgresIcon from '@/assets/bi/icons/postgres.svg'
import MssqlIcon from '@/assets/bi/icons/mssql.svg'
import FileIcon from '@/assets/bi/icons/folder_windows_style.svg'
import { apiClient } from '@/js/api/manager.js'

const emit = defineEmits(['select'])

const props = defineProps({
  selectedConnection: Object
})

function isSelected (row) {
    return props.selectedConnection && String(row.id) === String(props.selectedConnection.id)
}

const users = ref([])
const filter = ref('')
const isLoading = ref(true)

const tooltipText = ref('')
const tooltipStyle = ref({ top: '0px', left: '0px' })
const showTooltip = ref(false)

onMounted(async () => {
    isLoading.value = true
    const res = await apiClient.get('bi_analysis/bi_connections/')
    if (res.success) {
        users.value = res.data
    } else {
        console.error('Ошибка при получении подключений:', res.errors)
    }
    isLoading.value = false
})

const filteredUsers = computed(() =>
    users.value.filter((u) =>
        u.name?.toLowerCase().includes(filter.value.toLowerCase())
    )
)

function getIconComponent(row) {
  const type = (row.connector_type_display || row.connector_type || '').toLowerCase().trim()
  if (type.includes('clickhouse')) return { src: ClickHouseIcon, tooltip: 'ClickHouse' }
  if (type.includes('postgres')) return { src: PostgresIcon, tooltip: 'PostgreSQL' }
  if (type.includes('sql server') || type.includes('mssql')) return { src: MssqlIcon, tooltip: 'Microsoft SQL Server' }
  if (type.includes('file') || type.includes('файл')) return { src: FileIcon, tooltip: 'Файлы' }
  return null
}
function onIconHover(event, text) {
    const target = event?.target
    if (!target || !document.body.contains(target)) return

    tooltipText.value = text
    showTooltip.value = true

    const rect = target.getBoundingClientRect()
    tooltipStyle.value = {
        top: `${rect.top + window.scrollY - 32}px`,
        left: `${rect.left + rect.width / 2 + window.scrollX}px`
    }
}

function hideTooltip() {
    showTooltip.value = false
}
</script>

<style scoped lang="scss">
.connection-list {
    list-style: none;
    max-height: 355px;
    overflow-y: auto;
    padding: 0;
    margin: 0;
}

.connection-item {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 8px 6px;
    border-radius: 6px;
    cursor: pointer;
    transition: background 0.2s ease;

    &:hover {
        background-color: var(--color-hover-background);
    }
}

.connection-item.selected {
  background-color: var(--color-hover-background);
  border: 1.5px solid #198754;
}

.connection-left {
    display: flex;
    align-items: center;
    gap: 8px;
}

.connection-name {
    color: var(--color-primary-text);
    font-size: 14px;
}

.connection-date {
    font-size: 13px;
    color: var(--color-secondary-text);
}

.icon {
    width: 18px;
    height: 18px;
}

.no-data {
    padding: 12px;
    text-align: center;
    color: var(--color-primary-text);
}

.loading-placeholder {
    opacity: 0.6;
    animation: pulse 1.5s infinite ease-in-out;
}

.skeleton-icon {
    width: 18px;
    height: 18px;
    background-color: var(--color-secondary-text);
    border-radius: 4px;
}

.skeleton-text {
    width: 100px;
    height: 14px;
    background-color: var(--color-secondary-text);
    border-radius: 4px;
    margin-left: 8px;
}

.skeleton-date {
    width: 60px;
    height: 12px;
    background-color: var(--color-secondary-text);
    border-radius: 4px;
}

@keyframes pulse {

    0%,
    100% {
        opacity: 0.6;
    }

    50% {
        opacity: 1;
    }
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
</style>