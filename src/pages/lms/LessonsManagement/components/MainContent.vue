<template>
  <div>
    <!-- Загрузка -->
    <div v-if="loading" class="text-center py-5">
      <div class="spinner-border"></div>
      <p class="mt-2">Загрузка уроков...</p>
    </div>

    <!-- Пустое состояние -->
    <div v-else-if="groupedData.length === 0" class="text-center py-5">
      <BookOpen :size="48" class="text-muted mb-3" />
      <h5 class="text-muted">Курсы не найдены</h5>
      <p class="text-muted">Создайте первый курс и добавьте в него темы и уроки</p>
      <button @click="$emit('createCourse')" class="btn btn-primary">
        <Plus :size="18" class="me-2" />
        Создать первый курс
      </button>
    </div>

    <!-- Основной контент -->
    <div v-else>
      <div class="d-flex justify-content-between align-items-center mb-4">
        <h4 class="mb-0">Курсы</h4>
        <button @click="$emit('createCourse')" class="btn btn-outline-primary">
          <Plus :size="18" class="me-2" />
          Создать курс
        </button>
      </div>
      
      <div v-for="courseGroup in groupedData" :key="courseGroup.course.id" class="course-group mb-5">
        <!-- Заголовок курса -->
        <div class="card">
          <div class="card-header">
            <div class="d-flex justify-content-between align-items-center">
              <div class="d-flex align-items-center gap-3">
                <!-- Изображение курса -->
                <div v-if="courseGroup.course.course_image" class="course-image">
                  <img 
                    :src="courseGroup.course.course_image" 
                    :alt="courseGroup.course.name"
                    class="rounded"
                    style="width: 40px; height: 40px; object-fit: cover;"
                  />
                </div>
                <div v-else class="course-image-wrapper" style="width: 40px; height: 40px;">
                  <CourseImagePlaceholder 
                    width="40px" 
                    height="40px" 
                    :text="courseGroup.course.name.charAt(0).toUpperCase()"
                  />
                </div>
                
                <div>
                  <h5 class="mb-0">{{ courseGroup.course.name }}</h5>
                  <div class="d-flex align-items-center gap-2 mt-1">
                    <span class="badge bg-light text-dark">{{ courseGroup.totalLessons }} уроков</span>
                    <span v-if="!courseGroup.course.is_published" class="badge bg-warning">Черновик</span>
                  </div>
                </div>
              </div>
              <div class="btn-group">
                <button @click="$emit('editCourse', courseGroup.course)" class="btn btn-sm btn-outline-primary">
                  <Edit :size="16" />
                </button>
                <button @click="$emit('createTheme', courseGroup.course)" class="btn btn-sm btn-outline-success">
                  <Plus :size="16" />
                  Тема
                </button>
                <button @click="$emit('createForum', courseGroup.course)" class="btn btn-sm btn-outline-secondary">
                  <MessageSquare :size="16" />
                  Форум
                </button>
                <button @click="$emit('deleteCourse', courseGroup.course)" class="btn btn-sm btn-outline-danger">
                  <Trash2 :size="16" />
                </button>
              </div>
            </div>
          </div>

          <!-- Темы курса -->
          <div class="card-body p-0">
            <div v-if="courseGroup.themes.length === 0" class="text-center py-4">
              <FolderOpen :size="32" class="text-muted mb-2" />
              <p class="text-muted mb-2">В курсе нет тем</p>
              <button @click="$emit('createTheme', courseGroup.course)" class="btn btn-sm btn-primary">
                Создать первую тему
              </button>
            </div>

            <div v-else class="accordion" :id="`course-accordion-${courseGroup.course.id}`">
              <div v-for="theme in courseGroup.themes" :key="theme.id" class="accordion-item">
                <h2 class="accordion-header">
                  <button 
                    class="accordion-button"
                    :class="{ collapsed: !isThemeExpanded(theme.id) }"
                    type="button" 
                    @click="$emit('toggleTheme', theme.id)"
                  >
                    <div class="d-flex justify-content-between align-items-center w-100 me-3">
                      <div class="d-flex align-items-center gap-3">
                        <FolderOpen :size="18" />
                        <span class="fw-semibold">{{ theme.name }}</span>
                        <span class="badge bg-primary">{{ theme.lessons.length }} уроков</span>
                        <span v-if="!theme.is_visible" class="badge bg-secondary">Скрыта</span>
                      </div>
                      <div class="btn-group" @click.stop>
                        <button @click.stop="$emit('editTheme', theme)" class="btn btn-sm btn-outline-primary">
                          <Edit :size="14" />
                        </button>
                        <button @click.stop="$emit('createLesson', theme)" class="btn btn-sm btn-outline-success">
                          <Plus :size="14" />
                          Урок
                        </button>
                        <button @click.stop="$emit('deleteTheme', theme)" class="btn btn-sm btn-outline-danger">
                          <Trash2 :size="14" />
                        </button>
                      </div>
                    </div>
                  </button>
                </h2>
                <div 
                  :id="`theme-${theme.id}`" 
                  class="accordion-collapse collapse"
                  :class="{ show: isThemeExpanded(theme.id) }"
                >
                  <div class="accordion-body">
                    <!-- Действия с темой -->
                    <div class="d-flex justify-content-between align-items-center mb-3">
                      <h6 class="mb-0 d-flex align-items-center gap-2">
                        <BookOpen :size="18" />
                        Уроки
                      </h6>
                      <div class="btn-group">
                        <button @click.stop="$emit('createLesson', theme)" class="btn btn-sm btn-primary">
                          <Plus :size="14" />
                          Урок
                        </button>
                        <button @click.stop="$emit('createTest', theme)" class="btn btn-sm btn-info">
                          <FileCheck :size="14" />
                          Тест
                        </button>
                        <button @click.stop="$emit('createAssignment', theme)" class="btn btn-sm btn-warning">
                          <ClipboardList :size="14" />
                          Задание
                        </button>
                      </div>
                    </div>

                    <!-- Уроки темы -->
                    <div v-if="theme.lessons.length === 0" class="text-center py-3">
                      <BookOpen :size="24" class="text-muted mb-2" />
                      <p class="text-muted mb-2">В теме нет уроков</p>
                      <small class="text-muted">Используйте кнопки выше для создания контента</small>
                    </div>

                    <div v-else class="row">
                      <div v-for="lesson in theme.lessons" :key="lesson.id" class="col-md-6 col-lg-4 mb-3">
                        <div class="card h-100 lesson-card position-relative">
                          <div :class="`lesson-type-indicator lesson-type-${lesson.lessontype}`"></div>
                          <div class="card-body">
                            <div class="d-flex justify-content-between align-items-start mb-2">
                              <h6 class="card-title mb-0">{{ lesson.name }}</h6>
                              <div class="dropdown">
                                <button class="btn btn-sm btn-outline-secondary" data-bs-toggle="dropdown">
                                  <MoreVertical :size="14" />
                                </button>
                                <ul class="dropdown-menu">
                                  <li>
                                    <a class="dropdown-item" href="#" @click.prevent="$emit('editLesson', lesson)">
                                      <Edit :size="14" class="me-2" />
                                      Редактировать
                                    </a>
                                  </li>
                                  <li>
                                    <a class="dropdown-item" href="#" @click.prevent="$emit('duplicateLesson', lesson)">
                                      <Copy :size="14" class="me-2" />
                                      Дублировать
                                    </a>
                                  </li>
                                  <li>
                                    <a class="dropdown-item" href="#" @click.prevent="$emit('toggleLessonVisibility', lesson)">
                                      <component :is="lesson.is_visible ? 'EyeOff' : 'Eye'" :size="14" class="me-2" />
                                      {{ lesson.is_visible ? 'Скрыть' : 'Показать' }}
                                    </a>
                                  </li>
                                  <li><hr class="dropdown-divider"></li>
                                  <li>
                                    <a class="dropdown-item text-danger" href="#" @click.prevent="$emit('deleteLesson', lesson)">
                                      <Trash2 :size="14" class="me-2" />
                                      Удалить
                                    </a>
                                  </li>
                                </ul>
                              </div>
                            </div>
                            
                            <p class="card-text text-muted small mb-2">
                              {{ lesson.description || 'Без описания' }}
                            </p>
                            
                            <div class="lesson-meta small text-muted mb-2">
                              <div class="d-flex align-items-center gap-2 mb-1">
                                <component :is="getLessonTypeIcon(lesson.lessontype)" :size="12" />
                                <span>{{ getLessonTypeName(lesson.lessontype) }}</span>
                              </div>
                              <div class="d-flex align-items-center gap-2">
                                <Hash :size="12" />
                                <span>{{ lesson.sort_order || 0 }}</span>
                              </div>
                            </div>

                            <div class="d-flex justify-content-between align-items-center">
                              <div class="d-flex gap-1">
                                <span v-if="lesson.is_visible" class="badge bg-success small">Видимый</span>
                                <span v-else class="badge bg-secondary small">Скрытый</span>
                                <span v-if="lesson.completion_required" class="badge bg-warning small">Обязательный</span>
                              </div>
                              <button @click.stop="$emit('editLesson', lesson)" class="btn btn-sm btn-outline-primary">
                                <Edit :size="12" />
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    <!-- Форумы курса -->
                    <div class="mt-4">
                      <h6 class="mb-3 d-flex align-items-center gap-2">
                        <MessageSquare :size="18" />
                        Форумы курса
                      </h6>
                      
                      <div v-if="getForumsByCourse(courseGroup.course.id).length === 0" class="text-center py-3 bg-light rounded">
                        <MessageSquare :size="24" class="text-muted mb-2" />
                        <p class="text-muted mb-2">В курсе нет форумов</p>
                        <button @click.stop="$emit('createForum', courseGroup.course)" class="btn btn-sm btn-secondary me-2">
                          Создать первый форум
                        </button>
                      </div>

                      <div v-else class="row">
                        <div v-for="forum in getForumsByCourse(courseGroup.course.id)" :key="forum.id" class="col-md-6 col-lg-4 mb-3">
                          <div class="card h-100 forum-card">
                            <div class="card-body">
                              <div class="d-flex justify-content-between align-items-start mb-2">
                                <h6 class="card-title mb-0">{{ forum.name }}</h6>
                                <div class="dropdown">
                                  <button class="btn btn-sm btn-outline-secondary" data-bs-toggle="dropdown">
                                    <MoreVertical :size="14" />
                                  </button>
                                  <ul class="dropdown-menu">
                                    <li>
                                      <a class="dropdown-item" href="#" @click.prevent="$emit('editForum', forum)">
                                        <Edit :size="14" class="me-2" />
                                        Редактировать
                                      </a>
                                    </li>
                                    <li><hr class="dropdown-divider"></li>
                                    <li>
                                      <a class="dropdown-item text-danger" href="#" @click.prevent="$emit('deleteForum', forum)">
                                        <Trash2 :size="14" class="me-2" />
                                        Удалить
                                      </a>
                                    </li>
                                  </ul>
                                </div>
                              </div>
                              
                              <p class="card-text text-muted small mb-2">
                                {{ forum.description || 'Без описания' }}
                              </p>
                              
                              <div class="forum-meta small text-muted mb-2">
                                <div class="d-flex align-items-center gap-2 mb-1">
                                  <MessageSquare :size="12" />
                                  <span>{{ getForumTypeName(forum.forum_type) }}</span>
                                </div>
                              </div>

                              <div class="d-flex gap-1">
                                <span v-if="forum.is_moderated" class="badge bg-info small">Модерируемый</span>
                                <span v-if="forum.allow_anonymous" class="badge bg-warning small">Анонимный</span>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { 
  Plus, Edit, Trash2, Copy, EyeOff, MoreVertical,
  BookOpen, FolderOpen, Hash, Video, FileText, Link, 
  MessageSquare, Calendar, Award, TestTube,
  FileCheck, ClipboardList, Eye
} from 'lucide-vue-next'
import CourseImagePlaceholder from './CourseImagePlaceholder.vue'

const props = defineProps({
  loading: Boolean,
  groupedData: Array,
  expandedThemes: Set,
  forums: Array
})

defineEmits([
  'createCourse',
  'editCourse', 
  'deleteCourse',
  'createTheme',
  'editTheme',
  'deleteTheme',
  'createLesson',
  'editLesson',
  'deleteLesson',
  'duplicateLesson',
  'toggleLessonVisibility',
  'createTest',
  'createAssignment',
  'createForum',
  'editForum',
  'deleteForum',
  'toggleTheme'
])

const lessonTypes = [
  { value: 'L', label: 'Лекция', icon: FileText },
  { value: 'V', label: 'Видео', icon: Video },
  { value: 'URL', label: 'Ссылка', icon: Link },
  { value: 'F', label: 'Форум', icon: MessageSquare },
  { value: 'A', label: 'Задание', icon: Award },
  { value: 'Q', label: 'Тест', icon: TestTube },
  { value: 'C', label: 'Конференция', icon: Calendar },
  { value: 'FILE', label: 'Файл', icon: FileText }
]

function getLessonTypeIcon(type) {
  const lessonType = lessonTypes.find(t => t.value === type)
  return lessonType ? lessonType.icon : FileText
}

function getLessonTypeName(type) {
  const lessonType = lessonTypes.find(t => t.value === type)
  return lessonType ? lessonType.label : 'Неизвестно'
}

function getForumTypeName(type) {
  const forumTypes = {
    'general': 'Общий',
    'discussion': 'Обсуждение',
    'qa': 'Вопросы и ответы',
    'news': 'Новости',
    'announcement': 'Объявления'
  }
  return forumTypes[type] || 'Неизвестный тип'
}

function isThemeExpanded(themeId) {
  return props.expandedThemes?.has(themeId)
}

function getForumsByCourse(courseId) {
  return props.forums?.filter(forum => {
    let forumCourseId = forum.subject
    if (typeof forumCourseId === 'object' && forumCourseId?.id) {
      forumCourseId = forumCourseId.id
    }
    return parseInt(forumCourseId) === parseInt(courseId)
  }) || []
}
</script>

<style scoped>
.course-group {
  border-left: 4px solid var(--bs-primary);
  position: relative;
  z-index: auto;
}

.course-image img {
  border: 2px solid #dee2e6;
  transition: transform 0.2s ease;
}

.course-image img:hover {
  transform: scale(1.1);
}

.lesson-card {
  transition: box-shadow 0.2s, transform 0.2s;
  position: relative;
  z-index: 1;
}

.lesson-card:hover {
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  transform: translateY(-2px);
}

.lesson-card .dropdown-menu {
  position: absolute !important;
  z-index: 10000 !important;
  right: 0;
  left: auto;
  min-width: 160px;
  border: 1px solid rgba(0, 0, 0, 0.15);
  box-shadow: 0 0.5rem 1rem rgba(0, 0, 0, 0.15);
}

.lesson-type-indicator {
  width: 4px;
  height: 100%;
  position: absolute;
  left: 0;
  top: 0;
  border-radius: 0 0 0 0.375rem;
}

.lesson-type-L { background-color: #0d6efd; }
.lesson-type-V { background-color: #dc3545; }
.lesson-type-A { background-color: #198754; }
.lesson-type-Q { background-color: #fd7e14; }
.lesson-type-F { background-color: #6f42c1; }
.lesson-type-URL { background-color: #20c997; }
.lesson-type-C { background-color: #ffc107; }
.lesson-type-FILE { background-color: #6c757d; }

.forum-card {
  transition: box-shadow 0.2s, transform 0.2s;
  border-left: 4px solid #6c757d;
  position: relative;
  z-index: 1;
}

.forum-card:hover {
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  transform: translateY(-2px);
}

.badge.small {
  font-size: 0.6rem;
}

.accordion-item {
  border: 1px solid rgba(0, 0, 0, 0.125);
  margin-bottom: 0.5rem;
  border-radius: 0.375rem;
  overflow: visible;
}

.accordion-button {
  font-weight: 500;
  padding: 1rem 1.25rem;
}

.accordion-button:not(.collapsed) {
  background-color: rgba(var(--bs-primary-rgb), 0.08);
  border-color: rgba(var(--bs-primary-rgb), 0.125);
}

.accordion-body {
  padding: 1rem 1.25rem;
  background-color: #fafafa;
  overflow: visible;
}
</style> 