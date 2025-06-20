<script setup>
import { ref, onMounted } from 'vue'
import { Award, Star, Lock, CheckCircle } from 'lucide-vue-next'

const badges = ref([])

function fetchBadges() {
  badges.value = [
    {
      id: 1,
      name: 'Первый курс',
      description: 'Записались на первый курс',
      icon: '🎓',
      earned: true,
      earnedDate: '2024-01-05',
      category: 'Начинающий'
    },
    {
      id: 2,
      name: 'Отличник',
      description: 'Получили 5 оценок "отлично"',
      icon: '⭐',
      earned: true,
      earnedDate: '2024-01-10',
      category: 'Академические'
    },
    {
      id: 3,
      name: 'Активный участник',
      description: 'Оставили 10 сообщений на форуме',
      icon: '💬',
      earned: false,
      progress: 7,
      target: 10,
      category: 'Социальные'
    },
    {
      id: 4,
      name: 'Быстрый старт',
      description: 'Завершили первый урок за 24 часа',
      icon: '⚡',
      earned: true,
      earnedDate: '2024-01-06',
      category: 'Достижения'
    }
  ]
}

onMounted(fetchBadges)
</script>

<template>
  <div class="badges-view">
    <h3 class="mb-4">Мои достижения</h3>
    
    <div class="row">
      <div v-for="badge in badges" :key="badge.id" class="col-lg-4 col-md-6 mb-4">
        <div class="card badge-card h-100" :class="{ 'earned': badge.earned }">
          <div class="card-body text-center">
            <div class="badge-icon mb-3">
              <span class="icon-emoji">{{ badge.icon }}</span>
              <CheckCircle v-if="badge.earned" :size="24" class="earned-check" />
              <Lock v-else :size="24" class="locked-icon" />
            </div>
            
            <h6 class="badge-name" :class="{ 'text-muted': !badge.earned }">
              {{ badge.name }}
            </h6>
            
            <p class="badge-description text-muted small">
              {{ badge.description }}
            </p>
            
            <div class="badge-category mb-2">
              <span class="badge bg-light text-dark">{{ badge.category }}</span>
            </div>
            
            <div v-if="badge.earned" class="earned-info">
              <small class="text-success">
                <CheckCircle :size="14" class="me-1" />
                Получено {{ new Date(badge.earnedDate).toLocaleDateString('ru') }}
              </small>
            </div>
            
            <div v-else-if="badge.progress !== undefined" class="progress-info">
              <div class="progress mb-2" style="height: 6px;">
                <div 
                  class="progress-bar" 
                  :style="`width: ${(badge.progress / badge.target) * 100}%`"
                ></div>
              </div>
              <small class="text-muted">
                {{ badge.progress }}/{{ badge.target }}
              </small>
            </div>
            
            <div v-else class="locked-info">
              <small class="text-muted">
                <Lock :size="14" class="me-1" />
                Заблокировано
              </small>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.badge-card {
  transition: transform 0.2s, box-shadow 0.2s;
  border: 2px solid transparent;
}

.badge-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 8px 25px rgba(0, 0, 0, 0.1);
}

.badge-card.earned {
  border-color: var(--bs-success);
  background: linear-gradient(135deg, #fff 0%, #f8f9fa 100%);
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
}

.locked-icon {
  position: absolute;
  top: -8px;
  right: -8px;
  background: white;
  border-radius: 50%;
  color: var(--bs-secondary);
}

.badge-name {
  font-weight: 600;
}

.progress-info .progress {
  background: var(--bs-gray-200);
}
</style> 