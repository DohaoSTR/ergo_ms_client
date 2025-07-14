import { ref, computed, readonly, onMounted } from 'vue'
import { authService } from '@/js/api/services/authService'

const userRole = ref(null)
const userRoles = ref([])
const currentUser = ref(null)
const isLoading = ref(true)

export function useUserRole() {
  // Вычисляемые свойства для проверки ролей
  const isTeacher = computed(() => {
    return Array.isArray(userRoles.value) && userRoles.value.some(role => role.role === 'teacher' && role.is_active)
  })

  const isStudent = computed(() => {
    return Array.isArray(userRoles.value) && userRoles.value.some(role => role.role === 'student' && role.is_active)
  })

  const isAdmin = computed(() => {
    return Array.isArray(userRoles.value) && userRoles.value.some(role => role.role === 'admin' && role.is_active)
  })

  const isModerator = computed(() => {
    return Array.isArray(userRoles.value) && userRoles.value.some(role => role.role === 'moderator' && role.is_active)
  })

  const primaryRole = computed(() => {
    if (!Array.isArray(userRoles.value)) return 'guest'
    const activeRoles = userRoles.value.filter(role => role.is_active)
    return activeRoles.length > 0 ? activeRoles[0].role : 'guest'
  })

  // Проверить, есть ли у пользователя определенная роль
  const hasRole = (roleName) => {
    if (!Array.isArray(userRoles.value)) return false
    return userRoles.value.some(role => role.role === roleName && role.is_active)
  }

  // Псевдоним для обратной совместимости
  const canAccessFunction = (functionName) => canAccess(functionName)

  // Функции для проверки прав доступа
  const canAccess = (functionName) => {
    const role = primaryRole.value
    
    const permissions = {
      // Преподавательские функции
      'create_course': ['teacher', 'admin'],
      'edit_course': ['teacher', 'admin'],
      'grade_assignments': ['teacher', 'admin'],
      'manage_students': ['teacher', 'admin'],
      'create_tests': ['teacher', 'admin'],
      'view_analytics': ['teacher', 'admin'],
      'teaching_tools': ['teacher', 'admin'],
      
      // Студенческие функции
      'enroll_course': ['student', 'teacher', 'admin'],
      'submit_assignment': ['student'],
      'take_test': ['student'],
      'view_own_grades': ['student'],
      'student_dashboard': ['student', 'teacher', 'admin'],
      
      // Общие функции
      'view_courses': ['student', 'teacher', 'admin', 'guest'],
      'use_forums': ['student', 'teacher', 'admin'],
      'view_calendar': ['student', 'teacher', 'admin'],
      'view_badges': ['student', 'teacher', 'admin'],
      'view_catalog': ['student', 'teacher', 'admin', 'guest'],
      
      // Административные функции
      'manage_users': ['admin'],
      'system_settings': ['admin'],
      'delete_courses': ['admin']
    }

    const allowedRoles = permissions[functionName] || []
    return allowedRoles.includes(role)
  }

  // Получить название роли на русском языке
  const getRoleDisplayName = (role) => {
    const roleNames = {
      'student': 'Студент',
      'teacher': 'Преподаватель',
      'admin': 'Администратор',
      'moderator': 'Модератор',
      'guest': 'Гость'
    }
    return roleNames[role] || role
  }

  // Получить цвет для роли
  const getRoleColor = (role) => {
    const roleColors = {
      'student': 'primary',
      'teacher': 'success',
      'admin': 'danger',
      'moderator': 'warning',
      'guest': 'secondary'
    }
    return roleColors[role] || 'secondary'
  }

  // Загрузить роли пользователя
  const loadUserRoles = async () => {
    try {
      isLoading.value = true
      
      // Загружаем роли пользователя
      const roles = await authService.getUserRoles()
      console.log('Загруженные роли:', roles)
      userRoles.value = Array.isArray(roles) ? roles : []
      userRole.value = await authService.getPrimaryRole()
      console.log('Основная роль:', userRole.value)
      
      // Загружаем информацию о текущем пользователе
      const user = await authService.getCurrentUser()
      currentUser.value = user
      console.log('Текущий пользователь:', user)
    } catch (error) {
      console.error('Ошибка загрузки ролей пользователя:', error)
      // При ошибке очищаем данные - пользователь должен перелогиниться
      userRoles.value = []
      userRole.value = null
      currentUser.value = null
      throw error // Прокидываем ошибку выше для обработки
    } finally {
      isLoading.value = false
    }
  }

  // Получить меню в зависимости от роли
  const getRoleBasedMenu = () => {
    const role = primaryRole.value
    
    const baseMenu = [
      { route: 'LMSDashboard', label: 'Дашборд', roles: ['student', 'teacher', 'admin'] },
      { route: 'LMSCatalog', label: 'Каталог курсов', roles: ['student', 'teacher', 'admin', 'guest'] },
      { route: 'LMSForums', label: 'Форумы', roles: ['student', 'teacher', 'admin'] },
      { route: 'LMSCalendar', label: 'Календарь', roles: ['student', 'teacher', 'admin'] },
      { route: 'LMSBadges', label: 'Достижения', roles: ['student', 'teacher', 'admin'] }
    ]

    const studentMenu = [
      { route: 'LMSCourses', label: 'Мои курсы', roles: ['student'] },
      { route: 'LMSAssignments', label: 'Задания', roles: ['student'] },
      { route: 'LMSTests', label: 'Тесты', roles: ['student'] },
      { route: 'LMSGrades', label: 'Оценки', roles: ['student'] }
    ]

    const teacherMenu = [
      { route: 'LMSTeaching', label: 'Преподавание', roles: ['teacher', 'admin'] }
    ]

    let menu = [...baseMenu]
    
    if (isStudent.value) {
      menu.push(...studentMenu)
    }
    
    if (isTeacher.value || isAdmin.value) {
      menu.push(...teacherMenu)
    }

    return menu.filter(item => item.roles.includes(role))
  }

  return {
    // Состояние
    userRole: readonly(userRole),
    userRoles: readonly(userRoles),
    currentUser: readonly(currentUser),
    isLoading: readonly(isLoading),
    
    // Вычисляемые свойства
    isTeacher,
    isStudent,
    isAdmin,
    isModerator,
    primaryRole,
    
    // Методы
    hasRole,
    canAccess,
    canAccessFunction,
    getRoleDisplayName,
    getRoleColor,
    loadUserRoles,
    getRoleBasedMenu
  }
}

// Глобальный экземпляр для использования через приложение
export const globalUserRole = useUserRole()

// Автоматически загружаем роли при инициализации, но только один раз
let rolesLoaded = false
if (!rolesLoaded) {
  rolesLoaded = true
  globalUserRole.loadUserRoles()
} 