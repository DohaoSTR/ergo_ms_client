<script setup>
import { ref, computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { LayoutGrid, Link, UserRound, SquarePlus } from 'lucide-vue-next'

import MainInfo from '@/pages/user/CardMain.vue'
import NavigationButtons from '@/components/NavigationButtons.vue'

const route = useRoute()
const router = useRouter()
const mainButtons = ref([
  { icon: LayoutGrid, title: 'Все', link: 'Projects' },
  { icon: UserRound, title: 'Личные', link: 'PersonalProjects' },
  { icon: Link, title: 'Приглашённые', link: 'InvitedProjects' },
])

const createButton = ref({ 
  icon: SquarePlus, 
  title: 'Создать проект', 
  link: 'CreateProject',
  class: 'create-btn'
})

const showCreateButton = computed(() => {
  return ['Projects', 'PersonalProjects', 'InvitedProjects'].includes(route.name)
})

const openCreateProject = () => {
  router.push({ name: 'CreateProject' })
}
</script>

<template>
  <div class="rounded overflow-hidden mb-4">
    <MainInfo />
  </div>

  <div class="mb-4 d-flex justify-content-between align-items-center navigation-container">
    <NavigationButtons :data="mainButtons" />
    <button
      v-if="showCreateButton"
      @click="openCreateProject"
      class="btn fw-bold text-center create-project-btn"
    >
      <div class="d-flex align-items-center justify-content-center gap-1">
        <div class="icon-flex"><component :is="createButton.icon" :size="20" /></div>
        <div class="fw-bold">{{ createButton.title }}</div>
      </div>
    </button>
  </div>

  <RouterView></RouterView>
</template>

<style lang="scss" scoped>
.navigation-container {
  position: relative;
  padding-right: 1rem;
}

.create-project-btn {
  margin-left: auto;
  white-space: nowrap;
  position: relative;
  z-index: 2;
  
  &:not(.btn-primary):hover {
    background-color: var(--bs-primary-bg-subtle);
    color: var(--bs-primary);
  }
}

@media (max-width: 768px) {
  .navigation-container {
    flex-direction: column;
    gap: 0.5rem;
  }
  
  .create-project-btn {
    margin-left: 0;
    width: 100%;
  }
}
</style>