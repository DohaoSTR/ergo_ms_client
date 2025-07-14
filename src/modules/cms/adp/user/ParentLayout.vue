<script setup>
  import MainInfo from '@/modules/cms/adp/user/CardMain.vue'
</script>

<template>
  <div class="rounded overflow-hidden mb-4">
    <MainInfo />
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