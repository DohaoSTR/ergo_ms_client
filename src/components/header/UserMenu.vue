<script setup>
import { ref } from 'vue'
import { Bolt, CircleUserRound, Power } from 'lucide-vue-next'

const userDropdownMenu = ref([
  {
    id: 1,
    title: 'Профиль',
    icon: CircleUserRound,
    link: { name: 'User' },
  },
  {
    id: 2,
    title: 'Настройки',
    icon: Bolt,
    link: { name: 'Settings' },
  },
  {
    id: 3,
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
      <img src="/src/assets/avatars/avatar-45.png" alt="User" />
    </div>
    <ul class="dropdown-menu dropdown-menu-end">
      <li v-for="item in userDropdownMenu" :key="item.id">
        <RouterLink
          :to="item.link"
          class="dropdown-item header-dropdown-item"
          active-class="active"
          :style="{ TransitionDelay: `${item.id * 50}ms` }"
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
img {
  border-radius: 100%;
}

.dropdown .dropdown-menu-end {
  inset: 0 0 auto auto;
  transform: translate(16px, 60px);
}

.dropdown-item {
  @include flex-row-gap(12px, center);
  transition: all $transition;
  padding: $padding-internal $padding-external;
}
</style>
