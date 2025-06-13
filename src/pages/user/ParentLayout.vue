<script setup>
import { ref } from 'vue'
import { ChartNoAxesCombined, LayoutGrid, Link, UserRound, UsersRound, NotepadTextDashed } from 'lucide-vue-next'

import MainInfo from '@/pages/user/CardMain.vue'
import NavigationButtons from '@/components/NavigationButtons.vue'

const navigationButtons = ref([
  { icon: UserRound, title: 'Профиль', link: 'Account' },
  { icon: UsersRound, title: 'Команды', link: 'Teams' },
  { icon: LayoutGrid, title: 'Проекты', link: 'Projects' },
  { icon: Link, title: 'Связи', link: 'Connections' },
])
</script>

<template>
  <div class="rounded overflow-hidden mb-4">
    <MainInfo />
  </div>

  <div class="mb-4">
    <NavigationButtons :data="navigationButtons" />
  </div>

  <RouterView></RouterView>
</template>

<style lang="scss" scoped></style>
