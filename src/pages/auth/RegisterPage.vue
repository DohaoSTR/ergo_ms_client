<script setup>
import { reactive, ref } from 'vue'
import { useRouter } from 'vue-router'

import { validateRegistrationForm, validateRegistrationMethod } from '@/js/validation'

import { registration } from '@/js/api/services/auth-index';

const router = useRouter()
const loggedIn = ref(false)
const successMessage = ref('')

// Форма
const form = reactive({
  name: '',
  login: '',
  email: '',
  password: '',
  passwordConfirm: '',
  terms: false,
})

// Ошибки валидации
const errors = reactive({
  name: null,
  login: null,
  email: null,
  password: null,
  passwordConfirm: null,
  terms: null,
})

// Проверка всей формы
const validateForm = () => {
  const validationErrors =  validateRegistrationForm(
    form.name, 
    form.login,
    form.email,
    form.password,
    form.passwordConfirm,
    form.terms,
  );

  errors.name = validationErrors.name;
  errors.login = validationErrors.login;
  errors.email = validationErrors.email;
  errors.password = validationErrors.password;
  errors.passwordConfirm = validationErrors.passwordConfirm;
  errors.terms = validationErrors.terms;

  return (
    !errors.name &&
    !errors.login &&
    !errors.email &&
    !errors.password &&
    !errors.passwordConfirm &&
    !errors.terms
  )
}

const route = useRoute();

// Обработка формы
const submitForm = async () => {
  if (validateForm()) {
    loggedIn.value = true
    successMessage.value = ''

    const url_id = route.query.url_id;
    try {
        const registrationResult = await registration(
        form.name, 
        form.login, 
        form.email, 
        form.password,
        url_id,
        )


      if (registrationResult.success === true)
      {
        router.push({ name: 'Login' })
      }
      else
      {
        const validationErrors = validateRegistrationMethod(registrationResult.errors)

        errors.name = validationErrors.name;
        errors.login = validationErrors.login;
        errors.email = validationErrors.email;
        errors.password = validationErrors.password;
        errors.passwordConfirm = validationErrors.passwordConfirm;

        loggedIn.value = false;
      } 
    }
    catch
      {
      console.error('Registration error:', error);
    }
  }
}
</script>

<template>
  <div class="d-flex justify-content-center align-items-center" style="height: 100vh">
    <div class="card" style="width: 500px">
      <div class="auth__title mb-4 fs-3 fw-bold text-center no-select">Регистрация</div>

      <form @submit.prevent="submitForm" novalidate>
        <div class="form-floating mb-3 no-select" v-auto-animate>
          <input  type="name"
                  id="name"
                  class="form-control no-select"
                  :class="{ 'is-invalid': errors.name }"
                  v-model="form.name"
                  placeholder="name"
          />
          <label for="name" class="no-select">Имя пользователя</label>
          <div v-if="errors.name" class="invalid-feedback no-select">
            {{ errors.name }}
          </div>
        </div>

        <div class="form-floating mb-3 no-select" v-auto-animate>
          <input  type="login"
                  id="login"
                  class="form-control no-select"
                  :class="{ 'is-invalid': errors.login }"
                  v-model="form.login"
                  placeholder="login"
          />
          <label for="login" class="no-select">Логин</label>
          <div v-if="errors.login" class="invalid-feedback no-select">
            {{ errors.login }}
          </div>
        </div>

        <div class="form-floating mb-3 no-select" v-auto-animate>
          <input
            type="email"
            id="email"
            class="form-control no-select"
            :class="{ 'is-invalid': errors.email }"
            v-model="form.email"
            placeholder="Email"
          />
          <label for="email" class="no-select">Email</label>
          <div v-if="errors.email" class="invalid-feedback no-select">
            {{ errors.email }}
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
          <label for="password" class="no-select">Пароль</label>
          <div v-if="errors.password" class="invalid-feedback no-select">
            {{ errors.password }}
          </div>
        </div>

        <div class="form-floating mb-3" v-auto-animate>
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

        <div class="form-check mb-3" v-auto-animate>
          <input type="checkbox" id="terms" class="form-check-input no-select" v-model="form.terms" />
          <label class="form-check-label no-select" for="terms">
            Я согласен с
            <a href="/terms" class="text-decoration-none no-select">пользовательским соглашением</a>
          </label>
          <div v-if="errors.terms" class="text-danger small no-select">
            {{ errors.terms }}
          </div>
        </div>

        <button type="submit" class="btn btn-primary w-100" :disabled="loggedIn">
          <span
            v-if="loggedIn"
            class="spinner-border spinner-border-sm"
            role="status"
            aria-hidden="true"
          ></span>
          {{ loggedIn ? 'Регистрация...' : 'Зарегистрироваться' }}
        </button>

        <div class="mt-3 text-center no-select">
          Есть аккаунт?
          <RouterLink :to="{ name: 'Login' }" class="text-decoration-none"> Войти </RouterLink>
        </div>
      </form>
    </div>
  </div>
</template>

<style lang="scss" scoped></style>
