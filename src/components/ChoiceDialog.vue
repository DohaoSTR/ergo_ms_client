<script setup>
import { AlertTriangle, Trash2, X } from 'lucide-vue-next'

const props = defineProps({
  show: { type: Boolean, default: false },
  title: { type: String, default: 'Выберите действие' },
  message: { type: String, default: '' },
  choices: { 
    type: Array, 
    default: () => [],
    validator: (choices) => choices.length === 0 || choices.every(choice => 
      choice.label && choice.value && choice.variant
    )
  },
  loading: { type: Boolean, default: false }
})

const emit = defineEmits(['choice', 'cancel', 'close'])

function handleChoice(choice) {
  if (!props.loading) {
    emit('choice', choice.value)
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

function getButtonClass(variant) {
  const baseClass = 'btn'
  switch (variant) {
    case 'danger': return `${baseClass} btn-danger`
    case 'warning': return `${baseClass} btn-warning`
    case 'primary': return `${baseClass} btn-primary`
    case 'secondary': return `${baseClass} btn-secondary`
    default: return `${baseClass} btn-secondary`
  }
}
</script>

<template>
  <div 
    v-if="show && message && choices.length > 0" 
    class="modal fade show d-block" 
    tabindex="-1"
    style="background-color: rgba(0, 0, 0, 0.5);"
  >
    <div class="modal-dialog modal-dialog-centered">
      <div class="modal-content">
        <div class="modal-header border-0 pb-0">
          <div class="d-flex align-items-center gap-2">
            <AlertTriangle :size="24" class="text-warning" />
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
          <p class="mb-3">{{ message }}</p>
          
          <div class="d-grid gap-2">
            <button
              v-for="choice in choices"
              :key="choice.value"
              :class="getButtonClass(choice.variant)"
              @click="handleChoice(choice)"
              :disabled="loading"
            >
              <span 
                v-if="loading" 
                class="spinner-border spinner-border-sm me-2" 
                role="status"
              ></span>
              <component 
                v-if="choice.icon" 
                :is="choice.icon" 
                :size="16" 
                class="me-2" 
              />
              {{ choice.label }}
            </button>
          </div>
        </div>
        
        <div class="modal-footer border-0 pt-2">
          <button 
            type="button" 
            class="btn btn-secondary" 
            @click="handleCancel"
            :disabled="loading"
          >
            <X :size="16" class="me-2" />
            Отмена
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
  display: flex;
  align-items: center;
  justify-content: center;
}

.btn-close:focus {
  box-shadow: none;
}

.d-grid .btn {
  width: 100%;
}
</style> 