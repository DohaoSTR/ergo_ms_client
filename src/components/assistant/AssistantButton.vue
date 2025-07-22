<template>
  <div
    class="assistant-button"
    :class="{ 'assistant-button--active': isActive, 'assistant-button--pulse': isPulsing }"
    @click="toggleChat"
  >
    <MessageCircle :size="24" class="assistant-button__icon" />
    <div v-if="hasNewMessage" class="assistant-button__notification"></div>
  </div>
</template>

<script setup>
import { ref, defineEmits } from 'vue'
import { MessageCircle } from 'lucide-vue-next'

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
  right: 20px;
  width: 60px;
  height: 60px;
  background: linear-gradient(135deg, #007bff, #0056b3);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  z-index: 1001;
  box-shadow: 0 4px 12px rgba(0, 123, 255, 0.3);
  transition: all 0.3s ease;
  border: 3px solid #fff;
}

.assistant-button:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 20px rgba(0, 123, 255, 0.4);
}

.assistant-button--active {
  background: linear-gradient(135deg, #28a745, #1e7e34);
  box-shadow: 0 4px 12px rgba(40, 167, 69, 0.3);
}

.assistant-button--pulse {
  animation: pulse 1.5s infinite;
}

.assistant-button__icon {
  color: white;
  transition: transform 0.3s ease;
}

.assistant-button:hover .assistant-button__icon {
  transform: scale(1.1);
}

.assistant-button__notification {
  position: absolute;
  top: -2px;
  right: -2px;
  width: 16px;
  height: 16px;
  background: #dc3545;
  border-radius: 50%;
  border: 2px solid white;
  animation: bounce 2s infinite;
}

@keyframes pulse {
  0% {
    box-shadow:
      0 4px 12px rgba(0, 123, 255, 0.3),
      0 0 0 0 rgba(0, 123, 255, 0.7);
  }
  70% {
    box-shadow:
      0 4px 12px rgba(0, 123, 255, 0.3),
      0 0 0 10px rgba(0, 123, 255, 0);
  }
  100% {
    box-shadow:
      0 4px 12px rgba(0, 123, 255, 0.3),
      0 0 0 0 rgba(0, 123, 255, 0);
  }
}

@keyframes bounce {
  0%,
  20%,
  50%,
  80%,
  100% {
    transform: translateY(0);
  }
  40% {
    transform: translateY(-3px);
  }
  60% {
    transform: translateY(-1px);
  }
}

@media (max-width: 768px) {
  .assistant-button {
    width: 50px;
    height: 50px;
    bottom: 15px;
    right: 15px;
  }

  .assistant-button__icon {
    width: 20px;
    height: 20px;
  }
}
</style>
