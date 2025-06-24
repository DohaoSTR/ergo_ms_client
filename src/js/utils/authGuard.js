import { authService } from '@/js/api/services/auth'
import Cookies from 'js-cookie'

/**
 * Утилита для управления аутентификацией и автоматического logout
 */
export class AuthGuard {
  constructor() {
    this.tokenCheckInterval = null
    this.isCheckingToken = false
  }

  /**
   * Запускает периодическую проверку токена
   * @param {number} intervalMs Интервал проверки в миллисекундах (по умолчанию 5 минут)
   */
  startTokenValidation(intervalMs = 5 * 60 * 1000) {
    // Останавливаем предыдущий интервал если он был
    this.stopTokenValidation()

    this.tokenCheckInterval = setInterval(async () => {
      await this.validateCurrentToken()
    }, intervalMs)

    // Выполняем первую проверку сразу
    this.validateCurrentToken()
  }

  /**
   * Останавливает периодическую проверку токена
   */
  stopTokenValidation() {
    if (this.tokenCheckInterval) {
      clearInterval(this.tokenCheckInterval)
      this.tokenCheckInterval = null
    }
  }

  /**
   * Проверяет текущий токен и выполняет logout если он недействителен
   */
  async validateCurrentToken() {
    if (this.isCheckingToken) {
      return // Предотвращаем множественные одновременные проверки
    }

    const token = Cookies.get('token')
    if (!token) {
      return // Если токена нет, проверка не нужна
    }

    this.isCheckingToken = true

    try {
      const isValid = await authService.checkToken()
      
      if (!isValid) {
        console.warn('Токен недействителен. Выполняется автоматический logout.')
        this.forceLogout()
      }
    } catch (error) {
      console.error('Ошибка при проверке токена:', error)
      // При ошибке проверки также выполняем logout
      this.forceLogout()
    } finally {
      this.isCheckingToken = false
    }
  }

  /**
   * Принудительно выполняет logout и перенаправляет на стартовую страницу
   */
  forceLogout() {
    // Очищаем токены
    authService.logout()
    
    // Останавливаем проверку токена
    this.stopTokenValidation()
    
    // Перенаправляем на стартовую страницу
    if (typeof window !== 'undefined' && window.location) {
      // Проверяем, не находимся ли мы уже на стартовой странице
      if (!window.location.pathname.includes('/start') && !window.location.pathname.includes('/login')) {
        console.log('Перенаправление на стартовую страницу из-за недействительного токена')
        window.location.href = '/start'
      }
    }
  }

  /**
   * Проверяет, авторизован ли пользователь
   */
  isAuthenticated() {
    return !!Cookies.get('token')
  }
}

// Создаем глобальный экземпляр
export const authGuard = new AuthGuard()

// Автоматически запускаем проверку токена при загрузке модуля
if (typeof window !== 'undefined') {
  // Запускаем проверку только если пользователь авторизован
  if (authGuard.isAuthenticated()) {
    authGuard.startTokenValidation()
  }
} 