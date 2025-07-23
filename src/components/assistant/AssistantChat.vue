<template>
  <div v-if="isVisible" class="assistant-chat" :class="{ 'assistant-chat--visible': isVisible }">
    <div class="assistant-chat__header">
      <div class="assistant-chat__title">
        <Bot :size="20" class="me-2" />
        <span>AI Ассистент</span>
      </div>
    </div>

    <div ref="messagesContainer" class="assistant-chat__messages">
      <transition-group name="message" tag="div" class="messages-container">
        <AssistantMessage
          v-for="message in messages"
          :key="message.id"
          :message="message"
          class="message-item"
        />
      </transition-group>

      <transition name="typing" mode="out-in">
        <AssistantTyping v-if="isTyping" class="typing-indicator" />
      </transition>
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
          class="btn btn-danger send-button"
          @click="sendMessage"
          :disabled="!inputMessage.trim() || isTyping"
          :class="{ sending: isTyping }"
        >
          <transition name="button-icon" mode="out-in">
            <div v-if="isTyping" class="spinner">
              <div class="spinner-dot"></div>
              <div class="spinner-dot"></div>
              <div class="spinner-dot"></div>
            </div>
            <Send v-else :size="18" />
          </transition>
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

const emit = defineEmits(['close', 'send-message', 'recheck-llm'])

const { isVisible } = defineProps({
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

const addMessage = (content, type = 'user') => {
  const newMessage = {
    id: Date.now(),
    type: type,
    content: content,
    timestamp: new Date(),
  }
  messages.value.push(newMessage)
  scrollToBottom()
}

const addAssistantMessage = (content) => {
  addMessage(content, 'assistant')
  isTyping.value = false
}

const sendMessage = () => {
  if (!inputMessage.value.trim() || isTyping.value) return

  emit('send-message', inputMessage.value.trim())
  addMessage(inputMessage.value.trim(), 'user')
  inputMessage.value = ''
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
  background: #ffffff;
  border-radius: 12px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15);
  z-index: 9998;
  display: flex;
  flex-direction: column;
  margin-bottom: 15px;
  overflow: hidden;
  opacity: 0;
  transition: opacity 0.3s ease;
}

.assistant-chat--visible {
  opacity: 1;
}

.assistant-chat__header {
  display: flex;
  align-items: center;
  justify-content: flex-start;
  padding: 16px 20px;
  background: linear-gradient(135deg, #dc3545, #c82333);
  color: white;
}

.assistant-chat__title {
  display: flex;
  align-items: center;
  gap: 8px;
  font-weight: 600;
  font-size: 16px;
}

.assistant-chat__messages {
  flex: 1;
  overflow-y: auto;
  padding: 20px;
  background: #f8f9fa;
}

.messages-container {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.assistant-chat__messages::-webkit-scrollbar {
  width: 6px;
}

.assistant-chat__messages::-webkit-scrollbar-track {
  background: rgba(220, 53, 69, 0.1);
  border-radius: 3px;
}

.assistant-chat__messages::-webkit-scrollbar-thumb {
  background: #dc3545;
  border-radius: 3px;
}

.assistant-chat__input {
  padding: 20px;
  border-top: 1px solid rgba(220, 53, 69, 0.1);
  background: #ffffff;
}

.assistant-chat__input .input-group {
  border-radius: 8px;
  overflow: hidden;
}

.assistant-chat__input .form-control {
  border: 2px solid rgba(220, 53, 69, 0.2);
  border-right: none;
  border-radius: 8px 0 0 8px;
  padding: 12px 16px;
  font-size: 14px;
  background: #ffffff;
}

.assistant-chat__input .form-control:focus {
  border-color: #dc3545;
  box-shadow: none;
}

.send-button {
  border-radius: 0 8px 8px 0;
  border: 2px solid #dc3545;
  padding: 12px 20px;
  background: #dc3545;
  color: white;
}

.send-button:hover {
  background: #c82333;
  border-color: #c82333;
}

.send-button:disabled {
  background: #6c757d;
  border-color: #6c757d;
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
