<script setup>
import { ref, onMounted } from 'vue'
import { MessageSquare, Users, Clock, Plus, Pin, MessageCircle } from 'lucide-vue-next'

const forums = ref([])
const discussions = ref([])
const loading = ref(false)
const selectedForum = ref(null)

function fetchForums() {
  forums.value = [
    {
      id: 1,
      title: 'Основы веб-разработки',
      description: 'Обсуждение материалов курса по веб-разработке',
      course: 'Основы веб-разработки',
      topicsCount: 15,
      postsCount: 47,
      lastActivity: '2024-01-12T14:30:00',
      lastPost: {
        author: 'Мария К.',
        topic: 'Вопрос по CSS Grid'
      }
    },
    {
      id: 2,
      title: 'Python для начинающих',
      description: 'Помощь и обсуждение заданий по Python',
      course: 'Python для начинающих',
      topicsCount: 23,
      postsCount: 89,
      lastActivity: '2024-01-11T16:45:00',
      lastPost: {
        author: 'Александр П.',
        topic: 'Работа с файлами'
      }
    }
  ]
}

function fetchDiscussions(forumId) {
  discussions.value = [
    {
      id: 1,
      title: 'Как правильно использовать Flexbox?',
      author: 'Иван С.',
      replies: 12,
      views: 45,
      lastActivity: '2024-01-12T14:30:00',
      isPinned: true,
      hasNewPosts: true
    },
    {
      id: 2,
      title: 'Проблема с адаптивной версткой',
      author: 'Мария К.',
      replies: 8,
      views: 23,
      lastActivity: '2024-01-11T20:15:00',
      isPinned: false,
      hasNewPosts: false
    }
  ]
}

function selectForum(forum) {
  selectedForum.value = forum
  fetchDiscussions(forum.id)
}

function backToForums() {
  selectedForum.value = null
  discussions.value = []
}

function createDiscussion() {
  console.log('Создать новую дискуссию')
}

function openDiscussion(discussion) {
  console.log('Открыть дискуссию:', discussion.id)
}

function formatTimeAgo(dateString) {
  const now = new Date()
  const date = new Date(dateString)
  const diffHours = Math.floor((now - date) / (1000 * 60 * 60))
  
  if (diffHours < 1) return 'Меньше часа назад'
  if (diffHours < 24) return `${diffHours} ч назад`
  
  const diffDays = Math.floor(diffHours / 24)
  return `${diffDays} дн назад`
}

onMounted(fetchForums)
</script>

<template>
  <div class="forums-view">
    <!-- Список форумов -->
    <div v-if="!selectedForum">
      <div class="row mb-4">
        <div class="col-12">
          <h3 class="mb-3">Форумы</h3>
          <p class="text-muted">Обсуждайте материалы курсов и задавайте вопросы</p>
        </div>
      </div>

      <div v-if="loading" class="text-center py-5">
        <div class="spinner-border"></div>
      </div>

      <div v-else>
        <div v-for="forum in forums" :key="forum.id" class="card forum-card mb-4">
          <div class="card-body">
            <div class="row">
              <div class="col-lg-8">
                <div class="forum-info">
                  <h5 class="forum-title mb-2" @click="selectForum(forum)">
                    <MessageSquare :size="20" class="me-2 text-primary" />
                    {{ forum.title }}
                  </h5>
                  <p class="text-muted mb-2">{{ forum.description }}</p>
                  <small class="text-muted">Курс: {{ forum.course }}</small>
                </div>
              </div>
              
              <div class="col-lg-2 text-center">
                <div class="forum-stats">
                  <div class="stat-item">
                    <div class="fw-bold">{{ forum.topicsCount }}</div>
                    <small class="text-muted">Темы</small>
                  </div>
                  <div class="stat-item">
                    <div class="fw-bold">{{ forum.postsCount }}</div>
                    <small class="text-muted">Сообщения</small>
                  </div>
                </div>
              </div>
              
              <div class="col-lg-2">
                <div class="last-activity">
                  <small class="text-muted">Последняя активность:</small><br>
                  <small class="fw-bold">{{ formatTimeAgo(forum.lastActivity) }}</small><br>
                  <small class="text-muted">{{ forum.lastPost.author }}</small><br>
                  <small class="text-primary">{{ forum.lastPost.topic }}</small>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Дискуссии в форуме -->
    <div v-else>
      <div class="row mb-4">
        <div class="col-12">
          <div class="d-flex justify-content-between align-items-center flex-wrap gap-3">
            <div>
              <button @click="backToForums" class="btn btn-outline-secondary me-3">
                ← Назад к форумам
              </button>
              <h3 class="mb-0 d-inline">{{ selectedForum.title }}</h3>
            </div>
            <button @click="createDiscussion" class="btn btn-primary">
              <Plus :size="18" class="me-2" />
              Новая тема
            </button>
          </div>
        </div>
      </div>

      <div class="discussions-list">
        <div v-for="discussion in discussions" :key="discussion.id" class="card discussion-card mb-3">
          <div class="card-body">
            <div class="row align-items-center">
              <div class="col-lg-6">
                <div class="discussion-info">
                  <div class="d-flex align-items-center gap-2 mb-1">
                    <Pin v-if="discussion.isPinned" :size="16" class="text-warning" />
                    <h6 class="discussion-title mb-0" @click="openDiscussion(discussion)">
                      {{ discussion.title }}
                    </h6>
                    <span v-if="discussion.hasNewPosts" class="badge bg-primary">Новое</span>
                  </div>
                  <small class="text-muted">Автор: {{ discussion.author }}</small>
                </div>
              </div>
              
              <div class="col-lg-2 text-center">
                <div class="discussion-stats">
                  <div class="d-flex align-items-center justify-content-center gap-3">
                    <div class="stat-item">
                      <MessageCircle :size="16" class="text-muted" />
                      <span class="ms-1">{{ discussion.replies }}</span>
                    </div>
                    <div class="stat-item">
                      <Users :size="16" class="text-muted" />
                      <span class="ms-1">{{ discussion.views }}</span>
                    </div>
                  </div>
                </div>
              </div>
              
              <div class="col-lg-4 text-end">
                <div class="last-activity">
                  <small class="text-muted">{{ formatTimeAgo(discussion.lastActivity) }}</small>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.forum-card, .discussion-card {
  transition: box-shadow 0.2s;
  cursor: pointer;
}

.forum-card:hover, .discussion-card:hover {
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.forum-title, .discussion-title {
  cursor: pointer;
  transition: color 0.2s;
}

.forum-title:hover, .discussion-title:hover {
  color: var(--bs-primary) !important;
}

.forum-stats {
  display: flex;
  justify-content: space-around;
}

.stat-item {
  text-align: center;
}

.discussion-stats .stat-item {
  display: flex;
  align-items: center;
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