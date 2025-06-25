<template>
  <div v-if="show" class="modal fade show d-block" tabindex="-1">
    <div class="modal-dialog" :class="sizeClass">
      <div class="modal-content">
        <div class="modal-header">
          <h5 class="modal-title d-flex align-items-center gap-2">
            <component v-if="icon" :is="icon" :size="20" :class="iconClass" />
            {{ title }}
          </h5>
          <button type="button" class="btn-close" @click="$emit('close')"></button>
        </div>
        <div class="modal-body">
          <slot />
        </div>
        <div class="modal-footer">
          <button
            type="button"
            class="btn btn-secondary"
            @click="$emit('close')"
            :disabled="loading"
          >
            Отмена
          </button>
          <button
            type="button"
            :class="confirmButtonClass"
            @click="$emit('confirm')"
            :disabled="loading"
          >
            <span v-if="loading" class="spinner-border spinner-border-sm me-2" role="status"></span>
            {{ confirmText }}
          </button>
        </div>
      </div>
    </div>
  </div>
  <div v-if="show" class="modal-backdrop fade show"></div>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({
  show: {
    type: Boolean,
    default: false
  },
  title: {
    type: String,
    required: true
  },
  icon: {
    type: [Object, Function],
    default: null
  },
  iconClass: {
    type: String,
    default: ''
  },
  size: {
    type: String,
    default: 'md',
    validator: (value) => ['sm', 'md', 'lg', 'xl'].includes(value)
  },
  confirmText: {
    type: String,
    default: 'Сохранить'
  },
  confirmVariant: {
    type: String,
    default: 'primary',
    validator: (value) => ['primary', 'success', 'info', 'warning', 'danger'].includes(value)
  },
  loading: {
    type: Boolean,
    default: false
  }
})

defineEmits(['close', 'confirm'])

const sizeClass = computed(() => {
  const sizes = {
    sm: 'modal-sm',
    md: '',
    lg: 'modal-lg',
    xl: 'modal-xl'
  }
  return sizes[props.size]
})

const confirmButtonClass = computed(() => `btn btn-${props.confirmVariant}`)
</script>

<style scoped>
.modal-backdrop {
  background-color: rgba(0, 0, 0, 0.5);
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  z-index: 1040;
}

.modal {
  z-index: 1050;
}

.modal.show {
  display: block !important;
}

.modal-xl {
  max-width: 1140px;
  width: 90vw;
}

@media (max-width: 768px) {
  .modal-xl {
    width: 95vw;
    margin: 0.5rem auto;
  }
}
</style> 