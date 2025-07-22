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
  gap: 8px;
  animation: slideIn 0.3s ease-out;
}

.assistant-message--user {
  flex-direction: row-reverse;
}

.assistant-message__avatar {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  margin-top: 4px;
}

.assistant-message--user .assistant-message__avatar {
  background: linear-gradient(135deg, #007bff, #0056b3);
  color: white;
}

.assistant-message--assistant .assistant-message__avatar {
  background: linear-gradient(135deg, #28a745, #1e7e34);
  color: white;
}

.assistant-message__content {
  flex: 1;
  max-width: calc(100% - 40px);
}

.assistant-message__text {
  background: #f8f9fa;
  padding: 12px 16px;
  border-radius: 18px;
  word-wrap: break-word;
  line-height: 1.4;
  color: #495057;
}

.assistant-message--user .assistant-message__text {
  background: linear-gradient(135deg, #007bff, #0056b3);
  color: white;
  border-radius: 18px 4px 18px 18px;
}

.assistant-message--assistant .assistant-message__text {
  background: #f8f9fa;
  border-radius: 4px 18px 18px 18px;
  border: 1px solid #e9ecef;
}

.assistant-message__time {
  font-size: 0.75rem;
  color: #6c757d;
  margin-top: 4px;
  padding: 0 4px;
}

.assistant-message--user .assistant-message__time {
  text-align: right;
}

@keyframes slideIn {
  from {
    opacity: 0;
    transform: translateY(10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@media (max-width: 480px) {
  .assistant-message__content {
    max-width: calc(100% - 35px);
  }

  .assistant-message__avatar {
    width: 28px;
    height: 28px;
  }

  .assistant-message__text {
    padding: 10px 14px;
    font-size: 0.9rem;
  }
}
</style>
