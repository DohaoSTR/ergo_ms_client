<template>
  <div class="toast-container position-fixed">
    <TransitionGroup name="toast-list">
      <div
        v-for="toast in toasts"
        :key="toast.id"
        class="toast-item alert"
        :class="toastClasses(toast.type)"
        role="alert">
        <div class="toast-content">
          <component
            :is="getIcon(toast.type)"
            :size="20"
            class="toast-icon"
          />
          <span class="toast-message">{{ toast.message }}</span>
          <button
            class="toast-close"
            @click="removeToast(toast.id)">
            <X :size="16"/>
          </button>
        </div>
        <div
          class="toast-progress"
          :style="{ animationDuration: `${toast.duration}ms` }"
        />
      </div>
    </TransitionGroup>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { CircleCheck, CircleAlert, Bell, OctagonAlert, X } from 'lucide-vue-next'

const toasts = ref([])
let counter = 0

const TYPES = {
  success: {
    icon: CircleCheck,
    class: 'alert-success'  // Зеленый для успешных операций
  },
  error: {
    icon: OctagonAlert,
    class: 'alert-danger'  // Красный для ошибок
  },
  info: {
    icon: CircleAlert,
    class: 'alert-info'    // Голубой для информационных
  },
  primary: {
    icon: Bell,
    class: 'alert-info'    // Голубой для остальных
  }
}

const getIcon = (type) => TYPES[type]?.icon || CircleAlert

const toastClasses = (type) => {
  switch(type) {
    case 'success': return 'alert-success'
    case 'error': return 'alert-danger'
    default: return 'alert-info'
  }
}

const show = (message, type = 'success', duration = 3000) => {
  // Приводим тип к допустимым ('success', 'error', 'info', 'primary')
  if (!['success', 'error', 'info', 'primary'].includes(type)) {
    type = 'info';
  }
  // Приводим message к строке, даже если это объект или html
  let msg = message;
  if (typeof msg !== 'string') {
    if (msg && typeof msg.message === 'string') msg = msg.message;
    else if (Array.isArray(msg)) msg = msg.join(', ');
    else msg = 'Произошла ошибка';
  }
  const id = counter++
  const toast = { id, message: msg, type, duration }
  toasts.value.unshift(toast)
  setTimeout(() => removeToast(id), duration)
}

const removeToast = (id) => {
  const index = toasts.value.findIndex(t => t.id === id)
  if (index > -1) {
    toasts.value.splice(index, 1)
  }
}

defineExpose({ show })
</script>

<style scoped>
.toast-container {
  bottom: 20px;
  right: 20px;
  z-index: 9999;
  display: flex;
  flex-direction: column-reverse;
  gap: 10px;
  max-width: 400px;
  pointer-events: none;
}

.toast-item {
  pointer-events: auto;
  margin: 0;
  padding: 0;
  border: none;
  overflow: hidden;
}

.toast-content {
  display: flex;
  align-items: center;
  padding: 12px 16px;
  gap: 12px;
}

.toast-icon {
  flex-shrink: 0;
}

.toast-message {
  flex-grow: 1;
  font-size: 14px;
  line-height: 1.4;
}

.toast-close {
  background: transparent;
  border: none;
  padding: 4px;
  cursor: pointer;
  opacity: 0.6;
  transition: opacity 0.2s;
  color: inherit;
}

.toast-close:hover {
  opacity: 1;
}

.toast-progress {
  height: 2px;
  width: 100%;
  animation: progress linear forwards;
  transform-origin: left;
  background: currentColor;
  opacity: 0.3;
}

/* Анимации */
.toast-list-enter-active,
.toast-list-leave-active {
  transition: all 0.3s ease;
}

.toast-list-enter-from {
  opacity: 0;
  transform: translateY(100%);
}

.toast-list-leave-to {
  opacity: 0;
  transform: translateY(100%);
}

.toast-list-move {
  transition: transform 0.3s ease;
}

@keyframes progress {
  from { width: 100%; }
  to { width: 0%; }
}
</style>
