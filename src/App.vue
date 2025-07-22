<script setup>
import { ref, computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'

import LayoutMenu from '@/LayoutMenu.vue'
import LayoutStart from '@/LayoutStart.vue'
import LayoutPublic from '@/LayoutPublic.vue'
import NotificationProvider from '@/components/NotificationProvider.vue'
import AssistantWidget from '@/components/assistant/AssistantWidget.vue'

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

const showAssistant = computed(() => {
  return (
    isReady.value &&
    !(route.meta && route.meta.startRoute === true) &&
    !(route.meta && route.meta.public === true)
  )
})
</script>

<template>
  <div v-if="isReady">
    <component :is="currentLayout" />
    <NotificationProvider />
    <AssistantWidget v-if="showAssistant" />
  </div>
</template>
