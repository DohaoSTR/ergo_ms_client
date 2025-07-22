<template>
  <div class="assistant-message" :class="`assistant-message--${message.type}`">
    <div class="assistant-message__avatar">
      <User v-if="message.type === 'user'" :size="16" />
      <Bot v-else :size="16" />
    </div>

    <div class="assistant-message__content">
      <div class="assistant-message__text">
        {{ message.content }}
      </div>
      <div class="assistant-message__time">
        {{ formatTime(message.timestamp) }}
      </div>
    </div>
  </div>
</template>

<script setup>
import { User, Bot } from 'lucide-vue-next'

defineProps({
  message: {
    type: Object,
    required: true,
  },
})

const formatTime = (timestamp) => {
  return new Date(timestamp).toLocaleTimeString('ru-RU', {
    hour: '2-digit',
    minute: '2-digit',
  })
}
</script>

<style scoped>
.assistant-message {
  display: flex;
  gap: 12px;
  animation: slideInMessage 0.4s cubic-bezier(0.4, 0, 0.2, 1);
}

.assistant-message--user {
  flex-direction: row-reverse;
}

.assistant-message__avatar {
  width: 36px;
  height: 36px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  margin-top: 2px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.assistant-message--user .assistant-message__avatar {
  background: linear-gradient(135deg, #dc3545, #c82333);
  color: white;
}

.assistant-message--assistant .assistant-message__avatar {
  background: linear-gradient(135deg, #28a745, #1e7e34);
  color: white;
}

.assistant-message__content {
  flex: 1;
  max-width: calc(100% - 48px);
}

.assistant-message__text {
  padding: 14px 18px;
  word-wrap: break-word;
  line-height: 1.5;
  font-size: 14px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.08);
  transition: all 0.3s ease;
}

.assistant-message--user .assistant-message__text {
  background: linear-gradient(135deg, #dc3545, #c82333);
  color: white;
  border-radius: 20px 6px 20px 20px;
}

.assistant-message--assistant .assistant-message__text {
  background: linear-gradient(145deg, #ffffff, #f8f9fa);
  color: #495057;
  border-radius: 6px 20px 20px 20px;
  border: 1px solid rgba(220, 53, 69, 0.1);
}

.assistant-message__text:hover {
  transform: translateY(-1px);
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.12);
}

.assistant-message__time {
  font-size: 12px;
  color: #6c757d;
  margin-top: 6px;
  padding: 0 6px;
  font-weight: 500;
}

.assistant-message--user .assistant-message__time {
  text-align: right;
}

@keyframes slideInMessage {
  from {
    opacity: 0;
    transform: translateY(15px) scale(0.95);
  }
  to {
    opacity: 1;
    transform: translateY(0) scale(1);
  }
}

@media (max-width: 480px) {
  .assistant-message__content {
    max-width: calc(100% - 42px);
  }

  .assistant-message__avatar {
    width: 32px;
    height: 32px;
  }

  .assistant-message__text {
    padding: 12px 16px;
    font-size: 13px;
  }
}
</style>
