<template>
  <div class="container py-4">
    <h2 class="mb-4">Профориентационный тест</h2>

    <div v-if="loading" class="text-center">
      Загрузка…
    </div>
    <div v-else>
      <div v-if="error" class="alert alert-danger">{{ error }}</div>

      <div v-if="questions.length">

        <p>Вопрос {{ currentIndex + 1 }} из {{ questions.length }}</p>

        <h5 class="mb-3">{{ currentQuestion.text }}</h5>

        <div v-for="ans in currentAnswers" :key="ans.id" class="form-check mb-2">
          <input
            class="form-check-input"
            type="radio"
            :name="'q' + currentQuestion.id"
            :id="'ans-' + ans.id"
            :value="ans.id"
            v-model="selected[currentQuestion.id]"
          />
          <label class="form-check-label" :for="'ans-' + ans.id">
            {{ ans.text }}
          </label>
        </div>


        <div class="d-flex justify-content-between mt-4">
          <button
            class="btn btn-secondary"
            :disabled="currentIndex === 0"
            @click="prev"
          >
            Назад
          </button>

          <button
            v-if="currentIndex < questions.length - 1"
            class="btn btn-primary"
            :disabled="!selected[currentQuestion.id]"
            @click="next"
          >
            Далее
          </button>

          <button
            v-else
            class="btn btn-success"
            :disabled="!selected[currentQuestion.id]"
            @click="submit"
          >
            Завершить
          </button>
        </div>
      </div>

      <div v-else class="text-center">
        Вопросы не найдены.
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { apiClient } from '@/js/api/manager'
import { endpoints } from '@/js/api/endpoints'

const route = useRoute()
const router = useRouter()
const testId = route.params.testId

const questions = ref([])
const answersMap = ref({})
const selected = ref({})
const currentIndex = ref(0)
const loading = ref(false)
const error = ref('')

const currentQuestion = computed(() => questions.value[currentIndex.value] || {})
const currentAnswers = computed(
  () => answersMap.value[currentQuestion.value.id] || []
)

async function loadQuestions() {
  loading.value = true
  error.value = ''
  try {
    const qres = await apiClient.get(endpoints.expert_system.orientationQuestions, { test: testId })
    if (!qres.success) throw new Error('Не удалось загрузить вопросы')

    questions.value = qres.data

    await Promise.all(
      questions.value.map(async q => {
        const ares = await apiClient.get(endpoints.expert_system.orientationAnswers, { question: q.id })
        if (ares.success) {
          answersMap.value[q.id] = ares.data
        } else {
          answersMap.value[q.id] = []
        }
      })
    )
  } catch (e) {
    error.value = e.message
  } finally {
    loading.value = false
  }
}

function next() {
  if (currentIndex.value < questions.value.length - 1) {
    currentIndex.value++
  }
}

function prev() {
  if (currentIndex.value > 0) {
    currentIndex.value--
  }
}

async function submit() {
  loading.value = true
  error.value = ''
  try {
    const rres = await apiClient.post(endpoints.expert_system.orientationResults, {
      test: testId
    })
    if (!rres.success) throw new Error('Не удалось сохранить результат')

    const resultId = rres.data.id

    await Promise.all(
      Object.entries(selected.value).map(([questionId, answerId]) =>
        apiClient.post(endpoints.expert_system.orientationUserAnswers, {
          result: resultId,
          question: questionId,
          answer: answerId
        })
      )
    )

    router.push({ name: 'OrientationResult', params: { resultId } })
  } catch (e) {
    error.value = e.message
  } finally {
    loading.value = false
  }
}

onMounted(loadQuestions)
</script>

<style scoped>
.container {
  max-width: 700px;
}
</style>
