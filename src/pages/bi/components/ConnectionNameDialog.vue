<template>
  <div v-show="visible" class="modal-overlay">
    <div class="modal-window">
      <div class="modal-header">
        <h5 class="modal-title">Название подключения</h5>
        <button class="close-btn" @click="cancel">×</button>
      </div>

      <input v-model="localName" class="form-control my-3" placeholder="Введите название" @keyup.enter="submit" />
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
import { apiClient } from '@/js/api/manager'
import { endpoints } from '@/js/api/endpoints'

const props = defineProps({
  visible: Boolean,
  modelValue: String,
  connectorType: String,
  connectionConfig: Object,
  connectionFiles: {
    type: Array,
    default: () => []
  }
})

const emit = defineEmits(['update:visible', 'saved'])

const localName = ref(props.modelValue || '')
const error = ref('')

watch(() => props.modelValue, (newVal) => {
  localName.value = newVal || ''
})

function extractErrorMessage(err) {
  if (err.response && err.response.data) {
    const data = err.response.data
    if (typeof data === 'object') {
      return Object.values(data).flat().join(', ') || 'Неизвестная ошибка'
    }
    return String(data)
  }
  return err.message || 'Неизвестная ошибка'
}

async function submit() {
  if (!localName.value) return

  error.value = ''

  try {
    const isFileConnection = props.connectorType === undefined

    emit('saved', {
      name: localName.value,
      connector_type: isFileConnection ? 'file' : props.connectorType,
      config: isFileConnection ? { source: 'local_upload' } : (props.connectionConfig || {})
    })
    emit('update:visible', false)

  } catch (err) {
    console.error('Ошибка при сохранении подключения:', err.response?.data || err)
    error.value = 'Не удалось сохранить подключение'
  }
}

function cancel() {
  emit('update:visible', false)
}
</script>

<style scoped>
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