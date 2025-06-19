<template>
  <div class="container-fluid vh-100 d-flex flex-column position-relative">

    <!-- Заголовок теста -->
    <header class="bg-white border-bottom py-3 px-4 shadow-sm">
      <h4 class="mb-0">{{ test.title }}</h4>
      <p v-if="test.skill || test.description" class="text-muted small mb-0">
        {{ test.skill }} — {{ test.description }}
      </p>
    </header>

    <div class="d-flex flex-grow-1 overflow-hidden">

      <!-- Sidebar с вопросами -->
      <aside class="col-md-3 col-lg-2 bg-light border-end p-3 overflow-auto">
        <h6 class="mb-3">Вопросы</h6>
        <ul class="list-group list-group-flush">
          <li
            v-for="(question, index) in test.questions"
            :key="index"
            class="list-group-item list-group-item-action d-flex align-items-center justify-content-between"
            :class="{
              active: currentIndex === index,
              'bg-success': question.selected !== null && question.selected !== undefined
            }"
            @click="selectQuestion(index)"
            style="cursor: pointer;"
          >
            <span>Вопрос {{ index + 1 }}</span>
            <small class="ms-2 text-truncate" style="max-width: 120px;">{{ question.text }}</small>
          </li>
        </ul>
      </aside>

      <!-- Основная область с текущим вопросом -->
      <main class="col p-4 bg-white overflow-auto position-relative" style="min-height: 0;">
        <div v-if="currentQuestion" class="card shadow-sm mx-auto" style="max-width: 600px;">
          <div class="card-body">
            <h6 class="card-subtitle mb-3 text-muted">Вопрос {{ currentIndex + 1 }} из {{ test.questions.length }}</h6>
            <h5 class="card-title mb-4">{{ currentQuestion.text }}</h5>
            <ul class="list-group">
              <li
                v-for="(option, idx) in currentQuestion.answers"
                :key="idx"
                class="list-group-item list-group-item-action mb-1 rounded-3"
                :class="{ active: currentQuestion.selected === idx }"
                @click="toggleOption(idx)"
                style="cursor: pointer;"
              >
                {{ option.text }}
              </li>
            </ul>
          </div>
        </div>

        <!-- Кнопка внизу справа основной области -->
        <button
          class="btn btn-danger position-absolute bottom-0 end-0 m-3"
          @click="submitTest"
          :disabled="!allAnswered"
          style="z-index: 10;"
        >
          {{ allAnswered ? 'Завершить тест' : 'Не все ответы даны' }}
        </button>
      </main>

    </div>

  </div>
</template>

<script setup>
import { endpoints } from '@/js/api/endpoints';
import { apiClient } from '@/js/api/manager';
import router from '@/js/routers';
import { onMounted, ref, computed } from 'vue';
import { defineProps } from 'vue';

// Пропсы
const props = defineProps({
  id: {
    type: [String, Number],
    required: true
  }
});

// Состояние теста
const test = ref({
  title: '',
  skill: '',
  description: '',
  questions: []
});
const result = ref({
  testid: null,
  answers: []
})
// Текущий индекс вопроса
const currentIndex = ref(0);

// Текущий вопрос
const currentQuestion = computed(() => {
  return test.value.questions[currentIndex.value] || null;
});

// Проверка, все ли вопросы имеют выбранный ответ
const allAnswered = computed(() => {
  return test.value.questions.every(q => q.selected !== null);
});

// Функция выбора вопроса
function selectQuestion(index) {
  currentIndex.value = index;
}

// Функция переключения варианта ответа (выбор / отмена)
function toggleOption(index) {
  if (currentQuestion.value) {
    if (currentQuestion.value.selected === index) {
      currentQuestion.value.selected = null; // если уже выбран — отменяем
    } else {
      currentQuestion.value.selected = index; // иначе выбираем
    }
  }
}

// Отправка теста
async function submitTest() {
  if (!allAnswered.value) return;
  const answers = test.value.questions.map(q => ({
    questiontext: q.text,
    selectedAnswerText: q.answers[q.selected].text,
    seletedAnswerId:q.selected

  }));
  result.value.testid = props.id
  result.value.answers = answers
  try {
    const response = await apiClient.post(endpoints.expert_system.evaluateTest, 
      result.value
    );
    router.push({name:'TestResult', params:{id: Number(response.data.testresultid)}})
  } catch (error) {
    console.error('Ошибка при отправке теста:', error);
  }
}

// Загрузка данных при монтировании
onMounted(async () => {
  try {
    const response = await apiClient.get(endpoints.expert_system.getTest, { id: props.id });
    const data = response.data;

    test.value = {
      title: data.title,
      skill: data.skill || '',
      description: data.description || '',
      questions: data.questions.map(q => ({
        ...q,
        selected: null
      }))
    };

  } catch (error) {
    console.error('Ошибка загрузки теста:', error);
  }
});
</script>

<style scoped>
.card {
  transition: transform 0.2s ease-in-out;
}
.card:hover {
  transform: translateY(-2px);
}
.list-group-item.active {
  background-color: #dc3545;
  color: white;
}
</style>
