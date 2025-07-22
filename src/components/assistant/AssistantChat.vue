<template>
  <div v-if="isVisible" class="assistant-chat" :class="{ 'assistant-chat--visible': isVisible }">
    <div class="assistant-chat__header">
      <div class="assistant-chat__title">
        <Bot :size="20" class="me-2" />
        <span>AI Ассистент</span>
      </div>
    </div>

    <div ref="messagesContainer" class="assistant-chat__messages">
      <AssistantMessage v-for="message in messages" :key="message.id" :message="message" />

      <AssistantTyping v-if="isTyping" />
    </div>

    <div class="assistant-chat__input">
      <div class="input-group">
        <input
          v-model="inputMessage"
          type="text"
          class="form-control"
          placeholder="Спросите что-нибудь..."
          @keypress.enter="sendMessage"
          :disabled="isTyping"
        />
        <button
          class="btn btn-danger"
          @click="sendMessage"
          :disabled="!inputMessage.trim() || isTyping"
        >
          <Send :size="18" />
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, nextTick, defineEmits, watch } from 'vue'
import { Bot, Send } from 'lucide-vue-next'
import AssistantMessage from './AssistantMessage.vue'
import AssistantTyping from './AssistantTyping.vue'

const emit = defineEmits(['close', 'send-message'])

defineProps({
  isVisible: {
    type: Boolean,
    default: false,
  },
})

const messagesContainer = ref(null)
const inputMessage = ref('')
const isTyping = ref(false)

const messages = ref([
  {
    id: 1,
    type: 'assistant',
    content:
      'Привет! Я ваш AI ассистент. Могу помочь с навигацией по системе, объяснить как работают компоненты или ответить на вопросы.',
    timestamp: new Date(),
  },
])

const sendMessage = () => {
  if (!inputMessage.value.trim() || isTyping.value) return

  const userMessage = {
    id: Date.now(),
    type: 'user',
    content: inputMessage.value.trim(),
    timestamp: new Date(),
  }

  messages.value.push(userMessage)

  emit('send-message', inputMessage.value.trim())

  inputMessage.value = ''

  isTyping.value = true

  scrollToBottom()
}

const addAssistantMessage = (content) => {
  const assistantMessage = {
    id: Date.now(),
    type: 'assistant',
    content: content,
    timestamp: new Date(),
  }

  messages.value.push(assistantMessage)
  isTyping.value = false
  scrollToBottom()
}

const setTyping = (typing) => {
  isTyping.value = typing
}

const scrollToBottom = () => {
  nextTick(() => {
    if (messagesContainer.value) {
      messagesContainer.value.scrollTop = messagesContainer.value.scrollHeight
    }
  })
}

watch(
  () => messages.value.length,
  () => {
    scrollToBottom()
  },
)

defineExpose({
  addAssistantMessage,
  setTyping,
})
</script>

<style scoped>
.assistant-chat {
  position: absolute;
  bottom: 100%;
  left: 0;
  right: 0;
  width: auto;
  height: 400px;
  background: linear-gradient(145deg, #ffffff, #f8f9fa);
  border-radius: 12px;
  box-shadow:
    0 12px 40px rgba(220, 53, 69, 0.15),
    0 4px 12px rgba(0, 0, 0, 0.1);
  border: 2px solid rgba(220, 53, 69, 0.1);
  z-index: 9998;
  display: flex;
  flex-direction: column;
  transform: translateY(20px) scale(0.95);
  opacity: 0;
  transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
  backdrop-filter: blur(10px);
  margin-bottom: 10px;
}

.assistant-chat--visible {
  transform: translateY(0) scale(1);
  opacity: 1;
}

.assistant-chat__header {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 16px 20px;
  background: linear-gradient(135deg, #dc3545, #c82333);
  border-radius: 12px 12px 0 0;
  color: white;
}

.assistant-chat__title {
  display: flex;
  align-items: center;
  font-weight: 600;
  font-size: 14px;
}

.assistant-chat__messages {
  flex: 1;
  overflow-y: auto;
  padding: 16px;
  display: flex;
  flex-direction: column;
  gap: 12px;
  background: linear-gradient(to bottom, #ffffff, #f8f9fa);
}

.assistant-chat__messages::-webkit-scrollbar {
  width: 4px;
}

.assistant-chat__messages::-webkit-scrollbar-track {
  background: rgba(220, 53, 69, 0.1);
  border-radius: 2px;
}

.assistant-chat__messages::-webkit-scrollbar-thumb {
  background: linear-gradient(to bottom, #dc3545, #c82333);
  border-radius: 2px;
}

.assistant-chat__input {
  padding: 16px;
  border-top: 1px solid rgba(220, 53, 69, 0.1);
  background: linear-gradient(145deg, #f8f9fa, #ffffff);
  border-radius: 0 0 12px 12px;
}

.assistant-chat__input .form-control {
  border: 2px solid rgba(220, 53, 69, 0.2);
  border-right: none;
  border-radius: 8px 0 0 8px;
  padding: 10px 14px;
  transition: all 0.3s ease;
  font-size: 14px;
}

.assistant-chat__input .form-control:focus {
  box-shadow: 0 0 0 0.2rem rgba(220, 53, 69, 0.25);
  border-color: #dc3545;
}

.assistant-chat__input .btn {
  border-radius: 0 8px 8px 0;
  border: 2px solid #dc3545;
  padding: 10px 16px;
  transition: all 0.3s ease;
}

.assistant-chat__input .btn:hover {
  background: linear-gradient(135deg, #e74c3c, #dc3545);
  transform: scale(1.02);
}

@media (max-width: 1200px) {
  .assistant-chat {
    position: fixed;
    bottom: 20px;
    left: 20px;
    right: 20px;
    width: auto;
    height: 400px;
    margin-bottom: 0;
  }
}
</style>
