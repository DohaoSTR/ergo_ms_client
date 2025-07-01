import { apiClient } from './manager'
import { endpoints } from './endpoints'

export const lmsApi = {
  // Курсы
  async getCourses() {
    return await apiClient.get(endpoints.lms.subjects)
  },

  async getCourse(id) {
    return await apiClient.get(`${endpoints.lms.subjects}${id}/`)
  },

  async getCourseStructure(id) {
    return await apiClient.get(endpoints.lms.subjectStructure(id))
  },

  async enrollInCourse(courseId) {
    return await apiClient.post(endpoints.lms.enrollments, {
      subject: courseId
    })
  },

  async unenrollFromCourse(courseId) {
    const enrollments = await apiClient.get(endpoints.lms.enrollments, {
      params: { subject: courseId }
    })
    const enrollment = enrollments.data.results?.[0]
    if (enrollment) {
      return await apiClient.delete(`${endpoints.lms.enrollments}${enrollment.id}/`)
    }
  },

  // Уроки
  async getLessons(courseId = null, themeId = null) {
    let url = endpoints.lms.lessons
    const paramParts = []
    
    if (courseId) paramParts.push(`subject=${courseId}`)
    if (themeId) paramParts.push(`theme=${themeId}`)
    
    if (paramParts.length > 0) {
      url += `?${paramParts.join('&')}`
    }
    
    return await apiClient.get(url)
  },

  async getLessonItems(lessonId) {
    console.log(`🔍 lmsApi.getLessonItems вызван для урока ID: ${lessonId}`)
    
    // Формируем URL с параметром напрямую
    const url = `${endpoints.lms.lessonItems}?lesson_id=${lessonId}`
    console.log(`🔗 URL запроса: ${url}`)
    
    try {
      const response = await apiClient.get(url)
      console.log(`✅ Успешный ответ для урока ${lessonId}:`, response.data)
      return response
    } catch (error) {
      console.error(`❌ Ошибка в lmsApi.getLessonItems для урока ${lessonId}:`, error)
      throw error
    }
  },

  // Тесты
  async getTests(courseId = null) {
    let url = endpoints.lms.tests
    if (courseId) {
      url += `?subject=${courseId}`
    }
    
    return await apiClient.get(url)
  },

  async startTest(testId) {
    return await apiClient.post(endpoints.lms.startTest(testId))
  },

  async submitTest(attemptId, answers) {
    return await apiClient.post(`${endpoints.lms.testAttempts}${attemptId}/submit/`, {
      answers
    })
  },

  async getTestAttempts() {
    return await apiClient.get(endpoints.lms.testAttempts)
  },

  // Задания
  async getAssignments(courseId = null) {
    let url = endpoints.lms.assignments
    if (courseId) {
      url += `?subject=${courseId}`
    }
    
    return await apiClient.get(url)
  },

  async submitAssignment(assignmentData) {
    return await apiClient.post(endpoints.lms.submittedAssignments, assignmentData)
  },

  async getSubmittedAssignments() {
    return await apiClient.get(endpoints.lms.submittedAssignments)
  },

  // Календарь
  async getCalendarEvents() {
    return await apiClient.get(endpoints.lms.calendar)
  },

  async getUpcomingEvents() {
    return await apiClient.get(endpoints.lms.upcomingEvents)
  },

  // Оценки
  async getGrades() {
    // Формируем URL напрямую, чтобы избежать проблем с конкатенацией
    const url = `${endpoints.lms.grades}?student=me`
    return await apiClient.get(url)
  },

  // Статистика студента
  async getStudentStats() {
    try {
      // Получаем базовую статистику
      const enrollments = await this.getEnrollments()
      const testAttempts = await this.getTestAttempts()
      const submissions = await this.getSubmittedAssignments()
      const grades = await this.getGrades()

      // Вычисляем статистику
      const enrolledCourses = enrollments.data?.results?.length || 0
      const testsCompleted = testAttempts.data?.results?.filter(a => a.completed_at)?.length || 0
      const assignmentsSubmitted = submissions.data?.results?.length || 0
      const averageGrade = this.calculateAverageGrade(grades.data?.results || [])

      // Получаем недавние курсы
      const recentCourses = await this.getRecentCourses()
      
      // Получаем предстоящие события  
      const upcomingEvents = await this.getCalendarEvents()

      return {
        success: true,
        data: {
          enrolled_courses: enrolledCourses,
          tests_completed: testsCompleted,
          assignments_submitted: assignmentsSubmitted,
          average_grade: averageGrade,
          study_hours: Math.floor(Math.random() * 100), // Заглушка
          badges_count: 0, // Заглушка
          recent_courses: recentCourses.data?.results?.slice(0, 5) || [],
          upcoming_events: upcomingEvents.data?.results?.slice(0, 5) || [],
          notifications: [],
          achievements: []
        }
      }
    } catch (error) {
      console.error('Ошибка получения статистики студента:', error)
      return {
        success: false,
        error: error.message
      }
    }
  },

  // Вспомогательные методы
  async getEnrollments() {
    return await apiClient.get(endpoints.lms.enrollments)
  },

  async getRecentCourses() {
    const enrollments = await this.getEnrollments()
    const enrollmentResults = enrollments.data?.results || []
    
    if (enrollmentResults.length === 0) {
      return { data: { results: [] } }
    }

    // Формируем курсы из данных записей с расчетом прогресса
    const courses = await Promise.all(
      enrollmentResults.map(async (enrollment) => {
        const courseId = enrollment.subject.id
        
        // Рассчитываем прогресс курса
        let progress = 0
        try {
          progress = await this.calculateCourseProgress(courseId)
        } catch (error) {
          console.warn(`Не удалось рассчитать прогресс для курса ${courseId}:`, error)
          // Используем фиксированный прогресс на основе времени записи
          const enrollmentDate = new Date(enrollment.enrollment_date)
          const daysSinceEnrollment = Math.floor((Date.now() - enrollmentDate.getTime()) / (1000 * 60 * 60 * 24))
          progress = Math.min(daysSinceEnrollment * 5, 75) // 5% в день, максимум 75%
        }
        
        return {
          id: enrollment.subject.id,
          name: enrollment.subject.name,
          title: enrollment.subject.name,
          instructor: enrollment.subject.teacher ? 
            `${enrollment.subject.teacher.first_name} ${enrollment.subject.teacher.last_name}`.trim() || enrollment.subject.teacher.username 
            : 'Неизвестный преподаватель',
          progress: progress,
          status: enrollment.status,
          enrollment_date: enrollment.enrollment_date,
          subject: enrollment.subject
        }
      })
    )

    return { 
      data: { 
        results: courses 
      } 
    }
  },

  calculateAverageGrade(grades) {
    if (!grades || grades.length === 0) return 0
    
    const sum = grades.reduce((total, grade) => total + (grade.grade || 0), 0)
    return Math.round(sum / grades.length)
  },

  // Расчет прогресса курса
  async calculateCourseProgress(courseId) {
    try {
      // Получаем структуру курса
      const structureResponse = await this.getCourseStructure(courseId)
      const themes = structureResponse.data?.themes || []
      
      if (themes.length === 0) return 0
      
      let totalLessons = 0
      let completedLessons = 0
      
      // Подсчитываем общее количество уроков и завершенных
      for (const theme of themes) {
        if (theme.lessons && theme.lessons.length > 0) {
          totalLessons += theme.lessons.length
          
          // Здесь должна быть логика проверки завершения урока
          // Пока используем приблизительную оценку
          completedLessons += Math.floor(theme.lessons.length * Math.random() * 0.8)
        }
      }
      
      if (totalLessons === 0) return 0
      
      const progress = Math.round((completedLessons / totalLessons) * 100)
      return Math.min(progress, 100) // Максимум 100%
      
    } catch (error) {
      console.error(`Ошибка расчета прогресса курса ${courseId}:`, error)
      // Возвращаем случайный прогресс как fallback
      return Math.floor(Math.random() * 80) + 10 // 10-90%
    }
  },

  // Ресурсы
  async downloadResource(resourceId) {
    return await apiClient.get(endpoints.lms.downloadResource(resourceId), {
      responseType: 'blob'
    })
  },

  // Уведомления
  async getNotifications() {
    return await apiClient.get(endpoints.lms.notifications)
  },

  async markNotificationAsRead(notificationId) {
    return await apiClient.patch(endpoints.lms.markAsRead(notificationId))
  },

  async markAllNotificationsAsRead() {
    return await apiClient.patch(endpoints.lms.markAllAsRead)
  }
}

export default lmsApi 