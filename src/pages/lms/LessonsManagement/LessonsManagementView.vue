<template>
  <div class="lessons-management-view">
    <RoleGuard 
      :roles="['teacher', 'admin']"
      fallback-message="Доступ к управлению уроками имеют только преподаватели и администраторы"
    >
      <div class="row mb-4">
        <div class="col-12">
          <div class="d-flex justify-content-between align-items-center flex-wrap gap-3">
            <div>
              <h3 class="mb-1">Управление уроками</h3>
              <p class="text-muted mb-0">Создавайте, редактируйте и организуйте уроки ваших курсов</p>
            </div>
            <div class="d-flex gap-2 action-buttons">
              <button @click="openThemeModal" class="btn btn-success">
                <Plus :size="18" class="me-2" />
                Создать тему
              </button>
              <button @click="openLessonModal" class="btn btn-primary">
                <Plus :size="18" class="me-2" />
                Создать урок
              </button>
            </div>
          </div>
        </div>
      </div>

      <!-- Фильтры -->
      <div class="row mb-4">
        <div class="col-lg-4">
          <label class="form-label">Выберите курс</label>
          <select v-model="selectedCourseId" @change="onCourseChange" class="form-select">
            <option value="">Все курсы</option>
            <option v-for="course in courses" :key="course.id" :value="course.id">
              {{ course.name }}
            </option>
          </select>
        </div>
        <div class="col-lg-4">
          <label class="form-label">Поиск</label>
          <div class="input-group">
            <span class="input-group-text">
              <Search :size="16" />
            </span>
            <input
              v-model="searchQuery"
              type="text"
              class="form-control"
              placeholder="Название урока или темы..."
            />
          </div>
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
      </div>

      <!-- Структура курсов -->
      <div v-else>
        <div v-for="courseGroup in groupedData" :key="courseGroup.course.id" class="course-group mb-5">
          <!-- Заголовок курса -->
          <div class="card">
            <div class="card-header">
              <div class="d-flex justify-content-between align-items-center">
                <div class="d-flex align-items-center gap-3">
                  <h5 class="mb-0">{{ courseGroup.course.name }}</h5>
                  <span class="badge bg-light text-dark">{{ courseGroup.totalLessons }} уроков</span>
                  <span v-if="!courseGroup.course.is_published" class="badge bg-warning">Черновик</span>
                </div>
                <div class="btn-group">
                  <button @click="editCourse(courseGroup.course)" class="btn btn-sm btn-outline-primary">
                    <Edit :size="16" />
                  </button>
                  <button @click="createTheme(courseGroup.course)" class="btn btn-sm btn-outline-success">
                    <Plus :size="16" />
                    Тема
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
                      :class="{ collapsed: themeIndex !== 0 }"
                      type="button" 
                      data-bs-toggle="collapse" 
                      :data-bs-target="`#theme-${theme.id}`"
                    >
                      <div class="d-flex justify-content-between align-items-center w-100 me-3">
                        <div class="d-flex align-items-center gap-3">
                          <FolderOpen :size="18" />
                          <span class="fw-semibold">{{ theme.name }}</span>
                          <span class="badge bg-primary">{{ theme.lessons.length }} уроков</span>
                          <span v-if="!theme.is_visible" class="badge bg-secondary">Скрыта</span>
                        </div>
                        <div class="btn-group" @click.stop>
                          <button @click="editTheme(theme)" class="btn btn-sm btn-outline-primary">
                            <Edit :size="14" />
                          </button>
                          <button @click="createLesson(theme)" class="btn btn-sm btn-outline-success">
                            <Plus :size="14" />
                          </button>
                          <button @click="deleteTheme(theme)" class="btn btn-sm btn-outline-danger">
                            <Trash2 :size="14" />
                          </button>
                        </div>
                      </div>
                    </button>
                  </h2>
                  <div 
                    :id="`theme-${theme.id}`" 
                    class="accordion-collapse collapse"
                    :class="{ show: themeIndex === 0 }"
                    :data-bs-parent="`#course-accordion-${courseGroup.course.id}`"
                  >
                    <div class="accordion-body">
                      <!-- Уроки темы -->
                      <div v-if="theme.lessons.length === 0" class="text-center py-3">
                        <BookOpen :size="24" class="text-muted mb-2" />
                        <p class="text-muted mb-2">В теме нет уроков</p>
                        <button @click="createLesson(theme)" class="btn btn-sm btn-primary">
                          Создать первый урок
                        </button>
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
                                <button @click="editLesson(lesson)" class="btn btn-sm btn-outline-primary">
                                  <Edit :size="12" />
                                </button>
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

      <!-- Модальные окна заменим простыми алертами пока не создадим компоненты -->
    </RoleGuard>

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

              <div class="mb-3">
                <label class="form-label">Тема *</label>
                <select 
                  v-model="lessonForm.theme" 
                  class="form-select"
                  :class="{ 'is-invalid': lessonValidationErrors.theme }"
                  required
                >
                  <option value="">Выберите тему</option>
                  <option v-for="theme in availableThemes" :key="theme.id" :value="theme.id">
                    {{ theme.displayName || theme.name }}
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
  </div>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue'
import { 
  Plus, Search, Edit, Trash2, Copy, Eye, EyeOff, MoreVertical,
  BookOpen, FolderOpen, Hash, Video, FileText, Link, 
  MessageSquare, Calendar, Award, TestTube, ChevronDown
} from 'lucide-vue-next'
import { apiClient } from '@/js/api/manager'
import { endpoints } from '@/js/api/endpoints'
import RoleGuard from '../components/RoleGuard.vue'
import { globalUserRole } from '../composables/useUserRole'
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
const loading = ref(true)
const selectedCourseId = ref('')
const searchQuery = ref('')
const selectedStatus = ref('')

const showThemeModal = ref(false)
const showLessonModal = ref(false)
const showEditThemeModal = ref(false)
const showEditLessonModal = ref(false)

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
  theme: null,
  sort_order: 0,
  is_visible: true,
  completion_required: false,
  availability_start: '',
  availability_end: '',
  content: ''
})

const editingTheme = ref(null)
const editingLesson = ref(null)

const themeValidationErrors = ref({})
const lessonValidationErrors = ref({})
const isSubmitting = ref(false)

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
  console.log('🔄 Пересчет groupedData')
  console.log('📚 Курсы:', courses.value.length, courses.value.map(c => ({id: c.id, name: c.name})))
  console.log('📂 Темы:', themes.value.length, themes.value.map(t => ({id: t.id, name: t.name, subject: t.subject})))
  console.log('📖 Уроки:', lessons.value.length)
  console.log('🔍 Выбранный курс:', selectedCourseId.value)
  
  const courseGroups = {}
  
  // Создаем группы для всех курсов или только выбранного
  courses.value.forEach(course => {
    if (!selectedCourseId.value || course.id.toString() === selectedCourseId.value.toString()) {
      courseGroups[course.id] = {
        course,
        themes: [],
        totalLessons: 0
      }
      console.log(`➕ Добавлена группа для курса: ${course.name} (ID: ${course.id})`)
    }
  })

  // Добавляем темы в соответствующие курсы
  themes.value.forEach(theme => {
    // Извлекаем ID курса - может быть как числом, так и объектом
    let courseId = theme.subject
    if (typeof courseId === 'object' && courseId?.id) {
      courseId = courseId.id
    }
    courseId = String(courseId) // Приводим к строке для сравнения
    
    console.log(`📂 Обрабатываем тему: ${theme.name} для курса ID: ${courseId}`)
    
    if (courseGroups[courseId]) {
      courseGroups[courseId].themes.push({
        ...theme,
        lessons: []
      })
      console.log(`✅ Тема "${theme.name}" добавлена в курс ID: ${courseId}`)
    } else {
      console.log(`❌ Курс ID: ${courseId} не найден в courseGroups`, Object.keys(courseGroups))
    }
  })

  // Добавляем уроки в темы
  filteredLessons.value.forEach(lesson => {
    const theme = themes.value.find(t => t.id === lesson.theme)
    if (theme) {
      // Извлекаем ID курса из темы
      let courseId = theme.subject
      if (typeof courseId === 'object' && courseId?.id) {
        courseId = courseId.id
      }
      courseId = String(courseId)
      
      const courseGroup = courseGroups[courseId]
      if (courseGroup) {
        const themeInGroup = courseGroup.themes.find(t => t.id === theme.id)
        if (themeInGroup) {
          themeInGroup.lessons.push(lesson)
          courseGroup.totalLessons++
          console.log(`📖 Урок "${lesson.name}" добавлен в тему "${theme.name}"`)
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

  const result = Object.values(courseGroups)
  console.log('📊 Итоговый результат groupedData:', result)
  
  return result
})

async function fetchData() {
  try {
    loading.value = true
    
    const [coursesResponse, themesResponse, lessonsResponse] = await Promise.all([
      apiClient.get(endpoints.lms.subjects),
      apiClient.get(endpoints.lms.themes),
      apiClient.get(endpoints.lms.lessons)
    ])
    
    // Обрабатываем данные из API
    courses.value = coursesResponse.data?.results || coursesResponse.data || []
    themes.value = themesResponse.data?.results || themesResponse.data || []
    lessons.value = lessonsResponse.data?.results || lessonsResponse.data || []
    
    console.log('Данные загружены из API')
    console.log('Загружено данных:')
    console.log('Курсы:', courses.value.length, '(' + courses.value.length + ')', courses.value)
    console.log('Темы:', themes.value.length)
    console.log('Уроки:', lessons.value.length)
    
    // Отладка: показываем структуру первой темы
    if (themes.value.length > 0) {
      console.log('🔍 Структура первой темы:', themes.value[0])
      console.log('🔍 Поле subject первой темы:', themes.value[0].subject, typeof themes.value[0].subject)
    }
    
  } catch (error) {
    console.error('Ошибка загрузки данных:', error)
    // При ошибке API показываем пустые массивы
    courses.value = []
    themes.value = []
    lessons.value = []
  } finally {
    loading.value = false
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

    console.log('Отправляемые данные темы:', data)
    console.log('Доступные курсы:', courses.value.map(c => ({id: c.id, name: c.name})))

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
      console.log('Детальные ошибки валидации:', errorData)
      
      if (typeof errorData === 'object') {
        // Обрабатываем ошибки валидации
        Object.keys(errorData).forEach(field => {
          if (Array.isArray(errorData[field])) {
            themeValidationErrors.value[field] = errorData[field].join(', ')
            console.log(`Ошибка в поле ${field}:`, errorData[field])
          } else {
            themeValidationErrors.value[field] = errorData[field]
            console.log(`Ошибка в поле ${field}:`, errorData[field])
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

async function deleteTheme(theme) {
  if (!confirm(`Вы уверены, что хотите удалить тему "${theme.name}"? Все уроки в этой теме также будут удалены.`)) {
    return
  }

  try {
    await apiClient.delete(`${endpoints.lms.themes}${theme.id}/`)
    await fetchData()
    showSuccess('Тема успешно удалена')
  } catch (error) {
    console.error('Ошибка удаления темы:', error)
    showError('Ошибка при удалении темы')
  }
}

function openLessonModal() {
  resetLessonForm()
  showLessonModal.value = true
}

function createLesson(theme) {
  resetLessonForm()
  lessonForm.value.theme = theme.id
  showLessonModal.value = true
}

function editLesson(lesson) {
  editingLesson.value = lesson
  lessonForm.value = {
    name: lesson.name,
    description: lesson.description,
    lessontype: lesson.lessontype,
    theme: lesson.theme,
    sort_order: lesson.sort_order || 0,
    is_visible: lesson.is_visible,
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
    theme: null,
    sort_order: 0,
    is_visible: true,
    completion_required: false,
    availability_start: '',
    availability_end: '',
    content: ''
  }
  lessonValidationErrors.value = {}
}

function closeLessonModal() {
  showLessonModal.value = false
  showEditLessonModal.value = false
  editingLesson.value = null
  resetLessonForm()
}

async function saveLesson() {
  try {
    isSubmitting.value = true
    lessonValidationErrors.value = {}

    if (!lessonForm.value.name.trim()) {
      lessonValidationErrors.value.name = 'Название урока обязательно'
      return
    }

    if (!lessonForm.value.theme) {
      lessonValidationErrors.value.theme = 'Выберите тему'
      return
    }

    const data = {
      name: lessonForm.value.name.trim(),
      description: lessonForm.value.description?.trim() || null,
      lessontype: lessonForm.value.lessontype,
      theme: lessonForm.value.theme,
      sort_order: parseInt(lessonForm.value.sort_order) || 0,
      is_visible: Boolean(lessonForm.value.is_visible),
      completion_required: Boolean(lessonForm.value.completion_required),
      availability_start: lessonForm.value.availability_start || null,
      availability_end: lessonForm.value.availability_end || null,
      content: lessonForm.value.content?.trim() || null
    }
    
    // Удаляем пустые поля
    Object.keys(data).forEach(key => {
      if (data[key] === null || data[key] === '') {
        delete data[key]
      }
    })

    // Отправляем данные в API
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
    console.error('Статус ошибки:', error.response?.status)
    console.error('Данные ошибки:', error.response?.data)
    console.error('URL запроса:', error.config?.url)
    console.error('Метод запроса:', error.config?.method)
    console.error('Данные запроса:', error.config?.data)
    
    if (error.response?.data) {
      const errorData = error.response.data
      console.log('Детальные ошибки валидации урока:', errorData)
      
      if (typeof errorData === 'object') {
        // Обрабатываем ошибки валидации
        Object.keys(errorData).forEach(field => {
          if (Array.isArray(errorData[field])) {
            lessonValidationErrors.value[field] = errorData[field].join(', ')
          } else {
            lessonValidationErrors.value[field] = errorData[field]
          }
        })
        
        // Показываем все ошибки пользователю
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

async function deleteLesson(lesson) {
  if (!confirm(`Вы уверены, что хотите удалить урок "${lesson.name}"?`)) {
    return
  }

  try {
    await apiClient.delete(`${endpoints.lms.lessons}${lesson.id}/`)
    await fetchData()
    showSuccess('Урок успешно удален')
  } catch (error) {
    console.error('Ошибка удаления урока:', error)
    showError('Ошибка при удалении урока')
  }
}

function viewLesson(lesson) {
  console.log('Просмотр урока:', lesson)
  showWarning('Просмотр урока будет реализован в следующей версии')
}

async function duplicateLesson(lesson) {
  try {
    // Создаем копию урока через API
    const duplicateData = {
      name: `${lesson.name} (копия)`,
      description: lesson.description,
      lessontype: lesson.lessontype,
      theme: lesson.theme,
      sort_order: (lesson.sort_order || 0) + 1,
      is_visible: lesson.is_visible,
      completion_required: lesson.completion_required,
      availability_start: lesson.availability_start,
      availability_end: lesson.availability_end,
      content: lesson.content
    }
    
    await apiClient.post(endpoints.lms.lessons, duplicateData)
    await fetchData()
    showSuccess(`Урок "${lesson.name}" успешно скопирован`)
  } catch (error) {
    console.error('Ошибка дублирования урока:', error)
    showError('Ошибка при копировании урока')
  }
}

async function toggleLessonVisibility(lesson) {
  try {
    // Обновляем видимость урока
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

function editCourse(course) {
  showWarning('Функция редактирования курса будет реализована в каталоге курсов')
}

const availableThemes = computed(() => {
  // Показываем все темы с указанием курса
  return themes.value.map(theme => {
    const course = courses.value.find(c => c.id === theme.subject)
    return {
      ...theme,
      displayName: `${theme.name} (${course?.name || 'Неизвестный курс'})`
    }
  })
})



onMounted(fetchData)
</script>

<style scoped>
.course-group {
  border-left: 4px solid var(--bs-primary);
}

.lesson-card {
  transition: box-shadow 0.2s, transform 0.2s;
}

.lesson-card:hover {
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  transform: translateY(-2px);
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
  overflow: hidden;
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
</style> 