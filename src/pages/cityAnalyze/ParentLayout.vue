<script setup>
import { ref } from 'vue'
import { Bell, Coins, KeyRound, Link, Lock, UserRound } from 'lucide-vue-next'

import NavigationButtons from '@/components/NavigationButtons.vue'

const navigationButtons = ref([
  { icon: Link, title: 'Загрузка карт', link: 'MapUpload' },
  { icon: UserRound, title: 'Мои загрузки', link: 'MyUploads' },
  { icon: Bell, title: 'Мои задачи', link: 'MyTasks' },
])
</script>

<template>
  <div class="mb-4">
    <NavigationButtons :data="navigationButtons" />
  </div>
  <RouterView></RouterView>
</template>

<style lang="scss" scoped></style>
