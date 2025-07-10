<script setup>
import { ref } from 'vue'
import { FolderOpen, Map, Table2 } from 'lucide-vue-next'

import NavigationButtons from '@/pages/bio/components/NavigationButtons.vue'

const navigationButtons = ref([
  { icon: FolderOpen, title: 'Площадки', link: 'Sites' },
  { icon: Table2, title: 'Сводный анализ', link: 'SiteConsolidatedAnalysis' },
  { icon: Map, title: 'Карта', link: 'SitesMap' },
])
</script>

<template>
  <div class="mb-4">
    <NavigationButtons :data="navigationButtons" />
  </div>
  <RouterView></RouterView>
</template>

<style lang="scss" scoped></style>
