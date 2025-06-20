import { apiClient } from '../manager'
import { endpoints } from '../endpoints'

export const authService = {
  // Получить информацию о текущем пользователе
  async getCurrentUser() {
    try {
      const response = await apiClient.get(endpoints.lms.myProfile)
      return response.data
    } catch (error) {
      console.error('Ошибка получения данных пользователя:', error)
      throw error
    }
  },

  // Получить роли пользователя
  async getUserRoles() {
    try {
      const response = await apiClient.get(endpoints.lms.userRoles)
      return response.data
    } catch (error) {
      console.error('Ошибка получения ролей пользователя:', error)
      // Fallback на демо данные
      return [{ role: 'student', is_active: true, created_at: new Date() }]
    }
  },

  // Переключить роль пользователя (для демо)
  async switchRole(roleName) {
    try {
      const response = await apiClient.post(endpoints.lms.switchRole, { role: roleName })
      return response.data
    } catch (error) {
      console.error('Ошибка переключения роли:', error)
      throw error
    }
  },

  // Проверить, имеет ли пользователь определенную роль
  async hasRole(roleName) {
    try {
      const roles = await this.getUserRoles()
      return roles.some(role => role.role === roleName && role.is_active)
    } catch (error) {
      console.error('Ошибка проверки роли:', error)
      return false
    }
  },

  // Проверить, является ли пользователь преподавателем
  async isTeacher() {
    return await this.hasRole('teacher')
  },

  // Проверить, является ли пользователь студентом
  async isStudent() {
    return await this.hasRole('student')
  },

  // Проверить, является ли пользователь администратором
  async isAdmin() {
    return await this.hasRole('admin')
  },

  // Проверить, является ли пользователь модератором
  async isModerator() {
    return await this.hasRole('moderator')
  },

  // Получить основную роль пользователя (первую активную)
  async getPrimaryRole() {
    try {
      const roles = await this.getUserRoles()
      if (!Array.isArray(roles) || roles.length === 0) {
        return 'student' // Дефолтная роль
      }
      const activeRoles = roles.filter(role => role.is_active)
      return activeRoles.length > 0 ? activeRoles[0].role : 'student'
    } catch (error) {
      console.error('Ошибка получения основной роли:', error)
      return 'student'
    }
  },

  // Проверить права доступа к функции
  async canAccessFunction(functionName) {
    const role = await this.getPrimaryRole()
    
    const permissions = {
      // Преподавательские функции
      'create_course': ['teacher', 'admin'],
      'edit_course': ['teacher', 'admin'],
      'grade_assignments': ['teacher', 'admin'],
      'manage_students': ['teacher', 'admin'],
      'create_tests': ['teacher', 'admin'],
      'view_analytics': ['teacher', 'admin'],
      
      // Студенческие функции
      'enroll_course': ['student', 'teacher', 'admin'],
      'submit_assignment': ['student'],
      'take_test': ['student'],
      'view_grades': ['student', 'teacher', 'admin'],
      
      // Общие функции
      'view_courses': ['student', 'teacher', 'admin', 'guest'],
      'use_forums': ['student', 'teacher', 'admin'],
      'view_calendar': ['student', 'teacher', 'admin'],
      'view_badges': ['student', 'teacher', 'admin'],
      
      // Административные функции
      'manage_users': ['admin'],
      'system_settings': ['admin'],
      'delete_courses': ['admin']
    }

    const allowedRoles = permissions[functionName] || []
    return allowedRoles.includes(role)
  }
}

// Композиция для Vue компонентов
export function useAuth() {
  return {
    authService,
    isTeacher: () => authService.isTeacher(),
    isStudent: () => authService.isStudent(),
    isAdmin: () => authService.isAdmin(),
    canAccess: (functionName) => authService.canAccessFunction(functionName),
    getPrimaryRole: () => authService.getPrimaryRole()
  }
} 