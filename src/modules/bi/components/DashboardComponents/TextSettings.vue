<template>
  <div class="widget-settings">
    <h5 style="margin-bottom: 16px; font-weight: 500;">Настройки виджета</h5>
    <div class="form-group">
      <TextEditor :content="textContent" @update:content="val => textContent = val" />
    </div>
    <div class="form-group">
      <label>Фон</label>
      <input type="color" v-model="background" />
    </div>
    <div class="form-group">
      <label>
        <input type="checkbox" v-model="autoHeight" /> Автовысота
      </label>
    </div>
    <div class="actions">
      <button @click="onCancel" class="cancel">Отменить</button>
      <button class="btn btn-primary" @click="onSubmit">Добавить</button>
    </div>
  </div>
</template>

<script setup>
import { ref, watch } from 'vue';
import TextEditor from './TextEditor.vue';

const props = defineProps({
  data: {
    type: Object,
    default: () => ({})
  }
});

const emit = defineEmits(['close', 'save']);

const textContent = ref('');
const background = ref('#2d2d3d');
const autoHeight = ref(false);

watch(() => props.data, (newData) => {
  if (newData) {
    textContent.value = newData.content || '';
    background.value = newData.background || '#2d2d3d';
    autoHeight.value = newData.autoHeight || false;
  }
}, { immediate: true });

function onCancel() {
  emit('close');
}

function onSubmit() {
  const settings = {
    ...props.data,
    content: textContent.value,
    background: background.value,
    autoHeight: autoHeight.value
  };
  emit('save', settings);
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