<script setup>
import { CheckCircle, AlertCircle, AlertTriangle, Info, X } from 'lucide-vue-next'
import { ref, onMounted, watch } from 'vue'

const props = defineProps({
  show: { type: Boolean, default: false },
  message: { type: String, required: true },
  type: { 
    type: String, 
    default: 'success', 
    validator: (value) => ['success', 'error', 'warning', 'info'].includes(value) 
  },
  duration: { type: Number, default: 3000 },
  closable: { type: Boolean, default: true }
})

const emit = defineEmits(['close'])

const visible = ref(false)
const timer = ref(null)

const iconMap = {
  success: CheckCircle,
  error: AlertCircle,
  warning: AlertTriangle,
  info: Info
}

const colorMap = {
  success: 'text-success',
  error: 'text-danger',
  warning: 'text-warning',
  info: 'text-info'
}

const bgMap = {
  success: 'alert-success',
  error: 'alert-danger',
  warning: 'alert-warning',
  info: 'alert-info'
}

function close() {
  visible.value = false
  if (timer.value) {
    clearTimeout(timer.value)
    timer.value = null
  }
  setTimeout(() => emit('close'), 300) // Ждем анимацию
}

function startTimer() {
  if (props.duration > 0) {
    timer.value = setTimeout(close, props.duration)
  }
}

watch(() => props.show, (newVal) => {
  if (newVal) {
    visible.value = true
    startTimer()
  } else {
    close()
  }
}, { immediate: true })

onMounted(() => {
  if (props.show) {
    visible.value = true
    startTimer()
  }
})
</script>

<template>
  <Transition
    enter-active-class="toast-enter-active"
    enter-from-class="toast-enter-from"
    leave-active-class="toast-leave-active"
    leave-to-class="toast-leave-to"
  >
    <div 
      v-if="visible"
      :class="`alert ${bgMap[type]} d-flex align-items-center position-fixed toast-notification`"
      role="alert"
    >
      <component :is="iconMap[type]" :size="20" :class="colorMap[type]" class="me-2" />
      <div class="flex-grow-1">{{ message }}</div>
      <button 
        v-if="closable"
        type="button" 
        class="btn-close btn-close-sm ms-2" 
        @click="close"
        style="font-size: 0.75rem;"
      ></button>
    </div>
  </Transition>
</template>

<style scoped>
.toast-notification {
  min-width: 300px;
  max-width: 400px;
  border: none;
  border-radius: 8px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}

.toast-enter-active,
.toast-leave-active {
  transition: all 0.3s ease;
}

.toast-enter-from {
  opacity: 0;
  transform: translateX(100%);
}

.toast-leave-to {
  opacity: 0;
  transform: translateX(100%);
}

.btn-close {
  margin: 0;
  padding: 0.25rem;
}

.btn-close:focus {
  box-shadow: none;
}
</style> 