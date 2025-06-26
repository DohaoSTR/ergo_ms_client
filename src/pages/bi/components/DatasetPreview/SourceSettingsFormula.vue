<template>
  <div class="split-pane vertical">
    <div class="Pane Panel vertical" :style="panelStyle">
      <div class="settings-sidebar">
        <input v-model="search" class="form-control form-control-sm bg-dark text-white mb-2" placeholder="Поле" />
        <ul class="fields-list">
          <li v-for="fld in filteredFields" :key="fld.name" class="field-item">
            <span class="col-icon" style="display: flex; align-items: center; justify-content: center;" :style="{ color: getTypeMeta(fld.type).color }">
              <component :is="getTypeMeta(fld.type).icon" :size="15" />
            </span>
            <span class="col-name" style="margin-left: 10px;">{{ fld.name }}</span>
            <span class="col-type-label" :style="{ color: getTypeMeta(fld.type).color }">
              {{ getTypeMeta(fld.type).label }}
            </span>
          </li>
        </ul>
      </div>
    </div>

    <span role="presentation" class="Resizer vertical" @mousedown.prevent="startResize"></span>

    <div class="Pane Pane2 vertical" :style="pane2Style">
      <div class="settings-editor">
        <div class="editor-placeholder">Редактор формул</div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onBeforeUnmount } from 'vue'
import { Hash, Text, Calendar, CheckSquare, SquareFunction } from 'lucide-vue-next'

const search = ref('')

const props = defineProps({
  expression: String,
  fields: { type: Array, default: () => [] },
})

const filteredFields = computed(() =>
  props.fields
    .map(f => ({
      ...f,
      type: f.type || 'string'
    }))
    .filter(f => f.name.toLowerCase().includes(search.value.toLowerCase()))
)

const typeIconMap = {
  string: { icon: Text, color: '#3ea8ff', label: '' },
  integer: { icon: Hash, color: '#ffd600', label: '' },
  float: { icon: Hash, color: '#ff9100', label: '' },
  date: { icon: Calendar, color: '#66bb6a', label: '' },
  datetime: { icon: Calendar, color: '#00e676', label: '' },
  bool: { icon: CheckSquare, color: '#f50057', label: '' },
  expression: { icon: SquareFunction, color: '#ab47bc', label: 'fx' },
  default: { icon: Text, color: '#90a4ae', label: '' }
}

function getTypeMeta(type) {
  return typeIconMap[type] || typeIconMap.default
}

const panelWidth = ref(256)
const minWidth = 150
const maxWidth = 600
let isResizing = false, startX = 0, startWidth = 0

function startResize(e) {
  isResizing = true
  startX = e.clientX
  startWidth = panelWidth.value
  window.addEventListener('mousemove', onMouseMove)
  window.addEventListener('mouseup', stopResize)
}
function onMouseMove(e) {
  if (!isResizing) return
  const delta = e.clientX - startX
  panelWidth.value = Math.min(
    maxWidth,
    Math.max(minWidth, startWidth + delta)
  )
}
function stopResize() {
  isResizing = false
  window.removeEventListener('mousemove', onMouseMove)
  window.removeEventListener('mouseup', stopResize)
}
onBeforeUnmount(stopResize)

const panelStyle = computed(() => ({
  flex: '0 0 auto',
  width: `${panelWidth.value}px`,
  position: 'relative',
  outline: 'none'
}))

const pane2Style = computed(() => ({
  flex: '1 1 auto',
  position: 'relative',
  outline: 'none',
  minWidth: `calc(100% - ${maxWidth}px)`,
  maxWidth: `calc(100% - ${minWidth}px)`
}))
</script>

<style scoped lang="scss">
.split-pane.vertical {
  display: flex;
  height: 100%;
  overflow: hidden;
  user-select: text;
}

.Pane {
  display: flex;
  flex-direction: column;
}

.Resizer.vertical {
  position: relative;
  width: 9px;
  margin: 0 -4px;
  cursor: col-resize;
  z-index: 10;
  background: transparent;
}

.Resizer.vertical::before {
  content: "";
  position: absolute;
  top: 0;
  left: 50%;
  transform: translateX(-50%);
  width: 1px;
  height: 100%;
  background: rgba(255, 255, 255, 0.2);
}

.Resizer.vertical:hover::before {
  background: rgba(255, 255, 255, 0.4);
}

.settings-sidebar input.form-control {
  border: 1px solid rgba(255, 255, 255, 0.3) !important;
  border-radius: 4px !important;
  transition: border-color 0.2s ease !important;
}

.settings-sidebar input.form-control:focus {
  border-color: rgba(255, 255, 255, 0.4) !important;
  outline: none !important;
  box-shadow: none !important;
}

.settings-sidebar input.form-control:not(:placeholder-shown) {
  border-color: rgba(255, 255, 255, 0.4) !important;
}

.settings-sidebar {
  padding: 0.5rem 1rem 0.5rem 0;
}

.settings-editor {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0.5rem;
  border-left: none;
}

.editor-placeholder {
  color: var(--color-secondary-text);
}

.fields-list {
  list-style: none;
  padding: 0;
  margin: 0;
}

.field-item {
  display: flex;
  align-items: center;
  padding: 6px 14px;
  border-radius: 6px;
  cursor: pointer;
  transition: background 0.13s, box-shadow 0.13s;
  font-size: 15px;
  margin-bottom: 2px;

  &:hover {
    background: var(--color-hover-background);
  }

  &:active {
    background: var(--color-hover-background);
  }
}

.field-item .lucide {
  filter: drop-shadow(0 0 3px rgba(60, 200, 255, 0.27));
}
</style>
