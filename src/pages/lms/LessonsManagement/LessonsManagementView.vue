<template>
  <div class="lessons-management-view">
    <RoleGuard 
      :roles="['teacher', 'admin']"
      fallback-message="Доступ к управлению уроками имеют только преподаватели и администраторы"
    >
      <!-- Заголовок -->
      <div class="row mb-4">
        <div class="col-12">
          <div>
            <h3 class="mb-1">Управление учебными материалами</h3>
            <p class="text-muted mb-0">Создавайте, редактируйте и организуйте курсы, темы, уроки, тесты, задания и форумы</p>
          </div>
        </div>
      </div>

      <!-- Фильтры -->
      <FiltersSection 
        :selectedCourseId="lessonsData.selectedCourseId.value"
        :searchQuery="lessonsData.searchQuery.value"
        :selectedCategory="lessonsData.selectedCategory.value"
        :selectedFormat="lessonsData.selectedFormat.value"
        :selectedStatus="lessonsData.selectedStatus.value"
        :sortBy="lessonsData.sortBy.value"
        :sortOrder="lessonsData.sortOrder.value"
        :courses="lessonsData.courses.value"
        :categories="lessonsData.categories.value"
        :courseFormats="lessonsData.courseFormats.value"
        @update:selectedCourseId="lessonsData.selectedCourseId.value = $event"
        @update:searchQuery="lessonsData.searchQuery.value = $event"
        @update:selectedCategory="lessonsData.selectedCategory.value = $event"
        @update:selectedFormat="lessonsData.selectedFormat.value = $event"
        @update:selectedStatus="lessonsData.selectedStatus.value = $event"
        @update:sortBy="lessonsData.sortBy.value = $event"
        @update:sortOrder="lessonsData.sortOrder.value = $event"
      />

      <!-- Статистика -->
      <StatsSection :stats="lessonsData.stats.value" />

      <!-- Основной контент -->
      <MainContent
        :loading="lessonsData.loading.value"
        :groupedData="lessonsData.groupedData.value"
        :expandedThemes="expandedThemes"
        :expandedCourses="expandedCourses"
        :expandedLessons="expandedLessons"
        :forums="lessonsData.forums.value"
        :tests="lessonsData.tests.value"
        :assignments="lessonsData.assignments.value"
        :resources="lessonsData.resources.value"
        @createCourse="openCourseModal"
        @editCourse="editCourse"
        @deleteCourse="deleteCourse"
        @createTheme="openThemeModal"
        @editTheme="editTheme"
        @deleteTheme="deleteTheme"
        @createLesson="openLessonModal"
        @editLesson="editLesson"
        @deleteLesson="deleteLesson"
        @duplicateLesson="duplicateLesson"
        @toggleLessonVisibility="toggleLessonVisibility"
        @createTest="openTestModal"
        @editTest="editTest"
        @deleteTest="deleteTest"
        @duplicateTest="duplicateTest"
        @openQuestionManagement="openQuestionManagement"
        @createAssignment="openAssignmentModal"
        @editAssignment="editAssignment"
        @deleteAssignment="deleteAssignment"
        @createResource="openResourceModal"
        @editResource="editResource"
        @deleteResource="deleteResource"
        @createForum="openForumModal"
        @editForum="editForum"
        @deleteForum="deleteForum"
        @toggleTheme="toggleTheme"
        @toggleCourse="toggleCourse"
        @toggleLesson="toggleLesson"
        @reorderThemes="handleReorderThemes"
        @reorderLessons="handleReorderLessons"
        @reorderTests="handleReorderTests"
        @reorderAssignments="handleReorderAssignments"
      />

      <!-- Модальные окна -->
      <CourseModal
        :show="courseModal.showModal.value"
        :editing="courseModal.editingItem.value"
        :courseData="courseModal.formData.value"
        :categories="lessonsData.categories.value"
        :courseFormats="lessonsData.courseFormats.value"
        :loading="courseModal.isSubmitting.value"
        @close="courseModal.closeModal"
        @save="saveCourse"
      />

      <ThemeModal
        :show="themeModal.showModal.value"
        :editing="themeModal.editingItem.value"
        :themeData="themeModal.formData.value"
        :courses="lessonsData.courses.value"
        :loading="themeModal.isSubmitting.value"
        @close="themeModal.closeModal"
        @save="saveTheme"
      />

      <LessonModal
        :show="lessonModal.showModal.value"
        :editing="lessonModal.editingItem.value"
        :lessonData="lessonModal.formData.value"
        :courses="lessonsData.courses.value"
        :themes="lessonsData.themes.value"
        :loading="lessonModal.isSubmitting.value"
        @close="lessonModal.closeModal"
        @save="saveLesson"
      />

      <TestModal
        :show="testModal.showModal.value"
        :editing="testModal.editingItem.value"
        :testData="testModal.formData.value"
        :courses="lessonsData.courses.value"
        :themes="lessonsData.themes.value"
        :lessons="lessonsData.lessons.value"
        :loading="testModal.isSubmitting.value"
        @close="testModal.closeModal"
        @save="saveTest"
      />

      <AssignmentModal
        :show="assignmentModal.showModal.value"
        :editing="assignmentModal.editingItem.value"
        :assignmentData="assignmentModal.formData.value"
        :courses="lessonsData.courses.value"
        :themes="lessonsData.themes.value"
        :lessons="lessonsData.lessons.value"
        :loading="assignmentModal.isSubmitting.value"
        @close="assignmentModal.closeModal"
        @save="saveAssignment"
      />

      <ForumModal
        :show="forumModal.showModal.value"
        :editing="forumModal.editingItem.value"
        :forumData="forumModal.formData.value"
        :courses="lessonsData.courses.value"
        :loading="forumModal.isSubmitting.value"
        @close="forumModal.closeModal"
        @save="saveForum"
      />

      <ResourceModal
        :show="resourceModal.showModal.value"
        :editing="resourceModal.editingItem.value"
        :resourceData="resourceModal.formData.value"
        :courses="lessonsData.courses.value"
        :themes="lessonsData.themes.value"
        :lessons="lessonsData.lessons.value"
        :loading="resourceModal.isSubmitting.value"
        @close="resourceModal.closeModal"
        @save="saveResource"
      />

      <QuestionManagementModal
        :show="questionManagementModal.showModal.value"
        :test-data="questionManagementModal.formData.value"
        :loading="questionManagementModal.isSubmitting.value"
        @close="questionManagementModal.closeModal"
        @save="handleQuestionManagementSave"
      />

      <!-- Модальное окно подтверждения удаления -->
      <ConfirmDialog
        :show="confirmDialog.showConfirmDialog.value"
        :title="confirmDialog.confirmDialogData.value.title"
        :message="confirmDialog.confirmDialogData.value.message"
        :confirmText="confirmDialog.confirmDialogData.value.confirmText"
        :loading="confirmDialog.dialogLoading.value"
        @confirm="confirmDialog.handleConfirmDialog"
        @cancel="confirmDialog.closeConfirmDialog"
        @close="confirmDialog.closeConfirmDialog"
      />
    </RoleGuard>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import RoleGuard from '../components/RoleGuard.vue'
import ConfirmDialog from '@/components/ConfirmDialog.vue'

// Импорт созданных компонентов
import CourseModal from './components/modals/CourseModal.vue'
import ThemeModal from './components/modals/ThemeModal.vue'
import LessonModal from './components/modals/LessonModal.vue'
import TestModal from './components/modals/TestModal.vue'
import AssignmentModal from './components/modals/AssignmentModal.vue'
import ForumModal from './components/modals/ForumModal.vue'
import ResourceModal from './components/modals/ResourceModal.vue'
import QuestionManagementModal from './components/modals/QuestionManagementModal.vue'
import FiltersSection from './components/FiltersSection.vue'
import StatsSection from './components/StatsSection.vue'
import MainContent from './components/MainContent.vue'

// Импорт композаблов
import { useLessonsData } from '../composables/useLessonsData'
import { useCrudOperations } from '../composables/useCrudOperations'
import { useConfirmDialog } from '../composables/useConfirmDialog'
import { useFormManagement } from '../composables/useFormManagement'
import { showSuccess, showError } from '@/js/utils/notifications'

// Инициализация композаблов
const lessonsData = useLessonsData()
const crudOperations = useCrudOperations()
const confirmDialog = useConfirmDialog()

// Состояние раскрытых тем
const expandedThemes = ref(new Set())

// Состояние раскрытых курсов
const expandedCourses = ref(new Set())

// Состояние раскрытых уроков
const expandedLessons = ref(new Set())

// Модальные окна
const courseModal = useFormManagement()
const themeModal = useFormManagement()
const lessonModal = useFormManagement()
const testModal = useFormManagement()
const assignmentModal = useFormManagement()
const forumModal = useFormManagement()
const resourceModal = useFormManagement()
const questionManagementModal = useFormManagement()

// Методы для курсов
function openCourseModal() {
  courseModal.formData.value = {}
  courseModal.editingItem.value = false
  courseModal.openModal()
}

function editCourse(course) {
  courseModal.formData.value = course
  courseModal.editingItem.value = true
  courseModal.openModal()
}

async function saveCourse(formData, errors) {
  courseModal.isSubmitting.value = true
  try {
    if (courseModal.editingItem.value) {
      await crudOperations.updateCourse(courseModal.formData.value.id, formData, errors)
    } else {
      await crudOperations.createCourse(formData, errors)
    }
    await lessonsData.fetchData()
    courseModal.closeModal()
  } catch (error) {
    // Ошибки обрабатываются в useCrudOperations
  } finally {
    courseModal.isSubmitting.value = false
  }
}

function deleteCourse(course) {
  const themesInCourse = lessonsData.themes.value.filter(theme => {
    let subjectId = theme.subject
    if (typeof subjectId === 'object' && subjectId?.id) {
      subjectId = subjectId.id
    }
    return parseInt(subjectId) === parseInt(course.id)
  })
  
  const lessonsCount = themesInCourse.reduce((count, theme) => {
    const lessonsInTheme = lessonsData.lessons.value.filter(lesson => {
      let lessonThemeId = lesson.theme
      if (typeof lessonThemeId === 'object' && lessonThemeId?.id) {
        lessonThemeId = lessonThemeId.id
      }
      return parseInt(lessonThemeId) === parseInt(theme.id)
    })
    return count + lessonsInTheme.length
  }, 0)
  
  let message = `Вы уверены, что хотите удалить курс "${course.name}"?`
  
  if (themesInCourse.length > 0) {
    message += `\n\n⚠️ ВНИМАНИЕ: В этом курсе ${themesInCourse.length} тем(ы) и ${lessonsCount} урок(ов). Все данные будут удалены навсегда!`
  }
  
  message += '\n\nЭто действие нельзя отменить.'

  confirmDialog.openConfirmDialog({
    title: 'Удаление курса',
    message: message,
    confirmText: 'Удалить',
    onConfirm: async () => {
      try {
        await crudOperations.deleteCourse(course.id)
        await lessonsData.fetchData()
        confirmDialog.closeConfirmDialog()
      } catch (error) {
        // Ошибки обрабатываются в useCrudOperations
      }
    }
  })
}

// Методы для тем
function openThemeModal(course = null) {
  console.log('openThemeModal вызван с курсом:', course)
  
  // Если курс передан, устанавливаем его ID
  let initialData = {}
  if (course && course.id) {
    initialData.subject = parseInt(course.id)
    console.log('Установлен subject для новой темы:', initialData.subject)
  }
  
  themeModal.formData.value = initialData
  themeModal.editingItem.value = false
  themeModal.openModal()
}

function editTheme(theme) {
  themeModal.formData.value = theme
  themeModal.editingItem.value = true
  themeModal.openModal()
}

async function saveTheme(data, errors) {
  themeModal.isSubmitting.value = true
  try {
    if (themeModal.editingItem.value) {
      await crudOperations.updateTheme(themeModal.formData.value.id, data, errors)
    } else {
      await crudOperations.createTheme(data, errors)
    }
    await lessonsData.fetchData()
    themeModal.closeModal()
  } catch (error) {
    // Ошибки обрабатываются в useCrudOperations
  } finally {
    themeModal.isSubmitting.value = false
  }
}

function deleteTheme(theme) {
  const lessonsInTheme = lessonsData.lessons.value.filter(lesson => {
    let lessonThemeId = lesson.theme
    if (typeof lessonThemeId === 'object' && lessonThemeId?.id) {
      lessonThemeId = lessonThemeId.id
    }
    return parseInt(lessonThemeId) === parseInt(theme.id)
  })
  
  let message = `Вы уверены, что хотите удалить тему "${theme.name}"?`
  
  if (lessonsInTheme.length > 0) {
    message += `\n\n⚠️ ВНИМАНИЕ: В этой теме ${lessonsInTheme.length} урок(ов). Они также будут удалены навсегда!`
  }
  
  message += '\n\nЭто действие нельзя отменить.'

  confirmDialog.openConfirmDialog({
    title: 'Удаление темы',
    message: message,
    confirmText: 'Удалить',
    onConfirm: async () => {
      try {
        await crudOperations.deleteTheme(theme.id)
        await lessonsData.fetchData()
        confirmDialog.closeConfirmDialog()
      } catch (error) {
        // Ошибки обрабатываются в useCrudOperations
      }
    }
  })
}

// Методы для уроков
function openLessonModal(theme = null) {
  console.log('🔍 Открытие модального окна урока с темой:', theme)
  
  let courseId = null
  if (theme) {
    courseId = theme.subject
    if (typeof courseId === 'object' && courseId?.id) {
      courseId = courseId.id
    }
    console.log('📋 Извлеченный ID курса:', courseId)
    console.log('📋 ID темы:', theme.id)
  }
  
  // Подготавливаем данные для формы урока с предзаполненными полями
  const formData = theme ? { 
    course: parseInt(courseId), 
    theme: parseInt(theme.id),
    // Устанавливаем видимость по умолчанию
    is_visible: true,
    // По умолчанию тип урока - лекция
    lessontype: 'L'
  } : {
    is_visible: true,
    lessontype: 'L'
  }
  
  console.log('📝 Данные формы для создания урока:', formData)
  
  lessonModal.formData.value = formData
  lessonModal.editingItem.value = false
  lessonModal.openModal()
}

function editLesson(lesson) {
  lessonModal.formData.value = lesson
  lessonModal.editingItem.value = true
  lessonModal.openModal()
}

async function saveLesson(data, errors) {
  lessonModal.isSubmitting.value = true
  try {
    if (lessonModal.editingItem.value) {
      await crudOperations.updateLesson(lessonModal.formData.value.id, data, errors)
    } else {
      await crudOperations.createLesson(data, errors)
    }
    await lessonsData.fetchData()
    lessonModal.closeModal()
  } catch (error) {
    // Ошибки обрабатываются в useCrudOperations
  } finally {
    lessonModal.isSubmitting.value = false
  }
}

function deleteLesson(lesson) {
  confirmDialog.openConfirmDialog({
    title: 'Удаление урока',
    message: `Вы уверены, что хотите удалить урок "${lesson.name}"?\n\nЭто действие нельзя отменить.`,
    confirmText: 'Удалить',
    onConfirm: async () => {
      try {
        await crudOperations.deleteLesson(lesson.id)
        await lessonsData.fetchData()
        confirmDialog.closeConfirmDialog()
      } catch (error) {
        // Ошибки обрабатываются в useCrudOperations
      }
    }
  })
}

async function duplicateLesson(lesson) {
  try {
    await crudOperations.duplicateLesson(lesson)
    await lessonsData.fetchData()
  } catch (error) {
    // Ошибки обрабатываются в useCrudOperations
  }
}

async function toggleLessonVisibility(lesson) {
  try {
    await crudOperations.toggleLessonVisibility(lesson)
    await lessonsData.fetchData()
  } catch (error) {
    // Ошибки обрабатываются в useCrudOperations
  }
}

// Методы для ресурсов
function openResourceModal(lesson = null, theme = null) {
  let courseId = null
  let themeId = null
  
  if (lesson) {
    // Если передан урок, получаем тему и курс из урока
    themeId = lesson.theme
    if (typeof themeId === 'object' && themeId?.id) {
      themeId = themeId.id
    }
    
    // Находим тему для получения курса
    const themeObj = lessonsData.themes.value.find(t => t.id === themeId)
    if (themeObj) {
      courseId = themeObj.subject
      if (typeof courseId === 'object' && courseId?.id) {
        courseId = courseId.id
      }
    }
  } else if (theme) {
    // Если передана тема
    themeId = theme.id
    courseId = theme.subject
    if (typeof courseId === 'object' && courseId?.id) {
      courseId = courseId.id
    }
  }
  
  resourceModal.formData.value = { 
    course: courseId,
    theme: themeId,
    lesson: lesson?.id || null
  }
  resourceModal.editingItem.value = false
  resourceModal.openModal()
}

function editResource(resource) {
  resourceModal.formData.value = resource
  resourceModal.editingItem.value = true
  resourceModal.openModal()
}

async function saveResource(data, errors) {
  resourceModal.isSubmitting.value = true
  try {
    if (resourceModal.editingItem.value) {
      await crudOperations.updateResource(resourceModal.formData.value.id, data, errors)
    } else {
      await crudOperations.createResource(data, errors)
    }
    await lessonsData.fetchData()
    resourceModal.closeModal()
  } catch (error) {
    // Ошибки обрабатываются в useCrudOperations
  } finally {
    resourceModal.isSubmitting.value = false
  }
}

function deleteResource(resource) {
  confirmDialog.openConfirmDialog({
    title: 'Удаление ресурса',
    message: `Вы уверены, что хотите удалить ресурс "${resource.name}"?\n\nЭто действие нельзя отменить.`,
    confirmText: 'Удалить',
    onConfirm: async () => {
      try {
        await crudOperations.deleteResource(resource.id)
        await lessonsData.fetchData()
        confirmDialog.closeConfirmDialog()
      } catch (error) {
        // Ошибки обрабатываются в useCrudOperations
      }
    }
  })
}

// Управление раскрытием тем
function toggleTheme(themeId) {
  if (expandedThemes.value.has(themeId)) {
    expandedThemes.value.delete(themeId)
  } else {
    expandedThemes.value.add(themeId)
  }
}

// Управление раскрытием курсов
function toggleCourse(courseId) {
  if (expandedCourses.value.has(courseId)) {
    expandedCourses.value.delete(courseId)
  } else {
    expandedCourses.value.add(courseId)
  }
}

// Управление раскрытием уроков
function toggleLesson(lessonId) {
  if (expandedLessons.value.has(lessonId)) {
    expandedLessons.value.delete(lessonId)
  } else {
    expandedLessons.value.add(lessonId)
  }
}

// Методы для тестов
function openTestModal(theme = null, lesson = null) {
  let courseId = null
  let themeId = null
  
  if (lesson) {
    // Если передан урок, получаем тему и курс из урока
    themeId = lesson.theme
    if (typeof themeId === 'object' && themeId?.id) {
      themeId = themeId.id
    }
    
    // Находим тему для получения курса
    const themeObj = lessonsData.themes.value.find(t => t.id === themeId)
    if (themeObj) {
      courseId = themeObj.subject
      if (typeof courseId === 'object' && courseId?.id) {
        courseId = courseId.id
      }
    }
  } else if (theme) {
    // Если передана тема
    themeId = theme.id
    courseId = theme.subject
    if (typeof courseId === 'object' && courseId?.id) {
      courseId = courseId.id
    }
  }
  
  testModal.formData.value = { 
    course: courseId,
    theme: themeId,
    lesson: lesson?.id || null
  }
  testModal.editingItem.value = false
  testModal.openModal()
}

function editTest(test) {
  testModal.formData.value = test
  testModal.editingItem.value = true
  testModal.openModal()
}

async function saveTest(data, errors) {
  testModal.isSubmitting.value = true
  try {
    if (testModal.editingItem.value) {
      await crudOperations.updateTest(testModal.formData.value.id, data, errors)
    } else {
      await crudOperations.createTest(data, errors)
    }
    await lessonsData.fetchData()
    testModal.closeModal()
  } catch (error) {
    // Ошибки обрабатываются в useCrudOperations
  } finally {
    testModal.isSubmitting.value = false
  }
}

function deleteTest(test) {
  confirmDialog.openConfirmDialog({
    title: 'Удаление теста',
    message: `Вы уверены, что хотите удалить тест "${test.name}"?\n\nЭто действие нельзя отменить.`,
    confirmText: 'Удалить',
    onConfirm: async () => {
      try {
        await crudOperations.deleteTest(test.id)
        await lessonsData.fetchData()
        confirmDialog.closeConfirmDialog()
      } catch (error) {
        // Ошибки обрабатываются в useCrudOperations
      }
    }
  })
}

async function duplicateTest(test) {
  try {
    await crudOperations.duplicateTest(test)
    await lessonsData.fetchData()
  } catch (error) {
    // Ошибки обрабатываются в useCrudOperations
  }
}

function openQuestionManagement(test) {
  questionManagementModal.formData.value = test
  questionManagementModal.editingItem.value = false
  questionManagementModal.openModal()
}

async function handleQuestionManagementSave(data) {
  try {
    questionManagementModal.isSubmitting.value = true
    
    // Здесь можно реализовать сохранение вопросов через API
    console.log('Сохранение вопросов для теста:', data.testData?.title, 'Количество вопросов:', data.questions?.length)
    
    // Эмуляция задержки API
    await new Promise(resolve => setTimeout(resolve, 500))
    
    questionManagementModal.closeModal()
    showSuccess(`Сохранено ${data.questions?.length || 0} вопросов для теста "${data.testData?.title}"`)
    
    // await lessonsData.fetchData() // Обновляем данные при необходимости
    
  } catch (error) {
    console.error('Ошибка при сохранении вопросов:', error)
    showError('Ошибка при сохранении вопросов')
  } finally {
    questionManagementModal.isSubmitting.value = false
  }
}

// Методы для заданий
function openAssignmentModal(theme = null, lesson = null) {
  let courseId = null
  let themeId = null
  
  if (lesson) {
    // Если передан урок, получаем тему и курс из урока
    themeId = lesson.theme
    if (typeof themeId === 'object' && themeId?.id) {
      themeId = themeId.id
    }
    
    // Находим тему для получения курса
    const themeObj = lessonsData.themes.value.find(t => t.id === themeId)
    if (themeObj) {
      courseId = themeObj.subject
      if (typeof courseId === 'object' && courseId?.id) {
        courseId = courseId.id
      }
    }
  } else if (theme) {
    // Если передана тема
    themeId = theme.id
    courseId = theme.subject
    if (typeof courseId === 'object' && courseId?.id) {
      courseId = courseId.id
    }
  }
  
  assignmentModal.formData.value = { 
    course: courseId,
    theme: themeId,
    lesson: lesson?.id || null
  }
  assignmentModal.editingItem.value = false
  assignmentModal.openModal()
}

function editAssignment(assignment) {
  assignmentModal.formData.value = assignment
  assignmentModal.editingItem.value = true
  assignmentModal.openModal()
}

async function saveAssignment(data, errors) {
  assignmentModal.isSubmitting.value = true
  try {
    if (assignmentModal.editingItem.value) {
      await crudOperations.updateAssignment(assignmentModal.formData.value.id, data, errors)
    } else {
      await crudOperations.createAssignment(data, errors)
    }
    await lessonsData.fetchData()
    assignmentModal.closeModal()
  } catch (error) {
    // Ошибки обрабатываются в useCrudOperations
  } finally {
    assignmentModal.isSubmitting.value = false
  }
}

function deleteAssignment(assignment) {
  confirmDialog.openConfirmDialog({
    title: 'Удаление задания',
    message: `Вы уверены, что хотите удалить задание "${assignment.title}"?\n\nЭто действие нельзя отменить.`,
    confirmText: 'Удалить',
    onConfirm: async () => {
      try {
        await crudOperations.deleteAssignment(assignment.id)
        await lessonsData.fetchData()
        confirmDialog.closeConfirmDialog()
      } catch (error) {
        // Ошибки обрабатываются в useCrudOperations
      }
    }
  })
}

// Методы для форумов
function openForumModal(course = null) {
  forumModal.formData.value = course ? { subject: course.id } : {}
  forumModal.editingItem.value = false
  forumModal.openModal()
}

function editForum(forum) {
  forumModal.formData.value = forum
  forumModal.editingItem.value = true
  forumModal.openModal()
}

async function saveForum(data, errors) {
  forumModal.isSubmitting.value = true
  try {
    if (forumModal.editingItem.value) {
      await crudOperations.updateForum(forumModal.formData.value.id, data, errors)
    } else {
      await crudOperations.createForum(data, errors)
    }
    await lessonsData.fetchData()
    forumModal.closeModal()
  } catch (error) {
    // Ошибки обрабатываются в useCrudOperations
  } finally {
    forumModal.isSubmitting.value = false
  }
}

function deleteForum(forum) {
  confirmDialog.openConfirmDialog({
    title: 'Удаление форума',
    message: `Вы уверены, что хотите удалить форум "${forum.name}"?\n\nЭто действие нельзя отменить.`,
    confirmText: 'Удалить',
    onConfirm: async () => {
      try {
        await crudOperations.deleteForum(forum.id)
        await lessonsData.fetchData()
        confirmDialog.closeConfirmDialog()
      } catch (error) {
        // Ошибки обрабатываются в useCrudOperations
      }
    }
  })
}

// Обработка изменения порядка тем
function handleReorderThemes(data) {
  console.log('🔄 Обработка изменения порядка тем:', data)
  
  if (data.error) {
    // Если произошла ошибка, обновляем данные для восстановления порядка
    console.log('❌ Ошибка при изменении порядка, обновляем данные...')
    lessonsData.fetchData()
  } else {
    // Успешное изменение порядка
    console.log('✅ Порядок тем успешно изменен:', data.themeIds)
    
    if (data.success) {
      console.log('🎉 Порядок тем сохранен успешно!')
      // Обновляем исходные данные для корректного отображения
      lessonsData.updateThemeOrder(data.themeIds)
    }
    
    // Можно показать уведомление об успехе
    // toast.success('Порядок тем обновлен')
  }
}

// Обработка изменения порядка уроков
function handleReorderLessons(data) {
  console.log('🔄 Обработка изменения порядка уроков:', data)
  
  if (data.error) {
    // Если произошла ошибка, обновляем данные для восстановления порядка
    console.log('❌ Ошибка при изменении порядка уроков, обновляем данные...')
    lessonsData.fetchData()
  } else {
    // Успешное изменение порядка
    console.log('✅ Порядок уроков успешно изменен:', data.lessonIds)
    
    if (data.success) {
      console.log('🎉 Порядок уроков сохранен успешно!')
      // Обновляем исходные данные для корректного отображения
      lessonsData.updateLessonOrder(data.themeId, data.lessonIds)
    }
    
    // Можно показать уведомление об успехе
    // toast.success('Порядок уроков обновлен')
  }
}

// Обработка изменения порядка тестов
function handleReorderTests(data) {
  console.log('🔄 Обработка изменения порядка тестов:', data)
  
  if (data.error) {
    // Если произошла ошибка, обновляем данные для восстановления порядка
    console.log('❌ Ошибка при изменении порядка тестов, обновляем данные...')
    lessonsData.fetchData()
  } else {
    // Успешное изменение порядка
    console.log('✅ Порядок тестов успешно изменен:', data.testIds)
    
    if (data.success) {
      console.log('🎉 Порядок тестов сохранен успешно!')
      // Обновляем исходные данные для корректного отображения
      lessonsData.updateTestOrder(data.lessonId, data.testIds)
      showSuccess('Порядок тестов обновлен')
    }
  }
}

// Обработка изменения порядка заданий
function handleReorderAssignments(data) {
  console.log('🔄 Обработка изменения порядка заданий:', data)
  
  if (data.error) {
    // Если произошла ошибка, обновляем данные для восстановления порядка
    console.log('❌ Ошибка при изменении порядка заданий, обновляем данные...')
    lessonsData.fetchData()
  } else {
    // Успешное изменение порядка
    console.log('✅ Порядок заданий успешно изменен:', data.assignmentIds)
    
    if (data.success) {
      console.log('🎉 Порядок заданий сохранен успешно!')
      // Обновляем исходные данные для корректного отображения
      lessonsData.updateAssignmentOrder(data.lessonId, data.assignmentIds)
      showSuccess('Порядок заданий обновлен')
    }
  }
}

// Инициализация
onMounted(async () => {
  await lessonsData.fetchData()
  
  // Раскрываем первый курс, первую тему каждого курса и первый урок каждой темы
  lessonsData.groupedData.value.forEach((courseGroup, courseIndex) => {
    // Раскрываем первый курс
    if (courseIndex === 0) {
      expandedCourses.value.add(courseGroup.course.id)
    }
    
    // Раскрываем первую тему каждого курса
    if (courseGroup.themes.length > 0) {
      const firstTheme = courseGroup.themes[0]
      expandedThemes.value.add(firstTheme.id)
      
      // Раскрываем первый урок первой темы первого курса
      if (courseIndex === 0 && firstTheme.lessons && firstTheme.lessons.length > 0) {
        expandedLessons.value.add(firstTheme.lessons[0].id)
      }
    }
  })
})
</script>

<style scoped>
.lessons-management-view {
  padding: 1rem;
}
</style> 