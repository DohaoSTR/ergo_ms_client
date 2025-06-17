<template>
  <div>
    <!-- Показывать заголовок только если нет вложенного роута -->
    <h2 v-if="!hasChildRoute">Здесь будет проводиться аналитика</h2>

    <ul v-if="!hasChildRoute">
      <li v-for="task in tasks" :key="task.id">
        {{ task.name }}
      </li>
    </ul>

    <!-- Вложенные маршруты (DatabaseAnalyze.vue) -->
    <router-view />
  </div>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue';
import { useRoute } from 'vue-router';
import axios from 'axios';

const tasks = ref([]);
const route = useRoute();


const hasChildRoute = computed(() => route.matched.some(r => r.name === 'DatabaseAnalyze'));

const fetchTasks = async () => {

};

onMounted(fetchTasks);
</script>
