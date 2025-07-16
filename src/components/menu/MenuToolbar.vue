<template>
    <div class="menu-toolbar">
        <div class="tools" :class="{ 'collapsed': isCollapsed && !isHovering }">
            <div class="toolbar__user" :class="{ 'collapsed': isCollapsed && !isHovering }">
                <div class="tools__user__avatar">
                    <UserMenu />
                </div>
                <div class="tools__user__name" v-if="shouldShowFullInfo">
                    <div class="user__fullname">{{ userFullName }}</div>
                    <div class="user__description">В сети</div>
                </div>
            </div>
            <div class="tools-buttons" v-if="shouldShowFullInfo">
                <div class="tools__search" style="width: 40.5px; height: 40px; display: flex; justify-content: center; align-items: center;">
                    <Search :size="24" />
                </div>
                <div class="tools__theme">
                    <ToggleTheme />
                </div>
                <div class="tools__notifications">
                    <UserNotifications />
                </div>
            </div>
        </div>
    </div>
</template>

<script setup>
import { Menu, Search } from 'lucide-vue-next'
import UserMenu from '@/components/header/UserMenu.vue'
import ToggleTheme from '@/components/header/ToggleTheme.vue'
import UserNotifications from '@/components/header/UserNotifications.vue'
import { computed } from 'vue'
import { useUserStore } from '@/modules/cms/js/userStore.js'

const props = defineProps({
  isCollapsed: {
    type: Boolean,
    default: false
  },
  isHovering: {
    type: Boolean,
    default: false
  }
})

const userStore = useUserStore()

// Определяем, нужно ли показывать полную информацию
const shouldShowFullInfo = computed(() => {
  return !props.isCollapsed || props.isHovering
})

const userFullName = computed(() => {
  if (!userStore.user) return 'Гость'
  
  // Если пользователь гость, возвращаем "Гость"
  if (userStore.displayName === 'Гость') return 'Гость'
  
  // Получаем имя и фамилию
  const firstName = userStore.user.first_name?.trim()
  const lastName = userStore.user.last_name?.trim()
  
  // Обрабатываем пробелы как пустые значения
  const cleanFirstName = firstName === ' ' ? '' : firstName
  const cleanLastName = lastName === ' ' ? '' : lastName
  
  if (cleanFirstName && cleanLastName) {
    return `${cleanFirstName} ${cleanLastName}`
  }
  
  if (cleanFirstName) {
    return cleanFirstName
  }
  
  if (cleanLastName) {
    return cleanLastName
  }
  
  // Если имени нет, возвращаем "Гость"
  return 'Гость'
})
</script>

<style scoped lang="scss">
@media (width >= 1200px) {
  .header__menu {
    display: none;
  }
}

.menu-toolbar {
    display: flex;
    justify-content: space-between;
    align-items: center;
    background-color: var(--color-secondary-background);
    margin: 3%;
    width: auto;
    height: auto;
    padding: 10px;
    border-radius: 10px;
    
    .tools {
        display: flex;
        justify-content: space-between;
        width: 100%;
        
        &.collapsed {
            justify-content: center;
        }
    }
}

.toolbar__user{
    display: flex;
    align-items: center;
    gap: 10px;
    width: 100%;
    
    &.collapsed {
        justify-content: center;
        gap: 0;
    }
}

.tools__user__name{
    display: flex;
    flex-direction: column;
}

.tools-buttons{
    display: flex;
    gap: 2px;
    justify-content: center;
    align-items: center;
}

.user__description{
    font-size: 12px;
    color: var(--color-secondary-text);
}

// Поиск
.search {
  @include flex-row-gap($padding-internal, center);
  width: 50%;

  input {
    border: none;
    outline: none;
    width: 100%;
  }
}

// Инструменты
.tools {
  display: flex;
  justify-content: space-between;
  width: 100%;
}

// Аватарка пользователя
.tools__user__avatar {
  cursor: pointer;
  background-color: grey;
  border-radius: 50%;

  position: relative;

  &:after {
    content: '';
    position: absolute;
    bottom: 0;
    right: 3px;
    width: 8px;
    height: 8px;
    border-radius: 100%;
    box-shadow: 0 0 0 2px var(--color-primary-background);
    background-color: #4caf50;
  }
}
</style>

<style lang="scss">
.header-btn {
  padding: 7px 8px;
  border-radius: 100%;
  cursor: pointer;
  transition: background-color $transition;

  &:hover {
    background-color: var(--color-secondary-background);
  }
}

.header-dropdown-item {
  @include flex-row-gap(12px, center);
  transition: all $transition;
  padding: $padding-internal $padding-external;
  cursor: pointer;
}

.header-dropdown-center .header-dropdown-menu {
  inset: 0 auto auto 0;
  transform: translate3d(-60px, 60.6px, 0px);
}
</style>