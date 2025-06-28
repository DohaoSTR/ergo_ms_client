<script setup>
import UpdatePassword from '@/pages/settings/security/UpdatePassword.vue'
import AuthDevices from '@/pages/settings/security/AuthDevices.vue'
</script>

<template>
  <div class="container-fluid">
    <div class="row">
      <div class="col-12">
        <div class="page-header mb-4">
          <h1 class="page-title">Настройки безопасности</h1>
          <p class="text-muted">Управление паролем и устройствами</p>
        </div>
      </div>
    </div>
    
    <div class="row row-gap-4">
      <div class="col-12">
        <UpdatePassword />
      </div>
      <div class="col-12">
        <AuthDevices />
      </div>
    </div>
  </div>
</template>

<style scoped lang="scss">
.page-header {
  .page-title {
    font-size: 1.75rem;
    font-weight: 600;
    margin-bottom: 0.5rem;
  }
}
</style> 