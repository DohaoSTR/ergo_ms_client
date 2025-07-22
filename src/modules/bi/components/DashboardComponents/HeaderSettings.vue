<template>
  <div class="widget-settings">
    <h5 style="margin-bottom: 16px; font-weight: 500;">Настройки виджета</h5>
    <div class="form-group">
      <label for="title">Заголовок</label>
      <input id="title" v-model="title" type="text" />
    </div>
    <div class="form-group">
      <label>Размер</label>
      <div class="size-options">
        <div class="size-options-container">
          <button v-for="size in sizes" :key="size" :class="{ active: selectedSize === size }" @click="selectSize(size)">{{ size }}</button>
        </div>
      </div>
    </div>
    <div class="form-group">
      <label>Фон</label>
      <input type="color" v-model="background" />
    </div>
    <div class="form-group">
      <label>
        <input type="checkbox" v-model="hint" /> Подсказка
      </label>
    </div>
    
    <!-- Текстовый редактор для подсказки -->
    <div v-if="hint" class="form-group">
      <label>Текст подсказки</label>
      <TextHintEditor :hintText="hintText" @update:hintText="val => hintText = val" />
    </div>
    
    <div class="form-group">
      <label>
        <input type="checkbox" v-model="autoHeight" /> Автовысота
      </label>
    </div>
    <div class="form-group">
      <label>
        <input type="checkbox" v-model="showInToc" /> Отображать в оглавлении
      </label>
    </div>
    <div class="actions">
      <button @click="onCancel" class="cancel">Отменить</button>
      <button class="btn btn-primary" @click="onSubmit">Добавить</button>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue';
import { WholeWord } from 'lucide-vue-next';
import TextHintEditor from './TextHintEditor.vue';

const emit = defineEmits(['close']);

const title = ref('');
const hintText = ref('');
const sizes = ['XS', 'S', 'M', 'L', 'XL'];
const selectedSize = ref('XS');
const background = ref('#2d2d3d');
const hint = ref(false);
const autoHeight = ref(false);
const showInToc = ref(true);
const showTooltip = ref(false);
function toggleTooltip() {
  showTooltip.value = !showTooltip.value;
}

function selectSize(size) {
  selectedSize.value = size;
}

function updateHintText(event) {
  hintText.value = event.target.innerText;
}

function onCancel() {
  emit('close');
}

function onSubmit() {
  emit('close');
}
</script>

<style scoped lang="scss">
.widget-settings {
  background: var(--color-primary-background);
  padding: 24px;
  border-radius: 8px;
  color: var(--color-text-primary);
  min-width: 400px;
}
.form-group {
  margin-bottom: 16px;
  display: flex;
  flex-direction: column;
}
.size-options{
  display: flex;
  justify-content: start;
  align-items: center;
  width: auto;
}
.size-options-container {
  display: flex;
  padding: 5px;
  gap: 5px;
  margin-top: 4px;
  justify-content: start;
  align-items: center;
  width: auto;
  background-color: var(--color-background);
  border-radius: 0.5rem;
}
.size-options-container button {
  background: var(--color-background);
  color: var(--color-text-primary);
  width: 45px;
  height: 32px;
  border: none;
  border-radius: 0.5rem;
  padding: 4px 12px;
  cursor: pointer;
  opacity: 0.7;
  transition: background 0.2s, color 0.2s, opacity 0.2s;
}
.size-options-container button.active {
  background: var(--color-accent);
  font-weight: 700;
  opacity: 1;
}
input[type="text"] {
  background: var(--color-background);
  color: var(--color-text-primary);
  border: 1px solid var(--color-border);
  border-radius: 4px;
  padding: 6px 10px;
  margin-top: 4px;
}
input[type="color"] {
  width: 32px;
  height: 32px;
  border: none;
  background: none;
  margin-top: 4px;
}
input[type="checkbox"]:checked {
  accent-color: var(--color-accent);
}

.actions {
  display: flex;
  justify-content: flex-end;
  gap: 16px;
  margin-top: 24px;
}
button.cancel {
  background: none;
  color: var(--color-secondary-text);
  border: none;
  font-size: 16px;
  cursor: pointer;
}
button.cancel:hover {
  color: var(--color-primary-text);
  transition: background 0.2s, color 0.2s, opacity 0.2s;
  cursor: pointer;
}
button.submit {
  background: var(--color-accent);
  color: var(--color-text-primary);
  border: none;
  border-radius: 6px;
  padding: 8px 24px;
  font-size: 16px;
  cursor: pointer;
}
.custom-tooltip {
  position: absolute;
  top: 110%;
  left: 50%;
  transform: translateX(-50%);
  background: var(--color-primary-background);
  color: var(--color-text-primary);
  border: 1px solid var(--color-border);
  border-radius: 6px;
  padding: 8px 12px;
  white-space: nowrap;
  z-index: 10;
  box-shadow: 0 2px 8px rgba(0,0,0,0.15);
  font-size: 13px;
}
</style>