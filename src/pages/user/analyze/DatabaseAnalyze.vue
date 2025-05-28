<template>
  <div>
    <h3>Последние цены Bitcoin:</h3>
    <ul>
      <li v-for="btc in bitcoinPrices" :key="btc.timestamp">
        {{ new Date(btc.timestamp).toLocaleString() }} — ${{ btc.price_usd }}
      </li>
    </ul>

    <h3>График изменения цены:</h3>
    <Line v-if="bitcoinPrices.length > 0" :chart-data="chartData" :chart-options="chartOptions" />
    <p v-else>Загрузка данных...</p>

    <!-- Поле ввода дней -->
    <div class="input-container">
      <label for="days">Количество дней:</label>
      <input type="number" v-model="days" min="1" max="365" />
    </div>

    <div class="button-container">
      <button @click="fetchPrice">Обновить данные</button>
      <button @click="exportToCSV">Экспорт в CSV</button>
    </div>

    <transition name="popup">
      <div v-if="updateSuccess" class="popup">Данные успешно обновлены!</div>
    </transition>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import axios from 'axios';
//import { LineChart } from 'vue-chart-3';
import { Line } from 'vue-chartjs'
import { Chart, registerables } from 'chart.js';

Chart.register(...registerables);

const bitcoinPrices = ref([]);
const updateSuccess = ref(false);
const days = ref(10); // Значение по умолчанию

const fetchData = async () => {
  try {
    const btcResponse = await axios.get('http://127.0.0.1:8000/api/analyze/bitcoin-price/');
    bitcoinPrices.value = btcResponse.data.reverse();
  } catch (error) {
    console.error('Ошибка загрузки данных:', error);
  }
};

const chartData = computed(() => ({
  labels: bitcoinPrices.value.map((btc) => new Date(btc.timestamp).toLocaleDateString()),
  datasets: [
    {
      label: 'Цена BTC (USD)',
      data: bitcoinPrices.value.map((btc) => btc.price_usd),
      borderColor: 'rgba(75, 192, 192, 1)',
      backgroundColor: 'rgba(75, 192, 192, 0.2)',
      tension: 0.4,
    },
  ],
}));

const chartOptions = { responsive: true, maintainAspectRatio: false };

onMounted(fetchData);

const fetchPrice = async () => {
  try {
    await axios.post('http://127.0.0.1:8000/api/analyze/execute-command/', { command: 'fetch_price', days: days.value });
    await fetchData();
    updateSuccess.value = true;
    setTimeout(() => { updateSuccess.value = false; }, 3000);
  } catch (error) {
    console.error('Ошибка при выполнении команды:', error);
  }
};

const exportToCSV = () => {
  const headers = '\ufeff"Дата","Цена (USD)"\n'; // Добавление BOM и кавычек
  const rows = bitcoinPrices.value.map(btc => `"${new Date(btc.timestamp).toLocaleString()}","${btc.price_usd}"`).join('\n');
  const csvContent = headers + rows;

  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.download = 'bitcoin_prices.csv';
  link.click();
};
</script>

<style scoped>
.button-container {
  text-align: center;
  margin-top: 10px;
}

button {
  padding: 5px 20px;
  font-size: 16px;
  cursor: pointer;
  margin: 0 5px;
}

/* Поле ввода дней */
.input-container {
  text-align: center;
  margin-top: 10px;
}

input {
  padding: 5px;
  font-size: 16px;
  width: 60px;
  margin-left: 5px;
}

/* Стили для popup */
.popup {
  position: fixed;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  background-color: #4caf50;
  color: white;
  padding: 15px 30px;
  border-radius: 8px;
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.2);
  font-size: 18px;
  font-weight: bold;
  z-index: 1000;
  opacity: 1;
  transition: opacity 0.5s ease-in-out;
}

/* Анимация появления/исчезновения */
.popup-enter-active, .popup-leave-active {
  transition: opacity 0.5s ease-in-out, transform 0.3s ease-in-out;
}

.popup-enter-from, .popup-leave-to {
  opacity: 0;
  transform: translate(-50%, -60%);
}
</style>
