import { ref, computed } from 'vue'
import { apiClient } from '@/js/api/manager'
import { endpoints } from '@/js/api/endpoints'
import { useNotifications } from './useNotifications'

const { showError, showSuccess } = useNotifications()

export function useApi() {
  const loading = ref(false)
  const error = ref(null)
  const data = ref(null)

  // Универсальный метод для API запросов
  async function apiCall(method, url, payload = null, options = {}) {
    try {
      loading.value = true
      error.value = null
      
      let response
      switch (method.toLowerCase()) {
        case 'get':
          response = await apiClient.get(url, options)
          break
        case 'post':
          response = await apiClient.post(url, payload, options)
          break
        case 'put':
          response = await apiClient.put(url, payload, options)
          break
        case 'patch':
          response = await apiClient.patch(url, payload, options)
          break
        case 'delete':
          response = await apiClient.delete(url, options)
          break
        default:
          throw new Error(`Неподдерживаемый HTTP метод: ${method}`)
      }

      if (response.success !== false) {
        data.value = response.data
        return response
      } else {
        throw new Error(response.message || 'API error')
      }
    } catch (err) {
      error.value = err.message || 'Произошла ошибка'
      console.error('API Error:', err)
      throw err
    } finally {
      loading.value = false
    }
  }

  // Специализированные методы для LMS
  const lmsApi = {
    // Курсы
    async getCourses() {
      return apiCall('get', endpoints.lms.subjects)
    },

    async getCourse(id) {
      return apiCall('get', `${endpoints.lms.subjects}${id}/`)
    },

    async createCourse(courseData) {
      const response = await apiCall('post', endpoints.lms.subjects, courseData)
      showSuccess('Курс успешно создан')
      return response
    },

    async updateCourse(id, courseData) {
      const response = await apiCall('patch', `${endpoints.lms.subjects}${id}/`, courseData)
      showSuccess('Курс успешно обновлен')
      return response
    },

    async deleteCourse(id) {
      const response = await apiCall('delete', `${endpoints.lms.subjects}${id}/`)
      showSuccess('Курс успешно удален')
      return response
    },

    // Записи на курсы
    async getEnrollments() {
      return apiCall('get', endpoints.lms.enrollments)
    },

    async enrollInCourse(courseId) {
      const response = await apiCall('post', `${endpoints.lms.subjects}${courseId}/enroll/`)
      showSuccess('Вы успешно записались на курс')
      return response
    },

    async unenrollFromCourse(courseId) {
      const response = await apiCall('delete', `${endpoints.lms.subjects}${courseId}/unenroll/`)
      showSuccess('Вы отписались от курса')
      return response
    },

    // Избранное
    async addToFavorites(courseId) {
      const response = await apiCall('post', `${endpoints.lms.subjects}${courseId}/favorite/`)
      return response
    },

    async removeFromFavorites(courseId) {
      const response = await apiCall('delete', `${endpoints.lms.subjects}${courseId}/favorite/`)
      return response
    },

    async getFavorites() {
      return apiCall('get', endpoints.lms.favorites || `${endpoints.lms.subjects}favorites/`)
    },

    // Темы
    async getThemes(courseId = null) {
      const url = courseId ? `${endpoints.lms.themes}?subject=${courseId}` : endpoints.lms.themes
      return apiCall('get', url)
    },

    async createTheme(themeData) {
      const response = await apiCall('post', endpoints.lms.themes, themeData)
      showSuccess('Тема успешно создана')
      return response
    },

    async updateTheme(id, themeData) {
      const response = await apiCall('patch', `${endpoints.lms.themes}${id}/`, themeData)
      showSuccess('Тема успешно обновлена')
      return response
    },

    async deleteTheme(id) {
      const response = await apiCall('delete', `${endpoints.lms.themes}${id}/`)
      showSuccess('Тема успешно удалена')
      return response
    },

    // Уроки
    async getLessons(themeId = null) {
      const url = themeId ? `${endpoints.lms.lessons}?theme=${themeId}` : endpoints.lms.lessons
      return apiCall('get', url)
    },

    async createLesson(lessonData) {
      const response = await apiCall('post', endpoints.lms.lessons, lessonData)
      showSuccess('Урок успешно создан')
      return response
    },

    async updateLesson(id, lessonData) {
      const response = await apiCall('patch', `${endpoints.lms.lessons}${id}/`, lessonData)
      showSuccess('Урок успешно обновлен')
      return response
    },

    async deleteLesson(id) {
      const response = await apiCall('delete', `${endpoints.lms.lessons}${id}/`)
      showSuccess('Урок успешно удален')
      return response
    },

    // Статистика
    async getStudentStats() {
      return apiCall('get', endpoints.lms.studentStats)
    },

    async getTeacherStats() {
      return apiCall('get', endpoints.lms.teacherStats)
    },

    async getDashboardData() {
      return apiCall('get', endpoints.lms.dashboard)
    }
  }

  return {
    // Состояние
    loading: computed(() => loading.value),
    error: computed(() => error.value),
    data: computed(() => data.value),

    // Методы
    apiCall,
    lmsApi,

    // Утилиты
    clearError: () => { error.value = null },
    clearData: () => { data.value = null }
  }
}

// Глобальные вспомогательные функции
export function useLmsData() {
  const { lmsApi, loading, error } = useApi()

  // Часто используемые данные с кэшированием
  const coursesCache = ref(null)
  const themesCache = ref(new Map())
  const lessonsCache = ref(new Map())

  async function getCachedCourses(forceRefresh = false) {
    if (!coursesCache.value || forceRefresh) {
      const response = await lmsApi.getCourses()
      coursesCache.value = response.data.results || response.data || []
    }
    return coursesCache.value
  }

  async function getCachedThemes(courseId, forceRefresh = false) {
    const cacheKey = courseId || 'all'
    if (!themesCache.value.has(cacheKey) || forceRefresh) {
      const response = await lmsApi.getThemes(courseId)
      themesCache.value.set(cacheKey, response.data.results || response.data || [])
    }
    return themesCache.value.get(cacheKey)
  }

  async function getCachedLessons(themeId, forceRefresh = false) {
    const cacheKey = themeId || 'all'
    if (!lessonsCache.value.has(cacheKey) || forceRefresh) {
      const response = await lmsApi.getLessons(themeId)
      lessonsCache.value.set(cacheKey, response.data.results || response.data || [])
    }
    return lessonsCache.value.get(cacheKey)
  }

  function invalidateCache() {
    coursesCache.value = null
    themesCache.value.clear()
    lessonsCache.value.clear()
  }

  return {
    lmsApi,
    loading,
    error,
    getCachedCourses,
    getCachedThemes,
    getCachedLessons,
    invalidateCache
  }
} 