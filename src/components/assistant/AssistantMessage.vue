<template>
  <div class="assistant-message" :class="`assistant-message--${message.type}`">
    <div class="assistant-message__avatar">
      <User v-if="message.type === 'user'" :size="32" />
      <img v-else src="@/components/assistant/assets/bot_logo.png" alt="Bot" class="bot-logo" />
    </div>

    <div class="assistant-message__content">
      <div class="assistant-message__text" v-html="formatMessage(message.content)"></div>
      <div class="assistant-message__time">
        {{ formatTime(message.timestamp) }}
      </div>
    </div>
  </div>
</template>

<script setup>
import { User } from 'lucide-vue-next'

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

const formatMessage = (content) => {
  // Простое форматирование markdown-подобного текста
  return content
    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.*?)\*/g, '<em>$1</em>')
    .replace(/`(.*?)`/g, '<code>$1</code>')
    .replace(/\n/g, '<br>')
}
</script>

<style scoped>
.assistant-message {
  display: flex;
  gap: 12px;
}

.assistant-message--user {
  flex-direction: row-reverse;
}

.assistant-message__avatar {
  width: 50px;
  height: 50px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  margin-top: 2px;
  color: white;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.assistant-message--user .assistant-message__avatar {
  background: linear-gradient(135deg, #dc3545, #c82333);
}

.assistant-message--assistant .assistant-message__avatar {
  background: transparent;
}

.bot-logo {
  width: 50px;
  height: 50px;
  object-fit: contain;
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
