<!-- БОЛЬШЕ НЕ ИСПОЛЬЗУЕТСЯ -->

<script setup>
import { Menu, Search } from 'lucide-vue-next'

import UserMenu from '@/components/header/UserMenu.vue'
import ToggleTheme from '@/components/header/ToggleTheme.vue'
import UserNotifications from '@/components/header/UserNotifications.vue'

defineEmits(['toggleMenu'])
</script>

<template>
  <header class="card header">
    <div class="header__search search">
      <div class="header__menu" @click="$emit('toggleMenu', true)">
        <div class="header-btn" v-tooltip title="Меню"><Menu /></div>
      </div>
      <div class="search__icon"><Search :size="24" /></div>
      <input type="text" placeholder="Поиск..." class="search__input" />
    </div>
    <div class="header__tools tools">
      <div class="tools-buttons">
        <div class="tools__theme"><ToggleTheme /></div>
        <div class="tools__notifications"><UserNotifications /></div>
      </div>
      <div class="tools__user"><UserMenu /></div>
    </div>
  </header>
</template>

<style scoped lang="scss">
// Шапка
header {
  @include flex-row-gap(0, center, space-between);

  position: sticky;
  z-index: 1003;
}

@media (width >= 1200px) {
  .header__menu {
    display: none;
  }
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
  @include flex-row-gap($padding-internal, center);
}
.tools-buttons {
  @include flex-row-gap(2px, center);
}

// Аватарка пользователя
.tools__user {
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
