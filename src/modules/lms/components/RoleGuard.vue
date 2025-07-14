<script setup>
import { computed } from 'vue'
import { globalUserRole } from '../composables/useUserRole'

const props = defineProps({
  roles: {
    type: Array,
    default: () => []
  },
  permissions: {
    type: Array,
    default: () => []
  },
  fallbackMessage: {
    type: String,
    default: 'У вас нет доступа к этому разделу'
  },
  showFallback: {
    type: Boolean,
    default: true
  }
})

const userRole = globalUserRole

const hasAccess = computed(() => {
  if (!userRole.userRoles.value || userRole.userRoles.value.length === 0) {
    return false
  }

  // Если роли не указаны, доступ разрешен
  if (props.roles.length === 0 && props.permissions.length === 0) {
    return true
  }

  // Проверяем роли
  if (props.roles.length > 0) {
    // Используем новый метод hasRole если доступен
    if (userRole.hasRole) {
      const hasRequiredRole = props.roles.some(role => userRole.hasRole(role))
      if (hasRequiredRole) {
        return true
      }
    } else {
      // Fallback на старую логику
      const currentRole = userRole.primaryRole.value
      const hasRequiredRole = props.roles.includes(currentRole)
      if (hasRequiredRole) {
        return true
      }
      
      // Дополнительная проверка через computed свойства ролей
      const hasRoleCheck = props.roles.some(role => {
        switch(role) {
          case 'student': return userRole.isStudent.value
          case 'teacher': return userRole.isTeacher.value
          case 'admin': return userRole.isAdmin.value
          case 'moderator': return userRole.isModerator.value
          default: return false
        }
      })
      
      if (hasRoleCheck) {
        return true
      }
    }
  }

  // Проверяем права доступа
  if (props.permissions.length > 0) {
    const hasRequiredPermission = props.permissions.every(permission => 
      userRole.canAccess(permission)
    )
    if (hasRequiredPermission) {
      return true
    }
  }

  return false
})
</script>

<template>
  <div>
    <slot v-if="hasAccess" />
    <div v-else-if="showFallback" class="alert alert-warning">
      <i class="bi bi-exclamation-triangle-fill me-2"></i>
      {{ fallbackMessage }}
    </div>
  </div>
</template>

<style scoped>
.alert {
  border-radius: 8px;
}
</style> 