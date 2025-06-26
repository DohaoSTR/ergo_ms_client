import { ref, computed } from 'vue'
import { apiClient } from '@/js/api/manager'
import { endpoints } from '@/js/api/endpoints'
import { showError } from '@/js/utils/notifications'

export function useLessonsData() {
  const courses = ref([])
  const themes = ref([])
  const lessons = ref([])
  const forums = ref([])
  const tests = ref([])
  const assignments = ref([])
  const resources = ref([])
  const categories = ref([])
  const courseFormats = ref([])
  const loading = ref(true)
  
  // Фильтры
  const selectedCourseId = ref('')
  const searchQuery = ref('')
  const selectedCategory = ref('')
  const selectedFormat = ref('')
  const selectedStatus = ref('')
  const sortBy = ref('name')
  const sortOrder = ref('asc')
  
  const stats = computed(() => ({
    totalCourses: courses.value.length,
    totalThemes: themes.value.length,
    totalLessons: lessons.value.length,
    visibleLessons: lessons.value.filter(l => l.is_visible).length,
    totalTests: tests.value.length,
    totalAssignments: assignments.value.length,
    totalResources: resources.value.length
  }))
  
  const filteredLessons = computed(() => {
    let filtered = lessons.value

    if (searchQuery.value) {
      const query = searchQuery.value.toLowerCase()
      filtered = filtered.filter(lesson =>
        lesson.name.toLowerCase().includes(query) ||
        lesson.description.toLowerCase().includes(query)
      )
    }

    if (selectedStatus.value) {
      if (selectedStatus.value === 'visible') {
        filtered = filtered.filter(lesson => lesson.is_visible)
      } else if (selectedStatus.value === 'hidden') {
        filtered = filtered.filter(lesson => !lesson.is_visible)
      } else if (selectedStatus.value === 'required') {
        filtered = filtered.filter(lesson => lesson.completion_required)
      }
    }

    return filtered
  })
  
  const groupedData = computed(() => {
    const courseGroups = {}
    
    // Фильтруем курсы
    let filteredCourses = courses.value.filter(course => {
      if (searchQuery.value && !course.name.toLowerCase().includes(searchQuery.value.toLowerCase())) {
        return false
      }
      
      if (selectedCategory.value && course.category?.id !== parseInt(selectedCategory.value)) {
        return false
      }
      
      if (selectedFormat.value && course.course_format?.id !== parseInt(selectedFormat.value)) {
        return false
      }
      
      return true
    })

    // Сортируем курсы
    filteredCourses.sort((a, b) => {
      let aValue, bValue
      
      switch (sortBy.value) {
        case 'name':
          aValue = a.name.toLowerCase()
          bValue = b.name.toLowerCase()
          break
        case 'category':
          aValue = a.category?.name?.toLowerCase() || ''
          bValue = b.category?.name?.toLowerCase() || ''
          break
        case 'format':
          aValue = a.course_format?.name?.toLowerCase() || ''
          bValue = b.course_format?.name?.toLowerCase() || ''
          break
        default:
          aValue = a.name.toLowerCase()
          bValue = b.name.toLowerCase()
      }
      
      if (sortOrder.value === 'asc') {
        return aValue.localeCompare(bValue)
      } else {
        return bValue.localeCompare(aValue)
      }
    })

    // Создаем группы для отфильтрованных курсов
    filteredCourses.forEach(course => {
      if (!selectedCourseId.value || parseInt(course.id) === parseInt(selectedCourseId.value)) {
        courseGroups[course.id] = {
          course,
          themes: [],
          totalLessons: 0
        }
      }
    })

    // Добавляем темы в соответствующие курсы
    themes.value.forEach(theme => {
      let courseId = theme.subject
      if (typeof courseId === 'object' && courseId?.id) {
        courseId = courseId.id
      }
      courseId = parseInt(courseId)
      
      if (courseGroups[courseId]) {
        courseGroups[courseId].themes.push({
          ...theme,
          lessons: []
        })
      }
    })

    // Добавляем уроки в темы
    filteredLessons.value.forEach(lesson => {
      let themeId = lesson.theme
      if (typeof themeId === 'object' && themeId?.id) {
        themeId = themeId.id
      }
      themeId = parseInt(themeId)
      
      const theme = themes.value.find(t => parseInt(t.id) === themeId)
      if (theme) {
        let courseId = theme.subject
        if (typeof courseId === 'object' && courseId?.id) {
          courseId = courseId.id
        }
        courseId = parseInt(courseId)
        
        const courseGroup = courseGroups[courseId]
        if (courseGroup) {
          const themeInGroup = courseGroup.themes.find(t => parseInt(t.id) === themeId)
          if (themeInGroup) {
            themeInGroup.lessons.push(lesson)
            courseGroup.totalLessons++
          }
        }
      }
    })

    // Сортируем темы и уроки
    Object.values(courseGroups).forEach(group => {
      group.themes.sort((a, b) => (a.sort_order || 0) - (b.sort_order || 0))
      group.themes.forEach(theme => {
        theme.lessons.sort((a, b) => (a.sort_order || 0) - (b.sort_order || 0))
      })
    })

    return Object.values(courseGroups)
  })
  
  async function fetchData() {
    try {
      loading.value = true
      
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
      
      courses.value = coursesResponse.data?.results || coursesResponse.data || []
      themes.value = themesResponse.data?.results || themesResponse.data || []
      lessons.value = lessonsResponse.data?.results || lessonsResponse.data || []
      forums.value = forumsResponse.data?.results || forumsResponse.data || []
      tests.value = testsResponse.data?.results || testsResponse.data || []
      assignments.value = assignmentsResponse.data?.results || assignmentsResponse.data || []
      resources.value = resourcesResponse.data?.results || resourcesResponse.data || []
      categories.value = categoriesResponse.data?.results || categoriesResponse.data || []
      courseFormats.value = formatsResponse.data?.results || formatsResponse.data || []
      
    } catch (error) {
      console.error('Ошибка загрузки данных:', error)
      courses.value = []
      themes.value = []
      lessons.value = []
      forums.value = []
      tests.value = []
      assignments.value = []
      resources.value = []
      categories.value = []
      courseFormats.value = []
    } finally {
      loading.value = false
    }
  }
  
  function getThemesByCourse(courseId) {
    if (!courseId) return []
    return themes.value.filter(theme => {
      let themeCourseId = theme.subject
      if (typeof themeCourseId === 'object' && themeCourseId?.id) {
        themeCourseId = themeCourseId.id
      }
      return parseInt(themeCourseId) === parseInt(courseId)
    })
  }
  
  function getForumsByCourse(courseId) {
    return forums.value.filter(forum => {
      let forumCourseId = forum.subject
      if (typeof forumCourseId === 'object' && forumCourseId?.id) {
        forumCourseId = forumCourseId.id
      }
      return parseInt(forumCourseId) === parseInt(courseId)
    })
  }
  
  function getLessonsForCourse(courseId, themeId = null) {
    return lessons.value.filter(lesson => {
      let lessonThemeId = lesson.theme
      if (typeof lessonThemeId === 'object' && lessonThemeId?.id) {
        lessonThemeId = lessonThemeId.id
      }
      
      if (themeId) {
        return parseInt(lessonThemeId) === parseInt(themeId)
      }
      
      const theme = themes.value.find(t => t.id === lessonThemeId)
      if (theme) {
        let courseIdFromTheme = theme.subject
        if (typeof courseIdFromTheme === 'object' && courseIdFromTheme?.id) {
          courseIdFromTheme = courseIdFromTheme.id
        }
        return parseInt(courseIdFromTheme) === parseInt(courseId)
      }
      return false
    })
  }
  
  function getThemeNameForLesson(lesson) {
    let themeId = lesson.theme
    if (typeof themeId === 'object' && themeId?.id) {
      themeId = themeId.id
    }
    
    const theme = themes.value.find(t => t.id === themeId)
    return theme ? theme.name : 'Неизвестная тема'
  }

  function getTestsByCourse(courseId) {
    return tests.value.filter(test => {
      let testCourseId = test.course
      if (typeof testCourseId === 'object' && testCourseId?.id) {
        testCourseId = testCourseId.id
      }
      return parseInt(testCourseId) === parseInt(courseId)
    })
  }

  function getAssignmentsByCourse(courseId) {
    return assignments.value.filter(assignment => {
      let assignmentCourseId = assignment.course
      if (typeof assignmentCourseId === 'object' && assignmentCourseId?.id) {
        assignmentCourseId = assignmentCourseId.id
      }
      return parseInt(assignmentCourseId) === parseInt(courseId)
    })
  }

  function getTestsByTheme(themeId) {
    return tests.value.filter(test => {
      let testThemeId = test.theme
      if (typeof testThemeId === 'object' && testThemeId?.id) {
        testThemeId = testThemeId.id
      }
      return parseInt(testThemeId) === parseInt(themeId)
    })
  }

  function getAssignmentsByTheme(themeId) {
    return assignments.value.filter(assignment => {
      let assignmentThemeId = assignment.theme
      if (typeof assignmentThemeId === 'object' && assignmentThemeId?.id) {
        assignmentThemeId = assignmentThemeId.id
      }
      return parseInt(assignmentThemeId) === parseInt(themeId)
    })
  }

  function updateThemeOrder(themeIds) {
    console.log('🔄 Обновление порядка тем в исходных данных:', themeIds)
    console.log('🔍 Текущее состояние тем:', themes.value.map(t => ({ id: t.id, name: t.name, sort_order: t.sort_order })))
    
    // Обновляем sort_order в исходном массиве themes
    themeIds.forEach((themeId, index) => {
      const theme = themes.value.find(t => t.id === themeId)
      if (theme) {
        theme.sort_order = index + 1
        console.log(`📝 Обновлен sort_order исходной темы "${theme.name}": ${theme.sort_order}`)
      }
    })
    
    console.log('✅ Порядок тем обновлен в исходных данных')
    console.log('🔍 Новое состояние тем:', themes.value.map(t => ({ id: t.id, name: t.name, sort_order: t.sort_order })))
  }

  function updateLessonOrder(themeId, lessonIds) {
    console.log('🔄 Обновление порядка уроков в исходных данных:', { themeId, lessonIds })
    console.log('🔍 Текущее состояние уроков темы:', lessons.value.filter(l => {
      let lessonThemeId = l.theme
      if (typeof lessonThemeId === 'object' && lessonThemeId?.id) {
        lessonThemeId = lessonThemeId.id
      }
      return parseInt(lessonThemeId) === parseInt(themeId)
    }).map(l => ({ id: l.id, name: l.name, sort_order: l.sort_order })))
    
    // Обновляем sort_order в исходном массиве lessons
    lessonIds.forEach((lessonId, index) => {
      const lesson = lessons.value.find(l => l.id === lessonId)
      if (lesson) {
        lesson.sort_order = index + 1
        console.log(`📝 Обновлен sort_order исходного урока "${lesson.name}": ${lesson.sort_order}`)
      }
    })
    
    console.log('✅ Порядок уроков обновлен в исходных данных')
    console.log('🔍 Новое состояние уроков темы:', lessons.value.filter(l => {
      let lessonThemeId = l.theme
      if (typeof lessonThemeId === 'object' && lessonThemeId?.id) {
        lessonThemeId = lessonThemeId.id
      }
      return parseInt(lessonThemeId) === parseInt(themeId)
    }).map(l => ({ id: l.id, name: l.name, sort_order: l.sort_order })))
  }
  
  return {
    // Данные
    courses,
    themes,
    lessons,
    forums,
    tests,
    assignments,
    resources,
    categories,
    courseFormats,
    loading,
    
    // Фильтры
    selectedCourseId,
    searchQuery,
    selectedCategory,
    selectedFormat,
    selectedStatus,
    sortBy,
    sortOrder,
    
    // Вычисляемые свойства
    stats,
    filteredLessons,
    groupedData,
    
    // Методы
    fetchData,
    getThemesByCourse,
    getForumsByCourse,
    getLessonsForCourse,
    getThemeNameForLesson,
    getTestsByCourse,
    getAssignmentsByCourse,
    getTestsByTheme,
    getAssignmentsByTheme,
    updateThemeOrder,
    updateLessonOrder
  }
} 