import { apiClient } from '../../../js/api/manager'
import { endpoints } from '../../../js/api/endpoints'

export const profileService = {
  // Получить полный профиль пользователя
  async getProfile() {
    try {
      const response = await apiClient.get(endpoints.auth.profile)
      return response.data
    } catch (error) {
      console.error('Ошибка получения профиля:', error)
      throw error
    }
  },

  // Обновить профиль пользователя
  async updateProfile(profileData) {
    try {
      const response = await apiClient.put(endpoints.auth.profile, profileData)
      return response.data
    } catch (error) {
      console.error('Ошибка обновления профиля:', error)
      throw error
    }
  },

  // Получить настройки безопасности
  async getSecuritySettings() {
    try {
      const response = await apiClient.get(endpoints.auth.securitySettings)
      return response.data
    } catch (error) {
      console.error('Ошибка получения настроек безопасности:', error)
      throw error
    }
  },

  // Обновить настройки безопасности
  async updateSecuritySettings(securityData) {
    try {
      const response = await apiClient.put(endpoints.auth.securitySettings, securityData)
      return response.data
    } catch (error) {
      console.error('Ошибка обновления настроек безопасности:', error)
      throw error
    }
  },

  // Смена пароля
  async changePassword(passwordData) {
    try {
      const response = await apiClient.post(endpoints.auth.changePassword, passwordData)
      return response.data
    } catch (error) {
      console.error('Ошибка смены пароля:', error)
      throw error
    }
  },

  // Получить список устройств пользователя
  async getDevices() {
    try {
      const response = await apiClient.get(endpoints.auth.devices)
      return response.data
    } catch (error) {
      console.error('Ошибка получения списка устройств:', error)
      throw error
    }
  },

  // Удалить устройство (завершить сессию на устройстве)
  async deleteDevice(deviceId) {
    try {
      const response = await apiClient.delete(endpoints.auth.deleteDevice(deviceId))
      return response.data
    } catch (error) {
      console.error('Ошибка удаления устройства:', error)
      throw error
    }
  },

  // Авторизация пользователя
  async login(credentials) {
    try {
      const response = await apiClient.post(endpoints.auth.login, credentials, false)
      return response.data
    } catch (error) {
      console.error('Ошибка авторизации:', error)
      throw error
    }
  },

  // Валидация данных регистрации
  async validateRegistration(userData) {
    try {
      const response = await apiClient.post(endpoints.auth.validateRegistration, userData, false)
      return response.data
    } catch (error) {
      console.error('Ошибка валидации регистрации:', error)
      throw error
    }
  },

  // Регистрация нового пользователя
  async register(userData) {
    try {
      const response = await apiClient.post(endpoints.auth.registration, userData, false)
      return response.data
    } catch (error) {
      console.error('Ошибка регистрации:', error)
      throw error
    }
  },

  // Отправка кода подтверждения
  async sendConfirmationCode(email) {
    try {
      const response = await apiClient.post(endpoints.auth.sendCode, { email })
      return response.data
    } catch (error) {
      console.error('Ошибка отправки кода подтверждения:', error)
      throw error
    }
  },

  // Проверка кода подтверждения
  async verifyConfirmationCode(email, code) {
    try {
      const response = await apiClient.post(endpoints.auth.verifyCode, { email, code })
      return response.data
    } catch (error) {
      console.error('Ошибка проверки кода подтверждения:', error)
      throw error
    }
  },

  // Форматирование данных профиля для отображения
  formatProfileData(profileData) {
    if (!profileData) return null

    const user = profileData
    const profile = profileData.adp_profile || {}

    return {
      // Основная информация
      id: user.id,
      username: user.username,
      email: user.email,
      firstName: user.first_name || '',
      lastName: user.last_name || '',
      fullName: profile.full_name || `${user.first_name || ''} ${user.last_name || ''}`.trim() || user.username,
      isActive: user.is_active,
      dateJoined: user.date_joined,

      // Профиль пользователя
      avatar: profile.avatar,
      phone: profile.phone || '',
      website: profile.website || '',
      bio: profile.bio || '',
      country: profile.country || '',
      city: profile.city || '',
      language: profile.language || 'ru',
      timezone: profile.timezone || 'Europe/Moscow',

      // Настройки уведомлений
      emailNotifications: profile.email_notifications !== undefined ? profile.email_notifications : true,
      pushNotifications: profile.push_notifications !== undefined ? profile.push_notifications : true,
      smsNotifications: profile.sms_notifications !== undefined ? profile.sms_notifications : false,

      // Настройки приватности
      profileVisibility: profile.profile_visibility || 'public',
      twoFactorEnabled: profile.two_factor_enabled || false,

      // Метаданные
      createdAt: profile.created_at,
      updatedAt: profile.updated_at
    }
  },

  // Форматирование данных устройства
  formatDeviceData(device) {
    if (!device) return null

    return {
      id: device.id,
      deviceType: device.device_type,
      deviceName: device.device_name,
      ipAddress: device.ip_address,
      city: device.city || 'Неизвестно',
      country: device.country || 'Неизвестно',
      isActive: device.is_active,
      lastActivity: device.last_activity,
      createdAt: device.created_at,
      
      // Вспомогательные поля для UI
      deviceIcon: this.getDeviceIcon(device.device_type),
      isCurrentDevice: device.is_active, // можно дополнительно проверить по IP
      formattedLastActivity: this.formatLastActivity(device.last_activity)
    }
  },

  // Получить иконку для типа устройства
  getDeviceIcon(deviceType) {
    const iconMap = {
      'desktop': 'Monitor',
      'laptop': 'Laptop',
      'mobile': 'Smartphone',
      'tablet': 'Tablet'
    }
    return iconMap[deviceType] || 'Monitor'
  },

  // Форматировать время последней активности
  formatLastActivity(lastActivity) {
    if (!lastActivity) return 'Никогда'
    
    const date = new Date(lastActivity)
    const now = new Date()
    const diff = now - date
    
    // Менее минуты
    if (diff < 60000) {
      return 'Сейчас'
    }
    
    // Менее часа
    if (diff < 3600000) {
      const minutes = Math.floor(diff / 60000)
      return `${minutes} мин. назад`
    }
    
    // Менее дня
    if (diff < 86400000) {
      const hours = Math.floor(diff / 3600000)
      return `${hours} ч. назад`
    }
    
    // Более дня
    const days = Math.floor(diff / 86400000)
    if (days < 7) {
      return `${days} дн. назад`
    }
    
    // Форматированная дата
    return date.toLocaleDateString('ru-RU', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    })
  },

  // Валидация данных профиля
  validateProfileData(profileData) {
    const errors = {}

    // Проверка email
    if (profileData.email && !/\S+@\S+\.\S+/.test(profileData.email)) {
      errors.email = 'Некорректный формат email'
    }

    // Проверка телефона
    if (profileData.phone && !/^[\+]?[1-9][\d]{0,15}$/.test(profileData.phone.replace(/\s/g, ''))) {
      errors.phone = 'Некорректный формат телефона'
    }

    // Проверка website
    if (profileData.website && !/^https?:\/\/.+/.test(profileData.website)) {
      errors.website = 'URL должен начинаться с http:// или https://'
    }

    // Проверка био
    if (profileData.bio && profileData.bio.length > 500) {
      errors.bio = 'Описание не должно превышать 500 символов'
    }

    return {
      isValid: Object.keys(errors).length === 0,
      errors
    }
  }
}

// Композиция для использования в Vue компонентах
export function useProfile() {
  return {
    profileService,
    getProfile: () => profileService.getProfile(),
    updateProfile: (data) => profileService.updateProfile(data),
    getSecuritySettings: () => profileService.getSecuritySettings(),
    updateSecuritySettings: (data) => profileService.updateSecuritySettings(data),
    changePassword: (data) => profileService.changePassword(data),
    getDevices: () => profileService.getDevices(),
    deleteDevice: (id) => profileService.deleteDevice(id),
    formatProfileData: (data) => profileService.formatProfileData(data),
    formatDeviceData: (data) => profileService.formatDeviceData(data),
    validateProfileData: (data) => profileService.validateProfileData(data)
  }
} 