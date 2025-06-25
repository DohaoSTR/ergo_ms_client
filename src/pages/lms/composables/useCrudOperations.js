import { apiClient } from '@/js/api/manager'
import { endpoints } from '@/js/api/endpoints'
import { showSuccess, showError } from '@/js/utils/notifications'

export function useCrudOperations() {
  
  async function createCourse(formData, validationErrors) {
    try {
      const response = await apiClient.post(endpoints.lms.subjects, formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      })
      showSuccess('Курс успешно создан')
      return response
    } catch (error) {
      handleApiError(error, validationErrors, 'курса')
      throw error
    }
  }

  async function updateCourse(courseId, formData, validationErrors) {
    try {
      const response = await apiClient.put(`${endpoints.lms.subjects}${courseId}/`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      })
      showSuccess('Курс успешно обновлен')
      return response
    } catch (error) {
      handleApiError(error, validationErrors, 'курса')
      throw error
    }
  }

  async function deleteCourse(courseId) {
    try {
      await apiClient.delete(`${endpoints.lms.subjects}${courseId}/`)
      showSuccess('Курс успешно удален')
    } catch (error) {
      console.error('Ошибка удаления курса:', error)
      showError('Ошибка при удалении курса')
      throw error
    }
  }

  async function createTheme(data, validationErrors) {
    try {
      const response = await apiClient.post(endpoints.lms.themes, data)
      showSuccess('Тема успешно создана')
      return response
    } catch (error) {
      handleApiError(error, validationErrors, 'темы')
      throw error
    }
  }

  async function updateTheme(themeId, data, validationErrors) {
    try {
      const response = await apiClient.put(`${endpoints.lms.themes}${themeId}/`, data)
      showSuccess('Тема успешно обновлена')
      return response
    } catch (error) {
      handleApiError(error, validationErrors, 'темы')
      throw error
    }
  }

  async function deleteTheme(themeId) {
    try {
      await apiClient.delete(`${endpoints.lms.themes}${themeId}/`)
      showSuccess('Тема успешно удалена')
    } catch (error) {
      console.error('Ошибка удаления темы:', error)
      showError('Ошибка при удалении темы')
      throw error
    }
  }

  async function createLesson(data, validationErrors) {
    try {
      const response = await apiClient.post(endpoints.lms.lessons, data)
      showSuccess('Урок успешно создан')
      return response
    } catch (error) {
      handleApiError(error, validationErrors, 'урока')
      throw error
    }
  }

  async function updateLesson(lessonId, data, validationErrors) {
    try {
      const response = await apiClient.put(`${endpoints.lms.lessons}${lessonId}/`, data)
      showSuccess('Урок успешно обновлен')
      return response
    } catch (error) {
      handleApiError(error, validationErrors, 'урока')
      throw error
    }
  }

  async function deleteLesson(lessonId) {
    try {
      await apiClient.delete(`${endpoints.lms.lessons}${lessonId}/`)
      showSuccess('Урок успешно удален')
    } catch (error) {
      console.error('Ошибка удаления урока:', error)
      showError('Ошибка при удалении урока')
      throw error
    }
  }

  async function duplicateLesson(lesson) {
    try {
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
      
      await apiClient.post(endpoints.lms.lessons, duplicateData)
      showSuccess(`Урок "${lesson.name}" успешно скопирован как "${copyName}"`)
    } catch (error) {
      console.error('Ошибка дублирования урока:', error)
      showError('Ошибка при копировании урока')
      throw error
    }
  }

  async function toggleLessonVisibility(lesson) {
    try {
      const updateData = {
        ...lesson,
        is_visible: !lesson.is_visible
      }
      
      await apiClient.put(`${endpoints.lms.lessons}${lesson.id}/`, updateData)
      showSuccess(`Урок "${lesson.name}" ${lesson.is_visible ? 'скрыт' : 'показан'}`)
    } catch (error) {
      console.error('Ошибка изменения видимости урока:', error)
      showError('Ошибка при изменении видимости урока')
      throw error
    }
  }

  // Операции с тестами
  async function createTest(data, validationErrors) {
    try {
      // Сначала создаем урок для теста, если указана тема
      let lessonId = null
      if (data.theme) {
        const lessonData = {
          name: `Урок для теста: ${data.name}`,
          description: `Автоматически созданный урок для теста "${data.name}"`,
          theme: parseInt(data.theme),
          lessontype: 'Q', // Тип урока - тест
          content: '',
          is_visible: true,
          completion_required: false,
          sort_order: 0
        }
        
        const lessonResponse = await apiClient.post(endpoints.lms.lessons, lessonData)
        lessonId = lessonResponse.data.id
      }
      
      // Подготавливаем данные теста
      const testData = {
        ...data,
        lesson: lessonId
      }
      
      // Убираем поля которые не нужны API
      delete testData.course
      delete testData.theme
      
      const response = await apiClient.post(endpoints.lms.tests, testData)
      showSuccess('Тест успешно создан')
      return response
    } catch (error) {
      handleApiError(error, validationErrors, 'теста')
      throw error
    }
  }

  async function updateTest(testId, data, validationErrors) {
    try {
      const response = await apiClient.put(`${endpoints.lms.tests}${testId}/`, data)
      showSuccess('Тест успешно обновлен')
      return response
    } catch (error) {
      handleApiError(error, validationErrors, 'теста')
      throw error
    }
  }

  async function deleteTest(testId) {
    try {
      await apiClient.delete(`${endpoints.lms.tests}${testId}/`)
      showSuccess('Тест успешно удален')
    } catch (error) {
      console.error('Ошибка удаления теста:', error)
      showError('Ошибка при удалении теста')
      throw error
    }
  }

  // Операции с заданиями
  async function createAssignment(data, validationErrors) {
    try {
      // Сначала создаем урок для задания, если указана тема
      let lessonId = null
      if (data.theme) {
        const lessonData = {
          name: `Урок для задания: ${data.title}`,
          description: `Автоматически созданный урок для задания "${data.title}"`,
          theme: parseInt(data.theme),
          lessontype: 'A', // Тип урока - задание
          content: '',
          is_visible: true,
          completion_required: false,
          sort_order: 0
        }
        
        const lessonResponse = await apiClient.post(endpoints.lms.lessons, lessonData)
        lessonId = lessonResponse.data.id
      }
      
      // Подготавливаем данные задания
      const assignmentData = {
        ...data,
        lesson: lessonId
      }
      
      // Убираем поля которые не нужны API
      delete assignmentData.course
      delete assignmentData.theme
      
      const response = await apiClient.post(endpoints.lms.assignments, assignmentData)
      showSuccess('Задание успешно создано')
      return response
    } catch (error) {
      handleApiError(error, validationErrors, 'задания')
      throw error
    }
  }

  async function updateAssignment(assignmentId, data, validationErrors) {
    try {
      const response = await apiClient.put(`${endpoints.lms.assignments}${assignmentId}/`, data)
      showSuccess('Задание успешно обновлено')
      return response
    } catch (error) {
      handleApiError(error, validationErrors, 'задания')
      throw error
    }
  }

  async function deleteAssignment(assignmentId) {
    try {
      await apiClient.delete(`${endpoints.lms.assignments}${assignmentId}/`)
      showSuccess('Задание успешно удалено')
    } catch (error) {
      console.error('Ошибка удаления задания:', error)
      showError('Ошибка при удалении задания')
      throw error
    }
  }

  // Операции с форумами
  async function createForum(data, validationErrors) {
    try {
      const response = await apiClient.post(endpoints.lms.forums, data)
      showSuccess('Форум успешно создан')
      return response
    } catch (error) {
      handleApiError(error, validationErrors, 'форума')
      throw error
    }
  }

  async function updateForum(forumId, data, validationErrors) {
    try {
      const response = await apiClient.put(`${endpoints.lms.forums}${forumId}/`, data)
      showSuccess('Форум успешно обновлен')
      return response
    } catch (error) {
      handleApiError(error, validationErrors, 'форума')
      throw error
    }
  }

  async function deleteForum(forumId) {
    try {
      await apiClient.delete(`${endpoints.lms.forums}${forumId}/`)
      showSuccess('Форум успешно удален')
    } catch (error) {
      console.error('Ошибка удаления форума:', error)
      showError('Ошибка при удалении форума')
      throw error
    }
  }

  function handleApiError(error, validationErrors, entityName) {
    console.error(`Ошибка сохранения ${entityName}:`, error)
    
    if (error.response?.data) {
      const errorData = error.response.data
      
      if (typeof errorData === 'object') {
        // Обрабатываем ошибки валидации
        Object.keys(errorData).forEach(field => {
          if (Array.isArray(errorData[field])) {
            validationErrors.value[field] = errorData[field].join(', ')
          } else {
            validationErrors.value[field] = errorData[field]
          }
        })
        
        // Показываем все ошибки пользователю
        const errorMessages = Object.entries(validationErrors.value).map(([field, message]) => `${field}: ${message}`)
        if (errorMessages.length > 0) {
          showError(`Ошибки валидации ${entityName}:\n${errorMessages.join('\n')}`)
        }
      } else {
        showError(`Ошибка API: ${errorData}`)
      }
    } else {
      showError('Ошибка соединения с сервером')
    }
  }

  return {
    // Курсы
    createCourse,
    updateCourse,
    deleteCourse,
    
    // Темы
    createTheme,
    updateTheme,
    deleteTheme,
    
    // Уроки
    createLesson,
    updateLesson,
    deleteLesson,
    duplicateLesson,
    toggleLessonVisibility,
    
    // Тесты
    createTest,
    updateTest,
    deleteTest,
    
    // Задания
    createAssignment,
    updateAssignment,
    deleteAssignment,
    
    // Форумы
    createForum,
    updateForum,
    deleteForum
  }
} 