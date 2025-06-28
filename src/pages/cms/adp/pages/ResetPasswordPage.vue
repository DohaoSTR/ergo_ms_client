<script setup>
import { reactive, ref, onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import PasswordInput from '@/pages/cms/adp/components/PasswordInput.vue'
import { validateFieldValue, validateFieldsOnEquality } from '@/js/validation'

const router = useRouter()
const route = useRoute()
const isLoading = ref(false)
const isSuccess = ref(false)

const form = reactive({
  email: '',
  code: '',
  password: '',
  passwordConfirm: '',
})

const errors = reactive({
  code: null,
  password: null,
  passwordConfirm: null,
  general: null,
})

onMounted(() => {
  if (route.query.email) {
    form.email = route.query.email
  }
  if (route.query.code) {
    form.code = route.query.code
  }
})

const validateForm = () => {
  errors.code = validateFieldValue(form.code, 'Код подтверждения')
  errors.password = validateFieldValue(form.password, 'Новый пароль')
  errors.passwordConfirm = validateFieldValue(form.passwordConfirm, 'Подтверждение пароля')
  
  // Проверяем минимальную длину пароля
  if (!errors.password && form.password.length < 8) {
    errors.password = 'Пароль должен быть не менее 8 символов'
  }
  
  // Проверяем совпадение паролей
  if (!errors.password && !errors.passwordConfirm) {
    const { firstFieldError, secondFieldError } = validateFieldsOnEquality(
      form.password,
      form.passwordConfirm,
      'Пароли не совпадают'
    )
    errors.password = firstFieldError
    errors.passwordConfirm = secondFieldError
  }
  
  errors.general = null
  return !errors.code && !errors.password && !errors.passwordConfirm
}

const submitForm = async () => {
  if (!validateForm()) {
    return
  }

  isLoading.value = true
  errors.general = null
  
  try {
    // Здесь должен быть вызов API для сброса пароля
    // const result = await resetPassword(form.email, form.code, form.password)
    
    // Временная имитация успешного сброса
    await new Promise(resolve => setTimeout(resolve, 2000))
    
    isSuccess.value = true
    setTimeout(() => {
      router.push({ name: 'Login' })
    }, 3000)
    
  } catch (error) {
    console.error('Reset password error:', error)
    
    if (error.response) {
      if (error.response.status === 400) {
        const errorData = error.response.data
        if (errorData && errorData.code) {
          errors.code = Array.isArray(errorData.code) 
            ? errorData.code[0] 
            : errorData.code
        } else if (errorData && errorData.password) {
          errors.password = Array.isArray(errorData.password)
            ? errorData.password[0]
            : errorData.password
        } else {
          errors.general = 'Неверный код или данные'
        }
      } else if (error.response.status >= 500) {
        errors.general = 'Ошибка сервера. Попробуйте позже'
      } else {
        errors.general = 'Ошибка сброса пароля'
      }
    } else if (error.request) {
      errors.general = 'Нет соединения с сервером'
    } else {
      errors.general = 'Произошла неизвестная ошибка'
    }
  } finally {
    isLoading.value = false
  }
}
</script>

<template>
  <div class="d-flex justify-content-center align-items-center min-vh-100 bg-light">
    <div class="card shadow-sm border-0" style="width: 500px">
      <div class="card-body p-5">
        <div class="text-center mb-4">
          <div class="mb-3">
            <i :class="isSuccess ? 'bi bi-check-circle-fill text-success' : 'bi bi-shield-lock text-primary'" 
               style="font-size: 3rem;"></i>
          </div>
          <h2 class="fw-bold text-primary mb-2">
            {{ isSuccess ? 'Пароль изменен!' : 'Новый пароль' }}
          </h2>
          <p class="text-muted">
            {{ isSuccess 
              ? 'Ваш пароль успешно изменен. Перенаправляем на страницу входа...' 
              : 'Создайте новый пароль для вашего аккаунта' 
            }}
          </p>
        </div>

        <div v-if="isSuccess" class="text-center">
          <div class="alert alert-success" role="alert">
            <i class="bi bi-check-circle-fill me-2"></i>
            Пароль успешно изменен!
          </div>
          
          <div class="spinner-border text-primary" role="status">
            <span class="visually-hidden">Загрузка...</span>
          </div>
          <p class="text-muted mt-2">Перенаправление на страницу входа...</p>
        </div>

        <form v-else @submit.prevent="submitForm" novalidate>
          <!-- Общая ошибка -->
          <div v-if="errors.general" class="alert alert-danger" role="alert">
            <i class="bi bi-exclamation-triangle-fill me-2"></i>
            {{ errors.general }}
          </div>

          <!-- Email (только для отображения) -->
          <div class="form-floating mb-3">
            <input
              type="email"
              id="email"
              class="form-control"
              v-model="form.email"
              placeholder="email@example.com"
              readonly
            />
            <label for="email">
              <i class="bi bi-envelope me-2"></i>Email
            </label>
          </div>

          <!-- Поле кода -->
          <div class="form-floating mb-3" v-auto-animate>
            <input
              type="text"
              id="code"
              class="form-control"
              :class="{ 'is-invalid': errors.code }"
              v-model="form.code"
              placeholder="Код подтверждения"
              :disabled="isLoading"
              maxlength="6"
            />
            <label for="code">
              <i class="bi bi-shield-check me-2"></i>Код подтверждения
            </label>
            <div v-if="errors.code" class="invalid-feedback">
              {{ errors.code }}
            </div>
          </div>

          <!-- Новый пароль -->
          <PasswordInput
            id="password"
            v-model="form.password"
            :error="errors.password"
            label="Новый пароль"
            placeholder="Новый пароль"
            autocomplete="new-password"
            :disabled="isLoading"
            class="mb-3"
          />

          <!-- Подтверждение пароля -->
          <PasswordInput
            id="passwordConfirm"
            v-model="form.passwordConfirm"
            :error="errors.passwordConfirm"
            label="Подтвердите пароль"
            placeholder="Подтвердите пароль"
            autocomplete="new-password"
            icon="bi-lock-fill"
            :disabled="isLoading"
            class="mb-4"
          />

          <!-- Кнопка сброса -->
          <button type="submit" class="btn btn-primary w-100 py-3 mb-3" :disabled="isLoading">
            <span
              v-if="isLoading"
              class="spinner-border spinner-border-sm me-2"
              role="status"
              aria-hidden="true"
            ></span>
            <i v-else class="bi bi-shield-check me-2"></i>
            {{ isLoading ? 'Изменение пароля...' : 'Изменить пароль' }}
          </button>

          <!-- Ссылка на вход -->
          <div class="text-center">
            <RouterLink :to="{ name: 'Login' }" class="text-decoration-none text-primary">
              <i class="bi bi-arrow-left me-2"></i>
              Вернуться к входу
            </RouterLink>
          </div>
        </form>
      </div>
    </div>
  </div>
</template>

<style lang="scss" scoped>
.card {
  border-radius: 1rem;
}

.form-control:focus {
  border-color: #0d6efd;
  box-shadow: 0 0 0 0.2rem rgba(13, 110, 253, 0.25);
}

.btn-primary {
  border-radius: 0.5rem;
  font-weight: 600;
}

.alert {
  border-radius: 0.5rem;
  border: none;
}

.min-vh-100 {
  min-height: 100vh;
}

@media (max-width: 576px) {
  .card {
    width: 95% !important;
    margin: 1rem;
  }
  
  .card-body {
    padding: 2rem 1.5rem !important;
  }
}
</style> 