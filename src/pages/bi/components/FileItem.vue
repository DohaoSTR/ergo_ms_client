<template>
  <div class="file-item" :class="{ active: isActive }" @click="emitSelect">
    <div class="file-content">
      <img :src="iconPath" class="file-icon" @mouseenter="onIconHover($event, tooltipLabel)" @mouseleave="onIconLeave"/>
      <div class="file-name-desc">
        <span class="file-name" :title="file.name">{{ file.name }}</span>
        <span v-if="file.pendingSheets && !file.processedSheets" class="file-subtext">Выбрать листы</span>
      </div>
    </div>

    <div v-if="!file.pendingSheets" class="relative">
      <button class="file-menu" @click.stop="toggleMenu" ref="menuButton">
        <MoreHorizontal class="menu-icon" />
      </button>
      <div v-if="showMenu" class="menu-dropdown" ref="menuDropdown">
        <template v-if="isTemp">
          <!--<div class="menu-item" @click="handleTempReplace">Заменить</div>-->
          <div class="menu-item danger" @click="emitDelete">Удалить</div>
        </template>
        <template v-else>
          <div class="menu-item" @click="emitReplace">Заменить</div>
          <div class="menu-item" @click="emitRename">Переименовать</div>
          <div class="menu-item danger" @click="emitDelete">Удалить</div>
        </template>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onBeforeUnmount, computed } from 'vue'
import { MoreHorizontal } from 'lucide-vue-next'

const props = defineProps({
  file: Object,
  isActive: Boolean,
  isTemp: Boolean
})
const emit = defineEmits(['replace', 'rename', 'delete', 'tooltip-show', 'tooltip-hide', 'select', 'pick-sheets'])

const showMenu = ref(false)
const menuButton = ref(null)
const menuDropdown = ref(null)

const tooltipLabel = computed(() => {
  let ext = props.file.file_type?.toLowerCase()
  if (!ext && props.file.name) {
    const m = props.file.name.match(/\.(\w+)$/)
    if (m) ext = m[1].toLowerCase()
  }
  if (ext === 'csv' || ext === 'xlsx' || ext === 'xls' || ext === 'txt') {
    return `Файл формата .${ext}`
  }
  return 'Файл неизвестного формата'
})

function onIconHover(event) {
  emit('tooltip-show', event, tooltipLabel.value)
}
function onIconLeave() {
  emit('tooltip-hide')
}

const iconPath = computed(() => {
  let ext = props.file.file_type?.toLowerCase()
  if (!ext && props.file.name) {
    const m = props.file.name.match(/\.(\w+)$/)
    if (m) ext = m[1].toLowerCase()
  }
  switch (ext) {
    case 'csv': return new URL('@/assets/bi/icons/csv.svg', import.meta.url).href
    case 'xlsx':
    case 'xls': return new URL('@/assets/bi/icons/xlsx.svg', import.meta.url).href
    case 'txt': return new URL('@/assets/bi/icons/txt.svg', import.meta.url).href
    default: return new URL('@/assets/bi/icons/folder_windows_style.svg', import.meta.url).href
  }
})

function toggleMenu() {
  showMenu.value = !showMenu.value
}
function emitReplace() {
  emit('replace', props.file)
  showMenu.value = false
}
function emitRename() {
  emit('rename', props.file)
  showMenu.value = false
}
function emitDelete() {
  emit('delete', props.file)
  showMenu.value = false
}
function emitSelect() {
  emit('select', props.file)
}

function handleTempReplace() { // Функция замены листа у временного файла, так и не реализована
  emit('pick-sheets', props.file)
}

function handleClickOutside(event) {
  if (
    !menuButton.value?.contains(event.target) &&
    !menuDropdown.value?.contains(event.target)
  ) {
    showMenu.value = false
  }
}
onMounted(() => document.addEventListener('click', handleClickOutside))
onBeforeUnmount(() => document.removeEventListener('click', handleClickOutside))

</script>

<style scoped>
.file-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 8px 12px;
  border-radius: 6px;
  min-height: 40px;
  transition: background 0.2s ease;
  cursor: pointer;
  position: relative;
}
.file-item:hover {
  background-color: var(--color-hover-background);
}
.file-item.active {
  background-color: var(--color-hover-background);
}

.file-content {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-grow: 1;
  min-width: 0;
}

.file-icon {
  width: 16px;
  height: 16px;
  flex-shrink: 0;
}

.file-name-desc {
  display: flex;
  flex-direction: column;
  max-width: 100%;
  overflow: hidden;
}

.file-name {
  font-size: 0.95rem;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  color: var(--color-primary-text);
}

.file-subtext {
  font-size: 0.75rem;
  color: var(--color-secondary-text);
  margin-top: 2px;
}

.file-menu {
  background: transparent;
  border: none;
  width: 28px;
  height: 28px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 6px;
  transition: background 0.2s ease;
  margin-left: 8px;
  cursor: pointer;
}
.file-menu:hover {
  background-color: var(--color-hover-background);
}

.menu-icon {
  width: 18px;
  height: 18px;
  color: var(--color-secondary-text);
}

.menu-icon:hover{
  color: var(--color-primary-text);
}

.relative {
  position: relative;
}

.menu-dropdown {
  position: absolute;
  top: 28px;
  right: 0;
  background-color: var(--color-primary-background);
  border: 1px solid var(--color-border);
  border-radius: 6px;
  z-index: 10;
  box-shadow: 0 4px 10px rgba(0, 0, 0, 0.15);
  min-width: 120px;
  padding: 2px 0;
}

.menu-item {
  padding: 6px 10px;
  font-size: 0.85rem;
  color: #e4e4e7;
  cursor: pointer;
  transition: background 0.15s ease;
  line-height: 1.2;
}
.menu-item:hover {
  background-color: var(--color-hover-background);
}
.menu-item.danger {
  color: var(--color-accent);
}
</style>
