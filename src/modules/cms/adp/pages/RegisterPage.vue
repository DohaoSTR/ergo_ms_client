<script setup>
import { reactive, ref } from 'vue'
import { useRouter } from 'vue-router'
import { registration, validateRegistration } from '@/modules/cms/adp/js/auth-index'
import { validateRegistrationForm } from '@/js/validation'

const router = useRouter()
const isLoading = ref(false)
const isSuccess = ref(false)

const form = reactive({
  firstName: '',
  login: '',
  email: '',
  password: '',
  passwordConfirm: '',
  terms: false,
})

const errors = reactive({
  firstName: null,
  login: null,
  email: null,
  password: null,
  passwordConfirm: null,
  terms: null,
  general: null,
})



const validateForm = () => {
  const validationErrors = validateRegistrationForm(
    form.firstName,
    form.login,
    form.email,
    form.password,
    form.passwordConfirm,
    form.terms
  )

  Object.keys(validationErrors).forEach(key => {
    if (key === 'name') {
      errors.firstName = validationErrors[key]
    } else {
      errors[key] = validationErrors[key]
    }
  })

  errors.general = null

  return Object.values(validationErrors).every(error => error === null)
}

const submitForm = async () => {
  if (!validateForm()) {
    return
  }

  isLoading.value = true
  errors.general = null
  
  try {
    // Регистрируем пользователя напрямую (быстрая регистрация)
    const registrationResult = await registration(
      form.firstName,
      form.login,
      form.email,
      form.password
    )

    if (registrationResult.success) {
      // Показываем уведомление об успешной регистрации
      showSuccessMessage()
      
      // Перенаправляем на страницу входа через 0.5 секунды
      setTimeout(() => {
        router.push({ name: 'Login' })
      }, 1000)
    } else {
      handleServerErrors(registrationResult.errors)
    }
  } catch (error) {
    console.error('Registration error:', error)
    
    if (error.response) {
      if (error.response.status === 400) {
        const errorData = error.response.data
        handleServerErrors(errorData)
      } else if (error.response.status >= 500) {
        errors.general = 'Ошибка сервера. Попробуйте позже'
      } else {
        errors.general = 'Ошибка подключения к серверу'
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

const handleServerErrors = (serverErrors) => {
  if (!serverErrors) {
    errors.general = 'Произошла ошибка при регистрации'
    return
  }

  // Очищаем предыдущие ошибки
  Object.keys(errors).forEach(key => {
    if (key !== 'general') errors[key] = null
  })

  if (typeof serverErrors === 'string') {
    errors.general = serverErrors
    return
  }

  // Обрабатываем ошибки полей
  if (serverErrors.first_name) {
    errors.firstName = Array.isArray(serverErrors.first_name) 
      ? serverErrors.first_name[0] 
      : serverErrors.first_name
  }
  
  if (serverErrors.username) {
    errors.login = Array.isArray(serverErrors.username)
      ? serverErrors.username[0]
      : serverErrors.username
  }
  
  if (serverErrors.email) {
    errors.email = Array.isArray(serverErrors.email)
      ? serverErrors.email[0]
      : serverErrors.email
  }
  
  if (serverErrors.password) {
    errors.password = Array.isArray(serverErrors.password)
      ? serverErrors.password[0]
      : serverErrors.password
  }

  if (serverErrors.message || serverErrors.detail) {
    errors.general = serverErrors.message || serverErrors.detail
  }

  // Если нет конкретных ошибок полей, показываем общую ошибку
  const hasFieldErrors = errors.firstName || errors.login || errors.email || errors.password
  if (!hasFieldErrors && !errors.general) {
    errors.general = 'Проверьте введенные данные'
  }
}

const showSuccessMessage = () => {
  isSuccess.value = true
}
</script>

<template>
  <div class="d-flex justify-content-center align-items-center min-vh-100 bg-light py-4">
    <div class="card shadow-sm border-0" style="width: 500px">
      <div class="card-body p-5">
        <div class="text-center mb-4">
          <div class="mb-3">
            <i :class="isSuccess ? 'bi bi-check-circle-fill text-success' : 'bi bi-person-plus text-primary'" 
               style="font-size: 3rem;"></i>
          </div>
          <h2 class="fw-bold text-primary mb-2">
            {{ isSuccess ? 'Регистрация завершена!' : 'Регистрация' }}
          </h2>
          <p class="text-muted">
            {{ isSuccess 
              ? 'Ваш аккаунт успешно создан. Перенаправляем на страницу входа...' 
              : 'Создайте новый аккаунт' 
            }}
          </p>
        </div>

        <!-- Сообщение об успешной регистрации -->
        <div v-if="isSuccess" class="text-center">
          <div class="alert alert-success" role="alert">
            <i class="bi bi-check-circle-fill me-2"></i>
            Регистрация прошла успешно! Теперь вы можете войти в систему.
          </div>
          
          <div class="spinner-border text-primary" role="status">
            <span class="visually-hidden">Загрузка...</span>
          </div>
          <p class="text-muted mt-2">Перенаправление на страницу входа...</p>
        </div>

        <!-- Общая ошибка -->
        <div v-if="errors.general && !isSuccess" class="alert alert-danger" role="alert">
          <i class="bi bi-exclamation-triangle-fill me-2"></i>
          {{ errors.general }}
        </div>

        <form v-if="!isSuccess" @submit.prevent="submitForm" novalidate>
          <!-- Имя -->
          <div class="form-floating mb-3" v-auto-animate>
            <input
              type="text"
              id="firstName"
              class="form-control"
              :class="{ 'is-invalid': errors.firstName }"
              v-model="form.firstName"
              placeholder="Имя"
              :disabled="isLoading"
              autocomplete="given-name"
            />
            <label for="firstName">
              <i class="bi bi-person me-2"></i>Имя
            </label>
            <div v-if="errors.firstName" class="invalid-feedback">
              {{ errors.firstName }}
            </div>
          </div>

          <!-- Логин -->
          <div class="form-floating mb-3" v-auto-animate>
            <input
              type="text"
              id="login"
              class="form-control"
              :class="{ 'is-invalid': errors.login }"
              v-model="form.login"
              placeholder="Логин"
              :disabled="isLoading"
              autocomplete="username"
            />
            <label for="login">
              <i class="bi bi-at me-2"></i>Логин
            </label>
            <div v-if="errors.login" class="invalid-feedback">
              {{ errors.login }}
            </div>
          </div>

          <!-- Email -->
          <div class="form-floating mb-3" v-auto-animate>
            <input
              type="email"
              id="email"
              class="form-control"
              :class="{ 'is-invalid': errors.email }"
              v-model="form.email"
              placeholder="email@example.com"
              :disabled="isLoading"
              autocomplete="email"
            />
            <label for="email">
              <i class="bi bi-envelope me-2"></i>Email
            </label>
            <div v-if="errors.email" class="invalid-feedback">
              {{ errors.email }}
            </div>
          </div>

          <!-- Пароль -->
          <div class="form-floating mb-3" v-auto-animate>
            <input
              type="password"
              id="password"
              class="form-control"
              :class="{ 'is-invalid': errors.password }"
              v-model="form.password"
              placeholder="Пароль"
              :disabled="isLoading"
              autocomplete="new-password"
            />
            <label for="password">
              <i class="bi bi-lock me-2"></i>Пароль
            </label>
            <div v-if="errors.password" class="invalid-feedback">
              {{ errors.password }}
            </div>
          </div>

          <!-- Подтверждение пароля -->
          <div class="form-floating mb-3" v-auto-animate>
            <input
              type="password"
              id="passwordConfirm"
              class="form-control"
              :class="{ 'is-invalid': errors.passwordConfirm }"
              v-model="form.passwordConfirm"
              placeholder="Подтвердите пароль"
              :disabled="isLoading"
              autocomplete="new-password"
            />
            <label for="passwordConfirm">
              <i class="bi bi-lock-fill me-2"></i>Подтвердите пароль
            </label>
            <div v-if="errors.passwordConfirm" class="invalid-feedback">
              {{ errors.passwordConfirm }}
            </div>
          </div>

          <!-- Соглашение -->
          <div class="form-check mb-4" v-auto-animate>
            <input
              type="checkbox"
              id="terms"
              class="form-check-input"
              :class="{ 'is-invalid': errors.terms }"
              v-model="form.terms"
              :disabled="isLoading"
            />
            <label class="form-check-label text-muted" for="terms">
              Я согласен с 
              <a href="#" class="text-primary text-decoration-none">условиями использования</a>
              и 
              <a href="#" class="text-primary text-decoration-none">политикой конфиденциальности</a>
            </label>
            <div v-if="errors.terms" class="invalid-feedback d-block">
              {{ errors.terms }}
            </div>
          </div>

          <!-- Кнопка регистрации -->
          <button type="submit" class="btn btn-primary w-100 py-3 mb-3" :disabled="isLoading">
            <span
              v-if="isLoading"
              class="spinner-border spinner-border-sm me-2"
              role="status"
              aria-hidden="true"
            ></span>
            <i v-else class="bi bi-person-plus me-2"></i>
            {{ isLoading ? 'Регистрация...' : 'Зарегистрироваться' }}
          </button>

          <!-- Ссылка на вход -->
          <div class="text-center">
            <span class="text-muted">Уже есть аккаунт? </span>
            <RouterLink :to="{ name: 'Login' }" class="text-decoration-none text-primary fw-semibold">
              Войти
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