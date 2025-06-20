<script setup>
import { AlertTriangle, Check, X } from 'lucide-vue-next'

const props = defineProps({
  show: { type: Boolean, default: false },
  title: { type: String, default: 'Подтверждение' },
  message: { type: String, required: true },
  confirmText: { type: String, default: 'Удалить' },
  cancelText: { type: String, default: 'Отмена' },
  variant: { type: String, default: 'danger', validator: (value) => ['danger', 'warning', 'primary'].includes(value) },
  loading: { type: Boolean, default: false }
})

const emit = defineEmits(['confirm', 'cancel', 'close'])

function handleConfirm() {
  if (!props.loading) {
    emit('confirm')
  }
}

function handleCancel() {
  if (!props.loading) {
    emit('cancel')
    emit('close')
  }
}

function handleClose() {
  if (!props.loading) {
    emit('close')
  }
}
</script>

<template>
  <div 
    v-if="show" 
    class="modal fade show d-block" 
    tabindex="-1"
    style="background-color: rgba(0, 0, 0, 0.5);"
  >
    <div class="modal-dialog modal-dialog-centered">
      <div class="modal-content">
        <div class="modal-header border-0 pb-0">
          <div class="d-flex align-items-center gap-2">
            <AlertTriangle 
              v-if="variant === 'danger' || variant === 'warning'" 
              :size="24" 
              :class="variant === 'danger' ? 'text-danger' : 'text-warning'" 
            />
            <h5 class="modal-title mb-0">{{ title }}</h5>
          </div>
          <button 
            type="button" 
            class="btn-close" 
            @click="handleClose"
            :disabled="loading"
          ></button>
        </div>
        
        <div class="modal-body pt-2">
          <p class="mb-0">{{ message }}</p>
        </div>
        
        <div class="modal-footer border-0 pt-2">
          <button 
            type="button" 
            class="btn btn-secondary" 
            @click="handleCancel"
            :disabled="loading"
          >
            {{ cancelText }}
          </button>
          <button 
            type="button" 
            :class="`btn btn-${variant === 'primary' ? 'primary' : 'danger'}`"
            @click="handleConfirm"
            :disabled="loading"
          >
            <span 
              v-if="loading" 
              class="spinner-border spinner-border-sm me-2" 
              role="status"
            ></span>
            {{ confirmText }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.modal-content {
  border: none;
  border-radius: 12px;
  box-shadow: 0 10px 40px rgba(0, 0, 0, 0.2);
}

.modal-header, .modal-footer {
  padding: 1.5rem;
}

.modal-body {
  padding: 0 1.5rem 1rem;
  color: #6c757d;
}

.btn {
  border-radius: 8px;
  font-weight: 500;
}

.btn-close:focus {
  box-shadow: none;
}
</style> 