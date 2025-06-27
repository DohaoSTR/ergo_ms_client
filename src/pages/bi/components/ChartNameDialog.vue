<template>
  <div v-show="visible" class="modal-overlay">
    <div class="modal-window">
      <div class="modal-header">
        <h5 class="modal-title">Название графика</h5>
        <button class="close-btn" @click="cancel">×</button>
      </div>

      <input
        v-model="localName"
        class="form-control my-3"
        placeholder="Введите название графика"
        @keyup.enter="submit"
      />
      <textarea
        v-model="localDesc"
        class="form-control"
        rows="2"
        placeholder="Описание (необязательно)"
        style="margin-bottom: 10px;"
      />
      <div class="modal-footer">
        <button class="btn btn-secondary" @click="cancel">Отмена</button>
        <button class="btn btn-primary" @click="submit" :disabled="!localName">
          Сохранить
        </button>
      </div>
      <div v-if="error" class="text-danger mt-2">{{ error }}</div>
    </div>
  </div>
</template>

<script setup>
import { ref, watch } from 'vue'

const props = defineProps({
  visible: Boolean,
  modelValue: String,
  desc: String
})
const emit = defineEmits(['update:visible', 'saved', 'update:modelValue'])

const localName = ref(props.modelValue || '')
const localDesc = ref(props.desc || '')
const error = ref('')

watch(() => props.modelValue, (newVal) => {
  localName.value = newVal || ''
})
watch(() => props.desc, (newVal) => {
  localDesc.value = newVal || ''
})

function submit() {
  if (!localName.value) return
  error.value = ''
  emit('saved', { name: localName.value, description: localDesc.value })
  emit('update:visible', false)
}
function cancel() {
  emit('update:visible', false)
}
</script>

<style scoped lang="scss">
.modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.6);
  z-index: 9999;
  display: flex;
  justify-content: center;
  align-items: center;
}

.modal-window {
  background: var(--color-primary-background);
  color: var(--color-primary-text);
  padding: 24px;
  border-radius: 12px;
  width: 480px;
  max-width: 90%;
  box-shadow: 0 10px 25px rgba(0, 0, 0, 0.3);
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1rem;
}

.close-btn {
  background: none;
  border: none;
  font-size: 1.5rem;
  color: var(--color-secondary-text);
  cursor: pointer;
}

.modal-footer {
  display: flex;
  justify-content: flex-end;
  gap: 1rem;
  margin-top: 1rem;
}

.btn-secondary:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}
</style>
