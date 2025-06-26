import { lmsService } from '@/js/api/services/lmsService'
import { showSuccess, showError } from '@/js/utils/notifications'

export function useCrudOperations() {
  
  async function createCourse(formData, validationErrors) {
    try {
      const response = await lmsService.createCourse(formData)
      
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
      const response = await lmsService.updateCourse(courseId, formData)
      showSuccess('Курс успешно обновлен')
      return response
    } catch (error) {
      handleApiError(error, validationErrors, 'курса')
      throw error
    }
  }

  async function deleteCourse(courseId) {
    try {
      await lmsService.deleteCourse(courseId)
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
      
      const response = await lmsService.createTheme(data)
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
      const response = await lmsService.updateTheme(themeId, data)
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
      await lmsService.deleteTheme(themeId)
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
      const response = await lmsService.createLesson(data)
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
      const response = await lmsService.updateLesson(lessonId, data)
      showSuccess('Урок успешно обновлен')
      return response
    } catch (error) {
      handleApiError(error, validationErrors, 'урока')
      throw error
    }
  }

  async function deleteLesson(lessonId) {
    try {
      await lmsService.deleteLesson(lessonId)
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
      await lmsService.duplicateLesson(lesson)
      
      let baseName = lesson.name
      const copyRegex = /\s*\(копия\s*\d*\)$/
      if (copyRegex.test(baseName)) {
        baseName = baseName.replace(copyRegex, '')
      }
      const copyName = `${baseName} (копия)`
      
      showSuccess(`Урок "${lesson.name}" успешно скопирован как "${copyName}"`)
    } catch (error) {
      console.error('Ошибка дублирования урока:', error)
      showError('Ошибка при копировании урока')
      throw error
    }
  }

  async function toggleLessonVisibility(lesson) {
    try {
      await lmsService.toggleLessonVisibility(lesson)
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
      console.log('🔍 Создание теста с данными:', data)
      
      const response = await lmsService.createTest(data)
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
      const response = await lmsService.updateTest(testId, data)
      showSuccess('Тест успешно обновлен')
      return response
    } catch (error) {
      handleApiError(error, validationErrors, 'теста')
      throw error
    }
  }

  async function deleteTest(testId) {
    try {
      await lmsService.deleteTest(testId)
      showSuccess('Тест успешно удален')
    } catch (error) {
      console.error('Ошибка удаления теста:', error)
      showError('Ошибка при удалении теста')
      throw error
    }
  }

  async function duplicateTest(test) {
    try {
      await lmsService.duplicateTest(test)
      
      let baseName = test.name || test.title
      const copyRegex = /\s*\(копия\s*\d*\)$/
      if (copyRegex.test(baseName)) {
        baseName = baseName.replace(copyRegex, '')
      }
      const copyName = `${baseName} (копия)`
      
      showSuccess(`Тест "${baseName}" успешно скопирован как "${copyName}"`)
    } catch (error) {
      console.error('Ошибка дублирования теста:', error)
      showError('Ошибка при копировании теста')
      throw error
    }
  }

  // Операции с заданиями
  async function createAssignment(data, validationErrors) {
    try {
      console.log('🔍 Создание задания с данными:', data)
      
      const response = await lmsService.createAssignment(data)
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
      const response = await lmsService.updateAssignment(assignmentId, data)
      showSuccess('Задание успешно обновлено')
      return response
    } catch (error) {
      handleApiError(error, validationErrors, 'задания')
      throw error
    }
  }

  async function deleteAssignment(assignmentId) {
    try {
      await lmsService.deleteAssignment(assignmentId)
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
      const response = await lmsService.createForum(data)
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
      const response = await lmsService.updateForum(forumId, data)
      showSuccess('Форум успешно обновлен')
      return response
    } catch (error) {
      handleApiError(error, validationErrors, 'форума')
      throw error
    }
  }

  async function deleteForum(forumId) {
    try {
      await lmsService.deleteForum(forumId)
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
      const response = await lmsService.createResource(formData)
      
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
      const response = await lmsService.updateResource(resourceId, formData)
      showSuccess('Ресурс успешно обновлен')
      return response
    } catch (error) {
      handleApiError(error, validationErrors, 'ресурса')
      throw error
    }
  }

  async function deleteResource(resourceId) {
    try {
      await lmsService.deleteResource(resourceId)
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
      await lmsService.toggleResourceVisibility(resource)
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
    duplicateTest,
    
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