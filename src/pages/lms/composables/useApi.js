import { ref, computed } from 'vue'
import { lmsService } from '@/js/api/services/lmsService'
import { useNotifications } from './useNotifications'

const { showError, showSuccess } = useNotifications()

export function useApi() {
  const loading = ref(false)
  const error = ref(null)
  const data = ref(null)



  // Обертка для LMS сервиса с обработкой состояния загрузки
  const lmsApi = {
    // Получение всех данных
    async fetchAllLessonsData() {
      loading.value = true
      try {
        const result = await lmsService.fetchAllLessonsData()
        data.value = result
        return { data: result }
      } catch (err) {
        error.value = err.message || 'Произошла ошибка'
        throw err
      } finally {
        loading.value = false
      }
    },

    // Курсы
    async createCourse(courseData) {
      loading.value = true
      try {
        const response = await lmsService.createCourse(courseData)
        return response
      } catch (err) {
        error.value = err.message || 'Произошла ошибка'
        throw err
      } finally {
        loading.value = false
      }
    },

    async updateCourse(id, courseData) {
      loading.value = true
      try {
        const response = await lmsService.updateCourse(id, courseData)
        return response
      } catch (err) {
        error.value = err.message || 'Произошла ошибка'
        throw err
      } finally {
        loading.value = false
      }
    },

    async deleteCourse(id) {
      loading.value = true
      try {
        const response = await lmsService.deleteCourse(id)
        return response
      } catch (err) {
        error.value = err.message || 'Произошла ошибка'
        throw err
      } finally {
        loading.value = false
      }
    },

    // Темы
    async createTheme(themeData) {
      loading.value = true
      try {
        const response = await lmsService.createTheme(themeData)
        return response
      } catch (err) {
        error.value = err.message || 'Произошла ошибка'
        throw err
      } finally {
        loading.value = false
      }
    },

    async updateTheme(id, themeData) {
      loading.value = true
      try {
        const response = await lmsService.updateTheme(id, themeData)
        return response
      } catch (err) {
        error.value = err.message || 'Произошла ошибка'
        throw err
      } finally {
        loading.value = false
      }
    },

    async deleteTheme(id) {
      loading.value = true
      try {
        const response = await lmsService.deleteTheme(id)
        return response
      } catch (err) {
        error.value = err.message || 'Произошла ошибка'
        throw err
      } finally {
        loading.value = false
      }
    },

    // Уроки
    async createLesson(lessonData) {
      loading.value = true
      try {
        const response = await lmsService.createLesson(lessonData)
        return response
      } catch (err) {
        error.value = err.message || 'Произошла ошибка'
        throw err
      } finally {
        loading.value = false
      }
    },

    async updateLesson(id, lessonData) {
      loading.value = true
      try {
        const response = await lmsService.updateLesson(id, lessonData)
        return response
      } catch (err) {
        error.value = err.message || 'Произошла ошибка'
        throw err
      } finally {
        loading.value = false
      }
    },

    async deleteLesson(id) {
      loading.value = true
      try {
        const response = await lmsService.deleteLesson(id)
        return response
      } catch (err) {
        error.value = err.message || 'Произошла ошибка'
        throw err
      } finally {
        loading.value = false
      }
    },

    async duplicateLesson(lesson) {
      loading.value = true
      try {
        const response = await lmsService.duplicateLesson(lesson)
        return response
      } catch (err) {
        error.value = err.message || 'Произошла ошибка'
        throw err
      } finally {
        loading.value = false
      }
    },

    async toggleLessonVisibility(lesson) {
      loading.value = true
      try {
        const response = await lmsService.toggleLessonVisibility(lesson)
        return response
      } catch (err) {
        error.value = err.message || 'Произошла ошибка'
        throw err
      } finally {
        loading.value = false
      }
    },

    // Тесты
    async createTest(testData) {
      loading.value = true
      try {
        const response = await lmsService.createTest(testData)
        return response
      } catch (err) {
        error.value = err.message || 'Произошла ошибка'
        throw err
      } finally {
        loading.value = false
      }
    },

    async updateTest(id, testData) {
      loading.value = true
      try {
        const response = await lmsService.updateTest(id, testData)
        return response
      } catch (err) {
        error.value = err.message || 'Произошла ошибка'
        throw err
      } finally {
        loading.value = false
      }
    },

    async deleteTest(id) {
      loading.value = true
      try {
        const response = await lmsService.deleteTest(id)
        return response
      } catch (err) {
        error.value = err.message || 'Произошла ошибка'
        throw err
      } finally {
        loading.value = false
      }
    },

    async duplicateTest(test) {
      loading.value = true
      try {
        const response = await lmsService.duplicateTest(test)
        return response
      } catch (err) {
        error.value = err.message || 'Произошла ошибка'
        throw err
      } finally {
        loading.value = false
      }
    },

    // Задания
    async createAssignment(assignmentData) {
      loading.value = true
      try {
        const response = await lmsService.createAssignment(assignmentData)
        return response
      } catch (err) {
        error.value = err.message || 'Произошла ошибка'
        throw err
      } finally {
        loading.value = false
      }
    },

    async updateAssignment(id, assignmentData) {
      loading.value = true
      try {
        const response = await lmsService.updateAssignment(id, assignmentData)
        return response
      } catch (err) {
        error.value = err.message || 'Произошла ошибка'
        throw err
      } finally {
        loading.value = false
      }
    },

    async deleteAssignment(id) {
      loading.value = true
      try {
        const response = await lmsService.deleteAssignment(id)
        return response
      } catch (err) {
        error.value = err.message || 'Произошла ошибка'
        throw err
      } finally {
        loading.value = false
      }
    },

    // Форумы
    async createForum(forumData) {
      loading.value = true
      try {
        const response = await lmsService.createForum(forumData)
        return response
      } catch (err) {
        error.value = err.message || 'Произошла ошибка'
        throw err
      } finally {
        loading.value = false
      }
    },

    async updateForum(id, forumData) {
      loading.value = true
      try {
        const response = await lmsService.updateForum(id, forumData)
        return response
      } catch (err) {
        error.value = err.message || 'Произошла ошибка'
        throw err
      } finally {
        loading.value = false
      }
    },

    async deleteForum(id) {
      loading.value = true
      try {
        const response = await lmsService.deleteForum(id)
        return response
      } catch (err) {
        error.value = err.message || 'Произошла ошибка'
        throw err
      } finally {
        loading.value = false
      }
    },

    // Ресурсы
    async createResource(resourceData) {
      loading.value = true
      try {
        const response = await lmsService.createResource(resourceData)
        return response
      } catch (err) {
        error.value = err.message || 'Произошла ошибка'
        throw err
      } finally {
        loading.value = false
      }
    },

    async updateResource(id, resourceData) {
      loading.value = true
      try {
        const response = await lmsService.updateResource(id, resourceData)
        return response
      } catch (err) {
        error.value = err.message || 'Произошла ошибка'
        throw err
      } finally {
        loading.value = false
      }
    },

    async deleteResource(id) {
      loading.value = true
      try {
        const response = await lmsService.deleteResource(id)
        return response
      } catch (err) {
        error.value = err.message || 'Произошла ошибка'
        throw err
      } finally {
        loading.value = false
      }
    },

    async toggleResourceVisibility(resource) {
      loading.value = true
      try {
        const response = await lmsService.toggleResourceVisibility(resource)
        return response
      } catch (err) {
        error.value = err.message || 'Произошла ошибка'
        throw err
      } finally {
        loading.value = false
      }
    },

    // Элементы урока
    async getLessonItems(lessonId) {
      loading.value = true
      try {
        const response = await lmsService.getLessonItems(lessonId)
        return response
      } catch (err) {
        error.value = err.message || 'Произошла ошибка'
        throw err
      } finally {
        loading.value = false
      }
    },

    async reorderLessonItems(reorderData) {
      loading.value = true
      try {
        const response = await lmsService.reorderLessonItems(reorderData)
        return response
      } catch (err) {
        error.value = err.message || 'Произошла ошибка'
        throw err
      } finally {
        loading.value = false
      }
    },

    async migrateLessonItems() {
      loading.value = true
      try {
        const response = await lmsService.migrateLessonItems()
        return response
      } catch (err) {
        error.value = err.message || 'Произошла ошибка'
        throw err
      } finally {
        loading.value = false
      }
    }
  }

  return {
    // Состояние
    loading: computed(() => loading.value),
    error: computed(() => error.value),
    data: computed(() => data.value),

    // Методы
    lmsApi,

    // Утилиты
    clearError: () => { error.value = null },
    clearData: () => { data.value = null }
  }
}

// Упрощенная функция для быстрого доступа к LMS API
export function useLmsData() {
  const { lmsApi, loading, error } = useApi()

  // Кэш для данных (можно расширить при необходимости)
  const dataCache = ref(null)

  async function getCachedAllData(forceRefresh = false) {
    if (!dataCache.value || forceRefresh) {
      const response = await lmsApi.fetchAllLessonsData()
      dataCache.value = response.data
    }
    return dataCache.value
  }

  function invalidateCache() {
    dataCache.value = null
  }

  return {
    lmsApi,
    loading,
    error,
    getCachedAllData,
    invalidateCache
  }
} 