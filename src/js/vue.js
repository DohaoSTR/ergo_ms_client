import axios from 'axios';
import { ref, onMounted } from 'vue';

export default {
  setup() {
    const tasks = ref([]);

    const fetchTasks = async () => {
      try {
        const response = await axios.get('http://127.0.0.1:8000/api/tasks/');
        tasks.value = response.data; // Данные из бэкенда
      } catch (error) {
        console.error('Ошибка загрузки данных:', error);
      }
    };

    onMounted(fetchTasks);

    return { tasks };
  }
};
