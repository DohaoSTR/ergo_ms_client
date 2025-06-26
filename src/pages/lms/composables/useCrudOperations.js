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
      
      const courseName = formData.get ? formData.get('name') : formData.name || 'Новый курс'
      showSuccess(`Курс "${courseName}" успешно создан`)
      return response
    } catch (error) {
      // Специфичная обработка ошибок для курсов
      if (error.response?.status === 400) {
        const errorData = error.response.data
        
        if (errorData?.name && Array.isArray(errorData.name)) {
          if (errorData.name.some(err => err.includes('уже существует') || err.includes('already exists'))) {
            const courseName = formData.get ? formData.get('name') : formData.name || 'Неизвестный'
            showError(`Курс с названием "${courseName}" уже существует. Выберите другое название.`)
            if (validationErrors && validationErrors.value) {
              validationErrors.value.name = 'Курс с таким названием уже существует'
            }
            throw error
          }
        }
        
        if (errorData?.enrollment_key) {
          showError('Проверьте корректность ключа записи на курс.')
        }
        
        if (errorData?.start_date || errorData?.end_date) {
          showError('Проверьте правильность дат начала и окончания курса.')
        }
      }
      
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
      
      if (error.response?.status === 404) {
        showError('Курс не найден. Возможно, он уже был удален.')
      } else if (error.response?.status === 403) {
        showError('У вас нет прав для удаления этого курса.')
      } else if (error.response?.status === 409) {
        showError('Нельзя удалить курс, в котором есть записанные студенты или созданные материалы.')
      } else {
        showError('Ошибка при удалении курса. Попробуйте позже.')
      }
      throw error
    }
  }

  async function createTheme(data, validationErrors) {
    try {
      console.log('Создание темы с данными:', data)
      console.log('Endpoint для тем:', endpoints.lms.themes)
      
      const response = await apiClient.post(endpoints.lms.themes, data)
      console.log('Ответ сервера при создании темы:', response.data)
      
      showSuccess(`Тема "${data.name}" успешно создана`)
      return response
    } catch (error) {
      console.error('Ошибка создания темы - полная информация:', error)
      console.error('Данные запроса:', data)
      console.error('Ответ сервера:', error.response?.data)
      console.error('Статус ответа:', error.response?.status)
      
      // Специфичная обработка ошибок для тем
      if (error.response?.status === 400 && error.response?.data?.name) {
        const nameErrors = Array.isArray(error.response.data.name) 
          ? error.response.data.name 
          : [error.response.data.name]
        
        if (nameErrors.some(err => err.includes('уже существует'))) {
          showError(`Тема с названием "${data.name}" уже существует в выбранном курсе. Выберите другое название.`)
          if (validationErrors && validationErrors.value) {
            validationErrors.value.name = 'Тема с таким названием уже существует в этом курсе'
          }
          throw error
        }
      }
      
      handleApiError(error, validationErrors, 'темы')
      throw error
    }
  }

  async function updateTheme(themeId, data, validationErrors) {
    try {
      const response = await apiClient.put(`${endpoints.lms.themes}${themeId}/`, data)
      showSuccess(`Тема "${data.name}" успешно обновлена`)
      return response
    } catch (error) {
      // Специфичная обработка ошибок для обновления тем
      if (error.response?.status === 400 && error.response?.data?.name) {
        const nameErrors = Array.isArray(error.response.data.name) 
          ? error.response.data.name 
          : [error.response.data.name]
        
        if (nameErrors.some(err => err.includes('уже существует'))) {
          showError(`Тема с названием "${data.name}" уже существует в выбранном курсе. Выберите другое название.`)
          if (validationErrors && validationErrors.value) {
            validationErrors.value.name = 'Тема с таким названием уже существует в этом курсе'
          }
          throw error
        }
      }
      
      if (error.response?.status === 404) {
        showError('Тема не найдена. Возможно, она была удалена.')
        throw error
      }
      
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
      
      if (error.response?.status === 404) {
        showError('Тема не найдена. Возможно, она уже была удалена.')
      } else if (error.response?.status === 403) {
        showError('У вас нет прав для удаления этой темы.')
      } else if (error.response?.status === 409) {
        showError('Нельзя удалить тему, в которой есть уроки. Сначала удалите все уроки из темы.')
      } else {
        showError('Ошибка при удалении темы. Попробуйте позже.')
      }
      throw error
    }
  }

  async function createLesson(data, validationErrors) {
    try {
      const response = await apiClient.post(endpoints.lms.lessons, data)
      showSuccess(`Урок "${data.name}" успешно создан`)
      return response
    } catch (error) {
      // Специфичная обработка ошибок для уроков
      if (error.response?.status === 400) {
        const errorData = error.response.data
        
        if (errorData?.name && Array.isArray(errorData.name)) {
          if (errorData.name.some(err => err.includes('уже существует'))) {
            showError(`Урок с названием "${data.name}" уже существует в выбранной теме. Выберите другое название.`)
            if (validationErrors && validationErrors.value) {
              validationErrors.value.name = 'Урок с таким названием уже существует в этой теме'
            }
            throw error
          }
        }
        
        if (errorData?.theme) {
          showError('Выберите корректную тему для урока.')
          if (validationErrors && validationErrors.value) {
            validationErrors.value.theme = 'Выберите тему для урока'
          }
        }
        
        if (errorData?.availability_start || errorData?.availability_end) {
          showError('Проверьте правильность дат доступности урока.')
        }
        
        if (errorData?.lessontype) {
          showError('Выберите корректный тип урока.')
        }
      }
      
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
      
      if (error.response?.status === 404) {
        showError('Урок не найден. Возможно, он уже был удален.')
      } else if (error.response?.status === 403) {
        showError('У вас нет прав для удаления этого урока.')
      } else if (error.response?.status === 409) {
        showError('Нельзя удалить урок, к которому привязаны тесты или задания.')
      } else {
        showError('Ошибка при удалении урока. Попробуйте позже.')
      }
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
      showSuccess(`Тест "${data.name}" успешно создан`)
      return response
    } catch (error) {
      // Специфичная обработка ошибок для тестов
      if (error.response?.status === 400) {
        const errorData = error.response.data
        
        if (errorData?.name && Array.isArray(errorData.name)) {
          if (errorData.name.some(err => err.includes('уже существует'))) {
            showError(`Тест с названием "${data.name}" уже существует. Выберите другое название.`)
            if (validationErrors && validationErrors.value) {
              validationErrors.value.name = 'Тест с таким названием уже существует'
            }
            throw error
          }
        }
        
        if (errorData?.duration_minutes) {
          showError('Проверьте корректность длительности теста.')
        }
        
        if (errorData?.passing_score) {
          showError('Проходной балл должен быть от 0 до 100.')
        }
        
        if (errorData?.max_attempts) {
          showError('Максимальное количество попыток должно быть положительным числом.')
        }
        
        if (errorData?.available_from || errorData?.available_until) {
          showError('Проверьте правильность дат доступности теста.')
        }
      }
      
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
      showSuccess(`Задание "${data.title}" успешно создано`)
      return response
    } catch (error) {
      // Специфичная обработка ошибок для заданий
      if (error.response?.status === 400) {
        const errorData = error.response.data
        
        if (errorData?.title && Array.isArray(errorData.title)) {
          if (errorData.title.some(err => err.includes('уже существует'))) {
            showError(`Задание с названием "${data.title}" уже существует. Выберите другое название.`)
            if (validationErrors && validationErrors.value) {
              validationErrors.value.title = 'Задание с таким названием уже существует'
            }
            throw error
          }
        }
        
        if (errorData?.deadline) {
          showError('Проверьте корректность крайнего срока задания.')
        }
        
        if (errorData?.max_grade) {
          showError('Максимальная оценка должна быть положительным числом.')
        }
        
        if (errorData?.max_file_size) {
          showError('Проверьте корректность максимального размера файла.')
        }
        
        if (errorData?.lesson) {
          showError('Выберите корректный урок для задания.')
        }
      }
      
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
      showSuccess(`Форум "${data.name}" успешно создан`)
      return response
    } catch (error) {
      // Специфичная обработка ошибок для форумов
      if (error.response?.status === 400) {
        const errorData = error.response.data
        
        if (errorData?.name && Array.isArray(errorData.name)) {
          if (errorData.name.some(err => err.includes('уже существует'))) {
            showError(`Форум с названием "${data.name}" уже существует в этом курсе. Выберите другое название.`)
            if (validationErrors && validationErrors.value) {
              validationErrors.value.name = 'Форум с таким названием уже существует в этом курсе'
            }
            throw error
          }
        }
        
        if (errorData?.subject) {
          showError('Выберите корректный курс для форума.')
          if (validationErrors && validationErrors.value) {
            validationErrors.value.subject = 'Выберите курс для форума'
          }
        }
        
        if (errorData?.forum_type) {
          showError('Выберите корректный тип форума.')
        }
      }
      
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
    console.error(`Статус ошибки:`, error.response?.status)
    console.error(`Данные ошибки:`, error.response?.data)
    
    // Очищаем предыдущие ошибки
    if (validationErrors && validationErrors.value) {
      validationErrors.value = {}
    }
    
    if (error.response?.data) {
      const errorData = error.response.data
      
      if (typeof errorData === 'object' && errorData !== null) {
        let hasValidationErrors = false
        
        // Обрабатываем ошибки валидации
        Object.keys(errorData).forEach(field => {
          if (validationErrors && validationErrors.value) {
            if (Array.isArray(errorData[field])) {
              validationErrors.value[field] = errorData[field].join(', ')
            } else {
              validationErrors.value[field] = String(errorData[field])
            }
            hasValidationErrors = true
          }
        })
        
        console.log('Установлены ошибки валидации:', validationErrors?.value)
        
        // Показываем ошибки пользователю
        if (hasValidationErrors) {
          // Формируем читаемые сообщения об ошибках
          const errorMessages = Object.entries(validationErrors.value).map(([field, message]) => {
            const fieldNames = {
              'name': 'Название',
              'title': 'Заголовок', 
              'description': 'Описание',
              'subject': 'Курс',
              'theme': 'Тема',
              'lesson': 'Урок',
              'sort_order': 'Порядок сортировки',
              'start_date': 'Дата начала',
              'end_date': 'Дата окончания',
              'deadline': 'Крайний срок',
              'max_grade': 'Максимальная оценка',
              'duration_minutes': 'Длительность (мин)',
              'passing_score': 'Проходной балл',
              'max_attempts': 'Максимум попыток',
              'lessontype': 'Тип урока',
              'forum_type': 'Тип форума',
              'email': 'Email',
              'password': 'Пароль'
            }
            
            const fieldName = fieldNames[field] || field
            return `${fieldName}: ${message}`
          })
          
          const errorMessage = errorMessages.length === 1 
            ? errorMessages[0]
            : `Ошибки при сохранении ${entityName}:\n• ${errorMessages.join('\n• ')}`
            
          showError(errorMessage)
        } else {
          // Если нет конкретных полей, показываем общую ошибку
          const errorMessage = errorData.detail || errorData.message || 'Неизвестная ошибка'
          showError(`Ошибка при сохранении ${entityName}: ${errorMessage}`)
        }
      } else {
        showError(`Ошибка API: ${String(errorData)}`)
      }
    } else if (error.response?.status === 400) {
      showError(`Некорректные данные для ${entityName}. Проверьте введенную информацию.`)
    } else if (error.response?.status === 403) {
      showError(`У вас нет прав для выполнения этого действия с ${entityName}.`)
    } else if (error.response?.status === 404) {
      showError(`${entityName.charAt(0).toUpperCase() + entityName.slice(1)} не найден(а).`)
    } else if (error.response?.status === 409) {
      showError(`Конфликт данных. ${entityName.charAt(0).toUpperCase() + entityName.slice(1)} уже существует.`)
    } else if (error.response?.status === 500) {
      showError('Внутренняя ошибка сервера. Попробуйте позже.')
    } else if (error.code === 'NETWORK_ERROR' || !error.response) {
      showError('Ошибка соединения с сервером. Проверьте подключение к интернету.')
    } else {
      showError(`Неожиданная ошибка при работе с ${entityName}. Попробуйте позже.`)
    }
  }

  // Операции с ресурсами
  async function createResource(formData, validationErrors) {
    try {
      const response = await apiClient.post(endpoints.lms.resources, formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      })
      
      const resourceName = formData.get ? formData.get('name') : formData.name || 'Новый ресурс'
      showSuccess(`Ресурс "${resourceName}" успешно создан`)
      return response
    } catch (error) {
      // Специфичная обработка ошибок для ресурсов
      if (error.response?.status === 400) {
        const errorData = error.response.data
        
        if (errorData?.name && Array.isArray(errorData.name)) {
          if (errorData.name.some(err => err.includes('уже существует'))) {
            const resourceName = formData.get ? formData.get('name') : formData.name || 'Неизвестный'
            showError(`Ресурс с названием "${resourceName}" уже существует. Выберите другое название.`)
            if (validationErrors && validationErrors.value) {
              validationErrors.value.name = 'Ресурс с таким названием уже существует'
            }
            throw error
          }
        }
        
        if (errorData?.file) {
          if (Array.isArray(errorData.file)) {
            const fileErrors = errorData.file
            if (fileErrors.some(err => err.includes('размер') || err.includes('size'))) {
              showError('Размер файла превышает допустимый лимит (50 МБ).')
            } else if (fileErrors.some(err => err.includes('формат') || err.includes('format') || err.includes('type'))) {
              showError('Неподдерживаемый формат файла.')
            } else {
              showError('Ошибка при загрузке файла.')
            }
          }
          if (validationErrors && validationErrors.value) {
            validationErrors.value.file = Array.isArray(errorData.file) ? errorData.file.join(', ') : errorData.file
          }
        }
        
        if (errorData?.subject) {
          showError('Выберите корректный курс для ресурса.')
        }
        
        if (errorData?.theme) {
          showError('Выберите корректную тему для ресурса.')
        }
        
        if (errorData?.lesson) {
          showError('Выберите корректный урок для ресурса.')
        }
      }
      
      handleApiError(error, validationErrors, 'ресурса')
      throw error
    }
  }

  async function updateResource(resourceId, formData, validationErrors) {
    try {
      const response = await apiClient.put(`${endpoints.lms.resources}${resourceId}/`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      })
      showSuccess('Ресурс успешно обновлен')
      return response
    } catch (error) {
      handleApiError(error, validationErrors, 'ресурса')
      throw error
    }
  }

  async function deleteResource(resourceId) {
    try {
      await apiClient.delete(`${endpoints.lms.resources}${resourceId}/`)
      showSuccess('Ресурс успешно удален')
    } catch (error) {
      console.error('Ошибка удаления ресурса:', error)
      
      if (error.response?.status === 404) {
        showError('Ресурс не найден. Возможно, он уже был удален.')
      } else if (error.response?.status === 403) {
        showError('У вас нет прав для удаления этого ресурса.')
      } else {
        showError('Ошибка при удалении ресурса. Попробуйте позже.')
      }
      throw error
    }
  }

  async function toggleResourceVisibility(resource) {
    try {
      const updateData = new FormData()
      updateData.append('name', resource.name)
      updateData.append('description', resource.description || '')
      updateData.append('is_visible', !resource.is_visible)
      updateData.append('sort_order', resource.sort_order || 0)
      
      if (resource.subject) {
        updateData.append('subject', resource.subject)
      }
      if (resource.theme) {
        updateData.append('theme', resource.theme)
      }
      if (resource.lesson) {
        updateData.append('lesson', resource.lesson)
      }
      
      await apiClient.put(`${endpoints.lms.resources}${resource.id}/`, updateData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      })
      showSuccess(`Ресурс "${resource.name}" ${resource.is_visible ? 'скрыт' : 'показан'}`)
    } catch (error) {
      console.error('Ошибка изменения видимости ресурса:', error)
      showError('Ошибка при изменении видимости ресурса')
      throw error
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
    
    // Ресурсы
    createResource,
    updateResource,
    deleteResource,
    toggleResourceVisibility,
    
    // Форумы
    createForum,
    updateForum,
    deleteForum
  }
} 