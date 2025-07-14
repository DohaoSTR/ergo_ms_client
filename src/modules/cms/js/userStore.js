import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { useToast } from 'vue-toastification'
import { apiClient } from '@/js/api/manager.js'
import { endpoints } from '@/js/api/endpoints.js'
import { profileService } from '@/modules/cms/js/profileService.js'
import Cookies from 'js-cookie'

export const useUserStore = defineStore('userStore', () => {
  const toast = useToast()

  // ==== STATES ====
  const user = ref(null)
  const profile = ref(null)
  const avatarUrl = ref(null) // null означает использование стандартного аватара
  const isLoading = ref(false)
  const isInitialized = ref(false)

  // ==== GETTERS ====
  const isAuthenticated = computed(() => !!user.value)
  const fullName = computed(() => {
    if (!user.value) return 'Гость'
    if (profile.value?.fullName) return profile.value.fullName
    
    // Обрабатываем имя и фамилию
    const firstName = user.value.first_name?.trim() || ''
    const lastName = user.value.last_name?.trim() || ''
    const fullName = `${firstName} ${lastName}`.trim()
    
    // Если нет ни имени, ни фамилии, возвращаем "Гость"
    if (!fullName) return 'Гость'
    
    return fullName
  })
  
  const displayName = computed(() => {
    const name = fullName.value
    if (name === 'Гость') return name
    
    // Если имя длинное, сокращаем до "Имя Ф."
    const parts = name.split(' ')
    if (parts.length >= 2 && parts[0] && parts[1]) {
      return `${parts[0]} ${parts[1].charAt(0)}.`
    }
    return name
  })

  const userEmail = computed(() => user.value?.email || 'email не указан')
  const userRole = computed(() => profile.value?.role || 'Пользователь')
  const hasCustomAvatar = computed(() => !!avatarUrl.value)

  // ==== ACTIONS ====
  
  // Инициализация пользователя
  const initializeUser = async () => {
    if (isInitialized.value) return true

    try {
      isLoading.value = true
      
      // Сначала проверяем авторизацию
      const authResponse = await apiClient.get(endpoints.auth.protected)
      if (!authResponse?.data?.id) {
        throw new Error('Пользователь не авторизован')
      }

      user.value = authResponse.data
      
      // Загружаем полный профиль
      await loadProfile()
      
      // Загружаем аватар
      await loadAvatar()
      
      isInitialized.value = true
      return true

    } catch (error) {
      console.error('Ошибка инициализации пользователя:', error)
      user.value = null
      profile.value = null
      avatarUrl.value = null // Используем стандартный аватар
      return false
    } finally {
      isLoading.value = false
    }
  }

  // Загрузка полного профиля пользователя
  const loadProfile = async () => {
    try {
      const profileData = await profileService.getProfile()
      profile.value = profileService.formatProfileData(profileData)
      
      // Обновляем базовую информацию пользователя
      if (profileData) {
        user.value = {
          ...user.value,
          ...profileData
        }
      }

    } catch (error) {
      console.error('Ошибка загрузки профиля:', error)
      // Не показываем ошибку пользователю, профиль может быть пустым
    }
  }

  // Загрузка аватара пользователя
  const loadAvatar = async () => {
    try {
      const response = await apiClient.get(endpoints.userAvatars.list)
      if (response.data?.length && response.data[0].image) {
        avatarUrl.value = response.data[0].image
      }
    } catch (error) {
      console.error('Ошибка загрузки аватара:', error)
      // Оставляем дефолтный аватар
    }
  }

  // Обновление профиля
  const updateProfile = async (profileData) => {
    try {
      isLoading.value = true
      const updatedProfile = await profileService.updateProfile(profileData)
      profile.value = profileService.formatProfileData(updatedProfile)
      
      // Обновляем базовую информацию пользователя
      if (updatedProfile) {
        user.value = {
          ...user.value,
          ...updatedProfile
        }
      }

      toast.success('Профиль успешно обновлен')
      return updatedProfile

    } catch (error) {
      console.error('Ошибка обновления профиля:', error)
      toast.error('Ошибка обновления профиля')
      throw error
    } finally {
      isLoading.value = false
    }
  }

  // Обновление аватара
  const updateAvatar = async (file) => {
    try {
      if (!file || !file.type.startsWith('image/')) {
        toast.error('Пожалуйста, выберите изображение!')
        return false
      }

      const formData = new FormData()
      formData.append('image', file)
      
      await apiClient.post(endpoints.userAvatars.create, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      })
      
      // Перезагружаем аватар
      await loadAvatar()
      toast.success('Аватар успешно обновлён')
      return true

    } catch (error) {
      console.error('Ошибка обновления аватара:', error)
      toast.error('Ошибка загрузки аватара')
      return false
    }
  }

  // Сброс аватара
  const resetAvatar = async () => {
    try {
      const response = await apiClient.get(endpoints.userAvatars.list)
      if (response.data?.length) {
        await apiClient.delete(endpoints.userAvatars.delete(response.data[0].id))
      }
      avatarUrl.value = null // Используем стандартный аватар
      toast.success('Аватар сброшен')
      return true

    } catch (error) {
      console.error('Ошибка сброса аватара:', error)
      toast.error('Ошибка сброса аватара')
      return false
    }
  }

  // Выход из системы
  const logout = () => {
    user.value = null
    profile.value = null
    avatarUrl.value = null // Используем стандартный аватар
    isInitialized.value = false
    
    // Очищаем куки
    Cookies.remove('userId')
    Cookies.remove('csrftoken')
    
    // Перенаправляем на страницу входа
    window.location.href = '/login'
  }

  // Принудительная перезагрузка данных пользователя
  const refreshUserData = async () => {
    isInitialized.value = false
    return await initializeUser()
  }

  // Обновление всех данных (профиль + аватар) для реактивности компонентов
  const refreshAllData = async () => {
    try {
      isLoading.value = true
      await Promise.all([
        loadProfile(),
        loadAvatar()
      ])
      return true
    } catch (error) {
      console.error('Ошибка обновления данных:', error)
      return false
    } finally {
      isLoading.value = false
    }
  }

  return {
    // States
    user,
    profile,
    avatarUrl,
    isLoading,
    isInitialized,
    
    // Getters
    isAuthenticated,
    fullName,
    displayName,
    userEmail,
    userRole,
    hasCustomAvatar,
    
    // Actions
    initializeUser,
    loadProfile,
    loadAvatar,
    updateProfile,
    updateAvatar,
    resetAvatar,
    logout,
    refreshUserData,
    refreshAllData
  }
}) 