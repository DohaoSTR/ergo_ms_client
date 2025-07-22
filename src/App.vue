<script setup>
import { ref, computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'

import LayoutMenu from '@/LayoutMenu.vue'
import LayoutStart from '@/LayoutStart.vue'
import LayoutPublic from '@/LayoutPublic.vue'
import NotificationProvider from '@/components/NotificationProvider.vue'

const route = useRoute()
const router = useRouter()

const isReady = ref(false)
router.isReady().then(() => {
  isReady.value = true
})

const currentLayout = computed(() => {
  if (route.meta && route.meta.startRoute === true) {
    return LayoutStart
  }
  return route.meta && route.meta.public === true ? LayoutPublic : LayoutMenu
})
</script>

<template>
  <div v-if="isReady">
    <component :is="currentLayout" />
    <NotificationProvider />
  </div>
</template>
