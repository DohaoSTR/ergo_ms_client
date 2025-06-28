<script setup>
import { ref } from 'vue'
import SecuritySettings from './pages/SecuritySettings.vue'

const currentView = ref('dashboard')

const menuItems = [
  {
    id: 'dashboard',
    name: 'Главная',
    icon: 'dashboard',
  },
  {
    id: 'security',
    name: 'Безопасность',
    icon: 'shield',
  },
  {
    id: 'devices',
    name: 'Устройства',
    icon: 'devices',
  },
]

const setCurrentView = (viewId) => {
  currentView.value = viewId
}
</script>

<template>
  <div class="adp-layout">
    <div class="row">
      <!-- Боковое меню -->
      <div class="col-md-3 col-lg-2">
        <div class="card">
          <div class="card-header">
            <h5 class="card-title mb-0">ADP Модуль</h5>
          </div>
          <div class="list-group list-group-flush">
            <button
              v-for="item in menuItems"
              :key="item.id"
              @click="setCurrentView(item.id)"
              :class="{
                'list-group-item list-group-item-action': true,
                'active': currentView === item.id
              }"
            >
              {{ item.name }}
            </button>
          </div>
        </div>
      </div>

      <!-- Основной контент -->
      <div class="col-md-9 col-lg-10">
        <div v-if="currentView === 'dashboard'" class="card">
          <div class="card-body">
            <h5 class="card-title">Добро пожаловать в ADP</h5>
            <p class="card-text">
              Модуль аутентификации, авторизации и безопасности пользователей.
            </p>
            <div class="row">
              <div class="col-md-4">
                <div class="card bg-primary text-white">
                  <div class="card-body">
                    <h6>Активные сессии</h6>
                    <h3>12</h3>
                  </div>
                </div>
              </div>
              <div class="col-md-4">
                <div class="card bg-success text-white">
                  <div class="card-body">
                    <h6>Регистраций сегодня</h6>
                    <h3>5</h3>
                  </div>
                </div>
              </div>
              <div class="col-md-4">
                <div class="card bg-warning text-white">
                  <div class="card-body">
                    <h6>Неудачных входов</h6>
                    <h3>2</h3>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <SecuritySettings v-else-if="currentView === 'security'" />

        <div v-else-if="currentView === 'devices'" class="card">
          <div class="card-body">
            <h5 class="card-title">Управление устройствами</h5>
            <p class="card-text">
              Здесь будет расширенный интерфейс управления устройствами пользователей.
            </p>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped lang="scss">
.adp-layout {
  padding: 1rem;
}

.list-group-item {
  border: none;
  border-radius: 0;
  
  &:hover {
    background-color: var(--bs-light);
  }
  
  &.active {
    background-color: var(--bs-primary);
    border-color: var(--bs-primary);
  }
}

.card {
  box-shadow: 0 0.125rem 0.25rem rgba(0, 0, 0, 0.075);
  border: 1px solid rgba(0, 0, 0, 0.125);
}
</style> 