<template>
  <div class="avatar-demo p-4">
    <h3>Демонстрация локальных аватаров</h3>
    <p class="text-muted">Теперь аватары генерируются локально без использования интернета</p>
    
    <div class="row g-4">
      <div class="col-md-6">
        <h5>Примеры аватаров пользователей:</h5>
        <div class="avatar-examples">
          <div v-for="user in demoUsers" :key="user.id" class="avatar-example d-flex align-items-center mb-3">
            <img :src="getAvatarUrl(user, 40)" 
                 :alt="user.full_name"
                 class="member-avatar me-3">
            <div>
              <div class="fw-bold">{{ user.full_name }}</div>
              <small class="text-muted">{{ user.email }}</small>
            </div>
          </div>
        </div>
      </div>
      
      <div class="col-md-6">
        <h5>Разные размеры аватаров:</h5>
        <div class="size-examples">
          <div class="d-flex align-items-center gap-3 mb-3">
            <img :src="getAvatarUrl(demoUsers[0], 24)" 
                 alt="24px"
                 style="width: 24px; height: 24px; border-radius: 50%;">
            <span>24px (для задач в канбан)</span>
          </div>
          <div class="d-flex align-items-center gap-3 mb-3">
            <img :src="getAvatarUrl(demoUsers[0], 32)" 
                 alt="32px"
                 style="width: 32px; height: 32px; border-radius: 50%;">
            <span>32px (для списков проектов)</span>
          </div>
          <div class="d-flex align-items-center gap-3 mb-3">
            <img :src="getAvatarUrl(demoUsers[0], 40)" 
                 alt="40px"
                 style="width: 40px; height: 40px; border-radius: 50%;">
            <span>40px (для команды проекта)</span>
          </div>
        </div>
      </div>
    </div>
    
    <div class="mt-4">
      <h5>Особенности новых аватаров:</h5>
      <ul class="list-unstyled">
        <li class="mb-2">
          <i class="fas fa-check text-success me-2"></i>
          Работают без подключения к интернету
        </li>
        <li class="mb-2">
          <i class="fas fa-check text-success me-2"></i>
          Генерируются на основе инициалов пользователя
        </li>
        <li class="mb-2">
          <i class="fas fa-check text-success me-2"></i>
          Уникальные цвета для каждого пользователя
        </li>
        <li class="mb-2">
          <i class="fas fa-check text-success me-2"></i>
          Быстрая загрузка и отображение
        </li>
        <li class="mb-2">
          <i class="fas fa-check text-success me-2"></i>
          Поддержка существующих аватаров пользователей
        </li>
      </ul>
    </div>
  </div>
</template>

<script>
import { getAvatarUrl } from '@/js/utils/avatarUtils.js'

export default {
  name: 'AvatarDemo',
  data() {
    return {
      demoUsers: [
        {
          id: 1,
          full_name: 'Алексей Петров',
          email: 'alexey.petrov@example.com'
        },
        {
          id: 2,
          full_name: 'Мария Иванова',
          email: 'maria.ivanova@example.com'
        },
        {
          id: 3,
          full_name: 'Дмитрий Сидоров',
          email: 'dmitry.sidorov@example.com'
        },
        {
          id: 4,
          full_name: 'Елена Васильева',
          email: 'elena.vasilyeva@example.com'
        },
        {
          id: 5,
          full_name: 'Андрей Козлов',
          email: 'andrey.kozlov@example.com'
        }
      ]
    }
  },
  methods: {
    getAvatarUrl
  }
}
</script>

<style scoped>
.avatar-demo {
  background: white;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.avatar-example {
  padding: 0.75rem;
  background: var(--bs-gray-100);
  border-radius: 6px;
  transition: background-color 0.2s ease;
}

.avatar-example:hover {
  background: var(--bs-gray-200);
}

.size-examples > div {
  padding: 0.5rem;
  background: var(--bs-gray-100);
  border-radius: 6px;
}
</style> 