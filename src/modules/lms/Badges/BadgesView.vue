<script setup>
import { ref, computed, onMounted } from 'vue'
import { Award, Star, Lock, CheckCircle, Filter, Users, Target, TrendingUp } from 'lucide-vue-next'
import { apiClient } from '@/js/api/manager'
import { endpoints } from '@/js/api/endpoints'
import { globalUserRole } from '../composables/useUserRole'

const badges = ref([])
const userBadges = ref([])
const loading = ref(true)
const selectedCategory = ref('all')
const userRole = globalUserRole

// Статистика достижений
const badgeStats = computed(() => {
  const earned = userBadges.value.length
  const total = badges.value.length
  const progressPercentage = total > 0 ? (earned / total) * 100 : 0
  
  const categories = [...new Set(badges.value.map(b => b.category || 'Общие'))]
  const earnedByCategory = categories.map(category => {
    const categoryBadges = badges.value.filter(b => (b.category || 'Общие') === category)
    const categoryEarned = categoryBadges.filter(b => isEarned(b.id)).length
    return {
      category,
      earned: categoryEarned,
      total: categoryBadges.length,
      percentage: categoryBadges.length > 0 ? (categoryEarned / categoryBadges.length) * 100 : 0
    }
  })
  
  return {
    earned,
    total,
    progressPercentage,
    earnedByCategory
  }
})

// Фильтрованные значки
const filteredBadges = computed(() => {
  let filtered = badges.value
  
  if (selectedCategory.value !== 'all') {
    filtered = filtered.filter(badge => (badge.category || 'Общие') === selectedCategory.value)
  }
  
  // Сортируем: сначала полученные, потом по алфавиту
  return filtered.sort((a, b) => {
    const aEarned = isEarned(a.id)
    const bEarned = isEarned(b.id)
    
    if (aEarned && !bEarned) return -1
    if (!aEarned && bEarned) return 1
    
    return a.name.localeCompare(b.name)
  })
})

// Категории для фильтрации
const categories = computed(() => {
  const cats = [...new Set(badges.value.map(b => b.category || 'Общие'))]
  return cats.sort()
})

// Проверка получения значка
function isEarned(badgeId) {
  return userBadges.value.some(ub => ub.badge === badgeId)
}

// Получение информации о полученном значке
function getEarnedInfo(badgeId) {
  return userBadges.value.find(ub => ub.badge === badgeId)
}

// Загрузка данных
async function loadBadges() {
  try {
    loading.value = true
    
    // Загружаем все доступные значки
    const badgesResponse = await apiClient.get(endpoints.lms.badges)
    if (badgesResponse.success) {
      badges.value = badgesResponse.data.results || badgesResponse.data
    }
    
    // Загружаем полученные пользователем значки
    const userBadgesResponse = await apiClient.get(endpoints.lms.userBadges)
    if (userBadgesResponse.success) {
      userBadges.value = userBadgesResponse.data.results || userBadgesResponse.data
    }
    
    // Если API не работает, показываем демо-данные
    if (!badgesResponse.success) {
      badges.value = [
        {
          id: 1,
          name: 'Первый курс',
          description: 'Записались на первый курс в системе обучения',
          badge_type: 'course_completion',
          category: 'Начинающий',
          criteria: 'Записаться на любой курс',
          is_active: true,
          image: null
        },
        {
          id: 2,
          name: 'Отличник',
          description: 'Получили 5 оценок "отлично" подряд',
          badge_type: 'perfect_quiz',
          category: 'Академические',
          criteria: 'Получить 5 оценок 90+ баллов подряд',
          is_active: true,
          image: null
        },
        {
          id: 3,
          name: 'Активный участник',
          description: 'Оставили 10 сообщений на форуме',
          badge_type: 'active_participant',
          category: 'Социальные',
          criteria: 'Написать 10 сообщений на форуме',
          is_active: true,
          image: null
        },
        {
          id: 4,
          name: 'Быстрый старт',
          description: 'Завершили первый урок за 24 часа после записи',
          badge_type: 'early_bird',
          category: 'Достижения',
          criteria: 'Завершить урок в течение 24 часов',
          is_active: true,
          image: null
        },
        {
          id: 5,
          name: 'Помощник',
          description: 'Помогли 5 студентам в форуме',
          badge_type: 'helpful',
          category: 'Социальные',
          criteria: 'Получить 5 благодарностей на форуме',
          is_active: true,
          image: null
        },
        {
          id: 6,
          name: 'Марафонец',
          description: 'Завершили 10 курсов',
          badge_type: 'course_completion',
          category: 'Академические',
          criteria: 'Успешно завершить 10 курсов',
          is_active: true,
          image: null
        }
      ]
      
      userBadges.value = [
        {
          id: 1,
          badge: 1,
          awarded_at: '2024-01-05T10:00:00Z',
          awarded_by: null
        },
        {
          id: 2,
          badge: 2,
          awarded_at: '2024-01-10T15:30:00Z',
          awarded_by: null
        },
        {
          id: 3,
          badge: 4,
          awarded_at: '2024-01-06T09:15:00Z',
          awarded_by: null
        }
      ]
    }
    
  } catch (error) {
    console.error('Ошибка загрузки значков:', error)
    // Показываем демо-данные при ошибке
    badges.value = [
      {
        id: 1,
        name: 'Первый курс',
        description: 'Записались на первый курс',
        badge_type: 'course_completion',
        category: 'Начинающий',
        criteria: 'Записаться на курс',
        is_active: true
      },
      {
        id: 2,
        name: 'Отличник',
        description: 'Получили отличные оценки',
        badge_type: 'perfect_quiz',
        category: 'Академические',
        criteria: 'Получить 5 отличных оценок',
        is_active: true
      }
    ]
    
    userBadges.value = [
      { id: 1, badge: 1, awarded_at: '2024-01-05T10:00:00Z' }
    ]
  } finally {
    loading.value = false
  }
}

// Получение иконки для типа значка
function getBadgeIcon(type) {
  switch (type) {
    case 'course_completion': return '🎓'
    case 'perfect_quiz': return '⭐'
    case 'active_participant': return '💬'
    case 'early_bird': return '⚡'
    case 'helpful': return '🤝'
    default: return '🏆'
  }
}

// Получение цвета категории
function getCategoryColor(category) {
  const colors = {
    'Начинающий': 'primary',
    'Академические': 'success',
    'Социальные': 'info',
    'Достижения': 'warning',
    'Общие': 'secondary'
  }
  return colors[category] || 'secondary'
}

onMounted(() => {
  userRole.loadUserRoles().then(() => {
    loadBadges()
  })
})
</script>

<template>
  <div class="badges-view">
    <!-- Заголовок -->
    <div class="d-flex justify-content-between align-items-center mb-4">
      <div>
        <h3 class="mb-1">
          <Award :size="28" class="me-2 text-primary" />
          Мои достижения
        </h3>
        <p class="text-muted mb-0">Отслеживайте свой прогресс и получайте награды за успехи</p>
      </div>
    </div>

    <!-- Загрузка -->
    <div v-if="loading" class="text-center py-5">
      <div class="spinner-border text-primary" role="status">
        <span class="visually-hidden">Загрузка...</span>
      </div>
      <p class="mt-3 text-muted">Загрузка достижений...</p>
    </div>

    <template v-else>
      <!-- Общая статистика -->
      <div class="row mb-4">
        <div class="col-lg-3 col-md-6 mb-3">
          <div class="card stats-card h-100">
            <div class="card-body text-center">
              <div class="stats-icon bg-success-subtle text-success mb-3">
                <CheckCircle :size="24" />
              </div>
              <h4 class="mb-1">{{ badgeStats.earned }}</h4>
              <p class="text-muted mb-0">Получено</p>
            </div>
          </div>
        </div>
        
        <div class="col-lg-3 col-md-6 mb-3">
          <div class="card stats-card h-100">
            <div class="card-body text-center">
              <div class="stats-icon bg-primary-subtle text-primary mb-3">
                <Target :size="24" />
              </div>
              <h4 class="mb-1">{{ badgeStats.total }}</h4>
              <p class="text-muted mb-0">Всего доступно</p>
            </div>
          </div>
        </div>
        
        <div class="col-lg-3 col-md-6 mb-3">
          <div class="card stats-card h-100">
            <div class="card-body text-center">
              <div class="stats-icon bg-warning-subtle text-warning mb-3">
                <TrendingUp :size="24" />
              </div>
              <h4 class="mb-1">{{ badgeStats.progressPercentage.toFixed(0) }}%</h4>
              <p class="text-muted mb-0">Прогресс</p>
            </div>
          </div>
        </div>
        
        <div class="col-lg-3 col-md-6 mb-3">
          <div class="card stats-card h-100">
            <div class="card-body text-center">
              <div class="stats-icon bg-info-subtle text-info mb-3">
                <Star :size="24" />
              </div>
              <h4 class="mb-1">{{ categories.length }}</h4>
              <p class="text-muted mb-0">Категорий</p>
            </div>
          </div>
        </div>
      </div>

      <!-- Прогресс по категориям -->
      <div class="card mb-4">
        <div class="card-header">
          <h6 class="mb-0">Прогресс по категориям</h6>
        </div>
        <div class="card-body">
          <div class="row">
            <div 
              v-for="categoryData in badgeStats.earnedByCategory" 
              :key="categoryData.category"
              class="col-lg-6 mb-3"
            >
              <div class="d-flex justify-content-between align-items-center mb-2">
                <span class="fw-medium">{{ categoryData.category }}</span>
                <span class="text-muted">{{ categoryData.earned }}/{{ categoryData.total }}</span>
              </div>
              <div class="progress" style="height: 8px;">
                <div 
                  class="progress-bar"
                  :class="`bg-${getCategoryColor(categoryData.category)}`"
                  :style="`width: ${categoryData.percentage}%`"
                ></div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Фильтры -->
      <div class="card mb-4">
        <div class="card-body">
          <div class="row align-items-center">
            <div class="col-lg-4 col-md-6 mb-3 mb-lg-0">
              <label class="form-label mb-1">
                <Filter :size="16" class="me-1" />
                Категория
              </label>
              <select v-model="selectedCategory" class="form-select">
                <option value="all">Все категории</option>
                <option 
                  v-for="category in categories" 
                  :key="category"
                  :value="category"
                >
                  {{ category }}
                </option>
              </select>
            </div>
            
            <div class="col-lg-8 col-md-6">
              <div class="d-flex align-items-center justify-content-end">
                <span class="text-muted">
                  Показано значков: <strong>{{ filteredBadges.length }}</strong>
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Список значков -->
      <div v-if="filteredBadges.length === 0" class="text-center py-5">
        <Award :size="48" class="text-muted mb-3" />
        <h5 class="text-muted">Значки не найдены</h5>
        <p class="text-muted">Попробуйте изменить фильтры</p>
      </div>

      <div v-else class="row">
        <div 
          v-for="badge in filteredBadges" 
          :key="badge.id" 
          class="col-lg-4 col-md-6 mb-4"
        >
          <div 
            class="card badge-card h-100" 
            :class="{ 'earned': isEarned(badge.id) }"
          >
            <div class="card-body text-center">
              <div class="badge-icon mb-3">
                <span class="icon-emoji">{{ getBadgeIcon(badge.badge_type) }}</span>
                <CheckCircle 
                  v-if="isEarned(badge.id)" 
                  :size="24" 
                  class="earned-check" 
                />
                <Lock 
                  v-else 
                  :size="24" 
                  class="locked-icon" 
                />
              </div>
              
              <h6 
                class="badge-name" 
                :class="{ 'text-muted': !isEarned(badge.id) }"
              >
                {{ badge.name }}
              </h6>
              
              <p class="badge-description text-muted small">
                {{ badge.description }}
              </p>
              
              <div class="badge-category mb-3">
                <span 
                  :class="`badge bg-${getCategoryColor(badge.category || 'Общие')}-subtle text-${getCategoryColor(badge.category || 'Общие')}`"
                >
                  {{ badge.category || 'Общие' }}
                </span>
              </div>
              
              <div v-if="isEarned(badge.id)" class="earned-info">
                <small class="text-success">
                  <CheckCircle :size="14" class="me-1" />
                  Получено {{ new Date(getEarnedInfo(badge.id).awarded_at).toLocaleDateString('ru') }}
                </small>
              </div>
              
              <div v-else class="locked-info">
                <div class="mb-2">
                  <small class="text-muted fw-medium">Как получить:</small>
                  <div class="criteria-text small text-muted">
                    {{ badge.criteria }}
                  </div>
                </div>
                <small class="text-muted">
                  <Lock :size="14" class="me-1" />
                  Заблокировано
                </small>
              </div>
            </div>
          </div>
        </div>
      </div>
    </template>
  </div>
</template>

<style lang="scss" scoped>
.badges-view {
  .stats-card {
    transition: transform 0.2s, box-shadow 0.2s;
    border: none;
    
    &:hover {
      transform: translateY(-2px);
      box-shadow: 0 4px 15px rgba(0, 0, 0, 0.1);
    }
  }
  
  .stats-icon {
    width: 60px;
    height: 60px;
    border-radius: 12px;
    display: flex;
    align-items: center;
    justify-content: center;
    margin: 0 auto;
  }
  
  .badge-card {
    transition: transform 0.2s, box-shadow 0.2s;
    border: 2px solid #e9ecef;
    
    &:hover {
      transform: translateY(-4px);
      box-shadow: 0 8px 25px rgba(0, 0, 0, 0.1);
    }
    
    &.earned {
      border-color: var(--bs-success);
      background: linear-gradient(135deg, #fff 0%, #f8f9fa 100%);
    }
  }
  
  .badge-icon {
    position: relative;
    display: inline-block;
  }
  
  .icon-emoji {
    font-size: 3rem;
    filter: grayscale(100%);
    transition: filter 0.3s;
  }
  
  .badge-card.earned .icon-emoji {
    filter: grayscale(0%);
  }
  
  .earned-check {
    position: absolute;
    top: -8px;
    right: -8px;
    background: white;
    border-radius: 50%;
    color: var(--bs-success);
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  }
  
  .locked-icon {
    position: absolute;
    top: -8px;
    right: -8px;
    background: white;
    border-radius: 50%;
    color: var(--bs-secondary);
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  }
  
  .badge-name {
    font-weight: 600;
  }
  
  .criteria-text {
    background: #f8f9fa;
    padding: 0.5rem;
    border-radius: 4px;
    margin-top: 0.25rem;
  }
}
</style> 