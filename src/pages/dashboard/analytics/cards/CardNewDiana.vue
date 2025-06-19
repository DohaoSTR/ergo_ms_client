<script setup>
import { ref, onMounted } from 'vue';
import axios from 'axios';


const userCount = ref(null);


// Функция для получения количества пользователей с API
const fetchUserCount = async () => {
  try {
    const response = await axios.get('http://localhost:8000/api/podmodule1/users-count/');
    userCount.value = response.data.data[0].count;
    console.log('Количество пользователей:', response);
  }
  catch (error) {
    console.error('Ошибка при получении количества пользователей:', error);
  }
};


onMounted(() => {
  fetchUserCount();
});
</script>

<template>
  <div class="card">
    <div class="card-body text-center">
      <h5 class="card-title text-primary mb-3">Количество пользователей</h5>
      <p class="mb-3" v-if="userCount !== null">
        В системе зарегистрировано: <strong>{{ userCount }}</strong> пользователей.
      </p>
      <p v-else>
        Загрузка данных...
      </p>
    </div>
  </div>
</template>
