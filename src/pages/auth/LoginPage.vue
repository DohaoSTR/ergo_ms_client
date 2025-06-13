<script setup>
import { reactive, ref } from 'vue'
import { useRouter } from 'vue-router'

import { authorization } from '@/js/api/services/auth-index'

import { validateAuthorizationForm, validateAuthorizationMethod } from '@/js/validation'

const router = useRouter()
const loggedIn = ref(false)

const form = reactive({
  login: '',
  password: '',
  passwordConfirm: '',
  rememberUser: false,
})

const errors = reactive({
  login: null,
  password: null,
  passwordConfirm: null,
})

const validateForm = () => {
  const { loginError, passwordError, passwordConfirmError } = validateAuthorizationForm(
    form.login,
    form.password,
    form.passwordConfirm,
  )

  errors.login = loginError
  errors.password = passwordError
  errors.passwordConfirm = passwordConfirmError

  return !errors.login && !errors.password && !errors.passwordConfirm
}

const submitForm = async () => {
  if (validateForm()) {
    loggedIn.value = true

    const authResult = await authorization(form.login, form.password)

    if (authResult.success === true) {
      router.push({ name: 'Account' })
    } else {
      const { loginError, passwordError, passwordConfirmError } = validateAuthorizationMethod(
        authResult.errors,
      )

      errors.login = loginError
      errors.password = passwordError
      errors.passwordConfirm = passwordConfirmError

      loggedIn.value = false
    }
  }
}
</script>

<template>
  <div class="d-flex justify-content-center align-items-center" style="height: 100vh">
    <div class="card" style="width: 500px">
      <div class="auth__title mb-4 fs-3 fw-bold text-center no-select">Вход в аккаунт</div>

      <form @submit.prevent="submitForm" novalidate>
        <div class="form-floating mb-3 no-select" v-auto-animate>
          <input
            type="text"
            id="login"
            class="form-control"
            :class="{ 'is-invalid': errors.login }"
            v-model="form.login"
            placeholder="Логин"
          />
          <label for="login">Логин</label>
          <div v-if="errors.login" class="invalid-feedback no-select">
            {{ errors.login }}
          </div>
        </div>

        <div class="form-floating mb-3 no-select" v-auto-animate>
          <input
            type="password"
            id="password"
            class="form-control no-select"
            :class="{ 'is-invalid': errors.password }"
            v-model="form.password"
            placeholder="Пароль"
          />
          <label for="password">Пароль</label>
          <div v-if="errors.password" class="invalid-feedback no-select">
            {{ errors.password }}
          </div>
        </div>

        <div class="form-floating mb-3 no-select" v-auto-animate>
          <input
            type="password"
            id="passwordConfirm"
            class="form-control no-select"
            :class="{ 'is-invalid': errors.passwordConfirm }"
            v-model="form.passwordConfirm"
            placeholder="Подтверждение пароля"
          />
          <label for="passwordConfirm" class="no-select">Подтверждение пароля</label>
          <div v-if="errors.passwordConfirm" class="invalid-feedback no-select">
            {{ errors.passwordConfirm }}
          </div>
        </div>

        <div class="d-flex justify-content-between mt-8">
          <div class="form-check mb-3">
            <input
              type="checkbox"
              id="rememberUser"
              class="form-check-input"
              v-model="form.rememberUser"
            />
            <label class="form-check-label no-select" for="rememberUser">Запомнить меня</label>
          </div>

          <div class="mb-3 no-select">
            <RouterLink :to="{ name: 'ForgotPassword' }" class="text-decoration-none">
              Забыли пароль?
            </RouterLink>
          </div>
        </div>

        <button type="submit" class="btn btn-primary w-100" :disabled="loggedIn">
          <span
            v-if="loggedIn"
            class="spinner-border spinner-border-sm"
            role="status"
            aria-hidden="true"
          ></span>
          {{ loggedIn ? 'Выполняется вход...' : 'Войти' }}
        </button>

        <div class="mt-3 text-center no-select">
          Нет аккаунта?
          <RouterLink :to="{ name: 'Register' }" class="text-decoration-none">
            Зарегистрироваться
          </RouterLink>
        </div>
      </form>
    </div>
  </div>
</template>

<style lang="scss" scoped></style>
