<template>
  <div class="text-editor">
    <div class="editor-toolbar">
      <div class="toolbar-left">
        <button class="toolbar-btn" title="Отменить">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M3 7v6h6"/>
            <path d="M21 17a9 9 0 0 0-9-9 9 9 0 0 0-6 2.3L3 13"/>
          </svg>
        </button>
        <button class="toolbar-btn" title="Повторить">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M21 7v6h-6"/>
            <path d="M3 17a9 9 0 0 1 9-9 9 9 0 0 1 6 2.3l3-2.7"/>
          </svg>
        </button>
      </div>
      <div class="toolbar-separator"></div>
      <div class="toolbar-formatting">
        <button class="toolbar-btn" :class="{ 'active': activeFormats.bold }" title="Жирный" @click="applyFormat('bold')">B</button>
        <button class="toolbar-btn" :class="{ 'active': activeFormats.italic }" title="Курсив" @click="applyFormat('italic')">I</button>
        <button class="toolbar-btn" :class="{ 'active': activeFormats.underline }" title="Подчеркнутый" @click="applyFormat('underline')">U</button>
        <button class="toolbar-btn" :class="{ 'active': activeFormats.strikeThrough }" title="Зачеркнутый" @click="applyFormat('strikeThrough')">S</button>
        <button class="toolbar-btn" :class="{ 'active': activeFormats.monospace }" title="Моноширинный" @click="toggleMonospace">M</button>
        <button class="toolbar-btn" :class="{ 'active': activeFormats.highlight }" title="Выделенный" @click="toggleHighlight"><WholeWord /></button>
      </div>
      <div class="toolbar-separator"></div>
      <div class="toolbar-styles">
        <div style="position: relative; display: inline-block;">
          <button class="toolbar-btn toolbar-btn-list" :class="{ 'active': selectedStyle !== 'p', 'tooltip-open': showTooltip }" @click="toggleTooltip" type="button">
            H
            <svg width="8" height="8" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <polyline points="6,9 12,15 18,9"/>
            </svg>
          </button>
          <div v-if="showTooltip" class="custom-tooltip style-list-tooltip" @click.stop>
            <div class="style-list-item" :class="{ 'active': selectedStyle === 'p' }" @click="setStyle('p')">
              <span class="style-icon"><Type :size="20" /></span>
              <span>Текст</span>
            </div>
            <div class="style-list-item" v-for="n in 6" :key="n" :class="{ 'active': selectedStyle === 'h' + n }" @click="setStyle('h' + n)">
              <span class="style-icon">
                <component :is="headingIcons[n-1]" :size="20" />
              </span>
              <span>Заголовок {{n}}</span>
            </div>
          </div>
        </div>
        <div style="position: relative; display: inline-block;">
          <button class="toolbar-btn toolbar-btn-list" :class="{ 'active': selectedListStyle, 'tooltip-open': showListTooltip }" title="Список" @click="toggleListTooltip">
            <List />
            <svg width="8" height="8" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <polyline points="6,9 12,15 18,9"/>
            </svg>
          </button>
          <div v-if="showListTooltip" class="custom-tooltip style-list-tooltip" @click.stop>
            <div class="style-list-item" :class="{ 'active': selectedListStyle === 'ul' }" @click="setList('insertUnorderedList')">
              <span class="style-icon"><List :size="20" /></span>
              <span>Маркированный список</span>
            </div>
            <div class="style-list-item" :class="{ 'active': selectedListStyle === 'ol' }" @click="setList('insertOrderedList')">
              <span class="style-icon"><ListOrdered :size="20" /></span>
              <span>Нумерованный список</span>
            </div>
          </div>
        </div>
      </div>
      <div class="toolbar-separator"></div>
      <div class="toolbar-actions">
        <div style="position: relative; display: inline-block;">
          <button class="toolbar-btn" :class="{ 'tooltip-open': showMoreTooltip }" title="Ещё" @click="toggleMoreTooltip">
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <circle cx="12" cy="12" r="1"/>
              <circle cx="19" cy="12" r="1"/>
              <circle cx="5" cy="12" r="1"/>
            </svg>
          </button>
          <div v-if="showMoreTooltip" class="custom-tooltip style-list-tooltip" @click.stop>
            <div v-for="action in moreActions" :key="action.label" class="style-list-item" :class="{ 'disabled': action.disabled }" @click="!action.disabled && handleMoreAction(action.command)">
              <span class="style-icon">
                <component :is="action.icon" :size="20" />
              </span>
              <span>{{ action.label }}</span>
            </div>
          </div>
        </div>
        <div style="position: relative; display: inline-block;">
          <button class="toolbar-btn" :class="{ 'tooltip-open': showSettingsTooltip }" title="Настройки" @click="toggleSettingsTooltip">
            <svg width="8" height="8" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <circle cx="12" cy="12" r="3"/>
              <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1 1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"/>
            </svg>
          </button>
          <div v-if="showSettingsTooltip" class="custom-tooltip settings-tooltip" @click.stop>
            <div class="style-list-item" :class="{ 'active': editorMode === 'wysiwyg' }" @click="editorMode = 'wysiwyg'">
                <span class="style-icon"><Type :size="20"/></span>
                <span>Визуальный редактор (wysiwyg)</span>
            </div>
            <div class="style-list-item" :class="{ 'active': editorMode === 'markdown' }" @click="editorMode = 'markdown'">
                <span class="style-icon"><FileText :size="20"/></span>
                <span>Разметка Markdown</span>
            </div>
            <div class="toolbar-separator"></div>
            <div class="settings-option">
                <label>
                    <input type="checkbox" v-model="toolbarEnabled" />
                    <span>Панель инструментов</span>
                </label>
                <div class="settings-description">
                    Можно отключить верхнее меню и вызывать все команды '/' или кнопкой «+»
                </div>
            </div>
          </div>
        </div>
      </div>
    </div>
    <div class="editor-content">
      <div 
        ref="editorDiv"
        class="editor-textarea" 
        contenteditable="true"
        @input="updateHintText"
        @keyup="updateSelectionStyle"
        @mouseup="updateSelectionStyle"
        placeholder="Начните писать текст или введите &quot;/&quot;, чтобы открыть список команд"
      ></div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, reactive } from 'vue';
import {
  WholeWord, Heading1, Heading2, Heading3, Heading4, Heading5, Heading6, Type, List, ListOrdered,
  Link, StickyNote, Scissors, Quote, Code, SquareCode, Image, Table, Minus, Smile, FileText
} from 'lucide-vue-next';

const props = defineProps({
  hintText: {
    type: String,
    default: ''
  },
  content: {
    type: String,
    default: ''
  }
});

const headingIcons = [Heading1, Heading2, Heading3, Heading4, Heading5, Heading6];

const showTooltip = ref(false);
const selectedStyle = ref('p');
const showListTooltip = ref(false);
const selectedListStyle = ref('');
const editorDiv = ref(null);
const showMoreTooltip = ref(false);
const showSettingsTooltip = ref(false);
const toolbarEnabled = ref(true);
const editorMode = ref('wysiwyg');

const activeFormats = reactive({
  bold: false,
  italic: false,
  underline: false,
  strikeThrough: false,
  monospace: false,
  highlight: false,
});

const moreActions = ref([
    { label: 'Ссылка', icon: Link, command: 'createLink' },
    { label: 'Примечание', icon: StickyNote, command: 'addNote' },
    { label: 'Кат', icon: Scissors, command: 'addCut' },
    { label: 'Цитата', icon: Quote, command: 'blockquote' },
    { label: 'Код в тексте', icon: Code, command: 'inlineCode' },
    { label: 'Блок кода', icon: SquareCode, command: 'pre' },
    { label: 'Изображение', icon: Image, command: 'insertImage' },
    { label: 'Таблица', icon: Table, command: 'insertTable', disabled: true },
    { label: 'Разделитель', icon: Minus, command: 'insertHorizontalRule' },
    { label: 'Эмодзи', icon: Smile, command: 'insertEmoji' }
]);

function applyFormat(command) {
  editorDiv.value?.focus();
  document.execCommand(command, false, null);
  updateSelectionStyle();
}

function toggleHighlight() {
  editorDiv.value?.focus();
  const isHighlighted = activeFormats.highlight;
  document.execCommand('backColor', false, isHighlighted ? 'transparent' : 'yellow');
  updateSelectionStyle();
}

function toggleMonospace() {
  editorDiv.value?.focus();
  const isMonospace = activeFormats.monospace;
  document.execCommand('fontName', false, isMonospace ? 'sans-serif' : 'monospace');
  updateSelectionStyle();
}

function toggleTooltip() {
  const isOpen = !showTooltip.value;
  showTooltip.value = isOpen;
  if (isOpen) {
    showListTooltip.value = false;
    showMoreTooltip.value = false;
    showSettingsTooltip.value = false;
  }
}

function setStyle(style) {
  selectedStyle.value = style;
  editorDiv.value?.focus();
  document.execCommand('formatBlock', false, style);
  showTooltip.value = false;
}

function toggleListTooltip() {
  const isOpen = !showListTooltip.value;
  showListTooltip.value = isOpen;
  if (isOpen) {
    showTooltip.value = false;
    showMoreTooltip.value = false;
    showSettingsTooltip.value = false;
  }
}

function setList(command) {
  editorDiv.value?.focus();
  document.execCommand(command, false, null);
  showListTooltip.value = false;
  updateSelectionStyle();
}

function toggleMoreTooltip() {
  const isOpen = !showMoreTooltip.value;
  showMoreTooltip.value = isOpen;
  if (isOpen) {
    showTooltip.value = false;
    showListTooltip.value = false;
    showSettingsTooltip.value = false;
  }
}

function handleMoreAction(command) {
  editorDiv.value?.focus();

  switch (command) {
    case 'createLink': {
      const url = prompt('Введите URL');
      if (url) document.execCommand('createLink', false, url);
      break;
    }
    case 'blockquote':
      document.execCommand('formatBlock', false, 'blockquote');
      break;
    case 'pre':
      document.execCommand('formatBlock', false, 'pre');
      break;
    case 'insertImage': {
      const url = prompt('Введите URL изображения');
      if (url) document.execCommand('insertImage', false, url);
      break;
    }
    case 'insertHorizontalRule':
      document.execCommand('insertHorizontalRule', false, null);
      break;
    default:
      console.warn(`Action "${command}" is not implemented yet.`);
  }

  showMoreTooltip.value = false;
  updateSelectionStyle();
}

function toggleSettingsTooltip() {
  const isOpen = !showSettingsTooltip.value;
  showSettingsTooltip.value = isOpen;
  if (isOpen) {
    showTooltip.value = false;
    showListTooltip.value = false;
    showMoreTooltip.value = false;
  }
}

function updateSelectionStyle() {
  if (document.queryCommandSupported('formatBlock')) {
    let style = document.queryCommandValue('formatBlock').toLowerCase();
    if (!style || !style.length || style === 'div') {
      style = 'p';
    }
    selectedStyle.value = style;
  }
  if (document.queryCommandState('insertUnorderedList')) {
    selectedListStyle.value = 'ul';
  } else if (document.queryCommandState('insertOrderedList')) {
    selectedListStyle.value = 'ol';
  } else {
    selectedListStyle.value = '';
  }

  activeFormats.bold = document.queryCommandState('bold');
  activeFormats.italic = document.queryCommandState('italic');
  activeFormats.underline = document.queryCommandState('underline');
  activeFormats.strikeThrough = document.queryCommandState('strikeThrough');

  const selection = window.getSelection();
  if (!selection || selection.rangeCount === 0) return;

  let parentEl = selection.getRangeAt(0).commonAncestorContainer;
  if (parentEl.nodeType !== 1) {
    parentEl = parentEl.parentNode;
  }

  let highlight = false;
  let el = parentEl;
  while (el && el !== editorDiv.value) {
    if (el.style && (el.style.backgroundColor === 'yellow' || el.style.backgroundColor === 'rgb(255, 255, 0)')) {
      highlight = true;
      break;
    }
    if (el.tagName === 'FONT' && el.color === 'yellow') {
      highlight = true;
      break;
    }
    el = el.parentNode;
  }
  activeFormats.highlight = highlight;

  let monospace = false;
  el = parentEl;
  while(el && el !== editorDiv.value) {
    if (el.tagName === 'FONT' && el.face && el.face.toLowerCase() === 'monospace') {
         monospace = true;
         break;
    }
    if (el.style && el.style.fontFamily) {
      const ff = el.style.fontFamily.toLowerCase();
      if (ff.includes('monospace') || ff.includes('courier')) {
        monospace = true;
        break;
      }
    }
    el = el.parentNode;
  }
  activeFormats.monospace = monospace;
}

const emit = defineEmits(['update:hintText', 'update:content']);
function updateHintText(event) {
  if (props.hintText !== undefined) {
    emit('update:hintText', event.target.innerHTML);
  }
  if (props.content !== undefined) {
    emit('update:content', event.target.innerHTML);
  }
}

onMounted(() => {
  if (editorDiv.value) {
    const initialContent = props.content || props.hintText || '<p><br></p>';
    editorDiv.value.innerHTML = initialContent;
    if (!props.content && !props.hintText) {
      if (props.content !== undefined) {
        emit('update:content', initialContent);
      }
      if (props.hintText !== undefined) {
        emit('update:hintText', initialContent);
      }
    }

    const range = document.createRange();
    const sel = window.getSelection();
    range.setStart(editorDiv.value.firstChild, 0);
    range.collapse(true);
    sel.removeAllRanges();
    sel.addRange(range);
  }
});
</script>

<style scoped lang="scss">
.text-editor {
  border: 1px solid var(--color-border);
  border-radius: 6px;
  background: var(--color-background);
  margin-top: 4px;
  overflow: visible;
  position: relative;
}
.editor-toolbar {
  display: flex;
  align-items: center;
  padding: 8px 12px;
  border-bottom: 1px solid var(--color-border);
  background: var(--color-primary-background);
  gap: 4px;
  overflow: visible;
  position: relative;
  z-index: 10;
}
.toolbar-left,
.toolbar-formatting,
.toolbar-styles,
.toolbar-actions {
  display: flex;
  align-items: center;
  gap: 2px;
}
.toolbar-separator {
  width: 1px;
  height: 20px;
  background: var(--color-border);
  margin: 0 4px;
}
.toolbar-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 28px;
  height: 28px;
  border: none;
  background: transparent;
  color: var(--color-text-secondary);
  border-radius: 4px;
  cursor: pointer;
  font-size: 16px;
  font-weight: 600;
  transition: all 0.2s ease;
  &:hover,
  &.tooltip-open {
    background: var(--color-hover-background);
    color: var(--color-text-primary);
  }
  &.active {
    background: var(--bs-primary-bg-subtle);
    color: var(--color-text-primary);
    &:hover {
      background: var(--bs-primary-border-subtle);
    }
  }
  svg {
    width: 14px;
    height: 14px;
  }
  z-index: 20;
}

.toolbar-btn-list{
  display: flex;
  gap: 4px;
  width: 42px;
  height: 28px;
}

.editor-content {
  min-height: 120px;
  overflow: visible;
  position: relative;
  z-index: 1;
}
.editor-textarea {
  width: 100%;
  min-height: 120px;
  padding: 12px;
  border: none;
  background: transparent;
  color: var(--color-text-primary);
  font-size: 14px;
  line-height: 1.5;
  outline: none;
  resize: vertical;
  &::placeholder {
    color: var(--color-text-secondary);
  }
  &:focus {
    outline: none;
  }
}
.custom-tooltip {
  position: absolute;
  top: calc(100% + 4px);
  left: 50%;
  transform: translateX(-50%);
  background: var(--color-primary-background);
  color: var(--color-text-primary);
  border: 1px solid var(--color-border);
  border-radius: 6px;
  padding: 8px 12px;
  white-space: nowrap;
  z-index: 9999;
  box-shadow: 0 2px 8px rgba(0,0,0,0.15);
  font-size: 13px;
}
.custom-tooltip.style-list-tooltip {
  min-width: 180px;
  padding: 0;
  background: var(--color-primary-background);
  z-index: 9999;
}
.style-list-item {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 8px 16px;
  cursor: pointer;
  font-size: 14px;
  transition: background 0.15s;
}
.style-list-item:hover {
  background: var(--color-hover-background);
}
.style-list-item.active {
  background: var(--bs-primary-bg-subtle);
  color: var(--color-text-primary);
}
.style-list-item.active:hover {
  background: var(--bs-primary-border-subtle);
}
.style-list-item.disabled {
  color: var(--color-text-secondary);
  cursor: not-allowed;
}
.style-list-item.disabled:hover {
  background: transparent;
}
.style-icon {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 24px;
  height: 24px;
  color: var(--color-accent);
}
.settings-tooltip {
  min-width: 280px;
  max-width: 350px;
  padding: 8px 0;
  left: auto;
  right: 0;
  transform: none;
}
.settings-tooltip .toolbar-separator {
    margin: 8px 16px;
    height: 1px;
    width: auto;
}
.settings-option {
    padding: 4px 16px;
    width: auto;
    overflow: hidden;
    overflow-wrap: break-word;
}
.settings-option label {
    display: flex;
    align-items: center;
    gap: 10px;
    font-size: 14px;
    cursor: pointer;
}
input[type="checkbox"] {
  accent-color: var(--color-accent);
}
.settings-description {
    font-size: 13px;
    overflow-wrap: break-word;
    color: var(--color-text-secondary);
    padding-left: 24px;
    margin-top: 4px;
    line-height: 1.4;
    white-space: normal;
}
</style> 