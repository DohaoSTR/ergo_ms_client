<script setup>
import { ref } from 'vue'
import { Settings, User, EyeOff, Eye } from 'lucide-vue-next'
import { globalUserRole } from '../composables/useUserRole'
import { authService } from '@/modules/cms/adp/js/authService'

const userRole = globalUserRole
const isOpen = ref(false)
const isVisible = ref(true)

const availableRoles = [
  { value: 'student', label: 'Студент', color: 'primary' },
  { value: 'teacher', label: 'Преподаватель', color: 'success' },
  { value: 'admin', label: 'Администратор', color: 'danger' }
]

async function switchRole(newRole) {
  try {
    // Попытка переключения через API
    await authService.switchRole(newRole)
    
    // Обновляем локальные данные ролей
    await userRole.loadUserRoles()
    
    isOpen.value = false
    console.log(`Роль переключена на: ${newRole}`)
  } catch (error) {
    console.error('Ошибка переключения роли:', error)
    
    // Fallback для демо-режима
    userRole.userRoles.value = [
      { role: newRole, is_active: true, created_at: new Date() }
    ]
    userRole.userRole.value = newRole
    isOpen.value = false
  }
}
</script>

<template>
  <div class="role-switcher position-fixed" style="bottom: 20px; right: 20px; z-index: 1050;">
    <!-- Кнопка показать/скрыть -->
    <div v-if="!isVisible" class="mb-2 text-end">
      <button 
        @click="isVisible = true"
        class="btn btn-sm btn-secondary rounded-circle"
        title="Показать переключатель ролей"
      >
        <Eye :size="16" />
      </button>
    </div>
    
    <div v-if="isVisible">
      <!-- Демо-режим индикатор -->
      <div class="mb-2 d-flex justify-content-between align-items-center">
        <span class="badge bg-warning text-dark">
          <Settings :size="12" class="me-1" />
          ДЕМО
        </span>
        <button 
          @click="isVisible = false"
          class="btn btn-sm btn-outline-secondary border-0"
          title="Скрыть переключатель ролей"
        >
          <EyeOff :size="14" />
        </button>
      </div>
      
      <!-- Текущая роль -->
      <div class="card shadow-sm">
      <div class="card-body p-3">
        <div class="d-flex align-items-center justify-content-between">
          <div class="d-flex align-items-center gap-2">
            <User :size="16" />
            <span class="small">Роль:</span>
            <span 
              v-if="userRole.primaryRole.value"
              :class="`badge bg-${userRole.getRoleColor(userRole.primaryRole.value)}`"
            >
              {{ userRole.getRoleDisplayName(userRole.primaryRole.value) }}
            </span>
          </div>
          <button 
            @click="isOpen = !isOpen"
            class="btn btn-sm btn-outline-secondary border-0"
          >
            <Settings :size="14" />
          </button>
        </div>
        
        <!-- Выпадающий список ролей -->
        <div v-if="isOpen" class="mt-3 pt-3 border-top">
          <div class="d-grid gap-2">
            <button
              v-for="role in availableRoles"
              :key="role.value"
              @click="switchRole(role.value)"
              :class="`btn btn-sm btn-outline-${role.color} ${
                userRole.primaryRole.value === role.value ? 'active' : ''
              }`"
            >
              {{ role.label }}
            </button>
          </div>
        </div>
      </div>
    </div>
    </div>
  </div>
</template>

<style scoped>
.role-switcher {
  min-width: 200px;
}

.card {
  border: 1px solid rgba(0,0,0,0.125);
}

.btn.active {
  box-shadow: 0 0 0 0.2rem rgba(var(--bs-primary-rgb), 0.25);
}
</style> 