<template>
    <div class="technologies-container">
      <h2>Список технологий</h2>
      
      <!-- Поле ввода для фильтрации -->
      <input
        v-model="searchQuery"
        type="text"
        placeholder="Поиск по технологиям..."
        class="search-input"
      />
      
      <!-- Список технологий -->
      <ul v-if="filteredTechnologies.length" class="technologies-list">
        <li v-for="tech in filteredTechnologies" :key="tech.id">
          <strong>{{ tech.name }}</strong>
          <br>
          {{ tech.description }}
          <br>
          <small>Популярность: {{ tech.popularity }}%, Рейтинг: {{ tech.rating }}</small>
        </li>
      </ul>
      <p v-else>Нет данных для отображения.</p>
    </div>
  </template>
  
  <script setup>
  import { ref, computed, onMounted } from "vue";
  import { endpoints } from '@/js/api/endpoints';
  import { apiClient } from '@/js/api/manager';
  
  const technologies = ref([]); // Данные о технологиях
  const searchQuery = ref(""); // Поисковый запрос
  
  // Запрос данных
  const fetchData = async () => {
    try {
      const response = await apiClient.get(endpoints.learning_analytics.technologies.get);
      // Универсально: поддержка как response.data, так и response.data.data
      if (Array.isArray(response.data)) {
        technologies.value = response.data;
      } else if (Array.isArray(response.data?.data)) {
        technologies.value = response.data.data;
      } else {
        technologies.value = [];
      }
    } catch (error) {
      technologies.value = [];
      console.error("Ошибка загрузки данных:", error);
    }
  };
  
  // Фильтрация технологий по поисковому запросу
  const filteredTechnologies = computed(() => {
    if (!Array.isArray(technologies.value)) return [];
    return technologies.value.filter((tech) =>
      tech.name.toLowerCase().includes(searchQuery.value.toLowerCase()) ||
      tech.description.toLowerCase().includes(searchQuery.value.toLowerCase())
    );
  });
  
  onMounted(fetchData);
  </script>
  
  <style scoped>
  :root {
    --color-accent: #d0322d; /* Акцентный цвет (красный) */
    --color-primary-background: #f8f9fa; /* Основной фон */
    --color-secondary-background: #ffffff; /* Вторичный фон */
    --color-primary-text: #333; /* Основной текст */
    --color-secondary-text: #777; /* Вторичный текст */
    --color-border: #ddd; /* Цвет границ */
    --color-scrollbar-thumb: #888; /* Цвет ползунка scrollbar */
    --color-scrollbar-track: #f1f1f1; /* Цвет трека scrollbar */
  }
  
  .technologies-container {
    max-width: 850px;
    margin: auto;
    text-align: left;
    background: var(--color-primary-background);
    padding: 20px;
    border-radius: 12px;
    box-shadow: 0px 4px 12px rgba(0, 0, 0, 0.1);
  }
  
  h2 {
    font-size: clamp(18px, 4vw, 24px); /* Адаптивный размер шрифта */
    color: var(--color-primary-text);
    margin-bottom: 20px;
  }
  
  .search-input {
    width: 100%;
    padding: 10px;
    margin-bottom: 20px;
    border: 1px solid var(--color-border);
    border-radius: 8px;
    font-size: clamp(14px, 3vw, 16px); /* Адаптивный размер шрифта */
    outline: none;
    background: var(--color-secondary-background);
    color: var(--color-primary-text);
  }
  
  .technologies-list {
    list-style-type: none;
    padding: 0;
    max-height: 300px; /* Ограничение высоты для scrollbar */
    overflow-y: auto; /* Добавление scrollbar */
    padding-right: 8px; /* Отступ справа для scrollbar */
  }
  
  /* Стилизация scrollbar для WebKit-браузеров (Chrome, Edge, Safari) */
  .technologies-list::-webkit-scrollbar {
    width: 6px; /* Уменьшаем ширину scrollbar */
  }
  
  .technologies-list::-webkit-scrollbar-track {
    background: var(--color-scrollbar-track); /* Цвет фона трека */
    border-radius: 8px; /* Увеличиваем скругление углов трека */
    margin: 8px 0; /* Отступ сверху и снизу для трека */
  }
  
  .technologies-list::-webkit-scrollbar-thumb {
    background: var(--color-scrollbar-thumb); /* Цвет ползунка */
    border-radius: 8px; /* Увеличиваем скругление углов ползунка */
    border: 1px solid var(--color-scrollbar-track); /* Добавляем границу для ползунка */
  }
  
  .technologies-list::-webkit-scrollbar-thumb:hover {
    background: var(--color-accent); /* Цвет ползунка при наведении */
  }
  
  /* Стилизация scrollbar для Firefox */
  .technologies-list {
    scrollbar-width: thin; /* Тонкий scrollbar */
    scrollbar-color: var(--color-scrollbar-thumb) var(--color-scrollbar-track); /* Цвет ползунка и трека */
  }
  
  li {
    background: var(--color-secondary-background);
    margin-bottom: 10px;
    padding: 15px;
    border-radius: 8px;
    box-shadow: 0px 2px 6px rgba(0, 0, 0, 0.1);
  }
  
  li strong {
    color: var(--color-accent);
  }
  
  li small {
    color: var(--color-secondary-text);
    font-size: clamp(12px, 2.5vw, 14px); /* Адаптивный размер шрифта */
  }
  
  @media (max-width: 768px) {
    .technologies-container {
      padding: 15px; /* Меньше отступы на мобильных устройствах */
    }
  
    .technologies-list {
      max-height: 200px; /* Уменьшаем высоту списка на мобильных устройствах */
    }
  
    li {
      padding: 10px; /* Меньше отступы внутри элементов списка */
    }
  }
  </style>
