<template>
  <div class="choice-role">
    <!-- Пузыри поверх всего -->
    <div class="bubbles">
      <span
        v-for="(bubble, index) in bubblesData"
        :key="index"
        class="bubble"
        :style="{
          left: bubble.left + '%',
          top: bubble.top + 'px',
          width: bubble.size + 'px',
          height: bubble.size + 'px',
          animationDuration: bubble.duration + 's',
          animationDelay: bubble.delay + 's'
        }"
      ></span>
    </div>

    <!-- Основной контент -->
    <div class="container mt-5 position-relative content">
      <h1 class="text-center mb-4">Система подбора вакансий</h1>
      <div class="row justify-content-center gy-4">
        <div class="col-12 col-md-5">
          <div
            class="card shadow-sm pointer"
            @click="goStudentRegister"
          >
            <div class="card-body d-flex flex-column align-items-center">
              <user-icon class="mb-3" size="48" color="#007bff" />
              <h2 class="card-title mb-0 text-center">
                Студент/Выпускник
              </h2>
            </div>
          </div>
        </div>
        <div class="col-12 col-md-5">
          <div
            class="card shadow-sm pointer"
            @click="goEmployerRegister"
          >
            <div class="card-body d-flex flex-column align-items-center">
              <briefcase-icon class="mb-3" size="48" color="#28a745" />
              <h2 class="card-title mb-0 text-center">
                Работодатель
              </h2>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { User as UserIcon, Briefcase as BriefcaseIcon } from 'lucide-vue-next'

export default {
  name: 'ChoiceRole',
  components: {
    UserIcon,
    BriefcaseIcon
  },
  data() {
    return {
      bubblesData: Array.from({ length: 50 }, () => ({
        left: Math.random() * 100,
        top: -100 - Math.random() * 100,
        size: 50 + Math.random() * 60,
        duration: 8 + Math.random() * 8,
        delay: Math.random() * 5
      }))
    }
  },
  methods: {
    goStudentRegister() {
      this.$router.push({ name: 'StudentRegister' })
    },
    goEmployerRegister() {
      this.$router.push({ name: 'CompanyRegister' })
    }
  }
}
</script>

<style scoped>
.choice-role {
  position: relative;
  overflow: hidden;
  min-height: 100vh;
}

.bubbles {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  pointer-events: none;
  overflow: hidden;
  z-index: 0;
}

.bubble {
  position: absolute;
  border-radius: 50%;
  background: linear-gradient(145deg, rgba(0, 179, 255, 0.4), rgba(0, 255, 234, 0.3));
  box-shadow: 0 0 15px rgba(0, 200, 255, 0.3);
  animation: pop-fall infinite linear;
}

@keyframes pop-fall {
  0% {
    transform: translateY(0) scale(1);
    opacity: 0.7;
  }
  80% {
    opacity: 0.7;
  }
  100% {
    transform: translateY(120vh) scale(1.5);
    opacity: 0;
  }
}

.card {
  border: 0.2rem, solid cyan;
  backdrop-filter: blur(12px);
  box-shadow: 0 8px 20px rgba(0, 0, 0, 0.08);
  transition: all 0.2s ease-in-out;
  min-height: 300px;
  display: flex;
  align-items: center;
  justify-content: center;
  padding-top: 4.5rem;
}

.card:hover {
  transform: translateY(-6px);
  box-shadow: 0 12px 24px rgba(0, 0, 0, 0.12);
}

.pointer {
  cursor: pointer;
}

.card-title {
  font-size: 1.85rem;
  font-weight: 600;
}
</style>
