<template>
  <div
    class="assistant-button"
    :class="{ 'assistant-button--active': isActive, 'assistant-button--pulse': isPulsing }"
    @click="toggleChat"
  >
    <Bot :size="24" class="assistant-button__icon" />
    <div v-if="hasNewMessage" class="assistant-button__notification"></div>
  </div>
</template>

<script setup>
import { ref, defineEmits } from 'vue'
import { Bot } from 'lucide-vue-next'

const emit = defineEmits(['toggle-chat'])

const isActive = ref(false)
const isPulsing = ref(false)
const hasNewMessage = ref(false)

const toggleChat = () => {
  isActive.value = !isActive.value
  emit('toggle-chat', isActive.value)
}

const startPulsing = () => {
  isPulsing.value = true
}

const stopPulsing = () => {
  isPulsing.value = false
}

const showNotification = () => {
  hasNewMessage.value = true
}

const hideNotification = () => {
  hasNewMessage.value = false
}

defineExpose({
  startPulsing,
  stopPulsing,
  showNotification,
  hideNotification,
})
</script>

<style scoped>
.assistant-button {
  position: fixed;
  bottom: 20px;
  left: 20px;
  width: 60px;
  height: 60px;
  background: linear-gradient(135deg, #dc3545, #c82333);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  z-index: 9999;
  box-shadow: 0 4px 15px rgba(220, 53, 69, 0.3);
  border: 3px solid white;
}

.assistant-button:hover {
  background: linear-gradient(135deg, #e74c3c, #dc3545);
}

.assistant-button--active {
  background: linear-gradient(135deg, #28a745, #1e7e34);
}

.assistant-button--pulse {
  animation: pulseRed 1.5s infinite;
}

.assistant-button__icon {
  color: white;
}

.assistant-button__notification {
  position: absolute;
  top: -3px;
  right: -3px;
  width: 18px;
  height: 18px;
  background: linear-gradient(135deg, #ffc107, #e0a800);
  border-radius: 50%;
  border: 2px solid white;
}

@keyframes pulseRed {
  0% {
    box-shadow:
      0 4px 15px rgba(220, 53, 69, 0.3),
      0 0 0 0 rgba(220, 53, 69, 0.7);
  }
  70% {
    box-shadow:
      0 4px 15px rgba(220, 53, 69, 0.3),
      0 0 0 15px rgba(220, 53, 69, 0);
  }
  100% {
    box-shadow:
      0 4px 15px rgba(220, 53, 69, 0.3),
      0 0 0 0 rgba(220, 53, 69, 0);
  }
}

@media (max-width: 768px) {
  .assistant-button {
    width: 55px;
    height: 55px;
    bottom: 15px;
    left: 15px;
  }

  .assistant-button__icon {
    width: 22px;
    height: 22px;
  }
}
</style>
