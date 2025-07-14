<script setup>
import UpdatePassword from '@/modules/cms/adp/settings/security/UpdatePassword.vue'
import AuthDevices from '@/modules/cms/adp/settings/security/AuthDevices.vue'
import SecuritySettings from '@/modules/cms/adp/settings/security/SecuritySettings.vue'
</script>

<template>
  <div class="container-fluid">
    <div class="row g-4">
      <!-- Настройки безопасности и приватности -->
      <div class="col-12">
        <SecuritySettings />
      </div>
      
      <!-- Смена пароля -->
      <div class="col-12 col-xl-6">
        <UpdatePassword />
      </div>
      
      <!-- Управление устройствами -->
      <div class="col-12 col-xl-6">
        <AuthDevices />
      </div>
    </div>
  </div>
</template>

<style scoped lang="scss">
.container-fluid {
  padding: 0;
}

.row {
  margin: 0;
}

// Адаптивное отображение на разных устройствах
@media (max-width: 1199.98px) {
  .col-xl-6 {
    margin-bottom: 1rem;
  }
}

// Улучшение отображения на больших экранах
@media (min-width: 1400px) {
  .container-fluid {
    max-width: 1320px;
    margin: 0 auto;
  }
}
</style>
