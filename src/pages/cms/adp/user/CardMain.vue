<script setup>
import { ref, onMounted, computed, watch } from 'vue'
import { Briefcase, Calendar, MapPin } from 'lucide-vue-next'
import { apiClient } from '@/js/api/manager'
import { endpoints } from '@/js/api/endpoints'
import { useUserStore } from '@/stores/userStore'
import { useProfile } from '@/js/api/services/profileService.js'

const userStore = useUserStore()
const { getProfile, formatProfileData } = useProfile()

const profileData = ref(null)
const loading = ref(true)
const avatarLoading = ref(!userStore.avatarUrl)

const userInfo = ref({
  image: userStore.avatarUrl || null,
  username: 'Загрузка...',
  profession: 'Загрузка...',
  location: 'Загрузка...',
  registration: 'Загрузка...',
})

// Вычисляемые свойства для отображения данных
const displayUserInfo = computed(() => {
  if (!profileData.value && !userStore.user) {
    return {
      image: userInfo.value.image,
      username: 'Пользователь',
      profession: '',
      location: 'Не указано',
      registration: 'Неизвестно'
    }
  }

  const profile = profileData.value
  const user = userStore.user

  return {
    image: userInfo.value.image,
    username: profile?.fullName || userStore.fullName || user?.first_name || 'Пользователь',
    profession: profile?.bio || '',
    location: profile?.city && profile?.country 
      ? `${profile.city}, ${profile.country}` 
      : profile?.city || profile?.country || 'Не указано',
    registration: user?.date_joined 
      ? formatRegistrationDate(user.date_joined)
      : 'Неизвестно'
  }
})

// Вычисляем инициалы пользователя
const userInitials = computed(() => {
  const user = userStore.user
  if (!user) return 'У'
  
  // Пробуем получить инициалы из имени и фамилии
  const firstName = user.first_name?.trim()
  const lastName = user.last_name?.trim()
  
  if (firstName && lastName) {
    return (firstName.charAt(0) + lastName.charAt(0)).toUpperCase()
  }
  
  if (firstName) {
    return firstName.charAt(0).toUpperCase()
  }
  
  // Если имени нет, берем первую букву логина
  if (user.username) {
    return user.username.charAt(0).toUpperCase()
  }
  
  // Fallback для неизвестного пользователя
  return 'У'
})

// Проверяем, есть ли у пользователя кастомный аватар
const hasCustomAvatar = computed(() => {
  return !avatarLoading.value && displayUserInfo.value.image
})

// Форматирование даты регистрации
function formatRegistrationDate(dateString) {
  if (!dateString) return 'Неизвестно'
  
  const date = new Date(dateString)
  const options = { year: 'numeric', month: 'long' }
  return date.toLocaleDateString('ru-RU', options)
}

// Загрузка аватара
async function fetchAvatar() {
  try {
    console.log('🔄 fetchAvatar начало, userStore.avatarUrl:', userStore.avatarUrl)
    avatarLoading.value = true
    
    // Сначала проверяем, есть ли аватар в userStore
    if (userStore.avatarUrl) {
      userInfo.value.image = userStore.avatarUrl
      avatarLoading.value = false
      console.log('✅ Используем аватар из userStore:', userStore.avatarUrl)
      return
    }
    
    const resp = await apiClient.get(endpoints.userAvatars.list)
    if (resp.data.length && resp.data[0].image) {
      userInfo.value.image = resp.data[0].image
      console.log('✅ Загружен аватар с сервера:', resp.data[0].image)
    } else {
      // Не устанавливаем дефолтное изображение - оставляем null
      userInfo.value.image = null
      console.log('🚫 Нет аватара на сервере, оставляем null')
    }
  } catch (error) {
    // В случае ошибки тоже оставляем null вместо дефолтного изображения
    userInfo.value.image = null
    console.log('❌ Ошибка загрузки аватара:', error)
  } finally {
    avatarLoading.value = false
    console.log('🏁 fetchAvatar завершён, userInfo.value.image:', userInfo.value.image)
  }
}

// Загрузка профиля
async function fetchProfile() {
  try {
    loading.value = true
    
    // Инициализируем пользователя если еще не инициализирован
    if (!userStore.isInitialized) {
      await userStore.initializeUser()
    }
    
    // Загружаем полный профиль
    const response = await getProfile()
    profileData.value = formatProfileData(response)
  } catch (error) {
    console.error('Ошибка загрузки профиля:', error)
    // Если профиль не загрузился, используем данные из userStore
  } finally {
    loading.value = false
  }
}

// Следим за изменениями в userStore для автоматического обновления
watch(() => userStore.profile, async (newProfile) => {
  if (newProfile && !loading.value) {
    // Перезагружаем данные профиля если они изменились в store
    await fetchProfile()
  }
}, { deep: true })

// Следим за изменениями аватара в userStore
watch(() => userStore.avatarUrl, (newAvatarUrl) => {
  if (newAvatarUrl && newAvatarUrl !== userInfo.value.image) {
    userInfo.value.image = newAvatarUrl
    avatarLoading.value = false
  } else if (!newAvatarUrl && userInfo.value.image) {
    // Если avatarUrl стал null, тоже обнуляем image
    userInfo.value.image = null
    avatarLoading.value = false
  }
})

// Функция для принудительного обновления данных (экспортируем для использования в других компонентах)
const refreshData = async () => {
  loading.value = true
  avatarLoading.value = true
  
  await Promise.all([
    fetchProfile(),
    fetchAvatar()
  ])
}

// Подписываемся на обновления из userStore
watch(() => userStore.user, async (newUser, oldUser) => {
  if (newUser && (!oldUser || newUser.id !== oldUser.id)) {
    await refreshData()
  }
})

onMounted(async () => {
  console.log('🔍 CardMain onMounted - userStore.avatarUrl:', userStore.avatarUrl)
  
  // Принудительно убеждаемся что нет дефолтного изображения
  if (!userStore.avatarUrl) {
    userInfo.value.image = null
    avatarLoading.value = true
    console.log('🚫 Нет аватара в userStore, устанавливаем image = null')
  } else {
    userInfo.value.image = userStore.avatarUrl
    avatarLoading.value = false
    console.log('✅ Есть аватар в userStore:', userStore.avatarUrl)
  }
  
  // Запускаем загрузку параллельно
  await Promise.all([
    fetchProfile(),
    fetchAvatar()
  ])
})

// Экспортируем функцию для внешнего использования
defineExpose({
  refreshData
})
</script>


<template>
  <div class="profile__cover col-12">
    <img src="@/assets/profile-cover.png" alt="Profile Cover" />
  </div>
  <div class="profile__basic basic card col-12">
    <div class="row px-0 px-lg-3">
      <div class="col-12 col-xxl-2 col-lg-3">
        <div class="basic__avatar avatar rounded-circle overflow-hidden mx-auto">
          <!-- Показываем спиннер загрузки пока грузится аватар -->
          <div v-if="avatarLoading" class="avatar-loading d-flex align-items-center justify-content-center">
            <div class="spinner-border text-primary" role="status">
              <span class="visually-hidden">Загрузка аватара...</span>
            </div>
          </div>
          <!-- Показываем загруженное изображение если есть -->
          <img 
            v-else-if="hasCustomAvatar"
            :src="displayUserInfo.image" 
            :alt="displayUserInfo.username" 
            class="hq-avatar hq-avatar-primary" 
          />
          <!-- Показываем инициалы если нет кастомного аватара -->
          <div 
            v-else
            class="avatar-initials-large d-flex align-items-center justify-content-center"
            :data-letter="userInitials.charAt(0)"
            :title="displayUserInfo.username"
          >
            {{ userInitials }}
          </div>
        </div>
      </div>
      <div class="col-12 col-xxl-10 col-lg-9">
        <div
          class="basic__user d-flex flex-column flex-md-row align-items-md-center justify-content-start justify-content-md-between"
        >
          <div class="basic__data d-flex flex-column gap-2 text-center text-md-start">
            <!-- Показываем спиннер загрузки во время загрузки -->
            <h3 class="basic__username">
              <span v-if="loading" class="d-inline-flex align-items-center">
                <div class="spinner-border spinner-border-sm me-2" role="status">
                  <span class="visually-hidden">Загрузка...</span>
                </div>
                Загрузка...
              </span>
              <span v-else>{{ displayUserInfo.username }}</span>
            </h3>
            <div class="basic__about">
              <ul
                class="list-unstyled mb-3 mb-lg-0 d-flex align-items-center flex-wrap justify-content-lg-start justify-content-center gap-3"
              >
                <li v-if="displayUserInfo.profession" class="d-flex align-items-center gap-2">
                  <div class="icon-flex text-muted"><Briefcase :size="22" /></div>
                  <div class="text-muted">{{ displayUserInfo.profession }}</div>
                </li>
                <li class="d-flex align-items-center gap-2">
                  <div class="icon-flex text-muted"><MapPin :size="22" /></div>
                  <div class="text-muted">{{ displayUserInfo.location }}</div>
                </li>
                <li class="d-flex align-items-center gap-2">
                  <div class="icon-flex text-muted"><Calendar :size="22" /></div>
                  <div class="text-muted">{{ displayUserInfo.registration }}</div>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped lang="scss">
.profile__cover img {
  width: 100%;
  height: 200px;
  object-fit: cover;

  @media (width <= 992px) {
    height: 180px;
  }
  @media (width <= 575px) {
    height: 120px;
  }
}

.basic {
  position: relative;
  min-height: 150px;
  height: auto;

  @media (width <= 992px) {
    height: 200px;
  }
  @media (width <= 767px) {
    height: 250px;
  }
  @media (width <= 575px) {
    height: 220px;
  }
  @media (width <= 415px) {
    height: 260px;
  }

  & .row {
    position: absolute;
    top: -50px;
    left: 12px;

    width: 100%;
  }
}

.basic__avatar {
  width: 180px;
  height: 180px;

  @media (width <= 992px) {
    width: 150px;
    height: 150px;
  }
  @media (width <= 575px) {
    width: 120px;
    height: 120px;
  }

  img {
    width: 100%;
    height: 100%;
  }
  
  .avatar-loading {
    width: 100%;
    height: 100%;
    background-color: var(--bs-gray-100);
    
    .spinner-border {
      width: 2.5rem;
      height: 2.5rem;
      
      @media (width <= 992px) {
        width: 2rem;
        height: 2rem;
      }
      @media (width <= 575px) {
        width: 1.5rem;
        height: 1.5rem;
      }
    }
  }
  
  // Стили для больших инициалов в профиле
  .avatar-initials-large {
    width: 100%;
    height: 100%;
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    color: white;
    font-weight: 700;
    font-size: 4rem;
    border: 4px solid rgba(255, 255, 255, 0.2);
    box-shadow: 0 8px 32px rgba(0, 0, 0, 0.15);
    transition: all 0.3s ease;
    cursor: default;
    user-select: none;
    
    @media (width <= 992px) {
      font-size: 3.2rem;
      border-width: 3px;
    }
    @media (width <= 575px) {
      font-size: 2.5rem;
      border-width: 2px;
    }
    
    &:hover {
      transform: scale(1.02);
      border-color: rgba(255, 255, 255, 0.4);
      box-shadow: 0 12px 48px rgba(0, 0, 0, 0.2);
    }
  }
}

// Альтернативные цвета для разных букв (для больших инициалов)
.avatar-initials-large {
  // Генерируем цвет на основе первой буквы (английские и русские)
  &[data-letter="A"], &[data-letter="А"] { background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%); }
  &[data-letter="B"], &[data-letter="Б"] { background: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%); }
  &[data-letter="C"], &[data-letter="В"] { background: linear-gradient(135deg, #43e97b 0%, #38f9d7 100%); }
  &[data-letter="D"], &[data-letter="Г"] { background: linear-gradient(135deg, #fa709a 0%, #fee140 100%); }
  &[data-letter="E"], &[data-letter="Д"] { background: linear-gradient(135deg, #a8edea 0%, #fed6e3 100%); }
  &[data-letter="F"], &[data-letter="Е"] { background: linear-gradient(135deg, #ffecd2 0%, #fcb69f 100%); }
  &[data-letter="G"], &[data-letter="Ж"] { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); }
  &[data-letter="H"], &[data-letter="З"] { background: linear-gradient(135deg, #f8cdda 0%, #1e3c72 100%); }
  &[data-letter="I"], &[data-letter="И"] { background: linear-gradient(135deg, #ff9a9e 0%, #fecfef 100%); }
  &[data-letter="J"], &[data-letter="К"] { background: linear-gradient(135deg, #a1c4fd 0%, #c2e9fb 100%); }
  &[data-letter="K"], &[data-letter="Л"] { background: linear-gradient(135deg, #d299c2 0%, #fef9d7 100%); }
  &[data-letter="L"], &[data-letter="М"] { background: linear-gradient(135deg, #89f7fe 0%, #66a6ff 100%); }
  &[data-letter="M"], &[data-letter="Н"] { background: linear-gradient(135deg, #fdbb2d 0%, #22c1c3 100%); }
  &[data-letter="N"], &[data-letter="О"] { background: linear-gradient(135deg, #ff6a00 0%, #ee0979 100%); }
  &[data-letter="O"], &[data-letter="П"] { background: linear-gradient(135deg, #21d4fd 0%, #b721ff 100%); }
  &[data-letter="P"], &[data-letter="Р"] { background: linear-gradient(135deg, #3b41c5 0%, #a981bb 100%); }
  &[data-letter="Q"], &[data-letter="С"] { background: linear-gradient(135deg, #ffc3a0 0%, #ffafbd 100%); }
  &[data-letter="R"], &[data-letter="Т"] { background: linear-gradient(135deg, #c471f5 0%, #fa71cd 100%); }
  &[data-letter="S"], &[data-letter="У"] { background: linear-gradient(135deg, #48c6ef 0%, #6f86d6 100%); }
  &[data-letter="T"], &[data-letter="Ф"] { background: linear-gradient(135deg, #f6d365 0%, #fda085 100%); }
  &[data-letter="U"], &[data-letter="Х"] { background: linear-gradient(135deg, #96fbc4 0%, #f9f047 100%); }
  &[data-letter="V"], &[data-letter="Ц"] { background: linear-gradient(135deg, #fa8bff 0%, #2bd2ff 100%); }
  &[data-letter="W"], &[data-letter="Ч"] { background: linear-gradient(135deg, #ff5f6d 0%, #ffc371 100%); }
  &[data-letter="X"], &[data-letter="Ш"] { background: linear-gradient(135deg, #e055a3 0%, #4776e6 100%); }
  &[data-letter="Y"], &[data-letter="Щ"] { background: linear-gradient(135deg, #f7971e 0%, #ffd200 100%); }
  &[data-letter="Z"], &[data-letter="Ы"] { background: linear-gradient(135deg, #74b9ff 0%, #0984e3 100%); }
  &[data-letter="Э"] { background: linear-gradient(135deg, #fd79a8 0%, #fdcb6e 100%); }
  &[data-letter="Ю"] { background: linear-gradient(135deg, #6c5ce7 0%, #a29bfe 100%); }
  &[data-letter="Я"] { background: linear-gradient(135deg, #fd9644 0%, #fe6244 100%); }
  &[data-letter="У"], &[data-letter="?"] { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); }
}

.basic__user {
  margin-top: 85px;

  @media (width >= 1400px) {
    padding-left: 3%;
  }

  @media (width <= 992px) {
    margin-top: 16px;
  }
}
</style>
