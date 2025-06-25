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
        :forums="lessonsData.forums.value"
        :tests="lessonsData.tests.value"
        :assignments="lessonsData.assignments.value"
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
        @createAssignment="openAssignmentModal"
        @editAssignment="editAssignment"
        @deleteAssignment="deleteAssignment"
        @createForum="openForumModal"
        @editForum="editForum"
        @deleteForum="deleteForum"
        @toggleTheme="toggleTheme"
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
import FiltersSection from './components/FiltersSection.vue'
import StatsSection from './components/StatsSection.vue'
import MainContent from './components/MainContent.vue'

// Импорт композаблов
import { useLessonsData } from '../composables/useLessonsData'
import { useCrudOperations } from '../composables/useCrudOperations'
import { useConfirmDialog } from '../composables/useConfirmDialog'
import { useFormManagement } from '../composables/useFormManagement'

// Инициализация композаблов
const lessonsData = useLessonsData()
const crudOperations = useCrudOperations()
const confirmDialog = useConfirmDialog()

// Состояние раскрытых тем
const expandedThemes = ref(new Set())

// Модальные окна
const courseModal = useFormManagement()
const themeModal = useFormManagement()
const lessonModal = useFormManagement()
const testModal = useFormManagement()
const assignmentModal = useFormManagement()
const forumModal = useFormManagement()

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
  themeModal.formData.value = course ? { subject: course.id } : {}
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
  let courseId = null
  if (theme) {
    courseId = theme.subject
    if (typeof courseId === 'object' && courseId?.id) {
      courseId = courseId.id
    }
  }
  
  lessonModal.formData.value = theme ? { 
    course: courseId, 
    theme: theme.id 
  } : {}
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

// Управление раскрытием тем
function toggleTheme(themeId) {
  if (expandedThemes.value.has(themeId)) {
    expandedThemes.value.delete(themeId)
  } else {
    expandedThemes.value.add(themeId)
  }
}

// Методы для тестов
function openTestModal(theme = null) {
  let courseId = null
  if (theme) {
    courseId = theme.subject
    if (typeof courseId === 'object' && courseId?.id) {
      courseId = courseId.id
    }
  }
  
  testModal.formData.value = theme ? { 
    course: courseId, 
    theme: theme.id 
  } : {}
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

// Методы для заданий
function openAssignmentModal(theme = null) {
  let courseId = null
  if (theme) {
    courseId = theme.subject
    if (typeof courseId === 'object' && courseId?.id) {
      courseId = courseId.id
    }
  }
  
  assignmentModal.formData.value = theme ? { 
    course: courseId, 
    theme: theme.id 
  } : {}
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

// Инициализация
onMounted(async () => {
  await lessonsData.fetchData()
  
  // Раскрываем первую тему каждого курса
  lessonsData.groupedData.value.forEach(courseGroup => {
    if (courseGroup.themes.length > 0) {
      expandedThemes.value.add(courseGroup.themes[0].id)
    }
  })
})
</script>

<style scoped>
.lessons-management-view {
  padding: 1rem;
}
</style> 