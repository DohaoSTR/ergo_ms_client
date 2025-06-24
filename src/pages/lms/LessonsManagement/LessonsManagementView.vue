<template>
  <div class="lessons-management-view">
    <RoleGuard 
      :roles="['teacher', 'admin']"
      fallback-message="Доступ к управлению уроками имеют только преподаватели и администраторы"
    >
      <div class="row mb-4">
        <div class="col-12">
          <div>
            <h3 class="mb-1">Управление учебными материалами</h3>
            <p class="text-muted mb-0">Создавайте, редактируйте и организуйте курсы, темы, уроки, тесты, задания и форумы</p>
          </div>
        </div>
      </div>

      <!-- Фильтры -->
      <div class="row mb-4">
        <div class="col-lg-3">
          <label class="form-label">Выберите курс</label>
          <select v-model="selectedCourseId" @change="onCourseChange" class="form-select">
            <option value="">Все курсы</option>
            <option v-for="course in courses" :key="course.id" :value="course.id">
              {{ course.name }}
            </option>
          </select>
        </div>
        <div class="col-lg-3">
          <label class="form-label">Поиск</label>
          <div class="input-group">
            <span class="input-group-text">
              <Search :size="16" />
            </span>
            <input
              v-model="searchQuery"
              type="text"
              class="form-control"
              placeholder="Поиск по названию..."
            />
          </div>
        </div>
        <div class="col-lg-3">
          <label class="form-label">Категория</label>
          <select v-model="selectedCategory" class="form-select">
            <option value="">Все категории</option>
            <option v-for="category in categories" :key="category.id" :value="category.id">
              {{ category.name }}
            </option>
          </select>
        </div>
        <div class="col-lg-3">
          <label class="form-label">Формат</label>
          <select v-model="selectedFormat" class="form-select">
            <option value="">Все форматы</option>
            <option v-for="format in courseFormats" :key="format.id" :value="format.id">
              {{ format.name }}
            </option>
          </select>
        </div>
      </div>

      <!-- Сортировка -->
      <div class="row mb-4">
        <div class="col-lg-4">
          <label class="form-label">Сортировать по</label>
          <select v-model="sortBy" class="form-select">
            <option value="name">Названию</option>
            <option value="category">Категории</option>
            <option value="format">Формату</option>
          </select>
        </div>
        <div class="col-lg-4">
          <label class="form-label">Порядок</label>
          <select v-model="sortOrder" class="form-select">
            <option value="asc">По возрастанию</option>
            <option value="desc">По убыванию</option>
          </select>
        </div>
        <div class="col-lg-4">
          <label class="form-label">Статус</label>
          <select v-model="selectedStatus" class="form-select">
            <option value="">Все</option>
            <option value="visible">Видимые</option>
            <option value="hidden">Скрытые</option>
            <option value="required">Обязательные</option>
          </select>
        </div>
      </div>

      <!-- Статистика -->
      <div class="row mb-4 stats-container">
        <div class="col-md-3">
          <div class="card text-center stats-card">
            <div class="card-body">
              <h4 class="text-primary mb-0">{{ stats.totalCourses }}</h4>
              <small class="text-muted">Курсов</small>
            </div>
          </div>
        </div>
        <div class="col-md-3">
          <div class="card text-center stats-card">
            <div class="card-body">
              <h4 class="text-success mb-0">{{ stats.totalThemes }}</h4>
              <small class="text-muted">Тем</small>
            </div>
          </div>
        </div>
        <div class="col-md-3">
          <div class="card text-center stats-card">
            <div class="card-body">
              <h4 class="text-info mb-0">{{ stats.totalLessons }}</h4>
              <small class="text-muted">Уроков</small>
            </div>
          </div>
        </div>
        <div class="col-md-3">
          <div class="card text-center stats-card">
            <div class="card-body">
              <h4 class="text-warning mb-0">{{ stats.visibleLessons }}</h4>
              <small class="text-muted">Видимых</small>
            </div>
          </div>
        </div>
      </div>

      <!-- Загрузка -->
      <div v-if="loading" class="text-center py-5">
        <div class="spinner-border"></div>
        <p class="mt-2">Загрузка уроков...</p>
      </div>

      <!-- Курсы и темы -->
      <div v-else-if="groupedData.length === 0" class="text-center py-5">
        <BookOpen :size="48" class="text-muted mb-3" />
        <h5 class="text-muted">Курсы не найдены</h5>
        <p class="text-muted">Создайте первый курс и добавьте в него темы и уроки</p>
        <button @click="createCourse" class="btn btn-primary">
          <Plus :size="18" class="me-2" />
          Создать первый курс
        </button>
      </div>

      <!-- Структура курсов -->
      <div v-else>
        <div class="d-flex justify-content-between align-items-center mb-4">
          <h4 class="mb-0">Курсы</h4>
          <button @click="createCourse" class="btn btn-outline-primary">
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
                  <div v-if="courseGroup.course.image" class="course-image">
                    <img 
                      :src="courseGroup.course.image" 
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
                  <button @click="editCourse(courseGroup.course)" class="btn btn-sm btn-outline-primary">
                    <Edit :size="16" />
                  </button>
                  <button @click="createTheme(courseGroup.course)" class="btn btn-sm btn-outline-success">
                    <Plus :size="16" />
                    Тема
                  </button>
                  <button @click="createForum(courseGroup.course)" class="btn btn-sm btn-outline-secondary">
                    <MessageSquare :size="16" />
                    Форум
                  </button>
                  <button @click="deleteCourse(courseGroup.course)" class="btn btn-sm btn-outline-danger">
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
                <button @click="createTheme(courseGroup.course)" class="btn btn-sm btn-primary">
                  Создать первую тему
                </button>
              </div>

              <div v-else class="accordion" :id="`course-accordion-${courseGroup.course.id}`">
                <div v-for="(theme, themeIndex) in courseGroup.themes" :key="theme.id" class="accordion-item">
                  <h2 class="accordion-header">
                    <button 
                      class="accordion-button"
                      :class="{ collapsed: !isThemeExpanded(theme.id) }"
                      type="button" 
                      @click="toggleTheme(theme.id)"
                    >
                      <div class="d-flex justify-content-between align-items-center w-100 me-3">
                        <div class="d-flex align-items-center gap-3">
                          <FolderOpen :size="18" />
                          <span class="fw-semibold">{{ theme.name }}</span>
                          <span class="badge bg-primary">{{ theme.lessons.length }} уроков</span>
                          <span v-if="!theme.is_visible" class="badge bg-secondary">Скрыта</span>
                        </div>
                        <div class="btn-group" @click.stop>
                          <button @click.stop="editTheme(theme)" class="btn btn-sm btn-outline-primary">
                            <Edit :size="14" />
                          </button>
                          <button @click.stop="createLesson(theme)" class="btn btn-sm btn-outline-success">
                            <Plus :size="14" />
                            Урок
                          </button>
                          <button @click.stop="deleteTheme(theme)" class="btn btn-sm btn-outline-danger">
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
                          <button @click.stop="createLesson(theme)" class="btn btn-sm btn-primary">
                            <Plus :size="14" />
                            Урок
                          </button>
                          <button @click.stop="createTest(theme)" class="btn btn-sm btn-info">
                            <FileCheck :size="14" />
                            Тест
                          </button>
                          <button @click.stop="createAssignment(theme)" class="btn btn-sm btn-warning">
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
                                      <a class="dropdown-item" href="#" @click.prevent="editLesson(lesson)">
                                        <Edit :size="14" class="me-2" />
                                        Редактировать
                                      </a>
                                    </li>
                                    <li>
                                      <a class="dropdown-item" href="#" @click.prevent="duplicateLesson(lesson)">
                                        <Copy :size="14" class="me-2" />
                                        Дублировать
                                      </a>
                                    </li>
                                    <li>
                                      <a class="dropdown-item" href="#" @click.prevent="toggleLessonVisibility(lesson)">
                                        <component :is="lesson.is_visible ? 'EyeOff' : 'Eye'" :size="14" class="me-2" />
                                        {{ lesson.is_visible ? 'Скрыть' : 'Показать' }}
                                      </a>
                                    </li>
                                    <li><hr class="dropdown-divider"></li>
                                    <li>
                                      <a class="dropdown-item text-danger" href="#" @click.prevent="deleteLesson(lesson)">
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
                                <button @click.stop="editLesson(lesson)" class="btn btn-sm btn-outline-primary">
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
                          <button @click.stop="createForum(courseGroup.course)" class="btn btn-sm btn-secondary me-2">
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
                                        <a class="dropdown-item" href="#" @click.prevent="editForum(forum)">
                                          <Edit :size="14" class="me-2" />
                                          Редактировать
                                        </a>
                                      </li>
                                      <li><hr class="dropdown-divider"></li>
                                      <li>
                                        <a class="dropdown-item text-danger" href="#" @click.prevent="deleteForum(forum)">
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

    </RoleGuard>

    <!-- Модальное окно создания/редактирования курса -->
    <div v-if="showCourseModal || showEditCourseModal" class="modal fade show d-block">
      <div class="modal-dialog modal-lg">
        <div class="modal-content">
          <div class="modal-header">
            <h5 class="modal-title">{{ editingCourse ? 'Редактирование курса' : 'Создание нового курса' }}</h5>
            <button type="button" class="btn-close" @click="closeCourseModal"></button>
          </div>
          <div class="modal-body">
            <form @submit.prevent="saveCourse">
              <div class="row">
                <div class="col-md-8">
                  <div class="mb-3">
                    <label class="form-label">Название курса</label>
                    <input
                      v-model="courseForm.name"
                      type="text"
                      class="form-control"
                      :class="{ 'is-invalid': courseValidationErrors.name }"
                      placeholder="Введите название курса"
                    />
                    <div v-if="courseValidationErrors.name" class="invalid-feedback">
                      {{ courseValidationErrors.name }}
                    </div>
                  </div>
                </div>
                <div class="col-md-4">
                  <div class="mb-3">
                    <label class="form-label">Категория</label>
                    <select
                      v-model="courseForm.category"
                      class="form-select"
                      :class="{ 'is-invalid': courseValidationErrors.category }"
                    >
                      <option value="">Выберите категорию</option>
                      <option v-for="category in categories" :key="category.id" :value="category.id">
                        {{ category.name }}
                      </option>
                    </select>
                    <div v-if="courseValidationErrors.category" class="invalid-feedback">
                      {{ courseValidationErrors.category }}
                    </div>
                  </div>
                </div>
              </div>

              <div class="mb-3">
                <label class="form-label">Краткое описание</label>
                <textarea
                  v-model="courseForm.summary"
                  class="form-control"
                  :class="{ 'is-invalid': courseValidationErrors.summary }"
                  rows="2"
                  placeholder="Краткое описание курса"
                ></textarea>
                <div v-if="courseValidationErrors.summary" class="invalid-feedback">
                  {{ courseValidationErrors.summary }}
                </div>
              </div>

              <div class="mb-3">
                <label class="form-label">Полное описание</label>
                <textarea
                  v-model="courseForm.description"
                  class="form-control"
                  :class="{ 'is-invalid': courseValidationErrors.description }"
                  rows="4"
                  placeholder="Подробное описание курса"
                ></textarea>
                <div v-if="courseValidationErrors.description" class="invalid-feedback">
                  {{ courseValidationErrors.description }}
                </div>
              </div>

              <div class="row">
                <div class="col-md-6">
                  <div class="mb-3">
                    <label class="form-label">Формат курса</label>
                    <select
                      v-model="courseForm.course_format"
                      class="form-select"
                      :class="{ 'is-invalid': courseValidationErrors.course_format }"
                    >
                      <option value="">Выберите формат</option>
                      <option v-for="format in courseFormats" :key="format.id" :value="format.id">
                        {{ format.name }}
                      </option>
                    </select>
                    <div v-if="courseValidationErrors.course_format" class="invalid-feedback">
                      {{ courseValidationErrors.course_format }}
                    </div>
                  </div>
                </div>
                <div class="col-md-6">
                  <div class="mb-3">
                    <label class="form-label">Максимальное количество студентов</label>
                    <input
                      v-model="courseForm.max_enrollment"
                      type="number"
                      class="form-control"
                      :class="{ 'is-invalid': courseValidationErrors.max_enrollment }"
                      placeholder="Без ограничений"
                      min="0"
                    />
                    <div v-if="courseValidationErrors.max_enrollment" class="invalid-feedback">
                      {{ courseValidationErrors.max_enrollment }}
                    </div>
                  </div>
                </div>
              </div>

              <div class="row">
                <div class="col-md-6">
                  <div class="mb-3">
                    <label class="form-label">Дата начала</label>
                    <input
                      v-model="courseForm.start_date"
                      type="datetime-local"
                      class="form-control"
                      :class="{ 'is-invalid': courseValidationErrors.start_date }"
                    />
                    <div v-if="courseValidationErrors.start_date" class="invalid-feedback">
                      {{ courseValidationErrors.start_date }}
                    </div>
                  </div>
                </div>
                <div class="col-md-6">
                  <div class="mb-3">
                    <label class="form-label">Дата окончания</label>
                    <input
                      v-model="courseForm.end_date"
                      type="datetime-local"
                      class="form-control"
                      :class="{ 'is-invalid': courseValidationErrors.end_date }"
                    />
                    <div v-if="courseValidationErrors.end_date" class="invalid-feedback">
                      {{ courseValidationErrors.end_date }}
                    </div>
                  </div>
                </div>
              </div>

              <div class="row mb-3">
                <div class="col-md-6">
                  <div class="form-check">
                    <input
                      v-model="courseForm.is_self_enrollment"
                      class="form-check-input"
                      type="checkbox"
                      id="isSelfEnrollment"
                    />
                    <label class="form-check-label" for="isSelfEnrollment">
                      Разрешить самостоятельную запись
                    </label>
                  </div>
                </div>
                <div class="col-md-6">
                  <div class="form-check">
                    <input
                      v-model="courseForm.completion_tracking"
                      class="form-check-input"
                      type="checkbox"
                      id="completionTracking"
                    />
                    <label class="form-check-label" for="completionTracking">
                      Отслеживать выполнение
                    </label>
                  </div>
                </div>
              </div>

              <div class="row mb-3">
                <div class="col-md-6">
                  <div class="form-check">
                    <input
                      v-model="courseForm.is_published"
                      class="form-check-input"
                      type="checkbox"
                      id="isPublished"
                    />
                    <label class="form-check-label" for="isPublished">
                      Опубликовать курс
                    </label>
                  </div>
                </div>
                <div class="col-md-6">
                  <div class="form-check">
                    <input
                      v-model="courseForm.guest_access"
                      class="form-check-input"
                      type="checkbox"
                      id="guestAccess"
                    />
                    <label class="form-check-label" for="guestAccess">
                      Гостевой доступ
                    </label>
                  </div>
                </div>
              </div>

              <div class="mb-3">
                <label class="form-label">Ключ записи на курс</label>
                <input
                  v-model="courseForm.enrollment_key"
                  type="text"
                  class="form-control"
                  :class="{ 'is-invalid': courseValidationErrors.enrollment_key }"
                  placeholder="Оставьте пустым, если ключ не требуется"
                />
                <div v-if="courseValidationErrors.enrollment_key" class="invalid-feedback">
                  {{ courseValidationErrors.enrollment_key }}
                </div>
              </div>

              <div class="mb-3">
                <label class="form-label">Изображение курса</label>
                <input
                  type="file"
                  class="form-control"
                  :class="{ 'is-invalid': courseValidationErrors.image }"
                  @change="onImageChange"
                  accept="image/*"
                />
                <div v-if="courseValidationErrors.image" class="invalid-feedback">
                  {{ courseValidationErrors.image }}
                </div>
              </div>
            </form>
          </div>
          <div class="modal-footer">
            <button
              type="button"
              class="btn btn-secondary"
              @click="closeCourseModal"
              :disabled="isSubmitting"
            >
              Отмена
            </button>
            <button
              type="button"
              class="btn btn-primary"
              @click="saveCourse"
              :disabled="isSubmitting"
            >
              <span v-if="isSubmitting" class="spinner-border spinner-border-sm me-2" role="status"></span>
              {{ editingCourse ? 'Сохранить изменения' : 'Создать курс' }}
            </button>
          </div>
        </div>
      </div>
    </div>
    <div v-if="showCourseModal || showEditCourseModal" class="modal-backdrop fade show"></div>

    <!-- Модальное окно создания/редактирования урока -->
    <div class="modal fade" :class="{ 'show d-block': showLessonModal || showEditLessonModal }" tabindex="-1" v-if="showLessonModal || showEditLessonModal">
      <div class="modal-dialog modal-lg">
        <div class="modal-content">
          <div class="modal-header">
            <h5 class="modal-title d-flex align-items-center gap-2">
              <BookOpen :size="20" class="text-success" />
              {{ editingLesson ? 'Редактировать урок' : 'Создать урок' }}
            </h5>
            <button type="button" class="btn-close" @click="closeLessonModal"></button>
          </div>
          <div class="modal-body">
            <form @submit.prevent="saveLesson">
              <!-- Основная информация -->
              <h6 class="mb-3 border-bottom pb-2">Основная информация</h6>
              
              <div class="mb-3">
                <label class="form-label">Название урока *</label>
                <input 
                  v-model="lessonForm.name" 
                  type="text" 
                  class="form-control" 
                  :class="{ 'is-invalid': lessonValidationErrors.name }"
                  required
                  placeholder="Введите название урока"
                />
                <div v-if="lessonValidationErrors.name" class="invalid-feedback">
                  {{ lessonValidationErrors.name }}
                </div>
              </div>

              <div class="mb-3">
                <label class="form-label">Описание</label>
                <textarea 
                  v-model="lessonForm.description" 
                  class="form-control" 
                  :class="{ 'is-invalid': lessonValidationErrors.description }"
                  rows="3"
                  placeholder="Описание урока"
                ></textarea>
                <div v-if="lessonValidationErrors.description" class="invalid-feedback">
                  {{ lessonValidationErrors.description }}
                </div>
              </div>

              <!-- Тип урока и содержание -->
              <h6 class="mb-3 border-bottom pb-2 mt-4">Тип урока и содержание</h6>
              
              <div class="row">
                <div class="col-md-6">
                  <div class="mb-3">
                    <label class="form-label">Тип урока *</label>
                    <select 
                      v-model="lessonForm.lessontype" 
                      class="form-select"
                      :class="{ 'is-invalid': lessonValidationErrors.lessontype }"
                      required
                    >
                      <option v-for="type in lessonTypes" :key="type.value" :value="type.value">
                        {{ type.label }}
                      </option>
                    </select>
                    <div v-if="lessonValidationErrors.lessontype" class="invalid-feedback">
                      {{ lessonValidationErrors.lessontype }}
                    </div>
                  </div>
                </div>
                
                <div class="col-md-6">
                  <div class="mb-3">
                    <label class="form-label">Порядок сортировки</label>
                    <input 
                      v-model="lessonForm.sort_order" 
                      type="number" 
                      min="0"
                      class="form-control" 
                      :class="{ 'is-invalid': lessonValidationErrors.sort_order }"
                      placeholder="0"
                    />
                    <div v-if="lessonValidationErrors.sort_order" class="invalid-feedback">
                      {{ lessonValidationErrors.sort_order }}
                    </div>
                  </div>
                </div>
              </div>

              <div class="mb-3">
                <label class="form-label">Контент урока</label>
                <textarea 
                  v-model="lessonForm.content" 
                  class="form-control" 
                  :class="{ 'is-invalid': lessonValidationErrors.content }"
                  rows="6"
                  placeholder="Содержание урока (текст, ссылки, HTML)"
                ></textarea>
                <small class="text-muted">Можно использовать HTML теги для форматирования</small>
                <div v-if="lessonValidationErrors.content" class="invalid-feedback">
                  {{ lessonValidationErrors.content }}
                </div>
              </div>

              <!-- Даты доступности -->
              <h6 class="mb-3 border-bottom pb-2 mt-4">Настройки доступности</h6>
              
              <div class="row">
                <div class="col-md-6">
                  <div class="mb-3">
                    <label class="form-label">Доступен с</label>
                    <input 
                      v-model="lessonForm.availability_start" 
                      type="datetime-local" 
                      class="form-control" 
                      :class="{ 'is-invalid': lessonValidationErrors.availability_start }"
                    />
                    <div v-if="lessonValidationErrors.availability_start" class="invalid-feedback">
                      {{ lessonValidationErrors.availability_start }}
                    </div>
                  </div>
                </div>
                
                <div class="col-md-6">
                  <div class="mb-3">
                    <label class="form-label">Доступен до</label>
                    <input 
                      v-model="lessonForm.availability_end" 
                      type="datetime-local" 
                      class="form-control" 
                      :class="{ 'is-invalid': lessonValidationErrors.availability_end }"
                    />
                    <div v-if="lessonValidationErrors.availability_end" class="invalid-feedback">
                      {{ lessonValidationErrors.availability_end }}
                    </div>
                  </div>
                </div>
              </div>

              <!-- Настройки урока -->
              <h6 class="mb-3 border-bottom pb-2 mt-4">Настройки урока</h6>
              
              <div class="row">
                <div class="col-md-4">
                  <div class="form-check mb-3">
                    <input 
                      v-model="lessonForm.is_visible" 
                      class="form-check-input" 
                      type="checkbox" 
                      id="lessonVisible"
                    />
                    <label class="form-check-label" for="lessonVisible">
                      Видимый урок
                    </label>
                    <small class="d-block text-muted">Урок будет отображаться студентам</small>
                  </div>
                </div>
                
                <div class="col-md-4">
                  <div class="form-check mb-3">
                    <input 
                      v-model="lessonForm.completion_required" 
                      class="form-check-input" 
                      type="checkbox" 
                      id="lessonRequired"
                    />
                    <label class="form-check-label" for="lessonRequired">
                      Обязательный урок
                    </label>
                    <small class="d-block text-muted">Требуется для завершения курса</small>
                  </div>
                </div>
              </div>

              <!-- Курс и тема -->
              <h6 class="mb-3 border-bottom pb-2 mt-4">Привязка к курсу</h6>
              
              <div class="row">
                <div class="col-md-6">
                  <div class="mb-3">
                    <label class="form-label">Курс *</label>
                    <select 
                      v-model="lessonForm.course" 
                      class="form-select"
                      :class="{ 'is-invalid': lessonValidationErrors.course }"
                      required
                      @change="onLessonCourseChange"
                    >
                      <option value="">Выберите курс</option>
                      <option v-for="course in courses" :key="course.id" :value="course.id">
                        {{ course.name }}
                      </option>
                    </select>
                    <div v-if="lessonValidationErrors.course" class="invalid-feedback">
                      {{ lessonValidationErrors.course }}
                    </div>
                  </div>
                </div>
                
                <div class="col-md-6">
                  <div class="mb-3">
                    <label class="form-label">Тема *</label>
                    <select 
                      v-model="lessonForm.theme" 
                      class="form-select"
                      :class="{ 'is-invalid': lessonValidationErrors.theme }"
                      required
                      :disabled="!lessonForm.course"
                    >
                      <option value="">Выберите тему</option>
                      <option v-for="theme in getThemesByCourse(lessonForm.course)" :key="theme.id" :value="theme.id">
                        {{ theme.name }}
                      </option>
                    </select>
                    <div v-if="lessonValidationErrors.theme" class="invalid-feedback">
                      {{ lessonValidationErrors.theme }}
                    </div>
                  </div>
                </div>
              </div>
            </form>
          </div>
          <div class="modal-footer">
            <button type="button" class="btn btn-secondary" @click="closeLessonModal" :disabled="isSubmitting">
              Отмена
            </button>
            <button type="button" class="btn btn-success" @click="saveLesson" :disabled="isSubmitting">
              <span v-if="isSubmitting" class="spinner-border spinner-border-sm me-2"></span>
              {{ editingLesson ? 'Сохранить изменения' : 'Создать урок' }}
            </button>
          </div>
        </div>
      </div>
    </div>
    <div v-if="showLessonModal" class="modal-backdrop fade show"></div>

    <!-- Модальное окно создания темы -->
    <div class="modal fade" :class="{ 'show d-block': showThemeModal }" tabindex="-1" v-if="showThemeModal">
      <div class="modal-dialog">
        <div class="modal-content">
          <div class="modal-header">
            <h5 class="modal-title d-flex align-items-center gap-2">
              <FolderOpen :size="20" class="text-success" />
              Создать тему
            </h5>
            <button type="button" class="btn-close" @click="closeThemeModal"></button>
          </div>
          <div class="modal-body">
            <form @submit.prevent="saveTheme">
              <div class="mb-3">
                <label class="form-label">Название темы *</label>
                <input 
                  v-model="themeForm.name" 
                  type="text" 
                  class="form-control" 
                  :class="{ 'is-invalid': themeValidationErrors.name }"
                  required
                  placeholder="Введите название темы"
                />
                <div v-if="themeValidationErrors.name" class="invalid-feedback">
                  {{ themeValidationErrors.name }}
                </div>
              </div>

              <div class="mb-3">
                <label class="form-label">Курс *</label>
                <select 
                  v-model="themeForm.subject" 
                  class="form-select"
                  :class="{ 'is-invalid': themeValidationErrors.subject }"
                  required
                >
                  <option value="">Выберите курс</option>
                  <option v-for="course in courses" :key="course.id" :value="course.id">
                    {{ course.name }}
                  </option>
                </select>
                <div v-if="themeValidationErrors.subject" class="invalid-feedback">
                  {{ themeValidationErrors.subject }}
                </div>
              </div>
              
              <div class="mb-3">
                <label class="form-label">Описание</label>
                <textarea 
                  v-model="themeForm.description" 
                  class="form-control" 
                  :class="{ 'is-invalid': themeValidationErrors.description }"
                  rows="3"
                  placeholder="Описание темы"
                ></textarea>
                <div v-if="themeValidationErrors.description" class="invalid-feedback">
                  {{ themeValidationErrors.description }}
                </div>
              </div>

              <div class="mb-3">
                <label class="form-label">Порядок сортировки</label>
                <input 
                  v-model="themeForm.sort_order" 
                  type="number" 
                  class="form-control"
                  :class="{ 'is-invalid': themeValidationErrors.sort_order }"
                  placeholder="0"
                />
                <div v-if="themeValidationErrors.sort_order" class="invalid-feedback">
                  {{ themeValidationErrors.sort_order }}
                </div>
                <div class="form-text">Чем меньше число, тем выше в списке</div>
              </div>
              
              <div class="mb-3">
                <div class="form-check">
                  <input 
                    v-model="themeForm.is_visible" 
                    class="form-check-input" 
                    type="checkbox" 
                    id="themeVisible"
                  />
                  <label class="form-check-label" for="themeVisible">
                    Видимая тема
                  </label>
                </div>
              </div>

              <div class="mb-3">
                <div class="form-check">
                  <input 
                    v-model="themeForm.completion_required" 
                    class="form-check-input" 
                    type="checkbox" 
                    id="themeRequired"
                  />
                  <label class="form-check-label" for="themeRequired">
                    Обязательная для завершения
                  </label>
                </div>
              </div>
            </form>
          </div>
          <div class="modal-footer">
            <button 
              type="button" 
              class="btn btn-secondary" 
              @click="closeThemeModal"
              :disabled="isSubmitting"
            >
              Отмена
            </button>
            <button 
              type="button" 
              class="btn btn-success" 
              @click="saveTheme"
              :disabled="isSubmitting"
            >
              <span v-if="isSubmitting" class="spinner-border spinner-border-sm me-2" role="status"></span>
              {{ isSubmitting ? 'Создание...' : 'Создать тему' }}
            </button>
          </div>
        </div>
      </div>
    </div>
    <div v-if="showThemeModal" class="modal-backdrop fade show"></div>

    <!-- Модальное окно редактирования темы -->
    <div class="modal fade" :class="{ 'show d-block': showEditThemeModal }" tabindex="-1" v-if="showEditThemeModal">
      <div class="modal-dialog">
        <div class="modal-content">
          <div class="modal-header">
            <h5 class="modal-title d-flex align-items-center gap-2">
              <Edit :size="20" class="text-primary" />
              Редактировать тему
            </h5>
            <button type="button" class="btn-close" @click="closeThemeModal"></button>
          </div>
          <div class="modal-body">
            <form @submit.prevent="saveTheme">
              <div class="mb-3">
                <label class="form-label">Название темы *</label>
                <input 
                  v-model="themeForm.name" 
                  type="text" 
                  class="form-control" 
                  :class="{ 'is-invalid': themeValidationErrors.name }"
                  required
                  placeholder="Введите название темы"
                />
                <div v-if="themeValidationErrors.name" class="invalid-feedback">
                  {{ themeValidationErrors.name }}
                </div>
              </div>

              <div class="mb-3">
                <label class="form-label">Курс *</label>
                <select 
                  v-model="themeForm.subject" 
                  class="form-select"
                  :class="{ 'is-invalid': themeValidationErrors.subject }"
                  required
                >
                  <option value="">Выберите курс</option>
                  <option v-for="course in courses" :key="course.id" :value="course.id">
                    {{ course.name }}
                  </option>
                </select>
                <div v-if="themeValidationErrors.subject" class="invalid-feedback">
                  {{ themeValidationErrors.subject }}
                </div>
              </div>
              
              <div class="mb-3">
                <label class="form-label">Описание</label>
                <textarea 
                  v-model="themeForm.description" 
                  class="form-control" 
                  :class="{ 'is-invalid': themeValidationErrors.description }"
                  rows="3"
                  placeholder="Описание темы"
                ></textarea>
                <div v-if="themeValidationErrors.description" class="invalid-feedback">
                  {{ themeValidationErrors.description }}
                </div>
              </div>

              <div class="mb-3">
                <label class="form-label">Порядок сортировки</label>
                <input 
                  v-model="themeForm.sort_order" 
                  type="number" 
                  class="form-control"
                  :class="{ 'is-invalid': themeValidationErrors.sort_order }"
                  placeholder="0"
                />
                <div v-if="themeValidationErrors.sort_order" class="invalid-feedback">
                  {{ themeValidationErrors.sort_order }}
                </div>
                <div class="form-text">Чем меньше число, тем выше в списке</div>
              </div>
              
              <div class="mb-3">
                <div class="form-check">
                  <input 
                    v-model="themeForm.is_visible" 
                    class="form-check-input" 
                    type="checkbox" 
                    id="editThemeVisible"
                  />
                  <label class="form-check-label" for="editThemeVisible">
                    Видимая тема
                  </label>
                </div>
              </div>

              <div class="mb-3">
                <div class="form-check">
                  <input 
                    v-model="themeForm.completion_required" 
                    class="form-check-input" 
                    type="checkbox" 
                    id="editThemeRequired"
                  />
                  <label class="form-check-label" for="editThemeRequired">
                    Обязательная для завершения
                  </label>
                </div>
              </div>
            </form>
          </div>
          <div class="modal-footer">
            <button 
              type="button" 
              class="btn btn-secondary" 
              @click="closeThemeModal"
              :disabled="isSubmitting"
            >
              Отмена
            </button>
            <button 
              type="button" 
              class="btn btn-primary" 
              @click="saveTheme"
              :disabled="isSubmitting"
            >
              <span v-if="isSubmitting" class="spinner-border spinner-border-sm me-2" role="status"></span>
              {{ isSubmitting ? 'Сохранение...' : 'Сохранить изменения' }}
            </button>
          </div>
        </div>
      </div>
    </div>
    <div v-if="showEditThemeModal" class="modal-backdrop fade show"></div>

    <!-- Модальное окно создания урока -->
    <div class="modal fade" :class="{ 'show d-block': showLessonModal }" tabindex="-1" v-if="showLessonModal">
      <div class="modal-dialog modal-lg">
        <div class="modal-content">
          <div class="modal-header">
            <h5 class="modal-title d-flex align-items-center gap-2">
              <BookOpen :size="20" class="text-primary" />
              Создать урок
            </h5>
            <button type="button" class="btn-close" @click="closeLessonModal"></button>
          </div>
          <div class="modal-body">
            <form @submit.prevent="saveLesson">
              <div class="row">
                <div class="col-md-6">
                  <div class="mb-3">
                    <label class="form-label">Название урока *</label>
                    <input 
                      v-model="lessonForm.name" 
                      type="text" 
                      class="form-control" 
                      :class="{ 'is-invalid': lessonValidationErrors.name }"
                      required
                      placeholder="Введите название урока"
                    />
                    <div v-if="lessonValidationErrors.name" class="invalid-feedback">
                      {{ lessonValidationErrors.name }}
                    </div>
                  </div>
                </div>
                
                <div class="col-md-6">
                  <div class="mb-3">
                    <label class="form-label">Тип урока</label>
                    <select 
                      v-model="lessonForm.lessontype" 
                      class="form-select"
                      :class="{ 'is-invalid': lessonValidationErrors.lessontype }"
                    >
                      <option v-for="type in lessonTypes" :key="type.value" :value="type.value">
                        {{ type.label }}
                      </option>
                    </select>
                    <div v-if="lessonValidationErrors.lessontype" class="invalid-feedback">
                      {{ lessonValidationErrors.lessontype }}
                    </div>
                  </div>
                </div>
              </div>

              <div class="row">
                <div class="col-md-6">
                  <div class="mb-3">
                    <label class="form-label">Курс *</label>
                    <select 
                      v-model="lessonForm.course" 
                      @change="onLessonCourseChange"
                      class="form-select"
                      :class="{ 'is-invalid': lessonValidationErrors.course }"
                      required
                    >
                      <option value="">Выберите курс</option>
                      <option v-for="course in courses" :key="course.id" :value="course.id">
                        {{ course.name }}
                      </option>
                    </select>
                    <div v-if="lessonValidationErrors.course" class="invalid-feedback">
                      {{ lessonValidationErrors.course }}
                    </div>
                  </div>
                </div>
                <div class="col-md-6">
                  <div class="mb-3">
                    <label class="form-label">Тема *</label>
                    <select 
                      v-model="lessonForm.theme" 
                      class="form-select"
                      :class="{ 'is-invalid': lessonValidationErrors.theme }"
                      :disabled="!lessonForm.course"
                      required
                    >
                      <option value="">Выберите тему</option>
                      <option v-for="theme in getThemesByCourse(lessonForm.course)" :key="theme.id" :value="theme.id">
                        {{ theme.name }}
                      </option>
                    </select>
                    <div v-if="lessonValidationErrors.theme" class="invalid-feedback">
                      {{ lessonValidationErrors.theme }}
                    </div>
                  </div>
                </div>
              </div>
              
              <div class="mb-3">
                <label class="form-label">Описание</label>
                <textarea 
                  v-model="lessonForm.description" 
                  class="form-control" 
                  :class="{ 'is-invalid': lessonValidationErrors.description }"
                  rows="3"
                  placeholder="Описание урока"
                ></textarea>
                <div v-if="lessonValidationErrors.description" class="invalid-feedback">
                  {{ lessonValidationErrors.description }}
                </div>
              </div>

              <div class="row">
                <div class="col-md-4">
                  <div class="mb-3">
                    <label class="form-label">Порядок сортировки</label>
                    <input 
                      v-model="lessonForm.sort_order" 
                      type="number" 
                      class="form-control"
                      :class="{ 'is-invalid': lessonValidationErrors.sort_order }"
                      placeholder="0"
                    />
                    <div v-if="lessonValidationErrors.sort_order" class="invalid-feedback">
                      {{ lessonValidationErrors.sort_order }}
                    </div>
                  </div>
                </div>
                
                <div class="col-md-4">
                  <div class="mb-3">
                    <label class="form-label">Доступен с</label>
                    <input 
                      v-model="lessonForm.availability_start" 
                      type="datetime-local" 
                      class="form-control"
                      :class="{ 'is-invalid': lessonValidationErrors.availability_start }"
                    />
                    <div v-if="lessonValidationErrors.availability_start" class="invalid-feedback">
                      {{ lessonValidationErrors.availability_start }}
                    </div>
                  </div>
                </div>
                
                <div class="col-md-4">
                  <div class="mb-3">
                    <label class="form-label">Доступен до</label>
                    <input 
                      v-model="lessonForm.availability_end" 
                      type="datetime-local" 
                      class="form-control"
                      :class="{ 'is-invalid': lessonValidationErrors.availability_end }"
                    />
                    <div v-if="lessonValidationErrors.availability_end" class="invalid-feedback">
                      {{ lessonValidationErrors.availability_end }}
                    </div>
                  </div>
                </div>
              </div>
              
              <div class="row mb-3">
                <div class="col-md-6">
                  <div class="form-check">
                    <input 
                      v-model="lessonForm.is_visible" 
                      class="form-check-input" 
                      type="checkbox" 
                      id="lessonVisible"
                    />
                    <label class="form-check-label" for="lessonVisible">
                      Видимый урок
                    </label>
                  </div>
                </div>
                
                <div class="col-md-6">
                  <div class="form-check">
                    <input 
                      v-model="lessonForm.completion_required" 
                      class="form-check-input" 
                      type="checkbox" 
                      id="lessonRequired"
                    />
                    <label class="form-check-label" for="lessonRequired">
                      Обязательный для завершения
                    </label>
                  </div>
                </div>
              </div>

              <div class="mb-3">
                <label class="form-label">Содержание урока</label>
                <textarea 
                  v-model="lessonForm.content" 
                  class="form-control" 
                  :class="{ 'is-invalid': lessonValidationErrors.content }"
                  rows="4"
                  placeholder="Основное содержание урока"
                ></textarea>
                <div v-if="lessonValidationErrors.content" class="invalid-feedback">
                  {{ lessonValidationErrors.content }}
                </div>
              </div>
            </form>
          </div>
          <div class="modal-footer">
            <button 
              type="button" 
              class="btn btn-secondary" 
              @click="closeLessonModal"
              :disabled="isSubmitting"
            >
              Отмена
            </button>
            <button 
              type="button" 
              class="btn btn-primary" 
              @click="saveLesson"
              :disabled="isSubmitting"
            >
              <span v-if="isSubmitting" class="spinner-border spinner-border-sm me-2" role="status"></span>
              {{ isSubmitting ? 'Создание...' : 'Создать урок' }}
            </button>
          </div>
        </div>
      </div>
    </div>
    <div v-if="showLessonModal" class="modal-backdrop fade show"></div>

    <!-- Модальное окно редактирования урока -->
    <div class="modal fade" :class="{ 'show d-block': showEditLessonModal }" tabindex="-1" v-if="showEditLessonModal">
      <div class="modal-dialog modal-lg">
        <div class="modal-content">
          <div class="modal-header">
            <h5 class="modal-title d-flex align-items-center gap-2">
              <Edit :size="20" class="text-primary" />
              Редактировать урок
            </h5>
            <button type="button" class="btn-close" @click="closeLessonModal"></button>
          </div>
          <div class="modal-body">
            <form @submit.prevent="saveLesson">
              <div class="row">
                <div class="col-md-6">
                  <div class="mb-3">
                    <label class="form-label">Название урока *</label>
                    <input 
                      v-model="lessonForm.name" 
                      type="text" 
                      class="form-control" 
                      :class="{ 'is-invalid': lessonValidationErrors.name }"
                      required
                      placeholder="Введите название урока"
                    />
                    <div v-if="lessonValidationErrors.name" class="invalid-feedback">
                      {{ lessonValidationErrors.name }}
                    </div>
                  </div>
                </div>
                
                <div class="col-md-6">
                  <div class="mb-3">
                    <label class="form-label">Тип урока</label>
                    <select 
                      v-model="lessonForm.lessontype" 
                      class="form-select"
                      :class="{ 'is-invalid': lessonValidationErrors.lessontype }"
                    >
                      <option v-for="type in lessonTypes" :key="type.value" :value="type.value">
                        {{ type.label }}
                      </option>
                    </select>
                    <div v-if="lessonValidationErrors.lessontype" class="invalid-feedback">
                      {{ lessonValidationErrors.lessontype }}
                    </div>
                  </div>
                </div>
              </div>

              <div class="mb-3">
                <label class="form-label">Тема *</label>
                <select 
                  v-model="lessonForm.theme" 
                  class="form-select"
                  :class="{ 'is-invalid': lessonValidationErrors.theme }"
                  required
                >
                  <option value="">Выберите тему</option>
                  <option v-for="theme in themes" :key="theme.id" :value="theme.id">
                    {{ theme.name }} ({{ courses.find(c => c.id === theme.subject)?.name }})
                  </option>
                </select>
                <div v-if="lessonValidationErrors.theme" class="invalid-feedback">
                  {{ lessonValidationErrors.theme }}
                </div>
              </div>
              
              <div class="mb-3">
                <label class="form-label">Описание</label>
                <textarea 
                  v-model="lessonForm.description" 
                  class="form-control" 
                  :class="{ 'is-invalid': lessonValidationErrors.description }"
                  rows="3"
                  placeholder="Описание урока"
                ></textarea>
                <div v-if="lessonValidationErrors.description" class="invalid-feedback">
                  {{ lessonValidationErrors.description }}
                </div>
              </div>

              <div class="row">
                <div class="col-md-4">
                  <div class="mb-3">
                    <label class="form-label">Порядок сортировки</label>
                    <input 
                      v-model="lessonForm.sort_order" 
                      type="number" 
                      class="form-control"
                      :class="{ 'is-invalid': lessonValidationErrors.sort_order }"
                      placeholder="0"
                    />
                    <div v-if="lessonValidationErrors.sort_order" class="invalid-feedback">
                      {{ lessonValidationErrors.sort_order }}
                    </div>
                  </div>
                </div>
                
                <div class="col-md-4">
                  <div class="mb-3">
                    <label class="form-label">Доступен с</label>
                    <input 
                      v-model="lessonForm.availability_start" 
                      type="datetime-local" 
                      class="form-control"
                      :class="{ 'is-invalid': lessonValidationErrors.availability_start }"
                    />
                    <div v-if="lessonValidationErrors.availability_start" class="invalid-feedback">
                      {{ lessonValidationErrors.availability_start }}
                    </div>
                  </div>
                </div>
                
                <div class="col-md-4">
                  <div class="mb-3">
                    <label class="form-label">Доступен до</label>
                    <input 
                      v-model="lessonForm.availability_end" 
                      type="datetime-local" 
                      class="form-control"
                      :class="{ 'is-invalid': lessonValidationErrors.availability_end }"
                    />
                    <div v-if="lessonValidationErrors.availability_end" class="invalid-feedback">
                      {{ lessonValidationErrors.availability_end }}
                    </div>
                  </div>
                </div>
              </div>
              
              <div class="row mb-3">
                <div class="col-md-6">
                  <div class="form-check">
                    <input 
                      v-model="lessonForm.is_visible" 
                      class="form-check-input" 
                      type="checkbox" 
                      id="editLessonVisible"
                    />
                    <label class="form-check-label" for="editLessonVisible">
                      Видимый урок
                    </label>
                  </div>
                </div>
                
                <div class="col-md-6">
                  <div class="form-check">
                    <input 
                      v-model="lessonForm.completion_required" 
                      class="form-check-input" 
                      type="checkbox" 
                      id="editLessonRequired"
                    />
                    <label class="form-check-label" for="editLessonRequired">
                      Обязательный для завершения
                    </label>
                  </div>
                </div>
              </div>

              <div class="mb-3">
                <label class="form-label">Содержание урока</label>
                <textarea 
                  v-model="lessonForm.content" 
                  class="form-control" 
                  :class="{ 'is-invalid': lessonValidationErrors.content }"
                  rows="4"
                  placeholder="Основное содержание урока"
                ></textarea>
                <div v-if="lessonValidationErrors.content" class="invalid-feedback">
                  {{ lessonValidationErrors.content }}
                </div>
              </div>
            </form>
          </div>
          <div class="modal-footer">
            <button 
              type="button" 
              class="btn btn-secondary" 
              @click="closeLessonModal"
              :disabled="isSubmitting"
            >
              Отмена
            </button>
            <button 
              type="button" 
              class="btn btn-primary" 
              @click="saveLesson"
              :disabled="isSubmitting"
            >
              <span v-if="isSubmitting" class="spinner-border spinner-border-sm me-2" role="status"></span>
              {{ isSubmitting ? 'Сохранение...' : 'Сохранить изменения' }}
            </button>
          </div>
        </div>
      </div>
    </div>
    <div v-if="showEditLessonModal" class="modal-backdrop fade show"></div>

    <!-- Модальное окно подтверждения удаления -->
    <ConfirmDialog
      :show="showConfirmDialog"
      :title="confirmDialogData.title"
      :message="confirmDialogData.message"
      :confirmText="confirmDialogData.confirmText"
      :loading="dialogLoading"
      @confirm="handleConfirmDialog"
      @cancel="closeConfirmDialog"
      @close="closeConfirmDialog"
    />

    <!-- Модальное окно создания теста -->
    <div class="modal fade" :class="{ 'show d-block': showTestModal }" tabindex="-1" v-if="showTestModal">
      <div class="modal-dialog modal-lg">
        <div class="modal-content">
          <div class="modal-header">
            <h5 class="modal-title d-flex align-items-center gap-2">
              <FileCheck :size="20" class="text-info" />
              Создать тест
            </h5>
            <button type="button" class="btn-close" @click="closeTestModal"></button>
          </div>
          <div class="modal-body">
            <form @submit.prevent="saveTest">
              <div class="row">
                <div class="col-md-6">
                  <div class="mb-3">
                    <label class="form-label">Название теста *</label>
                    <input 
                      v-model="testForm.name" 
                      type="text" 
                      class="form-control" 
                      :class="{ 'is-invalid': testValidationErrors.name }"
                      required
                      placeholder="Введите название теста"
                    />
                    <div v-if="testValidationErrors.name" class="invalid-feedback">
                      {{ testValidationErrors.name }}
                    </div>
                  </div>
                </div>
                <div class="col-md-6">
                  <div class="mb-3">
                    <label class="form-label">Заголовок теста *</label>
                    <input 
                      v-model="testForm.title" 
                      type="text" 
                      class="form-control" 
                      :class="{ 'is-invalid': testValidationErrors.title }"
                      required
                      placeholder="Введите заголовок теста"
                    />
                    <div v-if="testValidationErrors.title" class="invalid-feedback">
                      {{ testValidationErrors.title }}
                    </div>
                  </div>
                </div>
              </div>
              
              <div class="mb-3">
                <label class="form-label">Описание</label>
                <textarea 
                  v-model="testForm.description" 
                  class="form-control" 
                  rows="3"
                  placeholder="Описание теста"
                ></textarea>
              </div>

              <div class="row">
                <div class="col-md-6">
                  <div class="mb-3">
                    <label class="form-label">Курс *</label>
                    <select 
                      v-model="testForm.course" 
                      @change="onTestCourseChange"
                      class="form-select"
                      :class="{ 'is-invalid': testValidationErrors.course }"
                      required
                    >
                      <option value="">Выберите курс</option>
                      <option v-for="course in courses" :key="course.id" :value="course.id">
                        {{ course.name }}
                      </option>
                    </select>
                    <div v-if="testValidationErrors.course" class="invalid-feedback">
                      {{ testValidationErrors.course }}
                    </div>
                  </div>
                </div>
                <div class="col-md-6">
                  <div class="mb-3">
                    <label class="form-label">Тема</label>
                    <select 
                      v-model="testForm.theme" 
                      class="form-select"
                      :disabled="!testForm.course"
                    >
                      <option value="">Выберите тему (необязательно)</option>
                      <option v-for="theme in getThemesByCourse(testForm.course)" :key="theme.id" :value="theme.id">
                        {{ theme.name }}
                      </option>
                    </select>
                    <div class="form-text">Если тема не выбрана, тест будет относиться ко всему курсу</div>
                  </div>
                </div>
              </div>

              <div class="row">
                <div class="col-md-6">
                  <div class="mb-3">
                    <label class="form-label">Тип теста</label>
                    <select v-model="testForm.type" class="form-select">
                      <option value="close">Закрытые вопросы</option>
                      <option value="open">Открытые вопросы</option>
                      <option value="game">Игровой формат</option>
                    </select>
                  </div>
                </div>
                <div class="col-md-6">
                  <div class="mb-3">
                    <label class="form-label">Длительность (мин)</label>
                    <input 
                      v-model="testForm.duration_minutes" 
                      type="number" 
                      class="form-control"
                      min="1"
                      placeholder="60"
                    />
                  </div>
                </div>
              </div>

              <div class="row">
                <div class="col-md-6">
                  <div class="mb-3">
                    <label class="form-label">Проходной балл (%)</label>
                    <input 
                      v-model="testForm.passing_score" 
                      type="number" 
                      class="form-control"
                      min="0"
                      max="100"
                      placeholder="70"
                    />
                  </div>
                </div>
                <div class="col-md-6">
                  <div class="mb-3">
                    <label class="form-label">Максимум попыток</label>
                    <input 
                      v-model="testForm.max_attempts" 
                      type="number" 
                      class="form-control"
                      min="1"
                      placeholder="1"
                    />
                  </div>
                </div>
              </div>

              <div class="row mb-3">
                <div class="col-md-6">
                  <div class="form-check">
                    <input 
                      v-model="testForm.show_correct_answers" 
                      class="form-check-input" 
                      type="checkbox" 
                      id="showCorrectAnswers"
                    />
                    <label class="form-check-label" for="showCorrectAnswers">
                      Показывать правильные ответы
                    </label>
                  </div>
                </div>
                <div class="col-md-6">
                  <div class="form-check">
                    <input 
                      v-model="testForm.randomize_questions" 
                      class="form-check-input" 
                      type="checkbox" 
                      id="randomizeQuestions"
                    />
                    <label class="form-check-label" for="randomizeQuestions">
                      Перемешивать вопросы
                    </label>
                  </div>
                </div>
              </div>
            </form>
          </div>
          <div class="modal-footer">
            <button 
              type="button" 
              class="btn btn-secondary" 
              @click="closeTestModal"
              :disabled="isSubmitting"
            >
              Отмена
            </button>
            <button 
              type="button" 
              class="btn btn-info" 
              @click="saveTest"
              :disabled="isSubmitting"
            >
              <span v-if="isSubmitting" class="spinner-border spinner-border-sm me-2" role="status"></span>
              {{ isSubmitting ? 'Создание...' : 'Создать тест' }}
            </button>
          </div>
        </div>
      </div>
    </div>
    <div v-if="showTestModal" class="modal-backdrop fade show"></div>

    <!-- Модальное окно создания задания -->
    <div class="modal fade" :class="{ 'show d-block': showAssignmentModal }" tabindex="-1" v-if="showAssignmentModal">
      <div class="modal-dialog modal-lg">
        <div class="modal-content">
          <div class="modal-header">
            <h5 class="modal-title d-flex align-items-center gap-2">
              <ClipboardList :size="20" class="text-warning" />
              Создать задание
            </h5>
            <button type="button" class="btn-close" @click="closeAssignmentModal"></button>
          </div>
          <div class="modal-body">
            <form @submit.prevent="saveAssignment">
              <div class="mb-3">
                <label class="form-label">Название задания *</label>
                <input 
                  v-model="assignmentForm.title" 
                  type="text" 
                  class="form-control" 
                  :class="{ 'is-invalid': assignmentValidationErrors.title }"
                  required
                  placeholder="Введите название задания"
                />
                <div v-if="assignmentValidationErrors.title" class="invalid-feedback">
                  {{ assignmentValidationErrors.title }}
                </div>
              </div>
              
              <div class="mb-3">
                <label class="form-label">Описание</label>
                <textarea 
                  v-model="assignmentForm.description" 
                  class="form-control" 
                  rows="4"
                  placeholder="Подробное описание задания"
                ></textarea>
              </div>

              <div class="row">
                <div class="col-md-6">
                  <div class="mb-3">
                    <label class="form-label">Курс *</label>
                    <select 
                      v-model="assignmentForm.course" 
                      @change="onAssignmentCourseChange"
                      class="form-select"
                      :class="{ 'is-invalid': assignmentValidationErrors.course }"
                      required
                    >
                      <option value="">Выберите курс</option>
                      <option v-for="course in courses" :key="course.id" :value="course.id">
                        {{ course.name }}
                      </option>
                    </select>
                    <div v-if="assignmentValidationErrors.course" class="invalid-feedback">
                      {{ assignmentValidationErrors.course }}
                    </div>
                  </div>
                </div>
                <div class="col-md-6">
                  <div class="mb-3">
                    <label class="form-label">Тема</label>
                    <select 
                      v-model="assignmentForm.theme" 
                      class="form-select"
                      :disabled="!assignmentForm.course"
                    >
                      <option value="">Выберите тему (необязательно)</option>
                      <option v-for="theme in getThemesByCourse(assignmentForm.course)" :key="theme.id" :value="theme.id">
                        {{ theme.name }}
                      </option>
                    </select>
                    <div class="form-text">Если тема не выбрана, задание будет относиться ко всему курсу</div>
                  </div>
                </div>
              </div>

              <div class="row">
                <div class="col-md-6">
                  <div class="mb-3">
                    <label class="form-label">Крайний срок</label>
                    <input 
                      v-model="assignmentForm.deadline" 
                      type="datetime-local" 
                      class="form-control"
                    />
                  </div>
                </div>
                <div class="col-md-6">
                  <div class="mb-3">
                    <label class="form-label">Максимальная оценка</label>
                    <input 
                      v-model="assignmentForm.max_grade" 
                      type="number" 
                      class="form-control"
                      min="1"
                      placeholder="100"
                    />
                  </div>
                </div>
              </div>

              <div class="row">
                <div class="col-md-6">
                  <div class="mb-3">
                    <label class="form-label">Тип подачи</label>
                    <select v-model="assignmentForm.submission_type" class="form-select">
                      <option value="file">Файл</option>
                      <option value="text">Текст</option>
                      <option value="both">Файл и текст</option>
                    </select>
                  </div>
                </div>
                <div class="col-md-6">
                  <div class="mb-3">
                    <label class="form-label">Максимальный размер файла (MB)</label>
                    <input 
                      v-model="assignmentForm.max_file_size" 
                      type="number" 
                      class="form-control"
                      min="1"
                      placeholder="10"
                    />
                  </div>
                </div>
              </div>

              <div class="mb-3">
                <div class="form-check">
                  <input 
                    v-model="assignmentForm.allow_late_submissions" 
                    class="form-check-input" 
                    type="checkbox" 
                    id="allowLateSubmissions"
                  />
                  <label class="form-check-label" for="allowLateSubmissions">
                    Разрешить поздние отправки
                  </label>
                </div>
              </div>
            </form>
          </div>
          <div class="modal-footer">
            <button 
              type="button" 
              class="btn btn-secondary" 
              @click="closeAssignmentModal"
              :disabled="isSubmitting"
            >
              Отмена
            </button>
            <button 
              type="button" 
              class="btn btn-warning" 
              @click="saveAssignment"
              :disabled="isSubmitting"
            >
              <span v-if="isSubmitting" class="spinner-border spinner-border-sm me-2" role="status"></span>
              {{ isSubmitting ? 'Создание...' : 'Создать задание' }}
            </button>
          </div>
        </div>
      </div>
    </div>
    <div v-if="showAssignmentModal" class="modal-backdrop fade show"></div>

    <!-- Модальное окно создания форума -->
    <div class="modal fade" :class="{ 'show d-block': showForumModal }" tabindex="-1" v-if="showForumModal">
      <div class="modal-dialog modal-lg">
        <div class="modal-content">
          <div class="modal-header">
            <h5 class="modal-title d-flex align-items-center gap-2">
              <MessageSquare :size="20" class="text-secondary" />
              Создать форум
            </h5>
            <button type="button" class="btn-close" @click="closeForumModal"></button>
          </div>
          <div class="modal-body">
                         <form @submit.prevent="saveForum">
              <div class="mb-3">
                <label class="form-label">Название форума *</label>
                <input 
                  v-model="forumForm.name" 
                  type="text" 
                  class="form-control" 
                  :class="{ 'is-invalid': forumValidationErrors.name }"
                  required
                  placeholder="Введите название форума"
                />
                <div v-if="forumValidationErrors.name" class="invalid-feedback">
                  {{ forumValidationErrors.name }}
                </div>
              </div>
              
              <div class="mb-3">
                <label class="form-label">Описание</label>
                <textarea 
                  v-model="forumForm.description" 
                  class="form-control" 
                  rows="3"
                  placeholder="Описание форума"
                ></textarea>
              </div>

              <div class="row">
                <div class="col-md-6">
                  <div class="mb-3">
                    <label class="form-label">Курс *</label>
                    <select 
                      v-model="forumForm.subject" 
                      class="form-select"
                      :class="{ 'is-invalid': forumValidationErrors.subject }"
                      required
                    >
                      <option value="">Выберите курс</option>
                      <option v-for="course in courses" :key="course.id" :value="course.id">
                        {{ course.name }}
                      </option>
                    </select>
                    <div v-if="forumValidationErrors.subject" class="invalid-feedback">
                      {{ forumValidationErrors.subject }}
                    </div>
                  </div>
                </div>
                <div class="col-md-6">
                  <div class="mb-3">
                    <label class="form-label">Тип форума</label>
                    <select v-model="forumForm.forum_type" class="form-select">
                      <option value="general">Общий</option>
                      <option value="q_and_a">Вопросы и ответы</option>
                      <option value="single_discussion">Одна дискуссия</option>
                    </select>
                  </div>
                </div>
              </div>

              <div class="row mb-3">
                <div class="col-md-6">
                  <div class="form-check">
                    <input 
                      v-model="forumForm.is_moderated" 
                      class="form-check-input" 
                      type="checkbox" 
                      id="isModerated"
                    />
                    <label class="form-check-label" for="isModerated">
                      Модерируемый форум
                    </label>
                  </div>
                </div>
                <div class="col-md-6">
                  <div class="form-check">
                    <input 
                      v-model="forumForm.allow_anonymous" 
                      class="form-check-input" 
                      type="checkbox" 
                      id="allowAnonymous"
                    />
                    <label class="form-check-label" for="allowAnonymous">
                      Разрешить анонимные сообщения
                    </label>
                  </div>
                </div>
              </div>
            </form>
          </div>
          <div class="modal-footer">
            <button 
              type="button" 
              class="btn btn-secondary" 
              @click="closeForumModal"
              :disabled="isSubmitting"
            >
              Отмена
            </button>
            <button 
              type="button" 
              class="btn btn-secondary" 
                             @click="saveForum"
              :disabled="isSubmitting"
            >
              <span v-if="isSubmitting" class="spinner-border spinner-border-sm me-2" role="status"></span>
              {{ isSubmitting ? 'Создание...' : 'Создать форум' }}
            </button>
          </div>
        </div>
      </div>
    </div>
    <div v-if="showForumModal" class="modal-backdrop fade show"></div>
  </div>
</template>

<script setup>
import { ref, onMounted, computed, nextTick } from 'vue'
import { 
  Plus, Search, Edit, Trash2, Copy, EyeOff, MoreVertical,
  BookOpen, FolderOpen, Hash, Video, FileText, Link, 
  MessageSquare, Calendar, Award, TestTube, ChevronDown,
  FileCheck, ClipboardList, Eye, GraduationCap
} from 'lucide-vue-next'
import { apiClient } from '@/js/api/manager'
import { endpoints } from '@/js/api/endpoints'
import RoleGuard from '../components/RoleGuard.vue'
import ConfirmDialog from '@/components/ConfirmDialog.vue'
import CourseImagePlaceholder from '../components/CourseImagePlaceholder.vue'
import { globalUserRole } from '../composables/useUserRole'
import { useConfirmDialog } from '../composables/useConfirmDialog'
import { 
  showSuccess, 
  showError, 
  showWarning,
  handleApiError,
  showValidationError,
  showSaveSuccess,
  showDeleteSuccess
} from '@/js/utils/notifications'

const courses = ref([])
const themes = ref([])
const lessons = ref([])
const forums = ref([])

const categories = ref([])
const courseFormats = ref([])
const loading = ref(true)
const selectedCourseId = ref('')
const searchQuery = ref('')
const selectedStatus = ref('')

const selectedCategory = ref('')
const selectedFormat = ref('')
const sortBy = ref('name') // Варианты: name, category, format
const sortOrder = ref('asc') // Варианты: asc, desc

const showThemeModal = ref(false)
const showLessonModal = ref(false)
const showEditThemeModal = ref(false)
const showEditLessonModal = ref(false)
const showCourseModal = ref(false)
const showEditCourseModal = ref(false)
const showTestModal = ref(false)
const showAssignmentModal = ref(false)
const showForumModal = ref(false)

const themeForm = ref({
  name: '',
  description: '',
  subject: null,
  sort_order: 0,
  is_visible: true,
  completion_required: false
})

const lessonForm = ref({
  name: '',
  description: '',
  lessontype: 'L',
  course: null,
  theme: null,
  sort_order: 0,
  is_visible: true,
  completion_required: false,
  availability_start: '',
  availability_end: '',
  content: ''
})

const courseForm = ref({
  name: '',
  description: '',
  summary: '',
  category: null,
  course_format: null,
  start_date: '',
  end_date: '',
  enrollment_key: '',
  max_enrollment: null,
  is_self_enrollment: true,
  is_published: false,
  completion_tracking: false,
  guest_access: false,
  image: null // Поле для загрузки изображения
})

const testForm = ref({
  name: '',
  title: '',
  description: '',
  course: null,
  theme: null,
  lesson: null,
  type: 'close',
  duration_minutes: 60,
  passing_score: 70,
  max_attempts: 1,
  show_correct_answers: false,
  randomize_questions: false,
  available_from: '',
  available_until: '',
  is_active: true
})

const assignmentForm = ref({
  title: '',
  description: '',
  course: null,
  theme: null,
  lesson: null,
  deadline: '',
  max_grade: 100,
  allow_late_submissions: false,
  submission_type: 'file',
  max_file_size: 10485760, // 10MB
})

const forumForm = ref({
  name: '',
  description: '',
  forum_type: 'general',
  subject: null,
  is_moderated: false,
  allow_anonymous: false
})

const editingTheme = ref(null)
const editingLesson = ref(null)
const editingCourse = ref(null)

const themeValidationErrors = ref({})
const lessonValidationErrors = ref({})
const courseValidationErrors = ref({})
const testValidationErrors = ref({})
const assignmentValidationErrors = ref({})
const forumValidationErrors = ref({})
const isSubmitting = ref(false)

// Состояние раскрытых тем
const expandedThemes = ref(new Set())

// Композабл для модального окна подтверждения удаления
const {
  showConfirmDialog,
  confirmDialogData,
  dialogLoading,
  openConfirmDialog,
  closeConfirmDialog,
  handleConfirmDialog
} = useConfirmDialog()

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

const stats = computed(() => {
  const totalCourses = courses.value.length
  const totalThemes = themes.value.length
  const totalLessons = lessons.value.length
  const visibleLessons = lessons.value.filter(l => l.is_visible).length
  
  return {
    totalCourses,
    totalThemes,
    totalLessons,
    visibleLessons
  }
})

const selectedCourse = computed(() => {
  return courses.value.find(c => c.id === selectedCourseId.value) || null
})

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
    // Фильтр по поиску
    if (searchQuery.value && !course.name.toLowerCase().includes(searchQuery.value.toLowerCase())) {
      return false
    }
    
    // Фильтр по категории
    if (selectedCategory.value && course.category?.id !== parseInt(selectedCategory.value)) {
      return false
    }
    
    // Фильтр по формату
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

  // Создаем группы для отфильтрованных курсов или только выбранного
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
    // Извлекаем ID курса - может быть как числом, так и объектом
    let courseId = theme.subject
    if (typeof courseId === 'object' && courseId?.id) {
      courseId = courseId.id
    }
          courseId = parseInt(courseId) // Приводим к числу для сравнения
    
    if (courseGroups[courseId]) {
      courseGroups[courseId].themes.push({
        ...theme,
        lessons: []
      })
    }
  })

  // Добавляем уроки в темы
  filteredLessons.value.forEach(lesson => {
    // Находим тему по ID
    let themeId = lesson.theme
    if (typeof themeId === 'object' && themeId?.id) {
      themeId = themeId.id
    }
    themeId = parseInt(themeId)
    
    const theme = themes.value.find(t => parseInt(t.id) === themeId)
    if (theme) {
      // Извлекаем ID курса из темы
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
    
    const [coursesResponse, themesResponse, lessonsResponse, forumsResponse, categoriesResponse, formatsResponse] = await Promise.all([
      apiClient.get(endpoints.lms.subjects),
      apiClient.get(endpoints.lms.themes),
      apiClient.get(endpoints.lms.lessons),
      apiClient.get(endpoints.lms.forums).catch(() => ({ data: [] })),
      apiClient.get(endpoints.lms.categories).catch(() => ({ data: [] })),
      apiClient.get(endpoints.lms.courseFormats).catch(() => ({ data: [] }))
    ])
    
    // Обрабатываем данные из API
    courses.value = coursesResponse.data?.results || coursesResponse.data || []
    themes.value = themesResponse.data?.results || themesResponse.data || []
    lessons.value = lessonsResponse.data?.results || lessonsResponse.data || []
    forums.value = forumsResponse.data?.results || forumsResponse.data || []
    categories.value = categoriesResponse.data?.results || categoriesResponse.data || []
    courseFormats.value = formatsResponse.data?.results || formatsResponse.data || []
    

    
    // Раскрываем первую тему каждого курса
    groupedData.value.forEach(courseGroup => {
      if (courseGroup.themes.length > 0) {
        expandedThemes.value.add(courseGroup.themes[0].id)
      }
    })
    
  } catch (error) {
    console.error('Ошибка загрузки данных:', error)
    // При ошибке API показываем пустые массивы
    courses.value = []
    themes.value = []
    lessons.value = []
    forums.value = []
    categories.value = []
    courseFormats.value = []
  } finally {
    loading.value = false
  }
}

async function fetchCategoriesAndFormats() {
  try {
    const [categoriesResponse, formatsResponse] = await Promise.all([
      apiClient.get(endpoints.lms.categories),
      apiClient.get(endpoints.lms.courseFormats)
    ])
    categories.value = categoriesResponse.data
    courseFormats.value = formatsResponse.data
  } catch (error) {
    console.error('Ошибка загрузки категорий и форматов:', error)
    showError('Не удалось загрузить категории и форматы курсов')
  }
}

function onCourseChange() {
  // Данные уже фильтруются через computed свойства
}

function formatDate(dateString) {
  if (!dateString) return 'Не указано'
  return new Date(dateString).toLocaleDateString('ru', {
    day: 'numeric',
    month: 'short',
    year: 'numeric'
  })
}

function getLessonTypeIcon(type) {
  const lessonType = lessonTypes.find(t => t.value === type)
  return lessonType ? lessonType.icon : FileText
}

function getLessonTypeName(type) {
  const lessonType = lessonTypes.find(t => t.value === type)
  return lessonType ? lessonType.label : 'Неизвестно'
}

function openThemeModal() {
  resetThemeForm()
  showThemeModal.value = true
}

function createTheme(course) {
  resetThemeForm()
  themeForm.value.subject = course.id
  showThemeModal.value = true
}

function editTheme(theme) {
  editingTheme.value = theme
  
  // Извлекаем ID курса из темы
  let subjectId = theme.subject
  if (typeof subjectId === 'object' && subjectId?.id) {
    subjectId = subjectId.id
  }
  
  themeForm.value = {
    name: theme.name,
    description: theme.description,
    subject: subjectId,
    sort_order: theme.sort_order || 0,
    is_visible: theme.is_visible,
    completion_required: theme.completion_required || false
  }
  showEditThemeModal.value = true
}

function resetThemeForm() {
  themeForm.value = {
    name: '',
    description: '',
    subject: selectedCourseId.value || null,
    sort_order: 0,
    is_visible: true,
    completion_required: false
  }
  themeValidationErrors.value = {}
  editingTheme.value = null
}

function closeThemeModal() {
  showThemeModal.value = false
  showEditThemeModal.value = false
  editingTheme.value = null
  resetThemeForm()
}

async function saveTheme() {
  try {
    isSubmitting.value = true
    themeValidationErrors.value = {}

    if (!themeForm.value.name.trim()) {
      themeValidationErrors.value.name = 'Название темы обязательно'
      return
    }

    if (!themeForm.value.subject) {
      themeValidationErrors.value.subject = 'Выберите курс'
      return
    }

    // Подготовка данных с корректной обработкой пустых полей
    const subjectId = parseInt(themeForm.value.subject)
    
    // Проверяем, что курс существует
    const selectedCourseExists = courses.value.find(c => c.id === subjectId)
    if (!selectedCourseExists) {
      themeValidationErrors.value.subject = 'Выбранный курс не существует'
      showError('Выбранный курс не найден')
      return
    }
    
    const data = {
      name: themeForm.value.name.trim(),
      description: themeForm.value.description?.trim() || null, // API может требовать null вместо пустой строки
      subject: subjectId,
      sort_order: parseInt(themeForm.value.sort_order) || 0,
      is_visible: Boolean(themeForm.value.is_visible),
      completion_required: Boolean(themeForm.value.completion_required)
    }
    
    // Удаляем null поля, если API их не ожидает
    if (data.description === null || data.description === '') {
      delete data.description
    }



    // Отправляем данные в API
    let response
    if (editingTheme.value) {
      response = await apiClient.put(`${endpoints.lms.themes}${editingTheme.value.id}/`, data)
    } else {
      response = await apiClient.post(endpoints.lms.themes, data)
    }

    showSuccess(editingTheme.value ? 'Тема успешно обновлена' : 'Тема успешно создана')
    await fetchData()
    closeThemeModal()

  } catch (error) {
    console.error('Ошибка сохранения темы:', error)
    console.error('Статус ошибки:', error.response?.status)
    console.error('Данные ошибки:', error.response?.data)
    console.error('URL запроса:', error.config?.url)
    console.error('Метод запроса:', error.config?.method)
    console.error('Данные запроса:', error.config?.data)
    
    if (error.response?.data) {
      const errorData = error.response.data
      
      if (typeof errorData === 'object') {
        // Обрабатываем ошибки валидации
        Object.keys(errorData).forEach(field => {
          if (Array.isArray(errorData[field])) {
            themeValidationErrors.value[field] = errorData[field].join(', ')
          } else {
            themeValidationErrors.value[field] = errorData[field]
          }
        })
        
        // Показываем все ошибки пользователю
        const errorMessages = Object.entries(themeValidationErrors.value).map(([field, message]) => `${field}: ${message}`)
        if (errorMessages.length > 0) {
          showError(`Ошибки валидации:\n${errorMessages.join('\n')}`)
        }
      } else {
        showError(`Ошибка API: ${errorData}`)
      }
    } else {
      showError('Ошибка соединения с сервером')
    }
  } finally {
    isSubmitting.value = false
  }
}

function deleteTheme(theme) {
  let message = `Вы уверены, что хотите удалить тему "${theme.name}"?`
  
  // Подсчитываем количество уроков в теме
  const lessonsInTheme = lessons.value.filter(lesson => {
    let lessonThemeId = lesson.theme
    if (typeof lessonThemeId === 'object' && lessonThemeId?.id) {
      lessonThemeId = lessonThemeId.id
    }
    return parseInt(lessonThemeId) === parseInt(theme.id)
  })
  
  if (lessonsInTheme.length > 0) {
    message += `\n\n⚠️ ВНИМАНИЕ: В этой теме ${lessonsInTheme.length} урок(ов). Они также будут удалены навсегда!`
  }
  
  message += '\n\nЭто действие нельзя отменить.'

  openConfirmDialog({
    title: 'Удаление темы',
    message: message,
    confirmText: 'Удалить',
    onConfirm: () => confirmDeleteTheme(theme)
  })
}

async function confirmDeleteTheme(theme) {
  try {
    dialogLoading.value = true
    await apiClient.delete(`${endpoints.lms.themes}${theme.id}/`)
    showSuccess('Тема успешно удалена')
    await fetchData()
    closeConfirmDialog()
  } catch (error) {
    console.error('Ошибка удаления темы:', error)
    showError('Ошибка при удалении темы')
  } finally {
    dialogLoading.value = false
  }
}

function openLessonModal() {
  resetLessonForm()
  showLessonModal.value = true
}











// Функции для работы с уроками
function createLesson(theme) {
  resetLessonForm()
  // Получаем ID курса из темы
  let courseId = theme.subject
  if (typeof courseId === 'object' && courseId?.id) {
    courseId = courseId.id
  }
  lessonForm.value.course = courseId
  lessonForm.value.theme = theme.id
  showLessonModal.value = true
}

function editLesson(lesson) {
  editingLesson.value = lesson
  
  // Получаем курс из темы урока
  const theme = themes.value.find(t => parseInt(t.id) === parseInt(lesson.theme?.id || lesson.theme))
  let courseId = null
  if (theme) {
    courseId = theme.subject?.id || theme.subject
  }
  
  lessonForm.value = {
    name: lesson.name,
    description: lesson.description || '',
    lessontype: lesson.lessontype || 'L',
    course: courseId,
    theme: lesson.theme?.id || lesson.theme,
    sort_order: lesson.sort_order || 0,
    is_visible: lesson.is_visible !== undefined ? lesson.is_visible : true,
    completion_required: lesson.completion_required || false,
    availability_start: lesson.availability_start ? new Date(lesson.availability_start).toISOString().slice(0, 16) : '',
    availability_end: lesson.availability_end ? new Date(lesson.availability_end).toISOString().slice(0, 16) : '',
    content: lesson.content || ''
  }
  showEditLessonModal.value = true
}

function resetLessonForm() {
  lessonForm.value = {
    name: '',
    description: '',
    lessontype: 'L',
    course: selectedCourseId.value || null,
    theme: null,
    sort_order: 0,
    is_visible: true,
    completion_required: false,
    availability_start: '',
    availability_end: '',
    content: ''
  }
  lessonValidationErrors.value = {}
  editingLesson.value = null
}

function closeLessonModal() {
  showLessonModal.value = false
  showEditLessonModal.value = false
  editingLesson.value = null
  resetLessonForm()
}

function onLessonCourseChange() {
  // Сбрасываем выбранную тему при изменении курса
  lessonForm.value.theme = null
}



async function saveLesson() {
  try {
    isSubmitting.value = true
    lessonValidationErrors.value = {}

    // Валидация
    const errors = {}
    
    if (!lessonForm.value.name || !lessonForm.value.name.trim()) {
      errors.name = 'Название урока обязательно'
    } else if (lessonForm.value.name.trim().length < 3) {
      errors.name = 'Название урока должно содержать минимум 3 символа'
    }
    
    if (!lessonForm.value.lessontype) {
      errors.lessontype = 'Выберите тип урока'
    }
    
    if (!lessonForm.value.course) {
      errors.course = 'Выберите курс'
    }
    
    if (!lessonForm.value.theme) {
      errors.theme = 'Выберите тему'
    }

    // Валидация дат доступности
    if (lessonForm.value.availability_start && lessonForm.value.availability_end) {
      const startDate = new Date(lessonForm.value.availability_start)
      const endDate = new Date(lessonForm.value.availability_end)
      
      if (startDate >= endDate) {
        errors.availability_start = 'Дата начала должна быть раньше даты окончания'
        errors.availability_end = 'Дата окончания должна быть позже даты начала'
      }
    }

    if (Object.keys(errors).length > 0) {
      lessonValidationErrors.value = errors
      showError('Пожалуйста, исправьте ошибки в форме')
      return
    }

    const data = {
      name: lessonForm.value.name.trim(),
      description: lessonForm.value.description?.trim() || '',
      lessontype: lessonForm.value.lessontype,
      theme: parseInt(lessonForm.value.theme),
      sort_order: parseInt(lessonForm.value.sort_order) || 0,
      is_visible: Boolean(lessonForm.value.is_visible),
      completion_required: Boolean(lessonForm.value.completion_required),
      availability_start: lessonForm.value.availability_start || null,
      availability_end: lessonForm.value.availability_end || null,
      content: lessonForm.value.content || ''
    }

    // Удаляем пустые поля
    Object.keys(data).forEach(key => {
      if (data[key] === null || data[key] === '' || data[key] === undefined) {
        delete data[key]
      }
    })

    let response
    if (editingLesson.value) {
      response = await apiClient.put(`${endpoints.lms.lessons}${editingLesson.value.id}/`, data)
    } else {
      response = await apiClient.post(endpoints.lms.lessons, data)
    }

    showSuccess(editingLesson.value ? 'Урок успешно обновлен' : 'Урок успешно создан')
    await fetchData()
    closeLessonModal()

  } catch (error) {
    console.error('Ошибка сохранения урока:', error)
    
    if (error.response?.data) {
      const errorData = error.response.data
      
      if (typeof errorData === 'object') {
        Object.keys(errorData).forEach(field => {
          if (Array.isArray(errorData[field])) {
            lessonValidationErrors.value[field] = errorData[field].join(', ')
          } else {
            lessonValidationErrors.value[field] = errorData[field]
          }
        })
        
        const errorMessages = Object.entries(lessonValidationErrors.value).map(([field, message]) => `${field}: ${message}`)
        if (errorMessages.length > 0) {
          showError(`Ошибки валидации урока:\n${errorMessages.join('\n')}`)
        }
      } else {
        showError(`Ошибка API: ${errorData}`)
      }
    } else {
      showError('Ошибка соединения с сервером')
    }
  } finally {
    isSubmitting.value = false
  }
}

async function saveCourse() {
  try {
    isSubmitting.value = true
    courseValidationErrors.value = {}

    // Валидация
    const errors = {}
    
    if (!courseForm.value.name || !courseForm.value.name.trim()) {
      errors.name = 'Название курса обязательно'
    }

    if (!courseForm.value.category) {
      errors.category = 'Выберите категорию'
    }

    if (!courseForm.value.course_format) {
      errors.course_format = 'Выберите формат курса'
    }

    if (Object.keys(errors).length > 0) {
      courseValidationErrors.value = errors
      return
    }

    // Подготовка данных
    const formData = new FormData()
    formData.append('name', courseForm.value.name.trim())
    formData.append('description', courseForm.value.description?.trim() || '')
    formData.append('summary', courseForm.value.summary?.trim() || '')
    formData.append('category', courseForm.value.category)
    formData.append('course_format', courseForm.value.course_format)
    formData.append('is_self_enrollment', courseForm.value.is_self_enrollment)
    formData.append('is_published', courseForm.value.is_published)
    formData.append('completion_tracking', courseForm.value.completion_tracking)
    formData.append('guest_access', courseForm.value.guest_access)

    if (courseForm.value.start_date) {
      formData.append('start_date', courseForm.value.start_date)
    }
    if (courseForm.value.end_date) {
      formData.append('end_date', courseForm.value.end_date)
    }
    if (courseForm.value.enrollment_key) {
      formData.append('enrollment_key', courseForm.value.enrollment_key)
    }
    if (courseForm.value.max_enrollment) {
      formData.append('max_enrollment', courseForm.value.max_enrollment)
    }
    if (courseForm.value.image) {
      formData.append('image', courseForm.value.image)
    }

    // Отправка запроса
    let response
    if (editingCourse.value) {
      response = await apiClient.put(`${endpoints.lms.subjects}${editingCourse.value.id}/`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      })
    } else {
      response = await apiClient.post(endpoints.lms.subjects, formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      })
    }

    showSuccess(editingCourse.value ? 'Курс успешно обновлен' : 'Курс успешно создан')
    await fetchData()
    closeCourseModal()

  } catch (error) {
    console.error('Ошибка сохранения курса:', error)
    
    if (error.response?.data) {
      const errorData = error.response.data
      
      if (typeof errorData === 'object') {
        // Обрабатываем ошибки валидации
        Object.keys(errorData).forEach(field => {
          if (Array.isArray(errorData[field])) {
            courseValidationErrors.value[field] = errorData[field].join(', ')
          } else {
            courseValidationErrors.value[field] = errorData[field]
          }
        })
        
        // Показываем все ошибки пользователю
        const errorMessages = Object.entries(courseValidationErrors.value).map(([field, message]) => `${field}: ${message}`)
        if (errorMessages.length > 0) {
          showError(`Ошибки валидации:\n${errorMessages.join('\n')}`)
        }
      } else {
        showError(`Ошибка API: ${errorData}`)
      }
    } else {
      showError('Ошибка соединения с сервером')
    }
  } finally {
    isSubmitting.value = false
  }
}

function onImageChange(event) {
  const file = event.target.files[0]
  if (file) {
    if (file.size > 5 * 1024 * 1024) { // 5MB
      showError('Размер файла не должен превышать 5MB')
      event.target.value = ''
      return
    }
    courseForm.value.image = file
  }
}

function deleteCourse(course) {
  // Подсчитываем количество тем и уроков в курсе
  const themesInCourse = themes.value.filter(theme => {
    let subjectId = theme.subject
    if (typeof subjectId === 'object' && subjectId?.id) {
      subjectId = subjectId.id
    }
    return parseInt(subjectId) === parseInt(course.id)
  })
  
  const lessonsCount = themesInCourse.reduce((count, theme) => {
    const lessonsInTheme = lessons.value.filter(lesson => {
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

  openConfirmDialog({
    title: 'Удаление курса',
    message: message,
    confirmText: 'Удалить',
    onConfirm: () => confirmDeleteCourse(course)
  })
}

async function confirmDeleteCourse(course) {
  try {
    dialogLoading.value = true
    await apiClient.delete(`${endpoints.lms.subjects}${course.id}/`)
    showSuccess('Курс успешно удален')
    await fetchData()
    closeConfirmDialog()
  } catch (error) {
    console.error('Ошибка удаления курса:', error)
    showError('Ошибка при удалении курса')
  } finally {
    dialogLoading.value = false
  }
}

// Функции для работы с тестами
function openTestModal() {
  resetTestForm()
  showTestModal.value = true
}

function createTest(theme) {
  resetTestForm()
  // Получаем ID курса из темы
  let courseId = theme.subject
  if (typeof courseId === 'object' && courseId?.id) {
    courseId = courseId.id
  }
  testForm.value.course = courseId
  testForm.value.theme = theme.id
  showTestModal.value = true
}

function resetTestForm() {
  testForm.value = {
    name: '',
    title: '',
    description: '',
    course: selectedCourseId.value || null,
    theme: null,
    lesson: null,
    type: 'close',
    duration_minutes: 60,
    passing_score: 70,
    max_attempts: 1,
    show_correct_answers: false,
    randomize_questions: false,
    available_from: '',
    available_until: '',
    is_active: true
  }
  testValidationErrors.value = {}
}

function closeTestModal() {
  showTestModal.value = false
  resetTestForm()
}

async function saveTest() {
  try {
    isSubmitting.value = true
    testValidationErrors.value = {}

    if (!testForm.value.name.trim()) {
      testValidationErrors.value.name = 'Название теста обязательно'
      return
    }

    if (!testForm.value.title.trim()) {
      testValidationErrors.value.title = 'Заголовок теста обязателен'
      return
    }

    if (!testForm.value.course) {
      testValidationErrors.value.course = 'Выберите курс'
      return
    }

    const data = {
      name: testForm.value.name.trim(),
      title: testForm.value.title.trim(),
      description: testForm.value.description?.trim() || null,
      course: parseInt(testForm.value.course),
      type: testForm.value.type,
      duration_minutes: parseInt(testForm.value.duration_minutes) || 60,
      passing_score: parseInt(testForm.value.passing_score) || 70,
      max_attempts: parseInt(testForm.value.max_attempts) || 1,
      show_correct_answers: Boolean(testForm.value.show_correct_answers),
      randomize_questions: Boolean(testForm.value.randomize_questions),
      available_from: testForm.value.available_from || null,
      available_until: testForm.value.available_until || null,
      is_active: Boolean(testForm.value.is_active)
    }

    // Добавляем theme только если она выбрана
    if (testForm.value.theme) {
      data.theme = parseInt(testForm.value.theme)
    }

    // Добавляем lesson только если он выбран  
    if (testForm.value.lesson) {
      data.lesson = testForm.value.lesson
    }

    // Удаляем пустые поля
    Object.keys(data).forEach(key => {
      if (data[key] === null || data[key] === '' || data[key] === undefined) {
        delete data[key]
      }
    })

    await apiClient.post(endpoints.lms.tests, data)
    showSuccess('Тест успешно создан')
    closeTestModal()
    await fetchData() // Обновляем данные

  } catch (error) {
    console.error('Ошибка создания теста:', error)
    
    if (error.response?.data) {
      const errorData = error.response.data
      
      if (typeof errorData === 'object') {
        // Обрабатываем ошибки валидации
        Object.keys(errorData).forEach(field => {
          if (Array.isArray(errorData[field])) {
            testValidationErrors.value[field] = errorData[field].join(', ')
          } else {
            testValidationErrors.value[field] = errorData[field]
          }
        })
        
        // Показываем все ошибки пользователю
        const errorMessages = Object.entries(testValidationErrors.value).map(([field, message]) => `${field}: ${message}`)
        if (errorMessages.length > 0) {
          showError(`Ошибки валидации теста:\n${errorMessages.join('\n')}`)
        }
      } else {
        showError(`Ошибка API: ${errorData}`)
      }
    } else {
      showError('Ошибка соединения с сервером')
    }
  } finally {
    isSubmitting.value = false
  }
}

// Функции для работы с заданиями
function openAssignmentModal() {
  resetAssignmentForm()
  showAssignmentModal.value = true
}

function createAssignment(theme) {
  resetAssignmentForm()
  // Получаем ID курса из темы
  let courseId = theme.subject
  if (typeof courseId === 'object' && courseId?.id) {
    courseId = courseId.id
  }
  assignmentForm.value.course = courseId
  assignmentForm.value.theme = theme.id
  showAssignmentModal.value = true
}

function resetAssignmentForm() {
  assignmentForm.value = {
    title: '',
    description: '',
    course: selectedCourseId.value || null,
    theme: null,
    lesson: null,
    deadline: '',
    max_grade: 100,
    allow_late_submissions: false,
    submission_type: 'file',
    max_file_size: 10485760
  }
  assignmentValidationErrors.value = {}
}

function closeAssignmentModal() {
  showAssignmentModal.value = false
  resetAssignmentForm()
}

async function saveAssignment() {
  try {
    isSubmitting.value = true
    assignmentValidationErrors.value = {}

    if (!assignmentForm.value.title.trim()) {
      assignmentValidationErrors.value.title = 'Название задания обязательно'
      return
    }

    if (!assignmentForm.value.course) {
      assignmentValidationErrors.value.course = 'Выберите курс'
      return
    }

    const data = {
      title: assignmentForm.value.title.trim(),
      description: assignmentForm.value.description?.trim() || null,
      course: parseInt(assignmentForm.value.course),
      max_grade: parseInt(assignmentForm.value.max_grade) || 100,
      allow_late_submissions: Boolean(assignmentForm.value.allow_late_submissions),
      submission_type: assignmentForm.value.submission_type,
      max_file_size: parseInt(assignmentForm.value.max_file_size) || 10485760
    }

    // Добавляем theme только если она выбрана
    if (assignmentForm.value.theme) {
      data.theme = parseInt(assignmentForm.value.theme)
    }

    // Добавляем lesson только если он выбран
    if (assignmentForm.value.lesson) {
      data.lesson = assignmentForm.value.lesson
    }

    // Добавляем deadline только если он указан
    if (assignmentForm.value.deadline && assignmentForm.value.deadline.trim()) {
      data.deadline = assignmentForm.value.deadline.trim()
    }

    // Удаляем пустые поля
    Object.keys(data).forEach(key => {
      if (data[key] === null || data[key] === '' || data[key] === undefined) {
        delete data[key]
      }
    })

    await apiClient.post(endpoints.lms.assignments, data)
    showSuccess('Задание успешно создано')
    closeAssignmentModal()

  } catch (error) {
    console.error('Ошибка создания задания:', error)
    
    if (error.response?.data) {
      const errorData = error.response.data
      
      if (typeof errorData === 'object') {
        // Обрабатываем ошибки валидации
        Object.keys(errorData).forEach(field => {
          if (Array.isArray(errorData[field])) {
            assignmentValidationErrors.value[field] = errorData[field].join(', ')
          } else {
            assignmentValidationErrors.value[field] = errorData[field]
          }
        })
        
        // Показываем все ошибки пользователю
        const errorMessages = Object.entries(assignmentValidationErrors.value).map(([field, message]) => `${field}: ${message}`)
        if (errorMessages.length > 0) {
          showError(`Ошибки валидации задания:\n${errorMessages.join('\n')}`)
        }
      } else {
        showError(`Ошибка API: ${errorData}`)
      }
    } else {
      showError('Ошибка соединения с сервером')
    }
  } finally {
    isSubmitting.value = false
  }
}

// Функции для работы с форумами
function openForumModal() {
  resetForumForm()
  showForumModal.value = true
}

function resetForumForm() {
  forumForm.value = {
    name: '',
    description: '',
    forum_type: 'general',
    subject: selectedCourseId.value || null,
    is_moderated: false,
    allow_anonymous: false
  }
  forumValidationErrors.value = {}
}

function closeForumModal() {
  showForumModal.value = false
  resetForumForm()
}

async function saveForum() {
  try {
    isSubmitting.value = true
    forumValidationErrors.value = {}

    if (!forumForm.value.name.trim()) {
      forumValidationErrors.value.name = 'Название форума обязательно'
      return
    }

    if (!forumForm.value.subject) {
      forumValidationErrors.value.subject = 'Выберите курс'
      return
    }

    const data = {
      name: forumForm.value.name.trim(),
      description: forumForm.value.description?.trim() || '',
      forum_type: forumForm.value.forum_type,
      subject: parseInt(forumForm.value.subject),
      is_moderated: Boolean(forumForm.value.is_moderated),
      allow_anonymous: Boolean(forumForm.value.allow_anonymous)
    }

    await apiClient.post(endpoints.lms.forums, data)
    showSuccess('Форум успешно создан')
    closeForumModal()
    await fetchData() // Обновляем данные

  } catch (error) {
    console.error('Ошибка создания форума:', error)
    showError('Ошибка при создании форума')
  } finally {
    isSubmitting.value = false
  }
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

function createForum(course) {
  resetForumForm()
  forumForm.value.subject = course.id
  showForumModal.value = true
}



function editForum(forum) {
  // Заполняем форму данными форума для редактирования
  let subjectId = forum.subject
  if (typeof subjectId === 'object' && subjectId?.id) {
    subjectId = subjectId.id
  }
  
  forumForm.value = {
    name: forum.name,
    description: forum.description,
    forum_type: forum.forum_type,
    subject: subjectId,
    is_moderated: forum.is_moderated,
    allow_anonymous: forum.allow_anonymous
  }
  showForumModal.value = true
}

function deleteForum(forum) {
  let message = `Вы уверены, что хотите удалить форум "${forum.name}"?`
  message += '\n\nЭто действие нельзя отменить.'

  openConfirmDialog({
    title: 'Удаление форума',
    message: message,
    confirmText: 'Удалить',
    onConfirm: () => confirmDeleteForum(forum)
  })
}

async function confirmDeleteForum(forum) {
  try {
    dialogLoading.value = true
    await apiClient.delete(`${endpoints.lms.forums}${forum.id}/`)
    showSuccess('Форум успешно удален')
    await fetchData()
    closeConfirmDialog()
  } catch (error) {
    console.error('Ошибка удаления форума:', error)
    showError('Ошибка при удалении форума')
  } finally {
    dialogLoading.value = false
  }
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

// Функции для работы с курсами и темами
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

// Недостающие функции для работы с уроками
function deleteLesson(lesson) {
  let message = `Вы уверены, что хотите удалить урок "${lesson.name}"?`
  message += '\n\nЭто действие нельзя отменить.'

  openConfirmDialog({
    title: 'Удаление урока',
    message: message,
    confirmText: 'Удалить',
    onConfirm: () => confirmDeleteLesson(lesson)
  })
}

async function confirmDeleteLesson(lesson) {
  try {
    dialogLoading.value = true
    await apiClient.delete(`${endpoints.lms.lessons}${lesson.id}/`)
    showSuccess('Урок успешно удален')
    await fetchData()
    closeConfirmDialog()
  } catch (error) {
    console.error('Ошибка удаления урока:', error)
    showError('Ошибка при удалении урока')
  } finally {
    dialogLoading.value = false
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
    await fetchData()
    showSuccess(`Урок "${lesson.name}" успешно скопирован как "${copyName}"`)
  } catch (error) {
    console.error('Ошибка дублирования урока:', error)
    showError('Ошибка при копировании урока')
  }
}

async function toggleLessonVisibility(lesson) {
  try {
    const updateData = {
      ...lesson,
      is_visible: !lesson.is_visible
    }
    
    await apiClient.put(`${endpoints.lms.lessons}${lesson.id}/`, updateData)
    await fetchData()
    showSuccess(`Урок "${lesson.name}" ${lesson.is_visible ? 'скрыт' : 'показан'}`)
  } catch (error) {
    console.error('Ошибка изменения видимости урока:', error)
    showError('Ошибка при изменении видимости урока')
  }
}

// Функция для управления раскрытием тем
function toggleTheme(themeId) {
  if (expandedThemes.value.has(themeId)) {
    expandedThemes.value.delete(themeId)
  } else {
    expandedThemes.value.add(themeId)
  }
}

function isThemeExpanded(themeId) {
  return expandedThemes.value.has(themeId)
}



function onTestCourseChange() {
  // Сбрасываем выбранную тему при изменении курса
  testForm.value.theme = null
}

function onAssignmentCourseChange() {
  // Сбрасываем выбранную тему при изменении курса
  assignmentForm.value.theme = null
}

// Обработка открытия/закрытия dropdown для правильного z-index
onMounted(() => {
  fetchData()
  
  // Добавляем обработчики для dropdown
  nextTick(() => {
    document.addEventListener('shown.bs.dropdown', (event) => {
      const lessonCard = event.target.closest('.lesson-card')
      const forumCard = event.target.closest('.forum-card')
      
      if (lessonCard) {
        lessonCard.classList.add('dropdown-open')
      }
      if (forumCard) {
        forumCard.classList.add('dropdown-open')
      }
    })
    
    document.addEventListener('hidden.bs.dropdown', (event) => {
      const lessonCard = event.target.closest('.lesson-card')
      const forumCard = event.target.closest('.forum-card')
      
      if (lessonCard) {
        lessonCard.classList.remove('dropdown-open')
      }
      if (forumCard) {
        forumCard.classList.remove('dropdown-open')
      }
    })
  })
})

function createCourse() {
  resetCourseForm()
  showCourseModal.value = true
}

function resetCourseForm() {
  courseForm.value = {
    name: '',
    description: '',
    summary: '',
    category: null,
    course_format: null,
    start_date: '',
    end_date: '',
    enrollment_key: '',
    max_enrollment: null,
    is_self_enrollment: true,
    is_published: false,
    completion_tracking: false,
    guest_access: false,
    image: null
  }
  courseValidationErrors.value = {}
  editingCourse.value = null
}

function closeCourseModal() {
  showCourseModal.value = false
  showEditCourseModal.value = false
  editingCourse.value = null
  resetCourseForm()
}

// Вызываем функции при монтировании компонента
onMounted(async () => {
  await Promise.all([
    fetchData(),
    fetchCategoriesAndFormats()
  ])
})
</script>

<style scoped>
.course-group {
  border-left: 4px solid var(--bs-primary);
  position: relative;
  z-index: auto;
}

/* Стили для изображений курсов */
.course-image img {
  border: 2px solid #dee2e6;
  transition: transform 0.2s ease;
}

.course-image img:hover {
  transform: scale(1.1);
}

.course-image-placeholder {
  width: 40px;
  height: 40px;
  border: 2px solid #dee2e6;
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

/* Убираем transform и повышаем z-index для карточки с открытым dropdown */
.lesson-card:has(.dropdown.show) {
  z-index: 10005 !important;
  transform: none !important;
}

/* Альтернативный селектор для браузеров без поддержки :has() */
.lesson-card.dropdown-open {
  z-index: 10005 !important;
  transform: none !important;
}

/* Исправление z-index для выпадающих меню уроков */
.lesson-card .dropdown {
  position: relative;
  z-index: 9999;
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

.lesson-card .dropdown-item {
  display: flex;
  align-items: center;
  padding: 0.5rem 1rem;
  font-size: 0.875rem;
}

.lesson-card .dropdown-item:hover {
  background-color: #f8f9fa;
}

/* Обеспечиваем, что открытое меню находится поверх всех карточек */
.lesson-card .dropdown.show {
  z-index: 10001;
}

.lesson-card .dropdown.show .dropdown-menu {
  z-index: 10002 !important;
}

/* Глобальные правила для всех dropdown в карточках */
.card .dropdown-menu {
  z-index: 10000 !important;
  position: absolute !important;
}

.row .dropdown-menu {
  z-index: 10000 !important;
  position: absolute !important;
}

/* Переопределяем Bootstrap стили */
.dropdown-menu.show {
  z-index: 10000 !important;
  position: absolute !important;
}

/* Убираем transform для всех карточек когда любой dropdown открыт */
.accordion-body:has(.dropdown.show) .lesson-card {
  transform: none !important;
}

/* Альтернативное решение - выключаем hover эффекты когда dropdown открыт */
body:has(.dropdown.show) .lesson-card:hover {
  transform: none !important;
}

.accordion-button:not(.collapsed) {
  color: var(--bs-primary);
  background-color: rgba(var(--bs-primary-rgb), 0.1);
}

.badge.small {
  font-size: 0.6rem;
}

/* Модальные окна */
.modal-backdrop {
  background-color: rgba(0, 0, 0, 0.5);
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  z-index: 1040;
}

.modal {
  z-index: 1050;
}

.modal.show {
  display: block !important;
}

.modal-dialog {
  margin: 1.75rem auto;
  max-width: 500px;
}

.modal-dialog-lg {
  max-width: 800px;
}

.modal-dialog-xxl {
  max-width: 1400px;
  width: 80vw;
}

/* Анимации карточек */
.stats-card {
  transition: all 0.3s ease;
}

.stats-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 15px rgba(0, 0, 0, 0.1);
}

/* Стили для пустых состояний */
.empty-state {
  padding: 3rem 1rem;
  text-align: center;
}

.empty-state svg {
  opacity: 0.5;
  margin-bottom: 1rem;
}

/* Стили для кнопок действий */
.action-buttons .btn {
  transition: all 0.2s ease;
}

.action-buttons .btn:hover {
  transform: scale(1.05);
}

/* Улучшенные стили для аккордеона */
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

/* Стили для статистики */
.stats-container .card {
  border: none;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
  transition: all 0.3s ease;
}

.stats-container .card:hover {
  transform: translateY(-3px);
  box-shadow: 0 6px 20px rgba(0, 0, 0, 0.15);
}

/* Цветные индикаторы для типов уроков */
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

/* Стили для форумов */
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

.forum-meta {
  font-size: 0.8rem;
}

/* Убираем transform и повышаем z-index для карточки форума с открытым dropdown */
.forum-card:has(.dropdown.show) {
  z-index: 10005 !important;
  transform: none !important;
}

/* Альтернативный селектор для браузеров без поддержки :has() */
.forum-card.dropdown-open {
  z-index: 10005 !important;
  transform: none !important;
}

/* Исправление z-index для выпадающих меню форумов */
.forum-card .dropdown {
  position: relative;
  z-index: 9999;
}

.forum-card .dropdown-menu {
  position: absolute !important;
  z-index: 10000 !important;
  right: 0;
  left: auto;
  min-width: 160px;
  border: 1px solid rgba(0, 0, 0, 0.15);
  box-shadow: 0 0.5rem 1rem rgba(0, 0, 0, 0.15);
}

.forum-card .dropdown-item {
  display: flex;
  align-items: center;
  padding: 0.5rem 1rem;
  font-size: 0.875rem;
}

.forum-card .dropdown-item:hover {
  background-color: #f8f9fa;
  }
</style> 