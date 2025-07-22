<template>
  <div class="assistant-typing">
    <div class="assistant-typing__avatar">
      <Bot :size="16" />
    </div>

    <div class="assistant-typing__content">
      <div class="assistant-typing__text">
        <div class="assistant-typing__dots">
          <span></span>
          <span></span>
          <span></span>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { Bot } from 'lucide-vue-next'
</script>

<style scoped>
.assistant-typing {
  display: flex;
  gap: 8px;
  animation: slideIn 0.3s ease-out;
}

.assistant-typing__avatar {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  background: linear-gradient(135deg, #28a745, #1e7e34);
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  margin-top: 4px;
}

.assistant-typing__content {
  flex: 1;
}

.assistant-typing__text {
  background: #f8f9fa;
  border: 1px solid #e9ecef;
  padding: 12px 16px;
  border-radius: 4px 18px 18px 18px;
  display: inline-block;
}

.assistant-typing__dots {
  display: flex;
  gap: 4px;
  align-items: center;
}

.assistant-typing__dots span {
  width: 8px;
  height: 8px;
  background: #6c757d;
  border-radius: 50%;
  animation: typing 1.4s infinite ease-in-out;
}

.assistant-typing__dots span:nth-child(1) {
  animation-delay: 0s;
}

.assistant-typing__dots span:nth-child(2) {
  animation-delay: 0.2s;
}

.assistant-typing__dots span:nth-child(3) {
  animation-delay: 0.4s;
}

@keyframes typing {
  0%,
  60%,
  100% {
    transform: scale(1);
    opacity: 0.5;
  }
  30% {
    transform: scale(1.2);
    opacity: 1;
  }
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
  .assistant-typing__avatar {
    width: 28px;
    height: 28px;
  }

  .assistant-typing__text {
    padding: 10px 14px;
  }

  .assistant-typing__dots span {
    width: 6px;
    height: 6px;
  }
}
</style>
