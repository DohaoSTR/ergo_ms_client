<template>
  <div class="alert fs-4 text-center alert-warning">
    <p>Профиль не найден. Пожалуйста, убедитесь, что вы вошли в систему.</p>
    <div class="text-center mt-3">
      <button
        type="button"
        class="btn btn-primary"
        @click="goRegister"
      >
        Зарегистрироваться
      </button>
    </div>
  </div>
</template>

<script setup>
import { useRouter } from 'vue-router'

const router = useRouter()

function goRegister() {
  router.push({ name: 'ChoiceRole' })
}
</script>

<style scoped>
.alert {
  margin: 0 auto;
}
</style>
