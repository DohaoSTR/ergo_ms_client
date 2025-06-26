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
          <div class="card-header p-0">
            <button 
              class="accordion-button w-100 border-0"
              :class="{ collapsed: !isCourseExpanded(courseGroup.course.id) }"
              type="button" 
              @click="$emit('toggleCourse', courseGroup.course.id)"
            >
              <div class="d-flex justify-content-between align-items-center w-100 me-3">
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
                <div class="btn-group" @click.stop>
                  <button @click.stop="$emit('editCourse', courseGroup.course)" class="btn btn-sm btn-outline-primary">
                    <Edit :size="16" />
                  </button>
                  <button @click.stop="$emit('createTheme', courseGroup.course)" class="btn btn-sm btn-outline-success">
                    <Plus :size="16" />
                    Тема
                  </button>
                  <button @click.stop="$emit('createForum', courseGroup.course)" class="btn btn-sm btn-outline-secondary">
                    <MessageSquare :size="16" />
                    Форум
                  </button>
                  <button @click.stop="$emit('deleteCourse', courseGroup.course)" class="btn btn-sm btn-outline-danger">
                    <Trash2 :size="16" />
                  </button>
                </div>
              </div>
            </button>
          </div>

          <!-- Темы курса - теперь условно отображаемые -->
          <div v-show="isCourseExpanded(courseGroup.course.id)" class="card-body p-0 mt-3">
            <div v-if="courseGroup.themes.length === 0" class="text-center py-4">
              <FolderOpen :size="32" class="text-muted mb-2" />
              <p class="text-muted mb-2">В курсе нет тем</p>
              <button @click="$emit('createTheme', courseGroup.course)" class="btn btn-sm btn-primary">
                Создать первую тему
              </button>
            </div>

            <div v-else class="accordion" :id="`course-accordion-${courseGroup.course.id}`">
              <draggable 
                v-model="courseGroup.themes" 
                group="themes"
                :animation="300"
                @change="onThemeChange($event, courseGroup.course.id)"
                @start="onThemeStart"
                item-key="id"
                tag="div"
                class="theme-sortable"
                handle=".theme-drag-handle"
                :disabled="false"
                ghost-class="sortable-ghost"
                chosen-class="sortable-chosen"
                drag-class="sortable-drag"
              >
                <template #item="{ element: theme }">
                  <div class="accordion-item theme-draggable-item"
                       :data-theme-id="theme.id">
                <h2 class="accordion-header">
                  <button 
                    class="accordion-button"
                    :class="{ collapsed: !isThemeExpanded(theme.id) }"
                    type="button" 
                    @click="$emit('toggleTheme', theme.id)"
                  >
                    <div class="d-flex justify-content-between align-items-center w-100 me-3">
                      <div class="d-flex align-items-center gap-3">
                        <div class="theme-drag-handle d-flex align-items-center" :class="{ disabled: isThemeExpanded(theme.id) }">
                          <GripVertical :size="16" class="text-muted" />
                        </div>
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
                    <!-- Заголовок секции уроков -->
                    <div class="mb-3">
                      <h6 class="mb-0 d-flex align-items-center gap-2">
                        <BookOpen :size="18" />
                        Уроки
                      </h6>
                    </div>

                    <!-- Уроки темы -->
                    <div v-if="theme.lessons.length === 0" class="text-center py-3">
                      <BookOpen :size="24" class="text-muted mb-2" />
                      <p class="text-muted mb-2">В теме нет уроков</p>
                      <small class="text-muted">Используйте кнопки выше для создания контента</small>
                    </div>

                    <div v-else class="lesson-container">
                      <draggable 
                        v-model="theme.lessons" 
                        group="lessons"
                        :animation="300"
                        @change="onLessonChange($event, theme.id)"
                        @start="onLessonStart"
                        item-key="id"
                        tag="div"
                        class="lesson-sortable row"
                        handle=".lesson-drag-handle"
                        :disabled="false"
                        ghost-class="sortable-ghost"
                        chosen-class="sortable-chosen"
                        drag-class="sortable-drag"
                      >
                        <template #item="{ element: lesson }">
                          <div class="col-12 mb-4 lesson-draggable-item" :data-lesson-id="lesson.id">
                            <div class="card lesson-card">
                              <div :class="`lesson-type-indicator lesson-type-${lesson.lessontype}`"></div>
                          
                          <!-- Заголовок урока -->
                          <div class="card-header p-0">
                            <button 
                              class="accordion-button w-100 border-0"
                              :class="{ collapsed: !isLessonExpanded(lesson.id) }"
                              type="button" 
                              @click="$emit('toggleLesson', lesson.id)"
                            >
                              <div class="d-flex justify-content-between align-items-center w-100 me-3">
                                <div class="d-flex align-items-center gap-3">
                                  <div class="lesson-drag-handle d-flex align-items-center" :class="{ disabled: isLessonExpanded(lesson.id) }">
                                    <GripVertical :size="16" class="text-muted" />
                                  </div>
                                  <component :is="getLessonTypeIcon(lesson.lessontype)" :size="20" />
                                  <div>
                                    <h6 class="mb-0">{{ lesson.name }}</h6>
                                    <small class="text-muted">{{ lesson.description || 'Без описания' }}</small>
                                  </div>
                                  <div class="d-flex gap-1">
                                    <span v-if="lesson.is_visible" class="badge bg-success small">Видимый</span>
                                    <span v-else class="badge bg-secondary small">Скрытый</span>
                                    <span v-if="lesson.completion_required" class="badge bg-warning small">Обязательный</span>
                                  </div>
                                </div>
                                
                                <div class="btn-group" @click.stop>
                                  <button @click.stop="$emit('editLesson', lesson)" class="btn btn-sm btn-outline-primary">
                                    <Edit :size="14" />
                                  </button>
                                  <button @click.stop="$emit('createTest', null, lesson)" class="btn btn-sm btn-outline-info">
                                    <FileCheck :size="14" />
                                    Тест
                                  </button>
                                  <button @click.stop="$emit('createAssignment', null, lesson)" class="btn btn-sm btn-outline-warning">
                                    <ClipboardList :size="14" />
                                    Задание
                                  </button>
                                  <button @click.stop="$emit('createResource', lesson)" class="btn btn-sm btn-outline-success">
                                    <Upload :size="14" />
                                    Ресурс
                                  </button>
                                  <div class="dropdown">
                                    <button class="btn btn-sm btn-outline-secondary" data-bs-toggle="dropdown">
                                      <MoreVertical :size="14" />
                                    </button>
                                    <ul class="dropdown-menu">
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
                              </div>
                            </button>
                          </div>

                          <!-- Содержимое урока - теперь условно отображаемое -->
                          <div v-show="isLessonExpanded(lesson.id)" class="card-body">
                            <!-- Тесты урока -->
                            <div class="mb-4">
                              <h6 class="d-flex align-items-center gap-2 mb-3">
                                <FileCheck :size="16" />
                                Тесты
                                <span class="badge bg-info">{{ getLessonTests(lesson.id).length }}</span>
                              </h6>
                              
                              <div v-if="getLessonTests(lesson.id).length === 0" class="text-center py-2 bg-light rounded">
                                <FileCheck :size="20" class="text-muted mb-1" />
                                <p class="text-muted small mb-0">Нет тестов</p>
                              </div>
                              
                              <draggable 
                                :list="getLessonTests(lesson.id)" 
                                group="tests"
                                :animation="300"
                                @end="onTestEnd($event, lesson.id)"
                                @start="onTestStart"
                                item-key="id"
                                tag="div"
                                class="row test-sortable"
                                handle=".test-drag-handle"
                                :disabled="false"
                                ghost-class="sortable-ghost"
                                chosen-class="sortable-chosen"
                                drag-class="sortable-drag"
                              >
                                <template #item="{ element: test }">
                                  <div class="col-md-6 mb-3 test-draggable-item" :data-test-id="test.id">
                                    <div class="card border-info h-100">
                                      <div class="card-body p-3">
                                        <div class="d-flex justify-content-between align-items-start mb-2">
                                          <div class="test-drag-handle d-flex align-items-center me-2">
                                            <GripVertical :size="12" class="text-muted" />
                                          </div>
                                          <div class="flex-grow-1">
                                            <h6 class="card-title mb-1">{{ test.title || test.name }}</h6>
                                            <small class="text-muted d-block">{{ getTestTypeLabel(test.type) }}</small>
                                            <div class="mt-2">
                                              <span class="badge bg-info small me-1">{{ test.duration_minutes }}мин</span>
                                              <span class="badge bg-secondary small me-1">{{ test.passing_score }}%</span>
                                              <span class="badge bg-primary small">{{ test.questions_count || 0 }} вопросов</span>
                                            </div>
                                            <div v-if="test.description" class="mt-2">
                                              <small class="text-muted">{{ test.description.substring(0, 80) }}{{ test.description.length > 80 ? '...' : '' }}</small>
                                            </div>
                                          </div>
                                          <div class="dropdown">
                                            <button class="btn btn-sm btn-outline-secondary" data-bs-toggle="dropdown">
                                              <MoreVertical :size="12" />
                                            </button>
                                            <ul class="dropdown-menu">
                                              <li>
                                                <a class="dropdown-item" href="#" @click.prevent="$emit('openQuestionManagement', test)">
                                                  <HelpCircle :size="12" class="me-2" />
                                                  Управление вопросами
                                                </a>
                                              </li>
                                              <li><hr class="dropdown-divider"></li>
                                              <li>
                                                <a class="dropdown-item" href="#" @click.prevent="$emit('editTest', test)">
                                                  <Edit :size="12" class="me-2" />
                                                  Редактировать тест
                                                </a>
                                              </li>
                                              <li>
                                                <a class="dropdown-item" href="#" @click.prevent="$emit('duplicateTest', test)">
                                                  <Copy :size="12" class="me-2" />
                                                  Дублировать
                                                </a>
                                              </li>
                                              <li><hr class="dropdown-divider"></li>
                                              <li>
                                                <a class="dropdown-item text-danger" href="#" @click.prevent="$emit('deleteTest', test)">
                                                  <Trash2 :size="12" class="me-2" />
                                                  Удалить
                                                </a>
                                              </li>
                                            </ul>
                                          </div>
                                        </div>
                                        
                                        <!-- Кнопка быстрого управления вопросами -->
                                        <div class="mt-2">
                                          <button 
                                            class="btn btn-outline-primary btn-sm w-100"
                                            @click="$emit('openQuestionManagement', test)"
                                          >
                                            <HelpCircle :size="14" class="me-1" />
                                            Управление вопросами
                                          </button>
                                        </div>
                                        
                                        <!-- Статус теста -->
                                        <div class="mt-2 d-flex justify-content-between align-items-center">
                                          <div>
                                            <span v-if="test.is_active" class="badge bg-success small">Активен</span>
                                            <span v-else class="badge bg-secondary small">Неактивен</span>
                                          </div>
                                          <small class="text-muted">
                                            {{ test.max_attempts }} {{ getPluralForm(test.max_attempts, 'попытка', 'попытки', 'попыток') }}
                                          </small>
                                        </div>
                                      </div>
                                    </div>
                                  </div>
                                </template>
                              </draggable>
                            </div>

                            <!-- Задания урока -->
                            <div class="mb-4">
                              <h6 class="d-flex align-items-center gap-2 mb-3">
                                <ClipboardList :size="16" />
                                Задания
                                <span class="badge bg-warning">{{ getLessonAssignments(lesson.id).length }}</span>
                              </h6>
                              
                              <div v-if="getLessonAssignments(lesson.id).length === 0" class="text-center py-2 bg-light rounded">
                                <ClipboardList :size="20" class="text-muted mb-1" />
                                <p class="text-muted small mb-0">Нет заданий</p>
                              </div>
                              
                              <draggable 
                                :list="getLessonAssignments(lesson.id)" 
                                group="assignments"
                                :animation="300"
                                @end="onAssignmentEnd($event, lesson.id)"
                                @start="onAssignmentStart"
                                item-key="id"
                                tag="div"
                                class="row assignment-sortable"
                                handle=".assignment-drag-handle"
                                :disabled="false"
                                ghost-class="sortable-ghost"
                                chosen-class="sortable-chosen"
                                drag-class="sortable-drag"
                              >
                                <template #item="{ element: assignment }">
                                  <div class="col-md-4 mb-2 assignment-draggable-item" :data-assignment-id="assignment.id">
                                    <div class="card border-warning">
                                      <div class="card-body p-3">
                                        <div class="d-flex justify-content-between align-items-start">
                                          <div class="assignment-drag-handle d-flex align-items-center me-2">
                                            <GripVertical :size="12" class="text-muted" />
                                          </div>
                                          <div class="flex-grow-1">
                                            <h6 class="card-title mb-1">{{ assignment.title }}</h6>
                                            <small class="text-muted">{{ assignment.submission_type }}</small>
                                            <div class="mt-1">
                                              <span class="badge bg-warning small">{{ assignment.max_grade }} баллов</span>
                                              <span v-if="assignment.deadline" class="badge bg-secondary small">
                                                {{ formatDate(assignment.deadline) }}
                                              </span>
                                            </div>
                                          </div>
                                          <div class="dropdown">
                                            <button class="btn btn-sm btn-outline-secondary" data-bs-toggle="dropdown">
                                              <MoreVertical :size="12" />
                                            </button>
                                            <ul class="dropdown-menu">
                                              <li>
                                                <a class="dropdown-item" href="#" @click.prevent="$emit('editAssignment', assignment)">
                                                  <Edit :size="12" class="me-2" />
                                                  Редактировать
                                                </a>
                                              </li>
                                              <li><hr class="dropdown-divider"></li>
                                              <li>
                                                <a class="dropdown-item text-danger" href="#" @click.prevent="$emit('deleteAssignment', assignment)">
                                                  <Trash2 :size="12" class="me-2" />
                                                  Удалить
                                                </a>
                                              </li>
                                            </ul>
                                          </div>
                                        </div>
                                      </div>
                                    </div>
                                  </div>
                                </template>
                              </draggable>
                            </div>

                            <!-- Ресурсы урока -->
                            <div>
                              <h6 class="d-flex align-items-center gap-2 mb-3">
                                <Upload :size="16" />
                                Ресурсы
                                <span class="badge bg-success">{{ getLessonResources(lesson.id).length }}</span>
                              </h6>
                              
                              <div v-if="getLessonResources(lesson.id).length === 0" class="text-center py-2 bg-light rounded">
                                <Upload :size="20" class="text-muted mb-1" />
                                <p class="text-muted small mb-0">Нет ресурсов</p>
                              </div>
                              
                              <div v-else class="row">
                                <div v-for="resource in getLessonResources(lesson.id)" :key="resource.id" class="col-md-4 mb-2">
                                  <div class="card border-success">
                                    <div class="card-body p-3">
                                      <div class="d-flex justify-content-between align-items-start">
                                        <div>
                                          <h6 class="card-title mb-1">{{ resource.name }}</h6>
                                          <small class="text-muted">{{ resource.file_type }}</small>
                                          <div class="mt-1">
                                            <span class="badge bg-success small">{{ resource.file_size_formatted }}</span>
                                            <span class="badge bg-secondary small">{{ resource.download_count }} скачиваний</span>
                                          </div>
                                        </div>
                                        <div class="dropdown">
                                          <button class="btn btn-sm btn-outline-secondary" data-bs-toggle="dropdown">
                                            <MoreVertical :size="12" />
                                          </button>
                                          <ul class="dropdown-menu">
                                            <li>
                                              <a class="dropdown-item" href="#" @click.prevent="$emit('editResource', resource)">
                                                <Edit :size="12" class="me-2" />
                                                Редактировать
                                              </a>
                                            </li>
                                            <li>
                                              <a class="dropdown-item" href="#" @click.prevent="downloadResource(resource)">
                                                <Download :size="12" class="me-2" />
                                                Скачать
                                              </a>
                                            </li>
                                            <li><hr class="dropdown-divider"></li>
                                            <li>
                                              <a class="dropdown-item text-danger" href="#" @click.prevent="$emit('deleteResource', resource)">
                                                <Trash2 :size="12" class="me-2" />
                                                Удалить
                                              </a>
                                            </li>
                                          </ul>
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
                      </draggable>
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
                </template>
              </draggable>
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
  FileCheck, ClipboardList, Eye, GripVertical, Upload, Download,
  HelpCircle
} from 'lucide-vue-next'
import draggable from 'vuedraggable'
import CourseImagePlaceholder from '../../components/CourseImagePlaceholder.vue'
import { apiClient } from '@/js/api/manager'
import { endpoints } from '@/js/api/endpoints'
import { computed } from 'vue'

const props = defineProps({
  loading: Boolean,
  groupedData: Array,
  expandedThemes: Set,
  expandedCourses: Set,
  expandedLessons: Set,
  forums: Array,
  tests: Array,
  assignments: Array,
  resources: Array
})

const emit = defineEmits([
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
  'editTest',
  'deleteTest',
  'duplicateTest',
  'openQuestionManagement',
  'createAssignment',
  'editAssignment',
  'deleteAssignment',
  'createResource',
  'editResource',
  'deleteResource',
  'createForum',
  'editForum',
  'deleteForum',
  'toggleTheme',
  'toggleCourse',
  'toggleLesson',
  'reorderThemes',
  'reorderLessons',
  'reorderTests',
  'reorderAssignments'
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

function getTestTypeLabel(type) {
  const testTypes = {
    'C': 'Закрытые вопросы',
    'O': 'Открытые вопросы',
    'G': 'Игровой формат'
  }
  return testTypes[type] || 'Неизвестный тип'
}

function getPluralForm(count, singular, few, many) {
  const lastDigit = count % 10
  const lastTwoDigits = count % 100
  
  if (lastTwoDigits >= 11 && lastTwoDigits <= 14) {
    return many
  }
  
  if (lastDigit === 1) {
    return singular
  }
  
  if (lastDigit >= 2 && lastDigit <= 4) {
    return few
  }
  
  return many
}

function isThemeExpanded(themeId) {
  return props.expandedThemes?.has(themeId)
}

function isCourseExpanded(courseId) {
  return props.expandedCourses?.has(courseId)
}

function isLessonExpanded(lessonId) {
  return props.expandedLessons?.has(lessonId)
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

async function onThemeChange(evt, courseId) {
  console.log('🔄 Событие изменения порядка тем:', evt)
  
  // Обрабатываем только событие moved (когда элемент перемещен)
  if (!evt.moved) {
    return
  }

  console.log('🔄 Изменение порядка тем:', { 
    courseId, 
    oldIndex: evt.moved.oldIndex, 
    newIndex: evt.moved.newIndex 
  })

  // Получаем курс из groupedData
  const courseGroup = props.groupedData.find(group => group.course.id === courseId)
  if (!courseGroup) {
    console.error('Курс не найден:', courseId)
    return
  }

  // Собираем новый порядок ID тем
  const themeIds = courseGroup.themes.map(theme => theme.id)
  
  console.log('📋 Новый порядок тем:', themeIds)

      try {
      // Отправляем запрос на сервер
      const response = await apiClient.post(endpoints.lms.reorderThemes, {
        subject_id: courseId,
        theme_ids: themeIds
      })

      console.log('✅ Порядок тем успешно обновлен на сервере:', response.data)
      
      // Уведомляем родительский компонент об успешном изменении - он обновит исходные данные
      emit('reorderThemes', { courseId, themeIds, success: true })
      
    } catch (error) {
    console.error('❌ Ошибка при сохранении порядка тем:', error)
    
    // В случае ошибки возвращаем старый порядок
    // Уведомляем родителя, чтобы он обновил данные
    emit('reorderThemes', { courseId, error: true })
    
    // Показываем уведомление об ошибке
    console.error('Не удалось сохранить новый порядок тем. Попробуйте еще раз.')
  }
}

async function onLessonChange(evt, themeId) {
  console.log('🔄 Событие изменения порядка уроков:', evt)
  
  // Обрабатываем только событие moved (когда элемент перемещен)
  if (!evt.moved) {
    return
  }

  console.log('🔄 Изменение порядка уроков:', { 
    themeId, 
    oldIndex: evt.moved.oldIndex, 
    newIndex: evt.moved.newIndex 
  })

  // Находим тему в groupedData
  let theme = null
  for (const courseGroup of props.groupedData) {
    const foundTheme = courseGroup.themes.find(t => t.id === themeId)
    if (foundTheme) {
      theme = foundTheme
      break
    }
  }

  if (!theme) {
    console.error('Тема не найдена:', themeId)
    return
  }

  // Собираем новый порядок ID уроков
  const lessonIds = theme.lessons.map(lesson => lesson.id)
  
  console.log('📋 Новый порядок уроков:', lessonIds)

  try {
    // Отправляем запрос на сервер для изменения порядка уроков
    const response = await apiClient.post(endpoints.lms.reorderLessons(themeId), {
      lesson_ids: lessonIds
    })

    console.log('✅ Порядок уроков успешно обновлен на сервере:', response.data)
    
    // Уведомляем родительский компонент об успешном изменении
    emit('reorderLessons', { themeId, lessonIds, success: true })
    
  } catch (error) {
    console.error('❌ Ошибка при сохранении порядка уроков:', error)
    
    // В случае ошибки возвращаем старый порядок
    // Уведомляем родителя, чтобы он обновил данные
    emit('reorderLessons', { themeId, error: true })
    
    // Показываем уведомление об ошибке
    console.error('Не удалось сохранить новый порядок уроков. Попробуйте еще раз.')
  }
}

// Методы для получения контента урока
function getLessonTests(lessonId) {
  return props.tests?.filter(test => {
    let testLessonId = test.lesson
    if (typeof testLessonId === 'object' && testLessonId?.id) {
      testLessonId = testLessonId.id
    }
    return parseInt(testLessonId) === parseInt(lessonId)
  }) || []
}

function getLessonAssignments(lessonId) {
  return props.assignments?.filter(assignment => {
    let assignmentLessonId = assignment.lesson
    if (typeof assignmentLessonId === 'object' && assignmentLessonId?.id) {
      assignmentLessonId = assignmentLessonId.id
    }
    return parseInt(assignmentLessonId) === parseInt(lessonId)
  }) || []
}

function getLessonResources(lessonId) {
  return props.resources?.filter(resource => {
    let resourceLessonId = resource.lesson
    if (typeof resourceLessonId === 'object' && resourceLessonId?.id) {
      resourceLessonId = resourceLessonId.id
    }
    return parseInt(resourceLessonId) === parseInt(lessonId)
  }) || []
}

// Форматирование даты
function formatDate(dateString) {
  if (!dateString) return ''
  try {
    const date = new Date(dateString)
    return date.toLocaleDateString('ru-RU', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    })
  } catch (error) {
    return dateString
  }
}

// Скачивание ресурса
async function downloadResource(resource) {
  try {
    window.open(`/api/lms/resources/${resource.id}/download/`, '_blank')
  } catch (error) {
    console.error('Ошибка при скачивании ресурса:', error)
  }
}

// Проверка возможности начала перетаскивания темы
function onThemeStart(evt) {
  const themeElement = evt.item
  const themeId = parseInt(themeElement.dataset.themeId)
  
  // Запрещаем перетаскивание если тема раскрыта
  if (isThemeExpanded(themeId)) {
    console.log('Запрещено перетаскивание раскрытой темы:', themeId)
    return false
  }
  
  return true
}

// Проверка возможности начала перетаскивания урока
function onLessonStart(evt) {
  const lessonElement = evt.item
  const lessonId = parseInt(lessonElement.dataset.lessonId)
  
  // Запрещаем перетаскивание если урок раскрыт
  if (isLessonExpanded(lessonId)) {
    console.log('Запрещено перетаскивание раскрытого урока:', lessonId)
    return false
  }
  
  return true
}



// Обработка окончания перетаскивания тестов
async function onTestEnd(evt, lessonId) {
  console.log('🔄 Событие окончания перетаскивания тестов:', evt)
  
  // Проверяем, произошло ли реальное перемещение
  if (evt.oldIndex === evt.newIndex) {
    console.log('🔄 Элемент не был перемещен')
    return
  }

  console.log('🔄 Тест перемещен в уроке:', { 
    lessonId, 
    oldIndex: evt.oldIndex, 
    newIndex: evt.newIndex 
  })

  // Получаем актуальный список тестов урока в новом порядке
  const lessonTests = getLessonTests(lessonId)
  
  // Создаем новый массив с правильным порядком
  const reorderedTests = [...lessonTests]
  const [movedTest] = reorderedTests.splice(evt.oldIndex, 1)
  reorderedTests.splice(evt.newIndex, 0, movedTest)
  
  const testIds = reorderedTests.map(test => test.id)
  
  console.log('📋 Новый порядок тестов:', testIds)

  try {
    // Отправляем запрос на сервер для изменения порядка тестов
    const response = await apiClient.post('lms/api/tests/reorder_tests/', {
      test_ids: testIds,
      context: { lesson_id: lessonId }
    })

    console.log('✅ Порядок тестов успешно обновлен на сервере:', response.data)
    
    // Уведомляем родительский компонент об успешном изменении
    emit('reorderTests', { lessonId, testIds, success: true })
    
  } catch (error) {
    console.error('❌ Ошибка при сохранении порядка тестов:', error)
    
    // В случае ошибки уведомляем родителя
    emit('reorderTests', { lessonId, error: true })
    
    // Показываем уведомление об ошибке
    console.error('Не удалось сохранить новый порядок тестов. Попробуйте еще раз.')
  }
}

// Обработка окончания перетаскивания заданий
async function onAssignmentEnd(evt, lessonId) {
  console.log('🔄 Событие окончания перетаскивания заданий:', evt)
  
  // Проверяем, произошло ли реальное перемещение
  if (evt.oldIndex === evt.newIndex) {
    console.log('🔄 Элемент не был перемещен')
    return
  }

  console.log('🔄 Задание перемещено в уроке:', { 
    lessonId, 
    oldIndex: evt.oldIndex, 
    newIndex: evt.newIndex 
  })

  // Получаем актуальный список заданий урока в новом порядке
  const lessonAssignments = getLessonAssignments(lessonId)
  
  // Создаем новый массив с правильным порядком
  const reorderedAssignments = [...lessonAssignments]
  const [movedAssignment] = reorderedAssignments.splice(evt.oldIndex, 1)
  reorderedAssignments.splice(evt.newIndex, 0, movedAssignment)
  
  const assignmentIds = reorderedAssignments.map(assignment => assignment.id)
  
  console.log('📋 Новый порядок заданий:', assignmentIds)

  try {
    // Отправляем запрос на сервер для изменения порядка заданий
    const response = await apiClient.post('lms/api/assignments/reorder_assignments/', {
      assignment_ids: assignmentIds,
      context: { lesson_id: lessonId }
    })

    console.log('✅ Порядок заданий успешно обновлен на сервере:', response.data)
    
    // Уведомляем родительский компонент об успешном изменении
    emit('reorderAssignments', { lessonId, assignmentIds, success: true })
    
  } catch (error) {
    console.error('❌ Ошибка при сохранении порядка заданий:', error)
    
    // В случае ошибки уведомляем родителя
    emit('reorderAssignments', { lessonId, error: true })
    
    // Показываем уведомление об ошибке
    console.error('Не удалось сохранить новый порядок заданий. Попробуйте еще раз.')
  }
}

// Проверка возможности начала перетаскивания теста
function onTestStart(evt) {
  console.log('🔄 Начало перетаскивания теста')
  return true
}

// Проверка возможности начала перетаскивания задания
function onAssignmentStart(evt) {
  console.log('🔄 Начало перетаскивания задания')
  return true
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
  border: 1px solid #e0e0e0;
  background: #fff;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.12);
}

.lesson-card:hover {
  box-shadow: 0 12px 30px rgba(0, 0, 0, 0.18);
  transform: translateY(-4px);
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

/* Drag and Drop стили */
.theme-sortable {
  min-height: 20px;
}

.theme-draggable-item {
  cursor: move;
  transition: all 0.15s ease-out;
  will-change: transform;
}

.theme-draggable-item:hover {
  background-color: rgba(13, 110, 253, 0.05);
}

.theme-draggable-item .accordion-header .accordion-button {
  position: relative;
}

.theme-drag-handle {
  cursor: grab;
  transition: all 0.15s ease-out;
  will-change: transform, color;
}

.theme-drag-handle:hover {
  transform: scale(1.1);
}

.theme-drag-handle:active {
  cursor: grabbing;
}

.theme-draggable-item:hover .theme-drag-handle {
  color: #0d6efd !important;
}

/* Drag and Drop стили для уроков */
.lesson-sortable {
  min-height: 20px;
}

.lesson-draggable-item {
  cursor: move;
  transition: all 0.12s ease-out;
  position: relative;
  will-change: transform;
}

.lesson-draggable-item:hover {
  background-color: rgba(25, 135, 84, 0.05);
  border-radius: 0.375rem;
}

.lesson-draggable-item .lesson-card {
  transition: all 0.12s ease-out;
  will-change: transform, box-shadow;
}

.lesson-draggable-item .lesson-card .card-header .accordion-button {
  position: relative;
}

.lesson-drag-handle {
  cursor: grab;
  transition: all 0.12s ease-out;
  padding: 0.25rem;
  border-radius: 0.25rem;
  will-change: transform, color, background-color;
}

.lesson-drag-handle:hover {
  transform: scale(1.1);
  background-color: rgba(25, 135, 84, 0.1);
}

.lesson-drag-handle:active {
  cursor: grabbing;
}

.lesson-draggable-item:hover .lesson-drag-handle {
  color: #198754 !important;
}

/* Дополнительные стили для плавности drag and drop уроков */
.lesson-sortable .sortable-ghost {
  opacity: 0.4;
  background-color: rgba(25, 135, 84, 0.1) !important;
  border: 2px dashed #198754 !important;
  border-radius: 0.375rem;
  transition: none !important;
}

.lesson-sortable .sortable-chosen {
  transform: scale(1.02) !important;
  box-shadow: 0 8px 25px rgba(25, 135, 84, 0.25) !important;
  z-index: 1000 !important;
  border-radius: 0.375rem;
  transition: none !important;
}

.lesson-sortable .sortable-drag {
  transform: rotate(1deg) scale(1.01) !important;
  opacity: 0.95 !important;
  transition: none !important;
}

/* Drag and Drop стили для тестов */
.test-sortable {
  min-height: 20px;
}

.test-draggable-item {
  cursor: move;
  transition: all 0.12s ease-out;
  position: relative;
  will-change: transform;
}

.test-draggable-item:hover {
  background-color: rgba(13, 202, 240, 0.05);
  border-radius: 0.375rem;
}

.test-drag-handle {
  cursor: grab;
  transition: all 0.12s ease-out;
  padding: 0.25rem;
  border-radius: 0.25rem;
  will-change: transform, color, background-color;
}

.test-drag-handle:hover {
  transform: scale(1.1);
  background-color: rgba(13, 202, 240, 0.1);
  color: #0dcaf0 !important;
}

.test-drag-handle:active {
  cursor: grabbing;
}

.test-sortable .sortable-ghost {
  opacity: 0.4;
  background-color: rgba(13, 202, 240, 0.1) !important;
  border: 2px dashed #0dcaf0 !important;
  border-radius: 0.375rem;
  transition: none !important;
}

.test-sortable .sortable-chosen {
  transform: scale(1.02) !important;
  box-shadow: 0 8px 25px rgba(13, 202, 240, 0.25) !important;
  z-index: 1000 !important;
  border-radius: 0.375rem;
  transition: none !important;
}

.test-sortable .sortable-drag {
  transform: rotate(1deg) scale(1.01) !important;
  opacity: 0.95 !important;
  transition: none !important;
}

/* Drag and Drop стили для заданий */
.assignment-sortable {
  min-height: 20px;
}

.assignment-draggable-item {
  cursor: move;
  transition: all 0.12s ease-out;
  position: relative;
  will-change: transform;
}

.assignment-draggable-item:hover {
  background-color: rgba(255, 193, 7, 0.05);
  border-radius: 0.375rem;
}

.assignment-drag-handle {
  cursor: grab;
  transition: all 0.12s ease-out;
  padding: 0.25rem;
  border-radius: 0.25rem;
  will-change: transform, color, background-color;
}

.assignment-drag-handle:hover {
  transform: scale(1.1);
  background-color: rgba(255, 193, 7, 0.1);
  color: #ffc107 !important;
}

.assignment-drag-handle:active {
  cursor: grabbing;
}

.assignment-sortable .sortable-ghost {
  opacity: 0.4;
  background-color: rgba(255, 193, 7, 0.1) !important;
  border: 2px dashed #ffc107 !important;
  border-radius: 0.375rem;
  transition: none !important;
}

.assignment-sortable .sortable-chosen {
  transform: scale(1.02) !important;
  box-shadow: 0 8px 25px rgba(255, 193, 7, 0.25) !important;
  z-index: 1000 !important;
  border-radius: 0.375rem;
  transition: none !important;
}

.assignment-sortable .sortable-drag {
  transform: rotate(1deg) scale(1.01) !important;
  opacity: 0.95 !important;
  transition: none !important;
}

/* Стили для состояния перетаскивания тем */
.theme-sortable .sortable-ghost {
  opacity: 0.4;
  background-color: rgba(13, 110, 253, 0.1) !important;
  border: 2px dashed #0d6efd !important;
  border-radius: 0.375rem;
  transition: none !important;
}

.theme-sortable .sortable-chosen {
  transform: scale(1.01) !important;
  box-shadow: 0 6px 20px rgba(13, 110, 253, 0.2) !important;
  z-index: 1000 !important;
  transition: none !important;
}

.theme-sortable .sortable-drag {
  transform: rotate(1deg) scale(1.005) !important;
  opacity: 0.95 !important;
  transition: none !important;
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

/* Стили для аккордеонов курсов */
.course-group .card-header .accordion-button {
  background-color: #f8f9fa;
  border: none;
  font-weight: 500;
  padding: 1rem 1.25rem;
  margin-bottom: 0.75rem;
}

.course-group .card-header .accordion-button:not(.collapsed) {
  background-color: rgba(var(--bs-primary-rgb), 0.08);
  color: var(--bs-primary);
}

.course-group .card-header .accordion-button:focus {
  box-shadow: none;
  border-color: transparent;
}

.course-group .card-body {
  padding-top: 1.5rem !important;
  background-color: #fafbfc;
  border-top: 2px solid #e9ecef;
}

/* Стили для аккордеонов уроков */
.lesson-card .card-header .accordion-button {
  background-color: #fff;
  border: none;
  font-weight: 500;
  padding: 0.75rem 1rem;
}

.lesson-card .card-header .accordion-button:not(.collapsed) {
  background-color: rgba(var(--bs-success-rgb), 0.08);
  color: var(--bs-success);
}

.lesson-card .card-header .accordion-button:focus {
  box-shadow: none;
  border-color: transparent;
}

.accordion-body {
  padding: 1rem 1.25rem;
  background-color: #fff;
  overflow: visible;
}

/* Стили для карточек тестов, заданий и ресурсов */
.card.border-info {
  border-left: 4px solid #0dcaf0 !important;
  transition: all 0.2s ease;
  border-top: 1px solid #e9ecef;
  border-right: 1px solid #e9ecef;
  border-bottom: 1px solid #e9ecef;
}

.card.border-info:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(13, 202, 240, 0.15);
}

.card.border-warning {
  border-left: 4px solid #ffc107 !important;
  transition: all 0.2s ease;
  border-top: 1px solid #e9ecef;
  border-right: 1px solid #e9ecef;
  border-bottom: 1px solid #e9ecef;
}

.card.border-warning:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(255, 193, 7, 0.15);
}

.card.border-success {
  border-left: 4px solid #198754 !important;
  transition: all 0.2s ease;
  border-top: 1px solid #e9ecef;
  border-right: 1px solid #e9ecef;
  border-bottom: 1px solid #e9ecef;
}

.card.border-success:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(25, 135, 84, 0.15);
}

/* Стили для заголовков разделов в уроке */
.lesson-card .card-body h6 {
  color: #495057;
  font-weight: 600;
  border-bottom: 2px solid #e9ecef;
  padding-bottom: 8px;
  margin-bottom: 15px;
}

/* Стили для пустых состояний */
.bg-light.rounded {
  background-color: #f8f9fa !important;
  border: 2px dashed #dee2e6;
  padding: 20px;
  margin: 10px 0;
  transition: all 0.2s ease;
}

.bg-light.rounded:hover {
  background-color: #e9ecef !important;
  border-color: #6c757d;
}

/* Улучшение отступов для содержимого урока */
.lesson-card .card-body > div:not(:last-child) {
  margin-bottom: 25px;
  padding-bottom: 15px;
  border-bottom: 1px solid #f1f3f4;
}

/* Стили для значков в карточках */
.badge.small {
  font-size: 0.65em;
  padding: 0.25em 0.5em;
  font-weight: 500;
}

/* Анимация для dropdown меню */
.dropdown-menu {
  animation: fadeIn 0.15s ease-in-out;
  border: 1px solid rgba(0, 0, 0, 0.125);
  box-shadow: 0 0.5rem 1rem rgba(0, 0, 0, 0.15);
}

@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(-10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

/* Стили для кнопок в header урока */
.lesson-card .card-header .btn-group .btn {
  font-size: 0.8rem;
  padding: 0.375rem 0.5rem;
}

/* Стили для стрелочек accordion-button */
.accordion-button::after {
  flex-shrink: 0;
  width: 1.25rem;
  height: 1.25rem;
  margin-left: auto;
  content: "";
  background-image: url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 16 16' fill='%23000'%3e%3cpath fill-rule='evenodd' d='M1.646 4.646a.5.5 0 0 1 .708 0L8 10.293l5.646-5.647a.5.5 0 0 1 .708.708l-6 6a.5.5 0 0 1-.708 0l-6-6a.5.5 0 0 1 0-.708z'/%3e%3c/svg%3e");
  background-repeat: no-repeat;
  background-size: 1.25rem;
  transition: transform 0.2s ease-in-out;
}

.accordion-button:not(.collapsed)::after {
  background-image: url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 16 16' fill='%23000'%3e%3cpath fill-rule='evenodd' d='M1.646 4.646a.5.5 0 0 1 .708 0L8 10.293l5.646-5.647a.5.5 0 0 1 .708.708l-6 6a.5.5 0 0 1-.708 0l-6-6a.5.5 0 0 1 0-.708z'/%3e%3c/svg%3e");
  transform: rotate(-180deg);
}

.accordion-button:focus {
  z-index: 3;
  border-color: #86b7fe;
  outline: 0;
  box-shadow: 0 0 0 0.25rem rgba(13, 110, 253, 0.25);
}

.accordion-button:not(.collapsed) {
  color: #0c63e4;
  background-color: #e7f1ff;
  box-shadow: inset 0 -1px 0 rgba(0, 0, 0, 0.125);
}

/* Стили для отключенного drag & drop */
.theme-drag-handle.disabled,
.lesson-drag-handle.disabled {
  opacity: 0.3 !important;
  cursor: not-allowed !important;
  pointer-events: none !important;
  background-color: transparent !important;
}

.theme-drag-handle.disabled:hover,
.lesson-drag-handle.disabled:hover {
  color: #6c757d !important;
  cursor: not-allowed !important;
  transform: none !important;
  background-color: transparent !important;
}

/* Адаптивность для мобильных устройств */
@media (max-width: 768px) {
  .lesson-card .card-header .btn-group {
    flex-direction: column;
    width: 100%;
  }
  
  .lesson-card .card-header .btn-group .btn {
    margin-bottom: 0.25rem;
    border-radius: 0.375rem !important;
  }
}
</style> 