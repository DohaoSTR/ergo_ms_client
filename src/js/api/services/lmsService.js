import { apiClient } from '../manager'
import { endpoints } from '../endpoints'

/**
 * Сервис для работы с LMS API
 * Содержит все методы для управления курсами, темами, уроками, тестами, заданиями и ресурсами
 */
export class LmsService {
  
  // =============== МЕТОДЫ ДЛЯ ПОЛУЧЕНИЯ ДАННЫХ ===============
  
  /**
   * Получить все данные для управления уроками
   * @returns {Promise<Object>} Объект со всеми данными
   */
  async fetchAllLessonsData() {
    try {
      const [
        coursesResponse, 
        themesResponse, 
        lessonsResponse, 
        forumsResponse, 
        testsResponse,
        assignmentsResponse,
        resourcesResponse,
        categoriesResponse, 
        formatsResponse
      ] = await Promise.all([
        apiClient.get(endpoints.lms.subjects),
        apiClient.get(endpoints.lms.themes),
        apiClient.get(endpoints.lms.lessons),
        apiClient.get(endpoints.lms.forums).catch(() => ({ data: [] })),
        apiClient.get(endpoints.lms.tests).catch(() => ({ data: [] })),
        apiClient.get(endpoints.lms.assignments).catch(() => ({ data: [] })),
        apiClient.get(endpoints.lms.resources).catch(() => ({ data: [] })),
        apiClient.get(endpoints.lms.categories).catch(() => ({ data: [] })),
        apiClient.get(endpoints.lms.courseFormats).catch(() => ({ data: [] }))
      ])
      
      return {
        courses: coursesResponse.data?.results || coursesResponse.data || [],
        themes: themesResponse.data?.results || themesResponse.data || [],
        lessons: lessonsResponse.data?.results || lessonsResponse.data || [],
        forums: forumsResponse.data?.results || forumsResponse.data || [],
        tests: testsResponse.data?.results || testsResponse.data || [],
        assignments: assignmentsResponse.data?.results || assignmentsResponse.data || [],
        resources: resourcesResponse.data?.results || resourcesResponse.data || [],
        categories: categoriesResponse.data?.results || categoriesResponse.data || [],
        courseFormats: formatsResponse.data?.results || formatsResponse.data || []
      }
    } catch (error) {
      console.error('Ошибка загрузки данных LMS:', error)
      throw error
    }
  }

  // =============== ОПЕРАЦИИ С КУРСАМИ ===============
  
  /**
   * Создать новый курс
   * @param {FormData|Object} formData - данные курса
   * @returns {Promise<Object>} Ответ сервера
   */
  async createCourse(formData) {
    return await apiClient.post(endpoints.lms.subjects, formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    })
  }

  /**
   * Обновить курс
   * @param {number} courseId - ID курса
   * @param {FormData|Object} formData - данные курса
   * @returns {Promise<Object>} Ответ сервера
   */
  async updateCourse(courseId, formData) {
    return await apiClient.put(`${endpoints.lms.subjects}${courseId}/`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    })
  }

  /**
   * Удалить курс
   * @param {number} courseId - ID курса
   * @returns {Promise<Object>} Ответ сервера
   */
  async deleteCourse(courseId) {
    return await apiClient.delete(`${endpoints.lms.subjects}${courseId}/`)
  }

  /**
   * Дублировать курс
   * @param {number} courseId - ID курса
   * @returns {Promise<Object>} Ответ сервера
   */
  async duplicateCourse(courseId) {
    const response = await apiClient.post(endpoints.lms.duplicateSubject(courseId))
    return response
  }

  /**
   * Переключить публикацию курса
   * @param {number} courseId - ID курса
   * @returns {Promise<Object>} Ответ сервера
   */
  async toggleCoursePublished(courseId) {
    const response = await apiClient.patch(endpoints.lms.toggleSubjectPublished(courseId))
    return response
  }

  // =============== ОПЕРАЦИИ С ТЕМАМИ ===============
  
  /**
   * Создать новую тему
   * @param {Object} data - данные темы
   * @returns {Promise<Object>} Ответ сервера
   */
  async createTheme(data) {
    return await apiClient.post(endpoints.lms.themes, data)
  }

  /**
   * Обновить тему
   * @param {number} themeId - ID темы
   * @param {Object} data - данные темы
   * @returns {Promise<Object>} Ответ сервера
   */
  async updateTheme(themeId, data) {
    return await apiClient.put(`${endpoints.lms.themes}${themeId}/`, data)
  }

  /**
   * Удалить тему
   * @param {number} themeId - ID темы
   * @returns {Promise<Object>} Ответ сервера
   */
  async deleteTheme(themeId) {
    return await apiClient.delete(`${endpoints.lms.themes}${themeId}/`)
  }

  /**
   * Изменить порядок тем
   * @param {Array} themeIds - массив ID тем в новом порядке
   * @returns {Promise<Object>} Ответ сервера
   */
  async reorderThemes(themeIds) {
    return await apiClient.post(endpoints.lms.reorderThemes, { theme_ids: themeIds })
  }

  // =============== ОПЕРАЦИИ С УРОКАМИ ===============
  
  /**
   * Создать новый урок
   * @param {Object} data - данные урока
   * @returns {Promise<Object>} Ответ сервера
   */
  async createLesson(data) {
    return await apiClient.post(endpoints.lms.lessons, data)
  }

  /**
   * Обновить урок
   * @param {number} lessonId - ID урока
   * @param {Object} data - данные урока
   * @returns {Promise<Object>} Ответ сервера
   */
  async updateLesson(lessonId, data) {
    return await apiClient.put(`${endpoints.lms.lessons}${lessonId}/`, data)
  }

  /**
   * Удалить урок
   * @param {number} lessonId - ID урока
   * @returns {Promise<Object>} Ответ сервера
   */
  async deleteLesson(lessonId) {
    return await apiClient.delete(`${endpoints.lms.lessons}${lessonId}/`)
  }

  /**
   * Дублировать урок
   * @param {Object} lesson - объект урока
   * @returns {Promise<Object>} Ответ сервера
   */
  async duplicateLesson(lesson) {
    let themeId = lesson.theme
    if (typeof themeId === 'object' && themeId?.id) {
      themeId = themeId.id
    }
    
    let baseName = lesson.name
    const copyRegex = /\s*\(копия\s*\d*\)$/
    if (copyRegex.test(baseName)) {
      baseName = baseName.replace(copyRegex, '')
    }
    
    const copyName = `${baseName} (копия)`
    
    const duplicateData = {
      name: copyName,
      description: lesson.description || '',
      lessontype: lesson.lessontype,
      theme: parseInt(themeId),
      sort_order: (lesson.sort_order || 0) + 1,
      is_visible: lesson.is_visible !== undefined ? lesson.is_visible : true,
      completion_required: lesson.completion_required !== undefined ? lesson.completion_required : false,
      availability_start: lesson.availability_start || null,
      availability_end: lesson.availability_end || null,
      content: lesson.content || ''
    }
    
    return await apiClient.post(endpoints.lms.lessons, duplicateData)
  }

  /**
   * Переключить видимость урока
   * @param {Object} lesson - объект урока
   * @returns {Promise<Object>} Ответ сервера
   */
  async toggleLessonVisibility(lesson) {
    const updateData = {
      ...lesson,
      is_visible: !lesson.is_visible
    }
    
    return await apiClient.put(`${endpoints.lms.lessons}${lesson.id}/`, updateData)
  }

  /**
   * Изменить порядок уроков в теме
   * @param {number} themeId - ID темы
   * @param {Array} lessonIds - массив ID уроков в новом порядке
   * @returns {Promise<Object>} Ответ сервера
   */
  async reorderLessons(themeId, lessonIds) {
    return await apiClient.post(endpoints.lms.reorderLessons(themeId), { lesson_ids: lessonIds })
  }

  // =============== ОПЕРАЦИИ С ТЕСТАМИ ===============
  
  /**
   * Создать новый тест
   * @param {Object} data - данные теста
   * @returns {Promise<Object>} Ответ сервера
   */
  async createTest(data) {
    // Подготавливаем данные теста с правильными полями API
    const testData = { ...data }
    
    // Переименовываем поле course в subject для API
    if (testData.course) {
      testData.subject = testData.course
      delete testData.course
    }
    
    return await apiClient.post(endpoints.lms.tests, testData)
  }

  /**
   * Обновить тест
   * @param {number} testId - ID теста
   * @param {Object} data - данные теста
   * @returns {Promise<Object>} Ответ сервера
   */
  async updateTest(testId, data) {
    return await apiClient.put(`${endpoints.lms.tests}${testId}/`, data)
  }

  /**
   * Удалить тест
   * @param {number} testId - ID теста
   * @returns {Promise<Object>} Ответ сервера
   */
  async deleteTest(testId) {
    return await apiClient.delete(`${endpoints.lms.tests}${testId}/`)
  }

  /**
   * Дублировать тест
   * @param {Object} test - объект теста
   * @returns {Promise<Object>} Ответ сервера
   */
  async duplicateTest(test) {
    let baseName = test.name || test.title
    const copyRegex = /\s*\(копия\s*\d*\)$/
    if (copyRegex.test(baseName)) {
      baseName = baseName.replace(copyRegex, '')
    }
    
    const copyName = `${baseName} (копия)`
    
    const duplicateData = {
      name: copyName,
      title: test.title ? `${test.title} (копия)` : copyName,
      description: test.description || '',
      type: test.type || 'C',
      duration_minutes: test.duration_minutes || 60,
      passing_score: test.passing_score || 70,
      max_attempts: test.max_attempts || 1,
      show_correct_answers: test.show_correct_answers !== undefined ? test.show_correct_answers : false,
      randomize_questions: test.randomize_questions !== undefined ? test.randomize_questions : false,
      available_from: null, // Копия будет неактивна по умолчанию
      available_until: null,
      is_active: false, // Копия неактивна по умолчанию
      subject: test.subject?.id || test.subject,
      theme: test.theme?.id || test.theme,
      lesson: test.lesson?.id || test.lesson
    }

    // Убираем поля с null значениями
    Object.keys(duplicateData).forEach(key => {
      if (duplicateData[key] === null || duplicateData[key] === undefined) {
        delete duplicateData[key]
      }
    })
    
    return await apiClient.post(endpoints.lms.tests, duplicateData)
  }

  // =============== ОПЕРАЦИИ С ЗАДАНИЯМИ ===============
  
  /**
   * Создать новое задание
   * @param {Object} data - данные задания
   * @returns {Promise<Object>} Ответ сервера
   */
  async createAssignment(data) {
    // Подготавливаем данные задания с правильными полями API
    const assignmentData = { ...data }
    
    // Переименовываем поле course в subject для API
    if (assignmentData.course) {
      assignmentData.subject = assignmentData.course
      delete assignmentData.course
    }
    
    return await apiClient.post(endpoints.lms.assignments, assignmentData)
  }

  /**
   * Обновить задание
   * @param {number} assignmentId - ID задания
   * @param {Object} data - данные задания
   * @returns {Promise<Object>} Ответ сервера
   */
  async updateAssignment(assignmentId, data) {
    return await apiClient.put(`${endpoints.lms.assignments}${assignmentId}/`, data)
  }

  /**
   * Удалить задание
   * @param {number} assignmentId - ID задания
   * @returns {Promise<Object>} Ответ сервера
   */
  async deleteAssignment(assignmentId) {
    return await apiClient.delete(`${endpoints.lms.assignments}${assignmentId}/`)
  }

  // =============== ОПЕРАЦИИ С ФОРУМАМИ ===============
  
  /**
   * Создать новый форум
   * @param {Object} data - данные форума
   * @returns {Promise<Object>} Ответ сервера
   */
  async createForum(data) {
    return await apiClient.post(endpoints.lms.forums, data)
  }

  /**
   * Обновить форум
   * @param {number} forumId - ID форума
   * @param {Object} data - данные форума
   * @returns {Promise<Object>} Ответ сервера
   */
  async updateForum(forumId, data) {
    return await apiClient.put(`${endpoints.lms.forums}${forumId}/`, data)
  }

  /**
   * Удалить форум
   * @param {number} forumId - ID форума
   * @returns {Promise<Object>} Ответ сервера
   */
  async deleteForum(forumId) {
    return await apiClient.delete(`${endpoints.lms.forums}${forumId}/`)
  }

  // =============== ОПЕРАЦИИ С РЕСУРСАМИ ===============
  
  /**
   * Создать новый ресурс
   * @param {FormData} formData - данные ресурса
   * @returns {Promise<Object>} Ответ сервера
   */
  async createResource(formData) {
    return await apiClient.post(endpoints.lms.resources, formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    })
  }

  /**
   * Обновить ресурс
   * @param {number} resourceId - ID ресурса
   * @param {FormData} formData - данные ресурса
   * @returns {Promise<Object>} Ответ сервера
   */
  async updateResource(resourceId, formData) {
    return await apiClient.put(`${endpoints.lms.resources}${resourceId}/`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    })
  }

  /**
   * Удалить ресурс
   * @param {number} resourceId - ID ресурса
   * @returns {Promise<Object>} Ответ сервера
   */
  async deleteResource(resourceId) {
    return await apiClient.delete(`${endpoints.lms.resources}${resourceId}/`)
  }

  /**
   * Переключить видимость ресурса
   * @param {Object} resource - объект ресурса
   * @returns {Promise<Object>} Ответ сервера
   */
  async toggleResourceVisibility(resource) {
    return await apiClient.patch(endpoints.lms.toggleResourceVisibility(resource.id))
  }

  // =============== ОПЕРАЦИИ С ЭЛЕМЕНТАМИ УРОКА ===============
  
  /**
   * Получить элементы урока
   * @param {number} lessonId - ID урока
   * @returns {Promise<Array>} Массив элементов урока
   */
  async getLessonItems(lessonId) {
    const response = await apiClient.get(`${endpoints.lms.lessonItems}?lesson_id=${lessonId}`)
    return response.data || []
  }

  /**
   * Изменить порядок элементов урока
   * @param {Object} reorderData - Данные для изменения порядка
   * @returns {Promise<Object>} Ответ сервера
   */
  async reorderLessonItems(reorderData) {
    const response = await apiClient.post(endpoints.lms.reorderLessonItems, reorderData)
    return response.data
  }

  /**
   * Миграция существующих элементов урока
   * @returns {Promise<Object>} Ответ сервера
   */
  async migrateLessonItems() {
    const response = await apiClient.post(endpoints.lms.migrateLessonItems)
    return response.data
  }
}

// Создаем и экспортируем экземпляр сервиса
export const lmsService = new LmsService() 