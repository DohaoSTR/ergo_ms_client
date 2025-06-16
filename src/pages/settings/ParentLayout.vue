<script setup>
import { ref } from 'vue'
import { 
  Lock, 
  UserRound, 
  Settings 
} from 'lucide-vue-next'

import NavigationButtons from '@/components/NavigationButtons.vue'

const navigationButtons = ref([
  { icon: UserRound, title: 'Аккаунт', link: 'AccountSettings' },
  { icon: Lock, title: 'Безопасность', link: 'SecuritySettings' },
  { icon: Settings, title: 'Настройки сайта', link: 'SiteSettings' },  
])
</script>

<template>
  <div class="mb-4">
    <NavigationButtons :data="navigationButtons" />
  </div>
  <RouterView></RouterView>
</template>

<style lang="scss" scoped></style>
