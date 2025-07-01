<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { GraduationCap, BookOpen, FileCheck, Award, Calendar, ChartBar, Settings, User, Library } from 'lucide-vue-next'

import NavigationButtons from '@/components/NavigationButtons.vue'
import RoleSwitcher from './components/RoleSwitcher.vue'
import { globalUserRole } from './composables/useUserRole'

const route = useRoute()
const router = useRouter()
const userRole = globalUserRole

// Навигационные кнопки в зависимости от роли
const navigationButtons = computed(() => {
  if (userRole.isLoading.value) {
    return []
  }

  const baseButtons = [
    { icon: ChartBar, title: 'Панель пользователя', link: 'LMSDashboard', roles: ['student', 'teacher', 'admin'] },
    { icon: GraduationCap, title: 'Каталог курсов', link: 'LMSCatalog', roles: ['student', 'teacher', 'admin', 'guest'] },
    { icon: Calendar, title: 'Календарь', link: 'LMSCalendar', roles: ['student', 'teacher', 'admin'] },
    { icon: Award, title: 'Достижения', link: 'LMSBadges', roles: ['student', 'teacher', 'admin'] }
  ]

  const studentButtons = [
    { icon: BookOpen, title: 'Мои курсы', link: 'LMSCourses', roles: ['student'] },
    { icon: FileCheck, title: 'Оценки', link: 'LMSGrades', roles: ['student'] }
  ]

  const teacherButtons = [
    { icon: Settings, title: 'Управление курсами', link: 'LMSLessonsManagement', roles: ['teacher', 'admin'] },
    { icon: Settings, title: 'Структура курсов', link: 'LMSCategoriesAndFormats', roles: ['teacher', 'admin'] }
  ]

  let allButtons = [...baseButtons]
  
  if (userRole.isStudent.value ) {
    allButtons.push(...studentButtons)
  }
  
  if (userRole.isTeacher.value || userRole.isAdmin.value) {
    allButtons.push(...teacherButtons)
  }

  return allButtons.filter(button => 
    button.roles.includes(userRole.primaryRole.value)
  )
})

onMounted(() => {
  userRole.loadUserRoles()
})
</script>

<template>
  <div class="lms-layout">
    <div class="lms-header rounded overflow-hidden mb-4">
      <div class="lms-cover">
        <div class="overlay">
          <div class="container p-4">
            <div class="d-flex align-items-center gap-3">
              <div class="icon-container">
                <GraduationCap :size="48" class="text-white" />
              </div>
              <div class="flex-grow-1">
                <h2 class="text-white mb-1">Система обучения</h2>
                <p class="text-white-50 mb-0">Изучайте новые навыки и развивайтесь профессионально</p>
              </div>
              
              <!-- Роль пользователя -->
              <div v-if="!userRole.isLoading.value && userRole.primaryRole.value" class="user-role">
                <div class="d-flex align-items-center gap-2">
                  <User :size="20" class="text-white-50" />
                  <span 
                    :class="`badge bg-${userRole.getRoleColor(userRole.primaryRole.value)}`"
                    style="font-size: 0.9rem; padding: 0.5rem 1rem;"
                  >
                    {{ userRole.getRoleDisplayName(userRole.primaryRole.value) }}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <div class="mb-4">
      <NavigationButtons :data="navigationButtons" />
    </div>

    <RouterView />
    
    <!-- Переключатель ролей для демо -->
    <RoleSwitcher />
  </div>
</template>

<style lang="scss" scoped>
.lms-layout {
  .lms-header {
    position: relative;
    
    .lms-cover {
      height: 180px;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      position: relative;
      
      .overlay {
        position: absolute;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background: rgba(0, 0, 0, 0.2);
        display: flex;
        align-items: center;
      }
    }
    
    .icon-container {
      background: rgba(255, 255, 255, 0.2);
      border-radius: 12px;
      padding: 12px;
      backdrop-filter: blur(10px);
    }
  }
}

@media (max-width: 768px) {
  .lms-layout {
    .lms-header .lms-cover {
      height: 140px;
      
      .container {
        padding: 2rem 1rem !important;
      }
      
      h2 {
        font-size: 1.5rem;
      }
    }
  }
}
</style> 