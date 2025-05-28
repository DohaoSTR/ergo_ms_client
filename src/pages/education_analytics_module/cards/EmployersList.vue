<template>
  <div class="employers-container">
    <h2>Список работодателей</h2>

    <!-- Поле ввода для фильтрации -->
    <div class="search-container">
      <input
        v-model="searchQuery"
        type="text"
        placeholder="Поиск по компаниям..."
        class="search-input"
      />
      <span class="search-icon">&#128269;</span>
    </div>

    <!-- Список работодателей -->
    <ul v-if="filteredEmployers.length" class="employers-list">
      <li v-for="employer in filteredEmployers" :key="employer.id">
        <div class="employer-card">
          <div class="employer-header">
            <strong>{{ employer.company_name }}</strong>
            <span class="rating">{{ '★'.repeat(Math.floor(employer.rating)) }}{{ employer.rating % 1 >= 0.5 ? '½' : '' }}</span>
          </div>
          <p class="description">{{ employer.description }}</p>
          <div class="employer-footer">
            <small>Email: <a :href="`mailto:${employer.email}`">{{ employer.email }}</a></small>
            <small>Рейтинг: {{ employer.rating }}/5</small>
          </div>
        </div>
      </li>
    </ul>
    <div v-else-if="loading" class="loading-state">
      <div class="spinner"></div>
      <p>Загрузка данных...</p>
    </div>
    <div v-else class="empty-state">
      <p>Нет данных для отображения</p>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from "vue";
import { endpoints } from '@/js/api/endpoints';
import { apiClient } from '@/js/api/manager';

const employers = ref([]); // Данные о работодателях
const searchQuery = ref(""); // Поисковый запрос
const loading = ref(true); // Статус загрузки

// Запрос данных
const fetchData = async () => {
  try {
    loading.value = true;
    const response = await apiClient.get(endpoints.learning_analytics.employers.get);
    // Универсально: поддержка как response.data, так и response.data.data
    if (Array.isArray(response.data)) {
      employers.value = response.data;
    } else if (Array.isArray(response.data?.data)) {
      employers.value = response.data.data;
    } else {
      employers.value = [];
    }
  } catch (error) {
    employers.value = [];
    console.error("Ошибка загрузки данных:", error);
  } finally {
    loading.value = false;
  }
};

// Фильтрация работодателей по поисковому запросу
const filteredEmployers = computed(() => {
  if (!Array.isArray(employers.value)) return [];
  const query = searchQuery.value.toLowerCase();

  return employers.value.filter((employer) =>
    employer.company_name.toLowerCase().includes(query) ||
    employer.description.toLowerCase().includes(query) ||
    employer.email.toLowerCase().includes(query)
  );
});

onMounted(fetchData);
</script>

<style scoped>
.employers-container {
  max-width: 100%;
  margin: auto;
  text-align: left;
  background: var(--color-primary-background);
  padding: 1.25rem;
  border-radius: 0.75rem;
  box-shadow: 0 0.25rem 0.75rem var(--color-shadow);
}

h2 {
  font-size: clamp(1.125rem, 4vw, 1.5rem);
  color: var(--color-accent);
  margin-bottom: 1.25rem;
  font-weight: 600;
}

.search-container {
  position: relative;
  margin-bottom: 1.25rem;
}

.search-input {
  width: 100%;
  padding: 0.75rem 1rem 0.75rem 2.5rem;
  border: 1px solid var(--color-border);
  border-radius: 0.5rem;
  font-size: 1rem;
  outline: none;
  background: var(--color-secondary-background);
  color: var(--color-primary-text);
  transition: border-color 0.2s, box-shadow 0.2s;
}

.search-input:focus {
  border-color: var(--color-accent);
  box-shadow: 0 0 0 2px var(--color-accent-light);
}

.search-icon {
  position: absolute;
  left: 0.75rem;
  top: 50%;
  transform: translateY(-50%);
  color: var(--color-secondary-text);
  font-size: 1rem;
}

.employers-list {
  list-style-type: none;
  padding: 0;
  max-height: 28rem;
  overflow-y: auto;
  padding-right: 0.5rem;
}

.employers-list::-webkit-scrollbar {
  width: 0.375rem;
}

.employers-list::-webkit-scrollbar-track {
  background: var(--color-scrollbar-track);
  border-radius: 0.5rem;
}

.employers-list::-webkit-scrollbar-thumb {
  background: var(--color-scrollbar-thumb);
  border-radius: 0.5rem;
}

.employers-list::-webkit-scrollbar-thumb:hover {
  background: var(--color-accent);
}

.employers-list {
  scrollbar-width: thin;
  scrollbar-color: var(--color-scrollbar-thumb) var(--color-scrollbar-track);
}

li {
  margin-bottom: 1rem;
}

.employer-card {
  background: var(--color-secondary-background);
  padding: 1rem;
  border-radius: 0.5rem;
  box-shadow: 0 0.125rem 0.375rem var(--color-shadow);
  transition: transform 0.2s ease, box-shadow 0.2s ease;
  border: 1px solid var(--color-border);
}

.employer-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 0.25rem 0.5rem var(--color-shadow);
}

.employer-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 0.625rem;
}

.employer-header strong {
  color: var(--color-accent);
  font-size: 1.125rem;
  font-weight: 600;
}

.rating {
  color: var(--color-rating);
  letter-spacing: -2px;
}

.description {
  margin-bottom: 0.75rem;
  color: var(--color-primary-text);
  line-height: 1.5;
  font-size: 0.9375rem;
}

.employer-footer {
  display: flex;
  justify-content: space-between;
  border-top: 1px solid var(--color-border);
  padding-top: 0.625rem;
}

.employer-footer small {
  color: var(--color-secondary-text);
  font-size: 0.75rem;
}

.employer-footer a {
  color: var(--color-accent);
  text-decoration: none;
  transition: color 0.2s;
}

.employer-footer a:hover {
  text-decoration: underline;
  color: var(--color-accent-hover);
}

.loading-state,
.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 3rem 0;
  color: var(--color-secondary-text);
}

.spinner {
  width: 2rem;
  height: 2rem;
  border: 0.1875rem solid var(--color-border);
  border-radius: 50%;
  border-top-color: var(--color-accent);
  animation: spin 1s ease-in-out infinite;
  margin-bottom: 1rem;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

@media (max-width: 768px) {
  .employers-container {
    padding: 1rem;
  }

  .employers-list {
    max-height: 18.75rem;
  }

  .employer-card {
    padding: 0.75rem;
  }

  .employer-footer {
    flex-direction: column;
    gap: 0.3125rem;
  }
}
</style>
