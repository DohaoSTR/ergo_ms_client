<template>
    <div class="container mt-5">
      <!-- Основная карточка -->
      <div class="card shadow-sm position-relative" style="min-height: 400px;">
        <!-- Заголовок теста -->
        <div class="card-header bg-white">
          <h4 class="card-title mb-0">{{ test_name }}</h4>
          <p class="card-subtitle text-muted mb-0">Навык: {{ skill }}</p>
        </div>
  
        <!-- Результат теста -->
        <div class="card-body">
          <p :class="['h5 mb-4', passed ? 'text-success' : 'text-danger']">
            Результат: {{ score }}% — {{ passed ? 'Пройден' : 'Не пройден' }}
          </p>
  
          <!-- Список вопросов/ответов -->
          <div class="accordion mb-4" id="answersAccordion">
            <div v-for="(answer, index) in answers" :key="index" class="accordion-item">
              <h2 class="accordion-header" :id="'heading' + index">
                <button 
                  class="accordion-button" 
                  type="button" 
                  data-bs-toggle="collapse"
                  :data-bs-target="'#collapse' + index" 
                  aria-expanded="true"
                  :aria-controls="'collapse' + index"
                >
                  Вопрос {{ index + 1 }}
                  <span 
                    :class="{
                      'badge bg-success ms-2': answer.is_correct,
                      'badge bg-danger ms-2': !answer.is_correct
                    }"
                  >
                    {{ answer.is_correct ? 'Правильно' : 'Неправильно' }}
                  </span>
                </button>
              </h2>
              <div 
                :id="'collapse' + index" 
                class="accordion-collapse collapse show" 
                :aria-labelledby="'heading' + index"
                data-bs-parent="#answersAccordion"
              >
                <div class="accordion-body">
                  <strong>Вопрос:</strong> {{ answer.question }}<br />
                  <strong>Ваш ответ:</strong> {{ answer.answer }}
                </div>
              </div>
            </div>
          </div>
        </div>
  
        <!-- Кнопка в правом нижнем углу карточки -->
        <button
          class="btn btn-outline-primary position-absolute bottom-0 end-0 m-3"
          @click="router.push({name:'Profile'})"
        >
          Вернуться к профилю
        </button>
      </div>
    </div>
  </template>
  
  <script setup>
  import { ref, onMounted } from 'vue';
  import { apiClient } from '@/js/api/manager';
  import { endpoints } from '@/js/api/endpoints';
  import  router  from '@/js/routers';
  
  const props = defineProps({
    id: {
      type: Number,
      required: true
    }
  });
  
  const test_name = ref('');
  const skill = ref('');
  const score = ref('');
  const passed = ref(false);
  const answers = ref([]);
  
  onMounted(async () => {
    try {
      const response = await apiClient.get(endpoints.expert_system.getTestResult, { id: props.id });
      const testData = response.data;
      test_name.value = testData.test_name;
      skill.value = testData.skill;
      score.value = testData.score;
      passed.value = testData.passed;
      answers.value = testData.answers;
    } catch (error) {
      console.error('Ошибка при загрузке данных теста:', error);
    }
  });
  </script>
  
  <style scoped>
  .card-title {
    font-size: 1.5rem;
  }
  </style>