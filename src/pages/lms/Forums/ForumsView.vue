<script setup>
import { ref, computed, onMounted } from 'vue'
import { MessageSquare, Users, Clock, Plus, Pin, MessageCircle, Search, Filter, Eye, TrendingUp } from 'lucide-vue-next'
import { apiClient } from '@/js/api/manager'
import { endpoints } from '@/js/api/endpoints'
import { globalUserRole } from '../composables/useUserRole'

const forums = ref([])
const discussions = ref([])
const posts = ref([])
const loading = ref(true)
const selectedForum = ref(null)
const selectedDiscussion = ref(null)
const searchQuery = ref('')
const selectedFilter = ref('all')
const userRole = globalUserRole

// Фильтры для форумов
const filterOptions = [
  { value: 'all', label: 'Все форумы' },
  { value: 'recent', label: 'Недавние' },
  { value: 'popular', label: 'Популярные' },
  { value: 'my_courses', label: 'Мои курсы' }
]

// Фильтрованные форумы
const filteredForums = computed(() => {
  let filtered = forums.value
  
  if (searchQuery.value) {
    const query = searchQuery.value.toLowerCase()
    filtered = filtered.filter(forum =>
      forum.name.toLowerCase().includes(query) ||
      forum.description.toLowerCase().includes(query) ||
      (forum.subject?.name || '').toLowerCase().includes(query)
    )
  }
  
  switch (selectedFilter.value) {
    case 'recent':
      filtered = filtered.filter(forum => {
        if (!forum.last_activity) return false
        const weekAgo = new Date()
        weekAgo.setDate(weekAgo.getDate() - 7)
        return new Date(forum.last_activity) > weekAgo
      })
      break
    case 'popular':
      filtered = filtered.sort((a, b) => (b.discussions_count || 0) - (a.discussions_count || 0))
      break
    case 'my_courses':
      // Здесь можно фильтровать по курсам пользователя
      break
  }
  
  return filtered
})

// Загрузка форумов
async function loadForums() {
  try {
    loading.value = true
    const response = await apiClient.get(endpoints.lms.forums)
    
    if (response.success) {
      forums.value = response.data.results || response.data
    } else {
      // Fallback данные
      forums.value = [
        {
          id: 1,
          name: 'Основы веб-разработки',
          description: 'Обсуждение материалов курса по веб-разработке',
          forum_type: 'general',
          subject: { name: 'Основы веб-разработки' },
          discussions_count: 15,
          posts_count: 47,
          last_activity: '2024-01-12T14:30:00Z',
          last_post: {
            author: { first_name: 'Мария', last_name: 'К.' },
            discussion: { name: 'Вопрос по CSS Grid' }
          }
        },
        {
          id: 2,
          name: 'Python для начинающих',
          description: 'Помощь и обсуждение заданий по Python',
          forum_type: 'q_and_a',
          subject: { name: 'Python для начинающих' },
          discussions_count: 23,
          posts_count: 89,
          last_activity: '2024-01-11T16:45:00Z',
          last_post: {
            author: { first_name: 'Александр', last_name: 'П.' },
            discussion: { name: 'Работа с файлами' }
          }
        },
        {
          id: 3,
          name: 'Алгоритмы и структуры данных',
          description: 'Обсуждение сложных вопросов по алгоритмам',
          forum_type: 'general',
          subject: { name: 'Алгоритмы и структуры данных' },
          discussions_count: 31,
          posts_count: 156,
          last_activity: '2024-01-13T09:20:00Z',
          last_post: {
            author: { first_name: 'Елена', last_name: 'С.' },
            discussion: { name: 'Сортировка слиянием' }
          }
        }
      ]
    }
  } catch (error) {
    console.error('Ошибка загрузки форумов:', error)
    forums.value = []
  } finally {
    loading.value = false
  }
}

// Загрузка дискуссий форума
async function loadDiscussions(forumId) {
  try {
    loading.value = true
    const response = await apiClient.get(`${endpoints.lms.discussions}?forum=${forumId}`)
    
    if (response.success) {
      discussions.value = response.data.results || response.data
    } else {
      // Fallback данные
      discussions.value = [
        {
          id: 1,
          name: 'Как правильно использовать Flexbox?',
          created_by: { first_name: 'Иван', last_name: 'С.' },
          posts_count: 12,
          views_count: 45,
          last_post_at: '2024-01-12T14:30:00Z',
          is_pinned: true,
          is_locked: false,
          created_at: '2024-01-10T10:00:00Z'
        },
        {
          id: 2,
          name: 'Проблема с адаптивной версткой',
          created_by: { first_name: 'Мария', last_name: 'К.' },
          posts_count: 8,
          views_count: 23,
          last_post_at: '2024-01-11T20:15:00Z',
          is_pinned: false,
          is_locked: false,
          created_at: '2024-01-11T16:30:00Z'
        },
        {
          id: 3,
          name: 'Лучшие практики CSS Grid',
          created_by: { first_name: 'Дмитрий', last_name: 'В.' },
          posts_count: 15,
          views_count: 67,
          last_post_at: '2024-01-13T11:45:00Z',
          is_pinned: false,
          is_locked: false,
          created_at: '2024-01-12T14:20:00Z'
        }
      ]
    }
  } catch (error) {
    console.error('Ошибка загрузки дискуссий:', error)
    discussions.value = []
  } finally {
    loading.value = false
  }
}

// Загрузка постов дискуссии
async function loadPosts(discussionId) {
  try {
    loading.value = true
    const response = await apiClient.get(`${endpoints.lms.posts}?discussion=${discussionId}`)
    
    if (response.success) {
      posts.value = response.data.results || response.data
    } else {
      // Fallback данные
      posts.value = [
        {
          id: 1,
          content: 'Привет! У меня возникли вопросы по использованию Flexbox. Как правильно центрировать элементы по горизонтали и вертикали?',
          author: { first_name: 'Иван', last_name: 'С.' },
          created_at: '2024-01-10T10:00:00Z',
          updated_at: '2024-01-10T10:00:00Z',
          parent: null
        },
        {
          id: 2,
          content: 'Для центрирования по обеим осям используй: display: flex; justify-content: center; align-items: center;',
          author: { first_name: 'Мария', last_name: 'К.' },
          created_at: '2024-01-10T12:30:00Z',
          updated_at: '2024-01-10T12:30:00Z',
          parent: 1
        }
      ]
    }
  } catch (error) {
    console.error('Ошибка загрузки постов:', error)
    posts.value = []
  } finally {
    loading.value = false
  }
}

function selectForum(forum) {
  selectedForum.value = forum
  selectedDiscussion.value = null
  loadDiscussions(forum.id)
}

function selectDiscussion(discussion) {
  selectedDiscussion.value = discussion
  loadPosts(discussion.id)
}

function backToForums() {
  selectedForum.value = null
  selectedDiscussion.value = null
  discussions.value = []
  posts.value = []
}

function backToDiscussions() {
  selectedDiscussion.value = null
  posts.value = []
}

function createDiscussion() {
  console.log('Создать новую дискуссию')
  // Здесь можно открыть модальное окно для создания дискуссии
}

function replyToPost(postId) {
  console.log('Ответить на пост:', postId)
  // Здесь можно открыть форму ответа
}

function getAuthorName(author) {
  if (!author) return 'Неизвестный автор'
  return `${author.first_name || ''} ${author.last_name || ''}`.trim() || 'Пользователь'
}

function getForumTypeLabel(type) {
  const types = {
    'general': 'Общий форум',
    'q_and_a': 'Вопросы и ответы',
    'single': 'Одна дискуссия',
    'each_person': 'Персональные темы'
  }
  return types[type] || 'Форум'
}

function formatTimeAgo(dateString) {
  if (!dateString) return 'Неизвестно'
  
  const now = new Date()
  const date = new Date(dateString)
  const diffMs = now - date
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60))
  
  if (diffHours < 1) return 'Меньше часа назад'
  if (diffHours < 24) return `${diffHours} ч назад`
  
  const diffDays = Math.floor(diffHours / 24)
  if (diffDays < 7) return `${diffDays} дн назад`
  
  const diffWeeks = Math.floor(diffDays / 7)
  if (diffWeeks < 4) return `${diffWeeks} нед назад`
  
  return date.toLocaleDateString('ru')
}

function hasNewActivity(item) {
  if (!item.last_post_at && !item.last_activity) return false
  
  const lastActivity = new Date(item.last_post_at || item.last_activity)
  const dayAgo = new Date()
  dayAgo.setDate(dayAgo.getDate() - 1)
  
  return lastActivity > dayAgo
}

onMounted(() => {
  userRole.loadUserRoles().then(() => {
    loadForums()
  })
})
</script>

<template>
  <div class="forums-view">
    <!-- Список форумов -->
    <div v-if="!selectedForum && !selectedDiscussion">
      <!-- Заголовок и статистика -->
      <div class="row mb-4">
        <div class="col-12">
          <div class="d-flex justify-content-between align-items-center flex-wrap gap-3 mb-4">
            <div>
              <h3 class="mb-2">
                <MessageSquare :size="28" class="text-primary me-2" />
                Форумы
              </h3>
              <p class="text-muted mb-0">Обсуждайте материалы курсов и задавайте вопросы</p>
            </div>
            <div class="forum-stats-overview">
              <div class="row text-center">
                <div class="col">
                  <div class="stat-card">
                    <TrendingUp :size="20" class="text-success mb-1" />
                    <div class="fw-bold">{{ forums.length }}</div>
                    <small class="text-muted">Форумов</small>
                  </div>
                </div>
                <div class="col">
                  <div class="stat-card">
                    <MessageCircle :size="20" class="text-info mb-1" />
                    <div class="fw-bold">{{ forums.reduce((sum, f) => sum + (f.discussions_count || 0), 0) }}</div>
                    <small class="text-muted">Дискуссий</small>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Поиск и фильтры -->
      <div class="row mb-4">
        <div class="col-lg-8">
          <div class="input-group">
            <span class="input-group-text bg-white border-end-0">
              <Search :size="16" class="text-muted" />
            </span>
            <input
              v-model="searchQuery"
              type="text"
              class="form-control border-start-0"
              placeholder="Поиск по форумам..."
            >
          </div>
        </div>
        <div class="col-lg-4">
          <select v-model="selectedFilter" class="form-select">
            <option v-for="option in filterOptions" :key="option.value" :value="option.value">
              {{ option.label }}
            </option>
          </select>
        </div>
      </div>

      <!-- Загрузка -->
      <div v-if="loading" class="text-center py-5">
        <div class="spinner-border text-primary"></div>
        <p class="mt-3 text-muted">Загрузка форумов...</p>
      </div>

      <!-- Пустое состояние -->
      <div v-else-if="filteredForums.length === 0" class="text-center py-5">
        <MessageSquare :size="48" class="text-muted mb-3" />
        <h5 class="text-muted">Форумы не найдены</h5>
        <p class="text-muted">Попробуйте изменить критерии поиска</p>
      </div>

      <!-- Список форумов -->
      <div v-else>
        <div v-for="forum in filteredForums" :key="forum.id" class="card forum-card mb-4">
          <div class="card-body">
            <div class="row align-items-center">
              <div class="col-lg-7">
                <div class="forum-info">
                  <div class="d-flex align-items-center gap-2 mb-2">
                    <div class="forum-icon">
                      <MessageSquare :size="20" class="text-primary" />
                    </div>
                    <h5 class="forum-title mb-0" @click="selectForum(forum)">
                      {{ forum.name }}
                    </h5>
                    <span v-if="hasNewActivity(forum)" class="badge bg-success">Новые сообщения</span>
                  </div>
                  <p class="text-muted mb-2">{{ forum.description }}</p>
                  <div class="forum-meta">
                    <small class="text-muted me-3">
                      <strong>Курс:</strong> {{ forum.subject?.name || 'Не указан' }}
                    </small>
                    <span class="badge bg-light text-dark">{{ getForumTypeLabel(forum.forum_type) }}</span>
                  </div>
                </div>
              </div>
              
              <div class="col-lg-3 text-center">
                <div class="forum-stats">
                  <div class="row">
                    <div class="col-6">
                      <div class="stat-item">
                        <div class="fw-bold text-primary">{{ forum.discussions_count || 0 }}</div>
                        <small class="text-muted">Дискуссии</small>
                      </div>
                    </div>
                    <div class="col-6">
                      <div class="stat-item">
                        <div class="fw-bold text-info">{{ forum.posts_count || 0 }}</div>
                        <small class="text-muted">Сообщения</small>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              
              <div class="col-lg-2">
                <div class="last-activity">
                  <small class="text-muted d-block">Последняя активность:</small>
                  <small class="fw-bold d-block">{{ formatTimeAgo(forum.last_activity) }}</small>
                  <small v-if="forum.last_post" class="text-muted d-block">
                    {{ getAuthorName(forum.last_post.author) }}
                  </small>
                  <small v-if="forum.last_post?.discussion" class="text-primary d-block">
                    {{ forum.last_post.discussion.name }}
                  </small>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Дискуссии в форуме -->
    <div v-else-if="selectedForum && !selectedDiscussion">
      <div class="row mb-4">
        <div class="col-12">
          <div class="d-flex justify-content-between align-items-center flex-wrap gap-3">
            <div>
              <button @click="backToForums" class="btn btn-outline-secondary me-3">
                ← Назад к форумам
              </button>
              <h3 class="mb-0 d-inline">{{ selectedForum.name }}</h3>
              <span class="badge bg-light text-dark ms-2">{{ getForumTypeLabel(selectedForum.forum_type) }}</span>
            </div>
            <button @click="createDiscussion" class="btn btn-primary">
              <Plus :size="18" class="me-2" />
              Новая дискуссия
            </button>
          </div>
          <p class="text-muted mt-2">{{ selectedForum.description }}</p>
        </div>
      </div>

      <!-- Загрузка дискуссий -->
      <div v-if="loading" class="text-center py-5">
        <div class="spinner-border text-primary"></div>
        <p class="mt-3 text-muted">Загрузка дискуссий...</p>
      </div>

      <!-- Пустое состояние -->
      <div v-else-if="discussions.length === 0" class="text-center py-5">
        <MessageCircle :size="48" class="text-muted mb-3" />
        <h5 class="text-muted">Пока нет дискуссий</h5>
        <p class="text-muted">Станьте первым, кто начнет обсуждение!</p>
        <button @click="createDiscussion" class="btn btn-primary">
          <Plus :size="18" class="me-2" />
          Создать дискуссию
        </button>
      </div>

      <!-- Список дискуссий -->
      <div v-else class="discussions-list">
        <div v-for="discussion in discussions" :key="discussion.id" class="card discussion-card mb-3">
          <div class="card-body">
            <div class="row align-items-center">
              <div class="col-lg-6">
                <div class="discussion-info">
                  <div class="d-flex align-items-center gap-2 mb-1">
                    <Pin v-if="discussion.is_pinned" :size="16" class="text-warning" />
                    <h6 class="discussion-title mb-0" @click="selectDiscussion(discussion)">
                      {{ discussion.name }}
                    </h6>
                    <span v-if="hasNewActivity(discussion)" class="badge bg-primary">Новое</span>
                    <span v-if="discussion.is_locked" class="badge bg-secondary">Закрыта</span>
                  </div>
                  <small class="text-muted">
                    Автор: {{ getAuthorName(discussion.created_by) }}
                    · {{ formatTimeAgo(discussion.created_at) }}
                  </small>
                </div>
              </div>
              
              <div class="col-lg-3 text-center">
                <div class="discussion-stats">
                  <div class="row">
                    <div class="col-4">
                      <div class="stat-item">
                        <MessageCircle :size="16" class="text-muted" />
                        <span class="ms-1">{{ discussion.posts_count || 0 }}</span>
                      </div>
                    </div>
                    <div class="col-4">
                      <div class="stat-item">
                        <Eye :size="16" class="text-muted" />
                        <span class="ms-1">{{ discussion.views_count || 0 }}</span>
                      </div>
                    </div>
                    <div class="col-4">
                      <div class="stat-item">
                        <Clock :size="16" class="text-muted" />
                        <small class="text-muted d-block">{{ formatTimeAgo(discussion.last_post_at) }}</small>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              
              <div class="col-lg-3">
                <div class="last-activity text-end">
                  <small class="text-muted">Последний ответ:</small><br>
                  <small class="fw-bold">{{ formatTimeAgo(discussion.last_post_at) }}</small>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Просмотр дискуссии -->
    <div v-else-if="selectedDiscussion">
      <div class="row mb-4">
        <div class="col-12">
          <div class="d-flex justify-content-between align-items-center flex-wrap gap-3">
            <div>
              <button @click="backToDiscussions" class="btn btn-outline-secondary me-3">
                ← Назад к дискуссиям
              </button>
              <h3 class="mb-0 d-inline">{{ selectedDiscussion.name }}</h3>
              <span v-if="selectedDiscussion.is_pinned" class="badge bg-warning ms-2">Закреплена</span>
              <span v-if="selectedDiscussion.is_locked" class="badge bg-secondary ms-2">Закрыта</span>
            </div>
            <button v-if="!selectedDiscussion.is_locked" @click="replyToPost(null)" class="btn btn-primary">
              <MessageCircle :size="18" class="me-2" />
              Ответить
            </button>
          </div>
        </div>
      </div>

      <!-- Загрузка постов -->
      <div v-if="loading" class="text-center py-5">
        <div class="spinner-border text-primary"></div>
        <p class="mt-3 text-muted">Загрузка сообщений...</p>
      </div>

      <!-- Посты -->
      <div v-else class="posts-list">
        <div v-for="(post, index) in posts" :key="post.id" class="card post-card mb-3">
          <div class="card-body">
            <div class="row">
              <div class="col-lg-2 text-center">
                <div class="post-author">
                  <div class="author-avatar mb-2">
                    <div class="avatar-circle">
                      {{ getAuthorName(post.author).charAt(0) }}
                    </div>
                  </div>
                  <div class="fw-bold">{{ getAuthorName(post.author) }}</div>
                  <small class="text-muted">{{ formatTimeAgo(post.created_at) }}</small>
                  <div v-if="index === 0" class="badge bg-primary mt-1">Автор темы</div>
                </div>
              </div>
              
              <div class="col-lg-10">
                <div class="post-content">
                  <div class="post-text mb-3">
                    {{ post.content }}
                  </div>
                  
                  <div class="post-actions">
                    <button v-if="!selectedDiscussion.is_locked" @click="replyToPost(post.id)" class="btn btn-sm btn-outline-primary">
                      <MessageCircle :size="14" class="me-1" />
                      Ответить
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
</template>


<style lang="scss" scoped>
.forums-view {
  // Статистические карточки форумов
  .forum-stats-overview {
    .stat-card {
      background: #fff;
      border-radius: 12px;
      padding: 1rem;
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
      transition: transform 0.2s ease;
      
      &:hover {
        transform: translateY(-2px);
        box-shadow: 0 4px 16px rgba(0, 0, 0, 0.1);
      }
    }
  }

  // Карточки форумов
  .forum-card {
    border: 1px solid #e5e5e5;
    border-radius: 12px;
    transition: all 0.2s ease;
    cursor: pointer;

    &:hover {
      transform: translateY(-2px);
      box-shadow: 0 8px 25px rgba(0, 0, 0, 0.1);
      border-color: #007bff;
    }

    .forum-icon {
      width: 40px;
      height: 40px;
      border-radius: 10px;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      display: flex;
      align-items: center;
      justify-content: center;
      color: white;
    }

    .forum-title {
      color: #2c3e50;
      text-decoration: none;
      font-weight: 600;
      transition: color 0.2s ease;

      &:hover {
        color: #007bff;
      }
    }

    .forum-meta {
      display: flex;
      align-items: center;
      gap: 0.5rem;
    }

    .stat-item {
      text-align: center;
      padding: 0.5rem 0;
    }
  }

  // Карточки дискуссий
  .discussion-card {
    border: 1px solid #e5e5e5;
    border-radius: 10px;
    transition: all 0.2s ease;

    &:hover {
      transform: translateY(-1px);
      box-shadow: 0 4px 15px rgba(0, 0, 0, 0.08);
      border-color: #007bff;
    }

    .discussion-title {
      color: #2c3e50;
      text-decoration: none;
      font-weight: 600;
      cursor: pointer;
      transition: color 0.2s ease;

      &:hover {
        color: #007bff;
      }
    }

    .stat-item {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 0.25rem;
      font-size: 0.875rem;
    }
  }

  // Карточки постов
  .post-card {
    border: 1px solid #e5e5e5;
    border-radius: 10px;
    transition: all 0.2s ease;

    &:hover {
      box-shadow: 0 4px 15px rgba(0, 0, 0, 0.08);
    }

    .post-author {
      .author-avatar {
        .avatar-circle {
          width: 50px;
          height: 50px;
          border-radius: 50%;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          display: flex;
          align-items: center;
          justify-content: center;
          color: white;
          font-weight: bold;
          font-size: 1.2rem;
          margin: 0 auto;
        }
      }
    }

    .post-content {
      .post-text {
        line-height: 1.6;
        color: #4a5568;
        white-space: pre-wrap;
      }

      .post-actions {
        padding-top: 1rem;
        border-top: 1px solid #e5e5e5;
      }
    }
  }

  // Поиск и фильтры
  .input-group {
    .input-group-text {
      border-color: #e5e5e5;
    }

    .form-control {
      border-color: #e5e5e5;
      
      &:focus {
        border-color: #007bff;
        box-shadow: 0 0 0 0.2rem rgba(0, 123, 255, 0.25);
      }
    }
  }

  // Общие кнопки
  .btn {
    border-radius: 8px;
    font-weight: 500;
    transition: all 0.2s ease;

    &.btn-primary {
      background: linear-gradient(135deg, #007bff 0%, #0056b3 100%);
      border: none;

      &:hover {
        transform: translateY(-1px);
        box-shadow: 0 4px 12px rgba(0, 123, 255, 0.3);
      }
    }

    &.btn-outline-primary {
      border-color: #007bff;
      color: #007bff;

      &:hover {
        background: #007bff;
        border-color: #007bff;
        transform: translateY(-1px);
      }
    }

    &.btn-outline-secondary {
      &:hover {
        transform: translateY(-1px);
      }
    }
  }

  // Бейджи
  .badge {
    border-radius: 6px;
    font-weight: 500;
    font-size: 0.75rem;

    &.bg-success {
      background: linear-gradient(135deg, #28a745 0%, #20c997 100%) !important;
    }

    &.bg-primary {
      background: linear-gradient(135deg, #007bff 0%, #6610f2 100%) !important;
    }

    &.bg-warning {
      background: linear-gradient(135deg, #ffc107 0%, #fd7e14 100%) !important;
      color: #212529 !important;
    }

    &.bg-secondary {
      background: linear-gradient(135deg, #6c757d 0%, #495057 100%) !important;
    }
  }

  // Анимации загрузки
  .spinner-border {
    width: 3rem;
    height: 3rem;
  }

  // Пустые состояния
  .text-center.py-5 {
    padding: 3rem 1rem !important;

    h5 {
      margin-top: 1rem;
      color: #6c757d;
    }

    p {
      color: #adb5bd;
    }
  }

  // Адаптивность
  @media (max-width: 768px) {
    .forum-card,
    .discussion-card {
      .row {
        .col-lg-2,
        .col-lg-3 {
          margin-top: 1rem;
        }
      }
    }

    .d-flex.justify-content-between {
      flex-direction: column;
      gap: 1rem;

      .btn {
        width: 100%;
      }
    }
  }
}

@media (max-width: 992px) {
  .forum-stats {
    margin: 1rem 0;
  }
  
  .last-activity {
    margin-top: 1rem;
  }
}
</style> 