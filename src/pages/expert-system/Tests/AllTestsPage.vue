<template>
    <div class="container mt-5">
      <h1 class="mb-4">Список тестов</h1>
      <div class="row g-4">

        <div class="col-md-4" v-for="test in tests" :key="test.id">
          <div class="card mb-4 shadow-sm h-100">
            <div class="card-body d-flex flex-column">
              <h5 class="card-title">{{ test.title }}</h5>
              <p class="card-text">
                <strong>Навык:</strong> {{ test.skill }}<br>
                <strong>Вопросов:</strong> {{ test.count_of_questions }}<br>
                <strong>Описание:</strong> {{ test.description }}
              </p>
  
              <div class="mt-auto d-grid gap-2 d-md-flex justify-content-md-between">
                <button @click="checktest(test.id)" class="btn btn-outline-primary btn-sm me-2">
                   Редактировать
                </button>
                <button @click="deleteTest(test.id)" class="btn btn-outline-danger btn-sm">
                   Удалить
                </button>
              </div>
            </div>
          </div>
        </div>
        <div class="col-md-4">
          <div class="card mb-4 shadow-sm h-100 text-center d-flex align-items-center justify-content-center add-card"
               @click="addNewTest">
              <h5 class="card-title text-primary">➕ Добавить новый тест</h5>
              <p class="card-text text-muted">Нажмите, чтобы создать новый тест</p>
          </div>
        </div>
      </div>
    </div>
  </template>
  
  <script setup>
import { ref, onMounted } from 'vue'
import router from '@/js/routers'
import { endpoints } from '@/js/api/endpoints'
import { apiClient } from '@/js/api/manager'

const tests = ref(  )
onMounted(async ()=>{
 let t = await apiClient.get(endpoints.expert_system.getAllTests)
  tests.value = t.data
})
// Функция добавления нового теста
const addNewTest = () => {
  router.push({ name: 'TestCreation' })
}

const checktest = (id)=>{
  router.push({name:'TestPreview', params:{id:id} })
}
// Функция удаления теста
const deleteTest = async (testid) => {
  let url = `${endpoints.expert_system.deleteTest}/${testid}/`
  await apiClient.delete(url);
  tests.value = tests.value.filter(test => test.id !== testid)
}
</script>
  
  <style scoped>
  .card {
    transition: transform 0.2s;
    cursor: default;
  }
  .card:hover {
    transform: scale(1.02);
  }

  
  .card-text strong {
    color: #495057;
  }
  
  .card-body {
    display: flex;
    flex-direction: column;
    justify-content: space-between;
  }
  </style>
