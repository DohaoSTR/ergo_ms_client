<template>
    <div class="recommendations-container-fluid p-0 w-100">
      <div class="card border-0">
        <div class="card-body p-4 p-lg-5">
          <!-- Заголовок и описание -->
          <div class="mb-4 mb-lg-5 text-center text-lg-start">
            <h2 class="mb-2 fw-bold display-6">Персонализированные рекомендации</h2>
            <p class="text-muted mb-0 fs-5">Подборка материалов для вашего профессионального роста</p>
          </div>
  
          <!-- Табы категорий -->
          <div class="d-flex justify-content-center justify-content-lg-start mb-4 mb-lg-5">
            <ul class="nav nav-tabs flex-nowrap overflow-auto" style="width: 100%">
              <li 
                v-for="category in categories"
                :key="category.id"
                class="nav-item flex-shrink-0"
                role="presentation"
              >
                <button
                  @click="selectCategory(category.id)"
                  :class="{ active: selectedCategory === category.id }"
                  class="nav-link px-4 py-2"
                  type="button"
                >
                  {{ category.name }}
                </button>
              </li>
            </ul>
          </div>
  
          <!-- Контент рекомендаций -->
          <div class="tab-content">
            <div class="tab-pane fade show active">
              <div v-if="filteredRecommendations.length" class="row g-4 g-lg-5">
                <div 
                  v-for="recommendation in filteredRecommendations"
                  :key="recommendation.id"
                  class="col-12 col-md-6 col-xl-4"
                >
                  <div class="card h-100 border-0 shadow-sm hover-shadow transition-all h-100">
                    <div class="card-body d-flex flex-column p-4">
                      <!-- Бейдж типа -->
                      <span 
                        class="badge mb-3 align-self-start px-3 py-2"
                        :class="`bg-${getBadgeVariant(recommendation.type)}-subtle text-${getBadgeVariant(recommendation.type)}`"
                      >
                        {{ getTypeName(recommendation.type) }}
                      </span>
                      
                      <!-- Заголовок и описание -->
                      <h5 class="card-title fs-5 fw-bold">{{ recommendation.title }}</h5>
                      <p class="card-text text-muted mb-3 flex-grow-1">{{ recommendation.description }}</p>
                      
                      <!-- Мета-информация -->
                      <div class="mt-auto w-100">
                        <div class="d-flex gap-3 text-muted small mb-3">
                          <span v-if="recommendation.duration" class="d-flex align-items-center gap-1">
                            <i class="bi bi-clock"></i>
                            {{ recommendation.duration }}
                          </span>
                          <span v-if="recommendation.level" class="d-flex align-items-center gap-1">
                            <i class="bi bi-bar-chart"></i>
                            {{ recommendation.level }}
                          </span>
                        </div>
                        
                        <!-- Кнопка действия -->
                        <a 
                          :href="recommendation.link" 
                          target="_blank"
                          class="btn btn-primary w-100 d-flex align-items-center justify-content-center gap-2 py-2"
                        >
                          Изучить
                          <i class="bi bi-arrow-right"></i>
                        </a>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              
              <!-- Сообщение, если нет рекомендаций -->
              <div v-else class="text-center py-5">
                <div class="mb-3">
                  <i class="bi bi-info-circle text-muted" style="font-size: 3rem;"></i>
                </div>
                <h5 class="text-muted fs-4">Рекомендации не найдены</h5>
                <p class="text-muted fs-5">Попробуйте выбрать другую категорию</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </template>
  
  <script setup>
  import { ref, computed, onMounted } from 'vue';
  
  const categories = ref([
    { id: 'courses', name: 'Курсы' },
    { id: 'books', name: 'Книги' },
    { id: 'articles', name: 'Статьи' },
    { id: 'practices', name: 'Практики' },
    { id: 'events', name: 'Мероприятия' }
  ]);
  
  const recommendations = ref([
    {
      id: 1,
      category: 'courses',
      type: 'video',
      title: 'Vue 3 - Полное руководство',
      description: 'Подробный курс по Vue 3, включая Composition API, Vuex и Router',
      duration: '15 часов',
      level: 'Средний',
      link: '#'
    },
    {
      id: 2,
      category: 'courses',
      type: 'interactive',
      title: 'Основы Composition API',
      description: 'Интерактивный курс по работе с новой системой реактивности Vue',
      duration: '8 часов',
      level: 'Начальный',
      link: '#'
    },
    {
      id: 3,
      category: 'books',
      type: 'book',
      title: 'Vue.js в действии',
      description: 'Лучшая книга для глубокого понимания Vue.js',
      level: 'Начальный-Средний',
      link: '#'
    },
    {
      id: 4,
      category: 'articles',
      type: 'article',
      title: 'Оптимизация производительности во Vue',
      description: '10 практических советов по ускорению вашего Vue-приложения',
      link: '#'
    },
    {
      id: 5,
      category: 'practices',
      type: 'practice',
      title: 'Реализация анимаций во Vue',
      description: 'Практическое руководство по созданию плавных анимаций',
      duration: '2 часа практики',
      level: 'Средний',
      link: '#'
    },
    {
      id: 6,
      category: 'events',
      type: 'event',
      title: 'VueConf 2023',
      description: 'Главная конференция по Vue.js с участием создателя фреймворка',
      duration: '2 дня',
      link: '#'
    }
  ]);
  
  const selectedCategory = ref('courses');
  
  onMounted(() => {
    selectedCategory.value = 'courses';
  });
  
  const selectCategory = (categoryId) => {
    selectedCategory.value = categoryId;
  };
  
  const getTypeName = (type) => {
    const types = {
      video: 'Видеокурс',
      interactive: 'Интерактив',
      book: 'Книга',
      article: 'Статья',
      practice: 'Практика',
      event: 'Мероприятие'
    };
    return types[type] || type;
  };
  
  const getBadgeVariant = (type) => {
    const variants = {
      video: 'primary',
      interactive: 'success',
      book: 'info',
      article: 'warning',
      practice: 'danger',
      event: 'purple'
    };
    return variants[type] || 'secondary';
  };
  
  const filteredRecommendations = computed(() => {
    return recommendations.value.filter(r => r.category === selectedCategory.value);
  });
  </script>
  
  <style scoped>
  .recommendations-container-fluid {
    width: 100%;
    max-width: 100%;
  }
  
  .card {
    border-radius: 0;
  }
  
  .hover-shadow {
    transition: all 0.3s ease;
    border-radius: 12px;
  }
  
  .hover-shadow:hover {
    transform: translateY(-5px);
    box-shadow: 0 10px 20px rgba(0, 0, 0, 0.1) !important;
  }
  
  .transition-all {
    transition: all 0.3s ease;
  }
  
  .nav-tabs {
    border-bottom: none;
    flex-wrap: nowrap;
    overflow-x: auto;
    -webkit-overflow-scrolling: touch;
    scrollbar-width: none;
  }
  
  .nav-tabs::-webkit-scrollbar {
    display: none;
  }
  
  .nav-tabs .nav-link {
    color: var(--bs-gray-700);
    font-weight: 500;
    border: none;
    padding: 0.75rem 1.5rem;
    position: relative;
    font-size: 1.1rem;
    white-space: nowrap;
  }
  
  .nav-tabs .nav-link:hover {
    color: var(--bs-primary);
    background: rgba(var(--bs-primary-rgb), 0.05);
  }
  
  .nav-tabs .nav-link.active {
    color: var(--bs-primary);
    background: transparent;
    border: none;
  }
  
  .nav-tabs .nav-link.active::after {
    content: '';
    position: absolute;
    bottom: 0;
    left: 1rem;
    right: 1rem;
    height: 3px;
    background: var(--bs-primary);
    border-radius: 3px 3px 0 0;
  }
  
  .bg-purple-subtle {
    background-color: rgba(111, 66, 193, 0.1) !important;
  }
  
  .text-purple {
    color: #6f42c1 !important;
  }
  
  @media (min-width: 992px) {
    .card-body {
      padding: 2rem !important;
    }
  }
  </style>