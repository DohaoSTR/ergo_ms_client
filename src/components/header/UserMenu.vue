<script setup>
import { ref, onMounted, computed } from 'vue'
import { CircleUserRound, Power } from 'lucide-vue-next'
import { useUserStore } from '@/stores/userStore.js'
import DefaultAvatar from '@/components/DefaultAvatar.vue'

const userStore = useUserStore()

// Инициализируем пользователя при загрузке компонента
onMounted(async () => {
  if (!userStore.isInitialized) {
    await userStore.initializeUser()
  }
})

// Вычисляем инициалы пользователя
const userInitials = computed(() => {
  if (!userStore.user) return 'Г'
  
  // Если пользователь гость, возвращаем "Г"
  if (userStore.displayName === 'Гость') return 'Г'
  
  // Пробуем получить инициалы из имени и фамилии
  const firstName = userStore.user.first_name?.trim()
  const lastName = userStore.user.last_name?.trim()
  
  // Обрабатываем пробелы как пустые значения
  const cleanFirstName = firstName === ' ' ? '' : firstName
  const cleanLastName = lastName === ' ' ? '' : lastName
  
  if (cleanFirstName && cleanLastName) {
    return (cleanFirstName.charAt(0) + cleanLastName.charAt(0)).toUpperCase()
  }
  
  if (cleanFirstName) {
    return cleanFirstName.charAt(0).toUpperCase()
  }
  
  // Если имени нет, возвращаем "Г" для гостя
  return 'Г'
})

// Проверяем, есть ли валидные инициалы (имя И фамилия)
const hasValidInitials = computed(() => {
  if (!userStore.user) return false
  
  const firstName = userStore.user.first_name?.trim()
  const lastName = userStore.user.last_name?.trim()
  
  // Обрабатываем пробелы как пустые значения
  const cleanFirstName = firstName === ' ' ? '' : firstName
  const cleanLastName = lastName === ' ' ? '' : lastName
  
  // Показываем инициалы только если есть И имя, И фамилия
  // И если пользователь не "Гость"
  return !!(cleanFirstName && cleanLastName) && userStore.displayName !== 'Гость'
})

// Инициализация пользователя при загрузке



const userDropdownMenu = ref([
  {
    id: 1,
    title: 'Профиль',
    icon: CircleUserRound,
    link: { name: 'User' },
  },
  {
    id: 2,
    title: 'Выход',
    icon: Power,
    link: { name: 'logout' },
  },
])
</script>

<template>
  <div class="dropdown">
    <div
      class="tools__avatar avatar"
      data-bs-toggle="dropdown"
      aria-expanded="false"
      data-bs-offset="16,20"
    >
      <!-- Показываем инициалы если есть имя и фамилия, иначе стандартную иконку -->
      <div 
        v-if="hasValidInitials"
        class="avatar-initials"
        :title="userStore.displayName"
        :data-letter="userInitials.charAt(0)"
      >
        {{ userInitials }}
      </div>
      <DefaultAvatar 
        v-else
        size="medium"
        :clickable="true"
        :title="userStore.displayName"
      />
    </div>
    <ul class="dropdown-menu dropdown-menu-end">
      <!-- Информация о пользователе -->
      <li class="dropdown-header px-3 py-2 border-bottom">
        <div class="d-flex align-items-center">
          <!-- Показываем инициалы если есть имя и фамилия, иначе стандартную иконку в dropdown -->
          <div 
            v-if="hasValidInitials"
            class="me-2 avatar-initials avatar-initials-small"
            :data-letter="userInitials.charAt(0)"
          >
            {{ userInitials }}
          </div>
          <div v-else class="me-2">
            <DefaultAvatar 
              size="small"
              :title="userStore.displayName"
            />
          </div>
          <div class="flex-grow-1 min-width-0">
            <div class="fw-semibold text-truncate">{{ userStore.displayName }}</div>
            <small class="text-muted text-truncate d-block">{{ userStore.userEmail }}</small>
          </div>
        </div>
        <div v-if="userStore.isLoading" class="mt-1">
          <div class="spinner-border spinner-border-sm text-primary" role="status">
            <span class="visually-hidden">Загрузка...</span>
          </div>
        </div>
      </li>
      
      <!-- Меню -->
      <li v-for="item in userDropdownMenu" :key="item.id">
        <RouterLink
          :to="item.link"
          class="dropdown-item header-dropdown-item"
          active-class="active"
          :style="{ transitionDelay: `${item.id * 50}ms` }"
        >
          <span class="icon-flex">
            <component :is="item.icon" :size="22" />
          </span>
          <span>{{ item.title }}</span>
        </RouterLink>
      </li>
    </ul>
  </div>
</template>

<style scoped lang="scss">
.avatar img {
  width: 40px;
  height: 40px;
}

.dropdown .dropdown-menu-end {
  inset: 0 0 auto auto;
  transform: translate(16px, 60px);
  min-width: 280px;
}

.dropdown-item {
  @include flex-row-gap(12px, center);
  transition: all $transition;
  padding: $padding-internal $padding-external;
}

.dropdown-header {
  background-color: var(--bs-gray-50);
  border-bottom: 1px solid var(--bs-border-color);
  
  .text-truncate {
    max-width: 200px;
  }
}

.min-width-0 {
  min-width: 0;
}

// Стили для инициалов пользователя
.avatar-initials {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 600;
  font-size: 16px;
  border: 2px solid rgba(255, 255, 255, 0.2);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  transition: all 0.2s ease;
  cursor: pointer;
  user-select: none;
  
  &:hover {
    transform: scale(1.05);
    border-color: rgba(255, 255, 255, 0.4);
    box-shadow: 0 4px 16px rgba(0, 0, 0, 0.15);
  }
  
  // Размер для dropdown
  &.avatar-initials-small {
    width: 32px;
    height: 32px;
    font-size: 13px;
    font-weight: 600;
  }
}

// Альтернативные цвета для разнообразия
.avatar-initials {
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
  &[data-letter="?"], &[data-letter="U"] { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); }
}

 
</style>
