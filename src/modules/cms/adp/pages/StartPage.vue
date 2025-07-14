<template>
  <div class="welcome-container">
    <div>
      <h1>{{ message }}</h1>
    </div>
    <div class="d-flex justify-content-center align-items-center card-container">
      <div style="width: 500px">
        <button type="submit" class="btn btn-primary w-100" @click="navigateToLogin">
          Авторизация
        </button>
        <div class="mt-3 text-center no-select">
          Нет аккаунта?
          <RouterLink :to="{ name: 'Register' }" class="text-decoration-none">
            Зарегистрироваться
          </RouterLink>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { useRouter } from 'vue-router'

const message = 'Авторизуйтесь в системе.'

const router = useRouter()

const navigateToLogin = () => {
  router.push({ name: 'Login' })
}
</script>

<style lang="scss" scoped>
.welcome-container {
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  height: 100vh;
  text-align: center;
}

.card-container {
  width: 100%;
  display: flex;
  justify-content: center;
  align-items: center;
}

h1 {
  color: var(--color-primary-text);
  font-size: $font-size-h0;
  font-weight: bold;
  white-space: nowrap;
  text-overflow: ellipsis;
  user-select: none;
  margin-bottom: 20px;
}
</style>
