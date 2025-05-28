<template>
  <div v-if="show" class="modal-overlay">
    <div class="modal-content">
      <div class="modal-header">
        <h3>Добавить запись в таблицу "{{ tableTitle }}"</h3>
        <button class="close-button" @click="$emit('cancel')" title="Закрыть">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <line x1="18" y1="6" x2="6" y2="18"/>
            <line x1="6" y1="6" x2="18" y2="18"/>
          </svg>
        </button>
      </div>
      <div class="modal-body">
        <div class="json-input-section">
          <label for="jsonInput" class="json-input-label">Введите данные в формате JSON:</label>
          <textarea
            id="jsonInput"
            v-model="localJsonInput"
            ref="jsonTextarea"
            class="json-textarea"
            rows="10"
            :placeholder="jsonPlaceholder"
            @paste="onPasteJson"
          ></textarea>
          <div v-if="jsonError" class="json-error">{{ jsonError }}</div>
        </div>
        <div v-if="currentTableHint" class="json-hint-block">
          <div class="json-hint-title">Пример объекта для этой таблицы:</div>
          <pre class="json-hint-pre">{{ JSON.stringify(currentTableHint.example, null, 2) }}</pre>
          <div class="json-hint-title">Обязательные поля:</div>
          <ul class="json-hint-list">
            <li v-for="f in currentTableHint.required" :key="f">
              <span :style="missingRequiredFields.includes(f) ? 'color: var(--color-danger); font-weight: 600;' : ''">
                {{ f }}
                <span v-if="currentTableHint.description && currentTableHint.description[f]" class="field-description">
                  - {{ currentTableHint.description[f] }}
                </span>
              </span>
            </li>
          </ul>
          <div v-if="missingRequiredFields.length" class="json-error" style="margin-top: 4px;">
            Внимание: не заполнены обязательные поля!
          </div>
        </div>
      </div>
      <div class="modal-actions">
        <button @click="$emit('save', localJsonInput)" :disabled="!isJsonValid || isAdding" class="confirm-btn">
          <svg width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" viewBox="0 0 24 24">
            <polyline points="20 6 9 17 4 12"/>
          </svg>
          Сохранить
        </button>
        <button @click="$emit('cancel')" class="cancel-btn">
          <svg width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" viewBox="0 0 24 24">
            <line x1="18" y1="6" x2="6" y2="18"/>
            <line x1="6" y1="6" x2="18" y2="18"/>
          </svg>
          Отмена
        </button>
      </div>
    </div>
  </div>
</template>
<script setup>
import { ref, watch } from 'vue';
const props = defineProps({
  show: Boolean,
  tableTitle: String,
  jsonInput: String,
  jsonPlaceholder: String,
  jsonError: String,
  isJsonValid: Boolean,
  isAdding: Boolean,
  currentTableHint: Object,
  missingRequiredFields: Array
});
const emit = defineEmits(['save', 'cancel', 'paste']);
const localJsonInput = ref(props.jsonInput);
watch(() => props.jsonInput, (val) => { localJsonInput.value = val; });
watch(localJsonInput, (val) => { emit('update:jsonInput', val); });
const onPasteJson = (e) => emit('paste', e);
</script>
<style scoped>
.modal-overlay {
  position: fixed;
  z-index: 9998;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
  background: var(--modal-overlay-bg, rgba(0, 0, 0, 0.35));
  display: flex;
  align-items: center;
  justify-content: center;
}
.modal-content {
  background: var(--color-secondary-background);
  color: var(--color-primary-text);
  border-radius: 16px;
  box-shadow: 0 8px 32px rgba(0,0,0,0.15);
  min-width: 340px;
  max-width: 600px;
  width: 90%;
  padding: 32px 24px 24px 24px;
  max-height: 80vh;
  overflow-y: auto;
  position: relative;
  scrollbar-width: thin;
  scrollbar-color: var(--color-border) transparent;
}
.modal-content::-webkit-scrollbar {
  width: 8px;
  height: 8px;
}
.modal-content::-webkit-scrollbar-track {
  background: transparent;
  border-radius: 4px;
}
.modal-content::-webkit-scrollbar-thumb {
  background: var(--color-border);
  border-radius: 4px;
}
.modal-content::-webkit-scrollbar-thumb:hover {
  background: var(--color-secondary-text);
}
.modal-header {
  display: flex;
  justify-content: flex-start;
  align-items: flex-start;
  margin-bottom: 24px;
  padding-bottom: 16px;
  border-bottom: 2px solid var(--color-border);
  position: relative;
}
.modal-header h3 {
  margin: 0;
  font-size: 22px;
  color: var(--color-accent);
  font-weight: 700;
  flex: 1;
}
.close-button {
  position: absolute;
  top: 0;
  right: 0;
  margin: 10px 10px 0 0;
  width: 36px;
  height: 36px;
  padding: 6px;
  border: none;
  background: transparent;
  color: var(--color-secondary-text);
  cursor: pointer;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: background 0.18s, color 0.18s, box-shadow 0.18s, transform 0.25s;
}
.close-button:hover {
  background: var(--color-danger-bg);
  color: var(--color-danger);
  box-shadow: 0 2px 8px rgba(211,47,47,0.08);
  transform: rotate(90deg);
}
.modal-body {
  margin-bottom: 18px;
}
.json-input-section {
  margin-bottom: 20px;
}
.json-input-label {
  display: block;
  margin-bottom: 8px;
  color: var(--color-secondary-text);
  font-size: 14px;
  font-weight: 500;
}
.json-textarea {
  width: 100%;
  font-family: monospace;
  font-size: 15px;
  border: 1.5px solid var(--color-border);
  border-radius: 6px;
  padding: 10px;
  background: var(--color-primary-background);
  color: var(--color-primary-text);
  margin-bottom: 8px;
  resize: vertical;
  min-height: 120px;
  height: auto;
  transition: border-color 0.2s, box-shadow 0.2s;
  scrollbar-width: thin;
  scrollbar-color: var(--color-border) transparent;
}
.json-textarea:focus {
  border-color: var(--color-accent);
  box-shadow: 0 0 0 2px rgba(80,120,255,0.08);
  outline: none;
}
.json-textarea::-webkit-scrollbar {
  width: 8px;
  height: 8px;
}
.json-textarea::-webkit-scrollbar-track {
  background: transparent;
  border-radius: 4px;
}
.json-textarea::-webkit-scrollbar-thumb {
  background: var(--color-border);
  border-radius: 4px;
}
.json-textarea::-webkit-scrollbar-thumb:hover {
  background: var(--color-secondary-text);
}
.json-error {
  color: var(--color-danger);
  margin-top: 8px;
  font-size: 14px;
  padding: 8px 12px;
  background: rgba(211,47,47,0.07);
  border-radius: 4px;
  border: 1px solid rgba(211,47,47,0.15);
}
.json-hint-block {
  margin-top: 10px;
  background: var(--color-table-header);
  border-radius: 8px;
  padding: 12px 14px 10px 14px;
  font-size: 14px;
  color: var(--color-secondary-text);
}
.json-hint-title {
  font-weight: 600;
  margin-bottom: 2px;
  color: var(--color-primary-text);
}
.json-hint-pre {
  background: var(--color-code-background, var(--color-table-header));
  border-radius: 8px;
  padding: 12px 16px;
  font-size: 14px;
  color: var(--color-code-text, var(--color-primary-text));
  font-family: 'Fira Mono', 'Consolas', 'Menlo', 'Monaco', monospace;
  border: 1.5px solid var(--color-border);
  margin: 0 0 12px 0;
  overflow-x: auto;
  box-shadow: 0 2px 8px rgba(80,120,255,0.04);
  transition: background 0.18s, border 0.18s;
  scrollbar-width: thin;
  scrollbar-color: var(--color-border) transparent;
}
.json-hint-pre::-webkit-scrollbar {
  width: 6px;
  height: 6px;
}
.json-hint-pre::-webkit-scrollbar-track {
  background: transparent;
  border-radius: 4px;
}
.json-hint-pre::-webkit-scrollbar-thumb {
  background: var(--color-border);
  border-radius: 4px;
}
.json-hint-pre::-webkit-scrollbar-thumb:hover {
  background: var(--color-secondary-text);
}
.json-hint-list {
  margin: 0 0 6px 0;
  padding-left: 18px;
}
.field-description {
  color: var(--color-secondary-text);
  font-size: 0.9em;
  font-weight: normal;
  margin-left: 4px;
}
.modal-actions {
  display: flex;
  gap: 12px;
  justify-content: flex-end;
  margin-top: 18px;
}
.confirm-btn {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 8px 18px;
  border-radius: 6px;
  font-size: 15px;
  font-weight: 600;
  background: var(--color-accent);
  color: #fff;
  border: none;
  transition: background 0.18s, box-shadow 0.18s, color 0.18s;
  box-shadow: 0 2px 8px rgba(80,120,255,0.08);
  cursor: pointer;
}
.confirm-btn:disabled {
  background: var(--color-border);
  color: var(--color-secondary-text);
  cursor: not-allowed;
  opacity: 0.7;
}
.confirm-btn:not(:disabled):hover {
  background: var(--color-accent-hover);
  color: #fff;
}
.cancel-btn {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 8px 18px;
  border-radius: 6px;
  font-size: 15px;
  font-weight: 600;
  background: var(--color-danger);
  color: #fff;
  border: none;
  transition: background 0.18s, box-shadow 0.18s, color 0.18s;
  box-shadow: 0 2px 8px rgba(211,47,47,0.08);
  cursor: pointer;
}
.cancel-btn:hover {
  background: var(--color-danger-hover);
  color: #fff;
}
</style>
