<script setup>
import { ref, onMounted, computed } from 'vue'
import { useToast } from 'vue-toastification'
import { 
  Check, Crown, Flag, Languages, Link, Mail, Phone, UserRound, 
  Edit3, Save, X, MapPin, Globe, Calendar, Shield, User, Upload, RotateCcw
} from 'lucide-vue-next'
import { useProfile } from '@/js/api/services/profileService.js'
import { useUserStore } from '@/stores/userStore.js'
import { apiClient } from '@/js/api/manager'
import { endpoints } from '@/js/api/endpoints'
import { displayPhone } from '@/js/utils/phoneUtils.js'

const toast = useToast()
const userStore = useUserStore()
const { getProfile, updateProfile, formatProfileData, validateProfileData } = useProfile()

// Состояние компонента
const loading = ref(true)
const editing = ref(false)
const saving = ref(false)
const profileData = ref(null)
const formData = ref({})
const errors = ref({})

// Состояние аватара
const avatarInput = ref(null)
const avatarUrl = ref('/src/assets/avatars/avatar-1.png')
const avatarLoading = ref(false)
const avatarError = ref('')

// Получение аватара
async function fetchAvatar() {
  avatarLoading.value = true
  avatarError.value = ''
  try {
    const resp = await apiClient.get(endpoints.userAvatars.list)
    if (resp.data.length && resp.data[0].image) {
      avatarUrl.value = resp.data[0].image
    } else {
      avatarUrl.value = '/src/assets/avatars/avatar-1.png'
    }
  } catch (e) {
    avatarError.value = 'Ошибка загрузки аватара'
    avatarUrl.value = '/src/assets/avatars/avatar-1.png'
  } finally {
    avatarLoading.value = false
  }
}

// Изменение аватара
const changeAvatar = async (event) => {
  const file = event.target.files[0]
  if (!file || !file.type.startsWith('image/')) {
    toast.error('Пожалуйста, выберите изображение!')
    return
  }
  avatarUrl.value = URL.createObjectURL(file)

  const formData = new FormData()
  formData.append('image', file)
  avatarLoading.value = true
  avatarError.value = ''
  try {
    await apiClient.post(endpoints.userAvatars.create, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    })
    await fetchAvatar()
    
    // Обновляем аватар в userStore для мгновенного отображения во всех компонентах
    await userStore.loadAvatar()
    await userStore.loadProfile()
    
    toast.success('Аватар успешно обновлён')
  } catch (e) {
    avatarError.value = 'Ошибка загрузки'
    toast.error('Ошибка загрузки аватара')
  } finally {
    avatarLoading.value = false
  }
}

// Сброс аватара
async function cancelAvatarUpload() {
  try {
    // Сначала меняем изображение локально для мгновенного отображения
    avatarUrl.value = '/src/assets/avatars/avatar-1.png'
    
    const resp = await apiClient.get(endpoints.userAvatars.list)
    if (resp.data.length) {
      await apiClient.delete(endpoints.userAvatars.delete(resp.data[0].id))
    }
    
    // Обновляем аватар в userStore для мгновенного отображения во всех компонентах
    await userStore.loadAvatar()
    await userStore.loadProfile()
    
    toast.success('Аватар сброшен')
  } catch (e) {
    avatarError.value = 'Ошибка сброса аватара'
    toast.error('Ошибка сброса аватара')
    // В случае ошибки возвращаем аватар обратно
    await fetchAvatar()
  }
}

// Получение данных профиля
const fetchProfile = async () => {
  try {
    loading.value = true
    const response = await getProfile()
    profileData.value = formatProfileData(response)
    
    // Инициализируем форму данными профиля
    if (profileData.value) {
      formData.value = {
        first_name: profileData.value.firstName,
        last_name: profileData.value.lastName,
        email: profileData.value.email,
        phone: profileData.value.phone,
        website: profileData.value.website,
        bio: profileData.value.bio,
        country: profileData.value.country,
        city: profileData.value.city,
        language: profileData.value.language,
      }
    }
  } catch (error) {
    console.error('Ошибка загрузки профиля:', error)
    toast.error('Ошибка загрузки данных профиля')
    profileData.value = null
  } finally {
    loading.value = false
  }
}

// Вычисляемые свойства для отображения
const displayData = computed(() => {
  if (!profileData.value) return null
  
  return {
    fullName: profileData.value.fullName || 'Не указано',
    status: profileData.value.isActive,
    email: profileData.value.email || 'Не указан',
    phone: displayPhone(profileData.value.phone) || '',
    website: profileData.value.website || 'Не указан',
    country: profileData.value.country || 'Не указана',
    city: profileData.value.city || 'Не указан',
    language: getLanguageName(profileData.value.language),
    bio: profileData.value.bio || 'Не указано',
    memberSince: formatDate(profileData.value.dateJoined)
  }
})

// Функции-помощники
const getLanguageName = (langCode) => {
  const languages = {
    'ru': 'Русский',
    'en': 'English',
    'uk': 'Українська',
    'be': 'Беларуская'
  }
  return languages[langCode] || 'Русский'
}

const formatDate = (dateString) => {
  if (!dateString) return 'Неизвестно'
  return new Date(dateString).toLocaleDateString('ru-RU', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  })
}

// Управление редактированием
const startEditing = () => {
  if (!profileData.value) {
    toast.error('Сначала необходимо загрузить данные профиля')
    return
  }
  editing.value = true
  errors.value = {}
}

const cancelEditing = () => {
  editing.value = false
  errors.value = {}
  // Восстанавливаем исходные данные только если профиль загружен
  if (profileData.value) {
    formData.value = {
      first_name: profileData.value.firstName,
      last_name: profileData.value.lastName,
      email: profileData.value.email,
      phone: profileData.value.phone,
      website: profileData.value.website,
      bio: profileData.value.bio,
      country: profileData.value.country,
      city: profileData.value.city,
      language: profileData.value.language,
    }
  }
}

const saveProfile = async () => {
  try {
    saving.value = true
    errors.value = {}

    // Валидация
    const validation = validateProfileData(formData.value)
    if (!validation.isValid) {
      errors.value = validation.errors
      return
    }

    // Отправка данных
    const response = await updateProfile(formData.value)
    profileData.value = formatProfileData(response)
    
    // Обновляем userStore для мгновенного отображения изменений во всех компонентах
    await userStore.loadProfile()
    await userStore.loadAvatar()
    
    editing.value = false
    toast.success('Профиль успешно обновлен')
  } catch (error) {
    console.error('Ошибка сохранения профиля:', error)
    
    // Обработка ошибок валидации от сервера
    if (error.response?.data) {
      errors.value = error.response.data
    } else {
      toast.error('Ошибка сохранения профиля')
    }
  } finally {
    saving.value = false
  }
}

// Инициализация
onMounted(() => {
  fetchProfile()
  fetchAvatar()
})
</script>

<template>
  <div class="card h-100">
    <div class="card-header d-flex justify-content-between align-items-center">
      <h5 class="card-title mb-0">
        <User :size="20" class="me-2" />
        Информация о профиле
      </h5>
      <div class="btn-group btn-group-sm">
        <button 
          v-if="!editing" 
          @click="startEditing" 
          class="btn btn-outline-primary"
          :disabled="loading || !profileData"
        >
          <Edit3 :size="16" class="me-1" />
          Редактировать
        </button>
        <template v-else>
          <button 
            @click="saveProfile" 
            class="btn btn-success"
            :disabled="saving"
          >
            <Save :size="16" class="me-1" />
            <span v-if="saving">Сохранение...</span>
            <span v-else>Сохранить</span>
          </button>
          <button 
            @click="cancelEditing" 
            class="btn btn-outline-secondary"
            :disabled="saving"
          >
            <X :size="16" class="me-1" />
            Отмена
          </button>
        </template>
      </div>
    </div>

    <div class="card-body">
      <!-- Загрузка -->
      <div v-if="loading" class="text-center py-4">
        <div class="spinner-border text-primary" role="status">
          <span class="visually-hidden">Загрузка...</span>
        </div>
      </div>

      <!-- Данные профиля -->
      <div v-else-if="displayData">
        <!-- Аватар пользователя -->
        <div class="mb-4 text-center">
          <h6 class="text-muted mb-3">
            <User :size="18" class="me-1" />
            Фотография профиля
          </h6>
          <div class="avatar-section">
            <img
              :src="avatarUrl"
              alt="Avatar"
              class="mb-3 hq-avatar hq-avatar-primary"
              style="width: 120px; height: 120px; object-fit: cover;"
            />
            <div class="button-wrapper d-flex gap-2 justify-content-center">
              <label for="avatarFileInput" class="btn btn-sm btn-primary" tabindex="0">
                <Upload :size="16" class="me-1" />
                Загрузить фото
                <input
                  type="file"
                  accept="image/png, image/jpeg"
                  ref="avatarInput"
                  @change="changeAvatar"
                  id="avatarFileInput"
                  style="display: none"
                />
              </label>
              <button
                type="button"
                class="btn btn-sm btn-secondary"
                @click="cancelAvatarUpload"
              >
                <RotateCcw :size="16" class="me-1" />
                Сбросить
              </button>
            </div>
            <div class="text-muted mt-2" style="font-size: 13px">
              Рекомендуемый размер: 200x200. JPG, JPEG, PNG
            </div>
            <div v-if="avatarError" class="alert alert-danger mt-2">{{ avatarError }}</div>
            <div v-if="avatarLoading" class="text-primary mt-2">
              <div class="spinner-border spinner-border-sm me-2" role="status">
                <span class="visually-hidden">Загрузка...</span>
              </div>
              Загрузка...
            </div>
          </div>
        </div>

        <!-- Основная информация -->
        <div class="mb-4">
          <h6 class="text-muted mb-3">
            <UserRound :size="18" class="me-1" />
            Основная информация
          </h6>
          
          <div class="row g-3">
            <!-- Имя -->
            <div class="col-md-6">
              <label class="form-label text-muted small">Имя</label>
              <div v-if="!editing" class="fw-medium">
                {{ formData.first_name || 'Не указано' }}
              </div>
              <div v-else>
                <input 
                  v-model="formData.first_name" 
                  type="text" 
                  class="form-control form-control-sm"
                  :class="{ 'is-invalid': errors.first_name }"
                  placeholder="Введите имя"
                />
                <div v-if="errors.first_name" class="invalid-feedback">
                  {{ errors.first_name }}
                </div>
              </div>
            </div>

            <!-- Фамилия -->
            <div class="col-md-6">
              <label class="form-label text-muted small">Фамилия</label>
              <div v-if="!editing" class="fw-medium">
                {{ formData.last_name || 'Не указано' }}
              </div>
              <div v-else>
                <input 
                  v-model="formData.last_name" 
                  type="text" 
                  class="form-control form-control-sm"
                  :class="{ 'is-invalid': errors.last_name }"
                  placeholder="Введите фамилию"
                />
                <div v-if="errors.last_name" class="invalid-feedback">
                  {{ errors.last_name }}
                </div>
              </div>
            </div>

            <!-- Статус -->
            <div class="col-md-6">
              <label class="form-label text-muted small">Статус аккаунта</label>
              <div class="d-flex align-items-center">
                <Check :size="16" :class="displayData.status ? 'text-success' : 'text-danger'" class="me-2" />
                <span :class="displayData.status ? 'text-success' : 'text-danger'">
                  {{ displayData.status ? 'Активен' : 'Неактивен' }}
                </span>
              </div>
            </div>

            <!-- Дата регистрации -->
            <div class="col-md-6">
              <label class="form-label text-muted small">Дата регистрации</label>
              <div class="d-flex align-items-center">
                <Calendar :size="16" class="text-muted me-2" />
                {{ displayData.memberSince }}
              </div>
            </div>
          </div>
        </div>

        <!-- Контактная информация -->
        <div class="mb-4">
          <h6 class="text-muted mb-3">
            <Mail :size="18" class="me-1" />
            Контактная информация
          </h6>
          
          <div class="row g-3">
            <!-- Email -->
            <div class="col-md-6">
              <label class="form-label text-muted small">Email</label>
              <div v-if="!editing" class="fw-medium">
                <Mail :size="16" class="text-muted me-2" />
                {{ displayData.email }}
              </div>
              <div v-else>
                <input 
                  v-model="formData.email" 
                  type="email" 
                  class="form-control form-control-sm"
                  :class="{ 'is-invalid': errors.email }"
                  placeholder="email@example.com"
                />
                <div v-if="errors.email" class="invalid-feedback">
                  {{ errors.email }}
                </div>
              </div>
            </div>

            <!-- Телефон -->
            <div class="col-md-6">
              <label class="form-label text-muted small">Телефон</label>
              <div v-if="!editing" class="fw-medium">
                <Phone :size="16" class="text-muted me-2" />
                {{ displayData.phone || 'Не указан' }}
              </div>
              <div v-else>
                <input 
                  v-model="formData.phone" 
                  type="tel" 
                  class="form-control form-control-sm"
                  :class="{ 'is-invalid': errors.phone }"
                  placeholder="+7 (900) 123-45-67"
                />
                <div v-if="errors.phone" class="invalid-feedback">
                  {{ errors.phone }}
                </div>
              </div>
            </div>

            <!-- Веб-сайт -->
            <div class="col-12">
              <label class="form-label text-muted small">Веб-сайт</label>
              <div v-if="!editing" class="fw-medium">
                <Link :size="16" class="text-muted me-2" />
                <a v-if="displayData.website !== 'Не указан'" 
                   :href="displayData.website" 
                   target="_blank" 
                   class="text-decoration-none">
                  {{ displayData.website }}
                </a>
                <span v-else>{{ displayData.website }}</span>
              </div>
              <div v-else>
                <input 
                  v-model="formData.website" 
                  type="url" 
                  class="form-control form-control-sm"
                  :class="{ 'is-invalid': errors.website }"
                  placeholder="https://example.com"
                />
                <div v-if="errors.website" class="invalid-feedback">
                  {{ errors.website }}
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Местоположение и язык -->
        <div class="mb-4">
          <h6 class="text-muted mb-3">
            <Globe :size="18" class="me-1" />
            Местоположение и предпочтения
          </h6>
          
          <div class="row g-3">
            <!-- Страна -->
            <div class="col-md-6">
              <label class="form-label text-muted small">Страна</label>
              <div v-if="!editing" class="fw-medium">
                <Flag :size="16" class="text-muted me-2" />
                {{ displayData.country }}
              </div>
              <div v-else>
                <input 
                  v-model="formData.country" 
                  type="text" 
                  class="form-control form-control-sm"
                  :class="{ 'is-invalid': errors.country }"
                  placeholder="Россия"
                />
                <div v-if="errors.country" class="invalid-feedback">
                  {{ errors.country }}
                </div>
              </div>
            </div>

            <!-- Город -->
            <div class="col-md-6">
              <label class="form-label text-muted small">Город</label>
              <div v-if="!editing" class="fw-medium">
                <MapPin :size="16" class="text-muted me-2" />
                {{ displayData.city }}
              </div>
              <div v-else>
                <input 
                  v-model="formData.city" 
                  type="text" 
                  class="form-control form-control-sm"
                  :class="{ 'is-invalid': errors.city }"
                  placeholder="Москва"
                />
                <div v-if="errors.city" class="invalid-feedback">
                  {{ errors.city }}
                </div>
              </div>
            </div>

            <!-- Язык -->
            <div class="col-md-6">
              <label class="form-label text-muted small">Язык интерфейса</label>
              <div v-if="!editing" class="fw-medium">
                <Languages :size="16" class="text-muted me-2" />
                {{ displayData.language }}
              </div>
              <div v-else>
                <select 
                  v-model="formData.language" 
                  class="form-select form-select-sm"
                  :class="{ 'is-invalid': errors.language }"
                >
                  <option value="ru">Русский</option>
                  <option value="en">English</option>
                  <option value="uk">Українська</option>
                  <option value="be">Беларуская</option>
                </select>
                <div v-if="errors.language" class="invalid-feedback">
                  {{ errors.language }}
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Описание -->
        <div>
          <h6 class="text-muted mb-3">
            <Shield :size="18" class="me-1" />
            О себе
          </h6>
          
          <div v-if="!editing" class="fw-medium">
            {{ displayData.bio }}
          </div>
          <div v-else>
            <textarea 
              v-model="formData.bio" 
              class="form-control form-control-sm"
              :class="{ 'is-invalid': errors.bio }"
              rows="3"
              placeholder="Расскажите немного о себе..."
              maxlength="500"
            ></textarea>
            <div class="form-text">
              {{ (formData.bio || '').length }}/500 символов
            </div>
            <div v-if="errors.bio" class="invalid-feedback">
              {{ errors.bio }}
            </div>
          </div>
        </div>
        </div>

      <!-- Ошибка загрузки -->
      <div v-else class="text-center py-4 text-muted">
        <UserRound :size="48" class="mb-2 opacity-50" />
        <p>Ошибка загрузки данных профиля</p>
        <button @click="fetchProfile" class="btn btn-outline-primary btn-sm">
          Попробовать снова
        </button>
        </div>
        </div>
  </div>
</template>

<style scoped lang="scss">
.card {
  border: 1px solid rgba(0, 0, 0, 0.125);
  box-shadow: 0 0.125rem 0.25rem rgba(0, 0, 0, 0.075);
  transition: box-shadow 0.15s ease-in-out;

  &:hover {
    box-shadow: 0 0.5rem 1rem rgba(0, 0, 0, 0.15);
  }
}

.card-header {
  background-color: #f8f9fa;
  border-bottom: 1px solid rgba(0, 0, 0, 0.125);
}

.form-control:focus,
.form-select:focus {
  border-color: #0d6efd;
  box-shadow: 0 0 0 0.2rem rgba(13, 110, 253, 0.25);
}

.btn-group .btn {
  border-radius: 0.375rem;
  
  &:not(:last-child) {
    margin-right: 0.5rem;
  }
}

.fw-medium {
  font-weight: 500;
}

.text-muted {
  opacity: 0.8;
}

h6 {
  font-weight: 600;
  color: #495057;
}


</style>
