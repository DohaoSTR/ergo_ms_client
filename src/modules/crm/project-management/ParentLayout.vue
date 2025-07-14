<template>
  <div>
    <router-view />
    <NotificationProvider />
  </div>
</template>

<script>
import NotificationProvider from '@/components/NotificationProvider.vue'

export default {
  name: 'ProjectManagementParentLayout',
  components: {
    NotificationProvider
  }
}
</script> 