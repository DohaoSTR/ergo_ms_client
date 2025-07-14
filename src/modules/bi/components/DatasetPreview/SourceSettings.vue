<template>
  <div class="source-settings" :class="{ 'resizing-footer': isResizing }" :style="{ '--footer-height': showHelp ? helpHeight + 'px' : '0px' }">
    <div class="settings-top d-flex align-items-center gap-3">
      <input v-model="local.name" class="form-control form-control-sm bg-dark text-white flex-grow-1" placeholder="Название поля" />
      <div class="tab-group">
        <button class="tab-button" :class="{ active: activeTab === 'formula' }" @click="activeTab = 'formula'">Формула</button>
        <button class="tab-button" :class="{ active: activeTab === 'field' }" @click="activeTab = 'field'">Поле из источника</button>
      </div>
      <button class="btn btn-sm btn-outline-secondary ms-auto" v-if="activeTab === 'formula'" @click="showHelp = !showHelp">Справочник</button>
    </div>
    <div class="settings-body">
      <SourceSettingsFormula v-if="activeTab === 'formula'" v-model:expression="expression" :fields="fieldsList" />
      <SourceSettingsField v-else v-model:search="search" @insert-field="insertField" />
      <div class="modal-actions d-flex justify-content-end gap-2 mt-3" :class="{ 'no-footer': !showHelp || activeTab === 'field' }">
        <button class="btn btn-sm btn-outline-light cancel-btn" @click="$emit('close')">Отменить</button>
        <button class="btn btn-sm btn-primary" @click="apply">Создать</button>
      </div>
    </div>
    <div class="settings-footer" @mousedown="startHelpResize" @dblclick="resetHelpHeight">
      <SourceSettingsHelp />
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch } from 'vue'
import SourceSettingsField from './SourceSettingsField.vue'
import SourceSettingsFormula from './SourceSettingsFormula.vue'
import SourceSettingsHelp from './SourceSettingsHelp.vue'

const props = defineProps({
  field: Object,
  cols: { type: Array, default: () => [] },
  rows: { type: Array, default: () => [] }
})
const emit = defineEmits(['close', 'create'])

const local = ref({ ...props.field })
const activeTab = ref('formula')
const expression = ref('')
const search = ref('')

const fieldsList = computed(() => {
  if (!props.cols) return []
  if (!props.rows || !props.rows.length) {
    return props.cols.map(col => ({ name: col, type: 'string' }))
  }
  return props.cols.map((col, idx) => {
    const values = props.rows.map(row => row[idx])
    return {
      name: col,
      type: detectColumnType(values)
    }
  })
})

const showHelp = ref(true)
const helpHeight = ref(200)
let isResizing = false, startY = 0, startH = 0

function startHelpResize(e) {
  if (e.offsetY <= 6) {
    isResizing = true
    startY = e.clientY
    startH = helpHeight.value
    document.addEventListener('mousemove', onHelpResize)
    document.addEventListener('mouseup', stopHelpResize)
  }
}
function onHelpResize(e) {
  if (!isResizing) return
  const delta = startY - e.clientY
  helpHeight.value = Math.min(Math.max(startH + delta, 100), 400)
}
function stopHelpResize() {
  isResizing = false
  document.removeEventListener('mousemove', onHelpResize)
  document.removeEventListener('mouseup', stopHelpResize)
}
function resetHelpHeight() {
  helpHeight.value = 200
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

watch(activeTab, tab => {
  if (tab === 'field') showHelp.value = false
  else showHelp.value = true
})

function insertField(name) {
  expression.value += name
}

function apply() {
  emit('create', { ...local.value, expression, mode: activeTab.value })
}
</script>

<style scoped lang="scss">
.source-settings {
  display: grid;
  grid-template-rows: auto 1fr var(--footer-height, 200px);
  height: 100%;
  overflow: hidden;
}

.settings-footer::before {
  content: "";
  position: absolute;
  top: 0; left: 0;
  width: 100%; height: 6px;
  cursor: row-resize;
  z-index: 10;
}

.settings-top {
  padding: 1rem 1rem 1rem 0;
  gap: .5rem;
}

.settings-body {
  flex: 1 1 auto;
  min-height: 0;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.modal-actions {
  margin-top: auto;
  padding-bottom: 20px;
  &.no-footer {
    padding-bottom: 40px;
  }
}

.settings-footer {
  position: relative;
  background: var(--color-primary-background);
  overflow: auto;
  border-top: 1px solid var(--color-border);
}

.settings-footer::before {
  content: "";
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 6px;
  cursor: row-resize;
  z-index: 10;
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
  color: #fff;
}

.tab-button:not(.active):hover {
  background: rgba(229, 57, 53, 0.2);
}

.settings-top input.form-control {
  border: 1px solid var(--color-border) !important;
  border-radius: 5px !important;
  max-width: 300px;
}

.cancel-btn {
  color: var(--color-secondary-text);
  border-color: var(--color-border);
  background: transparent;
  transition: background-color .2s ease, color .2s ease;
}

.cancel-btn:hover,
.cancel-btn:focus {
  color: #fff;
  background-color: var(--color-hover-background);
}
</style>
