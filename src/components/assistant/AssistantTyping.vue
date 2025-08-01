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
  gap: 12px;
}

.assistant-typing__avatar {
  width: 36px;
  height: 36px;
  border-radius: 50%;
  background: linear-gradient(135deg, #28a745, #1e7e34);
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  margin-top: 2px;
  box-shadow: 0 2px 8px rgba(40, 167, 69, 0.2);
}

.assistant-typing__content {
  flex: 1;
}

.assistant-typing__text {
  background: linear-gradient(145deg, #ffffff, #f8f9fa);
  border: 1px solid rgba(220, 53, 69, 0.1);
  padding: 14px 18px;
  border-radius: 6px 20px 20px 20px;
  display: inline-block;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.08);
}

.assistant-typing__dots {
  display: flex;
  gap: 6px;
  align-items: center;
}

.assistant-typing__dots span {
  width: 10px;
  height: 10px;
  background: linear-gradient(135deg, #dc3545, #c82333);
  border-radius: 50%;
  animation: typingDots 1.4s infinite ease-in-out;
  box-shadow: 0 1px 3px rgba(220, 53, 69, 0.3);
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

@keyframes typingDots {
  0%,
  60%,
  100% {
    transform: scale(1);
    opacity: 0.5;
  }
  30% {
    transform: scale(1.3);
    opacity: 1;
  }
}

@media (max-width: 480px) {
  .assistant-typing__avatar {
    width: 32px;
    height: 32px;
  }

  .assistant-typing__text {
    padding: 12px 16px;
  }

  .assistant-typing__dots span {
    width: 8px;
    height: 8px;
  }
}
</style>
