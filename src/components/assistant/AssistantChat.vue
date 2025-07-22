<template>
  <div v-if="isVisible" class="assistant-chat" :class="{ 'assistant-chat--visible': isVisible }">
    <div class="assistant-chat__header">
      <div class="assistant-chat__title">
        <Bot :size="20" class="me-2" />
        <span>AI Ассистент</span>
      </div>
      <button class="btn btn-link p-0 assistant-chat__close" @click="closeChat">
        <X :size="20" />
      </button>
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
          class="btn btn-primary"
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
import { Bot, X, Send } from 'lucide-vue-next'
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

const closeChat = () => {
  emit('close')
}

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
  setTyping: (typing) => {
    isTyping.value = typing
  },
})
</script>

<style scoped>
.assistant-chat {
  position: fixed;
  bottom: 90px;
  right: 20px;
  width: 380px;
  height: 500px;
  background: white;
  border-radius: 16px 16px 16px 4px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.15);
  border: 1px solid #e9ecef;
  z-index: 1000;
  display: flex;
  flex-direction: column;
  transform: translateY(20px) scale(0.95);
  opacity: 0;
  transition: all 0.3s ease;
}

.assistant-chat--visible {
  transform: translateY(0) scale(1);
  opacity: 1;
}

.assistant-chat__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px 20px;
  border-bottom: 1px solid #e9ecef;
  background: linear-gradient(135deg, #f8f9fa, #e9ecef);
  border-radius: 16px 16px 0 0;
}

.assistant-chat__title {
  display: flex;
  align-items: center;
  font-weight: 600;
  color: #495057;
}

.assistant-chat__close {
  color: #6c757d;
  transition: color 0.2s ease;
}

.assistant-chat__close:hover {
  color: #495057;
}

.assistant-chat__messages {
  flex: 1;
  overflow-y: auto;
  padding: 16px;
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.assistant-chat__messages::-webkit-scrollbar {
  width: 4px;
}

.assistant-chat__messages::-webkit-scrollbar-track {
  background: #f1f3f4;
}

.assistant-chat__messages::-webkit-scrollbar-thumb {
  background: #c1c1c1;
  border-radius: 2px;
}

.assistant-chat__input {
  padding: 16px;
  border-top: 1px solid #e9ecef;
  background: #f8f9fa;
  border-radius: 0 0 16px 4px;
}

.assistant-chat__input .form-control {
  border: 1px solid #ced4da;
  border-right: none;
  border-radius: 8px 0 0 8px;
}

.assistant-chat__input .form-control:focus {
  box-shadow: 0 0 0 0.2rem rgba(0, 123, 255, 0.25);
  border-color: #007bff;
}

.assistant-chat__input .btn {
  border-radius: 0 8px 8px 0;
  border: 1px solid #007bff;
}

@media (max-width: 768px) {
  .assistant-chat {
    right: 15px;
    left: 15px;
    width: auto;
    bottom: 75px;
    height: 400px;
  }
}

@media (max-width: 480px) {
  .assistant-chat {
    height: 350px;
    bottom: 70px;
  }
}
</style>
